using System.ComponentModel.DataAnnotations;

namespace Tripora.DestinationService.DTOs;

public class TravelPackageRequest
{
    [Required, StringLength(255)] public string Name { get; set; } = string.Empty;
    [Required, RegularExpression("^(DayOut|CoupleEscape|FriendsHangout|MultiDayTrip)$")] public string PackageType { get; set; } = string.Empty;
    [Required] public string Description { get; set; } = string.Empty;
    [Required, StringLength(255)] public string Destination { get; set; } = string.Empty;
    [Range(1, 1000)] public int MinGuests { get; set; } = 1;
    [Range(1, 1000)] public int MaxGuests { get; set; } = 10;
    [Range(1, 365)] public int DurationDays { get; set; } = 1;
    [Range(0, 364)] public int DurationNights { get; set; }
    [Range(typeof(decimal), "0.01", "9999999999.99")] public decimal PriceLKR { get; set; }
    public List<string> Inclusions { get; set; } = [];
    [Required, StringLength(500), Url] public string ImageUrl { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
}
