using MimeKit;
using Tripora.UserService.Services;

namespace Tripora.UserService.Tests;

public class GmailEmailVerificationSenderTests
{
    [Fact]
    public void BuildVerificationMessage_ProvidesPlainTextAndHtmlAlternatives()
    {
        var message = GmailEmailVerificationSender.BuildVerificationMessage(
            "Tripora",
            "sender@tripora.example",
            "traveler@example.com",
            "123456",
            new DateTime(2026, 9, 28, 10, 10, 0, DateTimeKind.Utc));

        var alternatives = Assert.IsType<MultipartAlternative>(message.Body);
        var plainText = Assert.IsType<TextPart>(alternatives[0]);
        var html = Assert.IsType<TextPart>(alternatives[1]);

        Assert.Equal("plain", plainText.ContentType.MediaSubtype);
        Assert.Contains("123456", plainText.Text);
        Assert.Equal("html", html.ContentType.MediaSubtype);
        Assert.Contains("123456", html.Text);
    }
}
