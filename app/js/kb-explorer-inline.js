
const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.hostname === '')
  ? 'http://127.0.0.1:8920' : '';
let allModules = [];
let currentTab = 'search';
let nhList = [];
let nhFilterSource = '全部';
let nhFilterQ = '';
let nhPage = 1;
const NH_PAGE_SIZE = 12;
const nhModalId = 'nhModal';

function fmtNum(n){ return Number(n||0).toLocaleString('zh-CN'); }

async function fetchStats(){
  try{
    const r = await fetch(API + '/api/public/kb/stats');
    const d = await r.json();
    document.getElementById('statTotal').textContent = fmtNum(d.total);
    document.getElementById('statHi').textContent = fmtNum(d.hi_trust);
    document.getElementById('statHits').textContent = fmtNum(d.total_hits);
    const sm = document.getElementById('statMod'); if(sm) sm.textContent = (d.top_modules || []).length || 41;
    return d;
  }catch(e){
    document.getElementById('statTotal').textContent = '9173';
    document.getElementById('statHi').textContent = '—';
    document.getElementById('statHits').textContent = '—';
    const sm = document.getElementById('statMod'); if(sm) sm.textContent = '41';
  }
  await fetchNhCount();
}

async function fetchNhCount(){
  try{
    if(!nhList.length) await fetchNihaishaAll();
    document.getElementById('statNh').textContent = fmtNum(nhList.length);
  }catch(e){
    document.getElementById('statNh').textContent = '—';
  }
}

async function fetchModules(){
  try{
    const r = await fetch(API + '/api/public/kb-manager/list');
    const d = await r.json();
    if(d && d.modules){
      allModules = d.modules;
      const sel = document.getElementById('modFilter');
      allModules.slice().sort((a,b)=>b.count-a.count).forEach(m=>{
        const opt = document.createElement('option');
        opt.value = m.module;
        opt.textContent = `${m.module} (${m.count})`;
        sel.appendChild(opt);
      });
    }
  }catch(e){console.warn(e.message)}
}

async function fetchHits(){
  try{
    const r = await fetch(API + '/api/public/kb/hits');
    const d = await r.json();
    return d;
  }catch(e){ return null; }
}

// ───────── R11-H2 倪师课程 KB ─────────
function nhKbUrl(){
  // 倪师结构化 118 条 KB（生产路径走 API 网关）
  return API + '/api/kb/nihaisha-structured-entries.js';
}

async function fetchNihaishaAll(){
  if(nhList.length) return nhList;
  try{
    // 加载脚本（设置 window.NIHAISHA_STRUCTURED）
    await new Promise((resolve, reject)=>{
      const s = document.createElement('script');
      s.src = nhKbUrl();
      s.async = false;
      s.onload = ()=>resolve(true);
      s.onerror = ()=>reject(new Error('加载倪师KB脚本失败'));
      document.head.appendChild(s);
    });
    const data = window.NIHAISHA_STRUCTURED || [];
    nhList = Array.isArray(data) ? data : [];
    document.getElementById('statNh') && (document.getElementById('statNh').textContent = fmtNum(nhList.length));
  }catch(e){
    nhList = [];
  }
  return nhList;
}

function nhSourceList(){
  const map = new Map();
  nhList.forEach(it=>{
    const s = it.source || '未知';
    map.set(s, (map.get(s)||0)+1);
  });
  return Array.from(map.entries()).sort((a,b)=>b[1]-a[1]);
}

function nhFiltered(){
  const q = (nhFilterQ||'').trim().toLowerCase();
  return nhList.filter(it=>{
    if(nhFilterSource !== '全部' && it.source !== nhFilterSource) return false;
    if(!q) return true;
    const blob = (it.name + ' ' + (it.source||'') + ' ' + (it.content||'')).toLowerCase();
    return blob.indexOf(q) !== -1;
  });
}

function setNhFilterSource(s){
  nhFilterSource = s;
  nhPage = 1;
  renderNihaisha();
}

function setNhFilterQ(v){
  nhFilterQ = v || '';
  nhPage = 1;
  renderNihaisha();
}

