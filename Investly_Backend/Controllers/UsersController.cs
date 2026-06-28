// ============================================================
// USERS CONTROLLER - User and profile management
// ============================================================
// Some endpoints are admin-only (user list, activate/deactivate).
// Profile endpoints use the authenticated user's ID from JWT.
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // GET /api/users - Admin: list all users
    [Authorize(Roles = "Admin")]
    [HttpGet]
    public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? search = null)
    {
        var users = await _userService.GetAllAsync(page, pageSize, search);
        return Ok(users);
    }

    // GET /api/users/{id} - Single user
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        if (!CanAccessUser(id))
            return Forbid();

        var user = await _userService.GetByIdAsync(id);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });
        return Ok(user);
    }

    // PUT /api/users/{id} - Update user profile
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        if (!CanAccessUser(id))
            return Forbid();

        var result = await _userService.UpdateUserAsync(id, request);
        return Ok(result);
    }

    // POST /api/users/{id}/deactivate - Admin: soft-delete
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var result = await _userService.DeactivateUserAsync(id);
        return Ok(result);
    }

    // POST /api/users/{id}/activate - Admin: restore
    [Authorize(Roles = "Admin")]
    [HttpPost("{id}/activate")]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var result = await _userService.ActivateUserAsync(id);
        return Ok(result);
    }

    // GET /api/users/{id}/wallet - User's wallet
    [HttpGet("{id}/wallet")]
    public async Task<IActionResult> GetUserWallet(int id)
    {
        if (!CanAccessUser(id))
            return Forbid();

        var wallet = await _userService.GetWalletAsync(id);
        if (wallet == null)
            return NotFound(new ApiResponse { Success = false, Message = "Wallet not found" });
        return Ok(wallet);
    }

    // POST /api/users/investor-profile - Create investor KYC profile
    [HttpPost("investor-profile")]
    public async Task<IActionResult> CreateInvestorProfile([FromBody] CreateInvestorProfileRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _userService.CreateInvestorProfileAsync(userId.Value, request);
        return Ok(result);
    }

    // POST /api/users/entrepreneur-profile - Create entrepreneur profile
    [HttpPost("entrepreneur-profile")]
    public async Task<IActionResult> CreateEntrepreneurProfile([FromBody] CreateEntrepreneurProfileRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _userService.CreateEntrepreneurProfileAsync(userId.Value, request);
        return Ok(result);
    }

    // GET /api/users/investor-profile - Get own KYC profile
    [HttpGet("investor-profile")]
    public async Task<IActionResult> GetInvestorProfile()
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var profile = await _userService.GetInvestorProfileAsync(userId.Value);
        if (profile == null)
            return NotFound(new ApiResponse { Success = false, Message = "Investor profile not found" });
        return Ok(profile);
    }

    // GET /api/users/entrepreneur-profile - Get own entrepreneur profile
    [HttpGet("entrepreneur-profile")]
    public async Task<IActionResult> GetEntrepreneurProfile()
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var profile = await _userService.GetEntrepreneurProfileAsync(userId.Value);
        if (profile == null)
            return NotFound(new ApiResponse { Success = false, Message = "Entrepreneur profile not found" });
        return Ok(profile);
    }

    private int? GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            return userId;
        return null;
    }

    private bool CanAccessUser(int id)
    {
        var currentUserId = GetUserIdFromClaims();
        return currentUserId == id || User.IsInRole("Admin");
    }
}
