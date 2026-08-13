using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Services;

public sealed class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;

    public EmailService(
        ILogger<EmailService> logger,
        IConfiguration configuration,
        IHostEnvironment environment)
    {
        _logger = logger;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task SendEmailAsync(string toEmail, string displayName, string subject, string bodyHtml, CancellationToken ct = default)
    {
        var smtpHost = _configuration["Smtp:Host"];
        var smtpPortString = _configuration["Smtp:Port"];

        if (string.IsNullOrWhiteSpace(smtpHost) || _environment.IsDevelopment())
        {
            _logger.LogInformation(
                "==========================================================\n" +
                "[EMAIL DISPATCHER - DEV LOG]\n" +
                "Recipient: {DisplayName} <{ToEmail}>\n" +
                "Subject: {Subject}\n" +
                "==========================================================",
                displayName, toEmail, subject);

            if (string.IsNullOrWhiteSpace(smtpHost))
            {
                return;
            }
        }

        try
        {
            var smtpPort = int.TryParse(smtpPortString, out var p) ? p : 587;
            var smtpUser = _configuration["Smtp:Username"];
            var smtpPass = _configuration["Smtp:Password"];
            var fromEmail = _configuration["Smtp:FromEmail"] ?? "no-reply@inkerp.com";
            var fromName = _configuration["Smtp:FromName"] ?? "INK ERP System";

            using var message = new MailMessage();
            message.From = new MailAddress(fromEmail, fromName);
            message.To.Add(new MailAddress(toEmail, displayName));
            message.Subject = subject;
            message.IsBodyHtml = true;
            message.Body = bodyHtml;

            using var client = new SmtpClient(smtpHost, smtpPort)
            {
                Credentials = new NetworkCredential(smtpUser, smtpPass),
                EnableSsl = true
            };

            await client.SendMailAsync(message, ct);
            _logger.LogInformation("Email successfully dispatched to {ToEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send email via SMTP to {ToEmail}", toEmail);
        }
    }
}
