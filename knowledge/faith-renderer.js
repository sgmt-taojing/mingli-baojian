// 易道智鉴 · 信众板块渲染引擎 v2.0
// 依赖: faith-knowledge-base.js
// 版本：2026.06.15

(function() {
  'use strict';

  // ===== 全局变量别名映射 =====
  let FK = window.FAITH_KNOWLEDGE || {};
  let SD = window.SCRIPTURE_DATABASE || { getById: function(){return null;} };
  // VR (VoiceReader) 在 voice-reader.js 中导出，延迟引用

  const COLORS = {
    ru:  { main: '#c0392b', bg: 'rgba(192,57,43,0.12)',  border: 'rgba(192,57,43,0.3)',  label: '儒家' },
    dao: { main: '#8e44ad', bg: 'rgba(142,68,173,0.12)', border: 'rgba(142,68,173,0.3)', label: '道家' },
    fo:  { main: '#e67e22', bg: 'rgba(230,126,34,0.12)', border: 'rgba(230,126,34,0.3)', label: '佛家' }
  };

  const MODULES = [
    { id: 'deities',    icon: '🙏', label: '神仙殿堂' },
    { id: 'scriptures', icon: '📖', label: '经典经文' },
    { id: 'mantras',   icon: '📿', label: '咒语口诀' },
    { id: 'taboos',    icon: '⚠️', label: '禁忌须知' },
    { id: 'worship',   icon: '🕯️', label: '参拜指导' },
    { id: 'auspicious',icon: '📅', label: '吉日选择' },
    { id: 'birthday',  icon: '🎂', label: '诞辰节日' },
    { id: 'temple',    icon: '🏛️', label: '参拜攻略' },
    { id: 'practice',  icon: '📋', label: '每日功课' },
    { id: 'fitness',   icon: '🧘', label: '健身导引' },
    { id: 'health',    icon: '🍵', label: '养生妙法' },
    { id: 'remedy',    icon: '🌿', label: '药方妙法' }
  ];

  let _currentFaith = null;
  let _currentModule = 'deities';

  // ================================================================
  // 覆盖 window.showFaithDetail — 首次打开即渲染
  // ================================================================
  window.renderFaithPanelFromSelect = function(faith) {
    console.log('[DEBUG] renderFaithPanelFromSelect 被调用, faith=' + faith);
    console.log('[DEBUG] window.FAITH_KNOWLEDGE exists:', !!window.FAITH_KNOWLEDGE);
    console.log('[DEBUG] FK exists:', !!FK);
    
    // 重新获取 FK，确保数据已加载
    if (!FK && window.FAITH_KNOWLEDGE) {
      FK = window.FAITH_KNOWLEDGE;
      console.log('[DEBUG] FK reloaded from window.FAITH_KNOWLEDGE');
    }
    
    _currentFaith = faith;
    _currentModule = 'deities'; // 默认打开"神仙殿堂"

    let container = document.getElementById('faithContent');
    if (!container) { console.log('[DEBUG] faithContent 不存在!'); return; }
    container.style.display = 'block'; // 确保容器可见
    console.log('[DEBUG] faithContent 存在，开始渲染...');

    ['ru','dao','fo'].forEach(function(f){
      let panel = document.getElementById('faith-detail-' + f);
      if (panel) panel.style.display = 'none';
    });

    // Fallback: 'all' 时默认显示佛学
    let effectiveFaith = (faith === 'all') ? 'fo' : faith;
    let panel = document.getElementById('faith-detail-' + effectiveFaith);
    if (!panel) return;
    panel.style.display = 'block';

    // 首次渲染
    renderFullPanel(panel, faith);

    if (typeof loadMeritRecord === 'function') loadMeritRecord(faith);
    container.scrollTop = 0;
  };

  // ================================================================
  // 完整面板渲染
  // ================================================================
  function renderFullPanel(panel, faith) {
    let col = COLORS[faith];

    // 检查是否已渲染过动态内容区
    let existingWrap = document.getElementById('faith-dynamic-wrap-' + faith);
    if (existingWrap) {
      // 已存在，只更新导航和内容
      renderFullPanel_reloadNav(panel, faith);
      renderModuleContent(panel, faith, _currentModule);
      return;
    }

    // 首次渲染：在面板末尾添加动态内容区（不清空原有静态内容）
    let dynamicWrap = document.createElement('div');
    dynamicWrap.id = 'faith-dynamic-wrap-' + faith;
    dynamicWrap.style.cssText = 'padding:0 0 24px;margin-top:20px;border-top:1px solid ' + col.border + ';padding-top:20px';

    // 信仰标识
    let title = document.createElement('div');
    title.style.cssText = 'text-align:center;margin:16px 0 8px';
    title.innerHTML = '<span style="font-size:24px">' + {ru:'📚',dao:'☯️',fo:'🪷'}[faith] + '</span><br><span style="font-size:16px;font-family:\'Ma Shan Zheng\',serif;color:' + col.main + ';letter-spacing:4px">' + col.label + '</span>';
    dynamicWrap.appendChild(title);

    // 模块导航
    let nav = document.createElement('div');
    nav.id = 'faith-nav-' + faith;
    nav.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:12px;background:' + col.bg + ';border-radius:12px;margin:0 16px 16px;border:1px solid ' + col.border;
    MODULES.forEach(function(mod) {
      let btn = document.createElement('button');
      let isActive = mod.id === _currentModule;
      btn.style.cssText = 'padding:7px 12px;border-radius:8px;border:1px solid ' + col.border + ';background:' + (isActive ? col.main : 'rgba(255,255,255,0.04)') + ';color:' + (isActive ? '#fff' : col.main) + ';font-size:11px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:3px;min-height:36px';
      btn.textContent = mod.icon + ' ' + mod.label;
      btn.onclick = (function(mid) {
        return function() {
          _currentModule = mid;
          renderFullPanel_reloadNav(panel, faith);
          renderModuleContent(panel, faith, mid);
        };
      })(mod.id);
      nav.appendChild(btn);
    });
    dynamicWrap.appendChild(nav);

    // 内容区
    let content = document.createElement('div');
    content.id = 'faith-module-wrap-' + faith;
    content.style.cssText = 'padding:0 16px;animation:fadeUp .4s ease';
    dynamicWrap.appendChild(content);

    panel.appendChild(dynamicWrap);

    // 渲染默认内容
    renderModuleContent(panel, faith, _currentModule);
  }

  function renderFullPanel_reloadNav(panel, faith) {
    let nav = document.getElementById('faith-nav-' + faith);
    if (!nav) return;
    let col = COLORS[faith];
    nav.innerHTML = '';
    MODULES.forEach(function(mod) {
      let btn = document.createElement('button');
      let isActive = mod.id === _currentModule;
      btn.style.cssText = 'padding:7px 12px;border-radius:8px;border:1px solid ' + col.border + ';background:' + (isActive ? col.main : 'rgba(255,255,255,0.04)') + ';color:' + (isActive ? '#fff' : col.main) + ';font-size:11px;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:3px;min-height:36px';
      btn.textContent = mod.icon + ' ' + mod.label;
      btn.onclick = (function(mid) {
        return function() {
          _currentModule = mid;
          renderFullPanel_reloadNav(panel, faith);
          renderModuleContent(panel, faith, mid);
        };
      })(mod.id);
      nav.appendChild(btn);
    });
  }

  function renderModuleContent(panel, faith, moduleId) {
    let wrap = document.getElementById('faith-module-wrap-' + faith);
    if (!wrap) return;
    wrap.innerHTML = '<div style="text-align:center;padding:24px 0"><div style="color:var(--gold);font-size:24px">⏳</div><div style="color:rgba(255,255,255,0.4);font-size:12px;margin-top:8px">加载中...</div></div>';
    // 异步加载
    setTimeout(function() {
      switch(moduleId) {
        case 'deities':   renderDeities(wrap, faith); break;
        case 'scriptures': renderScriptures(wrap, faith); break;
        case 'reader': renderScriptureReader(wrap, faith, 'heart_sutra'); break;
        case 'mantras':   renderMantras(wrap, faith); break;
        case 'taboos':    renderTaboos(wrap, faith); break;
        case 'worship':   renderWorship(wrap, faith); break;
        case 'auspicious': renderAuspicious(wrap, faith); break;
        case 'birthday':  renderBirthdayCalendar(wrap, faith); break;
        case 'temple':    renderTempleGuide(wrap, faith); break;
        case 'practice':  renderDailyPractice(wrap, faith); break;
        case 'fitness':   renderFitness(wrap, faith); break;
        case 'health':    renderHealth(wrap, faith); break;
        case 'remedy':   renderRemedy(wrap, faith); break;
        default: wrap.innerHTML = '<p style="text-align:center;opacity:.4">模块开发中...</p>';
      }
    }, 50);
  }

  // ================================================================
  // 模块1：神仙殿堂 — 默认首屏，大卡片展示22位神仙
  // ================================================================
  function renderDeities(el, faith) {
    // 强制重新获取数据
    if (!FK || Object.keys(FK).length === 0) {
      if (window.FAITH_KNOWLEDGE && Object.keys(window.FAITH_KNOWLEDGE).length > 0) {
        FK = window.FAITH_KNOWLEDGE;
        console.log('[OK] FK recovered in renderDeities');
      }
    }
    
    if (!FK || Object.keys(FK).length === 0) {
      el.innerHTML = '<div style="text-align:center;padding:40px 20px"><div style="font-size:32px;margin-bottom:12px">🙏</div><div style="color:rgba(255,255,255,0.4);font-size:13px">知识库加载中，请稍候...</div></div>';
      return;
    }

    let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
    console.log('[DEBUG] faithKey:', faithKey);
    console.log('[DEBUG] FK.deities[faithKey]:', FK.deities ? FK.deities[faithKey] : 'N/A');
    console.log('[DEBUG] FK.deities[faithKey] length:', FK.deities && FK.deities[faithKey] ? FK.deities[faithKey].length : 'undefined');
    
    let deities = (FK.deities && FK.deities[faithKey]) ? FK.deities[faithKey] : [];
    let col = COLORS[faith];
    let faithLabel = {fo:'佛', dao:'道', ru:'儒'}[faith] || '本';

    el.innerHTML = '<div style="text-align:center;margin-bottom:16px">' +
      '<div style="font-size:13px;opacity:.4">共收录</div>' +
      '<div style="font-size:28px;font-weight:bold;color:' + col.main + ';font-family:Ma Shan Zheng,serif;letter-spacing:4px">' + deities.length + ' <span style="font-size:14px;font-weight:normal;opacity:.6">位' + faithLabel + '教先贤</span></div>' +
      '<div style="font-size:11px;opacity:.3;margin-top:2px">神仙殿堂 · 珍藏典藏</div>' +
      '</div>';

    let grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px';

    if (!deities.length) {
      el.innerHTML += '<p style="text-align:center;opacity:.4;padding:24px">暂无数据</p>';
      return;
    }

    deities.forEach(function(d) {
      let card = document.createElement('div');
      card.style.cssText = 'background:linear-gradient(135deg,rgba(255,255,255,0.05),rgba(0,0,0,0.1));border:1px solid ' + col.border + ';border-radius:14px;overflow:hidden;transition:all .3s;cursor:pointer';

      // 头部：圣像区
      let emojiMap = {
        '释迦牟尼佛':'🙏','观世音':'🕊️','文殊':'📚','普贤':'🌺','地藏':'🌑','弥勒佛':'😄',
        '韦陀':'⚔️','药师佛':'💊','太上老君':'☯️','玉皇大帝':'👑','王母娘娘':'🌸',
        '太乙救苦天尊':'🌟','真武大帝':'🐢','关圣帝君':'⚔️','文昌帝君':'📖',
        '财神赵公明':'💰','土地公':'🏠','月老':'💍','东岳大帝':'⛰️','八仙':'✈️',
        '至圣先师孔子':'🎓','亚圣孟子':'📜'
      };
      let emoji = emojiMap[d.name] || '✨';
      let gradientBg = faith === 'fo' ? 'linear-gradient(135deg,#e67e22,#c0392b)' : faith === 'dao' ? 'linear-gradient(135deg,#8e44ad,#2980b9)' : 'linear-gradient(135deg,#c0392b,#8e44ad)';

      let headerHtml =
        '<div style="background:' + gradientBg + ';padding:18px 16px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,0.1)">' +
          '<div style="width:52px;height:52px;border-radius:50%;overflow:hidden;flex-shrink:0;border:2px solid rgba(255,255,255,0.3)">' +
            (d.portrait ?
              '<img src="' + d.portrait + '" style="width:100%;height:100%;object-fit:cover" data-emoji="' + emoji + '" onerror="let e=this.getAttribute(&#39;data-emoji&#39;);this.parentNode.innerHTML=e;this.parentNode.style.cssText=&#39;width:52px;height:52px;background:rgba(255,255,255,0.2);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;flex-shrink:0;border:none&#39;}">' :
              '<div style="width:100%;height:100%;background:rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:28px">' + emoji + '</div>') +
          '</div>' +
          '<div style="min-width:0;flex:1">' +
            '<div style="font-size:16px;font-weight:bold;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + d.name + '</div>' +
            '<div style="font-size:10px;opacity:.7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px">' + (d.alias && d.alias.length ? d.alias.slice(0,3).join(' · ') : '') + '</div>' +
            '<div style="font-size:10px;color:rgba(255,255,255,0.7);margin-top:2px">🎂 ' + d.birthday + '</div>' +
          '</div>' +
        '</div>';

      // 媒体入口
      let mediaBar = '';
      if (d.image || d.music || d.video) {
        mediaBar = '<div style="display:flex;gap:6px;padding:10px 16px;background:rgba(0,0,0,0.15)">';
        if (d.image) mediaBar += '<a href="' + d.image + '" target="_blank" class="media-btn" style="flex:1;text-align:center;padding:5px 8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-size:10px;color:rgba(255,255,255,0.55);text-decoration:none;transition:all .2s">🖼 图片</a>';
        if (d.music) mediaBar += '<a href="#" onclick="playFaithMusic(\'' + encodeURIComponent(d.music) + '\');return false" class="media-btn" style="flex:1;text-align:center;padding:5px 8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-size:10px;color:rgba(255,255,255,0.55);text-decoration:none;cursor:pointer;transition:all .2s">🎵 音乐</a>';
        if (d.video) mediaBar += '<a href="' + d.video + '" target="_blank" class="media-btn" style="flex:1;text-align:center;padding:5px 8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;font-size:10px;color:rgba(255,255,255,0.55);text-decoration:none;transition:all .2s">🎬 视频</a>';
        mediaBar += '</div>';
      }

      // 职能简介
      let responsibilities = Array.isArray(d.responsibilities) ? d.responsibilities.join(' · ') : (d.responsibilities || '');
      let introHtml = responsibilities ?
        '<div style="padding:10px 16px;font-size:11px;color:' + col.main + ';opacity:.85;line-height:1.6">' + responsibilities + '</div>' : '';

      // 详情折叠 — 优先使用 DEITIES_DETAIL 丰富数据
      let DD = window.DEITIES_DETAIL || {};
      let ddKey = faithKey; // buddhist / taoist / confucian
      let dd = DD[ddKey] && DD[ddKey][d.name] ? DD[ddKey][d.name] : null;

      let detailsInner = '';
      // 基础信息
      if (d.offerings && d.offerings.length) detailsInner += '<div><span style="font-size:11px;color:' + col.main + ';font-weight:bold">🎁 供奉：</span><span style="font-size:11px;opacity:.7">' + d.offerings.join('、') + '</span></div>';
      if (d.worshipMethod) detailsInner += '<div><span style="font-size:11px;color:' + col.main + ';font-weight:bold">🙏 供奉方法：</span><span style="font-size:11px;opacity:.7;line-height:1.6">' + d.worshipMethod + '</span></div>';
      if (d.taboo && d.taboo.length) detailsInner += '<div><span style="font-size:11px;color:#e74c3c;font-weight:bold">⚠️ 禁忌：</span><span style="font-size:11px;opacity:.7">' + d.taboo.join('、') + '</span></div>';
      if (d.merit) detailsInner += '<div><span style="font-size:11px;color:#27ae60;font-weight:bold">🌟 功德：</span><span style="font-size:11px;opacity:.7">' + d.merit + '</span></div>';

      // 丰富数据（来自 DEITIES_DETAIL）
      if (dd) {
        // 传记
        if (dd.biography) detailsInner += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)"><span style="font-size:11px;color:' + col.main + ';font-weight:bold">📜 传记：</span><div style="font-size:11px;opacity:.7;line-height:1.8;margin-top:4px;text-indent:2em">' + dd.biography + '</div></div>';

        // 感应故事
        if (dd.miracles && dd.miracles.length) {
          detailsInner += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)"><span style="font-size:11px;color:' + col.main + ';font-weight:bold">✨ 感应故事</span>';
          dd.miracles.forEach(function(m) {
            detailsInner += '<div style="margin-top:6px"><div style="font-size:11px;font-weight:bold;opacity:.8">' + m.title + '</div><div style="font-size:10px;opacity:.65;line-height:1.7;margin-top:2px">' + m.story + '</div></div>';
          });
          detailsInner += '</div>';
        }

        // 参拜详法
        if (dd.worshipDetail) {
          let wd = dd.worshipDetail;
          detailsInner += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)"><span style="font-size:11px;color:' + col.main + ';font-weight:bold">🕯️ 参拜详法</span>';
          if (wd.bestTime) detailsInner += '<div style="font-size:10px;opacity:.7;margin-top:4px"><b>最佳时间：</b>' + wd.bestTime + '</div>';
          if (wd.steps && wd.steps.length) {
            detailsInner += '<div style="font-size:10px;opacity:.7;margin-top:4px"><b>参拜步骤：</b><ol style="margin:4px 0 0 16px;padding:0">';
            wd.steps.forEach(function(s) { detailsInner += '<li style="margin-bottom:2px">' + s + '</li>'; });
            detailsInner += '</ol></div>';
          }
          if (wd.offerings) detailsInner += '<div style="font-size:10px;opacity:.7;margin-top:4px"><b>供品推荐：</b>' + wd.offerings + '</div>';
          if (wd.mantra) detailsInner += '<div style="font-size:10px;opacity:.7;margin-top:4px"><b>🪷 咒语/真言：</b>' + wd.mantra + '</div>';
          detailsInner += '</div>';
        }

        // 祈请文
        if (dd.prayer) detailsInner += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)"><span style="font-size:11px;color:' + col.main + ';font-weight:bold">🙏 祈请文</span><div style="font-size:10px;opacity:.7;line-height:1.8;margin-top:4px;padding:8px;background:rgba(255,255,255,0.03);border-radius:8px;font-style:italic">' + dd.prayer + '</div></div>';

        // 相关寺庙
        if (dd.relatedTemples && dd.relatedTemples.length) {
          detailsInner += '<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)"><span style="font-size:11px;color:' + col.main + ';font-weight:bold">🏛️ 朝圣寺庙</span>';
          dd.relatedTemples.forEach(function(t) {
            detailsInner += '<div style="font-size:10px;opacity:.7;margin-top:4px"><b>' + t.name + '</b>（' + t.location + '）— ' + t.note + '</div>';
          });
          detailsInner += '</div>';
        }
      }

      let detailsHtml =
        '<details style="padding:0 16px 14px">' +
          '<summary style="font-size:11px;color:' + col.main + ';cursor:pointer;font-weight:bold;padding:8px 0;opacity:.7">▸ 展开详情</summary>' +
          '<div style="margin-top:10px;display:grid;gap:8px;animation:fadeUp .3s ease">' +
            detailsInner +
          '</div>' +
        '</details>';

      card.innerHTML = headerHtml + mediaBar + introHtml + detailsHtml;

      card.onmouseenter = function() {
        this.style.borderColor = col.main;
        this.style.transform = 'translateY(-2px)';
        this.style.boxShadow = '0 8px 24px rgba(0,0,0,0.3)';
      };
      card.onmouseleave = function() {
        this.style.borderColor = col.border;
        this.transform = '';
        this.style.boxShadow = '';
      };

      grid.appendChild(card);
    });

    el.appendChild(grid);
  }

  // ================================================================
  // 模块2：经典经文（新版——使用SCRIPTURE_DATABASE，支持朗读）
  // ================================================================
  function renderScriptures(el, faith) {
    let SD = window.SCRIPTURE_DATABASE;
    if (!SD) { 
      el.innerHTML = '<p style="text-align:center;opacity:.4">经书数据库加载中...</p>'; 
      return; 
    }
    let col = COLORS[faith];
    let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
    let catName = {fo:'佛教', dao:'道教', ru:'儒家'}[faith] || '';
    let scriptures = (SD[faithKey] || []).filter(function(s) {
      return s.type !== '密教部'; // 大悲咒等在口诀模块展示
    });
    // 如果过滤后为空，返回全部
    if (!scriptures.length) scriptures = SD[faithKey] || [];

    el.innerHTML = '<div style="text-align:center;margin-bottom:12px">' +
      '<h3 style="color:' + col.main + ';text-align:center;margin:0;font-family:\'Ma Shan Zheng\',serif;font-size:20px;letter-spacing:4px">📖 ' + catName + '经典经文</h3>' +
      '<div style="font-size:11px;opacity:.4;margin-top:4px">点击卡片进入全文朗读模式 · 支持语音伴读</div>' +
      '</div>';

    let grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px';

    scriptures.forEach(function(s) {
      let card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.04);border:1px solid ' + col.border + ';border-radius:12px;overflow:hidden;cursor:pointer;transition:.2s';
      card.onmouseenter = function() { card.style.transform = 'translateY(-2px)'; card.style.boxShadow = '0 4px 20px rgba(0,0,0,.3)'; };
      card.onmouseleave = function() { card.style.transform = 'none'; card.style.boxShadow = 'none'; };
      card.onclick = function() { renderScriptureReader(el, faith, s.id); };

      card.innerHTML =
        '<div style="padding:14px 16px;display:flex;align-items:center;gap:10px">' +
          '<span style="font-size:30px">📖</span>' +
          '<div style="flex:1">' +
            '<div style="font-size:15px;font-weight:bold;color:' + col.main + '">' + s.name + '</div>' +
            '<div style="font-size:10px;opacity:.4;margin-top:2px">' + (s.fullName || '') + '</div>' +
          '</div>' +
          '<span style="font-size:11px;opacity:.4;white-space:nowrap">' + (s.length ? s.length + '字' : '') + '</span>' +
        '</div>' +
        '<div style="padding:0 16px 10px;font-size:12px;opacity:.7;line-height:1.7;min-height:30px">' +
          (s.description ? s.description.slice(0, 100) + (s.description.length > 100 ? '…' : '') : '') +
        '</div>' +
        (s.audioDuration ? '<div style="padding:6px 16px 12px;font-size:10px;opacity:.3">🎙️ 语速朗读约' + s.audioDuration + '</div>' : '') +
        '<div style="background:rgba(255,255,255,0.03);padding:8px 16px;display:flex;gap:8px;flex-wrap:wrap">' +
          '<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:' + col.main + '22;color:' + col.main + '">' + (s.type || catName) + '</span>' +
          (s.benefits && s.benefits.length ? '<span style="font-size:10px;padding:2px 8px;border-radius:6px;background:#27ae6022;color:#27ae60">🌟 ' + s.benefits[0] + '</span>' : '') +
        '</div>';

      grid.appendChild(card);
    });

    el.appendChild(grid);
  }

  // ================================================================
  // 经文朗读器（带拼音+语音伴读）
  // ================================================================
  function renderScriptureReader(el, faith, scriptureId) {
    let SD = window.SCRIPTURE_DATABASE;
    let VR = window.VoiceReader;
    if (!SD || !scriptureId) { el.innerHTML = '<p style="text-align:center;opacity:.4">经书未找到</p>'; return; }

    let s = SD.getById(scriptureId);
    if (!s) { el.innerHTML = '<p style="text-align:center;opacity:.4">经书未找到 (id: ' + scriptureId + ')</p>'; return; }

    let col = COLORS[faith];
    let hasPinyin = s.sections && s.sections.length > 0;
    let hasFullText = s.fullText && s.fullText.length > 0;

    // 容器
    el.innerHTML = '';

    // ---- 顶部导航 - 返回 - 标题 - 语音控制 ----
    let header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;gap:10px;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid ' + col.border;
    header.innerHTML = 
      '<span onclick="renderScriptures(faithContent, currentFaith)" style="cursor:pointer;font-size:22px;opacity:.6;hover:opacity:1" title="返回经书列表">⬅</span>' +
      '<div style="flex:1">' +
        '<div style="font-size:17px;font-weight:bold;color:' + col.main + '">' + s.name + '</div>' +
        '<div style="font-size:10px;opacity:.4">' + (s.fullName || '') + ' · ' + (s.translator || s.author || '') + '</div>' +
      '</div>' +
      '<span style="font-size:11px;opacity:.4">' + (s.length ? s.length + '字' : '') + '</span>';
    el.appendChild(header);

    // ---- 语音控制条 ----
    let voiceBar = document.createElement('div');
    voiceBar.style.cssText = 'background:rgba(0,0,0,.3);border:1px solid ' + col.border + ';border-radius:10px;padding:10px 14px;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap';
    
    let vc = {
      playBtn: '<span id="vrPlayBtn" style="cursor:pointer;font-size:24px;padding:4px 8px;border-radius:6px;background:' + col.main + '22" onclick="window.__vrTogglePlay()">▶</span>',
      prevBtn: '<span style="cursor:pointer;font-size:16px;opacity:.5" onclick="window.__vrPrev()">⏮</span>',
      nextBtn: '<span style="cursor:pointer;font-size:16px;opacity:.5" onclick="window.__vrNext()">⏭</span>',
      stopBtn: '<span style="cursor:pointer;font-size:16px;opacity:.5" onclick="window.__vrStop()">⏹</span>',
      speedCtrl: 
        '<select id="vrSpeed" style="background:#222;border:1px solid #444;border-radius:4px;color:#aaa;font-size:11px;padding:2px 4px" onchange="window.__vrSetSpeed(this.value)">' +
          '<option value="0.5">0.5x</option>' +
          '<option value="0.75">0.75x</option>' +
          '<option value="1" selected>1.0x</option>' +
          '<option value="1.25">1.25x</option>' +
          '<option value="1.5">1.5x</option>' +
          '<option value="2">2.0x</option>' +
        '</select>',
      loopCtrl:
        '<select id="vrLoop" style="background:#222;border:1px solid #444;border-radius:4px;color:#aaa;font-size:11px;padding:2px 4px" onchange="window.__vrSetLoop(this.value)">' +
          '<option value="none">不循环</option>' +
          '<option value="all">循环全文</option>' +
          '<option value="single">循环单句</option>' +
        '</select>',
      timerCtrl: '<span style="cursor:pointer;font-size:14px;opacity:.5" onclick="window.__vrSetTimer()">⏰</span>'
    };

    voiceBar.innerHTML = 
      '<span style="font-size:12px;opacity:.6">🎙️ 语音伴读</span>' +
      vc.prevBtn + vc.playBtn + vc.nextBtn + vc.stopBtn +
      '<span style="flex:1;min-width:20px"></span>' +
      '<span style="font-size:11px;opacity:.4">语速</span>' + vc.speedCtrl +
      '<span style="font-size:11px;opacity:.4">循环</span>' + vc.loopCtrl +
      vc.timerCtrl +
      '<span id="vrStatus" style="font-size:10px;opacity:.3;width:100%;text-align:center;margin-top:2px">已就绪 · 共' + (hasPinyin ? s.sections.length : '1') + '段</span>';
    el.appendChild(voiceBar);

    // ---- 经书描述 ----
    let desc = document.createElement('div');
    desc.style.cssText = 'font-size:12px;opacity:.7;line-height:1.8;margin-bottom:14px;padding:10px 14px;background:rgba(255,255,255,0.02);border-radius:8px';
    desc.innerHTML = (s.description || '') + 
      (s.recitationMethod ? '<br><br><span style="color:' + col.main + '">🧘 诵持方法：</span>' + s.recitationMethod : '') +
      (s.benefits && s.benefits.length ? '<br><span style="color:#27ae60">🌟 功德利益：</span>' + s.benefits.join('、') : '');
    el.appendChild(desc);

    // ---- 正文 - 带拼音的逐句显示 ----
    let textArea = document.createElement('div');
    textArea.id = 'scriptureTextArea';
    textArea.style.cssText = 'line-height:2.2;font-size:16px;padding:14px;background:rgba(0,0,0,.15);border-radius:8px;border:1px solid rgba(255,255,255,0.05);max-height:400px;overflow-y:auto';

    if (hasPinyin) {
      // 逐句显示，拼音在上，汉字在下
      s.sections.forEach(function(sec, i) {
        let line = document.createElement('div');
        line.id = 'vrLine_' + i;
        line.style.cssText = 'padding:6px 10px;margin:2px 0;border-radius:6px;transition:.2s;cursor:pointer';
        line.onclick = function() { window.__vrJump(i); };
        line.innerHTML = 
          '<div style="font-size:12px;opacity:.5;letter-spacing:1px;line-height:1.6">' + (sec.py || '') + '</div>' +
          '<div style="font-size:17px;color:' + col.main + ';letter-spacing:2px">' + sec.cn + '</div>';
        textArea.appendChild(line);
      });
    } else if (hasFullText) {
      let fullDiv = document.createElement('div');
      fullDiv.style.cssText = 'font-size:15px;line-height:2;letter-spacing:1px;white-space:pre-wrap;color:' + col.main;
      fullDiv.textContent = s.fullText;
      textArea.appendChild(fullDiv);
    } else {
      textArea.innerHTML = '<p style="text-align:center;opacity:.3">暂无全文数据</p>';
    }
    el.appendChild(textArea);

    // ---- 注册语音回调 ----
    if (VR && hasPinyin) {
      VR.setFromScripture(s.sections);
      VR.setOnHighlight(function(idx) {
        // 高亮当前句
        let all = textArea.querySelectorAll('[id^="vrLine_"]');
        all.forEach(function(l) {
          l.style.background = 'transparent';
          l.style.borderLeft = '2px solid transparent';
        });
        let cur = document.getElementById('vrLine_' + idx);
        if (cur) {
          cur.style.background = 'rgba(255,215,0,0.08)';
          cur.style.borderLeft = '2px solid ' + col.main;
          cur.scrollIntoView({block: 'nearest', behavior: 'smooth'});
        }
        // 更新状态
        let st = document.getElementById('vrStatus');
        if (st) st.textContent = '正在朗读第 ' + (idx+1) + '/' + s.sections.length + ' 句';
      });
      VR.setOnStateChange(function(state) {
        let btn = document.getElementById('vrPlayBtn');
        if (btn) {
          btn.innerHTML = state.playing && !state.paused ? '⏸' : '▶';
        }
        let st = document.getElementById('vrStatus');
        if (st) {
          if (state.playing && !state.paused) st.textContent = '🔊 播放中 · 第' + (state.index+1) + '/' + state.total + '句';
          else if (state.paused) st.textContent = '⏸ 已暂停 · 第' + (state.index+1) + '/' + state.total + '句';
          else st.textContent = '已就绪 · 共' + state.total + '段';
        }
      });
      
      // 注册全局控制函数
      window.__vrTogglePlay = function() {
        let st = VR.getStatus();
        if (st.playing && !st.paused) VR.pause();
        else VR.play();
      };
      window.__vrPrev = function() { VR.prev(); };
      window.__vrNext = function() { VR.next(); };
      window.__vrStop = function() { VR.stop(); };
      window.__vrSetSpeed = function(v) { VR.setSpeed(parseFloat(v)); };
      window.__vrSetLoop = function(v) { VR.setLoopMode(v); };
      window.__vrSetTimer = function() {
        let mins = prompt('设置语音自动停止时间（分钟），0=取消：', '30');
        if (mins !== null) {
          mins = parseInt(mins) || 0;
          if (mins > 0) {
            VR.setTimer(mins, function() { alert('⏰ 定时播放已结束'); });
            let st = document.getElementById('vrStatus');
            if (st) st.textContent += ' · ⏰ ' + mins + '分钟后停止';
          } else {
            VR.clearTimer();
          }
        }
      };
      window.__vrJump = function(idx) { VR.jumpTo(idx); };
    } else if (!hasPinyin) {
      // 无拼音标注时提示
      let st = document.getElementById('vrStatus');
      if (st) st.textContent = '该经书暂未标注拼音，语音功能不可用';
    } else {
      let st = document.getElementById('vrStatus');
      if (st) st.textContent = '⚠️ 浏览器不支持语音合成，请使用Chrome或Safari';
    }

    // 保存信仰类型供返回使用
    window.currentFaith = faith;
    window.faithContent = el;
  }

  // ================================================================
  // 模块3：咒语口诀
  // ================================================================
  function renderMantras(el, faith) {
    if (!FK) { el.innerHTML = '<p style="text-align:center;opacity:.4">知识库加载中...</p>'; return; }

    let col = COLORS[faith];
    el.innerHTML = '<h3 style="color:' + col.main + ';text-align:center;margin-bottom:16px;font-family:\'Ma Shan Zheng\',serif;font-size:20px;letter-spacing:4px">' + col.label + '咒语口诀</h3>';

    let list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:12px';

    // 信仰专属口诀
    let faithKey = faith === 'fo' ? 'buddhist' : 'taoist';
    let mantras = (FK.mantras && FK.mantras[faithKey]) ? FK.mantras[faithKey] : [];

    mantras.forEach(function(m) {
      let card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid ' + col.border + ';border-radius:12px;overflow:hidden';

      // 音乐按钮
      let musicBtn = '';
      if (m.music) {
        musicBtn = '<a href="#" onclick="playFaithMusic(\'' + encodeURIComponent(m.music) + '\');return false" style="display:inline-block;margin-top:8px;padding:4px 12px;background:' + col.bg + ';border:1px solid ' + col.border + ';border-radius:6px;font-size:10px;color:' + col.main + ';text-decoration:none">🎵 听诵读</a>';
      }

      card.innerHTML =
        '<div style="padding:14px 16px">' +
          '<div style="font-size:14px;font-weight:bold;color:' + col.main + ';margin-bottom:8px">📿 ' + m.name + '</div>' +
          '<div style="padding:12px 14px;background:rgba(0,0,0,0.2);border-radius:8px;line-height:2.2;letter-spacing:1px;text-align:center;font-family:\'Ma Shan Zheng\',serif;font-size:14px;color:rgba(255,255,255,0.85);margin-bottom:8px">' + m.mantra + '</div>' +
          '<div style="font-size:11px;opacity:.6;line-height:1.6"><b>用途：</b>' + (m.purpose || '') + '</div>' +
          '<div style="font-size:11px;opacity:.6;line-height:1.6;margin-top:4px"><b>持诵：</b>' + (m.usage || '') + '</div>' +
          musicBtn +
        '</div>';

      list.appendChild(card);
    });

    // 生活口诀（共用）
    let lifeMantras = (FK.mantras && FK.mantras.lifeMantras) ? FK.mantras.lifeMantras : [];
    if (lifeMantras.length) {
      let section = document.createElement('div');
      section.style.cssText = 'margin-top:20px;padding-top:16px;border-top:1px solid ' + col.border;
      section.innerHTML = '<h4 style="color:' + col.main + ';margin-bottom:12px;font-size:13px;font-weight:bold">🧩 生活口诀（各教通用）</h4>';
      lifeMantras.forEach(function(m) {
        section.innerHTML +=
          '<div style="background:rgba(255,255,255,0.03);border:1px solid ' + col.border + ';border-radius:8px;padding:12px;margin-bottom:10px">' +
            '<div style="font-size:11px;font-weight:bold;color:' + col.main + ';margin-bottom:6px">🎯 ' + m.scenario + '</div>' +
            '<div style="font-size:13px;line-height:1.8;padding:8px 10px;background:rgba(0,0,0,0.15);border-radius:6px;font-family:\'Ma Shan Zheng\',serif;letter-spacing:1px">' + m.mantra + '</div>' +
            '<div style="font-size:11px;opacity:.5;margin-top:6px"><b>用途：</b>' + (m.purpose || '') + ' · <b>方法：</b>' + (m.usage || '') + '</div>' +
          '</div>';
      });
      list.appendChild(section);
    }

    el.appendChild(list);
  }

  // ================================================================
  // 模块4：禁忌须知
  // ================================================================
  function renderTaboos(el, faith) {
    // 强制重新获取数据，防止闭包捕获空值
    if (!FK || Object.keys(FK).length === 0) {
      if (window.FAITH_KNOWLEDGE && Object.keys(window.FAITH_KNOWLEDGE).length > 0) {
        FK = window.FAITH_KNOWLEDGE;
        console.log('[OK] FK recovered from window.FAITH_KNOWLEDGE');
      }
    }
    
    if (!FK || Object.keys(FK).length === 0) {
      el.innerHTML = '<div style="text-align:center;padding:40px 20px"><div style="font-size:32px;margin-bottom:12px">📋</div><div style="color:rgba(255,255,255,0.4);font-size:13px">信众知识库加载中，请稍候刷新重试...</div></div>';
      console.error('[ERROR] FK still empty after recovery attempt');
      console.error('window.FAITH_KNOWLEDGE keys:', window.FAITH_KNOWLEDGE ? Object.keys(window.FAITH_KNOWLEDGE) : 'N/A');
      return;
    }

    let col = COLORS[faith];
    el.innerHTML = '<h3 style="color:' + col.main + ';text-align:center;margin-bottom:16px;font-family:\'Ma Shan Zheng\',serif;font-size:20px;letter-spacing:4px">' + col.label + '禁忌须知</h3>';

    let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
    console.log('[DEBUG] faithKey:', faithKey);
    console.log('[DEBUG] FK.taboos[faithKey]:', FK.taboos ? FK.taboos[faithKey] : 'N/A');
    
    let allTaboos = [];
    if (FK.taboos && FK.taboos[faithKey]) allTaboos = allTaboos.concat(FK.taboos[faithKey]);
    if (FK.taboos && FK.taboos.general) allTaboos = allTaboos.concat(FK.taboos.general);
    
    console.log('[DEBUG] allTaboos length:', allTaboos.length);

    let grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px';
    
    if (!allTaboos.length) {
      el.innerHTML += '<p style="text-align:center;opacity:.4;padding:24px">暂无禁忌数据</p>';
      return;
    }

    allTaboos.forEach(function(cat) {
      let card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid ' + col.border + ';border-radius:10px;overflow:hidden';
      card.innerHTML =
        '<div style="padding:12px 16px;font-size:13px;font-weight:bold;color:' + col.main + ';border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.1)">⚠️ ' + cat.category + '</div>' +
        '<ul style="list-style:none;padding:0;margin:0">' +
          (cat.items || []).map(function(item) {
            return '<li style="font-size:12px;padding:8px 16px;border-bottom:1px solid rgba(255,255,255,0.03);opacity:.75;line-height:1.5">❌ ' + item + '</li>';
          }).join('') +
        '</ul>';
      grid.appendChild(card);
    });

    el.appendChild(grid);
  }

  // ================================================================
  // 模块5：参拜指导
  // ================================================================
  function renderWorship(el, faith) {
    if (!FK) { el.innerHTML = '<p style="text-align:center;opacity:.4">知识库加载中...</p>'; return; }

    let col = COLORS[faith];
    let guide = FK.worshipGuide || {};
    el.innerHTML = '<h3 style="color:' + col.main + ';text-align:center;margin-bottom:16px;font-family:\'Ma Shan Zheng\',serif;font-size:20px;letter-spacing:4px">参拜指导</h3>';

    let sections = [
      { title: '🕯️ 上香礼仪', data: guide.incense },
      { title: '🙇 跪拜礼仪', data: guide.prostration },
      { title: '🎁 供品须知', data: guide.offerings }
    ];

    sections.forEach(function(sec) {
      let card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid ' + col.border + ';border-radius:10px;overflow:hidden;margin-bottom:16px';

      let inner = '<div style="padding:12px 16px;font-size:13px;font-weight:bold;color:' + col.main + ';border-bottom:1px solid rgba(255,255,255,0.05);background:rgba(0,0,0,0.1)">' + sec.title + '</div><div style="padding:14px 16px">';

      if (sec.data && sec.data.steps) {
        inner += '<ol style="padding-left:20px;margin:0">';
        (sec.data.steps || []).forEach(function(step) {
          inner += '<li style="font-size:12px;line-height:1.9;opacity:.8;padding:3px 0">' + step + '</li>';
        });
        inner += '</ol>';
        if (sec.data.notes) {
          inner += '<div style="margin-top:10px;padding:10px 12px;background:rgba(255,255,255,0.03);border-radius:6px;font-size:11px;opacity:.6"><b>💡 提示：</b>' + sec.data.notes + '</div>';
        }
      } else if (Array.isArray(sec.data)) {
        inner += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
        sec.data.forEach(function(item) {
          inner += '<span style="font-size:11px;padding:5px 10px;background:' + col.bg + ';border:1px solid ' + col.border + ';border-radius:6px;color:' + col.main + '">' + item + '</span>';
        });
        inner += '</div>';
      }

      inner += '</div>';
      card.innerHTML = inner;
      el.appendChild(card);
    });
  }

  // ================================================================
  // 模块6：吉日选择
  // ================================================================
  function renderAuspicious(el, faith) {
    if (!FK) { el.innerHTML = '<p style="text-align:center;opacity:.4">知识库加载中...</p>'; return; }

    let col = COLORS[faith];
    let ausp = FK.auspiciousDays || {};
    el.innerHTML = '<h3 style="color:' + col.main + ';text-align:center;margin-bottom:16px;font-family:\'Ma Shan Zheng\',serif;font-size:20px;letter-spacing:4px">吉日选择</h3>';

    if (ausp.daily) {
      el.innerHTML +=
        '<div style="background:' + col.bg + ';border:1px solid ' + col.border + ';border-radius:10px;padding:14px 16px;margin-bottom:16px">' +
          '<div style="font-size:12px;line-height:1.8;opacity:.85">' + (ausp.daily.description || '') + '</div>' +
          '<div style="font-size:11px;opacity:.4;margin-top:6px"><b>判断方法：</b>' + (ausp.daily.method || '') + '</div>' +
        '</div>';
    }

    let categories = ausp.categories || [];
    let grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:12px';

    categories.forEach(function(cat) {
      let card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid ' + col.border + ';border-radius:10px;padding:14px';
      card.innerHTML =
        '<div style="font-size:13px;font-weight:bold;color:' + col.main + ';margin-bottom:8px">📅 ' + (cat.event || '') + '</div>' +
        '<div style="font-size:12px;margin-bottom:4px"><b style="color:#27ae60">✅ 宜：</b><span style="opacity:.75">' + (cat.bestDays || '') + '</span></div>' +
        '<div style="font-size:12px"><b style="color:#e74c3c">❌ 忌：</b><span style="opacity:.75">' + (cat.avoid || '') + '</span></div>';
      grid.appendChild(card);
    });

    el.appendChild(grid);
  }

  // ================================================================
  // 模块7：健身导引
  // ================================================================
  function renderFitness(el, faith) {
    if (!FK) { el.innerHTML = '<p style="text-align:center;opacity:.4">知识库加载中...</p>'; return; }

    let col = COLORS[faith];
    let faithKey = faith === 'fo' ? 'buddhist' : 'taoist';
    let guides = [];
    if (FK.fitnessGuide && FK.fitnessGuide[faithKey]) guides = FK.fitnessGuide[faithKey];
    if (!guides.length && FK.fitnessGuide && FK.fitnessGuide.taoist) guides = FK.fitnessGuide.taoist;

    el.innerHTML = '<h3 style="color:' + col.main + ';text-align:center;margin-bottom:16px;font-family:\'Ma Shan Zheng\',serif;font-size:20px;letter-spacing:4px">' + col.label + '健身导引</h3>';

    guides.forEach(function(g) {
      let card = document.createElement('div');
      card.style.cssText = 'background:rgba(255,255,255,0.03);border:1px solid ' + col.border + ';border-radius:12px;overflow:hidden;margin-bottom:16px';

      let stepsHtml = '';
      if (g.steps && g.steps.length) {
        stepsHtml = '<ol style="padding-left:20px;margin:10px 0">';
        g.steps.forEach(function(step) {
          stepsHtml += '<li style="font-size:12px;line-height:1.8;opacity:.8;padding:2px 0">' + step + '</li>';
        });
        stepsHtml += '</ol>';
      }

      let benefitsHtml = '';
      if (g.benefits && g.benefits.length) {
        benefitsHtml = '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:10px">';
        g.benefits.forEach(function(b) {
          benefitsHtml += '<span style="font-size:10px;padding:3px 8px;background:' + col.bg + ';border:1px solid ' + col.border + ';border-radius:4px;color:' + col.main + '">' + b + '</span>';
        });
        benefitsHtml += '</div>';
      }

      card.innerHTML =
        '<div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:10px">' +
          '<span style="font-size:24px">🧘</span>' +
          '<div>' +
            '<div style="font-size:14px;font-weight:bold;color:' + col.main + '">' + (g.name || '') + '</div>' +
            '<div style="font-size:10px;opacity:.4">' + (g.description || '') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="padding:12px 16px">' +
          stepsHtml +
          (g.duration ? '<div style="font-size:12px;opacity:.6"><b>⏱ 时长：</b>' + g.duration + '</div>' : '') +
          benefitsHtml +
          (g.notes ? '<div style="font-size:11px;opacity:.5;margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.04)"><b>💡 注意：</b>' + g.notes + '</div>' : '') +
        '</div>';

      el.appendChild(card);
    });
  }


  // ================================================================
  // 模块8：养生妙法
  // ================================================================
  function renderHealth(el, faith) {
    if (!FK) { el.innerHTML = '<p style="text-align:center;opacity:.4">知识库加载中...</p>'; return; }
    let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
    let items = (FK.healthGuide && FK.healthGuide[faithKey]) ? FK.healthGuide[faithKey] : [];
    let col = COLORS[faith];
    let icons = {buddhist:'🪷', taoist:'☯️', confucian:'🎓'};
    el.innerHTML = '<div style="text-align:center;margin-bottom:16px"><div style="font-size:28px;margin-bottom:4px">' + icons[faithKey] + '</div><div style="font-size:16px;font-weight:bold;color:' + col.main + ';font-family:Ma Shan Zheng,serif;letter-spacing:4px">' + col.label + '养生妙法</div><div style="font-size:11px;opacity:.3">药食同源 · 修身养性 · 珍藏典藏</div></div>';
    let grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px';
    if (!items.length) { el.innerHTML += '<p style="text-align:center;opacity:.4">暂无数据</p>'; return; }
    items.forEach(function(item) {
      let card = document.createElement('div');
      card.style.cssText = 'background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(0,0,0,0.08));border:1px solid ' + col.border + ';border-radius:14px;overflow:hidden;transition:all .2s';
      let catIcon = {食疗:'🍲', 饮品:'🍵', 情志:'🧘', 导引:'🏃', 调摄:'🌿', 补益:'💊'}[item.category] || '🍃';
      card.innerHTML = '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:10px"><div style="width:44px;height:44px;background:' + col.bg + ';border:1px solid ' + col.border + ';border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">' + catIcon + '</div><div><div style="font-size:15px;font-weight:bold;color:' + col.main + '">' + item.name + '</div><div style="font-size:10px;opacity:.5;margin-top:2px">🏷 ' + (item.category || '') + '</div></div></div><div style="padding:12px 16px;font-size:12px;opacity:.75;line-height:1.7;color:rgba(255,255,255,0.8)">' + (item.description || '') + '</div>';
      if (item.methods && item.methods.length) {
        card.innerHTML += '<details style="padding:0 16px 14px"><summary style="font-size:11px;color:' + col.main + ';cursor:pointer;font-weight:bold;padding:8px 0">▸ 修炼方法 ▾</summary><ul style="padding-left:18px;margin:8px 0 0"><li style="font-size:12px;line-height:1.9;opacity:.8;margin-bottom:3px">' + item.methods.join('</li><li style="font-size:12px;line-height:1.9;opacity:.8;margin-bottom:3px">') + '</li></ul></details>';
      }
      if (item.recipe) card.innerHTML += '<div style="padding:10px 16px;background:rgba(39,174,96,0.1);border-top:1px solid rgba(255,255,255,0.04)"><div style="font-size:11px;color:#27ae60;font-weight:bold;margin-bottom:5px">📜 配方推荐</div><div style="font-size:12px;opacity:.85;line-height:1.6">' + item.recipe + '</div></div>';
      if (item.benefits) card.innerHTML += '<div style="padding:10px 16px;font-size:11px;color:' + col.main + ';opacity:.6;border-top:1px solid rgba(255,255,255,0.04)"><b>✨ 功效：</b>' + item.benefits + '</div>';
      card.onmouseenter = function() { this.style.borderColor = col.main; this.style.transform = 'translateY(-2px)'; };
      card.onmouseleave = function() { this.style.borderColor = col.border; this.style.transform = ''; };
      grid.appendChild(card);
    });
    el.appendChild(grid);
  }

  // ================================================================
  // 模块9：药方妙法
  // ================================================================
  function renderRemedy(el, faith) {
    if (!FK) { el.innerHTML = '<p style="text-align:center;opacity:.4">知识库加载中...</p>'; return; }
    let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
    let items = (FK.remedyGuide && FK.remedyGuide[faithKey]) ? FK.remedyGuide[faithKey] : [];
    let col = COLORS[faith];
    el.innerHTML = '<div style="text-align:center;margin-bottom:12px"><div style="font-size:13px;opacity:.4">传统智慧 · 仅供参考</div><div style="font-size:16px;font-weight:bold;color:' + col.main + ';font-family:Ma Shan Zheng,serif;letter-spacing:4px;margin-top:4px">' + col.label + '药方妙法</div><div style="font-size:11px;opacity:.3;margin-top:2px">食疗为主 · 药食同源 · 请遵医嘱</div></div><div style="text-align:center;padding:8px 16px;background:rgba(231,76,60,0.1);border:1px solid rgba(231,76,60,0.3);border-radius:10px;margin-bottom:16px;font-size:11px;color:#e74c3c;opacity:.8">⚠️ 本栏目药方仅供传统文化参考，身体不适请及时就医，遵医嘱治疗</div>';
    let list = document.createElement('div');
    list.style.cssText = 'display:flex;flex-direction:column;gap:14px';
    if (!items.length) { el.innerHTML += '<p style="text-align:center;opacity:.4">暂无数据</p>'; return; }
    items.forEach(function(item) {
      let catIcon = {食疗:'🍲', 滋补:'💊', 消食:'🍽️', 外治:'👐', 调摄:'🌿'}[item.category] || '🌿';
      let card = document.createElement('div');
      card.style.cssText = 'background:linear-gradient(135deg,rgba(255,255,255,0.04),rgba(0,0,0,0.08));border:1px solid ' + col.border + ';border-radius:14px;overflow:hidden;transition:all .2s';
      card.innerHTML = '<div style="padding:14px 16px;border-bottom:1px solid rgba(255,255,255,0.05);display:flex;align-items:center;gap:10px"><div style="width:48px;height:48px;background:' + col.bg + ';border:1px solid ' + col.border + ';border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px;flex-shrink:0">' + catIcon + '</div><div style="flex:1;min-width:0"><div style="font-size:15px;font-weight:bold;color:' + col.main + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + item.name + '</div><div style="font-size:10px;opacity:.5;margin-top:2px">🏷 ' + (item.category || '') + ' · 💡 ' + (item.occasion || '') + '</div></div></div>';
      card.innerHTML += '<div style="padding:12px 16px;display:grid;gap:8px"><div style="background:rgba(0,0,0,0.15);padding:10px 12px;border-radius:8px"><div style="font-size:11px;color:' + col.main + ';font-weight:bold;margin-bottom:5px">🧪 食材</div><div style="font-size:12px;opacity:.85;line-height:1.6">' + (item.ingredients || '') + '</div></div><div style="background:rgba(0,0,0,0.1);padding:10px 12px;border-radius:8px"><div style="font-size:11px;color:' + col.main + ';font-weight:bold;margin-bottom:5px">📋 制作方法</div><div style="font-size:12px;opacity:.85;line-height:1.6">' + (item.method || '') + '</div></div>';
      if (item.dosage) card.innerHTML += '<div style="font-size:11px;opacity:.6"><b>📆 用法用量：</b>' + item.dosage + '</div>';
      if (item.cautions) card.innerHTML += '<div style="font-size:11px;color:#e74c3c;opacity:.85;padding:8px 10px;background:rgba(231,76,60,0.08);border-radius:6px"><b>⚠️ 禁忌注意：</b>' + item.cautions + '</div>';
      card.onmouseenter = function() { this.style.borderColor = col.main; this.style.transform = 'translateY(-1px)'; };
      card.onmouseleave = function() { this.style.borderColor = col.border; this.style.transform = ''; };
      list.appendChild(card);
    });
    el.appendChild(list);
  }

})();

