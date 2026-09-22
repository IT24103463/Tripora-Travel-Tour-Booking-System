using System;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Confluent.Kafka;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Tripora.BookingService.Data;
using Tripora.Shared.Events;

namespace Tripora.BookingService.Services;

public class KafkaBookingConsumerService : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly IServiceProvider _serviceProvider;
    private readonly IKafkaProducerService _kafkaProducer;
    private readonly ILogger<KafkaBookingConsumerService> _logger;

    public KafkaBookingConsumerService(
        IConfiguration configuration,
        IServiceProvider serviceProvider,
        IKafkaProducerService kafkaProducer,
        ILogger<KafkaBookingConsumerService> logger)
    {
        _configuration = configuration;
        _serviceProvider = serviceProvider;
        _kafkaProducer = kafkaProducer;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await Task.Yield();

        var bootstrapServers = _configuration["Kafka:BootstrapServers"] ?? "localhost:9092";
        var topic = _configuration["Kafka:PaymentTopic"] ?? "payment-events";
        var dlqTopic = _configuration["Kafka:PaymentDlqTopic"] ?? "payment-events-dlq";
        var groupId = _configuration["Kafka:GroupId"] ?? "booking-service-group";

        var consumerConfig = new ConsumerConfig
        {
            BootstrapServers = bootstrapServers,
            GroupId = groupId,
            AutoOffsetReset = AutoOffsetReset.Earliest,
            EnableAutoCommit = false
        };

        var producerConfig = new ProducerConfig
        {
            BootstrapServers = bootstrapServers
        };

        using var consumer = new ConsumerBuilder<string, string>(consumerConfig).Build();
        using var dlqProducer = new ProducerBuilder<string, string>(producerConfig).Build();

        consumer.Subscribe(topic);
        _logger.LogInformation("Kafka Consumer subscribed to {Topic} with Group {GroupId}", topic, groupId);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var consumeResult = consumer.Consume(stoppingToken);
                if (consumeResult?.Message == null) continue;

                var messageKey = consumeResult.Message.Key ?? "UNKNOWN_KEY";
                var success = false;
                const int maxRetries = 3;

                // Consumer retry policy
                for (int attempt = 1; attempt <= maxRetries; attempt++)
                {
                    try
                    {
                        await ProcessPaymentEventAsync(consumeResult.Message.Value);
                        success = true;
                        break;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Retry {Attempt}/{Max} failed for key {Key}", 
                            attempt, maxRetries, messageKey);
                        await Task.Delay(1000 * attempt, stoppingToken);
                    }
                }

                // Route poison/unhandled messages to DLQ
                if (!success)
                {
                    _logger.LogError("Message {Key} failed after {Max} retries. Routing to DLQ {DlqTopic}", 
                        messageKey, maxRetries, dlqTopic);

                    await dlqProducer.ProduceAsync(dlqTopic, new Message<string, string>
                    {
                        Key = messageKey,
                        Value = consumeResult.Message.Value ?? string.Empty
                    }, stoppingToken);
                }

                // Acknowledge offset back to Kafka broker
                consumer.Commit(consumeResult);
            }
            catch (OperationCanceledException)
            {
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Kafka consumer loop.");
            }
        }

        consumer.Close();
    }

    private async Task ProcessPaymentEventAsync(string? jsonPayload)
    {
        if (string.IsNullOrWhiteSpace(jsonPayload))
        {
            throw new FormatException("Received an empty, null, or whitespace message payload.");
        }

        var trimmedPayload = jsonPayload.Trim();

        // Defensive check: unwrap if payload was double-serialized into a JSON string literal
        if (trimmedPayload.StartsWith("\"") && trimmedPayload.EndsWith("\""))
        {
            try
            {
                trimmedPayload = JsonSerializer.Deserialize<string>(trimmedPayload) ?? trimmedPayload;
            }
            catch
            {
                // Fall back to trimmedPayload if string unescape fails
            }
        }

        using var doc = JsonDocument.Parse(trimmedPayload);
        var root = doc.RootElement;

        string eventType = string.Empty;
        if (root.TryGetProperty("EventType", out var et) || root.TryGetProperty("eventType", out et))
        {
            eventType = et.GetString() ?? string.Empty;
        }

        var jsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        using var scope = _serviceProvider.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<BookingDbContext>();

        // Handle Payment Failed Event
        if (eventType == "Payment_Failed" || (root.TryGetProperty("Status", out var fst) && fst.GetString() == "Failed"))
        {
            var failedEvent = JsonSerializer.Deserialize<PaymentFailedEvent>(trimmedPayload, jsonOptions);
            if (failedEvent == null || failedEvent.BookingId == Guid.Empty)
            {
                throw new FormatException("Invalid or missing BookingId in PaymentFailedEvent payload.");
            }

            var booking = await dbContext.Bookings.FindAsync(failedEvent.BookingId);
            if (booking == null)
            {
                throw new InvalidOperationException($"Booking {failedEvent.BookingId} does not exist in the database.");
            }

            if (booking.Status != "Cancelled")
            {
                booking.Status = "Cancelled";
                booking.UpdatedAt = DateTime.UtcNow;
                await dbContext.SaveChangesAsync();
                _logger.LogInformation("Booking {BookingId} status set to Cancelled after payment failure.", failedEvent.BookingId);
            }

            return;
        }

        // Handle Payment Successful Event
        var paymentEvent = JsonSerializer.Deserialize<PaymentSuccessfulEvent>(trimmedPayload, jsonOptions);

        if (paymentEvent == null || paymentEvent.BookingId == Guid.Empty)
        {
            throw new FormatException("Invalid, missing, or empty BookingId in payment event payload.");
        }

        var confirmedBooking = await dbContext.Bookings.FindAsync(paymentEvent.BookingId);
        if (confirmedBooking == null)
        {
            throw new InvalidOperationException($"Booking {paymentEvent.BookingId} does not exist in the database.");
        }

        // 1. Update database record status if not yet confirmed
        if (confirmedBooking.Status != "Confirmed")
        {
            confirmedBooking.Status = "Confirmed";
            confirmedBooking.UpdatedAt = DateTime.UtcNow;
            await dbContext.SaveChangesAsync();
            _logger.LogInformation("Booking {BookingId} successfully confirmed via Kafka payment event.", paymentEvent.BookingId);
        }
        else
        {
            _logger.LogInformation("Booking {BookingId} is already Confirmed; proceeding to publish confirmation event downstream.", paymentEvent.BookingId);
        }

        // 2. Publish to booking-events topic for downstream consumers (Notifications, Inventory)
        var bookingTopic = _configuration["Kafka:BookingTopic"] ?? "booking-events";

        var bookingConfirmedEvent = new BookingConfirmedMessage
        {
            BookingId = confirmedBooking.Id,
            ItemId = confirmedBooking.ItemId,
            ItemType = confirmedBooking.ItemType ?? "Tour",
            Quantity = confirmedBooking.Quantity,
            Timestamp = DateTime.UtcNow
        };

        await _kafkaProducer.ProduceAsync(bookingTopic, confirmedBooking.Id.ToString(), bookingConfirmedEvent);
        _logger.LogInformation("Dispatched BookingConfirmedMessage to topic {Topic} for Booking {BookingId}", bookingTopic, confirmedBooking.Id);
    }
}

/// <summary>
/// Concrete implementation of the BookingConfirmedEvent interface for JSON serialization.
/// </summary>
public class BookingConfirmedMessage : BookingConfirmedEvent
{
    public Guid BookingId { get; set; }
    public Guid ItemId { get; set; }
    public string ItemType { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}