using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Tripora.UserService.Controllers;
using Tripora.UserService.Data;
using Tripora.UserService.DTOs;
using Tripora.UserService.Repositories;
using Tripora.UserService.Services;
using Xunit;

namespace Tripora.UserService.Tests;

public class UserServiceRegistrationTests : IDisposable
{
    private readonly UserDbContext _dbContext;
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IValidationService _validationService;
    private readonly UserService.Services.UserService _userService;
    private readonly UsersController _controller;

    public UserServiceRegistrationTests()
    {
        var options = new DbContextOptionsBuilder<UserDbContext>()
            .UseInMemoryDatabase(databaseName: $"Tripora_Test_Db_{Guid.NewGuid()}")
            .Options;

        _dbContext = new UserDbContext(options);
        _dbContext.Database.EnsureCreated();

        _userRepository = new UserRepository(_dbContext);
        _passwordHasher = new BcryptPasswordHasher();
        _validationService = new ValidationService();
        var jwtOptions = Microsoft.Extensions.Options.Options.Create(new Configuration.JwtOptions
        {
            SecretKey = "Tripora_Test_Super_Secret_Jwt_Security_Key_2026_Secure_!",
            Issuer = "Tripora.UserService",
            Audience = "Tripora.Client",
            ExpiryMinutes = 60
        });
        var jwtTokenGenerator = new JwtTokenGenerator(jwtOptions);
        _userService = new UserService.Services.UserService(
            _userRepository,
            _passwordHasher,
            _validationService,
            jwtTokenGenerator,
            jwtOptions,
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

    #region Scenario 1 – Valid Registration

    [Fact]
    public async Task Scenario1_GivenValidRegistrationInformation_WhenCustomerSubmitsForm_ThenAccountCreatedSuccessfully()
    {
        // Arrange
        var request = new RegisterUserRequestDto
        {
            FullName = "Eleanor Vance",
            Email = "eleanor.vance@example.com",
            Password = "SecurePassword123!",
            ConfirmPassword = "SecurePassword123!"
        };

        // Act
        var result = await _userService.RegisterAsync(request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(RegistrationStatus.Success, result.Status);
        Assert.NotNull(result.User);
        Assert.Equal("Eleanor Vance", result.User.FullName);
        Assert.Equal("eleanor.vance@example.com", result.User.Email);

        // Verify persisted in database
        var savedUser = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email == "eleanor.vance@example.com");
        Assert.NotNull(savedUser);
        Assert.Equal("Eleanor Vance", savedUser.FullName);
    }

    #endregion

    #region Scenario 2 – Duplicate Email

    [Fact]
    public async Task Scenario2_GivenAccountAlreadyExistsWithEnteredEmail_WhenCustomerSubmitsForm_ThenAccountCreationPreventedAndErrorDisplayed()
    {
        // Arrange
        var initialRequest = new RegisterUserRequestDto
        {
            FullName = "First Traveler",
            Email = "duplicate.test@example.com",
            Password = "StrongPassword123!",
            ConfirmPassword = "StrongPassword123!"
        };
        var firstResult = await _userService.RegisterAsync(initialRequest);
        Assert.True(firstResult.IsSuccess);

        var duplicateRequest = new RegisterUserRequestDto
        {
            FullName = "Second Traveler",
            Email = "DUPLICATE.TEST@EXAMPLE.COM", // Case-insensitive duplicate
            Password = "AnotherPassword456!",
            ConfirmPassword = "AnotherPassword456!"
        };

        // Act
        var result = await _userService.RegisterAsync(duplicateRequest);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(RegistrationStatus.DuplicateEmail, result.Status);
        Assert.Null(result.User);
        Assert.Contains("already exists", result.Message, StringComparison.OrdinalIgnoreCase);

        // Verify only 1 account exists in database
        var totalUsers = await _dbContext.Users.CountAsync(u => u.Email == "duplicate.test@example.com");
        Assert.Equal(1, totalUsers);
    }

    #endregion

    #region Scenario 3 – Invalid Information

    [Theory]
    [InlineData("not-an-email")]
    [InlineData("plainaddress")]
    [InlineData("@missingusername.com")]
    [InlineData("missingdomain@.com")]
    public async Task Scenario3_GivenInvalidEmailFormat_WhenCustomerSubmitsForm_ThenRegistrationRejectedWithValidationError(string invalidEmail)
    {
        // Arrange
        var request = new RegisterUserRequestDto
        {
            FullName = "Valid Name",
            Email = invalidEmail,
            Password = "ValidPassword123!",
            ConfirmPassword = "ValidPassword123!"
        };

        // Act
        var result = await _userService.RegisterAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(RegistrationStatus.ValidationError, result.Status);
        Assert.Contains(result.Errors, e => e.Contains("Invalid email format", StringComparison.OrdinalIgnoreCase));
    }

    [Theory]
    [InlineData("short1!", "at least 8 characters")]             // < 8 characters
    [InlineData("lowercaseonly123!", "one uppercase letter")]   // No uppercase
    [InlineData("UPPERCASEONLY123!", "one lowercase letter")]   // No lowercase
    [InlineData("NoNumbersAtAll!", "one number")]               // No digit
    [InlineData("NoSpecialChar123", "one special character")]   // No special character
    public async Task Scenario3_GivenWeakPassword_WhenCustomerSubmitsForm_ThenRejectsAndDisplaysPasswordRequirements(
        string weakPassword, string expectedRequirement)
    {
        // Arrange
        var request = new RegisterUserRequestDto
        {
            FullName = "Traveler Jane",
            Email = "jane@example.com",
            Password = weakPassword,
            ConfirmPassword = weakPassword
        };

        // Act
        var result = await _userService.RegisterAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(RegistrationStatus.ValidationError, result.Status);
        Assert.Contains(result.Errors, e => e.Contains(expectedRequirement, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Scenario3_GivenMismatchedPasswords_WhenCustomerSubmitsForm_ThenRejectsWithAppropriateError()
    {
        // Arrange
        var request = new RegisterUserRequestDto
        {
            FullName = "Traveler Bob",
            Email = "bob@example.com",
            Password = "CorrectPassword123!",
            ConfirmPassword = "DifferentPassword123!"
        };

        // Act
        var result = await _userService.RegisterAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(RegistrationStatus.ValidationError, result.Status);
        Assert.Contains(result.Errors, e => e.Contains("Passwords do not match", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public async Task Scenario3_GivenMissingFullName_WhenCustomerSubmitsForm_ThenRejectsWithNameError()
    {
        // Arrange
        var request = new RegisterUserRequestDto
        {
            FullName = "",
            Email = "valid@example.com",
            Password = "ValidPassword123!",
            ConfirmPassword = "ValidPassword123!"
        };

        // Act
        var result = await _userService.RegisterAsync(request);

        // Assert
        Assert.False(result.IsSuccess);
        Assert.Equal(RegistrationStatus.ValidationError, result.Status);
        Assert.Contains(result.Errors, e => e.Contains("Full Name is required", StringComparison.OrdinalIgnoreCase));
    }

    #endregion

    #region Scenario 4 – Password Security

    [Fact]
    public async Task Scenario4_GivenCustomerEntersValidPassword_WhenAccountCreated_ThenPasswordSecurelyEncryptedBeforeStored()
    {
        // Arrange
        const string rawPassword = "UltraSecretPassword99!";
        var request = new RegisterUserRequestDto
        {
            FullName = "Security Conscious",
            Email = "security@tripora.com",
            Password = rawPassword,
            ConfirmPassword = rawPassword
        };

        // Act
        var result = await _userService.RegisterAsync(request);
        Assert.True(result.IsSuccess);

        // Assert
        var savedUser = await _dbContext.Users.FirstAsync(u => u.Email == "security@tripora.com");

        // 1. Plaintext password MUST NOT be stored
        Assert.NotEqual(rawPassword, savedUser.PasswordHash);
        Assert.DoesNotContain(rawPassword, savedUser.PasswordHash);

        // 2. Hash must be a valid salted BCrypt hash (starts with $2a$ or $2b$)
        Assert.StartsWith("$2", savedUser.PasswordHash);

        // 3. Hasher verifies the raw password against the encrypted hash
        Assert.True(_passwordHasher.VerifyPassword(rawPassword, savedUser.PasswordHash));

        // 4. Incorrect password fails verification
        Assert.False(_passwordHasher.VerifyPassword("WrongPassword123!", savedUser.PasswordHash));
    }

    #endregion

    #region Scenario 5 – Successful Registration

    [Fact]
    public async Task Scenario5_GivenAllRegistrationInformationIsValid_WhenSubmitted_ThenAccountStoredAndAppropriateSuccessResponseReturned()
    {
        // Arrange
        var request = new RegisterUserRequestDto
        {
            FullName = "Samantha Cruise",
            Email = "samantha.cruise@tripora.com",
            Password = "AdventureTime2026!",
            ConfirmPassword = "AdventureTime2026!"
        };

        // Act
        var result = await _userService.RegisterAsync(request);

        // Assert
        Assert.True(result.IsSuccess);
        Assert.Equal(RegistrationStatus.Success, result.Status);
        Assert.Equal("Customer account created successfully.", result.Message);
        Assert.Empty(result.Errors);

        Assert.NotNull(result.User);
        Assert.NotEqual(Guid.Empty, result.User.Id);
        Assert.Equal("Samantha Cruise", result.User.FullName);
        Assert.Equal("samantha.cruise@tripora.com", result.User.Email);
        Assert.Equal("Customer", result.User.Role);
        Assert.True(result.User.CreatedAt <= DateTime.UtcNow);

        // Check Controller Endpoint mapping
        var controllerResponse = await _controller.Register(request, CancellationToken.None);
        var conflictResponse = Assert.IsType<ConflictObjectResult>(controllerResponse);
        Assert.Equal(409, conflictResponse.StatusCode);
    }

    [Fact]
    public async Task Controller_WhenValidRegistrationSubmitted_Returns201CreatedWithApiResponse()
    {
        // Arrange
        var request = new RegisterUserRequestDto
        {
            FullName = "Lucas Skyline",
            Email = "lucas.skyline@tripora.com",
            Password = "VacationReady2026!",
            ConfirmPassword = "VacationReady2026!"
        };

        // Act
        var response = await _controller.Register(request, CancellationToken.None);

        // Assert
        var createdResult = Assert.IsType<ObjectResult>(response);
        Assert.Equal(201, createdResult.StatusCode);

        var apiResponse = Assert.IsType<ApiResponse<UserResponseDto>>(createdResult.Value);
        Assert.True(apiResponse.Success);
        Assert.NotNull(apiResponse.Data);
        Assert.Equal("Lucas Skyline", apiResponse.Data.FullName);
        Assert.Equal("lucas.skyline@tripora.com", apiResponse.Data.Email);
    }

    #endregion
}
