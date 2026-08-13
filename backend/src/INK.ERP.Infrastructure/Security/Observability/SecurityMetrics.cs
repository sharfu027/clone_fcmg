using System.Diagnostics.Metrics;

namespace INK.ERP.Infrastructure.Security.Observability;

public static class SecurityMetrics
{
    public const string MeterName = "INK.ERP.Security";
    private static readonly Meter SecurityMeter = new(MeterName, "1.0.0");

    public static readonly Counter<long> FaceEmbeddingSuccessCounter =
        SecurityMeter.CreateCounter<long>("security.face.embedding.success.count", "count", "Successful face embedding count");

    public static readonly Counter<long> FaceEmbeddingFailureCounter =
        SecurityMeter.CreateCounter<long>("security.face.embedding.failure.count", "count", "Failed face embedding count");

    public static readonly Histogram<double> FaceEmbeddingDurationMs =
        SecurityMeter.CreateHistogram<double>("security.face.embedding.duration.ms", "ms", "Face embedding duration in milliseconds");

    public static readonly Histogram<double> FaceComparisonDurationMs =
        SecurityMeter.CreateHistogram<double>("security.face.comparison.duration.ms", "ms", "Face comparison duration in milliseconds");

    public static readonly Histogram<double> GpsVerificationDurationMs =
        SecurityMeter.CreateHistogram<double>("security.gps.verification.duration.ms", "ms", "GPS verification duration in milliseconds");

    public static readonly Histogram<double> RiskAssessmentDurationMs =
        SecurityMeter.CreateHistogram<double>("security.risk.assessment.duration.ms", "ms", "Risk assessment duration in milliseconds");

    public static readonly Histogram<double> ModelLoadDurationMs =
        SecurityMeter.CreateHistogram<double>("security.model.load.duration.ms", "ms", "ONNX Model load duration in milliseconds");
}
