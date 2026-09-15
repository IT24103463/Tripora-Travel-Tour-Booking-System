using System;
using System.Net;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

namespace Tripora.BookingService.Clients;

public class DestinationClient : IDestinationClient
{
    private readonly HttpClient _httpClient;
    private readonly ILogger<DestinationClient> _logger;

    public DestinationClient(HttpClient httpClient, ILogger<DestinationClient> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
    }

        public async Task<bool> BookItemAsync(Guid itemId, string itemType, int count)
    {
        try
        {
            var segment = itemType.ToLower() == "hotel" ? "hotels" : "tours";
            var endpoint = $"api/{segment}/{itemId}/book";
            var body = new System.Net.Http.StringContent(System.Text.Json.JsonSerializer.Serialize(new { Quantity = count }), System.Text.Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PatchAsync(endpoint, body);
            
            if (response.StatusCode == HttpStatusCode.BadRequest || response.StatusCode == HttpStatusCode.Conflict)
            {
                var respBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Booking rejected for {ItemType} {ItemId}: {Body}", itemType, itemId, respBody);
                return false;
            }
            
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to book {Count} slots for {ItemType} {ItemId}", count, itemType, itemId);
            throw; 
        }
    }

    public async Task<bool> CheckAvailabilityAsync(Guid itemId, string itemType, int count)
    {
        try
        {
            var segment = itemType.ToLower() == "hotel" ? "hotels" : "tours";
            var response = await _httpClient.GetAsync($"api/{segment}/{itemId}");
            if (!response.IsSuccessStatusCode) return false;
            
            var content = await response.Content.ReadAsStringAsync();
            var json = System.Text.Json.JsonDocument.Parse(content);
            var root = json.RootElement;
            
            // Check status: 0 = Available, 1 = Full, 2 = Unavailable
            if (root.TryGetProperty("status", out var statusProp))
            {
                var status = statusProp.GetInt32();
                if (status == 2) return false; // Unavailable
            }

            if (itemType.ToLower() == "hotel") {
                if (root.TryGetProperty("availableRooms", out var avail)) {
                    return avail.GetInt32() >= count;
                }
            } else {
                if (root.TryGetProperty("availableSlots", out var avail)) {
                    return avail.GetInt32() >= count;
                }
            }
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check availability for {ItemType} {ItemId}", itemType, itemId);
            throw;
        }
    }

    public async Task<bool> CheckItemExistsAsync(Guid itemId, string itemType)
    {
        try
        {
            var segment = itemType.ToLower() == "hotel" ? "hotels" : "tours";
            var response = await _httpClient.GetAsync($"api/{segment}/{itemId}");
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to check item existence for {ItemType} {ItemId}", itemType, itemId);
            throw; // Let Polly retry
        }
    }

    public async Task<bool> ReserveInventoryAsync(Guid itemId, string itemType, int count)
    {
        try
        {
            var segment = itemType.ToLower() == "hotel" ? "hotels" : "tours";
            var endpoint = $"api/{segment}/{itemId}/reserve?count={count}";
            var response = await _httpClient.PostAsync(endpoint, null);

            if (response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.Conflict)
            {
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Reservation rejected for {ItemType} {ItemId}: {Body}", itemType, itemId, body);
                return false;
            }

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reserve {Count} slots for {ItemType} {ItemId}", count, itemType, itemId);
            throw; 
        }
    }

    public async Task<bool> ReleaseInventoryAsync(Guid itemId, string itemType, int count)
    {
        try
        {
            var segment = itemType.ToLower() == "hotel" ? "hotels" : "tours";
            var endpoint = $"api/{segment}/{itemId}/release?count={count}";
            var response = await _httpClient.PostAsync(endpoint, null);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to release {Count} slots for {ItemType} {ItemId}", count, itemType, itemId);
            throw;
        }
    }
}


