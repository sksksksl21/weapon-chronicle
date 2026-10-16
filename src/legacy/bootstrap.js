
v48EnsureState();
const v483Loaded=loadGame();
if(v483Loaded!==null){if(v483Loaded){if(!state.monthFacts?.length)genMonth();else{render();addLog('자동저장 데이터를 불러왔다.');}}else genMonth();}
})();
