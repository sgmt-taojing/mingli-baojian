蛰'],[3,21,'春分'],[4,5,'清明'],[4,20,'谷雨'],[5,6,'立夏'],[5,21,'小满'],[6,6,'芒种'],[6,21,'夏至'],[7,7,'小暑'],[7,23,'大暑'],[8,8,'立秋'],[8,23,'处暑'],[9,8,'白露'],[9,23,'秋分'],[10,8,'寒露'],[10,24,'霜降'],[11,7,'立冬'],[11,22,'小雪'],[12,7,'大雪']];
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
  stats.innerHTML+='<div class="table-wrap"><table><thead><tr><th>目录</th><th>说明</th></tr></thead><tbody>'+
    '<tr><td>app/</td><td>前端页面与脚本</td></tr>'+
    '<tr><td>app/knowledge/</td><td>知识库JS文件</td></tr>'+
    '<tr><td>server/</td><td>后端服务（排盘/API代理/知识服务）</td></tr>'+
    '<tr><td>docs/</td><td>项目文档</td></tr>'+
    '</tbody></table></div>';
  // 尝试用Performance API估算
  if(window.performance&&performance.getEntriesByType){
    const entries=performance.getEntriesByType('resource');
    let totalSize=0;
    entries.forEach(e=>{if(e.transferSize)totalSize+=e.transferSize;});
    if(totalSize>0){
      stats.innerHTML+='<p style="margin-top:.5rem;font-size:.8rem;color:var(--cyan2)">已加载资源总大小: '+(totalSize/1024).toFixed(1)+' KB</p>';
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

// 初始化
console.log('易道智鉴 · 后台管理 v2026.06.24');
</script>
</body>
</html>