function setNhPage(p){
  nhPage = p;
  renderNihaisha();
  // 滚到面板顶部
  document.getElementById('nihaishaPanel')?.scrollIntoView({behavior:'smooth', block:'start'});
}

function nhOpenModal(id){
  const it = nhList.find(x=>x.id===id);
  if(!it) return;
  const html = `
    <ml-tap class="kbe-nh-modal open" id="${nhModalId}" onclick="if(event.target===this)nhCloseModal()" variant="card" role="button" tabindex="0">
      <div class="kbe-nh-modal-body">
        <button class="kbe-nh-modal-close" onclick="nhCloseModal()">×</button>
        <div style="margin-bottom:14px">
          <div class="kbe-nh-id">${it.id}</div>
          <div style="font-size:18px;color:var(--gold);font-weight:600;margin:6px 0">${escapeHtml(it.name||'')}</div>
          <span class="kbe-nh-source">${escapeHtml(it.source||'')}</span>
          <span class="kbe-mod-badge" style="margin-left:8px">${escapeHtml(it.level||'')}</span>
        </div>
        <pre>${escapeHtml(it.content||'')}</pre>
      </div>
    </ml-tap>`;
  const wrap = document.createElement('div');
  wrap.innerHTML = html;
  document.body.appendChild(wrap.firstChild);
}

function nhCloseModal(){
  const el = document.getElementById(nhModalId);
  if(el) el.remove();
}

function escapeHtml(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function renderNihaisha(){
  const panel = document.getElementById('nihaishaPanel');
  if(!panel) return;
  if(!nhList.length){
    panel.innerHTML = '<div class="kbe-loading">加载中…</div>';
    fetchNihaishaAll().then(renderNihaisha);
    return;
  }
  const sources = nhSourceList();
  const filtered = nhFiltered();
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / NH_PAGE_SIZE));
  if(nhPage > totalPages) nhPage = totalPages;
  const startIdx = (nhPage-1) * NH_PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + NH_PAGE_SIZE);

  // 头部 summary
  let html = '';
  html += `<div class="kbe-nh-summary">
    <span>📚 总条目：<b>${fmtNum(nhList.length)}</b></span>
    <span>🎯 当前筛选：<b>${fmtNum(total)}</b></span>
    <span>📂 来源分布：<b>${sources.length}</b> 个课程</span>
    <span>📄 第 <b>${nhPage}</b> / ${totalPages} 页</span>
  </div>`;

  // 过滤工具条
  html += '<div class="kbe-nh-toolbar">';
  html += '<span class="kbe-nh-label">课程</span>';
  html += `<button type="button" class="kbe-nh-chip a11y-btn-reset ${nhFilterSource==='全部'?'active':''}" onclick="setNhFilterSource('全部')" aria-label="筛选全部课程">全部 (${nhList.length})</button>`;
  sources.forEach(([s, c])=>{
    html += `<button type="button" class="kbe-nh-chip a11y-btn-reset ${nhFilterSource===s?'active':''}" onclick="setNhFilterSource('${escapeHtml(s)}')" aria-label="筛选课程：${escapeHtml(s)}">${escapeHtml(s)} (${c})</button>`;
  });
  html += '<span class="kbe-nh-label" style="margin-left:auto">🔍 搜索</span>';
  html += `<input aria-label="nhQInput" id="nhQInput" type="text" placeholder="输入关键词过滤…" value="${escapeHtml(nhFilterQ)}" style="padding:6px 10px;background:rgba(0,0,0,.4);color:var(--paper);border:1px solid var(--line);border-radius:6px;font-size:12px;width:160px" oninput="setNhFilterQ(this.value)" />`;
  html += '</div>';

  if(!total){
    html += '<div class="kbe-nh-empty"><div class="kbe-nh-empty-icon">🩺</div><div>未找到匹配的倪师课程条目</div><div style="margin-top:14px;font-size:12px;opacity:.6">试试其他关键词或点击"全部"</div></div>';
    panel.innerHTML = html;
    return;
  }

  // 卡片列表
  html += '<div class="kbe-nh-grid">';
  pageItems.forEach(it=>{
    const snippet = (it.content || '').slice(0, 220).replace(/\s+/g, ' ');
    html += `<ml-tap class="kbe-nh-card" onclick="nhOpenModal('${it.id}')" variant="card" role="button" tabindex="0">
      <div class="kbe-nh-head">
        <span class="kbe-nh-id">${it.id}</span>
        <span class="kbe-nh-source">${escapeHtml(it.source||'')}</span>
        <span class="kbe-mod-badge">${escapeHtml(it.level||'实践')}</span>
      </div>
      <div class="kbe-nh-title">${escapeHtml(it.name||'')}</div>
      <div class="kbe-nh-snippet">${escapeHtml(snippet)}</div>
      <div class="kbe-nh-meta">
        <span>📏 内容长度 <b>${fmtNum((it.content||'').length)}</b> 字</span>
        <span>📑 来源：${escapeHtml(it.source||'')}</span>
      </div>
    </ml-tap>`;
  });
  html += '</div>';

  // 分页
  if(totalPages > 1){
    html += '<div class="kbe-nh-pager">';
    html += `<button onclick="setNhPage(1)" ${nhPage===1?'disabled':''}>« 首页</button>`;
    html += `<button onclick="setNhPage(${Math.max(1, nhPage-1)})" ${nhPage===1?'disabled':''}>‹ 上一页</button>`;
    const winSize = 5;
    let winStart = Math.max(1, nhPage - Math.floor(winSize/2));
    let winEnd = Math.min(totalPages, winStart + winSize - 1);
    if(winEnd - winStart < winSize - 1) winStart = Math.max(1, winEnd - winSize + 1);
    for(let p = winStart; p <= winEnd; p++){
      html += `<button class="${p===nhPage?'cur':''}" onclick="setNhPage(${p})">${p}</button>`;
    }
    html += `<button onclick="setNhPage(${Math.min(totalPages, nhPage+1)})" ${nhPage===totalPages?'disabled':''}>下一页 ›</button>`;
    html += `<button onclick="setNhPage(${totalPages})" ${nhPage===totalPages?'disabled':''}>末页 »</button>`;
    html += `<span class="kbe-nh-pinfo">第 ${startIdx+1}–${Math.min(startIdx+NH_PAGE_SIZE, total)} 条 / 共 ${total} 条</span>`;
    html += '</div>';
  }

  panel.innerHTML = html;
}

