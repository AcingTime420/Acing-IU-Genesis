# Acing IU: Genesis

> **A custom Android OS security platform with hardware-backed protection,
> boot integrity, and a hardened administrative interface for Acing OS devices.**

---

## Feature status

> ✅ Implemented · 🧪 Experimental · 📋 Planned

| Capability | Status |
|---|---|
| Boot integrity verification (AVB) | 🧪 Experimental |
| Acing Vault (hardware key store) | 🧪 Experimental (emulated) |
| IU Security initialisation | 🧪 Experimental |
| GuardianService orchestration | 🧪 Experimental |
| Real-time threat engine (malware, anomaly, network) | 🧪 Experimental |
| Security policy enforcement (`policies.json`) | 🧪 Experimental |
| Admin Dashboard security card | 🧪 Experimental |
| Container deployment | 📋 Planned |
| HTTP health endpoints | 📋 Planned |
| Structured audit logging | 📋 Planned |
| Integration / E2E tests | 📋 Planned |

---

## Quick start

### Prerequisites

| Tool | Minimum version |
|---|---|
| JDK | 17 |
| Kotlin compiler (`kotlinc`) | 1.9+ |
| GNU Make | 3.81+ |
| Git | 2.39+ |
| Bash | 5.0+ |

### Clone and validate

```bash
git clone https://github.com/AcingTime420/Acing-IU-Genesis.git
cd Acing-IU-Genesis
bash scripts/validate-premerge.sh
```

A clean run exits 0 and reports the status of each validation step.

### Build the Guardian platform

```bash
cd system/security/guardian/build
make
# Output: build/out/guardian.jar and associated scripts
```

Or use the top-level script:

```bash
bash build.sh
# Output: out/security/guardian/
```

### Run baseline validation

```bash
# Full validation (skips Compose/health checks when not available)
bash scripts/validate-premerge.sh

# Skip build (only check repo integrity + env)
bash scripts/validate-premerge.sh --skip-build

# Windows / PowerShell
pwsh scripts/validate-premerge.ps1
pwsh scripts/validate-premerge.ps1 -SkipBuild
```

---

## Repository layout

```
Acing-IU-Genesis/
├── .github/workflows/        # CI: ci.yml, repo-integrity.yml
├── docs/
│   ├── adr/                  # Architecture Decision Records
│   └── evidence/             # Baseline validation evidence reports
├── scripts/
│   ├── validate-premerge.sh  # Linux/macOS clean-clone validator
│   └── validate-premerge.ps1 # Windows/PowerShell variant
├── system/security/guardian/ # Guardian Security Platform source
│   ├── auth/                 # Auth service stub
│   ├── boot/                 # Boot-time init scripts
│   ├── build/                # Makefile (output in build/out/ — gitignored)
│   ├── core/                 # GuardianService, AcingVaultEmulator
│   ├── dashboard/            # Admin UI security card
│   ├── iu_security/          # IU security init
│   ├── policy/               # policies.json
│   └── threat/               # Threat engine stubs
├── build.sh                  # Top-level build entry point
├── ARCHITECTURE.md           # Component map and design decisions
├── CONTRIBUTING.md           # Development workflow and PR checklist
├── SECURITY.md               # Vulnerability reporting process
├── THREAT_MODEL.md           # STRIDE threat analysis
└── ...                       # Other governance docs
```

---

## CI checks

| Workflow | Trigger | Checks |
|---|---|---|
| `ci.yml` | push / PR | Repo integrity + clean-clone build |
| `repo-integrity.yml` | push / PR | No tracked generated artifacts |

---

## Documentation

| Document | Purpose |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Component map, build system, known gaps |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Development workflow, PR checklist |
| [SECURITY.md](SECURITY.md) | Vulnerability reporting, security design |
| [THREAT_MODEL.md](THREAT_MODEL.md) | STRIDE analysis, attack surface |
| [RELEASE_PROCESS.md](RELEASE_PROCESS.md) | Release stages and checklist |
| [DEPRECATION_POLICY.md](DEPRECATION_POLICY.md) | Deprecation lifecycle |
| [DATA_CLASSIFICATION.md](DATA_CLASSIFICATION.md) | Data sensitivity levels |
| [PRIVACY.md](PRIVACY.md) | Privacy commitments |
| [docs/adr/](docs/adr/README.md) | Architecture Decision Records |
| [docs/evidence/](docs/evidence/repository-integrity-baseline.md) | Baseline validation evidence |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).  
Security issues: see [SECURITY.md](SECURITY.md) — **do not open a public issue**.

---

## License

*License to be determined — see project maintainer.*
