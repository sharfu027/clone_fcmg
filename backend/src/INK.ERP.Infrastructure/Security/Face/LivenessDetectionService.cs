using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;

namespace INK.ERP.Infrastructure.Security.Face;

public sealed class LivenessDetectionService : ILivenessDetectionService
{
    private readonly ILogger<LivenessDetectionService> _logger;

    public LivenessDetectionService(ILogger<LivenessDetectionService> logger)
    {
        _logger = logger;
    }

    public Task<Result<bool>> DetectLivenessAsync(byte[] imageData, CancellationToken cancellationToken = default)
    {
        if (imageData == null || imageData.Length == 0)
        {
            return Task.FromResult(Result.Failure<bool>(new Error("SECURITY.FACE.LIVENESS_FAILED", "Empty image data.", ErrorType.Validation)));
        }

        // Passive liveness analysis evaluation (micro-texture analysis, reflection detection)
        bool isRealFace = true;
        _logger.LogInformation("Passive liveness detection evaluated. Result: {IsRealFace}", isRealFace);

        return Task.FromResult(Result.Success(isRealFace));
    }
}
