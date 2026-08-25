using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Locations.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.Inventory.Locations.Queries;

public record GetInventoryLocationByIdQuery(Guid Id) : IRequest<Result<InventoryLocationDto>>;

public class GetInventoryLocationByIdQueryHandler : IRequestHandler<GetInventoryLocationByIdQuery, Result<InventoryLocationDto>>
{
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryLocationByIdQueryHandler(
        IInventoryLocationRepository locationRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IWarehouseRepository warehouseRepository,
        IDepartmentRepository departmentRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _locationRepository = locationRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _warehouseRepository = warehouseRepository;
        _departmentRepository = departmentRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryLocationDto>> Handle(GetInventoryLocationByIdQuery request, CancellationToken cancellationToken)
    {
        var location = await _locationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (location == null)
        {
            return Result<InventoryLocationDto>.Failure(Error.NotFound("InventoryLocation.NotFound", $"Inventory location with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(location.CompanyId, cancellationToken))
        {
            return Result<InventoryLocationDto>.Failure(Error.NotFound("InventoryLocation.NotFound", $"Inventory location with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(location.CompanyId, cancellationToken);

        string? branchName = null;
        if (location.BranchId.HasValue)
        {
            var b = await _branchRepository.GetByIdAsync(location.BranchId.Value, cancellationToken);
            branchName = b?.Name;
        }

        string? warehouseName = null;
        if (location.WarehouseId.HasValue)
        {
            var w = await _warehouseRepository.GetByIdAsync(location.WarehouseId.Value, cancellationToken);
            warehouseName = w?.Name;
        }

        string? departmentName = null;
        if (location.DepartmentId.HasValue)
        {
            var d = await _departmentRepository.GetByIdAsync(location.DepartmentId.Value, cancellationToken);
            departmentName = d?.Name;
        }

        var dto = new InventoryLocationDto(
            location.Id,
            location.CompanyId,
            company?.LegalName,
            location.BranchId,
            branchName,
            location.WarehouseId,
            warehouseName,
            location.DepartmentId,
            departmentName,
            location.Code,
            location.Name,
            location.LocationType,
            location.IsActive,
            location.CreatedAtUtc,
            location.LastModifiedAtUtc);

        return Result<InventoryLocationDto>.Success(dto);
    }
}

public record GetInventoryLocationsPagedQuery(
    Guid? CompanyId = null,
    Guid? BranchId = null,
    Guid? WarehouseId = null,
    Guid? DepartmentId = null,
    string? LocationType = null,
    bool? IsActive = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 50) : IRequest<Result<IReadOnlyList<InventoryLocationDto>>>;

public class GetInventoryLocationsPagedQueryHandler : IRequestHandler<GetInventoryLocationsPagedQuery, Result<IReadOnlyList<InventoryLocationDto>>>
{
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryLocationsPagedQueryHandler(
        IInventoryLocationRepository locationRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IWarehouseRepository warehouseRepository,
        IDepartmentRepository departmentRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _locationRepository = locationRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _warehouseRepository = warehouseRepository;
        _departmentRepository = departmentRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<InventoryLocationDto>>> Handle(GetInventoryLocationsPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<InventoryLocationDto>>(new List<InventoryLocationDto>());
        }

        var locations = await _locationRepository.GetAllAsync(cancellationToken);
        var query = locations.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(l => l.CompanyId == effectiveCompanyId.Value);
        }

        if (request.BranchId.HasValue)
        {
            query = query.Where(l => l.BranchId == request.BranchId.Value);
        }

        if (request.WarehouseId.HasValue)
        {
            query = query.Where(l => l.WarehouseId == request.WarehouseId.Value);
        }

        if (request.DepartmentId.HasValue)
        {
            query = query.Where(l => l.DepartmentId == request.DepartmentId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.LocationType) && !string.Equals(request.LocationType, "All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(l => l.LocationType.Equals(request.LocationType, StringComparison.OrdinalIgnoreCase));
        }

        if (request.IsActive.HasValue)
        {
            query = query.Where(l => l.IsActive == request.IsActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(l => l.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     l.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        var pagedItems = query
            .OrderBy(l => l.Code)
            .Skip((Math.Max(request.Page, 1) - 1) * Math.Max(request.PageSize, 1))
            .Take(Math.Max(request.PageSize, 1))
            .ToList();

        var dtos = new List<InventoryLocationDto>();
        foreach (var l in pagedItems)
        {
            var company = await _companyRepository.GetByIdAsync(l.CompanyId, cancellationToken);
            string? branchName = null;
            if (l.BranchId.HasValue)
            {
                var b = await _branchRepository.GetByIdAsync(l.BranchId.Value, cancellationToken);
                branchName = b?.Name;
            }

            string? warehouseName = null;
            if (l.WarehouseId.HasValue)
            {
                var w = await _warehouseRepository.GetByIdAsync(l.WarehouseId.Value, cancellationToken);
                warehouseName = w?.Name;
            }

            string? departmentName = null;
            if (l.DepartmentId.HasValue)
            {
                var d = await _departmentRepository.GetByIdAsync(l.DepartmentId.Value, cancellationToken);
                departmentName = d?.Name;
            }

            dtos.Add(new InventoryLocationDto(
                l.Id,
                l.CompanyId,
                company?.LegalName,
                l.BranchId,
                branchName,
                l.WarehouseId,
                warehouseName,
                l.DepartmentId,
                departmentName,
                l.Code,
                l.Name,
                l.LocationType,
                l.IsActive,
                l.CreatedAtUtc,
                l.LastModifiedAtUtc));
        }

        return Result.Success<IReadOnlyList<InventoryLocationDto>>(dtos);
    }
}
