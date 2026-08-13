namespace INK.ERP.Application.Common.Interfaces;

public interface IIdempotencyStore
{
    Task<bool> TryAcquireKeyAsync(string key, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task SaveResponseAsync(string key, int statusCode, string bodyContent, TimeSpan expiration, CancellationToken cancellationToken = default);
    Task<IdempotentResponse?> GetResponseAsync(string key, CancellationToken cancellationToken = default);
}

public sealed record IdempotentResponse(int StatusCode, string BodyContent);
