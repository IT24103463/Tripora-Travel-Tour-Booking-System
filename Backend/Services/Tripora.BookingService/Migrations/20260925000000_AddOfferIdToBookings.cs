using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Tripora.BookingService.Data;

#nullable disable

namespace Tripora.BookingService.Migrations;

[DbContext(typeof(BookingDbContext))]
[Migration("20260925000000_AddOfferIdToBookings")]
public partial class AddOfferIdToBookings : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<Guid>(
            name: "OfferId",
            table: "Bookings",
            type: "char(36)",
            nullable: true);

        migrationBuilder.CreateIndex(
            name: "IX_Bookings_OfferId",
            table: "Bookings",
            column: "OfferId");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropIndex(name: "IX_Bookings_OfferId", table: "Bookings");
        migrationBuilder.DropColumn(name: "OfferId", table: "Bookings");
    }
}
