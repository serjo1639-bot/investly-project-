// ============================================================
// ADMIN CONTROLLER - Admin dashboard and management
// ============================================================
// ALL endpoints require Admin role (class-level [Authorize]).
// This is more secure than adding [Authorize] to each method.
// If someone forgets to add [Authorize], the endpoint would be
// public - class-level prevents that mistake.
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]  // Class-level = ALL methods require Admin
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;

    public AdminController(IAdminService adminService)
    {
        _adminService = adminService;
    }

    // GET /api/admin/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _adminService.GetDashboardAsync();
        return Ok(stats);
    }

    // GET /api/admin/users?page=1&search=...
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? role = null)
    {
        var users = await _adminService.GetAllUsersAsync(page, pageSize, search, role);
        return Ok(users);
    }

    // GET /api/admin/projects?page=1&status=Pending
    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, [FromQuery] string? search = null)
    {
        var projects = await _adminService.GetAllProjectsAsync(page, pageSize, status, search);
        return Ok(projects);
    }

    // GET /api/admin/kyc/pending
    [HttpGet("kyc/pending")]
    public async Task<IActionResult> GetPendingKyc([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var kycRequests = await _adminService.GetPendingKycsAsync(page, pageSize);
        return Ok(kycRequests);
    }

    // POST /api/admin/kyc/{id}/approve
    [HttpPost("kyc/{id}/approve")]
    public async Task<IActionResult> ApproveKyc(int id)
    {
        var result = await _adminService.ApproveKycAsync(id);
        return Ok(result);
    }

    // POST /api/admin/kyc/{id}/reject
    [HttpPost("kyc/{id}/reject")]
    public async Task<IActionResult> RejectKyc(int id, [FromBody] RejectKycRequestDto request)
    {
        var result = await _adminService.RejectKycAsync(id, request.Reason);
        return Ok(result);
    }
}

public class RejectKycRequestDto
{
    public string Reason { get; set; } = string.Empty;
}
