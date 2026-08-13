using System;
using System.Threading;
using System.Threading.Tasks;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using INK.ERP.Application.Features.IAM.Commands.Auth;
using INK.ERP.Application.Features.IAM.Commands.Users;
using INK.ERP.Application.Features.IAM.DTOs;

namespace INK.ERP.API.Controllers;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/auth")]
public sealed class AuthController : BaseApiController
{
    /// <summary>
    /// Authenticate user credentials and issue production Access & Refresh tokens.
    /// </summary>
    [HttpPost("login")]
    [AllowAnonymous]
    [EnableRateLimiting("AuthPolicy")]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var userAgent = Request.Headers.UserAgent.ToString();

        var command = new LoginCommand(request.Username, request.Password, clientIp, userAgent);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Refresh access token using a valid refresh token.
    /// </summary>
    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(AuthResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var command = new RefreshTokenCommand(request.RefreshToken, clientIp);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Logout current session by revoking refresh token.
    /// </summary>
    [HttpPost("logout")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequest request, CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var command = new RevokeTokenCommand(request.RefreshToken, "User logged out", clientIp);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Revoke a specific refresh token.
    /// </summary>
    [HttpPost("revoke")]
    [Authorize(Policy = "IAM.Users.Update")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Revoke([FromBody] RevokeTokenRequest request, CancellationToken cancellationToken)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var command = new RevokeTokenCommand(request.RefreshToken, request.Reason ?? "Administrative revocation", clientIp);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Change password for authenticated user.
    /// </summary>
    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request, CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        if (!Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized();
        }

        var command = new ChangePasswordCommand(userId, request.CurrentPassword, request.NewPassword);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Request password reset token.
    /// </summary>
    [HttpPost("forgot-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var command = new ForgotPasswordCommand(request.Email);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Reset password using token.
    /// </summary>
    [HttpPost("reset-password")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request, CancellationToken cancellationToken)
    {
        var command = new ResetPasswordCommand(request.Email, request.Token, request.NewPassword);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Verify email address using token.
    /// </summary>
    [HttpPost("verify-email")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequest request, CancellationToken cancellationToken)
    {
        var command = new VerifyEmailCommand(request.UserId, request.Token);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Resend email verification token.
    /// </summary>
    [HttpPost("resend-verification")]
    [AllowAnonymous]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ResendVerification([FromBody] ForgotPasswordRequest request, CancellationToken cancellationToken)
    {
        var command = new ResendVerificationCommand(request.Email);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Biometric face authentication verification endpoint.
    /// </summary>
    [HttpPost("verify-face")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(INK.ERP.Application.Features.Security.Face.DTOs.FaceVerificationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> VerifyFace([FromBody] INK.ERP.Application.Features.Security.Face.DTOs.VerifyFaceRequest request, CancellationToken cancellationToken)
    {
        // 1. Resolve User ID: Accept Guid string, username, email, or fall back to JWT claim
        Guid targetUserId = Guid.Empty;

        if (!string.IsNullOrWhiteSpace(request.UserId))
        {
            if (Guid.TryParse(request.UserId, out var parsedUid) && parsedUid != Guid.Empty)
            {
                targetUserId = parsedUid;
            }
            else
            {
                var userRepo = HttpContext.RequestServices.GetRequiredService<INK.ERP.Application.Common.Interfaces.IUserRepository>();
                var search = request.UserId.Trim();
                var matches = await userRepo.FindAsync(u => u.UserName == search || u.Email == search, cancellationToken);
                var foundUser = matches.FirstOrDefault();
                if (foundUser != null)
                {
                    targetUserId = foundUser.Id;
                }
            }
        }

        if (targetUserId == Guid.Empty && Guid.TryParse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value, out var claimUid))
        {
            targetUserId = claimUid;
        }

        if (targetUserId == Guid.Empty)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid User", Detail = $"No active user account found matching identifier '{request.UserId}'." });
        }

        // 2. Parse Image Bytes: Support either ImageBase64 or ImageBlob payload field
        byte[] imageBytes = ParseImageData(request.ImageBase64 ?? request.ImageBlob);
        if (imageBytes.Length == 0)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid Image", Detail = "No valid image data provided for verification." });
        }

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var userAgent = Request.Headers.UserAgent.ToString();

        var command = new INK.ERP.Application.Features.Security.Face.VerifyFaceBiometricsCommand(
            targetUserId,
            imageBytes,
            request.DeviceId,
            clientIp,
            userAgent);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    [HttpGet("claims")]
    [Authorize]
    public IActionResult GetClaims()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value }).ToList();
        return Ok(claims);
    }

    private static byte[] ParseImageData(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return Array.Empty<byte>();

        try
        {
            var clean = input.Contains(",") ? input.Split(',')[1] : input;
            return Convert.FromBase64String(clean.Trim());
        }
        catch
        {
            return Array.Empty<byte>();
        }
    }
}




public record LoginRequest(string Username, string Password);
public record RefreshTokenRequest(string RefreshToken);
public record RevokeTokenRequest(string RefreshToken, string? Reason);
public record ChangePasswordRequest(string CurrentPassword, string NewPassword);
public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Token, string NewPassword);
public record VerifyEmailRequest(Guid UserId, string Token);
