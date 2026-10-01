# Email OTP Verification Implementation Plan

> **For implementation:** Execute this plan using the `superpowers:executing-plans` skill, one task at a time.

**Goal:** Require customers to verify their email with a securely generated six-digit one-time code before a JWT can be issued, while providing a branded React verification modal and Gmail SMTP delivery for local development.

**Architecture:** The User Service persists only a SHA-256 hash of a cryptographically generated six-digit code, its UTC expiry, and the last-send time. Registration creates an unverified account and sends a code; verification and resend endpoints handle the remaining lifecycle. The React application opens a shared glass OTP modal after registration or an unverified login response. SMTP is isolated behind an interface so business rules remain unit-testable without a network service.

**Tech stack:** ASP.NET Core/.NET 10, EF Core/MySQL, MailKit 4.18.1, React, Vite, Vitest, Testing Library.

## Confirmed behaviour and guardrails

- An OTP is exactly six decimal digits, generated with `RandomNumberGenerator`, valid for ten minutes, and stored only as a hash.
- A resend is permitted once per 60 seconds. A resend replaces the previous hash and expiry, invalidating any earlier code.
- Existing records receive `IsEmailVerified = true` through the EF migration so the new gate does not lock out already-created users.
- Registration persists an unverified account before attempting delivery. If delivery fails, the response must clearly say the account exists but the user should retry delivery through the verification screen; do not create duplicate accounts.
- Login checks a valid password before returning the explicit `EMAIL_NOT_VERIFIED` response. It must not issue a JWT for an unverified account.
- SMTP defaults are non-secret development settings only. `EmailSettings__SenderEmail` and `EmailSettings__Password` take precedence at runtime. Passwords, raw OTP values, connection strings, and authorization headers must never be logged or committed.
- Gmail delivery uses `smtp.gmail.com`, port `587`, and `SecureSocketOptions.StartTls`. The Gmail password must be an app password.
- API responses do not disclose whether an arbitrary address exists during resend. Known-but-unverified accounts can receive a code; unknown or verified addresses receive a generic accepted response.

## File map

| Area | Files |
| --- | --- |
| Persistence | `Models/User.cs`, `Data/UserDbContext.cs`, generated migration and model snapshot |
| Configuration and delivery | `appsettings.json`, `Program.cs`, `Configuration/EmailSettings.cs`, `Services/IEmailVerificationSender.cs`, `Services/GmailEmailVerificationSender.cs`, `Services/IClock.cs`, `Services/SystemClock.cs` |
| User workflow | `DTOs/VerifyEmailRequestDto.cs`, `DTOs/ResendVerificationRequestDto.cs`, response DTOs, `Services/IUserService.cs`, `Services/UserService.cs`, `Repositories/IUserRepository.cs`, `Repositories/UserRepository.cs`, `Controllers/UsersController.cs` |
| React modal | `Frontend/src/components/EmailVerificationModal.jsx`, `Frontend/src/components/EmailVerificationModal.css` |
| React integration | `Frontend/src/components/RegisterForm.jsx`, `Frontend/src/components/LoginForm.jsx`, `Frontend/src/App.jsx` |
| Tests | `Backend/Services/Tripora.UserService.Tests/*`, `Frontend/src/components/EmailVerificationModal.test.jsx`, relevant login/register tests |

## Task 1: Add verification persistence, clock, and SMTP delivery boundary

**Files:**
- Modify: `Backend/Services/Tripora.UserService/Models/User.cs`
- Modify: `Backend/Services/Tripora.UserService/Data/UserDbContext.cs`
- Modify: `Backend/Services/Tripora.UserService/Program.cs`
- Modify: `Backend/Services/Tripora.UserService/appsettings.json`
- Create: `Backend/Services/Tripora.UserService/Configuration/EmailSettings.cs`
- Create: `Backend/Services/Tripora.UserService/Services/IClock.cs`
- Create: `Backend/Services/Tripora.UserService/Services/SystemClock.cs`
- Create: `Backend/Services/Tripora.UserService/Services/IEmailVerificationSender.cs`
- Create: `Backend/Services/Tripora.UserService/Services/GmailEmailVerificationSender.cs`
- Create: generated `Backend/Services/Tripora.UserService/Migrations/<timestamp>_AddEmailVerificationFields.cs`
- Modify: generated migration designer and `UserDbContextModelSnapshot.cs`

