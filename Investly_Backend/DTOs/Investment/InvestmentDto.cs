namespace InvestlyFullAPI.DTOs.Investment;

// DTO for returning investment data to the client
public class InvestmentDto
{
    public int InvestmentId { get; set; }
    public int PortfolioId { get; set; }
    public string AssetName { get; set; } = string.Empty;
    public string AssetSymbol { get; set; } = string.Empty;
    public decimal Quantity { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal CurrentPrice { get; set; }

    // Total amount spent to buy this asset
    public decimal TotalCost => Quantity * PurchasePrice;

    // Current total value of this holding
    public decimal TotalValue => Quantity * CurrentPrice;

    // Profit/Loss for this individual investment
    public decimal ProfitLoss => TotalValue - TotalCost;

    // Percentage return
    public decimal ReturnPercentage =>
        TotalCost > 0 ? Math.Round((TotalValue - TotalCost) / TotalCost * 100, 2) : 0;

    public DateTime PurchaseDate { get; set; }
    public string InvestmentType { get; set; } = string.Empty;
}
