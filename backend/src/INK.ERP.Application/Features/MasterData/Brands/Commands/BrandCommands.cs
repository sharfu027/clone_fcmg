using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Brands.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Brands.Commands;

public record CreateBrandCommand(
    Guid CompanyId,
    string Code,
    string Name,
    string? ManufacturerName,
    string? OriginCountry) : IRequest<Result<BrandDto>>;

public class CreateBrandCommandHandler : IRequestHandler<CreateBrandCommand, Result<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateBrandCommandHandler(IBrandRepository brandRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _brandRepository = brandRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<BrandDto>> Handle(CreateBrandCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<BrandDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _brandRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, null, cancellationToken))
        {
            return Result<BrandDto>.Failure(Error.Conflict("Brand.DuplicateCode", $"Brand code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        var brand = new Brand
        {
            CompanyId = request.CompanyId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            ManufacturerName = request.ManufacturerName?.Trim(),
            OriginCountry = request.OriginCountry?.Trim(),
            IsActive = true
        };

        await _brandRepository.AddAsync(brand, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new BrandDto(
            brand.Id,
            brand.CompanyId,
            company.LegalName,
            brand.Code,
            brand.Name,
            brand.ManufacturerName,
            brand.OriginCountry,
            brand.IsActive,
            brand.CreatedAtUtc);

        return Result<BrandDto>.Success(dto);
    }
}

public record UpdateBrandCommand(
    Guid Id,
    Guid CompanyId,
    string Code,
    string Name,
    string? ManufacturerName,
    string? OriginCountry,
    bool IsActive) : IRequest<Result<BrandDto>>;

public class UpdateBrandCommandHandler : IRequestHandler<UpdateBrandCommand, Result<BrandDto>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateBrandCommandHandler(IBrandRepository brandRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _brandRepository = brandRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<BrandDto>> Handle(UpdateBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _brandRepository.GetByIdAsync(request.Id, cancellationToken);
        if (brand == null)
        {
            return Result<BrandDto>.Failure(Error.NotFound("Brand.NotFound", $"Brand with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<BrandDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _brandRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<BrandDto>.Failure(Error.Conflict("Brand.DuplicateCode", $"Brand code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        brand.CompanyId = request.CompanyId;
        brand.Code = request.Code.ToUpperInvariant().Trim();
        brand.Name = request.Name.Trim();
        brand.ManufacturerName = request.ManufacturerName?.Trim();
        brand.OriginCountry = request.OriginCountry?.Trim();
        brand.IsActive = request.IsActive;

        await _brandRepository.UpdateAsync(brand, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new BrandDto(
            brand.Id,
            brand.CompanyId,
            company.LegalName,
            brand.Code,
            brand.Name,
            brand.ManufacturerName,
            brand.OriginCountry,
            brand.IsActive,
            brand.CreatedAtUtc);

        return Result<BrandDto>.Success(dto);
    }
}

public record DeleteBrandCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteBrandCommandHandler : IRequestHandler<DeleteBrandCommand, Result<Unit>>
{
    private readonly IBrandRepository _brandRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteBrandCommandHandler(IBrandRepository brandRepository, IUnitOfWork unitOfWork)
    {
        _brandRepository = brandRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteBrandCommand request, CancellationToken cancellationToken)
    {
        var brand = await _brandRepository.GetByIdAsync(request.Id, cancellationToken);
        if (brand == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Brand.NotFound", $"Brand with ID '{request.Id}' was not found."));
        }

        await _brandRepository.DeleteAsync(brand, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
