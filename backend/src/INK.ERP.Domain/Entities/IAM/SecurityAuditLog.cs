using System;
using INK.ERP.Domain.Common;

namespace INK.ERP.Domain.Entities.IAM;

public sealed class SecurityAuditLog : AuditableEntity
{
    public string Action { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string PerformedBy { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string IpAddress { get; set; } = string.Empty;
    public string CorrelationId { get; set; } = string.Empty;
    public string RequestId { get; set; } = string.Empty;
    public string? OldValues { get; set; } // JSON
    public string? NewValues { get; set; } // JSON

    // Extended Audit Log Attributes
    public Guid? UserId { get; set; }
    public string? Username { get; set; }
    public string? EmployeeId { get; set; }
    public string? EventType { get; set; }
    public string? Module { get; set; }
    public string? Description { get; set; }
    public bool Success { get; set; } = true;
    public string? FailureReason { get; set; }
    public string? Device { get; set; }
    public string? Browser { get; set; }
    public string? OperatingSystem { get; set; }
    public string? Location { get; set; }
    public string? Endpoint { get; set; }
    public string? HttpMethod { get; set; }
    public long? ProcessingTimeMs { get; set; }
}
