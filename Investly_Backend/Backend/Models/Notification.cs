using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InvestlyFullAPI.Models;

// Represents a notification sent to a user (in-app, via SignalR)
public class Notification
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int NotificationId { get; set; }

    // Which user this notification belongs to (foreign key)
    public int UserId { get; set; }

    // The actual notification text content
    [Required]
    [MaxLength(1000)]
    public string Message { get; set; } = string.Empty;

    // Whether the user has read/dismissed this notification
    public bool IsRead { get; set; } = false;

    // When the notification was created
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Category/type of notification: "Info", "Success", "Warning", "Error"
    [MaxLength(50)]
    public string? Type { get; set; }

    // Navigation: the user this notification belongs to
    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }
}
