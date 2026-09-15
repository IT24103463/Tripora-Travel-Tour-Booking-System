using Microsoft.EntityFrameworkCore;
using Tripora.BookingService.Clients;
using Tripora.BookingService.Data;
using Tripora.BookingService.DTOs;
using Tripora.BookingService.Models;
using MassTransit;
using Tripora.Shared.Events;

namespace Tripora.BookingService.Services;

public class BookingService : IBookingService
{
    private readonly BookingDbContext _db;
    private readonly IDestinationClient _destinationClient;
    private readonly ILogger<BookingService> _logger;
    private readonly IPublishEndpoint _publishEndpoint;

    public BookingService(BookingDbContext db, IDestinationClient destinationClient, ILogger<BookingService> logger, IPublishEndpoint publishEndpoint)
    {
        _db = db;
        _destinationClient = destinationClient;
        _logger = logger;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<(bool Success, BookingResponseDto? Booking, string Error)> CreateBookingAsync(string userId, CreateBookingDto dto)
    {
        if (!Enum.TryParse<BookingType>(dto.BookingType, true, out var bookingType))
            return (false, null, $"Invalid BookingType '{dto.BookingType}'. Must be 'Tour' or 'Hotel'.");

        var itemId = bookingType == BookingType.Tour ? dto.TourId : dto.HotelId;
        if (itemId == null)
            return (false, null, $"{dto.BookingType}Id is required.");

        var today = DateTime.UtcNow.Date;
        if (dto.TravelDate.Date <= today)
            return (false, null, "Travel date must be a future date.");
        
        if (bookingType == BookingType.Hotel)
        {
            if (dto.CheckInDate == null || dto.CheckOutDate == null)
                return (false, null, "Check-in and check-out dates are required for hotels.");
            
            if (dto.CheckInDate.Value.Date <= today)
                return (false, null, "Check-in date must be a future date.");
            
            if (dto.CheckOutDate.Value.Date <= dto.CheckInDate.Value.Date)
                return (false, null, "Check-out date must be after check-in date.");
        }

                // Check availability via DestinationService
        bool isAvailable;
        try
        {
            isAvailable = await _destinationClient.BookItemAsync(itemId.Value, dto.BookingType, dto.Quantity);
        }
        catch (Polly.CircuitBreaker.BrokenCircuitException)
        {
            throw; // Let Controller handle 503
        }
        catch (HttpRequestException)
        {
            throw; // Let Controller handle 503
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "DestinationService unreachable during reservation");
            return (false, null, "Destination service is currently unavailable. Please try again later.");
        }

        if (!isAvailable)
            return (false, null, "Tour/Room is fully booked");

        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            BookingType = bookingType,
            TourId = dto.TourId,
            HotelId = dto.HotelId,
            BookingDate = DateTime.UtcNow,
            TravelDate = dto.TravelDate,
            CheckInDate = dto.CheckInDate,
            CheckOutDate = dto.CheckOutDate,
            Quantity = dto.Quantity,
            TotalAmount = dto.TotalAmount,
            Status = BookingStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _db.Bookings.Add(booking);
                        await _db.SaveChangesAsync();



        // Keep MassTransit publish for future use
        await _publishEndpoint.Publish<BookingConfirmedEvent>(new {
            BookingId = booking.Id,
            ItemId = itemId.Value,
            ItemType = booking.BookingType.ToString(),
            Quantity = booking.Quantity,
            Timestamp = DateTime.UtcNow
        });

        return (true, MapToDto(booking), string.Empty);
    }

    public async Task<BookingResponseDto?> GetBookingByIdAsync(Guid id)
    {
        var booking = await _db.Bookings.FindAsync(id);
        return booking == null ? null : MapToDto(booking);
    }

    public async Task<IEnumerable<BookingResponseDto>> GetMyBookingsAsync(string userId)
    {
        var bookings = await _db.Bookings
            .Where(b => b.UserId == userId)
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();
        return bookings.Select(MapToDto);
    }

        public async Task<(bool Success, string Error)> CancelBookingAsync(Guid id, string userId, bool isAdmin)
    {
        var booking = await _db.Bookings.FindAsync(id);
        if (booking == null) return (false, "Booking not found.");
        if (!isAdmin && booking.UserId != userId) return (false, "Access denied.");
        if (booking.Status == BookingStatus.Cancelled) return (false, "Booking is already cancelled.");
        if (booking.Status == BookingStatus.Completed) return (false, "Completed bookings cannot be cancelled.");

                var itemId = booking.BookingType == BookingType.Tour ? booking.TourId : booking.HotelId;
        if (itemId.HasValue)
        {
            // Bypass MassTransit for local dev: make synchronous HTTP call to release inventory
            try {
                await _destinationClient.ReleaseInventoryAsync(itemId.Value, booking.BookingType.ToString(), booking.Quantity);
            } catch (Exception ex) {
                _logger.LogError(ex, "Failed to release inventory via HTTP during booking cancellation.");
            }

            await _publishEndpoint.Publish<BookingCancelledEvent>(new {
                BookingId = booking.Id,
                ItemId = itemId.Value,
                ItemType = booking.BookingType.ToString(),
                Quantity = booking.Quantity,
                Timestamp = DateTime.UtcNow
            });
        }

        booking.Status = BookingStatus.Cancelled;
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return (true, string.Empty);
    }

    public async Task<(bool Success, string Error)> UpdateStatusAsync(Guid id, string newStatus, bool isAdmin)
    {
        if (!isAdmin) return (false, "Only admins can update booking status.");

        if (!Enum.TryParse<BookingStatus>(newStatus, true, out var status))
            return (false, "Invalid status '{newStatus}'.");

        var booking = await _db.Bookings.FindAsync(id);
        if (booking == null) return (false, "Booking not found.");

        booking.Status = status;
        booking.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        return (true, string.Empty);
    }
    private static BookingResponseDto MapToDto(Booking b) => new()
    {
        Id = b.Id,
        UserId = b.UserId,
        BookingType = b.BookingType,
        TourId = b.TourId,
        HotelId = b.HotelId,
        BookingDate = b.BookingDate,
        TravelDate = b.TravelDate,
        CheckInDate = b.CheckInDate,
        CheckOutDate = b.CheckOutDate,
        Quantity = b.Quantity,
        TotalAmount = b.TotalAmount,
        Status = b.Status,
        CreatedAt = b.CreatedAt
    };
}






