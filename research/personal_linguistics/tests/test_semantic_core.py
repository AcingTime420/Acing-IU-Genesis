"""Focused tests for GEN-LING-002 semantic notation."""
import importlib.util
from pathlib import Path
import sys
import unittest

SCRIPT = Path(__file__).resolve().parents[1] / "semantic_core.py"
spec = importlib.util.spec_from_file_location("genesis_semantic_core", SCRIPT)
assert spec and spec.loader
core = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = core
spec.loader.exec_module(core)


class SemanticCoreTests(unittest.TestCase):
    def test_unicode_roundtrip(self):
        item = core.Statement(topic="日本語とCuneiform", intent="Preserve meaning")
        self.assertTrue(core.validate_roundtrip(item))

    def test_unverified_defaults(self):
        item = core.Statement(topic="file", intent="read", action="INSPECT")
        self.assertEqual(item.authorization, "NOT_EVALUATED")
        self.assertEqual(item.evidence, "NOT_VERIFIED")
        self.assertEqual(item.result, "NOT_EXECUTED")

    def test_duplicate_field_rejected(self):
        text = core.Statement(topic="file", intent="read").render_precision()
        with self.assertRaises(core.SemanticError):
            core.parse_precision(text + '\nTOP: "override"')

    def test_unknown_field_rejected(self):
        text = core.Statement(topic="file", intent="read").render_precision()
        with self.assertRaises(core.SemanticError):
            core.parse_precision(text + '\nEXECUTE: "YES"')

    def test_missing_field_rejected(self):
        with self.assertRaises(core.SemanticError):
            core.parse_precision('TOP: "example"')

    def test_bad_control_character_rejected(self):
        with self.assertRaises(core.SemanticError):
            core.Statement(topic="bad\x00input", intent="test")

    def test_lexicon_needs_explicit_approval(self):
        lex = core.PersonalLexicon()
        lex.propose("EVID", "Evidence source")
        with self.assertRaises(core.SemanticError):
            lex.approve("EVID")
        self.assertNotIn("EVID", lex.approved)
        lex.approve("EVID", human_approved=True)
        self.assertEqual(lex.approved["EVID"], "Evidence source")

    def test_approved_term_cannot_be_redefined(self):
        lex = core.PersonalLexicon()
        lex.propose("EVID", "Evidence source")
        lex.approve("EVID", human_approved=True)
        with self.assertRaises(core.SemanticError):
            lex.propose("EVID", "Another meaning")

    def test_invalid_term_rejected(self):
        with self.assertRaises(core.SemanticError):
            core.PersonalLexicon().propose("DROP TABLE", "malformed")

    def test_escaped_punctuation_preserved(self):
        item = core.Statement(topic='quote " and \\ slash', intent="new\nline")
        self.assertTrue(core.validate_roundtrip(item))


if __name__ == "__main__":
    unittest.main()
