using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Tripora.UserService.Configuration;
using Tripora.UserService.Controllers;
using Tripora.UserService.Data;
using Tripora.UserService.DTOs;
using Tripora.UserService.Repositories;
using Tripora.UserService.Services;

namespace Tripora.UserService.Tests;

public class EmailVerificationWorkflowTests : IDisposable
{
    private readonly UserDbContext _dbContext;
    private readonly CapturingEmailVerificationSender _emailSender = new();
    private readonly TestClock _clock = new(new DateTime(2026, 9, 28, 10, 0, 0, DateTimeKind.Utc));
    private readonly UserService.Services.UserService _service;
    private readonly UsersController _controller;

    public EmailVerificationWorkflowTests()
    {
        var options = new DbContextOptionsBuilder<UserDbContext>()
            .UseInMemoryDatabase($"Tripora_Email_Verification_{Guid.NewGuid()}")
            .Options;
        _dbContext = new UserDbContext(options);
        _dbContext.Database.EnsureCreated();

        _service = new UserService.Services.UserService(
            new UserRepository(_dbContext),
            new BcryptPasswordHasher(),
            new ValidationService(),
            new JwtTokenGenerator(),
            Options.Create(new JwtOptions
            {
                SecretKey = "Tripora_Test_Super_Secret_Jwt_Security_Key_2026_Secure_!",
                Issuer = "Tripora.UserService",
                Audience = "Tripora.Client",
                ExpiryMinutes = 60
            }),
            _emailSender,
            _clock,
            NullLogger<UserService.Services.UserService>.Instance);
        _controller = new UsersController(_service, new TestGoogleAuthenticationService(), NullLogger<UsersController>.Instance);
    }

    [Fact]
    public async Task RegisterThenVerify_WithDeliveredCode_VerifiesAccountAndClearsTokenMaterial()
    {
        var registration = await _service.RegisterAsync(new RegisterUserRequestDto
        {
            FullName = "OTP Traveler",
            Email = "otp.traveler@example.com",
            Password = "Verification123!",
            ConfirmPassword = "Verification123!"
        });

        var pendingUser = await _dbContext.Users.SingleAsync(user => user.Email == "otp.traveler@example.com");
        Assert.True(registration.IsSuccess);
        Assert.False(pendingUser.IsEmailVerified);
        Assert.NotNull(_emailSender.LastCode);
        Assert.NotEqual(_emailSender.LastCode, pendingUser.VerificationTokenHash);
        Assert.Equal(64, pendingUser.VerificationTokenHash!.Length);
        Assert.Equal(_clock.UtcNow.AddMinutes(10), pendingUser.VerificationTokenExpiry);

        var verification = await _service.VerifyEmailAsync(new VerifyEmailRequestDto
        {
            Email = "otp.traveler@example.com",
            Code = _emailSender.LastCode!
        });

        var verifiedUser = await _dbContext.Users.SingleAsync(user => user.Email == "otp.traveler@example.com");
        Assert.True(verification.IsSuccess);
        Assert.Equal(EmailVerificationStatus.Success, verification.Status);
        Assert.True(verifiedUser.IsEmailVerified);
        Assert.Null(verifiedUser.VerificationTokenHash);
        Assert.Null(verifiedUser.VerificationTokenExpiry);
        Assert.Null(verifiedUser.VerificationTokenLastSentAt);
    }

    [Fact]
    public async Task VerifyEmail_WithWrongCode_KeepsAccountUnverified()
    {
        await RegisterPendingUserAsync("wrong.code@example.com");

        var verification = await _service.VerifyEmailAsync(new VerifyEmailRequestDto
        {
            Email = "wrong.code@example.com",
            Code = "000000"
        });

        var user = await _dbContext.Users.SingleAsync(item => item.Email == "wrong.code@example.com");
        Assert.Equal(EmailVerificationStatus.InvalidCode, verification.Status);
        Assert.False(user.IsEmailVerified);
        Assert.NotNull(user.VerificationTokenHash);
    }

    [Fact]
    public async Task VerifyEmail_AfterTenMinutes_ReturnsExpiredCode()
    {
        await RegisterPendingUserAsync("expired.code@example.com");
        _clock.UtcNow = _clock.UtcNow.AddMinutes(11);

        var verification = await _service.VerifyEmailAsync(new VerifyEmailRequestDto
        {
            Email = "expired.code@example.com",
            Code = _emailSender.LastCode!
        });

        Assert.Equal(EmailVerificationStatus.ExpiredCode, verification.Status);
    }

    [Fact]
    public async Task VerifyEmail_AfterAccountIsAlreadyVerified_ReturnsAlreadyVerified()
    {
        await RegisterPendingUserAsync("already.verified@example.com");
        var request = new VerifyEmailRequestDto { Email = "already.verified@example.com", Code = _emailSender.LastCode! };
        await _service.VerifyEmailAsync(request);

        var secondAttempt = await _service.VerifyEmailAsync(request);

        Assert.Equal(EmailVerificationStatus.AlreadyVerified, secondAttempt.Status);
    }

