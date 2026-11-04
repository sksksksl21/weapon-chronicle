// The registry is required in the integrated build; startup errors are visible.
// Register the late-bound UI before lifecycle execution locks registration.
uiModuleRegistryV1();
WC_GAME_MODULES_V1.register({
 id:'runtime-integration',dependencies:['combat','equipment','merchant','economy','save','story','ui'],
 init(services){
  services.events.subscribe('combat:end',()=>services.require('ui').refresh());
  return Object.freeze({
   completeChapter(event){return services.require('story').completeChapter(event);},
   refresh(){return services.require('ui').refresh();}
  });
 }
});
const WC_RUNTIME_READY_V1=(async()=>{
 // Initialize save hooks and reward/story subscriptions before restoring state.
 await WC_GAME_MODULES_V1.initialize();
v48EnsureState();
const v483Loaded=loadGame();
 if(v483Loaded!==null){
  if(v483Loaded){
   if(!state.monthFacts?.length)genMonth();
   else{WC_GAME_MODULES_V1.require('ui').refresh();addLog('???? ???? ????.');}
  }else genMonth();
 }
 return WC_GAME_MODULES_V1;
})();
if(typeof window!=='undefined')window.WC_RUNTIME_READY_V1=WC_RUNTIME_READY_V1;
WC_RUNTIME_READY_V1.catch(error=>{
 console.error('Game module initialization failed',error);
});
})();
