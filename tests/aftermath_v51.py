from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text('utf8')
RESULT=[]
def check(label,ok,detail=None):
    RESULT.append({'name':label,'passed':bool(ok),'detail':str(detail)[:240]})
    print(('PASS' if ok else 'FAIL'),label,str(detail)[:150] if detail is not None else '',flush=True)

def newpage(browser,width=390,height=844):
    page=browser.new_page(viewport={'width':width,'height':height})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('about:blank?wc50test&wc51test')
    page.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const store=new Map();return {setItem:(k,v)=>store.set(String(k),String(v)),getItem:k=>store.has(String(k))?store.get(String(k)):null,removeItem:k=>store.delete(String(k)),clear:()=>store.clear()}})()})")
    page.set_content(HTML,wait_until='domcontentloaded',timeout=65000)
    return page,errors

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    page,errors=newpage(browser)
    check('harness visible',page.evaluate("!!window.__wc51test && !!window.__wc50test"))
    check('no retroactive tasks',page.evaluate("window.__wc51test.available('explore').length===0"))
    page.evaluate('window.__wc50test.simulate(10,"a")')
    candidates=page.evaluate('window.__wc51test.available("explore")')
    check('winds followup available', 'wc51_winds' in candidates,candidates)
    check('winds history news changes', '이타카 접근' in page.evaluate('window.__wc51test.news()'),page.evaluate('window.__wc51test.news()'))
    check('side quest launch',page.evaluate('window.__wc51test.start("winds")'))
    check('first scene has 2 choices',page.locator('#storyChoices button').count()==2)
    page.locator('#storyChoices button').first.click()
    check('branch specific resolution', '표류의 경위' in page.locator('#modal').inner_text())
    page.locator('#storyChoices button').first.click()
    done=page.evaluate('window.__wc51test.after()')
    check('aftermath persisted', 'winds' in done,done)
    check('aftermath completed removed from candidates','wc51_winds' not in page.evaluate('window.__wc51test.available("explore")'))
    check('aftermath ledger unique',len(page.evaluate("window.__wc51test.aftermathLedger()")) == 1)
    page.evaluate('window.__wc51test.openContacts()')
    check('NPC rumor on contact list',page.locator('.wc51WorldNews').count()==1)
    page.evaluate('window.__wc51test.startVisit("mira")')
    check('NPC can discuss changed world',page.locator('.wc51AskWorld').count()==1)
    page.locator('.wc51AskWorld').click()
    check('NPC reply reflects history','이타카 접근' in page.locator('#wc44-npcReply, #visitBubble').first.inner_text())
    check('normal quest test no JS error',not errors,errors[:2]);page.close()

    # All pivot triggers in proper stage, their result and postgame unique followups
    for choice,expected in [('a','council'),('b','fracture')]:
        page,errors=newpage(browser,width=360,height=740)
        page.evaluate('c=>{for(let n=9;n<=40;n++)window.__wc50test.simulate(n,c)}',choice)
        check(f'{choice} 8 pivots',page.evaluate('Object.keys(window.__wc51test.profile().pivots).length')==8)
        ending=page.evaluate('window.__wc50test.ending().key')
        check(f'{choice} ending preserved',ending==expected,ending)
        pkey=f'post_{expected}';polf={'council':'investigate','fracture':'contract'}[expected]
        visible=page.evaluate('p=>window.__wc51test.available(p)',polf)
        check(f'{choice} unique ending followup',f'wc51_{pkey}' in visible,visible)
        check(f'{choice} no incorrect postgame','wc51_post_exile' not in page.evaluate('window.__wc51test.available("explore")'))
        check(f'{choice} stage 41 history banner',page.evaluate('window.__wc51test.status().politics')!='결정 전')
        check(f'{choice} no JS exceptions',not errors,errors[:2]);page.close()

    # Legacy complete saves should not gain fabricated followup/history
    page,errors=newpage(browser,width=320,height=568)
    page.evaluate('''()=>{window.__wc50test.setStage(41); window.__wc50test.resetHistory(); window.__wc51test.profile().pivots={}; window.__wc51test.profile().ending={key:'legacy',title:'이전 역사 기록'};}''')
    check('legacy no fabricated aftermath',page.evaluate('window.__wc51test.available("contract").length===0 && window.__wc51test.available("investigate").length===0'))
    check('small mobile no horizontal overflow',page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+2'))
    check('legacy no JS exceptions',not errors,errors[:2]);page.close()
    browser.close()
(ROOT/'VALIDATION_V51.json').write_text(json.dumps({'results':RESULT,'passed':sum(x['passed'] for x in RESULT),'total':len(RESULT)},ensure_ascii=False,indent=2),encoding='utf8')
print('SUMMARY',sum(x['passed'] for x in RESULT),'/',len(RESULT))
sys.exit(0 if all(x['passed'] for x in RESULT) else 1)