    [Fact]
    public async Task ResendVerification_BeforeCooldownExpires_ReturnsRemainingSeconds()
    {
        await RegisterPendingUserAsync("cooldown@example.com");

        var result = await _service.ResendVerificationAsync(new ResendVerificationRequestDto
        {
            Email = "cooldown@example.com"
        });

        Assert.Equal(EmailVerificationStatus.Cooldown, result.Status);
        Assert.Equal(60, result.Data!.RetryAfterSeconds);
    }

    [Fact]
    public async Task Login_WithCorrectPasswordButUnverifiedEmail_DoesNotIssueToken()
    {
        await RegisterPendingUserAsync("unverified.login@example.com");

        var login = await _service.LoginAsync(new LoginRequestDto
        {
            Email = "unverified.login@example.com",
            Password = "Verification123!"
        });

        Assert.Equal(LoginStatus.EmailNotVerified, login.Status);
        Assert.Null(login.Data);
        Assert.Equal("unverified.login@example.com", login.Email);
    }

    [Fact]
    public async Task Register_WhenEmailDeliveryFails_LeavesAccountUnverifiedAndAllowsResend()
    {
        _emailSender.ShouldThrow = true;

        var registration = await RegisterPendingUserAsync("delivery.failure@example.com");

        var user = await _dbContext.Users.SingleAsync(item => item.Email == "delivery.failure@example.com");
        Assert.Equal(RegistrationStatus.DeliveryFailure, registration.Status);
        Assert.False(user.IsEmailVerified);
        Assert.Null(user.VerificationTokenLastSentAt);
    }

    [Fact]
    public async Task VerifyEmailEndpoint_WithCorrectCode_ReturnsVerifiedResponse()
    {
        await RegisterPendingUserAsync("controller.verify@example.com");

        var action = await _controller.VerifyEmail(new VerifyEmailRequestDto
        {
            Email = "controller.verify@example.com",
            Code = _emailSender.LastCode!
        }, CancellationToken.None);

        var ok = Assert.IsType<OkObjectResult>(action);
        var response = Assert.IsType<ApiResponse<EmailVerificationResponseDto>>(ok.Value);
        Assert.True(response.Success);
        Assert.True(response.Data!.IsEmailVerified);
        Assert.False(string.IsNullOrWhiteSpace(response.Data.Token));
        Assert.Equal("controller.verify@example.com", response.Data.User.Email);
    }

    [Fact]
    public async Task LoginEndpoint_WithUnverifiedAccount_ReturnsTheUnverifiedEmailContract()
    {
        await RegisterPendingUserAsync("controller.login@example.com");

        var action = await _controller.Login(new LoginRequestDto
        {
            Email = "controller.login@example.com",
            Password = "Verification123!"
        }, CancellationToken.None);

        var forbidden = Assert.IsType<ObjectResult>(action);
        Assert.Equal(403, forbidden.StatusCode);
        using var response = JsonDocument.Parse(JsonSerializer.Serialize(forbidden.Value));
        var body = response.RootElement;
        Assert.Equal("Please verify your email address before signing in.", body.GetProperty("message").GetString());
        Assert.True(body.GetProperty("isUnverified").GetBoolean());
        Assert.Equal("controller.login@example.com", body.GetProperty("email").GetString());
    }

    [Fact]
    public async Task ResendEndpoint_DuringCooldown_Returns429WithRetryAfterSeconds()
    {
        await RegisterPendingUserAsync("controller.resend@example.com");

        var action = await _controller.ResendVerification(new ResendVerificationRequestDto
        {
            Email = "controller.resend@example.com"
        }, CancellationToken.None);

        var throttled = Assert.IsType<ObjectResult>(action);
        Assert.Equal(429, throttled.StatusCode);
        var response = Assert.IsType<ApiResponse<EmailVerificationResponseDto>>(throttled.Value);
        Assert.Equal(60, response.Data!.RetryAfterSeconds);
    }

    private Task<RegistrationResult> RegisterPendingUserAsync(string email) =>
        _service.RegisterAsync(new RegisterUserRequestDto
        {
            FullName = "Verification Traveler",
            Email = email,
            Password = "Verification123!",
            ConfirmPassword = "Verification123!"
        });

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    private sealed class TestClock(DateTime now) : IClock
    {
        public DateTime UtcNow { get; set; } = now;
    }

    private sealed class CapturingEmailVerificationSender : IEmailVerificationSender
    {
        public string? LastCode { get; private set; }
        public bool ShouldThrow { get; set; }

        public Task SendVerificationCodeAsync(string recipientEmail, string verificationCode, DateTime expiresAtUtc, CancellationToken cancellationToken = default)
        {
            if (ShouldThrow)
            {
                throw new InvalidOperationException("Simulated SMTP failure.");
            }

            LastCode = verificationCode;
            return Task.CompletedTask;
        }
    }
}
