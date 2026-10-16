/* v4.8.3: commit proof and interrupted-write recovery. No gameplay rebalance. */
function v483IsDurablyCommitted(snapshot, checkpoint) {
  if(!snapshot || !checkpoint || !checkpoint.state) return false;
  const sy=Number(snapshot.year), sm=Number(snapshot.month), sg=Number(snapshot.generation);
  const cy=Number(checkpoint.year), cm=Number(checkpoint.month), cg=Number(checkpoint.generation);
  if(![sy,sm,sg,cy,cm,cg].every(Number.isFinite)) return false;
  // A monthly boundary, a new owner or an explicit terminal game-over is irreversible.
  return sy>cy || (sy===cy && sm>cm) || sg>cg ||
    (!!snapshot.gameOver && snapshot.gameOver.year===cy && snapshot.gameOver.month===cm);
}
function v483LoadJson(key){const str=localStorage.getItem(key);return str?JSON.parse(str):null;}
// null is a blocked startup, distinct from false (no rollback needed).
function v483BlockRecovery(error){
  console.warn('v4.8.3 checkpoint recovery blocked',error);
  openModal('<div class="modalHead"><b>진행 복구 대기</b></div><div class="modalDesc">행동 시작 지점으로 안전하게 복구하지 못했습니다. 저장 공간과 저장 권한을 확인한 뒤 다시 시도하세요. 복구가 완료될 때까지 게임 진행을 멈춥니다.</div><button id="retryCheckpointRecovery" type="button">복구 다시 시도</button>');
  // Keep the existing game controls inert, including keyboard navigation.
  for(const child of document.body.children){if(child!==$('overlay'))child.inert=true;}
  $('overlay').onclick=null;
  $('retryCheckpointRecovery').onclick=()=>location.reload();
  $('retryCheckpointRecovery').focus();
  return null;
}
// Replaces the old unconditional checkpoint cleanup.  A write that failed MUST
// leave the original checkpoint intact, even if the runtime state advanced.
v482CommitAction=function(){
  try{
    const cp=v483LoadJson(V482_CHECKPOINT_KEY);
    if(!cp)return true;
    const saved=v483LoadJson(SAVE_KEY);
    if(!v483IsDurablyCommitted(saved,cp))return false;
    localStorage.removeItem(V482_CHECKPOINT_KEY);
    return true;
  }catch(e){console.warn('v4.8.3 checkpoint commit deferred',e);return false;}
};
// If an app was killed after a successful final save but before deletion of the
// checkpoint, use the committed save.  Otherwise roll back to action beginning.
v482RecoverPendingAction=function(){
  let raw,cp;
  try{raw=localStorage.getItem(V482_CHECKPOINT_KEY);}catch(e){
    return v483BlockRecovery(e);
  }
  if(!raw)return false;
  // Only malformed payloads belong in quarantine. Storage failures are retryable.
  try{
    cp=JSON.parse(raw);
    if(!cp || cp.version!==482 || !cp.state)throw new Error('Unexpected checkpoint version');
    v48ValidateLoadedData(cp.state);
  }catch(e){
    console.error('v4.8.3 checkpoint invalid; preserved last saved state',e);
    try{localStorage.setItem(V482_CHECKPOINT_KEY+'.invalid',raw);localStorage.removeItem(V482_CHECKPOINT_KEY);}catch(_){}
    return false;
  }
  let savedRaw;
  try{savedRaw=localStorage.getItem(SAVE_KEY);}catch(e){return v483BlockRecovery(e);}
  let committed=null;
  // A malformed save is different from an unreadable save: a valid checkpoint
  // can replace malformed bytes, but must not overwrite an unknown commit.
  try{committed=savedRaw?JSON.parse(savedRaw):null;}catch(_){}
  const restored=JSON.stringify(cp.state);
  try{
    if(v483IsDurablyCommitted(committed,cp)){
      localStorage.removeItem(V482_CHECKPOINT_KEY);
      return false;
    }
    // All required writes precede cleanup. Replaying the same snapshot is idempotent.
    localStorage.setItem(SAVE_KEY,restored);
    localStorage.setItem(V482_RECOVERY_NOTICE_KEY,JSON.stringify({year:cp.year,month:cp.month,policy:cp.policy}));
    localStorage.removeItem(V482_CHECKPOINT_KEY);
    return true;
  }catch(e){
    console.warn('v4.8.3 checkpoint recovery deferred',e);
    // Notice/cleanup failures are safe only after a verified durable save.
    // Otherwise do not expose the existing mid-action save to loadGame().
    try{
      const saved=localStorage.getItem(SAVE_KEY);
      if(saved===restored || (saved && v483IsDurablyCommitted(JSON.parse(saved),cp)))return true;
    }catch(_){}
    return v483BlockRecovery(e);
  }
};
// Reset must discard the pending rollback before deleting the active save:
// otherwise restarting from scratch silently resurrects the prior campaign.
const _v483RestartGame=restartGame;
restartGame=function(){
  try{
    localStorage.removeItem(V482_CHECKPOINT_KEY);
    localStorage.removeItem(V482_RECOVERY_NOTICE_KEY);
    localStorage.removeItem(V482_CHECKPOINT_KEY+'.invalid');
  }catch(e){
    console.error('Failed to discard checkpoint during restart',e);
    openModal(modalHead('초기화 보류','이전 행동 체크포인트를 지울 수 없습니다.')+'<div class="modalDesc">기기 저장 공간을 확인한 뒤 다시 시도하세요.</div>');
    bindClose();return;
  }
  return _v483RestartGame();
};
