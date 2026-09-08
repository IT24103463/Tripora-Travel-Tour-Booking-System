# MySQL Migration Guide for Tripora System

## Overview
This guide provides step-by-step instructions to convert the Tripora system from SQLite to MySQL database.

## Prerequisites
- MySQL Server installed and running
- MySQL credentials: root/Nesanda123
- .NET 10.0 SDK

## SQL Database Creation Scripts

### 1. Create User Database
Run this SQL in your MySQL client:

```sql
-- Create Tripora User Database
CREATE DATABASE IF NOT EXISTS tripora_users CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE tripora_users;

-- Create Users table
CREATE TABLE IF NOT EXISTS Users (
    Id CHAR(36) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(256) NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(50) NOT NULL DEFAULT 'Customer',
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL,
    INDEX IX_Users_Email (Email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 2. Create Tour Database
Run this SQL in your MySQL client:

```sql
-- Create Tripora Tour Database
CREATE DATABASE IF NOT EXISTS tripora_tours CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE tripora_tours;

-- Create Tours table
CREATE TABLE IF NOT EXISTS Tours (
    Id CHAR(36) PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Description NVARCHAR(2000) NOT NULL,
    Destination NVARCHAR(200) NOT NULL,
    Price DECIMAL(18,2) NOT NULL,
    DurationDays INT NOT NULL,
    Capacity INT NOT NULL,
    AvailableSlots INT NOT NULL,
    IsActive BOOLEAN NOT NULL DEFAULT TRUE,
    ImageUrl NVARCHAR(500) NULL,
    CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt DATETIME NULL,
    DeletedAt DATETIME NULL,
    INDEX IX_Tours_Destination (Destination),
    INDEX IX_Tours_IsActive (IsActive),
    INDEX IX_Tours_Price (Price)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## Code Changes Summary

### Modified Files
1. **Backend/Services/User/Tripora.UserService/Tripora.UserService.csproj**
   - Replaced `Microsoft.EntityFrameworkCore.Sqlite` with `MySql.EntityFrameworkCore`

2. **Backend/Services/Tour/Tripora.TourService/Tripora.TourService.csproj**
   - Replaced `Microsoft.EntityFrameworkCore.Sqlite` with `MySql.EntityFrameworkCore`

3. **Backend/Services/User/Tripora.UserService/Program.cs**
   - Changed connection string to MySQL format
   - Added `UseMySql` with server version
   - Added Pomelo namespace

4. **Backend/Services/Tour/Tripora.TourService/Program.cs**
   - Changed connection string to MySQL format
   - Added `UseMySql` with server version
   - Added Pomelo namespace

5. **Backend/Services/User/Tripora.UserService/Data/UserDbContext.cs**
   - Updated default value to `CURRENT_TIMESTAMP`
   - Added max length for PasswordHash

6. **Backend/Services/Tour/Tripora.TourService/Data/TourDbContext.cs**
   - Updated default value to `CURRENT_TIMESTAMP`

7. **Backend/Services/User/Tripora.UserService/Models/User.cs**
   - Changed Id from `Guid` to `string`

8. **Backend/Services/Tour/Tripora.TourService/Models/Tour.cs**
   - Changed Id from `Guid` to `string`

9. **Backend/Services/User/Tripora.UserService/DTOs/UserResponseDto.cs**
   - Changed Id from `Guid` to `string`

10. **Backend/Services/Tour/Tripora.TourService/DTOs/TourResponseDto.cs**
    - Changed Id from `Guid` to `string`

11. **Backend/Services/User/Tripora.UserService/Repositories/IUserRepository.cs**
    - Changed method signatures from `Guid` to `string`

12. **Backend/Services/User/Tripora.UserService/Repositories/UserRepository.cs**
    - Updated method signatures to use `string` Id

13. **Backend/Services/Tour/Tripora.TourService/Repositories/ITourRepository.cs**
    - Changed method signatures from `Guid` to `string`

14. **Backend/Services/Tour/Tripora.TourService/Repositories/TourRepository.cs**
    - Updated method signatures to use `string` Id

15. **Backend/Services/User/Tripora.UserService/Services/UserService.cs**
    - Changed Id generation to `Guid.NewGuid().ToString()`
    - Updated method signatures to use `string` Id

16. **Backend/Services/User/Tripora.UserService/Services/IUserService.cs**
    - Changed method signatures from `Guid` to `string`

17. **Backend/Services/User/Tripora.UserService/Services/UserService.cs**
    - Updated method signatures to use `string` Id

18. **Backend/Services/User/Tripora.UserService/Services/JwtTokenGenerator.cs**
    - Updated JWT claims to use string Id

19. **Backend/Services/User/Tripora.UserService/Controllers/UsersController.cs**
    - Removed Guid parsing from GetCurrentUserProfile
    - Updated to use string Id directly

20. **Backend/Services/Tour/Tripora.TourService/Services/ITourService.cs**
    - Changed method signatures from `Guid` to `string`

21. **Backend/Services/Tour/Tripora.TourService/Services/TourService.cs**
    - Updated method signatures to use `string` Id

22. **Backend/Services/Tour/Tripora.TourService/Controllers/ToursController.cs**
    - Changed method signatures from `Guid` to `string`

## Connection String Configuration

### User Service (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=tripora_users;User=root;Password=Nesanda123;"
  }
}
```

### Tour Service (appsettings.json)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=tripora_tours;User=root;Password=Nesanda123;"
  }
}
```

