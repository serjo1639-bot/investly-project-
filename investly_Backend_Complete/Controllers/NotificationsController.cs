// ============================================================
// NOTIFICATIONS CONTROLLER - User notification management
// ============================================================
// These endpoints are for IN-APP notifications stored in the database.
// They do not require Firebase. The mobile/admin frontend asks the backend
// for notifications using these endpoints and renders them inside the app.
//
// Firebase would only be needed for native phone push notifications.

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    // GET /api/notifications - reads notifications created automatically by services.
    [HttpGet]
    public async Task<IActionResult> GetNotifications([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] bool unreadOnly = false)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _notificationService.GetAllAsync(userId.Value, page, pageSize, unreadOnly);
        return Ok(result);
    }

    // GET /api/notifications/unread-count - used by the frontend badge/counter.
    [HttpGet("unread-count")]
    public async Task<IActionResult> GetUnreadCount()
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var count = await _notificationService.GetUnreadCountAsync(userId.Value);
        return Ok(new { UnreadCount = count });
    }

    // POST /api/notifications/mark-read - user opened/acknowledged notification(s).
    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkAsRead([FromBody] MarkReadRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        await _notificationService.MarkAsReadAsync(userId.Value, request.NotificationIds);
        return Ok(new ApiResponse { Success = true, Message = "Marked as read" });
    }

    private int? GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            return userId;
        return null;
    }
}
