using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Tripora.DestinationService.Migrations
{
    /// <inheritdoc />
    public partial class AddAvailabilityAndRowVersion : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
    }



        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Tours");

            migrationBuilder.DropColumn(
                name: "RowVersion",
                table: "Hotels");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Hotels");
        }
    }
}
