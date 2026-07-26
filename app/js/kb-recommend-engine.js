/* R37 · KB 智能推荐引擎 · 2026-07-26
   接入 /api/kb/recommend，在 divination-hub.html 主入口做即时推荐卡
   - tab 切换调不同 mod → 重新拉接口
   - score 高 → 优先显示
   - 点击推荐项 → 跳到 ai-assistant.html 该模块
*/
(function(){
  'use strict';

  const TAB_MODS = ['bazi','zhongyi','qimen','ziwei','fengshui'];
  let currentMod = 'bazi';

  async function loadRecommend(mod) {
    const loading = document.getElementById('rec-loading');
    const list = document.getElementById('rec-list');
    const empty = document.getElementById('rec-empty');
    const meta = document.getElementById('rec-meta');
    if (!list) return;

    if (loading) loading.style.display = 'block';
    if (list) list.innerHTML = '';
    if (empty) empty.style.display = 'none';
    if (meta) meta.textContent = '加载中…';

    try {
      const url = `/api/kb/recommend?module=${encodeURIComponent(mod)}&limit=6&t=${Date.now()}`;
      const r = await fetch(url);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      const data = j.data || j;
      const recs = data.recommendations || [];

      if (loading) loading.style.display = 'none';
      if (meta) meta.textContent = `共 ${data.total_related||0} 关联 · 算法 ${(data.algorithm||'').split(' ')[0]} · ${new Date().toLocaleTimeString('zh-CN')}`;

      if (recs.length === 0) {
        if (empty) empty.style.display = 'block';
        return;
      }

      const html = recs.map(r => `
        <div class="rec-card" data-mod="${escapeAttr(r.id)}" style="background:rgba(108,138,255,.06);border:1px solid rgba(108,138,255,.18);border-radius:10px;padding:10px 12px;cursor:pointer;transition:transform .15s,background .15s" onmouseover="this.style.background='rgba(108,138,255,.18)'" onmouseout="this.style.background='rgba(108,138,255,.06)'">
          <div style="color:var(--gold);font-weight:600;font-size:13px;margin-bottom:4px;line-height:1.3">${escapeHtml(r.name || r.id)}</div>
          <div style="color:var(--paper3);font-size:11px;line-height:1.4;margin-bottom:6px">${escapeHtml(r.reason || '')}</div>
          <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--paper3)">
            <span>权重 ${r.weight||1} · ${(r.size_kb||0).toFixed(0)}KB</span>
            <span style="color:var(--success);font-weight:600;font-family:monospace">${(r.score||0).toFixed(2)}</span>
          </div>
        </div>
      `).join('');
      list.innerHTML = html;

      // 绑定点击 → 跳 ai-assistant.html?mod=
      list.querySelectorAll('.rec-card').forEach(card => {
        card.addEventListener('click', () => {
          const target = card.dataset.mod;
          window.location.href = `ai-assistant.html?mod=${encodeURIComponent(target)}&from=kb-graph`;
        });
      });
    } catch (e) {
      if (loading) loading.style.display = 'none';
      if (meta) meta.textContent = '✗ 推荐加载失败 · ' + (e.message || '');
    }
  }

  function escapeHtml(s){
    return String(s||'').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }
  function escapeAttr(s){
    return String(s||'').replace(/[^a-zA-Z0-9_-]/g, '');
  }

  function bindTabs() {
    document.querySelectorAll('.rec-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.classList.contains('active')) return;
        document.querySelectorAll('.rec-tab').forEach(b => {
          b.classList.remove('active');
          b.style.background = 'rgba(255,255,255,.04)';
          b.style.color = 'var(--paper3)';
          b.style.borderColor = 'rgba(255,255,255,.1)';
        });
        btn.classList.add('active');
        btn.style.background = 'rgba(108,138,255,.2)';
        btn.style.color = 'var(--accent)';
        btn.style.borderColor = 'rgba(108,138,255,.4)';
        currentMod = btn.dataset.mod;
        loadRecommend(currentMod);
      });
    });
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      bindTabs();
      loadRecommend(currentMod);
    });
  } else {
    bindTabs();
    loadRecommend(currentMod);
  }
})();
