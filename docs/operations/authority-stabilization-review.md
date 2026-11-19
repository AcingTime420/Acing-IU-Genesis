# Local authority stabilization: recovery and platform validation

Status: local prototype procedures, not release or pilot approval. Use synthetic
fixtures and newly created disposable databases. Review the current evidence
before running anything. Never reset a user database to make a test pass.

## Disable and preserve evidence

1. Stop the connected frontend and authority processes. Unset `GENESIS_LOCAL_LIVE`
   in their external environment. Confirm the actual listeners have stopped.
2. Preserve the PostgreSQL directory, private credentials and evidence separately.
   Protect backup and credential directories with native operating-system access
   controls. Do not place them in Git, browser bundles, shared folders or screenshots.
3. Back up with a `pg_dump` client of the server's major version. Restore into a
   **new** isolated database using matching `pg_restore`. Use `--exit-on-error`.
   Validate logical row counts/digests, constraints and an appropriate functional
   read before treating a backup as recoverable. Do not overwrite the source.
4. A version mismatch can fail before restore: the attempted PostgreSQL 17 client
   introduced `transaction_timeout` against server 16 in this task. It was not
   ignored. Matching-major client 16 successfully restored the authority snapshot.
5. Do not use `reset`, DROP SCHEMA or database deletion as application rollback.
   A test fixture's explicit reset is for its own disposable database only.

## Uncertain outcomes and credential recovery

A timeout or lost response does not prove an action failed. Reconcile using the
**original principal and idempotency key** before creating another attempt. The
CLI's `reconcile --key` operation reads recorded evidence; retries must retain the
original request body/fingerprint. A new key can authorize a different attempt.

Frontend restart deliberately ends in-memory reviewer sessions. Signing in again
does not restore, extend or create execution authority. A lost agent credential
must not be replaced by copying the human credential. Preserve old identifiers
and evidence; design and review credential revocation/replacement before using
real data. The current prototype has no approved production identity recovery.

## Windows validation — prepared, not executed here

No native Windows runner or PowerShell is available in the execution environment.
The CLI now refuses Windows credential creation/reading until native ACL validation
is implemented. Do not remove that check or bypass it to run the browser test.
Implement and test file ownership, allow-ACE restrictions, inherited access and
reparse-point handling against actual Windows APIs first. Unix `stat`/chmod and
mocking `os.name` are not Windows ACL verification.

Use a new isolated checkout/worktree containing the ordered patches. Preserve the
owner's normal checkout. Verify .NET 10 LTS and current patch, supported Node,
PostgreSQL tools and Python. The following PowerShell sequence is a reproduction
recipe for a Windows operator **after** the native ACL gate is repaired; it is not
a claim that the sequence or the gate was run on Windows.

```powershell
$ErrorActionPreference = 'Stop'
function Checked([scriptblock]$Command) {
    & $Command
    if ($LASTEXITCODE -ne 0) { throw "Validation command failed: exit $LASTEXITCODE" }
}
# Run from the new isolated repository root, not an existing dirty worktree.
Checked { git status --short }
Checked { dotnet --info }
Checked { node --version }
Checked { npm --version }
Checked { psql --version }
$scratch = Join-Path ([IO.Path]::GetTempPath()) ('genesis-review-' + [guid]::NewGuid())
New-Item -ItemType Directory -Path $scratch | Out-Null
$sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
$systemSid = [Security.Principal.SecurityIdentifier]::new('S-1-5-18')
$acl = Get-Acl -LiteralPath $scratch
$acl.SetAccessRuleProtection($true, $false)
$acl.SetOwner($sid)
foreach ($identity in @($sid, $systemSid)) {
    $rule = [Security.AccessControl.FileSystemAccessRule]::new(
        $identity, 'FullControl', 'ContainerInherit,ObjectInherit', 'None', 'Allow')
    $acl.AddAccessRule($rule)
}
Set-Acl -LiteralPath $scratch -AclObject $acl
$allowed = @($sid.Value, $systemSid.Value)
$unexpected = (Get-Acl -LiteralPath $scratch).Access | Where-Object {
    $_.AccessControlType -eq 'Allow' -and
    $_.IdentityReference.Translate([Security.Principal.SecurityIdentifier]).Value -notin $allowed
}
if ($unexpected) { throw 'Unexpected credential-directory access; stop.' }
$cluster = Join-Path $scratch 'postgres'
$fixtures = Join-Path $scratch 'fixtures.json'
$browser = Join-Path $scratch 'browser'
$env:PGHOST = '127.0.0.1'
$env:PGPORT = '55443'
$env:PGUSER = 'authority_test'
$env:PGDATABASE = 'postgres'
$env:ASPNETCORE_ENVIRONMENT = 'Test'
$env:GENESIS_TEST_DATABASE = 'Host=127.0.0.1;Port=55443;Database=genesis_authority_test;Username=authority_test'
$env:NEXT_TELEMETRY_DISABLED = '1'
Checked { initdb -D $cluster -U authority_test -A trust --encoding=UTF8 }
Checked { pg_ctl -D $cluster -l (Join-Path $scratch 'postgres.log') -o '-h 127.0.0.1 -p 55443' start }
try {
    Checked { psql -X -v ON_ERROR_STOP=1 -c 'CREATE DATABASE genesis_authority_test' }
    $env:PGDATABASE = 'genesis_authority_test'
    foreach ($configuration in @('Debug','Release')) {
        $env:DOTNET_HOST_TRACE = '1'
        $env:DOTNET_HOST_TRACEFILE = Join-Path $scratch ("host-$configuration.trace")
        Checked { dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj --configuration $configuration --logger trx --results-directory (Join-Path $scratch $configuration) }
    }
    Remove-Item Env:DOTNET_HOST_TRACE,Env:DOTNET_HOST_TRACEFILE
    # Suites reset their disposable schema; prepare new synthetic browser fixtures.
    Checked { python scripts/genesis-authority.py reset --confirm-database genesis_authority_test }
    Checked { python scripts/genesis-authority.py migrate }
    Checked { python scripts/genesis-authority.py --credentials $fixtures fixtures }
    # The repaired native guard must validate the resulting fixture ACL here.
    Push-Location frontend
    try {
        Checked { npm ci }
        Checked { npm run test:lint }
        Checked { npm run test:genesis }
        Checked { npm run test:genesis-session }
        Checked { npm run lint }
        Checked { npm run build }
        Checked { npx tsc --noEmit --incremental false }
        Checked { npm run test:genesis-live-http }
        Checked { npm install --prefix $browser --ignore-scripts --no-audit --no-fund playwright@1.65.0 }
        Checked { & (Join-Path $browser 'node_modules/.bin/playwright.cmd') install chromium --only-shell }
        Checked { node tests/genesis-connected-browser.mjs $fixtures $browser }
    } finally { Pop-Location }
} finally {
    Checked { pg_ctl -D $cluster -m fast stop }
    # Keep the private cluster/logs for review. Do not automatically delete evidence.
    Remove-Item Env:GENESIS_LOCAL_LIVE -ErrorAction SilentlyContinue
}
```

