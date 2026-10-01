using System;
using System.Security.Claims;
using System.Text.Json;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.BookingService.Data;
using Tripora.BookingService.DTOs;
using Tripora.BookingService.Models;
using Tripora.BookingService.Services;
using Tripora.Shared.Events;

namespace Tripora.BookingService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/bookings")]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;
    private readonly BookingDbContext _context;

    // Keep ONLY this single constructor
    public BookingController(IBookingService bookingService, BookingDbContext context)
    {
        _bookingService = bookingService;
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetBookings()
    {
        var bookings = await _context.Bookings
            .AsNoTracking()
            .OrderByDescending(booking => booking.CreatedAt)
            .Select(booking => new BookingResponseDto
            {
                Id = booking.Id,
                UserId = booking.UserId,
                BookingType = booking.BookingType,
                TourId = booking.TourId,
                HotelId = booking.HotelId,
                PackageId = booking.BookingType == BookingType.Package ? booking.ItemId : null,
                OfferId = booking.OfferId,
                ItemId = booking.ItemId,
                ItemType = booking.ItemType,
                GuestName = booking.GuestName ?? string.Empty,
                PhoneNumber = booking.PhoneNumber ?? string.Empty,
                BillingAddress = booking.BillingAddress ?? string.Empty,
                BookingDate = booking.BookingDate,
                TravelDate = booking.TravelDate,
                CheckInDate = booking.CheckInDate,
                CheckOutDate = booking.CheckOutDate,
                Quantity = booking.Quantity,
                TotalAmount = booking.TotalAmount,
                Status = booking.Status,
                CreatedAt = booking.CreatedAt
            })
            .ToListAsync();

        return Ok(bookings);
    }

    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequestDto dto)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                         ?? User.FindFirstValue("id")
                         ?? User.FindFirstValue(ClaimTypes.Email)
                         ?? User.FindFirstValue("sub");
            if (string.IsNullOrEmpty(userId)) return Unauthorized(new { message = "Sign in before creating a booking." });

            var serviceDto = new CreateBookingDto
            {
                TourId = dto.TourId,
                HotelId = dto.HotelId,
                PackageId = dto.PackageId,
                OfferId = dto.OfferId,
                BookingType = dto.BookingType,
                GuestName = dto.GuestName,
                PhoneNumber = dto.PhoneNumber,
                BillingAddress = dto.BillingAddress,
                Quantity = dto.Quantity,
                TotalAmount = dto.TotalAmount,
                TravelDate = dto.TravelDate,
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate
            };

            var result = await _bookingService.CreateBookingAsync(userId, serviceDto);
            if (!result.Success || result.Booking == null)
            {
                return BadRequest(new { message = result.Error });
            }

            try
            {
                if (_context != null)
                {
                    var createdEvent = new BookingCreatedEvent
                    {
                        BookingId = result.Booking.Id,
                        CustomerId = result.Booking.UserId,
                        TourId = result.Booking.TourId?.ToString() ?? string.Empty,
                        TotalAmount = result.Booking.TotalAmount,
                        Status = result.Booking.Status?.ToString() ?? "Pending",
                        Timestamp = DateTime.UtcNow
                    };

                    var outboxMessage = new OutboxMessage
                    {
                        Id = Guid.NewGuid(),
                        EventType = "Booking_Created",
                        Payload = JsonSerializer.Serialize(createdEvent),
                        CreatedAt = DateTime.UtcNow
                    };

                    try
            {
                if (_context != null)
                {
                    try
            {
                if (_context != null)
                {
                    try
            {
                if (_context != null)
                {
                    try
            {
                if (_context != null)
                {
                    try
            {
                if (_context != null)
                {
                    _context.OutboxMessages.Add(outboxMessage);
                    await _context.SaveChangesAsync();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Outbox skipped: " + ex.Message);
            }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Outbox skipped: " + ex.Message);
            }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Outbox skipped: " + ex.Message);
            }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Outbox skipped: " + ex.Message);
            }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Outbox skipped: " + ex.Message);
            }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Outbox staging warning: " + ex.Message);
            }

            return Ok(new
            {
                success = true,
                message = "Booking request submitted successfully! Status: Pending.",
                bookingId = result.Booking?.Id,
                data = result.Booking
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                success = false,
                source = "BookingController.CreateBooking",
                message = ex.Message,
                inner = ex.InnerException?.Message,
                stack = ex.StackTrace
            });
        }
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetBooking(Guid id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        return Ok(booking);
    }

    [HttpGet("my-history")]
    [Authorize]
    public async Task<IActionResult> GetMyBookingHistory()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                     ?? User.FindFirstValue("id")
                     ?? User.FindFirstValue(ClaimTypes.Email);

        if (string.IsNullOrWhiteSpace(userId))
        {
            return Unauthorized(new { message = "User identity not resolved." });
        }

        var bookings = await _bookingService.GetMyBookingsAsync(userId);
        var history = bookings.Select(booking =>
        {
            var isHotel = booking.BookingType == BookingType.Hotel || booking.HotelId.HasValue;
            var isPackage = booking.BookingType == BookingType.Package;
            var startDate = isHotel ? booking.CheckInDate ?? booking.TravelDate : booking.TravelDate;
            var endDate = isHotel ? booking.CheckOutDate ?? startDate : isPackage ? startDate.AddDays(1) : booking.TravelDate;
            var durationDays = Math.Max(1, (endDate.Date - startDate.Date).Days + 1);

            return new
            {
                id = $"TRP-LK-{booking.Id.ToString("N")[..8].ToUpperInvariant()}",
                bookingId = booking.Id,
                bookingType = booking.BookingType.ToString(),
                tourId = booking.TourId,
                hotelId = booking.HotelId,
                packageId = isPackage ? booking.ItemId : (Guid?)null,
                itemId = booking.ItemId,
                itemType = booking.ItemType,
                title = isHotel ? "Hotel reservation" : isPackage ? "Travel package reservation" : "Tour reservation",
                location = "Sri Lanka",
                hotel = isHotel ? "Hotel stay" : isPackage ? "Private travel package" : "Tour package",
                startDate = startDate.ToString("yyyy-MM-dd"),
                endDate = endDate.ToString("yyyy-MM-dd"),
                dates = $"{startDate:dd MMM yyyy} - {endDate:dd MMM yyyy}",
                duration = isHotel ? $"{Math.Max(1, (endDate.Date - startDate.Date).Days)} Nights" : $"{durationDays} Days",
                guests = $"{booking.Quantity} {(booking.Quantity == 1 ? "Guest" : "Guests")}",
                totalAmountLKR = booking.TotalAmount,
                bookingDate = booking.CreatedAt.ToString("dd MMM yyyy"),
                imageUrl = "/sri-lanka-path.jpg",
                status = endDate.Date < DateTime.UtcNow.Date ? "Finished" : "Ongoing",
                paymentStatus = booking.Status
            };
        });

        return Ok(history);
    }

    [HttpPut("{id:guid}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateBookingStatus(Guid id, [FromBody] UpdateStatusDto dto)
    {
        if (dto == null || string.IsNullOrWhiteSpace(dto.Status))
        {
            return BadRequest(new { message = "Status is required." });
        }

        var result = await _bookingService.UpdateStatusAsync(id, dto.Status, isAdmin: true);
        if (!result.Success)
        {
            return NotFound(new { message = result.Error });
        }

        // Scenario 2: When status changes to Cancelled, stage Booking_Cancelled event in Outbox
        if (string.Equals(dto.Status, "Cancelled", StringComparison.OrdinalIgnoreCase))
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking != null)
            {
                var cancelledEvent = new BookingCancelledEvent
                {
                    BookingId = booking.Id,
                    CustomerId = booking.UserId,
                    Reason = "Booking status updated to Cancelled",
                    RefundAmount = booking.TotalAmount,
                    Status = "Cancelled",
                    Timestamp = DateTime.UtcNow
                };

                _context.OutboxMessages.Add(new OutboxMessage
                {
                    Id = Guid.NewGuid(),
                    EventType = "Booking_Cancelled",
                    Payload = JsonSerializer.Serialize(cancelledEvent),
                    CreatedAt = DateTime.UtcNow
                });

                await _context.SaveChangesAsync();
            }
        }

        return Ok(new { success = true, message = $"Booking status updated to {dto.Status}." });
    }

    [HttpPost("{id:guid}/cancel")]
    [HttpPut("{id:guid}/cancel")]
    [AllowAnonymous]
    public async Task<IActionResult> CancelBooking(Guid id, [FromBody] CancelBookingRequestDto? dto)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        var result = await _bookingService.UpdateStatusAsync(id, "Cancelled", isAdmin: true);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Error });
        }

        var reason = string.IsNullOrWhiteSpace(dto?.Reason)
            ? "Customer or Admin requested cancellation."
            : dto.Reason;

        var cancelledEvent = new BookingCancelledEvent
        {
            BookingId = booking.Id,
            CustomerId = booking.UserId,
            Reason = reason,
            RefundAmount = booking.TotalAmount,
            Status = "Cancelled",
            Timestamp = DateTime.UtcNow
        };

        _context.OutboxMessages.Add(new OutboxMessage
        {
            Id = Guid.NewGuid(),
            EventType = "Booking_Cancelled",
            Payload = JsonSerializer.Serialize(cancelledEvent),
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Booking cancelled successfully." });
    }
}

public class CancelBookingRequestDto
{
    public string? Reason { get; set; }
}
