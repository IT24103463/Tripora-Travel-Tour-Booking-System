using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Tripora.BookingService.DTOs;
using Tripora.BookingService.Services;

namespace Tripora.BookingService.Controllers;

[ApiController]
[Route("api/bookings")]
[Authorize]
public class BookingController : ControllerBase
{
    private readonly IBookingService _bookingService;

    public BookingController(IBookingService bookingService)
    {
        _bookingService = bookingService;
    }

    private string GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("sub")
        ?? User.FindFirstValue("UserId")
        ?? string.Empty;

    private bool IsAdmin() =>
        User.IsInRole("Admin") ||
        User.FindFirstValue(ClaimTypes.Role) == "Admin";

    // POST /api/bookings
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] CreateBookingDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { Message = "User identity could not be determined." });

        var (success, booking, error) = await _bookingService.CreateBookingAsync(userId, dto);

        if (!success)
            return BadRequest(new { Message = error });

        return CreatedAtAction(nameof(GetBooking), new { id = booking!.Id },
            new { Message = "Booking confirmed.", Data = booking });
    }

    // GET /api/bookings/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetBooking(Guid id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null) return NotFound(new { Message = "Booking not found." });

        var userId = GetUserId();
        if (!IsAdmin() && booking.UserId != userId)
            return Forbid();

        return Ok(new { Message = "Booking retrieved.", Data = booking });
    }

    // GET /api/bookings/my-bookings
    [HttpGet("my-bookings")]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { Message = "User identity could not be determined." });

        var bookings = await _bookingService.GetMyBookingsAsync(userId);
        return Ok(new { Message = "Bookings retrieved.", Data = bookings });
    }

    // POST /api/bookings/{id}/cancel
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelBooking(Guid id)
    {
        var userId = GetUserId();
        var (success, error) = await _bookingService.CancelBookingAsync(id, userId, IsAdmin());

        if (!success)
        {
            if (error == "Booking not found.") return NotFound(new { Message = error });
            if (error == "Access denied.") return Forbid();
            return BadRequest(new { Message = error });
        }

        return Ok(new { Message = "Booking cancelled successfully." });
    }

    // PATCH /api/bookings/{id}/status
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(Guid id, [FromBody] UpdateStatusDto dto)
    {
        var (success, error) = await _bookingService.UpdateStatusAsync(id, dto.Status, isAdmin: true);

        if (!success)
        {
            if (error == "Booking not found.") return NotFound(new { Message = error });
            return BadRequest(new { Message = error });
        }

        return Ok(new { Message = $"Booking status updated to '{dto.Status}'." });
    }
}
