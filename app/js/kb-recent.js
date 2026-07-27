/* R102 KB 最近访问侧栏
   职责：
   1. 监听用户点击 KB 模块/文件/节点 → 写入最近访问历史
   2. 顶部"🕐 最近访问"按钮 → 展开侧栏（最多 20 条）
   3. 跨页面 sessionStorage 同步
   4. 与 R101 收藏夹共享 drawer 区域
*/
(function(){
  'use strict';
  const KEY = '***';
  const MAX = 20;

  function getAll(){
    try { return JSON.parse(sessionStorage.getItem(KEY) || '[]'); }
    catch(e){ return []; }
  }
  function record(item){
    if(!item || !item.id) return;
    const arr = getAll().filter(x => x.id !== item.id); // 去重
    arr.unshift({ id: item.id, name: item.name || item.id, level: item.level || 'public', kind: item.kind || 'module', ts: Date.now() });
    if(arr.length > MAX) arr.length = MAX;
    sessionStorage.setItem(KEY, JSON.stringify(arr));
    // 跨 tab 同步
    try { localStorage.setItem(KEY + '_broadcast', JSON.stringify({ ts: Date.now(), arr })); } catch(e){}
    render();
  }
  function clear(){
    sessionStorage.removeItem(KEY);
    render();
  }

  function render(){
    const drawer = document.getElementById('kbRecentDrawer');
    if(!drawer) return;
    const arr = getAll();
    if(arr.length === 0){
      drawer.innerHTML = '<div class="fav-empty">🕐 暂无访问记录<br><small>浏览 KB 模块/文件后自动记录</small></div>';
      const c = document.getElementById('kbRecentCount');
      if(c) c.textContent = '0';
      return;
    }
    drawer.innerHTML = `
      <div class="fav-head">🕐 最近访问（${arr.length}）</div>
      ${arr.map(f => `
        <div class="fav-item" data-id="${f.id}" data-name="${f.name}" data-kind="${f.kind}">
          <div class="fav-info">
            <div class="fav-name">${f.name}</div>
            <div class="fav-meta"><code>${f.id}</code> · ${f.kind} · ${timeAgo(f.ts)}</div>
          </div>
          <div class="fav-actions">
            <a class="btn" href="${kindToUrl(f)}" title="打开">${kindToIcon(f.kind)}</a>
            <button class="btn danger" data-remove="${f.id}">×</button>
          </div>
        </div>
      `).join('')}
      <div class="fav-foot">
        <button class="btn danger" id="recClearAll">清空记录</button>
        <button class="btn primary" id="recExport">📤 导出 JSON</button>
      </div>
    `;
    const c = document.getElementById('kbRecentCount');
    if(c) c.textContent = arr.length;

    drawer.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.dataset.remove;
        const arr = getAll().filter(x => x.id !== id);
        sessionStorage.setItem(KEY, JSON.stringify(arr));
        render();
      };
    });

    const ca = document.getElementById('recClearAll');
    if(ca) ca.onclick = () => {
      if(confirm('确认清空最近访问记录？')) clear();
    };
    const ex = document.getElementById('recExport');
    if(ex) ex.onclick = () => {
      const blob = new Blob([JSON.stringify(getAll(), null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kb-recent-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    };
  }

  function timeAgo(ts){
    const diff = Date.now() - ts;
    if(diff < 60000) return '刚刚';
    if(diff < 3600000) return Math.floor(diff/60000) + ' 分钟前';
    if(diff < 86400000) return Math.floor(diff/3600000) + ' 小时前';
    return Math.floor(diff/86400000) + ' 天前';
  }

  function kindToIcon(k){
    return k === 'file' ? '📁' : k === 'node' ? '🕸️' : '🗂️';
  }
  function kindToUrl(f){
    return f.kind === 'file'
      ? `ai-assistant.html?preset=${encodeURIComponent(f.id)}`
      : `kb-quality.html?module=${encodeURIComponent(f.id)}`;
  }

  // 自动捕获点击 KB 模块/文件
  function bindAutoCapture(){
    // 文件卡上的"用 AI 探索" / "搜条目" 按钮
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.file, .card, .sr-item, [data-kb-id]');
      if(!btn) return;
      const idEl = btn.querySelector('.file-name, [data-kb-id], .sr-title, b, code');
      if(!idEl) return;
      const id = btn.dataset.kbId || idEl.textContent.trim();
      const kind = btn.classList.contains('file') ? 'file'
                  : btn.classList.contains('sr-item') ? 'node'
                  : 'module';
      record({ id, name: id, kind, level: 'public' });
    }, true);
  }

  // 跨 tab 同步
  window.addEventListener('storage', (e) => {
    if(e.key === KEY + '_broadcast') render();
  });

  function init(){
    if(!document.getElementById('kbRecentDrawer')){
      const d = document.createElement('div');
      d.id = 'kbRecentDrawer';
      d.className = 'kb-fav-drawer kb-recent-drawer';
      document.body.appendChild(d);

      const toggle = document.createElement('button');
      toggle.id = 'kbRecentToggle';
      toggle.className = 'kb-fav-toggle kb-recent-toggle';
      toggle.style.top = '60px';
      toggle.innerHTML = '🕐 <span id="kbRecentCount">' + getAll().length + '</span>';
      toggle.title = '最近访问';
      toggle.onclick = () => {
        d.classList.toggle('open');
        // 同时关闭收藏抽屉
        const fav = document.getElementById('kbFavDrawer');
        if(fav) fav.classList.remove('open');
      };
      document.body.appendChild(toggle);

      // 点击收藏按钮时关闭最近
      const favBtn = document.getElementById('kbFavToggle');
      if(favBtn) favBtn.addEventListener('click', () => d.classList.remove('open'));

      bindAutoCapture();
      render();
    }
  }

  window.KbRecent = { record, clear, render, init };
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 700); // 比 favorites 晚
  }
})();