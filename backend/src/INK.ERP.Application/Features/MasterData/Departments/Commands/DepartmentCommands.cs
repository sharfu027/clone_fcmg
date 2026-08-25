using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Departments.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Departments.Commands;

public record CreateDepartmentCommand(
    Guid CompanyId,
    Guid? BranchId,
    string Code,
    string Name,
    string? Description,
    Guid? ManagerEmployeeId = null) : IRequest<Result<DepartmentDto>>;

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, Result<DepartmentDto>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateDepartmentCommandHandler(
        IDepartmentRepository departmentRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<DepartmentDto>> Handle(CreateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<DepartmentDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        Branch? branch = null;
        if (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty)
        {
            branch = await _branchRepository.GetByIdAsync(request.BranchId.Value, cancellationToken);
            if (branch == null || branch.IsDeleted || branch.CompanyId != targetCompanyId)
            {
                return Result<DepartmentDto>.Failure(Error.Validation("Department.InvalidBranch", "The selected branch does not exist or does not belong to the authorized company."));
            }
        }

        if (!await _departmentRepository.IsCodeUniqueAsync(targetCompanyId, request.Code, null, cancellationToken))
        {
            return Result<DepartmentDto>.Failure(Error.Conflict("Department.DuplicateCode", $"Department code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        Employee? manager = null;
        if (request.ManagerEmployeeId.HasValue && request.ManagerEmployeeId.Value != Guid.Empty)
        {
            manager = await _employeeRepository.GetByIdWithDetailsAsync(request.ManagerEmployeeId.Value, cancellationToken);
            if (manager == null || !manager.IsActive || manager.CompanyId != targetCompanyId)
            {
                return Result<DepartmentDto>.Failure(Error.Validation("Department.InvalidManager", "The selected manager employee does not exist, is inactive, or does not belong to the authorized company."));
            }
            if (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty)
            {
                if (manager.BranchId.HasValue && manager.BranchId.Value != Guid.Empty && manager.BranchId.Value != request.BranchId.Value)
                {
                    return Result<DepartmentDto>.Failure(Error.Validation("Department.ManagerBranchMismatch", "The selected manager employee belongs to a different branch than the department."));
                }
            }
        }

        var department = new Department
        {
            CompanyId = targetCompanyId,
            BranchId = (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty) ? request.BranchId : null,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
            ManagerEmployeeId = (request.ManagerEmployeeId.HasValue && request.ManagerEmployeeId.Value != Guid.Empty) ? request.ManagerEmployeeId : null,
            IsActive = true
        };

        await _departmentRepository.AddAsync(department, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new DepartmentDto(
            department.Id,
            department.CompanyId,
            company.LegalName,
            department.BranchId,
            branch?.Name,
            department.Code,
            department.Name,
            department.Description,
            department.IsActive,
            department.ManagerEmployeeId,
            manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
            manager?.EmployeeCode,
            department.CreatedAtUtc);

        return Result<DepartmentDto>.Success(dto);
    }
}

public record UpdateDepartmentCommand(
    Guid Id,
    Guid CompanyId,
    Guid? BranchId,
    string Code,
    string Name,
    string? Description,
    bool IsActive,
    Guid? ManagerEmployeeId = null) : IRequest<Result<DepartmentDto>>;

public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, Result<DepartmentDto>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateDepartmentCommandHandler(
        IDepartmentRepository departmentRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<DepartmentDto>> Handle(UpdateDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (department == null)
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Department.NotFound", $"Department with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(department.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<DepartmentDto>.Failure(accessResult.Error);
        }

        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<DepartmentDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        Branch? newBranch = null;
        if (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty)
        {
            newBranch = await _branchRepository.GetByIdAsync(request.BranchId.Value, cancellationToken);
            if (newBranch == null || newBranch.IsDeleted || newBranch.CompanyId != targetCompanyId)
            {
                return Result<DepartmentDto>.Failure(Error.Validation("Department.InvalidBranch", "The selected branch does not exist or does not belong to the target company."));
            }
        }

        if (!await _departmentRepository.IsCodeUniqueAsync(targetCompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<DepartmentDto>.Failure(Error.Conflict("Department.DuplicateCode", $"Department code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        Employee? manager = null;
        if (request.ManagerEmployeeId.HasValue && request.ManagerEmployeeId.Value != Guid.Empty)
        {
            manager = await _employeeRepository.GetByIdWithDetailsAsync(request.ManagerEmployeeId.Value, cancellationToken);
            if (manager == null || !manager.IsActive || manager.CompanyId != targetCompanyId)
            {
                return Result<DepartmentDto>.Failure(Error.Validation("Department.InvalidManager", "The selected manager employee does not exist, is inactive, or does not belong to the authorized company."));
            }
            if (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty)
            {
                if (manager.BranchId.HasValue && manager.BranchId.Value != Guid.Empty && manager.BranchId.Value != request.BranchId.Value)
                {
                    return Result<DepartmentDto>.Failure(Error.Validation("Department.ManagerBranchMismatch", "The selected manager employee belongs to a different branch than the department."));
                }
            }
        }

        department.CompanyId = targetCompanyId;
        department.BranchId = (request.BranchId.HasValue && request.BranchId.Value != Guid.Empty) ? request.BranchId : null;
        department.Code = request.Code.ToUpperInvariant().Trim();
        department.Name = request.Name.Trim();
        department.Description = request.Description?.Trim();
        department.ManagerEmployeeId = (request.ManagerEmployeeId.HasValue && request.ManagerEmployeeId.Value != Guid.Empty) ? request.ManagerEmployeeId : null;
        department.IsActive = request.IsActive;

        await _departmentRepository.UpdateAsync(department, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new DepartmentDto(
            department.Id,
            department.CompanyId,
            company.LegalName,
            department.BranchId,
            newBranch?.Name,
            department.Code,
            department.Name,
            department.Description,
            department.IsActive,
            department.ManagerEmployeeId,
            manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
            manager?.EmployeeCode,
            department.CreatedAtUtc);

        return Result<DepartmentDto>.Success(dto);
    }
}

public record DeleteDepartmentCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteDepartmentCommandHandler : IRequestHandler<DeleteDepartmentCommand, Result<Unit>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteDepartmentCommandHandler(
        IDepartmentRepository departmentRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteDepartmentCommand request, CancellationToken cancellationToken)
    {
        var department = await _departmentRepository.GetByIdAsync(request.Id, cancellationToken);
        if (department == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Department.NotFound", $"Department with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(department.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        await _departmentRepository.DeleteAsync(department, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
