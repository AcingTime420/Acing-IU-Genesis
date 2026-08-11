using System.Security.Cryptography;
using System.Text;
using AcingIU.Identity.Api.Services;
using Xunit;

namespace AcingIU.Identity.UnitTests;

public class TotpMfaServiceTests
{
    private readonly TotpMfaService _mfa = new();

    [Fact]
    public void GenerateSecret_returns_non_empty_base32()
    {
        var secret = _mfa.GenerateSecret();
        Assert.False(string.IsNullOrWhiteSpace(secret));
        Assert.Matches("^[A-Z2-7]+$", secret);
    }

    [Fact]
    public void BuildOtpAuthUri_contains_secret_and_issuer()
    {
        var secret = _mfa.GenerateSecret();
        var uri = _mfa.BuildOtpAuthUri("user@acing.iu", secret);
        Assert.StartsWith("otpauth://totp/", uri);
        Assert.Contains(secret, uri);
        Assert.Contains("issuer=", uri);
    }

    [Fact]
    public void VerifyCode_rejects_empty_and_wrong_length()
    {
        var secret = _mfa.GenerateSecret();
        Assert.False(_mfa.VerifyCode(secret, ""));
        Assert.False(_mfa.VerifyCode(secret, "12345"));
        Assert.False(_mfa.VerifyCode(secret, "abcdef"));
    }

    [Fact]
    public void VerifyCode_accepts_code_for_current_timestep()
    {
        var secret = _mfa.GenerateSecret();
        var code = ComputeTotp(secret, DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30);
        Assert.True(_mfa.VerifyCode(secret, code));
    }

    [Fact]
    public void VerifyCode_rejects_unrelated_code()
    {
        var secret = _mfa.GenerateSecret();
        Assert.False(_mfa.VerifyCode(secret, "000000"));
    }

    private static string ComputeTotp(string base32Secret, long timestep)
    {
        var key = FromBase32(base32Secret);
        var counter = BitConverter.GetBytes(timestep);
        if (BitConverter.IsLittleEndian) Array.Reverse(counter);
        using var hmac = new HMACSHA1(key);
        var hash = hmac.ComputeHash(counter);
        int offset = hash[^1] & 0x0F;
        int binary =
            ((hash[offset] & 0x7F) << 24) |
            ((hash[offset + 1] & 0xFF) << 16) |
            ((hash[offset + 2] & 0xFF) << 8) |
            (hash[offset + 3] & 0xFF);
        return (binary % 1_000_000).ToString("D6");
    }

    private static byte[] FromBase32(string input)
    {
        const string alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        var clean = input.Trim().TrimEnd('=').ToUpperInvariant();
        var output = new List<byte>();
        int buffer = 0, bitsLeft = 0;
        foreach (var c in clean)
        {
            int val = alphabet.IndexOf(c);
            if (val < 0) throw new FormatException();
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8)
            {
                output.Add((byte)((buffer >> (bitsLeft - 8)) & 0xFF));
                bitsLeft -= 8;
            }
        }
        return output.ToArray();
    }
}
