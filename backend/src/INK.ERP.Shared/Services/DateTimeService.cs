using INK.ERP.Shared.Interfaces;

namespace INK.ERP.Shared.Services;

public sealed class DateTimeService : IDateTime
{
    public DateTime UtcNow => DateTime.UtcNow;
}
