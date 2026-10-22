/* DEV merchant integration: show the 5-tier sword and armor pools in real shops.
 * Runs after equipment_pool_v1 and before bootstrap. Never edits existing save keys.
 */
const WC_MERCHANT_STOCK_V1=(()=>{
"use strict";
const pool=WC_EQUIPMENT_POOL_V1;
const RANKS=pool.TIERS;
const ARMOR=pool.A_SLOTS;
const SWORD=pool.W_SLOTS;
function beta(){return typeof V32_BETA!=="undefined"&&V32_BETA===true;}
function tierFor(index){
 if(beta()&&index<5)return RANKS[index].id;
 let draw=Math.random()*RANKS.reduce((sum,t)=>sum+t.weight,0);
 for(const tier of RANKS){draw-=tier.weight;if(draw<0)return tier.id;}
 return RANKS[0].id;
}
function buildStock(kind){
 const isArmor=kind==="armor",slots=isArmor?ARMOR:SWORD;
 const count=isArmor?(beta()?8:6):(beta()?9:8);
 const rows=[];
 for(let i=0;i<count;i++){
  const slot=slots[i%slots.length];
  const grade=tierFor(i);
  const baseIndex=Math.floor(Math.random()*4);
  const template="wc5_"+slot+"_"+baseIndex+"_"+grade;
  const copy=pool.rollCopy(template);
  if(!copy)throw Error("Missing generated "+kind+" template: "+template);
  const row={id:copy.id,sold:false};
  if(!isArmor){
   row.slot=slot;
   row.price=copy.item.shopPrice||marketPartPrice(copy.id);
  }
  rows.push(row);
 }
 return rows;
}
function validRow(kind,row){
 if(!row||typeof row.id!=="string")return false;
 if(kind==="armor")return !!OWNER_GEAR_CATALOG[row.id];
 return !!(row.slot&&PART_CATALOG[row.slot]?.[row.id]);
}
// For old saves with a shop stock already generated, replace UNSOLD stock only.
// Never overwrite sold transactions or owner inventory/equipment.
function upgradeOldStock(kind){
 if(typeof state==="undefined")return false;
 const rows=kind==="armor"?state.marketV24?.armor:state.smithPartStock;
 if(!Array.isArray(rows)||!rows.length||rows.some(x=>x?.id?.startsWith("wc6_")))return false;
 const replaceable=rows.map((row,i)=>!row.sold?i:-1).filter(i=>i>=0);
 if(!replaceable.length)return false;
 const supply=buildStock(kind);
 const maximum=Math.min(replaceable.length,kind==="armor"?4:8);
 let changed=false;
 for(let j=0;j<maximum;j++){
  const incoming=supply[j];
  if(!validRow(kind,incoming))continue;
  rows[replaceable[j]]=incoming;
  changed=true;
 }
 if(changed&&typeof saveGame==="function")saveGame();
 return changed;
}
if(typeof randomGearStock==="function"){
 randomGearStock=function(){return buildStock("armor");};
}
if(typeof generateSmithPartStockV24==="function"){
 generateSmithPartStockV24=function(){return buildStock("sword");};
}
if(typeof wc43StatsForArmor==="function"){
 const before=wc43StatsForArmor;
 wc43StatsForArmor=function(id){
  return before.call(this,id)+pool.formatDetail(OWNER_GEAR_CATALOG[id]);
 };
}
if(typeof wc43MarketArmor==="function"){
 const before=wc43MarketArmor;
 wc43MarketArmor=function(...args){
  try{upgradeOldStock("armor");}catch(err){console.warn("Armor stock refresh skipped",err);}
  return before.apply(this,args);
 };
}
if(typeof openSmithBuy==="function"){
 const before=openSmithBuy;
 openSmithBuy=function(...args){
  try{upgradeOldStock("sword");}catch(err){console.warn("Smith stock refresh skipped",err);}
  return before.apply(this,args);
 };
}
function installStyle(){
 if(typeof document==="undefined"||document.getElementById("wc6-merchant-style"))return;
 const el=document.createElement("style");
 el.id="wc6-merchant-style";
 el.textContent=".wc43-shopItem.rarity-common{border:2px solid #8b949e!important}"+
 ".wc43-shopItem.rarity-rare{border:2px solid #4589dc!important}"+
 ".wc43-shopItem.rarity-unique{border:2px solid #ab73e3!important}"+
 ".wc43-shopItem.rarity-legendary{border:2px solid #d5a544!important}"+
 ".wc43-shopItem.rarity-chronicle{border:2px solid #e36d7c!important}"+
 ".wc43-shopItem.rarity-chronicle{box-shadow:inset 0 0 0 1px #e36d7c88!important}"+
 ".wc43-shopInfo .wc5-quality{margin:5px 0;padding:4px;font-size:10px}";
 document.head.appendChild(el);
}
installStyle();
return Object.freeze({buildStock,upgradeOldStock,tierFor,validRow});
})();
if(typeof module!=="undefined"&&module.exports)module.exports=WC_MERCHANT_STOCK_V1;
