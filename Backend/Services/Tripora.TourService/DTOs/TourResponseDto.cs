namespace Tripora.TourService.DTOs;

public class TourResponseDto
{
    public Guid Id { get; set; }
    
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public string Destination { get; set; } = string.Empty;
    
    public decimal Price { get; set; }
    
    public int DurationDays { get; set; }
    
    public int Capacity { get; set; }
    
    public int AvailableSlots { get; set; }
    
    public bool IsActive { get; set; }
    
    public string? ImageUrl { get; set; }
    
    public DateTime CreatedAt { get; set; }
    
    public DateTime? UpdatedAt { get; set; }
}