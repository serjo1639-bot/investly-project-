// ============================================================
// PROJECT SERVICE - Full project lifecycle management
// ============================================================
// A project goes through these states:
//   Draft (creator editing) -> Pending (submitted for review)
//   -> Approved (admin accepted, escrow created)
//   -> Funded (goal reached) / Rejected (admin denied)
//
// SECURITY: We always verify that the CURRENT USER owns
// the project before allowing edits. Never trust client input!
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Interfaces;
using Investly_Backend.Models;
using Investly_Backend.Data;
using Investly_Backend.DTOs;

namespace Investly_Backend.Services;

public class ProjectService : IProjectService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notifications;

    public ProjectService(AppDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<PaginatedResult<ProjectDto>> GetAllAsync(int page = 1, int pageSize = 10, string? status = null, int? categoryId = null, string? search = null)
    {
        var query = _context.Projects.Where(p => !p.IsDeleted).AsQueryable();

        // Multiple optional filters - each only applied if the parameter is provided
        if (!string.IsNullOrEmpty(status))
            query = query.Where(p => p.Status == status);

        if (categoryId.HasValue)
            query = query.Where(p => p.CategoryId == categoryId.Value);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(p => p.Title.Contains(search) || p.Description.Contains(search));

        var total = await query.CountAsync();
        var projects = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            // Include tells EF to JOIN related tables
            // Without Include, navigation properties (Category, CreatorProfile) would be NULL
            .Include(p => p.Category)
            .Include(p => p.CreatorProfile)
            .ToListAsync();

        var dtos = projects.Select(p => new ProjectDto
        {
            ProjectId = p.ProjectId,
            Reference = p.ProjectId.ToString("D6"),  // Zero-padded to 6 digits
            Title = p.Title,
            Description = p.Description,
            City = p.City ?? "",
            FundingGoal = p.FundingGoal,
            MinInvestment = p.MinInvestment,
            MaxInvestment = p.MaxInvestment ?? 0,
            EquityOffered = p.EquityOffered ?? 0,
            CurrentAmount = p.CurrentAmount,
            Status = p.Status,
            CategoryId = p.CategoryId ?? 0,
            CreatorProfileId = p.CreatorProfileId,
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

    public async Task<ProjectDto?> GetByIdAsync(int id)
    {
        var project = await _context.Projects
            .Include(p => p.Category)
            .Include(p => p.CreatorProfile)
            .FirstOrDefaultAsync(p => p.ProjectId == id && !p.IsDeleted);

        if (project == null) return null;

        return new ProjectDto
        {
            ProjectId = project.ProjectId,
            Reference = project.ProjectId.ToString("D6"),
            Title = project.Title,
            Description = project.Description,
            City = project.City ?? "",
            FundingGoal = project.FundingGoal,
            MinInvestment = project.MinInvestment,
            MaxInvestment = project.MaxInvestment ?? 0,
            EquityOffered = project.EquityOffered ?? 0,
            CurrentAmount = project.CurrentAmount,
            Status = project.Status,
            CategoryId = project.CategoryId ?? 0,
            CategoryName = project.Category?.Name ?? "",
            CreatorProfileId = project.CreatorProfileId,
            CreatedAt = project.CreatedAt
        };
    }

    public async Task<List<ProjectListDto>> GetFeaturedAsync()
    {
        var projects = await _context.Projects
            .Where(p => p.Status == "Approved" && !p.IsDeleted)  // Only approved projects
            .OrderByDescending(p => p.CurrentAmount)  // Most funded first
            .Take(10)                                // Top 10
            .Include(p => p.Category)
            .Include(p => p.CreatorProfile)
            .ToListAsync();

        return projects.Select(p => new ProjectListDto
        {
            ProjectId = p.ProjectId,
            Reference = p.ProjectId.ToString("D6"),
            Title = p.Title,
            City = p.City ?? "",
            FundingGoal = p.FundingGoal,
            CurrentAmount = p.CurrentAmount,
            PercentFunded = p.FundingGoal > 0 ? (p.CurrentAmount / p.FundingGoal) * 100 : 0,
            Status = p.Status,
            EndDate = p.EndDate,
            ImageUrl = p.ImageUrl
        }).ToList();
    }

    public async Task<ProjectDto?> CreateAsync(int userId, CreateProjectRequest request)
    {
        // Find the entrepreneur profile for this user
        // Without a profile, they can't create projects
        var entrepreneurProfile = await _context.EntrepreneurProfiles
            .FirstOrDefaultAsync(ep => ep.UserId == userId);
        if (entrepreneurProfile == null) return null;
        // Blocked entrepreneurs must get admin approval before creating more projects.
        if (entrepreneurProfile.IsBlocked) throw new InvalidOperationException("Your entrepreneur account is blocked. Contact an admin before creating another project.");

        // Validate project financial/date rules before SQL constraints reject the row.
        ValidateProjectForCreate(request);
        var maxInvestment = request.MaxInvestment > 0 ? request.MaxInvestment : (decimal?)null;

        var project = new Project
        {
            Title = request.Title,
            Description = request.Description,
            FundingGoal = request.FundingGoal,
            MinInvestment = request.MinInvestment,
            MaxInvestment = maxInvestment,
            EquityOffered = request.EquityOffered,
            CategoryId = request.CategoryId,
            CreatorProfileId = entrepreneurProfile.ProfileId,  // Link to entrepreneur
            City = request.City,
            StartDate = request.StartDate,
            EndDate = request.EndDate,
            Duration = request.Duration,
            TeamSize = request.TeamSize,
            ImageUrl = request.ImageUrl,
            Status = "Draft",  // Always starts as Draft
            CreatedAt = DateTime.UtcNow
        };

        _context.Projects.Add(project);
        await _context.SaveChangesAsync();  // INSERT INTO Projects ...

        return new ProjectDto
        {
            ProjectId = project.ProjectId,
            Title = project.Title,
            Description = project.Description,
            FundingGoal = project.FundingGoal,
            CurrentAmount = project.CurrentAmount,
            Status = project.Status,
            CategoryId = project.CategoryId ?? 0,
            CreatedAt = project.CreatedAt
        };
    }

    public async Task<ProjectDto?> UpdateAsync(int id, int userId, UpdateProjectRequest request)
    {
        var project = await _context.Projects.FindAsync(id);
        var entrepreneurProfile = await _context.EntrepreneurProfiles
            .FirstOrDefaultAsync(ep => ep.UserId == userId);

        // Ownership check: only the creator can edit their project
        if (project == null || entrepreneurProfile == null || project.CreatorProfileId != entrepreneurProfile.ProfileId)
            return null;
        if (entrepreneurProfile.IsBlocked) throw new InvalidOperationException("Your entrepreneur account is blocked. Contact an admin before editing projects.");

        // Validate partial project edits before they can break database rules.
        ValidateProjectForUpdate(project, request);

        // Partial update: only change fields that were sent
        if (!string.IsNullOrEmpty(request.Title))
            project.Title = request.Title;

        if (!string.IsNullOrEmpty(request.Description))
            project.Description = request.Description;

        if (request.FundingGoal > 0)
            project.FundingGoal = request.FundingGoal;

        if (request.CategoryId > 0)
            project.CategoryId = request.CategoryId;

        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();  // UPDATE Projects SET ...

        return new ProjectDto
        {
            ProjectId = project.ProjectId,
            Title = project.Title,
            Description = project.Description,
            FundingGoal = project.FundingGoal,
            CurrentAmount = project.CurrentAmount,
            Status = project.Status,
            CategoryId = project.CategoryId ?? 0,
            CreatorProfileId = project.CreatorProfileId,
            UpdatedAt = project.UpdatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var project = await _context.Projects.FindAsync(id);
        var entrepreneurProfile = await _context.EntrepreneurProfiles
            .FirstOrDefaultAsync(ep => ep.UserId == userId);

        // Ownership check before delete
        if (project == null || entrepreneurProfile == null || project.CreatorProfileId != entrepreneurProfile.ProfileId)
            return false;
        if (entrepreneurProfile.IsBlocked) throw new InvalidOperationException("Your entrepreneur account is blocked. Contact an admin before deleting projects.");

        entrepreneurProfile.DeletedProjectsCount++;
        if (entrepreneurProfile.DeletedProjectsCount >= 2)
        {
            entrepreneurProfile.IsBlocked = true;
            entrepreneurProfile.EntrepreneurBlockedCount++;
        }

        _context.Projects.Remove(project);  // DELETE FROM Projects WHERE ProjectId = ...
        await _context.SaveChangesAsync();
        return true;
    }

    // Entrepreneur submits their draft for admin review
    public async Task<bool> SubmitForApprovalAsync(int id, int userId)
    {
        var project = await _context.Projects.FindAsync(id);
        var entrepreneurProfile = await _context.EntrepreneurProfiles
            .FirstOrDefaultAsync(ep => ep.UserId == userId);

        // Can only submit if: project exists, user owns it, status is "Draft"
        if (project == null || entrepreneurProfile == null || project.CreatorProfileId != entrepreneurProfile.ProfileId || project.Status != "Draft")
            return false;
        if (entrepreneurProfile.IsBlocked) throw new InvalidOperationException("Your entrepreneur account is blocked. Contact an admin before submitting projects.");

        // Re-check project integrity at submission so old drafts cannot enter review with bad values.
        ValidateProjectForSubmit(project);

        project.Status = "Pending";  // Move to Pending for admin review
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var adminUserIds = await _context.UserRoles
            .Where(ur => ur.Role.RoleName == "Admin" && ur.User.IsActive && !ur.User.IsDeleted)
            .Select(ur => ur.UserId)
            .ToListAsync();
        await _notifications.CreateManyAsync(
            adminUserIds,
            "project",
            "مشروع جديد بانتظار المراجعة",
            "Project awaiting review",
            $"المشروع \"{project.Title}\" بانتظار المراجعة.",
            $"The project \"{project.Title}\" was submitted and is waiting for review.",
            project.ProjectId);
        return true;
    }

    public async Task<bool> ApproveAsync(int id)
    {
        var project = await _context.Projects
            .Include(p => p.CreatorProfile)
            .FirstOrDefaultAsync(p => p.ProjectId == id);
        if (project == null || project.Status != "Pending")
            return false;

        project.Status = "Approved";
        project.UpdatedAt = DateTime.UtcNow;

        // Create an escrow wallet to hold investor funds for this project
        var escrowWallet = new ProjectEscrowWallet
        {
            ProjectId = project.ProjectId,
            Balance = 0,
            CreatedAt = DateTime.UtcNow
        };
        _context.ProjectEscrowWallets.Add(escrowWallet);

        await _context.SaveChangesAsync();
        await _notifications.CreateAsync(
            project.CreatorProfile.UserId,
            "project",
            "تمت الموافقة على مشروعك",
            "Project approved",
            $"تمت الموافقة على المشروع \"{project.Title}\".",
            $"Your project \"{project.Title}\" has been approved and is now open for investment.",
            project.ProjectId,
            null);
        return true;
    }

    public async Task<bool> RejectAsync(int id, string reason)
    {
        var project = await _context.Projects
            .Include(p => p.CreatorProfile)
            .FirstOrDefaultAsync(p => p.ProjectId == id);
        if (project == null || project.Status != "Pending")
            return false;

        project.Status = "Rejected";
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        var detail = string.IsNullOrWhiteSpace(reason) ? "No reason was provided." : reason.Trim();
        await _notifications.CreateAsync(
            project.CreatorProfile.UserId,
            "project",
            "تم رفض مشروعك",
            "Project rejected",
            $"تم رفض المشروع \"{project.Title}\".",
            $"Your project \"{project.Title}\" was rejected. Reason: {detail}",
            project.ProjectId,
            null);
        return true;
    }

    // Aggregate statistics for project dashboard
    public async Task<ProjectStatsDto> GetStatsAsync()
    {
        var totalProjects = await _context.Projects.CountAsync();
        var pendingProjects = await _context.Projects.CountAsync(p => p.Status == "Pending");
        var approvedProjects = await _context.Projects.CountAsync(p => p.Status == "Approved");
        var fundedProjects = await _context.Projects.CountAsync(p => p.CurrentAmount >= p.FundingGoal);
        var totalFunding = await _context.Projects.SumAsync(p => (decimal?)p.CurrentAmount);

        return new ProjectStatsDto
        {
            TotalProjects = totalProjects,
            PendingProjects = pendingProjects,
            ApprovedProjects = approvedProjects,
            FundedProjects = fundedProjects,
            TotalFunding = totalFunding ?? 0
        };
    }

    public async Task<List<CategoryDto>> GetCategoriesAsync()
    {
        var categories = await _context.Categories.ToListAsync();

        return categories.Select(c => new CategoryDto
        {
            CategoryId = c.CategoryId,
            Name = c.Name ?? "",
            Description = c.Description ?? "",
            TechCode = c.TechCode ?? "",
            ParentId = c.ParentId,
            IsActive = c.IsActive
        }).ToList();
    }

    // Simple counter increment - no return value needed
    public async Task IncrementViewsAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project != null)
        {
            project.ViewsCount++;
            await _context.SaveChangesAsync();  // UPDATE Projects SET ViewsCount += 1
        }
    }
    private static void ValidateProjectForCreate(CreateProjectRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) throw new ArgumentException("Project title is required.");
        if (string.IsNullOrWhiteSpace(request.Description)) throw new ArgumentException("Project description is required.");
        if (request.FundingGoal <= 0) throw new ArgumentException("Funding goal must be greater than zero.");
        if (request.MinInvestment <= 0) throw new ArgumentException("Minimum investment must be greater than zero.");
        if (request.MaxInvestment < 0) throw new ArgumentException("Maximum investment must be zero for no limit, or greater than/equal to the minimum investment.");
        if (request.MaxInvestment > 0 && request.MaxInvestment < request.MinInvestment) throw new ArgumentException("Maximum investment must be greater than or equal to the minimum investment.");
        if (request.EquityOffered < 0 || request.EquityOffered > 100) throw new ArgumentException("Equity offered must be between 0 and 100 percent.");
        if (request.StartDate == default) throw new ArgumentException("Start date is required.");
        if (request.EndDate == default) throw new ArgumentException("End date is required.");
        if (request.EndDate <= request.StartDate) throw new ArgumentException("End date must be after the start date.");
        if (request.Duration < 0) throw new ArgumentException("Duration cannot be negative.");
        if (request.TeamSize < 0) throw new ArgumentException("Team size cannot be negative.");
    }

    private static void ValidateProjectForUpdate(Project project, UpdateProjectRequest request)
    {
        var fundingGoal = request.FundingGoal > 0 ? request.FundingGoal : project.FundingGoal;
        var minInvestment = request.MinInvestment > 0 ? request.MinInvestment : project.MinInvestment;
        var maxInvestment = request.MaxInvestment > 0 ? request.MaxInvestment : project.MaxInvestment;
        var startDate = request.StartDate != default ? request.StartDate : project.StartDate;
        var endDate = request.EndDate != default ? request.EndDate : project.EndDate;

        if (fundingGoal <= 0) throw new ArgumentException("Funding goal must be greater than zero.");
        if (project.CurrentAmount > fundingGoal) throw new ArgumentException("Funding goal cannot be lower than the amount already funded.");
        if (minInvestment <= 0) throw new ArgumentException("Minimum investment must be greater than zero.");
        if (request.MaxInvestment < 0) throw new ArgumentException("Maximum investment must be zero for no limit, or greater than/equal to the minimum investment.");
        if (maxInvestment.HasValue && maxInvestment.Value > 0 && maxInvestment.Value < minInvestment) throw new ArgumentException("Maximum investment must be greater than or equal to the minimum investment.");
        if (request.EquityOffered < 0 || request.EquityOffered > 100) throw new ArgumentException("Equity offered must be between 0 and 100 percent.");
        if (endDate <= startDate) throw new ArgumentException("End date must be after the start date.");
        if (request.DurationDays < 0) throw new ArgumentException("Duration cannot be negative.");
        if (request.TeamSize < 0) throw new ArgumentException("Team size cannot be negative.");
    }

    private static void ValidateProjectForSubmit(Project project)
    {
        if (project.FundingGoal <= 0) throw new InvalidOperationException("Project cannot be submitted because funding goal must be greater than zero.");
        if (project.MinInvestment <= 0) throw new InvalidOperationException("Project cannot be submitted because minimum investment must be greater than zero.");
        if (project.MaxInvestment.HasValue && project.MaxInvestment.Value > 0 && project.MaxInvestment.Value < project.MinInvestment) throw new InvalidOperationException("Project cannot be submitted because maximum investment is below the minimum investment.");
        if (project.CurrentAmount < 0 || project.CurrentAmount > project.FundingGoal) throw new InvalidOperationException("Project cannot be submitted because the funded amount is outside the funding goal range.");
        if (project.StartDate == default || project.EndDate == default || project.EndDate <= project.StartDate) throw new InvalidOperationException("Project cannot be submitted because end date must be after start date.");
    }
}



