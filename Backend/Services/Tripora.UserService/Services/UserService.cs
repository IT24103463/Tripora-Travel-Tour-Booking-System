using Microsoft.Extensions.Options;
using Tripora.UserService.Configuration;
using Tripora.UserService.DTOs;
using Tripora.UserService.Models;
using Tripora.UserService.Repositories;

namespace Tripora.UserService.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IValidationService _validationService;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;
    private readonly JwtOptions _jwtOptions;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IValidationService validationService,
        IJwtTokenGenerator jwtTokenGenerator,
        IOptions<JwtOptions> jwtOptions,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _validationService = validationService;
        _jwtTokenGenerator = jwtTokenGenerator;
        _jwtOptions = jwtOptions.Value;
        _logger = logger;
    }

    public async Task<RegistrationResult> RegisterAsync(RegisterUserRequestDto request, CancellationToken cancellationToken = default)
    {
        // 1. Validate the registration information
        var validationResult = _validationService.ValidateRegistration(request);
        if (!validationResult.IsValid)
        {
            _logger.LogWarning("Registration failed validation for email: {Email}. Errors: {Errors}",
                request.Email, string.Join("; ", validationResult.Errors));
            return RegistrationResult.ValidationFailed(validationResult.Errors);
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // 2. Check for duplicate email
        var emailExists = await _userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken);
        if (emailExists)
        {
            _logger.LogWarning("Registration rejected: Duplicate email {Email}", normalizedEmail);
            return RegistrationResult.DuplicateEmail("An account with this email address already exists. Please sign in or use a different email.");
        }

        try
        {
            // 3. Securely encrypt password before storage
            var passwordHash = _passwordHasher.HashPassword(request.Password);

            // 4. Create customer user entity
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName.Trim(),
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                Role = "Customer",
                CreatedAt = DateTime.UtcNow
            };

            // 5. Store user account in database
            var createdUser = await _userRepository.CreateAsync(user, cancellationToken);

            _logger.LogInformation("Successfully registered new user with ID: {UserId}, Email: {Email}",
                createdUser.Id, createdUser.Email);

            var userResponse = new UserResponseDto
            {
                Id = createdUser.Id,
                FullName = createdUser.FullName,
                Email = createdUser.Email,
                Role = createdUser.Role,
                CreatedAt = createdUser.CreatedAt
            };

            return RegistrationResult.Succeeded(userResponse, "Customer account created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error creating user account for email: {Email}", normalizedEmail);
            return RegistrationResult.Failed("Account creation failed. Please try again.");
        }
    }

    public async Task<LoginResult> LoginAsync(LoginRequestDto request, CancellationToken cancellationToken = default)
    {
        // 1. Validate provided credentials
        var validationResult = _validationService.ValidateLogin(request);
        if (!validationResult.IsValid)
        {
            _logger.LogWarning("Login request failed validation for email: {Email}", request.Email);
            return LoginResult.ValidationFailed(validationResult.Errors);
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        try
        {
            // 2. Look up customer account
            var user = await _userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
            if (user == null)
            {
                _logger.LogWarning("Login rejected: Account not found for email {Email}", normalizedEmail);
                return LoginResult.AccountNotFound("No account found with this email address. Please check your email or create an account.");
            }

            // 3. Verify password (Scenario 2: Invalid password check)
            var isPasswordValid = _passwordHasher.VerifyPassword(request.Password, user.PasswordHash);
            if (!isPasswordValid)
            {
                _logger.LogWarning("Login rejected: Incorrect password for email {Email}", normalizedEmail);
                return LoginResult.InvalidPassword("Incorrect password. Please verify your password and try again.");
            }

            // 4. Generate JWT authentication token (Scenario 1 & 3)
            var token = _jwtTokenGenerator.GenerateToken(user);

            var responseDto = new LoginResponseDto
            {
                Token = token,
                TokenType = "Bearer",
                ExpiresIn = _jwtOptions.ExpiryMinutes * 60,
                User = new UserResponseDto
                {
                    Id = user.Id,
                    FullName = user.FullName,
                    Email = user.Email,
                    Role = user.Role,
                    CreatedAt = user.CreatedAt
                }
            };

            _logger.LogInformation("Customer logged in successfully: {UserId}, Email: {Email}", user.Id, user.Email);
            return LoginResult.Succeeded(responseDto, "Authentication successful. Welcome to Tripora.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Authentication service error for email: {Email}", normalizedEmail);
            return LoginResult.Failed("Authentication service temporarily unavailable. Please try again.");
        }
    }

    public async Task<UserResponseDto?> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return null;
        }

        return new UserResponseDto
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            CreatedAt = user.CreatedAt
        };
    }
}
