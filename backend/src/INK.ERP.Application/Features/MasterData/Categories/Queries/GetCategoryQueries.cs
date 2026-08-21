using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Categories.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.MasterData.Categories.Queries;

public record GetCategoryByIdQuery(Guid Id) : IRequest<Result<CategoryDto>>;

public class GetCategoryByIdQueryHandler : IRequestHandler<GetCategoryByIdQuery, Result<CategoryDto>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetCategoryByIdQueryHandler(ICategoryRepository categoryRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _categoryRepository = categoryRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CategoryDto>> Handle(GetCategoryByIdQuery request, CancellationToken cancellationToken)
    {
        var category = await _categoryRepository.GetByIdAsync(request.Id, cancellationToken);
        if (category == null)
        {
            return Result<CategoryDto>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(category.CompanyId, cancellationToken))
        {
            return Result<CategoryDto>.Failure(Error.NotFound("Category.NotFound", $"Category with ID '{request.Id}' was not found."));
        }

        var dto = new CategoryDto(
            category.Id,
            category.CompanyId,
            category.Company?.LegalName,
            category.Code,
            category.Name,
            category.ParentCategoryId,
            category.ParentCategory?.Name,
            category.GstTaxRatePercent,
            category.HsnCodeDefault,
            category.IsActive,
            category.CreatedAtUtc);

        return Result<CategoryDto>.Success(dto);
    }
}

public record GetCategoriesPagedQuery(
    Guid? CompanyId = null,
    int Page = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<IReadOnlyList<CategoryDto>>>;

public class GetCategoriesPagedQueryHandler : IRequestHandler<GetCategoriesPagedQuery, Result<IReadOnlyList<CategoryDto>>>
{
    private readonly ICategoryRepository _categoryRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetCategoriesPagedQueryHandler(ICategoryRepository categoryRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _categoryRepository = categoryRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<CategoryDto>>> Handle(GetCategoriesPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<CategoryDto>>(new List<CategoryDto>());
        }

        var categories = await _categoryRepository.GetAllAsync(cancellationToken);
        var query = categories.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(c => c.CompanyId == effectiveCompanyId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.Search))
        {
            var search = request.Search.Trim();
            query = query.Where(c => c.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                                     c.Name.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.Status) && !string.Equals(request.Status, "All", StringComparison.OrdinalIgnoreCase))
        {
            bool isActive = string.Equals(request.Status, "Active", StringComparison.OrdinalIgnoreCase);
            query = query.Where(c => c.IsActive == isActive);
        }

        var list = query
            .OrderBy(c => c.Code)
            .Select(category => new CategoryDto(
                category.Id,
                category.CompanyId,
                category.Company != null ? category.Company.LegalName : null,
                category.Code,
                category.Name,
                category.ParentCategoryId,
                category.ParentCategory != null ? category.ParentCategory.Name : null,
                category.GstTaxRatePercent,
                category.HsnCodeDefault,
                category.IsActive,
                category.CreatedAtUtc))
            .ToList();

        return Result.Success<IReadOnlyList<CategoryDto>>(list);
    }
}
