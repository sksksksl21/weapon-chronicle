from pathlib import Path
from playwright.sync_api import sync_playwright
h=Path(__file__).resolve().parents[1]/'index.html'
s=h.read_text()
s=s.replace('v48EnsureState();\nif(loadGame())', '''window.__wcUI={s:()=>({month:state.month,year:state.year,gold:state.gold}),rest:()=>{const a=actionCandidatesForPolicy('rest')[0];chooseActionCandidate('rest',a.key);startStory();return a.key;},debate:()=>startDebateV32('항구 상인과의 협상')};
v48EnsureState();
if(loadGame())''')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 page=b.new_page(viewport={'width':390,'height':844})
 page.evaluate('''Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window._s?.[k]??null,setItem:(k,v)=>{window._s=window._s||{};window._s[k]=String(v)},removeItem:k=>delete window._s[k]}})''')
 errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.set_content(s,wait_until='load',timeout=30000)
 print('initial',page.evaluate('__wcUI.s()'))
 for id in ['statusBtn','inventoryBtn','marketBtn','smithBtn','templeBtn','resonanceBtn']:
  if page.locator('#overlay.show').count():
   page.evaluate("document.getElementById('overlay').classList.remove('show')")
  page.locator('#'+id).click(timeout=10000)
  title=page.locator('#modal').inner_text()[:48]
  print('menu',id,title.replace('\n',' '))
  assert page.locator('#overlay.show').count()==1
 assert not errors, errors
 page.evaluate("document.getElementById('overlay').classList.remove('show')")
 policy=page.evaluate('__wcUI.rest()')
 print('rest choice',policy)
 print('after start',page.locator('#modal').inner_text()[:220].replace('\n',' | '))
 # Work through 1-event; react to end screen.
 for i in range(32):
  if page.locator('#nextMonth').count():
   page.locator('#nextMonth').click()
   break
  buttons=page.locator('#storyChoices button')
  if buttons.count():
   buttons.first.click();continue
  print('unexpected stage',page.locator('#modal').inner_text()[:180].replace('\n',' | '))
  raise AssertionError('action cannot finish')
 else: raise AssertionError('rest action did not reach result')
 print('after month',page.evaluate('__wcUI.s()'))
 assert page.evaluate('__wcUI.s().month')==2
 assert page.evaluate('Object.keys(window._s).filter(x=>x.includes("action-checkpoint")).length')==0
 print('page errors',errors)
 assert not errors
 b.close()
