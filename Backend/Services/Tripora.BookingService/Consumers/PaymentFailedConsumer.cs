using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Tripora.BookingService.Clients;
using Tripora.BookingService.Data;
using Tripora.Shared.Events;

namespace Tripora.BookingService.Consumers;

public class PaymentFailedConsumer : IConsumer<PaymentFailedEvent>
{
    private readonly BookingDbContext _context;
    private readonly IDestinationClient _destinationClient;
    private readonly ILogger<PaymentFailedConsumer> _logger;

    public PaymentFailedConsumer(
        BookingDbContext context,
        IDestinationClient destinationClient,
        ILogger<PaymentFailedConsumer> logger)
    {
        _context = context;
        _destinationClient = destinationClient;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentFailedEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation("Received PaymentFailedEvent for BookingId {BookingId}: {Reason}", message.BookingId, message.Reason);

        var booking = await _context.Bookings.FirstOrDefaultAsync(b => b.Id == message.BookingId);
        if (booking == null)
        {
            _logger.LogWarning("Booking {BookingId} not found when processing PaymentFailedEvent", message.BookingId);
            return;
        }

        booking.Status = "Cancelled";
        booking.UpdatedAt = DateTime.UtcNow;

        var itemId = booking.TourId ?? booking.HotelId ?? booking.ItemId;
        var itemType = booking.TourId.HasValue ? "Tour" : (booking.HotelId.HasValue ? "Hotel" : (booking.ItemType ?? "Tour"));
        var count = booking.Quantity > 0 ? booking.Quantity : booking.Count;
        var released = await _destinationClient.ReleaseInventoryAsync(itemId, itemType, count);
        if (!released)
        {
            _logger.LogWarning("Failed to release inventory for BookingId {BookingId} on item {ItemId}", booking.Id, itemId);
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Booking {BookingId} marked as Cancelled and inventory release triggered", booking.Id);
    }
}

