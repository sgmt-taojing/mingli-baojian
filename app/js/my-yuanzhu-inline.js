
const API = (location.hostname==='127.0.0.1'||location.hostname==='localhost') ? 'http://127.0.0.1:8920' : '';
let token = localStorage.getItem('mlbj_token') || '';
let user = null;

function toast(msg){
  const t=document.createElement('div');t.className='toast';t.textContent=msg;document.body.appendChild(t);
  setTimeout(()=>t.remove(),2000);
}

async function api(path, opts={}){
  const hdr = Object.assign({'Content-Type':'application/json'}, opts.headers||{});
  if(token) hdr['Authorization'] = '***' + token;
  // 节点 #4.3：优先走 apiCall（统一拦截器），不改业务调用语义
  try{
    const result = await window.apiClient.get(API + path, Object.assign({headers:hdr}, opts));
    return result.ok ? result.data : { error: result.message, code: result.code, data: result.data };
  }catch(e){return {error:e.message};}
}

function switchTab(name){
  document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('on', t.dataset.tab===name));
  loadTab(name);
}

async function loadTab(name){
  const c = document.getElementById('content');
  c.innerHTML = '<div class="loading">加载中...</div>';
  switch(name){
    case 'profile': return renderProfile(c);
    case 'yuanzhu': return renderYuanzhu(c);
    case 'push': return renderPush(c);
    case 'points': return renderPoints(c);
    case 'reports': return renderReports(c);
    case 'shop': return renderShop(c);
    case 'kb': return renderKb(c);
    case 'voices': return renderVoices(c);
    case 'music': return renderMusic(c);
    case 'lifeindex': return renderLifeindex(c);
    case 'lifeplan': return renderLifeplan(c);
    case 'kb-dash': return renderKbDash(c);
  }
}

async function renderProfile(c){
  if(!token){
    c.innerHTML = `<div class="card"><h3>👤 登录</h3>
      <label for="phone" class="sr-only">登录手机号</label>
      <input id="phone" placeholder="手机号" style="width:100%;padding:10px;background:var(--ink3);border:1px solid var(--border);border-radius:8px;color:var(--paper);margin-bottom:10px">
      <button class="btn" style="width:100%" onclick="login()">登录 / 注册</button></div>`;
    return;
  }
  const r = await api('/api/yuanzhu/profile');
  if(r.error){c.innerHTML = `<div class="empty">${r.error}</div>`;return;}
  user = r;
  c.innerHTML = `
    <div class="card"><h3>👤 个人中心</h3>
      <div class="row"><span class="label">手机号</span><span class="val">${r.phone||'-'}</span></div>
      <div class="row"><span class="label">昵称</span><span class="val">${r.nickname||'-'}</span></div>
      <div class="row"><span class="label">角色</span><span class="val">${(r.roles||[]).join(',')||'用户'}</span></div>
      <div class="row"><span class="label">积分</span><span class="val">${r.points||0}</span></div>
      <div class="row"><span class="label">注册时间</span><span class="val">${r.createdAt?new Date(r.createdAt).toLocaleDateString('zh-CN'):'-'}</span></div>
    </div>
    <button class="btn" style="width:100%" onclick="logout()">退出登录</button>
  `;
}

