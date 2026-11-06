using System.Text.RegularExpressions;

namespace AcingIU.Identity.Api.Options;

public sealed class MfaSecretProtectionOptions
{
    public const string SectionName = "Mfa:SecretProtection";

    private static readonly Regex KeyIdentifierPattern = new(
        "^[A-Za-z0-9._-]{1,64}$",
        RegexOptions.CultureInvariant | RegexOptions.Compiled);

    public string ActiveKeyId { get; set; } = string.Empty;

    public Dictionary<string, string> Keys { get; set; } = new(StringComparer.Ordinal);

    public static bool IsValid(MfaSecretProtectionOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.ActiveKeyId) ||
            !KeyIdentifierPattern.IsMatch(options.ActiveKeyId) ||
            options.Keys.Count == 0 ||
            !options.Keys.TryGetValue(options.ActiveKeyId, out _))
        {
            return false;
        }

        foreach (var (keyId, encodedKey) in options.Keys)
        {
            if (!KeyIdentifierPattern.IsMatch(keyId) || string.IsNullOrWhiteSpace(encodedKey))
                return false;

            try
            {
                if (Convert.FromBase64String(encodedKey).Length != 32)
                    return false;
            }
            catch (FormatException)
            {
                return false;
            }
        }

        return true;
    }
}
