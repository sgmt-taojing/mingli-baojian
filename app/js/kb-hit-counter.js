/**
 * KB 命中率计数器（R25-P0-1 收尾）
 * - localStorage 持久化：_kb_hit_count/{moduleId}、_kb_hit_count/_total、_kb_hit_today
 * - 当日统计划到自然日切换
 * - 提供 record(moduleId, score, usedKb) 与 renderBar(el)
 * - 兼容既有的 _kbHitCount / _kbScore / _kbTodayCount（直接接管，不再重复打点）
 *
 * 字段：
 *   _kb_hit_count/{moduleId}      累计每个模块命中次数（KB 直答 ≥ 0.7 触发）
 *   _kb_hit_count/_total          全局累计
 *   _kb_hit_today                 {date:'Fri Jul 25 2026', count:N}
 *   _kb_hit_events/{yyyymmdd}     当日按时序记录 [{m,o,s,t}]，命中率 = 命中条 / 总条
 *
 * 命中率：
 *   - ≥ 0.7 视为「KB 直答」（记入 hit_count）
 *   - 0.4 ~ 0.7 视为「KB+AI 润色」（记入 events 但不算 hit）
 *   - < 0.4 视为「AI+KB 兜底」（记入 events 但不算 hit）
 *
 * 用法（在 ai-assistant.html）：
 *   KbHitCounter.record(moduleId, score, true)  // 一次 KB 直答
 *   KbHitCounter.renderBar(document.getElementById('kbStatsBar'))
 *   refreshKbStatsBar()                         // 全局便捷函数
 */
