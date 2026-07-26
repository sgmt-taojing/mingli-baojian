/**
 * kb-hot-strip.js — 命理宝鉴 R31-A KB 热门条
 *
 * 职责:
 *   - 渲染「今日热门知识 Top3」横条
 *   - 数据源:
 *       (1) 本地: localStorage._kb_hit_count/* (来自 ai-assistant 等)
 *       (2) 兜底: API /api/public/kb/search?q=&limit=3 (按 hit_count desc)
 *   - 自适应: 3 列 → 1 列 (max-width:768px)
 *   - 点击: 跳转 divination-knowledge.html?q=<title>
 *
 * R31-C 2026-07-26 10:25 GMT+8
 *   - 每张卡加「+1 推荐」按钮
 *   - 点击 → localStorage _kb_recommend_count/<mod> += 1
 *   - 同步命中计数 (+1) → 拖高模块上升至 Top 位
 *   - 顶部「已推荐 N 次」统计
 */
(function () {
  'use strict';

  var HOT_LIMIT = 3;
  var STRIP_ID = 'kb-hot-strip';
  var LS_PREFIX = '_kb_hit_count/';
  var REC_PREFIX = '_kb_recommend_count/';
  // 优先同源（反代走 8914 → 8920），fallback 绝对 8920
  var API_BASE = (typeof window.API_BASE === 'string' ? window.API_BASE : '')
    || (typeof window.location !== 'undefined' && /^https?:$/.test(window.location.protocol)
        ? window.location.origin : '')
    || 'http://127.0.0.1:8920';

  /**
   * 从 localStorage 读 KB 命中计数 → Top N
   */
  function readLocalTop() {
    try {
      var ls = window.localStorage || null;
      if (!ls) return [];
      var top = [];
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (!k || k.indexOf(LS_PREFIX) !== 0) continue;
        var mod = k.substring(LS_PREFIX.length);
        var n = parseInt(ls.getItem(k), 10) || 0;
        if (n > 0) top.push({ module: mod, count: n });
      }
      top.sort(function (a, b) { return b.count - a.count; });
      return top.slice(0, HOT_LIMIT);
    } catch (e) {
      console.warn('[kb-hot-strip] localStorage 读取失败', e);
      return [];
    }
  }

  /** 推荐总数统计 */
  function readLocalRec() {
    try {
      var ls = window.localStorage || null;
      if (!ls) return 0;
      var tot = 0;
      for (var i = 0; i < ls.length; i++) {
        var k = ls.key(i);
        if (k && k.indexOf(REC_PREFIX) === 0) {
          tot += parseInt(ls.getItem(k), 10) || 0;
        }
      }
      return tot;
    } catch (e) { return 0; }
  }

  /** 给指定模块 +1 推荐 */
  function bumpRec(mod) {
    try {
      var ls = window.localStorage;
      if (!ls) return 0;
      var k = REC_PREFIX + mod;
      var n = (parseInt(ls.getItem(k), 10) || 0) + 1;
      ls.setItem(k, String(n));
      return n;
    } catch (e) { return 0; }
  }

  /**
   * 服务端兜底: /api/public/kb/stats 返回 top_modules，
   * 按 hits desc 取前 N（已有全库汇总，避免拉全表）
   */
  function fetchServerTop() {
    return fetch(API_BASE + '/api/public/kb/stats', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (json) {
        if (!json || json.code !== 0 || !json.data) return [];
        var mods = json.data.top_modules || [];
        return mods
          .filter(function (m) { return (m.hits || 0) > 0; })
          .slice(0, HOT_LIMIT)
          .map(function (m) {
            return {
              module: m.module,
              count: m.hits,
              title: m.module,
              summary: '全库命中 ' + m.hits + ' 次 · 共 ' + m.cnt + ' 条'
            };
          });
      })
      .catch(function () { return []; });
  }

  /**
   * 把 module 名翻译成中文标签（AI 助手模块映射）
   */
  function moduleLabel(mod) {
    var map = {
      bazi: '八字', ziwei: '紫微', qimen: '奇门',
      liuyao: '六爻', meihua: '梅花', liuren: '六壬',
      fengshui: '风水', shuhan: '舒晗', nihaisha: '倪师',
      tcm: '中医', 'tcm-acupuncture': '针灸', 'tcm-fangji': '方剂',
      'tcm-classic': '经典', shanghan: '伤寒', acupuncture: '穴位',
      yijing: '易经', zodiac: '生肖', lifeplan: '人生',
      music: '音乐', lifeindex: '运势', divine: '占卜',
      knowledge: '知识'
    };
    return map[mod] || mod;
  }

  /**
   * 渲染顶部「已推荐 N 次」统计
   */
  function renderRecBar(host, totalRec) {
    var bar = host.querySelector('.kb-hot-recommend-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'kb-hot-recommend-bar';
      host.insertBefore(bar, host.firstChild);
    }
    bar.innerHTML = '👍 你今天已推荐 <strong>' + totalRec + '</strong> 次';
  }

  /**
   * 处理「+1 推荐」点击
   * - 更新 localStorage
   * - 同步命中计数 (+1) → 拖高模块上升至 Top
   * - 重排 + 重渲染
   */
  function onRecommendClick(e, host) {
    e.preventDefault();
    e.stopPropagation();
    var btn = e.currentTarget;
    var mod = btn.getAttribute('data-mod');
    if (!mod) return;
    var newCount = bumpRec(mod);
    // 同步命中计数（与 AI 助手打点共用同一 key）
    try {
      var ls = window.localStorage;
      var hk = LS_PREFIX + mod;
      var hc = (parseInt(ls.getItem(hk), 10) || 0) + 1;
      ls.setItem(hk, String(hc));
    } catch (e2) {}
    // 反馈动效
    btn.classList.add('kb-hot-btn-pulsed');
    btn.textContent = '+1 ✓ ' + newCount;
    setTimeout(function () {
      btn.classList.remove('kb-hot-btn-pulsed');
      btn.textContent = '+1';
    }, 1400);
    // 更新顶部统计
    renderRecBar(host, readLocalRec());
    // 2 秒后重排 (拖高的模块会上升到 Top)
    setTimeout(function () {
      var merged = readLocalTop();
      if (merged.length === 0) {
        fetchServerTop().then(function (server) { renderStrip(host, server); });
      } else {
        renderStrip(host, merged);
      }
    }, 2000);
  }

  /**
   * 渲染 strip DOM 到指定容器
   */
  function renderStrip(host, items) {
    if (!host) return;
    if (!items || items.length === 0) {
      host.style.display = 'none';
      return;
    }
    var html = '<div class="kb-hot-title">'
      + '<span class="kb-hot-icon">🔥</span>'
      + '<span>今日热门知识 Top ' + items.length + '</span>'
      + '<span class="kb-hot-meta">KB 直答热榜</span>'
      + '</div>'
      + '<div class="kb-hot-grid">';
    items.forEach(function (it, idx) {
      var rank = idx + 1;
      var q = encodeURIComponent(it.title || it.module);
      var href = 'divination-knowledge.html?q=' + q;
      var safeMod = (it.module || '').replace(/"/g, '&quot;');
      html += '<a class="kb-hot-card" href="' + href + '" data-rank="' + rank + '" data-mod="' + safeMod + '">'
        + '<span class="kb-hot-rank">' + rank + '</span>'
        + '<div class="kb-hot-body">'
        + '<div class="kb-hot-name">' + (it.title || it.module) + '</div>'
        + '<div class="kb-hot-meta-line">'
        + '<span class="kb-hot-tag">' + moduleLabel(it.module) + '</span>'
        + '<span class="kb-hot-hits">命中 ' + it.count + ' 次</span>'
        + '</div>'
        + '</div>'
        + '<span class="kb-hot-arrow">→</span>'
        + '<button class="kb-hot-rec-btn" type="button" data-mod="' + safeMod + '" title="+1 推荐">+1</button>'
        + '</a>';
    });
    html += '</div>';
    host.innerHTML = html;
    host.style.display = 'block';
    // 绑定按钮事件
    var btns = host.querySelectorAll('.kb-hot-rec-btn');
    btns.forEach(function (b) {
      b.addEventListener('click', function (e) { onRecommendClick(e, host); });
    });
    // 顶部推荐统计
    renderRecBar(host, readLocalRec());
  }

  /**
   * 主入口
   */
  function init() {
    var host = document.getElementById(STRIP_ID);
    if (!host) return;
    var local = readLocalTop();
    if (local.length > 0) {
      // 本地已有命中数据 → 用本地（实时、零延迟）
      renderStrip(host, local);
    } else {
      // 兜底：服务端拉
      fetchServerTop().then(function (server) {
        if (server.length > 0) {
          renderStrip(host, server);
        } else {
          host.style.display = 'none';
        }
      });
    }
  }

  // DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();