// ================================================================
// 音乐播放函数（供各模块调用）
// ================================================================
function playFaithMusic(songName) {
  songName = decodeURIComponent(songName || '');
  if (!songName) return;
  // 尝试查找或提示
  let msg = '🎵 ' + songName + '\n\n由于版权限制，无法直接播放。\n建议在以下平台搜索收听：\n\n📱 QQ音乐/网易云音乐：搜索 "' + songName + '"\n🌐 网页版：music.163.com\n\n🙏 持咒修行，心诚则灵！';
  alert(msg);
}

// ================================================================
// FAITH_CONTENT 数据集成
// 提供：每日修行指导、工作生活指导、功德体系
// ================================================================

/**
 * 获取每日修行指导
 * @param {string} faith - 'ru'/'dao'/'fo'
 * @returns {object|null}
 */
function getDailyPractice(faith) {
  if (typeof window.FAITH_CONTENT === 'undefined') return null;
  return window.FAITH_CONTENT.getDailyPractice(faith);
}

/**
 * 渲染每日修行指导
 */
function renderDailyPractice(faith) {
  let data = getDailyPractice(faith);
  if (!data) return '<p style="text-align:center;opacity:.4">数据加载中...</p>';
  
  let col = {ru:'#c0392b', dao:'#8e44ad', fo:'#e67e22'}[faith];
  let html = '<div style="text-align:center;margin-bottom:16px">';
  html += '<h3 style="color:' + col + ';font-family:Ma Shan Zheng,serif;font-size:20px;letter-spacing:4px">' + data.icon + ' ' + data.name + '每日修行</h3>';
  html += '<p style="font-size:11px;opacity:.4">' + data.weeklyGoal + '</p>';
  html += '</div>';
  
  data.practices.forEach(function(p) {
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid ' + col + '33;border-radius:10px;padding:14px;margin-bottom:10px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<span style="font-size:14px;font-weight:bold;color:' + col + '">' + p.time + ' · ' + p.title + '</span>';
    html += '<span style="font-size:10px;opacity:.4">' + p.duration + '</span>';
    html += '</div>';
    html += '<div style="font-size:12px;opacity:.8;line-height:1.8">' + p.content + '</div>';
    if (p.quote) {
      html += '<div style="margin-top:10px;padding:10px;background:' + col + '11;border-left:3px solid ' + col + ';border-radius:0 6px 6px 0;font-size:11px;font-style:italic;opacity:.7">' + p.quote + '</div>';
    }
    html += '</div>';
  });
  
  return html;
}

