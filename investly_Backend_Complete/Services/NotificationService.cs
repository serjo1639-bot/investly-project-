// ============================================================
// NOTIFICATION SERVICE - User notification management
// ============================================================
// Notifications are bilingual (Arabic + English) to support
// a diverse user base. This service handles CRUD operations
// and read/unread tracking.
//
// IMPORTANT:
// This is IN-APP notification logic. It writes notifications to
// the SQL Server Notifications table so users can see them after
// opening the app or dashboard. This does NOT require Firebase.
//
// Firebase is only required if we want PUSH notifications that
// appear on the phone lock screen / notification tray while the
// mobile app is closed or in the background. That future feature
// would need device tokens from the mobile app.
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

    // Reads the current user's in-app notifications from the database.
    // The frontend calls GET /api/notifications to display this list.
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
            TitleAr = n.TitleAr,
            TitleEn = n.TitleEn,
            MessageAr = n.MessageAr,
            MessageEn = n.MessageEn,
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

    // Creates an automatic in-app notification when a backend event happens.
    // Example: ProjectService calls this when an entrepreneur gets a delete warning
    // or is blocked. AdminService calls it when an admin unblocks the entrepreneur.
    //
    // This method only inserts a row into the Notifications table.
    // It does not send an email, SMS, or Firebase push notification.
    public async Task CreateAsync(int uid, string type, string titleAr, string titleEn, string messageAr, string messageEn, int? projectId, int? investmentId)
    {
        titleEn = string.IsNullOrWhiteSpace(titleEn) ? titleAr : titleEn;
        titleAr = string.IsNullOrWhiteSpace(titleAr) ? titleEn : titleAr;
        messageEn = string.IsNullOrWhiteSpace(messageEn) ? messageAr : messageEn;
        messageAr = string.IsNullOrWhiteSpace(messageAr) ? messageEn : messageAr;

        var notification = new Notification
        {
            UserId = uid,
            Type = type,
            TitleAr = titleAr,
            TitleEn = titleEn,
            MessageAr = messageAr,
            MessageEn = messageEn,
            IsRead = false,
            RelatedProjectId = projectId,
            RelatedInvestmentId = investmentId,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();  // INSERT INTO Notifications ...
    }

}
