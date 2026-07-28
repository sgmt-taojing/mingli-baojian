
// R41-DR1：WX_MUSIC 由 wx-dim-bias.js 共享（15 详脈同源）— 本页需 music 补充字段（key/feel/suitable/ttsText）
const WX_MUSIC = window.WX_MUSIC || {
  '金':{key:'商音',feel:'清亮高远',suitable:['愤怒','急躁'],ttsText:'商音清亮高远，主金主肺。适合愤怒急躁时听，有助于收敛心神。'},
  '木':{key:'角音',feel:'生机盎然',suitable:['疲劳','低沉'],ttsText:'角音生机盎然，主木主肝。适合疲劳低沉时听，能生发阳气。'},
  '水':{key:'羽音',feel:'悠远深邃',suitable:['焦虑','失眠','多梦'],ttsText:'羽音悠远深邃，主水主肾。适合焦虑失眠多梦时听，能滋阴降火。'},
  '火':{key:'徵音',feel:'热烈欢快',suitable:['抑郁','冷淡'],ttsText:'徵音热烈欢快，主火主心。适合抑郁冷淡时听，能振奋精神。'},
  '土':{key:'宫音',feel:'沉稳厚重',suitable:['焦虑','失眠','悲伤'],ttsText:'宫音沉稳厚重，主土主脾胃。建议在安静房间聆听，配合深呼吸。适合焦虑失眠悲伤。'}
};

const WX_SCENE_TIP = {
  '晨起':'建议清晨阳光中聆听，配合深呼吸。',
  '工作间歇':'建议工位旁小音量，闭眼 3 分钟。',
  '睡前':'建议卧室弱光环境，音量渐弱。',
  '冥想':'建议坐姿端正，调息均匀。',
  '运动后':'建议平躺或拉伸时聆听，舒展筋骨。'
};

// 7 日疗程节奏
const CYCLE_7 = [
  {day:'第1-2 天',focus:'适应',tip:'建立聆听仪式感，先体验不评判'},
  {day:'第3-4 天',focus:'深化',tip:'每次专注聆听 30 分钟，体会音律变化'},
  {day:'第5-6 天',focus:'内化',tip:'结合呼吸与身体感受，感受音律共鸣'},
  {day:'第 7 天',focus:'总结',tip:'回顾 7 日变化，写下体悟笔记'}
];

function generate(){
  const btn = document.getElementById('genBtn');
  btn.disabled = true;
  btn.textContent = '⏳ 生成中...';
  setTimeout(()=>{
    try{
      const emo = document.getElementById('mEmotion').value.trim() || '焦虑';
      const ele = document.getElementById('mElement').value;
      const scene = document.getElementById('mScene').value;
      const extra = document.getElementById('mExtra').value.trim();

      const five = WX_MUSIC[ele];
      const intro = `根据您"${emo}"的情志状态，结合"${ele}"行能量，为您推荐${five.key}（${five.feel}）。${WX_SCENE_TIP[scene]}${extra?'附加诉求：'+extra+'。':''}建议每日聆听 30 分钟，连续 7 天一个疗程。`;

      // 5 段播放列表
      const playList = [
        {name:'五行'+five.key+'·开篇引导',duration:120,ttsText:'欢迎聆听'+five.key+'音乐疗愈。'+five.ttsText},
        {name:'古琴'+five.key.slice(0,1)+'调·净心曲',duration:600,ttsText:'接下来为您演奏古琴调，'+five.feel+'音律，静心始然。'},
        {name:'五行'+five.key+'·主曲',duration:600,ttsText:'进入主曲阶段。'+five.ttsText},
        {name:'颂钵'+five.key+'·收束',duration:300,ttsText:'请深吸一口气，与'+five.key+'共鸣。闭眼，静听。'},
        {name:'轻推荐·同类补充',duration:480,ttsText:'可考虑'+five.suitable.slice(0,3).join('、')+'类情境中继续聆听。'}
      ];

      // 10 条行动清单
      const actions = [
        '【仪式】固定时间聆听（建议晨起或睡前），建立每日节律',
        '【环境】'+WX_SCENE_TIP[scene],
        '【专注】每次 30 分钟，避免手机/工作干扰',
        '【呼吸】深吸-缓呼 4-7-8 节律，与'+five.key+'同步',
        '【笔记】每日写下 1-2 句聆听感受，月底回看',
        '【饮食】配合'+ele+'行食物（金：白萝卜/银耳；木：菠菜/绿豆；水：黑芝麻/海带；火：红枣/苦瓜；土：山药/小米）',
        '【穴位】按揉'+WX_ACU[ele]+'，配合聆听效果更佳',
        '【疗程】7 日一循环，每年至少 3 个疗程（节气切换）',
        '【社交】加入聆听小组，分享体验与体悟',
        '【升级】3 个月后尝试同源推荐：'+WX_RELATE[ele]
      ];

      const summary = `${ele}行主导·${five.key}推荐（${five.feel}）。适合情志：${five.suitable.join('、')}。建议 ${scene} 场景聆听，7 日疗程循序深化。`;

      render({emo,ele,five,intro,playList,actions,summary,scene,extra});
      btn.disabled = false;
      btn.textContent = '🔄 重新生成';
    }catch(e){
      showToast('生成失败：'+e.message);
      btn.disabled = false;
      btn.textContent = '✨ 生成疗愈方案';
    }
  }, 250);
}

