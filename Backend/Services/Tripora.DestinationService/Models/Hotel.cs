using System.ComponentModel.DataAnnotations;
using System;

namespace Tripora.DestinationService.Models;

public class Hotel
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public decimal PricePerNight { get; set; }
    public int TotalRooms { get; set; }
    [ConcurrencyCheck]
    public int AvailableRooms { get; set; }
    public bool IsActive { get; set; } = true;
    public ItemStatus Status { get; set; } = ItemStatus.Available;
    [Timestamp]
    public byte[]? RowVersion { get; set; }
    public string? ImageUrl { get; set; }
    public double Rating { get; set; } = 0.0;
    public string Amenities { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}


