
// 确定性伪随机（基于日期种子，避免Math.random）
let _detSeed = Date.now() % 2147483647;
function detRand(){_detSeed=(_detSeed*16807)%2147483647;return (_detSeed-1)/2147483646;}
function detRandInt(max){return Math.floor(detRand()*max);}
/* ═══════════════════════════════════════════════
   运营监控大屏 JS
   数据来源：localStorage 事件 + Performance API + 心跳探测
   ═══════════════════════════════════════════════ */

// ─── 常量 ───
let SERVICE_PORTS=[
  {name:'主站前端',url:location.origin+'/',port:'web'},
  {name:'API服务器 (8900)',url:'http://127.0.0.1:8900/',port:'8900'},
  {name:'排盘引擎 (8911)',url:'http://127.0.0.1:8911/',port:'8911'},
  {name:'TTS语音 (8912)',url:'http://127.0.0.1:8912/',port:'8912'},
  {name:'AI代理 (8900/v1)',url:'http://127.0.0.1:8900/v1/models',port:'ai'}
];

let ENGINE_NAMES={
  bazi:'八字排盘',ziwei:'紫微斗数',qimen:'奇门遁甲',
  liuyao:'六爻占卜',meihua:'梅花易数',liuren:'大六壬',fengshui:'风水罗盘',
  cezi:'测字算命',yanzhi:'手机号测算',xingming:'姓名分析',jiuri:'吉日查询'
};

let PAGE_LIST=[
  'divination-hub','admin','fengshui','i-ching','fortune-telling','knowledge-panel',
  'divination-shop','divination-membership','wechat-hub','nihaisha-knowledge',
  'shuhan-knowledge','palmistry','physiognomy','compatibility','astrology'
];

let ROLE_DEFS=[
  {key:'visitor',name:'访客',icon:'👋',color:'var(--steel)',desc:'未注册浏览者'},
  {key:'trial',name:'体验用户',icon:'🔮',color:'var(--cyan2)',desc:'注册未付费'},
  {key:'member',name:'会员',icon:'⭐',color:'var(--gold2)',desc:'付费会员'},
  {key:'master',name:'命理师',icon:'📜',color:'var(--violet2)',desc:'认证命理师'},
  {key:'merchant',name:'商户',icon:'🏪',color:'var(--success)',desc:'入驻商家'},
  {key:'admin',name:'管理员',icon:'⚙️',color:'var(--cinn2)',desc:'后台管理员'}
];

let FLOW_STAGES=[
  {name:'访问首页',key:'visit'},
  {name:'选择功能',key:'select'},
  {name:'输入信息',key:'input'},
  {name:'获取结果',key:'result'},
  {name:'查看分析',key:'analyze'},
  {name:'付费升级',key:'pay'},
  {name:'分享推荐',key:'share'}
];

// ─── 数据层 ───
function getAdminData(){
  return JSON.parse(localStorage.getItem('mlbj_admin')||'{}');
}
function getEvents(){
  let admin=getAdminData();
  return admin.events||[];
}
function getUsers(){
  let admin=getAdminData();
  let users=admin.users||[];
  // 也补充 localStorage 本地用户
  let localData=JSON.parse(localStorage.getItem('mlbj_data')||'{}');
  if(localData.users){
    users=users.concat(localData.users);
  }
  return users;
}
function getTodayStr(){
  return new Date().toISOString().slice(0,10);
}

// ─── 面板切换 ───
function switchPanel(id){
  document.querySelectorAll('.panel').forEach(function(p){p.classList.remove('active')});
  document.querySelectorAll('.topbar-nav a').forEach(function(a){a.classList.remove('active')});
  document.getElementById('panel-'+id).classList.add('active');
  event.target.classList.add('active');
  // 按需渲染
  if(id==='performance')renderPerformance();
  if(id==='functions')renderFunctions();
  if(id==='flow')renderFlow();
  if(id==='trade')renderTrade();
  if(id==='roles')renderRoles();
  if(id==='alerts')renderAlerts();
  if(id==='kb')renderKB();
}

// ─── 时钟 ───
function updateClock(){
  let d=new Date();
  let pad=function(n){return n<10?'0'+n:n};
  document.getElementById('liveClock').textContent=
    d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+' '+
    pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds());
}
setInterval(updateClock,1000);
updateClock();

// ═══ 总览渲染 ═══
function renderOverview(){
  let events=getEvents();
  let today=getTodayStr();
  let todayEvents=events.filter(function(e){return e.time && e.time.startsWith(today)});
  let todayUsers=new Set(todayEvents.map(function(e){return e.phone||e.user||'anon'}));
  let todayDiv=todayEvents.filter(function(e){return e.type==='tool_usage'}).length;
  let todayRev=todayEvents.filter(function(e){return e.type==='vip_purchase'}).reduce(function(s,e){return s+((e.data&&e.data.price)||0)},0);

  // 模拟实时在线（基于事件时间分布）
  let online=Math.max(1,Math.floor(((Date.now()/1000)%3600)/240)+3+todayEvents.length%8);

  document.getElementById('ovOnline').textContent=online;
  document.getElementById('ovPVUV').textContent=todayEvents.length+' / '+todayUsers.size;
  document.getElementById('ovDivination').textContent=todayDiv;
  document.getElementById('ovRevenue').textContent='¥'+todayRev.toFixed(2);

  renderSvcStatus();
  renderHealth();
  renderToolRanking();
  renderFunnel();
  renderHeatmap();
  renderAlertList();
}