## Migration Steps

### 1. Run SQL Scripts
Execute the SQL scripts in your MySQL client to create the databases and tables.

### 2. Update NuGet Packages
The project files have been updated to use MySQL packages. Restore packages:
```bash
cd Backend/Services/User/Tripora.UserService
dotnet restore

cd Backend/Services/Tour/Tripora.TourService
dotnet restore
```

### 3. Update Connection Strings
Update `appsettings.json` files in both services with your MySQL credentials.

### 4. Restart Services
Stop any running services and restart them:
```bash
cd Backend/Services/User/Tripora.UserService
dotnet run

cd Backend/Services/Tour/Tripora.TourService
dotnet run
```

## Key Changes

### Primary Key Types
- Changed from `Guid` to `string` (CHAR(36) in MySQL)
- UUIDs stored as strings for MySQL compatibility
- All ID comparisons use string equality

### Default Values
- Changed from SQLite's `datetime('now')` to MySQL's `CURRENT_TIMESTAMP`
- Updated database context accordingly

### Password Hash Length
- Added explicit max length for PasswordHash field (255)

## Testing

### Test User Service
1. Start User Service
2. Try to register a new user
3. Verify user is created in MySQL `tripora_users` database
4. Try to login with the created user

### Test Tour Service
1. Start Tour Service
2. Create a tour (requires admin user)
3. Verify tour is created in MySQL `tripora_tours` database
4. Try to retrieve tours via API

## Troubleshooting

### Connection Issues
- Verify MySQL server is running
- Check credentials (root/Nesanda123)
- Ensure MySQL allows remote connections
- Check firewall settings

### Package Issues
- Ensure MySQL package is installed: `MySql.EntityFrameworkCore`
- Run `dotnet restore` if package errors occur

### Character Encoding
- Ensure databases use utf8mb4 for proper character support
- Tables created with appropriate character sets

## Benefits of MySQL Migration

1. **Production Ready**: MySQL is better suited for production environments
2. **Performance**: Better performance for larger datasets
3. **Scalability**: MySQL can handle more concurrent connections
4. **Features**: More advanced features (triggers, stored procedures, etc.)
5. **Tooling**: Better tooling and monitoring options
6. **Backup**: More robust backup and recovery options

## Rollback Plan

If you need to rollback to SQLite:
1. Revert the project file changes
2. Remove MySQL packages
3. Restore SQLite packages
4. Revert connection strings
5. Delete MySQL databases (optional)

The SQLite database files (`tripora_users.db` and `tripora_tours.db`) will still exist and can be used for rollback.