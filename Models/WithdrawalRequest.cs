// WITHDRAWAL REQUEST - When a user wants to cash out their wallet
// Withdrawals go through admin approval to prevent fraud.
// When created: funds are LOCKED in the wallet (can't be used elsewhere).
// When approved: locked amount is permanently deducted.
// When rejected: locked amount is returned to available balance.

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("WithdrawalRequests")]
    public class WithdrawalRequest
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int WithdrawalId { get; set; }

        [Required]
        public int WalletId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        [MaxLength(100)]
        public string? BankName { get; set; }

        [MaxLength(50)]
        public string? BankAccount { get; set; }

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";  // Pending | Completed | Rejected

        [MaxLength(500)]
        public string? RejectionReason { get; set; }

        public DateTime? ProcessedAt { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("WalletId")]
        public UserWallet Wallet { get; set; }
    }
}
