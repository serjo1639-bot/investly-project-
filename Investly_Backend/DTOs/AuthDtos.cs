// ============================================================
// AUTH DTOS - Authentication/Authorization request/response objects
// ============================================================
// LoginRequest: what the client sends in POST body to /api/auth/login
// LoginResponse: what the server returns after successful login
// RegisterRequest: what the client sends to /api/auth/register
// ============================================================

namespace Investly_Backend.DTOs;

// POST /api/auth/login body
public class LoginRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}

// Response returned after login/register
// Contains the JWT token + user info (no password hash!)
public class LoginResponse
{
    public string Token { get; set; } = string.Empty;     // JWT string
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public int UserId { get; set; }
    public List<string> Roles { get; set; } = new();       // List of role names
    public DateTime ExpiresAt { get; set; }                 // Token expiration time
}

// POST /api/auth/register body
public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;  // Desired role (defaults to "User")
}

// POST /api/auth/refresh body (currently commented out)
public class RefreshTokenRequest
{
    public string UserId { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

// POST /api/auth/forgot-password body (currently commented out)
public class ForgotPasswordRequest
{
    public string Email { get; set; } = string.Empty;
}

// POST /api/auth/reset-password body (currently commented out)
public class ResetPasswordRequest
{
    public string Email { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}

// POST /api/auth/change-password body
public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = string.Empty;
    public string NewPassword { get; set; } = string.Empty;
}
