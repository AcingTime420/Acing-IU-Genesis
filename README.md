# Acing IU: Genesis

**Secure by Foundation. Personal by Choice.**

Acing IU: Genesis is a human-authority platform for AI-assisted actions.
**IU means Interface User:** the person decides what an agent may do, limits that
permission, can revoke it, and can inspect evidence of the outcome. Enforcement
operates independently of model output. AI can propose an action; it cannot approve
its own authority.

Genesis is under development. This branch contains local Development/Test
candidates with bounded validation evidence. It is not a production release.
The canonical repository is [AcingTime420/Acing-IU-Genesis](https://github.com/AcingTime420/Acing-IU-Genesis),
whose default branch is `master`. Candidate results do not establish deployed
capabilities on `master`.

## Capability status

The [capability register](docs/CAPABILITY_REGISTER.md) contains source locations,
commit-specific evidence and limitations. The states below use the current owner
classification; historical register labels retain their original provenance.

| Capability | Classification | Evidence and boundary |
|---|---|---|
| Exact document approval, execution, expiry, revocation and idempotent retry | VERIFIED IMPLEMENTED | Bounded Development/Test candidate; [Windows authority evidence](docs/evidence/windows-connected-validation-20261118.md). Prototype identity and loopback operation. |
| Reimbursement proposal, manager approval and separate agent execution | VERIFIED IMPLEMENTED | [Synthetic-record validation](docs/evidence/reimbursement-authority-20261122.md). Exact single-use USD approval; no payments or external financial transactions. |
| DeviceTrust ownership and transactional audit behavior | VERIFIED IMPLEMENTED | [Bounded HTTP/PostgreSQL evidence](docs/evidence/devicetrust-contract-20261120.md). Synthetic identity host; production identity and broader role policy remain review gates. |
| Local model to reimbursement proposal | EXPERIMENTAL | [Recorded Windows model trial](docs/validation/windows-real-local-inference-20261123.md) and [four adversarial cases](docs/validation/real-model-adversarial-20261123.md). Model recommendations remain advisory; broad reliability and injection resistance are unverified. |
| Mock authority UI, device dashboards and Vault emulator | SIMULATED | Fixtures and software emulation do not establish live device protection or hardware-isolated storage. Connected reviewer routes have their own bounded evidence above. |
| Guardian security components | EXPERIMENTAL | Research sources in `system/security/guardian/`; the expected build Makefile is absent from this candidate. |
| Privileged device executor / RootMaster | UNSUPPORTED | Public controls remain unavailable; no verified device-changing executor. |
| Hardware attestation and cryptographic receipt integrity | PLANNED | No validated hardware attestation, independently authenticated receipts or tamperproof audit storage. |
| Production deployment | BLOCKED | Independent human review, production identity/recovery, privacy and operational readiness remain incomplete. |

Recorded Windows results describe their pinned application and harness revisions.
They are not new executions on this branch. Runtime-reported model metadata is not
independent attestation. No Samsung Knox certification, carrier certification or
finished operating system is claimed.

## Source layout and review

| Path | Purpose |
|---|---|
| `backend/HumanAuthority/` | Durable document and reimbursement authority prototype (.NET 10) |
| `backend/AuthorityCredentialFiles/` | Native credential-file safety helper (.NET 10) |
| `backend/LocalInference/` | Local model proposal boundary and deterministic tests |
| `backend/Identity/src/`, `backend/DeviceTrust/src/` | Canonical Identity and DeviceTrust APIs |
| `frontend/` | Next.js interfaces, simulated workflows and connected reviewer routes |
| `database/migrations/` | Authority database migrations; use only isolated test resources |
| `tests/`, `scripts/` | Regression tests, CLI tools and validation coordinators |
| `app/`, `system/security/guardian/` | Supporting Android/security research |
| `docs/` | Contracts, decisions, capability register, evidence and runbooks |

Develop under canonical `backend/`. The duplicate `acing-iu/backend/` is frozen,
and installer payloads are derived. Follow [repository governance](docs/governance/REPOSITORY_GOVERNANCE.md).
Start independent review with the [pinned review packet](docs/review/human-authority-local-ai-20261123.md).
Review is outstanding; passing automated checks do not count as completed human review.

## Validation without services or model downloads

Run from the repository root with Node 24+, Python 3.10+, Bash and Make for the
build-entrypoint regressions. These tests require no editable Python package
installation. The loopback transport test uses port 11434; run on an isolated host
with that port free. Do not stop another person's model service to run it.

```bash
python3 -B -m unittest discover -s tests -p 'test_*.py' -v
node --test backend/LocalInference/tests/*.test.mjs frontend/tests/genesis-real-inference-cleanup.test.mjs
node --experimental-strip-types --test frontend/tests/genesis-adapter.test.mjs frontend/tests/genesis-session.test.mjs frontend/tests/genesis-reimbursement-session.test.mjs
bash scripts/check-claim-surface.sh
```

Windows uses `python` where `python3` is unavailable. Linux skips the native
Windows credential IPC cases. Those skips do not validate Windows ACLs. Inference
tests inject model responses; they do not run an installed model.

For dependency-backed frontend checks, use the lockfile:

```bash
cd frontend
npm ci
npm run lint
npx --no-install tsc --noEmit
npm run build
cd ..
```

These are instructions, not a claim that those dependency-backed checks passed in
the current session. `npm test --if-present` is not test evidence: this package
uses named test scripts and has no default `test` script.

Backend requirements differ by project: the authority service/helper target .NET
10; the older backend solution includes .NET 8 projects. Inspect the applicable
project and CI job before building. PostgreSQL-backed tests and migrations require
new disposable databases. See the [authority setup](docs/prototypes/genesis-live-integration.md),
[reimbursement setup](docs/prototypes/genesis-reimbursements.md),
[local inference guide](backend/LocalInference/README.md) and
[recovery runbook](docs/operations/authority-stabilization-review.md).

## Legacy validation limits

`scripts/validate-premerge.sh` is a partial legacy baseline. It can skip missing
toolchains and only discovers root-level Compose files; the tracked stack is under
`infrastructure/`. A zero exit code does not establish complete platform validation.
It can also create a root `.env` from the example.

`scripts/validate-premerge.ps1` has different scope and no `-SkipBuild` parameter.
It uses `infrastructure/.env`, starts services, applies migrations and performs
Compose cleanup. Inspect it before use; it must not target an existing owner or
production stack. It is not a read-only check and is not equivalent to the Unix
validator. Neither validator alone establishes readiness for release.

`bash build.sh` fails when the expected Guardian Makefile or artifacts are missing.
The fail-closed repair prevents false success; it does not restore the missing
Guardian build system or produce an operating-system image.

## Documentation and reporting

- [Architecture](ARCHITECTURE.md) and [architecture decisions](docs/adr/README.md)
- [Security reporting](SECURITY.md) and [threat model](THREAT_MODEL.md)
- [Contributing](CONTRIBUTING.md), [release process](RELEASE_PROCESS.md) and [privacy](PRIVACY.md)
- [This stabilization and README reconciliation](docs/evidence/stabilization-readme-import-reconciliation.md)

Historical documents may describe earlier revisions; assess current claims against
source and pinned evidence. Report sensitive findings through `SECURITY.md`.

## License

License terms remain unresolved. Consult the maintainer before redistribution or
assuming an open-source license applies.
