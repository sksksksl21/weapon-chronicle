"use strict";
/* Story module event contract (A2).
 * The four story sources (main chapters, v5.0 history branch, v5.1 aftermath,
 * v5.2 act-one history) must be grouped into one registry module with id
 * "story". When initialized it subscribes to the game progress topic
 * "chapter:completed"; publishing {no, result, path} for the current main
 * chapter commits the chapter through the existing v47CompleteChapter chain,
 * so the historical pivot is recorded exactly once (no double commit).
 */
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");

const STORY_MODULE_ID="story";
const CHAPTER_TOPIC="chapter:completed";
const SOURCES=[
 "../src/story/main_chapters_v47.js",
 "../src/story/history_branch_v50.js",
 "../src/story/world_aftermath_v51.js",
 "../src/story/act1_history_v52.js"
];

const makeRegistry=()=>{
 const services=new Map(), definitions=new Map(), listeners=new Map();
 const subscribe=(topic,handler)=>{
  if(!listeners.has(topic))listeners.set(topic,[]);
  listeners.get(topic).push(handler);
  return ()=>{const list=listeners.get(topic)||[];const i=list.indexOf(handler);if(i>=0)list.splice(i,1);};
 };
 const publish=(topic,payload)=>{(listeners.get(topic)||[]).slice().forEach(h=>h(payload));};
 const events=Object.freeze({subscribe,publish});
 const register=(id,api)=>{
  if(id&&typeof id==="object"&&api===undefined){definitions.set(id.id,id);return id;}
  services.set(id,api);return api;
 };
 const has=id=>services.has(id)||definitions.has(id);
 const get=id=>services.has(id)?services.get(id):definitions.get(id);
 const requireService=id=>{if(!services.has(id))throw new Error("Missing game module dependency: "+id);return services.get(id);};
 const list=()=>Object.freeze([...new Set([...services.keys(),...definitions.keys()])]);
 const registry={register,require:requireService,get,has,list,events};
 registry.initialize=async()=>{
  for(const def of definitions.values()){
   if(services.has(def.id))continue;
   const init=def.init||def.initialize;
   const api=init?await init.call(def,Object.freeze({...registry,events})):undefined;
   services.set(def.id,api===undefined?def:api);
  }
  return registry;
 };
 registry.dispose=async()=>{};
 registry.listenerCount=topic=>(listeners.get(topic)||[]).length;
 return registry;
};

const loadStory=()=>{
 const registry=makeRegistry();
 const v47={stage:10,complete:false,results:[],investigations:{}};
 const originalCalls=[];
 const state={
  branchFlags:{},saveMeta:{},worldHistory:[],owner:{name:"owner-a"},year:3,month:4,
  gold:0,mind:50,storyCtx:{notes:[]},monthCandidateCache:{},
  mainStory:{flags:{},expedition:{crew:10,ship:100,supplies:3},act1ChapterResults:[],node:"1-09",act1Complete:true}
 };
 const noop=()=>undefined;
 const sandbox={
  console,state,location:{search:""},WC_GAME_MODULES_V1:registry,
  v48EnsureState:noop,ensureV47:()=>v47,ensureV25MainState:noop,
  v47CompleteChapter:(c,result,p)=>{originalCalls.push({no:c.no,result,path:p});v47.results.push({no:c.no,result});v47.stage=c.no+1;return "committed";},
  v47MainStory:noop,v47Current:()=>null,v47Scene:noop,v47UnlockedOptions:()=>[],ACT_NAMES_V47:{},
  render:noop,loadGame:()=>true,saveGame:noop,openModal:noop,modalHead:()=>"",bindClose:noop,closeModal:noop,$:()=>null,
  actionCandidatesForPolicy:()=>[],actionCandidate:()=>null,actionDefByKey:()=>null,
  showStoryNode:noop,finishStory:noop,openStoryScene:noop,openContacts:noop,startVisit:noop,openV47Epilogue:noop,
  completeAct1ChapterV25:noop,showMainStoryNode:noop,currentAct1ChapterV25:()=>null,ACT1_CHAPTERS_V25:[],
  mainAdjust:noop,addWorldFact:noop,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))
 };
 vm.createContext(sandbox);
 vm.runInContext("var v47ByNo=null;",sandbox,{filename:"story-test-prelude.js"});
 SOURCES.forEach(rel=>{
  const file=path.join(__dirname,rel);
  vm.runInContext(fs.readFileSync(file,"utf8"),sandbox,{filename:file});
 });
 vm.runInContext("if(!v47ByNo)v47ByNo=no=>MAIN_V47.find(c=>c.no===Number(no))||null;",sandbox,{filename:"story-test-lookup.js"});
 return {registry,state,v47,originalCalls,sandbox};
};

test("story sources load without the registry changing direct chapter commits",()=>{
 const {sandbox,state,originalCalls}=loadStory();
 const chapter=vm.runInContext("v47ByNo(10)",sandbox);
 vm.runInContext("v47CompleteChapter(v47ByNo(10),'resolved','b')",sandbox);
 assert.equal(chapter.no,10);
 assert.equal(state.branchFlags.odysseyV50.pivots.winds,"opened");
 assert.equal(originalCalls.length,1);
});

test("story module subscribes to chapter progress events and commits history once",async()=>{
 const {registry,state,v47,originalCalls}=loadStory();
 assert.ok(registry.has(STORY_MODULE_ID),"story sources must register a '"+STORY_MODULE_ID+"' module in the registry");
 await registry.initialize();
 assert.ok(registry.listenerCount(CHAPTER_TOPIC)>0,"story module must subscribe to '"+CHAPTER_TOPIC+"'");

 registry.events.publish(CHAPTER_TOPIC,{no:10,result:"resolved",path:"b"});
 const history=state.branchFlags.odysseyV50;
 assert.ok(history&&history.pivots,"chapter event must reach the v5.0 history branch");
 assert.equal(history.pivots.winds,"opened");
 assert.equal(state.mainStory.flags.history_winds_opened,true);
 assert.equal(originalCalls.length,1);
 assert.equal(v47.stage,11);

 // Replaying the same progress event must not commit or reward twice.
 registry.events.publish(CHAPTER_TOPIC,{no:10,result:"resolved",path:"a"});
 assert.equal(originalCalls.length,1);
 assert.equal(history.pivots.winds,"opened");
 assert.equal(state.worldHistory.filter(x=>x&&x.id==="history:odyssey:winds").length,1);
});
