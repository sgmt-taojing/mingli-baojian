// bazi-liunian.js
// R629 Phase 2: 从 divination-core.js 拆分
// 用法：<script src="js/divination-core.js" defer></script>
//        <script src="js/bazi-liunian.js" defer></script>
(function(global){
// ================================================================
//  A. 流年逐月运势详解
// ================================================================

function getLiuYueGZ(yearStemIdx) {
  // 五虎遁:甲己丙寅,乙庚戊寅,丙辛庚寅,丁壬壬寅,戊癸甲寅
  const ytgBase = {0:'丙',4:'丙',1:'戊',6:'戊',2:'庚',7:'庚',3:'壬',8:'壬',9:'甲',5:'甲'};
  const base = ytgBase[yearStemIdx] || '丙';
  const baseIdx = STEMS.indexOf(base);
  return BRANCHES.map((bz, i) => ({
    zhi: bz,
    gan: STEMS[(baseIdx + i) % 10],
    zhiEle: ZHI_ELE[bz],
    ganEle: ELE[STEMS[(baseIdx) % 10]]
  }));
}

function renderLiuYueModule(params) {
  const { pillars, dayStem, dayStemIdx, dayBranchIdx, year, month, day, xiEle, jiEle, weakestEle, currentYear, currentMonth } = params;
  const liuNianStemIdx = STEMS.indexOf(pillars[0].stem);
  const liuYueData = getLiuYueGZ(liuNianStemIdx);

  // 公历月份与农历月份对照(近似)
  const monthNames = ['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'];
  const solarMonthStart = [2,3,4,5,6,7,8,9,10,11,12,1]; // 正月≈2月
  const grid = document.getElementById('liuYueGrid');
  if (!grid) return;
  grid.innerHTML = '';

  liuYueData.forEach((m, i) => {
    const solarM = solarMonthStart[i];
    const isCurrent = (solarM === currentMonth);
    const tenGod = TENGAN[dayStem];
    let tgFound = '';
    for (const [k, v] of Object.entries(tenGod)) {
      if (v === m.gan) { tgFound = TEGAN_NAMES[k]; break; }
    }

    // 五行旺衰:月令地支对应五行旺相
    const monthPower = {寅:'旺',卯:'旺',巳:'相',午:'相',申:'休',酉:'休',亥:'死',子:'死',辰:'库',戌:'库',丑:'库',未:'库'};
    const mp = monthPower[m.zhi] || '平';
    // 日主与月干关系
    const dayGanEle = ELE[dayStem];
    const muKe = {木:{金:'克',火:'泄',水:'生',木:'助',土:'耗'},
                  火:{木:'生',土:'克',金:'泄',火:'助',水:'耗'},
                  土:{火:'生',金:'泄',木:'克',土:'助',水:'耗'},
                  金:{土:'生',火:'泄',木:'克',金:'助',水:'耗'},
                  水:{金:'生',木:'泄',火:'克',水:'助',土:'耗'}};
    const rel = muKe[dayGanEle]?.[m.ganEle] || '';

    // 运势提示
    const wealthDir = m.ganEle === '土' ? '正财稳定' : m.ganEle === '火' ? '偏财机会' : '理财保守';
    const careerHint = m.ganEle === xiEle ? '贵人相助' : m.ganEle === weakestEle ? '小人有因' : '平稳推进';
    const loveHint = ['寅','卯'].includes(m.zhi) ? '桃花方位东方' : ['申','酉'].includes(m.zhi) ? '感情需注意' : '感情稳定';
    const healthHint = ['巳','午'].includes(m.zhi) ? '注意心血管' : ['亥','子'].includes(m.zhi) ? '注意肾脏泌尿' : '无明显问题';
    const luckyColor = {木:'青绿',火:'红紫',土:'黄褐',金:'白金银',水:'蓝黑'}[m.ganEle] || '金色';
    const luckyDir = {寅:'东北',卯:'正东',辰:'东南',巳:'东南',午:'正南',未:'西南',申:'西南',酉:'正西',戌:'西北',亥:'西北',子:'正北',丑:'东北'}[m.zhi] || '东方';
    const luckyNum = {寅:3,卯:4,辰:5,巳:6,午:7,未:8,申:9,酉:10,戌:11,亥:12,子:1,丑:2}[i+1] || 5;

    // ===== 每月风险点与化解 =====
    // 判断该月是否冲克日主或用神
    const zhiChong = {子:'午',丑:'未',寅:'申',卯:'酉',辰:'戌',巳:'亥',午:'子',未:'丑',申:'寅',酉:'卯',戌:'辰',亥:'巳'};
    const zhiHai = {子:'未',丑:'午',寅:'巳',卯:'辰',辰:'卯',巳:'寅',午:'丑',未:'子',申:'亥',酉:'戌',戌:'酉',亥:'申'};
    const chongDay = zhiChong[m.zhi] === BRANCHES[dayBranchIdx]; // 月支冲日支
    const haiDay = zhiHai[m.zhi] === BRANCHES[dayBranchIdx]; // 月支害日支
    const harmXiEle = (m.ganEle === jiEle) || (m.zhiEle === jiEle); // 月干支五行克喜用神
    const helpXiEle = (m.ganEle === xiEle) || (m.zhiEle === xiEle); // 月干支五行助喜用神

    // 风险等级
    let riskLevel = '平';
    let riskText = '';
    if (chongDay) { riskLevel = '凶'; riskText = '月支冲日支，变动大，防口舌是非'; }
    else if (haiDay) { riskLevel = '小凶'; riskText = '月支害日支，小人暗箭，需谨慎'; }
    else if (harmXiEle) { riskLevel = '小凶'; riskText = '月令克喜用神，诸事不顺，宜守不宜攻'; }
    else if (helpXiEle) { riskLevel = '吉'; riskText = '月令助喜用神，贵人运旺，可积极进取'; }
    else { riskText = '运势平稳，按部就班即可'; }

    // 针对性化解方法
    let huajieAdvice = '';
    if (chongDay || haiDay) {
      huajieAdvice = `此月需化解${chongDay?'冲':'害'}煞。建议：①佩戴${xiEle}属性水晶${xiEle==='木'?'绿幽灵':xiEle==='火'?'红玛瑙':xiEle==='土'?'黄玉':xiEle==='金'?'白水晶':'黑曜石'}；②多往${luckyDir}方向活动；③避免在此月做重大决策或签约；④家中${luckyDir}位摆放${xiEle==='木'?'绿植':xiEle==='火'?'红色装饰':xiEle==='土'?'陶瓷':xiEle==='金'?'金属摆件':'鱼缸'}化解。`;
    } else if (harmXiEle) {
      huajieAdvice = `此月五行与喜用神相悖。建议：①多穿${xiEle==='木'?'青绿':xiEle==='火'?'红紫':xiEle==='土'?'黄褐':xiEle==='金'?'白金':'蓝黑'}色衣物；②饮食多摄入${xiEle==='木'?'绿叶蔬菜':xiEle==='火'?'红枣枸杞':xiEle==='土'?'小米山药':xiEle==='金'?'白萝卜梨':'黑豆海带'}；③佩戴${xiEle}属性开运物；④此月宜静不宜动，多读书学习。`;
    } else if (helpXiEle) {
      huajieAdvice = `此月喜用神得力，运势上扬。建议：①把握机会积极进取，适合开展新项目；②多与贵人来往，拓展人脉；③在此月做重要决策或签约；④可佩戴${xiEle}属性饰品增强运势。`;
    } else {
      huajieAdvice = `此月运势平稳。建议：①保持规律作息，适度运动；②多穿${luckyColor}色系衣物；③可在${luckyDir}方位活动或办公；④日常佩戴开运小物件。`;
    }

    // 吉凶日提示（每月农历初一、十五、节气日为吉日）
    const jiriList = ['初一','十五','节气日'];
    const xiongriHint = chongDay || haiDay ? '此月逢冲害，初五、十四、廿三慎出行' : '无明显凶日';

    const card = document.createElement('div');
    card.className = 'liu-yue-card' + (isCurrent ? ' current-month' : '') + (riskLevel === '吉' ? ' luck-month' : riskLevel === '凶' || riskLevel === '小凶' ? ' risk-month' : '');
    card.innerHTML = `
      <div class="lyc-header">
        <div class="lyc-month-name">${monthNames[i]}</div>
        <div class="lyc-gz">${m.gan}${m.zhi}</div>
        <div class="lyc-risk ${riskLevel === '吉' ? 'risk-ji' : riskLevel === '凶' || riskLevel === '小凶' ? 'risk-xiong' : ''}">${riskLevel}</div>
      </div>
      <div class="lyc-row"><span class="lyc-label">公历</span><span class="lyc-value">${solarM}月</span></div>
      <div class="lyc-row"><span class="lyc-label">月令</span><span class="lyc-value">${m.zhiEle}气 ${mp}</span></div>
      <div class="lyc-row"><span class="lyc-label">十神</span><span class="lyc-value" class="rpt-is-1">${tgFound || '-'}</span></div>
      <div class="lyc-row"><span class="lyc-label">与日主</span><span class="lyc-value">${rel}</span></div>
      <div class="lyc-row"><span class="lyc-label">财运</span><span class="lyc-value">${wealthDir}</span></div>
      <div class="lyc-row"><span class="lyc-label">事业</span><span class="lyc-value">${careerHint}</span></div>
      <div class="lyc-row"><span class="lyc-label">感情</span><span class="lyc-value">${loveHint}</span></div>
      <div class="lyc-row"><span class="lyc-label">健康</span><span class="lyc-value">${healthHint}</span></div>
      <div class="lyc-risk-box">
        <div class="lyc-risk-title">⚠️ 风险提示</div>
        <div class="lyc-risk-text">${riskText}</div>
      </div>
      <div class="lyc-huajie-box">
        <div class="lyc-huajie-title">🛡️ 化解之法</div>
        <div class="lyc-huajie-text">${huajieAdvice}</div>
      </div>
      <div class="lyc-jiri-box">
        <div class="lyc-jiri-title">📅 吉凶日</div>
        <div class="lyc-jiri-text"><span class="rpt-is-12">吉日:</span>${jiriList.join('、')} | <span class="rpt-is-3">凶日:</span>${xiongriHint}</div>
      </div>
      <div class="lyc-kaiyun">
        <div class="lyc-kaiyun-title">开运</div>
        <span style="color:var(--cyan);font-size:11px">色:</span>${luckyColor}
        <span style="color:var(--cyan);font-size:11px">方:</span>${luckyDir}
        <span style="color:var(--cyan);font-size:11px">数:</span>${luckyNum}
      </div>
    `;
    grid.appendChild(card);
  });

  // Update module title
  const title = document.getElementById('liuYueTitle');
  if (title) title.textContent = `📅 ${currentYear}年流年逐月运势详解(${pillars[0].stem}${pillars[0].branch}年)`;
}

})(typeof window !== "undefined" ? window : globalThis);
