#!/usr/bin/env python3
"""Offline deterministic personal semantic notation prototype.

This parser cannot interpret arbitrary human language, authorize actions,
verify evidence, encrypt messages, or operate devices.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass, field
import json
import re
from typing import Sequence

VERSION = "0.1.0"
FIELDS = ("TOP", "INT", "ACT", "TARGET", "SCOPE", "AUT", "EVD", "RES", "UNK")
MAX_VALUE = 2048
MAX_TERMS = 128
TERM_PATTERN = re.compile(r"^[A-Z][A-Z0-9_]{1,31}$")


class SemanticError(ValueError):
    """Invalid or unsupported semantic notation."""


@dataclass(frozen=True)
class Statement:
    topic: str
    intent: str
    action: str = "NONE"
    target: str = "UNSPECIFIED"
    scope: str = "UNSPECIFIED"
    authorization: str = "NOT_EVALUATED"
    evidence: str = "NOT_VERIFIED"
    result: str = "NOT_EXECUTED"
    uncertainty: str = "UNASSESSED"
    schema_version: str = VERSION

    def __post_init__(self) -> None:
        if self.schema_version != VERSION:
            raise SemanticError("unsupported schema version")
        for name, value in asdict(self).items():
            if not isinstance(value, str) or not value or len(value) > MAX_VALUE:
                raise SemanticError(f"invalid field: {name}")
            if any(ord(ch) < 32 and ch not in "\n\t" for ch in value):
                raise SemanticError(f"control character in field: {name}")

    def fields(self) -> dict[str, str]:
        return {"TOP": self.topic, "INT": self.intent,
                "ACT": self.action, "TARGET": self.target,
                "SCOPE": self.scope, "AUT": self.authorization,
                "EVD": self.evidence, "RES": self.result,
                "UNK": self.uncertainty}

    def render_precision(self) -> str:
        """Produce canonical field order and quoted, JSON-escaped values."""
        values = self.fields()
        return "\n".join(f"{name}: {json.dumps(values[name], ensure_ascii=False)}"
                         for name in FIELDS)

    def render_natural_template(self) -> str:
        """Explain fields; this is NOT a validated translation."""
        return (f"About {self.topic}: the stated intent is {self.intent}. "
                f"Proposed action: {self.action} for {self.target}, scope {self.scope}. "
                f"Authorization: {self.authorization}; evidence: {self.evidence}; "
                f"result: {self.result}; uncertainty: {self.uncertainty}.")


def parse_precision(text: str) -> Statement:
    if not isinstance(text, str) or len(text) > 30000:
        raise SemanticError("invalid input length")
    values: dict[str, str] = {}
    for line in text.splitlines():
        if not line.strip():
            continue
        name, sep, encoded = line.partition(": ")
        if not sep or name not in FIELDS or name in values:
            raise SemanticError("invalid, duplicated, or unknown field")
        try:
            value = json.loads(encoded)
        except (json.JSONDecodeError, TypeError) as exc:
            raise SemanticError("field values must be JSON strings") from exc
        if not isinstance(value, str):
            raise SemanticError("field values must be strings")
        values[name] = value
    if set(values) != set(FIELDS):
        raise SemanticError("all semantic fields are required")
    return Statement(topic=values["TOP"], intent=values["INT"],
                     action=values["ACT"], target=values["TARGET"],
                     scope=values["SCOPE"], authorization=values["AUT"],
                     evidence=values["EVD"], result=values["RES"],
                     uncertainty=values["UNK"])


@dataclass
class PersonalLexicon:
    """In-memory proposals only; no authenticated identity or persistence."""
    approved: dict[str, str] = field(default_factory=dict)
    pending: dict[str, str] = field(default_factory=dict)

    def propose(self, term: str, definition: str) -> None:
        if not isinstance(term, str) or not TERM_PATTERN.fullmatch(term):
            raise SemanticError("invalid term")
        if (not isinstance(definition, str) or not definition.strip()
                or len(definition) > MAX_VALUE):
            raise SemanticError("invalid definition")
        if term in self.approved:
            raise SemanticError("cannot silently redefine approved term")
        if term not in self.pending and len(self.pending) + len(self.approved) >= MAX_TERMS:
            raise SemanticError("lexicon capacity reached")
        self.pending[term] = definition

    def approve(self, term: str, *, human_approved: bool = False) -> None:
        """The bool represents explicit input, not authenticated authorization."""
        if not human_approved:
            raise SemanticError("explicit human approval required")
        if term not in self.pending:
            raise SemanticError("unknown proposal")
        self.approved[term] = self.pending.pop(term)

    def reject(self, term: str) -> None:
        if term not in self.pending:
            raise SemanticError("unknown proposal")
        del self.pending[term]


def validate_roundtrip(statement: Statement) -> bool:
    """Test field preservation only; not real-world semantic equivalence."""
    return parse_precision(statement.render_precision()) == statement


if __name__ == "__main__":
    example = Statement(topic="Genesis", intent="Check operational status",
                        action="INSPECT", target="system status", scope="READ_ONLY")
    print(example.render_precision())
    print("Roundtrip:", "PASS" if validate_roundtrip(example) else "FAIL")
