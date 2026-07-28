/* R101 KB 收藏系统
   职责：
   1. localStorage 持久化（_kb_favorites / _kb_fav_history）
   2. 任意页面右上角"⭐ 收藏夹"按钮 → 显示已收藏 KB 模块列表
   3. KB 模块卡片上自动注入 ⭐ 切换按钮
   4. 收藏时打点（kb-fav 事件）
*/
(function(){
  'use strict';
  const STORAGE_KEY = '_kb_favorites';
  const HISTORY_KEY = '_kb_fav_history';

  function getAll(){
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch(e){ return []; }
  }
  function save(arr){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    // 历史事件流
    try {
      const hist = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      hist.unshift({ t: Date.now(), count: arr.length });
      localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0,200)));
    } catch(e){}
    // 全局事件
    window.dispatchEvent(new CustomEvent('kb-favorites-changed', { detail: { favorites: arr } }));
    // 跨 tab 广播 (R103)
    try { localStorage.setItem(STORAGE_KEY + '_broadcast', JSON.stringify({ ts: Date.now(), arr })); } catch(e){}
  }
  function isFav(id){
    return getAll().some(x => x.id === id);
  }
  function toggle(item){
    const arr = getAll();
    const idx = arr.findIndex(x => x.id === item.id);
    if(idx >= 0){
      arr.splice(idx, 1);
      save(arr);
      return false;
    } else {
      arr.unshift({ id: item.id, name: item.name || item.id, level: item.level || 'public', kind: item.kind || 'module', tags: item.tags || [], note: item.note || '', ts: Date.now() });
      save(arr);
      return true;
    }
  }

  function add(item){
    const arr = getAll();
    if(arr.find(x => x.id === item.id)) return false;
    arr.unshift({ id: item.id, name: item.name || item.id, level: item.level || 'public', kind: item.kind || 'module', tags: item.tags || [], note: item.note || '', ts: Date.now() });
    save(arr);
    return true;
  }

  function remove(id){
    const arr = getAll();
    const idx = arr.findIndex(x => x.id === id);
    if(idx >= 0){ arr.splice(idx, 1); save(arr); return true; }
    return false;
  }

  function updateNote(id, note){
    const arr = getAll();
    const item = arr.find(x => x.id === id);
    if(!item) return false;
    item.note = note || '';
    save(arr);
    return true;
  }

  function updateTags(id, tags){
    const arr = getAll();
    const item = arr.find(x => x.id === id);
    if(!item) return false;
    item.tags = Array.isArray(tags) ? tags : [];
    save(arr);
    return true;
  }

  function getTags(){
    const arr = getAll();
    const set = new Set();
    arr.forEach(x => (x.tags || []).forEach(t => set.add(t)));
    return [...set].sort();
  }

  // 渲染侧栏收藏抽屉
  function renderDrawer(){
    const arr = getAll();
    const drawer = document.getElementById('kbFavDrawer');
    if(!drawer) return;
    if(arr.length === 0){
      drawer.innerHTML = '<div class="fav-empty">⭐ 暂无收藏<br><small>点击模块卡片右上角的 ⭐ 收藏</small></div>';
      return;
    }
    const allTags = getTags();
    const kindSet = new Set(arr.map(x => x.kind || 'module'));
    const searchQ = (window._favDrawerSearch || '').toLowerCase();
    let filtered = arr;
    if(window._favDrawerTag){
      filtered = filtered.filter(f => (f.tags||[]).includes(window._favDrawerTag));
    }
    if(searchQ){
      filtered = filtered.filter(f =>
        (f.name||'').toLowerCase().includes(searchQ) ||
        (f.id||'').toLowerCase().includes(searchQ) ||
        (f.note||'').toLowerCase().includes(searchQ) ||
        (f.tags||[]).some(t => t.toLowerCase().includes(searchQ))
      );
    }
    drawer.innerHTML = `
      <div class="fav-head">⭐ 我的收藏（${filtered.length}/${arr.length}）</div>
      <div style="padding:6px 10px;border-bottom:1px solid var(--border);display:flex;gap:6px;flex-direction:column">
        <input type="text" id="favDrawerSearch" placeholder="🔍 搜索名称/ID/笔记/标签..." value="${window._favDrawerSearch||''}" style="width:100%;box-sizing:border-box;padding:6px 8px;background:var(--ink);border:1px solid var(--border);border-radius:6px;color:var(--paper2);font-size:.8rem"/>
        ${allTags.length ? `<div class="fav-tagfilter" style="display:flex;flex-wrap:wrap;gap:4px"><span style="font-size:.7rem;color:var(--paper3)">🏷️</span>${allTags.map(t => `<span class="fav-tag" style="font-size:.7rem;background:${window._favDrawerTag===t?'var(--gold)':'var(--card)'};border:1px solid var(--border);padding:2px 8px;border-radius:10px;cursor:pointer;color:${window._favDrawerTag===t?'#000':'var(--paper2)'}" data-tag="${t}">${t}</span>`).join('')}<span class="fav-tag" style="font-size:.7rem;background:${!window._favDrawerTag?'var(--gold)':'var(--card)'};border:1px solid var(--border);padding:2px 8px;border-radius:10px;cursor:pointer;color:${!window._favDrawerTag?'#000':'var(--paper2)'}" data-tag="">全部</span></div>` : ''}
      </div>
      ${filtered.length === 0 ? '<div class="fav-empty" style="padding:20px;text-align:center">🔍 无匹配收藏<br><small>试试调整搜索词或清除标签筛选</small></div>' : filtered.map(f => `
        <div class="fav-item" data-id="${f.id}">
          <div class="fav-info">
            <div class="fav-name">${f.name}</div>
            <div class="fav-meta"><code>${f.id}</code> · ${f.level} · ${new Date(f.ts).toLocaleDateString('zh-CN')}</div>
            ${(f.tags && f.tags.length) ? `<div class="fav-tags">${f.tags.map(t => `<span class="fav-tag">🏷️ ${t}</span>`).join('')}</div>` : ''}
            ${f.note ? `<div class="fav-note">📝 ${f.note.length > 40 ? f.note.slice(0,40)+'…' : f.note}</div>` : ''}
          </div>
          <div class="fav-actions">
            <a class="btn" href="kb-quality.html?module=${encodeURIComponent(f.id)}">📊</a>
            <a class="btn" href="kb-graph.html?module=${encodeURIComponent(f.id)}">🕸️</a>
            <button class="btn danger" data-remove="${f.id}">×</button>
          </div>
        </div>
      `).join('')}
      <div class="fav-foot">
        <button class="btn danger" id="favClearAll">清空全部</button>
        <button class="btn primary" id="favExport">📤 导出 JSON</button>
        <button class="btn" id="favExportCSV">📊 导出 CSV</button>
        <button class="btn" id="favImport">📥 导入</button>
        <input type="file" id="favImportFile" accept=".json,application/json" style="display:none">
      </div>
    `;
    // 搜索绑定
    const searchEl = document.getElementById('favDrawerSearch');
    if(searchEl) searchEl.oninput = (e) => { window._favDrawerSearch = e.target.value; renderDrawer(); searchEl?.focus(); };
    // 标签筛选
    drawer.querySelectorAll('[data-tag]').forEach(el => {
      el.onclick = () => { window._favDrawerTag = el.dataset.tag || ''; renderDrawer(); };
    });
    drawer.querySelectorAll('[data-remove]').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        toggle({ id: btn.dataset.remove });
        renderDrawer();
        document.querySelectorAll('.kb-fav-btn').forEach(b => refreshBtn(b));
      };
    });
    const ca = document.getElementById('favClearAll');
    if(ca) ca.onclick = () => {
      if(confirm('确认清空所有 KB 收藏？')){
        save([]);
        renderDrawer();
        document.querySelectorAll('.kb-fav-btn').forEach(b => refreshBtn(b));
      }
    };
    const ex = document.getElementById('favExport');
    if(ex) ex.onclick = () => { (window.KbFavorites.export || function(){} )(); };
    // R132 导出 CSV
    const csvBtn = document.getElementById('favExportCSV');
    if(csvBtn) csvBtn.onclick = () => { (window.KbFavorites.exportCSV || function(){} )(); };
    // R129 导入 JSON
    const impBtn = document.getElementById('favImport');
    const impFile = document.getElementById('favImportFile');
    if(impBtn && impFile){
      impBtn.onclick = () => impFile.click();
      impFile.onchange = () => {
        const file = impFile.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = () => {
          const result = (window.KbFavorites.import || function(){ return {ok:false,error:'no import'} })(reader.result);
          if(result.ok){
            showToast('✅ 导入成功\n新增 ' + result.added + ' 条\n跳过 ' + result.skipped + ' 条（已存在）');
            renderDrawer();
            document.querySelectorAll('.kb-fav-btn').forEach(b => refreshBtn(b));
          } else {
            showToast('❌ 导入失败: ' + (result.error || '未知错误'));
          }
          impFile.value = '';
        };
        reader.readAsText(file);
      };
    }
  }

  function refreshBtn(btn){
    const id = btn.dataset.id;
    const name = btn.dataset.name || id;
    const level = btn.dataset.level || 'public';
    if(isFav(id)){
      btn.classList.add('active');
      btn.innerHTML = '⭐';
      btn.title = `已收藏：${name}`;
    } else {
      btn.classList.remove('active');
      btn.innerHTML = '☆';
      btn.title = `收藏 ${name}`;
    }
  }

  // 在指定容器内每个卡片上注入 ⭐ 按钮
  function injectButtons(container, selector, getId, getName, getLevel){
    if(!container) return;
    container.querySelectorAll(selector).forEach(card => {
      if(card.querySelector('.kb-fav-btn')) return; // 已注入
      const btn = document.createElement('button');
      btn.className = 'kb-fav-btn';
      btn.dataset.id = getId(card);
      btn.dataset.name = getName(card);
      btn.dataset.level = getLevel(card);
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ id: btn.dataset.id, name: btn.dataset.name, level: btn.dataset.level });
        refreshBtn(btn);
        renderDrawer();
      };
      // 插入卡片右上角
      if(card.style.position === '' || !card.style.position) card.style.position = 'relative';
      btn.style.cssText = 'position:absolute;top:8px;right:8px;background:transparent;border:none;font-size:1.2rem;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1;z-index:5';
      card.appendChild(btn);
      refreshBtn(btn);
    });
  }

  // 初始化
  function init(){
    // 1. 渲染右上角抽屉入口
    if(!document.getElementById('kbFavDrawer')){
      const d = document.createElement('div');
      d.id = 'kbFavDrawer';
      d.className = 'kb-fav-drawer';
      document.body.appendChild(d);
      renderDrawer();

      const toggle = document.createElement('button');
      toggle.id = 'kbFavToggle';
      toggle.className = 'kb-fav-toggle';
      toggle.innerHTML = '⭐ <span id="kbFavCount">' + getAll().length + '</span>';
      toggle.title = '我的 KB 收藏';
      toggle.onclick = () => {
        d.classList.toggle('open');
      };
      document.body.appendChild(toggle);
    }

    // 2. 在 #fileContainer / #hotContainer / #modContainer / #graphContainer 中注入 ⭐
    injectButtons(
      document.getElementById('fileContainer'),
      '.file',
      c => c.querySelector('.file-name')?.textContent || '',
      c => c.querySelector('.file-name')?.textContent || '',
      c => {
        const chip = c.querySelector('.chip');
        return chip ? chip.textContent.trim() : 'public';
      }
    );
    injectButtons(
      document.getElementById('hotContainer'),
      '.mod, .hot-item, tr',
      c => c.dataset.id || c.querySelector('b')?.textContent || c.querySelector('code')?.textContent || '',
      c => c.querySelector('b')?.textContent || c.dataset.id || '',
      c => 'public'
    );
    injectButtons(
      document.getElementById('modContainer'),
      '.mod',
      c => c.dataset.id || c.querySelector('.mod-name')?.textContent || '',
      c => c.querySelector('.mod-name')?.textContent || '',
      c => 'public'
    );

    // 3. 监听 tab 切换重新注入
    document.querySelectorAll('[data-tab]').forEach(tabBtn => {
      tabBtn.addEventListener('click', () => setTimeout(() => {
        injectButtons(document.getElementById('fileContainer'), '.file', c => c.querySelector('.file-name')?.textContent || '', c => c.querySelector('.file-name')?.textContent || '', c => c.querySelector('.chip')?.textContent.trim() || 'public');
        injectButtons(document.getElementById('hotContainer'), '.mod, tr', c => c.dataset.id || c.querySelector('code')?.textContent || c.querySelector('b')?.textContent || '', c => c.querySelector('b')?.textContent || c.dataset.id || '', c => 'public');
        injectButtons(document.getElementById('modContainer'), '.mod', c => c.dataset.id || c.querySelector('.mod-name')?.textContent || '', c => c.querySelector('.mod-name')?.textContent || '', c => 'public');
      }, 100));
    });

    // 4. 监听 kb-favorites-changed 同步
    window.addEventListener('kb-favorites-changed', () => {
      const c = document.getElementById('kbFavCount');
      if(c) c.textContent = getAll().length;
    });

    // 5. 跨 tab 同步 (R103)
    window.addEventListener('storage', (e) => {
      if(e.key === STORAGE_KEY + '_broadcast'){
        renderDrawer();
        const c = document.getElementById('kbFavCount');
        if(c) c.textContent = getAll().length;
        document.querySelectorAll('.kb-fav-btn').forEach(b => refreshBtn(b));
      }
    });
  }

  // 暴露 API
  window.KbFavorites = {
    getAll, toggle, add, remove, isFav, render: renderDrawer, init,
    updateNote, updateTags, getTags,
    isEntryFav: function(entryId){ return getAll().some(f => f.id === entryId); },
    toggleEntry: function(entry){
      const arr = getAll();
      const idx = arr.findIndex(f => f.id === entry.id);
      if(idx >= 0){ arr.splice(idx,1); save(arr); return false; }
      arr.unshift({
        id: entry.id,
        name: entry.title || entry.id,
        level: 'public',
        kind: 'entry',
        source: entry.source || '',
        trust: typeof entry.trust === 'number' ? entry.trust : null,
        note: '',
        tags: [],
        addedAt: Date.now()
      });
      save(arr);
      return true;
    },
    // R129 导入 JSON
    import: function(json){
      let arr;
      try{
        if(typeof json === 'string') arr = JSON.parse(json);
        else if(Array.isArray(json)) arr = json;
        else throw new Error('JSON 不是数组');
      }catch(e){ return { ok:false, error: e.message }; }
      if(!Array.isArray(arr)) return { ok:false, error: 'JSON 不是数组' };
      const cur = getAll();
      const curIds = new Set(cur.map(f => f.id));
      const added = [];
      for(const it of arr){
        if(!it || typeof it !== 'object' || !it.id) continue;
        if(curIds.has(it.id)) continue;
        cur.push({
          id: it.id,
          name: it.name || it.id,
          level: it.level || 'public',
          kind: it.kind || 'module',
          tags: Array.isArray(it.tags) ? it.tags : [],
          note: it.note || '',
          source: it.source || '',
          trust: typeof it.trust === 'number' ? it.trust : null,
          ts: it.ts || it.addedAt || Date.now()
        });
        curIds.add(it.id);
        added.push(it.id);
      }
      save(cur);
      return { ok:true, added: added.length, skipped: arr.length - added.length };
    },
    export: function(){
      const arr = getAll();
      const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kb-favorites-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
    },
    // R132 导出 CSV（Excel 兼容：BOM + UTF-8）
    exportCSV: function(){
      const arr = getAll();
      if(arr.length === 0){ try{ window._toast?.('♻️ 暂无收藏可导出'); }catch{} return; }
      const headers = ['id','name','kind','level','tags','note','added_at'];
      const esc = v => {
        if(v === null || v === undefined) return '';
        const s = Array.isArray(v) ? v.join('|') : String(v);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g,'""') + '"' : s;
      };
      const rows = arr.map(it => headers.map(h => esc(it[h])).join(','));
      const csv = '\ufeff' + headers.join(',') + '\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kb-favorites-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 100);
      try{ window._toast?.(`📤 已导出 ${arr.length} 条 CSV`); }catch{}
    }
  };

  // DOM ready 自动启动
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // 延迟 500ms 等待主渲染完成
    setTimeout(init, 500);
  }
})();