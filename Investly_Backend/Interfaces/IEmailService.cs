namespace InvestlyFullAPI.Interfaces;

// Handles sending emails (notifications, confirmations, etc.)
public interface IEmailService
{
    // Send a simple email to one recipient
    Task SendEmailAsync(string to, string subject, string body);
}
