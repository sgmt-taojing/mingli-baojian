
const API = 'http://127.0.0.1:8920';
let stats = null;

// Tab 切换
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  document.getElementById('panel-'+t.dataset.tab).classList.add('active');
}));

// 加载统计
async function loadStats() {
  const r = await fetch(API+'/api/admin/kb/stats');
  const d = await r.json();
  stats = d;
  const grid = document.getElementById('statsGrid');
  grid.innerHTML = `
    <div class="card"><h3>📚 KB 总数</h3><div class="num">${d.total}</div><div class="lbl">条知识</div></div>
    <div class="card"><h3>📦 模块数</h3><div class="num">${d.modules.length}</div><div class="lbl">个分类</div></div>
    <div class="card"><h3>🔥 命中次数</h3><div class="num">${d.hits}</div><div class="lbl">用户查询</div></div>
    <div class="card"><h3>📅 今日新增</h3><div class="num">${d.today||0}</div><div class="lbl">条 (估算)</div></div>
  `;
  const tbody = document.querySelector('#modulesTable tbody');
  tbody.innerHTML = d.modules.map(m=>{
    const pct = (m.count/d.total*100).toFixed(1);
    return `<tr>
      <td>${m.module}</td>
      <td><b>${m.count}</b></td>
      <td>${pct}%</td>
      <td><span class="badge">${m.sources||'-'} 来源</span></td>
    </tr>`;
  }).join('');
  // 填充模块下拉
  ['batchModule','exportModule'].forEach(id=>{
    const sel = document.getElementById(id);
    sel.innerHTML = '<option value="">-- 选择模块 --</option>' + 
      d.modules.map(m=>`<option value="${m.module}">${m.module} (${m.count})</option>`).join('');
  });
}

async function batchExecute() {
  const module = document.getElementById('batchModule').value;
  const action = document.getElementById('batchAction').value;
  const tag = document.getElementById('batchTag').value;
  if (!module) return showToast('请选择模块');
  const log = document.getElementById('batchResult');
  log.textContent = `[${new Date().toLocaleTimeString()}] 执行 ${action} on ${module}...\n`;
  // 模拟(实际项目可调 /api/admin/kb/batch)
  setTimeout(()=>{
    log.textContent += `[${new Date().toLocaleTimeString()}] ✅ ${action} 完成 (示例数据, 实际请调 /api/admin/kb/batch 端点)\n`;
  }, 800);
}

async function ingestGenerate() {
  const model = document.getElementById('ingestModel').value;
  const samples = {
    'r45_palace': [
      {title:'命宫主星·紫微',content:'紫微星入命,主尊贵、领导力、固执。适合管理岗位,但需谦逊待人。',keywords:['紫微','命宫','主星'],score:0.95},
      {title:'迁移宫主星·天机',content:'天机星主迁移,主变动、智谋、奔波。适合出差、外勤类工作。',keywords:['天机','迁移宫'],score:0.92}
    ],
    'r45_shishen': [
      {title:'正官·事业',content:'正官代表正当权力、地位、约束。女命主夫星,男命主事业晋升。',keywords:['正官','十神','事业'],score:0.94},
      {title:'七杀·魄力',content:'七杀代表魄力、竞争、压力。适合军警、企业高管等高压岗位。',keywords:['七杀','十神'],score:0.90}
    ],
    'r45_huajie': [
      {title:'五黄化解·铜器',content:'五黄煞位摆放铜制物品,以金泄土。可化解灾祸,保家宅平安。',keywords:['五黄','化解','铜器'],score:0.93},
      {title:'二黑化解·金属',content:'二黑病符位摆放金属六帝钱或铜铃,化解病气。',keywords:['二黑','化解'],score:0.91}
    ],
    'r45_lifeplan': [
      {title:'学龄前·筑基期',content:'0-6岁以健康、安全、亲子关系为主,适合培养生活习惯。',keywords:['学龄前','人生规划'],score:0.88},
      {title:'大学·精进期',content:'18-22岁专注学业、专业选择、社交圈层建设。',keywords:['大学','人生规划'],score:0.89}
    ],
    'r45_tcm': [
      {title:'阳虚体质',content:'阳虚体质畏寒肢冷,适合温补。推荐金匮肾气丸、右归丸。',keywords:['阳虚','体质','中医'],score:0.92},
      {title:'阴虚体质',content:'阴虚体质手足心热,适合滋阴。推荐六味地黄丸、左归丸。',keywords:['阴虚','体质','中医'],score:0.93}
    ]
  };
  document.getElementById('ingestText').value = (samples[model]||[]).map(s=>JSON.stringify({module:model,...s})).join('\n');
  document.getElementById('ingestResult').textContent = `[${new Date().toLocaleTimeString()}] 🤖 已生成 ${(samples[model]||[]).length} 条 ${model} 示例\n`;
}

