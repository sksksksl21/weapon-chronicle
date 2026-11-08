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

    def test_approved_scene_is_actually_embedded_not_just_verified(self):
        """A validated release changes the real generated game background."""
        import base64
        import hashlib
        import json
        import tempfile
        from tools.build_sources import approved_scene_style
        with tempfile.TemporaryDirectory() as temp:
            root=Path(temp)
            self.assertEqual(approved_scene_style(root),'')
            directory=root/'assets'/'v2-managed'/'assets'
            directory.mkdir(parents=True)
            aid='asset_'+'a'*24
            raw=b'\x89PNG\r\n\x1a\nreal-approved-scene-data'
            (directory/(aid+'.png')).write_bytes(raw)
            record={'schema_version':1,
                    'assets':[{'asset_id':aid,'category':'background',
                               'filename':'assets/'+aid+'.png',
                               'media_type':'image/png','bytes':len(raw),
                               'sha256':hashlib.sha256(raw).hexdigest()}]}
            (directory.parent/'manifest.json').write_text(
                json.dumps(record),encoding='utf-8')
            css=approved_scene_style(root)
            self.assertIn('<style id="wc-v2-approved-scene">',css)
            self.assertIn(base64.b64encode(raw).decode('ascii'),css)
            self.assertIn('background-image:',css)
            (directory/(aid+'.png')).write_bytes(b'tampered')
            with self.assertRaisesRegex(ValueError,'hash mismatch'):
                approved_scene_style(root)

    def test_managed_scene_is_read_in_both_live_dev_game_pages(self):
        for page in ('play-dev.html','dev-play.html'):
            source=(ROOT/page).read_text(encoding='utf-8')
            self.assertIn('assets/v2-managed/manifest.json',source)
            self.assertIn('wc-v2-approved-scene',source)
            self.assertIn('crypto.subtle.digest("SHA-256"',source)
            self.assertIn('return "";',source)

    def test_both_mobile_dev_previews_load_the_same_skins(self):
        for name in ('play-dev.html','dev-play.html'):
            with self.subTest(preview=name):
                source=(ROOT/name).read_text(encoding='utf8')
                self.assertIn('ui/unified_theme_v8.css',source)
                self.assertIn('ui/combat_theme_v8.css',source)
                self.assertIn('wc-unified-theme-v8',source)
                self.assertIn('wc-combat-theme-v8',source)


    def test_portrait_combat_keeps_control_ids(self):
        """Portrait HUD must retain the live battle inputs, not replace rules."""
        combat_css=(ROOT/'src/ui/combat_theme_v8.css').read_text(encoding='utf8')
        combat=(ROOT/'src/combat/story_combat.html').read_text(encoding='utf8')
        self.assertIn('grid-template-areas:"header" "status" "arena" "hand" "actions"!important',combat_css)
        self.assertIn('grid-template-areas:"boss boss" "hero round"',combat_css)
        self.assertIn('grid-template-columns:repeat(2,minmax(0,1fr))!important',combat_css)
        self.assertIn('.sceneInner .sprite.enemy[data-kind]',combat_css)
        self.assertIn('.cardsPanel .odBtn.on',combat_css)
        self.assertIn('body.storyMode .actions #execBtn',combat_css)
        for control in ('heroName','enemyName','heroHp','enemyHp','cards',
                        'overdriveBtn','resFill','battleDiscardBtn36','execBtn'):
            self.assertIn('id="'+control+'"',combat)
        self.assertIn('/* @include:combat_math_v1 */',combat)
        self.assertIn('/* @include:legacy_combat_sources_v1 */',combat)


if __name__=='__main__':
    unittest.main()
