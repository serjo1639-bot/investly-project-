// PROJECT ESCROW WALLET - Holds investor funds for a specific project
// When a project is approved, an escrow wallet is created.
// When investments are confirmed, funds go HERE (not directly to the entrepreneur).
// Funds are released when the project reaches its goal or hits milestones.
// This protects investors: the entrepreneur can't run away with the money.

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("ProjectEscrowWallets")]
    public class ProjectEscrowWallet
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int EscrowWalletId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Balance { get; set; } = 0;

        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal ReleasedAmount { get; set; } = 0;

        [Required]
        [MaxLength(20)]
        public string Status { get; set; } = "Pending";  // Pending | Active | Released | Closed

        [Required]
        public DateTime CreatedAt { get; set; }

        [Required]
        public DateTime UpdatedAt { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }

        public ICollection<EscrowTransaction> EscrowTransactions { get; set; } = new List<EscrowTransaction>();
    }
}
