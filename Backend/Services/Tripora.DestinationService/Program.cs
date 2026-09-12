using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Repositories;
using Tripora.DestinationService.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add database context (MySQL)
var connectionString = builder.Configuration.GetConnectionString("MySqlConnection") 
    ?? "Server=localhost;Port=3306;Database=tripora_db;User=root;Password=;";
var databasePassword = Environment.GetEnvironmentVariable("TRIPORA_DB_PASSWORD");
if (databasePassword is not null)
{
    var connectionStringBuilder = new MySqlConnectionStringBuilder(connectionString)
    {
        Password = databasePassword
    };
    connectionString = connectionStringBuilder.ConnectionString;
}
builder.Services.AddDbContext<DestinationDbContext>(options =>
    options.UseMySQL(connectionString, x => x.MigrationsHistoryTable("__EFMigrationsHistory_Tours")));

// 2. Configure JWT options (same as User Service for token validation)
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSection.GetValue<string>("SecretKey") 
    ?? "Tripora_Super_Secret_Jwt_Security_Key_2026_Secure_Travel_System_!";
var issuer = jwtSection.GetValue<string>("Issuer") ?? "Tripora.UserService";
var audience = jwtSection.GetValue<string>("Audience") ?? "Tripora.Client";

// 3. Configure Authentication & JWT Bearer
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

// 4. Register application services and repositories
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddSingleton<IValidationService, ValidationService>();
builder.Services.AddScoped<ITourService, TourService>();

// 5. Register controllers
builder.Services.AddControllers();

// 6. Configure CORS for frontend access
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173", 
                "http://localhost:3000", 
                "http://localhost:5000",
                "http://localhost:5292")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// 7. Configure OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Ensure the MySQL database schema is created on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<DestinationDbContext>();
    dbContext.Database.Migrate();
}

// Configure HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();