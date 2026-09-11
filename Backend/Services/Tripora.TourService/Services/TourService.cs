using Microsoft.Extensions.Logging;
using Tripora.TourService.DTOs;
using Tripora.TourService.Models;
using Tripora.TourService.Repositories;

namespace Tripora.TourService.Services;

public class TourService : ITourService
{
    private readonly ITourRepository _tourRepository;
    private readonly IValidationService _validationService;
    private readonly ILogger<TourService> _logger;

    public TourService(
        ITourRepository tourRepository,
        IValidationService validationService,
        ILogger<TourService> logger)
    {
        _tourRepository = tourRepository;
        _validationService = validationService;
        _logger = logger;
    }

    public async Task<TourOperationResult> CreateTourAsync(CreateTourRequestDto request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Creating new tour: {TourName}", request.Name);

        // Validate tour information
        var validationResult = _validationService.ValidateCreateTour(request);
        if (!validationResult.IsValid)
        {
            _logger.LogWarning("Tour creation failed validation for tour: {TourName}", request.Name);
            return TourOperationResult.ValidationFailed(validationResult.Errors);
        }

        try
        {
            var tour = new Tour
            {
                Name = request.Name.Trim(),
                Description = request.Description.Trim(),
                Destination = request.Destination.Trim(),
                Price = request.Price,
                DurationDays = request.DurationDays,
                Capacity = request.Capacity,
                ImageUrl = request.ImageUrl?.Trim()
            };

            var createdTour = await _tourRepository.CreateAsync(tour, cancellationToken);
            var responseDto = MapToResponseDto(createdTour);

            _logger.LogInformation("Tour created successfully: {TourId} - {TourName}", createdTour.Id, createdTour.Name);
            return TourOperationResult.Succeeded(responseDto, "Tour created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating tour: {TourName}", request.Name);
            return TourOperationResult.Failed("Failed to create tour. Please try again.");
        }
    }

    public async Task<List<TourResponseDto>> GetAllToursAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving all tours");
        
        var tours = await _tourRepository.GetAllAsync(cancellationToken);
        return tours.Select(MapToResponseDto).ToList();
    }

    public async Task<List<TourResponseDto>> GetActiveToursAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving active tours");
        
        var tours = await _tourRepository.GetActiveToursAsync(cancellationToken);
        return tours.Select(MapToResponseDto).ToList();
    }

    public async Task<TourResponseDto?> GetTourByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Retrieving tour by ID: {TourId}", id);
        
        var tour = await _tourRepository.GetByIdAsync(id, cancellationToken);
        return tour != null ? MapToResponseDto(tour) : null;
    }

    public async Task<TourOperationResult> UpdateTourAsync(Guid id, CreateTourRequestDto request, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Updating tour: {TourId}", id);

        // Validate tour information
        var validationResult = _validationService.ValidateCreateTour(request);
        if (!validationResult.IsValid)
        {
            _logger.LogWarning("Tour update failed validation for tour: {TourId}", id);
            return TourOperationResult.ValidationFailed(validationResult.Errors);
        }

        // Check if tour exists
        var existingTour = await _tourRepository.GetByIdAsync(id, cancellationToken);
        if (existingTour == null)
        {
            _logger.LogWarning("Tour not found for update: {TourId}", id);
            return TourOperationResult.NotFound("Tour not found.");
        }

        try
        {
            var updatedTour = new Tour
            {
                Id = id,
                Name = request.Name.Trim(),
                Description = request.Description.Trim(),
                Destination = request.Destination.Trim(),
                Price = request.Price,
                DurationDays = request.DurationDays,
                Capacity = request.Capacity,
                AvailableSlots = existingTour.AvailableSlots, // Preserve existing availability
                IsActive = existingTour.IsActive,
                ImageUrl = request.ImageUrl?.Trim()
            };

            var result = await _tourRepository.UpdateAsync(updatedTour, cancellationToken);
            if (result == null)
            {
                return TourOperationResult.NotFound("Tour not found.");
            }

            var responseDto = MapToResponseDto(result);
            _logger.LogInformation("Tour updated successfully: {TourId}", id);
            return TourOperationResult.Succeeded(responseDto, "Tour updated successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating tour: {TourId}", id);
            return TourOperationResult.Failed("Failed to update tour. Please try again.");
        }
    }

    public async Task<TourOperationResult> DeleteTourAsync(Guid id, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Deleting tour: {TourId}", id);

        // Check if tour exists
        var exists = await _tourRepository.ExistsAsync(id, cancellationToken);
        if (!exists)
        {
            _logger.LogWarning("Tour not found for deletion: {TourId}", id);
            return TourOperationResult.NotFound("Tour not found.");
        }

        try
        {
            var deleted = await _tourRepository.DeleteAsync(id, cancellationToken);
            if (!deleted)
            {
                return TourOperationResult.NotFound("Tour not found.");
            }

            _logger.LogInformation("Tour deleted successfully: {TourId}", id);
            return TourOperationResult.Succeeded(null!, "Tour deleted successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tour: {TourId}", id);
            return TourOperationResult.Failed("Failed to delete tour. Please try again.");
        }
    }

    private static TourResponseDto MapToResponseDto(Tour tour)
    {
        return new TourResponseDto
        {
            Id = tour.Id,
            Name = tour.Name,
            Description = tour.Description,
            Destination = tour.Destination,
            Price = tour.Price,
            DurationDays = tour.DurationDays,
            Capacity = tour.Capacity,
            AvailableSlots = tour.AvailableSlots,
            IsActive = tour.IsActive,
            ImageUrl = tour.ImageUrl,
            CreatedAt = tour.CreatedAt,
            UpdatedAt = tour.UpdatedAt
        };
    }
}