namespace InvestlyFullAPI.DTOs.User;

// DTO for returning user data to the client
// Notice: NO PasswordHash field! We never expose passwords.
public class UserDto
{
    public int UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public bool IsMale { get; set; }
    public string? NationalId { get; set; }
    public DateTime DateOfBirth { get; set; }
    public string? Phone { get; set; }
    public string? ProfilePictureUrl { get; set; }
    public string? BankAccountNumber { get; set; }
    public bool IsActive { get; set; }
    public bool EmailConfirmed { get; set; }
    public DateTime CreatedAt { get; set; }

    // List of role names (not the full Role objects) for simplicity
    public List<string> Roles { get; set; } = new List<string>();
}
