using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Common.Models;
using INK.ERP.Application.Features.MasterData.Companies.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Enums.MasterData;

namespace INK.ERP.Application.Features.MasterData.Companies.Queries;

public record GetCompanyByIdQuery(Guid Id) : IRequest<Result<CompanyDto>>;

public class GetCompanyByIdQueryHandler : IRequestHandler<GetCompanyByIdQuery, Result<CompanyDto>>
{
    private readonly ICompanyRepository _companyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetCompanyByIdQueryHandler(ICompanyRepository companyRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _companyRepository = companyRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CompanyDto>> Handle(GetCompanyByIdQuery request, CancellationToken cancellationToken)
    {
        if (!await _companyAccessResolver.HasAccessToCompanyAsync(request.Id, cancellationToken))
        {
            return Result.Failure<CompanyDto>(Error.NotFound("Company.NotFound", $"Company with ID '{request.Id}' was not found."));
        }

        var c = await _companyRepository.GetByIdAsync(request.Id, cancellationToken);

        if (c == null || c.IsDeleted)
            return Result.Failure<CompanyDto>(Error.NotFound("Company.NotFound", $"Company with ID '{request.Id}' was not found."));

        return Result.Success(MapToDto(c));
    }

    private static CompanyDto MapToDto(Company c) => new(
        c.Id, c.TenantId, c.Code, c.LegalName, c.TradeName, c.TaxRegistrationNumber, c.PanNumber, c.CinNumber,
        c.Email, c.Phone, c.Website, c.LogoUrl, c.CurrencyId, c.CurrencyCode, c.FinancialYearStartMonth, c.TimeZoneId,
        c.Address.AddressLine1, c.Address.AddressLine2, c.Address.City, c.Address.State, c.Address.PostalCode, c.Address.Country, null,
        c.Status, c.IsActive, c.RowVersion, c.CreatedAtUtc, c.CreatedBy, c.LastModifiedAtUtc, c.LastModifiedBy);
}

public record GetCompaniesPagedQuery(
    int PageNumber = 1,
    int PageSize = 10,
    string? Search = null,
    string? Status = null) : IRequest<Result<PagedResult<CompanyDto>>>;

public class GetCompaniesPagedQueryHandler : IRequestHandler<GetCompaniesPagedQuery, Result<PagedResult<CompanyDto>>>
{
    private readonly ICompanyRepository _companyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetCompaniesPagedQueryHandler(ICompanyRepository companyRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _companyRepository = companyRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<PagedResult<CompanyDto>>> Handle(GetCompaniesPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success(PagedResult<CompanyDto>.Create(new List<CompanyDto>(), request.PageNumber, request.PageSize, 0));
        }

        var search = request.Search?.Trim().ToLower();
        Enum.TryParse<CompanyStatus>(request.Status, true, out var statusEnum);
        var hasStatusFilter = !string.IsNullOrWhiteSpace(request.Status);

        var allCompanies = await _companyRepository.FindAsync(c =>
            !c.IsDeleted &&
            (authorizedCompanyId == null || c.Id == authorizedCompanyId.Value) &&
            (string.IsNullOrEmpty(search) || c.Code.ToLower().Contains(search) || c.LegalName.ToLower().Contains(search) || c.TaxRegistrationNumber.ToLower().Contains(search)) &&
            (!hasStatusFilter || c.Status == statusEnum), cancellationToken);

        var totalCount = allCompanies.Count;
        var page = request.PageNumber <= 0 ? 1 : request.PageNumber;
        var size = request.PageSize <= 0 ? 10 : request.PageSize;

        var items = allCompanies
            .OrderBy(c => c.Code)
            .Skip((page - 1) * size)
            .Take(size)
            .Select(c => new CompanyDto(
                c.Id, c.TenantId, c.Code, c.LegalName, c.TradeName, c.TaxRegistrationNumber, c.PanNumber, c.CinNumber,
                c.Email, c.Phone, c.Website, c.LogoUrl, c.CurrencyId, c.CurrencyCode, c.FinancialYearStartMonth, c.TimeZoneId,
                c.Address.AddressLine1, c.Address.AddressLine2, c.Address.City, c.Address.State, c.Address.PostalCode, c.Address.Country, null,
                c.Status, c.IsActive, c.RowVersion, c.CreatedAtUtc, c.CreatedBy, c.LastModifiedAtUtc, c.LastModifiedBy))
            .ToList();

        var pagedResult = PagedResult<CompanyDto>.Create(items, page, size, totalCount);
        return Result.Success(pagedResult);
    }
}

public record GetCompanyLookupQuery() : IRequest<Result<IReadOnlyList<CompanyLookupDto>>>;

public class GetCompanyLookupQueryHandler : IRequestHandler<GetCompanyLookupQuery, Result<IReadOnlyList<CompanyLookupDto>>>
{
    private readonly ICompanyRepository _companyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetCompanyLookupQueryHandler(ICompanyRepository companyRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _companyRepository = companyRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<CompanyLookupDto>>> Handle(GetCompanyLookupQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<CompanyLookupDto>>(new List<CompanyLookupDto>());
        }

        var activeCompanies = await _companyRepository.FindAsync(c =>
            !c.IsDeleted && c.IsActive && c.Status == CompanyStatus.Active &&
            (authorizedCompanyId == null || c.Id == authorizedCompanyId.Value), cancellationToken);

        var items = activeCompanies
            .OrderBy(c => c.LegalName)
            .Select(c => new CompanyLookupDto(c.Id, c.Code, c.LegalName, c.CurrencyCode))
            .ToList();

        return Result.Success<IReadOnlyList<CompanyLookupDto>>(items);
    }
}

public record GetActiveCompaniesQuery() : IRequest<Result<IReadOnlyList<CompanyDto>>>;

public class GetActiveCompaniesQueryHandler : IRequestHandler<GetActiveCompaniesQuery, Result<IReadOnlyList<CompanyDto>>>
{
    private readonly ICompanyRepository _companyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetActiveCompaniesQueryHandler(ICompanyRepository companyRepository, ICompanyAccessResolver companyAccessResolver)
    {
        _companyRepository = companyRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<CompanyDto>>> Handle(GetActiveCompaniesQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<CompanyDto>>(new List<CompanyDto>());
        }

        var activeCompanies = await _companyRepository.FindAsync(c =>
            !c.IsDeleted && c.IsActive && c.Status == CompanyStatus.Active &&
            (authorizedCompanyId == null || c.Id == authorizedCompanyId.Value), cancellationToken);

        var items = activeCompanies
            .OrderBy(c => c.LegalName)
            .Select(c => new CompanyDto(
                c.Id, c.TenantId, c.Code, c.LegalName, c.TradeName, c.TaxRegistrationNumber, c.PanNumber, c.CinNumber,
                c.Email, c.Phone, c.Website, c.LogoUrl, c.CurrencyId, c.CurrencyCode, c.FinancialYearStartMonth, c.TimeZoneId,
                c.Address.AddressLine1, c.Address.AddressLine2, c.Address.City, c.Address.State, c.Address.PostalCode, c.Address.Country, null,
                c.Status, c.IsActive, c.RowVersion, c.CreatedAtUtc, c.CreatedBy, c.LastModifiedAtUtc, c.LastModifiedBy))
            .ToList();

        return Result.Success<IReadOnlyList<CompanyDto>>(items);
    }
}
