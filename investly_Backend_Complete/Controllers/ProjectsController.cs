// ============================================================
// PROJECTS CONTROLLER - Project CRUD and lifecycle
// ============================================================
// ROLE-BASED ACCESS:
// [Authorize(Roles = "Entrepreneur")] - Only entrepreneurs can
//   create/edit/delete/submit projects.
// [Authorize(Roles = "Admin")] - Only admins can approve/reject.
// No [Authorize] on list/detail endpoints = anyone can view.
//
// ROUTE PARAMETERS: {id} in [HttpGet("{id}")] maps to the
// method parameter "int id". ASP.NET automatically parses it
// from the URL. Example: /api/projects/5 -> id = 5
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProjectsController : ControllerBase
{
    private readonly IProjectService _projectService;

    public ProjectsController(IProjectService projectService)
    {
        _projectService = projectService;
    }

    // GET /api/projects - Public list with filters
    // [FromQuery] reads parameters from the URL query string:
    //   /api/projects?page=1&pageSize=20&status=Approved
    [HttpGet]
    public async Task<IActionResult> GetProjects(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? categoryId = null,
        [FromQuery] string? search = null)
    {
        var projects = await _projectService.GetAllAsync(page, pageSize, status, categoryId, search);
        return Ok(projects);
    }

    // GET /api/projects/featured - Top 10 funded projects
    [HttpGet("featured")]
    public async Task<IActionResult> GetFeaturedProjects()
    {
        var projects = await _projectService.GetFeaturedAsync();
        return Ok(projects);
    }

    // GET /api/projects/{id} - Single project
    [HttpGet("{id}")]
    public async Task<IActionResult> GetProject(int id)
    {
        var project = await _projectService.GetByIdAsync(id);
        if (project == null)
            return NotFound(new ApiResponse { Success = false, Message = "Project not found" });
        return Ok(project);
    }

    // POST /api/projects - Create project (entrepreneur only)
    [Authorize(Roles = "Entrepreneur")]
    [HttpPost]
    public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _projectService.CreateAsync(userId.Value, request);
        return Ok(result);
    }

    // PUT /api/projects/{id} - Update project (owner only)
    [Authorize(Roles = "Entrepreneur")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateProject(int id, [FromBody] UpdateProjectRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _projectService.UpdateAsync(id, userId.Value, request);
        return Ok(result);
    }

    // DELETE /api/projects/{id} - Delete project (owner only)
    [Authorize(Roles = "Entrepreneur")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _projectService.DeleteAsync(id, userId.Value);
        return Ok(result);
    }

    // POST /api/projects/{id}/submit - Submit for admin review
    [Authorize(Roles = "Entrepreneur")]
    [HttpPost("{id}/submit")]
    public async Task<IActionResult> SubmitProject(int id)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _projectService.SubmitForApprovalAsync(id, userId.Value);
        return Ok(result);
    }

    // POST /api/projects/{id}/approve - Admin approval
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/approve")]
    public async Task<IActionResult> ApproveProject(int id)
    {
        var result = await _projectService.ApproveAsync(id);
        return Ok(result);
    }

    // POST /api/projects/{id}/reject - Admin rejection
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/reject")]
    public async Task<IActionResult> RejectProject(int id, [FromBody] RejectProjectRequestDto request)
    {
        var result = await _projectService.RejectAsync(id, request.Reason);
        return Ok(result);
    }

    // GET /api/projects/categories - List all categories
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _projectService.GetCategoriesAsync();
        return Ok(categories);
    }

    private int? GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            return userId;
        return null;
    }
}

// DTO defined here for simplicity (colocated with its only consumer)
public class RejectProjectRequestDto
{
    public string Reason { get; set; } = string.Empty;
}
