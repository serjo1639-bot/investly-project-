// USER - Core identity model
// [Table("Users")] maps this class to the "Users" database table.
// Each property = a column in the table.
// Each instance of User = one row (one user account).
//
// ENTITY FRAMEWORK BASICS:
// - [Key] marks the primary key column
// - [Required] makes the column NOT NULL in the database
// - [MaxLength(X)] sets the column size (e.g., NVARCHAR(50))
// - [DatabaseGenerated] controls if the DB auto-generates the value
// - Navigation properties (like UserWallet) link related tables together

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("Users")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)] // Auto-increment (IDENTITY in SQL)
        public int UserId { get; set; }

        [Required]
        [MaxLength(100)]
        public string Email { get; set; }

        [Required]
        public string PasswordHash { get; set; }  // BCrypt hash, NOT plain text!

        [Required]
        [MaxLength(50)]
        public string FirstName { get; set; }

        [Required]
        [MaxLength(50)]
        public string LastName { get; set; }

        [MaxLength(30)]
        public string? Username { get; set; }

        // bool? (nullable bool) stores: true=Male, false=Female, null=not specified
        public bool? Gender { get; set; }

        [Required]
        [MaxLength(50)]
        public string NationalId { get; set; }

        public DateTime? BirthDate { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(500)]
        public string? ProfilePictureUrl { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        [Required]
        public bool IsActive { get; set; } = true;  // Soft-delete flag

        [Required]
        public bool EmailConfirmed { get; set; } = false;  // Email verification flag

        // ---- NAVIGATION PROPERTIES ----
        // These link related tables. EF Core uses them for JOINs.
        // ICollection<T> means "one-to-many" relationship.
        // The User can have: many investor profiles, many entrepreneur profiles,
        // one wallet, many notifications, one admin record, many roles.

        public ICollection<InvestorProfile> InvestorProfiles { get; set; } = new List<InvestorProfile>();
        public ICollection<EntrepreneurProfile> EntrepreneurProfiles { get; set; } = new List<EntrepreneurProfile>();
        public UserWallet? UserWallet { get; set; }            // One-to-one with UserWallet
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public Admin? Admin { get; set; }                      // One-to-one with Admin
        public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();  // Many-to-many with Role
    }
}
