using Tripora.UserService.DTOs;
using Tripora.UserService.Models;
using Tripora.UserService.Repositories;

namespace Tripora.UserService.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IValidationService _validationService;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IValidationService validationService,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _validationService = validationService;
        _logger = logger;
    }

    public async Task<RegistrationResult> RegisterAsync(RegisterUserRequestDto request, CancellationToken cancellationToken = default)
    {
        // 1. Validate the registration information (Scenario 3)
        var validationResult = _validationService.ValidateRegistration(request);
        if (!validationResult.IsValid)
        {
            _logger.LogWarning("Registration failed validation for email: {Email}. Errors: {Errors}",
                request.Email, string.Join("; ", validationResult.Errors));
            return RegistrationResult.ValidationFailed(validationResult.Errors);
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        // 2. Check for duplicate email (Scenario 2)
        var emailExists = await _userRepository.ExistsByEmailAsync(normalizedEmail, cancellationToken);
        if (emailExists)
        {
            _logger.LogWarning("Registration rejected: Duplicate email {Email}", normalizedEmail);
            return RegistrationResult.DuplicateEmail("An account with this email address already exists. Please sign in or use a different email.");
        }

        try
        {
            // 3. Securely encrypt password before storage (Scenario 4)
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

            // 5. Store user account in database (Scenario 1 & 5)
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
}
