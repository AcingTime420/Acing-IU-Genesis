# Archive Manifest — 2026-08-17

## Source identity

| Property | Value |
|---|---|
| Source archive | `ContentAnalysisRequiredforTitleCreation.zip` |
| SHA-256 | `c18eb2e2fdc7ccc74430c4a9589dd715c62a0ed8125204c040ddbb2019b665d0` |
| Archive entries | 119 |
| File entries | 118 |
| Directory entries | 1: `Genesis CI/` |
| Extraction location | Isolated review directory outside the repository |

The original ZIP was preserved unchanged. The 119-versus-118 difference is the explicit `Genesis CI/` directory entry; it is not a missing file.

## Classification summary

| Classification | Count |
|---|---:|
| Current final documentation | 41 |
| One-time remediation script | 29 |
| GitHub or CI evidence | 23 |
| Destructive or high-risk validation utility | 11 |
| Unrelated or incomplete material | 6 |
| Encoded payload requiring inspection | 2 initial heuristic matches; corrected to 7 actual `.b64` entries |
| Reusable automated test | 2 |
| Reusable source code | 2 |
| Historical evidence | 2 |

The complete file-level manifest is retained in the review evidence bundle; this repository document records the corrected accounting and import policy.

## Seven Base64 entries

The archive contains these seven `.b64` entries:

1. `add_identity_auth_rate_limiting.tar.gz.b64`
2. `guard_swagger_development_only.tar.gz.b64`
3. `guard_swagger_exact.tar.gz.b64`
4. `guard_swagger_regex.tar.gz.b64`
5. `phase5_encrypted_backup_restore.ps1.b64`
6. `phase5_encrypted_backup_restore.tar.gz.b64`
7. `phase6_rate_limit_probe.tar.gz.b64`

All seven were decoded as inert data for type identification and archive-member listing only. The decoded members were not executed and are not imported into this branch.

## Duplicate evidence

The two files `_transfer_pr69_privilege_matrix.sql` and `pr69_privilege_matrix.sql` are exact duplicates with SHA-256 `c03e706464a677a4a38dc09cb64ffba913744e6157086f8dd3f3a61a38bd7897`. Neither duplicate is imported.
