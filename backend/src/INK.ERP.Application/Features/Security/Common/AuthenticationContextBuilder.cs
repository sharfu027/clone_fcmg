using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Application.Features.Security.Policies.DTOs;

namespace INK.ERP.Application.Features.Security.Common;

public sealed class AuthenticationContextBuilder
{
    private Guid _userId;
    private Guid? _deviceId;
    private DeviceFingerprint? _deviceFingerprint;
    private GpsCoordinate? _gpsCoordinate;
    private GeoAccuracy? _gpsAccuracy;
    private string? _ipAddress;
    private BrowserFingerprint? _browserFingerprint;
    private DateTime _currentUtcTime = DateTime.UtcNow;
    private EffectiveSecurityPolicyDto? _securityPolicySnapshot;
    private string? _correlationId;

    public AuthenticationContextBuilder WithUser(Guid userId)
    {
        _userId = userId;
        return this;
    }

    public AuthenticationContextBuilder WithDevice(Guid? deviceId, DeviceFingerprint? fingerprint = null)
    {
        _deviceId = deviceId;
        _deviceFingerprint = fingerprint;
        return this;
    }

    public AuthenticationContextBuilder WithGps(GpsCoordinate? coordinate, GeoAccuracy? accuracy = null)
    {
        _gpsCoordinate = coordinate;
        _gpsAccuracy = accuracy;
        return this;
    }

    public AuthenticationContextBuilder WithClientInfo(string? ipAddress, BrowserFingerprint? browser = null)
    {
        _ipAddress = ipAddress;
        _browserFingerprint = browser;
        return this;
    }

    public AuthenticationContextBuilder WithPolicySnapshot(EffectiveSecurityPolicyDto? policy)
    {
        _securityPolicySnapshot = policy;
        return this;
    }

    public AuthenticationContextBuilder WithCorrelationId(string? correlationId)
    {
        _correlationId = correlationId;
        return this;
    }

    public AuthenticationContextBuilder WithTimestamp(DateTime currentUtcTime)
    {
        _currentUtcTime = currentUtcTime;
        return this;
    }

    public AuthenticationContext Build()
    {
        if (_userId == Guid.Empty)
        {
            throw new InvalidOperationException("UserId must be set before building AuthenticationContext.");
        }

        return new AuthenticationContext(
            _userId,
            _deviceId,
            _deviceFingerprint,
            _gpsCoordinate,
            _gpsAccuracy,
            _ipAddress,
            _browserFingerprint,
            _currentUtcTime,
            _securityPolicySnapshot,
            _correlationId);
    }
}
