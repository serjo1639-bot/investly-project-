namespace InvestlyFullAPI.DTOs.Auth;

// DTO returned after successful login/registration
// Contains the JWT token the client needs for authenticated requests
public class AuthResponseDto
{
    // The JWT token string - client sends this in the Authorization header
    public string Token { get; set; } = string.Empty;

    // When the token expires (so the client knows to refresh)
    public DateTime ExpiresAt { get; set; }

    // Basic user info so the frontend doesn't need a separate API call
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;

    // List of role names the user has (e.g., ["Admin", "Investor"])
    public List<string> Roles { get; set; } = new List<string>();
}
