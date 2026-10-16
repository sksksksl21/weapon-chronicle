/* Weapon Chronicle v5.2 — ACT I historical consequences.
   Commit only at the existing Act-I chapter completion boundary.
   Never invent choices for already-completed / imported chapters.
 */
const V52_ACT1_PIVOTS={
  1:{key:'departure',a:'sheltered',b:'dispersed',lost:'scattered',title:'트로이 최후의 출항',delta:{sheltered:{crew:1,supplies:-1},dispersed:{crew:-1,supplies:1},scattered:{crew:-2}},effects:{sheltered:'부상자와 피난민을 선창에 모아 보호했다. 귀향선의 증언과 동료가 남았지만 식량이 줄었다.',dispersed:'사람들이 흩어져 작은 배로 출항했다. 보급은 보존했지만 몇몇 일행이 끝내 합류하지 못했다.',scattered:'약탈대를 막지 못해 출항 명부 일부가 사라졌다. 누구를 태웠는지도 확인하기 어려워졌다.'}},
  2:{key:'ismaros',a:'documented',b:'covert',lost:'expelled',title:'이스마로스의 기억',delta:{documented:{supplies:1},covert:{ship:3},expelled:{ship:-5}},effects:{documented:'공식 항만 출입 기록을 보존했다. 훗날 돌아온 이들의 신분을 입증하는 문서가 됐다.',covert:'어부의 외곽 수로를 따라 숨어 이동했다. 선박은 보존했지만 항구 사람들은 귀향자들을 불신했다.',expelled:'항구 수비대에 밀려 철수했다. 배에 손상이 남았고 공식 기록은 얻지 못했다.'}},
  3:{key:'counterattack',a:'rearguard',b:'barricade',lost:'routed',title:'이스마로스 역습의 대가',delta:{rearguard:{crew:1,ship:-4},barricade:{crew:-1,ship:6},routed:{crew:-2,ship:-8}},effects:{rearguard:'후미에서 끝까지 물러나지 않아 뒤처진 선원을 구했다. 귀향선은 역습으로 손상됐다.',barricade:'부두를 막아 선체를 지켰지만 퇴로를 미처 찾지 못한 이들이 희생됐다.',routed:'역습을 견디지 못했고 선원과 배 모두 손실을 입었다.'}},
  4:{key:'lotus',a:'awakened',b:'windward',lost:'forgotten',title:'로토스 섬을 떠난 사람들',delta:{awakened:{crew:1,mind:-1},windward:{mind:2},forgotten:{crew:-2}},effects:{awakened:'열매를 먹은 선원을 직접 깨워 데려왔다. 귀향할 이유를 기억하는 사람이 늘었다.',windward:'꽃가루를 피해 바람길로 빠져나왔다. 일행은 오염을 피했으나 남은 이들을 모두 구하지 못했다.',forgotten:'귀향의 이유를 잊은 몇몇 선원은 로토스 섬에 남았다.'}},
  5:{key:'missing',a:'escorted',b:'diverted',lost:'captured',title:'사라진 선원의 행방',delta:{escorted:{crew:1},diverted:{ship:2},captured:{crew:-1}},effects:{escorted:'실종자를 무리 가운데 두고 항구로 되돌아왔다. 그 선원은 훗날 증인이 됐다.',diverted:'추격대를 따돌릴 미끼를 보냈다. 나머지 선원과 선박은 살아남았으나 실종자의 후일담은 불확실하게 남았다.',captured:'추격대의 공격에서 물러나며 실종자 구조에 실패했다.'}},
  6:{key:'goatpath',a:'detour',b:'held',lost:'cave_loss',title:'염소섬의 검은 동굴',delta:{detour:{supplies:1},held:{ship:2},cave_loss:{crew:-1}},effects:{detour:'염소가 드나드는 좁은 길을 발견했다. 후대 선원도 이용할 우회로가 기록됐다.',held:'바위 틈을 방어해 이탈할 시간을 얻었다. 배는 동굴 어귀의 사나운 바람을 피했다.',cave_loss:'동굴짐승에게 쫓겨 선원의 일부가 길을 잃었다.'}},
  7:{key:'cyclops',a:'blindspot',b:'herd',lost:'overrun',title:'폴리페모스의 첫 대치',delta:{blindspot:{ship:3},herd:{supplies:-1},overrun:{crew:-1}},effects:{blindspot:'바위 기둥 뒤의 사각을 이용했다. 거인의 곤봉과 시야에 대한 정보가 생겼다.',herd:'가축을 풀어 거인의 손을 분산시켰다. 탈출 시간을 벌었지만 소란에 짐과 식량을 잃었다.',overrun:'거인의 힘을 견디지 못해 급히 물러났다.'}},
  8:{key:'identity',a:'hidden',b:'hidden',lost:'unknown',title:'절벽에 남긴 이름',delta:{true:{supplies:-1},false:{supplies:0},silent:{supplies:1},unknown:{ship:-3}},effects:{true:'진짜 이름이 거인의 저주를 통해 포세이돈에게 닿았다. 훗날 바다의 추격이 거세졌다.',false:'거짓 이름이 바다에 남아 추격자를 혼란시켰다. 그러나 오래 버틸 수 있는 속임수는 아니었다.',silent:'이름을 밝히지 않고 떠났다. 포세이돈이 추격할 뚜렷한 단서 하나를 얻지 못했다.',unknown:'마지막 싸움에서 밀려나 이름을 남길 겨를도 없었다.'}}
};
function v52EnsureAct1(){
 const h=v50EnsureHistory();let a=h.act1;
 if(!a||typeof a!=='object'||Array.isArray(a))a=h.act1={version:52,pivots:{},entries:[],consequences:{}};
 if(!a.pivots||typeof a.pivots!=='object'||Array.isArray(a.pivots))a.pivots={};
 if(!Array.isArray(a.entries))a.entries=[];
 if(!a.consequences||typeof a.consequences!=='object')a.consequences={};
 return a;
}
function v52Act1Pivot(key){return v52EnsureAct1().pivots[key]||null;}
function v52CommitAct1(ch,result,ctx){
 const def=V52_ACT1_PIVOTS[ch];if(!def)return;
 const a=v52EnsureAct1();
 if(a.pivots[def.key] || a.entries.some(e=>e.chapter===ch))return;
 const defeated=result==='defeat'||result==='owner_death'||result==='death';
 const path=ctx?.v25Approach==='a'||ctx?.v25Approach==='b'?ctx.v25Approach:null;
 const identity=ch===8?(defeated?'unknown':({true:'true',false:'false',silent:'silent'}[ctx?.v25Name]||'unknown')):null;
 // Missing route is a factual absence; a migrated save must not be made to look like an A choice.
 const value=ch===8?identity:defeated?def.lost:path?def[path]:'unrecorded';
 const consequence=def.delta[value]||{};
 a.pivots[def.key]=value;
 a.consequences[def.key]=Object.fromEntries(Object.entries(consequence).filter(([k])=>k!=='mind'));
 if(Object.keys(consequence).length)mainAdjust(consequence);
 const entry={chapter:ch,key:def.key,choice:value,approach:path||null,result,owner:state.owner.name,year:state.year,month:state.month};
 a.entries.push(entry);
 const id=`history:act1:${def.key}`;
 if(!state.worldHistory.some(x=>x?.id===id))state.worldHistory.push({id,type:'act1HistoricalPivot',...entry,text:def.effects[value]||'선택의 경위가 불확실하다.'});
 state.mainStory.flags[`act1_history_${def.key}_${value}`]=true;
 addWorldFact(`${def.title}: ${def.effects[value]||'기록이 불완전하다.'}`,id);
}
const _v52CompleteAct1=completeAct1ChapterV25;
completeAct1ChapterV25=function(ch,result,patch={}){
 // Record the chosen route only for chapters being completed NOW.
 const existed=state.mainStory?.act1ChapterResults?.some(x=>Number(x.chapter)===Number(ch));
 if(!existed)v52CommitAct1(ch,result,state.storyCtx);
 return _v52CompleteAct1(ch,result,patch);
};
function v52Act1EchoForChapter(ch){
 const p=v52EnsureAct1().pivots, fragments=[];
 if(ch>=2&&p.departure==='sheltered')fragments.push('트로이에서 구조한 부상자가 이스마로스에서 승선 명단의 증인이 됐다.');
 if(ch>=3&&p.ismaros==='documented')fragments.push('항구에서 받은 거래 증표가 역습의 시작을 가늠하는 단서로 쓰였다.');
 if(ch>=3&&p.ismaros==='covert')fragments.push('공식 증표 없이 수로로 떠난 탓에 항만 주민의 증언을 얻기 어려웠다.');
 if(ch>=4&&p.counterattack==='rearguard')fragments.push('후미에서 구해낸 선원들이 로토스 섬에서도 서로를 붙잡았다.');
 if(ch>=5&&p.lotus==='awakened')fragments.push('로토스에서 회복한 선원이 새로운 실종자의 행방을 기억했다.');
 if(ch>=6&&p.missing==='escorted')fragments.push('구조한 선원이 염소섬 동굴 입구에서 낯선 발자국을 먼저 찾았다.');
 if(ch>=7&&p.goatpath==='detour')fragments.push('염소가 드나드는 좁은 길의 기록은 거인의 동굴에서도 퇴로를 찾는 데 쓰였다.');
 if(ch>=8&&p.cyclops==='blindspot')fragments.push('거인의 첫 대치에서 확인한 바위 사각은 마지막 절벽 추격에서도 유효했다.');
 return fragments.slice(-2).join('\n');
}
const _v52ShowAct1=showMainStoryNode;
showMainStoryNode=function(node){
 const ch=currentAct1ChapterV25()?.index||0;
 const result=_v52ShowAct1(node);
 if(ch&&(['chapter_intro','start','v25_boss_gate'].includes(node))){
  const echo=v52Act1EchoForChapter(ch),body=$('modal')?.querySelector('.storyText');
  if(echo&&body&&!body.dataset.v52Echo){body.textContent+='\n\n[이전 선택의 영향] '+echo;body.dataset.v52Echo='1';}
 }
 return result;
};
function v52Act1LaterEcho(c){
 const p=v52EnsureAct1().pivots, n=Number(c?.no)||0,out=[];
 if(n>=9&&n<=17){
  if(p.identity==='true')out.push('폴리페모스가 알아낸 이름 때문에 포세이돈의 추격이 더 끈질겼다.');
  if(p.identity==='silent')out.push('절벽에서 이름을 남기지 않아 신들의 수색은 당장 한 명을 겨누지 못했다.');
  if(p.identity==='false')out.push('거짓 이름의 소문이 항구마다 다른 사람을 가리켰다.');
 }
 if(n>=10&&n<=16){
  if(p.departure==='sheltered')out.push('트로이에서 구한 부상자들이 남아 바람과 식량에 관한 증언을 했다.');
  if(p.ismaros==='covert')out.push('이스마로스의 주민들은 정체를 감춘 귀향선에 협조하지 않았다.');
  if(p.lotus==='awakened')out.push('로토스에서 돌아온 사람들은 다시는 쉽게 귀향을 포기하지 않겠다고 했다.');
 }
 if(n>=30&&n<=40){
  if(p.ismaros==='documented')out.push('이스마로스 항만 증표가 오래전의 출항 경로를 입증했다.');
  if(p.counterattack==='rearguard')out.push('이스마로스에서 구출된 선원이 살아 돌아와 궁전의 증언에 힘을 보탰다.');
  if(p.lotus==='forgotten')out.push('로토스에 남겨진 이들의 이름은 이타카 귀향 명부에 빈칸으로 남았다.');
  if(p.identity==='true')out.push('폴리페모스에게 남긴 이름은 영웅적 명성과 위험한 저주를 함께 남겼다.');
 }
 return out.slice(0,3).join(' ');
}
// Apply the branch echo to actual subsequent scenes. No replacement of chapter story or gameplay logic.
const _v52V50Echo=v50NarrativeEcho;
v50NarrativeEcho=function(c){const earlier=v52Act1LaterEcho(c);return _v52V50Echo(c)+(earlier?'\n\n[제1장에서 이어진 역사] '+earlier:'');};
const _v52V50Variant=v50Variant;
v50Variant=function(c){
 const base=_v52V50Variant(c);if(!base)return base;
 const n=base.no,p=v52EnsureAct1().pivots,lines=[];
 if(n===9){if(p.identity==='true')lines.push('폴리페모스에게 남긴 이름이 바람 신의 섬에 먼저 소문으로 도착했다.');if(p.identity==='silent')lines.push('누가 거인의 눈을 다치게 했는지 항구에는 알려지지 않았다.');}
 if(n===12&&p.ismaros==='documented')lines.push('이스마로스의 세관 문서를 지닌 선원이 낯선 항구에서도 거래의 증거를 제시했다.');
 if(n===14&&p.lotus==='awakened')lines.push('로토스에서 정신을 되찾은 선원들이 변신당한 동료를 찾을 때 먼저 사람의 이름을 불렀다.');
 if(n===31&&p.departure==='sheltered')lines.push('트로이에서 함께 출항한 부상병이 늙은 증인으로 돌아왔다.');
 if(n===37&&p.counterattack==='rearguard')lines.push('이스마로스의 후미를 지켰던 선원이 당시 검을 들었던 자의 행적을 증언했다.');
 return lines.length?{...base,intro:base.intro+'\n\n'+lines.join(' ')}:base;
};
// The eight v5.0 pivots remain authoritative; Act-I may influence the support threshold only.
const _v52V50Support=v50Support;
v50Support=function(){
 const p=v52EnsureAct1().pivots;
 const plus=(p.departure==='sheltered'?1:0)+(p.ismaros==='documented'?1:0)+(p.counterattack==='rearguard'?1:0)+(p.lotus==='awakened'?1:0);
 const minus=(p.identity==='true'?1:0)+(p.ismaros==='expelled'?1:0)+(p.lotus==='forgotten'?1:0);
 const influence=Math.max(-2,Math.min(2,plus-minus));
 return Math.max(0,_v52V50Support()+influence);
};
// Add four short post-Act-I consequences using the existing v5.1 one-time quest and checkpoint engine.
Object.assign(V51_AFTERMATH,{
 act1_departure:{policy:'contract',unlock:9,place:'바다에 남은 피난민 선박',title:'트로이 출항의 빈자리',intro:{default:'제1장 마지막 부두에서 누가 탔고 누가 남았는지 다시 확인해 달라는 연락이 왔다.'},choiceA:'승선 기록을 복구한다',choiceB:'뒤늦게 도착한 생존자의 숙소를 찾는다',afterA:'잃어버린 출항 명단을 복원해 귀향선의 신분을 증명할 자료를 남겼다.',afterB:'늦게 구조된 사람들이 안전하게 쉴 곳을 얻었다.',region:'troy',group:'출항',effects:[{gold:1,mind:0},{gold:0,mind:2}]},
 act1_ismaros:{policy:'investigate',unlock:9,place:'이스마로스 항구',title:'문서에 남은 항로',intro:{default:'이스마로스의 세관 증표와 실제 항해 일지가 일치하는지 확인해 달라는 요청이 왔다.'},choiceA:'항구 장부의 빈 시간을 대조한다',choiceB:'어부의 증언을 새 문서로 정리한다',afterA:'공식 장부와 항로의 차이를 기록했다.',afterB:'어부들의 해안 지식이 다음 선원에게 남았다.',region:'ismaros',group:'세관',effects:[{gold:2,mind:0},{gold:0,mind:2}]},
 act1_lotus:{policy:'explore',unlock:9,place:'로토스 섬',title:'기억을 되찾는 길',intro:{default:'로토스 섬에 아직 귀향하지 못한 이들이 있다는 소식이 들렸다.'},choiceA:'남겨진 선원의 이름을 찾아본다',choiceB:'바람길의 표식을 보수한다',afterA:'이름을 잃어버린 이들의 기록을 확보했다.',afterB:'섬에서 빠져나올 수 있는 길의 표식이 보수됐다.',region:'lotus',group:'기억',effects:[{gold:0,mind:2},{gold:2,mind:0}]},
 act1_identity:{policy:'investigate',unlock:9,place:'폴리페모스의 절벽',title:'절벽이 기억하는 이름',intro:{default:'거인의 마지막 외침이 여러 항구에서 서로 다른 이름으로 전해지고 있었다.'},choiceA:'저주의 출처와 증언을 기록한다',choiceB:'잘못 퍼진 소문을 바로잡는다',afterA:'거인의 외침이 어디서 시작됐는지 연대기에 남았다.',afterB:'항구에서 떠돌던 누군가의 거짓 누명을 벗겼다.',region:'cyclops',group:'저주',effects:[{gold:0,mind:2},{gold:0,mind:1}]}
});
const _v52AftermathAvailable=v51AftermathAvailable;
v51AftermathAvailable=function(key){
 if(!String(key).startsWith('act1_'))return _v52AftermathAvailable(key);
 const def=V51_AFTERMATH[key],chkey=String(key).slice(5),a=v52EnsureAct1();
 return !!(def&&a.pivots[chkey]&&!v51Ensure()[key]&&((ensureV47()?.stage||0)>=def.unlock));
};
const _v52V51News=v51NewsText;
v51NewsText=function(){const orig=_v52V51News(),p=v52EnsureAct1().pivots,stage=ensureV47()?.stage||0;if(stage<9)return orig;
 const old=p.identity==='true'?'폴리페모스가 남긴 진짜 이름의 저주':p.identity==='silent'?'절벽에서 이름을 숨긴 선원들':p.ismaros==='documented'?'이스마로스에서 가져온 공식 증표':p.lotus==='awakened'?'로토스에서 구조된 선원들':'';
 return [old,orig].filter(Boolean).join(' · ');
};
const _v52Epilogue=openV47Epilogue;
openV47Epilogue=function(){_v52Epilogue();const a=v52EnsureAct1(),modal=$('modal');if(!modal||!a.entries.length)return;
 const el=document.createElement('div');el.className='wc51Epilogue';el.textContent='제1장부터 이어진 선택\n'+a.entries.map(x=>`· CH.${x.chapter} ${V52_ACT1_PIVOTS[x.chapter]?.title}: ${V52_ACT1_PIVOTS[x.chapter]?.effects[x.choice]||'확정되지 않은 기록'}`).join('\n');
 const body=modal.querySelector('.storyText');if(body)body.insertAdjacentElement('afterend',el);
};
if(location.search.includes('wc52test'))window.__wc52test={
  get:()=>JSON.parse(JSON.stringify(v52EnsureAct1())),support:()=>v50Support(),news:()=>v51NewsText(),
  events:()=>state.worldHistory.filter(x=>x.type==='act1HistoricalPivot'), stage:()=>ensureV47()?.stage, ctx:()=>state.storyCtx,
  echo:no=>v50NarrativeEcho(v47ByNo(no)), sceneFirst:()=>{state.policy='sail';state.subChoice='main';state.storyCtx={notes:[]};showMainStoryNode('chapter_intro');},
  simulate:(ch,path='a',result='boss_win',name='silent')=>{
   ensureV25MainState();if(state.mainStory.act1ChapterResults.some(r=>r.chapter===ch))return false;
   state.mainStory.node=ACT1_CHAPTERS_V25[ch-1].node;
   state.storyCtx={v25Approach:path,v25Name:name,notes:[]};
   completeAct1ChapterV25(ch,result,{});return true;
  },
  scene:ch=>{state.mainStory.node=ACT1_CHAPTERS_V25[ch-1].node;state.storyCtx={notes:[]};showMainStoryNode('chapter_intro');},
  post:policy=>actionCandidatesForPolicy(policy).filter(c=>c.key.startsWith('wc51_act1_')).map(c=>c.key),
  old:ch=>{ensureV25MainState();state.mainStory.act1ChapterResults.push({chapter:ch,result:'이전 기록',year:state.year,month:state.month});},
  next:no=>v50Variant(v47ByNo(no)),finish:()=>v50HistoricalEnding()
};
