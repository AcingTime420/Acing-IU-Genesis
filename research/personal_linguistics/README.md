# GEN-LING-002 — Personal Semantic Core (Experimental)

**Status:** EXPERIMENTAL. A standalone, offline Python 3.10+ research prototype, not a deployed Genesis service.

## User-selected preferences

1. Adaptive natural, logical and expressive communication (1.D).
2. Research-first linguistic feature evaluation; vocabulary, grammar and symbols remain options (2.D considering A/B/C).
3. Priorities: personal expression, complex meaning preservation, efficiency, understanding (3.E with D/B/C/A). Factual accuracy and authorization are mandatory safeguards regardless of presentation priority.
4. Audience-specific open, translatable and private communication (4.D). **Private requires independently authenticated encryption and key management; no encryption is implemented.**
5. AI-proposed words require IU approval and consistent, justified construction (5.D with A/B).

## Grammar 0.1

Exactly nine newline-delimited fields, each with a JSON-quoted string value, in canonical order:

```text
TOP: "Genesis"
INT: "Check operational status"
ACT: "INSPECT"
TARGET: "system status"
SCOPE: "READ_ONLY"
AUT: "NOT_EVALUATED"
EVD: "NOT_VERIFIED"
RES: "NOT_EXECUTED"
UNK: "UNASSESSED"
```

TOP=topic, INT=intent, ACT=proposed action, TARGET=target, SCOPE=proposed boundary, AUT=authorization claim/status, EVD=evidence claim/status, RES=result claim/status, UNK=uncertainty.

Field values remain **untrusted data**. `AUT` never grants access, `EVD` does not verify external facts, `RES` does not establish execution, and the template-rendered prose is not validated translation. The isolated prototype uses explicit syntax; it cannot understand arbitrary natural speech.

## Lexicon

`PersonalLexicon.propose` records in-memory proposals; `approve(term, human_approved=True)` represents caller-supplied input, **not authenticated authorization**. A production integration must check identity, policy, and audit evidence independently. No persistence or sharing is implemented.

## Run

```bash
python3 research/personal_linguistics/semantic_core.py
python3 -m unittest discover -s research/personal_linguistics/tests -p 'test_*.py' -v
```

On Windows, `py -3` may replace `python3`.

## Limitations and risks

- No networking, external AI services, device modification, encryption, cryptographic evidence, data persistence or production authorization.
- Parser rejects duplicate, unknown, or missing fields and some control characters. Strings remain untrusted for every downstream interpreter and must be output-encoded and policy-checked independently.
- Unicode roundtripping is tested, but visually confusable strings, translations, cultural meaning, and speech/sign-language comprehension are not validated.
- Roundtrip success means **structural field preservation**, not semantic accuracy, comprehensibility or safety.
- This is an isolated research tool. It must be reconciled with current Genesis HumanAuthority interfaces and privacy architecture before integration.
- Do not place actual private IU profiles into public source control. This prototype includes no personal profile data.
- Changes require review, privacy/security assessment and testing. Do not merge, release or claim production readiness without applicable evidence and owner approval.
