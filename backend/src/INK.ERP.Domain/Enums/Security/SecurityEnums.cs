namespace INK.ERP.Domain.Enums.Security;

public enum FaceEnrollmentStatus
{
    Pending = 0,
    Enrolled = 1,
    Rejected = 2,
    Archived = 3,
    Deactivated = 4
}

public enum VerificationStatus
{
    Success = 0,
    FailedMismatch = 1,
    FailedSpoofing = 2,
    FailedLiveness = 3,
    FailedOutsideGeofence = 4,
    Expired = 5
}

public enum DeviceStatus
{
    PendingApproval = 0,
    Approved = 1,
    Trusted = 2,
    Rejected = 3,
    Revoked = 4,
    Deactivated = 5
}

public enum IncidentSeverity
{
    Low = 0,
    Medium = 1,
    High = 2,
    Critical = 3
}

public enum IncidentType
{
    FaceMismatch = 0,
    GpsSpoofing = 1,
    ImpossibleTravel = 2,
    TokenReuse = 3,
    BruteForce = 4,
    DeviceTampering = 5,
    UnauthorizedAccess = 6
}

public enum GpsVerificationMode
{
    Disabled = 0,
    Optional = 1,
    RequiredStrict = 2,
    RequiredSlidingRange = 3
}

public enum FaceVerificationMode
{
    Disabled = 0,
    Optional = 1,
    StrictMatching = 2,
    AdaptiveThreshold = 3
}

public enum AttendanceMode
{
    Standard = 0,
    BiometricOnly = 1,
    GeofenceOnly = 2,
    BiometricAndGeofence = 3
}
