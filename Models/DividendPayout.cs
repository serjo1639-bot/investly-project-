// DIVIDEND PAYOUT - Per-investor profit sharing
// When a project records a profit, each investor gets a share based on
// their investment amount. This model tracks individual payouts.
// Part of the profit/dividend distribution system.

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("DividendPayouts")]
    public class DividendPayout
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PayoutId { get; set; }

        [Required]
        public int ProfitRecordId { get; set; }  // FK -> ProfitRecord

        [Required]
        public int InvestmentId { get; set; }  // FK -> Investment (which investor gets paid)

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }  // Amount this investor receives

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";  // Pending | Paid

        public DateTime? PaidAt { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("ProfitRecordId")]
        public ProfitRecord ProfitRecord { get; set; }

        [ForeignKey("InvestmentId")]
        public Investment Investment { get; set; }
    }
}
