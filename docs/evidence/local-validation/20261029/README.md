# Genesis local validation evidence — 2026-10-29

**Overall determination: BLOCKED / NOT RELEASE-READY.** This documentation-only publication preserves the useful results of an authorized Windows recovery and staged validation. It is a curated, sanitized summary, not a claim that the current integration branch or a combined candidate passed every gate.

Prepared by **Manus AI**, from the original local reports dated 2026-10-27 and 2026-10-29. Originals, authorship, raw logs and private diagnostics are preserved locally; this publication deliberately omits personal paths, host/account identity, credentials, internal network details, caches and binaries. The maintainer authorized this isolated publication; independent source/release review is still required.

## Read in this order

1. [Validation results and limits](VALIDATION_RESULTS.md), with [allowlisted result data](VALIDATION_RESULTS.json).
2. [Frontend dependency findings](FRONTEND_SECURITY.md).
3. [HumanAuthority Windows test analysis](HUMANAUTHORITY_WINDOWS.md).
4. [Docker Engine blocker](DOCKER_ENGINE.md).
5. [Codex remediation handoff](CODEX_HANDOFF.md).
6. [Publication classification and exclusions](PUBLICATION_SCOPE.md).
7. [Provenance](PUBLICATION_PROVENANCE.json) and [publication checks](PUBLICATION_CHECKS.md).

## Source heads are not interchangeable

| Logical evidence source | Exact tested SHA | Scope |
|---|---|---|
| Canonical checkout / isolated C67 source | `67ce0fc02505885148cefdab1d063ca9a5555146` | Backend, frozen frontend, Android and preliminary source review. Dirty canonical lockfile was not the frozen tested lock. |
| Guardian PR #179 | `aec5d75b726cbe88da7ecd62a5088ccc7475bd0c` | Guardian build, fixture regressions, packaging checks and isolated SQL baseline. |
| HumanAuthority PR #164 | `a2e72020b311b93a14e14a7a56202b65fe3c66a1` | Complete external PostgreSQL-backed suite; one Windows artifact assertion fails. |
| DeviceTrust ownership local candidate | `e9b762fecd01640f69677d5a05559a95d9e44d8a` | Authorization/unit and PostgreSQL ownership tests. The remote #107 head has since advanced one commit. |

These successes are historical at their own heads. No application build/test suite was rerun just to publish this evidence, and none is attributed to this documentation branch or to the newer DeviceTrust head.

## Reconciliation before publication

A fresh ordinary fetch established:

- The active local `copilot/copilotreview-acing-iu-genesis` branch remains at C67 and has **0 local-only / 3 remote-only commits** relative to its upstream at `05f21a8ce346526ba5ab3d83deeeb29868d42936`. Those remote-only commits remove an accidental self gitlink and unrelated agent files. PR #143 is merged. The existing checkout was not pulled, rebased, merged or repointed.
- No existing local branch commit is absent from all fetched origin refs. The local DeviceTrust head is an ancestor of remote #107 at `4e1a51f87bdbcbc0fede2cf686d8f5467bbd7b2d`; its one newer commit strengthens privilege coverage and documents reconciliation. That newer head was **not** tested in the preserved local run.
- This publication branch, `docs/genesis-local-validation-evidence-20261029`, was created in a new worktree from fetched `origin/master` at **`4cf3181951ddc3366a193d49cb8ca32dce346bf7`**, not from the stale Copilot worktree. This avoids carrying unrelated source changes into an evidence PR.
- An authenticated GitHub branch metadata query reports `master.protected: true`. This is a current protection flag, not an audit of every rule required by stabilization policy. Issue [#54](https://github.com/AcingTime420/Acing-IU-Genesis/issues/54) remains open; no policy, permissions or issue state was changed.

## Remaining blockers

The saved C67 frontend audit exits 1. HumanAuthority's complete UTF-8 suite is 76/77, with a separator-dependent artifact-location assertion failing on Windows. Docker Engine does not answer API probes despite a running Desktop and WSL2; its internal cause remains unproven. Exact PostgreSQL 16 image, Compose runtime, full cross-component E2E, Android device/release and Guardian production integration gates remain unverified.

See [Codex handoff](CODEX_HANDOFF.md) for exact corrections and reviewer decisions. This publication does not merge dependency/build PRs, close stabilization work, approve a Docker restart, deploy services or authorize a release.
