from pathlib import Path
from playwright.sync_api import sync_playwright
import json, sys
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'index.html').read_text('utf8')
results=[]
def test(name,condition,details=''):
    results.append({'name':name,'passed':bool(condition),'details':str(details)[:200]})
    print(('PASS' if condition else 'FAIL'),name,details,flush=True)

with sync_playwright() as p:
    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
    for scen,choice,expected in [('council','a','council'),('fracture','b','fracture')]:
        page=browser.new_page(viewport={'width':390,'height':844})
        errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        page.goto('about:blank?wc50test')
        page.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const store=new Map();return {setItem:(k,v)=>store.set(String(k),String(v)),getItem:k=>store.has(String(k))?store.get(String(k)):null,removeItem:k=>store.delete(String(k)),clear:()=>store.clear()}})()})")
        page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
        present=page.evaluate("typeof window.__wc50test==='object'")
        test(scen+' harness',present)
        if not present:
            test(scen+' script error',False,errors)
            page.close();continue
        page.evaluate('window.__wc50test.resetHistory()')
        for n in range(9,41):
            page.evaluate('([n,c])=>window.__wc50test.simulate(n,c)',[n,choice])
        actual=page.evaluate('window.__wc50test.ending()')
        data=page.evaluate('window.__wc50test.get()')
        test(scen+' 32 chapter records',data['main']==32, data['main'])
        test(scen+' 8 historical pivots',len(data['history']['pivots'])==8,data['history']['pivots'])
        test(scen+' ending',actual and actual['key']==expected,actual)
        test(scen+' history ledger',len(data['world'])==9, len(data['world']))
        test(scen+' no JS errors',not errors,errors[:2])
        page.close()

    # Contrasting historical routes in a subsequent scene plus real story clicks.
    page=browser.new_page(viewport={'width':360,'height':740})
    errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto('about:blank?wc50test');page.evaluate("Object.defineProperty(window,'localStorage',{configurable:true,value:(()=>{const store=new Map();return {setItem:(k,v)=>store.set(String(k),String(v)),getItem:k=>store.has(String(k))?store.get(String(k)):null,removeItem:k=>store.delete(String(k)),clear:()=>store.clear()}})()})");page.set_content(HTML,wait_until='domcontentloaded',timeout=60000)
    page.evaluate('window.__wc50test.startChapter(10)')
    title=page.locator('#modal').inner_text()
    test('pivot presents distinct choices','주머니를 봉인' in title and '주머니를 연다' in title)
    count=page.locator('#storyChoices button').count()
    test('choice buttons available',count>=2,count)
    page.locator('#storyChoices button').first.click()
    body=page.locator('#modal').inner_text()
    test('pivot changes next scene','주머니를 지켜' in body,body[:150])
    # direct scene followup CH11 when winds sealed
    page.evaluate('window.__wc50test.simulate(10,"a")')
    page.evaluate('window.__wc50test.startChapter(11)')
    text=page.locator('#modal').inner_text()
    test('followup replaces historical chapter', '이타카 앞바다의 마지막 저항' in text and '신들의 간섭' in text, text[:160])
    test('UI no errors',not errors,errors[:2])
    page.close()
    browser.close()

(ROOT/'VALIDATION_V50.json').write_text(json.dumps({'results':results,'passed':sum(x['passed'] for x in results),'total':len(results)},ensure_ascii=False,indent=2),encoding='utf8')
print('SUMMARY',sum(x['passed'] for x in results),'/',len(results),flush=True)
if not all(x['passed'] for x in results): sys.exit(1)
