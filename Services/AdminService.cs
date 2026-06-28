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
    private readonly INotificationService _notifications;

    public AdminService(AppDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<AdminDashboardDto> GetDashboardAsync()
    {
        // Dashboard aggregates data from multiple tables
        // ToListAsync loads ALL records, then we count in memory
        // For large datasets, use CountAsync() instead (better performance)
        var users = await _context.Users.Where(u => !u.IsDeleted).ToListAsync();
        var projects = await _context.Projects.Where(p => !p.IsDeleted).ToListAsync();
        var investments = await _context.Investments.ToListAsync();
        var pendingWithdrawals = await _context.WithdrawalRequests.CountAsync(w => w.Status == "Pending");
        var recentActivities = await GetRecentActivitiesAsync();

        return new AdminDashboardDto
        {
            TotalUsers = users.Count,
            TotalProjects = projects.Count,
            PendingProjects = projects.Count(p => p.Status == "Pending"),
            TotalInvestments = investments.Count,
            TotalFunding = investments.Where(i => i.Status == "Confirmed").Sum(i => i.Amount),
            PendingWithdrawals = pendingWithdrawals,
            RecentActivities = recentActivities
        };
    }

    private async Task<List<AdminActivityDto>> GetRecentActivitiesAsync()
    {
        // Keep this dashboard feed simple: combine the latest real events from core tables.
        // No fake/sample data is created here; if the database is empty, the list is empty.
        var projects = await _context.Projects
            .OrderByDescending(p => p.CreatedAt)
            .Take(5)
            .Select(p => new AdminActivityDto
            {
                Type = "Project",
                Title = "Project created",
                Details = p.Title,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        var investments = await _context.Investments
            .Include(i => i.Project)
            .OrderByDescending(i => i.CreatedAt)
            .Take(5)
            .Select(i => new AdminActivityDto
            {
                Type = "Investment",
                Title = "Investment " + i.Status,
                Details = i.Project.Title + " - " + i.Amount,
                CreatedAt = i.CreatedAt
            })
            .ToListAsync();

        var walletTransactions = await _context.WalletTransactions
            .OrderByDescending(t => t.CreatedAt)
            .Take(5)
            .Select(t => new AdminActivityDto
            {
                Type = "Wallet",
                Title = t.Type + " " + t.Status,
                Details = t.Description ?? t.Amount.ToString(),
                CreatedAt = t.CreatedAt
            })
            .ToListAsync();

        return projects
            .Concat(investments)
            .Concat(walletTransactions)
            .OrderByDescending(a => a.CreatedAt)
            .Take(10)
            .ToList();
    }

    public async Task<PaginatedResult<UserManagementDto>> GetAllUsersAsync(int page = 1, int pageSize = 10, string search = null, string role = null, string status = null)
    {
        // Admin dashboard must show only live rows. Deleted users are hidden but kept in DB for audit/history.
        var query = _context.Users.Where(u => !u.IsDeleted).AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Email.Contains(search) || (u.FirstName + " " + u.LastName).Contains(search));
        }

        if (!string.IsNullOrEmpty(role))
        {
            var normalizedRole = role.Equals("owner", StringComparison.OrdinalIgnoreCase) ? "Entrepreneur" : role;
            query = query.Where(u => u.UserRoles.Any(ur => ur.Role.RoleName == normalizedRole));
        }

        if (!string.IsNullOrEmpty(status))
        {
            if (status.Equals("suspended", StringComparison.OrdinalIgnoreCase) || status.Equals("blocked", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => u.IsBlocked);
            else if (status.Equals("active", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => u.IsActive && !u.IsBlocked);
            else if (status.Equals("inactive", StringComparison.OrdinalIgnoreCase))
                query = query.Where(u => !u.IsActive);
        }

        var total = await query.CountAsync();
        var users = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(u => u.UserWallet)
            .Include(u => u.UserRoles).ThenInclude(ur => ur.Role)
            .ToListAsync();

        var dtos = users.Select(u => new UserManagementDto
        {
            UserId = u.UserId,
            Email = u.Email,
            FirstName = u.FirstName,
            LastName = u.LastName,
            IsActive = u.IsActive,
            IsBlocked = u.IsBlocked,
            IsDeleted = u.IsDeleted,
            CreatedAt = u.CreatedAt,
            Roles = u.UserRoles.Select(ur => ur.Role.RoleName).ToList(),
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
        await _notifications.CreateAsync(
            profile.UserId,
            "user",
            "تمت الموافقة على التحقق",
            "Identity verification approved",
            "تمت الموافقة على بيانات التحقق الخاصة بك.",
            "Your identity verification has been approved.",
            null,
            null);
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
        await _notifications.CreateAsync(
            profile.UserId,
            "user",
            "تم رفض التحقق",
            "Identity verification rejected",
            $"تم رفض بيانات التحقق الخاصة بك. {reason}",
            $"Your identity verification was rejected. Reason: {reason}",
            null,
            null);
        return true;
    }

    public async Task<PaginatedResult<ProjectDto>> GetAllProjectsAsync(int page = 1, int pageSize = 10, string status = null, string search = null, int? categoryId = null)
    {
        // Admin delete is soft-delete, so list screens must exclude deleted projects explicitly.
        var query = _context.Projects.Where(p => !p.IsDeleted).AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(p => p.Status == status);
        }

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(p => p.Title.Contains(search) || p.Description.Contains(search));
        }

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
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

    public async Task<PaginatedResult<EscrowWalletDto>> GetEscrowWalletsAsync(int page = 1, int pageSize = 10, string? search = null)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var query = _context.ProjectEscrowWallets
            .Include(ew => ew.Project)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(ew => ew.Project.Title.Contains(search) || (ew.Project.Reference != null && ew.Project.Reference.Contains(search)));
        }

        var total = await query.CountAsync();
        var wallets = await query
            .OrderByDescending(ew => ew.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = wallets.Select(ew => new EscrowWalletDto
        {
            EscrowWalletId = ew.EscrowWalletId,
            ProjectId = ew.ProjectId,
            ProjectTitle = ew.Project?.Title ?? string.Empty,
            Reference = ew.Project?.Reference ?? string.Empty,
            Balance = ew.Balance,
            ReleasedAmount = ew.ReleasedAmount,
            Status = ew.Status,
            CreatedAt = ew.CreatedAt,
            UpdatedAt = ew.UpdatedAt
        }).ToList();

        return new PaginatedResult<EscrowWalletDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<EscrowWalletDto?> GetEscrowWalletByProjectIdAsync(int projectId)
    {
        var ew = await _context.ProjectEscrowWallets
            .Include(ew => ew.Project)
            .FirstOrDefaultAsync(ew => ew.ProjectId == projectId);

        if (ew == null) return null;

        return new EscrowWalletDto
        {
            EscrowWalletId = ew.EscrowWalletId,
            ProjectId = ew.ProjectId,
            ProjectTitle = ew.Project?.Title ?? string.Empty,
            Reference = ew.Project?.Reference ?? string.Empty,
            Balance = ew.Balance,
            ReleasedAmount = ew.ReleasedAmount,
            Status = ew.Status,
            CreatedAt = ew.CreatedAt,
            UpdatedAt = ew.UpdatedAt
        };
    }

    public async Task<PaginatedResult<EscrowTransactionDto>> GetEscrowTransactionsAsync(int projectId, int page = 1, int pageSize = 10)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);

        var escrowWallet = await _context.ProjectEscrowWallets
            .FirstOrDefaultAsync(ew => ew.ProjectId == projectId);

        if (escrowWallet == null)
        {
            return new PaginatedResult<EscrowTransactionDto>
            {
                Items = new List<EscrowTransactionDto>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize
            };
        }

        var query = _context.EscrowTransactions
            .Where(t => t.EscrowWalletId == escrowWallet.EscrowWalletId);

        var total = await query.CountAsync();
        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = transactions.Select(t => new EscrowTransactionDto
        {
            EscrowTransactionId = t.EscrowTransactionId,
            EscrowWalletId = t.EscrowWalletId,
            Type = t.Type,
            Direction = t.Direction,
            Amount = t.Amount,
            Status = t.Status,
            RelatedInvestmentId = t.RelatedInvestmentId,
            CreatedAt = t.CreatedAt,
            CompletedAt = t.CompletedAt
        }).ToList();

        return new PaginatedResult<EscrowTransactionDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<(bool Success, string ErrorMessage)> ReleaseFundsAsync(int projectId, decimal amount)
    {
        if (amount <= 0)
        {
            return (false, "Amount must be greater than zero");
        }

        var escrowWallet = await _context.ProjectEscrowWallets
            .Include(ew => ew.Project)
                .ThenInclude(p => p.CreatorProfile)
            .FirstOrDefaultAsync(ew => ew.ProjectId == projectId && (ew.Status == "Active" || ew.Status == "Released" || ew.Status == "Pending"));

        if (escrowWallet == null)
        {
            return (false, "Project escrow wallet not found");
        }

        if (escrowWallet.Balance < amount)
        {
            return (false, "Insufficient funds in escrow");
        }

        var entrepreneurWallet = await _context.UserWallets
            .FirstOrDefaultAsync(uw => uw.UserId == escrowWallet.Project.CreatorProfile.UserId && uw.Status == "Active");

        if (entrepreneurWallet == null)
        {
            return (false, "Entrepreneur wallet not found");
        }

        // Update escrow wallet
        escrowWallet.Balance -= amount;
        escrowWallet.ReleasedAmount += amount;
        if (escrowWallet.Balance == 0)
        {
            escrowWallet.Status = "Released";
        }
        escrowWallet.UpdatedAt = DateTime.UtcNow;

        // Update entrepreneur wallet
        entrepreneurWallet.Balance += amount;
        entrepreneurWallet.UpdatedAt = DateTime.UtcNow;

        // Insert Escrow Transaction
        var escrowTx = new EscrowTransaction
        {
            EscrowWalletId = escrowWallet.EscrowWalletId,
            Type = "Release",
            Direction = "Debit",
            Amount = amount,
            Status = "Completed",
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };
        _context.EscrowTransactions.Add(escrowTx);

        // Insert Wallet Transaction
        var walletTx = new WalletTransaction
        {
            WalletId = entrepreneurWallet.WalletId,
            Type = "EscrowRelease",
            Direction = "Credit",
            Amount = amount,
            Status = "Completed",
            RelatedProjectId = projectId,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };
        _context.WalletTransactions.Add(walletTx);

        await _context.SaveChangesAsync();
        await _notifications.CreateAsync(
            escrowWallet.Project.CreatorProfile.UserId,
            "project",
            "تم تحويل أموال المشروع",
            "Project funds released",
            $"تم تحويل {amount:N2} من حساب الضمان.",
            $"{amount:N2} was released from escrow for \"{escrowWallet.Project.Title}\".",
            projectId,
            null);
        return (true, "Funds released successfully");
    }

    public async Task<(bool Success, string ErrorMessage)> RefundInvestmentAsync(int investmentId)
    {
        var investment = await _context.Investments
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.InvestmentId == investmentId);

        if (investment == null)
        {
            return (false, "Investment not found");
        }

        if (investment.Status != "Confirmed" && investment.Status != "Active")
        {
            return (false, "Investment cannot be refunded");
        }

        var investorProfile = await _context.InvestorProfiles
            .FirstOrDefaultAsync(ip => ip.ProfileId == investment.InvestorProfileId);

        if (investorProfile == null)
        {
            return (false, "Investor profile not found");
        }

        var investorWallet = await _context.UserWallets
            .FirstOrDefaultAsync(uw => uw.UserId == investorProfile.UserId && uw.Status == "Active");

        if (investorWallet == null)
        {
            return (false, "Investor wallet not found");
        }

        var escrowWallet = await _context.ProjectEscrowWallets
            .FirstOrDefaultAsync(ew => ew.ProjectId == investment.ProjectId);

        if (escrowWallet == null)
        {
            return (false, "Escrow wallet not found");
        }

        if (escrowWallet.Balance < investment.Amount)
        {
            return (false, "Insufficient escrow balance for refund");
        }

        // 1. Update investment status
        investment.Status = "Refunded";

        // 2. Update investor wallet
        investorWallet.Balance += investment.Amount;
        investorWallet.UpdatedAt = DateTime.UtcNow;

        // 3. Insert WalletTransaction for investor
        var walletTx = new WalletTransaction
        {
            WalletId = investorWallet.WalletId,
            Type = "Refund",
            Direction = "Credit",
            Amount = investment.Amount,
            Status = "Completed",
            RelatedProjectId = investment.ProjectId,
            RelatedInvestmentId = investmentId,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };
        _context.WalletTransactions.Add(walletTx);

        // 4. Update escrow wallet
        escrowWallet.Balance -= investment.Amount;
        escrowWallet.UpdatedAt = DateTime.UtcNow;

        // 5. Insert EscrowTransaction
        var escrowTx = new EscrowTransaction
        {
            EscrowWalletId = escrowWallet.EscrowWalletId,
            Type = "Refund",
            Direction = "Debit",
            Amount = investment.Amount,
            Status = "Completed",
            RelatedInvestmentId = investmentId,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };
        _context.EscrowTransactions.Add(escrowTx);

        // 6. Update Project
        if (investment.Project != null)
        {
            investment.Project.CurrentAmount -= investment.Amount;
            if (investment.Project.Status == "Funded")
            {
                investment.Project.Status = "Approved";
            }
            investment.Project.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        await _notifications.CreateAsync(
            investorProfile.UserId,
            "investment",
            "تم رد قيمة الاستثمار",
            "Investment refunded",
            $"تم رد {investment.Amount:N2} إلى محفظتك.",
            $"Your investment of {investment.Amount:N2} in \"{investment.Project?.Title}\" was refunded.",
            investment.ProjectId,
            investment.InvestmentId);
        return (true, "Investment refunded successfully");
    }
}


