namespace Tripora.DestinationService.Models;

public class Offer
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    public int DiscountPercentage { get; set; }
    public decimal OriginalPriceLKR { get; set; }
    public decimal OfferPriceLKR { get; set; }
    public string BadgeText { get; set; } = string.Empty;
    public string? ImageUrl { get; set; }
    public string? SpecialInclusions { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