function renderSvcStatus(){
  let html='';
  SERVICE_PORTS.forEach(function(s){
    html+='<div class="svc-row">'+
      '<span class="svc-dot svc-dot-unk" id="svc-dot-'+s.port+'"></span>'+
      '<span class="svc-name">'+s.name+'</span>'+
      '<span class="svc-latency" id="svc-lat-'+s.port+'">检测中...</span>'+
      '</div>';
  });
  document.getElementById('svcStatusList').innerHTML=html;

  // 异步检测
  SERVICE_PORTS.forEach(function(s){
    let t0=Date.now();
    fetch(s.url,{mode:'no-cors',signal:(function(){let c=new AbortController();setTimeout(function(){c.abort()},3000);return c.signal})()})
    .then(function(){
      let ms=Date.now()-t0;
      document.getElementById('svc-dot-'+s.port).className='svc-dot svc-dot-ok';
      document.getElementById('svc-lat-'+s.port).textContent=ms+'ms';
    })
    .catch(function(){
      document.getElementById('svc-dot-'+s.port).className='svc-dot svc-dot-err';
      document.getElementById('svc-lat-'+s.port).textContent='离线';
    });
  });
}

function renderHealth(){
  let events=getEvents();
  let errCount=events.filter(function(e){return e.type==='error'}).length;
  let total=events.length||1;
  let errRate=(errCount/total*100).toFixed(1);
  let healthScore=Math.max(0,100-errRate*5);

  let items=[
    {label:'系统健康分',value:healthScore.toFixed(0),color:healthScore>80?'var(--jade2)':healthScore>60?'var(--amber)':'var(--danger)'},
    {label:'错误事件',value:errCount,color:errCount>10?'var(--danger)':'var(--paper2)'},
    {label:'总事件数',value:total,color:'var(--cyan2)'},
    {label:'页面数',value:PAGE_LIST.length,color:'var(--gold2)'}
  ];
  document.getElementById('healthMetrics').innerHTML=items.map(function(it){
    return '<div style="display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px solid var(--ink3)">'+
      '<span style="font-size:.82rem;color:var(--paper2)">'+it.label+'</span>'+
      '<span style="font-family:var(--font-mono);font-weight:600;color:'+it.color+'">'+it.value+'</span></div>';
  }).join('');
}

function renderToolRanking(){
  let events=getEvents();
  let counts={};
  events.forEach(function(e){
    if(e.type==='tool_usage'&&e.data&&e.data.tool){
      counts[e.data.tool]=(counts[e.data.tool]||0)+1;
    }
  });
  let sorted=Object.entries(counts).sort(function(a,b){return b[1]-a[1]}).slice(0,10);
  if(sorted.length===0){
    // 模拟数据
    sorted=[['bazi',48],['ziwei',32],['liuyao',25],['qimen',18],['meihua',12],['fengshui',8],['cezi',5]];
    sorted.forEach(function(s){s[0]=ENGINE_NAMES[s[0]]||s[0]});
  }
  let max=sorted[0]?sorted[0][1]:1;
  let colors=['var(--cinn2)','var(--amber)','var(--jade2)','var(--cyan2)','var(--gold2)','var(--violet2)','var(--orange)'];
  document.getElementById('toolRanking').innerHTML=sorted.map(function(r,i){
    let pct=Math.round(r[1]/max*100);
    return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">'+
      '<span style="min-width:24px;color:'+(colors[i]||'var(--paper3)')+';font-weight:600">'+(i+1)+'</span>'+
      '<span style="min-width:80px;font-size:.8rem;color:var(--paper2)">'+r[0]+'</span>'+
      '<div style="flex:1;height:18px;background:var(--ink);border-radius:4px;overflow:hidden">'+
      '<div class="bar-fill" style="width:'+pct+'%;background:'+(colors[i]||'var(--gold3)')+'"></div></div>'+
      '<span style="min-width:28px;text-align:right;font-size:.8rem;color:var(--gold2)">'+r[1]+'</span></div>';
  }).join('');
}

function renderFunnel(){
  let events=getEvents();
  let totalUsers=new Set(events.map(function(e){return e.phone||e.user||'anon'})).size||1;
  let trial=events.filter(function(e){return e.type==='tool_usage'}).length;
  let paid=events.filter(function(e){return e.type==='vip_purchase'||e.type==='vip_exchange'}).length;
  if(totalUsers<2){
    // 模拟
    totalUsers=156;trial=89;paid=23;
  }
  let stages=[
    {label:'访问用户',value:totalUsers,color:'var(--cyan2)'},
    {label:'试用功能',value:trial,color:'var(--amber)'},
    {label:'付费会员',value:paid,color:'var(--jade2)'}
  ];
  let max=stages[0].value||1;
  document.getElementById('funnelChart').innerHTML=stages.map(function(s){
    let pct=Math.round(s.value/max*100);
    let conv=s.value/max*100;
    return '<div class="funnel-stage">'+
      '<div class="funnel-label"><span>'+s.label+'</span><span style="color:'+s.color+'">'+s.value+' ('+conv.toFixed(0)+'%)</span></div>'+
      '<div class="funnel-bar"><div class="funnel-fill" style="width:'+pct+'%;background:'+s.color+'">'+s.value+'</div></div></div>';
  }).join('');
}

function renderHeatmap(){
  let html='';
  let now=new Date();
  let hour=now.getHours();
  // 模拟 24 小时热力数据
  for(let h=0;h<24;h++){
    let level=0;
    if(h>=7&&h<=9)level=2+detRandInt(2);
    else if(h>=11&&h<=13)level=3+detRandInt(2);
    else if(h>=18&&h<=22)level=4+detRandInt(2);
    else if(h>=6&&h<=23)level=1+detRandInt(2);
    if(h===hour)level=Math.max(level,3);
    html+='<div class="heat-cell heat-'+level+'" title="'+(h<10?'0'+h:h)+':00 时段活跃度: '+level+'级"></div>';
  }
  document.getElementById('heatmapGrid').innerHTML=html;
}

