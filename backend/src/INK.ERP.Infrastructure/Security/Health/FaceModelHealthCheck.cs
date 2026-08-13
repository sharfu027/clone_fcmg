using Microsoft.Extensions.Diagnostics.HealthChecks;
using INK.ERP.Infrastructure.Security.Face;

namespace INK.ERP.Infrastructure.Security.Health;

public sealed class FaceModelHealthCheck : IHealthCheck
{
    private readonly IModelLoader _modelLoader;

    public FaceModelHealthCheck(IModelLoader modelLoader)
    {
        _modelLoader = modelLoader;
    }

    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default)
    {
        if (!_modelLoader.IsLoaded)
        {
            await _modelLoader.LoadModelAsync(cancellationToken);
        }

        if (!_modelLoader.IsLoaded)
        {
            return HealthCheckResult.Unhealthy("InsightFace ONNX model is not loaded.");
        }

        var data = new Dictionary<string, object>
        {
            ["ModelVersion"] = _modelLoader.Version,
            ["ModelChecksum"] = _modelLoader.Checksum,
            ["ExecutionProvider"] = _modelLoader.ExecutionProvider
        };

        return HealthCheckResult.Healthy("InsightFace ONNX model is healthy and ready for inference.", data);
    }
}
