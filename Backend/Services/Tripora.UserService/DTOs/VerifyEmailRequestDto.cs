using System.ComponentModel.DataAnnotations;

namespace Tripora.UserService.DTOs;

public class VerifyEmailRequestDto
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    [RegularExpression("^\\d{6}$", ErrorMessage = "Verification code must contain exactly six digits.")]
    public string Code { get; set; } = string.Empty;
}
