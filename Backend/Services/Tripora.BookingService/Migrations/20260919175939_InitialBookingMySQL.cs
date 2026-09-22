using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tripora.BookingService.Migrations
{
    /// <inheritdoc />
    public partial class InitialBookingMySQL : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Bookings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false),
                    UserId = table.Column<string>(type: "varchar(36)", maxLength: 36, nullable: false),
                    BookingType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    TourId = table.Column<Guid>(type: "char(36)", nullable: true),
                    HotelId = table.Column<Guid>(type: "char(36)", nullable: true),
                    ItemId = table.Column<Guid>(type: "char(36)", nullable: false),
                    ItemType = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                    GuestName = table.Column<string>(type: "varchar(200)", maxLength: 200, nullable: true),
                    PhoneNumber = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                    BillingAddress = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    BookingDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    TravelDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    CheckInDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CheckOutDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Count = table.Column<int>(type: "int", nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false, defaultValue: "Pending"),
                    LegacyStatus = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Bookings", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_HotelId",
                table: "Bookings",
                column: "HotelId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_TourId",
                table: "Bookings",
                column: "TourId");

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_UserId",
                table: "Bookings",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Bookings");
        }
    }
}