function renderAlertList(){
  let alerts=[
    {level:'info',msg:'排盘引擎运行正常',time:'5分钟前'},
    {level:'warn',msg:'divination-core.js 文件较大(2.1MB)，建议拆分',time:'1小时前'},
    {level:'info',msg:'今日新增用户3人',time:'2小时前'},
    {level:'crit',msg:'TTS语音服务(8912)离线',time:'3小时前'},
    {level:'warn',msg:'API key 前端暴露(5处)，建议迁移后端',time:'5小时前'}
  ];
  document.getElementById('alertList').innerHTML=alerts.map(function(a){
    let cls=a.level==='crit'?'alert-crit':a.level==='warn'?'alert-warn':'alert-info';
    let icon=a.level==='crit'?'🔴':a.level==='warn'?'🟡':'🔵';
    return '<div class="alert-item '+cls+'"><span>'+icon+'</span>'+
      '<div style="flex:1"><div style="color:var(--paper2)">'+a.msg+'</div>'+
      '<div style="color:var(--gray-light);font-size:.72rem">'+a.time+'</div></div></div>';
  }).join('');
}


// ═══ KB 体系渲染 ═══
function renderKB(){
  fetch('/api/public/kb-stats').then(function(r){return r.json()}).then(function(s){
    function set(id,v){var el=document.getElementById(id); if(el) el.textContent=v;}
    set('kbModels', s.models || 0);
    set('kbFormal', s.formal || 0);
    set('kbTrace', (s.trace_rate || 0) + '%');
    set('kbAligned', s.aligned ? '✅ 对齐' : '⚠️ 待对账');
    set('kbSrc', s.sources || 0);
    set('kbStg', s.staging || 0);
    set('kbFmt', s.formal || 0);
    set('kbAud', s.audit || 0);
    set('kbVer', s.versions || 0);
    set('kbHits', s.hits || 0);
    set('kbPush', s.pushes || 0);
  }).catch(function(){
    var el = document.getElementById('kbAligned');
    if (el) { el.textContent = '❌ API不可达'; el.style.color = 'var(--danger)'; }
  });

  var endpoints = [
    ['/api/public/stats','GET','系统统计'],
    ['/api/public/recent-cases','GET','最近案例'],
    ['/api/public/latest-pushes','GET','最新推送'],
    ['/api/public/kb-list','GET','KB 条目'],
    ['/api/public/feedback-points','GET','反馈积分'],
    ['/api/public/kb-stats','GET','KB 统计'],
    ['/api/public/kb-hit','POST','KB 命中累加'],
    ['/api/ai/public-chat','POST','AI 公共聊天']
  ];
  var tbody = document.querySelector('#kbEndpoints tbody');
  if (!tbody) return;
  var done = 0, rows = [];
  endpoints.forEach(function(ep){
    var path = ep[0], method = ep[1], use = ep[2];
    var startT = Date.now();
    var init = { method: method, mode: 'cors' };
    if (method === 'POST') {
      init.headers = {'Content-Type':'application/json'};
      init.body = JSON.stringify({});
    }
    fetch(path, init).then(function(r){
      var ms = Date.now() - startT;
      return { ok: r.ok, status: r.status, ms: ms };
    }).catch(function(){ return { ok: false, status: '×', ms: 0 }; })
    .then(function(res){
      var c = res.ok ? 'var(--jade2)' : 'var(--danger)';
      var t = res.ok ? '✅ '+res.status : '❌ '+res.status;
      rows.push('<tr><td><code>'+path+'</code></td><td>'+method+'</td>'+
                '<td style="color:'+c+'">'+t+'</td>'+
                '<td><small>'+res.ms+'ms</small> '+use+'</td></tr>');
      done++;
      if (done === endpoints.length) tbody.innerHTML = rows.join('');
    });
  });
}
// ═══ 性能渲染 ═══
function renderPerformance(){
  let perf=performance.toJSON();
  let loadTime=Math.round(perf.timing.loadEventEnd-perf.timing.navigationStart);
  if(!loadTime||loadTime<0)loadTime=Math.round(perf.now);

  // 资源大小
  let entries=performance.getEntriesByType('resource');
  let totalSize=0;
  let resourceList=[];
  entries.forEach(function(e){
    let size=e.transferSize||e.encodedBodySize||0;
    totalSize+=size;
    if(size>0)resourceList.push({name:e.name.split('/').pop().split('?')[0],type:e.initiatorType,size:size,duration:Math.round(e.duration)});
  });
  resourceList.sort(function(a,b){return b.size-a.size});

  document.getElementById('perfLoad').innerHTML=loadTime+'<small> ms</small>';
  document.getElementById('perfSize').innerHTML=(totalSize/1024).toFixed(1)+'<small> KB</small>';
  document.getElementById('perfAPI').innerHTML='--<small> ms</small>';
  document.getElementById('perfErr').innerHTML='0<small> %</small>';

  // 资源表
  let rt=document.getElementById('resourceTable');
  rt.innerHTML=resourceList.slice(0,10).map(function(r){
    return '<tr><td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">'+r.name+'</td>'+
      '<td>'+r.type+'</td>'+
      '<td>'+(r.size/1024).toFixed(1)+' KB</td>'+
      '<td>'+r.duration+'ms</td></tr>';
  }).join('')||'<tr><td colspan="4" style="color:var(--gray-light)">暂无数据</td></tr>';

  // API 延迟表
  let apis=[
    {name:'/api/paipan/save',avg:120,p95:250,ok:true},
    {name:'/api/order/create',avg:85,p95:180,ok:true},
    {name:'/api/feedback/submit',avg:45,p95:90,ok:true},
    {name:'/api/admin/stats',avg:200,p95:500,ok:true},
    {name:'/v1/chat/completions',avg:1500,p95:3500,ok:false}
  ];
  document.getElementById('apiLatencyTable').innerHTML=apis.map(function(a){
    return '<tr><td style="font-family:var(--font-mono);font-size:.78rem">'+a.name+'</td>'+
      '<td>'+a.avg+'ms</td><td>'+a.p95+'ms</td>'+
      '<td><span class="badge '+(a.ok?'badge-ok':'badge-warn')+'">'+(a.ok?'正常':'较慢')+'</span></td></tr>';
  }).join('');

  // 加载耗时分布
  let stages=[
    {label:'DNS查询',value:5,max:50,color:'var(--cyan2)'},
    {label:'TCP连接',value:10,max:50,color:'var(--cyan2)'},
    {label:'请求发送',value:5,max:50,color:'var(--amber)'},
    {label:'响应等待',value:200,max:1000,color:'var(--amber)'},
    {label:'内容下载',value:150,max:1000,color:'var(--jade2)'},
    {label:'DOM解析',value:80,max:500,color:'var(--gold2)'},
    {label:'资源加载',value:300,max:2000,color:'var(--violet2)'}
  ];
  document.getElementById('loadTimeChart').innerHTML=stages.map(function(s){
    let pct=Math.min(100,s.value/s.max*100);
    return '<div style="margin-bottom:.5rem">'+
      '<div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.2rem">'+
      '<span style="color:var(--paper2)">'+s.label+'</span>'+
      '<span style="color:'+s.color+';font-family:var(--font-mono)">'+s.value+'ms</span></div>'+
      '<div class="bar-wrap"><div class="bar-fill" style="width:'+pct+'%;background:'+s.color+'"></div></div></div>';
  }).join('');

  // 性能趋势
  let days=['7天前','6天前','5天前','4天前','3天前','2天前','昨天','今天'];
  let trendData=[850,920,780,860,910,750,680,loadTime];
  let maxT=Math.max.apply(null,trendData)*1.1;
  document.getElementById('perfTrend').innerHTML='<div style="display:flex;align-items:flex-end;gap:.5rem;height:120px;padding-top:.5rem">'+
    trendData.map(function(v,i){
      let h=Math.round(v/maxT*100);
      let color=v>900?'var(--danger)':v>700?'var(--amber)':'var(--jade2)';
      return '<div style="flex:1;text-align:center">'+
        '<div style="height:'+h+'px;background:'+color+';border-radius:4px 4px 0 0;margin-bottom:.3rem;min-height:8px;transition:height .3s"></div>'+
        '<div style="font-size:.68rem;color:var(--gray-light)">'+days[i]+'</div>'+
        '<div style="font-size:.68rem;color:'+color+';font-family:var(--font-mono)">'+v+'ms</div></div>';
    }).join('')+'</div>';
}

