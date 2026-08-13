using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.UnitsOfMeasure.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.UnitsOfMeasure.Commands;

public record CreateUnitOfMeasureCommand(
    Guid CompanyId,
    string Code,
    string Name,
    string BaseUnitCode,
    decimal ConversionFactor,
    bool IsFractionalAllowed) : IRequest<Result<UnitOfMeasureDto>>;

public class CreateUnitOfMeasureCommandHandler : IRequestHandler<CreateUnitOfMeasureCommand, Result<UnitOfMeasureDto>>
{
    private readonly IUnitOfMeasureRepository _uomRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateUnitOfMeasureCommandHandler(IUnitOfMeasureRepository uomRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _uomRepository = uomRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UnitOfMeasureDto>> Handle(CreateUnitOfMeasureCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<UnitOfMeasureDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _uomRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, null, cancellationToken))
        {
            return Result<UnitOfMeasureDto>.Failure(Error.Conflict("UnitOfMeasure.DuplicateCode", $"UOM code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var uom = new UnitOfMeasure
        {
            CompanyId = request.CompanyId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            BaseUnitCode = request.BaseUnitCode.ToUpperInvariant().Trim(),
            ConversionFactor = request.ConversionFactor <= 0 ? 1.0m : request.ConversionFactor,
            IsFractionalAllowed = request.IsFractionalAllowed,
            IsActive = true
        };

        await _uomRepository.AddAsync(uom, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new UnitOfMeasureDto(
            uom.Id,
            uom.CompanyId,
            company.LegalName,
            uom.Code,
            uom.Name,
            uom.BaseUnitCode,
            uom.ConversionFactor,
            uom.IsFractionalAllowed,
            uom.IsActive,
            uom.CreatedAtUtc);

        return Result<UnitOfMeasureDto>.Success(dto);
    }
}

public record UpdateUnitOfMeasureCommand(
    Guid Id,
    Guid CompanyId,
    string Code,
    string Name,
    string BaseUnitCode,
    decimal ConversionFactor,
    bool IsFractionalAllowed,
    bool IsActive) : IRequest<Result<UnitOfMeasureDto>>;

public class UpdateUnitOfMeasureCommandHandler : IRequestHandler<UpdateUnitOfMeasureCommand, Result<UnitOfMeasureDto>>
{
    private readonly IUnitOfMeasureRepository _uomRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateUnitOfMeasureCommandHandler(IUnitOfMeasureRepository uomRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _uomRepository = uomRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<UnitOfMeasureDto>> Handle(UpdateUnitOfMeasureCommand request, CancellationToken cancellationToken)
    {
        var uom = await _uomRepository.GetByIdAsync(request.Id, cancellationToken);
        if (uom == null)
        {
            return Result<UnitOfMeasureDto>.Failure(Error.NotFound("UnitOfMeasure.NotFound", $"Unit of Measure with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<UnitOfMeasureDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _uomRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<UnitOfMeasureDto>.Failure(Error.Conflict("UnitOfMeasure.DuplicateCode", $"UOM code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        uom.CompanyId = request.CompanyId;
        uom.Code = request.Code.ToUpperInvariant().Trim();
        uom.Name = request.Name.Trim();
        uom.BaseUnitCode = request.BaseUnitCode.ToUpperInvariant().Trim();
        uom.ConversionFactor = request.ConversionFactor <= 0 ? 1.0m : request.ConversionFactor;
        uom.IsFractionalAllowed = request.IsFractionalAllowed;
        uom.IsActive = request.IsActive;

        await _uomRepository.UpdateAsync(uom, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new UnitOfMeasureDto(
            uom.Id,
            uom.CompanyId,
            company.LegalName,
            uom.Code,
            uom.Name,
            uom.BaseUnitCode,
            uom.ConversionFactor,
            uom.IsFractionalAllowed,
            uom.IsActive,
            uom.CreatedAtUtc);

        return Result<UnitOfMeasureDto>.Success(dto);
    }
}

public record DeleteUnitOfMeasureCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteUnitOfMeasureCommandHandler : IRequestHandler<DeleteUnitOfMeasureCommand, Result<Unit>>
{
    private readonly IUnitOfMeasureRepository _uomRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteUnitOfMeasureCommandHandler(IUnitOfMeasureRepository uomRepository, IUnitOfWork unitOfWork)
    {
        _uomRepository = uomRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteUnitOfMeasureCommand request, CancellationToken cancellationToken)
    {
        var uom = await _uomRepository.GetByIdAsync(request.Id, cancellationToken);
        if (uom == null)
        {
            return Result<Unit>.Failure(Error.NotFound("UnitOfMeasure.NotFound", $"Unit of Measure with ID '{request.Id}' was not found."));
        }

        await _uomRepository.DeleteAsync(uom, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
