(function(){
      let checkInterval = setInterval(function(){
        if (typeof renderCureCenter === 'function') {
          clearInterval(checkInterval);
          renderCureCenter();
        }
      }, 200);
    })();