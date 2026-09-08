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
    private readonly ILogger<UsersController> _logger;

    public UsersController(IUserService userService, ILogger<UsersController> logger)
    {
        _userService = userService;
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

            _ => StatusCode(
                StatusCodes.Status500InternalServerError,
                ApiResponse<LoginResponseDto>.FailureResponse(result.Message, result.Errors))
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
