using System.ComponentModel.DataAnnotations;

namespace Tripora.DestinationService.DTOs;

public class OfferRequest : IValidatableObject
{
    [Required, StringLength(255)] public string Title { get; set; } = string.Empty;
    [Required, RegularExpression("^(Tour|Hotel|Package)$")] public string Category { get; set; } = string.Empty;
    public Guid TargetId { get; set; }
    [Range(0, 100)] public int DiscountPercentage { get; set; }
    [Range(typeof(decimal), "0.01", "9999999999.99")] public decimal OriginalPriceLKR { get; set; }
    [Range(typeof(decimal), "0.01", "9999999999.99")] public decimal OfferPriceLKR { get; set; }
    [Required, StringLength(100)] public string BadgeText { get; set; } = string.Empty;
    [StringLength(500), Url] public string? ImageUrl { get; set; }
    public string? SpecialInclusions { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IsActive { get; set; } = true;

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (TargetId == Guid.Empty)
            yield return new ValidationResult("A target item is required.", [nameof(TargetId)]);
        if (OfferPriceLKR > OriginalPriceLKR)
            yield return new ValidationResult("Offer price cannot exceed original price.", [nameof(OfferPriceLKR)]);
        if (EndDate <= StartDate)
            yield return new ValidationResult("End date must be after start date.", [nameof(EndDate)]);
    }
}
