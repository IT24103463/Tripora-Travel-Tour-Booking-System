using System;
using System.Text.Json;
using System.Threading.Tasks;
using Confluent.Kafka;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Tripora.BookingService.Services;

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
            Acks = Acks.All,
            EnableIdempotence = true,
            MessageSendMaxRetries = 5,
            RetryBackoffMs = 1000
        };

        _producer = new ProducerBuilder<string, string>(config).Build();
    }

    public async Task ProduceAsync<T>(string topic, string key, T message)
    {
        try
        {
            var payload = JsonSerializer.Serialize(message);
            var result = await _producer.ProduceAsync(topic, new Message<string, string>
            {
                Key = key,
                Value = payload
            });

            _logger.LogInformation("Produced event to {Topic} [Partition {Partition}] at offset {Offset}",
                result.Topic, result.Partition.Value, result.Offset.Value);
        }
        catch (ProduceException<string, string> ex)
        {
            _logger.LogError(ex, "Failed to deliver Kafka message to {Topic}. Error: {Reason}", topic, ex.Error.Reason);
            throw;
        }
    }
}
