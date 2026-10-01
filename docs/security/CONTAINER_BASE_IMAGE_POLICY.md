# Container Base-Image Integrity Policy

**Status:** Active Phase 4 supply-chain control  
**Owner:** Project maintainer  
**Scope:** Production Dockerfiles and Compose manifests in the canonical Genesis repository.  
**Target platform:** Linux `amd64` validation environment. Multi-architecture support requires separate approved digests and an explicit platform decision.

## Purpose

Container tags are mutable references. Genesis therefore pins each approved external build, runtime, database, cache, and gateway image to an immutable SHA-256 manifest digest. A readable tag remains in the reference to convey the intended upstream version family, but the digest is authoritative for reproducibility.

This control applies to external references in the Identity, DeviceTrust, and Gateway Dockerfiles and to PostgreSQL, Redis, and Nginx references in the Compose topology. Locally built Compose images are validated through their pinned Dockerfile stages.

## Approved image references

| Role | Human-readable tag | Approved Linux amd64 digest | Source files |
|---|---|---|---|
| API build stage | `mcr.microsoft.com/dotnet/sdk:8.0` | `sha256:5dfdb3b19e6900a3dc449760547a0a3fdd1f47900062d274d57e7ab725484c16` | Identity, DeviceTrust, and Gateway Dockerfiles |
| API runtime stage | `mcr.microsoft.com/dotnet/aspnet:8.0` | `sha256:149d139eb6f11b9be8bc99c4d8cbd14f662d64d83359079ebb59e5f4a97bbefe` | Identity, DeviceTrust, and Gateway Dockerfiles |
| PostgreSQL service | `postgres:16-alpine` | `sha256:075f7ba66bc9b3ce7d6b8b635208ff61cd7cf1a67d71ec530eec5d7ae0cbe571` | Compose manifests |
| Redis service | `redis:7-alpine` | `sha256:9702d01c1f10c3ea9f48211b4362e44f154ff02d063e6f7268eba804059f53bf` | Compose manifests |
| Nginx gateway service | `nginx:1.27-alpine` | `sha256:62223d644fa234c3a1cc785ee14242ec47a77364226f1c811d2f669f96dc2ac8` | Infrastructure Compose manifest |

## Review and update procedure

1. Obtain replacement digests from the upstream registry for the intended deployment architecture.
2. Record old/new references and why the change is needed.
3. Build from a clean checkout and run Compose validation, service health, migration, smoke, and vulnerability checks.
4. Review dependency, vulnerability, license, SBOM, and provenance evidence; a digest resolving successfully is not sufficient approval.
5. Keep the prior reviewed digest as the rollback target until the replacement is validated.

## Automated enforcement

`scripts/validate-container-image-digests.sh` rejects mutable external Dockerfile and Compose image references. The pull-request container workflow also builds and scans the canonical Identity and DeviceTrust images. A green static pinning check does not by itself prove that an image is vulnerability-free.
