using InvestlyFullAPI.DTOs.Portfolio;

namespace InvestlyFullAPI.Interfaces;

// Manages investment portfolios for users
public interface IPortfolioService
{
    // Get all portfolios for a specific user
    Task<List<PortfolioDto>> GetUserPortfoliosAsync(int userId);

    // Get a single portfolio by ID (includes investment count)
    Task<PortfolioDto?> GetPortfolioByIdAsync(int portfolioId, int userId);

    // Create a new empty portfolio
    Task<PortfolioDto> CreatePortfolioAsync(int userId, CreatePortfolioDto dto);

    // Delete a portfolio and all its investments
    Task<bool> DeletePortfolioAsync(int portfolioId, int userId);
}
