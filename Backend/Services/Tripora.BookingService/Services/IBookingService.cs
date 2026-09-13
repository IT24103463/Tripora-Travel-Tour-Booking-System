using Tripora.BookingService.DTOs;
using Tripora.BookingService.Models;

namespace Tripora.BookingService.Services;

public interface IBookingService
{
    Task<(bool Success, BookingResponseDto? Booking, string Error)> CreateBookingAsync(string userId, CreateBookingDto dto);
    Task<BookingResponseDto?> GetBookingByIdAsync(Guid id);
    Task<IEnumerable<BookingResponseDto>> GetMyBookingsAsync(string userId);
    Task<(bool Success, string Error)> CancelBookingAsync(Guid id, string userId, bool isAdmin);
    Task<(bool Success, string Error)> UpdateStatusAsync(Guid id, string newStatus, bool isAdmin);
}