async function doSearch(){
  const q = document.getElementById('qInput').value.trim();
  const mod = document.getElementById('modFilter').value;
  if(!q || q.length < 2){
    document.getElementById('resultBox').innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">⚠️</div><div>请输入至少 2 个字符</div></div>';
    return;
  }
  switchTab('search');
  document.getElementById('resultBox').innerHTML = '<div class="kbe-loading">正在检索知识库</div>';
  try{
    const r = await fetch(API + '/api/public/kb/search?q=' + encodeURIComponent(q) + (mod ? '&module=' + encodeURIComponent(mod) : ''));
    const d = await r.json();
    const results = d.results || [];
    if(!results.length){
      document.getElementById('resultBox').innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">🔍</div><div>未找到匹配条目</div><div style="margin-top:14px;font-size:12px;opacity:.6">试试其他关键词，比如"失眠"、"五行"、"倪师方剂"</div></div>';
      return;
    }
    let html = '<div class="kbe-results">';
    results.forEach(r=>{
      const trustClass = r.trust_score >= 0.85 ? '' : 'low';
      const trustLabel = r.trust_score >= 0.85 ? '高置信' : (r.trust_score >= 0.7 ? '置信' : '一般');
      html += `<div class="kbe-result">
        <div class="kbe-result-head">
          <span class="kbe-mod-badge">${r.module}</span>
          <span class="kbe-result-title">${r.title}</span>
          <span class="kbe-trust-badge ${trustClass}">⭐ ${trustLabel} ${r.trust_score}</span>
        </div>
        <div class="kbe-result-snippet">${r.snippet || ''}</div>
        <div class="kbe-result-meta">
          <span>🎯 命中 ${r.hit_count||0} 次</span>
          <span>📖 模块：${r.module}</span>
        </div>
      </div>`;
    });
    html += '</div>';
    document.getElementById('resultBox').innerHTML = html;
  }catch(e){
    document.getElementById('resultBox').innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">❌</div><div>检索失败：' + e.message + '</div></div>';
  }
}

