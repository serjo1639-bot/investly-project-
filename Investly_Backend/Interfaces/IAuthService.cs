using InvestlyFullAPI.DTOs.Auth;

namespace InvestlyFullAPI.Interfaces;

// Handles user registration, login, and JWT token generation
public interface IAuthService
{
    // Register a new user account
    // Returns the auth response with JWT token, or null if email already exists
    Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto);

    // Log in with email and password
    // Returns the auth response with JWT token, or null if credentials are invalid
    Task<AuthResponseDto?> LoginAsync(LoginDto loginDto);
}
