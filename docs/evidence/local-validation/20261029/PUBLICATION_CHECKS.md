# Publication checks — documentation/evidence only

This record covers the selected public evidence, not an application or release certification. No full application suite was rerun for publication. The result table deliberately retains historical failures and source-head limits.

## Tool and first-pass verification

Portable **Gitleaks8.30.1** was downloaded from its [official release](https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1), only into private scratch. Before extraction/execution, the downloaded Windows x64 ZIP's SHA-256 matched **both** GitHub's asset digest and the separately downloaded official checksum entry:

```text
d29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e
```

The checksum file itself matched its published GitHub digest. No global tool installation, root-store/TLS change or dependency repair was needed for this scanner.

Initial public-directory scan: **PASS, exit0,0findings**,9files/55,803bytes before this check record was added. All nine new-file diffs were inspected; UTF-8/JSON, source-result counts, allowed file types and links checked successfully. Custom privacy review found no real machine name, personal user path, private network address, credential URL, key or token shape. An overly broad custom hostname pattern initially matched the standard lowercase Docker context `desktop-linux`; it was corrected to distinguish actual uppercase Windows hostnames. **No Gitleaks rule, threshold, ignore protection or detection finding was bypassed.**

## Final acceptance gate

Final acceptance status: **PASS for the selected documentation/evidence delta**. All 10 selected files passed directory Gitleaks and staged Gitleaks scans (exit 0, zero findings), exact staged-addition review and `git diff --cached --check` (exit 0). No deletion, generated binary, source/lock change or unrelated staged path was found. UTF-8/JSON, internal links and historical result counts passed. The canonical branch/SHA and all 40 original status paths and file hashes, 10 pre-existing local branch heads and the stash were unchanged. The staged scanner correctly reports zero historical commits in index mode while confirming that the staged content bytes were scanned. This final check record and any presentation-only edits must be rescanned before commit. Raw reports and complete command captures stay local. This does not certify application readiness, repository-wide history or remote CI.

The source inputs, raw originals and traceability limits are documented in [provenance](PUBLICATION_PROVENANCE.json) and [scope](PUBLICATION_SCOPE.md). No report path inside the publication points to a private absolute machine path.

## Reproduction shape

Run from a fresh worktree; store scan reports outside the publishable directory. `REVIEW_BASE` must be the reviewed base commit, not an arbitrary moving branch.

```text
gitleaks dir docs/evidence/local-validation/20261029 --redact=100 --no-banner --no-color --ignore-gitleaks-allow --report-format json --report-path <private-report-path>
gitleaks git --pre-commit --staged --redact=100 --no-banner --no-color --ignore-gitleaks-allow --report-format json --report-path <private-report-path>
git diff --cached --check
gitleaks git --log-opts=REVIEW_BASE..HEAD --redact=100 --no-banner --no-color --ignore-gitleaks-allow --report-format json --report-path <private-report-path>
```

Use supported syntax for the installed scanner. No baseline, disabled rule, weakened ignore file or `gitleaks:allow` exclusion is added. The local scope is the new evidence/delta, **not a repository-wide historical secret audit**. A clean scan is risk reduction, not proof of secret absence. Repository CI/security gates and independent human review still apply; the draft must not be automatically promoted or merged.
