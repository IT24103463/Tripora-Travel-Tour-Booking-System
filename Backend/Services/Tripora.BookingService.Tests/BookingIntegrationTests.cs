using Moq;
using Xunit;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Tripora.BookingService.Models;
using Tripora.BookingService.Clients;
using Tripora.BookingService.Controllers;

namespace Tripora.BookingService.Tests;

public class BookingIntegrationTests
{
    [Fact]
    public async Task CreateBooking_WithAvailableInventory_ReturnsOkAndCallsReserve()
    {
        // Arrange
        var mockClient = new Mock<IDestinationClient>();
        mockClient.Setup(c => c.ReserveInventoryAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<int>()))
                  .ReturnsAsync(true);
        var controller = new BookingController(mockClient.Object);
        var request = new Booking { ItemId = Guid.NewGuid(), ItemType = "Tour", Count = 2 };

        // Act
        var result = await controller.CreateBooking(request);

        // Assert
        Assert.IsType<OkObjectResult>(result);
        mockClient.Verify(c => c.ReserveInventoryAsync(request.ItemId, "Tour", 2), Times.Once);
    }

    [Fact]
    public async Task CreateBooking_WithFailedInventory_ReturnsBadRequest()
    {
        // Arrange
        var mockClient = new Mock<IDestinationClient>();
        mockClient.Setup(c => c.ReserveInventoryAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<int>()))
                  .ReturnsAsync(false);
        var controller = new BookingController(mockClient.Object);
        var request = new Booking { ItemId = Guid.NewGuid(), ItemType = "Hotel", Count = 5 };

        // Act
        var result = await controller.CreateBooking(request);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
        mockClient.Verify(c => c.ReserveInventoryAsync(request.ItemId, "Hotel", 5), Times.Once);
    }
}
