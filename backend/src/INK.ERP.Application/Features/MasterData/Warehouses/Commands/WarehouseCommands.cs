using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Warehouses.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Application.Features.MasterData.Warehouses.Commands;

public record CreateWarehouseCommand(
    Guid CompanyId,
    Guid BranchId,
    string Code,
    string Name,
    string WarehouseType,
    Guid? ManagerEmployeeId,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    double? CapacitySqFt,
    bool IsTemperatureControlled) : IRequest<Result<WarehouseDto>>;

public class CreateWarehouseCommandHandler : IRequestHandler<CreateWarehouseCommand, Result<WarehouseDto>>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateWarehouseCommandHandler(IWarehouseRepository warehouseRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _warehouseRepository = warehouseRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<WarehouseDto>> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _warehouseRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, null, cancellationToken))
        {
            return Result<WarehouseDto>.Failure(Error.Conflict("Warehouse.DuplicateCode", $"Warehouse code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var warehouse = new Warehouse
        {
            CompanyId = request.CompanyId,
            BranchId = request.BranchId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            WarehouseType = request.WarehouseType,
            ManagerEmployeeId = request.ManagerEmployeeId,
            Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country),
            CapacitySqFt = request.CapacitySqFt,
            IsTemperatureControlled = request.IsTemperatureControlled,
            IsActive = true
        };

        await _warehouseRepository.AddAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new WarehouseDto(
            warehouse.Id,
            warehouse.CompanyId,
            warehouse.BranchId,
            warehouse.Code,
            warehouse.Name,
            warehouse.WarehouseType,
            warehouse.ManagerEmployeeId,
            warehouse.Address.AddressLine1,
            warehouse.Address.AddressLine2,
            warehouse.Address.City,
            warehouse.Address.State,
            warehouse.Address.PostalCode,
            warehouse.Address.Country,
            warehouse.CapacitySqFt,
            warehouse.IsTemperatureControlled,
            warehouse.IsActive,
            warehouse.CreatedAtUtc);

        return Result<WarehouseDto>.Success(dto);
    }
}

public record UpdateWarehouseCommand(
    Guid Id,
    Guid CompanyId,
    Guid BranchId,
    string Code,
    string Name,
    string WarehouseType,
    Guid? ManagerEmployeeId,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    double? CapacitySqFt,
    bool IsTemperatureControlled,
    bool IsActive) : IRequest<Result<WarehouseDto>>;

public class UpdateWarehouseCommandHandler : IRequestHandler<UpdateWarehouseCommand, Result<WarehouseDto>>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateWarehouseCommandHandler(IWarehouseRepository warehouseRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _warehouseRepository = warehouseRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<WarehouseDto>> Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _warehouseRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<WarehouseDto>.Failure(Error.Conflict("Warehouse.DuplicateCode", $"Warehouse code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        warehouse.CompanyId = request.CompanyId;
        warehouse.BranchId = request.BranchId;
        warehouse.Code = request.Code.ToUpperInvariant().Trim();
        warehouse.Name = request.Name.Trim();
        warehouse.WarehouseType = request.WarehouseType;
        warehouse.ManagerEmployeeId = request.ManagerEmployeeId;
        warehouse.Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country);
        warehouse.CapacitySqFt = request.CapacitySqFt;
        warehouse.IsTemperatureControlled = request.IsTemperatureControlled;
        warehouse.IsActive = request.IsActive;

        await _warehouseRepository.UpdateAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new WarehouseDto(
            warehouse.Id,
            warehouse.CompanyId,
            warehouse.BranchId,
            warehouse.Code,
            warehouse.Name,
            warehouse.WarehouseType,
            warehouse.ManagerEmployeeId,
            warehouse.Address.AddressLine1,
            warehouse.Address.AddressLine2,
            warehouse.Address.City,
            warehouse.Address.State,
            warehouse.Address.PostalCode,
            warehouse.Address.Country,
            warehouse.CapacitySqFt,
            warehouse.IsTemperatureControlled,
            warehouse.IsActive,
            warehouse.CreatedAtUtc);

        return Result<WarehouseDto>.Success(dto);
    }
}

public record DeleteWarehouseCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteWarehouseCommandHandler : IRequestHandler<DeleteWarehouseCommand, Result<Unit>>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteWarehouseCommandHandler(IWarehouseRepository warehouseRepository, IUnitOfWork unitOfWork)
    {
        _warehouseRepository = warehouseRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID '{request.Id}' was not found."));
        }

        await _warehouseRepository.DeleteAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
