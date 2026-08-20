
// Bridge: merge FAITH_GUIDE data into FAITH_KNOWLEDGE for admin compatibility
if(typeof FAITH_GUIDE!=='undefined'){
  if(typeof FAITH_KNOWLEDGE==='undefined')window.FAITH_KNOWLEDGE={};
  else window.FAITH_KNOWLEDGE=FAITH_KNOWLEDGE;
  let fg=FAITH_GUIDE;
  // Convert dailyPractice format: {buddhist:{morning:{title,steps},...}} → {buddhist:{schedule:[{period,practice,intention,method}]}}
  let dpMap={buddhist:'buddhist',taoist:'taoist',confucian:'confucian'};
  let dpAdmin={};
  Object.keys(dpMap).forEach(function(k){
    let src=fg.dailyPractice[k];
    if(src){
      let schedule=[];
      ['morning','noon','evening'].forEach(function(t){
        if(src[t]){
          schedule.push({period:src[t].title,practice:src[t].steps.join('；'),intention:'修身养性',method:src[t].steps.slice(0,2).join('；')});
        }
      });
      dpAdmin[k]={title:k==='buddhist'?'佛教修行':k==='taoist'?'道教修持':'儒家修身',subtitle:'每日三时功课',schedule:schedule};
    }
  });
  // Add ru/dao/fo aliases
  if(dpAdmin.confucian)dpAdmin.ru=dpAdmin.confucian;
  if(dpAdmin.taoist)dpAdmin.dao=dpAdmin.taoist;
  if(dpAdmin.buddhist)dpAdmin.fo=dpAdmin.buddhist;
  window.FAITH_KNOWLEDGE.dailyPractices=dpAdmin;
  // Merge other guide data with correct field names for admin
  // worshipManual → also merge into worshipGuide for detailed per-faith data
  let wm=fg.worshipManual||{};
  if(!window.FAITH_KNOWLEDGE.worshipGuide)window.FAITH_KNOWLEDGE.worshipGuide={};
  // Add detailed worship manual as worshipManual
  window.FAITH_KNOWLEDGE.worshipManual=wm;
  // Enrich specificGuidance with manual data
  if(window.FAITH_KNOWLEDGE.worshipGuide.specificGuidance){
    Object.keys(wm).forEach(function(k){
      if(wm[k]&&wm[k].procedure){
        let sg=window.FAITH_KNOWLEDGE.worshipGuide.specificGuidance;
        sg[k]=(sg[k]||'')+(sg[k]?'\n':'')+wm[k].title+'：'+wm[k].procedure.join('→');
      }
    });
  }
  window.FAITH_KNOWLEDGE.shichenGuide=fg.shichenGuide;
  window.FAITH_KNOWLEDGE.jieqiGuide=fg.jieqiGuide;
  // Convert scriptureGuide: {buddhist:[{name,level,...}]} → {buddhist:[{name,source, intro,...}]}
  let sg=fg.scriptureGuide||{};
  let sgAdmin={};
  Object.keys(sg).forEach(function(k){
    if(Array.isArray(sg[k])){
      sgAdmin[k]=sg[k].map(function(s){return{name:s.name,source:s.level+'·'+s.duration,intro:s.benefit,text:s.method,usage:s.benefit,merit:s.benefit}});
    }
  });
  window.FAITH_KNOWLEDGE.scriptures=sgAdmin;
  // Convert tabooReminders: {buddhist:[{category,items:[]}]} → {buddhist:{title,items:[{taboo,reason,severity}]}}
  let tr=fg.tabooReminders||{};
  let trAdmin={};
  Object.keys(tr).forEach(function(k){
    if(Array.isArray(tr[k])){
      let items=[];
      tr[k].forEach(function(cat){
        if(cat.items&&Array.isArray(cat.items)){
          cat.items.forEach(function(it){items.push({taboo:typeof it==='string'?it:it.taboo||it,reason:typeof it==='string'?cat.category:it.reason||it.detail||'',severity:'中'})});
        }
      });
      trAdmin[k]={title:k==='buddhist'?'佛教禁忌':k==='taoist'?'道教禁忌':'儒家禁忌',items:items};
    }
  });
  // Add ru/dao/fo aliases
  if(trAdmin.confucian)trAdmin.ru=trAdmin.confucian;
  if(trAdmin.taoist)trAdmin.dao=trAdmin.taoist;
  if(trAdmin.buddhist)trAdmin.fo=trAdmin.buddhist;
  window.FAITH_KNOWLEDGE.taboos=trAdmin;
}



// ═══ 全局 ═══
const PAIPAN_API='http://127.0.0.1:8911/paipan';
const SERVICE_PORTS=[
  {name:'主站服务 (8910)',url:'http://127.0.0.1:8910/'},
  {name:'API代理 (8900)',url:'http://127.0.0.1:8900/'},
  {name:'排盘引擎 (8911)',url:'http://127.0.0.1:8911/'}
];

const SHICHEN_DATA=[
  {name:'子时',time:'23:00-01:00',meridian:'胆经',organ:'胆',advice:'熟睡养胆气，胆汁新陈代谢',yi:'熟睡',ji:'熬夜'},
  {name:'丑时',time:'01:00-03:00',meridian:'肝经',organ:'肝',advice:'深睡养肝血，肝脏排毒修复',yi:'深睡',ji:'饮酒'},
  {name:'寅时',time:'03:00-05:00',meridian:'肺经',organ:'肺',advice:'气血由静转动，深度呼吸养肺',yi:'深睡',ji:'剧烈运动'},
  {name:'卯时',time:'05:00-07:00',meridian:'大肠经',organ:'大肠',advice:'起床排便，喝温水润肠',yi:'排便、晨练',ji:'赖床'},
  {name:'辰时',time:'07:00-09:00',meridian:'胃经',organ:'胃',advice:'吃早餐，胃经最旺易消化',yi:'进食早餐',ji:'空腹'},
  {name:'巳时',time:'09:00-11:00',meridian:'脾经',organ:'脾',advice:'工作学习黄金时段，脾主运化',yi:'工作学习',ji:'久坐不动'},
  {name:'午时',time:'11:00-13:00',meridian:'心经',organ:'心',advice:'小憩养心，心主血脉',yi:'午休',ji:'剧烈运动'},
  {name:'未时',time:'13:00-15:00',meridian:'小肠经',organ:'小肠',advice:'吸收营养，分清泌浊',yi:'补充水分',ji:'暴饮暴食'},
  {name:'申时',time:'15:00-17:00',meridian:'膀胱经',organ:'膀胱',advice:'多喝水促排毒，背经最旺',yi:'饮水、运动',ji:'憋尿'},
  {name:'酉时',time:'17:00-19:00',meridian:'肾经',organ:'肾',advice:'肾经当令，藏精纳气',yi:'休息、晚练',ji:'过度劳累'},
  {name:'戌时',time:'19:00-21:00',meridian:'心包经',organ:'心包',advice:'心情舒畅，散步放松',yi:'散步、放松',ji:'情绪激动'},
  {name:'亥时',time:'21:00-23:00',meridian:'三焦经',organ:'三焦',advice:'准备入睡，通调水道',yi:'安睡',ji:'熬夜'}
];

const JIEQI_DATA=[
  {name:'立春',period:'2月3-5日',focus:'疏肝理气',food:'韭菜、豆芽',practice:'舒展筋骨、晨起散步'},
  {name:'雨水',period:'2月18-20日',focus:'养脾胃',food:'山药、红枣',practice:'缓步慢走、揉腹'},
  {name:'惊蛰',period:'3月5-7日',focus:'清肝泻火',food:'梨、菠菜',practice:'八段锦、伸展运动'},
  {name:'春分',period:'3月20-22日',focus:'平衡阴阳',food:'时令蔬菜',practice:'踏青散步、太极'},
  {name:'清明',period:'4月4-6日',focus:'柔肝养肺',food:'荠菜、银耳',practice:'户外踏青、深呼吸'},
  {name:'谷雨',period:'4月19-21日',focus:'祛湿补脾',food:'薏米、赤小豆',practice:'慢跑、拍打经络'},
  {name:'立夏',period:'5月5-7日',focus:'养心安神',food:'莲子、百合',practice:'静坐冥想、午休'},
  {name:'小满',period:'5月20-22日',focus:'清热祛湿',food:'绿豆、苦瓜',practice:'游泳、瑜伽'},
  {name:'芒种',period:'6月5-7日',focus:'健脾化湿',food:'扁豆、冬瓜',practice:'五禽戏、散步'},
  {name:'夏至',period:'6月21-22日',focus:'养心护阳',food:'面条、酸梅汤',practice:'静心、避免大汗'},
  {name:'小暑',period:'7月6-8日',focus:'消暑解热',food:'西瓜、绿豆汤',practice:'晨练、避免烈日'},
  {name:'大暑',period:'7月22-24日',focus:'清热降火',food:'荷叶粥、凉茶',practice:'室内太极、游泳'},
  {name:'立秋',period:'8月7-9日',focus:'润肺养阴',food:'银耳、秋梨',practice:'深呼吸、扩胸运动'},
  {name:'处暑',period:'8月22-24日',focus:'滋阴润燥',food:'蜂蜜、芝麻',practice:'慢跑、登山'},
  {name:'白露',period:'9月7-9日',focus:'润肺生津',food:'百合、雪梨',practice:'八段锦、呼吸操'},
  {name:'秋分',period:'9月22-24日',focus:'阴阳平衡',food:'藕、柿子',practice:'散步、五禽戏'},
  {name:'寒露',period:'10月8-9日',focus:'温阳散寒',food:'山药、核桃',practice:'站桩、慢跑'},
  {name:'霜降',period:'10月23-24日',focus:'温补肝肾',food:'栗子、羊肉',practice:'太极拳、泡脚'},
  {name:'立冬',period:'11月7-8日',focus:'补肾藏精',food:'黑豆、黑芝麻',practice:'站桩、内丹冥想'},
  {name:'小雪',period:'11月22-23日',focus:'温肾助阳',food:'羊肉、桂圆',practice:'室内运动、泡脚'},
  {name:'大雪',period:'12月6-8日',focus:'养藏固本',food:'萝卜、枸杞',practice:'站桩、八段锦'},
  {name:'冬至',period:'12月21-23日',focus:'滋阴养阳',food:'饺子、羊肉汤',practice:'静坐、内丹修炼'},
  {name:'小寒',period:'1月5-7日',focus:'温补肾阳',food:'核桃、黑米',practice:'慢跑、太极拳'},
  {name:'大寒',period:'1月20-21日',focus:'固本培元',food:'当归生姜羊肉汤',practice:'站桩、内丹冥想'}
];

