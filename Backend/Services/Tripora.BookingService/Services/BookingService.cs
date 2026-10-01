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
            if (dto.Quantity <= 0) return (false, null, "Guest or room count must be greater than zero.");

            // The explicit item ID is authoritative. This keeps packages out of the
            // legacy tour/hotel inventory path even if a client sends a stale type.
            var requestedType = dto.PackageId.HasValue
                ? BookingType.Package
                : dto.HotelId.HasValue
                    ? BookingType.Hotel
                    : Enum.TryParse<BookingType>(dto.BookingType, true, out var parsedType)
                        ? parsedType
                        : BookingType.Tour;
            var itemType = requestedType.ToString();
            var today = DateTime.UtcNow.Date;
            if (requestedType == BookingType.Hotel)
            {
                if (!dto.CheckInDate.HasValue || !dto.CheckOutDate.HasValue ||
                    dto.CheckInDate.Value.Date <= today || dto.CheckOutDate.Value.Date <= dto.CheckInDate.Value.Date)
                    return (false, null, "Hotel check-in must be in the future and check-out must be after check-in.");
            }
            else if (dto.TravelDate.Date <= today)
            {
                return (false, null, "Travel date must be in the future.");
            }
            var itemId = requestedType switch
            {
                BookingType.Tour => dto.TourId,
                BookingType.Hotel => dto.HotelId,
                BookingType.Package => dto.PackageId,
                _ => null
            };
            if (!itemId.HasValue && dto.OfferId.HasValue)
            {
                if (_destinationClient == null) return (false, null, "Offer validation is unavailable.");
                var offer = await _destinationClient.GetOfferForBookingAsync(dto.OfferId.Value);
                if (offer == null || !offer.IsActive || offer.StartDate > DateTime.UtcNow || offer.EndDate < DateTime.UtcNow)
                    return (false, null, "This offer is no longer active.");
                if (!Enum.TryParse<BookingType>(offer.Category, true, out requestedType) || offer.TargetId == Guid.Empty)
                    return (false, null, "This offer has an unsupported category or target.");
                itemType = requestedType.ToString();
                itemId = offer.TargetId;
            }
            if (!itemId.HasValue || itemId.Value == Guid.Empty)
                return (false, null, "A valid tour, hotel, or package selection is required.");

            decimal amount = dto.TotalAmount;
            if (requestedType == BookingType.Package)
            {
                if (_destinationClient == null) return (false, null, "Package validation is unavailable.");
                var package = await _destinationClient.GetPackageForBookingAsync(itemId.Value);
                if (package == null || !package.IsActive)
                    return (false, null, "This package is unavailable.");
                if (dto.Quantity < package.MinGuests || dto.Quantity > package.MaxGuests)
                    return (false, null, $"This package accepts {package.MinGuests} to {package.MaxGuests} guests.");
                amount = package.PriceLKR;
            }

            if (dto.OfferId.HasValue)
            {
                var offer = await _destinationClient!.GetOfferForBookingAsync(dto.OfferId.Value);
                if (offer == null || !offer.IsActive || offer.StartDate > DateTime.UtcNow || offer.EndDate < DateTime.UtcNow ||
                    offer.TargetId != itemId.Value || !string.Equals(offer.Category, itemType, StringComparison.OrdinalIgnoreCase))
                    return (false, null, "This offer is no longer valid for the selected item.");
                amount = requestedType == BookingType.Package ? offer.OfferPriceLKR : offer.OfferPriceLKR * dto.Quantity;
            }

            var inventoryReserved = false;
            if (_destinationClient != null && requestedType != BookingType.Package)
            {
                inventoryReserved = await _destinationClient.ReserveInventoryAsync(itemId.Value, itemType, dto.Quantity);
                if (!inventoryReserved)
                {
                    return (false, null, "Failed to reserve inventory. Tour or hotel is full or no longer active.");
                }
            }

            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                BookingType = requestedType,
                TourId = requestedType == BookingType.Tour ? itemId : null,
                HotelId = requestedType == BookingType.Hotel ? itemId : null,
                OfferId = dto.OfferId,
                ItemId = itemId.Value,
                ItemType = itemType,
                GuestName = dto.GuestName ?? string.Empty,
                PhoneNumber = dto.PhoneNumber ?? string.Empty,
                BillingAddress = dto.BillingAddress ?? string.Empty,
                BookingDate = DateTime.UtcNow,
                TravelDate = dto.TravelDate,
                CheckInDate = dto.CheckInDate,
                CheckOutDate = dto.CheckOutDate,
                Quantity = dto.Quantity,
                Count = dto.Quantity,
                TotalAmount = amount,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch
            {
                if (inventoryReserved && _destinationClient != null)
                    await _destinationClient.ReleaseInventoryAsync(itemId.Value, itemType, dto.Quantity);
                throw;
            }

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
            .OrderByDescending(b => b.CreatedAt)
            .ToListAsync();

        return bookings.Select(MapToDto).ToList();
    }

    public async Task<(bool Success, string Error)> CancelBookingAsync(Guid id, string userId, bool isAdmin)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null) return (false, "Booking not found.");

        if (!isAdmin && booking.UserId != userId) return (false, "Access denied.");

        if (_destinationClient != null && booking.BookingType != BookingType.Package)
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
            BookingType = b.BookingType,
            TourId = b.TourId,
            HotelId = b.HotelId,
            PackageId = b.BookingType == BookingType.Package ? b.ItemId : null,
            OfferId = b.OfferId,
            ItemId = b.ItemId,
            ItemType = b.ItemType,
            GuestName = b.GuestName ?? string.Empty,
            PhoneNumber = b.PhoneNumber ?? string.Empty,
            BillingAddress = b.BillingAddress ?? string.Empty,
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
}
