
// ===== 商城分类切换 =====

// ===== 渲染道医产品 =====

// ===== 渲染佛医产品 =====

// ===== 渲染名医推荐 =====

// ===== 产品详情弹窗 =====

<\/script>
</html>`;
  const blob = new Blob([html], {type:'text/html'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = '化解方案报告.html'; a.click();
  URL.revokeObjectURL(url);
}

function matchMyMingua(btn, suitableStr) {
  const card = btn.closest('.plan-card');
  let resultDiv = card.querySelector('.plan-match-result');
  if (!resultDiv) {
    resultDiv = document.createElement('div');
    resultDiv.className = 'plan-match-result';
    btn.parentNode.insertBefore(resultDiv, btn.nextSibling);
  }

  // 从 localStorage 获取八字
  const bazi = JSON.parse(localStorage.getItem('userBazi') || '{}');
  let birthYear = bazi.year || null;
  if (!birthYear && bazi.birthday) {
    birthYear = parseInt(bazi.birthday.split('-')[0]);
  }
  if (!birthYear) {
    // 再查输入字段
    const yearInput = document.getElementById('bzYear');
    if (yearInput && yearInput.value) {
      birthYear = parseInt(yearInput.value);
    }
  }

  if (!birthYear || isNaN(birthYear)) {
    resultDiv.className = 'plan-match-result show nomatch';
    resultDiv.innerHTML = '⚠️ 请先在「八宅风水·命卦分析」中输入出生年份，或先在信众中心绑定八字信息';
    return;
  }

  const sexInput = document.getElementById('bzSex');
  const sex = (sexInput && sexInput.value) || bazi.sex || 'male';

  if (!sexInput || !sexInput.value) {
    resultDiv.className = 'plan-match-result show nomatch';
    resultDiv.innerHTML = '⚠️ 请先在「八宅风水·命卦分析」中选择性别';
    return;
  }

  const mingGua = getMingGua(birthYear, sex);
  const minguaName = mingGua.guaName;
  const minguaType = mingGua.type;

  const suitable = suitableStr.split(',').map(s => s.trim().replace('命',''));
  const isMatch = suitable.some(s => s === minguaName || s === '');

  if (isMatch) {
    resultDiv.className = 'plan-match-result show match';
    resultDiv.innerHTML = '✅ <b>匹配!</b>您的命卦为「' + minguaName + '命」(' + minguaType + '),此户型推荐「' + suitableStr + '」,完美契合!';
  } else {
    resultDiv.className = 'plan-match-result show nomatch';
    resultDiv.innerHTML = '⚠️ 您的命卦为「' + minguaName + '命」(' + minguaType + '),此户型推荐「' + suitableStr + '」,不太匹配。<br>💡 可通过风水布局调化，仅供参考。';
  }
}

// ================================================================
//  HELPER FUNCTIONS FOR HUAJIE MODULE
// ================================================================

function getMonthlyReport(hj) {
  const monthNames = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','十一月','腊月'];
  const monthData = [
    {month:'正月', stem:'丙', zhi:'寅', overall:'吉', luck:'事业', desc:'新春吉庆，木火通明。利于事业起步、学习进修。贵人相助，机会涌现。适合制定年度计划、拜见贵人。'},
    {month:'二月', stem:'丁', zhi:'卯', overall:'平', luck:'感情', desc:'木气当令，桃花旺。利于感情姻缘、社交人际。单身者有望遇到正缘，已婚者需防第三者介入。'},
    {month:'三月', stem:'戊', zhi:'辰', overall:'平', luck:'财运', desc:'辰月土盛，稳中求财。财运平稳，不宜投机。可进行长线投资、置办固定资产。'},
    {month:'四月', stem:'己', zhi:'巳', overall:'平', luck:'健康', desc:'火势渐旺，需注意心脏、眼睛健康。情绪易急躁，宜修身养性。多做户外运动、户外活动有利。'},
    {month:'五月', stem:'庚', zhi:'午', overall:'吉', luck:'事业', desc:'午月火旺，与太岁同气。事业运上升，利考试、利文书、利名声。但火旺伤金，注意呼吸系统。'},
    {month:'六月', stem:'辛', zhi:'未', overall:'凶', luck:'小人', desc:'年月相刑口舌多，小人暗算需谨慎。避免与人争执、合作签约需仔细。家中西南方忌动土。'},
    {month:'七月', stem:'壬', zhi:'申', overall:'平', luck:'财运', desc:'申月金水相生，财运渐有起色。利出差、利远行、利贵人运。亥日(阴历十七前后)运势最佳。'},
    {month:'八月', stem:'癸', zhi:'酉', overall:'吉', luck:'感情', desc:'酉月金旺，桃花星照命。感情运佳，利相亲、利结婚。单身者把握中秋前后良机。'},
    {month:'九月', stem:'甲', zhi:'戌', overall:'平', luck:'学业', desc:'戌月火库，事业学业并进。利考试、利晋升、利职业培训。亥日、寅日学习效率最高。'},
    {month:'十月', stem:'乙', zhi:'亥', overall:'吉', luck:'财运', desc:'亥月水旺，水火既济。财运大好，利正财、利投资。注意肾脏、泌尿系统健康。'},
    {month:'十一月', stem:'丙', zhi:'子', overall:'平', luck:'事业', desc:'子月水盛，与午相冲。动中求财，利出差、利变动。注意心脏健康，避免熬夜。'},
    {month:'十二月', stem:'丁', zhi:'丑', overall:'平', luck:'健康', desc:'丑月土旺，运势平稳收尾。宜总结年度计划、清理人际关系。为来年做准备，宜行善积德。'}
  ];

  let html = '<div class="huajie-calendar">';
  for (let i = 0; i < 12; i++) {
    const m = monthData[i];
    let colorClass = 'month-neutral';
    if (m.overall === '吉') colorClass = 'month-good';
    else if (m.overall === '凶') colorClass = 'month-bad';
    html += '<div class="month-item ' + colorClass + '" onclick="showMonthDetail(' + i + ')">';
    html += '<div style="font-size:13px;font-weight:600">' + m.month + '</div>';
    html += '<div style="font-size:10px;opacity:.5;margin-top:2px">' + m.stem + m.zhi + '</div>';
    html += '<div style="font-size:10px;margin-top:4px">' + m.overall + '</div>';
    html += '<div style="font-size:9px;opacity:.5;margin-top:2px">重点:' + m.luck + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // 详细文字版(折叠)
  html += '<div style="margin-top:20px">';
  html += '<div class="huajie-alert" style="cursor:pointer" onclick="toggleHuajieDetail(this)">';
  html += '<div class="alert-title">📖 逐月详细分析(点击展开)</div>';
  html += '<div class="month-detail-content" style="display:none;margin-top:12px">';
  for (let i = 0; i < 12; i++) {
    const m = monthData[i];
    let color = '#c9a84c';
    if (m.overall === '吉') color = '#2ecc71';
    else if (m.overall === '凶') color = '#e74c3c';
    html += '<div style="margin-bottom:16px;padding:12px;background:rgba(255,255,255,.02);border-radius:6px">';
    html += '<div style="color:var(--gold);font-size:14px;margin-bottom:6px">' + m.month + ' · ' + m.stem + m.zhi + '</div>';
    html += '<p style="font-size:13px;line-height:1.8;opacity:.8">' + m.desc + '</p>';
    html += '<div style="margin-top:6px;font-size:12px"><span style="color:' + color + '">' + m.overall + '</span> · 重点:' + m.luck + '</div>';
    html += '</div>';
  }
  html += '</div></div></div>';

  return html;
}

function getDimensionAdvice(hj) {
  const dayStem = hj.dayStem;
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
    if (hint) hint.textContent = '当前:农历输入(农历以子时23:00为一日之始)';
  } else {
    if (solarDateInput) solarDateInput.style.display = '';
    if (lunarArea) lunarArea.style.display = 'none';
    if (hint) hint.textContent = '当前:公历输入';
  }
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
    const tip = dim.tips[Math.floor(Math.random()*dim.tips.length)];
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
    const selected = dateInput && dateInput.value === _jiuriYear+'-'+String(_jiuriMonth+1).padStart(2,'0')+'-'+String(d).padStart(2,'0');
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

function jiuriPickDate(d) {
  const dateStr = _jiuriYear + '-' + String(_jiuriMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
  const di = document.getElementById('jiuriDateInput');
  if (di) di.value = dateStr;
  const date = new Date(_jiuriYear, _jiuriMonth, d);
  // 更新选中高亮
  document.querySelectorAll('.jiuri-cal-cell').forEach(c => c.classList.remove('selected'));
  const cells = document.querySelectorAll('.jiuri-cal-cell:not(.empty)');
  cells.forEach(c => {
    if (parseInt(c.querySelector('.cal-day').textContent) === d) c.classList.add('selected');
  });
  jiuriShowDetail(date);
}

function jiuriShowDetail(date) {
  const detail = document.getElementById('jiuriDetail');
  if (!detail) return;
  detail.style.display = 'block';

  const gz = getDayGz(date);
  const stemIdx = gz.stemIdx;
  const branchIdx = gz.branchIdx;
  const branch = gz.branch;
  const stem = gz.stem;

  // 干支纪日
  const ganzhi = gz.ganzhi;
  const dayGz = ganzhi;

  // 冲煞
  const chongZhu = CHONG_SHA[branch] || '';
  const shaFang = SHA_FANGXIANG[branch] || '';

  // 彭祖百忌
  const pengzuText = PENGZU_BAIJI[stemIdx] || '无特殊禁忌';
  const pz禁忌 = pengzuText.split('，').filter(p => p.startsWith(stem));
  const pengzu = pz禁忌.length > 0 ? pz禁忌[0] : (PENGZU_BAIJI[stemIdx] || '').split('，')[0];

  // 建除
  const jcIdx = (Math.round((date - new Date(2025,0,1)) / 86400000) % 12 + 12) % 12;
  const jianchu = JIANCHU[jcIdx];
  const jcFate = JIANCHU_FATE[jcIdx];
  const jcYi = JIANCHU_YI[jianchu] || '';
  const jcJi = JIANCHU_JI[jianchu] || '';

  // 星宿
  const xiuIdx = Math.abs(Math.round((date - new Date(2025,0,1)) / 86400000)) % 28;
  const xiuName = XIU_NAMES_CN[xiuIdx];
  const xiuBang = XIU_BANGS_CN[xiuIdx];
  const xiuFate = XIU_FATE[xiuIdx];
  const xiuDesc = XIU_DESC[xiuFate];

  // 黄道黑道
  const huangdao = HUANGDAO_GOOD[branch] || '';
  const heidao = HEIDAO_BAD[branch] || '';
  const huangdaoFate = HUANGDAO_FATE[huangdao] || '平';

  // 宜忌
  const yijiIdx = (Math.round((date - new Date(2025,0,1)) / 86400000) % 60 + 60) % 60;
  const yiji = YIJI_DB[yijiIdx] || {yi:'诸事不宜', ji:'大事勿用'};

  // 时辰
  const hourFates = getHourFate(stemIdx, branchIdx);

  // 综合评分
  const score = calcJiuriScore(stemIdx, branchIdx, date);
  let rating = '平', ratingClass = 'ok';
  if (score >= 80) { rating = '大吉'; ratingClass = 'great'; }
  else if (score >= 65) { rating = '吉'; ratingClass = 'good'; }
  else if (score < 40) { rating = '凶'; ratingClass = 'worst'; }
  else if (score < 55) { rating = '平'; ratingClass = 'bad'; }

  // 星期
  const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
  const weekDay = weekDays[date.getDay()];

  // 公历日期
  const solarStr = date.getFullYear() + '年' + (date.getMonth()+1) + '月' + date.getDate() + '日 ' + weekDay;

  // 农历日期（简化）
  const lunarMonth = Math.floor((date.getMonth() + ((date.getDate()/30) * 1.03)) % 12) + 1;
  const lunarDay = ((date - new Date(date.getFullYear(),0,1)) % 30) + 1;
  const lunarStr = (lunarMonth === 1 && date.getMonth() > 1 ? '腊' : LUNAR_MONTH_NAME[lunarMonth] || String(lunarMonth)) + '月' + LUNAR_DAY_NAME[lunarDay] || String(lunarDay)+'日';

  // 生肖冲煞
  const zodiacMap = {子:'鼠',丑:'牛',寅:'虎',卯:'兔',辰:'龙',巳:'蛇',午:'马',未:'羊',申:'猴',酉:'鸡',戌:'狗',亥:'猪'};
  const zodiac = zodiacMap[branch] || branch;

  let html = '';
  // 标题行
  html += `<div class="jiuri-detail-card">
    <div style="text-align:center;margin-bottom:20px">
      <div style="font-size:13px;opacity:.5;letter-spacing:2px">${solarStr}</div>
      <div style="font-size:13px;opacity:.4;letter-spacing:2px;margin-top:4px">农历 ${lunarStr}</div>
      <div style="margin-top:12px">
        <span class="jiuri-badge ${ratingClass}">${rating}</span>
        <span style="font-family:'Ma Shan Zheng',serif;font-size:28px;color:var(--gold);letter-spacing:4px">${ganzhi}日</span>
        <span style="font-size:13px;opacity:.5;margin-left:8px">${weekDay}</span>
      </div>
      <div style="font-size:13px;opacity:.5;margin-top:8px">${zodiac}年 | 评分 ${score}/100</div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin-bottom:16px">
      <div class="jiuri-row"><span style="opacity:.4">冲</span><span style="color:#e74c3c">${chongZhu}🐀</span><span style="opacity:.4">煞</span><span style="color:#e74c3c">${shaFang}向</span></div>
      <div class="jiuri-row"><span style="opacity:.4">建除</span><span class="jiuri-badge ${jcFate==='吉'?'good':jcFate==='大吉'?'great':jcFate==='凶'?'bad':'ok'}">${jianchu}</span></div>
      <div class="jiuri-row"><span style="opacity:.4">星宿</span><span>${xiuName}宿</span><span style="font-size:10px;opacity:.4">(${xiuBang}日)</span><span class="jiuri-badge ${xiuFate==='大吉'?'great':xiuFate==='吉'?'good':'ok'}">${xiuFate}</span></div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
      <div>
        <div style="font-size:11px;letter-spacing:2px;opacity:.4;margin-bottom:8px">黄道 ${huangdao} <span class="jiuri-badge great">${huangdaoFate}</span></div>
        <div style="font-size:11px;letter-spacing:2px;opacity:.4">黑道 ${heidao} <span class="jiuri-badge bad">${HUANGDAO_FATE[heidao]||'平'}</span></div>
      </div>
      <div>
        <div style="font-size:11px;letter-spacing:2px;opacity:.4;margin-bottom:4px">彭祖百忌</div>
        <div style="font-size:12px;color:#e74c3c;letter-spacing:1px">${pengzu}</div>
      </div>
    </div>
  </div>`;

  // 宜忌
  const yiArr = (yiji.yi || '诸事不宜').split(/[\s、]/).filter(Boolean);
  const jiArr = (yiji.ji || '大事勿用').split(/[\s、]/).filter(Boolean);
  html += `<div class="jiuri-detail-card">
    <h4>✅ 宜做事项</h4>
    <div class="jiuri-yi-list">${yiArr.map(y => `<span class="jiuri-yi-tag">${y}</span>`).join('')}</div>
    <h4 style="margin-top:16px">❌ 忌做事项</h4>
    <div class="jiuri-yi-list">${jiArr.map(j => `<span class="jiuri-ji-tag">${j}</span>`).join('')}</div>
    ${jcYi ? `<div style="margin-top:12px;font-size:11px;opacity:.5">建除宜: ${jcYi} ${jcJi ? '| 建除忌: ' + jcJi : ''}</div>` : ''}
  </div>`;

  // 时辰
  html += `<div class="jiuri-detail-card">
    <h4>⏰ 十二时辰吉凶</h4>
    <div class="jiuri-hours-grid">
      ${['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'].map((s,i) => {
        const fate = hourFates[i];
        const cls = fate === '吉' ? 'great' : 'ok';
        return `<div class="jiuri-hour ${cls}"><div>${s}时</div><div>${fate}</div></div>`;
      }).join('')}
    </div>
    <div style="font-size:11px;opacity:.4;margin-top:10px;text-align:center">注：以上时辰吉凶为参考，具体择时需结合八字</div>
  </div>`;

  // 五行
  const stemEle = J_ELE[stem];
  const branchEle = J_ZHI_ELE[branch];
  html += `<div class="jiuri-detail-card">
    <h4>🔮 五行分析</h4>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">
      <div><div style="font-size:10px;opacity:.4">天干</div><div style="font-size:20px;font-family:'Ma Shan Zheng',serif;color:var(--gold)">${stem}</div><div style="font-size:11px;opacity:.5">${stemEle}性</div></div>
      <div><div style="font-size:10px;opacity:.4">地支</div><div style="font-size:20px;font-family:'Ma Shan Zheng',serif;color:var(--gold)">${branch}</div><div style="font-size:11px;opacity:.5">${branchEle}性</div></div>
      <div><div style="font-size:10px;opacity:.4">纳音</div><div style="font-size:11px;opacity:.6">${ganzhi}剑锋</div></div>
    </div>
  </div>`;

  detail.innerHTML = html;
}

function jiuriSuggest() {
  const purpose = document.getElementById('jiuriPurpose')?.value;
  const result = document.getElementById('jiuriSuggestResult');
  if (!purpose) { showToast('请先选择事项类型'); return; }
  if (!result) return;

  // 搜索最近30天内最佳日期
  const candidates = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const gz = getDayGz(d);
    const yijiIdx = (Math.round((d - new Date(2025,0,1)) / 86400000) % 60 + 60) % 60;
    const yiji = YIJI_DB[yijiIdx] || {yi:'',ji:''};
    const yiText = yiji.yi || '';
    const jiText = yiji.ji || '';

    // 判断是否适合该事项
    const purposeMap = {
      '祭祀': { match: ['祭祀','祈福','祭祀祈福'], bad: ['动土','安葬'] },
      '出行': { match: ['出行','移徙','出行移徙'], bad: ['安葬'] },
      '婚嫁': { match: ['嫁娶','婚嫁','纳采','订盟'], bad: ['动土','安葬'] },
      '动土': { match: ['动土','开市','立券'], bad: ['嫁娶','安葬'] },
      '开业': { match: ['开市','交易','立券','纳财'], bad: ['安葬'] },
      '搬家': { match: ['移徙','入宅','开市'], bad: ['动土','安葬'] },
      '订盟': { match: ['订盟','纳采','嫁娶'], bad: ['动土','安葬'] },
      '安葬': { match: ['安葬','祭祀','行丧'], bad: ['嫁娶','开市','动土'] },
      '求财': { match: ['纳财','交易','开市','立券'], bad: ['安葬'] },
      '问名': { match: ['嫁娶','纳采','订盟','祭祀'], bad: ['动土','安葬'] }
    };
    const pm = purposeMap[purpose] || {match: [], bad: []};
    const matchScore = pm.match.some(m => yiText.includes(m)) ? 20 : 0;
    const badScore = pm.bad.some(b => jiText.includes(b)) ? -15 : 0;
    const baseScore = calcJiuriScore(gz.stemIdx, gz.branchIdx, d);
    const totalScore = baseScore + matchScore + badScore;

    candidates.push({
      date: new Date(d),
      gz: gz.ganzhi,
      score: totalScore,
      yi: yiText,
      ji: jiText
    });
  }

  // 取前5名
  candidates.sort((a,b) => b.score - a.score);
  const top5 = candidates.slice(0,5);

  let html = '<div class="jiuri-suggest-grid">';
  top5.forEach((c,i) => {
    const d = c.date;
    const dateStr = d.getFullYear()+'年'+(d.getMonth()+1)+'月'+d.getDate()+'日';
    const weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
    const reason = purposeMap[purpose]?.match?.some(m => c.yi.includes(m)) ? '宜' + purpose : '综合吉';
    html += `<div class="jiuri-suggest-card">
      <div class="sg-rank">第${i+1}推荐</div>
      <div class="sg-date">${dateStr}</div>
      <div class="sg-gz">${c.gz}日 · ${weekDays[d.getDay()]}</div>
      <div style="margin-top:8px">
        <span class="jiuri-badge ${c.score>=75?'great':c.score>=60?'good':'ok'}">评分 ${c.score}</span>
      </div>
      <div class="sg-reason">${reason} | 宜:${c.yi.split(/[\s、]/).slice(0,3).join('、')}</div>
    </div>`;
  });
  html += '</div>';
  result.innerHTML = html;
}

// 修正XIUBANGS常量名
const XIU_BANGS_CN = XIU_BANGS;

// 初始化吉日查询（延迟加载）
window._jiuriInitDone = false;
const jiuriOrigShowSection = window.showSection;
window.showSection = function(name) {
  jiuriOrigShowSection && jiuriOrigShowSection(name);
  if (name === 'jiuri' && !window._jiuriInitDone) {
    window._jiuriInitDone = true;
    setTimeout(jiuriInit, 100);
  }
};

// ===== 强制全局暴露所有导航函数（兼容微信浏览器）=====
try { window.showZhanbuSub = showZhanbuSub; } catch(e) {}
try { window.showXingmingSub = showXingmingSub; } catch(e) {}
try { window.showFengshuiSub = showFengshuiSub; } catch(e) {}
// showJiuriCal 不存在，跳过
try { window.showZodiacDetail = showZodiacDetail; } catch(e) {}
try { window.jiuriInit = jiuriInit; } catch(e) {}
try { window.showSection = showSection; } catch(e) {}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(jiuriInit, 500);
} else {
  window.addEventListener('load', function() { setTimeout(jiuriInit, 500); });
}

