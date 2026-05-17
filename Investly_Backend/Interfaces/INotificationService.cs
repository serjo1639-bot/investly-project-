using InvestlyFullAPI.DTOs.Notification;

namespace InvestlyFullAPI.Interfaces;

// Manages in-app notifications for users
public interface INotificationService
{
    // Get all notifications for a user, optionally filtered by read status
    Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, bool? isRead = null);

    // Mark a single notification as read
    Task MarkAsReadAsync(int notificationId, int userId);

    // Mark all notifications for a user as read
    Task MarkAllAsReadAsync(int userId);

    // Create a new notification (also pushes real-time via SignalR)
    Task CreateNotificationAsync(int userId, string message, string? type = null);

    // Get the count of unread notifications for a user
    Task<int> GetUnreadCountAsync(int userId);
}
