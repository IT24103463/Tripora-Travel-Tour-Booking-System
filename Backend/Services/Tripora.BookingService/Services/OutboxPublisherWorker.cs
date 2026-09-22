using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Tripora.BookingService.Data;

namespace Tripora.BookingService.Services;

public class OutboxPublisherWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<OutboxPublisherWorker> _logger;
    private readonly string _bookingTopic;
    private readonly TimeSpan _pollingInterval = TimeSpan.FromSeconds(3);

    public OutboxPublisherWorker(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<OutboxPublisherWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
        _bookingTopic = configuration["Kafka:BookingTopic"] ?? "booking-events";
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OutboxPublisherWorker started. Polling topic: {Topic}", _bookingTopic);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await ProcessPendingMessagesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing outbox messages.");
            }

            await Task.Delay(_pollingInterval, stoppingToken);
        }
    }

    private async Task ProcessPendingMessagesAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<BookingDbContext>();
        var producer = scope.ServiceProvider.GetRequiredService<IKafkaProducerService>();

        var pendingMessages = await dbContext.OutboxMessages
            .Where(m => m.ProcessedAt == null && m.RetryCount < 10)
            .OrderBy(m => m.CreatedAt)
            .Take(20)
            .ToListAsync(cancellationToken);

        if (!pendingMessages.Any()) return;

        foreach (var msg in pendingMessages)
        {
            try
            {
                using var doc = JsonDocument.Parse(msg.Payload);
                var root = doc.RootElement;
                string partitionKey = root.TryGetProperty("BookingId", out var bIdProp)
                    ? bIdProp.GetString() ?? msg.Id.ToString()
                    : msg.Id.ToString();

                await producer.ProduceAsync(_bookingTopic, partitionKey, msg.Payload);

                msg.ProcessedAt = DateTime.UtcNow;
                msg.ErrorMessage = null;
                _logger.LogInformation("Outbox published message {Id} ({EventType}) to {Topic}", 
                    msg.Id, msg.EventType, _bookingTopic);
            }
            catch (Exception ex)
            {
                msg.RetryCount++;
                msg.ErrorMessage = ex.Message;
                _logger.LogWarning("Failed to publish outbox message {Id} (Retry {Count}): {Error}", 
                    msg.Id, msg.RetryCount, ex.Message);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
    }
}