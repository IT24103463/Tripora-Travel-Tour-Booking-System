using Moq;
using Xunit;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Models;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Services;

namespace Tripora.DestinationService.Tests;

public class HotelManagementTests
{
    private DestinationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<DestinationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        return new DestinationDbContext(options);
    }

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
        var dto = new UpdateHotelDto { TotalRooms = 15 };

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
        var dto = new UpdateHotelDto { TotalRooms = 5 }; // Try shrinking to 5

        // Act
        var result = await service.UpdateHotelAsync(hotelId, dto);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Contains("Cannot reduce TotalRooms below currently occupied rooms", result.ErrorMessage);
    }
}
