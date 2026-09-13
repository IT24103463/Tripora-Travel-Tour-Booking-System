using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tripora.DestinationService.Migrations
{
    /// <inheritdoc />
    public partial class AddInventoryConcurrencyAndTotalRooms : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "TotalRooms",
                table: "Hotels",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TotalRooms",
                table: "Hotels");
        }
    }
}
