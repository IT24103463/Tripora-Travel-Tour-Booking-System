using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Tripora.BookingService.Data;
using Tripora.BookingService.DTOs;
using Tripora.BookingService.Models;

namespace Tripora.BookingService.Services;

public class BookingService : IBookingService
{
    private readonly BookingDbContext _context;
    private readonly Clients.IDestinationClient? _destinationClient;
    private readonly Microsoft.Extensions.Logging.ILogger<BookingService>? _logger;

    public BookingService(BookingDbContext context)
    {
        _context = context;
    }

    public BookingService(BookingDbContext context, Clients.IDestinationClient? destinationClient, Microsoft.Extensions.Logging.ILogger<BookingService>? logger = null)
    {
        _context = context;
        _destinationClient = destinationClient;
        _logger = logger;
    }

    public async Task<(bool Success, BookingResponseDto? Booking, string Error)> CreateBookingAsync(string userId, CreateBookingDto dto)
    {
        try
        {
            if (_destinationClient != null)
            {
                var itemId = dto.TourId ?? dto.HotelId ?? Guid.Empty;
                var itemType = dto.TourId.HasValue ? "Tour" : "Hotel";
                var reserved = await _destinationClient.ReserveInventoryAsync(itemId, itemType, dto.Quantity);
                if (!reserved)
                {
                    return (false, null, "Failed to reserve inventory. Tour or hotel is full or no longer active.");
                }
            }

            var bookingType = Enum.TryParse<BookingType>(dto.BookingType, true, out var parsedBookingType)
                ? parsedBookingType
                : BookingType.Tour;

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BookingType = bookingType,
                TourId = dto.TourId,
                HotelId = dto.HotelId,
                ItemId = dto.TourId ?? dto.HotelId ?? Guid.Empty,
                ItemType = dto.TourId.HasValue ? "Tour" : "Hotel",
                GuestName = dto.GuestName ?? string.Empty,
                PhoneNumber = dto.PhoneNumber ?? string.Empty,
                BillingAddress = dto.BillingAddress ?? string.Empty,
                BookingDate = DateTime.UtcNow,
                TravelDate = dto.TravelDate,
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                Quantity = dto.Quantity,
                Count = dto.Quantity,
                TotalAmount = dto.TotalAmount,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            var responseDto = MapToDto(booking);
            return (true, responseDto, string.Empty);
        }
        catch (Exception ex)
        {
            return (false, null, $"Failed to create booking: {ex.Message}");
        }
    }

    public async Task<BookingResponseDto?> GetBookingByIdAsync(Guid id)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null) return null;

        return MapToDto(booking);
    }

    public async Task<IEnumerable<BookingResponseDto>> GetMyBookingsAsync(string userId)
    {
        var bookings = await _context.Bookings
            .Where(b => b.UserId == userId)
            .ToListAsync();

        return bookings.Select(MapToDto).ToList();
    }

    public async Task<(bool Success, string Error)> CancelBookingAsync(Guid id, string userId, bool isAdmin)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null) return (false, "Booking not found.");

        if (!isAdmin && booking.UserId != userId) return (false, "Access denied.");

        if (_destinationClient != null)
        {
            var itemId = booking.TourId ?? booking.HotelId ?? booking.ItemId;
            var itemType = booking.TourId.HasValue ? "Tour" : (booking.HotelId.HasValue ? "Hotel" : (booking.ItemType ?? "Tour"));
            var count = booking.Quantity > 0 ? booking.Quantity : booking.Count;
            await _destinationClient.ReleaseInventoryAsync(itemId, itemType ?? "Tour", count);
        }

        booking.Status = "Cancelled";
        await _context.SaveChangesAsync();
        return (true, string.Empty);
    }

    public async Task<(bool Success, string Error)> UpdateStatusAsync(Guid id, string newStatus, bool isAdmin)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null) return (false, "Booking not found.");

        booking.Status = newStatus;
        await _context.SaveChangesAsync();
        return (true, string.Empty);
    }

    private static BookingResponseDto MapToDto(Booking b)
    {
        return new BookingResponseDto
        {
            Id = b.Id,
            UserId = b.UserId,
            TourId = b.TourId,
            HotelId = b.HotelId,
            GuestName = b.GuestName ?? string.Empty,
            PhoneNumber = b.PhoneNumber ?? string.Empty,
            BillingAddress = b.BillingAddress ?? string.Empty,
            Quantity = b.Quantity,
            TotalAmount = b.TotalAmount,
            Status = b.Status,
            CreatedAt = b.CreatedAt
        };
    }
}