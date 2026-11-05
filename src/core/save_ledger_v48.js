/* Weapon Chronicle v4.8 — forward-compatible save/branch ledger.
 * Zero gameplay rebalance. One canonical save key retained for old v3.x-v4.7 saves.
 * New ledger is additive and never assigns historical branch outcomes.
 */
const V48_SAVE_SCHEMA = 48;
const V48_BACKUP_KEY = (typeof SAVE_KEY==='undefined'?'weaponChronicleLifeHubV30':SAVE_KEY) + '.backup-before-v48';
const V48_BAD_SAVE_KEY = (typeof SAVE_KEY==='undefined'?'weaponChronicleLifeHubV30':SAVE_KEY) + '.invalid-before-v48';
/* Synchronous, JSON-owned hooks. Missing fields in older saves leave module
 * defaults intact. Unknown module payloads survive saves for forward compatibility.
 * Lifecycle modules can register through services.require('save').
 */
const v48SaveModules=new Map();
let v48PendingModuleData;
function registerSaveModule(id,hooks){
  if(typeof id!=='string'||!id.trim())throw new TypeError('Invalid save module id');
  if(!hooks||typeof hooks.serialize!=='function'||typeof hooks.restore!=='function')
    throw new TypeError('Save modules require serialize and restore hooks');
  if(v48SaveModules.has(id))throw new Error('Duplicate save module: '+id);
  const entry={serialize:hooks.serialize.bind(hooks),restore:hooks.restore.bind(hooks)};
  v48SaveModules.set(id,entry);
  return ()=>{if(v48SaveModules.get(id)===entry)v48SaveModules.delete(id);};
}
function v48CloneSaveData(value){
  const json=JSON.stringify(value,(k,v)=>v instanceof Set?[...v]:v);
  if(json===undefined)throw new TypeError('Save module state must be JSON serializable');
  return JSON.parse(json);
}
function serializeSaveModules(existing){
  const result=Object.create(null);
  for(const [id,value] of Object.entries(v48SafeRecord(existing)))result[id]=v48CloneSaveData(value);
  for(const [id,hooks] of v48SaveModules){
    const value=hooks.serialize();
    if(value&&typeof value.then==='function')throw new TypeError('Save hooks must be synchronous');
    result[id]=v48CloneSaveData(value);
  }
  return result;
}
function restoreSaveModules(saved){
  const data=v48SafeRecord(saved);
  for(const [id,hooks] of v48SaveModules){
    if(!Object.prototype.hasOwnProperty.call(data,id))continue;
    const result=hooks.restore(v48CloneSaveData(data[id]));
    if(result&&typeof result.then==='function')throw new TypeError('Save hooks must be synchronous');
  }
}
function v48SerializeState(){
  const copy=v48CloneSaveData(state);
  // recalcWeapon owns these fields. Persist parts/upgrades and current resources,
  // not a second copy of their calculated totals (also used by checkpoints).
  if(copy.weapon)for(const key of ['power','precision','toughness','handling',
    'maxResonance','resonanceRecovery','length','weight','carryWeight','firstHandling'])
    delete copy.weapon[key];
  copy.moduleSaveData=serializeSaveModules(state.moduleSaveData);
  copy.storyCtx=null;copy.activeStory=null;
  return copy;
}
if(typeof WC_GAME_MODULES_V1!=='undefined')WC_GAME_MODULES_V1.register('save',
  Object.freeze({registerSaveModule,serializeSaveModules,restoreSaveModules}));
