namespace INK.ERP.Application.Features.MasterData.UnitsOfMeasure.DTOs;

public record UnitOfMeasureDto(
    Guid Id,
    Guid CompanyId,
    string? CompanyName,
    string Code,
    string Name,
    string BaseUnitCode,
    decimal ConversionFactor,
    bool IsFractionalAllowed,
    bool IsActive,
    DateTime CreatedAtUtc);
