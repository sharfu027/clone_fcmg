using Microsoft.EntityFrameworkCore;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Persistence;

namespace INK.ERP.Infrastructure.Persistence.Repositories.Security;

public static class SecurityCompiledQueries
{
    public static readonly Func<AppDbContext, Guid, Task<FaceProfile?>> GetFaceProfileByUserId =
        EF.CompileAsyncQuery((AppDbContext db, Guid userId) =>
            db.Set<FaceProfile>()
                .Include(p => p.Templates)
                .Include(p => p.VerificationLogs)
                .Include(p => p.EnrollmentLogs)
                .FirstOrDefault(p => p.UserId == userId && !p.IsDeleted));

    public static readonly Func<AppDbContext, Guid, string, Task<RegisteredDevice?>> GetDeviceByFingerprint =
        EF.CompileAsyncQuery((AppDbContext db, Guid userId, string hash) =>
            db.Set<RegisteredDevice>()
                .FirstOrDefault(d => d.UserId == userId && d.Fingerprint.FingerprintHash == hash && !d.IsDeleted));

    public static readonly Func<AppDbContext, Task<SecurityPolicy?>> GetActiveGlobalPolicy =
        EF.CompileAsyncQuery((AppDbContext db) =>
            db.Set<SecurityPolicy>()
                .FirstOrDefault(p => p.IsActive && !p.IsDeleted));

    public static readonly Func<AppDbContext, IAsyncEnumerable<SecurityIncident>> GetCriticalUnresolvedIncidents =
        EF.CompileAsyncQuery((AppDbContext db) =>
            db.Set<SecurityIncident>()
                .Where(i => i.Severity == IncidentSeverity.Critical && !i.IsResolved && !i.IsDeleted));
}
