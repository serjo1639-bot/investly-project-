// ============================================================
// MEDIA SERVICE - File upload/delete and media management
// ============================================================
// Files are stored on DISK (not in the database).
// Only the FILE PATH is stored in the database (ProjectMedia table).
// This keeps the database small and file serving fast.
// ============================================================

using Microsoft.EntityFrameworkCore;
using Investly_Backend.Interfaces;
using Investly_Backend.Models;
using Investly_Backend.Data;
using Investly_Backend.DTOs;
using Microsoft.AspNetCore.Http;
using System.IO;

namespace Investly_Backend.Services;

public class MediaService : IMediaService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;  // For upload path config

    public MediaService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<MediaUploadResponse?> UploadAsync(IFormFile file, int projectId, string mediaType, bool isPrimary, string? altText)
    {
        var project = await _context.Projects.FindAsync(projectId);
        if (project == null) return null;

        // Get upload path from config (or use default)
        // Keep uploads inside the project by default instead of using an old absolute Desktop path.
        var uploadsFolder = _configuration["Uploads:Path"] ?? "uploads";
        // Organize files by date: uploads/2026-06-01/filename.jpg
        var dateFolder = DateTime.UtcNow.ToString("yyyy-MM-dd");
        var fullFolder = Path.Combine(uploadsFolder, dateFolder);
        Directory.CreateDirectory(fullFolder);  // Create folder if doesn't exist

        // Generate unique filename to prevent collisions
        // Guid.NewGuid() creates a globally unique identifier
        var fileName = Guid.NewGuid().ToString() + Path.GetExtension(file.FileName);
        var filePath = Path.Combine(fullFolder, fileName);
        var mediaUrl = Path.Combine(dateFolder, fileName).Replace("\\", "/");

        // Save file to disk (using FileStream, the standard .NET file API)
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);  // Copy uploaded file to disk
        }

        // Save metadata to database
        var media = new ProjectMedia
        {
            ProjectId = projectId,
            MediaUrl = mediaUrl,
            MediaType = mediaType,
            IsPrimary = isPrimary,
            AltText = altText,
            SortOrder = 0,
            CreatedAt = DateTime.UtcNow
        };

        _context.ProjectMedia.Add(media);
        await _context.SaveChangesAsync();  // INSERT INTO ProjectMedia ...

        return new MediaUploadResponse
        {
            MediaId = media.MediaId,
            Url = mediaUrl,
            MediaType = media.MediaType,
            IsPrimary = media.IsPrimary
        };
    }

    public async Task<List<MediaDto>> GetByProjectAsync(int projectId)
    {
        var mediaList = await _context.ProjectMedia
            .Where(m => m.ProjectId == projectId)
            .OrderBy(m => m.SortOrder)
            .ThenBy(m => m.CreatedAt)
            .ToListAsync();

        return mediaList.Select(m => new MediaDto
        {
            MediaId = m.MediaId,
            ProjectId = m.ProjectId,
            Url = m.MediaUrl,
            MediaType = m.MediaType,
            IsPrimary = m.IsPrimary,
            AltText = m.AltText
        }).ToList();
    }

    public async Task<bool> DeleteAsync(int mediaId)
    {
        var media = await _context.ProjectMedia.FindAsync(mediaId);
        if (media == null) return false;

        // Delete the PHYSICAL FILE from disk first
        // Same folder used during upload, so deleting a media record deletes the correct local file.
        var uploadsFolder = _configuration["Uploads:Path"] ?? "uploads";
        var fullPath = Path.Combine(uploadsFolder, media.MediaUrl);

        if (File.Exists(fullPath))
        {
            File.Delete(fullPath);  // Delete file from disk
        }

        // Then delete the DATABASE RECORD
        _context.ProjectMedia.Remove(media);
        await _context.SaveChangesAsync();  // DELETE FROM ProjectMedia WHERE MediaId = ...
        return true;
    }
}
