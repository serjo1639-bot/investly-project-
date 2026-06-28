// ESCROW TRANSACTION - Audit log for ALL escrow wallet movements
// Tracks every time money goes IN (from confirmed investments) or
// OUT (released to entrepreneur, refunded to investors).

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("EscrowTransactions")]
    public class EscrowTransaction
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int EscrowTransactionId { get; set; }

        [Required]
        public int EscrowWalletId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Type { get; set; }  // Investment | Release | Refund

        [Required]
        [MaxLength(10)]
        public string Direction { get; set; }  // Credit (funds in) | Debit (funds out)

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; }  // Pending | Completed

        public int? RelatedInvestmentId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        [ForeignKey("EscrowWalletId")]
        public ProjectEscrowWallet EscrowWallet { get; set; }

        [ForeignKey("RelatedInvestmentId")]
        public Investment? RelatedInvestment { get; set; }
    }
}
