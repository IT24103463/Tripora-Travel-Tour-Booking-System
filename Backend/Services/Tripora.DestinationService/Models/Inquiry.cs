using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Tripora.DestinationService.Models;

[Table("inquiries")]
public class Inquiry
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Required]
    [MaxLength(150)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("phone_number")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    [Column("reason")]
    public string Reason { get; set; } = string.Empty;

    [Required]
    [Column("message")]
    public string Message { get; set; } = string.Empty;

    [MaxLength(30)]
    [Column("status")]
    public string Status { get; set; } = "UNREAD";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}