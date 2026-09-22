using System;
using System.Threading.Tasks;

namespace Tripora.PaymentService.Services;

public interface IBookingServiceClient
{
    Task<(bool Success, string Error)> UpdateBookingStatusAsync(Guid bookingId, string newStatus);
}

