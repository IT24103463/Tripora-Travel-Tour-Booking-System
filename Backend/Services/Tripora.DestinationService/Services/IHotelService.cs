using System;
using System.Threading.Tasks;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Services;

public interface IHotelService
{
    Task<List<Hotel>> GetAllHotelsAsync(bool includeInactive = false, CancellationToken cancellationToken = default);
    Task<Hotel?> GetHotelByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<(bool IsSuccess, Hotel? Hotel, string ErrorMessage)> UpdateAvailabilityAsync(Guid id, UpdateAvailabilityRequestDto dto);
    Task<(bool IsSuccess, Hotel? Hotel, string ErrorMessage)> UpdateHotelAsync(Guid id, UpdateHotelRequestDto dto);
}

