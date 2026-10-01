using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tripora.UserService.DTOs;
using Tripora.UserService.Services;

namespace Tripora.UserService.Controllers;

[ApiController]
[Route("api/users")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IGoogleAuthenticationService _googleAuthenticationService;
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, IGoogleAuthenticationService googleAuthenticationService, ILogger<UsersController> logger)
    {
        _userService = userService;
        _googleAuthenticationService = googleAuthenticationService;
        _logger = logger;
    }

    /// <summary>
    /// Registers a new customer user account.
    /// </summary>
    [HttpPost("register")]
    [ProducesResponseType(typeof(ApiResponse<UserResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<UserResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<UserResponseDto>), StatusCodes.Status409Conflict)]
    [ProducesResponseType(typeof(ApiResponse<UserResponseDto>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Register([FromBody] RegisterUserRequestDto request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received registration request for email: {Email}", request.Email);

        var result = await _userService.RegisterAsync(request, cancellationToken);

        return result.Status switch
        {
            RegistrationStatus.Success => StatusCode(
                StatusCodes.Status201Created,
                ApiResponse<UserResponseDto>.SuccessResponse(result.User!, result.Message)),

            RegistrationStatus.ValidationError => BadRequest(
                ApiResponse<UserResponseDto>.FailureResponse(result.Message, result.Errors)),

            RegistrationStatus.DuplicateEmail => Conflict(
                ApiResponse<UserResponseDto>.FailureResponse(result.Message, result.Errors)),

            RegistrationStatus.DeliveryFailure => StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                new ApiResponse<UserResponseDto>
                {
                    Success = false,
                    Message = result.Message,
                    Data = result.User,
                    Errors = result.Errors
                }),

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<UserResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    /// <summary>
    /// Authenticates a customer and generates a JWT bearer token.
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status500InternalServerError)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        _logger.LogInformation("Received login request for email: {Email}", request.Email);

        var result = await _userService.LoginAsync(request, cancellationToken);

        return result.Status switch
        {
            LoginStatus.Success => Ok(
                ApiResponse<LoginResponseDto>.SuccessResponse(result.Data!, result.Message)),

            LoginStatus.ValidationError => BadRequest(
                ApiResponse<LoginResponseDto>.FailureResponse(result.Message, result.Errors)),

            LoginStatus.AccountNotFound => Unauthorized(
                ApiResponse<LoginResponseDto>.FailureResponse(result.Message, result.Errors)),

            LoginStatus.InvalidPassword => Unauthorized(
                ApiResponse<LoginResponseDto>.FailureResponse(result.Message, result.Errors)),

            LoginStatus.EmailNotVerified => StatusCode(
                StatusCodes.Status403Forbidden,
                new
                {
                    message = result.Message,
                    isUnverified = true,
                    email = result.Email ?? string.Empty
                }),

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<LoginResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    /// <summary>
    /// Validates a Google ID token and signs in a verified Customer account.
    /// </summary>
    [HttpPost("google-login")]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _googleAuthenticationService.LoginAsync(request, cancellationToken);

        return result.Status switch
        {
            GoogleLoginStatus.Success => Ok(ApiResponse<LoginResponseDto>.SuccessResponse(result.Data!, result.Message)),
            GoogleLoginStatus.InvalidRequest => BadRequest(ApiResponse<LoginResponseDto>.FailureResponse(result.Message)),
            GoogleLoginStatus.InvalidToken => Unauthorized(ApiResponse<LoginResponseDto>.FailureResponse(result.Message)),
            GoogleLoginStatus.UnverifiedEmail or GoogleLoginStatus.CustomerOnly => StatusCode(StatusCodes.Status403Forbidden, ApiResponse<LoginResponseDto>.FailureResponse(result.Message)),
            GoogleLoginStatus.Unavailable => StatusCode(StatusCodes.Status503ServiceUnavailable, ApiResponse<LoginResponseDto>.FailureResponse(result.Message)),
            _ => StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<LoginResponseDto>.FailureResponse("Google sign-in is temporarily unavailable."))
        };
    }

    [HttpPost("verify-email")]
    [ProducesResponseType(typeof(ApiResponse<EmailVerificationResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<EmailVerificationResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<EmailVerificationResponseDto>), StatusCodes.Status410Gone)]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _userService.VerifyEmailAsync(request, cancellationToken);

        return result.Status switch
        {
            EmailVerificationStatus.Success => Ok(
                ApiResponse<EmailVerificationResponseDto>.SuccessResponse(result.Data!, result.Message)),

            EmailVerificationStatus.ExpiredCode => StatusCode(
                StatusCodes.Status410Gone,
                ApiResponse<EmailVerificationResponseDto>.FailureResponse(result.Message, result.Errors)),

            _ => BadRequest(
                ApiResponse<EmailVerificationResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    [HttpPost("resend-verification")]
    [ProducesResponseType(typeof(ApiResponse<EmailVerificationResponseDto>), StatusCodes.Status202Accepted)]
    [ProducesResponseType(typeof(ApiResponse<EmailVerificationResponseDto>), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiResponse<EmailVerificationResponseDto>), StatusCodes.Status429TooManyRequests)]
    [ProducesResponseType(typeof(ApiResponse<EmailVerificationResponseDto>), StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationRequestDto request, CancellationToken cancellationToken)
    {
        var result = await _userService.ResendVerificationAsync(request, cancellationToken);

        return result.Status switch
        {
            EmailVerificationStatus.Accepted => Accepted(
                ApiResponse<EmailVerificationResponseDto>.SuccessResponse(result.Data ?? new EmailVerificationResponseDto(), result.Message)),

            EmailVerificationStatus.Cooldown => StatusCode(
                StatusCodes.Status429TooManyRequests,
                new ApiResponse<EmailVerificationResponseDto>
                {
                    Success = false,
                    Message = result.Message,
                    Data = result.Data,
                    Errors = result.Errors
                }),

            EmailVerificationStatus.DeliveryFailure => StatusCode(
                StatusCodes.Status503ServiceUnavailable,
                ApiResponse<EmailVerificationResponseDto>.FailureResponse(result.Message, result.Errors)),

            _ => BadRequest(
                ApiResponse<EmailVerificationResponseDto>.FailureResponse(result.Message, result.Errors))
        };
    }

    /// <summary>
    /// Protected resource: Retrieves the authenticated customer's profile using JWT token.
    /// </summary>
    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<UserResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(ApiResponse<UserResponseDto>), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentUserProfile(CancellationToken cancellationToken)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<UserResponseDto>.FailureResponse("Invalid token claims. Access denied."));
        }

        var profile = await _userService.GetUserProfileAsync(userId, cancellationToken);
        if (profile == null)
        {
            return NotFound(ApiResponse<UserResponseDto>.FailureResponse("User account not found."));
        }

        return Ok(ApiResponse<UserResponseDto>.SuccessResponse(profile, "Customer profile retrieved successfully."));
    }
}
