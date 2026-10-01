namespace Tripora.DestinationService.DTOs;

public sealed record InquiryResponseDto(
    int Id,
    string Name,
    string PhoneNumber,
    string Reason,
    string Message,
    string Status,
    DateTime CreatedAt);