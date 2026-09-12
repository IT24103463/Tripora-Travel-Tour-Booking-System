using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Polly;
using Polly.Extensions.Http;
using Tripora.BookingService.Clients;
using Tripora.BookingService.Data;
using Tripora.BookingService.Services;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// 1. DATABASE - SQLite (dedicated BookingService db)
// ============================================================
var connectionString = builder.Configuration.GetConnectionString("BookingDb")
    ?? "Data Source=tripora_booking.db";

builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseSqlite(connectionString));

// ============================================================
// 2. JWT AUTHENTICATION (same secret as UserService)
// ============================================================
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSection.GetValue<string>("SecretKey")
    ?? Environment.GetEnvironmentVariable("TRIPORA_JWT_SECRET")
    ?? "Tripora_Super_Secret_Jwt_Security_Key_2026_Secure_Travel_System_!";
var issuer  = jwtSection.GetValue<string>("Issuer")  ?? "Tripora.UserService";
var audience = jwtSection.GetValue<string>("Audience") ?? "Tripora.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme    = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ValidateIssuer   = true,  ValidIssuer   = issuer,
        ValidateAudience = true,  ValidAudience = audience,
        ValidateLifetime = true,
        ClockSkew        = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ============================================================
// 3. DESTINATION SERVICE HTTP CLIENT WITH POLLY
// ============================================================
var destinationServiceUrl = builder.Configuration["Services:DestinationServiceUrl"]
    ?? "http://localhost:5003/";

// Retry 3x on transient 5xx / network errors with exponential backoff
static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy() =>
    HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(3, attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)));

// Circuit break after 5 consecutive failures for 30 s
static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy() =>
    HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30));

builder.Services.AddHttpClient<IDestinationClient, DestinationClient>(client =>
{
    client.BaseAddress = new Uri(destinationServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(15);
})
.AddPolicyHandler(GetRetryPolicy())
.AddPolicyHandler(GetCircuitBreakerPolicy());

// ============================================================
// 4. APPLICATION SERVICES
// ============================================================
builder.Services.AddScoped<IBookingService, BookingService>();

// ============================================================
// 5. CONTROLLERS & CORS
// ============================================================
builder.Services.AddControllers();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:5174",
                "http://localhost:3000",
                "http://localhost:5000",
                "http://localhost:5292")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddOpenApi();

// ============================================================
// BUILD
// ============================================================
var app = builder.Build();

// Auto-migrate + create SQLite DB on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

// Expose for test host
public partial class Program { }
