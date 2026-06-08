// WALLET TRANSACTION - An audit log of ALL money movement
// Every deposit, withdrawal, investment, and refund creates a transaction.
// This is the LEDGER: it records every financial event for transparency.
// "Direction" tells us if money went in (Credit) or out (Debit).

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("WalletTransactions")]
    public class WalletTransaction
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TransactionId { get; set; }

        [Required]
        public int WalletId { get; set; }  // FK to UserWallet

        [Required]
        [MaxLength(30)]
        public string Type { get; set; }  // Deposit | Withdraw | Investment | Refund | WithdrawalRejected

        [Required]
        [MaxLength(10)]
        public string Direction { get; set; }  // Credit (money in) | Debit (money out)

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; }  // Pending | Completed | Failed

        [MaxLength(100)]
        public string? ReferenceNo { get; set; }  // Link to related entity (e.g., InvestmentId)

        [MaxLength(500)]
        public string? Description { get; set; }

        public int? RelatedProjectId { get; set; }    // FK to Project (optional)
        public int? RelatedInvestmentId { get; set; }  // FK to Investment (optional)

        [Required]
        public DateTime CreatedAt { get; set; }

        public DateTime? CompletedAt { get; set; }

        [ForeignKey("WalletId")]
        public UserWallet Wallet { get; set; }

        [ForeignKey("RelatedProjectId")]
        public Project? RelatedProject { get; set; }

        [ForeignKey("RelatedInvestmentId")]
        public Investment? RelatedInvestment { get; set; }
    }
}
