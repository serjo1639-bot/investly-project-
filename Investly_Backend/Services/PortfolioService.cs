using InvestlyFullAPI.Data;
using InvestlyFullAPI.DTOs.Portfolio;
using InvestlyFullAPI.Interfaces;
using InvestlyFullAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace InvestlyFullAPI.Services;

// PortfolioService manages investment portfolios
public class PortfolioService : IPortfolioService
{
    private readonly AppDbContext _context;
    private readonly INotificationService _notificationService;

    public PortfolioService(AppDbContext context, INotificationService notificationService)
    {
        _context = context;
        _notificationService = notificationService;
    }

    // Get all portfolios for a user
    public async Task<List<PortfolioDto>> GetUserPortfoliosAsync(int userId)
    {
        var portfolios = await _context.Portfolios
            .Where(p => p.UserId == userId)
            .Include(p => p.Investments) // Include investments to calculate counts/values
            .OrderByDescending(p => p.UpdatedAt)
            .ToListAsync();

        return portfolios.Select(MapToDto).ToList();
    }

    // Get a single portfolio with full details
    public async Task<PortfolioDto?> GetPortfolioByIdAsync(int portfolioId, int userId)
    {
        var portfolio = await _context.Portfolios
            .Where(p => p.PortfolioId == portfolioId && p.UserId == userId)
            .Include(p => p.Investments)
            .FirstOrDefaultAsync();

        return portfolio == null ? null : MapToDto(portfolio);
    }

    // Create a new empty portfolio
    public async Task<PortfolioDto> CreatePortfolioAsync(int userId, CreatePortfolioDto dto)
    {
        var portfolio = new Portfolio
        {
            UserId = userId,
            Name = dto.Name,
            Description = dto.Description,
            TotalInvested = 0,
            CurrentValue = 0,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.Portfolios.Add(portfolio);
        await _context.SaveChangesAsync();

        // Send a notification to the user about the new portfolio
        await _notificationService.CreateNotificationAsync(
            userId,
            $"Your new portfolio \"{dto.Name}\" has been created!",
            "Success");

        return MapToDto(portfolio);
    }

    // Delete a portfolio and all its investments (cascade delete)
    public async Task<bool> DeletePortfolioAsync(int portfolioId, int userId)
    {
        var portfolio = await _context.Portfolios
            .FirstOrDefaultAsync(p => p.PortfolioId == portfolioId && p.UserId == userId);

        if (portfolio == null) return false;

        _context.Portfolios.Remove(portfolio);
        await _context.SaveChangesAsync();

        await _notificationService.CreateNotificationAsync(
            userId,
            $"Portfolio \"{portfolio.Name}\" has been deleted.",
            "Warning");

        return true;
    }

    // Helper: convert Portfolio model to DTO with calculated fields
    private static PortfolioDto MapToDto(Portfolio portfolio)
    {
        return new PortfolioDto
        {
            PortfolioId = portfolio.PortfolioId,
            UserId = portfolio.UserId,
            Name = portfolio.Name,
            Description = portfolio.Description,
            TotalInvested = portfolio.TotalInvested,
            CurrentValue = portfolio.CurrentValue,
            CreatedAt = portfolio.CreatedAt,
            UpdatedAt = portfolio.UpdatedAt,
            InvestmentCount = portfolio.Investments?.Count ?? 0
        };
    }
}
