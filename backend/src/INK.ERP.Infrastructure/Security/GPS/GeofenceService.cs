using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Application.Features.Security.Common;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Infrastructure.Security.GPS;

public sealed class GeofenceService : IGeofenceService
{
    private readonly ILogger<GeofenceService> _logger;

    public GeofenceService(ILogger<GeofenceService> logger)
    {
        _logger = logger;
    }

    public Task<Result<bool>> IsWithinGeofenceAsync(GpsCoordinate coordinate, GeofenceDto geofence, CancellationToken cancellationToken = default)
    {
        if (coordinate == null || geofence == null)
        {
            return Task.FromResult(Result.Failure<bool>(new Error("SECURITY.GEOFENCE.INVALID_INPUT", "Coordinate or geofence data is missing.", ErrorType.Validation)));
        }

        bool isInside = geofence.Shape switch
        {
            GeofenceShape.Circular => IsInsideCircular(coordinate, geofence),
            GeofenceShape.Polygon => IsInsidePolygon(coordinate, geofence.PolygonPoints),
            GeofenceShape.MultiPolygon => IsInsideMultiPolygon(coordinate, geofence.MultiPolygonPoints),
            _ => false
        };

        _logger.LogInformation("Geofence check for '{Name}' shape '{Shape}': {IsInside}", geofence.Name, geofence.Shape, isInside);

        return Task.FromResult(Result.Success(isInside));
    }

    private static bool IsInsideCircular(GpsCoordinate coord, GeofenceDto geofence)
    {
        if (geofence.Center == null) return false;
        double distanceMeters = coord.DistanceToMeters(geofence.Center);
        return distanceMeters <= geofence.RadiusMeters;
    }

    private static bool IsInsidePolygon(GpsCoordinate coord, IReadOnlyList<GpsCoordinate>? polygon)
    {
        if (polygon == null || polygon.Count < 3) return false;

        bool inside = false;
        int j = polygon.Count - 1;
        for (int i = 0; i < polygon.Count; i++)
        {
            if ((polygon[i].Longitude > coord.Longitude) != (polygon[j].Longitude > coord.Longitude) &&
                (coord.Latitude < (polygon[j].Latitude - polygon[i].Latitude) * (coord.Longitude - polygon[i].Longitude) / (polygon[j].Longitude - polygon[i].Longitude) + polygon[i].Latitude))
            {
                inside = !inside;
            }
            j = i;
        }

        return inside;
    }

    private static bool IsInsideMultiPolygon(GpsCoordinate coord, IReadOnlyList<IReadOnlyList<GpsCoordinate>>? multiPolygon)
    {
        if (multiPolygon == null) return false;
        return multiPolygon.Any(poly => IsInsidePolygon(coord, poly));
    }
}
