using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Services;

public class HotelService : IHotelService
{
    private readonly DestinationDbContext _context;

    public HotelService(DestinationDbContext context)
    {
        _context = context;
    }

    public async Task<(bool IsSuccess, Hotel? Hotel, string ErrorMessage)> UpdateHotelAsync(Guid id, UpdateHotelDto dto)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null) return (false, null, "Hotel not found.");

        int occupiedRooms = hotel.TotalRooms - hotel.AvailableRooms;
        if (dto.TotalRooms < occupiedRooms)
        {
            return (false, null, $"Cannot reduce TotalRooms below currently occupied rooms ({occupiedRooms}).");
        }

        int netVariance = dto.TotalRooms - hotel.TotalRooms;
        
        hotel.Name = dto.Name;
        hotel.Location = dto.Location;
        hotel.PricePerNight = dto.PricePerNight;
        hotel.Description = dto.Description;
        hotel.ImageUrl = dto.ImageUrl;
        hotel.UpdatedAt = DateTime.UtcNow;
        hotel.TotalRooms = dto.TotalRooms;
        hotel.AvailableRooms = hotel.AvailableRooms + netVariance;
        hotel.IsActive = dto.IsActive;

        try
        {
            await _context.SaveChangesAsync();
            return (true, hotel, string.Empty);
        }
        catch (DbUpdateConcurrencyException)
        {
            return (false, null, "Concurrency conflict occurred.");
        }
    }
}
