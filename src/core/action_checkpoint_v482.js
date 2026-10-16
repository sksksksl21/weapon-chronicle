/* v4.8.2 action-boundary checkpoint: the entire pre-action world is preserved separately.
   Intermediate saves never overwrite the rollback point; committed monthly/succession state clears it. */
const V482_CHECKPOINT_KEY=SAVE_KEY+'.action-checkpoint-v482';
const V482_RECOVERY_NOTICE_KEY=SAVE_KEY+'.recovered-v482';
function v482SerializeState(){
 const snapshot=JSON.parse(JSON.stringify(state,(k,v)=>v instanceof Set?[...v]:v));
 snapshot.storyCtx=null;snapshot.activeStory=null;
 return snapshot;
}
function v482BeginAction(){
 try{
  const current=localStorage.getItem(V482_CHECKPOINT_KEY);
  if(current)return true; // Never overwrite a previously unfinished action.
  const payload={version:482,year:state.year,month:state.month,generation:state.generation,
    policy:state.policy,subChoice:state.subChoice,state:v482SerializeState()};
  localStorage.setItem(V482_CHECKPOINT_KEY,JSON.stringify(payload));
  return true;
 }catch(e){console.error('v4.8.2 checkpoint cannot be secured',e);return false;}
}
function v482CommitAction(){
 try{localStorage.removeItem(V482_CHECKPOINT_KEY);}catch(e){console.warn('checkpoint cleanup deferred',e);}
}
function v482RecoverPendingAction(){
 const raw=localStorage.getItem(V482_CHECKPOINT_KEY);if(!raw)return false;
 try{
  const p=JSON.parse(raw);
  if(p.version!==482||!p.state||typeof p.state!=='object'||!p.state.owner||!p.state.weapon||!p.state.weapon.parts)throw new Error('Invalid checkpoint');
  const restored=JSON.stringify(p.state);
  // Write the committed pre-action snapshot before clearing the checkpoint. On a crash here,
  // recovery will safely repeat the same idempotent overwrite on next startup.
  localStorage.setItem(SAVE_KEY,restored);
  localStorage.setItem(V482_RECOVERY_NOTICE_KEY,JSON.stringify({year:p.year,month:p.month,policy:p.policy}));
  localStorage.removeItem(V482_CHECKPOINT_KEY);
  return true;
 }catch(e){
  console.error('v4.8.2 checkpoint restore failed: original save retained',e);
  // Don't repeatedly block app startup because of a damaged checkpoint.
  try{localStorage.setItem(V482_CHECKPOINT_KEY+'.invalid',raw);localStorage.removeItem(V482_CHECKPOINT_KEY);}catch(_){}
  return false;
 }
}
const _v482StartStory=startStory;
startStory=function(){
 if(!state.policy||!state.subChoice)return;
 if(!v482BeginAction()){
   openModal(modalHead('저장 공간 확인 필요','행동을 시작하기 전에 진행 복구 지점을 저장해야 합니다.')+'<div class="modalDesc">저장 공간을 확보한 다음 다시 실행하세요. 보상을 중복 지급하지 않도록 행동 시작을 중단했습니다.</div>');bindClose();return;
 }
 return _v482StartStory();
};
const _v482AdvanceCalendar=advanceCalendar;
advanceCalendar=function(){
 const prevYear=state.year,prevMonth=state.month;
 const out=_v482AdvanceCalendar();
 // December annual summary is not a commit until the next year is actually generated.
 if(state.year!==prevYear||state.month!==prevMonth)v482CommitAction();
 return out;
};
// The annual summary's Continue button changes the year without re-entering advanceCalendar.
const _v482GenMonth=genMonth;
genMonth=function(){
 const out=_v482GenMonth();
 // genMonth is the atomic monthly boundary; successful save before removing checkpoint.
 if(state.storyCtx==null&&state.policy==null&&state.subChoice==null)v482CommitAction();
 return out;
};
const _v482Succession=completeDeathSuccession;
completeDeathSuccession=function(...args){const out=_v482Succession(...args);if(state.storyCtx==null&&state.activeStory==null)v482CommitAction();return out;};
const _v482SaveGame=saveGame;
saveGame=function(){const ok=_v482SaveGame();if(ok&&state.gameOver&&state.storyCtx==null)v482CommitAction();return ok;};
const _v482LoadGame=loadGame;
loadGame=function(){v482RecoverPendingAction();const loaded=_v482LoadGame();if(loaded){
  try{const rec=localStorage.getItem(V482_RECOVERY_NOTICE_KEY);if(rec){const r=JSON.parse(rec);addLog(`${r.year}년차 ${r.month}월 행동 시작 지점으로 복구했다.`);localStorage.removeItem(V482_RECOVERY_NOTICE_KEY);}}catch(_){}
 }return loaded;};
