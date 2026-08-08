# Glossary

| Term | Definition |
|------|------------|
| **Genesis** | First production foundation release of Acing IU (Identity + Device Trust + infra) |
| **IRP** | Implementation Readiness Package — this document set |
| **JTI** | JWT ID claim; used as Redis revocation key |
| **Trust score** | 0–100 device score from weighted telemetry (ADR-0004) |
| **Refresh family** | Set of rotated refresh tokens sharing `family_id`; reuse burns family |
| **Bounded context** | DDD service boundary (Identity, DeviceTrust, Firmware, …) |
| **Problem Details** | RFC 9457 error JSON (`type`, `title`, `status`, `detail`, `traceId`) |
| **Control plane** | Gateway + microservices + data stores operated via Docker Compose |
| **MCP token** | Local Windows tooling token from installer; not the platform JWT |
| **S0–S7** | Sprint indices from MASTER_IMPLEMENTATION_PLAN |
