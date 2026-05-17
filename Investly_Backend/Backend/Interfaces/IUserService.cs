using InvestlyFullAPI.DTOs.User;

namespace InvestlyFullAPI.Interfaces;

// Manages user profile operations
public interface IUserService
{
    // Get a list of all users
    Task<List<UserDto>> GetAllUsersAsync();

    // Get a single user by their ID
    Task<UserDto?> GetUserByIdAsync(int id);

    // Update a user's profile information
    Task<UserDto?> UpdateUserAsync(int id, UpdateUserDto updateDto);

    // Self-delete: user deactivates own account
    Task<bool> DeleteMyAccountAsync(int userId);

    // Soft-delete: deactivate a user instead of removing from database
    Task<bool> DeactivateUserAsync(int id);

    // Activate a previously deactivated user
    Task<bool> ActivateUserAsync(int id);
}
