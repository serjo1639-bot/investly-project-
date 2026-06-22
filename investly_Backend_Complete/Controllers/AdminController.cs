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
    private readonly IEmailService _emailService;
    private readonly IProjectService _projectService;
    private readonly AppDbContext _context;

    public AdminController(
        IAdminService adminService,
        IEmailService emailService,
        IProjectService projectService,
        AppDbContext context)
    {
        _adminService = adminService;
        _emailService = emailService;
        _projectService = projectService;
        _context = context;
    }

    // GET /api/admin/dashboard
    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardStats()
    {
        var stats = await _adminService.GetDashboardAsync();
        return Ok(stats);
    }

    // GET /api/admin/stats
    // Compatibility route for the Next.js admin dashboard. The backend's main
    // endpoint is /dashboard, but older dashboard code called this /stats alias.
    [HttpGet("stats")]
    public async Task<IActionResult> GetStatsAlias()
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
    // Dashboard compatibility wrapper around the real project lifecycle endpoint.
    [HttpPost("projects/{id}/approve")]
    public async Task<IActionResult> ApproveProject(int id)
    {
        var result = await _projectService.ApproveAsync(id);
        return Ok(new ApiResponse { Success = result, Message = result ? "Project approved" : "Project not found or cannot be approved" });
    }

    // POST /api/admin/projects/{id}/reject
    // Dashboard compatibility wrapper around the real project lifecycle endpoint.
    [HttpPost("projects/{id}/reject")]
    public async Task<IActionResult> RejectProject(int id, [FromBody] RejectProjectRequestDto request)
    {
        var result = await _projectService.RejectAsync(id, request.Reason);
        return Ok(new ApiResponse { Success = result, Message = result ? "Project rejected" : "Project not found or cannot be rejected" });
    }

    // POST /api/admin/users/{id}/suspend
    // The database stores one simple IsActive flag, so suspend/ban both map to deactivate.
    [HttpPost("users/{id}/suspend")]
    [HttpPost("users/{id}/ban")]
    public async Task<IActionResult> SuspendUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new ApiResponse { Success = true, Message = "User deactivated" });
    }

    // POST /api/admin/users/{id}/unsuspend
    // Reverse of suspend/ban: reactivate the user account.
    [HttpPost("users/{id}/unsuspend")]
    [HttpPost("users/{id}/unban")]
    public async Task<IActionResult> UnsuspendUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new ApiResponse { Success = true, Message = "User activated" });
    }

    // GET /api/admin/investments
    // Admin dashboard list endpoint. The regular /api/investments endpoints are
    // user-focused, so this projects all investments into the table shape the UI reads.
    [HttpGet("investments")]
    public async Task<IActionResult> GetInvestments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] int? userId = null,
        [FromQuery] int? projectId = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.Investments
            .Include(i => i.Project)
            .Include(i => i.InvestorProfile)
                .ThenInclude(p => p.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(i => i.Status == status);

        if (userId.HasValue)
            query = query.Where(i => i.InvestorProfile.UserId == userId.Value);

        if (projectId.HasValue)
            query = query.Where(i => i.ProjectId == projectId.Value);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(i => i.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new
            {
                id = i.InvestmentId,
                investmentId = i.InvestmentId,
                projectId = i.ProjectId,
                projectTitle = i.Project.Title,
                reference = i.Project.Reference,
                amount = i.Amount,
                status = i.Status,
                fundingPercentage = i.FundingPercentage,
                equityPercentage = i.EquityPercentage,
                investorId = i.InvestorProfile.UserId,
                investorName = i.InvestorProfile.User.FirstName + " " + i.InvestorProfile.User.LastName,
                createdAt = i.CreatedAt,
                updatedAt = i.ConfirmedAt ?? i.CreatedAt
            })
            .ToListAsync();

        return Ok(new PaginatedResult<object>
        {
            Items = items.Cast<object>().ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET /api/admin/payments
    // Uses WalletTransactions as the backend payment/audit source.
    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.WalletTransactions
            .Include(t => t.Wallet)
                .ThenInclude(w => w.User)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
            query = query.Where(t => t.Status == status);

        var total = await query.CountAsync();
        var items = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(t => new
            {
                id = t.TransactionId,
                amount = t.Amount,
                currency = "LYD",
                method = t.Type,
                status = t.Status,
                userId = t.Wallet.UserId,
                userName = t.Wallet.User.FirstName + " " + t.Wallet.User.LastName,
                transactionId = t.ReferenceNo ?? t.TransactionId.ToString(),
                createdAt = t.CreatedAt,
                updatedAt = t.CompletedAt ?? t.CreatedAt
            })
            .ToListAsync();

        return Ok(new PaginatedResult<object>
        {
            Items = items.Cast<object>().ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        });
    }

    // GET /api/admin/activity-logs
    // There is no ActivityLogs table yet. Return a valid empty page so the live
    // dashboard does not fall back to fake activity while that feature is unfinished.
    [HttpGet("activity-logs")]
    public IActionResult GetActivityLogs([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? adminId = null)
    {
        return Ok(new PaginatedResult<object>
        {
            Items = new List<object>(),
            TotalCount = 0,
            Page = Math.Max(page, 1),
            PageSize = Math.Clamp(pageSize, 1, 100)
        });
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

    // POST /api/admin/email/test
    // Admin-only Resend test endpoint. Use this after configuring Email settings.
    // This sends a real email through Resend. It does not use Firebase.
    [HttpPost("email/test")]
    public async Task<IActionResult> SendTestEmail([FromBody] EmailTestRequest request)
    {
        await _emailService.SendEmailAsync(
            request.To,
            request.Subject ?? "Investly email test",
            request.Body ?? "If you received this email, Investly SMTP settings are working.",
            false);

        return Ok(new ApiResponse { Success = true, Message = "Test email sent" });
    }

    // GET /api/admin/blacklist/entrepreneurs
    [HttpGet("blacklist/entrepreneurs")]
    public async Task<IActionResult> GetBlockedEntrepreneurs([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var result = await _adminService.GetBlockedEntrepreneursAsync(page, pageSize);
        return Ok(result);
    }

    // POST /api/admin/blacklist/entrepreneurs/{profileId}/unblock
    [HttpPost("blacklist/entrepreneurs/{profileId}/unblock")]
    public async Task<IActionResult> UnblockEntrepreneur(int profileId)
    {
        var result = await _adminService.UnblockEntrepreneurAsync(profileId);
        return Ok(new ApiResponse { Success = result, Message = result ? "Entrepreneur unblocked" : "Blocked entrepreneur not found" });
    }

    private int? GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            return userId;
        return null;
    }
}

public class RejectKycRequestDto
{
    public string Reason { get; set; } = string.Empty;
}
