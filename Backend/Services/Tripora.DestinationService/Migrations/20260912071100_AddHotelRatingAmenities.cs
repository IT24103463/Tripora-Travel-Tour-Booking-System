using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tripora.DestinationService.Migrations
{
    /// <inheritdoc />
    public partial class AddHotelRatingAmenities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
    }



        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Amenities",
                table: "Hotels");

            migrationBuilder.DropColumn(
                name: "Rating",
                table: "Hotels");
        }
    }
}
