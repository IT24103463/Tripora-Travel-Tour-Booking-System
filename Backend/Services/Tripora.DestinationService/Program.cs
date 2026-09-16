using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Repositories;
using Tripora.DestinationService.Services;

var builder = WebApplication.CreateBuilder(args);

// Dynamic port binding for Azure App Service Linux
var port = Environment.GetEnvironmentVariable("PORT") ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// 1. Build Connection String with environment fallback
var defaultConnection = builder.Configuration.GetConnectionString("DefaultConnection");
var dbHost = Environment.GetEnvironmentVariable("TRIPORA_DB_HOST");
var dbName = Environment.GetEnvironmentVariable("TRIPORA_DB_NAME") ?? "tripora_db";
var dbUser = Environment.GetEnvironmentVariable("TRIPORA_DB_USER");
var dbPass = Environment.GetEnvironmentVariable("TRIPORA_DB_PASSWORD");

string connectionString;

if (!string.IsNullOrWhiteSpace(defaultConnection) && !defaultConnection.Contains("localhost"))
{
    connectionString = defaultConnection;
}
else if (!string.IsNullOrWhiteSpace(dbHost) && !string.IsNullOrWhiteSpace(dbUser))
{
    connectionString = $"Server={dbHost};Port=3306;Database={dbName};Uid={dbUser};Pwd={dbPass};SslMode=Preferred;";
}
else
{
    connectionString = defaultConnection ?? "Server=localhost;Port=3306;Database=tripora_db;Uid=root;Pwd=root;";
}

// 2. Configure MySQL DbContext with Retries
builder.Services.AddDbContext<DestinationDbContext>(options =>
{
    options.UseMySQL(connectionString, mysqlOptions =>
    {
        mysqlOptions.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorNumbersToAdd: null
        );
    });
});

// 3. Register Repositories and Services
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<IHotelRepository, HotelRepository>();
builder.Services.AddScoped<ITourService, TourService>();
builder.Services.AddScoped<IHotelService, HotelService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 4. Configure CORS
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
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migration failed during startup. Service will keep running.");
    }
}

// 6. Health & Pipeline
app.MapGet("/health", () => Results.Ok(new
{
    service = "Tripora Destination Service",
    status = "Healthy"
}));

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("AllowFrontend");
app.UseAuthorization();
app.MapControllers();

app.Run();