from playwright.sync_api import sync_playwright
from pathlib import Path
import json,sys
root=Path(__file__).resolve().parents[1]; html=(root/'index.html').read_text('utf8'); results=[]
def test(name,yes,details=None):
 results.append({'name':name,'passed':bool(yes),'details':str(details)[:160]});print(('PASS' if yes else 'FAIL'),name,details if details else '',flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[];page.on('pageerror',lambda x:errors.append(str(x)))
 page.goto('about:blank?wc50test&wc51test&wc52test')
 page.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const store=new Map();return {setItem:(k,v)=>store.set(String(k),String(v)),getItem:k=>store.has(String(k))?store.get(String(k)):null,removeItem:k=>store.delete(String(k)),clear:()=>store.clear()}})()})")
 page.set_content(html,wait_until='domcontentloaded',timeout=60000)
 for no in range(1,9):page.evaluate('(n)=>__wc52test.simulate(n,"a")',no)
 test('all act1 events 8',len(page.evaluate('__wc52test.events()'))==8)
 initial=page.evaluate('__wc52test.support()')
 test('positive ACT I influences support',initial==2,initial)
 # Complete four actual side quests by clicking until result, with one-time lock.
 for key,policy in [('act1_departure','contract'),('act1_ismaros','investigate'),('act1_lotus','explore'),('act1_identity','investigate')]:
  available=page.evaluate('(p)=>__wc52test.post(p)',policy)
  test(key+' available',f'wc51_{key}' in available,available)
  test(key+' start',page.evaluate('(k)=>__wc51test.start(k)',key))
  test(key+' choice A/B',page.locator('#storyChoices button').count()>=2)
  page.locator('#storyChoices button').first.click()
  test(key+' outcome',page.locator('#storyChoices button').count()>0)
  page.locator('#storyChoices button').first.click()
  test(key+' completion persistent',key in page.evaluate('__wc51test.after()'))
  test(key+' cannot repeat',f'wc51_{key}' not in page.evaluate('(p)=>__wc52test.post(p)',policy))
  # Confirm the calendar result as a real monthly action before starting the next quest.
  test(key+' month result button',page.locator('#nextMonth').count()==1)
  if page.locator('#nextMonth').count(): page.locator('#nextMonth').click()
 test('four aftermath ledgers written',len([e for e in page.evaluate('__wc51test.aftermathLedger()') if e['key'].startswith('act1_')])==4)
 test('no JS errors after 4 quests',not errors,errors[:2])
 # Save and reboot; stage 9 persists, choices are never repaid or made replayable.
 page.evaluate('__wc50test.save()')
 before=page.evaluate('__wc52test.get()')
 page.set_content(html,wait_until='domcontentloaded',timeout=60000)
 after=page.evaluate('__wc52test.get()')
 test('act1 records survive reboot',before['pivots']==after['pivots'] and len(after['entries'])==8)
 test('sidequests remain completed across reboot',all(k in page.evaluate('__wc51test.after()') for k in ('act1_departure','act1_ismaros','act1_lotus','act1_identity')))
 test('rebuilt screen no errors',not errors,errors[:2])
 browser.close()
(root/'VALIDATION_V52_FOLLOWUPS.json').write_text(json.dumps({'passed':sum(r['passed'] for r in results),'total':len(results),'results':results},ensure_ascii=False,indent=2),'utf8')
print('SUMMARY',sum(r['passed'] for r in results),'/',len(results))
sys.exit(0 if all(r['passed'] for r in results) else 1)
