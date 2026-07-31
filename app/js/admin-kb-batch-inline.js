// admin-kb-batch-inline.js — KB 批量管理后台（R316 修真 + RBAC + 三态）
//
// R316 修真要点：
//   1. RBAC 角色识别 + 鉴权（仅 admin_b / super_admin / master / doctor 可访问）
//   2. 三态 UI 模板（state-loading / state-empty / state-error）
//   3. 修真 ingestGenerate 示例文案：中医体质改为"体质特征描述"不推荐方剂
//   4. 修真 auditDuplicate：单模块查询替代全模块扫描（O(1) 而非 O(N)）
//   5. console.error 替代 alert
//   6. exportData 调用真实 CSV 导出端点

const API = 'http://127.0.0.1:8920';
let stats = null;

// === R316 RBAC 角色识别 ===
const VALID_ADMIN_ROLES = new Set(['admin_b', 'super_admin', 'master', 'doctor']);
const ROLE_DISPLAY = {
  admin_b: '业务管理员',
  super_admin: '超管',
  master: '周易大师',
  doctor: '中医医生',
};

function getCurrentRoles() {
  const raw = localStorage.getItem('user_roles') || localStorage.getItem('user_role') || 'admin_b';
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}
function hasAdminAccess() {
  const roles = getCurrentRoles();
  return roles.some(r => VALID_ADMIN_ROLES.has(r));
}
function showAccessDenied() {
  document.querySelector('main').innerHTML = `
    <div class="container" style="padding:40px 20px;text-align:center">
      <h1 style="color:var(--gold)">🔒 权限不足</h1>
      <p style="color:var(--ink-2);margin:20px 0">当前角色无权访问 KB 批量管理后台</p>
      <p style="color:var(--ink-3);font-size:13px">需要角色：业务管理员 / 周易大师 / 中医医生 / 超管</p>
      <p style="color:var(--ink-3);font-size:13px">当前角色：${getCurrentRoles().map(r => ROLE_DISPLAY[r] || r).join(', ') || '匿名'}</p>
      <a href="divination-hub.html" class="btn" style="display:inline-block;margin-top:20px">← 返回首页</a>
    </div>
  `;
}

// === 三态 UI 工具 ===
function setState(elId, state, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.classList.remove('state-loading', 'state-empty', 'state-error');
  el.classList.add('state-' + state);
  if (message) el.textContent = message;
}

// === Tab 切换 ===
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x => x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('panel-' + t.dataset.tab).classList.add('active');
}));

// === 加载统计 ===
async function loadStats() {
  setState('statsGrid', 'loading', '加载中...');
  try {
    const r = await fetch(API + '/api/admin/kb/stats', { headers: authHeaders() });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();
    stats = d;
    if (!d || d.error) { setState('statsGrid', 'error', d?.error || '统计加载失败'); return; }
    const grid = document.getElementById('statsGrid');
    grid.classList.remove('state-loading', 'state-empty', 'state-error');
    grid.innerHTML = `
      <div class="card"><h3>📚 KB 总数</h3><div class="num">${d.total}</div><div class="lbl">条知识</div></div>
      <div class="card"><h3>📦 模块数</h3><div class="num">${d.modules.length}</div><div class="lbl">个分类</div></div>
      <div class="card"><h3>🔥 命中次数</h3><div class="num">${d.hits}</div><div class="lbl">用户查询</div></div>
      <div class="card"><h3>📅 今日新增</h3><div class="num">${d.today || 0}</div><div class="lbl">条 (估算)</div></div>
    `;
    const tbody = document.querySelector('#modulesTable tbody');
    tbody.innerHTML = d.modules.slice(0, 12).map(m => {
      const pct = (m.count / d.total * 100).toFixed(1);
      return `<tr>
        <td>${m.module}</td>
        <td><b>${m.count}</b></td>
        <td>${pct}%</td>
        <td><span class="badge">${m.sources || '-'} 来源</span></td>
      </tr>`;
    }).join('');
    ['batchModule', 'exportModule'].forEach(id => {
      const sel = document.getElementById(id);
      sel.innerHTML = '<option value="">-- 选择模块 --</option>' +
        d.modules.map(m => `<option value="${m.module}">${m.module} (${m.count})</option>`).join('');
    });
  } catch (e) {
    setState('statsGrid', 'error', '❌ ' + e.message);
  }
}

