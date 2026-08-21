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
    string? Description) : IRequest<Result<DepartmentDto>>;

public class CreateDepartmentCommandHandler : IRequestHandler<CreateDepartmentCommand, Result<DepartmentDto>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateDepartmentCommandHandler(
        IDepartmentRepository departmentRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
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
        if (request.BranchId.HasValue)
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

        var department = new Department
        {
            CompanyId = targetCompanyId,
            BranchId = request.BranchId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            Description = request.Description?.Trim(),
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
    bool IsActive) : IRequest<Result<DepartmentDto>>;

public class UpdateDepartmentCommandHandler : IRequestHandler<UpdateDepartmentCommand, Result<DepartmentDto>>
{
    private readonly IDepartmentRepository _departmentRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateDepartmentCommandHandler(
        IDepartmentRepository departmentRepository,
        ICompanyRepository companyRepository,
        IBranchRepository branchRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _departmentRepository = departmentRepository;
        _companyRepository = companyRepository;
        _branchRepository = branchRepository;
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
        if (request.BranchId.HasValue)
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

        department.CompanyId = targetCompanyId;
        department.BranchId = request.BranchId;
        department.Code = request.Code.ToUpperInvariant().Trim();
        department.Name = request.Name.Trim();
        department.Description = request.Description?.Trim();
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
