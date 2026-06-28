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
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    private readonly AppDbContext _context;

    public AdminController(
        IAdminService adminService,
        IProjectService projectService,
        IEmailService emailService,
        INotificationService notificationService,
        AppDbContext context)
    {
        _adminService = adminService;
        _projectService = projectService;
        _emailService = emailService;
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
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null, [FromQuery] string? role = null, [FromQuery] string? status = null)
    {
        var users = await _adminService.GetAllUsersAsync(page, pageSize, search, role, status);
        return Ok(users);
    }

    // GET /api/admin/projects?page=1&status=Pending
    [HttpGet("projects")]
    public async Task<IActionResult> GetProjects([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, [FromQuery] string? search = null, [FromQuery] int? categoryId = null)
    {
        var projects = await _adminService.GetAllProjectsAsync(page, pageSize, status, search, categoryId);
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


    // DELETE /api/admin/projects/{id}
    // Admin project delete is a soft delete so project-related records stay safe.
    [HttpDelete("projects/{id}")]
    public async Task<IActionResult> DeleteProject(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null || project.IsDeleted)
            return NotFound(new ApiResponse { Success = false, Message = "Project not found" });

        project.IsDeleted = true;
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse { Success = true, Message = "Project deleted" });
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


    // DELETE /api/admin/users/{id}
    // Dashboard delete is a soft delete: hide the user and disable login, but keep financial history intact.
    [HttpDelete("users/{id}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null || user.IsDeleted)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        user.IsDeleted = true;
        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse { Success = true, Message = "User deleted" });
    }
    // GET /api/admin/payments - Simple payment history from wallet transaction ledger.
    [HttpGet("payments")]
    public async Task<IActionResult> GetPayments([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? status = null, [FromQuery] string? search = null)
    {
        IQueryable<Investly_Backend.Models.WalletTransaction> query = _context.WalletTransactions;

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(t => t.Status == status);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(t => (t.ReferenceNo ?? "").Contains(search) || (t.Description ?? "").Contains(search));
        }

        var orderedQuery = query.OrderByDescending(t => t.CreatedAt);
        var total = await orderedQuery.CountAsync();
        var items = await orderedQuery.Skip((page - 1) * pageSize).Take(pageSize)
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
        if (user == null || user.IsDeleted)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        // Ban/suspend use IsBlocked so the dashboard status and database attribute match.
        user.IsBlocked = !isActive;
        user.IsActive = isActive;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(true);
    }
    // GET: api/admin/blacklist/entrepreneurs
    // Lists entrepreneurs automatically blocked by the 2-delete rule.
    [HttpGet("blacklist/entrepreneurs")]
    public async Task<IActionResult> GetBlacklistedEntrepreneurs()
    {
        var items = await _context.EntrepreneurProfiles
            .Where(p => p.IsBlocked)
            .Include(p => p.User)
            .Select(p => new BlacklistedEntrepreneurDto
            {
                ProfileId = p.ProfileId,
                UserId = p.UserId,
                Email = p.User.Email,
                FullName = p.User.FirstName + " " + p.User.LastName,
                CompanyName = p.CompanyName ?? "",
                DeletedProjectsCount = p.DeletedProjectsCount,
                EntrepreneurBlockedCount = p.EntrepreneurBlockedCount,
                IsBlocked = p.IsBlocked
            })
            .ToListAsync();

        return Ok(items);
    }

    // POST: api/admin/blacklist/entrepreneurs/{profileId}/unblock
    // Admin approval resets the current delete counter but keeps EntrepreneurBlockedCount as history.
    [HttpPost("blacklist/entrepreneurs/{profileId}/unblock")]
    public async Task<IActionResult> UnblockEntrepreneur(int profileId)
    {
        var profile = await _context.EntrepreneurProfiles.FindAsync(profileId);
        if (profile == null || !profile.IsBlocked)
            return NotFound(new ApiResponse { Success = false, Message = "Blocked entrepreneur not found" });

        profile.IsBlocked = false;
        profile.DeletedProjectsCount = 0;
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new ApiResponse { Success = true, Message = "Entrepreneur unblocked" });
    }
    // POST: api/admin/email/test
    // Admin-only Resend smoke test. Configure Email:ResendApiKey and Email:FromEmail before using this.
    [HttpPost("email/test")]
    public async Task<IActionResult> SendTestEmail([FromBody] EmailTestRequest request)
    {
        await _emailService.SendEmailAsync(
            request.To,
            request.Subject ?? "Investly email test",
            request.Body ?? "If you received this email, Investly Resend settings are working.",
            false);

        return Ok(new ApiResponse { Success = true, Message = "Test email sent" });
    }

    [HttpPost("notifications/send")]
    public async Task<IActionResult> SendNotification([FromBody] AdminSendNotificationRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Message))
            return BadRequest(new ApiResponse { Success = false, Message = "Title and message are required" });

        List<int> userIds;
        if (string.Equals(request.TargetUserId, "all", StringComparison.OrdinalIgnoreCase) ||
            string.IsNullOrWhiteSpace(request.TargetUserId))
        {
            userIds = await _context.Users
                .Where(u => u.IsActive && !u.IsDeleted)
                .Select(u => u.UserId)
                .ToListAsync();
        }
        else if (int.TryParse(request.TargetUserId, out var userId) &&
                 await _context.Users.AnyAsync(u => u.UserId == userId && !u.IsDeleted))
        {
            userIds = new List<int> { userId };
        }
        else
        {
            return NotFound(new ApiResponse { Success = false, Message = "Target user not found" });
        }

        await _notificationService.CreateManyAsync(
            userIds,
            string.IsNullOrWhiteSpace(request.Type) ? "system" : request.Type.ToLowerInvariant(),
            request.Title,
            request.Title,
            request.Message,
            request.Message);

        return Ok(new ApiResponse
        {
            Success = true,
            Message = $"Notification sent to {userIds.Count} user(s)"
        });
    }

    // GET /api/admin/escrow
    [HttpGet("escrow")]
    public async Task<IActionResult> GetEscrowWallets([FromQuery] int page = 1, [FromQuery] int pageSize = 10, [FromQuery] string? search = null)
    {
        var result = await _adminService.GetEscrowWalletsAsync(page, pageSize, search);
        return Ok(result);
    }

    // GET /api/admin/escrow/{projectId}
    [HttpGet("escrow/{projectId:int}")]
    public async Task<IActionResult> GetEscrowWallet(int projectId)
    {
        var result = await _adminService.GetEscrowWalletByProjectIdAsync(projectId);
        if (result == null)
            return NotFound(new ApiResponse { Success = false, Message = "Escrow wallet not found" });
        return Ok(result);
    }

    // GET /api/admin/escrow/{projectId}/transactions
    [HttpGet("escrow/{projectId:int}/transactions")]
    public async Task<IActionResult> GetEscrowTransactions(int projectId, [FromQuery] int page = 1, [FromQuery] int pageSize = 10)
    {
        var result = await _adminService.GetEscrowTransactionsAsync(projectId, page, pageSize);
        return Ok(result);
    }

    // POST /api/admin/escrow/{projectId}/release
    [HttpPost("escrow/{projectId:int}/release")]
    public async Task<IActionResult> ReleaseFunds(int projectId, [FromBody] ReleaseEscrowRequestDto request)
    {
        var (success, errorMessage) = await _adminService.ReleaseFundsAsync(projectId, request.Amount);
        return Ok(new ApiResponse { Success = success, Message = success ? "Funds released successfully" : errorMessage });
    }

    // POST /api/admin/escrow/{investmentId}/refund
    [HttpPost("escrow/{investmentId:int}/refund")]
    public async Task<IActionResult> RefundInvestment(int investmentId)
    {
        var (success, errorMessage) = await _adminService.RefundInvestmentAsync(investmentId);
        return Ok(new ApiResponse { Success = success, Message = success ? "Investment refunded successfully" : errorMessage });
    }
}

public class RejectKycRequestDto
{
    public string Reason { get; set; } = string.Empty;
}






