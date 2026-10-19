"""Run the actual embedded combat and debate with test accessors and fast animations."""
from pathlib import Path
import base64,json
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
MEMORY="""Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>window.__store[k]??null,setItem:(k,v)=>window.__store[k]=String(v),removeItem:k=>delete window.__store[k]}});window.__store={};"""
BATTLE="""window.__battle={
 inspect:()=>({hand:[...hand],deck:[...deck],uses:cardUses,hp:hero.hp,maxResonance:hero.weapon.maxResonance,resonance,items:{...battleItems},turn,phase}),
 arrange:()=>{hand=['aim1','guard','reroll','counter'];deck=[];resonance=hero.weapon.maxResonance;phase='pre';cardUses=0;selectedPre=[];discardedThisTurn36=false;hero.hp=30;render();},
 use:useCard,commit:commitPreCard,discard:id=>{discardChoice36=id;discardBattleCard36();},
 canUse:canUseCard,canDiscard:canDiscardBattleCard36,reaction:()=>{phase='enemyReaction';render();},next:startTurn,toggle:toggleOverdrive,healthy:()=>{hero.hp=hero.maxHp;},
 grant:()=>{grantMoment('gritMemory','test');grantDonationCard();}};"""
APP="""window.__action={state:()=>state,save:saveGame,
 start:policy=>{const a=actionCandidatesForPolicy(policy)[0];chooseActionCandidate(policy,a.key);startStory();},
 battle:()=>launchStoryCombat('coast_bandit','복구 검증 전투','routine_result','routine_result'),
 debate:()=>startDebateV32('복구 검증 설전'),debateState:()=>V32_DEBATE,
 snapshot:()=>({hp:state.hp,mind:state.mind,gold:state.gold,year:state.year,month:state.month,generation:state.generation,prep:{...state.prep},resonance:state.weapon.resonance,owner:JSON.parse(JSON.stringify(state.owner)),worldHistory:JSON.parse(JSON.stringify(state.worldHistory)),weaponParts:{...state.weapon.parts}}),
 cp:()=>localStorage.getItem(V482_CHECKPOINT_KEY),finish:()=>finishStory('복구 검증 사건 완료'),fast:()=>{debateDelay35=()=>Promise.resolve();}};"""
