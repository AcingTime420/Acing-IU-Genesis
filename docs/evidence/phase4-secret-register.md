# Secret Register — Acing-IU-Genesis (Phase 4, Task 4.2)

**Status:** Reviewed baseline  
**Version:** 1.0  
**Last updated:** 2026-09-13  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)  
**Related:** `docs/security/SUPPLY_CHAIN_FINDING_POLICY.md` §7, `SECURITY.md`, `.github/workflows/security.yml`

> **Metadata only.** No live secret values are stored in this repository. This register satisfies Phase 4 Task 4.2: ownership, approved destination, rotation rule, and leak-response procedure.

## 1. Operating standard

1. **Never commit secret values** — only IDs, descriptions, and procedures appear in git.
2. **Least privilege** — each secret is scoped to one approved destination and role.
3. **Rotate on any suspected leak**, regardless of severity, then audit.
4. **Leak response always:** contain → rotate → audit → document (Finding Register + security issue if needed).
5. **CI remains the gate** — Gitleaks must stay green on `master`.
6. **Injection** — production and CI use environment variables or the platform secret store; local developers use private `.env` files that are gitignored.

## 2. Secret inventory (metadata)

| Secret ID | Description | Owner | Approved destination | Injection method | Rotation rule | Last reviewed | Leak response |
|---|---|---|---|---|---|---|---|
| `SEC-DB-001` | PostgreSQL connection string (app role) | Maintainer / backend | Runtime env of Identity, DeviceTrust, Audit, Gateway | Env / compose secret | On compromise; quarterly review | 2026-09-13 | Revoke DB role password; rotate; audit `pg_stat_activity` and app logs; incident note |
| `SEC-DB-002` | PostgreSQL migrator / admin connection | Maintainer | Migration jobs only (not long-running APIs) | CI secret or local env | On compromise; before each major schema change | 2026-09-13 | Revoke; rotate; confirm no residual superuser grants on app roles |
| `SEC-JWT-001` | JWT signing key material | Identity service owner | Identity API process env | Env / secret store | On compromise; annual minimum | 2026-09-13 | Rotate key; invalidate refresh tokens; force re-auth; audit issuance logs |
| `SEC-MFA-001` | MFA secret encryption key (protector) | Identity service owner | Identity API process env | Env / secret store | On compromise; annual | 2026-09-13 | Rotate protector key; re-encrypt or reset MFA enrollments; audit |
| `SEC-REDIS-001` | Redis connection / ACL password | Platform owner | Gateway / session services | Env / compose secret | On compromise; annual | 2026-09-13 | Rotate ACL; flush sensitive keys if exposure window unknown |
| `SEC-GEMINI-001` | Gemini API key (dispatch/triage workflows) | Automation owner | GitHub Actions secrets only | `secrets.*` in workflow | On compromise; quarterly | 2026-09-13 | Rotate in provider console; purge workflow logs if echoed; disable workflow if needed |
| `SEC-GH-ACTIONS` | GitHub Actions / release automation token | Maintainer | GitHub-provided `GITHUB_TOKEN` or OIDC | Prefer OIDC; no long-lived PAT in repo | On compromise | 2026-09-13 | Revoke PAT if any; rotate; review audit log for unexpected workflows |
| `SEC-VAULT-001` | Acing Vault emulator key material | Research / Guardian | In-memory process only (non-production) | Generated at runtime | N/A (non-prod) | 2026-09-13 | Wipe process; no production impact |
| `SEC-DOCKER-REG` | Container registry push credentials (if used) | Maintainer | Release / container workflows only | Actions secrets | On compromise; annual | 2026-09-13 | Revoke registry token; rotate; confirm no unauthorized pushes |

## 3. Prohibited destinations

- Source files, fixtures, screenshots, or docs in git  
- Client-side Next.js bundles or public env (`NEXT_PUBLIC_*`) for any of the above  
- Chat logs, issue bodies, or PR descriptions  
- Unencrypted shared drives or personal email  
- Third-party AI prompts (device data and secrets must not be sent to external models)

## 4. CI and scanning

| Control | Location | Expectation |
|---|---|---|
| Gitleaks full-history scan | `.github/workflows/security.yml` | Fail job on finding |
| Dependency / secret-related PR review | `security.yml` dependency-review | Fail on high+ |
| `.gitignore` for `.env`, keys, certs | Repository root | Prevent accidental add |
| Claim-surface lint | `scripts/check-claim-surface.sh` | Block fixture emails / SIG-KNOX IDs |

False positives: document fingerprint in `.gitleaksignore` **only after** confirming the value is not a live secret or has been rotated.

## 5. Rotation procedure (generic)

1. Generate new material in the approved store.  
2. Deploy new value to the approved destination (rolling restart if needed).  
3. Revoke or disable the old value.  
4. Verify service health and auth paths.  
5. Record date in this register (Last reviewed) and, if leak-driven, in `docs/evidence/supply-chain-finding-register.md`.  
6. For JWT/MFA keys, force session invalidation as listed in the inventory row.

## 6. Leak-response procedure (detailed)

Aligned with supply-chain finding policy §7:

1. **Contain** — disable the compromised credential immediately.  
2. **Rotate** — issue new material; never reuse the exposed value.  
3. **Purge** — remove from git history if feasible; do not leave live values in old commits without rotation.  
4. **Audit** — review access logs, workflow runs, and DB sessions for unauthorized use.  
5. **Document** — Finding Register entry + private security advisory path per `SECURITY.md` if impact is user-facing.  
6. **Notify** — maintainer (`@AcingTime420`); third parties only if their systems were involved.

## 7. Ownership

Until a formal team roster exists, **@AcingTime420** is accountable for all rows. When roles split, update the Owner column without changing Secret IDs.

## 8. Review history

| Version | Date | Change |
|---|---|---|
| 0.1 | 2026-09-13 | Stub inventory |
| 1.0 | 2026-09-13 | Full register: expanded IDs, injection methods, prohibited destinations, rotation and leak procedures |

---

*This register is the authoritative Phase 4 Task 4.2 secret-management standard for Acing-IU-Genesis. It does not contain secret values.*
