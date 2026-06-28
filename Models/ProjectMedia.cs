// PROJECT MEDIA - Images and videos for a project
// Projects can have multiple media files (gallery).
// One can be marked as Primary (the cover image).
// SortOrder controls display order.

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("ProjectMedia")]
    public class ProjectMedia
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int MediaId { get; set; }

        [Required]
        public int ProjectId { get; set; }

        [Required]
        [MaxLength(500)]
        public string MediaUrl { get; set; }  // File path on disk

        [Required]
        [MaxLength(20)]
        public string MediaType { get; set; }  // Image | Video | Document

        [Required]
        public bool IsPrimary { get; set; } = false;  // Cover image?

        [MaxLength(200)]
        public string? AltText { get; set; }  // Accessibility text

        [Required]
        public int SortOrder { get; set; } = 0;

        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("ProjectId")]
        public Project Project { get; set; }
    }
}
