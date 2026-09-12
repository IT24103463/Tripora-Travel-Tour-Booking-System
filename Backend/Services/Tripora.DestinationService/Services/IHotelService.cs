using System;
using System.Threading.Tasks;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Services;

public interface IHotelService
{
    Task<(bool IsSuccess, Hotel? Hotel, string ErrorMessage)> UpdateHotelAsync(Guid id, UpdateHotelDto dto);
}