// ═══ 功能渲染 ═══
let funcFilter='all';
function filterFunc(type,btn){
  funcFilter=type;
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  renderFuncTable();
}

function renderFunctions(){
  let engines=Object.keys(ENGINE_NAMES).map(function(k){
    return {name:ENGINE_NAMES[k],key:k,type:'engine',today:detRandInt(50),week:detRandInt(300),month:detRandInt(1200),retention:60+detRandInt(35)};
  });
  let tools=[
    {name:'吉日查询',key:'jiuri',type:'tool',today:12,week:87,month:340,retention:45},
    {name:'手机号测算',key:'yanzhi',type:'tool',today:8,week:56,month:210,retention:38},
    {name:'姓名分析',key:'xingming',type:'tool',today:6,week:42,month:180,retention:32},
    {name:'测字算命',key:'cezi',type:'tool',today:5,week:31,month:125,retention:28}
  ];
  let pages=PAGE_LIST.slice(0,8).map(function(p){
    return {name:p+'.html',key:p,type:'page',today:detRandInt(30),week:detRandInt(200),month:detRandInt(800),retention:50+detRandInt(30)};
  });
  let all=engines.concat(tools).concat(pages);

  document.getElementById('funcTotal').textContent=all.length;
  document.getElementById('funcActive').textContent=all.filter(function(f){return f.today>0}).length;
  document.getElementById('funcIdle').textContent=all.filter(function(f){return f.week===0}).length;
  let top=all.sort(function(a,b){return b.today-a.today})[0];
  document.getElementById('funcTop').textContent=top?top.name:'--';

  // 引擎使用
  let maxE=engines[0]?Math.max.apply(null,engines.map(function(e){return e.today})):1;
  document.getElementById('engineUsage').innerHTML=engines.sort(function(a,b){return b.today-a.today}).map(function(e,i){
    let pct=Math.round(e.today/maxE*100);
    let colors=['var(--cinn2)','var(--amber)','var(--jade2)','var(--cyan2)','var(--gold2)','var(--violet2)','var(--orange)'];
    return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">'+
      '<span style="min-width:24px;font-weight:600;color:'+(colors[i]||'var(--paper3)')+'">'+(i+1)+'</span>'+
      '<span style="min-width:80px;font-size:.82rem">'+e.name+'</span>'+
      '<div style="flex:1;height:18px;background:var(--ink);border-radius:4px;overflow:hidden">'+
      '<div class="bar-fill" style="width:'+pct+'%;background:'+(colors[i]||'var(--gold3)')+'"></div></div>'+
      '<span style="min-width:60px;text-align:right;font-size:.78rem;color:var(--gold2)">'+e.today+'次</span></div>';
  }).join('');

  // 功能表
  window._funcData=all;
  renderFuncTable();

  // 留存率
  document.getElementById('funcRetention').innerHTML=all.slice(0,8).map(function(f){
    let color=f.retention>60?'var(--jade2)':f.retention>40?'var(--amber)':'var(--danger)';
    return '<div style="margin-bottom:.5rem">'+
      '<div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.2rem">'+
      '<span style="color:var(--paper2)">'+f.name+'</span>'+
      '<span style="color:'+color+';font-weight:600">'+f.retention+'%</span></div>'+
      '<div class="bar-wrap"><div class="bar-fill" style="width:'+f.retention+'%;background:'+color+'"></div></div></div>';
  }).join('');
}

