# Security Policy — Acing IU: Genesis

## Supported versions

| Version | Supported |
|---|---|
| `master` (HEAD) | Active development |
| Latest release candidate | Validation support only |
| Stable tagged releases | See the applicable release notes |

The project is pre-1.0 and currently has no LTS channel.

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability.

1. Open the repository's **Security** tab.
2. Select **Report a vulnerability** to create a private security advisory.
3. Include affected components, reproducible steps, impact, and a safe proof of concept when available.
4. If private reporting is unavailable, contact the repository maintainer through the GitHub profile without publishing exploit details.

Target response times are 72 hours for acknowledgement, 14 calendar days for critical fixes, and 30 days for other validated findings.

## Implemented security controls

- pull-request dependency review with a high-severity gate;
- NuGet transitive vulnerability auditing;
- npm high/critical vulnerability auditing;
- full-history Gitleaks secret scanning;
- weekly Dependabot monitoring for NuGet, npm, Docker, and GitHub Actions;
- SPDX SBOM generation;
- repository-integrity and clean-clone validation;
- fail-closed Guardian identity and device-trust foundations.

## Experimental or planned controls

| Control | Status |
|---|---|
| Hardware root of trust / Acing Vault | Experimental software emulation |
| Verified boot integration | Experimental |
| Runtime tamper detection | Experimental |
| Container vulnerability scanning | Planned |
| Container signing and provenance attestation | Planned |
| Hardware-backed credential wrapping | Planned |
| Production MFA enrollment | Planned |

## Known limitations

- Acing Vault currently provides software emulation, not hardware-backed guarantees.
- Guardian identity and trust integrations are foundation implementations requiring device-level production integration.
- Release candidates are evaluation builds and must not be represented as production-ready security products.
- Security scanners reduce risk but do not prove the absence of vulnerabilities.

See `THREAT_MODEL.md` for the current threat model.

## Maintainer

- GitHub: [@AcingTime420](https://github.com/AcingTime420)
