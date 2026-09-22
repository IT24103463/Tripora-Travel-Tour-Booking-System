using System;

namespace Tripora.Shared.Events;

public class BookingCreatedEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = "Booking_Created";
    public Guid BookingId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string TourId { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}