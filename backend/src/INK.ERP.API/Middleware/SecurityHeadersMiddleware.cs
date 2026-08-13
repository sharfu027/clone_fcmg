namespace INK.ERP.API.Middleware;

public sealed class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        // 1. Content Security Policy (CSP)
        context.Response.Headers["Content-Security-Policy"] = 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data:; " +
            "font-src 'self'; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none';";

        // 2. X-Frame-Options (Clickjacking protection)
        context.Response.Headers["X-Frame-Options"] = "DENY";

        // 3. X-Content-Type-Options (Mime sniffing protection)
        context.Response.Headers["X-Content-Type-Options"] = "nosniff";

        // 4. Referrer Policy
        context.Response.Headers["Referrer-Policy"] = "no-referrer";

        // 5. HSTS (HTTP Strict Transport Security) - enforced only on HTTPS requests
        if (context.Request.IsHttps)
        {
            context.Response.Headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload";
        }

        await _next(context);
    }
}