/**
 * 渲染工作指导
 */
function renderWorkGuidance(faith) {
  if (typeof window.FAITH_CONTENT === 'undefined') return null;
  let data = window.FAITH_CONTENT.getWorkGuidance(faith);
  if (!data) return null;
  
  let col = {ru:'#c0392b', dao:'#8e44ad', fo:'#e67e22'}[faith];
  let html = '<div style="text-align:center;margin-bottom:16px">';
  html += '<h3 style="color:' + col + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:3px">' + data.icon + ' ' + data.title + '</h3>';
  html += '</div>';
  
  data.guidance.forEach(function(g) {
    html += '<div style="background:rgba(255,255,255,0.02);border:1px solid ' + col + '22;border-radius:10px;padding:14px;margin-bottom:10px">';
    html += '<div style="font-size:13px;font-weight:bold;color:' + col + ';margin-bottom:6px">' + g.scenario + '</div>';
    html += '<div style="font-size:11px;opacity:.5;margin-bottom:8px">核心: ' + g.principle + '</div>';
    html += '<div style="font-size:12px;opacity:.8;line-height:1.8">' + g.content + '</div>';
    if (g.practice) {
      html += '<div style="margin-top:8px;font-size:11px;color:' + col + ';opacity:.7">💡 ' + g.practice + '</div>';
    }
    html += '</div>';
  });
  
  return html;
}

/**
 * 渲染功德体系
 */
function renderMeritSystem(faith) {
  if (typeof window.FAITH_CONTENT === 'undefined') return null;
  let data = window.FAITH_CONTENT.getMeritSystem(faith);
  if (!data) return null;
  
  let col = {ru:'#c0392b', dao:'#8e44ad', fo:'#e67e22'}[faith];
  let html = '<div style="text-align:center;margin-bottom:16px">';
  html += '<h3 style="color:' + col + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:3px">' + data.icon + ' ' + data.name + '功德体系</h3>';
  html += '</div>';
  
  data.levels.forEach(function(level) {
    html += '<div style="background:linear-gradient(135deg,' + level.color + '15,rgba(0,0,0,0.1));border:2px solid ' + level.color + '44;border-radius:14px;padding:16px;margin-bottom:14px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<span style="font-size:16px;font-weight:bold;color:' + level.color + '">' + level.badge + ' 第' + level.level + '阶 · ' + level.name + '</span>';
    html += '<span style="font-size:11px;opacity:.4">累计: ' + level.totalPoints + '功</span>';
    html += '</div>';
    
    // 任务列表
    html += '<div style="display:grid;gap:6px;margin-bottom:12px">';
    level.requirements.forEach(function(req) {
      html += '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,0.03);border-radius:6px">';
      html += '<span style="font-size:16px">' + req.icon + '</span>';
      html += '<div style="flex:1">';
      html += '<div style="font-size:12px;font-weight:bold">' + req.name + '</div>';
      html += '<div style="font-size:10px;opacity:.5">' + req.desc + '</div>';
      html += '</div>';
      html += '<span style="font-size:12px;color:' + level.color + '">+' + req.points + '功</span>';
      html += '</div>';
    });
    html += '</div>';
    
    // 奖励
    html += '<div style="font-size:11px;opacity:.6">🎁 奖励: ' + level.rewards.join('、') + '</div>';
    html += '</div>';
  });
  
  // 福报列表
  html += '<div style="background:rgba(39,174,96,0.1);border:1px solid rgba(39,174,96,0.3);border-radius:10px;padding:14px">';
  html += '<div style="font-size:12px;color:#2ecc71;margin-bottom:8px">🙏 功德福报</div>';
  html += '<ul style="padding-left:16px;margin:0">';
  data.blessings.forEach(function(b) {
    html += '<li style="font-size:12px;opacity:.7;line-height:1.8">' + b + '</li>';
  });
  html += '</ul></div>';
  
  return html;
}

