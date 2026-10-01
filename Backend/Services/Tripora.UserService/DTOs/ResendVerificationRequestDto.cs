using System.ComponentModel.DataAnnotations;

namespace Tripora.UserService.DTOs;

public class ResendVerificationRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;
}
