#!/usr/bin/env python3
"""Run the status test using its own real-module dependency loader."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]

# Source-only lifecycle/equivalence checks; no generated HTML or browser needed.
COMBAT_BOUNDARY_CHECK = r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const handlers=new Set(),frame={contentWindow:{}},seen=[];
 const state={storyCtx:{},ownerProgress:{combatXp:0}};
 let launches=0,gains=0;
 const ctx=vm.createContext({console,state,document:{getElementById:()=>frame},
  window:{addEventListener:(t,f)=>handlers.add(f),removeEventListener:(t,f)=>handlers.delete(f)},
  launchStoryCombat(enemy,label){launches++;state.storyCtx.combatPending={enemy,label,tier:2};return 17;},
  gainCombatExperience(t,b,f=1){gains++;state.ownerProgress.combatXp+=t*10*f;return 23;}
 });
 const load=file=>vm.runInContext(fs.readFileSync('src/core/'+file+'.js','utf8'),ctx);
 load('module_services_v1');load('combat_math_v1');load('legacy_combat_sources_v1');
 load('direct_combat_stats_v2');load('direct_combat_runtime_v2');
 // Load the pure handoff API without its unrelated legacy UI hooks.
 const launchFixture=ctx.launchStoryCombat;ctx.launchStoryCombat=undefined;
 load('live_combat_handoff_v1');ctx.launchStoryCombat=launchFixture;
 load('status_skilldeck_v1');
 const registry=vm.runInContext('WC_GAME_MODULES_V1',ctx);
 // Status invokes initialization synchronously; await its lifecycle completion.
 await Promise.resolve();
 await registry.initialize();
 const combat=registry.require('combat');
 assert.equal(combat,vm.runInContext('WC_COMBAT_MODULE_V1',ctx));
 for(const [key,name] of Object.entries({math:'WC_COMBAT_MATH_V1',stats:'WC_DIRECT_COMBAT_V2',
  legacySources:'WC_LEGACY_COMBAT_SOURCES_V1',handoff:'WC_LIVE_COMBAT_HANDOFF_V1',skillDeck:'WC_STATUS_SKILLDECK_V1'})){
  assert.equal(combat[key],vm.runInContext(name,ctx));
 }
 const input={owner:{martial:70,survival:60,baseHp:90},weapon:{minAttack:10,maxAttack:20}};
 assert.deepEqual(combat.stats.calculate(input),vm.runInContext('WC_DIRECT_COMBAT_V2',ctx).calculate(input));
 const oldDeck=JSON.stringify(vm.runInContext('WC_STATUS_SKILLDECK_V1.ensureDeck()',ctx));
 assert.equal(JSON.stringify(combat.skillDeck.ensureDeck()),oldDeck);
 for(const topic of Object.values(combat.EVENTS))registry.events.subscribe(topic,data=>seen.push({topic,data}));
 // A broken observer cannot block launch, XP transfer, or end notification.
 registry.events.subscribe(combat.EVENTS.START,()=>{throw Error('observer fixture');});
 assert.equal(combat.launch('bandit','fixture'),17);
 assert.equal(launches,1);assert.equal(seen[0].topic,'combat:start');
 assert.equal(vm.runInContext('gainCombatExperience(2,false,.35)',ctx),23);
 assert.equal(gains,1);assert.equal(state.ownerProgress.combatXp,7);
 assert.equal(seen[1].topic,'combat:reward');assert.equal(seen[1].data.currentXp,7);
 assert.equal(seen[1].data.amount,23); // Preserve the legacy return, including level-up accounting.
 const message={data:{type:'wc-story-combat',result:'win'},source:frame.contentWindow};
 for(const handler of handlers)handler(message); // pending result is not yet settled
 assert.equal(seen.length,2);
 state.storyCtx.combatPending=null;
 for(const handler of handlers)handler({...message,source:{}});
 assert.equal(seen.length,2);
 for(const handler of handlers)handler(message);
 for(const handler of handlers)handler(message);
 assert.equal(seen.length,3);assert.equal(seen[2].topic,'combat:end');
 assert.equal(seen[0].data.id,seen[2].data.id);assert(Object.isFrozen(seen[2].data));
 await registry.dispose();assert.equal(handlers.size,0);
 await registry.initialize();assert.equal(handlers.size,1);
 assert.equal(combat.launch('bandit','again'),17);assert.equal(launches,2);
 await registry.dispose();
 console.log('PASS: combat registry lifecycle, shared APIs, events, XP equivalence and disposal');
})().catch(error=>{console.error(error);process.exitCode=1;});
"""

if __name__ == "__main__":
    subprocess.run(["node", "tests/status_skilldeck_v1.js"], cwd=ROOT, check=True)
    subprocess.run(["node", "-e", COMBAT_BOUNDARY_CHECK], cwd=ROOT, check=True)
