#!/usr/bin/env python3
"""Validate documented Genesis legal-to-requirements traceability (not legal compliance).

Standard library only. Fail closed when requirement/legal IDs disappear, duplicate,
or refer to undefined IDs. Does not execute code from Markdown or contact networks.
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

FR_ID = re.compile(r"FR-\d+\.\d+")
LEGAL_ID = re.compile(r"LEG-\d{2}")
SRS_ROW = re.compile(r"^\s*\*\s*(FR-\d+\.\d+)\s*\(", re.MULTILINE)
LEGAL_ROW = re.compile(r"^\|\s*(LEG-\d{2})\s*\|", re.MULTILINE)
TABLE_DIVIDER = re.compile(r"^\s*:?-{3,}:?\s*$")


def read_utf8(root: Path, relative: str) -> str:
    path = root / relative
    if not path.is_file():
        raise ValueError(f"Required source missing: {relative}")
    try:
        return path.read_text(encoding="utf-8-sig")
    except (UnicodeError, OSError) as exc:
        raise ValueError(f"Cannot read {relative}: {exc}") from exc


def section(markdown: str, heading: str) -> str:
    match = re.search(r"(?m)^##\s+" + re.escape(heading) + r"\s*$", markdown)
    if not match:
        raise ValueError(f"Missing required section: {heading}")
    following = re.search(r"(?m)^##\s+", markdown[match.end():])
    end = match.end() + following.start() if following else len(markdown)
    return markdown[match.end():end]


def table_rows(markdown: str, columns: int, label: str) -> list[list[str]]:
    rows: list[list[str]] = []
    for line in markdown.splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) != columns:
            raise ValueError(f"{label}: expected {columns} cells, got {len(cells)}")
        if all(TABLE_DIVIDER.fullmatch(cell) for cell in cells):
            continue
        rows.append(cells)
    if len(rows) < 2:
        raise ValueError(f"{label}: table is empty")
    return rows[1:]


def duplicates(items: list[str]) -> list[str]:
    return sorted({item for item in items if items.count(item) > 1})


def validate(root: Path) -> list[str]:
    srs = read_utf8(root, "docs/SRS.md")
    matrix = read_utf8(root, "docs/governance/AIU-LEGAL-002-LEGAL-APPLICABILITY-MATRIX.md")
    crosswalk = read_utf8(root, "docs/governance/AIU-LEGAL-003-REQUIREMENTS-TRACEABILITY.md")
    register = read_utf8(root, "docs/governance/AIU-LEGAL-001-US-LEGAL-TERMINOLOGY-REGISTER.md")

    errors: list[str] = []
    srs_ids = SRS_ROW.findall(srs)
    if not srs_ids:
        errors.append("SRS: no declared functional requirements")
    if d := duplicates(srs_ids):
        errors.append("SRS: duplicate IDs: " + ", ".join(d))

    legal_table = table_rows(section(matrix, "Applicability matrix"), 7, "Legal matrix")
    legal_ids = [row[0] for row in legal_table]
    if not legal_ids or any(not LEGAL_ID.fullmatch(id_) for id_ in legal_ids):
        errors.append("Legal matrix: invalid or missing LEG-xx IDs")
    if d := duplicates(legal_ids):
        errors.append("Legal matrix: duplicate IDs: " + ", ".join(d))
    for row in legal_table:
        if any(not cell for cell in row):
            errors.append(f"Legal matrix: empty cell in {row[0]}")

    fr_table = table_rows(section(crosswalk, "Requirement crosswalk"), 5, "SRS crosswalk")
    mapped_fr = [row[0] for row in fr_table]
    if d := duplicates(mapped_fr):
        errors.append("SRS crosswalk: duplicate IDs: " + ", ".join(d))
    for row in fr_table:
        if not FR_ID.fullmatch(row[0]):
            errors.append(f"SRS crosswalk: invalid ID {row[0]}")
        if any(not value for value in row):
            errors.append(f"SRS crosswalk: empty required cell for {row[0]}")
        references = LEGAL_ID.findall(row[2])
        if not references:
            errors.append(f"SRS crosswalk: no legal references for {row[0]}")
        for ref in references:
            if ref not in legal_ids:
                errors.append(f"SRS crosswalk: undefined legal ID {ref} at {row[0]}")
        if d := duplicates(references):
            errors.append(f"SRS crosswalk: duplicate references at {row[0]}: {d}")

    for id_ in sorted(set(srs_ids) - set(mapped_fr)):
        errors.append(f"Unmapped SRS requirement: {id_}")
    for id_ in sorted(set(mapped_fr) - set(srs_ids)):
        errors.append(f"Undefined SRS requirement: {id_}")

    cross_cutting = table_rows(
        section(crosswalk, "Cross-cutting controls not represented as discrete SRS FRs"),
        4, "Cross-cutting controls",
    )
    xids = [row[0] for row in cross_cutting]
    if d := duplicates(xids):
        errors.append("Cross-cutting controls: duplicate IDs: " + ", ".join(d))
    for row in cross_cutting:
        if not re.fullmatch(r"X-\d{2}", row[0]):
            errors.append(f"Cross-cutting controls: invalid ID {row[0]}")
        if any(not cell for cell in row):
            errors.append(f"Cross-cutting controls: empty field at {row[0]}")

    all_refs: set[str] = set()
    for row in fr_table:
        all_refs.update(LEGAL_ID.findall(row[2]))
    for row in cross_cutting:
        refs = LEGAL_ID.findall(row[1])
        all_refs.update(refs)
        for ref in refs:
            if ref not in legal_ids:
                errors.append(f"Cross-cutting controls: undefined legal ID {ref} at {row[0]}")
    for id_ in sorted(set(legal_ids) - all_refs):
        errors.append(f"Unmapped legal research area: {id_}")

    required_warnings = (
        "LEGAL REVIEW REQUIRED",
        "not yet registered",
    )
    for warning in required_warnings:
        if warning.casefold() not in register.casefold():
            errors.append(f"Terminology register missing status caveat: {warning}")
    if "not a determination that a statute applies" not in crosswalk:
        errors.append("Crosswalk missing explicit disclaimer on legal applicability")
    if "NOT EXECUTED" not in crosswalk:
        errors.append("Crosswalk missing unexecuted test-status warning")

    return sorted(set(errors))


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--root", type=Path, default=Path(__file__).resolve().parents[1],
        help="repository root (defaults to parent of scripts/)",
    )
    args = parser.parse_args(argv)
    try:
        errors = validate(args.root.resolve(strict=True))
    except (ValueError, OSError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 1
    if errors:
        print(f"FAIL: {len(errors)} governance traceability finding(s):", file=sys.stderr)
        for error in errors:
            print(f" - {error}", file=sys.stderr)
        return 1
    print("PASS: documented SRS and legal research IDs are mapped consistently.")
    print("NOTE: This is structural documentation validation, NOT legal compliance.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
