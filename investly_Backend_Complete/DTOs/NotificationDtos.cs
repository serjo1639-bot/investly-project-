// ============================================================
// NOTIFICATION DTOS - Notification request/response objects
// ============================================================

namespace Investly_Backend.DTOs;

// Single notification record (response)
public class NotificationDto
{
    public int NotificationId { get; set; }
    public int UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string TitleAr { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string MessageAr { get; set; } = string.Empty;
    public string MessageEn { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public int? RelatedProjectId { get; set; }
    public int? RelatedInvestmentId { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Paginated notification list with unread count
public class NotificationListDto
{
    public List<NotificationDto> Notifications { get; set; } = new();
    public int UnreadCount { get; set; }
    public int TotalCount { get; set; }
}

// Request body for marking notifications as read
public class MarkReadRequest
{
    public List<int> NotificationIds { get; set; } = new();
}

public class EmailTestRequest
{
    public string To { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? Body { get; set; }
}
