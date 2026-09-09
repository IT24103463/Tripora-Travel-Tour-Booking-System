# Token Expiration Testing Plan

## Implementation Summary

The following token expiration handling has been implemented to address the missing functionality:

### 1. Token Expiration Detection (`App.jsx`)
- Added `isTokenExpired()` function that decodes JWT and checks expiration
- Function includes a 30-second buffer for safety
- Checks token expiration on app initialization
- Periodic check every 30 seconds while authenticated

### 2. Automatic Session Management
- Automatically clears expired tokens from localStorage
- Triggers automatic logout when token expires
- Sets `sessionExpired` state to show user-friendly message
- Redirects to login tab with expiration alert

### 3. User Experience Improvements
- Added session expired alert banner with clear messaging
- Token status indicator in CustomerDashboard shows:
  - ✅ Valid token (green)
  - ⏰ Expiring soon (yellow, < 5 minutes)
  - ⚠️ Expired token (red)
- Shows remaining time until expiration

### 4. API Request Handling
- CustomerDashboard checks token expiration before API calls
- Handles 401 responses by triggering session expiration
- LoginForm validates received tokens aren't already expired

## Testing Instructions

### 1. Unit Testing (Token Logic)
Open `test-token-expiration.html` in a browser to verify the `isTokenExpired` function logic:
- Tests null/empty tokens
- Tests malformed tokens
- Tests expired tokens
- Tests valid tokens
- Tests buffer behavior (30 seconds)

### 2. Integration Testing
1. Start the backend server (`dotnet run` in UserService directory)
2. Start the frontend dev server (`npm run dev` in frontend directory)
3. Register a new account
4. Log in successfully
5. Wait for token to expire (default: 120 minutes, or modify `JwtOptions.ExpiryMinutes` to test faster)
6. Verify automatic logout occurs
7. Verify session expired message appears
8. Verify redirect to login form

### 3. Manual Testing - Quick Expiration
For faster testing, temporarily modify the backend JWT configuration:
```csharp
// In JwtOptions.cs or appsettings.json
public int ExpiryMinutes { get; set; } = 1; // Set to 1 minute for testing
```

Then:
1. Log in
2. Wait 1 minute
3. Verify automatic logout and session expired message

### 4. API Request Testing
1. Log in and get a valid token
2. Use CustomerDashboard's "Test Authorized Access" button
3. Verify successful access (200 OK)
4. Wait for token to expire
5. Try "Test Authorized Access" again
6. Verify 401 handling and session expiration trigger

### 5. Token Status Indicator Testing
1. Log in and navigate to CustomerDashboard
2. Verify token status shows "Valid Token" (green)
3. Wait until token is < 5 minutes from expiration
4. Verify status changes to "Expires in X minute(s)" (yellow)
5. Wait for expiration
6. Verify status shows "Token Expired" (red)

## Files Modified

1. **Frontend/tripora-frontend/src/App.jsx**
   - Added `isTokenExpired()` function (exported)
   - Added token expiration checking on initialization
   - Added periodic expiration check (30-second interval)
   - Added `sessionExpired` state and alert banner
   - Added `handleSessionExpired()` function
   - Passed `onSessionExpired` to CustomerDashboard

2. **Frontend/tripora-frontend/src/components/CustomerDashboard.jsx**
   - Imported `isTokenExpired` function
   - Added `onSessionExpired` prop
   - Added token expiration check before API calls
   - Added 401 response handling
   - Added token status indicator (valid/warning/expired)
   - Added token expiration time display

3. **Frontend/tripora-frontend/src/components/CustomerDashboard.css**
   - Added styles for token status indicator
   - Added colors for valid/warning/expired states
   - Added dark mode support

4. **Frontend/tripora-frontend/src/components/LoginForm.jsx**
   - Imported `isTokenExpired` function
   - Added validation for received tokens on login

## Acceptance Criteria Coverage

✅ **Expired or invalid token → Prevent access to protected resources**
- Token expiration checked before API calls
- 401 responses trigger session expiration
- Expired tokens cleared from localStorage
- User redirected to login with clear message
- Automatic logout on token expiration

## Additional Improvements (Optional)

For production deployment, consider:
1. Implementing refresh tokens for better UX
2. Adding token refresh logic before expiration
3. Implementing silent token renewal
4. Adding countdown timer to session expired alert
5. Implementing "Keep me signed in" functionality