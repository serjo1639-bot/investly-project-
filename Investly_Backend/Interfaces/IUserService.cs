// IUserService - Contract for user/profile management operations

using Investly_Backend.DTOs;

namespace Investly_Backend.Interfaces;

public interface IUserService
{
    Task<PaginatedResult<UserDto>> GetAllAsync(int page, int pageSize, string? search);
    Task<UserDto?> GetByIdAsync(int id);
    Task<UserDto?> GetByEmailAsync(string email);
    Task<UserDto?> UpdateUserAsync(int id, UpdateUserRequest request);
    Task<bool> DeactivateUserAsync(int id);
    Task<bool> ActivateUserAsync(int id);
    Task<WalletDto?> GetWalletAsync(int userId);
    Task<InvestorProfileDto?> CreateInvestorProfileAsync(int userId, CreateInvestorProfileRequest request);
    Task<EntrepreneurProfileDto?> CreateEntrepreneurProfileAsync(int userId, CreateEntrepreneurProfileRequest request);
    Task<InvestorProfileDto?> GetInvestorProfileAsync(int userId);
    Task<EntrepreneurProfileDto?> GetEntrepreneurProfileAsync(int userId);
}
