"""Real-browser check of the chapter-1 scene cards in the built index.html.

New game -> scene cards (not the monthly board) -> trapped hunter choice ->
'이번 장의 이야기' page lists the chosen result sentences -> chapter closes once.
Save failures are injected on the real save key: a failed pick / step / chapter
close must keep the previous progress (memory and durable save) and stay on the
same screen for a retry; reconnecting resumes from the last durable step.
Old saves without scene progress keep the monthly board.
"""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf8')
MARKER = 'v48EnsureState();\nconst v483Loaded=loadGame();'
PROBE = """window.__sc={key:SAVE_KEY,s:()=>JSON.parse(JSON.stringify({
 gold:state.gold,mind:state.mind,owner:state.owner.name,node:state.mainStory?.node,
 results:state.mainStory?.act1ChapterResults||[],departure:v52Act1Pivot('departure'),
 scene:state.sceneChapterV1===undefined?'(none)':state.sceneChapterV1}))};"""
assert HTML.count(MARKER) == 1, 'bootstrap marker missing'
assert 'const WC_CH1_SCENES_JSON_V1={' in HTML, 'run npm run build'
DOC = HTML.replace(MARKER, PROBE + '\n' + MARKER)
STORAGE = """Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem:k=>Object.prototype.hasOwnProperty.call(window.__store,k)?window.__store[k]:null,
 setItem:(k,v)=>{if(window.__fail&&window.__fail.has(k))throw new Error('QuotaExceededError (test)');window.__store[k]=String(v);},
 removeItem:k=>{delete window.__store[k];}}});window.__store=window.__store||{};window.__fail=new Set();"""


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,
                                args=['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'])

    def boot(page):
        page.set_content(DOC, wait_until='load', timeout=60000)
        page.evaluate('WC_RUNTIME_READY_V1.then(()=>1)')

    def fresh():
        page = browser.new_page(viewport={'width': 390, 'height': 844})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.evaluate(STORAGE)
        boot(page)
        return page, errors

    def step(page):
        el = page.locator('#overlay.show #modal .wcScene1')
        return el.get_attribute('data-scene-step') if el.count() else None

    def stored(page):
        raw = page.evaluate('window.__store[__sc.key]')
        return json.loads(raw) if raw else None

    def fail(page, on):
        page.evaluate('on=>on?window.__fail.add(__sc.key):window.__fail.delete(__sc.key)', on)

    def pick(page, choice):
        page.locator(f'[data-scene-choice="{choice}"]').click()

    def advance(page):
        page.locator('[data-scene-next]').click()

    def to_hunter(page):
        check(step(page) == 'card:ch1_ashes', 'new game did not open the first scene card: %r' % step(page))
        pick(page, 'refugees'); advance(page)
        pick(page, 'hunt_path'); advance(page)
        check(step(page) == 'card:ch1_hunter', 'hunter card not reached')

    # 1. New game -> card layout -> hunter -> save failures -> story page -> close.
    page, errors = fresh()
    check(step(page) == 'card:ch1_ashes', 'new game shows monthly board instead of scene cards')
    card = page.locator('.wcScene1')
    check(card.locator('.wcScene1Art').get_attribute('data-scene-bg') == 'action:contract', 'background reference')
    check('url(' in card.locator('.wcScene1Art').get_attribute('style'), 'background image not rendered')
    check(card.locator('.wcScene1Cast').count() >= 1, 'no characters shown')
    check(card.locator('.wcScene1Text').inner_text().strip() != '', 'empty body')
    check(card.locator('[data-scene-choice]').count() == 2, 'choice count')
    check(stored(page)['sceneChapterV1']['status'] == 'card', 'new game scene progress not saved')
    owner = page.evaluate('__sc.s().owner')
    pick(page, 'refugees')
    check(step(page) == 'result:ch1_ashes', 'result not shown after a choice')
    check(owner in page.locator('.wcScene1Result').inner_text(), 'result sentence missing owner')
    advance(page)
    pick(page, 'hunt_path'); advance(page)
    check(step(page) == 'card:ch1_hunter', 'hunter card not reached')
    check(page.locator('.storyTitle').first.inner_text() == '덫에 걸린 사냥꾼', 'hunter title')
    check(page.locator('[data-scene-choice]').count() == 3, 'hunter choices')
    before = page.evaluate('__sc.s()')
    fail(page, True)
    pick(page, 'free')
    check(step(page) == 'card:ch1_hunter', 'failed save advanced the card')
    check(page.locator('.wcScene1Error').count() == 1, 'no retry message after failed save')
    check(page.evaluate('__sc.s()') == before, 'failed save changed memory')
    check(len(stored(page)['sceneChapterV1']['picks']) == 2, 'failed pick reached durable save')
    boot(page)  # reconnect while storage is still failing
    check(step(page) == 'card:ch1_hunter', 'reconnect did not resume the hunter card')
    check(len(page.evaluate('__sc.s()')['scene']['picks']) == 2, 'reconnect restored a lost pick')
    fail(page, False)
    pick(page, 'free')
    check(step(page) == 'result:ch1_hunter', 'retry after failure did not apply')
    check('빚진 거다' in page.locator('.wcScene1Result').inner_text(), 'hunter result sentence')
    fail(page, True)
    advance(page)
    check(step(page) == 'result:ch1_hunter', 'failed save moved to next card')
    check(page.locator('.wcScene1Error').count() == 1, 'no retry message on next')
    fail(page, False)
    advance(page)
    check(step(page) == 'card:ch1_dock', 'dock card')
    check('빚 갚는다' in page.locator('.wcScene1Text').inner_text(), 'freed hunter does not return')
    pick(page, 'shelter'); advance(page)
    check(step(page) == 'ending', 'chapter end page missing')
    lines = page.locator('[data-scene-story]').all_inner_texts()
    check(len(lines) == 4, 'story page lines %r' % lines)
    check(any('사냥꾼 하일로스를 구했다' in x for x in lines), 'hunter choice missing from chapter story')
    gold = page.evaluate('__sc.s().gold')
    fail(page, True)
    page.locator('[data-scene-finish]').click()
    check(step(page) == 'ending', 'failed chapter close left the story page')
    check(page.locator('.wcScene1Error').count() == 1, 'no retry on failed chapter close')
    s = page.evaluate('__sc.s()')
    check(s['gold'] == gold and not any(r['chapter'] == 1 for r in s['results']), 'failed close applied rewards/completion')
    check(s['departure'] is None and s['scene']['status'] == 'ending', 'failed close kept history/status')
    check(stored(page)['sceneChapterV1']['status'] == 'ending', 'failed close reached save')
    boot(page)
    check(step(page) == 'ending', 'reconnect lost the chapter story page')
    check(len(page.locator('[data-scene-story]').all_inner_texts()) == 4, 'reconnect lost story lines')
    fail(page, False)
    page.locator('[data-scene-finish]').click()
    check(step(page) is None, 'chapter close did not return to the game')
    s = page.evaluate('__sc.s()')
    check(sum(r['chapter'] == 1 for r in s['results']) == 1 and s['node'] == '1-02', 'CH.1 not completed once')
    check(s['gold'] == gold + 8 and s['departure'] == 'sheltered', 'reward/history %r' % s)
    check(stored(page)['sceneChapterV1']['status'] == 'done', 'done not saved')
    boot(page)
    check(step(page) is None and page.evaluate('__sc.s().gold') == gold + 8, 'reconnect after close re-opened or re-paid')
    check(not errors, errors)
    legacy = stored(page)
    page.close()

    # 2. Other hunter choices on new games.
    for choice, text, extra_gold in [('bargain', '은화 주머니를 받고서야', 4), ('pass', '두고 지나쳤다', 0)]:
        page, errors = fresh()
        to_hunter(page)
        pick(page, choice)
        check(text in page.locator('.wcScene1Result').inner_text(), choice + ' result')
        advance(page)
        pick(page, 'scatter'); advance(page)
        lines = page.locator('[data-scene-story]').all_inner_texts()
        check(any(text in x for x in lines), choice + ' missing from chapter story')
        gold = page.evaluate('__sc.s().gold')
        page.locator('[data-scene-finish]').click()
        s = page.evaluate('__sc.s()')
        check(s['gold'] == gold + 8 + extra_gold and s['departure'] == 'dispersed', choice + ' close %r' % s)
        check(not errors, errors)
        page.close()

    # 3. Failed first save of a new game blocks choices until a retry succeeds.
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.evaluate(STORAGE)
    page.evaluate("window.__fail.add('weaponChronicleLifeHubV30')")
    boot(page)
    check(step(page) == 'card:ch1_ashes', 'scene not shown when first save fails')
    check(page.locator('[data-scene-choice][disabled]').count() == 2, 'choices usable before durable start')
    page.locator('[data-scene-retry]').click()
    check(page.locator('[data-scene-retry]').count() == 1, 'retry vanished while still failing')
    fail(page, False)
    page.locator('[data-scene-retry]').click()
    check(page.locator('[data-scene-choice][disabled]').count() == 0, 'retry did not unlock choices')
    pick(page, 'breach')
    check(stored(page)['sceneChapterV1']['picks'][0]['choice'] == 'breach', 'pick after retry not saved')
    page.close()

    # 4. An old save without scene progress keeps the monthly board.
    del legacy['sceneChapterV1']
    legacy['mainStory']['act1ChapterResults'] = []
    legacy['mainStory']['node'] = '1-01'
    page = browser.new_page(viewport={'width': 390, 'height': 844})
    page.evaluate(STORAGE)
    page.evaluate('raw=>{window.__store["weaponChronicleLifeHubV30"]=raw;}', json.dumps(legacy))
    boot(page)
    check(step(page) is None, 'old save was forced into scene cards')
    check(page.evaluate('__sc.s().scene') == '(none)', 'old save gained scene progress')
    page.close()
    browser.close()
print('PASS: chapter-1 scene cards in browser (new game, hunter routes, save failure retry, reconnect, old save)')
