using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tripora.PaymentService.Models;

public class Payment
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public Guid BookingId { get; set; }

    [Required]
    [MaxLength(36)]
    public string UserId { get; set; } = string.Empty;

    [Required]
    [Column(TypeName = "decimal(18,2)")]
    public decimal Amount { get; set; }

    [Required]
    [MaxLength(50)]
    public string PaymentMethod { get; set; } = "CreditCard"; // "CreditCard", "PayPal", etc.

    [Required]
    [MaxLength(50)]
    public string Status { get; set; } = "Pending"; // "Success", "Failed", "Pending"

    [MaxLength(100)]
    public string TransactionId { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

