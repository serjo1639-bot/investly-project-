using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InvestlyFullAPI.Models;

// A single investment asset within a portfolio (e.g., 10 shares of Apple stock)
public class Investment
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int InvestmentId { get; set; }

    // Which portfolio this investment belongs to
    public int PortfolioId { get; set; }

    // Human-readable name like "Apple Inc." or "Bitcoin"
    [Required]
    [MaxLength(200)]
    public string AssetName { get; set; } = string.Empty;

    // Ticker symbol like "AAPL", "BTC", "TSLA"
    [Required]
    [MaxLength(20)]
    public string AssetSymbol { get; set; } = string.Empty;

    // How many units/shares purchased (decimal supports fractional shares)
    public decimal Quantity { get; set; }

    // Price paid per unit at purchase time
    public decimal PurchasePrice { get; set; }

    // Current market price per unit (updated periodically)
    public decimal CurrentPrice { get; set; }

    // When this investment was purchased
    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

    // Category: "Stock", "Crypto", "Bond", "RealEstate", "Commodity", "ETF"
    [Required]
    [MaxLength(50)]
    public string InvestmentType { get; set; } = string.Empty;

    // Navigation: the portfolio this investment belongs to
    [ForeignKey(nameof(PortfolioId))]
    public Portfolio Portfolio { get; set; } = null!;
}
