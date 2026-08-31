# Release Process — Acing IU: Genesis

## Status

The automated GitHub release pipeline, security audits, and SPDX SBOM generation are implemented. Release candidates remain pre-production validation builds and do not represent a stable or LTS product.

## Versioning

The project follows Semantic Versioning 2.0.0:

```text
MAJOR.MINOR.PATCH[-prerelease][+buildmetadata]
```

IRP package numbers and product versions are separate identifiers.

## Release stages

| Stage | Purpose |
|---|---|
| `alpha` | Internal development; no stability guarantees |
| `beta` | Feature-complete milestone testing |
| `rc` | Release freeze; critical fixes only |
| stable | Public supported release described by its release notes |

## Automated artifacts

Every version tag matching `v*.*.*` triggers `.github/workflows/release.yml` and produces:

- compiled `guardian.jar`;
- published Identity and Device Trust .NET services;
- compiled Next.js frontend files;
- IRP documentation;
- SPDX JSON SBOM;
- SHA-256 checksum;
- compressed release archive;
- GitHub Release with generated notes.

Tags containing a prerelease suffix, such as `-rc.1`, are published as GitHub prereleases.

## Release-candidate checklist

1. Confirm `master` is current and has no unintended local changes.
2. Confirm Repository Integrity, Clean-Clone Baseline, Security and Dependency Review, and SBOM workflows pass.
3. Confirm no unresolved release-blocking issues or pull requests remain.
4. Update `CHANGELOG.md`.
5. Create and push an annotated release-candidate tag.
6. Confirm the Release workflow passes.
7. Download all artifacts and verify the SHA-256 checksum.
8. Smoke-test the Guardian JAR, .NET services, and frontend from the release archive.
9. Record defects; create `-rc.2` if corrections are required.
10. Promote to a stable tag only after release-candidate acceptance.

## Stable release

Stable releases require a signed final tag, completed release-candidate evidence, no open critical security findings, and explicit maintainer approval.

## Hotfixes

Create a minimal branch from the affected stable tag, run the complete CI and security gate set, and merge the reviewed correction back into `master`. After the canonical `master` commit passes the required checks, create and push the signed semantic-patch tag on that exact commit. The release workflow intentionally rejects a tag that does not identify the current canonical `master` commit.
