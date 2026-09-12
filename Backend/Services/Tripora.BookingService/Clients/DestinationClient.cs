using System.Net;
using System.Net.Http.Json;

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
            var response = await _httpClient.PostAsync($"api/{segment}/{itemId}/reserve?count={count}", null);

            if (response.StatusCode == HttpStatusCode.BadRequest ||
                response.StatusCode == HttpStatusCode.Conflict)
            {
                // Business rule rejection — do NOT retry, return false immediately
                var body = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Reservation rejected for {ItemType} {ItemId}: {Body}", itemType, itemId, body);
                return false;
            }

            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to reserve {Count} slots for {ItemType} {ItemId}", count, itemType, itemId);
            throw; // Let Polly retry on transient errors
        }
    }

    public async Task<bool> ReleaseInventoryAsync(Guid itemId, string itemType, int count)
    {
        try
        {
            var segment = itemType.ToLower() == "hotel" ? "hotels" : "tours";
            var response = await _httpClient.PostAsync($"api/{segment}/{itemId}/release?count={count}", null);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to release {Count} slots for {ItemType} {ItemId}", count, itemType, itemId);
            throw;
        }
    }
}
