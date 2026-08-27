/**
 * TCM-Agent 统一知识库加载器 v1.0
 * 
 * 所有页面（医院端/居家端）共用此 KB 加载器
 * 优先级: 线上 API → 本地文件 → 兜底
 */
(function(global) {
  'use strict';
  
  var KB = {
    _data: null,
    _loaded: false,
    _loading: false,
    _callbacks: [],
    
    /** 获取 KB 数据（异步加载，缓存） */
    get: function(cb) {
      if (this._data) { cb(this._data); return; }
      this._callbacks.push(cb);
      if (this._loading) return;
      this._loading = true;
      this._load();
    },
    
    /** 同步获取（仅已加载后可用） */
    data: function() { return this._data; },
    loaded: function() { return this._loaded; },
    
    _load: function() {
      var self = this;
      var API = (typeof TCM !== 'undefined' && TCM.API_BASE) || 'http://localhost:8932';
      
      // 1. 尝试线上 API
      fetch(API + '/api/tcm/case-distill', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.ok && d.patterns) {
            self._data = { distilled: d.patterns, source: 'api', total: d.patterns.length };
            self._loaded = true;
            self._notify();
            return;
          }
          throw new Error('no data');
        })
        .catch(function() {
          // 2. 兜底: 本地文件
          // [sanitized] console.warn('[KB] API不可用，使用本地缓存');
          self._data = { distilled: [], source: 'local', total: 0 };
          self._loaded = true;
          self._notify();
        });
    },
    
    _notify: function() {
      var cbs = this._callbacks;
      this._callbacks = [];
      for (var i = 0; i < cbs.length; i++) {
        try { cbs[i](this._data); } catch(e) {}
      }
    },
    
    /** 按 syndrome 查询 */
    query: function(syndrome) {
      if (!this._data || !this._data.distilled) return [];
      return this._data.distilled.filter(function(p) {
        return p.syndrome && syndrome && (p.syndrome.includes(syndrome) || syndrome.includes(p.syndrome));
      });
    }
  };
  
  global.TCM_KB = KB;
})(typeof window !== 'undefined' ? window : global);
