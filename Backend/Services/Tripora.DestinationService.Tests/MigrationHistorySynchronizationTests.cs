using System.Reflection;
using Microsoft.EntityFrameworkCore.Migrations;
using Microsoft.EntityFrameworkCore.Migrations.Operations;
using Tripora.DestinationService.Migrations;
using Xunit;

namespace Tripora.DestinationService.Tests;

public sealed class MigrationHistorySynchronizationTests
{
    [Theory]
    [InlineData(typeof(InitialCreate), "Tours")]
    [InlineData(typeof(AddInquiriesTable), "inquiries")]
    public void Existing_table_migrations_do_not_emit_create_table_operations(Type migrationType, string tableName)
    {
        var migration = Assert.IsAssignableFrom<Migration>(Activator.CreateInstance(migrationType));
        var builder = new MigrationBuilder("MySQL");
        var up = migrationType.GetMethod("Up", BindingFlags.Instance | BindingFlags.NonPublic)!;

        up.Invoke(migration, [builder]);

        Assert.DoesNotContain(builder.Operations.OfType<CreateTableOperation>(), operation => operation.Name == tableName);
    }
}
