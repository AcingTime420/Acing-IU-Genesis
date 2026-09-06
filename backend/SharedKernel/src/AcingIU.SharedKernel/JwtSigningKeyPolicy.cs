using System.Text.RegularExpressions;

namespace AcingIU.SharedKernel;

public static partial class JwtSigningKeyPolicy
{
    private static readonly string[] KnownPlaceholderKeys =
    [
        "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS",
        "replace_with_at_least_32_char_random_secret"
    ];

    public static void EnsureAllowed(string? signingKey, string? environmentName, string configurationPath = "Jwt:SigningKey")
    {
        if (string.IsNullOrWhiteSpace(signingKey))
            throw new InvalidOperationException($"{configurationPath} is required.");

        if (signingKey.Length < 32)
            throw new InvalidOperationException($"{configurationPath} must be at least 32 characters.");

        if (!IsDevelopment(environmentName) && IsPlaceholderOrDefault(signingKey))
        {
            throw new InvalidOperationException(
                $"{configurationPath} must be replaced with a non-placeholder secret outside Development.");
        }
    }

    public static bool IsDevelopment(string? environmentName) =>
        string.Equals(environmentName, "Development", StringComparison.OrdinalIgnoreCase);

    public static bool IsPlaceholderOrDefault(string signingKey)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(signingKey);

        if (KnownPlaceholderKeys.Contains(signingKey, StringComparer.Ordinal))
            return true;

        return PlaceholderPattern().IsMatch(signingKey);
    }

    [GeneratedRegex("(?:change[_-]?me|replace[_-]?with|placeholder)", RegexOptions.IgnoreCase | RegexOptions.CultureInvariant)]
    private static partial Regex PlaceholderPattern();
}
