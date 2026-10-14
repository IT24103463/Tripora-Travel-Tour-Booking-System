using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Tripora.DestinationService.Data;

#nullable disable

namespace Tripora.DestinationService.Migrations;

[DbContext(typeof(DestinationDbContext))]
[Migration("20261014143000_AddUserIdToInquiries")]
public partial class AddUserIdToInquiries : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "user_id",
            table: "inquiries",
            type: "varchar(254)",
            maxLength: 254,
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_inquiries_user_id",
            table: "inquiries",
            column: "user_id");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_inquiries_user_id",
            table: "inquiries");

        migrationBuilder.DropColumn(
            name: "user_id",
            table: "inquiries");
    }
}
