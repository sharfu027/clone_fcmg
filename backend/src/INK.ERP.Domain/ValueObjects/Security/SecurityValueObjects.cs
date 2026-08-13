namespace INK.ERP.Domain.ValueObjects.Security;

public sealed record FaceEmbedding
{
    public string VectorData { get; }
    public int Dimension { get; }
    public string AlgorithmVersion { get; }
    public float QualityScore { get; }

    public FaceEmbedding(string vectorData, int dimension, string algorithmVersion, float qualityScore)
    {
        if (string.IsNullOrWhiteSpace(vectorData))
            throw new ArgumentException("Vector data cannot be empty.", nameof(vectorData));
        if (dimension <= 0)
            throw new ArgumentException("Dimension must be positive.", nameof(dimension));
        if (qualityScore < 0.0f || qualityScore > 1.0f)
            throw new ArgumentException("Quality score must be between 0.0 and 1.0.", nameof(qualityScore));

        VectorData = vectorData;
        Dimension = dimension;
        AlgorithmVersion = string.IsNullOrWhiteSpace(algorithmVersion) ? "v1.0" : algorithmVersion;
        QualityScore = qualityScore;
    }
}

public sealed record DeviceFingerprint
{
    public string FingerprintHash { get; }
    public string ClientType { get; }
    public string DeviceModel { get; }
    public string OperatingSystem { get; }

    public DeviceFingerprint(string fingerprintHash, string clientType, string deviceModel, string operatingSystem)
    {
        if (string.IsNullOrWhiteSpace(fingerprintHash))
            throw new ArgumentException("Fingerprint hash cannot be empty.", nameof(fingerprintHash));

        FingerprintHash = fingerprintHash;
        ClientType = clientType ?? "Unknown";
        DeviceModel = deviceModel ?? "Unknown";
        OperatingSystem = operatingSystem ?? "Unknown";
    }
}

public sealed record GpsCoordinate
{
    public double Latitude { get; }
    public double Longitude { get; }
    public double? Altitude { get; }

    public GpsCoordinate(double latitude, double longitude, double? altitude = null)
    {
        if (latitude < -90.0 || latitude > 90.0)
            throw new ArgumentOutOfRangeException(nameof(latitude), "Latitude must be between -90 and 90.");
        if (longitude < -180.0 || longitude > 180.0)
            throw new ArgumentOutOfRangeException(nameof(longitude), "Longitude must be between -180 and 180.");

        Latitude = latitude;
        Longitude = longitude;
        Altitude = altitude;
    }

    public double DistanceToMeters(GpsCoordinate other)
    {
        const double earthRadiusMeters = 6371000;
        var dLat = ToRadians(other.Latitude - Latitude);
        var dLon = ToRadians(other.Longitude - Longitude);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(Latitude)) * Math.Cos(ToRadians(other.Latitude)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return earthRadiusMeters * c;
    }

    private static double ToRadians(double degrees) => degrees * Math.PI / 180.0;
}

public sealed record GeoAccuracy
{
    public double AccuracyInMeters { get; }
    public double? SpeedMs { get; }
    public double? Heading { get; }

    public GeoAccuracy(double accuracyInMeters, double? speedMs = null, double? heading = null)
    {
        if (accuracyInMeters < 0)
            throw new ArgumentOutOfRangeException(nameof(accuracyInMeters), "Accuracy cannot be negative.");

        AccuracyInMeters = accuracyInMeters;
        SpeedMs = speedMs;
        Heading = heading;
    }
}

public sealed record IPAddressValue
{
    public string Value { get; }
    public bool IsV6 { get; }
    public string? CountryCode { get; }

    public IPAddressValue(string value, bool isV6 = false, string? countryCode = null)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("IP address value cannot be empty.", nameof(value));

        Value = value;
        IsV6 = isV6;
        CountryCode = countryCode;
    }
}

public sealed record MacAddress
{
    public string Value { get; }

    public MacAddress(string value)
    {
        if (string.IsNullOrWhiteSpace(value))
            throw new ArgumentException("MAC address cannot be empty.", nameof(value));

        Value = value.ToUpperInvariant();
    }
}

public sealed record BrowserFingerprint
{
    public string UserAgent { get; }
    public string ScreenResolution { get; }
    public string Language { get; }

    public BrowserFingerprint(string userAgent, string screenResolution, string language)
    {
        UserAgent = userAgent ?? "Unknown";
        ScreenResolution = screenResolution ?? "Unknown";
        Language = language ?? "en";
    }
}

public sealed record LocationAccuracy
{
    public double RadiusMeters { get; }
    public int? SignalStrength { get; }

    public LocationAccuracy(double radiusMeters, int? signalStrength = null)
    {
        if (radiusMeters < 0)
            throw new ArgumentOutOfRangeException(nameof(radiusMeters), "Radius cannot be negative.");

        RadiusMeters = radiusMeters;
        SignalStrength = signalStrength;
    }
}
