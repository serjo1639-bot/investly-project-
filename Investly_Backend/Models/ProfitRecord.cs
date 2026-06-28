// PROFIT RECORD - Tracks a project's profit over a period
// Used for the profit-sharing/dividend system.
// When a project generates profit, a ProfitRecord captures the period
// and the share that goes to investors (InvestorSharePct).
// From this, DividendPayouts are calculated per investor.

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("ProfitRecords")]
    public class ProfitRecord
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProfitRecordId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        [MaxLength(100)]
        public string PeriodLabel { get; set; }  // e.g., "Q1 2026", "January 2026"

        [Required]
        public DateTime PeriodStart { get; set; }

        [Required]
        public DateTime PeriodEnd { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal NetProfit { get; set; }  // Total profit for this period

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal InvestorSharePct { get; set; }  // % of profit that goes to investors

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";  // Pending | Distributed

        public string? Notes { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? ProcessedAt { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        // Navigation: one profit record can have many dividend payouts (one per investor)
        public ICollection<DividendPayout> DividendPayouts { get; set; } = new List<DividendPayout>();
    }
}
