# DeviceTrust ownership regression host

This test project links the canonical DeviceTrust controller, service, repository,
models and score engine. It hosts them on real loopback HTTP with a synthetic
identity handler and real disposable PostgreSQL. It is **not** evidence for the
existing net8.0 application's launcher, JWT authentication, containers, hardware
attestation, or production readiness.

Supply `GENESIS_DEVICETRUST_TEST_DATABASE` for a newly created database named
exactly `genesis_devicetrust_test` at `127.0.0.1`. The fixture holds a PostgreSQL
advisory lease, then resets only `devicetrust_test` in that database. It extracts
the registered-device, audit and policy table definitions from canonical SQL.
The users fixture contains synthetic UUIDs only; full Identity migrations and
service-role permissions are not validated here. Never use a user database.

Run both configurations:

```sh
dotnet test tests/DeviceTrust.OwnershipTests/DeviceTrust.OwnershipTests.csproj --configuration Debug
dotnet test tests/DeviceTrust.OwnershipTests/DeviceTrust.OwnershipTests.csproj --configuration Release
```

The 17 cases cover owner/foreign/unknown/unowned/privileged boundaries, invalid
and absent identity, actual denial responses, audit rollback and privacy, denial
audit failures, concurrent writes and ownership transfer during a lock wait.
Admin/Operator access is the explicit policy inherited from PR #135; its broader
role policy still requires owner/independent review before release. Telemetry no
longer enrolls devices. An enrollment workflow is outside this repair.

Source repair was adapted from four canonical DeviceTrust files in PR #135 head
`016f3a0ebbcaa551d18ba746896ac8cd7793c48a`, not the unrelated files in that PR.
This candidate additionally makes required denial-audit failures unavailable,
rejects an empty subject UUID, returns explicit problem JSON unaffected by the
controller's JSON production attribute, and redacts database errors. PR #107 and
#135 remain separate unmerged candidates; reconcile overlapping changes before
publication rather than merging both blindly.
