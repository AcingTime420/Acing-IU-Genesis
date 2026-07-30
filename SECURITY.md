# Security Policy — Acing IU: Genesis

> **Feature-status legend**
> ✅ Implemented · 🧪 Experimental · 📋 Planned

---

## Supported versions

| Version | Supported |
|---|---|
| `main` (HEAD) | ✅ Active development |
| Any tagged release | See individual release notes |

This project is in early development (pre-1.0). No long-term-support (LTS) channel exists yet.

---

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

1. Email **security@acing-iu.example** (placeholder — replace with real address before publishing).
2. Include:
   - A clear description of the vulnerability.
   - Steps to reproduce or a proof-of-concept (if safe to share).
   - The component(s) affected.
   - The potential impact.
3. You will receive an acknowledgement within **72 hours**.
4. We target a fix within **14 calendar days** for critical issues and **30 days** for others.
5. A CVE will be requested where appropriate.

Please do not disclose the issue publicly until a fix is available and we have had a chance to notify affected users.

---

## Security design principles

| Principle | Status |
|---|---|
| Hardware root of trust (Acing Vault / TrustZone) | 🧪 Experimental (emulated) |
| Verified boot (AVB 2.0) | 🧪 Experimental |
| Biometric/strong-auth gate for admin actions | 🧪 Experimental |
| Runtime tamper detection | 🧪 Experimental |
| Declarative security policy enforcement | 🧪 Experimental |
| Non-root runtime containers | 📋 Planned |
| Read-only root filesystem | 📋 Planned |
| Structured security-event audit log | 📋 Planned |
| MFA encryption at rest | 📋 Planned |
| Redis-backed token revocation | 📋 Planned |
| Rate limiting on authentication endpoints | 📋 Planned |
| SBOM generation | 📋 Planned |
| Container vulnerability scanning (Trivy / Grype) | 📋 Planned |

---

## Known limitations (current baseline)

- `iu_auth_service` is a **shell stub** — it does not perform real authentication.
- `AcingVaultEmulator` is a **software emulation** — it does not provide hardware-backed guarantees.
- No network-accessible HTTP endpoints exist; the threat surface is currently limited to the build toolchain and boot scripts.
- No automated security scanning (SAST/DAST) is configured yet.

---

## Threat model

See `THREAT_MODEL.md` for a full threat model.

---

## Security contacts

| Role | Contact |
|---|---|
| Security lead | security@acing-iu.example |
| Project maintainer | @AcingTime420 |
