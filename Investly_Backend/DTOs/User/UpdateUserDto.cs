using System.ComponentModel.DataAnnotations;

namespace InvestlyFullAPI.DTOs.User;

// DTO for updating user profile info
// All fields are optional - only send what you want to change
public class UpdateUserDto
{
    [MaxLength(50)]
    public string? FirstName { get; set; }

    [MaxLength(50)]
    public string? LastName { get; set; }

    public bool? IsMale { get; set; }

    [MaxLength(50)]
    public string? NationalId { get; set; }

    public DateTime? DateOfBirth { get; set; }

    [RegularExpression(@"^09\d{8}$", ErrorMessage = "Phone must be a 10-digit Libyan number starting with 09")]
    [MaxLength(10)]
    public string? Phone { get; set; }

    [MaxLength(500)]
    public string? ProfilePictureUrl { get; set; }

    [MaxLength(50)]
    public string? BankAccountNumber { get; set; }
}
