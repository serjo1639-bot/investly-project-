// INotificationService - Contract for notification operations

using Investly_Backend.DTOs;

namespace Investly_Backend.Interfaces;

public interface INotificationService
{
    Task<NotificationListDto> GetAllAsync(int userId, int page, int pageSize, bool unreadOnly);
    Task<int> GetUnreadCountAsync(int userId);
    Task MarkAsReadAsync(int userId, List<int> notificationIds);
    Task MarkAllAsReadAsync(int userId);
    Task CreateAsync(int userId, string type, string titleAr, string titleEn, string messageAr, string messageEn, int? projectId, int? investmentId);
}
