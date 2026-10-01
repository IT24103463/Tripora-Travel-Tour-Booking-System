# Google OAuth Sign-In Design

## Purpose

Allow a customer to authenticate with a Google ID token and receive the same Tripora JWT used by password sign-in. Google-verified email identities bypass Tripora's email OTP flow.

## Configuration

The browser uses `VITE_GOOGLE_CLIENT_ID` from `Frontend/.env`; this value is public by OAuth design but must be the Google **Web application** client ID registered with the correct local and production origins.

The UserService reads `Authentication:Google:ClientId`, supplied locally with:

```powershell
dotnet user-secrets set "Authentication:Google:ClientId" "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
```

Production supplies the equivalent `Authentication__Google__ClientId` environment variable. `appsettings.json` contains an empty placeholder only; no real client ID or secret is stored in version control.

## Backend Flow

`POST /api/users/google-login` accepts `{ "idToken": "..." }`. The service validates the token with `Google.Apis.Auth`, restricting the audience to the configured client ID. A token is rejected if configuration is absent, validation fails, it has no email, or Google has not verified the email claim.

For a verified email, the backend normalizes it and looks up an existing user. It creates a new Customer with a generated password hash, verified-email status, and current UTC timestamps when no account exists. It upgrades an existing unverified Customer to verified. Existing non-Customer accounts are rejected rather than being elevated or repurposed. The endpoint issues the existing Tripora JWT and returns the established `ApiResponse<LoginResponseDto>` payload.

## Frontend Flow

`GoogleOAuthProvider` wraps the router using `VITE_GOOGLE_CLIENT_ID`. If the variable is absent, the Google control is not rendered and password authentication continues unchanged.

The customer sign-in card renders a dark-theme OR divider and Google button. On a credential response it posts the ID token through the existing API client, validates the returned Tripora JWT, and delegates to the existing `onLoginSuccess` callback. The existing app logic stores the token/user and redirects customers to `/`. Errors remain in the current accessible login alert.

## Testing and Failure Handling

Backend tests cover invalid or unverified Google identities, new Customer provisioning, unverified Customer upgrade, non-Customer rejection, and JWT payload shape. Frontend tests cover successful callback delegation, backend failure messaging, and absent configuration fallback. Build checks cover both projects.

The Google ID token is never persisted. Only the existing Tripora JWT is stored in browser storage.
