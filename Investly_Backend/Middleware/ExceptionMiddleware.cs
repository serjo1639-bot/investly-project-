using System.Net;
using System.Text.Json;

namespace InvestlyFullAPI.Middleware;

// Global exception handling middleware
// Catches any unhandled exception and returns a clean JSON error response
// This prevents the server from crashing or returning stack traces to clients
public class ExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    // This method is called for every HTTP request
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            // Pass the request to the next middleware in the pipeline
            await _next(context);
        }
        catch (Exception ex)
        {
            // Log the full error details on the server
            _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);

            // Return a clean error response to the client
            await HandleExceptionAsync(context, ex);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        // Set the response type to JSON
        context.Response.ContentType = "application/json";

        // Determine the HTTP status code based on the exception type
        var statusCode = exception switch
        {
            KeyNotFoundException => HttpStatusCode.NotFound,      // 404
            UnauthorizedAccessException => HttpStatusCode.Forbidden, // 403
            ArgumentException => HttpStatusCode.BadRequest,       // 400
            _ => HttpStatusCode.InternalServerError               // 500
        };

        context.Response.StatusCode = (int)statusCode;

        // Create a standardized error response object
        var errorResponse = new
        {
            StatusCode = (int)statusCode,
            Message = exception.Message,
            // Include stack trace only in development environment
            // Never expose stack traces in production!
            Detailed = context.RequestServices
                .GetRequiredService<IWebHostEnvironment>()
                .IsDevelopment()
                ? exception.StackTrace
                : null
        };

        var jsonResponse = JsonSerializer.Serialize(errorResponse, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        });

        return context.Response.WriteAsync(jsonResponse);
    }
}
