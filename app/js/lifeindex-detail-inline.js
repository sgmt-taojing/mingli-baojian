
const ELEMENTS = {'金':85,'木':78,'水':82,'火':88,'土':90};
const ELE_FOCUS = {'金':'锐进+决策+果断','木':'生发+成长+学习','水':'智慧+灵活+沉浸','火':'表达+热情+领导','土':'稳重+承担+储蓄'};
const ELE_KEYS = window.WX_KEYS || {
  '金':['金','银','金融','财','金属','锐','商业','理财'],
  '木':['木','林','学','教育','书','生长','花','成长'],
  '水':['水','海','智慧','智','流动','冥想','灵活'],
  '火':['火','光','表演','演讲','热','能量','表达'],
  '土':['土','建筑','稳','田','地产','山','健康','承担']
};
const DIMS = [
  {key:'shiye',name:'事业',icon:'💼',weight:0.20,focus:'职业三跳+管理进阶'},
  {key:'caiyun',name:'财运',icon:'💰',weight:0.15,focus:'稳健理财+多元收入'},
  {key:'jiankang',name:'健康',icon:'💪',weight:0.20,focus:'运动+饮食+作息'},
  {key:'hunyin',name:'婚姻',icon:'💑',weight:0.15,focus:'沟通+包容+共同成长'},
  {key:'xueye',name:'学业',icon:'📚',weight:0.10,focus:'学历+证书+终身学习'},
  {key:'jiating',name:'家庭',icon:'🏡',weight:0.04,focus:'子女教育+亲情'},
  {key:'renji',name:'人际',icon:'🤝',weight:0.04,focus:'深度关系+同行圈子'},
  {key:'jingshen',name:'精神',icon:'🎭',weight:0.04,focus:'信仰+哲学+艺术'},
  {key:'xiangfu',name:'享福',icon:'🌸',weight:0.02,focus:'体验+旅行+生活品质'},
  {key:'shouyuan',name:'寿元',icon:'🍵',weight:0.02,focus:'养生+保健+定期体检'},
  {key:'fengwu',name:'风物',icon:'🏔️',weight:0.02,focus:'名山大川·物候观察·四季体验'},
  {key:'xiuyang',name:'修养',icon:'🎋',weight:0.02,focus:'禅·茶·琴·书·静心修习'}
];

// R41-DR1：12 维度五行权重偏差已提取到 app/js/wx-dim-bias.js 共享
const WX_DIM_BIAS = window.WX_DIM_BIAS || {
  '金':{shiye:+6,caiyun:+8,jiankang:+2,hunyin:+1,xueye:+1,jiating:0,renji:+1,jingshen:0,xiangfu:+1,shouyuan:+1,fengwu:+1,xiuyang:+1},
  '木':{shiye:+2,caiyun:+2,jiankang:+2,hunyin:+1,xueye:+8,jiating:+1,renji:+2,jingshen:+6,xiangfu:+2,shouyuan:+2,fengwu:+5,xiuyang:+5},
  '水':{shiye:+2,caiyun:+2,jiankang:+1,hunyin:+2,xueye:+6,jiating:0,renji:+6,jingshen:+7,xiangfu:+1,shouyuan:+2,fengwu:+2,xiuyang:+6},
  '火':{shiye:+5,caiyun:+3,jiankang:+2,hunyin:+4,xueye:+1,jiating:+1,renji:+5,jingshen:+2,xiangfu:+4,shouyuan:+1,fengwu:+2,xiuyang:+3},
  '土':{shiye:+2,caiyun:+2,jiankang:+6,hunyin:+2,xueye:+1,jiating:+6,renji:+1,jingshen:+2,xiangfu:+3,shouyuan:+7,fengwu:+4,xiuyang:+5}
};

