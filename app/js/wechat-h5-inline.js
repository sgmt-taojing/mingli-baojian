
function wxTab(name,btn){
  document.querySelectorAll('.section').forEach(function(s){s.classList.remove('active')});
  document.getElementById('section-'+name).classList.add('active');
  document.querySelectorAll('.tab-bar button').forEach(function(b){b.classList.remove('active')});
  btn.classList.add('active');
  window.scrollTo(0,0);
}

// 今日运势
function loadDailyFortune(){
  let now=new Date();
  let dateHash=(now.getFullYear()*1000+now.getMonth()*31+now.getDate())%360;
  let fortunes=[
    {lucky:'鼠',desc:'今日思维敏捷，适合处理需要创意的事务。注意人际关系中的小细节。',color:'青色',num:'3,8'},
    {lucky:'牛',desc:'稳扎稳打的一天，不宜冒进。耐心处理手头事务，傍晚有好消息。',color:'黄色',num:'5,0'},
    {lucky:'虎',desc:'精力充沛，适合运动和社交。注意控制脾气，避免口舌之争。',color:'绿色',num:'1,6'},
    {lucky:'兔',desc:'心情愉悦，人际关系和谐。适合学习新知识，有贵人暗助。',color:'粉色',num:'4,9'},
    {lucky:'龙',desc:'今日有转折之象，保持开放心态。不宜大额消费，宜守不宜攻。',color:'金色',num:'2,7'},
    {lucky:'蛇',desc:'直觉敏锐，适合做决策。注意休息，不可过度劳累。',color:'红色',num:'3,8'},
    {lucky:'马',desc:'行动力强，适合推进停滞的项目。注意与上级的沟通方式。',color:'橙色',num:'1,6'},
    {lucky:'羊',desc:'平和安稳的一天，适合整理和规划。感情上有小惊喜。',color:'棕色',num:'5,0'},
    {lucky:'猴',desc:'机灵聪慧，适合谈判和交流。注意保管好随身物品。',color:'白色',num:'4,9'},
    {lucky:'鸡',desc:'今日宜静不宜动，适合独处思考。健康方面注意呼吸系统。',color:'银色',num:'2,7'},
    {lucky:'狗',desc:'忠诚有报，付出的努力会得到认可。适合与老朋友联系。',color:'黄色',num:'3,8'},
    {lucky:'猪',desc:'福气满满，财运不错。注意饮食节制，不可贪杯。',color:'黑色',num:'1,6'}
  ];
  let f=fortunes[dateHash%12];
  let el=document.getElementById('wxDailyFortune');
  if(el) el.innerHTML='<div style="margin-bottom:8px">🎲 生肖运势：<b style="color:var(--gold)">'+f.lucky+'</b></div>'+f.desc+'<div style="margin-top:8px;font-size:12px">🎨 幸运色：'+f.color+' · 🔢 幸运数字：'+f.num+'</div><div style="margin-top:6px;font-size:11px;color:var(--paper3)">仅供娱乐参考</div>';
}

// 吉日查询
function loadJiri(){
  let now=new Date();
  let weekdays=['日','一','二','三','四','五','六'];
  let suits=['祭祀','祈福','求嗣','出行','嫁娶','搬家','开市','交易','签约','入学','求职','就医','动土','安葬','修造'];
  let avoids=['动土','开市','嫁娶','出行','安葬','签约','搬家','诉讼','远行','剃头','针灸','破土'];
  let dHash=(now.getFullYear()*1000+now.getMonth()*31+now.getDate());
  let yi=suits[dHash%15]+','+suits[(dHash+3)%15];
  let ji=avoids[dHash%12]+','+avoids[(dHash+5)%12];
  let el=document.getElementById('wxJiri');
  if(el) el.innerHTML='<div style="margin-bottom:6px">📅 '+now.getMonth()+1+'月'+now.getDate()+'日 星期'+weekdays[now.getDay()]+'</div><div style="color:var(--jade2)">✅ 宜：'+yi+'</div><div style="color:var(--cinn2)">⚠️ 忌：'+ji+'</div><div style="margin-top:6px;font-size:11px;color:var(--paper3)">传统文化参考</div>';
}

