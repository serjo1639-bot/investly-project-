// ============================================================
// AUTH SERVICE - Handles authentication and user registration
// ============================================================
// DEPENDENCY INJECTION: The constructor receives AppDbContext
// and IConfiguration from the DI container. We never create
// these manually - ASP.NET provides them automatically.
// 
// WHY ASYNC/AWAIT?
// All DB operations use async methods (FirstOrDefaultAsync,
// SaveChangesAsync) to avoid BLOCKING the thread while waiting
// for the database. This allows the server to handle OTHER
// requests during the wait time (scalability!).
// ============================================================

using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Investly_Backend.Data;
using Investly_Backend.DTOs;
using Investly_Backend.Interfaces;
using Investly_Backend.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Investly_Backend.Services;

public class AuthService : IAuthService
{
    // Private fields injected via constructor
    private readonly AppDbContext _context;   // Database access
    private readonly IConfiguration _configuration;  // App settings (appsettings.json)

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<LoginResponse?> LoginAsync(LoginRequest dto)
    {
        // LINQ query: Find user by email
        // FirstOrDefaultAsync = SELECT TOP 1 * FROM Users WHERE Email = @email
        // Returns null if no match found
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (user == null) return null;
        if (!user.IsActive) return null;  // Deactivated accounts can't log in

        // BCrypt.Verify checks the password hash WITHOUT decrypting it
        // We NEVER store plain text passwords - only BCrypt hashes
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash)) return null;

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<LoginResponse?> RegisterAsync(RegisterRequest dto)
    {
        // Check if email is already taken
        var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
        if (existingUser != null) return null;

        // BCrypt.HashPassword creates a salted hash - never reversible!
        // The "salt" is random and stored INSIDE the hash string
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        // Create a new User entity object
        // This is NOT saved to DB yet - we need to call SaveChangesAsync
        var user = new User
        {
            Email = dto.Email,
            PasswordHash = passwordHash,
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Username = dto.Username,
            Phone = dto.Phone,
            NationalId = dto.NationalId,
            IsActive = true,
            EmailConfirmed = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Tracked: Add the entity to the change tracker
        _context.Users.Add(user);
        await _context.SaveChangesAsync();  // INSERT INTO Users ...

        // Assign the base "User" role to the new account.
        var userRole = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "User");
        if (userRole != null)
        {
            _context.UserRoles.Add(new UserRole { UserId = user.UserId, RoleId = userRole.RoleId, AssignedAt = DateTime.UtcNow });
            await _context.SaveChangesAsync();  // INSERT INTO UserRoles ...
        }

        // Local/demo role selection:
        // RegisterRequest has a Role field, so honor it when it matches a real role.
        // This lets Swagger create Investor/Entrepreneur/Admin demo accounts.
        // In production, public self-registration should NOT be allowed to create Admin users.
        if (!string.IsNullOrWhiteSpace(dto.Role) &&
            !dto.Role.Equals("User", StringComparison.OrdinalIgnoreCase))
        {
            var requestedRole = await _context.Roles
                .FirstOrDefaultAsync(r => r.RoleName.ToLower() == dto.Role.ToLower());

            if (requestedRole != null && requestedRole.RoleId != userRole?.RoleId)
            {
                _context.UserRoles.Add(new UserRole { UserId = user.UserId, RoleId = requestedRole.RoleId, AssignedAt = DateTime.UtcNow });
                await _context.SaveChangesAsync();  // INSERT INTO UserRoles ...
            }
        }

        // Every user gets a wallet with 0 balance automatically
        var wallet = new UserWallet
        {
            UserId = user.UserId,
            Balance = 0,
            LockedAmount = 0,
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        _context.UserWallets.Add(wallet);
        await _context.SaveChangesAsync();  // INSERT INTO UserWallets ...

        // Return JWT so user is logged in right after registration
        return await GenerateAuthResponseAsync(user);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest dto)
    {
        // FindAsync looks up by primary key (fastest lookup)
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return false;

        // Must provide CORRECT old password to change
        if (!BCrypt.Net.BCrypt.Verify(dto.OldPassword, user.PasswordHash)) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();  // UPDATE Users SET PasswordHash = ... WHERE UserId = ...
        return true;
    }

    public async Task<UserDto?> GetCurrentUserAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return null;

        // Map User entity -> UserDto (NEVER expose PasswordHash to client!)
        return new UserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Username = user.Username ?? "",
            Gender = user.Gender?.ToString() ?? "",
            NationalId = user.NationalId,
            Phone = user.Phone ?? "",
            ProfilePictureUrl = user.ProfilePictureUrl,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    // ============================================================
    // JWT TOKEN GENERATION
    // ============================================================
    // JWTs are digitally signed JSON strings that prove identity.
    // Structure: header.payload.signature
    // - Header: algorithm info (HMAC-SHA256)
    // - Payload: claims (user data like id, email, roles)
    // - Signature: verified with our secret key (prevents tampering)
    //
    // The client stores this token and sends it in the
    // Authorization header for every authenticated request.
    // ============================================================
    private async Task<LoginResponse> GenerateAuthResponseAsync(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var jwtSettings = _configuration.GetSection("Jwt");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

        // Load the user's roles from the UserRoles join table
        // This is a "navigation property" traversal:
        // User -> UserRole -> Role (three tables joined via LINQ)
        var userRoles = await _context.UserRoles
            .Where(ur => ur.UserId == user.UserId)
            .Select(ur => ur.Role!.RoleName)
            .ToListAsync();

        // Claims are key-value pairs embedded in the JWT
        // They tell the server WHO the user is and WHAT they can do
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),  // User ID
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, $" {user.LastName}")
        };

        // Each role becomes a separate claim
        // This enables [Authorize(Roles = "Admin")] on controllers
        foreach (var role in userRoles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var expiresMinutes = int.Parse(jwtSettings["ExpireMinutes"] ?? "60");
        var expiration = DateTime.UtcNow.AddMinutes(expiresMinutes);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature  // The signing algorithm
            )
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);  // Serialize to string

        return new LoginResponse
        {
            Token = tokenString,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            UserId = user.UserId,
            Roles = userRoles,
            ExpiresAt = expiration
        };
    }
}
