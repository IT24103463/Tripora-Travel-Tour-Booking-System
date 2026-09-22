using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Tripora.PaymentService.Controllers;
using Tripora.PaymentService.Data;
using Tripora.PaymentService.DTOs;
using Tripora.PaymentService.Models;
using Tripora.PaymentService.Services;
using Tripora.Shared.Events;
using Xunit;

namespace Tripora.PaymentService.Tests;

public class PaymentControllerTests
{
    private PaymentDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<PaymentDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new PaymentDbContext(options);
    }

    [Fact]
    public async Task ProcessPayment_ValidRequest_ReturnsSuccessAndPublishesEventAndCallsBookingClient()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        mockBookingClient
            .Setup(c => c.UpdateBookingStatusAsync(It.IsAny<Guid>(), "Confirmed"))
            .ReturnsAsync((true, string.Empty));

        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        var bookingId = Guid.NewGuid();
        var dto = new ProcessPaymentDto
        {
            BookingId = bookingId,
            UserId = "user-123",
            Amount = 199.99m,
            PaymentMethod = "CreditCard",
            CardNumber = "4111222233334444",
            ExpiryDate = "12/28",
            Cvv = "123"
        };

        // Act
        var result = await controller.ProcessPayment(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<PaymentResponseDto>(okResult.Value);
        Assert.Equal("Success", response.Status);
        Assert.Equal(bookingId, response.BookingId);
        Assert.Equal(199.99m, response.Amount);
        Assert.StartsWith("TXN-", response.TransactionId);

        // Verify in database
        var savedPayment = await db.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId);
        Assert.NotNull(savedPayment);
        Assert.Equal("Success", savedPayment.Status);

        // Verify booking status was called
        // Verify booking status HTTP sync was called
        mockBookingClient.Verify(c => c.UpdateBookingStatusAsync(bookingId, "Confirmed"), Times.Once);

        // Verify PaymentSuccessfulEvent was published to MassTransit
        mockPublishEndpoint.Verify(p => p.Publish(
            It.Is<PaymentSuccessfulEvent>(e => e.BookingId == bookingId && e.Amount == 199.99m && e.UserId == "user-123"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPayment_CardEndingWith0000_SimulatesDeclineAndPublishesFailedEvent()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        var bookingId = Guid.NewGuid();
        var dto = new ProcessPaymentDto
        {
            BookingId = bookingId,
            UserId = "user-123",
            Amount = 50.00m,
            PaymentMethod = "CreditCard",
            CardNumber = "4111222233330000",
            ExpiryDate = "12/28",
            Cvv = "123"
        };

        // Act
        var result = await controller.ProcessPayment(dto);

        // Assert
        var badRequestResult = Assert.IsType<BadRequestObjectResult>(result);
        var response = Assert.IsType<PaymentResponseDto>(badRequestResult.Value);
        Assert.Equal("Failed", response.Status);

        // Booking status should NOT be updated
        // Booking status HTTP client should NOT be called on failure
        mockBookingClient.Verify(c => c.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);

        // Verify PaymentFailedEvent was published to MassTransit
        mockPublishEndpoint.Verify(p => p.Publish(
            It.Is<PaymentFailedEvent>(e => e.BookingId == bookingId && e.Amount == 50.00m && e.UserId == "user-123"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ProcessPayment_AlreadySuccessful_ReturnsExistingRecordIdempotently()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        var bookingId = Guid.NewGuid();
        db.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            UserId = "user-123",
            Amount = 150.00m,
            PaymentMethod = "CreditCard",
            Status = "Success",
            TransactionId = "TXN-EXISTING",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        var dto = new ProcessPaymentDto
        {
            BookingId = bookingId,
            UserId = "user-123",
            Amount = 150.00m,
            PaymentMethod = "CreditCard",
            CardNumber = "4111222233334444"
        };

        // Act
        var result = await controller.ProcessPayment(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<PaymentResponseDto>(okResult.Value);
        Assert.Equal("Success", response.Status);
        Assert.Equal("TXN-EXISTING", response.TransactionId);

        // Verify no duplicate event or booking update was executed
        mockBookingClient.Verify(c => c.UpdateBookingStatusAsync(It.IsAny<Guid>(), It.IsAny<string>()), Times.Never);
        mockPublishEndpoint.Verify(p => p.Publish(It.IsAny<PaymentSuccessfulEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task InitiatePayment_ValidRequest_ReturnsPendingStatusAndPersists()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        var bookingId = Guid.NewGuid();
        var dto = new ProcessPaymentDto
        {
            BookingId = bookingId,
            UserId = "user-init-1",
            Amount = 75.00m,
            PaymentMethod = "CreditCard"
        };

        // Act
        var result = await controller.InitiatePayment(dto);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<PaymentResponseDto>(okResult.Value);
        Assert.Equal("Pending", response.Status);
        Assert.Equal(bookingId, response.BookingId);
        Assert.StartsWith("TXN-INIT-", response.TransactionId);

        var saved = await db.Payments.FirstOrDefaultAsync(p => p.BookingId == bookingId);
        Assert.NotNull(saved);
        Assert.Equal("Pending", saved.Status);
    }

    [Fact]
    public async Task ProcessPayment_ZeroOrNegativeAmount_ReturnsBadRequest()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        var dto = new ProcessPaymentDto
        {
            BookingId = Guid.NewGuid(),
            Amount = 0m,
            PaymentMethod = "CreditCard"
        };

        // Act
        var result = await controller.ProcessPayment(dto);

        // Assert
        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetPaymentByBookingId_ExistingPayment_ReturnsPaymentDto()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        var bookingId = Guid.NewGuid();
        db.Payments.Add(new Payment
        {
            Id = Guid.NewGuid(),
            BookingId = bookingId,
            UserId = "user-456",
            Amount = 300.00m,
            PaymentMethod = "PayPal",
            Status = "Success",
            TransactionId = "TXN-TEST123456",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        // Act
        var result = await controller.GetPaymentByBookingId(bookingId);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var response = Assert.IsType<PaymentResponseDto>(okResult.Value);
        Assert.Equal(bookingId, response.BookingId);
        Assert.Equal(300.00m, response.Amount);
        Assert.Equal("PayPal", response.PaymentMethod);
        Assert.Equal("Success", response.Status);
    }

    [Fact]
    public async Task GetUserPaymentHistory_ReturnsListOfUserPayments()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        db.Payments.AddRange(
            new Payment { Id = Guid.NewGuid(), BookingId = Guid.NewGuid(), UserId = "user-history-1", Amount = 100m, Status = "Success" },
            new Payment { Id = Guid.NewGuid(), BookingId = Guid.NewGuid(), UserId = "user-history-1", Amount = 200m, Status = "Success" },
            new Payment { Id = Guid.NewGuid(), BookingId = Guid.NewGuid(), UserId = "user-other", Amount = 50m, Status = "Success" }
        );
        await db.SaveChangesAsync();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        // Act
        var result = await controller.GetUserPaymentHistory("user-history-1");

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<PaymentResponseDto>>(okResult.Value);
        Assert.Equal(2, System.Linq.Enumerable.Count(items));
        Assert.Equal(2, items.Count());
    }

    [Fact]
    public async Task GetAllPaymentHistory_ReturnsAllPayments()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        db.Payments.AddRange(
            new Payment { Id = Guid.NewGuid(), BookingId = Guid.NewGuid(), UserId = "user-1", Amount = 100m, Status = "Success" },
            new Payment { Id = Guid.NewGuid(), BookingId = Guid.NewGuid(), UserId = "user-2", Amount = 200m, Status = "Success" }
        );
        await db.SaveChangesAsync();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        // Act
        var result = await controller.GetAllPaymentHistory();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result);
        var items = Assert.IsAssignableFrom<IEnumerable<PaymentResponseDto>>(okResult.Value);
        Assert.Equal(2, System.Linq.Enumerable.Count(items));
        Assert.Equal(2, items.Count());
    }

    [Fact]
    public async Task GetPaymentByBookingId_NonExisting_ReturnsNotFound()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var mockBookingClient = new Mock<IBookingServiceClient>();
        var mockPublishEndpoint = new Mock<IPublishEndpoint>();

        var controller = new PaymentController(
            db,
            mockBookingClient.Object,
            mockPublishEndpoint.Object,
            NullLogger<PaymentController>.Instance);

        // Act
        var result = await controller.GetPaymentByBookingId(Guid.NewGuid());

        // Assert
        Assert.IsType<NotFoundObjectResult>(result);
    }
}

