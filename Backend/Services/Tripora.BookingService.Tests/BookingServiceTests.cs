using Moq;
using Xunit;
using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Tripora.BookingService.Clients;
using Tripora.BookingService.Data;
using Tripora.BookingService.DTOs;
using Tripora.BookingService.Models;

namespace Tripora.BookingService.Tests;

public class BookingServiceTests
{
    private BookingDbContext GetInMemoryDb()
    {
        var options = new DbContextOptionsBuilder<BookingDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new BookingDbContext(options);
    }

    private Services.BookingService CreateService(BookingDbContext db, IDestinationClient client)
        => new(db, client, NullLogger<Services.BookingService>.Instance);

    // ──────────────────────────────────────────────────────────────────────────
    // Scenario 1: Booking creation succeeds and inventory is decremented
    // ──────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task CreateBooking_ValidTour_ReservesInventoryAndPersistsBooking()
    {
        var db = GetInMemoryDb();
        var mockClient = new Mock<IDestinationClient>();
        mockClient.Setup(c => c.ReserveInventoryAsync(It.IsAny<Guid>(), "Tour", 2))
                  .ReturnsAsync(true);

        var service = CreateService(db, mockClient.Object);
        var dto = new CreateBookingDto
        {
            BookingType = "Tour",
            TourId = Guid.NewGuid(),
            TravelDate = DateTime.UtcNow.AddDays(10),
            Quantity = 2,
            TotalAmount = 500.00m
        };

        var (success, booking, error) = await service.CreateBookingAsync("user-123", dto);

        Assert.True(success);
        Assert.NotNull(booking);
        Assert.Equal(BookingStatus.Confirmed, booking!.Status);
        Assert.Equal("user-123", booking.UserId);
        Assert.Equal(1, await db.Bookings.CountAsync());

        // Verify reserve was called exactly once
        mockClient.Verify(c => c.ReserveInventoryAsync(dto.TourId!.Value, "Tour", 2), Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Scenario 2: Booking rejected when destination returns full/unavailable (400)
    // ──────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task CreateBooking_FullTour_ReturnsErrorAndDoesNotPersist()
    {
        var db = GetInMemoryDb();
        var mockClient = new Mock<IDestinationClient>();
        mockClient.Setup(c => c.ReserveInventoryAsync(It.IsAny<Guid>(), "Tour", 3))
                  .ReturnsAsync(false); // Simulate 400 from DestinationService

        var service = CreateService(db, mockClient.Object);
        var dto = new CreateBookingDto
        {
            BookingType = "Tour",
            TourId = Guid.NewGuid(),
            TravelDate = DateTime.UtcNow.AddDays(5),
            Quantity = 3,
            TotalAmount = 750.00m
        };

        var (success, booking, error) = await service.CreateBookingAsync("user-456", dto);

        Assert.False(success);
        Assert.Null(booking);
        Assert.Contains("full or no longer active", error);
        Assert.Equal(0, await db.Bookings.CountAsync()); // Nothing persisted
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Scenario 3: Cancellation sets status to Cancelled and releases inventory
    // ──────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task CancelBooking_OwnBooking_UpdatesStatusAndReleasesInventory()
    {
        var db = GetInMemoryDb();
        var tourId = Guid.NewGuid();
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = "user-789",
            BookingType = BookingType.Tour,
            TourId = tourId,
            TravelDate = DateTime.UtcNow.AddDays(15),
            Quantity = 1,
            TotalAmount = 250.00m,
            Status = BookingStatus.Confirmed
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        var mockClient = new Mock<IDestinationClient>();
        mockClient.Setup(c => c.ReleaseInventoryAsync(tourId, "Tour", 1))
                  .ReturnsAsync(true);

        var service = CreateService(db, mockClient.Object);
        var (success, error) = await service.CancelBookingAsync(booking.Id, "user-789", isAdmin: false);

        Assert.True(success);

        var updated = await db.Bookings.FindAsync(booking.Id);
        Assert.Equal(BookingStatus.Cancelled, updated!.Status);

        mockClient.Verify(c => c.ReleaseInventoryAsync(tourId, "Tour", 1), Times.Once);
    }

    // ──────────────────────────────────────────────────────────────────────────
    // Scenario 4: Cross-user access is forbidden (non-admin cannot cancel another user's booking)
    // ──────────────────────────────────────────────────────────────────────────
    [Fact]
    public async Task CancelBooking_AnotherUsersBooking_ReturnsForbidden()
    {
        var db = GetInMemoryDb();
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = "owner-user",
            BookingType = BookingType.Tour,
            TourId = Guid.NewGuid(),
            TravelDate = DateTime.UtcNow.AddDays(20),
            Quantity = 1,
            TotalAmount = 300.00m,
            Status = BookingStatus.Confirmed
        };
        db.Bookings.Add(booking);
        await db.SaveChangesAsync();

        var mockClient = new Mock<IDestinationClient>();
        var service = CreateService(db, mockClient.Object);

        // A different user tries to cancel
        var (success, error) = await service.CancelBookingAsync(booking.Id, "attacker-user", isAdmin: false);

        Assert.False(success);
        Assert.Equal("Access denied.", error);

        // Booking still confirmed, no release triggered
        var unchanged = await db.Bookings.FindAsync(booking.Id);
        Assert.Equal(BookingStatus.Confirmed, unchanged!.Status);
        mockClient.Verify(c => c.ReleaseInventoryAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<int>()), Times.Never);
    }
}
