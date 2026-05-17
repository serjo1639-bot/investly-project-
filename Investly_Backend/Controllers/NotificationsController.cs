using InvestlyFullAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestlyFullAPI.Controllers;

// NotificationsController lets the frontend read and update in-app notifications.
// New notifications are created by services, not directly by this controller.
[ApiController]
[Route("api/[controller]")]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    // GET /api/notifications/{userId}?isRead=false
    // isRead is optional: omit it for all notifications, true for read, false for unread.
    [HttpGet("{userId:int}")]
    [Authorize]
    public async Task<IActionResult> GetNotifications(int userId, [FromQuery] bool? isRead)
    {
        var notifications = await _notificationService.GetUserNotificationsAsync(userId, isRead);
        return Ok(notifications);
    }

    // GET /api/notifications/{userId}/unread-count
    // Useful for showing a badge count in the frontend navigation/header.
    [HttpGet("{userId:int}/unread-count")]
    [Authorize]
    public async Task<IActionResult> GetUnreadCount(int userId)
    {
        var count = await _notificationService.GetUnreadCountAsync(userId);
        return Ok(new { UnreadCount = count });
    }

    // PUT /api/notifications/{notificationId}/read?userId=1
    // Marks one notification as read. NoContent means the update succeeded
    // and there is no response body to return.
    [HttpPut("{notificationId:int}/read")]
    [Authorize]
    public async Task<IActionResult> MarkAsRead(int notificationId, [FromQuery] int userId)
    {
        await _notificationService.MarkAsReadAsync(notificationId, userId);
        return NoContent();
    }

    // PUT /api/notifications/{userId}/read-all
    // Bulk update for when the user clicks something like "Mark all as read".
    [HttpPut("{userId:int}/read-all")]
    [Authorize]
    public async Task<IActionResult> MarkAllAsRead(int userId)
    {
        await _notificationService.MarkAllAsReadAsync(userId);
        return NoContent();
    }
}
