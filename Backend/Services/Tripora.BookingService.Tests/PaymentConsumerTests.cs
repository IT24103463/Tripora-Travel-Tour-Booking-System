using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Moq;
using Tripora.BookingService.Clients;
using Tripora.BookingService.Consumers;
using Tripora.BookingService.Data;
using Tripora.BookingService.Models;
using Tripora.Shared.Events;
using Xunit;

namespace Tripora.BookingService.Tests;

public class PaymentConsumerTests
{
    private BookingDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new BookingDbContext(options);
    }

    [Fact]
    public async Task PaymentSuccessfulConsumer_UpdatesBookingStatusToConfirmed()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var bookingId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = bookingId,
            UserId = "user-1",
            Status = "Pending",
            Quantity = 2,
            TotalAmount = 200m
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        var consumer = new PaymentSuccessfulConsumer(db, NullLogger<PaymentSuccessfulConsumer>.Instance);
        var mockConsumeContext = new Mock<ConsumeContext<PaymentSuccessfulEvent>>();
        mockConsumeContext.Setup(c => c.Message).Returns(new PaymentSuccessfulEvent
        {
            PaymentId = Guid.NewGuid(),
            BookingId = bookingId,
            UserId = "user-1",
            Amount = 200m,
            TransactionId = "TXN-SUCCESS"
        });

        // Act
        await consumer.Consume(mockConsumeContext.Object);

        // Assert
        var updated = await db.Bookings.FindAsync(bookingId);
        Assert.NotNull(updated);
        Assert.Equal("Confirmed", updated.Status);
    }

    [Fact]
    public async Task PaymentFailedConsumer_UpdatesBookingStatusToCancelledAndReleasesInventory()
    {
        // Arrange
        using var db = GetInMemoryDbContext();
        var bookingId = Guid.NewGuid();
        var tourId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = bookingId,
            UserId = "user-2",
            TourId = tourId,
            Quantity = 3,
            TotalAmount = 450m,
            Status = "Pending"
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        var mockDestinationClient = new Mock<IDestinationClient>();
        mockDestinationClient
            .Setup(c => c.ReleaseInventoryAsync(tourId, "Tour", 3))
            .ReturnsAsync(true);

        var consumer = new PaymentFailedConsumer(
            db,
            mockDestinationClient.Object,
            NullLogger<PaymentFailedConsumer>.Instance);

        var mockConsumeContext = new Mock<ConsumeContext<PaymentFailedEvent>>();
        mockConsumeContext.Setup(c => c.Message).Returns(new PaymentFailedEvent
        {
            PaymentId = Guid.NewGuid(),
            BookingId = bookingId,
            UserId = "user-2",
            Amount = 450m,
            Reason = "Card declined"
        });

        // Act
        await consumer.Consume(mockConsumeContext.Object);

        // Assert
        var updated = await db.Bookings.FindAsync(bookingId);
        Assert.NotNull(updated);
        Assert.Equal("Cancelled", updated.Status);
        mockDestinationClient.Verify(c => c.ReleaseInventoryAsync(tourId, "Tour", 3), Times.Once);
    }
}

