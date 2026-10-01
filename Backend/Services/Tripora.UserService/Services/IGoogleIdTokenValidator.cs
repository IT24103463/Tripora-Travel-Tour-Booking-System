namespace Tripora.UserService.Services;

public sealed record GoogleIdentity(string Email, string? FullName, bool IsEmailVerified);

public interface IGoogleIdTokenValidator
{
    Task<GoogleIdentity> ValidateAsync(string idToken, CancellationToken cancellationToken = default);
}
