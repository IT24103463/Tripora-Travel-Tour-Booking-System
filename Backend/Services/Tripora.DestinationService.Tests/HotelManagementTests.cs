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
using Tripora.DestinationService.Services;
using Xunit;
using Moq;

namespace Tripora.DestinationService.Tests
{
    public class HotelManagementTests : IDisposable
    {
        private readonly DestinationDbContext _context;
        private readonly HotelController _controller;
        private readonly Mock<IHotelService> _mockHotelService;

        public HotelManagementTests()
        {
            var options = new DbContextOptionsBuilder<DestinationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            _context = new DestinationDbContext(options);
            _mockHotelService = new Mock<IHotelService>();
            _controller = new HotelController(_context, _mockHotelService.Object);
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

        private DestinationDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<DestinationDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            return new DestinationDbContext(options);
        }

        // --- TRIP-50: Basic CRUD and Search Tests ---

        [Fact]
        public async Task CreateHotel_WithValidData_ReturnsCreated()
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
                TotalRooms = 10,
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
                TotalRooms = 10,
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

        // --- TRIP-52: Availability Tests ---

        [Fact]
        public async Task UpdateHotelAsync_IncreaseTotalRooms_IncreasesAvailableRooms()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var hotelId = Guid.NewGuid();
            var hotel = new Hotel { Id = hotelId, TotalRooms = 10, AvailableRooms = 5 };
            db.Hotels.Add(hotel);
            await db.SaveChangesAsync();

            var service = new HotelService(db);
            var dto = new UpdateHotelRequestDto { TotalRooms = 15 };

            // Act
            var result = await service.UpdateHotelAsync(hotelId, dto);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(15, result.Hotel!.TotalRooms);
            Assert.Equal(10, result.Hotel!.AvailableRooms); // 5 booked, new total is 15 -> available = 10
        }

        [Fact]
        public async Task UpdateHotelAsync_DecreaseTotalRooms_FailsIfBelowOccupied()
        {
            // Arrange
            var db = GetInMemoryDbContext();
            var hotelId = Guid.NewGuid();
            var hotel = new Hotel { Id = hotelId, TotalRooms = 10, AvailableRooms = 2 }; // 8 occupied
            db.Hotels.Add(hotel);
            await db.SaveChangesAsync();

            var service = new HotelService(db);
            var dto = new UpdateHotelRequestDto { TotalRooms = 5 }; // Try shrinking to 5

            // Act
            var result = await service.UpdateHotelAsync(hotelId, dto);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Contains("Cannot reduce TotalRooms below currently occupied rooms", result.ErrorMessage);
        }
    }
}
