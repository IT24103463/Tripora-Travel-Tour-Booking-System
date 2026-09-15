using System.ComponentModel.DataAnnotations;
namespace Tripora.DestinationService.Models;


public enum ItemStatus
{
    Available = 0,
    Full = 1,
    Unavailable = 2
}

public class Tour
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    public string Name { get; set; } = string.Empty;
    
    public string Description { get; set; } = string.Empty;
    
    public string Destination { get; set; } = string.Empty;
    
    public decimal Price { get; set; }
    
    public int DurationDays { get; set; }
    
    public int Capacity { get; set; }
    
    [ConcurrencyCheck]
    public int AvailableSlots { get; set; }
    
    public bool IsActive { get; set; } = true;
    
    public ItemStatus Status { get; set; } = ItemStatus.Available;
    
    [Timestamp]
    public byte[]? RowVersion { get; set; }
    
    public string? ImageUrl { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? UpdatedAt { get; set; }
    
    public DateTime? DeletedAt { get; set; }
}
