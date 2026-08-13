using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Application.Features.Security.Events;
using INK.ERP.Application.Features.Security.Face.DTOs;

namespace INK.ERP.Application.Features.Security.Face.Workflows;

public interface IFaceEnrollmentWorkflow
{
    Task<Result<FaceProfileDto>> ExecuteAsync(EnrollFaceCommand command, CancellationToken cancellationToken = default);
}

public class FaceEnrollmentWorkflow : IFaceEnrollmentWorkflow
{
    private readonly IFaceValidationWorkflow _validationWorkflow;
    private readonly IFaceEmbeddingService _embeddingService;
    private readonly IFaceProfileRepository _faceProfileRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly IPublisher _publisher;
    private readonly ILogger<FaceEnrollmentWorkflow> _logger;

    public FaceEnrollmentWorkflow(
        IFaceValidationWorkflow validationWorkflow,
        IFaceEmbeddingService embeddingService,
        IFaceProfileRepository faceProfileRepository,
        IUnitOfWork unitOfWork,
        IPublisher publisher,
        ILogger<FaceEnrollmentWorkflow> logger)
    {
        _validationWorkflow = validationWorkflow;
        _embeddingService = embeddingService;
        _faceProfileRepository = faceProfileRepository;
        _unitOfWork = unitOfWork;
        _publisher = publisher;
        _logger = logger;
    }

    public async Task<Result<FaceProfileDto>> ExecuteAsync(EnrollFaceCommand command, CancellationToken cancellationToken = default)
    {
        var validationResult = await _validationWorkflow.ValidateAsync(command.ImageData, cancellationToken);
        if (validationResult.IsFailure)
        {
            return Result.Failure<FaceProfileDto>(validationResult.Error);
        }

        if (validationResult.Value == null || !validationResult.Value.IsValid)
        {
            var firstError = validationResult.Value?.ValidationErrors?.FirstOrDefault() ?? "Face validation failed.";
            return Result.Failure<FaceProfileDto>(SecurityErrors.Face.QualityCheckFailed(firstError));
        }

        var embeddingResult = await _embeddingService.GenerateEmbeddingAsync(command.ImageData, cancellationToken);
        if (embeddingResult.IsFailure)
        {
            return Result.Failure<FaceProfileDto>(embeddingResult.Error);
        }

        var profile = await _faceProfileRepository.GetByUserIdAsync(command.UserId, cancellationToken);

        if (profile == null)
        {
            profile = new FaceProfile(command.UserId);
            await _faceProfileRepository.AddAsync(profile, cancellationToken);
        }

        try
        {
            profile.Enroll(embeddingResult.Value.Embedding);
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure<FaceProfileDto>(new Error("SECURITY.FACE.ENROLLMENT_FAILED", ex.Message, ErrorType.Conflict));
        }

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var latestTemplate = profile.Templates.OrderByDescending(t => t.Version).FirstOrDefault();
        _logger.LogInformation(
            "[BIOMETRIC AUDIT PERSISTENCE] UserId: {UserId} | FaceProfileId: {FaceProfileId} | TemplateId: {TemplateId} | ActiveTemplateVersion: {ActiveTemplateVersion} | Registered: {Registered} | TemplateCount: {TemplateCount}",
            profile.UserId,
            profile.Id,
            latestTemplate?.Id ?? Guid.Empty,
            profile.ActiveTemplateVersion,
            profile.Status == Domain.Enums.Security.FaceEnrollmentStatus.Enrolled,
            profile.Templates.Count);

        // Publish lightweight Application Event
        await _publisher.Publish(new FaceEnrollmentCompletedEvent(profile.Id, profile.UserId, profile.ActiveTemplateVersion, DateTime.UtcNow), cancellationToken);

        var templatesDto = profile.Templates.Select(t => new FaceTemplateDto(
            t.Id, t.Version, t.AlgorithmVersion, t.QualityScore, t.IsActive, t.CreatedAtUtc)).ToList();

        string statusStr = profile.Status == Domain.Enums.Security.FaceEnrollmentStatus.Enrolled ? "Registered" : profile.Status.ToString();

        var profileDto = new FaceProfileDto(
            profile.Id, profile.UserId, statusStr, profile.IsActive, profile.ActiveTemplateVersion, templatesDto);

        return Result.Success(profileDto);
    }
}