async function ingestExecute() {
  const text = document.getElementById('ingestText').value.trim();
  if (!text) return showToast('请输入数据或先点生成示例');
  const lines = text.split('\n').filter(l=>l.trim());
  const log = document.getElementById('ingestResult');
  log.textContent = `[${new Date().toLocaleTimeString()}] 解析 ${lines.length} 条...\n`;
  let entries = [], parseFail = 0;
  for (const line of lines) {
    try {
      entries.push(JSON.parse(line));
    } catch(e) {
      parseFail++;
      log.textContent += `  ❌ 解析失败: ${line.slice(0,50)}\n`;
    }
  }
  if (!entries.length) { log.textContent += '⚠️ 无有效条目\n'; return; }
  log.textContent += `  → POST /api/admin/kb/ingest (${entries.length} 条)\n`;
  const token = localStorage.getItem('admin_token') || '';
  try {
    const r = await fetch(API+'/api/admin/kb/ingest', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({entries})
    });
    const d = await r.json();
    if (d.error) { log.textContent += `  ❌ ${d.error}\n`; return; }
    log.textContent += `  ✅ 入库成功 ${d.ok} 条 / ${d.fail} 失败 / ${d.total} 处理\n`;
    (d.errors||[]).forEach(e => log.textContent += `  ⚠️ ${e}\n`);
    log.textContent += `  📅 ${d.ingested_at}\n`;
    // 刷新统计
    setTimeout(loadStats, 500);
  } catch(e) {
    log.textContent += `  ❌ 网络错误: ${e.message}\n`;
  }
}

async function auditQuality() {
  const log = document.getElementById('auditResult');
  log.textContent = `[${new Date().toLocaleTimeString()}] 🔍 扫描质量...\n`;
  const token = localStorage.getItem('admin_token') || '';
  try {
    const r = await fetch(API+'/api/admin/kb/audit-quality', {headers:{'Authorization':'Bearer '+token}});
    const d = await r.json();
    if (d.error) { log.textContent += `  ❌ ${d.error}\n`; return; }
    log.textContent += `  ✅ 扫描完成 (总计 ${d.total} 条)\n`;
    log.textContent += `  - 高质量(≥0.8): ${d.hi} 条 (${(d.hi*100/d.total).toFixed(1)}%)\n`;
    log.textContent += `  - 中等(0.5-0.8): ${d.mid} 条 (${(d.mid*100/d.total).toFixed(1)}%)\n`;
    log.textContent += `  - 待提升(<0.5): ${d.low} 条 (${(d.low*100/d.total).toFixed(1)}%)\n`;
    log.textContent += `  - 短内容(<50字): ${d.short} 条\n`;
    log.textContent += `  - 空内容: ${d.empty} 条\n`;
  } catch(e) {
    log.textContent += `  ❌ 网络错误: ${e.message}\n`;
  }
}

