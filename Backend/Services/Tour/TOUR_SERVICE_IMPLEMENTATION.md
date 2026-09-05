# Tour Service Implementation Documentation

## Overview

The Tour Service is a microservice that manages tour information for the Tripora Travel & Tour Booking System. It provides comprehensive functionality for administrators to manage travel packages and for customers to access available tour information.

## Architecture

### Technology Stack
- **Framework**: ASP.NET Core 10.0
- **Database**: SQLite with Entity Framework Core
- **Authentication**: JWT Bearer Token Authentication
- **Authorization**: Role-based (Admin only for management operations)
- **API Documentation**: OpenAPI/Swagger

### Service Configuration
- **Port**: 5025 (http://localhost:5025)
- **Database**: SQLite (tripora_tours.db)
- **CORS**: Configured for frontend access (localhost:5173, 3000, 5000, 5292)

## Data Model

### Tour Entity
```csharp
public class Tour
{
    public Guid Id { get; set; }              // Unique identifier
    public string Name { get; set; }          // Tour name (max 200 chars)
    public string Description { get; set; }   // Tour description (max 2000 chars)
    public string Destination { get; set; }    // Destination (max 200 chars)
    public decimal Price { get; set; }         // Tour price (18,2 precision)
    public int DurationDays { get; set; }      // Duration in days
    public int Capacity { get; set; }          // Total capacity
    public int AvailableSlots { get; set; }   // Available booking slots
    public bool IsActive { get; set; }        // Active status
    public string? ImageUrl { get; set; }      // Optional image URL (max 500 chars)
    public DateTime CreatedAt { get; set; }    // Creation timestamp
    public DateTime? UpdatedAt { get; set; }   // Last update timestamp
    public DateTime? DeletedAt { get; set; }   // Soft delete timestamp
}
```

## API Endpoints

### Public Endpoints (No Authentication Required)

#### GET /api/tours
Retrieves all tours (including inactive ones)
- **Response**: `ApiResponse<List<TourResponseDto>>`
- **Status Codes**: 200 OK, 500 Internal Server Error

#### GET /api/tours/active
Retrieves only active tours
- **Response**: `ApiResponse<List<TourResponseDto>>`
- **Status Codes**: 200 OK, 500 Internal Server Error

#### GET /api/tours/{id}
Retrieves a specific tour by ID
- **Parameters**: `id` (Guid)
- **Response**: `ApiResponse<TourResponseDto>`
- **Status Codes**: 200 OK, 404 Not Found, 500 Internal Server Error

### Admin Endpoints (Require Admin Role + JWT Token)

#### POST /api/tours
Creates a new tour
- **Request Body**: `CreateTourRequestDto`
- **Response**: `ApiResponse<TourResponseDto>`
- **Status Codes**: 201 Created, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 500 Internal Server Error

#### PUT /api/tours/{id}
Updates an existing tour
- **Parameters**: `id` (Guid)
- **Request Body**: `CreateTourRequestDto`
- **Response**: `ApiResponse<TourResponseDto>`
- **Status Codes**: 200 OK, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

#### DELETE /api/tours/{id}
Deletes a tour (soft delete)
- **Parameters**: `id` (Guid)
- **Response**: `ApiResponse<TourResponseDto>`
- **Status Codes**: 200 OK, 401 Unauthorized, 403 Forbidden, 404 Not Found, 500 Internal Server Error

## Request/Response DTOs

### CreateTourRequestDto
```csharp
public class CreateTourRequestDto
{
    public string Name { get; set; }           // Required, 3-200 chars
    public string Description { get; set; }    // Required, 10-2000 chars
    public string Destination { get; set; }    // Required, 2-200 chars
    public decimal Price { get; set; }         // Required, > 0, max 1,000,000
    public int DurationDays { get; set; }     // Required, 1-365 days
    public int Capacity { get; set; }         // Required, 1-1000 people
    public string? ImageUrl { get; set; }      // Optional, valid HTTP/HTTPS URL, max 500 chars
}
```

### TourResponseDto
```csharp
public class TourResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public string Destination { get; set; }
    public decimal Price { get; set; }
    public int DurationDays { get; set; }
    public int Capacity { get; set; }
    public int AvailableSlots { get; set; }
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
```

### ApiResponse<T>
```csharp
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; }
    public T? Data { get; set; }
    public List<string> Errors { get; set; }
}
```

## Validation Rules

### Tour Name
- Required field
- Minimum 3 characters
- Maximum 200 characters

### Description
- Required field
- Minimum 10 characters
- Maximum 2000 characters

### Destination
- Required field
- Minimum 2 characters
- Maximum 200 characters

### Price
- Required field
- Must be greater than zero
- Maximum value: $1,000,000

### Duration
- Required field
- Minimum 1 day
- Maximum 365 days

### Capacity
- Required field
- Minimum 1 person
- Maximum 1000 people

### Image URL (Optional)
- Maximum 500 characters
- Must be valid HTTP or HTTPS URL

## Authentication & Authorization

### JWT Configuration
The Tour Service uses the same JWT configuration as the User Service for token validation:

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

### Authorization Rules
- **Public Endpoints**: No authentication required
- **Admin Endpoints**: 
  - Requires valid JWT token
  - User must have "Admin" role in token claims
  - Returns 403 Forbidden for non-admin users

## Security Features

1. **Role-Based Access Control**: Admin-only operations protected by `[Authorize(Roles = "Admin")]`
2. **JWT Token Validation**: All admin endpoints validate JWT tokens
3. **Input Validation**: Comprehensive validation for all tour data
4. **SQL Injection Protection**: Entity Framework parameterized queries
5. **CORS Configuration**: Restricted to allowed frontend origins
6. **Soft Delete**: Tours are soft-deleted to preserve data integrity

## Error Handling

### Validation Errors (400 Bad Request)
```json
{
  "success": false,
  "message": "Invalid tour information provided.",
  "data": null,
  "errors": [
    "Tour Name must be at least 3 characters.",
    "Description is required."
  ]
}
```

### Not Found Errors (404 Not Found)
```json
{
  "success": false,
  "message": "Tour not found.",
  "data": null,
  "errors": ["Tour not found."]
}
```

### Unauthorized Errors (401/403)
```json
{
  "success": false,
  "message": "Unauthorized access.",
  "data": null,
  "errors": ["Unauthorized access."]
}
```

### Server Errors (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Tour operation failed.",
  "data": null,
  "errors": ["Failed to create tour. Please try again."]
}
```

## Database Schema

### Tours Table
- **Primary Key**: Id (Guid)
- **Indexes**: Destination, IsActive, Price
- **Soft Delete**: DeletedAt timestamp (filtered in queries)
- **Constraints**: All required fields have NOT NULL constraints

## Service Components

### Repository Layer
- `ITourRepository`: Interface for data access
- `TourRepository`: SQLite implementation with soft delete support

### Service Layer
- `ITourService`: Business logic interface
- `TourService`: Business logic implementation with validation

### Validation Layer
- `IValidationService`: Validation interface
- `ValidationService`: Comprehensive tour data validation

### Controller Layer
- `ToursController`: REST API endpoints with authorization

## Testing

### Test Coverage
The service includes comprehensive unit tests covering:
- Scenario 1: Successful tour creation
- Scenario 2: Invalid tour validation
- Scenario 3: Tour retrieval (all, active, by ID)
- Scenario 4: Unauthorized access prevention
- Scenario 5: API endpoint functionality
- Additional: Update, delete, and availability preservation

### Running Tests
```bash
cd Backend/Services/Tour/Tripora.TourService.Tests
dotnet test
```

## Deployment

### Prerequisites
- .NET 10.0 Runtime
- SQLite database file creation permissions
- JWT secret key configuration

### Configuration Files
- `appsettings.json`: Production configuration
- `appsettings.Development.json`: Development configuration
- `Properties/launchSettings.json`: Launch profile configuration

### Environment Variables
- `ASPNETCORE_ENVIRONMENT`: Development/Production
- `ConnectionStrings__DefaultConnection`: Database connection string
- `JwtSettings__SecretKey`: JWT signing key

## Integration with Other Services

### User Service Integration
- Shares JWT configuration for token validation
- Admin role validation against User Service tokens
- Cross-service authentication consistency

### Future Integrations
- **Booking Service**: Will use tour availability data
- **Payment Service**: Will use tour pricing information
- **Notification Service**: Will use tour information for alerts

## Business Logic Features

### Availability Management
- Initial availability equals capacity on creation
- Availability preserved during tour updates
- Separate from capacity for booking tracking

### Soft Delete Implementation
- Tours marked as deleted rather than physically removed
- Deleted tours excluded from queries
- Preserves historical data and relationships

### Active/Inactive Status
- Independent of delete status
- Allows temporary tour deactivation
- Filtered in public "active tours" endpoint

## Monitoring & Logging

### Logging Levels
- Information: API requests, successful operations
- Warning: Validation failures, not found scenarios
- Error: Database errors, unexpected exceptions

### Log Examples
```
[Information] Received tour creation request for: European Adventure
[Information] Tour created successfully: {TourId} - European Adventure
[Warning] Tour creation failed validation for tour: Invalid Tour
[Error] Error creating tour: European Adventure
```

## Performance Considerations

### Database Indexing
- Indexed fields: Destination, IsActive, Price
- Optimized for common query patterns
- Supports efficient filtering and sorting

### Caching Strategy
- Currently no caching implemented
- Future: Consider Redis for tour data caching
- Cache invalidation on tour updates

### Pagination
- Current implementation returns all tours
- Future: Add pagination for large datasets
- Recommended page size: 20-50 tours

## Future Enhancements

### Planned Features
1. **Tour Categories**: Add category/classification system
2. **Tour Itineraries**: Detailed day-by-day schedules
3. **Tour Reviews**: Customer rating and review system
4. **Tour Images**: Multiple image upload support
5. **Tour Availability**: Real-time availability tracking
6. **Tour Search**: Advanced search and filtering
7. **Tour Recommendations**: Personalized tour suggestions
8. **Tour Analytics**: Usage statistics and reporting

### API Enhancements
1. **Pagination**: Add page size and page number parameters
2. **Sorting**: Add sort by field and direction parameters
3. **Filtering**: Add advanced filtering options
4. **Bulk Operations**: Batch create/update/delete tours
5. **Versioning**: API versioning for backward compatibility

## Maintenance

### Database Maintenance
- Regular backup of SQLite database file
- Index rebuild for performance optimization
- Cleanup of soft-deleted records (archive policy)

### Configuration Management
- Rotate JWT secret keys periodically
- Update CORS origins as needed
- Monitor and adjust logging levels

### Monitoring
- Track API response times
- Monitor error rates
- Alert on authentication failures
- Track tour creation/update metrics

## Support & Troubleshooting

### Common Issues

#### Service Won't Start
- Check .NET runtime installation
- Verify database file permissions
- Validate configuration file syntax

#### Authentication Failures
- Verify JWT configuration matches User Service
- Check token expiration
- Validate role claims in token

#### Database Errors
- Ensure SQLite database file exists
- Check connection string configuration
- Verify database schema is current

#### CORS Issues
- Verify frontend origin in CORS policy
- Check HTTPS vs HTTP protocol matching
- Ensure preflight requests handled

## Contact & Support

For issues or questions about the Tour Service:
- Check implementation documentation
- Review test cases for usage examples
- Consult API documentation via OpenAPI endpoint
- Contact development team for critical issues