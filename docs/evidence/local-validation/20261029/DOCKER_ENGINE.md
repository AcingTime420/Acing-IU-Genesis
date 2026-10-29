# Docker Engine validation blocker

**Environment availability blocker; underlying internal cause unresolved.** This public summary intentionally excludes host/account identity, process IDs, disk-image paths/sizes, detailed local configuration and raw diagnostic logs. Those remain private.

## Verified state

The installed Docker Desktop/backend is running, and the active context is `desktop-linux`. Explicitly choosing that context does not restore Engine responses. Both the Docker WSL2 distro and another user distro are running. Signed executable metadata and ordinary WSL status/list/version queries were inspected locally.

The current user can connect to the relevant local Engine named pipes. Read-only direct HTTP `GET /_ping` requests connect but do not return data within2seconds. Bounded Engine-version and container-inventory CLI queries also time out; the explicit-context checks timed out after8seconds. A timeout has no normal child exit code, not an invented exit0. Only owned diagnostic CLI trees were stopped; backend processes and workloads were not killed.

The documented normal-user command `docker desktop start --detach --timeout 10` exits0 and says **Docker Desktop is already running**. This does not prove Engine health or restart Docker. No Genesis Compose service was started.

The resource-inventory query timed out, so existing containers/images/networks/volumes are **unverified, not empty**. No such resource was created, removed or reset during this investigation.

## Corrected diagnostic interpretation

An earlier wrapper quoted every WSL flag and produced misleading Relay/user-lookup errors. Direct raw flags returned consistent successful WSL status and both running distros. Those first-pass errors are a harness artifact, **not proof of WSL corruption or failed startup**.

The privileged helper service is stopped/manual, but its stopped state alone is not a verified cause for ordinary WSL2 Linux operation. Do not change service state, group membership or ACLs merely because it is stopped. Official [Windows permission requirements](https://docs.docker.com/desktop/setup/install/windows-permission-requirements/) distinguish privileged features from normal WSL2 usage.

Bounded historical backend logs contain repeated event-stream EOFs; the current inspected backend log is empty. These are insufficient to distinguish an internal daemon stall from an API-forwarding/backend failure. No exact root cause or guaranteed repair can honestly be asserted. Wrong active context, absent Engine pipe and basic pipe connection denial are not supported as explanations by the current checks.

## What requires approval next

Coordinate existing workload ownership and a maintenance window before any disruptive action. A **single controlled Docker-only restart** is a recovery candidate, not a proven fix, and requires specific maintainer approval. Do not substitute blanket WSL shutdown: the other running distro may host unrelated applications. Do not reset, prune, delete disk images, force-kill backend processes or reinstall speculatively.

A maintainer may separately authorize local-only collection through the installed documented Docker diagnostic mechanism, after reviewing sensitive-content handling. No bundle was blindly collected or uploaded. Do not append an upload flag or share a raw bundle without separate consent. The installed help did not advertise the older `check` subcommand, so it was not invented as a validation command.

After approved recovery: require a successful Engine API/version query, then read-only resource inventories, then independently scoped Compose validation. Existing resource identity must be preserved. Exact PostgreSQL16-image, Compose runtime and application E2E gates remain blocked; a PostgreSQL17 native integration pass does not substitute for them.

References: [supported Desktop start flags](https://docs.docker.com/reference/cli/docker/desktop/start/); [official diagnostics and recovery documentation](https://docs.docker.com/desktop/troubleshoot-and-support/troubleshoot/). This publication authorizes no restart or privileged repair.
