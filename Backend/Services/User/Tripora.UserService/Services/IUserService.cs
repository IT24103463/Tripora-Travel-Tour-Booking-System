using Tripora.UserService.DTOs;

namespace Tripora.UserService.Services;

public enum RegistrationStatus
{
    Success,
    ValidationError,
    DuplicateEmail,
    ServerError
}

public class RegistrationResult
{
    public RegistrationStatus Status { get; init; }
    public bool IsSuccess => Status == RegistrationStatus.Success;
    public string Message { get; init; } = string.Empty;
    public UserResponseDto? User { get; init; }
    public List<string> Errors { get; init; } = new();

    public static RegistrationResult Succeeded(UserResponseDto user, string message = "Account created successfully.") =>
        new()
        {
            Status = RegistrationStatus.Success,
            Message = message,
            User = user,
            Errors = new List<string>()
        };

    public static RegistrationResult ValidationFailed(IEnumerable<string> errors) =>
        new()
        {
            Status = RegistrationStatus.ValidationError,
            Message = "Validation failed. Please correct the highlighted errors.",
            Errors = new List<string>(errors)
        };

    public static RegistrationResult DuplicateEmail(string message = "An account with this email address already exists.") =>
        new()
        {
            Status = RegistrationStatus.DuplicateEmail,
            Message = message,
            Errors = new List<string> { message }
        };

    public static RegistrationResult Failed(string message = "Account creation failed. Please try again.", IEnumerable<string>? errors = null) =>
        new()
        {
            Status = RegistrationStatus.ServerError,
            Message = message,
            Errors = errors != null ? new List<string>(errors) : new List<string> { message }
        };
}

public interface IUserService
{
    Task<RegistrationResult> RegisterAsync(RegisterUserRequestDto request, CancellationToken cancellationToken = default);
}
