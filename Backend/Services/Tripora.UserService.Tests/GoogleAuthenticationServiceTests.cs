using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Tripora.UserService.Configuration;
using Tripora.UserService.Data;
using Tripora.UserService.DTOs;
using Tripora.UserService.Models;
using Tripora.UserService.Repositories;
using Tripora.UserService.Services;

namespace Tripora.UserService.Tests;

public sealed class GoogleAuthenticationServiceTests : IDisposable
{
    private readonly UserDbContext _dbContext;
    private readonly IUserRepository _users;
    private readonly IPasswordHasher _passwordHasher = new BcryptPasswordHasher();

    public GoogleAuthenticationServiceTests()
    {
        _dbContext = new UserDbContext(new DbContextOptionsBuilder<UserDbContext>()
            .UseInMemoryDatabase($"Tripora_Google_Login_Test_Db_{Guid.NewGuid()}")
            .Options);
        _dbContext.Database.EnsureCreated();
        _users = new UserRepository(_dbContext);
    }

    [Fact]
    public async Task LoginAsync_WithVerifiedGoogleCustomer_ProvisionCustomerAndReturnsTriporaJwt()
    {
        var service = CreateService(new GoogleIdentity(" Traveler@Example.com ", "Ada Traveler", true));

        var result = await service.LoginAsync(new GoogleLoginRequestDto { IdToken = "valid-google-token" });

        Assert.Equal(GoogleLoginStatus.Success, result.Status);
        Assert.NotNull(result.Data);
        Assert.Equal("traveler@example.com", result.Data.User.Email);
        Assert.Equal("Customer", result.Data.User.Role);
        Assert.True(result.Data.User.IsEmailVerified);
        Assert.False(string.IsNullOrWhiteSpace(result.Data.Token));
        var storedUser = await _users.GetByEmailAsync("traveler@example.com");
        Assert.NotNull(storedUser);
        Assert.False(_passwordHasher.VerifyPassword("valid-google-token", storedUser.PasswordHash));
    }

    [Fact]
    public async Task LoginAsync_WithUnverifiedGoogleEmail_RejectsBeforeProvisioning()
    {
        var service = CreateService(new GoogleIdentity("traveler@example.com", "Ada Traveler", false));

        var result = await service.LoginAsync(new GoogleLoginRequestDto { IdToken = "unverified-token" });

        Assert.Equal(GoogleLoginStatus.UnverifiedEmail, result.Status);
        Assert.Null(await _users.GetByEmailAsync("traveler@example.com"));
    }

    [Fact]
    public async Task LoginAsync_WithExistingUnverifiedCustomer_UpgradesEmailVerification()
    {
        var existing = await _users.CreateAsync(new User
        {
            Id = Guid.NewGuid(),
            FullName = "Existing Customer",
            Email = "traveler@example.com",
            PasswordHash = _passwordHasher.HashPassword("existing-password"),
            Role = "Customer",
            IsEmailVerified = false,
            VerificationTokenHash = "pending-token",
            VerificationTokenExpiry = DateTime.UtcNow.AddMinutes(15),
            CreatedAt = DateTime.UtcNow.AddDays(-1)
        });
        var service = CreateService(new GoogleIdentity(existing.Email, "Updated Name Is Ignored", true));

        var result = await service.LoginAsync(new GoogleLoginRequestDto { IdToken = "verified-token" });

        Assert.Equal(GoogleLoginStatus.Success, result.Status);
        var upgraded = await _users.GetByEmailAsync(existing.Email);
        Assert.NotNull(upgraded);
        Assert.True(upgraded.IsEmailVerified);
        Assert.Null(upgraded.VerificationTokenHash);
        Assert.Null(upgraded.VerificationTokenExpiry);
        Assert.Equal("Existing Customer", upgraded.FullName);
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    private GoogleAuthenticationService CreateService(GoogleIdentity identity) => new(
        _users,
        _passwordHasher,
        new JwtTokenGenerator(),
        new StaticGoogleIdTokenValidator(identity),
        Options.Create(new JwtOptions
        {
            SecretKey = "Tripora_Test_Super_Secret_Jwt_Security_Key_2026_Secure_!",
            Issuer = "Tripora.UserService",
            Audience = "Tripora.Client",
            ExpiryMinutes = 60
        }),
        new SystemClock(),
        NullLogger<GoogleAuthenticationService>.Instance);

    private sealed class StaticGoogleIdTokenValidator(GoogleIdentity identity) : IGoogleIdTokenValidator
    {
        public Task<GoogleIdentity> ValidateAsync(string idToken, CancellationToken cancellationToken = default) => Task.FromResult(identity);
    }
}
