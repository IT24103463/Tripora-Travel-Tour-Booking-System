using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Tripora.UserService.Models;

namespace Tripora.UserService.Services;

public class JwtTokenGenerator : IJwtTokenGenerator
{
    public string GenerateToken(User user)
    {
        var tokenHandler = new JwtSecurityTokenHandler();

        // Read JWT settings from environment variables with fallback
        var secretKey = Environment.GetEnvironmentVariable("TRIPORA_JWT_SECRET");
        if (string.IsNullOrWhiteSpace(secretKey))
        {
            secretKey = "Tripora_Super_Secret_Jwt_Security_Key_2026_Secure_Travel_System_!";
        }

        var issuer = Environment.GetEnvironmentVariable("TRIPORA_JWT_ISSUER")
            ?? "Tripora.UserService";

        var audience = Environment.GetEnvironmentVariable("TRIPORA_JWT_AUDIENCE")
            ?? "Tripora.Client";

        var expiryMinutesString =
            Environment.GetEnvironmentVariable("TRIPORA_JWT_EXPIRY_MINUTES");

        var expiryMinutes = 120;

        if (int.TryParse(expiryMinutesString, out var configuredExpiry))
        {
            expiryMinutes = configuredExpiry;
        }

        if (string.IsNullOrWhiteSpace(secretKey))
        {
            throw new InvalidOperationException(
                "TRIPORA_JWT_SECRET is empty.");
        }

        var key = Encoding.UTF8.GetBytes(secretKey);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new(
                JwtRegisteredClaimNames.Iat,
                DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(),
                ClaimValueTypes.Integer64
            ),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Role, user.Role),
            new("role", user.Role),
            new("fullName", user.FullName)
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),

            Expires = DateTime.UtcNow.AddMinutes(expiryMinutes),

            Issuer = issuer,
            Audience = audience,

            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(key),
                SecurityAlgorithms.HmacSha256Signature
            )
        };

        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }
}