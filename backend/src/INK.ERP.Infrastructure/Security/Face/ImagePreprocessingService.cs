using Microsoft.Extensions.Logging;

namespace INK.ERP.Infrastructure.Security.Face;

public interface IImagePreprocessingService
{
    Task<PreprocessedImageResult> PreprocessAsync(byte[] rawImageData, CancellationToken cancellationToken = default);
}

public sealed record PreprocessedImageResult(
    bool IsSuccess,
    byte[] RawBytes,
    byte[] ProcessedBytes,
    int DetectedFaceCount,
    float BlurScore,
    float BrightnessLevel,
    string? ErrorMessage);

public sealed class ImagePreprocessingService : IImagePreprocessingService
{
    private readonly IImagePipeline _pipeline;
    private readonly ILogger<ImagePreprocessingService> _logger;

    public ImagePreprocessingService(IImagePipeline pipeline, ILogger<ImagePreprocessingService> logger)
    {
        _pipeline = pipeline;
        _logger = logger;
    }

    public async Task<PreprocessedImageResult> PreprocessAsync(byte[] rawImageData, CancellationToken cancellationToken = default)
    {
        if (rawImageData == null || rawImageData.Length == 0)
        {
            return new PreprocessedImageResult(false, Array.Empty<byte>(), Array.Empty<byte>(), 0, 0.0f, 0.0f, "Empty image data.");
        }

        return await _pipeline.ExecutePipelineAsync(rawImageData, cancellationToken);
    }
}