function generate(){
  const btn=document.getElementById('genBtn');
  btn.disabled=true; btn.textContent='⏳ 生成中...';
  setTimeout(()=>{
    try{
      const ele=document.getElementById('liEle').value;
      const age=parseInt(document.getElementById('liAge').value)||32;
      const focus=document.getElementById('liFocus').value.trim();
      const extra=document.getElementById('liExtra').value.trim();
      const userText=(focus+' '+extra).trim();
      const base=ELEMENTS[ele]||85;
      let boost=0;
      (ELE_KEYS[ele]||[]).forEach(k=>{ if(userText.includes(k)) boost+=3; });
      const result=DIMS.map(d=>{
        let bias=(WX_DIM_BIAS[ele] && WX_DIM_BIAS[ele][d.key]) || 0;
        if(d.weight<=0.04) bias-=2;
        const noise=Math.floor(Math.abs(Math.sin(d.key.charCodeAt(0)*age))*8)-4;
        const score=Math.max(30,Math.min(99,Math.round(base*0.7+d.weight*100+boost+bias+noise)));
        return {...d,score,bias:bias>0?`+${bias}`:bias<0?`${bias}`:''};
      });
      const total=Math.round(result.reduce((s,d)=>s+d.score*d.weight,0));
      const sorted=[...result].sort((a,b)=>b.score-a.score);
      const top3=sorted.slice(0,3).map(d=>d.name);
      const bot2=sorted.slice(-2).map(d=>d.name);
      let grade=total>=85?'上等命格':total>=75?'中上命格':total>=65?'中等等格':total>=55?'中下等格':'下等命格';
      const actions=[
        `【扬长】强化${top3[0]}与${top3[1]||top3[0]}领域，每周投入 5 小时专项`,
        `【补短】针对性提升${bot2[0]}维度，建立月度复盘`,
        `【节奏】建立每周一次自我审视，每月一次关键关系回顾`,
        `【健康】每周运动 ≥ 3 次，作息固定 11 点前入睡`,
        `【财务】月度预算 + 季度资产盘点，年度投资复盘`,
        `【精神】每月 1 次深度阅读/艺术/冥想，滋养精神空间`,
        `【人际】每年新增 5 位高质量同行者，深度关系维护`,
        `【学习】每年 2 本专业书 + 1 项新技能认证`,
        `【家庭】每周家庭日固定，每月至少 1 次家庭出行`,
        `【规划】每季度 OKR 设定 + 年度战略回顾`
      ];
      const next5=[
        {y:1,t:`扬长：强化优势领域（${top3[0]}${top3[1]?'+'+top3[1]:''}）主键能力`},
        {y:2,t:`补短：针对性提升${bot2[0]}领域`},
        {y:3,t:'人生换挡期：尝试差异化路径'},
        {y:4,t:'中段汇总：成果回顾'},
        {y:5,t:'中期锁势：进入下个五年计划'}
      ];
      const summary=`${age}岁，五行属${ele}（${ELE_FOCUS[ele]}），生命指数综合 ${total} 分，${grade}。优势区：${top3.join('、')}。待提升：${bot2.join('、')}。建议聚焦扬长 + 补短并行。`;
      render({ele,age,total,grade,result,top3,bot2,actions,next5,summary,focus,extra});
      btn.disabled=false; btn.textContent='🔄 重新生成';
    }catch(e){
      alert('生成失败：'+e.message);
      btn.disabled=false; btn.textContent='✨ 生成生命指数';
    }
  }, 250);
}

