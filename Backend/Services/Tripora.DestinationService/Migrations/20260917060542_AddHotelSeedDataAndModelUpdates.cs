using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tripora.DestinationService.Migrations
{
    /// <inheritdoc />
    public partial class AddHotelSeedDataAndModelUpdates : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Hotels",
                columns: new[] { "Id", "Amenities", "AvailableRooms", "CreatedAt", "Description", "ImageUrl", "IsActive", "Location", "Name", "PricePerNight", "Rating", "Status", "TotalRooms", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("99999999-9999-9999-9999-999999999999"), "Infinity Pool, Free WiFi, Spa, Breakfast Included, Restaurant, Airport Shuttle", 32, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A luxury eco-resort immersed in the forested hills overlooking the ancient landscapes of Sigiriya and Dambulla.", "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80", true, "Sigiriya / Dambulla, Sri Lanka", "Heritance Kandalama", 180.00m, 4.7999999999999998, 0, 32, null },
                    { new Guid("aaaaaaaa-1111-1111-1111-111111111111"), "Mountain View, Spa, Free WiFi, Breakfast Included, Restaurant, Hiking Trails", 24, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A boutique mountain retreat surrounded by tea plantations with sweeping views of Ella's green valleys.", "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=800&q=80", true, "Ella, Sri Lanka", "98 Acres Resort & Spa", 220.00m, 4.9000000000000004, 0, 24, null },
                    { new Guid("bbbbbbbb-2222-2222-2222-222222222222"), "Beach Access, Swimming Pool, Free WiFi, Spa, Breakfast Included, Water Sports", 48, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A beachfront luxury resort offering tropical gardens, calm ocean views, and effortless coastal living.", "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80", true, "Bentota, Sri Lanka", "Cinnamon Bentota Beach", 160.00m, 4.7000000000000002, 0, 48, null },
                    { new Guid("cccccccc-3333-3333-3333-333333333333"), "Heritage Architecture, Courtyard Pool, Free WiFi, Breakfast Included, Restaurant, Concierge", 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "An intimate heritage boutique hotel set inside the historic Galle Fort, blending colonial character with modern comfort.", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", true, "Galle, Sri Lanka", "Galle Fort Hotel", 140.00m, 4.5999999999999996, 0, 14, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Hotels",
                keyColumn: "Id",
                keyValue: new Guid("99999999-9999-9999-9999-999999999999"));

            migrationBuilder.DeleteData(
                table: "Hotels",
                keyColumn: "Id",
                keyValue: new Guid("aaaaaaaa-1111-1111-1111-111111111111"));

            migrationBuilder.DeleteData(
                table: "Hotels",
                keyColumn: "Id",
                keyValue: new Guid("bbbbbbbb-2222-2222-2222-222222222222"));

            migrationBuilder.DeleteData(
                table: "Hotels",
                keyColumn: "Id",
                keyValue: new Guid("cccccccc-3333-3333-3333-333333333333"));
        }
    }
}
