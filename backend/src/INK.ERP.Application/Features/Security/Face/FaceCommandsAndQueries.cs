using System.Diagnostics;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Application.Features.Security.Face.DTOs;
using INK.ERP.Application.Features.Security.Face.Workflows;

namespace INK.ERP.Application.Features.Security.Face;

// ----------------------------------------------------
// 0. VerifyFaceBiometricsCommand
// ----------------------------------------------------
public sealed record VerifyFaceBiometricsCommand(
    Guid UserId,
    byte[] ImageData,
    string? DeviceId = null,
    string? IpAddress = null,
    string? UserAgent = null) : ICommand<Result<FaceVerificationResultDto>>;

public sealed class VerifyFaceBiometricsCommandHandler : IRequestHandler<VerifyFaceBiometricsCommand, Result<FaceVerificationResultDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFaceProfileRepository _faceProfileRepository;
    private readonly IFaceEmbeddingService _embeddingService;
    private readonly IFaceComparisonService _comparisonService;
    private readonly IFaceVerificationWorkflow _verificationWorkflow;
    private readonly ILogger<VerifyFaceBiometricsCommandHandler> _logger;

    public VerifyFaceBiometricsCommandHandler(
        IUnitOfWork unitOfWork,
        IFaceProfileRepository faceProfileRepository,
        IFaceEmbeddingService embeddingService,
        IFaceComparisonService comparisonService,
        IFaceVerificationWorkflow verificationWorkflow,
        ILogger<VerifyFaceBiometricsCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _faceProfileRepository = faceProfileRepository;
        _embeddingService = embeddingService;
        _comparisonService = comparisonService;
        _verificationWorkflow = verificationWorkflow;
        _logger = logger;
    }

    public async Task<Result<FaceVerificationResultDto>> Handle(VerifyFaceBiometricsCommand request, CancellationToken cancellationToken)
    {
        var sw = Stopwatch.StartNew();

        // 1. Generate Embedding from incoming candidate photo
        var embeddingResult = await _embeddingService.GenerateEmbeddingAsync(request.ImageData, cancellationToken);
        if (embeddingResult.IsFailure)
        {
            sw.Stop();
            _logger.LogWarning(
                "[Biometric Verification Audit] UserId: {UserId} | FaceDetected: false | FailureReason: {FailureReason} | ProcessingTimeMs: {ProcessingTimeMs}ms",
                request.UserId, embeddingResult.Error.Code, sw.ElapsedMilliseconds);

            var failDto = new FaceVerificationResultDto(
                Success: false,
                SimilarityScore: 0f,
                ConfidenceScore: 0f,
                Message: embeddingResult.Error.Description,
                FailureReason: embeddingResult.Error.Code,
                ProcessingTimeMs: sw.ElapsedMilliseconds);
            return Result.Success(failDto);
        }

        // 2. Lookup FaceProfile for User with Templates included
        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            sw.Stop();
            _logger.LogWarning("[Biometric Verification Audit] UserId: {UserId} | FailureReason: ProfileNotFound", request.UserId);
            var failDto = new FaceVerificationResultDto(
                Success: false,
                SimilarityScore: 0f,
                ConfidenceScore: 0f,
                Message: "No biometric face profile registered for this user. Please register a face profile first.",
                FailureReason: "PROFILE_NOT_FOUND",
                ProcessingTimeMs: sw.ElapsedMilliseconds);
            return Result.Success(failDto);
        }

        // 3. Compare live candidate embedding against ALL active representative templates for this user
        var activeTemplates = profile.Templates
            .Where(t => t.IsActive && !t.IsDeleted)
            .OrderByDescending(t => t.Version)
            .ToList();

        if (activeTemplates.Count == 0)
        {
            sw.Stop();
            _logger.LogWarning("[Biometric Verification Audit] UserId: {UserId} | FailureReason: NoActiveTemplates", request.UserId);
            var failDto = new FaceVerificationResultDto(
                Success: false,
                SimilarityScore: 0f,
                ConfidenceScore: 0f,
                Message: "No active face template found. Please register your face profile.",
                FailureReason: "NO_ACTIVE_TEMPLATES",
                ProcessingTimeMs: sw.ElapsedMilliseconds);
            return Result.Success(failDto);
        }

        FaceComparisonResult bestResult = new FaceComparisonResult(0.0f, false, 0.0f, double.MaxValue);
        FaceTemplate? bestMatchedTemplate = null;

        // Perform Parallel Multi-Template Comparison
        foreach (var template in activeTemplates)
        {
            var compRes = _comparisonService.Compare(embeddingResult.Value.Embedding.VectorData, template.VectorData);
            if (compRes.SimilarityScore > bestResult.SimilarityScore || (compRes.IsMatch && !bestResult.IsMatch))
            {
                bestResult = compRes;
                bestMatchedTemplate = template;
            }
        }

        // Update health score telemetry on best matched template
        bestMatchedTemplate?.RecordUsage(bestResult.SimilarityScore, bestResult.IsMatch);

        // Production Addition #3: Automatic Re-enrollment Template Replacement on High Confidence Logins (>= 0.85)
        if (bestResult.IsMatch && bestResult.SimilarityScore >= 0.85f)
        {
            profile.AutoReplaceWeakestTemplate(embeddingResult.Value.Embedding, embeddingResult.Value.EmbeddingProvider);
            _logger.LogInformation("[AUTO RE-ENROLLMENT] Updated user template cluster with high-confidence login sample for UserId: {UserId}", request.UserId);
        }

        // Record verification log on profile
        profile.RecordVerification(
            bestResult.SimilarityScore,
            bestResult.IsMatch,
            request.DeviceId,
            bestResult.IsMatch ? null : "LOW_SIMILARITY");

        sw.Stop();

        _logger.LogInformation(
            "[BIOMETRIC FORENSICS VERIFICATION] " +
            "UserId: {UserId} | " +
            "ProfileId: {ProfileId} | " +
            "MatchedTemplateVersion: {MatchedVersion} | " +
            "TotalActiveTemplates: {ActiveTemplatesCount} | " +
            "SimilarityScore: {SimilarityScore:F4} | " +
            "EuclideanDistance: {EuclideanDist:F4} | " +
            "MatchDecision: {MatchDecision} | " +
            "ProcessingTimeMs: {ProcessingTimeMs}ms",
            request.UserId,
            profile.Id,
            bestMatchedTemplate?.Version ?? 0,
            activeTemplates.Count,
            bestResult.SimilarityScore,
            bestResult.EuclideanDistance,
            bestResult.IsMatch ? "MATCH" : "MISMATCH",
            sw.ElapsedMilliseconds);

        var resultDto = new FaceVerificationResultDto(
            Success: bestResult.IsMatch,
            SimilarityScore: bestResult.SimilarityScore,
            ConfidenceScore: bestResult.Confidence,
            Message: bestResult.IsMatch ? "Biometric face verification cleared." : "Face recognition failed: biometric signature mismatch.",
            FailureReason: bestResult.IsMatch ? null : "LOW_SIMILARITY",
            ProcessingTimeMs: sw.ElapsedMilliseconds);

        return Result.Success(resultDto);
    }
}


