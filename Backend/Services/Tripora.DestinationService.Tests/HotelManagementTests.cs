using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Controllers;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Models;
using Xunit;

namespace Tripora.DestinationService.Tests
{
    public class HotelManagementTests : IDisposable
    {
        private readonly DestinationDbContext _context;
        private readonly HotelController _controller;

        public HotelManagementTests()
        {
            var options = new DbContextOptionsBuilder<DestinationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new DestinationDbContext(options);
            _controller = new HotelController(_context);
        }

        public void Dispose()
        {
            _context.Database.EnsureDeleted();
            _context.Dispose();
        }

        private void SetControllerUserRole(string role)
        {
            var claims = new[] { new Claim(ClaimTypes.Role, role) };
            var identity = new ClaimsIdentity(claims, "TestAuth");
            var principal = new ClaimsPrincipal(identity);
            
            _controller.ControllerContext = new ControllerContext
            {
                HttpContext = new DefaultHttpContext { User = principal }
            };
        }

        [Fact]
        public async Task CreateHotel_WithValidData_CreatesAndReturnsHotel()
        {
            // Arrange
            SetControllerUserRole("Admin");
            var request = new CreateHotelRequestDto
            {
                Name = "Test Hotel",
                Description = "A nice hotel",
                Location = "Test City",
                PricePerNight = 150.50m,
                AvailableRooms = 10,
                Rating = 4.5,
                Amenities = "WiFi, Pool"
            };

            // Act
            var result = await _controller.CreateHotel(request);

            // Assert
            var createdAtResult = Assert.IsType<CreatedAtActionResult>(result);
            var hotel = Assert.IsType<Hotel>(createdAtResult.Value);
            
            Assert.Equal("Test Hotel", hotel.Name);
            Assert.Equal(150.50m, hotel.PricePerNight);
            
            var dbHotel = await _context.Hotels.FindAsync(hotel.Id);
            Assert.NotNull(dbHotel);
        }

        [Fact]
        public void CreateHotel_NegativePrice_FailsValidation()
        {
            // Arrange
            var request = new CreateHotelRequestDto
            {
                Name = "Test Hotel",
                Description = "A nice hotel",
                Location = "Test City",
                PricePerNight = -50m, // Invalid negative price
                AvailableRooms = 10,
                Rating = 4.5
            };

            var context = new System.ComponentModel.DataAnnotations.ValidationContext(request);
            var results = new List<System.ComponentModel.DataAnnotations.ValidationResult>();

            // Act
            var isValid = System.ComponentModel.DataAnnotations.Validator.TryValidateObject(request, context, results, true);

            // Assert
            Assert.False(isValid);
            Assert.Contains(results, r => r.ErrorMessage.Contains("Price must be greater than zero"));
        }

        [Fact]
        public async Task UpdateHotel_WithValidData_UpdatesHotel()
        {
            // Arrange
            SetControllerUserRole("Admin");
            var hotel = new Hotel
            {
                Name = "Old Name",
                Description = "Old desc",
                Location = "Old loc",
                PricePerNight = 100m,
                AvailableRooms = 5
            };
            _context.Hotels.Add(hotel);
            await _context.SaveChangesAsync();

            var updateRequest = new UpdateHotelRequestDto
            {
                Name = "New Name",
                Description = "New desc",
                Location = "New loc",
                PricePerNight = 200m,
                AvailableRooms = 20,
                Rating = 5.0,
                Amenities = "Spa"
            };

            // Act
            var result = await _controller.UpdateHotel(hotel.Id, updateRequest);

            // Assert
            var okResult = Assert.IsType<OkObjectResult>(result);
            var updatedHotel = Assert.IsType<Hotel>(okResult.Value);
            
            Assert.Equal("New Name", updatedHotel.Name);
            Assert.Equal(200m, updatedHotel.PricePerNight);
            Assert.Equal("Spa", updatedHotel.Amenities);
        }

        [Fact]
        public async Task DeleteHotel_ExistingId_DeletesHotel()
        {
            // Arrange
            SetControllerUserRole("Admin");
            var hotel = new Hotel
            {
                Name = "To Delete",
                Location = "Test",
                PricePerNight = 100m
            };
            _context.Hotels.Add(hotel);
            await _context.SaveChangesAsync();

            // Act
            var result = await _controller.DeleteHotel(hotel.Id);

            // Assert
            Assert.IsType<OkObjectResult>(result);
            var dbHotel = await _context.Hotels.FindAsync(hotel.Id);
            Assert.Null(dbHotel);
        }

        [Fact]
        public void CreateHotel_RequiresAdminRole_AttributeCheck()
        {
            // Arrange & Act
            var methodInfo = typeof(HotelController).GetMethod(nameof(HotelController.CreateHotel));
            var authorizeAttribute = methodInfo.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false)
                .OfType<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>()
                .FirstOrDefault();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Equal("Admin", authorizeAttribute.Roles);
        }

        [Fact]
        public void UpdateHotel_RequiresAdminRole_AttributeCheck()
        {
            // Arrange & Act
            var methodInfo = typeof(HotelController).GetMethod(nameof(HotelController.UpdateHotel));
            var authorizeAttribute = methodInfo.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false)
                .OfType<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>()
                .FirstOrDefault();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Equal("Admin", authorizeAttribute.Roles);
        }

        [Fact]
        public void DeleteHotel_RequiresAdminRole_AttributeCheck()
        {
            // Arrange & Act
            var methodInfo = typeof(HotelController).GetMethod(nameof(HotelController.DeleteHotel));
            var authorizeAttribute = methodInfo.GetCustomAttributes(typeof(Microsoft.AspNetCore.Authorization.AuthorizeAttribute), false)
                .OfType<Microsoft.AspNetCore.Authorization.AuthorizeAttribute>()
                .FirstOrDefault();

            // Assert
            Assert.NotNull(authorizeAttribute);
            Assert.Equal("Admin", authorizeAttribute.Roles);
        }
    }
}
