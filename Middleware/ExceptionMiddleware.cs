// ============================================================
// EXCEPTION MIDDLEWARE - GLOBAL ERROR HANDLER
// ============================================================
// WHAT IS MIDDLEWARE?
// Middleware are components in the ASP.NET Core request pipeline.
// Each request passes through middleware in the order they're registered.
// Middleware can:
//   1. Do something BEFORE the next component (logging, auth check)
//   2. Pass to the next component (await _next(context))
//   3. Do something AFTER the next component (error handling, response modification)
//   4. Short-circuit (return a response early, like auth failure)
//
// THIS MIDDLEWARE:
// Catches ALL unhandled exceptions thrown anywhere in the pipeline.
// Without this, an unhandled exception would return a 500 with
// HTML error page (or crash the server). Instead, we return a
// clean JSON error response with the appropriate HTTP status code.
// ============================================================

using System.Net;
using System.Text.Json;
using Investly_Backend.DTOs;

namespace Investly_Backend.Middleware;

// Middleware classes have a specific pattern:
// 1. Constructor takes RequestDelegate (the NEXT middleware in the pipeline)
// 2. Have an InvokeAsync method that takes HttpContext
public class ExceptionMiddleware
{
    // _next points to the next middleware in the pipeline
    // Think of it as the "next station" on the request's journey
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionMiddleware> _logger;
    private readonly IHostEnvironment _env;

    public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    // This method is called for EVERY HTTP request
    // HttpContext contains ALL info about the request AND response
    public async Task InvokeAsync(HttpContext context)
    {
        try 
        { 
            // Pass the request to the next middleware in the pipeline
            // Everything before this runs BEFORE the controller
            // Everything after this runs AFTER the controller
            await _next(context); 
        }
        catch (Exception ex)
        {
            // If ANY middleware or controller threw an unhandled exception,
            // we catch it here and return a clean JSON error response
            var correlationId = Guid.NewGuid().ToString();
            _logger.LogError(ex, "Unhandled exception [{CorrelationId}]", correlationId);
            await HandleExceptionAsync(context, ex, _env, correlationId);
        }
    }

    // Converts exceptions to appropriate HTTP status codes and JSON responses
    private static async Task HandleExceptionAsync(HttpContext context, Exception exception, IHostEnvironment env, string correlationId)
    {
        // Tell the client we're returning JSON (not HTML)
        context.Response.ContentType = "application/json";

        var isDevelopment = env.IsDevelopment();
        var message = isDevelopment ? exception.Message : "An unexpected error occurred. Please try again later.";
        var errors = isDevelopment ? new List<string> { exception.InnerException?.Message ?? exception.StackTrace } : new List<string> { $"Correlation ID: {correlationId}" };

        // Build a standardized error response using our ApiResponse DTO
        var response = new ApiResponse<object>
        {
            Success = false,
            Message = message,
            Errors = errors!
        };

        // ---- PATTERN MATCHING SWITCH ----
        // C# switch expression: maps exception TYPES to HTTP status codes
        // This is cleaner than if-else if chains
        context.Response.StatusCode = exception switch
        {
            UnauthorizedAccessException => (int)HttpStatusCode.Unauthorized,  // 401
            KeyNotFoundException => (int)HttpStatusCode.NotFound,             // 404
            InvalidOperationException => (int)HttpStatusCode.BadRequest,      // 400
            ArgumentException => (int)HttpStatusCode.BadRequest,              // 400
            _ => (int)HttpStatusCode.InternalServerError                      // 500 (default)
        };

        // Serialize the response to JSON and write it to the HTTP response body
        await context.Response.WriteAsync(JsonSerializer.Serialize(response));
    }
}