// ----------------------------------------------------
// 1. EnrollFaceCommand
// ----------------------------------------------------
public sealed record EnrollFaceCommand(
    Guid UserId,
    byte[] ImageData,
    string AlgorithmVersion = "v1.0") : ICommand<Result<Guid>>;

public sealed class EnrollFaceCommandHandler : IRequestHandler<EnrollFaceCommand, Result<Guid>>
{
    private readonly IFaceEnrollmentWorkflow _workflow;

    public EnrollFaceCommandHandler(IFaceEnrollmentWorkflow workflow)
    {
        _workflow = workflow;
    }

    public async Task<Result<Guid>> Handle(EnrollFaceCommand request, CancellationToken cancellationToken)
    {
        var result = await _workflow.ExecuteAsync(request, cancellationToken);
        if (result.IsFailure)
        {
            return Result.Failure<Guid>(result.Error);
        }
        return Result.Success(result.Value.Id);
    }
}

// ----------------------------------------------------
// 2. ReplaceFaceTemplateCommand
// ----------------------------------------------------
public sealed record ReplaceFaceTemplateCommand(Guid UserId, byte[] ImageData) : ICommand<Result<Unit>>;

public sealed class ReplaceFaceTemplateCommandHandler : IRequestHandler<ReplaceFaceTemplateCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFaceProfileRepository _faceProfileRepository;
    private readonly IFaceEmbeddingService _embeddingService;
    private readonly IImageQualityService _qualityService;

    public ReplaceFaceTemplateCommandHandler(IUnitOfWork unitOfWork, IFaceProfileRepository faceProfileRepository, IFaceEmbeddingService embeddingService, IImageQualityService qualityService)
    {
        _unitOfWork = unitOfWork;
        _faceProfileRepository = faceProfileRepository;
        _embeddingService = embeddingService;
        _qualityService = qualityService;
    }

    public async Task<Result<Unit>> Handle(ReplaceFaceTemplateCommand request, CancellationToken cancellationToken)
    {
        var qualityResult = await _qualityService.ValidateQualityAsync(request.ImageData, cancellationToken);
        if (qualityResult.IsFailure || qualityResult.Value < 0.70f)
        {
            return Result.Failure<Unit>(SecurityErrors.Face.QualityCheckFailed("Image quality is insufficient."));
        }

        var embeddingResult = await _embeddingService.GenerateEmbeddingAsync(request.ImageData, cancellationToken);
        if (embeddingResult.IsFailure)
        {
            return Result.Failure<Unit>(embeddingResult.Error);
        }

        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<Unit>(SecurityErrors.Face.ProfileNotFound(request.UserId));
        }

        try
        {
            profile.ReplaceTemplate(embeddingResult.Value.Embedding);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(Unit.Value);
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure<Unit>(new Error("SECURITY.FACE.REPLACE_FAILED", ex.Message, ErrorType.Conflict));
        }
    }
}

