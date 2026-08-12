# Changelog

All notable changes to Acing IU: Genesis are documented here.

## [Unreleased]

### Planned

- Release-candidate artifact smoke testing
- Container vulnerability scanning and provenance attestation
- Device-level Guardian integration testing

## [1.4.0-rc.1] - 2026-08-12

### Added

- Genesis IRP v1.3.1 foundation
- Guardian identity and device-trust services with fail-closed enforcement
- .NET Identity and Device Trust services
- Next.js security-center frontend
- repository-integrity and clean-clone validation
- dependency review, NuGet/npm auditing, and Gitleaks scanning
- SPDX SBOM generation
- automated tagged GitHub releases with checksums

### Changed

- Upgraded the frontend security baseline to Next.js 16 and React 19
- Replaced placeholder CODEOWNERS entries with the repository maintainer
- Consolidated obsolete foundation branches and pull requests

### Security

- Removed hardcoded database credentials from tracked infrastructure configuration
- Remediated eight high-severity frontend dependency findings
- Added automated secret and dependency gates

### Known limitations

- This is a prerelease evaluation build, not a stable production release.
- Hardware-backed vault, verified boot, device attestation, and production MFA remain incomplete.
