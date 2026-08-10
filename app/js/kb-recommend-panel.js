// === R36: KB 智能推荐面板（基于 R35 /api/kb/recommend）===
// 用法：在报告生成后调用 attachRecommendPanel(chat, moduleId) 即自动渲染
// 行为：异步拉取图谱关联推荐 → 渲染 chip → 点击埋点 hit_count + 跳模块

(function () {
  const LABELS = {
    'authoritative-knowledge-base': { name: '权威知识库', icon: '📘' },
    'knowledge-deep-supplement': { name: '深度补充知识', icon: '🔍' },
    'knowledge-details-extra': { name: '细节扩展', icon: '🔬' },
    'huajie-age-specific': { name: '化解·年龄', icon: '🛡️' },
    'masters-knowledge': { name: '大师视角', icon: '👤' },
    'ziwei-new-sections': { name: '紫微新版块', icon: '⭐' },
    'wuxing-correspondence': { name: '五行对应', icon: '🌳' },
    'shuhan-basic-kb': { name: '舒晗基础', icon: '📗' },
    'shuhan-knowledge-base': { name: '舒晗知识库', icon: '📙' },
    'shuhan-mixun-tianji': { name: '舒晗·密宗天纪', icon: '🔯' },
    'nihaisha-tcm-kb': { name: '倪师·中医', icon: '🌿' },
    'nihaisha-classics-kb': { name: '倪师·经典', icon: '📜' },
    'faith-knowledge-base': { name: '信众知识库', icon: '🛕' },
    'scripture-database': { name: '经典原文', icon: '📖' },
    'yanzhi-knowledge-base': { name: '颜痣知识库', icon: '👁️' },
    'koujue-database-full': { name: '口诀大全', icon: '💬' },
    'incantation-database': { name: '咒语库', icon: '🔮' },
  };

  async function fetchRecommend(moduleId, limit = 5) {
    try {
      const apiBase = (typeof window !== 'undefined' && window.API_BASE) || '/api';
      const r = await fetch(`${apiBase}/kb/recommend?module=${encodeURIComponent(moduleId)}&limit=${limit}`,{credentials: 'omit',signal:AbortSignal.timeout(15000)});
      if (!r.ok) return null;
      const j = await r.json();
      return j && (j.data || j);
    } catch (e) {
      console.warn('[kb-recommend] fetch err', e);
      return null;
    }
  }

  function buildPanelHtml(rec, mod) {
    if (!rec || !rec.recommendations || rec.recommendations.length === 0) return '';
    let html = '<div class="kb-recommend-panel">';
    html += '<div class="krp-title">🧠 图谱智能推荐 · 基于「' + (mod || '该模块') + '」</div>';
    html += '<div class="krp-sub">基于知识库关联图谱、命中次数与知识量综合排序</div>';
    html += '<div class="krp-items">';
    rec.recommendations.forEach((r, idx) => {
      const label = LABELS[r.id] || { name: r.name || r.id, icon: '📊' };
      const score = (r.score || 0).toFixed(2);
      const reason = r.reason || '知识图谱关联';
      html += '<button class="krp-item" data-target="' + escapeAttr(r.id) + '" data-from="' + escapeAttr(mod) + '" data-score="' + score + '">';
      html += '<span class="krp-rank">' + (idx + 1) + '</span>';
      html += '<span class="krp-icon">' + label.icon + '</span>';
      html += '<span class="krp-body">';
      html += '<span class="krp-name">' + label.name + '</span>';
      html += '<span class="krp-reason">' + escapeAttr(reason.slice(0, 30)) + '</span>';
      html += '</span>';
      html += '<span class="krp-score" title="综合评分">' + score + '</span>';
      html += '</button>';
    });
    html += '</div>';
    html += '<div class="krp-foot">点击任一推荐可快速切换到对应知识体系 · 双计数埋点已启用</div>';
    html += '</div>';
    return html;
  }

  function escapeAttr(s) {
    return String(s || '').replace(/[<>"&]/g, c => ({ '<': '&lt;', '>': '&gt;', '"': '&quot;', '&': '&amp;' })[c]);
  }

  async function attachRecommendPanel(chatEl, moduleId, opts) {
    opts = opts || {};
    if (!chatEl) return;
    const rec = await fetchRecommend(moduleId, opts.limit || 5);
    if (!rec || !rec.recommendations || rec.recommendations.length === 0) return;
    const wrap = document.createElement('div');
    wrap.className = 'msg m-ai kb-recommend-msg';
    wrap.innerHTML = buildPanelHtml(rec, moduleId);
    chatEl.appendChild(wrap);
    // 绑定事件
    wrap.querySelectorAll('.krp-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-target');
        const from = btn.getAttribute('data-from');
        // 双计数
        try {
          const hitKey = '_kb_hit_count/' + target;
          localStorage.setItem(hitKey, String((parseInt(localStorage.getItem(hitKey) || '0') + 1)));
          const recKey = '_kb_recommend_count/' + target;
          localStorage.setItem(recKey, String((parseInt(localStorage.getItem(recKey) || '0') + 1)));
          if (from && from !== target) {
            const recFromKey = '_kb_recommend_count/' + from;
            localStorage.setItem(recFromKey, String((parseInt(localStorage.getItem(recFromKey) || '0') + 1)));
          }
        } catch (e) { /* 隐私模式静默 */ }
        // 反馈动画
        btn.classList.add('krp-clicked');
        setTimeout(() => btn.classList.remove('krp-clicked'), 1200);
        // 跳转到对应模块（若存在 ALL_MODS）或 KB 抽屉
        if (typeof window !== 'undefined' && window.ALL_MODS) {
          // 尝试直接通过热卡 deep-link 模式
          if (window._moduleShortcut) {
            window._moduleShortcut(target);
          } else if (typeof window.startModule === 'function' && window.ALL_MODS.find(m => m.id === target)) {
            window.startModule(target);
          } else {
            openKBPanel && openKBPanel();
          }
        } else if (typeof openKBPanel === 'function') {
          openKBPanel();
        }
      });
    });
    if (chatEl.scrollHeight) chatEl.scrollTop = chatEl.scrollHeight;
    return wrap;
  }

  // 暴露
  window.attachRecommendPanel = attachRecommendPanel;
  window.fetchKbRecommend = fetchRecommend;
})();
