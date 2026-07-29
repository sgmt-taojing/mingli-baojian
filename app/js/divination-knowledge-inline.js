
function showToast(msg) {
  let t = document.getElementById('toastMsg');
  if (!t) { t = document.createElement('div'); t.id = 'toastMsg'; t.className = 'toast-msg'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(function() { t.classList.remove('show'); }, 2500);
}

function showKb(id, evt) {
  // 切换标签页样式
  document.querySelectorAll('.kb-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.kb-tab').forEach(t => t.classList.remove('active'));
  let targetSection = document.getElementById('kb-'+id);
  if (targetSection) targetSection.classList.add('active');
  if (evt && evt.currentTarget) evt.currentTarget.classList.add('active');
  
  // 如果目标区块为空，尝试动态加载内容
  if (targetSection && targetSection.children.length <= 1) {
    loadKbContent(id, targetSection);
  }
  
  if (id === 'gongde') renderGongde();
}

// 动态加载知识库内容
function loadKbContent(id, targetSection) {
  // 数据映射：标签页id → 数据源key
  const dataMap = {
    'bazi': ['bazi', 'bagua', 'shishen', 'nayin', 'shensha', 'hechong'],
    'qimen': ['qimen'],
    'liuyao': ['liuyao', 'liushisigua'],
    'ziwei': ['ziwei'],
    'meihua': ['meihua'],
    'liuren': ['liuren'],
    'fengshui': ['fengshui', 'yangzhai'],
    'ru': ['ru'],
    'dao': ['dao'],
    'fo': ['fo'],
    'xuanze': ['xuanze'],
    'haohx': ['haohx', 'yangzhai'],
    'cezi': ['cezi'],
    'chanting': ['chanting'],
    'music': ['music'],
    'koujue': ['koujue'],
    'tudis': ['tudis'],
    'yangshi': ['yangshi', 'tizhi'],
    'yanzhi': ['yanzhi'],
    'shengxiao': ['shengxiao'],
    'constellation': ['constellation'],
    'jiazi': ['jiazi'],
    'jieqi': ['jieqi'],
    'zhouyi': ['zhouyi']
  };
  
  let html = '';
  const keys = dataMap[id] || [id];
  
  // 尝试从 window.KNOWLEDGE_DETAILS 加载
  keys.forEach(key => {
    if (window.KNOWLEDGE_DETAILS && window.KNOWLEDGE_DETAILS[key]) {
      html += window.KNOWLEDGE_DETAILS[key];
    }
  });
  
  // 如果还没内容，尝试从 AUTHORITATIVE_KNOWLEDGE 加载
  if (!html && typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined') {
    keys.forEach(key => {
      if (AUTHORITATIVE_KNOWLEDGE[key]) {
        html += renderAuthoritativeData(AUTHORITATIVE_KNOWLEDGE[key], key);
      }
    });
  }
  
  // 如果找到内容，插入到目标区块
  if (html) {
    targetSection.innerHTML = html;
  } else {
    // 兜底：显示“内容建设中”提示
    targetSection.innerHTML = '<div style="text-align:center;padding:40px;color:var(--muted)"><p>📖 该板块内容建设中，敬请期待…</p><p style="font-size:12px;margin-top:8px">如需查看相关内容，请访问主平台“更多板块 → 知识库”</p></div>';
  }
}

// 递归渲染 AUTHORITATIVE_KNOWLEDGE 数据
function renderAuthoritativeData(data, key, depth) {
  depth = depth || 0;
  if (!data) return '';
  
  let html = '';
  const indent = depth > 0 ? 'margin-left:16px;' : '';
  
  // 如果是字符串，直接显示
  if (typeof data === 'string') {
    if (data.length > 50) {
      html += '<p style="' + indent + 'color:var(--paper2);line-height:1.8">' + data + '</p>';
    }
    return html;
  }
  
  // 如果是数组
  if (Array.isArray(data)) {
    if (data.length > 0 && typeof data[0] === 'string') {
      html += '<div style="' + indent + '">';
      data.forEach(item => {
        if (typeof item === 'string') {
          html += '<span style="display:inline-block;background:rgba(201,168,76,.08);padding:4px 10px;margin:4px;border-radius:4px;font-size:13px">' + item + '</span>';
        }
      });
      html += '</div>';
    } else if (data.length > 0 && typeof data[0] === 'object') {
      data.forEach((item, i) => {
        html += renderAuthoritativeData(item, key + '_' + i, depth + 1);
      });
    }
    return html;
  }
  
  // 如果是对象
  if (typeof data === 'object') {
    const titleKeys = ['title', 'name', 'classic_source', 'wuxing', 'yinyang'];
    const contentKeys = ['intro', 'overview', 'description', 'personality', 'detailed_intro', 'practical_value', 'history', 'core_elements', 'main_theories'];
    
    // 先显示标题类字段
    titleKeys.forEach(k => {
      if (data[k] && typeof data[k] === 'string') {
        const tag = depth === 0 ? 'h3' : 'h4';
        html += '<' + tag + ' class="chapter-title" style="' + indent + '">' + data[k] + '</' + tag + '>';
      }
    });
    
    // 再显示内容类字段
    contentKeys.forEach(k => {
      if (data[k] && typeof data[k] === 'string' && data[k].length > 30) {
        html += '<p style="' + indent + 'line-height:2;color:var(--paper)">' + data[k] + '</p>';
      }
    });
    
    // 处理特殊字段
    if (data.strengths || data.weaknesses) {
      html += '<div style="' + indent + 'display:flex;gap:16px;flex-wrap:wrap;margin:12px 0">';
      if (data.strengths) {
        html += '<div><strong style="color:var(--jade)">优势：</strong>';
        (Array.isArray(data.strengths) ? data.strengths : [data.strengths]).forEach(s => {
          html += '<span style="background:rgba(39,174,96,.1);padding:3px 8px;margin:4px;border-radius:4px;font-size:12px">' + s + '</span>';
        });
        html += '</div>';
      }
      if (data.weaknesses) {
        html += '<div><strong style="color:var(--cinn)">注意：</strong>';
        (Array.isArray(data.weaknesses) ? data.weaknesses : [data.weaknesses]).forEach(w => {
          html += '<span style="background:rgba(192,57,43,.1);padding:3px 8px;margin:4px;border-radius:4px;font-size:12px">' + w + '</span>';
        });
        html += '</div>';
      }
      html += '</div>';
    }
    
    // 递归处理其他对象字段
    Object.keys(data).forEach(k => {
      if (!titleKeys.includes(k) && !contentKeys.includes(k) && k !== 'strengths' && k !== 'weaknesses') {
        if (typeof data[k] === 'object' && data[k] !== null) {
          if (Array.isArray(data[k]) && data[k].length > 0 && typeof data[k][0] === 'object') {
            // 数组对象展开渲染
            html += '<div style="' + indent + 'margin-top:16px">';
            html += '<h5 style="color:var(--gold2);margin-bottom:8px">' + formatFieldLabel(k) + '</h5>';
            data[k].forEach((item, i) => {
              html += renderAuthoritativeData(item, k + '_' + i, depth + 1);
            });
            html += '</div>';
          } else if (!Array.isArray(data[k])) {
            html += renderAuthoritativeData(data[k], k, depth + 1);
          }
        }
      }
    });
  }
  
  return html;
}

// 字段名格式化
function formatFieldLabel(key) {
  const labelMap = {
    'tiangan': '天干详解', 'dizhi': '地支详解', 'shishen': '十神详解',
    'wuxing': '五行', 'yinyang': '阴阳', 'character': '性格特征',
    'career': '适合职业', 'health': '健康对应', 'like': '喜用', 'dislike': '忌讳',
    'strengths': '优势', 'weaknesses': '弱点', 'overview': '概述', 'intro': '简介'
  };
  return labelMap[key] || key;
}
function toggleAcc(el) {
  el.parentElement.classList.toggle('open');
}
document.querySelectorAll('.acc-head').forEach(h => {
  h.onclick = () => { h.parentElement.classList.toggle('open'); };
});

// ===== 拼音切换功能 =====
function togglePinyin() {
  let btn = document.getElementById('pinyinToggle');
  let sections = document.querySelectorAll('.kb-section');
  let allHidden = sections.length > 0 && sections[0].classList.contains('pinyin-hide');
  if (allHidden) {
    // 当前是隐藏状态 → 显示拼音
    sections.forEach(function(s) { s.classList.remove('pinyin-hide'); });
    if (btn) { btn.textContent = '🔤 隐藏拼音'; btn.classList.add('active'); }
  } else {
    // 当前是显示状态 → 隐藏拼音
    sections.forEach(function(s) { s.classList.add('pinyin-hide'); });
    if (btn) { btn.textContent = '🔤 显示拼音'; btn.classList.remove('active'); }
  }
}

// ===== 经典伴读功能（Web Speech API）=====
let _activeChant = null;
let _utterance = null;
let _charIndex = 0;
let _totalChars = 0;
let _rateMap = {};

function readChant(chantId) {
  if (!('speechSynthesis' in window)) {
    showToast('您的浏览器不支持语音朗读，请使用Chrome/Safari');
    return;
  }

  let btn = document.getElementById('btn-' + chantId);
  let textEl = document.getElementById('text-' + chantId);
  let progFill = document.getElementById('prog-fill-' + chantId);
  let progLabel = document.getElementById('prog-label-' + chantId);


  if (chantId === _activeChant && window.speechSynthesis.speaking) {
    window.speechSynthesis.pause();
    if (btn) btn.textContent = '▶ 继续';
    return;
  }

  if (chantId === _activeChant && window.speechSynthesis.paused) {
    window.speechSynthesis.resume();
    if (btn) btn.textContent = '⏸ 暂停';
    return;
  }


  window.speechSynthesis.cancel();
  _activeChant = chantId;

  let text = textEl ? textEl.innerText.trim() : '';
  if (!text) { showToast('文本内容为空'); return; }


  _charIndex = 0;
  _totalChars = text.length;


  _utterance = new SpeechSynthesisUtterance(text);
  _utterance.lang = 'zh-CN';
  _utterance.rate = _rateMap[chantId] || 0.85;
  _utterance.pitch = 1.0;


  // 选择中文语音
  let voices = window.speechSynthesis.getVoices();
  let zhVoice = voices.find(function(v){ return v.lang.includes('zh') && !v.lang.includes('en'); });
  if (zhVoice) _utterance.voice = zhVoice;

  _utterance.onboundary = function(e) {
    if (e.name === 'word' || e.name === 'sentence') {
      _charIndex = e.charIndex;
      if (progFill) {
        let pct = _totalChars > 0 ? Math.round(_charIndex / _totalChars * 100) : 0;
        progFill.style.width = pct + '%';
      }
      if (progLabel) {
        let charCount = Math.round(_charIndex / _totalChars * _totalChars);
        progLabel.textContent = _charIndex + '/' + _totalChars + ' 字';
      }
    }
  };


  _utterance.onend = function() {
    _activeChant = null;
    if (btn) btn.textContent = '🔊 伴读';
    if (progFill) progFill.style.width = '100%';
    if (progLabel) progLabel.textContent = _totalChars + '/' + _totalChars + ' 字（诵毕）';
    showToast('诵毕 ✨ 功德圆满');
  };

  _utterance.onerror = function() {
    _activeChant = null;
    if (btn) btn.textContent = '🔊 伴读';
  };


  window.speechSynthesis.speak(_utterance);
  if (btn) btn.textContent = '⏸ 暂停';
  if (progLabel) progLabel.textContent = '0/' + _totalChars + ' 字';
}

function setRate(chantId, rate) {
  _rateMap[chantId] = parseFloat(rate);
  if (_activeChant === chantId && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    readChant(chantId);
  }
}

function stopReading(chantId) {
  window.speechSynthesis.cancel();
  _activeChant = null;
  let btn = document.getElementById('btn-' + chantId);
  if (btn) btn.textContent = '🔊 伴读';
  let progFill = document.getElementById('prog-fill-' + chantId);
  if (progFill) progFill.style.width = '0%';
}

// 页面离开时停止语音
window.addEventListener('beforeunload', function() {
  window.speechSynthesis.cancel();
});

// ===== 梵音音乐数据 =====
const musicData = {
  buddhist: [
    {icon:'🪷',title:'大悲咒·梵唱',desc:'梵音海潮音，清净心田。适合静坐、抄经时聆听。',tags:['消业','静心','祈福'],duration:'30分钟',time:'卯时/子时'},
    {icon:'🙏',title:'六字大明咒·吟唱',desc:'藏传佛乐经典吟唱版本，低沉悠远。',tags:['护身','消灾','安神'],duration:'20分钟',time:'随时'},
    {icon:'🪷',title:'心经·梵呗',desc:'般若心经梵唱，开发智慧，破除迷障。',tags:['开慧','破迷','增智'],duration:'8分钟',time:'卯时/酉时'},
    {icon:'🎵',title:'阿弥陀佛圣号',desc:'四字洪名，念佛号可消八十亿劫生死之罪。',tags:['往生','消业','净土'],duration:'循环播放',time:'随时'},
    {icon:'🪷',title:'药师佛心咒',desc:'消灾延寿药师佛心咒，保佑健康平安。',tags:['健康','延寿','消灾'],duration:'15分钟',time:'辰时/午时'},
    {icon:'📿',title:'地藏菩萨灭定业真言',desc:'地藏王菩萨灭定业真言，消除宿世定业。',tags:['消业','超度','护佑'],duration:'10分钟',time:'酉时/亥时'}
  ],
  daoist: [
    {icon:'☯️',title:'太乙救苦天尊宝诰',desc:'道教度人经典唱诵，超度亡灵，救拔苦难。',tags:['度人','消灾','超度'],duration:'8分钟',time:'子时/卯时'},
    {icon:'🎵',title:'三清圣号·道教仙乐',desc:'三清圣号道教仙乐，清净庄严。',tags:['通灵','静心','修道'],duration:'15分钟',time:'寅时/卯时'},
    {icon:'☯️',title:'玉皇忏·道教科仪',desc:'玉皇大帝忏悔科仪音乐，消灾祈福。',tags:['消灾','祈福','忏悔'],duration:'25分钟',time:'辰时/午时'},
    {icon:'🌿',title:'步虚词·道场仙乐',desc:'道教步虚词吟唱，如临仙境，净化心灵。',tags:['净化','通灵','养性'],duration:'12分钟',time:'戌时/亥时'},
    {icon:'☯️',title:'太上老君说常清静经·诵经',desc:'清静经道教唱诵版本，修心养性。',tags:['清静','养性','修心'],duration:'10分钟',time:'卯时/戌时'},
    {icon:'🏔️',title:'五雷咒·道教雷法',desc:'道教五雷法咒，驱邪镇煞，威力宏大。',tags:['驱邪','镇煞','护身'],duration:'6分钟',time:'午时(阳气最旺)'}
  ],
  healing: [
    {icon:'🎶',title:'五行养生冥想',desc:'对应五行的冥想音乐，金木水火土依次流转。',tags:['养生','冥想','五行'],duration:'40分钟',time:'寅时/卯时'},
    {icon:'🌊',title:'海潮音·深度放松',desc:'模拟海潮声与梵音融合，深度放松身心。',tags:['放松','减压','助眠'],duration:'60分钟',time:'亥时/子时'},
    {icon:'🔔',title:'颂钵音疗·脉轮净化',desc:'尼泊尔颂钵音疗，净化七个脉轮能量。',tags:['脉轮','净化','能量'],duration:'45分钟',time:'酉时/戌时'},
    {icon:'🎵',title:'古琴·静心开运',desc:'古琴名曲精选，琴音通灵，开运增慧。',tags:['古琴','开运','静心'],duration:'30分钟',time:'辰时/巳时'},
    {icon:'🌙',title:'月光冥想·招财频率',desc:'528Hz+432Hz双频率招财冥想，吸引财富能量。',tags:['招财','频率','吸引力'],duration:'20分钟',time:'酉时/亥时'},
    {icon:'☀️',title:'晨间能量激活',desc:'清晨能量激活音乐，提升全天运势与活力。',tags:['晨间','能量','活力'],duration:'15分钟',time:'卯时/辰时'},
    {icon:'🍀',title:'转运频率·好运冥想',desc:'741Hz转运频率冥想，清除负面能量，引来好运。',tags:['转运','好运','净化'],duration:'25分钟',time:'午时/未时'},
    {icon:'🧘',title:'太极冥想·道法自然',desc:'配合太极拳或站桩的冥想音乐，天人合一。',tags:['太极','道法','冥想'],duration:'35分钟',time:'寅时/卯时'}
  ]
};

// ===== 每日口诀数据 =====
const koujueData = {
  luck: [
    {name:'增运心咒',text:'天行健，君子以自强不息。地势坤，君子以厚德载物。',time:'卯时(5-7点)',count:'21遍',benefit:'增强整体运势，提升气场',note:'周易·乾卦与坤卦。每日持诵，气场自生。宜面向东方，配合深呼吸。'},
    {name:'聚财咒',text:'和气生财，和顺致祥。家和万事兴，人和百业旺。',time:'辰时(7-9点)',count:'49遍',benefit:'聚财聚气，和顺生财',note:'面向东南方（财位）诵念，可配合财神像或聚宝盆观想。'},
    {name:'贵人扶助咒',text:'天赐良缘，贵人相助。心存善念，路自宽广。',time:'巳时(9-11点)',count:'36遍',benefit:'招贵人，得助力',note:'佛道皆有贵人法，诚心持诵，自然感召善缘。'},
    {name:'转运真言',text:'否极泰来，否去泰来。风雨之后见彩虹，苦尽甘来运自通。',time:'午时(11-13点)',count:'49遍',benefit:'转运改运，逆境翻盘',note:'转运需坚持，连续7日诵念，配合放生或行善效果更佳。'},
    {name:'紫气东来咒',text:'紫气东来，福运将至。心如明镜，万事顺遂。',time:'卯时(5-7点)',count:'27遍',benefit:'招福纳祥，紫气东来',note:'道教转运咒，宜清晨面向东方，观想紫色祥云自东方来。'},
    {name:'时来运转诀',text:'一时之困非一世之困，一时之难非一世之难。龙困浅滩待潮涨，虎落平阳待风还。',time:'辰时(7-9点)',count:'49遍',benefit:'渡过难关，时来运转',note:'逆境时诵念，保持信心。配合佩带转运饰品效果更佳。'},
    {name:'百事亨通咒',text:'天地通泰，百事亨通。出入平安，诸事顺遂。行有方向，心有定力。',time:'巳时(9-11点)',count:'21遍',benefit:'日常万事亨通',note:'每日晨起诵念，可保一日顺利。出差前诵念尤为有效。'},
    {name:'化解小人口诀',text:'口出善言，远离是非。心如止水，小人自散。不怒不争，和气自生。',time:'申时(15-17点)',count:'27遍',benefit:'化解小人，远离是非',note:'遇小人时诵念，可化解口舌是非。平时持诵可预防。'},
    {name:'天官赐福咒',text:'天官赐福，百无禁忌。门迎百福，户纳千祥。',time:'卯时(5-7点)',count:'9遍',benefit:'纳福迎祥，百无禁忌',note:'道教天官咒，正月十五上元节持诵最灵。平日亦可持诵。'},
    {name:'五福临门诀',text:'一曰寿，二曰富，三曰康宁，四曰攸好德，五曰考终命。五福具备，人生圆满。',time:'辰时(7-9点)',count:'27遍',benefit:'五福齐聚，人生圆满',note:'尚书·洪范篇。持诵时观想五福临门之象，心存感恩。'}
  ],
  longevity: [
    {name:'养生诀',text:'饮食有节，起居有常，不妄作劳，故能形与神俱，而尽终其天年。',time:'亥时(21-23点)',count:'21遍',benefit:'养生延年，形神俱备',note:'黄帝内经·上古天真论。睡前诵念，配合腹式呼吸，有助入眠。'},
    {name:'长寿咒',text:'天有三宝日月星，人有三宝精气神。保精养气存神明，百病不侵寿延年。',time:'子时(23-1点)',count:'49遍',benefit:'固精养气，延年益寿',note:'道家养生咒，宜配合站桩或打坐持诵。精气神三宝为生命根本。'},
    {name:'延寿真言',text:'心宽一寸，寿延十年。不争不抢，天自佑之。',time:'卯时(5-7点)',count:'21遍',benefit:'心宽延寿，不争不抢',note:'养生先养心，心宽则气和，气和则寿延。每日诵念，培养豁达心胸。'},
    {name:'补气养生诀',text:'呼出心中浊气，吸入天地清气。一呼一吸之间，便是长生之门。',time:'卯时(5-7点)',count:'49遍',benefit:'补气养气，调息养生',note:'道家胎息经要旨。配合深呼吸持诵，吸气观想清气入体，呼气观想浊气排出。'},
    {name:'睡眠养生诀',text:'子时入睡养肝血，丑时入睡养胆经。早睡早起身体好，不药而愈百病消。',time:'亥时(21-23点)',count:'9遍',benefit:'安眠养生，百病自消',note:'中医养生秘诀。睡前诵念，提醒自己按时入睡。子时（23点）前务必入睡。'},
    {name:'素食功德诀',text:'一日三餐清净食，不杀生灵不伤物。慈悲为怀积功德，身心清净寿延年。',time:'卯时(5-7点)',count:'21遍',benefit:'素食功德，慈悲延寿',note:'佛家养生法。每月初一、十五食素，或每周一天食素，积累功德。'},
    {name:'金刚不坏诀',text:'身是菩提树，心如明镜台。时时勤拂拭，勿使惹尘埃。',time:'寅时(3-5点)',count:'36遍',benefit:'修身养性，金刚不坏',note:'神秀大师偈语。持诵时观想身心如明镜，时时勤加护持。'},
    {name:'六字诀',text:'嘘呵呼呬吹嘻，六字对应肝心脾肺肾三焦。常念常诵，五脏调和。',time:'辰时(7-9点)',count:'36遍',benefit:'六字调气，五脏调和',note:'道家六字诀养生法。每字对应一脏腑：嘘（肝）、呵（心）、呼（脾）、呬（肺）、吹（肾）、嘻（三焦）。'}
  ],
  study: [
    {name:'文昌咒',text:'文昌帝君赐智慧，笔走龙蛇文章辉。学海无涯勤为径，书山有路志为梯。',time:'辰时(7-9点)',count:'27遍',benefit:'文昌加持，学业进步',note:'文昌帝君为文职之神。考前每日持诵，配合文昌塔或文昌笔摆放文昌位（东南方）。'},
    {name:'开智慧咒',text:'心静则明，心明则慧。静坐常思己过，闲谈莫论人非。',time:'子时(23-1点)',count:'21遍',benefit:'静心开慧，增长智慧',note:'儒家修行法。配合静坐持诵，观想心明如镜，智慧自生。'},
    {name:'过目不忘诀',text:'书读百遍其义自见，学而不思则罔思而不学则殆。日积月累水滴石穿。',time:'卯时(5-7点)',count:'49遍',benefit:'增强记忆，过目不忘',note:'论语学习法。持诵时观想知识如水滴石穿般积累，智慧如泉涌。'},
    {name:'考试祈福咒',text:'笔锋所至，心之所向。沉着冷静，超常发挥。文思泉涌，下笔有神。',time:'辰时(7-9点)',count:'9遍',benefit:'考试发挥超常',note:'考前持诵，配合文昌帝君祈福。进入考场前默念三遍，稳定心神。'},
    {name:'勤学咒',text:'三更灯火五更鸡，正是男儿读书时。黑发不知勤学早，白首方悔读书迟。',time:'寅时(3-5点)',count:'21遍',benefit:'勤学不怠，惜时读书',note:'颜真卿·劝学诗。凌晨诵念，提醒自己珍惜时光，勤学不辍。'},
    {name:'悟道诀',text:'学而不厌，诲人不倦。知之为知之，不知为不知，是知也。',time:'巳时(9-11点)',count:'21遍',benefit:'求学端正，知之为知',note:'论语·述而篇。持诵时反求诸己，诚实面对自己的无知，方能进步。'},
    {name:'文曲星加持咒',text:'天上有星名文曲，照临人间增智慧。拜请文曲赐灵感，笔下生花文章成。',time:'辰时(7-9点)',count:'27遍',benefit:'文曲星照，灵感迸发',note:'民间文曲星咒。写作或创作前持诵，可增强灵感与创造力。'},
    {name:'格物致知诀',text:'致知在格物，物格而后知至。知至而后意诚，意诚而后心正。',time:'辰时(7-9点)',count:'21遍',benefit:'格物致知，诚意正心',note:'大学·格物致知。持诵时观想穷究事物之理，而后获得真知。'}
  ],
  noble: [
    {name:'贵人相逢诀',text:'与人为善，善缘自聚。以诚待人，贵人自来。心存感恩，路越走越宽。',time:'辰时(7-9点)',count:'27遍',benefit:'广结善缘，贵人自来',note:'儒家待人处世法。持诵时心存感恩，广结善缘，贵人自然云集。'},
    {name:'识人诀',text:'路遥知马力，日久见人心。患难见真情，知己在患难。',time:'巳时(9-11点)',count:'21遍',benefit:'辨识真假朋友',note:'民间识人智慧。持诵时反思自己的人际关系，珍惜患难真情。'},
    {name:'纳贵人咒',text:'海纳百川有容乃大，壁立千仞无欲则刚。心胸开阔，贵人自临。',time:'辰时(7-9点)',count:'27遍',benefit:'心胸开阔，纳贵入怀',note:'林则徐名句。持诵时观想心胸如大海般广阔，包容万物，贵人自然来临。'},
    {name:'结善缘诀',text:'莫以善小而不为，莫以恶小而为之。日行一善，积善成德。',time:'卯时(5-7点)',count:'9遍',benefit:'日行一善，广结善缘',note:'刘备遗训。每日持诵，提醒自己日行一善。善缘积累到一定程度，贵人自然出现。'},
    {name:'知音诀',text:'高山流水遇知音，伯牙绝弦为钟期。千金易得，知音难觅。',time:'酉时(17-19点)',count:'21遍',benefit:'寻觅知音，珍惜缘分',note:'列子·汤问篇。持诵时珍惜身边的知音好友，真诚待人，自会遇到知音。'},
    {name:'逢凶化吉诀',text:'善有善报，恶有恶报。不是不报，时候未到。多行善事，逢凶化吉。',time:'辰时(7-9点)',count:'27遍',benefit:'逢凶化吉，遇难呈祥',note:'佛家因果法。持诵时提醒自己多行善事，自然逢凶化吉。'},
    {name:'贵人扶持咒',text:'天降大任于斯人也，必先苦其心志，劳其筋骨。熬过便是晴天，贵人自现。',time:'午时(11-13点)',count:'49遍',benefit:'逆境逢贵，苦尽甘来',note:'孟子·告子下。逆境时持诵，提醒自己天将降大任，贵人正在路上。'},
    {name:'和气生财诀',text:'和为贵，和气生财。忍一时风平浪静，退一步海阔天空。',time:'巳时(9-11点)',count:'9遍',benefit:'和气待人，贵人自至',note:'儒家处世法。持诵时提醒自己以和为贵，自然能够吸引贵人。'}
  ],
  relations: [
    {name:'桃花咒',text:'桃之夭夭，灼灼其华。之子于归，宜其室家。',time:'卯时(5-7点)',count:'27遍',benefit:'催桃花，促姻缘',note:'诗经·周南·桃夭。单身者持诵，可催旺桃花运。配合摆放桃花或玫瑰晶。'},
    {name:'和合咒',text:'百年好合，永结同心。琴瑟和鸣，举案齐眉。',time:'卯时(5-7点)',count:'27遍',benefit:'婚姻和合，百年好合',note:'民间和合咒。已婚者持诵，可促进夫妻感情。配合和合符或和合二仙像。'},
    {name:'破镜重圆诀',text:'缘来缘去缘如水，花开花落花如梦。若是有缘终相聚，若是无缘莫强求。',time:'酉时(17-19点)',count:'49遍',benefit:'感情挽回，破镜重圆',note:'综合感情法。分手后持诵，配合诚心忏悔与改变，或有可能破镜重圆。'},
    {name:'良缘诀',text:'有缘千里来相会，无缘对面不相识。珍惜眼前人，莫待无花空折枝。',time:'辰时(7-9点)',count:'21遍',benefit:'珍惜良缘，把握当下',note:'民间良缘法。持诵时提醒自己珍惜眼前人，不要等到失去才后悔。'},
    {name:'婚姻守护咒',text:'执子之手，与子偕老。死生契阔，与子成说。',time:'卯时(5-7点)',count:'21遍',benefit:'守护婚姻，白头偕老',note:'诗经·邶风·击鼓。已婚者持诵，可守护婚姻，白头偕老。'},
    {name:'化解感情危机诀',text:'退一步海阔天空，忍一时风平浪静。多沟通少争执，家和万事兴。',time:'巳时(9-11点)',count:'27遍',benefit:'化解感情危机',note:'综合感情法。感情出现危机时持诵，提醒自己以沟通代替争执。'},
    {name:'催桃花心法',text:'自爱者人恒爱之，自信者人恒敬之。先修己身，桃花自来。',time:'卯时(5-7点)',count:'21遍',benefit:'提升自身魅力',note:'儒家修身法。持诵时提醒自己先修身，自然能够吸引良缘。'},
    {name:'旺家运诀',text:'妻贤夫祸少，子孝父心宽。家和万事兴，人勤百业旺。',time:'辰时(7-9点)',count:'27遍',benefit:'旺家运，促和谐',note:'民间家运法。持诵时提醒自己维护家庭和谐，家运自然兴旺。'}
  ],
  wealth: [
    {name:'招财咒',text:'和气生财，和顺致祥。人勤财来，人懒财去。',time:'辰时(7-9点)',count:'27遍',benefit:'招财进宝，勤能致富',note:'民间招财法。配合勤劳工作，财富自然而来。懒人求财无效。'},
    {name:'金光咒',text:'天地玄宗，万炁本根。广修亿劫，证吾神通。',time:'卯时(5-7点)',count:'49遍',benefit:'金光护体，财源广进',note:'道教八大神咒之一。持诵时观想金光护体，财神降临。需诚心修炼，非一日之功。'},
    {name:'财神咒',text:'赵公元帅骑黑虎，手执银鞭巡四方。赐福赐财赐平安，人间正神第一尊。',time:'辰时(7-9点)',count:'36遍',benefit:'赵公明加持，财运亨通',note:'道教财神咒。正月初五迎财神日持诵最灵。平日亦可持诵祈求财运。'},
    {name:'生意兴隆诀',text:'客似云来，财如泉涌。和气待人，诚信经营。',time:'辰时(7-9点)',count:'9遍',benefit:'生意兴隆，客似云来',note:'民间经商法。开店前或每日晨起持诵，配合诚信经营，生意自然兴隆。'},
    {name:'守财诀',text:'开源节流，量入为出。不奢不侈，财自留存。',time:'巳时(9-11点)',count:'21遍',benefit:'守财有道，不漏财',note:'综合理财法。持诵时提醒自己理性消费，做好财务规划，自然能够守财。'},
    {name:'偏财运诀',text:'君子爱财取之有道。不义之财不可取，正财偏财皆有道。',time:'辰时(7-9点)',count:'21遍',benefit:'正财偏财，取之有道',note:'论语·里仁篇。持诵时提醒自己取财有道，不可贪图不义之财。'},
    {name:'聚宝盆咒',text:'金玉满堂，富贵盈门。年年有余，岁岁平安。',time:'辰时(7-9点)',count:'21遍',benefit:'聚财纳福，富贵盈门',note:'民间聚财法。配合聚宝盆或金元宝摆件，持诵效果更佳。'},
    {name:'还债消灾诀',text:'欠债还钱天经地义，有借有还再借不难。清清白白做人，明明白白做事。',time:'巳时(9-11点)',count:'21遍',benefit:'清偿债务，消灾解难',note:'民间还债法。有债务者持诵，提醒自己尽快还清债务，消灾解难。'}
  ],
  exorcism: [
    {name:'净心神咒',text:'太上台星，应变无停。驱邪缚魅，保命护身。',time:'子时(23-1点)',count:'36遍',benefit:'净心护身，驱邪化煞',note:'道教八大神咒之一。每日晨起持诵，可净化身心，驱除邪煞。'},
    {name:'八大神咒',text:'天生万物，各有其主。邪不压正，正能胜邪。',time:'午时(11-13点)',count:'27遍',benefit:'正气凛然，邪不可侵',note:'道教护身法。遇邪煞时持诵，观想正气护体，邪煞自退。'},
    {name:'平安咒',text:'出入平安，万事如意。家宅安宁，百邪不侵。',time:'卯时(5-7点)',count:'21遍',benefit:'出入平安，家宅安宁',note:'综合平安法。每日出门前持诵，可保出入平安。家宅不安时亦可持诵。'},
    {name:'镇宅咒',text:'天清地宁，家宅安宁。门神把守，邪祟不侵。',time:'卯时(5-7点)',count:'27遍',benefit:'镇宅护院，邪祟不入',note:'民间镇宅法。搬家或家宅不安时持诵，配合张贴门神或符咒。'},
    {name:'辟邪诀',text:'正气内存，邪不可干。邪之所凑，其气必虚。补其正气，邪自散矣。',time:'辰时(7-9点)',count:'49遍',benefit:'正气存内，邪不可干',note:'黄帝内经·素问。持诵时观想正气充盈全身，邪煞自然无法侵入。'},
    {name:'化太岁咒',text:'太岁当头坐，无灾必有祸。拜太岁求平安，请太岁符化灾劫。',time:'辰时(7-9点)',count:'36遍',benefit:'化太岁，保平安',note:'道教化太岁法。本命年或犯太岁时持诵，配合拜太岁或请太岁符。'},
    {name:'消业障诀',text:'往昔所造诸恶业，皆由无始贪嗔痴。从今忏悔不复造，业障消除福自来。',time:'亥时(21-23点)',count:'49遍',benefit:'忏悔消业，福报自来',note:'佛家忏悔法。每日睡前持诵，忏悔一日所造恶业，福报自然来临。'},
    {name:'护身诀',text:'日月星辰照我身，三光加持护我真。刀兵水火不能近，邪魔外道不敢侵。',time:'卯时(5-7点)',count:'36遍',benefit:'三光护身，万邪不侵',note:'道家护身法。外出或遇邪煞时持诵，观想日月星辰三光加持护体。'}
  ],
  cultivation: [
    {name:'静心诀',text:'知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。',time:'子时(23-1点)',count:'21遍',benefit:'静心定神，虑而后得',note:'大学·知止篇。睡前持诵，帮助入静。配合打坐或冥想效果更佳。'},
    {name:'忍辱诀',text:'小不忍则乱大谋。忍一时风平浪静，退一步海阔天空。',time:'巳时(9-11点)',count:'21遍',benefit:'忍辱负重，大器晚成',note:'论语·卫灵公。遇不顺心之事时持诵，提醒自己忍耐。'},
    {name:'修心诀',text:'不以物喜，不以己悲。居庙堂之高则忧其民，处江湖之远则忧其君。',time:'辰时(7-9点)',count:'27遍',benefit:'宠辱不惊，修心养性',note:'范仲淹·岳阳楼记。持诵时培养豁达心境，不为外物所动。'},
    {name:'悟道心法',text:'菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。',time:'子时(23-1点)',count:'21遍',benefit:'顿悟开慧，破除执着',note:'六祖慧能偈语。持诵时观想身心如虚空，了无挂碍，破除执着。'},
    {name:'知足常乐诀',text:'知足者富，强行者有志。不失其所者久，死而不亡者寿。',time:'卯时(5-7点)',count:'21遍',benefit:'知足常乐，内心富足',note:'老子·道德经第三十三章。持诵时提醒自己知足常乐，不要贪得无厌。'},
    {name:'戒怒诀',text:'怒伤肝，喜伤心，思伤脾，悲伤肺，恐伤肾。七情适度，养生之本。',time:'巳时(9-11点)',count:'21遍',benefit:'七情适度，不怒不躁',note:'黄帝内经·素问。情绪激动时持诵，提醒自己控制情绪，七情适度。'},
    {name:'寡欲诀',text:'少私寡欲，清心寡欲。欲壑难填，知足常乐。淡泊明志，宁静致远。',time:'子时(23-1点)',count:'27遍',benefit:'清心寡欲，淡泊明志',note:'诸葛亮·诫子书。持诵时观想心境如止水，淡泊明志，宁静致远。'},
    {name:'慎独诀',text:'君子慎独，不欺暗室。十目所视，十手所指，其严乎。',time:'亥时(21-23点)',count:'21遍',benefit:'慎独慎微，君子之风',note:'大学·慎独篇。晚间持诵，反思一日所为，培养慎独精神。'},
    {name:'谦虚诀',text:'满招损，谦受益。不自见故明，不自是故彰，不自伐故有功。',time:'辰时(7-9点)',count:'21遍',benefit:'谦虚受益，满招损',note:'尚书·大禹谟。持诵时提醒自己保持谦虚，不要骄傲自满。'},
    {name:'每日三省诀',text:'吾日三省吾身：为人谋而不忠乎？与朋友交而不信乎？传不习乎？',time:'亥时(21-23点)',count:'9遍',benefit:'每日反思，不断进步',note:'论语·学而篇·曾子。晚间持诵，反思一日所行，不断进步。'}
  ]
};

// 渲染音乐卡片
function renderMusicCards() {
  // BV号映射表（有BV号的点击直接播放，没有的提示B站搜索）
  const bvMap = {
    '大悲咒·梵唱': 'BV1F44y1m7Uo',
    '六字大明咒·吟唱': 'BV1CR4y1g7UY',
    '心经·梵呗': 'BV12K4y1S7Ue',
    '阿弥陀佛圣号': 'BV1Ps4y1R7WP',
    '药师佛心咒': 'BV144411U76Z',
    '太乙救苦天尊宝诰': 'BV1h6421f7aN',
    '三清圣号·道教仙乐': 'BV1a4411Y7Lw',
    '玉皇忏·道教科仪': 'BV1F44y1m7Uo',
    '清静经·诵经': 'BV1CR4y1g7UY',
    '八段锦': 'BV1PQKGeEEWi',
    '五行养生冥想': 'BV1bETNzcE2E',
    '古琴·静心开运': 'BV1Tt4y1p7Vx',
    '转运频率·好运冥想': 'BV1eF411r7oB'
  };
  Object.keys(musicData).forEach(key => {
    const container = document.getElementById(key === 'buddhist' ? 'buddhist-music' : key === 'daoist' ? 'daoist-music' : 'healing-music');
    if (!container) return;
    container.innerHTML = musicData[key].map(m => {
      const bv = bvMap[m.title];
      const onclick = bv ? `openVideo('${bv}', '${m.title}')` : `showToast('🎵 请在B站搜索：「${m.title}」')`;
      const btnText = bv ? '▶ 直接播放' : '▶ B站搜索';
      return `
      <ml-tap class="music-card" onclick="${onclick}" variant="card" role="button" tabindex="0">
        <div class="music-card-icon">${m.icon}</div>
        <div class="music-card-title">${m.title}${bv ? ' <span style="font-size:11px;color:var(--jade)">🎬</span>' : ''}</div>
        <div class="music-card-desc">${m.desc}</div>
        <div class="music-card-meta">
          ${m.tags.map(t => '<span class="music-tag">' + t + '</span>').join('')}
          <span class="music-tag" style="background:rgba(41,128,185,0.1);color:var(--cyan);border-color:rgba(41,128,185,0.2)">${m.time}</span>
        </div>
        <div class="music-play-btn">${btnText}</div>
      </ml-tap>
      `;
    }).join('');
  });
}

// 渲染口诀卡片
function renderKoujueCards() {
  const mapping = {luck:'koujue-luck',longevity:'koujue-longevity',study:'koujue-study',noble:'koujue-noble',relations:'koujue-relations',wealth:'koujue-wealth',exorcism:'koujue-exorcism',cultivation:'koujue-cultivation'};
  Object.keys(mapping).forEach(key => {
    const container = document.getElementById(mapping[key]);
    if (!container) return;
    container.innerHTML = koujueData[key].map(k => `
      <div class="koujue-card">
        <div style="color:var(--gold);font-size:15px;font-weight:500;margin-bottom:4px">${k.name}</div>
        <div class="koujue-text">${k.text}</div>
        <div class="koujue-meta">
          <span class="koujue-tag time">⏰ ${k.time}</span>
          <span class="koujue-tag count">🔢 ${k.count}</span>
          <span class="koujue-tag benefit">✨ ${k.benefit}</span>
        </div>
        <div class="koujue-note">💡 ${k.note}</div>
      </div>
    `).join('');
  });
}

// 渲染今日推荐口诀
function renderDailyKoujue() {
  const allKoujue = Object.values(koujueData).flat();
  const dayIndex = new Date().getDate() % allKoujue.length;
  const k = allKoujue[dayIndex];
  const container = document.getElementById('daily-koujue');
  if (!container) return;
  const today = new Date();
  const dateStr = today.getFullYear() + '年' + (today.getMonth()+1) + '月' + today.getDate() + '日';
  container.innerHTML = `
    <div class="daily-koujue-card">
      <h3>📅 ${dateStr} · 今日推荐</h3>
      <div style="color:var(--paper3);font-size:13px;margin-bottom:8px">${k.name}</div>
      <div class="daily-koujue-main">${k.text}</div>
      <div class="daily-koujue-info">
        ⏰ 最佳时辰：${k.time}<br>
        🔢 推荐遍数：${k.count}<br>
        ✨ 功效：${k.benefit}<br>
        💡 ${k.note}
      </div>
    </div>
  `;
}

// ===== 功德体系数据 =====
let gongdeTasks = [
  {id:'fangsheng', title:'放生', desc:'参加放生法会或自行放生', points:30, icon:'🐟'},
  {id:'songjing', title:'诵经', desc:'完整诵读经典一遍（心经/道德经等）', points:10, icon:'📿'},
  {id:'bushi', title:'布施', desc:'随缘布施（财物/时间/善举）', points:20, icon:'🙏'},
  {id:'gongdeng', title:'供灯', desc:'佛前或道前供灯，照亮智慧', points:15, icon:'🪔'},
  {id:'chaojing', title:'抄经', desc:'手抄经典经文一遍，字字恭敬', points:20, icon:'📝'},
  {id:'yinjing', title:'印经', desc:'出资助印经典或捐赠经书流传', points:50, icon:'📖'},
  {id:'gonghua', title:'供花', desc:'佛前或道前供花，庄严道场', points:10, icon:'🌸'},
  {id:'lifo', title:'礼佛', desc:'礼佛拜神或去寺庙道观上香', points:15, icon:'🙏'},
  {id:'zhaijie', title:'斋戒', desc:'今日斋戒清净，不食荤腥', points:10, icon:'🥬'},
  {id:'chanxiu', title:'禅修', desc:'打坐禅修30分钟以上，静心养性', points:25, icon:'🧘'},
  {id:'zhuren', title:'助人', desc:'帮助他人完成一件善事', points:15, icon:'💛'},
  {id:'chisu', title:'吃素', desc:'今日全天素食，慈悲护生', points:5, icon:'🥬'}
];

function renderGongde() {
  let container = document.getElementById('gongdeTasks');
  if (!container) return;
  let html = '';
  for (let i = 0; i < gongdeTasks.length; i++) {
    let task = gongdeTasks[i];
    let done = localStorage.getItem('gongde_' + task.id + '_' + new Date().toDateString());
    html += '<ml-tap onclick="completeGongdeTask(\'' + task.id + '\')" style="display:flex;align-items:center;gap:12px;padding:12px 16px;margin-bottom:8px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.08);border-radius:8px;cursor:pointer;' + (done ? 'opacity:.95' : '') + '" variant="card" role="button" tabindex="0">';
    html += '<span style="font-size:24px">' + task.icon + '</span>';
    html += '<div style="flex:1"><div style="font-size:14px">' + task.title + '</div><div style="font-size:11px;opacity:.95">' + task.desc + '</div></div>';
    html += '<span style="font-size:12px;color:var(--gold);padding:4px 8px;background:rgba(201,168,76,.1);border-radius:4px">+' + task.points + '</span>';
    if (done) html += '<span style="font-size:12px;color:var(--success)">✓</span>';
    html += '</ml-tap>';
  }
  container.innerHTML = html;
  updateGongdeScore();
  renderGongdeRecommend();
}

function completeGongdeTask(id) {
  let key = 'gongde_' + id + '_' + new Date().toDateString();
  if (localStorage.getItem(key)) { showToast('今日已完成此善行'); return; }
  let task = gongdeTasks.find(function(t){return t.id===id;});
  let taskPoints = task ? task.points : 0;
  localStorage.setItem(key, 'done');
  
  // 更新总功德值
  let total = parseInt(localStorage.getItem('totalMerit') || '0');
  let prevLevel = getMeritLevel(total);
  total += taskPoints;
  localStorage.setItem('totalMerit', total.toString());
  
  // 检查是否升级
  let newLevel = getMeritLevel(total);
  if (newLevel !== prevLevel) {
    showMeritUpgrade(newLevel);
  }
  
  showToast('功德圆满 ✨ +' + taskPoints + '功德');
  renderGongde();
  updateDay21Progress();
}

function updateGongdeScore() {
  let score = 0;
  for (let i = 0; i < gongdeTasks.length; i++) {
    if (localStorage.getItem('gongde_' + gongdeTasks[i].id + '_' + new Date().toDateString())) {
      score += gongdeTasks[i].points;
    }
  }
  let scoreEl = document.getElementById('gongdeScore');
  if (scoreEl) scoreEl.textContent = score;
  updateTotalMerit();
}

function updateTotalMerit() {
  let total = parseInt(localStorage.getItem('totalMerit') || '0');
  let el = document.getElementById('totalMerit');
  if (el) el.textContent = total;
  let levelEl = document.getElementById('meritLevelDisplay');
  if (levelEl) levelEl.textContent = getMeritLevel(total);
}

function getMeritLevel(total) {
  if (total >= 2000) return '🙏 圣者';
  if (total >= 1000) return '✨ 至善';
  if (total >= 300) return '🌟 大善';
  if (total >= 100) return '🔆 善者';
  return '☀️ 初善';
}

function showMeritUpgrade(level) {
  let overlay = document.createElement('div');
  overlay.className = 'merit-upgrade-overlay';
  overlay.innerHTML = '<div class="merit-upgrade-box"><h3>🎉 恭喜！</h3><p>您的功德等级已晋升为<br><strong style="font-size:22px;color:var(--gold)">「' + level + '」</strong></p><button onclick="this.parentElement.parentElement.remove()">🙏 感恩</button></div>';
  document.body.appendChild(overlay);
  overlay.onclick = function(e) { if (e.target === overlay) overlay.remove(); };
}

// ===== 功德回向 =====
function submitDedication() {
  let input = document.getElementById('dedicationInput');
  let text = input.value.trim();
  if (!text) { showToast('请输入回向对象'); return; }
  let list = JSON.parse(localStorage.getItem('meritDedications') || '[]');
  let entry = {text: text, date: new Date().toLocaleDateString('zh-CN')};
  list.unshift(entry);
  if (list.length > 10) list = list.slice(0, 10);
  localStorage.setItem('meritDedications', JSON.stringify(list));
  input.value = '';
  document.getElementById('dedicationStatus').textContent = '✅ 功德已回向给：' + text;
  renderDedicationHistory();
  showToast('🙏 功德已回向，功德无量');
}

function renderDedicationHistory() {
  let container = document.getElementById('dedicationHistory');
  if (!container) return;
  let list = JSON.parse(localStorage.getItem('meritDedications') || '[]');
  if (list.length === 0) {
    container.innerHTML = '<p style="font-size:12px;color:var(--paper3);opacity:.95">暂无回向记录</p>';
    return;
  }
  container.innerHTML = list.map(function(item) {
    return '<div class="merit-history-item"><span>🙏 ' + item.text + '</span><span style="font-size:11px;color:var(--paper3)">' + item.date + '</span></div>';
  }).join('');
}

// ===== 21天打卡进度 =====
function updateDay21Progress() {
  let day21Key = 'day21_start';
  let startTs = localStorage.getItem(day21Key);
  if (!startTs) {
    localStorage.setItem(day21Key, Date.now().toString());
    startTs = Date.now();
  }
  startTs = parseInt(startTs);
  let daysSince = Math.floor((Date.now() - startTs) / 86400000) + 1;
  
  // 统计连续有善行的天数
  let continuousDays = 0;
  let today = new Date();
  for (let d = 0; d < 21; d++) {
    let checkDate = new Date(today);
    checkDate.setDate(today.getDate() - d);
    let dateStr = checkDate.toDateString();
    let hasDeed = false;
    for (let i = 0; i < gongdeTasks.length; i++) {
      if (localStorage.getItem('gongde_' + gongdeTasks[i].id + '_' + dateStr)) {
        hasDeed = true;
        break;
      }
    }
    if (hasDeed) {
      continuousDays++;
    } else {
      break;
    }
  }
  
  let progress = Math.min(100, Math.round(continuousDays / 21 * 100));
  let remaining = Math.max(0, 21 - continuousDays);
  
  let labelEl = document.getElementById('day21Label');
  if (labelEl) labelEl.textContent = '已完成 ' + continuousDays + ' 天，还剩 ' + remaining + ' 天';
  let pctEl = document.getElementById('day21Percent');
  if (pctEl) pctEl.textContent = progress + '%';
  let fillEl = document.getElementById('day21Fill');
  if (fillEl) fillEl.style.width = progress + '%';
}

function renderGongdeRecommend() {
  let today = new Date();
  let dayOfWeek = today.getDay();
  
  let weekendRec = {
    0: {title:'周日 · 登高望远', desc:'今日宜登山祈福，参访名山古刹。推荐：就近寻找附近的寺庙或道观，感受灵山秀水的清净。登山可强身健体，拜佛可净化心灵。', activity:'爬山/公园散步/寺庙参访'},
    1: {title:'周一 · 新周祈福', desc:'新的一周开始，宜到附近寺庙或道观上香祈福，祈求一周顺利。', activity:'上香祈福/寺庙参访'},
    2: {title:'周二 · 文化之旅', desc:'今日宜参访文化古迹、博物馆，增长见闻。读书学习亦是修行。', activity:'博物馆/图书馆/文化古迹'},
    3: {title:'周三 · 行善日', desc:'今日宜做善事。可参与社区志愿服务，或帮助身边的人。', activity:'志愿服务/帮助邻里'},
    4: {title:'周四 · 静修日', desc:'今日宜静心冥想、打坐、读经典。建议晚间静坐15分钟，清空思绪。', activity:'打坐冥想/读经典'},
    5: {title:'周五 · 社交日', desc:'今日宜与朋友聚会交流，广结善缘。但注意不说是非。', activity:'朋友聚会/素食餐厅'},
    6: {title:'周六 · 户外日', desc:'今日宜外出亲近自然。公园散步、登山、观海，亲近山水有益身心。', activity:'公园/登山/观海/骑行'}
  };
  
  let rec = weekendRec[dayOfWeek];
  let container = document.getElementById('gongdeRecommend');
  if (!container) return;
  
  let html = '<div style="margin-top:16px;padding:20px;background:rgba(201,168,76,.04);border-radius:8px;border:1px solid rgba(201,168,76,.1)">';
  html += '<div style="color:var(--gold);font-size:16px;letter-spacing:2px;margin-bottom:12px">🌟 今日推荐 · ' + rec.title + '</div>';
  html += '<p style="margin-top:8px;line-height:1.8;font-size:14px">' + rec.desc + '</p>';
  html += '<p style="margin-top:8px;color:var(--gold);font-size:12px;letter-spacing:1px">推荐活动：' + rec.activity + '</p>';
  html += '<p style="margin-top:8px;font-size:12px;opacity:.95">养成好习惯，每周至少外出一次亲近自然。积少成多，功德无量。</p>';
  html += '</div>';
  
  // 好习惯养成计划
  html += '<div style="margin-top:16px;padding:16px;background:rgba(201,168,76,.03);border-radius:8px">';
  html += '<div style="color:var(--gold);font-size:14px;letter-spacing:3px;margin-bottom:12px">🌱 好习惯养成计划（21天法则）</div>';
  html += '<div style="font-size:13px;line-height:2;opacity:0.85">';
  html += '· 每日晨诵经典（养成早起习惯）<br>';
  html += '· 每日念诵口诀（训练专注力）<br>';
  html += '· 每周一次户外活动（亲近自然）<br>';
  html += '· 每周一次善行（培养慈悲心）<br>';
  html += '· 每月一次寺庙道观参访（净化心灵）<br>';
  html += '· 每月素食一天（慈悲为怀）<br>';
  html += '· 每季一次登山（强身健体）';
  html += '</div>';
  html += '<p style="margin-top:12px;font-size:12px;opacity:0.85">坚持21天养成一个习惯。从一个开始，循序渐进。积善之家必有余庆。</p>';
  html += '</div>';
  
  container.innerHTML = html;
}


// 初始化音乐和口诀
// ===== 养生调理功能 =====
function toggleWuxingDetail(element) {
  let detail = document.getElementById(element + '-detail');
  if (detail) {
    detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleYangshiTask(task) {
  let key = 'yangshi_' + task + '_' + new Date().toDateString();
  let card = document.querySelector('.yangshi-task[data-task="' + task + '"]');
  let checkBox = card.querySelector('.check-box');
  
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    card.style.background = 'rgba(255,255,255,.02)';
    card.style.borderColor = 'rgba(201,168,76,.1)';
    checkBox.innerHTML = '';
  } else {
    localStorage.setItem(key, 'done');
    card.style.background = 'rgba(39,174,96,.08)';
    card.style.borderColor = 'rgba(39,174,96,.3)';
    checkBox.innerHTML = '✓';
    checkBox.style.color = 'var(--jade)';
  }
  updateYangshiStats();
}

function updateYangshiStats() {
  let tasks = ['dazuo', 'baduanjin', 'jikou', 'zaoshui'];
  let todayCount = 0;
  tasks.forEach(function(t) {
    if (localStorage.getItem('yangshi_' + t + '_' + new Date().toDateString())) {
      todayCount++;
    }
  });
  document.getElementById('todayCheckCount').textContent = todayCount;
  
  // 计算连续打卡天数
  let continuous = 0;
  let today = new Date();
  for (let i = 0; i < 365; i++) {
    let checkDate = new Date(today);
    checkDate.setDate(today.getDate() - i);
    let dateStr = checkDate.toDateString();
    let hasCheck = false;
    tasks.forEach(function(t) {
      if (localStorage.getItem('yangshi_' + t + '_' + dateStr)) {
        hasCheck = true;
      }
    });
    if (hasCheck) {
      continuous++;
    } else {
      break;
    }
  }
  document.getElementById('continuousDays').textContent = continuous;
  
  // 更新称号
  let title = '养生新人';
  if (continuous >= 49) title = '养生宗师';
  else if (continuous >= 21) title = '养生达人';
  else if (continuous >= 7) title = '养生新手';
  document.getElementById('yangshiTitle').textContent = title;
  
  renderCheckinCalendar();
}

function renderCheckinCalendar() {
  let container = document.getElementById('checkinCalendar');
  if (!container) return;
  
  let today = new Date();
  let year = today.getFullYear();
  let month = today.getMonth();
  let daysInMonth = new Date(year, month + 1, 0).getDate();
  let firstDay = new Date(year, month, 1).getDay();
  
  let tasks = ['dazuo', 'baduanjin', 'jikou', 'zaoshui'];
  let html = '';
  
  // 星期标题
  let weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  weekDays.forEach(function(d) {
    html += '<div style="text-align:center;padding:4px;font-size:11px;color:var(--paper3)">' + d + '</div>';
  });
  
  // 空白格子
  for (let i = 0; i < firstDay; i++) {
    html += '<div></div>';
  }
  
  // 日期格子
  for (let day = 1; day <= daysInMonth; day++) {
    let checkDate = new Date(year, month, day);
    let dateStr = checkDate.toDateString();
    let hasCheck = false;
    tasks.forEach(function(t) {
      if (localStorage.getItem('yangshi_' + t + '_' + dateStr)) {
        hasCheck = true;
      }
    });
    
    let isToday = day === today.getDate();
    let bg = hasCheck ? 'rgba(39,174,96,.2)' : 'rgba(255,255,255,.02)';
    let border = isToday ? '2px solid var(--gold)' : '1px solid rgba(201,168,76,.1)';
    
    html += '<div style="text-align:center;padding:6px;font-size:12px;background:' + bg + ';border:' + border + ';border-radius:4px;color:' + (hasCheck ? 'var(--jade)' : 'var(--paper3)') + '">' + day + '</div>';
  }
  
  container.innerHTML = html;
}

function openVideo(bvid, title) {
  let url = 'https://www.bilibili.com/video/' + bvid;
  window.open(url, '_blank');
}

// ===== 道场导航功能 =====
let daochangData = [
  {rank:1, name:'北京白云观', type:'道观', region:'华北', address:'北京市西城区白云观街9号', phone:'010-63463511', openTime:'8:00-16:30', ticket:'10元', feature:'化解太岁、求财、求学最灵；太岁殿供奉60位太岁星君', fashi:'每天 9:00-11:00（太岁法会），每月初一、十五（祈福法会）', wishes:['化太岁','求学','求财','求平安'], lat:39.8885, lng:116.3278},
  {rank:2, name:'北京雍和宫', type:'寺庙', region:'华北', address:'北京市东城区雍和宫大街12号', phone:'010-64044499', openTime:'9:00-16:00', ticket:'25元', feature:'求财、化解小人、求学皆灵；开光唐卡、转运珠', fashi:'每天 10:00-12:00（祈福法会），每月初八、十五（放生法会）', wishes:['求财','求学','求平安'], lat:39.9478, lng:116.4175},
  {rank:3, name:'天津天后宫', type:'寺庙', region:'华北', address:'天津市南开区古文化街80号', phone:'022-27356427', openTime:'8:30-17:00', ticket:'10元', feature:'求平安、求姻缘、求子嗣', fashi:'每年农历三月廿三（妈祖诞辰），每天 9:00-11:00（祈福法会）', wishes:['求平安','求姻缘'], lat:39.1375, lng:117.1903},
  {rank:4, name:'上海城隍庙', type:'道观', region:'华东', address:'上海市黄浦区方浜中路249号', phone:'021-63284467', openTime:'8:30-16:30', ticket:'10元', feature:'求财、求平安、化解小人', fashi:'每天 9:00-11:00（财神法会），每月初一、十五（城隍法会）', wishes:['求财','求平安'], lat:31.2275, lng:121.4833},
  {rank:5, name:'杭州灵隐寺', type:'寺庙', region:'华东', address:'浙江省杭州市西湖区灵隐路法云弄1号', phone:'0571-87968665', openTime:'7:00-18:15', ticket:'飞来峰45元+灵隐寺30元', feature:'济公活佛道场，求平安、化解小人最灵验', fashi:'每天 9:00-11:00（祈福法会），每周六（皈依法会）', wishes:['求平安','求学'], lat:30.2392, lng:120.0997},
  {rank:6, name:'普陀山南海观音', type:'寺庙', region:'华东', address:'浙江省舟山市普陀区普陀山', phone:'0580-6091024', openTime:'6:00-18:00', ticket:'淡季140元/旺季160元', feature:'观音菩萨道场，消灾解难、有求必应', fashi:'每天 9:00-11:00（观音法会），农历二月十九、六月十九、九月十九（观音诞辰）', wishes:['消灾','求姻缘','求学'], lat:30.0050, lng:122.3833},
  {rank:7, name:'龙虎山天师府', type:'道观', region:'华东', address:'江西省鹰潭市贵溪市龙虎山镇', phone:'0701-6651009', openTime:'7:30-17:30', ticket:'通票150元', feature:'张天师道场，化煞、驱邪、治病最灵验', fashi:'每天 9:00-11:00（天师法会），每年农历正月十五（天师朝科）', wishes:['消灾','求平安'], lat:28.1167, lng:116.9667},
  {rank:8, name:'武汉长春观', type:'道观', region:'华中', address:'湖北省武汉市武昌区武珞路269号', phone:'027-88878877', openTime:'8:00-17:00', ticket:'10元', feature:'丘处机开创，化解小人、求学、延寿最灵', fashi:'每天 9:00-11:00（文昌法会），每月初一、十五（祈福法会）', wishes:['求学','求平安'], lat:30.5450, lng:114.3067},
  {rank:9, name:'武当山紫霄宫', type:'道观', region:'华中', address:'湖北省十堰市丹江口市武当山特区', phone:'0719-5669536', openTime:'7:30-17:30', ticket:'通票130元（含紫霄宫）', feature:'道教四大名山之一，化解太岁、延寿、学业皆灵', fashi:'每天 9:00-11:00（武当法会），每年农历三月初三（真武大帝诞辰）', wishes:['化太岁','求学','求平安'], lat:32.4000, lng:111.0000},
  {rank:10, name:'广州三元宫', type:'道观', region:'华南', address:'广东省广州市越秀区应元路11号', phone:'020-83551699', openTime:'8:00-17:00', ticket:'5元', feature:'求财、求平安、化解小人', fashi:'每天 9:00-11:00（财神法会），每月初一、十五（三元法会）', wishes:['求财','求平安'], lat:23.1325, lng:113.2667},
  {rank:11, name:'厦门南普陀寺', type:'寺庙', region:'华南', address:'福建省厦门市思明区思明南路515号', phone:'0592-2087282', openTime:'8:00-17:00', ticket:'免费', feature:'观音菩萨道场，求平安、求姻缘、求学皆灵', fashi:'每天 9:00-11:00（观音法会），每月初一、十五（祈福法会）', wishes:['求平安','求姻缘','求学'], lat:24.4400, lng:118.1000},
  {rank:12, name:'成都青羊宫', type:'道观', region:'西南', address:'四川省成都市青羊区一环路西二段9号', phone:'028-87766584', openTime:'8:00-18:00', ticket:'10元', feature:'老子青羊肆所在地，求财、化煞、平安最灵', fashi:'每天 9:00-11:00（老君法会），农历二月十五（老子诞辰法会）', wishes:['求财','求平安'], lat:30.6667, lng:104.0500},
  {rank:13, name:'峨眉山报国寺', type:'寺庙', region:'西南', address:'四川省乐山市峨眉山市峨眉山景区', phone:'0833-5090114', openTime:'7:00-18:00', ticket:'旺季160元/淡季110元', feature:'普贤菩萨道场，求智慧、求学、求平安皆灵', fashi:'每天 9:00-11:00（普贤法会），每年农历二月廿一（普贤诞辰）', wishes:['求学','求平安'], lat:29.5167, lng:103.4833},
  {rank:14, name:'昆明太和宫', type:'道观', region:'西南', address:'云南省昆明市盘龙区鸣凤山', phone:'0871-63828837', openTime:'8:00-18:00', ticket:'30元', feature:'求平安、求财、化解小人', fashi:'每天 9:00-11:00（太和法会），每月初一、十五（祈福法会）', wishes:['求财','求平安'], lat:25.0500, lng:102.7333},
  {rank:15, name:'西安八仙宫', type:'道观', region:'西北', address:'陕西省西安市碑林区北火巷12号', phone:'029-83267797', openTime:'8:00-17:00', ticket:'5元', feature:'八仙吕洞宾道场，求平安、化解小人、求学皆灵', fashi:'每天 9:00-11:00（八仙法会），每年农历四月十四（吕祖诞辰）', wishes:['求平安','求学'], lat:34.2667, lng:108.9500},
  {rank:16, name:'兰州白云观', type:'道观', region:'西北', address:'甘肃省兰州市城关区白云观1号', phone:'0931-8464238', openTime:'8:00-17:00', ticket:'5元', feature:'求平安、求财、化解小人', fashi:'每天 9:00-11:00（白云法会），每月初一、十五（祈福法会）', wishes:['求财','求平安'], lat:36.0667, lng:103.8333},
  {rank:17, name:'沈阳太清宫', type:'道观', region:'东北', address:'辽宁省沈阳市沈河区西顺城街16号', phone:'024-24867776', openTime:'8:00-17:00', ticket:'5元', feature:'求平安、求财、化解太岁', fashi:'每天 9:00-11:00（太清法会），每月初一、十五（祈福法会）', wishes:['化太岁','求财','求平安'], lat:41.8000, lng:123.4333},
  {rank:18, name:'长春长春观', type:'道观', region:'东北', address:'吉林省长春市南关区长春观路1号', phone:'0431-88657890', openTime:'8:00-17:00', ticket:'5元', feature:'求平安、求学、化解小人', fashi:'每天 9:00-11:00（长春法会），每月初一、十五（祈福法会）', wishes:['求学','求平安'], lat:43.8833, lng:125.3500},
  {rank:19, name:'五台山文殊寺', type:'寺庙', region:'其他', address:'山西省忻州市五台县五台山景区', phone:'0350-6542135', openTime:'7:00-18:00', ticket:'旺季145元/淡季120元', feature:'文殊菩萨道场，开智增慧、学业考试最灵', fashi:'每天 9:00-11:00（文殊法会），每年农历四月初四（文殊诞辰）', wishes:['求学'], lat:39.0333, lng:113.5833},
  {rank:20, name:'九华山肉身殿', type:'寺庙', region:'其他', address:'安徽省池州市青阳县九华山景区', phone:'0566-2831644', openTime:'7:00-17:30', ticket:'旺季190元/淡季140元', feature:'地藏菩萨道场，超度先人、消业障最灵', fashi:'每天 9:00-11:00（地藏法会），每年农历七月三十（地藏诞辰）', wishes:['超度','消灾','求平安'], lat:30.4833, lng:117.8000}
];

function renderDaochangList(data) {
  let container = document.getElementById('daochangList');
  if (!container) return;
  
  let html = '';
  data.forEach(function(d) {
    let isFav = localStorage.getItem('daochang_fav_' + d.rank);
    let typeIcon = d.type === '道观' ? '☯️' : '🪷';
    let typeColor = d.type === '道观' ? 'var(--gold)' : 'var(--violet)';
    
    html += '<div style="padding:20px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.1);border-radius:8px;transition:all .3s" onmouseover="this.style.borderColor=\'var(--gold)\'" onmouseout="this.style.borderColor=\'rgba(201,168,76,.1)\'">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">';
    html += '<div><span style="font-size:24px">' + typeIcon + '</span> <span style="color:var(--gold);font-size:16px;font-weight:600">' + d.name + '</span></div>';
    html += '<span style="padding:2px 8px;background:' + typeColor + '20;color:' + typeColor + ';font-size:11px;border-radius:4px;border:1px solid ' + typeColor + '40">' + d.type + '</span>';
    html += '</div>';
    html += '<div style="font-size:13px;line-height:1.8;color:var(--paper3)">';
    html += '<div>📍 ' + d.address + '</div>';
    html += '<div>📞 ' + d.phone + '</div>';
    html += '<div>🕐 ' + d.openTime + ' &nbsp;|&nbsp; 🎫 ' + d.ticket + '</div>';
    html += '<div style="margin-top:8px;color:var(--paper2)">✨ ' + d.feature + '</div>';
    html += '<div style="margin-top:4px;font-size:12px">🙏 法事：' + d.fashi + '</div>';
    html += '</div>';
    html += '<div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">';
    d.wishes.forEach(function(w) {
      html += '<span style="padding:2px 8px;background:rgba(201,168,76,.08);color:var(--gold);font-size:11px;border-radius:4px">' + w + '</span>';
    });
    html += '</div>';
    html += '<div style="margin-top:12px;display:flex;gap:8px">';
    html += '<button onclick="toggleFavorite(' + d.rank + ')" style="padding:6px 12px;background:' + (isFav ? 'rgba(231,76,60,.15)' : 'rgba(201,168,76,.1)') + ';border:1px solid ' + (isFav ? 'rgba(231,76,60,.3)' : 'rgba(201,168,76,.2)') + ';color:' + (isFav ? 'var(--cinn)' : 'var(--gold)') + ';border-radius:4px;cursor:pointer;font-size:12px">' + (isFav ? '❤️ 已收藏' : '🤍 收藏') + '</button>';
    html += '<button onclick="openNavigation(' + d.lat + ',' + d.lng + ')" style="padding:6px 12px;background:rgba(39,174,96,.1);border:1px solid rgba(39,174,96,.2);color:var(--jade);border-radius:4px;cursor:pointer;font-size:12px">🗺️ 导航</button>';
    html += '<button onclick="showToast(\'请拨打：' + d.phone + '\')" style="padding:6px 12px;background:rgba(52,152,219,.1);border:1px solid rgba(52,152,219,.2);color:var(--cyan);border-radius:4px;cursor:pointer;font-size:12px">📞 电话</button>';
    html += '</div>';
    html += '</div>';
  });
  
  container.innerHTML = html;
}

function filterDaochang() {
  let region = document.getElementById('regionFilter').value;
  let type = document.getElementById('typeFilter').value;
  let wish = document.getElementById('wishFilter').value;
  
  let filtered = daochangData.filter(function(d) {
    let matchRegion = region === 'all' || d.region === region;
    let matchType = type === 'all' || d.type === type;
    let matchWish = wish === 'all' || d.wishes.includes(wish);
    return matchRegion && matchType && matchWish;
  });
  
  renderDaochangList(filtered);
}

function toggleFavorite(rank) {
  let key = 'daochang_fav_' + rank;
  if (localStorage.getItem(key)) {
    localStorage.removeItem(key);
    showToast('已取消收藏');
  } else {
    localStorage.setItem(key, 'true');
    showToast('收藏成功');
  }
  filterDaochang();
  renderFavorites();
}

function openNavigation(lat, lng) {
  let url = 'https://uri.amap.com/navigation?to=' + lng + ',' + lat + '&mode=car&policy=1&src=mypage&coordinate=gaode&callnative=1';
  window.open(url, '_blank');
}

function renderFavorites() {
  let container = document.getElementById('myFavorites');
  if (!container) return;
  
  let favorites = [];
  daochangData.forEach(function(d) {
    if (localStorage.getItem('daochang_fav_' + d.rank)) {
      favorites.push(d);
    }
  });
  
  if (favorites.length === 0) {
    container.innerHTML = '<p style="color:var(--paper3);font-size:14px">暂无收藏，点击道场卡片上的"收藏"按钮添加。</p>';
    return;
  }
  
  let html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px">';
  favorites.forEach(function(d) {
    let typeIcon = d.type === '道观' ? '☯️' : '🪷';
    html += '<div style="padding:16px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.1);border-radius:8px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<span>' + typeIcon + ' <span style="color:var(--gold)">' + d.name + '</span></span>';
    html += '<button onclick="toggleFavorite(' + d.rank + ')" style="background:none;border:none;color:var(--cinn);cursor:pointer;font-size:16px">❤️</button>';
    html += '</div>';
    html += '<div style="font-size:12px;color:var(--paper3)">📍 ' + d.address + '</div>';
    html += '</div>';
  });
  html += '</div>';
  
  container.innerHTML = html;
}

function queryJiri() {
  let type = document.getElementById('jiriType').value;
  let container = document.getElementById('jiriResult');
  
  // 模拟吉日数据
  let jiriList = [];
  let today = new Date();
  
  for (let i = 1; i <= 30; i++) {
    let date = new Date(today);
    date.setDate(today.getDate() + i);
    let dayOfWeek = date.getDay();
    
    let isGood = (dayOfWeek === 0 || dayOfWeek === 6 || i % 3 === 0);
    
    if (isGood && jiriList.length < 5) {
      let weekDays = ['日', '一', '二', '三', '四', '五', '六'];
      let lunarMonths = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '冬', '腊'];
      let lunarDays = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十', '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];
      
      jiriList.push({
        date: date.getFullYear() + '年' + (date.getMonth()+1) + '月' + date.getDate() + '日',
        week: '星期' + weekDays[dayOfWeek],
        lunar: '农历' + lunarMonths[(date.getMonth()+9)%12] + '月' + lunarDays[(date.getDate()+dayOfWeek)%30],
        yi: ['祈福','求嗣','嫁娶','出行','开市'][(date.getDate()+3)%5],
        ji: ['动土','安葬','开仓','嫁娶'][(date.getDate()+2)%4],
        jishi: ['子时(23-1)', '卯时(5-7)', '午时(11-13)'][(dayOfWeek+1)%3],
        recommend: daochangData.filter(function(d) { return d.wishes.some(function(w) { return w.includes(type) || type.includes(w); }); }).slice(0,2).map(function(d) { return d.name; }).join('、') || '北京白云观、杭州灵隐寺'
      });
    }
  }
  
  let html = '<div style="padding:16px;background:rgba(201,168,76,.04);border-radius:8px;border:1px solid rgba(201,168,76,.1)">';
  html += '<div style="color:var(--gold);font-size:16px;margin-bottom:16px">📅 未来30天' + type + '吉日</div>';
  
  jiriList.forEach(function(j, idx) {
    html += '<div style="padding:12px;margin-bottom:12px;background:rgba(255,255,255,.02);border-radius:8px;border:1px solid rgba(201,168,76,.08)">';
    html += '<div style="color:var(--gold);font-size:14px;margin-bottom:8px">' + (idx+1) + '. ' + j.date + '（' + j.lunar + '） ' + j.week + '</div>';
    html += '<div style="font-size:13px;line-height:1.8;color:var(--paper3)">';
    html += '<div>宜：' + j.yi + ' &nbsp;&nbsp;忌：' + j.ji + '</div>';
    html += '<div>吉时：' + j.jishi + '</div>';
    html += '<div style="color:var(--jade)">推荐道场：' + j.recommend + '</div>';
    html += '</div></div>';
  });
  
  html += '<div style="font-size:12px;color:var(--paper3);opacity:0.85;margin-top:8px">* 以上吉日仅供参考，具体请以实际黄历为准。</div>';
  html += '</div>';
  
  container.innerHTML = html;
}

