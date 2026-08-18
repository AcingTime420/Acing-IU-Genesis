# Import Decisions — Archive Reconciliation

## Approved for import

| Destination | Material | Decision |
|---|---|---|
| `docs/status/CURRENT_PROJECT_STATUS.md` | Current reviewed project status and base justification | Import |
| `docs/evidence/archive-2026-08-17/ARCHIVE_MANIFEST.md` | Corrected archive accounting and seven-payload inventory | Import |
| `docs/evidence/archive-2026-08-17/SECURITY_REVIEW.md` | Static-review interpretation and security boundary | Import |
| `docs/evidence/archive-2026-08-17/IMPORT_DECISIONS.md` | This decision record | Import |
| `docs/evidence/archive-2026-08-17/archive_manifest.tsv` | File-level inventory with hashes/classifications | Import |
| `docs/evidence/archive-2026-08-17/b64_accounting.tsv` | Exact accounting of all seven `.b64` entries | Import |
| `docs/evidence/archive-2026-08-17/b64_decoded_manifest.tsv` | Inert decoded type/hash/member metadata | Import |
| `docs/evidence/archive-2026-08-17/duplicate_report.tsv` | Exact duplicate evidence | Import |
| `docs/evidence/archive-2026-08-17/static_security_findings.tsv` | Redacted static pattern findings | Import |
| `docs/evidence/archive-2026-08-17/REPOSITORY_INSPECTION_RECONCILIATION.md` | Repository-state and branch-base reconciliation | Import |

## Explicitly excluded

| Exclusion | Reason |
|---|---|
| All seven `.b64` source payloads | Encoded executable/archive material; evidence only |
| All decoded PowerShell and command members | Executable content not approved for import |
| Destructive SQL | Potentially destructive database operations; not needed for documentation evidence |
| One-time patch/remediation generators | Historical procedures, not reusable source |
| Obsolete source fragments | Risk of reintroducing superseded behavior |
| `_transfer_pr69_privilege_matrix.sql` and `pr69_privilege_matrix.sql` | Exact duplicate group |
| Secret-bearing material | Must not enter the branch |
| `.refact/buddy` runtime metadata | User-owned runtime changes; preserved in named stashes and untouched |
| Incomplete `SKILL.md` | Incomplete/unapproved operational instructions |
| Archive ZIP itself | Preserved outside the repository as source evidence |

## No code-fix scope

This branch contains documentation and non-executable evidence only. Any code correction, dependency change, migration, Docker change, or validation-resource change requires a separate purpose-specific review and is outside this import.

## Safety conditions

The canonical checkout remains untouched. Stashes remain untouched. Refact/Buddy remains stopped. No merge, deployment, release, secret change, credential change, production contact, encoded-payload execution, destructive SQL, or Docker-resource deletion is authorized.
