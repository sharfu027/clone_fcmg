using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Balances.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.Inventory.Balances.Queries;

public record GetInventoryBalanceByIdQuery(Guid Id) : IRequest<Result<InventoryBalanceDto>>;

public class GetInventoryBalanceByIdQueryHandler : IRequestHandler<GetInventoryBalanceByIdQuery, Result<InventoryBalanceDto>>
{
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryBalanceByIdQueryHandler(
        IInventoryBalanceRepository balanceRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _balanceRepository = balanceRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryBalanceDto>> Handle(GetInventoryBalanceByIdQuery request, CancellationToken cancellationToken)
    {
        var balance = await _balanceRepository.GetByIdAsync(request.Id, cancellationToken);
        if (balance == null)
        {
            return Result<InventoryBalanceDto>.Failure(Error.NotFound("InventoryBalance.NotFound", $"Inventory balance record with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(balance.CompanyId, cancellationToken))
        {
            return Result<InventoryBalanceDto>.Failure(Error.NotFound("InventoryBalance.NotFound", $"Inventory balance record with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(balance.CompanyId, cancellationToken);
        var location = await _locationRepository.GetByIdAsync(balance.InventoryLocationId, cancellationToken);
        var product = await _productRepository.GetByIdWithDetailsAsync(balance.ProductId, cancellationToken);

        decimal availableQty = balance.OnHandQuantity - balance.ReservedQuantity - balance.AllocatedQuantity;

        var dto = new InventoryBalanceDto(
            balance.Id,
            balance.CompanyId,
            company?.LegalName,
            balance.InventoryLocationId,
            location?.Name,
            location?.Code,
            balance.ProductId,
            product?.Name,
            product?.Code,
            product?.Sku,
            product?.BaseUomId ?? Guid.Empty,
            product?.BaseUom?.Name,
            balance.OnHandQuantity,
            balance.ReservedQuantity,
            balance.AllocatedQuantity,
            availableQty,
            balance.LastMovementAtUtc,
            balance.CreatedAtUtc,
            balance.LastModifiedAtUtc);

        return Result<InventoryBalanceDto>.Success(dto);
    }
}

public record GetInventoryBalancesPagedQuery(
    Guid? CompanyId = null,
    Guid? InventoryLocationId = null,
    Guid? ProductId = null,
    string? Search = null,
    bool? IsActiveLocation = null,
    int Page = 1,
    int PageSize = 50) : IRequest<Result<IReadOnlyList<InventoryBalanceDto>>>;

public class GetInventoryBalancesPagedQueryHandler : IRequestHandler<GetInventoryBalancesPagedQuery, Result<IReadOnlyList<InventoryBalanceDto>>>
{
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryBalancesPagedQueryHandler(
        IInventoryBalanceRepository balanceRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _balanceRepository = balanceRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<InventoryBalanceDto>>> Handle(GetInventoryBalancesPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<InventoryBalanceDto>>(new List<InventoryBalanceDto>());
        }

        var balances = await _balanceRepository.GetAllAsync(cancellationToken);
        var query = balances.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(b => b.CompanyId == effectiveCompanyId.Value);
        }

        if (request.InventoryLocationId.HasValue)
        {
            query = query.Where(b => b.InventoryLocationId == request.InventoryLocationId.Value);
        }

        if (request.ProductId.HasValue)
        {
            query = query.Where(b => b.ProductId == request.ProductId.Value);
        }

        var balanceList = query.ToList();

        // Hydrate and filter in memory with relations
        var dtos = new List<InventoryBalanceDto>();
        var search = request.Search?.Trim();

        foreach (var b in balanceList)
        {
            var location = await _locationRepository.GetByIdAsync(b.InventoryLocationId, cancellationToken);
            if (request.IsActiveLocation.HasValue && location != null && location.IsActive != request.IsActiveLocation.Value)
            {
                continue;
            }

            var product = await _productRepository.GetByIdWithDetailsAsync(b.ProductId, cancellationToken);

            if (!string.IsNullOrWhiteSpace(search))
            {
                bool matchesSearch =
                    (product != null && (
                        product.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        product.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        product.Sku.Contains(search, StringComparison.OrdinalIgnoreCase))) ||
                    (location != null && (
                        location.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        location.Code.Contains(search, StringComparison.OrdinalIgnoreCase)));

                if (!matchesSearch)
                {
                    continue;
                }
            }

            var company = await _companyRepository.GetByIdAsync(b.CompanyId, cancellationToken);
            decimal availableQty = b.OnHandQuantity - b.ReservedQuantity - b.AllocatedQuantity;

            dtos.Add(new InventoryBalanceDto(
                b.Id,
                b.CompanyId,
                company?.LegalName,
                b.InventoryLocationId,
                location?.Name,
                location?.Code,
                b.ProductId,
                product?.Name,
                product?.Code,
                product?.Sku,
                product?.BaseUomId ?? Guid.Empty,
                product?.BaseUom?.Name,
                b.OnHandQuantity,
                b.ReservedQuantity,
                b.AllocatedQuantity,
                availableQty,
                b.LastMovementAtUtc,
                b.CreatedAtUtc,
                b.LastModifiedAtUtc));
        }

        var pagedDtos = dtos
            .OrderBy(d => d.ProductName)
            .ThenBy(d => d.InventoryLocationName)
            .Skip((Math.Max(request.Page, 1) - 1) * Math.Max(request.PageSize, 1))
            .Take(Math.Max(request.PageSize, 1))
            .ToList();

        return Result.Success<IReadOnlyList<InventoryBalanceDto>>(pagedDtos);
    }
}
