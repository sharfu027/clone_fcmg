using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using MediatR;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Inventory.Policies.DTOs;
using INK.ERP.Domain.Common;

namespace INK.ERP.Application.Features.Inventory.Policies.Queries;

public record GetInventoryStockPoliciesQuery(
    Guid? CompanyId = null,
    Guid? InventoryLocationId = null,
    Guid? ProductId = null) : IRequest<Result<IReadOnlyList<InventoryStockPolicyDto>>>;

public class GetInventoryStockPoliciesQueryHandler : IRequestHandler<GetInventoryStockPoliciesQuery, Result<IReadOnlyList<InventoryStockPolicyDto>>>
{
    private readonly IInventoryStockPolicyRepository _policyRepository;
    private readonly ICompanyAccessResolver _companyAccessResolver;

    public GetInventoryStockPoliciesQueryHandler(
        IInventoryStockPolicyRepository policyRepository,
        ICompanyAccessResolver companyAccessResolver)
    {
        _policyRepository = policyRepository;
        _companyAccessResolver = companyAccessResolver;
    }

    public async Task<Result<IReadOnlyList<InventoryStockPolicyDto>>> Handle(GetInventoryStockPoliciesQuery request, CancellationToken cancellationToken)
    {
        var authorizedCompanyId = await _companyAccessResolver.GetAuthorizedCompanyIdAsync(cancellationToken);
        if (authorizedCompanyId == Guid.Empty)
        {
            return Result<IReadOnlyList<InventoryStockPolicyDto>>.Failure(Error.Unauthorized("IAM.NoCompanyAssigned", "No company has been assigned to your account."));
        }

        var targetCompanyId = request.CompanyId ?? authorizedCompanyId.GetValueOrDefault();
        IReadOnlyList<Domain.Entities.Inventory.InventoryStockPolicy> policies;

        if (request.InventoryLocationId.HasValue)
        {
            policies = await _policyRepository.GetPoliciesByLocationAsync(targetCompanyId, request.InventoryLocationId.Value, cancellationToken);
        }
        else
        {
            policies = await _policyRepository.GetPoliciesByCompanyAsync(targetCompanyId, cancellationToken);
        }

        if (request.ProductId.HasValue)
        {
            policies = policies.Where(p => p.ProductId == request.ProductId.Value).ToList();
        }

        var dtos = policies.Select(p => new InventoryStockPolicyDto(
            p.Id,
            p.CompanyId,
            p.Company?.LegalName,
            p.InventoryLocationId,
            p.InventoryLocation?.Name,
            p.InventoryLocation?.Code,
            p.ProductId,
            p.Product?.Name,
            p.Product?.Code,
            p.Product?.Sku,
            p.MinStockQuantity,
            p.ReorderPoint,
            p.ReorderQuantity,
            p.IsActive,
            p.CreatedAtUtc,
            p.LastModifiedAtUtc
        )).ToList();

        return Result.Success<IReadOnlyList<InventoryStockPolicyDto>>(dtos);
    }
}
