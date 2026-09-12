using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Tripora.BookingService.Models;
using Tripora.BookingService.Clients;

namespace Tripora.BookingService.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingController : ControllerBase
{
    private readonly IDestinationClient _destinationClient;
    private static readonly List<Booking> _mockDatabase = new();

    public BookingController(IDestinationClient destinationClient)
    {
        _destinationClient = destinationClient;
    }

    
    [HttpPost]
    public async Task<IActionResult> CreateBooking([FromBody] Booking request)
    {
        try
        {
            var success = await _destinationClient.ReserveInventoryAsync(request.ItemId, request.ItemType, request.Count);
            if (!success)
            {
                return BadRequest(new { Message = "Failed to reserve inventory. Tour/Hotel might be at capacity." });
            }

            request.Id = Guid.NewGuid();
            request.Status = "Confirmed";
            _mockDatabase.Add(request);

            return Ok(new { Message = "Booking confirmed", Data = request });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { Message = "Destination service is currently unreachable. Please try again later." });
        }
    }


    
    [HttpDelete("{id}")]
    public async Task<IActionResult> CancelBooking(Guid id)
    {
        var booking = _mockDatabase.FirstOrDefault(b => b.Id == id);
        if (booking == null) return NotFound(new { Message = "Booking not found." });

        if (booking.Status == "Cancelled") return BadRequest(new { Message = "Already cancelled." });

        try
        {
            var success = await _destinationClient.ReleaseInventoryAsync(booking.ItemId, booking.ItemType, booking.Count);
            if (!success)
            {
                return StatusCode(500, new { Message = "Failed to sync inventory release with DestinationService." });
            }

            booking.Status = "Cancelled";
            return Ok(new { Message = "Booking cancelled successfully" });
        }
        catch (Exception ex)
        {
            return StatusCode(503, new { Message = "Destination service is currently unreachable. Please try again later to cancel." });
        }
    }

}
