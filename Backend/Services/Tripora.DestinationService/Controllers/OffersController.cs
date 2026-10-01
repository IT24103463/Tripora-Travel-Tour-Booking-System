using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Models;

namespace Tripora.DestinationService.Controllers;

[ApiController]
[Route("api/offers")]
[Produces("application/json")]
public class OffersController(DestinationDbContext db) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<ActionResult<IReadOnlyList<Offer>>> GetOffers(
        [FromQuery] string? category,
        [FromQuery] bool includeUpcoming = false,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var query = db.Offers.AsNoTracking().Where(o => o.IsActive && o.EndDate >= now);
        if (!includeUpcoming)
            query = query.Where(o => o.StartDate <= now);
        if (!string.IsNullOrWhiteSpace(category))
            query = query.Where(o => o.Category == category);

        return Ok(await query.OrderBy(o => o.EndDate).ToListAsync(cancellationToken));
    }

    [HttpGet("{id:guid}")]
    [AllowAnonymous]
    public async Task<ActionResult<Offer>> GetOffer(Guid id, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var offer = await db.Offers.AsNoTracking()
            .FirstOrDefaultAsync(o => o.Id == id && o.IsActive && o.StartDate <= now && o.EndDate >= now, cancellationToken);
        return offer is null ? NotFound() : Ok(offer);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Offer>> CreateOffer([FromBody] OfferRequest request, CancellationToken cancellationToken)
    {
        var offer = new Offer();
        Apply(request, offer);
        db.Offers.Add(offer);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetOffer), new { id = offer.Id }, offer);
    }

    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult<Offer>> UpdateOffer(Guid id, [FromBody] OfferRequest request, CancellationToken cancellationToken)
    {
        var offer = await db.Offers.FindAsync([id], cancellationToken);
        if (offer is null)
            return NotFound();

        Apply(request, offer);
        await db.SaveChangesAsync(cancellationToken);
        return Ok(offer);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeactivateOffer(Guid id, CancellationToken cancellationToken)
    {
        var offer = await db.Offers.FindAsync([id], cancellationToken);
        if (offer is null)
            return NotFound();

        offer.IsActive = false;
        await db.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static void Apply(OfferRequest request, Offer offer)
    {
        offer.Title = request.Title.Trim();
        offer.Category = request.Category;
        offer.TargetId = request.TargetId;
        offer.DiscountPercentage = request.DiscountPercentage;
        offer.OriginalPriceLKR = request.OriginalPriceLKR;
        offer.OfferPriceLKR = request.OfferPriceLKR;
        offer.BadgeText = request.BadgeText.Trim();
        offer.ImageUrl = request.ImageUrl?.Trim();
        offer.SpecialInclusions = request.SpecialInclusions?.Trim();
        offer.StartDate = request.StartDate;
        offer.EndDate = request.EndDate;
        offer.IsActive = request.IsActive;
    }
}
