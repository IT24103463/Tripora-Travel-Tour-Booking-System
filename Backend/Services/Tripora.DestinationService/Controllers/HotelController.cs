using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Models;
using Tripora.DestinationService.DTOs;
using System;
using System.Linq;
using System.Threading.Tasks;
using Tripora.DestinationService.Services;

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
    public async Task<IActionResult> GetAllHotels([FromQuery] bool includeInactive = false)
    {
        var query = _context.Hotels.AsQueryable();
        if (!includeInactive)
        {
            query = query.Where(h => h.IsActive);
        }
        var hotels = await query.ToListAsync();
        return Ok(hotels);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetHotelById(Guid id)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null) return NotFound(new { message = "Hotel not found" });
        return Ok(hotel);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateHotel([FromBody] CreateHotelRequestDto request)
    {
        var hotel = new Hotel
        {
            Name = request.Name,
            Description = request.Description,
            Location = request.Location,
            PricePerNight = request.PricePerNight,
            // Setup TotalRooms as a base, with initial availability matching TotalRooms
            TotalRooms = request.TotalRooms > 0 ? request.TotalRooms : request.AvailableRooms,
            AvailableRooms = request.AvailableRooms,
            IsActive = request.IsActive,
            ImageUrl = request.ImageUrl,
            Rating = request.Rating,
            Amenities = request.Amenities,
            CreatedAt = DateTime.UtcNow
        };

        _context.Hotels.Add(hotel);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetHotelById), new { id = hotel.Id }, hotel);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateHotel(Guid id, [FromBody] UpdateHotelRequestDto request)
    {
        var result = await _hotelService.UpdateHotelAsync(id, request);
        if (!result.IsSuccess)
        {
            if (result.ErrorMessage == "Hotel not found.") return NotFound(new { Message = result.ErrorMessage });
            return BadRequest(new { Message = result.ErrorMessage });
        }
        return Ok(result.Hotel); // Match expected return from HEAD
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHotel(Guid id)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null) return NotFound(new { message = "Hotel not found" });

        _context.Hotels.Remove(hotel);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Hotel deleted successfully" });
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
}
