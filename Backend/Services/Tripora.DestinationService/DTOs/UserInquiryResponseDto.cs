namespace Tripora.DestinationService.DTOs;

/// <summary>Inquiry details returned to the authenticated user who submitted them.</summary>
public sealed record UserInquiryResponseDto(
    int Id,
    string Subject,
    string Message,
    string Status,
    DateTimeOffset CreatedAt,
    string? AdminResponse);
