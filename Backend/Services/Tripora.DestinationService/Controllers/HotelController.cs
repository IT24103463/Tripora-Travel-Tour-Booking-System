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
    [HttpPatch("{id}/book")]
    [AllowAnonymous]
    public async Task<IActionResult> BookHotel(Guid id, [FromBody] Tripora.DestinationService.DTOs.BookRequestDto req)
    {
        var result = await ReserveRooms(id, req.Quantity);
        if (result is BadRequestObjectResult) return BadRequest("Not enough capacity");
        return result;
    }
    private readonly DestinationDbContext _context;
    private readonly IHotelService _hotelService;
    private readonly IConfiguration _configuration;

    public HotelController(DestinationDbContext context, IHotelService hotelService, IConfiguration? configuration = null)
    {
        _context = context;
        _hotelService = hotelService;
        _configuration = configuration ?? new ConfigurationBuilder().Build();
    }

    [HttpGet]
    public async Task<IActionResult> GetAllHotels([FromQuery] bool includeInactive = false)
    {
        var hotels = await _hotelService.GetAllHotelsAsync(includeInactive, HttpContext.RequestAborted);
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

        [HttpPut("{id}/availability")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateAvailability(Guid id, [FromBody] UpdateAvailabilityRequestDto request)
    {
        var result = await _hotelService.UpdateAvailabilityAsync(id, request);
        if (!result.IsSuccess)
        {
            if (result.ErrorMessage == "Hotel not found.") return NotFound(new { Message = result.ErrorMessage });
            return BadRequest(new { Message = result.ErrorMessage });
        }
        return Ok(result.Hotel);
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
    [AllowAnonymous]
    public async Task<IActionResult> ReserveRooms(Guid id, [FromQuery] int count)
    {
        if (!HasInternalServiceKey()) return Unauthorized();
        if (count <= 0) return BadRequest(new { Message = "Count must be greater than zero." });

        try
        {
            var hotel = await _context.Hotels.FindAsync(id);
            if (hotel == null) return NotFound(new { Message = "Hotel not found." });

            var updated = await _context.Hotels
                .Where(h => h.Id == id && h.IsActive && h.AvailableRooms >= count)
                .ExecuteUpdateAsync(update => update
                    .SetProperty(h => h.AvailableRooms, h => h.AvailableRooms - count)
                    .SetProperty(h => h.UpdatedAt, DateTime.UtcNow));

            if (updated == 0)
            {
                return Conflict(new { Message = "Not enough available rooms or the hotel is no longer active." });
            }

            hotel = await _context.Hotels.FindAsync(id);
            return Ok(new { Message = $"Reserved {count} rooms successfully.", Data = hotel });
        }
        catch (DbUpdateConcurrencyException)
        {
            return StatusCode(409, new { Message = "Concurrency conflict occurred. Please try again." });
        }
    }

    [HttpPatch("{id}/decrement-inventory")]
    [AllowAnonymous]
    public Task<IActionResult> DecrementInventory(Guid id, [FromQuery] int count) => ReserveRooms(id, count);

    private bool HasInternalServiceKey() =>
        Request.Headers.TryGetValue("X-Internal-Service-Key", out var key) &&
        key == _configuration["InternalServiceApiKey"];

    [HttpPost("{id}/release")]
    [AllowAnonymous]
    public async Task<IActionResult> ReleaseRooms(Guid id, [FromQuery] int count)
    {
        if (!HasInternalServiceKey()) return Unauthorized();
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



