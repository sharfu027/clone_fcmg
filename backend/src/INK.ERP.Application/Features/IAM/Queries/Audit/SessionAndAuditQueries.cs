using Mapster;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.IAM;
using INK.ERP.Application.Features.IAM.DTOs;

namespace INK.ERP.Application.Features.IAM.Queries.Audit;

// 7. GetUserSessionsQuery
public sealed record GetUserSessionsQuery(Guid UserId) : IQuery<Result<IReadOnlyList<UserSessionDto>>>;

public sealed class GetUserSessionsQueryHandler : IRequestHandler<GetUserSessionsQuery, Result<IReadOnlyList<UserSessionDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetUserSessionsQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IReadOnlyList<UserSessionDto>>> Handle(GetUserSessionsQuery request, CancellationToken cancellationToken)
    {
        var sessionRepo = _unitOfWork.Repository<UserSession>();
        var sessions = await sessionRepo.FindAsync(s => s.UserId == request.UserId && !s.IsDeleted, cancellationToken);

        var dtos = sessions.Adapt<IReadOnlyList<UserSessionDto>>();
        return Result.Success(dtos);
    }
}

// 8. GetLoginHistoryQuery
public sealed record GetLoginHistoryQuery(Guid? UserId = null, string? Username = null) : IQuery<Result<IReadOnlyList<LoginHistoryDto>>>;

public sealed class GetLoginHistoryQueryHandler : IRequestHandler<GetLoginHistoryQuery, Result<IReadOnlyList<LoginHistoryDto>>>
{
    private readonly IUnitOfWork _unitOfWork;

    public GetLoginHistoryQueryHandler(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<IReadOnlyList<LoginHistoryDto>>> Handle(GetLoginHistoryQuery request, CancellationToken cancellationToken)
    {
        var historyRepo = _unitOfWork.Repository<LoginHistory>();
        var records = await historyRepo.FindAsync(h => !h.IsDeleted &&
            (!request.UserId.HasValue || h.UserId == request.UserId.Value) &&
            (string.IsNullOrWhiteSpace(request.Username) || h.Username.Contains(request.Username)), cancellationToken);

        var dtos = records.Adapt<IReadOnlyList<LoginHistoryDto>>();
        return Result.Success(dtos);
    }
}
