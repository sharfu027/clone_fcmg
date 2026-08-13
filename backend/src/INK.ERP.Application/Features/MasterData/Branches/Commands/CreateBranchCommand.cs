using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Branches.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Application.Features.MasterData.Branches.Commands;

public record CreateBranchCommand(
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
    bool IsHeadquarters) : IRequest<Result<BranchDto>>;

public class CreateBranchCommandHandler : IRequestHandler<CreateBranchCommand, Result<BranchDto>>
{
    private readonly IBranchRepository _branchRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateBranchCommandHandler(IBranchRepository branchRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _branchRepository = branchRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<BranchDto>> Handle(CreateBranchCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<BranchDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _branchRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, null, cancellationToken))
        {
            return Result<BranchDto>.Failure(Error.Conflict("Branch.DuplicateCode", $"Branch code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        if (request.IsHeadquarters)
        {
            var existingHq = await _branchRepository.GetHeadquartersAsync(request.CompanyId, cancellationToken);
            if (existingHq != null)
            {
                return Result<BranchDto>.Failure(Error.Conflict("Branch.DuplicateHeadquarters", $"Company '{company.LegalName}' already has an active Headquarters branch ({existingHq.Name})."));
            }
        }

        var branch = new Branch
        {
            CompanyId = request.CompanyId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            Gstin = request.Gstin.Trim(),
            Email = request.Email.Trim(),
            Phone = request.Phone.Trim(),
            Address = new Address(request.AddressLine1, request.AddressLine2, request.City, request.State, request.PostalCode, request.Country),
            IsHeadquarters = request.IsHeadquarters,
            IsActive = true
        };

        await _branchRepository.AddAsync(branch, cancellationToken);
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
