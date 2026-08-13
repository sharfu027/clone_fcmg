using FluentAssertions;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Domain.Services.Security;
using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Application.Features.Security.Device;
using INK.ERP.Application.Features.Security.Incidents;
using INK.ERP.Application.Features.Security.Risk;

namespace INK.ERP.UnitTests.Features.Security;

public sealed class DeviceAndIncidentHandlerTests
{
    private readonly Mock<IUnitOfWork> _unitOfWorkMock;

    public DeviceAndIncidentHandlerTests()
    {
        _unitOfWorkMock = new Mock<IUnitOfWork>();
    }

    [Fact]
    public async Task ApproveDevice_ValidDevice_SetsStatusApproved()
    {
        // Arrange
        var deviceRepoMock = new Mock<IGenericRepository<RegisteredDevice>>();
        _unitOfWorkMock.Setup(u => u.Repository<RegisteredDevice>()).Returns(deviceRepoMock.Object);

        var deviceId = Guid.NewGuid();
        var fingerprint = new DeviceFingerprint("hash123", "Mobile", "iPhone 15", "iOS 17");
        var device = new RegisteredDevice(Guid.NewGuid(), "Work Phone", fingerprint);

        deviceRepoMock.Setup(r => r.GetByIdAsync(deviceId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(device);

        var handler = new ApproveDeviceCommandHandler(_unitOfWorkMock.Object);
        var command = new ApproveDeviceCommand(deviceId, "AdminUser");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        device.Status.Should().Be(DeviceStatus.Approved);
    }

    [Fact]
    public async Task RaiseSecurityIncident_HighSeverity_CreatesIncident()
    {
        // Arrange
        var incidentRepoMock = new Mock<IGenericRepository<SecurityIncident>>();
        _unitOfWorkMock.Setup(u => u.Repository<SecurityIncident>()).Returns(incidentRepoMock.Object);
        var loggerMock = new Mock<ILogger<RaiseSecurityIncidentCommandHandler>>();

        var handler = new RaiseSecurityIncidentCommandHandler(_unitOfWorkMock.Object, loggerMock.Object);
        var command = new RaiseSecurityIncidentCommand(IncidentType.GpsSpoofing, IncidentSeverity.High, "Spoofed GPS signal detected");

        // Act
        var result = await handler.Handle(command, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.Should().NotBeEmpty();
    }

    [Fact]
    public async Task CalculateRiskQuery_ValidIncidents_CalculatesRiskScore()
    {
        // Arrange
        var incidentRepoMock = new Mock<IGenericRepository<SecurityIncident>>();
        _unitOfWorkMock.Setup(u => u.Repository<SecurityIncident>()).Returns(incidentRepoMock.Object);

        var userId = Guid.NewGuid();
        incidentRepoMock.Setup(r => r.FindAsync(It.IsAny<System.Linq.Expressions.Expression<Func<SecurityIncident, bool>>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new List<SecurityIncident> { SecurityIncident.Raise(IncidentType.FaceMismatch, IncidentSeverity.High, "Face mismatch") });

        var riskService = new SecurityRiskAssessmentService();
        var handler = new CalculateRiskQueryHandler(_unitOfWorkMock.Object, riskService);
        var query = new CalculateRiskQuery(userId);

        // Act
        var result = await handler.Handle(query, CancellationToken.None);

        // Assert
        result.IsSuccess.Should().BeTrue();
        result.Value.RiskScore.Should().BeGreaterThanOrEqualTo(50);
        result.Value.HighRiskDetected.Should().BeTrue();
    }
}
