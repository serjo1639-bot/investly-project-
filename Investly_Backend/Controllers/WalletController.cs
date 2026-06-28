// ============================================================
// WALLET CONTROLLER - Balance, deposits, withdrawals
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class WalletController : ControllerBase
{
    private readonly IWalletService _walletService;

    public WalletController(IWalletService walletService)
    {
        _walletService = walletService;
    }

    // GET /api/wallet - Current user's wallet
    [HttpGet]
    public async Task<IActionResult> GetMyWallet()
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var wallet = await _walletService.GetWalletAsync(userId.Value);
        if (wallet == null)
            return NotFound(new ApiResponse { Success = false, Message = "Wallet not found" });
        return Ok(wallet);
    }

    // POST /api/wallet/deposit - Add funds
    [HttpPost("deposit")]
    public async Task<IActionResult> Deposit([FromBody] DepositRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _walletService.DepositAsync(userId.Value, request);
        return Ok(result);
    }

    // POST /api/wallet/withdraw - Request withdrawal (admin must approve)
    [HttpPost("withdraw")]
    public async Task<IActionResult> Withdraw([FromBody] WithdrawRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _walletService.WithdrawAsync(userId.Value, request);
        return Ok(result);
    }

    // GET /api/wallet/transactions - Transaction history
    [HttpGet("transactions")]
    public async Task<IActionResult> GetTransactions([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var transactions = await _walletService.GetTransactionsAsync(userId.Value, page, pageSize);
        return Ok(transactions);
    }

    private int? GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            return userId;
        return null;
    }
}
