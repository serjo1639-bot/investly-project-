using System.ComponentModel.DataAnnotations;

namespace InvestlyFullAPI.DTOs.Portfolio;

// DTO for creating a new investment portfolio
public class CreatePortfolioDto
{
    // Required means the API rejects requests that do not include a name.
    [Required(ErrorMessage = "Portfolio name is required")]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    // Nullable string (?) means the client may leave this field empty.
    [MaxLength(500)]
    public string? Description { get; set; }
}