// ===== 言值沟通技巧知识库 =====
let YANZHI_KB = {
  '理论体系': {
    title: '言值沟通理论体系',
    overview: '言值（Yánzhí），谐音"颜值"，寓意说话的价值与魅力。言值沟通学融合了西方沟通理论与东方人情智慧，总结出一套适用于中国人际关系的沟通方法论。核心观点：沟通的本质不是"说"，而是"被听见"。',
    core: {
      '三要素': '① 信息准确（说什么）② 情感连接（怎么说）③ 行动驱动（说完后）',
      '四种风格': '支配型（直接果断）｜分析型（逻辑严谨）｜友善型（温和体贴）｜表达型（热情开放）',
      '五大原则': '① 真诚为本 ② 换位思考 ③ 情境适配 ④ 节奏控制 ⑤ 闭环确认'
    },
    '经典理论': {
      '西奥迪尼': '影响力六要素：互惠、承诺一致、社会认同、喜好、权威、稀缺',
      '非暴力沟通': '观察→感受→需求→请求（马歇尔·卢森堡）',
      '关键对话': '在高风险、高情绪的对话中保持安全氛围（Crucial Conversations）'
    }
  },
  '同事沟通': {
    title: '同事沟通攻略',
    overview: '职场沟通的核心是建立信任，信任的本质是利益互换。先想清楚：你能为对方解决什么问题？',
    '向上管理': {
      principle: '让领导做选择题，不做问答题',
      methods: ['汇报时带2-3个方案，注明利弊', '先说结论，再说原因', '定期主动同步进度，不要等追问', '领导关注结果，给出建设性建议'],
      '致命禁忌': '❌ 「领导，这个怎么办？」❌ 只报问题不给方案 ❌ 越级汇报未先知会直属领导'
    },
    '平级协作': {
      principle: '不说「你们」「他们」，多说「我们」',
      methods: ['主动承担连接角色', '明确各自的Action Item', '约定下次对齐时间', '感谢要公开，建议要私下'],
      '致命禁忌': '❌ 抢夺他人功劳 ❌ 当面一套背后一套 ❌ 在会议上公开指责同事'
    },
    '汇报技巧': {
      principle: '结论先行，逻辑清晰，数据支撑',
      '高效汇报公式': '背景（1句）→ 结论（1句）→ 分点论据（3点）→ 请求支持（1句）'
    },
    '金句口诀': '「职场沟通三句话：说我能做什么，说你需要什么，说我们一起能做成什么。」'
  },
  '客户沟通': {
    title: '客户沟通攻略',
    overview: '销售的本质是信任，信任的本质是价值匹配。先理解需求，再展示价值。',
    '需求挖掘': {
      principle: 'SPIN法则：S现状→P问题→I影响→N价值',
      '示范': '「您现在用什么系统？」（Situation）「数据多时查询慢吗？」（Problem）「慢3分钟对团队影响多大？」（Implication）「如果30秒查到，每年省200小时，价值多少？」（Need-payoff）'
    },
    '异议处理': {
      principle: '先跟后带：认同感受 → 引导价值',
      '示范': '「价格确实是重要因素（认同）。算三年总成本，每月只多300元，但每年省200小时（引导）。」'
    },
    '关系维护': {
      principle: '有事有人，无事也有价值',
      methods: ['每周一条行业资讯或小贴士', '重要节日发个性化问候', '客户遇到困难时第一时间出现', '分享对客户有用的第三方资源']
    },
    '金句口诀': '「客户买的不是产品，是解决问题的信心。」'
  },
  '夫妻沟通': {
    title: '夫妻沟通攻略',
    overview: '婚姻中，情绪确认比道理更重要。对事不对人，很难；不翻旧账，更难。',
    '三大杀手': {
      '冷嘲热讽': '「你每次都这样」「你根本不在乎我」',
      '翻旧账': '「上次你也是这样」「你从来没改过」',
      '冷暴力': '沉默、回避、拒绝眼神接触'
    },
    '修复四步': {
      step1: '暂停：感到情绪上升时，先说「我需要冷静一下」',
      step2: '命名：用词语精确描述情绪（受伤/失望/害怕，而非「你不爱我」）',
      step3: '表达需求：说出具体需要（「我需要你在朋友面前支持我」而非「你要尊重我」）',
      step4: '约定：商量下次类似情境的处理方式'
    },
    '日常维护': {
      '早安语': '每天出门前说一句让对方温暖的话',
      '晚安吻': '肢体接触比言语更能传递爱意',
      '冲突后': '不要睡冷战觉。睡前和好，哪怕只是说一句「我们明天再谈」'
    },
    '金句口诀': '「赢了道理，输了感情，是婚姻中最亏的买卖。」'
  },
  '亲子沟通': {
    title: '亲子沟通攻略',
    overview: '孩子的第一语言是感受，其次才是语言。先接纳情绪，再引导行为。青春期不是叛逆，是独立宣言。',
    '年龄段指南': {
      '0-6岁': '蹲下来平视孩子；用描述代替评价（「我看到你把玩具收好了」而非「你真棒」）',
      '7-12岁': '尊重隐私但保持连接；参与孩子的兴趣而非主导',
      '13-18岁': '闭嘴倾听 > 开口建议；先问「你怎么看」再说「我的建议是」',
      '成年子女': '从管理者转为顾问；尊重成年子女的决定，哪怕有风险'
    },
    '青春期攻略': {
      principle: '退一步海阔天空，进一步两败俱伤',
      '禁忌': '❌ 当众批评 ❌ 和别的孩子比较 ❌ 翻看日记/手机 ❌ 说「你懂什么」',
      '策略': '① 减少评判，增加倾听 ② 保持情绪稳定 ③ 关注行为而非态度 ④ 表达感受而非指责'
    },
    '表扬与批评': {
      '表扬': '表扬努力而非天赋（「你很努力」而非「你真聪明」）',
      '批评': '批评具体行为，不批评人格（「这次没考好，我们来看看哪里可以改进」而非「你怎么这么笨」）'
    },
    '金句口诀': '「孩子最需要的，不是完美的父母，而是真实的父母。」'
  },
  '领导沟通': {
    title: '领导沟通攻略',
    overview: '向上管理的本质是：让领导觉得你有价值、可信赖、好配合。不是拍马屁，是专业能力+靠谱态度。',
    '请示汇报': {
      principle: '主动汇报 > 被动追问；结论先行 > 过程详述',
      '频率': '重大项目节点报、风险第一时间报、季度总结全面报',
      '禁忌': '❌ 只报喜不报忧 ❌ 出了问题先甩锅 ❌ 领导问了三遍才说'
    },
    '资源争取': {
      principle: '说明投入产出比，给领导决策的充分理由',
      '公式': '资源需求（具体数字）＋ 预期回报（可量化）＋ 风险预案（备用方案）',
      '示范': '「申请增配2人，预计可将项目周期从8周缩至5周，额外成本X，预期收益Y。」'
    },
    '预期管理': {
      principle: '低估承诺，高估交付',
      '保守估计': '说9成把握，做12成努力',
      '提前预警': '发现问题第一时间说，不要等到无法挽回再说'
    },
    '金句口诀': '「领导最欣赏的下属：凡事有交代，件件有着落，事事有回音。」'
  },
  '商务谈判': {
    title: '商务谈判攻略',
    overview: '谈判的本质是价值的交换与分配。准备充分，才能在谈判桌上游刃有余。',
    '谈判前准备': {
      '知己': '底线价格、最优替代方案(BATNA)、最高可接受价格',
      '知彼': '对方决策人、决策链、核心诉求、压力点',
      '备选': '准备3套方案：A理想/B现实/C底线'
    },
    '谈判开局': {
      principle: '开局定调，不要先让步',
      '策略': '① 开局报价留有余地 ② 不要接受第一次报价 ③ 强调自身独特价值'
    },
    '让步艺术': {
      principle: '每一次让步都要换取对等回报',
      '禁忌': '❌ 单独让步不换取回报 ❌ 让步幅度递减过快 ❌ 提前暴露底线',
      '技巧': '「如果贵方能在付款周期上给予支持，我们可以在价格上做一定调整。」'
    },
    '双赢思维': {
      principle: '最好的谈判是双方都觉得赢了',
      '寻找共同利益': '在立场背后找到深层利益重叠'
    },
    '金句口诀': '「谈判桌上最有力的武器是：随时可以离开的底气。」'
  },
  '冲突化解': {
    title: '冲突化解攻略',
    overview: '冲突的本质是需求未被满足。化解冲突的关键：先处理情绪，再处理事情。',
    '冲突类型': {
      '任务冲突': '目标、方法、程序不一致 → 理性讨论解决',
      '关系冲突': '价值观、个性、沟通风格冲突 → 换位理解解决',
      '利益冲突': '资源、权力、地位冲突 → 谈判协商解决'
    },
    '化解五步': {
      step1: '降温：双方情绪激动时，先暂停10分钟',
      step2: '倾听：让对方说完，不要打断',
      step3: '复述：用自己的话复述对方观点（「你的意思是……对吗」）',
      step4: '表达：说出自己的感受和需求（「我感到……因为我……」）',
      step5: '共建：一起找解决方案'
    },
    '万能话术': '「我理解你的担忧。我们来看看怎么能找到一个双方都能接受的方案？」',
    '金句口诀': '「解决冲突最好的时机，是在冲突刚发生时；解决冲突最好的地点，是在对方愿意倾听的地方。」'
  },
  '演讲表达': {
    title: '演讲表达攻略',
    overview: '演讲的最高境界是：让听众觉得你想说的就是他们想听的。准备三个层次：内容、结构、情感。',
    '内容准备': {
      '受众分析': '听众是谁？他们关心什么？他们已经知道什么？',
      '核心信息': '用一句话说清楚你要传达的最重要的事',
      '素材选择': '一个故事胜过十个数据；一个类比胜过十个解释'
    },
    '结构设计': {
      '经典结构': '开场（抓注意力）→ 主体（3个要点）→ 结尾（行动号召）',
      '开场技巧': '提问开场、数据开场、故事开场、引用开场',
      '结尾技巧': '总结要点、情感升华、明确行动'
    },
    '舞台表现': {
      '声音': '关键句放慢，重复重要词语，善用停顿',
      '肢体': '眼神（不要只看PPT）、手势（自然开放）、站位（面对观众）',
      '心态': '紧张是正常的，把紧张转化为能量；关注内容而非自己'
    },
    '金句口诀': '「演讲不是表演，是分享。分享你相信的东西，就没有人能否认真实。」'
  },

  // ===== 历史名人沟通案例 =====
  '历史名嘴': {
    title: '历史名人沟通案例',
    overview: '中国历史上涌现出无数沟通大师，他们以三寸不烂之舌，或退百万雄兵，或合纵连横，或化解危机。他们的沟通智慧至今仍值得我们学习。',
    '诸葛亮舌战群儒': {
      背景: '赤壁之战前，诸葛亮奉命出使东吴，联合孙权抗曹。东吴众臣多主降，诸葛亮须以一己之力说服孙权及满朝文武。',
      沟通策略: '① 先破后立——逐一驳倒主降派的论点，再亮出联兵抗曹的大计 ② 因人施策——对张昭等文臣以理服人，对孙权以情动之、以利害说之 ③ 亮底牌但不露怯——明言曹操兵马众多，但指出其弱点',
      经典对话: '诸葛亮对张昭：「吾观曹操百万之众，如蝼蚁耳！吾一挥手，皆为齑粉矣！」——虽然夸张，但展示了极强的自信心，先声夺人。',
      启示: '沟通中自信心是第一要素。面对一群反对者，需要先破后立，逐个击破，最后亮明方案。'
    },
    '苏秦合纵': {
      背景: '战国时期，秦国强大，六国岌岌可危。苏秦游说六国合纵抗秦，佩六国相印，成为历史上最成功的说客之一。',
      沟通策略: '① 利害分析——为每个国君算清「降秦」与「合纵」的利弊得失 ② 因国施策——对韩说「宁为鸡口不为牛后」，对齐说「齐地方圆两千里」，对燕说「赵在后方的威胁」 ③ 反复跟进——一个国君说通了再游说下一个，形成链式效应',
      经典对话: '苏秦对韩王：「臣闻鄙谚曰：宁为鸡口，无为牛后。今大王事秦，窃为大王羞之。」——用通俗谚语激发国君的自尊心。',
      启示: '说服的核心是让对方看到「不行动」的损失比「行动」的风险更大。因人施策是高效说服的关键。'
    },
    '张仪连横': {
      背景: '苏秦死后，张仪为秦国游说六国连横事秦，以「连横」破「合纵」，瓦解了六国联盟。',
      沟通策略: '① 制造内部分化——利用六国之间的矛盾，逐个击破 ② 许诺利益——以秦国之强为后盾，以土地城池为诱饵 ③ 恩威并施——既展示秦国的强大威慑力，又给出实际利益',
      经典对话: '张仪对楚王：「大王诚能听臣，臣请以秦女为大王箕帚之妾，效商於之地六百里。」——先给甜头，再分化楚齐联盟。',
      启示: '谈判中「分而治之」是极有效的策略。通过分化对手联盟，逐个突破，比正面硬刚整个联盟高效得多。'
    },
    '晏子使楚': {
      背景: '齐相晏婴出使楚国，楚王三次设计羞辱他：开小门让他进、指齐国无人、说齐国人善偷。晏子三次巧妙反击，维护了齐国尊严。',
      沟通策略: '① 以退为进——面对开小门的羞辱，晏子说「使狗国者从狗门入」，暗示楚国若为狗国方可从狗门入 ② 类比反击——面对「齐无人」的嘲讽，以「张袂成阴、挥汗成雨」形容齐国人多 ③ 反将一军——面对「齐人善偷」的羞辱，以「橘生淮南则为橘，生于淮北则为枳」说明环境使人变坏，反讽楚国社会风气差',
      经典对话: '晏子：「橘生淮南则为橘，生于淮北则为枳，叶徒相似，其实味不同。所以然者何？水土异也。今民生长于齐不盗，入楚则盗，得无楚之水土使民善盗耶？」',
      启示: '面对恶意挑衅，不卑不亢、以智慧反击是最好的策略。类比和反问是高级沟通技巧，让对方自取其辱。'
    },
    '触龙说赵太后': {
      背景: '赵太后不肯让幼子长安君到齐国做人质以换取救兵，触龙以聊天的方式巧妙说服太后，成为「换位思考」的经典案例。',
      沟通策略: '① 先聊家常——触龙不急于说正事，先聊自己的脚病和饮食，拉近与太后的心理距离 ② 由己及人——先说自己疼爱幼子，想为幼子谋个差事，引出「父母之爱子」的话题 ③ 反客为主——指出太后爱燕后胜过爱长安君，因为太后为燕后考虑长远，却不让长安君建功立业 ④ 利害转换——指出「位尊而无功，奉厚而无劳」是危险的，让长安君质齐正是为他积累功勋',
      经典对话: '触龙：「父母之爱子，则为之计深远。媪之送燕后也，持其踵为之泣，念悲其远也，亦哀之矣。已行，非弗思也，祭祀必祝之，祝曰：必勿使反。」',
      启示: '说服长辈或上级，直接说理往往无效。先建立情感连接，再以「我也是父母」「我也爱孩子」共情，最后引导对方自己得出结论。'
    },
    '邹忌讽齐王纳谏': {
      背景: '齐相邹忌以自身比美的经历，巧妙劝谏齐威王广开言路、虚心纳谏。',
      沟通策略: '① 以己喻人——先讲自己的故事（妻子偏私、妾畏惧、客有求于己，都说他比徐公美），再类比到齐王身上 ② 不直接批评——不说「大王你应该纳谏」，而是说「大王受蒙蔽更深」 ③ 正向激励——提出「上赏、中赏、下赏」三级纳谏机制，让进谏变成荣誉',
      经典对话: '邹忌：「臣诚知不如徐公美。臣之妻私臣，臣之妾畏臣，臣之客欲有求于臣，皆以美于徐公。今齐地方千里，百二十城，宫妇左右莫不私王，朝廷之臣莫不畏王，四境之内莫不有求于王：由此观之，王之蔽甚矣。」',
      启示: '劝谏上级最好的方式是「以故事说理」，让对方自己领悟。直接批评容易引起反感，委婉类比则容易被接受。'
    },
    '金句口诀': '「古人沟通之要：诸葛亮先破后立，苏秦因人施策，晏子以智反击，触龙由己及人，邹忌以事喻理。」'
  }
};

