using InvestlyFullAPI.DTOs.Investment;

namespace InvestlyFullAPI.Interfaces;

// Manages individual investments within a portfolio
public interface IInvestmentService
{
    // Get all investments for a specific portfolio
    Task<List<InvestmentDto>> GetPortfolioInvestmentsAsync(int portfolioId, int userId);

    // Add a new investment to a portfolio
    Task<InvestmentDto?> CreateInvestmentAsync(int portfolioId, int userId, CreateInvestmentDto dto);

    // Delete an investment from a portfolio
    Task<bool> DeleteInvestmentAsync(int investmentId, int userId);

    // Update the current price of an investment (simulates market price change)
    Task<InvestmentDto?> UpdatePriceAsync(int investmentId, int userId, decimal newPrice);
}