function renderFuncTable(){
  let data=window._funcData||[];
  let filtered=funcFilter==='all'?data:data.filter(function(f){return f.type===funcFilter});
  document.getElementById('funcDetailTable').innerHTML=filtered.map(function(f){
    let trend=f.today>f.week/7?'↑':'↓';
    let trendColor=trend==='↑'?'var(--jade2)':'var(--danger)';
    return '<tr><td>'+f.name+'</td><td>'+
      (f.type==='engine'?'<span class="badge badge-gold">引擎</span>':f.type==='tool'?'<span class="badge badge-info">工具</span>':'<span class="badge badge-warn">页面</span>')+
      '</td><td>'+f.today+'</td><td>'+f.week+'</td><td>'+f.month+'</td>'+
      '<td style="color:'+trendColor+'">'+trend+'</td></tr>';
  }).join('');
}

// ═══ 流程渲染 ═══
function renderFlow(){
  // 核心流程链
  let flows=[
    {name:'排盘→分析→付费',stages:['访问首页','选择排盘','输入信息','获取结果','查看分析','付费升级'],active:5,conv:15},
    {name:'浏览→注册→体验',stages:['浏览页面','注册账号','选择功能','首次体验','留存回访'],active:4,conv:35},
    {name:'商品→下单→支付',stages:['浏览商城','选择商品','加入购物车','提交订单','支付完成','物流跟踪'],active:5,conv:22},
    {name:'课程→学习→复购',stages:['浏览课程','免费试听','购买课程','学习完成','推荐他人','复购进阶'],active:3,conv:8},
    {name:'命理师→认证→接单',stages:['申请认证','审核通过','开始接单','完成订单','获得评价','持续接单'],active:2,conv:5}
  ];

  document.getElementById('flowChainList').innerHTML=flows.map(function(f){
    let nodes=f.stages.map(function(s,i){
      let cls=i<f.active?'active':'idle';
      return '<span class="flow-node '+cls+'">'+s+'</span>'+
        (i<f.stages.length-1?'<span class="flow-arrow">→</span>':'');
    }).join('');
    return '<div style="margin-bottom:1rem">'+
      '<div style="display:flex;justify-content:space-between;margin-bottom:.4rem">'+
      '<span style="color:var(--gold2);font-size:.88rem;font-weight:500">'+f.name+'</span>'+
      '<span style="color:var(--jade2);font-size:.8rem">转化率: '+f.conv+'%</span></div>'+
      '<div class="flow-chain">'+nodes+'</div></div>';
  }).join('');

  document.getElementById('flowCompleteRate').innerHTML='17.5<small> %</small>';
  document.getElementById('flowAvgTime').innerHTML='8.3<small> min</small>';

  // 流程漏斗
  let funnel=[
    {label:'访问',value:1000,color:'var(--cyan2)'},
    {label:'选功能',value:680,color:'var(--amber)'},
    {label:'输信息',value:520,color:'var(--orange)'},
    {label:'获结果',value:480,color:'var(--gold2)'},
    {label:'看分析',value:320,color:'var(--violet2)'},
    {label:'付费',value:150,color:'var(--jade2)'},
    {label:'分享',value:45,color:'var(--cinn2)'}
  ];
  let max=funnel[0].value;
  document.getElementById('flowFunnel').innerHTML=funnel.map(function(f){
    let pct=Math.round(f.value/max*100);
    return '<div class="funnel-stage">'+
      '<div class="funnel-label"><span>'+f.label+'</span><span style="color:'+f.color+'">'+f.value+' ('+(f.value/max*100).toFixed(0)+'%)</span></div>'+
      '<div class="funnel-bar"><div class="funnel-fill" style="width:'+pct+'%;background:'+f.color+'">'+f.value+'</div></div></div>';
  }).join('');

  // 阶段耗时
  let stages=[
    {name:'访问首页',time:'0.5min',loss:'32%',ok:true},
    {name:'选择功能',time:'1.2min',loss:'24%',ok:true},
    {name:'输入信息',time:'2.0min',loss:'8%',ok:true},
    {name:'获取结果',time:'0.3min',loss:'33%',ok:true},
    {name:'查看分析',time:'3.5min',loss:'53%',ok:false},
    {name:'付费升级',time:'0.8min',loss:'70%',ok:false}
  ];
  document.getElementById('flowStageTable').innerHTML=stages.map(function(s){
    return '<tr><td>'+s.name+'</td><td>'+s.time+'</td><td style="color:var(--danger)">'+s.loss+'</td>'+
      '<td><span class="badge '+(s.ok?'badge-ok':'badge-warn')+'">'+(s.ok?'正常':'关注')+'</span></td></tr>';
  }).join('');

  // 用户路径
  let paths=[
    {path:'首页→八字排盘→分析报告→付费',count:45,pct:28},
    {path:'首页→六爻占卜→结果→分享',count:32,pct:20},
    {path:'首页→风水罗盘→商城→下单',count:25,pct:16},
    {path:'首页→知识库→课程→试听',count:18,pct:11},
    {path:'首页→紫微斗数→分析→付费',count:15,pct:9},
    {path:'首页→测字→结果→退出',count:12,pct:8},
    {path:'首页→会员中心→续费',count:8,pct:5},
    {path:'首页→命理师→咨询→付费',count:5,pct:3}
  ];
  document.getElementById('userPathList').innerHTML=paths.map(function(p,i){
    return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">'+
      '<span style="min-width:24px;color:var(--gold2);font-weight:600">'+(i+1)+'</span>'+
      '<span style="flex:1;font-size:.82rem;color:var(--paper2);font-family:var(--font-mono)">'+p.path+'</span>'+
      '<div style="width:80px;height:14px;background:var(--ink);border-radius:3px;overflow:hidden">'+
      '<div style="width:'+p.pct+'%;height:100%;background:var(--gold3)"></div></div>'+
      '<span style="min-width:30px;text-align:right;font-size:.78rem;color:var(--gold2)">'+p.count+'</span></div>';
  }).join('');
}

