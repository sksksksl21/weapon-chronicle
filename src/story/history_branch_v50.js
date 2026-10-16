/* Weapon Chronicle v5.0 — consequential Odyssey history.
 * Historical outcomes are stored independently from future Princess Maker sword endings.
 * The already-completed v4.7 campaign is not retroactively assigned invented choices.
 */
const V50_PIVOTS={
 10:{key:'winds',a:'sealed',b:'opened',title:'바람 주머니의 운명',choices:[
  '주머니를 봉인하고 선원들을 설득해 끝까지 지킨다',
  '선원들의 요구를 받아들여 주머니를 연다'],
  effects:{sealed:'주머니를 지켜 이타카의 불빛까지 접근했다. 바람의 죄로 다시 쫓겨나지는 않았지만 귀향을 두려워한 신들의 방해가 남았다.',opened:'선원들이 주머니를 열자 항로가 무너졌다. 아이올로스의 도움은 끊겼고 일행의 신뢰에도 금이 갔다.'}},
 13:{key:'fleet',a:'evacuated',b:'devastated',title:'라이스트뤼고네스 선단의 운명',choices:[
  '본선과 선원들을 먼저 빼내 함대를 보존한다',
  '포위된 동료를 구하러 돌아가 선단을 위험에 놓는다'],
  effects:{evacuated:'선원 다수를 구조하고 선박 일부를 지켰다. 섬에는 아직 구출하지 못한 사람들이 남았다.',devastated:'수많은 선박이 바위에 부서졌다. 소수의 생존자만 다른 항로를 향했다.'}},
 16:{key:'circe',a:'allied',b:'hostile',title:'키르케와의 관계',choices:[
  '키르케의 조건을 듣고 동료의 자유를 보장받는다',
  '마법에 복종하지 않고 힘으로 동료를 구하려 한다'],
  effects:{allied:'키르케와 맺은 약속 덕에 선원들이 인간의 모습으로 돌아왔고 저승으로 가는 지도가 남았다.',hostile:'동료 일부를 되찾았지만 키르케의 분노로 항로 정보가 흐트러지고 새로운 희생이 생겼다.'}},
 18:{key:'prophecy',a:'heeded',b:'defied',title:'테이레시아스의 경고',choices:[
  '태양신의 소를 건드리지 않겠다는 맹세를 받아낸다',
  '예언보다 눈앞의 생존을 우선한다고 선언한다'],
  effects:{heeded:'금기를 지키겠다는 맹세가 선원들의 입에 남았다.',defied:'예언을 거부하자 선원들은 굶주림 앞에서 다른 답을 찾기 시작했다.'}},
 23:{key:'cattle',a:'spared',b:'slaughtered',title:'태양신의 소',choices:[
  '끝까지 소를 보호하고 부족한 식량을 견딘다',
  '금기를 깨고 소를 잡아 선원들에게 먹인다'],
  effects:{spared:'태양신의 소는 살아남았다. 배는 굶주림의 대가를 치렀지만 신성모독의 죄는 남지 않았다.',slaughtered:'소가 희생됐다. 선원들은 살아날 기력을 얻었으나 헬리오스의 노여움이 바다를 덮었다.'}},
 30:{key:'testimony',a:'truth',b:'silence',title:'파이아케스 왕궁의 증언',choices:[
  '희생된 사람의 이름까지 모두 공개해 증언한다',
  '불리한 사실을 감추고 영웅의 귀향만을 요구한다'],
  effects:{truth:'희생의 명부가 파이아케스 궁정에 남았다. 귀향을 돕겠다는 약속은 공개된 증언에 근거했다.',silence:'왕궁은 귀향을 허락했지만 빠진 이야기 때문에 이타카에는 서로 다른 소문이 전해졌다.'}},
 38:{key:'palace',a:'parley',b:'assault',title:'이타카 궁전 수복 방식',choices:[
  '증언과 동맹을 모아 구혼자에게 공개 협상을 요구한다',
  '궁전 문을 봉쇄하고 무력으로 왕권을 되찾는다'],
  effects:{parley:'궁정은 복수를 멈추고 왕권의 정당성을 논의하는 자리가 됐다.',assault:'궁전의 문이 잠겼고 시민들은 피로 얼룩진 수복을 목격했다.',contested:'공개 협상은 결렬됐다. 궁전의 주도권을 잃고 바깥 가문들이 각자의 군사를 모았다.'}},
 39:{key:'suitors',a:'mercy',b:'vengeance',title:'구혼자들의 운명',choices:[
  '항복한 구혼자의 목숨을 살려 공개 재판에 세운다',
  '구혼자들에게 복수하고 왕궁의 저항을 끝낸다'],
  effects:{mercy:'살아남은 구혼자들은 재판을 기다리고, 이타카의 가문들은 결말을 지켜보게 됐다.',vengeance:'피로 왕궁을 되찾았다. 죽은 자의 가족들이 복수를 요구하기 시작했다.',unsettled:'구혼자들이 무기를 거두지 않은 채 궁전이 대치 상태에 남았다. 누구도 완전한 승리를 선언하지 못했다.'}}
};
const V50_VARIANTS={
 11:{winds:{sealed:{title:'이타카 앞바다의 마지막 저항',place:'이타카 앞바다',intro:'바람 주머니는 끝까지 봉인되어 있었다. 육지의 불빛이 보였지만 포세이돈이 보낸 돌풍에 배가 먼 쪽으로 떠밀렸다. 다시 아이올로스를 찾는 대신 신들의 간섭을 기록해야 했다.',reveal:'돌아오지 못한 이유는 선원의 탐욕이 아니라 바다의 신이 남긴 적대였다.',outro:'주머니를 지킨 항해는 실패로 끝나지 않았다. 이타카를 눈앞에 두고도 돌아가지 못했다는 기록이 뒤의 협상에 근거가 됐다.'}}},
 12:{winds:{sealed:{intro:'귀향을 눈앞에 두었던 선원들은 다시 먼 바다로 떠밀렸다. 지도 밖 정박지는 최후의 피항지가 됐다.',outro:'신의 방해가 길을 바꾼 탓에 선단은 위험한 항구에 진입했다.'}}},
 14:{fleet:{evacuated:{intro:'일부 선박이 살아남자 정찰대를 보낼 여유가 생겼다. 선원들은 각자 구출하지 못한 사람의 이름을 기억했다.',outro:'보존한 선박의 항해사가 키르케의 섬을 먼저 발견했다.'},devastated:{intro:'함대가 파괴된 뒤 살아남은 사람들은 떠다니는 목재에 몸을 의지해 섬에 도착했다.',outro:'선단의 몰락은 동료들의 신뢰와 식량을 모두 앗아갔다.'}}},
 17:{circe:{allied:{intro:'키르케는 약속을 지켰고, 바람이 닿지 않는 저승의 항로를 기록해 주었다.'},hostile:{intro:'키르케와 결별한 뒤 남은 사람들은 그녀가 흘린 단서만을 따라 저승의 길을 찾아야 했다.',outro:'되찾지 못한 동료의 목소리가 저승길까지 따라왔다.'}}},
 19:{prophecy:{heeded:{intro:'테이레시아스의 경고를 기록한 선원들은 저승의 영웅들에게 지켜야 할 맹세를 물었다.'},defied:{intro:'예언에 반대한 사람들은 귀향에 성공했지만 목숨을 잃은 왕들의 이야기에서 자신의 미래를 보았다.'}}},
 24:{cattle:{spared:{title:'금기를 지킨 배의 폭풍',intro:'태양신의 소는 살아남았다. 그러나 굶주림으로 약해진 선박은 포세이돈의 거친 바람을 피할 수 없었다.',reveal:'폭풍은 신성모독의 처벌이 아니었다. 선원들이 끝까지 서로 돕는지가 살아남을 사람을 결정했다.',outro:'신성모독의 죄 없이 폭풍을 통과한 생존자가 이타카로 돌아갈 수 있는 새로운 길을 남겼다.'},slaughtered:{intro:'헬리오스의 소가 쓰러진 뒤 하늘에서 빛이 사라졌다. 살아남은 사람들은 자신들이 선택한 대가를 알았다.',outro:'신성모독은 배의 마지막 날까지 쫓아왔다.'}}},
 25:{cattle:{spared:{title:'칼립소의 손님',intro:'신성모독의 죄를 짓지 않은 생존자들은 섬에서 쉬며 배를 수리했다. 칼립소는 영원을 약속했지만 떠날 자유까지 빼앗지는 못했다.',reveal:'칼립소가 제안한 삶은 영원한 포로 생활이 아닌 선택 가능한 피난처였다.',outro:'섬을 떠나는 결정은 신의 형벌이 아니라 인간이 택한 귀향의 의지였다.'},slaughtered:{intro:'태양신의 노여움이 지나간 뒤 단 한 줌의 생존자만 칼립소의 해변에 밀려왔다.',outro:'길고 고독한 체류가 시작됐다.'}}},
 31:{testimony:{truth:{intro:'파이아케스의 공식 증언과 희생자 명부가 이타카로 먼저 전해졌다. 귀향은 숨겨진 소문이 아닌 증인들의 문제가 됐다.'},silence:{intro:'배에서 내리자마자 파이아케스 궁정에서 빠진 이야기를 의심하는 소문이 들렸다. 누가 먼저 도착했는지보다 어떤 말을 믿을지가 중요해졌다.'}}},
 33:{testimony:{truth:{intro:'텔레마코스는 이미 공식 증언을 들었고, 낯선 방문객에게 동료들의 이름을 확인했다.'},silence:{intro:'텔레마코스는 아버지의 귀향을 믿기 어려워했다. 항해에 관한 서로 다른 이야기가 그의 의심을 키웠다.'}}},
 34:{testimony:{truth:{reveal:'파이아케스의 문서와 오두막의 증언이 맞아떨어졌다. 왕권 수복을 위한 공개 증언을 모을 수 있었다.'},silence:{reveal:'서로 맞지 않는 증언은 궁전 안의 협상을 위험하게 했다. 누가 진짜 주인인지를 먼저 입증해야 했다.'}}},
 37:{fleet:{evacuated:{reveal:'함대에서 살아남은 옛 선원들이 돌아와 검과 활의 소유권을 증언했다.'},devastated:{reveal:'남은 증인은 극히 적었다. 궁전의 무리들은 귀환자의 정체를 의심했다.'}}},
 40:{palace:{parley:{title:'침상과 시민의 맹세',intro:'궁전의 피 대신 공개된 협상 기록이 남았다. 페넬로페가 묻는 침상의 비밀은 이제 집과 나라의 미래를 함께 가늠하는 시험이었다.'},assault:{title:'피로 되찾은 집',intro:'궁전의 피를 씻은 뒤에도 사람들의 원한은 지워지지 않았다. 페넬로페의 질문은 사적인 재회이자 이타카의 왕권을 가르는 마지막 증거였다.'}}}
};
const V50_ENDINGS={
 restored:{title:'이타카의 귀환과 화해',subtitle:'왕권 회복 · 남은 자들의 평화',body:'오디세우스의 귀향이 확인되고 왕권이 회복됐다. 다만 과거의 전쟁을 지워버리지는 않았다. 살아남은 증인과 구혼자의 가족은 공동의 맹세로 복수를 멈췄다.'},
 council:{title:'이타카의 새 맹약',subtitle:'왕권 공유 · 시민과 가문의 합의',body:'구혼자를 죽이는 대신 재판에 세운 결과, 이타카는 예전과 같은 왕국으로 돌아가지 않았다. 오디세우스와 텔레마코스는 각 가문의 대표 앞에서 새로운 통치의 맹약을 받아들였다.'},
 fracture:{title:'끝나지 않은 이타카의 피',subtitle:'복위 후 내분 · 대립하는 가문',body:'궁전은 탈환됐지만 복수는 끝나지 않았다. 구혼자 가문의 원한과 서로 다른 증언이 이타카를 갈랐다. 누가 왕인가보다 누가 살아남았는지가 후세의 기록이 됐다.'},
 exile:{title:'왕이 돌아오지 못한 섬',subtitle:'왕권 공백 · 섬의 임시 통치',body:'귀환의 증거가 부족하고 궁전의 지지가 무너지자 오디세우스의 이름은 왕위에 돌아오지 못했다. 텔레마코스와 살아남은 동료들은 작은 항구에서 새로운 시대를 시작했다.'},
 legacy:{title:'이타카의 평화 · 이전 기록',subtitle:'v4.7 이전 완료 데이터',body:'이 기록은 역사 개변 시스템이 도입되기 전에 이미 완성된 오디세이다. 존재하지 않았던 과거 선택을 새로 판정하지 않고, 당시의 평화로운 귀향 결말 그대로 보존한다.'}
};
function v50EnsureHistory(){
 v48EnsureState();
 let h=state.branchFlags.odysseyV50;
 if(!h||typeof h!=='object'||Array.isArray(h))h=state.branchFlags.odysseyV50={version:50,pivots:{},ending:null};
 if(!h.pivots||typeof h.pivots!=='object')h.pivots={};
 if(state.saveMeta)state.saveMeta.historySchemaVersion=50;
 return h;
}
function v50Variant(c){
 if(!c)return c;
 const h=v50EnsureHistory(), variants=V50_VARIANTS[c.no];
 if(!variants)return c;
 const patch={};
 Object.entries(variants).forEach(([key,byValue])=>Object.assign(patch,byValue[h.pivots[key]]||{}));
 return Object.keys(patch).length?{...c,...patch}:c;
}
function v50Support(){
 const p=v50EnsureHistory().pivots;
 return (p.winds==='sealed'?1:0)+(p.fleet==='evacuated'?1:0)+(p.circe==='allied'?1:0)+(p.prophecy==='heeded'?1:0)+(p.cattle==='spared'?1:0)+(p.testimony==='truth'?1:0);
}
function v50NarrativeEcho(c){
 const p=v50EnsureHistory().pivots,t=[];
 if(c.no>=17&&c.no<=24&&p.circe==='hostile')t.push('키르케와의 불화로 잃은 동료의 부재가 식량과 파수 인원에 영향을 미쳤다.');
 if(c.no>=20&&c.no<=30&&p.fleet==='evacuated')t.push('구조한 선원들이 더 많은 눈과 노를 제공해 위험한 구간의 손실을 줄였다.');
 if(c.no>=23&&c.no<=27&&p.prophecy==='defied')t.push('테이레시아스의 예언을 거부한 결정은 선원들의 다툼 속에 되살아났다.');
 if(c.no>=31&&c.no<=39&&p.testimony==='truth')t.push('파이아케스 궁정에 남긴 증언 덕에 이타카에서도 옛 선원의 진술을 확보할 수 있었다.');
 if(c.no>=38&&p.cattle==='slaughtered')t.push('태양신의 소를 죽인 기록은 귀환자들의 명예를 끝까지 따라왔다.');
 if(c.no>=39&&p.palace==='parley')t.push('무력 진압보다 공개 협상을 선택했다는 사실이 궁전 안 사람들의 판단을 바꿨다.');
 return t.length?'\n\n[남아 있는 역사] '+t.join(' '):'';
}
function v50HistoricalEnding(){
 const h=v50EnsureHistory(),p=h.pivots;
 if(h.ending)return h.ending;
 const v=ensureV47();
 if(!v?.complete)return null;
 // No fabricated retroactive branches in a previously completed campaign.
 if(Object.keys(p).length===0)return V50_ENDINGS.legacy&&{key:'legacy',...V50_ENDINGS.legacy};
 const support=v50Support();
 let key;
 if(p.palace==='contested'||p.suitors==='unsettled')key='exile';
 else if(p.palace==='parley'&&p.suitors==='mercy'&&support>=3)key='council';
 else if(support<=1 || (p.palace==='assault'&&p.suitors==='vengeance'&&support<=3))key='fracture';
 else if(p.palace==='parley'&&p.suitors==='vengeance')key='exile';
 else if(p.palace==='assault'&&p.suitors==='mercy'&&support<=2)key='exile';
 else key='restored';
 return {key,...V50_ENDINGS[key]};
}
function v50CommitPivot(c,result,path){
 const pivot=V50_PIVOTS[c.no];if(!pivot)return;
 const h=v50EnsureHistory();if(h.pivots[pivot.key])return;
 // A completed decision is recorded only at the chapter commit, never on a draft click.
 const option=path==='b'?'b':'a';
 const value=pivot[option];
 const effective=result==='defeat'&&c.no===13?'devastated':result==='defeat'&&c.no===38?'contested':result==='defeat'&&c.no===39?'unsettled':value;
 h.pivots[pivot.key]=effective;
 // Small, visible and bounded resources reflect historical losses without changing the core combat rules.
 const exp=state.mainStory.expedition;
 const delta={crew:0,ship:0,supplies:0};
 if(exp){
  if(pivot.key==='winds')delta.supplies=effective==='sealed'?1:-1;
  if(pivot.key==='fleet'){delta.crew=effective==='evacuated'?-2:-9;delta.ship=effective==='evacuated'?-10:-40;}
  if(pivot.key==='circe')delta.supplies=effective==='allied'?1:-1;
  if(pivot.key==='cattle'){delta.supplies=effective==='spared'?-1:2;delta.ship=effective==='spared'?0:-15;}
  exp.crew=Math.max(1,(Number(exp.crew)||1)+delta.crew);
  exp.ship=Math.max(5,Math.min(100,(Number(exp.ship)||100)+delta.ship));
  exp.supplies=Math.max(0,Math.min(9,(Number(exp.supplies)||0)+delta.supplies));
 }
 h.consequences=h.consequences||{};h.consequences[pivot.key]=delta;
 const id=`history:odyssey:${pivot.key}`;
 if(!state.worldHistory.some(x=>x?.id===id))state.worldHistory.push({id,type:'historicalPivot',act:c.act,chapter:c.local,choice:effective,result,year:state.year,month:state.month,note:pivot.effects[effective]});
 state.mainStory.flags[`history_${pivot.key}_${effective}`]=true;
}
const _v50OriginalCompleteChapter=v47CompleteChapter;
v47CompleteChapter=function(c,result,path){
 const v=ensureV47();
 if(!v||v.stage!==c.no||v.results.some(r=>r.no===c.no))return;
 const rendered=v50Variant(c);
 v50CommitPivot(rendered,result,path);
 const out=_v50OriginalCompleteChapter(rendered,result,path);
 if(c.no===40&&ensureV47()?.complete){
  const h=v50EnsureHistory();
  if(!h.ending){h.ending=v50HistoricalEnding();state.mainStory.flags.odyssey_final_peace=h.ending?.key==='restored'||h.ending?.key==='legacy';
   state.mainStory.flags[`odyssey_history_${h.ending.key}`]=true;
   if(!state.worldHistory.some(x=>x?.id==='history:odyssey:ending'))state.worldHistory.push({id:'history:odyssey:ending',type:'historicalEnding',ending:h.ending.key,year:state.year,month:state.month});
   saveGame();
  }
 }
 return out;
};
function v50FinishChapter(c,result){
 const v=ensureV47(),last=c.no===40;
 if(v?.stage===c.no)v47CompleteChapter(c,result,state.storyCtx?.odysseyPath||'a');
 const next=v47ByNo(c.no+1),ending=v50HistoricalEnding();
 const text=last?`${ending?.body||c.outro}\n\n${ending?.subtitle||''}\n\n이것은 세계의 역사적 결말이다. 검은 이 역사를 기억하며 다음 세대의 삶을 이어갈 수 있다.`:
 `${c.outro}${v50NarrativeEcho(c)}\n\n${next?`다음은 제${next.act}장 CH.${next.local} 「${v50Variant(next).title}」. 새 필수 조사 후 진행된다.`:''}`;
 v47Scene(c,last?ending?.title||'이타카의 마지막 장':result==='defeat'?'손실을 남긴 귀결':'역사를 바꾼 결과',text,[{label:last?'이 역사를 연대기에 남기고 계속한다':'이번 장면을 기록한다',next:'END',outcome:last?`메인 역사 완결 · ${ending?.title}`:`제${c.act}장 CH.${c.local} 완료 · ${c.title}`}]);
}
// Use the existing story engine, cards, combat callbacks and chapter tracker.
// Only historical turning points receive new decisions; other chapters retain their core pacing.
v47MainStory=function(node){
 const original=v47Current(),ctx=state.storyCtx;if(!original||!ctx)return;
 const c=v50Variant(original),pivot=V50_PIVOTS[c.no];ctx.skipIntegratedResolution=true;
 if(node==='chapter_intro'||node==='start'){
  const labels=pivot?pivot.choices:[c.a,c.b];
  return v47Scene(c,c.title,`${c.place} · 제${c.act}장 「${ACT_NAMES_V47[c.act]}」\n\n${c.intro}${v50NarrativeEcho(c)}`,labels.map((label,i)=>({label,effect:x=>{x.odysseyPath=i?'b':'a';x.lastApproach=i?'social':'survival';},next:'odyssey_approach'})));
 }
 if(node==='odyssey_approach'){
  const selected=ctx.odysseyPath==='b'?'b':'a';
  const chosen=pivot?pivot.effects[pivot[selected]]:(selected==='b'?c.afterB:c.afterA);
  return v47Scene(c,'선택 이후 달라진 상황',`${chosen}\n\n${c.reveal}${v50NarrativeEcho(c)}`,[
    {label:'결과를 감수하고 계획을 끝까지 이행한다',effect:x=>{x.odysseyTone='direct';},next:'odyssey_reveal'},
    {label:'동료의 손실을 줄일 준비를 한다',effect:x=>{x.odysseyTone='careful';},next:'odyssey_reveal'},
    ...v47UnlockedOptions(c)]);
 }
 if(node==='odyssey_reveal'){
  const selected=ctx.odysseyPath==='b'?'b':'a',choice=pivot?pivot[selected]:null;
  const bonus=ctx.odysseyBonus?`\n\n${ctx.odysseyBonus==='survival'?'앞서 파악한 위험이 손실을 줄였다.':ctx.odysseyBonus==='social'?'동료들의 증언이 유리한 길을 열었다.':'검의 오래된 기억이 설득의 증거가 됐다.'}`:'';
  // The council/parley route changes *the actual encounter*: this is not a reskinned combat victory.
  if(c.no===38&&choice==='parley'&&v50Support()>=3)return v47Scene(c,'궁전의 공개 협상',`우호적인 증인과 선원들의 서약이 모였다. 구혼자 측은 유혈 충돌 대신 공개 협상에 응했다.${bonus}`,[{label:'협상 내용을 시민과 가문에 공표한다',next:'odyssey_resolve'}]);
  if(c.no===39&&choice==='mercy'&&v50Support()>=3&&v50EnsureHistory().pivots.palace==='parley')return v47Scene(c,'무기를 내려놓은 마지막 밤',`공개 협상에서 항복 조건을 받아들였다. 구혼자들은 무장을 해제했고 다음날 시민 앞에서 재판받기로 했다.${bonus}`,[{label:'구혼자의 생존과 재판을 확정한다',next:'odyssey_resolve'}]);
  if(c.mode==='battle')return v47Scene(c,'마지막 충돌',`${c.reveal}${bonus}\n\n${pivot?pivot.effects[choice]:''}\n${c.place}에서 결단해야 한다. 전투에서 패배해도 시간은 되감기지 않는다.`,[
    {label:'싸워서 선택한 결과를 지킨다',combat:{enemy:c.foe,label:`제${c.act}장 CH.${c.local} · ${c.title}`,win:'odyssey_battle_win',lose:'odyssey_battle_lose',mods:{hpScale:1,attackDelta:0}}},
    {label:'철수하고 패배의 대가를 기록한다',effect:x=>{x.odysseyForcedRetreat=true;},next:'odyssey_battle_lose'}]);
  return v47Scene(c,'역사의 갈림길',`${pivot?pivot.effects[choice]+'\n\n':''}${c.reveal}${bonus}${v50NarrativeEcho(c)}\n\n${c.outro}`,[{label:c.no===40?'마지막 역사를 기록한다':'이 선택을 확정한다',next:'odyssey_resolve'}]);
 }
 if(node==='odyssey_resolve')return v50FinishChapter(c,'resolved');
 if(node==='odyssey_battle_win')return v50FinishChapter(c,'won');
 if(node==='odyssey_battle_lose')return v50FinishChapter(c,'defeat');
};
openV47Epilogue=function(){
 const v=ensureV47();if(!v?.complete)return;
 const ending=v50HistoricalEnding();if(!ending)return;
 const h=v50EnsureHistory(),report=Object.entries(h.pivots).map(([key,value])=>{const d=Object.values(V50_PIVOTS).find(x=>x.key===key);return `· ${d?.title||key}: ${d?.effects[value]||value}`;}).join('\n');
 openModal(modalHead('Weapon Chronicle · 역사적 결말',ending.subtitle)+`<div class="storyScene"><div class="storyKicker">THE ODYSSEY · HISTORY</div><div class="storyTitle">${ending.title}</div><div class="storyText">${ending.body}\n\n${report||'이 세계는 이전 버전에서 이미 완결됐다. 새 선택은 소급하지 않는다.'}\n\n세계의 역사는 이 기록으로 확정됐다. 이후에도 검의 소유자와 월간 사건은 계속된다.</div><div class="storyChoices"><button class="choice" id="v50EndClose">다음 삶을 계속한다</button></div></div>`);
 bindClose();$('v50EndClose').onclick=closeModal;
};
const _v50Render=render;
render=function(){
 const out=_v50Render(),v=ensureV47();if(v?.complete){const ending=v50HistoricalEnding();
  const b=$('mainBanner');if(b&&ending){b.className='mainEventBanner show';b.innerHTML=`<div class="mainText"><small>MAIN HISTORY · COMPLETE</small><b>${ending.title}</b><span>${ending.subtitle} · 이후 삶 계속 진행 가능</span></div><button id="v50EpilogueButton">결말 보기</button>`;$('v50EpilogueButton').onclick=openV47Epilogue;}
  if($('sliceStatus'))$('sliceStatus').textContent=ending?.title||'메인 완결';
 }
 return out;
};
const _v50Load=loadGame;
loadGame=function(){const result=_v50Load();if(result)v50EnsureHistory();return result;};
if(location.search.includes('wc50test'))window.__wc50test={
 get:()=>({stage:ensureV47()?.stage,history:JSON.parse(JSON.stringify(v50EnsureHistory())), world:state.worldHistory.filter(x=>x?.type==='historicalPivot'||x?.type==='historicalEnding'),main:state.mainStory?.mainV47?.results?.length}),
 setStage:n=>{ensureV25MainState();state.mainStory.node='1-09';state.mainStory.act1Complete=true;const v=ensureV47();v.stage=n;v.complete=n===41;v.investigations[n]={done:true};state.monthCandidateCache={};state.monthEvents=[];},
 simulate:(no,path='a',result='resolved')=>{ensureV25MainState();state.mainStory.node='1-09';state.mainStory.act1Complete=true;const v=ensureV47();v.stage=no;v.complete=false;v.investigations[no]={done:true};v.results=v.results.filter(r=>r.no!==no);v47CompleteChapter(v47ByNo(no),result,path);},
 ending:()=>v50HistoricalEnding(),
 resetHistory:()=>{v50EnsureHistory().pivots={};v50EnsureHistory().ending=null;},
 startChapter:(no)=>{ensureV25MainState();state.mainStory.node='1-09';state.mainStory.act1Complete=true;const v=ensureV47();v.stage=no;v.complete=false;v.investigations[no]={done:true};state.policy='sail';state.subChoice='main';state.storyCtx={notes:[]};v47MainStory('chapter_intro');},
 clickChoice:i=>{const b=document.querySelectorAll('#storyChoices button')[i];if(b){b.click();return true;}return false;},
 save:()=>saveGame()
};
