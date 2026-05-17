using FluentEmail.Core;
using InvestlyFullAPI.Interfaces;

namespace InvestlyFullAPI.Services;

// EmailService sends emails using FluentEmail library
// FluentEmail.Smtp is configured in Program.cs with SMTP settings
public class EmailService : IEmailService
{
    private readonly IFluentEmail _fluentEmail;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IFluentEmail fluentEmail, ILogger<EmailService> logger)
    {
        _fluentEmail = fluentEmail;
        _logger = logger;
    }

    // Send an email to one recipient
    public async Task SendEmailAsync(string to, string subject, string body)
    {
        try
        {
            var result = await _fluentEmail
                .To(to)                  // Recipient email address
                .Subject(subject)        // Email subject line
                .Body(body, true)        // Body content (true = is HTML)
                .SendAsync();

            if (!result.Successful)
            {
                // Log any errors from the email sending
                foreach (var error in result.ErrorMessages)
                {
                    _logger.LogError("Email error: {Error}", error);
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email to {Recipient}", to);
        }
    }
}
