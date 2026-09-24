using Microsoft.Extensions.Logging.Abstractions;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Text.Json;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Tripora.PaymentService.Data;
using Tripora.PaymentService.DTOs;
using Tripora.PaymentService.Models;
using Tripora.PaymentService.Services;
using Tripora.Shared.Events;

namespace Tripora.PaymentService.Controllers;

[ApiController]
[Route("api/[controller]")]
[Route("api/payments")]
public class PaymentController : ControllerBase
{
    private readonly PaymentDbContext _context;
    private readonly IBookingServiceClient _bookingServiceClient;
    private readonly IPublishEndpoint _publishEndpoint;
    private readonly IKafkaProducerService _kafkaProducer;
    private readonly IConfiguration _configuration;
    private readonly ILogger<PaymentController>? _logger = null ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<PaymentController>.Instance;

    [Microsoft.Extensions.DependencyInjection.ActivatorUtilitiesConstructor]
    public PaymentController(
        PaymentDbContext context,
        IBookingServiceClient bookingServiceClient,
        IPublishEndpoint publishEndpoint,
        ILogger<PaymentController>? logger = null, IKafkaProducerService? kafkaProducer = null, IConfiguration? configuration = null)
    {
        _context = context;
        _bookingServiceClient = bookingServiceClient;
        _publishEndpoint = publishEndpoint;
        _kafkaProducer = kafkaProducer ?? new NoOpKafkaProducer();
        _configuration = configuration ?? new ConfigurationManager();
        _logger = logger ?? Microsoft.Extensions.Logging.Abstractions.NullLogger<PaymentController>.Instance;
    }


    private sealed class NoOpKafkaProducer : IKafkaProducerService
    {
        public Task ProduceAsync<T>(string topic, string key, T message) => Task.CompletedTask;
    }

    /// <summary>
    /// Scenario 1: Initiate Payment - Returns transaction in Pending status.
    /// </summary>
    [HttpPost("initiate")]
    // [Authorize]
    public async Task<IActionResult> InitiatePayment([FromBody] ProcessPaymentDto dto)
    {
        if (dto.BookingId == Guid.Empty || dto.Amount <= 0)
        {
            return BadRequest(new { message = "Valid BookingId and Amount greater than zero are required." });
        }

        var userId = ResolveUserId(dto.UserId);

        var existingPayment = await _context.Payments
            .FirstOrDefaultAsync(p => p.BookingId == dto.BookingId && p.Status != "Failed");

        if (existingPayment != null)
        {
            return Ok(MapToResponseDto(existingPayment, "Existing payment transaction retrieved."));
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            BookingId = dto.BookingId,
            UserId = userId,
            Amount = dto.Amount,
            PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "CreditCard" : dto.PaymentMethod,
            Status = "Pending",
            TransactionId = $"TXN-INIT-{Guid.NewGuid().ToString("N")[..10].ToUpperInvariant()}",
            CreatedAt = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        return Ok(MapToResponseDto(payment, "Payment transaction initiated successfully in Pending status."));
    }

    /// <summary>
    /// Scenarios 2 & 3: Process Payment with Idempotency and Atomic Transactional Outbox Staging.
    /// </summary>
    [HttpPost("process")]
    // [Authorize]
    public async Task<IActionResult> ProcessPayment([FromBody] ProcessPaymentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        if (dto.BookingId == Guid.Empty || dto.Amount <= 0)
        {
            return BadRequest(new { message = "Valid BookingId and Amount greater than zero are required." });
        }

        // Idempotency check: Return existing successful payment if already paid
        var existingSuccess = await _context.Payments
            .FirstOrDefaultAsync(p => p.BookingId == dto.BookingId && p.Status == "Success");

        if (existingSuccess != null)
        {
            return Ok(MapToResponseDto(existingSuccess, "Payment already completed for this booking."));
        }

        var userId = ResolveUserId(dto.UserId);

        var payment = await _context.Payments
            .FirstOrDefaultAsync(p => p.BookingId == dto.BookingId && p.Status == "Pending");

        var transactionId = $"TXN-{Guid.NewGuid().ToString("N")[..12].ToUpperInvariant()}";
        // Gateway decline simulation: card numbers ending in 0000 fail
        var isSuccess = string.IsNullOrWhiteSpace(dto.CardNumber) || !dto.CardNumber.EndsWith("0000");

        if (payment == null)
        {
            payment = new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = dto.BookingId,
                UserId = userId,
                Amount = dto.Amount,
                PaymentMethod = string.IsNullOrWhiteSpace(dto.PaymentMethod) ? "CreditCard" : dto.PaymentMethod,
                CreatedAt = DateTime.UtcNow
            };
            _context.Payments.Add(payment);
        }

        payment.Status = isSuccess ? "Success" : "Failed";
        payment.TransactionId = transactionId;

        // Atomically stage event in the Outbox within the same database transaction
        if (isSuccess)
        {
            var successEvent = new PaymentSuccessfulEvent
            {
                EventId = Guid.NewGuid(),
                EventType = "Payment_Successful",
                PaymentId = payment.Id,
                BookingId = payment.BookingId,
                UserId = payment.UserId,
                CustomerId = payment.UserId,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                Status = "Success",
                TransactionId = transactionId,
                Timestamp = DateTime.UtcNow
            };

            var outboxMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                EventType = "Payment_Successful",
                Payload = JsonSerializer.Serialize(successEvent),
                CreatedAt = DateTime.UtcNow
            };

            _context.OutboxMessages.Add(outboxMessage);
        }
        else
        {
            var failedEvent = new PaymentFailedEvent
            {
                EventId = Guid.NewGuid(),
                EventType = "Payment_Failed",
                PaymentId = payment.Id,
                BookingId = payment.BookingId,
                UserId = payment.UserId,
                CustomerId = payment.UserId,
                Amount = payment.Amount,
                PaymentMethod = payment.PaymentMethod,
                Status = "Failed",
                Reason = "Card declined by payment provider.",
                Timestamp = DateTime.UtcNow
            };

            var outboxMessage = new OutboxMessage
            {
                Id = Guid.NewGuid(),
                EventType = "Payment_Failed",
                Payload = JsonSerializer.Serialize(failedEvent),
                CreatedAt = DateTime.UtcNow
            };

            _context.OutboxMessages.Add(outboxMessage);
        }

