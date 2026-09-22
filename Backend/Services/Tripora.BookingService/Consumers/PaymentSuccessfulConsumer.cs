using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Logging;
using Tripora.BookingService.Data;
using Tripora.Shared.Events;

namespace Tripora.BookingService.Consumers;

public class PaymentSuccessfulConsumer : IConsumer<PaymentSuccessfulEvent>
{
    private readonly BookingDbContext _context;
    private readonly ILogger<PaymentSuccessfulConsumer> _logger;

    public PaymentSuccessfulConsumer(BookingDbContext context, ILogger<PaymentSuccessfulConsumer> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task Consume(ConsumeContext<PaymentSuccessfulEvent> context)
    {
        var message = context.Message;
        _logger.LogInformation(
            "Processing PaymentSuccessfulEvent for BookingId: {BookingId}, PaymentId: {PaymentId}", 
            message.BookingId, 
            message.PaymentId);

        var booking = await _context.Bookings.FindAsync(message.BookingId);
        
        if (booking == null)
        {
            _logger.LogWarning(
                "Booking {BookingId} not found when handling PaymentSuccessfulEvent. Skipping update.", 
                message.BookingId);
            return;
        }

        // Idempotency Check: Don't process if already confirmed
        if (string.Equals(booking.Status, "Confirmed", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogInformation(
                "Booking {BookingId} is already Confirmed. Skipping duplicate processing.", 
                message.BookingId);
            return;
        }

        // Update booking status and timestamp
        booking.Status = "Confirmed";
        booking.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation(
            "Booking {BookingId} status updated to Confirmed following payment {PaymentId}", 
            message.BookingId, 
            message.PaymentId);
    }
}