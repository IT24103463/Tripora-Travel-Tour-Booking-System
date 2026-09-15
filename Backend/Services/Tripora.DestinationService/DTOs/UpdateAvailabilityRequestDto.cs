using System;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.DTOs;

public class UpdateAvailabilityRequestDto
{
    public int? Capacity { get; set; }
    public int? Available { get; set; }
    public ItemStatus? Status { get; set; }
}
