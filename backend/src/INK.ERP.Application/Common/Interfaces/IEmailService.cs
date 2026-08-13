using System.Threading;
using System.Threading.Tasks;

namespace INK.ERP.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(string toEmail, string displayName, string subject, string bodyHtml, CancellationToken ct = default);
}
