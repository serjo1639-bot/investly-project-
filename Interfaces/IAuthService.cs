// ============================================================
// IAuthService - INTERFACE for authentication operations
// ============================================================
// WHY INTERFACES?
// An interface is a CONTRACT - it defines WHAT methods a class
// must implement, but not HOW.
//
// BENEFITS:
// 1. TESTABILITY: You can mock the interface in unit tests
//    without needing a real database
// 2. SWAPPABILITY: You can change the implementation without
//    changing the code that uses it
// 3. DI-FRIENDLY: ASP.NET DI container works best with interfaces
//
// PATTERN: Interface -> Implementation
//   IAuthService (contract) -> AuthService (implementation)
//   Program.cs registers: AddScoped<IAuthService, AuthService>()
//   Controllers receive IAuthService in constructor
// ============================================================

using Investly_Backend.DTOs;

namespace Investly_Backend.Interfaces;

public interface IAuthService
{
    Task<LoginResponse?> LoginAsync(LoginRequest request);
    Task<LoginResponse?> RegisterAsync(RegisterRequest request);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request);
    Task<UserDto?> GetCurrentUserAsync(int userId);
}
