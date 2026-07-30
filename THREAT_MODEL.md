# Threat Model — Acing IU: Genesis

> **Feature-status legend**
> ✅ Implemented · 🧪 Experimental · 📋 Planned
>
> This is a living document. Update it when new components are added,
> threat landscape changes, or mitigations are implemented.

---

## 1. Scope

This threat model covers the **Acing Guardian Security Platform** as it exists today: a Kotlin/Shell-based custom Android OS security subsystem targeting Acing OS devices.

Out of scope (for this baseline):

- Network-accessible HTTP APIs (none exist yet)
- Container infrastructure (not yet implemented)
- End-user applications (beyond the admin dashboard stub)

---

## 2. Assets to protect

| Asset | Sensitivity | Status |
|---|---|---|
| Boot image integrity | Critical | 🧪 Experimental (AVB verification) |
| Hardware key store (Acing Vault) | Critical | 🧪 Experimental (emulated) |
| Admin session keys | High | 🧪 Experimental (emulated vault) |
| IU security mount points | High | 🧪 Experimental |
| Security policy configuration (`policies.json`) | Medium | ✅ Implemented |
| Source code and build artefacts | Medium | ✅ Protected by .gitignore + CI |

---

## 3. Threat actors

| Actor | Motivation | Capability |
|---|---|---|
| Malicious app on device | Privilege escalation, data exfiltration | Medium — limited by Android sandbox |
| Physical attacker with device access | Boot-time compromise, key extraction | High — direct hardware access |
| Supply-chain attacker | Inject malicious code into build | High — targets CI/CD and dependencies |
| Insider (compromised contributor) | Introduce backdoor, leak secrets | Medium — mitigated by code review + CI |
| Automated vulnerability scanner | Discover exploitable bugs | Low–Medium — no network surface yet |

---

## 4. Attack surface

| Surface | Exposure | Mitigation |
|---|---|---|
| Boot partition | Physical access | AVB verification 🧪 |
| Acing Vault key operations | Privileged OS processes | Emulator isolation 🧪; TrustZone target 📋 |
| `iu_auth_service` | Local IPC (shell stub) | Replace with real auth implementation 📋 |
| Admin dashboard | Admin-role authenticated | Biometric gate 🧪 |
| `policies.json` | Filesystem — root required to modify | AVB + file integrity checks 🧪 |
| Build toolchain (CI) | GitHub Actions runner | Pinned actions, least-privilege token 📋 |
| Source repository | Public GitHub | Branch protection, signed commits 📋 |

---

## 5. STRIDE analysis (abbreviated)

### Boot integrity

| Threat | Category | Mitigation | Status |
|---|---|---|---|
| Replace boot image with malicious version | Tampering | AVB 2.0 verification | 🧪 Experimental |
| Bypass verification | Elevation of Privilege | Secure boot fuse | 📋 Planned |

### Acing Vault

| Threat | Category | Mitigation | Status |
|---|---|---|---|
| Extract keys from emulated vault | Information Disclosure | Replace emulator with TrustZone | 📋 Planned |
| Forge tamper-check result | Spoofing | Hardware attestation | 📋 Planned |

### Admin dashboard

| Threat | Category | Mitigation | Status |
|---|---|---|---|
| Unauthorised admin access | Elevation of Privilege | Biometric/strong-auth gate | 🧪 Experimental |
| Session key theft | Information Disclosure | Vault-backed key storage | 🧪 Experimental |

### Build pipeline

| Threat | Category | Mitigation | Status |
|---|---|---|---|
| Dependency confusion / supply-chain attack | Tampering | Pinned dependencies + SBOM | 📋 Planned |
| Secrets committed to repository | Information Disclosure | `.gitignore` + secret scanning | ✅ Implemented |

---

## 6. Known gaps and accepted risks

| # | Gap | Risk level | Mitigation target |
|---|---|---|---|
| 1 | `iu_auth_service` is a shell stub | Critical | Phase 3 |
| 2 | AcingVaultEmulator provides no hardware guarantees | Critical | Phase 3 |
| 3 | No SAST/DAST scanning configured | High | Phase 2 |
| 4 | No container vulnerability scanning | High | Phase 4 |
| 5 | No signed commits or tags enforced | Medium | Phase 4 |
| 6 | GitHub Actions tokens not scoped to least-privilege | Medium | Phase 2 |

---

## 7. Revision history

| Date | Author | Change |
|---|---|---|
| 2026-07-30 | Copilot Coding Agent | Initial baseline threat model |
