using Tripora.UserService.Models;

namespace Tripora.UserService.Services;

public interface IJwtTokenGenerator
{
    string GenerateToken(User user);
}
