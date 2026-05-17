using System.ComponentModel.DataAnnotations;

namespace InvestlyFullAPI.DTOs.Auth;

// Data Transfer Object for user registration
// DTOs carry data between the client (frontend) and the server
// They often differ from Models to hide internal details (like PasswordHash)
public class RegisterDto
{
    // Required validation: the client MUST send this field
    // EmailAddress validation: checks that the value is a valid email format
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(8, ErrorMessage = "Password must be at least 8 characters")]
    [MaxLength(100)]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "First name is required")]
    [MaxLength(50)]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Last name is required")]
    [MaxLength(50)]
    public string LastName { get; set; } = string.Empty;

    public bool IsMale { get; set; }

    [MaxLength(50)]
    public string? NationalId { get; set; }

    public DateTime DateOfBirth { get; set; }

    [RegularExpression(@"^09\d{8}$", ErrorMessage = "Phone must be a 10-digit Libyan number starting with 09")]
    [MaxLength(10)]
    public string? Phone { get; set; }
}
