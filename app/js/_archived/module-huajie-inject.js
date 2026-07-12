  const dayEle = ELE[dayStem] || '木';
  const xiEle = hj.xiEle;
  const mingGua = hj.mingGua || {type:'东四命'};

  let html = '<div class="analysis-grid" style="grid-template-columns:1fr 1fr">';

  // 事业
  const shiye = {
    tips: [
      '今年事业有升迁机会，尤其在夏季(火旺)把握时机',
      '办公室东方放绿色植物(文昌位)有助事业升迁',
      '与属龙、属蛇、属马的同事合作更顺利',
      '重大决策避开农历六月(7月底至8月底)'
    ],
    amulet: '文昌塔、白水晶球、绿色印章',
    fengshui: mingGua.type === '东四命' ? '座位朝东或朝南，背后有靠山' : '座位朝西或朝西南，背后靠实墙',
    avoid: '农历六月不签重要合同；避免与属鼠的人合作重大事项'
  };

  // 财运
  let caiyunTip3 = '宜从事';
  if (xiEle === '木') caiyunTip3 += '贸易、物流、木材、家具行业';
  else if (xiEle === '火') caiyunTip3 += '互联网、能源、餐饮、娱乐行业';
  else if (xiEle === '土') caiyunTip3 += '房地产、建筑、农业、矿产行业';
  else if (xiEle === '金') caiyunTip3 += '金融、珠宝、金属加工、法律行业';
  else caiyunTip3 += '运输、贸易、水利、物流行业';

  const caiyun = {
    tips: [
      '正财稳定，偏财一般，稳健投资为上',
      '财位在东南(2026年文昌位同位),放聚宝盆+黄水晶',
      caiyunTip3,
      '子日(阴历十一前后)和酉日(阴历十七前后)财运最旺'
    ],
    amulet: '黄水晶聚宝盆、五帝钱、貔貅',
    fengshui: '东南方放聚宝盆；大门对角线位置保持整洁；避免放置带刺植物',
    avoid: '不宜在农历六月进行大额投资；避免借钱给人'
  };

  // 感情
  let ganqingTips = [];
  if (hj.dayBranchIdx % 2 === 0) {
    ganqingTips = [
      '今年桃花旺，感情机会多，已婚者需自我约束',
      '女性宜在东南方放粉色水晶球增强姻缘运',
      '男性宜在正北方放红色花瓶增强感情',
      '农历二月和八月是感情月，好好把握'
    ];
  } else {
    ganqingTips = [
      '今年感情运平稳，单身者可积极相亲',
      '佩戴粉水晶手链增强桃花运',
      '农历三月的亥日和卯日感情运最旺',
      '多参加社交活动，扩大交际圈'
    ];
  }

  const ganqing = {
    tips: ganqingTips,
    amulet: '粉水晶手链、鸳鸯摆件、粉色花瓶',
    fengshui: '卧室朝东南最佳，床头朝东或朝东南；避免镜子对床',
    avoid: '避免在农历六月约会；避免与前任藕断丝连'
  };

  // 健康
  let jiankangTip2 = '';
  if (dayEle === '木') jiankangTip2 = '肝胆容易出问题，忌熬夜，多运动';
  else if (dayEle === '火') jiankangTip2 = '心火旺，易失眠多梦，宜修身养性';
  else if (dayEle === '土') jiankangTip2 = '脾胃易弱，忌暴饮暴食，规律饮食';
  else if (dayEle === '金') jiankangTip2 = '呼吸系统弱，忌抽烟，减少外出雾霾天';
  else jiankangTip2 = '肾水不足，忌过度劳累，规律作息';

  const jiankang = {
    tips: [
      '今年火旺，注意心脏、眼睛、血液方面健康',
      jiankangTip2,
      '春季多运动排毒；冬季早睡养藏'
    ],
    amulet: '黑曜石手链、玉石平安扣、本命佛',
    fengshui: '床头朝东最佳；卧室保持通风；忌在卧室摆放尖锐物品',
    avoid: '忌深夜加班；忌在床头放置电子设备；忌空腹跑步'
  };

  // 学业
  const xueye = {
    tips: [
      '文昌星照命，今年学业运佳，利考试',
      '书桌朝东最佳，案头放文昌笔或绿植',
      '考试前在考场附近走动有利临场发挥',
      '农历三四月考试运最旺，全力冲刺'
    ],
    amulet: '文昌笔、文昌塔、魁星笔、孔子画像',
    fengshui: '书桌位置朝东或朝东南，座位背后有实墙不靠窗',
    avoid: '书桌忌对门、忌对窗、忌背后空旷；忌熬夜通宵'
  };

  const dims = [
    {icon:'🚀', title:'事业运', data:shiye, color:'#2980b9'},
    {icon:'💰', title:'财运', data:caiyun, color:'#c9a84c'},
    {icon:'💕', title:'感情运', data:ganqing, color:'#e74c3c'},
    {icon:'🏥', title:'健康运', data:jiankang, color:'#27ae60'},
    {icon:'📚', title:'学业运', data:xueye, color:'#8e44ad'}
  ];

  for (let d = 0; d < dims.length; d++) {
    const dim = dims[d];
    html += '<div class="analysis-card" style="border-left:3px solid ' + dim.color + '">';
    html += '<h5 style="color:' + dim.color + '">' + dim.icon + ' ' + dim.title + '</h5>';
    html += '<ul class="huajie-checklist">';
    for (let t = 0; t < dim.data.tips.length; t++) {
      html += '<li>' + dim.data.tips[t] + '</li>';
    }
    html += '</ul>';
    html += '<div class="huajie-row"><span style="opacity:.5">开运饰品</span><span>' + dim.data.amulet + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">风水调整</span><span>' + dim.data.fengshui + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5;color:#e74c3c">忌</span><span>' + dim.data.avoid + '</span></div>';
    html += '</div>';
  }

  html += '</div>';
  return html;
}

