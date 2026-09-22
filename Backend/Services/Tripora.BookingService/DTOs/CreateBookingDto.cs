using System;

namespace Tripora.BookingService.DTOs;

public class CreateBookingDto
{
    public string BookingType { get; set; } = "Tour"; // "Tour" or "Hotel"
    public Guid? TourId { get; set; }
    public Guid? HotelId { get; set; }
    public string GuestName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string BillingAddress { get; set; } = string.Empty;
    public DateTime TravelDate { get; set; } = DateTime.UtcNow;
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public int Quantity { get; set; } = 1;
    public decimal TotalAmount { get; set; }
}

public class CreateBookingRequestDto : CreateBookingDto { }
