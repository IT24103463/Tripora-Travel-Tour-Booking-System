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
            migrationBuilder.AddColumn<string>(
                name: "Amenities",
                table: "Hotels",
                type: "longtext",
                nullable: false);

            migrationBuilder.AddColumn<double>(
                name: "Rating",
                table: "Hotels",
                type: "double",
                nullable: false,
                defaultValue: 0.0);
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
