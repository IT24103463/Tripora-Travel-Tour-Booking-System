namespace Tripora.UserService.Services;

public interface IClock
{
    DateTime UtcNow { get; }
}
