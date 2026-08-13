namespace INK.ERP.Application.Features.MasterData.Categories.DTOs;

public record CategoryDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Code,
    string Name,
    Guid? ParentCategoryId,
    string? ParentCategoryName,
    decimal GstTaxRatePercent,
    string HsnCodeDefault,
    bool IsActive,
    DateTime CreatedAtUtc);
