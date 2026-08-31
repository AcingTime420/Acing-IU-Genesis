# ADR-001 — Canonical Repository Structure

**Status:** Accepted  
**Date:** 2026-07-30  
**Author(s):** @AcingTime420

---

## Context

The Acing IU: Genesis repository has evolved through multiple architectural generations.
Signs of this evolution include:

- Multiple IntelliJ module files (`*.iml`) at different directory levels.
- No root `.gitignore`, allowing generated build artefacts (`out/`, `build/out/`) to be accidentally committed.
- No CI workflows to enforce repository hygiene.
- No governance documents (ARCHITECTURE.md, SECURITY.md, CONTRIBUTING.md, etc.).

This lack of structure increases the risk of:

- Generated artefacts being committed and causing merge conflicts.
- Clean-clone failures on contributor machines and CI runners.
- Security-sensitive files (`.env`, `*.pdb`) being accidentally committed.
- Architectural drift as new contributors lack documented conventions.

A canonical structure must be established before the codebase grows further.

---

## Decision

We establish the following canonical repository structure:

```
Acing-IU-Genesis/
├── .github/
│   ├── ISSUE_TEMPLATE/      # Standardised issue templates
│   └── workflows/           # CI: repo-integrity.yml, ci.yml
├── docs/
│   ├── adr/                 # Architecture Decision Records (this directory)
│   ├── evidence/            # Baseline validation evidence reports
│   └── *.md / *.mmd / *.d2  # Architecture diagrams and descriptions
├── scripts/
│   ├── validate-premerge.sh  # Linux/macOS clean-clone validator
│   └── validate-premerge.ps1 # Windows/PowerShell variant
├── system/
│   └── security/
│       └── guardian/         # Acing Guardian Security Platform source
│           ├── auth/
│           ├── boot/
│           ├── build/        # Makefile; output in build/out/ (gitignored)
│           ├── core/
│           ├── dashboard/
│           ├── iu_security/
│           ├── policy/
│           └── threat/
├── build.sh                  # Top-level build entry point
├── .gitignore                # Root gitignore covering all generated paths
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── DATA_CLASSIFICATION.md
├── DEPRECATION_POLICY.md
├── PRIVACY.md
├── RELEASE_PROCESS.md
├── SECURITY.md
├── SUPPORT.md
└── THREAT_MODEL.md
```

Key rules:

1. **All generated artefacts are excluded from version control** via `.gitignore`.
   This includes `bin/`, `obj/`, `out/`, `dist/`, `TestResults/`, `coverage/`,
   `node_modules/`, `.next/`, `*.pdb`, `*.suo`, `*.user`.

2. **CI enforces the above** via the `repo-integrity.yml` workflow.

3. **A clean-clone validation script** (`scripts/validate-premerge.sh`) is the
   authoritative pre-merge check.

4. **Governance documents** are created at the repository root and kept
   aligned with the current state of the codebase (no unimplemented claims).

5. **`.idea/` volatile files** (caches, workspace.xml, shelf) are excluded;
   project-level `.idea/` config may be committed at maintainer discretion.

6. **Future services** (backend, frontend, containers) will be added under
   clearly named top-level directories (e.g., `backend/`, `frontend/`, `infra/`)
   without duplicating the existing `system/` tree.

---

## Options considered

| Option | Pros | Cons |
|---|---|---|
| **Keep current ad-hoc structure** | No effort | Drift continues; CI gaps grow; contributors confused |
| **Full restructure + delete legacy paths** | Clean slate | High risk; disrupts ongoing work; may lose history |
| **Incremental canonicalisation (chosen)** | Low risk; immediately actionable; CI-verifiable | Does not resolve all historical debt in one pass |

---

## Consequences

### Positive

- Repository is reproducible from a clean clone.
- CI blocks generated artefact commits before they merge.
- Governance documents provide orientation for new contributors and AI assistants.
- Future containerisation and backend additions have a documented home.

### Negative / trade-offs

- `.iml` files currently tracked will be flagged by the new `.gitignore` rule on the next `git status`.
  Contributors will need to run `git rm --cached` for these files.
- Some `.idea/` project config is still tracked; teams must decide whether to remove it
  (recommended) or keep it (acceptable with justification).

---

## References

- [Repository Integrity and End-to-End Baseline remediation issue]
- `docs/evidence/repository-integrity-baseline.md` — validation run evidence
- `ARCHITECTURE.md` — component map
- `.gitignore` — enforced exclusion list
- `.github/workflows/repo-integrity.yml` — CI enforcement
