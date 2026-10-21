"""Test actual one-use card actions, cross-encounter engraving, and iframe result transfer."""
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
SOURCE=(ROOT/'src/combat/story_combat.html').read_text(encoding='utf8')
INJECT="""window.__engraveTest={
 get:()=>({counts:{...cardUseCount},upgrades:[...upgradedFamilies],hand:[...hand],stage:stageIndex,deck:[...deck]}),
 setup:()=>{hand=['aim1','guard','reroll','counter'];deck=[];resonance=hero.weapon.maxResonance;phase='pre';cardUses=0;selectedPre=[];discardedThisTurn36=false;render();},
 use:useCard,commit:commitPreCard,reset:resetRun,next:nextStage,win:stageVictory
};"""
MARKER="resetRun();\n})();"
assert SOURCE.count(MARKER)==1
HTML=SOURCE.replace(MARKER,INJECT+"\n"+MARKER)
STORE="""Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem:k=>window.__mem[k]??null,setItem:(k,v)=>window.__mem[k]=String(v),
 removeItem:k=>delete window.__mem[k]}});window.__mem={};"""

with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
 page=b.new_page()
 page.evaluate(STORE)
 page.set_content(HTML,wait_until='load')
 for count in range(1,4):
  # Mid-encounter reset must discard all progress and any provisional engraving.
  for abandoned in (True,False):
   page.evaluate("()=>{__engraveTest.setup();__engraveTest.use('aim1');__engraveTest.commit();}")
   current=page.evaluate("__engraveTest.get()")
   assert current['counts'].get('aim')==count,current
   assert len(current['hand'])==3 and current['deck']==[],current
   if not abandoned:page.evaluate("__engraveTest.win()")
   page.evaluate("__engraveTest.reset()")
   after=page.evaluate("__engraveTest.get()")
   expected=count-1 if abandoned else count
   assert after['counts'].get('aim',0)==expected,after
   assert ('aim' in after['upgrades'])==(expected==3),after
 print('PASS: aborted encounters cannot farm engraving; completed battles persist')
 page.evaluate("__engraveTest.next()")
 next_one=page.evaluate("__engraveTest.get()")
 assert next_one['stage']==1 and len(next_one['hand'])==4,next_one
 assert next_one['counts']['aim']==3,next_one
 print('PASS: new encounter has four cards and retains sword mastery')
 page.close()

 for original,expect in [('{\"aim\":2}',2),('',0)]:
  page=b.new_page()
  page.evaluate(STORE)
  page.set_content('<iframe id="combat" data-story-mode="1"></iframe>',wait_until='load')
  page.evaluate("([html,mastery])=>{let f=document.getElementById('combat');if(mastery)f.dataset.cardMastery=mastery;f.srcdoc=html}",[HTML,original])
  page.wait_for_function("document.getElementById('combat').contentWindow.__engraveTest")
  f=page.frames[1]
  state=f.evaluate("__engraveTest.get()")
  assert state['counts'].get('aim',0)==expect,state
  if expect==2:
   f.evaluate("()=>{__engraveTest.setup();__engraveTest.use('aim1');__engraveTest.commit();}")
   got=f.evaluate("__engraveTest.get()")
   assert got['counts']['aim']==3 and 'aim' in got['upgrades'],got
   page.evaluate("window.__events=[];window.addEventListener('message',e=>{if(e.data?.type==='wc-story-combat')window.__events.push(e.data)})")
   f.evaluate("__engraveTest.win()")
   page.wait_for_function("window.__events.length>0")
   msg=page.evaluate("window.__events[0]")
   assert msg['result']=='win' and msg['cardMastery']['aim']==3,msg
   print('PASS: story iframe receives two prior uses and returns completed third')
  else:
   print('PASS: legacy story iframe with missing engraving state defaults empty')
  page.close()
 b.close()
