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

using Microsoft.AspNetCore.SignalR;
namespace Investly_Backend.Hubs;

// Hub is the base class from SignalR.
// Methods defined here can be called by connected clients.
// Clients can also call methods on the server via this hub.
public class NotificationHub : Hub
{
    // Clients call this when they connect to join their personal notification group
    // Groups let us send messages to SPECIFIC users (not all connected clients)
    // Example: user with ID 5 joins "user_5" group
    // When a notification is created for user 5, we send to "user_5" group
    public async Task JoinUserGroup(string userId) => 
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");

    // Clients call this when they disconnect or navigate away
    public async Task LeaveUserGroup(string userId) => 
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");

    // Called automatically when a SignalR connection is established
    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    // Called automatically when a SignalR connection is lost
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
