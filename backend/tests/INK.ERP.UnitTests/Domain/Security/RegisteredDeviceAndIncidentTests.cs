using FluentAssertions;
using Xunit;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.Events.Security;
using INK.ERP.Domain.Services.Security;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.UnitTests.Domain.Security;

public sealed class RegisteredDeviceAndIncidentTests
{
    [Fact]
    public void Approve_PendingDevice_SetsStatusToApprovedAndRaisesEvent()
    {
        // Arrange
        var fingerprint = new DeviceFingerprint("hash123", "Mobile", "iPhone 15", "iOS 17");
        var device = new RegisteredDevice(Guid.NewGuid(), "Work Phone", fingerprint);

        // Act
        device.Approve("AdminUser");

        // Assert
        device.Status.Should().Be(DeviceStatus.Approved);
        device.ApprovedBy.Should().Be("AdminUser");
        device.DomainEvents.Should().ContainSingle(e => e is DeviceApprovedEvent);
    }

    [Fact]
    public void Trust_UnapprovedDevice_ThrowsInvalidOperationException()
    {
        // Arrange
        var fingerprint = new DeviceFingerprint("hash123", "Mobile", "iPhone 15", "iOS 17");
        var device = new RegisteredDevice(Guid.NewGuid(), "Work Phone", fingerprint);

        // Act & Assert
        device.Invoking(d => d.Trust())
            .Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot trust an unapproved device.");
    }

    [Fact]
    public void Approve_RevokedDevice_ThrowsInvalidOperationException()
    {
        // Arrange
        var fingerprint = new DeviceFingerprint("hash123", "Mobile", "iPhone 15", "iOS 17");
        var device = new RegisteredDevice(Guid.NewGuid(), "Work Phone", fingerprint);
        device.Revoke("Security violation");

        // Act & Assert
        device.Invoking(d => d.Approve("AdminUser"))
            .Should().Throw<InvalidOperationException>()
            .WithMessage("Cannot approve a revoked device.");
    }

    [Fact]
    public void Raise_HighSeverityIncident_AutomaticallyEscalates()
    {
        // Arrange & Act
        var incident = SecurityIncident.Raise(IncidentType.GpsSpoofing, IncidentSeverity.High, "Spoofed GPS signal detected");

        // Assert
        incident.IsEscalated.Should().BeTrue();
        incident.DomainEvents.Should().ContainSingle(e => e is SecurityIncidentRaisedEvent);
    }

    [Fact]
    public void GpsCoordinate_HaversineDistance_CalculatesDistanceCorrectly()
    {
        // Arrange (London to Paris ~343 km = ~343,000 meters)
        var london = new GpsCoordinate(51.5074, -0.1278);
        var paris = new GpsCoordinate(48.8566, 2.3522);

        // Act
        var distance = london.DistanceToMeters(paris);

        // Assert
        distance.Should().BeInRange(340000, 350000);
    }

    [Fact]
    public void PolicyResolutionDomainService_ActiveUserOverride_OverridesGlobalPolicy()
    {
        // Arrange
        var globalPolicy = new SecurityPolicy("Global Policy");
        var userId = Guid.NewGuid();
        var userPolicy = new UserSecurityPolicy(userId);
        userPolicy.OverrideFace(FaceVerificationMode.AdaptiveThreshold, DateTime.UtcNow.AddDays(1));

        var resolver = new PolicyResolutionDomainService();

        // Act
        var effective = resolver.Resolve(globalPolicy, userPolicy);

        // Assert
        effective.FaceMode.Should().Be(FaceVerificationMode.AdaptiveThreshold);
    }

    [Fact]
    public void PolicyResolutionDomainService_ExpiredUserOverride_UsesGlobalPolicy()
    {
        // Arrange
        var globalPolicy = new SecurityPolicy("Global Policy");
        var userId = Guid.NewGuid();
        var userPolicy = new UserSecurityPolicy(userId);
        userPolicy.OverrideFace(FaceVerificationMode.AdaptiveThreshold, DateTime.UtcNow.AddMinutes(-10)); // Expired!

        var resolver = new PolicyResolutionDomainService();

        // Act
        var effective = resolver.Resolve(globalPolicy, userPolicy);

        // Assert
        effective.FaceMode.Should().Be(globalPolicy.FaceMode);
    }

    [Fact]
    public void SecurityRiskAssessmentService_ImpossibleTravel_CalculatesHighRiskScore()
    {
        // Arrange
        var service = new SecurityRiskAssessmentService();
        var incidents = new List<SecurityIncident>();

        var london = new GpsCoordinate(51.5074, -0.1278);
        var paris = new GpsCoordinate(48.8566, 2.3522);
        var now = DateTime.UtcNow;

        // 343 km in 1 minute = >20,000 km/h (Impossible travel!)
        var riskScore = service.CalculateRiskScore(incidents, london, now.AddMinutes(-1), paris, now);

        // Assert
        riskScore.Should().BeGreaterThanOrEqualTo(80);
    }
}
