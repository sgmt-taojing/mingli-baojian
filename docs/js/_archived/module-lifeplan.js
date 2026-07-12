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
  var extraHtml = '';
  var st = getSolarTerm(date);
  var stInfo = st.name ? (SOLAR_TERM_INFO[st.name] || null) : null;
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
        <span style="font-family:Ma Shan Zheng,serif;font-size:28px;color:var(--gold);letter-spacing:4px">${ganzhi}日</span>
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
      <div><div style="font-size:10px;opacity:.4">天干</div><div style="font-size:20px;font-family:Ma Shan Zheng,serif;color:var(--gold)">${stem}</div><div style="font-size:11px;opacity:.5">${stemEle}性</div></div>
      <div><div style="font-size:10px;opacity:.4">地支</div><div style="font-size:20px;font-family:Ma Shan Zheng,serif;color:var(--gold)">${branch}</div><div style="font-size:11px;opacity:.5">${branchEle}性</div></div>
      <div><div style="font-size:10px;opacity:.4">纳音</div><div style="font-size:11px;opacity:.6">${ganzhi}剑锋</div></div>
    </div>
  </div>`;


  // --- 每日生活智慧 ---
  var wisdom = getDailyWisdom(date, stemIdx);
  extraHtml += '<div class="jiuri-detail-card"><h4>💡 每日生活智慧</h4>';
  extraHtml += '<div style="margin-top:12px;padding:14px 16px;background:rgba(52,152,219,.06);border-radius:8px;border-left:3px solid #3498db;line-height:1.8">';
  extraHtml += '<div style="font-size:13px">' + wisdom + '</div></div>';
  extraHtml += '<div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap">';
  var wtTags = ['起居养生','饮食调理','运动锻炼','情志管理','经络保健'];
  for (var wi = 0; wi < wtTags.length; wi++) {
    extraHtml += '<span style="font-size:11px;padding:3px 10px;background:rgba(52,152,219,.1);border-radius:20px;opacity:.6">' + wtTags[wi] + '</span>';
  }
  extraHtml += '</div></div>';

  // --- 节气民俗模块 ---
  if (st.name) {
    var stBadge = st.isTermDay ? '<span class="jiuri-badge great" style="font-size:10px;margin-left:8px">今日节气</span>' : '<span style="font-size:10px;opacity:.4;margin-left:8px">当前：' + st.name + '</span>';
    extraHtml += '<div class="jiuri-detail-card"><h4>🌿 二十四节气 · ' + st.name + stBadge + '</h4>';
    extraHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-top:12px">';
    if (stInfo) {
      extraHtml += '<div><div style="font-size:10px;opacity:.4;margin-bottom:4px">时令美食</div><div style="font-size:12px">' + stInfo.food + '</div></div>';
      extraHtml += '<div><div style="font-size:10px;opacity:.4;margin-bottom:4px">民俗禁忌</div><div style="font-size:12px;color:#e74c3c">' + stInfo.taboo + '</div></div>';
      extraHtml += '<div><div style="font-size:10px;opacity:.4;margin-bottom:4px">养生要点</div><div style="font-size:12px">' + stInfo.health + '</div></div>';
    }
    extraHtml += '</div>';
    extraHtml += '<div style="margin-top:12px;padding:10px 14px;background:rgba(201,168,76,.06);border-radius:8px;border-left:3px solid var(--gold)">';
    extraHtml += '<div style="font-size:11px;opacity:.5;margin-bottom:4px">节气谚语</div>';
    extraHtml += '<div style="font-size:13px;font-family:\'Ma Shan Zheng\',serif;letter-spacing:1px">' + (stInfo ? stInfo.wisdom : '天道循环，寒暑交替') + '</div></div>';
    if (st.isTermDay) {
      extraHtml += '<div style="margin-top:10px;padding:10px 14px;background:rgba(46,204,113,.08);border-radius:8px;border-left:3px solid #2ecc71">';
      extraHtml += '<div style="font-size:11px;color:#2ecc71">🎉 今日是 <strong>' + st.name + '</strong> 节气！</div>';
      extraHtml += '<div style="font-size:12px;opacity:.8;margin-top:4px">节气交替日气场变化大，宜静心养神，避免大喜大悲，饮食起居需格外注意。</div></div>';
    }
    extraHtml += '</div>';
  }

  html += extraHtml;
  detail.innerHTML = html;
}

function jiuriSuggest() {
  const purpose = document.getElementById('jiuriPurpose')?.value;
  const result = document.getElementById('jiuriSuggestResult');
  if (!purpose) { showToast('请先选择事项类型'); return; }
  if (!result) return;

  // 搜索最近60天内最佳日期
  const candidates = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const gz = getDayGz(d);
    const Y = d.getFullYear(), M = d.getMonth()+1, D = d.getDate();
    var yearGZ = getYearGanZhi(Y, M, D);
    var monthGZ = getMonthGanZhi(Y, M, D);
    var dayGZ = getDayGanZhi(Y, M, D);
    
    // 建除
    var jcName = getJianChu(monthGZ.zhi, dayGZ.zhi);
    // 吉神
    var jsList = calcJishen(yearGZ, monthGZ, dayGZ);
    // 凶神
    var xsList = calcXiongshen(yearGZ, monthGZ, dayGZ);
    // 值神
    var zs = getZhishen(dayGZ.gan, dayGZ.zhi);
    var zsHuangdao = ZHISHEN_TYPE[zs];
    
    // 事项配置
    var eventMap = {
      '嫁娶': {good:['天德','月德','三合','六合','天喜'], bad:['月破','月厌','劫煞','灾煞'], jianchu:['成','开','定']},
      '搬家': {good:['天德','月德','天恩','母仓'], bad:['月破','月煞','四击'], jianchu:['开','成','满']},
      '开业': {good:['天恩','月恩','母仓','圣心','益后'], bad:['月破','月厌','劫煞'], jianchu:['开','满','成']},
      '动土': {good:['天恩','月恩','母仓'], bad:['月破','月刑','月煞','劫煞','灾煞'], jianchu:['建','除','满']},
      '安葬': {good:['天德','月德','天恩','母仓'], bad:['月破','月厌','四击','往亡'], jianchu:['闭','收','除']},
      '出行': {good:['天恩','驿马','三合'], bad:['月破','月刑','往亡'], jianchu:['开','建','除']},
      '求职': {good:['天恩','月恩','圣心'], bad:['月破','天吏'], jianchu:['建','成','开']},
      '祈福': {good:['天德','月德','天恩','母仓','圣心'], bad:['月破','月厌'], jianchu:['开','定','满']},
      '祭祀': {good:['天恩','月德','天德'], bad:['月破'], jianchu:['开','定','满','建']},
      '订盟': {good:['天德','月德','三合','六合','天喜'], bad:['月破','月厌'], jianchu:['定','成']},
      '求财': {good:['天恩','母仓','益后','续世'], bad:['月破','劫煞','灾煞'], jianchu:['开','满','成']},
      '问名': {good:['天德','月德','六合','天喜'], bad:['月破','月厌'], jianchu:['定','成','开']}
    };
    var evt = eventMap[purpose] || {good:[], bad:[], jianchu:[]};
    
    // 宜忌
    var yiList = JIAN_CHU_YI[jcName] || ['祭祀'];
    var jiList = JIAN_CHU_JI[jcName] || ['诸事不宜'];
    var yiText = yiList.join(' ');
    var jiText = jiList.join(' ');
    
    // 评分
    var baseScore = calcJiuriScore(gz.stemIdx, gz.branchIdx, d);
    // 事项匹配加分
    var matchScore = 0;
    if (evt.jianchu && evt.jianchu.indexOf(jcName) !== -1) matchScore += 20;
    if (evt.good) {
      for (var j = 0; j < evt.good.length; j++) {
        if (jsList.indexOf(evt.good[j]) !== -1) matchScore += 8;
      }
    }
    if (evt.bad) {
      for (var j = 0; j < evt.bad.length; j++) {
        if (xsList.indexOf(evt.bad[j]) !== -1) matchScore -= 12;
      }
    }
    var totalScore = baseScore + matchScore;
    
    // 专业分析
    var reasonParts = [];
    if (evt.jianchu && evt.jianchu.indexOf(jcName) !== -1) reasonParts.push('建除' + jcName + '日宜' + purpose);
    var matchedGood = evt.good ? jsList.filter(function(g){return evt.good.indexOf(g) !== -1;}) : [];
    if (matchedGood.length > 0) reasonParts.push('吉神' + matchedGood.join('、') + '助');
    var matchedBad = evt.bad ? xsList.filter(function(b){return evt.bad.indexOf(b) !== -1;}) : [];
    if (matchedBad.length > 0) reasonParts.push('凶神' + matchedBad.join('、') + '不利');
    if (zsHuangdao) reasonParts.push('黄道' + zs);
    else reasonParts.push('黑道' + zs);
    var reason = reasonParts.join('，') || '综合吉日';
    
    candidates.push({
      date: new Date(d),
      gz: gz.ganzhi,
      score: totalScore,
      yi: yiText,
      ji: jiText,
      reason: reason,
      jianchu: jcName,
      zhishen: zs + '(' + (zsHuangdao ? '黄道' : '黑道') + ')',
      jishen: jsList.join('、'),
      xiongshen: xsList.join('、'),
      chongsha: '冲' + (CHONGSHA_DETAIL[DI_ZHI[dayGZ.zhi]] || {}).chong + ' 煞' + (CHONGSHA_DETAIL[DI_ZHI[dayGZ.zhi]] || {}).sha
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
    html += `<div class="jiuri-suggest-card">
      <div class="sg-rank">第${i+1}推荐</div>
      <div class="sg-date">${dateStr}</div>
      <div class="sg-gz">${c.gz}日 · ${weekDays[d.getDay()]}</div>
      <div style="margin-top:8px">
        <span class="jiuri-badge ${c.score>=75?'great':c.score>=60?'good':'ok'}">评分 ${c.score}</span>
      </div>
      <div class="sg-reason">${c.reason}</div>
      <div style="margin-top:6px;font-size:11px;opacity:.6">建除:${c.jianchu} | ${c.zhishen}</div>
      <div style="margin-top:4px;font-size:11px;opacity:.5">${c.chongsha}</div>
      ${c.jishen ? '<div style="margin-top:4px;font-size:11px;color:#2ecc71;opacity:.7">吉神:' + c.jishen + '</div>' : ''}
      ${c.xiongshen ? '<div style="margin-top:2px;font-size:11px;color:#e74c3c;opacity:.7">凶神:' + c.xiongshen + '</div>' : ''}
      <div style="margin-top:6px;font-size:11px;opacity:.5">宜:${c.yi.split(/[\s、]/).slice(0,3).join('、')}</div>
    </div>`;
  });
  html += '</div>';
  result.innerHTML = html;
}

// 修正XIUBANGS常量名
const XIU_BANGS_CN = XIU_BANGS;

// 初始化吉日查询（延迟加载）
window._jiuriInitDone = false;
// jiuri 初始化已整合到 showSection 函数内部，不再覆盖 window.showSection

// ================================================================
// ===== 八字精准择日模型 (PRECISION_ZERI) =====
// 基于缘主生辰八字+职业+住址的7层推演择日系统
// 参考典籍：《协纪辨方书》《择吉汇要》《崇正辟谬永吉通书》
// ================================================================

// --- 20种事项完整配置 ---
var PRECISION_EVENT_CONFIG = {
  '祭祀': {
    jianchu: ['开','定','满','建'], good: ['天德','月德','天恩'], bad: ['月破'],
    careerBonus: {},
    jieqi: [], jieqiBonus: '祭祀宜在朔望日（农历初一/十五），春分秋分尤佳',
    desc: '祭祀祈福'
  },
  '出行': {
    jianchu: ['开','建','除'], good: ['天恩','驿马','三合'], bad: ['月破','月刑','往亡'],
    careerBonus: {'运输': 3},
    jieqi: ['立春','雨水','惊蛰'], jieqiBonus: '立春后出行大利四方',
    desc: '出行远行'
  },
  '婚嫁': {
    jianchu: ['定','成','开'], good: ['天德','月德','三合','六合','天喜'], bad: ['月破','月厌','劫煞','灾煞'],
    careerBonus: {},
    jieqi: ['立春','春分','秋分'], jieqiBonus: '立春后为婚嫁旺季',
    desc: '婚嫁订婚',
    specialtyGods: {good: ['天喜','红鸾','六合','三合','月德','天德'], bonus: 5}
  },
  '开业': {
    jianchu: ['开','满','成'], good: ['天恩','月恩','母仓','圣心','益后'], bad: ['月破','月厌','劫煞'],
    careerBonus: {'经商': 3, '餐饮': 2, '自由职业': 2},
    jieqi: ['立春','惊蛰','清明'], jieqiBonus: '春三月开业大利，万物生长',
    desc: '开业开张',
    specialtyGods: {good: ['天恩','母仓','圣心','益后','续世'], bonus: 4}
  },
  '动土': {
    jianchu: ['建','除','满'], good: ['天恩','月恩','母仓'], bad: ['月破','月刑','月煞','劫煞','灾煞'],
    careerBonus: {'建筑': 3},
    jieqi: ['立春','雨水','惊蛰'], jieqiBonus: '立春后宜动土，土气上升',
    desc: '动土装修'
  },
  '搬家': {
    jianchu: ['开','成','满'], good: ['天德','月德','天恩','母仓'], bad: ['月破','月煞','四击'],
    careerBonus: {},
    jieqi: ['立春','秋分'], jieqiBonus: '立春后搬家万象更新',
    desc: '搬家入宅'
  },
  '订盟': {
    jianchu: ['定','成'], good: ['天德','月德','三合','六合','天喜'], bad: ['月破','月厌'],
    careerBonus: {},
    jieqi: ['立春','春分'], jieqiBonus: '春季订盟大吉',
    desc: '订盟纳采',
    specialtyGods: {good: ['天喜','红鸾','三合','六合'], bonus: 4}
  },
  '安葬': {
    jianchu: ['闭','收','除'], good: ['天德','月德','天恩','母仓'], bad: ['月破','月厌','四击','往亡'],
    careerBonus: {},
    jieqi: ['清明','冬至'], jieqiBonus: '清明冬至前后宜安葬祭祀',
    desc: '安葬祭祀'
  },
  '祈福': {
    jianchu: ['开','定','满'], good: ['天德','月德','天恩','母仓','圣心'], bad: ['月破','月厌'],
    careerBonus: {},
    jieqi: [], jieqiBonus: '初一十五祈福最佳',
    desc: '祈福许愿'
  },
  '求财': {
    jianchu: ['开','满','成'], good: ['天恩','母仓','益后','续世'], bad: ['月破','劫煞','灾煞'],
    careerBonus: {'经商': 3, '自由职业': 2},
    jieqi: ['立春','惊蛰','清明'], jieqiBonus: '春季木旺生火，利求财',
    desc: '求财投资'
  },
  '问名': {
    jianchu: ['定','成','开'], good: ['天德','月德','六合','天喜'], bad: ['月破','月厌'],
    careerBonus: {},
    jieqi: ['立春','春分'], jieqiBonus: '春季万物生发，宜求子',
    desc: '问名求子',
    specialtyGods: {good: ['天喜','六合','三合'], bonus: 4}
  },
  '求职面试': {
    jianchu: ['建','成','开'], good: ['天恩','月恩','圣心','益后'], bad: ['月破','天吏','月刑'],
    careerBonus: {'文职': 2, '技术': 2, '医疗': 2},
    jieqi: ['立春','惊蛰','清明'], jieqiBonus: '春季生机勃勃，利求职',
    desc: '求职面试'
  },
  '签合同': {
    jianchu: ['成','开','定'], good: ['天德','月德','圣心','益后'], bad: ['月破','月厌','劫煞'],
    careerBonus: {'经商': 3, '法律': 3, '自由职业': 2},
    jieqi: ['立春','春分'], jieqiBonus: '春季签约，生机无限',
    desc: '签约合同'
  },
  '考试': {
    jianchu: ['开','建','成'], good: ['天恩','月恩','圣心','驿马'], bad: ['月破','天吏','月刑'],
    careerBonus: {'文职': 3, '教育': 3, '技术': 2},
    jieqi: ['立春','惊蛰','春分'], jieqiBonus: '春季万物生发，文昌当令',
    desc: '考试应试',
    specialtyGods: {good: ['圣心','天恩','月恩','驿马'], bonus: 4}
  },
  '手术': {
    jianchu: ['除','平','定'], good: ['天恩','月恩'], bad: ['月破','劫煞','灾煞','死神'],
    careerBonus: {'医疗': 2},
    jieqi: [], jieqiBonus: '避免节气交替日手术',
    desc: '手术医疗'
  },
  '装修': {
    jianchu: ['建','除','满','成'], good: ['天恩','月恩','母仓'], bad: ['月破','月刑','月煞','劫煞'],
    careerBonus: {'建筑': 3},
    jieqi: ['立春','雨水','惊蛰'], jieqiBonus: '立春后宜装修，木旺生发',
    desc: '室内装修（已建房屋内部装潢，区别于动土破土）'
  },
  '买车': {
    jianchu: ['开','建','成'], good: ['驿马','三合','天恩'], bad: ['月破','劫煞','灾煞'],
    careerBonus: {'运输': 3},
    jieqi: ['立春','雨水'], jieqiBonus: '立春后宜出行购车',
    desc: '购置车辆'
  },
  '诉讼': {
    jianchu: ['执','建','成'], good: ['天恩','月恩'], bad: ['月破','月刑','天吏','月厌'],
    careerBonus: {'法律': 3},
    jieqi: [], jieqiBonus: '避免节气日诉讼，气场不稳',
    desc: '诉讼官司'
  },
  '远行': {
    jianchu: ['开','建','除'], good: ['驿马','三合','天恩'], bad: ['月破','往亡','月刑','劫煞'],
    careerBonus: {'运输': 3, '自由职业': 2},
    jieqi: ['立春','惊蛰'], jieqiBonus: '春季宜远行，万象更新',
    desc: '远行出行'
  },
  '开仓': {
    jianchu: ['满','开','成'], good: ['天恩','母仓'], bad: ['月破','劫煞'],
    careerBonus: {'经商': 2, '餐饮': 2},
    jieqi: [], jieqiBonus: '',
    desc: '开仓出货'
  }
};

// --- 职业五行属性 ---
var CAREER_WUXING = {
  '经商': '金', '文职': '木', '技术': '水', '医疗': '木',
  '教育': '木', '法律': '金', '建筑': '土', '餐饮': '火',
  '运输': '水', '艺术': '火', '公务员': '土', '自由职业': '综合'
};

// --- 职业专属吉神 ---
var CAREER_JISHEN = {
  '经商': ['益后','续世','天恩','母仓','圣心'],
  '文职': ['圣心','驿马','天恩','月恩'],
  '技术': ['驿马','天恩','月恩'],
  '医疗': ['天德','月德','天恩'],
  '教育': ['圣心','天恩','驿马','月恩'],
  '法律': ['天恩','月恩','圣心'],
  '建筑': ['天恩','母仓','月恩'],
  '餐饮': ['母仓','天恩','续世'],
  '运输': ['驿马','三合','天恩'],
  '艺术': ['天恩','月恩','圣心'],
  '公务员': ['圣心','天恩','天德','月德'],
  '自由职业': ['驿马','天恩','益后']
};

// --- 城市方位五行推算（主要城市） ---
var CITY_DIRECTION_WUXING = {
  '北京': {direction: '北', wuxing: '水', shaConflict: '南', lng: 116.4},
  '上海': {direction: '东', wuxing: '木', shaConflict: '西', lng: 121.5},
  '广州': {direction: '南', wuxing: '火', shaConflict: '北', lng: 113.3},
  '深圳': {direction: '南', wuxing: '火', shaConflict: '北', lng: 114.1},
  '成都': {direction: '西', wuxing: '金', shaConflict: '东', lng: 104.1},
  '重庆': {direction: '西', wuxing: '金', shaConflict: '东', lng: 106.5},
  '杭州': {direction: '东', wuxing: '木', shaConflict: '西', lng: 120.2},
  '南京': {direction: '东', wuxing: '木', shaConflict: '西', lng: 118.8},
  '武汉': {direction: '中', wuxing: '土', shaConflict: '', lng: 114.3},
  '西安': {direction: '西', wuxing: '金', shaConflict: '东', lng: 108.9},
  '郑州': {direction: '中', wuxing: '土', shaConflict: '', lng: 113.6},
  '天津': {direction: '北', wuxing: '水', shaConflict: '南', lng: 117.2},
  '苏州': {direction: '东', wuxing: '木', shaConflict: '西', lng: 120.6},
  '长沙': {direction: '南', wuxing: '火', shaConflict: '北', lng: 113.0},
  '沈阳': {direction: '北', wuxing: '水', shaConflict: '南', lng: 123.4},
  '青岛': {direction: '东', wuxing: '木', shaConflict: '西', lng: 120.4},
  '大连': {direction: '北', wuxing: '水', shaConflict: '南', lng: 121.6},
  '厦门': {direction: '南', wuxing: '火', shaConflict: '北', lng: 118.1},
  '昆明': {direction: '西', wuxing: '金', shaConflict: '东', lng: 102.7},
  '哈尔滨': {direction: '北', wuxing: '水', shaConflict: '南', lng: 126.6},
  '长春': {direction: '北', wuxing: '水', shaConflict: '南', lng: 125.3},
  '济南': {direction: '东', wuxing: '木', shaConflict: '西', lng: 117.0},
  '合肥': {direction: '东', wuxing: '木', shaConflict: '西', lng: 117.3},
  '南昌': {direction: '南', wuxing: '火', shaConflict: '北', lng: 115.9},
  '福州': {direction: '南', wuxing: '火', shaConflict: '北', lng: 119.3},
  '南宁': {direction: '南', wuxing: '火', shaConflict: '北', lng: 108.4},
  '贵阳': {direction: '西', wuxing: '金', shaConflict: '东', lng: 106.7},
  '兰州': {direction: '西', wuxing: '金', shaConflict: '东', lng: 103.8},
  '太原': {direction: '北', wuxing: '水', shaConflict: '南', lng: 112.5},
  '石家庄': {direction: '北', wuxing: '水', shaConflict: '南', lng: 114.5},
  '海口': {direction: '南', wuxing: '火', shaConflict: '北', lng: 110.3},
  '呼和浩特': {direction: '北', wuxing: '水', shaConflict: '南', lng: 111.7},
  '乌鲁木齐': {direction: '西', wuxing: '金', shaConflict: '东', lng: 87.6},
  '拉萨': {direction: '西', wuxing: '金', shaConflict: '东', lng: 91.1},
  '银川': {direction: '西', wuxing: '金', shaConflict: '东', lng: 106.2},
  '西宁': {direction: '西', wuxing: '金', shaConflict: '东', lng: 101.8}
};

// 方位关键词匹配
var DIRECTION_KEYWORDS = {
  '北': ['北','蒙','黑','吉','辽'],
  '南': ['南','粤','桂','琼','湘','赣'],
  '东': ['东','沪','浙','苏','鲁','闽','皖'],
  '西': ['西','川','渝','陕','甘','宁','青','新','藏','黔','滇'],
  '中': ['中','豫','鄂','冀']
};

// --- 节气配置 ---
var JIEQI_LIST = ['小寒','大寒','立春','雨水','惊蛰','春分','清明','谷雨','立夏','小满','芒种','夏至','小暑','大暑','立秋','处暑','白露','秋分','寒露','霜降','立冬','小雪','大雪','冬至'];

// 节气对事项的影响
var JIEQI_EVENT_TIPS = {
  '动土': {good: ['立春','雨水','惊蛰','春分'], bad: ['冬至','大寒','小寒'], tip: '立春后土气上升，宜动土；冬季土冻不宜破土'},
  '装修': {good: ['立春','雨水','惊蛰','春分','清明'], bad: ['冬至','小雪','大雪'], tip: '春暖花开宜装修'},
  '安葬': {good: ['清明','冬至'], bad: ['立春','立夏','立秋','立冬'], tip: '清明冬至前后宜安葬，四立日忌安葬'},
  '婚嫁': {good: ['立春','春分','秋分'], bad: ['清明','冬至'], tip: '春秋两季为婚嫁吉月'},
  '开业': {good: ['立春','惊蛰','清明'], bad: ['小寒','大寒'], tip: '春季开业万象更新'},
  '出行': {good: ['立春','雨水','惊蛰'], bad: ['大寒','小寒'], tip: '开春出行大利'},
  '远行': {good: ['立春','惊蛰','春分'], bad: ['冬至','小寒'], tip: '春季远行最为适宜'},
  '搬家': {good: ['立春','秋分'], bad: ['冬至','大寒'], tip: '立春后搬家，万象更新'}
};

// 节气日期表（公历近似）
var JIEQI_APPROX_DATE = [
  {name:'小寒', month:1, day:6}, {name:'大寒', month:1, day:20},
  {name:'立春', month:2, day:4}, {name:'雨水', month:2, day:19},
  {name:'惊蛰', month:3, day:6}, {name:'春分', month:3, day:21},
  {name:'清明', month:4, day:5}, {name:'谷雨', month:4, day:20},
  {name:'立夏', month:5, day:6}, {name:'小满', month:5, day:21},
  {name:'芒种', month:6, day:6}, {name:'夏至', month:6, day:22},
  {name:'小暑', month:7, day:7}, {name:'大暑', month:7, day:23},
  {name:'立秋', month:8, day:8}, {name:'处暑', month:8, day:23},
  {name:'白露', month:9, day:8}, {name:'秋分', month:9, day:23},
  {name:'寒露', month:10, day:8}, {name:'霜降', month:10, day:24},
  {name:'立冬', month:11, day:7}, {name:'小雪', month:11, day:22},
  {name:'大雪', month:12, day:7}, {name:'冬至', month:12, day:22}
];

// --- 日干支五行强弱（基于地支藏干加权） ---
function _getDayWuxingStrength(dayGZ) {
  var gan = TIAN_GAN[dayGZ.gan];
  var zhi = DI_ZHI[dayGZ.zhi];
  var eleScore = {木:0,火:0,土:0,金:0,水:0};
  // 天干五行
  eleScore[ELE[gan]] += 3;
  // 地支藏干五行
  var canggan = ZHI_CANGGAN[zhi] || [];
  var weights = [2, 1, 0.5];
  for (var i = 0; i < canggan.length; i++) {
    if (canggan[i]) {
      eleScore[ELE[canggan[i]]] += (weights[i] || 0);
    }
  }
  // 找最强五行
  var strongest = '金', maxScore = 0;
  for (var k in eleScore) {
    if (eleScore[k] > maxScore) { maxScore = eleScore[k]; strongest = k; }
  }
  return {strongest: strongest, scores: eleScore, ganWuxing: ELE[gan]};
}

// --- 日支与缘主日支关系 ---
function _checkZhiRelation(bzDayZhiIdx, dayZhiIdx) {
  var relations = [];
  // 六合
  for (var i = 0; i < LIU_HE.length; i++) {
    if ((LIU_HE[i][0] === bzDayZhiIdx && LIU_HE[i][1] === dayZhiIdx) ||
        (LIU_HE[i][1] === bzDayZhiIdx && LIU_HE[i][0] === dayZhiIdx)) {
      relations.push({type: '六合', score: 8, desc: '日支相合，和谐顺遂'});
    }
  }
  // 三合
  for (var i = 0; i < SAN_HE.length; i++) {
    if (SAN_HE[i].indexOf(bzDayZhiIdx) !== -1 && SAN_HE[i].indexOf(dayZhiIdx) !== -1) {
      relations.push({type: '三合', score: 6, desc: '日支三合，贵人相助'});
    }
  }
  // 六冲
  var chongPairs = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  for (var i = 0; i < chongPairs.length; i++) {
    if ((chongPairs[i][0] === bzDayZhiIdx && chongPairs[i][1] === dayZhiIdx) ||
        (chongPairs[i][1] === bzDayZhiIdx && chongPairs[i][0] === dayZhiIdx)) {
      relations.push({type: '六冲', score: -10, desc: '日支相冲，气场相克，大忌'});
    }
  }
  // 六害
  for (var i = 0; i < ZHI_HAI_PAIRS.length; i++) {
    if ((ZHI_HAI_PAIRS[i].a === DI_ZHI[bzDayZhiIdx] && ZHI_HAI_PAIRS[i].b === DI_ZHI[dayZhiIdx]) ||
        (ZHI_HAI_PAIRS[i].b === DI_ZHI[bzDayZhiIdx] && ZHI_HAI_PAIRS[i].a === DI_ZHI[dayZhiIdx])) {
      relations.push({type: '六害', score: -6, desc: '日支相害，暗中不利'});
    }
  }
  // 三刑
  var xingSan = ['寅巳申','丑未戌'];
  for (var i = 0; i < xingSan.length; i++) {
    var set = xingSan[i].split('');
    var inBz = false, inDay = false;
    for (var j = 0; j < set.length; j++) {
      if (DI_ZHI[bzDayZhiIdx] === set[j]) inBz = true;
      if (DI_ZHI[dayZhiIdx] === set[j]) inDay = true;
    }
    if (inBz && inDay) {
      relations.push({type: '三刑', score: -8, desc: '日支犯刑，是非纠葛'});
    }
  }
  return relations;
}

// --- 当前节气判定 ---
function _getCurrentJieqi(date) {
  var m = date.getMonth() + 1;
  var d = date.getDate();
  for (var i = JIEQI_APPROX_DATE.length - 1; i >= 0; i--) {
    var jq = JIEQI_APPROX_DATE[i];
    if (m > jq.month || (m === jq.month && d >= jq.day)) {
      return {name: jq.name, daysFrom: 0};
    }
  }
  // 如果在一月小寒之前
  return {name: JIEQI_APPROX_DATE[JIEQI_APPROX_DATE.length - 1].name, daysFrom: 0};
}

// --- 计算距离最近节气的天数 ---
function _daysFromJieqi(date, jieqiName) {
  var m = date.getMonth() + 1;
  var d = date.getDate();
  for (var i = 0; i < JIEQI_APPROX_DATE.length; i++) {
    if (JIEQI_APPROX_DATE[i].name === jieqiName) {
      var jqM = JIEQI_APPROX_DATE[i].month;
      var jqD = JIEQI_APPROX_DATE[i].day;
      var jqDate = new Date(date.getFullYear(), jqM - 1, jqD);
      return Math.floor((date - jqDate) / 86400000);
    }
  }
  return 0;
}

// --- 方位推算（从城市名） ---
function _getCityDirection(cityName) {
  if (!cityName) return null;
  // 精确匹配
  for (var c in CITY_DIRECTION_WUXING) {
    if (cityName.indexOf(c) === 0) return CITY_DIRECTION_WUXING[c];
  }
  // 关键词匹配
  for (var d in DIRECTION_KEYWORDS) {
    var keywords = DIRECTION_KEYWORDS[d];
    for (var k = 0; k < keywords.length; k++) {
      if (cityName.indexOf(keywords[k]) >= 0) {
        return {direction: d, wuxing: d === '北' ? '水' : d === '南' ? '火' : d === '东' ? '木' : d === '西' ? '金' : '土', shaConflict: d === '北' ? '南' : d === '南' ? '北' : d === '东' ? '西' : d === '西' ? '东' : ''};
      }
    }
  }
  return null;
}

// --- 五行生克关系字符串 ---
function _wuxingRelationFam(ele1, ele2) {
  // ele1 对 ele2 的关系
  if (ele1 === ele2) return '相同';
  var sheng = {木:'火',火:'土',土:'金',金:'水',水:'木'};
  var ke = {木:'土',土:'水',水:'火',火:'金',金:'木'};
  if (sheng[ele1] === ele2) return '生';
  if (sheng[ele2] === ele1) return '被生';
  if (ke[ele1] === ele2) return '克';
  if (ke[ele2] === ele1) return '被克';
  return '无直接关系';
}

// --- 从八字数据提取用神详情 ---
function _extractYongShen(baziData) {
  var mingType = baziData.mingType || {};
  var dayStem = baziData.dayStem;
  var dayEle = baziData.dayWuxing;
  var isStrong = baziData.isStrong;
  
  // 喜用神
  var xiEle = baziData.xiEle;
  var yongshen = mingType.yongshen || '';
  var yongshenEle = mingType.yongshenEle || xiEle;
  
  // 忌神五行（克用神者或生忌神者）
  var keXiEle = null;
  var wuxingKe = {木:'金',火:'水',土:'木',金:'火',水:'土'};
  var wuxingShengXi = null;
  var wuxingSheng = {木:'水',火:'木',土:'火',金:'土',水:'金'};
  keXiEle = wuxingKe[yongshenEle] || wuxingKe[xiEle] || '';
  wuxingShengXi = wuxingSheng[yongshenEle] || wuxingSheng[xiEle] || '';
  
  return {
    dayStem: dayStem,
    dayEle: dayEle,
    isStrong: isStrong,
    xiEle: xiEle,
    yongshen: yongshen,
    yongshenEle: yongshenEle,
    jiEle: keXiEle || '火',
    shengXiEle: wuxingShengXi || '水',
    strengthLevel: mingType.strengthLevel || (isStrong ? '偏强' : '偏弱'),
    stemIdx: baziData.dayStemIdx,
    branchIdx: baziData.dayBranchIdx
  };
}

// --- 字节气偏好评分 ---
function _scoreJieqi(date, eventConfig) {
  var curJq = _getCurrentJieqi(date);
  var daysFrom = _daysFromJieqi(date, curJq.name);
  var score = 3; // 基础分
  var detail = '';
  
  if (eventConfig.jieqi && eventConfig.jieqi.length > 0) {
    var found = false;
    for (var i = 0; i < eventConfig.jieqi.length; i++) {
      if (curJq.name === eventConfig.jieqi[i]) {
        score = 5;
        detail = '正值' + curJq.name + '前后，' + (eventConfig.jieqiBonus || '节气当令');
        found = true;
        break;
      }
    }
    if (!found) {
      // 在吉节气之后30天内
      for (var i = 0; i < eventConfig.jieqi.length; i++) {
        var jqDays = _daysFromJieqi(date, eventConfig.jieqi[i]);
        if (jqDays >= 0 && jqDays <= 30) {
          score = 4;
          detail = eventConfig.jieqi[i] + '后' + jqDays + '天，' + (eventConfig.jieqiBonus || '节气余气');
          found = true;
          break;
        }
      }
    }
    if (!found) {
      detail = curJq.name + '后' + daysFrom + '天';
    }
  } else {
    detail = curJq.name + '后' + daysFrom + '天';
  }
  
  // 节气交替日减分
  if (daysFrom <= 1) {
    score = Math.max(0, score - 1);
    detail += '（节气交替日，气场不稳）';
  }
  
  return {score: score, detail: detail, curJq: curJq};
}

// --- 职业匹配评分 ---
function _scoreCareer(dayGZ, career, baziYongShen) {
  if (!career) return {score: 10, detail: '未选职业'};
  
  var careerEle = CAREER_WUXING[career];
  if (!careerEle || careerEle === '综合') {
    return {score: 12, detail: '自由职业，五行综合考量'};
  }
  
  var dayWuxing = _getDayWuxingStrength(dayGZ);
  var score = 10; // 基础分
  var detailParts = [];
  
  // 日干五行与职业五行的关系
  var rel = _wuxingRelation(dayWuxing.ganWuxing, careerEle);
  detailParts.push(career + '属' + careerEle);
  
  if (rel === '生') {
    score += 3;
    detailParts.push('日生职业五行（付出有回报）');
  } else if (rel === '被生') {
    score += 4;
    detailParts.push('职业五行生日（职业助运）');
  } else if (rel === '相同') {
    score += 2;
    detailParts.push('五行相同（中规中矩）');
  } else if (rel === '克') {
    score -= 2;
    detailParts.push('日克职业五行（劳心费力）');
  } else if (rel === '被克') {
    score -= 1;
    detailParts.push('职业五行克日（压力较大）');
  }
  
  // 职业专属吉神匹配在第4层处理，这里只做五行基础分
  score = Math.min(15, Math.max(5, score));
  
  return {score: score, detail: detailParts.join('，'), careerEle: careerEle};
}

// ================================================================
// precisionZeRi - 核心精准择日函数
// ================================================================
function precisionZeRi(userInfo, purpose) {
  var result = {
    userInfo: userInfo,
    purpose: purpose,
    candidates: [],
    avoidDates: [],
    report: null
  };
  
  // === 获取八字数据 ===
  var bDate = userInfo.birthDate ? new Date(userInfo.birthDate + 'T12:00:00') : new Date(1990, 0, 1);
  var birthYear = bDate.getFullYear();
  var birthMonth = bDate.getMonth() + 1;
  var birthDay = bDate.getDate();
  var birthHour = parseInt(userInfo.birthHour) || 0;
  var birthSex = userInfo.sex || 'male';
  
  var baziData = {};
  try {
    baziData = getBaziCalcData(birthYear, birthMonth, birthDay, birthHour, birthSex);
  } catch(e) {
    baziData = {dayStem: '甲', dayBranch: '子', dayStemIdx: 0, dayBranchIdx: 0, dayWuxing: '木', xiEle: '水', isStrong: false, mingType: {strengthLevel: '偏弱', yongshenEle: '水', yongshen: ''}};
  }
  
  var ys = _extractYongShen(baziData);
  
  // === 事项配置 ===
  var eventConfig = PRECISION_EVENT_CONFIG[purpose] || {
    jianchu: ['开','成','满'], good: ['天恩','月恩'], bad: ['月破'],
    jieqi: [], jieqiBonus: '', desc: purpose
  };
  
  // === 搜索范围：支持向前向后选日 ===
  var searchStart, searchEnd;
  if (userInfo.startDate) {
    searchStart = new Date(userInfo.startDate + 'T12:00:00');
  } else {
    searchStart = new Date();
  }
  searchStart.setHours(12, 0, 0, 0);
  if (userInfo.endDate) {
    searchEnd = new Date(userInfo.endDate + 'T12:00:00');
  } else {
    searchEnd = new Date(searchStart);
    searchEnd.setDate(searchEnd.getDate() + 60);
  }
  searchEnd.setHours(12, 0, 0, 0);
  var totalDays = Math.round((searchEnd - searchStart) / 86400000);
  if (totalDays < 1) totalDays = 60;
  if (totalDays > 365) totalDays = 365;

  for (var i = 0; i < totalDays; i++) {
    var d = new Date(searchStart);
    d.setDate(d.getDate() + i);
    d.setHours(12, 0, 0, 0);
    
    var Y = d.getFullYear(), M = d.getMonth() + 1, D = d.getDate();
    var yearGZ = getYearGanZhi(Y, M, D);
    var monthGZ = getMonthGanZhi(Y, M, D);
    var dayGZ = getDayGanZhi(Y, M, D);
    
    // === 基础数据 ===
    var jcName = getJianChu(monthGZ.zhi, dayGZ.zhi);
    var jsList = calcJishen(yearGZ, monthGZ, dayGZ);
    var xsList = calcXiongshen(yearGZ, monthGZ, dayGZ);
    var zs = getZhishen(dayGZ.gan, dayGZ.zhi);
    var zsHuangdao = ZHISHEN_TYPE[zs];
    
    // ===== 7层评分 =====
    var scores = {};
    var details = {};
    
    // -- 第1层：日干支与日主关系（30分） --
    var dayWxStrength = _getDayWuxingStrength(dayGZ);
    var dayGanEle = dayWxStrength.ganWuxing;
    var s1Score = 20; // 基础分
    var s1Detail = [];
    
    // 日干是否生/克日主
    var rel = _wuxingRelation(ys.dayEle, dayGanEle);
    if (rel === '被生') {
      s1Score += 8;
      s1Detail.push('日干' + dayGanEle + '生日主' + ys.dayEle + '（吉）');
    } else if (rel === '生') {
      s1Score -= 3;
      s1Detail.push('日主生日干（泄气）');
    } else if (rel === '被克') {
      s1Score -= 5;
      s1Detail.push('日干克日主（忌）');
    } else if (rel === '相同') {
      if (ys.isStrong) {
        s1Score -= 2;
        s1Detail.push('日干与日主相同，身强不喜比劫');
      } else {
        s1Score += 3;
        s1Detail.push('日干与日主相同，比劫帮身');
      }
    }
    
    // 日干是否喜用神
    if (dayGanEle === ys.yongshenEle || dayGanEle === ys.xiEle) {
      s1Score += 5;
      s1Detail.push('日干为喜用神' + dayGanEle);
    } else if (dayGanEle === ys.jiEle) {
      s1Score -= 4;
      s1Detail.push('日干为忌神' + dayGanEle);
    }
    
    // 日支关系
    var zhiRelations = _checkZhiRelation(ys.branchIdx, dayGZ.zhi);
    var zhiScore = 0;
    for (var z = 0; z < zhiRelations.length; z++) {
      zhiScore += zhiRelations[z].score;
      s1Detail.push('日支' + zhiRelations[z].type + '：' + zhiRelations[z].desc);
    }
    s1Score += Math.max(-6, Math.min(6, zhiScore));
    
    s1Score = Math.max(5, Math.min(30, s1Score));
    scores.l1 = s1Score;
    details.l1 = '日主' + ys.dayEle + (ys.isStrong ? '偏强' : '偏弱') + '，喜' + ys.xiEle + '，忌' + ys.jiEle + '。' + TIAN_GAN[dayGZ.gan] + DI_ZHI[dayGZ.zhi] + '日，' + s1Detail.join('；');
    
    // -- 第2层：建除十二神与事项匹配（20分） --
    var s2Score = 10;
    var s2Detail = '';
    if (eventConfig.jianchu && eventConfig.jianchu.indexOf(jcName) !== -1) {
      s2Score = 20;
      s2Detail = '建除「' + jcName + '」日，宜' + purpose;
    } else {
      var yiList = JIAN_CHU_YI[jcName] || ['祭祀'];
      var matchYi = false;
      for (var yi = 0; yi < yiList.length; yi++) {
        if (yiList[yi].indexOf(purpose) >= 0 || purpose.indexOf(yiList[yi]) >= 0) {
          matchYi = true; break;
        }
      }
      if (matchYi) {
        s2Score = 15;
        s2Detail = '建除「' + jcName + '」日，宜表中含' + purpose + '项';
      } else {
        s2Score = 8;
        s2Detail = '建除「' + jcName + '」日，非' + purpose + '首选';
      }
    }
    scores.l2 = s2Score;
    details.l2 = s2Detail;
    
    // -- 第3层：吉神凶神综合评分（20分） --
    var s3Score = 10;
    var s3Good = [];
    var s3Bad = [];
    
    if (eventConfig.good) {
      for (var g = 0; g < eventConfig.good.length; g++) {
        if (jsList.indexOf(eventConfig.good[g]) !== -1) {
          s3Good.push(eventConfig.good[g]);
        }
      }
    }
    if (eventConfig.bad) {
      for (var b = 0; b < eventConfig.bad.length; b++) {
        if (xsList.indexOf(eventConfig.bad[b]) !== -1) {
          s3Bad.push(eventConfig.bad[b]);
        }
      }
    }
    // 事项专属吉神加分
    if (eventConfig.specialtyGods && eventConfig.specialtyGods.good) {
      var specCount = 0;
      for (var sg = 0; sg < eventConfig.specialtyGods.good.length; sg++) {
        if (jsList.indexOf(eventConfig.specialtyGods.good[sg]) !== -1) specCount++;
      }
      s3Score += Math.min(eventConfig.specialtyGods.bonus || 3, specCount * 2);
    }
    
    s3Score += s3Good.length * 3;
    s3Score -= s3Bad.length * 5;
    if (zsHuangdao) s3Score += 2;
    
    s3Score = Math.max(3, Math.min(20, s3Score));
    scores.l3 = s3Score;
    details.l3 = (s3Good.length > 0 ? '吉神' + s3Good.join('、') + '齐聚' : '无匹配吉神') +