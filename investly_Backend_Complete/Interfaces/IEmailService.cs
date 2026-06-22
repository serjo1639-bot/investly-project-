// IEmailService - Contract for sending transactional emails.
// Implementation currently uses Resend Email API, not SMTP.
// Keep this interface provider-neutral so we can change providers later
// without changing controllers/services that send emails.

namespace Investly_Backend.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, bool isHtml);
}
