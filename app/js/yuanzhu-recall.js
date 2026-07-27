/**
 * R89-M · 缘主档案召回（Profile Recall）
 *
 * 在 generateReport() 调用前自动捕获当前缘主信息到 YuanzhuProfile
 * 并在聊天顶部渲染「缘主上下文条」，便于连续会话连贯化
 *
 * 与 yuanzhu-profile-sync.js 协同：复用 record/load/current 接口
 */

(function () {
  'use strict';

  if (!window.YuanzhuProfile) {
    console.warn('[recall] YuanzhuProfile not loaded');
    return;
  }

  /**
   * 从 AI 助手 state 抽取字段
   * AI 助手 state.data 约定：s1=姓名, s2=生辰, s3/s4=性别/时辰等
   */
  function extractProfileFromState(state) {
    if (!state || !state.data) return null;
    var d = state.data;
    return {
      name: d.s1 || d.name || '匿名缘主',
      gender: d.s2 && /女/.test(d.s2) ? '女' : (d.s2 && /男/.test(d.s2) ? '男' : ''),
      birth: d.s2 || d.birth || '',
      calendar: d.s3 || 'solar',
      time: d.s4 || d.time || '',
      location: d.location || '',
      module: state.module || '',
      consultation: d.s5 || d.question || ''
    };
  }

  /**
   * 生成报告前自动捕获
   */
  function captureBeforeReport(state) {
    var info = extractProfileFromState(state);
    if (!info) return null;
    return window.YuanzhuProfile.record(info);
  }

  /**
   * 渲染「缘主上下文条」到聊天顶部
   * 显示：头像 + 姓名 + 上次访问 + 切换/清空按钮
   */
  function renderContextBar(container) {
    if (!container) return;
    var p = window.YuanzhuProfile.current();
    if (!p) return;

    var bar = document.createElement('div');
    bar.className = 'yuanzhu-context-bar';
    bar.setAttribute('role', 'status');
    bar.setAttribute('aria-live', 'polite');
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:8px 12px;margin:8px 0;background:linear-gradient(135deg,rgba(201,168,76,.08),rgba(147,51,234,.04));border:1px solid rgba(201,168,76,.25);border-radius:8px;font-size:12px';

    var lastSeen = p.lastSeen ? new Date(p.lastSeen).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' }) : '首次';
    var modules = (p.modules || []).join(' · ') || '尚未排盘';

    bar.innerHTML =
      '<span style="font-size:18px">' + (p.gender === '男' ? '♂' : (p.gender === '女' ? '♀' : '⚪')) + '</span>' +
      '<div style="flex:1;min-width:0">' +
        '<div style="font-weight:600;color:var(--paper);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (p.name || '匿名缘主') + '</div>' +
        '<div style="font-size:11px;color:var(--paper3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          (p.birth || '未填生辰') + ' · 上次：' + lastSeen + ' · ' + modules +
        '</div>' +
      '</div>' +
      '<button class="yp-switch" title="切换缘主" style="padding:4px 10px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.4);color:#c9a84c;border-radius:8px;cursor:pointer;font-size:11px;font-family:inherit">⇋ 切换</button>' +
      '<button class="yp-clear" title="清空当前缘主" style="padding:4px 10px;background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);color:#ef4444;border-radius:8px;cursor:pointer;font-size:11px;font-family:inherit">✖ 清空</button>';

    // 切换 → 弹出已存档案列表
    bar.querySelector('.yp-switch').addEventListener('click', function () {
      var profiles = window.YuanzhuProfile.load();
      if (!profiles.length) {
        showToast('尚无其他缘主档案', 'info');
        return;
      }
      var menu = document.createElement('div');
      menu.className = 'yuanzhu-switch-menu';
      menu.style.cssText = 'position:absolute;top:60px;right:16px;background:rgba(20,18,15,.98);border:1px solid #c9a84c;border-radius:10px;padding:8px;z-index:9999;max-width:280px;box-shadow:0 8px 24px rgba(0,0,0,.5);font-size:12px';
      menu.innerHTML = '<div style="color:#c9a84c;font-weight:600;padding:4px 8px;margin-bottom:6px;border-bottom:1px solid rgba(201,168,76,.2)">切换缘主（' + profiles.length + '）</div>';
      profiles.forEach(function (pp) {
        var item = document.createElement('div');
        item.style.cssText = 'padding:6px 8px;border-radius:6px;cursor:pointer;display:flex;align-items:center;gap:6px';
        item.innerHTML =
          '<span>' + (pp.gender === '男' ? '♂' : (pp.gender === '女' ? '♀' : '⚪')) + '</span>' +
          '<div style="flex:1;min-width:0">' +
            '<div style="color:var(--paper);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + (pp.name || '匿名') + '</div>' +
            '<div style="font-size:10px;color:var(--paper3)">' + (pp.birth || '未填') + '</div>' +
          '</div>';
        item.addEventListener('mouseenter', function () { item.style.background = 'rgba(201,168,76,.12)'; });
        item.addEventListener('mouseleave', function () { item.style.background = ''; });
        item.addEventListener('click', function () {
          localStorage.setItem('***', pp.id);
          document.body.removeChild(menu);
          showToast('已切换到 ' + pp.name, 'success');
          // 滚动到顶部刷新上下文条
          setTimeout(function () { window.location.reload(); }, 600);
        });
        menu.appendChild(item);
      });
      document.body.appendChild(menu);
      setTimeout(function () {
        var close = function () { if (menu.parentElement) menu.parentElement.removeChild(menu); document.removeEventListener('click', close); };
        setTimeout(function () { document.addEventListener('click', close); }, 100);
      }, 0);
    });

    // 清空
    bar.querySelector('.yp-clear').addEventListener('click', function () {
      if (confirm('确认清空当前缘主档案？')) {
        window.YuanzhuProfile.clearAll();
        bar.parentElement.removeChild(bar);
        showToast('缘主档案已清空', 'info');
      }
    });

    container.prepend(bar);
  }

  function showToast(msg, type) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);padding:6px 14px;background:' + (type === 'success' ? '#10b981' : (type === 'info' ? '#3b82f6' : '#ef4444')) + ';color:#fff;border-radius:18px;font-size:12px;z-index:99999;box-shadow:0 4px 12px rgba(0,0,0,.3);font-weight:600';
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { if (t.parentElement) t.parentElement.removeChild(t); }, 300); }, 1800);
  }

  /**
   * 生成历史上下文摘要（用于连续会话）
   */
  function getHistoryHint(profileId) {
    if (!profileId) return '';
    var profiles = window.YuanzhuProfile.load();
    var p = profiles.find(function (x) { return x.id === profileId; });
    if (!p || !p.modules || !p.modules.length) return '';
    var lastConsult = p.lastConsultation ? '上次询问：' + p.lastConsultation.slice(0, 30) + (p.lastConsultation.length > 30 ? '…' : '') : '';
    return p.name + '（' + (p.gender || '未填') + '，' + (p.birth || '未填生辰') + '），' +
           '共访问 ' + p.visits + ' 次，已使用模块：' + p.modules.join('、') +
           (lastConsult ? '。' + lastConsult : '');
  }

  // 导出到 window
  window.YuanzhuRecall = {
    captureBeforeReport: captureBeforeReport,
    renderContextBar: renderContextBar,
    getHistoryHint: getHistoryHint,
    extractFromState: extractProfileFromState
  };
})();