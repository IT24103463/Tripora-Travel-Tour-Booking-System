using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Tripora.BookingService.Clients;
using Tripora.BookingService.DTOs;
using Tripora.BookingService.Models;
using Tripora.BookingService.Services;

namespace Tripora.BookingService.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingController : ControllerBase
{
    private readonly IDestinationClient _destinationClient;
    private readonly IBookingService _bookingService;
    private static readonly List<Booking> _mockDatabase = new();

    public BookingController(IDestinationClient destinationClient, IBookingService bookingService)
    {
        _destinationClient = destinationClient;
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

    // --- HEAD Endpoints ---

    [HttpPost("legacy")]
    public async Task<IActionResult> CreateBookingLegacy([FromBody] Booking request)
    {
        try
        {
            var success = await _destinationClient.ReserveInventoryAsync(request.ItemId, request.ItemType, request.Count);
            if (!success)
            {
                return BadRequest(new { Message = "Failed to reserve inventory. Tour/Hotel might be at capacity." });
            }

            request.Id = Guid.NewGuid();
            request.LegacyStatus = "Confirmed";
            _mockDatabase.Add(request);

            return Ok(new { Message = "Booking confirmed", Data = request });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { Message = "Destination service is currently unreachable. Please try again later." });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelBookingLegacy(Guid id)
    {
        var booking = _mockDatabase.FirstOrDefault(b => b.Id == id);
        if (booking == null) return NotFound(new { Message = "Booking not found." });

        if (booking.LegacyStatus == "Cancelled") return BadRequest(new { Message = "Already cancelled." });

        try
        {
            var success = await _destinationClient.ReleaseInventoryAsync(booking.ItemId, booking.ItemType, booking.Count);
            if (!success)
            {
                return StatusCode(500, new { Message = "Failed to sync inventory release with DestinationService." });
            }

            booking.LegacyStatus = "Cancelled";
            return Ok(new { Message = "Booking cancelled successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { Message = "Destination service is currently unreachable. Please try again later to cancel." });
        }
    }

    // --- TRIP-53 Endpoints ---

    [HttpPost]
    [Authorize]
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

    [HttpGet("{id:guid}")]
    [Authorize]
    public async Task<IActionResult> GetBooking(Guid id)
    {
        var booking = await _bookingService.GetBookingByIdAsync(id);
        if (booking == null) return NotFound(new { Message = "Booking not found." });

        var userId = GetUserId();
        if (!IsAdmin() && booking.UserId != userId)
            return Forbid();

        return Ok(new { Message = "Booking retrieved.", Data = booking });
    }

    [HttpGet("my-bookings")]
    [Authorize]
    public async Task<IActionResult> GetMyBookings()
    {
        var userId = GetUserId();
        if (string.IsNullOrEmpty(userId))
            return Unauthorized(new { Message = "User identity could not be determined." });

        var bookings = await _bookingService.GetMyBookingsAsync(userId);
        return Ok(new { Message = "Bookings retrieved.", Data = bookings });
    }

    [HttpPost("{id:guid}/cancel")]
    [Authorize]
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

