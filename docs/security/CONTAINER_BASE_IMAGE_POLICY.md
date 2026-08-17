# Container Base-Image Integrity Policy

**Status:** Active Phase 4 supply-chain control
**Owner:** Micki Hart, Founder / Lead Developer
**Scope:** Production Dockerfiles and Compose manifests in the canonical Genesis repository.
**Target platform:** Linux `amd64` validation environment. Multi-architecture support requires separate approved digests and an explicit platform decision.

## Purpose

Container tags are mutable references. Genesis therefore pins each approved external build, runtime, database, cache, and gateway image to an immutable SHA-256 manifest digest. A readable tag remains in the reference to convey the intended upstream version family, but the digest is authoritative for reproducibility.

This control applies to external references in the Identity, DeviceTrust, and Gateway Dockerfiles and to PostgreSQL, Redis, and Nginx references in the Compose topology. Locally built Compose images such as `acing-iu-*` are not external bases and are validated through their pinned Dockerfile stages.

## Approved image references

| Role | Human-readable tag | Approved Linux amd64 digest | Source files |
|---|---|---|---|
| API build stage | `mcr.microsoft.com/dotnet/sdk:8.0` | `sha256:5dfdb3b19e6900a3dc449760547a0a3fdd1f47900062d274d57e7ab725484c16` | Identity, DeviceTrust, and Gateway Dockerfiles |
| API runtime stage | `mcr.microsoft.com/dotnet/aspnet:8.0` | `sha256:149d139eb6f11b9be8bc99c4d8cbd14f662d64d83359079ebb59e5f4a97bbefe` | Identity, DeviceTrust, and Gateway Dockerfiles |
| PostgreSQL service | `postgres:16-alpine` | `sha256:075f7ba66bc9b3ce7d6b8b635208ff61cd7cf1a67d71ec530eec5d7ae0cbe571` | Both Compose manifests |
| Redis service | `redis:7-alpine` | `sha256:9702d01c1f10c3ea9f48211b4362e44f154ff02d063e6f7268eba804059f53bf` | Infrastructure Compose manifest |
| Nginx gateway service | `nginx:1.27-alpine` | `sha256:62223d644fa234c3a1cc785ee14242ec47a77364226f1c811d2f669f96dc2ac8` | Infrastructure Compose manifest |

## Update and review procedure

1. The owner identifies the required upstream version update or vulnerability response and obtains the manifest digest for the target deployment architecture directly from the registry.
2. The change records the previous and replacement references, the reason, the source registry, review date, and affected services in the pull request.
3. The image is rebuilt from a clean checkout. The Compose configuration, service health, migration, and relevant smoke tests must succeed before merge.
4. Dependency, vulnerability, license, and SBOM evidence is reviewed according to the active supply-chain workflow. A digest update is not approved solely because a tag resolves successfully.
5. The owner updates this table and the retained release provenance evidence. Scheduled review occurs at least monthly and immediately for critical upstream advisories.

## Rollback

The prior reviewed digest remains the rollback target until the replacement has passed CI and operational smoke tests. A failed or suspect digest update is rolled back by reverting the reviewed source commit and rebuilding from the former immutable references. Mutable tags are never used as a rollback mechanism.

## Automated enforcement and evidence

The `Container Base Integrity` workflow runs `scripts/validate-container-image-digests.sh`. It rejects Dockerfile `FROM` instructions and external Compose `image:` references that lack an `@sha256:` digest. The workflow action is pinned by commit SHA. This static gate complements, but does not replace, container build, vulnerability scanning, SBOM publication, and release provenance checks.
