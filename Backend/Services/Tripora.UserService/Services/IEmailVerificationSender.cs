namespace Tripora.UserService.Services;

public interface IEmailVerificationSender
{
    Task SendVerificationCodeAsync(
        string recipientEmail,
        string verificationCode,
        DateTime expiresAtUtc,
        CancellationToken cancellationToken = default);
}
