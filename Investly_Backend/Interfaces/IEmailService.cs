// IEmailService - Contract for sending emails
// Currently registered but NOT wired to any business logic.
// To enable email notifications:
// 1. Update appsettings.json Email section with real SMTP credentials
// 2. Inject IEmailService into AuthService (for password reset emails)
// 3. Call SendEmailAsync when needed

namespace Investly_Backend.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string to, string subject, string body, bool isHtml);
}
