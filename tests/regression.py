"""Actual Chromium smoke and checkpoint boundary tests; no localhost required."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'index.html').read_text(encoding='utf-8')
probe="""window.__wcTest={
 state:()=>state,
 pick:(policy)=>{let o=actionCandidatesForPolicy(policy);if(!o.length)throw Error('no candidates:'+policy);chooseActionCandidate(policy,o[0].key);return o[0].key;},
 start:()=>startStory(),
 save:()=>saveGame(),
 gen:()=>genMonth(),
 advance:()=>advanceCalendar(),
 succession:()=>completeDeathSuccession({id:'sea',title:'검의 계승',successor:'wanderer'},state.owner.name,{label:'시험용 전투'}),
 reset:()=>restartGame(),
 checkpoint:()=>localStorage.getItem(V482_CHECKPOINT_KEY),
 inspect:()=>({year:state.year,month:state.month,generation:state.generation,gold:state.gold,owner:state.owner.name,policy:state.policy,subChoice:state.subChoice}),
 saveKey:SAVE_KEY,
 checkpointKey:V482_CHECKPOINT_KEY,
 noticeKey:V482_RECOVERY_NOTICE_KEY,
 recover:()=>v482RecoverPendingAction(),
 checkpointCheck:(s,c)=>v483IsDurablyCommitted(s,c),
 goGameOver:()=>{state.storyCtx=null;state.activeStory=null;state.policy=null;state.subChoice=null;state.gameOver={type:'lost',year:state.year,month:state.month};return saveGame();}
};"""
needle='v48EnsureState();\nif(loadGame())'
assert html.count(needle)==1
instrument=html.replace(needle,probe+'\n'+needle)

MEMORY='''
  Object.defineProperty(window,'localStorage',{configurable:true,value:{
    getItem:(k)=>window.__xstore?.[k]??null,
    setItem:(k,v)=>{if(k===window.__throwWriteKey)throw Error('artificial keyed write failure');if(window.__throwSave && k==='weaponChronicleLifeHubV30')throw Error('artificial save failure');window.__xstore=window.__xstore||{};window.__xstore[k]=String(v)},
    removeItem:(k)=>{if(k===window.__throwRemoveKey)throw Error('artificial keyed remove failure');if(window.__throwCleanup && k.includes('checkpoint-v482'))throw Error('artificial remove failure');delete window.__xstore[k]},
    clear:()=>{window.__xstore={}}
  }});
'''

def assert_msg(cond,message):
    if not cond: raise AssertionError(message)

with sync_playwright() as p:
 browser=p.chromium.launch(headless=True, executable_path='/usr/bin/chromium' if Path('/usr/bin/chromium').exists() else None,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
 checks=[]
 def fresh(w=390,h=844):
    page=browser.new_page(viewport={'width':w,'height':h},device_scale_factor=1)
    page.evaluate(MEMORY)
    errs=[];page.on('pageerror',lambda e:errs.append(str(e)))
    page.set_content(instrument,wait_until='load',timeout=30000)
    assert_msg(not errs,'JS errors '+repr(errs[:3]))
    return page,errs
 def inspect(page): return page.evaluate('__wcTest.inspect()')
 def ck(page):return bool(page.evaluate('__wcTest.checkpoint()'))
 def choose_start(page,policy='rest'):
    page.evaluate('(p)=>__wcTest.pick(p)',policy)
    page.evaluate('__wcTest.start()')
    assert_msg(ck(page),'checkpoint not created')
 def restart_view(page):
    page.set_content(instrument,wait_until='load',timeout=30000)
    assert_msg(not page.evaluate('__wcTest.checkpoint()'),'checkpoint leaked after boot')
 def record(name,detail=None):
    checks.append({'name':name,'result':'PASS','detail':detail});print('PASS',name,detail or '')

 # A. Basic app runtime and screen: unrelated UI kept intact.
 page,errs=fresh()
 assert_msg(page.locator('#ownerName').count()==1,'owner not found')
 assert_msg(page.locator('#inventoryBtn').count()==1,'inventory not found')
 record('앱 부팅·기존 상태 화면',inspect(page))
 for w,h in [(390,844),(360,740),(320,568)]:
    page.set_viewport_size({'width':w,'height':h})
    overflow=page.evaluate('document.documentElement.scrollWidth-innerWidth')
    assert_msg(overflow<=1, f'overflow {w}={overflow}')
    record(f'허브 모바일 {w}x{h}',{'overflow_px':overflow})

 # B. crash midway: HP/gold transient edits rolled back.
 start=inspect(page);choose_start(page)
 page.evaluate('''()=>{const s=__wcTest.state();s.gold+=1500;s.hp=1;__wcTest.save()}''')
 assert_msg(inspect(page)['gold']==start['gold']+1500,'no intermediate state')
 restart_view(page)
 after=inspect(page)
 assert_msg(after['gold']==start['gold'],'gold was duplicated')
 record('중단 복구·GOLD 중복 방지',{'before':start['gold'],'after':after['gold']})

 # C. valid completed month clears checkpoint, survives reload.
 choose_start(page)
 page.evaluate('''()=>{const s=__wcTest.state();s.storyCtx=null;s.activeStory=null;s.policy=null;s.subChoice=null;s.gold+=75;__wcTest.advance()}''')
 committed=inspect(page)
 assert_msg(committed['month']!=after['month'] or committed['year']!=after['year'],'month not advanced')
 assert_msg(not ck(page),'checkpoint was not cleared')
 restart_view(page)
 assert_msg(inspect(page)['gold']==committed['gold'],'committed money incorrectly reverted')
 record('다음 달 확정 후 복구하지 않음',committed)
 page.close()

 # D. artificial failure in persistent save: checkpoint stays.
 page,errs=fresh()
 choose_start(page)
 old=inspect(page)
 page.evaluate('window.__throwSave=true')
 page.evaluate('''()=>{const s=__wcTest.state();s.storyCtx=null;s.activeStory=null;s.policy=null;s.subChoice=null;s.gold+=320;__wcTest.advance()}''')
 assert_msg(ck(page),'CHECKPOINT DELETED even though save failed')
 page.evaluate('window.__throwSave=false')
 restart_view(page)
 assert_msg(inspect(page)['gold']==old['gold'] and inspect(page)['month']==old['month'],'failed save did not roll back')
 record('저장 실패 시 체크포인트 유지·복구')
 page.close()

 # E. completed save but interrupted cleanup: on load prefer committed save.
 page,errs=fresh()
 choose_start(page)
 old=inspect(page)
 page.evaluate('window.__throwCleanup=true')
 page.evaluate('''()=>{const s=__wcTest.state();s.storyCtx=null;s.activeStory=null;s.policy=null;s.subChoice=null;s.gold+=210;__wcTest.advance()}''')
 assert_msg(ck(page),'test failure: cleanup succeeded during injected failure')
 committed=inspect(page)
 assert_msg(committed['gold']==old['gold']+210,'advance failed')
 page.evaluate('window.__throwCleanup=false')
 restart_view(page)
 assert_msg(inspect(page)==committed,'already committed state should not roll back')
 record('확정 저장 후 체크포인트 삭제 실패 → 최신 상태 유지',committed)
 page.close()

 # F. annual recap at year 1 month 12: checkpoint remains until user confirms next year.
 page,errs=fresh()
 page.evaluate('''()=>{const s=__wcTest.state();s.year=1;s.month=12;s.firstYear.summaryShown=false;s.storyCtx=null;s.activeStory=null;s.policy=null;s.subChoice=null;__wcTest.gen();__wcTest.save()}''')
 choose_start(page)
 page.evaluate('''()=>{const s=__wcTest.state();s.storyCtx=null;s.activeStory=null;s.policy=null;s.subChoice=null;__wcTest.advance()}''')
 assert_msg(ck(page),'checkpoint removed before December recap')
 assert_msg(page.locator('#startYear2').count()==1,'year-end button missing')
 record('12월 연말 결산에서는 체크포인트 유지')
 page.locator('#startYear2').click()
 yr=inspect(page)
 assert_msg(yr['year']==2 and yr['month']==1,'year did not advance')
 assert_msg(not ck(page),'year-end commit did not clear checkpoint')
 restart_view(page)
 assert_msg(inspect(page)['year']==2,'year-end state rollback')
 record('연말 결산 확정·차년도 정상 복원',yr)
 page.close()

 # G. fatal game over must commit and survive restart.
 page,errs=fresh();choose_start(page)
 assert_msg(page.evaluate('__wcTest.goGameOver()'),'game over failed to save')
 assert_msg(not ck(page),'game over checkpoint remains')
 restart_view(page)
 assert_msg(bool(page.evaluate('__wcTest.state().gameOver')),'game over rolled back')
 record('검 단절·게임오버 저장 확정')
 page.close()

 # H. death/succession flow must preserve weapon and generation.
 page,errs=fresh();choose_start(page)
 before=inspect(page)
 parts=page.evaluate('JSON.stringify(__wcTest.state().weapon.parts)')
 page.evaluate('__wcTest.succession()')
 after=inspect(page)
 assert_msg(after['generation']>before['generation'],'succession generation did not increment')
 assert_msg(not ck(page),'succession checkpoint remains')
 assert_msg(page.evaluate('JSON.stringify(__wcTest.state().weapon.parts)')==parts,'weapon parts lost')
 restart_view(page)
 assert_msg(inspect(page)['generation']==after['generation'],'succession rolled back')
 record('사망·계승·검 부품·복원',after)
 page.close()

 # I. corrupted checkpoint gets quarantined; no exception from app start.
 page,errs=fresh()
 page.evaluate('''()=>localStorage.setItem(__wcTest.checkpointKey,'{malformed')''')
 restart_view(page)
 assert_msg(page.evaluate('!!localStorage.getItem(__wcTest.checkpointKey+".invalid")'),'invalid checkpoint not quarantined')
 record('체크포인트 손상 격리')
 page.close()

 # J. Recovery I/O failures must never quarantine a valid checkpoint.
 for fault in ['save', 'notice', 'cleanup']:
    page,errs=fresh();choose_start(page)
    raw=page.evaluate('__wcTest.checkpoint()')
    snapshot=json.loads(raw)['state']
    page.evaluate("()=>{const s=__wcTest.state();s.gold+=777;s.worldHistory.push({id:'test:quest-reward'});__wcTest.save()}")
    saved=page.evaluate('localStorage.getItem(__wcTest.saveKey)')
    page.evaluate("(fault)=>{if(fault==='save')window.__throwWriteKey=__wcTest.saveKey;if(fault==='notice')window.__throwWriteKey=__wcTest.noticeKey;if(fault==='cleanup')window.__throwRemoveKey=__wcTest.checkpointKey}",fault)
    # Reboot with the fault still enabled (the original missing regression).
    page.set_content(instrument,wait_until='load',timeout=30000)
    assert_msg(page.evaluate('__wcTest.checkpoint()')==raw, fault+': live checkpoint changed')
    assert_msg(not page.evaluate('localStorage.getItem(__wcTest.checkpointKey+".invalid")'),fault+': valid payload quarantined')
    durable=page.evaluate('localStorage.getItem(__wcTest.saveKey)')
    assert_msg(durable==(saved if fault=='save' else json.dumps(snapshot,ensure_ascii=False,separators=(',',':'))),fault+': unexpected durable data')
    page.evaluate('window.__throwWriteKey=null;window.__throwRemoveKey=null')
    restart_view(page)
    assert_msg(inspect(page)['gold']==snapshot['gold'],fault+': retry kept transient reward')
    assert_msg(not page.evaluate('__wcTest.state().worldHistory.some(x=>x.id==="test:quest-reward")'),fault+': quest reward survived rollback')
    # Replay and settle once; repeated launches must keep exactly one reward.
    choose_start(page)
    page.evaluate("()=>{const s=__wcTest.state();s.gold+=777;s.worldHistory.push({id:'test:quest-reward'});s.storyCtx=null;s.activeStory=null;s.policy=null;s.subChoice=null;__wcTest.advance()}")
    committed=inspect(page)
    for _ in range(2):
       restart_view(page)
       assert_msg(inspect(page)==committed,fault+': repeated load changed settlement')
       assert_msg(page.evaluate('__wcTest.state().worldHistory.filter(x=>x.id==="test:quest-reward").length')==1,fault+': duplicate quest reward')
    assert_msg(committed['gold']==snapshot['gold']+777,fault+': reward paid more than once')
    assert_msg(not errs,repr(errs))
    record('복구 실패·원문 유지·재시도·월/퀘스트 보상 1회: '+fault)
    page.close()

 # K. A notice removal failure is cosmetic and cannot roll back a durable save.
 page,errs=fresh();choose_start(page)
 page.evaluate('window.__throwRemoveKey=__wcTest.noticeKey')
 restart_view(page)
 recovered=inspect(page)
 assert_msg(page.evaluate('!!localStorage.getItem(__wcTest.noticeKey)'),'notice fault not exercised')
 page.evaluate('window.__throwRemoveKey=null')
 restart_view(page)
 assert_msg(inspect(page)==recovered,'notice retry changed game state')
 assert_msg(not page.evaluate('localStorage.getItem(__wcTest.noticeKey)'),'notice not cleared on retry')
 record('복구 알림 삭제 실패·다음 로드 재시도');page.close()

 # L. Invalid shapes, failed quarantine writes/removal: keep original until isolated.
 for payload in ['null', '{"version":481,"state":{}}', '{"version":482,"state":{"owner":{},"weapon":{}}}']:
    page,errs=fresh()
    saved=page.evaluate('localStorage.getItem(__wcTest.saveKey)')
    page.evaluate('(raw)=>localStorage.setItem(__wcTest.checkpointKey,raw)',payload)
    page.evaluate('window.__throwWriteKey=__wcTest.checkpointKey+".invalid"')
    assert_msg(not page.evaluate('__wcTest.recover()'),'invalid recovery succeeded')
    assert_msg(page.evaluate('__wcTest.checkpoint()')==payload,'failed quarantine lost original')
    page.evaluate('window.__throwWriteKey=null;window.__throwRemoveKey=__wcTest.checkpointKey')
    page.evaluate('__wcTest.recover()')
    assert_msg(page.evaluate('__wcTest.checkpoint()')==payload,'failed removal lost original')
    page.evaluate('window.__throwRemoveKey=null')
    page.evaluate('__wcTest.recover()')
    assert_msg(not ck(page),'invalid checkpoint not removed after quarantine')
    assert_msg(page.evaluate('localStorage.getItem(__wcTest.checkpointKey+".invalid")')==payload,'quarantine changed payload')
    assert_msg(page.evaluate('localStorage.getItem(__wcTest.saveKey)')==saved,'invalid checkpoint changed save')
    record('손상 데이터·격리 실패 재시도: '+payload);page.close()

 # J. single source build reproducibility already checked externally.
 print('TOTAL',len(checks),'PASS')
 (ROOT/'VALIDATION_V483.json').write_text(json.dumps({'checks':checks,'passed':len(checks)},ensure_ascii=False,indent=2),encoding='utf8')
 browser.close()
