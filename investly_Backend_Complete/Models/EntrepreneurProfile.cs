// ENTREPRENEUR PROFILE - Business info for project creators
// Users who want to create projects must first create an entrepreneur profile
// with their bank details and business information.
// This is separate from InvestorProfile because a user could be both!

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("EntrepreneurProfiles")]
    public class EntrepreneurProfile
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProfileId { get; set; }

        [Required]
        public int UserId { get; set; }  // FK to User

        [Required]
        [MaxLength(50)]
        public string BankAccount { get; set; }  // Where to send funded money

        [Required]
        [MaxLength(50)]
        public string BankName { get; set; }

        [Required]
        [MaxLength(50)]
        public string BankAccountName { get; set; }

        [MaxLength(150)]
        public string? CompanyName { get; set; }

        public string? Bio { get; set; }

        [MaxLength(500)]
        public string? LinkedinUrl { get; set; }

        [MaxLength(500)]
        public string? WebsiteUrl { get; set; }

        [Range(0, 50)]
        public int? ExperienceYears { get; set; }

        [MaxLength(100)]
        public string? City { get; set; }

        [Required]
        public bool IsVerified { get; set; } = false;  // Admin verification

        [Required]
        public bool IsBlocked { get; set; } = false;

        // Counts current delete violations since the last admin unblock.
        [Required]
        public int DeletedProjectsCount { get; set; } = 0;

        // Lifetime count of how many times this entrepreneur was blocked.
        [Required]
        public int EntrepreneurBlockedCount { get; set; } = 0;

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        // Navigation: one entrepreneur can have MANY projects
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}
