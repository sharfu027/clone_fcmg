using System.Text.Json;
using System.Text.Json.Serialization;
using INK.ERP.Domain.Common;

namespace INK.ERP.Infrastructure.Persistence.Converters;

public sealed class StronglyTypedIdJsonConverter<TId, TValue> : JsonConverter<TId>
    where TId : StronglyTypedId<TValue>
    where TValue : notnull
{
    public override TId? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        var value = JsonSerializer.Deserialize<TValue>(ref reader, options);
        if (value is null)
        {
            return null;
        }

        return Activator.CreateInstance(typeToConvert, value) as TId;
    }

    public override void Write(Utf8JsonWriter writer, TId value, JsonSerializerOptions options)
    {
        JsonSerializer.Serialize(writer, value.Value, options);
    }
}

public sealed class StronglyTypedIdJsonConverterFactory : JsonConverterFactory
{
    public override bool CanConvert(Type typeToConvert)
    {
        return IsStronglyTypedId(typeToConvert);
    }

    public override JsonConverter? CreateConverter(Type typeToConvert, JsonSerializerOptions options)
    {
        if (!IsStronglyTypedId(typeToConvert))
        {
            return null;
        }

        var valueType = typeToConvert.BaseType!.GetGenericArguments()[0];
        var converterType = typeof(StronglyTypedIdJsonConverter<,>).MakeGenericType(typeToConvert, valueType);

        return Activator.CreateInstance(converterType) as JsonConverter;
    }

    private static bool IsStronglyTypedId(Type type)
    {
        return type.BaseType is { IsGenericType: true } &&
               type.BaseType.GetGenericTypeDefinition() == typeof(StronglyTypedId<>);
    }
}
