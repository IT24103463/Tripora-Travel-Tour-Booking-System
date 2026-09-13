using Tripora.BookingService.Models;

namespace Tripora.BookingService.DTOs;

public class BookingResponseDto
{
    public Guid Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public BookingType BookingType { get; set; }
    public Guid? TourId { get; set; }
    public Guid? HotelId { get; set; }
    public DateTime BookingDate { get; set; }
    public DateTime TravelDate { get; set; }
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public int Quantity { get; set; }
    public decimal TotalAmount { get; set; }
    public BookingStatus Status { get; set; }
    public DateTime CreatedAt { get; set; }
}
