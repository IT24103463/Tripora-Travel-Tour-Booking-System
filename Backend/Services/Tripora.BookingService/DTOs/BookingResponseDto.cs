using System;
using Tripora.BookingService.Models;

namespace Tripora.BookingService.DTOs;

public class BookingResponseDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public BookingType BookingType { get; set; } = BookingType.Tour;
    public Guid? TourId { get; set; }
    public Guid? HotelId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string BillingAddress { get; set; } = string.Empty;
    public DateTime BookingDate { get; set; }
    public DateTime TravelDate { get; set; }
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public int Quantity { get; set; }
    public decimal TotalAmount { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; }
}
