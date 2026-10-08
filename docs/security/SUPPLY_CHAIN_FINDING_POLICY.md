# Software Supply-Chain Finding Policy — Acing-IU-Genesis

**Status:** Active baseline  
**Effective:** 2026-09-13  
**Tracking:** Phase 4 Task 4.5 · [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)  
**Related:** `docs/evidence/phase4-security-baseline-checklist.md`, `docs/evidence/phase4-secret-register.md`, `.github/workflows/sbom.yml`, `.github/workflows/security.yml`, issue #62 (container digest pinning)

> This policy defines how supply-chain findings are detected, triaged, remediated, and recorded. It is the documented finding policy required by Phase 4 Task 4.5.

## 1. Scope

Covers all software that enters the Acing-IU-Genesis supply chain:

- Source dependencies (NuGet, npm, Gradle/Kotlin, shell scripts)
- Container base images and Compose service images
- GitHub Actions and third-party build actions
- Secrets and credentials in source or CI
- Generated artifacts (SBOM, images, release binaries)

Out of scope: runtime application logic vulnerabilities (tracked separately under the threat model and issue tracker).

## 2. Detection sources

| Source | What it catches | Cadence | Workflow |
|---|---|---|---|
| **SBOM generation** | Full dependency inventory (SPDX JSON) | On PR/push to `master`, weekly, manual | `sbom.yml` |
| **Dependency review** | New/changed vulnerable packages in PRs | On PR to `master` | `security.yml` (fail on high+) |
| **.NET audit** | Vulnerable NuGet packages (incl. transitive) | On PR/push/schedule | `security.yml` |
| **npm audit** | Vulnerable frontend packages | On PR/push/schedule | `security.yml` (fail on high+) |
| **Gitleaks** | Leaked secrets in git history | On PR/push/schedule | `security.yml` |
| **Claim-surface lint** | Unsupported Knox/certification/email claims | On PR/push | `ci.yml` / `repo-integrity.yml` |
| **Container digest lint** | Mutable `FROM` / Compose base tags | On PR/push | (enforced per #62 remediation) |
| **GitHub Dependabot / advisory DB** | Upstream CVEs | Continuous | GitHub Security tab |

All detection must remain green on `master`. A red check blocks merge via the `master-stabilization` ruleset.

## 3. Severity model

| Severity | Definition | Examples |
|---|---|---|
| **Critical** | Actively exploitable, remote, no auth, or secret exposure | Leaked production credential; RCE in a direct dependency with no patch |
| **High** | Significant impact, limited exploitability or requires auth | Transitive vuln with known exploit; mutable base image without digest |
| **Medium** | Limited impact or requires specific conditions | Low-severity transitive CVE; outdated but non-vulnerable action |
| **Low / Info** | Minimal risk or informational | License notice; cosmetic advisory |

CI currently fails the build on **High** and above for dependency review, .NET audit, and npm audit. Critical and High secret findings fail via Gitleaks.

## 4. Triage and response SLAs

| Severity | Acknowledge | Remediate / accept | Evidence required |
|---|---|---|---|
| Critical | 24 hours | 72 hours | Fix PR + advisory/issue link + SBOM diff |
| High | 72 hours | 14 days | Fix PR or documented exception |
| Medium | 7 days | 30 days or next release | Issue or VEX note |
| Low / Info | Next review cycle | Optional | Logged in finding register |

SLAs start from the detection timestamp (CI run or advisory publish). Extensions require a written exception (see §6).

## 5. Remediation paths

1. **Patch / upgrade** — preferred. Bump the dependency or base image to a fixed version/digest.
2. **Replace** — swap the component for a maintained alternative.
3. **Mitigate** — configuration or code change that neutralizes the vulnerable path without upgrading.
4. **Accept (exception)** — only for Medium/Low, or High with compensating control. Requires §6.
5. **Revoke (secrets)** — any confirmed secret leak: rotate immediately, regardless of severity (§7).

## 6. Exception process

An exception is allowed only when remediation is not feasible in the SLA and risk is accepted by the owner.

Required for every exception:

1. GitHub issue labeled `supply-chain-exception` with: finding ID, severity, rationale, compensating control, expiry date (max 90 days), and owner.
2. Entry in the Finding Register (§8) marked **Accepted**.
3. Re-review before expiry; either remediate or re-accept with updated rationale.
4. No Critical or unpatched High finding may be accepted without an explicit compensating control documented in the issue.

## 7. Secret-leak response

On any confirmed secret exposure:

1. **Contain** — revoke/rotate the credential immediately (see `docs/evidence/phase4-secret-register.md`).
2. **Purge** — remove from history if feasible; add to `.gitleaksignore` only after rotation and with a fingerprint.
3. **Audit** — review access logs and workflow runs for unauthorized use.
4. **Document** — incident note in the Finding Register and a security issue.
5. **Notify** — if a third-party or user-impacting service is affected, follow `SECURITY.md` disclosure process.

## 8. Finding register

Maintain `docs/evidence/supply-chain-finding-register.md` (created alongside this policy). Each entry records:

| Field | Description |
|---|---|
| Finding ID | `SCF-YYYY-NNN` |
| Source | SBOM / audit / Gitleaks / advisory / manual |
| Component | Package, image, action, or secret ID |
| Severity | Critical / High / Medium / Low |
| Status | Open / In progress / Remediated / Accepted / False positive |
| Detected | Date |
| Remediated | Date or N/A |
| Evidence | PR link, advisory URL, SBOM diff |
| Owner | Responsible party |
| Exception expiry | If accepted |

The register is reviewed at least monthly and before each release.

## 9. Provenance and attestation (target)

Current state: SBOM is generated and uploaded as a CI artifact; actions and container bases are digest-pinned.

Target (post-baseline): SLSA-style build provenance attestation for release artifacts, signed with GitHub OIDC, so consumers can verify the build originated from this repository at a recorded commit. Tracked as a follow-on task after Phase 4 exit.

## 10. Roles

| Role | Responsibility |
|---|---|
| **Owner (maintainer)** | Approves exceptions, signs off register reviews, owns Critical/High response |
| **CI** | Detects and blocks; does not remediate |
| **Contributor** | Fixes findings in their PR; opens issues for accepted risk |

## 11. Review cadence

- **Monthly:** register review, SLA compliance check, exception expiry sweep.
- **Per release:** full SBOM diff against prior release, confirm no accepted High/Critical without compensating control.
- **On incident:** ad-hoc review triggered by any Critical finding or secret leak.

---

*This policy is the authoritative finding-response procedure for the Acing-IU-Genesis supply chain. It does not replace `SECURITY.md` (vulnerability reporting) or the secret register; it governs how detected supply-chain findings are handled.*
