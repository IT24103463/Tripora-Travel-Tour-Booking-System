namespace Tripora.BookingService.DTOs;

public class UpdateStatusDto
{
    public string Status { get; set; } = string.Empty; // "Confirmed", "Completed", "Cancelled"
}
