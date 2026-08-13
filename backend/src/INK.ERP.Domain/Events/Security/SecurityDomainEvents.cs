using INK.ERP.Domain.Common;
using INK.ERP.Domain.Enums.Security;

namespace INK.ERP.Domain.Events.Security;

public sealed class FaceEnrolledEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public Guid ProfileId { get; }
    public int TemplateVersion { get; }

    public FaceEnrolledEvent(Guid userId, Guid profileId, int templateVersion)
    {
        UserId = userId;
        ProfileId = profileId;
        TemplateVersion = templateVersion;
    }
}

public sealed class FaceVerifiedEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public float MatchScore { get; }

    public FaceVerifiedEvent(Guid userId, float matchScore)
    {
        UserId = userId;
        MatchScore = matchScore;
    }
}

public sealed class FaceVerificationFailedEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public string Reason { get; }

    public FaceVerificationFailedEvent(Guid userId, string reason)
    {
        UserId = userId;
        Reason = reason;
    }
}

public sealed class FaceTemplateUpdatedEvent : BaseDomainEvent
{
    public Guid ProfileId { get; }
    public int NewVersion { get; }

    public FaceTemplateUpdatedEvent(Guid profileId, int newVersion)
    {
        ProfileId = profileId;
        NewVersion = newVersion;
    }
}

public sealed class SecurityIncidentRaisedEvent : BaseDomainEvent
{
    public Guid IncidentId { get; }
    public IncidentType Type { get; }
    public IncidentSeverity Severity { get; }

    public SecurityIncidentRaisedEvent(Guid incidentId, IncidentType type, IncidentSeverity severity)
    {
        IncidentId = incidentId;
        Type = type;
        Severity = severity;
    }
}

public sealed class DeviceApprovedEvent : BaseDomainEvent
{
    public Guid DeviceId { get; }
    public Guid UserId { get; }

    public DeviceApprovedEvent(Guid deviceId, Guid userId)
    {
        DeviceId = deviceId;
        UserId = userId;
    }
}

public sealed class DeviceRevokedEvent : BaseDomainEvent
{
    public Guid DeviceId { get; }
    public string Reason { get; }

    public DeviceRevokedEvent(Guid deviceId, string reason)
    {
        DeviceId = deviceId;
        Reason = reason;
    }
}

public sealed class GpsVerificationSucceededEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public double DistanceMeters { get; }

    public GpsVerificationSucceededEvent(Guid userId, double distanceMeters)
    {
        UserId = userId;
        DistanceMeters = distanceMeters;
    }
}

public sealed class GpsVerificationFailedEvent : BaseDomainEvent
{
    public Guid UserId { get; }
    public string Reason { get; }

    public GpsVerificationFailedEvent(Guid userId, string reason)
    {
        UserId = userId;
        Reason = reason;
    }
}

public sealed class SecurityPolicyChangedEvent : BaseDomainEvent
{
    public Guid PolicyId { get; }
    public string PolicyType { get; }

    public SecurityPolicyChangedEvent(Guid policyId, string policyType)
    {
        PolicyId = policyId;
        PolicyType = policyType;
    }
}
