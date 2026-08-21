using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Warehouses.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Application.Features.MasterData.Warehouses.Commands;

public record CreateWarehouseCommand(
    Guid CompanyId,
    Guid? BranchId,
    string Code,
    string Name,
    string WarehouseType,
    string Status,
    Guid? ManagerEmployeeId,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    double? CapacitySqFt,
    int? PalletCapacity,
    int? CartonCapacity,
    string? ContactNumber,
    string? Email,
    double? Latitude,
    double? Longitude,
    string? Remarks,
    bool IsTemperatureControlled) : IRequest<Result<WarehouseDto>>;

public class CreateWarehouseCommandHandler : IRequestHandler<CreateWarehouseCommand, Result<WarehouseDto>>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateWarehouseCommandHandler(
        IWarehouseRepository warehouseRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _warehouseRepository = warehouseRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<WarehouseDto>> Handle(CreateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<WarehouseDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        if (request.BranchId.HasValue)
        {
            var branch = await _branchRepository.GetByIdAsync(request.BranchId.Value, cancellationToken);
            if (branch == null || branch.IsDeleted || branch.CompanyId != targetCompanyId)
            {
                return Result<WarehouseDto>.Failure(Error.Validation("Warehouse.InvalidBranch", "The selected branch does not exist or does not belong to the authorized company."));
            }
        }

        if (!await _warehouseRepository.IsCodeUniqueAsync(targetCompanyId, request.Code, null, cancellationToken))
        {
            return Result<WarehouseDto>.Failure(Error.Conflict("Warehouse.DuplicateCode", $"Warehouse code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var warehouse = new Warehouse
        {
            CompanyId = targetCompanyId,
            BranchId = request.BranchId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            WarehouseType = request.WarehouseType,
            Status = request.Status,
            ManagerEmployeeId = request.ManagerEmployeeId,
            Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country),
            CapacitySqFt = request.CapacitySqFt,
            PalletCapacity = request.PalletCapacity,
            CartonCapacity = request.CartonCapacity,
            ContactNumber = request.ContactNumber,
            Email = request.Email,
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Remarks = request.Remarks,
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

public record UpdateWarehouseCommand(
    Guid Id,
    Guid CompanyId,
    Guid? BranchId,
    string Code,
    string Name,
    string WarehouseType,
    string Status,
    Guid? ManagerEmployeeId,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    double? CapacitySqFt,
    int? PalletCapacity,
    int? CartonCapacity,
    string? ContactNumber,
    string? Email,
    double? Latitude,
    double? Longitude,
    string? Remarks,
    bool IsTemperatureControlled,
    bool IsActive) : IRequest<Result<WarehouseDto>>;

public class UpdateWarehouseCommandHandler : IRequestHandler<UpdateWarehouseCommand, Result<WarehouseDto>>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateWarehouseCommandHandler(
        IWarehouseRepository warehouseRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _warehouseRepository = warehouseRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<WarehouseDto>> Handle(UpdateWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(warehouse.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<WarehouseDto>.Failure(accessResult.Error);
        }

        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<WarehouseDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        if (request.BranchId.HasValue)
        {
            var branch = await _branchRepository.GetByIdAsync(request.BranchId.Value, cancellationToken);
            if (branch == null || branch.IsDeleted || branch.CompanyId != targetCompanyId)
            {
                return Result<WarehouseDto>.Failure(Error.Validation("Warehouse.InvalidBranch", "The selected branch does not exist or does not belong to the authorized company."));
            }
        }

        if (!await _warehouseRepository.IsCodeUniqueAsync(targetCompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<WarehouseDto>.Failure(Error.Conflict("Warehouse.DuplicateCode", $"Warehouse code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        warehouse.CompanyId = targetCompanyId;
        warehouse.BranchId = request.BranchId;
        warehouse.Code = request.Code.ToUpperInvariant().Trim();
        warehouse.Name = request.Name.Trim();
        warehouse.WarehouseType = request.WarehouseType;
        warehouse.Status = request.Status;
        warehouse.ManagerEmployeeId = request.ManagerEmployeeId;
        warehouse.Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country);
        warehouse.CapacitySqFt = request.CapacitySqFt;
        warehouse.PalletCapacity = request.PalletCapacity;
        warehouse.CartonCapacity = request.CartonCapacity;
        warehouse.ContactNumber = request.ContactNumber;
        warehouse.Email = request.Email;
        warehouse.Latitude = request.Latitude;
        warehouse.Longitude = request.Longitude;
        warehouse.Remarks = request.Remarks;
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

public record DeleteWarehouseCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteWarehouseCommandHandler : IRequestHandler<DeleteWarehouseCommand, Result<Unit>>
{
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteWarehouseCommandHandler(
        IWarehouseRepository warehouseRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _warehouseRepository = warehouseRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteWarehouseCommand request, CancellationToken cancellationToken)
    {
        var warehouse = await _warehouseRepository.GetByIdAsync(request.Id, cancellationToken);
        if (warehouse == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Warehouse.NotFound", $"Warehouse with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(warehouse.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        await _warehouseRepository.DeleteAsync(warehouse, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
