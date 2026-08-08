# Deprecation Policy — Acing IU: Genesis

> **Feature-status legend**
> ✅ Implemented · 🧪 Experimental · 📋 Planned

---

## Purpose

This policy defines how capabilities, APIs, configuration keys, and components are deprecated and eventually removed in Acing IU: Genesis.

---

## Deprecation lifecycle

```
Supported → Deprecated → Removed
```

| Phase | Duration | Communication |
|---|---|---|
| **Supported** | Active development and maintenance | Feature listed with ✅ or 🧪 status |
| **Deprecated** | Minimum 2 minor versions (or 3 months, whichever is longer) | Deprecation notice in docs; warning at build/runtime where possible |
| **Removed** | After deprecation period | Removed in a MAJOR version bump |

---

## Experimental features

Components marked 🧪 **Experimental** carry **no stability guarantee**.  
They may be removed or changed in any release without following the standard deprecation lifecycle.  
Experimental status is documented in:

- `ARCHITECTURE.md`
- Source-level comments (`// EXPERIMENTAL: ...`)
- API/policy schema version fields

---

## How to request deprecation

1. Open a GitHub issue labelled `deprecation` describing:
   - The capability to be deprecated.
   - The reason (superseded by X, security risk, architectural misfit).
   - The proposed replacement, if any.
   - The suggested timeline.

2. The deprecation is accepted via PR that:
   - Adds a deprecation notice to the relevant documentation.
   - Adds a runtime/build warning where practical.
   - Sets a target removal milestone.

---

## Currently deprecated items

*None at this time.*  
This table will be populated as the project matures.

| Capability | Deprecated in | Target removal | Replacement |
|---|---|---|---|
| — | — | — | — |

---

## Policy enforcement 📋 Planned

Future tooling will:

- Automatically label issues and PRs that touch deprecated paths.
- Warn in CI when deprecated APIs are referenced.
- Block removal PRs that do not include migration guidance.
