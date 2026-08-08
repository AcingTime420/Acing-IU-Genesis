using System.Security.Cryptography;
using System.Text;
using Konscious.Security.Cryptography;

namespace AcingIU.Identity.Api.Services;

public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string encodedHash);
}

/// <summary>
/// Argon2id password hashing (OWASP recommended).
/// Stored format: argon2id$v=19$m={mem},t={iter},p={par}${saltB64}${hashB64}
/// </summary>
public sealed class Argon2idPasswordHasher : IPasswordHasher
{
    private const int SaltSize = 16;
    private const int HashSize = 32;
    private const int DegreeOfParallelism = 4;
    private const int MemorySizeKb = 65536; // 64 MB
    private const int Iterations = 3;

    public string Hash(string password)
    {
        var salt = RandomNumberGenerator.GetBytes(SaltSize);
        var hash = Compute(password, salt);
        return $"argon2id$v=19$m={MemorySizeKb},t={Iterations},p={DegreeOfParallelism}${Convert.ToBase64String(salt)}${Convert.ToBase64String(hash)}";
    }

    public bool Verify(string password, string encodedHash)
    {
        try
        {
            var parts = encodedHash.Split('$', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length != 5 || parts[0] != "argon2id") return false;

            var salt = Convert.FromBase64String(parts[3]);
            var expected = Convert.FromBase64String(parts[4]);
            var actual = Compute(password, salt);
            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch
        {
            return false;
        }
    }

    private static byte[] Compute(string password, byte[] salt)
    {
        using var argon = new Argon2id(Encoding.UTF8.GetBytes(password))
        {
            Salt = salt,
            DegreeOfParallelism = DegreeOfParallelism,
            MemorySize = MemorySizeKb,
            Iterations = Iterations
        };
        return argon.GetBytes(HashSize);
    }
}
