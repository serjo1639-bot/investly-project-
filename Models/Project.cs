// PROJECT - The core entity of the platform
// An entrepreneur creates a project, sets a funding goal, and investors
// contribute money. The project lifecycle:
//   Draft -> Pending -> Approved -> (funding phase) -> Funded/Closed
// Each project has an associated escrow wallet to hold investor funds safely.

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("Projects")]
    public class Project
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProjectId { get; set; }

        [Required]
        public int CreatorProfileId { get; set; }  // FK -> EntrepreneurProfile

        public int? CategoryId { get; set; }  // FK -> Category

        [MaxLength(50)]
        public string? Reference { get; set; }  // Unique project reference number

        [Required]
        [MaxLength(150)]
        public string Title { get; set; } = string.Empty;

        [Required]
        public string Description { get; set; } 

        [MaxLength(100)]
        public string? City { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal FundingGoal { get; set; }  // Target amount to raise

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal MinInvestment { get; set; } = 10;

        [Column(TypeName = "decimal(18,2)")]
        public decimal? MaxInvestment { get; set; }

        [Column(TypeName = "decimal(7,4)")]  // 7 digits, 4 after decimal (e.g., 12.5000 = 12.5%)
        public decimal? EquityOffered { get; set; }  // Percentage of company offered

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal CurrentAmount { get; set; } = 0;  // Total money raised so far

        [Required]
        public DateTime StartDate { get; set; }

        [Required]
        public DateTime EndDate { get; set; }

        public int? Duration { get; set; }  // Duration in days

        public int? TeamSize { get; set; }

        [MaxLength(500)]
        public string? ImageUrl { get; set; }

        [Required]
        public int ViewsCount { get; set; } = 0;

        [Required]
        public bool HasPhases { get; set; } = true;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Draft";  // Draft | Pending | Approved | Rejected | Funded | Closed

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        [Required]
        public bool IsDeleted { get; set; } = false;  // Dashboard/admin soft-delete flag

        // Navigation properties - linking related entities
        [ForeignKey("CreatorProfileId")]
        public EntrepreneurProfile CreatorProfile { get; set; }

        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }

        public ProjectEscrowWallet? EscrowWallet { get; set; }  // One-to-one
        public ICollection<Investment> Investments { get; set; } = new List<Investment>();
        public ICollection<ProjectProof> ProjectProofs { get; set; } = new List<ProjectProof>();
        public ICollection<ProjectUpdate> ProjectUpdates { get; set; } = new List<ProjectUpdate>();
        public ICollection<ProjectMedia> ProjectMedia { get; set; } = new List<ProjectMedia>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}

