using INK.ERP.Domain.Common;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.Events.Security;

namespace INK.ERP.Domain.Entities.Security;

public sealed class SecurityIncident : AuditableEntity
{
    public IncidentType Type { get; private set; }
    public IncidentSeverity Severity { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public Guid? UserId { get; private set; }
    public string? IpAddress { get; private set; }
    public bool IsResolved { get; private set; } = false;
    public bool IsEscalated { get; private set; } = false;
    public string? ResolutionNotes { get; private set; }
    public DateTime? ResolvedAtUtc { get; private set; }

    private SecurityIncident() { } // EF Core

    public SecurityIncident(IncidentType type, IncidentSeverity severity, string description, Guid? userId = null, string? ipAddress = null)
    {
        Type = type;
        Severity = severity;
        Description = string.IsNullOrWhiteSpace(description) ? "Security Incident" : description;
        UserId = userId;
        IpAddress = ipAddress;
        IsResolved = false;

        // Invariant: High/Critical severity incidents automatically escalate
        if (severity == IncidentSeverity.High || severity == IncidentSeverity.Critical)
        {
            IsEscalated = true;
        }

        AddDomainEvent(new SecurityIncidentRaisedEvent(Id, Type, Severity));
    }

    public static SecurityIncident Raise(IncidentType type, IncidentSeverity severity, string description, Guid? userId = null, string? ipAddress = null)
    {
        return new SecurityIncident(type, severity, description, userId, ipAddress);
    }

    public void Escalate(string reason)
    {
        if (IsResolved)
            throw new InvalidOperationException("Cannot escalate a resolved security incident.");

        IsEscalated = true;
        Severity = IncidentSeverity.Critical;
        Description += $" [Escalated: {reason}]";
        LastModifiedAtUtc = DateTime.UtcNow;
    }

    public void Resolve(string resolutionNotes)
    {
        IsResolved = true;
        ResolutionNotes = resolutionNotes;
        ResolvedAtUtc = DateTime.UtcNow;
        LastModifiedAtUtc = DateTime.UtcNow;
    }

    public void Close()
    {
        IsResolved = true;
        LastModifiedAtUtc = DateTime.UtcNow;
    }
}
