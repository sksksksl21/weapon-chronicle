"""Real parent-to-battle personality transfer and decision-weight regression."""
from pathlib import Path
import base64
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
COMBAT=(ROOT/'src/combat/story_combat.html').read_text(encoding='utf8')
PROBE="""window.__personalityAudit={
 read:()=>{
  let weights=null;
  const prior=weightedHeroAction,random=Math.random;
  try {
   hero.hp=hero.maxHp;enemy.hp=enemy.maxHp;enemy.exposed=false;enemyIntent='light';
   ownerMind.confidence=0;ownerMind.damageMemory=0;ownerMind.missStreak=0;
   ownerMind.lastAction=null;ownerMind.repeat=0;
   Math.random=()=>.5;
   weightedHeroAction=s=>{weights={...s};return 'basic';};
   chooseHeroPlan();
  }finally{Math.random=random;weightedHeroAction=prior;}
  return {owner:[hero.aggression,hero.caution,hero.boldness],weights,
    martial:hero.martial,survival:hero.survival,weaponPower:hero.weapon.power};
 }
};"""
MARK="resetRun();\n})();"
assert COMBAT.count(MARK)==1
INSTRUMENTED=COMBAT.replace(MARK,PROBE+"\n"+MARK)
HTML=(ROOT/'index.html').read_text(encoding='utf8')
ORIGINAL=base64.b64encode(COMBAT.encode('utf8')).decode('ascii')
assert HTML.count(ORIGINAL)==1,"Combat HTML is not built from source"
HTML=HTML.replace(ORIGINAL,base64.b64encode(INSTRUMENTED.encode('utf8')).decode('ascii'))
APP="""window.__personalityApp={
 set:(a,c,b)=>{
  state.owner.aggression=a;state.owner.caution=c;state.owner.boldness=b;saveGame();
 },
 start:()=>{const a=actionCandidatesForPolicy('contract')[0];chooseActionCandidate('contract',a.key);startStory();},
 battle:()=>launchStoryCombat('coast_bandit','personality test','routine_result','routine_result'),
 frame:()=>{const f=document.getElementById('combatFrame');return [
  f.dataset.aggression,f.dataset.caution,f.dataset.boldness
 ];}
};"""
START="v48EnsureState();\nconst v483Loaded=loadGame();"
assert HTML.count(START)==1
HTML=HTML.replace(START,APP+"\n"+START)
STORAGE="""Object.defineProperty(window,'localStorage',{configurable:true,value:{
 getItem:k=>window.__s[k]??null,setItem:(k,v)=>window.__s[k]=String(v),
 removeItem:k=>delete window.__s[k]}});window.__s={};"""

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,
   executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,
   args=['--no-sandbox','--disable-dev-shm-usage'])
 results=[]
 for values in [(20,85,30),(85,20,80)]:
  page=browser.new_page(viewport={'width':390,'height':844})
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.evaluate(STORAGE)
  page.set_content(HTML,wait_until='load')
  page.evaluate("a=>__personalityApp.set(...a)",list(values))
  page.evaluate('__personalityApp.start()')
  page.evaluate('__personalityApp.battle()')
  page.wait_for_function("document.getElementById('combatFrame').contentWindow.__personalityAudit")
  assert page.evaluate('__personalityApp.frame()')==list(map(str,values))
  result=page.frames[1].evaluate('__personalityAudit.read()')
  assert result['owner']==list(values),(values,result)
  assert result['weights'] is not None,result
  assert not errors,errors
  results.append(result)
  print('PASS live owner profile and combat AI weights',values,result['weights'],flush=True)
  # Clean up all three new dataset fields on the real combat result boundary.
  page.evaluate("window.postMessage({type:'wc-story-combat',result:'win',hp:70,resonance:20},'*')")
  page.wait_for_function("!Object.hasOwn(document.getElementById('combatFrame').dataset,'aggression')")
  assert all(k not in page.evaluate("Object.keys(document.getElementById('combatFrame').dataset)") for k in ['aggression','caution','boldness'])
  page.close()

 low,high=results
 assert low['martial']==high['martial'] and low['survival']==high['survival']
 assert low['weaponPower']==high['weaponPower']
 assert high['weights']['heavy']>low['weights']['heavy']+30,(low,high)
 assert low['weights']['defend']>high['weights']['defend']+30,(low,high)
 print('PASS distinct AI action weights under equal stats/gear',flush=True)

 # Legacy missing / corrupt personality inputs fall back to original AI defaults.
 for raw,expected in [(None,[68,38,62]),('invalid',[68,38,62]),('0',[0,0,0])]:
  page=browser.new_page()
  errors=[];page.on('pageerror',lambda error:errors.append(str(error)))
  page.set_content('<iframe id="probe" data-story-mode="1"></iframe>')
  page.evaluate("""([val,html])=>{
   const f=document.getElementById('probe');
   if(val!==null)for(const key of ['aggression','caution','boldness'])f.dataset[key]=val;
   f.srcdoc=html;
  }""",[raw,INSTRUMENTED])
  page.wait_for_function("document.getElementById('probe').contentWindow.__personalityAudit")
  got=page.frames[1].evaluate('__personalityAudit.read()')
  assert got['owner']==expected,(raw,got)
  assert not errors,errors
  print('PASS legacy personality defaults',raw,expected,flush=True)
  page.close()
 browser.close()
