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
using Microsoft.EntityFrameworkCore;
using Investly_Backend.Data;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]  // Class-level = ALL methods require Admin
public class AdminController : ControllerBase
{
    private readonly IAdminService _adminService;
    private readonly IProjectService _projectService;
    private readonly INotificationService _notificationService;
    private readonly AppDbContext _context;

    public AdminController(
        IAdminService adminService,
        IProjectService projectService,
        INotificationService notificationService,
        AppDbContext context)
    {
        _adminService = adminService;
        _projectService = projectService;
        _notificationService = notificationService;
        _context = context;
    }

    // GET /api/admin/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _adminService.GetDashboardAsync();
        return Ok(stats);
    }

    // GET /api/admin/stats - Same summary under the route used by the admin dashboard Swagger.
    [HttpGet("stats")]
    public async Task<IActionResult> GetStats()
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

    // POST /api/admin/projects/{id}/approve
    [HttpPost("projects/{id}/approve")]
    public async Task<IActionResult> ApproveProject(int id)
    {
        var result = await _projectService.ApproveAsync(id);
        return Ok(result);
    }

    // POST /api/admin/projects/{id}/reject
    [HttpPost("projects/{id}/reject")]
    public async Task<IActionResult> RejectProject(int id, [FromBody] RejectProjectRequestDto request)
    {
        var result = await _projectService.RejectAsync(id, request.Reason);
        return Ok(result);
    }

    // POST /api/admin/users/{id}/ban
    [HttpPost("users/{id}/ban")]
    public async Task<IActionResult> BanUser(int id)
    {
        return await SetUserActiveState(id, false);
    }

    // POST /api/admin/users/{id}/unban
    [HttpPost("users/{id}/unban")]
    public async Task<IActionResult> UnbanUser(int id)
    {
        return await SetUserActiveState(id, true);
    }

    // POST /api/admin/users/{id}/suspend
    [HttpPost("users/{id}/suspend")]
    public async Task<IActionResult> SuspendUser(int id)
    {
        return await SetUserActiveState(id, false);
    }

    // POST /api/admin/users/{id}/unsuspend
    [HttpPost("users/{id}/unsuspend")]
    public async Task<IActionResult> UnsuspendUser(int id)
    {
        return await SetUserActiveState(id, true);
    }

    // GET /api/admin/payments - Simple payment history from wallet transaction ledger.
    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.WalletTransactions.OrderByDescending(t => t.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new
            {
                t.TransactionId,
                t.WalletId,
                t.Type,
                t.Direction,
                t.Amount,
                t.Status,
                t.ReferenceNo,
                t.Description,
                t.CreatedAt
            })
            .ToListAsync();
        return Ok(new PaginatedResult<object> { Items = items.Cast<object>().ToList(), TotalCount = total, Page = page, PageSize = pageSize });
    }

    // GET /api/admin/investments - Admin view of all investments.
    [HttpGet("investments")]
    public async Task<IActionResult> GetInvestments([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.Investments.Include(i => i.Project).OrderByDescending(i => i.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(i => new
            {
                i.InvestmentId,
                i.InvestorProfileId,
                i.ProjectId,
                ProjectTitle = i.Project.Title,
                i.Amount,
                i.Status,
                i.CreatedAt,
                i.ConfirmedAt
            })
            .ToListAsync();
        return Ok(new PaginatedResult<object> { Items = items.Cast<object>().ToList(), TotalCount = total, Page = page, PageSize = pageSize });
    }

    // POST /api/admin/notifications/send
    [HttpPost("notifications/send")]
    public async Task<IActionResult> SendNotification([FromBody] AdminSendNotificationRequest request)
    {
        var users = request.TargetUserId.Equals("all", StringComparison.OrdinalIgnoreCase)
            ? await _context.Users.Where(u => u.IsActive).Select(u => u.UserId).ToListAsync()
            : int.TryParse(request.TargetUserId, out var userId) ? new List<int> { userId } : new List<int>();

        foreach (var id in users)
        {
            await _notificationService.CreateAsync(id, request.Type, request.Title, request.Title, request.Message, request.Message, null, null);
        }

        return Ok(new { sent = users.Count });
    }

    // GET /api/admin/activity-logs - Lightweight recent activity for the dashboard.
    [HttpGet("activity-logs")]
    public async Task<IActionResult> GetActivityLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var query = _context.WalletTransactions.OrderByDescending(t => t.CreatedAt);
        var total = await query.CountAsync();
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize)
            .Select(t => new
            {
                Id = t.TransactionId,
                Action = t.Type,
                Details = t.Description,
                t.Status,
                t.CreatedAt
            })
            .ToListAsync();
        return Ok(new PaginatedResult<object> { Items = items.Cast<object>().ToList(), TotalCount = total, Page = page, PageSize = pageSize });
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

    private async Task<IActionResult> SetUserActiveState(int id, bool isActive)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        // Ban/suspend are implemented as soft deactivation so user data remains intact.
        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(true);
    }
}

public class RejectKycRequestDto
{
    public string Reason { get; set; } = string.Empty;
}