// 五行穴位 + 同源推荐（丰富内容）
const WX_ACU = {
  '金':'太渊·列缺·肺俞（收敛肺气）',
  '木':'太冲·行间·肝俞（疏肝理气）',
  '水':'太溪·照海·肾俞（滋养肾阴）',
  '火':'神门·内关·心俞（清心安神）',
  '土':'太白·足三里·脾俞（健脾和胃）'
};
const WX_RELATE = {
  '金':'宫音（土）听"稳重"调养，平衡肺金过锐',
  '木':'徵音（火）听"热烈"激发，平衡肝木过柔',
  '水':'角音（木）听"生发"激活，平衡肾水过沉',
  '火':'羽音（水）听"悠远"收敛，平衡心火过亢',
  '土':'商音（金）听"清亮"提升，平衡脾土过滞'
};

function render(d){
  let h = '<div class="banner">';
  h += '<div class="ele">'+d.ele+'</div>';
  h += '<div class="key">'+d.five.key+' · '+d.five.feel+'</div>';
  h += '<div class="feel">情志：'+d.five.suitable.join(' · ')+'</div>';
  h += '</div>';

  // intro
  h += '<div class="card"><h2>🎼 疗愈方案</h2><div class="intro">'+d.intro+'</div></div>';

  // 5 段播放列表
  h += '<div class="card"><h2>🎵 5 段聆听路径</h2><div class="pl-list">';
  d.playList.forEach((p,i)=>{
    h += '<div class="pl-item">';
    h += '<div class="pl-num">'+(i+1)+'</div>';
    h += '<div class="pl-info">';
    h += '<b>'+p.name+'</b>';
    h += '<small>⏱ '+p.duration+' 秒</small>';
    h += '<div class="pl-tts">'+p.ttsText+'</div>';
    h += '</div>';
    h += '<button class="pl-play" onclick="ttsPlaySegment(\''+i+'\', \''+encodeURIComponent(p.ttsText).replace(/'/g,'\\\'')+'\', '+p.duration+')">▶ 试听</button>';
    h += '</div>';
  });
  h += '</div></div>';

  // 7 日疗程
  h += '<div class="card"><h2>📅 7 日疗程节奏</h2><div class="cycle">';
  CYCLE_7.forEach(c=>{
    h += '<div class="cycle-row"><span class="cycle-day">'+c.day+'</span><b style="color:var(--gold2);min-width:50px">'+c.focus+'</b><span style="font-size:12px;opacity:.85">'+c.tip+'</span></div>';
  });
  h += '</div></div>';

  // 同源推荐
  h += '<div class="card"><h2>🔄 同源推荐</h2><div class="compat">'+WX_RELATE[d.ele]+'</div></div>';

  // 行动清单
  h += '<div class="card"><h2>✅ 行动清单（10 条）</h2><ol class="ol">';
  d.actions.forEach(a=>h+='<li>'+a+'</li>');
  h += '</ol></div>';

  // 总评
  h += '<div class="card"><h2>📜 总评</h2><div class="summary">'+d.summary+'</div></div>';

  // Edge-TTS 试听
  h += '<div class="card"><h2>🔊 方案语音试听</h2>';
  h += '<div class="tts-row">';
  h += '<button class="tts-btn" onclick="ttsSpeak(\''+encodeURIComponent(d.summary).replace(/'/g,'\\\'')+'\')">⚡ 生成语音</button>';
  h += '<span class="tts-hint">点击调用 edge-tts 服务（端口 8912）生成语音片段，服务不可用时自动降级到浏览器朗读</span>';
  h += '</div>';
  h += '<audio id="tts-audio" controls></audio>';
  h += '</div>';

  h += '<div class="tools"><button onclick="shareUrl()">🔗 分享链接</button><button onclick="window.print()">🖨️ 打印/保存 PDF</button><button onclick="copyTxt()">📋 复制文本</button></div>';

  document.getElementById('report').innerHTML = h;
  document.getElementById('report').classList.add('show');
  document.getElementById('input').style.display = 'none';
  location.hash = '#'+btoa(unescape(encodeURIComponent(JSON.stringify({emo:d.emo,ele:d.ele,scene:d.scene,extra:d.extra}))));
}

