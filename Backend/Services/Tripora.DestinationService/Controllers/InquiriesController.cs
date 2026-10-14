using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Controllers;

[ApiController]
[Route("api/inquiries")]
[Produces("application/json")]
public sealed class InquiriesController(DestinationDbContext db) : ControllerBase
{
    [HttpPost]
    [AllowAnonymous]
    public async Task<ActionResult<InquiryResponseDto>> Create(
        [FromBody] InquiryRequestDto request,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name)
            || string.IsNullOrWhiteSpace(request.PhoneNumber)
            || string.IsNullOrWhiteSpace(request.Reason)
            || string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { message = "Name, phone number, reason, and message are required." });
        }

        var inquiry = new Inquiry
        {
            Name = request.Name.Trim(),
            PhoneNumber = request.PhoneNumber.Trim(),
            Email = User.Identity?.IsAuthenticated == true ? GetUserEmail() : null,
            Reason = request.Reason.Trim(),
            Message = request.Message.Trim(),
            UserId = User.Identity?.IsAuthenticated == true ? GetUserId() : null,
            Status = "UNREAD",
            CreatedAt = DateTime.UtcNow
        };

        db.Inquiries.Add(inquiry);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetAll), new { id = inquiry.Id }, ToResponse(inquiry));
    }

    [HttpGet("my")]
    [Authorize]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    [ProducesResponseType(typeof(IReadOnlyList<UserInquiryResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<ActionResult<IReadOnlyList<UserInquiryResponseDto>>> GetMy(
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var userEmail = GetUserEmail()?.Trim().ToLowerInvariant();
        if (string.IsNullOrWhiteSpace(userId) && string.IsNullOrWhiteSpace(userEmail))
            return Unauthorized(new { message = "User identity not resolved." });

        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";
        var matchingInquiries = await db.Inquiries.AsNoTracking()
            .Where(inquiry =>
                (!string.IsNullOrWhiteSpace(userId) && inquiry.UserId == userId)
                || (!string.IsNullOrWhiteSpace(userEmail)
                    && inquiry.Email != null
                    && inquiry.Email.Trim().ToLower() == userEmail))
            .OrderByDescending(inquiry => inquiry.CreatedAt)
            .Select(inquiry => new
            {
                inquiry.Id,
                inquiry.Reason,
                inquiry.Message,
                inquiry.Status,
                inquiry.CreatedAt,
                inquiry.AdminResponse
            })
            .ToListAsync(cancellationToken);

        var inquiries = matchingInquiries.Select(inquiry => new UserInquiryResponseDto(
            inquiry.Id,
            inquiry.Reason,
            inquiry.Message,
            inquiry.Status,
            new DateTimeOffset(DateTime.SpecifyKind(inquiry.CreatedAt, DateTimeKind.Utc)),
            inquiry.AdminResponse)).ToList();

        return Ok(inquiries);
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<IReadOnlyList<InquiryResponseDto>>> GetAll(CancellationToken cancellationToken = default)
    {
        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";
        var inquiries = await db.Inquiries.AsNoTracking()
            .OrderByDescending(inquiry => inquiry.CreatedAt)
            .Select(inquiry => new InquiryResponseDto(
                inquiry.Id,
                inquiry.Name,
                inquiry.PhoneNumber,
                inquiry.Reason,
                inquiry.Message,
                inquiry.Status,
                inquiry.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(inquiries);
    }

    [HttpGet("metrics/open-count")]
    [Authorize(Roles = "Admin")]
    [ResponseCache(NoStore = true, Location = ResponseCacheLocation.None)]
    public async Task<ActionResult<object>> GetOpenCount(CancellationToken cancellationToken = default)
    {
        Response.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
        Response.Headers["Pragma"] = "no-cache";
        Response.Headers["Expires"] = "0";
        var count = await db.Inquiries.AsNoTracking().CountAsync(inquiry => inquiry.Status == "UNREAD", cancellationToken);
        return Ok(new { count });
    }

    [HttpPatch("{id:int}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<InquiryResponseDto>> UpdateStatus(
        int id,
        [FromBody] InquiryStatusRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var status = request.Status?.Trim().ToUpperInvariant();
        if (status is not ("UNREAD" or "RESOLVED"))
            return BadRequest(new { message = "Status must be UNREAD or RESOLVED." });

        var inquiry = await db.Inquiries.FindAsync([id], cancellationToken);
        if (inquiry is null)
            return NotFound();

        inquiry.Status = status;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ToResponse(inquiry));
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken = default)
    {
        var inquiry = await db.Inquiries.FindAsync([id], cancellationToken);
        if (inquiry is null)
            return NotFound();

        db.Inquiries.Remove(inquiry);
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static InquiryResponseDto ToResponse(Inquiry inquiry) => new(
        inquiry.Id,
        inquiry.Name,
        inquiry.PhoneNumber,
        inquiry.Reason,
        inquiry.Message,
        inquiry.Status,
        inquiry.CreatedAt);

    private string? GetUserId() =>
        User.FindFirstValue(ClaimTypes.NameIdentifier)
        ?? User.FindFirstValue("id")
        ?? User.FindFirstValue("sub");

    private string? GetUserEmail() =>
        User.FindFirstValue(ClaimTypes.Email)
        ?? User.FindFirstValue("email");
}
