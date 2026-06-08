// IAdminService - Contract for admin-only operations

using Investly_Backend.DTOs;

namespace Investly_Backend.Interfaces;

public interface IAdminService
{
    Task<AdminDashboardDto> GetDashboardAsync();
    Task<PaginatedResult<UserManagementDto>> GetAllUsersAsync(int page, int pageSize, string? search, string? role);
    Task<PaginatedResult<PendingKycDto>> GetPendingKycsAsync(int page, int pageSize);
    Task<bool> ApproveKycAsync(int profileId);
    Task<bool> RejectKycAsync(int profileId, string reason);
    Task<PaginatedResult<ProjectDto>> GetAllProjectsAsync(int page, int pageSize, string? status, string? search);
}
