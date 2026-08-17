using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Asp.Versioning;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using INK.ERP.API.Models;
using INK.ERP.Application.Features.Security.Face;
using INK.ERP.Application.Features.Security.Face.DTOs;

namespace INK.ERP.API.Controllers.Security;

[ApiVersion("1.0")]
[Route("api/v{version:apiVersion}/security/face")]
[EnableRateLimiting("FacePolicy")]
public class FaceController : BaseApiController
{
    private static readonly string[] AllowedMimeTypes = { "image/jpeg", "image/jpg", "image/png" };
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    /// <summary>
    /// Enrolls or registers a user's facial biometric template.
    /// </summary>
    [HttpPost("register")]
    [HttpPost("enroll")]
    [Authorize]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Register([FromForm] EnrollFaceRequest request, CancellationToken cancellationToken)
    {
        var validationError = ValidateImageFile(request.Image);
        if (validationError != null) return validationError;

        using var ms = new MemoryStream();
        await request.Image.CopyToAsync(ms, cancellationToken);
        var imageBytes = ms.ToArray();

        var command = new EnrollFaceCommand(request.UserId, imageBytes, request.AlgorithmVersion ?? "v1.0");
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Enrolls or registers a user's facial biometric template using JSON Base64 payload.
    /// </summary>
    [HttpPost("register-base64")]
    [HttpPost("enroll-base64")]
    [Authorize]
    [ProducesResponseType(typeof(Guid), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterBase64([FromBody] EnrollFaceBase64Request request, CancellationToken cancellationToken)
    {
        byte[] imageBytes = ParseImageData(request.ImageBase64);
        if (imageBytes.Length == 0)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid Image", Detail = "No valid base64 image data provided." });
        }

        // Accept either a real GUID or fall back to the currently authenticated user.
        Guid targetUserId = Guid.TryParse(request.UserId, out var pid) && pid != Guid.Empty
            ? pid
            : GetCurrentUserId();

        if (targetUserId == Guid.Empty)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid User", Detail = "A valid user ID is required for enrollment." });
        }

        var command = new EnrollFaceCommand(targetUserId, imageBytes, request.AlgorithmVersion ?? "v1.0");
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Enables/Reactivates a user's face profile.
    /// </summary>
    [HttpPost("enable")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> EnableFace([FromQuery] string? userId, CancellationToken cancellationToken)
    {
        Guid targetUserId = Guid.TryParse(userId, out var pid) && pid != Guid.Empty ? pid : GetCurrentUserId();
        var command = new ReactivateFaceProfileCommand(targetUserId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Disables/Deactivates a user's face profile.
    /// </summary>
    [HttpPost("disable")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> DisableFace([FromQuery] string? userId, CancellationToken cancellationToken)
    {
        Guid targetUserId = Guid.TryParse(userId, out var pid) && pid != Guid.Empty ? pid : GetCurrentUserId();
        var command = new DeactivateFaceProfileCommand(targetUserId);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Performs biometric face verification against the user's enrolled template.
    /// Supports JSON body base64 data URL payload or binary stream.
    /// </summary>
    [HttpPost("verify")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(FaceVerificationResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Verify([FromBody] VerifyFaceRequest request, CancellationToken cancellationToken)
    {
        // Accept GUID string, username/email, or fall back to the JWT authenticated user
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

        if (targetUserId == Guid.Empty)
        {
            targetUserId = GetCurrentUserId();
        }

        if (targetUserId == Guid.Empty)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid User", Detail = $"No active user account found matching identifier '{request.UserId}'." });
        }

        byte[] imageBytes = ParseImageData(request.ImageBase64 ?? request.ImageBlob);
        if (imageBytes.Length == 0)
        {
            return BadRequest(new ProblemDetails { Title = "Invalid Image", Detail = "No valid image data provided for verification." });
        }

        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var userAgent = Request.Headers.UserAgent.ToString();

        var command = new VerifyFaceBiometricsCommand(
            targetUserId,
            imageBytes,
            request.DeviceId,
            clientIp,
            userAgent);

        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Gets the biometric face profile status for a given user.
    /// </summary>
    [HttpGet("status/{userId?}")]
    [HttpGet("status")]
    [HttpGet("profile")]
    [Authorize]
    [ProducesResponseType(typeof(FaceProfileDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStatus(string? userId, CancellationToken cancellationToken)
    {
        Guid targetUserId = Guid.TryParse(userId, out var pid) && pid != Guid.Empty ? pid : GetCurrentUserId();
        var query = new GetFaceProfileQuery(targetUserId);
        var result = await Mediator.Send(query, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Deactivates/deletes a user's face profile.
    /// </summary>
    [HttpDelete("delete")]
    [HttpDelete("template")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> DeleteTemplate([FromQuery] string? userId, [FromQuery] int? version, CancellationToken cancellationToken)
    {
        Guid targetUserId = Guid.TryParse(userId, out var pid) && pid != Guid.Empty ? pid : GetCurrentUserId();
        var command = new DeleteFaceTemplateCommand(targetUserId, version);
        var result = await Mediator.Send(command, cancellationToken);
        return HandleResult(result);
    }

    /// <summary>
    /// Retrieves face verification attempt logs for audit history.
    /// </summary>
    [HttpGet("history")]
    [HttpGet("audit-logs")]
    [Authorize]
    [ProducesResponseType(typeof(IReadOnlyList<FaceVerificationDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetHistory([FromQuery] string? userId, [FromQuery] SecurityFilterParameters filter, CancellationToken cancellationToken)
    {
        // Accept either a GUID string or fall back to the currently authenticated user.
        // This prevents HTTP 400 model-binding errors when the caller passes a non-GUID identifier.
        Guid targetUserId = Guid.TryParse(userId, out var parsedId) && parsedId != Guid.Empty
            ? parsedId
            : GetCurrentUserId();

        var query = new GetFaceVerificationHistoryQuery(targetUserId);
        var result = await Mediator.Send(query, cancellationToken);
        if (result.IsSuccess && result.Value != null)
        {
            var allLogs = result.Value;
            int totalCount = allLogs.Count;
            var pagedLogs = allLogs.Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize).ToList();
            int totalPages = (int)Math.Ceiling((double)totalCount / filter.PageSize);

            var paginationMetadata = new PaginationMetadata(totalCount, filter.PageSize, filter.Page, totalPages);
            Response.Headers["X-Pagination"] = JsonSerializer.Serialize(paginationMetadata);

            return Ok(pagedLogs);
        }

        return HandleResult(result);
    }


    private Guid GetCurrentUserId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(claim, out var uid) ? uid : Guid.Empty;
    }

    private static byte[] ParseImageData(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return Array.Empty<byte>();

        try
        {
            var clean = input;
            if (clean.Contains(","))
            {
                clean = clean.Split(',')[1];
            }
            return Convert.FromBase64String(clean.Trim());
        }
        catch
        {
            return Array.Empty<byte>();
        }
    }

    private IActionResult? ValidateImageFile(IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid File Payload",
                Detail = "Facial image file is required.",
                Instance = HttpContext.Request.Path
            });
        }

        if (file.Length > MaxFileSizeBytes)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "File Size Exceeded",
                Detail = $"File size ({file.Length / (1024 * 1024)} MB) exceeds maximum allowed limit (5 MB).",
                Instance = HttpContext.Request.Path
            });
        }

        if (!AllowedMimeTypes.Contains(file.ContentType.ToLowerInvariant()))
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Invalid Image MIME Type",
                Detail = $"ContentType '{file.ContentType}' is not allowed. Only JPG, JPEG, and PNG images are accepted.",
                Instance = HttpContext.Request.Path
            });
        }

        return null;
    }
}



public record EnrollFaceBase64Request(
    string UserId,
    string ImageBase64,
    string? AlgorithmVersion = "v1.0");