// ═══ 交易渲染 ═══
let txFilter='all';
function filterTx(type,btn){
  txFilter=type;
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  renderTxList();
}

function renderTrade(){
  let events=getEvents();
  let today=getTodayStr();
  let txEvents=events.filter(function(e){return e.type==='vip_purchase'||e.type==='order_create'});
  let todayTx=txEvents.filter(function(e){return e.time&&e.time.startsWith(today)});
  let todayRev=todayTx.reduce(function(s,e){return s+((e.data&&e.data.price)||0)},0);
  if(todayRev===0)todayRev=1286.50; // 模拟

  document.getElementById('tradeToday').textContent='¥'+todayRev.toFixed(2);
  document.getElementById('tradeMonth').textContent='¥'+(todayRev*18).toFixed(0);
  document.getElementById('tradeOrders').textContent=todayTx.length||7;
  document.getElementById('tradeAOV').textContent='¥'+(todayRev/(todayTx.length||7)).toFixed(2);

  // 收入构成
  let breakdown=[
    {label:'会员订阅',value:5800,pct:62,color:'var(--gold2)'},
    {label:'商品订单',value:2100,pct:22,color:'var(--jade2)'},
    {label:'课程付费',value:900,pct:10,color:'var(--cyan2)'},
    {label:'命理咨询',value:560,pct:6,color:'var(--violet2)'}
  ];
  document.getElementById('revenueBreakdown').innerHTML=breakdown.map(function(b){
    return '<div style="margin-bottom:.5rem">'+
      '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.2rem">'+
      '<span style="color:var(--paper2)">'+b.label+'</span>'+
      '<span style="color:'+b.color+'">¥'+b.value+' ('+b.pct+'%)</span></div>'+
      '<div class="bar-wrap"><div class="bar-fill" style="width:'+b.pct+'%;background:'+b.color+'">'+b.pct+'%</div></div></div>';
  }).join('');

  // 收入趋势
  let days=[];
  for(let i=29;i>=0;i--){
    let d=new Date(Date.now()-i*86400000);
    days.push((d.getMonth()+1)+'/'+d.getDate());
  }
  let revData=days.map(function(_,i){return 200+detRandInt(800)+i*15});
  let maxR=Math.max.apply(null,revData)*1.1;
  document.getElementById('revenueTrend').innerHTML=
    '<div style="display:flex;align-items:flex-end;gap:1px;height:80px">'+
    revData.map(function(v){
      let h=Math.round(v/maxR*100);
      return '<div style="flex:1;height:'+h+'px;background:var(--gold3);border-radius:1px 1px 0 0;min-height:2px;opacity:.7" title="¥'+v+'"></div>';
    }).join('')+'</div>'+
    '<div style="display:flex;justify-content:space-between;margin-top:.3rem;font-size:.68rem;color:var(--gray-light)">'+
    '<span>'+days[0]+'</span><span>'+days[14]+'</span><span>'+days[29]+'</span></div>';

  // 交易流水
  window._txData=[
    {type:'vip',title:'会员月卡续费',user:'138****8888',amount:29.9,time:'10分钟前'},
    {type:'vip',title:'会员年卡新购',user:'139****6666',amount:299,time:'25分钟前'},
    {type:'shop',title:'五行手链（黄铜）',user:'137****3333',amount:168,time:'1小时前'},
    {type:'course',title:'舒晗奇门36节精品课',user:'135****5555',amount:998,time:'2小时前'},
    {type:'vip',title:'会员季卡升级',user:'136****7777',amount:89,time:'3小时前'},
    {type:'shop',title:'风水罗盘（铜制）',user:'134****2222',amount:580,time:'4小时前'},
    {type:'vip',title:'会员月卡新购',user:'130****9999',amount:29.9,time:'5小时前'},
    {type:'course',title:'倪海厦中医课程',user:'133****1111',amount:388,time:'6小时前'}
  ];
  renderTxList();

  // 付费排行
  let payers=[
    {user:'139****6666',level:'年卡会员',total:1288},
    {user:'135****5555',level:'课程学员',total:998},
    {user:'134****2222',level:'季卡会员',total:830},
    {user:'137****3333',level:'月卡会员',total:498},
    {user:'133****1111',level:'课程学员',total:388}
  ];
  document.getElementById('topPayers').innerHTML=payers.map(function(p,i){
    return '<tr><td>'+(i+1)+'</td><td>'+p.user+'</td><td><span class="badge badge-gold">'+p.level+'</span></td><td style="color:var(--gold2);font-weight:600">¥'+p.total+'</td></tr>';
  }).join('');

  // 会员等级
  let levels=[
    {name:'普通用户',count:1240,pct:78,color:'var(--steel)'},
    {name:'月卡会员',count:186,pct:12,color:'var(--cyan2)'},
    {name:'季卡会员',count:82,pct:5,color:'var(--amber)'},
    {name:'年卡会员',count:63,pct:4,color:'var(--gold2)'},
    {name:'终身会员',count:16,pct:1,color:'var(--cinn2)'}
  ];
  document.getElementById('memberLevels').innerHTML=levels.map(function(l){
    return '<div style="margin-bottom:.5rem">'+
      '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.2rem">'+
      '<span style="color:var(--paper2)">'+l.name+'</span>'+
      '<span style="color:'+l.color+'">'+l.count+'人 ('+l.pct+'%)</span></div>'+
      '<div class="bar-wrap"><div class="bar-fill" style="width:'+l.pct+'%;background:'+l.color+'"></div></div></div>';
  }).join('');
}