function switchTab(tab){
  currentTab = tab;
  document.querySelectorAll('.kbe-tab').forEach(t=>t.classList.toggle('active', t.dataset.tab===tab));
  if(tab === 'recommend'){
    document.getElementById('panelTitle').innerHTML = '智能推荐 <span class="panel-en">Smart Recommendations</span>';
    renderRecommendations();
    return;
  }
  if(tab === 'nihaisha'){
    document.getElementById('panelTitle').innerHTML = '倪师课程 <span class="panel-en">Nihaisha TCM KB</span>';
    renderNihaisha();
    return;
  }
  const title = tab === 'search' ? '检索结果' : tab === 'modules' ? '模块分布' : '命中统计';
  const titleEn = tab === 'search' ? 'Search Results' : tab === 'modules' ? 'Modules' : 'Hit Stats';
  document.getElementById('panelTitle').innerHTML = title + ' <span class="panel-en">' + titleEn + '</span>';
  if(tab === 'modules') renderModules();
  else if(tab === 'hits') renderHits();
  else document.getElementById('resultBox').innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">📖</div><div>请在上方输入关键词进行检索</div></div>';
}

function renderModules(){
  if(!allModules.length){
    document.getElementById('resultBox').innerHTML = '<div class="kbe-loading">加载模块列表</div>';
    return;
  }
  const sorted = allModules.slice().sort((a,b)=>b.count-a.count);
  let html = '<div class="kbe-modules">';
  sorted.forEach(m=>{
    html += `<ml-tap class="kbe-mod" onclick="document.getElementById('modFilter').value='${m.module}';switchTab('search');doSearch()" variant="card" role="button" tabindex="0">
      <div class="kbe-mod-name">${m.module}</div>
      <div class="kbe-mod-count"><strong>${m.count}</strong> 条</div>
    </ml-tap>`;
  });
  html += '</div>';
  document.getElementById('resultBox').innerHTML = html;
}

async function renderHits(){
  document.getElementById('resultBox').innerHTML = '<div class="kbe-loading">加载命中统计</div>';
  const d = await fetchHits();
  if(!d || !d.modules || !d.modules.length){
    document.getElementById('resultBox').innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">📊</div><div>暂无命中数据</div><div style="margin-top:14px;font-size:12px;opacity:.6">通过 AI 助手或 KB 检索产生的命中会显示在这里</div></div>';
    return;
  }
  const max = Math.max(...d.modules.map(m=>m.hits));
  let html = '<div style="margin-bottom:16px;font-size:12px;color:var(--paper3);opacity:.7">📅 ' + d.date + '　·　今日总命中：<strong style="color:var(--gold)">' + d.total + '</strong> 次</div>';
  d.modules.forEach(m=>{
    const pct = max ? (m.hits / max * 100) : 0;
    html += `<div class="kbe-hits-bar">
      <div class="kbe-hits-name">${m.module}</div>
      <div class="kbe-hits-bar-track"><div class="kbe-hits-bar-fill" style="width:${pct}%"></div></div>
      <div class="kbe-hits-bar-val">${m.hits}</div>
    </div>`;
  });
  document.getElementById('resultBox').innerHTML = html;
}

