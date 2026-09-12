namespace Tripora.BookingService.Clients;

public interface IDestinationClient
{
    Task<bool> ReserveInventoryAsync(Guid itemId, string itemType, int count);
    Task<bool> ReleaseInventoryAsync(Guid itemId, string itemType, int count);
    Task<bool> CheckItemExistsAsync(Guid itemId, string itemType);
}
