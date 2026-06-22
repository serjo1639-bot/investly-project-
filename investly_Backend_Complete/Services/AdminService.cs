// ============================================================
// ADMIN SERVICE - Admin-only operations
// ============================================================
// All methods here require the Admin role (enforced by
// [Authorize(Roles = "Admin")] on AdminController).
// Even though the controller enforces this, we still validate
// data integrity in the service layer.
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Interfaces;
using Investly_Backend.Models;
using Investly_Backend.Data;
using Investly_Backend.DTOs;

namespace Investly_Backend.Services;

public class AdminService : IAdminService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public AdminService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        // Dashboard aggregates data from multiple tables
        // ToListAsync loads ALL records, then we count in memory
        // For large datasets, use CountAsync() instead (better performance)
        var users = await _context.Users.ToListAsync();
        var projects = await _context.Projects.ToListAsync();
        var investments = await _context.Investments.ToListAsync();
        var pendingWithdrawals = await _context.WithdrawalRequests.CountAsync(w => w.Status == "Pending");

        return new AdminDashboardDto
        {
            TotalUsers = users.Count,
            TotalProjects = projects.Count,
            PendingProjects = projects.Count(p => p.Status == "Pending"),
            TotalInvestments = investments.Count,
            TotalFunding = investments.Where(i => i.Status == "Confirmed").Sum(i => i.Amount),
            PendingWithdrawals = pendingWithdrawals,
            RecentActivities = new List<object>()  // TODO: populate with real activity
        };
    }

    public async Task<PaginatedResult<UserManagementDto>> GetAllUsersAsync(int page = 1, int pageSize = 10, string search = null, string role = null)
    {
        var query = _context.Users.AsQueryable();

        // Search filter (by email or full name)
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Email.Contains(search) || (u.FirstName + " " + u.LastName).Contains(search));
        }

        var total = await query.CountAsync();
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(u => u.UserWallet)  // Include wallet balance
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)  // Include roles (then chain to role name)
            .ToListAsync();

        var dtos = users.Select(u => new UserManagementDto
        {
            UserId = u.UserId,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            IsActive = u.IsActive,
            Roles = u.UserRoles.Select(ur => ur.Role.RoleName).ToList(),
            CreatedAt = u.CreatedAt,
            WalletBalance = u.UserWallet?.Balance ?? 0
        }).ToList();

        return new PaginatedResult<UserManagementDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PaginatedResult<PendingKycDto>> GetPendingKycsAsync(int page = 1, int pageSize = 10)
    {
        // "Pending" KYC = investor profile has uploaded documents but not yet reviewed
        var query = _context.InvestorProfiles.Where(ip => ip.IdDocumentUrl != null);
        var total = await query.CountAsync();

        var profiles = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(ip => ip.User)  // Include user info (name, email)
            .ToListAsync();

        var dtos = profiles.Select(p => new PendingKycDto
        {
            ProfileId = p.ProfileId,
            UserId = p.UserId,
            Email = p.User?.Email ?? "",
            FullName = p.User != null ? p.User.FirstName + " " + p.User.LastName : "",
            Occupation = p.Occupation ?? "",
            AnnualIncome = p.AnnualIncome,
            IdDocumentUrl = p.IdDocumentUrl ?? "",
            CreatedAt = p.CreatedAt
        }).ToList();

        return new PaginatedResult<PendingKycDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<bool> ApproveKycAsync(int profileId)
    {
        var profile = await _context.InvestorProfiles.FindAsync(profileId);
        if (profile == null)
            return false;

        profile.KycStatus = "Approved";
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> RejectKycAsync(int profileId, string reason)
    {
        var profile = await _context.InvestorProfiles.FindAsync(profileId);
        if (profile == null)
            return false;

        profile.KycStatus = "Rejected";
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<PaginatedResult<ProjectDto>> GetAllProjectsAsync(int page = 1, int pageSize = 10, string status = null, string search = null)
    {
        var query = _context.Projects.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(p => p.Status == status);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => p.Title.Contains(search) || p.Description.Contains(search));
        }

        var total = await query.CountAsync();
        var projects = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(p => p.Category)
            // ThenInclude chains through navigation: Project -> CreatorProfile -> User
            .Include(p => p.CreatorProfile).ThenInclude(cp => cp.User)
            .ToListAsync();

        var dtos = projects.Select(p => new ProjectDto
        {
            ProjectId = p.ProjectId,
            Reference = p.ProjectId.ToString("D6"),
            Title = p.Title,
            Description = p.Description,
            City = p.City ?? "",
            FundingGoal = p.FundingGoal,
            ImageUrl = p.ImageUrl,
            MaxInvestment = p.MaxInvestment ?? 0,
            EquityOffered = p.EquityOffered ?? 0,
            CurrentAmount = p.CurrentAmount,
            Status = p.Status,
            CategoryId = p.CategoryId ?? 0,
            CategoryName = p.Category?.Name ?? "",
            CreatorProfileId = p.CreatorProfileId,
            CompanyName = p.CreatorProfile?.CompanyName ?? "",
            OwnerName = p.CreatorProfile?.User != null
                ? p.CreatorProfile.User.FirstName + " " + p.CreatorProfile.User.LastName
                : "",
            CreatedAt = p.CreatedAt
        }).ToList();

        return new PaginatedResult<ProjectDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<PaginatedResult<BlockedEntrepreneurDto>> GetBlockedEntrepreneursAsync(int page = 1, int pageSize = 10)
    {
        var query = _context.EntrepreneurProfiles
            .Include(p => p.User)
            .Where(p => p.IsBlocked);

        var total = await query.CountAsync();
        var profiles = await query
            .OrderByDescending(p => p.UpdatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = profiles.Select(p => new BlockedEntrepreneurDto
        {
            ProfileId = p.ProfileId,
            UserId = p.UserId,
            Email = p.User?.Email ?? "",
            FullName = p.User != null ? p.User.FirstName + " " + p.User.LastName : "",
            CompanyName = p.CompanyName ?? "",
            DeletedProjectsCount = p.DeletedProjectsCount,
            EntrepreneurBlockedCount = p.EntrepreneurBlockedCount,
            IsBlocked = p.IsBlocked,
            UpdatedAt = p.UpdatedAt
        }).ToList();

        return new PaginatedResult<BlockedEntrepreneurDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<bool> UnblockEntrepreneurAsync(int profileId)
    {
        var profile = await _context.EntrepreneurProfiles.FindAsync(profileId);
        if (profile == null || !profile.IsBlocked)
            return false;

        profile.IsBlocked = false;
        profile.DeletedProjectsCount = 0;
        profile.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        await _notificationService.CreateAsync(
            profile.UserId,
            "EntrepreneurUnblocked",
            "تم رفع الحظر",
            "Entrepreneur account unblocked",
            "قامت الإدارة برفع الحظر عن حساب رائد الأعمال الخاص بك. يمكنك الآن متابعة إجراءات المشاريع.",
            "Admin approved unblocking your entrepreneur account. You can now continue project actions.",
            null,
            null);

        return true;
    }
}
