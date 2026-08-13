using System.ComponentModel.DataAnnotations;

namespace INK.ERP.Infrastructure.Options;

public sealed class OpenTelemetryOptions
{
    public const string SectionName = "OpenTelemetry";

    public bool EnableTracing { get; set; } = false;

    [Required(AllowEmptyStrings = false)]
    public string ServiceName { get; set; } = "INK.ERP.API";
}
