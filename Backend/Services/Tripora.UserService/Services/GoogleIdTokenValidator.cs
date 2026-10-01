using Google.Apis.Auth;
using Microsoft.Extensions.Options;
using Tripora.UserService.Configuration;

namespace Tripora.UserService.Services;

public sealed class GoogleIdTokenValidator : IGoogleIdTokenValidator
{
    private readonly GoogleAuthenticationOptions _options;

    public GoogleIdTokenValidator(IOptions<GoogleAuthenticationOptions> options)
    {
        _options = options.Value;
    }

    public async Task<GoogleIdentity> ValidateAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId))
        {
            throw new InvalidOperationException("Google authentication is not configured.");
        }

        var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, new GoogleJsonWebSignature.ValidationSettings
        {
            Audience = new[] { _options.ClientId }
        });

        return new GoogleIdentity(payload.Email ?? string.Empty, payload.Name, payload.EmailVerified);
    }
}
