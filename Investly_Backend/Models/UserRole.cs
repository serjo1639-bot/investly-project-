// USER ROLE - JOIN TABLE for Many-to-Many between User and Role
// In relational databases, many-to-many relationships need a JOIN table.
// A User can have MANY Roles, and a Role can belong to MANY Users.
// UserRole is that bridge: each row links one user to one role.
//
// Why not just a RoleId on the User table?
// Because a user can have MULTIPLE roles (e.g., "Investor" AND "Entrepreneur").

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("UserRoles")]
    public class UserRole
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int RoleId { get; set; }

        [Required]
        public DateTime AssignedAt { get; set; }

        // Navigation properties to the related User and Role
        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("RoleId")]
        public Role Role { get; set; }
    }
}
