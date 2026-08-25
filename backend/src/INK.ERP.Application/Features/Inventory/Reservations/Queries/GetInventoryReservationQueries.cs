using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Reservations.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Reservations.Queries;

// ----------------------------------------------------
// 1. GET STOCK AVAILABILITY QUERY
// ----------------------------------------------------
public record GetStockAvailabilityQuery(
    Guid CompanyId,
    Guid ProductId,
    Guid InventoryLocationId,
    decimal RequestedQuantity = 1
) : IRequest<Result<InventoryAvailabilityDto>>;

public class GetStockAvailabilityQueryHandler : IRequestHandler<GetStockAvailabilityQuery, Result<InventoryAvailabilityDto>>
{
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetStockAvailabilityQueryHandler(
        IInventoryBalanceRepository balanceRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _locationRepository = locationRepository ?? throw new ArgumentNullException(nameof(locationRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<InventoryAvailabilityDto>> Handle(GetStockAvailabilityQuery request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<InventoryAvailabilityDto>.Failure(Error.Validation("Availability.EmptyCompany", "Company ID is required."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<InventoryAvailabilityDto>.Failure(Error.Unauthorized("Availability.Unauthorized", "Unauthorized access to requested company."));

        var product = await _productRepository.GetByIdWithDetailsAsync(request.ProductId, cancellationToken);
        if (product == null || product.CompanyId != request.CompanyId)
            return Result<InventoryAvailabilityDto>.Failure(Error.NotFound("Availability.ProductNotFound", "Product not found or does not belong to specified company."));

        var location = await _locationRepository.GetByIdAsync(request.InventoryLocationId, cancellationToken);
        if (location == null || location.CompanyId != request.CompanyId)
            return Result<InventoryAvailabilityDto>.Failure(Error.NotFound("Availability.LocationNotFound", "Inventory location not found or does not belong to specified company."));

        var balance = await _balanceRepository.GetByLocationAndProductAsync(
            request.CompanyId,
            request.InventoryLocationId,
            request.ProductId,
            cancellationToken);

        decimal onHand = balance?.OnHandQuantity ?? 0m;
        decimal reserved = balance?.ReservedQuantity ?? 0m;
        decimal allocated = balance?.AllocatedQuantity ?? 0m;
        decimal available = Math.Max(0m, onHand - reserved - allocated);
        decimal requested = Math.Max(0m, request.RequestedQuantity);
        bool isAvailable = available >= requested && requested > 0;
        decimal shortfall = Math.Max(0m, requested - available);

        var dto = new InventoryAvailabilityDto(
            request.CompanyId,
            product.Id,
            product.Name,
            product.Code,
            product.Sku,
            product.BaseUom?.Name ?? "unit",
            location.Id,
            location.Name,
            location.Code,
            onHand,
            reserved,
            allocated,
            available,
            requested,
            isAvailable,
            shortfall
        );

        return Result<InventoryAvailabilityDto>.Success(dto);
    }
}

// ----------------------------------------------------
// 2. GET ALTERNATIVE LOCATIONS QUERY
// ----------------------------------------------------
public record GetAlternateLocationsQuery(
    Guid CompanyId,
    Guid ProductId,
    decimal RequestedQuantity = 1,
    Guid? ExcludedLocationId = null
) : IRequest<Result<IReadOnlyList<InventoryAlternativeLocationDto>>>;

public class GetAlternateLocationsQueryHandler : IRequestHandler<GetAlternateLocationsQuery, Result<IReadOnlyList<InventoryAlternativeLocationDto>>>
{
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetAlternateLocationsQueryHandler(
        IInventoryBalanceRepository balanceRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _balanceRepository = balanceRepository ?? throw new ArgumentNullException(nameof(balanceRepository));
        _locationRepository = locationRepository ?? throw new ArgumentNullException(nameof(locationRepository));
        _productRepository = productRepository ?? throw new ArgumentNullException(nameof(productRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<InventoryAlternativeLocationDto>>> Handle(GetAlternateLocationsQuery request, CancellationToken cancellationToken)
    {
        if (request.CompanyId == Guid.Empty)
            return Result<IReadOnlyList<InventoryAlternativeLocationDto>>.Failure(Error.Validation("Alternatives.EmptyCompany", "Company ID is required."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(request.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<IReadOnlyList<InventoryAlternativeLocationDto>>.Failure(Error.Unauthorized("Alternatives.Unauthorized", "Unauthorized access to requested company."));

        var product = await _productRepository.GetByIdWithDetailsAsync(request.ProductId, cancellationToken);
        if (product == null || product.CompanyId != request.CompanyId)
            return Result<IReadOnlyList<InventoryAlternativeLocationDto>>.Failure(Error.NotFound("Alternatives.ProductNotFound", "Product not found or does not belong to specified company."));

        InventoryLocation? excludedLoc = null;
        if (request.ExcludedLocationId.HasValue && request.ExcludedLocationId.Value != Guid.Empty)
        {
            excludedLoc = await _locationRepository.GetByIdAsync(request.ExcludedLocationId.Value, cancellationToken);
        }

        // Fetch all active locations for this company
        var allLocations = (await _locationRepository.GetAllAsync(cancellationToken))
            .Where(l => l.CompanyId == request.CompanyId && l.IsActive)
            .ToList();

        // Fetch all balances for this product in this company
        var allBalances = (await _balanceRepository.GetAllAsync(cancellationToken))
            .Where(b => b.CompanyId == request.CompanyId && b.ProductId == request.ProductId)
            .ToList();
        var balanceMap = allBalances.ToDictionary(b => b.InventoryLocationId, b => b);

        var alternatives = new List<InventoryAlternativeLocationDto>();

        foreach (var loc in allLocations)
        {
            if (request.ExcludedLocationId.HasValue && loc.Id == request.ExcludedLocationId.Value)
                continue;

            balanceMap.TryGetValue(loc.Id, out var bal);
            decimal onHand = bal?.OnHandQuantity ?? 0m;
            decimal reserved = bal?.ReservedQuantity ?? 0m;
            decimal allocated = bal?.AllocatedQuantity ?? 0m;
            decimal available = Math.Max(0m, onHand - reserved - allocated);

            if (available <= 0)
                continue; // Only recommend locations with available stock

            // Calculate Recommendation Rank (1 to 4)
            int rank;
            string rankReason;

            if (excludedLoc?.WarehouseId != null && loc.WarehouseId != null && loc.WarehouseId == excludedLoc.WarehouseId)
            {
                rank = 1;
                rankReason = "Same facility / internal bay";
            }
            else if (excludedLoc?.BranchId != null && loc.BranchId != null && loc.BranchId == excludedLoc.BranchId)
            {
                rank = 2;
                rankReason = "Same regional branch";
            }
            else if (loc.Warehouse?.WarehouseType == "Central Warehouse" || (loc.BranchId == null && loc.WarehouseId == null))
            {
                rank = 3;
                rankReason = "Company central depot";
            }
            else
            {
                rank = 4;
                rankReason = "Alternative branch location";
            }

            alternatives.Add(new InventoryAlternativeLocationDto(
                loc.Id,
                loc.Code,
                loc.Name,
                loc.LocationType,
                loc.CompanyId,
                loc.Company?.LegalName ?? loc.Company?.TradeName,
                loc.BranchId,
                loc.Branch?.Name,
                loc.WarehouseId,
                loc.Warehouse?.Name,
                loc.DepartmentId,
                loc.Department?.Name,
                onHand,
                reserved,
                allocated,
                available,
                rank,
                rankReason
            ));
        }

        var sorted = alternatives
            .OrderBy(a => a.RecommendedRank)
            .ThenByDescending(a => a.AvailableQuantity)
            .ToList();

        return Result.Success<IReadOnlyList<InventoryAlternativeLocationDto>>(sorted);
    }
}

// ----------------------------------------------------
// 3. GET RESERVATIONS PAGED QUERY
// ----------------------------------------------------
public record GetInventoryReservationsPagedQuery(
    Guid? CompanyId = null,
    Guid? InventoryLocationId = null,
    Guid? ProductId = null,
    string? Status = null,
    Guid? SalesOrderId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<IReadOnlyList<InventoryReservationDto>>>;

public class GetInventoryReservationsPagedQueryHandler : IRequestHandler<GetInventoryReservationsPagedQuery, Result<IReadOnlyList<InventoryReservationDto>>>
{
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryReservationsPagedQueryHandler(
        IInventoryReservationRepository reservationRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<InventoryReservationDto>>> Handle(GetInventoryReservationsPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);

        // Guid.Empty means unauthenticated / no company context — return empty list
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<InventoryReservationDto>>(new List<InventoryReservationDto>());
        }

        // null means SuperAdmin (unrestricted). Use the request-provided companyId if given,
        // otherwise pass null so the repository returns all accessible reservations.
        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;

        // If an explicit companyId scope was resolved, validate access to it
        if (effectiveCompanyId.HasValue)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(effectiveCompanyId.Value, cancellationToken);
            if (!hasAccess)
            {
                return Result<IReadOnlyList<InventoryReservationDto>>.Failure(Error.Unauthorized("Reservation.Unauthorized", "Unauthorized access to requested company."));
            }
        }

        var reservations = await _reservationRepository.ListAsync(
            effectiveCompanyId,
            request.InventoryLocationId,
            request.ProductId,
            request.Status,
            request.SalesOrderId,
            request.FromDate,
            request.ToDate,
            request.Search,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = reservations.Select(r => new InventoryReservationDto(
            r.Id,
            r.CompanyId,
            r.InventoryLocationId,
            r.InventoryLocation?.Name ?? "Unknown Location",
            r.InventoryLocation?.Code ?? "LOC",
            r.ProductId,
            r.Product?.Name ?? "Unknown Product",
            r.Product?.Code ?? "PRD",
            r.Product?.Sku,
            r.Product?.BaseUom?.Name ?? "unit",
            r.ReservedQuantity,
            r.Status,
            r.SalesOrderId,
            r.SalesOrderLineId,
            r.ReservedAtUtc,
            r.ReleasedAtUtc,
            r.ExpiresAtUtc,
            r.CreatedAtUtc
        )).ToList();

        return Result.Success<IReadOnlyList<InventoryReservationDto>>(dtos);
    }
}

// ----------------------------------------------------
// 4. GET RESERVATION BY ID QUERY
// ----------------------------------------------------
public record GetInventoryReservationByIdQuery(Guid Id) : IRequest<Result<InventoryReservationDto>>;

public class GetInventoryReservationByIdQueryHandler : IRequestHandler<GetInventoryReservationByIdQuery, Result<InventoryReservationDto>>
{
    private readonly IInventoryReservationRepository _reservationRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryReservationByIdQueryHandler(
        IInventoryReservationRepository reservationRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _reservationRepository = reservationRepository ?? throw new ArgumentNullException(nameof(reservationRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<InventoryReservationDto>> Handle(GetInventoryReservationByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<InventoryReservationDto>.Failure(Error.Validation("Reservation.InvalidId", "Reservation ID is required."));

        var r = await _reservationRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (r == null)
            return Result<InventoryReservationDto>.Failure(Error.NotFound("Reservation.NotFound", "Inventory reservation not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(r.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<InventoryReservationDto>.Failure(Error.Unauthorized("Reservation.Unauthorized", "Unauthorized access to requested reservation."));

        var dto = new InventoryReservationDto(
            r.Id,
            r.CompanyId,
            r.InventoryLocationId,
            r.InventoryLocation?.Name ?? "Unknown Location",
            r.InventoryLocation?.Code ?? "LOC",
            r.ProductId,
            r.Product?.Name ?? "Unknown Product",
            r.Product?.Code ?? "PRD",
            r.Product?.Sku,
            r.Product?.BaseUom?.Name ?? "unit",
            r.ReservedQuantity,
            r.Status,
            r.SalesOrderId,
            r.SalesOrderLineId,
            r.ReservedAtUtc,
            r.ReleasedAtUtc,
            r.ExpiresAtUtc,
            r.CreatedAtUtc
        );

        return Result<InventoryReservationDto>.Success(dto);
    }
}
