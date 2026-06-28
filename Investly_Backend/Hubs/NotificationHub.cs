// ============================================================
// NOTIFICATION HUB - SIGNALR REAL-TIME COMMUNICATION
// ============================================================
// SignalR is a real-time web framework for ASP.NET Core.
// It uses WebSockets (falling back to other transports) to send
// data from SERVER to CLIENTS instantly (no polling).
//
// USE CASE:
// When a project status changes or a new notification is created,
// the server can PUSH that update to connected clients immediately.
// Without SignalR, the client would need to constantly REFRESH/POLL.
//
// HOW IT WORKS:
// 1. Client connects to /hubs/notifications via JavaScript
// 2. Client calls JoinUserGroup to join their user group
// 3. Server can send messages to specific user groups
// 4. Client receives real-time notifications
// ============================================================

using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
namespace Investly_Backend.Hubs;

// Hub is the base class from SignalR.
// Methods defined here can be called by connected clients.
// Clients can also call methods on the server via this hub.
[Authorize]
public class NotificationHub : Hub
{
    // SignalR uses the authenticated NameIdentifier claim as the user key.
    // Clients cannot subscribe to another user's notification stream.
    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (!string.IsNullOrEmpty(userId))
        {
            //gets the user ID from the JWT token.
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        await base.OnConnectedAsync();
    }
}
