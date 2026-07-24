/**
 * rokid-storage.js
 * ====================================================================
 * 命理宝jian · 眼镜端离线缓存（32GB）
 *
 *   1) Cache API：HTTP 响应级缓存（H5 / 字体 / 静态资源 + 短视频）
 *   2) IndexedDB：结构化数据（舌象 / 面诊 / 问诊记录 / 模块 KB 副本）
 *   3) Rokid bridge 可选直通 filesystem（眼镜 32GB），通过 STORAGE_GET/SET
 *      可读写任意 key-value，但容量大、接口简单。
 *
 *   提供统一 facade：get/put/del/listStat
 *   优先走 bridge → 兜底走 localStorage → 兜底走 IndexedDB。
 * ====================================================================
 */

(function (global) {
  'use strict';

  const LS_KEY = 'rokid-storage::';

  async function viaBridge(op, key, value) {
    if (!global.RokidBridge || !global.RokidBridge.available) return null;
    const ev = op === 'get' ? 'storage.get' : (op === 'set' ? 'storage.set' : 'storage.del');
    try { return await global.RokidBridge.call(ev, { key, value }); }
    catch (e) { console.warn('[RokidStorage] bridge op 失败：', e.message); return null; }
  }

  async function openIdb() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open('rokid-mingli', 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv', { keyPath: 'k' });
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  async function idbOp(op, key, value) {
    try {
      const db = await openIdb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('kv', 'readonly');
        const store = tx.objectStore('kv');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.v : null);
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      // fallback to localStorage
      try {
        const v = localStorage.getItem(LS_KEY + key);
        return v ? JSON.parse(v) : null;
      } catch (_) { return null; }
    }
  }
  async function idbPut(key, value) {
    try {
      const db = await openIdb();
      return await new Promise((resolve, reject) => {
        const tx = db.transaction('kv', 'readwrite');
        const store = tx.objectStore('kv');
        const req = store.put({ k: key, v: value });
        req.onsuccess = () => resolve(true);
        req.onerror = () => reject(req.error);
      });
    } catch (_) {
      try { localStorage.setItem(LS_KEY + key, JSON.stringify(value)); return true; }
      catch (_) { return false; }
    }
  }

  async function get(key) {
    let v = await viaBridge('get', key);
    if (v !== null && v !== undefined) return v;
    return await idbOp('get', key);
  }
  async function put(key, value) {
    const ok = await viaBridge('set', key, value);
    if (ok) return true;
    return await idbPut(key, value);
  }
  async function del(key) {
    await viaBridge('del', key);
    try {
      localStorage.removeItem(LS_KEY + key);
      const db = await openIdb();
      await new Promise((res, rej) => {
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').delete(key);
        tx.oncomplete = res;
        tx.onerror = () => rej(tx.error);
      });
      return true;
    } catch (_) { return false; }
  }

  /** 取剩余容量估算（navigator.storage.estimate） */
  async function estimate() {
    if (navigator.storage && navigator.storage.estimate) {
      try { return await navigator.storage.estimate(); } catch (_) {}
    }
    return { quota: null, usage: null };
  }

  /** 静态资源预缓存（用 Cache API） */
  async function precache(urls) {
    if (!('caches' in global)) return false;
    const cache = await caches.open('rokid-static-v1');
    await cache.addAll(urls);
    return true;
  }

  global.RokidStorage = { get, put, del, estimate, precache };
  console.info('[RokidStorage] init · bridge → IDB → localStorage 三级 fallback');
})(typeof window !== 'undefined' ? window : globalThis);
