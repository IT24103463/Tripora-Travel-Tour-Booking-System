using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Tripora.DestinationService.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialDestinationsData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Hotels",
                columns: new[] { "Id", "Amenities", "AvailableRooms", "CreatedAt", "Description", "ImageUrl", "IsActive", "Location", "Name", "PricePerNight", "Rating", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("55555555-5555-5555-5555-555555555555"), "Ocean View, Private Pool, Free WiFi, Spa, Breakfast Included, Airport Shuttle", 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Overwater luxury villas featuring direct lagoon access, sunset infinity pools, and world-class fine dining.", "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=800&q=80", true, "South Malé Atoll, Maldives", "The Azure Horizon Resort", 420.00m, 5.0, null },
                    { new Guid("66666666-6666-6666-6666-666666666666"), "Ski-in/Ski-out, Spa & Sauna, Free WiFi, Mountain View, Restaurant, Bar", 25, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Cozy alpine chalet-style architecture offering panoramic Matterhorn views, heated thermal baths, and fireside lounges.", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80", true, "Zermatt, Switzerland", "Grand Alpine Sanctuary", 290.00m, 4.0, null },
                    { new Guid("77777777-7777-7777-7777-777777777777"), "Metro Access, Fitness Center, High-Speed WiFi, Room Service, Business Lounge", 50, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Sleek contemporary rooms right in the vibrant heart of the city, steps away from transit lines and premier dining.", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80", true, "Tokyo, Japan", "The Imperial Palace Hotel", 195.00m, 4.0, null },
                    { new Guid("88888888-8888-8888-8888-888888888888"), "Sea Balcony, Complimentary Breakfast, Free WiFi, Concierge, Valet Parking", 8, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Elegant cliff-perched boutique accommodation featuring terraced lemon gardens and panoramic Mediterranean seascapes.", "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=800&q=80", true, "Amalfi Coast, Italy", "Villa Positano Cliffside", 360.00m, 5.0, null }
                });

            migrationBuilder.InsertData(
                table: "Tours",
                columns: new[] { "Id", "AvailableSlots", "Capacity", "CreatedAt", "DeletedAt", "Description", "Destination", "DurationDays", "ImageUrl", "IsActive", "Name", "Price", "UpdatedAt" },
                values: new object[,]
                {
                    { new Guid("11111111-1111-1111-1111-111111111111"), 20, 20, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Hike breathtaking Alpine trails, explore ancient ice caves, and experience scenic cogwheel rail journeys through the Jungfrau region.", "Interlaken, Switzerland", 5, "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=80", true, "Alpine Glacier Explorer", 1250.00m, null },
                    { new Guid("22222222-2222-2222-2222-222222222222"), 12, 12, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Witness the Great Migration up close with guided off-road drives, luxury tent camps, and panoramic savannah sunsets.", "Arusha, Tanzania", 7, "https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=800&q=80", true, "Serengeti Wildlife Safari", 2800.00m, null },
                    { new Guid("33333333-3333-3333-3333-333333333333"), 15, 15, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Stroll through historic bamboo groves, ancient Shinto shrines, and participate in authentic traditional tea ceremonies.", "Kyoto, Japan", 4, "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80", true, "Kyoto Cultural Heritage Walk", 890.00m, null },
                    { new Guid("44444444-4444-4444-4444-444444444444"), 10, 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, "Sail past dramatic cliffside villages, explore hidden coves, and sample authentic regional Mediterranean cuisine.", "Positano, Italy", 6, "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80", true, "Amalfi Coastline Cruise", 1750.00m, null }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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

            migrationBuilder.DeleteData(
                table: "Tours",
                keyColumn: "Id",
                keyValue: new Guid("11111111-1111-1111-1111-111111111111"));

            migrationBuilder.DeleteData(
                table: "Tours",
                keyColumn: "Id",
                keyValue: new Guid("22222222-2222-2222-2222-222222222222"));

            migrationBuilder.DeleteData(
                table: "Tours",
                keyColumn: "Id",
                keyValue: new Guid("33333333-3333-3333-3333-333333333333"));

            migrationBuilder.DeleteData(
                table: "Tours",
                keyColumn: "Id",
                keyValue: new Guid("44444444-4444-4444-4444-444444444444"));
        }
    }
}
