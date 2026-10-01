namespace Tripora.DestinationService.Models;

public class TravelPackage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string PackageType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Destination { get; set; } = string.Empty;
    public int MinGuests { get; set; } = 1;
    public int MaxGuests { get; set; } = 10;
    public int DurationDays { get; set; } = 1;
    public int DurationNights { get; set; }
    public decimal PriceLKR { get; set; }
    public List<string> Inclusions { get; set; } = [];
    public string ImageUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
