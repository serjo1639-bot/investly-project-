using InvestlyFullAPI.Data;
using InvestlyFullAPI.DTOs.Notification;
using InvestlyFullAPI.Interfaces;
using InvestlyFullAPI.Models;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace InvestlyFullAPI.Services;

// NotificationService manages in-app notifications and pushes real-time updates via SignalR
public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(AppDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // Get all notifications for a user, with optional read/unread filter
    public async Task<List<NotificationDto>> GetUserNotificationsAsync(int userId, bool? isRead = null)
    {
        var query = _context.Notifications.Where(n => n.UserId == userId);

        if (isRead.HasValue)
        {
            query = query.Where(n => n.IsRead == isRead.Value);
        }

        // Most recent notifications first
        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)
            .ToListAsync();

        return notifications.Select(MapToDto).ToList();
    }

    // Mark a single notification as read
    public async Task MarkAsReadAsync(int notificationId, int userId)
    {
        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.NotificationId == notificationId && n.UserId == userId);

        if (notification == null) return;

        notification.IsRead = true;
        await _context.SaveChangesAsync();
    }

    // Mark ALL notifications for a user as read (bulk operation)
    public async Task MarkAllAsReadAsync(int userId)
    {
        var unreadNotifications = await _context.Notifications
            .Where(n => n.UserId == userId && !n.IsRead)
            .ToListAsync();

        foreach (var notification in unreadNotifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }

    // Create a new notification AND push it to the user in real-time via SignalR
    public async Task CreateNotificationAsync(int userId, string message, string? type = null)
    {
        var notification = new Notification
        {
            UserId = userId,
            Message = message,
            Type = type ?? "Info",
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();

        // Send real-time notification via SignalR
        // The client listens on "ReceiveNotification" event
        await _hubContext.Clients.Group($"user_{userId}")
            .SendAsync("ReceiveNotification", MapToDto(notification));
    }

    // Count how many unread notifications a user has (useful for badges)
    public async Task<int> GetUnreadCountAsync(int userId)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == userId && !n.IsRead);
    }

    // Helper: convert Notification model to DTO
    private static NotificationDto MapToDto(Notification notification)
    {
        return new NotificationDto
        {
            NotificationId = notification.NotificationId,
            UserId = notification.UserId,
            Message = notification.Message,
            IsRead = notification.IsRead,
            CreatedAt = notification.CreatedAt,
            Type = notification.Type
        };
    }
}