// 智慧语录
function loadQuote(){
  if(typeof WisdomQuotes==='undefined') return;
  let today=new Date();
  let dateStr=today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
  let quotes=WisdomQuotes.getDailyQuotes(dateStr);
  if(quotes&&quotes.length>0){
    let el1=document.getElementById('wxQuoteText');
    let el2=document.getElementById('wxQuoteSource');
    if(el1) el1.textContent=quotes[0].text;
    if(el2) el2.textContent='—— '+quotes[0].source;
  }
}

// 每日口诀
function loadKoujue(){
  if(typeof KOUJUE_DB==='undefined'||!KOUJUE_DB.length){document.getElementById('wxKoujue').innerHTML='<div class="koujue-card"><div class="koujue-text">口诀库加载中...</div></div>';return}
  let now=new Date();
  let idx=(now.getFullYear()*1000+now.getMonth()*31+now.getDate())%KOUJUE_DB.length;
  let k=KOUJUE_DB[idx];
  let el=document.getElementById('wxKoujue');
  if(el) el.innerHTML='<div class="koujue-card"><div class="koujue-text">'+(k.text||k.content||k.koujue||JSON.stringify(k).substring(0,200))+'</div><div class="koujue-cat">'+(k.category||k.cat||'命理口诀')+'</div></div>';
}

