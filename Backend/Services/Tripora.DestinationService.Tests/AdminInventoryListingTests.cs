using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Controllers;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.Models;
using Xunit;

namespace Tripora.DestinationService.Tests;

public class AdminInventoryListingTests : IDisposable
{
    private readonly DestinationDbContext _db;

    public AdminInventoryListingTests()
    {
        _db = new DestinationDbContext(new DbContextOptionsBuilder<DestinationDbContext>()
            .UseInMemoryDatabase($"AdminInventory_{Guid.NewGuid()}")
            .Options);
        _db.Database.EnsureCreated();
    }

    [Fact]
    public async Task AdminOfferList_IncludesInactiveOffers()
    {
        _db.Offers.AddRange(new Offer { Title = "Active", IsActive = true, EndDate = DateTime.UtcNow.AddDays(1) }, new Offer { Title = "Inactive", IsActive = false, EndDate = DateTime.UtcNow.AddDays(1) });
        await _db.SaveChangesAsync();

        var result = await new OffersController(_db).GetAdminOffers(default);

        var offers = Assert.IsAssignableFrom<IReadOnlyList<Offer>>(Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Contains(offers, offer => offer.Title == "Inactive" && !offer.IsActive);
    }

    [Fact]
    public async Task AdminPackageList_IncludesInactivePackages()
    {
        _db.TravelPackages.AddRange(new TravelPackage { Name = "Active", IsActive = true }, new TravelPackage { Name = "Inactive", IsActive = false });
        await _db.SaveChangesAsync();

        var result = await new TravelPackagesController(_db).GetAdminPackages(default);

        var packages = Assert.IsAssignableFrom<IReadOnlyList<TravelPackage>>(Assert.IsType<OkObjectResult>(result.Result).Value);
        Assert.Contains(packages, package => package.Name == "Inactive" && !package.IsActive);
    }

    public void Dispose() => _db.Dispose();
}
