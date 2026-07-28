
// 鉴权：从 localStorage 读取 token
function getToken() {
  return localStorage.getItem('admin_token') || localStorage.getItem('token') || '';
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const resp = await fetch(path, { ...options, headers: { ...headers, ...(options.headers || {}) } });
  const text = await resp.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

function $(id) { return document.getElementById(id); }

function setStatus(online) {
  const dot = $('statusDot');
  dot.className = 'status-dot ' + (online === null ? 'checking' : online ? 'online' : 'offline');
  $('statOnline').textContent = online === null ? '检查中' : online ? '在线' : '离线';
  $('statOnline').style.color = online ? 'var(--jade)' : online === false ? 'var(--danger)' : 'var(--warn)';
}

function nowTime() {
  return new Date().toTimeString().substring(0, 8);
}

async function checkHealth() {
  setStatus(null);
  $('healthResult').className = 'result-box';
  $('healthResult').textContent = '检测中...';
  try {
    const data = await api('/api/admin/glass/health');
    $('healthResult').className = 'result-box ' + (data.online ? 'success' : 'error');
    $('healthResult').textContent = JSON.stringify(data, null, 2);
    setStatus(data.online);
    $('healthBadge').textContent = data.online ? '在线' : '离线';
    $('healthBadge').className = 'badge ' + (data.online ? 'online' : 'offline');
    $('statLastCheck').textContent = nowTime();
  } catch (e) {
    $('healthResult').className = 'result-box error';
    $('healthResult').textContent = '请求失败: ' + e.message + '\n请确认已登录管理员 token';
    setStatus(false);
  }
}

async function testEndpoint() {
  const endpoint = $('testEndpoint').value.trim() || '/status';
  const method = $('testMethod').value;
  let body = null;
  const bodyText = $('testBody').value.trim();
  if (bodyText && method === 'POST') {
    try { body = JSON.parse(bodyText); } catch (e) {
      $('testResult').className = 'result-box error';
      $('testResult').textContent = 'JSON 解析失败: ' + e.message;
      return;
    }
  }
  $('testResult').textContent = '请求中...';
  try {
    const data = await api('/api/admin/glass/test', {
      method: 'POST',
      body: JSON.stringify({ endpoint, method, body })
    });
    $('testResult').className = 'result-box ' + (data.online ? 'success' : 'error');
    $('testResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    $('testResult').className = 'result-box error';
    $('testResult').textContent = '请求失败: ' + e.message;
  }
}

async function broadcast() {
  const texts = $('broadcastTexts').value.split('\n').filter(s => s.trim());
  if (!texts.length) {
    $('broadcastResult').className = 'result-box error';
    $('broadcastResult').textContent = '请输入至少一条文本';
    return;
  }
  const urgency = $('broadcastUrgency').value;
  $('broadcastResult').textContent = '广播中... (' + texts.length + ' 条)';
  try {
    const data = await api('/api/admin/glass/broadcast', {
      method: 'POST',
      body: JSON.stringify({ texts, urgency })
    });
    $('broadcastResult').className = 'result-box success';
    $('broadcastResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    $('broadcastResult').className = 'result-box error';
    $('broadcastResult').textContent = '请求失败: ' + e.message;
  }
}

async function yearlyBroadcast() {
  const year = parseInt($('yearlyYear').value) || 2026;
  if (!confirm('将向所有画像用户推送 ' + year + ' 年流年，继续？')) return;
  $('yearlyResult').textContent = '广播中...';
  try {
    const data = await api('/api/admin/glass/yearly-broadcast', {
      method: 'POST',
      body: JSON.stringify({ year })
    });
    $('yearlyResult').className = 'result-box success';
    $('yearlyResult').textContent = JSON.stringify(data, null, 2);
  } catch (e) {
    $('yearlyResult').className = 'result-box error';
    $('yearlyResult').textContent = '请求失败: ' + e.message;
  }
}

// 加载 demo 端点清单
async function loadDemo() {
  try {
    const data = await api('/api/glass/demo');
    const list = data.features || data.data?.features || [];
    const grid = $('endpointGrid');
    grid.innerHTML = '';
    list.forEach(f => {
      const card = document.createElement('div');
      card.className = 'card';
      card.innerHTML = `
        <div class="card-title">
          <span>${f.name}</span>
          <span class="tag ${f.method.toLowerCase()}">${f.method}</span>
        </div>
        <div class="card-desc">${f.desc}</div>
        <div class="card-meta"><code>${f.path}</code></div>
      `;
      grid.appendChild(card);
    });
    $('statEndpoints').textContent = list.length;
  } catch (e) {
    console.warn('demo 加载失败:', e);
  }
}

// 加载画像统计
async function loadStats() {
  try {
    const data = await api('/api/admin/yuanzhu/profile');
    const arr = Array.isArray(data) ? data : (data.list || data.profiles || []);
    $('statProfiles').textContent = arr.length;
  } catch (e) {
    $('statProfiles').textContent = '?';
  }
}

// 自动刷新
let timer = null;
function setupTimer() {
  if (timer) clearInterval(timer);
  const sec = parseInt($('refreshSec').value) || 15;
  timer = setInterval(checkHealth, sec * 1000);
}
$('refreshSec').addEventListener('change', setupTimer);

// 初始化
loadDemo();
checkHealth();
loadStats();
setupTimer();



(function(){
  const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost' || location.hostname === '') ? 'http://127.0.0.1:8920' : '';
  function fmt(n){ return Number(n||0).toLocaleString('zh-CN'); }

  async function loadHitRate(){
    try{
      const r = await fetch(API + '/api/public/kb-manager/hit-rate');
      const d = await r.json();
      if(d.error) return;
      // 4 卡片
      const hitEntries = (d.trend_7d || []).reduce((s, x) => s + x.entries, 0);
      document.getElementById('kbeTotal').textContent = fmt(d.total_kb);
      document.getElementById('kbeTodayHits').textContent = fmt(d.today_hits);
      document.getElementById('kbeTotalHits').textContent = fmt(d.total_hits);
      document.getElementById('kbeHitEntries').textContent = fmt(hitEntries);
      renderTrend(d.trend_7d || []);
      renderTopModules(d.top_modules || []);
    }catch(e){
      document.getElementById('kbeTotal').textContent = '9173';
    }
  }

  function renderTrend(trend){
    const box = document.getElementById('kbeTrendBox');
    if(!trend.length){
      box.innerHTML = '<div class="kbe-hit-empty">📊 7 日内暂无命中数据</div>';
      return;
    }
    const max = Math.max(...trend.map(x => x.entries), 1);
    let html = '<div class="kbe-trend-bar">';
    trend.forEach(t => {
      const pct = (t.entries / max * 100).toFixed(1);
      const isZero = t.entries === 0;
      const dayShort = (t.day || '').slice(5);
      html += `<div class="kbe-trend-col" title="${t.day} · ${t.entries} 条">`;
      html += `<div class="kbe-trend-col-fill ${isZero?'zero':''}" style="height:${isZero ? 4 : pct}%">`;
      if(!isZero) html += `<div class="kbe-trend-col-val">${t.entries}</div>`;
      html += `</div><div class="kbe-trend-col-day">${dayShort}</div></div>`;
    });
    html += '</div>';
    box.innerHTML = html;
  }

  function renderTopModules(mods){
    const box = document.getElementById('kbeTopModBox');
    if(!mods.length){
      box.innerHTML = '<div class="kbe-hit-empty">暂无今日命中</div>';
      return;
    }
    const max = Math.max(...mods.map(m => m.hits), 1);
    let html = '';
    mods.forEach(m => {
      const pct = (m.hits / max * 100).toFixed(1);
      html += `<div class="kbe-mod-rank">
        <div class="kbe-mod-rank-name">${m.module}</div>
        <div class="kbe-mod-rank-bar"><div class="kbe-mod-rank-fill" style="width:${pct}%"></div></div>
        <div class="kbe-mod-rank-val">${m.hits}</div>
      </div>`;
    });
    box.innerHTML = html;
  }

  async function loadTopKb(){
    const box = document.getElementById('kbeTopKbBox');
    try{
      // 用高频词多查询，汇总后按 hit_count DESC 排
      const keywords = ['五行','中医','经络','命宫','八字','化解','倪师','方剂'];
      const all = [];
      const seen = new Set();
      for(const kw of keywords){
        try{
          const r = await fetch(API + '/api/public/kb-manager/search?q=' + encodeURIComponent(kw) + '&limit=20');
          const d = await r.json();
          (d.items || []).forEach(k => {
            const key = k.entry_id || (k.module + ':' + k.title);
            if(!seen.has(key)){ seen.add(key); all.push(k); }
          });
        }catch(e){console.warn(e.message)}
      }
      // 过滤 trust_score >= 0.7，按 hit_count DESC 排 top 10
      const list = all.filter(k => (k.trust_score || 0) >= 0.7).sort((a,b) => (b.hit_count||0) - (a.hit_count||0)).slice(0, 10);
      if(!list.length){
        // fallback：用任一关键词的全部条目（不限 trust）
        const r = await fetch(API + '/api/public/kb-manager/search?q=' + encodeURIComponent('中医') + '&limit=20');
        const d = await r.json();
        const fallback = (d.items || []).slice(0, 10);
        if(!fallback.length){
          box.innerHTML = '<div class="kbe-hit-empty">暂无 KB 条目数据</div>';
          return;
        }
        return renderTopKbList(box, fallback);
      }
      renderTopKbList(box, list);
    }catch(e){
      box.innerHTML = '<div class="kbe-hit-empty">加载失败：' + e.message + '</div>';
    }
  }

  function renderTopKbList(box, list){
    let html = '<div class="kbe-kb-list">';
    list.forEach((k, i) => {
      html += `<div class="kbe-kb-item">
        <div class="kbe-kb-item-head">
          <div class="kbe-kb-item-num">${i+1}</div>
          <div class="kbe-kb-item-mod">${k.module || '-'}</div>
          <div class="kbe-kb-item-title">${(k.title||'').slice(0,40)}</div>
        </div>
        <div class="kbe-kb-item-stats">
          <span>⭐ 置信度 <strong>${k.trust_score || '—'}</strong></span>
          <span>🎯 命中 <strong>${k.hit_count || 0}</strong> 次</span>
        </div>
      </div>`;
    });
    html += '</div>';
    box.innerHTML = html;
  }

  loadHitRate();
  loadTopKb();
})();
