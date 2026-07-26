// === R41: KB 推荐反馈工具（点击芯片 → 后端 /api/kb/recommend/feedback + 双计数）===
// 用法：feedbackKbRec({target, source, action:'click'|'dismiss', score})
// 行为：1) 异步 POST 后端日志 + hit_count  2) 同步 localStorage 双计数  3) 失败静默

(function () {
  async function feedbackKbRec(opts) {
    if (!opts || !opts.target) return false;
    const payload = {
      target: String(opts.target),
      source: String(opts.source || ''),
      action: opts.action || 'click',
      score: typeof opts.score === 'number' ? opts.score : (parseFloat(opts.score) || null),
    };
    // 1) 同步本地双计数
    try {
      const k1 = '_kb_hit_count/' + payload.target;
      localStorage.setItem(k1, String((parseInt(localStorage.getItem(k1) || '0') + 1)));
      const k2 = '_kb_recommend_count/' + (payload.source || payload.target);
      localStorage.setItem(k2, String((parseInt(localStorage.getItem(k2) || '0') + 1)));
    } catch (e) { /* 隐私模式静默 */ }
    // 2) 异步上报后端
    try {
      const apiBase = (typeof window !== 'undefined' && window.API_BASE) || '/api';
      await fetch(apiBase + '/kb/recommend/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'omit',
        keepalive: true,
      });
    } catch (e) {
      // 后端失败不影响本地计数
    }
    return true;
  }

  // 自动接管：data-fb-target 属性 + click 事件
  function autoBind(rootEl) {
    (rootEl || document).querySelectorAll('[data-fb-target]').forEach(el => {
      if (el.__fbBound) return;
      el.__fbBound = true;
      el.addEventListener('click', () => {
        feedbackKbRec({
          target: el.getAttribute('data-fb-target'),
          source: el.getAttribute('data-fb-source') || '',
          score: parseFloat(el.getAttribute('data-fb-score') || '0') || null,
          action: 'click'
        });
      });
    });
  }

  window.feedbackKbRec = feedbackKbRec;
  window.autoBindFb = autoBind;
  // DOMContentLoaded 时自动绑定一次（页面包含 data-fb-target 即可）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => autoBind(document));
  } else {
    setTimeout(() => autoBind(document), 0);
  }
})();
