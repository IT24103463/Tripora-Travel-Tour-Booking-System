using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Models;

using Tripora.DestinationService.Services;
using Tripora.DestinationService.DTOs;
namespace Tripora.DestinationService.Controllers;

[ApiController]
[Route("api/hotels")]
public class HotelController : ControllerBase
{
    private readonly DestinationDbContext _context;
    private readonly IHotelService _hotelService;

    public HotelController(DestinationDbContext context, IHotelService hotelService)
    {
        _context = context;
        _hotelService = hotelService;
    }


    [HttpGet]
    public async Task<IActionResult> GetAllHotels()
    {
        var hotels = await _context.Hotels.Where(h => h.IsActive).ToListAsync();
        return Ok(hotels);
    }

    [HttpPost("{id}/reserve")]
    public async Task<IActionResult> ReserveRooms(Guid id, [FromQuery] int count)
    {
        if (count <= 0) return BadRequest(new { Message = "Count must be greater than zero." });

        try
        {
            var hotel = await _context.Hotels.FindAsync(id);
            if (hotel == null) return NotFound(new { Message = "Hotel not found." });

            if (hotel.AvailableRooms < count)
            {
                return BadRequest(new { Message = $"Not enough available rooms. Requested: {count}, Available: {hotel.AvailableRooms}" });
            }

            hotel.AvailableRooms -= count;
            await _context.SaveChangesAsync();
            return Ok(new { Message = $"Reserved {count} rooms successfully.", Data = hotel });
        }
        catch (DbUpdateConcurrencyException)
        {
            return StatusCode(409, new { Message = "Concurrency conflict occurred. Please try again." });
        }
    }

    [HttpPost("{id}/release")]
    public async Task<IActionResult> ReleaseRooms(Guid id, [FromQuery] int count)
    {
        if (count <= 0) return BadRequest(new { Message = "Count must be greater than zero." });

        try
        {
            var hotel = await _context.Hotels.FindAsync(id);
            if (hotel == null) return NotFound(new { Message = "Hotel not found." });

            if (hotel.AvailableRooms + count > hotel.TotalRooms)
            {
                return BadRequest(new { Message = "Cannot release more rooms than total capacity allows." });
            }

            hotel.AvailableRooms += count;
            await _context.SaveChangesAsync();
            return Ok(new { Message = $"Released {count} rooms successfully.", Data = hotel });
        }
        catch (DbUpdateConcurrencyException)
        {
            return StatusCode(409, new { Message = "Concurrency conflict occurred. Please try again." });
        }
    }


    [HttpPut("{id}")]
    [Authorize]
    public async Task<IActionResult> UpdateHotel(Guid id, [FromBody] UpdateHotelDto dto)
    {
        var result = await _hotelService.UpdateHotelAsync(id, dto);
        if (!result.IsSuccess)
        {
            if (result.ErrorMessage == "Hotel not found.") return NotFound(new { Message = result.ErrorMessage });
            return BadRequest(new { Message = result.ErrorMessage });
        }
        return Ok(new { Message = "Hotel updated successfully.", Data = result.Hotel });
    }
}
