"""Regression for additive legacy-shaped saves (not original historical binaries).

Builds fixtures by stripping later optional fields from a valid current save.
Verifies stable core values, immutable backup, idempotent reloading and history
ledger reconstruction. Historical v3.0-v5.1 original saves are NOT provided.
"""
from copy import deepcopy
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'index.html').read_text(encoding='utf8')
MARKER = 'v48EnsureState();\nconst v483Loaded=loadGame();'
PROBE = """window.__compatAudit={
 key:SAVE_KEY,backupKey:V48_BACKUP_KEY,
 save:()=>saveGame(),
 snapshot:()=>({
  year:state.year,month:state.month,generation:state.generation,
  gold:state.gold,owner:state.owner.name,
  parts:JSON.stringify(state.weapon.parts),
  branchCount:Object.keys(state.branchFlags||{}).length,
  endingCount:(state.endingRecords||[]).length,
  chapter9:(state.worldHistory||[]).filter(x=>x?.id==='main:ch9').length
 })
};"""
assert HTML.count(MARKER) == 1, 'Cannot locate bootstrap for compatibility probe'
DOCUMENT = HTML.replace(MARKER, PROBE + '\n' + MARKER)
STORAGE = """Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem:k=>window.__compatStore[k]??null,
 setItem:(k,v)=>window.__compatStore[k]=String(v),
 removeItem:k=>delete window.__compatStore[k]
}});window.__compatStore={};"""
SAVE_KEY = 'weaponChronicleLifeHubV30'


def stable_fields(snapshot):
    return {k:snapshot[k] for k in ('year','month','generation','gold','owner','parts')}


with sync_playwright() as playwright:
    browser = playwright.chromium.launch(
        headless=True,
        executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,
        args=['--no-sandbox','--disable-dev-shm-usage']
    )
    seed = browser.new_page(viewport={'width':390,'height':844})
    seed.evaluate(STORAGE)
    seed.set_content(DOCUMENT, wait_until='load')
    assert seed.evaluate("""()=>{state.gold=1234;return __compatAudit.save();}""")
    current_raw = seed.evaluate('localStorage.getItem(__compatAudit.key)')
    current = json.loads(current_raw)
    assert current['gold'] == 1234 and current.get('owner') and current.get('weapon')
    seed.close()

    additive = deepcopy(current)
    for name in ('worldHistory','branchFlags','endingRecords','saveMeta'):
        additive.pop(name, None)
    additive['weapon'].pop('cardMastery', None)
    # This is a synthetic shape, NOT a v4.7 original save.
    historical_record = deepcopy(additive)
    history = historical_record.setdefault('mainStory', {})
    chapter_state = history.setdefault('mainV47', {})
    chapter_state['results'] = [{
        'no':9,'act':2,'chapter':1,'title':'compatibility fixture',
        'result':'recorded event','path':'A','owner':current['owner']['name']
    }]

    cases = [
        ('current_roundtrip',current,False),
        ('missing_additive_fields',additive,False),
        ('recorded_chapter_idempotent',historical_record,True)
    ]
    for case,fixture,expects_chapter in cases:
        original = json.dumps(fixture,ensure_ascii=False,separators=(',',':'))
        page = browser.new_page(viewport={'width':390,'height':844})
        errors=[]
        page.on('pageerror',lambda error: errors.append(str(error)))
        page.evaluate(STORAGE)
        page.evaluate('(raw)=>window.__compatStore["weaponChronicleLifeHubV30"]=raw',original)
        expected = None
        for iteration in range(3):
            page.set_content(DOCUMENT,wait_until='load',timeout=30000)
            snapshot = page.evaluate('__compatAudit.snapshot()')
            assert snapshot['gold']==fixture['gold'],(case,iteration,snapshot)
            assert snapshot['owner']==fixture['owner']['name'],(case,iteration,snapshot)
            assert snapshot['parts']==json.dumps(fixture['weapon']['parts'],separators=(',',':'),ensure_ascii=False),(case,iteration,'parts changed')
            assert page.evaluate('localStorage.getItem(__compatAudit.backupKey)')==original,(case,iteration,'original backup changed')
            if expects_chapter:
                assert snapshot['chapter9']==1,(case,iteration,snapshot)
            if case=='missing_additive_fields':
                assert snapshot['branchCount']==0,(case,iteration,'fabricated branch')
                assert snapshot['endingCount']==0,(case,iteration,'fabricated ending')
            if expected is None:expected=stable_fields(snapshot)
            else:assert stable_fields(snapshot)==expected,(case,iteration,'repeated load drift',snapshot)
            assert not errors,(case,iteration,errors[:3])
        print('PASS save compatibility fixture',case,'three consecutive loads',flush=True)
        page.close()
    browser.close()

print('PASS compatibility matrix: 3 synthetic/current fixtures; historical original files NOT tested',flush=True)
