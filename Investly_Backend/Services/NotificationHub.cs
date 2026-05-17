using Microsoft.AspNetCore.SignalR;

namespace InvestlyFullAPI.Services;

// SignalR Hub for real-time notifications
// Clients connect to /notificationHub endpoint
// Once connected, they join their own private group to receive personal notifications
public class NotificationHub : Hub
{
    // Called by the client after connecting to join their notification group
    // Each user gets a private group called "user_{userId}"
    // This ensures users only receive their own notifications
    public async Task JoinUserGroup(int userId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
    }

    // Optional: leave group when disconnecting
    public async Task LeaveUserGroup(int userId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"user_{userId}");
    }
}
