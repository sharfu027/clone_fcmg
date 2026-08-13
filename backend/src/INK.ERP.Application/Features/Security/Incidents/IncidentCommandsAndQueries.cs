using FluentValidation;
using MediatR;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Enums.Security;
using INK.ERP.Application.Features.Security.Incidents.DTOs;

namespace INK.ERP.Application.Features.Security.Incidents;

// ----------------------------------------------------
// 1. RaiseSecurityIncidentCommand
// ----------------------------------------------------
public sealed record RaiseSecurityIncidentCommand(
    IncidentType Type,
    IncidentSeverity Severity,
    string Description,
    Guid? UserId = null,
    string? IpAddress = null) : ICommand<Result<Guid>>;

public sealed class RaiseSecurityIncidentCommandHandler : IRequestHandler<RaiseSecurityIncidentCommand, Result<Guid>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly ILogger<RaiseSecurityIncidentCommandHandler> _logger;

    public RaiseSecurityIncidentCommandHandler(IUnitOfWork unitOfWork, ILogger<RaiseSecurityIncidentCommandHandler> logger)
    {
        _unitOfWork = unitOfWork;
        _logger = logger;
    }

    public async Task<Result<Guid>> Handle(RaiseSecurityIncidentCommand request, CancellationToken cancellationToken)
    {
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
        var incident = SecurityIncident.Raise(request.Type, request.Severity, request.Description, request.UserId, request.IpAddress);

        await incidentRepo.AddAsync(incident, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        _logger.LogWarning("Security incident raised: [{Severity}] {Type} - {Description}", incident.Severity, incident.Type, incident.Description);

        return Result.Success(incident.Id);
    }
}

public sealed class RaiseSecurityIncidentCommandValidator : AbstractValidator<RaiseSecurityIncidentCommand>
{
    public RaiseSecurityIncidentCommandValidator()
    {
        RuleFor(x => x.Description).NotEmpty();
    }
}

// ----------------------------------------------------
// 2. ResolveSecurityIncidentCommand, EscalateSecurityIncidentCommand, CloseSecurityIncidentCommand
// ----------------------------------------------------
public sealed record ResolveSecurityIncidentCommand(Guid IncidentId, string ResolutionNotes) : ICommand<Result<Unit>>;

public sealed class ResolveSecurityIncidentCommandHandler : IRequestHandler<ResolveSecurityIncidentCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public ResolveSecurityIncidentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(ResolveSecurityIncidentCommand request, CancellationToken cancellationToken)
    {
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
        var incident = await incidentRepo.GetByIdAsync(request.IncidentId, cancellationToken);

        if (incident == null || incident.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Incident.NotFound(request.IncidentId));
        }

        if (incident.IsResolved)
        {
            return Result.Failure<Unit>(SecurityErrors.Incident.AlreadyResolved);
        }

        incident.Resolve(request.ResolutionNotes);
        incidentRepo.Update(incident);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

public sealed record EscalateSecurityIncidentCommand(Guid IncidentId, string Reason) : ICommand<Result<Unit>>;

public sealed class EscalateSecurityIncidentCommandHandler : IRequestHandler<EscalateSecurityIncidentCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public EscalateSecurityIncidentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(EscalateSecurityIncidentCommand request, CancellationToken cancellationToken)
    {
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
        var incident = await incidentRepo.GetByIdAsync(request.IncidentId, cancellationToken);

        if (incident == null || incident.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Incident.NotFound(request.IncidentId));
        }

        try
        {
            incident.Escalate(request.Reason);
            incidentRepo.Update(incident);
            await _unitOfWork.SaveChangesAsync(cancellationToken);
            return Result.Success(Unit.Value);
        }
        catch (InvalidOperationException ex)
        {
            return Result.Failure<Unit>(new Error("SECURITY.INCIDENT.ESCALATE_FAILED", ex.Message, ErrorType.Conflict));
        }
    }
}

public sealed record CloseSecurityIncidentCommand(Guid IncidentId) : ICommand<Result<Unit>>;

