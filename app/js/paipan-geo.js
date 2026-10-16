/* ═══ 排盘页出生地经度获取（2026-10-16）═══
 * 定夺口径：不再默认上海 121.47°E——经度由浏览器地理定位或信众手填获得；
 * 两者皆无则不校正（按东八区标准时），披露组件如实显示「未校正」。
 * 用法：window._paipanGeo.attach(inputId) —— 在经度输入框旁挂 📍 定位按钮
 */
(function(){
  var CACHE_KEY = 'mlbj_geo_lng';

  function fill(inputEl, btn, silent){
    if(!navigator.geolocation){
      if(!silent && window.showToast) showToast('当前浏览器不支持定位，请手动填写出生地经度');
      return;
    }
    if(btn){ btn.disabled = true; btn.textContent = '⏳'; }
    navigator.geolocation.getCurrentPosition(function(pos){
      var lng = Math.round(pos.coords.longitude * 100) / 100;
      inputEl.value = lng;
      try{ sessionStorage.setItem(CACHE_KEY, String(lng)); }catch(e){}
      if(btn){ btn.disabled = false; btn.textContent = '📍'; btn.title = '已获取定位：' + lng + '°E（再次点击可刷新）'; }
      if(window.showToast) showToast('📍 已获取当前位置经度 ' + lng + '°E；若与出生地不同请手改');
      // 触发 change 便于页面联动
      try{ inputEl.dispatchEvent(new Event('change', {bubbles:true})); }catch(e){}
    }, function(err){
      if(btn){ btn.disabled = false; btn.textContent = '📍'; }
      if(!silent && window.showToast) showToast('定位失败（' + (err.message || '被拒绝') + '），请手动填写出生地经度');
    }, {timeout: 8000, maximumAge: 600000});
  }

  window._paipanGeo = {
    /** 在指定经度输入框后挂 📍 按钮；若 sessionStorage 有缓存定位且输入框为空，自动回填 */
    attach: function(inputId){
      var inputEl = document.getElementById(inputId);
      if(!inputEl || inputEl._geoAttached) return;
      inputEl._geoAttached = true;
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = '📍';
      btn.title = '获取当前位置经度（若与出生地不同请手改）';
      btn.setAttribute('aria-label', '获取当前位置经度');
      btn.style.cssText = 'margin-left:4px;padding:6px 8px;font-size:13px;border:1px solid rgba(125,211,192,.3);border-radius:4px;background:rgba(125,211,192,.08);color:#7dd3c0;cursor:pointer';
      btn.onclick = function(){ fill(inputEl, btn, false); };
      if(inputEl.parentNode) inputEl.parentNode.insertBefore(btn, inputEl.nextSibling);
      // 缓存回填（同一会话内已定位过）
      try{
        var cached = sessionStorage.getItem(CACHE_KEY);
        if(cached && inputEl.value === ''){ inputEl.value = cached; }
      }catch(e){}
    },
    /** 读取输入框经度；空/非法返回 null（不校正） */
    read: function(inputId, min, max){
      var el = document.getElementById(inputId);
      if(!el || el.value === '') return null;
      var v = parseFloat(el.value);
      if(isNaN(v)) return null;
      if(min !== undefined && v < min) return null;
      if(max !== undefined && v > max) return null;
      return v;
    }
  };
})();
