// ============================================================
// PROJECT DTOS - Project-related request/response objects
// ============================================================
// Different DTOs for different use cases:
// - ProjectDto: full project details (list/detail response)
// - ProjectListDto: lightweight list item (for featured/grid view)
// - CreateProjectRequest: what client sends to create
// - UpdateProjectRequest: what client sends to update
// - ProjectStatsDto: dashboard statistics
// - CategoryDto: project category info
// ============================================================

namespace Investly_Backend.DTOs;

// Full project details returned to the client
// Maps data from Project model + related entities (Category, CreatorProfile)
public class ProjectDto
{
    public int ProjectId { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal FundingGoal { get; set; }
    public decimal MinInvestment { get; set; }
    public decimal MaxInvestment { get; set; }
    public decimal EquityOffered { get; set; }
    public decimal CurrentAmount { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationDays { get; set; }
    public int TeamSize { get; set; }
    public string? ImageUrl { get; set; }
    public int ViewsCount { get; set; }
    public bool HasPhases { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int CreatorProfileId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string OwnerName { get; set; } = string.Empty;
}

// Request body for POST /api/projects
public class CreateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string City { get; set; } = string.Empty;
    public decimal FundingGoal { get; set; }
    public decimal MinInvestment { get; set; }
    public decimal MaxInvestment { get; set; }
    public decimal EquityOffered { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int Duration { get; set; }
    public int TeamSize { get; set; }
    public string? ImageUrl { get; set; }
}

// Request body for PUT /api/projects/{id}
public class UpdateProjectRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string City { get; set; } = string.Empty;
    public decimal FundingGoal { get; set; }
    public decimal MinInvestment { get; set; }
    public decimal MaxInvestment { get; set; }
    public decimal EquityOffered { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DurationDays { get; set; }
    public int TeamSize { get; set; }
    public string? ImageUrl { get; set; }
}

// Lightweight project info for grid/list views (no description, less fields)
public class ProjectListDto
{
    public int ProjectId { get; set; }
    public string Reference { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public decimal FundingGoal { get; set; }
    public decimal CurrentAmount { get; set; }
    public decimal PercentFunded { get; set; }  // Computed: CurrentAmount / FundingGoal * 100
    public string Status { get; set; } = string.Empty;
    public DateTime EndDate { get; set; }
    public string? ImageUrl { get; set; }
}

// Dashboard statistics (computed from project data)
public class ProjectStatsDto
{
    public int TotalProjects { get; set; }
    public int PendingProjects { get; set; }
    public int ApprovedProjects { get; set; }
    public int FundedProjects { get; set; }
    public decimal TotalFunding { get; set; }
}

// Category info (maps from Category model)
public class CategoryDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string TechCode { get; set; } = string.Empty;
    public int? ParentId { get; set; }
    public bool IsActive { get; set; }
}
