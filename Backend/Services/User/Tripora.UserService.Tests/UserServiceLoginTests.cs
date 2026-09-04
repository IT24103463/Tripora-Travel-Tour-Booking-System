using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using Tripora.UserService.Configuration;
using Tripora.UserService.Controllers;
using Tripora.UserService.Data;
using Tripora.UserService.DTOs;
using Tripora.UserService.Models;
using Tripora.UserService.Repositories;
using Tripora.UserService.Services;
using Xunit;

namespace Tripora.UserService.Tests;

public class UserServiceLoginTests : IDisposable
{
    private readonly UserDbContext _dbContext;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IValidationService _validationService;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly IOptions<JwtOptions> _jwtOptions;
    private readonly UserService.Services.UserService _userService;
    private readonly UsersController _controller;

    private const string SecretKey = "Tripora_Test_Super_Secret_Jwt_Security_Key_2026_Secure_!";
    private const string Issuer = "Tripora.UserService";
    private const string Audience = "Tripora.Client";

    public UserServiceLoginTests()
    {
        var options = new DbContextOptionsBuilder<UserDbContext>()
            .UseInMemoryDatabase(databaseName: $"Tripora_Login_Test_Db_{Guid.NewGuid()}")
            .Options;

        _dbContext = new UserDbContext(options);
        _dbContext.Database.EnsureCreated();

        _userRepository = new UserRepository(_dbContext);
        _passwordHasher = new BcryptPasswordHasher();
        _validationService = new ValidationService();

        _jwtOptions = Options.Create(new JwtOptions
        {
            SecretKey = SecretKey,
            Issuer = Issuer,
            Audience = Audience,
            ExpiryMinutes = 60
        });

        _jwtTokenGenerator = new JwtTokenGenerator(_jwtOptions);

        _userService = new UserService.Services.UserService(
            _userRepository,
            _passwordHasher,
            _validationService,
            _jwtTokenGenerator,
            _jwtOptions,
            NullLogger<UserService.Services.UserService>.Instance);

        _controller = new UsersController(
            _userService,
            NullLogger<UsersController>.Instance);
    }

    public void Dispose()
    {
        _dbContext.Database.EnsureDeleted();
        _dbContext.Dispose();
    }

    private async Task<User> CreateRegisteredUserAsync(string email, string password, string fullName = "Registered Customer")
    {
        var user = new User
        {
            Id = Guid.NewGuid(),
            FullName = fullName,
            Email = email.Trim().ToLowerInvariant(),
            PasswordHash = _passwordHasher.HashPassword(password),
            Role = "Customer",
            CreatedAt = DateTime.UtcNow
        };
        return await _userRepository.CreateAsync(user);
    }

    #region Scenario 1 – Successful Login

    [Fact]
    public async Task Scenario1_GivenCustomerHasRegisteredAccount_WhenCustomerEntersValidCredentials_ThenAuthenticatesSuccessfully()
    {
        // Arrange
        await CreateRegisteredUserAsync("traveler@tripora.com", "Voyage@2026Secure", "Marco Polo");

        var loginRequest = new LoginRequestDto
        {
            Email = "traveler@tripora.com",
            Password = "Voyage@2026Secure"
        };

        // Act
        var result = await _userService.LoginAsync(loginRequest);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(LoginStatus.Success, result.Status);
        Assert.NotNull(result.Data);
        Assert.False(string.IsNullOrWhiteSpace(result.Data.Token));
        Assert.Equal("Marco Polo", result.Data.User.FullName);
        Assert.Equal("traveler@tripora.com", result.Data.User.Email);
        Assert.Equal("Customer", result.Data.User.Role);

        // Verify controller response
        var actionResult = await _controller.Login(loginRequest, CancellationToken.None);
        var okResult = Assert.IsType<OkObjectResult>(actionResult);
        var response = Assert.IsType<ApiResponse<LoginResponseDto>>(okResult.Value);
        Assert.True(response.Success);
        Assert.NotNull(response.Data);
    }

    #endregion

    #region Scenario 2 – Invalid Password

