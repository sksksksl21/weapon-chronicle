/* Weapon Chronicle v5.1 — Consequences of history in the living world.
 * Uses already-committed v5.0 pivots. Never invents decisions in legacy saves.
 * Optional aftermath tasks run through the existing monthly action/checkpoint pipeline.
 */
const V51_AFTERMATH={
 winds:{policy:'explore',unlock:11,place:'아이올로스의 항로',title:'바람이 남긴 표류선',intro:{sealed:'이타카 앞바다까지 갔다가 신의 돌풍에 휩쓸린 작은 배가 암초에 걸렸다. 주머니를 지킨 선원들은 자신들의 항로가 증거로 남기를 원한다.',opened:'주머니가 열리던 밤, 떨어져 나간 소형선이 먼 여울에 떠밀렸다. 선원들은 누가 줄을 풀었는지를 두고 서로 다투고 있다.'},choiceA:'선원들의 진술과 항해 기록을 모은다',choiceB:'표류선의 물자와 생존자를 우선 구조한다',afterA:'표류의 경위가 기록되어 다음 항구에서도 항해사들의 증언을 들을 수 있게 됐다.',afterB:'물자를 나르고 다친 선원들을 옮겼다. 사실을 밝히는 일은 늦어졌지만 목숨을 건진 사람이 남았다.',region:'aegean',group:'항로',effects:[{gold:0,mind:1},{gold:3,mind:0}]},
 fleet:{policy:'contract',unlock:14,place:'라이스트뤼고네스 피난항',title:'배에서 내리지 못한 사람들',intro:{evacuated:'살려낸 배의 명부에 이름이 없는 선원들이 해안을 떠돌고 있다. 구조한 이와 버린 이의 가족이 서로를 원망한다.',devastated:'돌아온 사람은 손가락으로 셀 수 있었다. 부러진 돛대 아래에서 생존자의 가족들이 실종 명단을 요구한다.'},choiceA:'실종자들의 이름을 확인해 가족에게 전한다',choiceB:'남은 사람들을 모아 안전한 피난처를 만든다',afterA:'선단의 피해가 이름으로 기록됐다. 잊힌 사람의 가족들이 증언을 확보했다.',afterB:'선원들의 손으로 임시 피난처가 만들어졌다. 다음 항해에 쓸 인력과 식량이 남았다.',region:'laestrygonia',group:'생존자',effects:[{gold:0,mind:1},{gold:5,mind:0}]},
 circe:{policy:'investigate',unlock:17,place:'아이아이에 섬',title:'되돌아온 동료의 증언',intro:{allied:'키르케와 약속을 맺었지만 인간의 모습으로 돌아온 선원은 자신이 짐승이던 동안 본 것을 기억한다.',hostile:'키르케와 적대한 뒤 돌아오지 못한 동료가 남았다. 흩어진 기억 속에 저승으로 향하는 길의 이름이 있다.'},choiceA:'마법의 흔적과 항로를 끝까지 조사한다',choiceB:'동료의 불안을 달래고 고향으로 보낼 방법을 찾는다',afterA:'마법의 흔적을 분류하고 다음 항로에 필요한 단서를 얻었다.',afterB:'오래 침묵했던 선원이 다시 말을 했다. 잃어버린 동료들의 이름도 함께 들을 수 있었다.',region:'aeaea',group:'동료',effects:[{gold:0,mind:1},{gold:0,mind:3}]},
 prophecy:{policy:'explore',unlock:19,place:'망자의 강 어귀',title:'지워진 예언의 구절',intro:{heeded:'경고를 지킨 사람들은 저승에서 들은 이름을 다시 찾으려 한다. 예언을 믿는다는 것은 기록의 책임까지 받아들이는 일이다.',defied:'예언을 거부한 선원들 사이에 서로 다른 이야기가 돌기 시작했다. 누군가는 죽은 사람이 아무 말도 하지 않았다고 주장한다.'},choiceA:'예언의 문장을 증인의 이름과 함께 남긴다',choiceB:'선원들이 견딜 수 있도록 위험한 구절을 가린다',afterA:'서로 다른 기록을 대조해 거짓된 소문을 막았다.',afterB:'공포는 잠시 누그러졌지만 기록에 남지 않은 경고가 마음에 걸렸다.',region:'underworld',group:'예언',effects:[{gold:0,mind:0},{gold:0,mind:2}]},
 cattle:{policy:'investigate',unlock:24,place:'트리나키아의 해변',title:'태양신 제단의 판결',intro:{spared:'금기를 지킨 배는 굶주림 때문에 큰 피해를 입었다. 제단 앞에서 누가 책임을 지고 누구를 살렸는지 묻는 사람들이 모였다.',slaughtered:'제단 앞에는 끊어진 고삐와 검게 그을린 돌이 남았다. 신성모독에 가담한 이와 반대한 이의 말이 맞서고 있다.'},choiceA:'제단과 선원들의 목격담을 기록한다',choiceB:'항구가 다시 굶주리지 않도록 식량을 모은다',afterA:'금기와 희생의 기록이 남아 신탁을 핑계로 한 거짓 증언을 막았다.',afterB:'식량을 나눈 항구는 굶주림을 견뎠다. 사건의 책임을 가리는 일은 여전히 남았다.',region:'thrinacia',group:'금기',effects:[{gold:0,mind:1},{gold:4,mind:0}]},
 testimony:{policy:'investigate',unlock:31,place:'파이아케스 항구',title:'증언이 빠진 항해일지',intro:{truth:'공식 명부가 도착했지만 몇 명의 가족이 이름을 찾지 못했다. 기록을 열람한 서기관들이 누락된 마지막 밤을 지목한다.',silence:'궁정에서 빠진 이야기가 이타카에 다른 소문으로 번졌다. 이름을 숨겼던 선원이 뒤늦게 찾아와 증언을 요구한다.'},choiceA:'상충하는 증언을 공개 검토한다',choiceB:'살아 있는 사람부터 만나 화해를 권한다',afterA:'명부를 다시 묶자 사건을 증명할 기록이 생겼다.',afterB:'입을 닫았던 증인들이 한자리에 모였다. 화해는 시작됐지만 진실을 지우지는 못했다.',region:'phaeacia',group:'증언',effects:[{gold:0,mind:1},{gold:0,mind:2}]},
 palace:{policy:'contract',unlock:39,place:'이타카 왕궁',title:'궁전 문턱의 감시',intro:{parley:'왕궁 앞에서 협상 소식을 들은 시민들이 기다린다. 대표자에게 말할 기회가 남았지만 누구도 그 말을 신뢰하지 못한다.',assault:'왕궁의 문이 무너진 뒤 도망친 하인들이 골목에 숨었다. 누가 저항에 가담했고 누가 강제로 남았는지 확인해야 한다.',contested:'협상은 결렬됐고 궁전 밖에는 서로 다른 깃발이 섰다. 다친 하인과 행인이 충돌 사이에 갇혔다.'},choiceA:'왕궁에 남은 민간인의 안전을 확보한다',choiceB:'가문 대표자들을 불러 공개 감시를 요청한다',afterA:'왕궁에서 빠져나온 하인들이 보호를 받았다.',afterB:'가문들이 대표자를 보냈다. 궁전의 다음 결정은 모두가 보는 앞에서 이루어지게 됐다.',region:'ithaca',group:'왕궁',effects:[{gold:2,mind:1},{gold:0,mind:2}]},
 suitors:{policy:'contract',unlock:40,place:'이타카의 재판장',title:'남겨진 가문의 청원',intro:{mercy:'살아남은 구혼자의 가족들이 청원장을 들고 나왔다. 재판에 세울 증인과 감시인이 필요하다.',vengeance:'구혼자의 가족들은 돌려받지 못한 시신과 명예를 요구한다. 폭력의 끝에서 또 다른 원한이 자라고 있다.',unsettled:'재판은 시작되지 못했고 무장한 가문들이 각자 자리를 지킨다. 시민들은 한밤에도 문을 잠그고 산다.'},choiceA:'서로의 피해를 기록해 청원장으로 만든다',choiceB:'가문 대표들을 중재해 보복을 막는다',afterA:'가문의 청원이 기록으로 남았다. 새 통치의 근거가 생겼다.',afterB:'서로를 의심하던 가문들이 당장 무기를 들지는 않기로 했다.',region:'ithaca',group:'가문',effects:[{gold:0,mind:1},{gold:0,mind:3}]},
 post_restored:{policy:'rest',unlock:41,place:'이타카의 올리브 언덕',title:'평화 뒤의 첫 봄',intro:{default:'왕궁은 되찾았지만 전쟁에서 돌아오지 못한 사람들의 자리가 비어 있다. 이타카는 평화를 선언한 뒤에야 상처를 세기 시작했다.'},choiceA:'전쟁에 남은 유가족의 이름을 기록한다',choiceB:'선원들과 작은 축제를 열어 서로를 위로한다',afterA:'귀환의 축제에 없던 사람들의 이름도 연대기에 남았다.',afterB:'남은 이들이 잔을 들었다. 다음 세대는 전쟁 말고도 기억할 날을 얻었다.',region:'ithaca',group:'평화',effects:[{gold:0,mind:2},{gold:0,mind:4}]},
 post_council:{policy:'investigate',unlock:41,place:'이타카의 시민 회의장',title:'첫 번째 공개 재판',intro:{default:'새 맹약에 서명한 가문들이 첫 재판에 모였다. 법을 만드는 일보다 서로 다른 사람에게 똑같이 적용하는 일이 더 어렵다.'},choiceA:'희생자 명부를 모든 가문의 기록과 대조한다',choiceB:'재판 방청에 온 주민들이 말할 차례를 보장한다',afterA:'재판은 검증 가능한 자료를 바탕으로 시작됐다.',afterB:'유력한 가문 밖의 사람들에게도 처음으로 진술할 자리가 생겼다.',region:'ithaca',group:'새 맹약',effects:[{gold:0,mind:2},{gold:0,mind:3}]},
 post_fracture:{policy:'contract',unlock:41,place:'이타카의 경계 초소',title:'피를 멈추는 하루',intro:{default:'궁전을 차지한 쪽과 쫓겨난 가문이 각자의 초소에서 칼을 간다. 누구도 평화가 왔다고 믿지 않는다.'},choiceA:'무기를 거둔 사람의 귀환길을 호위한다',choiceB:'소문을 잠재울 증인과 장로의 자리를 마련한다',afterA:'귀환자가 공격받지 않고 마을에 도착했다. 하루의 휴전이 지켜졌다.',afterB:'전투를 주장하던 사람들도 적어도 한밤 동안은 말을 들었다.',region:'ithaca',group:'내분',effects:[{gold:3,mind:0},{gold:0,mind:2}]},
 post_exile:{policy:'explore',unlock:41,place:'이타카의 작은 항구',title:'왕 없는 섬의 새 항로',intro:{default:'왕을 되찾지 못한 섬은 해상 무역도 스스로 다시 열어야 한다. 텔레마코스의 전령이 항구에 안전한 항로를 물어왔다.'},choiceA:'섬 밖 항로를 조사해 정박지를 확보한다',choiceB:'어부와 상인이 함께 쓸 새로운 부두를 만든다',afterA:'이타카에 기대지 않았던 항로가 기록됐다.',afterB:'작은 항구에 새 물류의 거점이 생겼다.',region:'ithaca',group:'새 항로',effects:[{gold:4,mind:0},{gold:2,mind:1}]}
};
function v51Ensure(){const h=v50EnsureHistory();if(!h.aftermath||typeof h.aftermath!=='object'||Array.isArray(h.aftermath))h.aftermath={};return h.aftermath;}
function v51CurrentStage(){return ensureV47()?.stage||0;}
function v51AftermathAvailable(key){const a=V51_AFTERMATH[key],h=v50EnsureHistory();if(!a||v51Ensure()[key])return false;
 if(key.startsWith('post_'))return ensureV47()?.complete&&h.ending?.key===key.slice(5);
 return !!h.pivots[key]&&v51CurrentStage()>=a.unlock;
}
function v51AftermathChoice(key){const a=V51_AFTERMATH[key];if(!a||!v51AftermathAvailable(key))return null;const pivot=v50EnsureHistory().pivots[key];const variant=pivot||'default';return {key:'wc51_'+key,route:'wc51_'+key,policy:a.policy,title:'후속 · '+a.title,desc:`${a.place} · ${a.intro[variant]||a.intro.default}`,difficulty:1,reward:1,rewardText:'세계 기록과 주민의 반응',phase:'followup',v51:true};}
const _v51Candidates=actionCandidatesForPolicy;
actionCandidatesForPolicy=function(policy,rebuild=false){const base=_v51Candidates(policy,rebuild);const opts=Object.keys(V51_AFTERMATH).map(v51AftermathChoice).filter(x=>x&&x.policy===policy).sort((a,b)=>Number(b.key.startsWith('wc51_post_'))-Number(a.key.startsWith('wc51_post_')));if(!opts.length)return base;
 // The main research keeps priority; one historical followup is visible without hiding all base work.
 const main=base.filter(x=>x.phase==='mainResearch');return [...main,...opts.slice(0,2),...base.filter(x=>x.phase!=='mainResearch')].filter((x,i,arr)=>arr.findIndex(y=>y.key===x.key)===i).slice(0,4);
};
const _v51ActionCandidate=actionCandidate;
actionCandidate=function(policy,key){if(String(key).startsWith('wc51_')){const c=v51AftermathChoice(String(key).slice(5));return c&&c.policy===policy?c:null;}return _v51ActionCandidate(policy,key);};
const _v51ActionDef=actionDefByKey;
actionDefByKey=function(key){if(String(key).startsWith('wc51_'))return v51AftermathChoice(String(key).slice(5));return _v51ActionDef(key);};
function v51CommitStory(){const ctx=state.storyCtx||{},key=String(ctx.candidateKey||'').replace(/^wc51_/,''),a=V51_AFTERMATH[key];if(!a||!ctx.v51Path||v51Ensure()[key])return;
 const choice=ctx.v51Path,eff=a.effects[choice==='a'?0:1],post=v51Ensure(),history=v50EnsureHistory();post[key]={path:choice,text:choice==='a'?a.afterA:a.afterB,year:state.year,month:state.month,owner:state.owner.name};
 history.regions=history.regions||{};history.regions[a.region]={name:a.place,settlement:choice==='a'?'진상·증언 기록':'구조·화해 우선',lastEvent:key,lastMonth:state.year+'-'+state.month};
 if(eff.gold){state.gold=Math.max(0,state.gold+eff.gold);ctx.notes.push('역사 후속 보상 GOLD +'+eff.gold);}
 if(eff.mind){state.mind=clamp(state.mind+eff.mind,0,100);ctx.notes.push('역사 후속 보상 정신 +'+eff.mind);}
 const id='aftermath:odyssey:'+key;if(!state.worldHistory.some(x=>x?.id===id))state.worldHistory.push({id,type:'odysseyAftermath',key,region:a.region,path:choice,year:state.year,month:state.month,text:post[key].text});
 addWorldFact(post[key].text,id);state.monthCandidateCache={};
}
function v51Story(node){const ctx=state.storyCtx,key=String(ctx?.candidateKey||'').replace(/^wc51_/,''),a=V51_AFTERMATH[key];if(!a)return false;ctx.skipIntegratedResolution=true;
 if(node==='start'){const pivot=v50EnsureHistory().pivots[key];openStoryScene('오디세이 · 역사 후속',a.title,`${a.place}.\n\n${a.intro[pivot]||a.intro.default}\n\n이 사건은 앞서 세계에 남긴 선택으로 열렸다.`,[{label:a.choiceA,effect:c=>{c.v51Path='a';c.lastApproach='social';},next:'v51_outcome'},{label:a.choiceB,effect:c=>{c.v51Path='b';c.lastApproach='survival';},next:'v51_outcome'}]);return true;}
 if(node==='v51_outcome'){const text=ctx.v51Path==='a'?a.afterA:a.afterB;openStoryScene('오디세이 · 남은 사람들',a.title,`${text}\n\n당장의 결말은 바뀌지 않아도 이 사건을 기억하는 사람들이 다음 시대를 살아간다.`,[{label:'이 선택을 세계의 기록에 남긴다',next:'END',outcome:a.title+' · 후속 해결'}]);return true;}
 return false;
}
const _v51ShowStory=showStoryNode;
showStoryNode=function(node){if(String(state.storyCtx?.candidateKey||'').startsWith('wc51_')&&v51Story(node))return;return _v51ShowStory(node);};
const _v51FinishStory=finishStory;
finishStory=function(outcome){if(String(state.storyCtx?.candidateKey||'').startsWith('wc51_'))v51CommitStory();return _v51FinishStory(outcome);};
function v51HistoricalStatus(){const h=v50EnsureHistory(),p=h.pivots,ev=h.ending?.key||null;if(!Object.keys(p).length)return null;
 return {route:p.winds==='sealed'?'이타카 접근 항로 보존':p.winds==='opened'?'항로 이탈·아이올로스 거절':'미정',fleet:p.fleet==='evacuated'?'일부 함대와 증인 생존':p.fleet==='devastated'?'선단 참패':'미정',circe:p.circe==='allied'?'키르케와 협력':p.circe==='hostile'?'키르케와 결별':'미정',faith:p.cattle==='spared'?'헬리오스 금기 유지':p.cattle==='slaughtered'?'헬리오스의 분노':'미정',politics:ev?({restored:'화해와 복위',council:'새 맹약과 시민 재판',fracture:'가문 내분',exile:'왕권 공백',legacy:'이전 세계 기록'}[ev]||'미정'):'결정 전'};
}
function v51NewsText(){const status=v51HistoricalStatus();if(!status)return '';
 const stage=v51CurrentStage();let entries=[];if(stage>=14&&v50EnsureHistory().pivots.fleet)entries.push('항구 소식: '+status.fleet);if(stage>=17&&v50EnsureHistory().pivots.circe)entries.push('섬의 소문: '+status.circe);if(stage>=24&&v50EnsureHistory().pivots.cattle)entries.push('신전의 기록: '+status.faith);if(stage>=41&&v50EnsureHistory().ending)entries.push('이타카의 정치: '+status.politics);if(!entries.length)entries=['항해 소식: '+status.route];return entries.slice(-2).join(' · ');
}
const _v51OpenContacts=openContacts;
openContacts=function(){const result=_v51OpenContacts();const news=v51NewsText(),modal=$('modal');if(news&&modal){const head=modal.querySelector('.modalHead');if(head){const div=document.createElement('div');div.className='wc51WorldNews';div.textContent=news;head.insertAdjacentElement('afterend',div);}}return result;};
const _v51StartVisit=startVisit;
startVisit=function(id){const result=_v51StartVisit(id),news=v51NewsText(),modal=$('modal');if(news&&modal){const target=modal.querySelector('#visitBubble, #wc44-npcReply');if(target){const btn=document.createElement('button');btn.type='button';btn.className='wc51AskWorld';btn.textContent='최근 항로와 이타카 소식을 묻는다';btn.addEventListener('click',()=>{target.textContent=news;});target.insertAdjacentElement('afterend',btn);}}return result;};
const _v51OpenEpilogue=openV47Epilogue;
openV47Epilogue=function(){_v51OpenEpilogue();const h=v50EnsureHistory(),modal=$('modal');if(!modal||!h.ending)return;
 const choices=Object.entries(v51Ensure()).filter(([k])=>V51_AFTERMATH[k]).map(([key,x])=>`· ${V51_AFTERMATH[key].title}: ${x.text}`);
 const extra=document.createElement('div');extra.className='wc51Epilogue';extra.textContent=choices.length?`그 이후, 검이 목격한 일\n${choices.join('\n')}`:'이후에도 인물과 지역의 후속 사건을 직접 해결할 수 있다.';
 const body=modal.querySelector('.storyText');if(body)body.insertAdjacentElement('afterend',extra);
};
const _v51Render=render;
render=function(){const out=_v51Render(),news=v51NewsText(),banner=$('mainBanner');if(news&&banner&&!banner.querySelector('.wc51HistoryLine')){const span=document.createElement('span');span.className='wc51HistoryLine';span.textContent=news;const container=banner.querySelector('.mainText');if(container)container.appendChild(span);}return out;};
if(location.search.includes('wc51test'))window.__wc51test={available:policy=>actionCandidatesForPolicy(policy).filter(x=>x.v51).map(x=>x.key),after:()=>structuredClone(v51Ensure()),news:()=>v51NewsText(),status:()=>v51HistoricalStatus(),start:key=>{const p=V51_AFTERMATH[key]?.policy,c=v51AftermathChoice(key);if(!c)return false;chooseActionCandidate(p,c.key);startStory();return true;},profile:()=>v50EnsureHistory(),aftermathLedger:()=>state.worldHistory.filter(x=>String(x?.id||'').startsWith('aftermath:odyssey:')),openContacts:()=>openContacts(),startVisit:id=>startVisit(id)};
