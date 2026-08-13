using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Categories.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;

namespace INK.ERP.Application.Features.MasterData.Categories.Commands;

public record CreateCategoryCommand(
    Guid CompanyId,
    string Code,
    string Name,
    Guid? ParentCategoryId,
    decimal GstTaxRatePercent,
    string HsnCodeDefault) : IRequest<Result<CategoryDto>>;

public class CreateCategoryCommandHandler : IRequestHandler<CreateCategoryCommand, Result<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public CreateCategoryCommandHandler(ICategoryRepository categoryRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _categoryRepository = categoryRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<CategoryDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _categoryRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, null, cancellationToken))
        {
            return Result<CategoryDto>.Failure(Error.Conflict("Category.DuplicateCode", $"Category code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        string? parentCategoryName = null;
        if (request.ParentCategoryId.HasValue)
        {
            var parent = await _categoryRepository.GetByIdAsync(request.ParentCategoryId.Value, cancellationToken);
            if (parent == null)
            {
                return Result<CategoryDto>.Failure(Error.NotFound("Category.ParentNotFound", $"Parent Category with ID '{request.ParentCategoryId.Value}' was not found."));
            }
            parentCategoryName = parent.Name;
        }

        var category = new Category
        {
            CompanyId = request.CompanyId,
            Code = request.Code.ToUpperInvariant().Trim(),
            Name = request.Name.Trim(),
            ParentCategoryId = request.ParentCategoryId,
            GstTaxRatePercent = request.GstTaxRatePercent,
            HsnCodeDefault = request.HsnCodeDefault.Trim(),
            IsActive = true
        };

        await _categoryRepository.AddAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CategoryDto(
            category.Id,
            category.CompanyId,
            company.LegalName,
            category.Code,
            category.Name,
            category.ParentCategoryId,
            parentCategoryName,
            category.GstTaxRatePercent,
            category.HsnCodeDefault,
            category.IsActive,
            category.CreatedAtUtc);

        return Result<CategoryDto>.Success(dto);
    }
}

public record UpdateCategoryCommand(
    Guid Id,
    Guid CompanyId,
    string Code,
    string Name,
    Guid? ParentCategoryId,
    decimal GstTaxRatePercent,
    string HsnCodeDefault,
    bool IsActive) : IRequest<Result<CategoryDto>>;

public class UpdateCategoryCommandHandler : IRequestHandler<UpdateCategoryCommand, Result<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IUnitOfWork _unitOfWork;

    public UpdateCategoryCommandHandler(ICategoryRepository categoryRepository, ICompanyRepository companyRepository, IUnitOfWork unitOfWork)
    {
        _categoryRepository = categoryRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<CategoryDto>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(request.CompanyId, cancellationToken);
        if (company == null)
        {
            return Result<CategoryDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{request.CompanyId}' was not found."));
        }

        if (!await _categoryRepository.IsCodeUniqueAsync(request.CompanyId, request.Code, request.Id, cancellationToken))
        {
            return Result<CategoryDto>.Failure(Error.Conflict("Category.DuplicateCode", $"Category code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        string? parentCategoryName = null;
        if (request.ParentCategoryId.HasValue)
        {
            if (request.ParentCategoryId.Value == request.Id)
            {
                return Result<CategoryDto>.Failure(Error.Validation("Category.SelfParent", "A category cannot be its own parent."));
            }
            var parent = await _categoryRepository.GetByIdAsync(request.ParentCategoryId.Value, cancellationToken);
            if (parent == null)
            {
                return Result<CategoryDto>.Failure(Error.NotFound("Category.ParentNotFound", $"Parent Category with ID '{request.ParentCategoryId.Value}' was not found."));
            }
            parentCategoryName = parent.Name;
        }

        category.CompanyId = request.CompanyId;
        category.Code = request.Code.ToUpperInvariant().Trim();
        category.Name = request.Name.Trim();
        category.ParentCategoryId = request.ParentCategoryId;
        category.GstTaxRatePercent = request.GstTaxRatePercent;
        category.HsnCodeDefault = request.HsnCodeDefault.Trim();
        category.IsActive = request.IsActive;

        await _categoryRepository.UpdateAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        var dto = new CategoryDto(
            category.Id,
            category.CompanyId,
            company.LegalName,
            category.Code,
            category.Name,
            category.ParentCategoryId,
            parentCategoryName,
            category.GstTaxRatePercent,
            category.HsnCodeDefault,
            category.IsActive,
            category.CreatedAtUtc);

        return Result<CategoryDto>.Success(dto);
    }
}

public record DeleteCategoryCommand(Guid Id) : IRequest<Result<Unit>>;

public class DeleteCategoryCommandHandler : IRequestHandler<DeleteCategoryCommand, Result<Unit>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteCategoryCommandHandler(ICategoryRepository categoryRepository, IUnitOfWork unitOfWork)
    {
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<Unit>> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.Id}' was not found."));
        }

        await _categoryRepository.DeleteAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
