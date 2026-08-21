using System;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.MasterData.Companies.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Enums.MasterData;
using INK.ERP.Domain.Events.MasterData;
using INK.ERP.Domain.ValueObjects;

namespace INK.ERP.Application.Features.MasterData.Companies.Commands;

public record CreateCompanyCommand(
    string Code,
    string LegalName,
    string? TradeName,
    string TaxRegistrationNumber,
    string PanNumber,
    string? CinNumber,
    string Email,
    string Phone,
    string? Website,
    string? LogoUrl,
    Guid? CurrencyId,
    string CurrencyCode,
    int FinancialYearStartMonth = 4,
    string? TimeZoneId = "Asia/Kolkata",
    string AddressLine1 = "Corporate Address",
    string? AddressLine2 = null,
    string City = "City",
    string State = "State",
    string PostalCode = "000000",
    string Country = "India",
    Guid? CountryId = null,
    Guid? TenantId = null) : IRequest<Result<CompanyDto>>;

public class CreateCompanyCommandHandler : IRequestHandler<CreateCompanyCommand, Result<CompanyDto>>
{
    private readonly ICompanyRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public CreateCompanyCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, ICompanyAccessResolver companyAccessResolver)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CompanyDto>> Handle(CreateCompanyCommand request, CancellationToken cancellationToken)
    {
        if (!await _companyAccessResolver.IsSuperAdminAsync(cancellationToken))
        {
            return Result.Failure<CompanyDto>(Error.Unauthorized("Company.ReadOnly", "Only Super Administrators can create Companies. Standard Administrators have Read-Only Company access."));
        }

        if (await _repository.ExistsCodeAsync(request.Code, null, cancellationToken))
            return Result.Failure<CompanyDto>(Error.Conflict("Company.DuplicateCode", $"A company with code '{request.Code}' already exists."));

        if (await _repository.ExistsGstinAsync(request.TaxRegistrationNumber, null, cancellationToken))
            return Result.Failure<CompanyDto>(Error.Conflict("Company.DuplicateGstin", $"A company with Tax Registration (GSTIN) '{request.TaxRegistrationNumber}' already exists."));

        if (await _repository.ExistsLegalNameAsync(request.LegalName, null, cancellationToken))
            return Result.Failure<CompanyDto>(Error.Conflict("Company.DuplicateLegalName", $"A company with Legal Name '{request.LegalName}' already exists."));

        var company = new Company
        {
            TenantId = request.TenantId,
            Code = request.Code.Trim().ToUpperInvariant(),
            LegalName = request.LegalName.Trim(),
            TradeName = request.TradeName?.Trim(),
            TaxRegistrationNumber = request.TaxRegistrationNumber.Trim().ToUpperInvariant(),
            PanNumber = request.PanNumber.Trim().ToUpperInvariant(),
            CinNumber = request.CinNumber?.Trim().ToUpperInvariant(),
            Email = request.Email.Trim().ToLowerInvariant(),
            Phone = request.Phone.Trim(),
            Website = request.Website?.Trim(),
            LogoUrl = request.LogoUrl?.Trim(),
            CurrencyId = request.CurrencyId,
            CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "INR" : request.CurrencyCode.Trim().ToUpperInvariant(),
            FinancialYearStartMonth = request.FinancialYearStartMonth <= 0 ? 4 : request.FinancialYearStartMonth,
            TimeZoneId = string.IsNullOrWhiteSpace(request.TimeZoneId) ? "Asia/Kolkata" : request.TimeZoneId.Trim(),
            Address = new Address(
                request.AddressLine1.Trim(),
                request.AddressLine2?.Trim(),
                request.City.Trim(),
                request.State.Trim(),
                request.PostalCode.Trim(),
                string.IsNullOrWhiteSpace(request.Country) ? "India" : request.Country.Trim()),
            Status = CompanyStatus.Active,
            IsActive = true
        };

        company.AddDomainEvent(new CompanyCreatedEvent(company, "System"));

        await _repository.AddAsync(company, cancellationToken);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(MapToDto(company));
    }

    private static CompanyDto MapToDto(Company c) => new(
        c.Id, c.TenantId, c.Code, c.LegalName, c.TradeName, c.TaxRegistrationNumber, c.PanNumber, c.CinNumber,
        c.Email, c.Phone, c.Website, c.LogoUrl, c.CurrencyId, c.CurrencyCode, c.FinancialYearStartMonth, c.TimeZoneId,
        c.Address.AddressLine1, c.Address.AddressLine2, c.Address.City, c.Address.State, c.Address.PostalCode, c.Address.Country, null,
        c.Status, c.IsActive, c.RowVersion, c.CreatedAtUtc, c.CreatedBy, c.LastModifiedAtUtc, c.LastModifiedBy);
}

