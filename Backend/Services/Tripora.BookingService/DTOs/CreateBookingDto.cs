namespace Tripora.BookingService.DTOs;

public class CreateBookingDto
{
    public string BookingType { get; set; } = string.Empty; // "Tour" or "Hotel"
    public Guid? TourId { get; set; }
    public Guid? HotelId { get; set; }
    public DateTime TravelDate { get; set; }
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public int Quantity { get; set; }
    public decimal TotalAmount { get; set; }
}
