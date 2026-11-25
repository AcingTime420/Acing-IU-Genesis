"""Regression and negative tests for the documentation traceability validator.

Fixtures are copied into a disposable temporary tree; original sources are
never modified. No dependencies outside Python's standard library.
"""
from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "check-legal-traceability.py"
SOURCE_FILES = (
    "docs/SRS.md",
    "docs/governance/AIU-LEGAL-001-US-LEGAL-TERMINOLOGY-REGISTER.md",
    "docs/governance/AIU-LEGAL-002-LEGAL-APPLICABILITY-MATRIX.md",
    "docs/governance/AIU-LEGAL-003-REQUIREMENTS-TRACEABILITY.md",
)

spec = importlib.util.spec_from_file_location("genesis_legal_validator", SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError("Unable to import legal traceability validator")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class LegalTraceabilityTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="genesis-legal-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for relative in SOURCE_FILES:
            source = ROOT / relative
            target = self.root / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(source.read_bytes())

    def mutate(self, relative: str, source: str, replacement: str) -> None:
        path = self.root / relative
        data = path.read_text(encoding="utf-8")
        self.assertIn(source, data, f"Fixture anchor not found: {source}")
        path.write_text(data.replace(source, replacement, 1), encoding="utf-8")

    def assert_finding(self, needle: str) -> None:
        self.assertIn(needle, "\n".join(validator.validate(self.root)))

    def test_repository_baseline_is_consistent(self) -> None:
        self.assertEqual([], validator.validate(self.root))

    def test_missing_srs_mapping_fails(self) -> None:
        self.mutate(
            "docs/governance/AIU-LEGAL-003-REQUIREMENTS-TRACEABILITY.md",
            "| FR-1.1 |", "| FR-9.9 |",
        )
        self.assert_finding("Unmapped SRS requirement: FR-1.1")
        self.assert_finding("Undefined SRS requirement: FR-9.9")

    def test_duplicate_mapping_fails(self) -> None:
        relative = "docs/governance/AIU-LEGAL-003-REQUIREMENTS-TRACEABILITY.md"
        path = self.root / relative
        content = path.read_text(encoding="utf-8")
        match = next(line for line in content.splitlines() if line.startswith("| FR-1.1 |"))
        path.write_text(content.replace(match, match + "\n" + match, 1), encoding="utf-8")
        self.assert_finding("SRS crosswalk: duplicate IDs")

    def test_undefined_legal_id_fails(self) -> None:
        self.mutate(
            "docs/governance/AIU-LEGAL-003-REQUIREMENTS-TRACEABILITY.md",
            "| FR-1.1 | User enrollment | LEG-07, LEG-15, LEG-17 |",
            "| FR-1.1 | User enrollment | LEG-99, LEG-15, LEG-17 |",
        )
        self.assert_finding("SRS crosswalk: undefined legal ID LEG-99")

    def test_legal_area_without_mapping_fails(self) -> None:
        self.mutate(
            "docs/governance/AIU-LEGAL-002-LEGAL-APPLICABILITY-MATRIX.md",
            "| LEG-01 |", "| LEG-98 |",
        )
        self.assert_finding("Unmapped legal research area: LEG-98")

    def test_missing_required_caveat_fails(self) -> None:
        self.mutate(
            "docs/governance/AIU-LEGAL-001-US-LEGAL-TERMINOLOGY-REGISTER.md",
            "LEGAL REVIEW REQUIRED", "COUNSEL RESEARCH PENDING",
        )
        self.assert_finding("Terminology register missing status caveat: LEGAL REVIEW REQUIRED")

    def test_missing_source_fails(self) -> None:
        (self.root / "docs/SRS.md").unlink()
        with self.assertRaisesRegex(ValueError, "Required source missing"):
            validator.validate(self.root)

    def test_duplicate_srs_definition_fails(self) -> None:
        path = self.root / "docs/SRS.md"
        content = path.read_text(encoding="utf-8")
        path.write_text(content + "\n* **FR-1.1 (Duplicate)**: invalid.\n", encoding="utf-8")
        self.assert_finding("SRS: duplicate IDs")


if __name__ == "__main__":
    unittest.main(verbosity=2)
