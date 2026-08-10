/**
 * kb-recommend-feedback.js — R38 推荐反馈闭环（本地双计 + 后端日志 + 节流）
 *
 * 功能：
 * 1) feedbackKbRec({target, source, action, score}) — 统一入口
 *    - localStorage _kb_hit_count/{target} += 1
 *    - localStorage _kb_recommend_count/{source} += 1
 *    - POST /api/kb/recommend/feedback（节流 5s/同 target，防刷）
 * 2) getRecStats(mod) — 获取模块的 hit + recommend 计数
 * 3) refreshRecStatsBar() — 刷新页面上的统计条（如有）
 *
 * 使用：
 *   <script src="js/kb-recommend-feedback.js" defer></script>
 *   window.feedbackKbRec({target:'nihaisha-tcm-kb', source:'bazi', action:'click'});
 */
(function () {
  'use strict';

  var THROTTLE_MS = 5000; // 同 target 节流间隔
  var pendingQueue = [];

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }
  function safeParseInt(v) {
    var n = parseInt(v || '0', 10);
    return isNaN(n) ? 0 : n;
  }

  // 节流检查：同 target+action 5 秒内只发一次后端
  function shouldThrottle(key) {
    var now = Date.now();
    var last = safeGet('_kb_fb_throttle/' + key);
    if (last && (now - parseInt(last, 10)) < THROTTLE_MS) return true;
    safeSet('_kb_fb_throttle/' + key, String(now));
    return false;
  }

  /**
   * 统一推荐反馈入口
   * @param {Object} opts
   * @param {string} opts.target — 被点击的推荐目标 id（如 'nihaisha-tcm-kb'）
   * @param {string} opts.source — 来源模块（如 'bazi'）
   * @param {string} [opts.action='click'] — 行为类型
   * @param {number} [opts.score=0.5] — 行为权重
   */
  window.feedbackKbRec = function (opts) {
    opts = opts || {};
    var target = opts.target || '';
    var source = opts.source || 'explorer';
    var action = opts.action || 'click';
    var score = opts.score != null ? opts.score : 0.5;

    if (!target) return;

    // 1) 本地双计：hit_count + recommend_count
    var hitKey = '_kb_hit_count/' + target;
    safeSet(hitKey, String(safeParseInt(safeGet(hitKey)) + 1));

    var recKey = '_kb_recommend_count/' + source;
    safeSet(recKey, String(safeParseInt(safeGet(recKey)) + 1));

    // _kb_hit_today
    try {
      var td = JSON.parse(safeGet('_kb_hit_today') || '{}');
      var today = new Date().toDateString();
      if (td.date !== today) { td = { date: today, count: 0 }; }
      td.count = (td.count || 0) + 1;
      safeSet('_kb_hit_today', JSON.stringify(td));
    } catch (e) {}

    // 2) 后端日志（节流）
    var throttleKey = target + ':' + action;
    if (!shouldThrottle(throttleKey)) {
      postFeedback(target, source, action, score);
    }

    // 3) 派发事件（让其他组件可监听）
    try {
      window.dispatchEvent(new CustomEvent('kb-feedback', {
        detail: { target: target, source: source, action: action, score: score }
      }));
    } catch (e) {}
  };

  function postFeedback(target, source, action, score) {
    try {
      // 猜测 API base（8920 或当前域 /api/）
      var base = '';
      if (typeof window.KB_API_BASE !== 'undefined') {
        base = window.KB_API_BASE;
      } else if (location.port === '8920') {
        base = '';
      } else {
        base = 'http://127.0.0.1:8920';
      }
      fetch(base + '/api/kb/recommend/feedback', { signal: AbortSignal.timeout(15000),
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: target,
          source: source,
          action: action,
          score: score
        }), signal: AbortSignal.timeout(15000) }).catch(function () {});
    } catch (e) {}
  }

  /**
   * 获取模块的 hit + recommend 统计
   */
  window.getRecStats = function (mod) {
    var hitKey = '_kb_hit_count/' + mod;
    var recKey = '_kb_recommend_count/' + mod;
    return {
      module: mod,
      hits: safeParseInt(safeGet(hitKey)),
      recommends: safeParseInt(safeGet(recKey))
    };
  };

  /**
   * 刷新页面上的推荐统计条（如有 .kb-rec-stats 元素）
   */
  window.refreshRecStatsBar = function () {
    var bars = document.querySelectorAll('.kb-rec-stats');
    if (!bars.length) return;
    var totalHits = 0;
    var totalRecs = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (!k) continue;
        if (k.indexOf('_kb_hit_count/') === 0 && k.indexOf('_daily_') === -1 && k.indexOf('_total') === -1) {
          totalHits += safeParseInt(safeGet(k));
        }
        if (k.indexOf('_kb_recommend_count/') === 0) {
          totalRecs += safeParseInt(safeGet(k));
        }
      }
    } catch (e) {}
    bars.forEach(function (bar) {
      bar.textContent = '🎯 推荐 ' + totalRecs + ' 次 · 命中 ' + totalHits + ' 次';
    });
  };

  // DOMContentLoaded 时自动刷新一次
  if (document.readyState !== 'loading') {
    refreshRecStatsBar();
  } else {
    document.addEventListener('DOMContentLoaded', refreshRecStatsBar);
  }
})();
