namespace Tripora.UserService.Configuration;

public sealed class EmailSettings
{
    public const string SectionName = "EmailSettings";

    public string Host { get; init; } = "smtp.gmail.com";
    public int Port { get; init; } = 587;
    public string SenderEmail { get; init; } = string.Empty;
    public string Password { get; init; } = string.Empty;
    public string SenderName { get; init; } = "Tripora Travel & Tours";
    public bool UseStartTls { get; init; } = true;
}
