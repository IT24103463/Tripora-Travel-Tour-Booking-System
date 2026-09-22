using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Services;
using static Tripora.DestinationService.Services.TourOperationStatus;

namespace Tripora.DestinationService.Controllers;

[ApiController]
[Route("api/tours")]
[Produces("application/json")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tourService;
    private readonly ILogger<ToursController> _logger;
    private readonly IConfiguration _configuration;

    public ToursController(ITourService tourService, ILogger<ToursController> logger, IConfiguration? configuration = null)
    {
        _tourService = tourService;
        _logger = logger;
        _configuration = configuration ?? new ConfigurationBuilder().Build();
    }

    [HttpPatch("{id}/book")]
    [AllowAnonymous]
    public async Task<IActionResult> BookTour(Guid id, [FromBody] BookRequestDto req, CancellationToken cancellationToken)
    {
        var result = await _tourService.ReserveSlotsAsync(id, req.Quantity, cancellationToken);
        if (result.Status == TourOperationStatus.ValidationError)
            return BadRequest("Not enough capacity");
        if (result.Status == TourOperationStatus.NotFound)
            return NotFound();

        return Ok(result.Data);
    }

    /// <summary>
    /// Creates a new tour (Admin only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> CreateTour([FromBody] CreateTourRequestDto request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received tour creation request for: {TourName}", request.Name);

        var result = await _tourService.CreateTourAsync(request, cancellationToken);

        return result.Status switch
        {
            TourOperationStatus.Success => StatusCode(
                StatusCodes.Status201Created,
                ApiResponse<TourResponseDto>.SuccessResponse(result.Data!, result.Message)),

            TourOperationStatus.ValidationError => BadRequest(
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),

            TourOperationStatus.Unauthorized => StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    /// <summary>
    /// Retrieves all tours (public access)
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<TourResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<TourResponseDto>>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetAllTours(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received request to retrieve all tours");

        try
        {
            var tours = await _tourService.GetAllToursAsync(cancellationToken);
            return Ok(ApiResponse<List<TourResponseDto>>.SuccessResponse(tours, "Tours retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving all tours");
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<List<TourResponseDto>>.FailureResponse("Failed to retrieve tours."));
        }
    }

    /// <summary>
    /// Retrieves active tours only (public access)
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(ApiResponse<List<TourResponseDto>>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<List<TourResponseDto>>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetActiveTours(CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received request to retrieve active tours");

        try
        {
            var tours = await _tourService.GetActiveToursAsync(cancellationToken);
            return Ok(ApiResponse<List<TourResponseDto>>.SuccessResponse(tours, "Active tours retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving active tours");
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<List<TourResponseDto>>.FailureResponse("Failed to retrieve active tours."));
        }
    }

    /// <summary>
    /// Retrieves a specific tour by ID (public access)
    /// </summary>
    [HttpGet("{id}")]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> GetTourById(Guid id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received request to retrieve tour: {TourId}", id);

        try
        {
            var tour = await _tourService.GetTourByIdAsync(id, cancellationToken);
            if (tour == null)
            {
                return NotFound(ApiResponse<TourResponseDto>.FailureResponse("Tour not found."));
            }

            return Ok(ApiResponse<TourResponseDto>.SuccessResponse(tour, "Tour retrieved successfully."));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving tour: {TourId}", id);
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<TourResponseDto>.FailureResponse("Failed to retrieve tour."));
        }
    }

    /// <summary>
    /// Updates an existing tour (Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> UpdateTour(Guid id, [FromBody] CreateTourRequestDto request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received tour update request for: {TourId}", id);

        var result = await _tourService.UpdateTourAsync(id, request, cancellationToken);

        return result.Status switch
        {
            TourOperationStatus.Success => Ok(
                ApiResponse<TourResponseDto>.SuccessResponse(result.Data!, result.Message)),

            TourOperationStatus.ValidationError => BadRequest(
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),

            TourOperationStatus.NotFound => NotFound(
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),

            TourOperationStatus.Unauthorized => StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    /// <summary>
    /// Deletes a tour (Admin only)
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> DeleteTour(Guid id, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received tour deletion request for: {TourId}", id);

        var result = await _tourService.DeleteTourAsync(id, cancellationToken);

        return result.Status switch
        {
            TourOperationStatus.Success => Ok(
                ApiResponse<TourResponseDto>.SuccessResponse(result.Data!, result.Message)),

            TourOperationStatus.NotFound => NotFound(
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),

            TourOperationStatus.Unauthorized => StatusCode(
                StatusCodes.Status403Forbidden,
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    [HttpPost("{id}/reserve")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReserveSlots(Guid id, [FromQuery] int count, CancellationToken cancellationToken)
    {
        if (!HasInternalServiceKey()) return Unauthorized();
        var result = await _tourService.ReserveSlotsAsync(id, count, cancellationToken);
        return result.Status switch
        {
            TourOperationStatus.Success => Ok(ApiResponse<TourResponseDto>.SuccessResponse(result.Data!, result.Message)),
            TourOperationStatus.NotFound => NotFound(ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),
            TourOperationStatus.ValidationError => BadRequest(ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),
            _ => StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    [HttpPatch("{id}/decrement-inventory")]
    [AllowAnonymous]
    public Task<IActionResult> DecrementInventory(Guid id, [FromQuery] int count, CancellationToken cancellationToken) =>
        ReserveSlots(id, count, cancellationToken);

    [HttpPost("{id}/release")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ApiResponse<TourResponseDto>), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReleaseSlots(Guid id, [FromQuery] int count, CancellationToken cancellationToken)
    {
        if (!HasInternalServiceKey()) return Unauthorized();
        var result = await _tourService.ReleaseSlotsAsync(id, count, cancellationToken);
        return result.Status switch
        {
            TourOperationStatus.Success => Ok(ApiResponse<TourResponseDto>.SuccessResponse(result.Data!, result.Message)),
            TourOperationStatus.NotFound => NotFound(ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),
            TourOperationStatus.ValidationError => BadRequest(ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors)),
            _ => StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<TourResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    [HttpPut("{id}/availability")]
    [Authorize(Roles = "Admin")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAvailability(Guid id, [FromBody] UpdateAvailabilityRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _tourService.UpdateAvailabilityAsync(id, request, cancellationToken);
        if (result.Status == TourOperationStatus.NotFound) return NotFound(result.Message);
        if (result.Status == TourOperationStatus.ValidationError) return BadRequest(result.Errors);
        return Ok(result.Data);
    }

    [HttpPost("{id}/reserve-tour")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ReserveTour(Guid id, [FromQuery] int count, CancellationToken cancellationToken)
    {
        var result = await _tourService.ReserveTourAsync(id, count, cancellationToken);
        if (result.Status == TourOperationStatus.NotFound)
            return NotFound(result.Message);

        if (result.Status == TourOperationStatus.ValidationError)
        {
            if (result.Errors.Contains("Concurrency conflict. Please try again."))
                return Conflict(result.Errors);
            return BadRequest(result.Errors);
        }

        return Ok(result.Data);
    }

    [HttpPost("{id}/release-tour")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReleaseTour(Guid id, [FromQuery] int count, CancellationToken cancellationToken)
    {
        var result = await _tourService.ReleaseTourAsync(id, count, cancellationToken);
        if (result.Status == TourOperationStatus.NotFound)
            return NotFound(result.Message);

        if (result.Status == TourOperationStatus.ValidationError)
            return BadRequest(result.Errors);

        return Ok(result.Data);
    }

    private bool HasInternalServiceKey() =>
        Request.Headers.TryGetValue("X-Internal-Service-Key", out var key) &&
        key == _configuration["InternalServiceApiKey"];
}