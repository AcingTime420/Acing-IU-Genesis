using System.Security.Cryptography;
using Xunit;
using AcingIU.Identity.Api.Options;
using AcingIU.Identity.Api.Services;
using Microsoft.Extensions.Options;

namespace AcingIU.Identity.UnitTests;

public sealed class MfaSecretProtectorTests
{
    [Fact]
    public void ProtectThenUnprotect_RoundTripsWithoutExposingPlaintext()
    {
        var protector = CreateProtector("mfa-v1", ("mfa-v1", Key(1)));
        const string secret = "JBSWY3DPEHPK3PXP";

        var protectedSecret = protector.Protect(secret);

        Assert.True(protector.IsProtected(protectedSecret));
        Assert.DoesNotContain(secret, protectedSecret, StringComparison.Ordinal);
        Assert.Equal(secret, protector.Unprotect(protectedSecret));
    }

    [Fact]
    public void Protect_UsesFreshNonce_ForEachEncryption()
    {
        var protector = CreateProtector("mfa-v1", ("mfa-v1", Key(2)));

        var first = protector.Protect("JBSWY3DPEHPK3PXP");
        var second = protector.Protect("JBSWY3DPEHPK3PXP");

        Assert.NotEqual(first, second);
    }

    [Fact]
    public void Unprotect_RejectsTamperedCiphertext()
    {
        var protector = CreateProtector("mfa-v1", ("mfa-v1", Key(3)));
        var protectedSecret = protector.Protect("JBSWY3DPEHPK3PXP");
        var index = protectedSecret.Length / 2;
        var replacement = protectedSecret[index] == 'A' ? 'B' : 'A';
        var tampered = protectedSecret[..index] + replacement + protectedSecret[(index + 1)..];

        Assert.ThrowsAny<CryptographicException>(() => protector.Unprotect(tampered));
    }

    [Fact]
    public void Unprotect_UsesRetainedPreviousKeyAfterRotation()
    {
        var beforeRotation = CreateProtector("mfa-v1", ("mfa-v1", Key(4)));
        var protectedSecret = beforeRotation.Protect("JBSWY3DPEHPK3PXP");
        var afterRotation = CreateProtector(
            "mfa-v2",
            ("mfa-v1", Key(4)),
            ("mfa-v2", Key(5)));

        Assert.Equal("JBSWY3DPEHPK3PXP", afterRotation.Unprotect(protectedSecret));
    }

    [Fact]
    public void Constructor_RejectsInvalidActiveKeyConfiguration()
    {
        var options = Options.Create(new MfaSecretProtectionOptions
        {
            ActiveKeyId = "mfa-v1",
            Keys = new Dictionary<string, string>
            {
                ["mfa-v1"] = Convert.ToBase64String(new byte[31])
            }
        });

        Assert.Throws<OptionsValidationException>(() => new AesGcmMfaSecretProtector(options));
    }

    private static AesGcmMfaSecretProtector CreateProtector(string activeKeyId, params (string Id, string Value)[] keys)
    {
        var configuredKeys = keys.ToDictionary(pair => pair.Id, pair => pair.Value, StringComparer.Ordinal);
        return new AesGcmMfaSecretProtector(Options.Create(new MfaSecretProtectionOptions
        {
            ActiveKeyId = activeKeyId,
            Keys = configuredKeys
        }));
    }

    private static string Key(byte value) => Convert.ToBase64String(Enumerable.Repeat(value, 32).ToArray());
}
