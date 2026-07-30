# Release Process — Acing IU: Genesis

> **Feature-status legend**
> ✅ Implemented · 🧪 Experimental · 📋 Planned

---

## Overview

This document describes how releases of Acing IU: Genesis are prepared, validated, and published.  
The current release process is **📋 Planned** — no formal release pipeline exists yet.  
This document establishes the target process for Phase 4 (Engineering Maturity).

---

## Versioning

The project uses [Semantic Versioning 2.0.0](https://semver.org/):

```
MAJOR.MINOR.PATCH[-prerelease][+buildmetadata]
```

| Segment | Changed when |
|---|---|
| MAJOR | Incompatible API or boot-contract changes |
| MINOR | New features added in a backward-compatible manner |
| PATCH | Backward-compatible bug fixes |
| Pre-release | `-alpha.N`, `-beta.N`, `-rc.N` |

**Note:** The IRP package number and product version must not be used interchangeably.

---

## Release stages 📋 Planned

| Stage | Description |
|---|---|
| `alpha` | Internal development; no stability guarantees |
| `beta` | Feature-complete for the milestone; limited external testing |
| `rc` (release candidate) | Freeze; only critical bug fixes permitted |
| `stable` | Publicly tagged and documented release |

---

## Release artefacts 📋 Planned

Each stable release should produce:

- `guardian.jar` — compiled Guardian platform
- Boot scripts archive (`guardian_init.sh`, `iu_security_init`, etc.)
- SBOM (Software Bill of Materials) in SPDX format
- Container images (when containerisation is implemented) with digest pins
- Release notes (`CHANGELOG.md` entry)
- Signed tag (`git tag -s vX.Y.Z`)

---

## Release checklist 📋 Planned

1. All CI checks pass on `main`.
2. `bash scripts/validate-premerge.sh` exits 0 on a clean clone.
3. CHANGELOG.md entry written and reviewed.
4. Version bumped in build files.
5. Release branch created (`release/vX.Y.Z`).
6. Release candidate tagged (`vX.Y.Z-rc.1`) and validated.
7. Final tag signed and pushed (`vX.Y.Z`).
8. GitHub Release created with artefacts attached.
9. Security advisory review completed (no outstanding critical issues).

---

## Hotfix process 📋 Planned

For critical security fixes:

1. Branch from the affected tag: `git checkout -b hotfix/vX.Y.Z+1 vX.Y.Z`
2. Apply minimal fix.
3. Fast-track CI + security review.
4. Tag as `vX.Y.Z+1` and backport to `main`.

---

## Current gaps

- No automated release pipeline (GitHub Actions release workflow).
- No CHANGELOG.md yet.
- No SBOM generation tooling configured.
- No container images to sign.

These gaps are tracked in `docs/evidence/repository-integrity-baseline.md`.
