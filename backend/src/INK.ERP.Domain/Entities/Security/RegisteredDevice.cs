using INK.ERP.Domain.Common;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.Events.Security;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Domain.Entities.Security;

public sealed class RegisteredDevice : AuditableEntity
{
    public Guid UserId { get; private set; }
    public string DeviceName { get; private set; } = string.Empty;
    public DeviceFingerprint Fingerprint { get; private set; } = null!;
    public DeviceStatus Status { get; private set; } = DeviceStatus.PendingApproval;
    public string? ApprovedBy { get; private set; }
    public DateTime? ApprovedAtUtc { get; private set; }
    public DateTime? LastHeartbeatUtc { get; private set; }
    public string? LastIpAddress { get; private set; }
    public string? RejectionOrRevocationReason { get; private set; }

    private RegisteredDevice() { } // EF Core

    public RegisteredDevice(Guid userId, string deviceName, DeviceFingerprint fingerprint)
    {
        UserId = userId;
        DeviceName = string.IsNullOrWhiteSpace(deviceName) ? "Mobile Device" : deviceName;
        Fingerprint = fingerprint ?? throw new ArgumentNullException(nameof(fingerprint));
        Status = DeviceStatus.PendingApproval;
    }

    public void Approve(string approvedBy)
    {
        if (Status == DeviceStatus.Revoked)
        {
            throw new InvalidOperationException("Cannot approve a revoked device.");
        }

        Status = DeviceStatus.Approved;
        ApprovedBy = approvedBy;
        ApprovedAtUtc = DateTime.UtcNow;
        LastModifiedAtUtc = DateTime.UtcNow;

        AddDomainEvent(new DeviceApprovedEvent(Id, UserId));
    }

    public void Reject(string reason)
    {
        Status = DeviceStatus.Rejected;
        RejectionOrRevocationReason = reason;
        LastModifiedAtUtc = DateTime.UtcNow;
    }

    public void Trust()
    {
        if (Status != DeviceStatus.Approved && Status != DeviceStatus.Trusted)
        {
            throw new InvalidOperationException("Cannot trust an unapproved device.");
        }

        Status = DeviceStatus.Trusted;
        LastModifiedAtUtc = DateTime.UtcNow;
    }

    public void Revoke(string reason)
    {
        Status = DeviceStatus.Revoked;
        RejectionOrRevocationReason = reason;
        LastModifiedAtUtc = DateTime.UtcNow;

        AddDomainEvent(new DeviceRevokedEvent(Id, reason));
    }

    public void Heartbeat(string ipAddress)
    {
        if (Status == DeviceStatus.Revoked || Status == DeviceStatus.Deactivated)
        {
            throw new InvalidOperationException("Cannot send heartbeat for a revoked or deactivated device.");
        }

        LastHeartbeatUtc = DateTime.UtcNow;
        LastIpAddress = ipAddress;
        LastModifiedAtUtc = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        Status = DeviceStatus.Deactivated;
        LastModifiedAtUtc = DateTime.UtcNow;
    }
}
