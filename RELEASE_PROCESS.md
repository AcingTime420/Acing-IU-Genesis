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
5. Create and push a cryptographically signed annotated release-candidate tag on the exact reviewed release commit.
6. Confirm the Release workflow passes.
7. Download all artifacts and verify the SHA-256 checksum.
8. Smoke-test the Guardian JAR, .NET services, and frontend from the release archive.
9. Record defects; create `-rc.2` if corrections are required.
10. Promote to a stable tag only after release-candidate acceptance.

## Stable release

Stable releases require a signed final tag, completed release-candidate evidence, no open critical security findings, and explicit maintainer approval.

## Hotfixes

The current release workflow intentionally supports releases only from the exact current canonical `master` commit. Do not create a semantic-patch release from an older stable tag when `master` contains unrelated changes; doing so could either violate provenance enforcement or package unrelated features as a patch. Record and validate the minimal correction on a dedicated patch branch, merge it back into `master`, and defer publication unless the resulting current `master` is the explicitly approved patch release. Supporting maintained historical release lines requires a separately reviewed maintenance-branch workflow with equivalent signature, provenance, CI, security, and approval gates; that workflow is not currently implemented.