/**
 * 渲染生活指导
 */
function renderLifeGuidance(category, faith) {
  if (typeof window.FAITH_CONTENT === 'undefined') return null;
  let data = window.FAITH_CONTENT.getLifeGuidance(category, faith);
  if (!data) return null;
  
  let col = {ru:'#c0392b', dao:'#8e44ad', fo:'#e67e22'}[faith];
  let html = '<h4 style="color:' + col + ';margin-bottom:12px">' + data.title + '</h4>';
  html += '<div style="font-size:12px;line-height:1.9">' + data.content + '</div>';
  if (data.quote) {
    html += '<div style="margin-top:10px;padding:10px;background:' + col + '11;border-radius:6px;font-size:11px;font-style:italic;opacity:.7">' + data.quote + '</div>';
  }
  return html;
}

// ====================================================================
// 信仰专题渲染模板集合
// ====================================================================

function renderFaithOverview(el, faith) {
  let col = COLORS[faith];
  let html = '';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="color:' + col.main + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">' + col.label + '信仰概述</h3>';
  html += '<p style="font-size:12px;opacity:.5">核心教义 · 修行体系 · 实践方法</p></div>';
  if (faith === 'fo') {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid ' + col.main + '22;border-radius:12px;padding:16px;margin-bottom:14px">';
    html += '<div style="font-size:14px;font-weight:bold;color:' + col.main + ';margin-bottom:12px">\u{1F64F} 三宝 · 四谛 · 八正道</div>';
    html += '<div style="display:grid;gap:10px">';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">三宝：</b>佛（觉悟者）、法（教法真理）、僧（修行僧团）。皈依三宝是入佛门的第一步。</div>';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">四谛：</b>苦（世间是苦）、集（苦因在烦恼）、灭（苦可止息）、道（灭苦有方法）。</div>';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">八正道：</b>正见、正思维、正语、正业、正命、正精进、正念、正定。涵盖戒定慧三学。</div>';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">六度：</b>布施、持戒、忍辱、精进、禅定、般若。</div>';
    html += '</div></div>';
  } else if (faith === 'dao') {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid ' + col.main + '22;border-radius:12px;padding:16px;margin-bottom:14px">';
    html += '<div style="font-size:14px;font-weight:bold;color:' + col.main + ';margin-bottom:12px">☯️ 道 · 德 · 无为 · 自然</div>';
    html += '<div style="display:grid;gap:10px">';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">道：</b>宇宙的本源和根本规律。道生一、一生二、二生三、三生万物。</div>';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">德：</b>道在万物中的体现。德者得也，修道就是恢复本有的德。</div>';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">无为：</b>顺道而行，不妄作。为而不恃，功成不居。</div>';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">自然：</b>道的根本属性。人法地、地法天、天法道、道法自然。</div>';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b style="color:' + col.main + '">内丹：</b>以人体为炉鼎、以精气神为药物，炼精化气、炼气化神、炼神还虚。</div>';
    html += '</div></div>';
  }
  html += '<div style="background:' + col.main + '11;border:1px solid ' + col.main + '22;border-radius:12px;padding:16px;margin-bottom:14px">';
  html += '<div style="font-size:13px;font-weight:bold;color:' + col.main + ';margin-bottom:10px">📶 修行次第</div>';
  html += '<div style="font-size:12px;line-height:2;opacity:.75">';
  if (faith === 'fo') { html += '① 亲近善知识 → ② 皈依三宝 → ③ 受持戒律 → ④ 建立定课 → ⑤ 解行并进 → ⑥ 弘法利生'; }
  else if (faith === 'dao') { html += '① 诵读经典 → ② 皈依道经师 → ③ 修身养性 → ④ 积功累德 → ⑤ 寻师学道 → ⑥ 与道合真'; }
  else { html += '① 诵读四书 → ② 格物致知 → ③ 诚意正心 → ④ 修身齐家 → ⑤ 治国平天下'; }
  html += '</div></div>';
  el.innerHTML = html;
}

function renderFestivalReminder(el, faith) {
  let col = COLORS[faith];
  let FAITH_GUIDE = window.FAITH_GUIDE || {};
  let allFestivals = FAITH_GUIDE.festivalCalendar || [];
  let lunarMonths = {'正':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'十一':11,'腊':12};
  function parseLM(l) { for (let k in lunarMonths) { if (l.indexOf(k)>=0) return lunarMonths[k]; } return null; }
  let now = new Date(), cm = now.getMonth()+1, upcoming = [];
  allFestivals.forEach(function(f) {
    let m = parseLM(f.lunar); if (m===null) return;
    let d = m - cm; if (d<0) d+=12;
    if (d<=3) upcoming.push({f:f, d:d});
  });
  upcoming.sort(function(a,b){return a.d-b.d});
  upcoming = upcoming.slice(0,10);
  let html = '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="color:' + col.main + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">📅 节日提醒与倒计时</h3>';
  html += '<p style="font-size:12px;opacity:.5">即将到来的佛道节日 · 提前准备参拜</p></div>';
  if (!upcoming.length) { html += '<div style="text-align:center;padding:30px;opacity:.4">暂无近期节日数据</div>'; }
  else {
    html += '<div style="display:grid;gap:10px">';
    upcoming.forEach(function(item) {
      let f = item.f, uc = item.d===0?'#e74c3c':item.d===1?'#f39c12':'#3498db';
      let ul = item.d===0?'🔥 本月':item.d===1?'📌 下月':'📋 '+item.d+'个月后';
      let fi = f.faith==='fo'?'🪷':f.faith==='dao'?'☯️':f.faith==='ru'?'🎓':'🏮';
      html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
      html += '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">'+fi+'</span><span style="font-size:14px;font-weight:bold;color:'+col.main+'">'+f.name+'</span></div>';
      html += '<span style="font-size:11px;color:'+uc+';font-weight:bold">'+ul+'</span></div>';
      html += '<div style="font-size:11px;opacity:.5;margin-bottom:6px">📅 '+f.lunar+'</div>';
      if (f.detail) html += '<div style="font-size:11px;opacity:.6;line-height:1.6;padding:8px;background:rgba(255,255,255,.02);border-radius:6px">'+f.detail+'</div>';
      html += '</div>';
    });
    html += '</div>';
  }
  el.innerHTML = html;
}

