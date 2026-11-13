# Repository ownership and protection review - November 13, 2026

Scope: remote repository metadata, complete recursive master tree listing,
selected governance files and workflows, ruleset details, and an indexed
copyright search. This is not a full security audit, legal opinion, account
audit, or historical file-by-file license audit.

Baseline: `4cf3181951ddc3366a193d49cb8ca32dce346bf7`.
All source observations below refer to that baseline unless described as live
settings. No evidence of theft was established by this review.

## Observations

| Area | Evidence | Result |
|---|---|---|
| Visibility | Repository metadata | Public; visibility unchanged. |
| Project license | README License section; recursive tree; metadata license=null | Explicitly undecided; no repository LICENSE file in reviewed tree. This does not prove absence of historical or per-file grants. |
| Third-party notices | Indexed copyright search | gradlew and gradlew.bat contain original-author Apache-2.0 notices; preserve them. Search is not exhaustive. |
| Stewardship | REPOSITORY_GOVERNANCE.md | @AcingTime420 is the accountable administrator and release authority. |
| Code owners | .github/CODEOWNERS | All paths assigned to @AcingTime420. This assigns review responsibility, not legal title. |
| Master ruleset | Active master-stabilization, ID 23200339 | PR required; one approving review; stale reviews dismissed; last-push approval and resolved review threads required; deletion and force-push protection. |
| Required checks | Same ruleset | Strict checks: Repository Integrity (no tracked artifacts), Backend Build & Test (.NET), Frontend Build & Test (Node.js). |
| Owner-review enforcement | Same ruleset | require_code_owner_review=false. CODEOWNERS alone does not require owner approval. |
| Bypass | Same ruleset | Repository administrator role has pull_request bypass. Review before changing; a sole owner cannot approve their own PR. |
| Release tags | Active release-tag-protection, ID 24706855 | v* creation, update, deletion and non-fast-forward restricted; administrator role has always bypass. |
| Release workflow | .github/workflows/release.yml | Checks annotated, GitHub-verified signed tag targeting current master; publishes assets and release automatically after validation. Signer identity allowlisting was not observed in that check. |
| AI write workflow | gemini-dispatch.yml and gemini-plan-execute.yml | /approve route gives plan execution contents:write and inherits secrets; dispatch accepts OWNER, MEMBER or COLLABORATOR association. This is broader than an owner-only policy. Actual credentials, installations, enabled provider settings and runtime behavior are unverified. |
| Classic branch protection | API returned 403 Resource not accessible by integration | Unverified; this does not negate the independently retrieved active rulesets. |
| Account security | No account-security inspection available | MFA, passkeys, recovery methods, sessions, SSH keys, PATs and app grants unverified. |
| Backup | No backup or restore performed | Remote source inspection is not a recoverable backup. |

Rulesets:
- [Master](https://github.com/AcingTime420/Acing-IU-Genesis/rules/23200339)
- [Tags](https://github.com/AcingTime420/Acing-IU-Genesis/rules/24706855)

## Changes proposed by this documentation PR

- Add a qualified founder/stewardship and provenance record.
- Add contribution provenance and AI-assistance disclosure guidance without
  imposing a license or pretending to execute a rights assignment.
- Correct contribution instructions to name master, the canonical branch.
- Record an actionable account and recovery checklist.

No runtime code, workflow permissions, rulesets, license, visibility, credentials,
release settings or existing copyright notices are changed.

## Next actions in priority order

1. Owner: secure GitHub and recovery email with strong authentication, independent
   recovery methods and privately stored recovery codes; review integrations and
   revoke unnecessary access only after checking development dependencies.
2. Owner: decide whether every merge must require owner review. Evaluate code-owner
   approval together with the current administrator bypass and sole-maintainer
   review constraints before editing rules.
3. Engineering follow-up: define whether AI write execution is owner-only. If so,
   enforce the account-ID/actor check at both dispatcher and reusable workflow
   boundaries, including the original event author for reruns; test owner,
   collaborator, bot, fork, rerun and direct workflow-call cases. Do not equate
   comment association with exact action/scope approval. Audit inherited secrets.
4. Operator: make an encrypted off-device Git mirror backup covering all accessible
   refs; handle LFS, wiki, issues, PRs, attachments and release assets separately.
   Verify Git objects and restore into an isolated directory. Keep secrets separate.
   Capture unpushed Windows work privately; remote history cannot include it.
5. Licensing review: inventory per-file and historical terms, dependencies and
   contributor permissions before choosing commercial or open-source terms.
6. Brand/legal review: trademark clearance and registration strategy, human-authored
   copyright material, and any patent disclosure deadlines with qualified counsel.
   Do not spend money or submit declarations without the owner's decision.

## Verification and limitations

The reviewed tree was retrieved recursively; no executable project files are changed.
For this PR verify the changed-file list, relative document links, exact preservation
of existing contribution text outside the intended edits, and diff whitespace.
Application builds cannot validate ownership or account settings.
Account grants, private agreements, full contributor provenance, deployed controls,
secret scanning coverage and successful restoration remain unverified.

Reference guidance:
- [GitHub licensing](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository)
- [Copyright Office AI guidance](https://www.copyright.gov/ai/)
- [USPTO IP distinctions](https://www.uspto.gov/trademarks/basics/trademark-patent-copyright)
