using Mapster;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Application.Features.Security.Device.DTOs;
using INK.ERP.Application.Features.Security.Face.DTOs;
using INK.ERP.Application.Features.Security.Incidents.DTOs;
using INK.ERP.Application.Features.Security.Policies.DTOs;

namespace INK.ERP.Application.Features.Security;

public sealed class SecurityMappingConfig : IRegister
{
    public void Register(TypeAdapterConfig config)
    {
        config.NewConfig<FaceTemplate, FaceTemplateDto>()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Version, src => src.Version)
            .Map(dest => dest.AlgorithmVersion, src => src.AlgorithmVersion)
            .Map(dest => dest.QualityScore, src => src.QualityScore)
            .Map(dest => dest.IsActive, src => src.IsActive)
            .Map(dest => dest.CreatedAtUtc, src => src.CreatedAtUtc);

        config.NewConfig<FaceVerificationLog, FaceVerificationDto>()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.MatchScore, src => src.MatchScore)
            .Map(dest => dest.IsSuccessful, src => src.IsSuccessful)
            .Map(dest => dest.DeviceId, src => src.DeviceId)
            .Map(dest => dest.FailureReason, src => src.FailureReason)
            .Map(dest => dest.CreatedAtUtc, src => src.CreatedAtUtc);

        config.NewConfig<RegisteredDevice, RegisteredDeviceDto>()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.UserId, src => src.UserId)
            .Map(dest => dest.DeviceName, src => src.DeviceName)
            .Map(dest => dest.FingerprintHash, src => src.Fingerprint.FingerprintHash)
            .Map(dest => dest.ClientType, src => src.Fingerprint.ClientType)
            .Map(dest => dest.DeviceModel, src => src.Fingerprint.DeviceModel)
            .Map(dest => dest.OperatingSystem, src => src.Fingerprint.OperatingSystem)
            .Map(dest => dest.Status, src => src.Status.ToString())
            .Map(dest => dest.ApprovedBy, src => src.ApprovedBy)
            .Map(dest => dest.ApprovedAtUtc, src => src.ApprovedAtUtc)
            .Map(dest => dest.LastHeartbeatUtc, src => src.LastHeartbeatUtc)
            .Map(dest => dest.LastIpAddress, src => src.LastIpAddress);

        config.NewConfig<SecurityPolicy, SecurityPolicyDto>()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Name, src => src.Name)
            .Map(dest => dest.IsActive, src => src.IsActive)
            .Map(dest => dest.FaceMode, src => src.FaceMode.ToString())
            .Map(dest => dest.MinFaceConfidenceScore, src => src.MinFaceConfidenceScore)
            .Map(dest => dest.GpsMode, src => src.GpsMode.ToString())
            .Map(dest => dest.MaxAllowedGpsRadiusMeters, src => src.MaxAllowedGpsRadiusMeters)
            .Map(dest => dest.PasswordMinLength, src => src.PasswordMinLength)
            .Map(dest => dest.PasswordRequireSpecialChar, src => src.PasswordRequireSpecialChar)
            .Map(dest => dest.LockoutThresholdAttempts, src => src.LockoutThresholdAttempts)
            .Map(dest => dest.AttendanceMode, src => src.AttendanceMode.ToString())
            .Map(dest => dest.RequireDeviceRegistration, src => src.RequireDeviceRegistration)
            .Map(dest => dest.MaxDevicesPerUser, src => src.MaxDevicesPerUser);

        config.NewConfig<SecurityIncident, SecurityIncidentDto>()
            .Map(dest => dest.Id, src => src.Id)
            .Map(dest => dest.Type, src => src.Type.ToString())
            .Map(dest => dest.Severity, src => src.Severity.ToString())
            .Map(dest => dest.Description, src => src.Description)
            .Map(dest => dest.UserId, src => src.UserId)
            .Map(dest => dest.IpAddress, src => src.IpAddress)
            .Map(dest => dest.IsResolved, src => src.IsResolved)
            .Map(dest => dest.IsEscalated, src => src.IsEscalated)
            .Map(dest => dest.ResolutionNotes, src => src.ResolutionNotes)
            .Map(dest => dest.ResolvedAtUtc, src => src.ResolvedAtUtc)
            .Map(dest => dest.CreatedAtUtc, src => src.CreatedAtUtc);
    }
}
