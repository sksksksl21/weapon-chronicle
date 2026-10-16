from pathlib import Path
from playwright.sync_api import sync_playwright
import json,sys
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text('utf8')
STORAGE="Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const m=new Map();return {setItem:(k,v)=>m.set(String(k),String(v)),getItem:k=>m.has(String(k))?m.get(String(k)):null,removeItem:k=>m.delete(String(k))}})()})"
passed=0
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 for label,paths,expected in [('restored',{38:'b',39:'a'},'restored'),('exile',{38:'a',39:'b'},'exile')]:
  page=b.new_page(viewport={'width':390,'height':844})
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.goto('about:blank?wc50test');page.evaluate(STORAGE);page.set_content(HTML,wait_until='load',timeout=60000)
  for n in range(9,41):page.evaluate('([n,path])=>window.__wc50test.simulate(n,path)',[n,paths.get(n,'a')])
  actual=page.evaluate('window.__wc50test.ending().key');assert actual==expected,(label,actual)
  assert not errors,errors
  passed+=1;print('PASS alternate ending',label)
  # Save and restart same environment, outcome unchanged; state including branch events persists.
  snapshot=page.evaluate('window.__wc50test.get()')
  page.evaluate('window.__wc50test.save()')
  page.set_content(HTML,wait_until='load',timeout=60000)
  new=page.evaluate('window.__wc50test.get()')
  assert new['history']['pivots']==snapshot['history']['pivots'],(label,'pivots not restored')
  assert new['history']['ending']['key']==expected,(label,'ending not restored')
  passed+=1;print('PASS save reload',label)
  page.close()

 # Boss avoidance should genuinely bypass combat, not merely change the closing text.
 page=b.new_page(viewport={'width':390,'height':844})
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('about:blank?wc50test');page.evaluate(STORAGE);page.set_content(HTML,wait_until='load',timeout=60000)
 for n in [10,13,16,18,23,30]:page.evaluate('n=>window.__wc50test.simulate(n,"a")',n)
 page.evaluate('window.__wc50test.startChapter(38)')
 page.locator('#storyChoices button').first.click()
 page.locator('#storyChoices button').first.click()
 panel=page.locator('#modal').inner_text()
 assert '궁전의 공개 협상' in panel, panel[:250]
 assert '무기를 들고' not in panel, panel[:250]
 passed+=1;print('PASS CH38 parley bypass actual combat')
 assert not errors,errors
 page.close()

 # Legacy complete: no invented branch history.
 page=b.new_page();page.goto('about:blank?wc50test');page.evaluate(STORAGE);page.set_content(HTML,wait_until='load',timeout=60000)
 page.evaluate('window.__wc50test.setStage(41)')
 ed=page.evaluate('window.__wc50test.ending()')
 assert ed['key']=='legacy',ed
 passed+=1;print('PASS legacy completed history remains unassigned')
 page.close();b.close()
print('TOTAL',passed,'PASS')
(ROOT/'VALIDATION_V50_EDGES.json').write_text(json.dumps({'passed':passed,'total':passed},ensure_ascii=False))
