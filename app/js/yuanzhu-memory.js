/* =====================================================================
 * yuanzhu-memory.js · 全局缘主记忆层
 * ---------------------------------------------------------------------
 * 单一职责：所有工具/模块共享同一份缘主档案。
 * - 入口：localStorage['mlj_yuanzhu']
 * - 升级：替代并兼容旧 'userBazi' 字段
 * - 写入时机：用户填写任何表单项 → 立即 sync；AI助手收集到一项 → 立即 sync
 * - 读取时机：任何工具/模块 init() → readYuanzhu() → 自动填充表单 + 显示记忆条
 * ---------------------------------------------------------------------
 * 字段:
 *   name / sex / year / month / day / hour / calendarMode
 *   birthCity / residenceCity
 *   dayStem / dayBranch / dayStemIdx / dayBranchIdx
 *   xiEle / jiEle / weakestEle / strongestEle
 *   missingEles / eleCount / pillars / zodiac / lifeType / mingGua
 *   askHistory   [{module, ts, ask}]
 *   reportHistory[{module, ts, snippet, hash}]
 *   prefillLogs  {toolName: ts}   // 各工具最近填充时间
 *   timestamp
 * =====================================================================*/
(function () {
  'use strict';

  var KEY = 'mlj_yuanzhu';
  var LEGACY = 'userBazi';
  var ONE_DAY = 86400000;

  // ============== 核心读写 ==============
  function _readRaw() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) {
        // 兼容老 userBazi
        var old = localStorage.getItem(LEGACY);
        if (old) {
          var obj = JSON.parse(old);
          obj._migratedFromLegacy = true;
          localStorage.setItem(KEY, JSON.stringify(obj));
          localStorage.removeItem(LEGACY);
          return obj;
        }
      }
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function _writeRaw(obj) {
    try {
      obj.timestamp = Date.now();
      localStorage.setItem(KEY, JSON.stringify(obj));
      // 同步到旧 key（避免其他模块还在读 userBazi）
      localStorage.setItem(LEGACY, JSON.stringify(obj));
      return true;
    } catch (e) { return false; }
  }

  // ============== 对外 API ==============
  // 读取完整档案（任意字段可能为空）
  window.readYuanzhu = function () { return _readRaw(); };

  // 获取某字段（不存在则返回 undefined）
  window.getYzField = function (field) {
    var yz = _readRaw();
    return yz[field];
  };

  // 设置/合并若干字段
  window.setYzFields = function (partial) {
    if (!partial || typeof partial !== 'object') return;
    var yz = _readRaw();
    Object.keys(partial).forEach(function (k) {
      if (partial[k] !== undefined && partial[k] !== null && partial[k] !== '') {
        yz[k] = partial[k];
      }
    });
    _writeRaw(yz);
    return yz;
  };

  // 记录提问历史（模块化、可回看）
  window.logYzAsk = function (moduleId, ask) {
    var yz = _readRaw();
    if (!yz.askHistory) yz.askHistory = [];
    yz.askHistory.push({ module: moduleId, ts: Date.now(), ask: (ask || '').slice(0, 80) });
    if (yz.askHistory.length > 200) yz.askHistory = yz.askHistory.slice(-200);
    _writeRaw(yz);
  };

  // 记录生成的报告（防重+可回看）
  window.logYzReport = function (moduleId, snippet) {
    var yz = _readRaw();
    if (!yz.reportHistory) yz.reportHistory = [];
    var txt = (snippet || '').slice(0, 120);
    var hash = 0;
    for (var i = 0; i < txt.length; i++) hash = ((hash << 5) - hash + txt.charCodeAt(i)) | 0;
    // 同模块 + 同 hash + 30 分钟内 → 不重复记录
    var last = yz.reportHistory.filter(function (r) { return r.module === moduleId; }).pop();
    if (last && last.hash === hash && (Date.now() - last.ts) < 1800000) return;
    yz.reportHistory.push({ module: moduleId, ts: Date.now(), snippet: txt, hash: hash });
    if (yz.reportHistory.length > 100) yz.reportHistory = yz.reportHistory.slice(-100);
    _writeRaw(yz);
  };

  // 记录某工具最近填充时间（用于 1 小时防过期提醒）
  window.touchPrefillLog = function (toolName) {
    var yz = _readRaw();
    if (!yz.prefillLogs) yz.prefillLogs = {};
    yz.prefillLogs[toolName] = Date.now();
    _writeRaw(yz);
  };

  // 检查是否已经填写过核心八字（用于 AI 助手欢迎页智能问候）
  window.hasYuanzhuProfile = function () {
    var yz = _readRaw();
    return !!(yz.name && yz.year && yz.month && yz.day);
  };

  // 核心八字是否在 24h 内（新鲜）
  window.isYzFresh = function () {
    var yz = _readRaw();
    if (!yz.timestamp) return false;
    return (Date.now() - yz.timestamp) < ONE_DAY;
  };

  // 自动填充某个工具的字段（按 fieldMap）
  // fieldMap 示例：{name:'baziName', date:'baziDate', hour:'baziHour', sex:'baziSex', birthCity:'baziBirthCity', liveCity:'baziLiveCity'}
  window.prefillToolForm = function (toolName, fieldMap) {
    var yz = _readRaw();
    if (!yz || !yz.name) return false;
    var filled = [];
    Object.keys(fieldMap).forEach(function (key) {
      var elId = fieldMap[key];
      var el = document.getElementById(elId);
      if (!el || el.value) return;
      var v = yz[key];
      if (v === undefined || v === null || v === '') return;
      el.value = v;
      filled.push(key);
    });
    if (filled.length) {
      touchPrefillLog(toolName);
      // 触发 change 事件，让其他监听器知道表单变了
      filled.forEach(function (k) {
        var elId = fieldMap[k];
        var el = document.getElementById(elId);
        if (el) {
          try { el.dispatchEvent(new Event('change', { bubbles: true })); } catch (e) {}
        }
      });
    }
    return filled.length > 0;
  };

  // 智能从引导答案里抽取八字信息（兜底抽取：日期/时辰/性别/城市）
  // 入参: {stepKey, answer}，返回 partial 对象
  window.extractYzFromAnswer = function (stepKey, answer) {
    if (!answer || typeof answer !== 'string') return {};
    var a = answer.trim();
    var p = {};
    var m;
    // 性别
    if (/^(男|先生|公子)/.test(a) || /男\s*$/.test(a) || /\b男\b/.test(a)) p.sex = '男';
    else if (/^(女|女士|姑娘)/.test(a) || /女\s*$/.test(a) || /\b女\b/.test(a)) p.sex = '女';
    // 日期: 1990年5月12日 / 1990-5-12 / 1990/5/12 / 1990.5.12
    m = a.match(/(\d{4})\s*[年\-\/\.]\s*(\d{1,2})\s*[月\-\/\.]\s*(\d{1,2})/);
    if (m) {
      p.year = parseInt(m[1], 10);
      p.month = parseInt(m[2], 10);
      p.day = parseInt(m[3], 10);
    }
    // 时辰: 子/丑/寅/卯/辰/巳/午/未/申/酉/戌/亥 时 / 23点 / 23:30
    m = a.match(/([子丑寅卯辰巳午未申酉戌亥])\s*时/);
    if (m) {
      var shi = { '子': 0, '丑': 2, '寅': 4, '卯': 6, '辰': 8, '巳': 10, '午': 12, '未': 14, '申': 16, '酉': 18, '戌': 20, '亥': 22 };
      p.hour = shi[m[1]];
    }
    m = a.match(/(\d{1,2})\s*[:点]\s*(\d{1,2})?/);
    if (m && !p.hour) p.hour = parseInt(m[1], 10);
    // 姓名：常见提问"我叫XXX" / "我姓X"
    m = a.match(/(?:我叫|我是|姓名[：:为是]?)\s*([\u4e00-\u9fa5]{1,4})/);
    if (m) p.name = m[1];
    // 城市
    m = a.match(/([\u4e00-\u9fa5]{2,4})[市县区]/);
    if (m) p.birthCity = p.birthCity || m[0];
    return p;
  };

  // 清除记忆
  window.clearYuanzhu = function () {
    try { localStorage.removeItem(KEY); } catch (e) {}
    try { localStorage.removeItem(LEGACY); } catch (e) {}
  };

  // 显示记忆条：在任意页面右下角浮一条"上次缘主档案"提示
  window.showYuanzhuRibbon = function (opts) {
    opts = opts || {};
    var yz = _readRaw();
    if (!yz || !yz.name) return null;
    // 已存在则不重复
    var existing = document.getElementById('yzRibbon');
    if (existing) existing.remove();
    var bar = document.createElement('div');
    bar.id = 'yzRibbon';
    bar.style.cssText = 'position:fixed;bottom:14px;left:14px;right:14px;max-width:520px;margin:auto;z-index:200;background:rgba(20,16,10,0.94);backdrop-filter:blur(10px);border:1px solid rgba(201,168,76,0.3);border-radius:14px;padding:10px 14px;color:var(--paper);font-size:12px;display:flex;align-items:center;gap:10px;box-shadow:0 6px 24px rgba(0,0,0,.4)';
    var ts = yz.timestamp ? new Date(yz.timestamp).toLocaleString('zh-CN', { hour12: false }) : '';
    var sum = (yz.name || '匿名') + (yz.sex || '') + '·' + (yz.year || '?') + '年' + (yz.month || '?') + '月' + (yz.day || '?') + '日' + (yz.zodiac ? '·属' + yz.zodiac : '');
    if (yz.xiEle) sum += '·喜' + yz.xiEle;
    bar.innerHTML =
      '<span style="font-size:18px">🪷</span>' +
      '<div style="flex:1;line-height:1.5">' +
        '<div style="color:var(--gold);font-weight:600">已记起缘主：' + sum + '</div>' +
        '<div style="color:var(--paper3);font-size:10px">上次记录 ' + ts + (opts.module ? ' · 用于「' + opts.module + '」' : '') + '</div>' +
      '</div>' +
      '<button onclick="document.getElementById(\'yzRibbon\').remove()" style="background:transparent;border:1px solid var(--border);color:var(--paper3);font-size:10px;padding:3px 8px;border-radius:6px;cursor:pointer;font-family:inherit">收起</button>';
    document.body.appendChild(bar);
    if (opts.autoHide !== false) {
      setTimeout(function () { var b = document.getElementById('yzRibbon'); if (b) b.remove(); }, opts.timeout || 6000);
    }
    return bar;
  };

  console.log('[yuanzhu-memory] loaded · key=' + KEY);
})();
