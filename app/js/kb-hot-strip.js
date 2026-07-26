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
 * R31-A 2026-07-26 09:40 GMT+8
 */
(function () {
  'use strict';

  var HOT_LIMIT = 3;
  var STRIP_ID = 'kb-hot-strip';
  var LS_PREFIX = '_kb_hit_count/';
  var API_BASE = (typeof window.API_BASE === 'string' ? window.API_BASE : '') || 'http://127.0.0.1:8920';

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

  /**
   * 服务端兜底: /api/public/kb/search 按 hit_count 降序
   */
  function fetchServerTop() {
    return fetch(API_BASE + '/api/public/kb/search?q=&limit=' + HOT_LIMIT + '&sort=hit_count', {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.ok || !data.data || !Array.isArray(data.data.results)) return [];
        return data.data.results.slice(0, HOT_LIMIT).map(function (item) {
          return {
            module: item.module || item.source || 'kb',
            count: item.hit_count || 1,
            title: item.title || item.name || item.entry_id,
            summary: (item.summary || item.content || '').slice(0, 60)
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
      html += '<a class="kb-hot-card" href="' + href + '" data-rank="' + rank + '">'
        + '<span class="kb-hot-rank">' + rank + '</span>'
        + '<div class="kb-hot-body">'
        + '<div class="kb-hot-name">' + (it.title || it.module) + '</div>'
        + '<div class="kb-hot-meta-line">'
        + '<span class="kb-hot-tag">' + moduleLabel(it.module) + '</span>'
        + '<span class="kb-hot-hits">命中 ' + it.count + ' 次</span>'
        + '</div>'
        + '</div>'
        + '<span class="kb-hot-arrow">→</span>'
        + '</a>';
    });
    html += '</div>';
    host.innerHTML = html;
    host.style.display = 'block';
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