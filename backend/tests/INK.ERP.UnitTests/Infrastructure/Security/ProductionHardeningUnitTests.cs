using FluentAssertions;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Security.Common;
using INK.ERP.Infrastructure.Options;
using INK.ERP.Infrastructure.Security.Face;
using INK.ERP.Infrastructure.Security.GPS;
using INK.ERP.Infrastructure.Security.Health;
using INK.ERP.Infrastructure.Security.Observability;
using INK.ERP.Infrastructure.Security.Risk;

namespace INK.ERP.UnitTests.Infrastructure.Security;

public sealed class ProductionHardeningUnitTests
{
    [Fact]
    public async Task ImagePipeline_ExecutesStagesInOrder_ReturnsPreprocessedResult()
    {
        // Arrange
        var stages = new List<IImagePipelineStage>
        {
            new FaceDetectionStage(),
            new FaceAlignmentStage(),
            new ImageNormalizationStage(),
            new ImageQualityCheckStage()
        };

        var loggerMock = new Mock<ILogger<ImagePipeline>>();
        var pipeline = new ImagePipeline(stages, loggerMock.Object);

        byte[] rawBytes = new byte[500];

        // Act
        var result = await pipeline.ExecutePipelineAsync(rawBytes, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.DetectedFaceCount.Should().Be(1);
        result.BrightnessLevel.Should().Be(0.55f);
        result.BlurScore.Should().Be(88.0f);
    }

    [Fact]
    public void FaceTemplateProtection_RotateKey_EncryptsWithTargetKeyVersion()
    {
        // Arrange
        var optionsMock = Options.Create(new EncryptionOptions
        {
            MasterKey = "c3VwZXJfc2VjcmV0X2Flc18yNTZfbWFzdGVyX2tleV8xMjM0NTY3ODk=",
            KeyVersion = 1
        });
        var protectionService = new FaceTemplateProtectionService(optionsMock);

        string rawData = "0.55,0.77,0.88";
        string encryptedV1 = protectionService.EncryptEmbedding(rawData);

        // Act
        string rotatedV2 = protectionService.RotateKey(encryptedV1, 2);
        string decryptedRotated = protectionService.DecryptEmbedding(rotatedV2);

        // Assert
        encryptedV1.Should().StartWith("ENC:v1:");
        rotatedV2.Should().StartWith("ENC:v2:");
        decryptedRotated.Should().Be(rawData);
    }

    [Fact]
    public void FaceComparisonService_ConsumesEuclideanStrategy_EvaluatesCorrectly()
    {
        // Arrange
        var strategy = new EuclideanStrategy();
        var optionsMock = Options.Create(new FaceRecognitionOptions { MatchThreshold = 0.80f });
        var loggerMock = new Mock<ILogger<FaceComparisonService>>();
        var protectionServiceMock = new Mock<IFaceTemplateProtectionService>();
        var service = new FaceComparisonService(strategy, protectionServiceMock.Object, optionsMock, loggerMock.Object);

        var vectorA = new float[] { 0.5f, 0.5f };
        var vectorB = new float[] { 0.5f, 0.5f };

        // Act
        var result = service.Compare(vectorA, vectorB);

        // Assert
        result.IsMatch.Should().BeTrue();
        result.SimilarityScore.Should().Be(1.0f);
    }

    [Fact]
    public async Task RiskEngine_AggregatesRegisteredStrategies_CalculatesCombinedScore()
    {
        // Arrange
        var optionsMock = Options.Create(new SecurityRiskOptions { HighRiskThreshold = 75 });
        var strategies = new List<IRiskStrategy>
        {
            new FaceRiskStrategy(),
            new GpsRiskStrategy(),
            new DeviceRiskStrategy(),
            new BehaviorRiskStrategy(),
            new PolicyRiskStrategy()
        };

        var loggerMock = new Mock<ILogger<RiskEngine>>();
        var riskEngine = new RiskEngine(optionsMock, strategies, loggerMock.Object);

        var context = new AuthenticationContextBuilder()
            .WithUser(Guid.NewGuid())
            .WithGps(null)
            .Build();

        // Act
        var result = await riskEngine.AssessRiskAsync(context, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.RiskScore.Should().BeGreaterThanOrEqualTo(30); // DeviceId missing adds 30
        result.Value.RiskFactors.Should().Contain(r => r.Contains("Unregistered hardware device"));
    }

    [Fact]
    public async Task HealthChecks_AllIndividualHealthChecks_ReturnHealthy()
    {
        // Arrange
        var protectionMock = new Mock<IFaceTemplateProtectionService>();
        protectionMock.Setup(p => p.EncryptEmbedding(It.IsAny<string>())).Returns("ENC:v1:validpayload");
        protectionMock.Setup(p => p.DecryptEmbedding(It.IsAny<string>())).Returns("0.1,0.2,0.3");
        protectionMock.Setup(p => p.ValidatePayloadFormat(It.IsAny<string>())).Returns(true);

        var encCheck = new EncryptionHealthCheck(protectionMock.Object);
        var gpsCheck = new GpsHealthCheck(Options.Create(new GpsOptions()));

        // Act
        var resEnc = await encCheck.CheckHealthAsync(new HealthCheckContext());
        var resGps = await gpsCheck.CheckHealthAsync(new HealthCheckContext());

        // Assert
        resEnc.Status.Should().Be(HealthStatus.Healthy);
        resGps.Status.Should().Be(HealthStatus.Healthy);
    }

    [Fact]
    public void SecurityMetrics_ExposesCustomDiagnosticCounters()
    {
        // Act & Assert
        SecurityMetrics.MeterName.Should().Be("INK.ERP.Security");
        SecurityMetrics.FaceEmbeddingSuccessCounter.Should().NotBeNull();
        SecurityMetrics.FaceEmbeddingDurationMs.Should().NotBeNull();
    }
}