1. Add these nullable/required fields to `User`: `IsEmailVerified` (bool, default false), `VerificationTokenHash` (nullable string, maximum 64), `VerificationTokenExpiry` (nullable UTC `DateTime`), and `VerificationTokenLastSentAt` (nullable UTC `DateTime`). Configure exact column names, lengths, and default value in the context.
2. Create a tracked migration named `AddEmailVerificationFields`. Its `Up` method must add the four columns and execute a migration-scoped update that marks existing rows verified. Its `Down` method removes only these new columns. Do not modify a historical migration and do not issue ad-hoc SQL against a database.
3. Add an `EmailSettings` options class with `Host`, `Port`, `SenderEmail`, `Password`, `SenderName`, and `UseStartTls`. Add non-secret Gmail host/port/name defaults under `EmailSettings` in `appsettings.json`; leave sender address/password blank or use clearly non-functional placeholders, never real secrets.
4. Bind `EmailSettings` in `Program.cs`, register `IClock` as `SystemClock`, and register `IEmailVerificationSender` as the MailKit implementation. Configuration providers must retain normal ASP.NET Core precedence, allowing `EmailSettings__SenderEmail` and `EmailSettings__Password` environment variables to override JSON.
5. Implement the sender with `MimeMessage` and `MailKit.Net.Smtp.SmtpClient`: validate required sender credentials before connecting; connect to configured host/port with `SecureSocketOptions.StartTls`; authenticate; send a concise Tripora verification message containing the code and ten-minute expiry; then disconnect in a `finally` block. The sender must throw a safe exception to its caller without writing OTPs or credentials to logs.
6. Create the migration through EF tooling and inspect it before applying it anywhere. Verify the migration carries no table recreation or destructive operation.

**Verification:**

```powershell
dotnet build Backend/Services/Tripora.UserService/Tripora.UserService.csproj
dotnet ef migrations script --project Backend/Services/Tripora.UserService/Tripora.UserService.csproj --startup-project Backend/Services/Tripora.UserService/Tripora.UserService.csproj
```

Confirm the generated script adds verification columns and updates existing users, without recreating `Users`.

**Commit:** `feat(auth): add persisted email verification and smtp delivery boundary`

## Task 2: Implement secure verification, resend, and login-gating service logic

**Files:**
- Modify: `Backend/Services/Tripora.UserService/Repositories/IUserRepository.cs`
- Modify: `Backend/Services/Tripora.UserService/Repositories/UserRepository.cs`
- Modify: `Backend/Services/Tripora.UserService/Services/IUserService.cs`
- Modify: `Backend/Services/Tripora.UserService/Services/UserService.cs`
- Create: `Backend/Services/Tripora.UserService/DTOs/VerifyEmailRequestDto.cs`
- Create: `Backend/Services/Tripora.UserService/DTOs/ResendVerificationRequestDto.cs`
- Create/modify: verification response DTO and status/result types adjacent to current user service DTOs
- Create/modify tests under `Backend/Services/Tripora.UserService.Tests/`

1. Extend the repository with a tracked update method that persists verification field changes without replacing unrelated user fields. Preserve its existing asynchronous and cancellation-token conventions.
2. Add request validation: normalized email is required and valid; a verification code must match `^\\d{6}$` after trimming. Create explicit service result states for verified, invalid code, expired code, already verified, resend cooldown, delivery failure, validation error, and server error. Keep error messages safe and actionable.
3. Inject `IEmailVerificationSender` and `IClock` into `UserService`. Add private helpers which:
   - generate `RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6")`;
   - hash `${normalizedEmail}:${code}` using SHA-256;
   - compare hashes with `CryptographicOperations.FixedTimeEquals`;
   - clear hash/expiry/last-send fields once verification succeeds.
4. Change registration to persist the user unverified with a hash, ten-minute expiry, and send timestamp, then send the raw code only to the delivery interface. Map successful registration to a response that includes the normalized email and `verificationRequired: true`. If delivery fails after persistence, return a distinct response that permits the frontend to open the verification modal and retry sending, rather than misleading the client that registration did not occur.
5. Add `VerifyEmailAsync`: load the account, reject invalid/expired/missing code appropriately, compare the supplied code in constant time, mark verified, clear transient fields, and persist. No JWT is created by this endpoint.
6. Add `ResendVerificationAsync`: use an account-agnostic accepted response for unknown/already-verified emails; for a known unverified user enforce the 60-second cooldown, generate and persist a fresh hash/expiry before sending, and return the next resend availability on successful delivery. If SMTP fails, return a safe delivery-failure result while preserving a usable verification state.
7. In `LoginAsync`, after password validation and before JWT generation, return `EmailNotVerified` with the normalized email for unverified users. Preserve existing auth status behavior for unknown users and invalid passwords.
8. Write unit tests first or alongside each behavior using the existing in-memory test setup, a fake `IClock`, and a fake `IEmailVerificationSender`. Tests must cover: registration stores no raw code; valid code verifies and clears state; wrong code is rejected; expired code is rejected; resend before 60 seconds is rejected; resend invalidates the previous code; a verified login returns JWT; an unverified correct-password login returns the verification-required state; and an SMTP failure does not mark the account verified.

**Verification:**

```powershell
dotnet test Backend/Services/Tripora.UserService.Tests/Tripora.UserService.Tests.csproj
dotnet build Backend/Services/Tripora.UserService/Tripora.UserService.csproj
```

**Commit:** `feat(auth): require and manage hashed email otp verification`

## Task 3: Expose public verification and resend API endpoints

**Files:**
- Modify: `Backend/Services/Tripora.UserService/Controllers/UsersController.cs`
- Modify/add controller tests under `Backend/Services/Tripora.UserService.Tests/`