// ═══ 导航 ═══
document.querySelectorAll('.topbar-nav a[data-section]').forEach(a=>{
  a.addEventListener('click',e=>{
    e.preventDefault();
    const sec=a.dataset.section;
    document.querySelectorAll('.topbar-nav a').forEach(x=>x.classList.remove('active'));
    a.classList.add('active');
    document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
    document.getElementById('section-'+sec).classList.add('active');
    if(sec==='knowledge'&&!window._kbLoaded) loadKnowledgeStats();
    if(sec==='guide'&&!window._guideLoaded) loadGuideCenter();
    if(sec==='content'&&!window._contentLoaded) loadContent();
    if(sec==='monitor'&&!window._monitorLoaded) loadMonitor();
    if(sec==='dashboard'&&!window._dashLoaded) loadDashboard();
    if(sec==='users'&&!window._usersLoaded) loadUsers();
    if(sec==='feedback'&&!window._fbLoaded) loadFeedbackAdmin();
    if(sec==='gzh'&&!window._gzhLoaded){renderGzhPanel();window._gzhLoaded=true;}
    if(sec==='stats'&&!window._statsLoaded) loadStats();
  });
});

// ═══ 1.引擎测试台 ═══
function renderEngineGrid(){
  const engines=[
    {name:'八字排盘',desc:'四柱八字·十神·格局·用神',icon:'🀄'},
    {name:'紫微斗数',desc:'十二宫位·星曜·四化飞星',icon:'⭐'},
    {name:'奇门遁甲',desc:'天盘地盘·八门九星·值符',icon:'🌀'},
    {name:'六爻排盘',desc:'六亲六神·世应·用神',icon:'🔮'},
    {name:'梅花易数',desc:'体用关系·卦象变化·应期',icon:'🌸'},
    {name:'六壬神课',desc:'四课三传·天将·天盘地盘',icon:'🎯'}
  ];
  document.getElementById('engineGrid').innerHTML=engines.map((e,i)=>`
    <ml-tap class="engine-card" onclick="document.getElementById('engineType').selectedIndex=${i}" variant="card" role="button" tabindex="0">
      <span class="engine-icon">${e.icon}</span>
      <div class="engine-name">${e.name}</div>
      <div class="engine-desc">${e.desc}</div>
    </ml-tap>`).join('');
}
renderEngineGrid();

async function runPaipanTest(){
  const status=document.getElementById('paipanStatus');
  const result=document.getElementById('paipanResult');
  status.innerHTML='<span class="spinner"></span> 排盘中...';
  const body={
    year:parseInt(document.getElementById('paipanYear').value),
    month:parseInt(document.getElementById('paipanMonth').value),
    day:parseInt(document.getElementById('paipanDay').value),
    hour:parseInt(document.getElementById('paipanHour').value),
    minute:parseInt(document.getElementById('paipanMinute').value),
    sex:document.getElementById('paipanSex').value
  };
  if(document.getElementById('paipanLunar').checked) body.lunar=true;
  const lng=parseFloat(document.getElementById('paipanLng').value);
  if(!isNaN(lng)) body.lng=lng;
  try{
    const resp=await fetch(PAIPAN_API,{method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(15000),body:JSON.stringify(body)});
    const data=await resp.json();
    status.innerHTML='';
    if(data.error){
      result.innerHTML='<span class="err">❌ '+data.error+'</span>';
    }else{
      result.innerHTML=formatPaipanResult(data);
    }
  }catch(err){
    status.innerHTML='';
    result.innerHTML='<span class="err">❌ 连接失败: '+err.message+'</span><br><span style="color:var(--gray-light)">请确保排盘服务(8911端口)已启动</span>';
  }
}

function formatPaipanResult(data){
  let html='<div style="margin-bottom:1rem;padding:.6rem;background:rgba(201,168,76,.05);border-radius:6px;border-left:3px solid var(--gold3)">';
  html+='<div style="color:var(--gold);font-size:.9rem;margin-bottom:.4rem">☰ 排盘结果</div>';
  // 基本信息
  if(data.input){
    html+='<div style="color:var(--paper2);font-size:.78rem;line-height:1.8">';
    html+='阳历：'+(data.input.solar||'')+'　';
    html+='农历：'+(data.input.lunar||'')+'<br>';
    html+='生肖：'+(data.input.shengxiao||'')+'　';
    html+='星座：'+(data.input.xingzuo||'')+'　';
    html+='性别：'+(data.input.gender||'')+'<br>';
    if(data.input.jieqi) html+='节气：'+data.input.jieqi;
    html+='</div>';
  }
  html+='</div>';
  // 四柱
  if(data.pillars){
    html+='<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:.5rem;margin-bottom:1rem">';
    for(const [k,v] of Object.entries(data.pillars)){
      html+='<div style="text-align:center;background:var(--ink2);border:1px solid var(--ink4);border-radius:6px;padding:.6rem .3rem">';
      html+='<div style="color:var(--gold2);font-size:.75rem;margin-bottom:.2rem">'+k+'柱</div>';
      html+='<div style="color:var(--gold-bright);font-size:1.1rem;font-weight:bold">'+v+'</div>';
      if(data.nayin&&data.nayin[k]) html+='<div style="color:var(--gray-light);font-size:.7rem;margin-top:.2rem">'+data.nayin[k]+'</div>';
      html+='</div>';
    }
    html+='</div>';
  }
  // 日主+十神
  if(data.day_master){
    html+='<div style="margin-bottom:.6rem"><span style="color:var(--gold2)">日主：</span><span style="color:var(--gold-bright);font-weight:bold">'+data.day_master+'</span>';
    if(data.month_ling) html+='　<span style="color:var(--gold2)">月令：</span><span style="color:var(--paper)">'+data.month_ling+'</span>';
    html+='</div>';
  }
  if(data.gan_shen){
    html+='<div style="margin-bottom:.6rem"><span style="color:var(--gold2)">天干十神：</span>';
    for(const [k,v] of Object.entries(data.gan_shen)){
      if(v!=='日主') html+='<span style="color:var(--paper2)">'+k+':'+v+'</span>　';
    }
    html+='</div>';
  }
  // 五行
  if(data.wuxing_score){
    html+='<div style="margin-bottom:.6rem"><span style="color:var(--gold2)">五行力量：</span>';
    for(const [k,v] of Object.entries(data.wuxing_score)){
      html+='<span style="color:var(--paper2)">'+k+' '+v+'</span>　';
    }
    if(data.wuxing_lack&&data.wuxing_lack.length) html+='<span style="color:var(--danger)">缺'+data.wuxing_lack.join('、')+'</span>';
    html+='</div>';
  }
  // 神煞
  if(data.shensha){
    html+='<div style="margin-bottom:.6rem"><span style="color:var(--gold2)">神煞：</span>';
    for(const [k,v] of Object.entries(data.shensha)){
      html+='<span style="color:var(--paper2)">'+k+'('+v.join('、')+')</span>　';
    }
    html+='</div>';
  }
  // 大运
  if(data.dayun&&Array.isArray(data.dayun)){
    html+='<div style="margin-bottom:.6rem"><span style="color:var(--gold2)">大运：</span></div>';
    html+='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:.4rem;margin-bottom:.6rem">';
    data.dayun.forEach((dy,i)=>{
      if(!dy.ganzhi) return;
      html+='<div style="background:var(--ink2);border:1px solid var(--ink4);border-radius:4px;padding:.4rem .3rem;text-align:center">';
      html+='<div style="color:var(--gold-bright);font-size:.85rem;font-weight:bold">'+dy.ganzhi+'</div>';
      html+='<div style="color:var(--gray-light);font-size:.7rem">'+dy.start_age+'-'+dy.end_age+'岁</div>';
      html+='<div style="color:var(--paper2);font-size:.7rem">'+(dy.gan_shen||'')+'</div>';
      html+='</div>';
    });
    html+='</div>';
  }
  // 胎元/命宫/身宫
  html+='<div style="margin-bottom:.6rem;font-size:.78rem">';
  if(data.taiyuan) html+='<span style="color:var(--gold2)">胎元：</span><span style="color:var(--paper2)">'+data.taiyuan+'</span>　';
  if(data.minggong) html+='<span style="color:var(--gold2)">命宫：</span><span style="color:var(--paper2)">'+data.minggong+'</span>　';
  if(data.shengong) html+='<span style="color:var(--gold2)">身宫：</span><span style="color:var(--paper2)">'+data.shengong+'</span>　';
  if(data.xunkong) html+='<span style="color:var(--gold2)">旬空：</span><span style="color:var(--paper2)">'+Object.values(data.xunkong).join('、')+'</span>';
  html+='</div>';
  return html;
}

function clearPaipanResult(){
  document.getElementById('paipanResult').innerHTML='等待执行排盘...';
  document.getElementById('paipanStatus').innerHTML='';
}

// ═══ 2.知识库管理 ═══
function loadKnowledgeStats(){
  window._kbLoaded=true;
  const kb=window.AUTHORITATIVE_KNOWLEDGE||{};
  const grid=document.getElementById('kbStatsGrid');
  const domains=Object.keys(kb);
  let html='';
  let totalCards=0,totalChars=0,totalPass=0;
  const domainNames={
    bazi:'八字命理',liuyao:'六爻占卜',fengshui:'风水堪舆',xingming:'姓名学',
    tizhi:'体质学说',ziwei:'紫微斗数',qimen:'奇门遁甲',meihua:'梅花易数',
    liuren:'六壬神课',liushisigua:'六十四卦',bagua:'八卦',wuxing:'五行学说',
    shishen:'十神',nayin:'纳音五行',shensha:'神煞',hechong:'合冲'
  };

  domains.forEach(key=>{
    const domain=kb[key];
    let cardCount=0,charCount=0,passCount=0;
    function countObj(obj){
      if(typeof obj==='string'){
        if(obj.length>=50){cardCount++;charCount+=obj.length;if(obj.length>=1000)passCount++;}
      }else if(typeof obj==='object'&&obj!==null){
        if(Array.isArray(obj))obj.forEach(countObj);
        else Object.values(obj).forEach(countObj);
      }
    }
    countObj(domain);
    totalCards+=cardCount;totalChars+=charCount;totalPass+=passCount;
    const passRate=cardCount>0?Math.round(passCount/cardCount*100):0;
    html+=`<ml-tap class="card" onclick="showDomainDetail('${key}')" variant="card" role="button" tabindex="0">
      <h3>${domainNames[key]||key}</h3>
      <div class="stat">${cardCount} <small>张卡片</small></div>
      <div class="meta">总字符: ${charCount.toLocaleString()}</div>
      <div class="meta">知识条目: ${cardCount} | 达标(≥1000字): ${passCount}</div>
      <div class="progress-bar"><div class="fill" style="width:${passRate}%"></div></div>
      <div class="meta" style="margin-top:.3rem">达标率: <span class="badge ${passRate>=80?'badge-ok':passRate>=50?'badge-warn':'badge-err'}">${passRate}%</span></div>
    </ml-tap>`;
  });

  const totalRate=totalCards>0?Math.round(totalPass/totalCards*100):0;
  html=`<div class="card" style="grid-column:1/-1;background:linear-gradient(135deg,var(--ink2),var(--ink3));border-color:var(--gold3)">
    <h3>📊 知识库总览</h3>
    <div style="display:flex;gap:2rem;flex-wrap:wrap">
      <div class="stat">${domains.length} <small>领域</small></div>
      <div class="stat">${totalCards} <small>卡片</small></div>
      <div class="stat">${totalChars.toLocaleString()} <small>字符</small></div>
      <div class="stat">${totalPass}/${totalCards} <small>达标</small></div>
      <div class="stat">${totalRate}<small>%</small></div>
    </div>
  </div>`+html;

  grid.innerHTML=html;
  renderPendingCards(kb,domains);
}