// 生肖网格
function loadZodiacGrid(){
  let signs=['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  let emojis=['🐭','🐮','🐯','🐰','🐉','🐍','🐴','🐑','🐵','🐔','🐶','🐷'];
  let html='';
  for(let i=0;i<12;i++){
    html+='<ml-tap class="zodiac-item" onclick="wxShowZodiac(\''+signs[i]+'\')" variant="card" role="button" tabindex="0"><span class="emoji">'+emojis[i]+'</span><span class="name">'+signs[i]+'</span></ml-tap>';
  }
  let el=document.getElementById('wxZodiacGrid');
  if(el) el.innerHTML=html;
}
function wxShowZodiac(sign){
  if(typeof ZODIAC_COMPLETE==='undefined') return;
  let bf=ZODIAC_COMPLETE.benmingfo[sign];
  let yd=ZODIAC_COMPLETE.yearly_2025[sign];
  let html='';
  if(bf) html+='<div style="margin-bottom:10px"><b style="color:var(--gold)">🙏 本命佛：</b>'+bf.buddha+'<br><span style="font-size:12px;color:var(--paper2)">'+bf.meaning.substring(0,100)+'...</span></div>';
  if(yd) html+='<div><b style="color:var(--gold)">🌟 2025蛇年：</b><span style="color:'+(yd.relation.indexOf('冲')>=0?'var(--cinn2)':yd.relation.indexOf('合')>=0?'var(--jade2)':'var(--gold)')+'">'+yd.relation+'</span><br><span style="font-size:12px;color:var(--paper2)">'+yd.overview.substring(0,150)+'...</span></div>';
  let el=document.getElementById('wxZodiacDetail');
  if(el){el.innerHTML=html;el.style.display='block'}
}

// 12时辰养生
function loadShichen(){
  if(typeof FAITH_GUIDE==='undefined'||!FAITH_GUIDE.shichenGuide) return;
  let html='';
  FAITH_GUIDE.shichenGuide.forEach(function(s){
    html+='<div class="shichen-item"><span class="shichen-time">'+s.shichen+' '+s.time+'</span><span class="shichen-organ">'+s.organ+'</span><span class="shichen-advice">'+s.advice.substring(0,30)+'...</span></div>';
  });
  let el=document.getElementById('wxShichenList');
  if(el) el.innerHTML=html;
}

// 节气养生
function loadJieqi(){
  if(typeof FAITH_GUIDE==='undefined'||!FAITH_GUIDE.jieqiGuide) return;
  let now=new Date();
  let month=now.getMonth()+1;
  let idx=(month-1)*2+(now.getDate()>=15?1:0);
  if(idx>23) idx=23;
  let j=FAITH_GUIDE.jieqiGuide[idx];
  let el=document.getElementById('wxJieqi');
  if(el&&j) el.innerHTML='<div style="margin-bottom:8px"><b style="color:var(--gold)">'+j.jieqi+'</b> · 养'+j.organ+'</div><div style="font-size:12px;color:var(--paper2);line-height:1.8"><b>原则：</b>'+j.principle+'<br><b>食材：</b>'+j.foods+'<br><b>运动：</b>'+j.exercise+'<br><b>禁忌：</b>'+j.taboo+'</div>';
}

// 八字简化版
function wxBaziCalc(){
  let dateStr=document.getElementById('wxBaziDate').value;
  let hourIdx=parseInt(document.getElementById('wxBaziHour').value);
  if(!dateStr){showToast('请选择出生日期');return}
  let parts=dateStr.split('-');
  let year=parseInt(parts[0]),month=parseInt(parts[1]),day=parseInt(parts[2]);
  // 简化排盘
  let stems=['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  let branches=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  let yearGz=stems[(year-4)%10]+branches[(year-4)%12];
  let monthGz=stems[((year-4)%10*2+month)%10]+branches[(month+1)%12];
  let dayGzIdx=(year*365+month*30+day)%60;
  let dayGz=stems[dayGzIdx%10]+branches[dayGzIdx%12];
  let hourGz=stems[(dayGzIdx%10*2+hourIdx)%10]+branches[hourIdx];
  let el=document.getElementById('wxBaziResult');
  if(el){
    el.style.display='block';
    el.innerHTML='<div style="font-size:13px;line-height:2"><b style="color:var(--gold)">年柱：</b>'+yearGz+' <b style="color:var(--gold)">月柱：</b>'+monthGz+' <b style="color:var(--gold)">日柱：</b>'+dayGz+' <b style="color:var(--gold)">时柱：</b>'+hourGz+'</div><div style="font-size:11px;color:var(--paper3);margin-top:6px">⚠️ 简化排盘，完整排盘请访问PC端。仅供娱乐参考。</div><a class="btn" href="./divination-hub.html#section-bazi" style="font-size:12px;padding:8px">查看完整排盘 →</a>';
  }
}

// 测字
function wxCeziCalc(){
  let ch=document.getElementById('wxCeziInput').value;
  if(!ch){showToast('请输入一个字');return}
  if(typeof CEZI_DATABASE!=='undefined'&&CEZI_DATABASE[ch]){
    let d=CEZI_DATABASE[ch];
    let el=document.getElementById('wxCeziResult');
    if(el){el.style.display='block';el.innerHTML='<div style="font-size:13px;color:var(--paper)">'+(d.meaning||d.intro||'字义分析完成')+'</div><div style="font-size:11px;color:var(--paper3);margin-top:4px">仅供娱乐参考</div>'}
  }else{
    let el=document.getElementById('wxCeziResult');
    if(el){el.style.display='block';el.innerHTML='<div style="font-size:13px;color:var(--paper2)">「'+ch+'」字分析：该字笔画结构独特，寓意深远。具体分析请访问完整版测字引擎。</div><div style="font-size:11px;color:var(--paper3);margin-top:4px">仅供娱乐参考</div>'}
  }
}

// 打卡
function wxCheckin(){
  let key='wx_checkin_'+new Date().toISOString().slice(0,10);
  let streak=parseInt(localStorage.getItem('wx_checkin_streak')||'0');
  let lastDate=localStorage.getItem('wx_checkin_last');
  let today=new Date().toISOString().slice(0,10);
  if(lastDate===today){showToast('今日已打卡！');updateCheckinCount();return}
  // 计算连续天数
  let yesterday=new Date(Date.now()-86400000).toISOString().slice(0,10);
  if(lastDate===yesterday) streak++;
  else streak=1;
  localStorage.setItem('wx_checkin_last',today);
  localStorage.setItem('wx_checkin_streak',streak);
  localStorage.setItem(key,'1');
  showToast('打卡成功！连续第'+streak+'天 🎉');
  updateCheckinCount();
}
function updateCheckinCount(){
  let streak=parseInt(localStorage.getItem('wx_checkin_streak')||'0');
  let el=document.getElementById('wxCheckinCount');
  if(el) el.textContent='连续打卡 '+streak+' 天';
}

// ===== 反馈系统相关 =====
let wxFbType = null;
let wxFbTarget = null;
let wxFbScreenshot = null;

function wxSelectFbType(el) {
  document.querySelectorAll('.fb-type-item').forEach(function(item) { item.classList.remove('selected'); });
  el.classList.add('selected');
  wxFbType = el.getAttribute('data-fb-type');
}

function wxSelectFbTarget(el) {
  document.querySelectorAll('.fb-target-item').forEach(function(item) { item.classList.remove('selected'); });
  el.classList.add('selected');
  wxFbTarget = el.getAttribute('data-fb-target');
}

function wxHandleUpload(input) {
  let file = input.files[0];
  if (!file) return;
  if (file.size > 1024 * 1024) {
    wxFbToast('⚠️', '图片不能超过1MB');
    input.value = '';
    return;
  }
  let reader = new FileReader();
  reader.onload = function(e) {
    wxFbScreenshot = e.target.result;
    let preview = document.getElementById('wxFbPreview');
    preview.style.display = 'block';
    preview.innerHTML = '<img src="' + wxFbScreenshot + '" style="max-width:100%;border-radius:8px;margin-top:4px"><div style="font-size:11px;color:var(--paper3);margin-top:4px">点击图片可重新选择</div>';
    preview.onclick = function() { document.getElementById('wxFbScreenshot').click(); };
    document.getElementById('wxFbUploadBox').textContent = '📷 已选择截图';
  };
  reader.readAsDataURL(file);
}

function wxSubmitFeedback() {
  if (!wxFbType) {
    wxFbToast('⚠️', '请选择反馈类型');
    return;
  }
  if (!wxFbTarget) {
    wxFbToast('⚠️', '请选择反馈对象');
    return;
  }
  let content = document.getElementById('wxFeedbackContent').value;
  if (!content || !content.trim()) {
    wxFbToast('⚠️', '请填写反馈内容');
    return;
  }
  if (typeof FEEDBACK_SYSTEM === 'undefined') {
    wxFbToast('⚠️', '反馈系统未加载');
    return;
  }
  let result = FEEDBACK_SYSTEM.submit(wxFbType, content, wxFbTarget, wxFbScreenshot);
  if (result.success) {
    let msg = '获得 ' + result.points + ' 积分';
    if (result.streakBonus > 0) {
      msg += '\n连续' + result.streak + '天 + ' + result.streakBonus + ' 积分';
    }
    msg += '\n当前积分：' + result.totalPoints;
    wxFbToast('🎉', msg);
    // 重置表单
    document.querySelectorAll('.fb-type-item, .fb-target-item').forEach(function(item) { item.classList.remove('selected'); });
    document.getElementById('wxFeedbackContent').value = '';
    document.getElementById('wxFbPreview').style.display = 'none';
    document.getElementById('wxFbUploadBox').textContent = '📷 点击上传截图';
    document.getElementById('wxFbScreenshot').value = '';
    wxFbType = null;
    wxFbTarget = null;
    wxFbScreenshot = null;
    // 刷新显示
    wxLoadFeedbackInfo();
    wxLoadFeedbackHistory();
  } else {
    wxFbToast('⚠️', result.message);
  }
}

function wxFbToast(icon, text) {
  let existing = document.getElementById('wxFbToast');
  if (existing) existing.remove();
  let toast = document.createElement('div');
  toast.id = 'wxFbToast';
  toast.className = 'fb-toast';
  toast.innerHTML = '<span class="toast-icon">' + icon + '</span><span class="toast-text">' + text.replace(/\n/g, '<br>') + '</span>';
  document.body.appendChild(toast);
  setTimeout(function() { toast.classList.add('show'); }, 10);
  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 2500);
}

function wxLoadFeedbackInfo() {
  if (typeof FEEDBACK_SYSTEM === 'undefined') return;
  let points = FEEDBACK_SYSTEM.getPoints();
  let streak = FEEDBACK_SYSTEM.getStreak();
  let el1 = document.getElementById('wxPointsNum');
  if (el1) el1.textContent = points;
  let el2 = document.getElementById('wxStreakBadge');
  if (el2) {
    if (streak > 0) {
      el2.style.display = 'inline-block';
      el2.textContent = '🔥 连续反馈 ' + streak + ' 天';
    } else {
      el2.style.display = 'none';
    }
  }
}

function wxLoadFeedbackHistory() {
  if (typeof FEEDBACK_SYSTEM === 'undefined') return;
  let history = FEEDBACK_SYSTEM.getHistory();
  let el = document.getElementById('wxFeedbackHistory');
  if (!el) return;
  if (history.length === 0) {
    el.innerHTML = '<div style="text-align:center;color:var(--paper3);font-size:12px;padding:12px">暂无反馈记录</div>';
    return;
  }
  let statusMap = { pending: '待处理', adopted: '已采纳', rejected: '已忽略' };
  let statusColor = { pending: 'var(--paper3)', adopted: 'var(--jade2)', rejected: 'var(--cinn2)' };
  el.innerHTML = history.slice(0, 10).map(function(item) {
    return '<div class="fb-history-item">' +
      '<div class="fb-h-type">' + item.typeLabel + ' · ' + item.targetLabel + ' · <span style="color:' + (statusColor[item.status] || 'var(--paper3)') + '">' + (statusMap[item.status] || item.status) + '</span></div>' +
      '<div class="fb-h-content">' + item.content + '</div>' +
      '<div class="fb-h-meta">+' + item.points + '积分 · ' + (item.streakBonus > 0 ? '连续+' + item.streakBonus + ' · ' : '') + item.date + '</div>' +
    '</div>';
  }).join('');
}

function wxShowExchange() {
  if (typeof FEEDBACK_SYSTEM === 'undefined') return;
  let card = document.getElementById('wxExchangeCard');
  let list = document.getElementById('wxExchangeList');
  if (!card || !list) return;
  let rules = FEEDBACK_SYSTEM.getExchangeRules();
  let points = FEEDBACK_SYSTEM.getPoints();
  list.innerHTML = rules.map(function(r) {
    let canAfford = points >= r.points;
    return '<div class="exchange-card">' +
      '<div class="ex-info"><div class="ex-label">' + r.label + '</div>' +
      '<div class="ex-cost">需要 ' + r.points + ' 积分' + (canAfford ? '' : '（还差 ' + (r.points - points) + '）') + '</div></div>' +
      '<button class="ex-btn" onclick="wxExchange(\'' + r.id + '\')"' + (canAfford ? '' : ' disabled') + '>兑换</button>' +
    '</div>';
  }).join('');
  card.style.display = 'block';
  card.scrollIntoView({ behavior: 'smooth' });
}

function wxExchange(ruleId) {
  if (typeof FEEDBACK_SYSTEM === 'undefined') return;
  let result = FEEDBACK_SYSTEM.exchange(ruleId);
  if (result.success) {
    wxFbToast('🎁', result.message + '\n剩余积分：' + result.remainingPoints);
    wxLoadFeedbackInfo();
    wxShowExchange();
  } else {
    wxFbToast('⚠️', result.message);
  }
}

// R86-R88: 微信端 AI 报告入口
function wxAIReport(){
  var mod=document.getElementById('wxModSel').value||'general';
  var out=document.getElementById('wxAIResult');
  if(!out){return;}
  out.innerHTML='<div class="card-text" style="text-align:center;color:#999">⏳ 正在生成报告...</div>';
  if(typeof ReportEngine==='undefined'){
    out.innerHTML='<div class="card-text" style="color:#f59e0b">⚠️ 引擎未加载，请刷新页面</div>';
    return;
  }
  var data={source:'wechat',ts:Date.now()};
  try{var bd=document.getElementById('wxBirthday');if(bd)data.birthday=bd.value;}catch(e){}
  try{var sx=document.getElementById('wxSex');if(sx)data.sex=sx.value;}catch(e){}
  try{var hr=document.getElementById('wxHour');if(hr)data.hour=hr.value;}catch(e){}
  ReportEngine.generate({module:mod,data:data,adapter:'wechat',container:out}).then(function(r){
    console.log('[wechat] ReportEngine',r.source);
  }).catch(function(e){
    out.innerHTML='<div class="card-text" style="color:#f59e0b">⚠️ 生成失败：'+e.message+'</div>';
  });
}

// 初始化
loadDailyFortune();
loadJiri();
loadQuote();
loadKoujue();
loadZodiacGrid();
loadShichen();
loadJieqi();
updateCheckinCount();
wxLoadFeedbackInfo();
wxLoadFeedbackHistory();
