/**
 * TCM-Agent 全局智能搜索组件 V1.0
 * 使用方式：页面引用 <script src="js/smart-search.js"></script>
 * 自动注入顶部搜索框，支持跨实体检索（方剂/穴位/知识/症状/病例）
 * 依赖：反向代理（/api/*）
 */
(function() {
  'use strict';
  if (typeof window === 'undefined') return;
  if (window.TCM_SMART_SEARCH) return;

  // ═══ 搜索实体类型 ═══
  var SEARCH_TYPES = [
    { key: 'all',       label: '全部',    icon: '🔍' },
    { key: 'patient',   label: '患者',    icon: '👤', endpoint: '/api/patients/list?q=' },
    { key: 'formula',   label: '方剂',    icon: '💊', endpoint: '/api/tcm/formula/search?q=' },
    { key: 'acupoint',  label: '穴位',    icon: '📍', endpoint: '/api/tcm/acupoint/search?q=' },
    { key: 'kb',        label: '知识库',  icon: '📚', endpoint: '/api/tcm/kb/search?q=' },
    { key: 'cases',     label: '病例',    icon: '📋', endpoint: '/api/tcm/cases/similar?symptoms=' },
  ];

  var currentType = 'all';
  var debounceTimer = null;
  var cache = {}; // query → results

  // ═══ DOM ═══
  function injectSearchBar() {
    if (document.getElementById('tcm-smart-search')) return;

    // 找注入位置：nav 之后或 body 第一个子元素
    var nav = document.getElementById('tcm-nav');
    var insertAfter = nav || document.body.firstChild;

    var container = document.createElement('div');
    container.id = 'tcm-smart-search';
    container.style.cssText = 'background:#fff;padding:6px 12px;border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:8px;flex-wrap:wrap';

    container.innerHTML = `
      <div style="position:relative;flex:1;max-width:500px;min-width:200px">
        <input type="text" id="ss-input" placeholder="🔍 患者/方剂/穴位/知识一框统搜（支持首字母直达，如 zcp/gzt/zsl）"
          style="width:100%;padding:7px 12px 7px 32px;border:1px solid #d1d5db;border-radius:20px;font-size:12px;outline:none;background:#f9fafb"
          aria-label="全局搜索" />
        <span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;pointer-events:none">🔍</span>
        <div id="ss-dropdown" style="display:none;position:absolute;top:100%;left:0;right:0;background:#fff;border:1px solid #e5e7eb;border-radius:8px;margin-top:4px;max-height:360px;overflow-y:auto;z-index:200;box-shadow:0 4px 12px rgba(0,0,0,.08)"></div>
      </div>
      <div id="ss-tabs" style="display:flex;gap:3px">
        ${SEARCH_TYPES.map(function(t) {
          return '<span class="ss-tab' + (t.key === 'all' ? ' active' : '') + '" data-type="' + t.key + '" style="padding:3px 8px;border-radius:4px;font-size:10px;cursor:pointer;background:' + (t.key === 'all' ? '#fef3c7;color:#92400e' : '#f3f4f6;color:#6b7280') + '">' + t.icon + ' ' + t.label + '</span>';
        }).join('')}
      </div>
    `;

    if (nav && nav.parentNode) {
      nav.parentNode.insertBefore(container, nav.nextSibling);
    } else {
      document.body.insertBefore(container, document.body.firstChild);
    }

    // 绑定事件
    var input = document.getElementById('ss-input');
    input.addEventListener('input', function() {
      clearTimeout(debounceTimer);
      var q = input.value.trim();
      if (q.length < 1) {
        document.getElementById('ss-dropdown').style.display = 'none';
        return;
      }
      debounceTimer = setTimeout(function() { doSearch(q); }, 300);
    });

    input.addEventListener('focus', function() {
      if (input.value.trim()) doSearch(input.value.trim());
    });

    document.addEventListener('click', function(e) {
      if (!container.contains(e.target)) {
        document.getElementById('ss-dropdown').style.display = 'none';
      }
    });

    // Tab 切换
    var tabs = container.querySelectorAll('.ss-tab');
    tabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        currentType = tab.getAttribute('data-type');
        tabs.forEach(function(t) {
          t.style.background = '#f3f4f6';
          t.style.color = '#6b7280';
          t.style.fontWeight = '400';
          t.classList.remove('active');
        });
        tab.style.background = '#f59e0b';
        tab.style.color = '#fff';
        tab.style.fontWeight = '700';
        tab.classList.add('active');
        // R767 修真：空输入点 tab 也要有明确反馈（原实现静默无反应，用户感知「点不动」）
        input.focus();
        if (input.value.trim()) {
          doSearch(input.value.trim());
        } else {
          var HINTS = { all:'输入关键词或首字母，跨 患者/方剂/穴位/知识库/病例 全域检索', patient:'输入姓名、首字母（如 zcp）或患者编号，复诊秒查', formula:'输入方剂名或证型，如：桂枝汤、脾虚、gzt——点击结果直达问诊台处方框', acupoint:'输入穴位或症状，如：足三里、失眠、zsl', kb:'输入任意医学关键词，检索 4 万条知识库', cases:'输入患者姓名或证型，检索已签发电子病历' };
          var dd = document.getElementById('ss-dropdown');
          dd.style.display = 'block';
          dd.innerHTML = '<div style="padding:14px;text-align:center;color:#92400e;font-size:12px">' + tab.lastChild.textContent.trim() + ' 检索已选中<br><span style="font-size:11px;color:#6b7280">' + (HINTS[currentType] || HINTS.all) + '</span></div>';
        }
      });
    });
  }

  // ═══ 搜索执行 ═══
  var searchSeq = 0;   // R793：请求序号——慢响应不得覆盖新查询（tab 快切/快速改词时队列乱序）
  async function doSearch(query) {
    var seq = ++searchSeq;
    var dropdown = document.getElementById('ss-dropdown');
    if (cache[query + '|' + currentType]) {
      renderResults(cache[query + '|' + currentType], query);
      return;
    }

    dropdown.style.display = 'block';
    dropdown.innerHTML = '<div style="padding:12px;text-align:center;color:#9ca3af;font-size:12px">🔄 搜索中...</div>';

    var promises = [];

    // 根据 currentType 选择搜索源（R792：患者入全域，首字母/中文/id 前缀三形态直达）
    if (currentType === 'all' || currentType === 'patient') {
      promises.push(searchPatient(query));
    }
    if (currentType === 'all' || currentType === 'kb') {
      promises.push(searchKB(query));
    }
    if (currentType === 'all' || currentType === 'formula') {
      promises.push(searchFormula(query));
    }
    if (currentType === 'all' || currentType === 'acupoint') {
      promises.push(searchAcupoint(query));
    }
    if (currentType === 'all' || currentType === 'cases') {
      promises.push(searchCases(query));
    }

    var results = await Promise.all(promises);
    if (seq !== searchSeq) return;   // 已有更新的查询在执行，丢弃本次过期响应
    var merged = [];
    results.forEach(function(r) { if (r && r.length) merged = merged.concat(r); });

    // 排序：按 score 降序
    merged.sort(function(a, b) { return (b.score || 0.5) - (a.score || 0.5); });

    cache[query + '|' + currentType] = merged;
    renderResults(merged, query);
  }

  async function searchPatient(query) {
    // R789/R792：患者主索引（empi）优先，支持 中文子串/首字母（zcp）/id 前缀
    try {
      var r = await fetch('/api/patients/list?q=' + encodeURIComponent(query));
      var d = await r.json();
      if (!d.patients) return [];
      return d.patients.slice(0, 5).map(function(p) {
        return {
          type: 'patient', icon: '👤',
          title: p.name + (p.gender ? ' · ' + p.gender : '') + (p.age ? ' · ' + p.age + '岁' : ''),
          desc: (p.diagnosis || p.complaint || '').slice(0, 60),
          score: p.source === 'empi' ? 0.98 : 0.9,
          meta: (p.source === 'empi' ? '主索引' : '档案') + ' · 就诊 ' + (p.visit_count || 0) + ' 次' + (p.last_visit ? ' · 最近 ' + String(p.last_visit).slice(0, 10) : ''),
          url: 'admin.html?id=' + encodeURIComponent(p.id)
        };
      });
    } catch { return []; }
  }

  async function searchKB(query) {
    try {
      var r = await fetch('/api/tcm/kb/search?q=' + encodeURIComponent(query) + '&max=5');
      var d = await r.json();
      if (!d.ok || !d.results) return [];
      // R799 修真：后端 max 参数不生效（只认 limit），本地截 5 条——
      // 否则反哺加权后 kb 腿 20 条高分淹没方剂/穴位/患者腿（top10 渲染切片被挤空）
      return d.results.slice(0, 5).map(function(item) {
        // R798 修真：承接后端排序分（完整4/前缀3/反哺3.2/子串2.5/全拼2/内容1），
        // 映射到 0.775~1.0 区间——原实现用 confidence 覆盖 score，后端排序全部丢失
        var backend = typeof item.score === 'number' ? item.score : 0;
        var ui = backend > 0 ? 0.7 + Math.min(backend, 4) / 4 * 0.3 : (item.confidence || 0.7);
        return {
          type: 'kb', icon: '📚',
          title: item.title || item.module || item.name || '知识条目',
          desc: (item.summary || item.content || '').slice(0, 80),
          score: ui,
          meta: item.src_id ? '来源 #' + item.src_id : '知识库'
        };
      });
    } catch { return []; }
  }

  async function searchFormula(query) {
    try {
      var r = await fetch('/api/tcm/formula/search?q=' + encodeURIComponent(query));
      var d = await r.json();
      if (!d.ok || !d.formulas) return [];
      return d.formulas.map(function(item) {
        var fname = item.formula || item.syndrome || '方剂';
        return {
          type: 'formula', icon: '💊',
          title: fname,
          desc: '适应症：' + (item.symptoms || []).slice(0, 3).join('、'),
          score: 0.9,
          meta: (item.source || '') + ' · 点击直达处方',
          // R799：方剂结果直达问诊台处方框（?fx= 自动展开组成）
          url: 'clinic-desk.html?fx=' + encodeURIComponent(fname)
        };
      });
    } catch { return []; }
  }

  async function searchAcupoint(query) {
    try {
      var r = await fetch('/api/tcm/acupoint/search?q=' + encodeURIComponent(query));
      var d = await r.json();
      // R792 修真：端点返回 data 字段（原读 d.points 永远空，穴位结果从未出现过）
      var pts = d.points || d.data || [];
      if (!d.ok || !pts.length) return [];
      return pts.map(function(item) {
        return {
          type: 'acupoint', icon: '📍',
          title: item.name + '（' + (item.meridian || item.cn || '经外奇穴') + '）',
          desc: (item.indications || []).slice(0, 3).join('、'),
          score: 0.85,
          meta: item.location || item.flow_time || '',
          // R800：穴位直达针灸页（只传穴名，不带括注，否则搜索词被污染）
          url: 'acupuncture.html?q=' + encodeURIComponent(item.name)
        };
      });
    } catch { return []; }
  }

  async function searchCases(query) {
    // R767 修真：病例源从桩端点 cases/similar（永远空）改为真实已签发电子病历 /api/tcm/cases
    try {
      var r = await fetch('/api/tcm/cases');
      var d = await r.json();
      var list = d.cases || d.data || (Array.isArray(d) ? d : []);
      if (!list.length) return [];
      var q = String(query).toLowerCase();
      var matched = list.filter(function(c) {
        return (c.syndrome || '').includes(query) || (c.formula || '').includes(query) ||
               (c.chief || '').includes(query) ||
               (c.symptoms || []).some(function(s) { return String(s).toLowerCase().includes(q); });
      });
      return matched.slice(0, 5).map(function(c) {
        return {
          type: 'case', icon: '📋',
          title: (c.syndrome || '待辨证') + ' · ' + (c.formula || ''),
          desc: (c.symptoms || []).slice(0, 3).join('、') + (c.chief ? ' · ' + String(c.chief).slice(0, 30) : ''),
          score: 0.8,
          meta: '病历 ' + (c.caseId || '').slice(0, 14) + ' · ' + String(c.timestamp || '').slice(0, 10),
          // R800：病历直达 emr 页检索（只传证型，不带「· 方名」拼串）
          url: 'emr.html?q=' + encodeURIComponent(c.syndrome || c.formula || c.chief || '')
        };
      });
    } catch { return []; }
  }

  // ═══ 结果渲染 ═══
  var lastResults = [];
  function renderResults(results, query) {
    var dropdown = document.getElementById('ss-dropdown');
    lastResults = results;
    if (!results.length) {
      dropdown.innerHTML = '<div style="padding:14px;text-align:center;color:#9ca3af;font-size:12px">未找到「' + escHTML(query) + '」相关结果<br><span style="font-size:10px">试试：桂枝汤 / 足三里 / 失眠 / 气血亏虚，或首字母：gzt / zsl / zcp</span></div>';
      return;
    }

    dropdown.innerHTML = results.slice(0, 10).map(function(r, i) {
      return '<div class="ss-result" style="padding:8px 12px;border-bottom:1px solid #f3f4f6;cursor:pointer;display:flex;gap:8px;align-items:flex-start" onclick="window.__ssNavigate(' + i + ')">' +
        '<span style="font-size:16px">' + r.icon + '</span>' +
        '<div style="flex:1;min-width:0">' +
          '<div style="font-size:12px;font-weight:600;color:#1f2937">' + escHTML(r.title) + '</div>' +
          (r.desc ? '<div style="font-size:11px;color:#6b7280;margin-top:1px">' + escHTML(r.desc) + '</div>' : '') +
          '<div style="display:flex;gap:6px;margin-top:2px">' +
            (r.meta ? '<span style="font-size:9px;color:#9ca3af">' + escHTML(r.meta) + '</span>' : '') +
            (r.score ? '<span style="font-size:9px;color:#16a34a">' + Math.round(r.score * 100) + '%</span>' : '') +
          '</div>' +
        '</div>' +
      '</div>';
    }).join('') + '<div style="padding:6px;text-align:center;font-size:10px;color:#9ca3af;border-top:1px solid #f3f4f6">共 ' + results.length + ' 条结果</div>';
  }

  function escHTML(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function escAttr(s) {
    return String(s || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
  }

  // ═══ 导航（根据类型跳转；结果自带 url 时优先）═══
  window.__ssNavigate = function(idx) {
    var r = lastResults[idx];
    if (!r) return;
    if (r.url) { window.location.href = r.url; return; }
    var url, title = r.title;
    switch (r.type) {
      case 'formula': url = 'pharmacy.html?q=' + encodeURIComponent(title); break;
      case 'acupoint': url = 'acupuncture.html?q=' + encodeURIComponent(title); break;
      case 'kb': url = 'kb-evolution.html?q=' + encodeURIComponent(title); break;
      case 'case': url = 'emr.html?q=' + encodeURIComponent(title); break;
      default: url = 'index.html?q=' + encodeURIComponent(title);
    }
    window.location.href = url;
  };

  window.TCM_SMART_SEARCH = true;

  // ═══ 自动注入 ═══
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectSearchBar);
  } else {
    injectSearchBar();
  }
})();
