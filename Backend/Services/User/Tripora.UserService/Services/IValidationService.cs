using Tripora.UserService.DTOs;

namespace Tripora.UserService.Services;

public record ValidationResult(bool IsValid, List<string> Errors);

public interface IValidationService
{
    ValidationResult ValidateRegistration(RegisterUserRequestDto request);
    ValidationResult ValidateLogin(LoginRequestDto request);
}
