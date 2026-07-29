/**
 * 望诊知识库加载器
 * 加载 knowledge/wangzhen-kb-data.json 并挂载到 window.WANGZHEN_KB
 */
(function(){
  'use strict';
  window.WANGZHEN_KB = window.WANGZHEN_KB || { loaded: false, data: [], zones: {}, colors: {}, shapes: {}, organs: {}, rules: {}, therapy: {} };

  var KB_URL = '/knowledge/wangzhen-kb-data.json';

  function parseKB(rawData){
    var kb = {
      loaded: true,
      data: rawData,
      zones: {},       // A-K 分区
      colors: {},      // 五色辨证
      shapes: {},      // 形态诊断
      organs: {},      // 五官诊法
      diagnosis: {},   // 诊断口诀/头痛分型等
      rules: {},       // AI 规则
      therapy: {},     // 理疗方案
      stats: { total: rawData.length, categories: {} }
    };

    rawData.forEach(function(item){
      var cat = item.category || 'other';
      kb.stats.categories[cat] = (kb.stats.categories[cat]||0)+1;

      switch(cat){
        case '分区':
          if(item.entry_id === 'KB-wangzhen-R200-001' || item.entry_id === 'KB-wangzhen-R200-050'){
            kb.zones._overview = item;
          } else {
            // 提取区域代号 A-K
            var m = item.title.match(/区域([A-K])/);
            if(m){
              kb.zones[m[1]] = item;
            } else {
              kb.zones[item.entry_id] = item;
            }
          }
          break;
        case '五色':
          var cm = item.title.match(/(青色|赤色|黄色|白色|黑色)/);
          if(cm){
            kb.colors[cm[1].replace('色','')] = item;
          } else {
            kb.colors[item.entry_id] = item;
          }
          break;
        case '形态':
          kb.shapes[item.entry_id] = item;
          break;
        case '五官':
          // 按子模块分类：眼/耳/鼻/人中/口唇/舌/齿
          var om = item.title.match(/(眼|白睛|眼睑|瞳孔|耳|鼻|人中|口唇|舌|牙)/);
          var subMod = 'other';
          if(om){
            if(/眼|白睛|眼睑|瞳孔/.test(om[1])) subMod = 'eye';
            else if(/耳/.test(om[1])) subMod = 'ear';
            else if(/鼻/.test(om[1])) subMod = 'nose';
            else if(/人中/.test(om[1])) subMod = 'philtrum';
            else if(/口唇/.test(om[1])) subMod = 'lip';
            else if(/舌/.test(om[1])) subMod = 'tongue';
            else if(/牙/.test(om[1])) subMod = 'teeth';
          }
          if(!kb.organs[subMod]) kb.organs[subMod] = [];
          kb.organs[subMod].push(item);
          break;
        case '诊断':
          kb.diagnosis[item.entry_id] = item;
          break;
        case '规则':
          kb.rules[item.entry_id] = item;
          break;
        case '理疗':
          kb.therapy[item.entry_id] = item;
          break;
      }
    });

    // 统计五官子模块
    kb.stats.organModules = {};
    Object.keys(kb.organs).forEach(function(k){
      kb.stats.organModules[k] = kb.organs[k].length;
    });

    return kb;
  }

  // 尝试 fetch 加载
  if(window.fetch){
    fetch(KB_URL)
      .then(function(r){ return r.json(); })
      .then(function(data){
        window.WANGZHEN_KB = parseKB(data);
        console.warn('[WANGZHEN_KB] 已加载', window.WANGZHEN_KB.stats.total, '条 · 分区', Object.keys(window.WANGZHEN_KB.zones).length, '· 五色', Object.keys(window.WANGZHEN_KB.colors).length, '· 五官模块', JSON.stringify(window.WANGZHEN_KB.stats.organModules));
        // 派发事件
        window.dispatchEvent(new CustomEvent('wangzhen-kb-loaded', { detail: window.WANGZHEN_KB }));
      })
      .catch(function(err){
        console.warn('[WANGZHEN_KB] 加载失败:', err.message);
        window.WANGZHEN_KB.loaded = false;
        window.WANGZHEN_KB.error = err.message;
        window.dispatchEvent(new CustomEvent('wangzhen-kb-error', { detail: err }));
      });
  } else {
    // fetch 不可用（file:// 协议等），尝试 XHR
    try {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', KB_URL, true);
      xhr.onreadystatechange = function(){
        if(xhr.readyState === 4){
          if(xhr.status === 200){
            var data = JSON.parse(xhr.responseText);
            window.WANGZHEN_KB = parseKB(data);
            console.warn('[WANGZHEN_KB] XHR 加载', window.WANGZHEN_KB.stats.total, '条');
            window.dispatchEvent(new CustomEvent('wangzhen-kb-loaded', { detail: window.WANGZHEN_KB }));
          } else {
            console.warn('[WANGZHEN_KB] XHR 状态:', xhr.status);
            window.dispatchEvent(new CustomEvent('wangzhen-kb-error', { detail: xhr.status }));
          }
        }
      };
      xhr.send();
    } catch(e){
      console.warn('[WANGZHEN_KB] XHR 失败:', e.message);
    }
  }
})();