(function (global) {
  'use strict';

  const KEY_PREFIX = '_kb_hit_count/';
  const KEY_TODAY = '_kb_hit_today';
  const EVT_PREFIX = '_kb_hit_events/';
  const ENGINE_PREFIX = '_kb_engine_count/';

  // ── 工具 ──────────────────────────────────────────────
  function _safeGet(k, fallback) {
    try { return localStorage.getItem(k); } catch (e) { return fallback; }
  }
  function _safeSet(k, v) {
    try { localStorage.setItem(k, v); } catch (e) { /* 隐私模式静默 */ }
  }
  function _safeParse(s, fallback) {
    if (s == null || s === '') return fallback;
    try { const r = JSON.parse(s); return (r === null || r === undefined) ? fallback : r; } catch (e) { return fallback; }
  }
  function _todayStr() { return new Date().toDateString(); }
  function _ymd() {
    const d = new Date();
    return d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0');
  }
  function _now() { return Date.now(); }
  function _fmt(n) {
    n = Number(n) || 0;
    if (n >= 100000) return Math.round(n / 1000) + 'K';
    if (n >= 10000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // ── 命中分阈值 ────────────────────────────────────────
  const THRESHOLD_DIRECT = 0.7;   // KB 直答
  const THRESHOLD_HINT  = 0.4;   // KB+AI 润色
  function _bucket(score) {
    if (score >= THRESHOLD_DIRECT) return 'direct';
    if (score >= THRESHOLD_HINT) return 'mix';
    return 'fallback';
  }

  const KbHitCounter = {
    threshold: { direct: THRESHOLD_DIRECT, mix: THRESHOLD_HINT },

    /** 读取当日 {date, count} 并自增（如果日期已切换则归零） */
    bumpToday: function () {
      const today = _todayStr();
      const data = _safeParse(_safeGet(KEY_TODAY, '{}'), {});
      let n = 0;
      if (data && data.date === today) {
        n = Number(data.count) || 0;
      }
      n++;
      _safeSet(KEY_TODAY, JSON.stringify({ date: today, count: n }));
      return n;
    },

    /**
     * 一次 AI 回复打点
     * @param {string} moduleId 模块 ID（bazi/ziwei/...）
     * @param {number} score 命中分 0~1
     * @param {boolean} usedKb true = 走了 KB；false = 纯 AI
     */
    record: function (moduleId, score, usedKb) {
      const m = String(moduleId || 'unknown');
      const s = Number(score);
      const bucket = _bucket(Number.isFinite(s) ? s : 0);

      // 1) 每模块累计（保持与 _kbHitCount 一致：仅 direct 计入）
      if (bucket === 'direct') {
        const key = KEY_PREFIX + m;
        const n = (parseInt(_safeGet(key, '0'), 10) || 0) + 1;
        _safeSet(key, String(n));
        // 累计总命中
        const tk = KEY_PREFIX + '_total';
        const tn = (parseInt(_safeGet(tk, '0'), 10) || 0) + 1;
        _safeSet(tk, String(tn));
        // 今日命中
        KbHitCounter.bumpToday();
      }

      // 2) 当日事件流（用于命中率分母）
      const dayKey = EVT_PREFIX + _ymd();
      const events = _safeParse(_safeGet(dayKey, '[]'), []);
      events.push({
        m: m,
        s: Math.round(s * 100) / 100,
        b: bucket,
        o: !!usedKb,
        t: _now()
      });
      // 只保留最近 200 条避免膨胀
      if (events.length > 200) events.splice(0, events.length - 200);
      _safeSet(dayKey, JSON.stringify(events));

      return { bucket: bucket, score: s, moduleId: m };
    },

    /**
     * 读取统计快照
     * @returns {{today:number,total:number,directToday:number,eventsToday:number,hitRate:number,topModule:string|null,topCount:number,byModule:Array<{k:string,n:number}>}}
     */
    getStats: function () {
      const today = _todayStr();
      const td = _safeParse(_safeGet(KEY_TODAY, '{}'), {});
      const todayN = (td && td.date === today) ? (Number(td.count) || 0) : 0;

      let totalN = 0;
      let topMod = null, topCnt = 0;
      const byModule = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || k.indexOf(KEY_PREFIX) !== 0) continue;
          const sub = k.substring(KEY_PREFIX.length);
          const v = parseInt(_safeGet(k, '0'), 10) || 0;
          if (sub === '_total') { totalN = v; continue; }
          byModule.push({ k: sub, n: v });
          if (v > topCnt) { topCnt = v; topMod = sub; }
        }
      } catch (e) { /* 隐私模式静默 */ }

      // 当日事件流 → 命中率
      const dayKey = EVT_PREFIX + _ymd();
      const events = _safeParse(_safeGet(dayKey, '[]'), []);
      const eventsToday = events.length;
      const directToday = events.filter(e => e.b === 'direct').length;
      const hitRate = eventsToday > 0 ? Math.round(directToday * 100 / eventsToday) : 0;

      return {
        today: todayN,
        total: totalN,
        directToday: directToday,
        eventsToday: eventsToday,
        hitRate: hitRate,
        topModule: topMod,
        topCount: topCnt,
        byModule: byModule.sort((a, b) => b.n - a.n).slice(0, 5)
      };
    },

    /**
     * 记录引擎使用（R27-P1）
     * @param {string} engine fts5 / like-fallback / like-primary
     */
    recordEngine: function (engine) {
      const e = String(engine || 'unknown');
      const key = ENGINE_PREFIX + e;
      const n = (parseInt(_safeGet(key, '0'), 10) || 0) + 1;
      _safeSet(key, String(n));
      return n;
    },

    /**
     * 读取引擎分布快照
     * @returns {{fts5:number, likeFallback:number, likePrimary:number, total:number}}
     */
    getEngineStats: function () {
      let fts5 = 0, likeFallback = 0, likePrimary = 0, total = 0;
      try {
        for (var i = 0; i < localStorage.length; i++) {
          var k = localStorage.key(i);
          if (!k || k.indexOf(ENGINE_PREFIX) !== 0) continue;
          var v = parseInt(_safeGet(k, '0'), 10) || 0;
          total += v;
          if (k === ENGINE_PREFIX + 'fts5') fts5 = v;
          else if (k === ENGINE_PREFIX + 'like-fallback') likeFallback = v;
          else if (k === ENGINE_PREFIX + 'like-primary') likePrimary = v;
        }
      } catch (e) { /* 静默 */ }
      return { fts5: fts5, likeFallback: likeFallback, likePrimary: likePrimary, total: total };
    },

    /**
     * 把统计渲染到容器
     * @param {HTMLElement} el  容器元素
     */
    renderBar: function (el) {
      if (!el) return;
      var s = KbHitCounter.getStats();
      var eg = KbHitCounter.getEngineStats();
      var topTxt = s.topModule ? (' · 🏆 最强 ' + s.topModule + '(' + _fmt(s.topCount) + ')') : '';
      // 引擎徽章（R27-P1）
      var engineBadge = '';
      if (eg.total > 0) {
        if (eg.fts5 > 0) engineBadge += '<span class="kb-engine-badge fts5">⚡ FTS5 ' + _fmt(eg.fts5) + '</span>';
        if (eg.likeFallback > 0) engineBadge += '<span class="kb-engine-badge like">🔄 LIKE ' + _fmt(eg.likeFallback) + '</span>';
        if (eg.likePrimary > 0) engineBadge += '<span class="kb-engine-badge like-p">📖 热门 ' + _fmt(eg.likePrimary) + '</span>';
      }
      el.innerHTML =
        '<span class="kb-bar-icon">📊</span>' +
        '<span class="kb-bar-item">今日 KB 直答 <b id="kbHitToday">' + _fmt(s.today) + '</b> 次</span>' +
        '<span class="kb-bar-sep">·</span>' +
        '<span class="kb-bar-item">命中率 <b id="kbHitRate">' + s.hitRate + '</b> %</span>' +
        '<span class="kb-bar-sep">·</span>' +
        '<span class="kb-bar-item">累计 <b id="kbHitTotal">' + _fmt(s.total) + '</b> 次</span>' +
        (topTxt ? '<span class="kb-bar-top">' + topTxt + '</span>' : '') +
        (engineBadge ? '<span class="kb-bar-engines">' + engineBadge + '</span>' : '');
      el.classList.add('kb-stats-bar-ready');
    }
  };

  global.KbHitCounter = KbHitCounter;

  // ── 全局便捷函数（按 R25-P0-1 任务规范命名）──
  /** 完整打点 + 渲染 stats bar（每次 AI 回复完成后调用） */
  global.recordKbHit = function (moduleId, score, usedKb) {
    try {
      KbHitCounter.record(moduleId, score, usedKb);
    } catch (e) { /* 静默 */ }
    try {
      refreshKbStatsBar();
    } catch (e) { /* 静默 */ }
  };
  /** 重新渲染 stats bar（DOMContentLoaded 后任何时候调用） */
  global.refreshKbStatsBar = function () {
    try {
      const el = document.getElementById('kbStatsBar');
      if (el) KbHitCounter.renderBar(el);
    } catch (e) { /* 静默 */ }
  };

  /** R27-P1：记录引擎使用 + 重渲染 stats bar */
  global.recordKbEngine = function (engine) {
    try {
      KbHitCounter.recordEngine(engine);
    } catch (e) { /* 静默 */ }
    try {
      refreshKbStatsBar();
    } catch (e) { /* 静默 */ }
  };

  // ── 自动初始化 ─────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    // 等 DOM 就绪后再调用（defer 也能跑，但更稳）
    setTimeout(function () {
      try { refreshKbStatsBar(); } catch (e) {}
    }, 30);
  });
})(typeof window !== 'undefined' ? window : globalThis);
