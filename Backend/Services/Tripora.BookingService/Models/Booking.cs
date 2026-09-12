using System;

namespace Tripora.BookingService.Models;

public class Booking
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid ItemId { get; set; }
    public string ItemType { get; set; } = "Tour"; // Tour or Hotel
    public int Count { get; set; }
    public string Status { get; set; } = "Confirmed";
}
