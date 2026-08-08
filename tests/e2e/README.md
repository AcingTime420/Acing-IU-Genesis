# End-to-end tests

Primary E2E smoke for Genesis is the shell script:

```bash
infrastructure/scripts/smoke-auth.sh
```

Requires a running Docker Compose stack (`infrastructure/docker-compose.yml`).

Automated in-process e2e (WebApplicationFactory + Testcontainers) can be added here in a later hardening pass.
