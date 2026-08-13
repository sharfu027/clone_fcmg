using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Services;

public sealed class RedisIdempotencyStore : IIdempotencyStore
{
    private readonly ICacheService _cacheService;

    public RedisIdempotencyStore(ICacheService cacheService)
    {
        _cacheService = cacheService;
    }

    public async Task<bool> TryAcquireKeyAsync(string key, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"idempotency:lock:{key}";
        var existingLock = await _cacheService.GetAsync<string>(cacheKey, cancellationToken);
        if (existingLock is not null)
        {
            return false;
        }

        await _cacheService.SetAsync(cacheKey, "locked", expiration, cancellationToken);
        return true;
    }

    public async Task SaveResponseAsync(string key, int statusCode, string bodyContent, TimeSpan expiration, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"idempotency:response:{key}";
        var response = new IdempotentResponse(statusCode, bodyContent);
        await _cacheService.SetAsync(cacheKey, response, expiration, cancellationToken);
    }

    public async Task<IdempotentResponse?> GetResponseAsync(string key, CancellationToken cancellationToken = default)
    {
        var cacheKey = $"idempotency:response:{key}";
        return await _cacheService.GetAsync<IdempotentResponse>(cacheKey, cancellationToken);
    }
}
