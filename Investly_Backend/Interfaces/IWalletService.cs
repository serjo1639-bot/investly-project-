// IWalletService - Contract for wallet and withdrawal operations

using Investly_Backend.DTOs;

namespace Investly_Backend.Interfaces;

public interface IWalletService
{
    Task<WalletDto?> GetWalletAsync(int userId);
    Task<WalletTransactionDto?> DepositAsync(int userId, DepositRequest request);
    Task<WalletTransactionDto?> WithdrawAsync(int userId, WithdrawRequest request);
    Task<PaginatedResult<WalletTransactionDto>> GetTransactionsAsync(int userId, int page, int pageSize);
    Task<PaginatedResult<WithdrawalRequestDto>> GetWithdrawalRequestsAsync(int page, int pageSize, string? status);
    Task<bool> ApproveWithdrawalAsync(int id);
    Task<bool> RejectWithdrawalAsync(int id, string reason);
}
