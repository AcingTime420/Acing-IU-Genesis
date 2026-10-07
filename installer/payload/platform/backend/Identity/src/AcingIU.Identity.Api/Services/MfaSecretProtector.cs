using System.Security.Cryptography;
using System.Text;
using AcingIU.Identity.Api.Options;
using Microsoft.Extensions.Options;

namespace AcingIU.Identity.Api.Services;

public interface IMfaSecretProtector
{
    string Protect(string secret);
    string Unprotect(string protectedSecret);
    bool IsProtected(string value);
}

public sealed class AesGcmMfaSecretProtector : IMfaSecretProtector
{
    private const string Prefix = "mfa:v1:";
    private const byte FormatVersion = 1;
    private const int NonceSize = 12;
    private const int TagSize = 16;

    private readonly string _activeKeyId;
    private readonly IReadOnlyDictionary<string, byte[]> _keys;

    public AesGcmMfaSecretProtector(IOptions<MfaSecretProtectionOptions> options)
    {
        ArgumentNullException.ThrowIfNull(options);

        var configured = options.Value;
        if (!MfaSecretProtectionOptions.IsValid(configured))
        {
            throw new OptionsValidationException(
                MfaSecretProtectionOptions.SectionName,
                typeof(MfaSecretProtectionOptions),
                ["MFA secret protection requires a valid active key identifier and base64-encoded 32-byte key material."]);
        }

        _activeKeyId = configured.ActiveKeyId;
        _keys = configured.Keys.ToDictionary(
            pair => pair.Key,
            pair => Convert.FromBase64String(pair.Value),
            StringComparer.Ordinal);
    }

    public bool IsProtected(string value) =>
        !string.IsNullOrWhiteSpace(value) && value.StartsWith(Prefix, StringComparison.Ordinal);

    public string Protect(string secret)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(secret);

        var keyIdBytes = Encoding.UTF8.GetBytes(_activeKeyId);
        var plaintext = Encoding.UTF8.GetBytes(secret);
        var nonce = RandomNumberGenerator.GetBytes(NonceSize);
        var ciphertext = new byte[plaintext.Length];
        var tag = new byte[TagSize];

        try
        {
            using var aes = new AesGcm(_keys[_activeKeyId], TagSize);
            aes.Encrypt(nonce, plaintext, ciphertext, tag, BuildAssociatedData(_activeKeyId));

            var payload = new byte[1 + 1 + keyIdBytes.Length + NonceSize + TagSize + ciphertext.Length];
            payload[0] = FormatVersion;
            payload[1] = checked((byte)keyIdBytes.Length);
            Buffer.BlockCopy(keyIdBytes, 0, payload, 2, keyIdBytes.Length);
            Buffer.BlockCopy(nonce, 0, payload, 2 + keyIdBytes.Length, NonceSize);
            Buffer.BlockCopy(tag, 0, payload, 2 + keyIdBytes.Length + NonceSize, TagSize);
            Buffer.BlockCopy(ciphertext, 0, payload, 2 + keyIdBytes.Length + NonceSize + TagSize, ciphertext.Length);

            return Prefix + Convert.ToBase64String(payload);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(plaintext);
            CryptographicOperations.ZeroMemory(nonce);
            CryptographicOperations.ZeroMemory(ciphertext);
            CryptographicOperations.ZeroMemory(tag);
        }
    }

    public string Unprotect(string protectedSecret)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(protectedSecret);
        if (!IsProtected(protectedSecret))
            throw new CryptographicException("MFA secret does not use a supported protected format.");

        byte[] payload;
        try
        {
            payload = Convert.FromBase64String(protectedSecret[Prefix.Length..]);
        }
        catch (FormatException exception)
        {
            throw new CryptographicException("MFA secret payload is not valid base64.", exception);
        }

        if (payload.Length < 2 + NonceSize + TagSize + 1 || payload[0] != FormatVersion)
            throw new CryptographicException("MFA secret payload has an unsupported format.");

        var keyIdLength = payload[1];
        var minimumLength = 2 + keyIdLength + NonceSize + TagSize + 1;
        if (keyIdLength == 0 || payload.Length < minimumLength)
            throw new CryptographicException("MFA secret payload has an invalid key identifier.");

        var keyId = Encoding.UTF8.GetString(payload, 2, keyIdLength);
        if (!_keys.TryGetValue(keyId, out var key))
            throw new CryptographicException("MFA secret references an unavailable encryption key.");

        var nonceOffset = 2 + keyIdLength;
        var tagOffset = nonceOffset + NonceSize;
        var ciphertextOffset = tagOffset + TagSize;
        var ciphertextLength = payload.Length - ciphertextOffset;
        var nonce = payload.AsSpan(nonceOffset, NonceSize).ToArray();
        var tag = payload.AsSpan(tagOffset, TagSize).ToArray();
        var ciphertext = payload.AsSpan(ciphertextOffset, ciphertextLength).ToArray();
        var plaintext = new byte[ciphertextLength];

        try
        {
            using var aes = new AesGcm(key, TagSize);
            aes.Decrypt(nonce, ciphertext, tag, plaintext, BuildAssociatedData(keyId));
            return Encoding.UTF8.GetString(plaintext);
        }
        finally
        {
            CryptographicOperations.ZeroMemory(payload);
            CryptographicOperations.ZeroMemory(nonce);
            CryptographicOperations.ZeroMemory(tag);
            CryptographicOperations.ZeroMemory(ciphertext);
            CryptographicOperations.ZeroMemory(plaintext);
        }
    }

    private static byte[] BuildAssociatedData(string keyId) =>
        Encoding.UTF8.GetBytes($"acing-iu:mfa-secret:{FormatVersion}:{keyId}");
}
