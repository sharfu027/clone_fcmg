using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Application.Features.Security.Policies.DTOs;

namespace INK.ERP.Application.Features.Security.Common;

public sealed record AuthenticationContext(
    Guid UserId,
    Guid? DeviceId = null,
    DeviceFingerprint? DeviceFingerprint = null,
    GpsCoordinate? GpsCoordinate = null,
    GeoAccuracy? GpsAccuracy = null,
    string? IpAddress = null,
    BrowserFingerprint? BrowserFingerprint = null,
    DateTime CurrentUtcTime = default,
    EffectiveSecurityPolicyDto? SecurityPolicySnapshot = null,
    string? CorrelationId = null);
