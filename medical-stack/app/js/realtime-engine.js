/**
 * Realtime Engine V1 — 跨页面统一实时刷新机制
 * 使用对象：全端用户
 * 功能：CRUD 操作后自动通知 + 多 Tab 同步 + 弱网重试 + 操作审计
 * 设计原则：
 *   1. 基于 BroadcastChannel（多 Tab 同步）+ localStorage 事件（跨页面）
 *   2. 可配置：刷新间隔 / 事件白名单 / 降级策略
 *   3. 无 alert/console（用 window.TCM.toast）
 *   4. 零依赖：纯浏览器原生 API
 */
(function() {
  'use strict';

  if (window.__REALTIME_ENGINE__) return;
  window.__REALTIME_ENGINE__ = true;

  var NS = 'tcm_rt_';
  var channel = null;
  var listeners = [];
  var refreshIntervals = {};
  var retryMap = {};

  // ────────────── 多 Tab 同步（BroadcastChannel）──────────────
  function initChannel() {
    if (channel) return;
    try {
      channel = new BroadcastChannel('tcm-realtime');
      channel.onmessage = function(ev) {
        var data = ev.data;
        if (!data || !data.type) return;
        // 派发到所有 listener
        listeners.forEach(function(fn) {
          try { fn(data); } catch(e) {}
        });
      };
    } catch(e) {
      // 老浏览器降级到 storage event
      window.addEventListener('storage', function(e) {
        if (!e.key || !e.key.startsWith(NS)) return;
        try {
          var data = JSON.parse(e.newValue || '{}');
          listeners.forEach(function(fn) {
            try { fn(data); } catch(err) {}
          });
        } catch(err) {}
      });
    }
  }

  // ────────────── 广播 CRUD 操作 ──────────────
  function broadcast(eventType, payload) {
    var msg = {
      type: eventType,
      payload: payload || {},
      tab_id: getTabId(),
      ts: Date.now()
    };
    // 写入 localStorage（触发 storage 事件，跨域兼容）
    try {
      localStorage.setItem(NS + 'event', JSON.stringify(msg));
    } catch(e) {}
    // 同一浏览器多 Tab
    if (channel) {
      try { channel.postMessage(msg); } catch(e) {}
    }
    return msg;
  }

  function getTabId() {
    if (!window.__TCM_TAB_ID__) {
      window.__TCM_TAB_ID__ = 'tab-' + Date.now().toString(36) + '-' + (Math.floor(performance.now() * 1000) % 1296).toString(36);
    }
    return window.__TCM_TAB_ID__;
  }

  // ────────────── 监听 ──────────────
  function on(eventType, handler) {
    if (typeof handler !== 'function') return;
    listeners.push(function(msg) {
      if (msg.type === eventType || eventType === '*') {
        handler(msg.payload, msg);
      }
    });
  }

  function off(eventType, handler) {
    // 简化：清除后重建
    listeners = [];
  }

  // ────────────── 自动轮询（针对弱网环境）──────────────
  function autoRefresh(targetId, callback, intervalMs) {
    if (!targetId || typeof callback !== 'function') return;
    var ms = intervalMs || 10000;
    if (refreshIntervals[targetId]) {
      clearInterval(refreshIntervals[targetId]);
    }
    refreshIntervals[targetId] = setInterval(function() {
      try { callback(); } catch(e) {}
    }, ms);
  }

  function stopAutoRefresh(targetId) {
    if (refreshIntervals[targetId]) {
      clearInterval(refreshIntervals[targetId]);
      delete refreshIntervals[targetId];
    }
  }

  // ────────────── 弱网重试 ──────────────
  function withRetry(fn, opts) {
    opts = opts || {};
    var maxRetries = opts.maxRetries || 3;
    var delay = opts.delay || 1000;
    var retries = 0;
    function attempt() {
      return Promise.resolve(fn()).catch(function(err) {
        if (retries >= maxRetries) {
          broadcast('retry_failed', { error: err.message, retries: retries });
          throw err;
        }
        retries++;
        return new Promise(function(r) { setTimeout(r, delay * retries); })
          .then(attempt);
      });
    }
    return attempt();
  }

  // ────────────── 操作审计 ──────────────
  function audit(action, payload) {
    var entry = {
      action: action,
      payload: payload || {},
      tab: getTabId(),
      ts: new Date().toISOString()
    };
    try {
      var log = JSON.parse(localStorage.getItem(NS + 'audit') || '[]');
      log.push(entry);
      if (log.length > 200) log = log.slice(-200);
      localStorage.setItem(NS + 'audit', JSON.stringify(log));
    } catch(e) {}
    return entry;
  }

  function getAudit() {
    try { return JSON.parse(localStorage.getItem(NS + 'audit') || '[]'); }
    catch(e) { return []; }
  }

  // ────────────── 高阶：CRUD 包装器 ──────────────
  function wrapCRUD(moduleId) {
    // 包装现有 crud-engine 的 add/update/delete，触发广播
    if (!window.TCM || !window.TCM.crud) return;
    var crud = window.TCM.crud;
    var origAdd = crud.add, origUpdate = crud.update, origRemove = crud.remove;
    if (!crud.__wrapped) {
      crud.add = function(mod, data) {
        var item = origAdd(mod, data);
        broadcast('crud_add', { module: mod, item: item });
        audit('add_' + mod, { id: item.id });
        return item;
      };
      crud.update = function(mod, id, data) {
        var item = origUpdate(mod, id, data);
        broadcast('crud_update', { module: mod, item: item });
        audit('update_' + mod, { id: id });
        return item;
      };
      crud.remove = function(mod, id) {
        var ok = origRemove(mod, id);
        broadcast('crud_delete', { module: mod, id: id });
        audit('delete_' + mod, { id: id });
        return ok;
      };
      crud.__wrapped = true;
    }
  }

  // ────────────── 暴露 ──────────────
  if (!window.TCM) window.TCM = {};
  if (!window.TCM.realtime) {
    window.TCM.realtime = {
      on: on,
      off: off,
      broadcast: broadcast,
      autoRefresh: autoRefresh,
      stopAutoRefresh: stopAutoRefresh,
      withRetry: withRetry,
      audit: audit,
      getAudit: getAudit,
      wrapCRUD: wrapCRUD,
      init: initChannel,
      tabId: getTabId
    };
  }

  // 自动初始化
  initChannel();

  // 自动 wrap 所有 CRUD（延迟到 DOMReady 后确保 crud-engine 先加载）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setTimeout(function() { wrapCRUD(); }, 100); });
  } else {
    setTimeout(wrapCRUD, 100);
  }

})();