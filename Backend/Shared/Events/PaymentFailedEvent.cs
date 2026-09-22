using System;

namespace Tripora.Shared.Events;

public class PaymentFailedEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = "Payment_Failed";
    public Guid PaymentId { get; set; }
    public Guid BookingId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "CreditCard";
    public string Status { get; set; } = "Failed";
    public string Reason { get; set; } = "Card declined or insufficient funds.";
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}