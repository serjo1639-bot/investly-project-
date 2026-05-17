using System.ComponentModel.DataAnnotations;

namespace InvestlyFullAPI.DTOs.Notification;

// DTO for creating a new notification for a user
public class CreateNotificationDto
{
    [Required]
    public int UserId { get; set; }

    [Required(ErrorMessage = "Message is required")]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    // Optional: "Info", "Success", "Warning", "Error"
    [MaxLength(50)]
    public string? Type { get; set; }
}
