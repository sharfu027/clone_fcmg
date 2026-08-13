using Microsoft.EntityFrameworkCore;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Security.Face.DTOs;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories.Security;

public class FaceProfileRepository : GenericRepository<FaceProfile>, IFaceProfileRepository
{
    public FaceProfileRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<FaceProfile?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await SecurityCompiledQueries.GetFaceProfileByUserId(_context, userId);
    }

    public async Task<FaceTemplate?> GetActiveTemplateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var profile = await GetByUserIdAsync(userId, cancellationToken);
        return profile?.Templates.FirstOrDefault(t => t.IsActive && !t.IsDeleted);
    }

    public async Task<FaceTemplate?> GetLatestTemplateAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var profile = await GetByUserIdAsync(userId, cancellationToken);
        return profile?.Templates.OrderByDescending(t => t.Version).FirstOrDefault(t => !t.IsDeleted);
    }

    public async Task<FaceVerificationSummaryDto?> GetVerificationSummaryAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var profile = await GetByUserIdAsync(userId, cancellationToken);
        if (profile == null) return null;

        var logs = profile.VerificationLogs.ToList();
        int total = logs.Count;
        int successful = logs.Count(l => l.IsSuccessful);
        int failed = total - successful;
        float avgScore = total > 0 ? logs.Average(l => l.MatchScore) : 0.0f;
        DateTime? lastUtc = logs.OrderByDescending(l => l.CreatedAtUtc).FirstOrDefault()?.CreatedAtUtc;

        return new FaceVerificationSummaryDto(userId, total, successful, failed, avgScore, lastUtc);
    }
}

public class SecurityPolicyRepository : GenericRepository<SecurityPolicy>, ISecurityPolicyRepository
{
    public SecurityPolicyRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<SecurityPolicy?> GetActiveGlobalPolicyAsync(CancellationToken cancellationToken = default)
    {
        return await SecurityCompiledQueries.GetActiveGlobalPolicy(_context);
    }
}

public class UserSecurityPolicyRepository : GenericRepository<UserSecurityPolicy>, IUserSecurityPolicyRepository
{
    public UserSecurityPolicyRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<UserSecurityPolicy?> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.FirstOrDefaultAsync(p => p.UserId == userId && !p.IsDeleted, cancellationToken);
    }
}

public class RegisteredDeviceRepository : GenericRepository<RegisteredDevice>, IRegisteredDeviceRepository
{
    public RegisteredDeviceRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<RegisteredDevice>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(d => d.UserId == userId && !d.IsDeleted).ToListAsync(cancellationToken);
    }

    public async Task<RegisteredDevice?> GetByFingerprintAsync(Guid userId, string fingerprintHash, CancellationToken cancellationToken = default)
    {
        return await SecurityCompiledQueries.GetDeviceByFingerprint(_context, userId, fingerprintHash);
    }

    public async Task<IReadOnlyList<RegisteredDevice>> GetTrustedDevicesAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(d => d.UserId == userId && (d.Status == DeviceStatus.Trusted || d.Status == DeviceStatus.Approved) && !d.IsDeleted).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<RegisteredDevice>> GetRecentHeartbeatsAsync(TimeSpan timeSpan, CancellationToken cancellationToken = default)
    {
        var cutoff = DateTime.UtcNow - timeSpan;
        return await _dbSet.Where(d => d.LastHeartbeatUtc >= cutoff && !d.IsDeleted).ToListAsync(cancellationToken);
    }
}

public class SecurityIncidentRepository : GenericRepository<SecurityIncident>, ISecurityIncidentRepository
{
    public SecurityIncidentRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<IReadOnlyList<SecurityIncident>> GetByUserIdAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(i => i.UserId == userId && !i.IsDeleted).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SecurityIncident>> GetOpenIncidentsAsync(Guid? userId = null, CancellationToken cancellationToken = default)
    {
        return await _dbSet.Where(i => !i.IsResolved && !i.IsDeleted && (!userId.HasValue || i.UserId == userId.Value)).ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<SecurityIncident>> GetCriticalIncidentsAsync(CancellationToken cancellationToken = default)
    {
        var list = new List<SecurityIncident>();
        await foreach (var incident in SecurityCompiledQueries.GetCriticalUnresolvedIncidents(_context))
        {
            list.Add(incident);
        }
        return list;
    }
}
