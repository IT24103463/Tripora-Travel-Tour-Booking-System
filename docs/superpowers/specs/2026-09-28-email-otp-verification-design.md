# Email OTP Verification Design

## Goal

Require customer email verification before a Tripora account can authenticate. Registration sends a six-digit OTP through Gmail SMTP using MailKit 4.18.1. Verification is completed in a Crystalline Obsidian React modal.

## Scope

- The backend service is `Backend/Services/Tripora.UserService`.
- The existing MySQL `Users` table gains verification state through a tracked EF Core migration.
- The frontend registration flow gains an OTP verification modal.
- Login does not issue a JWT for unverified accounts.

## Data Model

`User` gains these fields:

- `IsEmailVerified` (`bool`, default `false`)
- `VerificationTokenHash` (`string?`, max 64)
- `VerificationTokenExpiry` (`DateTime?`)
- `VerificationTokenLastSentAt` (`DateTime?`)

The migration initializes existing users as verified, preserving access for the existing seeded user and administrator. New registrations are unverified. The raw OTP is never saved; the service saves a SHA-256 hash and clears it after successful verification.

## Backend Flow

### Registration

1. Validate and create the user with a BCrypt password hash and `IsEmailVerified = false`.
2. Generate a cryptographically secure six-digit OTP.
3. Persist its SHA-256 hash, a ten-minute UTC expiry, and the send timestamp.
4. Send the code with an `IEmailVerificationSender` abstraction backed by MailKit.
5. Return a successful registration response indicating that verification is required. A mail-delivery failure returns a safe error without exposing credentials or OTPs.

### Verification and Resend

- `POST /api/users/verify-email` accepts email and a six-digit code. It validates the account, expiry, and hash, then marks the account verified and clears verification values.
- `POST /api/users/resend-verification` accepts email. It enforces a 60-second cooldown, regenerates verification values, and sends a new OTP.
- Invalid, expired, and superseded codes fail without revealing more account state than necessary.

### Login

The existing login service verifies credentials first. An otherwise-valid unverified account receives a distinct unverified status and no JWT. Verified accounts retain the current successful response shape.

## Email Configuration

An `EmailSettings` options class binds configuration with these development defaults:

- host: `smtp.gmail.com`
- port: `587`
- STARTTLS enabled

Credentials are provided at runtime using `EmailSettings__SenderEmail` and `EmailSettings__Password`. Configuration includes non-secret fallbacks only. Application logs must not contain SMTP passwords or OTP values.

## Frontend Flow

After registration succeeds, `RegisterForm` passes the submitted email to a new OTP modal owned by the auth view in `App`.

- Six single-character numeric fields support typing, backspace navigation, and pasting all six digits.
- The modal submits to `verify-email`, displays API errors inline, and dismisses only after successful verification or an explicit close action.
- Resend is disabled during the 60-second cooldown.
- Success returns the traveler to sign-in; tokens continue to be stored only after the normal login request succeeds.
- The modal uses existing dark glass styling, Plus Jakarta/Inter typography, and teal focus/selection accents. Backdrop and inner event handling prevent click leakage.

## Testing

Backend tests cover OTP persistence as a hash, expiry, single-use verification, login rejection before verification, resend cooldown, and MailKit sender interaction through its interface. React tests cover six-field navigation, full-code paste, verification submission, resend cooldown, API failures, and modal dismissal.

## Deployment

The EF migration is the source of schema change; no direct SQL is executed by this implementation. Deployment must set the Gmail sender and app password environment variables, apply the user-service migration, and restart the user service. Gmail requires an app password or compatible SMTP credentials.
