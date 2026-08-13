using INK.ERP.Domain.Common;
using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Application.Features.Security.Common;
using INK.ERP.Application.Features.Security.Face.DTOs;
using INK.ERP.Application.Features.Security.Risk.DTOs;

namespace INK.ERP.Application.Common.Interfaces;

public interface IFaceEmbeddingService
{
    Task<Result<FaceEmbeddingResult>> GenerateEmbeddingAsync(byte[] imageData, CancellationToken cancellationToken = default);
}

public interface IImageQualityService
{
    Task<Result<float>> ValidateQualityAsync(byte[] imageData, CancellationToken cancellationToken = default);
}

public interface ILivenessDetectionService
{
    Task<Result<bool>> DetectLivenessAsync(byte[] imageData, CancellationToken cancellationToken = default);
}

public interface IGpsVerificationService
{
    Task<Result<bool>> ValidateGpsAsync(GpsCoordinate coordinate, GeoAccuracy accuracy, CancellationToken cancellationToken = default);
}

public interface IGeofenceService
{
    Task<Result<bool>> IsWithinGeofenceAsync(GpsCoordinate coordinate, GeofenceDto geofence, CancellationToken cancellationToken = default);
}

public interface IDeviceFingerprintService
{
    Task<Result<DeviceFingerprint>> GenerateFingerprintAsync(string clientType, string deviceModel, string os, string rawData, CancellationToken cancellationToken = default);
}

public interface IRiskEngine
{
    Task<Result<RiskAssessmentDto>> AssessRiskAsync(AuthenticationContext context, CancellationToken cancellationToken = default);
}
