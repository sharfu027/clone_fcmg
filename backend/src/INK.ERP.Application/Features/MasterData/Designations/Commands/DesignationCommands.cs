using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Designations.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Designations.Commands;

public record CreateDesignationCommand(
    Guid CompanyId,
    string Code,
    string Title,
    int Level,
    decimal? ApprovalLimit) : IRequest<Result<DesignationDto>>;

public class CreateDesignationCommandHandler : IRequestHandler<CreateDesignationCommand, Result<DesignationDto>>
{
    private readonly IDesignationRepository _designationRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateDesignationCommandHandler(
        IDesignationRepository designationRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _designationRepository = designationRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<DesignationDto>> Handle(CreateDesignationCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<DesignationDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<DesignationDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        if (!await _designationRepository.IsCodeUniqueAsync(targetCompanyId, request.Code, null, cancellationToken))
        {
            return Result<DesignationDto>.Failure(Error.Conflict("Designation.DuplicateCode", $"Designation code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var designation = new Designation
        {
            CompanyId = targetCompanyId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Title = request.Title.Trim(),
            Level = request.Level,
            ApprovalLimit = request.ApprovalLimit,
            IsActive = true
        };

        await _designationRepository.AddAsync(designation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new DesignationDto(
            designation.Id,
            designation.CompanyId,
            company.LegalName,
            designation.Code,
            designation.Title,
            designation.Level,
            designation.ApprovalLimit,
            designation.IsActive,
            designation.CreatedAtUtc);

        return Result<DesignationDto>.Success(dto);
    }
}

public record UpdateDesignationCommand(
    Guid Id,
    Guid CompanyId,
    string Code,
    string Title,
    int Level,
    decimal? ApprovalLimit,
    bool IsActive) : IRequest<Result<DesignationDto>>;

public class UpdateDesignationCommandHandler : IRequestHandler<UpdateDesignationCommand, Result<DesignationDto>>
{
    private readonly IDesignationRepository _designationRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateDesignationCommandHandler(
        IDesignationRepository designationRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _designationRepository = designationRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<DesignationDto>> Handle(UpdateDesignationCommand request, CancellationToken cancellationToken)
    {
        var designation = await _designationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (designation == null)
        {
            return Result<DesignationDto>.Failure(Error.NotFound("Designation.NotFound", $"Designation with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(designation.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<DesignationDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(designation.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<DesignationDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{designation.CompanyId}' was not found."));
        }

        if (!await _designationRepository.IsCodeUniqueAsync(designation.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<DesignationDto>.Failure(Error.Conflict("Designation.DuplicateCode", $"Designation code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        designation.Code = request.Code.ToUpperInvariant().Trim();
        designation.Title = request.Title.Trim();
        designation.Level = request.Level;
        designation.ApprovalLimit = request.ApprovalLimit;
        designation.IsActive = request.IsActive;

        await _designationRepository.UpdateAsync(designation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new DesignationDto(
            designation.Id,
            designation.CompanyId,
            company.LegalName,
            designation.Code,
            designation.Title,
            designation.Level,
            designation.ApprovalLimit,
            designation.IsActive,
            designation.CreatedAtUtc);

        return Result<DesignationDto>.Success(dto);
    }
}

public record DeleteDesignationCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteDesignationCommandHandler : IRequestHandler<DeleteDesignationCommand, Result<Unit>>
{
    private readonly IDesignationRepository _designationRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteDesignationCommandHandler(
        IDesignationRepository designationRepository,
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _designationRepository = designationRepository;
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteDesignationCommand request, CancellationToken cancellationToken)
    {
        var designation = await _designationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (designation == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Designation.NotFound", $"Designation with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(designation.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        // Prevent deletion if designation is currently assigned to one or more employees
        var assignedEmployees = await _employeeRepository.FindAsync(e => e.DesignationId == request.Id, cancellationToken);
        if (assignedEmployees.Count > 0)
        {
            var count = assignedEmployees.Count;
            var employeeWord = count == 1 ? "employee" : "employees";
            return Result<Unit>.Failure(Error.Conflict(
                "Designation.InUse",
                $"Cannot delete designation '{designation.Title}'. It is currently assigned to {count} {employeeWord}."));
        }

        await _designationRepository.DeleteAsync(designation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
