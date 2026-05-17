using InvestlyFullAPI.DTOs.Investment;
using InvestlyFullAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestlyFullAPI.Controllers;

// InvestmentsController exposes API endpoints for assets inside a portfolio.
// Controllers should stay thin: they validate HTTP input, call the service,
// then convert the service result into the correct HTTP response.
[ApiController]
[Route("api/[controller]")]
public class InvestmentsController : ControllerBase
{
    private readonly IInvestmentService _investmentService;

    public InvestmentsController(IInvestmentService investmentService)
    {
        _investmentService = investmentService;
    }

    // GET /api/investments/portfolio/{portfolioId}?userId=1
    // Returns all investments in one portfolio. The service checks that the
    // portfolio belongs to the user before returning any data.
    [HttpGet("portfolio/{portfolioId:int}")]
    [Authorize] // Requires a valid JWT token in the Authorization header.
    public async Task<IActionResult> GetPortfolioInvestments(int portfolioId, [FromQuery] int userId)
    {
        var investments = await _investmentService.GetPortfolioInvestmentsAsync(portfolioId, userId);
        return Ok(investments);
    }

    // POST /api/investments/portfolio/{portfolioId}?userId=1
    // Adds a new investment to the selected portfolio.
    [HttpPost("portfolio/{portfolioId:int}")]
    [Authorize]
    public async Task<IActionResult> CreateInvestment(int portfolioId, [FromQuery] int userId, [FromBody] CreateInvestmentDto dto)
    {
        // ModelState contains validation errors from CreateInvestmentDto attributes.
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var investment = await _investmentService.CreateInvestmentAsync(portfolioId, userId, dto);

        // Null means the portfolio was missing or did not belong to this user.
        if (investment == null) return NotFound(new { Message = "Portfolio not found" });

        // 201 Created tells the client that a new resource was saved.
        return CreatedAtAction(nameof(GetPortfolioInvestments), new { portfolioId, userId }, investment);
    }

    // PATCH /api/investments/{investmentId}/price?userId=1
    // Updates only the current market price, not the whole investment record.
    [HttpPatch("{investmentId:int}/price")]
    [Authorize]
    public async Task<IActionResult> UpdatePrice(int investmentId, [FromQuery] int userId, [FromBody] decimal newPrice)
    {
        var investment = await _investmentService.UpdatePriceAsync(investmentId, userId, newPrice);
        if (investment == null) return NotFound(new { Message = "Investment not found" });
        return Ok(investment);
    }

    // DELETE /api/investments/{investmentId}?userId=1
    // Removes an investment and adjusts the portfolio totals inside the service.
    [HttpDelete("{investmentId:int}")]
    [Authorize]
    public async Task<IActionResult> DeleteInvestment(int investmentId, [FromQuery] int userId)
    {
        var result = await _investmentService.DeleteInvestmentAsync(investmentId, userId);
        if (!result) return NotFound(new { Message = "Investment not found" });
        return NoContent();
    }
}
