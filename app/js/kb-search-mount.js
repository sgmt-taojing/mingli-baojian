// ═══════════════════════════════════════════════════════════════
// kb-search-mount.js — divination-hub KB 搜索挂载入口
// R31-B 任务新增：把 kb-search-box 挂到 hero 下的 kb-search-mount
// ═══════════════════════════════════════════════════════════════

(function () {
  'use strict';
  var MOUNT_ID = 'kb-search-mount';

  function init() {
    var host = document.getElementById(MOUNT_ID);
    if (!host) return;
    if (typeof window.mountKbSearchBox !== 'function') return;
    window.mountKbSearchBox(host);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();