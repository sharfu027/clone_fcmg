using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.Pricing.CustomerPricing.DTOs;
using CustomerEntity = INK.ERP.Domain.Entities.MasterData.Customer;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Pricing;

namespace INK.ERP.Application.Features.Pricing.CustomerPricing.Queries;

// 1. GET ALL PAGED
public record GetCustomerPricesQuery(
    Guid CompanyId,
    Guid? CustomerId = null,
    Guid? ProductId = null,
    Guid? PriceListId = null,
    CustomerPriceStatus? Status = null,
    string? Currency = null,
    DateTime? EffectiveDate = null,
    string? Search = null,
    int PageNumber = 1,
    int PageSize = 10
) : IRequest<Result<PagedResult<CustomerPriceDto>>>;

public class GetCustomerPricesQueryHandler : IRequestHandler<GetCustomerPricesQuery, Result<PagedResult<CustomerPriceDto>>>
{
    private readonly ICustomerPriceRepository _repository;

    public GetCustomerPricesQueryHandler(ICustomerPriceRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<PagedResult<CustomerPriceDto>>> Handle(GetCustomerPricesQuery request, CancellationToken cancellationToken)
    {
        var (items, totalCount) = await _repository.GetPagedAsync(
            request.CompanyId, request.CustomerId, request.ProductId, request.PriceListId,
            request.Status, request.Currency, request.EffectiveDate, request.Search,
            request.PageNumber, request.PageSize, cancellationToken);

        var dtos = items.Select(c => new CustomerPriceDto(
            c.Id, c.CompanyId, c.CustomerId, c.Customer?.Code ?? "", c.Customer?.TradeName ?? c.Customer?.LegalName ?? "",
            c.PriceListId, c.PriceList?.Name ?? "", c.ProductId, c.Product?.Code ?? "", c.Product?.Name ?? "",
            "Pcs", c.BasePrice, c.CustomerPriceValue, c.MinAllowedPrice, c.CurrencyCode,
            c.EffectiveFrom, c.EffectiveTo, c.Status, c.IsActive,
            c.CreatedAtUtc, c.CreatedBy ?? "System", c.LastModifiedAtUtc, c.LastModifiedBy,
            c.ActivatedBy, c.ActivatedAtUtc, c.DeactivatedBy, c.DeactivatedAtUtc, c.ArchivedBy, c.ArchivedAtUtc
        )).ToList();

        var pagedResult = PagedResult<CustomerPriceDto>.Create(dtos, totalCount, request.PageNumber, request.PageSize);
        return Result<PagedResult<CustomerPriceDto>>.Success(pagedResult);
    }
}

// 2. GET BY ID
public record GetCustomerPriceByIdQuery(Guid Id) : IRequest<Result<CustomerPriceDto>>;

public class GetCustomerPriceByIdQueryHandler : IRequestHandler<GetCustomerPriceByIdQuery, Result<CustomerPriceDto>>
{
    private readonly ICustomerPriceRepository _repository;

    public GetCustomerPriceByIdQueryHandler(ICustomerPriceRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<CustomerPriceDto>> Handle(GetCustomerPriceByIdQuery request, CancellationToken cancellationToken)
    {
        var c = await _repository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (c == null || c.IsDeleted)
            return Result<CustomerPriceDto>.Failure(Error.NotFound("CustomerPrice.NotFound", "Customer pricing record not found."));

        var dto = new CustomerPriceDto(
            c.Id, c.CompanyId, c.CustomerId, c.Customer?.Code ?? "", c.Customer?.TradeName ?? c.Customer?.LegalName ?? "",
            c.PriceListId, c.PriceList?.Name ?? "", c.ProductId, c.Product?.Code ?? "", c.Product?.Name ?? "",
            "Pcs", c.BasePrice, c.CustomerPriceValue, c.MinAllowedPrice, c.CurrencyCode,
            c.EffectiveFrom, c.EffectiveTo, c.Status, c.IsActive,
            c.CreatedAtUtc, c.CreatedBy ?? "System", c.LastModifiedAtUtc, c.LastModifiedBy,
            c.ActivatedBy, c.ActivatedAtUtc, c.DeactivatedBy, c.DeactivatedAtUtc, c.ArchivedBy, c.ArchivedAtUtc
        );

        return Result<CustomerPriceDto>.Success(dto);
    }
}

// 3. RESOLVE PRICE QUERY
public record ResolvePriceQuery(
    Guid CompanyId,
    Guid CustomerId,
    Guid ProductId,
    DateTime? TargetDate = null
) : IRequest<Result<PriceResolutionResultDto>>;

public class ResolvePriceQueryHandler : IRequestHandler<ResolvePriceQuery, Result<PriceResolutionResultDto>>
{
    private readonly IPricingResolutionService _resolutionService;

    public ResolvePriceQueryHandler(IPricingResolutionService resolutionService)
    {
        _resolutionService = resolutionService;
    }

    public async Task<Result<PriceResolutionResultDto>> Handle(ResolvePriceQuery request, CancellationToken cancellationToken)
    {
        var result = await _resolutionService.ResolvePriceAsync(
            request.CompanyId, request.CustomerId, request.ProductId, targetDate: request.TargetDate, cancellationToken: cancellationToken);

        return Result<PriceResolutionResultDto>.Success(result);
    }
}
