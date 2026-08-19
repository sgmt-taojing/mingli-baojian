// bazi-renderer.js
// R629 Phase 4: 八字 V2 渲染器（从 divination-core.js 拆分）
// 包含：流年逐月 / 流年总览 / 化解方案 / 人生阶段解读 / 开运指南
// 用法：<script src="js/divination-core.js" defer></script>
//        <script src="js/bazi-renderer.js" defer></script>
(function(global){
// ================================================================
//  NEW BAZI MODULES RENDERER
// ================================================================

// ═══ 精确排盘（调用 Python 引擎）═══
async function computeBaziHeige() {
  let btn = document.getElementById('baziHeigeBtn');
  if(btn){ btn.disabled=true; btn.textContent='排盘中...'; }
  playDivinationSound();
  let name = document.getElementById('baziName').value || '有缘人';
  let hourVal = document.getElementById('baziHour').value;
  let sex = document.getElementById('baziSex').value;
  let calMode = document.querySelector('input[name="calendarMode"]:checked')?.value || 'solar';
  let year, month, day;
  if (calMode === 'lunar') {
    let ly = parseInt(document.getElementById('lunarYear').value);
    let lm = parseInt(document.getElementById('lunarMonth').value);
    let ld = parseInt(document.getElementById('lunarDay').value);
    let isLeap = document.getElementById('lunarLeapMonth').checked;
    if (!ly || !lm || !ld) { showToast('请输入完整的农历出生日期'); if(btn){btn.disabled=false;btn.textContent='🔬 精确排盘（Python引擎）';} return; }
    let solar = lunarToSolar(ly, lm, ld, isLeap);
    if (!solar) { showToast('农历日期无效'); if(btn){btn.disabled=false;btn.textContent='🔬 精确排盘（Python引擎）';} return; }
    year = solar.year; month = solar.month; day = solar.day;
  } else {
    let dateStr = document.getElementById('baziDate').value;
    if (!dateStr) { showToast('请输入出生日期'); if(btn){btn.disabled=false;btn.textContent='🔬 精确排盘（Python引擎）';} return; }
    let parts = dateStr.split('-'); year = parseInt(parts[0]); month = parseInt(parts[1]); day = parseInt(parts[2]);
  }
  let hour = hourVal ? parseInt(hourVal) : 12;
  let lngInput = document.getElementById('baziLng') ? document.getElementById('baziLng').value : '';
  let lng = lngInput ? parseFloat(lngInput) : null;
  let params = { year: year, month: month, day: day, hour: hour, minute: 0, sex: sex };
  if (calMode === 'lunar') params.lunar = true;
  if (lng && !isNaN(lng)) params.lng = lng;
  document.getElementById('loadingOverlay').classList.add('visible');
  try {
    let result = await PaipanEngine.paipan(params);
    if (result.error) {
      showToast(result.error);
      // 降级到JS引擎
      computeBazi();
      return;
    }
    // 渲染方法论框架
    let resultDiv = document.getElementById('baziResult');
    if (resultDiv) {
      let html = '<div class="result-banner"><h2 class="rb-name">' + name + '</h2>';
      html += '<p class="rb-meta">' + (result.input && result.input.solar || '') + ' ' + (result.input && result.input.gender || '') + '</p></div>';
      html += PaipanEngine.renderFramework(result);
      // 调候趋避
      let dayGan = result.day_master ? result.day_master.charAt(0) : '';
      let monthZhi = result.pillars && result.pillars.month ? result.pillars.month.charAt(1) : '';
      if (dayGan && monthZhi) {
        let th = PaipanEngine.getTiaohou(dayGan, monthZhi);
        if (th) {
          html += '<div style="background:rgba(46,204,113,0.05);border-left:3px solid var(--jade);padding:10px 14px;margin:8px 0;border-radius:0 6px 6px 0">';
          html += '<div style="font-size:12px;color:var(--jade)"><b>调候用神：</b>' + th + '</div></div>';
        }
      }
      resultDiv.innerHTML = html;
      resultDiv.style.display = 'block';
      resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  } catch(e) {
    showToast('排盘异常: ' + e.message);
    computeBazi();
  } finally {
    document.getElementById('loadingOverlay').classList.remove('visible');
    if(btn){btn.disabled=false;btn.textContent='🔬 精确排盘（Python引擎）';}
  }
}

function renderNewBaziModules(data) {
  const { pillars, dayStem, dayBranch, dayStemIdx, dayBranchIdx, year, month, day, hour, sex, name, calMode } = data;

  // 五行统计
  const eleCount = {木:0,火:0,土:0,金:0,水:0};
  for (const p of pillars) {
    eleCount[ELE[p.stem]]++;
    eleCount[ZHI_ELE[p.branch]]++;
  }
  const total = Object.values(eleCount).reduce((a,b)=>a+b,0);
  const sorted = Object.entries(eleCount).sort((a,b)=>a[1]-b[1]);
  const weakestEle = sorted[0][0];
  const strongestEle = sorted[4][0];

  // 喜用神
  const xiMap = {木:'水',火:'木',土:'火',金:'土',水:'金'};
  const jiMap = {木:'金',火:'水',土:'木',金:'火',水:'土'};
  const xiEle = xiMap[weakestEle] || '水';
  const jiEle = jiMap[dayStem in ELE ? ELE[dayStem] : weakestEle] || '金';

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // === A. 流年逐月运势 ===
  if (shouldRenderModule('dayun')) {
    renderLiuYueModule({ pillars, dayStem, dayStemIdx, dayBranchIdx, year, month, day, xiEle, jiEle, weakestEle, currentYear, currentMonth });
  }

  // === B. 2025-2030 流年总览 ===
  if (shouldRenderModule('dayun')) {
    renderLiuNianOverview({ dayStemIdx, xiEle, weakestEle, currentYear, birthYear: year });
  }

  // === C. 全方位化解方案 ===
  if (shouldRenderModule('huajie')) {
    renderHuajieFull({ pillars, dayStem, dayBranch, dayStemIdx, xiEle, jiEle, weakestEle, strongestEle, eleCount, total });
  }

  // === D. 人生阶段 ===
  if (shouldRenderModule('overview')) {
    renderLifeStage({ pillars, dayStem, dayStemIdx, xiEle, weakestEle });
  }

  // === E. 开运指南 ===
  if (shouldRenderModule('cuiwang')) {
    renderKaiyunGuide({ dayStem, xiEle, weakestEle });
  }

  // === F. 用神/忌神白话解释 ===
  if (shouldRenderModule('geju')) {
    renderXiJiExplain({ dayStem, dayBranch, xiEle, jiEle, weakestEle, strongestEle, eleCount });
  }

  // === G. 经典出处 ===
  if (shouldRenderModule('overview')) {
    renderClassicRef({ dayStem, dayBranch, xiEle, jiEle, pillars });
  }

  // === H. 保存八字数据到localStorage（供导出报告使用 + 缘主信息持久化） ===
  const missing = Object.entries(eleCount).filter(([k,v])=>v===0).map(([k])=>k);
  // 计算生肖
  const zodiacMap = {子:'鼠',丑:'牛',寅:'虎',卯:'兔',辰:'龙',巳:'蛇',午:'马',未:'羊',申:'猴',酉:'鸡',戌:'狗',亥:'猪'};
  let yearBranchStr = pillars[0] ? pillars[0].branch : '';
  let zodiac = zodiacMap[yearBranchStr] || '';
  // 计算命卦
  let mingGua = getMingGua(parseInt(year), sex);
  let lifeType = mingGua ? mingGua.type : '';
  // 获取历法模式（复用已有 calMode 变量）
  let _calMode = (typeof calMode !== 'undefined') ? calMode : (document.querySelector('input[name="calendarMode"]:checked')?.value || 'solar');
  // 获取出生城市/现居城市
  let birthCity = data.birthplace || (document.getElementById('baziBirthplace') ? document.getElementById('baziBirthplace').value.trim() : '') || '';
  let residenceCity = data.residence || (document.getElementById('baziResidence') ? document.getElementById('baziResidence').value.trim() : '') || '';

  localStorage.setItem('userBazi', JSON.stringify({
    name: name,
    year: year,
    month: month,
    day: day,
    hour: hour,
    sex: sex,
    birthCity: birthCity,
    residenceCity: residenceCity,
    calendarMode: _calMode,
    dayStem: dayStem,
    dayBranch: dayBranch,
    dayStemIdx: dayStemIdx,
    dayBranchIdx: dayBranchIdx,
    xiEle: xiEle,
    jiEle: jiEle,
    weakestEle: weakestEle,
    strongestEle: strongestEle,
    missingEles: missing,
    eleCount: eleCount,
    pillars: pillars,
    zodiac: zodiac,
    lifeType: lifeType,
    mingGua: mingGua,
    timestamp: Date.now()
  }));

  // === H2. 自动填充各排盘工具 ===
  autoFillUserBazi('bazi');
  autoFillUserBazi('qimen');
  autoFillUserBazi('ziwei');
  autoFillUserBazi('liuren');
  autoFillUserBazi('meihua');
  autoFillUserBazi('yangzhai');
  autoFillUserBazi('zeri');
  autoFillUserBazi('rename');
  autoFillUserBazi('company');
  autoFillUserBazi('mobile');
  autoFillUserBazi('cezi');
  autoFillUserBazi('xingming');
  autoFillUserBazi('lifeindex');

  // === H3. 更新信众中心缘主信息卡片 ===
  if (typeof renderUserBaziCard === 'function') renderUserBaziCard();

  // === I. 检查是否会员，显示年度提醒 ===
  const member = safeGetJSON('memberInfo', {});
  if (member.level && member.level !== 'free') {
    const noticeEl = document.getElementById('memberAnnualNotice');
    const contentEl = document.getElementById('annualNoticeContent');
    if (noticeEl && contentEl) {
      const nextYear = new Date().getFullYear() + 1;
      contentEl.innerHTML = generateAnnualNoticeHTML(nextYear, { dayStem, dayBranch, xiEle, jiEle, weakestEle, missingEles: missing }, sex);
      noticeEl.style.display = 'block';
    }
  }
}

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

// ================================================================
//  B. 2025-2030 流年总览
// ================================================================

function renderLiuNianOverview(params) {
  const { dayStemIdx, xiEle, weakestEle, currentYear, birthYear } = params;
  const list = document.getElementById('liuNianList');
  if (!list) return;

  // 使用 getLiunian 函数获取流年数据
  let liunianData = getLiunian(currentYear - 3, 1, 1, 7, dayStemIdx); // 当前年前后3年，可验证过去预测未来
  list.innerHTML = '';

  liunianData.forEach(function(ln) {
    let yr = ln.year;
    let yrStem = ln.stem;
    let yrZhi = ln.zhi;
    let yrEle = ln.ganEle;
    let yrZhiEle = ln.zhiEle;

    // 与日主关系
    let muKeMap = {木:{金:'克',火:'泄',水:'生',木:'助',土:'耗'},火:{木:'生',土:'克',金:'泄',火:'助',水:'耗'},土:{火:'生',金:'泄',木:'克',土:'助',水:'耗'},金:{土:'生',火:'泄',木:'克',金:'助',水:'耗'},水:{金:'生',木:'泄',火:'克',水:'助',土:'耗'}};
    let dayGanEle = ELE[STEMS[dayStemIdx]];
    let rel = (muKeMap[dayGanEle] && muKeMap[dayGanEle][yrEle]) || '';
    let isCurrent = ln.isCurrent;
    let xiGood = yrEle === xiEle || yrZhiEle === xiEle;
    let xiBad = yrEle === weakestEle;
    let grade = '平', gradeClass = 'ping';
    if (xiGood && !xiBad) { grade = '吉'; gradeClass = 'ji'; }
    if (xiBad) { grade = '小凶'; gradeClass = 'xiaoxiong'; }
    if (isCurrent) { grade = '今年'; gradeClass = 'ping'; }

    let row = document.createElement('div');
    row.className = 'liu-nian-row' + (isCurrent ? ' is-current' : '');
    row.innerHTML = '\n      <div class="ln-year">' + yr + (ln.xusui ? ' <span class="rpt-is-53">' + ln.xusui + '岁</span>' : '') + '</div>\n      <div class="ln-gz">' + yrStem + yrZhi + '</div>\n      <div class="ln-grade ' + gradeClass + '">' + grade + '</div>\n      <div class="ln-tip">' + ln.ganShen + '·' + (ln.dishi || '') + '·' + rel + yrEle + '年</div>\n    ';
    list.appendChild(row);
  });
}

// ================================================================
//  C. 全方位化解方案
// ================================================================

function renderHuajieFull(params) {
  const { pillars, dayStem, dayBranch, dayStemIdx, xiEle, jiEle, weakestEle, strongestEle, eleCount, total } = params;
  const content = document.getElementById('huajieFullContent');
  if (!content) return;

  const dayGanEle = ELE[dayStem];
  const missing = Object.entries(eleCount).filter(([k,v])=>v===0).map(([k])=>k);

  // 五行补缺方案
  const wuxingFix = {
    木:{colors:['青','绿'],directions:['东方','东北'],foods:['菠菜','芹菜','绿茶','青苹果'],crystal:'绿幽灵/绿松石',metal:'木制家具，绿色植物'},
    火:{colors:['红','紫','橙'],directions:['南方','东南'],foods:['辣椒','红枣','枸杞','山楂'],crystal:'红宝石/红玛瑙',metal:'红色装饰，壁炉'},
    土:{colors:['黄','棕','褐'],directions:['中心','西南'],foods:['小米','土豆','南瓜','红薯'],crystal:'黄玉/虎眼石',metal:'陶瓷，黄色饰品'},
    金:{colors:['白','银','金'],directions:['西方','西北'],foods:['白萝卜','梨','银耳','百合'],crystal:'白水晶/钻石',metal:'金属饰品，白色汽车'},
    水:{colors:['蓝','黑'],directions:['北方','正北'],foods:['黑豆','海带','蓝莓','黑木耳'],crystal:'黑曜石/蓝宝石',metal:'鱼缸，水景，黑色物品'},
  };

  // 流年太岁化解
  const currentYear = new Date().getFullYear();
  const yrStemIdx = ((currentYear - 4) % 10 + 10) % 10;
  const yrZhiIdx = ((currentYear - 4) % 12 + 12) % 12;
  const yrStem = STEMS[yrStemIdx];
  const yrZhi = BRANCHES[yrZhiIdx];
  const taiSuiDesc = getTaiSuiDesc(yrZhi, dayBranch, yrStem, dayStem);

  // 催旺喜用神
  const xiShengWays = {
    水:{desc:'水为喜用，宜多接触蓝色、黑色元素，多喝水，多去北方',items:['挂北面山水画','用鱼缸招财','多穿蓝黑色衣物','去北方旅行或发展']},
    木:{desc:'木为喜用，宜多接触绿色、青色元素，多去东方',items:['家中摆放绿色植物','多穿青绿色衣物','去东方城市发展','使用木制家具']},
    火:{desc:'火为喜用，宜多接触红色、紫色元素，多去南方',items:['红色吉祥物','多晒太阳','去南方发展','红色装饰品']},
    土:{desc:'土为喜用，宜多接触黄色、褐色元素，多去西南',items:['黄色玉石摆件','陶瓷工艺品','去西南地区发展','随身带黄玉']},
    金:{desc:'金为喜用，宜多接触白色、银色元素，多去西方',items:['白色金属饰品','银饰随身带','去西方发展','白色车辆或家居']},
  };

  // 风水调整
  const fengshuiAdvice = {
    木:{deskDir:'面向东方，座位背后有靠山，忌正对窗户',home:'东方放绿植，文昌位放四支毛笔',禁忌:'忌西方摆放锐利金属'},
    火:{deskDir:'面向南方，避免正对镜子，座位靠墙',home:'南方放红色地毯或灯具，忌正门对窗',禁忌:'忌北方水气过重'},
    土:{deskDir:'面向西南或东北，座位稳重，靠山有力',home:'四角放黄色水晶球，忌东方空旷',禁忌:'忌南方过于燥热'},
    金:{deskDir:'面向西方，座位背后有实墙，不坐横梁下',home:'西方放金属装饰，书房放白水晶球',禁忌:'忌南方火气过旺'},
    水:{deskDir:'面向北方，背后靠实墙，忌背后有窗',home:'北方放鱼缸或水景，忌正对门路',禁忌:'忌西方摆放白虎位锐物'},
  };

  // 养生建议
  const healthAdvice = {
    木:{time:'23:00-01:00(子时)宜入睡,01:00-03:00(丑时)肝脏排毒',food:'宜多食绿叶蔬菜、酸味食物(乌梅、山楂),少吃辛辣',avoid:'忌熬夜伤肝，忌大怒伤肝'},
    火:{time:'11:00-13:00(午时)宜小憩养心,21:00-23:00(亥时)宜静养',food:'宜多食红枣、红豆、苦瓜，少吃油腻',avoid:'忌过度兴奋，忌暴饮暴食'},
    土:{time:'09:00-11:00(巳时)脾胃活跃，宜早餐,19:00-21:00(戌时)宜散步',food:'宜多食小米、南瓜、山药，少吃生冷',avoid:'忌思虑过度伤脾，忌饮食不规律'},
    金:{time:'03:00-05:00(寅时)肺经当令，寅时宜深睡,15:00-17:00(申时)宜运动',food:'宜多食白萝卜、梨、银耳、百合',avoid:'忌悲伤过度，忌抽烟伤肺'},
    水:{time:'17:00-19:00(酉时)肾经活跃，宜清淡饮食,05:00-07:00(卯时)宜排便',food:'宜多食黑豆、黑木耳、海带，少盐',avoid:'忌纵欲过度伤肾，忌熬夜'},
  };

  // 姓名调整
  const nameAdvice = {
    木:{use:'宜用五行属木、水的字，如:林、森、涛、泽、梅、兰、荣、华',avoid:'忌用五行属火的字，如:炎、灿、明、晶'},
    火:{use:'宜用五行属火、土的字，如:炎、炜、灿、坤、培、墨、岚',avoid:'忌用五行属水的字，如:冰、泉、泽、江'},
    土:{use:'宜用五行属土、火的字，如:培、墨、炜、焱、坤、垣、均',avoid:'忌用五行属木的字，如:林、森、桐、松'},
    金:{use:'宜用五行属金、土的字，如:锋、铭、钧、鑫、坤、培、轩',avoid:'忌用五行属火的字，如:炎、炜、灿、丹'},
    水:{use:'宜用五行属水、金的字，如:泽、江、涵、润、锋、钧、铭',avoid:'忌用五行属土的字，如:培、墨、垣、均'},
  };

  let html = '';

  // C1. 五行补缺
  if (shouldRenderModule('huajie')) {
  if (missing.length > 0) {
    html += `<div class="hfc-section"><h5>🌿 五行补缺方案(缺${missing.join('、')})</h5>`;
    missing.forEach(m => {
      const fix = wuxingFix[m] || {};
      html += `<div class="hfc-row">
        <span class="hfc-tag tag-${m}">${m}属性</span>
        <span>颜色:${fix.colors?.join('、') || '-'}</span>
        <span>方位:${fix.directions?.join('、') || '-'}</span>
        <span>食物:${fix.foods?.slice(0,3).join('、') || '-'}</span>
      </div>`;
      html += `<div class="hfc-row">
        <span>水晶:${fix.crystal || '-'}</span>
        <span>日常:${fix.metal || '-'}</span>
      </div>`;
    });
    html += `</div>`;
  } else {
    html += `<div class="hfc-section"><h5>🌿 五行状态</h5>
      <div class="hfc-row"><span>五行齐全，无明显缺失。最强:<b class="rpt-is-1">${strongestEle}</b>,最弱:<b style="color:var(--cinn)">${weakestEle}</b>,喜用神:<b class="rpt-is-4">${xiEle}</b></span></div>
    </div>`;
  }
  }

  // C2. 流年太岁化解
  if (shouldRenderModule('huajie')) {
  html += `<div class="hfc-section"><h5>📅 流年太岁化解(${currentYear}年 ${yrStem}${yrZhi})</h5>
    <div class="hfc-row">${taiSuiDesc}</div>
    <div class="hfc-row">
      <span class="hfc-tag tag-default">太岁方位</span>
      <span>${yrZhi}位(${fengshuiDir[yrZhi] || '中宫'})宜静不宜动</span>
    </div>
    <div class="hfc-row">
      <span class="hfc-tag tag-default">化解方法</span>
      <span>${taiSuiFix[yrZhi] || '安太岁牌位，佩戴太岁符，保持低调'}</span>
    </div>
  </div>`;
  }

  // C3. 催旺喜用神
  if (shouldRenderModule('cuiwang')) {
  const xsw = xiShengWays[xiEle] || xiShengWays['水'];
  html += `<div class="hfc-section"><h5>⭐ 催旺喜用神(喜${xiEle})</h5>
    <div class="hfc-row">${xsw.desc}</div>
    <div class="hfc-grid-2">
      ${xsw.items.map(item => `<div class="hfc-item"><div class="hfc-item-title">建议</div><div class="hfc-item-value">${item}</div></div>`).join('')}
    </div>
  </div>`;
  }

  // C4. 风水调整
  if (shouldRenderModule('huajie')) {
  const feng = fengshuiAdvice[dayGanEle] || fengshuiAdvice['土'];
  html += `<div class="hfc-section"><h5>🏠 办公/居家风水调整(日主${dayStem}·${dayGanEle})</h5>
    <div class="hfc-grid-2">
      <div class="hfc-item"><div class="hfc-item-title">办公桌朝向</div><div class="hfc-item-value">${feng.deskDir}</div></div>
      <div class="hfc-item"><div class="hfc-item-title">居家摆设</div><div class="hfc-item-value">${feng.home}</div></div>
      <div class="hfc-item"><div class="hfc-item-title">禁忌注意</div><div class="hfc-item-value">${feng.禁忌}</div></div>
    </div>
  </div>`;
  }

  // C5. 养生建议
  if (shouldRenderModule('health')) {
  const health = healthAdvice[weakestEle] || healthAdvice['土'];
  html += `<div class="hfc-section"><h5>🍵 每日养生建议(${weakestEle}弱宜补)</h5>
    <div class="hfc-row"><span class="hfc-tag tag-default">最佳时辰</span><span>${health.time}</span></div>
    <div class="hfc-row"><span class="hfc-tag tag-${weakestEle}">宜食</span><span>${health.food}</span></div>
    <div class="hfc-row"><span class="hfc-tag tag-default">禁忌</span><span>${health.avoid}</span></div>
  </div>`;
  }

  // C6. 姓名调整
  if (shouldRenderModule('huajie')) {
  const nmAdvice = nameAdvice[xiEle] || nameAdvice['土'];
  html += `<div class="hfc-section"><h5>✍️ 姓名调整建议</h5>
    <div class="hfc-row"><span class="hfc-tag tag-${xiEle}">宜用</span><span>${nmAdvice.use}</span></div>
    <div class="hfc-row"><span class="hfc-tag tag-default">忌用</span><span>${nmAdvice.avoid}</span></div>
  </div>`;
  }

  // ═══ 三元九运化解 ═══
  if (shouldRenderModule('sanyuan')) {
  try {
    let _syHj = _generateSanyuanJiuyunBlock('huajie', {
      dayStem: hj.dayStem || '甲',
      dayEle: ELE[hj.dayStem] || '木',
      xiEle: hj.xiEle || '木',
      currentYear: hj.currentYear || new Date().getFullYear()
    });
    html += _syHj;
  } catch(e) { console.warn('[三元九运化解块失败]', e.message); }
  }

  content.innerHTML = html;
}

function getTaiSuiDesc(yrZhi, dayBranch, yrStem, dayStem) {
  const clash = {
    '午':{zhi:'子',desc:'午子相冲，流年多变动，忌冒险'},'未':{zhi:'丑',desc:'未丑相冲，事业易有变动'},'申':{zhi:'寅',desc:'申寅相冲，出行注意安全'},
    '酉':{zhi:'卯',desc:'酉卯相冲，财运有阻碍'},'戌':{zhi:'辰',desc:'戌辰相冲，人际关系需注意'},
    '亥':{zhi:'巳',desc:'亥巳相冲，思维活跃但易疲劳'},'子':{zhi:'午',desc:'子午相冲，注意心血管健康'},
    '丑':{zhi:'未',desc:'丑未相冲，注意脾胃健康'},'寅':{zhi:'申',desc:'寅申相冲，出行注意安全'},
    '卯':{zhi:'酉',desc:'卯酉相冲，财运反复'},'辰':{zhi:'戌',desc:'辰戌相冲，注意口舌是非'},
    '巳':{zhi:'亥',desc:'巳亥相冲，注意肾脏泌尿系统'},
  };
  if (clash[yrZhi]) return `<span class="hfc-tag tag-default">${clash[yrZhi].desc}</span>`;
  return '<span class="hfc-tag tag-default">无明显冲克，流年平稳</span>';
}

const fengshuiDir = {子:'正北',丑:'东北',寅:'东北',卯:'正东',辰:'东南',巳:'东南',午:'正南',未:'西南',申:'西南',酉:'正西',戌:'西北',亥:'西北'};
const taiSuiFix = {午:'多静少动，卧室不放红色，多去北方化解',
  子:'多晒太阳，忌熬夜，宜南方活动',
  丑:'低调行事，忌强出头',
  寅:'多去西方，忌东方冒险',
  卯:'理财保守，忌高风险投资',
  辰:'保持谦逊，忌与人争执',
  巳:'多去北方，忌冲动决策',
  午:'卧室不放锐利物品，多去东方',
  未:'脾胃保健，忌饮食不规律',
  申:'注意出行安全，忌出远门',
  酉:'感情需多沟通，忌误解',
  戌:'广结善缘，忌树敌',
  亥:'多去南方，忌北方冒险',
};

})(typeof window !== "undefined" ? window : globalThis);