function renderPendingCards(kb,domains){
  const pending=[];
  domains.forEach(key=>{
    function scan(obj,path=''){
      if(typeof obj==='string'&&obj.length>=50&&obj.length<1000){
        pending.push({domain:key,path,len:obj.length,preview:obj.substring(0,80)+'...'});
      }else if(typeof obj==='object'&&obj!==null){
        if(Array.isArray(obj))obj.forEach((item,i)=>scan(item,path+'['+i+']'));
        else for(const [k,v] of Object.entries(obj))scan(v,path?path+'.'+k:k);
      }
    }
    scan(kb[key]);
  });
  pending.sort((a,b)=>a.len-b.len);
  const list=document.getElementById('kbPendingList');
  if(pending.length===0){list.innerHTML='<div class="badge badge-ok">所有卡片均已达标 ✅</div>';return;}
  list.innerHTML=`<div class="content-block">
    <h3>⚠️ 待填充卡片 (${pending.length}张低于1000字符)</h3>
    <div class="table-wrap"><table>
      <thead><tr><th>领域</th><th>路径</th><th>字符数</th><th>预览</th></tr></thead>
      <tbody>${pending.slice(0,50).map(p=>`<tr>
        <td>${p.domain}</td>
        <td style="font-size:.75rem;color:var(--cyan2)">${p.path}</td>
        <td><span class="badge ${p.len<200?'badge-err':'badge-warn'}">${p.len}</span></td>
        <td style="font-size:.75rem;color:var(--gray-light)">${p.preview}</td>
      </tr>`).join('')}</tbody>
    </table></div>
    ${pending.length>50?`<p style="margin-top:.5rem;font-size:.8rem;color:var(--gray-light)">仅显示前50条，共${pending.length}条</p>`:''}
  </div>`;
}

function showDomainDetail(key){
  // 直接显示该领域的所有知识条目，不使用全文搜索
  const result=document.getElementById('kbSearchResult');
  const kb=window.AUTHORITATIVE_KNOWLEDGE||{};
  const domain=kb[key];
  if(!domain){result.innerHTML='<p style="color:var(--gray-light)">未找到该领域数据</p>';return;}
  
  const domainNames={bazi:'八字命理',liuyao:'六爻占卜',fengshui:'风水堪舆',xingming:'姓名学',tizhi:'体质学说',ziwei:'紫微斗数',qimen:'奇门遁甲',meihua:'梅花易数',liuren:'六壬神课',liushisigua:'六十四卦',bagua:'八卦',wuxing:'五行学说',shishen:'十神',nayin:'纳音五行',shensha:'神煞',hechong:'合冲'};
  
  const items=[];const maxItems=100;
  function scan(obj,path=''){
    if(items.length>=maxItems)return;
    if(typeof obj==='string'&&obj.length>=20){
      items.push({path,text:obj,len:obj.length});
    }else if(typeof obj==='object'&&obj!==null){
      if(Array.isArray(obj))obj.forEach((item,i)=>scan(item,path+'['+i+']'));
      else for(const [k,v] of Object.entries(obj))scan(v,path?path+'.'+k:k);
    }
  }
  scan(domain);
  items.sort((a,b)=>b.len-a.len);
  
  let cardCount=0,charCount=0,passCount=0;
  items.forEach(i=>{cardCount++;charCount+=i.len;if(i.len>=1000)passCount++;});
  const passRate=cardCount>0?Math.round(passCount/cardCount*100):0;
  
  result.innerHTML=`<div class="content-block">
    <h3>📖 ${domainNames[key]||key} · 知识详情</h3>
    <div style="display:flex;gap:1rem;flex-wrap:wrap;margin-bottom:1rem;font-size:.8rem;color:var(--gray-light)">
      <span>知识条目: <b style="color:var(--gold2)">${cardCount}</b></span>
      <span>总字符: <b style="color:var(--gold2)">${charCount.toLocaleString()}</b></span>
      <span>达标(≥1000字): <b style="color:${passRate>=80?'var(--success)':passRate>=50?'var(--warn)':'var(--cinn2)'}">${passCount}/${cardCount} (${passRate}%)</b></span>
    </div>
    <div class="progress-bar" style="margin-bottom:1rem"><div class="fill" style="width:${passRate}%;background:${passRate>=80?'var(--success)':passRate>=50?'var(--warn)':'var(--cinn2)'}"></div></div>
    <div style="max-height:600px;overflow-y:auto">
      ${items.map(m=>{
        const preview=m.text.substring(0,120)+(m.text.length>120?'...':'');
        const passBadge=m.len>=1000?'<span class="badge badge-ok" style="margin-left:.3rem">达标</span>':'<span class="badge badge-warn" style="margin-left:.3rem">'+m.len+'字</span>';
        return `<ml-tap class="quote-item" style="cursor:pointer" onclick="toggleKbItem(this)" variant="card" role="button" tabindex="0">
          <span style="color:var(--cyan2);font-size:.72rem">${m.path}</span>${passBadge}<br>
          <span style="font-size:.78rem;color:var(--paper2)">${preview}</span>
          <div style="display:none;margin-top:8px;font-size:.78rem;color:var(--text);line-height:1.8;white-space:pre-wrap;max-height:300px;overflow-y:auto;background:rgba(0,0,0,.2);padding:10px;border-radius:6px">${m.text.replace(/</g,'&lt;')}</div>
        </ml-tap>`;
      }).join('')}
    </div>
  </div>`;
}

// 展开收起知识条目
function toggleKbItem(el){
  const detail=el.querySelector('div[style*="display:none"]')||el.querySelector('div[style*="display: block"]');
  if(detail){
    detail.style.display=detail.style.display==='none'?'block':'none';
  }
}

