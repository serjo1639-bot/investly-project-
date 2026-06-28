// ============================================================
// EMAIL SERVICE - Sends emails through Resend
// ============================================================
// Uses the Resend Email API to send emails.
// Configured in appsettings.json under the "Email" section.
//
// Email is separate from the in-app Notifications table:
// - Notifications: stored in DB and shown inside the app/dashboard.
// - Email: sent through Resend to the user's email inbox.
//
// This does NOT require Firebase. Firebase is only for mobile push
// notifications, not email.
//
// Current use:
// - AdminController exposes POST /api/admin/email/test to verify Resend settings.
//
// To send automatic emails later:
// 1. Inject IEmailService into the service that owns the business event.
// 2. Call SendEmailAsync() after the database change succeeds.
// 3. Keep the Resend API key in appsettings.Development.json, user secrets,
//    or environment variables instead of committing real secrets.
// ============================================================

using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Investly_Backend.Interfaces;
namespace Investly_Backend.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _config;
    private readonly ILogger<EmailService> _logger;
    private readonly HttpClient _httpClient;

    public EmailService(IConfiguration config, ILogger<EmailService> logger, HttpClient httpClient)
    {
        _config = config;
        _logger = logger;
        _httpClient = httpClient;
    }

    public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = false)
    {
        // Read Resend settings from configuration. appsettings.json contains
        // placeholders; real values should come from appsettings.Development.json,
        // user secrets, or environment variables.
        var apiKey = _config["Email:ResendApiKey"];
        var fromEmail = _config["Email:FromEmail"];
        var fromName = _config["Email:FromName"] ?? "Investly";
        var apiUrl = _config["Email:ResendApiUrl"] ?? "https://api.resend.com/emails";

        if (string.IsNullOrWhiteSpace(apiKey) ||
            string.IsNullOrWhiteSpace(fromEmail) ||
            apiKey.Contains("your-resend", StringComparison.OrdinalIgnoreCase) ||
            fromEmail.Contains("your-domain", StringComparison.OrdinalIgnoreCase))
        {
            _logger.LogError("Resend email settings are missing or still contain placeholders.");
            throw new InvalidOperationException("Resend email settings are not configured. Update Email:ResendApiKey and Email:FromEmail in appsettings.Development.json, user secrets, or environment variables.");
        }

        // Resend expects a JSON payload:
        // from: "Name <sender@domain.com>"
        // to: an array of recipient email addresses
        // subject: email subject
        // html/text: message body
        var payload = new Dictionary<string, object?>
        {
            ["from"] = $"{fromName} <{fromEmail}>",
            ["to"] = new[] { to },
            ["subject"] = subject,
            [isHtml ? "html" : "text"] = body
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, apiUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        try
        {
            using var response = await _httpClient.SendAsync(request);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Resend email failed with status {StatusCode}: {Body}", response.StatusCode, responseBody);
                throw new InvalidOperationException($"Resend email failed with status {(int)response.StatusCode}.");
            }

            _logger.LogInformation("Resend email accepted for {Email}", to);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email through Resend to {Email}", to);
            throw;
        }
    }
}
