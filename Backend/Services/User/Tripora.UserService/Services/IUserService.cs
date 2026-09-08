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

public enum LoginStatus
{
    Success,
    ValidationError,
    AccountNotFound,
    InvalidPassword,
    ServerError
}

public class LoginResult
{
    public LoginStatus Status { get; init; }
    public bool IsSuccess => Status == LoginStatus.Success;
    public string Message { get; init; } = string.Empty;
    public LoginResponseDto? Data { get; init; }
    public List<string> Errors { get; init; } = new();

    public static LoginResult Succeeded(LoginResponseDto data, string message = "Authentication successful.") =>
        new()
        {
            Status = LoginStatus.Success,
            Message = message,
            Data = data,
            Errors = new List<string>()
        };

    public static LoginResult ValidationFailed(IEnumerable<string> errors) =>
        new()
        {
            Status = LoginStatus.ValidationError,
            Message = "Invalid login credentials provided.",
            Errors = new List<string>(errors)
        };

    public static LoginResult AccountNotFound(string message = "No account found with this email address. Please check your email or create an account.") =>
        new()
        {
            Status = LoginStatus.AccountNotFound,
            Message = message,
            Errors = new List<string> { message }
        };

    public static LoginResult InvalidPassword(string message = "Incorrect password. Please verify your password and try again.") =>
        new()
        {
            Status = LoginStatus.InvalidPassword,
            Message = message,
            Errors = new List<string> { message }
        };

    public static LoginResult Failed(string message = "Authentication service temporarily unavailable. Please try again.", IEnumerable<string>? errors = null) =>
        new()
        {
            Status = LoginStatus.ServerError,
            Message = message,
            Errors = errors != null ? new List<string>(errors) : new List<string> { message }
        };
}

public interface IUserService
{
    Task<RegistrationResult> RegisterAsync(RegisterUserRequestDto request, CancellationToken cancellationToken = default);
    Task<LoginResult> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default);
    Task<UserResponseDto?> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);
}
