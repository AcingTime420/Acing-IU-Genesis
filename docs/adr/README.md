# Architecture Decision Records (ADRs)

This directory contains Architecture Decision Records for **Acing IU: Genesis**.

ADRs capture significant technical decisions, their context, the options considered,
and the rationale for the chosen approach.

---

## What is an ADR?

An Architecture Decision Record is a short document that captures:

- **Context** — the situation that forced a decision
- **Decision** — what was decided
- **Consequences** — what becomes easier or harder as a result

ADRs are immutable once accepted. Superseded decisions are marked as such
and linked to the replacing ADR.

---

## Index

| ID | Title | Status | Date |
|---|---|---|---|
| [ADR-001](ADR-001-canonical-repo-structure.md) | Canonical repository structure | Accepted | 2026-07-30 |

---

## ADR lifecycle

```
Proposed → Accepted → Superseded
                    ↘ Deprecated
```

| Status | Meaning |
|---|---|
| **Proposed** | Under discussion; not yet binding |
| **Accepted** | Binding; team has committed to this approach |
| **Superseded** | Replaced by a newer ADR (link provided) |
| **Deprecated** | No longer relevant; retained for historical context |

---

## How to add a new ADR

1. Copy the template below into `docs/adr/ADR-NNN-short-title.md`.
2. Fill in all sections.
3. Open a PR with the ADR and any code changes it documents.
4. Once merged, update the index table in this README.

### Template

```markdown
# ADR-NNN — Title

**Status:** Proposed | Accepted | Superseded by ADR-NNN | Deprecated  
**Date:** YYYY-MM-DD  
**Author(s):** @github-handle

---

## Context

[What situation or constraint forced this decision?]

## Decision

[What was decided?]

## Options considered

| Option | Pros | Cons |
|---|---|---|
| Option A | … | … |
| Option B | … | … |

## Consequences

### Positive
- …

### Negative / trade-offs
- …

## References

- [Link to relevant issue, PR, or external resource]
```
