namespace InvestlyFullAPI.DTOs.Notification;

// DTO for returning notification data to the client
public class NotificationDto
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? Type { get; set; }
}
