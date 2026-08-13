using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Application.Features.Security.Common;

public enum GeofenceShape
{
    Circular = 0,
    Polygon = 1,
    MultiPolygon = 2
}

public sealed record GeofenceDto(
    string Name,
    GeofenceShape Shape,
    GpsCoordinate? Center = null,
    double RadiusMeters = 0.0,
    IReadOnlyList<GpsCoordinate>? PolygonPoints = null,
    IReadOnlyList<IReadOnlyList<GpsCoordinate>>? MultiPolygonPoints = null);
