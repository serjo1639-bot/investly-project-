namespace InvestlyFullAPI.DTOs.Portfolio;

// DTO for returning portfolio data to the client
public class PortfolioDto
{
    public int PortfolioId { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public decimal TotalInvested { get; set; }
    public decimal CurrentValue { get; set; }

    // Computed: positive = profit, negative = loss
    public decimal ProfitLoss => CurrentValue - TotalInvested;

    // Return on investment as a percentage
    public decimal ReturnPercentage =>
        TotalInvested > 0 ? Math.Round((CurrentValue - TotalInvested) / TotalInvested * 100, 2) : 0;

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int InvestmentCount { get; set; }
}
