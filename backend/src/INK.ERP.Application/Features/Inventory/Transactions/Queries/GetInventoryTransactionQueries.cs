using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Transactions.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Transactions.Queries;

public record GetInventoryTransactionByIdQuery(Guid Id) : IRequest<Result<InventoryTransactionDto>>;

public class GetInventoryTransactionByIdQueryHandler : IRequestHandler<GetInventoryTransactionByIdQuery, Result<InventoryTransactionDto>>
{
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryTransactionByIdQueryHandler(
        IInventoryTransactionRepository transactionRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _transactionRepository = transactionRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryTransactionDto>> Handle(GetInventoryTransactionByIdQuery request, CancellationToken cancellationToken)
    {
        var txn = await _transactionRepository.GetByIdAsync(request.Id, cancellationToken);
        if (txn == null)
        {
            return Result<InventoryTransactionDto>.Failure(Error.NotFound("InventoryTransaction.NotFound", $"Inventory transaction with ID '{request.Id}' was not found."));
        }

        if (!await _companyAccessResolver.HasAccessToCompanyAsync(txn.CompanyId, cancellationToken))
        {
            return Result<InventoryTransactionDto>.Failure(Error.NotFound("InventoryTransaction.NotFound", $"Inventory transaction with ID '{request.Id}' was not found."));
        }

        var company = await _companyRepository.GetByIdAsync(txn.CompanyId, cancellationToken);
        var location = await _locationRepository.GetByIdAsync(txn.InventoryLocationId, cancellationToken);
        var product = await _productRepository.GetByIdWithDetailsAsync(txn.ProductId, cancellationToken);
        var employee = txn.PerformedByEmployeeId.HasValue ? await _employeeRepository.GetByIdWithDetailsAsync(txn.PerformedByEmployeeId.Value, cancellationToken) : null;

        decimal signedQty = txn.Quantity * InventoryTransactionTypes.GetSignedFactor(txn.TransactionType);
        string? employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : null;

        var dto = new InventoryTransactionDto(
            txn.Id,
            txn.CompanyId,
            company?.LegalName,
            txn.InventoryLocationId,
            location?.Name,
            location?.Code,
            txn.ProductId,
            product?.Name,
            product?.Code,
            product?.Sku,
            product?.BaseUomId ?? Guid.Empty,
            product?.BaseUom?.Name,
            txn.TransactionType,
            txn.Quantity,
            signedQty,
            txn.BalanceAfter,
            txn.ReferenceDocumentType,
            txn.ReferenceDocumentId,
            txn.ReferenceDocumentNumber,
            txn.BatchNumber,
            txn.ExpiryDate,
            txn.PerformedByEmployeeId,
            employeeName,
            txn.Notes,
            txn.CreatedAtUtc);

        return Result<InventoryTransactionDto>.Success(dto);
    }
}

public record GetInventoryTransactionsPagedQuery(
    Guid? CompanyId = null,
    Guid? InventoryLocationId = null,
    Guid? ProductId = null,
    string? TransactionType = null,
    string? ReferenceDocumentType = null,
    string? ReferenceDocumentNumber = null,
    Guid? PerformedByEmployeeId = null,
    DateTime? FromDate = null,
    DateTime? ToDate = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 50) : IRequest<Result<IReadOnlyList<InventoryTransactionDto>>>;

public class GetInventoryTransactionsPagedQueryHandler : IRequestHandler<GetInventoryTransactionsPagedQuery, Result<IReadOnlyList<InventoryTransactionDto>>>
{
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryTransactionsPagedQueryHandler(
        IInventoryTransactionRepository transactionRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _transactionRepository = transactionRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<InventoryTransactionDto>>> Handle(GetInventoryTransactionsPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<InventoryTransactionDto>>(new List<InventoryTransactionDto>());
        }

        var allTransactions = await _transactionRepository.GetAllAsync(cancellationToken);
        var query = allTransactions.AsQueryable();

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            query = query.Where(t => t.CompanyId == effectiveCompanyId.Value);
        }

        if (request.InventoryLocationId.HasValue)
        {
            query = query.Where(t => t.InventoryLocationId == request.InventoryLocationId.Value);
        }

