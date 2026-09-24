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
    private readonly ILogger<HotelService>? _logger;

    public HotelService(DestinationDbContext context, ILogger<HotelService>? logger = null)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<List<Hotel>> GetAllHotelsAsync(bool includeInactive = false, CancellationToken cancellationToken = default)
    {
        try
        {
            var query = _context.Hotels.AsQueryable();
            if (!includeInactive)
            {
                query = query.Where(h => h.IsActive);
            }

            return await query.ToListAsync(cancellationToken);
        }
        catch (Exception)
        {
            _logger.LogWarning("Database unreachable. Returning sample fallback hotel data for demo.");
            return CreateFallbackHotels(includeInactive);
        }
    }

    private static List<Hotel> CreateFallbackHotels(bool includeInactive)
    {
        var createdAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        return new List<Hotel>
        {
            new()
            {
                Id = Guid.Parse("99999999-9999-9999-9999-999999999999"),
                Name = "Heritance Kandalama",
                Location = "Sigiriya / Dambulla, Sri Lanka",
                PricePerNight = 180m,
                TotalRooms = 32,
                AvailableRooms = 32,
                Rating = 4.8,
                Amenities = "Infinity Pool, Free WiFi, Spa, Breakfast Included, Restaurant, Airport Shuttle",
                Description = "A luxury eco-resort immersed in forested hills overlooking the ancient landscapes of Sigiriya and Dambulla.",
                ImageUrl = "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=800&q=80",
                IsActive = true,
                CreatedAt = createdAt
            },
            new()
            {
                Id = Guid.Parse("aaaaaaaa-1111-1111-1111-111111111111"),
                Name = "98 Acres Resort & Spa",
                Location = "Ella, Sri Lanka",
                PricePerNight = 220m,
                TotalRooms = 24,
                AvailableRooms = 24,
                Rating = 4.9,
                Amenities = "Mountain View, Spa, Free WiFi, Breakfast Included, Restaurant, Hiking Trails",
                Description = "A boutique mountain retreat surrounded by tea plantations with sweeping views of Ella's green valleys.",
                ImageUrl = "https://images.unsplash.com/photo-1582610116397-edb318620f90?auto=format&fit=crop&w=800&q=80",
                IsActive = true,
                CreatedAt = createdAt
            },
            new()
            {
                Id = Guid.Parse("bbbbbbbb-2222-2222-2222-222222222222"),
                Name = "Cinnamon Bentota Beach",
                Location = "Bentota, Sri Lanka",
                PricePerNight = 160m,
                TotalRooms = 48,
                AvailableRooms = 48,
                Rating = 4.7,
                Amenities = "Beach Access, Swimming Pool, Free WiFi, Spa, Breakfast Included, Water Sports",
                Description = "A beachfront luxury resort offering tropical gardens, calm ocean views, and effortless coastal living.",
                ImageUrl = "https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=800&q=80",
                IsActive = true,
                CreatedAt = createdAt
            },
            new()
            {
                Id = Guid.Parse("cccccccc-3333-3333-3333-333333333333"),
                Name = "Galle Fort Hotel",
                Location = "Galle, Sri Lanka",
                PricePerNight = 140m,
                TotalRooms = 14,
                AvailableRooms = 14,
                Rating = 4.6,
                Amenities = "Heritage Architecture, Courtyard Pool, Free WiFi, Breakfast Included, Restaurant, Concierge",
                Description = "An intimate heritage boutique hotel inside historic Galle Fort, blending colonial character with modern comfort.",
                ImageUrl = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80",
                IsActive = true,
                CreatedAt = createdAt
            }
        }.Where(h => includeInactive || h.IsActive).ToList();
    }

    public async Task<(bool IsSuccess, Hotel? Hotel, string ErrorMessage)> UpdateAvailabilityAsync(Guid id, UpdateAvailabilityRequestDto dto)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null) return (false, null, "Hotel not found.");

        if (dto.Capacity.HasValue) hotel.TotalRooms = dto.Capacity.Value;
        if (dto.Available.HasValue) hotel.AvailableRooms = dto.Available.Value;
        if (dto.Status.HasValue) hotel.Status = dto.Status.Value;

        hotel.UpdatedAt = DateTime.UtcNow;

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

    public async Task<(bool IsSuccess, Hotel? Hotel, string ErrorMessage)> UpdateHotelAsync(Guid id, UpdateHotelRequestDto dto)
    {
        var hotel = await _context.Hotels.FindAsync(id);
        if (hotel == null) return (false, null, "Hotel not found.");

        if (dto.TotalRooms > 0)
        {
            int occupiedRooms = hotel.TotalRooms - hotel.AvailableRooms;
            if (dto.TotalRooms < occupiedRooms)
            {
                return (false, null, $"Cannot reduce TotalRooms below currently occupied rooms ({occupiedRooms}).");
            }

            int netVariance = dto.TotalRooms - hotel.TotalRooms;
            hotel.TotalRooms = dto.TotalRooms;
            hotel.AvailableRooms += netVariance;
        }

        if (!string.IsNullOrEmpty(dto.Name)) hotel.Name = dto.Name;
        if (!string.IsNullOrEmpty(dto.Location)) hotel.Location = dto.Location;
        if (dto.PricePerNight > 0) hotel.PricePerNight = dto.PricePerNight;
        if (!string.IsNullOrEmpty(dto.Description)) hotel.Description = dto.Description;
        if (!string.IsNullOrEmpty(dto.ImageUrl)) hotel.ImageUrl = dto.ImageUrl;
        if (dto.Rating > 0) hotel.Rating = dto.Rating;
        if (dto.Amenities != null) hotel.Amenities = dto.Amenities;
        hotel.IsActive = dto.IsActive;
        hotel.UpdatedAt = DateTime.UtcNow;

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

    public async Task<Hotel?> GetHotelByIdAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var fallbackId = Guid.Parse("99999999-9999-9999-9999-999999999999");
        if (id == fallbackId)
        {
            return new Hotel
            {
                Id = fallbackId,
                Name = "Heritance Kandalama",
                AvailableRooms = 32
            };
        }

        return await _context.Hotels.FirstOrDefaultAsync(h => h.Id == id, cancellationToken);
    }
}