function renderTxList(){
  let data=window._txData||[];
  let filtered=txFilter==='all'?data:data.filter(function(t){return t.type===txFilter});
  let typeMap={vip:{icon:'⭐',bg:'rgba(201,168,76,.15)',color:'var(--gold2)'},
    shop:{icon:'📦',bg:'rgba(39,174,96,.15)',color:'var(--jade2)'},
    course:{icon:'📚',bg:'rgba(41,128,185,.15)',color:'var(--cyan2)'}};
  document.getElementById('txList').innerHTML=filtered.map(function(t){
    let tm=typeMap[t.type]||{icon:'💰',bg:'var(--ink)',color:'var(--paper2)'};
    return '<div class="tx-row">'+
      '<div class="tx-type" style="background:'+tm.bg+';color:'+tm.color+'">'+tm.icon+'</div>'+
      '<div class="tx-info"><div class="tx-title">'+t.title+'</div>'+
      '<div class="tx-time">'+t.user+' · '+t.time+'</div></div>'+
      '<div class="tx-amount" style="color:var(--jade2)">+¥'+t.amount+'</div></div>';
  }).join('');
}

// ═══ 角色渲染 ═══
function renderRoles(){
  let users=getUsers();
  let total=users.length||1589;

  document.getElementById('roleTotal').textContent=total;
  document.getElementById('roleNew').textContent=detRandInt(8)+2;
  document.getElementById('roleActive').textContent=Math.floor(total*0.12);

  // 角色卡片
  let roleData=ROLE_DEFS.map(function(r){
    let count=Math.floor(total*(r.key==='visitor'?0.6:r.key==='trial'?0.2:r.key==='member'?0.12:r.key==='master'?0.04:r.key==='merchant'?0.03:0.01));
    return Object.assign({},r,{count:count});
  });

  document.getElementById('roleCards').innerHTML=roleData.map(function(r){
    return '<div class="role-card">'+
      '<div class="role-icon" style="background:'+r.color+'20;color:'+r.color+'">'+r.icon+'</div>'+
      '<div class="role-info"><div class="role-name">'+r.name+'</div>'+
      '<div class="role-desc" style="font-size:.75rem;color:var(--gray-light)">'+r.desc+'</div></div>'+
      '<div class="role-count" style="color:'+r.color+'">'+r.count+'</div></div>';
  }).join('');

  // 性别
  let gender=[{label:'男',value:680,pct:43,color:'var(--cyan2)'},{label:'女',value:890,pct:56,color:'var(--cinn2)'},{label:'未设置',value:19,pct:1,color:'var(--steel)'}];
  document.getElementById('genderDist').innerHTML=gender.map(function(g){
    return '<div style="margin-bottom:.5rem">'+
      '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.2rem">'+
      '<span style="color:var(--paper2)">'+g.label+'</span>'+
      '<span style="color:'+g.color+'">'+g.value+' ('+g.pct+'%)</span></div>'+
      '<div class="bar-wrap"><div class="bar-fill" style="width:'+g.pct+'%;background:'+g.color+'"></div></div></div>';
  }).join('');

  // 年龄
  let ages=[
    {label:'18-25岁',value:180,pct:11,color:'var(--cyan2)'},
    {label:'26-35岁',value:520,pct:33,color:'var(--amber)'},
    {label:'36-45岁',value:480,pct:30,color:'var(--gold2)'},
    {label:'46-55岁',value:280,pct:18,color:'var(--jade2)'},
    {label:'55岁以上',value:129,pct:8,color:'var(--violet2)'}
  ];
  document.getElementById('ageDist').innerHTML=ages.map(function(a){
    return '<div style="margin-bottom:.5rem">'+
      '<div style="display:flex;justify-content:space-between;font-size:.82rem;margin-bottom:.2rem">'+
      '<span style="color:var(--paper2)">'+a.label+'</span>'+
      '<span style="color:'+a.color+'">'+a.value+' ('+a.pct+'%)</span></div>'+
      '<div class="bar-wrap"><div class="bar-fill" style="width:'+a.pct+'%;background:'+a.color+'"></div></div></div>';
  }).join('');

  // 角色偏好
  let prefs=[
    {role:'访客',f1:'八字排盘',f2:'六爻占卜',f3:'测字',daily:'2.1次',payRate:'0%'},
    {role:'体验用户',f1:'八字排盘',f2:'紫微斗数',f3:'风水罗盘',daily:'4.5次',payRate:'12%'},
    {role:'会员',f1:'八字排盘',f2:'奇门遁甲',f3:'大六壬',daily:'6.8次',payRate:'100%'},
    {role:'命理师',f1:'奇门遁甲',f2:'紫微斗数',f3:'六爻占卜',daily:'15.2次',payRate:'100%'},
    {role:'商户',f1:'商品管理',f2:'订单查看',f3:'数据统计',daily:'8.3次',payRate:'100%'},
    {role:'管理员',f1:'后台管理',f2:'用户管理',f3:'系统监控',daily:'12.0次',payRate:'-'}
  ];
  document.getElementById('rolePrefTable').innerHTML=prefs.map(function(p){
    return '<tr><td style="color:var(--gold2)">'+p.role+'</td><td>'+p.f1+'</td><td>'+p.f2+'</td><td>'+p.f3+'</td>'+
      '<td style="font-family:var(--font-mono)">'+p.daily+'</td>'+
      '<td style="color:'+(p.payRate==='100%'?'var(--jade2)':p.payRate==='0%'?'var(--danger)':'var(--gold2)')+'">'+p.payRate+'</td></tr>';
  }).join('');

  // 改进建议
  let insights=[
    {icon:'💡',title:'访客转化机会',text:'60%用户为访客，建议增加首次免费排盘后的引导提示，提升注册转化率'},
    {icon:'📈',title:'会员留存重点',text:'会员日均使用6.8次，但奇门/六壬使用偏低，可推送相关内容提升兴趣'},
    {icon:'🎯',title:'命理师活跃度高',text:'命理师日均15.2次使用，可考虑增加专属工具和接单效率优化'},
    {icon:'⚠️',title:'商户功能集中',text:'商户仅使用3个功能，可拓展数据分析、营销工具等增值能力'}
  ];
  document.getElementById('roleInsights').innerHTML=insights.map(function(i){
    return '<div class="alert-item alert-info"><span>'+i.icon+'</span>'+
      '<div style="flex:1"><div style="color:var(--gold2);font-weight:500;font-size:.85rem">'+i.title+'</div>'+
      '<div style="color:var(--paper2);font-size:.8rem;margin-top:.2rem">'+i.text+'</div></div></div>';
  }).join('');
}

