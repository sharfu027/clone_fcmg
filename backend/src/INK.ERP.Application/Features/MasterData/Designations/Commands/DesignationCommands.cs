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

    public CreateDesignationCommandHandler(IDesignationRepository designationRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _designationRepository = designationRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DesignationDto>> Handle(CreateDesignationCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<DesignationDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _designationRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, null, cancellationToken))
        {
            return Result<DesignationDto>.Failure(Error.Conflict("Designation.DuplicateCode", $"Designation code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var designation = new Designation
        {
            CompanyId = request.CompanyId,
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

    public UpdateDesignationCommandHandler(IDesignationRepository designationRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _designationRepository = designationRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<DesignationDto>> Handle(UpdateDesignationCommand request, CancellationToken cancellationToken)
    {
        var designation = await _designationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (designation == null)
        {
            return Result<DesignationDto>.Failure(Error.NotFound("Designation.NotFound", $"Designation with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<DesignationDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _designationRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<DesignationDto>.Failure(Error.Conflict("Designation.DuplicateCode", $"Designation code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        designation.CompanyId = request.CompanyId;
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
    private readonly IUnitOfWork _unitOfWork;

    public DeleteDesignationCommandHandler(IDesignationRepository designationRepository, IUnitOfWork unitOfWork)
    {
        _designationRepository = designationRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteDesignationCommand request, CancellationToken cancellationToken)
    {
        var designation = await _designationRepository.GetByIdAsync(request.Id, cancellationToken);
        if (designation == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Designation.NotFound", $"Designation with ID '{request.Id}' was not found."));
        }

        await _designationRepository.DeleteAsync(designation, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
