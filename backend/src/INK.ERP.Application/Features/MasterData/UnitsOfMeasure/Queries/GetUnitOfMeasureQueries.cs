using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.UnitsOfMeasure.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.UnitsOfMeasure.Queries;

public record GetUnitOfMeasureByIdQuery(Guid Id) : IRequest<Result<UnitOfMeasureDto>>;

public class GetUnitOfMeasureByIdQueryHandler : IRequestHandler<GetUnitOfMeasureByIdQuery, Result<UnitOfMeasureDto>>
{
    private readonly IUnitOfMeasureRepository _uomRepository;

    public GetUnitOfMeasureByIdQueryHandler(IUnitOfMeasureRepository uomRepository)
    {
        _uomRepository = uomRepository;
    }

    public async Task<Result<UnitOfMeasureDto>> Handle(GetUnitOfMeasureByIdQuery request, CancellationToken cancellationToken)
    {
        var uom = await _uomRepository.GetByIdAsync(request.Id, cancellationToken);
        if (uom == null)
        {
            return Result<UnitOfMeasureDto>.Failure(Error.NotFound("UnitOfMeasure.NotFound", $"Unit of Measure with ID '{request.Id}' was not found."));
        }

        var dto = new UnitOfMeasureDto(
            uom.Id,
            uom.CompanyId,
            uom.Company?.LegalName,
            uom.Code,
            uom.Name,
            uom.BaseUnitCode,
            uom.ConversionFactor,
            uom.IsFractionalAllowed,
            uom.IsActive,
            uom.CreatedAtUtc);

        return Result<UnitOfMeasureDto>.Success(dto);
    }
}

public record GetUnitsOfMeasurePagedQuery(
    Guid? CompanyId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<UnitOfMeasureDto>>>;

public class GetUnitsOfMeasurePagedQueryHandler : IRequestHandler<GetUnitsOfMeasurePagedQuery, Result<IReadOnlyList<UnitOfMeasureDto>>>
{
    private readonly IUnitOfMeasureRepository _uomRepository;

    public GetUnitsOfMeasurePagedQueryHandler(IUnitOfMeasureRepository uomRepository)
    {
        _uomRepository = uomRepository;
    }

    public async Task<Result<IReadOnlyList<UnitOfMeasureDto>>> Handle(GetUnitsOfMeasurePagedQuery request, CancellationToken cancellationToken)
    {
        var uoms = await _uomRepository.GetAllAsync(cancellationToken);
        var query = uoms.AsQueryable();

        if (request.CompanyId.HasValue)
        {
            query = query.Where(u => u.CompanyId == request.CompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(u => u.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     u.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     u.BaseUnitCode.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(u => u.IsActive == isActive);
        }

        var list = query
            .OrderBy(u => u.Code)
            .Select(uom => new UnitOfMeasureDto(
                uom.Id,
                uom.CompanyId,
                uom.Company != null ? uom.Company.LegalName : null,
                uom.Code,
                uom.Name,
                uom.BaseUnitCode,
                uom.ConversionFactor,
                uom.IsFractionalAllowed,
                uom.IsActive,
                uom.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<UnitOfMeasureDto>>(list);
    }
}
