using System.ComponentModel.DataAnnotations;

namespace INK.ERP.Infrastructure.Options;

public sealed class RedisOptions
{
    public const string SectionName = "Redis";

    [Required(AllowEmptyStrings = false)]
    public string ConnectionString { get; set; } = string.Empty;

    [Required(AllowEmptyStrings = false)]
    public string InstanceName { get; set; } = "INK_ERP_";
}
