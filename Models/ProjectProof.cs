// PROJECT PROOF - Verification documents for projects
// Entrepreneurs can upload proof documents (business registration,
// licenses, etc.) to build trust with investors.

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("ProjectProofs")]
    public class ProjectProof
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProofId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; }  // e.g., "BusinessLicense", "TaxRecord", "LegalDoc"

        [Required]
        [MaxLength(150)]
        public string Title { get; set; }

        [MaxLength(500)]
        public string? FileUrl { get; set; }

        [Required]
        public bool IsVerified { get; set; } = false;  // Admin verified?

        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }
    }
}