function getTempleRecommendation(hj) {
  let html = '';

  html += '<div class="huajie-alert" style="margin-bottom:16px">';
  html += '<div class="alert-title">🏛️ 道观寺庙化煞指南</div>';
  html += '<p>化煞解难，诚心拜祭为先。以下为全国知名道观寺庙，按类型与功效分类推荐。建议提前电话预约，了解拜祭流程。</p>';
  html += '</div>';

  const temples = [
    {type:'☯️ 道观', rank:'第1名', name:'北京白云观', location:'北京市西城区白云观街', reason:'道教全真派祖庭，化解太岁、求财、求学最灵。2026年值太岁/冲太岁者必去。', amulet:'太岁符、平安符', price:'随缘乐助'},
    {type:'☯️ 道观', rank:'第2名', name:'武汉长春观', location:'湖北省武汉市武昌区', reason:'丘处机开创，全真派胜地。化解小人、求学、延寿最灵。', amulet:'文昌符、长生符', price:'随缘乐助'},
    {type:'☯️ 道观', rank:'第3名', name:'龙虎山天师府', location:'江西省鹰潭市贵溪市', reason:'道教正一派祖庭，张天师道场。化煞、驱邪、治病最灵验。', amulet:'天师符、护身符', price:'¥200-2000'},
    {type:'☯️ 道观', rank:'第4名', name:'成都青羊宫', location:'四川省成都市青羊区', reason:'老子青羊肆所在地。求财、化煞、平安最灵。农历二月十五老子诞辰香火最旺。', amulet:'太上老君符', price:'随缘乐助'},
    {type:'☯️ 道观', rank:'第5名', name:'武当山紫霄宫', location:'湖北省十堰市丹江口市', reason:'道教四大名山之一，化解太岁、延寿、学业皆灵。', amulet:'武当平安符', price:'¥100-500'},
    {type:'🪷 寺庙', rank:'第1名', name:'普陀山南海观音', location:'浙江省舟山市普陀区', reason:'观音菩萨道场，消灾解难、有求必应。事业、感情、健康、学业皆可求。', amulet:'观音咒轮、平安符', price:'随缘乐助'},
    {type:'🪷 寺庙', rank:'第2名', name:'五台山文殊寺', location:'山西省忻州市五台县', reason:'文殊菩萨道场，开智增慧、学业考试最灵。学生必去。', amulet:'文昌笔、智慧香', price:'¥50-300'},
    {type:'🪷 寺庙', rank:'第3名', name:'九华山肉身殿', location:'安徽省池州市青阳县', reason:'地藏菩萨道场，超度先人、消业障最灵。农历七月地藏月香火最旺。', amulet:'地藏咒轮、往生符', price:'随缘乐助'},
    {type:'🪷 寺庙', rank:'第4名', name:'灵隐寺', location:'浙江省杭州市西湖区', reason:'济公活佛道场，求平安、化解小人最灵验。', amulet:'平安符、化解符', price:'¥30-200'},
    {type:'🪷 寺庙', rank:'第5名', name:'雍和宫', location:'北京市东城区', reason:'格鲁派藏传佛教寺院，求财、化解小人、求学皆灵。', amulet:'开光唐卡、转运珠', price:'¥100-1000'}
  ];

  // 道观部分
  html += '<h5 style="font-size:13px;color:var(--jade);margin-bottom:12px;letter-spacing:3px">☯️ 道观推荐(化解太岁、驱邪、延寿)</h5>';
  html += '<div class="analysis-grid" style="grid-template-columns:1fr 1fr;gap:12px">';
  const daoTemples = temples.filter(function(t){return t.type==='☯️ 道观';});
  for (let i = 0; i < daoTemples.length; i++) {
    const t = daoTemples[i];
    html += '<div class="analysis-card" style="border-color:rgba(39,174,96,.15);cursor:pointer" onclick="showTempleDetail(\'' + t.name + '\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<h5 style="color:var(--jade);font-size:14px;margin:0">' + t.name + '</h5>';
    html += '<span style="font-size:11px;padding:2px 6px;background:rgba(39,174,96,.1);color:var(--jade);border-radius:4px">' + t.rank + '</span>';
    html += '</div>';
    html += '<div class="huajie-row"><span style="opacity:.5">地址</span><span style="font-size:12px">' + t.location + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">功效</span><span style="font-size:12px">' + t.reason.substring(0,30) + '...</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">可请法物</span><span style="font-size:12px">' + t.amulet + '</span></div>';
    html += '<div style="margin-top:8px;text-align:center"><button class="huajie-renew-btn" style="font-size:12px;padding:8px 20px">📍 查看详情</button></div>';
    html += '</div>';
  }
  html += '</div>';

  // 寺庙部分
  html += '<h5 style="font-size:13px;color:var(--violet);margin:20px 0 12px;letter-spacing:3px">🪷 寺庙推荐(消业、增慧、求愿)</h5>';
  html += '<div class="analysis-grid" style="grid-template-columns:1fr 1fr;gap:12px">';
  const foTemples = temples.filter(function(t){return t.type==='🪷 寺庙';});
  for (let i = 0; i < foTemples.length; i++) {
    const t = foTemples[i];
    html += '<div class="analysis-card" style="border-color:rgba(142,68,173,.15);cursor:pointer" onclick="showTempleDetail(\'' + t.name + '\')">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<h5 style="color:var(--violet);font-size:14px;margin:0">' + t.name + '</h5>';
    html += '<span style="font-size:11px;padding:2px 6px;background:rgba(142,68,173,.1);color:var(--violet);border-radius:4px">' + t.rank + '</span>';
    html += '</div>';
    html += '<div class="huajie-row"><span style="opacity:.5">地址</span><span style="font-size:12px">' + t.location + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">功效</span><span style="font-size:12px">' + t.reason.substring(0,30) + '...</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">可请法物</span><span style="font-size:12px">' + t.amulet + '</span></div>';
    html += '<div style="margin-top:8px;text-align:center"><button class="huajie-renew-btn" style="font-size:12px;padding:8px 20px">📍 查看详情</button></div>';
    html += '</div>';
  }
  html += '</div>';

  // 还愿提醒
  html += '<div class="huajie-renew-box" style="margin-top:20px">';
  html += '<div class="renew-title">🙏 还愿提醒</div>';
  html += '<div class="renew-desc">';
  html += '愿望达成后必须还愿，否则运势反噬。建议:<br>';
  html += '• 愿望实现后一个月内到许愿的道观/寺庙还愿<br>';
  html += '• 还愿方式:供奉香火、添油、挂灯笼、写牌位<br>';
  html += '• 还愿时带齐当初许愿时承诺的物品，如数奉还<br>';
  html += '• 农历每月初一、十五是还愿吉日<br>';
  html += '• 可提前在年初制定还愿计划，年底前完成本年度所有许愿还愿';
  html += '</div></div>';

  return html;
}

function toggleHuajieDetail(el) {
  const content = el.querySelector('.month-detail-content');
  if (content.style.display === 'none') {
    content.style.display = 'block';
  } else {
    content.style.display = 'none';
  }
}

function showMonthDetail(idx) {
  const monthNames = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','腊月'];
  showToast('查看' + monthNames[idx] + '详细分析');
}

function showTempleDetail(name) {
  const details = {
    '北京白云观': '地址:北京市西城区白云观街9号 | 电话:010-63463511 | 开放时间:8:00-16:30 | 门票:10元 | 特色:太岁殿供奉60位太岁星君，每位太岁均有专属化解符。化解太岁请到太岁殿，求学请到文昌殿。',
    '龙虎山天师府': '地址:江西省鹰潭市贵溪市龙虎山镇 | 电话:0701-6651009 | 开放时间:7:30-17:30 | 门票:通票150元 | 特色:正一派祖庭，化煞、驱邪、治病最灵。可提前预约天师府道长进行个人科仪。',
    '普陀山南海观音': '地址:浙江省舟山市普陀区普陀山 | 电话:0580-6091024 | 开放时间:6:00-18:00 | 门票:淡季140元/旺季160元 | 特色:观音道场，有求必应。建议从南海观音立像开始参拜，一路向上至普济寺。'
  };
  const detail = details[name] || '详细信息请电话咨询或访问官网。';
  showToast('📍 ' + name + '\n' + detail);
}

