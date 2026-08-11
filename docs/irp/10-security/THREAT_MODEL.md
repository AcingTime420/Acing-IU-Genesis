# Threat model — Genesis (STRIDE)

**Assets:** user credentials, JWT signing key, refresh tokens, device trust records, audit logs.

| Threat | Category | Mitigation |
|--------|----------|------------|
| Credential stuffing | Spoofing | Argon2id; future rate limits; MFA TOTP |
| Stolen access token | Spoofing | Short TTL; Redis jti blacklist on logout |
| Refresh token theft | Spoofing | HttpOnly cookie; rotation; family burn on reuse |
| JWT key leak | Elevation | Env-only secret; ≥32 chars; rotate via redeploy |
| Telemetry spoofing | Tampering | Auth required; future: hardware attestation ADR |
| SQLi | Tampering | Parameterized Npgsql only |
| Audit log wipe | Repudiation | DB credentials restricted; no app DELETE API on audit |
| Container escape | Elevation | Non-root where possible; minimal base images; Trivy CI |
| Secret in git | Info disclosure | TruffleHog CI; .gitignore; no real secrets in examples |
| Gateway misroute | Info disclosure | Explicit location blocks; default 404 problem+json |

**Trust boundaries:** Internet → Nginx → services → Postgres/Redis. Services trust JWT after signature + revocation check. Device Trust trusts Identity-issued JWT only (shared secret).

**Out of scope for Genesis threat model:** physical device lab attacks, firmware supply chain (S4).
