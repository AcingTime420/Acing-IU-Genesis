# Architecture — Acing IU: Genesis

> **Feature-status legend used throughout this document**
> | Status | Meaning |
> |---|---|
> | ✅ Implemented | Code exists and is verifiable in this repository. |
> | 🧪 Experimental | Present but not production-hardened; subject to change. |
> | 📋 Planned | Documented intent; no code yet. |

---

## 1. Project overview

**Acing IU: Genesis** is a custom Android-based OS security platform.  
Its primary purpose is to provide hardware-backed security, boot integrity, and a hardened administrative interface for Acing OS devices.

---

## 2. High-level component map

```
┌────────────────────────────────────────────────────────────────┐
│                     Acing OS (Android base)                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                  Acing Guardian Platform                  │  │
│  │                                                           │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │  │
│  │  │  Boot Integrity  │  │   GuardianService (Kotlin)   │  │  │
│  │  │  guardian_init   │  │   ├─ AcingVaultEmulator      │  │  │
│  │  │  acing_vault_*   │  │   ├─ ThreatEngine            │  │  │
│  │  └─────────────────┘  │   └─ AdminDashboardBridge     │  │  │
│  │                        └──────────────────────────────┘  │  │
│  │  ┌─────────────────┐  ┌──────────────────────────────┐  │  │
│  │  │  IU Security     │  │  Policy & Compliance Engine  │  │  │
│  │  │  iu_security_init│  │  (policies.json)             │  │  │
│  │  │  iu_auth_service │  └──────────────────────────────┘  │  │
│  │  └─────────────────┘                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## 3. Component details

### 3.1 Boot Integrity Layer ✅ Experimental

| File | Purpose |
|---|---|
| `system/security/guardian/boot/guardian_init.sh` | Init-sequence script; verifies AVB, starts keystore, activates IU security. |
| `system/security/guardian/boot/acing_vault_init` | Initialises the Acing Vault (hardware-backed key store emulator). |
| `system/security/guardian/boot/acing_vault_check_tamper` | Detects runtime tampering of the vault. |

### 3.2 Interface User (IU) Security ✅ Experimental

| File | Purpose |
|---|---|
| `system/security/guardian/iu_security/iu_security_init` | Protects admin UI mount points and runs anti-tamper checks. |
| `system/security/guardian/auth/iu_auth_service` | Auth stub; placeholder for full biometric/strong-auth integration. |

### 3.3 GuardianService ✅ Experimental

Kotlin system service (`system/security/guardian/core/GuardianService.kt`) that orchestrates:

- Acing Vault initialisation and tamper detection
- Threat engine start-up (malware scanner, anomaly detector, network monitor)
- Admin Dashboard security state feed
- Interface User protection (biometric gate, secure workspace, session key storage)

### 3.4 AcingVaultEmulator 🧪 Experimental

`system/security/guardian/core/AcingVaultEmulator.kt` — software emulation of hardware-backed key storage for development.  
Production target: TrustZone / hardware Keystore.

### 3.5 Threat Engine ✅ Experimental

| File | Capability |
|---|---|
| `threat/MalwareScanner.kt` | Signature + heuristic malware detection stub. |
| `threat/AnomalyDetector.kt` | Behavioural anomaly detection stub. |
| `threat/NetworkThreatMonitor.kt` | Network traffic monitoring stub. |

### 3.6 Policy & Compliance Engine ✅ Experimental

`system/security/guardian/policy/policies.json` — declarative security policies (boot integrity, keystore init, tamper detection, biometric auth, secure workspace).

### 3.7 Admin Dashboard ✅ Experimental

`system/security/guardian/dashboard/AdminDashboardSecurityCard.kt` — Compose/View component for displaying security posture in the admin UI.

---

## 4. Build system

| Artefact | Tool | Status |
|---|---|---|
| `guardian.jar` (Kotlin) | `kotlinc` + `jar` via `make` | ✅ Experimental |
| Shell scripts / binaries | `make` copy rules | ✅ Implemented |
| OS image | `build.sh` (placeholder) | 📋 Planned |

Build output is written to `system/security/guardian/build/out/` and the root `out/` directory.  
Both paths are excluded from version control via `.gitignore`.

---

## 5. Container / deployment architecture 📋 Planned

No Dockerfiles or Compose files exist in this repository today.  
The planned containerisation approach will:

- Wrap each service in a minimal, non-root, read-only-root-filesystem container.
- Use pinned base-image digests.
- Include `HEALTHCHECK` directives and resource limits.
- Be orchestrated with Docker Compose (development) and optionally Kubernetes (production).

See `RELEASE_PROCESS.md` for planned milestone.

---

## 6. Security architecture

See `SECURITY.md` and `THREAT_MODEL.md` for full detail.

Key design principles:

1. **Hardware root of trust** — Acing Vault (TrustZone target) is the root of all key operations.
2. **Verified boot** — every boot image is AVB-verified before execution.
3. **Least privilege** — IU Security mounts and protects only the surfaces it owns.
4. **Defence in depth** — boot integrity + runtime threat engine + policy engine layer independently.
5. **Auditability** — all security events are logged (structured audit log: 📋 Planned).

---

## 7. Directory layout

```
Acing-IU-Genesis/
├── .github/
│   ├── ISSUE_TEMPLATE/          # Bug, feature, and custom issue templates
│   └── workflows/               # CI: baseline validation, repo integrity
├── docs/
│   ├── adr/                     # Architecture Decision Records
│   ├── evidence/                # Baseline validation evidence reports
│   └── *.md / *.mmd / *.d2      # Architecture diagrams and descriptions
├── scripts/
│   ├── validate-premerge.sh     # Linux/macOS clean-clone validator
│   └── validate-premerge.ps1    # Windows/PowerShell variant
├── system/
│   └── security/
│       └── guardian/
│           ├── auth/            # Authentication service stub
│           ├── boot/            # Boot-time init scripts
│           ├── build/           # Makefile; output in build/out/ (gitignored)
│           ├── core/            # GuardianService, AcingVaultEmulator
│           ├── dashboard/       # Admin UI security card
│           ├── iu_security/     # IU security init
│           ├── policy/          # policies.json
│           └── threat/          # Threat engine stubs
├── build.sh                     # Top-level build entry point
├── .gitignore                   # Excludes all generated artifacts
├── ARCHITECTURE.md              # This file
├── CONTRIBUTING.md
├── SECURITY.md
├── SUPPORT.md
├── RELEASE_PROCESS.md
├── DEPRECATION_POLICY.md
├── THREAT_MODEL.md
├── DATA_CLASSIFICATION.md
└── PRIVACY.md
```

---

## 8. Known gaps and next actions

| # | Gap | Priority | Owner |
|---|---|---|---|
| 1 | No integration tests; only build-time compilation validated | High | Engineering |
| 2 | No Docker / Compose baseline | High | Engineering |
| 3 | AcingVaultEmulator is not a real hardware integration | High | Platform |
| 4 | No HTTP/health endpoints to probe in CI | Medium | Engineering |
| 5 | Auth service is a shell stub, not a real auth implementation | High | Security |
| 6 | No OpenTelemetry / structured logging | Medium | Engineering |

See `docs/evidence/repository-integrity-baseline.md` for a current-state snapshot.
