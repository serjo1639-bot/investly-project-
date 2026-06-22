// ============================================================
// USER SERVICE - Profile management, wallet queries, profiles
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Interfaces;
using Investly_Backend.Models;
using Investly_Backend.Data;
using Investly_Backend.DTOs;

namespace Investly_Backend.Services;

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    // GET /api/users - List users with search and pagination
    public async Task<PaginatedResult<UserDto>> GetAllAsync(int page = 1, int pageSize = 10, string? search = null)
    {
        // AsQueryable() allows building the query conditionally
        // The query is NOT executed until we call ToListAsync()
        // This is called "deferred execution" - a key LINQ concept
        var query = _context.Users.AsQueryable();

        // WHERE clause: filter by search term (if provided)
        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Email.Contains(search) || (u.FirstName + " " + u.LastName).Contains(search));
        }

        var total = await query.CountAsync();  // Total count for pagination
        var users = await query
            .Skip((page - 1) * pageSize)   // OFFSET: skip previous pages
            .Take(pageSize)                 // LIMIT: take only this page's items
            .Include(u => u.UserWallet)     // LEFT JOIN Users with UserWallets
            .ToListAsync();                 // EXECUTE the query

        // Map entities to DTOs (never expose raw entities to client)
        var dtos = users.Select(u => new UserDto
        {
            UserId = u.UserId,
            Email = u.Email,
            FirstName = u.FirstName ?? "",
            LastName = u.LastName ?? "",
            Username = u.Email.Split('@').FirstOrDefault(),
            Gender = u.Gender?.ToString() ?? "",
            NationalId = u.NationalId ?? "",
            Phone = u.Phone ?? "",
            ProfilePictureUrl = u.ProfilePictureUrl,
            IsActive = u.IsActive,
            CreatedAt = u.CreatedAt
        }).ToList();

        return new PaginatedResult<UserDto>
        {
            Items = dtos,
            TotalCount = total,
            Page = page,
            PageSize = pageSize
        };
    }

    public async Task<UserDto?> GetByIdAsync(int id)
    {
        var user = await _context.Users
            .Include(u => u.UserWallet)  // Eager loading: include related wallet
            .FirstOrDefaultAsync(u => u.UserId == id);

        if (user == null) return null;

        return new UserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName ?? "",
            LastName = user.LastName ?? "",
            Username = user.Email.Split('@').FirstOrDefault(),
            Gender = user.Gender?.ToString() ?? "",
            NationalId = user.NationalId ?? "",
            Phone = user.Phone ?? "",
            ProfilePictureUrl = user.ProfilePictureUrl,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserDto?> GetByEmailAsync(string email)
    {
        var user = await _context.Users
            .Include(u => u.UserWallet)
            .FirstOrDefaultAsync(u => u.Email == email);

        if (user == null) return null;

        return new UserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName ?? "",
            LastName = user.LastName ?? "",
            Username = user.Email.Split('@').FirstOrDefault(),
            Gender = user.Gender?.ToString() ?? "",
            NationalId = user.NationalId ?? "",
            Phone = user.Phone ?? "",
            ProfilePictureUrl = user.ProfilePictureUrl,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<UserDto?> UpdateUserAsync(int id, UpdateUserRequest request)
    {
        // FindAsync: loads entity from DB (or from cache if already tracked)
        var user = await _context.Users.FindAsync(id);
        if (user == null) return null;

        // Only update fields that were actually provided (non-empty)
        // This is "partial update" - client doesn't need to send all fields
        if (!string.IsNullOrEmpty(request.FirstName))
            user.FirstName = request.FirstName;

        if (!string.IsNullOrEmpty(request.LastName))
            user.LastName = request.LastName;

        if (!string.IsNullOrEmpty(request.Phone))
            user.Phone = request.Phone;

        if (!string.IsNullOrEmpty(request.Gender))
            user.Gender = request.Gender.Equals("Male", StringComparison.OrdinalIgnoreCase);

        if (!string.IsNullOrEmpty(request.ProfilePictureUrl))
            user.ProfilePictureUrl = request.ProfilePictureUrl;

        await _context.SaveChangesAsync();  // UPDATE Users SET ... WHERE UserId = ...

        return new UserDto
        {
            UserId = user.UserId,
            Email = user.Email,
            FirstName = user.FirstName ?? "",
            LastName = user.LastName ?? "",
            Username = user.Email.Split('@').FirstOrDefault(),
            Gender = user.Gender?.ToString() ?? "",
            NationalId = user.NationalId ?? "",
            Phone = user.Phone ?? "",
            ProfilePictureUrl = user.ProfilePictureUrl,
            IsActive = user.IsActive,
            CreatedAt = user.CreatedAt
        };
    }

    // Soft delete: sets IsActive = false instead of deleting the row
    // This preserves data integrity (investments, projects stay linked)
    public async Task<bool> DeactivateUserAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        user.IsActive = false;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ActivateUserAsync(int id)
    {
        var user = await _context.Users.FindAsync(id);
        if (user == null) return false;

        user.IsActive = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<WalletDto?> GetWalletAsync(int userId)
    {
        var wallet = await _context.UserWallets.FirstOrDefaultAsync(w => w.UserId == userId);
        if (wallet == null) return null;

        return new WalletDto
        {
            WalletId = wallet.WalletId,
            UserId = wallet.UserId,
            Balance = wallet.Balance,
            LockedAmount = wallet.LockedAmount,
            // AvailableBalance is COMPUTED - not stored in DB
            // It's the money the user can actually use/spend
            AvailableBalance = wallet.Balance - wallet.LockedAmount,
            Status = wallet.Status ?? "Active"
        };
    }

    public async Task<InvestorProfileDto?> CreateInvestorProfileAsync(int userId, CreateInvestorProfileRequest request)
    {
        // Prevent duplicate profiles (one KYC per user)
        var existing = await _context.InvestorProfiles.AnyAsync(ip => ip.UserId == userId);
        if (existing) return null;

        var profile = new InvestorProfile
        {
            UserId = userId,
            Occupation = request.Occupation,
            AnnualIncome = request.AnnualIncome,
            IdDocumentUrl = request.IdDocumentUrl,
            KycStatus = "Pending",  // Starts as Pending - admin must approve
            CreatedAt = DateTime.UtcNow
        };

        _context.InvestorProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return new InvestorProfileDto
        {
            ProfileId = profile.ProfileId,
            UserId = profile.UserId,
            Occupation = profile.Occupation ?? "",
            AnnualIncome = profile.AnnualIncome ?? 0,
            IdDocumentUrl = profile.IdDocumentUrl ?? "",
            IsVerified = profile.KycStatus == "Approved"
        };
    }

    public async Task<EntrepreneurProfileDto?> CreateEntrepreneurProfileAsync(int userId, CreateEntrepreneurProfileRequest request)
    {
        var existing = await _context.EntrepreneurProfiles.AnyAsync(ep => ep.UserId == userId);
        if (existing) return null;

        var profile = new EntrepreneurProfile
        {
            UserId = userId,
            CompanyName = request.CompanyName,
            Bio = request.Bio,
            CreatedAt = DateTime.UtcNow
        };

        _context.EntrepreneurProfiles.Add(profile);
        await _context.SaveChangesAsync();

        return new EntrepreneurProfileDto
        {
            ProfileId = profile.ProfileId,
            UserId = profile.UserId,
            BankAccount = profile.BankAccount,
            BankName = profile.BankName,
            CompanyName = profile.CompanyName ?? "",
            Bio = profile.Bio ?? "",
            LinkedinUrl = request.LinkedinUrl,
            WebsiteUrl = request.WebsiteUrl,
            ExperienceYears = request.ExperienceYears,
            City = request.City,
            IsVerified = profile.IsVerified,
            IsBlocked = profile.IsBlocked,
            DeletedProjectsCount = profile.DeletedProjectsCount,
            EntrepreneurBlockedCount = profile.EntrepreneurBlockedCount
        };
    }

    public async Task<InvestorProfileDto?> GetInvestorProfileAsync(int userId)
    {
        var profile = await _context.InvestorProfiles.FirstOrDefaultAsync(ip => ip.UserId == userId);
        if (profile == null) return null;

        return new InvestorProfileDto
        {
            ProfileId = profile.ProfileId,
            UserId = profile.UserId,
            Occupation = profile.Occupation ?? "",
            AnnualIncome = profile.AnnualIncome ?? 0,
            IdDocumentUrl = profile.IdDocumentUrl ?? "",
            IsVerified = profile.KycStatus == "Approved"
        };
    }

    public async Task<EntrepreneurProfileDto?> GetEntrepreneurProfileAsync(int userId)
    {
        var profile = await _context.EntrepreneurProfiles.FirstOrDefaultAsync(ep => ep.UserId == userId);
        if (profile == null) return null;

        return new EntrepreneurProfileDto
        {
            ProfileId = profile.ProfileId,
            UserId = profile.UserId,
            CompanyName = profile.CompanyName ?? "",
            Bio = profile.Bio ?? "",
            IsVerified = profile.IsVerified,
            IsBlocked = profile.IsBlocked,
            DeletedProjectsCount = profile.DeletedProjectsCount,
            EntrepreneurBlockedCount = profile.EntrepreneurBlockedCount
        };
    }

}
