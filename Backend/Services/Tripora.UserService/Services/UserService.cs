using Microsoft.Extensions.Options;
using System.Security.Cryptography;
using System.Text;
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
    private readonly IEmailVerificationSender _emailVerificationSender;
    private readonly IClock _clock;
    private readonly ILogger<UserService> _logger;

    public UserService(
        IUserRepository userRepository,
        IPasswordHasher passwordHasher,
        IValidationService validationService,
        IJwtTokenGenerator jwtTokenGenerator,
        IOptions<JwtOptions> jwtOptions,
        IEmailVerificationSender emailVerificationSender,
        IClock clock,
        ILogger<UserService> logger)
    {
        _userRepository = userRepository;
        _passwordHasher = passwordHasher;
        _validationService = validationService;
        _jwtTokenGenerator = jwtTokenGenerator;
        _jwtOptions = jwtOptions.Value;
        _emailVerificationSender = emailVerificationSender;
        _clock = clock;
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
            var now = _clock.UtcNow;
            var verificationCode = GenerateVerificationCode();
            var user = new User
            {
                Id = Guid.NewGuid(),
                FullName = request.FullName.Trim(),
                Email = normalizedEmail,
                PasswordHash = passwordHash,
                Role = "Customer",
                CreatedAt = now,
                IsEmailVerified = false,
                VerificationTokenHash = HashVerificationCode(normalizedEmail, verificationCode),
                VerificationTokenExpiry = now.AddMinutes(10),
                VerificationTokenLastSentAt = now
            };

            // 5. Store user account in database
            var createdUser = await _userRepository.CreateAsync(user, cancellationToken);

            var expiresAtUtc = createdUser.VerificationTokenExpiry ?? now.AddMinutes(10);
            try
            {
                await _emailVerificationSender.SendVerificationCodeAsync(
                    createdUser.Email,
                    verificationCode,
                    expiresAtUtc,
                    cancellationToken);
            }
            catch (Exception ex)
            {
                createdUser.VerificationTokenLastSentAt = null;
                await _userRepository.UpdateAsync(createdUser, cancellationToken);
                _logger.LogError(ex, "Unable to deliver verification email for user ID {UserId}", createdUser.Id);
                return new RegistrationResult
                {
                    Status = RegistrationStatus.DeliveryFailure,
                    Message = "Your account was created, but we could not send a verification code. Please try resending it.",
                    User = ToUserResponse(createdUser),
                    Errors = new List<string> { "Verification email delivery failed." }
                };
            }

            _logger.LogInformation("Successfully registered new user with ID: {UserId}", createdUser.Id);

            return RegistrationResult.Succeeded(ToUserResponse(createdUser), "Customer account created successfully.");
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

            if (!user.IsEmailVerified)
            {
                return LoginResult.EmailNotVerified(user.Email);
            }

            // 4. Generate JWT authentication token (Scenario 1 & 3)
            var token = _jwtTokenGenerator.GenerateToken(user);

            var responseDto = new LoginResponseDto
            {
                Token = token,
                TokenType = "Bearer",
                ExpiresIn = _jwtOptions.ExpiryMinutes * 60,
                Email = user.Email,
                User = ToUserResponse(user)
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

    public async Task<EmailVerificationResult> VerifyEmailAsync(VerifyEmailRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Code) || request.Code.Trim().Length != 6 || !request.Code.Trim().All(char.IsDigit))
        {
            return EmailVerificationResult.Failed(EmailVerificationStatus.ValidationError, "Enter a valid email address and six-digit verification code.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (user is null)
        {
            return EmailVerificationResult.Failed(EmailVerificationStatus.InvalidCode, "The verification code is invalid or no longer available.");
        }

        if (user.IsEmailVerified)
        {
            return EmailVerificationResult.Failed(EmailVerificationStatus.AlreadyVerified, "This email address is already verified.");
        }

        if (string.IsNullOrWhiteSpace(user.VerificationTokenHash))
        {
            return EmailVerificationResult.Failed(EmailVerificationStatus.InvalidCode, "The verification code is invalid or no longer available.");
        }

        if (user.VerificationTokenExpiry is null || user.VerificationTokenExpiry <= _clock.UtcNow)
        {
            return EmailVerificationResult.Failed(EmailVerificationStatus.ExpiredCode, "This verification code has expired. Request a new code to continue.");
        }

        if (!VerificationCodesMatch(user.VerificationTokenHash, HashVerificationCode(normalizedEmail, request.Code.Trim())))
        {
            return EmailVerificationResult.Failed(EmailVerificationStatus.InvalidCode, "The verification code is invalid or no longer available.");
        }

        user.IsEmailVerified = true;
        user.VerificationTokenHash = null;
        user.VerificationTokenExpiry = null;
        user.VerificationTokenLastSentAt = null;
        await _userRepository.UpdateAsync(user, cancellationToken);
        return EmailVerificationResult.Succeeded(new EmailVerificationResponseDto
        {
            Email = user.Email,
            IsEmailVerified = true,
            Token = _jwtTokenGenerator.GenerateToken(user),
            TokenType = "Bearer",
            ExpiresIn = _jwtOptions.ExpiryMinutes * 60,
            User = ToUserResponse(user)
        }, "Email address verified successfully.");
    }

    public async Task<EmailVerificationResult> ResendVerificationAsync(ResendVerificationRequestDto request, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return EmailVerificationResult.Failed(EmailVerificationStatus.ValidationError, "Enter a valid email address.");
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _userRepository.GetByEmailAsync(normalizedEmail, cancellationToken);
        if (user is null || user.IsEmailVerified)
        {
            return EmailVerificationResult.Accepted();
        }

        var now = _clock.UtcNow;
        if (user.VerificationTokenLastSentAt is not null)
        {
            var elapsed = now - user.VerificationTokenLastSentAt.Value;
            if (elapsed < TimeSpan.FromSeconds(60))
            {
                var remaining = Math.Max(1, (int)Math.Ceiling((TimeSpan.FromSeconds(60) - elapsed).TotalSeconds));
                return EmailVerificationResult.Failed(EmailVerificationStatus.Cooldown, "Please wait before requesting another verification code.", remaining);
            }
        }

        var verificationCode = GenerateVerificationCode();
        user.VerificationTokenHash = HashVerificationCode(normalizedEmail, verificationCode);
        user.VerificationTokenExpiry = now.AddMinutes(10);
        user.VerificationTokenLastSentAt = now;
        await _userRepository.UpdateAsync(user, cancellationToken);

        try
        {
            await _emailVerificationSender.SendVerificationCodeAsync(normalizedEmail, verificationCode, user.VerificationTokenExpiry.Value, cancellationToken);
            return EmailVerificationResult.Accepted("A new verification code has been sent if this account requires one.");
        }
        catch (Exception ex)
        {
            user.VerificationTokenLastSentAt = null;
            await _userRepository.UpdateAsync(user, cancellationToken);
            _logger.LogError(ex, "Unable to resend verification email for user ID {UserId}", user.Id);
            return EmailVerificationResult.Failed(EmailVerificationStatus.DeliveryFailure, "We could not send a verification code. Please try again.");
        }
    }

    public async Task<UserResponseDto?> GetUserProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
        if (user == null)
        {
            return null;
        }

        return ToUserResponse(user);
    }

    private static UserResponseDto ToUserResponse(User user) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Email = user.Email,
        Role = user.Role,
        CreatedAt = user.CreatedAt,
        IsEmailVerified = user.IsEmailVerified
    };

    private static string GenerateVerificationCode() => RandomNumberGenerator.GetInt32(0, 1_000_000).ToString("D6");

    private static string HashVerificationCode(string normalizedEmail, string code)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes($"{normalizedEmail}:{code}"));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    private static bool VerificationCodesMatch(string storedHash, string suppliedHash)
    {
        try
        {
            return CryptographicOperations.FixedTimeEquals(Convert.FromHexString(storedHash), Convert.FromHexString(suppliedHash));
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
