namespace Tripora.DestinationService.DTOs;

public class UpdateHotelDto
{
    public string Name { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public int TotalRooms { get; set; }
    public bool IsActive { get; set; }
}
