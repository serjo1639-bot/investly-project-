// IMediaService - Contract for file upload/media operations
// Also defines MediaUploadResponse and MediaDto since they're
// closely tied to the interface (fewer files to manage)

using Microsoft.AspNetCore.Http;
using Investly_Backend.DTOs;

namespace Investly_Backend.Interfaces;

public interface IMediaService
{
    Task<MediaUploadResponse?> UploadAsync(IFormFile file, int projectId, string mediaType, bool isPrimary, string? altText);
    Task<List<MediaDto>> GetByProjectAsync(int projectId);
    Task<bool> DeleteAsync(int mediaId);
}

// Response returned after a file upload
public class MediaUploadResponse
{
    public int MediaId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
}

// Media item info for listing
public class MediaDto
{
    public int MediaId { get; set; }
    public int ProjectId { get; set; }
    public string Url { get; set; } = string.Empty;
    public string MediaType { get; set; } = string.Empty;
    public bool IsPrimary { get; set; }
    public string? AltText { get; set; }
}
