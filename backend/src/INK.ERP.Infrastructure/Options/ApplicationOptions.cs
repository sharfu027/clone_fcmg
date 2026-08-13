using System.ComponentModel.DataAnnotations;

namespace INK.ERP.Infrastructure.Options;

public sealed class ApplicationOptions
{
    public const string SectionName = "Application";

    [Required(AllowEmptyStrings = false)]
    public string EnvironmentName { get; set; } = "Development";

    [Required(AllowEmptyStrings = false)]
    public string AppVersion { get; set; } = "1.0.0";
}
