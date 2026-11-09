"use strict";
// Chapter-1 scene card data + pure progression rules (no browser needed).
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const DATA=JSON.parse(fs.readFileSync(path.join(root,"src/story/chapter1_scenes_v1.json"),"utf8"));
const MARKER="/* @include:chapter1-scenes-json */";
const source=fs.readFileSync(path.join(root,"src/story/scene_cards_v1.js"),"utf8");
assert.equal(source.split(MARKER).length,2,"one JSON include marker");
function load(data){
 const sandbox={console:{error(){},warn(){}}};
 vm.createContext(sandbox);
 vm.runInContext(source.replace(MARKER,"const WC_CH1_SCENES_JSON_V1="+JSON.stringify(data)+";")+"\n;globalThis.API=WC_SCENE_CARDS_V1;",sandbox);
 return sandbox.API.engine;
}
const E=load(DATA);
assert.equal(E.valid,true,"scene data valid: "+E.problems.join(", "));

// Every card: background art, at least one character, body text, 2-3 choices
// each with a result sentence and a next card (or the chapter end).
for(const c of DATA.cards){
 assert.ok(c.background&&c.characters.length&&c.text.trim(),c.id);
 assert.ok(c.choices.length>=2&&c.choices.length<=3,c.id);
 for(const x of c.choices){assert.ok(x.result.trim()&&x.label.trim());assert.ok(x.next==="END"||E.card(x.next),c.id+"."+x.id);}
}
const hunter=DATA.cards.find(c=>c.title==="덫에 걸린 사냥꾼");
assert.ok(hunter,"trapped hunter card exists");
assert.equal(hunter.choices.length,3);
assert.deepEqual(hunter.choices.map(x=>x.label),["덫을 풀어 준다","가진 걸 내놓으면 풀어 주겠다고 한다","그냥 지나친다"]);

// Walk every route from the start to the chapter end.
function walk(run,owner,out){
 if(run.status==="ending"){out.push(run);return;}
 const c=E.card(run.card);
 for(const x of c.choices){
  const r=E.choose(run,x.id,owner);
  assert.equal(r.status,"result");
  assert.equal(r.picks.at(-1).result,E.fill(x.result,owner));
  walk(E.advance(r),owner,out);
 }
}
const ends=[];walk(E.begin(),"도리스",ends);
assert.equal(ends.length,2*2*3*2,"all routes reach the chapter end");
for(const r of ends){
 assert.equal(r.picks.length,DATA.cards.length);
 assert.ok(r.picks.some(p=>p.card===hunter.id),"every route passes the hunter");
 assert.ok(["a","b"].includes(E.approach(r)));
 for(const p of r.picks)assert.ok(!p.result.includes("{owner"),"owner placeholders filled");
}
// The hunter choice changes the next card's text (causal follow-up).
let r=E.begin();
r=E.advance(E.choose(r,"refugees","도리스"));
r=E.advance(E.choose(r,"hunt_path","도리스"));
const freed=E.advance(E.choose(r,"free","도리스"));
const left=E.advance(E.choose(r,"pass","도리스"));
assert.equal(freed.card,"ch1_dock");
assert.match(E.cardText(freed,"ch1_dock","도리스"),/빚 갚는다/);
assert.doesNotMatch(E.cardText(left,"ch1_dock","도리스"),/빚 갚는다/);
assert.equal(JSON.stringify(E.effects(left)),JSON.stringify({gold:0,mind:-5}));
const paid=E.advance(E.choose(r,"bargain","도리스"));
assert.equal(JSON.stringify(E.effects(paid)),JSON.stringify({gold:4,mind:0}));
assert.equal(E.choose(freed,"shelter","도리스").picks.at(-1).result.startsWith("도리스는"),true);
// Steps must happen in order; unknown choices are rejected.
assert.throws(()=>E.choose(E.choose(freed,"shelter","x"),"shelter","x"),/not waiting/);
assert.throws(()=>E.choose(freed,"nope","x"),/no such choice/);
assert.throws(()=>E.advance(freed),/no result/);
assert.equal(E.isRun({...freed,card:"missing"}),false);
// Korean particles follow the owner's name.
assert.equal(E.fill("{owner은/는} 갔다","도리스"),"도리스는 갔다");
assert.equal(E.fill("{owner은/는} 갔다","테온"),"테온은 갔다");
assert.equal(E.fill("{owner}의 검","테온"),"테온의 검");

// Broken data is rejected (the game then keeps the monthly board).
const broken=mut=>{const d=JSON.parse(JSON.stringify(DATA));mut(d);return load(d).valid;};
assert.equal(broken(d=>{d.cards[1].choices[0].next="nowhere";}),false);
assert.equal(broken(d=>{d.cards[2].choices[0].next="ch1_ashes";}),false,"no backward loops");
assert.equal(broken(d=>{d.cards[0].background="none";}),false);
assert.equal(broken(d=>{d.cards[1].choices[0].result="";}),false);
assert.equal(broken(d=>{d.cards[0].choices.splice(1);}),false);
assert.equal(broken(d=>{d.cards[0].characters=[];}),false);
assert.equal(broken(d=>{d.cards[3].choices[0].approach="c";}),false);
assert.equal(broken(d=>{d.cards[2].choices[1].effects={gold:9999};}),false);

// The offline bundle embeds the data (no runtime fetch) once rebuilt.
const built=fs.readFileSync(path.join(root,"index.html"),"utf8");
assert.ok(built.includes("const WC_CH1_SCENES_JSON_V1={"),"index.html embeds scene data; run npm run build");
assert.ok(!built.includes(MARKER));
console.log("PASS: chapter-1 scene cards",DATA.cards.length,"cards,",ends.length,"complete routes");
