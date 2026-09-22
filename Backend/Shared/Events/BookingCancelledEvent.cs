using System;

namespace Tripora.Shared.Events;

public class BookingCancelledEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = "Booking_Cancelled";
    public Guid BookingId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string Status { get; set; } = "Cancelled";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;

    // Downstream consumer reconciliation properties
    public Guid ItemId { get; set; }
    public string ItemType { get; set; } = "Tour";
    public int Quantity { get; set; }
}