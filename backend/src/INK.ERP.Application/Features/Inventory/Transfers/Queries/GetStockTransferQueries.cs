using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Transfers.DTOs;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.Entities.MasterData;
using INK.ERP.Domain.Entities.Inventory;

namespace INK.ERP.Application.Features.Inventory.Transfers.Queries;

public record GetStockTransfersPagedQuery(
    Guid? CompanyId = null,
    Guid? SourceLocationId = null,
    Guid? DestinationLocationId = null,
    Guid? SalesOrderId = null,
    string? Status = null,
    string? Search = null,
    int Page = 1,
    int PageSize = 50
) : IRequest<Result<IReadOnlyList<StockTransferDto>>>;

public class GetStockTransfersPagedQueryHandler : IRequestHandler<GetStockTransfersPagedQuery, Result<IReadOnlyList<StockTransferDto>>>
{
    private readonly IStockTransferRepository _transferRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetStockTransfersPagedQueryHandler(
        IStockTransferRepository transferRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _transferRepository = transferRepository ?? throw new ArgumentNullException(nameof(transferRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<IReadOnlyList<StockTransferDto>>> Handle(GetStockTransfersPagedQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result.Success<IReadOnlyList<StockTransferDto>>(new List<StockTransferDto>());
        }

        var effectiveCompanyId = authorizedCompanyId ?? request.CompanyId;
        if (effectiveCompanyId.HasValue)
        {
            var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(effectiveCompanyId.Value, cancellationToken);
            if (!hasAccess)
            {
                return Result<IReadOnlyList<StockTransferDto>>.Failure(Error.Unauthorized("Transfer.Unauthorized", "Unauthorized access to requested company transfers."));
            }
        }

        var transfers = await _transferRepository.ListAsync(
            effectiveCompanyId,
            request.SourceLocationId,
            request.DestinationLocationId,
            request.SalesOrderId,
            request.Status,
            request.Search,
            request.Page,
            request.PageSize,
            cancellationToken);

        var dtos = transfers.Select(t => new StockTransferDto(
            t.Id,
            t.CompanyId,
            t.Company?.LegalName ?? t.Company?.TradeName ?? "Company",
            t.TransferNumber,
            t.SourceLocationId,
            t.SourceLocation?.Name ?? "Source Location",
            t.SourceLocation?.Code ?? "SRC",
            t.DestinationLocationId,
            t.DestinationLocation?.Name ?? "Destination Location",
            t.DestinationLocation?.Code ?? "DST",
            t.SalesOrderId,
            t.SalesOrder?.OrderNumber,
            t.Status,
            t.RequestedByEmployeeId,
            t.RequestedByEmployee != null ? $"{t.RequestedByEmployee.FirstName} {t.RequestedByEmployee.LastName}".Trim() : "Employee",
            t.ApprovedByEmployeeId,
            t.ApprovedByEmployee != null ? $"{t.ApprovedByEmployee.FirstName} {t.ApprovedByEmployee.LastName}".Trim() : null,
            t.DispatchedAtUtc,
            t.ReceivedAtUtc,
            t.Notes,
            t.CreatedAtUtc,
            t.LastModifiedAtUtc,
            t.Lines.Select(l => new StockTransferLineDto(
                l.Id,
                l.StockTransferId,
                l.ProductId,
                l.Product?.Name ?? "Product",
                l.Product?.Code ?? "PRD",
                l.Product?.Sku,
                l.Product?.BaseUom?.Name ?? "unit",
                l.RequestedQuantity,
                l.ApprovedQuantity,
                l.DispatchedQuantity,
                l.ReceivedQuantity,
                Math.Max(0m, l.DispatchedQuantity - l.ReceivedQuantity),
                l.CreatedAtUtc
            )).ToList()
        )).ToList();

        return Result.Success<IReadOnlyList<StockTransferDto>>(dtos);
    }
}

public record GetStockTransferByIdQuery(Guid Id) : IRequest<Result<StockTransferDto>>;

public class GetStockTransferByIdQueryHandler : IRequestHandler<GetStockTransferByIdQuery, Result<StockTransferDto>>
{
    private readonly IStockTransferRepository _transferRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetStockTransferByIdQueryHandler(
        IStockTransferRepository transferRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _transferRepository = transferRepository ?? throw new ArgumentNullException(nameof(transferRepository));
        _companyAccessResolver = companyAccessResolver ?? throw new ArgumentNullException(nameof(companyAccessResolver));
    }

    public async Task<Result<StockTransferDto>> Handle(GetStockTransferByIdQuery request, CancellationToken cancellationToken)
    {
        if (request.Id == Guid.Empty)
            return Result<StockTransferDto>.Failure(Error.Validation("Transfer.InvalidId", "Transfer ID is required."));

        var t = await _transferRepository.GetByIdWithDetailsAsync(request.Id, cancellationToken);
        if (t == null)
            return Result<StockTransferDto>.Failure(Error.NotFound("Transfer.NotFound", "Stock transfer not found."));

        var hasAccess = await _companyAccessResolver.HasAccessToCompanyAsync(t.CompanyId, cancellationToken);
        if (!hasAccess)
            return Result<StockTransferDto>.Failure(Error.Unauthorized("Transfer.Unauthorized", "Unauthorized access to requested company transfer."));

        var dto = new StockTransferDto(
            t.Id,
            t.CompanyId,
            t.Company?.LegalName ?? t.Company?.TradeName ?? "Company",
            t.TransferNumber,
            t.SourceLocationId,
            t.SourceLocation?.Name ?? "Source Location",
            t.SourceLocation?.Code ?? "SRC",
            t.DestinationLocationId,
            t.DestinationLocation?.Name ?? "Destination Location",
            t.DestinationLocation?.Code ?? "DST",
            t.SalesOrderId,
            t.SalesOrder?.OrderNumber,
            t.Status,
            t.RequestedByEmployeeId,
            t.RequestedByEmployee != null ? $"{t.RequestedByEmployee.FirstName} {t.RequestedByEmployee.LastName}".Trim() : "Employee",
            t.ApprovedByEmployeeId,
            t.ApprovedByEmployee != null ? $"{t.ApprovedByEmployee.FirstName} {t.ApprovedByEmployee.LastName}".Trim() : null,
            t.DispatchedAtUtc,
            t.ReceivedAtUtc,
            t.Notes,
            t.CreatedAtUtc,
            t.LastModifiedAtUtc,
            t.Lines.Select(l => new StockTransferLineDto(
                l.Id,
                l.StockTransferId,
                l.ProductId,
                l.Product?.Name ?? "Product",
                l.Product?.Code ?? "PRD",
                l.Product?.Sku,
                l.Product?.BaseUom?.Name ?? "unit",
                l.RequestedQuantity,
                l.ApprovedQuantity,
                l.DispatchedQuantity,
                l.ReceivedQuantity,
                Math.Max(0m, l.DispatchedQuantity - l.ReceivedQuantity),
                l.CreatedAtUtc
            )).ToList()
        );

        return Result.Success(dto);
    }
}
