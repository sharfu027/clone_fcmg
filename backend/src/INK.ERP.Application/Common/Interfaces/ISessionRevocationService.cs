namespace INK.ERP.Application.Common.Interfaces;

public interface ISessionRevocationService
{
    void RevokeUserSessions(Guid userId, string reason);
    void RevokeToken(string tokenId, string reason);
    bool IsUserRevoked(Guid userId, DateTime tokenIssuedAtUtc);
    bool IsTokenRevoked(string tokenId);
}
