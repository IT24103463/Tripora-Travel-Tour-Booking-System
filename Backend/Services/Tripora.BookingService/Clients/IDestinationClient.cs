using System;
using System.Threading.Tasks;

namespace Tripora.BookingService.Clients;

public interface IDestinationClient
{
    Task<bool> CheckAvailabilityAsync(Guid itemId, string itemType, int count);
        Task<bool> BookItemAsync(Guid itemId, string itemType, int count);
    Task<bool> ReserveInventoryAsync(Guid itemId, string itemType, int count);
    Task<bool> ReleaseInventoryAsync(Guid itemId, string itemType, int count);
    Task<bool> CheckItemExistsAsync(Guid itemId, string itemType);
    Task<PackageBookingInfo?> GetPackageForBookingAsync(Guid packageId);
    Task<OfferBookingInfo?> GetOfferForBookingAsync(Guid offerId);
}

public sealed record PackageBookingInfo(Guid Id, string Name, string Destination, int MinGuests, int MaxGuests, decimal PriceLKR, bool IsActive);
public sealed record OfferBookingInfo(Guid Id, string Category, Guid TargetId, decimal OfferPriceLKR, DateTime StartDate, DateTime EndDate, bool IsActive);


