using System.ComponentModel.DataAnnotations;

namespace INK.ERP.Infrastructure.Options;

public sealed class FaceRecognitionOptions
{
    public const string SectionName = "FaceRecognition";

    [Required(AllowEmptyStrings = false)]
    public string ModelPath { get; set; } = "models/insightface_mobilefacenet.onnx";

    [Required(AllowEmptyStrings = false)]
    public string ModelVersion { get; set; } = "v2.1";

    public string ModelChecksum { get; set; } = "sha256-e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

    [Range(0.0, 1.0)]
    public float MinQualityScoreThreshold { get; set; } = 0.40f;

    [Range(0.0, 1.0)]
    public float MatchThreshold { get; set; } = 0.40f;
}

public sealed class OnnxOptions
{
    public const string SectionName = "Onnx";

    [Required(AllowEmptyStrings = false)]
    public string ExecutionProvider { get; set; } = "CPU";

    [Range(1, 32)]
    public int IntraOpNumThreads { get; set; } = 2;

    [Range(1, 16)]
    public int InterOpNumThreads { get; set; } = 1;

    public bool EnableMemoryPattern { get; set; } = true;
}

public sealed class EncryptionOptions
{
    public const string SectionName = "Encryption";

    [Required(AllowEmptyStrings = false)]
    public string MasterKey { get; set; } = "c3VwZXJfc2VjcmV0X2Flc18yNTZfbWFzdGVyX2tleV8xMjM0NTY3ODk=";

    [Range(1, 100)]
    public int KeyVersion { get; set; } = 1;

    public string Algorithm { get; set; } = "AES-256-GCM";
}

public sealed class GpsOptions
{
    public const string SectionName = "Gps";

    [Range(0.0, 1000.0)]
    public double MaxAllowedAccuracyMeters { get; set; } = 50.0;

    [Range(1.0, 5000.0)]
    public double MaxSpeedKmH { get; set; } = 1000.0;

    public bool EnableSpoofDetection { get; set; } = true;
}

public sealed class SecurityRiskOptions
{
    public const string SectionName = "SecurityRisk";

    [Range(1, 100)]
    public int HighRiskThreshold { get; set; } = 75;

    [Range(1, 100)]
    public int CriticalRiskThreshold { get; set; } = 90;

    [Range(1, 1440)]
    public int MaxFailedAttemptsWindowMinutes { get; set; } = 15;
}
