var builder = WebApplication.CreateBuilder(args);

// Dynamic port binding for Azure App Service Linux
var azurePort = Environment.GetEnvironmentVariable("PORT")
                ?? Environment.GetEnvironmentVariable("WEBSITES_PORT");

if (!string.IsNullOrEmpty(azurePort))
{
    builder.WebHost.UseUrls($"http://0.0.0.0:{azurePort}");
}

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
                "https://tripora-frontend-fbfbencjhpgvd9bx.eastasia-01.azurewebsites.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure YARP Reverse Proxy with valid timeout properties
builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"))
    .ConfigureHttpClient((context, handler) =>
    {
        handler.ConnectTimeout = TimeSpan.FromSeconds(60);
        handler.PooledConnectionIdleTimeout = TimeSpan.FromMinutes(2);
    });

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new
{
    service = "Tripora API Gateway",
    status = "Healthy"
}));

app.UseCors("AllowFrontend");
app.MapReverseProxy();

app.Run();