using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Branches.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Application.Features.MasterData.Branches.Commands;

public record UpdateBranchCommand(
    Guid Id,
    Guid CompanyId,
    string Code,
    string Name,
    string Gstin,
    string Email,
    string Phone,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    bool IsHeadquarters,
    bool IsActive,
    Guid? ManagerEmployeeId = null) : IRequest<Result<BranchDto>>;

public class UpdateBranchCommandHandler : IRequestHandler<UpdateBranchCommand, Result<BranchDto>>
{
    private readonly IBranchRepository _branchRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateBranchCommandHandler(
        IBranchRepository branchRepository,
        ICompanyRepository companyRepository,
        IEmployeeRepository employeeRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _branchRepository = branchRepository;
        _companyRepository = companyRepository;
        _employeeRepository = employeeRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<BranchDto>> Handle(UpdateBranchCommand request, CancellationToken cancellationToken)
    {
        var branch = await _branchRepository.GetByIdAsync(request.Id, cancellationToken);
        if (branch == null)
        {
            return Result<BranchDto>.Failure(Error.NotFound("Branch.NotFound", $"Branch with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(branch.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<BranchDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(branch.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<BranchDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{branch.CompanyId}' was not found."));
        }

        if (!await _branchRepository.IsCodeUniqueAsync(branch.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<BranchDto>.Failure(Error.Conflict("Branch.DuplicateCode", $"Branch code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        if (request.IsHeadquarters)
        {
            var existingHq = await _branchRepository.GetHeadquartersAsync(branch.CompanyId, cancellationToken);
            if (existingHq != null && existingHq.Id != request.Id)
            {
                return Result<BranchDto>.Failure(Error.Conflict("Branch.DuplicateHeadquarters", $"Company '{company.LegalName}' already has an active Headquarters branch ({existingHq.Name})."));
            }
        }

        Employee? manager = null;
        if (request.ManagerEmployeeId.HasValue && request.ManagerEmployeeId.Value != Guid.Empty)
        {
            manager = await _employeeRepository.GetByIdWithDetailsAsync(request.ManagerEmployeeId.Value, cancellationToken);
            if (manager == null || !manager.IsActive || manager.CompanyId != branch.CompanyId)
            {
                return Result<BranchDto>.Failure(Error.Validation("Branch.InvalidManager", "The selected manager employee does not exist, is inactive, or does not belong to the authorized company."));
            }
            if (manager.BranchId.HasValue && manager.BranchId.Value != Guid.Empty && manager.BranchId.Value != branch.Id)
            {
                return Result<BranchDto>.Failure(Error.Validation("Branch.ManagerBranchMismatch", "The selected manager employee is assigned to a different branch."));
            }
        }

        branch.Code = request.Code.ToUpperInvariant().Trim();
        branch.Name = request.Name.Trim();
        branch.Gstin = request.Gstin.Trim();
        branch.Email = request.Email.Trim();
        branch.Phone = request.Phone.Trim();
        branch.Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country);
        branch.IsHeadquarters = request.IsHeadquarters;
        branch.IsActive = request.IsActive;
        branch.ManagerEmployeeId = (request.ManagerEmployeeId.HasValue && request.ManagerEmployeeId.Value != Guid.Empty) ? request.ManagerEmployeeId : null;

        await _branchRepository.UpdateAsync(branch, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new BranchDto(
            branch.Id,
            branch.CompanyId,
            company.LegalName,
            branch.Code,
            branch.Name,
            branch.Gstin,
            branch.Email,
            branch.Phone,
            branch.Address.AddressLine1,
            branch.Address.AddressLine2,
            branch.Address.City,
            branch.Address.State,
            branch.Address.PostalCode,
            branch.Address.Country,
            branch.IsHeadquarters,
            branch.IsActive,
            branch.ManagerEmployeeId,
            manager != null ? $"{manager.FirstName} {manager.LastName}".Trim() : null,
            manager?.EmployeeCode,
            branch.CreatedAtUtc);

        return Result<BranchDto>.Success(dto);
    }
}

public record DeleteBranchCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteBranchCommandHandler : IRequestHandler<DeleteBranchCommand, Result<Unit>>
{
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteBranchCommandHandler(
        IBranchRepository branchRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _branchRepository = branchRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteBranchCommand request, CancellationToken cancellationToken)
    {
        var branch = await _branchRepository.GetByIdAsync(request.Id, cancellationToken);
        if (branch == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Branch.NotFound", $"Branch with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(branch.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        branch.IsDeleted = true;
        branch.IsActive = false;
        await _branchRepository.UpdateAsync(branch, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
