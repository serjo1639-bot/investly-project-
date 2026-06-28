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
    private readonly INotificationService _notifications;

    public InvestmentService(AppDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
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

    public async Task<InvestmentDto?> GetByIdAsync(int id)
    {
        var investment = await _context.Investments
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.InvestmentId == id);

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
        // Validate investment amount before wallet locking creates ledger rows.
        if (request.Amount <= 0)
            throw new ArgumentException("Investment amount must be greater than zero.");

        // Validate investor profile exists. Older investor accounts may have
        // been created before registration auto-created this row.
        var profile = await _context.InvestorProfiles.FirstOrDefaultAsync(ip => ip.UserId == userId);
        if (profile == null)
        {
            profile = new InvestorProfile
            {
                UserId = userId,
                KycStatus = "Pending",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            _context.InvestorProfiles.Add(profile);
        }

        // Validate wallet has sufficient funds
        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
            throw new InvalidOperationException("Wallet not found. Please add or activate a wallet before investing.");
        if (wallet.Status != "Active")
            throw new InvalidOperationException("Wallet must be active before investing.");
        if ((wallet.Balance - wallet.LockedAmount) < request.Amount)
            throw new InvalidOperationException($"Insufficient available balance. You can invest up to {(wallet.Balance - wallet.LockedAmount):N2}.");

        // Validate project exists and is approved for funding
        var project = await _context.Projects.FindAsync(request.ProjectId);
        if (project == null)
            throw new ArgumentException("Project not found.");
        if (project.Status != "Approved")
            throw new InvalidOperationException("You can only invest in approved projects.");

        if (request.Amount < project.MinInvestment)
            throw new ArgumentException($"Investment amount must be at least {project.MinInvestment:N2}.");

        if (project.MaxInvestment.HasValue && project.MaxInvestment.Value > 0 && request.Amount > project.MaxInvestment.Value)
            throw new ArgumentException($"Investment amount cannot exceed {project.MaxInvestment.Value:N2} for this project.");

        if (project.FundingGoal > 0 && project.CurrentAmount + request.Amount > project.FundingGoal)
            throw new ArgumentException($"Investment exceeds the remaining funding amount of {(project.FundingGoal - project.CurrentAmount):N2}.");

        // LOCK the funds. Balance is total wallet money; LockedAmount reserves
        // part of it until confirm/cancel. Available = Balance - LockedAmount.
        wallet.LockedAmount += request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

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
            Amount = request.Amount,
            Status = "Pending",
            RelatedProjectId = request.ProjectId,
            CreatedAt = DateTime.UtcNow
        };
        _context.WalletTransactions.Add(transaction);

        await _context.SaveChangesAsync();  // Saves ALL changes above

        await _notifications.CreateAsync(
            userId,
            "investment",
            "مساهمة بانتظار التأكيد",
            "Investment awaiting confirmation",
            $"تم حجز {investment.Amount:N2} لمشروع \"{project.Title}\".",
            $"{investment.Amount:N2} has been reserved for \"{project.Title}\". Confirm to complete the investment.",
            project.ProjectId,
            investment.InvestmentId);

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
    public async Task<bool> ConfirmAsync(int id, int userId)
    {
        var investment = await _context.Investments
            .Include(i => i.Project)
            .FirstOrDefaultAsync(i => i.InvestmentId == id);

        if (investment == null || investment.Status != "Pending")
            return false;

        var profile = await _context.InvestorProfiles.FindAsync(investment.InvestorProfileId);
        if (profile == null) return false;
        if (profile.UserId != userId) return false;

        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == profile.UserId);
        if (wallet == null) return false;

        // Confirm the hold: permanently deduct total balance and release the lock.
        wallet.Balance -= investment.Amount;
        wallet.LockedAmount -= investment.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        investment.Status = "Confirmed";
        investment.ConfirmedAt = DateTime.UtcNow;

        // Add the investment amount to project's running total and escrow wallet
        if (investment.Project != null)
        {
            investment.Project.CurrentAmount += investment.Amount;
            if (investment.Project.FundingGoal > 0 && investment.Project.CurrentAmount >= investment.Project.FundingGoal)
            {
                investment.Project.Status = "Funded";
            }
            investment.Project.UpdatedAt = DateTime.UtcNow;

            var escrowWallet = await _context.ProjectEscrowWallets
                .FirstOrDefaultAsync(ew => ew.ProjectId == investment.ProjectId);

            if (escrowWallet != null)
            {
                escrowWallet.Balance += investment.Amount;
                if (escrowWallet.Status == "Pending")
                {
                    escrowWallet.Status = "Active";
                }
                escrowWallet.UpdatedAt = DateTime.UtcNow;

                // Add escrow transaction audit log
                var escrowTx = new EscrowTransaction
                {
                    EscrowWalletId = escrowWallet.EscrowWalletId,
                    Type = "Funding",
                    Direction = "Credit",
                    Amount = investment.Amount,
                    Status = "Completed",
                    RelatedInvestmentId = investment.InvestmentId,
                    CreatedAt = DateTime.UtcNow,
                    CompletedAt = DateTime.UtcNow
                };
                _context.EscrowTransactions.Add(escrowTx);
            }
        }

        await _context.SaveChangesAsync();
        await _notifications.CreateAsync(
            userId,
            "investment",
            "تم تأكيد مساهمتك",
            "Investment confirmed",
            $"تم تأكيد مساهمتك بقيمة {investment.Amount:N2}.",
            $"Your investment of {investment.Amount:N2} in \"{investment.Project?.Title}\" was confirmed.",
            investment.ProjectId,
            investment.InvestmentId);

        if (investment.Project?.CreatorProfileId > 0)
        {
            var ownerUserId = await _context.EntrepreneurProfiles
                .Where(p => p.ProfileId == investment.Project.CreatorProfileId)
                .Select(p => p.UserId)
                .FirstOrDefaultAsync();
            if (ownerUserId > 0)
            {
                await _notifications.CreateAsync(
                    ownerUserId,
                    "investment",
                    "مساهمة جديدة في مشروعك",
                    "New investment received",
                    $"تمت إضافة مساهمة جديدة إلى \"{investment.Project.Title}\".",
                    $"A new investment of {investment.Amount:N2} was confirmed for \"{investment.Project.Title}\".",
                    investment.ProjectId,
                    investment.InvestmentId);
            }
        }
        return true;
    }

    // CANCEL: return locked funds back to available balance
    public async Task<bool> CancelAsync(int id, int userId)
    {
        var investment = await _context.Investments
            .Include(i => i.InvestorProfile)
            .FirstOrDefaultAsync(i => i.InvestmentId == id);

        if (investment == null || investment.Status != "Pending")
            return false;
        if (investment.InvestorProfile.UserId != userId)
            return false;

        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return false;

        // Reverse the lock: add back to balance, remove from locked
        wallet.LockedAmount -= investment.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

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
        await _notifications.CreateAsync(
            userId,
            "investment",
            "تم إلغاء المساهمة",
            "Investment cancelled",
            $"تم إلغاء المساهمة بقيمة {investment.Amount:N2}.",
            $"Your pending investment of {investment.Amount:N2} was cancelled and the reserved funds were released.",
            investment.ProjectId,
            investment.InvestmentId);
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
}



