using System.ComponentModel.DataAnnotations;

namespace INK.ERP.Infrastructure.Options;

public sealed class HangfireOptions
{
    public const string SectionName = "Hangfire";

    [Required(AllowEmptyStrings = false)]
    public string ConnectionString { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string SchemaName { get; set; } = "hangfire";
}
