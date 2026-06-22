// ============================================================
// AUTH CONTROLLER - Registration, login, password management
// ============================================================
// KEY ASP.NET CONCEPTS:
//
// [ApiController] - Enables automatic model validation, binding,
//   and standardized error responses for Web APIs.
//
// [Route("api/[controller]")] - Maps to URL: /api/auth
//   [controller] is replaced by the class name minus "Controller"
//   So AuthController -> "auth" -> /api/auth
//
// [Authorize] - Requires a valid JWT to access this endpoint.
//   If missing/invalid, returns 401 Unauthorized automatically.
//
// HTTP METHODS:
//   [HttpGet]    - Read data (SELECT)
//   [HttpPost]   - Create data (INSERT)
//   [HttpPut]    - Update data (UPDATE)
//   [HttpDelete] - Delete data (DELETE)
//
// ActionResult/IActionResult - Return types that include
//   HTTP status codes: Ok(200), NotFound(404), Unauthorized(401)
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    // DEPENDENCY INJECTION: The interface is injected through constructor.
    // The DI container automatically provides the implementation (AuthService).
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/auth/login - Public endpoint (no [Authorize])
    // [FromBody] tells ASP.NET to deserialize the JSON request body into LoginRequest
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var response = await _authService.LoginAsync(request);
        if (response == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "Invalid credentials" });
        return Ok(response);
    }

    // POST /api/auth/register - Create new account
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
        if (response == null)
            return Conflict(new ApiResponse { Success = false, Message = "An account with this email already exists" });
        return Ok(response);
    }

    // POST /api/auth/change-password - Requires authentication
    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var result = await _authService.ChangePasswordAsync(userId.Value, request);
        return Ok(result);
    }

    // GET /api/auth/me - Returns current user's profile
    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });
        var user = await _authService.GetCurrentUserAsync(userId.Value);
        return Ok(user);
    }

    // ============================================================
    // HELPER: Extract User ID from JWT Claims
    // ============================================================
    // When a user authenticates, their user ID is embedded in the JWT
    // as a Claim. We extract it here instead of making the client
    // send it in the request body. This prevents ID spoofing.
    //
    // User.FindFirst reads from the current request's JWT claims.
    // ClaimTypes.NameIdentifier is the standard claim for "user id".
    // ============================================================
    private int? GetUserIdFromClaims()
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier);
        if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            return userId;
        return null;
    }
}
