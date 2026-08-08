
const API = location.hostname === 'localhost' || location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8920' : '';
const TOKEN = localStorage.getItem('mlbj_token') || '';

function toast(msg, type){const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type||'');setTimeout(()=>t.className='toast',2400)}
function authH(){return TOKEN ? {'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'} : {'Content-Type':'application/json'}}

async function api(path, opts){
  try {   const r = await fetch(API+path, Object.assign({headers:authH()}, opts||{}), { signal: AbortSignal.timeout(15000) }); } catch(e) { console.warn("[R514] fetch error:", e.message); }
  if(r.status===401){toast('未登录','err');return null}
  if(r.status===403){toast('权限不足','err');return null}
  const ct = r.headers.get('content-type')||'';
  if(ct.includes('json')) return await r.json();
  return await r.text();
}

// ① 脱敏预览（前端内置镜像）
function previewMask(){
  const m = (s,n=3,k=4)=>!s?s:s.length<n+k?s.substring(0,n)+'****':s.substring(0,n)+'****'+s.substring(s.length-k);
  const maskName = s=>!s?s:s.length<=1?s:s.length===2?s[0]+'*':s[0]+'*'.repeat(s.length-2)+s[s.length-1];
  const maskID = s=>!s?s:s.length<8?'****':s.substring(0,4)+'*'.repeat(s.length-8)+s.substring(s.length-4);
  document.getElementById('outPhone').value = m(document.getElementById('iptPhone').value);
  document.getElementById('outName').value = maskName(document.getElementById('iptName').value);
  document.getElementById('outID').value = maskID(document.getElementById('iptID').value);
  document.getElementById('outAddr').value = (document.getElementById('iptAddr').value||'').substring(0,2)+'****';
  let t = document.getElementById('iptText').value;
  t = t.replace(/1[3-9]\d{9}/g, x=>x.substring(0,3)+'****'+x.substring(7));
  t = t.replace(/\d{17}[\dXx]/g, x=>x.substring(0,4)+'***********'+x.substring(15));
  t = t.replace(/[\w.-]+@[\w.-]+/g, x=>x.split('@')[0].substring(0,1)+'***@'+x.split('@')[1]);
  document.getElementById('outText').value = t;
  toast('已脱敏');
}

// ② 导出
async function doExport(fmt){
  const table = document.getElementById('selTable').value;
  const purpose = document.getElementById('iptPurpose').value || '未说明';
  let r;
  try {
    r = await fetch(API+'/api/export/'+fmt,{method:'POST',headers:authH(),body:JSON.stringify({table,purpose,signal:AbortSignal.timeout(15000)}),signal:AbortSignal.timeout(20000)});
  } catch(e) {
    console.warn("[R514] fetch error:", e.message);
    toast('导出请求失败：' + (e && e.message || '网络异常') + '，请重试', 'err');
    return;
  }
  if(r.status===401){toast('请先登录','err');return}
  if(r.status===403){toast('权限不足: '+table,'err');return}
  if(!r.ok){const e=await r.json();toast(e.error||'导出失败','err');return}
  const blob = await r.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const cd = r.headers.get('content-disposition')||'';
  const m = cd.match(/filename="([^"]+)"/);
  a.href = url; a.download = m ? m[1] : `${table}-${Date.now()}.${fmt}`;
  a.click(); URL.revokeObjectURL(url);
  toast('已导出（含水印 + 审计）');
}

// ③ 加密归档
async function doArchive(){
  const table = document.getElementById('archTable').value;
  const ids = (document.getElementById('archIds').value||'').split(',').map(x=>parseInt(x.trim())).filter(Boolean);
  const reason = document.getElementById('archReason').value;
  if(!reason){toast('必须填写归档原因','err');return}
  const r = await api('/api/export/archive',{method:'POST',body:JSON.stringify({table,ids,reason})});
  if(!r) return;
  if(r.success){
    document.getElementById('archResult').value = JSON.stringify(r,null,2);
    toast('归档成功（密文已生成）');
  } else toast(r.error||'失败','err');
}
async function doDecrypt(){
  let payload;
  try { payload = JSON.parse(document.getElementById('archResult').value).encrypted_payload; }
  catch(e){ toast('请先加密归档','err'); return; }
  const r = await api('/api/export/decrypt',{method:'POST',body:JSON.stringify({encrypted_payload:payload,reason:'审计回溯'})});
  if(!r) return;
  document.getElementById('archResult').value = JSON.stringify(r,null,2);
  toast('已解密（明文仅 super_admin 可见，已审计）');
}

// ④ 审计日志
async function loadAudit(){
  const r = await api('/api/export/audit-log?limit=50');
  if(!r||!r.log){document.getElementById('auditBody').innerHTML='<tr><td colspan="7" style="text-align:center;color:#888">仅 super_admin 可查看</td></tr>';return}
  const html = r.log.map(row=>{
    const d = row.detail || {};
    return `<tr><td>${row.created_at||''}</td><td>${row.user_id||0}</td><td><span class="pill">${row.action||''}</span></td><td>${d.target_table||'-'}</td><td>${d.rows_count||d.original_count||'-'}</td><td style="font-size:11px;color:#888">${d.ip||'-'}</td><td style="font-size:11px">${d.purpose||d.reason||'-'}</td></tr>`;
  }).join('');
  document.getElementById('auditBody').innerHTML = html || '<tr><td colspan="7" style="text-align:center;color:#888">暂无记录</td></tr>';
  toast('已加载 '+r.count+' 条');
}

// ⑤ 解锁令牌
async function applyUnlock(){
  const body = {
    table: document.getElementById('unlockTbl').value,
    target_ids: (document.getElementById('unlockIds').value||'').split(',').map(x=>parseInt(x.trim())).filter(Boolean),
    ttl_hours: parseInt(document.getElementById('unlockTTL').value)||1,
    reason: document.getElementById('unlockReason').value
  };
  const r = await api('/api/export/unlock',{method:'POST',body:JSON.stringify(body)});
  if(!r) return;
  document.getElementById('unlockResult').textContent = JSON.stringify(r,null,2);
  toast('已生成令牌（审计已留痕）');
}

// 初始化
window.addEventListener('DOMContentLoaded', ()=>{
  if(!TOKEN){toast('未登录：请先到 智能助手 / 用户中心 登录','err');document.getElementById('roleBadge').textContent='未登录'}
  else{try{const p=JSON.parse(atob(TOKEN.split('.')[1]));document.getElementById('roleBadge').textContent=(p.roles||['free']).join(', ')}catch(e){document.getElementById('roleBadge').textContent='token 解析失败'}}
  previewMask();
});