function restoreFromHash(){
  const h = location.hash.slice(1);
  if(!h) return;
  try{
    const d = JSON.parse(decodeURIComponent(escape(atob(h))));
    if(d.emo) document.getElementById('mEmotion').value = d.emo;
    if(d.ele) document.getElementById('mElement').value = d.ele;
    if(d.scene) document.getElementById('mScene').value = d.scene;
    if(d.extra) document.getElementById('mExtra').value = d.extra;
    generate();
  }catch(e){}
}

function shareUrl(){
  const url = location.href;
  if(navigator.share){ navigator.share({title:'疗愈音乐诊断',url}).catch(()=>{}); }
  else if(navigator.clipboard){ navigator.clipboard.writeText(url).then(()=>showToast('链接已复制')); }
  else prompt('复制链接分享：',url);
}

function copyTxt(){
  if(navigator.clipboard){ navigator.clipboard.writeText(document.getElementById('report').innerText).then(()=>showToast('已复制')); }
}

function showToast(m){
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = m;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(), 1800);
}

// Edge-TTS 全方案试听
async function ttsSpeak(summaryEncoded){
  const summary = decodeURIComponent(summaryEncoded);
  const audio = document.getElementById('tts-audio');
  const btn = document.querySelector('.tts-btn');
  if(!audio || !btn || btn.classList.contains('loading')) return;
  btn.classList.add('loading');
  btn.textContent = '⏳ 生成中...';
  try{
    const resp = await fetch('http://127.0.0.1:8912/api/tts?text='+encodeURIComponent(summary)+'&voice=female');
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
    showToast('⚠️ edge-tts 未起（8912）· 降级浏览器朗读');
    btn.classList.remove('loading');
    btn.textContent = '⚡ 生成语音';
    if(window.speechSynthesis){
      const u = new SpeechSynthesisUtterance(summary);
      u.lang='zh-CN'; u.rate=0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }
}

// 段落试听（每段独立 ttsText）
async function ttsPlaySegment(idx, ttsEncoded, duration){
  const ttsText = decodeURIComponent(ttsEncoded);
  showToast('▶ 第 '+(parseInt(idx)+1)+' 段 · '+duration+'秒');
  try{
    const resp = await fetch('http://127.0.0.1:8912/api/tts?text='+encodeURIComponent(ttsText)+'&voice=female');
    if(!resp.ok) throw new Error('TTS '+resp.status);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const audio = document.getElementById('tts-audio');
    audio.src = url;
    audio.style.display='block';
    audio.play().catch(()=>{});
  }catch(e){
    if(window.speechSynthesis){
      const u = new SpeechSynthesisUtterance(ttsText);
      u.lang='zh-CN'; u.rate=0.95;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }
}

window.addEventListener('load', restoreFromHash);
