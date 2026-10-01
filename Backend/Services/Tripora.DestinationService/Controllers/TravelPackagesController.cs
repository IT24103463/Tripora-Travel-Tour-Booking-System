using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Controllers;

[ApiController]
[Route("api/packages")]
[Produces("application/json")]
public class TravelPackagesController(DestinationDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<TravelPackage>>> GetPackages(
        [FromQuery] int? guests,
        [FromQuery] string? packageType,
        CancellationToken cancellationToken)
    {
        if (guests is <= 0)
            return BadRequest(new { message = "Guest count must be greater than zero." });

        var query = db.TravelPackages.AsNoTracking().Where(p => p.IsActive);
        if (guests.HasValue)
            query = query.Where(p => p.MinGuests <= guests.Value && p.MaxGuests >= guests.Value);
        if (!string.IsNullOrWhiteSpace(packageType))
            query = query.Where(p => p.PackageType == packageType);

        return Ok(await query.OrderBy(p => p.PriceLKR).ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<TravelPackage>> GetPackage(Guid id, CancellationToken cancellationToken)
    {
        var package = await db.TravelPackages.AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id && p.IsActive, cancellationToken);
        return package is null ? NotFound() : Ok(package);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TravelPackage>> CreatePackage(
        [FromBody] TravelPackageRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidatePackage(request);
        if (validationError is not null)
            return BadRequest(new { message = validationError });

        var package = new TravelPackage();
        Apply(request, package);
        db.TravelPackages.Add(package);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetPackage), new { id = package.Id }, package);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<TravelPackage>> UpdatePackage(
        Guid id,
        [FromBody] TravelPackageRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidatePackage(request);
        if (validationError is not null)
            return BadRequest(new { message = validationError });

        var package = await db.TravelPackages.FindAsync([id], cancellationToken);
        if (package is null)
            return NotFound();

        Apply(request, package);
        package.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(package);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeletePackage(Guid id, CancellationToken cancellationToken)
    {
        var package = await db.TravelPackages.FindAsync([id], cancellationToken);
        if (package is null)
            return NotFound();

        package.IsActive = false;
        package.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static string? ValidatePackage(TravelPackageRequest request)
    {
        if (request.MinGuests > request.MaxGuests)
            return "Minimum guests cannot exceed maximum guests.";
        if (request.DurationNights >= request.DurationDays)
            return "Duration nights must be fewer than duration days.";
        return null;
    }

    private static void Apply(TravelPackageRequest request, TravelPackage package)
    {
        package.Name = request.Name.Trim();
        package.PackageType = request.PackageType;
        package.Description = request.Description.Trim();
        package.Destination = request.Destination.Trim();
        package.MinGuests = request.MinGuests;
        package.MaxGuests = request.MaxGuests;
        package.DurationDays = request.DurationDays;
        package.DurationNights = request.DurationNights;
        package.PriceLKR = request.PriceLKR;
        package.Inclusions = request.Inclusions;
        package.ImageUrl = request.ImageUrl.Trim();
        package.IsActive = request.IsActive;
    }
}
