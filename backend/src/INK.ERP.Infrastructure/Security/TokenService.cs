using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Infrastructure.Options;

namespace INK.ERP.Infrastructure.Security;

public sealed class TokenService : ITokenService
{
    private readonly JwtOptions _jwtOptions;
    private readonly IUnitOfWork _unitOfWork;

    public TokenService(IOptions<JwtOptions> jwtOptions, IUnitOfWork unitOfWork)
    {
        _jwtOptions = jwtOptions.Value;
        _unitOfWork = unitOfWork;
    }

    public string GenerateJwtToken(
        ApplicationUser user,
        IEnumerable<string> roles,
        IEnumerable<string> permissions,
        IEnumerable<Claim>? customClaims = null)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_jwtOptions.Secret);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString())
        };

        if (roles != null)
        {
            claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));
        }

        if (permissions != null)
        {
            claims.AddRange(permissions.Select(perm => new Claim("permission", perm)));
        }

        if (customClaims != null)
        {
            claims.AddRange(customClaims);
        }

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddMinutes(_jwtOptions.ExpiryMinutes <= 0 ? 60 : _jwtOptions.ExpiryMinutes),
            Issuer = _jwtOptions.Issuer,
            Audience = _jwtOptions.Audience,
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public (RefreshToken RefreshToken, string RawToken) GenerateRefreshToken(Guid userId, string createdByIp, string? familyId = null)
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var rawToken = Convert.ToBase64String(randomBytes);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = rawToken,
            ExpiresUtc = DateTime.UtcNow.AddDays(7),
            CreatedByIp = createdByIp,
            FamilyId = string.IsNullOrEmpty(familyId) ? Guid.NewGuid().ToString() : familyId
        };

        return (refreshToken, rawToken);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = !string.IsNullOrEmpty(_jwtOptions.Audience),
            ValidAudience = _jwtOptions.Audience,
            ValidateIssuer = !string.IsNullOrEmpty(_jwtOptions.Issuer),
            ValidIssuer = _jwtOptions.Issuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Secret)),
            ValidateLifetime = false
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        try
        {
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken ||
                !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256Signature, StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }
            return principal;
        }
        catch
        {
            return null;
        }
    }

    public bool ValidateToken(string token)
    {
        var principal = GetPrincipalFromExpiredToken(token);
        return principal != null;
    }

    public async Task<Result<(string NewAccessToken, RefreshToken NewRefreshToken)>> RotateRefreshTokenAsync(
        string refreshTokenValue, string createdByIp, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<RefreshToken>();
        var existingTokens = await repo.FindAsync(r => r.Token == refreshTokenValue && !r.IsDeleted, cancellationToken);
        var existing = existingTokens.FirstOrDefault();

        if (existing == null || existing.IsRevoked || existing.IsExpired)
        {
            return Result.Failure<(string, RefreshToken)>(Error.Unauthorized("Auth.InvalidToken", "Refresh token is invalid or expired."));
        }

        existing.RevokedUtc = DateTime.UtcNow;
        existing.RevokedByIp = createdByIp;
        existing.ReasonRevoked = "Replaced by new token";
        repo.Update(existing);

        var (newRefreshToken, rawToken) = GenerateRefreshToken(existing.UserId, createdByIp, existing.FamilyId);
        await repo.AddAsync(newRefreshToken, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var user = await userRepo.GetByIdAsync(existing.UserId, cancellationToken);
        var newAccessToken = user != null ? GenerateJwtToken(user, Array.Empty<string>(), Array.Empty<string>()) : string.Empty;

        return Result.Success((newAccessToken, newRefreshToken));
    }

    public async Task<Result> RevokeRefreshTokenAsync(
        string refreshTokenValue, string reason, string revokedByIp, CancellationToken cancellationToken = default)
    {
        var repo = _unitOfWork.Repository<RefreshToken>();
        var existingTokens = await repo.FindAsync(r => r.Token == refreshTokenValue && !r.IsDeleted, cancellationToken);
        var existing = existingTokens.FirstOrDefault();

        if (existing == null)
        {
            return Result.Failure(Error.NotFound("Auth.TokenNotFound", "Refresh token not found."));
        }

        existing.RevokedUtc = DateTime.UtcNow;
        existing.RevokedByIp = revokedByIp;
        existing.ReasonRevoked = reason;
        repo.Update(existing);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
