
v48EnsureState();
const v483Loaded=loadGame();
if(v483Loaded!==null){if(v483Loaded){if(!state.monthFacts?.length)genMonth();else{render();addLog('자동저장 데이터를 불러왔다.');}}else genMonth();}
// Activate the already registered game modules only AFTER the legacy save
// and initial state have been restored. Subscriptions are then live for actual
// combat/reward events; no second save, reward or combat is triggered here.
if(typeof WC_GAME_MODULES_V1!=="undefined"){
 Promise.resolve().then(()=>WC_GAME_MODULES_V1.initialize()).catch(error=>{
  if(typeof console!=="undefined")console.warn("Game module initialization failed",error);
 });
}
})();
