using System.Security.Cryptography;
using System.Text;

namespace AcingIU.Identity.Api.Services;

public interface IMfaService
{
    string GenerateSecret();
    string BuildOtpAuthUri(string email, string secret, string issuer = "Acing IU");
    bool VerifyCode(string secret, string code, int window = 1);
}

/// <summary>
/// TOTP (RFC 6238) using HMAC-SHA1, 30s step, 6 digits.
/// Secret stored as Base32 (no padding) — matches authenticator apps.
/// </summary>
public sealed class TotpMfaService : IMfaService
{
    private static readonly char[] Base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".ToCharArray();

    public string GenerateSecret()
    {
        var bytes = RandomNumberGenerator.GetBytes(20); // 160-bit
        return ToBase32(bytes);
    }

    public string BuildOtpAuthUri(string email, string secret, string issuer = "Acing IU")
    {
        var label = Uri.EscapeDataString($"{issuer}:{email}");
        var iss = Uri.EscapeDataString(issuer);
        return $"otpauth://totp/{label}?secret={secret}&issuer={iss}&algorithm=SHA1&digits=6&period=30";
    }

    public bool VerifyCode(string secret, string code, int window = 1)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length != 6 || !code.All(char.IsDigit))
            return false;

        var key = FromBase32(secret);
        var timestep = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30;

        for (int i = -window; i <= window; i++)
        {
            var expected = ComputeTotp(key, timestep + i);
            if (CryptographicOperations.FixedTimeEquals(
                    Encoding.ASCII.GetBytes(expected),
                    Encoding.ASCII.GetBytes(code)))
                return true;
        }
        return false;
    }

    private static string ComputeTotp(byte[] key, long timestep)
    {
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

    private static string ToBase32(byte[] data)
    {
        var sb = new StringBuilder((data.Length * 8 + 4) / 5);
        int buffer = 0, bitsLeft = 0;
        foreach (var b in data)
        {
            buffer = (buffer << 8) | b;
            bitsLeft += 8;
            while (bitsLeft >= 5)
            {
                sb.Append(Base32Alphabet[(buffer >> (bitsLeft - 5)) & 0x1F]);
                bitsLeft -= 5;
            }
        }
        if (bitsLeft > 0)
            sb.Append(Base32Alphabet[(buffer << (5 - bitsLeft)) & 0x1F]);
        return sb.ToString();
    }

    private static byte[] FromBase32(string input)
    {
        var clean = input.Trim().TrimEnd('=').ToUpperInvariant();
        var output = new List<byte>();
        int buffer = 0, bitsLeft = 0;
        foreach (var c in clean)
        {
            int val = Array.IndexOf(Base32Alphabet, c);
            if (val < 0) throw new FormatException("Invalid Base32 character.");
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
