// ============================================================
// COMMON DTOS - Shared Data Transfer Objects
// ============================================================
// WHAT ARE DTOS?
// DTOs are objects that carry data BETWEEN the API and clients.
// They are NOT the same as database models (Entity Framework entities).
//
// WHY SEPARATE DTOS FROM MODELS?
// 1. SECURITY: Models might expose sensitive fields (e.g., PasswordHash).
//    DTOs only include what the client should see.
// 2. DECOUPLING: You can change your database schema without breaking
//    the API contract with clients.
// 3. CONTROL: You can shape data specifically for each API response.
//    e.g., return computed fields that don't exist in the database.
// 4. AVOID CIRCULAR REFERENCES: Navigation properties in models can
//    cause JSON serialization loops. DTOs flatten the data.
// ============================================================

namespace Investly_Backend.DTOs;

// Generic wrapper for ALL API responses.
// Every endpoint returns data wrapped in this structure.
// T is the type of the Data payload.
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }
}

// Simplified version without generic Data type (for simple responses)
public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
}

// Standard request parameters for paginated endpoints
public class PaginatedListRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public string? SortOrder { get; set; }
}

// Simple request with just a status field (used for status updates)
public class StatusUpdateRequest
{
    public string Status { get; set; } = string.Empty;
}
