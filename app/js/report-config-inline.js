
// 模块配置页面逻辑
(function(){
  // 从全局获取模块定义（divination-core.js加载后可用）
  var MODULES = window.REPORT_MODULES || {};
  var moduleIds = Object.keys(MODULES).sort(function(a,b){
    return (MODULES[a].order || 99) - (MODULES[b].order || 99);
  });

  // 当前编辑状态
  var editState = {};

  // 初始化
  function init() {
    var config = getReportConfig();
    moduleIds.forEach(function(id) {
      editState[id] = config ? (config.modules[id] !== false) : true;
    });
    renderList();
    renderPreview();
  }

  // 渲染模块列表
  function renderList() {
    var container = document.getElementById('moduleList');
    if (!container) return;
    var html = '';
    moduleIds.forEach(function(id, idx) {
      var m = MODULES[id];
      var enabled = editState[id];
      html += '<ml-tap class="module-card ' + (enabled ? 'enabled' : 'disabled') + '" onclick="toggleModule(\'' + id + '\')" variant="card" role="button" tabindex="0">';
      html += '<div class="module-order">' + (idx + 1) + '</div>';
      html += '<div class="module-icon">' + (m.icon || '📋') + '</div>';
      html += '<div class="module-info">';
      html += '<div class="module-name">' + m.name + '</div>';
      html += '<div class="module-desc">' + m.desc + '</div>';
      html += '</div>';
      html += '<div class="module-toggle"></div>';
      html += '</ml-tap>';
    });
    container.innerHTML = html;
  }

  // 渲染预览
  function renderPreview() {
    var container = document.getElementById('previewList');
    if (!container) return;
    var html = '';
    moduleIds.forEach(function(id) {
      var m = MODULES[id];
      var enabled = editState[id];
      var cls = enabled ? '' : 'disabled';
      html += '<span class="preview-tag ' + cls + '">' + (m.icon || '') + ' ' + m.name + '</span>';
    });
    container.innerHTML = html;
  }

  // 切换单个模块
  window.toggleModule = function(id) {
    editState[id] = !editState[id];
    renderList();
    renderPreview();
  };

  // 全选
  window.selectAllModules = function() {
    moduleIds.forEach(function(id) { editState[id] = true; });
    renderList();
    renderPreview();
    showToast('已全选');
  };

  // 全不选
  window.deselectAllModules = function() {
    moduleIds.forEach(function(id) { editState[id] = false; });
    renderList();
    renderPreview();
    showToast('已全不选');
  };

  // 重置
  window.resetConfig = function() {
    resetReportConfig();
    moduleIds.forEach(function(id) { editState[id] = true; });
    renderList();
    renderPreview();
    showToast('已重置为默认全量模式');
  };

  // 保存
  window.saveConfig = function() {
    var modules = {};
    moduleIds.forEach(function(id) {
      modules[id] = editState[id];
    });
    saveReportConfig(modules, moduleIds);
    showToast('✅ 配置已保存');
  };

  // toast
  function showToast(msg) {
    var el = document.getElementById('statusToast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 2000);
  }

  // 启动
  if (Object.keys(MODULES).length === 0) {
    // divination-core.js 可能未完全加载，延迟重试
    setTimeout(function() {
      MODULES = window.REPORT_MODULES || {};
      moduleIds = Object.keys(MODULES).sort(function(a,b){
        return (MODULES[a].order || 99) - (MODULES[b].order || 99);
      });
      init();
    }, 200);
  } else {
    init();
  }
})();
