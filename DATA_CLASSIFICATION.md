# Data Classification Policy — Acing IU: Genesis

> **Feature-status legend**
> ✅ Implemented · 🧪 Experimental · 📋 Planned

---

## Purpose

This document defines how data generated, processed, or stored by Acing IU: Genesis is classified and handled.

---

## Classification levels

| Level | Label | Description | Examples |
|---|---|---|---|
| 0 | **Public** | Freely shareable; no harm if disclosed | Source code, public docs, security advisories |
| 1 | **Internal** | Intended for contributors; limited external sharing | Build logs, CI artefacts, issue details |
| 2 | **Confidential** | Restricted to authorised team members | Security vulnerability reports, private keys (test) |
| 3 | **Restricted** | Highest sensitivity; tightly controlled | Hardware key material, production secrets, PII |

---

## Data inventory

| Data item | Classification | Storage location | Status |
|---|---|---|---|
| Source code | Public | GitHub (public repository) | ✅ |
| Build artefacts (`out/`, `bin/`) | Internal | Local machine / CI runner (not committed) | ✅ |
| Security policies (`policies.json`) | Internal | Repository | ✅ |
| Admin session keys | Restricted | Acing Vault (emulated in dev) | 🧪 Experimental |
| Boot image cryptographic keys | Restricted | TrustZone / hardware (planned) | 📋 Planned |
| Environment secrets (`.env`) | Confidential | Local machine only (gitignored) | ✅ |
| CI secrets (GitHub Secrets) | Confidential | GitHub Actions encrypted secrets | 📋 Planned |
| Security vulnerability reports | Restricted | Private email channel | 📋 Planned |
| User biometric data | Restricted | Device hardware enclave (never in repo) | 📋 Planned |

---

## Handling rules

### Public (Level 0)
- May be committed to the public repository.
- No special access controls required.

### Internal (Level 1)
- Must not be committed to version control as build artefacts (enforced by `.gitignore` and CI).
- CI logs are retained for 7 days maximum and automatically purged.

### Confidential (Level 2)
- Must never be committed to version control.
- Must be stored in environment variables or secrets management.
- `.env` files are gitignored; only `.env.example` (with placeholder values) may be committed.

### Restricted (Level 3)
- Must be stored in hardware-backed key stores in production.
- Must never leave the device in plaintext.
- Access must be logged and auditable.

---

## Compliance notes 📋 Planned

- GDPR applicability assessment is deferred to Phase 5 (Product Readiness).
- No personal data is currently processed or stored by this platform.
- When user-facing features are added, a Data Protection Impact Assessment (DPIA) must be completed.

---

## See also

- `PRIVACY.md` — privacy commitments
- `SECURITY.md` — vulnerability reporting
- `THREAT_MODEL.md` — threat landscape
