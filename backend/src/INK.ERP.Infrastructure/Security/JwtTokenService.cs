using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Infrastructure.Options;

namespace INK.ERP.Infrastructure.Security;

public class JwtTokenService : ITokenService
{
    private readonly JwtOptions _jwtOptions;
    private readonly SecurityOptions _securityOptions;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPermissionResolver _permissionResolver;
    private readonly IDateTime _dateTime;
    private readonly ILogger<JwtTokenService> _logger;

    public JwtTokenService(
        IOptions<JwtOptions> jwtOptions,
        IOptions<SecurityOptions> securityOptions,
        IUnitOfWork unitOfWork,
        IPermissionResolver permissionResolver,
        IDateTime dateTime,
        ILogger<JwtTokenService> logger)
    {
        _jwtOptions = jwtOptions.Value;
        _securityOptions = securityOptions.Value;
        _unitOfWork = unitOfWork;
        _permissionResolver = permissionResolver;
        _dateTime = dateTime;
        _logger = logger;
    }

    public string GenerateJwtToken(ApplicationUser user, IEnumerable<string> roles, IEnumerable<string> permissions, IEnumerable<Claim>? customClaims = null)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(JwtRegisteredClaimNames.UniqueName, user.UserName ?? string.Empty),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        foreach (var permission in permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        if (customClaims != null)
        {
            claims.AddRange(customClaims);
        }

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = _dateTime.UtcNow.AddMinutes(_jwtOptions.ExpiryMinutes);

        var token = new JwtSecurityToken(
            issuer: _jwtOptions.Issuer,
            audience: _jwtOptions.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public (RefreshToken RefreshToken, string RawToken) GenerateRefreshToken(Guid userId, string createdByIp, string? familyId = null)
    {
        var randomNumber = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        var rawToken = Convert.ToBase64String(randomNumber);

        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = rawToken,
            ExpiresUtc = _dateTime.UtcNow.AddDays(_securityOptions.RefreshTokenExpiryDays),
            CreatedAtUtc = _dateTime.UtcNow,
            CreatedByIp = createdByIp,
            FamilyId = string.IsNullOrWhiteSpace(familyId) ? Guid.NewGuid().ToString("N") : familyId
        };

        return (refreshToken, rawToken);
    }

    public ClaimsPrincipal? GetPrincipalFromExpiredToken(string token)
    {
        var tokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = _jwtOptions.Audience,
            ValidateIssuer = true,
            ValidIssuer = _jwtOptions.Issuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Secret)),
            ValidateLifetime = false // Ignore expiration to read claims
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out var securityToken);

        if (securityToken is not JwtSecurityToken jwtSecurityToken ||
            !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
        {
            return null;
        }

        return principal;
    }

    public bool ValidateToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwtOptions.Secret)),
                ValidateIssuer = true,
                ValidIssuer = _jwtOptions.Issuer,
                ValidateAudience = true,
                ValidAudience = _jwtOptions.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            }, out _);

            return true;
        }
        catch
        {
            return false;
        }
    }

    public async Task<Result<(string NewAccessToken, RefreshToken NewRefreshToken)>> RotateRefreshTokenAsync(string refreshTokenValue, string createdByIp, CancellationToken cancellationToken = default)
    {
        var refreshTokenRepo = _unitOfWork.Repository<RefreshToken>();

        var existingTokens = await refreshTokenRepo.FindAsync(r => r.Token == refreshTokenValue && !r.IsDeleted, cancellationToken);
        var existingToken = existingTokens.FirstOrDefault();

        if (existingToken is null)
        {
            return Result.Failure<(string, RefreshToken)>(new Error("IAM.TOKEN.INVALID", "Invalid refresh token.", ErrorType.Unauthorized));
        }

        // Reuse Detection: If token was already revoked, someone is re-using a compromised token!
        if (existingToken.RevokedUtc != null)
        {
            _logger.LogWarning("Refresh token reuse detected for User {UserId}, Family {FamilyId}. Revoking entire token family.", existingToken.UserId, existingToken.FamilyId);

            var familyTokens = await refreshTokenRepo.FindAsync(r => r.FamilyId == existingToken.FamilyId && r.RevokedUtc == null && !r.IsDeleted, cancellationToken);
            foreach (var token in familyTokens)
            {
                token.RevokedUtc = _dateTime.UtcNow;
                token.RevokedByIp = createdByIp;
                token.ReasonRevoked = "Token reuse detected (security breach)";
                refreshTokenRepo.Update(token);
            }
            await _unitOfWork.SaveChangesAsync(cancellationToken);

            return Result.Failure<(string, RefreshToken)>(new Error("IAM.TOKEN.REUSE_DETECTED", "Token reuse detected. All sessions in family revoked.", ErrorType.Unauthorized));
        }

        if (existingToken.ExpiresUtc <= _dateTime.UtcNow)
        {
            return Result.Failure<(string, RefreshToken)>(new Error("IAM.TOKEN.EXPIRED", "Refresh token has expired.", ErrorType.Unauthorized));
        }

        var (newRefreshToken, rawToken) = GenerateRefreshToken(existingToken.UserId, createdByIp, existingToken.FamilyId);

        existingToken.RevokedUtc = _dateTime.UtcNow;
        existingToken.RevokedByIp = createdByIp;
        existingToken.ReplacedByToken = rawToken;

        refreshTokenRepo.Update(existingToken);
        await refreshTokenRepo.AddAsync(newRefreshToken, cancellationToken);

        var userRepo = _unitOfWork.Repository<ApplicationUser>();
        var userRoleRepo = _unitOfWork.Repository<UserRole>();
        var roleRepo = _unitOfWork.Repository<ApplicationRole>();

        var user = await userRepo.GetByIdAsync(existingToken.UserId, cancellationToken);
        if (user is null || !user.IsActive || user.IsDeleted)
        {
            return Result.Failure<(string, RefreshToken)>(new Error("IAM.USER.INACTIVE", "User account is inactive or disabled.", ErrorType.Unauthorized));
        }

        var userRoles = await userRoleRepo.FindAsync(ur => ur.UserId == user.Id && !ur.IsDeleted, cancellationToken);
        var roleIds = userRoles.Select(ur => ur.RoleId).ToList();
        var roles = await roleRepo.FindAsync(r => roleIds.Contains(r.Id) && !r.IsDeleted, cancellationToken);
        var roleNames = roles.Select(r => r.Name ?? r.Code).ToList();

        var permissions = await _permissionResolver.GetPermissionsForUserAsync(user.Id, cancellationToken);

        var newAccessToken = GenerateJwtToken(user, roleNames, permissions);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Token refreshed successfully for User {UserId}", user.Id);

        return Result.Success((newAccessToken, newRefreshToken));
    }

    public async Task<Result> RevokeRefreshTokenAsync(string refreshTokenValue, string reason, string revokedByIp, CancellationToken cancellationToken = default)
    {
        var refreshTokenRepo = _unitOfWork.Repository<RefreshToken>();
        var existingTokens = await refreshTokenRepo.FindAsync(r => r.Token == refreshTokenValue && !r.IsDeleted, cancellationToken);
        var existingToken = existingTokens.FirstOrDefault();

        if (existingToken is null)
        {
            return Result.Failure(new Error("IAM.TOKEN.INVALID", "Invalid refresh token.", ErrorType.NotFound));
        }

        existingToken.RevokedUtc = _dateTime.UtcNow;
        existingToken.RevokedByIp = revokedByIp;
        existingToken.ReasonRevoked = reason;

        refreshTokenRepo.Update(existingToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Refresh token revoked for User {UserId}, Reason: {Reason}", existingToken.UserId, reason);
        return Result.Success();
    }
}
