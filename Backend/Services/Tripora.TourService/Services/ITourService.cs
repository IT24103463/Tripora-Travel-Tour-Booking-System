using Tripora.TourService.DTOs;

namespace Tripora.TourService.Services;

public interface ITourService
{
    Task<TourOperationResult> CreateTourAsync(CreateTourRequestDto request, CancellationToken cancellationToken = default);
    Task<List<TourResponseDto>> GetAllToursAsync(CancellationToken cancellationToken = default);
    Task<List<TourResponseDto>> GetActiveToursAsync(CancellationToken cancellationToken = default);
    Task<TourResponseDto?> GetTourByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<TourOperationResult> UpdateTourAsync(Guid id, CreateTourRequestDto request, CancellationToken cancellationToken = default);
    Task<TourOperationResult> DeleteTourAsync(Guid id, CancellationToken cancellationToken = default);
}

public enum TourOperationStatus
{
    Success,
    ValidationError,
    NotFound,
    Unauthorized,
    ServerError
}

public class TourOperationResult
{
    public TourOperationStatus Status { get; init; }
    public bool IsSuccess => Status == TourOperationStatus.Success;
    public string Message { get; init; } = string.Empty;
    public TourResponseDto? Data { get; init; }
    public List<string> Errors { get; init; } = new();

    public static TourOperationResult Succeeded(TourResponseDto data, string message = "Tour operation completed successfully.") =>
        new()
        {
            Status = TourOperationStatus.Success,
            Message = message,
            Data = data,
            Errors = new List<string>()
        };

    public static TourOperationResult ValidationFailed(IEnumerable<string> errors) =>
        new()
        {
            Status = TourOperationStatus.ValidationError,
            Message = "Invalid tour information provided.",
            Errors = new List<string>(errors)
        };

    public static TourOperationResult NotFound(string message = "Tour not found.") =>
        new()
        {
            Status = TourOperationStatus.NotFound,
            Message = message,
            Errors = new List<string> { message }
        };

    public static TourOperationResult Unauthorized(string message = "Unauthorized access.") =>
        new()
        {
            Status = TourOperationStatus.Unauthorized,
            Message = message,
            Errors = new List<string> { message }
        };

    public static TourOperationResult Failed(string message = "Tour operation failed.", IEnumerable<string>? errors = null) =>
        new()
        {
            Status = TourOperationStatus.ServerError,
            Message = message,
            Errors = errors != null ? new List<string>(errors) : new List<string> { message }
        };
}