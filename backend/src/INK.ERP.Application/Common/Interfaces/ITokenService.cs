using System.Security.Claims;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;

namespace INK.ERP.Application.Common.Interfaces;

public interface ITokenService
{
    string GenerateJwtToken(ApplicationUser user, IEnumerable<string> roles, IEnumerable<string> permissions, IEnumerable<Claim>? customClaims = null);
    (RefreshToken RefreshToken, string RawToken) GenerateRefreshToken(Guid userId, string createdByIp, string? familyId = null);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    bool ValidateToken(string token);
    Task<Result<(string NewAccessToken, RefreshToken NewRefreshToken)>> RotateRefreshTokenAsync(string refreshTokenValue, string createdByIp, CancellationToken cancellationToken = default);
    Task<Result> RevokeRefreshTokenAsync(string refreshTokenValue, string reason, string revokedByIp, CancellationToken cancellationToken = default);
}
