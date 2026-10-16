/* ═══ 排盘页真太阳时校正披露（2026-10-16，全平台统一口径）═══
 * 用法：window._solarNote(chart, metaEl)
 *   chart  — 服务端返回的盘对象（bazi系：chart.input.true_solar/correction；ziwei系：chart.solarInfo）
 *   metaEl — 挂载容器（各页的 *-meta 元素），每次调用先清旧节点再挂载
 */
(function(){
  // info 可选：{year,month,day,hour,minute,lng}——专用端点（liuyao/meihua/liuren/qimen/fengshui）
  // 的 chart 不带 input 字段，用前端同口径公式（true-solar-local.js，与服务端 Spencer 1971 一致）补算
  window._solarNote = function(chart, metaEl, info){
    if(!metaEl) return;
    var old = metaEl.querySelector('#pp-solar-note'); if(old) old.remove();
    var txt = '';
    var inp = (chart && chart.input) || {};
    if(inp.true_solar){
      txt = '【真太阳时】' + inp.true_solar + (inp.correction ? ' · ' + inp.correction : '');
    } else if(chart && chart.solarInfo && chart.solarInfo.applied){
      var si = chart.solarInfo;
      txt = '【真太阳时】经度 ' + si.lng + '°E · 校正 ' + (si.correction_minutes > 0 ? '+' : '') + si.correction_minutes +
            ' 分钟 → 真太阳时 ' + si.true_hour + ':' + ('0' + si.true_minute).slice(-2);
    } else if(info && info.lng && window._trueSolarLocal){
      var r = window._trueSolarLocal.toTrueSolar(+info.year, +info.month, +info.day, +info.hour, info.minute || 0, +info.lng);
      if(r.applied) txt = '【真太阳时】经度 ' + r.lng + '°E · 校正 ' + (r.correction_minutes > 0 ? '+' : '') + r.correction_minutes +
            ' 分钟 → 真太阳时 ' + r.true_hour + ':' + ('0' + r.true_minute).slice(-2) + '（Spencer 1971）';
    }
    if(!txt) return;
    var div = document.createElement('div');
    div.id = 'pp-solar-note';
    div.style.cssText = 'margin:6px 0;font-size:11px;color:#7dd3c0;line-height:1.6';
    div.textContent = txt;
    metaEl.appendChild(div);
  };
})();
