using System.Text.RegularExpressions;
using Tripora.UserService.DTOs;

namespace Tripora.UserService.Services;

public class ValidationService : IValidationService
{
    private static readonly Regex EmailRegex = new(
        @"^[^@\s]+@[^@\s]+\.[^@\s]+$",
        RegexOptions.Compiled | RegexOptions.IgnoreCase);

    public ValidationResult ValidateRegistration(RegisterUserRequestDto request)
    {
        var errors = new List<string>();

        // 1. Full Name Validation
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            errors.Add("Full Name is required.");
        }
        else if (request.FullName.Trim().Length < 2)
        {
            errors.Add("Full Name must be at least 2 characters.");
        }
        else if (request.FullName.Trim().Length > 100)
        {
            errors.Add("Full Name cannot exceed 100 characters.");
        }

        // 2. Email Address Validation
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            errors.Add("Email Address is required.");
        }
        else if (!EmailRegex.IsMatch(request.Email.Trim()))
        {
            errors.Add("Invalid email format. Please provide a valid email address.");
        }

        // 3. Password Security Validation
        var password = request.Password ?? string.Empty;
        var passwordRequirements = new List<string>();

        if (password.Length < 8)
        {
            passwordRequirements.Add("at least 8 characters");
        }
        if (!password.Any(char.IsUpper))
        {
            passwordRequirements.Add("one uppercase letter");
        }
        if (!password.Any(char.IsLower))
        {
            passwordRequirements.Add("one lowercase letter");
        }
        if (!password.Any(char.IsDigit))
        {
            passwordRequirements.Add("one number");
        }
        if (!password.Any(ch => !char.IsLetterOrDigit(ch)))
        {
            passwordRequirements.Add("one special character");
        }

        if (passwordRequirements.Count > 0)
        {
            errors.Add($"Weak password: Password must satisfy security requirements ({string.Join(", ", passwordRequirements)}).");
        }

        // 4. Confirm Password Match
        if (string.IsNullOrEmpty(request.ConfirmPassword))
        {
            errors.Add("Confirm Password is required.");
        }
        else if (request.Password != request.ConfirmPassword)
        {
            errors.Add("Passwords do not match.");
        }

        return new ValidationResult(errors.Count == 0, errors);
    }
}
