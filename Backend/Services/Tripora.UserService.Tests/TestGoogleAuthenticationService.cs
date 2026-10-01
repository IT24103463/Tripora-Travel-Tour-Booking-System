using Tripora.UserService.DTOs;
using Tripora.UserService.Services;

namespace Tripora.UserService.Tests;

internal sealed class TestGoogleAuthenticationService : IGoogleAuthenticationService
{
    public Task<GoogleLoginResult> LoginAsync(GoogleLoginRequestDto request, CancellationToken cancellationToken = default) =>
        Task.FromResult(GoogleLoginResult.Failed(GoogleLoginStatus.Unavailable, "Google sign-in is unavailable in this test."));
}
