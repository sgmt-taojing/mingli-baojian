// ═══════════════════════════════════════════════════════════════
// 命理宝鉴 · KB 搜索框（divination-hub 入口）
// R31-A→D 升级：FTS5 API 优先（带 module/status/boosted_score）
// R32 升级：拼音首字母模糊匹配 + 分类过滤芯片
// 失败时回退客户端扫描 window.AUTHORITATIVE_KNOWLEDGE / FAITH / KOUJUE / SCRIPTURE
// 记录 _kb_search_count 反馈到本地统计
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';

  const MAX_RESULTS = 30;
  const SNIPPET_RADIUS = 60;
  const STORAGE_KEY = '***';
  const DEBOUNCE_MS = 220;
  const API_BASE = '/api/public/kb';
  const API_TIMEOUT_MS = 1200;

  // ──── R32: 拼音首字母表 (常用汉字覆盖) ────
  // 提取方式：unicode 排序区间 → 声母映射，精简版
  const PINYIN_START = {
    // 高频命理/中医/八字用字优先覆盖
    '八':'b','字':'z','四':'s','柱':'z','命':'m','理':'l','宝':'b','鉴':'j',
    '天':'t','干':'g','地':'d','支':'z','五':'w','行':'x','阴':'y','阳':'y',
    '金':'j','木':'m','水':'s','火':'h','土':'t','甲':'j','乙':'y','丙':'b',
    '丁':'d','戊':'w','己':'j','庚':'g','辛':'x','壬':'r','癸':'g',
    '子':'z','丑':'c','寅':'y','卯':'m','辰':'c','巳':'s','午':'w','未':'w',
    '申':'s','酉':'y','戌':'x','亥':'h',
    '紫':'z','微':'w','斗':'d','数':'s','府':'f','相':'x','杀':'s',
    '奇':'q','门':'m','遁':'d','甲':'j','仪':'y',
    '六':'l','爻':'y','壬':'r','梅':'m','花':'h','易':'y','经':'j',
    '风':'f','水':'s','穴':'x','络':'l','脉':'m','脏':'z','腑':'f',
    '心':'x','肝':'g','脾':'p','肺':'f','肾':'s','胆':'d','胃':'w',
    '大':'d','肠':'c','小':'x','膀':'b','胱':'g','三':'s','焦':'j',
    '寒':'h','热':'r','虚':'x','实':'s','表':'b','里':'l',
    '气':'q','血':'x','津':'j','液':'y','神':'s','精':'j','魂':'h','魄':'p',
    '方':'f','剂':'j','药':'y','草':'c','本':'b','汤':'t','丸':'w','散':'s',
    '伤':'s','寒':'h','论':'l','金':'j','匮':'k','要':'y','略':'l',
    '黄':'h','帝':'d','内':'n','素':'s','问':'w','灵':'l','枢':'s',
    '针':'z','灸':'j','推':'t','拿':'n','按':'a','跷':'q',
    '观':'g','音':'y','菩':'p','萨':'s','佛':'f','道':'d','仙':'x',
    '符':'f','咒':'z','法':'f','术':'s','科':'k','仪':'y',
    '运':'y','势':'s','流':'l','年':'n','大':'d','限':'x','小':'x',
    '胎':'t','元':'y','命':'m','宫':'g','身':'s','元':'y',
    '十':'s','神':'s','正':'z','偏':'p','官':'g','财':'c','印':'y',
    '食':'s','伤':'s','比':'b','劫':'j','禄':'l','刃':'r',
    '旺':'w','衰':'s','墓':'m','库':'k','绝':'j','胎':'t','养':'y',
    '长':'c','生':'s','沐':'m','浴':'y','冠':'g','带':'d',
    '舒':'s','晗':'h','倪':'n','师':'s','段':'d','段':'d',
    '口':'k','诀':'j','真':'z','言':'y','咒':'z','偈':'j',
    '化':'h','解':'j','挡':'d','镇':'z','破':'p',
    '星':'x','曜':'y','宫':'g','位':'w','四':'s','化':'h',
    '化':'h','禄':'l','化':'h','权':'q','化':'h','科':'k','化':'h','忌':'j',
    '太':'t','岁':'s','岁':'s','驾':'j','前':'q','后':'h',
    '财':'c','官':'g','印':'y','身':'s','姻':'y','缘':'y',
    '事':'s','业':'y','健':'j','康':'k','学':'x','业':'y',
    '家':'j','庭':'t','子':'z','女':'n','父':'f','母':'m',
    // 通用高频
    '的':'d','是':'s','在':'z','有':'y','不':'b','了':'l','人':'r',
    '大':'d','上':'s','中':'z','国':'g','为':'w','以':'y','及':'j',
    '可':'k','以':'y','到':'d','说':'s','要':'y','会':'h','能':'n',
    '这':'z','那':'n','个':'g','么':'m','什':'s','么':'m','怎':'z',
    '前':'q','后':'h','左':'z','右':'y','内':'n','外':'w','东':'d',
    '南':'n','西':'x','北':'b','中':'z','上':'s','下':'x',
    '一':'y','二':'e','三':'s','四':'s','五':'w','六':'l','七':'q','八':'b','九':'j','十':'s',
    '百':'b','千':'q','万':'w','亿':'y','零':'l',
    '日':'r','月':'y','年':'n','时':'s','分':'f','秒':'m',
    '春':'c','夏':'x','秋':'q','冬':'d','节':'j','气':'q',
    '立':'l','雨':'y','惊':'j','春':'c','清':'q','明':'m',
    '谷':'g','立':'l','小':'x','满':'m','芒':'m','种':'z',
    '小':'x','暑':'s','大':'d','暑':'s','立':'l','秋':'q',
    '处':'c','暑':'s','白':'b','露':'l','秋':'q','分':'f',
    '寒':'h','露':'l','霜':'s','降':'j','立':'l','冬':'d',
    '小':'x','雪':'x','大':'d','雪':'x','冬':'d','至':'z',
    '小':'x','寒':'h','大':'d','寒':'h',
  };

  // 从汉字文本提取拼音首字母串
  function pinyinInitials(text) {
    if (!text) return '';
    var result = '';
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (/[a-z0-9]/i.test(ch)) {
        result += ch.toLowerCase();
      } else if (PINYIN_START[ch]) {
        result += PINYIN_START[ch];
      }
      // 非中文/英文/数字 → 跳过
    }
    return result;
  }

  // 拼音首字母匹配
  function pinyinMatch(text, query) {
    var pi = pinyinInitials(text);
    if (!pi) return false;
    return pi.indexOf(query.toLowerCase()) >= 0;
  }

  // 客户端扫描源 → 显示用标签
  const CLIENT_MODULE_LABELS = {
    'AUTHORITATIVE_KNOWLEDGE': { name: '经典知识库', emoji: '📚' },
    'FAITH_KNOWLEDGE_BASE': { name: '信仰知识库', emoji: '🛕' },
    'KOUJUE_DATABASE_FULL': { name: '口诀库', emoji: '📜' },
    'SCRIPTURE_DATABASE': { name: '经文库', emoji: '📖' },
  };

  // 服务端 FTS5 模块 → 中文标签
  const SERVER_MODULE_LABELS = {
    'bazi': '八字', 'ziwei': '紫微', 'fengshui': '风水', 'qimen': '奇门',
    'tcm': '中医', 'tcm-zhongfu': '中医·中府', 'tcm-fangji': '中医·方剂',
    'tcm-diagnosis': '中医·诊断', 'shuhan': '舒晗·密宗天纪',
    'shuhan-tcm': '舒晗·中医', 'shanghan-lun': '伤寒论', 'acupuncture': '针灸',
    'huangdi-neijing': '黄帝内经', 'shennong-bencao': '神农本草', 'classics': '经典',
    'jinkui': '金匮', 'yijing': '易经', 'liuyao': '六爻', 'liuren': '六壬',
    'meihua': '梅花', 'general': '通用', 'faith': '信仰', 'mantra': '真言',
    'tianji-jiangjie': '天纪讲解', 'nihaisha': '倪海厦', 'nihaisha-structured': '倪师·结构化',
    'nihaixia': '倪海厦', 'nihaixia-yian': '倪师医案',
  };

  // 快速过滤芯片（搜索框下方提示）
  const FILTER_CHIPS = [
    { q: '八字', label: '八字', emoji: '🧮' },
    { q: '紫微', label: '紫微', emoji: '🌟' },
    { q: '风水', label: '风水', emoji: '🧭' },
    { q: '中医', label: '中医', emoji: '⚕️' },
    { q: '伤寒', label: '伤寒', emoji: '📜' },
    { q: '奇门', label: '奇门', emoji: '🔮' },
    { q: '易经', label: '易经', emoji: '📒' },
    { q: '针灸', label: '针灸', emoji: '💉' },
    { q: '舒晗', label: '舒晗', emoji: '📘' },
    { q: '倪师', label: '倪师', emoji: '🎙️' },
  ];

  // status → 标签 + 颜色
  const STATUS_META = {
    'formal':    { label: '已审核', emoji: '✅', cls: 'kb-status-formal'    },
    'staging':   { label: '待审',   emoji: '🟡', cls: 'kb-status-staging'   },
    'deprecated':{ label: '已归档', emoji: '🗄️', cls: 'kb-status-deprecated'},
    'experimental':{ label: '实验', emoji: '🧪', cls: 'kb-status-experimental'},
    'archived': { label: '归档',   emoji: '🗄️', cls: 'kb-status-deprecated' },
  };

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function highlight(text, q) {
    if (!q) return escapeHtml(text);
    var esc = escapeHtml(text);
    var escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    var re = new RegExp(escapedQ, 'gi');
    return esc.replace(re, function (m) { return '<span class="kb-search-hl">' + m + '</span>'; });
  }

  function snippet(text, q) {
    if (!text) return '';
    var lowerText = text.toLowerCase();
    var lowerQ = (q || '').toLowerCase();
    var idx = lowerText.indexOf(lowerQ);
    // R32: 拼音首字母定位
    if (idx < 0 && q && /^[a-z]+$/i.test(q)) {
      var pi = pinyinInitials(text);
      var piIdx = pi.indexOf(q.toLowerCase());
      if (piIdx >= 0) {
        idx = piIdx; // 近似定位
      }
    }
    if (idx < 0 || !lowerQ) {
      var slice = text.slice(0, SNIPPET_RADIUS * 2);
      return slice + (text.length > SNIPPET_RADIUS * 2 ? '…' : '');
    }
    var start = Math.max(0, idx - SNIPPET_RADIUS);
    var end = Math.min(text.length, idx + lowerQ.length + SNIPPET_RADIUS);
    return (start > 0 ? '…' : '') + text.substring(start, end) + (end < text.length ? '…' : '');
  }

  function serverLabel(mod) {
    if (!mod) return { name: '未分类', emoji: '📦' };
    if (SERVER_MODULE_LABELS[mod]) return { name: SERVER_MODULE_LABELS[mod], emoji: '🗂️' };
    if (mod.startsWith('r45_')) return { name: 'R45·' + mod.slice(4), emoji: '🗂️' };
    if (mod.startsWith('r39_')) return { name: 'R39·' + mod.slice(4), emoji: '🗂️' };
    if (mod.startsWith('r41_')) return { name: 'R41·' + mod.slice(4), emoji: '🗂️' };
    return { name: mod, emoji: '📦' };
  }

  // ──── FTS5 API 搜索 ────
  async function searchFts(query) {
    var url = API_BASE + '/search-fts?q=' + encodeURIComponent(query) + '&limit=' + MAX_RESULTS;
    var ctrl = new AbortController();
    var timer = setTimeout(function () { ctrl.abort(); }, API_TIMEOUT_MS);
    try {
      var r = await fetch(url, { signal: ctrl.signal });
      clearTimeout(timer);
      if (!r.ok) return null;
      var j = await r.json();
      if (!j || !j.data || !Array.isArray(j.data.results)) return null;
      return j.data.results.map(function (it) {
        return {
          source: 'fts5',
          module: it.module,
          title: it.title || it.entry_id,
          snippet: it.snippet || '',
          path: it.entry_id,
          status: it.status,
          trust: it.trust_score,
          score: it.score,
          boostedScore: it.boosted_score,
        };
      });
    } catch (_) {
      clearTimeout(timer);
      return null;
    }
  }

  // ──── 客户端字符串扫描（Fallback + 拼音匹配 R32） ────
  function scan(obj, q, isPinyin, matches, currentPath, moduleKey) {
    if (matches.length >= MAX_RESULTS) return;
    if (typeof obj === 'string') {
      var hit = false;
      if (isPinyin) {
        hit = pinyinMatch(obj, q);
      } else {
        hit = obj.toLowerCase().indexOf(q) >= 0;
      }
      if (hit) {
        matches.push({
          source: 'client',
          module: moduleKey,
          path: currentPath,
          snippet: obj,
          title: currentPath || '(root)',
          matchedByPinyin: isPinyin,
        });
      }
    } else if (obj && typeof obj === 'object') {
      if (Array.isArray(obj)) {
        obj.forEach(function (item, i) { scan(item, q, isPinyin, matches, currentPath + '[' + i + ']', moduleKey); });
      } else {
        Object.entries(obj).forEach(function (entry) {
          var k = entry[0], v = entry[1];
          var next = currentPath ? currentPath + '.' + k : k;
          if (next.length > 60) return;
          scan(v, q, isPinyin, matches, next, moduleKey);
        });
      }
    }
  }

  function searchClient(query) {
    var q = (query || '').trim().toLowerCase();
    if (!q) return [];
    var isPinyin = /^[a-z]+$/i.test(q) && q.length >= 2;
    var sources = ['AUTHORITATIVE_KNOWLEDGE', 'FAITH_KNOWLEDGE_BASE', 'KOUJUE_DATABASE_FULL', 'SCRIPTURE_DATABASE'];
    var matches = [];
    sources.forEach(function (key) {
      if (window[key]) scan(window[key], q, isPinyin, matches, '', key);
    });
    return matches.slice(0, MAX_RESULTS);
  }

  async function search(query) {
    // R32: 如果是纯拉丁字母（>=2 个），先尝试客户端拼音匹配
    // 同时也请求 FTS5（FTS5 可能命中英文 keyword 字段）
    var isPinyin = /^[a-z]{2,}$/i.test(query);
    if (isPinyin) {
      // 拼音模式：并行客户端拼音 + FTS5
      var clientResults = searchClient(query);
      var fts = await searchFts(query);
      if (fts && fts.length > 0) {
        // 合并去重
        return mergeResults(fts, clientResults);
      }
      return clientResults;
    }
    // 优先 FTS5 API
    var fts2 = await searchFts(query);
    if (fts2 && fts2.length > 0) return fts2;
    return searchClient(query);
  }

  // 合并 FTS5 + 客户端结果（去重）
  function mergeResults(fts, client) {
    if (!client || client.length === 0) return fts;
    var seen = {};
    fts.forEach(function (r) { seen[r.title || r.path] = true; });
    client.forEach(function (r) {
      var key = r.title || r.path;
      if (!seen[key]) {
        fts.push(r);
        seen[key] = true;
      }
    });
    return fts.slice(0, MAX_RESULTS);
  }

  function logSearch(query, count, source) {
    try {
      var log = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      log.push({ ts: Date.now(), q: query.slice(0, 20), count: count, source: source });
      while (log.length > 100) log.shift();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
    } catch (_) {}
  }

  // 渲染单条
  function renderItem(item, query) {
    var snip = item.snippet || snippet(item.text, query);
    var statusMeta = STATUS_META[item.status];
    var statusHtml = statusMeta
      ? '<span class="kb-search-status ' + statusMeta.cls + '" title="' + item.status + '">' + statusMeta.emoji + ' ' + statusMeta.label + '</span>'
      : '';
    // R32: 拼音匹配标记
    var pinyinBadge = item.matchedByPinyin
      ? '<span class="kb-search-pinyin-tag" title="拼音首字母匹配">🔤</span>'
      : '';
    return '<div class="kb-search-item">'
      + '<div class="kb-search-item-row1">'
      + '<span class="kb-search-item-path">' + escapeHtml(item.path || item.title || '') + '</span>'
      + statusHtml + pinyinBadge
      + '</div>'
      + '<div class="kb-search-item-snip">' + highlight(snip, query) + '</div>'
      + '</div>';
  }

  // 当前激活的过滤模块（null = 全部）
  var activeFilter = null;

  function renderResults(container, query) {
    var t0 = performance.now();
    container.innerHTML = '<div class="kb-search-loading">🔎 搜索中...</div>';

    search(query).then(function (matches) {
      var dur = Math.round(performance.now() - t0);

      if (matches.length === 0) {
        container.innerHTML =
          '<div class="kb-search-empty">'
          + '<div class="kb-search-empty-icon">🔍</div>'
          + '<div class="kb-search-empty-text">未找到与「' + escapeHtml(query) + '」相关的内容</div>'
          + '<div class="kb-search-empty-hint">试试：天干、五行、八字、观音、化解、bz（拼音）</div>'
          + '</div>';
        logSearch(query, 0, 'none');
        return;
      }

      // 按模块分组
      var byModule = {};
      matches.forEach(function (m) {
        var key = m.source === 'fts5' ? (m.module || 'unknown') : (m.module || 'unknown');
        if (!byModule[key]) byModule[key] = { source: m.source, items: [] };
        byModule[key].items.push(m);
      });

      // R32: 过滤芯片栏
      var moduleKeys = Object.keys(byModule);
      var chipsHtml = moduleKeys.map(function (mod) {
        var label;
        if (byModule[mod].source === 'fts5') {
          label = serverLabel(mod);
        } else {
          label = CLIENT_MODULE_LABELS[mod] || { name: mod, emoji: '📦' };
        }
        var isActive = activeFilter === mod ? ' kb-chip-active' : '';
        return '<button class="kb-filter-chip' + isActive + '" data-mod="' + escapeHtml(mod) + '">'
          + label.emoji + ' ' + escapeHtml(label.name)
          + ' <span class="kb-chip-count">' + byModule[mod].items.length + '</span>'
          + '</button>';
      }).join('');
      // "全部" 芯片
      var allChip = '<button class="kb-filter-chip' + (activeFilter === null ? ' kb-chip-active' : '') + '" data-mod="__all__"'
        + '>📋 全部 <span class="kb-chip-count">' + matches.length + '</span></button>';
      var chipBar = '<div class="kb-filter-chips">' + allChip + chipsHtml + '</div>';

      // 过滤渲染
      var filteredModules = moduleKeys;
      if (activeFilter && activeFilter !== '__all__') {
        filteredModules = moduleKeys.filter(function (m) { return m === activeFilter; });
      }

      var sections = filteredModules.map(function (mod) {
        var group = byModule[mod];
        var label;
        if (group.source === 'fts5') {
          label = serverLabel(mod);
        } else {
          label = CLIENT_MODULE_LABELS[mod] || { name: mod, emoji: '📦' };
        }
        return '<div class="kb-search-module">'
          + '<div class="kb-search-module-head">'
          + '<span class="kb-search-module-emoji">' + label.emoji + '</span>'
          + '<span class="kb-search-module-name">' + escapeHtml(label.name) + '</span>'
          + '<span class="kb-search-module-count">' + group.items.length + ' 条</span>'
          + '</div>'
          + '<div class="kb-search-items">'
          + group.items.map(function (m) { return renderItem(m, query); }).join('')
          + '</div>'
          + '</div>';
      }).join('');

      var engineBadge;
      if (matches[0] && matches[0].source === 'fts5') {
        engineBadge = '<span class="kb-search-engine">FTS5</span>';
      } else if (matches[0] && matches[0].matchedByPinyin) {
        engineBadge = '<span class="kb-search-engine kb-engine-pinyin">拼音</span>';
      } else {
        engineBadge = '<span class="kb-search-engine kb-engine-client">客户端</span>';
      }

      var filteredCount = activeFilter && activeFilter !== '__all__'
        ? (byModule[activeFilter] ? byModule[activeFilter].items.length : 0)
        : matches.length;

      container.innerHTML =
        '<div class="kb-search-summary">'
        + '共 <b>' + matches.length + '</b> 条 · ' + dur + 'ms · ' + engineBadge
        + (activeFilter && activeFilter !== '__all__' ? ' · 筛选: <b>' + filteredCount + '</b>' : '')
        + '</div>'
        + chipBar
        + sections;

      // 绑定芯片过滤
      container.querySelectorAll('.kb-filter-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          var mod = chip.getAttribute('data-mod');
          activeFilter = (mod === '__all__' || mod === activeFilter) ? null : mod;
          renderResults(container, query);
        });
      });

      logSearch(query, matches.length, matches[0] ? matches[0].source : 'none');
    });
  }

  // 公开 mount API
  window.mountKbSearchBox = function (mountEl) {
    if (!mountEl) return;
    mountEl.innerHTML =
      '<div class="kb-search-box">'
      + '<div class="kb-search-input-wrap">'
      + '<span class="kb-search-icon">🔍</span>'
      + '<input type="search" id="kbSearchInput" class="kb-search-input"'
      + ' placeholder="搜索 KB（天干、五行、八字、bz 拼音...）"'
      + ' aria-label="搜索知识库" autocomplete="off" />'
      + '<button class="kb-search-clear" id="kbSearchClear" aria-label="清空搜索">✕</button>'
      + '</div>'
      // R32: 快捷搜索芯片
      + '<div class="kb-quick-chips">'
      + FILTER_CHIPS.map(function (c) {
        return '<button class="kb-quick-chip" data-q="' + escapeHtml(c.q) + '">'
          + c.emoji + ' ' + escapeHtml(c.label) + '</button>';
      }).join('')
      + '</div>'
      + '<div class="kb-search-results" id="kbSearchResults"></div>'
      + '</div>';

    var input = mountEl.querySelector('#kbSearchInput');
    var clearBtn = mountEl.querySelector('#kbSearchClear');
    var results = mountEl.querySelector('#kbSearchResults');

    var debounceTimer = null;
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      var q = input.value;
      clearBtn.style.display = q ? 'block' : 'none';
      if (!q.trim()) {
        results.innerHTML = '';
        return;
      }
      activeFilter = null; // 新搜索重置过滤
      debounceTimer = setTimeout(function () { renderResults(results, q); }, DEBOUNCE_MS);
    });

    clearBtn.addEventListener('click', function () {
      input.value = '';
      clearBtn.style.display = 'none';
      results.innerHTML = '';
      input.focus();
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        renderResults(results, input.value);
      } else if (e.key === 'Escape') {
        input.value = '';
        clearBtn.style.display = 'none';
        results.innerHTML = '';
      }
    });

    // R32: 快捷芯片点击 → 自动搜索
    mountEl.querySelectorAll('.kb-quick-chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        var q = chip.getAttribute('data-q');
        input.value = q;
        clearBtn.style.display = 'block';
        activeFilter = null;
        renderResults(results, q);
        input.focus();
      });
    });
  };
})();
