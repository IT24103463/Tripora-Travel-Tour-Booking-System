using System;
using System.Security.Claims;
using System.Text.Json;
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
[Microsoft.AspNetCore.Authorization.AllowAnonymous]
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

    [HttpPost]
    // // // // // [Authorize]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingRequestDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (string.IsNullOrEmpty(userId))
        {
            userId = "11111111-1111-1111-1111-111111111111";
        }

        var serviceDto = new CreateBookingDto
        {
            TourId = dto.TourId,
            HotelId = dto.HotelId,
            GuestName = dto.GuestName,
            PhoneNumber = dto.PhoneNumber,
            BillingAddress = dto.BillingAddress,
            Quantity = dto.Quantity,
            TotalAmount = dto.TotalAmount,
            TravelDate = dto.TravelDate
        };

        var result = await _bookingService.CreateBookingAsync(userId, serviceDto);
        if (!result.Success || result.Booking == null)
        {
            return BadRequest(new { message = result.Error });
        }

        // Scenario 1: Atomically stage Booking_Created event in OutboxMessages
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

        _context.OutboxMessages.Add(outboxMessage);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            message = "Booking request submitted successfully! Status: Pending.",
            bookingId = result.Booking?.Id,
            data = result.Booking
        });
    }

    [HttpGet("{id:guid}")]
    // // // // // [Authorize]
    public async Task<IActionResult> GetBooking(Guid id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null)
        {
            return NotFound(new { message = "Booking not found." });
        }

        return Ok(booking);
    }

    [HttpPut("{id:guid}/status")]
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
    // // // // // [Authorize]
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