// ===== 时辰功能升级 =====
function onCalendarModeChange() {
  const mode = document.querySelector('input[name="calendarMode"]:checked').value;
  const hint = document.getElementById('calendarHint');
  const solarDateInput = document.getElementById('baziDate');
  const lunarArea = document.getElementById('lunarInputArea');
  if (mode === 'lunar') {
    if (solarDateInput) solarDateInput.style.display = 'none';
    if (lunarArea) lunarArea.style.display = 'flex';
    if (hint) hint.textContent = '🌙 当前:农历输入（请输入农历年/月/日）';
  } else {
    if (solarDateInput) solarDateInput.style.display = '';
    if (lunarArea) lunarArea.style.display = 'none';
    if (hint) hint.textContent = '✅ 当前:公历输入（推荐，系统自动换算农历）';
  }
}

// 公历日期输入时自动显示对应农历
function onBaziDateInput() {
  var dateStr = document.getElementById('baziDate').value;
  var hintEl = document.getElementById('solarLunarHint');
  if (!dateStr || !hintEl) { hintEl.style.opacity = '0'; return; }
  var parts = dateStr.split('-');
  var year = parseInt(parts[0]), month = parseInt(parts[1]), day = parseInt(parts[2]);
  if (!year || !month || !day) { hintEl.style.opacity = '0'; return; }
  try {
    var lunar = solarToLunar(year, month, day);
    if (lunar && lunar.year) {
      var gzYear = getYearStemBranch(lunar.year, lunar.month, lunar.day);
      var leapText = lunar.isLeap ? '(闰)' : '';
      hintEl.innerHTML = '🌙 对应农历: <b>' + lunar.year + '年' + leapText + lunar.month + '月' + lunar.day + '日</b> (' + gzYear.stem + gzYear.branch + ')';
      hintEl.style.opacity = '1';
    } else {
      hintEl.style.opacity = '0';
    }
  } catch(e) { hintEl.style.opacity = '0'; }
}

