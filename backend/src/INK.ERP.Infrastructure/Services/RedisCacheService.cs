using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Services;

public sealed class RedisCacheService : ICacheService
{
    private readonly IMemoryCache _memoryCache;
    private readonly ILogger<RedisCacheService> _logger;

    public RedisCacheService(IMemoryCache memoryCache, ILogger<RedisCacheService> logger)
    {
        _memoryCache = memoryCache;
        _logger = logger;
    }

    public Task<T?> GetAsync<T>(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            if (_memoryCache.TryGetValue(key, out T? cachedValue))
            {
                return Task.FromResult(cachedValue);
            }
            return Task.FromResult<T?>(default);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Memory cache GET operation failed for key '{CacheKey}'. Falling back to primary data source.", key);
            return Task.FromResult<T?>(default);
        }
    }

    public Task SetAsync<T>(string key, T value, TimeSpan? expiration = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var options = new MemoryCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(30)
            };
            _memoryCache.Set(key, value, options);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Memory cache SET operation failed for key '{CacheKey}'. Proceeding without cache.", key);
        }
        return Task.CompletedTask;
    }

    public Task RemoveAsync(string key, CancellationToken cancellationToken = default)
    {
        try
        {
            _memoryCache.Remove(key);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Memory cache REMOVE operation failed for key '{CacheKey}'. Proceeding without cache.", key);
        }
        return Task.CompletedTask;
    }
}
