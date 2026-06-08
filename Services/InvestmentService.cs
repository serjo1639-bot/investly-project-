// ============================================================
// INVESTMENT SERVICE - Handles the investment lifecycle
// ============================================================
// THE INVESTMENT FLOW:
// 1. Investor creates investment (Amount is LOCKED in wallet)
// 2. Investor confirms (Amount is PERMANENTLY deducted)
// 3. OR Investor cancels (Amount is RETURNED to wallet)
//
// WHY TWO-STEP? This mimics how real crowdfunding works.
// The "Pending" state lets the investor review before committing.
// It's like a "hold" on a credit card - reserved, not charged.
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Interfaces;
using Investly_Backend.Models;
using Investly_Backend.Data;
using Investly_Backend.DTOs;

namespace Investly_Backend.Services;

public class InvestmentService : IInvestmentService
{
    private readonly AppDbContext _context;

    public InvestmentService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<PaginatedResult<MyInvestmentDto>> GetByUserAsync(int userId, int page = 1, int pageSize = 10)
    {
        // First find the user's investor profile
        var profile = await _context.InvestorProfiles.FirstOrDefaultAsync(ip => ip.UserId == userId);
        if (profile == null)
        {
            return new PaginatedResult<MyInvestmentDto>
            {
                Items = new List<MyInvestmentDto>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize
            };
        }

        // Then get investments for that profile
        var query = _context.Investments.Where(i => i.InvestorProfileId == profile.ProfileId);
        var total = await query.CountAsync();
        var investments = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(i => i.Project)  // Need project data for display
            .ToListAsync();

        var dtos = investments.Select(i => new MyInvestmentDto
        {
            InvestmentId = i.InvestmentId,
            ProjectId = i.ProjectId,
            ProjectTitle = i.Project?.Title ?? "",
            Amount = i.Amount,
            // FundingPercentage is COMPUTED - how much of the goal this investment covers
            FundingPercentage = i.Project != null && i.Project.FundingGoal > 0
                ? (i.Amount / i.Project.FundingGoal) * 100 : 0,
            EquityPercentage = i.Project?.EquityOffered ?? 0,
            Status = i.Status,
            CreatedAt = i.CreatedAt,
            ConfirmedAt = i.ConfirmedAt
        }).ToList();

        return new PaginatedResult<MyInvestmentDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<InvestmentDto?> GetByIdAsync(int userId, int id)
    {
        var investment = await _context.Investments
            .Include(i => i.Project)
            .Include(i => i.InvestorProfile)
            .FirstOrDefaultAsync(i => i.InvestmentId == id && i.InvestorProfile.UserId == userId);

        if (investment == null) return null;

        return new InvestmentDto
        {
            InvestmentId = investment.InvestmentId,
            InvestorProfileId = investment.InvestorProfileId,
            ProjectId = investment.ProjectId,
            ProjectTitle = investment.Project?.Title ?? "",
            Amount = investment.Amount,
            Status = investment.Status,
            FundingPercentage = investment.Project != null && investment.Project.FundingGoal > 0
                ? (investment.Amount / investment.Project.FundingGoal) * 100 : 0,
            EquityPercentage = investment.Project?.EquityOffered ?? 0,
            CreatedAt = investment.CreatedAt,
            ConfirmedAt = investment.ConfirmedAt
        };
    }

    public async Task<InvestmentConfirmationDto?> CreateAsync(int userId, CreateInvestmentRequest request)
    {
        // Investments are stored against InvestorProfiles. If an entrepreneur
        // invests for the first time, create the lightweight investor profile now.
        var profile = await GetOrCreateInvestorProfileAsync(userId);
        if (profile == null) return null;

        // Validate wallet has sufficient funds
        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null || wallet.Balance < request.Amount)
            return null;

        // Validate project exists and is approved for funding
        var project = await _context.Projects.FindAsync(request.ProjectId);
        if (project == null || project.Status != "Approved")
            return null;

        // LOCK the funds: move from available balance to locked
        wallet.Balance -= request.Amount;
        wallet.LockedAmount += request.Amount;

        var investment = new Investment
        {
            InvestorProfileId = profile.ProfileId,
            ProjectId = request.ProjectId,
            Amount = request.Amount,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        _context.Investments.Add(investment);

        // Record the wallet transaction (audit trail)
        var transaction = new WalletTransaction
        {
            WalletId = wallet.WalletId,
            Type = "Investment",
            Direction = "Debit",
            Amount = -request.Amount,  // Negative = money leaving
            Status = "Pending",
            ReferenceNo = investment.InvestmentId.ToString(),
            CreatedAt = DateTime.UtcNow
        };
        _context.WalletTransactions.Add(transaction);

        await _context.SaveChangesAsync();  // Saves ALL changes above

        return new InvestmentConfirmationDto
        {
            InvestmentId = investment.InvestmentId,
            Amount = investment.Amount,
            ProjectTitle = project.Title,
            FundingPercentage = project.FundingGoal > 0 ? (investment.Amount / project.FundingGoal) * 100 : 0,
            EquityPercentage = project.EquityOffered ?? 0,
            Status = investment.Status,
            ConfirmedAt = investment.ConfirmedAt
        };
    }

    // CONFIRM: permanently deduct locked funds, add to project's current amount
    public async Task<bool> ConfirmAsync(int userId, int id)
    {
        var investment = await _context.Investments
            .Include(i => i.Project)
            .Include(i => i.InvestorProfile)
            .FirstOrDefaultAsync(i => i.InvestmentId == id && i.InvestorProfile.UserId == userId);

        if (investment == null || investment.Status != "Pending")
            return false;

        var profile = await _context.InvestorProfiles.FindAsync(investment.InvestorProfileId);
        if (profile == null) return false;

        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == profile.UserId);
        if (wallet == null) return false;

        // Remove from locked (it was already deducted from balance in CreateAsync)
        wallet.LockedAmount -= investment.Amount;

        investment.Status = "Confirmed";
        investment.ConfirmedAt = DateTime.UtcNow;

        // Add the investment amount to project's running total
        if (investment.Project != null)
        {
            investment.Project.CurrentAmount += investment.Amount;
        }

        await _context.SaveChangesAsync();
        return true;
    }

