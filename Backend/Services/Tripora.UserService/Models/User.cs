namespace Tripora.UserService.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string FullName { get; set; } = string.Empty;
    
    public string Email { get; set; } = string.Empty;
    
    public string PasswordHash { get; set; } = string.Empty;
    
    public string Role { get; set; } = "Customer";

    public bool IsEmailVerified { get; set; }

    public string? VerificationTokenHash { get; set; }

    public DateTime? VerificationTokenExpiry { get; set; }

    public DateTime? VerificationTokenLastSentAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
}
