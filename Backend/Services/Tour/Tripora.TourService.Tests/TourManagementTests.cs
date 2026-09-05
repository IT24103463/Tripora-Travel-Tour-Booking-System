using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Tripora.TourService.Controllers;
using Tripora.TourService.Data;
using Tripora.TourService.DTOs;
using Tripora.TourService.Models;
using Tripora.TourService.Repositories;
using Tripora.TourService.Services;
using Xunit;

namespace Tripora.TourService.Tests;

public class TourManagementTests : IDisposable
{
    private readonly TourDbContext _dbContext;
    private readonly ITourRepository _tourRepository;
    private readonly IValidationService _validationService;
    private readonly ITourService _tourService;
    private readonly ToursController _controller;

    public TourManagementTests()
    {
        var options = new DbContextOptionsBuilder<TourDbContext>()
            .UseInMemoryDatabase(databaseName: $"Tripora_Tour_Test_Db_{Guid.NewGuid()}")
            .Options;

        _dbContext = new TourDbContext(options);
        _dbContext.Database.EnsureCreated();

        _tourRepository = new TourRepository(_dbContext);
        _validationService = new ValidationService();
        _tourService = new TourService(_tourRepository, _validationService, NullLogger<TourService>.Instance);
        _controller = new ToursController(_tourService, NullLogger<ToursController>.Instance);
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    private async Task<Tour> CreateTestTourAsync(string name = "Test Tour")
    {
        var tour = new Tour
        {
            Name = name,
            Description = "A wonderful test tour experience",
            Destination = "Test Destination",
            Price = 999.99m,
            DurationDays = 7,
            Capacity = 20,
            AvailableSlots = 20,
            IsActive = true
        };
        return await _tourRepository.CreateAsync(tour);
    }

    #region Scenario 1 – Create Tour

    [Fact]
    public async Task Scenario1_GivenAdminProvidesValidTourInfo_WhenAdminSubmitsTour_ThenTourCreatedSuccessfully()
    {
        // Arrange
        var createRequest = new CreateTourRequestDto
        {
            Name = "European Adventure",
            Description = "Explore the beautiful cities of Europe",
            Destination = "Paris, France",
            Price = 2499.99m,
            DurationDays = 14,
            Capacity = 30,
            ImageUrl = "https://example.com/tour-image.jpg"
        };

        // Act
        var result = await _tourService.CreateTourAsync(createRequest);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(TourOperationStatus.Success, result.Status);
        Assert.NotNull(result.Data);
        Assert.Equal("European Adventure", result.Data.Name);
        Assert.Equal("Paris, France", result.Data.Destination);
        Assert.Equal(2499.99m, result.Data.Price);
        Assert.Equal(14, result.Data.DurationDays);
        Assert.Equal(30, result.Data.Capacity);
        Assert.Equal(30, result.Data.AvailableSlots); // Initially equal to capacity
        Assert.True(result.Data.IsActive);
    }

    #endregion

    #region Scenario 2 – Invalid Tour

    [Fact]
    public async Task Scenario2_GivenRequiredTourInfoMissing_WhenAdminSubmitsTour_ThenRequestRejectedWithError()
    {
        // Arrange - Missing required fields
        var invalidRequest = new CreateTourRequestDto
        {
            Name = "", // Missing name
            Description = "", // Missing description
            Destination = "", // Missing destination
            Price = 0, // Invalid price
            DurationDays = 0, // Invalid duration
            Capacity = 0 // Invalid capacity
        };

        // Act
        var result = await _tourService.CreateTourAsync(invalidRequest);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(TourOperationStatus.ValidationError, result.Status);
        Assert.Null(result.Data);
        Assert.True(result.Errors.Count > 0);
        Assert.Contains("Tour Name is required", result.Errors);
        Assert.Contains("Description is required", result.Errors);
        Assert.Contains("Destination is required", result.Errors);
    }

    [Fact]
    public async Task Scenario2_GivenInvalidTourData_WhenAdminSubmitsTour_ThenValidationErrorsDisplayed()
    {
        // Arrange - Invalid data
        var invalidRequest = new CreateTourRequestDto
        {
            Name = "AB", // Too short
            Description = "Short", // Too short
            Destination = "X", // Too short
            Price = -100, // Negative price
            DurationDays = 400, // Too long
            Capacity = 2000, // Too large
            ImageUrl = "not-a-valid-url" // Invalid URL
        };

        // Act
        var result = await _tourService.CreateTourAsync(invalidRequest);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(TourOperationStatus.ValidationError, result.Status);
        Assert.True(result.Errors.Count > 0);
        Assert.Contains("Tour Name must be at least 3 characters", result.Errors);
        Assert.Contains("Description must be at least 10 characters", result.Errors);
        Assert.Contains("Destination must be at least 2 characters", result.Errors);
        Assert.Contains("Price must be greater than zero", result.Errors);
    }

    #endregion

    #region Scenario 3 – Retrieve Tours

    [Fact]
    public async Task Scenario3_GivenToursExist_WhenCustomerRequestsAvailableTours_ThenServiceReturnsTourInfo()
    {
        // Arrange - Create multiple tours
        await CreateTestTourAsync("Tour 1");
        await CreateTestTourAsync("Tour 2");
        await CreateTestTourAsync("Tour 3");

        // Act
        var tours = await _tourService.GetAllToursAsync();

        // Assert
        Assert.NotNull(tours);
        Assert.Equal(3, tours.Count);
        Assert.All(tours, tour => Assert.NotNull(tour.Id));
        Assert.All(tours, tour => Assert.NotEmpty(tour.Name));
    }

    [Fact]
    public async Task Scenario3_GivenActiveToursExist_WhenCustomerRequestsActiveTours_ThenOnlyActiveToursReturned()
    {
        // Arrange - Create active and inactive tours
        var activeTour = await CreateTestTourAsync("Active Tour");
        var inactiveTour = await CreateTestTourAsync("Inactive Tour");
        inactiveTour.IsActive = false;
        await _tourRepository.UpdateAsync(inactiveTour);

        // Act
        var activeTours = await _tourService.GetActiveToursAsync();

        // Assert
        Assert.NotNull(activeTours);
        Assert.Single(activeTours);
        Assert.Equal("Active Tour", activeTours[0].Name);
        Assert.True(activeTours[0].IsActive);
    }

    [Fact]
    public async Task Scenario3_GivenSpecificTourExists_WhenCustomerRequestsTourById_ThenCorrectTourReturned()
    {
        // Arrange
        var createdTour = await CreateTestTourAsync("Specific Tour");

        // Act
        var retrievedTour = await _tourService.GetTourByIdAsync(createdTour.Id);

        // Assert
        Assert.NotNull(retrievedTour);
        Assert.Equal(createdTour.Id, retrievedTour.Id);
        Assert.Equal("Specific Tour", retrievedTour.Name);
        Assert.Equal(createdTour.Destination, retrievedTour.Destination);
    }

    #endregion

    #region Scenario 4 – Unauthorized Management

    [Fact]
    public async Task Scenario4_GivenUserNotAuthorizedAsAdmin_WhenUserAttemptsCreateTour_ThenOperationDenied()
    {
        // Arrange - Simulate non-admin user context
        var claims = new[] { new Claim(ClaimTypes.Role, "Customer") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var createRequest = new CreateTourRequestDto
        {
            Name = "Unauthorized Tour",
            Description = "This should not be created",
            Destination = "Nowhere",
            Price = 100m,
            DurationDays = 5,
            Capacity = 10
        };

        // Act
        var result = await _controller.CreateTour(createRequest, CancellationToken.None);

        // Assert - Should return 403 Forbidden due to [Authorize(Roles = "Admin")]
        var forbiddenResult = Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Scenario4_GivenUserNotAuthorizedAsAdmin_WhenUserAttemptsUpdateTour_ThenOperationDenied()
    {
        // Arrange - Create a tour and simulate non-admin user
        var tour = await CreateTestTourAsync("Test Tour");
        var claims = new[] { new Claim(ClaimTypes.Role, "Customer") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        var updateRequest = new CreateTourRequestDto
        {
            Name = "Updated Tour",
            Description = "Updated description",
            Destination = "Updated destination",
            Price = 200m,
            DurationDays = 10,
            Capacity = 20
        };

        // Act
        var result = await _controller.UpdateTour(tour.Id, updateRequest, CancellationToken.None);

        // Assert - Should return 403 Forbidden
        var forbiddenResult = Assert.IsType<ForbidResult>(result);
    }

    [Fact]
    public async Task Scenario4_GivenUserNotAuthorizedAsAdmin_WhenUserAttemptsDeleteTour_ThenOperationDenied()
    {
        // Arrange - Create a tour and simulate non-admin user
        var tour = await CreateTestTourAsync("Test Tour");
        var claims = new[] { new Claim(ClaimTypes.Role, "Customer") };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var result = await _controller.DeleteTour(tour.Id, CancellationToken.None);

        // Assert - Should return 403 Forbidden
        var forbiddenResult = Assert.IsType<ForbidResult>(result);
    }

    #endregion

    #region Scenario 5 – Tour Service API

    [Fact]
    public async Task Scenario5_GivenTourServiceRunning_WhenValidApiRequestSent_ThenAppropriateTourInfoReturned()
    {
        // Arrange - Create a tour
        var createdTour = await CreateTestTourAsync("API Test Tour");

        // Act - Test GET all tours endpoint
        var getAllResult = await _controller.GetAllTours(CancellationToken.None);
        var okAllResult = Assert.IsType<OkObjectResult>(getAllResult);
        var allApiResponse = Assert.IsType<ApiResponse<List<TourResponseDto>>>(okAllResult.Value);
        Assert.True(allApiResponse.Success);
        Assert.NotNull(allApiResponse.Data);
        Assert.Single(allApiResponse.Data);

        // Act - Test GET by ID endpoint
        var getByIdResult = await _controller.GetTourById(createdTour.Id, CancellationToken.None);
        var okByIdResult = Assert.IsType<OkObjectResult>(getByIdResult);
        var byIdApiResponse = Assert.IsType<ApiResponse<TourResponseDto>>(okByIdResult.Value);
        Assert.True(byIdApiResponse.Success);
        Assert.NotNull(byIdApiResponse.Data);
        Assert.Equal("API Test Tour", byIdApiResponse.Data.Name);

        // Act - Test GET active tours endpoint
        var getActiveResult = await _controller.GetActiveTours(CancellationToken.None);
        var okActiveResult = Assert.IsType<OkObjectResult>(getActiveResult);
        var activeApiResponse = Assert.IsType<ApiResponse<List<TourResponseDto>>>(okActiveResult.Value);
        Assert.True(activeApiResponse.Success);
        Assert.NotNull(activeApiResponse.Data);
        Assert.Single(activeApiResponse.Data);
    }

    [Fact]
    public async Task Scenario5_GivenInvalidTourId_WhenApiRequestSent_ThenNotFoundResponseReturned()
    {
        // Arrange
        var nonExistentId = Guid.NewGuid();

        // Act
        var result = await _controller.GetTourById(nonExistentId, CancellationToken.None);

        // Assert
        var notFoundResult = Assert.IsType<NotFoundObjectResult>(result);
        var apiResponse = Assert.IsType<ApiResponse<TourResponseDto>>(notFoundResult.Value);
        Assert.False(apiResponse.Success);
        Assert.Contains("not found", apiResponse.Message.ToLower());
    }

    #endregion

    #region Additional Test Cases

    [Fact]
    public async Task Test_UpdateTour_WithValidData_UpdatesSuccessfully()
    {
        // Arrange
        var tour = await CreateTestTourAsync("Original Name");
        var updateRequest = new CreateTourRequestDto
        {
            Name = "Updated Name",
            Description = "Updated description",
            Destination = "Updated destination",
            Price = 1500m,
            DurationDays = 10,
            Capacity = 25
        };

        // Act
        var result = await _tourService.UpdateTourAsync(tour.Id, updateRequest);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal("Updated Name", result.Data.Name);
        Assert.Equal("Updated description", result.Data.Description);
        Assert.Equal(1500m, result.Data.Price);
    }

    [Fact]
    public async Task Test_DeleteTour_WithValidId_DeletesSuccessfully()
    {
        // Arrange
        var tour = await CreateTestTourAsync("To Be Deleted");

        // Act
        var result = await _tourService.DeleteTourAsync(tour.Id);

        // Assert
        Assert.True(result.IsSuccess);
        
        // Verify tour is soft-deleted
        var deletedTour = await _tourRepository.GetByIdAsync(tour.Id);
        Assert.Null(deletedTour); // Should return null due to soft delete filter
    }

    [Fact]
    public async Task Test_TourRepository_PreservesAvailabilityOnUpdate()
    {
        // Arrange
        var tour = await CreateTestTourAsync("Availability Test");
        tour.AvailableSlots = 15; // Simulate some bookings
        await _tourRepository.UpdateAsync(tour);

        // Act
        var updateRequest = new CreateTourRequestDto
        {
            Name = tour.Name,
            Description = tour.Description,
            Destination = tour.Destination,
            Price = tour.Price,
            DurationDays = tour.DurationDays,
            Capacity = tour.Capacity
        };

        var result = await _tourService.UpdateTourAsync(tour.Id, updateRequest);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(15, result.Data.AvailableSlots); // Should preserve existing availability
    }

    #endregion
}