using System;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Domain.Entities.Security;

public sealed class TemporaryAuthorizationPin : AuditableEntity
{
    public Guid CompanyId { get; set; }
    public Guid? EmployeeId { get; set; }
    public string PinHash { get; set; } = string.Empty;
    public string Purpose { get; set; } = "SalesLogin";
    public string GeneratedByUserId { get; set; } = string.Empty;
    public string GeneratedByUserName { get; set; } = string.Empty;
    public DateTime ExpiresAtUtc { get; set; }
    public bool IsUsed { get; set; } = false;
    public DateTime? UsedAtUtc { get; set; }
    public string? UsedByUserId { get; set; }
    public string? IpAddress { get; set; }

    // Navigation Properties
    public Company? Company { get; set; }
    public Employee? Employee { get; set; }
}
