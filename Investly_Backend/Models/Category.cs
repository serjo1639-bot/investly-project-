// CATEGORY - Project categories (e.g., Tech, Food, Healthcare)
// Supports hierarchy: a category can have a PARENT category and CHILDREN.
// Example: Technology -> Mobile Apps -> iOS
// ParentId references another Category (self-referencing FK).

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("Categories")]
    public class Category
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int CategoryId { get; set; }

        public int? ParentId { get; set; }  // Self-referencing FK for hierarchy

        [Required]
        [MaxLength(50)]
        public string Name { get; set; }

        public string? Description { get; set; }

        [MaxLength(30)]
        public string? TechCode { get; set; }  // Internal code for frontend mapping

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("ParentId")]
        public Category? Parent { get; set; }

        // Self-referencing: one category can have many child categories
        public ICollection<Category> Children { get; set; } = new List<Category>();
        public ICollection<Project> Projects { get; set; } = new List<Project>();
    }
}
