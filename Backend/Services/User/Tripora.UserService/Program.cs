using Microsoft.EntityFrameworkCore;
using Tripora.UserService.Data;
using Tripora.UserService.Repositories;
using Tripora.UserService.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Add database context (SQLite)
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Data Source=tripora_users.db";
builder.Services.AddDbContext<UserDbContext>(options =>
    options.UseSqlite(connectionString));

// 2. Register application services and repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddSingleton<IPasswordHasher, BcryptPasswordHasher>();
builder.Services.AddSingleton<IValidationService, ValidationService>();
builder.Services.AddScoped<IUserService, UserService>();

// 3. Register controllers
builder.Services.AddControllers();

// 4. Configure CORS for frontend access
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

// 5. Configure OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Ensure SQLite database schema is created on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<UserDbContext>();
    dbContext.Database.EnsureCreated();
}

// Configure HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();