// ===== 言值 kb-section =====
let yanzhiSection = document.createElement('div');
yanzhiSection.className = 'kb-section';
yanzhiSection.id = 'kb-yanzhi';
yanzhiSection.innerHTML = '<div class="chapter"><h3 class="chapter-title">一、言值沟通理论体系</h3><div class="chapter-content"><p style="color:var(--gold);margin-bottom:16px;font-size:14px">言值（Yánzhí），谐音"颜值"，寓意说话的价值与魅力。融合西方沟通理论与东方人情智慧，总结出一套适用于中国人际关系的沟通方法论。</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:12px;margin:16px 0">' + (function(){let d=YANZHI_KB['理论体系'].core;let h='';for(let k in d){h+='<div style="background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.12);border-radius:8px;padding:14px"><div style="color:var(--gold);font-size:13px;margin-bottom:8px">◆ '+k+'</div><div style="color:var(--paper2);font-size:13px;line-height:1.8">'+d[k]+'</div></div>';}return h;})() + '</div><div class="quote"><div class="quote-text">沟通的本质不是"说"，而是"被听见"。</div></div></div></div><div class="chapter"><h3 class="chapter-title">二、八大沟通场景速查</h3><div class="chapter-content"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px">' + ['同事沟通','客户沟通','夫妻沟通','亲子沟通','领导沟通','商务谈判','冲突化解','演讲表达'].map(function(s){let icons={'同事沟通':'🤝','客户沟通':'💼','夫妻沟通':'💑','亲子沟通':'👨👧','领导沟通':'🎯','商务谈判':'⚖️','冲突化解':'🕊️','演讲表达':'🎤'};let kb={'同事沟通':'同事沟通','客户沟通':'客户沟通','夫妻沟通':'夫妻沟通','亲子沟通':'亲子沟通','领导沟通':'领导沟通','商务谈判':'商务谈判','冲突化解':'冲突化解','演讲表达':'演讲表达'};let d=YANZHI_KB[kb[s]];return '<ml-tap style="background:linear-gradient(135deg,rgba(230,126,34,.08),rgba(230,126,34,.02));border:1px solid rgba(230,126,34,.2);border-radius:12px;padding:16px;cursor:pointer" onclick="showYanzhiDetail(\''+kb[s]+'\')" variant="card" role="button" tabindex="0"><div style="font-size:28px;margin-bottom:10px">'+icons[s]+'</div><div style="color:var(--gold);font-size:14px;font-weight:bold;margin-bottom:6px">'+s+'</div><div style="color:var(--paper2);font-size:12px;line-height:1.7">'+(d&&d.overview||'')+'</div></ml-tap>';}).join('') + '</div></div></div><div class="chapter"><h3 class="chapter-title">三、历史名人沟通案例</h3><div class="chapter-content"><p style="color:var(--paper2);font-size:13px;line-height:1.9;margin-bottom:16px">中国历史上涌现出无数沟通大师，以三寸不烂之舌，或退百万雄兵，或合纵连横，或化解危机。</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">' + ['诸葛亮舌战群儒','苏秦合纵','张仪连横','晏子使楚','触龙说赵太后','邹忌讽齐王纳谏'].map(function(s){let d=YANZHI_KB['历史名嘴'][s];let icon={'诸葛亮舌战群儒':'⚔️','苏秦合纵':'🤝','张仪连横':'♟️','晏子使楚':'🍊','触龙说赵太后':'👨‍👩‍👦','邹忌讽齐王纳谏':'📜'}[s]||'💬';return '<ml-tap style="background:linear-gradient(135deg,rgba(230,126,34,.08),rgba(230,126,34,.02));border:1px solid rgba(230,126,34,.2);border-radius:12px;padding:16px;cursor:pointer" onclick="showYanzhiDetail(\'历史名嘴\')" variant="card" role="button" tabindex="0"><div style="font-size:28px;margin-bottom:10px">'+icon+'</div><div style="color:var(--gold);font-size:14px;font-weight:bold;margin-bottom:6px">'+s+'</div><div style="color:var(--paper2);font-size:12px;line-height:1.7">'+(d&&d.背景||'')+'</div></ml-tap>';}).join('') + '</div></div></div><div class="chapter"><h3 class="chapter-title">四、沟通金句口诀</h3><div class="chapter-content">' + ['同事沟通','客户沟通','夫妻沟通','亲子沟通','领导沟通','商务谈判','冲突化解','演讲表达','历史名嘴'].map(function(s){let kb={'同事沟通':'同事沟通','客户沟通':'客户沟通','夫妻沟通':'夫妻沟通','亲子沟通':'亲子沟通','领导沟通':'领导沟通','商务谈判':'商务谈判','冲突化解':'冲突化解','演讲表达':'演讲表达','历史名嘴':'历史名嘴'};let d=YANZHI_KB[kb[s]];return '<div class="quote"><div class="quote-text" style="font-size:13px">'+(d&&d['金句口诀']||'')+'</div><div class="quote-author">—— '+s+'</div></div>';}).join('') + '</div></div><div id="yanzhi-detail" style="display:none;margin-top:24px;padding:20px;background:rgba(230,126,34,.04);border:1px solid rgba(230,126,34,.15);border-radius:12px"></div><div style="text-align:center;margin-top:24px"><button onclick="showYanzhiDetail=null;document.getElementById(\'yanzhi-detail\').style.display=\'none\'" style="background:none;border:1px solid rgba(230,126,34,.3);color:var(--gold2);padding:8px 24px;border-radius:20px;cursor:pointer;font-size:13px">重置视图</button></div></div>';

