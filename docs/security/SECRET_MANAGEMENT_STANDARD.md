# Acing IU: Genesis Secret-Management Standard

**Status:** Active security-baseline standard
**Owner:** Micki Hart, Founder / Lead Developer
**Applies to:** Local development, CI, container deployment, backup/recovery, Android tooling, and future AI-provider integrations.
**Classification:** Internal security control. This document intentionally contains **no secret values**.

## 1. Purpose

Genesis processes identity, device-trust, policy, database, and recovery data. This standard establishes how secret material is inventoried, stored, injected, rotated, audited, and revoked. It applies to values that can authenticate a user, service, system, device, provider, signing operation, or encrypted artifact.

A secret name is not a secret value. The names in the register below may appear in version-controlled configuration so that required configuration fails closed. Values must never be committed, embedded in container images, placed in frontend code, emitted in logs, pasted into issues or pull requests, or included in capability documentation.

## 2. Mandatory handling rules

1. **Use an approved store.** Production and CI values reside only in a protected platform secret store controlled by least-privilege identities. Local development values reside only in an ignored local environment file or an approved local secret manager.
2. **Fail closed.** A required identity, database, cache, MFA-protection, or signing secret must prevent a production-like service start if absent. No code may supply a known, sample, or silently generated production fallback.
3. **Do not expose values to clients.** Browser, Android, and other client applications may never contain database, JWT-signing, encryption, provider, release-signing, or administration credentials.
4. **Minimize scope and duration.** Each secret receives the smallest audience, permission set, environment scope, and lifetime compatible with its purpose. Separate development, CI, staging, and production material.
5. **Redact by design.** Logs, exception messages, diagnostics, support bundles, API responses, screenshots, and test output must exclude values and derived authentication artifacts such as bearer tokens, refresh tokens, authorization headers, database connection strings, recovery codes, signing keys, and encrypted-backup passwords.
6. **Record metadata, not material.** The register records purpose, owner, storage destination, consumer, rotation interval, and revocation procedure. It never records a plaintext value, a complete connection string, private-key body, certificate export, or recovery code.
7. **Rotate after exposure.** Suspected disclosure, inappropriate access, unauthorized export, repository history exposure, or compromised build identity requires immediate revocation or rotation and a documented incident record.

## 3. Approved storage and injection model

| Environment | Approved destination | Allowed injection method | Prohibited destination |
|---|---|---|---|
| Local development | Ignored `.env` file with restrictive local filesystem permissions, or an approved local secret manager | Process environment for a local command or Compose invocation; never baked into an image | Git, tracked examples containing real values, frontend `.env` variables, issue comments, and logs |
| CI | Repository/organization secret store with environment protection and least-privilege workflow access | Short-lived job environment variable or secret-mounted file where supported | Workflow YAML plaintext, unprotected artifacts, cache keys, job summaries, and third-party action inputs unless explicitly reviewed |
| Staging / production | Protected deployment secret manager or orchestrator secret facility | Runtime-only injection into the consuming service with an identity restricted to that environment | Container image layers, source control, public object storage, browser bundles, shared developer documents |
| Backup / recovery | Restricted recovery certificate/key store separated from routine application access | Dedicated backup/restore operation using a controlled operator identity | Application configuration, normal service containers, unencrypted archive, broad team share |
| External provider | Provider-specific protected secret store and a server-side runtime environment | Server-side adapter only, with usage/budget controls | Client applications, prompt payloads, device scripts, generated reports, or screenshots |

## 4. Secret metadata register

| Identifier / category | Purpose | Accountable owner | Consumers | Approved storage | Rotation / expiry | Immediate revocation trigger |
|---|---|---|---|---|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL administrative/bootstrap credential used only where explicitly required by Compose initialization | Founder / Lead Developer | PostgreSQL initialization and controlled administration | Environment-specific protected secret store; ignored local development environment file | At least every 90 days and after administrative access change | Suspected host, backup, CI, or administrator credential disclosure |
| `MIGRATOR_DB_PASSWORD` | Dedicated migration role credential | Founder / Lead Developer | Migration job only | Protected deployment/CI secret store; ignored local development environment file | At least every 90 days; immediately after migration-role use outside approved job | Migration job compromise, unexpected DDL, or leaked pipeline log |
| `IDENTITY_DB_PASSWORD` | Least-privilege Identity API database credential | Founder / Lead Developer | Identity API only | Protected environment secret store | At least every 90 days; coordinate rolling restart | Identity service compromise, credential exposure, or database access anomaly |
| `DEVICE_TRUST_DB_PASSWORD` | Least-privilege DeviceTrust API database credential | Founder / Lead Developer | DeviceTrust API only | Protected environment secret store | At least every 90 days; coordinate rolling restart | DeviceTrust service compromise, credential exposure, or database access anomaly |
| `REDIS_PASSWORD` | Redis authentication material | Founder / Lead Developer | Redis server and authorized service clients | Protected environment secret store | At least every 90 days; coordinate client update | Cache exposure, unauthorized client, or leaked configuration |
| `JWT_SIGNING_KEY` | Signs and validates access tokens | Founder / Lead Developer | Identity API only | Production-grade protected secret store with strict read access; distinct key per environment | Scheduled cryptographic rotation with overlapping validation window; immediate after compromise | Token forgery concern, key disclosure, identity service compromise, or key-owner change |
| `MFA_SECRET_PROTECTION_ACTIVE_KEY_ID` | Selects the active MFA-secret protection key version | Founder / Lead Developer | Identity API only | Protected configuration/secret store | Change only during reviewed key-rotation procedure | Invalid key selection, unauthorized configuration change, or key retirement |
| `MFA_SECRET_PROTECTION_KEY_MFA_V1` and successor versions | Encrypts or protects MFA seeds and recovery-related material | Founder / Lead Developer | Identity API only | Protected cryptographic key store / protected runtime secret store; separate export privileges | Rotate by versioned key migration; retain retired decrypt-only material only for documented migration window | Key disclosure, unauthorized export, loss of key custody, or completed migration |
| Database connection metadata | Locates service databases; a complete connection string is secret when it embeds credentials | Founder / Lead Developer | Services and migration job | Protected configuration plus separately injected password | Review per deployment; rotate with credential values | Any configuration disclosure that includes credentials or internal sensitive topology |
| Backup encryption certificate and private key | Encrypts/decrypts PostgreSQL backup artifacts | Founder / Lead Developer | Restricted backup/restore operator only | Segregated certificate/key store; never normal application configuration | At least annually and after recovery-personnel change; re-encrypt retained backups under approved plan | Private-key exposure, certificate misuse, or loss of operator trust |
| CI deployment / registry credentials | Publish verified artifacts and perform authorized deployment | Founder / Lead Developer | Protected CI release job only | CI secret store with environment approvals and least-privilege token | Prefer short-lived credentials; otherwise at least every 90 days | Workflow compromise, token appearing in logs/artifacts, or release-account change |
| AI provider key (future; provider-specific variable only after approval) | Authorizes server-side provider adapter | Founder / Lead Developer | Approved server-side AI adapter only | Protected deployment/CI secret store | Provider policy or at least every 90 days; enforce budget and scope review | Provider account anomaly, key disclosure, unauthorized data processing, or provider decommission |
| Android lab authorization / signing material (future) | Authenticates approved lab tooling and any signed evidence | Founder / Lead Developer | Explicitly approved lab process only | Segregated device-lab secret store | Per device-lab process and at least annually | Device loss, unauthorized tool use, or custody break |

