// ============================================================
// USER DTOS - User/profile-related request/response objects
// ============================================================

namespace Investly_Backend.DTOs;

// Basic user info (admin user list, auth current user)
public class UserDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

// Editable profile fields (what user can update)
public class UserProfileDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}

// PUT /api/users/{id} body
public class UpdateUserRequest
{
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string? ProfilePictureUrl { get; set; }
}

// POST /api/users/investor-profile body (KYC submission)
public class CreateInvestorProfileRequest
{
    public string Occupation { get; set; } = string.Empty;
    public decimal AnnualIncome { get; set; }
    public string IdDocumentUrl { get; set; } = string.Empty;
}

// POST /api/users/entrepreneur-profile body
public class CreateEntrepreneurProfileRequest
{
    public string BankAccount { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string TaxNumber { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string LinkedinUrl { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string City { get; set; } = string.Empty;
}

// Investor KYC profile (response)
public class InvestorProfileDto
{
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public string Occupation { get; set; } = string.Empty;
    public decimal AnnualIncome { get; set; }
    public string IdDocumentUrl { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
}

// Entrepreneur profile (response)
public class EntrepreneurProfileDto
{
    public int ProfileId { get; set; }
    public int UserId { get; set; }
    public string BankAccount { get; set; } = string.Empty;
    public string BankName { get; set; } = string.Empty;
    public string TaxNumber { get; set; } = string.Empty;
    public string CompanyName { get; set; } = string.Empty;
    public string Bio { get; set; } = string.Empty;
    public string LinkedinUrl { get; set; } = string.Empty;
    public string WebsiteUrl { get; set; } = string.Empty;
    public int ExperienceYears { get; set; }
    public string City { get; set; } = string.Empty;
    public bool IsVerified { get; set; }
}

// Wallet info (nested inside user responses)
public class WalletDto
{
    public int WalletId { get; set; }
    public int UserId { get; set; }
    public decimal Balance { get; set; }
    public decimal LockedAmount { get; set; }
    public decimal AvailableBalance { get; set; }  // Computed: Balance - LockedAmount
    public string Status { get; set; } = string.Empty;
}

// Generic paginated wrapper used by many endpoints
public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}