        if (request.ProductId.HasValue)
        {
            query = query.Where(t => t.ProductId == request.ProductId.Value);
        }

        if (!string.IsNullOrWhiteSpace(request.TransactionType))
        {
            query = query.Where(t => t.TransactionType.Equals(request.TransactionType.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.ReferenceDocumentType))
        {
            query = query.Where(t => t.ReferenceDocumentType != null && t.ReferenceDocumentType.Equals(request.ReferenceDocumentType.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(request.ReferenceDocumentNumber))
        {
            query = query.Where(t => t.ReferenceDocumentNumber != null && t.ReferenceDocumentNumber.Contains(request.ReferenceDocumentNumber.Trim(), StringComparison.OrdinalIgnoreCase));
        }

        if (request.PerformedByEmployeeId.HasValue)
        {
            query = query.Where(t => t.PerformedByEmployeeId == request.PerformedByEmployeeId.Value);
        }

        if (request.FromDate.HasValue)
        {
            query = query.Where(t => t.CreatedAtUtc >= request.FromDate.Value);
        }

        if (request.ToDate.HasValue)
        {
            query = query.Where(t => t.CreatedAtUtc <= request.ToDate.Value);
        }

        var rawList = query.OrderByDescending(t => t.CreatedAtUtc).ToList();
        var dtos = new List<InventoryTransactionDto>();
        var search = request.Search?.Trim();

        foreach (var txn in rawList)
        {
            var product = await _productRepository.GetByIdWithDetailsAsync(txn.ProductId, cancellationToken);
            var location = await _locationRepository.GetByIdAsync(txn.InventoryLocationId, cancellationToken);

            if (!string.IsNullOrWhiteSpace(search))
            {
                bool matches =
                    (product != null && (
                        product.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        product.Code.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        product.Sku.Contains(search, StringComparison.OrdinalIgnoreCase))) ||
                    (location != null && (
                        location.Name.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                        location.Code.Contains(search, StringComparison.OrdinalIgnoreCase))) ||
                    (!string.IsNullOrEmpty(txn.ReferenceDocumentNumber) && txn.ReferenceDocumentNumber.Contains(search, StringComparison.OrdinalIgnoreCase));

                if (!matches) continue;
            }

            var company = await _companyRepository.GetByIdAsync(txn.CompanyId, cancellationToken);
            var employee = txn.PerformedByEmployeeId.HasValue ? await _employeeRepository.GetByIdWithDetailsAsync(txn.PerformedByEmployeeId.Value, cancellationToken) : null;

            decimal signedQty = txn.Quantity * InventoryTransactionTypes.GetSignedFactor(txn.TransactionType);
            string? employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : null;

            dtos.Add(new InventoryTransactionDto(
                txn.Id,
                txn.CompanyId,
                company?.LegalName,
                txn.InventoryLocationId,
                location?.Name,
                location?.Code,
                txn.ProductId,
                product?.Name,
                product?.Code,
                product?.Sku,
                product?.BaseUomId ?? Guid.Empty,
                product?.BaseUom?.Name,
                txn.TransactionType,
                txn.Quantity,
                signedQty,
                txn.BalanceAfter,
                txn.ReferenceDocumentType,
                txn.ReferenceDocumentId,
                txn.ReferenceDocumentNumber,
                txn.BatchNumber,
                txn.ExpiryDate,
                txn.PerformedByEmployeeId,
                employeeName,
                txn.Notes,
                txn.CreatedAtUtc));
        }

        var pagedDtos = dtos
            .Skip((Math.Max(request.Page, 1) - 1) * Math.Max(request.PageSize, 1))
            .Take(Math.Max(request.PageSize, 1))
            .ToList();

        return Result.Success<IReadOnlyList<InventoryTransactionDto>>(pagedDtos);
    }
}

public record GetLatestInventoryTransactionQuery(Guid CompanyId, Guid InventoryLocationId, Guid ProductId) : IRequest<Result<InventoryTransactionDto>>;

public class GetLatestInventoryTransactionQueryHandler : IRequestHandler<GetLatestInventoryTransactionQuery, Result<InventoryTransactionDto>>
{
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetLatestInventoryTransactionQueryHandler(
        IInventoryTransactionRepository transactionRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _transactionRepository = transactionRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryTransactionDto>> Handle(GetLatestInventoryTransactionQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<InventoryTransactionDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var txn = await _transactionRepository.GetLatestAsync(targetCompanyId, request.InventoryLocationId, request.ProductId, cancellationToken);
        if (txn == null)
        {
            return Result<InventoryTransactionDto>.Failure(Error.NotFound("InventoryTransaction.NotFound", "No inventory transaction was found for the specified location and product."));
        }

        var company = await _companyRepository.GetByIdAsync(txn.CompanyId, cancellationToken);
        var location = await _locationRepository.GetByIdAsync(txn.InventoryLocationId, cancellationToken);
        var product = await _productRepository.GetByIdWithDetailsAsync(txn.ProductId, cancellationToken);
        var employee = txn.PerformedByEmployeeId.HasValue ? await _employeeRepository.GetByIdWithDetailsAsync(txn.PerformedByEmployeeId.Value, cancellationToken) : null;

        decimal signedQty = txn.Quantity * InventoryTransactionTypes.GetSignedFactor(txn.TransactionType);
        string? employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : null;

        var dto = new InventoryTransactionDto(
            txn.Id,
            txn.CompanyId,
            company?.LegalName,
            txn.InventoryLocationId,
            location?.Name,
            location?.Code,
            txn.ProductId,
            product?.Name,
            product?.Code,
            product?.Sku,
            product?.BaseUomId ?? Guid.Empty,
            product?.BaseUom?.Name,
            txn.TransactionType,
            txn.Quantity,
            signedQty,
            txn.BalanceAfter,
            txn.ReferenceDocumentType,
            txn.ReferenceDocumentId,
            txn.ReferenceDocumentNumber,
            txn.BatchNumber,
            txn.ExpiryDate,
            txn.PerformedByEmployeeId,
            employeeName,
            txn.Notes,
            txn.CreatedAtUtc);

        return Result<InventoryTransactionDto>.Success(dto);
    }
}

public record GetInventoryTransactionsByReferenceQuery(Guid? CompanyId, string ReferenceDocumentType, Guid ReferenceDocumentId) : IRequest<Result<IReadOnlyList<InventoryTransactionDto>>>;

public class GetInventoryTransactionsByReferenceQueryHandler : IRequestHandler<GetInventoryTransactionsByReferenceQuery, Result<IReadOnlyList<InventoryTransactionDto>>>
{
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly IEmployeeRepository _employeeRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryTransactionsByReferenceQueryHandler(
        IInventoryTransactionRepository transactionRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        IEmployeeRepository employeeRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _transactionRepository = transactionRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _employeeRepository = employeeRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<InventoryTransactionDto>>> Handle(GetInventoryTransactionsByReferenceQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<InventoryTransactionDto>>(new List<InventoryTransactionDto>());
        }

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId ?? Guid.Empty;

        var txns = await _transactionRepository.GetByReferenceDocumentAsync(effectiveCompanyId, request.ReferenceDocumentType, request.ReferenceDocumentId, cancellationToken);
        var dtos = new List<InventoryTransactionDto>();

        foreach (var txn in txns)
        {
            var company = await _companyRepository.GetByIdAsync(txn.CompanyId, cancellationToken);
            var location = await _locationRepository.GetByIdAsync(txn.InventoryLocationId, cancellationToken);
            var product = await _productRepository.GetByIdWithDetailsAsync(txn.ProductId, cancellationToken);
            var employee = txn.PerformedByEmployeeId.HasValue ? await _employeeRepository.GetByIdWithDetailsAsync(txn.PerformedByEmployeeId.Value, cancellationToken) : null;

            decimal signedQty = txn.Quantity * InventoryTransactionTypes.GetSignedFactor(txn.TransactionType);
            string? employeeName = employee != null ? $"{employee.FirstName} {employee.LastName}".Trim() : null;

            dtos.Add(new InventoryTransactionDto(
                txn.Id,
                txn.CompanyId,
                company?.LegalName,
                txn.InventoryLocationId,
                location?.Name,
                location?.Code,
                txn.ProductId,
                product?.Name,
                product?.Code,
                product?.Sku,
                product?.BaseUomId ?? Guid.Empty,
                product?.BaseUom?.Name,
                txn.TransactionType,
                txn.Quantity,
                signedQty,
                txn.BalanceAfter,
                txn.ReferenceDocumentType,
                txn.ReferenceDocumentId,
                txn.ReferenceDocumentNumber,
                txn.BatchNumber,
                txn.ExpiryDate,
                txn.PerformedByEmployeeId,
                employeeName,
                txn.Notes,
                txn.CreatedAtUtc));
        }

        return Result.Success<IReadOnlyList<InventoryTransactionDto>>(dtos);
    }
}

public record ReconcileInventoryLedgerQuery(Guid CompanyId, Guid InventoryLocationId, Guid ProductId) : IRequest<Result<InventoryReconciliationDto>>;

public class ReconcileInventoryLedgerQueryHandler : IRequestHandler<ReconcileInventoryLedgerQuery, Result<InventoryReconciliationDto>>
{
    private readonly IInventoryBalanceRepository _balanceRepository;
    private readonly IInventoryTransactionRepository _transactionRepository;
    private readonly IInventoryLocationRepository _locationRepository;
    private readonly IProductRepository _productRepository;
    private readonly ICompanyRepository _companyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public ReconcileInventoryLedgerQueryHandler(
        IInventoryBalanceRepository balanceRepository,
        IInventoryTransactionRepository transactionRepository,
        IInventoryLocationRepository locationRepository,
        IProductRepository productRepository,
        ICompanyRepository companyRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _balanceRepository = balanceRepository;
        _transactionRepository = transactionRepository;
        _locationRepository = locationRepository;
        _productRepository = productRepository;
        _companyRepository = companyRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<InventoryReconciliationDto>> Handle(ReconcileInventoryLedgerQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<InventoryReconciliationDto>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account."));
        }

        var targetCompanyId = authorizedCompanyId ?? request.CompanyId;

        var company = await _companyRepository.GetByIdAsync(targetCompanyId, cancellationToken);
        var location = await _locationRepository.GetByIdAsync(request.InventoryLocationId, cancellationToken);
        var product = await _productRepository.GetByIdWithDetailsAsync(request.ProductId, cancellationToken);

        if (location == null || location.CompanyId != targetCompanyId)
        {
            return Result<InventoryReconciliationDto>.Failure(Error.Validation("InventoryReconciliation.InvalidLocation", "Location not found or does not belong to authorized company."));
        }

        if (product == null || product.CompanyId != targetCompanyId)
        {
            return Result<InventoryReconciliationDto>.Failure(Error.Validation("InventoryReconciliation.InvalidProduct", "Product not found or does not belong to authorized company."));
        }

        var balance = await _balanceRepository.GetByLocationAndProductAsync(targetCompanyId, request.InventoryLocationId, request.ProductId, cancellationToken);
        decimal currentOnHand = balance?.OnHandQuantity ?? 0m;

        var transactions = await _transactionRepository.GetByBalanceContextAsync(targetCompanyId, request.InventoryLocationId, request.ProductId, cancellationToken);

        decimal ledgerCalculatedQty = 0m;
        // Calculate chronological ledger sum (earliest to latest)
        var orderedTxns = transactions.OrderBy(t => t.CreatedAtUtc).ToList();
        foreach (var txn in orderedTxns)
        {
            if (txn.TransactionType.Equals(InventoryTransactionTypes.OpeningBalance, StringComparison.OrdinalIgnoreCase))
            {
                ledgerCalculatedQty = txn.Quantity;
            }
            else
            {
                decimal factor = InventoryTransactionTypes.GetSignedFactor(txn.TransactionType);
                ledgerCalculatedQty += txn.Quantity * factor;
            }
        }

        decimal discrepancy = currentOnHand - ledgerCalculatedQty;
        bool isReconciled = Math.Abs(discrepancy) < 0.0001m;

        var dto = new InventoryReconciliationDto(
            targetCompanyId,
            company?.LegalName,
            request.InventoryLocationId,
            location.Name,
            request.ProductId,
            product.Name,
            product.BaseUom?.Name,
            currentOnHand,
            ledgerCalculatedQty,
            discrepancy,
            isReconciled,
            transactions.Count);

        return Result<InventoryReconciliationDto>.Success(dto);
    }
}
