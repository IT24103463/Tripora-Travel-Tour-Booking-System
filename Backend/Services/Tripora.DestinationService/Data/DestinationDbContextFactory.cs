using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Tripora.DestinationService.Data;

public sealed class DestinationDbContextFactory : IDesignTimeDbContextFactory<DestinationDbContext>
{
    public DestinationDbContext CreateDbContext(string[] args)
    {
        var configCandidates = new[]
        {
            Path.Combine(Directory.GetCurrentDirectory(), "appsettings.json"),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "appsettings.json"))
        };
        var settingsPath = configCandidates.FirstOrDefault(File.Exists);
        var configuration = new ConfigurationBuilder()
            .AddJsonFile(settingsPath ?? configCandidates[0], optional: true)
            .AddEnvironmentVariables()
            .Build();

        var connectionString = Environment.GetEnvironmentVariable("TRIPORA_DESTINATION_CONNECTION")
            ?? configuration.GetConnectionString("MySqlConnection")
            ?? "Server=localhost;Port=3306;Database=tripora_db;User=root;Password=;";

        var options = new DbContextOptionsBuilder<DestinationDbContext>()
            .UseMySQL(connectionString)
            .Options;

        return new DestinationDbContext(options);
    }
}