async function renderYuanzhu(c){
  const r = await api('/api/yuanzhu/list');
  // 公开近期案例（节点 #4.11）：脱敏列表展示
  let casesHtml = '';
  try {
    const cs = await api('/api/public/recent-cases');
    if(Array.isArray(cs) && cs.length){
      casesHtml = `<div class="card"><h3>📜 近期案例 (${cs.length})</h3>` +
        cs.slice(0,8).map(cc=>{
          const sym = (cc.symptoms||'').replace(/[\\\"]/g,'').slice(0,40) || '（已脱敏）';
          const master = cc.master_name || '大师';
          const date = (cc.created_at||'').slice(0,10);
          return `<div class="row"><span class="label">${sym}</span><span class="val">${master} · ${date}</span></div>`;
        }).join('') +
        `</div>`;
    }
  } catch(e){ /* 静默兜底 */ }
  if(r.error || !r.list){
    c.innerHTML = `<div class="empty">未登录或接口未开放</div>` + casesHtml;
    return;
  }
  const list = r.list || [];
  if(!list.length){
    c.innerHTML = `<div class="empty">暂无专属助手，<a href="ai-assistant.html" style="color:var(--gold)">先去 AI 助手创建</a></div>` + casesHtml;
    return;
  }
  c.innerHTML = `<div class="card"><h3>🧙 我的助手 (${list.length})</h3>` +
    list.map(y=>`<div class="row"><span class="label">${y.name}</span><span class="val">${y.style||''}</span></div>`).join('') +
    `</div>` + casesHtml;
}

// #13 节点 3：分页状态（push / reports / kb 共享分页器）
const _pg = { push:{limit:10,offset:0}, reports:{limit:10,offset:0}, kb:{limit:10,offset:0,q:''} };
function _pagerHtml(key, total){
  const p=_pg[key]; const totalPages = Math.max(1, Math.ceil((total||0)/p.limit));
  const cur = Math.floor(p.offset/p.limit)+1;
  return `<div style="display:flex;gap:8px;justify-content:center;margin-top:10px">
    <button class="btn" style="padding:4px 10px;font-size:12px" onclick="(function(){if(_pg.${key}.offset>0){_pg.${key}.offset-=_pg.${key}.limit;loadTab('${key==='push'?'push':key==='reports'?'reports':'kb'});}})()" ${cur<=1?'disabled':''}>‹ 上一页</button>
    <span style="font-size:12px;color:var(--paper3);align-self:center">第 ${cur}/${totalPages} 页（${total||0} 条）</span>
    <button class="btn" style="padding:4px 10px;font-size:12px" onclick="(function(){if(_pg.${key}.offset+_pg.${key}.limit<${total||0}){_pg.${key}.offset+=_pg.${key}.limit;loadTab('${key==='push'?'push':key==='reports'?'reports':'kb'}');}})()" ${cur>=totalPages?'disabled':''}>下一页 ›</button>
  </div>`;
}

// #13 节点 3：TTS 试听（节点 4.13 voices → 调 /api/tts 试听 1 句）
async function _ttsPreview(voiceId, name){
  if(!voiceId) return;
  toast('🔊 试听 '+name+'…');
  try {
    const text = encodeURIComponent('你好，我是'+name+'。欢迎使用命理宝鉴。');
    const url = '/api/tts?text='+text+'&voice='+encodeURIComponent(voiceId);
    const audio = new Audio(url);
    audio.volume = 0.8;
    audio.onended = ()=>toast('✅ 试听完成');
    audio.onerror = ()=>toast('⚠️ TTS 服务不可用');
    await audio.play();
  } catch(e){ toast('⚠️ TTS 不可用: '+e.message); }
}
// 暴露给 inline onclick
window._ttsPreview = _ttsPreview;

async function renderPush(c){
  const p = _pg.push;
  const r = await api('/api/yuanzhu/yearly-pushes?limit='+p.limit+'&offset='+p.offset);
  // 语音列表（节点 #4.13）：辅助展示可选声音 + TTS 试听
  let voicesHtml = '';
  try {
    const vs = await api('/api/voices');
    if(vs && Array.isArray(vs.voices) && vs.voices.length){
      voicesHtml = `<div class="card"><h3>🎤 语音试听 (${vs.voices.length})</h3>` +
        vs.voices.slice(0,8).map(v=>{
          const gender = v.gender==='female' ? '👩' : v.gender==='male' ? '👨' : '🎙️';
          return `<div class="row"><span class="label">${gender} ${v.name}·${v.style||''}</span><span class="val"><button class="btn" style="padding:3px 10px;font-size:11px" onclick="_ttsPreview('${v.id}','${(v.name||'').replace(/'/g,'’')}')">▶ 试听</button></span></div>`;
        }).join('') +
        `</div>`;
    }
  } catch(e){ /* 静默兜底 */ }

  if(r.error){
    c.innerHTML = `<div class="empty">${r.error}</div>` + voicesHtml;
    return;
  }
  const total = r.total || (r.pushes||[]).length;
  const list = (r.pushes||[]).slice(0, p.limit);
  if(!list.length){
    // 公开接口
    const pub = await api('/api/public/latest-pushes');
    if(pub && pub.pushes){
      c.innerHTML = `<div class="card"><h3>📨 最新推送</h3>` +
        pub.pushes.slice(0,p.limit).map(p=>`<div class="row"><span class="label">${(p.title||'').substring(0,30)}</span><span class="val">${p.date||''}</span></div>`).join('') +
        `</div>` + voicesHtml;
      return;
    }
    c.innerHTML = `<div class="empty">暂无推送</div>` + voicesHtml;
    return;
  }
  c.innerHTML = `<div class="card"><h3>📨 我的年度推送 (${total})</h3>` +
    list.map(p=>`<div class="row"><span class="label">${(p.title||'').substring(0,30)}</span><span class="val">${(p.createdAt||'').substring(0,10)}</span></div>`).join('') +
    `</div>` + voicesHtml + _pagerHtml('push', total);
}

async function renderPoints(c){
  const r = await api('/api/feedback/points');
  // 公开统计（节点 #4.10）：辅助展示平台总量
  let stats = null;
  try {
    const s = await api('/api/public/stats');
    if(s && !s.error){ stats = s; }
  } catch(e){ /* 静默兜底 */ }
  const statsHtml = stats ? `
    <div class="card"><h3>📊 平台总览</h3>
      <div class="stat-grid">
        <div class="s"><div class="n">${stats.users||0}</div><div class="l">总用户</div></div>
        <div class="s"><div class="n">${stats.vipUsers||0}</div><div class="l">VIP</div></div>
        <div class="s"><div class="n">${stats.paipanCount||0}</div><div class="l">排盘总数</div></div>
        <div class="s"><div class="n">${stats.totalCases||0}</div><div class="l">案例总数</div></div>
        <div class="s"><div class="n">${stats.totalReports||0}</div><div class="l">中医报告</div></div>
        <div class="s"><div class="n">${stats.totalCourses||0}</div><div class="l">课程</div></div>
        <div class="s"><div class="n">${stats.totalPushes||0}</div><div class="l">推送</div></div>
        <div class="s"><div class="n">${stats.totalPoints||0}</div><div class="l">积分池</div></div>
      </div>
    </div>
  ` : '';
  c.innerHTML = `
    <div class="card">
      <div class="point">${(r&&r.total)||0}</div>
      <div style="text-align:center;color:var(--paper3);font-size:12px">总积分</div>
    </div>
    <div class="stat-grid">
      <div class="s"><div class="n">${(r&&r.today)||0}</div><div class="l">今日获得</div></div>
      <div class="s"><div class="n">${(r&&r.week)||0}</div><div class="l">本周获得</div></div>
      <div class="s"><div class="n">${(r&&r.month)||0}</div><div class="l">本月获得</div></div>
      <div class="s"><div class="n">${(r&&r.history)||0}</div><div class="l">历史提交</div></div>
    </div>
    ${statsHtml}
  `;
}

async function renderReports(c){
  const p = _pg.reports;
  const r = await api('/api/clinic/my-reports?limit='+p.limit+'&offset='+p.offset);
  if(r.error){c.innerHTML = `<div class="empty">${r.error==='未登录'?'请先登录':'暂无病历'}，<a href="tcm-clinic.html" style="color:var(--gold)">去中医诊所</a></div>`;return;}
  const total = r.total || (r.reports||[]).length;
  const list = (r.reports||[]).slice(0, p.limit);
  if(!list.length){c.innerHTML = `<div class="empty">暂无病历报告，<a href="tcm-clinic.html" style="color:var(--gold)">提交一份</a></div>`;return;}
  c.innerHTML = `<div class="card"><h3>📋 我的病历报告 (${total})</h3>` +
    list.map(rep=>`<div class="row"><span class="label">${(rep.diagnosis||rep.title||'').substring(0,30)}</span><span class="val">${(rep.createdAt||'').substring(0,10)}</span></div>`).join('') +
    `</div>` + _pagerHtml('reports', total);
}

async function renderShop(c){
  const r = await api('/api/shop/products');
  const list = (r&&r.products)||[];
  if(!list.length){c.innerHTML = `<div class="empty">商城暂未开放</div>`;return;}
  c.innerHTML = `<div class="card"><h3>🛍️ 商品列表 (${list.length})</h3>` +
    list.slice(0,20).map(p=>{
      const pid = (p.id||'').replace(/'/g,"’");
      const pname = (p.name||'').replace(/'/g,"’");
      return `<div class="row"><span class="label">${p.name} <small style="color:var(--paper3)">·${p.merchant||''}</small></span><span class="val"><b style="color:var(--gold)">¥${p.price||0}</b> <button class="btn" style="padding:3px 10px;font-size:11px" onclick="_buy('${pid}','${pname}',${p.price||0})" ${token?'':'disabled title="请先登录"'}>购买</button></span></div>`;
    }).join('') +
    `</div>`;
}

// #13 节点 3：购买流程（调 /api/order/create，依赖登录态）
async function _buy(productId, productName, amount){
  if(!token){ toast('请先登录后再购买'); switchTab('profile'); return; }
  if(!confirm(`确认下单：\n\n商品：${productName}\n金额：¥${amount}\n\n继续？`)) return;
  try {
    const r = await api('/api/order/create', { method:'POST', body: JSON.stringify({ productId, productName, amount, merchantId: 0 }) });
    if(r && r.ok){ toast('✅ '+r.message); }
    else { toast('⚠️ 下单失败: '+(r&&r.error||'未知错误')); }
  } catch(e){ toast('⚠️ 网络异常: '+e.message); }
}
window._buy = _buy;

async function renderVoices(c){
  const r = await api('/api/voices');
  if(!r || !r.voices){
    c.innerHTML = `<div class="card"><h3>🎙️ 语音库</h3><p style="color:var(--paper3)">加载失败或语音服务暂不可用。</p></div>`;
    return;
  }
  // 按姓名分组（"晓晓(女声)" / "云扬(男声)" → female / male）
  const groups = { female: [], male: [], neutral: [] };
  r.voices.forEach(v => {
    const name = v.name || v.id || '';
    if(/女声/.test(name)) groups.female.push(v);
    else if(/男声/.test(name)) groups.male.push(v);
    else groups.neutral.push(v);
  });
  const render = v => `
    <div class="row">
      <span class="label">${/女声/.test(v.name||'')?'👩':/男声/.test(v.name||'')?'👨':'🎙️'} ${v.name||v.id}
        <span style="color:var(--paper3);font-size:11px;display:block;margin-top:3px">${v.desc||''}</span>
      </span>
      <span class="val">
        <button class="btn" style="padding:3px 10px;font-size:11px" onclick="_ttsPreview('${v.id}','${(v.name||'').replace(/'/g,"’")}')">▶ 试听</button>
      </span>
    </div>`;
  const groupTitle = {
    female: '👩 女声（温柔 / 明朗 / 知性）',
    male:   '👨 男声（沉稳 / 年轻）',
    neutral:'🎙️ 其他'
  };
  let html = `<div class="card"><h3>🎙️ 语音库</h3><p style="color:var(--paper3);font-size:12px;margin:6px 0 14px">为播报选择喜欢的声线，点击试听体验。</p>`;
  ['female','male','neutral'].forEach(gk => {
    if(!groups[gk].length) return;
    html += `<div style="margin-top:14px;padding-top:10px;border-top:1px solid var(--border)"><h4 style="color:var(--gold);margin:0 0 8px;font-size:14px">${groupTitle[gk]}</h4>`;
    groups[gk].forEach(v => html += render(v));
    html += `</div>`;
  });
  html += `</div>`;
  c.innerHTML = html;
}

async function renderKb(c){
  // 课程列表（节点 #4.12）：辅助展示
  let coursesHtml = '';
  try {
    const cs = await api('/api/courses');
    if(Array.isArray(cs) && cs.length){
      coursesHtml = `<div class="card"><h3>🎓 推荐课程 (${cs.length})</h3>` +
        cs.slice(0,12).map(co=>{
          const master = co.master || '-';
          const title = (co.title||'').slice(0,24);
          const dur = co.duration || '';
          const cat = co.category || '';
          return `<div class="row"><span class="label">${master}·${title}</span><span class="val">${cat}${dur?'·'+dur:''}</span></div>`;
        }).join('') +
        `</div>`;
    } else if(cs && cs.error){
      coursesHtml = '';
    }
  } catch(e){ /* 静默兜底 */ }

  // #13 节点 3：KB 搜索（输入关键字调 /api/public/kb/search?q=...）
  const p = _pg.kb;
  if(p.q){
    const sr = await api('/api/public/kb/search?q='+encodeURIComponent(p.q)+'&limit='+p.limit+'&offset='+p.offset);
    const results = (sr && sr.results) || [];
    c.innerHTML = `<div class="card"><h3>🔍 搜索 “${p.q}” (${results.length})</h3>
      <input id="kbSearchInput" placeholder="搜索关键字（例：肝火、失眠、奇门）" value="${(p.q||'').replace(/"/g,'&quot;')}" style="width:100%;padding:8px;background:var(--ink3);border:1px solid var(--border);border-radius:8px;color:var(--paper);margin-bottom:10px">
      <button class="btn" style="width:100%;margin-bottom:12px" onclick="_kbSearchGo()">搜索</button>
      ${results.length===0?'<div class="empty">无匹配结果</div>':results.map(r=>`<div style="padding:10px;border-bottom:1px solid var(--border);font-size:12px"><div style="color:var(--gold);margin-bottom:4px">${r.module}·${r.title}</div><div style="color:var(--paper3);line-height:1.5">${(r.snippet||'').replace(/</g,'&lt;').substring(0,160)}…</div><div style="color:var(--paper3);font-size:10px;margin-top:4px">trust ${r.trust_score}·hit ${r.hit_count||0}</div></div>`).join('')}
      </div>` + _pagerHtml('kb', sr && sr.total || results.length);
    const inp = document.getElementById('kbSearchInput');
    if(inp){ inp.addEventListener('keydown', e=>{ if(e.key==='Enter') _kbSearchGo(); }); }
    return;
  }

  const r = await api('/api/kb/list');
  if(r.error){
    const fallback = [
      {name:'倪海厦中医课程',modules:34,chars:151135},
      {name:'舒晗奇门遁甲课程',modules:32,chars:151135},
      {name:'中医诊断',modules:'-',chars:'-'},
      {name:'中医名方',modules:'-',chars:'-'},
    ];
    c.innerHTML = `<div class="card"><h3>📚 知识库（${fallback.length} 套）</h3>
      <input id="kbSearchInput" placeholder="搜索关键字（例：肝火、失眠、奇门）" style="width:100%;padding:8px;background:var(--ink3);border:1px solid var(--border);border-radius:8px;color:var(--paper);margin-bottom:10px">
      <button class="btn" style="width:100%;margin-bottom:12px" onclick="_kbSearchGo()">搜索</button>` +
      fallback.map(k=>`<div class="row"><span class="label">${k.name}</span><span class="val">${k.modules} 模块</span></div>`).join('') +
      `</div>` + coursesHtml;
    const inp = document.getElementById('kbSearchInput');
    if(inp){ inp.addEventListener('keydown', e=>{ if(e.key==='Enter') _kbSearchGo(); }); }
    return;
  }
  const list = r.kb || [];
  c.innerHTML = `<div class="card"><h3>📚 知识库（${list.length} 套）</h3>
    <input id="kbSearchInput" placeholder="搜索关键字（例：肝火、失眠、奇门）" style="width:100%;padding:8px;background:var(--ink3);border:1px solid var(--border);border-radius:8px;color:var(--paper);margin-bottom:10px">
    <button class="btn" style="width:100%;margin-bottom:12px" onclick="_kbSearchGo()">搜索</button>` +
    list.map(k=>`<div class="row"><span class="label">${k.name}</span><span class="val">${k.modules||'-'} 模块</span></div>`).join('') +
    `</div>` + coursesHtml;
  const inp = document.getElementById('kbSearchInput');
  if(inp){ inp.addEventListener('keydown', e=>{ if(e.key==='Enter') _kbSearchGo(); }); }
}

// === P15 节点 1：music/lifeindex/lifeplan 三 Tab 跳转独立详情页 ===
async function renderMusic(c){
  const wx = localStorage.getItem('mlbj_ele') || '金';
  const wxEmoji = { '金':'🌟','木':'🌿','水':'💧','火':'🔥','土':'🏔️' };
  const wxLabel = { '金':'锐进果断','木':'生发学习','水':'智慧灵活','火':'热情表达','土':'稳重承担' };
  const items = [
    {icon:'🎵',name:'5 段播放列表',desc:'五行音 × 6 段安排，配合 7 日疗程'},
    {icon:'🌿',name:'同源推荐',desc:'与本五行互补音律，金→听宫'},
    {icon:'📍',name:'五行穴位',desc:'太渊·太冲·太溪·神门·太白'},
    {icon:'📜',name:'7 日疗程',desc:'适应·深化·内化·总结·四阶段递进'},
    {icon:'🔊',name:'Edge-TTS 试听',desc:'总评语音 + 每段独立试听'}
  ];
  c.innerHTML = `<div class="card"><h3>🎵 疗愈音乐</h3>
    <div class="row"><span class="label">五行主属</span><span class="val">${wxEmoji[wx]||'⭐'} ${wx} · ${wxLabel[wx]||'识别中'}</span></div>
    <p style="color:var(--paper3);opacity:.7;font-size:13px;margin:12px 0">根据您的五行主属推荐调合音乐。完成 AI 助手问心后，获得五行×8 维度 50+ 个智能组合。</p>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${items.map(i=>`<div class="row" style="padding:10px;background:var(--ink3);border-radius:8px"><span class="label">${i.icon} ${i.name}</span><span class="val" style="font-size:12px;color:var(--paper3)">${i.desc}</span></div>`).join('')}
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn" href="music-detail.html" style="flex:1;text-decoration:none">🎵 进入独立报告页</a>
      <a class="btn" href="ai-assistant.html?module=music" style="flex:1;text-decoration:none;background:var(--ink3)">🤖 AI 助手重启</a>
    </div>
  </div>`;
}

async function renderLifeindex(c){
  const wx = localStorage.getItem('mlbj_ele') || '金';
  const wxEmoji = { '金':'🌟','木':'🌿','水':'💧','火':'🔥','土':'🏔️' };
  const dims = ['事业','财运','健康','婚姻','学业','家庭','人际','精神','享福','寿元','风物','修养'];
  const icons = { '事业':'💼','财运':'💰','健康':'💪','婚姻':'💑','学业':'📚','家庭':'🏡','人际':'🤝','精神':'🎭','享福':'🌸','寿元':'🍵','风物':'🏔️','修养':'🎋' };
  c.innerHTML = `<div class="card"><h3>📊 生命指数</h3>
    <div class="row"><span class="label">五行主属</span><span class="val">${wxEmoji[wx]||'⭐'} ${wx}</span></div>
    <p style="color:var(--paper3);opacity:.7;font-size:13px;margin:12px 0">12 维度评分（与五行偏重叠加），各维度 30-99 分。完成 AI 助手问心后获得完整报告。</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0">
      ${dims.map(d=>`<div style="padding:8px;background:var(--ink3);border-radius:6px;text-align:center;font-size:12px"><div style="font-size:18px">${icons[d]}</div><div>${d}</div></div>`).join('')}
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn" href="lifeindex-detail.html" style="flex:1;text-decoration:none">📊 进入独立报告页</a>
      <a class="btn" href="ai-assistant.html?module=lifeindex" style="flex:1;text-decoration:none;background:var(--ink3)">🤖 AI 助手重启</a>
    </div>
  </div>`;
}

async function renderLifeplan(c){
  const age = localStorage.getItem('mlbj_age') || '30';
  const stages = [
    {key:'preschool',name:'学龄前',range:'0-6岁',focus:'启蒙·健康·亲子'},
    {key:'school',name:'小学中学',range:'7-17岁',focus:'学习·品德·兴趣'},
    {key:'university',name:'大学',range:'18-23岁',focus:'专业·社交·实践'},
    {key:'career',name:'职场+婚恋',range:'24岁+',focus:'事业·婚恋·财务·健康'}
  ];
  const _age = parseInt(age)||30;
  const curKey = _age <= 6 ? 'preschool' : _age <= 17 ? 'school' : _age <= 23 ? 'university' : 'career';
  c.innerHTML = `<div class="card"><h3>🗺️ 人生规划</h3>
    <div class="row"><span class="label">年龄</span><span class="val">${_age} 岁</span></div>
    <p style="color:var(--paper3);opacity:.7;font-size:13px;margin:12px 0">4 阶段 × 12 领域 = 48 子项模板。当前阶段：<strong style="color:var(--gold)">${stages.find(s=>s.key===curKey).name}</strong>，含 5 年步进 + 10 条行动清单。</p>
    <div style="display:flex;flex-direction:column;gap:6px;margin:10px 0">
      ${stages.map(s=>`<div class="row" style="padding:8px;background:${s.key===curKey?'rgba(201,168,76,.15)':'var(--ink3)'};border-radius:6px"><span class="label">${s.name}</span><span class="val" style="font-size:12px">${s.range} · ${s.focus}</span></div>`).join('')}
    </div>
    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <a class="btn" href="lifeplan-detail.html" style="flex:1;text-decoration:none">🗺️ 进入独立报告页</a>
      <a class="btn" href="ai-assistant.html?module=lifeplan" style="flex:1;text-decoration:none;background:var(--ink3)">🤖 AI 助手重启</a>
    </div>
  </div>`;
}

async function renderKbDash(c){
  c.innerHTML = `<div class="card"><h3>📈 KB 命中率 Dashboard</h3>
    <p style="color:var(--paper3);font-size:12px;margin-bottom:12px">本地浏览器 KB 优先命中统计（localStorage）+ 后端 KB 总规模（API）</p>
    <div id="kbDashBody" class="loading">加载中...</div>
  </div>`;
  // === 本地统计 ===
  const stats = {today:0,total:0,byMod:[],byDay:[]};
  try{
    const td = JSON.parse(localStorage.getItem('_kb_hit_today')||'{}');
    stats.today = (td.date===new Date().toDateString())?(td.count||0):0;
  }catch(e){}
  const modMap = {};
  const today = new Date();
  const recent7 = [];
  for(let i=6;i>=0;i--){
    const d = new Date(today.getTime()-i*86400000);
    const key = '_kb_hit_daily_'+d.toISOString().slice(0,10);
    recent7.push({date:d.toISOString().slice(5,10),count:parseInt(localStorage.getItem(key)||'0'),key});
  }
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(!k) continue;
    if(k==='_kb_hit_today' || k.startsWith('_kb_hit_daily_')) continue;
    if(!k.startsWith('_kb_hit_count/')) continue;
    const sub = k.substring(15);
    if(sub==='_total'){stats.total = parseInt(localStorage.getItem(k)||'0');continue;}
    modMap[sub] = parseInt(localStorage.getItem(k)||'0');
  }
  stats.byMod = Object.entries(modMap).map(([id,cnt])=>({id,count:cnt}))
    .sort((a,b)=>b.count-a.count);
  stats.byDay = recent7;

  // === 后端 KB 总规模 ===
  let kbSize = 0, kbModules = 0;
  try{
    // 尝试多个端点（兼容 public + auth 版本）
    try {
      const r = await fetch(API + '/api/public/kb-stats');
      if(r.ok){
        const j = await r.json();
        const d = j.data || j;
        kbSize = d.formal || d.total || kbSize;
        kbModules = d.models || d.moduleCount || kbModules;
      }
    } catch(e){}
    try {
      const r2 = await fetch(API + '/api/public/kb-list');
      if(r2.ok){
        const j2 = await r2.json();
        const d2 = j2.data || j2;
        const files = d2.files || d2.entries || [];
        if(files.length > kbModules) kbModules = files.length;
      }
    } catch(e){}
  }catch(e){ /* 静默 */ }

  // === 渲染 ===
  const fmt = (n)=> n>=1000 ? (n/1000).toFixed(1).replace(/\.0$/,'')+'K' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g,',');
  const maxDay = Math.max(1, ...stats.byDay.map(d=>d.count));
  const maxMod = Math.max(1, ...stats.byMod.map(m=>m.count));
  const top5 = stats.byMod.slice(0,5);

  const html = `
    <div class="stat-grid" style="grid-template-columns:repeat(3,1fr);margin-bottom:14px">
      <div class="s"><div class="n" style="color:var(--gold)">${fmt(stats.today)}</div><div class="l">今日 KB 直答</div></div>
      <div class="s"><div class="n">${fmt(stats.total)}</div><div class="l">累计命中</div></div>
      <div class="s"><div class="n" style="color:var(--cyan)">${fmt(kbSize)}</div><div class="l">后端 KB 总数</div></div>
    </div>

    <h3 style="font-size:14px;color:var(--gold);margin:18px 0 10px">📊 近 7 日 KB 直答趋势</h3>
    <div style="display:flex;gap:8px;align-items:flex-end;height:120px;background:var(--ink3);padding:14px;border-radius:10px;border:1px solid var(--border);margin-bottom:18px">
      ${stats.byDay.map(d=>{
        const h = Math.max(4, (d.count/maxDay)*92);
        return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">
          <div style="font-size:11px;color:var(--gold);font-weight:600">${d.count||''}</div>
          <div style="width:100%;height:${h}px;background:linear-gradient(180deg,var(--gold) 0%,rgba(201,168,76,.4) 100%);border-radius:4px;transition:all .3s" title="${d.date}: ${d.count}"></div>
          <div style="font-size:10px;color:var(--paper3);opacity:.7">${d.date}</div>
        </div>`;
      }).join('')}
    </div>

    <h3 style="font-size:14px;color:var(--gold);margin:18px 0 10px">🏆 Top 5 模块</h3>
    ${top5.length === 0 ? '<div class="empty">还没有 KB 直答记录 · 去 <a href="ai-assistant.html" style="color:var(--gold)">AI 助手</a> 试试</div>' : `
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:18px">
      ${top5.map((m,i)=>`
        <div class="row" style="padding:10px;background:var(--ink3);border-radius:8px">
          <span class="label"><span style="display:inline-block;width:18px;height:18px;background:${i===0?'var(--gold)':'var(--ink2)'};color:${i===0?'var(--ink)':'var(--gold)'};border-radius:50%;text-align:center;font-size:11px;font-weight:600;line-height:18px">${i+1}</span> ${m.id}</span>
          <span class="val" style="display:flex;align-items:center;gap:8px"><div style="width:80px;height:6px;background:var(--ink2);border-radius:3px;overflow:hidden"><div style="width:${(m.count/maxMod)*100}%;height:100%;background:var(--gold)"></div></div>${fmt(m.count)}</span>
        </div>`).join('')}
    </div>`}

    <h3 style="font-size:14px;color:var(--gold);margin:18px 0 10px">📦 知识库规模</h3>
    <div class="row"><span class="label">后端 KB 总条数</span><span class="val">${fmt(kbSize)}</span></div>
    <div class="row"><span class="label">覆盖模块数</span><span class="val">${fmt(kbModules)}</span></div>
    <div class="row"><span class="label">所有模块（${stats.byMod.length}）总和</span><span class="val">${fmt(stats.byMod.reduce((s,m)=>s+m.count,0))}</span></div>

    <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
      <button class="btn" onclick="resetKbStats()" style="flex:1;background:var(--cinn);border-color:var(--cinn);color:#fff">🗑️ 重置本地统计</button>
      <button class="btn" onclick="exportKbStats()" style="flex:1">📥 导出 JSON</button>
      <a class="btn" href="ai-assistant.html" style="flex:1;text-decoration:none;background:var(--ink3);text-align:center;display:inline-block">🤖 去 AI 助手</a>
    </div>

    <h3 style="font-size:14px;color:var(--gold);margin:18px 0 10px">🔗 KB 全门户</h3>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
      <a href="kb-quality.html" class="btn" style="text-decoration:none;padding:14px;background:linear-gradient(135deg,rgba(201,168,76,.15),rgba(201,168,76,.05));border:1px solid rgba(201,168,76,.25);text-align:left">
        <div style="font-size:13px;color:var(--gold);font-weight:600">📊 质量审计</div>
        <div style="font-size:11px;color:var(--paper3);margin-top:2px">所有模块 trust · 等级 · 修复</div>
      </a>
      <a href="kb-coverage.html" class="btn" style="text-decoration:none;padding:14px;background:linear-gradient(135deg,rgba(34,211,238,.12),rgba(34,211,238,.04));border:1px solid rgba(34,211,238,.2);text-align:left">
        <div style="font-size:13px;color:var(--cyan);font-weight:600">🗺️ 覆盖审计</div>
        <div style="font-size:11px;color:var(--paper3);margin-top:2px">AI 29 × KB 54 映射</div>
      </a>
      <a href="kb-hit-dashboard.html" class="btn" style="text-decoration:none;padding:14px;background:linear-gradient(135deg,rgba(16,185,129,.12),rgba(16,185,129,.04));border:1px solid rgba(16,185,129,.2);text-align:left">
        <div style="font-size:13px;color:#10b981;font-weight:600">⚡ 命中看板</div>
        <div style="font-size:11px;color:var(--paper3);margin-top:2px">趋势 · 模块排行 · CSV</div>
      </a>
      <a href="kb-graph.html" class="btn" style="text-decoration:none;padding:14px;background:linear-gradient(135deg,rgba(168,85,247,.12),rgba(168,85,247,.04));border:1px solid rgba(168,85,247,.2);text-align:left">
        <div style="font-size:13px;color:#a855f7;font-weight:600">🔮 KB 图谱</div>
        <div style="font-size:11px;color:var(--paper3);margin-top:2px">模块关联网络图</div>
      </a>
    </div>
    </div>
  `;
  document.getElementById('kbDashBody').innerHTML = html;
}

function resetKbStats(){
  if(!confirm('确定重置本地 KB 命中统计？此操作不可恢复。'))return;
  const ks = [];
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(k && (k.startsWith('_kb_hit_count/') || k==='_kb_hit_today')) ks.push(k);
  }
  ks.forEach(k=>localStorage.removeItem(k));
  toast('已重置本地 KB 统计');
  const cur = document.querySelector('.tab.on');
  if(cur) loadTab(cur.dataset.tab);
}

function exportKbStats(){
  const data = {
    exportAt: new Date().toISOString(),
    today: (()=>{try{const td=JSON.parse(localStorage.getItem('_kb_hit_today')||'{}');return td.date===new Date().toDateString()?td.count:0;}catch(e){return 0;}})(),
    total: (()=>{for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);if(k==='_kb_hit_count/_total'){return parseInt(localStorage.getItem(k)||'0');}}return 0;})(),
    byMod: {},
    byDay: {}
  };
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    if(!k) continue;
    if(k.startsWith('_kb_hit_count/') && !k.endsWith('_total')){
      data.byMod[k.substring(15)] = parseInt(localStorage.getItem(k)||'0');
    } else if(k.startsWith('_kb_hit_daily_')){
      data.byDay[k.substring(15)] = parseInt(localStorage.getItem(k)||'0');
    }
  }
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kb-stats-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast('已导出 JSON');
}

// #13 节点 3：KB 搜索触发
function _kbSearchGo(){
  const inp = document.getElementById('kbSearchInput');
  const v = (inp && inp.value || '').trim();
  _pg.kb.q = v;
  _pg.kb.offset = 0;
  loadTab('kb');
}
window._kbSearchGo = _kbSearchGo;

async function login(){
  const phone = document.getElementById('phone').value.trim();
  if(phone.length<11){toast('手机号不正确');return;}
  const r = await api('/api/user/login', {method:'POST', body:JSON.stringify({phone})});
  if(r && r.token){token=r.token;localStorage.setItem('mlbj_token',token);toast('登录成功');loadTab('profile');}
  else{toast((r&&r.error)||'登录失败');}
}

function logout(){localStorage.removeItem('mlbj_token');token='';loadTab('profile');toast('已退出');}

// 绑定 tabs
document.querySelectorAll('.tab').forEach(t=>t.addEventListener('click',()=>switchTab(t.dataset.tab)));

// 启动
loadTab('profile');



// ml-tab ↔ switchTab 桥接（兼容旧 onclick 与自定义 switchTab）
(function(){
  const mlTab = document.getElementById('yuanzhuTab');
  if (!mlTab) return;
  const labels = ['profile','yuanzhu','push','points','reports','shop','kb','voices','music','lifeindex','lifeplan'];
  mlTab.addEventListener('tab-change', (e)=>{
    const name = labels[e.detail.index] || 'profile';
    if (typeof switchTab === 'function') switchTab(name);
  });
})();
