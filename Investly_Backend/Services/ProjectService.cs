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

    public ProjectService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<ProjectDto>> GetAllAsync(int page = 1, int pageSize = 10, string? status = null, int? categoryId = null, string? search = null)
    {
        var query = _context.Projects.AsQueryable();

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
            .FirstOrDefaultAsync(p => p.ProjectId == id);

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
            .Where(p => p.Status == "Approved")  // Only approved projects
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

        var project = new Project
        {
            Title = request.Title,
            Description = request.Description,
            FundingGoal = request.FundingGoal,
            MinInvestment = request.MinInvestment,
            MaxInvestment = request.MaxInvestment,
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

        project.Status = "Pending";  // Move to Pending for admin review
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ApproveAsync(int id)
    {
        var project = await _context.Projects.FindAsync(id);
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
        return true;
    }

    public async Task<bool> RejectAsync(int id, string reason)
    {
        var project = await _context.Projects.FindAsync(id);
        if (project == null || project.Status != "Pending")
            return false;

        project.Status = "Rejected";
        project.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    // Aggregate statistics for project dashboard
    public async Task<ProjectStatsDto> GetStatsAsync()
    {
        var projects = await _context.Projects.ToListAsync();

        return new ProjectStatsDto
        {
            TotalProjects = projects.Count,
            PendingProjects = projects.Count(p => p.Status == "Pending"),
            ApprovedProjects = projects.Count(p => p.Status == "Approved"),
            FundedProjects = projects.Count(p => p.CurrentAmount >= p.FundingGoal),
            TotalFunding = projects.Sum(p => p.CurrentAmount)
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
}