function render(d){
  let h='<div class="banner"><div class="ele">'+d.ele+' · '+d.age+'</div>';
  h+='<div class="total">'+d.total+' <small>/ 100</small></div>';
  h+='<div class="grade">'+d.grade+'</div>';
  h+='<div class="focus">'+ELE_FOCUS[d.ele]+'</div>';
  h+='<div style="margin-top:10px"><span class="ele-tag">'+d.ele+'主属</span></div></div>';

  h+='<div class="card"><h2>📊 12 维度评分</h2><div class="dims">';
  d.result.forEach(r=>{
    h+='<div class="dim"><div class="ico">'+r.icon+'</div><div class="info"><div class="nm"><b>'+r.name+'</b><span style="opacity:.95;font-size:10px">'+r.bias+'</span></div><div class="focus">'+r.focus+'</div></div><div class="num">'+r.score+'</div></div>';
  });
  h+='</div></div>';

  h+='<div class="card"><h2>🎯 优势 vs 待提升</h2><div class="top-bot">';
  h+='<div class="tb-card top"><h3>✅ 优势 Top3</h3><ul>';
  d.top3.forEach(n=>h+='<li>• '+n+'</li>');
  h+='</ul></div>';
  h+='<div class="tb-card bot"><h3>⚠️ 待提升</h3><ul>';
  d.bot2.forEach(n=>h+='<li>• '+n+'</li>');
  h+='</ul></div></div></div>';

  h+='<div class="card"><h2>🔮 未来 5 年步进</h2><div class="fy">';
  d.next5.forEach(p=>h+='<div class="fy-row"><span class="fy-y">第 '+p.y+' 年</span><span>'+p.t+'</span></div>');
  h+='</div></div>';

  h+='<div class="card"><h2>✅ 行动清单（10 条）</h2><ol class="ol">';
  d.actions.forEach(a=>h+='<li>'+a+'</li>');
  h+='</ol></div>';

  h+='<div class="card"><h2>📜 总评</h2><div class="summary">'+d.summary+'</div></div>';

  // Edge-TTS 试听按钮（调用 8912 端口服务生成语音）
  h+='<div class="card"><h2>🔊 总评语音试听</h2><div class="tts-row"><button class="tts-btn" onclick="ttsSpeak(\''+d.ele+'\','+d.age+',\''+encodeURIComponent(d.summary).replace(/'/g,'\\\'')+'\')">⚡ 生成语音</button><span class="tts-hint">点击调用 edge-tts 服务生成语音片段</span></div><audio id="tts-audio" controls style="width:100%;margin-top:10px;display:none"></audio></div>';

  h+='<div class="tools"><button onclick="shareUrl()">🔗 分享链接</button><button onclick="window.print()">🖨️ 打印/保存 PDF</button><button onclick="copyTxt()">📋 复制文本</button></div>';

  document.getElementById('report').innerHTML=h;
  document.getElementById('report').classList.add('show');
  document.getElementById('input').style.display='none';
  location.hash='#'+btoa(unescape(encodeURIComponent(JSON.stringify({ele:d.ele,age:d.age,focus:d.focus,extra:d.extra}))));
}

function restoreFromHash(){
  const h=location.hash.slice(1);
  if(!h) return;
  try{
    const d=JSON.parse(decodeURIComponent(escape(atob(h))));
    if(d.ele) document.getElementById('liEle').value=d.ele;
    if(d.age) document.getElementById('liAge').value=d.age;
    if(d.focus) document.getElementById('liFocus').value=d.focus;
    if(d.extra) document.getElementById('liExtra').value=d.extra;
    generate();
  }catch(e){}
}

function shareUrl(){
  const url=location.href;
  if(navigator.share){navigator.share({title:'生命指数全鉴',url}).catch(()=>{});}
  else if(navigator.clipboard){navigator.clipboard.writeText(url).then(()=>showToast('链接已复制'));}
  else prompt('复制链接分享：',url);
}

function copyTxt(){
  if(navigator.clipboard){navigator.clipboard.writeText(document.getElementById('report').innerText).then(()=>showToast('已复制'));}
}

// Edge-TTS 试听：调用 8912 服务。文本来自诊断总结。
async function ttsSpeak(ele, age, summaryEncoded){
  const summary = decodeURIComponent(summaryEncoded);
  const audio = document.getElementById('tts-audio');
  const btn = document.querySelector('.tts-btn');
  if(!audio || !btn) return;
  if(btn.classList.contains('loading')) return;
  btn.classList.add('loading');
  btn.textContent = '⏳ 生成中...';
  try{
    const resp = await fetch('http://127.0.0.1:8912/api/tts?text=' + encodeURIComponent(summary) + '&voice=female');
    if(!resp.ok) throw new Error('TTS 服务返回 '+resp.status);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    audio.src = url;
    audio.style.display='block';
    audio.play().catch(()=>{});
    showToast('✅ 语音已生成·点击播放');
    btn.classList.remove('loading');
    btn.textContent = '⚡ 重新生成';
  }catch(e){
    showToast('⚠️ edge-tts 服务未起（8912）· 已降级浏览器朗读');
    btn.classList.remove('loading');
    btn.textContent = '⚡ 生成语音';
    // 降级浏览器
    if(window.speechSynthesis){
      const u = new SpeechSynthesisUtterance(summary);
      u.lang='zh-CN'; u.rate=0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }
}

function showToast(m){
  const t=document.createElement('div');
  t.textContent=m;
  t.style.cssText='position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(201,168,76,.9);color:#0a0a0a;padding:10px 24px;border-radius:8px;font-size:14px;z-index:1000';
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),1800);
}

window.addEventListener('DOMContentLoaded',restoreFromHash);
