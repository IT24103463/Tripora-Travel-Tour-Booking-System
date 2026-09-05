using Tripora.TourService.DTOs;

namespace Tripora.TourService.Services;

public class ValidationService : IValidationService
{
    public ValidationResult ValidateCreateTour(CreateTourRequestDto request)
    {
        var errors = new List<string>();

        // 1. Tour Name Validation
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            errors.Add("Tour Name is required.");
        }
        else if (request.Name.Trim().Length < 3)
        {
            errors.Add("Tour Name must be at least 3 characters.");
        }
        else if (request.Name.Trim().Length > 200)
        {
            errors.Add("Tour Name cannot exceed 200 characters.");
        }

        // 2. Description Validation
        if (string.IsNullOrWhiteSpace(request.Description))
        {
            errors.Add("Description is required.");
        }
        else if (request.Description.Trim().Length < 10)
        {
            errors.Add("Description must be at least 10 characters.");
        }
        else if (request.Description.Trim().Length > 2000)
        {
            errors.Add("Description cannot exceed 2000 characters.");
        }

        // 3. Destination Validation
        if (string.IsNullOrWhiteSpace(request.Destination))
        {
            errors.Add("Destination is required.");
        }
        else if (request.Destination.Trim().Length < 2)
        {
            errors.Add("Destination must be at least 2 characters.");
        }
        else if (request.Destination.Trim().Length > 200)
        {
            errors.Add("Destination cannot exceed 200 characters.");
        }

        // 4. Price Validation
        if (request.Price <= 0)
        {
            errors.Add("Price must be greater than zero.");
        }
        else if (request.Price > 1000000)
        {
            errors.Add("Price cannot exceed $1,000,000.");
        }

        // 5. Duration Validation
        if (request.DurationDays <= 0)
        {
            errors.Add("Duration must be at least 1 day.");
        }
        else if (request.DurationDays > 365)
        {
            errors.Add("Duration cannot exceed 365 days.");
        }

        // 6. Capacity Validation
        if (request.Capacity <= 0)
        {
            errors.Add("Capacity must be at least 1 person.");
        }
        else if (request.Capacity > 1000)
        {
            errors.Add("Capacity cannot exceed 1000 people.");
        }

        // 7. Image URL Validation (optional)
        if (!string.IsNullOrWhiteSpace(request.ImageUrl))
        {
            if (request.ImageUrl.Length > 500)
            {
                errors.Add("Image URL cannot exceed 500 characters.");
            }
            else if (!Uri.TryCreate(request.ImageUrl, UriKind.Absolute, out var uriResult) 
                || (uriResult.Scheme != Uri.UriSchemeHttp && uriResult.Scheme != Uri.UriSchemeHttps))
            {
                errors.Add("Image URL must be a valid HTTP or HTTPS URL.");
            }
        }

        return new ValidationResult(errors.Count == 0, errors);
    }
}