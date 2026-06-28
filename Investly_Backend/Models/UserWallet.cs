// USER WALLET - Each user's financial account in the system
// One-to-one with User: every user gets exactly ONE wallet.
// The wallet tracks:
//   - Balance: total funds in the account
//   - LockedAmount: funds reserved for pending investments/withdrawals
//   - AvailableBalance: Balance - LockedAmount (computed, not stored)

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("UserWallets")]
    public class UserWallet
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int WalletId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal LockedAmount { get; set; } = 0;  // Funds held for pending transactions

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Active";  // Active | Frozen | Closed

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        // Navigation: one wallet has many transactions and withdrawal requests
        public ICollection<WalletTransaction> WalletTransactions { get; set; } = new List<WalletTransaction>();
        public ICollection<WithdrawalRequest> WithdrawalRequests { get; set; } = new List<WithdrawalRequest>();
    }
}
