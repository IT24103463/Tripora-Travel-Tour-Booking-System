using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Models;
using Tripora.DestinationService.DTOs;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Tripora.DestinationService.Controllers;

[ApiController]
[Route("api/hotels")]
public class HotelController : ControllerBase
{
    private readonly DestinationDbContext _context;

    public HotelController(DestinationDbContext context)
    {
        _context = context;
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
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null) return NotFound(new { message = "Hotel not found" });

        hotel.Name = request.Name;
        hotel.Description = request.Description;
        hotel.Location = request.Location;
        hotel.PricePerNight = request.PricePerNight;
        hotel.AvailableRooms = request.AvailableRooms;
        hotel.IsActive = request.IsActive;
        hotel.ImageUrl = request.ImageUrl;
        hotel.Rating = request.Rating;
        hotel.Amenities = request.Amenities;
        hotel.UpdatedAt = DateTime.UtcNow;

        _context.Hotels.Update(hotel);
        await _context.SaveChangesAsync();

        return Ok(hotel);
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
}
