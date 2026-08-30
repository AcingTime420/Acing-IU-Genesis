# Backend Root Reconciliation Evidence

**Recorded:** 2026-08-30

**Scope:** Uploaded `master` and `phase0/governance-baseline` repository snapshots

**Mode:** Read-only directory, reference, and configuration comparison

## Decision Supported

| Path | Classification |
|---|---|
| `backend/` | Canonical backend implementation root |
| `acing-iu/backend/` | Legacy duplicate, frozen pending history review and dedicated removal |
| `installer/payload/platform/backend/` | Generated installer payload derived from canonical source |

## Consumer Evidence

The following repository controls and consumers point to `backend/`:

- `.github/workflows/ci.yml` restores, builds, and tests `backend/AcingIU.sln`.
- `.github/workflows/security.yml` audits `backend/AcingIU.sln` dependencies.
- `.github/workflows/release.yml` publishes Identity and DeviceTrust projects under `backend/`.
- `.github/workflows/container.yml` builds backend service containers from `backend/`.
- `.github/dependabot.yml` monitors backend project paths under `backend/`.
- `.github/CODEOWNERS` assigns `/backend/` ownership.
- `tests/Identity.UnitTests/Identity.UnitTests.csproj` and `tests/DeviceTrust.UnitTests/DeviceTrust.UnitTests.csproj` reference projects under `backend/`.
- `scripts/validate-premerge.ps1` and `scripts/build-acingos.sh` use `backend/`.
- `infrastructure/docker-compose.yml` uses backend service Dockerfiles under `backend/`.

No backend build, test, release, container, dependency-monitoring, or installer consumer outside `acing-iu/` was found to use `acing-iu/backend/` in the inspected snapshot.

## File-Level Comparison

### `backend/` compared with `acing-iu/backend/`

- Canonical tree: 56 files.
- Legacy tree: 18 files.
- Common relative paths: 18.
- Byte-identical common files: 11.
- Differing common files: 7.
- Files present only in canonical tree: 38.
- Files present only in legacy tree: 0.

This supports classification as a legacy subset, not an independent implementation. Removal still requires Git-history verification because ZIP snapshots do not contain commit history.

The top-level `backend/` tree itself contains projects that are not members of the current `backend/AcingIU.sln`. Canonical-root classification identifies the authoritative location; it does not certify every contained project as active, tested, or release-ready. A later project-membership review must classify those internal projects separately.

### `backend/` compared with `installer/payload/platform/backend/`

- Canonical tree: 56 files.
- Installer payload tree: 28 files.
- Common relative paths: 28.
- Byte-identical common files: 20.
- Differing common files: 8.
- Files present only in canonical tree: 28.
- Files present only in installer payload: 0.

`installer/scripts/prepare-payload.ps1` explicitly copies Identity and DeviceTrust from `backend/` into the installer payload and rewrites Docker Compose build contexts for the installed layout. This establishes the payload as generated packaging content. The observed differences show that payload freshness must be verified before release.

## Safety Boundary

- No directory was deleted, merged, moved, renamed, or overwritten during reconciliation.
- No Git history was available in the uploaded ZIP snapshots.
- No .NET, Docker, Android, installer, or device runtime execution is established by this evidence.
- The legacy directory must remain preserved until history and downstream-consumer checks are repeated in a full Git clone.
- Installer payload correction and legacy-root removal belong in dedicated reviewed changes, not this governance-only PR.
