// IProjectService - Contract for project CRUD and lifecycle management

using Investly_Backend.DTOs;

namespace Investly_Backend.Interfaces;

public interface IProjectService
{
    Task<PaginatedResult<ProjectDto>> GetAllAsync(int page, int pageSize, string? status, int? categoryId, string? search);
    Task<ProjectDto?> GetByIdAsync(int id);
    Task<List<ProjectListDto>> GetFeaturedAsync();
    Task<ProjectDto?> CreateAsync(int userId, CreateProjectRequest request);
    Task<ProjectDto?> UpdateAsync(int id, int userId, UpdateProjectRequest request);
    Task<bool> DeleteAsync(int id, int userId);
    Task<bool> SubmitForApprovalAsync(int id, int userId);
    Task<bool> ApproveAsync(int id);
    Task<bool> RejectAsync(int id, string reason);
    Task<ProjectStatsDto> GetStatsAsync();
    Task<List<CategoryDto>> GetCategoriesAsync();
    Task IncrementViewsAsync(int id);
}
