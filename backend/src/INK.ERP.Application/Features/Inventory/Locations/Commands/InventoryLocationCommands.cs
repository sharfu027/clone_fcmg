using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Locations.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Locations.Commands;

public record CreateInventoryLocationCommand(
    Guid CompanyId,
    Guid? BranchId,
    Guid? WarehouseId,
    Guid? DepartmentId,
    string Code,
    string Name,
    string? LocationType) : IRequest<Result<InventoryLocationDto>>;

public class CreateInventoryLocationCommandHandler : IRequestHandler<CreateInventoryLocationCommand, Result<InventoryLocationDto>>
{
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateInventoryLocationCommandHandler(
        IInventoryLocationRepository locationRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IWarehouseRepository warehouseRepository,
        IDepartmentRepository departmentRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _locationRepository = locationRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _warehouseRepository = warehouseRepository;
        _departmentRepository = departmentRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryLocationDto>> Handle(CreateInventoryLocationCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<InventoryLocationDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<InventoryLocationDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        Guid? effectiveBranchId = request.BranchId.HasValue && request.BranchId.Value != Guid.Empty ? request.BranchId.Value : null;
        if (effectiveBranchId.HasValue)
        {
            var branch = await _branchRepository.GetByIdAsync(effectiveBranchId.Value, cancellationToken);
            if (branch == null || branch.IsDeleted || branch.CompanyId != targetCompanyId)
            {
                return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.InvalidBranch", "The selected branch does not exist or does not belong to the authorized company."));
            }
        }

        Guid? effectiveWarehouseId = request.WarehouseId.HasValue && request.WarehouseId.Value != Guid.Empty ? request.WarehouseId.Value : null;
        if (effectiveWarehouseId.HasValue)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(effectiveWarehouseId.Value, cancellationToken);
            if (warehouse == null || !warehouse.IsActive || warehouse.CompanyId != targetCompanyId)
            {
                return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.InvalidWarehouse", "The selected warehouse does not exist, is inactive, or does not belong to the authorized company."));
            }

            if (warehouse.BranchId.HasValue && warehouse.BranchId.Value != Guid.Empty)
            {
                if (!effectiveBranchId.HasValue)
                {
                    return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.BranchWarehouseMismatch", "The selected warehouse belongs to a specific branch, but no matching branch was specified for this location."));
                }
                if (warehouse.BranchId.Value != effectiveBranchId.Value)
                {
                    return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.BranchWarehouseMismatch", "The selected warehouse belongs to a different branch than the specified location branch."));
                }
            }
        }

        Guid? effectiveDepartmentId = request.DepartmentId.HasValue && request.DepartmentId.Value != Guid.Empty ? request.DepartmentId.Value : null;
        if (effectiveDepartmentId.HasValue)
        {
            var department = await _departmentRepository.GetByIdAsync(effectiveDepartmentId.Value, cancellationToken);
            if (department == null || !department.IsActive || department.CompanyId != targetCompanyId)
            {
                return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.InvalidDepartment", "The selected department does not exist or does not belong to the authorized company."));
            }

            if (department.BranchId.HasValue && department.BranchId.Value != Guid.Empty)
            {
                if (!effectiveBranchId.HasValue)
                {
                    return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.BranchDepartmentMismatch", "The selected department belongs to a specific branch, but no matching branch was specified for this location."));
                }
                if (department.BranchId.Value != effectiveBranchId.Value)
                {
                    return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.BranchDepartmentMismatch", "The selected department belongs to a different branch than the specified location branch."));
                }
            }
        }

        string locationCode;
        if (string.IsNullOrWhiteSpace(request.Code) || request.Code.Equals("AUTO", StringComparison.OrdinalIgnoreCase))
        {
            locationCode = await _locationRepository.GenerateNextCodeAsync(targetCompanyId, cancellationToken);
        }
        else
        {
            locationCode = request.Code.ToUpperInvariant().Trim();
            if (!await _locationRepository.IsCodeUniqueAsync(targetCompanyId, locationCode, null, cancellationToken))
            {
                return Result<InventoryLocationDto>.Failure(Error.Conflict("InventoryLocation.DuplicateCode", $"Inventory location code '{locationCode}' already exists under company '{company.LegalName}'."));
            }
        }

        var locationType = string.IsNullOrWhiteSpace(request.LocationType) ? "Standard" : request.LocationType.Trim();

        var location = new InventoryLocation
        {
            CompanyId = targetCompanyId,
            BranchId = effectiveBranchId,
            WarehouseId = effectiveWarehouseId,
            DepartmentId = effectiveDepartmentId,
            Code = locationCode,
            Name = request.Name.Trim(),
            LocationType = locationType,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        await _locationRepository.AddAsync(location, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        // Fetch names for DTO
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
            company.LegalName,
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

public record UpdateInventoryLocationCommand(
    Guid Id,
    Guid? BranchId,
    Guid? WarehouseId,
    Guid? DepartmentId,
    string Code,
    string Name,
    string? LocationType,
    bool IsActive) : IRequest<Result<InventoryLocationDto>>;

public class UpdateInventoryLocationCommandHandler : IRequestHandler<UpdateInventoryLocationCommand, Result<InventoryLocationDto>>
{
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IWarehouseRepository _warehouseRepository;
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateInventoryLocationCommandHandler(
        IInventoryLocationRepository locationRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IWarehouseRepository warehouseRepository,
        IDepartmentRepository departmentRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _locationRepository = locationRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _warehouseRepository = warehouseRepository;
        _departmentRepository = departmentRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryLocationDto>> Handle(UpdateInventoryLocationCommand request, CancellationToken cancellationToken)
    {
        var location = await _locationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (location == null)
        {
            return Result<InventoryLocationDto>.Failure(Error.NotFound("InventoryLocation.NotFound", $"Inventory location with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(location.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<InventoryLocationDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(location.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<InventoryLocationDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{location.CompanyId}' was not found."));
        }

        Guid? effectiveBranchId = request.BranchId.HasValue && request.BranchId.Value != Guid.Empty ? request.BranchId.Value : null;
        if (effectiveBranchId.HasValue)
        {
            var branch = await _branchRepository.GetByIdAsync(effectiveBranchId.Value, cancellationToken);
            if (branch == null || branch.IsDeleted || branch.CompanyId != location.CompanyId)
            {
                return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.InvalidBranch", "The selected branch does not exist or does not belong to the authorized company."));
            }
        }

        Guid? effectiveWarehouseId = request.WarehouseId.HasValue && request.WarehouseId.Value != Guid.Empty ? request.WarehouseId.Value : null;
        if (effectiveWarehouseId.HasValue)
        {
            var warehouse = await _warehouseRepository.GetByIdAsync(effectiveWarehouseId.Value, cancellationToken);
            if (warehouse == null || !warehouse.IsActive || warehouse.CompanyId != location.CompanyId)
            {
                return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.InvalidWarehouse", "The selected warehouse does not exist, is inactive, or does not belong to the authorized company."));
            }

            if (warehouse.BranchId.HasValue && warehouse.BranchId.Value != Guid.Empty)
            {
                if (!effectiveBranchId.HasValue)
                {
                    return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.BranchWarehouseMismatch", "The selected warehouse belongs to a specific branch, but no matching branch was specified for this location."));
                }
                if (warehouse.BranchId.Value != effectiveBranchId.Value)
                {
                    return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.BranchWarehouseMismatch", "The selected warehouse belongs to a different branch than the specified location branch."));
                }
            }
        }

        Guid? effectiveDepartmentId = request.DepartmentId.HasValue && request.DepartmentId.Value != Guid.Empty ? request.DepartmentId.Value : null;
        if (effectiveDepartmentId.HasValue)
        {
            var department = await _departmentRepository.GetByIdAsync(effectiveDepartmentId.Value, cancellationToken);
            if (department == null || !department.IsActive || department.CompanyId != location.CompanyId)
            {
                return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.InvalidDepartment", "The selected department does not exist or does not belong to the authorized company."));
            }

            if (department.BranchId.HasValue && department.BranchId.Value != Guid.Empty)
            {
                if (!effectiveBranchId.HasValue)
                {
                    return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.BranchDepartmentMismatch", "The selected department belongs to a specific branch, but no matching branch was specified for this location."));
                }
                if (department.BranchId.Value != effectiveBranchId.Value)
                {
                    return Result<InventoryLocationDto>.Failure(Error.Validation("InventoryLocation.BranchDepartmentMismatch", "The selected department belongs to a different branch than the specified location branch."));
                }
            }
        }

        if (!await _locationRepository.IsCodeUniqueAsync(location.CompanyId, request.Code, location.Id, cancellationToken))
        {
            return Result<InventoryLocationDto>.Failure(Error.Conflict("InventoryLocation.DuplicateCode", $"Inventory location code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var locationType = string.IsNullOrWhiteSpace(request.LocationType) ? "Standard" : request.LocationType.Trim();

        location.BranchId = effectiveBranchId;
        location.WarehouseId = effectiveWarehouseId;
        location.DepartmentId = effectiveDepartmentId;
        location.Code = request.Code.ToUpperInvariant().Trim();
        location.Name = request.Name.Trim();
        location.LocationType = locationType;
        location.IsActive = request.IsActive;
        location.LastModifiedAtUtc = DateTime.UtcNow;

        await _locationRepository.UpdateAsync(location, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

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
            company.LegalName,
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

public record DeleteInventoryLocationCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteInventoryLocationCommandHandler : IRequestHandler<DeleteInventoryLocationCommand, Result<Unit>>
{
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteInventoryLocationCommandHandler(
        IInventoryLocationRepository locationRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _locationRepository = locationRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteInventoryLocationCommand request, CancellationToken cancellationToken)
    {
        var location = await _locationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (location == null)
        {
            return Result<Unit>.Failure(Error.NotFound("InventoryLocation.NotFound", $"Inventory location with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(location.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        location.IsActive = false;
        location.LastModifiedAtUtc = DateTime.UtcNow;
        await _locationRepository.UpdateAsync(location, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