function v48SafeArray(value){return Array.isArray(value)?value:[];}
function v48SafeRecord(value){return value&&typeof value==='object'&&!Array.isArray(value)?value:{};}
function v48BackupRaw(raw,invalid=false){
  if(typeof raw!=='string'||!raw)return false;
  const key=invalid?V48_BAD_SAVE_KEY:V48_BACKUP_KEY;
  try{if(localStorage.getItem(key)===null)localStorage.setItem(key,raw);return true;}catch(e){console.warn('v4.8 legacy save backup failed',e);return false;}
}
function v48ValidateLoadedData(data){
  if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('저장 루트 객체가 아닙니다.');
  if(!data.owner||typeof data.owner!=='object'||Array.isArray(data.owner))throw new Error('소유자 데이터가 없습니다.');
  if(!data.weapon||typeof data.weapon!=='object'||Array.isArray(data.weapon))throw new Error('검 데이터가 없습니다.');
  if(!data.weapon.parts||typeof data.weapon.parts!=='object'||Array.isArray(data.weapon.parts))throw new Error('검 부품 데이터가 없습니다.');
  if(data.mainStory!=null&&(typeof data.mainStory!=='object'||Array.isArray(data.mainStory)))throw new Error('메인 진행 데이터가 손상되었습니다.');
  if(data.mainStory?.mainV47?.results!=null&&!Array.isArray(data.mainStory.mainV47.results))throw new Error('메인 결과 기록이 손상되었습니다.');
  return data;
}
function v48EnsureState(){
  state.worldHistory=v48SafeArray(state.worldHistory);
  state.branchFlags=v48SafeRecord(state.branchFlags);
  state.endingRecords=v48SafeArray(state.endingRecords);
  state.saveMeta=v48SafeRecord(state.saveMeta);
  const seen=new Set(state.worldHistory.filter(x=>x&&typeof x.id==='string').map(x=>x.id));
  const append=(id,entry)=>{if(seen.has(id))return;seen.add(id);state.worldHistory.push({id,...entry});};
  const main=v48SafeRecord(state.mainStory);
  for(const x of v48SafeArray(main.act1ChapterResults)){
    const n=Number(x?.chapter);
    if(Number.isInteger(n)&&n>=1&&n<=8)append(`main:ch${n}`,{
      type:'mainChapter',chapter:n,act:1,local:n,result:String(x.result||'기존 진행 기록'),
      origin:'legacy',owner:String(x.owner||'')});
  }
  for(const x of v48SafeArray(main.mainV47?.results)){
    const n=Number(x?.no);
    if(Number.isInteger(n)&&n>=9&&n<=40)append(`main:ch${n}`,{
      type:'mainChapter',chapter:n,act:Number(x.act)||Math.floor((n-1)/8)+1,
      local:Number(x.chapter)||(n-1)%8+1,title:String(x.title||''),
      result:String(x.result||''),path:String(x.path||''),owner:String(x.owner||''),
      year:Number(x.year)||0,month:Number(x.month)||0,origin:'v47'});
  }
  // Branch flags remain explicit: mere A/B dialogue choices DO NOT fabricate history-changing branches.
  state.saveMeta.schemaVersion=V48_SAVE_SCHEMA;
  state.saveMeta.build='v4.8.3';
  return state;
}
function v48RecordMainChapter(c,result,path){
  v48EnsureState();
  const n=Number(c?.no);
  if(!Number.isInteger(n)||n<9||n>40)return;
  const id=`main:ch${n}`;
  const found=state.worldHistory.find(e=>e?.id===id);
  if(found){found.path=String(path||found.path||'');found.result=String(result||found.result||'');found.origin='v48';return;}
  state.worldHistory.push({id,type:'mainChapter',chapter:n,act:c.act,local:c.local,
    title:c.title,result:String(result||''),path:String(path||''),owner:state.owner.name,
    year:state.year,month:state.month,origin:'v48'});
}
function v48PrepareLoad(raw){
  v48BackupRaw(raw);
  const data=v48ValidateLoadedData(JSON.parse(raw));
  // Inner checkpoint recovery can replace the save AFTER the equipment pool's
  // outer preloader ran. Restore this actual payload before legacy initialization
  // recalculates the weapon or clamps owner HP against equipped armor.
  if(typeof WC_EQUIPMENT_POOL_V1!=='undefined')WC_EQUIPMENT_POOL_V1.restoreFromSave(raw);
  v48PendingModuleData=data.moduleSaveData;
  // Leave existing values untouched. Additional fields are initialized after the legacy initializer.
  return data;
}
function v48SaveGame(){
  try{
    v48EnsureState();
    const copy=v48SerializeState();
    copy.resonanceTopics=[...(state.resonanceTopics instanceof Set?state.resonanceTopics:new Set())];
    copy.storyCtx=null;copy.activeStory=null;
    copy.saveMeta.savedAt=new Date().toISOString();
    const json=JSON.stringify(copy);
    localStorage.setItem(SAVE_KEY,json);
    return true;
  }catch(e){console.error('v4.8 save failed (original storage retained)',e);return false;}
}
function v48MigrationSummary(){
  v48EnsureState();
  return {schemaVersion:state.saveMeta.schemaVersion,worldEvents:state.worldHistory.length,
    branches:Object.keys(state.branchFlags).length,endings:state.endingRecords.length,
    stage:state.mainStory?.mainV47?.stage||null,mainComplete:!!state.mainStory?.mainV47?.complete};
}