1. Add `POST /api/users/verify-email` accepting `VerifyEmailRequestDto`. Map validation errors to 400, invalid/missing codes to 400 or 401 consistently with the project's established API envelope, expired codes to 410, and successful verification to 200.
2. Add `POST /api/users/resend-verification` accepting `ResendVerificationRequestDto`. Return 202 for generic accepted/queued resend outcomes and 429 with a `retryAfterSeconds` value for a known cooldown. Map configuration/delivery failures to 503 without revealing secrets.
3. Update registration and login controller mappings so registration exposes `verificationRequired` and email; unverified login uses 403 plus a predictable `EMAIL_NOT_VERIFIED` code and normalized email. Do not emit JWTs or raw codes in any response.
4. Add controller-level tests for status/envelope mappings, especially 403 login gating, successful verification, expired verification, 429 cooldown, and generic resend behavior for unknown accounts.

**Verification:**

```powershell
dotnet test Backend/Services/Tripora.UserService.Tests/Tripora.UserService.Tests.csproj
```

**Commit:** `feat(auth): expose email verification lifecycle endpoints`

## Task 4: Build the crystalline six-digit verification modal

**Files:**
- Create: `Frontend/src/components/EmailVerificationModal.jsx`
- Create: `Frontend/src/components/EmailVerificationModal.css`
- Create: `Frontend/src/components/EmailVerificationModal.test.jsx`

1. Build a controlled six-input OTP dialog taking `email`, `onVerified`, and `onClose`. Auto-focus the first field on open; accept numeric keystrokes only; advance after each digit; handle Backspace to move backwards; and distribute a six-digit paste across all boxes. Provide an accessible dialog role, visible title, labels/instructions, and Escape/close behavior.
2. Assemble the code and submit `POST /users/verify-email` through the existing centralized API client. Show an inline invalid/expired/server error; do not close the modal until verification succeeds. On success, call `onVerified` with the verified email.
3. Add resend handling for `POST /users/resend-verification`, with a client countdown based on server-provided retry information. During the 60-second cooldown disable the resend button and display the remaining time. Treat generic 202 as a confirmation without exposing account state.
4. Style the modal with the application's Crystalline Obsidian visual language: dark translucent backdrop, specular top edge, teal focus/selected state, responsive layout, 44px OTP tiles, clear error states, and `Plus Jakarta Sans`/`Inter` sans-serif typography. Stop propagation inside the dialog and only close on an actual backdrop click to avoid modal leakage.
5. Add Vitest/Testing Library coverage for six-digit input assembly, paste distribution, successful verification callback, invalid-code feedback, resend cooldown disabling, and close/backdrop propagation behavior. Mock the centralized client; tests must not call Gmail or a real API.

**Verification:**

```powershell
npx vitest run Frontend/src/components/EmailVerificationModal.test.jsx
npm run build
```

**Commit:** `feat(frontend): add glass email verification otp modal`

## Task 5: Integrate verification into registration, login, and route state

**Files:**
- Modify: `Frontend/src/components/RegisterForm.jsx`
- Modify: `Frontend/src/components/LoginForm.jsx`
- Modify: `Frontend/src/App.jsx`
- Modify/add: focused frontend auth integration tests

1. Have `App` own pending-verification email/modal state. Render the modal at the application shell level so it is available from both registration and login, while retaining current routing and authentication ownership.
2. On a successful registration response with `verificationRequired`, open the modal for the returned normalized email instead of presenting a final account-created state. If the server reports delivery failure after persistence, retain/open the same modal and show the user how to resend; do not encourage a duplicate registration.
3. In `LoginForm`, detect only the explicit 403 `EMAIL_NOT_VERIFIED` response. Open the verification modal with its returned email; preserve all other login errors and successful-login navigation.
4. On modal verification success, close it, switch/navigate to the existing login experience, and prefill the verified email if the existing form supports it. Do not automatically create a session; the user signs in normally after verification.
5. Add tests that registration opens verification for an accepted account, unverified login opens it on 403, verified login keeps current success behavior, and unrelated login failures do not show the modal.

**Verification:**

```powershell
npx vitest run
npm run build
dotnet test Backend/Services/Tripora.UserService.Tests/Tripora.UserService.Tests.csproj
```

**Commit:** `feat(auth): connect registration and login to email verification`

## Final verification checklist

1. Set local, non-committed environment values before manual SMTP testing:

```powershell
$env:EmailSettings__SenderEmail = 'your-gmail-address@gmail.com'
$env:EmailSettings__Password = 'your-gmail-app-password'
```

2. Apply the tracked migration only to the intended local/development database after inspecting the generated SQL:

```powershell
dotnet ef database update --project Backend/Services/Tripora.UserService/Tripora.UserService.csproj --startup-project Backend/Services/Tripora.UserService/Tripora.UserService.csproj
```

3. Manual acceptance sequence: register a fresh address; receive exactly one six-digit email; confirm wrong and expired codes fail; resend after the countdown; ensure the first code fails after resend; verify the latest code; then log in and receive a JWT. Confirm an existing account can still sign in because the migration marked it verified.
4. Run the complete backend/frontend test suite and production frontend build. Inspect `git diff` for credentials, raw codes, unrelated generated changes, or migration drift before review.
