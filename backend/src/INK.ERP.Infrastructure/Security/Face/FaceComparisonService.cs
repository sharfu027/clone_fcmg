using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using INK.ERP.Infrastructure.Options;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Security.Face;

public sealed class FaceComparisonService : IFaceComparisonService
{
    private readonly IFaceComparisonStrategy _strategy;
    private readonly IFaceTemplateProtectionService _protectionService;
    private readonly FaceRecognitionOptions _options;
    private readonly ILogger<FaceComparisonService> _logger;

    public FaceComparisonService(
        IFaceComparisonStrategy strategy,
        IFaceTemplateProtectionService protectionService,
        IOptions<FaceRecognitionOptions> options,
        ILogger<FaceComparisonService> logger)
    {
        _strategy = strategy;
        _protectionService = protectionService;
        _options = options.Value;
        _logger = logger;
    }

    public FaceComparisonResult Compare(float[] vectorA, float[] vectorB)
    {
        var result = _strategy.Compare(vectorA, vectorB, _options.MatchThreshold);
        _logger.LogDebug("Comparison using strategy '{Strategy}' evaluated score: {Score:F4}, Match: {IsMatch}", _strategy.StrategyName, result.SimilarityScore, result.IsMatch);
        return result;
    }

    public FaceComparisonResult Compare(string vectorDataA, string vectorDataB)
    {
        var decryptedA = _protectionService.DecryptEmbedding(vectorDataA);
        var decryptedB = _protectionService.DecryptEmbedding(vectorDataB);

        var floatsA = ParseVector(decryptedA);
        var floatsB = ParseVector(decryptedB);

        return Compare(floatsA, floatsB);
    }

    private static float[] ParseVector(string vectorData)
    {
        if (string.IsNullOrWhiteSpace(vectorData)) return Array.Empty<float>();
        var parts = vectorData.Split(new[] { ',', ' ' }, StringSplitOptions.RemoveEmptyEntries);
        var result = new float[parts.Length];
        for (int i = 0; i < parts.Length; i++)
        {
            float.TryParse(parts[i], out result[i]);
        }
        return result;
    }
}
