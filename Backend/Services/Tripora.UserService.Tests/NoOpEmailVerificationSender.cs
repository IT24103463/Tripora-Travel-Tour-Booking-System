using Tripora.UserService.Services;

namespace Tripora.UserService.Tests;

internal sealed class NoOpEmailVerificationSender : IEmailVerificationSender
{
    public Task SendVerificationCodeAsync(string recipientEmail, string verificationCode, DateTime expiresAtUtc, CancellationToken cancellationToken = default) =>
        Task.CompletedTask;
}
