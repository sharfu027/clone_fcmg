using INK.ERP.Domain.Entities.Security;
using INK.ERP.Application.Features.Security.Face.DTOs;

namespace INK.ERP.Application.Common.Interfaces;

public interface IFaceProfileRepository : IGenericRepository<FaceProfile>
{
    Task<FaceProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<FaceTemplate?> GetActiveTemplateAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<FaceTemplate?> GetLatestTemplateAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<FaceVerificationSummaryDto?> GetVerificationSummaryAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface ISecurityPolicyRepository : IGenericRepository<SecurityPolicy>
{
    Task<SecurityPolicy?> GetActiveGlobalPolicyAsync(CancellationToken cancellationToken = default);
}

public interface IUserSecurityPolicyRepository : IGenericRepository<UserSecurityPolicy>
{
    Task<UserSecurityPolicy?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
}

public interface IRegisteredDeviceRepository : IGenericRepository<RegisteredDevice>
{
    Task<IReadOnlyList<RegisteredDevice>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<RegisteredDevice?> GetByFingerprintAsync(Guid userId, string fingerprintHash, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RegisteredDevice>> GetTrustedDevicesAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<RegisteredDevice>> GetRecentHeartbeatsAsync(TimeSpan timeSpan, CancellationToken cancellationToken = default);
}

public interface ISecurityIncidentRepository : IGenericRepository<SecurityIncident>
{
    Task<IReadOnlyList<SecurityIncident>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SecurityIncident>> GetOpenIncidentsAsync(Guid? userId = null, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<SecurityIncident>> GetCriticalIncidentsAsync(CancellationToken cancellationToken = default);
}
