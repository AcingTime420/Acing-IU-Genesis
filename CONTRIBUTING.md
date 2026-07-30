# Contributing to Acing IU: Genesis

Thank you for your interest in contributing to **Acing IU: Genesis**.  
This document explains how to set up your environment, submit changes, and meet the project's quality bar.

---

## Table of contents

1. [Code of conduct](#1-code-of-conduct)
2. [Getting started](#2-getting-started)
3. [Repository layout](#3-repository-layout)
4. [Development workflow](#4-development-workflow)
5. [Commit conventions](#5-commit-conventions)
6. [Pull request checklist](#6-pull-request-checklist)
7. [CI requirements](#7-ci-requirements)
8. [Security issues](#8-security-issues)

---

## 1. Code of conduct

All contributors are expected to act professionally and respectfully.  
Harassment, discrimination, or bad-faith behaviour will not be tolerated.

---

## 2. Getting started

### Prerequisites

| Tool | Minimum version | Purpose |
|---|---|---|
| JDK | 17 | Kotlin compilation |
| Kotlin compiler (`kotlinc`) | 1.9+ | Building Guardian platform |
| GNU Make | 3.81+ | Build orchestration |
| Git | 2.39+ | Version control |
| Bash | 5.0+ | Validation scripts |
| PowerShell | 7.0+ | Windows validation (optional) |

### Clone and validate

```bash
git clone https://github.com/AcingTime420/Acing-IU-Genesis.git
cd Acing-IU-Genesis
bash scripts/validate-premerge.sh
```

A passing run confirms the repository builds cleanly from a fresh checkout.

---

## 3. Repository layout

See `ARCHITECTURE.md` for the full directory map.

---

## 4. Development workflow

1. **Create a branch** from `main`:

   ```bash
   git checkout -b feature/your-description
   ```

2. **Make focused, well-scoped changes.**  
   Do not mix unrelated refactors with feature work.

3. **Run the pre-merge validator** before opening a PR:

   ```bash
   bash scripts/validate-premerge.sh
   ```

4. **Ensure generated outputs are not committed** (enforced by CI):

   - `out/`, `bin/`, `obj/`, `dist/` and similar paths are excluded by `.gitignore`.
   - Never use `git add -f` on these directories.

5. **Open a pull request** with a clear description of *what*, *why*, and *how to test*.

---

## 5. Commit conventions

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]
[optional footer]
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`, `build`.

Examples:

```
feat(guardian): add tamper-detection policy for vault init
fix(boot): correct guardian_init.sh path resolution
docs(adr): add ADR-002 threat engine design
```

---

## 6. Pull request checklist

Before requesting a review, confirm:

- [ ] `bash scripts/validate-premerge.sh` exits 0
- [ ] No generated artifacts are staged (`git status` is clean after build)
- [ ] New or changed behaviour is described in the PR body
- [ ] Security-sensitive changes reference `SECURITY.md` or `THREAT_MODEL.md`
- [ ] Documentation updated where applicable (README, ARCHITECTURE.md, ADRs)

---

## 7. CI requirements

All PRs must pass:

| Check | Workflow |
|---|---|
| No tracked generated artifacts | `repo-integrity.yml` |
| Clean-clone build baseline | `ci.yml` |

---

## 8. Security issues

Do **not** open a public issue for security vulnerabilities.  
Follow the process in `SECURITY.md`.
