using Tripora.TourService.DTOs;

namespace Tripora.TourService.Services;

public interface IValidationService
{
    ValidationResult ValidateCreateTour(CreateTourRequestDto request);
}

public record ValidationResult(bool IsValid, List<string> Errors);