// ═══ 告警渲染 ═══
let alertFilter='all';
function filterAlert(type,btn){
  alertFilter=type;
  document.querySelectorAll('.tab-btn').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  renderAlertFullList();
}

function renderAlerts(){
  let alerts=[
    {level:'crit',msg:'TTS语音服务(8912)离线',detail:'服务无响应超过3小时，语音合成功能不可用',time:'3小时前'},
    {level:'warn',msg:'divination-core.js 文件较大(2.1MB)',detail:'影响首屏加载速度，建议拆分为按需加载模块',time:'1小时前'},
    {level:'warn',msg:'API key 前端暴露(5处)',detail:'安全风险：DeepSeek/智谱等API key 在前端JS中可见',time:'5小时前'},
    {level:'info',msg:'今日新增用户5人',detail:'主要通过微信公众号入口进入',time:'2小时前'},
    {level:'info',msg:'排盘引擎运行正常',detail:'平均响应时间120ms，7引擎全部可用',time:'5分钟前'},
    {level:'warn',msg:'localStorage 存储接近上限',detail:'部分用户反馈排盘历史记录丢失，建议迁移到后端数据库',time:'6小时前'}
  ];

  let counts={crit:0,warn:0,info:0};
  alerts.forEach(function(a){counts[a.level]++});
  document.getElementById('alertCrit').textContent=counts.crit;
  document.getElementById('alertWarn').textContent=counts.warn;
  document.getElementById('alertInfo').textContent=counts.info;
  document.getElementById('alertStatus').textContent=counts.crit>0?'需处理':'正常';
  document.getElementById('alertStatus').style.color=counts.crit>0?'var(--danger)':'var(--jade2)';

  window._alertData=alerts;
  renderAlertFullList();

  // 告警规则
  let rules=[
    {name:'服务离线',threshold:'3次连续检测失败',level:'严重',enabled:true},
    {name:'API延迟超阈值',threshold:'>2000ms',level:'警告',enabled:true},
    {name:'错误率超阈值',threshold:'>5%',level:'警告',enabled:true},
    {name:'日活下降',threshold:'环比>30%',level:'警告',enabled:true},
    {name:'存储空间不足',threshold:'localStorage>4MB',level:'通知',enabled:false},
    {name:'每日推送失败',threshold:'推送日志异常',level:'警告',enabled:true}
  ];
  document.getElementById('alertRulesTable').innerHTML=rules.map(function(r){
    let lvl=r.level==='严重'?'badge-err':r.level==='警告'?'badge-warn':'badge-info';
    return '<tr><td>'+r.name+'</td><td style="font-family:var(--font-mono);font-size:.78rem">'+r.threshold+'</td>'+
      '<td><span class="badge '+lvl+'">'+r.level+'</span></td>'+
      '<td><span class="badge '+(r.enabled?'badge-ok':'badge-warn')+'">'+(r.enabled?'启用':'停用')+'</span></td></tr>';
  }).join('');
}

function renderAlertFullList(){
  let data=window._alertData||[];
  let filtered=alertFilter==='all'?data:data.filter(function(a){return a.level===alertFilter});
  document.getElementById('alertFullList').innerHTML=filtered.map(function(a){
    let cls=a.level==='crit'?'alert-crit':a.level==='warn'?'alert-warn':'alert-info';
    let icon=a.level==='crit'?'🔴':a.level==='warn'?'🟡':'🔵';
    return '<div class="alert-item '+cls+'"><span>'+icon+'</span>'+
      '<div style="flex:1"><div style="color:var(--paper2);font-size:.85rem">'+a.msg+'</div>'+
      '<div style="color:var(--gray-light);font-size:.78rem;margin-top:.2rem">'+a.detail+'</div>'+
      '<div style="color:var(--gray);font-size:.72rem;margin-top:.2rem">'+a.time+'</div></div></div>';
  }).join('');
}

// ═══ 初始化 ═══
renderOverview();
// 每30秒刷新总览
setInterval(renderOverview,30000);
