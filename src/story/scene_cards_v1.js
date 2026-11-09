/* Weapon Chronicle — Act I CH.1 scene cards (new games only).
   Card content lives in src/story/chapter1_scenes_v1.json and is embedded at
   build time (no runtime fetch; the offline bundle stays one file).
   Saved progress: state.sceneChapterV1 (additive; old saves never get one).
   Every step is committed only after saveGame() succeeds. On a failed save the
   previous progress is restored in memory, the same screen stays open and the
   player can retry. Choice effects and the CH.1 reward are applied exactly once,
   when the chapter is closed through the existing completeAct1ChapterV25 path. */
/* @include:chapter1-scenes-json */
const WC_SCENE_BACKGROUNDS_V1=Object.freeze(['action:contract','action:explore','action:investigate','action:rest',
 'service:market','service:smith','service:temple','service:visit','service:gear']);
function wcSceneEngineV1(data){
 const isText=v=>typeof v==='string'&&v.trim().length>0;
 const cards=new Map();
 const problems=[];
 const check=(ok,msg)=>{if(!ok)problems.push(msg);return ok;};
 if(check(data&&typeof data==='object'&&data.schema===1&&Array.isArray(data.cards)&&data.cards.length>0,'schema')){
  data.cards.forEach((c,i)=>{
   if(!check(c&&isText(c.id)&&!cards.has(c.id)&&c.id!=='END','card id '+i))return;
   cards.set(c.id,{card:c,index:i});
  });
  for(const [id,{card:c,index:i}] of cards){
   check(isText(c.title)&&isText(c.text)&&isText(c.kicker),'card text '+id);
   check(WC_SCENE_BACKGROUNDS_V1.includes(c.background),'card background '+id);
   check(Array.isArray(c.characters)&&c.characters.length>0&&c.characters.every(p=>p&&isText(p.name)),'card characters '+id);
   check(c.conditional===undefined||(Array.isArray(c.conditional)&&c.conditional.every(x=>x&&isText(x.flag)&&isText(x.text))),'card conditional '+id);
   if(!check(Array.isArray(c.choices)&&c.choices.length>=2&&c.choices.length<=3,'choice count '+id))continue;
   const seen=new Set();
   for(const x of c.choices){
    if(!check(x&&isText(x.id)&&!seen.has(x.id),'choice id '+id))continue;
    seen.add(x.id);
    check(isText(x.label)&&isText(x.result),'choice text '+id+'.'+x.id);
    // Forward-only links: no loops, every path ends.
    check(x.next==='END'||(cards.has(x.next)&&cards.get(x.next).index>i),'choice next '+id+'.'+x.id);
    if(x.next==='END')check(x.approach==='a'||x.approach==='b','final approach '+id+'.'+x.id);
    check(x.flag===undefined||isText(x.flag),'choice flag '+id+'.'+x.id);
    check(x.effects===undefined||(x.effects&&typeof x.effects==='object'&&Object.entries(x.effects).every(([k,v])=>
      ['gold','mind'].includes(k)&&Number.isInteger(v)&&Math.abs(v)<=20)),'choice effects '+id+'.'+x.id);
   }
  }
  check(cards.has(data.start),'start');
  // Every card must be reachable from the start card.
  const reach=new Set(),todo=[data.start];
  while(todo.length){const id=todo.pop();if(reach.has(id)||!cards.has(id))continue;reach.add(id);for(const x of cards.get(id).card.choices||[])if(x&&x.next!=='END')todo.push(x.next);}
  check(reach.size===cards.size,'unreachable card');
  const e=data.ending;
  check(e&&isText(e.title)&&isText(e.closing)&&isText(e.button)&&isText(e.kicker)&&WC_SCENE_BACKGROUNDS_V1.includes(e.background),'ending');
 }
 const valid=problems.length===0;
 const card=id=>cards.get(id)?.card||null;
 const choiceOf=(cardId,choiceId)=>card(cardId)?.choices.find(x=>x.id===choiceId)||null;
 function fill(text,owner){
  const name=String(owner||'소유자');
  const last=name.charCodeAt(name.length-1);
  const batchim=last>=0xAC00&&last<=0xD7A3&&(last-0xAC00)%28!==0;
  return String(text).replace(/\{owner(?:([^{}\/]+)\/([^{}\/]+))?\}/g,(_,yes,no)=>name+(yes?(batchim?yes:no):''));
 }
 function flags(run){return new Set((run?.picks||[]).map(p=>choiceOf(p.card,p.choice)?.flag).filter(Boolean));}
 function cardText(run,id,owner){
  const c=card(id);if(!c)return '';
  const f=flags(run),extra=(c.conditional||[]).filter(x=>f.has(x.flag)).map(x=>x.text);
  return fill([c.text,...extra].join('\n\n'),owner);
 }
 function begin(){
  if(!valid)throw new Error('Invalid scene card data');
  return {v:1,chapter:data.id,status:'card',card:data.start,picks:[]};
 }
 function isRun(run){
  if(!run||typeof run!=='object'||run.v!==1||run.chapter!==data.id||!Array.isArray(run.picks))return false;
  // Validate the actual route, not just individual IDs. A repeated or out-of-order
  // pick must never become another reward when a saved chapter is closed.
  let expected=data.start;
  for(const p of run.picks){
   if(!p||p.card!==expected)return false;
   const x=choiceOf(p.card,p.choice);
   if(!x||!isText(p.label)||!isText(p.result))return false;
   expected=x.next;
  }
  if(run.status==='card')return expected!=='END'&&run.card===expected&&!!card(run.card);
  if(run.status==='result')return run.picks.length>0&&run.picks.at(-1).card===run.card;
  return (run.status==='ending'||run.status==='done')&&expected==='END'&&run.card===null;
 }
 function choose(run,choiceId,owner){
  if(!isRun(run)||run.status!=='card')throw new Error('Scene card is not waiting for a choice');
  const x=choiceOf(run.card,choiceId);
  if(!x)throw new Error('Scene card has no such choice: '+choiceId);
  const pick={card:run.card,choice:x.id,label:fill(x.label,owner),result:fill(x.result,owner)};
  return {...run,status:'result',picks:[...run.picks,pick]};
 }
 function advance(run){
  if(!isRun(run)||run.status!=='result')throw new Error('Scene card has no result to advance');
  const last=run.picks.at(-1),x=choiceOf(last.card,last.choice);
  return x.next==='END'?{...run,status:'ending',card:null}:{...run,status:'card',card:x.next};
 }
 function effects(run){
  const sum={gold:0,mind:0};
  for(const p of run?.picks||[]){const e=choiceOf(p.card,p.choice)?.effects||{};for(const k of Object.keys(sum))sum[k]+=Number(e[k])||0;}
  return sum;
 }
 function approach(run){const last=(run?.picks||[]).at(-1);return choiceOf(last?.card,last?.choice)?.approach||null;}
 return Object.freeze({valid,problems:Object.freeze([...problems]),data,card,choiceOf,fill,cardText,begin,isRun,choose,advance,effects,approach,flags,
  count:()=>cards.size,position:id=>(cards.get(id)?.index??-1)+1});
}
const WC_SCENE_CARDS_V1=(()=>{
 const engine=wcSceneEngineV1(typeof WC_CH1_SCENES_JSON_V1==='undefined'?null:WC_CH1_SCENES_JSON_V1);
 if(!engine.valid)console.error('Chapter-1 scene cards disabled: invalid data',engine.problems);
 const live=typeof state!=='undefined'&&typeof document!=='undefined';
 let error='';          // shown on the current screen after a failed save
 let unsaved=false;     // a new game whose first scene record is not yet durable
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const owner=()=>state.owner?.name||'소유자';
 const run=()=>state.sceneChapterV1;
 const clone=v=>JSON.parse(JSON.stringify(v));
 function art(key){
  const [kind,name]=String(key).split(':');
  try{
   if(kind==='action'&&typeof actionArt39==='function')return actionArt39(name);
   if(kind==='service'&&typeof serviceSceneArt40==='function')return serviceSceneArt40(name);
  }catch(e){console.warn('scene art unavailable',key,e);}
  return '';
 }
 function save(){try{return saveGame()===true;}catch(e){console.error('Scene card save failed',e);return false;}}
 function active(){const r=run();return engine.valid&&engine.isRun(r)&&r.status!=='done';}
 function noStoredGame(){
  try{
   const keys=[typeof SAVE_KEY==='string'?SAVE_KEY:'',...(typeof LEGACY_SAVE_KEYS!=='undefined'?LEGACY_SAVE_KEYS:[]),
     typeof V482_CHECKPOINT_KEY==='string'?V482_CHECKPOINT_KEY:''].filter(Boolean);
   return keys.every(k=>localStorage.getItem(k)===null);
  }catch(e){return false;}
 }
 // Only commit a step when the whole game was saved; otherwise keep the previous step.
 function commit(next){
  const prev=run();
  state.sceneChapterV1=next;
  if(save()){error='';unsaved=false;return true;}
  state.sceneChapterV1=prev;
  error='저장하지 못해 이번 선택은 반영되지 않았어요. 저장 공간을 확인한 뒤 다시 눌러 주세요.';
  return false;
 }
 function castHtml(c){
  return c.characters.map(p=>`<span class="wcScene1Cast"><b>${esc(engine.fill(p.name,owner()))}</b>${p.role?`<small>${esc(engine.fill(p.role,owner()))}</small>`:''}</span>`).join('');
 }
 function shell(bg,kicker,title,cast,body,step){
  const total=engine.count();
  return `<div class="wcScene1" data-scene-step="${esc(step)}">
   <div class="modalHead mainChapterHead"><div class="chapterName"><small>MAIN STREAM · 제1장 · CHAPTER 1/8 · 장면 카드</small><b>${esc(engine.data.title)}</b></div><span style="font-size:8px;color:#776650">${esc(state.year)}년차 ${esc(state.month)}월</span></div>
   <div class="wcScene1Art" data-scene-bg="${esc(bg)}" style="background-image:url('${art(bg)}')">
    <div class="wcScene1Shade"><div class="storyKicker">${esc(kicker)}</div><div class="storyTitle">${esc(title)}</div>
    ${/^(card|result):/.test(step)?`<div class="wcScene1Pos">장면 ${engine.position(step.replace(/^(card|result):/,''))} / ${total}</div>`:''}</div>
   </div>
   ${cast?`<div class="wcScene1CastRow">${cast}</div>`:''}
   <div class="wcScene1Body">${body}</div>
   ${error?`<div class="wcScene1Error" role="alert">${esc(error)}</div>`:''}
  </div>`;
 }
 // Read only the durable, resolved sentences; never regenerate from current data
 // or the current owner (which can change after this chapter).
 function recap(){
  const r=run();
  return engine.valid&&engine.isRun(r)&&['ending','done'].includes(r.status)?r.picks.map(p=>p.result):null;
 }
 function show(completed=false){
  if(!live||(!active()&&!(completed&&run()?.status==='done'&&recap())))return false;
  const r=run();let html='';
  if(r.status==='card'||r.status==='result'){
   const c=engine.card(r.card);
   const text=engine.cardText(r,r.card,owner());
   let lower='';
   if(r.status==='card'){
    lower=`<div class="storyChoices wcScene1Choices">${c.choices.map(x=>`<button class="choice" type="button" data-scene-choice="${esc(x.id)}"${unsaved?' disabled':''}><b>${esc(engine.fill(x.label,owner()))}</b></button>`).join('')}</div>`;
    if(unsaved)lower+=`<button class="choice wcScene1Retry" type="button" data-scene-retry="1"><b>다시 저장하기</b></button>`;
   }else{
    const p=r.picks.at(-1),x=engine.choiceOf(p.card,p.choice);
    lower=`<div class="wcScene1Result" data-scene-result="${esc(p.choice)}"><small>선택 · ${esc(p.label)}</small><span class="wcScene1ResultTag">결과</span><p>${esc(p.result)}</p></div>
     <div class="storyChoices wcScene1Choices"><button class="choice" type="button" data-scene-next="1"><b>${x.next==='END'?'이번 장의 이야기 보기':'다음 장면으로'}</b></button></div>`;
   }
   html=shell(c.background,c.kicker,c.title,castHtml(c),`<div class="storyText wcScene1Text">${esc(text)}</div>${lower}`,(r.status==='card'?'card:':'result:')+r.card);
  }else{
   const e=engine.data.ending,eff=engine.effects(r);
   const lines=recap().map((text,i)=>`<li data-scene-story="${i}">${esc(text)}</li>`).join('');
   const gains=[eff.gold?`GOLD ${eff.gold>0?'+':''}${eff.gold}`:'',eff.mind?`정신 ${eff.mind>0?'+':''}${eff.mind}`:''].filter(Boolean).join(' · ');
   html=shell(e.background,e.kicker,e.title,'',`<ol class="wcScene1Story">${lines}</ol><div class="storyText wcScene1Text">${esc(engine.fill(e.closing,owner()))}</div>
     ${gains?`<div class="wcScene1Gain">선택의 대가: ${esc(gains)}</div>`:''}
     <div class="storyChoices wcScene1Choices">${r.status==='done'?'<button class="choice" type="button" data-scene-recap-close="1"><b>연대기로 돌아가기</b></button>':`<button class="choice" type="button" data-scene-finish="1"><b>${esc(e.button)}</b></button>`}</div>`,r.status==='done'?'recap':'ending');
  }
  openModal(html);
  $('overlay')?.classList.add('storyFullscreen');
  const m=$('modal');
  m.querySelectorAll('[data-scene-choice]').forEach(b=>b.onclick=()=>pick(b.dataset.sceneChoice));
  m.querySelector('[data-scene-next]')?.addEventListener('click',()=>next());
  m.querySelector('[data-scene-finish]')?.addEventListener('click',()=>finish());
  m.querySelector('[data-scene-retry]')?.addEventListener('click',()=>retryStart());
  m.querySelector('[data-scene-recap-close]')?.addEventListener('click',()=>closeModal());
  return true;
 }
 function pick(choiceId){
  if(!active()||unsaved||run().status!=='card')return false;
  const ok=commit(engine.choose(run(),choiceId,owner()));
  show();return ok;
 }
 function next(){
  if(!active()||run().status!=='result')return false;
  const ok=commit(engine.advance(run()));
  show();return ok;
 }
 function snapshot(){const snap={};for(const k of Object.keys(state))snap[k]=structuredClone(state[k]);return snap;}
 function restore(snap){for(const k of Object.keys(state))if(!(k in snap))delete state[k];Object.assign(state,snap);}
 // Close the chapter: effects + existing CH.1 reward + completion in ONE durable save.
 function finish(){
  const r=run();
  if(!active()||r.status!=='ending')return false;
  let snap;
  try{snap=snapshot();}catch(e){console.error('Scene card snapshot failed',e);error='진행 상태를 확인하지 못했어요. 다시 눌러 주세요.';show();return false;}
  let ok=false;
  try{
   const eff=engine.effects(r),y=state.year,m=state.month;
   state.gold=Math.max(0,(Number(state.gold)||0)+eff.gold);
   state.mind=clamp((Number(state.mind)||0)+eff.mind,0,state.maxMind||100);
   state.sceneChapterV1={...clone(r),status:'done',closed:{year:y,month:m}};
   ensureV25MainState();
   const ms=state.mainStory;
   ms.act1Research[1]=ms.act1Research[1]||{done:true,path:'scene',year:y,month:m};
   const reward=act1ChapterRewardV25(1,'');
   addWorldFact(`${engine.data.title}: ${r.picks.map(p=>p.result).join(' ')}`,'scene:act1:ch1');
   addLog(`제1장 CH.1 장면 카드 완료 — ${reward}`);
   // v5.2 departure pivot reads the route from storyCtx (a=sheltered, b=dispersed).
   state.storyCtx={v25Approach:engine.approach(r),notes:[],sceneCards:true};
   ok=completeAct1ChapterV25(1,'scene_cards',{act1_ch1_scene_route:r.picks.map(p=>p.card+':'+p.choice).join('>')})===true;
  }catch(e){console.error('Scene card chapter close failed',e);ok=false;}
  if(!ok){
   restore(snap);
   error='저장하지 못해 장을 마치지 못했어요. 이야기는 그대로 남아 있으니 다시 눌러 주세요.';
   show();return false;
  }
  state.storyCtx=snap.storyCtx??null;
  error='';closeModal();
  try{render();}catch(e){console.error(e);}
  return true;
 }
 function retryStart(){
  if(!unsaved)return true;
  if(save()){unsaved=false;error='';}
  else error='아직 저장하지 못했어요. 저장 공간을 확인한 뒤 다시 눌러 주세요.';
  show();return !unsaved;
 }
 function startNewGame(){
  if(!live||!engine.valid)return false;
  ensureV25MainState();
  const ms=state.mainStory;
  if(state.sceneChapterV1||ms.act1ChapterResults.length||ms.node!=='1-01')return false;
  state.sceneChapterV1=engine.begin();
  if(!save()){unsaved=true;error='새 게임을 저장하지 못했어요. 저장 공간을 확인한 뒤 「다시 저장하기」를 눌러 주세요.';}
  return show();
 }
 function resume(){return show();}
 if(live&&typeof document!=='undefined'&&!document.getElementById('wcScene1Style')){
  const st=document.createElement('style');st.id='wcScene1Style';
  st.textContent=`#modal:has(.wcScene1){max-width:none!important;width:100%!important}
.wcScene1{max-width:640px;margin:0 auto}
.wcScene1Art{position:relative;min-height:190px;border-radius:12px;overflow:hidden;background-size:cover;background-position:center;border:1px solid #9c7c50;image-rendering:auto}
.wcScene1Shade{position:absolute;inset:0;display:flex;flex-direction:column;justify-content:flex-end;padding:12px;background:linear-gradient(180deg,#0000 30%,#060c14e6 100%)}
.wcScene1Pos{font-size:11px;color:#c9b48c;margin-top:4px}
.wcScene1CastRow{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0}
.wcScene1Cast{display:inline-flex;flex-direction:column;padding:5px 9px;border:1px solid #6d5a3c;border-radius:8px;background:#101a26;color:#f2d49e;font-size:12px}
.wcScene1Cast small{color:#a99b84;font-size:10px}
.wcScene1Text{white-space:pre-line}
.wcScene1Result{margin:10px 0;padding:10px;border-left:3px solid #d3b46e;background:#162433;border-radius:6px}
.wcScene1Result small{display:block;color:#a99b84;font-size:11px;margin-bottom:4px}
.wcScene1ResultTag{font-weight:700;color:#d3b46e;margin-right:6px}
.wcScene1Result p{display:inline;margin:0}
.wcScene1Story{margin:10px 0;padding-left:20px;line-height:1.7}
.wcScene1Gain{margin:8px 0;color:#d3b46e;font-size:12px}
.wcScene1 .choice{display:block;width:100%;margin:8px 0;padding:12px;text-align:left;background:#142232!important;border:1px solid #9c7c50!important;border-radius:10px;color:#f2d49e!important}
.wcScene1 .choice b{color:#f2d49e!important}
.wcScene1 .choice[disabled]{opacity:.45}
.wcScene1Error{margin:10px 0;padding:9px;border:1px solid #c0634f;border-radius:8px;background:#3a1612;color:#ffd9cf}`;
  document.head.appendChild(st);
 }
 const api=Object.freeze({engine,valid:engine.valid,noStoredGame,startNewGame,resume,show,pick,next,finish,retryStart,recap,showRecap:()=>show(true),
  active,view:()=>live?{run:run()?clone(run()):null,error,unsaved}:null});
 if(typeof window!=='undefined')window.WC_SCENE_CARDS_V1=api;
 return api;
})();
