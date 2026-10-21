"""Regression: real parent-to-combat resource values, absent/corrupt defaults, recovery."""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
COMBAT=(ROOT/'src/combat/story_combat.html').read_text(encoding='utf8')
AUDIT_FRAME="""window.__resourceAudit={
  read:()=>({story:STORY_MODE,mind:STORY_MIND,resonance,cap:hero.weapon.maxResonance,
              factor:resonanceMindFactor(),gain:turnResonanceRecovery()}),
  setHand:()=>{hand=['aim1','guard','reroll','counter'];deck=[];cardUses=0;phase='pre';render();},
  canCard:id=>canUseCard(id),cardCost:id=>cardCost(id)
};"""
assert COMBAT.count("resetRun();\n})();")==1
INSTRUMENTED=COMBAT.replace("resetRun();\n})();",AUDIT_FRAME+"\nresetRun();\n})();")
HTML=(ROOT/'index.html').read_text(encoding='utf8')
ORIGINAL=base64.b64encode(COMBAT.encode('utf8')).decode('ascii')
assert HTML.count(ORIGINAL)==1, 'embedded combat differs from source'
HTML=HTML.replace(ORIGINAL,base64.b64encode(INSTRUMENTED.encode('utf8')).decode('ascii'))
APP="""window.__resourceApp={
 set:(mind,res)=>{state.mind=mind;state.weapon.resonance=res;saveGame();},
 start:()=>{const a=actionCandidatesForPolicy('contract')[0];chooseActionCandidate('contract',a.key);startStory();},
 battle:()=>launchStoryCombat('coast_bandit','resource transfer audit','routine_result','routine_result'),
 cp:()=>localStorage.getItem(V482_CHECKPOINT_KEY),
 snapshot:()=>({mind:state.mind,resonance:state.weapon.resonance})
};"""
START="v48EnsureState();\nconst v483Loaded=loadGame();"
assert HTML.count(START)==1
HTML=HTML.replace(START,APP+"\n"+START)
MOCK_STORAGE="""Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem:k=>window.__s[k]??null,setItem:(k,v)=>window.__s[k]=String(v),
 removeItem:k=>delete window.__s[k]}});window.__s={};"""

with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium'
                     if Path('/usr/bin/chromium').exists() else None,
                     args=['--no-sandbox','--disable-dev-shm-usage'])
 def child(page):
  page.wait_for_function("document.getElementById('combatFrame').contentWindow.__resourceAudit")
  return page.frames[1]
 for mind,res in [(0,0),(1,1),(100,70)]:
  page=b.new_page(viewport={'width':390,'height':844})
  errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
  page.evaluate(MOCK_STORAGE)
  page.set_content(HTML,wait_until='load')
  page.evaluate("([m,r])=>__resourceApp.set(m,r)",[mind,res])
  before=page.evaluate('__resourceApp.snapshot()')
  page.evaluate('__resourceApp.start()')
  assert page.evaluate('__resourceApp.cp()')
  page.evaluate("([m,r])=>__resourceApp.set(m,r)",[mind,res])
  page.evaluate('__resourceApp.battle()')
  f=child(page)
  got=f.evaluate('__resourceAudit.read()')
  assert got['story'] and got['mind']==mind and got['resonance']==res,(mind,res,got)
  if mind==0:
   assert got['factor']==.65 and got['gain']<=6,got
   f.evaluate('__resourceAudit.setHand()')
   assert not f.evaluate('__resourceAudit.canCard("aim1")'),'zero resonance bought a paid card'
   page.set_content(HTML,wait_until='load')
   assert not page.evaluate('__resourceApp.cp()')
   assert page.evaluate('__resourceApp.snapshot()')==before,'rollback did not restore zero values'
  if mind==100:assert got['factor']==1.10,got
  assert not errs,errs
  print('PASS parent combat transfer',mind,res,flush=True)
  page.close()

 # Missing and nonnumeric values retain legacy defaults; explicit zero is never missing.
 for raw_mind,raw_res,expected in [(None,None,(60,52)),('bad','bad',(60,52)),('0','0',(0,0))]:
  page=b.new_page()
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  page.set_content('<iframe id="probe" data-story-mode="1"></iframe>')
  page.evaluate("""([m,r,html])=>{
   const f=document.getElementById('probe');
   if(m!==null)f.dataset.mind=m;
   if(r!==null)f.dataset.resonance=r;
   f.srcdoc=html;
  }""",[raw_mind,raw_res,INSTRUMENTED])
  page.wait_for_function("document.getElementById('probe').contentWindow.__resourceAudit")
  f=page.frames[1]
  got=f.evaluate('__resourceAudit.read()')
  assert (got['mind'],got['resonance'])==expected,(raw_mind,raw_res,got)
  assert not errors,errors
  print('PASS missing/invalid/zero iframe defaults',raw_mind,raw_res,flush=True)
  page.close()
 b.close()
