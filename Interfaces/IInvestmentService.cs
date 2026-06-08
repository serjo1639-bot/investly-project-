// IInvestmentService - Contract for investment operations

using Investly_Backend.DTOs;

namespace Investly_Backend.Interfaces;

public interface IInvestmentService
{
    Task<PaginatedResult<MyInvestmentDto>> GetByUserAsync(int userId, int page, int pageSize);
    Task<InvestmentDto?> GetByIdAsync(int userId, int id);
    Task<InvestmentConfirmationDto?> CreateAsync(int userId, CreateInvestmentRequest request);
    Task<bool> ConfirmAsync(int userId, int id);
    Task<bool> CancelAsync(int userId, int id);
    Task<object> GetPortfolioSummaryAsync(int userId);
}
