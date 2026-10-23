"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const calculate=require("../src/core/direct_combat_stats_v2.js").calculate;
const stats=calculate({owner:{martial:60,survival:50,baseHp:100},
 weapon:{minAttack:100,maxAttack:140,defense:80,hitBonus:20}});
assert.equal(stats.minAttack,60);assert.equal(stats.maxAttack,84);
assert.equal(stats.defense,40);assert.equal(stats.hitChance,82);
const source=fs.readFileSync(path.join(__dirname,"../src/core/live_combat_handoff_v1.js"),"utf8");
assert(source.includes("wcDirectCurrentStats()"));
assert(source.includes("version:'direct-v2'"));
assert(!source.includes("WC_COMBAT_MATH_V1"));
assert(!source.includes("WC_LEGACY_COMBAT_SOURCES_V1"));
console.log("PASS: direct V2-only handoff and basic 60%/50% utilization");
