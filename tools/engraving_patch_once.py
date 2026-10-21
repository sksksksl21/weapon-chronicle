"""One-shot bounded migration of the parent combat bridge; remove after CI is green."""
from pathlib import Path
p=Path("src/legacy/game_runtime.js")
s=p.read_text(encoding="utf8")
def change(a,b):
    global s
    assert s.count(a)==1, ("replacement source drift",a[:80],s.count(a))
    s=s.replace(a,b)
change("function launchStoryCombat(enemy,label,nextWin,nextLose,mods={}){","""// Card progression belongs to the sword and survives owner succession.
function wcCombatCardMastery(raw){
  const result={};
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
  for(const family of ['aim','guard','over','blood','feint','reroll','reverse','counter','endure']){
    const count=raw[family];
    if(Number.isInteger(count)&&count>=0)result[family]=Math.min(3,count);
  }
  return result;
}
function launchStoryCombat(enemy,label,nextWin,nextLose,mods={}){""")
change("storySkills:state.weapon.engravings.join(','),medkit:",
       "storySkills:state.weapon.engravings.join(','),cardMastery:JSON.stringify(wcCombatCardMastery(state.weapon.cardMastery)),medkit:")
change('"storySkills","medkit","bandage","antidote"',
       '"storySkills","cardMastery","medkit","bandage","antidote"')
change("  state.storyCtx.combatPending=null;\n   if(p?.mods?.v32SideEncounter)",
"""  state.storyCtx.combatPending=null;
  // Only committed encounter results add progress. Interrupted actions keep old values.
  if(d.cardMastery&&typeof d.cardMastery==='object'){
    const latest=wcCombatCardMastery(d.cardMastery);
    const previous=wcCombatCardMastery(state.weapon.cardMastery);
    for(const [family,count] of Object.entries(latest))previous[family]=Math.max(previous[family]||0,count);
    state.weapon.cardMastery=previous;
  }
   if(p?.mods?.v32SideEncounter)""")
p.write_text(s,encoding="utf8")
pkg=Path("package.json")
s=pkg.read_text(encoding="utf8")
a="python3 tests/disabled_overdrive_reward.py"
assert a in s and "tests/card_engraving.py" not in s
pkg.write_text(s.replace(a,a+" && python3 tests/card_engraving.py"),encoding="utf8")
print("patched existing battle bridge and registered engraving regression")
