using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tripora.BookingService.Models;

public class Booking
{
    [Key]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    public string UserId { get; set; } = string.Empty;

    [Required]
    public BookingType BookingType { get; set; }

    public Guid? TourId { get; set; }
    public Guid? HotelId { get; set; }

    public DateTime BookingDate { get; set; } = DateTime.UtcNow;
    public DateTime TravelDate { get; set; }
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }

    [Required]
    [Range(1, 100)]
    public int Quantity { get; set; }

    [Column(TypeName = "TEXT")]
    public decimal TotalAmount { get; set; }

    public BookingStatus Status { get; set; } = BookingStatus.Pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
