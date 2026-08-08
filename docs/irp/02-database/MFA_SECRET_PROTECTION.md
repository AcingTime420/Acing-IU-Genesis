# MFA secret (`mfa_secret_base32`) protection

## Requirement

TOTP seeds are equivalent to long-term credentials. **Plaintext storage is not an accepted production design.**

## Genesis baseline (current code)

- Column: `users.mfa_secret_base32 TEXT`
- Application currently stores the Base32 seed as provided at enroll time
- **Status:** Development / candidate only — must be upgraded before production traffic

## Required production approach

1. **Application-layer envelope encryption** before INSERT/UPDATE  
   - Data key per environment from KMS/HSM (or sealed vault secret)  
   - AES-256-GCM ciphertext + nonce stored in `mfa_secret_base32` (or rename column to `mfa_secret_ciphertext`)
2. Decrypt only inside Identity process memory at verify time  
3. Never log seed values; never return seed after enroll response is complete  
4. Prefer column rename migration when encryption lands (`003_mfa_ciphertext.sql`)

## Explicitly deferred

- Transparent Disk Encryption / cloud volume encryption is **necessary but not sufficient** alone  
- Database `pgcrypto` column encryption without keyed app access control is deferred  

## Tracking

- Implementation baseline: **Pending validation**  
- Follow-up story: “Encrypt MFA secrets at rest (Identity)” before production go-live  
