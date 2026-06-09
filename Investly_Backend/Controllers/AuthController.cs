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
using Investly_Backend.Data;
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
    private readonly AppDbContext _context;

    public AuthController(IAuthService authService, AppDbContext context)
    {
        _authService = authService;
        _context = context;
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

    // POST /api/auth/login-email - Alias kept for clients generated from the Swagger file.
    [HttpPost("login-email")]
    public async Task<IActionResult> LoginEmail([FromBody] LoginRequest request)
    {
        return await Login(request);
    }

    // POST /api/auth/register - Create new account
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var response = await _authService.RegisterAsync(request);
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

    // POST /api/auth/logout - JWT logout is client-side; this endpoint lets clients complete the flow cleanly.
    [Authorize]
    [HttpPost("logout")]
    public IActionResult Logout()
    {
        return Ok(new ApiResponse { Success = true, Message = "Logged out" });
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

    // GET /api/auth/profile - Same current-user profile under the Swagger route.
    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        return await GetCurrentUser();
    }

    // PUT /api/auth/profile - Updates only the authenticated user's own profile.
    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = GetUserIdFromClaims();
        if (userId == null)
            return Unauthorized(new ApiResponse { Success = false, Message = "User not found" });

        var user = await _context.Users.FindAsync(userId.Value);
        if (user == null)
            return NotFound(new ApiResponse { Success = false, Message = "User not found" });

        // Empty fields mean "do not change"; this keeps mobile partial updates simple.
        if (!string.IsNullOrWhiteSpace(request.FirstName))
            user.FirstName = request.FirstName;
        if (!string.IsNullOrWhiteSpace(request.LastName))
            user.LastName = request.LastName;
        if (!string.IsNullOrWhiteSpace(request.Email))
            user.Email = request.Email;

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(await _authService.GetCurrentUserAsync(userId.Value));
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
