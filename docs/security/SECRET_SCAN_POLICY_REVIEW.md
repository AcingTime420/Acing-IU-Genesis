# Secret-scanning policy review

Status: narrowed candidate; historical exception provenance still requires review.
This document does not approve the outstanding human-requested changes on PR #94.

## Boundary and compatibility

Global allowlists default to OR matching. Combining a historical commit, path and
value-shape pattern without `condition = "AND"` independently excludes each path
and can suppress future credentials there. Both proposed historical exceptions
now require the commit, path and finding match together; default rules remain
enabled. JSON value patterns match the default rule's finding text, which omits
the key's opening quote; fixtures exercise that same boundary.

Additional AND-scoped historical exceptions cover the generated controller's
truncated, unsigned JWT example and the exact `placeholder_signing_key_32_chars`
and `placeholder_key_32_bytes` environment-template values. Each requires a
listed immutable commit and anchored path; no path-wide or commit-wide exemption
was added. The historical API access tokens end in an ellipsis, and its published
MFA example decodes to a plaintext greeting, not an operational enrollment secret.
These observations do not approve reuse of any published example in production
or resolve the outstanding review on PR #94.

The global `[[allowlists]]` syntax requires Gitleaks 8.25 or later. Both scanner
workflows select 8.30.1. The dedicated policy workflow additionally verifies the
official release SHA-256 and runs regression fixtures before its full-history
scan. The general workflow uses the pinned Gitleaks action's installer; selecting
the same version does not add checksum verification to that action. Both retain
nonzero finding failures and do not disable or replace other security gates.

## Reproducible validation

```bash
# With checksum-verified Gitleaks 8.30.1 available
python3 tests/security/test_gitleaks_policy.py --gitleaks gitleaks
gitleaks git . --config .gitleaks.toml --log-opts=--all --redact=100 --no-banner
```

The first command generates only temporary synthetic data. It checks default
credential-shaped canary detection in every exempted path and outside those
paths, Git and filesystem scans, all configured historical path/value-shape
combinations and every configured historical commit criterion, unrelated findings within
the same commit, and later-commit replays. It does not contact a credential issuer
or prove that every historical value was synthetic.

The second command is a real gate, not an expected-success demonstration. The
reported failure reproduced with 15 findings across 409 commits. Correcting the
JSON match boundary and scoping the verified historical template/mock findings
produced a passing scan over the same history. Different fetched-ref inventories
can produce different full-history counts; new findings still require triage.

## Historical evidence still required

An example-looking value, a generated-memory path, or a broad token-shaped regex
does not establish harmlessness. Inspect every actual finding's immutable commit,
path, line, rule and source context. Establish synthetic/non-credential provenance
before approving any waiver; otherwise remove the exception and address the
finding through the security process. Prefer exact reviewed finding scope over
general token shapes. Do not publish unredacted values in review evidence.

API examples separately retain the Bearer transport shape and use a consistent,
explicitly nonfunctional MFA placeholder. They do not implement authentication,
token issuance or real TOTP enrollment.

## General workflow compatibility

The pinned Gitleaks action otherwise defaults to 8.24.3, which predates this
policy's global allowlist syntax. Its explicit `GITLEAKS_VERSION=8.30.1` now
aligns it with the already checksum-verified dedicated policy workflow. Default
rules, full-history checkout, redaction, failure behavior, and narrow AND
conditions remain unchanged. This compatibility repair does not approve any
historical exception or dismiss the outstanding human-requested changes.
