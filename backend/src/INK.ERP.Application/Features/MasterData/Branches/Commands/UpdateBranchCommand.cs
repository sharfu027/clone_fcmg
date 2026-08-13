using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Branches.DTOs;
using INK.ERP.Domain.Common;
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
    bool IsActive) : IRequest<Result<BranchDto>>;

public class UpdateBranchCommandHandler : IRequestHandler<UpdateBranchCommand, Result<BranchDto>>
{
    private readonly IBranchRepository _branchRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateBranchCommandHandler(IBranchRepository branchRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _branchRepository = branchRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<BranchDto>> Handle(UpdateBranchCommand request, CancellationToken cancellationToken)
    {
        var branch = await _branchRepository.GetByIdAsync(request.Id, cancellationToken);
        if (branch == null)
        {
            return Result<BranchDto>.Failure(Error.NotFound("Branch.NotFound", $"Branch with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<BranchDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _branchRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<BranchDto>.Failure(Error.Conflict("Branch.DuplicateCode", $"Branch code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        if (request.IsHeadquarters)
        {
            var existingHq = await _branchRepository.GetHeadquartersAsync(request.CompanyId, cancellationToken);
            if (existingHq != null && existingHq.Id != request.Id)
            {
                return Result<BranchDto>.Failure(Error.Conflict("Branch.DuplicateHeadquarters", $"Company '{company.LegalName}' already has an active Headquarters branch ({existingHq.Name})."));
            }
        }

        branch.CompanyId = request.CompanyId;
        branch.Code = request.Code.ToUpperInvariant().Trim();
        branch.Name = request.Name.Trim();
        branch.Gstin = request.Gstin.Trim();
        branch.Email = request.Email.Trim();
        branch.Phone = request.Phone.Trim();
        branch.Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country);
        branch.IsHeadquarters = request.IsHeadquarters;
        branch.IsActive = request.IsActive;

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
            branch.CreatedAtUtc);

        return Result<BranchDto>.Success(dto);
    }
}

public record DeleteBranchCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteBranchCommandHandler : IRequestHandler<DeleteBranchCommand, Result<Unit>>
{
    private readonly IBranchRepository _branchRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteBranchCommandHandler(IBranchRepository branchRepository, IUnitOfWork unitOfWork)
    {
        _branchRepository = branchRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteBranchCommand request, CancellationToken cancellationToken)
    {
        var branch = await _branchRepository.GetByIdAsync(request.Id, cancellationToken);
        if (branch == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Branch.NotFound", $"Branch with ID '{request.Id}' was not found."));
        }

        await _branchRepository.DeleteAsync(branch, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
