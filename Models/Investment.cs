// INVESTMENT - Links an investor to a project with an amount
// When an investor decides to fund a project:
//   1. Create investment (Pending) -> money is LOCKED in wallet
//   2. Confirm investment -> money is PERMANENTLY taken from wallet
//   3. Cancel investment -> money is RETURNED to wallet
//
// Think of it like a hold on a credit card - the money is reserved
// but not charged until confirmation.

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("Investments")]
    public class Investment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int InvestmentId { get; set; }

        [Required]
        public int InvestorProfileId { get; set; }  // FK -> InvestorProfile

        [Required]
        public int ProjectId { get; set; }  // FK -> Project

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";  // Pending | Confirmed | Cancelled

        [Column(TypeName = "decimal(9,6)")]  // 9 digits, 6 after decimal
        public decimal? FundingPercentage { get; set; }  // % of funding goal this investment covers

        [Column(TypeName = "decimal(9,6)")]
        public decimal? EquityPercentage { get; set; }  // % equity this investor gets

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ConfirmedAt { get; set; }

        [ForeignKey("InvestorProfileId")]
        public InvestorProfile InvestorProfile { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        // Navigation: one investment can have dividend payouts and escrow transactions
        public ICollection<DividendPayout> DividendPayouts { get; set; } = new List<DividendPayout>();
        public ICollection<EscrowTransaction> EscrowTransactions { get; set; } = new List<EscrowTransaction>();
    }
}
