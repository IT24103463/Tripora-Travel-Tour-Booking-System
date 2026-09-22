using System;

namespace Tripora.Shared.Events;

public class PaymentSuccessfulEvent
{
    public Guid EventId { get; set; } = Guid.NewGuid();
    public string EventType { get; set; } = "Payment_Successful";
    public Guid PaymentId { get; set; }
    public Guid BookingId { get; set; }
    public string CustomerId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public string PaymentMethod { get; set; } = "CreditCard";
    public string Status { get; set; } = "Success";
    public string TransactionId { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}