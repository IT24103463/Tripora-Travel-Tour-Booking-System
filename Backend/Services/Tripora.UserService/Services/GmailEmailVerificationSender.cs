using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Options;
using MimeKit;
using System.Net;
using Tripora.UserService.Configuration;

namespace Tripora.UserService.Services;

public sealed class GmailEmailVerificationSender : IEmailVerificationSender
{
    private readonly EmailSettings _settings;

    public GmailEmailVerificationSender(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendVerificationCodeAsync(
        string recipientEmail,
        string verificationCode,
        DateTime expiresAtUtc,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_settings.SenderEmail) || string.IsNullOrWhiteSpace(_settings.Password))
        {
            throw new InvalidOperationException("Email verification delivery is not configured.");
        }

        var message = BuildVerificationMessage(
            _settings.SenderName,
            _settings.SenderEmail,
            recipientEmail,
            verificationCode,
            expiresAtUtc);

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(
                _settings.Host,
                _settings.Port,
                _settings.UseStartTls ? SecureSocketOptions.StartTls : SecureSocketOptions.Auto,
                cancellationToken);
            await client.AuthenticateAsync(_settings.SenderEmail, _settings.Password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
        }
        finally
        {
            if (client.IsConnected)
            {
                await client.DisconnectAsync(true, cancellationToken);
            }
        }
    }

    public static MimeMessage BuildVerificationMessage(
        string senderName,
        string senderEmail,
        string recipientEmail,
        string verificationCode,
        DateTime expiresAtUtc)
    {
        var safeCode = verificationCode.Trim();
        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(senderName, senderEmail));
        message.To.Add(MailboxAddress.Parse(recipientEmail));
        message.Subject = "Your Tripora email verification code";

        var builder = new BodyBuilder
        {
            TextBody = $"Hello Traveler,\n\nYour Tripora verification code is: {safeCode}\n\nThis code expires in 10 minutes. If you did not request this code, you can safely disregard this email.",
            HtmlBody = $"""
                <!doctype html>
                <html>
                  <body style=\"margin:0;background:#f7fafc;color:#172033;font-family:Arial,sans-serif;\">
                    <main style=\"max-width:520px;margin:24px auto;padding:32px;background:#ffffff;border:1px solid #dbe4ee;border-radius:12px;\">
                      <p style=\"margin:0 0 16px;\">Hello Traveler,</p>
                      <p style=\"margin:0 0 16px;\">Your Tripora verification code is:</p>
                      <p style=\"margin:0 0 20px;font-size:28px;font-weight:700;letter-spacing:0.2em;color:#0f766e;\">{WebUtility.HtmlEncode(safeCode)}</p>
                      <p style=\"margin:0;line-height:1.5;\">This code expires in 10 minutes. If you did not request this code, you can safely disregard this email.</p>
                    </main>
                  </body>
                </html>
                """
        };

        message.Body = builder.ToMessageBody();
        return message;
    }
}
