using StackExchange.Redis;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Services;

public sealed class RedisDistributedLockService : IDistributedLockService
{
    private readonly IConnectionMultiplexer _redis;
    private readonly string _lockValue = Guid.NewGuid().ToString();

    public RedisDistributedLockService(IConnectionMultiplexer redis)
    {
        _redis = redis;
    }

    public async Task<bool> AcquireLockAsync(string key, TimeSpan expiry, CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        var lockKey = $"lock:{key}";
        return await db.StringSetAsync(lockKey, _lockValue, expiry, When.NotExists);
    }

    public async Task ReleaseLockAsync(string key, CancellationToken cancellationToken = default)
    {
        var db = _redis.GetDatabase();
        var lockKey = $"lock:{key}";

        // Use Lua script to release lock only if the current instance is the owner (prevents deleting other instances' locks)
        var luaScript = @"
            if redis.call('get', KEYS[1]) == ARGV[1] then
                return redis.call('del', KEYS[1])
            else
                return 0
            end";

        await db.ScriptEvaluateAsync(luaScript, new RedisKey[] { lockKey }, new RedisValue[] { _lockValue });
    }
}
