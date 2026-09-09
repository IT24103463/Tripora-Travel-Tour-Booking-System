# Tour Service Quick Start Guide

## Getting Started

### 1. Build the Service
```bash
cd Backend/Services/Tour/Tripora.TourService
dotnet build
```

### 2. Run the Service
```bash
dotnet run
```
The service will start on `http://localhost:5025`

### 3. Run Tests
```bash
cd Tripora.TourService.Tests
dotnet test
```

## API Usage Examples

### Create a Tour (Admin Only)
```bash
curl -X POST http://localhost:5025/api/tours \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "name": "European Adventure",
    "description": "Explore the beautiful cities of Europe",
    "destination": "Paris, France",
    "price": 2499.99,
    "durationDays": 14,
    "capacity": 30,
    "imageUrl": "https://example.com/tour-image.jpg"
  }'
```

### Get All Tours (Public)
```bash
curl http://localhost:5025/api/tours
```

### Get Active Tours (Public)
```bash
curl http://localhost:5025/api/tours/active
```

### Get Tour by ID (Public)
```bash
curl http://localhost:5025/api/tours/{tour-id}
```

### Update Tour (Admin Only)
```bash
curl -X PUT http://localhost:5025/api/tours/{tour-id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "name": "Updated European Adventure",
    "description": "Updated description",
    "destination": "Paris, France",
    "price": 2699.99,
    "durationDays": 14,
    "capacity": 35
  }'
```

### Delete Tour (Admin Only)
```bash
curl -X DELETE http://localhost:5025/api/tours/{tour-id} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN"
```

## Testing with Admin Token

### 1. Create Admin User in User Service
First, you need an admin user in the User Service. You can modify the User Service to create an admin user:

```csharp
// In UserService.cs, add a method to create admin users
public async Task<User> CreateAdminUserAsync(string email, string password, string fullName)
{
    var user = new User
    {
        Id = Guid.NewGuid(),
        FullName = fullName,
        Email = email.Trim().ToLowerInvariant(),
        PasswordHash = _passwordHasher.HashPassword(password),
        Role = "Admin", // Set role to Admin
        CreatedAt = DateTime.UtcNow
    };
    return await _userRepository.CreateAsync(user);
}
```

### 2. Get Admin JWT Token
```bash
curl -X POST http://localhost:5001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@tripora.com",
    "password": "AdminPassword123!"
  }'
```

### 3. Use Token in Tour Service Requests
Use the returned token in the `Authorization: Bearer YOUR_TOKEN` header.

## OpenAPI Documentation

When running in development mode, access the OpenAPI documentation:
```
http://localhost:5025/openapi/v1.json
```

## Database

The service uses SQLite with the file `tripora_tours.db` in the service directory. The database schema is automatically created on first run.

## Configuration

### JWT Settings
Ensure JWT settings match the User Service configuration in `appsettings.json`:

```json
{
  "JwtSettings": {
    "SecretKey": "Tripora_Super_Secret_Jwt_Security_Key_2026_Secure_Travel_System_!",
    "Issuer": "Tripora.UserService",
    "Audience": "Tripora.Client",
    "ExpiryMinutes": 120
  }
}
```

### CORS Settings
The service is configured to allow requests from:
- http://localhost:5173
- http://localhost:3000
- http://localhost:5000
- http://localhost:5292

## Common Issues

### 401 Unauthorized
- Ensure you're using a valid JWT token
- Check that the token hasn't expired
- Verify the token was issued by the User Service

### 403 Forbidden
- Ensure your user has the "Admin" role
- Check that the JWT token contains the correct role claim
- Verify the `[Authorize(Roles = "Admin")]` attribute is working

### 400 Bad Request
- Check validation error messages in response
- Ensure all required fields are provided
- Verify data meets validation requirements

### 404 Not Found
- Ensure the tour ID exists in the database
- Check that the tour hasn't been soft-deleted

## Next Steps

1. **Integrate with Frontend**: Create React components to display tours
2. **Add Booking Service**: Implement tour booking functionality
3. **Add Tour Categories**: Extend the data model for tour classifications
4. **Implement Search**: Add advanced search and filtering
5. **Add Reviews**: Implement customer review system

## Support

For detailed implementation information, see `TOUR_SERVICE_IMPLEMENTATION.md`
For test coverage details, see `TourManagementTests.cs`