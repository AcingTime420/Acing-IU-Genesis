# Threat Model — Acing-IU-Genesis (Phase 4, Task 4.1)

**Status:** Reviewed baseline  
**Version:** 1.0  
**Last updated:** 2026-09-13  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)  
**Related:** `docs/Architecture.md`, `docs/CAPABILITY_REGISTER.md`, `SECURITY.md`, `docs/security/SUPPLY_CHAIN_FINDING_POLICY.md`

> This is the versioned threat model required by Phase 4 Task 4.1. It describes **current** maturity honestly. Target architecture is labeled as such and is not claimed as implemented.

## 1. Scope and assumptions

### In scope

| Component | Maturity | Role |
|---|---|---|
| Frontend (Next.js) | Simulator / fixture | Operator UI; claim-surface lint enforced |
| API Gateway (Ocelot/.NET) | Experimental | Edge routing, TLS, rate limiting (target) |
| Identity service | Experimental | Auth, JWT, MFA/TOTP, rate-limited login |
| DeviceTrust service | Experimental | Trust scoring; object-level auth closed (#61) |
| Policy engine | Implemented (not in canonical solution) | ABAC-style decision stubs |
| Audit service | Experimental | Durable path closed (#60); full evidence pending |
| PostgreSQL | Implemented | Schemas, grants, audit tables |
| Redis | Implemented (topology) | Sessions / rate-limit target |
| Android / Guardian | Experimental / simulator | Vault emulator, boot/policy stubs |
| CI / supply chain | Partial → met for 4.5 | SBOM, Gitleaks, audits, digest pin, finding policy |
| AI (Gemini workflows) | External dependency | Dispatch/triage only; no device-data path approved |
| Updates / OTA | Target | Docs only; no live channel |

### Out of scope (for this baseline)

- Live carrier/Knox/CTIA integrations (design inspiration only)
- Production multi-tenant SaaS deployment
- Hardware-backed attestation providers
- Full SLSA build attestation (post-baseline target)

### Assumptions

1. Attackers can read public repository content and probe any exposed HTTP surface.
2. Operators may mistake UI fixtures for live enforcement — mitigated by claim-surface policy.
3. Secrets never belong in git; CI and local env are the only approved injection paths.
4. Fail-closed is preferred over fail-open for vault, auth, and authorization paths.

## 2. Assets

| Asset | Sensitivity | Current protection |
|---|---|---|
| User credentials / password hashes | Critical | Identity service hashing; secrets not in git |
| JWT signing keys | Critical | Env / secret store only (`SEC-JWT-001`) |
| Database connection strings | Critical | Env only (`SEC-DB-001`) |
| MFA TOTP secrets | High | Encrypted at rest (unit-tested protector) |
| Device trust / posture records | High | Object-level auth (#61); tenant scope required |
| Audit log integrity | High | Append-oriented schema; durable path (#60) |
| Source code & CI tokens | Medium–High | Branch ruleset, Gitleaks, OIDC preference |
| Operator UI fidelity | Medium | Fixtures + claim-surface lint |
| Vault key material (emulator) | Low (non-prod) | In-memory only |

## 3. Trust boundaries

```text
[Internet / Operator browser]
        |  TB1: HTTPS + JWT (target: gateway rate limit)
        v
[API Gateway]
        |  TB2: internal network + service identity (target)
        v
[Identity | DeviceTrust | Policy | Audit]
        |  TB3: least-privilege DB credentials
        v
[PostgreSQL / Redis]

[CI runner]
        |  TB4: OIDC / short-lived tokens; no long-lived PAT in logs
        v
[GitHub + secret store]

[Device agent — target]
        |  TB5: attestation payload + signature verification (not live)
        v
[DeviceTrust]

[Guardian / Vault emulator — local process]
        |  TB6: process isolation only (not hardware)
        v
[In-memory map]
```

| Boundary | Control today | Gap |
|---|---|---|
| TB1 Browser ↔ Gateway | HTTPS assumed; Identity rate limit on auth routes | Gateway-level Redis rate limit not fully evidenced |
| TB2 Gateway ↔ services | Service topology exists | Mutual TLS / service mesh not required yet |
| TB3 Services ↔ DB | Schema + grants scripts | Runtime least-privilege verification incomplete |
| TB4 CI ↔ repo | Gitleaks, dependency review, ruleset on `master` | Required status checks not yet on ruleset |
| TB5 Device ↔ DeviceTrust | Auth + object-level checks (#61) | No live hardware attestation |
| TB6 Vault emulator | Deterministic software map | Not hardware-isolated |

## 4. Data flows (current)

1. **Login:** Client → Identity AuthController → password verify → JWT issue → (optional) MFA → client stores token. Rate limit returns HTTP 429 after window exhaust (probe evidence on #58).
2. **Authenticated API call:** Client + JWT → Gateway/service → role check → business logic → audit write (target path).
3. **Device trust lookup:** Authenticated caller → DeviceTrust by hardware ID → **must** enforce ownership/tenant (#61) → trust score response.
4. **Telemetry submit:** Authenticated caller → DeviceTrust → ownership check → score update → audit event.
5. **CI push/PR:** GitHub Actions → checkout → SBOM / security / claim-surface / integrity jobs → artifact upload; secrets only via Actions secrets.
6. **Operator UI:** Static Next.js fixtures → **no** live device mutation; RootMaster gated unavailable.

## 5. Abuse cases (STRIDE-oriented)

| ID | Abuse case | Category | Impact | Mitigation | Status |
|---|---|---|---|---|---|
| A1 | Credential stuffing on login | Spoofing | Account takeover | Fixed-window rate limit; HTTP 429 probe | Partial |
| A2 | Replay of stolen JWT | Spoofing | Session hijack | Short-lived access tokens; revocation store exists | Partial — full lifecycle tests pending |
| A3 | Cross-tenant device read by hwId | Elevation | Posture disclosure | Object-level auth (#61) | Met for defect close; matrix doc pending |
| A4 | Unauthenticated audit write/read | Tampering / Disclosure | Fake or leaked audit | Durable authenticated audit (#60) | Defect closed; integration evidence pending |
| A5 | Secret committed to git | Disclosure | Key compromise | Gitleaks full-history; secret register | Met |
| A6 | Mutable container base tag | Tampering | Supply-chain swap | Digest pinning (#62) | Met |
| A7 | Overstated Knox/CTIA claims | Spoofing (operator) | False assurance | Claim-surface lint + #63 | Met |
| A8 | RootMaster flash/Magisk path | Tampering | Device brick / malware | Hard safety gate | Met |
| A9 | Privilege via missing RBAC | Elevation | Admin actions | `[Authorize]` + roles; full matrix pending | Partial |
| A10 | AI workflow data exfiltration | Disclosure | Sensitive data to third party | No device data to external models (policy) | Policy only |
| A11 | Dependency CVE introduction | Tampering | RCE / compromise | dependency-review fail-on-high; npm/dotnet audit | Met |
| A12 | Vault non-determinism / false tamper | Tampering / Denial | Unreliable research | Random path removed from emulator | Met |

## 6. Prioritized mitigations

| Priority | Mitigation | Evidence | Status |
|---|---|---|---|
| P0 | Remove unsupported public claims | #63, claim-surface script | Done |
| P0 | Fail-closed vault/auth foundations | GuardianService patterns; rate limit | Present |
| P0 | Block secret commits | Gitleaks in `security.yml` | Done |
| P0 | Pin container bases | #62 | Done |
| P1 | Auth lifecycle test matrix | Rate-limit probe only | Pending (Task 4.3) |
| P1 | Authorization matrix + deny-path tests | #61 closed | Matrix doc pending (Task 4.4) |
| P1 | Complete secret register ownership | This update | Met for baseline |
| P2 | Gateway Redis rate limit evidence | Topology docs | Pending |
| P2 | SLSA-style provenance | Finding policy §9 | Post-baseline |
| P2 | Full data-flow diagrams in ADR set | Architecture.md sequences | Partial |

## 7. Design rules (mandatory for new work)

1. **Deny by default** — missing auth/authz context fails closed.
2. **No live secrets in git** — metadata only in the secret register.
3. **Label maturity** — UI and docs must match `CAPABILITY_REGISTER.md`.
4. **Prefer short-lived credentials** — JWT access tokens; OIDC for CI.
5. **Audit security events** — login failures, authz denials, secret rotations (safe fields only).
6. **Supply-chain findings follow** `docs/security/SUPPLY_CHAIN_FINDING_POLICY.md`.

## 8. Residual risk acceptance

| Risk | Why accepted for now | Revisit trigger |
|---|---|---|
| No hardware attestation | Research platform; emulator only | First authorized device lab |
| Incomplete auth test matrix | Unit + rate-limit probe exist | Task 4.3 completion |
| Ruleset without required status checks | Admin can still merge after review | Add checks when CI job names stabilize |
| AI workflows exist | Dispatch/triage only; no device payloads approved | Phase 8 AI governance |

## 9. Review history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-09-13 | Stub created |
| 1.0 | 2026-09-13 | Full baseline narrative: assets, boundaries, flows, abuse cases, mitigations |

---

*This document is the authoritative Phase 4 Task 4.1 threat model for Acing-IU-Genesis at the recorded version. Reclassify capabilities only via updates to `CAPABILITY_REGISTER.md` with linked evidence.*
