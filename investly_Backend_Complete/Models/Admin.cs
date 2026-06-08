// ADMIN - Admin-specific data for users with Admin role
// One-to-one with User: each admin record belongs to one user.
// This stores admin permissions and tracking info (who created this admin).

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("Admins")]
    public class Admin
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AdminId { get; set; }

        [Required]
        public int UserId { get; set; }

        public string? Permissions { get; set; }  // JSON string of admin permissions

        [Required]
        public bool IsSuperAdmin { get; set; } = false;  // Super admin has all permissions

        public DateTime? LastLogin { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public int? CreatedBy { get; set; }  // Which admin created this one (self-referencing FK)

        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("CreatedBy")]
        public Admin? Creator { get; set; }

        // Navigation: this admin can create other admins
        public ICollection<Admin> CreatedAdmins { get; set; } = new List<Admin>();
    }
}
