using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Tripora.UserService.Configuration;
using Tripora.UserService.Data;
using Tripora.UserService.Models;
using Tripora.UserService.Repositories;
using Tripora.UserService.Services;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
<<<<<<< Updated upstream
// 1. DATABASE - MySQL or SQLite Fallback
// ============================================================

var dbHost = Environment.GetEnvironmentVariable("TRIPORA_DB_HOST");
=======
// 1. DATABASE - MySQL
// ============================================================

var dbHost = Environment.GetEnvironmentVariable("TRIPORA_DB_HOST") ?? "localhost";
>>>>>>> Stashed changes
var dbPort = Environment.GetEnvironmentVariable("TRIPORA_DB_PORT") ?? "3306";
var dbName = Environment.GetEnvironmentVariable("TRIPORA_DB_NAME") ?? "tripora_user_db";
var dbUser = Environment.GetEnvironmentVariable("TRIPORA_DB_USER") ?? "root";
var dbPassword = Environment.GetEnvironmentVariable("TRIPORA_DB_PASSWORD") ?? "";

<<<<<<< Updated upstream
if (!string.IsNullOrWhiteSpace(dbHost))
{
    var mysqlConnStr = $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPassword};";
    builder.Services.AddDbContext<UserDbContext>(options => options.UseMySQL(mysqlConnStr));
}
else
{
    var sqliteConnStr = builder.Configuration.GetConnectionString("DefaultConnection") 
        ?? "Data Source=tripora_users.db";
    builder.Services.AddDbContext<UserDbContext>(options => options.UseSqlite(sqliteConnStr));
}
=======
var configuredConnectionString = builder.Configuration.GetConnectionString("MySqlConnection");
var hasDatabaseEnvironmentOverrides = new[]
{
    "TRIPORA_DB_HOST",
    "TRIPORA_DB_PORT",
    "TRIPORA_DB_NAME",
    "TRIPORA_DB_USER",
    "TRIPORA_DB_PASSWORD"
}.Any(variable => Environment.GetEnvironmentVariable(variable) is not null);
var mysqlConnStr = hasDatabaseEnvironmentOverrides
    ? $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPassword};"
    : configuredConnectionString
        ?? $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser};Password={dbPassword};";

builder.Services.AddDbContext<UserDbContext>(options => options.UseMySQL(mysqlConnStr));
>>>>>>> Stashed changes

// ============================================================
// 2. JWT CONFIGURATION
// ============================================================

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(JwtOptions.SectionName));

builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

var secretKey = Environment.GetEnvironmentVariable("TRIPORA_JWT_SECRET")
    ?? builder.Configuration.GetValue<string>("JwtSettings:SecretKey")
    ?? "Tripora_Super_Secret_Jwt_Security_Key_2026_Secure_Travel_System_!";

var issuer = Environment.GetEnvironmentVariable("TRIPORA_JWT_ISSUER")
    ?? "Tripora.UserService";

var audience = Environment.GetEnvironmentVariable("TRIPORA_JWT_AUDIENCE")
    ?? "Tripora.Client";

// ============================================================
// 3. APPLICATION SERVICES AND REPOSITORIES
// ============================================================

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddSingleton<IValidationService, ValidationService>();
builder.Services.AddScoped<IUserService, UserService>();

// ============================================================
// 4. AUTHENTICATION - JWT
// ============================================================

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer = true,
        ValidIssuer = issuer,
        ValidateAudience = true,
        ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ============================================================
// 5. CONTROLLERS
// ============================================================

builder.Services.AddControllers();

// ============================================================
// 6. CORS - ALLOW FRONTEND
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "http://localhost:5000",
                "http://localhost:5292")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// ============================================================
// 7. OPENAPI
// ============================================================

builder.Services.AddOpenApi();

// ============================================================
// BUILD APPLICATION
// ============================================================

var app = builder.Build();

// Ensure DB Created & Seed Test Users
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    dbContext.Database.EnsureCreated();

    var passwordHasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher>();
<<<<<<< Updated upstream
=======

>>>>>>> Stashed changes
    if (!dbContext.Users.Any(u => u.Email == "user1@gmail.com"))
    {
        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "User One",
            Email = "user1@gmail.com",
            PasswordHash = passwordHasher.HashPassword("user1@gmail.com"),
            Role = "Customer",
            CreatedAt = DateTime.UtcNow
        });
<<<<<<< Updated upstream
        dbContext.SaveChanges();
    }
=======
    }

    if (!dbContext.Users.Any(u => u.Email == "admin@tripora.com"))
    {
        dbContext.Users.Add(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Tripora Admin",
            Email = "admin@tripora.com",
            PasswordHash = passwordHasher.HashPassword("AdminPassword123!"),
            Role = "Admin",
            CreatedAt = DateTime.UtcNow
        });
    }

    dbContext.SaveChanges();
>>>>>>> Stashed changes
}

// ============================================================
// HTTP REQUEST PIPELINE
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();