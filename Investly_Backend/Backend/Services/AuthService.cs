using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using InvestlyFullAPI.Data;
using InvestlyFullAPI.DTOs.Auth;
using InvestlyFullAPI.Interfaces;
using InvestlyFullAPI.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace InvestlyFullAPI.Services;

// AuthService handles user registration and login
// It creates JWT tokens that the client uses for authenticated requests
public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // Register a new user
    public async Task<AuthResponseDto?> RegisterAsync(RegisterDto registerDto)
    {
        // Check if email is already taken (we have a unique index on Email)
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == registerDto.Email);

        if (existingUser != null)
        {
            return null; // Email already exists
        }

        // Hash the password using BCrypt
        // BCrypt automatically generates a random salt and embeds it in the hash
        // This means even if two users have the same password, their hashes differ
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);

        // Create the new user object
        var user = new User
        {
            Email = registerDto.Email,
            PasswordHash = passwordHash,
            FirstName = registerDto.FirstName,
            LastName = registerDto.LastName,
            IsMale = registerDto.IsMale,
            NationalId = registerDto.NationalId,
            DateOfBirth = registerDto.DateOfBirth,
            Phone = registerDto.Phone,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Save user to database
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Assign the default "Investor" role to every new user
        var investorRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.RoleName == "Investor");

        if (investorRole != null)
        {
            var userRole = new UserRole
            {
                UserId = user.UserId,
                RoleId = investorRole.RoleId,
                AssignedAt = DateTime.UtcNow
            };
            _context.UserRoles.Add(userRole);
            await _context.SaveChangesAsync();
        }

        // Generate JWT token for the new user so they're logged in immediately
        return await GenerateAuthResponseAsync(user);
    }

    // Log in an existing user
    public async Task<AuthResponseDto?> LoginAsync(LoginDto loginDto)
    {
        // Find user by email
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == loginDto.Email);

        if (user == null)
        {
            return null; // User not found
        }

        // Check if account is active
        if (!user.IsActive)
        {
            return null; // Account deactivated
        }

        // Verify password using BCrypt
        // BCrypt.Verify() compares the plain password against the stored hash
        if (!BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
        {
            return null; // Wrong password
        }

        // Generate JWT token
        return await GenerateAuthResponseAsync(user);
    }

    // Generate a JWT token and auth response for a user
    private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user)
    {
        // Get the user's roles
        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == user.UserId)
            .Include(ur => ur.Role)
            .Select(ur => ur.Role.RoleName)
            .ToListAsync();

        // Create claims (pieces of info stored inside the token)
        // Claims are like key-value pairs embedded in the JWT
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.GivenName, user.FirstName),
            new Claim(ClaimTypes.Surname, user.LastName)
        };

        // Add each role as a separate claim
        // This allows role-based authorization with [Authorize(Roles = "Admin")]
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        // Get JWT settings from appsettings.json
        var jwtSettings = _configuration.GetSection("JWT");
        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtSettings["Key"]!));

        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Read expiration from config or default to 7 days
        var expireMinutes = jwtSettings["ExpireMinutes"];
        var expiration = expireMinutes != null
            ? DateTime.UtcNow.AddMinutes(double.Parse(expireMinutes))
            : DateTime.UtcNow.AddDays(7);

        // Create the token descriptor
        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = expiration,
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = credentials
        };

        // Generate the token
        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        var tokenString = tokenHandler.WriteToken(token);

        // Return the auth response
        return new AuthResponseDto
        {
            Token = tokenString,
            ExpiresAt = expiration,
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            Roles = roles
        };
    }
}