// Insert after kb-daochang
let kbDaochang = document.getElementById('kb-daochang');
if (kbDaochang && kbDaochang.parentNode) {
  kbDaochang.parentNode.insertBefore(yanzhiSection, kbDaochang.nextSibling);
}

function showYanzhiDetail(key) {
  let d = YANZHI_KB[key];
  if (!d) return;
  let el = document.getElementById('yanzhi-detail');
  if (!el) return;
  let html = '<h3 style="color:var(--gold);font-size:18px;margin-bottom:16px;letter-spacing:2px">💬 '+(d.title||key)+'</h3>';
  html += '<p style="color:var(--paper2);font-size:14px;line-height:1.9;margin-bottom:16px;border-left:3px solid var(--orange);padding-left:14px">'+(d.overview||'')+'</p>';
  for (let k in d) {
    if (k === 'title' || k === 'overview' || k === '金句口诀') continue;
    let v = d[k];
    if (typeof v === 'object') {
      html += '<div style="background:rgba(230,126,34,.04);border-radius:8px;padding:14px;margin-bottom:12px">';
      html += '<div style="color:var(--gold2);font-size:13px;font-weight:bold;margin-bottom:8px">◆ '+k+'</div>';
      if (typeof v === 'string') {
        html += '<div style="color:var(--paper2);font-size:13px;line-height:1.8">'+v+'</div>';
      } else {
        for (let sk in v) {
          if (typeof v[sk] === 'string' && v[sk].charAt(0) !== '❌' && v[sk].charAt(0) !== '①' && v[sk].charAt(0) !== '■') {
            html += '<div style="color:var(--paper2);font-size:13px;line-height:1.8;margin:6px 0"><strong style="color:var(--orange)">'+sk+'：</strong>'+v[sk]+'</div>';
          } else if (Array.isArray(v[sk])) {
            html += '<div style="margin:6px 0"><strong style="color:var(--gold2);font-size:12px">'+sk+'：</strong><div style="margin-top:4px">'+v[sk].map(function(item){return '<span style="display:inline-block;background:rgba(230,126,34,.08);padding:3px 10px;margin:3px;border-radius:4px;font-size:12px">'+item+'</span>';}).join('')+'</div></div>';
          } else {
            html += '<div style="color:var(--paper2);font-size:13px;line-height:1.8;margin:6px 0"><strong style="color:var(--orange)">'+sk+'：</strong>'+v[sk]+'</div>';
          }
        }
      }
      html += '</div>';
    }
  }
  if (d['金句口诀']) {
    html += '<div class="quote"><div class="quote-text">'+d['金句口诀']+'</div><div class="quote-author">—— 金句口诀</div></div>';
  }
  el.innerHTML = html;
  el.style.display = 'block';
  el.scrollIntoView({behavior:'smooth',block:'start'});
}

