using System.ComponentModel.DataAnnotations;

namespace Tripora.UserService.DTOs;

public sealed class GoogleLoginRequestDto
{
    [Required]
    public string IdToken { get; init; } = string.Empty;
}
