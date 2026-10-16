from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
root=Path(__file__).resolve().parents[1]
s=(root/'index.html').read_text('utf8')
rows=[]
def ck(k,b,d=''):
 rows.append({'case':k,'pass':bool(b),'detail':str(d)[:200]});print(('PASS' if b else 'FAIL'),k,d,flush=True)
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 page=b.new_page(viewport={'width':360,'height':740});errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('about:blank?wc50test&wc51test');page.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const store=new Map();return {setItem:(k,v)=>store.set(String(k),String(v)),getItem:k=>store.has(String(k))?store.get(String(k)):null,removeItem:k=>store.delete(String(k)),clear:()=>store.clear()}})()})");page.set_content(s,wait_until='domcontentloaded',timeout=60000)
 page.evaluate('()=>{for(let n=9;n<=40;n++)window.__wc50test.simulate(n,"a")}')
 pivots=['winds','fleet','circe','prophecy','cattle','testimony','palace','suitors']
 for i,key in enumerate(pivots):
  can=page.evaluate('(key)=>window.__wc51test.start(key)',key)
  ck(f'{key} opened',can)
  if not can:continue
  ck(f'{key} alternatives',page.locator('#storyChoices button').count()==2)
  page.locator('#storyChoices button').nth(i%2).click()
  ck(f'{key} outcome scene',page.locator('#storyChoices button').count()==1)
  page.locator('#storyChoices button').first.click()
  ck(f'{key} committed once',key in page.evaluate('window.__wc51test.after()'))
  ck(f'{key} cannot replay',not page.evaluate('(key)=>window.__wc51test.start(key)',key))
 regions=page.evaluate('window.__wc51test.profile().regions')
 ck('all region consequences persisted',len(regions)>=7, list(regions))
 ck('8 unique aftermath records',len(page.evaluate('window.__wc51test.aftermathLedger()'))==8)
 post=page.evaluate('window.__wc51test.start("post_council")')
 ck('postgame council playable',post)
 if post:
  page.locator('#storyChoices button').first.click();page.locator('#storyChoices button').first.click()
  ck('postgame committed', 'post_council' in page.evaluate('window.__wc51test.after()'))
 page.evaluate('openV47Epilogue()') if False else page.evaluate('window.__wc51test.openContacts()')
 ck('no JS exceptions after full quest suite',not errors,errors[:3])
 b.close()
(root/'VALIDATION_V51_ROUTES.json').write_text(json.dumps({'checks':rows,'passed':sum(x['pass'] for x in rows),'total':len(rows)},ensure_ascii=False,indent=2))
print('SUMMARY',sum(x['pass'] for x in rows),'/',len(rows))
sys.exit(0 if all(x['pass'] for x in rows) else 1)
