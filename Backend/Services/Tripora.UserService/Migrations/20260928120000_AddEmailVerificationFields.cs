using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tripora.UserService.Migrations
{
    public partial class AddEmailVerificationFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsEmailVerified",
                table: "Users",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerificationTokenExpiry",
                table: "Users",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "VerificationTokenHash",
                table: "Users",
                type: "varchar(64)",
                maxLength: 64,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "VerificationTokenLastSentAt",
                table: "Users",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.Sql("UPDATE `Users` SET `IsEmailVerified` = TRUE;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsEmailVerified",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "VerificationTokenExpiry",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "VerificationTokenHash",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "VerificationTokenLastSentAt",
                table: "Users");
        }
    }
}
