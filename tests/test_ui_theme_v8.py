"""Focused smoke contract for the shared visual skin; no game rules changed."""
from pathlib import Path
import unittest

from tools.build_sources import compose

ROOT=Path(__file__).resolve().parents[1]


class UnifiedThemeV8Test(unittest.TestCase):
    def test_both_game_documents_embed_theme_exactly_once(self):
        html, _script, combat=compose(ROOT)
        battle=combat.decode("utf8")
        self.assertEqual(html.count('<style id="wc-unified-theme-v8">'),1)
        self.assertEqual(battle.count('<style id="wc-combat-theme-v8">'),1)
        self.assertIn('--wc-ui-gold-strong:#ffdfa0',html)
        self.assertIn('--wc-ui-gold:#ecc58b',battle)
        self.assertLess(html.index('wc44-polish'),html.index('wc-unified-theme-v8'))
        self.assertIn('WC_STATUS_SKILLDECK_V1',html)
        self.assertIn('const BASE_DECK=(()=>{',battle)

    def test_both_mobile_dev_previews_load_the_same_skins(self):
        for name in ('play-dev.html','dev-play.html'):
            with self.subTest(preview=name):
                source=(ROOT/name).read_text(encoding='utf8')
                self.assertIn('ui/unified_theme_v8.css',source)
                self.assertIn('ui/combat_theme_v8.css',source)
                self.assertIn('wc-unified-theme-v8',source)
                self.assertIn('wc-combat-theme-v8',source)


if __name__=='__main__':
    unittest.main()
