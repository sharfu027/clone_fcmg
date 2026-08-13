using System;
using System.Threading;
using System.Threading.Tasks;

namespace INK.ERP.Application.Common.Interfaces;

public record PriceResolutionResultDto(
    decimal ResolvedPrice,
    string Currency,
    string Source, // "CustomerPrice", "PublishedPriceList", "ProductBasePrice"
    Guid? PriceListId,
    Guid? CustomerPriceId,
    DateTime EffectiveDate,
    decimal MinimumAllowedPrice,
    string? PriceListName,
    string? CustomerName,
    string? ProductName
);

public interface IPricingResolutionService
{
    Task<PriceResolutionResultDto> ResolvePriceAsync(
        Guid companyId,
        Guid? customerId,
        Guid productId,
        DateTime? targetDate = null,
        CancellationToken cancellationToken = default);
}
