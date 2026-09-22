using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Security.Claims;
using System.Text;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Repositories;
using Tripora.DestinationService.Services;

var builder = WebApplication.CreateBuilder(args);

// Dynamic port binding for Azure App Service Linux
var port = Environment.GetEnvironmentVariable("PORT")
    ?? Environment.GetEnvironmentVariable("WEBSITES_PORT");
if (!string.IsNullOrWhiteSpace(port))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
}

// 1. Build Connection String with environment fallback
var mySqlConnection = builder.Configuration.GetConnectionString("MySqlConnection")
    ?? builder.Configuration.GetConnectionString("DefaultConnection");
var dbHost = Environment.GetEnvironmentVariable("TRIPORA_DB_HOST");
var dbPort = Environment.GetEnvironmentVariable("TRIPORA_DB_PORT") ?? "3306";
var dbName = Environment.GetEnvironmentVariable("TRIPORA_DB_NAME") ?? "tripora_db";
var dbUser = Environment.GetEnvironmentVariable("TRIPORA_DB_USER");
var dbPass = Environment.GetEnvironmentVariable("TRIPORA_DB_PASSWORD");

string connectionString;

if (!string.IsNullOrWhiteSpace(mySqlConnection) && !mySqlConnection.Contains("localhost"))
{
    connectionString = mySqlConnection;
}
else if (!string.IsNullOrWhiteSpace(dbHost))
{
    connectionString = $"Server={dbHost};Port={dbPort};Database={dbName};User={dbUser ?? "root"};Password={dbPass ?? ""};SslMode=Preferred;";
}
else
{
    connectionString = mySqlConnection ?? "Server=localhost;Port=3306;Database=tripora_db;User=root;Password=;";
}

// 2. Configure MySQL DbContext with Retries
builder.Services.AddDbContext<DestinationDbContext>(options =>
{
    options.UseMySQL(connectionString, mysqlOptions =>
    {
        mysqlOptions.MigrationsHistoryTable("__efmigrationshistory_tours");
        mysqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        );
    });
});

// 3. Register Services and Repositories (Only what exists in DestinationService)
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<IValidationService, ValidationService>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<IHotelService, HotelService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// 4. Configure CORS
// 4. Configure JWT Authentication & Authorization
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSection.GetValue<string>("SecretKey")
    ?? "Tripora_Super_Secret_Jwt_Security_Key_2026_Secure_Travel_System_!";
var issuer = jwtSection.GetValue<string>("Issuer") ?? "Tripora.UserService";
var audience = jwtSection.GetValue<string>("Audience") ?? "Tripora.Client";

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
        ClockSkew = TimeSpan.Zero,
        RoleClaimType = ClaimTypes.Role
    };
});

builder.Services.AddAuthorization();

// 5. Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "http://127.0.0.1:5174",
                "https://tripora-frontend-fbfbencjhpgvd9bx.eastasia-01.azurewebsites.net",
                "https://tripora-apigateway-dcg6cwa6f8gkg5hy.eastasia-01.azurewebsites.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

// 5. Safe Startup Migration (Will not crash the process if DB connection is delayed)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var context = services.GetRequiredService<DestinationDbContext>();
        logger.LogInformation("Applying migrations to Destination DB...");
        context.Database.Migrate();
        logger.LogInformation("Destination DB migrations completed successfully.");
    }
    catch (Exception ex) when (ex.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase) || 
                               ex.InnerException?.Message.Contains("already exists", StringComparison.OrdinalIgnoreCase) == true)
    {
        logger.LogWarning("One or more database tables already exist. Schema is already present or __EFMigrationsHistory is out of sync. Proceeding with existing schema.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Database migration failed during startup. The service will continue without applying migrations.");
    }
}

// 6. Health & Middleware Pipeline
app.MapGet("/health", () => Results.Ok(new
{
    service = "Tripora Destination Service",
    status = "Healthy"
}));

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();