Trust authentication above is only for synthetic isolated loopback tests; it does
not protect against other local users and is not a production setup. The operator
must verify actual child-process runtime traces and distinguish full connected
Windows results from focused artifact/database-guard cases. Record exit codes,
source SHA and infrastructure failures. Do not publish raw traces/credentials.

## Hosted validation gate

After owner-authorized publication, require the exact candidate's CI matrix,
connected browser step, new lint checks, DeviceTrust canonical-source database
checks and explicit security audits. Inspect check-run head/merge tree equality,
job logs and submission results. Existing remote checks on #223 are historical
and do not cover these local commits. Do not dispatch workflows or submit a
dependency snapshot from this preparation task. There is no repository Gradle
submission workflow file in the inspected tree; inspect the GitHub-generated
submission job and its logs rather than inventing its configuration.

## Privacy, licensing and review gates

- Minimize logs; never log bearer credentials, connection strings or document text
  to diagnose enforcement. Give evidence access only to authorized principals.
- Agree on retention, export and deletion rules before collecting real data.
  Evidence immutability and privacy deletion requirements need explicit design.
- Backups contain principal hashes and document/evidence data; protect them as
  sensitive even when a dump is not executable authority.
- Application append-only behavior is not cryptographic tamper-proof storage.
- Inventory dependency licenses, notices and transitive obligations. A package
  license field or public repository does not settle contributor/IP ownership.
  No root LICENSE/COPYING file was found in this tree; an OpenAPI proprietary
  label is documentary, not proof of a complete licensing decision.
- Obtain owner decisions on founder/contributor assignments, AI tool terms,
  permitted testing/data handling and external terms with qualified review where
  needed. These are release decisions, not legal conclusions in this runbook.
- An independent human must review the exact publication candidate and rerun
  consequential enforcement cases. Another AI report is not that review.

## Proposed external-testing checklist — not approval

All must be dispositioned before inviting testers:

- Supported runtime/container slice selected; no unsupported launcher silently used.
- Current dependency, secret, claim and integrity checks reviewed.
- Windows native ACL and actual platform checks completed if Windows is supported.
- Loopback restrictions, separate credentials and explicit mode labels verified.
- Real HTTP/database concurrency, replay, revocation and failure rollback verified.
- Backup/restore, uncertain-outcome recovery and disabling rehearsed.
- Six unresolved historical example candidates privately checked for past use;
  any confirmed-used material revoked/replaced. Deletion does not revoke a key.
- DeviceTrust role policy, no-enrollment behavior, full JWT/launcher validation and
  OpenAPI schema reconciliation reviewed if DeviceTrust is included.
- Synthetic-data-only scope, logging/privacy/retention rules and licenses agreed.
- Independent human review and explicit owner authorization recorded.
