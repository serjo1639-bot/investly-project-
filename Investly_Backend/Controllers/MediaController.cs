// ============================================================
// MEDIA CONTROLLER - File upload and management
// ============================================================
// Uses [FromForm] instead of [FromBody] because file uploads
// use multipart/form-data (not JSON).
// IFormFile represents the uploaded file from the HTTP request.
// ============================================================

using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Investly_Backend.Interfaces;

namespace Investly_Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class MediaController : ControllerBase
{
    private readonly IMediaService _mediaService;

    public MediaController(IMediaService mediaService)
    {
        _mediaService = mediaService;
    }

    // POST /api/media/upload - Upload a file
    // [FromForm] binds from multipart/form-data (file uploads use this, not JSON)
    [HttpPost("upload")]
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] int projectId, [FromForm] string mediaType, [FromForm] bool isPrimary, [FromForm] string? altText = null)
    {
        var result = await _mediaService.UploadAsync(file, projectId, mediaType, isPrimary, altText);
        return Ok(result);
    }

    // GET /api/media/project/{projectId} - List media for a project
    [HttpGet("project/{projectId}")]
    public async Task<IActionResult> GetProjectMedia(int projectId)
    {
        var media = await _mediaService.GetByProjectAsync(projectId);
        return Ok(media);
    }

    // DELETE /api/media/{id} - Delete media file
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteMedia(int id)
    {
        var result = await _mediaService.DeleteAsync(id);
        return Ok(result);
    }
}