    [Fact]
    public async Task Scenario2_GivenCustomerEntersIncorrectPassword_WhenLoginRequestSubmitted_ThenAuthenticationFailsAndErrorDisplayed()
    {
        // Arrange
        await CreateRegisteredUserAsync("alice@tripora.com", "CorrectPassword123!");

        var loginRequest = new LoginRequestDto
        {
            Email = "alice@tripora.com",
            Password = "WrongPassword999!"
        };

        // Act
        var result = await _userService.LoginAsync(loginRequest);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(LoginStatus.InvalidPassword, result.Status);
        Assert.Null(result.Data);
        Assert.Contains("Incorrect password", result.Message);

        // Verify controller returns 401 Unauthorized
        var actionResult = await _controller.Login(loginRequest, CancellationToken.None);
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status401Unauthorized, unauthorizedResult.StatusCode);
    }

    [Fact]
    public async Task Scenario2_GivenAccountDoesNotExist_WhenLoginSubmitted_ThenReturnsAccountNotFound()
    {
        // Arrange
        var loginRequest = new LoginRequestDto
        {
            Email = "nonexistent@tripora.com",
            Password = "SomePassword123!"
        };

        // Act
        var result = await _userService.LoginAsync(loginRequest);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(LoginStatus.AccountNotFound, result.Status);
        Assert.Contains("No account found", result.Message);

        // Verify controller returns 401 Unauthorized
        var actionResult = await _controller.Login(loginRequest, CancellationToken.None);
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(actionResult);
        Assert.Equal(StatusCodes.Status401Unauthorized, unauthorizedResult.StatusCode);
    }

    #endregion

    #region Scenario 3 – JWT Token

    [Fact]
    public async Task Scenario3_GivenCustomerSuccessfullyLogsIn_WhenAuthenticationCompleted_ThenValidJwtTokenGenerated()
    {
        // Arrange
        var user = await CreateRegisteredUserAsync("token.tester@tripora.com", "Pass@123456", "Token Traveler");

        var loginRequest = new LoginRequestDto
        {
            Email = "token.tester@tripora.com",
            Password = "Pass@123456"
        };

        // Act
        var result = await _userService.LoginAsync(loginRequest);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.NotNull(result.Data);
        var tokenString = result.Data.Token;
        Assert.NotEmpty(tokenString);

        // Validate JWT token cryptographic structure and claims
        var tokenHandler = new JwtSecurityTokenHandler();
        var validationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(SecretKey)),
            ValidateIssuer = true,
            ValidIssuer = Issuer,
            ValidateAudience = true,
            ValidAudience = Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };

        var principal = tokenHandler.ValidateToken(tokenString, validationParameters, out var validatedToken);
        Assert.NotNull(principal);
        Assert.IsType<JwtSecurityToken>(validatedToken);

        // Verify embedded claims
        var subClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var emailClaim = principal.FindFirst(ClaimTypes.Email)?.Value;
        var roleClaim = principal.FindFirst(ClaimTypes.Role)?.Value;

        Assert.Equal(user.Id.ToString(), subClaim);
        Assert.Equal(user.Email, emailClaim);
        Assert.Equal("Customer", roleClaim);
    }

    #endregion

    #region Scenario 4 – Protected Resource

    [Fact]
    public async Task Scenario4_GivenCustomerHasValidJwtToken_WhenAccessingProtectedResource_ThenAccessGranted()
    {
        // Arrange: register customer and generate valid token
        var user = await CreateRegisteredUserAsync("authorized@tripora.com", "AuthPass@2026", "Grace Hopper");
        var token = _jwtTokenGenerator.GenerateToken(user);

        // Simulate Authenticated HTTP Context with ClaimsPrincipal from token
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role)
        };
        var identity = new ClaimsIdentity(claims, "TestAuth");
        var principal = new ClaimsPrincipal(identity);

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act: Access protected resource
        var response = await _controller.GetCurrentUserProfile(CancellationToken.None);

        // Assert: Access granted (200 OK)
        var okResult = Assert.IsType<OkObjectResult>(response);
        var apiResponse = Assert.IsType<ApiResponse<UserResponseDto>>(okResult.Value);
        Assert.True(apiResponse.Success);
        Assert.NotNull(apiResponse.Data);
        Assert.Equal(user.Id, apiResponse.Data.Id);
        Assert.Equal("Grace Hopper", apiResponse.Data.FullName);
        Assert.Equal("authorized@tripora.com", apiResponse.Data.Email);
    }

    #endregion

    #region Scenario 5 – Unauthorized Access

    [Fact]
    public async Task Scenario5_GivenCustomerDoesNotHaveValidAuthenticationToken_WhenAccessingProtectedResource_ThenAccessDenied()
    {
        // Arrange: Unauthenticated user context (empty claims)
        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = new ClaimsPrincipal(new ClaimsIdentity()) }
        };

        // Act: Access protected resource without token
        var response = await _controller.GetCurrentUserProfile(CancellationToken.None);

        // Assert: Access denied (401 Unauthorized)
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(response);
        Assert.Equal(StatusCodes.Status401Unauthorized, unauthorizedResult.StatusCode);
    }

    [Fact]
    public async Task Scenario5_GivenInvalidClaimsInToken_WhenAccessingProtectedResource_ThenAccessDenied()
    {
        // Arrange: Identity with invalid non-GUID subject claim
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, "not-a-valid-guid") };
        var principal = new ClaimsPrincipal(new ClaimsIdentity(claims, "TestAuth"));

        _controller.ControllerContext = new ControllerContext
        {
            HttpContext = new DefaultHttpContext { User = principal }
        };

        // Act
        var response = await _controller.GetCurrentUserProfile(CancellationToken.None);

        // Assert
        var unauthorizedResult = Assert.IsType<UnauthorizedObjectResult>(response);
        Assert.Equal(StatusCodes.Status401Unauthorized, unauthorizedResult.StatusCode);
    }

    #endregion
}
