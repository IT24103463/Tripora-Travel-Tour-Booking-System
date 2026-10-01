# Google OAuth Sign-In Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let verified Google identities sign in as Tripora Customers and receive the normal Tripora JWT without email OTP.

**Architecture:** The UserService validates the browser-supplied Google ID token against a configured OAuth audience, performs Customer-only account provisioning/verification, and delegates JWT creation to the existing token generator. React renders Google’s hosted credential control only when its public client ID is configured and sends the credential through the normal API boundary.

**Tech Stack:** ASP.NET Core 10, Entity Framework Core, Google.Apis.Auth, React 19, Vite, @react-oauth/google, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-28-google-oauth-design.md`

## Global Constraints

- Do not commit a Google client ID, client secret, real token, or user-secret value.
- Frontend configuration uses `VITE_GOOGLE_CLIENT_ID`; server configuration uses `Authentication__Google__ClientId` / .NET User Secrets.
- Only Google identities with a verified email may authenticate.
- Only Customer accounts may be auto-provisioned or upgraded through Google sign-in.
- Reuse the existing Tripora JWT response contract and keep all work uncommitted.

## Review Focus

- Missing client ID: Google UI is omitted and backend returns a safe configuration failure.
- Token issued for a different OAuth audience: backend rejects it before any database change.
- Google email unverified or absent: backend rejects it before any database change.
- Existing Admin identity sharing the email: backend rejects the Google sign-in and preserves role.
- Existing unverified Customer: backend verifies the user and returns a valid Tripora JWT.

---

### Task 1: Secure server configuration and Google authentication domain service

**Files:**
- Modify: `Backend/Services/Tripora.UserService/Tripora.UserService.csproj`
- Modify: `Backend/Services/Tripora.UserService/appsettings.json`
- Create: `Backend/Services/Tripora.UserService/Configuration/GoogleAuthenticationOptions.cs`
- Create: `Backend/Services/Tripora.UserService/DTOs/GoogleLoginRequestDto.cs`
- Create: `Backend/Services/Tripora.UserService/Services/GoogleAuthenticationService.cs`
- Create: `Backend/Services/Tripora.UserService/Services/IGoogleAuthenticationService.cs`
- Test: `Backend/Services/Tripora.UserService.Tests/GoogleAuthenticationServiceTests.cs`

**Interfaces:**
- Consumes: `UserDbContext`, `IPasswordHasher`, `IJwtTokenGenerator`, `JwtOptions`.
- Produces: `Task<GoogleLoginResult> GoogleLoginAsync(GoogleLoginRequestDto request, CancellationToken cancellationToken = default)`.

- [ ] **Step 1: Write failing service tests**

Test a valid verified Google identity creates a Customer, an existing unverified Customer becomes verified, a non-Customer is rejected, and missing/unverified identities do not alter persistence.

- [ ] **Step 2: Run the UserService test project to verify it fails**

Run: `dotnet test Backend/Services/Tripora.UserService.Tests/Tripora.UserService.Tests.csproj --filter GoogleAuthenticationServiceTests`

Expected: FAIL because Google authentication types and service do not exist.

- [ ] **Step 3: Implement token validation and Customer-only provisioning**

Add `Google.Apis.Auth`; bind `Authentication:Google` with a blank `ClientId` placeholder in `appsettings.json`. Validate with `GoogleJsonWebSignature` against that configured audience, require verified email, generate a random password before hashing for new records, and use `IJwtTokenGenerator.GenerateToken(User)` for success.

- [ ] **Step 4: Run the UserService service tests**

Run: `dotnet test Backend/Services/Tripora.UserService.Tests/Tripora.UserService.Tests.csproj --filter GoogleAuthenticationServiceTests`

Expected: PASS.

### Task 2: Expose the Google login API contract

**Files:**
- Modify: `Backend/Services/Tripora.UserService/Controllers/UsersController.cs`
- Modify: `Backend/Services/Tripora.UserService/Program.cs`
- Test: `Backend/Services/Tripora.UserService.Tests/UsersControllerGoogleLoginTests.cs`

**Interfaces:**
- Consumes: `IGoogleAuthenticationService.GoogleLoginAsync`.
- Produces: `POST /api/users/google-login`, returning `ApiResponse<LoginResponseDto>` on success.

- [ ] **Step 1: Write failing controller tests**

Assert valid credentials return the same wrapped login payload as password login, while invalid token, unverified email, forbidden role, and unavailable configuration return non-success statuses without a JWT.

- [ ] **Step 2: Run controller tests to verify they fail**

Run: `dotnet test Backend/Services/Tripora.UserService.Tests/Tripora.UserService.Tests.csproj --filter UsersControllerGoogleLoginTests`

Expected: FAIL because `/api/users/google-login` is not registered.

- [ ] **Step 3: Add the controller endpoint and dependency registration**

Inject `IGoogleAuthenticationService` into `UsersController`, map its explicit result statuses to 200/400/401/403/503 responses, and register the service in `Program.cs`.

- [ ] **Step 4: Run controller tests and build UserService**

Run: `dotnet test Backend/Services/Tripora.UserService.Tests/Tripora.UserService.Tests.csproj --filter UsersControllerGoogleLoginTests; dotnet build Backend/Services/Tripora.UserService/Tripora.UserService.csproj`

Expected: PASS and build succeeds.

### Task 3: Add configured Google credential UI to customer sign-in

**Files:**
- Modify: `Frontend/package.json`
- Modify: `Frontend/src/main.jsx`
- Modify: `Frontend/src/components/LoginForm.jsx`
- Modify: `Frontend/src/components/LoginForm.css`
- Create: `Frontend/.env.example`
- Test: `Frontend/src/components/LoginForm.test.jsx`

**Interfaces:**
- Consumes: `VITE_GOOGLE_CLIENT_ID`, `POST /api/users/google-login`, existing `onLoginSuccess(token, user)`.
- Produces: configured Google sign-in control, accessible error feedback, and normal app login success handoff.

- [ ] **Step 1: Write failing frontend tests**

Mock the hosted Google credential component at its package boundary. Assert a credential posts `{ idToken }`, success calls `onLoginSuccess` with the wrapped Tripora JWT/user, a non-success response appears in the current alert, and no Google control renders without `VITE_GOOGLE_CLIENT_ID`.

- [ ] **Step 2: Run LoginForm tests to verify they fail**

Run: `npx vitest run src/components/LoginForm.test.jsx`

Expected: FAIL because Google sign-in is absent.

- [ ] **Step 3: Implement client configuration and sign-in handoff**

Install `@react-oauth/google`, conditionally wrap the router in `GoogleOAuthProvider`, add `.env.example` with an empty `VITE_GOOGLE_CLIENT_ID`, and add Google callback/error handling to `LoginForm`. Use `api.post('/users/google-login', { idToken: credential })`, validate the returned Tripora token with `isTokenExpired`, and call `onLoginSuccess`.

- [ ] **Step 4: Style the divider and Google control shell**

Use existing dark form surfaces for a labeled OR divider and reserve the provider-rendered button in a pill-compatible, keyboard-accessible container.

- [ ] **Step 5: Run frontend tests and production build**

Run: `npx vitest run src/components/LoginForm.test.jsx; npm run build`

Expected: PASS and production build succeeds.

### Task 4: End-to-end regression verification and operator setup

**Files:**
- Modify: `Backend/Services/Tripora.UserService/Tripora.UserService.http`
- Modify: `README.md` or existing setup documentation, if present

**Interfaces:**
- Consumes: final endpoint and environment variables from Tasks 1–3.
- Produces: operator instructions for user secrets, environment variables, and Google authorized origins.

- [ ] **Step 1: Add an operator setup section**

Document the exact `dotnet user-secrets set` command, `VITE_GOOGLE_CLIENT_ID` example, and the need to register local/production origins in Google Cloud Console without writing real values.

- [ ] **Step 2: Run complete verification**

Run: `dotnet test Backend/Services/Tripora.UserService.Tests/Tripora.UserService.Tests.csproj; npm run build; npx vitest run`

Expected: new Google coverage passes; any existing unrelated frontend failures are named explicitly.
