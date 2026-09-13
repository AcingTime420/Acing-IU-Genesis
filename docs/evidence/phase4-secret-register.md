# Secret Register — Acing-IU-Genesis (Phase 4, Task 4.2)

**Status:** Stub — full register pending  
**Last updated:** 2026-09-13  
**Tracking:** [#58](https://github.com/AcingTime420/Acing-IU-Genesis/issues/58)

> Metadata only. No live secret values are stored here. This register satisfies the Phase 4 Task 4.2 requirement for ownership, approved destination, rotation rule, and leak-response procedure.

## Secret inventory (metadata)

| Secret ID | Description | Owner | Approved destination | Rotation rule | Leak response |
|---|---|---|---|---|---|
| `SEC-DB-001` | PostgreSQL connection string | Backend team | Environment variable / secret store (never committed) | On compromise; quarterly review | Revoke credentials, rotate, audit access logs, file incident note |
| `SEC-JWT-001` | JWT signing key (RS256/HS256) | Identity service | Secret store / env | On compromise; annual | Revoke key, re-issue tokens, invalidate sessions |
| `SEC-GEMINI-001` | Gemini API key (dispatch/triage workflows) | Automation | GitHub Actions secrets | On compromise; quarterly | Rotate key, audit workflow runs, disable affected workflow |
| `SEC-GH-TOKEN` | GitHub token for CI / release | CI | GitHub-provided OIDC / Actions secrets | On compromise | Revoke token, rotate, review audit log |
| `SEC-VAULT-001` | Acing Vault emulator key material | Guardian / research | In-memory only (emulator) | N/A (non-production) | Wipe emulator state; no production impact |

## Rules

1. **No live values in git.** Only metadata, IDs, and procedures.
2. **Least privilege.** Each secret is scoped to its approved destination.
3. **Rotation on any suspected leak**, regardless of severity.
4. **Leak response** always includes: contain, rotate, audit, document.
5. **Scanning:** Gitleaks + dependency/secret scanning in CI (`security.yml`) must remain green.

## Next steps

1. Populate real ownership assignments once team roles are defined.
2. Add rotation evidence (last rotated date) per secret.
3. Link each secret to its storage location and access policy.
4. Move status from Stub to Reviewed after first full pass.
