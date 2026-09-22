using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Moq;
using Tripora.BookingService.Controllers;
using Tripora.BookingService.DTOs;
using Tripora.BookingService.Models;
using Tripora.BookingService.Services;
using Xunit;

namespace Tripora.BookingService.Tests;

public class BookingIntegrationTests
{
    private readonly Mock<IBookingService> _mockBookingService;

    public BookingIntegrationTests()
    {
        _mockBookingService = new Mock<IBookingService>();
    }

    private BookingController CreateControllerWithUser(string userId = "test-user-id")
    {
        var controller = new BookingController(_mockBookingService.Object);
        var user = new ClaimsPrincipal(new ClaimsIdentity(new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("sub", userId),
            new Claim("id", userId),
            new Claim("userId", userId)
        }, "mock"));

        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = user }
        };

        return controller;
    }

    [Fact]
    public async Task CreateBooking_WithAvailableInventory_ReturnsOkAndCallsReserve()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var request = new CreateBookingRequestDto
        {
            TourId = tourId,
            BookingType = "Tour",
            GuestName = "Test Traveler",
            PhoneNumber = "+1234567890",
            BillingAddress = "123 Main Street",
            Quantity = 2,
            TotalAmount = 200m,
            TravelDate = DateTime.UtcNow.AddDays(7)
        };

        var expectedResponse = new BookingResponseDto
        {
            Id = Guid.NewGuid(),
            UserId = "test-user-id",
            TourId = tourId,
            BookingType = BookingType.Tour,
            GuestName = "Test Traveler",
            PhoneNumber = "+1234567890",
            BillingAddress = "123 Main Street",
            Quantity = 2,
            TotalAmount = 200m,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _mockBookingService
            .Setup(s => s.CreateBookingAsync(It.IsAny<string>(), It.IsAny<CreateBookingDto>()))
            .ReturnsAsync((true, expectedResponse, string.Empty));

        var controller = CreateControllerWithUser();

        // Act
        var result = await controller.CreateBooking(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.NotNull(okResult.Value);
    }

    [Fact]
    public async Task CreateBooking_WhenServiceFails_ReturnsBadRequest()
    {
        // Arrange
        var request = new CreateBookingRequestDto
        {
            TourId = Guid.NewGuid(),
            BookingType = "Tour",
            GuestName = "Test Traveler",
            PhoneNumber = "+1234567890",
            BillingAddress = "123 Main Street",
            Quantity = 99,
            TotalAmount = 9900m,
            TravelDate = DateTime.UtcNow.AddDays(7)
        };

        _mockBookingService
            .Setup(s => s.CreateBookingAsync(It.IsAny<string>(), It.IsAny<CreateBookingDto>()))
            .ReturnsAsync((false, null!, "Insufficient inventory available."));

        var controller = CreateControllerWithUser();

        // Act
        var result = await controller.CreateBooking(request);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        Assert.NotNull(badRequestResult.Value);
    }
}
