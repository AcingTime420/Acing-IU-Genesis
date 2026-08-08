# Coding standards — Genesis

## Language

- C# 12 / .NET 8  
- Nullable reference types enabled  
- Async all the way for I/O  

## API

- Routes under `/api/{context}/`  
- Errors: problem+json with `traceId` = `HttpContext.TraceIdentifier`  
- No stack traces to clients in Production  

## Security

- No string-concat SQL  
- Secrets only from configuration/env  
- Log emails at INFO only when needed; never log passwords, tokens, MFA secrets  
- Authorization: `[Authorize]` default for trust APIs; auth endpoints explicit `[AllowAnonymous]`  

## Structure

- Controllers thin → services → repositories  
- SharedKernel: cross-cutting only (no Identity entities)  

## Definition of Done (per story)

- [ ] Builds in Release  
- [ ] Unit tests for pure logic  
- [ ] Audit event for security-relevant actions  
- [ ] OpenAPI updated if surface changed  
- [ ] No new Critical/High container vulns introduced  
- [ ] Smoke path still green  