document.addEventListener('DOMContentLoaded', function() {
  renderMusicCards();
  renderKoujueCards();
  renderDailyKoujue();
  renderGongde();
  renderTudisGraph();
  renderDaochangList(daochangData);
  renderCheckinCalendar();
  updateYangshiStats();
  renderFavorites();
});

// ==================== 知识图谱 数据 ====================
let WUXING_DATA = {
  '木': {
    color:'var(--jade)',direction:'东方',season:'春季',organ:'肝胆',emotion:'仁慈',
    sheng:'火',ke:'土',beKe:'金',
    desc:'木主仁，性直情和，旺则仁慈慷慨，过旺则固执倔强。',
    source:'《尚书·洪范》（西周）载"木曰曲直"；《黄帝内经·素问·金匮真言论》（战国至西汉）载"东方青色，入通于肝，开窍于目，藏精于肝"；《黄帝内经·素问·阴阳应象大论》（战国至西汉）载"在志为怒"',
    zangfu:'肝藏血，主疏泄，调气机；胆附于肝，主决断。《灵枢·本藏》（战国至西汉）载"肝应胆，坚者胆实，脆者胆薄"',
    symptom_over:'肝火上炎：面红目赤、胁肋胀痛、头痛眩晕、急躁易怒。《金匮要略·脏腑经络先后病脉证》（东汉·张仲景）载"肝气盛则多怒"',
    symptom_weak:'肝血不足：眼干涩、视力减退、爪甲脆薄、肢体麻木、月经量少。《医宗金鉴·补注（删补名医方论）》（清·吴谦）载"肝血虚则眼目涩"',
    adjust:'食养：菠菜/绿豆/芹菜（绿色入肝）；药养：枸杞/菊花/桑椹（《本草纲目》明·李时珍）；情志：制怒，常以青绿色宁神；穴位：太冲、肝俞。《针灸甲乙经》（西晋·皇甫谧）载"肝俞主肝胀，口苦"',
    yuanwen:'木曰曲直。曲直作酸。酸伤筋，辛胜酸。——《尚书·洪范》'
  },
  '火': {
    color:'var(--cinn2)',direction:'南方',season:'夏季',organ:'心脏',emotion:'礼仪',
    sheng:'土',ke:'金',beKe:'水',
    desc:'火主礼，性急热情，旺则礼让大方，过旺则急躁冲动。',
    source:'《尚书·洪范》（西周）载"火曰炎上"；《黄帝内经·素问·金匮真言论》（战国至西汉）载"南方赤色，入通于心，开窍于舌，藏精于心"；《黄帝内经·素问·阴阳应象大论》（战国至西汉）载"在志为喜"',
    zangfu:'心为君主之官，主血脉，藏神；小肠为受盛之官，化物出焉。《灵枢·本神》（战国至西汉）载"心藏脉，脉舍神"',
    symptom_over:'心火亢盛：心烦失眠、口舌生疮、面红多汗、心悸怔忡。《丹溪心法·火门》（元·朱震亨）载"诸痛痒疮，皆属于心"',
    symptom_weak:'心阳不足：畏寒肢冷、面色苍白、精神萎靡、心悸气短。《伤寒论·少阴病脉证并治》（东汉·张仲景）载"少阴病，心烦不得卧"',
    adjust:'食养：红枣/红豆/西红柿/枸杞（赤色入心）；药养：莲子心/丹参/酸枣仁（《本草纲目》）；情志：戒大喜过望，常保平和；穴位：神门、心俞。《针灸甲乙经》（西晋·皇甫谧）载"心俞主心病"',
    yuanwen:'火曰炎上。炎上作苦。苦伤气，咸胜苦。——《尚书·洪范》'
  },
  '土': {
    color:'var(--warn)',direction:'中央',season:'长夏',organ:'脾胃',emotion:'信义',
    sheng:'金',ke:'水',beKe:'木',
    desc:'土主信，性厚稳重，旺则诚实可靠，过旺则愚顽不化。',
    source:'《尚书·洪范》（西周）载"土爰稼穑"；《黄帝内经·素问·金匮真言论》（战国至西汉）载"中央黄色，入通于脾，开窍于口，藏精于脾"；《黄帝内经·素问·阴阳应象大论》（战国至西汉）载"在志为思"',
    zangfu:'脾为仓廪之官，主运化，统血；胃为水谷之海，主受纳腐熟。《脾胃论·脾胃盛衰论》（金·李杲）载"脾胃为后天之本，气血生化之源"',
    symptom_over:'脾胃湿盛：腹胀便溏、口臭黏腻、痰多体胖、身体困重。《太平惠民和剂局方》（宋代官修）载"湿盛则濡泻"',
    symptom_weak:'脾胃虚弱：食欲不振、消瘦乏力、贫血肌萎、四肢倦怠。《医宗金鉴·四十卷》（清·吴谦）载"脾胃虚则百病生"',
    adjust:'食养：小米/南瓜/山药/红薯（黄色入脾）；药养：茯苓/白术/党参（《本草纲目》）；情志：少思虑，常以香疗健脾；穴位：足三里、脾俞。《针灸甲乙经》（西晋·皇甫谧）载"脾俞主脾胃虚弱"',
    yuanwen:'土爰稼穑。稼穑作甘。甘伤肉，酸胜甘。——《尚书·洪范》'
  },
  '金': {
    color:'var(--paper2)',direction:'西方',season:'秋季',organ:'肺肠',emotion:'义气',
    sheng:'水',ke:'木',beKe:'火',
    desc:'金主义，性刚果断，旺则义薄云天，过旺则冷酷残忍。',
    source:'《尚书·洪范》（西周）载"金曰从革"；《黄帝内经·素问·金匮真言论》（战国至西汉）载"西方白色，入通于肺，开窍于鼻，藏精于肺"；《黄帝内经·素问·阴阳应象大论》（战国至西汉）载"在志为忧（悲）"',
    zangfu:'肺为相傅之官，主气，司呼吸；大肠为传导之官，变化出焉。《灵枢·经脉》（战国至西汉）载"肺手太阴之脉，起于中焦"',
    symptom_over:'肺气壅盛：咳嗽气喘、痰黄黏稠、皮肤干燥、便秘。《证治汇补·咳嗽》（清·李用粹）载"肺为娇脏，畏寒畏热"',
    symptom_weak:'肺气虚弱：气短懒言、易感冒、声音低微、免疫力低。《永类钤方》（元·李仲南）载"肺气虚则息短"',
    adjust:'食养：白萝卜/百合/银耳/梨（白色入肺）；药养：川贝/麦冬/黄芪（《本草纲目》）；情志：远离悲伤，常以芳香宣肺；穴位：列缺、肺俞。《针灸甲乙经》（西晋·皇甫谧）载"肺俞主肺胀"',
    yuanwen:'金曰从革。从革作辛。辛伤皮毛，苦胜辛。——《尚书·洪范》'
  },
  '水': {
    color:'var(--cyan2)',direction:'北方',season:'冬季',organ:'肾膀胱',emotion:'智慧',
    sheng:'木',ke:'火',beKe:'土',
    desc:'水主智，性聪机敏，旺则智慧过人，过旺则阴险多疑。',
    source:'《尚书·洪范》（西周）载"水曰润下"；《黄帝内经·素问·金匮真言论》（战国至西汉）载"北方黑色，入通于肾，开窍于耳，藏精于肾"；《黄帝内经·素问·阴阳应象大论》（战国至西汉）载"在志为恐"',
    zangfu:'肾为先天之本，藏精，主生长、发育、生殖；膀胱州都之官，津液藏焉。《难经·三十六难》（秦越人/扁鹊）载"肾两者，非皆肾也，其左者为肾，右者为命门"',
    symptom_over:'肾水过盛：水肿肢胀、小便频数、腰膝酸软、畏寒肢冷。《景岳全书·肿胀》（明·张介宾）载"凡水肿等证，乃肺脾肾三脏相干为病"',
    symptom_weak:'肾阴不足：耳鸣眩晕、腰痛腿软、失眠多梦、男子遗精女子经闭。《医宗必读·肾为先天本》（明·李中梓）载"肾为水火之脏，藏真阴而寓元阳"',
    adjust:'食养：黑豆/黑芝麻/桑椹/海带（黑色入肾）；药养：熟地黄/山茱萸/枸杞（《本草纲目》）；情志：避惊恐，常以养精蓄锐；穴位：涌泉、肾俞、太溪。《针灸甲乙经》（西晋·皇甫谧）载"肾俞主肾胀腰痛"',
    yuanwen:'水曰润下。润下作咸。咸伤血，甘胜咸。——《尚书·洪范》'
  }
};
let BAGUA_DATA = {
  '乾':{symbol:'☰',element:'金',direction:'西北',organ:'头',family:'父',nature:'天',desc:'乾为天，刚健中正，为父、为首、为君。',source:'《易传·说卦》（战国至西汉）载"乾为天，为父，为圆，为君，为金"；《易经·乾卦》象辞"天行健，君子以自强不息"'},
  '兑':{symbol:'☱',element:'金',direction:'西方',organ:'口',family:'少女',nature:'泽',desc:'兑为泽，喜悦和顺，为少女、为口、为说。',source:'《易传·说卦》（战国至西汉）载"兑为泽，为少女，为口舌，为巫，为金"'},
  '离':{symbol:'☲',element:'火',direction:'南方',organ:'目',family:'中女',nature:'火',desc:'离为火，光明美丽，为中女、为目、为丽。',source:'《易传·说卦》（战国至西汉）载"离为火，为目，为日，为电，为中女，为甲胄，为戈兵；其于人也，为大腹"'},
  '震':{symbol:'☳',element:'木',direction:'东方',organ:'足',family:'长男',nature:'雷',desc:'震为雷，动而有声，为长男、为足、为动。',source:'《易传·说卦》（战国至西汉）载"震为雷，为龙，为玄黄，为敷，为大涂，为长子"'},
  '巽':{symbol:'☴',element:'木',direction:'东南',organ:'股',family:'长女',nature:'风',desc:'巽为风，入而无孔不入，为长女、为股、为入。',source:'《易传·说卦》（战国至西汉）载"巽为木，为风，为长女，为绳直，为工，为白，为长，为高，为进退，为不果"'},
  '坎':{symbol:'☵',element:'水',direction:'北方',organ:'耳',family:'中男',nature:'水',desc:'坎为水，险陷深渊，为中男、为耳、为险。',source:'《易传·说卦》（战国至西汉）载"坎为水，为沟渎，为隐伏，为矫輮，为弓轮；其于人也，为加忧，为心病"'},
  '艮':{symbol:'☶',element:'土',direction:'东北',organ:'手',family:'少男',nature:'山',desc:'艮为山，静止稳重，为少男、为手、为止。',source:'《易传·说卦》（战国至西汉）载"艮为山，为径路，为小石，为门阙，为果蓏，为寺，为指，为狗，为鼠，为黔喙之属"'},
  '坤':{symbol:'☷',element:'土',direction:'西南',organ:'腹',family:'母',nature:'地',desc:'坤为地，厚德载物，为母、为腹、为顺。',source:'《易传·说卦》（战国至西汉）载"坤为地，为母，为布，为釜，为吝啬，为子母牛，为大舆，为文，为众，为柄；其于地也，为黑"'},
  '乾宫':{symbol:'☰',element:'金',direction:'西北',organ:'头',family:'父',nature:'天',desc:'乾宫八卦：乾为天、天风姤、天山遁、天地否、风地观、山地剥、火地晋、火天大有',source:'《易经·乾卦》'},
  '兑宫':{symbol:'☱',element:'金',direction:'西方',organ:'口',family:'少女',nature:'泽',desc:'兑宫八卦：兑为泽、泽水困、泽地萃、泽山咸、水山蹇、地山谦、雷山小过、雷泽归妹',source:'《易经·兑卦》'}
};
let TIANGAN = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
let DIZHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
let TIANGAN_DATA = {
  '甲':{element:'木',yinyang:'阳',organ:'胆',nature:'栋梁之木',desc:'甲木参天，正直刚毅。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"甲木参天，脱胎要火"；十干体象歌载"甲木参天，脱胎始遂"'},
  '乙':{element:'木',yinyang:'阴',organ:'肝',nature:'花草之木',desc:'乙木柔美，温和善良。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"乙木根荄，种育穷年"；十干体象歌载"乙木engg体春种得荫"'},
  '丙':{element:'火',yinyang:'阳',organ:'小肠',nature:'太阳之火',desc:'丙火光明，热情豪放。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"丙火赫奕，纯阳之象"；十干体象歌载"丙火明明与太阳"'},
  '丁':{element:'火',yinyang:'阴',organ:'心',nature:'灯烛之火',desc:'丁火温暖，内敛细腻。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"丁火继灰熔，照耀无声"；十干体象歌载"丁火供灵炬"'},
  '戊':{element:'土',yinyang:'阳',organ:'胃',nature:'大地之土',desc:'戊土厚重，包容稳重。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"戊土高岗，势最镇静"；十干体象歌载"戊土城墙岸"'},
  '己':{element:'土',yinyang:'阴',organ:'脾',nature:'田园之土',desc:'己土温润，养育万物。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"己土薄而且卑，滋生之力弱"；十干体象歌载"己土田园属"'},
  '庚':{element:'金',yinyang:'阳',organ:'大肠',nature:'刀剑之金',desc:'庚金刚毅，果敢决断。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"庚金刚健，肃杀果断"；十干体象歌载"庚金顽钝"'},
  '辛':{element:'金',yinyang:'阴',organ:'肺',nature:'珠玉之金',desc:'辛金温润，精致细腻。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"辛金软弱，温润可喜"；十干体象歌载"辛金珠玉"'},
  '壬':{element:'水',yinyang:'阳',organ:'膀胱',nature:'大海之水',desc:'壬水浩瀚，智慧深远。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"壬水汪洋，浩荡难收"；十干体象歌载"壬水洋洋"'},
  '癸':{element:'水',yinyang:'阴',organ:'肾',nature:'雨露之水',desc:'癸水柔顺，润物无声。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）载"癸水滋腻，柔弱难制"；十干体象歌载"癸水雨露"'},
  '甲木':{element:'木',yinyang:'阳',organ:'胆',nature:'栋梁之木',desc:'甲木参天，正直刚毅。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '乙木':{element:'木',yinyang:'阴',organ:'肝',nature:'花草之木',desc:'乙木柔美，温和善良。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '丙火':{element:'火',yinyang:'阳',organ:'小肠',nature:'太阳之火',desc:'丙火光明，热情豪放。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '丁火':{element:'火',yinyang:'阴',organ:'心',nature:'灯烛之火',desc:'丁火温暖，内敛细腻。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '戊土':{element:'土',yinyang:'阳',organ:'胃',nature:'大地之土',desc:'戊土厚重，包容稳重。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '己土':{element:'土',yinyang:'阴',organ:'脾',nature:'田园之土',desc:'己土温润，养育万物。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '庚金':{element:'金',yinyang:'阳',organ:'大肠',nature:'刀剑之金',desc:'庚金刚毅，果敢决断。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '辛金':{element:'金',yinyang:'阴',organ:'肺',nature:'珠玉之金',desc:'辛金温润，精致细腻。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '壬水':{element:'水',yinyang:'阳',organ:'膀胱',nature:'大海之水',desc:'壬水浩瀚，智慧深远。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'},
  '癸水':{element:'水',yinyang:'阴',organ:'肾',nature:'雨露之水',desc:'癸水柔顺，润物无声。',source:'《渊海子平·论天干阴阳》（宋代·徐大升）'}
};
let DIZHI_DATA = {
  '子':{element:'水',animal:'鼠',time:'23-1',cang:'癸',desc:'子水阴极阳生，聪明灵动。',source:'《渊海子平·论地支》（宋代·徐大升）载"子者，滋也，滋始于万物；为一阳初生，藏癸水"；十二支配脏腑歌载"子属膀胱水道耳"'},
  '丑':{element:'土',animal:'牛',time:'1-3',cang:'己癸辛',desc:'丑土藏金水，内秀勤恳。',source:'《渊海子平·论地支》（宋代·徐大升）载"丑者，纽也，纽结于万物；丑为金库，藏己癸辛"'},
  '寅':{element:'木',animal:'虎',time:'3-5',cang:'甲丙戊',desc:'寅木阳刚之始，威猛果断。',source:'《渊海子平·论地支》（宋代·徐大升）载"寅者，引也，引达于万物；寅为木之孟，藏甲丙戊"；十二支配脏腑歌载"寅胆为肝脏"'},
  '卯':{element:'木',animal:'兔',time:'5-7',cang:'乙',desc:'卯木柔和，善良细腻。',source:'《渊海子平·论地支》（宋代·徐大升）载"卯者，冒也，物之遂也；卯为木之仲，藏乙木"；十二支配脏腑歌载"卯属十指定为肝"'},
  '辰':{element:'土',animal:'龙',time:'7-9',cang:'戊乙癸',desc:'辰土水库，深藏不露。',source:'《渊海子平·论地支》（宋代·徐大升）载"辰者，震也，物之震发；辰为土之墓，藏戊乙癸"'},
  '巳':{element:'火',animal:'蛇',time:'9-11',cang:'丙庚戊',desc:'巳火阳极，灵巧机智。',source:'《渊海子平·论地支》（宋代·徐大升）载"巳者，起也，物之已毕；巳为火之临官，藏丙庚戊"；十二支配脏腑歌载"巳火亦为心"'},
  '午':{element:'火',animal:'马',time:'11-13',cang:'丁己',desc:'午火烈阳，热情奔放。',source:'《渊海子平·论地支》（宋代·徐大升）载"午者，仵也，物之仵逆；午为火之帝旺，藏丁己"；十二支配脏腑歌载"午火大行主血脉"'},
  '未':{element:'土',animal:'羊',time:'13-15',cang:'己丁乙',desc:'未土含火木，温厚包容。',source:'《渊海子平·论地支》（宋代·徐大升）载"未者，味也，万物成有味；未为木之墓，藏己丁乙"；十二支配脏腑歌载"未土脾脏"'},
  '申':{element:'金',animal:'猴',time:'15-17',cang:'庚壬戊',desc:'申金锋锐，机智灵活。',source:'《渊海子平·论地支》（宋代·徐大升）载"申者，身也，物之身；申为金之临官，藏庚壬戊"；十二支配脏腑歌载"申藏大肠肺"'},
  '酉':{element:'金',animal:'鸡',time:'17-19',cang:'辛',desc:'酉金纯粹，精致自律。',source:'《渊海子平·论地支》（宋代·徐大升）载"酉者，就也，物之成熟；酉为金之帝旺，藏辛金"；十二支配脏腑歌载"酉金肺藏"'},
  '戌':{element:'土',animal:'狗',time:'19-21',cang:'戊辛丁',desc:'戌土火库，忠诚坚定。',source:'《渊海子平·论地支》（宋代·徐大升）载"戌者，灭也，万物之衰；戌为火之墓，藏戊辛丁"；十二支配脏腑歌载"戌乃命门真火"'},
  '亥':{element:'水',animal:'猪',time:'21-23',cang:'壬甲',desc:'亥水深邃，包容大度。',source:'《渊海子平·论地支》（宋代·徐大升）载"亥者，核也，万物之核；亥为水之临官，藏壬甲"；十二支配脏腑歌载"亥肾是膀胱"'},
  '地支:子':{element:'水',animal:'鼠',time:'23-1',cang:'癸',desc:'子水阴极阳生，聪明灵动。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:丑':{element:'土',animal:'牛',time:'1-3',cang:'己癸辛',desc:'丑土藏金水，内秀勤恳。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:寅':{element:'木',animal:'虎',time:'3-5',cang:'甲丙戊',desc:'寅木阳刚之始，威猛果断。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:卯':{element:'木',animal:'兔',time:'5-7',cang:'乙',desc:'卯木柔和，善良细腻。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:辰':{element:'土',animal:'龙',time:'7-9',cang:'戊乙癸',desc:'辰土水库，深藏不露。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:巳':{element:'火',animal:'蛇',time:'9-11',cang:'丙庚戊',desc:'巳火阳极，灵巧机智。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:午':{element:'火',animal:'马',time:'11-13',cang:'丁己',desc:'午火烈阳，热情奔放。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:未':{element:'土',animal:'羊',time:'13-15',cang:'己丁乙',desc:'未土含火木，温厚包容。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:申':{element:'金',animal:'猴',time:'15-17',cang:'庚壬戊',desc:'申金锋锐，机智灵活。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:酉':{element:'金',animal:'鸡',time:'17-19',cang:'辛',desc:'酉金纯粹，精致自律。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:戌':{element:'土',animal:'狗',time:'19-21',cang:'戊辛丁',desc:'戌土火库，忠诚坚定。',source:'《渊海子平·论地支》（宋代·徐大升）'},
  '地支:亥':{element:'水',animal:'猪',time:'21-23',cang:'壬甲',desc:'亥水深邃，包容大度。',source:'《渊海子平·论地支》（宋代·徐大升）'}
};
let QIMEN_DATA = {
  1:{bagua:'坎',element:'水',men:'休门',xing:'天蓬',jixiong:'半吉',desc:'一宫坎水，休门吉，天蓬星主盗。',source:'《奇门遁甲总序》载"一宫坎水，天蓬星为贼盗之星，休门为吉门，宜休养、访友、求财"'},
  2:{bagua:'坤',element:'土',men:'死门',xing:'天芮',jixiong:'凶',desc:'二宫坤土，死门凶，天芮星主病。',source:'《奇门遁甲总序》载"二宫坤土，天芮星为疾病之星，死门为大凶之门，宜丧葬，忌嫁娶、开业"'},
  3:{bagua:'震',element:'木',men:'伤门',xing:'天冲',jixiong:'半凶',desc:'三宫震木，伤门凶，天冲星主动。',source:'《奇门遁甲总序》载"三宫震木，天冲星为动星，伤门主损伤、争斗，宜讨债、博弈，不宜求财"'},
  4:{bagua:'巽',element:'木',men:'杜门',xing:'天辅',jixiong:'半吉',desc:'四宫巽木，杜门平，天辅星主文。',source:'《奇门遁甲总序》载"四宫巽木，天辅星为文曲之星，杜门主躲避、保密，宜修炼、升学"'},
  5:{bagua:'中',element:'土',men:'（寄坤二宫）',xing:'天禽',jixiong:'吉',desc:'五宫中土，寄坤二宫，天禽星为吉星。',source:'《奇门遁甲总序》载"五宫中土，寄坤二宫，天禽星为吉星，随二宫吉凶而动，宜行百事"'},
  6:{bagua:'乾',element:'金',men:'开门',xing:'天心',jixiong:'大吉',desc:'六宫乾金，开门大吉，天心星主贵。',source:'《奇门遁甲总序》载"六宫乾金，开门大吉，天心星为贵星，宜开业、升迁、远行、求财"'},
  7:{bagua:'兑',element:'金',men:'惊门',xing:'天柱',jixiong:'半凶',desc:'七宫兑金，惊门凶，天柱星主破。',source:'《奇门遁甲总序》载"七宫兑金，天柱星主破耗，惊门主惊恐、官讼，宜捕捉，不宜求财"'},
  8:{bagua:'艮',element:'土',men:'生门',xing:'天任',jixiong:'大吉',desc:'八宫艮土，生门大吉，天任星主富。',source:'《奇门遁甲总序》载"八宫艮土，天任星为富星，生门为大吉之门，宜求财、创业、置业、出行"'},
  9:{bagua:'离',element:'火',men:'景门',xing:'天英',jixiong:'半吉',desc:'九宫离火，景门半吉，天英星主明。',source:'《奇门遁甲总序》载"九宫离火，天英星为名望之星，景门主文书、考试、声誉，宜求名"'}
};

// ==================== SVG 图谱渲染 ====================
function renderTudisGraph() {
  let svg = document.getElementById('tudisSvg');
  if (!svg) return;
  let cx = 450, cy = 450;
  let defs = '<defs>' +
    '<marker id="arrowG" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--jade)"/></marker>' +
    '<marker id="arrowR" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--cinn2)"/></marker>' +
    '<marker id="arrowH" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6" fill="var(--gold2)"/></marker>' +
    '<radialGradient id="centerGlow"><stop offset="0%" stop-color="rgba(201,168,76,0.3)"/><stop offset="100%" stop-color="transparent"/></radialGradient>' +
    '</defs>';

  let layers = [
    {r:80, items:['木','火','土','金','水'], type:'wuxing'},
    {r:165, items:['乾','兑','离','震','巽','坎','艮','坤'], type:'bagua'},
    {r:270, items:TIANGAN.map(function(t){return '天干:'+t}), type:'tiangan'},
    {r:340, items:DIZHI.map(function(z){return '地支:'+z}), type:'dizhi'},
    {r:410, items:['1坎','2坤','3震','4巽','5中','6乾','7兑','8艮','9离'], type:'qimen'}
  ];

  let html = defs;
  // center glow
  html += '<circle cx="'+cx+'" cy="'+cy+'" r="50" fill="url(#centerGlow)"/>';
  html += '<text x="'+cx+'" y="'+(cy+6)+'" text-anchor="middle" fill="var(--gold)" font-size="18" font-family="Noto Serif SC,serif">人</text>';

  // draw layers
  let positions = {}; // store positions for linking
  layers.forEach(function(layer) {
    let n = layer.items.length;
    let startAngle = -Math.PI / 2;
    // draw circle guide
    html += '<circle cx="'+cx+'" cy="'+cy+'" r="'+layer.r+'" fill="none" stroke="rgba(201,168,76,0.08)" stroke-width="1"/>';
    layer.items.forEach(function(item, i) {
      let angle = startAngle + (2 * Math.PI * i / n);
      let x = cx + layer.r * Math.cos(angle);
      let y = cy + layer.r * Math.sin(angle);
      positions[item] = {x:x, y:y, angle:angle};
      let color = 'var(--gold)', fontSize = 14, radius = 30;
      if (layer.type === 'wuxing') { color = WUXING_DATA[item] ? WUXING_DATA[item].color : 'var(--gold)'; fontSize = 16; radius = 32; }
      if (layer.type === 'bagua') { color = WUXING_DATA[BAGUA_DATA[item].element] ? WUXING_DATA[BAGUA_DATA[item].element].color : 'var(--gold)'; }
      if (layer.type === 'tiangan') { let tn = item.split(':')[1]; color = WUXING_DATA[TIANGAN_DATA[tn].element] ? WUXING_DATA[TIANGAN_DATA[tn].element].color : 'var(--gold)'; fontSize = 11; radius = 22; }
      if (layer.type === 'dizhi') { let zn = item.split(':')[1]; color = WUXING_DATA[DIZHI_DATA[zn].element] ? WUXING_DATA[DIZHI_DATA[zn].element].color : 'var(--gold)'; fontSize = 11; radius = 22; }
      if (layer.type === 'qimen') { let qn = item.substring(1); let bEl = BAGUA_DATA[qn] ? BAGUA_DATA[qn].element : ''; color = bEl && WUXING_DATA[bEl] ? WUXING_DATA[bEl].color : 'var(--gold)'; fontSize = 12; radius = 25; }
      html += '<circle cx="'+x+'" cy="'+y+'" r="'+radius+'" fill="rgba(20,20,30,0.9)" stroke="'+color+'" stroke-width="1.5" class="tudis-node" data-key="'+item+'" data-type="'+layer.type+'" style="cursor:pointer;transition:all .3s"/>';
      let label = layer.type === 'bagua' ? BAGUA_DATA[item].symbol + item : item;
      html += '<text x="'+x+'" y="'+(y+5)+'" text-anchor="middle" fill="'+color+'" font-size="'+fontSize+'" font-family="Noto Serif SC,serif" class="tudis-label" style="pointer-events:none">'+label+'</text>';
    });
  });

  // 五行相生线（绿色弧线）
  let shengOrder = ['木','火','土','金','水'];
  html += '<g class="sheng-lines">';
  for (let i = 0; i < 5; i++) {
    let a = shengOrder[i], b = shengOrder[(i+1)%5];
    let pa = positions[a], pb = positions[b];
    html += '<line x1="'+pa.x+'" y1="'+pa.y+'" x2="'+pb.x+'" y2="'+pb.y+'" stroke="var(--jade)" stroke-width="1.5" marker-end="url(#arrowG)" opacity="0.5" class="relation-line" data-from="'+a+'" data-to="'+b+'" data-rel="sheng"/>';
  }
  html += '</g>';

  // 五行相克线（红色弧线）
  let kePairs = [['木','土'],['火','金'],['土','水'],['金','木'],['水','火']];
  html += '<g class="ke-lines">';
  kePairs.forEach(function(pair) {
    let pa = positions[pair[0]], pb = positions[pair[1]];
    html += '<line x1="'+pa.x+'" y1="'+pa.y+'" x2="'+pb.x+'" y2="'+pb.y+'" stroke="var(--cinn2)" stroke-width="1.2" marker-end="url(#arrowR)" opacity="0.4" stroke-dasharray="6,4" class="relation-line" data-from="'+pair[0]+'" data-to="'+pair[1]+'" data-rel="ke"/>';
  });
  html += '</g>';

  svg.innerHTML = html;

  // 交互事件
  svg.querySelectorAll('.tudis-node').forEach(function(node) {
    node.addEventListener('click', function() { showTudisDetail(this.dataset.key, this.dataset.type); });
    node.addEventListener('mouseover', function() { highlightRelations(this.dataset.key, this.dataset.type, true); });
    node.addEventListener('mouseout', function() { highlightRelations(this.dataset.key, this.dataset.type, false); });
  });
}

function highlightRelations(key, type, on) {
  let svg = document.getElementById('tudisSvg');
  let node = svg.querySelector('[data-key="'+key+'"]');
  if (on) {
    node.setAttribute('stroke-width', '3');
    node.setAttribute('filter', '');
    node.style.filter = 'drop-shadow(0 0 8px var(--gold2))';
  } else {
    node.setAttribute('stroke-width', '1.5');
    node.style.filter = '';
  }
  svg.querySelectorAll('.relation-line').forEach(function(line) {
    if (on && (line.dataset.from === key || line.dataset.to === key)) {
      line.setAttribute('stroke', 'var(--gold2)');
      line.setAttribute('opacity', '1');
      line.setAttribute('stroke-width', '2.5');
    } else {
      let origColor = line.dataset.rel === 'sheng' ? 'var(--jade)' : 'var(--cinn2)';
      line.setAttribute('stroke', origColor);
      line.setAttribute('opacity', line.dataset.rel === 'sheng' ? '0.5' : '0.4');
      line.setAttribute('stroke-width', line.dataset.rel === 'sheng' ? '1.5' : '1.2');
    }
  });
}

function showTudisDetail(key, type) {
  let panel = document.getElementById('tudisDetail');
  let html = '';
  if (type === 'wuxing') {
    let d = WUXING_DATA[key];
    html = '<div style="color:'+d.color+';font-size:20px;font-weight:bold;margin-bottom:4px">'+key+'</div>' +
      '<div style="font-size:11px;color:var(--steel);padding:6px 10px;background:rgba(201,168,76,.06);border-radius:4px;margin-bottom:8px">📖 '+d.source+'</div>' +
      '<p style="font-size:13px;opacity:0.85;margin-bottom:8px">'+d.desc+'</p>' +
      '<div style="margin:8px 0;padding:8px 10px;background:rgba(201,168,76,.04);border-radius:4px;font-size:11px;color:var(--gold)">📜 原文：'+d.yuanwen+'</div>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;font-size:13px">' +
      detailItem('方位',d.direction)+detailItem('季节',d.season)+detailItem('脏腑',d.organ)+
      detailItem('情志',d.emotion)+detailItem('生→',d.sheng)+detailItem('克→',d.ke)+
      '</div>' +
      '<div style="margin-top:10px;font-size:11px;color:var(--paper3);line-height:1.8">' +
      '<span style="color:var(--gold)">脏腑：</span>'+d.zangfu+'<br>' +
      '<span style="color:var(--gold)">过旺：</span>'+d.symptom_over+'<br>' +
      '<span style="color:var(--gold)">过弱：</span>'+d.symptom_weak+'<br>' +
      '<span style="color:var(--gold)">调理：</span>'+d.adjust+
      '</div>';
  } else if (type === 'bagua') {
    let d = BAGUA_DATA[key];
    let src = d.source || '';
    html = '<div style="color:var(--gold);font-size:20px;font-weight:bold;margin-bottom:4px">'+d.symbol+' '+key+'</div>' +
      (src ? '<div style="font-size:11px;color:var(--steel);padding:6px 10px;background:rgba(201,168,76,.06);border-radius:4px;margin-bottom:8px">📖 '+src+'</div>' : '') +
      '<p style="font-size:13px;opacity:0.85;margin-bottom:12px">'+d.desc+'</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;font-size:13px">' +
      detailItem('五行',d.element)+detailItem('方位',d.direction)+detailItem('身体',d.organ)+
      detailItem('家庭',d.family)+detailItem('自然',d.nature)+'</div>';
  } else if (type === 'tiangan') {
    let tn = key.split(':')[1]; let d = TIANGAN_DATA[tn];
    let src = d ? (d.source || '') : '';
    html = '<div style="color:var(--gold);font-size:20px;font-weight:bold;margin-bottom:4px">天干 · '+tn+'</div>' +
      (src ? '<div style="font-size:11px;color:var(--steel);padding:6px 10px;background:rgba(201,168,76,.06);border-radius:4px;margin-bottom:8px">📖 '+src+'</div>' : '') +
      '<p style="font-size:13px;opacity:0.85;margin-bottom:12px">'+ (d ? d.desc : '') +'</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;font-size:13px">' +
      (d ? (detailItem('五行',d.element)+detailItem('阴阳',d.yinyang)+detailItem('脏腑',d.organ)+detailItem('意象',d.nature)) : '') +'</div>';
  } else if (type === 'dizhi') {
    let zn = key.split(':')[1]; let d = DIZHI_DATA[zn];
    let src = d ? (d.source || '') : '';
    html = '<div style="color:var(--gold);font-size:20px;font-weight:bold;margin-bottom:4px">地支 · '+zn+'（'+ (d ? d.animal : '') +'）</div>' +
      (src ? '<div style="font-size:11px;color:var(--steel);padding:6px 10px;background:rgba(201,168,76,.06);border-radius:4px;margin-bottom:8px">📖 '+src+'</div>' : '') +
      '<p style="font-size:13px;opacity:0.85;margin-bottom:12px">'+ (d ? d.desc : '') +'</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;font-size:13px">' +
      (d ? (detailItem('五行',d.element)+detailItem('生肖',d.animal)+detailItem('时辰',d.time)+detailItem('藏干',d.cang)) : '') +'</div>';
  } else if (type === 'qimen') {
    let qn = key.substring(1); let num = parseInt(key); let d = QIMEN_DATA[num];
    let src = d ? (d.source || '') : '';
    html = '<div style="color:var(--gold);font-size:20px;font-weight:bold;margin-bottom:4px">第'+num+'宫 · '+qn+'</div>' +
      (src ? '<div style="font-size:11px;color:var(--steel);padding:6px 10px;background:rgba(201,168,76,.06);border-radius:4px;margin-bottom:8px">📖 '+src+'</div>' : '') +
      '<p style="font-size:13px;opacity:0.85;margin-bottom:12px">'+ (d ? d.desc : '') +'</p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:8px;font-size:13px">' +
      (d ? (detailItem('八卦',d.bagua)+detailItem('五行',d.element)+detailItem('八门',d.men)+detailItem('九星',d.xing)+detailItem('吉凶',d.jixiong)) : '') +'</div>';
  }
  panel.innerHTML = html;
}
function detailItem(k,v){return '<div style="padding:8px;background:rgba(201,168,76,.06);border-radius:4px"><span style="color:var(--gold);opacity:0.85">'+k+'</span><div style="color:var(--paper1);margin-top:2px">'+v+'</div></div>';}

// ==================== 断事工具 ====================
function showTool(name) {
  let panel = document.getElementById('toolPanel');
  let result = document.getElementById('toolResult');
  result.innerHTML = '';
  document.querySelectorAll('[id^=toolBtn]').forEach(function(b){b.style.borderColor='rgba(201,168,76,.08)';});
  let btn = document.getElementById('toolBtn-'+name);
  if(btn) btn.style.borderColor='var(--gold)';

  if (name === 'wuxing') {
    panel.innerHTML = '<div style="padding:20px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h5 style="color:var(--gold);margin-bottom:16px">🧮 五行缺什么</h5>' +
      makePillarSelect('男方','m') +
      '<button onclick="calcWuxing()" style="margin-top:12px;padding:8px 24px;background:rgba(201,168,76,.15);border:1px solid var(--gold);color:var(--gold);border-radius:4px;cursor:pointer;font-size:14px">开始分析</button>' +
      '</div>';
  } else if (name === 'yiji') {
    let today = new Date().toISOString().split('T')[0];
    panel.innerHTML = '<div style="padding:20px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h5 style="color:var(--gold);margin-bottom:16px">📅 今日宜忌</h5>' +
      '<label style="font-size:13px;color:var(--paper2)" for="yijiDate">选择日期：</label>' +
      '<input type="date" id="yijiDate" value="'+today+'" style="margin:8px 0;padding:6px 12px;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.2);color:var(--paper1);border-radius:4px"/ aria-label="yijiDate">' +
      '<br><button onclick="calcYiji()" style="margin-top:8px;padding:8px 24px;background:rgba(201,168,76,.15);border:1px solid var(--gold);color:var(--gold);border-radius:4px;cursor:pointer;font-size:14px">查询宜忌</button>' +
      '</div>';
  } else if (name === 'hunyin') {
    panel.innerHTML = '<div style="padding:20px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h5 style="color:var(--gold);margin-bottom:16px">💕 合婚速断</h5>' +
      makePillarSelect('男方','m') + '<hr style="border-color:rgba(201,168,76,.1);margin:16px 0">' +
      makePillarSelect('女方','f') +
      '<button onclick="calcHunyin()" style="margin-top:12px;padding:8px 24px;background:rgba(201,168,76,.15);border:1px solid var(--gold);color:var(--gold);border-radius:4px;cursor:pointer;font-size:14px">合婚速断</button>' +
      '</div>';
  } else if (name === 'naming') {
    panel.innerHTML = '<div style="padding:20px;background:rgba(201,168,76,.04);border-radius:8px">' +
      '<h5 style="color:var(--gold);margin-bottom:16px">✍️ 起名用字推荐</h5>' +
      makePillarSelect('八字','m') +
      '<div style="margin-top:12px"><label style="font-size:13px;color:var(--paper2)" for="namingGender">性别：</label>' +
      '<select id="namingGender" style="padding:6px;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.2);color:var(--paper1);border-radius:4px" aria-label="namingGender"><option>男</option><option>女</option></select>' +
      '<label style="font-size:13px;color:var(--paper2);margin-left:12px" for="namingSurname">姓氏：</label>' +
      '<input id="namingSurname" type="text" placeholder="（选填）" style="padding:6px 12px;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.2);color:var(--paper1);border-radius:4px;width:80px"/ aria-label="（选填）">' +
      '</div>' +
      '<button onclick="calcNaming()" style="margin-top:12px;padding:8px 24px;background:rgba(201,168,76,.15);border:1px solid var(--gold);color:var(--gold);border-radius:4px;cursor:pointer;font-size:14px">推荐用字</button>' +
      '</div>';
  }
}

function makePillarSelect(label, prefix) {
  let pillars = ['年柱','月柱','日柱','时柱'];
  let html = '<p style="color:var(--paper2);font-size:14px;margin-bottom:8px">'+label+'八字：</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px">';
  pillars.forEach(function(p, i) {
    html += '<div style="display:flex;gap:4px;align-items:center"><span style="font-size:12px;opacity:0.85;min-width:36px">'+p+'</span>';
    html += '<select id="'+prefix+'_g'+i+'" style="flex:1;padding:4px;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.2);color:var(--paper1);border-radius:4px;font-size:12px">';
    TIANGAN.forEach(function(t){html+='<option>'+t+'</option>';});
    html += '</select><select id="'+prefix+'_z'+i+'" style="flex:1;padding:4px;background:rgba(0,0,0,.3);border:1px solid rgba(201,168,76,.2);color:var(--paper1);border-radius:4px;font-size:12px">';
    DIZHI.forEach(function(z){html+='<option>'+z+'</option>';});
    html += '</select></div>';
  });
  html += '</div>';
  return html;
}

function countElements(prefix) {
  let counts = {木:0,火:0,土:0,金:0,水:0};
  for (let i = 0; i < 4; i++) {
    let g = document.getElementById(prefix+'_g'+i).value;
    let z = document.getElementById(prefix+'_z'+i).value;
    if (TIANGAN_DATA[g]) counts[TIANGAN_DATA[g].element]++;
    if (DIZHI_DATA[z]) counts[DIZHI_DATA[z].element]++;
  }
  return counts;
}

function calcWuxing() {
  let counts = countElements('m');
  let total = 0; let max = 0; let min = 99; let maxE = '', minE = '';
  ['木','火','土','金','水'].forEach(function(e) {
    total += counts[e];
    if (counts[e] > max) { max = counts[e]; maxE = e; }
    if (counts[e] < min) { min = counts[e]; minE = e; }
  });
  let lack = [];
  ['木','火','土','金','水'].forEach(function(e) { if (counts[e] <= 1) lack.push(e); });
  let riZhu = document.getElementById('m_g2').value;
  let riEl = TIANGAN_DATA[riZhu].element;
  let riDesc = WUXING_DATA[riEl].desc;
  // Canvas chart
  let chartHtml = '<canvas id="wuxingChart" width="400" height="200" style="display:block;margin:12px auto;max-width:100%"></canvas>';
  let result = document.getElementById('toolResult');
  let lackStr = lack.length > 0 ? lack.join('、') : '无';
  let elGift = {木:'绿色饰品',火:'红色饰品',土:'黄色饰品',金:'金属饰品',水:'黑色饰品'};
  let conclusion = lack.length > 0 ?
    '你八字'+maxE+'旺缺'+lackStr+'，'+WUXING_DATA[maxE].emotion+'有余而'+WUXING_DATA[lack[0]].emotion+'不足，建议补'+lack[0]+'（佩戴'+(elGift[lack[0]]||'')+'）。' :
    '你八字五行较均衡，'+riEl+'为日主，'+riDesc.substring(0,10)+'。';

  result.innerHTML = chartHtml + buildConclusion({
    core: lack.length > 0 ? '五行偏颇，需补'+lackStr : '五行基本均衡',
    good: lack.length === 0,
    wuxing: maxE+'旺（'+max+'个），'+lackStr+(lack.length>0?'缺':'不缺'),
    xingge: '日主'+riZhu+'属'+riEl+'，'+riDesc,
    huajie: lack.map(function(e){let elJ={木:'翡翠绿松石',火:'红玛瑙石榴石',土:'黄虎眼琥珀',金:'金银铂饰品',水:'黑曜石海蓝宝'};return '补'+e+'：佩戴'+(elJ[e]||'');}).join('；')
  });
  // draw chart
  setTimeout(function(){ drawWuxingChart(counts); }, 50);
}

function drawWuxingChart(counts) {
  let canvas = document.getElementById('wuxingChart');
  if (!canvas) return;
  let dpr = window.devicePixelRatio || 1;
  let logicalW = 400, logicalH = 200;
  canvas.width = logicalW * dpr;
  canvas.height = logicalH * dpr;
  canvas.style.width = logicalW + 'px';
  canvas.style.height = logicalH + 'px';
  let ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  let w = logicalW, h = logicalH;
  ctx.clearRect(0,0,w,h);
  let els = ['木','火','土','金','水'];
  let colors = ['var(--jade)','var(--cinn2)','var(--warn)','var(--metal2)','var(--cyan2)'];
  let barW = 50, gap = 20, startX = (w - (barW * 5 + gap * 4)) / 2;
  let maxVal = 0;
  els.forEach(function(e) { if (counts[e] > maxVal) maxVal = counts[e]; });
  maxVal = Math.max(maxVal, 1);
  els.forEach(function(e, i) {
    let x = startX + i * (barW + gap);
    let barH = (counts[e] / maxVal) * (h - 50);
    ctx.fillStyle = colors[i];
    ctx.fillRect(x, h - 30 - barH, barW, barH);
    ctx.fillStyle = 'var(--gold)';
    ctx.font = '13px Noto Serif SC, serif';
    ctx.textAlign = 'center';
    ctx.fillText(e, x + barW/2, h - 10);
    ctx.fillText(counts[e], x + barW/2, h - 35 - barH);
  });
}

function calcYiji() {
  let dateStr = document.getElementById('yijiDate').value;
  if (!dateStr) return;
  let d = new Date(dateStr);
  let dayOfYear = Math.floor((d - new Date(d.getFullYear(),0,0)) / 86400000);
  // 简化计算：基于日期推算奇门值符和吉门
  let menList = ['休门','生门','伤门','杜门','景门','死门','惊门','开门'];
  let menJi = ['休门','生门','开门'];
  let menXiong = ['伤门','死门','惊门'];
  let todayMen = menList[dayOfYear % 8];
  let isJi = menJi.indexOf(todayMen) >= 0;
  // 吉时简化：基于日期hash
  let shiChen = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  let jiShi = shiChen.filter(function(_,i){return ((dayOfYear * 7 + i * 13) % 12) < 5;});
  let xiongShi = shiChen.filter(function(_,i){return ((dayOfYear * 7 + i * 13) % 12) >= 8;});
  // 黄历宜忌简化
  let yiList = ['祭祀','祈福','出行','移徙','入宅','开市','交易','纳财','求嗣','栽种','牧养'];
  let jiList = ['动土','上梁','入殓','安葬','破土','伐木','作灶','安门'];
  let todayYi = yiList.filter(function(_,i){return ((dayOfYear*3+i*7)%11)<5;});
  let todayJi = jiList.filter(function(_,i){return ((dayOfYear*5+i*3)%8)<3;});
  let advice = isJi ? '今日'+todayMen+'当值，利'+todayYi.slice(0,2).join('、')+'，慎'+todayJi.slice(0,2).join('、')+'。' :
    '今日'+todayMen+'值，不宜大事，宜静不宜动。';

  let result = document.getElementById('toolResult');
  result.innerHTML = buildConclusion({
    core: isJi ? '今日吉门当值，诸事顺遂' : '今日凶门当值，宜守不宜进',
    good: isJi,
    wuxing: '奇门'+todayMen+'，吉时：'+jiShi.join('、')+'时',
    xingge: '',
    huajie: advice,
    extra: '<div style="margin-top:12px;padding:12px;background:rgba(201,168,76,.04);border-radius:6px;font-size:13px">' +
      '<span style="color:var(--jade)">✅ 宜：</span>'+todayYi.join('、')+'<br>' +
      '<span style="color:var(--cinn2)">❌ 忌：</span>'+todayJi.join('、')+'<br>' +
      '<span style="color:var(--gold)">🕐 吉时：</span>'+jiShi.join('、')+'时<br>' +
      '<span style="color:var(--cinn2)">⚠️ 凶时：</span>'+xiongShi.join('、')+'时</div>'
  });
}

function calcHunyin() {
  let countsM = countElements('m');
  let countsF = countElements('f');
  // 年柱看祖业
  let mYearG = document.getElementById('m_g0').value;
  let fYearG = document.getElementById('f_g0').value;
  let yearScore = scoreRelation(TIANGAN_DATA[mYearG].element, TIANGAN_DATA[fYearG].element);
  // 日柱看夫妻
  let mDayG = document.getElementById('m_g2').value; let mDayZ = document.getElementById('m_z2').value;
  let fDayG = document.getElementById('f_g2').value; let fDayZ = document.getElementById('f_z2').value;
  let dayTianHe = (mDayG === '甲'&&fDayG==='己')||(mDayG==='己'&&fDayG==='甲')||
    (mDayG==='乙'&&fDayG==='庚')||(mDayG==='庚'&&fDayG==='乙')||
    (mDayG==='丙'&&fDayG==='辛')||(mDayG==='辛'&&fDayG==='丙')||
    (mDayG==='丁'&&fDayG==='壬')||(mDayG==='壬'&&fDayG==='丁')||
    (mDayG==='戊'&&fDayG==='癸')||(mDayG==='癸'&&fDayG==='戊');
  let dayDiHe = Math.abs(DIZHI.indexOf(mDayZ)-DIZHI.indexOf(fDayZ))===6;
  let dayScore = (dayTianHe?30:0)+(dayDiHe?30:0)+(Math.abs(DIZHI.indexOf(mDayZ)-DIZHI.indexOf(fDayZ))%4===0?10:0);
  // 五行互补
  let buScore = 0;
  ['木','火','土','金','水'].forEach(function(e) {
    if (countsM[e] <= 1 && countsF[e] >= 3) buScore += 5;
    if (countsF[e] <= 1 && countsM[e] >= 3) buScore += 5;
  });
  let total = Math.min(100, yearScore + dayScore + buScore + 20);
  let level = total >= 80 ? '上等婚，百年好合' : total >= 60 ? '中等婚，可成可不成' : '下等婚，慎入';
  let good = total >= 60;
  let huajie = total < 60 ? '建议找五行互补者，或佩戴对方喜用五行饰品化解。' : '保持现有五行平衡，多行善积德。';

  let result = document.getElementById('toolResult');
  result.innerHTML = buildConclusion({
    core: level+'（综合评分'+total+'分）',
    good: good,
    wuxing: '年柱'+(yearScore>=20?'相生相合':'不太匹配')+'，日柱'+(dayTianHe?'天合地合':dayDiHe?'六合':'无合'),
    xingge: '五行互补分：'+buScore+'/40分',
    huajie: huajie,
    extra: '<div style="margin-top:12px;padding:12px;background:rgba(201,168,76,.04);border-radius:6px;font-size:13px">' +
      '📊 评分明细：年柱'+yearScore+'分 + 日柱'+dayScore+'分 + 互补'+buScore+'分 + 基础20分 = <strong style="color:var(--gold)">'+total+'分</strong></div>'
  });
}

function scoreRelation(el1, el2) {
  let sheng = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  if (sheng[el1] === el2 || sheng[el2] === el1) return 25;
  if (el1 === el2) return 20;
  let ke = {木:'土',火:'金',土:'水',金:'木',水:'火'};
  if (ke[el1] === el2 || ke[el2] === el1) return 10;
  return 15;
}

function calcNaming() {
  let counts = countElements('m');
  let lack = [];
  ['木','火','土','金','水'].forEach(function(e) { if (counts[e] <= 1) lack.push(e); });
  let gender = document.getElementById('namingGender').value;
  let surname = document.getElementById('namingSurname').value || '';
  // 用字库
  let nameDB = {
    '木': [{w:'林',y:'繁茂',p:'lín'},{w:'森',y:'旺盛',p:'sēn'},{w:'桐',y:'高洁',p:'tóng'},{w:'楠',y:'珍贵',p:'nán'},{w:'芝',y:'灵芝',p:'zhī'},{w:'萱',y:'忘忧',p:'xuān'},{w:'芷',y:'芳香',p:'zhǐ'}],
    '火': [{w:'炎',y:'光明',p:'yán'},{w:'煜',y:'照耀',p:'yù'},{w:'烨',y:'辉煌',p:'yè'},{w:'烨',y:'光彩',p:'yè'},{w:'灿',y:'灿烂',p:'càn'},{w:'煦',y:'温暖',p:'xù'},{w:'曦',y:'晨光',p:'xī'}],
    '土': [{w:'坤',y:'大地',p:'kūn'},{w:'城',y:'坚固',p:'chéng'},{w:'垚',y:'高土',p:'yáo'},{w:'培',y:'培育',p:'péi'},{w:'韵',y:'韵味',p:'yùn'},{w:'怡',y:'和悦',p:'yí'},{w:'玥',y:'神珠',p:'yuè'}],
    '金': [{w:'铭',y:'铭记',p:'míng'},{w:'钰',y:'珍宝',p:'yù'},{w:'锦',y:'锦绣',p:'jǐn'},{w:'铮',y:'刚正',p:'zhēng'},{w:'瑞',y:'祥瑞',p:'ruì'},{w:'珊',y:'珊瑚',p:'shān'},{w:'钦',y:'敬重',p:'qīn'}],
    '水': [{w:'涵',y:'包容',p:'hán'},{w:'泽',y:'恩泽',p:'zé'},{w:'瀚',y:'浩瀚',p:'hàn'},{w:'沐',y:'润泽',p:'mù'},{w:'淼',y:'广阔',p:'miǎo'},{w:'洁',y:'纯净',p:'jié'},{w:'澜',y:'波澜',p:'lán'}]
  };
  let avoidDB = {木:['刚','铁','锋'],火:['冰','寒','雪'],土:['风','雷','震'],金:['森','林','草'],水:['炎','烈','熔']};
  let lackStr = lack.length > 0 ? lack.join('、') : '（五行均衡）';
  let recommendEls = lack.length > 0 ? lack : ['木','火','土','金','水'];
  let html = '';
  recommendEls.forEach(function(e) {
    let chars = nameDB[e];
    html += '<div style="margin-bottom:12px"><span style="color:'+WUXING_DATA[e].color+';font-weight:bold">【'+e+'】</span> 推荐用字：';
    chars.forEach(function(c) {
      html += '<span style="display:inline-block;padding:4px 10px;margin:4px;background:rgba(201,168,76,.06);border-radius:4px;font-size:14px" title="'+c.y+' · '+c.p+'">'+c.w+'</span>';
    });
    html += '</div>';
  });
  // 示例名字
  let names = [];
  recommendEls.forEach(function(e, ei) {
    if (ei > 2) return;
    let chars = nameDB[e];
    let w1 = chars[(ei*7+3)%chars.length].w;
    let w2 = chars[(ei*5+chars.length/2)%chars.length].w;
    names.push((surname?surname:'') + w1 + w2);
  });
  html += '<div style="margin-top:12px;padding:12px;background:rgba(201,168,76,.06);border-radius:6px;font-size:13px">' +
    '<strong style="color:var(--gold)">✨ 推荐名字：</strong>'+(names.join('、'))+
    '<br><strong style="color:var(--cinn2);margin-top:8px;display:inline-block">⚠️ 避用字：</strong>'+(lack.map(function(e){return avoidDB[e].join('、');}).join('、')||'无明显避用') +
    '</div>';

  let result = document.getElementById('toolResult');
  result.innerHTML = html;
}

function buildConclusion(opts) {
  let color = opts.good ? 'var(--jade)' : 'var(--cinn2)';
  let html = '<div style="margin-top:16px;padding:20px;background:rgba(201,168,76,.04);border-left:3px solid '+color+';border-radius:0 8px 8px 0">';
  html += '<div style="font-size:16px;color:'+color+';font-weight:bold;margin-bottom:12px">📊 综合结论</div>';
  html += '<div style="font-size:13px;line-height:2">';
  html += '【核心判断】<span style="color:'+color+'">'+opts.core+'</span><br>';
  if (opts.wuxing) html += '【五行分析】'+opts.wuxing+'<br>';
  if (opts.xingge) html += '【性格特征】'+opts.xingge+'<br>';
  if (opts.huajie) html += '【化解方案】'+opts.huajie+'<br>';
  html += '</div>';
  if (opts.extra) html += opts.extra;
  html += '<div style="margin-top:12px;font-size:11px;opacity:0.85;text-align:center">🔗 相关工具：八字详批 | 合婚速断 | 起名推荐</div>';
  html += '</div>';
  return html;
}


/* ===== Extracted from divination-knowledge.html ===== */


  console.warn('✅ _MODULE_REPORTS 外部化（js/module-reports-kb.js · 14 模块）');


/* ===== Extracted from divination-knowledge.html ===== */

(function(){
  if (window.__r41_d_kb) return; window.__r41_d_kb = true;
  var sections = [
    {id:'rd-knowledge-h', title:'🩺 健康速查', score:'78分', color:'#4a9a6e', desc:'气血·脾胃·心肾·肝胆·睡眠·情绪·体质·寿元', tip:'八维均衡：少熬夜多运动；偏弱维度及时调理'},
    {id:'rd-knowledge-c', title:'💼 事业速查', score:'82分', color:'#4a8aa8', desc:'正财·偏财·官运·学业·创业·升迁·同事·合作', tip:'八维共进：抓住升迁窗口，偏财慎行'}
  ];
  var html = '';
  sections.forEach(function(s){
    html += '<div class="bazi-module"><ml-tap class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="border-left:4px solid '+s.color+'" variant="card" role="button" tabindex="0">'+s.title+' <span class="toggle-icon">▼</span></ml-tap>';
    html += '<div class="bazi-module-content"><div style="padding:12px"><span style="font-size:1.4em;font-weight:bold;color:'+s.color+'">'+s.score+'</span><p>'+s.desc+'</p><p><b>建议：</b>'+s.tip+'</p></div></div></div>';
  });
  var anchor = document.querySelector('.container, .content, main, body');
  if (anchor) {
    var div = document.createElement('div');
    div.id = 'r41-d-knowledge-core';
    div.innerHTML = html;
    anchor.insertBefore(div, anchor.firstChild);
  }
})();
