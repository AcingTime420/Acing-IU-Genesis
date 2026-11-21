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

Four additional `HealthPrivacyTests` cases host the canonical health controller
on anonymous loopback HTTP. Synthetic database, timeout and configuration
exceptions must produce a generic JSON 503 without private diagnostics; liveness
must remain available without opening a database connection. These cases require
no PostgreSQL and can be selected with `--filter FullyQualifiedName~HealthPrivacyTests`.
The full suite still requires the disposable database described above. These
failure-path cases do not validate successful readiness against real PostgreSQL.

Seven `ContractHttpTests` cases exercise minimal/defaulted telemetry, unknown
request properties, required-field rejection, owned and foreign lookup, privileged
listing, role denial and anonymous authentication. The two database test classes
share a named xUnit collection so their guarded schema resets cannot race.

To validate actual HTTP request/response observations against OpenAPI 3.1:

```sh
python3 -m pip install -r tests/DeviceTrust.OwnershipTests/contract-requirements.txt
python3 scripts/validate-devicetrust-contract.py --configuration Release
```

Supply the same disposable database as above. The runner validates 11 HTTP
observations (seven contract cases plus four health cases) using JSON Schema
2020-12, including format checks, and removes temporary observations afterward.
CI performs this check in Debug and Release. The fixture authentication remains
synthetic: these tests do not establish production JWT challenge conformance,
successful readiness, every invalid-input path or full API conformance.

Source repair was adapted from four canonical DeviceTrust files in PR #135 head
`016f3a0ebbcaa551d18ba746896ac8cd7793c48a`, not the unrelated files in that PR.
This candidate additionally makes required denial-audit failures unavailable,
rejects an empty subject UUID, returns explicit problem JSON unaffected by the
controller's JSON production attribute, and redacts database errors. PR #107 and
#135 remain separate unmerged candidates; reconcile overlapping changes before
publication rather than merging both blindly.
