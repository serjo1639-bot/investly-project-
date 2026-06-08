// INVESTOR PROFILE - KYC (Know Your Customer) data for investors
// Each user can have ONE investor profile.
// KYC is a regulatory requirement: we need to verify investor identity
// before they can invest. Admin approves/rejects KYC submissions.

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("InvestorProfiles")]
    public class InvestorProfile
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProfileId { get; set; }

        [Required]
        public int UserId { get; set; }  // Foreign key to User

        [MaxLength(100)]
        public string? Occupation { get; set; }

        [Column(TypeName = "decimal(18,2)")]  // decimal(18,2) = 18 total digits, 2 after decimal
        public decimal? AnnualIncome { get; set; }

        [MaxLength(500)]
        public string? IdDocumentUrl { get; set; }  // Link to uploaded ID document

        [Required]
        [MaxLength(20)]
        public string KycStatus { get; set; } = "Pending";  // Pending | Approved | Rejected

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        // Navigation: one investor can have many investments
        public ICollection<Investment> Investments { get; set; } = new List<Investment>();
    }
}
