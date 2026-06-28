// ROLE - Defines user roles for authorization
// ASP.NET uses Role-Based Access Control (RBAC).
// Roles are assigned to Users through the UserRole join table.
// [Authorize(Roles = "Admin")] checks if the user has this role.

using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("Roles")]
    public class Role
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int RoleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; }  // e.g., "User", "Investor", "Entrepreneur", "Admin"

        // Navigation: one Role can be assigned to many users
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    }
}
