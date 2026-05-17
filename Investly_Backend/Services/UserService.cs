using InvestlyFullAPI.Data;
using InvestlyFullAPI.DTOs.User;
using InvestlyFullAPI.Interfaces;
using InvestlyFullAPI.Models;
using Microsoft.EntityFrameworkCore;

namespace InvestlyFullAPI.Services;

// UserService handles CRUD operations for user profiles
public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    // Get all users with their roles
    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        var users = await _context.Users.ToListAsync();

        // Get all user-role mappings in one query (avoids N+1 problem)
        var allUserRoles = await _context.UserRoles
            .Include(ur => ur.Role)
            .ToListAsync();

        return users.Select(user => MapToDto(user, allUserRoles
            .Where(ur => ur.UserId == user.UserId)
            .Select(ur => ur.Role.RoleName)
            .ToList())).ToList();
    }

    // Get a single user by ID
    public async Task<UserDto?> GetUserByIdAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return null;

        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == id)
            .Include(ur => ur.Role)
            .Select(ur => ur.Role.RoleName)
            .ToListAsync();

        return MapToDto(user, roles);
    }

    // Update user profile (partial update - only provided fields change)
    public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateDto)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return null;

        // Only update fields that were actually provided (not null)
        if (updateDto.FirstName != null)
            user.FirstName = updateDto.FirstName;

        if (updateDto.LastName != null)
            user.LastName = updateDto.LastName;

        if (updateDto.IsMale.HasValue)
            user.IsMale = updateDto.IsMale.Value;

        if (updateDto.NationalId != null)
            user.NationalId = updateDto.NationalId;

        if (updateDto.DateOfBirth.HasValue)
            user.DateOfBirth = updateDto.DateOfBirth.Value;

        if (updateDto.Phone != null)
            user.Phone = updateDto.Phone;

        if (updateDto.ProfilePictureUrl != null)
            user.ProfilePictureUrl = updateDto.ProfilePictureUrl;

        if (updateDto.BankAccountNumber != null)
            user.BankAccountNumber = updateDto.BankAccountNumber;

        user.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var roles = await _context.UserRoles
            .Where(ur => ur.UserId == id)
            .Include(ur => ur.Role)
            .Select(ur => ur.Role.RoleName)
            .ToListAsync();

        return MapToDto(user, roles);
    }

    // Self-delete: user deactivates their own account
    public async Task<bool> DeleteMyAccountAsync(int userId)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == userId);
        if (user == null) return false;

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    // Soft-delete: mark user as inactive instead of removing from DB
    public async Task<bool> DeactivateUserAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return false;

        user.IsActive = false;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    // Reactivate a deactivated user
    public async Task<bool> ActivateUserAsync(int id)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.UserId == id);
        if (user == null) return false;

        user.IsActive = true;
        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    // Helper: convert a User model + roles into a UserDto
    private static UserDto MapToDto(User user, List<string> roles)
    {
        return new UserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            IsMale = user.IsMale,
            NationalId = user.NationalId,
            DateOfBirth = user.DateOfBirth,
            Phone = user.Phone,
            ProfilePictureUrl = user.ProfilePictureUrl,
            BankAccountNumber = user.BankAccountNumber,
            IsActive = user.IsActive,
            EmailConfirmed = user.EmailConfirmed,
            CreatedAt = user.CreatedAt,
            Roles = roles
        };
    }
}
