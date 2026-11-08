#!/usr/bin/env python3
"""Validate v5.2 baseline reproducibility and aggregate JS syntax; does not modify the game."""
import hashlib, subprocess, sys, tempfile
from pathlib import Path
from build_sources import compose
root=Path(__file__).resolve().parents[1]
expected, js, combat = compose(root)
built=(root/'index.html').read_text(encoding='utf8')
assert built==expected,'Generated index.html out of date: run npm run build'
assert (root/'combat_story.html').read_bytes()==combat, 'Generated combat_story.html out of date: run npm run build'
with tempfile.TemporaryDirectory() as t:
    p=Path(t)/'built.js';p.write_text(js,encoding='utf8')
    subprocess.run(['node','--check',str(p)],check=True)
print('PASS: deterministic build, JS syntax, output SHA256='+hashlib.sha256(built.encode()).hexdigest())

# Focused integration fixture: execute the actual bootstrap, registry and economy
# subscription with boundary doubles. Browser regressions remain a separate gate.
integration = r"""
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function check(blocked){
 const trace=[];
 const sandbox={console,state:{monthFacts:['existing']},
  v48EnsureState:()=>trace.push('ensure'),
  loadGame:()=>{trace.push('load');return blocked?null:true;},
  genMonth:()=>trace.push('month'),addLog:()=>{}};
 vm.createContext(sandbox);
 vm.runInContext(fs.readFileSync('src/core/module_services_v1.js','utf8'),sandbox);
 const registry=vm.runInContext('WC_GAME_MODULES_V1',sandbox);
 registry.register('equipment',{});
 registry.register('equipment-catalog',{query:()=>[],detail:()=>null});
 registry.register('merchant',{applyCombatReward:()=>trace.push('reward')});
 registry.register({id:'combat',init(){trace.push('combat');return {};}});
 registry.register('save',{});
 registry.register({id:'story',init(){return {completeChapter:()=>trace.push('story')};}});
 sandbox.uiModuleRegistryV1=()=>registry.register('ui',{refresh:()=>trace.push('ui')});
 vm.runInContext(fs.readFileSync('src/core/economy_rewards_v1.js','utf8'),sandbox);
 const bootstrap=fs.readFileSync('src/legacy/bootstrap.js','utf8');
 vm.runInContext(bootstrap.replace(/\}\)\(\);\s*$/, ''),sandbox);
 await vm.runInContext('WC_RUNTIME_READY_V1',sandbox);
 assert.deepEqual(trace,blocked?['combat','ensure','load']:['combat','ensure','load','ui']);
 if(!blocked){
  registry.events.publish('combat:reward',{kind:'equipment'});
  registry.require('runtime-integration').completeChapter({no:9});
  registry.events.publish('combat:end',{});
  assert.deepEqual(trace.slice(-3),['reward','story','ui']);
  await registry.initialize();
  const before=trace.length;
  registry.events.publish('combat:reward',{});
  assert.equal(trace.length,before+1,'No duplicate reward subscription');
 }
 await registry.dispose();
}
(async()=>{await check(false);await check(true);
 console.log('PASS: registry bootstrap, reward/story/UI routing and blocked recovery startup');
})().catch(error=>{console.error(error);process.exitCode=1;});
"""
subprocess.run(['node','-e',integration],cwd=root,check=True)
