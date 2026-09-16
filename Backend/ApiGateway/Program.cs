var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:5173",
                "http://localhost:3000",
                "http://127.0.0.1:5173",
                "https://tripora-frontend-fbfbencjhpgvd9bx.eastasia-01.azurewebsites.net"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services
    .AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();

app.MapGet("/health", () => Results.Ok(new
{
    service = "Tripora API Gateway",
    status = "Healthy"
}));

app.UseCors("AllowFrontend");
app.MapReverseProxy();

app.Run();