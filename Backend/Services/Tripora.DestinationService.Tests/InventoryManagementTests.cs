using Moq;
using Xunit;
using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Models;
using Tripora.DestinationService.Repositories;
using Tripora.DestinationService.Services;
using Tripora.DestinationService.DTOs;

namespace Tripora.DestinationService.Tests;

public class InventoryManagementTests
{
    private readonly Mock<ITourRepository> _mockRepo;
    private readonly Mock<IValidationService> _mockValidation;
    private readonly Mock<ILogger<TourService>> _mockLogger;
    private readonly TourService _tourService;

    public InventoryManagementTests()
    {
        _mockRepo = new Mock<ITourRepository>();
        _mockValidation = new Mock<IValidationService>();
        _mockLogger = new Mock<ILogger<TourService>>();
        _tourService = new TourService(_mockRepo.Object, _mockValidation.Object, _mockLogger.Object);
    }

    [Fact]
    public async Task ReserveSlots_WhenRequestedExceedsAvailable_ShouldFailValidation()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var existingTour = new Tour { Id = tourId, Capacity = 10, AvailableSlots = 5 };
        
        _mockRepo.Setup(r => r.GetByIdAsync(tourId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTour);

        // Act
        var result = await _tourService.ReserveSlotsAsync(tourId, 10);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(TourOperationStatus.ValidationError, result.Status);
        Assert.Contains(result.Errors, e => e.Contains("Not enough available slots"));
        _mockRepo.Verify(r => r.UpdateAsync(It.IsAny<Tour>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ReserveSlots_WithValidCount_ShouldDecrementSuccessfully()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var existingTour = new Tour { Id = tourId, Capacity = 10, AvailableSlots = 5 };
        
        _mockRepo.Setup(r => r.GetByIdAsync(tourId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTour);
        _mockRepo.Setup(r => r.UpdateAsync(existingTour, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTour); // Modifies object in place

        // Act
        var result = await _tourService.ReserveSlotsAsync(tourId, 3);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(2, result.Data!.AvailableSlots);
        _mockRepo.Verify(r => r.UpdateAsync(existingTour, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task ReleaseSlots_WhenExceedingCapacity_ShouldFailValidation()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var existingTour = new Tour { Id = tourId, Capacity = 10, AvailableSlots = 8 };
        
        _mockRepo.Setup(r => r.GetByIdAsync(tourId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTour);

        // Act
        var result = await _tourService.ReleaseSlotsAsync(tourId, 5); // 8 + 5 = 13 > 10

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(TourOperationStatus.ValidationError, result.Status);
        Assert.Contains(result.Errors, e => e.Contains("Cannot release more slots than capacity allows"));
    }

    [Fact]
    public async Task UpdateTourCapacity_BelowBookedCount_ShouldFail()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var existingTour = new Tour { Id = tourId, Capacity = 20, AvailableSlots = 5 }; // Booked = 15
        var request = new CreateTourRequestDto { Capacity = 10 }; // Try dropping to 10

        _mockValidation.Setup(v => v.ValidateCreateTour(request))
            .Returns(new ValidationResult(true, new System.Collections.Generic.List<string>()));
        _mockRepo.Setup(r => r.GetByIdAsync(tourId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTour);

        // Act
        var result = await _tourService.UpdateTourAsync(tourId, request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(TourOperationStatus.ValidationError, result.Status);
        Assert.Contains(result.Errors, e => e.Contains("Cannot reduce capacity below currently booked slots"));
    }

    [Fact]
    public async Task ReserveSlots_ConcurrencyException_ShouldReturnFailure()
    {
        // Arrange
        var tourId = Guid.NewGuid();
        var existingTour = new Tour { Id = tourId, Capacity = 10, AvailableSlots = 5 };
        
        _mockRepo.Setup(r => r.GetByIdAsync(tourId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existingTour);
        _mockRepo.Setup(r => r.UpdateAsync(existingTour, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new DbUpdateConcurrencyException());

        // Act
        var result = await _tourService.ReserveSlotsAsync(tourId, 3);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(TourOperationStatus.ServerError, result.Status);
        Assert.Contains(result.Errors, e => e.Contains("Concurrency conflict"));
    }
}
