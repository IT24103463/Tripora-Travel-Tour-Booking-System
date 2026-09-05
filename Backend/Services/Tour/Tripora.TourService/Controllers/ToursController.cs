using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tripora.TourService.DTOs;
using Tripora.TourService.Services;

namespace Tripora.TourService.Controllers;

[ApiController]
[Route("api/tours")]
[Produces("application/json")]
public class ToursController : ControllerBase
{
    private readonly ITourService _tourService;
    private readonly ILogger<ToursController> _logger;

    public ToursController(ITourService tourService, ILogger<ToursController> logger)
    {
        _tourService = tourService;
        _logger = logger;
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
}