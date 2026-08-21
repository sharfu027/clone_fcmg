using System;
using System.Threading;
using System.Threading.Tasks;
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
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateCategoryCommandHandler(
        ICategoryRepository categoryRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _categoryRepository = categoryRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CategoryDto>> Handle(CreateCategoryCommand request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<CategoryDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account. Please contact the Super Administrator."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<CategoryDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{targetCompanyId}' was not found."));
        }

        if (!await _categoryRepository.IsCodeUniqueAsync(targetCompanyId, request.Code, null, cancellationToken))
        {
            return Result<CategoryDto>.Failure(Error.Conflict("Category.DuplicateCode", $"Category code '{request.Code}' already exists under company '{company.LegalName}'."));
        }

        string? parentCategoryName = null;
        if (request.ParentCategoryId.HasValue)
        {
            var parent = await _categoryRepository.GetByIdAsync(request.ParentCategoryId.Value, cancellationToken);
            if (parent == null || !parent.IsActive || parent.CompanyId != targetCompanyId)
            {
                return Result<CategoryDto>.Failure(Error.NotFound("Category.ParentNotFound", $"Parent Category with ID '{request.ParentCategoryId.Value}' does not exist or does not belong to the authorized company."));
            }

            parentCategoryName = parent.Name;
        }

        var category = new Category
        {
            CompanyId = targetCompanyId,
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
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateCategoryCommandHandler(
        ICategoryRepository categoryRepository,
        ICompanyRepository companyRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _categoryRepository = categoryRepository;
        _companyRepository = companyRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CategoryDto>> Handle(UpdateCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<CategoryDto>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(category.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<CategoryDto>.Failure(accessResult.Error);
        }

        var company = await _companyRepository.GetByIdAsync(category.CompanyId, cancellationToken);
        if (company == null || company.IsDeleted)
        {
            return Result<CategoryDto>.Failure(Error.NotFound("Company.NotFound", $"Parent Company with ID '{category.CompanyId}' was not found."));
        }

        if (!await _categoryRepository.IsCodeUniqueAsync(category.CompanyId, request.Code, request.Id, cancellationToken))
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
            if (parent == null || !parent.IsActive || parent.CompanyId != category.CompanyId)
            {
                return Result<CategoryDto>.Failure(Error.NotFound("Category.ParentNotFound", $"Parent Category with ID '{request.ParentCategoryId.Value}' does not exist or does not belong to the authorized company."));
            }

            // Circular reference check: ensure request.Id is not an ancestor of request.ParentCategoryId
            var allCategories = await _categoryRepository.GetAllAsync(cancellationToken);
            var currentParent = allCategories.FirstOrDefault(c => c.Id == request.ParentCategoryId.Value);
            var visited = new HashSet<Guid> { request.Id };
            while (currentParent != null && currentParent.ParentCategoryId.HasValue)
            {
                if (visited.Contains(currentParent.ParentCategoryId.Value))
                {
                    return Result<CategoryDto>.Failure(Error.Validation("Category.CircularReference", "Cannot set parent category as it would create a circular dependency loop in the hierarchy."));
                }
                visited.Add(currentParent.Id);
                currentParent = allCategories.FirstOrDefault(c => c.Id == currentParent.ParentCategoryId.Value);
            }

            parentCategoryName = parent.Name;
        }

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
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteCategoryCommandHandler(
        ICategoryRepository categoryRepository,
        IUnitOfWork unitOfWork,
        ICompanyAccessResolver companyAccessResolver)
    {
        _categoryRepository = categoryRepository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<Unit>> Handle(DeleteCategoryCommand request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<Unit>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.Id}' was not found."));
        }

        var accessResult = await _companyAccessResolver.ValidateCompanyAccessAsync(category.CompanyId, cancellationToken);
        if (!accessResult.IsSuccess)
        {
            return Result<Unit>.Failure(accessResult.Error);
        }

        await _categoryRepository.DeleteAsync(category, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result<Unit>.Success(Unit.Value);
    }
}
