using InvestlyFullAPI.DTOs.Portfolio;
using InvestlyFullAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestlyFullAPI.Controllers;

// PortfoliosController exposes endpoints for creating, reading, and deleting
// a user's portfolios. The heavier business rules live in PortfolioService.
[ApiController]
[Route("api/[controller]")]
public class PortfoliosController : ControllerBase
{
    private readonly IPortfolioService _portfolioService;

    public PortfoliosController(IPortfolioService portfolioService)
    {
        _portfolioService = portfolioService;
    }

    // GET /api/portfolios/user/{userId}
    // Returns every portfolio owned by the selected user.
    [HttpGet("user/{userId:int}")]
    [Authorize] // Only logged-in users can call this endpoint.
    public async Task<IActionResult> GetUserPortfolios(int userId)
    {
        var portfolios = await _portfolioService.GetUserPortfoliosAsync(userId);
        return Ok(portfolios);
    }

    // GET /api/portfolios/{portfolioId}?userId=1
    // userId is used by the service to prevent one user reading another user's portfolio.
    [HttpGet("{portfolioId:int}")]
    [Authorize]
    public async Task<IActionResult> GetPortfolioById(int portfolioId, [FromQuery] int userId)
    {
        var portfolio = await _portfolioService.GetPortfolioByIdAsync(portfolioId, userId);
        if (portfolio == null) return NotFound(new { Message = "Portfolio not found" });
        return Ok(portfolio);
    }

    // POST /api/portfolios?userId=1
    // Creates a new empty portfolio for the selected user.
    [HttpPost]
    [Authorize]
    public async Task<IActionResult> CreatePortfolio([FromQuery] int userId, [FromBody] CreatePortfolioDto dto)
    {
        // Validation comes from attributes on CreatePortfolioDto.
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var portfolio = await _portfolioService.CreatePortfolioAsync(userId, dto);

        // CreatedAtAction returns 201 and points clients to the route that can fetch this portfolio.
        return CreatedAtAction(nameof(GetPortfolioById), new { portfolioId = portfolio.PortfolioId, userId }, portfolio);
    }

    // DELETE /api/portfolios/{portfolioId}?userId=1
    // Deleting a portfolio also deletes its investments because EF is configured for cascade delete.
    [HttpDelete("{portfolioId:int}")]
    [Authorize]
    public async Task<IActionResult> DeletePortfolio(int portfolioId, [FromQuery] int userId)
    {
        var result = await _portfolioService.DeletePortfolioAsync(portfolioId, userId);
        if (!result) return NotFound(new { Message = "Portfolio not found" });
        return NoContent();
    }
}
