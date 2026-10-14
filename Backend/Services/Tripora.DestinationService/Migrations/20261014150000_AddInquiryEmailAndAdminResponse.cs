using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Tripora.DestinationService.Data;

#nullable disable

namespace Tripora.DestinationService.Migrations;

[DbContext(typeof(DestinationDbContext))]
[Migration("20261014150000_AddInquiryEmailAndAdminResponse")]
public partial class AddInquiryEmailAndAdminResponse : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "email",
            table: "inquiries",
            type: "varchar(256)",
            maxLength: 256,
            nullable: true);

        migrationBuilder.AddColumn<string>(
            name: "admin_response",
            table: "inquiries",
            type: "longtext",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_inquiries_email",
            table: "inquiries",
            column: "email");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(
            name: "IX_inquiries_email",
            table: "inquiries");

        migrationBuilder.DropColumn(
            name: "email",
            table: "inquiries");

        migrationBuilder.DropColumn(
            name: "admin_response",
            table: "inquiries");
    }
}