function renderMeritRecord(el, faith) {
  let col = COLORS[faith];
  let meritCategories = [
    { icon:'🙏',name:'诵经念佛',items:['每日念佛','诵经回向','持咒修行','参加共修'],color:'#e74c3c'},
    { icon:'🎁',name:'布施供养',items:['财布施','法布施','无畏布施','供养三宝'],color:'#f39c12'},
    { icon:'🐟',name:'放生护生',items:['放生活动','素食一日','救助动物','环保行动'],color:'#2ecc71'},
    { icon:'🤝',name:'行善助人',items:['帮助他人','志愿活动','捐资助学','献血捐髓'],color:'#3498db'},
    { icon:'🧘',name:'禅修静坐',items:['每日静坐','参加禅七','正念练习','身心调养'],color:'#9b59b6'},
    { icon:'📿',name:'持戒修行',items:['持五戒','受八关斋戒','斋日茹素','远离恶缘'],color:'#1abc9c'}
  ];
  let html = '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">🌟 功德记录与修行日记</h3>';
  html += '<p style="font-size:12px;opacity:.5">记录每日善行 · 精进不退 · 积累福报</p></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px">';
  meritCategories.forEach(function(cat) {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid '+col.main+'22;border-radius:12px;padding:14px;text-align:center">';
    html += '<div style="font-size:28px;margin-bottom:8px">'+cat.icon+'</div>';
    html += '<div style="font-size:13px;font-weight:bold;color:'+cat.color+';margin-bottom:10px">'+cat.name+'</div>';
    html += '<div style="display:grid;gap:4px">';
    cat.items.forEach(function(item) {
      html += '<label style="display:flex;align-items:center;gap:6px;font-size:11px;opacity:.7;cursor:pointer">';
      html += '<input type="checkbox" style="accent-color:'+cat.color+'" onchange="window.__updateMeritCount()"><span>'+item+'</span></label>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  html += '<div style="margin-top:16px;padding:14px;background:'+col.main+'11;border:1px solid '+col.main+'22;border-radius:12px;text-align:center">';
  html += '<div style="font-size:12px;opacity:.5;margin-bottom:6px">📊 今日功德统计</div>';
  html += '<div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap">';
  html += '<div><span style="font-size:24px;font-weight:bold;color:#e74c3c" id="meritCount">0</span><br><span style="font-size:11px;opacity:.5">善行次数</span></div>';
  html += '<div><span style="font-size:24px;font-weight:bold;color:#f39c12" id="meritScore">0</span><br><span style="font-size:11px;opacity:.5">功德分值</span></div>';
  html += '<div><span style="font-size:24px;font-weight:bold;color:#2ecc71" id="meritStreak">0</span><br><span style="font-size:11px;opacity:.5">连续天数</span></div>';
  html += '</div></div>';
  html += '<div style="margin-top:14px;padding:14px;background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:12px">';
  html += '<div style="font-size:12px;font-weight:bold;color:'+col.main+';margin-bottom:10px">🎯 每月修行目标建议</div>';
  html += '<div style="font-size:11px;opacity:.7;line-height:1.8">• 每日念佛/诵经至少15分钟<br>• 每周参加一次共修或法会<br>• 每月至少一日持八关斋戒<br>• 每月布施供养（量力而行）<br>• 每日反省三业过失<br>• 每月至少做一件利他善事</div></div>';
  el.innerHTML = html;
  window.__updateMeritCount = function() {
    let checks = el.querySelectorAll('input[type="checkbox"]:checked');
    let count = checks.length, score = count*10;
    let ce = document.getElementById('meritCount'), se = document.getElementById('meritScore');
    if (ce) ce.textContent = count;
    if (se) se.textContent = score;
  };
}

function renderActivityCalendar(el, faith) {
  let col = COLORS[faith];
  let FAITH_GUIDE = window.FAITH_GUIDE || {};
  let festivals = FAITH_GUIDE.festivalCalendar || [];
  let monthNames = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','腊月'];
  let g = {}; monthNames.forEach(function(m){g[m]=[];});
  festivals.forEach(function(f) {
    for (let i=0;i<monthNames.length;i++) { if (f.lunar.indexOf(monthNames[i])>=0) { g[monthNames[i]].push(f); break; } }
  });
  let html = '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">🗓️ 佛道活动年历</h3>';
  html += '<p style="font-size:12px;opacity:.5">全年重要佛道节日一览 · 提前规划参拜行程</p></div>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">';
  monthNames.forEach(function(month) {
    let fs = g[month]||[], has = fs.length>0;
    html += '<div style="background:'+(has?'rgba(255,255,255,.03)':'rgba(255,255,255,.01)')+';border:1px solid rgba(255,255,255,.06);border-radius:10px;padding:12px">';
    html += '<div style="font-size:13px;font-weight:bold;color:'+col.main+';margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:6px">📅 '+month+'月</div>';
    if (!has) { html += '<div style="font-size:11px;opacity:.2;text-align:center;padding:10px">暂无收录节日</div>'; }
    else {
      fs.forEach(function(f) {
        let fi = f.faith==='fo'?'🪷':f.faith==='dao'?'☯️':f.faith==='ru'?'🎓':'🏮';
        html += '<div style="display:flex;align-items:center;gap:6px;padding:5px 0;font-size:11px">';
        html += '<span style="font-size:13px;flex-shrink:0">'+fi+'</span>';
        html += '<span style="font-weight:bold;opacity:.9;flex-shrink:0;min-width:70px">'+f.name+'</span>';
        html += '<span style="opacity:.4;flex-shrink:0">'+f.lunar+'</span>';
        if (f.detail) html += '<span style="opacity:.5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1">'+f.detail.substring(0,30)+'</span>';
        html += '</div>';
      });
    }
    html += '</div>';
  });
  html += '</div>';
  html += '<div style="margin-top:16px;padding:14px;background:'+col.main+'11;border:1px solid '+col.main+'22;border-radius:12px">';
  html += '<div style="font-size:13px;font-weight:bold;color:'+col.main+';margin-bottom:10px">🧭 朝圣季节建议</div>';
  html += '<div style="font-size:11px;opacity:.75;line-height:2">';
  html += '<b>春季（正月至三月）：</b>春节祈福、观音圣诞朝普陀、老君圣诞朝道观、真武圣诞朝武当<br>';
  html += '<b>夏季（四月至六月）：</b>浴佛节（四月初八）、文殊圣诞朝五台、观音成道朝普陀<br>';
  html += '<b>秋季（七月至九月）：</b>盂兰盆超度、地藏圣诞朝九华、观音出家朝普陀、九皇斋戒<br>';
  html += '<b>冬季（十月至腊月）：</b>阿弥陀佛圣诞修净土、腊八粥纪念佛成道、谢太岁还愿</div></div>';
  el.innerHTML = html;
}

function renderFaithResources(el, faith) {
  let col = COLORS[faith];
  let resources = {
    fo:{books:[{name:'《正信的佛教》',author:'圣严法师',desc:'初学者最好的入门书，解答最常见的佛教疑问'},{name:'《学佛群疑》',author:'圣严法师',desc:'深入解答学佛者的各种疑问'},{name:'《金刚经说什么》',author:'南怀瑾',desc:'深入浅出讲解金刚经的般若智慧'},{name:'《西藏生死书》',author:'索甲仁波切',desc:'了解生死大事，学习临终关怀'},{name:'《佛学基础》',author:'杨卓/界诠法师',desc:'系统学习佛教基础知识'}],apps:['佛教日历','念佛计数器','佛学词典','禅修计时器'],websites:['佛弟子网','佛教导航','显密文库']},
    dao:{books:[{name:'《道德经》',author:'老子',desc:'道教最高圣典'},{name:'《太上感应篇》',author:'佚名',desc:'道教劝善经典'},{name:'《中国道教史》',author:'任继愈',desc:'了解道教发展历史'},{name:'《道教与中国文化》',author:'葛兆光',desc:'了解道教文化影响'},{name:'《内丹养生功法》',author:'胡孚琛',desc:'科学系统地介绍内丹修炼'}],apps:['道教日历','道德经诵读版','八段锦教学','道教音乐'],websites:['道教之音','中国道教协会','白云观官网']},
    ru:{books:[{name:'《论语》',author:'孔子弟子',desc:'儒家根本经典'},{name:'《大学·中庸》',author:'曾子/子思',desc:'修齐治平与中庸之道'},{name:'《孟子》',author:'孟子',desc:'性善论和仁政思想'},{name:'《论语别裁》',author:'南怀瑾',desc:'深入浅出讲解论语'}],apps:['国学经典诵读','四书五经','论语日历'],websites:['国学网','古诗文网']}
  };
  let data = resources[faith]||resources.fo;
  let html = '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">📚 修行资源推荐</h3>';
  html += '<p style="font-size:12px;opacity:.5">经典著作 · 实用工具 · 修行网站</p></div>';
  html += '<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:bold;color:'+col.main+';margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px">📖 推荐书籍</div><div style="display:grid;gap:8px">';
  data.books.forEach(function(b){html+='<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:12px"><div style="font-size:12px;font-weight:bold;opacity:.9">'+b.name+'</div><div style="font-size:10px;opacity:.5;margin:4px 0">作者：'+b.author+'</div><div style="font-size:11px;opacity:.6;line-height:1.5">'+b.desc+'</div></div>';});
  html += '</div></div>';
  html += '<div style="margin-bottom:16px"><div style="font-size:13px;font-weight:bold;color:'+col.main+';margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px">📱 实用工具/APP</div><div style="display:flex;flex-wrap:wrap;gap:6px">';
  data.apps.forEach(function(a){html+='<span style="font-size:11px;padding:4px 10px;background:'+col.main+'11;border:1px solid '+col.main+'22;border-radius:6px;opacity:.7">'+a+'</span>';});
  html += '</div></div>';
  html += '<div><div style="font-size:13px;font-weight:bold;color:'+col.main+';margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px">🌐 推荐网站</div><div style="display:grid;gap:6px">';
  data.websites.forEach(function(s){html+='<div style="font-size:11px;opacity:.6;padding:4px 0">🔗 '+s+'</div>';});
  html += '</div></div>';
  el.innerHTML = html;
}

function renderFaithFAQ(el, faith) {
  let col = COLORS[faith];
  let faqs = {
    fo:[{q:'什么是皈依？一定要皈依才能学佛吗？',a:'皈依就是归投依靠三宝（佛、法、僧）。皈依是成为正式佛弟子的第一步。不皈依也可以了解佛法，但皈依后有明确的信仰归属和戒律约束，修行更加坚定。皈依不等于出家，在家居士也可以皈依。'},{q:'念佛真的能往生极乐世界吗？',a:'净土宗认为只要信愿行三者具足——深信极乐世界、真切愿往生、至诚恳切念佛——临命终时阿弥陀佛必定来接引。念佛不是消极等死，而是通过念佛净化心灵、提升生命品质。'},{q:'烧香拜佛是迷信吗？',a:'烧香拜佛本身不是迷信。香代表戒定慧三学，拜佛是对觉悟者的礼敬。关键是心态：只求保佑而不努力是迷信，通过拜佛提醒自己精进修行是正信。'},{q:'在家学佛应该怎么开始？',a:'从三方面入手：①阅读入门书籍；②开始简单定课；③参加寺院或居士活动亲近善知识。'}],
    dao:[{q:'道教和道家有什么区别？',a:'道家是先秦哲学思想流派（老庄），道教是在道家思想基础上发展形成的宗教。道教继承了道家核心思想（道、无为、自然），并加入了神仙信仰、斋醮科仪、内丹修炼等宗教元素。'},{q:'普通人可以修炼内丹吗？',a:'内丹修炼需要三个条件：身体健康、有师父指导、足够时间精力。对大多数人来说，先学习道教养生功法更为实际。'},{q:'正一道和全真道有什么不同？',a:'正一道：可以结婚、不忌荤食、以符箓斋醮为主。全真道：出家修行、茹素、禁欲、以内丹修真为主。'},{q:'戊日为什么不能烧香？',a:'道教有「戊不朝真」禁忌——逢戊日不烧香不诵经不拜神。戊日为天地交泰之时，应静养而不扰动。'}]
  };
  let data = faqs[faith]||faqs.fo;
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">❓ 常见问答</h3><p style="font-size:12px;opacity:.5">解答信众最常遇到的问题</p></div><div style="display:grid;gap:10px">';
  data.forEach(function(faq,i){html+='<details style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;overflow:hidden"><summary style="padding:12px 14px;font-size:13px;font-weight:bold;color:'+col.main+';cursor:pointer">'+(i+1)+'. '+faq.q+'</summary><div style="padding:12px 14px;font-size:12px;opacity:.75;line-height:1.8;border-top:1px solid rgba(255,255,255,.05)">'+faq.a+'</div></details>';});
  html += '</div>';
  el.innerHTML = html;
}

function renderProgressTracker(el, faith) {
  let col = COLORS[faith];
  let phases = [{name:'基础入门',icon:'🚶',desc:'了解基本教义、亲近善知识',progress:30},{name:'皈依受戒',icon:'🙏',desc:'皈依三宝、受持戒律',progress:0},{name:'定课坚持',icon:'📿',desc:'每日诵经念佛、形成习惯',progress:0},{name:'解行并进',icon:'📖',desc:'深入经藏、实践修行',progress:0},{name:'深入修行',icon:'🧘',desc:'参加禅修、专修法门',progress:0},{name:'弘法利生',icon:'🌟',desc:'利益众生、代代相传',progress:0}];
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">📊 修行进度追踪</h3><p style="font-size:12px;opacity:.5">量力而行 · 日积月累 · 水滴石穿</p></div><div style="display:grid;gap:10px;margin-bottom:16px">';
  phases.forEach(function(p){let pc=p.progress>=80?'#2ecc71':p.progress>=40?'#f39c12':'#3498db';html+='<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:18px">'+p.icon+'</span><span style="font-size:13px;font-weight:bold;opacity:.85">'+p.name+'</span></div><span style="font-size:11px;opacity:.4">'+p.progress+'%</span></div><div style="background:rgba(255,255,255,.08);border-radius:4px;height:6px;overflow:hidden"><div style="height:100%;width:'+p.progress+'%;background:'+pc+';border-radius:4px"></div></div><div style="font-size:10px;opacity:.4;margin-top:4px">'+p.desc+'</div></div>';});
  html += '</div>';
  let quotes = ['滴水穿石，非力也，恒也。——修行贵在坚持','不积跬步，无以至千里。——每日定课不可间断','道虽迩，不行不至；事虽小，不为不成。','修行如逆水行舟，不进则退。','一日修来一日功，一日不修一日空。'];
  html += '<div style="padding:14px;background:'+col.main+'11;border:1px solid '+col.main+'22;border-radius:12px;text-align:center"><div style="font-size:12px;opacity:.5;margin-bottom:8px">💪 修行箴言</div><div style="font-size:14px;color:'+col.main+';font-style:italic;opacity:.8">'+quotes[Math.floor(Math.random()*quotes.length)]+'</div></div>';
  el.innerHTML = html;
}

// 暴露全局函数供外部调用
window.FaithContentRenderer = {
  getDailyPractice: getDailyPractice,
  renderDailyPractice: renderDailyPractice,
  renderWorkGuidance: renderWorkGuidance,
  renderMeritSystem: renderMeritSystem,
  renderLifeGuidance: renderLifeGuidance,
  renderFaithOverview: renderFaithOverview,
  renderFestivalReminder: renderFestivalReminder,
  renderMeritRecord: renderMeritRecord,
  renderActivityCalendar: renderActivityCalendar,
  renderFaithResources: renderFaithResources,
  renderFaithFAQ: renderFaithFAQ,
  renderProgressTracker: renderProgressTracker
};

// ====================================================================
// 三教对比渲染器
// ====================================================================
function renderFaithComparison(el) {
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:var(--gold);font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">📊 三教对比一览</h3><p style="font-size:12px;opacity:.5">佛教 · 道教 · 儒家 · 核心要义对照</p></div>';
  let comps = [
    ['终极追求','涅槃（解脱轮回）','与道合真（长生久视）','成圣成贤（内圣外王）'],
    ['创始人','释迦牟尼佛','张道陵（宗教）/老子（哲学）','孔子'],
    ['核心经典','《大藏经》（三藏十二部）','《道藏》（三洞四辅十二类）','《四书五经》'],
    ['根本教义','四圣谛 · 八正道 · 十二因缘','道法自然 · 清静无为 · 阴阳五行','仁义礼智信 · 忠孝廉耻'],
    ['修行方法','戒定慧三学 · 六度万行','内丹修炼 · 符箓斋醮 · 积功累德','格物致知 · 诚意正心 · 修身养性'],
    ['核心戒律','五戒：不杀盗淫妄酒','五戒：不杀盗淫妄酒（全真道戒律）','四勿：非礼勿视听言动'],
    ['来世观','六道轮回 · 因果报应','承负说（先人善恶影响后代）','未知生焉知死 · 重今世'],
    ['最高境界','无余涅槃 · 究竟成佛','形神俱妙 · 白日飞升','从心所欲不逾矩'],
    ['与自然关系','依正不二 · 众生平等','道法自然 · 天人合一','赞天地之化育'],
    ['社会伦理','慈悲为怀 · 普度众生','济世利人 · 护国佑民','修身齐家治国平天下'],
    ['参拜对象','三宝（佛法僧）','三清 · 四御 · 诸神','天地君亲师'],
    ['主要宗派','禅宗/净土/天台/华严/律/密','正一/全真/上清/灵宝/净明','程朱理学/陆王心学/汉学']
  ];
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
  html += '<tr style="background:rgba(255,255,255,.06)"><th style="padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.1);color:var(--gold)">维度</th><th style="padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.1);color:#e67e22">🪷 佛教</th><th style="padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.1);color:#8e44ad">☯️ 道教</th><th style="padding:10px 12px;text-align:left;border-bottom:1px solid rgba(255,255,255,.1);color:#c0392b">🎓 儒家</th></tr>';
  comps.forEach(function(r,i){
    let bg = i%2===0?'rgba(255,255,255,.02)':'transparent';
    html += '<tr style="background:'+bg+'"><td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.04);font-weight:bold;opacity:.8">'+r[0]+'</td><td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.04);opacity:.75">'+r[1]+'</td><td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.04);opacity:.75">'+r[2]+'</td><td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.04);opacity:.75">'+r[3]+'</td></tr>';
  });
  html += '</table></div>';
  html += '<div style="margin-top:16px;padding:14px;background:rgba(255,215,0,.06);border:1px solid rgba(255,215,0,.2);border-radius:12px"><div style="font-size:13px;font-weight:bold;color:var(--gold);margin-bottom:8px">💡 三教合一思想</div><div style="font-size:12px;opacity:.7;line-height:1.8">自唐宋以来，儒释道三教不断融合。宋代以后的中国文化形成了「以儒治世、以道治身、以佛治心」的三教互补格局。许多中国文人往往兼通三教——外儒内佛、昼儒夜禅。明代以后更出现了大量三教合一的民间信仰和修行体系。了解三教异同，有助于更全面地把握中国传统文化的精髓。</div></div>';
  el.innerHTML = html;
}

// ====================================================================
// 每日箴言渲染器
// ====================================================================
function renderDailyWisdom(el, faith) {
  let col = COLORS[faith];
  let wisdoms = {
    fo: [{t:'一切有为法，如梦幻泡影，如露亦如电，应作如是观。',s:'《金刚经》'},{t:'应无所住而生其心。',s:'《金刚经》'},{t:'色不异空，空不异色，色即是空，空即是色。',s:'《心经》'},{t:'诸恶莫作，众善奉行，自净其意，是诸佛教。',s:'《法句经》'},{t:'若以色见我，以音声求我，是人行邪道，不能见如来。',s:'《金刚经》'},{t:'此有故彼有，此生故彼生；此无故彼无，此灭故彼灭。',s:'《杂阿含经》'},{t:'一花一世界，一叶一如来。',s:'《华严经》'},{t:'善护念。',s:'《金刚经》'},{t:'念佛一声，灭八十亿劫生死重罪。',s:'《观无量寿经》'},{t:'自净其意，是诸佛教。',s:'《增一阿含经》'}],
    dao: [{t:'道可道，非常道；名可名，非常名。',s:'《道德经》第一章'},{t:'上善若水，水善利万物而不争。',s:'《道德经》第八章'},{t:'人法地，地法天，天法道，道法自然。',s:'《道德经》第二十五章'},{t:'祸福无门，唯人自召。善恶之报，如影随形。',s:'《太上感应篇》'},{t:'为学日益，为道日损。损之又损，以至于无为。',s:'《道德经》第四十八章'},{t:'知人者智，自知者明。胜人者有力，自胜者强。',s:'《道德经》第三十三章'},{t:'致虚极，守静笃。万物并作，吾以观复。',s:'《道德经》第十六章'},{t:'天道无亲，常与善人。',s:'《道德经》第七十九章'},{t:'合抱之木，生于毫末；九层之台，起于累土。',s:'《道德经》第六十四章'},{t:'信言不美，美言不信。善者不辩，辩者不善。',s:'《道德经》第八十一章'}],
    ru: [{t:'学而时习之，不亦说乎。',s:'《论语》'},{t:'己所不欲，勿施于人。',s:'《论语》'},{t:'三人行，必有我师焉。',s:'《论语》'},{t:'君子坦荡荡，小人长戚戚。',s:'《论语》'},{t:'大学之道，在明明德，在亲民，在止于至善。',s:'《大学》'},{t:'喜怒哀乐之未发谓之中，发而皆中节谓之和。',s:'《中庸》'},{t:'穷则独善其身，达则兼善天下。',s:'《孟子》'},{t:'天将降大任于是人也，必先苦其心志。',s:'《孟子》'}]
  };
  let list = wisdoms[faith] || [];
  let today = new Date();
  let dayOfYear = Math.floor((today - new Date(today.getFullYear(),0,0)) / 86400000);
  let w = list[dayOfYear % list.length];
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">💡 今日修行箴言</h3><p style="font-size:12px;opacity:.5">每日一句经典 · 日日熏修 · 潜移默化</p></div>';
  html += '<div style="background:linear-gradient(135deg,'+col.main+'15,rgba(0,0,0,.1));border:2px solid '+col.main+'33;border-radius:16px;padding:28px 24px;text-align:center;margin-bottom:16px"><div style="font-size:20px;color:'+col.main+';line-height:2;font-weight:bold;letter-spacing:1px;margin-bottom:12px">「'+w.t+'」</div><div style="font-size:13px;opacity:.5">—— '+w.s+'</div></div>';
  html += '<details style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:10px;overflow:hidden"><summary style="padding:12px 14px;font-size:12px;font-weight:bold;color:'+col.main+';cursor:pointer">📖 查看全部箴言（共'+list.length+'条）</summary><div style="padding:12px 14px">';
  list.forEach(function(w,i){html+='<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.03);font-size:12px"><span style="color:'+col.main+';font-weight:bold;flex-shrink:0">'+(i+1)+'.</span><span style="opacity:.8">'+w.t+'</span><span style="opacity:.35;flex-shrink:0">——'+w.s+'</span></div>';});
  html += '</div></details>';
  el.innerHTML = html;
}

// ====================================================================
// 禅修冥想指导渲染器
// ====================================================================
function renderMeditationGuide(el, faith) {
  let col = COLORS[faith];
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">🧘 冥想禅修入门指导</h3><p style="font-size:12px;opacity:.5">从零开始学习静坐冥想 · 适合初学者</p></div>';
  html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px;margin-bottom:14px"><div style="font-size:14px;font-weight:bold;color:'+col.main+';margin-bottom:12px">📋 禅修前准备</div><div style="display:grid;gap:8px">';
  html += '<div style="font-size:12px;opacity:.75;line-height:1.8"><b>环境：</b>选择安静、通风、光线柔和的房间。避免在风口或阳光直射处打坐。可点一支清香净化空气。</div>';
  html += '<div style="font-size:12px;opacity:.75;line-height:1.8"><b>时间：</b>初学者建议选择清晨（5-7点）或黄昏（17-19点）。每次5-15分钟起步，逐步延长至30-45分钟。</div>';
  html += '<div style="font-size:12px;opacity:.75;line-height:1.8"><b>衣着：</b>穿宽松舒适的衣物，腰带不宜过紧。冬季注意保暖，夏季避免贪凉。</div>';
  html += '<div style="font-size:12px;opacity:.75;line-height:1.8"><b>饮食：</b>打坐前一小时不宜大量进食。过饱则昏沉，过饥则心散。可饮用少量温水。</div>';
  html += '<div style="font-size:12px;opacity:.75;line-height:1.8"><b>心态：</b>不求速效、不期待神奇体验。打坐如理财——短期收益微小但长期复利惊人。每次打坐都是一次善的积累。</div></div></div>';
  html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px;margin-bottom:14px"><div style="font-size:14px;font-weight:bold;color:'+col.main+';margin-bottom:12px">🪑 禅修坐姿（七支坐法）</div><div style="display:grid;gap:8px">';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8"><b>① 双足跏趺：</b>理想的坐姿是双盘（莲花坐），初学者可单盘或散盘。也可坐在椅子上，双脚平放地面。关键是稳定舒适。</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8"><b>② 脊背正直：</b>背脊自然挺直但不僵硬，如铜钱相叠。下颚微收，头顶如悬一线。脊柱正直是气血通畅的基础。</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8"><b>③ 手结定印：</b>双手相叠置于腹前，掌心向上，两大拇指轻触。右手在上左手在下（或相反均可）。</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8"><b>④ 双肩平舒：</b>双肩自然下垂、左右平衡，不耸肩不歪斜。似有力非有力，放松而不懈怠。</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8"><b>⑤ 舌抵上颚：</b>舌尖轻抵上牙龈后方（上颚），连通任督二脉，促进津液分泌。道教称为「搭鹊桥」。</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8"><b>⑥ 双目微闭：</b>眼睛微闭或垂帘（半睁半闭）。初学者闭眼容易昏沉，可微睁目视鼻尖前三尺处。</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8"><b>⑦ 下颚微收：</b>头颈正直，下颚微收，使颈椎自然舒展。避免仰头（昏沉）或低头（压迫呼吸）。</div></div></div>';
  html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px;margin-bottom:14px"><div style="font-size:14px;font-weight:bold;color:'+col.main+';margin-bottom:12px">🎯 三种入门禅修方法</div>';
  html += '<div style="margin-bottom:14px"><div style="font-size:13px;font-weight:bold;opacity:.85;margin-bottom:6px">方法一：数息法（最适合初学者）</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8">自然呼吸，将注意力放在鼻端或腹部。每次呼气时默数：吸~呼~1，吸~呼~2……从1数到10，再从1开始。走神后不要自责，温柔地将注意力带回呼吸重新计数。关键：不控制呼吸、不评判走神、耐心重复。</div></div>';
  html += '<div style="margin-bottom:14px"><div style="font-size:13px;font-weight:bold;opacity:.85;margin-bottom:6px">方法二：随息法（进阶）</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8">不加数数，直接觉知呼吸的自然流动。感受气息从鼻孔进入身体、又离开身体的全过程。知道「正在吸气」「正在呼气」，不与呼吸合为一体，保持旁观者的觉知。当觉知稳定后，可扩大至感受全身的微细振动和能量流动。</div></div>';
  html += '<div><div style="font-size:13px;font-weight:bold;opacity:.85;margin-bottom:6px">方法三：观念头法（高阶）</div>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.8">不锁定呼吸，而是观察念头的来去。念头生起时不评判，只是标注：「这是关于工作的念头」「这是回忆的念头」。如同坐在路边看车来车往，不来不拒、不追不随。逐渐会发现：我不是我的念头——念头只是心中过客，真正的觉知才是主人。</div></div></div>';
  html += '<div style="background:'+col.main+'11;border:1px solid '+col.main+'22;border-radius:12px;padding:16px"><div style="font-size:13px;font-weight:bold;color:'+col.main+';margin-bottom:10px">💡 初学者常见问题</div><div style="display:grid;gap:6px;font-size:11px;opacity:.7;line-height:1.6">';
  html += '<div><b>Q: 打坐时腿麻怎么办？</b><br>A: 轻微麻木正常，严重麻木缓慢换腿。初学者不需强行双盘，单盘或坐椅子也可。麻感消退后恢复坐姿。</div>';
  html += '<div><b>Q: 打坐时总是走神怎么办？</b><br>A: 走神是正常的！发现走神的瞬间，觉知就回来了。发现问题是解决的一半。温柔地回来即可，不必自责。</div>';
  html += '<div><b>Q: 身体摇晃或发热是怎么回事？</b><br>A: 身体摇晃是气机发动的现象，可任其自然但不主动引导。发热是气血通畅的表现，属正常现象。</div>';
  html += '<div><b>Q: 应该每天打坐多久？</b><br>A: 每天固定时间比每次时长更重要。每天10分钟坚持一年，胜过偶尔2小时。建议从5-10分钟开始，每月增加5分钟。</div></div></div>';
  el.innerHTML = html;
}

// ====================================================================
// 朝圣日记渲染器
// ====================================================================
function renderPilgrimageJournal(el, faith) {
  let col = COLORS[faith];
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">📔 朝圣修行日记</h3><p style="font-size:12px;opacity:.5">记录朝圣之旅 · 珍藏修行点滴 · 回顾成长历程</p></div>';
  let pilgrimages = {
    fo: [{s:'普陀山',d:'观音菩萨',l:'浙江舟山',t:'二月十九/六月十九/九月十九为三大观音圣诞'},{s:'五台山',d:'文殊菩萨',l:'山西忻州',t:'四月初四文殊圣诞，学子考前朝拜尤佳'},{s:'九华山',d:'地藏菩萨',l:'安徽池州',t:'七月三十地藏圣诞，超度先人最佳时机'},{s:'峨眉山',d:'普贤菩萨',l:'四川乐山',t:'二月廿一普贤圣诞，金顶十方普贤像前许愿'},{s:'灵隐寺',d:'释迦牟尼佛',l:'浙江杭州',t:'灵隐寺韦驮菩萨求正财最为灵验'},{s:'法门寺',d:'佛指舍利',l:'陕西宝鸡',t:'供奉佛祖指骨舍利，佛教最高圣物之一'}],
    dao: [{s:'武当山',d:'真武大帝',l:'湖北十堰',t:'三月初三/九月初九为真武圣诞和飞升日'},{s:'龙虎山',d:'张天师',l:'江西鹰潭',t:'天师府为正一道祖庭，请符驱邪最为灵验'},{s:'青城山',d:'太上老君',l:'四川成都',t:'道教发源地之一，天师道创立于此'},{s:'白云观',d:'丘处机',l:'北京西城',t:'全真道三大祖庭之一，燕九节最热闹'},{s:'终南山',d:'老子/王重阳',l:'陕西西安',t:'天下第一福地，全真道发源地'},{s:'茅山',d:'三茅真君',l:'江苏句容',t:'上清派祖庭，符箓驱邪最为灵验'}],
    ru: [{s:'曲阜孔庙',d:'孔子',l:'山东曲阜',t:'八月廿七孔子诞辰，祭孔大典最为隆重'},{s:'孟庙',d:'孟子',l:'山东邹城',t:'四月初二孟子诞辰，参拜亚圣'},{s:'岳麓书院',d:'孔子/朱熹',l:'湖南长沙',t:'千年学府，四大书院之首'}]
  };
  let items = pilgrimages[faith] || pilgrimages.fo;
  html += '<div style="display:grid;gap:10px">';
  items.forEach(function(p){html+='<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px;display:flex;align-items:center;gap:12px"><div style="width:44px;height:44px;background:'+col.main+'22;border:1px solid '+col.main+'44;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🏛️</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:bold;opacity:.9">'+p.s+' <span style="font-size:10px;opacity:.5">'+p.d+'</span></div><div style="font-size:10px;opacity:.4">📍 '+p.l+'</div><div style="font-size:10px;opacity:.5;margin-top:4px">💡 '+p.t+'</div></div><span style="font-size:11px;padding:4px 10px;background:rgba(255,255,255,.06);border-radius:6px;opacity:.4;flex-shrink:0">未朝圣</span></div>';});
  html += '</div>';
  html += '<div style="margin-top:14px;padding:14px;background:'+col.main+'11;border:1px solid '+col.main+'22;border-radius:12px"><div style="font-size:12px;font-weight:bold;color:'+col.main+';margin-bottom:8px">📝 朝圣日记模板</div><textarea style="width:100%;height:100px;background:rgba(0,0,0,.2);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:rgba(255,255,255,.8);padding:12px;font-size:12px;resize:vertical" placeholder="记录你的朝圣经历：&#10;日期：&#10;地点：&#10;同行：&#10;感受：&#10;灵验："></textarea></div>';
  el.innerHTML = html;
}

window.FaithContentRenderer.renderFaithComparison = renderFaithComparison;
window.FaithContentRenderer.renderDailyWisdom = renderDailyWisdom;
window.FaithContentRenderer.renderMeditationGuide = renderMeditationGuide;
window.FaithContentRenderer.renderPilgrimageJournal = renderPilgrimageJournal;

// ====================================================================
// 修行心法语录渲染器
// ====================================================================
function renderPracticeAphorisms(el, faith) {
  let col = COLORS[faith];
  let aphorisms = {
    fo: [
      {t:'菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。',a:'六祖惠能',c:'禅宗六祖惠能大师著名的开悟偈颂，直指心性本空，不假外求。此偈超越了神秀大师「时时勤拂拭」的渐修路径，点出了顿悟法门的精髓——一切烦恼本无自性，觉悟就在当下。'},
      {t:'过去心不可得，现在心不可得，未来心不可得。',a:'《金刚经》',c:'佛陀在《金刚经》中破除了对时间的执着。过去已去不可追回，未来未至不可预期，现在念念迁流不可把握。三心不可得，放下对时间的执着，才能体验到真正的自在。'},
      {t:'何期自性，本自清净；何期自性，本不生灭。',a:'六祖惠能',c:'六祖在听闻《金刚经》「应无所住而生其心」时豁然大悟，说出了五句「何期」，道出了自性的本质：清净、不生不灭、本自具足、本无动摇、能生万法。这是禅宗最核心的见地。'},
      {t:'一花一世界，一叶一如来。',a:'《华严经》',c:'出自《华严经》，体现了华严哲学「一即一切、一切即一」的圆融境界。一朵花中蕴含了整个世界的真理，一片叶中显现了如来的法身。启发我们以平等心看待万事万物。'},
      {t:'不是风动，不是幡动，仁者心动。',a:'六祖惠能',c:'六祖在广州法性寺看到两位僧人争论是风动还是幡动，说出了这句千古名言。外在的一切现象都是心念的投射，真正的修行是降伏其心，而非改变外境。'}
    ],
    dao: [
      {t:'上善若水，水善利万物而不争，处众人之所恶，故几于道。',a:'《道德经》第八章',c:'老子以水喻道，水滋养万物而不与万物相争，甘居众人不喜欢的低处。这体现了道家「不争之德」和「处下之道」。修道者应如水般柔软、谦卑、利他而不争功。'},
      {t:'为学日益，为道日损。损之又损，以至于无为。',a:'《道德经》第四十八章',c:'做学问是加法（日积月累），修道是减法（去除妄想执着）。减到无可再减，就到达了无为的境界。无为不是不作为，而是不妄为——顺道而行、自然而然。'},
      {t:'致虚极，守静笃。万物并作，吾以观复。',a:'《道德经》第十六章',c:'使心灵达到虚静的极致，坚定地守住这种宁静。在极静中观察万物的生生灭灭，看到它们最终都要回归本源（归根曰静，是谓复命）。这是道教内观修行的总纲。'},
      {t:'知其雄，守其雌，为天下溪。',a:'《道德经》第二十八章',c:'知道刚强有力的一面，却安守柔弱的姿态，像天下的溪流一样谦卑处下。这里讲的是阴阳辩证——智慧不在于展现力量，而在于懂得收敛和含藏。溪流处下却汇聚百川，柔弱胜刚强。'},
      {t:'天下难事，必作于易；天下大事，必作于细。',a:'《道德经》第六十三章',c:'世上所有的难事都是从容易处积累而成，所有的大事都是从细微处开始。修道也是如此——不要轻视每日的点滴修行，日复一日看似微小的功夫，最终能成就不可思议的大道。'}
    ],
    ru: [
      {t:'学而不思则罔，思而不学则殆。',a:'《论语·为政》',c:'只学习不思考就会迷惘，只思考不学习就会危险。孔子强调学思结合的重要性，这是儒家为学修身的根本方法。学问需要思考来消化，思考需要学问来支撑。'},
      {t:'知之者不如好之者，好之者不如乐之者。',a:'《论语·雍也》',c:'知道它的人不如喜爱它的人，喜爱它的人不如以它为乐的人。孔子指出做学问的三个层次：认知、热爱、享受。最好的学习状态是把修行当成内在的乐趣，而非外在的任务。'},
      {t:'君子和而不同，小人同而不和。',a:'《论语·子路》',c:'君子能保持和谐而不盲从附和，小人表面附和却内心不和。这是儒家处理人际关系的智慧——真正的和谐是尊重差异下的协调，而非抹杀个性的统一。'},
      {t:'己欲立而立人，己欲达而达人。',a:'《论语·雍也》',c:'自己希望立身，也帮助别人立身；自己希望通达，也帮助别人通达。这是儒家「恕道」的积极面——推己及人，成己成人。同时也是儒家「内圣外王」精神的具体表达。'}
    ]
  };
  let items = aphorisms[faith] || [];
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">💎 修行心法语录</h3><p style="font-size:12px;opacity:.5">历代圣贤悟道心得 · 醍醐灌顶 · 直指人心</p></div>';
  html += '<div style="display:grid;gap:14px">';
  items.forEach(function(item) {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:16px">';
    html += '<div style="font-size:15px;color:'+col.main+';line-height:2;font-weight:bold;margin-bottom:8px">「'+item.t+'」</div>';
    html += '<div style="font-size:11px;opacity:.4;margin-bottom:8px">—— '+item.a+'</div>';
    html += '<div style="font-size:12px;opacity:.65;line-height:1.8;padding:10px;background:rgba(0,0,0,.1);border-radius:8px;border-left:3px solid '+col.main+'">'+item.c+'</div>';
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

// ====================================================================
// 月修行日历渲染器
// ====================================================================
function renderMonthlyPracticeCalendar(el, faith) {
  let col = COLORS[faith];
  let now = new Date();
  let year = now.getFullYear(), month = now.getMonth()+1;
  let daysInMonth = new Date(year, month, 0).getDate();
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">📅 '+year+'年'+month+'月修行日历</h3><p style="font-size:12px;opacity:.5">记录每日修行功课完成情况</p></div>';

  // 修行项目
  let practices = [
    {id:'chanting', name:'诵经念佛', icon:'📿'},
    {id:'meditation', name:'静坐禅修', icon:'🧘'},
    {id:'vegetarian', name:'素食斋戒', icon:'🥬'},
    {id:'charity', name:'布施行善', icon:'🎁'},
    {id:'study', name:'研习经典', icon:'📖'},
    {id:'repentance', name:'忏悔反省', icon:'🙇'}
  ];

  html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px">';
  html += '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:12px">';
  html += '<div style="min-width:60px;font-size:11px;opacity:.5;text-align:center">日期</div>';
  practices.forEach(function(p) {
    html += '<div style="flex:1;min-width:60px;font-size:10px;opacity:.5;text-align:center">'+p.icon+'<br>'+p.name+'</div>';
  });
  html += '</div>';

  for (let d=1; d<=daysInMonth; d++) {
    html += '<div style="display:flex;flex-wrap:wrap;gap:4px;padding:3px 0;border-top:1px solid rgba(255,255,255,.03)">';
    html += '<div style="min-width:60px;font-size:11px;text-align:center;opacity:.6">'+month+'/'+d+'</div>';
    practices.forEach(function(p) {
      html += '<div style="flex:1;min-width:60px;text-align:center;font-size:14px"><input type="checkbox" style="transform:scale(1.2)"></div>';
    });
    html += '</div>';
  }
  html += '</div>';

  html += '<div style="margin-top:14px;padding:14px;background:'+col.main+'11;border:1px solid '+col.main+'22;border-radius:12px"><div style="font-size:12px;font-weight:bold;color:'+col.main+';margin-bottom:8px">📊 月度统计</div><div style="font-size:11px;opacity:.6;line-height:1.8">坚持就是胜利——每天完成任何一项都是功德。连续修行21天将形成习惯。修行不在于做了多少，而在于不间断地做。一天不修一天空，一天坚持一天功。</div></div>';

  el.innerHTML = html;
}

window.FaithContentRenderer.renderPracticeAphorisms = renderPracticeAphorisms;
window.FaithContentRenderer.renderMonthlyPracticeCalendar = renderMonthlyPracticeCalendar;

// ====================================================================
// 戒律详解渲染器
// ====================================================================
function renderPreceptsDetail(el, faith) {
  let col = COLORS[faith];
  let data = {
    fo: {title:'佛教戒律详解',desc:'戒为无上菩提本，应当具足持净戒。戒律是佛教修行之基础，如同大地承载万物，一切善法皆从戒律而生。持戒不是束缚，而是对自身的保护——如同遵守交通规则才能安全抵达目的地。',items:[{name:'不杀生戒',detail:'不杀害一切有情众生。这包括了不亲手杀、不教他杀、不见杀随喜。培养慈悲心，爱护一切生命。现代生活中，还包括不虐待动物、不破坏生态环境。'},{name:'不偷盗戒',detail:'不取他人未经同意的财物。包括不偷、不抢、不骗、不贪污。广义而言，还包括不偷税漏税、不占公家便宜、不利用职权谋私。'},{name:'不邪淫戒',detail:'不与他人配偶及受保护对象发生不正当关系。在家居士遵守夫妻伦理即可，出家众则完全禁止一切性行为。现代语境下，戒邪淫有助于维护家庭和睦与社会秩序。'},{name:'不妄语戒',detail:'不说谎话、欺骗之语。包括不两舌（挑拨离间）、不恶口（粗言秽语）、不绮语（花言巧语惑人）。修行人应言必真实、语必利益。'},{name:'不饮酒戒',detail:'不饮用一切含酒精饮品及麻醉品。佛教认为酒能乱性，是产生其他过失的诱因。现代社会此戒还可延伸到远离毒品等一切令人心智昏迷的物质。'},{name:'五戒功德',detail:'持五戒可得五种功德：不杀生得健康长寿、不偷盗得财富丰足、不邪淫得家庭和睦、不妄语得信誉卓著、不饮酒得智慧清明。'}]},
    dao: {title:'道教戒律详解',desc:'道教戒律融合了道家思想和古代伦理道德，不同派别有不同的戒律体系。最基本的「老君五戒」与佛教五戒相似但有自己的传承和解释。正一道在家弟子和全真道出家弟子的戒律要求也有所不同。',items:[{name:'初真五戒',detail:'一、不杀生（含不食牛肉、狗肉、泥鳅、鳝鱼——道教四不食）；二、不偷盗；三、不邪淫（全真道要求完全禁欲）；四、不妄语；五、不饮酒（全真道禁酒，正一道适度不禁）。'},{name:'初真十戒',detail:'在五戒基础上增加：六、不得叛逆君王、不孝父母；七、不得毁谤道法、轻慢经书；八、不得贪求无厌、积财不散；九、不得交游非贤、居处杂秽；十、不得轻忽言笑、举动非真。'},{name:'全真道三坛大戒',detail:'全真道比照佛教三坛大戒设立：初真戒（基础戒律）、中极戒（进阶戒律，三百条）、天仙大戒（最高级戒律，不可计数）。受戒者须经过严格的师传考核，出家住观修行。'},{name:'戊不朝真',detail:'道教独有的禁忌——逢戊日（天干为戊的日子）不烧香、不诵经、不拜神、不行法事。戊日被视为天地交泰之日，应静养不扰。六戊月（戊子、戊寅、戊辰、戊午、戊申、戊戌月）尤需注意。'}]},
    ru: {title:'儒家修身戒律',desc:'儒家虽无宗教意义的戒律，但有自己的修身规范体系。孔子的「四勿」——非礼勿视、非礼勿听、非礼勿言、非礼勿动——可谓是儒家的行为准则。此外还有「君子九思」「君子三戒」等修行指南。',items:[{name:'君子三戒',detail:'孔子曰：少之时，血气未定，戒之在色；及其壮也，血气方刚，戒之在斗；及其老也，血气既衰，戒之在得。少年戒色、壮年戒斗、老年戒贪。'},{name:'君子九思',detail:'视思明（看要看清）、听思聪（听要听明）、色思温（脸色温和）、貌思恭（仪态恭敬）、言思忠（言语忠实）、事思敬（做事认真）、疑思问（有疑请教）、忿思难（发怒考虑后果）、见得思义（获利考虑是否合乎道义）。'}]}
  };
  let d = data[faith] || data.fo;
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:'+col.main+';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">⚖️ '+d.title+'</h3><p style="font-size:12px;opacity:.5">戒为修行之基 · 了解戒律 · 受持戒律</p></div>';
  html += '<div style="background:'+col.main+'11;border:1px solid '+col.main+'22;border-radius:12px;padding:16px;margin-bottom:16px"><div style="font-size:12px;opacity:.75;line-height:1.8">'+d.desc+'</div></div>';
  html += '<div style="display:grid;gap:10px">';
  d.items.forEach(function(item){html+='<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:14px"><div style="font-size:13px;font-weight:bold;color:'+col.main+';margin-bottom:6px">📜 '+item.name+'</div><div style="font-size:12px;opacity:.7;line-height:1.8">'+item.detail+'</div></div>';});
  html += '</div>';
  el.innerHTML = html;
}

window.FaithContentRenderer.renderPreceptsDetail = renderPreceptsDetail;

// ====================================================================
// 模块：新 — 诞辰节日日历（倒计时 + 即将到来的圣诞）
// ====================================================================
function renderBirthdayCalendar(el, faith) {
  let col = COLORS[faith].main;
  let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
  let FK_data = FK || window.FAITH_KNOWLEDGE || {};
  let deities = FK_data.deities ? (FK_data.deities[faithKey] || []) : [];
  let festivals = FK_data.festivalCalendar || [];

  let html = '';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="color:' + col + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:3px">🎂 诞辰节日历</h3>';
  html += '<p style="font-size:12px;opacity:.5;margin-top:4px">神仙圣诞 · 重要节日 · 参拜时机</p>';
  html += '</div>';

  // 农历月份映射（简化）
  let lunarMonths = {
    '正':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'十一':11,'腊':12
  };

  function lunarToMonthKey(lunar) {
    // 提取农历月份信息
    for (let key in lunarMonths) {
      if (lunar.indexOf(key) >= 0) {
        return lunarMonths[key];
      }
    }
    return null;
  }

  function getCountdown(lunar) {
    // 简单倒计时（基于农历月份估算）
    let m = lunarToMonthKey(lunar);
    if (m === null) return '';
    let now = new Date();
    let currentMonth = now.getMonth() + 1; // 1-12
    let diff = m - currentMonth;
    if (diff < 0) diff += 12;
    if (diff === 0) return '<span style="color:#e74c3c">🔥 即将到来！</span>';
    if (diff === 1) return '<span style="color:#f39c12">约 ' + diff + '个月后</span>';
    return '<span style="opacity:.4">约 ' + diff + '个月后</span>';
  }

  // Filter deities with birthday
  let birthdayDeities = deities.filter(function(d) { return d.birthday; });
  
  if (birthdayDeities.length > 0) {
    html += '<h4 style="color:' + col + ';font-size:13px;margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px">🙏 本教神仙圣诞</h4>';
    html += '<div style="display:grid;gap:10px">';
    birthdayDeities.forEach(function(d) {
      let countdown = getCountdown(d.birthday);
      let temple = d.templeLocation || d.temple || '';
      html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px 14px">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
      html += '<span style="font-size:14px;font-weight:bold;color:' + col + '">' + d.name + '</span>';
      html += '<span style="font-size:11px;opacity:.5">' + d.birthday + '</span>';
      html += '</div>';
      if (d.templeFestival) {
        html += '<div style="font-size:11px;opacity:.4;margin-bottom:4px">📅 ' + d.templeFestival + '</div>';
      }
      if (temple) {
        html += '<div style="font-size:11px;opacity:.5;margin-bottom:4px">📍 ' + temple + '</div>';
      }
      html += '<div style="font-size:11px;text-align:right">' + countdown + '</div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // Festival calendar - show next 6 upcoming festivals
  html += '<h4 style="color:' + col + ';font-size:13px;margin:20px 0 12px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px">📅 重要节日一览</h4>';
  let relevantFestivals = festivals.filter(function(f) {
    return f.faith === faith || f.faith === 'folk';
  });
  
  html += '<div style="display:grid;gap:8px">';
  relevantFestivals.slice(0, 12).forEach(function(f) {
    let countdown = getCountdown(f.lunar);
    html += '<div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:10px 12px;display:flex;justify-content:space-between;align-items:center">';
    html += '<div>';
    html += '<div style="font-size:13px;font-weight:bold;color:' + col + '">' + f.name + '</div>';
    html += '<div style="font-size:11px;opacity:.4;margin-top:2px">' + f.lunar + ' · ' + f.faith.toUpperCase() + '</div>';
    if (f.detail) {
      html += '<div style="font-size:11px;opacity:.5;margin-top:3px;line-height:1.5">' + f.detail + '</div>';
    }
    html += '</div>';
    html += '<div style="font-size:11px;text-align:right;white-space:nowrap;margin-left:8px">' + countdown + '</div>';
    html += '</div>';
  });
  html += '</div>';

  el.innerHTML = html;
}

// ====================================================================
// 模块：新 — 寺庙参拜攻略（各菩萨/神仙的道场 + 供奉指南）
// ====================================================================
function renderTempleGuide(el, faith) {
  let col = COLORS[faith].main;
  let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
  let FK_data = FK || window.FAITH_KNOWLEDGE || {};
  let deities = FK_data.deities ? (FK_data.deities[faithKey] || []) : [];

  let html = '';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="color:' + col + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:3px">🏛️ 名山道场 · 参拜攻略</h3>';
  html += '<p style="font-size:12px;opacity:.5;margin-top:4px">朝圣指路 · 供奉指南 · 注意事项</p>';
  html += '</div>';

  // General etiquette
  html += '<div style="background:' + col + '11;border:1px solid ' + col + '22;border-radius:12px;padding:16px;margin-bottom:20px">';
  html += '<div style="font-size:14px;font-weight:bold;color:' + col + ';margin-bottom:10px">🕯️ 参拜通用礼仪</div>';
  let tips = [
    '进殿脱帽、摘墨镜，手机静音或关闭',
    '男左女右跨门槛（不走正中间），踩门槛为大不敬',
    '礼佛三拜：合十 → 弯腰 → 跪拜 → 额头触地 → 起身',
    '上香三支（表佛、法、僧三宝，或天地人三才）',
    '上香时左手持香（惯用左手者反之），香不过肩',
    '殿内不大声喧哗，不对佛像指指点点',
    '孕妇、生理期女性可跪拜，不入殿亦可',
    '持香时不进食用手抓物，先净手再上香'
  ];
  tips.forEach(function(t) {
    html += '<div style="font-size:12px;color:rgba(255,255,255,.7);line-height:1.8;padding:3px 0">✓ ' + t + '</div>';
  });
  html += '</div>';

  // Deity-specific temple tips
  let withTemple = deities.filter(function(d) { return d.temple; });
  if (withTemple.length === 0) {
    html += '<div style="text-align:center;padding:30px;opacity:.4">暂无道场数据</div>';
  } else {
    html += '<div style="display:grid;gap:14px">';
    withTemple.forEach(function(d) {
      html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px">';
      html += '<div style="font-size:15px;font-weight:bold;color:' + col + ';margin-bottom:8px">' + d.name + '</div>';
      
      if (d.temple) {
        html += '<div style="font-size:12px;opacity:.6;margin-bottom:6px">📍 <strong>主道场：</strong>' + d.temple + '</div>';
      }
      if (d.templeFestival) {
        html += '<div style="font-size:12px;opacity:.6;margin-bottom:6px">🎂 <strong>圣诞：</strong>' + d.templeFestival + '</div>';
      }
      if (d.templeOffering) {
        html += '<div style="background:rgba(255,255,255,.03);border-radius:6px;padding:8px 10px;margin:8px 0">';
        html += '<div style="font-size:11px;color:' + col + ';font-weight:bold;margin-bottom:4px">🎁 推荐贡品</div>';
        html += '<div style="font-size:12px;opacity:.7">' + d.templeOffering + '</div>';
        html += '</div>';
      }
      if (d.templeTip) {
        html += '<div style="background:' + col + '0a;border-left:3px solid ' + col + ';padding:8px 10px;border-radius:0 6px 6px 0;margin-top:8px">';
        html += '<div style="font-size:11px;color:' + col + ';font-weight:bold;margin-bottom:4px">💡 参拜提示</div>';
        html += '<div style="font-size:12px;opacity:.7;line-height:1.6">' + d.templeTip + '</div>';
        html += '</div>';
      }
      html += '</div>';
    });
    html += '</div>';
  }

  // Annual festival guide
  html += '<div style="margin-top:24px">';
  html += '<div style="font-size:14px;font-weight:bold;color:' + col + ';margin-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px">🗓️ 年度朝圣月历</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">';
  let months = [
    ['正月','弥勒/玉帝','过年香火最旺'],
    ['二月','观音出家/老君','浴佛节/道祖诞'],
    ['三月','真武/妈祖','武当朝山/海上祈福'],
    ['四月','文殊/释迦牟尼','考试祈福/浴佛节'],
    ['五月','关帝','武财神圣诞'],
    ['六月','观音成道','观音三大圣诞之二'],
    ['七月','地藏王','盂兰盆/超度月'],
    ['八月','孔子/月老','教师节/姻缘月'],
    ['九月','观音出家/药师','清净修行/健康月'],
    ['十月','寒衣节','祭祖送寒衣'],
    ['十一月','太乙/阿弥陀','荐亡超度月'],
    ['腊月','腊八/尾牙','佛诞日/谢神']
  ];
  months.forEach(function(m) {
    html += '<div style="background:rgba(255,255,255,.02);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:8px;text-align:center">';
    html += '<div style="font-size:12px;font-weight:bold;color:' + col + '">' + m[0] + '</div>';
    html += '<div style="font-size:10px;opacity:.6;margin-top:2px">' + m[1] + '</div>';
    html += '<div style="font-size:9px;opacity:.4;margin-top:2px">' + m[2] + '</div>';
    html += '</div>';
  });
  html += '</div></div>';

  el.innerHTML = html;
}

// ====================================================================
// 模块：新 — 每日修行功课（晨起/午前/午时/暮时/夜间）
// ====================================================================
function renderDailyPractice(el, faith) {
  let col = COLORS[faith].main;
  let FK_data = FK || window.FAITH_KNOWLEDGE || {};
  let practices = FK_data.dailyPractices || {};
  let data = practices[faith] || null;

  let html = '';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<h3 style="color:' + col + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:3px">📋 每日修行功课</h3>';
  html += '<p style="font-size:12px;opacity:.5;margin-top:4px">晨起诵经 · 日间省思 · 暮时持念 · 夜间忏悔</p>';
  html += '</div>';

  if (!data) {
    html += '<div style="text-align:center;padding:40px;opacity:.4">修行功课数据加载中...</div>';
    el.innerHTML = html;
    return;
  }

  html += '<div style="background:' + col + '11;border:1px solid ' + col + '22;border-radius:12px;padding:16px;margin-bottom:20px;text-align:center">';
  html += '<div style="font-size:20px;font-weight:bold;color:' + col + ';font-family:Ma Shan Zheng,serif;letter-spacing:3px">' + data.title + '</div>';
  html += '<div style="font-size:12px;opacity:.5;margin-top:4px">' + data.subtitle + '</div>';
  if (data.mantra) {
    html += '<div style="margin-top:10px;padding:10px;background:rgba(255,255,255,.03);border-radius:8px;font-size:13px;font-style:italic;color:var(--gold)">📿 ' + data.mantra + '</div>';
  }
  html += '</div>';

  // Daily schedule
  if (data.schedule && data.schedule.length > 0) {
    data.schedule.forEach(function(item) {
      html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px;margin-bottom:12px">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">';
      html += '<span style="font-size:13px;font-weight:bold;color:' + col + ';white-space:nowrap">' + item.period + '</span>';
      html += '<div style="flex:1;height:1px;background:linear-gradient(90deg,' + col + '44,transparent)"></div>';
      html += '</div>';
      html += '<div style="font-size:13px;font-weight:bold;color:var(--gold);margin-bottom:4px">' + item.practice + '</div>';
      html += '<div style="font-size:11px;opacity:.4;margin-bottom:6px">' + item.intention + '</div>';
      html += '<div style="font-size:12px;opacity:.6;line-height:1.7;padding:8px;background:rgba(255,255,255,.02);border-radius:6px">' + item.method + '</div>';
      html += '</div>';
    });
  }

  // Monthly focus
  if (data.monthlyFocus && data.monthlyFocus.length > 0) {
    html += '<div style="margin-top:8px">';
    html += '<div style="font-size:13px;font-weight:bold;color:' + col + ';margin-bottom:10px;border-bottom:1px solid rgba(255,255,255,.06);padding-bottom:8px">📆 月度重点</div>';
    html += '<div style="display:grid;gap:6px">';
    data.monthlyFocus.forEach(function(month) {
      let parts = month.split('：');
      let m = parts[0] || '';
      let desc = parts.slice(1).join('：') || month;
      html += '<div style="display:flex;align-items:center;gap:8px;padding:6px 0;font-size:12px">';
      html += '<span style="color:' + col + ';font-weight:bold;min-width:36px">' + m + '</span>';
      html += '<span style="opacity:.7">' + desc + '</span>';
      html += '</div>';
    });
    html += '</div></div>';
  }

  el.innerHTML = html;
}

// ====================================================================
// 念佛/持咒计数器渲染器
// ====================================================================
function renderChantingCounter(el, faith) {
  let col = COLORS[faith];
  let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
  let counters = {
    buddhist: [
      {id:'namo_amituofo', name:'南无阿弥陀佛', shortName:'阿弥陀佛', icon:'📿', desc:'净土宗核心佛号，一句佛号灭八十亿劫生死重罪', target:10000},
      {id:'namo_guanshiyin', name:'南无观世音菩萨', shortName:'观音菩萨', icon:'🪷', desc:'大慈大悲救苦救难，千处祈求千处应', target:3000},
      {id:'om_manipadme_hum', name:'唵嘛呢叭咪吽', shortName:'六字大明咒', icon:'💎', desc:'观音菩萨心咒，总集一切诸佛慈悲与加持', target:1000},
      {id:'heart_sutra', name:'般若波罗蜜多心经', shortName:'心经', icon:'📜', desc:'般若智慧之精髓，照见五蕴皆空度一切苦厄', target:21},
      {id:'great_compassion', name:'大悲咒', shortName:'大悲咒', icon:'🌊', desc:'千手千眼观世音菩萨广大圆满无碍大悲心陀罗尼', target:7},
      {id:'namo_dizang', name:'南无地藏王菩萨', shortName:'地藏菩萨', icon:'🌑', desc:'地狱不空誓不成佛，超度先人消业障最殊胜', target:3000}
    ],
    taoist: [
      {id:'taishang_laojun', name:'太乙救苦天尊', shortName:'救苦天尊', icon:'🌟', desc:'太乙救苦天尊寻声赴感，救苦拔罪', target:1000},
      {id:'changqing_jing', name:'太上老君说常清静经', shortName:'清静经', icon:'☯️', desc:'道教核心经典，清静身心降服妄想', target:21},
      {id:'beidou_jing', name:'北斗经', shortName:'北斗经', icon:'⭐', desc:'北斗七星延生保命妙经，消灾延寿', target:7},
      {id:'yuhuang_haosheng', name:'玉皇赦罪天尊', shortName:'玉皇天尊', icon:'👑', desc:'玉皇大帝赦罪赐福，消灾解厄', target:1000},
      {id:'sanqing_sheng', name:'三清圣号', shortName:'三清', icon:'🏔️', desc:'皈依三清：玉清元始天尊、上清灵宝天尊、太清道德天尊', target:108}
    ],
    confucian: [
      {id:'lunyu_reading', name:'论语诵读', shortName:'论语', icon:'📖', desc:'每日诵读论语，日积月累温故知新', target:7},
      {id:'daxue_zhongyong', name:'大学中庸诵读', shortName:'学庸', icon:'📚', desc:'大学之道在明明德，中庸之道致中和', target:3}
    ]
  };
  let counterItems = counters[faithKey] || counters.buddhist;
  let colMain = COLORS[faith].main;
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:' + colMain + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">📿 念诵计数器</h3><p style="font-size:12px;opacity:.5">每日持诵打卡 · 日课精进 · 水滴石穿</p></div>';
  html += '<div style="display:grid;gap:14px">';
  counterItems.forEach(function(item) {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid ' + colMain + '33;border-radius:14px;padding:16px;position:relative;overflow:hidden"><div style="position:absolute;left:0;top:0;height:100%;background:' + colMain + '11;border-radius:14px 0 0 14px;transition:width .5s;z-index:0" id="prog_' + item.id + '"></div><div style="position:relative;z-index:1"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px"><div style="display:flex;align-items:center;gap:8px"><span style="font-size:24px">' + item.icon + '</span><div><div style="font-size:15px;font-weight:bold;color:' + colMain + '">' + item.name + '</div><div style="font-size:10px;opacity:.5">' + item.desc + '</div></div></div><div style="text-align:right"><div style="font-size:28px;font-weight:bold;color:' + colMain + '" id="count_' + item.id + '">0</div><div style="font-size:10px;opacity:.4">目标：' + item.target + '次/日</div></div></div><div style="display:flex;gap:6px;align-items:center"><button style="flex:1;padding:10px;background:' + colMain + ';border:none;border-radius:8px;color:#fff;font-size:14px;font-weight:bold;cursor:pointer">🔢 +1</button><button style="padding:10px 12px;background:' + colMain + '88;border:none;border-radius:8px;color:#fff;font-size:12px;cursor:pointer">+10</button><button style="padding:10px 12px;background:' + colMain + '44;border:none;border-radius:8px;color:#fff;font-size:12px;cursor:pointer">+50</button><button style="padding:10px 12px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:8px;color:rgba(255,255,255,.5);font-size:12px;cursor:pointer">↺</button></div></div></div>';
  });
  html += '</div>';
  html += '<div style="margin-top:16px;padding:16px;background:' + colMain + '11;border:1px solid ' + colMain + '22;border-radius:14px;text-align:center"><div style="font-size:12px;opacity:.5;margin-bottom:8px">📊 今日念诵总计（页面刷新会清零）</div><div style="font-size:11px;opacity:.4">计数功能为前端临时统计，可用于每日定课辅助。精进修行，贵在坚持。</div></div>';
  el.innerHTML = html;
}

// ====================================================================
// 诵经记录渲染器
// ====================================================================
function renderSutraRecitationRecord(el, faith) {
  let col = COLORS[faith];
  let colMain = col.main;
  let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
  let sutras = {
    buddhist: [
      {name:'《心经》', icon:'📜', fullName:'般若波罗蜜多心经', length:260, timePer:'约3分钟'},
      {name:'《金刚经》', icon:'💎', fullName:'金刚般若波罗蜜经', length:5175, timePer:'约40分钟'},
      {name:'《阿弥陀经》', icon:'🪷', fullName:'佛说阿弥陀经', length:1858, timePer:'约15分钟'},
      {name:'《地藏经》', icon:'🌑', fullName:'地藏菩萨本愿经', length:17000, timePer:'约90分钟'},
      {name:'《普门品》', icon:'🌊', fullName:'观世音菩萨普门品', length:2100, timePer:'约20分钟'},
      {name:'《药师经》', icon:'💊', fullName:'药师琉璃光如来本愿功德经', length:6500, timePer:'约50分钟'}
    ],
    taoist: [
      {name:'《清静经》', icon:'☯️', fullName:'太上老君说常清静经', length:519, timePer:'约5分钟'},
      {name:'《道德经》', icon:'📖', fullName:'道德经', length:5000, timePer:'约40分钟'},
      {name:'《太上感应篇》', icon:'⚡', fullName:'太上感应篇', length:1277, timePer:'约10分钟'},
      {name:'《北斗经》', icon:'⭐', fullName:'北斗七星延生保命妙经', length:1600, timePer:'约15分钟'}
    ],
    confucian: [
      {name:'《论语》', icon:'🎓', fullName:'论语(选篇)', length:10000, timePer:'约60分钟'},
      {name:'《大学》', icon:'📚', fullName:'大学', length:1753, timePer:'约15分钟'}
    ]
  };
  let list = sutras[faithKey] || sutras.buddhist;
  let now = new Date();
  let today = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:' + colMain + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">📖 诵经记录</h3><p style="font-size:12px;opacity:.5">今日：' + today + ' · 日诵一经身心清净</p></div>';
  html += '<div style="display:grid;gap:12px">';
  list.forEach(function(s) {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid ' + colMain + '33;border-radius:12px;padding:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:10px"><span style="font-size:24px">' + s.icon + '</span><div style="flex:1"><div style="font-size:15px;font-weight:bold;color:' + colMain + '">' + s.name + '</div><div style="font-size:10px;opacity:.4">' + s.fullName + ' · ' + s.length + '字 · ' + s.timePer + '</div></div><div style="text-align:right"><div style="font-size:10px;opacity:.4">每次诵经功德</div><div style="font-size:11px;color:#27ae60">消业障 · 增智慧 · 种善根</div></div></div></div>';
  });
  html += '</div>';
  html += '<div style="margin-top:16px;padding:16px;background:' + colMain + '11;border:1px solid ' + colMain + '22;border-radius:12px"><div style="font-size:13px;font-weight:bold;color:' + colMain + ';margin-bottom:10px">📝 诵经修行建议</div><div style="font-size:11px;opacity:.7;line-height:1.8">• 每日固定时间诵经，形成习惯久久为功<br>• 诵经前净手端坐，身心清净方可入经藏<br>• 诵经时字字分明，不起妄想杂念<br>• 诵经后回向法界一切众生，功德更大<br>• 用笔记本记录每日诵经内容追踪修行进度</div></div>';
  el.innerHTML = html;
}

// ====================================================================
// 回向文渲染器
// ====================================================================
function renderDedicationOfMerit(el, faith) {
  let col = COLORS[faith];
  let colMain = col.main;
  let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
  let dedications = {
    buddhist: [
      {name:'普回向偈',icon:'🪷',occasion:'每次念佛诵经后通用回向',text:'愿以此功德，庄严佛净土。上报四重恩，下济三途苦。若有见闻者，悉发菩提心。尽此一报身，同生极乐国。',note:'最通用的回向偈，适用于一切修行功德回向，简单全面。'},
      {name:'往生西方回向文',icon:'🌅',occasion:'超度先人、为亡者念佛回向',text:'愿生西方净土中，九品莲花为父母。花开见佛悟无生，不退菩萨为伴侣。',note:'净土宗最常用回向文，愿先人及一切众生往生极乐世界。'},
      {name:'消灾延寿回向文',icon:'🙏',occasion:'生病或消灾时回向',text:'以此诵经念佛功德，回向弟子累生累世冤亲债主、历代宗亲。愿他们离苦得乐、往生净土。回向弟子病苦消除、灾障远离、身心安康、福慧增长。',note:'将功德回向冤亲债主化解累世恩怨，同时回向自身消灾延寿。'},
      {name:'随喜回向文',icon:'✨',occasion:'随喜他人善行时回向',text:'十方一切诸众生，二乘有学及无学，一切如来与菩萨，所有功德皆随喜。',note:'《普贤行愿品》随喜功德偈，见人行善心生欢喜即获同等功德。'},
      {name:'个人祈愿回向',icon:'📝',occasion:'有具体祈愿时回向',text:'弟子某甲，愿以今日所有修行善根功德，回向法界一切众生共成佛道。特别回向：(个人祈愿)。愿所求满愿、道业早成。',note:'通用回向后加个人祈愿，不应仅为自己回向，应普皆回向。'}
    ],
    taoist: [
      {name:'皈命回向文',icon:'☯️',occasion:'每次诵经或朝真后回向',text:'愿以修持功德力，回向十方诸众生。同证无为自然道，与道合真返本源。',note:'道教通用回向文，将功德回向法界众生同证大道。'},
      {name:'消灾解厄回向文',icon:'🌟',occasion:'消灾解厄时回向',text:'伏以道祖慈悲，赦除罪咎。弟子诚心忏悔，愿将诵经礼忏功德，回向消解前生今世一切罪愆。上祈北斗解厄，下祈本命延生。灾消祸散，福寿康宁。',note:'拜斗或诵北斗经后回向，祈求消灾延寿解厄呈祥。'}
    ],
    confucian: [
      {name:'修身回向文',icon:'🎓',occasion:'每日研读经典后',text:'学而时习之，温故而知新。愿今日所习圣贤之道，能化为明德新民之实。修身齐家，以报天地君亲师之恩。',note:'儒家修身回向，将学问化为实践、智慧融入生活。'}
    ]
  };
  let items = dedications[faithKey] || dedications.buddhist;
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:' + colMain + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">🙏 功德回向</h3><p style="font-size:12px;opacity:.5">修行功德回向众生 · 心量广大福报无量</p></div>';
  html += '<div style="background:' + colMain + '11;border:1px solid ' + colMain + '22;border-radius:12px;padding:16px;margin-bottom:16px"><div style="font-size:13px;font-weight:bold;color:' + colMain + ';margin-bottom:8px">💡 回向的意义</div><div style="font-size:12px;opacity:.75;line-height:1.8">回向是将自己所修功德转向施与他人，扩大心量、增长慈悲。如同点亮一支蜡烛，用它点亮更多蜡烛——自身光明不减，世间光明倍增。佛教强调普皆回向法界一切众生；道教强调功德积累回向先祖和众生；儒家以修身之学回向齐家治国平天下。</div></div>';
  html += '<div style="display:grid;gap:14px">';
  items.forEach(function(item) {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid ' + colMain + '33;border-radius:12px;overflow:hidden"><div style="padding:14px;border-bottom:1px solid rgba(255,255,255,.05);display:flex;align-items:center;gap:10px"><span style="font-size:28px">' + item.icon + '</span><div><div style="font-size:14px;font-weight:bold;color:' + colMain + '">' + item.name + '</div><div style="font-size:11px;opacity:.5">📌 ' + item.occasion + '</div></div></div><div style="padding:14px;background:rgba(0,0,0,.15);font-size:14px;line-height:2;color:rgba(255,255,255,.85);text-align:center;white-space:pre-line;font-family:Ma Shan Zheng,serif;letter-spacing:1px">' + item.text + '</div><div style="padding:10px 14px;font-size:11px;opacity:.5;border-top:1px solid rgba(255,255,255,.03)">💬 ' + item.note + '</div></div>';
  });
  html += '</div>';
  html += '<div style="margin-top:16px;padding:16px;background:' + colMain + '11;border:1px solid ' + colMain + '22;border-radius:12px"><div style="font-size:13px;font-weight:bold;color:' + colMain + ';margin-bottom:10px">✅ 每次修行后请检查：</div><div style="font-size:11px;opacity:.7;line-height:2">□ 是否先大回向再小回向？<br>□ 回向对象是否包含冤亲债主和历代宗亲？<br>□ 是否不仅为自己回向也为他人的安乐回向？<br>□ 回向时心量是否广大真诚无私？<br>□ 是否将今日所有善业都做了回向？</div></div>';
  el.innerHTML = html;
}

// ====================================================================
// 寺院导航渲染器
// ====================================================================
function renderTempleNavigation(el, faith) {
  let col = COLORS[faith];
  let colMain = col.main;
  let faithKey = faith === 'fo' ? 'buddhist' : faith === 'dao' ? 'taoist' : 'confucian';
  let regions = {
    buddhist: [
      {region:'华北',temples:[{name:'雍和宫',loc:'北京东城',note:'藏传皇家寺院，26米弥勒木雕世界之最',deity:'宗喀巴大师'},{name:'广济寺',loc:'北京西城',note:'中国佛教协会所在地',deity:'释迦牟尼佛'},{name:'灵光寺',loc:'北京石景山',note:'供奉佛祖牙舍利',deity:'佛牙舍利'},{name:'五台山',loc:'山西忻州',note:'文殊菩萨道场，四大名山',deity:'文殊菩萨'}]},
      {region:'华东',temples:[{name:'普陀山',loc:'浙江舟山',note:'观音菩萨道场，海天佛国',deity:'观世音菩萨'},{name:'灵隐寺',loc:'浙江杭州',note:'韦驮菩萨求正财灵验',deity:'释迦牟尼佛'},{name:'九华山',loc:'安徽池州',note:'地藏菩萨道场，超度先人',deity:'地藏王菩萨'},{name:'国清寺',loc:'浙江台州',note:'天台宗祖庭，智者大师创立',deity:'释迦牟尼佛'}]},
      {region:'华南',temples:[{name:'南华禅寺',loc:'广东韶关',note:'六祖惠能肉身所在',deity:'六祖惠能'},{name:'光孝寺',loc:'广东广州',note:'六祖剃度处，风幡之辩',deity:'六祖惠能'},{name:'开元寺',loc:'福建泉州',note:'东西双塔镇守泉州',deity:'五方佛'}]},
      {region:'华中',temples:[{name:'少林寺',loc:'河南登封',note:'禅宗祖庭和武术发源地',deity:'达摩祖师'},{name:'白马寺',loc:'河南洛阳',note:'中国第一古刹',deity:'释迦牟尼佛'},{name:'归元寺',loc:'湖北武汉',note:'五百罗汉数罗汉',deity:'五百罗汉'}]},
      {region:'西南',temples:[{name:'峨眉山',loc:'四川乐山',note:'普贤菩萨道场',deity:'普贤菩萨'},{name:'文殊院',loc:'四川成都',note:'文殊菩萨求智慧学业',deity:'文殊菩萨'}]},
      {region:'西北',temples:[{name:'法门寺',loc:'陕西宝鸡',note:'供奉佛祖指骨舍利',deity:'佛指舍利'},{name:'大慈恩寺',loc:'陕西西安',note:'玄奘译经处大雁塔',deity:'玄奘法师'}]},
      {region:'西藏',temples:[{name:'大昭寺',loc:'西藏拉萨',note:'佛祖12岁等身像',deity:'释迦牟尼佛'},{name:'扎什伦布寺',loc:'西藏日喀则',note:'班禅驻锡地',deity:'强巴佛'}]}
    ],
    taoist: [
      {region:'华北',temples:[{name:'白云观',loc:'北京西城',note:'全真道三大祖庭之一',deity:'丘处机'},{name:'永乐宫',loc:'山西运城',note:'元代壁画巅峰朝元图',deity:'吕洞宾'}]},
      {region:'华东',temples:[{name:'龙虎山',loc:'江西鹰潭',note:'正一道祖庭天师府',deity:'张天师'},{name:'茅山',loc:'江苏句容',note:'上清派祖庭符箓驱邪',deity:'三茅真君'}]},
      {region:'华中',temples:[{name:'武当山',loc:'湖北十堰',note:'真武大帝道场皇家道场',deity:'真武大帝'},{name:'中岳庙',loc:'河南登封',note:'五岳最大岳庙',deity:'中岳大帝'}]},
      {region:'西南',temples:[{name:'青城山',loc:'四川成都',note:'道教发源地',deity:'张天师'},{name:'青羊宫',loc:'四川成都',note:'摸青羊求福求姻缘',deity:'太上老君'}]},
      {region:'西北',temples:[{name:'楼观台',loc:'陕西周至',note:'老子说经台道教祖庭',deity:'太上老君'},{name:'华山',loc:'陕西华阴',note:'西岳大帝金锁关挂锁',deity:'西岳大帝'}]}
    ],
    confucian: [
      {region:'山东',temples:[{name:'曲阜孔庙',loc:'山东曲阜',note:'天下文庙之首',deity:'孔子'},{name:'孟庙',loc:'山东邹城',note:'亚圣孟子庙',deity:'孟子'}]},
      {region:'其他',temples:[{name:'岳麓书院',loc:'湖南长沙',note:'千年学府',deity:'孔子'},{name:'北京孔庙',loc:'北京东城',note:'元明清祭孔处',deity:'孔子'}]}
    ]
  };
  let regionList = regions[faithKey] || regions.buddhist;
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:' + colMain + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">🏛️ 寺院导航地图</h3><p style="font-size:12px;opacity:.5">按地域分类 · 快速查找 · 规划朝圣路线</p></div>';
  regionList.forEach(function(region) {
    html += '<div style="margin-bottom:18px"><div style="font-size:14px;font-weight:bold;color:' + colMain + ';margin-bottom:10px;border-bottom:1px solid ' + colMain + '33;padding-bottom:8px;display:flex;align-items:center;gap:8px"><span>📍</span> ' + region.region + ' <span style="font-size:10px;opacity:.4;font-weight:normal">(' + region.temples.length + '座)</span></div><div style="display:grid;gap:8px">';
    region.temples.forEach(function(t) {
      html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px"><div style="width:40px;height:40px;background:' + colMain + '22;border:1px solid ' + colMain + '44;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">🏛️</div><div style="flex:1;min-width:0"><div style="font-size:13px;font-weight:bold;opacity:.9">' + t.name + '</div><div style="font-size:10px;opacity:.4">📍 ' + t.loc + ' · 🏷 ' + t.deity + '</div><div style="font-size:10px;opacity:.55;margin-top:2px;line-height:1.5">' + t.note + '</div></div></div>';
    });
    html += '</div></div>';
  });
  html += '<div style="margin-top:16px;padding:16px;background:' + colMain + '11;border:1px solid ' + colMain + '22;border-radius:12px"><div style="font-size:13px;font-weight:bold;color:' + colMain + ';margin-bottom:10px">🧭 朝圣出行建议</div><div style="font-size:11px;opacity:.7;line-height:1.8">• 提前查询寺院开放时间和交通路线<br>• 重大节日提前预订住宿<br>• 山区寺院注意天气变化和登山安全<br>• 藏传佛教区域注意高原反应<br>• 建议携带：登山杖、素色衣物、保温杯、念珠</div></div>';
  el.innerHTML = html;
}

// ====================================================================
// 功德箱/功过格渲染器
// ====================================================================
function renderMeritBox(el, faith) {
  let col = COLORS[faith];
  let colMain = col.main;
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:' + colMain + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">✨ 功过格 · 日行一善</h3><p style="font-size:12px;opacity:.5">记录每日善行恶念 · 积功累德 · 三省吾身</p></div>';
  let merits = [
    {cat:'诵经念佛',items:['早课念佛30分钟','诵一部经','持咒108遍','随众共修'],points:10},
    {cat:'布施供养',items:['财布施捐赠','法布施(分享正法)','无畏布施(安慰他人)','供养三宝'],points:15},
    {cat:'放生护生',items:['放生','素食一日','救助动物','环保行动'],points:20},
    {cat:'行善助人',items:['帮助老弱','捐资助学','献血','志愿服务'],points:15},
    {cat:'忏悔反省',items:['反省一日过失','诚心忏悔','改过自新','宽容他人'],points:5},
    {cat:'禅修静坐',items:['静坐15分钟','正念行走','深度禅修30分钟','睡前感恩'],points:10}
  ];
  html += '<div style="display:grid;gap:10px">';
  merits.forEach(function(g) {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><span style="font-size:13px;font-weight:bold;color:' + colMain + '">' + g.cat + '</span><span style="font-size:10px;opacity:.4">+ ' + g.points + '功/件</span></div><div style="display:flex;flex-wrap:wrap;gap:6px">';
    g.items.forEach(function(item) {
      html += '<label style="display:flex;align-items:center;gap:5px;font-size:11px;opacity:.7;cursor:pointer;background:rgba(255,255,255,.03);padding:5px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.05)"><input type="checkbox" style="accent-color:' + colMain + '"><span>' + item + '</span></label>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  html += '<div style="margin-top:16px;padding:16px;background:' + colMain + '11;border:1px solid ' + colMain + '22;border-radius:12px;text-align:center"><div style="font-size:12px;opacity:.5;margin-bottom:8px">📊 关于功过格</div><div style="font-size:11px;opacity:.6;line-height:1.8">功过格源于明代袁了凡《了凡四训》，通过记录每日善行过失自我监督、改过迁善。日行一善，积小善为大德。人非圣贤，孰能无过，过而能改，善莫大焉。</div></div>';
  el.innerHTML = html;
}

// ====================================================================
// 佛道学问答扩展
// ====================================================================
function renderFaithFAQExtended(el, faith) {
  let col = COLORS[faith];
  let colMain = col.main;
  let advancedFAQs = {
    fo: [
      {q:'佛教为什么提倡素食？',a:'佛教倡导素食基于慈悲心——不忍食众生肉。大乘经典如《楞伽经》《涅槃经》明确提倡素食。素食不仅是饮食选择，更是修行——通过不杀生培养慈悲心减少世间杀戮。在家居士不强求素食，但建议逐步减少肉食。肉边菜、三净肉(不见杀不闻杀不为我杀)是过渡的方便之法。'},
      {q:'什么是因果报应？为什么好人没好报？',a:'佛教因果律是三世因果——今生所受是过去生所造善业恶业的果报，今生所造是未来生的因。好人今生受苦难可能是在消过去恶业；恶人今生享富贵可能在消耗过去善业福报。因果不是简单的现世报，而是通三世的复杂系统。信因果而不执着结果——只管种善因，莫问果何时。'},
      {q:'在家供奉佛像有什么讲究？',a:'佛像应供奉在干净安静明亮之处，不可放卧室或卫生间旁。高度在腰部以上以表恭敬。每天可上香供水供花，供水每日更换。供佛重在诚心而非奢华——一尊佛像一杯清水足矣。保持整洁，佛前不可杂乱堆放杂物。'},
      {q:'如何选择适合自己的修行法门？',a:'佛教八万四千法门对应众生不同根性。初学者建议：先广泛了解各宗派基本教义；选择与自己性格因缘相应的法门；在善知识指导下坚持一门深入。感性者适合净土宗念佛，理性者适合禅宗参究，慈悲心重者可修观音法门。法门无高下，适合自己最重要。'}
    ],
    dao: [
      {q:'道教认为人死后去哪里？',a:'道教关于死后去向有多种说法。早期讲究承负——先人善恶影响后代。修炼有成者可尸解或白日飞升成为神仙。普通人魂魄分离，魂归太山魄归地府。南北朝后吸收佛教轮回思想，形成独特冥界审判体系。道教终极追求是超越生死——与道合真长生久视。'},
      {q:'什么是内丹修炼？',a:'内丹是道教独有的身心修炼体系。以人体为炉鼎，以精气神为药物，以呼吸意念为火候，在体内模拟外丹炼制。三步：炼精化气→炼气化神→炼神还虚。最终达到形神俱妙与道合一。内丹必须有师父指导不可盲目自学，否则有走火入魔之险。'}
    ]
  };
  let items = advancedFAQs[faith] || advancedFAQs.fo;
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:' + colMain + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">❓ 深入问答</h3><p style="font-size:12px;opacity:.5">常见修行疑惑 · 深入解答</p></div>';
  html += '<div style="display:grid;gap:10px">';
  items.forEach(function(faq,i) {
    html += '<details style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;overflow:hidden"><summary style="padding:12px 14px;font-size:13px;font-weight:bold;color:' + colMain + ';cursor:pointer">' + (i+1) + '. ' + faq.q + '</summary><div style="padding:12px 14px;font-size:12px;opacity:.75;line-height:1.8;border-top:1px solid rgba(255,255,255,.05)">' + faq.a + '</div></details>';
  });
  html += '</div>';
  el.innerHTML = html;
}

// ====================================================================
// 修行辅导卡片 - 给新信众的入门指导
// ====================================================================
function renderBeginnerGuide(el, faith) {
  let col = COLORS[faith];
  let colMain = col.main;
  let guides = {
    fo: {title:'在家学佛入门十步',icon:'🙏',steps:[
      {step:1,name:'了解基础',detail:'阅读《正信的佛教》《学佛群疑》等入门书籍，了解佛教不是迷信而是觉悟的教育。重点理解四圣谛、八正道、因果轮回等基本概念。'},
      {step:2,name:'亲近三宝',detail:'常去寺院礼拜，亲近善知识（有修有证的法师或居士）。参加寺院的法会、佛学讲座，在正法环境中耳濡目染。'},
      {step:3,name:'皈依受戒',detail:'在因缘成熟时皈依三宝（佛、法、僧），成为正式佛弟子。可进一步受持五戒（不杀盗淫妄酒），以戒律保护自己的身心。'},
      {step:4,name:'建立定课',detail:'每天固定时间诵经或念佛。初学者可从每天10分钟《心经》或念佛开始，逐步增加至30-60分钟。贵在坚持而非时长。'},
      {step:5,name:'选择法门',detail:'在初步了解各宗派后，选择与自己性格和因缘相应的法门：喜欢简单直接的选净土宗念佛；喜欢思辨的选禅宗参究；喜欢仪轨的选密宗修法。'},
      {step:6,name:'深入经藏',detail:'从基础经典开始系统学习：先读《心经》《金刚经》等般若经典打基础，再根据所选法门深入相应经典。不可贪多嚼不烂。'},
      {step:7,name:'禅修实践',detail:'开始练习静坐。初期每天5-10分钟关注呼吸（数息法），逐步延长到30分钟以上。可参加寺院的禅修活动（一日禅或禅七）系统学习。'},
      {step:8,name:'行菩萨道',detail:'修行不止于诵经打坐，更重要的是在日常生活中践行菩萨精神：布施、持戒、忍辱、精进、禅定、智慧（六度）。'},
      {step:9,name:'参加共修',detail:'找到修行道友或加入居士团体，定期共修交流。一人独修容易懈怠，共修可以互相鼓励督促。参加佛七、拜忏等集体修行活动。'},
      {step:10,name:'弘法利生',detail:'在自己修行稳固后，随缘随力弘法利生。可做法布施（分享佛法知识）、无畏布施（关怀陪伴）、财布施（随力供养），将佛法利益传递给更多人。'}
    ]},
    dao: {title:'道教修行入门指南',icon:'☯️',steps:[
      {step:1,name:'读经明理',detail:'从《道德经》入手，了解道的核心思想：道法自然、清静无为、上善若水。配合《太上感应篇》了解劝善思想。每日诵读一章并仔细体悟。'},
      {step:2,name:'皈依道经师',detail:'皈依道（宇宙本源）、经（道门经典）、师（传道明师）。可在宫观参加皈依仪式正式入道，或先在家自行学习。'},
      {step:3,name:'修身养性',detail:'道教重养生，从日常做起：饮食有节（清淡为主，不过饱过饥）、作息有常（日出而作日落而息）、劳逸结合。修炼八段锦或太极拳等导引功法。'},
      {step:4,name:'积功累德',detail:'行善积德是道教修行的基础。《太上感应篇》云："祸福无门，唯人自召。善恶之报，如影随形。"日常多行方便、广结善缘、济人之急、救人之危。'},
      {step:5,name:'拜师学道',detail:'道教修炼重在师承，尤以内丹修炼必须有明师指导。未遇明师前，先打好基础：熟读经典、修身养性、积功累德，机缘到时自然得遇明师。'}
    ]},
    ru: {title:'儒家修身入门',icon:'🎓',steps:[
      {step:1,name:'诵读四书',detail:'从《大学》《中庸》入手（篇幅短适合入门），再读《论语》《孟子》。每天诵读一篇并思考其中义理。关键是将圣贤教诲与日常生活结合起来。'},
      {step:2,name:'格物致知',detail:'研究事物的道理以增长知识。广泛阅读经典和历史著作，了解圣贤言行和历代兴衰经验。勤学善问，格一物得一理，日积月累智慧自生。'},
      {step:3,name:'诚意正心',detail:'修养内心，去除私欲杂念。每天花时间自省：今日言行是否合乎仁义？是否对得起自己的良心？通过内省和静坐来修养心性。'},
      {step:4,name:'修身齐家',detail:'在日常生活中践行仁义礼智信：孝敬父母、友爱兄弟、诚信待人、尽职尽责。先从家庭做起，家庭和睦了再推而广之服务社会。'}
    ]}
  };
  let guide = guides[faith] || guides.fo;
  let html = '<div style="text-align:center;margin-bottom:20px"><h3 style="color:' + colMain + ';font-family:Ma Shan Zheng,serif;font-size:18px;letter-spacing:4px">' + guide.icon + ' ' + guide.title + '</h3><p style="font-size:12px;opacity:.5">循序渐进 · 次第修行 · 不可躐等</p></div>';
  html += '<div style="display:grid;gap:12px">';
  guide.steps.forEach(function(s) {
    html += '<div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px;display:flex;gap:12px"><div style="width:40px;height:40px;background:' + colMain + '22;border:1px solid ' + colMain + '44;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:bold;color:' + colMain + ';flex-shrink:0">' + s.step + '</div><div><div style="font-size:14px;font-weight:bold;color:' + colMain + ';margin-bottom:4px">' + s.name + '</div><div style="font-size:12px;opacity:.7;line-height:1.8">' + s.detail + '</div></div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

window.FaithContentRenderer.renderBeginnerGuide = renderBeginnerGuide;

