using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Security;
using INK.ERP.Domain.Services.Security;
using INK.ERP.Domain.ValueObjects.Security;
using INK.ERP.Application.Features.Security.Risk.DTOs;

namespace INK.ERP.Application.Features.Security.Risk;

public sealed record CalculateRiskQuery(
    Guid UserId,
    GpsCoordinate? CurrentCoordinate = null,
    string? IpAddress = null) : IQuery<Result<RiskAssessmentDto>>;

public sealed class CalculateRiskQueryHandler : IRequestHandler<CalculateRiskQuery, Result<RiskAssessmentDto>>
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly SecurityRiskAssessmentService _riskAssessmentService;

    public CalculateRiskQueryHandler(IUnitOfWork unitOfWork, SecurityRiskAssessmentService riskAssessmentService)
    {
        _unitOfWork = unitOfWork;
        _riskAssessmentService = riskAssessmentService;
    }

    public async Task<Result<RiskAssessmentDto>> Handle(CalculateRiskQuery request, CancellationToken cancellationToken)
    {
        var incidentRepo = _unitOfWork.Repository<SecurityIncident>();
        var recentIncidents = await incidentRepo.FindAsync(i => i.UserId == request.UserId && !i.IsResolved && !i.IsDeleted, cancellationToken);

        var score = _riskAssessmentService.CalculateRiskScore(recentIncidents, null, null, request.CurrentCoordinate, DateTime.UtcNow);

        var level = score switch
        {
            < 25 => "Low",
            < 50 => "Medium",
            < 75 => "High",
            _ => "Critical"
        };

        var factors = recentIncidents.Select(i => $"Incident: {i.Type} ({i.Severity})").ToList();

        var dto = new RiskAssessmentDto(
            request.UserId,
            score,
            level,
            score >= 50,
            factors,
            DateTime.UtcNow);

        return Result.Success(dto);
    }
}

public sealed record GetUserRiskHistoryQuery(Guid UserId) : IQuery<Result<RiskAssessmentDto>>;

public sealed class GetUserRiskHistoryQueryHandler : IRequestHandler<GetUserRiskHistoryQuery, Result<RiskAssessmentDto>>
{
    private readonly ISender _mediator;

    public GetUserRiskHistoryQueryHandler(ISender mediator)
    {
        _mediator = mediator;
    }

    public async Task<Result<RiskAssessmentDto>> Handle(GetUserRiskHistoryQuery request, CancellationToken cancellationToken)
    {
        return await _mediator.Send(new CalculateRiskQuery(request.UserId), cancellationToken);
    }
}
