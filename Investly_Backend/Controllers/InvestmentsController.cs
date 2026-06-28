// ============================================================
// INVESTMENTS CONTROLLER - Investment CRUD and portfolio
// ============================================================
// All endpoints require authentication (class-level [Authorize]).
// Investing requires the "Investor" role specifically.
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]  // All methods require authentication
public class InvestmentsController : ControllerBase
{
    private readonly IInvestmentService _investmentService;

    public InvestmentsController(IInvestmentService investmentService)
    {
        _investmentService = investmentService;
    }

    // GET /api/investments/my - Current user's investments
    [HttpGet("my")]
    public async Task<IActionResult> GetMyInvestments([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var investments = await _investmentService.GetByUserAsync(userId.Value, page, pageSize);
        return Ok(investments);
    }

    // GET /api/investments/{id} - Single investment
    [HttpGet("{id}")]
    public async Task<IActionResult> GetInvestment(int id)
    {
        var investment = await _investmentService.GetByIdAsync(id);
        if (investment == null)
            return NotFound(new ApiResponse { Success = false, Message = "Investment not found" });
        return Ok(investment);
    }

    // POST /api/investments - Create pending investment (investor only)
    [Authorize(Roles = "Investor")]
    [HttpPost]
    public async Task<IActionResult> CreateInvestment([FromBody] CreateInvestmentRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _investmentService.CreateAsync(userId.Value, request);
        if (result == null)
            return BadRequest(new ApiResponse
            {
                Success = false,
                Message = "Investment could not be created. Check wallet balance, project status, and investment limits."
            });
        return Ok(result);
    }

    // POST /api/investments/{id}/confirm - Confirm pending investment
    [Authorize(Roles = "Investor")]
    [HttpPost("{id}/confirm")]
    public async Task<IActionResult> ConfirmInvestment(int id)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _investmentService.ConfirmAsync(id, userId.Value);
        if (!result)
            return BadRequest(new ApiResponse { Success = false, Message = "Investment could not be confirmed" });
        return Ok(result);
    }

    // POST /api/investments/{id}/cancel - Cancel pending investment
    [Authorize(Roles = "Investor")]
    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelInvestment(int id)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _investmentService.CancelAsync(id, userId.Value);
        if (!result)
            return BadRequest(new ApiResponse { Success = false, Message = "Investment could not be cancelled" });
        return Ok(result);
    }

    // GET /api/investments/portfolio/summary - Portfolio stats
    [HttpGet("portfolio/summary")]
    public async Task<IActionResult> GetPortfolioSummary()
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var summary = await _investmentService.GetPortfolioSummaryAsync(userId.Value);
        return Ok(summary);
    }

    private int? GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            return userId;
        return null;
    }
}
