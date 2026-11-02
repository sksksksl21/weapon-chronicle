"""Source manifest contracts: a single dependency graph feeds all game assemblers."""
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch

from tools.build_sources import SCRIPT_PARTS, load_module_manifest

ROOT = Path(__file__).resolve().parents[1]


class ModuleManifestTest(unittest.TestCase):
    def setUp(self):
        self.source = json.loads((ROOT / "src/module_manifest.json").read_text("utf8"))

    def test_complete_graph_and_single_build_order(self):
        entries = self.source["modules"]
        self.assertEqual(tuple(item["path"] for item in entries), SCRIPT_PARTS)
        self.assertEqual(len(SCRIPT_PARTS), len(set(SCRIPT_PARTS)))
        self.assertEqual(SCRIPT_PARTS[0], "legacy/game_runtime.js")
        self.assertEqual(SCRIPT_PARTS[-1], "legacy/bootstrap.js")
        self.assertLess(SCRIPT_PARTS.index("core/equipment_pool_v1.js"),
                        SCRIPT_PARTS.index("core/merchant_stock_v1.js"))
        for preview in ("play-dev.html", "dev-play.html"):
            html = (ROOT / preview).read_text("utf8")
            self.assertIn("module_manifest.json", html)
            self.assertNotIn("const scriptParts=[", html)
            self.assertNotIn("const SCRIPT_PARTS=[", html)
        self.assertEqual(load_module_manifest(ROOT), SCRIPT_PARTS)

    def test_missing_late_or_cyclic_dependency_is_rejected(self):
        bad = copy.deepcopy(self.source)
        bad["modules"][1]["requires"] = ["bootstrap"]
        with patch("tools.build_sources.json.loads", return_value=bad):
            with self.assertRaisesRegex(ValueError, "Missing or late dependency"):
                load_module_manifest(ROOT)

    def test_duplicate_module_or_unsafe_path_is_rejected(self):
        duplicate = copy.deepcopy(self.source)
        duplicate["modules"][2]["id"] = duplicate["modules"][1]["id"]
        with patch("tools.build_sources.json.loads", return_value=duplicate):
            with self.assertRaisesRegex(ValueError, "Duplicate"):
                load_module_manifest(ROOT)
        unsafe = copy.deepcopy(self.source)
        unsafe["modules"][2]["path"] = "../private.js"
        with patch("tools.build_sources.json.loads", return_value=unsafe):
            with self.assertRaisesRegex(ValueError, "Unsafe"):
                load_module_manifest(ROOT)


if __name__ == "__main__":
    unittest.main()
