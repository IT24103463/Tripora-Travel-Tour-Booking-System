using System;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using Tripora.PaymentService.Data;
using Tripora.PaymentService.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Database configuration (MySQL)
var connectionString = builder.Configuration.GetConnectionString("PaymentDb")
    ?? builder.Configuration.GetConnectionString("MySqlConnection")
    ?? "Server=localhost;Port=3306;Database=tripora_db;User=root;Password=12345;";

builder.Services.AddDbContext<PaymentDbContext>(options =>
    options.UseMySQL(connectionString, mysqlOptions =>
    {
        mysqlOptions.MigrationsHistoryTable("__efmigrationshistory_payments");
    }));

// BookingService client configuration
var bookingServiceUrl = builder.Configuration["Services:BookingServiceUrl"]
    ?? "http://localhost:5004/";

builder.Services.AddHttpClient<IBookingServiceClient, BookingServiceClient>(client =>
{
    client.BaseAddress = new Uri(bookingServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(15);
});

// Kafka Producer Service registration
builder.Services.AddSingleton<IKafkaProducerService, KafkaProducerService>();

// Register Transactional Outbox Background Worker
builder.Services.AddHostedService<OutboxPublisherWorker>();

// JWT Authentication
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSection.GetValue<string>("SecretKey")
    ?? Environment.GetEnvironmentVariable("TRIPORA_JWT_SECRET")
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
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// CORS
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

builder.Services.AddMassTransit(x =>
{
    x.UsingInMemory((context, cfg) =>
    {
        cfg.ConfigureEndpoints(context);
    });
});

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var app = builder.Build();

// Ensure MySQL database & tables are migrated
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();
    db.Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }