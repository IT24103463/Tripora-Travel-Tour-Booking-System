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
            Reason = request.Reason.Trim(),
            Message = request.Message.Trim(),
            Status = "UNREAD",
            CreatedAt = DateTime.UtcNow
        };

        db.Inquiries.Add(inquiry);
        await db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetAll), new { id = inquiry.Id }, ToResponse(inquiry));
    }

    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<IReadOnlyList<InquiryResponseDto>>> GetAll(CancellationToken cancellationToken = default)
    {
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
}