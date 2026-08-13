using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Application.Features.Security.Face.DTOs;

namespace INK.ERP.Application.Features.Security.Face.Workflows;

public interface IFaceValidationWorkflow
{
    Task<Result<FaceValidationResult>> ValidateAsync(byte[] imageData, CancellationToken cancellationToken = default);
}

public class FaceValidationWorkflow : IFaceValidationWorkflow
{
    private readonly IImageQualityService _qualityService;
    private readonly ILivenessDetectionService _livenessService;

    public FaceValidationWorkflow(IImageQualityService qualityService, ILivenessDetectionService livenessService)
    {
        _qualityService = qualityService;
        _livenessService = livenessService;
    }

    public async Task<Result<FaceValidationResult>> ValidateAsync(byte[] imageData, CancellationToken cancellationToken = default)
    {
        var errors = new List<string>();

        if (imageData == null || imageData.Length == 0)
        {
            errors.Add("Image data is empty.");
            return Result.Success(new FaceValidationResult(false, 0.0f, false, errors));
        }

        var livenessResult = await _livenessService.DetectLivenessAsync(imageData, cancellationToken);
        var isLivenessDetected = livenessResult.IsSuccess && livenessResult.Value;
        if (!isLivenessDetected)
        {
            errors.Add("Face liveness detection failed.");
        }

        var qualityResult = await _qualityService.ValidateQualityAsync(imageData, cancellationToken);
        var qualityScore = qualityResult.IsSuccess ? qualityResult.Value : 0.0f;
        if (qualityScore < 0.70f)
        {
            errors.Add($"Face image quality score '{qualityScore:F2}' is below 0.70 threshold.");
        }

        var isValid = isLivenessDetected && qualityScore >= 0.70f;
        return Result.Success(new FaceValidationResult(isValid, qualityScore, isLivenessDetected, errors));
    }
}
