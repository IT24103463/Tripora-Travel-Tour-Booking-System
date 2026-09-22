using System;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Tripora.PaymentService.Data;
using Tripora.PaymentService.Models;
using Tripora.Shared.Events;

namespace Tripora.PaymentService.Services;

public class OutboxPublisherWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IKafkaProducerService _producer;
    private readonly ILogger<OutboxPublisherWorker> _logger;
    private const string Topic = "payment-events";

    public OutboxPublisherWorker(
        IServiceProvider serviceProvider,
        IKafkaProducerService producer,
        ILogger<OutboxPublisherWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _producer = producer;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("OutboxPublisherWorker started. Polling topic: {Topic}", Topic);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = _serviceProvider.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<PaymentDbContext>();

                var pendingMessages = await context.OutboxMessages
                    .Where(m => m.ProcessedAt == null && m.RetryCount < 5)
                    .OrderBy(m => m.CreatedAt)
                    .Take(20)
                    .ToListAsync(stoppingToken);

                foreach (var message in pendingMessages)
                {
                    try
                    {
                        // Extract BookingId to use as partition key
                        string partitionKey = message.Id.ToString();
                        using var doc = JsonDocument.Parse(message.Payload);
                        if (doc.RootElement.TryGetProperty("BookingId", out var bId))
                        {
                            partitionKey = bId.GetString() ?? partitionKey;
                        }

                        await _producer.ProduceAsync(Topic, partitionKey, message.Payload);

                        message.ProcessedAt = DateTime.UtcNow;
                        message.ErrorMessage = null;
                        _logger.LogInformation("Payment outbox published event {MessageId} ({EventType}) to {Topic}",
                            message.Id, message.EventType, Topic);
                    }
                    catch (Exception ex)
                    {
                        message.RetryCount++;
                        message.ErrorMessage = ex.Message;
                        _logger.LogError(ex, "Failed to publish payment outbox message {MessageId}", message.Id);
                    }
                }

                if (pendingMessages.Any())
                {
                    await context.SaveChangesAsync(stoppingToken);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing payment outbox messages batch");
            }

            await Task.Delay(3000, stoppingToken);
        }
    }
}