// ----------------------------------------------------
// 3. DeactivateFaceProfileCommand & ReactivateFaceProfileCommand
// ----------------------------------------------------
public sealed record DeactivateFaceProfileCommand(Guid UserId) : ICommand<Result<Unit>>;

public sealed class DeactivateFaceProfileCommandHandler : IRequestHandler<DeactivateFaceProfileCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFaceProfileRepository _faceProfileRepository;

    public DeactivateFaceProfileCommandHandler(IUnitOfWork unitOfWork, IFaceProfileRepository faceProfileRepository)
    {
        _unitOfWork = unitOfWork;
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<Unit>> Handle(DeactivateFaceProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<Unit>(SecurityErrors.Face.ProfileNotFound(request.UserId));
        }

        profile.Deactivate();
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed record ReactivateFaceProfileCommand(Guid UserId) : ICommand<Result<Unit>>;

public sealed class ReactivateFaceProfileCommandHandler : IRequestHandler<ReactivateFaceProfileCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFaceProfileRepository _faceProfileRepository;

    public ReactivateFaceProfileCommandHandler(IUnitOfWork unitOfWork, IFaceProfileRepository faceProfileRepository)
    {
        _unitOfWork = unitOfWork;
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<Unit>> Handle(ReactivateFaceProfileCommand request, CancellationToken cancellationToken)
    {
        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<Unit>(SecurityErrors.Face.ProfileNotFound(request.UserId));
        }

        profile.Reactivate();
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 4. RecordFaceVerificationCommand & ArchiveFaceTemplateCommand
// ----------------------------------------------------
public sealed record RecordFaceVerificationCommand(
    Guid UserId,
    float MatchScore,
    bool IsSuccess,
    string? DeviceId = null,
    string? FailureReason = null) : ICommand<Result<Unit>>;

public sealed class RecordFaceVerificationCommandHandler : IRequestHandler<RecordFaceVerificationCommand, Result<Unit>>
{
    private readonly IFaceVerificationWorkflow _workflow;

    public RecordFaceVerificationCommandHandler(IFaceVerificationWorkflow workflow)
    {
        _workflow = workflow;
    }

    public async Task<Result<Unit>> Handle(RecordFaceVerificationCommand request, CancellationToken cancellationToken)
    {
        var result = await _workflow.ExecuteAsync(request, cancellationToken);
        if (result.IsFailure)
        {
            return Result.Failure<Unit>(result.Error);
        }
        return Result.Success(Unit.Value);
    }
}

public sealed record ArchiveFaceTemplateCommand(Guid UserId, int Version) : ICommand<Result<Unit>>;

public sealed class ArchiveFaceTemplateCommandHandler : IRequestHandler<ArchiveFaceTemplateCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFaceProfileRepository _faceProfileRepository;

    public ArchiveFaceTemplateCommandHandler(IUnitOfWork unitOfWork, IFaceProfileRepository faceProfileRepository)
    {
        _unitOfWork = unitOfWork;
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<Unit>> Handle(ArchiveFaceTemplateCommand request, CancellationToken cancellationToken)
    {
        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<Unit>(SecurityErrors.Face.ProfileNotFound(request.UserId));
        }

        profile.ArchiveTemplate(request.Version);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed record DeleteFaceTemplateCommand(Guid UserId, int? Version = null) : ICommand<Result<Unit>>;

public sealed class DeleteFaceTemplateCommandHandler : IRequestHandler<DeleteFaceTemplateCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFaceProfileRepository _faceProfileRepository;

    public DeleteFaceTemplateCommandHandler(IUnitOfWork unitOfWork, IFaceProfileRepository faceProfileRepository)
    {
        _unitOfWork = unitOfWork;
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<Unit>> Handle(DeleteFaceTemplateCommand request, CancellationToken cancellationToken)
    {
        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<Unit>(SecurityErrors.Face.ProfileNotFound(request.UserId));
        }

        if (request.Version.HasValue)
        {
            profile.ArchiveTemplate(request.Version.Value);
        }
        else
        {
            profile.RemoveAllTemplates();
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 5. Face Queries
// ----------------------------------------------------
public sealed record GetFaceProfileQuery(Guid UserId) : IQuery<Result<FaceProfileDto>>;

public sealed class GetFaceProfileQueryHandler : IRequestHandler<GetFaceProfileQuery, Result<FaceProfileDto>>
{
    private readonly IFaceProfileRepository _faceProfileRepository;
    private readonly ILogger<GetFaceProfileQueryHandler> _logger;

    public GetFaceProfileQueryHandler(
        IFaceProfileRepository faceProfileRepository,
        ILogger<GetFaceProfileQueryHandler> logger)
    {
        _faceProfileRepository = faceProfileRepository;
        _logger = logger;
    }

    public async Task<Result<FaceProfileDto>> Handle(GetFaceProfileQuery request, CancellationToken cancellationToken)
    {
        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<FaceProfileDto>(SecurityErrors.Face.ProfileNotFound(request.UserId));
        }

        var templatesDto = profile.Templates.Select(t => new FaceTemplateDto(
            t.Id, t.Version, t.AlgorithmVersion, t.QualityScore, t.IsActive, t.CreatedAtUtc)).ToList();

        string statusStr = (profile.Status == Domain.Enums.Security.FaceEnrollmentStatus.Enrolled || (profile.IsActive && profile.ActiveTemplateVersion > 0))
            ? "Registered"
            : profile.Status.ToString();

        var activeTemplate = profile.Templates.FirstOrDefault(t => t.Version == profile.ActiveTemplateVersion)
            ?? profile.Templates.OrderByDescending(t => t.Version).FirstOrDefault();

        _logger.LogInformation(
            "[BIOMETRIC QUERY AUDIT] UserId: {UserId} | FaceProfileId: {FaceProfileId} | TemplateId: {TemplateId} | ActiveTemplateVersion: {ActiveTemplateVersion} | Registered: {Registered} | TemplateCount: {TemplateCount}",
            profile.UserId,
            profile.Id,
            activeTemplate?.Id ?? Guid.Empty,
            profile.ActiveTemplateVersion,
            statusStr == "Registered",
            profile.Templates.Count);

        var profileDto = new FaceProfileDto(
            profile.Id, profile.UserId, statusStr, profile.IsActive, profile.ActiveTemplateVersion, templatesDto);

        return Result.Success(profileDto);
    }
}

public sealed record GetFaceVerificationHistoryQuery(Guid UserId) : IQuery<Result<IReadOnlyList<FaceVerificationDto>>>;

public sealed class GetFaceVerificationHistoryQueryHandler : IRequestHandler<GetFaceVerificationHistoryQuery, Result<IReadOnlyList<FaceVerificationDto>>>
{
    private readonly IFaceProfileRepository _faceProfileRepository;

    public GetFaceVerificationHistoryQueryHandler(IFaceProfileRepository faceProfileRepository)
    {
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<IReadOnlyList<FaceVerificationDto>>> Handle(GetFaceVerificationHistoryQuery request, CancellationToken cancellationToken)
    {
        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<IReadOnlyList<FaceVerificationDto>>(SecurityErrors.Face.ProfileNotFound(request.UserId));
        }

        var logs = profile.VerificationLogs.Select(v => new FaceVerificationDto(
            v.Id, v.MatchScore, v.IsSuccessful, v.DeviceId, v.FailureReason, v.CreatedAtUtc)).ToList();

        return Result.Success<IReadOnlyList<FaceVerificationDto>>(logs);
    }
}

public sealed record GetEnrollmentHistoryQuery(Guid UserId) : IQuery<Result<IReadOnlyList<EnrollmentHistoryDto>>>;

public sealed class GetEnrollmentHistoryQueryHandler : IRequestHandler<GetEnrollmentHistoryQuery, Result<IReadOnlyList<EnrollmentHistoryDto>>>
{
    private readonly IFaceProfileRepository _faceProfileRepository;

    public GetEnrollmentHistoryQueryHandler(IFaceProfileRepository faceProfileRepository)
    {
        _faceProfileRepository = faceProfileRepository;
    }

    public async Task<Result<IReadOnlyList<EnrollmentHistoryDto>>> Handle(GetEnrollmentHistoryQuery request, CancellationToken cancellationToken)
    {
        var profile = await _faceProfileRepository.GetByUserIdAsync(request.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<IReadOnlyList<EnrollmentHistoryDto>>(SecurityErrors.Face.ProfileNotFound(request.UserId));
        }

        var logs = profile.EnrollmentLogs.Select(e => new EnrollmentHistoryDto(
            e.Id, e.TemplateVersion, e.Status.ToString(), e.Notes, e.CreatedAtUtc)).ToList();

        return Result.Success<IReadOnlyList<EnrollmentHistoryDto>>(logs);
    }
}
