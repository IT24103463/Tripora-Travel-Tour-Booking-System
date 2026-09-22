using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tripora.BookingService.Models
{
    public class Booking
    {
        [Key]
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required]
        [MaxLength(36)]
        public string UserId { get; set; } = string.Empty;

        public BookingType BookingType { get; set; }

        public Guid? TourId { get; set; }

        public Guid? HotelId { get; set; }

        public Guid ItemId { get; set; }

        [MaxLength(50)]
        public string? ItemType { get; set; }

        [MaxLength(100)]
        public string? GuestName { get; set; }

        [MaxLength(30)]
        public string? PhoneNumber { get; set; }

        [MaxLength(255)]
        public string? BillingAddress { get; set; }

        public DateTime BookingDate { get; set; } = DateTime.UtcNow;

        public DateTime TravelDate { get; set; }

        public DateTime? CheckInDate { get; set; }

        public DateTime? CheckOutDate { get; set; }

        public int Count { get; set; } = 1;

        public int Quantity { get; set; } = 1;

        [Column(TypeName = "decimal(18,2)")]
        public decimal TotalAmount { get; set; }

        [Required]
        [MaxLength(50)]
        public string Status { get; set; } = "Pending";

        [MaxLength(50)]
        public string? LegacyStatus { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }
    }
}