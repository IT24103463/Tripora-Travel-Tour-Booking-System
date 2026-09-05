namespace Tripora.TourService.DTOs;

public class CreateTourRequestDto
{
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public string Destination { get; set; } = string.Empty;
    
    public decimal Price { get; set; }
    
    public int DurationDays { get; set; }
    
    public int Capacity { get; set; }
    
    public string? ImageUrl { get; set; }
}