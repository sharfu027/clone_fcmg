using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.Security;

public static class SecurityErrors
{
    public static class Face
    {
        public static Error ProfileNotFound(Guid userId) =>
            new("SECURITY.FACE.PROFILE_NOT_FOUND", $"Face profile for user '{userId}' was not found.", ErrorType.NotFound);

        public static Error TemplateNotFound(int version) =>
            new("SECURITY.FACE.TEMPLATE_NOT_FOUND", $"Face template version '{version}' was not found.", ErrorType.NotFound);

        public static Error MaxTemplatesReached =>
            new("SECURITY.FACE.MAX_TEMPLATES_REACHED", "Cannot enroll more than 5 active face templates.", ErrorType.Conflict);

        public static Error InactiveProfile =>
            new("SECURITY.FACE.INACTIVE_PROFILE", "Cannot perform operation on an inactive face profile.", ErrorType.Conflict);

        public static Error QualityCheckFailed(string reason) =>
            new("SECURITY.FACE.QUALITY_CHECK_FAILED", $"Face image quality check failed: {reason}", ErrorType.Validation);

        public static Error LivenessCheckFailed =>
            new("SECURITY.FACE.LIVENESS_FAILED", "Face liveness detection failed (possible spoofing).", ErrorType.Unauthorized);

        public static Error VerificationFailed(string reason) =>
            new("SECURITY.FACE.VERIFICATION_FAILED", $"Face verification failed: {reason}", ErrorType.Unauthorized);
    }

    public static class Device
    {
        public static Error NotFound(Guid deviceId) =>
            new("SECURITY.DEVICE.NOT_FOUND", $"Device '{deviceId}' was not found.", ErrorType.NotFound);

        public static Error AlreadyApproved =>
            new("SECURITY.DEVICE.ALREADY_APPROVED", "Device is already approved.", ErrorType.Conflict);

        public static Error Revoked =>
            new("SECURITY.DEVICE.REVOKED", "Cannot operate on a revoked device.", ErrorType.Conflict);

        public static Error UnapprovedTrustAttempt =>
            new("SECURITY.DEVICE.UNAPPROVED_TRUST", "Cannot trust an unapproved device.", ErrorType.Conflict);

        public static Error HeartbeatRejected =>
            new("SECURITY.DEVICE.HEARTBEAT_REJECTED", "Heartbeat rejected for revoked/deactivated device.", ErrorType.Unauthorized);
    }

    public static class Policy
    {
        public static Error NotFound(Guid policyId) =>
            new("SECURITY.POLICY.NOT_FOUND", $"Security policy '{policyId}' was not found.", ErrorType.NotFound);

        public static Error UserPolicyNotFound(Guid userId) =>
            new("SECURITY.POLICY.USER_NOT_FOUND", $"User security policy override for user '{userId}' was not found.", ErrorType.NotFound);

        public static Error InvalidScore(float score) =>
            new("SECURITY.POLICY.INVALID_SCORE", $"Min confidence score '{score}' must be between 0.0 and 1.0.", ErrorType.Validation);

        public static Error InvalidRadius(double radius) =>
            new("SECURITY.POLICY.INVALID_RADIUS", $"Max radius '{radius}' cannot be negative.", ErrorType.Validation);
    }

    public static class Incident
    {
        public static Error NotFound(Guid incidentId) =>
            new("SECURITY.INCIDENT.NOT_FOUND", $"Security incident '{incidentId}' was not found.", ErrorType.NotFound);

        public static Error AlreadyResolved =>
            new("SECURITY.INCIDENT.ALREADY_RESOLVED", "Security incident is already resolved.", ErrorType.Conflict);
    }

    public static class Risk
    {
        public static Error EvaluationFailed(string reason) =>
            new("SECURITY.RISK.EVALUATION_FAILED", $"Risk evaluation failed: {reason}", ErrorType.Failure);

        public static Error HighRiskDetected(int score) =>
            new("SECURITY.RISK.HIGH_RISK_DETECTED", $"Authentication rejected due to high risk score ({score}/100).", ErrorType.Unauthorized);
    }
}
