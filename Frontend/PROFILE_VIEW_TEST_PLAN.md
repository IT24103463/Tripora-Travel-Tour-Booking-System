# Profile View Feature Test Plan

## Implementation Summary

The profile viewing feature has been implemented according to the user story requirements:

### 1. Profile Information Display
- ✅ Full Name display
- ✅ Email Address display
- ✅ Account ID display
- ✅ Account Type/Role display
- ✅ Member Since date display

### 2. Authentication Security
- ✅ Profile only accessible to authenticated customers
- ✅ Token validation before profile access
- ✅ Automatic session expiration handling
- ✅ 401 Unauthorized handling
- ✅ JWT token-based authentication

### 3. User Data Privacy
- ✅ Customer can only view their own profile information
- ✅ Profile retrieved from User Service via `/api/users/me` endpoint
- ✅ Backend ensures user can only access their own data via JWT claims

### 4. Error Handling
- ✅ Not authenticated → Authentication required error
- ✅ Profile does not exist → 404 error with appropriate message
- ✅ Profile retrieval fails → Network error with retry option
- ✅ Session expired → Automatic redirect to login

## Files Created/Modified

### New Files
1. **Frontend/tripora-frontend/src/components/ProfileView.jsx**
   - Profile display component with authentication checks
   - API integration with `/api/users/me` endpoint
   - Error handling and retry functionality
   - Loading states and user feedback

2. **Frontend/tripora-frontend/src/components/ProfileView.css**
   - Profile component styling
   - Responsive design
   - Dark mode support
   - Loading and error state styling

### Modified Files
1. **Frontend/tripora-frontend/src/App.jsx**
   - Added ProfileView import
   - Added currentView state ('dashboard' | 'profile')
   - Added navigation buttons for Dashboard/Profile switching
   - Conditional rendering based on currentView

2. **Frontend/tripora-frontend/src/App.css**
   - Added nav-view-buttons styling
   - Added nav-view-btn styling with active states
   - Dark mode support for navigation buttons

## Acceptance Criteria Coverage

### Scenario 1 – View Profile ✅
**Given** the customer is authenticated  
**When** the customer opens the profile  
**Then** the customer's profile information shall be displayed.

**Implementation:**
- ProfileView component fetches data from `/api/users/me` endpoint
- Displays Full Name, Email, Account ID, Role, and Member Since date
- Requires valid JWT token for access
- Shows loading state while fetching data

### Scenario 2 – Unauthorized Access ✅
**Given** the customer is not authenticated  
**When** the customer attempts to access the profile  
**Then** access shall be denied.

**Implementation:**
- ProfileView checks for token presence before making API calls
- If no token, displays "Authentication required" error
- Navigation buttons only shown when user is authenticated
- Cannot access profile view without logging in

### Scenario 3 – Correct User Information ✅
**Given** the customer is authenticated  
**When** the profile is retrieved  
**Then** only the authenticated customer's information shall be displayed.

**Implementation:**
- Backend `/api/users/me` endpoint uses JWT claims to identify user
- Backend extracts user ID from JWT token and returns only that user's data
- Frontend has no ability to request other users' profiles
- ProfileView only displays data returned for the authenticated user

### Scenario 4 – Profile Retrieval Failure ✅
**Given** the User Service cannot retrieve the profile  
**When** the customer requests the profile  
**Then** an appropriate error shall be displayed.

**Implementation:**
- Network errors: "Unable to connect to the server" with retry button
- 404 errors: "Profile not found" with retry button
- 401 errors: Triggers session expiration handling
- Generic errors: "Failed to retrieve profile information" with retry button
- All error states include retry functionality

## Testing Instructions

### 1. Integration Testing

**Prerequisites:**
- Backend User Service running on `http://localhost:5001`
- Frontend dev server running

**Test Steps:**

#### Scenario 1 - View Profile (Authenticated User)
1. Register a new account or log in with existing credentials
2. Navigate to the authenticated dashboard
3. Click the "Profile" button in the navigation
4. Verify the profile page loads successfully
5. Verify the following information is displayed:
   - Full Name (from registration)
   - Email Address (from registration)
   - Account ID (GUID)
   - Account Type (Customer)
   - Member Since date
6. Verify "Refresh Profile" button works

#### Scenario 2 - Unauthorized Access (Not Authenticated)
1. Log out of the application
2. Try to access profile directly (if possible via URL manipulation)
3. Verify authentication error is displayed
4. Verify user is redirected to login
5. Verify navigation buttons don't show Profile option

#### Scenario 3 - Correct User Information
1. Log in as User A
2. Navigate to Profile
3. Verify only User A's information is displayed
4. Log out and log in as User B
5. Navigate to Profile
6. Verify only User B's information is displayed
7. Verify no cross-contamination of user data

#### Scenario 4 - Profile Retrieval Failure
1. Log in with valid credentials
2. Navigate to Profile
3. While profile is loading, stop the backend server
4. Verify network error is displayed
5. Click "Try Again" button
6. Restart backend server
7. Click "Try Again" again
8. Verify profile loads successfully

### 2. Session Expiration Testing
1. Log in successfully
2. Navigate to Profile
3. Wait for token to expire (or modify JWT expiration to 1 minute for testing)
4. Try to refresh profile or navigate away and back
5. Verify session expired message appears
6. Verify automatic redirect to login
7. Verify profile is inaccessible with expired token

### 3. Navigation Testing
1. Log in successfully
2. Verify both "Dashboard" and "Profile" buttons are visible
3. Click "Dashboard" - verify dashboard is shown
4. Click "Profile" - verify profile is shown
5. Click "Dashboard" again - verify dashboard is shown
6. Verify active state styling works correctly

### 4. Error State Testing
1. Log in successfully
2. Modify the API endpoint to an invalid URL in ProfileView.jsx temporarily
3. Navigate to Profile
4. Verify error state is displayed
5. Verify retry button is present
6. Restore correct endpoint
7. Click retry button
8. Verify profile loads successfully

## API Endpoint Details

**Endpoint:** `GET /api/users/me`  
**Authentication:** JWT Bearer Token required  
**Response Format:**
```json
{
  "success": true,
  "message": "Customer profile retrieved successfully.",
  "data": {
    "id": "guid",
    "fullName": "string",
    "email": "string",
    "role": "string",
    "createdAt": "datetime"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token
- `404 Not Found` - User account not found
- `500 Internal Server Error` - Server error

## Security Considerations

1. **Authentication Required:** Profile cannot be accessed without valid JWT token
2. **User Isolation:** Backend ensures users can only access their own data
3. **Token Validation:** Frontend validates token expiration before API calls
4. **Session Management:** Automatic logout on token expiration
5. **Error Handling:** Appropriate error messages without exposing sensitive information

## Future Enhancements

The profile view provides a foundation for:
- Profile editing functionality
- Profile picture upload
- Password change functionality
- Account settings management
- Travel preferences
- Booking history integration