combat=(ROOT/'src/combat/story_combat.html').read_text()
assert combat.count('resetRun();\n})();')==1
combat=combat.replace('resetRun();\n})();',BATTLE+'\nresetRun();\n})();').replace('const sleep=ms=>new Promise(r=>setTimeout(r,ms));','const sleep=ms=>Promise.resolve();')
html=(ROOT/'index.html').read_text();original=base64.b64encode((ROOT/'src/combat/story_combat.html').read_bytes()).decode();assert html.count(original)==1
html=html.replace(original,base64.b64encode(combat.encode()).decode())
needle='v48EnsureState();\nconst v483Loaded=loadGame();';assert html.count(needle)==1
html=html.replace(needle,APP+'\n'+needle);checks=[]
def record(name):
 checks.append({'name':name,'result':'PASS'});print('PASS',name,flush=True)
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage'])
 def fresh():
  page=browser.new_page(viewport={'width':390,'height':844});page.evaluate(MEMORY);errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.set_content(html,wait_until='load');assert not errors,errors
  page.evaluate('__action.fast()');return page,errors
 def battle(page):
  page.evaluate('__action.battle()');page.wait_for_function("document.getElementById('combatFrame').contentWindow.__battle");return page.frames[1]
 page,errors=fresh();page.evaluate("__action.start('contract')");f=battle(page)
 assert len(f.evaluate('__battle.inspect().hand'))==4 and f.evaluate('__battle.inspect().deck.length')==0
 f.evaluate('__battle.arrange();__battle.toggle();__battle.use("aim1");__battle.commit()')
 assert f.evaluate('__battle.inspect().uses')==1 and not f.evaluate('__battle.canDiscard("guard")')
 f.evaluate('__battle.reaction();__battle.use("counter")')
 assert f.evaluate('__battle.inspect().uses')==1 and f.evaluate('__battle.inspect().hand.length')==3
 record('pre-card use blocks reaction, discard and two-card overdrive')
 f.evaluate('__battle.next();__battle.discard("guard");__battle.reaction();__battle.use("counter")')
 assert f.evaluate('__battle.inspect().uses')==1 and f.evaluate('__battle.inspect().hand.length')==2
 record('discard shares the one-card turn budget with use')
 f.evaluate('__battle.arrange();__battle.use("aim1");__battle.discard("guard")');assert f.evaluate('__battle.inspect().hand.length')==4
 f.evaluate('__battle.commit()');assert f.evaluate('__battle.inspect().hand.length')==3
 record('pre-selection cannot be combined with a different discard')
 f.evaluate('__battle.arrange()')
 for card in ['aim1','guard','reroll','counter']:f.evaluate('id=>{__battle.next();__battle.discard(id)}',card)
 f.evaluate('__battle.next();__battle.grant()')
 assert f.evaluate('__battle.inspect().hand.length')==0 and f.evaluate('__battle.inspect().deck.length')==0 and not f.evaluate('__battle.canUse("aim1")')
 f.evaluate('__battle.healthy()');turn=f.evaluate('__battle.inspect().turn');f.locator('#execBtn').click();f.wait_for_function('__battle.inspect().turn>'+str(turn)+'||document.getElementById("overlay").classList.contains("show")')
 assert not errors,errors;record('empty hands stay empty while owner auto-combat advances');page.close()
 for kind in ['battle','debate']:
  page,errors=fresh();page.evaluate('()=>{const s=__action.state();s.hp=30;s.prep.bandage=3;s.prep.rations=2;s.weapon.resonance=40;__action.save()}')
  before=page.evaluate('__action.snapshot()');page.evaluate("__action.start('contract')");assert page.evaluate('__action.cp()')
  if kind=='battle':
   f=battle(page);f.evaluate('__battle.arrange();__battle.use("aim1");__battle.commit()');f.locator('.battleItemsFold361 summary').click();f.locator('#useBandageBtn').click()
   assert f.evaluate('__battle.inspect().hand.length')==3 and f.evaluate('__battle.inspect().items.bandage')==2
   assert f.evaluate('__battle.inspect().resonance')<f.evaluate('__battle.inspect().maxResonance')
  else:
   page.evaluate('__action.debate()');page.locator('[data-v35-skill="calm"][data-v35-mode="discard"]').click();page.locator('#debateCommit35').click();page.wait_for_function('__action.debateState()?.round===1&&!__action.debateState()?.busy')
   assert page.evaluate('__action.debateState().skillStatus.calm')=='discarded'
  page.evaluate('__action.state().gold+=77;__action.save()');assert page.evaluate('__action.cp()')
  page.set_content(html,wait_until='load');page.evaluate('__action.fast()');assert not page.evaluate('__action.cp()')
  after=page.evaluate('__action.snapshot()');assert after==before,(kind,before,after)
  assert not page.locator('#combatLayer.show').count() and not page.locator('#debateStage35.on').count()
  # A retried battle gets a fresh finite hand and restored consumables.
  if kind=='battle':
   page.evaluate("__action.start('contract')");f=battle(page);assert f.evaluate('__battle.inspect().hand.length')==4 and f.evaluate('__battle.inspect().items.bandage')==3
   page.set_content(html,wait_until='load');page.evaluate('__action.fast()')
  page.evaluate("__action.start('contract');__action.finish()");page.locator('#nextMonth').click();committed=page.evaluate('__action.snapshot()')
  assert not page.evaluate('__action.cp()') and (committed['year'],committed['month'])!=(before['year'],before['month'])
  page.set_content(html,wait_until='load');assert page.evaluate('__action.snapshot().gold')==committed['gold'];assert not errors,errors
  record(kind+' interruption rolls back HP, cards, resources and rewards; retry month commits once');page.close()
 browser.close()
(ROOT/'VALIDATION_ACTION_POLICY.json').write_text(json.dumps({'checks':checks,'count':len(checks)},ensure_ascii=False,indent=2)+'\n')
