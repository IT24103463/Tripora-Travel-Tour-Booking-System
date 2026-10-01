using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Tripora.DestinationService.Migrations
{
    /// <inheritdoc />
    public partial class AddImageUrlToOffers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
    }



        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Offers");
        }
    }
}
