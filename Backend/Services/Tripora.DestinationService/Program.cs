using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;

var builder = WebApplication.CreateBuilder(args);

// Explicitly bind port for Azure Linux App Service
var port = Environment.GetEnvironmentVariable("PORT") 
           ?? Environment.GetEnvironmentVariable("WEBSITES_PORT") 
           ?? "8080";
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

// Add controllers and endpoints
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// Build connection string with multi-tier fallback
var mySqlConnection = builder.Configuration.GetConnectionString("MySqlConnection") 
                      ?? builder.Configuration.GetConnectionString("DefaultConnection");

var dbHost = Environment.GetEnvironmentVariable("TRIPORA_DB_HOST");
var dbName = Environment.GetEnvironmentVariable("TRIPORA_DB_NAME") ?? "tripora_db";
var dbUser = Environment.GetEnvironmentVariable("TRIPORA_DB_USER");
var dbPass = Environment.GetEnvironmentVariable("TRIPORA_DB_PASSWORD");

string connectionString;

if (!string.IsNullOrWhiteSpace(mySqlConnection) && !mySqlConnection.Contains("localhost"))
{
    connectionString = mySqlConnection;
}
else if (!string.IsNullOrWhiteSpace(dbHost) && !string.IsNullOrWhiteSpace(dbUser))
{
    connectionString = $"Server={dbHost};Port=3306;Database={dbName};User={dbUser};Password={dbPass};SslMode=Preferred;";
}
else
{
    connectionString = mySqlConnection ?? "Server=localhost;Port=3306;Database=tripora_db;User=root;Password=;";
}

// Register EF Core DbContext
builder.Services.AddDbContext<DestinationDbContext>(options =>
{
    options.UseMySQL(connectionString);
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthorization();

// Health check endpoint for Azure ping and Gateway verification
app.MapGet("/health", () => Results.Ok(new 
{ 
    service = "Tripora Destination Service", 
    status = "Healthy", 
    timestamp = DateTime.UtcNow 
}));

app.MapControllers();

// Execute migrations safely without crashing startup if the DB is warming up
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<DestinationDbContext>();
        logger.LogInformation("Applying migrations to Destination DB...");
        db.Database.Migrate();
        logger.LogInformation("Destination DB migrations completed successfully.");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Failed to apply database migrations on startup. Continuing app launch...");
    }
}

app.Run();