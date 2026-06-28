// ============================================================
// INVESTMENT DTOS - Investment-related request/response objects
// ============================================================

namespace Investly_Backend.DTOs;

// Full investment details (admin/owner view)
public class InvestmentDto
{
    public int InvestmentId { get; set; }
    public int InvestorProfileId { get; set; }
    public int ProjectId { get; set; }
    public decimal Amount { get; set; }
    public string Status { get; set; } = string.Empty;
    public decimal FundingPercentage { get; set; }  // This investment's % of funding goal
    public decimal EquityPercentage { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
}

// Request body for POST /api/investments
public class CreateInvestmentRequest
{
    public int ProjectId { get; set; }
    public decimal Amount { get; set; }
}

// Response returned after creating an investment
public class InvestmentConfirmationDto
{
    public int InvestmentId { get; set; }
    public decimal Amount { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public decimal FundingPercentage { get; set; }
    public decimal EquityPercentage { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime? ConfirmedAt { get; set; }
}

// Lightweight investment info for the user's "My Investments" list
public class MyInvestmentDto
{
    public int InvestmentId { get; set; }
    public int ProjectId { get; set; }
    public string ProjectTitle { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal FundingPercentage { get; set; }
    public decimal EquityPercentage { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? ConfirmedAt { get; set; }
}
