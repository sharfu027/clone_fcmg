using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using INK.ERP.Domain.Common;

namespace INK.ERP.Infrastructure.Persistence.Converters;

public sealed class StronglyTypedIdValueConverter<TId, TValue> : ValueConverter<TId, TValue>
    where TId : StronglyTypedId<TValue>
    where TValue : notnull
{
    public StronglyTypedIdValueConverter()
        : base(
            id => id.Value,
            value => CreateId(value))
    {
    }

    private static TId CreateId(TValue value)
    {
        var id = Activator.CreateInstance(typeof(TId), value) as TId;
        return id ?? throw new InvalidOperationException($"Could not create instance of strongly typed ID: {typeof(TId).Name}");
    }
}
