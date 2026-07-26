/**
 * kb-fallback-indicator.js · KB 兜底就绪指示器
 *
 * 当页面引入 module-reports-kb.js 后，_MODULE_REPORTS 全局对象可用，
 * 本组件在页面右上角显示一个"KB 兜底就绪"绿色小标。
 * 用户点击可查看该模块的兜底报告预览。
 *
 * 用法：
 *   <script src="js/module-reports-kb.js" defer></script>
 *   <script src="js/kb-fallback-indicator.js" defer></script>
 *   <body data-kb-module="music">  ← 指定模块名
 */
(function () {
  'use strict';

  function init() {
    if (!window._MODULE_REPORTS) return;

    var mod = document.body.getAttribute('data-kb-module');
    if (!mod) return;

    var entry = window._MODULE_REPORTS[mod];
    if (!entry) return;

    // 创建 badge
    var badge = document.createElement('div');
    badge.id = 'kb-fallback-badge';
    badge.style.cssText = [
      'position:fixed', 'top:12px', 'right:12px', 'z-index:9999',
      'background:rgba(74,222,128,0.15)', 'color:#4ade80',
      'border:1px solid rgba(74,222,128,0.3)',
      'border-radius:16px', 'padding:4px 12px',
      'font-size:11px', 'font-weight:600',
      'cursor:pointer', 'user-select:none',
      'backdrop-filter:blur(8px)',
      'transition:all 0.2s',
      'font-family:-apple-system,sans-serif'
    ].join(';');

    badge.innerHTML = '✅ KB 兜底就绪';
    badge.title = '点击预览「' + entry.name + '」模块的断网兜底报告';

    badge.addEventListener('mouseenter', function () {
      badge.style.background = 'rgba(74,222,128,0.25)';
      badge.style.transform = 'scale(1.05)';
    });
    badge.addEventListener('mouseleave', function () {
      badge.style.background = 'rgba(74,222,128,0.15)';
      badge.style.transform = 'scale(1)';
    });

    badge.addEventListener('click', function () {
      showKbPreview(mod, entry);
    });

    document.body.appendChild(badge);
  }

  function showKbPreview(mod, entry) {
    // 构造模拟数据
    var sampleData = { s0: '30', s1: '金', s2: '焦虑' };
    if (mod === 'music') sampleData = { s0: '焦虑', s1: '金' };
    if (mod === 'lifeindex') sampleData = { s0: '金' };
    if (mod === 'lifeplan') sampleData = { s0: '30' };

    var report;
    try {
      report = entry.diagnose(sampleData);
    } catch (e) {
      report = { error: e.message };
    }

    // 创建/更新预览面板
    var existing = document.getElementById('kb-preview-panel');
    if (existing) existing.remove();

    var panel = document.createElement('div');
    panel.id = 'kb-preview-panel';
    panel.style.cssText = [
      'position:fixed', 'top:48px', 'right:12px', 'z-index:10000',
      'background:#1a1d27', 'color:#e4e6eb',
      'border:1px solid #2a2d3a', 'border-radius:12px',
      'padding:20px', 'max-width:360px', 'max-height:480px',
      'overflow-y:auto', 'box-shadow:0 12px 40px rgba(0,0,0,0.4)',
      'font-size:13px', 'line-height:1.6',
      'font-family:-apple-system,sans-serif'
    ].join(';');

    var html = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px">';
    html += '<b style="color:#f5d76e;font-size:14px">📋 ' + (report.title || entry.name) + '</b>';
    html += '<span style="cursor:pointer;color:#8b8fa3;font-size:18px" onclick="this.parentElement.parentElement.remove()">×</span>';
    html += '</div>';

    // 遍历 report 字段
    Object.keys(report).forEach(function (k) {
      var v = report[k];
      if (typeof v === 'string') {
        html += '<div style="margin:6px 0;padding:4px 0;border-bottom:1px solid #2a2d3a">';
        html += '<small style="color:#8b8fa3">' + k + '</small><br>';
        html += '<span>' + v + '</span></div>';
      } else if (Array.isArray(v)) {
        html += '<div style="margin:6px 0;padding:4px 0;border-bottom:1px solid #2a2d3a">';
        html += '<small style="color:#8b8fa3">' + k + ' (' + v.length + ')</small>';
        html += '<ul style="margin:4px 0 0 16px;font-size:12px">';
        v.slice(0, 5).forEach(function (item) {
          if (typeof item === 'object') {
            html += '<li>' + (item.name || item.text || JSON.stringify(item).slice(0, 60)) + '</li>';
          } else {
            html += '<li>' + item + '</li>';
          }
        });
        if (v.length > 5) html += '<li style="color:#8b8fa3">... 共 ' + v.length + ' 项</li>';
        html += '</ul></div>';
      } else if (typeof v === 'object' && v) {
        html += '<div style="margin:6px 0;padding:4px 0;border-bottom:1px solid #2a2d3a">';
        html += '<small style="color:#8b8fa3">' + k + '</small><br>';
        html += '<span style="font-size:12px">' + JSON.stringify(v).slice(0, 80) + '...</span></div>';
      }
    });

    html += '<div style="margin-top:12px;padding-top:8px;border-top:1px solid #2a2d3a;font-size:11px;color:#8b8fa3">';
    html += '🔒 断网时此报告仍可生成 · 来源：本地 _MODULE_REPORTS["' + mod + '"]';
    html += '</div>';

    panel.innerHTML = html;
    document.body.appendChild(panel);

    // 点击外部关闭
    setTimeout(function () {
      document.addEventListener('click', function close(e) {
        if (!panel.contains(e.target) && e.target.id !== 'kb-fallback-badge') {
          panel.remove();
          document.removeEventListener('click', close);
        }
      });
    }, 100);
  }

  // 等 _MODULE_REPORTS 加载
  if (window._MODULE_REPORTS) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      // 再等 200ms 确保 module-reports-kb.js 执行
      setTimeout(init, 200);
    });
  }
})();