public record UpdateCompanyCommand(
    Guid Id,
    string Code,
    string LegalName,
    string? TradeName,
    string TaxRegistrationNumber,
    string PanNumber,
    string? CinNumber,
    string Email,
    string Phone,
    string? Website,
    string? LogoUrl,
    Guid? CurrencyId,
    string CurrencyCode,
    int FinancialYearStartMonth,
    string TimeZoneId,
    string AddressLine1,
    string? AddressLine2,
    string City,
    string State,
    string PostalCode,
    string Country,
    Guid? CountryId,
    uint RowVersion) : IRequest<Result<CompanyDto>>;

public class UpdateCompanyCommandHandler : IRequestHandler<UpdateCompanyCommand, Result<CompanyDto>>
{
    private readonly ICompanyRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public UpdateCompanyCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, ICompanyAccessResolver companyAccessResolver)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CompanyDto>> Handle(UpdateCompanyCommand request, CancellationToken cancellationToken)
    {
        if (!await _companyAccessResolver.IsSuperAdminAsync(cancellationToken))
        {
            return Result.Failure<CompanyDto>(Error.Unauthorized("Company.ReadOnly", "Only Super Administrators can update Companies. Standard Administrators have Read-Only Company access."));
        }

        var company = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (company == null || company.IsDeleted)
            return Result.Failure<CompanyDto>(Error.NotFound("Company.NotFound", $"Company with ID '{request.Id}' was not found."));

        if (await _repository.ExistsCodeAsync(request.Code, request.Id, cancellationToken))
            return Result.Failure<CompanyDto>(Error.Conflict("Company.DuplicateCode", $"Another company with code '{request.Code}' already exists."));

        if (await _repository.ExistsGstinAsync(request.TaxRegistrationNumber, request.Id, cancellationToken))
            return Result.Failure<CompanyDto>(Error.Conflict("Company.DuplicateGstin", $"Another company with Tax Registration (GSTIN) '{request.TaxRegistrationNumber}' already exists."));

        if (await _repository.ExistsLegalNameAsync(request.LegalName, request.Id, cancellationToken))
            return Result.Failure<CompanyDto>(Error.Conflict("Company.DuplicateLegalName", $"Another company with Legal Name '{request.LegalName}' already exists."));

        company.Code = request.Code.Trim().ToUpperInvariant();
        company.LegalName = request.LegalName.Trim();
        company.TradeName = request.TradeName?.Trim();
        company.TaxRegistrationNumber = request.TaxRegistrationNumber.Trim().ToUpperInvariant();
        company.PanNumber = request.PanNumber.Trim().ToUpperInvariant();
        company.CinNumber = request.CinNumber?.Trim().ToUpperInvariant();
        company.Email = request.Email.Trim().ToLowerInvariant();
        company.Phone = request.Phone.Trim();
        company.Website = request.Website?.Trim();
        company.LogoUrl = request.LogoUrl?.Trim();
        company.CurrencyId = request.CurrencyId;
        company.CurrencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "INR" : request.CurrencyCode.Trim().ToUpperInvariant();
        company.FinancialYearStartMonth = request.FinancialYearStartMonth <= 0 ? 4 : request.FinancialYearStartMonth;
        company.TimeZoneId = string.IsNullOrWhiteSpace(request.TimeZoneId) ? "Asia/Kolkata" : request.TimeZoneId.Trim();
        company.Address = new Address(
            request.AddressLine1.Trim(),
            request.AddressLine2?.Trim(),
            request.City.Trim(),
            request.State.Trim(),
            request.PostalCode.Trim(),
            string.IsNullOrWhiteSpace(request.Country) ? "India" : request.Country.Trim());

        company.AddDomainEvent(new CompanyUpdatedEvent(company, "System"));

        _repository.Update(company);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(MapToDto(company));
    }

    private static CompanyDto MapToDto(Company c) => new(
        c.Id, c.TenantId, c.Code, c.LegalName, c.TradeName, c.TaxRegistrationNumber, c.PanNumber, c.CinNumber,
        c.Email, c.Phone, c.Website, c.LogoUrl, c.CurrencyId, c.CurrencyCode, c.FinancialYearStartMonth, c.TimeZoneId,
        c.Address.AddressLine1, c.Address.AddressLine2, c.Address.City, c.Address.State, c.Address.PostalCode, c.Address.Country, null,
        c.Status, c.IsActive, c.RowVersion, c.CreatedAtUtc, c.CreatedBy, c.LastModifiedAtUtc, c.LastModifiedBy);
}

public record ArchiveCompanyCommand(Guid Id) : IRequest<Result<CompanyDto>>;

