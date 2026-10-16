from pathlib import Path
from playwright.sync_api import sync_playwright
import json, sys
root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text('utf8')
checks=[]
def check(label,condition,detail=''):
    checks.append({'name':label,'passed':bool(condition),'detail':str(detail)[:220]})
    print(('PASS' if condition else 'FAIL'),label,str(detail)[:110],flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 def page_factory(w=390,h=844):
  page=browser.new_page(viewport={'width':w,'height':h})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('about:blank?wc50test&wc51test&wc52test')
  page.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const store=new Map();return {setItem:(k,v)=>store.set(String(k),String(v)),getItem:k=>store.has(String(k))?store.get(String(k)):null,removeItem:k=>store.delete(String(k)),clear:()=>store.clear()}})()})")
  page.set_content(html,wait_until='domcontentloaded',timeout=65000)
  return page,errors
 page,errors=page_factory()
 check('v52 harness',page.evaluate('typeof __wc52test === "object"'))
 check('fresh ACT I has no invented history',page.evaluate('Object.keys(__wc52test.get().pivots).length===0'))
 # Complete a deliberate sequence; every chapter must have its own unique ID.
 for n in range(1,9):
  result=page.evaluate('n=>__wc52test.simulate(n,"a","boss_win",n===8?"silent":"silent")',n)
  check(f'ACT I CH{n} committed',result)
 summary=page.evaluate('__wc52test.get()')
 check('eight first-act pivots',len(summary['pivots'])==8,summary['pivots'])
 check('eight unique historical events',page.evaluate('__wc52test.events().length===8'))
 check('initial CH1 resource effect',summary['consequences']['departure']['crew']==1, summary['consequences']['departure'])
 check('last CH8 anonymous route',summary['pivots']['identity']=='silent',summary['pivots']['identity'])
 check('repeat ACT I commit refused',page.evaluate('__wc52test.simulate(8,"b","boss_win","true")')==False)
 check('late path cannot change finalized identity',page.evaluate('__wc52test.get().pivots.identity === "silent"'))
 check('world in subsequent CH9 changes', '누가 거인의 눈' in page.evaluate('__wc52test.next(9).intro'), page.evaluate('__wc52test.next(9).intro')[-180:])
 check('world in subsequent CH31 changes','부상병' in page.evaluate('__wc52test.next(31).intro'))
 check('later chapter history echoes first act','제1장에서 이어진 역사' in page.evaluate('__wc52test.echo(38)'))
 check('ACT I postgame quests unlocked',len(page.evaluate('[...__wc52test.post("contract"), ...__wc52test.post("explore"), ...__wc52test.post("investigate")]'))==4)
 stage=page.evaluate('__wc52test.stage()')
 check('first-act completion unlocks subsequent story',stage==9,stage)
 check('NPC sees first-act consequences','이름을 숨긴' in page.evaluate('__wc52test.news()'),page.evaluate('__wc52test.news()'))
 check('chapter variants no JavaScript errors',not errors,errors)
 # HTML UI actual scene after previous choices.
 page.evaluate('__wc52test.scene(7)')
 check('ACT I actual scene records earlier choice','[이전 선택의 영향]' in page.locator('#modal').inner_text())
 check('ACT I scene no JS errors',not errors,errors)
 page.close()
 # Alternative history route and fallback on defeats
 page,errors=page_factory(360,740)
 for n in range(1,9):
  page.evaluate('n=>__wc52test.simulate(n,"b",n===4?"defeat":"boss_win",n===8?"true":"silent")',n)
 vals=page.evaluate('__wc52test.get().pivots')
 check('alternative route recorded',vals['ismaros']=='covert' and vals['identity']=='true',vals)
 check('defeat does not grant rescued sailors',vals['lotus']=='forgotten',vals)
 check('route survives ACT II chapter simulation',page.evaluate('()=>{__wc50test.simulate(9,"a");return __wc52test.get().pivots.identity=== "true"}'))
 check('ACT I support can be negative',page.evaluate('__wc52test.support()')<=2)
 check('no exceptions for alternate route',not errors,errors)
 page.close()
 # Legacy saved chapter results, no retroactive assignment
 page,errors=page_factory(320,568)
 page.evaluate('__wc52test.old(1)')
 check('imported chapter has no inferred pivot',page.evaluate('__wc52test.get().pivots.departure == null'))
 page.evaluate('__wc52test.simulate(1,"a")')
 check('cannot retroactively change imported chapter',page.evaluate('__wc52test.get().pivots.departure == null'))
 check('mobile no horizontal overflow',page.evaluate('document.documentElement.scrollWidth <= innerWidth+2'))
 check('legacy no JS exceptions',not errors,errors)
 page.close()
 # First chapter actual choice click, not only test helper. Bypass fights: test intro and path capture to boss scene.
 page,errors=page_factory(390,844)
 page.evaluate('__wc52test.sceneFirst()')
 check('ACT I first scene contains chapter intro',page.locator('#storyChoices button').count()>0)
 page.locator('#storyChoices button').first.click()
 check('ACT I path buttons shown',page.locator('#storyChoices button').count()>=2)
 page.locator('#storyChoices button').first.click()
 check('ACT I actual click sets path',page.evaluate('__wc52test.ctx()?.v25Approach')=='a')
 check('ACT I boss context ready','약탈' in page.locator('#modal').inner_text())
 check('real click no JS exceptions',not errors,errors)
 page.close();browser.close()
(root/'VALIDATION_V52.json').write_text(json.dumps({'passed':sum(v['passed'] for v in checks),'total':len(checks),'results':checks},ensure_ascii=False,indent=2),'utf8')
print('SUMMARY',sum(v['passed'] for v in checks),'/',len(checks),flush=True)
sys.exit(0 if all(v['passed'] for v in checks) else 1)
