# Secret-scanning policy review

Status: narrowed candidate; historical exception provenance still requires review.
This document does not approve the outstanding human-requested changes on PR #94.

## Boundary and compatibility

Global allowlists default to OR matching. Combining a historical commit, path and
value-shape pattern without `condition = "AND"` independently excludes each path
and can suppress future credentials there. Both proposed historical exceptions
now require the commit, path and finding match together; default rules remain
enabled. No new exception, path, commit or value pattern was added.

The global `[[allowlists]]` syntax requires Gitleaks 8.25 or later. The dedicated
policy workflow pins 8.30.1, verifies the official release SHA-256 before running
it, runs regression fixtures, and preserves a nonzero full-history scan result.
It does not disable or replace other security gates.

## Reproducible validation

```bash
# With checksum-verified Gitleaks 8.30.1 available
python3 tests/security/test_gitleaks_policy.py --gitleaks gitleaks
gitleaks git . --config .gitleaks.toml --log-opts=--all --redact=100 --no-banner
```

The first command generates only temporary synthetic data. It checks default
credential-shaped canary detection in every exempted path and outside those
paths, Git and filesystem scans, all configured historical path/value-shape
combinations and both auth-example commit criteria, unrelated findings within
the same commit, and later-commit replays. It does not contact a credential issuer
or prove that every historical value was synthetic.

The second command is a real gate, not an expected-success demonstration. The
local review scan remained nonzero with candidate findings after narrowing. A
redacted inventory was retained for maintainer review; findings must be triaged
rather than suppressed to obtain green CI. Different fetched-ref inventories can
produce different full-history counts.

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
