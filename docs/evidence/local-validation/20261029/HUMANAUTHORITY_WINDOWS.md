# HumanAuthority Windows artifact-path failure

**Confirmed test-portability defect; not a demonstrated authorization defect.** Tested source: `a2e72020b311b93a14e14a7a56202b65fe3c66a1`, matching the freshly verified open draft [PR #164](https://github.com/AcingTime420/Acing-IU-Genesis/pull/164) head. The preserved complete UTF-8 PostgreSQL-backed suite executed **77 tests:76 passed,1 failed,0 skipped; child exit1**. No correction or post-correction suite pass is claimed.

## Reproduction and actual value

Failing test: `HumanAuthority.IntegrationTests.BackendArtifactTests.ArtifactPathMatchesTestBuildConfiguration`, `tests/HumanAuthority.IntegrationTests/BackendArtifactTests.cs:14`.

It checks the raw assembly metadata path using:

```csharp
Assert.Contains($"{Path.DirectorySeparatorChar}{configuration}{Path.DirectorySeparatorChar}", artifact);
```

Windows expects `\Release\`. The actual generated metadata has a native prefix but a forward-slash tail:

```text
<isolated-source-root>\tests\HumanAuthority.IntegrationTests/../../backend/HumanAuthority/bin/Release/net8.0/HumanAuthority.dll
```

The private absolute prefix has deliberately been replaced; the mixed separators and relative tail are retained exactly. The project emits this metadata from:

```xml
<AssemblyMetadata Include="HumanAuthorityArtifact"
                  Value="$(MSBuildProjectDirectory)/../../backend/HumanAuthority/bin/$(Configuration)/$(TargetFramework)/HumanAuthority.dll" />
```

The failure says `Assert.Contains() Failure: Sub-string not found`, missing `\Release\`. Its actual configuration component is `/Release/`. Filesystem APIs accept it; a raw substring does not normalize it.

## Evidence and non-causes

A pure path check with `Path.GetFullPath` yields:

```text
<isolated-source-root>\backend\HumanAuthority\bin\Release\net8.0\HumanAuthority.dll
```

The raw substring check is false and the normalized check is true. The DLL, `.deps.json`, and `.runtimeconfig.json` exist, and the immediate configuration directory is Release. This check exited0 with **test count0**; it is diagnosis, not a new suite result.

Casing is consistent. The raw path is rooted by MSBuildProjectDirectory; intentional `../..` segments resolve correctly. The separate temporary-directory negative tests passed and do not explain this method's failure. The three inspected archived source files match their Git text after only CRLF-to-LF normalization; they are not byte-identical to LF blobs. No fresh Unix run was performed.

The assertion checks artifact/build-configuration location. It does not exercise approval, authorization, revocation, idempotency, evidence ownership or database concurrency. The real HTTP fixture launched successfully, and those independent security tests executed. This does not justify deleting the artifact assertion.

## Minimal Codex correction

```diff
-        Assert.Contains($"{Path.DirectorySeparatorChar}{configuration}{Path.DirectorySeparatorChar}", artifact);
+        var normalizedArtifact = Path.GetFullPath(artifact);
+        Assert.Contains($"{Path.DirectorySeparatorChar}{configuration}{Path.DirectorySeparatorChar}", normalizedArtifact);
         AuthorityFixture.ValidateBackendArtifact(artifact, configuration);
```

Retain the configuration requirement, runtime-file checks and no-Debug-fallback behavior. Do not skip Windows, replace the test with mere file existence, alter service authorization or remove security assertions. Any stronger component-based configuration check is a separate scoped improvement.

## Acceptance after a reviewed source change

Use a fresh isolated worktree at the new SHA. Build the Release test project, run the single affected test, then all BackendArtifactTests, then the complete HumanAuthority suite on a new verified UTF-8 loopback PostgreSQL cluster with a fresh `_test` database and scoped roles. Keep the existing external-target guard and independently prove cluster identity before fixtures drop schemas. Preserve the first failed run and use new log/TRX paths.

```text
dotnet build tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj -c Release
dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~ArtifactPathMatchesTestBuildConfiguration
dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj -c Release --no-build --no-restore --filter FullyQualifiedName~BackendArtifactTests
dotnet test tests/HumanAuthority.IntegrationTests/HumanAuthority.IntegrationTests.csproj -c Release --no-build --no-restore
```

Keep missing-Release/no-Debug-fallback and missing-runtime-file negative tests. Require every test at the corrected head to execute and pass without skips; record any count changes. Add Windows separator regression cases and a Unix lane if supported. No source patch or test rerun was performed for this publication.
