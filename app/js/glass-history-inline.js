
const $ = id => document.getElementById(id);
function esc(s){return String(s||'').replace(/[&<>"]/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}

async function load(){
  const el = $('list');
  el.innerHTML = '<div class="empty">正在为您查阅典籍...</div>';
  const token = localStorage.token;
  if (!token) {
    el.innerHTML = '<div class="err">⚠ 未登录，请先登录获取 token</div>';
    return;
  }
  // ★ 安全：token 放 header，不放 URL
  const r = await fetch('/api/v1/glass/history', { signal: AbortSignal.timeout(15000),
    headers: {
      'Authorization': 'Bearer ' + token,
      'X-Device-Token': token.startsWith('GL-') ? token : 'GL-DEMO-DEVICE'
    },
    credentials:'include', signal: AbortSignal.timeout(15000) }).then(r=>r.json()).catch(e=>({error:true,message:e.message}));
  if (r.error || r.code !== 0) {
    el.innerHTML = '<div class="err">⚠ 查阅失败：' + esc((r.message||r.error||'未知错误')) + '</div>';
    return;
  }
  const items = (r.data && r.data.list) || [];
  $('count').textContent = '共 ' + items.length + ' 条';
  if (!items.length) {
    el.innerHTML = '<div class="empty">暂无历史会话<br><br><a href="/glass-console.html" style="color:var(--accent)">去控制台发起一次会话 →</a></div>';
    return;
  }
  el.innerHTML = items.map(it => {
    const status = it.status || 'unknown';
    const sClass = status === 'active' ? 's-active' : status === 'closed' ? 's-closed' : 's-other';
    const ts = it.updated_at ? new Date(it.updated_at).toLocaleString('zh-CN') : '';
    return `<div class="row">
      <div style="flex:1;min-width:0">
        <div class="row-title">${esc(it.title)}</div>
        ${it.summary ? `<div class="summary">${esc(it.summary)}</div>` : ''}
        <div class="row-meta">🕐 ${esc(ts)} · #${esc(it.id)}</div>
      </div>
      <span class="row-status ${sClass}">${esc(status)}</span>
    </div>`;
  }).join('');
}

load();