async function renderRecommendations(){
  const box = document.getElementById('resultBox');
  const sel = document.getElementById('modFilter');
  let mod = sel ? sel.value : '';
  // R39: 如果 modFilter 没选中具体模块，展示推荐快捷芯片
  if(!mod){
    const quickMods = ['bazi','ziwei','fengshui','qimen','zhongyi','tcm','nihaisha','shuhan'];
    let html = '<div class="kbe-empty"><div class="kbe-empty-icon">🧠</div>';
    html += '<div style="margin-bottom:16px">选择模块查看图谱智能推荐</div>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:480px;margin:0 auto">';
    quickMods.forEach(m => {
      html += '<button onclick="recQuickPick(\''+m+'\')" style="padding:8px 18px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.3);border-radius:20px;color:var(--gold);cursor:pointer;font-size:13px;transition:.2s">' + m + '</button>';
    });
    html += '</div><div style="margin-top:18px;font-size:12px;opacity:.6">推荐基于图谱关联权重 + 命中次数 + 模块大小综合评分</div></div>';
    box.innerHTML = html;
    return;
  }
  box.innerHTML = '<div class="kbe-loading">正在获取 ' + mod + ' 的智能推荐</div>';
  try{
    const r = await fetch(API + '/api/kb/recommend?module=' + encodeURIComponent(mod) + '&limit=8');
    const d = await r.json();
    const recs = (d.data && d.data.recommendations) || d.recommendations || [];
    if(!recs.length){
      box.innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">🤷</div><div>模块 ' + mod + ' 暂无图谱关联推荐</div></div>';
      return;
    }
    const seedIds = (d.data && d.data.seed_ids) || d.seed_ids || [];
    let html = '<div class="kbe-rec-header" style="margin-bottom:16px;padding:12px 16px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.3);border-radius:8px;font-size:12px;color:var(--paper3)">';
    html += '🧠 模块 <strong style="color:var(--gold)">' + mod + '</strong> 关联推荐 ' + recs.length + ' 条';
    if(seedIds.length) html += ' · 种子：' + seedIds.slice(0,3).map(s=>'<code style="color:var(--blue)">'+s+'</code>').join(', ') + (seedIds.length>3?'...':'');
    html += '<br><span style="opacity:.6">算法：' + ((d.data && d.data.algorithm) || d.algorithm || '') + '</span>';
    html += '</div>';
    html += '<div class="kbe-results">';
    recs.forEach((r,i)=>{
      const pct = Math.round((r.score||0) * 100);
      const scoreColor = pct >= 60 ? 'var(--green)' : pct >= 30 ? 'var(--gold)' : 'var(--paper3)';
      html += '<div class="kbe-result" data-fb-target="' + (r.id||'').replace(/"/g,'&quot;') + '" data-fb-source="' + mod + '" onclick="recClick(\''+ (r.id||'').replace(/'/g,"\\'") +'\', \''+ mod +'\')" style="cursor:pointer">';
      html += '<div class="kbe-result-head">';
      html += '<span class="kbe-mod-badge">#' + (i+1) + '</span>';
      html += '<span class="kbe-result-title">' + (r.name||r.id||'') + '</span>';
      html += '<span class="kbe-trust-badge" style="background:'+scoreColor+'22;color:'+scoreColor+'">评分 ' + (r.score||0).toFixed(3) + '</span>';
      html += '</div>';
      html += '<div class="kbe-result-snippet">' + (r.id||'') + ' · 级本：' + (r.level||'?') + ' · 大小：' + Math.round(r.size_kb||0) + 'KB · 引用：' + (r.xref_count||0) + ' · 命中：' + (r.hit_count||0) + '</div>';
      html += '<div class="kbe-result-meta"><span>权重 ' + (r.weight||0).toFixed(1) + '</span><span>类型：' + (r.type||'xref') + '</span></div>';
      html += '</div>';
    });
    html += '</div>';
    box.innerHTML = html;
  }catch(e){
    box.innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">❌</div><div>推荐加载失败：' + e.message + '</div></div>';
  }
}

function recQuickPick(mod){
  const sel = document.getElementById('modFilter');
  // 如果 modFilter 没有这个选项，临时创建
  if(sel && !Array.from(sel.options).some(o => o.value === mod)){
    const opt = document.createElement('option');
    opt.value = mod; opt.textContent = mod + ' (推荐)';
    sel.appendChild(opt);
  }
  if(sel) sel.value = mod;
  renderRecommendations();
}

function recClick(recId, sourceMod){
  // R39: 用 kb-recommend-feedback.js 统一反馈通道（本地双计 + 后端日志）
  if(typeof window.feedbackKbRec === 'function'){
    window.feedbackKbRec({target: recId, source: sourceMod || 'explorer', action:'click', score:0.5});
  }
  // 将推荐 id 填入搜索框并搜索
  document.getElementById('qInput').value = recId;
  switchTab('search');
  doSearch();
}

document.getElementById('qInput').addEventListener('keypress', e=>{
  if(e.key === 'Enter') doSearch();
});

(async function init(){
  await fetchStats();
  await fetchNihaishaAll();
  await fetchModules();
})();



// ml-tab 与自定义 switchTab 双向桥接：兼容旧 onclick="switchTab('xx')"
(function(){
  const mlTab = document.getElementById('kbeTab');
  if (!mlTab) return;
  const tabMap = {search:0, modules:1, hits:2, recommend:3, nihaisha:4};
  mlTab.addEventListener('tab-change', (e)=>{
    const label = e.detail.label || '';
    let name = 'search';
    if (label.includes('模块')) name = 'modules';
    else if (label.includes('命中')) name = 'hits';
    else if (label.includes('推荐')) name = 'recommend';
    else if (label.includes('倪师') || label.includes('🩺')) name = 'nihaisha';
    if (typeof switchTab === 'function') switchTab(name);
  });
  window.__kbeSetTab = function(name){
    if (typeof tabMap[name] === 'number') mlTab.setActive(tabMap[name]);
  };
})();



(function(){
  function applyModuleHash(){
    var h = location.hash || '';
    var m = h.match(/^#module=(.+)$/);
    if(!m) return;
    var mod = decodeURIComponent(m[1]);
    var sel = document.getElementById('modFilter');
    var qInput = document.getElementById('qInput');
    var resultBox = document.getElementById('resultBox');
    if(!sel || !qInput || !resultBox) return;
    qInput.value = mod;
    var tryFill = function(attempts){
      attempts = attempts || 0;
      var exists = Array.prototype.some.call(sel.options, function(o){return o.value===mod;});
      if(exists){
        sel.value = mod;
        // 如果 mod 在下拉里，直接调用 doSearch（如果公开到 window）
        if(typeof window.doSearch === 'function'){ window.doSearch(); return; }
        // 否则直接发请求
        resultBox.innerHTML = '<div class="kbe-loading">正在检索知识库：' + mod + '</div>';
        var url = (location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.hostname==='') ? 'http://127.0.0.1:8920' : '';
        fetch(url + '/api/public/kb-query?q=' + encodeURIComponent(mod) + '&limit=10')
          .then(function(r){return r.json();})
          .then(function(d){
            if(!d || !d.results){ resultBox.innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">📖</div><div>模块 ' + mod + ' 无内容</div></div>'; return; }
            var html = '<div class="kbe-result-meta">模块 <b>' + mod + '</b> · ' + (d.results.length||0) + ' 条结果</div>';
            (d.results||[]).forEach(function(r){
              html += '<div class="kbe-item"><div class="kbe-item-title">' + (r.title||r.id||'') + '</div><div class="kbe-item-snippet">' + (r.snippet||r.summary||'').slice(0,200) + '</div></div>';
            });
            resultBox.innerHTML = html;
            resultBox.scrollIntoView({behavior:'smooth', block:'start'});
          }).catch(function(){
            resultBox.innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">⚠️</div><div>API 请求失败</div></div>';
          });
        return;
      }
      if(attempts > 30){ resultBox.innerHTML = '<div class="kbe-empty"><div class="kbe-empty-icon">⚠️</div><div>模块 ' + mod + ' 不在 KB 中</div></div>'; return; }
      setTimeout(function(){tryFill(attempts+1);}, 200);
    };
    tryFill(0);
  }
  window.addEventListener('hashchange', applyModuleHash);
  window.addEventListener('DOMContentLoaded', applyModuleHash);
  if(document.readyState !== 'loading') applyModuleHash();
})();
