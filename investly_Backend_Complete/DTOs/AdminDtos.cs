// ============================================================
// ADMIN DTOS - Admin dashboard/management response objects
// ============================================================

namespace Investly_Backend.DTOs;

// Admin dashboard summary statistics
public class AdminDashboardDto
{
    public int TotalUsers { get; set; }
    public int TotalProjects { get; set; }
    public int PendingProjects { get; set; }
    public int TotalInvestments { get; set; }
    public decimal TotalFunding { get; set; }
    public int PendingWithdrawals { get; set; }
    public List<object> RecentActivities { get; set; } = new();
}

// User info for admin management panel (includes roles + wallet balance)
public class UserManagementDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public decimal WalletBalance { get; set; }
}

// Withdrawal request visible to admin
public class WithdrawalRequestDto
{
    public int WithdrawalId { get; set; }
    public int WalletId { get; set; }
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccount { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? RejectionReason { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ProcessedAt { get; set; }
}

// Pending KYC verification request visible to admin
public class PendingKycDto
{
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Occupation { get; set; } = string.Empty;
    public decimal? AnnualIncome { get; set; }
    public string IdDocumentUrl { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class BlockedEntrepreneurDto
{
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public int DeletedProjectsCount { get; set; }
    public int EntrepreneurBlockedCount { get; set; }
    public bool IsBlocked { get; set; }
    public DateTime UpdatedAt { get; set; }
}
