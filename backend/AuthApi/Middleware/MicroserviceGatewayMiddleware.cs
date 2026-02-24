namespace AuthApi.Middleware;

public class MicroserviceGatewayMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<MicroserviceGatewayMiddleware> _logger;
    private readonly Dictionary<string, List<string>> _serviceRoutes;

    public MicroserviceGatewayMiddleware(RequestDelegate next, ILogger<MicroserviceGatewayMiddleware> logger)
    {
        _next = next;
        _logger = logger;
        
        // Define microservice routes
        _serviceRoutes = new Dictionary<string, List<string>>
        {
            ["auth-service"] = new List<string> { "/api/auth" },
            ["user-service"] = new List<string> { "/api/auth/user" },
            ["event-service"] = new List<string> { "/api/events" } // Placeholder for future expansion
        };
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value?.ToLower() ?? "";
        
        // Route to appropriate microservice
        foreach (var service in _serviceRoutes)
        {
            if (service.Value.Any(route => path.StartsWith(route)))
            {
                context.Items["Microservice"] = service.Key;
                _logger.LogInformation("Request routed to {Service} for path {Path}", service.Key, path);
                
                // Add microservice headers for distributed tracing
                context.Response.Headers.Append("X-Microservice", service.Key);
                context.Response.Headers.Append("X-Request-ID", Guid.NewGuid().ToString());
                
                break;
            }
        }

        await _next(context);
    }
}

// Extension method for easy middleware registration
public static class MicroserviceGatewayExtensions
{
    public static IApplicationBuilder UseMicroserviceGateway(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<MicroserviceGatewayMiddleware>();
    }
}
