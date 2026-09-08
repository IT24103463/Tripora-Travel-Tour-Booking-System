using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Tripora.UserService.Configuration;
using Tripora.UserService.Data;
using Tripora.UserService.Repositories;
using Tripora.UserService.Services;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// 1. DATABASE - MySQL
// ============================================================

// Read database settings from environment variables
var dbHost = Environment.GetEnvironmentVariable("TRIPORA_DB_HOST")
    ?? throw new InvalidOperationException(
        "TRIPORA_DB_HOST environment variable is not configured.");

var dbPort = Environment.GetEnvironmentVariable("TRIPORA_DB_PORT")
    ?? "3306";

var dbName = Environment.GetEnvironmentVariable("TRIPORA_DB_NAME")
    ?? throw new InvalidOperationException(
        "TRIPORA_DB_NAME environment variable is not configured.");

var dbUser = Environment.GetEnvironmentVariable("TRIPORA_DB_USER")
    ?? throw new InvalidOperationException(
        "TRIPORA_DB_USER environment variable is not configured.");

var dbPassword = Environment.GetEnvironmentVariable("TRIPORA_DB_PASSWORD")
    ?? throw new InvalidOperationException(
        "TRIPORA_DB_PASSWORD environment variable is not configured.");

var connectionString =
    $"Server={dbHost};" +
    $"Port={dbPort};" +
    $"Database={dbName};" +
    $"User={dbUser};" +
    $"Password={dbPassword};";

builder.Services.AddDbContext<UserDbContext>(options =>
{
    options.UseMySQL(connectionString);
});


// ============================================================
// 2. JWT CONFIGURATION
// ============================================================

builder.Services.Configure<JwtOptions>(
    builder.Configuration.GetSection(JwtOptions.SectionName));

builder.Services.AddSingleton<IJwtTokenGenerator, JwtTokenGenerator>();

var secretKey = Environment.GetEnvironmentVariable("TRIPORA_JWT_SECRET")
    ?? throw new InvalidOperationException(
        "TRIPORA_JWT_SECRET environment variable is not configured.");

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
    options.DefaultAuthenticateScheme =
        JwtBearerDefaults.AuthenticationScheme;

    options.DefaultChallengeScheme =
        JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;

    options.SaveToken = true;

    options.TokenValidationParameters =
        new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,

            IssuerSigningKey =
                new SymmetricSecurityKey(
                    Encoding.UTF8.GetBytes(secretKey)),

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