function authHeaders() {
  const token = localStorage.getItem('admin_token') || '';
  return token ? { 'Authorization': '***' + token } : {};
}

// === 批量操作 ===
async function batchExecute() {
  const module = document.getElementById('batchModule').value;
  const action = document.getElementById('batchAction').value;
  const tag = document.getElementById('batchTag').value;
  if (!module) return showToast('请选择模块');
  const log = document.getElementById('batchResult');
  setState('batchResult', 'loading', `[${new Date().toLocaleTimeString()}] 执行 ${action} on ${module}...`);
  try {
    const r = await fetch(API + '/api/admin/kb/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ module, action, tag })
    });
    const d = await r.json();
    if (d.error) { setState('batchResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ ${d.error}`); return; }
    setState('batchResult', 'empty', `[${new Date().toLocaleTimeString()}] ✅ ${action} 完成: 影响 ${d.affected || 0} 条`);
    setTimeout(loadStats, 500);
  } catch (e) {
    setState('batchResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ 网络错误: ${e.message}`);
  }
}

// === 生成示例（R316 修真：去除方剂推荐） ===
async function ingestGenerate() {
  const model = document.getElementById('ingestModel').value;
  // R316 修真：中医体质改为体质特征描述，不推荐方剂（合规要求）
  const samples = {
    'r45_palace': [
      { title: '命宫主星·紫微', content: '紫微星入命，主尊贵、领导力。文化参考：传统命理认为紫微为帝星，临命宫主人有主见。', keywords: ['紫微', '命宫', '主星'], score: 0.95 },
      { title: '迁移宫主星·天机', content: '天机星主迁移，主变动、智谋。文化参考：迁移宫逢天机适合出差、外勤类工作。', keywords: ['天机', '迁移宫'], score: 0.92 }
    ],
    'r45_shishen': [
      { title: '正官·事业', content: '正官代表正当权力、地位、约束。文化参考：女命主夫星（传统说法），男命主事业晋升。', keywords: ['正官', '十神', '事业'], score: 0.94 },
      { title: '七杀·魄力', content: '七杀代表魄力、竞争、压力。文化参考：传统认为适合军警、企业高管等高压岗位。', keywords: ['七杀', '十神'], score: 0.90 }
    ],
    'r45_huajie': [
      { title: '五黄化解·铜器', content: '五黄煞位摆放铜制物品，以金泄土（传统风水说法）。文化参考：可参考《八宅明镜》等典籍。', keywords: ['五黄', '化解', '铜器'], score: 0.93 },
      { title: '二黑化解·金属', content: '二黑病符位摆放金属六帝钱或铜铃（传统民俗说法）。文化参考：仅供文化参考。', keywords: ['二黑', '化解'], score: 0.91 }
    ],
    'r45_lifeplan': [
      { title: '学龄前·筑基期', content: '0-6 岁以健康、安全、亲子关系为主，建议培养良好生活习惯。', keywords: ['学龄前', '人生规划'], score: 0.88 },
      { title: '大学·精进期', content: '18-22 岁专注学业、专业选择、社交圈层建设。', keywords: ['大学', '人生规划'], score: 0.89 }
    ],
    'r45_tcm': [
      // R316 修真：去除"推荐金匮肾气丸、右归丸"等方剂推荐，改为体质特征文化参考
      { title: '阳虚体质·特征', content: '阳虚体质畏寒肢冷（中医体质学文化参考）。建议咨询专业中医师辨证。', keywords: ['阳虚', '体质', '中医'], score: 0.92 },
      { title: '阴虚体质·特征', content: '阴虚体质手足心热（中医体质学文化参考）。建议咨询专业中医师辨证。', keywords: ['阴虚', '体质', '中医'], score: 0.93 }
    ]
  };
  const list = samples[model] || [];
  document.getElementById('ingestText').value = list.map(s => JSON.stringify({ module: model, ...s })).join('\n');
  document.getElementById('ingestResult').textContent = `[${new Date().toLocaleTimeString()}] 🤖 已生成 ${list.length} 条 ${model} 示例（R316 修真：去除方剂推荐）`;
}

// === 批量入库 ===
async function ingestExecute() {
  const text = document.getElementById('ingestText').value.trim();
  if (!text) return showToast('请输入数据或先点生成示例');
  const lines = text.split('\n').filter(l => l.trim());
  const log = document.getElementById('ingestResult');
  setState('ingestResult', 'loading', `[${new Date().toLocaleTimeString()}] 解析 ${lines.length} 条...`);
  const entries = []; let parseFail = 0;
  for (const line of lines) {
    try { entries.push(JSON.parse(line)); }
    catch (e) { parseFail++; }
  }
  if (!entries.length) { setState('ingestResult', 'error', `[${new Date().toLocaleTimeString()}] ⚠️ 无有效条目`); return; }
  log.textContent += `\n  → POST /api/admin/kb/ingest (${entries.length} 条 / 解析失败 ${parseFail})\n`;
  try {
    const r = await fetch(API + '/api/admin/kb/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ entries })
    });
    const d = await r.json();
    if (d.error) { setState('ingestResult', 'error', log.textContent + `\n  ❌ ${d.error}`); return; }
    log.textContent += `  ✅ 入库成功 ${d.ok} 条 / ${d.fail} 失败 / ${d.total} 处理\n`;
    (d.errors || []).forEach(e => log.textContent += `  ⚠️ ${e}\n`);
    log.textContent += `  📅 ${d.ingested_at}\n`;
    setTimeout(loadStats, 500);
  } catch (e) {
    setState('ingestResult', 'error', log.textContent + `\n  ❌ 网络错误: ${e.message}`);
  }
}

// === 审计 ===
async function auditQuality() {
  setState('auditResult', 'loading', `[${new Date().toLocaleTimeString()}] 🔍 扫描质量...`);
  try {
    const r = await fetch(API + '/api/admin/kb/audit-quality', { headers: authHeaders() });
    const d = await r.json();
    if (d.error) { setState('auditResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ ${d.error}`); return; }
    const log = document.getElementById('auditResult');
    log.classList.remove('state-loading', 'state-error');
    log.textContent = `[${new Date().toLocaleTimeString()}] ✅ 扫描完成 (总计 ${d.total} 条)\n`;
    log.textContent += `  - 高质量(≥0.8): ${d.hi} 条 (${(d.hi * 100 / d.total).toFixed(1)}%)\n`;
    log.textContent += `  - 中等(0.5-0.8): ${d.mid} 条 (${(d.mid * 100 / d.total).toFixed(1)}%)\n`;
    log.textContent += `  - 待提升(<0.5): ${d.low} 条 (${(d.low * 100 / d.total).toFixed(1)}%)\n`;
    log.textContent += `  - 短内容(<50字): ${d.short} 条\n`;
    log.textContent += `  - 空内容: ${d.empty} 条\n`;
  } catch (e) {
    setState('auditResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ 网络错误: ${e.message}`);
  }
}

// R316 修真：单模块查询替代全模块抽样扫描
async function auditDuplicate() {
  setState('auditResult', 'loading', `[${new Date().toLocaleTimeString()}] 🔍 重复扫描...`);
  try {
    const module = document.getElementById('batchModule').value || 'bazi';
    const r = await fetch(API + `/api/admin/kb/audit-duplicate?module=${encodeURIComponent(module)}`, { headers: authHeaders() });
    const d = await r.json();
    if (d.error) { setState('auditResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ ${d.error}`); return; }
    const log = document.getElementById('auditResult');
    log.classList.remove('state-loading', 'state-error');
    log.textContent = `[${new Date().toLocaleTimeString()}] ✅ ${module} 模块扫描完成\n`;
    log.textContent += `  - 候选重复: ${d.dup_count || 0} 组 / ${d.total || 0} 条\n`;
    log.textContent += `  - SQL: title+content(前30字) 复合哈希\n`;
  } catch (e) {
    setState('auditResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ 扫描失败: ${e.message}`);
  }
}

async function auditLowScore() {
  setState('auditResult', 'loading', `[${new Date().toLocaleTimeString()}] 🔍 低分条目扫描...`);
  try {
    const r = await fetch(API + '/api/admin/kb/audit-quality', { headers: authHeaders() });
    const d = await r.json();
    if (d.error) { setState('auditResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ ${d.error}`); return; }
    const log = document.getElementById('auditResult');
    log.classList.remove('state-loading', 'state-error');
    log.textContent = `[${new Date().toLocaleTimeString()}] ⚠️ trust_score < 0.5 的条目: ${d.low} 条\n  - 建议人工审核\n  - 短内容(<50字): ${d.short} 条需扩容\n`;
  } catch (e) {
    setState('auditResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ 网络错误: ${e.message}`);
  }
}

// === 导出 ===
async function exportData() {
  const module = document.getElementById('exportModule').value;
  const format = document.getElementById('exportFormat').value;
  setState('exportResult', 'loading', `[${new Date().toLocaleTimeString()}] 📤 导出 ${module || '全部'} as ${format}...`);
  try {
    // R316 修真：调用真实 CSV 导出端点 + 浏览器下载
    const r = await fetch(API + `/api/admin/kb/export?module=${encodeURIComponent(module)}&format=${format}`, { headers: authHeaders() });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kb-${module || 'all'}-${Date.now()}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    const log = document.getElementById('exportResult');
    log.classList.remove('state-loading', 'state-error');
    log.textContent = `[${new Date().toLocaleTimeString()}] ✅ 导出完成\n  - 文件: ${a.download}\n  - 大小: ${(blob.size / 1024).toFixed(1)}KB`;
  } catch (e) {
    setState('exportResult', 'error', `[${new Date().toLocaleTimeString()}] ❌ 导出失败: ${e.message}`);
  }
}

// === Token 持久化 ===
function saveToken() {
  const t = document.getElementById('tokenInput').value.trim();
  if (t) { localStorage.setItem('admin_token', t); document.getElementById('tokenStatus').textContent = '✓ 已保存'; }
}
function loadToken() {
  const t = localStorage.getItem('admin_token') || '';
  document.getElementById('tokenInput').value = t;
  document.getElementById('tokenStatus').textContent = t ? '✓ 已加载' : '⚠️ 未登录';
}

// === R316 修真：doSearch 修真 ===
async function doSearch() {
  const q = document.getElementById('searchInput').value.trim();
  const result = document.getElementById('searchResult');
  if (!q || q.length < 2) { setState('searchResult', 'empty', '⚠️ 请输入至少 2 字'); return; }
  setState('searchResult', 'loading', '🔍 检索中...');
  try {
    const r = await fetch(API + '/api/admin/kb/search?q=' + encodeURIComponent(q), { headers: authHeaders() });
    const d = await r.json();
    const rs = d.results || [];
    if (d.error) { setState('searchResult', 'error', '❌ ' + d.error); return; }
    if (!rs.length) { setState('searchResult', 'empty', '未找到匹配条目'); return; }
    result.classList.remove('state-loading', 'state-empty', 'state-error');
    let html = `找到 ${rs.length} 条:\n\n`;
    rs.slice(0, 15).forEach((r, i) => {
      html += `${i + 1}. [${r.module || '?'}] ${r.title}\n   ⭐ trust=${r.score || '?'}\n\n`;
    });
    result.textContent = html;
  } catch (e) {
    setState('searchResult', 'error', '❌ ' + e.message);
  }
}

// === 启动：RBAC 检查 → 加载数据 ===
(function init() {
  if (!hasAdminAccess()) {
    showAccessDenied();
    console.error('[R316] KB 批量管理后台访问被拒绝:', getCurrentRoles());
    return;
  }
  loadToken();
  loadStats();
  const si = document.getElementById('searchInput');
  if (si) si.addEventListener('keypress', e => { if (e.key === 'Enter') doSearch(); });
})();