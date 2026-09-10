namespace Tripora.TourService.Models;

public class Tour
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public string Destination { get; set; } = string.Empty;
    
    public decimal Price { get; set; }
    
    public int DurationDays { get; set; }
    
    public int Capacity { get; set; }
    
    public int AvailableSlots { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public string? ImageUrl { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    public DateTime? DeletedAt { get; set; }
}