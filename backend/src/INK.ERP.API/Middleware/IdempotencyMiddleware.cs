using INK.ERP.Application.Common.Interfaces;

namespace INK.ERP.API.Middleware;

public sealed class IdempotencyMiddleware
{
    private const string IdempotencyKeyHeaderName = "Idempotency-Key";
    private readonly RequestDelegate _next;

    public IdempotencyMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IIdempotencyStore idempotencyStore)
    {
        var method = context.Request.Method;

        // Idempotency is typically applied only to mutating operations: POST and PUT
        if (method != HttpMethods.Post && method != HttpMethods.Put)
        {
            await _next(context);
            return;
        }

        if (!context.Request.Headers.TryGetValue(IdempotencyKeyHeaderName, out var idempotencyKey) ||
            string.IsNullOrEmpty(idempotencyKey))
        {
            await _next(context);
            return;
        }

        var key = idempotencyKey.ToString();
        var expiration = TimeSpan.FromHours(24); // Idempotency key expires after 24 hours

        // Check if there is already a cached response
        var cachedResponse = await idempotencyStore.GetResponseAsync(key, context.RequestAborted);
        if (cachedResponse is not null)
        {
            context.Response.StatusCode = cachedResponse.StatusCode;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync(cachedResponse.BodyContent, context.RequestAborted);
            return;
        }

        // Try to acquire lock to process the request
        var acquired = await idempotencyStore.TryAcquireKeyAsync(key, expiration, context.RequestAborted);
        if (!acquired)
        {
            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsync("{\"error\": \"A request with this Idempotency-Key is currently being processed or has already completed.\"}", context.RequestAborted);
            return;
        }

        // Intercept response stream to cache it
        var originalResponseBodyStream = context.Response.Body;
        using var responseBodyMemoryStream = new MemoryStream();
        context.Response.Body = responseBodyMemoryStream;

        try
        {
            await _next(context);

            context.Response.Body = originalResponseBodyStream;
            responseBodyMemoryStream.Seek(0, SeekOrigin.Begin);
            
            var responseBodyText = await new StreamReader(responseBodyMemoryStream).ReadToEndAsync(context.RequestAborted);
            
            // Cache successful and client error responses (do not cache server errors: 5xx)
            if (context.Response.StatusCode < 500)
            {
                await idempotencyStore.SaveResponseAsync(key, context.Response.StatusCode, responseBodyText, expiration, context.RequestAborted);
            }

            responseBodyMemoryStream.Seek(0, SeekOrigin.Begin);
            await responseBodyMemoryStream.CopyToAsync(originalResponseBodyStream, context.RequestAborted);
        }
        catch
        {
            context.Response.Body = originalResponseBodyStream;
            throw;
        }
    }
}
