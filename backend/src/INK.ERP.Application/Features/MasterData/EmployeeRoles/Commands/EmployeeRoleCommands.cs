using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.EmployeeRoles.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.EmployeeRoles.Commands;

public record CreateEmployeeRoleCommand(
    Guid CompanyId,
    string Code,
    string Name,
    string? Description) : IRequest<Result<EmployeeRoleDto>>;

public class CreateEmployeeRoleCommandHandler : IRequestHandler<CreateEmployeeRoleCommand, Result<EmployeeRoleDto>>
{
    private readonly IEmployeeRoleRepository _employeeRoleRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateEmployeeRoleCommandHandler(
        IEmployeeRoleRepository employeeRoleRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRoleRepository = employeeRoleRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<EmployeeRoleDto>> Handle(CreateEmployeeRoleCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<EmployeeRoleDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<EmployeeRoleDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        if (!await _employeeRoleRepository.IsCodeUniqueAsync(targetCompanyId, request.Code, null, cancellationToken))
        {
            return Result<EmployeeRoleDto>.Failure(Error.Conflict("EmployeeRole.DuplicateCode", $"Employee role code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var role = new EmployeeRole
        {
            CompanyId = targetCompanyId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            IsActive = true
        };

        await _employeeRoleRepository.AddAsync(role, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new EmployeeRoleDto(
            role.Id,
            role.CompanyId,
            company.LegalName,
            role.Code,
            role.Name,
            role.Description,
            role.IsActive,
            role.CreatedAtUtc);

        return Result<EmployeeRoleDto>.Success(dto);
    }
}

public record UpdateEmployeeRoleCommand(
    Guid Id,
    Guid CompanyId,
    string Code,
    string Name,
    string? Description,
    bool IsActive) : IRequest<Result<EmployeeRoleDto>>;

public class UpdateEmployeeRoleCommandHandler : IRequestHandler<UpdateEmployeeRoleCommand, Result<EmployeeRoleDto>>
{
    private readonly IEmployeeRoleRepository _employeeRoleRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateEmployeeRoleCommandHandler(
        IEmployeeRoleRepository employeeRoleRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRoleRepository = employeeRoleRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<EmployeeRoleDto>> Handle(UpdateEmployeeRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _employeeRoleRepository.GetByIdAsync(request.Id, cancellationToken);
        if (role == null)
        {
            return Result<EmployeeRoleDto>.Failure(Error.NotFound("EmployeeRole.NotFound", $"Employee role with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(role.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<EmployeeRoleDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(role.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<EmployeeRoleDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{role.CompanyId}' was not found."));
        }

        if (!await _employeeRoleRepository.IsCodeUniqueAsync(role.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<EmployeeRoleDto>.Failure(Error.Conflict("EmployeeRole.DuplicateCode", $"Employee role code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        role.Code = request.Code.ToUpperInvariant().Trim();
        role.Name = request.Name.Trim();
        role.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        role.IsActive = request.IsActive;

        await _employeeRoleRepository.UpdateAsync(role, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new EmployeeRoleDto(
            role.Id,
            role.CompanyId,
            company.LegalName,
            role.Code,
            role.Name,
            role.Description,
            role.IsActive,
            role.CreatedAtUtc);

        return Result<EmployeeRoleDto>.Success(dto);
    }
}

public record DeleteEmployeeRoleCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteEmployeeRoleCommandHandler : IRequestHandler<DeleteEmployeeRoleCommand, Result<Unit>>
{
    private readonly IEmployeeRoleRepository _employeeRoleRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteEmployeeRoleCommandHandler(
        IEmployeeRoleRepository employeeRoleRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _employeeRoleRepository = employeeRoleRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteEmployeeRoleCommand request, CancellationToken cancellationToken)
    {
        var role = await _employeeRoleRepository.GetByIdAsync(request.Id, cancellationToken);
        if (role == null)
        {
            return Result<Unit>.Failure(Error.NotFound("EmployeeRole.NotFound", $"Employee role with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(role.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        // Soft archive / deactivate operation as required by production ERP architecture
        role.IsActive = false;
        await _employeeRoleRepository.UpdateAsync(role, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
