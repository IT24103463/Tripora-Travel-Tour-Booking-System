using Tripora.DestinationService.DTOs;

namespace Tripora.DestinationService.Services;

public interface IValidationService
{
    ValidationResult ValidateCreateTour(CreateTourRequestDto request);
}

public record ValidationResult(bool IsValid, List<string> Errors);