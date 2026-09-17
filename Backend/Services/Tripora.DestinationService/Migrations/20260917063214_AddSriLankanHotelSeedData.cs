using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tripora.DestinationService.Migrations
{
    /// <inheritdoc />
    public partial class AddSriLankanHotelSeedData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Hotels",
                keyColumn: "Id",
                keyValue: new Guid("55555555-5555-5555-5555-555555555555"));

            migrationBuilder.DeleteData(
                table: "Hotels",
                keyColumn: "Id",
                keyValue: new Guid("66666666-6666-6666-6666-666666666666"));

            migrationBuilder.DeleteData(
                table: "Hotels",
                keyColumn: "Id",
                keyValue: new Guid("77777777-7777-7777-7777-777777777777"));

            migrationBuilder.DeleteData(
                table: "Hotels",
                keyColumn: "Id",
                keyValue: new Guid("88888888-8888-8888-8888-888888888888"));

            migrationBuilder.InsertData(
                table: "Hotels",
                columns: new[] { "Id", "Amenities", "AvailableRooms", "CreatedAt", "Description", "ImageUrl", "IsActive", "Location", "Name", "PricePerNight", "Rating", "Status", "TotalRooms", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("99999999-9999-9999-9999-999999999999"), "Infinity Pool, Free WiFi, Spa, Breakfast Included, Restaurant, Airport Shuttle", 32, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A luxury eco-resort immersed in forested hills overlooking the ancient landscapes of Sigiriya and Dambulla.", "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80", true, "Sigiriya / Dambulla, Sri Lanka", "Heritance Kandalama", 180.00m, 4.7999999999999998, 0, 32, null },
                    { new Guid("aaaaaaaa-1111-1111-1111-111111111111"), "Mountain View, Spa, Free WiFi, Breakfast Included, Restaurant, Hiking Trails", 24, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A boutique mountain retreat surrounded by tea plantations with sweeping views of Ella's green valleys.", "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=800&q=80", true, "Ella, Sri Lanka", "98 Acres Resort & Spa", 220.00m, 4.9000000000000004, 0, 24, null },
                    { new Guid("bbbbbbbb-2222-2222-2222-222222222222"), "Beach Access, Swimming Pool, Free WiFi, Spa, Breakfast Included, Water Sports", 48, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "A beachfront luxury resort offering tropical gardens, calm ocean views, and effortless coastal living.", "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80", true, "Bentota, Sri Lanka", "Cinnamon Bentota Beach", 160.00m, 4.7000000000000002, 0, 48, null },
                    { new Guid("cccccccc-3333-3333-3333-333333333333"), "Heritage Architecture, Courtyard Pool, Free WiFi, Breakfast Included, Restaurant, Concierge", 14, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "An intimate heritage boutique hotel inside historic Galle Fort, blending colonial character with modern comfort.", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", true, "Galle, Sri Lanka", "Galle Fort Hotel", 140.00m, 4.5999999999999996, 0, 14, null }
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

            migrationBuilder.InsertData(
                table: "Hotels",
                columns: new[] { "Id", "Amenities", "AvailableRooms", "CreatedAt", "Description", "ImageUrl", "IsActive", "Location", "Name", "PricePerNight", "Rating", "Status", "TotalRooms", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("55555555-5555-5555-5555-555555555555"), "Ocean View, Private Pool, Free WiFi, Spa, Breakfast Included, Airport Shuttle", 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Overwater luxury villas featuring direct lagoon access, sunset infinity pools, and world-class fine dining.", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80", true, "South Malé Atoll, Maldives", "The Azure Horizon Resort", 420.00m, 5.0, 0, 0, null },
                    { new Guid("66666666-6666-6666-6666-666666666666"), "Ski-in/Ski-out, Spa & Sauna, Free WiFi, Mountain View, Restaurant, Bar", 25, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cozy alpine chalet-style architecture offering panoramic Matterhorn views, heated thermal baths, and fireside lounges.", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", true, "Zermatt, Switzerland", "Grand Alpine Sanctuary", 290.00m, 4.0, 0, 0, null },
                    { new Guid("77777777-7777-7777-7777-777777777777"), "Metro Access, Fitness Center, High-Speed WiFi, Room Service, Business Lounge", 50, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sleek contemporary rooms right in the vibrant heart of the city, steps away from transit lines and premier dining.", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", true, "Tokyo, Japan", "The Imperial Palace Hotel", 195.00m, 4.0, 0, 0, null },
                    { new Guid("88888888-8888-8888-8888-888888888888"), "Sea Balcony, Complimentary Breakfast, Free WiFi, Concierge, Valet Parking", 8, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Elegant cliff-perched boutique accommodation featuring terraced lemon gardens and panoramic Mediterranean seascapes.", "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", true, "Amalfi Coast, Italy", "Villa Positano Cliffside", 360.00m, 5.0, 0, 0, null }
                });
        }
    }
}
