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
using Investly_Backend.Hubs;
using Microsoft.AspNetCore.SignalR;

namespace Investly_Backend.Services;

public class NotificationService : INotificationService
{
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.OrdinalIgnoreCase)
    {
        "investment", "project", "system", "wallet", "other", "Admin",
        "ProjectSubmitted", "ProjectApproved", "ProjectRejected",
        "InvestmentCreated", "InvestmentConfirmed", "InvestmentCancelled",
        "DepositCompleted", "WithdrawalRequested", "WithdrawalApproved", "WithdrawalRejected",
        "KycApproved", "KycRejected", "EscrowReleased", "RefundIssued", "Welcome"
    };

    private readonly AppDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(AppDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    // Get paginated notifications for a user, with optional unread-only filter
    public async Task<NotificationListDto> GetAllAsync(int uid, int page = 1, int pageSize = 10, bool unreadOnly = false)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var query = _context.Notifications.AsNoTracking().Where(n => n.UserId == uid);

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
        await SendUnreadCountAsync(uid);
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
        await SendUnreadCountAsync(uid);
    }

    // Create a new notification (called from other services when events happen)
    // Example: when a project is approved, create a notification for the entrepreneur
    public async Task CreateAsync(int uid, string type, string titleAr, string titleEn, string messageAr, string messageEn, int? projectId, int? investmentId)
    {
        var notification = BuildNotification(uid, type, titleAr, titleEn, messageAr, messageEn, projectId, investmentId);

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        await PublishAsync(notification);
    }

    public async Task CreateManyAsync(IEnumerable<int> userIds, string type, string titleAr, string titleEn, string messageAr, string messageEn, int? projectId = null, int? investmentId = null)
    {
        var notifications = userIds
            .Distinct()
            .Select(uid => BuildNotification(uid, type, titleAr, titleEn, messageAr, messageEn, projectId, investmentId))
            .ToList();

        if (notifications.Count == 0) return;

        _context.Notifications.AddRange(notifications);
        await _context.SaveChangesAsync();

        foreach (var notification in notifications)
            await PublishAsync(notification);
    }

    private static Notification BuildNotification(int uid, string type, string titleAr, string titleEn, string messageAr, string messageEn, int? projectId, int? investmentId)
    {
        // Validate notification types before the database check constraint rejects them.
        if (!AllowedTypes.Contains(type))
            throw new ArgumentException($"Notification type '{type}' is not supported. Use one of: {string.Join(", ", AllowedTypes.OrderBy(t => t))}.");

        return new Notification
        {
            UserId = uid,
            Type = Truncate(type, 20),
            TitleAr = Truncate(titleAr, 200),
            TitleEn = Truncate(string.IsNullOrWhiteSpace(titleEn) ? titleAr : titleEn, 200),
            MessageAr = Truncate(messageAr, 500),
            MessageEn = Truncate(string.IsNullOrWhiteSpace(messageEn) ? messageAr : messageEn, 500),
            IsRead = false,
            RelatedProjectId = projectId,
            RelatedInvestmentId = investmentId,
            CreatedAt = DateTime.UtcNow
        };
    }

    private async Task PublishAsync(Notification notification)
    {
        var dto = new NotificationDto
        {
            NotificationId = notification.NotificationId,
            UserId = notification.UserId,
            Type = notification.Type,
            TitleAr = notification.TitleAr,
            TitleEn = notification.TitleEn,
            MessageAr = notification.MessageAr,
            MessageEn = notification.MessageEn,
            IsRead = notification.IsRead,
            RelatedProjectId = notification.RelatedProjectId,
            RelatedInvestmentId = notification.RelatedInvestmentId,
            CreatedAt = notification.CreatedAt
        };

        await _hubContext.Clients
            .User(notification.UserId.ToString())
            .SendAsync("NotificationReceived", dto);
        await SendUnreadCountAsync(notification.UserId);
    }

    private async Task SendUnreadCountAsync(int uid)
    {
        var count = await GetUnreadCountAsync(uid);
        await _hubContext.Clients.User(uid.ToString())
            .SendAsync("UnreadCountChanged", count);
    }

    private static string Truncate(string? value, int maxLength)
    {
        var text = value?.Trim() ?? string.Empty;
        return text.Length <= maxLength ? text : text[..maxLength];
    }
}





