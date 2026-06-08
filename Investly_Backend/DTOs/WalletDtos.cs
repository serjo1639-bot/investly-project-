// ============================================================
// WALLET DTOS - Wallet/transaction request/response objects
// ============================================================

namespace Investly_Backend.DTOs;

// Single wallet transaction record (response)
public class WalletTransactionDto
{
    public int TransactionId { get; set; }
    public int WalletId { get; set; }
    public string Type { get; set; } = string.Empty;       // Deposit | Withdraw | Investment | Refund
    public string Direction { get; set; } = string.Empty;  // Credit | Debit
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string ReferenceNo { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}

// POST /api/wallet/deposit body
public class DepositRequest
{
    public decimal Amount { get; set; }
    public string ReferenceNo { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

// POST /api/wallet/withdraw body
public class WithdrawRequest
{
    public decimal Amount { get; set; }
    public string BankName { get; set; } = string.Empty;
    public string BankAccount { get; set; } = string.Empty;
}

// Wallet summary (not currently used - WalletDto in UserDtos.cs is used instead)
public class WalletSummaryDto
{
    public int WalletId { get; set; }
    public decimal Balance { get; set; }
    public decimal LockedAmount { get; set; }
    public decimal AvailableBalance { get; set; }
    public string Status { get; set; } = string.Empty;
}
