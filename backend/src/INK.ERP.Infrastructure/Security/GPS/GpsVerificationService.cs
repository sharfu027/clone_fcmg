using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Infrastructure.Options;

namespace INK.ERP.Infrastructure.Security.GPS;

public sealed class GpsVerificationService : IGpsVerificationService
{
    private readonly GpsOptions _options;
    private readonly ILogger<GpsVerificationService> _logger;

    public GpsVerificationService(IOptions<GpsOptions> options, ILogger<GpsVerificationService> logger)
    {
        _options = options.Value;
        _logger = logger;
    }

    public Task<Result<bool>> ValidateGpsAsync(GpsCoordinate coordinate, GeoAccuracy accuracy, CancellationToken cancellationToken = default)
    {
        if (coordinate == null)
        {
            return Task.FromResult(Result.Failure<bool>(new Error("SECURITY.GPS.INVALID_COORDINATE", "GPS coordinate is missing.", ErrorType.Validation)));
        }

        if (accuracy != null && accuracy.AccuracyInMeters > _options.MaxAllowedAccuracyMeters)
        {
            _logger.LogWarning("GPS accuracy {Accuracy}m exceeds maximum threshold {Threshold}m", accuracy.AccuracyInMeters, _options.MaxAllowedAccuracyMeters);
            return Task.FromResult(Result.Failure<bool>(new Error("SECURITY.GPS.ACCURACY_TOO_LOW", $"GPS accuracy ({accuracy.AccuracyInMeters:F1}m) exceeds max allowed limit ({_options.MaxAllowedAccuracyMeters}m).", ErrorType.Validation)));
        }

        if (_options.EnableSpoofDetection && accuracy != null && accuracy.SpeedMs.HasValue)
        {
            double speedKmH = accuracy.SpeedMs.Value * 3.6;
            if (speedKmH > _options.MaxSpeedKmH)
            {
                _logger.LogWarning("GPS spoofing detected: Speed {Speed} km/h exceeds limit {MaxSpeed} km/h", speedKmH, _options.MaxSpeedKmH);
                return Task.FromResult(Result.Failure<bool>(new Error("SECURITY.GPS.SPOOFING_DETECTED", "GPS spoofing detected based on velocity anomaly.", ErrorType.Unauthorized)));
            }
        }

        return Task.FromResult(Result.Success(true));
    }
}