public class ArchiveCompanyCommandHandler : IRequestHandler<ArchiveCompanyCommand, Result<CompanyDto>>
{
    private readonly ICompanyRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public ArchiveCompanyCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, ICompanyAccessResolver companyAccessResolver)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CompanyDto>> Handle(ArchiveCompanyCommand request, CancellationToken cancellationToken)
    {
        if (!await _companyAccessResolver.IsSuperAdminAsync(cancellationToken))
        {
            return Result.Failure<CompanyDto>(Error.Unauthorized("Company.ReadOnly", "Only Super Administrators can archive Companies."));
        }

        var company = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (company == null || company.IsDeleted)
            return Result.Failure<CompanyDto>(Error.NotFound("Company.NotFound", $"Company with ID '{request.Id}' was not found."));

        if (company.Status == CompanyStatus.Archived)
            return Result.Failure<CompanyDto>(Error.Validation("Company.AlreadyArchived", "Company is already archived."));

        company.Status = CompanyStatus.Archived;
        company.IsActive = false;
        company.AddDomainEvent(new CompanyArchivedEvent(company, "System"));

        _repository.Update(company);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(MapToDto(company));
    }

    private static CompanyDto MapToDto(Company c) => new(
        c.Id, c.TenantId, c.Code, c.LegalName, c.TradeName, c.TaxRegistrationNumber, c.PanNumber, c.CinNumber,
        c.Email, c.Phone, c.Website, c.LogoUrl, c.CurrencyId, c.CurrencyCode, c.FinancialYearStartMonth, c.TimeZoneId,
        c.Address.AddressLine1, c.Address.AddressLine2, c.Address.City, c.Address.State, c.Address.PostalCode, c.Address.Country, null,
        c.Status, c.IsActive, c.RowVersion, c.CreatedAtUtc, c.CreatedBy, c.LastModifiedAtUtc, c.LastModifiedBy);
}

public record RestoreCompanyCommand(Guid Id) : IRequest<Result<CompanyDto>>;

public class RestoreCompanyCommandHandler : IRequestHandler<RestoreCompanyCommand, Result<CompanyDto>>
{
    private readonly ICompanyRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public RestoreCompanyCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, ICompanyAccessResolver companyAccessResolver)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<CompanyDto>> Handle(RestoreCompanyCommand request, CancellationToken cancellationToken)
    {
        if (!await _companyAccessResolver.IsSuperAdminAsync(cancellationToken))
        {
            return Result.Failure<CompanyDto>(Error.Unauthorized("Company.ReadOnly", "Only Super Administrators can restore Companies."));
        }

        var company = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (company == null)
            return Result.Failure<CompanyDto>(Error.NotFound("Company.NotFound", $"Company with ID '{request.Id}' was not found."));

        company.IsDeleted = false;
        company.DeletedAtUtc = null;
        company.DeletedBy = null;
        company.Status = CompanyStatus.Active;
        company.IsActive = true;

        company.AddDomainEvent(new CompanyRestoredEvent(company, "System"));

        _repository.Update(company);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(MapToDto(company));
    }

    private static CompanyDto MapToDto(Company c) => new(
        c.Id, c.TenantId, c.Code, c.LegalName, c.TradeName, c.TaxRegistrationNumber, c.PanNumber, c.CinNumber,
        c.Email, c.Phone, c.Website, c.LogoUrl, c.CurrencyId, c.CurrencyCode, c.FinancialYearStartMonth, c.TimeZoneId,
        c.Address.AddressLine1, c.Address.AddressLine2, c.Address.City, c.Address.State, c.Address.PostalCode, c.Address.Country, null,
        c.Status, c.IsActive, c.RowVersion, c.CreatedAtUtc, c.CreatedBy, c.LastModifiedAtUtc, c.LastModifiedBy);
}

public record DeleteCompanyCommand(Guid Id) : IRequest<Result>;

public class DeleteCompanyCommandHandler : IRequestHandler<DeleteCompanyCommand, Result>
{
    private readonly ICompanyRepository _repository;
    private readonly IUnitOfWork _unitOfWork;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public DeleteCompanyCommandHandler(ICompanyRepository repository, IUnitOfWork unitOfWork, ICompanyAccessResolver companyAccessResolver)
    {
        _repository = repository;
        _unitOfWork = unitOfWork;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result> Handle(DeleteCompanyCommand request, CancellationToken cancellationToken)
    {
        if (!await _companyAccessResolver.IsSuperAdminAsync(cancellationToken))
        {
            return Result.Failure(Error.Unauthorized("Company.ReadOnly", "Only Super Administrators can delete Companies."));
        }

        var company = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (company == null || company.IsDeleted)
            return Result.Failure(Error.NotFound("Company.NotFound", $"Company with ID '{request.Id}' was not found."));

        company.IsDeleted = true;
        company.DeletedAtUtc = DateTime.UtcNow;
        company.DeletedBy = "System";

        company.AddDomainEvent(new CompanyDeletedEvent(company.Id, company.Code, "System"));

        _repository.Update(company);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
