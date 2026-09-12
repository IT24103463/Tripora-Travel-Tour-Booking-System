using System;
using System.ComponentModel.DataAnnotations;

namespace Tripora.DestinationService.DTOs;

public class CreateHotelRequestDto
{
    [Required(ErrorMessage = "Name is required.")]
    public string Name { get; set; } = string.Empty;

    [Required(ErrorMessage = "Description is required.")]
    public string Description { get; set; } = string.Empty;

    [Required(ErrorMessage = "Location is required.")]
    public string Location { get; set; } = string.Empty;

    [Range(0.01, double.MaxValue, ErrorMessage = "Price must be greater than zero.")]
    public decimal PricePerNight { get; set; }

    [Range(0, int.MaxValue, ErrorMessage = "Available rooms cannot be negative.")]
    public int AvailableRooms { get; set; }

    public bool IsActive { get; set; } = true;

    public string? ImageUrl { get; set; }

    [Range(0.0, 5.0, ErrorMessage = "Rating must be between 0 and 5.")]
    public double Rating { get; set; } = 0.0;

    public string Amenities { get; set; } = string.Empty;
}

public class UpdateHotelRequestDto : CreateHotelRequestDto
{
}
