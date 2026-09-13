using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace Tripora.BookingService.Clients;

public class DestinationClient : IDestinationClient
{
    private readonly HttpClient _httpClient;

    public DestinationClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<bool> ReserveInventoryAsync(Guid itemId, string itemType, int count)
    {
        var endpoint = itemType.ToLower() == "hotel" ? $"api/hotels/{itemId}/reserve?count={count}" : $"api/tours/{itemId}/reserve?count={count}";
        var response = await _httpClient.PostAsync(endpoint, null);
        return response.IsSuccessStatusCode;
    }

    public async Task<bool> ReleaseInventoryAsync(Guid itemId, string itemType, int count)
    {
        var endpoint = itemType.ToLower() == "hotel" ? $"api/hotels/{itemId}/release?count={count}" : $"api/tours/{itemId}/release?count={count}";
        var response = await _httpClient.PostAsync(endpoint, null);
        return response.IsSuccessStatusCode;
    }
}
