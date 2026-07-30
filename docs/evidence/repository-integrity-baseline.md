# Repository Integrity Baseline — Evidence Report

**Date:** 2026-07-30  
**Branch:** `copilot/implement-repository-integrity-remediation`  
**Author:** Copilot Coding Agent  

---

## 1. Summary of changes

This report documents the "Repository Integrity and End-to-End Baseline remediation" changes
introduced in this PR, aligned to sections A–F of the approved work package.

---

## 2. Changes by section

### A) Repository hygiene + guardrails ✅

| Change | File | Status |
|---|---|---|
| Root `.gitignore` created | `.gitignore` | ✅ Done |
| Covers `bin/`, `obj/`, `out/`, `dist/`, `TestResults/`, `coverage/`, `node_modules/`, `.next/` | `.gitignore` | ✅ Done |
| Covers `*.pdb`, `*.suo`, `*.user`, `.env`, `.env.*`, `!.env.example` | `.gitignore` | ✅ Done |
| Covers `.idea/` volatile files and `*.iml` | `.gitignore` | ✅ Done |
| CI job that fails if generated artifacts are committed | `.github/workflows/repo-integrity.yml` | ✅ Done |

**Note:** The `.idea/` directory and `*.iml` files are currently tracked.
They are now covered by `.gitignore` for future commits; tracked copies should be removed
by running `git rm --cached .idea/ system/security/security.iml system/system.iml`
in a follow-up PR.

### B) Clean-clone reproducibility baseline ✅

| Change | File | Status |
|---|---|---|
| `validate-premerge.sh` (Linux/macOS primary) | `scripts/validate-premerge.sh` | ✅ Done |
| `validate-premerge.ps1` (Windows/PowerShell) | `scripts/validate-premerge.ps1` | ✅ Done |
| Script checks for tracked generated artifacts | Both scripts | ✅ Done |
| Script sets up `.env` from `.env.example` when present | Both scripts | ✅ Done |
| Build step: conditional on `kotlinc` availability | Both scripts | ✅ Done |
| Compose step: conditional on `docker compose` + compose file presence | Both scripts | ✅ Done |
| Readiness checks: skipped with clear reason (no HTTP endpoints yet) | Both scripts | ✅ Conditional skip |
| Actionable step banners and non-zero exits on failure | Both scripts | ✅ Done |

### C) CI workflow for reproducibility ✅

| Change | File | Status |
|---|---|---|
| Main CI workflow: checkout, env setup, build, validate | `.github/workflows/ci.yml` | ✅ Done |
| Installs Kotlin compiler in CI | `.github/workflows/ci.yml` | ✅ Done |
| Uploads logs/artifacts on failure | `.github/workflows/ci.yml` | ✅ Done |
| Dedicated repo-integrity job (no tracked generated artifacts) | `.github/workflows/repo-integrity.yml` | ✅ Done |

### D) Container baseline ⏭️ Deferred

No Dockerfiles or `docker-compose.yml` exist in the repository at this time.

| Item | Status | Notes |
|---|---|---|
| Dockerfile normalisation | 📋 Planned | No Dockerfiles exist |
| Non-root runtime user | 📋 Planned | Prerequisite: Dockerfiles |
| HEALTHCHECK directives | 📋 Planned | Prerequisite: Dockerfiles |
| Pinned base-image digests | 📋 Planned | Prerequisite: Dockerfiles |
| Resource limits | 📋 Planned | Prerequisite: Dockerfiles |

Container baseline is deferred to Phase 2 (Reproducible Platform).  
The `validate-premerge.sh` script already includes a conditional Compose step
that will activate automatically once `docker-compose.yml` is added.

### E) Governance + ADR scaffolding ✅

