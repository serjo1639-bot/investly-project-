using InvestlyFullAPI.Data;
using InvestlyFullAPI.DTOs.Investment;
using InvestlyFullAPI.Interfaces;
using InvestlyFullAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace InvestlyFullAPI.Services;

// InvestmentService manages individual assets within portfolios
public class InvestmentService : IInvestmentService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public InvestmentService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    // Get all investments in a portfolio
    public async Task<List<InvestmentDto>> GetPortfolioInvestmentsAsync(int portfolioId, int userId)
    {
        // First verify the portfolio belongs to the user (security check)
        var portfolio = await _context.Portfolios
            .FirstOrDefaultAsync(p => p.PortfolioId == portfolioId && p.UserId == userId);

        if (portfolio == null) return new List<InvestmentDto>();

        var investments = await _context.Investments
            .Where(i => i.PortfolioId == portfolioId)
            .OrderByDescending(i => i.PurchaseDate)
            .ToListAsync();

        return investments.Select(MapToDto).ToList();
    }

    // Add a new investment to a portfolio
    public async Task<InvestmentDto?> CreateInvestmentAsync(int portfolioId, int userId, CreateInvestmentDto dto)
    {
        // Verify the portfolio belongs to the user
        var portfolio = await _context.Portfolios
            .FirstOrDefaultAsync(p => p.PortfolioId == portfolioId && p.UserId == userId);

        if (portfolio == null) return null;

        // Create the investment
        var investment = new Investment
        {
            PortfolioId = portfolioId,
            AssetName = dto.AssetName,
            AssetSymbol = dto.AssetSymbol.ToUpper(), // Store symbols in uppercase
            Quantity = dto.Quantity,
            PurchasePrice = dto.PurchasePrice,
            CurrentPrice = dto.CurrentPrice,
            PurchaseDate = dto.PurchaseDate,
            InvestmentType = dto.InvestmentType
        };

        _context.Investments.Add(investment);

        // Update portfolio totals
        portfolio.TotalInvested += dto.Quantity * dto.PurchasePrice;
        portfolio.CurrentValue += dto.Quantity * dto.CurrentPrice;
        portfolio.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        // Notify the user
        await _notificationService.CreateNotificationAsync(
            userId,
            $"Added {dto.Quantity} {dto.AssetSymbol} to your portfolio.",
            "Success");

        return MapToDto(investment);
    }

    // Remove an investment from a portfolio
    public async Task<bool> DeleteInvestmentAsync(int investmentId, int userId)
    {
        var investment = await _context.Investments
            .Include(i => i.Portfolio) // Need portfolio to verify ownership
            .FirstOrDefaultAsync(i => i.InvestmentId == investmentId);

        if (investment == null || investment.Portfolio.UserId != userId)
            return false;

        var portfolio = investment.Portfolio;

        // Subtract from portfolio totals
        portfolio.TotalInvested -= investment.Quantity * investment.PurchasePrice;
        portfolio.CurrentValue -= investment.Quantity * investment.CurrentPrice;
        portfolio.UpdatedAt = DateTime.UtcNow;

        _context.Investments.Remove(investment);
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(
            userId,
            $"Removed {investment.AssetSymbol} from your portfolio.",
            "Info");

        return true;
    }

    // Simulate updating an asset's current market price
    public async Task<InvestmentDto?> UpdatePriceAsync(int investmentId, int userId, decimal newPrice)
    {
        var investment = await _context.Investments
            .Include(i => i.Portfolio)
            .FirstOrDefaultAsync(i => i.InvestmentId == investmentId);

        if (investment == null || investment.Portfolio.UserId != userId)
            return null;

        var portfolio = investment.Portfolio;

        // Adjust the portfolio's current value by the price difference
        var oldTotalValue = investment.Quantity * investment.CurrentPrice;
        var newTotalValue = investment.Quantity * newPrice;
        portfolio.CurrentValue = portfolio.CurrentValue - oldTotalValue + newTotalValue;
        portfolio.UpdatedAt = DateTime.UtcNow;

        // Update the investment's current price
        investment.CurrentPrice = newPrice;

        await _context.SaveChangesAsync();

        return MapToDto(investment);
    }

    // Helper: convert Investment model to DTO
    private static InvestmentDto MapToDto(Investment investment)
    {
        return new InvestmentDto
        {
            InvestmentId = investment.InvestmentId,
            PortfolioId = investment.PortfolioId,
            AssetName = investment.AssetName,
            AssetSymbol = investment.AssetSymbol,
            Quantity = investment.Quantity,
            PurchasePrice = investment.PurchasePrice,
            CurrentPrice = investment.CurrentPrice,
            PurchaseDate = investment.PurchaseDate,
            InvestmentType = investment.InvestmentType
        };
    }
}
