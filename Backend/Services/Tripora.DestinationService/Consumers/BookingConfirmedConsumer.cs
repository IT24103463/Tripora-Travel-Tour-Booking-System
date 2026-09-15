using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Models;
using Tripora.Shared.Events;

namespace Tripora.DestinationService.Consumers;

public class BookingConfirmedConsumer : IConsumer<BookingConfirmedEvent>
{
    private readonly DestinationDbContext _dbContext;
    private readonly ILogger<BookingConfirmedConsumer> _logger;

    public BookingConfirmedConsumer(DestinationDbContext dbContext, ILogger<BookingConfirmedConsumer> logger)
    {
        _dbContext = dbContext;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<BookingConfirmedEvent> context)
    {
        var msg = context.Message;
        _logger.LogInformation("Consuming BookingConfirmedEvent for {ItemType} {ItemId} (Quantity: {Qty})", msg.ItemType, msg.ItemId, msg.Quantity);

        try
        {
            if (msg.ItemType.Equals("Tour", StringComparison.OrdinalIgnoreCase))
            {
                var tour = await _dbContext.Tours.FindAsync(new object[] { msg.ItemId }, context.CancellationToken);
                if (tour != null)
                {
                    tour.AvailableSlots -= msg.Quantity;
                    if (tour.AvailableSlots <= 0)
                    {
                        tour.AvailableSlots = 0;
                        tour.Status = ItemStatus.Full;
                    }
                    await _dbContext.SaveChangesAsync(context.CancellationToken);
                }
            }
            else if (msg.ItemType.Equals("Hotel", StringComparison.OrdinalIgnoreCase))
            {
                var hotel = await _dbContext.Hotels.FindAsync(new object[] { msg.ItemId }, context.CancellationToken);
                if (hotel != null)
                {
                    hotel.AvailableRooms -= msg.Quantity;
                    if (hotel.AvailableRooms <= 0)
                    {
                        hotel.AvailableRooms = 0;
                        hotel.Status = ItemStatus.Full;
                    }
                    await _dbContext.SaveChangesAsync(context.CancellationToken);
                }
            }
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogError(ex, "Concurrency exception while confirming booking {BookingId}", msg.BookingId);
            throw; // Let MassTransit retry
        }
    }
}
