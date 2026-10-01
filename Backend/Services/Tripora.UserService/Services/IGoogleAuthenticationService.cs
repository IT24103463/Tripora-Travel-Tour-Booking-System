using Tripora.UserService.DTOs;

namespace Tripora.UserService.Services;

public enum GoogleLoginStatus
{
    Success,
    InvalidRequest,
    InvalidToken,
    UnverifiedEmail,
    CustomerOnly,
    Unavailable
}

public sealed class GoogleLoginResult
{
    public GoogleLoginStatus Status { get; init; }
    public string Message { get; init; } = string.Empty;
    public LoginResponseDto? Data { get; init; }

    public static GoogleLoginResult Failed(GoogleLoginStatus status, string message) => new() { Status = status, Message = message };
    public static GoogleLoginResult Succeeded(LoginResponseDto data) => new() { Status = GoogleLoginStatus.Success, Data = data, Message = "Google sign-in successful. Welcome to Tripora." };
}

public interface IGoogleAuthenticationService
{
    Task<GoogleLoginResult> LoginAsync(GoogleLoginRequestDto request, CancellationToken cancellationToken = default);
}
