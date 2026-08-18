using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Warehouses.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Warehouses.Queries;

public record GetWarehouseByIdQuery(Guid Id) : IRequest<Result<WarehouseDto>>;

public class GetWarehouseByIdQueryHandler : IRequestHandler<GetWarehouseByIdQuery, Result<WarehouseDto>>
{
    private readonly IWarehouseRepository _warehouseRepository;

    public GetWarehouseByIdQueryHandler(IWarehouseRepository warehouseRepository)
    {
        _warehouseRepository = warehouseRepository;
    }

    public async Task<Result<WarehouseDto>> Handle(GetWarehouseByIdQuery request, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID '{request.Id}' was not found."));
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
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<WarehouseDto>>>;

public class GetWarehousesPagedQueryHandler : IRequestHandler<GetWarehousesPagedQuery, Result<IReadOnlyList<WarehouseDto>>>
{
    private readonly IWarehouseRepository _warehouseRepository;

    public GetWarehousesPagedQueryHandler(IWarehouseRepository warehouseRepository)
    {
        _warehouseRepository = warehouseRepository;
    }

    public async Task<Result<IReadOnlyList<WarehouseDto>>> Handle(GetWarehousesPagedQuery request, CancellationToken cancellationToken)
    {
        var warehouses = await _warehouseRepository.GetAllAsync(cancellationToken);
        var query = warehouses.AsQueryable();

        if (request.CompanyId.HasValue)
        {
            query = query.Where(w => w.CompanyId == request.CompanyId.Value);
        }

        if (request.BranchId.HasValue)
        {
            query = query.Where(w => w.BranchId == request.BranchId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(w => w.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     w.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(w => string.Equals(w.Status, request.Status, StringComparison.OrdinalIgnoreCase) ||
                                     (string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase) && w.IsActive));
        }

        var list = query
            .OrderBy(w => w.Code)
            .Select(warehouse => new WarehouseDto(
                warehouse.Id,
                warehouse.CompanyId,
                warehouse.BranchId,
                warehouse.Code,
                warehouse.Name,
                warehouse.WarehouseType,
                warehouse.Status,
                warehouse.ManagerEmployeeId,
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
                warehouse.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<WarehouseDto>>(list);
    }
}
