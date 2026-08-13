using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Pricing.PriceLists.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.PriceLists.Queries;

public record GetPriceListByIdQuery(Guid Id) : IRequest<Result<PriceListDto>>;

public class GetPriceListByIdQueryHandler : IRequestHandler<GetPriceListByIdQuery, Result<PriceListDto>>
{
    private readonly IPriceListRepository _priceListRepository;

    public GetPriceListByIdQueryHandler(IPriceListRepository priceListRepository)
    {
        _priceListRepository = priceListRepository;
    }

    public async Task<Result<PriceListDto>> Handle(GetPriceListByIdQuery request, CancellationToken cancellationToken)
    {
        var priceList = await _priceListRepository.GetByIdAsync(request.Id, cancellationToken);
        if (priceList == null || priceList.IsDeleted)
        {
            return Result<PriceListDto>.Failure(Error.NotFound("PriceList.NotFound", $"Price list with ID '{request.Id}' was not found."));
        }

        var dto = MapToDto(priceList);
        return Result<PriceListDto>.Success(dto);
    }

    private static PriceListDto MapToDto(PriceList entity)
    {
        var items = entity.Items
            .Where(i => !i.IsDeleted)
            .Select(i => new PriceListItemDto(
                i.Id,
                i.PriceListId,
                i.ProductId,
                null,
                null,
                i.Price,
                i.Price,
                i.Price,
                i.CurrencyCode,
                i.EffectiveDate,
                i.IsActive))
            .ToList();

        return new PriceListDto(
            entity.Id,
            entity.CompanyId,
            entity.Name,
            entity.Description,
            entity.EffectiveFrom,
            entity.EffectiveTo,
            entity.Status.ToString(),
            entity.Version,
            entity.ConcurrencyToken,
            entity.IsDeleted,
            entity.CreatedAtUtc,
            entity.LastModifiedAtUtc,
            items);
    }
}

public record GetPriceListsQuery(
    Guid? CompanyId = null,
    string? Status = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 10) : IRequest<Result<PagedResult<PriceListDto>>>;

public class GetPriceListsQueryHandler : IRequestHandler<GetPriceListsQuery, Result<PagedResult<PriceListDto>>>
{
    private readonly IPriceListRepository _priceListRepository;

    public GetPriceListsQueryHandler(IPriceListRepository priceListRepository)
    {
        _priceListRepository = priceListRepository;
    }

    public async Task<Result<PagedResult<PriceListDto>>> Handle(GetPriceListsQuery request, CancellationToken cancellationToken)
    {
        var allLists = await _priceListRepository.GetAllAsync(cancellationToken);
        var query = allLists.Where(pl => !pl.IsDeleted).AsQueryable();

        if (request.CompanyId.HasValue)
        {
            query = query.Where(pl => pl.CompanyId == request.CompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && Enum.TryParse<PriceListStatus>(request.Status, true, out var statusEnum))
        {
            query = query.Where(pl => pl.Status == statusEnum);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(pl => pl.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                      (pl.Description != null && pl.Description.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        var totalCount = query.Count();
        var pageNumber = request.PageNumber < 1 ? 1 : request.PageNumber;
        var pageSize = request.PageSize < 1 ? 10 : request.PageSize;

        var items = query
            .OrderByDescending(pl => pl.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToDto)
            .ToList();

        var pagedResult = PagedResult<PriceListDto>.Create(items, totalCount, pageNumber, pageSize);
        return Result<PagedResult<PriceListDto>>.Success(pagedResult);
    }

    private static PriceListDto MapToDto(PriceList entity)
    {
        var items = entity.Items
            .Where(i => !i.IsDeleted)
            .Select(i => new PriceListItemDto(
                i.Id,
                i.PriceListId,
                i.ProductId,
                null,
                null,
                i.Price,
                i.Price,
                i.Price,
                i.CurrencyCode,
                i.EffectiveDate,
                i.IsActive))
            .ToList();

        return new PriceListDto(
            entity.Id,
            entity.CompanyId,
            entity.Name,
            entity.Description,
            entity.EffectiveFrom,
            entity.EffectiveTo,
            entity.Status.ToString(),
            entity.Version,
            entity.ConcurrencyToken,
            entity.IsDeleted,
            entity.CreatedAtUtc,
            entity.LastModifiedAtUtc,
            items);
    }
}
