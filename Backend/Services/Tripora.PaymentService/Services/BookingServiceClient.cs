using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Tripora.PaymentService.Services;

public class BookingServiceClient : IBookingServiceClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<BookingServiceClient> _logger;

    public BookingServiceClient(HttpClient httpClient, ILogger<BookingServiceClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

    public async Task<(bool Success, string Error)> UpdateBookingStatusAsync(Guid bookingId, string newStatus)
    {
        try
        {
            var payload = new { status = newStatus };
            var response = await _httpClient.PutAsJsonAsync($"api/bookings/{bookingId}/status", payload);

            if (!response.IsSuccessStatusCode)
            {
                // Fallback to singular api/Booking if necessary
                response = await _httpClient.PutAsJsonAsync($"api/Booking/{bookingId}/status", payload);
            }

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Successfully updated booking {BookingId} status to {Status}", bookingId, newStatus);
                return (true, string.Empty);
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            _logger.LogWarning("Failed to update booking {BookingId} status: HTTP {StatusCode} - {Body}",
                bookingId, response.StatusCode, responseBody);
            return (false, $"Failed to update booking status: {response.StatusCode}");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error communicating with BookingService for booking {BookingId}", bookingId);
            return (false, $"Error contacting BookingService: {ex.Message}");
        }
    }
}

