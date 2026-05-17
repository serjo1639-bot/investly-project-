using InvestlyFullAPI.DTOs.User;
using InvestlyFullAPI.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InvestlyFullAPI.Controllers;

// UsersController manages user profiles
// Most endpoints require authentication (JWT token in Authorization header)
[ApiController]
[Route("api/[controller]")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    // GET /api/users
    // Returns all users in the system
    // Only accessible by authenticated users
    [HttpGet]
    [Authorize]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    // GET /api/users/{id}
    // Returns a single user by ID
    [HttpGet("{id:int}")]
    [Authorize]
    public async Task<IActionResult> GetUserById(int id)
    {
        var user = await _userService.GetUserByIdAsync(id);
        if (user == null)
        {
            return NotFound(new { Message = "User not found" });
        }
        return Ok(user);
    }

    // PUT /api/users/{id}
    // Updates a user's profile information
    [HttpPut("{id:int}")]
    [Authorize]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto updateDto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var user = await _userService.UpdateUserAsync(id, updateDto);
        if (user == null)
        {
            return NotFound(new { Message = "User not found" });
        }
        return Ok(user);
    }

    // DELETE /api/users/me
    // Allows the authenticated user to delete their own account
    [HttpDelete("me")]
    [Authorize]
    public async Task<IActionResult> DeleteMyAccount()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)!.Value);
        var result = await _userService.DeleteMyAccountAsync(userId);
        if (!result)
        {
            return NotFound(new { Message = "User not found" });
        }
        return NoContent();
    }

    // DELETE /api/users/{id}/deactivate
    // Soft-deletes a user (marks as inactive)
    [HttpDelete("{id:int}/deactivate")]
    [Authorize]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var result = await _userService.DeactivateUserAsync(id);
        if (!result)
        {
            return NotFound(new { Message = "User not found" });
        }
        return NoContent();
    }

    // PATCH /api/users/{id}/activate
    // Reactivates a deactivated user
    [HttpPatch("{id:int}/activate")]
    [Authorize]
    public async Task<IActionResult> ActivateUser(int id)
    {
        var result = await _userService.ActivateUserAsync(id);
        if (!result)
        {
            return NotFound(new { Message = "User not found" });
        }
        return NoContent();
    }
}
