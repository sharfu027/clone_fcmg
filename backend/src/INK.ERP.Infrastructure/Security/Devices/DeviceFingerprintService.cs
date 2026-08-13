using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Logging;
using INK.ERP.Application.Common.Interfaces;
using INK.ERP.Domain.Common;
using INK.ERP.Domain.ValueObjects.Security;

namespace INK.ERP.Infrastructure.Security.Devices;

public sealed class DeviceFingerprintService : IDeviceFingerprintService
{
    private readonly ILogger<DeviceFingerprintService> _logger;

    public DeviceFingerprintService(ILogger<DeviceFingerprintService> logger)
    {
        _logger = logger;
    }

    public Task<Result<DeviceFingerprint>> GenerateFingerprintAsync(string clientType, string deviceModel, string os, string rawData, CancellationToken cancellationToken = default)
    {
        var normalizedClient = (clientType ?? "Unknown").Trim().ToLowerInvariant();
        var normalizedModel = (deviceModel ?? "Unknown").Trim().ToLowerInvariant();
        var normalizedOs = (os ?? "Unknown").Trim().ToLowerInvariant();
        var normalizedRaw = (rawData ?? string.Empty).Trim();

        var compositeString = $"{normalizedClient}|{normalizedModel}|{normalizedOs}|{normalizedRaw}";

        using var sha256 = SHA256.Create();
        var hashBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(compositeString));
        var fingerprintHash = BitConverter.ToString(hashBytes).Replace("-", "").ToLowerInvariant();

        var fingerprint = new DeviceFingerprint(
            fingerprintHash: fingerprintHash,
            clientType: clientType ?? "Unknown",
            deviceModel: deviceModel ?? "Unknown",
            operatingSystem: os ?? "Unknown");

        _logger.LogDebug("Generated device fingerprint hash '{Hash}' for {Model}", fingerprintHash, deviceModel);

        return Task.FromResult(Result.Success(fingerprint));
    }
}