        // Commit payment record and outbox entry atomically
        await _context.SaveChangesAsync();

        // Handle Failure Response
        if (!isSuccess)
        {
            _logger?.LogWarning("Payment rejected for booking {BookingId}", dto.BookingId);

            try
            {
                await _publishEndpoint.Publish(new PaymentFailedEvent
                {
                    PaymentId = payment.Id,
                    BookingId = payment.BookingId,
                    UserId = payment.UserId,
                    CustomerId = payment.UserId,
                    Amount = payment.Amount,
                    Reason = "Card declined by payment provider."
                });
            }
            catch (Exception ex)
            {
                _logger?.LogWarning(ex, "Failed to publish internal MassTransit PaymentFailedEvent");
            }

            return BadRequest(MapToResponseDto(payment, "Payment declined by payment provider."));
        }

        // Handle Success Response
        try
        {
            await _publishEndpoint.Publish(new PaymentSuccessfulEvent
            {
                PaymentId = payment.Id,
                BookingId = payment.BookingId,
                UserId = payment.UserId,
                CustomerId = payment.UserId,
                Amount = payment.Amount,
                TransactionId = transactionId
            });
        }
        catch (Exception ex)
        {
            _logger?.LogWarning(ex, "Failed to publish internal MassTransit PaymentSuccessfulEvent");
        }

        // Optional best-effort direct sync
        var (syncSuccess, syncError) = await _bookingServiceClient.UpdateBookingStatusAsync(dto.BookingId, "Confirmed");
        if (!syncSuccess)
        {
            _logger?.LogInformation("Booking sync handled asynchronously via Kafka event stream for {BookingId}", dto.BookingId);
        }

        var message = syncSuccess
            ? "Payment processed successfully and booking confirmed."
            : "Payment processed successfully (booking status sync pending).";

        return Ok(MapToResponseDto(payment, message));
    }

    /// <summary>
    /// Scenario 4: Retrieve Customer Payment History
    /// </summary>
    [HttpGet("history/{userId}")]
    // [Authorize]
    public async Task<IActionResult> GetUserPaymentHistory(string userId)
    {
        if (string.IsNullOrWhiteSpace(userId))
        {
            return BadRequest(new { message = "UserId is required." });
        }

        var payments = await _context.Payments
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();

        return Ok(payments.Select(p => MapToResponseDto(p, "History record retrieved.")));
    }

    /// <summary>
    /// Retrieve Admin Payment History (Recent 100)
    /// </summary>
    [HttpGet("history")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllPaymentHistory()
    {
        var payments = await _context.Payments
            .OrderByDescending(p => p.CreatedAt)
            .Take(100)
            .ToListAsync();

        return Ok(payments.Select(p => MapToResponseDto(p, "History record retrieved.")));
    }

    [HttpGet("booking/{bookingId:guid}")]
    // [Authorize]
    public async Task<IActionResult> GetPaymentByBookingId(Guid bookingId)
    {
        var payment = await _context.Payments
            .OrderByDescending(p => p.CreatedAt)
            .FirstOrDefaultAsync(p => p.BookingId == bookingId);

        if (payment == null)
        {
            return NotFound(new { message = $"Payment not found for booking {bookingId}." });
        }

        return Ok(MapToResponseDto(payment, "Payment retrieved successfully."));
    }

    [HttpGet("{id:guid}")]
    // [Authorize]
    public async Task<IActionResult> GetPaymentById(Guid id)
    {
        var payment = await _context.Payments.FindAsync(id);
        if (payment == null)
        {
            return NotFound(new { message = $"Payment not found with ID {id}." });
        }

        return Ok(MapToResponseDto(payment, "Payment retrieved successfully."));
    }

    private string ResolveUserId(string? dtoUserId)
    {
        if (!string.IsNullOrWhiteSpace(dtoUserId)) return dtoUserId;

        return User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? "GuestUser";
    }

    private static PaymentResponseDto MapToResponseDto(Payment payment, string message) =>
        new PaymentResponseDto
        {
            Id = payment.Id,
            BookingId = payment.BookingId,
            UserId = payment.UserId,
            Amount = payment.Amount,
            PaymentMethod = payment.PaymentMethod,
            Status = payment.Status,
            TransactionId = payment.TransactionId,
            CreatedAt = payment.CreatedAt,
            Message = message
        };
}