    // CANCEL: return locked funds back to available balance
    public async Task<bool> CancelAsync(int userId, int id)
    {
        var investment = await _context.Investments
            .Include(i => i.InvestorProfile)
            .FirstOrDefaultAsync(i => i.InvestmentId == id && i.InvestorProfile.UserId == userId);

        if (investment == null || investment.Status != "Pending")
            return false;

        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == investment.InvestorProfile.UserId);
        if (wallet == null) return false;

        // Reverse the lock: add back to balance, remove from locked
        wallet.Balance += investment.Amount;
        wallet.LockedAmount -= investment.Amount;

        investment.Status = "Cancelled";

        // Create a REFUND transaction for the audit trail
        var transaction = new WalletTransaction
        {
            WalletId = wallet.WalletId,
            Type = "Refund",
            Direction = "Credit",
            Amount = investment.Amount,
            Status = "Completed",
            ReferenceNo = investment.InvestmentId.ToString(),
            CreatedAt = DateTime.UtcNow
        };
        _context.WalletTransactions.Add(transaction);

        await _context.SaveChangesAsync();
        return true;
    }

    // Returns anonymous object (no DTO) - TODO: create a proper PortfolioDto
    public async Task<object> GetPortfolioSummaryAsync(int userId)
    {
        var profile = await _context.InvestorProfiles.FirstOrDefaultAsync(ip => ip.UserId == userId);
        if (profile == null)
        {
            return new
            {
                TotalInvestments = 0,
                TotalAmount = 0m,
                ConfirmedInvestments = 0,
                PendingInvestments = 0
            };
        }

        var investments = await _context.Investments
            .Where(i => i.InvestorProfileId == profile.ProfileId)
            .ToListAsync();

        return new
        {
            TotalInvestments = investments.Count,
            TotalAmount = investments.Sum(i => i.Amount),
            ConfirmedInvestments = investments.Count(i => i.Status == "Confirmed"),
            PendingInvestments = investments.Count(i => i.Status == "Pending")
        };
    }

    private async Task<InvestorProfile?> GetOrCreateInvestorProfileAsync(int userId)
    {
        var profile = await _context.InvestorProfiles.FirstOrDefaultAsync(ip => ip.UserId == userId);
        if (profile != null) return profile;

        var userExists = await _context.Users.AnyAsync(u => u.UserId == userId && u.IsActive);
        if (!userExists) return null;

        profile = new InvestorProfile
        {
            UserId = userId,
            KycStatus = "Pending",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.InvestorProfiles.Add(profile);
        await _context.SaveChangesAsync();
        return profile;
    }
}
