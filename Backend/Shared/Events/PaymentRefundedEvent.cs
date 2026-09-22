using System;

namespace Tripora.Shared.Events;

public class PaymentRefundedEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = "Payment_Refunded";
    public Guid PaymentId { get; set; }
    public Guid BookingId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public decimal RefundAmount { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string Status { get; set; } = "Refunded";
    public string TransactionId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}