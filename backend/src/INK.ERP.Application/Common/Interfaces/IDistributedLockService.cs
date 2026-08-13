namespace INK.ERP.Application.Common.Interfaces;

public interface IDistributedLockService
{
    Task<bool> AcquireLockAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default);
    Task ReleaseLockAsync(string key, CancellationToken cancellationToken = default);
}

public interface IPostgresAdvisoryLockService
{
    Task<bool> AcquireAdvisoryLockAsync(int lockId, CancellationToken cancellationToken = default);
    Task ReleaseAdvisoryLockAsync(int lockId, CancellationToken cancellationToken = default);
}