public sealed class CloseSecurityIncidentCommandHandler : IRequestHandler<CloseSecurityIncidentCommand, Result<Unit>>
{
    private readonly IUnitOfWork _unitOfWork;

    public CloseSecurityIncidentCommandHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(CloseSecurityIncidentCommand request, CancellationToken cancellationToken)
    {
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
        var incident = await incidentRepo.GetByIdAsync(request.IncidentId, cancellationToken);

        if (incident == null || incident.IsDeleted)
        {
            return Result.Failure<Unit>(SecurityErrors.Incident.NotFound(request.IncidentId));
        }

        incident.Close();
        incidentRepo.Update(incident);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(Unit.Value);
    }
}

// ----------------------------------------------------
// 3. Incident Queries
// ----------------------------------------------------
public sealed record GetIncidentQuery(Guid IncidentId) : IQuery<Result<SecurityIncidentDto>>;

public sealed class GetIncidentQueryHandler : IRequestHandler<GetIncidentQuery, Result<SecurityIncidentDto>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetIncidentQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<SecurityIncidentDto>> Handle(GetIncidentQuery request, CancellationToken cancellationToken)
    {
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
        var incident = await incidentRepo.GetByIdAsync(request.IncidentId, cancellationToken);

        if (incident == null || incident.IsDeleted)
        {
            return Result.Failure<SecurityIncidentDto>(SecurityErrors.Incident.NotFound(request.IncidentId));
        }

        var dto = new SecurityIncidentDto(
            incident.Id, incident.Type.ToString(), incident.Severity.ToString(), incident.Description,
            incident.UserId, incident.IpAddress, incident.IsResolved, incident.IsEscalated,
            incident.ResolutionNotes, incident.ResolvedAtUtc, incident.CreatedAtUtc);

        return Result.Success(dto);
    }
}

public sealed record GetIncidentHistoryQuery(Guid UserId) : IQuery<Result<IReadOnlyList<SecurityIncidentDto>>>;

public sealed class GetIncidentHistoryQueryHandler : IRequestHandler<GetIncidentHistoryQuery, Result<IReadOnlyList<SecurityIncidentDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetIncidentHistoryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IReadOnlyList<SecurityIncidentDto>>> Handle(GetIncidentHistoryQuery request, CancellationToken cancellationToken)
    {
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
        var incidents = await incidentRepo.FindAsync(i => i.UserId == request.UserId && !i.IsDeleted, cancellationToken);

        var dtos = incidents.Select(i => new SecurityIncidentDto(
            i.Id, i.Type.ToString(), i.Severity.ToString(), i.Description,
            i.UserId, i.IpAddress, i.IsResolved, i.IsEscalated, i.ResolutionNotes, i.ResolvedAtUtc, i.CreatedAtUtc)).ToList();

        return Result.Success<IReadOnlyList<SecurityIncidentDto>>(dtos);
    }
}

public sealed record GetOpenIncidentsQuery(IncidentSeverity? MinSeverity = null) : IQuery<Result<IReadOnlyList<SecurityIncidentDto>>>;

public sealed class GetOpenIncidentsQueryHandler : IRequestHandler<GetOpenIncidentsQuery, Result<IReadOnlyList<SecurityIncidentDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetOpenIncidentsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IReadOnlyList<SecurityIncidentDto>>> Handle(GetOpenIncidentsQuery request, CancellationToken cancellationToken)
    {
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
        var incidents = await incidentRepo.FindAsync(i => !i.IsResolved && !i.IsDeleted &&
            (!request.MinSeverity.HasValue || i.Severity >= request.MinSeverity.Value), cancellationToken);

        var dtos = incidents.Select(i => new SecurityIncidentDto(
            i.Id, i.Type.ToString(), i.Severity.ToString(), i.Description,
            i.UserId, i.IpAddress, i.IsResolved, i.IsEscalated, i.ResolutionNotes, i.ResolvedAtUtc, i.CreatedAtUtc)).ToList();

        return Result.Success<IReadOnlyList<SecurityIncidentDto>>(dtos);
    }
}
