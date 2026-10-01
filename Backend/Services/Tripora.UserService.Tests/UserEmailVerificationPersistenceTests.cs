using Tripora.UserService.Models;

namespace Tripora.UserService.Tests;

public class UserEmailVerificationPersistenceTests
{
    [Fact]
    public void NewUser_IsUnverifiedAndHasNoVerificationMaterial()
    {
        var user = new User();

        Assert.False(user.IsEmailVerified);
        Assert.Null(user.VerificationTokenHash);
        Assert.Null(user.VerificationTokenExpiry);
        Assert.Null(user.VerificationTokenLastSentAt);
    }
}
