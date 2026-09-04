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
    /// <param name="request">The registration form payload.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Created user response, validation errors, or duplicate status.</returns>
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
}
