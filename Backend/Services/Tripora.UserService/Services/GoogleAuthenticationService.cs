using Microsoft.Extensions.Options;
using Tripora.UserService.Configuration;
using Tripora.UserService.DTOs;
using Tripora.UserService.Models;
using Tripora.UserService.Repositories;

namespace Tripora.UserService.Services;

public sealed class GoogleAuthenticationService : IGoogleAuthenticationService
{
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokens;
    private readonly IGoogleIdTokenValidator _googleTokens;
    private readonly JwtOptions _jwtOptions;
    private readonly IClock _clock;
    private readonly ILogger<GoogleAuthenticationService> _logger;

    public GoogleAuthenticationService(
        IUserRepository users,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokens,
        IGoogleIdTokenValidator googleTokens,
        IOptions<JwtOptions> jwtOptions,
        IClock clock,
        ILogger<GoogleAuthenticationService> logger)
    {
        _users = users;
        _passwordHasher = passwordHasher;
        _jwtTokens = jwtTokens;
        _googleTokens = googleTokens;
        _jwtOptions = jwtOptions.Value;
        _clock = clock;
        _logger = logger;
    }

    public async Task<GoogleLoginResult> LoginAsync(GoogleLoginRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.IdToken))
        {
            return GoogleLoginResult.Failed(GoogleLoginStatus.InvalidRequest, "Google credential is required.");
        }

        GoogleIdentity identity;
        try
        {
            identity = await _googleTokens.ValidateAsync(request.IdToken, cancellationToken);
        }
        catch (InvalidOperationException exception)
        {
            _logger.LogError(exception, "Google sign-in is unavailable because configuration is missing.");
            return GoogleLoginResult.Failed(GoogleLoginStatus.Unavailable, "Google sign-in is not configured.");
        }
        catch (Exception exception)
        {
            _logger.LogWarning(exception, "Google ID token validation failed.");
            return GoogleLoginResult.Failed(GoogleLoginStatus.InvalidToken, "Invalid Google token.");
        }

        if (string.IsNullOrWhiteSpace(identity.Email))
        {
            return GoogleLoginResult.Failed(GoogleLoginStatus.InvalidToken, "Google did not provide an email address.");
        }

        if (!identity.IsEmailVerified)
        {
            return GoogleLoginResult.Failed(GoogleLoginStatus.UnverifiedEmail, "Your Google email address must be verified before signing in.");
        }

        var email = identity.Email.Trim().ToLowerInvariant();
        var user = await _users.GetByEmailAsync(email, cancellationToken);
        if (user is not null && !string.Equals(user.Role, "Customer", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogWarning("Google sign-in rejected for non-customer account {Email}.", email);
            return GoogleLoginResult.Failed(GoogleLoginStatus.CustomerOnly, "Google sign-in is available for customer accounts only.");
        }

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = email,
                FullName = string.IsNullOrWhiteSpace(identity.FullName) ? "Google User" : identity.FullName.Trim(),
                Role = "Customer",
                PasswordHash = _passwordHasher.HashPassword(Guid.NewGuid().ToString("N")),
                IsEmailVerified = true,
                CreatedAt = _clock.UtcNow
            };
            user = await _users.CreateAsync(user, cancellationToken);
        }
        else if (!user.IsEmailVerified)
        {
            user.IsEmailVerified = true;
            user.VerificationTokenHash = null;
            user.VerificationTokenExpiry = null;
            user.VerificationTokenLastSentAt = null;
            user.UpdatedAt = _clock.UtcNow;
            await _users.UpdateAsync(user, cancellationToken);
        }

        var response = new LoginResponseDto
        {
            Token = _jwtTokens.GenerateToken(user),
            TokenType = "Bearer",
            ExpiresIn = _jwtOptions.ExpiryMinutes * 60,
            Email = user.Email,
            User = new UserResponseDto
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role,
                CreatedAt = user.CreatedAt,
                IsEmailVerified = user.IsEmailVerified
            }
        };

        return GoogleLoginResult.Succeeded(response);
    }
}