| Document | File | Status |
|---|---|---|
| Architecture overview | `ARCHITECTURE.md` | ✅ Done |
| Contributor guide | `CONTRIBUTING.md` | ✅ Done |
| Security policy | `SECURITY.md` | ✅ Done |
| Support channels | `SUPPORT.md` | ✅ Done |
| Release process | `RELEASE_PROCESS.md` | ✅ Done |
| Deprecation policy | `DEPRECATION_POLICY.md` | ✅ Done |
| Threat model | `THREAT_MODEL.md` | ✅ Done |
| Data classification | `DATA_CLASSIFICATION.md` | ✅ Done |
| Privacy policy | `PRIVACY.md` | ✅ Done |
| ADR README | `docs/adr/README.md` | ✅ Done |
| ADR-001: Canonical repo structure | `docs/adr/ADR-001-canonical-repo-structure.md` | ✅ Done |

All documents use explicit feature-status language (✅ Implemented / 🧪 Experimental / 📋 Planned)
and do not claim unimplemented capabilities as implemented.

### F) Evidence report ✅

This file: `docs/evidence/repository-integrity-baseline.md`

---

## 3. CI check status

| Check | Workflow | Expected result |
|---|---|---|
| No tracked generated artifacts | `repo-integrity.yml` | ✅ PASS (none exist in current tree) |
| Clean-clone baseline (artifact check + build skip) | `ci.yml` | ✅ PASS |
| Kotlin build | `ci.yml` | ✅ PASS (kotlinc installed; Makefile present) |

---

## 4. validate-premerge.sh run summary

A representative local run (with `kotlinc` absent; Compose skipped):

```
==> Repository root: /path/to/Acing-IU-Genesis

==> 1/5  Checking for tracked generated artifacts
    ✓ No tracked generated artifacts detected.

==> 2/5  Environment file baseline
    ~ SKIP: .env.example not found — skipping env setup

==> 3/5  Build
    ~ SKIP: kotlinc not found — skipping Kotlin compilation (install Kotlin to enable)

==> 4/5  Docker Compose
    ~ SKIP: No docker-compose.yml / compose.yaml found — container baseline is planned (see ARCHITECTURE.md)

==> 5/5  Readiness / health checks
    ~ SKIP: No HTTP endpoints configured yet — health checks are planned (see docs/adr/ADR-001)

==============================================
  All enabled checks PASSED.
==============================================
```

Exit code: **0** ✅

---

## 5. Known gaps and next actions

| # | Gap | Priority | Target phase |
|---|---|---|---|
| 1 | `.idea/` and `*.iml` files still tracked (pre-dates this PR) | Medium | Phase 1 follow-up |
| 2 | No Docker / Compose baseline | High | Phase 2 |
| 3 | `iu_auth_service` is a shell stub (not real auth) | Critical | Phase 3 |
| 4 | `AcingVaultEmulator` is software-only (no hardware guarantees) | Critical | Phase 3 |
| 5 | No HTTP health endpoints to probe in CI | Medium | Phase 2 |
| 6 | No integration or end-to-end tests | High | Phase 4 |
| 7 | No SAST/DAST scanning in CI | High | Phase 2 |
| 8 | No SBOM generation | Medium | Phase 4 |
| 9 | No signed commits or release tags | Medium | Phase 4 |
| 10 | `.env.example` not yet created (no config surface exists yet) | Low | When first service added |

---

## 6. Intentionally deferred items

The following items from the approved work package are intentionally deferred to later phases:

- **Container hardening (D)** — requires Dockerfiles to exist first.
- **Startup/configuration modularity (scope item 4)** — requires a backend HTTP service to exist.
- **HTTP health/readiness checks in validate-premerge** — conditional skip already in place.
- **Full SAST/DAST integration** — requires security toolchain selection.
- **SBOM generation** — requires container and build toolchain maturity.

---

## 7. Commands used during this PR

```bash
# Validate repository integrity locally
bash scripts/validate-premerge.sh

# Check for tracked generated artifacts
git ls-files -- bin obj out dist TestResults coverage node_modules .next

# Review .gitignore coverage
git check-ignore -v system/security/guardian/build/out/guardian.jar
```