function onShichenChange() {
  const hourVal = document.getElementById('baziHour').value;
  if (!hourVal) return;
  const shichenNames = ['', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子'];
  const idx = parseInt(hourVal) >= 23 ? 0 : Math.floor(parseInt(hourVal) / 2) + 1;
  const sName = idx === 0 ? '子' : shichenNames[idx];
  showToast('已选择:' + sName + '时(' + hourVal + ':00-' + (parseInt(hourVal)+2)%24 + ':00)');
}

function toggleShichenTable() {
  const tbl = document.getElementById('shichenTable');
  tbl.style.display = tbl.style.display === 'none' ? 'block' : 'none';
}

// 大运天干地支组合专业解读
function getGanZhiDayunDesc(gan, zhi, dayStemIdx) {
  const ganEle = ELE[gan];
  const zhiEle = ELE[zhi];
  const rel = getTenGod(gan, zhi, STEMS[dayStemIdx]);
  const dayMaster = STEMS[dayStemIdx];
  const dayEle = ELE[dayMaster];

  // 天干地支生克关系
  const ganShengZhi = ganEle && zhiEle && (ganEle === getSheng(zhiEle));
  const zhiShengGan = zhiEle && ganEle && (zhiEle === getSheng(ganEle));
  const ganKeZhi = ganEle && zhiEle && (ganEle === getKe(zhiEle));
  const zhiKeGan = zhiEle && ganEle && (zhiEle === getKe(ganEle));

  let desc = '';
  if (ganShengZhi) desc = '天干生地支，运途顺畅，外力相助';
  else if (zhiShengGan) desc = '地支生天干，根基稳固，内在发力';
  else if (ganKeZhi) desc = '天干克地支，主动进取，但有阻碍';
  else if (zhiKeGan) desc = '地支克天干，压力较大，需守成';
  else desc = '干支比和，平稳过渡，宜静不宜动';

  // 加入十神解读
  const relDesc = {
    '正官': '事业有成，名声在外', '七杀': '竞争激烈，需防小人',
    '正印': '学业进步，贵人相助', '偏印': '智慧开启，但防孤僻',
    '正财': '财运亨通，正道求财', '偏财': '意外之财，但防冒进',
    '食神': '福禄双全，享受生活', '伤官': '才华横溢，但防傲气',
    '比肩': '朋友相助，但防分利', '劫财': '竞争加剧，需防破财'
  };
  desc += '。' + (relDesc[rel] || '运势平稳');

  return desc;
}

// 大运详细解读
function showDayunDetail(idx) {
  const dayun = window._currentDayun || [];
  if (!dayun[idx]) return;
  const d = dayun[idx];
  const dayStemIdx = window._currentDayStemIdx || 0;

  document.getElementById('dayunDetail').style.display = 'block';
  document.getElementById('dayunDetailTitle').textContent = `第${d.index}步大运 ${d.gan}${d.zhi}(${d.ageStart}-${d.ageEnd}岁)`;

  let html = '';

  // 1. 基本属性
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:16px">';
  html += `<div class="huajie-row"><span style="opacity:.5">天干</span><span>${d.gan}(${d.ganEle})</span></div>`;
  html += `<div class="huajie-row"><span style="opacity:.5">地支</span><span>${d.zhi}(${d.zhiEle})</span></div>`;
  html += `<div class="huajie-row"><span style="opacity:.5">十神</span><span>${d.rel}</span></div>`;
  if (d.ganShen) html += `<div class="huajie-row"><span style="opacity:.5">天干十神</span><span>${d.ganShen}</span></div>`;
  if (d.zhiShen) html += `<div class="huajie-row"><span style="opacity:.5">藏干十神</span><span>${d.zhiShen}</span></div>`;
  if (d.dishi) html += `<div class="huajie-row"><span style="opacity:.5">长生十二宫</span><span>${d.dishi}</span></div>`;
  if (d.qiyunDetail) html += `<div class="huajie-row"><span style="opacity:.5">起运</span><span>${d.qiyunDetail}</span></div>`;
  html += `<div class="huajie-row"><span style="opacity:.5">五行生克</span><span>${d.ganZhiDesc.split('。')[0]}</span></div>`;
  html += '</div>';

  // 2. 专业解读(5个维度)
  html += '<h6 style="color:var(--gold);letter-spacing:2px;margin:16px 0 8px">📊 五维解读</h6>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px">';

  const dimensions = [
    {name:'事业', key:'career', tips:['官印相生，事业有成','食伤生财，创意变现','比劫争财，竞争压力','印星护身，贵人相助']},
    {name:'财运', key:'wealth', tips:['财星得地，财运亨通','财多身弱，需防破财','偏财透出，意外之财','正财稳固，勤劳得财']},
    {name:'婚姻', key:'marriage', tips:['财官双美，婚姻和谐','桃花星动，缘分将至','比劫争夫/妻，感情竞争','印星护婚，家庭稳定']},
    {name:'健康', key:'health', tips:['五行调和，身体健康','忌神肆虐，需防疾病','印星护身，逢凶化吉','食伤泄秀，注意饮食']},
    {name:'学业', key:'study', tips:['印星旺相，学业进步','食伤泄秀，才华横溢','官星得地，考试顺利','忌神克制，需防分心']}
  ];

  dimensions.forEach(dim => {
    const score = computeDimensionScore(d, dim.key, dayStemIdx);
    const stars = '★'.repeat(Math.floor(score/2)) + '☆'.repeat(5-Math.floor(score/2));
    const tip = dim.tips[new Date().getDate() % dim.tips.length];
    html += `<div style="padding:12px;background:rgba(255,255,255,.02);border-radius:8px">
      <div style="font-size:12px;opacity:.5;margin-bottom:4px">${dim.name}</div>
      <div style="font-size:14px;color:var(--gold);margin-bottom:4px">${stars}</div>
      <div style="font-size:11px;opacity:.7;line-height:1.6">${tip}</div>
    </div>`;
  });
  html += '</div>';

  // 3. 年度重点
  html += '<h6 style="color:var(--gold);letter-spacing:2px;margin:16px 0 8px">📅 年度重点(此大运期间)</h6>';
  html += `<div style="font-size:12px;line-height:2;opacity:.8">`;
  html += `<div>· ${d.yearStart}-${d.yearStart+4}年:奠基期，宜稳扎稳打，积累资源</div>`;
  html += `<div>· ${d.yearStart+5}-${d.yearStart+9}年:发展期，运势上扬，可大胆进取</div>`;
  html += `<div>· ${d.yearEnd-4}-${d.yearEnd}年:收获期，成果显现，但防盛极而衰</div>`;
  html += `</div>`;

  // 4. 化解建议
  html += '<h6 style="color:var(--gold);letter-spacing:2px;margin:16px 0 8px">🛡️ 化解建议</h6>';
  if (d.isJi) {
    html += `<div class="huajie-alert" style="border-color:rgba(231,76,60,.3);background:rgba(231,76,60,.06)">`;
    html += `<div class="alert-title">⚠️ 此步大运含忌神</div>`;
    html += `<p style="margin-top:8px;line-height:1.8">建议:佩戴${getKe(d.ganEle)}属性饰品化解，避免${d.ganEle}方位发展，多行善事积累福报。</p>`;
    html += `</div>`;
  } else if (d.isXi) {
    html += `<div class="huajie-alert" style="border-color:rgba(46,204,113,.3);background:rgba(46,204,113,.06)">`;
    html += `<div class="alert-title">★ 此步大运含喜用神</div>`;
    html += `<p style="margin-top:8px;line-height:1.8">建议:把握机遇，${d.ganEle}方位发展有利，佩戴${d.ganEle}属性饰品增强运势。</p>`;
    html += `</div>`;
  } else {
    html += `<div class="huajie-alert">`;
    html += `<div class="alert-title">平稳之运</div>`;
    html += `<p style="margin-top:8px;line-height:1.8">此步大运平吉，宜稳不宜激，积累为主，等待更好大运到来。</p>`;
    html += `</div>`;
  }

  document.getElementById('dayunDetailContent').innerHTML = html;
  window._currentDayunDetail = d;
}

// 维度评分辅助函数
function computeDimensionScore(dayun, dimension, dayStemIdx) {
  const rel = dayun.rel;
  const ganEle = dayun.ganEle;
  const zhiEle = dayun.zhiEle;

  let baseScore = 5;

  if (dimension === 'career') {
    if (rel === '正官' || rel === '七杀') baseScore += 2;
    if (ganEle === '金' || ganEle === '水') baseScore += 1;
  } else if (dimension === 'wealth') {
    if (rel === '正财' || rel === '偏财') baseScore += 2;
    if (ganEle === '金' || ganEle === '土') baseScore += 1;
  } else if (dimension === 'marriage') {
    if (rel === '正财' || rel === '正官') baseScore += 2;
    if (zhiEle === '土' || zhiEle === '火') baseScore += 1;
  } else if (dimension === 'health') {
    if (ganEle === ELE[STEMS[dayStemIdx]]) baseScore -= 1;
    if (getKe(ganEle) === ELE[STEMS[dayStemIdx]]) baseScore -= 2;
  } else if (dimension === 'study') {
    if (rel === '正印' || rel === '偏印') baseScore += 2;
    if (ganEle === '水' || ganEle === '木') baseScore += 1;
  }

  return Math.max(2, Math.min(10, baseScore));
}

// 五行生克辅助函数
function getSheng(ele) {
  const map = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  return map[ele] || '';
}
function getXSheng(ele) {
  const sheng = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  return sheng[ele] || '';
}
function getKe(ele) {
  const map = {木:'土',火:'金',土:'水',金:'木',水:'火'};
  return map[ele] || '';
}

// ═══════════════════════════════════════════════════════════
//  吉日查询引擎
// ═══════════════════════════════════════════════════════════

// --- 60甲子循环常数 ---
const J_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const J_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const J_ELE = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
const J_ZHI_ELE = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};

// --- 干支纪日（60甲子循环）---
// 基准：2025-01-01 = 辛丑日（第38个：stemIdx=7,branchIdx=1）
function getDayGz(date) {
  const base = new Date(2025,0,1); // 2025-01-01
  const diff = Math.round((date - base) / 86400000);
  const stemIdx = ((diff + 7) % 10 + 10) % 10;
  const branchIdx = ((diff + 1) % 12 + 12) % 12;
  return {
    stem: J_STEMS[stemIdx], branch: J_BRANCHES[branchIdx],
    stemIdx, branchIdx,
    ganzhi: J_STEMS[stemIdx] + J_BRANCHES[branchIdx]
  };
}

// --- 彭祖百忌（按天干索引）---
const PENGZU_BAIJI = {
  0:  '甲日不开仓，乙日不栽植，丙日不纳程，丁日不剃头，戊日不受田，己日不破卷，庚日不评兵，辛日不合酱，壬日不汲水，癸日不接发',
  1:  '甲不开仓，乙不栽植，丙不纳粮，丁不剃头，戊不受田，己不破田，庚不评理，辛不合酱，壬不汲水，癸不接发',
  2:  '甲不搬迁，乙不伐木，丙不修灶，丁不词讼，戊不受债，己不词讼，庚不逃跑，辛不合帐，壬不娶妾，癸不治病',
  3:  '甲不修容，乙不伐树，丙不穿井，丁不设账，戊不远行，己不投宿，庚不验货，辛不买田，壬不嫁娶，癸不词讼',
  4:  '甲不迁居，乙不伐木，丙不入宅，丁不设宴，戊不词讼，己不买卖，庚不逃跑，辛不合和，壬不开业，癸不词讼',
  5:  '甲不修造，乙不迁移，丙不剃头，丁不设祭，戊不动土，己不破田，庚不评人，辛不合作，壬不取土，癸不远行',
  6:  '甲不迁徙，乙不伐木，丙不入宅，丁不剃头，戊不受田，己不设祭，庚不逃跑，辛不合酱，壬不娶妇，癸不动土',
  7:  '甲不搬迁，乙不栽植，丙不纳妾，丁不设宴，戊不受田，己不破卷，庚不评兵，辛不合和，壬不开业，癸不远行',
  8:  '甲不修灶，乙不伐木，丙不入宅，丁不剃头，戊不受田，己不合账，庚不逃跑，辛不合和，壬不娶妾，癸不祭祀',
  9:  '甲不迁居，乙不栽植，丙不入宅，丁不设祭，戊不受田，己不破卷，庚不逃跑，辛不合酱，壬不汲水，癸不词讼'
};

