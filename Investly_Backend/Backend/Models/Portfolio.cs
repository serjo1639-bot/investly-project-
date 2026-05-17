using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InvestlyFullAPI.Models;

// A portfolio groups multiple investments together (like a "My Stocks" folder)
// Each user can have multiple portfolios
public class Portfolio
{
    [Key]
    [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
    public int PortfolioId { get; set; }

    // The user who owns this portfolio
    public int UserId { get; set; }

    // User-given name like "Retirement Fund" or "Trading Account"
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    // Optional longer description
    [MaxLength(500)]
    public string? Description { get; set; }

    // Total money invested across all items in this portfolio
    // "decimal" is used for money to avoid floating-point rounding errors
    public decimal TotalInvested { get; set; } = 0;

    // Current market value of all investments in this portfolio
    public decimal CurrentValue { get; set; } = 0;

    // Profit/Loss = CurrentValue - TotalInvested (calculated, not stored)
    // We compute this on-the-fly in the service layer

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation: the user who owns this portfolio
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    // Navigation: one portfolio has MANY investments (1-to-many)
    public ICollection<Investment> Investments { get; set; } = new List<Investment>();
}
