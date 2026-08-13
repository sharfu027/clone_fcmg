using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Domain.Services.Security;

public record EffectiveSecurityPolicy(
    FaceVerificationMode FaceMode,
    float MinFaceConfidenceScore,
    GpsVerificationMode GpsMode,
    double MaxAllowedGpsRadiusMeters,
    AttendanceMode AttendanceMode,
    bool RequireDeviceRegistration);

public class PolicyResolutionDomainService
{
    public EffectiveSecurityPolicy Resolve(SecurityPolicy globalPolicy, UserSecurityPolicy? userPolicy)
    {
        if (globalPolicy == null)
            throw new ArgumentNullException(nameof(globalPolicy));

        var faceMode = globalPolicy.FaceMode;
        var gpsMode = globalPolicy.GpsMode;
        var gpsRadius = globalPolicy.MaxAllowedGpsRadiusMeters;
        var attendanceMode = globalPolicy.AttendanceMode;
        var requireDevice = globalPolicy.RequireDeviceRegistration;

        if (userPolicy != null && !userPolicy.IsExpired)
        {
            if (userPolicy.FaceModeOverride.HasValue)
                faceMode = userPolicy.FaceModeOverride.Value;

            if (userPolicy.GpsModeOverride.HasValue)
                gpsMode = userPolicy.GpsModeOverride.Value;

            if (userPolicy.MaxAllowedGpsRadiusMetersOverride.HasValue)
                gpsRadius = userPolicy.MaxAllowedGpsRadiusMetersOverride.Value;

            if (userPolicy.AttendanceModeOverride.HasValue)
                attendanceMode = userPolicy.AttendanceModeOverride.Value;

            if (userPolicy.RequireDeviceRegistrationOverride.HasValue)
                requireDevice = userPolicy.RequireDeviceRegistrationOverride.Value;
        }

        return new EffectiveSecurityPolicy(
            faceMode,
            globalPolicy.MinFaceConfidenceScore,
            gpsMode,
            gpsRadius,
            attendanceMode,
            requireDevice);
    }
}

public class DeviceTrustDomainService
{
    public bool IsDeviceTrusted(RegisteredDevice? device, DeviceFingerprint currentFingerprint, TimeSpan maxHeartbeatAge)
    {
        if (device == null) return false;
        if (device.Status != DeviceStatus.Approved && device.Status != DeviceStatus.Trusted) return false;
        if (device.Fingerprint.FingerprintHash != currentFingerprint.FingerprintHash) return false;

        if (device.LastHeartbeatUtc.HasValue)
        {
            var age = DateTime.UtcNow - device.LastHeartbeatUtc.Value;
            if (age > maxHeartbeatAge) return false;
        }

        return true;
    }
}

public class SecurityRiskAssessmentService
{
    public int CalculateRiskScore(
        IReadOnlyList<SecurityIncident> recentIncidents,
        GpsCoordinate? lastCoordinate, DateTime? lastCoordinateTime,
        GpsCoordinate? currentCoordinate, DateTime currentCoordinateTime)
    {
        int score = 0;

        foreach (var incident in recentIncidents)
        {
            score += incident.Severity switch
            {
                IncidentSeverity.Low => 10,
                IncidentSeverity.Medium => 25,
                IncidentSeverity.High => 50,
                IncidentSeverity.Critical => 100,
                _ => 10
            };
        }

        if (lastCoordinate != null && lastCoordinateTime.HasValue && currentCoordinate != null)
        {
            var distanceMeters = lastCoordinate.DistanceToMeters(currentCoordinate);
            var timeHours = (currentCoordinateTime - lastCoordinateTime.Value).TotalHours;

            if (timeHours > 0)
            {
                var speedKmH = (distanceMeters / 1000.0) / timeHours;
                if (speedKmH > 1000) // Impossible travel
                {
                    score += 80;
                }
            }
        }

        return Math.Min(score, 100);
    }
}