// --- 二十八星宿（按日期循环）---
const XIU_NAMES_CN = ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];
const XIU_BANGS = ['木','金','金','日','月','火','水','木','金','火','日','月','火','水','土','金','木','日','月','火','水','木','金','金','日','月','火','水'];
const XIU_FATE = ['吉','凶','凶','吉','凶','吉','凶','吉','吉','凶','凶','凶','吉','吉','吉','吉','凶','凶','大吉','凶','大吉','大吉','大吉','吉','大吉','凶','大吉','大吉'];
const XIU_DESC = {
  '吉':'诸事皆宜，吉祥如意',凶:'口舌是非，谨慎行事',大吉:'大吉大利，福运临门'
};

// --- 建除十二神（按日期循环）---
const JIANCHU = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
const JIANCHU_FATE = ['凶','吉','平','凶','吉','吉','凶','平','吉','凶','吉','平'];
const JIANCHU_YI = {
  '建':'上梁、竖柱、出行', '除':'扫舍、求医、解除', '满':'祈福、祭祀、塞穴',
  '平':'修饰、垣墙、平治道涂', '定':'冠带、入学、酝酿', '执':'捕捉、入学、求嗣',
  '破':'求医、破屋、坏垣', '危':'安床、纳财、拆卸', '成':'入学、结婚姻、纳采',
  '收':'开市、交易、纳财', '开':'开业、竖柱、上梁', '闭':'补垣、塞穴、拆屋'
};
const JIANCHU_JI = {
  '建':'动土、出兵', '除':'', '满':'移徙、出火', '平':'词讼、栽种',
  '定':'', '执':'祈福、词讼', '破':'求医、嫁娶', '危':'',
  '成':'词讼、出兵', '收':'安葬、破土', '开':'动土、诉讼', '闭':'祈福、塞穴'
};

// --- 黄道黑道（按地支索引）---
// 子午日:青龙=吉, 丑未日:明堂=吉, 寅申日:金匮=吉, 卯酉日:天德=吉, 辰戌日:玉堂=吉, 巳亥日:司命=吉
const HUANGDAO_GOOD = {子:'青龙',丑:'明堂',寅:'金匮',卯:'天德',辰:'玉堂',巳:'司命',午:'青龙',未:'明堂',申:'金匮',酉:'天德',戌:'玉堂',亥:'司命'};
const HEIDAO_BAD = {子:'白虎',丑:'天刑',寅:'朱雀',卯:'勾陈',辰:'青龙',巳:'明堂',午:'白虎',未:'天刑',申:'朱雀',酉:'勾陈',戌:'青龙',亥:'明堂'};
const HUANGDAO_FATE = {青龙:'大吉',明堂:'吉',金匮:'吉',天德:'吉',玉堂:'吉',司命:'吉',白虎:'凶',天刑:'凶',朱雀:'凶',勾陈:'凶'};

