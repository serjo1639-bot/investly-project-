// ============================================================
// WALLET SERVICE - Manages deposits, withdrawals, and ledger
// ============================================================
// Financial transactions principles:
// - Every money movement creates an AUDIT TRAIL (WalletTransaction)
// - Withdrawals require ADMIN APPROVAL (anti-fraud measure)
// - Locked funds are separate from available balance
// - We NEVER delete financial records - only add new ones
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Interfaces;
using Investly_Backend.Models;
using Investly_Backend.Data;
using Investly_Backend.DTOs;

namespace Investly_Backend.Services;

public class WalletService : IWalletService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notifications;

    public WalletService(AppDbContext context, INotificationService notifications)
    {
        _context = context;
        _notifications = notifications;
    }

    public async Task<WalletDto?> GetWalletAsync(int userId)
    {
        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return null;

        return new WalletDto
        {
            WalletId = wallet.WalletId,
            UserId = wallet.UserId,
            Balance = wallet.Balance,
            LockedAmount = wallet.LockedAmount,
            AvailableBalance = wallet.Balance - wallet.LockedAmount,  // Computed
            Status = wallet.Status
        };
    }

    public async Task<WalletTransactionDto?> DepositAsync(int userId, DepositRequest request)
    {
        // Validate wallet deposits before creating ledger rows.
        if (request.Amount <= 0) throw new ArgumentException("Deposit amount must be greater than zero.");

        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) throw new InvalidOperationException("Wallet not found. Please contact support before depositing funds.");

        // Add money to balance
        wallet.Balance += request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        // Create a COMPLETED credit transaction (deposits are immediate)
        var transaction = new WalletTransaction
        {
            WalletId = wallet.WalletId,
            Type = "Deposit",
            Direction = "Credit",  // Money coming IN
            Amount = request.Amount,
            Status = "Completed",
            ReferenceNo = request.ReferenceNo,
            Description = request.Description,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow  // Completed immediately
        };
        _context.WalletTransactions.Add(transaction);

        await _context.SaveChangesAsync();
        await _notifications.CreateAsync(
            userId,
            "system",
            "تم شحن المحفظة",
            "Wallet credited",
            $"تمت إضافة {request.Amount:N2} إلى محفظتك.",
            $"{request.Amount:N2} was added to your wallet.",
            null,
            null);

        return new WalletTransactionDto
        {
            TransactionId = transaction.TransactionId,
            WalletId = wallet.WalletId,
            Type = transaction.Type,
            Direction = transaction.Direction,
            Amount = transaction.Amount,
            Status = transaction.Status,
            ReferenceNo = transaction.ReferenceNo ?? "",
            Description = transaction.Description ?? "",
            CreatedAt = transaction.CreatedAt,
            CompletedAt = transaction.CompletedAt
        };
    }

    // Withdraw: LOCK the money and create a pending request for admin
    public async Task<WalletTransactionDto?> WithdrawAsync(int userId, WithdrawRequest request)
    {
        // Validate withdrawal amount so locked balance cannot become invalid.
        if (request.Amount <= 0) throw new ArgumentException("Withdrawal amount must be greater than zero.");

        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) throw new InvalidOperationException("Wallet not found. Please contact support before requesting a withdrawal.");

        // Check: sufficient AVAILABLE balance (Balance - LockedAmount)
        if ((wallet.Balance - wallet.LockedAmount) < request.Amount)
            throw new InvalidOperationException($"Insufficient available balance. You can withdraw up to {(wallet.Balance - wallet.LockedAmount):N2}.");

        // Lock the withdrawal amount
        wallet.LockedAmount += request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        // Pending withdrawal transaction
        var transaction = new WalletTransaction
        {
            WalletId = wallet.WalletId,
            Type = "Withdraw",
            Direction = "Debit",
            Amount = request.Amount,
            Description = "Withdrawal requested",
            CreatedAt = DateTime.UtcNow
        };
        _context.WalletTransactions.Add(transaction);

        // Create the withdrawal request for admin review
        var withdrawalRequest = new WithdrawalRequest
        {
            WalletId = wallet.WalletId,
            Amount = request.Amount,
            BankName = request.BankName,
            BankAccount = request.BankAccount,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };
        _context.WithdrawalRequests.Add(withdrawalRequest);

        await _context.SaveChangesAsync();
        await _notifications.CreateAsync(
            userId,
            "system",
            "طلب سحب جديد",
            "Withdrawal requested",
            $"تم إرسال طلب سحب بقيمة {request.Amount:N2}.",
            $"Your withdrawal request for {request.Amount:N2} was submitted for review.",
            null,
            null);

        return new WalletTransactionDto
        {
            TransactionId = transaction.TransactionId,
            WalletId = wallet.WalletId,
            Type = transaction.Type,
            Direction = transaction.Direction,
            Amount = transaction.Amount,
            Status = transaction.Status,
            ReferenceNo = transaction.ReferenceNo ?? "",
            Description = transaction.Description ?? "",
            CreatedAt = transaction.CreatedAt,
            CompletedAt = transaction.CompletedAt
        };
    }

    public async Task<PaginatedResult<WalletTransactionDto>> GetTransactionsAsync(int userId, int page = 1, int pageSize = 20)
    {
        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null)
        {
            return new PaginatedResult<WalletTransactionDto>
            {
                Items = new List<WalletTransactionDto>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize
            };
        }

        var query = _context.WalletTransactions.Where(t => t.WalletId == wallet.WalletId);
        var total = await query.CountAsync();
        var transactions = await query
            .OrderByDescending(t => t.CreatedAt)  // Newest first
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var dtos = transactions.Select(t => new WalletTransactionDto
        {
            TransactionId = t.TransactionId,
            WalletId = t.WalletId,
            Type = t.Type,
            Direction = t.Direction,
            Amount = t.Amount,
            Status = t.Status,
            ReferenceNo = t.ReferenceNo ?? "",
            Description = t.Description ?? "",
            CreatedAt = t.CreatedAt,
            CompletedAt = t.CompletedAt
        }).ToList();

        return new PaginatedResult<WalletTransactionDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    // Admin: list all withdrawal requests (optional status filter)
    public async Task<PaginatedResult<WithdrawalRequestDto>> GetWithdrawalRequestsAsync(int page = 1, int pageSize = 20, string? status = null)
    {
        var query = _context.WithdrawalRequests.AsQueryable();

        if (!string.IsNullOrEmpty(status))
        {
            query = query.Where(r => r.Status == status);
        }

        var total = await query.CountAsync();
        var requests = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(r => r.Wallet)
            .ToListAsync();

        return new PaginatedResult<WithdrawalRequestDto>
        {
            Items = requests.Select(r => new WithdrawalRequestDto
            {
                WithdrawalId = r.WithdrawalId,
                WalletId = r.WalletId,
                Amount = r.Amount,
                BankName = r.BankName ?? "",
                BankAccount = r.BankAccount ?? "",
                Status = r.Status ?? "",
                CreatedAt = r.CreatedAt,
                ProcessedAt = r.ProcessedAt
            }).ToList(),
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    // Admin: approve pending withdrawal -> permanently remove locked money
    public async Task<bool> ApproveWithdrawalAsync(int id)
    {
        var request = await _context.WithdrawalRequests.FindAsync(id);
        if (request == null || request.Status != "Pending")
            return false;

        var wallet = await _context.UserWallets.FindAsync(request.WalletId);
        if (wallet == null) return false;

        // Validate locked funds before approving so wallet constraints stay valid.
        if (request.Amount <= 0) throw new InvalidOperationException("Withdrawal request amount must be greater than zero.");
        if (wallet.LockedAmount < request.Amount) throw new InvalidOperationException("Withdrawal cannot be approved because locked funds are lower than the requested amount.");

        // Permanently remove the locked amount
        wallet.LockedAmount -= request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        request.Status = "Completed";
        request.ProcessedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        await _notifications.CreateAsync(
            wallet.UserId,
            "system",
            "تمت الموافقة على السحب",
            "Withdrawal approved",
            $"تمت الموافقة على طلب السحب بقيمة {request.Amount:N2}.",
            $"Your withdrawal request for {request.Amount:N2} was approved.",
            null,
            null);
        return true;
    }

    // Admin: reject pending withdrawal -> unlock and return money
    public async Task<bool> RejectWithdrawalAsync(int id, string reason)
    {
        var request = await _context.WithdrawalRequests.FindAsync(id);
        if (request == null || request.Status != "Pending")
            return false;

        var wallet = await _context.UserWallets.FindAsync(request.WalletId);
        if (wallet == null) return false;

        // Validate locked funds before rejecting so wallet constraints stay valid.
        if (request.Amount <= 0) throw new InvalidOperationException("Withdrawal request amount must be greater than zero.");
        if (wallet.LockedAmount < request.Amount) throw new InvalidOperationException("Withdrawal cannot be rejected because locked funds are lower than the requested amount.");

        // Return money from locked back to available
        wallet.LockedAmount -= request.Amount;
        wallet.UpdatedAt = DateTime.UtcNow;

        request.Status = "Rejected";
        request.RejectionReason = reason;
        request.ProcessedAt = DateTime.UtcNow;

        // Create a credit transaction showing the reversal
        var transaction = new WalletTransaction
        {
            WalletId = wallet.WalletId,
            Type = "WithdrawalRejected",
            Direction = "Credit",
            Amount = request.Amount,
            Status = "Completed",
            Description = reason,
            CreatedAt = DateTime.UtcNow,
            CompletedAt = DateTime.UtcNow
        };
        _context.WalletTransactions.Add(transaction);

        await _context.SaveChangesAsync();
        await _notifications.CreateAsync(
            wallet.UserId,
            "system",
            "تم رفض طلب السحب",
            "Withdrawal rejected",
            $"تم رفض طلب السحب بقيمة {request.Amount:N2}.",
            $"Your withdrawal request for {request.Amount:N2} was rejected. Reason: {reason}",
            null,
            null);
        return true;
    }
}



