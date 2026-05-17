using InvestlyFullAPI.DTOs.Auth;
using InvestlyFullAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestlyFullAPI.Controllers;

// AuthController handles user registration and login
// No authentication required for these endpoints (anyone can register/login)
[ApiController]
//[AllowAnonymous]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // POST /api/auth/register
    // Creates a new user account and returns a JWT token
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
    {
        // Validate the request body using data annotations
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.RegisterAsync(registerDto);

        if (result == null)
        {
            // Email already taken
            return Conflict(new { Message = "An account with this email already exists" });
        }

        // Return 201 Created with the JWT token
        return CreatedAtAction(nameof(Register), result);
    }

    // POST /api/auth/login
    // Authenticates an existing user and returns a JWT token
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var result = await _authService.LoginAsync(loginDto);
        
        if (result == null)
        {
            // Invalid email or password (don't reveal which one)
            return Unauthorized(new { Message = "Invalid email or password" });
        }

        return Ok(result);
    }
}