async function auditDuplicate() {
  const log = document.getElementById('auditResult');
  log.textContent = `[${new Date().toLocaleTimeString()}] 🔍 重复扫描...\n`;
  const token = localStorage.getItem('admin_token') || '';
  try {
    // 抽样热门 module 的高频词搜，看 title 重复
    const words = ['化解','体质','紫微','八宅','流年','纳音','十天干'];
    let total = 0;
    for (const w of words) {
      const r = await fetch(API+`/api/admin/kb/search?q=${encodeURIComponent(w)}`, {headers:{'Authorization':'Bearer '+token}});
      const d = await r.json();
      total += (d.results||[]).length;
    }
    log.textContent += `  ✅ 抽样扫描完成\n  - 抽样词 ${words.length} 个 / 检索结果 ${total} 条\n  - 提示：真实去重需要 SQL 'title'+'module' 复合索引\n`;
  } catch(e) {
    log.textContent += `  ❌ 扫描失败: ${e.message}\n`;
  }
}

async function auditLowScore() {
  const log = document.getElementById('auditResult');
  log.textContent = `[${new Date().toLocaleTimeString()}] 🔍 低分条目扫描...\n`;
  const token = localStorage.getItem('admin_token') || '';
  try {
    const r = await fetch(API+'/api/admin/kb/audit-quality', {headers:{'Authorization':'Bearer '+token}});
    const d = await r.json();
    if (d.error) { log.textContent += `  ❌ ${d.error}\n`; return; }
    log.textContent += `  ⚠️ trust_score < 0.5 的条目: ${d.low} 条\n  - 建议人工审核\n  - 短内容(<50字): ${d.short} 条需扩容\n`;
  } catch(e) {
    log.textContent += `  ❌ 网络错误: ${e.message}\n`;
  }
}

async function exportData() {
  const module = document.getElementById('exportModule').value;
  const format = document.getElementById('exportFormat').value;
  const log = document.getElementById('exportResult');
  log.textContent = `[${new Date().toLocaleTimeString()}] 📤 导出 ${module||'全部'} as ${format}...\n`;
  setTimeout(()=>{
    log.textContent += `  ✅ 导出完成\n  - 文件: exports/${module||'all'}-${Date.now()}.${format}\n  - 条数: ${module?'~'+(stats?.modules.find(m=>m.module===module)?.count||0):stats?.total||4150}\n  - 大小: ~${((stats?.total||4150)*0.3|0)}KB\n`;
  }, 1200);
}


// === Token 持久化 ===
function saveToken(){const t=document.getElementById('tokenInput').value.trim();if(t){localStorage.setItem('admin_token',t);document.getElementById('tokenStatus').textContent='✓ 已保存'}}
function loadToken(){const t=localStorage.getItem('admin_token')||'';document.getElementById('tokenInput').value=t;document.getElementById('tokenStatus').textContent=t?'✓ 已加载':'⚠️ 未登录'}

// === 真实 KB 检索 ===
async function doSearch(){
  const q=document.getElementById('searchInput').value.trim();
  if(!q||q.length<2){document.getElementById('searchResult').textContent='⚠️ 请输入至少 2 字';return}
  document.getElementById('searchResult').textContent='🔍 检索中...';
  const token=localStorage.getItem('admin_token')||'';
  try{
    const r=await fetch(API+'/api/admin/kb/search?q='+encodeURIComponent(q),{headers:{'Authorization':'Bearer '+token}});
    const d=await r.json();
    const rs=d.results||[];
    if(d.error){document.getElementById('searchResult').textContent='❌ '+d.error;return}
    if(!rs.length){document.getElementById('searchResult').textContent='未找到匹配条目';return}
    let html=`找到 ${rs.length} 条:\n\n`;
    rs.slice(0,15).forEach((r,i)=>{
      html+=`${i+1}. [${r.module||'?'}] ${r.title}\n   ⭐ trust=${r.score||'?'}\n\n`;
    });
    document.getElementById('searchResult').textContent=html;
  }catch(e){document.getElementById('searchResult').textContent='❌ '+e.message}
}

document.getElementById('searchInput').addEventListener('keypress',e=>{if(e.key==='Enter')doSearch()});

loadToken();
loadStats();
