
const API = window.location.origin;
async function loadStats() {
  document.getElementById('statsPanel').style.display='block';
  document.getElementById('searchPanel').style.display='none';
  document.getElementById('hitsPanel').style.display='none';
  document.getElementById('searchBox').style.display='none';
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',i===0));
  try {
    const r = await fetch(API + '/api/admin/kb/stats',{credentials:'include',signal:AbortSignal.timeout(15000)}));
    const d = await r.json();
    if (d.error) { document.getElementById('kbGrid').innerHTML = '⚠️ '+d.error; return; }
    document.getElementById('kbGrid').innerHTML = (d.modules||[]).map(m=>`
      <div class="kb-card">
        <h3>${m.module||m.name}</h3>
        <div class="kb-stat">${m.count}</div>
        <div class="kb-meta">📦 ${m.sources||0} 来源 · ⭐ 命中率 ${(m.hit_rate||0).toFixed(1)}%</div>
      </div>
    `).join('');
  } catch(e){ document.getElementById('kbGrid').innerHTML = '❌ '+e.message; }
}
async function loadSearch() {
  document.getElementById('statsPanel').style.display='none';
  document.getElementById('searchPanel').style.display='block';
  document.getElementById('hitsPanel').style.display='none';
  document.getElementById('searchBox').style.display='block';
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',i===1));
}
document.getElementById('searchBox').addEventListener('input', async (e)=>{
  const q = e.target.value.trim();
  if (q.length<2) return;
  try {
    const r = await fetch(API + '/api/admin/kb/search?q='+encodeURIComponent(q),{credentials:'include',signal:AbortSignal.timeout(15000)}));
    const d = await r.json();
    document.getElementById('searchPanel').innerHTML = (d.results||[]).slice(0,20).map(x=>`
      <div class="kb-card">
        <h3>${x.title||x.key}</h3>
        <div class="kb-meta">${x.module} · ${x.category||''} · ⭐${x.score||0.5}</div>
        <div style="margin-top:8px;font-size:13px;opacity:.85">${(x.content||x.summary||'').slice(0,200)}...</div>
      </div>
    `).join('');
  } catch(e){ document.getElementById('searchPanel').innerHTML='❌ '+e.message; }
});
async function loadHits() {
  document.getElementById('statsPanel').style.display='none';
  document.getElementById('searchPanel').style.display='none';
  document.getElementById('hitsPanel').style.display='block';
  document.getElementById('searchBox').style.display='none';
  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',i===2));
  try {
    const r = await fetch(API + '/api/ai/kb-hit-stats',{credentials:'include',signal:AbortSignal.timeout(15000)}));
    const d = await r.json();
    document.getElementById('hitsPanel').innerHTML = '<h3>KB 命中统计</h3><div class="kb-card"><div class="kb-stat">'+(d.total_hits||0)+'</div><div class="kb-meta">累计命中次数</div></div>'+(d.by_module||[]).map(m=>`<div class="kb-card"><h3>${m.module}</h3><div class="kb-stat">${m.hits}</div></div>`).join('');
  } catch(e){ document.getElementById('hitsPanel').innerHTML='❌ '+e.message; }
}
loadStats();
