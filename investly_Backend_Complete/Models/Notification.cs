// NOTIFICATION - User notifications (bilingual: Arabic + English)
// The platform supports both Arabic and English notifications.
// Each notification has Title and Message in both languages.
// RelatedProjectId / RelatedInvestmentId link notifications to
// specific entities so the frontend can navigate to them.

using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Investly_Backend.Models
{
    [Table("Notifications")]
    public class Notification
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int NotificationId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        [MaxLength(20)]
        public string Type { get; set; }  // e.g., "ProjectApproved", "InvestmentConfirmed", "KycApproved"

        [Required]
        [MaxLength(200)]
        public string TitleAr { get; set; }  // Arabic title

        [Required]
        [MaxLength(200)]
        public string TitleEn { get; set; }  // English title

        [Required]
        [MaxLength(500)]
        public string MessageAr { get; set; }  // Arabic message

        [Required]
        [MaxLength(500)]
        public string MessageEn { get; set; }  // English message

        [Required]
        public bool IsRead { get; set; } = false;

        public int? RelatedProjectId { get; set; }
        public int? RelatedInvestmentId { get; set; }

        [Required]
        public DateTime CreatedAt { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        [ForeignKey("RelatedProjectId")]
        public Project? RelatedProject { get; set; }

        [ForeignKey("RelatedInvestmentId")]
        public Investment? RelatedInvestment { get; set; }
    }
}
