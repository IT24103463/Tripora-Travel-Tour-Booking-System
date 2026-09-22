using System;
using System.ComponentModel.DataAnnotations;

namespace Tripora.PaymentService.DTOs;

public class ProcessPaymentDto
{
    [Required]
    public Guid BookingId { get; set; }

    public string? UserId { get; set; }

    [Required]
    [Range(0.01, double.MaxValue, ErrorMessage = "Amount must be greater than zero.")]
    public decimal Amount { get; set; }

    [Required]
    public string PaymentMethod { get; set; } = "CreditCard"; // e.g. "CreditCard", "PayPal", etc.

    public string? CardNumber { get; set; }
    public string? ExpiryDate { get; set; }
    public string? Cvv { get; set; }
}

