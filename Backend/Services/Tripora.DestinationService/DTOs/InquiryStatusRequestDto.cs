using System.ComponentModel.DataAnnotations;

namespace Tripora.DestinationService.DTOs;

public sealed class InquiryStatusRequestDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}