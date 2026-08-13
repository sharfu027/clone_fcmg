using INK.ERP.Domain.Common;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.Events.Security;

namespace INK.ERP.Domain.Entities.Security;

public sealed class SecurityPolicy : AuditableEntity
{
    public string Name { get; private set; } = "Global Default Policy";
    public bool IsActive { get; private set; } = true;

    // Face Policy
    public FaceVerificationMode FaceMode { get; private set; } = FaceVerificationMode.StrictMatching;
    public float MinFaceConfidenceScore { get; private set; } = 0.85f;

    // GPS Policy
    public GpsVerificationMode GpsMode { get; private set; } = GpsVerificationMode.RequiredStrict;
    public double MaxAllowedGpsRadiusMeters { get; private set; } = 150.0;

    // Password Policy
    public int PasswordMinLength { get; private set; } = 8;
    public bool PasswordRequireSpecialChar { get; private set; } = true;
    public int LockoutThresholdAttempts { get; private set; } = 5;

    // Attendance Policy
    public AttendanceMode AttendanceMode { get; private set; } = AttendanceMode.BiometricAndGeofence;

    // Device Policy
    public bool RequireDeviceRegistration { get; private set; } = true;
    public int MaxDevicesPerUser { get; private set; } = 3;

    private SecurityPolicy() { } // EF Core

    public SecurityPolicy(string name)
    {
        Name = name;
        IsActive = true;
    }

    public void UpdateFacePolicy(FaceVerificationMode mode, float minConfidenceScore)
    {
        if (minConfidenceScore < 0.0f || minConfidenceScore > 1.0f)
            throw new ArgumentOutOfRangeException(nameof(minConfidenceScore), "Score must be between 0.0 and 1.0.");

        FaceMode = mode;
        MinFaceConfidenceScore = minConfidenceScore;
        LastModifiedAtUtc = DateTime.UtcNow;

        AddDomainEvent(new SecurityPolicyChangedEvent(Id, "FacePolicy"));
    }

    public void UpdateGpsPolicy(GpsVerificationMode mode, double maxAllowedRadiusMeters)
    {
        if (maxAllowedRadiusMeters < 0)
            throw new ArgumentOutOfRangeException(nameof(maxAllowedRadiusMeters), "Radius cannot be negative.");

        GpsMode = mode;
        MaxAllowedGpsRadiusMeters = maxAllowedRadiusMeters;
        LastModifiedAtUtc = DateTime.UtcNow;

        AddDomainEvent(new SecurityPolicyChangedEvent(Id, "GpsPolicy"));
    }

    public void UpdatePasswordPolicy(int minLength, bool requireSpecialChar, int lockoutThreshold)
    {
        if (minLength < 6)
            throw new ArgumentException("Min length must be at least 6.", nameof(minLength));

        PasswordMinLength = minLength;
        PasswordRequireSpecialChar = requireSpecialChar;
        LockoutThresholdAttempts = lockoutThreshold;
        LastModifiedAtUtc = DateTime.UtcNow;

        AddDomainEvent(new SecurityPolicyChangedEvent(Id, "PasswordPolicy"));
    }

    public void UpdateAttendancePolicy(AttendanceMode mode)
    {
        AttendanceMode = mode;
        LastModifiedAtUtc = DateTime.UtcNow;

        AddDomainEvent(new SecurityPolicyChangedEvent(Id, "AttendancePolicy"));
    }

    public void Enable()
    {
        IsActive = true;
        LastModifiedAtUtc = DateTime.UtcNow;
    }

    public void Disable()
    {
        IsActive = false;
        LastModifiedAtUtc = DateTime.UtcNow;
    }
}
