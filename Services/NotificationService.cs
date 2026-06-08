// ============================================================
// NOTIFICATION SERVICE - User notification management
// ============================================================
// Notifications are bilingual (Arabic + English) to support
// a diverse user base. This service handles CRUD operations
// and read/unread tracking.
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Interfaces;
using Investly_Backend.Models;
using Investly_Backend.Data;
using Investly_Backend.DTOs;

namespace Investly_Backend.Services;

public class NotificationService : INotificationService
{
    private readonly AppDbContext _context;

    public NotificationService(AppDbContext context)
    {
        _context = context;
    }

    // Get paginated notifications for a user, with optional unread-only filter
    public async Task<NotificationListDto> GetAllAsync(int uid, int page = 1, int pageSize = 10, bool unreadOnly = false)
    {
        var query = _context.Notifications.Where(n => n.UserId == uid);

        if (unreadOnly)
            query = query.Where(n => n.IsRead == false);

        var total = await query.CountAsync();
        var unreadCount = await _context.Notifications.CountAsync(n => n.UserId == uid && n.IsRead == false);

        var notifications = await query
            .OrderByDescending(n => n.CreatedAt)  // Newest first
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = notifications.Select(n => new NotificationDto
        {
            NotificationId = n.NotificationId,
            UserId = n.UserId,
            Type = n.Type,
            Title = n.Title,
            Message = n.Message,
            IsRead = n.IsRead,
            RelatedProjectId = n.RelatedProjectId,
            RelatedInvestmentId = n.RelatedInvestmentId,
            CreatedAt = n.CreatedAt
        }).ToList();

        return new NotificationListDto
        {
            Notifications = dtos,
            UnreadCount = unreadCount,
            TotalCount = total
        };
    }

    public async Task<int> GetUnreadCountAsync(int uid)
    {
        return await _context.Notifications
            .CountAsync(n => n.UserId == uid && n.IsRead == false);
    }

    public async Task MarkAsReadAsync(int uid, List<int> notificationIds)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == uid && notificationIds.Contains(n.NotificationId))
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();  // UPDATE Notifications SET IsRead = 1 WHERE ...
    }

    public async Task MarkAllAsReadAsync(int uid)
    {
        var notifications = await _context.Notifications
            .Where(n => n.UserId == uid && n.IsRead == false)
            .ToListAsync();

        foreach (var notification in notifications)
        {
            notification.IsRead = true;
        }

        await _context.SaveChangesAsync();
    }

    // Create a new notification (called from other services when events happen)
    // Example: when a project is approved, create a notification for the entrepreneur
    public async Task CreateAsync(int uid, string type, string title, string message, int? projectId, int? investmentId)
    {
        var notification = new Notification
        {
            UserId = uid,
            Type = type,
            Title = title,
            Message = message,
            IsRead = false,
            RelatedProjectId = projectId,
            RelatedInvestmentId = investmentId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();  // INSERT INTO Notifications ...
    }
}
