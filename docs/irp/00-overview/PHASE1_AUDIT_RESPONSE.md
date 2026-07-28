# Phase 1 audit response — remediation applied

Response to the independent Phase 1 package audit (archive integrity pass; score 68/100).

| Finding | Severity | Remediation |
|---------|----------|-------------|
| 1. Tests missing | High | Added `tests/Identity.UnitTests` and `tests/DeviceTrust.UnitTests` (xUnit); solution updated |
| 2. CI test glob unreliable | High | `find tests -name '*.csproj'` + **fail if none** |
| 3. OpenAPI `\|\| true` | High | Lint fails the job; pinned `@redocly/cli@1.25.15` |
| 4. Floating action branches | Medium–High | Pinned `checkout@v4.2.2`, `trufflehog@v3.88.2`, `trivy-action@0.28.0`, etc. |
| 5. SharedKernel unreferenced | Medium | `ProjectReference` added to Identity + Device Trust APIs |
| 6. Not a complete repo | Info | Added root `README.md`, `.gitignore`, `.editorconfig`, `SECURITY.md`, `.github/workflows/` |
| 7. Architecture frozen premature | Governance | Documented as **candidate baseline** pending validation |

## Still not demonstrated in this environment

- `dotnet build` / `dotnet test` (SDK may be absent in sandbox)
- Live `docker compose` smoke
- Phase 2 DB audit

## Governance status

```text
Architecture candidate: Genesis v1.0
Implementation baseline: Pending validation
```
