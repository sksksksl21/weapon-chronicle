"""Real Chromium check of the first mobile frame, with a clean local save.

The screen must finish startup and expose usable owner, sword and services,
rather than the inert placeholder HTML shown before module initialization.
"""
from pathlib import Path
import unittest

ROOT=Path(__file__).resolve().parents[1]


class InitialMobileHubTest(unittest.TestCase):
    def test_source_and_dev_previews_share_one_bootstrap(self):
        status=(ROOT/'src/core/status_skilldeck_v1.js').read_text('utf8')
        bootstrap=(ROOT/'src/legacy/bootstrap.js').read_text('utf8')
        theme=(ROOT/'src/ui/unified_theme_v8.css').read_text('utf8')
        self.assertNotIn('WC_GAME_MODULES_V1.initialize()',status)
        self.assertEqual(bootstrap.count('WC_GAME_MODULES_V1.initialize()'),1)
        self.assertIn('.app .wc41-dashboard{',theme)
        self.assertIn('grid-template-columns:minmax(0,1fr)!important',theme)
        self.assertIn('grid-template-columns:repeat(2,minmax(0,1fr))!important',theme)
        for preview in ('play-dev.html','dev-play.html'):
            self.assertIn('src/module_manifest.json',
                (ROOT/preview).read_text('utf8'))

    def test_first_frame_runs_and_is_mobile_readable(self):
        from playwright.sync_api import sync_playwright
        page_html=(ROOT/'index.html').read_text('utf8')
        self.assertIn('WC_RUNTIME_READY_V1',page_html,
                      'Offline index.html must be rebuilt from latest dev source')
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True,args=[
                '--no-sandbox','--disable-dev-shm-usage'])
            try:
                for width in (320,390,430):
                    with self.subTest(width=width):
                        page=browser.new_page(viewport={'width':width,'height':844})
                        errors=[]
                        page.on('pageerror',lambda e:errors.append(str(e)))
                        page.set_content(page_html,wait_until='domcontentloaded',
                                         timeout=45000)
                        page.wait_for_function("""() =>
                          window.WC_RUNTIME_READY_V1 &&
                          document.getElementById('ownerName')?.textContent!=='이름 없는 선원' &&
                          document.querySelectorAll('#weaponVisualWrap img').length>=3
                        """,timeout=20000)
                        observed=page.evaluate("""() => {
                          const byId=id=>document.getElementById(id);
                          const rect=el=>el.getBoundingClientRect();
                          const owner=rect(document.querySelector('.wc41-owner'));
                          const services=rect(document.querySelector('.wc41-services'));
                          const tiles=[...document.querySelectorAll('.wc41-serviceTile')].map(rect);
                          return {
                            ownerName:byId('ownerName').textContent,
                            heroVisible:byId('heroImg').style.display!=='none',
                            heroLoaded:byId('heroImg').complete&&byId('heroImg').naturalWidth>0,
                            swordImages:[...document.querySelectorAll('#weaponVisualWrap img')].length,
                            power:byId('wpPower').textContent,
                            servicesBelowOwner:services.top>owner.bottom,
                            firstRow:Math.abs(tiles[0].top-tiles[1].top)<3,
                            secondRow:tiles[2].top>tiles[0].bottom,
                            noHorizontalOverflow:document.documentElement.scrollWidth<=innerWidth+2,
                            footerVisible:rect(byId('executeBtn')).bottom<=innerHeight+2
                          };
                        }""")
                        self.assertFalse(errors,errors)
                        self.assertNotEqual(observed['ownerName'],'이름 없는 선원')
                        self.assertTrue(observed['heroVisible'] and observed['heroLoaded'],observed)
                        self.assertGreaterEqual(observed['swordImages'],3,observed)
                        self.assertTrue(observed['power'],observed)
                        self.assertTrue(observed['servicesBelowOwner'],observed)
                        self.assertTrue(observed['firstRow'] and observed['secondRow'],observed)
                        self.assertTrue(observed['noHorizontalOverflow'],observed)
                        self.assertTrue(observed['footerVisible'],observed)
                        page.close()
            finally:
                browser.close()


if __name__=='__main__':
    unittest.main()
