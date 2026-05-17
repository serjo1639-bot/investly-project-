using System.ComponentModel.DataAnnotations;

namespace InvestlyFullAPI.DTOs.Investment;

// DTO for adding a new investment to a portfolio
public class CreateInvestmentDto
{
    // Data annotations validate incoming JSON before the controller calls the service.
    [Required(ErrorMessage = "Asset name is required")]
    [MaxLength(200)]
    public string AssetName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Asset symbol is required")]
    [MaxLength(20)]
    public string AssetSymbol { get; set; } = string.Empty;

    // Range prevents saving impossible values like zero or negative shares.
    [Range(0.000001, double.MaxValue, ErrorMessage = "Quantity must be greater than 0")]
    public decimal Quantity { get; set; }

    [Range(0.0001, double.MaxValue, ErrorMessage = "Purchase price must be greater than 0")]
    public decimal PurchasePrice { get; set; }

    [Range(0.0001, double.MaxValue, ErrorMessage = "Current price must be greater than 0")]
    public decimal CurrentPrice { get; set; }

    public DateTime PurchaseDate { get; set; } = DateTime.UtcNow;

    [Required(ErrorMessage = "Investment type is required")]
    [MaxLength(50)]
    public string InvestmentType { get; set; } = string.Empty;
}
