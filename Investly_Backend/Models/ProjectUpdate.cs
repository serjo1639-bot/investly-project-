// PROJECT UPDATE - Progress updates from entrepreneur to investors
// Entrepreneurs can post updates about their project's progress.
// This builds transparency and trust with the investor community.

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("ProjectUpdates")]
    public class ProjectUpdate
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UpdateId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        [MaxLength(200)]
        public string Title { get; set; }

        [Required]
        public string Content { get; set; }

        [MaxLength(500)]
        public string? MediaUrl { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }
    }
}