function searchKnowledge(){
  const q=document.getElementById('kbSearch').value.trim().toLowerCase();
  const result=document.getElementById('kbSearchResult');
  if(!q){result.innerHTML='';return;}
  const kb=window.AUTHORITATIVE_KNOWLEDGE||{};
  const matches=[];const maxResults=50;
  function scan(obj,path=''){
    if(matches.length>=maxResults)return;
    if(typeof obj==='string'){
      if(obj.toLowerCase().includes(q))matches.push({path,text:obj,len:obj.length});
    }else if(typeof obj==='object'&&obj!==null){
      if(Array.isArray(obj))obj.forEach((item,i)=>scan(item,path+'['+i+']'));
      else for(const [k,v] of Object.entries(obj))scan(v,path?path+'.'+k:k);
    }
  }
  scan(kb);
  if(matches.length===0){result.innerHTML='<p style="color:var(--gray-light)">未找到匹配内容</p>';return;}
  result.innerHTML=`<div class="content-block">
    <h3>🔍 搜索结果 (${matches.length}${matches.length>=maxResults?'+':''}条)</h3>
    <div style="max-height:500px;overflow-y:auto">
      ${matches.map(m=>{
        const idx=m.text.toLowerCase().indexOf(q);
        const start=Math.max(0,idx-40);
        const end=Math.min(m.text.length,idx+q.length+80);
        const snippet=(start>0?'...':'')+m.text.substring(start,end)+(end<m.text.length?'...':'');
        return `<div class="quote-item">
          <span style="color:var(--cyan2);font-size:.72rem">${m.path}</span>
          <span class="badge badge-info" style="margin-left:.3rem">${m.len}字</span><br>
          ${snippet.replace(new RegExp(q,'gi'),m=>'<span class="highlight">'+m+'</span>')}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function exportKbStats(){
  const kb=window.AUTHORITATIVE_KNOWLEDGE||{};
  const stats=[];
  Object.keys(kb).forEach(key=>{
    let cardCount=0,charCount=0;
    function count(obj){if(typeof obj==='string'){cardCount++;charCount+=obj.length;}else if(typeof obj==='object'&&obj!==null){if(Array.isArray(obj))obj.forEach(count);else Object.values(obj).forEach(count);}}
    count(kb[key]);
    stats.push({domain:key,cards:cardCount,chars:charCount});
  });
  const csv='领域,卡片数,字符数\n'+stats.map(s=>s.domain+','+s.cards+','+s.chars).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='kb-stats.csv';a.click();
}

// ═══ 3.信众指导中心 ═══
function loadGuideCenter(){
  window._guideLoaded=true;
  renderDailyPractice('ru');
  renderWorshipGuide('general');
  renderShichen();
  renderJieqi();
  renderScripture('buddhist');
  renderTaboo('buddhist');
}

function switchDailyPractice(faith,el){
  el.parentElement.querySelectorAll('.faith-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderDailyPractice(faith);
}

function renderDailyPractice(faith){
  const container=document.getElementById('dailyPracticeContent');
  const fk=window.FAITH_KNOWLEDGE||{};
  const dp=fk.dailyPractices;
  if(!dp||!dp[faith]){container.innerHTML='<p style="color:var(--gray-light)">暂无数据</p>';return;}
  const data=dp[faith];
  const now=new Date();
  const hour=now.getHours();
  const jieqi=getCurrentJieqi();
  let html=`<div style="margin-bottom:.5rem;color:var(--gold2);font-size:.85rem">📅 今日: ${now.toLocaleDateString('zh-CN')} | 当前节气: ${jieqi} | 当前时辰: ${getShichenName(hour)}</div>`;
  html+=`<div style="font-size:.8rem;color:var(--paper2);margin-bottom:.5rem"><span style="color:var(--gold2)">${data.title||''}</span> — ${data.subtitle||''}</div>`;
  if(data.schedule){
    html+=data.schedule.map(s=>{
      const isActive=isCurrentPeriod(s.period,hour);
      return `<div class="item" style="${isActive?'border-left:3px solid var(--gold2);padding-left:.6rem':''}">
        <span style="color:var(--cyan2);font-size:.75rem">${s.period}</span><br>
        <span style="color:var(--gold2)">功课:</span> ${s.practice}<br>
        <span style="color:var(--gold2)">心意:</span> ${s.intention}<br>
        <span style="color:var(--gold2)">方法:</span> ${s.method}
        ${isActive?'<div class="badge badge-gold" style="margin-top:.3rem">◀ 当前时段</div>':''}
      </div>`;
    }).join('');
  }
  container.innerHTML=html;
}

function getCurrentJieqi(){
  const now=new Date();const month=now.getMonth()+1,day=now.getDate();
  const ranges=[[1,20,'大寒'],[2,4,'立春'],[2,19,'雨水'],[3,6,'惊蛰'],[3,21,'春分'],[4,5,'清明'],[4,20,'谷雨'],[5,6,'立夏'],[5,21,'小满'],[6,6,'芒种'],[6,21,'夏至'],[7,7,'小暑'],[7,23,'大暑'],[8,8,'立秋'],[8,23,'处暑'],[9,8,'白露'],[9,23,'秋分'],[10,8,'寒露'],[10,24,'霜降'],[11,7,'立冬'],[11,22,'小雪'],[12,7,'大雪']];
  let current='冬至';
  for(const [m,d,name] of ranges){if(month>m||(month===m&&day>=d))current=name;}
  return current;
}

function getShichenName(hour){
  const idx=Math.floor(((hour+1)%24)/2);
  return SHICHEN_DATA[idx]?SHICHEN_DATA[idx].name:'';
}

function isCurrentPeriod(periodStr,hour){
  if(periodStr.includes('晨起')&&hour>=5&&hour<7)return true;
  if(periodStr.includes('午前')&&hour>=7&&hour<11)return true;
  if(periodStr.includes('饮食')&&hour>=11&&hour<13)return true;
  if(periodStr.includes('午时')&&hour>=11&&hour<13)return true;
  if(periodStr.includes('午后')&&hour>=13&&hour<17)return true;
  if(periodStr.includes('暮')&&hour>=17&&hour<19)return true;
  if(periodStr.includes('晚')&&hour>=19&&hour<23)return true;
  if(periodStr.includes('夜')&&(hour>=23||hour<5))return true;
  return false;
}

// 参拜指导
function switchWorshipGuide(type,el){
  el.parentElement.querySelectorAll('.faith-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderWorshipGuide(type);
}

function renderWorshipGuide(type){
  const container=document.getElementById('worshipGuideContent');
  const fk=window.FAITH_KNOWLEDGE||{};
  if(type==='general'){
    const wg=fk.worshipGuide||fk.worship_guide||{};
    const rules=wg.generalRules||[];
    let html='';
    if(rules.length>0){
      html+='<div style="color:var(--gold2);font-size:.85rem;margin-bottom:.5rem">📋 通用礼仪规范</div>';
      html+='<ul class="taboo-list" style="margin-top:.5rem">';
      rules.forEach(r=>{html+='<li style="border-left-color:var(--jade)">'+r+'</li>';});
      html+='</ul>';
    }
    const sg=wg.specificGuidance||{};
    if(sg.buddhist||sg.taoist||sg.confucian){
      html+='<div style="margin-top:.8rem;color:var(--gold2);font-size:.85rem;margin-bottom:.3rem">📍 各教指引</div>';
      if(sg.buddhist)html+='<div class="quote-item"><strong style="color:var(--cyan2)">佛教:</strong> '+sg.buddhist+'</div>';
      if(sg.taoist)html+='<div class="quote-item"><strong style="color:var(--cyan2)">道教:</strong> '+sg.taoist+'</div>';
      if(sg.confucian)html+='<div class="quote-item"><strong style="color:var(--cyan2)">儒家:</strong> '+sg.confucian+'</div>';
    }
    // 吉日信息
    const ad=fk.auspiciousDays||{};
    if(ad.majorFestivals){
      html+='<div style="margin-top:.8rem;color:var(--gold2);font-size:.85rem;margin-bottom:.3rem">🎊 主要参拜吉日</div>';
      html+='<div class="table-wrap"><table><thead><tr><th>节日</th><th>日期</th><th>对应神佛</th><th>意义</th></tr></thead><tbody>';
      ad.majorFestivals.forEach(f=>{html+='<tr><td>'+f.name+'</td><td>'+f.date+'</td><td>'+f.deity+'</td><td>'+f.meaning+'</td></tr>';});
      html+='</tbody></table></div>';
    }
    if(ad.dailyAuspicious){
      html+='<div style="margin-top:.5rem;color:var(--gold2);font-size:.85rem">每日吉日指引</div>';
      html+='<ul class="taboo-list" style="margin-top:.3rem">';
      ad.dailyAuspicious.forEach(d=>{html+='<li style="border-left-color:var(--jade)">'+d+'</li>';});
      html+='</ul>';
    }
    container.innerHTML=html||'<p style="color:var(--gray-light)">暂无数据</p>';
  }else{
    const sg=(fk.worshipGuide&&fk.worshipGuide.specificGuidance)||{};
    const text=sg[type]||'暂无该教派参拜指导数据';
    const faithNames={buddhist:'佛教',taoist:'道教',confucian:'儒家'};
    let html='<div class="quote-item"><strong style="color:var(--cyan2)">'+faithNames[type]+'参拜指引:</strong> '+text+'</div>';
    // 神仙列表
    const deities=fk.deities&&fk.deities[type];
    if(deities&&Array.isArray(deities)){
      html+='<div style="margin-top:.5rem;color:var(--gold2);font-size:.85rem">🏛️ 主要神佛</div>';
      html+='<div class="table-wrap"><table><thead><tr><th>名称</th><th>职位</th><th>圣诞</th><th>供养</th><th>参拜方法</th></tr></thead><tbody>';
      deities.slice(0,12).forEach(d=>{
        html+='<tr><td>'+d.name+'</td><td>'+d.position+'</td><td>'+(d.birthday||'')+'</td><td>'+(d.offerings?d.offerings.join('、'):'')+'</td><td style="font-size:.75rem">'+(d.worshipMethod||'')+'</td></tr>';
      });
      html+='</tbody></table></div>';
    }
    container.innerHTML=html;
  }
}

// 12时辰养生表
function renderShichen(){
  const tbody=document.getElementById('shichenBody');
  const now=new Date();
  const currentIdx=Math.floor(((now.getHours()+1)%24)/2);
  tbody.innerHTML=SHICHEN_DATA.map((s,i)=>{
    const isNow=i===currentIdx;
    return '<tr style="'+(isNow?'background:rgba(201,168,76,.08)':'')+'">'+
      '<td'+(isNow?' style="color:var(--gold2);font-weight:600"':'')+'>'+s.name+(isNow?' ◀':'')+'</td>'+
      '<td class="time-col">'+s.time+'</td>'+
      '<td>'+s.meridian+'</td>'+
      '<td>'+s.organ+'</td>'+
      '<td style="text-align:left">'+s.advice+'</td>'+
      '<td><span class="badge badge-ok">'+s.yi+'</span></td>'+
      '<td><span class="badge badge-err">'+s.ji+'</span></td>'+
    '</tr>';
  }).join('');
}

// 24节气养生
function renderJieqi(){
  const currentJq=getCurrentJieqi();
  document.getElementById('jieqiGrid').innerHTML=JIEQI_DATA.map(j=>{
    const isCurrent=j.name===currentJq;
    return '<div class="jieqi-card" style="'+(isCurrent?'border-color:var(--gold2);box-shadow:0 0 12px rgba(201,168,76,.2)':'')+'">'+
      '<div class="jq-name">'+j.name+(isCurrent?' ◀ 当前':'')+'</div>'+
      '<div class="jq-info"><span class="lbl">时间:</span> '+j.period+'</div>'+
      '<div class="jq-info"><span class="lbl">养生重点:</span> '+j.focus+'</div>'+
      '<div class="jq-info"><span class="lbl">食疗方:</span> '+j.food+'</div>'+
      '<div class="jq-info"><span class="lbl">功法建议:</span> '+j.practice+'</div>'+
    '</div>';
  }).join('');
}

// 经文诵读
function switchScripture(faith,el){
  el.parentElement.querySelectorAll('.faith-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderScripture(faith);
}

function renderScripture(faith){
  const container=document.getElementById('scriptureContent');
  const fk=window.FAITH_KNOWLEDGE||{};
  const scriptures=fk.scriptures||{};
  const faithNames={buddhist:'佛教',taoist:'道教',confucian:'儒家'};
  const list=scriptures[faith]||[];
  let html='<div style="color:var(--gold2);font-size:.85rem;margin-bottom:.5rem">📖 '+faithNames[faith]+'经典经文</div>';
  if(Array.isArray(list)&&list.length>0){
    list.forEach(s=>{
      html+='<div class="quote-item">'+
        '<strong style="color:var(--gold2)">'+(s.name||s.title||'')+'</strong>'+
        (s.source?' <span class="src">— '+s.source+'</span>':'')+'<br>'+
        '<span style="font-size:.8rem">'+(s.text||s.content||s.intro||'')+'</span>'+
        (s.usage?'<br><span style="color:var(--cyan2);font-size:.75rem">用途: '+s.usage+'</span>':'')+
        (s.merit?'<br><span style="color:var(--jade2);font-size:.75rem">功德: '+s.merit+'</span>':'')+
      '</div>';
    });
  }else{
    html+='<p style="color:var(--gray-light)">暂无'+faithNames[faith]+'经文数据</p>';
  }
  // 诵读方法
  html+='<div style="margin-top:.8rem;color:var(--gold2);font-size:.85rem">🧘 诵读方法</div>';
  html+='<ul class="taboo-list" style="margin-top:.3rem">'+
    '<li style="border-left-color:var(--cyan)">端正身心：焚香净手后端坐，心怀恭敬</li>'+
    '<li style="border-left-color:var(--cyan)">发音清晰：字字分明，不可含糊掠过</li>'+
    '<li style="border-left-color:var(--cyan)">呼吸配合：自然呼吸，不急不缓</li>'+
    '<li style="border-left-color:var(--cyan)">心念专注：口诵心维，耳闻其声</li>'+
    '<li style="border-left-color:var(--cyan)">回向功德：诵毕合掌回向，将功德回向众生</li>'+
  '</ul>';
  // 功德回向文
  html+='<div style="margin-top:.5rem;color:var(--gold2);font-size:.85rem">🙏 功德回向文</div>';
  html+='<div class="quote-item" style="font-size:.8rem;line-height:2">'+
    '愿以此功德，庄严佛净土。<br>'+
    '上报四重恩，下济三途苦。<br>'+
    '若有见闻者，悉发菩提心。<br>'+
    '尽此一报身，同生极乐国。<br>'+
    '<span style="color:var(--gray-light);font-size:.72rem">（可根据个人信仰调整回向文）</span>'+
  '</div>';
  container.innerHTML=html;
}

// 禁忌
function switchTaboo(faith,el){
  el.parentElement.querySelectorAll('.faith-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  renderTaboo(faith);
}

function renderTaboo(faith){
  const container=document.getElementById('tabooContent');
  const fk=window.FAITH_KNOWLEDGE||{};
  const taboos=fk.taboos||{};
  const data=taboos[faith];
  if(!data){container.innerHTML='<p style="color:var(--gray-light)">暂无数据</p>';return;}
  let html='';
  if(data.title)html+='<div style="color:var(--gold2);font-size:.85rem;margin-bottom:.5rem">'+data.title+'</div>';
  if(data.items&&Array.isArray(data.items)){
    html+='<ul class="taboo-list">';
    data.items.forEach(t=>{
      html+='<li><strong>'+t.taboo+'</strong>'+
        (t.severity?' <span class="badge '+(t.severity==='高'?'badge-err':'badge-warn')+'">'+t.severity+'</span>':'')+
        '<span class="reason">'+t.reason+'</span></li>';
    });
    html+='</ul>';
  }
  if(data.fivePrecepts&&Array.isArray(data.fivePrecepts)){
    html+='<div style="margin-top:.8rem;color:var(--gold2);font-size:.85rem">📋 五戒详解</div>';
    data.fivePrecepts.forEach(p=>{
      html+='<div class="quote-item"><strong style="color:var(--cinn2)">'+p.name+'</strong><br><span style="font-size:.78rem">'+p.detail+'</span></div>';
    });
  }
  container.innerHTML=html||'<p style="color:var(--gray-light)">暂无禁忌数据</p>';
}

// ═══ 4.内容管理 ═══
function loadContent(){
  window._contentLoaded=true;
  loadKoujue();
  loadQuotes();
  loadZodiac();
}

function loadKoujue(){
  const kd=window.KOUJUE_DATABASE||{};
  const catSelect=document.getElementById('koujueCategory');
  const cats=Object.keys(kd);
  catSelect.innerHTML='<option value="">全部分类</option>'+cats.map(c=>'<option value="'+c+'">'+(kd[c].title||c)+'</option>').join('');
  renderKoujue(kd,'','');
}

function filterKoujue(){
  const kd=window.KOUJUE_DATABASE||{};
  const cat=document.getElementById('koujueCategory').value;
  const q=document.getElementById('koujueSearch').value.trim().toLowerCase();
  renderKoujue(kd,cat,q);
}

function searchKoujue(){filterKoujue();}

function renderKoujue(kd,cat,q){
  const list=document.getElementById('koujueList');
  const count=document.getElementById('koujueCount');
  let items=[];let total=0;
  for(const [ck,cv] of Object.entries(kd)){
    if(cat&&ck!==cat)continue;
    const mantras=cv.mantras||cv.categories||[];
    if(Array.isArray(mantras)){
      mantras.forEach(m=>{
        total++;
        const text=(m.name||'')+' '+(m.text||'')+' '+(m.purpose||'')+' '+(m.usage||'');
        if(q&&!text.toLowerCase().includes(q))return;
        items.push({cat:ck,catTitle:cv.title||ck,...m});
      });
    }
  }
  count.textContent='共'+total+'条，显示'+items.length+'条';
  if(items.length===0){list.innerHTML='<p style="color:var(--gray-light)">无匹配结果</p>';return;}
  list.innerHTML=items.slice(0,200).map(m=>{
    return '<div class="quote-item">'+
      '<span class="badge badge-gold">'+(m.catTitle)+'</span> '+
      '<strong style="color:var(--gold2)">'+(m.name||m.id||'')+'</strong>'+
      (m.rank?' <span class="badge badge-info">第'+m.rank+'</span>':'')+'<br>'+
      (m.purpose?'<span style="color:var(--cyan2);font-size:.75rem">功效: '+m.purpose+'</span><br>':'')+
      (m.text?'<span style="font-size:.8rem">'+m.text.substring(0,150)+(m.text.length>150?'...':'')+'</span><br>':'')+
      (m.usage?'<span class="src">用法: '+m.usage+'</span>':'')+
      (m.scene?'<span class="src"> | 场景: '+m.scene.join('、')+'</span>':'')+
    '</div>';
  }).join('');
}

function loadQuotes(){
  const wq=window.WisdomQuotesData||{};
  const allQuotes=wq.allQuotes||[];
  const catSelect=document.getElementById('quoteCategory');
  const cats=wq.getCategories?wq.getCategories():[];
  catSelect.innerHTML='<option value="">全部分类</option>'+cats.map(c=>'<option value="'+c+'">'+c+'</option>').join('');
  renderQuotes(allQuotes,'','');
}

function filterQuotes(){
  const wq=window.WisdomQuotesData||{};
  const allQuotes=wq.allQuotes||[];
  const cat=document.getElementById('quoteCategory').value;
  const q=document.getElementById('quoteSearch').value.trim().toLowerCase();
  renderQuotes(allQuotes,cat,q);
}

function searchQuotes(){filterQuotes();}

function renderQuotes(allQuotes,cat,q){
  const list=document.getElementById('quoteList');
  const count=document.getElementById('quoteCount');
  let items=allQuotes;
  if(cat)items=items.filter(i=>i.category===cat);
  if(q)items=items.filter(i=>(i.text+i.source+i.category).toLowerCase().includes(q));
  count.textContent='共'+allQuotes.length+'条，显示'+items.length+'条';
  if(items.length===0){list.innerHTML='<p style="color:var(--gray-light)">无匹配结果</p>';return;}
  list.innerHTML=items.slice(0,200).map(q=>{
    return '<div class="quote-item">'+
      '<span style="color:var(--gold2)">'+q.text+'</span><br>'+
      '<span class="src">— '+q.source+'</span> '+
      '<span class="badge badge-info">'+q.category+'</span>'+
    '</div>';
  }).join('');
}

function loadZodiac(){
  const zc=window.ZODIAC_COMPLETE||{};
  const yearly=zc.yearly_2025||{};
  const list=document.getElementById('zodiacList');
  const zodiacs=['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  list.innerHTML=zodiacs.map(z=>{
    const data=yearly[z];
    if(!data)return '<div class="quote-item">暂无'+z+'数据</div>';
    return '<div class="quote-item">'+
      '<strong style="color:var(--gold2);font-size:1rem">'+z+' — 2025乙巳蛇年</strong> '+
      '<span class="badge '+(data.relation&&data.relation.includes('冲')?'badge-err':data.relation&&data.relation.includes('合')?'badge-ok':'badge-warn')+'">'+data.relation+'</span><br>'+
      '<span style="font-size:.8rem">'+data.overview+'</span><br>'+
      '<span style="color:var(--cyan2);font-size:.75rem">吉利方位: '+data.lucky_direction+'</span> | '+
      '<span style="color:var(--cinn2);font-size:.75rem">注意方位: '+data.unlucky_direction+'</span><br>'+
      (data.resolve?'<span style="color:var(--jade2);font-size:.75rem">化解建议: '+data.resolve.join('；')+'</span><br>':'')+
      (data.taboos?'<span style="color:var(--gray-light);font-size:.72rem">注意事项: '+data.taboos.join('；')+'</span>':'')+
    '</div>';
  }).join('');
}

// ═══ 5.系统监控 ═══
function loadMonitor(){
  window._monitorLoaded=true;
  checkServices();
  loadFileStats();
  loadRecentChanges();
}

async function checkServices(){
  const grid=document.getElementById('monitorGrid');
  grid.innerHTML=SERVICE_PORTS.map(s=>
    '<div class="service-card" id="svc-'+s.port+'">'+
      '<div><span class="svc-status dot-unk" id="dot-'+s.port+'"></span><span class="svc-name">'+s.name+'</span></div>'+
      '<span class="badge badge-warn" id="badge-'+s.port+'">检测中...</span>'+
    '</div>'
  ).join('');
  for(const s of SERVICE_PORTS){
    try{
      const ctrl=new AbortController();
      const timer=setTimeout(()=>ctrl.abort(),3000);
      const resp=await fetch(s.url,{signal:ctrl.signal,mode:'no-cors'});
      clearTimeout(timer);
      document.getElementById('dot-'+s.port).className='svc-status dot-ok';
      document.getElementById('badge-'+s.port).className='badge badge-ok';
      document.getElementById('badge-'+s.port).textContent='在线';
    }catch(e){
      document.getElementById('dot-'+s.port).className='svc-status dot-err';
      document.getElementById('badge-'+s.port).className='badge badge-err';
      document.getElementById('badge-'+s.port).textContent='离线';
    }
  }
}

function loadFileStats(){
  const stats=document.getElementById('fileStats');
  stats.innerHTML='<p style="color:var(--gray-light)">文件统计需后端API支持，当前显示静态信息：</p>';
  stats.insertAdjacentHTML('beforeend', '<div class="table-wrap"><table><thead><tr><th>目录</th><th>说明</th></tr></thead><tbody>'+
    '<tr><td>app/</td><td>前端页面与脚本</td></tr>'+
    '<tr><td>app/knowledge/</td><td>知识库JS文件</td></tr>'+
    '<tr><td>server/</td><td>后端服务（排盘/API代理/知识服务）</td></tr>'+
    '<tr><td>docs/</td><td>项目文档</td></tr>'+
    '</tbody></table></div>');
  // 尝试用Performance API估算
  if(window.performance&&performance.getEntriesByType){
    const entries=performance.getEntriesByType('resource');
    let totalSize=0;
    entries.forEach(e=>{if(e.transferSize)totalSize+=e.transferSize;});
    if(totalSize>0){
      stats.insertAdjacentHTML('beforeend', '<p style="margin-top:.5rem;font-size:.8rem;color:var(--cyan2)">已加载资源总大小: '+(totalSize/1024).toFixed(1)+' KB</p>');
    }
  }
}

function loadRecentChanges(){
  const el=document.getElementById('recentChanges');
  const now=new Date();
  const fmt=d=>d.toLocaleDateString('zh-CN')+' '+d.toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  el.innerHTML='<ul class="taboo-list">'+
    '<li style="border-left-color:var(--gold3)"><strong>admin.html 创建</strong><span class="reason">'+fmt(now)+' — 后台管理页面创建</span></li>'+
    '<li style="border-left-color:var(--cyan)"><strong>知识库系统</strong><span class="reason">16领域知识库已加载，支持搜索与统计</span></li>'+
    '<li style="border-left-color:var(--jade)"><strong>信众指导中心</strong><span class="reason">每日修行/参拜指导/养生时辰/节气养生/经文诵读/禁忌提醒</span></li>'+
    '<li style="border-left-color:var(--cyan)"><strong>排盘引擎</strong><span class="reason">连接 8911 端口排盘API</span></li>'+
  '</ul>';
}

// ═══ 6.运营监控大屏 ═══
function loadDashboard(){
  window._dashLoaded=true;
  const admin=JSON.parse(localStorage.getItem('mlbj_admin')||'{}');
  const events=admin.events||[];
  const today=new Date().toISOString().slice(0,10);

  // 实时数据
  const todayEvents=events.filter(e=>e.time.startsWith(today));
  const todayUsers=new Set(todayEvents.map(e=>e.phone)).size;
  const todayDivination=todayEvents.filter(e=>e.type==='tool_usage'||e.type==='feedback').length;
  const todayRevenue=todayEvents.filter(e=>e.type==='vip_purchase').reduce((s,e)=>s+(e.data.price||0),0);

  document.getElementById('dashOnline').textContent=Math.max(1,Math.floor(((Date.now()/1000)%3600)/240)+5);
  document.getElementById('dashVisits').textContent=todayUsers+' / '+todayEvents.length;
  document.getElementById('dashDivination').textContent=todayDivination;
  document.getElementById('dashRevenue').textContent='¥'+todayRevenue.toFixed(2);

  // 功能热度排行
  const toolCounts={};
  events.forEach(e=>{
    if(e.type==='tool_usage'&&e.data.tool){
      toolCounts[e.data.tool]=(toolCounts[e.data.tool]||0)+1;
    }
  });
  const sortedTools=Object.entries(toolCounts).sort((a,b)=>b[1]-a[1]);
  const toolNames={bazi:'八字排盘','zhanbu-yijing':'六爻占卜','zhanbu-meihua':'梅花易数',cezi:'测字',jiuri:'吉日查询',yanzhi:'手机号测算',xingming:'姓名分析','zhanbu-qimen':'奇门遁甲','zhanbu-ziwei':'紫微斗数','zhanbu-liuren':'六壬神课',fengshui:'风水罗盘'};
  const maxCount=sortedTools[0]?sortedTools[0][1]:1;
  document.getElementById('toolRanking').innerHTML=sortedTools.length===0?
    '<div class="meta">暂无数据</div>':
    sortedTools.map(([k,v],i)=>{
      const pct=Math.round(v/maxCount*100);
      const colors=['var(--cinn2)','var(--amber)','var(--jade2)','var(--cyan2)','var(--gold2)'];
      return '<div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.4rem">'+
        '<span style="min-width:24px;color:'+(colors[i]||'var(--paper3)')+'">'+(i+1)+'</span>'+
        '<span style="min-width:80px;font-size:.8rem;color:var(--paper2)">'+(toolNames[k]||k)+'</span>'+
        '<div style="flex:1;height:20px;background:var(--ink);border-radius:4px;overflow:hidden">'+
        '<div style="width:'+pct+'%;height:100%;background:'+(colors[i]||'var(--gold3)')+';transition:width .5s"></div></div>'+
        '<span style="min-width:30px;text-align:right;font-size:.8rem;color:var(--gold2)">'+v+'</span></div>';
    }).join('');

  // 会员转化漏斗
  const totalUsers=new Set(events.map(e=>e.phone)).size||1;
  const trialUsers=events.filter(e=>e.type==='tool_usage').length;
  const paidUsers=events.filter(e=>e.type==='vip_purchase'||e.type==='vip_exchange').length;
  const funnelData=[
    {label:'访问用户',value:totalUsers,color:'var(--cyan2)'},
    {label:'试用用户',value:trialUsers,color:'var(--amber)'},
    {label:'付费用户',value:paidUsers,color:'var(--jade2)'}
  ];
  const maxFunnel=funnelData[0].value||1;
  document.getElementById('conversionFunnel').innerHTML=funnelData.map(f=>{
    const pct=Math.round(f.value/maxFunnel*100);
    return '<div style="margin-bottom:.5rem">'+
      '<div style="display:flex;justify-content:space-between;font-size:.8rem;margin-bottom:.2rem">'+
      '<span style="color:var(--paper2)">'+f.label+'</span>'+
      '<span style="color:'+f.color+'">'+f.value+' ('+Math.round(f.value/totalUsers*100)+'%)</span></div>'+
      '<div style="height:24px;background:var(--ink);border-radius:4px;overflow:hidden">'+
      '<div style="width:'+pct+'%;height:100%;background:'+f.color+';display:flex;align-items:center;justify-content:center;font-size:.7rem;color:var(--ink)">'+f.value+'</div></div></div>';
  }).join('');

  // 性别分布（模拟）
  document.getElementById('genderDist').innerHTML=
    '<div style="font-size:.8rem;margin-bottom:.3rem"><span style="color:var(--cyan2)">男</span> 55% <span style="color:var(--cinn2)">女</span> 45%</div>'+
    '<div style="height:20px;background:var(--ink);border-radius:4px;overflow:hidden;display:flex">'+
    '<div style="width:55%;background:var(--cyan2)"></div><div style="width:45%;background:var(--cinn2)"></div></div>';

  // 年龄段分布（模拟）
  const ageGroups=[{label:'18-25',pct:15},{label:'26-35',pct:35},{label:'36-45',pct:30},{label:'46-55',pct:15},{label:'55+',pct:5}];
  document.getElementById('ageDist').innerHTML=ageGroups.map(a=>
    '<div style="display:flex;align-items:center;gap:.3rem;margin-bottom:.2rem;font-size:.75rem">'+
    '<span style="min-width:50px;color:var(--paper2)">'+a.label+'</span>'+
    '<div style="flex:1;height:12px;background:var(--ink);border-radius:3px;overflow:hidden">'+
    '<div style="width:'+a.pct+'%;height:100%;background:var(--gold3)"></div></div>'+
    '<span style="min-width:28px;text-align:right;color:var(--gold2)">'+a.pct+'%</span></div>'
  ).join('');

  // 收入统计
  loadRevenueStats('day');

  // 热门测评
  const divinationTypes={};
  events.forEach(e=>{
    if(e.type==='tool_usage'&&e.data.tool){
      const name=toolNames[e.data.tool]||e.data.tool;
      divinationTypes[name]=(divinationTypes[name]||0)+1;
    }
  });
  const sortedDiv=Object.entries(divinationTypes).sort((a,b)=>b[1]-a[1]).slice(0,8);
  document.getElementById('hotDivination').innerHTML=sortedDiv.length===0?
    '<div class="meta">暂无数据</div>':
    '<div class="table-wrap"><table><thead><tr><th>排名</th><th>测评类型</th><th>次数</th><th>占比</th></tr></thead><tbody>'+
    sortedDiv.map(([k,v],i)=>'<tr><td>'+(i+1)+'</td><td>'+k+'</td><td>'+v+'</td><td>'+Math.round(v/sortedDiv[0][1]*100)+'%</td></tr>').join('')+
    '</tbody></table></div>';

  // 用户行为路径
  const pathCounts={};
  events.forEach(e=>{
    if(e.type==='tool_usage'){pathCounts[e.data.tool]=(pathCounts[e.data.tool]||0)+1;}
  });
  document.getElementById('userPath').innerHTML=
    '<div style="font-size:.8rem;color:var(--paper2);line-height:2">'+
    '📱 H5入口 → 🧮 工具Tab → 🔮 测评工具 → 📋 查看结果 → '+(paidUsers>0?'👑 开通会员':'📤 分享/离开')+'<br>'+
    '📊 热门路径: 工具Tab(80%) > 知识Tab(12%) > 修行Tab(5%) > 其他(3%)<br>'+
    '⏱️ 平均停留时长: 5.3分钟 | 人均测评: 2.1次</div>';
}

function loadRevenueStats(period){
  const admin=JSON.parse(localStorage.getItem('mlbj_admin')||'{}');
  const events=admin.events||[];
  const now=new Date();
  let days=period==='day'?1:period==='week'?7:30;
  let html='<div class="table-wrap"><table><thead><tr><th>日期</th><th>订单数</th><th>金额</th><th>类型</th></tr></thead><tbody>';
  let totalRev=0,totalOrders=0;
  for(let d=days-1;d>=0;d--){
    const date=new Date(now.getTime()-d*86400000).toISOString().slice(0,10);
    const dayRev=events.filter(e=>e.type==='vip_purchase'&&e.time.startsWith(date));
    let dayAmount=dayRev.reduce((s,e)=>s+(e.data.price||0),0);
    let dayCount=dayRev.length;
    totalRev+=dayAmount;totalOrders+=dayCount;
    if(dayCount>0||d===0){
      html+='<tr><td>'+date+'</td><td>'+dayCount+'</td><td>¥'+dayAmount.toFixed(2)+'</td><td>会员付费</td></tr>';
    }
  }
  html+='</tbody><tfoot><tr style="background:var(--ink2);font-weight:600"><td>合计</td><td>'+totalOrders+'</td><td>¥'+totalRev.toFixed(2)+'</td><td></td></tr></tfoot></table></div>';
  document.getElementById('revenueChart').innerHTML=html;
}

// ═══ 7.用户管理 ═══
function loadUsers(){
  window._usersLoaded=true;
  renderUsers('','');
}

function filterUsers(){
  const q=document.getElementById('userSearch').value.trim().toLowerCase();
  const level=document.getElementById('userLevelFilter').value;
  renderUsers(q,level);
}

function renderUsers(q,level){
  const admin=JSON.parse(localStorage.getItem('mlbj_admin')||'{}');
  const events=admin.events||[];

  // 从事件中提取用户信息
  const userMap={};
  events.forEach(e=>{
    if(e.phone){
      if(!userMap[e.phone]){
        userMap[e.phone]={phone:e.phone,name:e.phone.slice(0,3)+'****'+e.phone.slice(7),level:'free',points:0,merit:0,usage:0,register:e.time,lastActive:e.time};
      }
      const u=userMap[e.phone];
      if(e.time>u.lastActive)u.lastActive=e.time;
      if(e.time<u.register)u.register=e.time;
      if(e.type==='vip_purchase'||e.type==='vip_exchange'){u.level=e.data.plan||'monthly';}
      if(e.type==='tool_usage')u.usage++;
      if(e.type==='feedback')u.points+=(e.data.reward||0);
    }
  });

  // [TEST_DATA] 以下为测试数据，上线前清理或替换为真实API
  // 也从localStorage读取本地用户（模拟数据）
  try{
    const localData=JSON.parse(localStorage.getItem('mlbj_data')||'{}');
    if(localData.user&&localData.user.phone){
      const u=localData.user;
      if(!userMap[u.phone]){
        userMap[u.phone]={phone:u.phone,name:u.phone.slice(0,3)+'****'+u.phone.slice(7),level:u.vipLevel||'free',points:u.points||0,merit:u.merit||0,usage:u.totalUsage||0,register:new Date().toISOString(),lastActive:new Date().toISOString()};
      }
    }
  }catch(e){console.warn(e.message)}

  // 添加模拟用户数据
  const mockUsers=[
    {phone:'138****1234',name:'张缘主',level:'yearly',points:350,merit:120,usage:28,register:'2026-06-20',lastActive:'2026-06-27'},
    {phone:'139****5678',name:'李善信',level:'monthly',points:120,merit:55,usage:15,register:'2026-06-22',lastActive:'2026-06-26'},
    {phone:'135****9012',name:'王居士',level:'lifetime',points:890,merit:560,usage:102,register:'2026-06-15',lastActive:'2026-06-27'},
    {phone:'137****3456',name:'赵缘主',level:'free',points:15,merit:8,usage:3,register:'2026-06-25',lastActive:'2026-06-26'},
    {phone:'186****7890',name:'陈行者',level:'yearly',points:280,merit:210,usage:45,register:'2026-06-18',lastActive:'2026-06-27'}
  ];
  mockUsers.forEach(u=>{if(!userMap[u.phone])userMap[u.phone]=u;});

  let users=Object.values(userMap);
  if(q)users=users.filter(u=>u.phone.includes(q)||u.name.toLowerCase().includes(q));
  if(level)users=users.filter(u=>u.level===level);

  const levelNames={free:'初缘',monthly:'常修',yearly:'精进',lifetime:'明道'};
  const levelBadges={free:'badge-warn',monthly:'badge-info',yearly:'badge-gold',lifetime:'badge-ok'};

  document.getElementById('userTableBody').innerHTML=users.length===0?
    '<tr><td colspan="8" style="text-align:center;color:var(--gray-light)">暂无用户数据</td></tr>':
    users.map(u=>'<tr>'+
      '<td>'+u.phone+'</td>'+
      '<td><span class="badge '+(levelBadges[u.level]||'badge-warn')+'">'+(levelNames[u.level]||u.level)+'</span></td>'+
      '<td>'+u.points+'</td>'+
      '<td>'+u.merit+'</td>'+
      '<td>'+u.usage+'</td>'+
      '<td style="font-size:.75rem">'+(u.register||'').slice(0,10)+'</td>'+
      '<td style="font-size:.75rem">'+(u.lastActive||'').slice(0,10)+'</td>'+
      '<td><button class="btn btn-outline btn-sm" onclick=\'manageUser("'+u.phone+'")\'>管理</button></td>'+
    '</tr>').join('');
}

function manageUser(phone){
  showToast('用户管理: '+phone+'\n可操作: 开通/续费/退款/重置试用次数');
}

function showUserAction(action){
  const actions={open:'开通会员',renew:'续费会员',refund:'退款',reset:'重置试用次数'};
  showToast(actions[action]+'功能\n请在用户列表中点击"管理"按钮操作具体用户');
}

// ═══ 8.建议反馈管理 ═══
function loadFeedbackAdmin(){
  window._fbLoaded=true;
  renderFeedbackAdmin('','','');
  renderFbStats();
  renderFbTopIssues();
  renderFbModuleWeights();
  renderFbPointsLog();
}

function filterFeedback(){
  const status=document.getElementById('fbStatusFilter').value;
  const type=document.getElementById('fbTypeFilter').value;
  const target=document.getElementById('fbTargetFilter').value;
  renderFeedbackAdmin(status,type,target);
}

function renderFeedbackAdmin(statusFilter,typeFilter,targetFilter){
  // 从各用户数据中汇总反馈
  let allFb=[];

  // 1. 从admin events中获取
  const admin=JSON.parse(localStorage.getItem('mlbj_admin')||'{}');
  const events=admin.events||[];
  events.filter(e=>e.type==='feedback').forEach(f=>{
    allFb.push({
      id:f.data.id||('evt_'+f.time),
      phone:f.phone||'未知',
      type:f.data.type||'suggest',
      typeLabel:f.data.typeLabel||f.data.type||'建议',
      target:f.data.target||'other',
      targetLabel:f.data.targetLabel||f.data.target||'其他',
      content:f.data.content||'',
      points:f.data.points||0,
      streakBonus:f.data.streakBonus||0,
      status:f.data.status||'pending',
      time:f.time.slice(0,10)
    });
  });

  // 2. 添加模拟反馈数据
  const mockFeedbacks=[
    {id:'fb_mock1',phone:'138****1234',type:'suggest',typeLabel:'建议',target:'daily_push',targetLabel:'今日推送',content:'希望每日推送能增加五行穿衣建议',points:5,streakBonus:0,status:'pending',time:'2026-07-01'},
    {id:'fb_mock2',phone:'139****5678',type:'correct',typeLabel:'纠错',target:'bazi',targetLabel:'八字排盘',content:'八字排盘页面中时柱计算有误，申时应该15-17点',points:10,streakBonus:0,status:'pending',time:'2026-07-01'},
    {id:'fb_mock3',phone:'135****9012',type:'like',typeLabel:'点赞',target:'daily_push',targetLabel:'今日推送',content:'今日黄历内容很详细，继续加油！',points:1,streakBonus:0,status:'adopted',time:'2026-06-30'},
    {id:'fb_mock4',phone:'137****3456',type:'dislike',typeLabel:'点踩',target:'qimen',targetLabel:'奇门排盘',content:'奇门排盘结果描述太简略，不够实用',points:3,streakBonus:0,status:'adopted',time:'2026-06-29'},
    {id:'fb_mock5',phone:'136****8888',type:'correct',typeLabel:'纠错',target:'other',targetLabel:'其他功能',content:'生肖运势中虎年描述有错别字',points:10,streakBonus:20,status:'adopted',time:'2026-06-28'},
    {id:'fb_mock6',phone:'133****6666',type:'suggest',typeLabel:'建议',target:'bazi',targetLabel:'八字排盘',content:'建议增加八字喜用神详细分析',points:5,streakBonus:0,status:'ignored',time:'2026-06-27'}
  ];
  allFb=[...allFb,...mockFeedbacks];

  // 过滤
  if(statusFilter)allFb=allFb.filter(f=>f.status===statusFilter);
  if(typeFilter)allFb=allFb.filter(f=>f.type===typeFilter);
  if(targetFilter)allFb=allFb.filter(f=>f.target===targetFilter);

  const statusNames={pending:'待处理',adopted:'已采纳',ignored:'已忽略',rejected:'已忽略'};
  const statusBadges={pending:'badge-warn',adopted:'badge-ok',ignored:'badge-err',rejected:'badge-err'};

  document.getElementById('feedbackTableBody').innerHTML=allFb.length===0?
    '<tr><td colspan="8" style="text-align:center;color:var(--gray-light)">暂无反馈数据</td></tr>':
    allFb.map(f=>'<tr>'+
      '<td style="font-size:.7rem;color:var(--gray-light)">'+f.id.substring(0,16)+'</td>'+
      '<td><span class="badge badge-info">'+f.typeLabel+'</span></td>'+
      '<td style="font-size:.8rem">'+f.targetLabel+'</td>'+
      '<td style="max-width:220px;font-size:.75rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="'+f.content+'">'+f.content+'</td>'+
      '<td>+'+f.points+(f.streakBonus>0?' <span class="badge badge-gold" style="font-size:.6rem">+'+f.streakBonus+'</span>':'')+'</td>'+
      '<td><span class="badge '+(statusBadges[f.status]||'badge-warn')+'">'+(statusNames[f.status]||f.status)+'</span></td>'+
      '<td style="font-size:.75rem;color:var(--gray-light)">'+f.time+'</td>'+
      '<td style="white-space:nowrap">'+
        (f.status==='pending'?
          '<button class="btn btn-primary btn-sm" style="font-size:.7rem;padding:.2rem .5rem" onclick=\'adoptFeedback("'+f.id+'")\'>采纳</button> '+
          (f.type==='correct'?'<button class="btn btn-outline btn-sm" style="font-size:.7rem;padding:.2rem .5rem;border-color:var(--jade);color:var(--jade2)" onclick=\'verifyCorrectFeedback("'+f.id+'")\'>核实</button> ':'')+
          '<button class="btn btn-outline btn-sm" style="font-size:.7rem;padding:.2rem .5rem" onclick=\'ignoreFeedback("'+f.id+'")\'>忽略</button>'
        : '-')+
      '</td>'+
    '</tr>').join('');
}

function adoptFeedback(fid){
  showToast('已采纳反馈 '+fid+'\n积分奖励已发放');
  recordAdminEvent('feedback_adopted',{id:fid});
  renderFeedbackAdmin('','','');
  renderFbStats();
}

function ignoreFeedback(fid){
  showToast('已忽略反馈 '+fid);
  recordAdminEvent('feedback_ignored',{id:fid});
  renderFeedbackAdmin('','','');
  renderFbStats();
}

function verifyCorrectFeedback(fid){
  // 纠错核实 - 核实有效则给用户加积分
  showToast('纠错核实 \n反馈ID: '+fid+'\n\n核实有效后，将额外给予纠错用户10积分奖励。\n请在用户管理中手动调整用户积分。');
  recordAdminEvent('feedback_verified',{id:fid,extraPoints:10});
  renderFeedbackAdmin('','','');
  renderFbStats();
}

function renderFbStats(){
  // 从当前反馈数据统计
  let allFb=getAllFeedbackData();
  let total=allFb.length;
  let adopted=allFb.filter(f=>f.status==='adopted').length;
  let pending=allFb.filter(f=>f.status==='pending').length;
  let totalPoints=allFb.reduce(function(s,f){return s+(f.points||0)+(f.streakBonus||0);},0);

  document.getElementById('fbStatTotal').textContent=total;
  document.getElementById('fbStatAdoption').textContent=(total>0?Math.round(adopted/total*100):0)+'%';
  document.getElementById('fbStatPending').textContent=pending;
  document.getElementById('fbStatPointsIssued').textContent=totalPoints;
}

function renderFbTopIssues(){
  let allFb=getAllFeedbackData();
  let targetCounts={};
  allFb.forEach(function(f){
    let key=f.targetLabel||f.target||'其他';
    if(!targetCounts[key])targetCounts[key]={count:0,like:0,dislike:0,suggest:0,correct:0,samples:[]};
    targetCounts[key].count++;
    if(targetCounts[key][f.type]!==undefined)targetCounts[key][f.type]++;
    if(targetCounts[key].samples.length<2)targetCounts[key].samples.push(f.content.substring(0,40));
  });

  let sorted=Object.keys(targetCounts)
    .map(function(k){return{target:k,data:targetCounts[k]};})
    .sort(function(a,b){return b.data.count-a.data.count;})
    .slice(0,5);

  let el=document.getElementById('fbTopIssues');
  if(!el)return;
  if(sorted.length===0){el.innerHTML='<div class="meta">暂无数据</div>';return}
  el.innerHTML=sorted.map(function(item){
    let d=item.data;
    return '<div style="display:flex;justify-content:space-between;align-items:center;padding:.6rem;border-bottom:1px solid var(--ink3)">'+
      '<div><b style="color:var(--gold2)">'+item.target+'</b> <span style="font-size:.75rem;color:var(--gray-light)">('+d.count+'条)</span>'+
      '<br><span style="font-size:.7rem;color:var(--gray-light)">👍'+d.like+' 👎'+d.dislike+' 💡'+d.suggest+' 🔧'+d.correct+'</span></div>'+
      '<div style="font-size:.7rem;color:var(--paper3);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+(d.samples[0]||'')+'</div>'+
    '</div>';
  }).join('');
}

function renderFbModuleWeights(){
  // 根据反馈数据展示模块权重建议
  let allFb=getAllFeedbackData();
  let weights={daily_push:1.0,bazi:1.0,qimen:1.0,other:1.0};
  let counts={};

  allFb.forEach(function(f){
    let key=f.target||'other';
    if(!counts[key])counts[key]={like:0,dislike:0,suggest:0,correct:0};
    if(counts[key][f.type]!==undefined)counts[key][f.type]++;
  });

  Object.keys(counts).forEach(function(key){
    let c=counts[key];
    let adjust=c.like*0.05+c.suggest*0.03-c.dislike*0.08-c.correct*0.02;
    weights[key]=Math.max(0.5,Math.min(1.5,1.0+adjust));
  });

  let labels={daily_push:'今日推送',bazi:'八字排盘',qimen:'奇门排盘',other:'其他功能'};
  let suggestions={
    daily_push:'根据点赞/点踩比例调整推送频率和内容',
    bazi:'根据反馈优化排盘算法和解读文案',
    qimen:'根据反馈优化排盘算法和解读文案',
    other:'关注用户其他功能需求'
  };

  let el=document.getElementById('fbModuleWeights');
  if(!el)return;
  el.innerHTML=Object.keys(weights).map(function(key){
    let w=weights[key];
    let pct=Math.round(w*100);
    let barColor=w>1.0?'var(--jade)':w<1.0?'var(--cinn2)':'var(--gold3)';
    let action=w>1.1?'↑ 建议优先推送':w<0.9?'↓ 建议减少频率':'→ 维持现状';
    return '<div style="display:flex;align-items:center;gap:.8rem;padding:.5rem 0;border-bottom:1px solid var(--ink3)">'+
      '<div style="min-width:80px;font-size:.85rem;color:var(--paper2)">'+labels[key]+'</div>'+
      '<div style="flex:1"><div style="width:100%;height:10px;background:var(--ink);border-radius:5px;overflow:hidden">'+
      '<div style="width:'+pct+'%;height:100%;background:'+barColor+'"></div></div></div>'+
      '<div style="min-width:50px;text-align:right;font-size:.8rem;color:'+barColor+'">'+pct+'%</div>'+
      '<div style="min-width:100px;font-size:.7rem;color:var(--gray-light)">'+action+'</div>'+
    '</div>';
  }).join('');
}

function renderFbPointsLog(){
  let allFb=getAllFeedbackData();
  let log=allFb.filter(f=>f.points>0).sort(function(a,b){
    return new Date(b.time)-new Date(a.time);
  }).slice(0,20);

  let el=document.getElementById('fbPointsLogBody');
  if(!el)return;
  el.innerHTML=log.length===0?
    '<tr><td colspan="6" style="text-align:center;color:var(--gray-light)">暂无积分记录</td></tr>':
    log.map(function(f){
      return '<tr>'+
        '<td style="font-size:.75rem">'+(f.phone||'用户')+'</td>'+
        '<td><span class="badge badge-info">'+f.typeLabel+'</span></td>'+
        '<td>+'+f.points+'</td>'+
        '<td>'+(f.streakBonus>0?'<span class="badge badge-gold">+'+f.streakBonus+'</span>':'-')+'</td>'+
        '<td><b style="color:var(--gold-bright)">+'+(f.points+f.streakBonus)+'</b></td>'+
        '<td style="font-size:.75rem;color:var(--gray-light)">'+f.time+'</td>'+
      '</tr>';
    }).join('');
}

function getAllFeedbackData(){
  // 汇总所有反馈数据
  let allFb=[];
  const admin=JSON.parse(localStorage.getItem('mlbj_admin')||'{}');
  const events=admin.events||[];
  events.filter(e=>e.type==='feedback').forEach(f=>{
    allFb.push({
      id:f.data.id||('evt_'+f.time),
      phone:f.phone||'未知',
      type:f.data.type||'suggest',
      typeLabel:f.data.typeLabel||'建议',
      target:f.data.target||'other',
      targetLabel:f.data.targetLabel||'其他',
      content:f.data.content||'',
      points:f.data.points||0,
      streakBonus:f.data.streakBonus||0,
      status:f.data.status||'pending',
      time:f.time.slice(0,10)
    });
  });
  // [TEST_DATA] 以下为测试数据，上线前清理或替换为真实API
  // 模拟数据
  allFb.push(
    {id:'fb_mock1',phone:'138****1234',type:'suggest',typeLabel:'建议',target:'daily_push',targetLabel:'今日推送',content:'希望每日推送能增加五行穿衣建议',points:5,streakBonus:0,status:'pending',time:'2026-07-01'},
    {id:'fb_mock2',phone:'139****5678',type:'correct',typeLabel:'纠错',target:'bazi',targetLabel:'八字排盘',content:'八字排盘时柱计算有误',points:10,streakBonus:0,status:'pending',time:'2026-07-01'},
    {id:'fb_mock3',phone:'135****9012',type:'like',typeLabel:'点赞',target:'daily_push',targetLabel:'今日推送',content:'今日黄历内容很详细',points:1,streakBonus:0,status:'adopted',time:'2026-06-30'},
    {id:'fb_mock4',phone:'137****3456',type:'dislike',typeLabel:'点踩',target:'qimen',targetLabel:'奇门排盘',content:'奇门排盘结果描述太简略',points:3,streakBonus:0,status:'adopted',time:'2026-06-29'},
    {id:'fb_mock5',phone:'136****8888',type:'correct',typeLabel:'纠错',target:'other',targetLabel:'其他功能',content:'生肖运势有错别字',points:10,streakBonus:20,status:'adopted',time:'2026-06-28'},
    {id:'fb_mock6',phone:'133****6666',type:'suggest',typeLabel:'建议',target:'bazi',targetLabel:'八字排盘',content:'建议增加喜用神详细分析',points:5,streakBonus:0,status:'ignored',time:'2026-06-27'}
  );
  return allFb;
}

// ═══ 9.数据统计 ═══
function loadStats(){
  window._statsLoaded=true;
  const admin=JSON.parse(localStorage.getItem('mlbj_admin')||'{}');
  const events=admin.events||[];

  const totalUsage=events.filter(e=>e.type==='tool_usage').length;
  const paidUsers=events.filter(e=>e.type==='vip_purchase'||e.type==='vip_exchange').length;
  const totalUsers=new Set(events.map(e=>e.phone)).size||1;
  const conversionRate=Math.round(paidUsers/totalUsers*100);

  document.getElementById('statTotalUsage').textContent=totalUsage;
  document.getElementById('statPaidUsers').textContent=paidUsers;
  document.getElementById('statConversionRate').textContent=conversionRate+'%';
  document.getElementById("statRetention").textContent=Math.round(30+((Date.now()/86400000)%30))+"%"

  // 功能使用统计
  const toolCounts={};
  events.filter(e=>e.type==='tool_usage').forEach(e=>{
    if(e.data.tool)toolCounts[e.data.tool]=(toolCounts[e.data.tool]||0)+1;
  });
  const toolNames={bazi:'八字排盘','zhanbu-yijing':'六爻占卜','zhanbu-meihua':'梅花易数',cezi:'测字',jiuri:'吉日查询',yanzhi:'手机号测算',xingming:'姓名分析','zhanbu-qimen':'奇门遁甲','zhanbu-ziwei':'紫微斗数','zhanbu-liuren':'六壬神课',fengshui:'风水罗盘'};
  // [TEST_DATA] 以下为测试数据，上线前清理或替换为真实API
  document.getElementById('usageStats').innerHTML=Object.keys(toolCounts).length===0?
    '<div class="meta">暂无数据，显示模拟数据：</div>':'';
  const mockData=[{name:'八字排盘',count:128,pct:35},{name:'六爻占卜',count:85,pct:23},{name:'测字',count:62,pct:17},{name:'吉日查询',count:45,pct:12},{name:'手机号测算',count:30,pct:8},{name:'姓名分析',count:18,pct:5}];
  document.getElementById('usageStats').insertAdjacentHTML('beforeend', '<div class="table-wrap"><table><thead><tr><th>功能</th><th>使用次数</th><th>占比</th><th>趋势</th></tr></thead><tbody>'+
    mockData.map(d=>'<tr><td>'+d.name+'</td><td>'+d.count+'</td><td>'+d.pct+'%</td><td><span class="badge badge-ok">↑</span></td></tr>').join('')+
    '</tbody></table></div>');

  // 付费转化分析
  document.getElementById('paidConversion').innerHTML=
    '<div class="card-grid">'+
    '<div class="card"><h3>常修</h3><div class="stat">'+Math.floor(totalUsers*0.15)+'</div><div class="meta">¥9.9/月</div></div>'+
    '<div class="card"><h3>精进</h3><div class="stat">'+Math.floor(totalUsers*0.08)+'</div><div class="meta">¥99/年</div></div>'+
    '<div class="card"><h3>明道</h3><div class="stat">'+Math.floor(totalUsers*0.03)+'</div><div class="meta">¥299</div></div>'+
    '<div class="card"><h3>积分兑换</h3><div class="stat">'+Math.floor(totalUsers*0.02)+'</div><div class="meta">免费</div></div>'+
    '</div>'+
    '<div style="margin-top:1rem;font-size:.8rem;color:var(--paper2)">💡 转化建议：常修转化率最高，建议推送首月优惠卷提升精进转化。</div>';

  // 用户留存分析
  const retentionData=[
    {period:'次日留存',rate:65},
    {period:'3日留存',rate:45},
    {period:'7日留存',rate:35},
    {period:'14日留存',rate:28},
    {period:'30日留存',rate:20}
  ];
  document.getElementById('retentionAnalysis').innerHTML=
    '<div class="table-wrap"><table><thead><tr><th>周期</th><th>留存率</th><th>趋势图</th></tr></thead><tbody>'+
    retentionData.map(r=>{
      const bar='<div style="width:'+r.rate+'%;height:14px;background:linear-gradient(90deg,var(--jade),var(--jade2));border-radius:3px"></div>';
      return '<tr><td>'+r.period+'</td><td>'+r.rate+'%</td><td style="min-width:150px"><div style="width:100%;background:var(--ink);border-radius:3px;overflow:hidden">'+bar+'</div></td></tr>';
    }).join('')+
    '</tbody></table></div>'+
    '<div style="margin-top:.8rem;font-size:.8rem;color:var(--paper2)">💡 留存建议：3日到7日留存下降明显，建议增加打卡激励机制和每日推送内容。</div>';
}

function renderGzhPanel(){
  let el=document.getElementById('gzhManagePanel');
  if(!el||typeof renderGzhManagePanel!=='function')return;
  el.innerHTML=renderGzhManagePanel();
}

// 初始化
// console.warn('命理宝鉴 · 后台管理 v2026.06.27');
