using System;
using System.Text.Json;
using System.Threading.Tasks;
using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Tripora.PaymentService.Services;

public interface IKafkaProducerService
{
    Task ProduceAsync<T>(string topic, string key, T message);
}

public class KafkaProducerService : IKafkaProducerService
{
    private readonly IProducer<string, string> _producer;
    private readonly ILogger<KafkaProducerService> _logger;

    public KafkaProducerService(IConfiguration configuration, ILogger<KafkaProducerService> logger)
    {
        _logger = logger;

        var bootstrapServers = configuration["Kafka:BootstrapServers"] ?? "localhost:9092";

        var config = new ProducerConfig
        {
            BootstrapServers = bootstrapServers,
            Acks = Acks.All,                          // Guarantees all in-sync replicas acknowledge (Scenario 1)
            EnableIdempotence = true,                 // Prevents duplicate messages from retries
            MessageSendMaxRetries = 5,                // Resilient retries on network hiccups (Scenario 4)
            RetryBackoffMs = 1000
        };

        _producer = new ProducerBuilder<string, string>(config).Build();
    }

    public async Task ProduceAsync<T>(string topic, string key, T message)
    {
        try
        {
            // If the message is already a JSON string (e.g. from the Outbox table), do not re-serialize it
            string jsonPayload = message is string rawString
                ? rawString
                : JsonSerializer.Serialize(message);

            var result = await _producer.ProduceAsync(topic, new Message<string, string>
            {
                Key = key,
                Value = jsonPayload
            });

            _logger.LogInformation("Delivered event to {Topic} [Partition {Partition}] at offset {Offset}", 
                result.Topic, result.Partition.Value, result.Offset.Value);
        }
        catch (ProduceException<string, string> ex)
        {
            _logger.LogError(ex, "Failed to deliver Kafka message to topic {Topic}. Error: {Reason}", topic, ex.Error.Reason);
            throw;
        }
    }
}