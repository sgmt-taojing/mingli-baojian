// 流程引擎 — 轻量级步骤指引
var FlowEngine = {
  // 创建步骤条
  steps: function(containerId, steps, current) {
    var el = document.getElementById(containerId);
    if(!el) return;
    var html = '<div class="flow-steps">';
    steps.forEach(function(step, i) {
      var cls = i < current ? 'done' : (i === current ? 'active' : '');
      html += '<div class="flow-step ' + cls + '"><span class="flow-step-num">' + (i+1) + '</span><span>' + step + '</span></div>';
      if(i < steps.length - 1) html += '<span class="flow-step-arrow">→</span>';
    });
    html += '</div>';
    el.innerHTML = html;
  },
  
  // 创建帮助提示
  hint: function(text) {
    return '<div class="flow-hint">' + text + '</div>';
  },
  
  // 创建快捷链接
  quicklinks: function(links) {
    if(!links || links.length === 0) return '';
    var html = '<div class="flow-quicklinks">';
    links.forEach(function(l) {
      html += '<a class="flow-quicklink" href="' + l.url + '">' + (l.icon||'🔗') + ' ' + l.name + '</a>';
    });
    html += '</div>';
    return html;
  },
  
  // 会诊确认流程
  confirm: function(title, body, onConfirm, onCancel) {
    var id = 'flowConfirm_' + Date.now();
    var html = '<div class="flow-confirm show" id="' + id + '">' +
      '<div class="flow-confirm-title">' + title + '</div>' +
      '<div class="flow-confirm-body">' + body + '</div>' +
      '<div class="flow-confirm-actions">' +
      '<button class="flow-confirm-btn primary" onclick="(function(){document.getElementById(\'' + id + '\').style.display=\'none\';' + (onConfirm||'') + '})()">确认</button>' +
      '<button class="flow-confirm-btn" onclick="document.getElementById(\'' + id + '\').style.display=\'none\';' + (onCancel||'') + '">取消</button>' +
      '</div></div>';
    return html;
  }
};
