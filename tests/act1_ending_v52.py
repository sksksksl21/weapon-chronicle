from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
root=Path(__file__).resolve().parents[1];html=(root/'index.html').read_text('utf8')
checks=[]
def check(name,success,details=''):
 checks.append({'name':name,'passed':bool(success),'details':str(details)[:300]});print(('PASS' if success else 'FAIL'),name,details,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 def route(route,name):
  page=browser.new_page(viewport={'width':360,'height':740});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('about:blank?wc50test&wc52test');page.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const store=new Map();return {setItem:(k,v)=>store.set(String(k),String(v)),getItem:k=>store.has(String(k))?store.get(String(k)):null,removeItem:k=>store.delete(String(k)),clear:()=>store.clear()}})()})");page.set_content(html,wait_until='domcontentloaded',timeout=60000)
  for n in range(1,9):page.evaluate('([n,c,z])=>__wc52test.simulate(n,c,"boss_win",z)',[n,route,name])
  # Same later decisions in both cases, so the ACT I legacy is the only difference.
  for n in range(9,41):
   choice='a' if n in [10,38,39] else 'b'
   page.evaluate('([n,c])=>__wc50test.simulate(n,c)',[n,choice])
  report={'ending':page.evaluate('__wc52test.finish()?.key'),'support':page.evaluate('__wc52test.support()'),'act1':page.evaluate('__wc52test.get().pivots'),'chapters':page.evaluate('__wc50test.get().main'),'errors':errors}
  page.close();return report
 positive=route('a','silent');negative=route('b','true')
 check('both stories complete through 40 chapters',positive['chapters']==negative['chapters']==32, (positive['chapters'],negative['chapters']))
 check('positive ACT I leads to new Ithaca pact',positive['ending']=='council',positive)
 check('negative ACT I leads to civil fracture',negative['ending']=='fracture',negative)
 check('same later decisions, different ending',positive['ending']!=negative['ending'],(positive['ending'],negative['ending']))
 check('support difference from ACT I is material',positive['support']>negative['support'],(positive['support'],negative['support']))
 check('no JS errors in both 40-chapter simulations',not positive['errors'] and not negative['errors'],(positive['errors'],negative['errors']))
 browser.close()
(root/'VALIDATION_V52_ENDINGS.json').write_text(json.dumps({'passed':sum(x['passed'] for x in checks),'total':len(checks),'results':checks},ensure_ascii=False,indent=2),'utf8')
print('SUMMARY',sum(x['passed'] for x in checks),'/',len(checks))
sys.exit(0 if all(x['passed'] for x in checks) else 1)
