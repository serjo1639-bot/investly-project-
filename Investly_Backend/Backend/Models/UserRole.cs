using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace InvestlyFullAPI.Models;

// Join table for the many-to-many relationship between Users and Roles
// One user can have many roles, and one role can belong to many users
public class UserRole
{
    // Foreign key to the User table
    public int UserId { get; set; }

    // Foreign key to the Role table
    public int RoleId { get; set; }

    // Timestamp of when this role was assigned to the user
    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

    // Navigation: the actual User object this link points to
    [ForeignKey(nameof(UserId))]
    public User User { get; set; } = null!;

    // Navigation: the actual Role object this link points to
    [ForeignKey(nameof(RoleId))]
    public Role Role { get; set; } = null!;
}
