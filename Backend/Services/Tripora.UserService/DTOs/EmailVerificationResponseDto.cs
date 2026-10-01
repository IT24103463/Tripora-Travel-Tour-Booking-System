namespace Tripora.UserService.DTOs;

public class EmailVerificationResponseDto
{
    public string Email { get; set; } = string.Empty;
    public bool IsEmailVerified { get; set; }
    public int RetryAfterSeconds { get; set; }
    public string Token { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public int ExpiresIn { get; set; }
    public UserResponseDto User { get; set; } = new();
}
