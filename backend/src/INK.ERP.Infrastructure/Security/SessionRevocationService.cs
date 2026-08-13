using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.Infrastructure.Security;

public sealed class SessionRevocationService : ISessionRevocationService
{
    private static readonly ConcurrentDictionary<Guid, DateTime> _revokedUserTimestamps = new();
    private static readonly ConcurrentDictionary<string, DateTime> _revokedTokens = new();
    private readonly ILogger<SessionRevocationService> _logger;

    public SessionRevocationService(ILogger<SessionRevocationService> logger)
    {
        _logger = logger;
    }

    public void RevokeUserSessions(Guid userId, string reason)
    {
        var now = DateTime.UtcNow;
        _revokedUserTimestamps[userId] = now;
        _logger.LogWarning("Active sessions revoked for User {UserId} at {Timestamp}. Reason: {Reason}", userId, now, reason);
    }

    public void RevokeToken(string tokenId, string reason)
    {
        if (string.IsNullOrWhiteSpace(tokenId)) return;
        _revokedTokens[tokenId] = DateTime.UtcNow;
        _logger.LogWarning("Token {TokenId} explicitly revoked. Reason: {Reason}", tokenId, reason);
    }

    public bool IsUserRevoked(Guid userId, DateTime tokenIssuedAtUtc)
    {
        if (_revokedUserTimestamps.TryGetValue(userId, out var revokedAt))
        {
            return tokenIssuedAtUtc < revokedAt;
        }
        return false;
    }

    public bool IsTokenRevoked(string tokenId)
    {
        if (string.IsNullOrWhiteSpace(tokenId)) return false;
        return _revokedTokens.ContainsKey(tokenId);
    }
}
