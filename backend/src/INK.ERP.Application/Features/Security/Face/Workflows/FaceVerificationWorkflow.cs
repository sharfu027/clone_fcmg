using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Application.Features.Security.Events;
using INK.ERP.Application.Features.Security.Face.DTOs;

namespace INK.ERP.Application.Features.Security.Face.Workflows;

public interface IFaceVerificationWorkflow
{
    Task<Result<FaceVerificationDto>> ExecuteAsync(RecordFaceVerificationCommand command, CancellationToken cancellationToken = default);
}

public class FaceVerificationWorkflow : IFaceVerificationWorkflow
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IFaceProfileRepository _faceProfileRepository;
    private readonly IPublisher _publisher;
    private readonly ILogger<FaceVerificationWorkflow> _logger;

    public FaceVerificationWorkflow(
        IUnitOfWork unitOfWork,
        IFaceProfileRepository faceProfileRepository,
        IPublisher publisher,
        ILogger<FaceVerificationWorkflow> logger)
    {
        _unitOfWork = unitOfWork;
        _faceProfileRepository = faceProfileRepository;
        _publisher = publisher;
        _logger = logger;
    }

    public async Task<Result<FaceVerificationDto>> ExecuteAsync(RecordFaceVerificationCommand command, CancellationToken cancellationToken = default)
    {
        var profile = await _faceProfileRepository.GetByUserIdAsync(command.UserId, cancellationToken);

        if (profile == null)
        {
            return Result.Failure<FaceVerificationDto>(SecurityErrors.Face.ProfileNotFound(command.UserId));
        }

        try
        {
            profile.RecordVerification(command.MatchScore, command.IsSuccess, command.DeviceId, command.FailureReason);

            if (!command.IsSuccess)
            {
                var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
                var incident = SecurityIncident.Raise(
                    IncidentType.FaceMismatch,
                    IncidentSeverity.Medium,
                    $"Face verification failed for user '{command.UserId}'. Reason: {command.FailureReason ?? "Mismatch"}",
                    command.UserId);
                await incidentRepo.AddAsync(incident, cancellationToken);
            }

            await _unitOfWork.SaveChangesAsync(cancellationToken);

            // Publish Application Event
            await _publisher.Publish(new FaceVerificationCompletedEvent(command.UserId, command.MatchScore, command.IsSuccess, command.DeviceId, DateTime.UtcNow), cancellationToken);

            var latestLog = profile.VerificationLogs.LastOrDefault();
            var dto = new FaceVerificationDto(
                latestLog?.Id ?? Guid.NewGuid(),
                command.MatchScore,
                command.IsSuccess,
                command.DeviceId,
                command.FailureReason,
                DateTime.UtcNow);

            return Result.Success(dto);
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure<FaceVerificationDto>(new Error("SECURITY.FACE.VERIFICATION_FAILED", ex.Message, ErrorType.Conflict));
        }
    }
}
