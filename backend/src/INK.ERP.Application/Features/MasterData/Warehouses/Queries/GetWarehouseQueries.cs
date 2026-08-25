using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Warehouses.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Warehouses.Queries;

public record GetWarehouseByIdQuery(Guid Id) : IRequest<Result<WarehouseDto>>;

public class GetWarehouseByIdQueryHandler : IRequestHandler<GetWarehouseByIdQuery, Result<WarehouseDto>>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetWarehouseByIdQueryHandler(
        IWarehouseRepository warehouseRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _warehouseRepository = warehouseRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<WarehouseDto>> Handle(GetWarehouseByIdQuery request, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(warehouse.CompanyId, cancellationToken))
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID '{request.Id}' was not found."));
        }

        Employee? manager = null;
        if (warehouse.ManagerEmployeeId.HasValue)
        {
            manager = await _employeeRepository.GetByIdWithDetailsAsync(warehouse.ManagerEmployeeId.Value, cancellationToken);
        }

        var dto = new WarehouseDto(
            warehouse.Id,
            warehouse.CompanyId,
            warehouse.BranchId,
            warehouse.Code,
            warehouse.Name,
            warehouse.WarehouseType,
            warehouse.Status,
            warehouse.ManagerEmployeeId,
            manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
            manager?.EmployeeCode,
            warehouse.Address.AddressLine1,
            warehouse.Address.AddressLine2,
            warehouse.Address.City,
            warehouse.Address.State,
            warehouse.Address.PostalCode,
            warehouse.Address.Country,
            warehouse.CapacitySqFt,
            warehouse.PalletCapacity,
            warehouse.CartonCapacity,
            warehouse.ContactNumber,
            warehouse.Email,
            warehouse.Latitude,
            warehouse.Longitude,
            warehouse.Remarks,
            warehouse.IsTemperatureControlled,
            warehouse.IsActive,
            warehouse.CreatedAtUtc);

        return Result<WarehouseDto>.Success(dto);
    }
}

public record GetWarehousesPagedQuery(
    Guid? CompanyId = null,
    Guid? BranchId = null,
    string? WarehouseType = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<WarehouseDto>>>;

public class GetWarehousesPagedQueryHandler : IRequestHandler<GetWarehousesPagedQuery, Result<IReadOnlyList<WarehouseDto>>>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetWarehousesPagedQueryHandler(
        IWarehouseRepository warehouseRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _warehouseRepository = warehouseRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<WarehouseDto>>> Handle(GetWarehousesPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<WarehouseDto>>(new List<WarehouseDto>());
        }

        var warehouses = await _warehouseRepository.GetAllAsync(cancellationToken);
        var query = warehouses.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(w => w.CompanyId == effectiveCompanyId.Value);
        }

        if (request.BranchId.HasValue)
        {
            query = query.Where(d => d.BranchId == request.BranchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.WarehouseType))
        {
            query = query.Where(w => w.WarehouseType.Equals(request.WarehouseType, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(w => w.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     w.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     (!string.IsNullOrEmpty(w.ContactNumber) && w.ContactNumber.Contains(search, StringComparison.OrdinalIgnoreCase)) ||
                                     (!string.IsNullOrEmpty(w.Email) && w.Email.Contains(search, StringComparison.OrdinalIgnoreCase)));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(w => w.IsActive == isActive);
        }

        var allEmployees = await _employeeRepository.GetAllAsync(cancellationToken);
        var empMap = allEmployees.ToDictionary(e => e.Id, e => e);

        var list = query
            .OrderBy(w => w.Code)
            .AsEnumerable()
            .Select(warehouse => {
                Employee? manager = null;
                if (warehouse.ManagerEmployeeId.HasValue && empMap.TryGetValue(warehouse.ManagerEmployeeId.Value, out var emp))
                {
                    manager = emp;
                }

                return new WarehouseDto(
                    warehouse.Id,
                    warehouse.CompanyId,
                    warehouse.BranchId,
                    warehouse.Code,
                    warehouse.Name,
                    warehouse.WarehouseType,
                    warehouse.Status,
                    warehouse.ManagerEmployeeId,
                    manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
                    manager?.EmployeeCode,
                    warehouse.Address.AddressLine1,
                    warehouse.Address.AddressLine2,
                    warehouse.Address.City,
                    warehouse.Address.State,
                    warehouse.Address.PostalCode,
                    warehouse.Address.Country,
                    warehouse.CapacitySqFt,
                    warehouse.PalletCapacity,
                    warehouse.CartonCapacity,
                    warehouse.ContactNumber,
                    warehouse.Email,
                    warehouse.Latitude,
                    warehouse.Longitude,
                    warehouse.Remarks,
                    warehouse.IsTemperatureControlled,
                    warehouse.IsActive,
                    warehouse.CreatedAtUtc);
            })
            .ToList();

        return Result.Success<IReadOnlyList<WarehouseDto>>(list);
    }
}
