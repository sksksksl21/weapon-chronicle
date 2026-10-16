
v48EnsureState();
if(loadGame()){if(!state.monthFacts?.length)genMonth();else{render();addLog('자동저장 데이터를 불러왔다.');}}else genMonth();
})();
