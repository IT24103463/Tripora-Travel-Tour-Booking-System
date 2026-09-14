using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tripora.BookingService.Migrations
{
    /// <inheritdoc />
    public partial class SyncMergedBookingModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Count",
                table: "Bookings",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "ItemId",
                table: "Bookings",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.AddColumn<string>(
                name: "ItemType",
                table: "Bookings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "LegacyStatus",
                table: "Bookings",
                type: "TEXT",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Count",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ItemId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ItemType",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "LegacyStatus",
                table: "Bookings");
        }
    }
}
