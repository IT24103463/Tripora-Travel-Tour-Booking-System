using System.ComponentModel.DataAnnotations;

namespace Tripora.DestinationService.DTOs;

public sealed class InquiryRequestDto
{
    [Required, MaxLength(150)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required, MaxLength(100)]
    public string Reason { get; set; } = string.Empty;

    [Required]
    public string Message { get; set; } = string.Empty;
}