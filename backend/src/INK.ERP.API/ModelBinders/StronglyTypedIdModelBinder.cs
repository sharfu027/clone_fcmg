using Microsoft.AspNetCore.Mvc.ModelBinding;
using System.ComponentModel;
using INK.ERP.Domain.Common;

namespace INK.ERP.API.ModelBinders;

public sealed class StronglyTypedIdModelBinder : IModelBinder
{
    public Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var modelName = bindingContext.ModelName;
        var valueProviderResult = bindingContext.ValueProvider.GetValue(modelName);

        if (valueProviderResult == ValueProviderResult.None)
        {
            return Task.CompletedTask;
        }

        bindingContext.ModelState.SetModelValue(modelName, valueProviderResult);

        var value = valueProviderResult.FirstValue;
        if (string.IsNullOrEmpty(value))
        {
            return Task.CompletedTask;
        }

        var modelType = bindingContext.ModelType;
        if (!IsStronglyTypedId(modelType))
        {
            return Task.CompletedTask;
        }

        var valueType = modelType.BaseType!.GetGenericArguments()[0];
        try
        {
            var converter = TypeDescriptor.GetConverter(valueType);
            var convertedValue = converter.ConvertFromString(value);

            if (convertedValue is not null)
            {
                var stronglyTypedId = Activator.CreateInstance(modelType, convertedValue);
                bindingContext.Result = ModelBindingResult.Success(stronglyTypedId);
            }
        }
        catch (Exception ex)
        {
            bindingContext.ModelState.TryAddModelError(modelName, ex, bindingContext.ModelMetadata);
        }

        return Task.CompletedTask;
    }

    private static bool IsStronglyTypedId(Type type)
    {
        return type.BaseType is { IsGenericType: true } &&
               type.BaseType.GetGenericTypeDefinition() == typeof(StronglyTypedId<>);
    }
}

public sealed class StronglyTypedIdModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        if (context is null)
        {
            throw new ArgumentNullException(nameof(context));
        }

        var modelType = context.Metadata.ModelType;
        if (modelType.BaseType is { IsGenericType: true } &&
            modelType.BaseType.GetGenericTypeDefinition() == typeof(StronglyTypedId<>))
        {
            return new StronglyTypedIdModelBinder();
        }

        return null;
    }
}