// --- 宜忌数据库（按60甲子索引）---
const YIJI_DB = [
  {yi:'祭祀 祈福 动土 开业 订盟 纳采',ji:'嫁娶 搬家 安葬',gz:'甲子'},{yi:'沐浴 扫舍 祭祀 纳财 捕捉 纳畜',ji:'开业 动土 出行 词讼',gz:'乙丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 词讼',gz:'丙寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 词讼',gz:'丁卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 纳畜',gz:'戊辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 动土',ji:'动土 破土 安葬 词讼',gz:'己巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'庚午'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 出行',ji:'动土 破土 安葬 栽种',gz:'辛未'},
  {yi:'开市 交易 立券 挂匾 栽种 祭祀',ji:'嫁娶 动土 破土 安葬',gz:'壬申'},{yi:'祭祀 祈福 嫁娶 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'癸酉'},
  {yi:'沐浴 扫舍 修饰 垣墙 祭祀 祈福',ji:'开业 搬家 开市 纳财',gz:'甲戌'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙亥'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 破土 动土',gz:'丙子'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 动土',ji:'动土 破土 安葬 栽种',gz:'丁丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 栽种',gz:'戊寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 栽种',gz:'己卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'庚辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'辛巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'壬午'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 出行',ji:'动土 破土 安葬 栽种',gz:'癸未'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 破土 动土',gz:'甲申'},{yi:'祭祀 祈福 嫁娶 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙酉'},
  {yi:'沐浴 扫舍 修饰 垣墙 祭祀 祈福',ji:'开业 搬家 开市 纳财',gz:'甲戌'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙亥'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'丙子'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 动土',ji:'动土 破土 安葬 栽种',gz:'丁丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 栽种',gz:'戊寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 栽种',gz:'己卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'庚辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'辛巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'壬午'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 出行',ji:'动土 破土 安葬 栽种',gz:'癸未'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 破土 动土',gz:'甲申'},{yi:'祭祀 祈福 嫁娶 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙酉'},
  {yi:'沐浴 扫舍 修饰 垣墙 祭祀 祈福',ji:'开业 搬家 开市 纳财',gz:'丙戌'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'丁亥'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'戊子'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 动土',ji:'动土 破土 安葬 栽种',gz:'己丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 栽种',gz:'庚寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 栽种',gz:'辛卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'壬辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'癸巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'甲午'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 出行',ji:'动土 破土 安葬 栽种',gz:'乙未'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 破土 动土',gz:'丙申'},{yi:'祭祀 祈福 嫁娶 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'丁酉'},
  {yi:'沐浴 扫舍 修饰 垣墙 祭祀 祈福',ji:'开业 搬家 开市 纳财',gz:'戊戌'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'己亥'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'庚子'},{yi:'祭祀 祈福 嫁娶 订盟 纳采 动土',ji:'动土 破土 安葬 栽种',gz:'辛丑'},
  {yi:'出行 移徙 祭祀 祈福 开光 纳采',ji:'安葬 动土 嫁娶 栽种',gz:'壬寅'},{yi:'订盟 纳采 祭祀 祈福 嫁娶 动土',ji:'开市 置产 入宅 栽种',gz:'癸卯'},
  {yi:'开市 交易 立券 纳财 栽种 牧养',ji:'安葬 行丧 伐木 破土',gz:'甲辰'},{yi:'嫁娶 祭祀 祈福 纳采 订盟 出行',ji:'动土 破土 安葬 栽种',gz:'乙巳'},
  {yi:'沐浴 冠笄 修饰 垣墙 扫舍 求医',ji:'开业 搬家 开市 词讼',gz:'丙午'}
];

// --- 冲煞信息 ---
const CHONG_SHA = {
  '子':'午', '丑':'未', '寅':'申', '卯':'酉', '辰':'戌', '巳':'亥',
  '午':'子', '未':'丑', '申':'寅', '酉':'卯', '戌':'辰', '亥':'巳'
};
const SHA_FANGXIANG = {
  '子':'午', '丑':'未', '寅':'申', '卯':'酉', '辰':'戌', '巳':'亥',
  '午':'子', '未':'丑', '申':'寅', '酉':'卯', '戌':'辰', '亥':'巳'
};

// --- 农历月份名 ---
const LUNAR_MONTH_NAME = ['','正','二','三','四','五','六','七','八','九','十','冬','腊'];
const LUNAR_DAY_NAME = ['','初一','初二','初三','初四','初五','初六','初七','初八','初九','初十',
  '十一','十二','十三','十四','十五','十六','十七','十八','十九','二十',
  '廿一','廿二','廿三','廿四','廿五','廿六','廿七','廿八','廿九','三十'];

// --- 时辰吉凶 ---
function getHourFate(stemIdx, branchIdx) {
  const stem = J_STEMS[stemIdx];
  const branch = J_BRANCHES[branchIdx];
  // 简单时辰判断：子丑寅卯辰巳午未申酉戌亥，各时辰本气旺衰
  const fateMap = {
    '子':'平', '丑':'平', '寅':'吉', '卯':'吉', '辰':'平', '巳':'平',
    '午':'吉', '未':'凶', '申':'平', '酉':'平', '戌':'吉', '亥':'平'
  };
  // 配合日干：日干为甲丙戊庚壬时，子午丑未寅申卯酉为吉
  const stemGoodHours = {
    '甲':['寅','卯','午','未','戌','亥'], '乙':['寅','卯','午','未','戌','亥'],
    '丙':['寅','卯','巳','午','戌','亥'], '丁':['寅','卯','巳','午','戌','亥'],
    '戊':['寅','卯','巳','午','戌','亥'], '己':['寅','卯','巳','午','戌','亥'],
    '庚':['丑','卯','辰','午','未','戌'], '辛':['丑','卯','辰','午','未','戌'],
    '壬':['寅','卯','辰','巳','午','未'], '癸':['寅','卯','辰','巳','午','未']
  };
  const shichen = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const goodHours = stemGoodHours[stem] || ['寅','卯','午','未'];
  return shichen.map(h => goodHours.includes(h) ? '吉' : '平');
}

// ================================================================
// 二十四节气计算与民俗知识库
// ================================================================
var _stBase = {
  '小寒':[0,5],'大寒':[0,20],'立春':[1,3],'雨水':[1,18],
  '惊蛰':[2,5],'春分':[2,20],'清明':[3,4],'谷雨':[3,19],
  '立夏':[4,5],'小满':[4,20],'芒种':[5,5],'夏至':[5,21],
  '小暑':[6,6],'大暑':[6,22],'立秋':[7,7],'处暑':[7,22],
  '白露':[8,7],'秋分':[8,22],'寒露':[9,8],'霜降':[9,23],
  '立冬':[10,7],'小雪':[10,22],'大雪':[11,6],'冬至':[11,21]
};
var _stOrder = ['冬至','小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];

function getSolarTerm(date) {
  var year = date.getFullYear();
  var offset = year - 2026;
  var found = null;
  for (var i = 0; i < _stOrder.length; i++) {
    var name = _stOrder[i];
    var base = _stBase[name];
    if (!base) continue;
    var d = new Date(year, base[0], base[1] + offset);
    if (date >= d) found = { name: name, date: d };
  }
  if (found) {
    var isToday = found.date.getFullYear() === date.getFullYear() &&
      found.date.getMonth() === date.getMonth() &&
      found.date.getDate() === date.getDate();
    return { name: found.name, isTermDay: isToday };
  }
  return { name: null, isTermDay: false };
}

var SOLAR_TERM_INFO = {
  '小寒':{food:'腊八粥/羊肉汤',taboo:'忌吃生冷、忌懒散不动',health:'多吃温热，适当进补，早睡晚起',wisdom:'小寒小寒，防寒保暖；春打六九头，吃穿不用愁'},
  '大寒':{food:'八宝饭/糯米饭',taboo:'忌房屋破漏、忌与人争执',health:'冬藏宜静养心神，适当锻炼',wisdom:'大寒大寒，无风自寒；年关将近，备年迎春'},
  '立春':{food:'春饼/萝卜/韭菜',taboo:'忌搬家、忌看病、忌争吵',health:'养肝护阳，早起梳头，适量运动',wisdom:'立春一年端，种地早盘算；春捂秋冻'},
  '雨水':{food:'罐罐肉/桂圆红枣粥',taboo:'忌动土、忌破土动工',health:'健脾祛湿，少酸多甘，适度春捂',wisdom:'雨水落雨润万物，春耕春播好时节'},
  '惊蛰':{food:'梨/春笋/炒虫',taboo:'忌杀生、忌口舌是非',health:'养肝明目，多伸懒腰早起散步',wisdom:'惊蛰一雷百虫出，养生防病正当时'},
  '春分':{food:'春菜/萝卜/汤圆',taboo:'忌婚嫁、忌大兴土木',health:'阴阳平衡，多晒太阳，疏肝理气',wisdom:'春分秋分，日夜平分；吃了春分饭，一天长一线'},
  '清明':{food:'青团/清明果/润饼菜',taboo:'忌婚嫁、忌动火、忌穿红',health:'疏肝清火，踏青郊游，登高望远',wisdom:'清明前后，种瓜点豆；植树造林，莫过清明'},
  '谷雨':{food:'香椿/茶叶蛋/薏米粥',taboo:'忌暴怒、忌熬夜',health:'祛湿健脾，防春火，过敏体质少外出',wisdom:'谷雨前后，种瓜点豆；谷雨三朝看牡丹'},
  '立夏':{food:'立夏饭/茶叶蛋/三鲜',taboo:'忌贪凉、忌午睡过久',health:'养心护阳，清淡饮食，午间小憩',wisdom:'立夏三天遍地锄；立夏不下，犁耙高挂'},
  '小满':{food:'苦菜/冬瓜/薏仁',taboo:'忌过度进补、忌贪食生冷',health:'清热祛湿，健脾养胃，防苦夏',wisdom:'小满动三车，水车、油车、丝车'},
  '芒种':{food:'梅子/粽子/酸梅汤',taboo:'忌阴湿久留、忌午时暴晒',health:'清热解暑，心平气和，午时避阳',wisdom:'芒种火烧天，夏至水满田；栽秧割麦两头忙'},
  '夏至':{food:'面条/馄饨/绿豆汤',taboo:'忌行房事、忌暴晒、忌烦躁',health:'养心安神，清淡饮食，午间小睡',wisdom:'吃了夏至面，一天短一线；冬至饺子夏至面'},
  '小暑':{food:'黄鳝/莲藕/绿豆粥',taboo:'忌长时间吹空调、忌贪凉饮冷',health:'清热解暑，健脾祛湿，心静自然凉',wisdom:'小暑一声雷，倒转做黄梅'},
  '大暑':{food:'仙草冻/凉粉/冬瓜汤',taboo:'忌烈日暴晒、忌过度劳累',health:'防暑降温，多补水，适度午休',wisdom:'大暑三候：腐草为萤、土润溽暑、大雨时行'},
  '立秋':{food:'西瓜/蒸茄夹/肉末豆腐',taboo:'忌暴饮暴食、忌过度悲伤',health:'润燥养肺，少辛多酸，早睡早起',wisdom:'立秋处暑正当暑，秋老虎还需防'},
  '处暑':{food:'鸭子/龙眼/银耳羹',taboo:'忌秋冻过早、忌辛辣刺激',health:'养阴润燥，适度秋冻，预防秋燥',wisdom:'处暑出伏，凉风渐起；处暑十八盆，白露身不露'},
  '白露':{food:'龙眼/白扁豆/红薯',taboo:'忌露宿、忌贪凉、忌裸露',health:'润肺益气，秋冻适度，早卧早起',wisdom:'白露身不露，寒露脚不露'},
  '秋分':{food:'汤圆/野苋菜/秋蟹',taboo:'忌婚嫁、忌大兴土木、忌争吵',health:'阴阳平衡，收敛神气，登高望远',wisdom:'秋分昼夜平，养生重平衡'},
  '寒露':{food:'芝麻/螃蟹/柿子',taboo:'忌脚受凉、忌悲秋、忌辛辣',health:'养阴润燥，足部保暖，登高赏菊',wisdom:'寒露脚不露，养生先养脚'},
  '霜降':{food:'柿子/鸭子/萝卜',taboo:'忌秋冻过度、忌晚睡、忌悲叹',health:'平补润燥，防寒保暖，养胃健脾',wisdom:'霜降杀百草；霜降见霜，米烂成仓'},
  '立冬':{food:'饺子/羊肉/萝卜炖排骨',taboo:'忌盲目进补、忌住所破漏',health:'温补为主，早睡晚起，养藏阳气',wisdom:'立冬补冬，补嘴空；立冬晴，一冬凌'},
  '小雪':{food:'糍粑/腊肉/黑豆茶',taboo:'忌过早外出、忌紧闭门窗',health:'温补肾气，适度运动，晒晒太阳',wisdom:'小雪腌菜大雪腌肉'},
  '大雪':{food:'腌肉/红薯粥/羊肉汤',taboo:'忌紧闭窗户不通风、忌大喜大悲',health:'防寒保暖，适度温补，宜静养',wisdom:'大雪封河，腊雪兆丰年'},
  '冬至':{food:'饺子/汤圆/馄饨',taboo:'忌婚嫁、忌搬家、忌动土、忌深夜外出',health:'数九寒天，宜静养，补肾藏精',wisdom:'冬至大如年；吃了冬至面，一天长一线；冬至一阳生'}
};

var DAILY_WISDOM_TIPS = [
  '早起晒太阳，顺应天时，一整天精力充沛',
  '睡前泡脚15分钟，引火归元，安眠又养生',
  '辰时（7-9点）胃经当令，此刻吃早餐最养脾胃',
  '午睡20-30分钟最理想，睡太久反而昏沉',
  '子时（23点）前入睡，是最天然的美容方',
  '梳头100下，刺激头部经络，提神醒脑',
  '春捂秋冻，不可过早减衣，尤其注意背部保暖',
  '每天大笑三声，疏肝解郁，比吃逍遥丸还管用',
  '怒伤肝，喜伤心，思伤脾，忧伤肺，恐伤肾——情志养生是第一要义',
  '睡前1小时不看手机，让大脑自然进入休息状态',
  '白天多晒后背，温通督脉，阳气充足精神好',
  '久站伤骨，久坐伤肉，久卧伤气——动静结合才是养生',
  '汗后不宜立即洗澡，等汗干了再洗以免受寒',
  '闭目养神10分钟，相当于深度睡眠1小时',
  '空调房里放一盆水，避免干燥上火',
  '春天多吃辛：葱姜蒜香菜，发散冬季伏寒',
  '夏天吃苦（苦瓜、莲子心）清热泻火正当时',
  '秋天宜平补，鸭肉莲子最润燥',
  '冬天进补首选黑色食物：黑豆黑芝麻黑木耳',
  '冬吃萝卜夏吃姜，不用医生开药方',
  '饭前喝汤苗条健康，饭后喝汤肠胃遭殃',
  '饭吃七分饱，留三分饥饿感，脾胃从容运化',
  '细嚼慢咽每口食物不少于20下，减轻脾胃负担',
  '早晨第一杯水要喝温的，不要喝凉的',
  '最好的喝水方式是渴了再喝，小口慢饮',
  '五色入五脏：青赤黄白黑，对应心肝脾肺肾',
  '饮食有节：定时定量不偏不挑',
  '少吃腌制品，多吃新鲜蔬果，减少亚硝酸盐摄入',
  '少吃反季节蔬菜水果，当令食材最养人',
  '感冒期间饮食清淡，粥类最养脾胃',
  '感冒初起喝葱白姜汤，趁热发汗可截断病程',
  '咳嗽有痰少吃甜腻，甜腻生痰',
  '体质偏寒者少吃西瓜香蕉梨等寒性水果',
  '体质偏热者少吃辛辣，多吃凉润食物平衡',
  '湿气重的人少吃甜腻油炸生冷食物',
  '胃以温为养，早起一杯温开水比什么都养胃',
  '早餐要吃好，午餐要吃饱，晚餐要吃少',
  '晚上少吃盐少油，晚餐七八分饱最健康',
  '吃饭时心情不好，脾胃运化减半，生气莫进食',
  '叩齿36下，固肾健齿，预防牙龈萎缩',
  '常按足三里穴，健脾和胃，养生第一要穴',
  '常按三阴交穴，女性调经止痛，男可补肾壮阳',
  '常按太冲穴，疏肝理气，缓解焦虑情绪',
  '常按涌泉穴，肾精充足，头发乌黑，牙齿坚固',
  '揉腹顺时针消食，逆时针补虚，每天100下',
  '泡脚水里加艾叶，温经散寒，祛湿止痒',
  '太极拳柔和缓慢，是最安全的心肺锻炼方式',
  '八段锦晨练10分钟，胜过跑步半小时',
  '广播体操是最适合国人体质的全身运动',
  '拉伸比跑步更重要，运动前后各做5分钟',
  '踮脚跟100下，刺激肾经，温补肾阳',
  '原地高抬腿1分钟，提高心肺功能',
  '深蹲起立每天30个，锻炼下肢，预防心脑血管病',
  '每天踮脚尖走路，锻炼肾气，延年益寿',
  '拍打胆经（大腿外侧）疏通肝胆，燃脂排毒',
  '俯卧撑每天20个，男性增强上肢力量',
  '仰卧起坐每天30个，锻炼核心肌群',
  '瑜伽腹式呼吸，每天10分钟等于深度睡眠',
  '快走是最好的有氧运动，每天六千步延年益寿',
  '游泳是最好的全身运动，对关节伤害最小',
  '骑车上班，健康又环保，一石二鸟',
  '放风筝是极好的户外运动，疏肝解郁，仰头明目',
  '爬山是最好的心肺锻炼，膝盖不好可走缓坡',
  '跳绳是全身运动，每天十分钟效果惊人',
  '每天晒手心5分钟，温阳散寒'
];

function getDailyWisdom(date, stemIdx) {
  var dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  var idx = (dayOfYear + stemIdx * 3) % DAILY_WISDOM_TIPS.length;
  return DAILY_WISDOM_TIPS[idx];
}



// --- 综合评分 ---
function calcJiuriScore(stemIdx, branchIdx, dayDate) {
  let score = 50;
  const stem = J_STEMS[stemIdx];
  // 天干：甲丙戊庚壬为阳干，较为吉祥
  if ([0,2,4,6,8].includes(stemIdx)) score += 10;
  // 地支：子午卯酉为四正，较吉
  if ([0,4,8].includes(branchIdx)) score += 8;
  if (branchIdx === 4) score += 5;
  // 月相：初一、十五、廿三为特殊日
  const d = dayDate.getDate();
  if (d === 1 || d === 15) score += 15;
  else if (d === 3 || d === 7 || d === 13 || d === 23) score += 5;
  else if (d === 5 || d === 14 || d === 20) score -= 5;
  // 周末+5
  if (dayDate.getDay() === 0 || dayDate.getDay() === 6) score += 3;
  // 建除：建/除/满/定/执/成为吉
  const jcIdx = (dayDate - new Date(2025,0,1)) / 86400000 % 12;
  const jcFate = JIANCHU_FATE[(jcIdx + 12) % 12];
  if (jcFate === '吉') score += 8;
  else if (jcFate === '大吉') score += 15;
  else if (jcFate === '凶') score -= 10;
  return Math.max(1, Math.min(100, Math.round(score)));
}

// --- 月历渲染 ---
let _jiuriYear = new Date().getFullYear();
let _jiuriMonth = new Date().getMonth();

function jiuriInit() {
  const sel = document.getElementById('jiuriYearSelect');
  if (!sel) return;
  sel.innerHTML = '';
  for (let y = new Date().getFullYear() - 2; y <= new Date().getFullYear() + 5; y++) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y + '年';
    if (y === new Date().getFullYear()) opt.selected = true;
    sel.appendChild(opt);
  }
  const dateInput = document.getElementById('jiuriDateInput');
  if (dateInput) {
    const t = new Date();
    dateInput.value = t.getFullYear() + '-' + String(t.getMonth()+1).padStart(2,'0') + '-' + String(t.getDate()).padStart(2,'0');
  }
  _jiuriYear = new Date().getFullYear();
  _jiuriMonth = new Date().getMonth();
  jiuriRenderCal();
}

function jiuriToday() {
  const t = new Date();
  _jiuriYear = t.getFullYear();
  _jiuriMonth = t.getMonth();
  const sel = document.getElementById('jiuriYearSelect');
  if (sel) sel.value = _jiuriYear;
  const di = document.getElementById('jiuriDateInput');
  if (di) di.value = t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
  jiuriRenderCal();
  jiuriShowDate();
}

function jiuriPrevMonth() {
  if (--_jiuriMonth < 0) { _jiuriMonth = 11; _jiuriYear--; }
  const sel = document.getElementById('jiuriYearSelect');
  if (sel) sel.value = _jiuriYear;
  jiuriRenderCal();
}

function jiuriNextMonth() {
  if (++_jiuriMonth > 11) { _jiuriMonth = 0; _jiuriYear++; }
  const sel = document.getElementById('jiuriYearSelect');
  if (sel) sel.value = _jiuriYear;
  jiuriRenderCal();
}

function jiuriShowDate() {
  const dateInput = document.getElementById('jiuriDateInput');
  if (!dateInput || !dateInput.value) return;
  const d = new Date(dateInput.value + 'T00:00:00');
  _jiuriYear = d.getFullYear();
  _jiuriMonth = d.getMonth();
  const sel = document.getElementById('jiuriYearSelect');
  if (sel) sel.value = _jiuriYear;
  jiuriRenderCal();
  jiuriShowDetail(d);
}

function jiuriRenderCal() {
  const cal = document.getElementById('jiuriCalendar');
  const label = document.getElementById('jiuriMonthLabel');
  if (!cal) return;
  const WEEK = ['日','一','二','三','四','五','六'];
  const firstDay = new Date(_jiuriYear, _jiuriMonth, 1).getDay();
  const daysInMonth = new Date(_jiuriYear, _jiuriMonth + 1, 0).getDate();
  const today = new Date();

  let html = '';
  // 星期头
  WEEK.forEach(w => {
    html += `<div class="jiuri-cal-header">${w}</div>`;
  });
  // 空白格子
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="jiuri-cal-cell empty"></div>`;
  }
  // 日期格子
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(_jiuriYear, _jiuriMonth, d);
    const isToday = today.getFullYear() === _jiuriYear && today.getMonth() === _jiuriMonth && today.getDate() === d;
    const gz = getDayGz(date);
    const jcIdx = (Math.round((date - new Date(2025,0,1)) / 86400000) % 12 + 12) % 12;
    const jcFate = JIANCHU_FATE[jcIdx];
    const xiuIdx = Math.abs(Math.round((date - new Date(2025,0,1)) / 86400000)) % 28;
    const xiuFate = XIU_FATE[xiuIdx];
    var _dateInput = document.getElementById('jiuriDate') || document.getElementById('hjDate');
    const selected = _dateInput && _dateInput.value === _jiuriYear+'-'+String(_jiuriMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    // 分数
    const score = calcJiuriScore(gz.stemIdx, gz.branchIdx, date);
    let dotClass = '';
    if (score >= 75) dotClass = 'best';
    else if (score >= 60) dotClass = 'good';
    else if (score < 35) dotClass = 'worst';
    else if (score < 50) dotClass = 'bad';
    const selAttr = selected ? 'selected' : '';
    const todayAttr = isToday ? 'today' : '';
    const lunarD = LUNAR_DAY_NAME[(date - new Date(_jiuriYear,0,1)) % 30] || LUNAR_DAY_NAME[Math.floor(((date - new Date(_jiuriYear,0,1)) / 86400000) % 30)];
    html += `<div class="jiuri-cal-cell ${dotClass} ${selAttr} ${todayAttr}" onclick="jiuriPickDate(${d})">
      <span class="cal-day">${d}</span>
      <span class="cal-lunar">${lunarD}</span>
      <div class="cal-dot"></div>
    </div>`;
  }
  cal.innerHTML = html;
  if (label) {
    label.textContent = (_jiuriMonth + 1) + '月';
  }
}
