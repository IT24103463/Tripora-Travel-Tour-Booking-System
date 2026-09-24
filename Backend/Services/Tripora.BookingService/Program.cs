using System;
using System.Net.Http;
using System.Text;
using MassTransit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using MySql.EntityFrameworkCore.Extensions;
using Polly;
using Polly.Extensions.Http;
using Tripora.BookingService.Clients;
using Tripora.BookingService.Data;
using Tripora.BookingService.Services;

var builder = WebApplication.CreateBuilder(args);

// Database configuration (MySQL)
var connectionString = builder.Configuration.GetConnectionString("BookingDb")
    ?? builder.Configuration.GetConnectionString("MySqlConnection")
    ?? "Server=localhost;Port=3306;Database=tripora_db;User=root;Password=12345;";

builder.Services.AddDbContext<BookingDbContext>(options =>
    options.UseMySQL(connectionString, mysqlOptions =>
    {
        mysqlOptions.MigrationsHistoryTable("__efmigrationshistory_bookings");
    }));

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

// DestinationService HTTP Client with Resilience Policies
var rawDestUrl = builder.Configuration["Services:DestinationServiceUrl"] 
                 ?? builder.Configuration["DestinationServiceUrl"];

if (string.IsNullOrWhiteSpace(rawDestUrl))
{
    rawDestUrl = "https://tripora-destination-abb0g5a5hzatakhy.eastasia-01.azurewebsites.net/";
}

if (!rawDestUrl.StartsWith("http://", StringComparison.OrdinalIgnoreCase) && !rawDestUrl.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
{
    rawDestUrl = "https://" + rawDestUrl;
}

var destinationServiceUrl = rawDestUrl.TrimEnd('/') + "/";
var destinationServiceApiKey = builder.Configuration["Services:DestinationServiceApiKey"] ?? "tripora-booking-inventory-2026";

static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy() =>
    HttpPolicyExtensions
        .HandleTransientHttpError()
        .WaitAndRetryAsync(3, attempt => TimeSpan.FromSeconds(Math.Pow(2, attempt)));

static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy() =>
    HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30));

builder.Services.AddHttpClient<IDestinationClient, DestinationClient>(client =>
{
    client.BaseAddress = new Uri(destinationServiceUrl);
    client.DefaultRequestHeaders.Add("X-Internal-Service-Key", destinationServiceApiKey);
    client.Timeout = TimeSpan.FromSeconds(15);
})
.AddPolicyHandler(GetRetryPolicy())
.AddPolicyHandler(GetCircuitBreakerPolicy());

builder.Services.AddScoped<IBookingService, BookingService>();

// Register Kafka Producer & Background Consumer Services
builder.Services.AddSingleton<IKafkaProducerService, KafkaProducerService>();
builder.Services.AddHostedService<KafkaBookingConsumerService>();
builder.Services.AddHostedService<OutboxPublisherWorker>();

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

builder.Services.AddMassTransit(x =>
{
    x.AddConsumer<Tripora.BookingService.Consumers.PaymentSuccessfulConsumer>();
    x.AddConsumer<Tripora.BookingService.Consumers.PaymentFailedConsumer>();

    x.UsingInMemory((context, cfg) =>
    {
        cfg.ConfigureEndpoints(context);
    });
});

var app = builder.Build();
app.UseDeveloperExceptionPage();

// Database migrations
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
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
