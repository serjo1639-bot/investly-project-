// ============================================================
// EMAIL SERVICE - Sends emails via SMTP
// ============================================================
// Uses SMTP (Simple Mail Transfer Protocol) to send emails.
// Configured in appsettings.json under the "Email" section.
//
// NOTE: This service is registered but NOT currently wired to
// any business logic. To enable email sending:
// 1. Update SMTP credentials in appsettings.json
// 2. Inject IEmailService into the service that needs it
// 3. Call SendEmailAsync() when events occur
// ============================================================

using System.Net;
using System.Net.Mail;
using Investly_Backend.Interfaces;
namespace Investly_Backend.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;

    public EmailService(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = false)
    {
        // Read SMTP settings from appsettings.json
        var smtpHost = _config["Email:SmtpHost"];
        var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
        var smtpUser = _config["Email:SmtpUser"];
        var smtpPassword = _config["Email:SmtpPassword"];
        var fromEmail = _config["Email:FromEmail"];

        // SmtpClient handles the actual TCP connection to the mail server
        using var client = new SmtpClient(smtpHost, smtpPort)
        {
            Credentials = new NetworkCredential(smtpUser, smtpPassword),
            EnableSsl = true  // Gmail requires SSL
        };

        // MailMessage represents a single email
        var message = new MailMessage();
        message.From = new MailAddress(fromEmail ?? "", "Investly");
        message.To.Add(to);
        message.Subject = subject;
        message.Body = body;
        message.IsBodyHtml = isHtml;

        await client.SendMailAsync(message);
    }
}
