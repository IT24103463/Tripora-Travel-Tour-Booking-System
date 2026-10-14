using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.EntityFrameworkCore;
using Tripora.DestinationService.Controllers;
using Tripora.DestinationService.Data;
using Tripora.DestinationService.DTOs;
using Tripora.DestinationService.Models;
using Xunit;

namespace Tripora.DestinationService.Tests;

public sealed class MyInquiriesControllerTests
{
    [Fact]
    public async Task GetMy_ReturnsOnlyAuthenticatedUsersInquiriesNewestFirst()
    {
        var options = new DbContextOptionsBuilder<DestinationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new DestinationDbContext(options);
        var older = new Inquiry
        {
            Name = "Traveler",
            PhoneNumber = "+9411222333",
            Email = "someone-else@example.com",
            Reason = "Tour",
            Message = "Older inquiry",
            UserId = "member-1",
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        };
        var newer = new Inquiry
        {
            Name = "Traveler",
            PhoneNumber = "+9411222333",
            Email = "traveler@example.com",
            Reason = "Hotel",
            Message = "Newer inquiry",
            AdminResponse = "We are checking availability.",
            UserId = "member-1",
            CreatedAt = DateTime.UtcNow
        };
        db.Inquiries.AddRange(older, newer, new Inquiry
        {
            Name = "Another traveler",
            PhoneNumber = "+9411999888",
            Email = "someone-else@example.com",
            Reason = "Tour",
            Message = "Private inquiry",
            UserId = "member-2",
            CreatedAt = DateTime.UtcNow.AddMinutes(1)
        }, new Inquiry
        {
            Name = "Traveler",
            PhoneNumber = "+9411222333",
            Email = "traveler@example.com",
            Reason = "Legacy tour",
            Message = "Legacy email-matched inquiry",
            UserId = "old-member-id",
            CreatedAt = DateTime.UtcNow.AddHours(-1)
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db,
            new Claim(ClaimTypes.NameIdentifier, "member-1"),
            new Claim(ClaimTypes.Email, "traveler@example.com"));
        var result = await controller.GetMy();
        var response = Assert.IsType<OkObjectResult>(result.Result);
        var inquiries = Assert.IsAssignableFrom<IReadOnlyList<UserInquiryResponseDto>>(response.Value);

        Assert.Equal(3, inquiries.Count);
        Assert.Equal("Newer inquiry", inquiries[0].Message);
        Assert.Equal("Hotel", inquiries[0].Subject);
        Assert.Equal("We are checking availability.", inquiries[0].AdminResponse);
        Assert.Equal("Legacy email-matched inquiry", inquiries[1].Message);
        Assert.Equal("Older inquiry", inquiries[2].Message);
    }

    [Fact]
    public async Task GetMy_FindsLegacyInquiriesWhenOnlyEmailClaimIsPresent()
    {
        var options = new DbContextOptionsBuilder<DestinationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new DestinationDbContext(options);
        db.Inquiries.Add(new Inquiry
        {
            Name = "Traveler",
            PhoneNumber = "+9411222333",
            Email = "traveler@example.com",
            Reason = "Tour",
            Message = "Email-only match",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var controller = CreateController(db, new Claim(ClaimTypes.Email, "traveler@example.com"));
        var result = await controller.GetMy();
        var response = Assert.IsType<OkObjectResult>(result.Result);
        var inquiries = Assert.IsAssignableFrom<IReadOnlyList<UserInquiryResponseDto>>(response.Value);

        Assert.Single(inquiries);
        Assert.Equal("Email-only match", inquiries[0].Message);
    }

    [Fact]
    public async Task Create_AssociatesInquiryWithAuthenticatedUser()
    {
        var options = new DbContextOptionsBuilder<DestinationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new DestinationDbContext(options);
        var controller = CreateController(db,
            new Claim(ClaimTypes.NameIdentifier, "member-1"),
            new Claim(ClaimTypes.Email, "traveler@example.com"));

        await controller.Create(new InquiryRequestDto
        {
            Name = "Traveler",
            PhoneNumber = "+9411222333",
            Reason = "Tour",
            Message = "Please help with a trip."
        });

        var inquiry = await db.Inquiries.SingleAsync();
        Assert.Equal("member-1", inquiry.UserId);
        Assert.Equal("traveler@example.com", inquiry.Email);
    }

    private static InquiriesController CreateController(DestinationDbContext db, params Claim[] claims)
    {
        var controller = new InquiriesController(db);
        controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext
            {
                User = new ClaimsPrincipal(new ClaimsIdentity(claims, "test"))
            }
        };
        return controller;
    }
}
