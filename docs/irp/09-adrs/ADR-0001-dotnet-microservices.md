# ADR-0001: ASP.NET Core 8 microservices for Identity and Device Trust

- **Status:** Accepted  
- **Date:** 2026-07  

## Context

Genesis requires authenticated APIs, JWT, Redis revocation, and Postgres persistence with strong typing and mature security libraries.

## Decision

Use **ASP.NET Core 8** minimal/controller APIs, one deployable per bounded context (`AcingIU.Identity.Api`, `AcingIU.DeviceTrust.Api`), shared `AcingIU.SharedKernel` for Result/ProblemDetails only (no shared domain model).

## Consequences

- Aligns with Master Plan S2/S3 and existing CircleCI/.NET mentions  
- Team must run Docker for integration; local `dotnet run` supported with appsettings  
- Alternative considered: Node Fastify — rejected for crypto/JWT ecosystem preference on server  