## 5. Secret lifecycle procedures

### 5.1 Creation and onboarding

An owner must document the identifier, purpose, environments, consumer, scope, storage location, rotation interval, and emergency revocation path before a new secret is used. The secret must be generated through an approved cryptographic method or provider. The owner must verify that the consuming service fails closed when required material is absent and that only the intended runtime identity can read it.

A new secret may not be added to frontend configuration, committed example files, a Docker build argument, a Dockerfile `ENV` instruction, or a tracked test fixture. Test environments use distinct values that have no production authority.

### 5.2 Rotation

Rotation is a controlled change. The owner creates a replacement, updates the authorized runtime destination, validates the consumer through a safe smoke test, revokes the predecessor, and records the date and operator in the protected operational record. JWT and MFA-protection rotation must preserve only the minimum overlap required for valid token or protected-data migration; the overlap period, old-key retirement date, and rollback method require review.

Database and cache credential rotation must use a short cutover window, maintain distinct service roles, and verify that an old credential no longer authenticates. Backup-key rotation must include a deliberate decision about re-encrypting retained recovery artifacts and must never remove the only usable decryption material before the approved recovery retention period ends.

### 5.3 Exposure response

When a secret is suspected to be exposed, the discoverer immediately stops further sharing, opens a restricted incident record, and notifies the accountable owner. The owner identifies affected environments and consumers, revokes or rotates the material, invalidates dependent sessions/tokens where appropriate, checks source-control history, CI logs, artifact stores, container registries, and provider activity, and verifies normal service operation with the replacement.

The incident record must capture only safe metadata: identifier/category, detection time, affected environment, revocation time, scope, evidence location, corrective actions, and follow-up date. It must not contain the exposed value.

## 6. CI, build, and logging controls

| Control | Requirement |
|---|---|
| Source-control prevention | `.env`, local runtime state, certificate exports, backup plaintext, and generated secret files remain ignored. Pre-commit and CI secret scans are required once Phase 4 supply-chain controls are complete. |
| Workflow access | CI jobs receive only the secrets required by that job. Pull-request workflows from untrusted code must not receive deployment, registry, signing, or provider credentials. |
| Action and dependency review | A workflow may expose a secret only to reviewed, pinned, least-privilege steps. Third-party actions must not receive secrets unless explicitly justified and documented. |
| Output redaction | Do not use shell tracing, debug logs, direct environment dumps, or command-line arguments that reveal secret values. Test evidence must show only status, identifiers, hashes that are safe to publish, or redacted metadata. |
| Container construction | Build arguments, `ENV` layers, and committed image configuration must not contain values. Runtime injection is required. |
| Client boundary | Any identifier that reaches a browser or Android bundle is presumed disclosable. Server-side secrets cannot cross this boundary. |

## 7. Verification checklist

A change affecting secret handling is complete only when the following evidence exists:

1. The metadata register is updated without a plaintext value.
2. The secret is present only in the approved environment-specific destination.
3. A missing-secret test demonstrates fail-closed behavior without printing the expected value.
4. A normal service smoke test verifies that the intended consumer can start and authenticate to its dependency.
5. A denied-access test or configuration review verifies that unrelated services, pull-request jobs, and client bundles cannot access the material.
6. A repository, image, log, and artifact review shows no secret material.
7. The owner has documented the next rotation date and emergency revocation path.

## 8. Exceptions

Exceptions require written approval from the owner and must identify the secret category, exact deviation, compensating controls, affected environment, expiry date, and rollback plan. An exception may not authorize committing secret material, embedding it in a client, bypassing production rotation after exposure, or using a shared administrative database account for an application service.

## 9. Related controls

This standard supports the Phase 4 threat model, authentication/session hardening, server-side authorization, software supply-chain controls, encrypted backup recovery, Android safety controls, and governed AI-provider integration. Audit integrity remains blocked by [issue #60](https://github.com/AcingTime420/Acing-IU-Genesis/issues/60) and must not rely on secret management alone.
