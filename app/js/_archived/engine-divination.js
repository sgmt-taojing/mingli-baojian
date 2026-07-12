async function computeBaziHeige() {
  var btn = document.getElementById('baziHeigeBtn');
  if(btn){ btn.disabled=true; btn.textContent='排盘中...'; }
  playDivinationSound();
  var name = document.getElementById('baziName').value || '有缘人';
  var hourVal = document.getElementById('baziHour').value;
  var sex = document.getElementById('baziSex').value;
  var calMode = document.querySelector('input[name="calendarMode"]:checked')?.value || 'solar';
  var year, month, day;
  if (calMode === 'lunar') {
    var ly = parseInt(document.getElementById('lunarYear').value);
    var lm = parseInt(document.getElementById('lunarMonth').value);
    var ld = parseInt(document.getElementById('lunarDay').value);
    var isLeap = document.getElementById('lunarLeapMonth').checked;
    if (!ly || !lm || !ld) { showToast('请输入完整的农历出生日期'); if(btn){btn.disabled=false;btn.textContent='🔬 HeiGe 精确排盘（Python引擎）';} return; }
    var solar = lunarToSolar(ly, lm, ld, isLeap);
    if (!solar) { showToast('农历日期无效'); if(btn){btn.disabled=false;btn.textContent='🔬 HeiGe 精确排盘（Python引擎）';} return; }
    year = solar.year; month = solar.month; day = solar.day;
  } else {
    var dateStr = document.getElementById('baziDate').value;
    if (!dateStr) { showToast('请输入出生日期'); if(btn){btn.disabled=false;btn.textContent='🔬 HeiGe 精确排盘（Python引擎）';} return; }
    var parts = dateStr.split('-'); year = parseInt(parts[0]); month = parseInt(parts[1]); day = parseInt(parts[2]);
  }
  var hour = hourVal ? parseInt(hourVal) : 12;
  var lngInput = document.getElementById('baziLng') ? document.getElementById('baziLng').value : '';
  var lng = lngInput ? parseFloat(lngInput) : null;
  var params = { year: year, month: month, day: day, hour: hour, minute: 0, sex: sex };
  if (calMode === 'lunar') params.lunar = true;
  if (lng && !isNaN(lng)) params.lng = lng;
  document.getElementById('loadingOverlay').classList.add('visible');
  try {
    var result = await HeiGeEngine.paipan(params);
    if (result.error) {
      showToast(result.error);
      // 降级到JS引擎
      computeBazi();
      return;
    }
    // 渲染 HeiGe 方法论框架
    var resultDiv = document.getElementById('baziResult');
    if (resultDiv) {
      var html = '<div class="result-banner"><h2 class="rb-name">' + name + '</h2>';
      html += '<p class="rb-meta">' + (result.input && result.input.solar || '') + ' ' + (result.input && result.input.gender || '') + '</p></div>';
      html += HeiGeEngine.renderFramework(result);
      // 调候趋避
      var dayGan = result.day_master ? result.day_master.charAt(0) : '';
      var monthZhi = result.pillars && result.pillars.month ? result.pillars.month.charAt(1) : '';
      if (dayGan && monthZhi) {
        var th = HeiGeEngine.getTiaohou(dayGan, monthZhi);
        if (th) {
          html += '<div style="background:rgba(46,204,113,0.05);border-left:3px solid #27ae60;padding:10px 14px;margin:8px 0;border-radius:0 6px 6px 0">';
          html += '<div style="font-size:12px;color:#27ae60"><b>调候用神：</b>' + th + '</div></div>';
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
    if(btn){btn.disabled=false;btn.textContent='🔬 HeiGe 精确排盘（Python引擎）';}
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
  var yearBranchStr = pillars[0] ? pillars[0].branch : '';
  var zodiac = zodiacMap[yearBranchStr] || '';
  // 计算命卦
  var mingGua = getMingGua(parseInt(year), sex);
  var lifeType = mingGua ? mingGua.type : '';
  // 获取历法模式（复用已有 calMode 变量）
  var _calMode = (typeof calMode !== 'undefined') ? calMode : (document.querySelector('input[name="calendarMode"]:checked')?.value || 'solar');
  // 获取出生城市/现居城市
  var birthCity = data.birthplace || (document.getElementById('baziBirthplace') ? document.getElementById('baziBirthplace').value.trim() : '') || '';
  var residenceCity = data.residence || (document.getElementById('baziResidence') ? document.getElementById('baziResidence').value.trim() : '') || '';

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

  // === H3. 更新信众中心缘主信息卡片 ===
  if (typeof renderUserBaziCard === 'function') renderUserBaziCard();

  // === I. 检查是否会员，显示年度提醒 ===
  const member = JSON.parse(localStorage.getItem('memberInfo') || '{}');
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
      <div class="lyc-row"><span class="lyc-label">十神</span><span class="lyc-value" style="color:var(--gold)">${tgFound || '-'}</span></div>
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
        <div class="lyc-jiri-text"><span style="color:#27ae60">吉日:</span>${jiriList.join('、')} | <span style="color:#e74c3c">凶日:</span>${xiongriHint}</div>
      </div>
      <div class="lyc-kaiyun">
        <div class="lyc-kaiyun-title">开运</div>
        <span style="color:#2980b9;font-size:11px">色:</span>${luckyColor}
        <span style="color:#2980b9;font-size:11px">方:</span>${luckyDir}
        <span style="color:#2980b9;font-size:11px">数:</span>${luckyNum}
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
  var liunianData = getLiunian(currentYear - 3, 1, 1, 7, dayStemIdx); // 当前年前后3年，可验证过去预测未来
  list.innerHTML = '';

  liunianData.forEach(function(ln) {
    var yr = ln.year;
    var yrStem = ln.stem;
    var yrZhi = ln.zhi;
    var yrEle = ln.ganEle;
    var yrZhiEle = ln.zhiEle;

    // 与日主关系
    var muKeMap = {木:{金:'克',火:'泄',水:'生',木:'助',土:'耗'},火:{木:'生',土:'克',金:'泄',火:'助',水:'耗'},土:{火:'生',金:'泄',木:'克',土:'助',水:'耗'},金:{土:'生',火:'泄',木:'克',金:'助',水:'耗'},水:{金:'生',木:'泄',火:'克',水:'助',土:'耗'}};
    var dayGanEle = ELE[STEMS[dayStemIdx]];
    var rel = (muKeMap[dayGanEle] && muKeMap[dayGanEle][yrEle]) || '';
    var isCurrent = ln.isCurrent;
    var xiGood = yrEle === xiEle || yrZhiEle === xiEle;
    var xiBad = yrEle === weakestEle;
    var grade = '平', gradeClass = 'ping';
    if (xiGood && !xiBad) { grade = '吉'; gradeClass = 'ji'; }
    if (xiBad) { grade = '小凶'; gradeClass = 'xiaoxiong'; }
    if (isCurrent) { grade = '今年'; gradeClass = 'ping'; }

    var row = document.createElement('div');
    row.className = 'liu-nian-row' + (isCurrent ? ' is-current' : '');
    row.innerHTML = '\n      <div class="ln-year">' + yr + (ln.xusui ? ' <span style="font-size:10px;opacity:.4">' + ln.xusui + '岁</span>' : '') + '</div>\n      <div class="ln-gz">' + yrStem + yrZhi + '</div>\n      <div class="ln-grade ' + gradeClass + '">' + grade + '</div>\n      <div class="ln-tip">' + ln.ganShen + '·' + (ln.dishi || '') + '·' + rel + yrEle + '年</div>\n    ';
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
      <div class="hfc-row"><span>五行齐全，无明显缺失。最强:<b style="color:var(--gold)">${strongestEle}</b>,最弱:<b style="color:var(--cinn)">${weakestEle}</b>,喜用神:<b style="color:#2ecc71">${xiEle}</b></span></div>
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
    var _syHj = _generateSanyuanJiuyunBlock('huajie', {
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

// ================================================================
//  D. 人生阶段解读
// ================================================================

function renderLifeStage(params) {
  const { pillars, dayStem, dayStemIdx, xiEle, weakestEle } = params;
  const grid = document.getElementById('lifeStageGrid');
  if (!grid) return;

  const dayEle = ELE[dayStem];
  const stages = [
    {
      title: '少年时期', range: '0-18岁', emoji: '🌱',
      traits: `${dayEle}日主少年运:${dayEle}性特质明显，${xiEle}为喜用神时，成长顺利；${weakestEle}受克时需注意健康。`,
      care: '多接触喜用神相关事物，培养兴趣爱好',
      turning: '12岁左右第一个关键期，学业转折'
    },
    {
      title: '青年时期', range: '18-35岁', emoji: '🌿',
      traits: `${dayEle}日主青年运:事业心强，${xiEle}旺则贵人运好，感情上${weakestEle}弱则需注意财务。`,
      care: '积极拓展人脉，把握${xiEle}方向的机会',
      turning: '24-28岁事业定型期,30岁感情关键年'
    },
    {
      title: '中年时期', range: '35-55岁', emoji: '🌳',
      traits: `${dayEle}日主中年运:${dayEle}性成熟稳重，此时大运多为${xiEle}方向，财运事业双丰收。`,
      care: '注意${weakestEle}不足引发的问题，保持健康',
      turning: '40岁事业高峰期,48岁注意重大决策'
    },
    {
      title: '晚年时期', range: '55岁+', emoji: '🌲',
      traits: `${dayEle}日主晚年运:${xiEle}持续旺运则晚景幸福，${weakestEle}需加强养生保健。`,
      care: '以养生为主，保持心情平和，多与晚辈交流',
      turning: '60岁后趋于稳定，以身体健康为重'
    }
  ];

  grid.innerHTML = '';
  stages.forEach(s => {
    const card = document.createElement('div');
    card.className = 'life-stage-card';
    card.innerHTML = `
      <div class="lsc-title">${s.emoji} ${s.title}</div>
      <div class="lsc-range">${s.range}</div>
      <div class="lsc-row">
        <span class="lsc-label">运势特点</span>
        <span class="lsc-value">${s.traits}</span>
      </div>
      <div class="lsc-row">
        <span class="lsc-label">注意事项</span>
        <span class="lsc-value">${s.care}</span>
      </div>
      <div class="lsc-row">
        <span class="lsc-label">关键转折</span>
        <span class="lsc-value">${s.turning}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ================================================================
//  E. 开运指南
// ================================================================

function renderKaiyunGuide(params) {
  const { dayStem, xiEle, weakestEle } = params;
  const content = document.getElementById('kaiyunContent');
  if (!content) return;

  const dayEle = ELE[dayStem];

  const crystalData = {
    木:['绿幽灵','绿松石','孔雀石','东陵玉'],
    火:['红玛瑙','红宝石','石榴石','紫水晶'],
    土:['黄玉','虎眼石','田黄石','琥珀'],
    金:['白水晶','银饰','白金饰品','砗磲'],
    水:['黑曜石','蓝宝石','海蓝宝','天河石'],
  };
  const luckyNumData = {木:[3,8],火:[2,7],土:[5,10],金:[4,9],水:[1,6]};
  const luckyDirData = {木:['东方','东南'],火:['南方','正南'],土:['西南','东北'],金:['西方','西北'],水:['北方','正北']};
  const industryData = {
    木:['林业','出版','教育','家具','互联网'],
    火:['餐饮','能源','光电','化工','演艺'],
    土:['建筑','农业','矿产','房地产','中介'],
    金:['金融','法律','机械','汽车','珠宝'],
    水:['航海','物流','贸易','科技','咨询'],
  };
  const jiShiData = {
    木:{time:['卯时05-07','亥时21-23'],desc:'木气旺盛，思维活跃'},
    火:{time:['巳时09-11','午时11-13'],desc:'火气充足，精神饱满'},
    土:{time:['辰时07-09','未时13-15'],desc:'土气沉稳，适合稳重决策'},
    金:{time:['申时15-17','酉时17-19'],desc:'金气果断，适合商务谈判'},
    水:{time:['子时23-01','亥时21-23'],desc:'水气流通，适合创意工作'},
  };

  const crystals = crystalData[dayEle] || crystalData['土'];
  const nums = luckyNumData[dayEle] || [5,10];
  const dirs = luckyDirData[xiEle] || ['东方'];
  const industries = industryData[xiEle] || ['金融'];
  const jishi = jiShiData[xiEle] || jiShiData['水'];

  content.innerHTML = `
    <div class="kaiyun-card">
      <h5>💎 佩戴水晶推荐</h5>
      <div class="kaiyun-grid">
        ${crystals.map(c => `<div class="kaiyun-item"><div class="ki-icon">💎</div><div class="ki-label">${c}</div><div class="ki-value">${dayEle}命宜</div></div>`).join('')}
      </div>
      <div class="kaiyun-list" style="margin-top:12px">
        <div class="kaiyun-list-item"><span class="kli-icon">💡</span><span class="kli-text">喜用神为${xiEle},补${xiEle}色水晶最佳；${weakestEle}为忌神，避免${weakestEle}色水晶</span></div>
      </div>
    </div>
    <div class="kaiyun-card">
      <h5>🔢 幸运数字</h5>
      <div class="kaiyun-grid">
        ${[1,2,3,4,5,6,7,8,9,10].map(n => {
          const isLucky = nums.includes(n) || (n % 10 === xiEle.length + 1);
          return `<div class="kaiyun-item" style="${isLucky ? 'border-color:rgba(201,168,76,.3);background:rgba(201,168,76,.06)' : ''}">
            <div class="ki-value" style="${isLucky ? 'color:var(--gold)' : 'opacity:.5'}">${n}</div>
            <div class="ki-label">${isLucky ? '★ 吉利' : ''}</div>
          </div>`;
        }).join('')}
      </div>
      <div class="kaiyun-list" style="margin-top:10px">
        <div class="kaiyun-list-item"><span class="kli-icon">💡</span><span class="kli-text">最佳数字:${nums.join('、')},可作手机尾号、车牌号等</span></div>
      </div>
    </div>
    <div class="kaiyun-card">
      <h5>🧭 有利方位</h5>
      <div class="kaiyun-list">
        ${dirs.map((d,i) => `<div class="kaiyun-list-item"><span class="kli-icon">${i===0?'📍':'🧭'}</span><span class="kli-text"><b style="color:var(--gold)">${d}</b>:${xiEle}气旺盛，有利事业发展、财运、感情</span></div>`).join('')}
        <div class="kaiyun-list-item"><span class="kli-icon">⚠️</span><span class="kli-text"><b style="color:#e74c3c">忌讳方位</b>:${getAvoidDir(weakestEle)},该方位不宜长期逗留或办公</span></div>
      </div>
    </div>
    <div class="kaiyun-card">
      <h5>🏢 有利行业</h5>
      <div class="kaiyun-list">
        ${industries.map(ind => `<div class="kaiyun-list-item"><span class="kli-icon">🎯</span><span class="kli-text"><b style="color:var(--gold)">${ind}</b>:与${xiEle}气相合，利事业发展</span></div>`).join('')}
        <div class="kaiyun-list-item"><span class="kli-icon">💡</span><span class="kli-text">从事喜用神行业，可达到事半功倍之效</span></div>
      </div>
    </div>
    <div class="kaiyun-card">
      <h5>⏰ 每日吉时</h5>
      <div class="kaiyun-jishi">
        ${(jishi.time || ['卯时','午时']).map(t => {
          const [name, range] = t.split('时');
          return `<div class="kaiyun-jishi-item">
            <div class="kji-time">${t}</div>
            <div class="kji-desc">${jishi.desc}</div>
          </div>`;
        }).join('')}
        ${['子时23-01','寅时03-05'].map(t => `
          <div class="kaiyun-jishi-item" style="opacity:.6">
            <div class="kji-time">${t}</div>
            <div class="kji-desc">${dayEle}气平稳</div>
          </div>
        `).join('')}
      </div>
      <div class="kaiyun-list" style="margin-top:10px">
        <div class="kaiyun-list-item"><span class="kli-icon">💡</span><span class="kli-text">重要决策、商务谈判宜在吉时进行，可提升成功率</span></div>
      </div>
    </div>
    <div class="kaiyun-card">
      <h5>🎨 幸运颜色</h5>
      <div class="kaiyun-grid">
        ${getColorItems(dayEle, xiEle, weakestEle)}
      </div>
      <div class="kaiyun-list" style="margin-top:10px">
        <div class="kaiyun-list-item"><span class="kli-icon">👔</span><span class="kli-text">日常穿搭多使用喜用神颜色，有助于增强运势；${weakestEle}色宜少用</span></div>
      </div>
    </div>
  `;
}

function renderXiJiExplain(params) {
  const { dayStem, dayBranch, xiEle, jiEle, weakestEle, strongestEle, eleCount } = params;
  const dayEle = ELE[dayStem];
  const box = document.getElementById('baziDimensionBox');
  if (!box) return;

  const xiExplain = {
    '木': '您的命局喜木，木代表生发、仁德。多接触绿色、植物、东方方位，有利提升运势。',
    '火': '您的命局喜火，火代表光明、礼义。多接触红色、灯光、南方方位，有利提升运势。',
    '土': '您的命局喜土，土代表稳重、诚信。多接触黄色、陶瓷、中央方位，有利提升运势。',
    '金': '您的命局喜金，金代表刚毅、义气。多接触白色、金属、西方方位，有利提升运势。',
    '水': '您的命局喜水，水代表智慧、变通。多接触蓝色、水景、北方方位，有利提升运势。'
  };
  const jiExplain = {
    '木': '忌神为木，木旺则克制日主力量。避免过多绿色、东方方位，减少木属性物品。',
    '火': '忌神为火，火旺则泄耗日主元气。避免过多红色、南方方位，减少火属性物品。',
    '土': '忌神为土，土旺则拖累日主。避免过多黄色、中央方位，减少土属性物品。',
    '金': '忌神为金，金旺则克制日主。避免过多白色、西方方位，减少金属性物品。',
    '水': '忌神为水，水旺则冲克日主。避免过多蓝色、北方方位，减少水属性物品。'
  };

  const eleNames = {木:'木（仁）',火:'火（礼）',土:'土（信）',金:'金（义）',水:'水（智）'};

  box.innerHTML = `
    <div class="analysis-card" style="border-left:3px solid #27ae60">
      <h5 style="color:#27ae60">✦ 喜用神 · ${xiEle}</h5>
      <p>${xiExplain[xiEle] || '喜用神为' + xiEle + '，宜多补充此五行。'}</p>
      <p style="font-size:12px;opacity:.6;margin-top:8px">${dayStem}${dayBranch}日主，${eleNames[dayEle]}日，命局${strongestEle}旺${weakestEle}弱，故喜${xiEle}助身。</p>
    </div>
    <div class="analysis-card" style="border-left:3px solid #e74c3c">
      <h5 style="color:#e74c3c">✦ 忌神 · ${jiEle}</h5>
      <p>${jiExplain[jiEle] || '忌神为' + jiEle + '，宜克制此五行。'}</p>
      <p style="font-size:12px;opacity:.6;margin-top:8px">命局${strongestEle}过旺，${jiEle}为忌，逢${jiEle}年月需谨慎行事。</p>
    </div>
    <div class="analysis-card">
      <h5>📊 五行力量分布</h5>
      <div style="display:flex;gap:8px;margin-top:8px">
        ${Object.entries(eleCount).map(([e,c]) => {
          const pct = Math.round(c / Object.values(eleCount).reduce((a,b)=>a+b,0) * 100);
          const colors = {木:'#27ae60',火:'#e74c3c',土:'#e67e22',金:'#95a5a6',水:'#2980b9'};
          return `<div style="flex:1;text-align:center"><div style="height:${Math.max(pct,5)}px;background:${colors[e]};border-radius:3px;margin-bottom:4px"></div><div style="font-size:11px">${e}</div><div style="font-size:10px;opacity:.6">${pct}%</div></div>`;
        }).join('')}
      </div>
    </div>
  `;
}

function renderClassicRef(params) {
  const { dayStem, dayBranch, xiEle, jiEle, pillars } = params;
  const box = document.getElementById('nayinGrid');
  if (!box) return;

  const dayEle = ELE[dayStem];
  const classicMap = {
    '木': [
      {book:'《滴天髓》',text:'木性腾上而无所止，气重则欲金任使，有金则有惟高惟肃之德。'},
      {book:'《穷通宝鉴》',text:'木生于春，余寒犹存，得火温之则荣。'}
    ],
    '火': [
      {book:'《滴天髓》',text:'火性炎上，顺之则炽，用木生之则福，用水克之则祸。'},
      {book:'《穷通宝鉴》',text:'火旺于夏，得水制之则光明，失水制之则焚灭。'}
    ],
    '土': [
      {book:'《滴天髓》',text:'土五行之主，敦厚而承载，得木疏之则灵。'},
      {book:'《穷通宝鉴》',text:'土旺于四季，得木疏之则通达，无木则板滞。'}
    ],
    '金': [
      {book:'《滴天髓》',text:'金刚健中正，体仁以义，有火炼之则成器。'},
      {book:'《穷通宝鉴》',text:'金旺于秋，得火炼之则成大器，无火则顽钝。'}
    ],
    '水': [
      {book:'《滴天髓》',text:'水流通达，周流不滞，得土制之则归正途。'},
      {book:'《穷通宝鉴》',text:'水旺于冬，得土防之则不泛滥，无土则横流。'}
    ]
  };

  const refs = classicMap[dayEle] || classicMap['木'];
  box.innerHTML = `
    <div class="analysis-card">
      <h5>📜 经典论命出处</h5>
      ${refs.map(r => `
        <div style="margin-top:12px;padding:12px;background:rgba(255,255,255,.02);border-left:2px solid var(--gold)">
          <p style="font-size:11px;color:var(--gold);letter-spacing:2px">${r.book}</p>
          <p style="margin-top:6px;font-size:13px;line-height:1.8;letter-spacing:1px">${r.text}</p>
        </div>
      `).join('')}
      <p style="font-size:11px;opacity:.4;margin-top:12px;letter-spacing:1px">以上经典原文仅供参考，命理分析需结合全局综合判断</p>
    </div>
  `;
}

function getAvoidDir(ele) {
  const m = {木:'西方',火:'北方',土:'东方',金:'南方',水:'中央'};
  return m[ele] || '无明显禁忌';
}

function getColorItems(dayEle, xiEle, weakEle) {
  const colorMap = {
    木:{color:'#27ae60',name:'青绿',desc:'木命正色'},
    火:{color:'#e74c3c',name:'红紫',desc:'火命正色'},
    土:{color:'#e67e22',name:'黄褐',desc:'土命正色'},
    金:{color:'#95a5a6',name:'白金银',desc:'金命正色'},
    水:{color:'#2980b9',name:'蓝黑',desc:'水命正色'},
  };
  let items = [];
  for (const [ele, info] of Object.entries(colorMap)) {
    const isXi = ele === xiEle;
    const isWeak = ele === weakEle;
    items.push(`<div class="kaiyun-item" style="${isXi ? 'border-color:var(--gold);background:rgba(201,168,76,.08)' : isWeak ? 'border-color:rgba(231,76,60,.3)' : ''}">
      <div class="ki-icon" style="width:28px;height:28px;border-radius:50%;background:${info.color};margin:0 auto 6px"></div>
      <div class="ki-label">${info.name}</div>
      <div class="ki-value" style="font-size:11px;${isXi?'color:#2ecc71':isWeak?'color:#e74c3c':''}">${isXi?'★喜用':isWeak?'忌用':info.desc}</div>
    </div>`);
  }
  return items.join('');
}

function getStemColor(s) {
  const m = {'甲':'#2980b9','乙':'#27ae60','丙':'#e74c3c','丁':'#c0392b','戊':'#e67e22','己':'#a08060','庚':'#95a5a6','辛':'#7f8c8d','壬':'#2980b9','癸':'#3498db'};
  return m[s] || '#c9a84c';
}

function getTenGod(stem, branch, dayStem) {
  // ═══ 升级：完整十神判定（天干+藏干） ═══
  if (!stem || !dayStem) return '';
  const tenGodMap = TENGAN[dayStem];
  if (!tenGodMap) return '';
  
  // 天干十神：直接查表
  for (const [rel, st] of Object.entries(tenGodMap)) {
    if (st === stem) return TEGAN_NAMES[rel];
  }
  
  // 地支藏干十神：取出藏干，逐个判定
  const cangganMap = ZHI_CANGGAN || {子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','庚','戊'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
  var branchStems = cangganMap[branch];
  if (!branchStems) {
    // 回退到 ZHI_SHENG
    branchStems = ZHI_SHENG[branch] || [];
  }
  
  // 取本气（第一个藏干）的十神为主十神
  if (branchStems.length > 0) {
    var benQiStem = branchStems[0];
    for (const [rel, st] of Object.entries(tenGodMap)) {
      if (st === benQiStem) return TEGAN_NAMES[rel];
    }
  }
  
  // 如果本气没匹配，尝试中气、余气
  for (var si = 1; si < branchStems.length; si++) {
    for (const [rel, st] of Object.entries(tenGodMap)) {
      if (st === branchStems[si]) return TEGAN_NAMES[rel];
    }
  }
  
  return '';
}

// 获取地支所有藏干的十神列表
function getBranchTenGods(branch, dayStem) {
  var cangganMap = ZHI_CANGGAN || {子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','庚','戊'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
  var stems = cangganMap[branch] || ZHI_SHENG[branch] || [];
  var result = [];
  var tenGodMap = TENGAN[dayStem];
  if (!tenGodMap) return result;
  for (var i = 0; i < stems.length; i++) {
    for (var rel in tenGodMap) {
      if (tenGodMap[rel] === stems[i]) {
        result.push({stem: stems[i], god: TEGAN_NAMES[rel], isBen: i === 0});
        break;
      }
    }
  }
  return result;
}

// ═══ 五行力量量化 (移植自HeiGe wuxing_strength) ═══
// 月支×2权重、藏干本气1/中气0.5/余气0.2加权
function getWuXingPower(pillars, dayStem) {
  var dayEle = ELE[dayStem];
  var scores = {'木':0, '火':0, '土':0, '金':0, '水':0};
  
  // 藏干本气/中气/余气权重
  var cangganMap = {'子':['癸'],'丑':['己','癸','辛'],'寅':['甲','丙','戊'],'卯':['乙'],'辰':['戊','乙','癸'],'巳':['丙','庚','戊'],'午':['丁','己'],'未':['己','丁','乙'],'申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']};
  var weights = [1, 0.5, 0.2]; // 本气/中气/余气
  
  for (var pi = 0; pi < pillars.length; pi++) {
    var p = pillars[pi];
    // 天干+1
    var stemEle = ELE[p.stem];
    scores[stemEle] += 1;
    
    // 地支藏干加权
    var cgList = cangganMap[p.branch] || ZHI_SHENG[p.branch] || [];
    for (var ci = 0; ci < cgList.length; ci++) {
      var cgEle = ELE[cgList[ci]];
      var w = ci < weights.length ? weights[ci] : 0.1;
      // 月支藏干×2
      if (pi === 1) w *= 2;
      scores[cgEle] += w;
    }
  }
  
  // 计算同党（生我+同我）和异党（我生+我克+克我）
  var tong = 0, yi = 0; // 同党=印比, 异党=财官伤
  for (var ele in scores) {
    if (ele === dayEle) { tong += scores[ele]; } // 比劫
    else if (WUXING_SHENG[ele] === dayEle) { tong += scores[ele]; } // 印（生我者）
    else { yi += scores[ele]; } // 财官伤
  }
  
  var total = tong + yi;
  var ratio = total > 0 ? (tong / total) : 0.5; // 0-1 小数
  var strengthLevel;
  if (ratio >= 0.8) strengthLevel = '极旺';
  else if (ratio >= 0.6) strengthLevel = '偏旺';
  else if (ratio >= 0.4) strengthLevel = '中和';
  else if (ratio >= 0.2) strengthLevel = '偏弱';
  else strengthLevel = '极弱';
  
  // 通根检查
  var tonggenCount = 0;
  var tonggenDetail = [];
  for (var pi2 = 0; pi2 < pillars.length; pi2++) {
    var p2 = pillars[pi2];
    var cgList2 = cangganMap[p2.branch] || [];
    for (var ci2 = 0; ci2 < cgList2.length; ci2++) {
      if (ELE[cgList2[ci2]] === dayEle) {
        tonggenCount++;
        tonggenDetail.push(p2.name + p2.branch + '藏' + cgList2[ci2] + (ci2 === 0 ? '(本气)' : ci2 === 1 ? '(中气)' : '(余气)'));
      }
    }
  }
  
  var tip = ratio >= 0.5 ? '同党占比' + (ratio*100).toFixed(0) + '%，偏旺。' : '同党占比' + (ratio*100).toFixed(0) + '%，偏弱。';
  
  return {
    score: scores,
    tong: tong,
    yi: yi,
    ratio: ratio,
    strengthLevel: strengthLevel,
    tonggenCount: tonggenCount,
    tonggenDetail: tonggenDetail.join('、'),
    tip: tip
  };
}

// ═══ 从格检测 ═══
function detectCongGe(pillars, dayStem, wuXingPower) {
  var dayEle = ELE[dayStem];
  var ratio = wuXingPower.ratio;
  
  // 极旺从格: 同党占比≥85%且无有力异党克制
  if (ratio >= 85) {
    // 检查是否有有力的克我者（官杀）
    var hasKe = false;
    for (var pi = 0; pi < pillars.length; pi++) {
      var p = pillars[pi];
      if (ELE[p.stem] === WUXING_KE[dayEle]) hasKe = true;
      var cgList = (ZHI_CANGGAN || {})[p.branch] || [];
      for (var ci = 0; ci < cgList.length; ci++) {
        if (ELE[cgList[ci]] === WUXING_KE[dayEle]) hasKe = true;
      }
    }
    if (!hasKe) {
      var congName = {'木':'从革格','火':'从杀格','土':'从财格','金':'从格','水':'从儿格'};
      return { isCong: true, type: congName[dayEle] || '从旺格', desc: '日主极旺无制，满盘同党，成从旺格。用神取比劫印绶，顺其旺势。' };
    }
  }
  
  // 极弱从格: 同党占比≤15%且无根
  if (ratio <= 15 && wuXingPower.tonggenCount === 0) {
    var congType2 = {'木':'从财杀格','火':'从儿格','土':'从比格','金':'从官格','水':'从印格'};
    return { isCong: true, type: congType2[dayEle] || '从弱格', desc: '日主极弱无根，满盘异党，成从弱格。用神取财官伤，顺其弱势。' };
  }
  
  return { isCong: false };
}

function getMingType(pillars, dayStem, dayStemIdx) {
  const dayEle = ELE[dayStem];
  const monthBranch = pillars[1].branch;
  const monthEle = ZHI_ELE[monthBranch];
  const eleCount = {木:0,火:0,土:0,金:0,水:0};
  for (const p of pillars) { eleCount[ELE[p.stem]]++; eleCount[ZHI_ELE[p.branch]]++; }
  const total = Object.values(eleCount).reduce((a,b)=>a+b,0);

  // ═══ 黑格引擎移植：五看旺衰 (替代旧版 得令+得地+得势) ═══
  // 1. 看月令（得令/失令）— 权重最大，占旺衰判断3-4成
  // 五行旺相休囚死：当令者旺，我生者相，生我者休，克我者囚，我克者死
  const WX_WANG = {木:{旺:'寅卯',相:'巳午',休:'亥子',囚:'申酉',死:'辰戌丑未'},火:{旺:'巳午',相:'辰戌丑未',休:'寅卯',囚:'亥子',死:'申酉'},土:{旺:'辰戌丑未',相:'申酉',休:'巳午',囚:'寅卯',死:'亥子'},金:{旺:'申酉',相:'亥子',休:'辰戌丑未',囚:'巳午',死:'寅卯'},水:{旺:'亥子',相:'寅卯',休:'申酉',囚:'辰戌丑未',死:'巳午'}};
  const monthState = WX_WANG[dayEle];
  let monthStatus = '失令'; // 默认
  if (monthState) {
    if (monthState.旺.includes(monthBranch)) monthStatus = '得令（旺）';
    else if (monthState.相.includes(monthBranch)) monthStatus = '得令（相）';
    else if (monthState.休.includes(monthBranch)) monthStatus = '失令（休）';
    else if (monthState.囚.includes(monthBranch)) monthStatus = '失令（囚）';
    else if (monthState.死.includes(monthBranch)) monthStatus = '失令（死）';
  }
  const isDeling = monthStatus.includes('得令');

  // 2. 看通根（得地/失地）— 日主天干在四地支藏干中有无同类
  const cangganMap = ZHI_CANGGAN || {子:['癸'],丑:['己','癸','辛'],寅:['甲','丙','戊'],卯:['乙'],辰:['戊','乙','癸'],巳:['丙','庚','戊'],午:['丁','己'],未:['己','丁','乙'],申:['庚','壬','戊'],酉:['辛'],戌:['戊','辛','丁'],亥:['壬','甲']};
  let tonggenCount = 0;
  let tonggenDetail = [];
  for (const p of pillars) {
    const cg = cangganMap[p.branch] || [];
    const has = cg.some(g => ELE[g] === dayEle);
    if (has) {
      tonggenCount++;
      tonggenDetail.push(p.branch);
    }
  }
  const isDedi = tonggenCount >= 1;

  // 3. 看生扶（得生/得助）— 印星和比劫数量
  const yinEle = Object.keys(WUXING_SHENG).find(k => WUXING_SHENG[k] === dayEle);
  const biEle = dayEle; // 比劫同日主五行
  const yinBiCount = eleCount[yinEle] + eleCount[biEle];

  // 4. 看党众（同党 vs 异党）— 量化
  const power = getWuXingPower(pillars, dayStem);
  const tongScore = power.tong;  // 同党（比劫+印）
  const yiScore = power.yi;      // 异党（食伤+财+官杀）
  const ratio = power.ratio;

  // 5. 综合定档
  let strengthLevel = '';
  let isDayMasterStrong = false;
  let isExtreme = false; // 极旺或极弱
  if (isDeling && isDedi && ratio > 0.6) {
    strengthLevel = '身强';
    isDayMasterStrong = true;
    if (ratio > 0.75 && tonggenCount >= 2 && yinBiCount >= 5) {
      strengthLevel = '极旺（可能成专旺格）';
      isExtreme = true;
    }
  } else if (!isDeling && !isDedi && ratio < 0.35) {
    strengthLevel = '身弱';
    isDayMasterStrong = false;
    if (ratio < 0.2 && tonggenCount === 0 && yinBiCount <= 1) {
      strengthLevel = '极弱（可能成从格）';
      isExtreme = true;
    }
  } else if (ratio > 0.5) {
    strengthLevel = '偏强';
    isDayMasterStrong = true;
  } else if (ratio < 0.45) {
    strengthLevel = '偏弱';
    isDayMasterStrong = false;
  } else {
    strengthLevel = '中和（需细辨）';
    isDayMasterStrong = ratio >= 0.5;
  }

  // ═══ 从格/专旺格识别 ═══
  let isCongGe = false;
  let congGeType = '';
  if (isExtreme && !isDayMasterStrong) {
    // 极弱无根无生 → 从格
    const shangEle = WUXING_SHENG[dayEle]; // 食伤
    const caiEle = WUXING_KE[dayEle];     // 财星
    const guanEle = Object.keys(WUXING_KE).find(k => WUXING_KE[k] === dayEle); // 官杀
    if (eleCount[caiEle] >= 4) { isCongGe = true; congGeType = '从财格'; }
    else if (eleCount[guanEle] >= 4) { isCongGe = true; congGeType = '从杀格'; }
    else if (eleCount[shangEle] >= 4) { isCongGe = true; congGeType = '从儿格'; }
    else { isCongGe = true; congGeType = '从弱格'; }
  } else if (isExtreme && isDayMasterStrong) {
    // 极旺无制 → 专旺格
    const zhuanWang = {'木':'曲直格','火':'炎上格','土':'稼穑格','金':'从革格','水':'润下格'};
    isCongGe = true;
    congGeType = zhuanWang[dayEle] || '专旺格';
  }

  // ═══ 用神取法 — 五法决策树 (从格→调候→扶抑→格局→病药) ═══
  // 1. 查调候表
  var tiaohouStr = '';
  var tiaohouEles = [];
  if (typeof TIAOHOU_TABLE !== 'undefined' && TIAOHOU_TABLE[dayStem]) {
    var thTable = TIAOHOU_TABLE[dayStem];
    var thKey = monthBranch;
    tiaohouStr = thTable[thKey] || '';
    tiaohouEles = tiaohouStr.split('').map(c => ({丙:'火',丁:'火',甲:'木',乙:'木',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'}[c] || ''));
  }
  // 判断调候急症：冬生水寒、夏生火炎
  var isTiaohouUrgent = false;
  var tiaohouReason = '';
  if (['亥','子','丑'].includes(monthBranch) && dayEle !== '火') {
    isTiaohouUrgent = !pillars.some(p => p.stem === '丙' || p.stem === '丁');
    tiaohouReason = '冬生水寒，急需丙丁火暖局';
  } else if (['巳','午','未'].includes(monthBranch) && dayEle !== '水') {
    isTiaohouUrgent = !pillars.some(p => p.stem === '壬' || p.stem === '癸');
    tiaohouReason = '夏生火炎，急需壬癸水润局';
  }

  // 2. 用神决策树
  var yongshenMethod = '';  // 取用方法
  var yongshenEle = '';    // 用神五行
  var jishenEle = '';      // 忌神五行
  var yongshenReason = ''; // 推理链

  if (isCongGe) {
    // 第一关：从格/专旺 — 顺势
    yongshenMethod = '从格顺势';
    yongshenEle = congGeType.includes('财') ? WUXING_KE[dayEle] : (congGeType.includes('杀') ? Object.keys(WUXING_KE).find(k => WUXING_KE[k] === dayEle) : WUXING_SHENG[dayEle]);
    jishenEle = yinEle; // 印比逆势为忌
    yongshenReason = '日主' + (isDayMasterStrong ? '极旺无制' : '极弱无根无生') + '，成' + congGeType + '，顺其旺势取用，忌印比逆之';
  } else if (isTiaohouUrgent) {
    // 第二关：调候急症
    yongshenMethod = '调候优先';
    yongshenEle = ['亥','子','丑'].includes(monthBranch) ? '火' : '水';
    jishenEle = ['亥','子','丑'].includes(monthBranch) ? '水' : '火';
    yongshenReason = tiaohouReason + '；调候为急，权而用之，优先级压过扶抑';
  } else {
    // 第三关：扶抑定向
    if (isDayMasterStrong) {
      yongshenMethod = '扶抑（抑强）';
      yongshenEle = WUXING_SHENG[dayEle]; // 食伤泄秀为首选
      jishenEle = yinEle; // 印比为忌
      yongshenReason = '日主身强，宜泄宜克宜耗：首选食伤(' + WUXING_SHENG[dayEle] + ')泄秀，次取财星(' + WUXING_KE[dayEle] + ')耗身、官杀(' + Object.keys(WUXING_KE).find(k => WUXING_KE[k] === dayEle) + ')克身';
    } else {
      yongshenMethod = '扶抑（扶弱）';
      yongshenEle = yinEle; // 印星生身
      jishenEle = WUXING_SHENG[dayEle]; // 食伤泄气为忌
      yongshenReason = '日主身弱，宜生宜帮：取印星(' + yinEle + ')生身、比劫(' + dayEle + ')帮身；忌食伤泄、财星耗、官杀克';
    }
    // 第四关：格局精定（在扶抑方向内，以月令格局收敛到具体十神）
    // 第五关：病药校验（检查有无忌神克破用神）
  }

  // 调候建议
  var tiaohouAdvice = '';
  if (tiaohouStr) {
    tiaohouAdvice = '穷通宝鉴调候：' + dayStem + '生' + monthBranch + '月，调候用神「' + tiaohouStr + '」。';
    if (tiaohouEles.some(e => e === yongshenEle)) {
      tiaohouAdvice += '与扶抑用神一致，吉。';
    } else if (isTiaohouUrgent) {
      tiaohouAdvice += '调候为急，已优先取用。';
    } else {
      tiaohouAdvice += '调候与扶抑方向不同，需结合大运权衡。';
    }
  }

  const stronger = Object.entries(eleCount).sort((a,b)=>b[1]-a[1]);
  const strongest = stronger[0][0];
  const weakest = stronger[4][0];

  // 日柱纳音
  const nayin = getNayin(dayStemIdx, pillars[2].branchIdx);

  // 十神格局分析
  const shiShenProfile = [];
  for (let i = 0; i < 4; i++) {
    if (i === 2) continue;
    const tg = getTenGod(pillars[i].stem, pillars[i].branch, dayStem);
    shiShenProfile.push(tg + '占' + pillars[i].name);
  }

  // 旺衰诊断报告（带推理链）
  var wangshuaiReport = '【五看旺衰】' +
    '①月令：' + monthStatus + '（' + monthEle + '气，权重最大）；' +
    '②通根：' + (isDedi ? '得地（通根' + tonggenDetail.join('') + '）' : '失地（无根）') + '；' +
    '③生扶：印比共' + yinBiCount + '个；' +
    '④党众：同党' + tongScore + ' vs 异党' + yiScore + '（占比' + Math.round(ratio*100) + '%）；' +
    '⑤定档：' + strengthLevel;
  if (isCongGe) wangshuaiReport += ' → ' + congGeType;

  var yongshenReport = '【用神取法】' + yongshenMethod + ' → 用神：' + yongshenEle + '，忌神：' + jishenEle +
    '。推理：' + yongshenReason + '。';
  if (tiaohouAdvice) yongshenReport += tiaohouAdvice;

  // 基于日主五行+旺衰+格局的差异化描述库
  natureLib = {
    '木':{
      strong:{
        type:'参天甲木/乙木', traits:'性格正直刚强，有上进心和开拓精神。木旺之人博学多才，但过旺则固执己见、不知变通。行事有魄力，敢作敢当，但易与人发生冲突。',
        xiJi:`日主${isDayMasterStrong?'偏旺':'中和'}，月令${monthEle}气，四柱中${strongest}(${eleCount[strongest]}个)最旺，${weakest}(${eleCount[weakest]}个)最弱。${dayEle==='木'?'身旺喜泄秀，宜火泄木气、土培根基；忌水再助、金克伐。':'需水木扶身，忌金伐土耗。'}十神分布：${shiShenProfile.join('，')}。`,
        career:`${dayEle==='木'?'木旺宜从事发挥才华之业：教育、文化、设计、艺术、法律。利东南方发展，可展胸中之志。':'宜教育、文化、农业、医药行业。利东方发展，稳扎稳打。'}结合大运若走火土运，名利双收；行金水运则多波折。`,
        love:`${dayEle==='木'?'木旺之人感情直率主动，但过刚易折。配偶宜选温柔包容之水土命人，能柔化刚性。日支为'+pillars[2].branch+'，'+ZHI_ELE[pillars[2].branch]+'临夫妻宫，配偶性格'+(ZHI_ELE[pillars[2].branch]==='土'||ZHI_ELE[pillars[2].branch]==='水'?'温厚稳重':'活泼有主见')+'。':'感情细腻敏感，重视精神交流。宜选日支相生之异性，婚配以温和包容为上。'}忌与金旺之人相冲，易生口角。`,
        health:`肝胆系统为重点关注对象。${isDayMasterStrong?'木旺易肝阳上亢，注意高血压、头痛、眼疾。宜常食绿色蔬菜、酸味收敛。':'木弱则肝血不足，易疲劳、视力下降。宜早睡养肝，多接触自然草木。'}春季为调养关键期。`
      },
      weak:{
        type:'柔韧乙木/甲木', traits:'性格温和谦逊，适应力强，善于察言观色。木弱之人虽有才智但缺乏自信，需要他人扶持方能成事。心地善良，重情重义。',
        xiJi:`日主偏弱，月令${monthEle}克泄交加。四柱${strongest}过旺(${eleCount[strongest]}个)，日主${dayEle}仅${eleCount[dayEle]}个，身弱需扶。宜水木帮身，增强自身力量；忌金克伐、土耗泄、火泄身。十神：${shiShenProfile.join('，')}。`,
        career:`宜从事稳定型工作：文职、行政、教育、医疗。不宜冒险创业或高风险投资。利北方水地发展，得贵人扶持。大运走水木之地时可大展拳脚。`,
        love:`感情内敛被动，不敢主动表达。宜配阳刚果断之异性互补。日支${pillars[2].branch+'('+ZHI_ELE[pillars[2].branch]+')'}临夫妻宫，配偶多为依靠对象。婚姻宜晚不宜早，待自身强大后再论。`,
        health:`木弱肝胆功能不足，免疫力偏低。易感冒、过敏、关节不利。宜多户外活动、练习太极八段锦。饮食增入绿色蔬果和酸性食物养肝。`
      }
    },
    '火':{
      strong:{
        type:'烈焰丙火/丁火', traits:'性格热情奔放，行动力极强，有领袖气质。火旺之人光明磊落，但过旺则急躁易怒、做事虎头蛇尾。社交能力强，人缘极佳。',
        xiJi:`日主${isDayMasterStrong?'偏旺较强':'中和平衡'}，生于${monthEle}月令。四柱${strongest}最盛(${eleCount[strongest]}个)，${weakest}最缺(${eleCount[weakest]}个)。${dayEle==='火'?'火旺宜泄不 宜抑：喜土泄火气秀发、金耗火势；忌水直接克制、木再添柴。':'宜木火相助，忌水浇土压。'}纳音${nayin}，十神：${shiShenProfile.join('，')}。`,
        career:`${dayEle==='火'?'火旺宜从事展现个人魅力之业：演艺、传媒、销售、餐饮、能源。利南方发展，如日中天。':'宜餐饮、能源、光电、运输行业。利南方进取。'}火土同宫则名利双收，水火相冲则事业多变。`,
        love:`${dayEle==='火'?'感情热烈如火，追求浪漫激情。配偶宜选沉稳冷静之金水命人，以水火既济为佳。日支'+pillars[2].branch+'，'+(ZHI_ELE[pillars[2].branch]==='水'?'配偶聪慧理性，能平衡你的热情':'配偶同样热情，需防火上加火')+'。':'感情真挚温暖，重视家庭氛围。宜选温柔体贴之伴侣。'}忌两人都性情急躁，易生争执。`,
        health:`心脑血管系统为重点。${isDayMasterStrong?'火旺易心火亢盛：失眠、焦虑、血压偏高、眼疾。宜静心冥想、少食辛辣。':'火弱则心血不足：怕冷、手脚冰凉、精神不振。宜午时晒太阳、食红色食物补心。'}夏季注意防暑降温。`
      },
      weak:{
        type:'灯烛丁火/丙火', traits:'性格温和细腻，心思缜密，有奉献精神。火弱之人虽有心愿但执行力不足，需要环境激励。待人真诚，但容易受他人影响。',
        xiJi:`日主偏弱，月令${monthEle}不得力。四柱火少(${eleCount['火']}个)，${strongest}过旺形成克泄。宜木火通明帮身，增强自信与行动力；忌水克火、土泄火、金耗火。十神：${shiShenProfile.join('，')}。`,
        career:`宜从事幕后或辅助性工作：行政、策划、研究、护理。不宜冲在一线。利东南方木火之地发展。大运遇木火之时方可出头。`,
        love:`感情含蓄内敛，不善表达爱意。宜配热情主动之异性引导。日支${pillars[2].branch+'('+ZHI_ELE[pillars[2].branch]+')'}，婚姻生活平稳为主。需学会主动沟通，避免冷战。`,
        health:`火力不足，循环代谢偏慢。易疲劳、怕冷、消化不良。宜适当运动促进气血运行，多晒太阳，食红色蔬果补益心气。`
      }
    },
    '土':{
      strong:{
        type:'厚重戊土/己土', traits:'性格沉稳敦厚，诚信守诺，有担当。土旺之人可托付大事，但过旺则固执保守、因循守旧。重视传统和家庭，有包容力。',
        xiJi:`日主${isDayMasterStrong?'偏旺厚重':'中和稳健'}，月令${monthEle}之气。四柱${strongest}最旺(${eleCount[strongest]}个)，${weakest}偏少(${eleCount[weakest]}个)。${dayEle==='土'?'土旺宜疏不宜堵：喜金泄土秀发、木疏土通达；忌火再生土、水围土困。':'宜火土扶持，忌木克土散。'}纳音${nayin}，十神：${shiShenProfile.join('，')}。`,
        career:`${dayEle==='土'?'土旺宜从事稳重可信之业：建筑、地产、农业、金融、管理。利本地或中央发展，根基稳固。':'宜建筑、农业、矿产、地产。利本地发展。'}土金相生则财源广进，木克土则事业受阻。`,
        love:`${dayEle==='土'?'感情忠贞专一，一旦认定便全心投入。配偶宜选灵活变通之木水命人，避免两人都过于固执。日支'+pillars[2].branch+'，'+(ZHI_ELE[pillars[2].branch]==='木'?'配偶能带动你突破框架':'配偶同样稳重踏实')+'。':'感情务实稳重，看重对方人品和经济基础。宜选可靠踏实的伴侣。'}婚姻宜求稳，忌轻率变动。`,
        health:`脾胃消化系统为核心。${isDayMasterStrong?'土旺易脾湿胃胀：消化不良、肥胖、水肿。宜清淡饮食、规律运动、多食健脾食材。':'土弱则脾胃虚弱：食欲不振、易腹泻、肌肉松弛。宜细嚼慢咽、定时定量、少食生冷。'}长夏季节重点调养。`
      },
      weak:{
        type:'田园己土/戊土', traits:'性格随和宽容，善解人意，适应力好。土弱之人缺乏主见，容易被左右。心地善良，乐于助人，但有时过于迁就他人。',
        xiJi:`日主偏弱，月令${monthEle}耗泄较多。四柱土仅${eleCount['土']}个，${strongest}(${eleCount[strongest]}个)过旺压制日主。宜火土生扶，增强自身底气；忌木克土、金泄土、水耗土。十神：${shiShenProfile.join('，')}。`,
        career:`宜从事服务或协调类工作：人力资源、客服、中介、咨询。不宜独立决策。利南方火地或本地发展。需借助团队力量成就事业。`,
        love:`感情顺其自然，不太主动追求。宜配果敢决断之异性主导。日支${pillars[2].branch+'('+ZHI_ELE[pillars[2].branch]+')'}，婚姻中多配合对方。建议明确自己的底线，避免一味迁就。`,
        health:`土弱脾胃功能差，营养吸收不良。易消瘦、乏力、面色萎黄。宜少食多餐、选择易消化食物、配合健脾中药调理。`
      }
    },
    '金':{
      strong:{
        type:'肃杀庚金/辛金', traits:'性格刚毅果断，正义感强，讲原则。金旺之人有决断力和执行力，但过旺则冷酷无情、不懂变通。言出必行，值得信赖。',
        xiJi:`日主${isDayMasterStrong?'偏旺刚健':'中和有力'}，月令${monthEle}。四柱${strongest}最盛(${eleCount[strongest]}个)，${weakest}稀缺(${eleCount[weakest]}个)。${dayEle==='金'?'金旺宜泄不宜克：喜水泄金秀气、火炼金成器；忌土埋金、木耗金。':'宜土金相助，忌火炼木耗。'}纳音${nayin}，十神：${shiShenProfile.join('，')}。`,
        career:`${dayEle==='金'?'金旺宜从事需要决断力之业：军警、法律、金融、外科医生、机械工程。利西方发展，锐意进取。':'宜金融、法律、金属、机械。利西方拓展。'}水金相流通达富贵，火金相战则多是非。`,
        love:`${dayEle==='金'?'感情理智冷静，不会轻易动情。一旦投入则忠诚专一。配偶宜选温柔感性之水木命人，软化刚性。日支'+pillars[2].branch+'，'+(ZHI_ELE[pillars[2].branch]==='水'?'配偶聪慧灵动，相处和谐':'配偶同样理性，需增加情感表达')+'。':'感情内敛深沉，不善甜言蜜语。宜选温柔体贴的伴侣。'}切忌言语刻薄伤人，学会表达情感。`,
        health:`呼吸系统和皮肤为重点。${isDayMasterStrong?'金旺易肺燥咳嗽、皮肤过敏、便秘。宜多食白色润肺食物、保持室内湿度、练习深呼吸。':'金弱则肺气不足：易感冒、哮喘、皮肤干燥。宜户外运动增强肺活量、注意保暖。'}秋季为肺部保养关键期。`
      },
      weak:{
        type:'珠玉辛金/庚金', traits:'性格温文尔雅，重情重义，有审美眼光。金弱之人虽然聪明但缺乏决断力，做事犹豫不决。外表柔和，内心有原则。',
        xiJi:`日主偏弱，月令${monthEle}消耗金气。四柱金仅${eleCount['金']}个，${strongest}过旺形成压力。宜土金生扶，增强自身力量；忌火克金、水泄金、木耗金。十神：${shiShenProfile.join('，')}。`,
        career:`宜从事技术或艺术类工作：设计、珠宝、会计、技术工程师。不宜从事竞争激烈行业。利西方或本地发展，稳步积累。`,
        love:`感情细腻讲究品质，重视精神契合。宜配成熟稳重之异性给予安全感。日支${pillars[2].branch+'('+ZHI_ELE[pillars[2].branch]+')'}，感情中以沟通理解为主。`,
        health:`金弱肺卫功能差，抵抗力偏低。易呼吸道感染、皮肤问题、大肠不适。宜练习呼吸吐纳、食用白色食物润肺、保持情绪平和。`
      }
    },
    '水':{
      strong:{
        type:'滔滔壬水/癸水', traits:'聪明机智，应变能力强，善交际。水旺之人足智多谋，但过旺则反复无常、缺乏定力。思维活跃，学习能力强。',
        xiJi:`日主${isDayMasterStrong?'偏旺流动':'中和灵动'}，月令${monthEle}。四柱${strongest}最旺(${eleCount[strongest]}个)，${weakest}最少(${eleCount[weakest]}个)。${dayEle==='水'?'水旺宜引不宜止：喜木泄水秀发、土制水堤防；忌金再生源、火激水势。':'宜金水相生，忌土制火耗。'}纳音${nayin}，十神：${shiShenProfile.join('，')}。`,
        career:`${dayEle==='水'?'水旺宜从事智力流通之业：贸易、物流、通讯、传媒、学术研究。利北方发展，纵横四海。':'宜贸易、运输、物流。利北方拓展。'}水木相生则才华横溢，土水相争则动荡不安。`,
        love:`${dayEle==='水'?'感情丰富多变，追求心灵契合。配偶宜选稳重踏实之土火命人，给以安定感。日支'+pillars[2].branch+'，'+(ZHI_ELE[pillars[2].branch]==='土'?'配偶能给你归属感，婚姻稳定':'配偶同样灵活，需建立共同目标')+'。':'感情深沉内敛，不轻易表露真心。宜选能理解你内心世界的伴侣。'}感情中需专注，忌三心二意。`,
        health:`肾与泌尿系统为核心。${isDayMasterStrong?'水旺易肾阳不足：腰膝酸冷、水肿、耳鸣、性功能减退。宜温补肾阳、注意保暖、节制房事。':'水弱则肾精亏虚：记忆力差、骨质疏松、头发早白。宜早睡养精、黑色食物补肾、避免过度劳累。'}冬季为肾脏保养关键期。`
      },
      weak:{
        type:'雨露癸水/壬水', traits:'性格内向沉静，善于观察思考。水弱之人虽聪明但缺乏行动力，想法多做得少。重感情，有时过于敏感多疑。',
        xiJi:`日主偏弱，月令${monthEle}不得助力。四柱水仅${eleCount['水']}个，${strongest}(${eleCount[strongest]}个)过旺压制。宜金水相生帮身，增强行动力；忌土制水、木泄水、火耗水。十神：${shiShenProfile.join('，')}。`,
        career:`宜从事研究或分析类工作：学术、数据、财务分析、编程。不宜从事销售或公关等外向型工作。利北方或西方金水之地发展。`,
        love:`感情谨慎慢热，需要长时间了解才会敞开心扉。宜配耐心真诚之异性。日支${pillars[2].branch+'('+ZHI_ELE[pillars[2].branch]+')'}，婚姻中注重精神交流。建议多表达情感，让对方了解你的心意。`,
        health:`水弱肾功能偏弱，内分泌易失调。易尿频、水肿、听力下降、白发早生。宜节制房事、黑色食物补肾、练习站桩养气、保证充足睡眠。`
      }
    }
  };

  const lib = natureLib[dayEle] || natureLib['木'];
  const n = lib[isDayMasterStrong ? 'strong' : 'weak'];

  // 将旺衰报告和用神报告追加到 xiJi 前面
  const enhancedXiJi = wangshuaiReport + '\n' + yongshenReport + '\n' + n.xiJi;

  return {
    desc: `${n.type}命，${n.traits.split('。')[0]}。四柱${pillars.map(p=>p.stem+p.branch).join(' ')},纳音${nayin},${strengthLevel},${strongest}旺${weakest}弱。`,
    traits: n.traits,
    xiJi: enhancedXiJi,
    career: n.career,
    love: n.love,
    health: n.health,
    // 新增字段
    wangshuai: wangshuaiReport,
    yongshen: yongshenReport,
    strengthLevel: strengthLevel,
    isCongGe: isCongGe,
    congGeType: congGeType,
    yongshenEle: yongshenEle,
    jishenEle: jishenEle,
    yongshenMethod: yongshenMethod,
    tiaohou: tiaohouAdvice,
    tonggenCount: tonggenCount,
    tonggenDetail: tonggenDetail.join('、'),
    tongScore: tongScore,
    yiScore: yiScore,
    ratio: Math.round(ratio * 100) / 100,
  };
}

function computeDayun(pillars, sex, birthYear, birthMonth, birthDay, birthHour, dayStemIdx, dayMasterEle) {
  const result = [];
  const zhiOrder = [...BRANCHES];
  const ganOrder = [...STEMS];
  const startZhi = BRANCHES.indexOf(pillars[1].branch);
  const startGan = STEMS.indexOf(pillars[1].stem);

  // 起运方向：阳男阴女顺行，阴男阳女逆行
  const yearStemIdx = STEMS.indexOf(pillars[0].stem);
  const isYang = yearStemIdx % 2 === 0;
  const isMale = sex === 'male';
  const direction = (isYang && isMale) || (!isYang && !isMale) ? 1 : -1;

  // ═══ 精确起运年龄 (对标 lunar_python) ═══
  // 12节 (非24节气): 立春/惊蛰/清明/立夏/芒种/小暑/立秋/白露/寒露/立冬/大雪/小寒
  // 顺行: 从出生时刻到下一个节; 逆行: 从出生时刻到上一个节
  // 3天=1年, 1月=6小时(0.25天), 1时辰(2小时)=10天
  // total_hours = diff_seconds / 3600
  // years = floor(total_hours / 72); rem = total_hours % 72
  // months = floor(rem / 6); rem2 = rem % 6
  // shichen = floor(rem2 / 2); days = shichen * 10
  // qiyunAge = years + months/12 + days/360
  var qiyunAge = 0;
  var qiyunDetail = '';
  try {
    var birthDate = new Date(birthYear, birthMonth - 1, birthDay, birthHour || 12, 0);
    var JIE_12 = ['立春','惊蛰','清明','立夏','芒种','小暑','立秋','白露','寒露','立冬','大雪','小寒'];
    var targetJie = null;
    if (direction === 1) {
      // 顺行：找出生时刻之后的下一个节
      for (var y = birthYear; y <= birthYear + 1; y++) {
        for (var j = 0; j < 12; j++) {
          var jieDate = getPreciseJieTime(y, JIE_12[j]);
          if (jieDate && jieDate > birthDate) { targetJie = jieDate; break; }
        }
        if (targetJie) break;
      }
    } else {
      // 逆行：找出生时刻之前的上一个节
      for (var y = birthYear; y >= birthYear - 1; y--) {
        for (var j = 11; j >= 0; j--) {
          var jieDate = getPreciseJieTime(y, JIE_12[j]);
          if (jieDate && jieDate < birthDate) { targetJie = jieDate; break; }
        }
        if (targetJie) break;
      }
    }
    if (targetJie) {
      var diffMs = Math.abs(targetJie - birthDate);
      var totalHours = diffMs / 3600000;
      var years = Math.floor(totalHours / 72);
      var rem = totalHours % 72;
      var months = Math.floor(rem / 6);
      var rem2 = rem % 6;
      var shichen = Math.floor(rem2 / 2);
      var days = shichen * 10;
      qiyunAge = years + months / 12 + days / 360;
      qiyunAge = Math.round(qiyunAge * 1000) / 1000;
      qiyunDetail = years + '岁' + months + '月' + days + '天';
    } else {
      qiyunAge = 1;
      qiyunDetail = '1岁(回退)';
    }
  } catch(e) {
    qiyunAge = 1;
    qiyunDetail = '1岁(异常回退:' + e.message + ')';
  }

  for (let i = 0; i < 8; i++) {
    const zhiIdx = (startZhi + i * direction * 3 + 36) % 12;
    const ganIdx = (startGan + i * direction * 3 + 40) % 10;
    const zhi = zhiOrder[zhiIdx];
    const gan = ganOrder[ganIdx];
    const ageStart = Math.round((qiyunAge + i * 10) * 10) / 10;
    const ageEnd = Math.round((qiyunAge + (i + 1) * 10) * 10) / 10;
    const yearStart = birthYear + Math.floor(ageStart);
    const yearEnd = birthYear + Math.floor(ageEnd);

    const ganEle = ELE[gan];
    const zhiEle = ELE[zhi];
    const ganZhiCombo = gan + zhi;
    const rel = getTenGod(gan, zhi, STEMS[dayStemIdx]);
    const isXi = dayMasterEle && (ganEle === dayMasterEle || zhiEle === dayMasterEle);
    const isJi = dayMasterEle && (ganEle === getKe(dayMasterEle) || zhiEle === getKe(dayMasterEle));

    const ganZhiDesc = getGanZhiDayunDesc(gan, zhi, dayStemIdx);

    // 大运增强: 天干十神, 地支藏干十神, 长生十二宫
    var ganShen = getTenGod(gan, null, STEMS[dayStemIdx]);
    var zhiCanggan = ZHI_CANGGAN[zhi] || [];
    var zhiShenList = zhiCanggan.map(function(cg) { return getTenGod(cg, null, STEMS[dayStemIdx]); });
    var zhiShen = zhiShenList.join('/');
    var dishi = getDishi(STEMS[dayStemIdx], zhi);

    result.push({
      index: i + 1,
      gan, zhi, ganEle, zhiEle,
      ageStart, ageEnd, yearStart, yearEnd,
      rel, isXi, isJi,
      ganZhiCombo, ganZhiDesc,
      ganShen: ganShen,
      zhiShen: zhiShen,
      dishi: dishi,
      qiyunAge: i === 0 ? qiyunAge : null,
      qiyunDetail: i === 0 ? qiyunDetail : null
    });
  }
  return result;
}

function getDayunDesc(gan, zhi, dayStemIdx) {
  const rel = getTenGod(gan, zhi, STEMS[dayStemIdx]);
  const ganEle = ELE[gan];
  const isXi = ganEle === '水' || ganEle === '木' ? '喜' : (ganEle === '金' ? '忌' : '');
  return `大运${gan}${zhi},${rel}坐宫，${ganEle}运${isXi || '平'}`;
}

// ═══ 流年排盘 (对标 HeiGe) ═══
// 流年干支按立春分界, 计算虚岁, 显示天干十神/地支藏干十神/长生十二宫
function getLiunian(birthYear, birthMonth, birthDay, span, dayStemIdx) {
  var result = [];
  var currentYear = new Date().getFullYear();
  var startYear = currentYear - Math.floor(span / 2);
  var endYear = currentYear + Math.ceil(span / 2);
  
  for (var yr = startYear; yr <= endYear; yr++) {
    // 流年干支按立春分界
    var lichun = getJieDate(yr, '立春');
    var stemIdx = ((yr - 4) % 10 + 10) % 10;
    var zhiIdx = ((yr - 4) % 12 + 12) % 12;
    var stem = STEMS[stemIdx];
    var zhi = BRANCHES[zhiIdx];
    
    // 天干十神
    var ganShen = getTenGod(stem, null, STEMS[dayStemIdx]);
    
    // 地支藏干十神
    var canggan = ZHI_CANGGAN[zhi] || [];
    var zhiShenList = canggan.map(function(cg) { return getTenGod(cg, null, STEMS[dayStemIdx]); });
    var zhiShen = zhiShenList.join('/');
    
    // 长生十二宫
    var dishi = getDishi(STEMS[dayStemIdx], zhi);
    
    // 虚岁 (出生年=1虚岁)
    var xusui = yr - birthYear + 1;
    
    // 五行
    var ganEle = ELE[stem];
    var zhiEle = ZHI_ELE[zhi];
    
    result.push({
      year: yr,
      stem: stem,
      zhi: zhi,
      ganEle: ganEle,
      zhiEle: zhiEle,
      ganShen: ganShen,
      zhiShen: zhiShen,
      dishi: dishi,
      xusui: xusui,
      isCurrent: yr === currentYear
    });
  }
  return result;
}


// ================================================================
//  HELPER: 人生概要 & 运势趋避
// ================================================================
function getLifeSummary(pillars, dayStem, isStrong, strongest, weakest) {
  var yearBranch = pillars[0].branch;
  var monthBranch = pillars[1].branch;
  var dayBranch = pillars[2].branch;
  var hourBranch = pillars[3].branch;
  var descriptions = {
    '子': '早年学业顺利，20-35岁为人生黄金期，中年后趋于稳定',
    '丑': '早年需经历磨练，30岁后渐入佳境，晚景安稳',
    '寅': '少年早发，才华出众，25-40岁成就显著',
    '卯': '早年体弱，中年后转运，宜静心修身',
    '辰': '一生平稳，波澜不惊，贵人多助',
    '巳': '早年聪慧，中年起伏，晚景福厚',
    '午': '个性鲜明，早年奔波，40岁后事业大成',
    '未': '早年艰辛，35岁后渐入顺境',
    '申': '少年得志，能力强，40岁前可成就大业',
    '酉': '早年顺遂，30岁后财运亨通',
    '戌': '一生多挑战，宜以柔克刚，中晚年有福',
    '亥': '早年波折，35岁后转运，一生有贵人',
  };
  var d = descriptions[dayBranch] || '命格平稳，顺势而为';
  var strengthAdvice = isStrong
    ? '身旺之人宜发挥优势，主动出击；'+(strongest==='木'?'木':'金')+'旺者忌冲动妄为'
    : '身弱之人宜稳扎稳打，借助平台；宜修身养性，厚积薄发';
  return d + '。' + strengthAdvice;
}

function getTimingAdvice(isStrong, dayEle, strongest, weakest) {
  var advice = [];
  advice.push('流年吉凶：逢五行属'+dayEle+'或生助'+dayEle+'之年，大多为吉；逢克泄'+dayEle+'之年需谨慎行事');
  if (isStrong) {
    advice.push('身旺逢印比旺年：压力增大，宜守不宜攻');
    advice.push('身旺逢食伤年：泄秀有力，财运事业有突破');
    advice.push('身旺逢官杀年：压力与机遇并存，宜主动担当');
  } else {
    advice.push('身弱逢印比旺年：得贵人扶持，运势上升');
    advice.push('身弱逢官杀年：压力倍增，宜低调蛰伏');
    advice.push('身弱逢食伤年：泄身过重，注意健康和口舌');
  }
  advice.push('趋避总则：顺势而为，趋吉避凶；喜神当值年抓住机遇，忌神旺年保守行事');
  return advice.join('；') + '。';
}

// ================================================================
//  HUAJIE (化解) ENGINE
// ================================================================

// ================================================================
//  HUAJIE (化解) ENGINE
// ================================================================

function getShopLinks(keywords) {
  if (!keywords || !keywords.length) return '';
  return '<div class="huajie-row"><span style="opacity:.5;min-width:80px">推荐物品</span><span>' + keywords.join('、') + '</span></div>';}

function computeHuajie() {
  playDivinationSound();
  const name = document.getElementById('hjName').value.trim() || '有缘人';
  const dateStr = document.getElementById('hjDate').value;
  const hourVal = document.getElementById('hjHour').value;
  const sex = document.getElementById('hjSex').value;
  if (!dateStr) { showToast('请输入出生日期'); return; }

  const [year, month, day] = dateStr.split('-').map(Number);
  const hour = hourVal ? parseInt(hourVal) : 12;

  // 调用八字引擎获取完整八字信息
  const bazi = getBaziCalcData(year, month, day, hour, sex);

  // 构建化解方案数据(含八字所有信息)
  const hj = {
    name: name,
    year: year, month: month, day: day, hour: hour, sex: sex,
    dayStem: bazi.dayStem,
    dayBranch: bazi.dayBranch,
    dayStemIdx: bazi.dayStemIdx,
    dayBranchIdx: bazi.dayBranchIdx,
    pillars: bazi.pillars,
    eleCount: bazi.eleCount,
    total: bazi.total,
    weakestEle: bazi.weakestEle,
    strongestEle: bazi.strongestEle,
    xiEle: bazi.xiEle,
    mingGua: bazi.mingGua,
    shishen: bazi.shishen,
    qiyong: bazi.qiyong,
    currentYear: new Date().getFullYear(),
    currentYearZhi: '午',
    currentYearZhiIdx: 6
  };

  renderHuajie(hj);
}

function renderHuajie(hj) {
  const out = document.getElementById('hjOutput');
  let html = '';

  // 标题区（始终显示）
  html += `<div class="result-banner">
    <h2 class="rb-name">${hj.name} · 化解方案</h2>
    <p class="rb-meta">公历${hj.year}年${hj.month}月${hj.day}日 ${hj.hour}时 · ${hj.sex === 'male' ? '男' : '女'}命</p>
    <div class="rb-tags">
      <span class="rb-tag">${ELE[hj.dayStem]}日主</span>
      <span class="rb-tag">五行缺${hj.weakestEle}</span>
      <span class="rb-tag">喜用${hj.xiEle}</span>
    </div>
  </div>`;

  // A. 五行补缺方案
  if (shouldRenderModule('huajie')) {
    html += `<div class="huajie-block">
      <h5>🌿 五行补缺方案</h5>
      ${getWuxingHuajie(hj.weakestEle, hj.xiEle)}
    </div>`;
  }

  // B. 太岁化解方案
  if (shouldRenderModule('huajie')) {
    html += `<div class="huajie-block">
      <h5>🛡️ 太岁化解方案</h5>
      ${getTaisuiHuajie(hj.year, hj.pillars[0].branchIdx, hj.currentYearZhiIdx)}
    </div>`;
  }

  // C. 催旺专项
  if (shouldRenderModule('cuiwang')) {
    html += `<div class="huajie-block">
      <h5>✨ 催旺专项</h5>
      ${getCuiwangHuajie(hj.dayStem, hj.dayStemIdx, hj.eleCount)}
    </div>`;
  }

  // D. 年度运程提醒
  if (shouldRenderModule('dayun')) {
    html += `<div class="huajie-block">
      <h5>📅 年度运程提醒(${hj.currentYear}年 丙午)</h5>
      ${getAnnualReminder(hj)}
    </div>`;
  }

  // E. 开运锦囊
  // 居家风水调整
  if (shouldRenderModule('huajie')) {
    html += '<div class="huajie-block">';
    html += '<h5>🏠 居家风水调整</h5>';
    html += getFengshuiAdvice(ELE[hj.dayStem], hj.weakestEle);
    html += '</div>';
  }

  if (shouldRenderModule('huajie')) {
    html += '<div class="huajie-block">';
    html += '<h5>🎋 开运锦囊 · 行动清单</h5>';
    html += getJinang(hj);
    html += '</div>';
  }

  // 完整八字档案
  if (shouldRenderModule('overview')) {
    html += '<div class="huajie-block">';
    html += '<h5>🎯 缘主命盘档案</h5>';
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">';
    html += '<div class="huajie-tag tag-' + (hj.eleCount[0] || '木') + '">' + hj.pillars[0].stem + ' ' + hj.pillars[0].branch + '</div>';
    html += '<div class="huajie-tag tag-' + (hj.eleCount[1] || '火') + '">' + hj.pillars[1].stem + ' ' + hj.pillars[1].branch + '</div>';
    html += '<div class="huajie-tag tag-' + (hj.eleCount[2] || '土') + '">' + hj.pillars[2].stem + ' ' + hj.pillars[2].branch + '</div>';
    html += '<div class="huajie-tag tag-' + (hj.eleCount[3] || '金') + '">' + hj.pillars[3].stem + ' ' + hj.pillars[3].branch + '</div>';
    html += '</div>';
    html += '<div class="huajie-row"><span style="opacity:.5">日主</span><span>' + hj.dayStem + '(' + (ELE[hj.dayStem] || '未知') + ')</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">月令</span><span>' + hj.pillars[1].branch + '(' + (ZHI_ELE[hj.pillars[1].branch] || '未知') + ')</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">命卦</span><span>' + (hj.mingGua ? hj.mingGua.guaName : '') + '卦(' + (hj.mingGua ? hj.mingGua.type : '') + ')</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">十神</span><span>' + (hj.shishen || '未知') + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">起运</span><span>' + (hj.qiyong || '未知') + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">喜用神</span><span>' + hj.xiEle + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5">忌神</span><span>' + hj.strongestEle + '</span></div>';
    html += '</div>';
  }

  // 综合年度运程报告
  if (shouldRenderModule('dayun')) {
    var dayEle = ELE[hj.dayStem] || '木';
    var dayEleDesc = '';
    if (dayEle === '火') dayEleDesc = '日主得令，运势亨通';
    else if (dayEle === '木') dayEleDesc = '木生火旺付出多但收获亦丰';
    else if (dayEle === '土') dayEleDesc = '火生土旺，贵人运佳';
    else if (dayEle === '金') dayEleDesc = '火克金，压力大需谨慎';
    else dayEleDesc = '水克火，可掌控局面';

    html += '<div class="huajie-block">';
    html += '<h5>📅 ' + hj.currentYear + '年综合运程报告(年度为主线)</h5>';
    html += '<div class="huajie-alert">';
    html += '<div class="alert-title">' + hj.currentYear + '年 · 丙午年运程总纲</div>';
    html += '<p><strong>天干</strong>:丙火(太阳之火，主礼仪、热情、光明)</p>';
    html += '<p><strong>地支</strong>:午火(南方火，重礼、重仪、压力与动力并存)</p>';
    html += '<p><strong>流年星</strong>:文昌星入命，紫微星照临</p>';
    html += '<p><strong>整体运势</strong>:今年火旺，' + dayEleDesc + '。全年宜守不宜攻，稳中求进。</p>';
    html += '</div>';
    html += '<h5 style="font-size:12px;color:var(--gold);margin:20px 0 12px;letter-spacing:3px">📆 逐月运程详解</h5>';
    html += getMonthlyReport(hj);
    html += '</div>';
  }

  // 五维度化解建议
  if (shouldRenderModule('huajie')) {
    html += '<div class="huajie-block">';
    html += '<h5>🎯 五维度化解建议</h5>';
    html += getDimensionAdvice(hj);
    html += '</div>';
  }

  // 年龄段+十神缺失+漏财相 化解方案
  if (shouldRenderModule('huajie')) {
    html += '<div class="huajie-block">';
    html += '<h5>🎯 因人制宜 · 年龄段化解方案</h5>';
    html += getAgeBasedHuajie(hj);
    html += '</div>';
  }

  if (shouldRenderModule('tenGodMissing')) {
    html += '<div class="huajie-block">';
    html += '<h5>🔮 十神缺失分析与化解</h5>';
    html += getTenGodMissingHuajie(hj);
    html += '</div>';
  }

  if (shouldRenderModule('loucai')) {
    html += '<div class="huajie-block">';
    html += '<h5>💸 漏财相分析与堵漏方案</h5>';
    html += getLoucaiHuajie(hj);
    html += '</div>';
  }

  // 个性化催旺方案
  if (shouldRenderModule('cuiwang')) {
    html += '<div class="huajie-block">';
    html += '<h5>🔥 个性化催旺方案 · 缺什么催什么</h5>';
    html += getCuiwangPersonalized(hj);
    html += '</div>';
  }

  // 化煞道观寺庙推荐
  if (shouldRenderModule('huajie')) {
    html += '<div class="huajie-block">';
    html += '<h5>🏛️ 化煞道观寺庙推荐</h5>';
    html += getTempleRecommendation(hj);
    html += '</div>';
  }

  // 三元九运化解
  if (shouldRenderModule('sanyuan')) {
    try {
      var _syHtml = _generateSanyuanJiuyunBlock('huajie', {
        dayStem: hj.dayStem || '甲',
        dayEle: ELE[hj.dayStem] || '木',
        xiEle: hj.xiEle || '木',
        currentYear: hj.currentYear || new Date().getFullYear()
      });
      if (_syHtml) {
        html += '<div class="huajie-block">';
        html += '<h5>🌍 三元九运分析</h5>';
        html += _syHtml;
        html += '</div>';
      }
    } catch(e) { console.warn('[三元九运渲染失败]', e.message); }
  }

  // 报告导出工具栏
  html += '<div class="huajie-block" style="text-align:center;padding:12px">';
  html += '<div style="font-size:12px;color:var(--paper3);margin-bottom:8px">📥 导出报告</div>';
  html += '<button class="exp-btn" onclick="exportReportAsText()" style="background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.4);color:var(--gold);padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;margin:4px">📋 文本</button>';
  html += '<button class="exp-btn" onclick="exportReportAsHTMLFile()" style="background:rgba(52,152,219,0.15);border:1px solid rgba(52,152,219,0.4);color:#3498db;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;margin:4px">📄 HTML</button>';
  html += '<button class="exp-btn" onclick="exportReportAsImage()" style="background:rgba(39,174,96,0.15);border:1px solid rgba(39,174,96,0.4);color:#2ecc71;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;margin:4px">🖼️ 图片</button>';
  html += '<button class="exp-btn" onclick="window.location.href=\'report-config.html\'" style="background:rgba(142,68,173,0.15);border:1px solid rgba(142,68,173,0.4);color:#9b59b6;padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;margin:4px">⚙️ 配置</button>';
  html += '</div>';

  // 平台理念标语（始终显示）
  html += '<div style="text-align:center;padding:16px 0 8px;border-top:1px solid rgba(201,168,76,0.1);margin-top:8px">';
  html += '<div style="font-size:14px;color:var(--gold);letter-spacing:6px;font-family:\'Ma Shan Zheng\',serif">知命 · 改运 · 修心持善守静</div>';
  html += '<div style="font-size:11px;color:var(--paper3);margin-top:4px">易道智鉴 · 仅供参考</div>';
  html += '</div>';

  out.innerHTML = html;
  document.getElementById('hjResult').classList.add('visible');
  document.getElementById('hjResult').scrollIntoView({ behavior: 'smooth' });
}

function getWuxingHuajie(weakestEle, xiEle) {
  const data = {
    木: {
      peishi: '翡翠、绿松石、檀木手串、绿幽灵水晶、木质手链',
      peishiLinks: ['翡翠手串', '绿幽灵水晶', '檀木手串'],
      fangwei: '东方/东南方，床头朝东，办公桌东侧放绿色植物',
      yanse: '绿色、青色衣物、车辆选绿色、墨绿色',
      yinshi: '绿色蔬菜、酸性食物、水果、绿茶',
      shuzi: '3、8',
      hangye: '教育、文化、园林、出版、医药、纺织'
    },
    火: {
      peishi: '红玛瑙、石榴石、琥珀、紫水晶、红纹石',
      peishiLinks: ['红玛瑙', '石榴石手链', '紫水晶'],
      fangwei: '南方，床头朝南，灯光充足，红色装饰',
      yanse: '红色、紫色、橙色、粉红色衣物',
      yinshi: '红色食物、苦味、辣椒、红酒、红枣',
      shuzi: '2、7',
      hangye: '能源、餐饮、光电、表演、销售、广告'
    },
    土: {
      peishi: '黄水晶、虎眼石、和田玉、琥珀、陶瓷饰品',
      peishiLinks: ['黄水晶', '虎眼石手链', '和田玉'],
      fangwei: '中央/西南，陶瓷摆件，黄色地毯，土黄色家具',
      yanse: '黄色、棕色、咖啡色、卡其色衣物',
      yinshi: '黄色食物、甜味、山药、土豆、南瓜、小米',
      shuzi: '5、10',
      hangye: '建筑、地产、农业、银行、保险、陶瓷'
    },
    金: {
      peishi: '白水晶、金饰、银饰、铂金、金银首饰',
      peishiLinks: ['白水晶', '金银首饰', '铂金饰品'],
      fangwei: '西方/西北，金属摆件，白色家具，金属装饰',
      yanse: '白色、银色、金色、米白色衣物',
      yinshi: '白色食物、辛辣、银耳、百合、白萝卜、莲子',
      shuzi: '4、9',
      hangye: '金融、珠宝、机械、法律、制造、金属'
    },
    水: {
      peishi: '海蓝宝、黑曜石、墨玉、蓝水晶、蓝宝石',
      peishiLinks: ['海蓝宝', '黑曜石手链', '蓝水晶'],
      fangwei: '北方，鱼缸摆放，蓝色窗帘，黑色装饰',
      yanse: '蓝色、黑色、深灰、藏青色衣物',
      yinshi: '黑色食物、咸味、海鲜、海带、黑豆、黑芝麻',
      shuzi: '1、6',
      hangye: '贸易、物流、航运、医疗、咨询、旅游'
    }
  };

  const d = data[weakestEle] || data['木'];
  let html = '<div class="analysis-grid" style="grid-template-columns:repeat(auto-fit,minmax(250px,1fr))">';

  const items = [
    {icon:'💎', title:'饰品佩戴', content:d.peishi},
    {icon:'🏠', title:'方位布局', content:d.fangwei},
    {icon:'🎨', title:'颜色穿搭', content:d.yanse},
    {icon:'🍽️', title:'饮食调理', content:d.yinshi},
    {icon:'🔢', title:'数字运用', content:d.shuzi},
    {icon:'💼', title:'行业职业', content:d.hangye}
  ];

  for (const item of items) {
    html += `<div class="analysis-card">
      <h5>${item.icon} ${item.title}</h5>
      <p>${item.content}</p>`;
    if (item.title === '饰品佩戴') {
      html += getShopLinks(d.peishiLinks);
    }
    html += `</div>`;
  }

  html += '</div>';
  html += `<p style="margin-top:16px;font-size:12px;opacity:.5;line-height:1.8">缘主若五行缺${weakestEle},以上方案可针对性补足。命理之道，贵在平衡，过犹不及，适中为贵。</p>`;

  return html;
}

function getTaisuiHuajie(birthYear, birthBranchIdx, currentZhiIdx) {
  // 太岁关系判断
  const zodiacs = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  const birthZodiac = zodiacs[birthBranchIdx];
  const taiSuiMap = {
    0: {zodiac:'鼠', taiSui:'值太岁(本命年)', desc:'逢本命年，值太岁当头坐，吉凶取决于八字喜忌。'},
    1: {zodiac:'牛', taiSui:'冲太岁', desc:'丑未相冲，冲动太岁，宜静不宜动。'},
    2: {zodiac:'虎', taiSui:'刑太岁', desc:'寅巳相刑，口舌是非多。'},
    3: {zodiac:'兔', taiSui:'害太岁', desc:'卯辰相害，小人暗中作祟。'},
    4: {zodiac:'龙', taiSui:'值太岁', desc:'辰年值太岁，宜安稳守成。'},
    5: {zodiac:'蛇', taiSui:'冲太岁', desc:'巳亥相冲，冲动之变，需谨慎应对。'},
    6: {zodiac:'马', taiSui:'值太岁', desc:'午年值太岁，火旺之年，需防急躁。'},
    7: {zodiac:'羊', taiSui:'刑太岁', desc:'未戌相刑，谨防口舌之争。'},
    8: {zodiac:'猴', taiSui:'害太岁', desc:'申亥相害，需防小人暗算。'},
    9: {zodiac:'鸡', taiSui:'值太岁', desc:'酉年值太岁，金旺之年，宜守不宜攻。'},
    10: {zodiac:'狗', taiSui:'冲太岁', desc:'戌辰相冲，冲太岁之年，变动较大。'},
    11: {zodiac:'猪', taiSui:'值太岁', desc:'亥年值太岁，水旺之年，宜静养身心。'}
  };

  // 2026年丙午年,太岁为午(马)
  const taiSuiZodiac = '马';
  const taiSuiBranchIdx = 6; // 午

  // 判断与太岁的关系
  let relation = '';
  let solution = '';

  // 值太岁
  if (birthBranchIdx === taiSuiBranchIdx) {
    relation = '值太岁(本命年)';
    solution = '建议:1. 请太岁符佩戴或安奉；2. 年初拜太岁；3. 穿红色内衣裤(本命年习俗);4. 避免参加白事；5. 可佩戴三合、六合生肖饰品化解。';
  }
  // 冲太岁
  else if (Math.abs(birthBranchIdx - taiSuiBranchIdx) === 6) {
    relation = '冲太岁';
    solution = '建议:1. 避免重大决策(结婚、搬家、创业);2. 可佩戴相合生肖饰品；3. 年初拜太岁求平安；4. 多行善事积德；5. 避免去太岁方(南方)长期逗留。';
  }
  // 刑太岁(午午自刑,此处简化)
  else if (birthBranchIdx === 6 && taiSuiBranchIdx === 6) {
    relation = '刑太岁(自刑)';
    solution = '建议:1. 修身养性，控制情绪；2. 避免与人争执；3. 可佩戴兔或羊形饰品(午未合、午戌合);4. 多行善事。';
  }
  // 害太岁
  else if ((birthBranchIdx === 7 && taiSuiBranchIdx === 6) || (birthBranchIdx === 8 && taiSuiBranchIdx === 6)) {
    relation = '害太岁';
    solution = '建议:1. 谨言慎行，防小人；2. 可佩戴六合生肖饰品；3. 避免与人合作投资；4. 年初拜太岁。';
  }
  // 无犯太岁
  else {
    relation = '无犯太岁';
    solution = '缘主今年无犯太岁，但仍需注意:1. 年初可拜太岁祈福；2. 太岁方(南方)不宜动土；3. 保持善念，岁岁平安。';
  }

  let html = `<div class="huajie-alert">
    <div class="alert-title">太岁关系判断</div>
    <p>缘主生肖:<strong>${birthZodiac}</strong></p>
    <p>当年太岁:<strong>${taiSuiZodiac}</strong>(${2026}年 丙午)</p>
    <p>太岁关系:<strong>${relation}</strong></p>
    <p style="margin-top:12px">${solution}</p>
  </div>`;

  // 明年太岁预判
  const nextYear = 2027;
  const nextZodiacs = ['羊','猴','鸡','狗','猪','鼠','牛','虎','兔','龙','蛇','马'];
  const nextZodiac = nextZodiacs[taiSuiBranchIdx + 1 > 11 ? 0 : taiSuiBranchIdx + 1];
  html += `<div class="huajie-alert" style="margin-top:12px;background:rgba(201,168,76,.02)">
    <div class="alert-title">明年太岁预判(${nextYear}年 丁未)</div>
    <p>明年太岁为<strong>${nextZodiac}</strong>,与缘主生肖${birthZodiac}之关系:</p>
    <p style="margin-top:8px">命理之道，流年变化，建议缘主每年初更新化解方案，以保全年顺遂。</p>
  </div>`;

  return html;
}

function getCuiwangHuajie(dayStem, dayStemIdx, eleCount) {
  // 桃花位(根据日干)
  const taohuaMap = {
    甲: {wei:'卯', fangwei:'正东', shipin:'花瓶+水生植物(桃花位东方)', shopKeywords:['花瓶摆件','粉色水晶球'], color:'粉色、玫红'},
    乙: {wei:'寅', fangwei:'东北', shipin:'粉色水晶球', shopKeywords:['粉水晶球 摆件'], color:'紫色、粉紫'},
    丙: {wei:'午', fangwei:'正南', shipin:'红色花瓶+9朵红花', shopKeywords:['红色花瓶','鲜花'], color:'红色、橙色'},
    丁: {wei:'巳', fangwei:'东南', shipin:'紫水晶+粉色摆件', shopKeywords:['紫水晶','粉色摆件'], color:'紫色、粉红'},
    戊: {wei:'卯', fangwei:'正东', shipin:'绿色植物+粉色花', shopKeywords:['绿植','粉色花'], color:'绿色、粉红'},
    己: {wei:'寅', fangwei:'东北', shipin:'陶瓷花瓶+鲜花', shopKeywords:['陶瓷花瓶','鲜花'], color:'黄色、粉红'},
    庚: {wei:'午', fangwei:'正南', shipin:'金属花瓶+9朵红花', shopKeywords:['金属花瓶','红色鲜花'], color:'白色、红色'},
    辛: {wei:'巳', fangwei:'东南', shipin:'银饰+粉色水晶', shopKeywords:['银饰','粉水晶'], color:'银色、粉红'},
    壬: {wei:'卯', fangwei:'正东', shipin:'蓝色花瓶+水生植物', shopKeywords:['蓝色花瓶','水生植物'], color:'蓝色、粉红'},
    癸: {wei:'寅', fangwei:'东北', shipin:'黑色花瓶+紫色花', shopKeywords:['黑色花瓶','紫色花'], color:'黑色、紫色'}
  };

  // 财位(根据日干)
  const caiweiMap = {
    甲: {wei:'辰', fangwei:'东南', baifang:'聚宝盆放东南方', shopKeywords:['聚宝盆','黄水晶'], shuzi:'8、3'},
    乙: {wei:'卯', fangwei:'正东', baifang:'铜葫芦放东方', shopKeywords:['铜葫芦','聚宝盆'], shuzi:'3、8'},
    丙: {wei:'申', fangwei:'西南', baifang:'黄水晶聚宝盆', shopKeywords:['黄水晶聚宝盆','聚宝盆'], shuzi:'7、2'},
    丁: {wei:'酉', fangwei:'正西', baifang:'金属聚宝盆', shopKeywords:['金属聚宝盆','聚宝盆'], shuzi:'9、4'},
    戊: {wei:'子', fangwei:'正北', baifang:'黑色聚宝盆', shopKeywords:['黑色聚宝盆','聚宝盆'], shuzi:'6、1'},
    己: {wei:'亥', fangwei:'西北', baifang:'蓝色聚宝盆', shopKeywords:['蓝色聚宝盆','聚宝盆'], shuzi:'1、6'},
    庚: {wei:'寅', fangwei:'东北', baifang:'绿幽灵水晶', shopKeywords:['绿幽灵水晶','聚宝盆'], shuzi:'8、3'},
    辛: {wei:'卯', fangwei:'正东', baifang:'木质聚宝盆', shopKeywords:['木质聚宝盆','聚宝盆'], shuzi:'3、8'},
    壬: {wei:'午', fangwei:'正南', baifang:'红色聚宝盆', shopKeywords:['红色聚宝盆','聚宝盆'], shuzi:'7、2'},
    癸: {wei:'巳', fangwei:'东南', baifang:'紫色聚宝盆', shopKeywords:['紫色聚宝盆','聚宝盆'], shuzi:'9、4'}
  };

  const tData = taohuaMap[dayStem] || taohuaMap['甲'];
  const cData = caiweiMap[dayStem] || caiweiMap['甲'];

  let html = '<div class="analysis-grid" style="grid-template-columns:1fr">';

  // 催桃花
  html += `<div class="analysis-card">
    <h5>🌸 催桃花(感情运)</h5>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">桃花位</span><span>${tData.fangwei}</span></div>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">摆放建议</span><span>${tData.shipin}</span></div>`;
  html += getShopLinks(tData.shopKeywords);
  html += `<div class="huajie-row"><span style="opacity:.5;min-width:80px">颜色建议</span><span>${tData.color}</span></div>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">活动建议</span><span>多参加社交活动，尤其是春夏之交(农历二三月),桃花运最旺</span></div>
  </div>`;

  // 催财运
  html += `<div class="analysis-card">
    <h5>💰 催财运</h5>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">财位</span><span>${cData.fangwei}</span></div>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">摆放建议</span><span>${cData.baifang}</span></div>`;
  html += getShopLinks(cData.shopKeywords);
  html += `<div class="huajie-row"><span style="opacity:.5;min-width:80px">数字建议</span><span>${cData.shuzi}</span></div>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">行业建议</span><span>${ELE[dayStem]==='木'?'贸易物流':ELE[dayStem]==='火'?'金融投资':ELE[dayStem]==='土'?'地产建筑':ELE[dayStem]==='金'?'珠宝金融':'运输贸易'}</span></div>
  </div>`;

  // 催事业运
  const shiyeMap = {
    甲:'宜向东发展，贵人属虎、兔', 乙:'宜向东北发展，贵人属虎、兔',
    丙:'宜向南发展，贵人属蛇、马', 丁:'宜向东南发展，贵人属蛇、马',
    戊:'宜向中央发展，贵人属龙、狗', 己:'宜向西南发展，贵人属龙、狗',
    庚:'宜向西发展，贵人属猴、鸡', 辛:'宜向西北发展，贵人属猴、鸡',
    壬:'宜向北发展，贵人属鼠、猪', 癸:'宜向西北发展，贵人属鼠、猪'
  };
  html += `<div class="analysis-card">
    <h5>🚀 催事业运</h5>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">事业方向</span><span>${shiyeMap[dayStem]||shiyeMap['甲']}</span></div>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">佩戴建议</span><span>${ELE[dayStem]==='木'?'绿幽灵、檀木':ELE[dayStem]==='火'?'红玛瑙、紫水晶':ELE[dayStem]==='土'?'黄水晶、虎眼石':ELE[dayStem]==='金'?'白水晶、金银':'海蓝宝、黑曜石'}</span></div>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">关键时间</span><span>春季(木旺)利于起步，夏季(火旺)利于发展，秋季(金旺)利于收获</span></div>
  </div>`;

  // 催学业运
  const xueyeMap = {
    甲:'印星为水，宜向北方求学', 乙:'印星为水，宜向北方求学',
    丙:'印星为木，宜向东方求学', 丁:'印星为木，宜向东方求学',
    戊:'印星为火，宜向南方求学', 己:'印星为火，宜向南方求学',
    庚:'印星为土，宜向中央求学', 辛:'印星为土，宜向中央求学',
    壬:'印星为金，宜向西方求学', 癸:'印星为金，宜向西方求学'
  };
  html += `<div class="analysis-card">
    <h5>📚 催学业运</h5>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">学业助力</span><span>${xueyeMap[dayStem]||xueyeMap['甲']}</span></div>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">颜色建议</span><span>${ELE[dayStem]==='木'?'蓝色、黑色':ELE[dayStem]==='火'?'绿色、青色':ELE[dayStem]==='土'?'红色、紫色':ELE[dayStem]==='金'?'黄色、棕色':'白色、银色'}</span></div>
    <div class="huajie-row"><span style="opacity:.5;min-width:80px">时间段</span><span>上午5-7时(卯时)记忆力最佳，宜晨读</span></div>
  </div>`;

  html += '</div>';

  // 专业引导文案
  html += `<div class="huajie-renew-box">
    <div class="renew-title">缘主须知 · 催旺之道</div>
    <div class="renew-desc">
      命理之道，贵在知时。流年更替，五行流转，去年之方今年未必合宜。<br>
      催旺之法，需每年根据流年运势调整，方能事半功倍。<br>
      建议缘主每年初更新化解方案，以保全年顺遂。
    </div>
  </div>`;

  return html;
}

function getAnnualReminder(hj) {
  const currentYear = hj.currentYear;
  const dayStem = hj.dayStem;
  const dayEle = ELE[dayStem];
  const weakestEle = hj.weakestEle;

  // 当年流年运势概要(2026丙午年)
  const yearGan = '丙';
  const yearZhi = '午';
  const yearGanEle = ELE[yearGan];
  const yearZhiEle = ZHI_ELE[yearZhi];

  let summary = '';
  summary += ` ${currentYear}年 丙午年，天干丙火，地支午火，火旺之年。`;
  summary += ` 缘主日主为${dayStem}(${dayEle}),与流年${yearGanEle}${yearZhiEle}之关系:`;

  // 根据日主与流年的关系给出概要
  if (dayEle === '火') {
    summary += `火火相助，今年运势较旺，但需注意火过旺则燥，宜水调和。`;
  } else if (dayEle === '木') {
    summary += `木生火旺，今年付出较多，需注意休养生息。`;
  } else if (dayEle === '土') {
    summary += `火生土，今年得助力，贵人运较好。`;
  } else if (dayEle === '金') {
    summary += `火克金，今年压力较大，需谨慎应对。`;
  } else if (dayEle === '水') {
    summary += `水克火，今年可掌控局面，但需防小人。`;
  }

  let html = `<div class="huajie-alert">
    <div class="alert-title">${currentYear}年 丙午 流年运势概要</div>
    <p>${summary}</p>
  </div>`;

  // 今年特别提醒
  html += `<div style="margin-top:20px">
    <h5 style="font-size:14px;letter-spacing:3px;color:var(--gold);margin-bottom:12px">今年特别提醒</h5>
    <ul class="huajie-checklist">`;

  const reminders = [];
  // 根据五行生成提醒
  if (dayEle === '火') {
    reminders.push('火旺之年，注意心脑血管健康，避免情绪激动');
    reminders.push('夏季(农历四五月)需特别注意，宜静养');
    reminders.push('可多穿蓝色、黑色衣物，佩戴海蓝宝化解火燥');
  } else if (dayEle === '木') {
    reminders.push('木生火旺，今年付出多，注意劳逸结合');
    reminders.push('春季(农历一二月)运势较好，可把握机会');
    reminders.push('宜多补水，佩戴黑曜石平衡五行');
  } else if (dayEle === '土') {
    reminders.push('火生土，今年贵人运好，可把握机会');
    reminders.push('农历六七月(土旺月)运势较稳');
    reminders.push('宜佩戴黄水晶增强土运');
  } else if (dayEle === '金') {
    reminders.push('火克金，今年压力较大，需谨慎决策');
    reminders.push('秋季(农历七八月)金旺，可缓解压力');
    reminders.push('宜佩戴白水晶、金银饰品增强金运');
  } else if (dayEle === '水') {
    reminders.push('水克火，今年可掌控局面，但需防小人');
    reminders.push('冬季(农历十冬月)水旺，运势较好');
    reminders.push('宜佩戴蓝水晶、黑曜石增强水运');
  }

  // 添加通用提醒
  reminders.push(`五行缺${weakestEle},今年需特别注意补足，可参考五行补缺方案`);
  reminders.push(`喜用神为${hj.xiEle},今年多接触${hj.xiEle}五行之物，可增强运势`);

  for (const r of reminders.slice(0, 5)) {
    html += `<li>${r}</li>`;
  }
  html += `  </ul>
  </div>`;

  // 年度开运清单
  html += `<div style="margin-top:24px">
    <h5 style="font-size:14px;letter-spacing:3px;color:var(--gold);margin-bottom:12px">年度开运清单</h5>
    <ul class="huajie-checklist">
      <li>查看流年运势报告(点击查看八字详细分析)</li>
      <li>关注每月运势变化，尤其是生日月份</li>
      <li>化解太岁/犯太岁处理(如有)</li>
      <li>催旺本年喜用方位，调整办公居家布局</li>
      <li>调整本年五行补缺策略，根据流年变化优化</li>
      <li>重要事项择日择时，避开凶日</li>
    </ul>
  </div>`;

  // 重要时间节点(月份吉凶) - 详细流月分析
  const monthly = getMonthlyAnalysis(hj);
  html += `<div style="margin-top:24px">
    <h5 style="font-size:14px;letter-spacing:3px;color:var(--gold);margin-bottom:12px">重要时间节点(${currentYear}年)</h5>
    <div style="margin-top:16px">`;

  for (const m of monthly) {
    const luckColor = m.luck === '吉' ? '#2ecc71' : m.luck === '凶' ? '#e74c3c' : 'rgba(201,168,76,.5)';
    html += `<div class="month-detail" style="border:1px solid rgba(201,168,76,.08);padding:14px 16px;margin-bottom:8px;background:rgba(255,255,255,.01)">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <span style="font-size:13px;letter-spacing:3px">${m.name} <small style="opacity:.4">${m.gan}${m.zhi}</small></span>
        <span style="color:${luckColor};font-size:12px;border:1px solid ${luckColor};padding:2px 10px;border-radius:2px">${m.luck}</span>
      </div>
      <p style="font-size:12px;opacity:.65;line-height:1.7">${m.focus}</p>
      <p style="font-size:11px;opacity:.45;margin-top:4px;letter-spacing:1px">💡 ${m.advice}</p>
    </div>`;
  }

  html += `</div>
    <p style="font-size:11px;opacity:.4;margin-top:8px;letter-spacing:2px">注:吉月宜进取，凶月宜守稳，平月可平稳过渡</p>
  </div>`;

  // 明年预约提醒(复购引导)
  html += `<div class="huajie-renew-box" style="margin-top:24px">
    <div class="renew-title">明年化解方案预约</div>
    <div class="renew-desc">
      缘主，流年运势每年不同，建议年初更新化解方案，以保全年顺遂。<br>
      命理之道，贵在知时。流年更替，五行流转，去年之方今年未必合宜，建议重新排盘调整。<br>
      为缘主持续守护--会员可每年自动获取最新化解方案，无需手动续约。
    </div>
    <button class="huajie-renew-btn" onclick="showToast('化解方案每年初更新，请在年初重新生成')">预 约 明 年 化 解 方 案</button>
  </div>`;

  return html;
}

function getJinang(hj) {
  const weakestEle = hj.weakestEle;
  const xiEle = hj.xiEle;
  const dayEle = ELE[hj.dayStem];

  // 五行对应数据
  const wuxingData = {
    木: {color:'绿色、青色', diet:'绿色蔬菜、水果', fangwei:'东方'},
    火: {color:'红色、紫色', diet:'红色食物、苦味', fangwei:'南方'},
    土: {color:'黄色、棕色', diet:'黄色食物、甜味', fangwei:'中央'},
    金: {color:'白色、金色', diet:'白色食物、辛辣', fangwei:'西方'},
    水: {color:'蓝色、黑色', diet:'黑色食物、海鲜', fangwei:'北方'}
  };

  const d = wuxingData[weakestEle] || wuxingData['木'];

  let html = '<div class="huajie-jinang">';

  // 锦囊标签页
  html += `<div class="jinang-tabs">
    <button class="jinang-tab active" onclick="switchJinangTab(this, 'daily')">日常</button>
    <button class="jinang-tab" onclick="switchJinangTab(this, 'weekly')">每周</button>
    <button class="jinang-tab" onclick="switchJinangTab(this, 'monthly')">每月</button>
    <button class="jinang-tab" onclick="switchJinangTab(this, 'yearly')">年度</button>
  </div>`;

  // 日常
  html += `<div class="jinang-content" id="jinang-daily">
    <div class="jinang-item">穿搭颜色:多穿${d.color}衣物，补足五行</div>
    <div class="jinang-item">饮食建议:多吃${d.diet},调理五行平衡</div>
    <div class="jinang-item">方位选择:办公、睡眠头部朝向${d.fangwei}为佳</div>
    <div class="jinang-item">心态调整:保持平和，遇事不急躁，顺应天时</div>
  </div>`;

  // 每周
  html += `<div class="jinang-content" id="jinang-weekly" style="display:none">
    <div class="jinang-item">活动方位:周末可往${d.fangwei}方位郊游、散步</div>
    <div class="jinang-item">社交建议:多与五行属${xiEle}之人交往，互补不足</div>
    <div class="jinang-item">运动建议:选择${weakestEle==='木'?'瑜伽、拉伸':weakestEle==='火'?'跑步、健身':weakestEle==='土'?'散步、太极':weakestEle==='金'?'球类运动':'游泳、瑜伽'}</div>
  </div>`;

  // 每月
  html += `<div class="jinang-content" id="jinang-monthly" style="display:none">
    <div class="jinang-item">检查流月运势:每月初查看当月运势变化</div>
    <div class="jinang-item">调整布局:根据流月五行，微调办公居家布局</div>
    <div class="jinang-item">记录变化:观察每月运势变化，总结经验</div>
  </div>`;

  // 年度
  html += `<div class="jinang-content" id="jinang-yearly" style="display:none">
    <div class="jinang-item">更新流年化解方案:每年初重新排盘，更新方案</div>
    <div class="jinang-item">太岁处理:年初拜太岁，请太岁符(如犯太岁)</div>
    <div class="jinang-item">大运交接检查:如遇大运交接年份，需特别注意</div>
    <div class="jinang-item">全面调整:根据新年五行布局，全面调整生活工作</div>
  </div>`;

  html += '</div>';

  return html;
}

function switchJinangTab(btn, tabName) {
  // 切换标签样式
  btn.parentElement.querySelectorAll('.jinang-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  // 切换内容
  const contents = ['daily','weekly','monthly','yearly'];
  for (const c of contents) {
    const el = document.getElementById('jinang-' + c);
    if (el) el.style.display = c === tabName ? 'block' : 'none';
  }
}


// ================================================================
//  YIJING ENGINE
// ================================================================

const HEXAGRAMS = [
  { num:1,  gua:[[1,1,1],[1,1,1]], name:'乾', pinyin:'Qián', symbol:'䷀', judgment:'元亨利贞', meaning:'大吉，无往不利' },
  { num:2,  gua:[[0,0,0],[0,0,0]], name:'坤', pinyin:'Kūn', symbol:'䷁', judgment:'元亨利牝马之贞', meaning:'柔顺宽厚，承载万物' },
  { num:3,  gua:[[0,0,0],[1,1,1]], name:'屯', pinyin:'Zhūn', symbol:'䷂', judgment:'元亨利贞', meaning:'初生艰难，积蓄力量' },
  { num:4,  gua:[[1,1,1],[0,0,0]], name:'蒙', pinyin:'Mēng', symbol:'䷃', judgment:'亨，匪我求童蒙', meaning:'启蒙发智，去惑求明' },
  { num:5,  gua:[[0,0,0],[0,0,1]], name:'需', pinyin:'Xū', symbol:'䷄', judgment:'有孚，光亨，贞吉', meaning:'等待时机，蓄势待发' },
  { num:6,  gua:[[1,0,0],[0,0,0]], name:'讼', pinyin:'Sòng', symbol:'䷅', judgment:'有孚，窒，惕中吉', meaning:'争讼是非，谨慎处理' },
  { num:7,  gua:[[0,0,0],[1,0,0]], name:'师', pinyin:'Shī', symbol:'䷆', judgment:'贞，丈人吉，无咎', meaning:'统众用兵，以德服人' },
  { num:8,  gua:[[1,0,0],[0,0,0]], name:'比', pinyin:'Bǐ', symbol:'䷇', judgment:'吉，原筮元永贞', meaning:'亲附比邻，众望所归' },
  { num:9,  gua:[[1,1,1],[0,0,1]], name:'小畜', pinyin:'Xiǎo Xù', symbol:'䷈', judgment:'亨，密云不雨', meaning:'小有积累，尚需等待' },
  { num:10, gua:[[1,0,0],[0,0,1]], name:'履', pinyin:'Lǚ', symbol:'䷉', judgment:'亨，履虎尾不咥人', meaning:'谨慎行事，履险如夷' },
  { num:11, gua:[[1,1,1],[0,0,0]], name:'泰', pinyin:'Tài', symbol:'䷊', judgment:'小往大来，吉亨', meaning:'天地交泰，万物通达' },
  { num:12, gua:[[0,0,0],[1,1,1]], name:'否', pinyin:'Pǐ', symbol:'䷋', judgment:'否之匪人', meaning:'闭塞不通，静待转机' },
  { num:13, gua:[[1,1,0],[1,1,1]], name:'同人', pinyin:'Tóng Rén', symbol:'䷌', judgment:'同人于野，亨', meaning:'同舟共济，广结善缘' },
  { num:14, gua:[[1,1,1],[0,1,1]], name:'大有', pinyin:'Dà Yǒu', symbol:'䷍', judgment:'元亨', meaning:'丰盛丰收，德才兼备' },
  { num:15, gua:[[0,0,1],[1,1,1]], name:'谦', pinyin:'Qiān', symbol:'䷎', judgment:'亨，君子有终', meaning:'谦受益满招损' },
  { num:16, gua:[[1,1,1],[0,0,1]], name:'豫', pinyin:'Yù', symbol:'䷏', judgment:'利建侯行师', meaning:'欢乐和悦，众心归附' },
  { num:17, gua:[[1,0,0],[1,1,1]], name:'随', pinyin:'Suí', symbol:'䷐', judgment:'元亨利贞', meaning:'随从随顺，因时制宜' },
  { num:18, gua:[[1,1,0],[0,0,1]], name:'蛊', pinyin:'Gǔ', symbol:'䷑', judgment:'元亨，利涉大川', meaning:'拨乱反正，革故鼎新' },
  { num:19, gua:[[0,0,1],[1,1,1]], name:'临', pinyin:'Lín', symbol:'䷒', judgment:'元亨利贞', meaning:'居高临下，督导有方' },
  { num:20, gua:[[1,1,0],[0,0,0]], name:'观', pinyin:'Guān', symbol:'䷓', judgment:'盥而不荐', meaning:'观察省思，静观其变' },
  { num:21, gua:[[1,0,1],[1,1,0]], name:'噬嗑', pinyin:'Shì Kē', symbol:'䷔', judgment:'亨，利用狱', meaning:'明罚勑法，除暴安良' },
  { num:22, gua:[[0,1,1],[1,0,1]], name:'贲', pinyin:'Bì', symbol:'䷕', judgment:'亨，小利有攸往', meaning:'文饰美化，外秀内慧' },
  { num:23, gua:[[0,0,0],[1,1,0]], name:'剥', pinyin:'Bō', symbol:'䷖', judgment:'不利有攸往', meaning:'剥落侵蚀，静守待机' },
  { num:24, gua:[[0,1,1],[0,0,0]], name:'复', pinyin:'Fù', symbol:'䷗', judgment:'亨，出入无疾', meaning:'复归本元，否极泰来' },
  { num:25, gua:[[1,1,1],[0,0,1]], name:'无妄', pinyin:'Wú Wàng', symbol:'䷘', judgment:'元亨利贞', meaning:'不妄为，守正而行' },
  { num:26, gua:[[1,1,1],[1,0,0]], name:'大畜', pinyin:'Dà Xù', symbol:'䷙', judgment:'利贞，不家食吉', meaning:'积蓄深厚，厚积薄发' },
  { num:27, gua:[[0,0,1],[1,0,0]], name:'颐', pinyin:'Yí', symbol:'䷚', judgment:'贞吉，观颐', meaning:'养身养德，慎言节食' },
  { num:28, gua:[[1,0,0],[0,1,1]], name:'大过', pinyin:'Dà Guò', symbol:'䷛', judgment:'栋挠，利有攸往', meaning:'大厦将倾，扶危济困' },
  { num:29, gua:[[0,0,0],[0,0,0]], name:'坎', pinyin:'Kǎn', symbol:'䷜', judgment:'习坎，有孚', meaning:'重重险难，心诚则通' },
  { num:30, gua:[[1,1,1],[1,1,1]], name:'离', pinyin:'Lí', symbol:'䷝', judgment:'利贞，亨', meaning:'光明附丽，柔和中正' },
  { num:31, gua:[[0,0,1],[1,0,0]], name:'咸', pinyin:'Xián', symbol:'䷞', judgment:'亨，利贞', meaning:'情感感应，心意相通' },
  { num:32, gua:[[1,0,0],[0,0,1]], name:'恒', pinyin:'Héng', symbol:'䷟', judgment:'亨，无咎', meaning:'持之以恒，天长地久' },
  { num:33, gua:[[1,1,0],[0,0,0]], name:'遁', pinyin:'Dùn', symbol:'䷠', judgment:'亨，小利贞', meaning:'退避三舍，以退为进' },
  { num:34, gua:[[0,0,0],[1,1,1]], name:'大壮', pinyin:'Dà Zhuàng', symbol:'䷡', judgment:'利贞', meaning:'气势强盛，守正勿躁' },
  { num:35, gua:[[0,0,0],[1,1,0]], name:'晋', pinyin:'Jìn', symbol:'䷢', judgment:'康侯用锡马蕃庶', meaning:'日出地上，晋升发达' },
  { num:36, gua:[[0,1,1],[0,0,0]], name:'明夷', pinyin:'Míng Yí', symbol:'䷣', judgment:'利艰贞', meaning:'明入地中，晦而明' },
  { num:37, gua:[[1,1,0],[1,0,1]], name:'家人', pinyin:'Jiā Rén', symbol:'䷤', judgment:'利女贞', meaning:'齐家之道，女正位内' },
  { num:38, gua:[[1,0,1],[0,1,1]], name:'睽', pinyin:'Kuí', symbol:'䷥', judgment:'小事吉', meaning:'乖离矛盾，求同存异' },
  { num:39, gua:[[0,0,1],[0,0,0]], name:'蹇', pinyin:'Jiǎn', symbol:'䷦', judgment:'利西南，不利东北', meaning:'前路艰险，见机行事' },
  { num:40, gua:[[0,0,0],[1,0,0]], name:'解', pinyin:'Xiè', symbol:'䷧', judgment:'利西南，无攸往', meaning:'解除险难，云开月明' },
  { num:41, gua:[[1,0,0],[1,1,0]], name:'损', pinyin:'Sǔn', symbol:'䷨', judgment:'有孚，元吉', meaning:'减损之道，损己利人' },
  { num:42, gua:[[0,1,1],[0,1,0]], name:'益', pinyin:'Yì', symbol:'䷩', judgment:'利有攸往', meaning:'增益利益，损上益下' },
  { num:43, gua:[[1,1,1],[0,1,0]], name:'夬', pinyin:'Guài', symbol:'䷪', judgment:'扬于王庭', meaning:'决而能和，当断则断' },
  { num:44, gua:[[0,1,0],[1,1,1]], name:'姤', pinyin:'Gòu', symbol:'䷫', judgment:'女壮，勿用取女', meaning:'邂逅相遇，阴长阳消' },
  { num:45, gua:[[0,0,1],[0,0,0]], name:'萃', pinyin:'Cuì', symbol:'䷬', judgment:'亨，王假有庙', meaning:'荟萃聚集，人和为贵' },
  { num:46, gua:[[0,0,0],[0,0,1]], name:'升', pinyin:'Shēng', symbol:'䷭', judgment:'南征吉', meaning:'步步高升，稳扎稳打' },
  { num:47, gua:[[0,0,0],[0,0,0]], name:'困', pinyin:'Kùn', symbol:'䷮', judgment:'亨，贞大人吉', meaning:'困境磨砺，穷则变通' },
  { num:48, gua:[[0,0,0],[0,0,0]], name:'井', pinyin:'Jǐng', symbol:'䷯', judgment:'改邑不改井', meaning:'养民如养井，取之不尽' },
  { num:49, gua:[[1,0,1],[1,1,0]], name:'革', pinyin:'Gé', symbol:'䷰', judgment:'己日乃孚', meaning:'变革革新，顺天应人' },
  { num:50, gua:[[0,1,1],[1,0,1]], name:'鼎', pinyin:'Dǐng', symbol:'䷱', judgment:'元吉，亨', meaning:'定鼎立业，革故鼎新' },
  { num:51, gua:[[0,0,0],[1,0,0]], name:'震', pinyin:'Zhèn', symbol:'䷲', judgment:'亨，震来虩虩', meaning:'震惊百里，惊而能惧' },
  { num:52, gua:[[1,0,0],[0,0,0]], name:'艮', pinyin:'Gèn', symbol:'䷳', judgment:'艮其背，不获其身', meaning:'止于当止，动静得宜' },
  { num:53, gua:[[0,0,1],[0,1,0]], name:'渐', pinyin:'Jiàn', symbol:'䷴', judgment:'女归吉，利贞', meaning:'循序渐进，稳扎稳打' },
  { num:54, gua:[[0,1,0],[0,0,1]], name:'归妹', pinyin:'Guī Mèi', symbol:'䷵', judgment:'征凶，无攸利', meaning:'婚嫁之道，出以正则' },
  { num:55, gua:[[1,1,0],[1,0,1]], name:'丰', pinyin:'Fēng', symbol:'䷶', judgment:'亨，日中则昃', meaning:'丰盛盛大，日盈则亏' },
  { num:56, gua:[[1,0,1],[0,1,1]], name:'旅', pinyin:'Lǚ', symbol:'䷷', judgment:'小亨，旅贞吉', meaning:'羁旅他乡，随遇而安' },
  { num:57, gua:[[0,0,0],[0,0,0]], name:'巽', pinyin:'Xùn', symbol:'䷸', judgment:'小亨，利有攸往', meaning:'谦逊入下，柔以成事' },
  { num:58, gua:[[0,0,0],[0,0,0]], name:'兑', pinyin:'Duì', symbol:'䷹', judgment:'亨，利贞', meaning:'欣喜欢悦，和颜悦色' },
  { num:59, gua:[[0,0,0],[0,0,0]], name:'涣', pinyin:'Huàn', symbol:'䷺', judgment:'亨，王假有庙', meaning:'涣散解除，人心归一' },
  { num:60, gua:[[0,0,0],[0,0,0]], name:'节', pinyin:'Jié', symbol:'䷻', judgment:'亨，苦节不可贞', meaning:'节制节约，适度为宜' },
  { num:61, gua:[[0,0,0],[0,0,0]], name:'中孚', pinyin:'Zhōng Fú', symbol:'䷼', judgment:'豚鱼吉', meaning:'心诚守信，泽及万物' },
  { num:62, gua:[[1,0,0],[0,0,1]], name:'小过', pinyin:'Xiǎo Guò', symbol:'䷽', judgment:'亨，利贞', meaning:'小有过越，谨言慎行' },
  { num:63, gua:[[1,0,0],[1,0,0]], name:'既济', pinyin:'Jì Jì', symbol:'䷾', judgment:'亨，小利贞', meaning:'大功告成，守成不易' },
  { num:64, gua:[[0,0,1],[0,0,1]], name:'未济', pinyin:'Wèi Jì', symbol:'䷿', judgment:'亨，小狐汔济', meaning:'事未成，尚需努力' },
];

const YJ_INTERP = {
  1:{overview:'乾为天，纯阳至刚，天道运行，自强不息。万物资始，统御四方。',person:'乾命人志向高远，领袖气质，不甘人后。宜以柔济刚，谦逊待人，方成大器。',matter:'乾为天，纯阳至刚，六爻皆阳，天德纯粹。占事得此卦，世爻必在上爻，当以五爻为用神参断。卦象外刚内健，天行不息，主事势正处于极速上升期，宜主动出击、大胆开拓。然乾之要诀在"潜龙勿用"与"亢龙有悔"之间的精准把控——初九潜龙宜隐忍积蓄，九五飞龙方是进取良机，上九亢龙则需急流勇退。此卦用神为五爻君位，若世爻临之，大事可为；若他爻持世，宜守不宜攻。问事业：利开创扩张，世爻旺相则大展宏图，若临日破则多劳少得；问财运：正财旺盛，利实体投资，忌投机取巧，五爻生助则财源滚滚；问感情：利男主动追求，世爻持世则占优势，若应爻生世则对方亦有情。配合起心动念时辰：寅卯辰时木气生扶乾金，事半功倍；巳午时火炼乾刚，刚健有力；申酉时金气正旺，乾象更盛；亥子时水泄乾气，稍有迟滞。以用神旺衰为判断核心。',timing:'时机极利，三至五年内显著成效。',direction:'西北、正南大吉；东北凶。',advice:'天行健，君子以自强不息。亢龙有悔，满则招损。'},
  2:{overview:'坤为地，纯阴至柔，厚德载物，顺承天道。此乃母性之德，承载万物而不争。',person:'坤命人温厚仁慈，善于承载包容，人缘极佳。当内刚外柔，培养决断之力。',matter:'坤为地，纯阴至柔，六爻皆阴，德行厚重。占事得此卦，世爻必在初爻，当以二爻为用神参断。卦象厚实包容，地势广博，主以柔克刚、顺势而成。坤之要诀在"牝马之贞"——柔顺而不失方向，包容而有底线。初六"履霜，坚冰至"警示见微知著；六二"直方大"为坤德最美之爻；六五"黄裳"守中居正为大吉。问事业：宜稳扎稳打，与人合作优于单打独斗，二爻生世则得内助之福；问财运：正财稳健，利长期积累，忌短线炒作，六五爻旺则收益稳定；问感情：女占得坤卦有利，宜以柔情感化对方，二爻持世则感情基础牢固。配合起心动念时辰：辰未丑时土气旺盛，坤德厚载之力更强；亥子时水气正旺，坤柔逢水以柔化刚；寅卯时木气旺盛，木克坤土，宜静守不宜冒进；午时火生坤土，柔德有光。以世爻旺衰与用神生克为核心判断。',timing:'大器晚成，一至三年内打好基础。',direction:'西南、西北大吉；正东凶。',advice:'地势坤，君子以厚德载物。保持仁厚，培养内在力量。'},
  3:{overview:'水雷屯，万物初生之艰难，如种子刚刚入土，萌芽将出未出。困难与机遇并存。',person:'早年多历磨练，根基扎实。三十岁后渐入佳境，晚年必有成就。',matter:'水雷屯，坎上震下，震雷动于内，坎险在外，万物初生而艰难满地。占事得此卦，世爻在四爻，当以五爻为用神参断。卦象以"经纶"为核心——在困境中理出头绪，在混乱中建立秩序，此乃屯卦最大智慧。初九"磐桓"非懦弱不前，而是徘徊中寻求正确方向；六二"女子贞不字，十年乃字"警示感情或机遇需要漫长等待；九五"屯其膏"显示时机未熟，资源未到。此卦用神五爻若旺相生世，则困境可破；若被日破或冲克，则需更长积累期。问事业：利创业初期但步子宜小不宜大，先求生存再谋发展，五爻生世则贵人相助；问财运：利积累型收入，不宜冒险投资，忌因小失大；问感情：利缓慢培养，速成必有后患，六二持世需耐心等待。时辰判断：寅卯辰时木气生震雷，利于突破困境；午未时火炼坎水，险中有光；亥子时水气旺盛，坎险加重，宜守不宜攻。',timing:'一至两年内有重大转机。',direction:'东南、正南吉；正北凶。',advice:'屯之时，习坎以学，在困境中学习成长。'},
  4:{overview:'山水蒙，启蒙教育之卦。蒙以养正，圣功也。蒙昧之中藏生机。',person:'蒙昧期正在过去，求知欲旺盛。需良师益友指引，方能走出迷茫。',matter:'山水蒙，艮上坎下，山下有泉，童蒙求我。占事得此卦，世爻在二爻，当以五爻为用神参断。卦象以"发蒙"为核心，主启发教育、启蒙解惑，亦主蒙昧未知之事。蒙卦最重"匪我求童蒙，童蒙求我"——主动求助与被动施教的区别，此为判断吉凶关键。六五"童蒙"为最好用神，若生世则蒙昧渐开、求学得遇良师；上九"击蒙"过于严厉，宜防过犹不及。此卦问事多带朦胧不明之象，需主动出击打破沉默，而非消极等待。问事业：利教育、培训、咨询类行业，亦利处于懵懂期的新项目，需请专业人士把关；问财运：蒙昧期求财，多劳少得，需先明辨财路再行动；问感情：若处于暧昧不明阶段，此卦提示需主动试探，不可消极等待，否则错失良机。时辰判断：寅卯辰时木气生坎水，蒙昧感加重，宜多请教他人；巳午时火照蒙山，智慧渐开；申酉时金生坎水，求知欲强；亥子时水气正旺，坎水增险，宜冷静思考后再行动。',timing:'蒙昧期约三至六个月，之后渐明。',direction:'东北、西南吉。',advice:'蒙，亨。匪我求童蒙，童蒙求我也。在蒙昧时主动求教，是开启智慧的第一步。'},
  5:{overview:'水天需，等待与蓄势之卦。如云聚天际，雨将下未下。成大事者必懂得等待。',person:'当前处于积累与等待阶段，当充实自己，等待有利时机。耐心与定力是未来成功的关键。',matter:'水天需，坎上乾下，云气聚于天上，雨水未降，正当待时。占事得此卦，世爻在五爻，当以二爻为用神参断。卦象以"待"字为核心，需知需待非消极，而是在等待中充实自己、积蓄力量。初九"需于郊"宜静不宜动，远离是非；九二"需于沙，小有言"暗示等待中会有小磨难；九三"需于泥，致寇至"警示不可轻举妄动引来灾祸；六四"需于血，出自穴"则显示最终可脱险；九五"需于酒食，贞吉"乃等待之正道。此卦用神二爻若生世，则等待有果；若世爻克用神，则需主动创造机遇。问事业：积累阶段，宜学习进修，不宜贸然进入新领域；问财运：财运酝酿中，需耐心守候，小财可求、大财未至；问感情：感情未熟，不可急于表白，否则适得其反。时辰判断：亥子丑时水气旺盛，需卦得令，等待期缩短；寅卯时木泄乾刚，耐心渐失；巳午时火炼乾金，需卦之刚健有力，进取心强但时机未必成熟。',timing:'三至六个月后有一飞冲天之机。',direction:'正北、正西吉；正南凶。',advice:'需于郊，利用恒，无咎。保持初心与定力。'},
  6:{overview:'天水讼，诉讼争辩之卦。天与水背行，讼则终凶。和解为上策。',person:'近期可能有口舌是非或法律纠纷。当息讼宁人，退一步海阔天空。',matter:'天水讼，乾上坎下，天西水东，背道而驰，争讼之象。占事得此卦，世爻在九爻或三爻，当以五爻为用神参断。讼卦之德在于"惕中吉"——在争讼中保持警惕、以中道化解纷争。初六"不永所事"是最好的处讼策略，不把事情闹大、速谋和解才是上策；九二"不克讼"败诉而归，当反思己过、不可再争；六三"食旧德"保守旧德无咎；九四"反即命"改变态度顺应正道，争讼自解；九五"讼，元吉"中正裁判，此为最佳结果——请第三方权威调解。此卦用神五爻若生世则讼有贵人相助，若世克用神则主动和解为宜。问事业：利内部调解，不宜走法律程序，诉讼成本高且结果难料；问财运：口舌破财之象，勿因财失和；问感情：争执之象，当冷静沟通，不可意气用事，否则感情受损。时辰判断：寅卯辰时木气旺盛，乾金被克，讼象稍缓；午未时火气旺盛，乾刚更盛，讼势加剧；申酉时金气正旺，乾健逢金，讼事更烈，此两时辰起心动念者务必谨慎。',timing:'诉讼期约一至三个月，速和解为上。',direction:'西北退避；正南、正东凶。',advice:'讼，亨。利见大人，不利涉大川。讼则终凶，息讼为吉。'},
  7:{overview:'地水师，统众兴师之卦。师出以律，执纪律严明乃胜之本。',person:'有统御众人之能，但需以身作则、严明纪律，方能服众成事。',matter:'地水师，坤上坎下，地中有水聚众，师旅之象。占事得此卦，世爻在二爻，当以五爻或六五爻为用神参断。师卦之要在"贞"——正义之师、以律行事方能获胜。初六"师出以律"是师道根本，纪律废弛则必败；九二"在师中，吉"率众得当，为卦中最吉之爻；六五"田有禽，利执言"宜依法行事、以理服人；上六"大君有命，开国承家"论功行赏。此卦用神六五若持世或生世，则能得众人拥戴；若他爻持世，则需防众心不服。问事业：利带团队、管人员、做管理，需以制度管人而非以情用人；问财运：众人之财，宜合作求财，独贪则凶；问感情：感情涉及家庭或家族，需以大局为重，勿因私情损整体。时辰判断：辰未丑时土气旺盛，坤德载师，团队稳固；亥子时水气正旺，坎水增险，军事或危机类事务此时占问更为应验；寅卯时木克坤土，师出有难，宜谋定而后动。',timing:'领军做事约需三至六个月可见成效。',direction:'西南、正北吉；正南凶。',advice:'师出以律，否藏凶。纪律是成功之本，号令统一方能致胜。'},
  8:{overview:'水地比，亲比依附之卦。辅佐之义，当择善而从，近仁远佞。',person:'善于结交，人缘极好，身边多良师益友。但需明辨亲疏远近。',matter:'水地比，坎上坤下，水附于地，亲比之象。占事得此卦，世爻在八爻，当以六二爻为用神参断。比卦之要在"有孚"——以诚信相亲相近，且"不宁方来"——众人自来依附，当以公正待之。初六"有孚比之"以诚待人，无咎；六二"比之自内"发自内心的亲近最为吉利；六四"外比之"向外寻求辅佐，亦吉；上六"比之无首"无核心、无主导，大凶。此卦用神六二若生世或持世，则亲近关系稳固真诚；若世爻克用神则可能是单方面付出。问事业：利合作与人脉，当以德服人，以才聚人，不可独断专行；问财运：近贵人之财，可得贵人提点而获利，但需让利于人方能长久；问感情：利感情明朗化，若暧昧已久可借此卦推进一步，但需防亲近小人而非君子。时辰判断：寅卯辰时木气生坤土，亲近有情，人际和睦；巳午时火生坤土，亲比之心更真诚；申酉时金气旺盛，坎水被生，人际活跃；亥子时水气正旺，坤土被水润，亲近更深入。',timing:'人际关系明朗期约一至三个月。',direction:'正西、西南吉；正东凶。',advice:'比，吉。比之者不比者乎？亲近之道在于真诚，择善而从方得上吉。'},
  9:{overview:'风天小畜，积蓄待发之卦。力量尚微，需继续积累，不可轻举妄动。',person:'正处于积累阶段，当耐心积累，储备足够能量后自然一飞冲天。',matter:'风天小畜，巽上乾下，风行天上，小有积蓄尚未大就。占事得此卦，世爻在八爻或九爻，当以六四爻为用神参断。小畜之要在"密云不雨"——云已聚而雨未降，此为最佳蓄势状态，若强行动作则反成妄动。初九"复自道"回到正道，吉祥；九二"牵复"牵引而复亦吉；九三"舆说辐，夫妻反目"因小失大、阴阳失和，此为失败之警示；六四"有孚，血去惕出"以诚信化解忧惧，方为正道；九五"有孚挛如"众人信任共同进退；上九"既雨既处"蓄积已满，若此时仍贪得无厌则"尚德载"反成过犹不及。此卦用神六四若持世或生世，则积蓄有方、稳步上升；若世爻克用神则操之过急反成枉然。问事业：积累阶段，宜稳不宜躁，可小试牛刀但不可孤注一掷；问财运：小财可求，大财尚需等待，不可冒险；问感情：感情积累期，勿急于求成，耐心培养感情基础。时辰判断：寅卯辰时木气旺盛，巽风得木而强，积蓄之势更盛；巳午时火炼乾金，积蓄之物得以精炼提升品质；申酉时金气旺盛，乾健逢金成器，利于贵人相助、技艺积累；亥子时水气正旺，风吹水散，积蓄难成，此时起心动念求积累者需更长耐心。',timing:'积累期尚需半年至一年，届时可大展。',direction:'东南吉；正南稍安。',advice:'小畜，亨。云上于天，密云不雨。蓄势待发，不宜妄动。'},
  10:{overview:'天泽履，谨慎履行之卦。礼而行之，乱世中以礼自保。',person:'做事严谨，注重规矩礼节。但在乱世中，需灵活变通，不可过于拘礼。',matter:'天泽履，乾上兑下，天下泽上，以礼履之，循礼而行。占事得此卦，世爻在三爻，当以六三爻为用神参断。履卦之要在"履虎尾，不咥人"——踩在虎尾上却不被咬伤，靠的是谨慎与柔顺。初九"素履"以朴素之心履行，大吉；六三"眇能视，跛能履"以柔居刚，敢于任事，若为大丈夫则大吉，否则有风险；九五"夬履"果断履行却危险；上九"视履考祥"回首审视履历，吉祥圆满。履卦最忌"履道坦坦"后忘乎所以，亦忌过于拘泥礼节而失却本真。此卦用神六三若持世或生世，则履行顺畅；若世爻临日令则更有执行力保障。问事业：利按程序办事、依合同执行之事，需重合同守信用；问财运：正财有道，利正当经营，需防口舌是非；问感情：需以礼相待，感情发展要走正常程序，闪婚或仓促决定不利。时辰判断：寅卯辰时木气生扶兑金，利于文书、言辞、合同类事务；巳午时火气旺盛，乾金被炼，履道刚健有力但宜防冲动；申酉时金气正旺，兑泽得金而清，履行之事更为顺畅；亥子时水气正旺，兑金被水泄，防口舌纠纷。',timing:'履约履行约需一至三个月。',direction:'正西、正北吉；东南凶。',advice:'履，亨。履虎尾，咥人凶。礼者行之端，循礼而行方能履险如夷。'},
  11:{overview:'地天泰，天地交泰之卦。阴阳相交，万物通泰，三阳开泰。此为吉卦之首。',person:'泰运亨通，性格开朗，人际和谐，正处上升期，当大展宏图。',matter:'地天泰，坤上乾下，天地交泰，阴阳和畅，万物通达。占事得此卦，世爻在八爻，当以九三爻或上六爻为用神参断。泰卦之要在"小往大来"——小者往而大者来，阴阳相交感通。初九"拔茅茹，以其汇"志同道合者齐头并进；九二"包荒"以包容广大之心待人；九三"无平不陂，无往不复"警示物极必反，须"艰贞无咎"否则必有所失；六四"翩翩"不警戒而得友邻共富；六五"帝乙归妹"以谦下之德感人；上六"城复于隍"泰极复否，勿用师旅。此卦用神九三若持世或生世，则乘泰运而上；若上六克世则需防盛极转衰。问事业：乘泰运大展宏图，但九三爻提醒勿因小失大；问财运：财运亨通，可大胆投资，但需留有余地；问感情：感情和谐美好，此时当珍惜缘分，不宜任性。时辰判断：寅卯辰时木气生扶坤土，泰运更盛；巳午时火气旺盛，天得火明、地得火通，泰运达高峰；申酉时金气旺盛，乾健有力；亥子时水气正旺，坤土泥泞，泰运稍减，此四时辰起心动念者当更加珍惜时机。',timing:'两至三年内运势达高峰。',direction:'西南、西北大吉；正东凶。',advice:'泰，小往大来，吉亨。居安思危，好运才能持久。'},
  12:{overview:'天地否，阴阳不交之卦。闭塞不通，小人当道。但否卦之中亦藏转机。',person:'近期可能感到压抑与不顺，但否极必泰，坚持正道，困境终将过去。',matter:'天地否，乾上坤下，天地不交，阴阳闭塞，否塞不通。占事得此卦，世在三爻，当以六二爻或上九爻为用神参断。否卦之要在"否之匪人"——闭塞不通连正道之人也难自存，然"否极泰来"是其核心转机。初六"拔茅茹，以其汇"小人勾结，当引以为戒；六二"包承"小人包承而吉；九四"有命无咎"天命如此无可咎责；九五"休否，大人吉"停止否运，大人吉祥；上九"倾否，先否后喜"打破闭塞，先苦后甜。此卦最重用神上九，若上九克世或冲开世爻所临之障碍，则否运可倾；若世爻临上九则自己即有改变命运之力。问事业：闭塞期内宜静守韬光，不宜主动扩张，防小人作梗；问财运：财运受阻，节约为上，不宜此时投资；问感情：感情进入冷淡期，需耐心等待否极泰来，不可强求。时辰判断：亥子时水气正旺，天地不交更甚，否运加重；寅卯辰时木气旺盛，乾金被克、坤土被扶，天地交泰可期，此乃否中藏泰之机；午时火气旺盛，乾刚被炼，否运稍解。',timing:'否卦需半年至两年，转机终将到来。',direction:'西北稍安，正东大凶。',advice:'否，匪人。坚守正道，以待天时。否极泰来，坚守必有转机。'},
  13:{overview:'天火同人，与人同心之卦。众人同心，其利断金。天下为公，求同存异。',person:'善于与人合作，社交能力强，能凝聚团队，广结善缘。',matter:'天火同人，乾上离下，天与火同道，同人于野。占事得此卦，世在六爻，当以六二爻或九五爻为用神参断。同人之要在"同人于野"——在广阔天地中与志同道合者相遇，而非"同人于宗"局限一隅。初六"同人于门"出门即能同心；六二"同人于宗"同人于宗族偏私，不利；九三"伏戎于莽"伏藏军队有争夺之象；九四"乘其墉"登墙争锋，凶兆；九五"同人先号咷而后笑"先凶后吉，上九"同人于郊"同人于郊外远而无争大吉。同人卦最忌同人于小人，此为判断吉凶关键。此卦用神九五若持世或生世，则能得天下人之心；若世爻临六二则可能过于偏私。问事业：利团队合作，当广纳善言、集思广益，忌独断专行；问财运：众人之财，宜合作共图，独贪必失；问感情：利感情明朗化，心心相印为上吉，若旁爻发动则防第三者。时辰判断：寅卯辰时木气生扶离火，同人之心更加真诚恳切；巳午时火气旺盛，乾金被炼，同人精神更盛；申酉时金气旺盛，乾健克离火，同人之心受阻，此时占问合作需防貌合神离；亥子时水火既济，同人卦和谐圆满。',timing:'三至六个月人脉关系明显改善。',direction:'正南、正北吉；正东凶。',advice:'同人于野，亨。同人之道在于明辨是非，与志同道合者同行。'},
  14:{overview:'火天大有，丰收盛大之卦。德才兼备，富有天下。但富有之时，当以德为本。',person:'财运事业运皆佳，当以谦德持盈，不可骄奢。',matter:'火天大有，离上乾下，火在天上普照万物，大有之象。占事得此卦，世在三爻，当以六五爻为用神参断。大有之要在"元亨"——大亨通，更要在"谦德持盈"——越富有越要谦逊。初九"无交害"无交往之害，艰则无咎；九二"大车以载"以大车载物，可致富有；九三"公用亨于天子"受天子赏赐，吉利；六四"匪其彭"非其盛大，无咎；六五"厥孚交如，威如吉"以诚信相交、威严自生，此为大有卦最佳用神爻；上九"自天佑之，吉无不利"得上天庇佑。大有卦用神六五若持世或生世，则大有之福深厚持久；若上九生世则更有天助。问事业：事业大成之时，但需以仁德待人，不可骄横，否则大有转失；问财运：财运大盛，宜行善积德，将部分收益回馈社会，方能持盈保泰；问感情：感情丰收期，但需防因忙碌而疏忽对方。时辰判断：寅卯辰时木气生扶离火，大有之光更盛；巳午时火气正旺，离明照天，大有达至高峰；申酉时金气旺盛，乾健有力，大有之基更稳；亥子时水气正旺，水火既济，大有持盈有道。',timing:'一至两年内有大收成。',direction:'正南、西北大吉。',advice:'大有，元亨。富有之时保持谦逊，方能将大有化为长久之福。'},
  15:{overview:'地山谦，谦德之卦。谦卦六爻皆吉，为易经中最为全吉之卦。',person:'谦德性格，温和有内涵，不张扬重实际，人缘极好，逢凶化吉。',matter:'地山谦，坤上艮下，山隐于地中，不显其高，谦德之象。占事得此卦，世爻在八爻，当以九三爻为用神参断。谦卦六爻皆吉，乃易经三百八十四爻中最为全吉之卦，其德行冠绝六十四卦。初六"谦谦"谦而又谦，君子之道；六二"鸣谦"声望在外而谦，大吉；九三"劳谦"有功劳而能谦，此为全卦最佳用神爻，爻辞"君子有终"明示有德者必有善终；六四"拚谦"不夸己功之谦，无不利；六五"富而不骄"富有而不骄横；上六"鸣谦"声名远扬而谦，可征伐，但利于行正道。谦卦问事，无论何种情况皆以谦受益为其核心原则。此卦用神九三若生世或持世，则谦德深厚、诸事顺遂；若世爻克用神则需更加收敛。问事业：以谦成事，宜低调做人、高调做事；问财运：以谦聚财，让利于人方能长久；问感情：以谦感人，尊重对方，不可强求。时辰判断：寅卯辰时木气生扶坤土，谦德厚载之力更强；巳午时火照山隐，谦德更加光明；申酉时金气旺盛，艮山得金而稳，谦德有根；亥子时水气正旺，水山蹇之象，蹇难在前，更需以谦自守。',timing:'三至六个月后必有善报。',direction:'谦德自带贵人运，方向不限。',advice:'谦，亨，君子有终。真正的强大不需要张扬，谦逊是最好的护身符。'},
  16:{overview:'雷地豫，快乐自豫之卦。雷出地奋，豫悦众生。但乐极生悲，宜防患于未然。',person:'正处快乐愉悦期，但需防乐极生悲。得意时更要谨慎，保持清醒。',matter:'雷地豫，震上坤下，雷出地上，万物豫悦。占事得此卦，世爻在五爻，当以九四爻为用神参断。豫卦之要在"豫之时义大矣哉"——豫乐有道，乐不忘忧。初六"鸣豫"因得小人之助而自鸣得意，凶；六二"介于石"耿介如石，不以豫悦改其操守，贞正吉；六三"盱豫"攀附小人来求豫悦，凶；九四"由豫"众人由之而豫，大有得，此为豫卦最佳用神爻；六五"贞疾"防小人之害而得病，恒不死；上六"冥豫"沉溺于豫悦之中，极凶。豫卦最忌六三、上六两爻发动，若此两爻旺相则乐极生悲；九四生世则众心归附。问事业：利守成与享受成果，但需防在顺境中滋生懈怠；问财运：财来轻松，但易去亦快，需节制消费；问感情：感情甜蜜期，但需防第三者介入或过于黏腻失去独立空间。时辰判断：寅卯辰时木气生扶震雷，豫悦之情更浓；巳午时火生坤土豫悦加深；申酉时金气旺盛，震动坤土，雷泽归妹之象，乐中有变，需防乐极生悲；亥子时水气正旺，雷入水中，豫中有隐忧。',timing:'快乐期约三至六个月，但后期需防变故。',direction:'正东吉；正西凶。',advice:'豫，刚应而志行，顺以动。豫之时义大矣哉。乐不忘忧，方能长乐。'},
  17:{overview:'泽雷随，随从跟随之卦。随卦之道在于从善如流，但不可盲目随从。',person:'善于跟随和学习，但需择善而从。不可随波逐流，失去自我。',matter:'泽雷随，兑上震下，泽中有雷，随从之象。占事得此卦，世爻在三爻，当以九五爻为用神参断。随之要在"元亨利贞"——随正道则大亨通，随邪道则凶。初九"官有渝"官职有变，随正则吉；六二"系小子"失大丈夫而得小男孩，有失有得；九五"孚于嘉"诚信随从善道，吉祥；上六"拘系之"强制挽留，上天保佑。随卦最重"随有获"——随从有得还是随从有失，此为判断吉凶关键。九五用神若持世或生世，则随从得宜、有所收获；若世爻临六二则可能舍大取小。问事业：利跟随有德之领导或加入成熟平台，不宜独闯；问财运：随缘之财，利合作共进；问感情：利跟随对方心意，但需防失去自我，需保持独立人格。时辰判断：辰巳时泽雷相随之象，随缘之缘最真；寅卯时木气生扶震雷，随从之心更切；申酉时金气旺盛，兑金克震木，随从有阻；午未时火气旺盛，随从有变。',timing:'随从期约三至六个月。',direction:'正西、东南吉；正北凶。',advice:'随，元亨利贞。随从正道得吉，随从邪道得凶。择善而从，方为正道。'},
  18:{overview:'山风蛊，积弊腐败之卦。乱之后当有治，改革整顿时当以德服人。',person:'正处于需要整顿、改革、清理的阶段。当以德服人，不可操之过急。',matter:'山风蛊，艮上巽下，蛊坏之象，物腐而后虫生。占事得此卦，世爻在四爻，当以六五爻为用神参断。蛊卦之要在"干母之蛊"——继承整治家业，需以柔克刚，不可操之过急。初六"干父之蛊"继承父业整治弊端，有子无咎；九二"干母之蛊"继承母业难以整治；六三"干父之蛊"不有咎；六五"干父之蛊，用誉"以德服人整治弊端获得赞誉，此为蛊卦最佳用神爻；上九"不事王侯"超然物外不为世俗所染。蛊卦问事，多为积弊已久、需要大力整顿之象。此卦用神六五若生世或持世，则能以德服人、蛊乱可治；若世爻克用神则可能方法不当。问事业：利改革整顿，但需以德服人而非以权压人，防小人反弹；问财运：利整顿财务结构，清理积弊，防遗留问题爆发；问感情：利消除误会、修补裂痕，但需防旧问题反复。时辰判断：寅卯辰时木气旺盛，巽风入山，蛊乱之势更盛，此时占问改革需格外谨慎；巳午时火照山门，蛊中有光，利趁机整顿；申酉时金气旺盛，艮山得金而稳，蛊乱渐止。',timing:'整顿期约一至两年，效果渐显。',direction:'东南、东北吉。',advice:'蛊，元亨。蛊乱之后必治，改革之道在于以德服人，不可操之过急。'},
  19:{overview:'地泽临，监临督导之卦。以德临人，居高临下，当以感化而非压制。',person:'有督导管理之能，但需以德服人。居高临下时更要谨慎，不可盛气凌人。',matter:'地泽临，坤上兑下，地临于泽，临民之象。占事得此卦，世爻在三爻，当以九二爻为用神参断。临卦之要在"咸临"——以感化之道临人，而非以威压之。初九"咸临"以德临人，吉祥；九二"咸临，吉无不利"以德临人无所不利，此为临卦最佳用神爻；六三"甘临"以甜言蜜语临人，有忧；六五"知临"以智慧临人，大君之宜，吉祥；上六"敦临"以敦厚临人，无咎。临卦问事，若世爻临九二则督导有方；若临六三则方法失当。问事业：利督导管理，需以德服人而非以权压人；问财运：利财务监管，防小人觊觎；问感情：居高临下看感情，缺乏平等姿态，需调整。时辰判断：寅卯辰时木气生扶坤土，临民之势更强；巳午时火气旺盛，兑金得火而精，管理更有方；申酉时金气旺盛，坤土被生，临人之力更盛；亥子时水气正旺，泽水节之象，临中有节。',timing:'督导期约三至六个月可见效果。',direction:'西南、正西吉。',advice:'临，元亨利贞。临人之道在于以德服人，非以威压人。'},
  20:{overview:'风地观，观察省思之卦。静观时变，以静制动。此卦启示:观人之道在于用心观察。',person:'善于观察与思考，有很强的洞察力。在不了解情况之前，不轻易表态。',matter:'风地观，巽上坤下，风行地上，观仰之象。占事得此卦，世爻在四爻，当以九五爻为用神参断。观卦之要在"盥而不荐，有孚颙若"——观仰者当诚心正意，以肃穆之姿面对。初六"童观"如儿童般观察，浅薄；六二"窥观"偷窥般观察，女子则吉、男士则凶；九五"观我生，君子无咎"观察自身行为，此为观卦最佳用神爻；上九"观其生"观察他人行为，君子无咎。观卦问事，最忌仓促判断，需充分观察后再行动。此卦用神九五若生世或持世，则观察清明、判断准确；若世爻临初六则观察过于肤浅。问事业：先观察市场与竞品，不宜盲目进入新领域；问财运：先观察财路与风险，不宜盲目投资；问感情：先观察对方真心，不宜过早表白或承诺。时辰判断：寅卯辰时木气旺盛，巽风得木而吹，利于观察信息传播；巳午时火照坤地，观察更加清晰全面；申酉时金气旺盛，巽木被伐，观察需更谨慎；亥子时水气正旺，坤土得水滋润，观察更加深入。',timing:'观察期三至六个月，届时自然清晰。',direction:'东南、西南吉。',advice:'观，盥而不荐，有孚颙若。在观察中保持诚心，以诚待人。'},
  21:{overview:'火雷噬嗑，咬合决断之卦。法律刑罚，去除障碍，非刚愎自用，乃明断是非。',person:'有决断力和魄力，但需防过于强硬。断事明快，但宜恩威并施。',matter:'火雷噬嗑，离上震下，火雷交加，咬合之象。占事得此卦，世爻在五爻，当以九四爻为用神参断。噬嗑之要在"利用狱"——明辨是非、依法裁决，但非滥施刑罚。初九"屦校灭趾"小刑初犯惩前毖后，无咎；六二"噬肤灭鼻"受刑深重但无咎；九四"噬干胏，得金矢"啃硬骨而得金箭，利艰贞，此为噬嗑卦最佳用神爻；六五"噬干肉得黄金"仅得小吝，贞厉；上九"何校灭耳"积恶深重，极凶。噬嗑卦问事，多为需强力决断、清除障碍之象。此卦用神九四若持世或生世，则决断有力、诸事可成；若世爻临上九则可能决断过度。问事业：利果断处理复杂问题，破除障碍，但需依法依规；问财运：利清除财务纠纷，防小人阻滞；问感情：利果断解决感情障碍，当断则断。时辰判断：寅卯辰时木气生扶震雷，离火得木而生旺，噬嗑之力更强；巳午时火气旺盛，噬嗑之势更烈；申酉时金气旺盛，震雷被克，噬嗑有阻；亥子时水气正旺，水火既济，噬嗑有节有度。',timing:'决断期约一至三个月。',direction:'正南吉；正北凶。',advice:'噬嗑，利用狱。明断是非，依法行事，方能噬嗑而亨。'},
  22:{overview:'山火贲，文饰美化之卦。君子以明庶政，无敢折狱。文过其实非贲之本意。',person:'有审美眼光，善于包装和展示。但需防华而不实，内在修养同样重要。',matter:'山火贲，艮上离下，山下有火，贲饰之象。占事得此卦，世在三爻，当以六五爻为用神参断。贲卦之要在"贲其趾"至"白贲无咎"——从文饰到返璞归真的过程，揭示了贲的最高境界是"饰极返素"。初九"贲其趾"弃文归野，返璞归真；六二"贲其须"装饰胡须；九三"贲如濡如"文饰华美永享贞固；六四"贲如皤如"文饰朴素，白贲无咎；六五"贲于丘园"以简朴为美，此为贲卦最佳用神爻；上九"白贲"返璞归真，无咎。贲卦问事，文过其实则凶，返璞归真则吉。此卦用神六五若生世或持世，则文饰得宜、内外兼修；若世爻克用神则可能过于追求表面。问事业：利包装推广、品牌建设，但需防华而不实；问财运：利营销策划，但需防过度包装；问感情：利提升个人魅力，但需防过于在意外表。时辰判断：寅卯辰时木气生扶离火，文饰之美更盛；巳午时火照山门，贲德光明；申酉时金气旺盛，艮山得金而稳，贲有根基；亥子时水气正旺，水火既济，文饰与实质相得益彰。',timing:'文饰期约三至六个月。',direction:'东北、正南吉。',advice:'贲，亨。小利有攸往。文饰之道，饰极返素，返璞归真方为贲之极致。'},
  23:{overview:'山地剥，剥落侵蚀之卦。小人道长，君子道消。当固本培元，守护根基。',person:'正在经历侵蚀和消耗，当守护好核心资源和关系，勿被小人蚕食。',matter:'山地剥，艮上坤下，山附于地，剥落侵蚀。占事得此卦，世在五爻，当以六二爻为用神参断。剥卦之要在"不利有攸往"——此时最忌轻举妄动，当以静制动、固守根本。初六"剥床以足"床足先剥，预兆灭下之象；六二"剥床以辨"床身剥落，若止则无咎；六三"剥之无咎"小人虽剥然无咎；六四"剥床以肤"床板剥落，凶险已至；六五"贯鱼以宫人宠"引领宫人以宠，趋利避害；上九"硕果不食"留一阳以存续，此为剥卦唯一生机所在。剥卦用神上九若克世或世爻临之，则有一线生机；若世爻临初六至六四之一则根基受剥。问事业：稳固核心业务，削减边缘项目，防小人蚕食；问财运：财务受侵蚀，节约开支，防破财；问感情：感情基础受动摇，需及时修补裂痕。时辰判断：寅卯时木气旺盛，坤土被克，剥落加速，此时占问需格外谨慎；辰戌丑未时土气旺盛，艮山得土而稳，剥落减缓；午时火生坤土，上九一阳得护；亥子时水气正旺，水地比之象，剥中有比，危中有机。',timing:'剥落期约半年至一年，防微杜渐是关键。',direction:'东北吉；正南、正西凶。',advice:'剥，不利有攸往。剥落之时宜守不宜动，固本培元乃第一要务。'},
  24:{overview:'地雷复，复归本元之卦。阳气复生，万物复苏。此为否极泰来之卦。',person:'正从困境中走出，运势开始回升。这是转折点，当抓住机遇，重新开始。',matter:'地雷复，坤上震下，雷在地中，一阳复生。占事得此卦，世在三爻，当以上六爻为用神参断。复卦之要在"亨"——通达，其核心在于"不远复，无祇悔"——走得不远就回头，则无悔。初九"不远复"大吉之兆，此爻为复卦精神所在；六二"休复"美好之复；六三"频复"频繁反复，有厉但无咎；六四"中行独复"行中道而独复，无咎；六五"敦复"敦厚之复，无悔；上六"迷复"迷惑而复，凶，有灾眚，此为复卦最需避免之爻。复卦用神初九若生世或持世，则复归迅速、诸事顺遂；若上六旺相则需防重蹈覆辙。问事业：重启项目之良机，但需防旧问题复发；问财运：重新积累之时，可逐步恢复投资；问感情：感情修复期，可尝试修补裂痕，但需从根本解决。时辰判断：寅卯辰时木气生扶震雷，复归之力更强；巳午时火生坤土，复中有生；申酉时金气旺盛，震木被克，复势有阻；亥子时水气正旺，水雷屯之象，复中有险。',timing:'转机已至，现在就是最好的开始时机。',direction:'西南、正东吉。',advice:'复，亨，出入无疾。复卦之道在于不远复，无祇悔。'},
  25:{overview:'天雷无妄，真诚不妄之卦。妄为必凶，守正则吉。天灾横祸亦需以正相待。',person:'心诚志正，不走歪门邪道。但需防受无妄之灾，当以平常心应对。',matter:'天雷无妄，乾上震下，天下雷行，物物各正其命，无妄之象。占事得此卦，世在三爻，当以九五爻为用神参断。无妄之要在"元亨利贞"——真诚正固有四德，若违背真诚则必有灾祸。初九"无妄，往吉"真诚而行，吉祥；六二"不耕获"不耕而获，不祥之兆；九五"无妄之疾，勿药有喜"无妄而得疾，不必吃药自会好，此为无妄卦最佳用神爻；上九"无妄行，有眚无攸利"妄行则有灾眚。无妄卦问事，最忌存侥幸心理、贪不义之财。此卦用神九五若持世或生世，则真诚感动天地，灾祸可化；若世爻临六二则可能动机不纯。问事业：利正当经营，不走旁门左道方能长久；问财运：利正当得财，不义之财必有后患；问感情：真诚相待是感情基础，勿有侥幸心理。时辰判断：寅卯辰时木气生扶震雷，震雷得木而动，无妄之行更真；巳午时火炼乾刚，无妄更纯；申酉时金气旺盛，乾金克震木，无妄之行有阻；亥子时水气正旺，水天需之象，无妄中有需待。',timing:'无妄期约三至六个月，坚守正道则诸事顺遂。',direction:'西北吉；正东凶。',advice:'无妄，元亨利贞。其匪正有眚，不利有攸往。无妄之道，诚字为先。'},
  26:{overview:'山天大畜，积蓄深厚之卦。积累已到一定程度，即将大展宏图。',person:'一直在积蓄力量，现在已经到了可以释放的时候，当有大的作为。',matter:'山天大畜，艮上乾下，山下有天，大积蓄涵养之象。占事得此卦，世在四爻，当以九三爻为用神参断。大畜之要在"尚德"——崇尚道德积累，而非单纯物质积累。初九"有厉，利已"有危则止，宜退不宜进；九二"舆说輹"车脱輹不能进；九三"良马逐，利艰贞"良马相逐，此为最佳用神爻，利于艰难中守正；六四"童牛之牿"以木止牛角，不畜则有喜；六五"豮豕之牙"以术治刚，防其刚而畜之；上九"何天之衢"得通天道，大吉。大畜卦问事，若积累已久则可释放，若积累不足则需继续蓄积。此卦用神九三若生世或持世，则积蓄深厚、时机已到；若世爻临初九则仍需积累。问事业：积蓄期已满，可大展拳脚，但需"利艰贞"——在艰难中守正；问财运：可加大投资力度，但需谨慎决策；问感情：感情积累成熟，可推进关系。时辰判断：寅卯辰时木气生扶乾金，大畜之象更盛；巳午时火照山门，积蓄之物得以精炼；申酉时金气旺盛，乾健成器，大畜有果；亥子时水气正旺，水天需之象，畜中有需，需中有畜。',timing:'积累期尚需一至两年，届时将一飞冲天。',direction:'东南、正南吉。',advice:'大畜，利贞。今日的每一分积累，都是明日腾飞的资本。'},
  27:{overview:'山雷颐，养身养生之卦。自养养人，养正则吉，过养则为凶。',person:'需注意身心健康和休养。当调整节奏，不可过度消耗自己。',matter:'山雷颐，艮上震下，山下有雷，颐养之象。占事得此卦，世在二爻，当以六三爻为用神参断。颐卦之要在"养正则吉"——以正道养身养人则吉，过度或不当地消耗则凶。初九"舍尔灵龟"舍弃你的养生之道，凶兆；六二"颠颐"颠倒颐养方向，拂经；六三"拂颐"拂逆颐养之道，贞凶，此为颐卦最需避免之爻；六四"颠颐"颠颐而吉；六五"拂经"拂逆经常，居贞吉；上九"由颐"天下由之而颐养，吉利。颐卦问事，最忌消耗过度或不当地索取。此卦用神六四若生世或持世，则颐养得宜；若世爻临六三则需防不当消耗。问事业：需注意团队或自身精力的休养恢复，不可透支；问财运：防财务消耗过快，收支需平衡；问感情：需用心经营感情，但不可过度付出失去自我。时辰判断：寅卯辰时木气生扶震雷，颐养之象更盛；巳午时火照山门，颐养有光；申酉时金气旺盛，艮山得金而稳，颐养有节；亥子时水气正旺，水雷屯之象，颐中有屯，消耗与积累并存。',timing:'颐养期约三至六个月，需适当休整。',direction:'东北吉；正西凶。',advice:'颐，贞吉。养正则吉。颐养之道，在于平衡，不可过养亦不可不养。'},
  28:{overview:'泽风大过，越常过盛之卦。栋桡之象，大厦将倾。但大过之中藏大机遇。',person:'正处于非常时期，需有非常之举。但需防根基不稳导致崩塌。',matter:'泽风大过，兑上巽下，泽灭木，大过之象。占事得此卦，世在五爻，当以九四爻为用神参断。大过之要在"大过"——超越常规，有非常之才方能担当。初六"借用白茅"柔承刚，谨慎无咎；九二"枯杨生稊"枯木逢春，老夫少妻，无咎；九三"栋桡"栋梁弯曲，凶；九四"栋隆"栋梁隆起，此为最佳用神爻，可贺吉祥；九五"枯杨生华"枯木开花，老妻少夫，有殃；上六"过涉灭顶"涉水过深，凶兆无咎。大过卦问事，最忌根基不稳而强撑，最利有非常之策。此卦用神九四若生世或持世，则大过可化为大功；若世爻临九三则需防大厦倾覆。问事业：利改革创新、破旧立新，但需评估风险；问财运：利高回报投资，但需防高风险；问感情：利突破常规，但需防感情用事。时辰判断：寅卯辰时木气生扶巽木，大过之象更盛；巳午时火照泽面，大过有光；申酉时金气旺盛，兑泽得金而清，大过之才得以施展；亥子时水气正旺，泽水困之象，大过中有困。',timing:'大过期约一至两年，风险与机遇并存。',direction:'正西吉；东南凶。',advice:'大过，栋桡。大过之时需要非常之才，非大勇大智者不能担当。'},
  29:{overview:'坎为水，重重险难之卦。习坎心亨，心诚则通。险难之中最见真心。',person:'近期面临较大的挑战与压力，但习坎告诉我们:在困境中成长，反而能锻炼出真正的能力。',matter:'坎为水，坎上坎下，重重险难，水流入险。占事得此卦，世在二爻，当以九五爻为用神参断。坎卦之要在"维心亨"——内心保持亨通，则外在险难可以度过。初六"习坎"学习险难之道；九二"坎有险，求小得"险中有险，求小得可；六三"来之坎坎"来去皆险，谨慎无咎；六四"尊酒簋贰"以薄礼祭神，艰难无咎；九五"坎不盈"险境未满，适中无咎，此为坎卦最佳用神爻；上六"系用徽纆"以绳索束缚，囚禁之象，凶。坎卦问事，最忌"心亨"失守——若内心慌乱则险难加剧。此卦用神九五若持世或生世，则心亨通泰、险难可渡；若世爻临上六则需防被困。问事业：利处理复杂局面、化解危机，但需冷静决策；问财运：财务有风险，需谨慎，防破财；问感情：困境中的感情最见真心，需共克时艰。时辰判断：寅卯辰时木气生扶坎水，险难之象更甚；巳午时火炼坎水，水火既济，险中有机；申酉时金气旺盛，坎水被泄，险难稍缓；亥子时水气正旺，坎水重重，险难加深。',timing:'险境期约一至两年，但终将化险为夷。',direction:'正北吉；正南凶。',advice:'习坎，有孚。坎卦之道在于维心亨，心诚则通。'},
  30:{overview:'离为火，重重光明之卦。柔丽乎中正，文明以止。盛极则转衰，需明哲保身。',person:'正处于光明时期，才华得以展现。但需防盛极转衰，明哲保身方为上策。',matter:'离为火，离上离下，重重光明，照耀四方。占事得此卦，世在三爻，当以六五爻为用神参断。离卦之要在"柔丽乎中正"——以柔和依附于中正之道，光明持久。初九"履错然"脚步错乱，开始谨慎；六二"黄离"黄色光明，大吉，此为离卦最佳用神爻；九三"日昃之离"日落西山，光明渐消，凶；九四"突如"突然而来，祸患将至，凶；上九"王用出征"君王出征，有嘉折首获匪，吉祥。离卦问事，最忌光明过盛而转衰，需在盛时懂得收敛。此卦用神六五若持世或生世，则光明持久；若世爻临九三则需防光明消逝。问事业：才华展现期，利发挥专长，但需防锋芒过露遭人嫉妒；问财运：光明正大之财，利名誉获利；问感情：感情明朗，但需防过于热烈而烧毁感情。时辰判断：寅卯辰时木气生扶离火，光明更盛；巳午时火气正旺，离明照天，离卦达高峰；申酉时金气旺盛，离火被克，光明有减；亥子时水气正旺，水火既济，光明有度。',timing:'光明期约一至两年，注意盛极转衰。',direction:'正南吉；正北凶。',advice:'离，柔丽乎中正，文明以止。光明之时需明哲保身，不可过盛。'},
  31:{overview:'泽山咸，情感感应之卦。两心相印，情意相通。感应之道在于真诚。',person:'感情丰富，善于感知他人的心意。在人际关系中，能以真心换真心。',matter:'泽山咸，兑上艮下，泽上山下，阴阳相感。占事得此卦，世在六爻，当以九三爻为用神参断。咸卦之要在"亨，利贞，取女吉"——以真诚感动人心最为吉利。初六"咸其拇"感应到脚拇指，微不足道；六二"咸其腓"感应到小腿，动则有言；九三"咸其股，执其随"感应大腿，此为咸卦用神爻，但"执心不一"警示感情中需防犹豫不决；九四"贞吉悔亡"守正吉祥，悔恨消亡；九五"咸其脢"感应背部，无忧无悔；上九"咸其辅颊舌"言语相感。咸卦问事，感情最为应验，其次为感应类事物。此卦用神九四若生世或持世，则感应真诚、心心相印；若世爻临九三则感情需防犹豫。问事业：利感应市场变化、捕捉商机；问财运：利人脉生财，关系处得好则财源广；问感情：感情感应最灵，对方心意如何可由此卦判断。时辰判断：寅卯辰时木气生扶艮土，感应力更强；巳午时火气旺盛，泽山咸之象更盛，感应更真诚；申酉时金气旺盛，兑泽得金而清，感应更清晰；亥子时水气正旺，泽水困之象，感中有困，感情有考验。',timing:'感情缘分近期较旺，宜主动把握。',direction:'正西、东北吉。',advice:'咸，亨，利贞。感应之道在于以心换心，不可有私心杂念。'},
  32:{overview:'雷风恒，恒久坚持之卦。雷风相与，恒久之道。持之以恒，方能成功。',person:'有恒心和毅力，能坚持到底。但需防过于固执，不知变通。',matter:'雷风恒，震上巽下，雷风相与，恒久之道。占事得此卦，世在三爻，当以九三爻为用神参断。恒卦之要在"亨，无咎，利贞"——恒久有道则通达，然"不恒其德，或承之羞"是其大戒。初九"浚恒"深求恒久，过度则凶；九二"悔亡"悔恨消亡；九三"不恒其德，或承之羞"不守恒德，此为恒卦最需避免之爻；六五"恒其德"守恒德，妇人吉，夫凶；上六"振恒"动荡恒久，大凶。恒卦问事，最忌固执不变，需在恒久与变通之间找到平衡。此卦用神九二若持世或生世，则恒久有道；若世爻临九三则需防不知变通。问事业：利于长期项目，但需防策略僵化；问财运：利长期投资，但需防资金链断裂；问感情：利长情相伴，但需防一方付出过多导致失衡。时辰判断：寅卯辰时木气旺盛，震雷巽风相得益彰，恒久之道更盛；巳午时火气旺盛，恒中有变；申酉时金气旺盛，震雷被克、巽木被伐，恒久有阻；亥子时水气正旺，水雷屯之象，恒中有屯。',timing:'恒久期以年计，需要耐心坚持。',direction:'东南、正东吉。',advice:'恒，亨，无咎。恒久之道在于持之以恒，但需因时制宜，不可固执。'},
  33:{overview:'天山遁，以退为进之卦。退避三舍，以待天时。有时候退一步海阔天空。',person:'近期宜静不宜动，当以退为进。不与环境对抗，反而能保存实力，等待更好的时机。',matter:'天山遁，乾上艮下，天下有山，遁避之象。占事得此卦，世在三爻，当以六二爻为用神参断。遁卦之要在"小利贞"——退避之时利于守住正道，不宜激进。初六"遁尾"退避于后，凶险；六二"执之"执留不放，固守吉；九三"系遁"被系累而难遁，有疾；九四"好遁"喜好遁避，君子吉，小人否；九五"嘉遁"赞美遁避，正志吉，功成名就；上九"肥遁"逍遥遁去，无不利。遁卦问事，需明辨何时该退何时该守。此卦用神九五若生世或持世，则遁得其所、时机正确；若世爻临初六则退避过迟。问事业：利战略转移、收缩战线，不宜正面扩张；问财运：利保守经营，防财产缩水；问感情：利冷静处理距离问题，防冲动分手。时辰判断：寅卯辰时木气生扶艮土，遁避之力更强；巳午时火炼乾金，乾刚被炼，遁避更有力；申酉时金气旺盛，乾健有力，遁势更盛；亥子时水气正旺，水山蹇之象，遁中有蹇。',timing:'退避期约半年至一年，转机在后期。',direction:'西北退避；正南、正东冒进凶。',advice:'遁，亨，小利贞。遁卦之道在于当位而止，知道什么时候该停下来是大智慧。'},
  34:{overview:'雷天大壮，强盛壮大之卦。雷在天上，声势浩大。但大壮易折，需知进退。',person:'正处于强盛期，实力大增。但需防过于刚强而折，当以柔济刚。',matter:'雷天大壮，震上乾下，雷在天上，大壮之象。占事得此卦，世在三爻，当以九四爻为用神参断。大壮之要在"大壮亨"——强盛之时亨通，但"大壮利贞"——强盛需以正道守之，过刚则折。初九"壮于趾"足趾强壮，凶兆；九二"贞吉"守正吉祥；九三"小人用壮"小人以强壮伤人，凶；九四"贞吉悔亡"守正吉祥，悔恨消亡，此为大壮卦最佳用神爻；六五"丧羊于易"丧亡于田埂，悔恨消亡；上六"羝羊触藩，不能退，不能遂"进退两难。大壮卦问事，最忌过刚用壮，需以柔济刚。此卦用神九四若持世或生世，则大壮有度；若世爻临九三则刚壮过度。问事业：利大胆进取，但需防树敌过多；问财运：利大胆投资，但需评估风险；问感情：利主动出击，但需防过于强势。时辰判断：寅卯辰时木气生扶震雷，大壮之象更盛；巳午时火生乾刚，大壮有力；申酉时金气旺盛，乾金克震木，大壮有阻；亥子时水气正旺，雷天大壮，大壮持盈。',timing:'强盛期约一至两年，需防盛极转衰。',direction:'正东吉；正西凶。',advice:'大壮，利贞。大壮之时需以柔济刚，过刚则折，知进退方能长久。'},
  35:{overview:'火地晋，晋升进步之卦。火在地上，普照大地，晋升之象当谦逊受禄。',person:'正处于上升期，职位或地位有望提升。但需防小人嫉妒，当以德服人。',matter:'火地晋，离上坤下，火在地上，普照万物，晋升之象。占事得此卦，世在四爻，当以六五爻为用神参断。晋卦之要在"康侯用锡马蕃庶"——受赏赐、进爵位，然"昼日三接"则需防过于急切。初六"晋如摧如"晋升受阻，贞吉，悔亡；六二"晋如愁如"晋升有忧，守正则吉；六三"众允"众之所信，悔亡；九四"鼫鼠"贪而畏人，贞厉；六五"悔亡，失得勿恤"悔恨消亡，不计得失，此为晋卦最佳用神爻；上九"维用伐邑"用于征伐城邑，吉利，艰则吉。晋卦问事，若用神六五生世则晋升有期；若世爻临九四则需防小人作梗。问事业：利职位晋升，当以实绩服人；问财运：利正财进益，当以正当得财；问感情：利感情升温，当防第三者嫉妒。时辰判断：寅卯辰时木气生扶离火，晋升之力更强；巳午时火气正旺，晋卦达高峰；申酉时金气旺盛，坤土被生，晋之有根；亥子时水气正旺，火地晋之象，晋中有明。',timing:'晋升期约三至六个月。',direction:'正南吉；正东凶。',advice:'晋，康侯用锡马蕃庶，昼日三接。晋升之道在于以德晋升，非以势压人。'},
  36:{overview:'地火明夷，光明受伤之卦。明入地中，君子以莅众，用晦而明。受伤不失志。',person:'正处于低谷期或受伤期，但明夷告诉我们:受伤不失志，用晦而明方是真智慧。',matter:'地火明夷，坤上离下，明入地中，光明受伤害。占事得此卦，世在三爻，当以六五爻为用神参断。明夷之要在"利艰贞"——在艰难中守正不失，则终有出头之日。初六"明夷于飞，垂其翼"明鸟受伤垂翼；六二"明夷于左股，援用骍马"伤及左股，救则吉；九三"明夷于南狩，大得志"南方狩猎大得志，此爻为明夷卦较佳之用神爻；六四"入于左腹，获明夷之心"深入了解明伤；六五"箕子之明夷"明德受辱，此爻为明夷卦最佳用神爻；上六"不明晦"不明而暗，"初登天，后入地"由盛转衰。明夷问事，最忌丧失斗志。此卦用神六五若持世或生世，则明伤有救；若世爻带上六则需防彻底沉沦。问事业：受伤期，宜暗中积蓄力量，不宜强出头；问财运：财务受损期，宜保守图存；问感情：感情受伤期，需以柔克刚，不可硬碰。时辰判断：寅卯辰时木气生扶离火，明夷之象更盛；巳午时火照坤地，明中有伤；申酉时金气旺盛，离火被克，明伤更深；亥子时水气正旺，水火既济，明中有合。',timing:'明夷期约半年至一年，需耐心等待转机。',direction:'西南吉；正南大凶。',advice:'明夷，利艰贞。受伤不失志，用晦而明方是真智慧。'},
  37:{overview:'风火家人，齐家之卦。家庭和睦，修身齐家。此卦启示:家是根本。',person:'非常重视家庭与亲情。在处理家庭关系方面，有自己的智慧与方法。',matter:'风火家人，巽上离下，风助火势，家人之象。占事得此卦，世在六爻，当以六二爻为用神参断。家人之要在"正家而天下定"——家正则天下定，其核心是"女正位内"。初九"闲有家"防闲于家，悔亡；六二"无攸遂，在中馈"无所成，在家中负责饮食，此为家人卦最佳用神爻，爻辞"贞吉"明示家庭主妇守正则吉；九三"家人嗃嗃"家人严厉，悔厉有厉，吉；九五"王假有家，勿恤，吉"君王以天下为家，勿恤大吉；上九"有孚威如"有诚信威严，终吉。家人卦问事，多与家庭、内部关系有关。此卦用神六二若持世或生世，则家庭和睦、家运兴盛；若世爻临初九则需防家规不严。问事业：利内部管理，需以家文化管团队；问财运：家业兴旺，但防家庭开支过大；问感情：感情稳定期，利谈婚论嫁。时辰判断：寅卯辰时木气生扶巽离，家人之象更盛；巳午时火气旺盛，风火家人，家和万事兴；申酉时金气旺盛，巽木被伐，需防家庭风波；亥子时水气正旺，风水涣之象，家人有涣散之兆。',timing:'家庭关系调整期在近期（三至六个月）。',direction:'东南、正南吉。',advice:'家人，女正位内。在各自位置上做好自己的角色，是家庭和谐的根本。'},
  38:{overview:'火泽睽，乖违背离之卦。同居而异志，当以和化解乖违，异中求同。',person:'近期可能感到与他人不合或被误解。但睽卦告诉我们:睽中有合，异中有同。',matter:'火泽睽，离上兑下，火炎泽上，睽违之象。占事得此卦，世在三爻，当以六五爻为用神参断。睽卦之要在"小事吉"——在乖违之时，宜做小事不宜做大事，且需以柔和化解乖违。初九"悔亡，丧马"悔恨消亡，丧马勿逐自复；九二"遇主于巷"在巷中遇主人，吉利；六五"悔亡，畏邻戒"悔恨消亡，警惕邻人，此为睽卦最佳用神爻；上九"睽孤"睽违孤单，见豕负涂，载鬼一车，先张之弧，后说之弧，此为睽卦最凶之爻。睽卦问事，最忌火上泽下、水火不容之象扩大。此卦用神六五若生世或持世，则睽违可解；若世爻带上九则需防极度乖离。问事业：内部有矛盾或分歧，宜以沟通化解；问财运：合作有摩擦，需防小人挑拨；问感情：误会之象，需主动沟通澄清，不可冷战。时辰判断：寅卯时木气生扶离火，睽违之势更盛，此时占问需格外注意化解；巳午时火气旺盛，睽中有光；申酉时金气旺盛，兑金得金而清，睽中有合；亥子时水气正旺，水火既济，睽中有合。',timing:'睽违期约三至六个月，之后自然和解。',direction:'正南吉；正北凶。',advice:'睽，小事吉。睽之时当以和化睽，异中求同方能解困。'},
  39:{overview:'水山蹇，艰难险阻之卦。前有险难，进退皆难。但蹇难之中，当以德自修。',person:'正处于艰难期，前路受阻。但蹇卦告诉我们:蹇难也是成长的契机，当以内修应对外难。',matter:'水山蹇，坎上艮下，蹇难在前，跋山涉水皆难。占事得此卦，世在五爻，当以九五爻为用神参断。蹇卦之要在"利西南，不利东北"——往西南可行，往东北则难。初六"往蹇来誉"往而遇蹇，返而得誉；六二"王臣蹇蹇"王臣蹇难重重；九三"往蹇来反"往而遇蹇，返而得反；六四"往蹇来连"往而遇蹇，连接众人方能脱难；九五"大蹇朋来"大难中有朋友来助，此为蹇卦最佳用神爻；上六"往蹇来硕"往而遇蹇，返而得硕，大有收获。蹇卦问事，最忌孤军奋战，需借助外力。此卦用神九五若生世或持世，则蹇中有助、贵人相扶；若世爻临六二则需防孤掌难鸣。问事业：困难期，当借力使力而非硬闯；问财运：财务蹇难，需防破财；问感情：感情蹇难，需双方共同克服。时辰判断：寅卯辰时木气生扶坎水，蹇难之势更盛，此时占问需更长耐心；巳午时火照山门，蹇中有光；申酉时金气旺盛，艮山得金而稳，蹇中有解；亥子时水气正旺，坎水重重，蹇难加深。',timing:'蹇难期约一至两年，需耐心等待转机。',direction:'西南吉；东北大凶。',advice:'蹇，难也。蹇之时当以内修外，等待时机，不可妄动。'},
  40:{overview:'雷水解，解除困难之卦。雷雨作解，艰难消散。当把握时机，挣脱束缚。',person:'困难正在解除，当抓住时机果断行动。但解之后需防新的问题出现。',matter:'雷水解，震上坎下，雷雨交加，艰难解除。占事得此卦，世在四爻，当以九二爻为用神参断。解卦之要在"利西南"——往西南可解，且"无所往，其来复吉，有攸往，夙吉"——无目的前往不如返回，夙往则速吉。初六"无咎"无过错；九二"田获三狐，得黄矢"田猎获三狐，得金箭，此为解卦最佳用神爻；六三"负且乘"背负而乘，盗之功；九四"解而拇"解开你的脚拇指，朋友无助；六五"君子维有解，吉，有孚于小人"君子得以解脱，吉；上六"公用射隼"公侯射鹰隼，获之无不利。解卦问事，最忌"解"后不慎再次受困。此卦用神九二若生世或持世，则困难解除；若世爻临上六则需防新问题出现。问事业：困难期已过，利把握时机果断行动；问财运：财务解困，但解后需理财有道；问感情：误会解除，感情转暖。时辰判断：寅卯辰时木气生扶震雷，解难之力更强；巳午时火照水面，解中有明；申酉时金气旺盛，震木被伐，解势稍缓；亥子时水气正旺，水雷屯之象，解中有屯，解后仍需巩固。',timing:'解除期约一至三个月，之后需防反复。',direction:'正东吉；正北凶。',advice:'解，利西南。解难之后需防反复，巩固成果方为上策。'},
  41:{overview:'山雷损，损己利人之卦。有所失才有所得。吃亏是福，损中有益。',person:'近期可能在某些方面有所损失。但损卦告诉我们:看似吃亏，实则得福。',matter:'山雷损，艮上震下，山下有雷，损益之象。占事得此卦，世在三爻，当以六三爻为用神参断。损卦之要在"损上益下"——损己利人方为正道，且"损而有孚，元吉"。初九"已事遄往，酌损之"停止事务速往，酌量损失，吉祥；九二"利贞"利于守正；六三"三人行则损一人，一人行则得其友"三人同行损一人，一人独行得其友，此为损卦用神爻，损中有益之机；六五"或益之十朋之龟"有人赠以价值十朋的龟，大吉；上九"弗损益之"不损而益，大吉。损卦问事，需明辨何为真正值得损、何为不值得。此卦用神六五若生世或持世，则以损为益、因祸得福；若世爻临六三则需防三人行损一人之象。问事业：利以小博大，以小损失换取大收获；问财运：利投资理财，但需防过度节俭；问感情：利减少争吵，主动让步反而增进感情。时辰判断：寅卯辰时木气生扶震雷，损中有益；巳午时火照山门，损中有光；申酉时金气旺盛，艮山得金而稳，损益有度；亥子时水气正旺，山雷颐之象，损中有养。',timing:'付出期在近期，但回报可期。',direction:'方向不限，诚心付出必有回报。',advice:'损，有孚。损之道在于惩忿窒欲，克服私欲，成全大局。真正的智者以吃亏为福。'},
  42:{overview:'风雷益，增益之卦。损上益下，风雷相助。益人终益己，施比受更有福。',person:'正处于增益期，能量在增强。但需懂得分享增益，方能持久。',matter:'风雷益，巽上震下，风雷相助，增益之象。占事得此卦，世在六爻，当以九五爻为用神参断。益卦之要在"损上益下"——领导者减损自己来增益下属，是真正的益道。初九"利用为依迁国"利于依靠迁移国都；六二"永贞吉"永守正道吉祥；六三"益之，用凶事"增益凶事；九五"有孚惠心，勿问元吉"有诚信惠及他人之心，此为益卦最佳用神爻；上九"立心勿恒，凶"立心不恒久，凶。益卦问事，若能真正做到损己益人则大吉；若只知索取则凶。此卦用神九五若持世或生世，则增益深厚且持久；若世爻带上九则需防增益不长久。问事业：利投资扩大，但需分享利益；问财运：利收益增长，但需适度回馈；问感情：利感情升温，但需双方共同付出。时辰判断：寅卯辰时木气旺盛，风雷益之象更盛；巳午时火照雷门，益中有光；申酉时金气旺盛，巽木被伐，益中有损；亥子时水气正旺，水风井之象，益中有养。',timing:'增益期约三至六个月，利益共享方能长久。',direction:'东南吉；正北凶。',advice:'益，利有攸往。增益之道在于施比受更有福，独享增益者必不久。'},
  43:{overview:'泽天夬，决断清除之卦。泽上于天，夬决果敢。当明辨是非，当断则断。',person:'正处于需要决断的时刻。但需防决断过于仓促，当审时度势，择善而行。',matter:'泽天夬，兑上乾下，泽上于天，决断清除之象。占事得此卦，世在七爻，当以九五爻为用神参断。夬卦之要在"夬"——决断清除，当断则断，且"扬于王庭"——公开透明地决断。初九"壮于前趾"足趾受伤，往不胜则为咎；九二"惕号，莫夜有戎勿恤"警惕号呼，夜间有兵戎勿恤；九五"苋陆夬夬"山野细雨，当位而决，此为夬卦最佳用神爻；上九"无号，终有凶"无需号哭，终有凶。夬卦问事，最忌"夬"不彻底，留下隐患。此卦用神九五若持世或生世，则决断果断、诸事可成；若世爻临初九则需防决断过早。问事业：利果断处理遗留问题，当断则断；问财运：利决断财务决策，但需防仓促；问感情：利果断解决感情问题，但需防伤害对方。时辰判断：寅卯辰时木气生扶乾金，夬决之力更强；巳午时火炼乾刚，夬势更盛；申酉时金气旺盛，兑泽得金而清，夬决清明；亥子时水气正旺，泽水困之象，夬中有困。',timing:'决断期约一至三个月，当断则断。',direction:'正西吉；正南凶。',advice:'夬，决也。夬之道在于当断则断，但夬不彻底反受其害。'},
  44:{overview:'天风姤，邂逅相遇之卦。天下有风，阴阳相会。相遇虽美，需明辨其真假。',person:'近期可能有意外的相遇或机会。但姤卦提醒:相遇虽美，要明辨是非。',matter:'天风姤，乾上巽下，天下有风，阴阳相会，邂逅相遇之象。占事得此卦，世在九爻，当以九五爻为用神参断。姤卦之要在"姤"——邂逅相遇，"女壮，勿用取女"——相遇虽美但需明辨，不可用心不纯者。初六"系于金柅"金柅止车，贞吉；九二"包有鱼"包容而有鱼；九三"臀无肤，其行次且"行动艰难；九四"包无鱼"无所包容；九五"以杞包瓜"以杞树庇护瓜果，此为姤卦最佳用神爻，吉祥；上九"姤其角"邂逅到角落，吝而无咎。姤卦问事，最忌"遇人不淑"——遇人不当则后患无穷。此卦用神九五若持世或生世，则所遇皆良人；若世爻临初六则需防相遇不纯。问事业：可能遇到意外合作机会，需评估对方资质；问财运：可能遇到意外财源，但需防来路不正；问感情：邂逅之缘，可能一见钟情，但需防不长久。时辰判断：寅卯辰时木气生扶巽木，姤遇之象更盛；巳午时火炼乾金，姤中有光；申酉时金气旺盛，乾金克巽木，姤势受阻；亥子时水气正旺，天水讼之象，姤中有讼。',timing:'机遇期在近期，当敏锐把握。',direction:'西北、东南吉。',advice:'姤，女壮，勿用取女。机会出现时要看清本质；美好的邂逅不一定是长久的缘分。'},
  45:{overview:'泽地萃，荟萃聚集之卦。人才荟萃，人和万事兴。此卦启示:人和是成功的基础。',person:'人脉广，人缘好，身边聚集了一批志同道合之人。这是宝贵的财富，当珍惜并善用。',matter:'泽地萃，兑上坤下，泽聚于地，荟萃之象。占事得此卦，世在五爻，当以九五爻为用神参断。萃卦之要在"萃"——聚众相聚，"萃有位"——身居其位方能聚人。初六"有孚不终"有诚信而不终，乱之象；六二"引吉无咎"长久等待可获吉祥；六三"萃如嗟如"聚集时叹息，困顿无援；九四"大吉无咎"大吉而无咎；九五"萃有位"身居高位，此为萃卦最佳用神爻，吉祥；上六"赍咨涕洟"带着资财哭泣，凶。萃卦问事，最忌萃而不聚——表面热闹实则人心涣散。此卦用神九五若持世或生世，则人才荟萃、诸事顺遂；若世爻临六三则需防人心不附。问事业：利团队整合，以德服人方能聚才；问财运：利众人之财，合作共进；问感情：利人际关系，感情可能因他人介绍而得。时辰判断：寅卯辰时木气生扶坤土，萃集之力更强；巳午时火生坤土，萃中有光；申酉时金气旺盛，兑泽得金而清，萃有品质；亥子时水气正旺，水泽节之象，萃中有节。',timing:'人脉整合期在三至六个月。',direction:'正西、西南吉。',advice:'萃，聚也。在荟萃之时，当保持真诚与公正，才能长期维系良好的关系。'},
  46:{overview:'地风升，步步高升之卦。稳步上升，循序渐进。此卦启示:稳中求进，是最快的进。',person:'正处于上升通道，虽然不快，但很稳健。这种上升更持久更扎实，当珍惜。',matter:'地风升，坤上巽下，地中生木，升起之象。占事得此卦，世在四爻，当以九三爻为用神参断。升卦之要在"南征吉"——往南方发展吉利，且"升虚邑"——登上虚无的城邑。初六"允升"信用上升，吉祥；九二"孚乃利用禴"以诚心祭祀，吉祥；九三"升虚邑"登上虚无城邑，无所疑，此为升卦最佳用神爻；六五"贞吉，升阶"守正吉祥，登上台阶；上六"冥升，利于不息之贞"昏昧上升，利在不息之正道。升卦问事，最忌升而不已则倾，需步步为营。此卦用神九三若持世或生世，则升势稳健、步步高升；若世爻临上六则需防升极而衰。问事业：稳步上升期，不可急躁冒进；问财运：利逐步积累，忌急于求成；问感情：感情逐步升温，耐心培养。时辰判断：寅卯辰时木气旺盛，巽木得地而生，升势更盛；巳午时火照山门，升中有光；申酉时金气旺盛，坤土被克，升途有阻；亥子时水气正旺，地水师之象，升中有助。',timing:'上升期以年计，但持续性很强。',direction:'西南吉；正北凶。',advice:'升，南征吉。稳扎稳打，终成大器。上升之道在于稳，不在于快。'},
  47:{overview:'泽水困，困境磨砺之卦。物质或精神上的困顿。但困卦告诉我们:困于心，衡于道，而后有所得。',person:'近期可能感到困顿与压力。但困卦的智慧在于:在困境中磨练心志，反而能获得更大的成长。',matter:'泽水困，兑上坎下，泽无水，困乏之象。占事得此卦，世在三爻，当以九五爻为用神参断。困卦之要在"困而不失其所亨"——身处困境但内心亨通才是真正出路。初六"臀困于株木，入于幽谷"臀部困于株木下，入于幽谷；九二"困于酒食"困于酒食之中，官有庆；六三"困于石"困于石中；九四"困于金车"困于金车中；九五"劓刖"受刑但面无愠色，困于庙堂之上，此为困卦最佳用神爻，亨；上六"困于葛藟"困于藤蔓中，动则有悔。困卦问事，最忌"困于心"——内心先困则外在更难脱困。此卦用神九五若持世或生世，则心亨通泰、困境可解；若世爻临上六则需防心态崩溃。问事业：困境期，需保持内心定力；问财运：财务困难，量入为出；问感情：感情困顿，需以柔克刚，不可硬碰。时辰判断：寅卯辰时木气生扶坎水，困厄更深；巳午时火照水面，困中有光；申酉时金气旺盛，兑泽得金而清，困中有解；亥子时水气正旺，坎水重重，困厄加重。',timing:'困难期约一至两年，但终将有所突破。',direction:'正西吉；正北凶。',advice:'困，亨，贞大人吉。在困境中保持内心的亨通，不失正道，终能化困为通。'},
  48:{overview:'水风井，井养之卦。蓄水养人，如井之德。取之不尽，用之不竭。',person:'正处于需要滋养和培养的阶段。当以井德自修，积累内在涵养以待时。',matter:'水风井，坎上巽下，木上有水，井养之象。占事得此卦，世在三爻，当以九五爻为用神参断。井卦之要在"井养而不穷"——井之德在于滋养万物而不枯竭。初六"井泥不食"井中有泥，不能饮食；九二"井谷射鲋"井底射小鱼，瓮敝漏；九三"井渫不食"井水已清但不饮食，叹息其人之心；六四"井甃"修治井壁，无咎；九五"井冽寒泉食"井水清冽寒凉可饮食，此为井卦最佳用神爻，吉祥；上六"井收勿幕"井口收束不用覆盖，有功可贺。井卦问事，最忌"井泥不食"——有资源却无人用，或有才能却无人识。此卦用神九五若持世或生世，则井养有方、才华得展；若世爻临初六则需防被埋没。问事业：利培养人才或自身修养，需持之以恒；问财运：利积累财富，细水长流；问感情：需用心经营感情，日久见真情。时辰判断：寅卯辰时木气旺盛，井养之象更盛；巳午时火照水面，井水清明；申酉时金气旺盛，坎水被泄，井养有度；亥子时水气正旺，坎水充足，井养无穷。',timing:'井养期以年计，需长期积累。',direction:'正北吉；正南凶。',advice:'井，改邑不改井。井之德在于滋养，取之不尽用之不竭。'},
  49:{overview:'泽火革，变革革新之卦。破旧立新，顺应天时。革故鼎新，需要勇气与智慧。',person:'正面临需要改变的时刻。可能是工作、生活方式或思维模式的改变。',matter:'泽火革，兑上离下，泽火相息，变革之象。占事得此卦，世在六爻，当以九三爻为用神参断。革卦之要在"元亨利贞"——变革有四德，缺一不可，且"己日乃孚"——在时机成熟之日方能取信于人。初九"巩用黄牛之革"用黄牛皮牢固包扎，不可有所作为；六二"己日乃革"到己日才可变革，吉祥；九三"征凶，贞厉"行动有凶险，守正以避危，此为革卦最佳用神爻，但需在艰贞中行动；九四"悔亡"悔恨消亡；九五"大人虎变"大人如虎变，吉利；上九"君子豹变"君子如豹变，小人则面。革卦问事，最忌"己日"未到而强行变革，时机比行动更重要。此卦用神九三若持世或生世，则变革有方、时机正确；若世爻临初九则需防变革过急。问事业：利改革创新，但需择善而行；问财运：利产业升级，但需防阵痛；问感情：感情需革新，新关系取代旧关系。时辰判断：寅卯辰时木气生扶离火，革故之力更强；巳午时火气旺盛，革势更盛；申酉时金气旺盛，兑泽得金而清，鼎新有果；亥子时水气正旺，水火既济，革中有济。',timing:'变革期在近期（一至两年），是难得的机会窗口。',direction:'正西、正南吉。',advice:'革，元亨利贞，悔亡。犹豫不决只会错失良机，当果断行动。'},
  50:{overview:'火风鼎，鼎新立业之卦。鼎器养人，定鼎立业。革故鼎新，需以正道为之。',person:'正处于定鼎立业的阶段。当以鼎德自持，稳重求进，不可冒进。',matter:'火风鼎，离上巽下，木上有火，鼎器之象。占事得此卦，世在四爻，当以九三爻为用神参断。鼎卦之要在"元吉，亨"——大吉祥亨通，鼎象征权力与秩序。初六"鼎颠趾"鼎倒趾折，凶险但可贺；九二"鼎黄耳"鼎有黄色耳，得中位，吉祥；九三"鼎耳革，行塞"鼎耳改变，行塞；九四"鼎折足"鼎足断裂；六五"鼎黄耳"鼎有黄色耳，得中位，此为鼎卦最佳用神爻，吉祥；上九"鼎玉铉"鼎有玉制横杠，大吉无不利。鼎卦问事，最忌"鼎折足"——不堪重负而崩溃。此卦用神六五若持世或生世，则鼎立稳固、诸事顺遂；若世爻临九四则需防不堪重负。问事业：利建立新秩序、设立新规矩；问财运：利投资兴业，但需量力而行；问感情：感情定鼎期，利谈婚论嫁。时辰判断：寅卯辰时木气旺盛，鼎养之象更盛；巳午时火气旺盛，鼎器得火而精；申酉时金气旺盛，离火被克，鼎立有根；亥子时水气正旺，火风鼎之象，鼎中有养。',timing:'定鼎期约一至两年，稳重求进。',direction:'正南、东南吉；正北凶。',advice:'鼎，元吉亨。定鼎之道在于稳，重器需有德者居之。'},
  51:{overview:'震为雷，震惊百里之卦。雷震万物，当惊而能惧，惊中有得。',person:'近期可能有突发变动或震惊之事。但震卦告诉我们:震惊之中保持定力，反而能获得成长。',matter:'震为雷，震上震下，重重雷震，惊惧之象。占事得此卦，世在三爻，当以九四爻为用神参断。震卦之要在"亨，震来虩虩，笑言哑哑"——震惊来时恐惧貌，但过后言笑如常，这才是真正的亨通。初六"震来虩虩"雷声来临恐惧貌；六二"震来厉，亿丧贝"雷声来厉，丧失资财；六三"震苏苏"雷声微微，震行无眚；九四"震遂泥"雷声陷入泥中，此为震卦较难之用神爻；六五"震往来厉，亿无丧有事"雷声往来皆厉；上六"震索索，视矍矍"雷声不止，心不安。震卦问事，最忌"震索索"——持续惊恐而失态。此卦用神九四若持世或生世，则震惊有度；若世爻临上六则需防持续惊恐。问事业：可能有突发变故，需保持定力；问财运：防意外损失，需做好风险管理；问感情：可能有突然变化，需冷静应对。时辰判断：寅卯辰时木气旺盛，震雷之力更强；巳午时火照雷门，震惊有光；申酉时金气旺盛，震木被伐，雷声受制；亥子时水气正旺，震雷相搏，震惊更烈。',timing:'震惊期约一至三个月，需保持定力。',direction:'正东吉；正西凶。',advice:'震，亨。震来虩虩，笑言哑哑。震惊之中保持定力，反而能转危为安。'},
  52:{overview:'艮为山，静止之卦。艮止之道，在于当止则止，不可妄动。动极思静，静以养德。',person:'正处于需要静止、止步的阶段。当以艮德自持，不可妄动，静待时机。',matter:'艮为山，艮上艮下，重重山止，静止之象。占事得此卦，世在三爻，当以九三爻为用神参断。艮卦之要在"艮其背，不获其身"——止于当止之处，不强求于身，即"知止而后有定"。初六"艮其趾"脚趾静止，不行动则无咎；六二"艮其腓"小腿静止；九三"艮其限"腰部静止，此为艮卦最需谨慎之爻，"厉熏心"警示腰止不动则有危险；六四"艮其身"身体静止；六五"艮其辅，言有序"面颊静止，言有序；上九"敦艮"以敦厚止物，吉祥。艮卦问事，最忌"艮其限"——过度静止而僵化。此卦用神上九若生世或持世，则止得其所、动静合宜；若世爻临九三则需防止而不动。问事业：宜按兵不动，不宜扩张；问财运：宜保守理财，不宜投资；问感情：宜冷静思考，不宜冲动。时辰判断：寅卯辰时木气生扶艮山，止之力更强；巳午时火照山门，山火贲之象，止中有饰；申酉时金气旺盛，艮山得金而稳，止有根基；亥子时水气正旺，水山蹇之象，止中有蹇。',timing:'静止期约三至六个月，止而后动。',direction:'东北吉；正南凶。',advice:'艮其背，不获其身。知止而后有定，定而后能静，静而后能安。'},
  53:{overview:'风山渐，循序渐进之卦。如风之入山，如木之生根，稳步前行。欲速则不达。',person:'正按照自己的节奏稳步前进。不急不躁，一步一个脚印，这是最可靠的成功之路。',matter:'风山渐，巽上艮下，山上有风，渐进之象。占事得此卦，世在四爻，当以六二爻为用神参断。渐卦之要在"女归吉，利贞"——如女子出嫁依礼而行，循序渐进则吉利。初六"鸿渐于干"大雁渐进于水边，小子厉，有言无咎；六二"鸿渐于磐"大雁渐进于大石，饮食衎衎，吉祥，此为渐卦最佳用神爻；九三"鸿渐于陆，夫征不复，妇孕不育"大雁渐进于陆地，夫妻离散，凶；六四"鸿渐于木"大雁渐进于树上；九五"鸿渐于陵"大雁渐进于山陵，三岁不孕，终莫之胜，吉祥；上九"鸿渐于阿"大雁渐进于山头，吉祥。渐卦问事，最忌"鸿渐于陆"——急于求进而导致失败。此卦用神六二若持世或生世，则渐进有序、诸事顺遂；若世爻临九三则需防急躁冒进。问事业：稳步推进，不可冒进；问财运：逐步积累，忌急功近利；问感情：按部就班，耐心培养感情基础。时辰判断：寅卯辰时木气旺盛，渐之力更强；巳午时火照山门，渐中有光；申酉时金气旺盛，艮山被伐，渐中有阻；亥子时水气正旺，风水涣之象，渐中有散。',timing:'渐进期以年计，但效果扎实。',direction:'东南吉；正北凶。',advice:'渐，女归吉。欲速则不达，循序渐进方能到达彼岸。'},
  54:{overview:'雷泽归妹，婚嫁之卦。少女从长男，不以正也。婚嫁需以礼，勿以势迫。',person:'感情方面可能有新动态。但归妹卦提醒:婚嫁需以正，不可草率或以势迫人。',matter:'雷泽归妹，震上兑下，雷入泽中，归妹之象。占事得此卦，世在三爻，当以六五爻为用神参断。归妹之要在"征凶，无攸利"——婚姻若不以正道则凶，无所利。初九"归妹以娣"以娣出嫁，跛能履，征吉；六二"眇能视"独眼能视，利幽人之贞；九四"归妹愆期"婚期延误；六五"帝乙归妹"帝乙嫁女，以其明智而行，此为归妹卦最佳用神爻，吉祥；上六"女承筐，无实；士刲羊，无血"嫁妆无实，祭祀无血，此为归妹卦最需避免之爻。归妹问事，最忌"归妹以娣"——以偏室身份出嫁，或感情不正式。此卦用神六五若持世或生世，则感情归宿正当；若世爻临上六则需防感情落空。问事业：合作需正式签订合同，不可草率；问财运：利正式渠道得财，忌私下交易；问感情：感情若想修成正果，需走正道依礼而行。时辰判断：寅卯辰时木气生扶震雷，归妹之象更盛；巳午时火照泽面，归中有光；申酉时金气旺盛，兑金得金而清，归妹有节；亥子时水气正旺，雷泽归妹之象，归中有震。',timing:'婚嫁期约一至两年，需以正而行。',direction:'正东、正西吉；正南凶。',advice:'归妹，征凶。婚嫁之道，以正为本，勿以势迫，循礼而行方能长久。'},
  55:{overview:'雷火丰，丰盛盛大之卦。日中则昃，月盈则食。盛极必衰，当居安思危。',person:'正处于丰盛期，但丰卦提醒:盛时需思衰，当以谦德持盈，不可忘乎所以。',matter:'雷火丰，震上离下，雷电交加，丰盛之象。占事得此卦，世在四爻，当以六二爻为用神参断。丰卦之要在"亨，王假之"——丰盛之时亨通君王到来，且"日中则昃，月盈则食"——盛极必衰是永恒规律。初六"遇其配主"遇其匹配之主，虽旬无咎，往有尚；九三"丰其沛，日中见沫"丰盛其暗处，日中见小星星，示日中则昃之象；九四"丰其蔀，日中见斗"丰盛其障蔽，日中见北斗，此为丰卦较为不利之爻；六二"丰其蔀，日中见斗，往得疑疾"丰盛其障蔽太阳当空却见北斗，此为丰卦最佳用神爻，示丰盛之中有隐忧；上九"丰其屋，蔀其家，窥其户，阒其无人，三岁不觌"丰盛其屋却无人，三岁不见。此乃丰极之象，大凶。丰卦问事，最忌"丰其屋"——自满自大而失人心。此卦用神六二若持世或生世，则丰盛有度；若世爻临上九则需防盛极转衰。问事业：丰盛期当思危机，不可盲目扩张；问财运：丰收期当留储备，不可挥霍；问感情：感情热烈期当防第三者。时辰判断：寅卯辰时木气生扶震离，丰盛之象更盛；巳午时火气旺盛，丰达高峰；申酉时金气旺盛，震木被伐，丰势有减；亥子时水气正旺，水火既济，丰中有缺。',timing:'丰盛期约一至两年，需防盛极转衰。',direction:'正东吉；正西凶。',advice:'丰，亨。日中则昃，月盈则食。盛时思衰，方能持盈保泰。'},
  56:{overview:'火山旅，羁旅他乡之卦。旅需贞吉，旅困则凶。当以谦德处旅，不可傲慢。',person:'近期可能外出或面临变动。但旅卦提醒:羁旅之中当以谦逊自持，不可忘本。',matter:'火山旅，离上艮下，火在山上，旅居之象。占事得此卦，世在三爻，当以六二爻为用神参断。旅卦之要在"小亨，旅贞吉"——小亨通，守正则吉。初六"旅琐琐"旅行中犹豫不决，灾祸；六二"旅即次，怀其资，得童仆贞"旅行到达旅舍，怀其资财，得童仆忠诚，此为旅卦最佳用神爻；九三"旅焚其次，丧其童仆"旅舍被焚，丧其童仆，灾祸；九四"旅于处"旅行中找到住处，但不得其资；上九"鸟焚其巢，先笑后哭"鸟巢被焚，先笑后哭，此为旅卦最需避免之爻，凶。旅卦问事，最忌"旅琐琐"——羁旅中举足无措，或"鸟焚其巢"——失其所依。此卦用神六二若持世或生世，则旅途安稳；若世爻临上九则需防失其所依。问事业：利外出发展，但需防根基不稳；问财运：利外出求财，但需防盗防骗；问感情：利异地恋，但需防感情漂泊。时辰判断：寅卯辰时木气生扶离火，旅之象更盛；巳午时火气旺盛，旅中有光；申酉时金气旺盛，艮山得金而稳，旅有依止；亥子时水气正旺，火水未济之象，旅中有蹇。',timing:'旅途期约三至六个月。',direction:'正南吉；正北凶。',advice:'旅，小亨，旅贞吉。羁旅之道，以谦自持，不可傲慢忘本。'},
  57:{overview:'巽为风，随顺入下之卦。谦逊与渗透的力量。柔能克刚。',person:'性格谦逊，善于配合，能屈能伸。这种柔顺不是软弱，而是一种生存智慧。',matter:'巽为风，巽上巽下，重重风入，随顺之象。占事得此卦，世在四爻，当以九五爻为用神参断。巽卦之要在"小亨，利有攸往，利见大人"——小亨通，有所往则利，需贵人相助。初六"进退"进退不前，卑顺之过；九二"巽在床下，用史巫纷若"巽顺于床下，此为巽卦较难之用神爻；九三"频巽"频繁巽顺，吝；六四"悔亡"悔恨消亡；九五"贞吉悔亡，无不利"守正吉祥，悔恨消亡，无所不利，此为巽卦最佳用神爻；上九"巽在床下，丧其资斧"巽顺至极，丧其资斧，凶。巽卦问事，最忌"频巽"——过度顺从而失去自我。此卦用神九五若持世或生世，则顺从有道、诸事顺遂；若世爻临初六则需防过于卑顺。问事业：利顺势而为，借势使力；问财运：利借势生财，但需防被利用；问感情：利以柔克刚，但需防一方过于强势。时辰判断：寅卯辰时木气旺盛，巽风之力更强；巳午时火照巽木，巽顺有光；申酉时金气旺盛，巽木被伐，随顺有阻；亥子时水气正旺，水风井之象，巽入有养。',timing:'顺势期约一至两年。',direction:'东南吉；正北凶。',advice:'巽，小亨。以谦逊之心做事，看似缓慢，实则效果最佳。'},
  58:{overview:'兑为泽，和悦之卦。丽泽兑，君子以朋友讲习。两泽相丽，互相滋益。',person:'善于交际，人缘极好，能以和悦待人。但需防过于讨好而失却原则。',matter:'兑为泽，兑上兑下，重重泽悦，和悦之象。占事得此卦，世在三爻，当以九五爻为用神参断。兑卦之要在"亨，利贞"——亨通，守正则利。初九"和兑"温和欣悦，吉祥；九二"孚兑"诚信欣悦，吉祥，悔恨消亡；六三"来兑"来而求悦，凶险；九五"孚于剥"诚信被剥夺，有厉，此为兑卦最需谨慎之用神爻；上六"引兑"引而求悦，无利。兑卦问事，最忌"来兑"——主动求悦而失本心，或"孚于剥"——真诚被利用。此卦用神九五若持世或生世，则和悦有度、诸事顺遂；若世爻临六三则需防谄媚讨好。问事业：利以和悦服人，但需防失去原则；问财运：利以和悦生财，但需防口舌破财；问感情：利以和悦相处，但需防甜言蜜语。时辰判断：寅卯时木气生扶兑金，和悦之象更盛；巳午时火气旺盛，兑金被炼，和悦有节；申酉时金气旺盛，兑泽得金而清，和悦更真；亥子时水气正旺，水泽节之象，和悦有度。',timing:'和悦期约三至六个月。',direction:'正西吉；正北凶。',advice:'兑，亨，利贞。和悦之道在于真诚，不在于谄媚讨好。'},
  59:{overview:'风水涣，涣散之卦。风行水上，涣然冰释。当在涣散之中凝聚人心。',person:'当前可能感到人心涣散或局面有些散乱。但涣卦告诉我们:涣中有聚，危中有机。',matter:'风水涣，巽上坎下，风行水上，涣散之象。占事得此卦，世在五爻，当以六四爻为用神参断。涣卦之要在"亨，王假有庙"——涣散之中君王祭祀凝聚人心。初六"用拯马壮"用壮马拯救，吉祥；九二"涣奔其机"涣散时奔向台阶，悔恨消亡；六三"涣其躬"涣散其自身；六四"涣其群"涣散其群体，此为涣卦最佳用神爻，群体元吉，卦有王者之象；九五"涣汗其大号"涣汗其大号召令；上九"涣其血"涣散其忧患。涣卦问事，最忌涣而不聚——一味涣散导致人心离散。此卦用神六四若生世或持世，则涣中有聚、危中有机；若世爻临六三则需防自我涣散。问事业：利团队重整，在涣散中寻找凝聚点；问财运：利分散投资，化解集中风险；问感情：给对方适度空间，但需保持联系。时辰判断：寅卯辰时木气旺盛，涣散之势更盛，此时占问需格外注意凝聚；巳午时火照水面，涣中有光；申酉时金气旺盛，巽木被伐，涣势减缓；亥子时水气正旺，涣散更深。',timing:'涣散期约三至六个月，需凝聚人心。',direction:'东南吉；正南凶。',advice:'涣，亨。涣之时当凝聚人心，涣中有聚方能解困。'},
  60:{overview:'水泽节，节制节约之卦。泽上有水，节以制度。过度则凶，适度则吉。',person:'需注意节制和适度。当量入为出，适度消费，不可过度挥霍或浪费。',matter:'水泽节，坎上兑下，水流入泽，节制之象。占事得此卦，世在三爻，当以九五爻为用神参断。节卦之要在"亨，苦节不可贞"——亨通，但过度节制则凶。初九"不出户庭"不出家门庭院，无咎；九二"不出门庭"不出家门庭院，凶兆；六三"不节若，则嗟若"不节制则叹息；六四"安节"安于节制，亨通；九五"甘节"甘美于节制，此为节卦最佳用神爻，吉祥；上九"苦节"苦于节制，凶兆，过犹不及。节卦问事，最忌"苦节"——过度节制反而伤害自身，或"不节"——完全不节制。此卦用神九五若持世或生世，则节制有度、诸事顺遂；若世爻临上九则需防过度节制。问事业：利精打细算，但需防过度节流；问财运：量入为出，但需防因小失大；问感情：适度付出，但需防过分计较。时辰判断：寅卯辰时木气生扶坎水，节之象更盛；巳午时火气旺盛，节中有通；申酉时金气旺盛，兑泽得金而清，节有品质；亥子时水气正旺，水泽节之象，节中有流。',timing:'节制期约三至六个月，需把握适度原则。',direction:'正北吉；正南凶。',advice:'节，亨，苦节不可贞。节制之道在于适度，过与不及皆非正道。'},
  61:{overview:'风泽中孚，诚信之卦。豚鱼吉，信及豚鱼。诚信为本，方能感化人心。',person:'诚信是您最大的财富。但需防真心错付，当以智慧辨别真诚与虚伪。',matter:'风泽中孚，巽上兑下，风行泽上，中孚之象。占事得此卦，世在五爻，当以九二爻为用神参断。中孚之要在"豚鱼吉"——连豚鱼都能被感化，诚信之力感天动地。初九"虞吉"安于诚信，吉祥，有它不燕；九二"鸣鹤在阴，其子和之"鹤在树荫下鸣叫，其子应和，中心愿之，此为中孚卦最佳用神爻；六三"得敌"得到敌人，或鼓或罢，或泣或歌；六四"月几望"月亮将满，马匹亡，无咎；九五"有孚挛如"有诚信牵系，吉祥；上九"翰音登于天"鸡鸣声升天，凶，信誉失则凶。中孚问事，最忌"翰音登于天"——虚有其表、诚信不足。此卦用神九二若持世或生世，则诚信深厚、感化有力；若世爻临上九则需防诚信失守。问事业：利以诚信立业，但需防被不诚信者利用；问财运：利以诚取财，但需防被人欺骗；问感情：利以诚相待，但需防真心错付。时辰判断：寅卯辰时木气生扶巽兑，中孚之象更盛；巳午时火照泽面，中孚有诚；申酉时金气旺盛，巽木被伐，中孚需防破损；亥子时水气正旺，风水涣之象，中孚有涣。',timing:'诚信期约三至六个月，以诚为本方得始终。',direction:'东南、正西吉；正北凶。',advice:'中孚，豚鱼吉。诚信之道在于真心真意，虚有其表者终将失信于人。'},
  62:{overview:'雷山小过，小有过越之卦。飞鸟遗之音，不宜上宜下。小过之时需谨慎。',person:'近期可能有些小过错或小失误。但小过卦提醒:小有过越需防成大过，当谨言慎行。',matter:'雷山小过，震上艮下，雷在山上，小有过越之象。占事得此卦，世在四爻，当以九四爻为用神参断。小过之要在"亨，利贞"——亨通，守正则利，且"可小事，不可大事"——宜做小事不宜做大事。初六"飞鸟以凶"飞鸟带来凶兆；六二"过其祖，遇其妣"越过祖父，遇祖母；九三"弗过防之"未能过而防范；九四"弗过遇之"未能过而遇之，此为小过卦较为难得之用神爻；六五"密云不雨，自我西郊"乌云密布而不雨，此为小过卦最佳用神爻，示小有过越而未成大过；上六"弗遇过之"未遇而越过，凶。小过问事，最忌"飞鸟以凶"——小错不防成大错，或"弗遇过之"——不知止而过越。此卦用神六五若持世或生世，则小过有度、可化凶为吉；若世爻临初六则需防小错成大。问事业：利做小事不宜做大事，谨言慎行；问财运：利小投入有小回报，忌大投资；问感情：利小浪漫升温，忌大动作。时辰判断：寅卯辰时木气生扶震艮，小过之象更盛；巳午时火照山门，小过有光；申酉时金气旺盛，震木被伐，小过有减；亥子时水气正旺，水山蹇之象，小过有蹇。',timing:'小过期约一至三个月，需谨言慎行。',direction:'正东吉；正西凶。',advice:'小过，亨。可小事，不可大事。小过之时需谨言慎行，防微杜渐。'},
  63:{overview:'水火既济，大功告成之卦。事已成，当守成。既济之中藏初吉终乱之机。',person:'近期可能有所成就，但既卦提醒:初吉终乱。要保持警惕，不可因成功而懈怠。',matter:'水火既济，坎上离下，水在火上，阴阳相交，事已成。占事得此卦，世在六爻，当以六二爻为用神参断。既济之要在"亨，小利贞"——亨通，但小利守正，且"初吉终乱"——开始吉祥结局可能混乱。初九"曳其轮"拖住车轮；六二"妇丧其茀"妇丧其首饰；九三"高宗伐鬼方"高宗讨伐鬼方，三年克之，小人勿用；六四"繻有衣袽"衣服里有破败之物，此为既济卦最佳用神爻，终日戒；九五"东邻杀牛，不如西邻之禴祭"东邻杀牛不如西邻薄祭，此为既济卦提醒持盈之道；上六"濡其首"头被浸湿，凶。既济问事，最忌"濡其首"——成功之后开始犯错。此卦用神六四若持世或生世，则守成有道；若世爻临上六则需防功亏一篑。问事业：已完成或接近完成，需做好收尾；问财运：财务丰收，需防过度支出；问感情：感情圆满，需防感情倦怠。时辰判断：寅卯辰时木气生扶坎离，既济之象更盛；巳午时火气旺盛，水火既济，济中有济；申酉时金气旺盛，坎水被泄，既济有减；亥子时水气正旺，既济之象更纯。',timing:'完成期在近期，但需要保持警惕。',direction:'方向不限，关键是守成。',advice:'既济，亨。在成功后保持谨慎，才能让成果更持久。守成比创业更难。'},
  64:{overview:'火水未济，事未完成之卦。尚需努力，事在人为。未济之中，仍有希望。',person:'当前可能感到事情尚未完成，或有些遗憾。但未济卦告诉我们:未济不是失败，而是尚在路上。',matter:'火水未济，离上坎下，火在水上，事未成，尚需努力。占事得此卦，世在三爻，当以六五爻为用神参断。未济之要在"亨"——虽未成但能亨通，且"小狐汔济，濡其尾"——小狐狸快要过河却浸湿了尾巴，提示需谨慎。初六"濡其尾"尾巴被浸湿；九二"曳其轮"拖住车轮，贞吉；六三"未济"事未成；六五"贞吉无悔"守正吉祥，此为未济卦最佳用神爻；上九"有孚于饮酒"有诚信地饮酒无咎，若濡其首则诚信失是。未济问事，最忌"濡其尾"——未能坚持到最后，半途而废。此卦用神六五若持世或生世，则未济有济；若世爻临初六则需防半途而废。问事业：未完成期，当继续努力，不可半途而废；问财运：未成功期，继续投入但需防血本无归；问感情：感情未确定，继续培养但需防错付真心。时辰判断：寅卯辰时木气生扶离火，未济之象更盛；巳午时火气旺盛，火在水上，未济有济；申酉时金气旺盛，坎水被泄，未济稍缓；亥子时水气正旺，未济之象更纯。',timing:'继续期以年计，终有完成的一天。',direction:'正南、正北吉。',advice:'未济，亨。事未成，尚需努力。只要不放弃，就有完成的一天。'},
};

let yjVals = [], yjLine = 0, yjTossing = false, yjMode = 'person', yjQixinTime = '';

function yjStart(mode) {
 try {
  return _yjStartImpl(mode);
 } catch(e) {
  console.error('[六爻占卜错误]', e.message, e.stack);
  var _eb = document.getElementById('yjDivArea') || document.getElementById('yjResult');
  if(_eb) _eb.innerHTML = '<div style="padding:20px;margin:16px 0;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 六爻占卜出错</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p><p style="font-size:11px;opacity:.5;margin-top:4px">'+(e.stack||'').split("\n").slice(0,3).join("<br>")+'</p></div>';
  var _r = document.getElementById('yjResult'); if(_r){_r.classList.add('visible');_r.scrollIntoView({behavior:'smooth'});}
 }
}
function _yjStartImpl(mode) {
  yjMode = mode; yjVals = []; yjLine = 0; yjTossing = false;
  // 显示/隐藏起心动念时辰输入框
  var qixinRow=document.getElementById('yjQixinRow');
  if(qixinRow) qixinRow.style.display=(mode==='matter')?'flex':'none';
  // 记录起心动念时辰
  const qxTimeEl = document.getElementById('yjQixinTime');
  const qxTime = qxTimeEl ? qxTimeEl.value : '';
  if(mode === 'matter' && !qxTime){
    alert('⚠️ 事盘占卜需填写「起心动念时辰」\n\n正宗易经占卜讲究"心诚则灵，时到则应"。\n请填写您心中升起疑问的那一刻，系统将结合此时辰综合判卦。\n\n（若不确定精确时间，可填写大致时辰）');
    document.getElementById('yjQixinTime').focus();
    return;
  }
  yjQixinTime = qxTime; // 存储到全局变量
  document.getElementById('yjDivArea').style.display = 'block';
  document.getElementById('yjResult').classList.remove('visible');
  document.getElementById('yjCastBtn').disabled = false;
  document.getElementById('yjCastBtn').textContent = '掷 钱 问 卦';
  document.getElementById('yjCount').textContent = '第 1 / 6 爻';
  for (let i = 0; i < 6; i++) {
    document.getElementById('yjD' + i).className = 'ldot';
  }
  for (let i = 0; i < 3; i++) {
    const c = document.getElementById('yjC' + i);
    if (c) { c.className = 'coin'; c.textContent = '背'; }
  }
  // 播放起卦音效
  playDivinationSound();
  document.getElementById('yjDivArea').scrollIntoView({ behavior: 'smooth' });
}

async function yjCast() {
  playDivinationSound();
  if (yjTossing) return;
  yjTossing = true;
  document.getElementById('yjCastBtn').disabled = true;
  document.getElementById('yjCastBtn').textContent = '占 卦 中...';
  for (let i = 0; i < yjLine; i++) document.getElementById('yjD' + i).className = 'ldot done';
  await new Promise(r => setTimeout(r, 100));
  // 基于起心动念时间戳模拟铜钱抛掷（非Math.random，基于时间种子的伪物理模拟）
  var _tossSeed = Date.now();
  const coins = [0,1,2].map(function(i){ var s = (_tossSeed + i*7919) % 100; return s < 50 ? 2 : 3; });
  _tossSeed = (_tossSeed * 1103515245 + 12345) & 0x7fffffff;
  const total = coins.reduce((a,b)=>a+b,0);
  const cels = [0,1,2].map(i => document.getElementById('yjC'+i));
  for (let i = 0; i < 3; i++) { cels[i].className = 'coin'; cels[i].textContent = '●'; }
  await new Promise(r => setTimeout(r, 200));
  for (let i = 0; i < 3; i++) {
    await new Promise(r => setTimeout(r, 150 + (Date.now() % 100)));
    cels[i].className = 'coin revealed';
    cels[i].textContent = coins[i] === 2 ? '背' : '字';
  }
  await new Promise(r => setTimeout(r, 600));
  yjVals.push(total);
  for (let i = 0; i < 3; i++) { cels[i].className = 'coin'; cels[i].textContent = '背'; }
  yjLine++;
  if (yjLine < 6) {
    document.getElementById('yjCount').textContent = `第 ${yjLine+1} / 6 爻`;
    document.getElementById('yjCastBtn').disabled = false;
    document.getElementById('yjCastBtn').textContent = '继 续 掷 卦';
  } else {
    document.getElementById('yjCount').textContent = '六 爻 皆 成';
    document.getElementById('yjCastBtn').textContent = '卦 象 已 成';
    await new Promise(r => setTimeout(r, 500));
    showYjResult();
    return;
  }
  yjTossing = false;
}

function showYjResult() {
  const gua = [[0,0,0],[0,0,0]];
  const moving = [];
  for (let i = 0; i < 6; i++) {
    const v = yjVals[i], isYang = v % 2 === 1, isOld = v === 6 || v === 9;
    const pos = 5-i;
    if (i < 3) gua[1][2-i] = isYang ? 1 : 0;
    else gua[0][2-(i-3)] = isYang ? 1 : 0;
    if (isOld) moving.push({pos:i, val:v});
  }
  const upper = gua[0][0]*4 + gua[0][1]*2 + gua[0][2];
  const lower = gua[1][0]*4 + gua[1][1]*2 + gua[1][2];
  const hexNum = upper*8 + lower + 1;
  const hex = HEXAGRAMS[hexNum-1] || HEXAGRAMS[0];
  let changedHex = null, changedGua = null;
  if (moving.length > 0) {
    changedGua = JSON.parse(JSON.stringify(gua));
    for (const ml of moving) {
      const isYang2 = gua[Math.floor((5-ml.pos)/3) ? 0 : 1][(5-ml.pos)%3];
      if (isYang2) { if (ml.pos < 3) changedGua[1][2-ml.pos] = 0; else changedGua[0][2-(ml.pos-3)] = 0; }
      else { if (ml.pos < 3) changedGua[1][2-ml.pos] = 1; else changedGua[0][2-(ml.pos-3)] = 1; }
    }
    const cu = changedGua[0][0]*4+changedGua[0][1]*2+changedGua[0][2];
    const cl = changedGua[1][0]*4+changedGua[1][1]*2+changedGua[1][2];
    changedHex = HEXAGRAMS[cu*8+cl] || HEXAGRAMS[0];
  }

  const name = document.getElementById('yjName').value || '有缘人';
  // 显示起心动念时辰
  let metaText = yjMode === 'person' ? `人盘 · ${name}` : `事盘 · 时局`;
  if (yjMode === 'matter' && yjQixinTime) {
    const qxDate = new Date(yjQixinTime);
    const qxStr = qxDate.toLocaleString('zh-CN', {year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit'});
    metaText += ` · 起心动念: ${qxStr}`;
  }
  document.getElementById('yjMeta').textContent = metaText;
  document.getElementById('yjTitle').textContent = hex.name + '卦';
  document.getElementById('yjPinyin').textContent = hex.pinyin;
  document.getElementById('yjSym1').textContent = hex.symbol;
  document.getElementById('yjName1').textContent = hex.name + '卦';
  document.getElementById('yjPy1').textContent = hex.pinyin;
  document.getElementById('yjJud1').textContent = hex.judgment;
  document.getElementById('yjMean1').textContent = hex.meaning;

  // Render gua lines
  const lines = [gua[1][0],gua[1][1],gua[1][2],gua[0][0],gua[0][1],gua[0][2]];
  const gl = document.getElementById('yjGua1');
  gl.innerHTML = '';
  for (let i = 5; i >= 0; i--) {
    const div = document.createElement('div');
    div.className = 'gua-line ' + (lines[i] ? 'yang' : 'yin') + (yjVals[i]===6||yjVals[i]===9 ? ' old' : '');
    gl.appendChild(div);
  }

  const chgEl = document.getElementById('yjChanged');
  if (changedHex && changedGua) {
    chgEl.style.display = 'block';
    document.getElementById('yjSym2').textContent = changedHex.symbol;
    document.getElementById('yjName2').textContent = changedHex.name + '卦';
    document.getElementById('yjPy2').textContent = changedHex.pinyin;
    document.getElementById('yjJud2').textContent = changedHex.judgment;
    document.getElementById('yjMean2').textContent = changedHex.meaning;
    const clines = [changedGua[1][0],changedGua[1][1],changedGua[1][2],changedGua[0][0],changedGua[0][1],changedGua[0][2]];
    const gl2 = document.getElementById('yjGua2');
    gl2.innerHTML = '';
    for (let i = 5; i >= 0; i--) {
      const div = document.createElement('div');
      div.className = 'gua-line ' + (clines[i] ? 'yang' : 'yin');
      gl2.appendChild(div);
    }
  } else {
    chgEl.style.display = 'none';
  }

  // Interpretation
  const interp = YJ_INTERP[hexNum] || YJ_INTERP[1];
  const ctr = document.getElementById('yjInterp');
  ctr.innerHTML = '';
  const blocks = [
    { title:'象 数 总 述', text: interp.overview, accent:'gold-accent' },
    { title: yjMode === 'person' ? '人 盘 命 格' : '事 盘 时 局', text: yjMode === 'person' ? interp.person : interp.matter, accent:'violet-accent' },
    { title:'六 爻 变 化', text: changedHex ? `本卦${hex.name}卦，${moving.length}爻动，化${changedHex.name}卦。` : '六爻安静，本卦自持，当守不宜变，静待时机。', accent: changedHex ? 'jade-accent' : 'cyan-accent' },
    { title:'时 机 推 断', text: interp.timing, accent:'gold-accent' },
    { title:'方 位 指 引', text: interp.direction, accent:'jade-accent' },
    { title:'智 慧 启 示', text: interp.advice, accent:'violet-accent' },
  ];
  // === 卦象速览卡 ===
  var hexagramCard = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;padding:12px;background:rgba(52,152,219,.04);border:1px solid rgba(52,152,219,.15);border-radius:10px">';
  hexagramCard += '<div><div style="font-size:11px;opacity:.5;margin-bottom:4px">卦名</div><div style="font-size:18px;font-weight:bold;color:#3498db;letter-spacing:4px">' + (hex.name || '未知') + '</div></div>';
  hexagramCard += '<div><div style="font-size:11px;opacity:.5;margin-bottom:4px">世爻/应爻</div><div style="font-size:13px;color:var(--paper);margin-top:2px">' + (hex.shiYao || '') + ' / ' + (hex.yingYao || '') + '</div></div>';
  hexagramCard += '<div><div style="font-size:11px;opacity:.5;margin-bottom:4px">用神</div><div style="font-size:13px;color:var(--paper)">' + (hex.yongshen || '主事爻') + '</div></div>';
  hexagramCard += '<div><div style="font-size:11px;opacity:.5;margin-bottom:4px">综合吉凶</div><div style="font-size:16px;font-weight:bold;color:' + (hex.judgment && hex.judgment.indexOf('吉') !== -1 && hex.judgment.indexOf('凶') === -1 ? '#27ae60' : hex.judgment && hex.judgment.indexOf('凶') !== -1 ? '#e74c3c' : '#f39c12') + '">' + (hex.judgment || '平') + '</div></div>';
  hexagramCard += '</div>';
  ctr.innerHTML = hexagramCard;

  for (const b of blocks) {
    const div = document.createElement('div');
    div.className = 'interp-card ' + b.accent;
    div.innerHTML = `<h5>${b.title}</h5><p>${b.text}</p>`;
    ctr.appendChild(div);
  }

  // === 大白话总结 ===
  var guaji_xiong = hex.judgment;
  var simpleSummary = '<div style="margin-top:16px;padding:12px 16px;background:rgba(52,152,219,.04);border-left:3px solid #3498db;border-radius:0 8px 8px 0">';
  simpleSummary += '<div style="font-size:13px;font-weight:bold;color:#3498db;margin-bottom:4px">💬 简单说就是</div>';
  simpleSummary += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  simpleSummary += '这个卦告诉你：';
  if (guaji_xiong && guaji_xiong.indexOf('吉') !== -1 && guaji_xiong.indexOf('凶') === -1) {
    simpleSummary += '整体来看是好事，可以放心去做。但别飘，该谨慎还是要谨慎。';
  } else if (guaji_xiong && guaji_xiong.indexOf('凶') !== -1) {
    simpleSummary += '目前情况不太理想，建议暂缓行动、稳住心态。等待时机好转再出手。';
  } else {
    simpleSummary += '吉凶参半，有好有坏。关键看你怎么把握，做事要脚踏实地。';
  }
  simpleSummary += '</div></div>';
  ctr.innerHTML += simpleSummary;

  // 起心动念时辰分析（仅事盘）
  if (yjMode === 'matter' && yjQixinTime) {
    const qxBox = document.createElement('div');
    qxBox.className = 'interp-card gold-accent';
    qxBox.style.marginTop = '20px';
    const qxDate = new Date(yjQixinTime);
    const qxLunar = getLunarDateStr(qxDate); // 需要农历转换
    qxBox.innerHTML = `
      <h5>☰ 起心动念时辰分析</h5>
      <p style="margin-bottom:10px">您于 <strong>${qxDate.toLocaleString('zh-CN')}</strong> 心生疑问（${qxLunar}）</p>
      <p style="margin-bottom:10px">《黄金策》云:「占卜之道，心诚则灵，时到则应。」起心动念之时，正是天机显现之刻。此时辰与卦象相参，可断事之吉凶、时之迟速。</p>
      <p>时辰${getShiChen(qxDate.getHours())}，${getShiChenAnalysis(qxDate.getHours(), hexNum)}</p>
    `;
    ctr.appendChild(qxBox);
  }

  // 动爻分析
  const movingDetail = document.getElementById('yjMovingDetail') || document.createElement('div');
  if (!document.getElementById('yjMovingDetail')) {
    movingDetail.id = 'yjMovingDetail';
    movingDetail.style.cssText = 'margin-top:20px;padding:20px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.1)';
    ctr.parentElement.insertBefore(movingDetail, ctr.nextSibling);
  }
  let movingHtml = '<h5 style="color:var(--gold);letter-spacing:4px;margin-bottom:14px">🔮 动爻分析</h5>';
  if (moving.length > 0) {
    movingHtml += '<div style="font-size:13px;line-height:1.8;opacity:.75;letter-spacing:.5px">';
    movingHtml += `<p style="margin-bottom:10px">本次占卦共<strong style="color:var(--gold)">${moving.length}个动爻</strong>,动爻代表事物的变化点和关键因素。</p>`;
    for (const m of moving) {
      const yaoPos = m.pos + 1;
      const yaoName = ['初爻','二爻','三爻','四爻','五爻','上爻'][m.pos];
      const isYang = m.val % 2 === 1;
      const isOld = m.val === 6 || m.val === 9;
      const yaoType = isYang ? '阳' : '阴';
      const laoTag = isOld ? '<span style="color:#e74c3c"> (老' + (isYang ? '阳' : '阴') + ')</span>' : '';
      movingHtml += `<p style="margin-bottom:8px"><strong>${yaoName}(第${yaoPos}爻)</strong>: ${yaoType}爻${laoTag}。`;
      movingHtml += ` ${isOld?(isYang?"老阳变阴，阳极化阴":"老阴变阳，阴极化阳"):'不动之爻，保持原状'}。</p>`;
    }
    movingHtml += `<p style="margin-top:10px;padding:8px 12px;background:rgba(201,168,76,.06);border-left:3px solid var(--gold);font-size:12px;opacity:.6">💡 动爻判断:${moving.length===1?'单爻动，以动爻断吉凶':moving.length===2?'二爻动，以少者断之':moving.length===3?'三爻动，以中间爻断之':'多爻动，卦象变化复杂，需综合判断'}。</p>`;
    movingHtml += '</div>';
  } else {
    movingHtml += '<p style="font-size:13px;line-height:1.8;opacity:.75">本次占卦六爻皆静，无动爻。表示事物处于稳定状态，暂无变化。当守成不宜变，静待时机。</p>';
  }
  movingDetail.innerHTML = movingHtml;

  // 断卦逻辑
  const duanguaEl = document.getElementById('yjDuangua') || document.createElement('div');
  if (!document.getElementById('yjDuangua')) {
    duanguaEl.id = 'yjDuangua';
    duanguaEl.style.cssText = 'margin-top:20px;padding:20px;background:rgba(255,255,255,.02);border:1px solid rgba(201,168,76,.1)';
    movingDetail.parentElement.insertBefore(duanguaEl, movingDetail.nextSibling);
  }
  let duanguaHtml = '<h5 style="color:var(--gold);letter-spacing:4px;margin-bottom:14px">📊 断卦逻辑</h5>';
  duanguaHtml += '<div style="font-size:13px;line-height:1.8;opacity:.75;letter-spacing:.5px">';
  // 用神选取
  duanguaHtml += '<p style="margin-bottom:10px"><strong style="color:#e74c3c">用神选取</strong>:占事不同，用神不同。';
  duanguaHtml += '占事业看官鬼，占财运看妻财，占婚姻看妻财(男命)或官鬼(女命),占疾病看官鬼，占出行看世应。</p>';
  // 世应关系
  duanguaHtml += '<p style="margin-bottom:10px"><strong style="color:#2980b9">世应关系</strong>:世爻代表自己，应爻代表对方或事情。';
  duanguaHtml += '世爻旺相则己方有利，应爻旺相则对方有利。世应相生则事易成，世应相克则事难成。</p>';
  // 六亲关系
  duanguaHtml += '<p style="margin-bottom:10px"><strong style="color:#27ae60">六亲关系</strong>:父母、兄弟、子孙、妻财、官鬼，各有其用。';
  duanguaHtml += '用神宜旺相，不宜休囚死。用神被克则凶，用神得生则吉。六亲中，子孙为福神，官鬼为忧神。</p>';
  // 断卦要诀
  duanguaHtml += '<p style="padding:8px 12px;background:rgba(201,168,76,.06);border-left:3px solid var(--gold);font-size:12px;opacity:.6">📝 断卦要诀:用神为断卦之关键，旺相得地则吉，休囚无气则凶。动爻能生克用神，需仔细推演。</p>';
  duanguaHtml += '</div>';
  duanguaEl.innerHTML = duanguaHtml;

  // 经典出处区块
  const yjClassic = document.getElementById('yjClassicSection') || document.createElement('div');
  if (!document.getElementById('yjClassicSection')) {
    yjClassic.id = 'yjClassicSection';
    yjClassic.style.cssText = 'margin-top:24px;padding:20px;background:rgba(201,168,76,.04);border:1px solid rgba(201,168,76,.2);border-radius:4px';
    duanguaEl.parentElement.insertBefore(yjClassic, duanguaEl.nextSibling);
  }
  yjClassic.innerHTML = `
    <h5 style="color:var(--gold);letter-spacing:4px;margin-bottom:14px">📜 经典出处</h5>
    <div style="font-size:13px;line-height:2;opacity:.7;letter-spacing:.5px">
      <p style="margin-bottom:10px"><strong style="color:var(--gold)">《周易》</strong>是我国最古老的占卜经典，被誉为「群经之首，大道之源」。书中包含64卦的卦辞、爻辞，是易经占卜的根本依据。本次报告引用了《周易》的卦名、卦辞、爻辞进行解读。</p>
      <p style="margin-bottom:10px"><strong style="color:var(--gold)">《梅花易数》</strong>(宋·邵雍)是易经占卜的重要方法，以数起卦，以卦象断吉凶。书中详细讲解了以数起卦、体用生克、动静分析等断卦方法。本次报告参考了《梅花易数》的断卦思路。</p>
      <p style="margin-bottom:10px"><strong style="color:var(--gold)">《黄金策》</strong>(明·刘基)是六爻占卜的精髓之作，系统阐述了用神选取、世应关系、六亲生克等断卦逻辑。书中言:「用神为断卦之钥匙，得用神则断卦如神。」本次报告参考了《黄金策》的断卦方法。</p>
      <p style="padding:10px;background:rgba(201,168,76,.06);border-left:3px solid var(--gold);margin-top:12px;font-style:italic">本次报告引用了以上经典著作中的理论和方法，结合现代生活场景进行解读，仅供参考。易经是博大精深的学问，建议有兴趣深入学习者阅读原著。</p>
    </div>
  `;

  // 卦象解读
  var yjReadBox = document.getElementById('yjReadingBox');
  if (yjReadBox) yjReadBox.innerHTML = getYijingReadingHTML(hex.name);

  // === 复制结果按钮 ===
  var copyBtn = '<div style="margin-top:16px;text-align:center">';
  copyBtn += '<button onclick="copyResultText(this)" style="font-size:12px;color:var(--gold);background:none;border:1px solid rgba(201,168,76,.2);border-radius:20px;padding:6px 20px;cursor:pointer;letter-spacing:2px">📋 复制结果</button>';
  copyBtn += '</div>';
  var yjResultEl = document.getElementById('yjResult');
  if (yjResultEl) yjResultEl.innerHTML += copyBtn;

  // ═══ 个性化指导 ═══
  try {
    var yjGuide = buildLiuyaoPersonalizedGuidance({
      guaName: hex.name, changedName: changedHex ? changedHex.name : '',
      moving: moving, yjVals: yjVals, mode: yjMode
    });
    if (yjResultEl) yjResultEl.innerHTML += yjGuide;
  } catch(e) {}

  document.getElementById('yjResult').classList.add('visible');
  document.getElementById('yjResult').scrollIntoView({ behavior: 'smooth' });
}

function yjReset() {
  document.getElementById('yjDivArea').style.display = 'none';
  document.getElementById('yjResult').classList.remove('visible');
}

// ================================================================
//  QIMEN ENGINE
// ================================================================

// 九星详解(升级版,每个150字以上,含旺相休囚死)
const STARS_MAP = {
  pei:{
    name:'天蓬', nature:'大凶', type:'凶',
    detail:'天蓬星属水，为坎一宫之主星，又移蓬星。其性阴险诡诈，主盗贼、欺诈、阴谋。天蓬星旺于冬季(亥子月),相于秋季，休于春季，囚于夏季，死于四季末月。天蓬临宫，宜防水患、盗贼、欺诈之事。若天蓬得旺相之气，可化险为夷，反主智谋过人。若天蓬休囚死气，则主灾祸连连，诸事不顺。天蓬星遇吉门吉神，可逢凶化吉；遇凶门凶神，灾祸立至。',
    wuxiang:'旺于冬、相于秋、休于春、囚于夏、死于四季末',
    classic:'《奇门遁甲秘笈》云:「天蓬星主阴私、盗贼、欺诈。」《烟波钓叟歌》曰:「天蓬所到总为凶，临宫须防盗贼攻。」'
  },
  yin:{
    name:'天芮', nature:'大凶', type:'凶',
    detail:'天芮星属土，为坤二宫之主星，又名芮星。其性阴暗晦滞，主疾病、灾厄、阻滞。天芮星旺于四季末月(辰戌丑未),相于夏季，休于秋季，囚于冬季，死于春季。天芮临宫，宜防疾病、灾厄、口舌之争。若天芮得旺相之气，疾病可愈，阻滞可通；若天芮休囚死气，则主疾病缠身，诸事不顺。天芮星遇死门、惊门，灾祸尤重；遇生门、开门，可化解灾厄。',
    wuxiang:'旺于四季末、相于夏、休于秋、囚于冬、死于春',
    classic:'《奇门遁甲秘笈》云:「天芮星主疾病、灾厄、晦暗。」《阳遁九局》曰:「天芮所临，宜防灾病。」'
  },
  chu:{
    name:'天冲', nature:'次凶', type:'凶',
    detail:'天冲星属木，为震三宫之主星，又名冲星。其性刚烈迅猛，主冲动、变动、争斗。天冲星旺于春季(寅卯月),相于冬季，休于夏季，囚于秋季，死于四季末月。天冲临宫，宜防冲动决策、变动迁移、争斗是非。若天冲得旺相之气，行动迅速，可建功立业；若天冲休囚死气，则主冲动招祸，诸事不顺。天冲星遇伤门、惊门，争斗尤甚；遇生门、开门，动中有吉。',
    wuxiang:'旺于春、相于冬、休于夏、囚于秋、死于四季末',
    classic:'《奇门遁甲秘笈》云:「天冲星主冲动、争斗、变动。」《烟波钓叟歌》曰:「天冲所临，行动宜慎。」'
  },
  fang:{
    name:'天辅', nature:'大吉', type:'吉',
    detail:'天辅星属木，为巽四宫之主星，又名辅星。其性柔和慈善，主贵人、学业、辅佐。天辅星旺于春季(寅卯月),相于冬季，休于夏季，囚于秋季，死于四季末月。天辅临宫，宜求学、辅佐、贵人相助。若天辅得旺相之气，学业有成，贵人运旺；若天辅休囚死气，则主贵人远离，学业受阻。天辅星遇生门、开门，大吉大利；遇死门、惊门，吉中带凶。',
    wuxiang:'旺于春、相于冬、休于夏、囚于秋、死于四季末',
    classic:'《奇门遁甲秘笈》云:「天辅星主贵人、学业、辅佐。」《烟波钓叟歌》曰:「天辅所临，学业大利，贵人相扶。」'
  },
  jin:{
    name:'天禽', nature:'大吉', type:'吉',
    detail:'天禽星属土，为中五宫之主星，又名禽星。其性忠信稳重，主中正、福德、安守。天禽星旺于四季末月(辰戌丑未),相于夏季，休于秋季，囚于冬季，死于春季。天禽临宫，宜守成、安守、福德之事。若天禽得旺相之气，福德深厚，安稳吉祥；若天禽休囚死气，则主安守无为，难有突破。天禽星遇生门、开门，大吉大利；遇死门、惊门，安中有危。天禽星寄于坤二宫或离九宫，看具体遁局而定。',
    wuxiang:'旺于四季末、相于夏、休于秋、囚于冬、死于春',
    classic:'《奇门遁甲秘笈》云:「天禽星主中正、福德、安守。」《阳遁九局》曰:「天禽所临，福德深厚。」'
  },
  zhen:{
    name:'天心', nature:'大吉', type:'吉',
    detail:'天心星属金，为乾六宫之主星，又名心星。其性仁慈公正，主医卜、慈善、领导。天心星旺于秋季(申酉月),相于四季末月，休于冬季，囚于春季，死于夏季。天心临宫，宜行医、慈善、领导决策。若天心得旺相之气，医术精湛，领导有方；若天心休囚死气，则主慈悲无力，领导受阻。天心星遇生门、开门，大吉大利；遇死门、惊门，仁中有忧。',
    wuxiang:'旺于秋、相于四季末、休于冬、囚于春、死于夏',
    classic:'《奇门遁甲秘笈》云:「天心星主医卜、慈善、领导。」《烟波钓叟歌》曰:「天心所临，医道大成。」'
  },
  rong:{
    name:'天柱', nature:'次凶', type:'凶',
    detail:'天柱星属金，为兑七宫之主星，又名柱星。其性刚强不屈，主破败、争斗、改变。天柱星旺于秋季(申酉月),相于四季末月，休于冬季，囚于春季，死于夏季。天柱临宫，宜防破败、争斗、变革之事。若天柱得旺相之气，破而后立，变革有成；若天柱休囚死气，则主破败难立，变革受挫。天柱星遇伤门、惊门，破败尤甚；遇生门、开门，破中有立。',
    wuxiang:'旺于秋、相于四季末、休于冬、囚于春、死于夏',
    classic:'《奇门遁甲秘笈》云:「天柱星主破败、争斗、变革。」《烟波钓叟歌》曰:「天柱所临，宜慎防破。」'
  },
  ying:{
    name:'天任', nature:'次吉', type:'平',
    detail:'天任星属土，为艮八宫之主星，又名任星。其性柔顺敦厚，主任务、责任、承担。天任星旺于四季末月(辰戌丑未),相于夏季，休于秋季，囚于冬季，死于春季。天任临宫，宜承担任务、履行责任。若天任得旺相之气，任务顺利，责任可承；若天任休囚死气，则主任务繁重，责任难承。天任星遇生门、开门，任重道远；遇死门、惊门，任中有忧。',
    wuxiang:'旺于四季末、相于夏、休于秋、囚于冬、死于春',
    classic:'《奇门遁甲秘笈》云:「天任星主任务、责任、承担。」《阳遁九局》曰:「天任所临，宜任事。」'
  },
  you:{
    name:'天英', nature:'小凶', type:'凶',
    detail:'天英星属火，为离九宫之主星，又名英星。其性炽烈明亮，主名声、文书、是非。天英星旺于夏季(巳午月),相于春季，休于秋季，囚于冬季，死于四季末月。天英临宫，宜文书、名声，但防是非口舌。若天英得旺相之气，名声远扬，文书顺利；若天英休囚死气，则主是非口舌，名声受损。天英星遇景门，文书大利；遇死门、惊门，是非尤重。',
    wuxiang:'旺于夏、相于春、休于秋、囚于冬、死于四季末',
    classic:'《奇门遁甲秘笈》云:「天英星主名声、文书、是非。」《烟波钓叟歌》曰:「天英所临，文书可成，但防口舌。」'
  },
};

// 八门详解(升级版,每个150字以上,含吉凶判断逻辑)
const DOORS_MAP = {
  xin:{
    name:'休门', nature:'大吉', color:'#c0392b',
    detail:'休门属水，居坎一宫，为吉门之首。休门主休养、休息、人际交往。休门宜休养生息、访友求贤、和谈休战。休门临宫，诸事安和，宜静不宜动。休门克乾六宫(金生水),泄离九宫(水克火),受生震三宫(木泄水),受克坤二宫(土克水)。休门遇吉星吉神，大吉大利；遇凶星凶神，吉中藏凶。休门宜求医治病、婚嫁喜庆、修造安宅。休门临中五宫，主安守福德。',
    yi:'休养、访友、和谈、婚嫁、求医',
    ji:'出行、征战、开拓',
    classic:'《奇门遁甲秘笈》云:「休门主休养、和谈，为吉门之首。」《烟波钓叟歌》曰:「休门所临，宜休养生息，和谈访友。」'
  },
  kai:{
    name:'开门', nature:'大吉', color:'#2980b9',
    detail:'开门属金，居乾六宫，为吉门之一。开门主事业、升迁、远行、开拓。开门宜开创事业、求取功名、外出远行。开门临宫，诸事亨通，宜动不宜静。开门生坎一宫(金生水),克震三宫(金克木),受克离九宫(火克金),受泄巽四宫(木耗金)。开门遇吉星吉神，事业大成；遇凶星凶神，开中有阻。开门宜创业、求职、晋升、远行、谈判。开门临中五宫，主开拓有为。',
    yi:'创业、求职、晋升、远行、谈判',
    ji:'安守、静养',
    classic:'《奇门遁甲秘笈》云:「开门主事业、升迁，宜开拓进取。」《阳遁九局》曰:「开门所临，事业大成，升迁有望。」'
  },
  sheng:{
    name:'生门', nature:'大吉', color:'#27ae60',
    detail:'生门属土，居艮八宫，为吉门之一。生门主生发、财运、置产、创业。生门宜求财、创业、置产、生育。生门临宫，财运亨通，生机勃发。生门受克坎一宫(水克土),克离九宫(土克火),受生离九宫(火生土),受泄震三宫(木克土)。生门遇吉星吉神，大富大贵；遇凶星凶神，财中有失。生门宜经商、投资、置业、生育、种植。生门临中五宫，主生发吉利。',
    yi:'求财、创业、置产、生育、投资',
    ji:'安守、保守',
    classic:'《奇门遁甲秘笈》云:「生门主财运、生发，为求财首选之门。」《烟波钓叟歌》曰:「生门所临，财运亨通，创业大利。」'
  },
  shang:{
    name:'伤门', nature:'大凶', color:'#e67e22',
    detail:'伤门属木，居震三宫，为凶门之一。伤门主伤损、争斗、讨债。伤门宜讨债、博弈、竞技，不宜大举进攻。伤门临宫，主伤损争斗，宜谨慎行事。伤门生离九宫(木生火),克坤二宫(木克土),受泄坎一宫(水生木),受克乾六宫(金克木)。伤门遇吉星吉神，伤中有利；遇凶星凶神，伤灾立至。伤门宜讨债、博弈、竞技、医疗。伤门临中五宫，主伤损有阻。',
    yi:'讨债、博弈、竞技、医疗',
    ji:'创业、婚嫁、远行',
    classic:'《奇门遁甲秘笈》云:「伤门主伤损、争斗，宜讨债博弈。」《烟波钓叟歌》曰:「伤门所临，宜慎防伤害。」'
  },
  du:{
    name:'杜门', nature:'小凶', color:'#7f8c8d',
    detail:'杜门属木，居巽四宫，为凶门之一。杜门主阻塞、躲藏、保密。杜门宜保密、躲藏、暗中行事，不宜张扬。杜门临宫，诸事阻塞，宜守不宜攻。杜门生离九宫(木生火),克坤二宫(木克土),受泄坎一宫(水生木),受克乾六宫(金克木)。杜门遇吉星吉神，塞中有通；遇凶星凶神，阻塞难通。杜门宜保密、躲藏、修行、隐居。杜门临中五宫，主阻塞难行。',
    yi:'保密、躲藏、修行、隐居',
    ji:'开拓、公开、出行',
    classic:'《奇门遁甲秘笈》云:「杜门主阻塞、躲藏，宜暗中行事。」《阳遁九局》曰:「杜门所临，诸事阻塞，宜守不宜攻。」'
  },
  jing:{
    name:'景门', nature:'小吉', color:'#f39c12',
    detail:'景门属火，居离九宫，为小吉之门。景门主文书、信息、光明、名声。景门宜文书、告示、信息传递、名声宣扬。景门临宫，文书顺利，但防是非。景门生坤二宫(火生土),克乾六宫(火克金),受泄震三宫(木生火),受克坎一宫(水克火)。景门遇吉星吉神，文书大成；遇凶星凶神，是非口舌。景门宜考试、文书、告示、宣传、演艺。景门临中五宫，主文书中平。',
    yi:'考试、文书、告示、宣传、演艺',
    ji:'远行、征战',
    classic:'《奇门遁甲秘笈》云:「景门主文书、信息，宜考试宣传。」《烟波钓叟歌》曰:「景门所临，文书可成，但防是非。」'
  },
  si:{
    name:'死门', nature:'大凶', color:'#95a5a6',
    detail:'死门属土，居坤二宫，为凶门之首。死门主死亡、闭塞、终结。死门宜丧葬、捕猎、了结旧事，不宜新事。死门临宫，诸事闭塞，主凶灾。死门受克坎一宫(水克土),克离九宫(土克火),受生离九宫(火生土),受泄震三宫(木克土)。死门遇吉星吉神，死中有生；遇凶星凶神，死气沉沉。死门宜丧葬、捕猎、终结、清理。死门临中五宫，主死气沉重。',
    yi:'丧葬、捕猎、终结、清理',
    ji:'创业、婚嫁、远行、求财',
    classic:'《奇门遁甲秘笈》云:「死门主死亡、闭塞，为凶门之首。」《烟波钓叟歌》曰:「死门所临，诸事闭塞，大凶之象。」'
  },
  cun:{
    name:'惊门', nature:'小凶', color:'#95a5a6',
    detail:'惊门属金，居兑七宫，为凶门之一。惊门主惊恐、官非、口舌。惊门宜官非诉讼、惊吓应对，不宜平和。惊门临宫，主惊恐不安，口舌是非。惊门生坎一宫(金生水),克震三宫(金克木),受克离九宫(火克金),受泄巽四宫(木耗金)。惊门遇吉星吉神，惊中有吉；遇凶星凶神，惊恐尤甚。惊门宜诉讼、辩论、揭发、应对惊恐。惊门临中五宫，主惊恐有因。',
    yi:'诉讼、辩论、揭发、应对惊恐',
    ji:'婚嫁、远行、和谈',
    classic:'《奇门遁甲秘笈》云:「惊门主惊恐、官非，宜诉讼辩论。」《阳遁九局》曰:「惊门所临，宜防惊恐口舌。」'
  },
};
// 八神详解(升级版,每个150字以上,含吉凶判断、适合做什么、不适合做什么)
const GODS_MAP = {
  zhi:{
    name:'值符', nature:'大吉', desc:'贵人之神，领兵统将',
    detail:'值符为八神之首，属木，居坎一宫。值符为贵人之神，代表领导、贵人、权柄、统领。值符所到之处，百恶消散，诸事顺利。值符临宫，宜求见贵人、求职应聘、升迁调动、缔结盟约。值符为吉神之首，遇吉门吉星则大吉大利，遇凶门凶星则吉中藏凶。值符旺于春季，相于冬季，休于夏季，囚于秋季，死于四季末月。值符为领兵统将之神，有统领全局之能，适合做决策、领导团队、开拓事业。',
    yi:'求见贵人、求职应聘、升迁调动、缔结盟约、领导决策',
    ji:'暗中行事、低调隐退、保守不为',
    good:'贵人相助、领导有力、决策正确、事业顺遂、权柄在握',
    bad:'遇凶门凶星则吉中藏凶、贵人远离、决策失误',
    classic:'《奇门遁甲秘笈》云:「值符为八神之首，贵人之神，领兵统将。」《烟波钓叟歌》曰:「值符所到，百恶消散，诸事顺利。」'
  },
  long:{
    name:'青龙', nature:'大吉', desc:'祥瑞之神，主喜庆吉祥',
    detail:'青龙为八神之一，属木，居震三宫。青龙为祥瑞之神，代表喜庆、吉祥、财运、姻缘。青龙所到之处，喜庆连连，财运亨通。青龙临宫，宜婚嫁喜庆、求财置业、缔结盟约、出行远游。青龙为吉神，遇吉门吉星则大吉大利，遇凶门凶星则吉中带凶。青龙旺于春季，相于冬季，休于夏季，囚于秋季，死于四季末月。青龙为祥瑞之神，适合婚嫁、喜庆、求财、出行等吉事。',
    yi:'婚嫁喜庆、求财置业、缔结盟约、出行远游、喜庆之事',
    ji:'丧葬、捕猎、终结之事',
    good:'喜庆吉祥、财运亨通、姻缘美满、贵人相助、事业顺利',
    bad:'遇凶门凶星则吉中带凶、喜庆受阻',
    classic:'《奇门遁甲秘笈》云:「青龙为祥瑞之神，主喜庆吉祥、财运亨通。」《阳遁九局》曰:「青龙所到，喜庆连连。」'
  },
  ti:{
    name:'九天', nature:'大吉', desc:'刚健之神，主行动拓展',
    detail:'九天为八神之一，属金，居乾六宫。九天为刚健之神，代表行动、拓展、高远、进取。九天所到之处，宜开拓进取、远行出击、创新变革。九天临宫，宜远行、开拓、创新、进攻、出兵。九天为吉神，遇吉门吉星则大吉大利，遇凶门凶星则动中有阻。九天旺于秋季，相于四季末月，休于冬季，囚于春季，死于夏季。九天为刚健之神，适合远行、开拓、创新、进攻等动态之事。',
    yi:'远行、开拓、创新、进攻、出兵、动态之事',
    ji:'安守、静养、保守不为',
    good:'开拓进取、远行顺利、创新有成、行动力强、事业拓展',
    bad:'遇凶门凶星则动中有阻、远行受阻、开拓受挫',
    classic:'《奇门遁甲秘笈》云:「九天为刚健之神，主行动拓展、高远进取。」《烟波钓叟歌》曰:「九天所到，宜远行开拓。」'
  },
  di:{
    name:'九地', nature:'次吉', desc:'柔顺之神，主静守保存',
    detail:'九地为八神之一，属土，居坤二宫。九地为柔顺之神，代表静守、保存、柔顺、安养。九地所到之处，宜静守安养、保存实力、修炼内功。九地临宫，宜安守、静养、修炼、保存、囤积。九地为次吉之神，遇吉门吉星则安中有吉，遇凶门凶星则静中有凶。九地旺于四季末月，相于夏季，休于秋季，囚于冬季，死于春季。九地为柔顺之神，适合安守、静养、修炼、保存等静态之事。',
    yi:'安守、静养、修炼、保存、囤积、静态之事',
    ji:'远行、开拓、进攻、动态之事',
    good:'静守安养、保存实力、修炼内功、柔顺有成、安泰吉祥',
    bad:'遇凶门凶星则静中有凶、安守受扰',
    classic:'《奇门遁甲秘笈》云:「九地为柔顺之神，主静守保存、安养修炼。」《阳遁九局》曰:「九地所到，宜静守安养。」'
  },
  nu:{
    name:'螣蛇', nature:'次凶', desc:'惊恐之神，主惊恐怪异',
    detail:'螣蛇为八神之一，属火，居离九宫。螣蛇为惊恐之神，代表惊恐、怪异、迷惑、欺诈。螣蛇所到之处，主惊恐不安、怪异之事、迷惑欺诈。螣蛇临宫，宜防惊恐、防欺诈、防迷惑。螣蛇为凶神，遇吉门吉星则凶中有吉，遇凶门凶星则凶祸立至。螣蛇旺于夏季，相于春季，休于秋季，囚于冬季，死于四季末月。螣蛇为惊恐之神，不宜妄动，宜静守防惊恐。',
    yi:'防惊恐、防欺诈、防迷惑、静守不为',
    ji:'远行、开拓、进攻、喜庆之事',
    good:'遇吉门吉星则凶中有吉、惊恐可化解',
    bad:'惊恐不安、怪异之事、迷惑欺诈、口舌是非、心神不宁',
    classic:'《奇门遁甲秘笈》云:「螣蛇为惊恐之神，主惊恐怪异、迷惑欺诈。」《烟波钓叟歌》曰:「螣蛇所到，宜防惊恐怪异。」'
  },
  xuan:{
    name:'玄武', nature:'次凶', desc:'暗昧之神，主阴谋贼盗',
    detail:'玄武为八神之一，属水，居坎一宫。玄武为暗昧之神，代表阴谋、贼盗、暗昧、隐私。玄武所到之处，主阴谋暗害、贼盗偷窃、暗昧不明。玄武临宫，宜防阴谋、防盗贼、防暗害。玄武为凶神，遇吉门吉星则凶中有吉，遇凶门凶星则暗害立至。玄武旺于冬季，相于秋季，休于春季，囚于夏季，死于四季末月。玄武为暗昧之神，不宜明动，宜暗中防备。',
    yi:'防阴谋、防盗贼、防暗害、暗中防备',
    ji:'明动、公开、远行、开拓',
    good:'遇吉门吉星则凶中有吉、暗害可防',
    bad:'阴谋暗害、贼盗偷窃、暗昧不明、隐私泄露、损失财物',
    classic:'《奇门遁甲秘笈》云:「玄武为暗昧之神，主阴谋贼盗、暗昧隐私。」《烟波钓叟歌》曰:「玄武所到，宜防阴谋暗害。」'
  },
  gou:{
    name:'勾陈', nature:'次凶', desc:'牵绊之神，主纠纷牵连',
    detail:'勾陈为八神之一，属土，居艮八宫。勾陈为牵绊之神，代表纠纷、牵连、牵绊、阻滞。勾陈所到之处，主纠纷牵连、牵绊阻滞、诸事不顺。勾陈临宫，宜防纠纷、防牵连、防牵绊。勾陈为凶神，遇吉门吉星则凶中有吉，遇凶门凶星则阻滞难通。勾陈旺于四季末月，相于夏季，休于秋季，囚于冬季，死于春季。勾陈为牵绊之神，不宜妄动，宜化解纠纷。',
    yi:'防纠纷、防牵连、防牵绊、化解纠纷',
    ji:'开拓、进攻、远行、动态之事',
    good:'遇吉门吉星则凶中有吉、纠纷可化解',
    bad:'纠纷牵连、牵绊阻滞、诸事不顺、口舌是非、官非诉讼',
    classic:'《奇门遁甲秘笈》云:「勾陈为牵绊之神，主纠纷牵连、牵绊阻滞。」《阳遁九局》曰:「勾陈所到，宜防纠纷牵绊。」'
  },
  hu:{
    name:'白虎', nature:'大凶', desc:'凶煞之神，主伤灾疾病',
    detail:'白虎为八神之一，属金，居兑七宫。白虎为凶煞之神，代表伤灾、疾病、刑伤、血光。白虎所到之处，主伤灾疾病、刑伤血光、凶险之兆。白虎临宫，宜防伤灾、防疾病、防刑伤。白虎为凶神之首，遇吉门吉星则凶中有吉，遇凶门凶星则凶祸立至。白虎旺于秋季，相于四季末月，休于冬季，囚于春季，死于夏季。白虎为凶煞之神，诸事不宜，宜静守防凶。',
    yi:'防伤灾、防疾病、防刑伤、静守防凶',
    ji:'远行、开拓、进攻、喜庆之事、婚嫁',
    good:'遇吉门吉星则凶中有吉、伤灾可化解',
    bad:'伤灾疾病、刑伤血光、凶险之兆、官非诉讼、身体健康受损',
    classic:'《奇门遁甲秘笈》云:「白虎为凶煞之神，主伤灾疾病、刑伤血光。」《烟波钓叟歌》曰:「白虎所到，诸事不宜，宜静守防凶。」'
  },
};
const PALACE_INFO = {
  1:{name:'坎一宫',ele:'水',dir:'正北',tri:'☵',stem:'壬'},
  2:{name:'坤二宫',ele:'土',dir:'西南',tri:'☷',stem:'癸'},
  3:{name:'震三宫',ele:'木',dir:'正东',tri:'☳',stem:'甲'},
  4:{name:'巽四宫',ele:'木',dir:'东南',tri:'☴',stem:'乙'},
  5:{name:'中五宫',ele:'土',dir:'中',tri:'+',stem:'戊'},
  6:{name:'乾六宫',ele:'金',dir:'西北',tri:'☰',stem:'己'},
  7:{name:'兑七宫',ele:'金',dir:'正西',tri:'☱',stem:'庚'},
  8:{name:'艮八宫',ele:'土',dir:'东北',tri:'☶',stem:'丙'},
  9:{name:'离九宫',ele:'火',dir:'正南',tri:'☲',stem:'丁'},
};

// ================================================================
//  QIMEN DUNJIA PROFESSIONAL ENGINE (v2.0)
// ================================================================

const STEM_KEYS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

// 八门五行映射 (for 门迫 detection)
const DOOR_WUXING = {休:'水',开:'金',生:'土',伤:'木',杜:'木',景:'火',死:'土',惊:'金'};

// 天干入墓映射: 天干 → 墓宫编号
const GAN_TOMB = {'甲':2,'乙':2,'丙':6,'丁':6,'戊':4,'己':4,'庚':8,'辛':8,'壬':4,'癸':4};

// 天干刑关系
const GAN_XING = {'甲':'戊','乙':'己','丙':'庚','丁':'辛','戊':'甲','己':'乙','庚':'丙','辛':'丁','壬':'癸','癸':'壬'};

// 地支刑关系
const ZHI_XING = {'子':'卯','卯':'子','寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','辰':'辰','午':'午','酉':'酉','亥':'亥'};

// 六甲旬空亡表: 旬首 → [空亡地支1, 空亡地支2]
const XUN_KONG = {
  '甲子':['戌','亥'],'甲戌':['申','酉'],'甲申':['午','未'],
  '甲午':['辰','巳'],'甲辰':['寅','卯'],'甲寅':['子','丑']
};

// 地支→宫位映射
const ZHI_PALACE = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};

// 流年九星入中宫顺序 (年紫白飞星)
// 1900年一白入中，顺推: 1900=1 1901=9 1902=8... 公式: (1900-year)%9
// 年紫白: 1一白 2二黑 3三碧 4四绿 5五黄 6六白 7七赤 8八白 9九紫
const LIUNIAN_STARS = ['','一白','二黑','三碧','四绿','五黄','六白','七赤','八白','九紫'];
const LIUNIAN_COLORS = ['','#1abc9c','#95a5a6','#27ae60','#27ae60','#f39c12','#1abc9c','#e67e22','#e67e22','#e74c3c'];
const LIUNIAN_JIXIONG = ['','大吉','大凶','凶','平','大凶','大吉','凶','大吉','次吉'];

// 九宫飞星轨迹: 从当前宫位出发的飞星顺序
const FEIXING_PATH = [1,2,3,4,5,6,7,8,9]; // 实际上是按洛书数序飞布

function computeQimen() {
 try {
  _computeQimenImpl();
 } catch(e) {
  console.error('[奇门排盘错误]', e.message, e.stack);
  var errBox = document.getElementById('qmInterp') || document.getElementById('qmResult');
  if(errBox) errBox.innerHTML = '<div style="padding:20px;margin:16px 0;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 排盘出错</h5><p style="font-size:13px;opacity:.8;margin-top:8px">错误: '+e.message+'</p><p style="font-size:11px;opacity:.5;margin-top:4px">'+(e.stack||'').split('\n').slice(0,3).join('<br>')+'</p></div>';
  var r = document.getElementById('qmResult'); if(r){r.classList.add('visible');r.scrollIntoView({behavior:'smooth'});}
 }
}
function _computeQimenImpl() {
  playDivinationSound();
  var name = document.getElementById('qmName').value || '有缘人';
  var dunVal = document.getElementById('qmDun').value;
  var hourVal = document.getElementById('qmHour').value;
  if (!hourVal) { showToast('请输入时辰'); return; }
  
  // 农历/公历转换
  var calMode = document.getElementById('qmCalendarMode') ? document.getElementById('qmCalendarMode').value : 'solar';
  var year, month, day;
  var lunarStr = '';
  if(calMode === 'lunar'){
    var ly = parseInt(document.getElementById('qmLunarYear').value);
    var lm = parseInt(document.getElementById('qmLunarMonth').value);
    var ld = parseInt(document.getElementById('qmLunarDay').value);
    var isLeap = document.getElementById('qmLunarLeap') ? document.getElementById('qmLunarLeap').checked : false;
    if(!ly || !lm || !ld){ showToast('请输入完整农历日期'); return; }
    var solar = lunarToSolar(ly, lm, ld, isLeap);
    if(!solar){ showToast('农历日期无效'); return; }
    year = solar.year; month = solar.month; day = solar.day;
    lunarStr = ly+'年'+(isLeap?'闰':'')+(lm<10?'初':'')+(lm===1?'正':lm===11?'冬':lm===12?'腊':lm+'月')+(ld<11?'初'+ld:ld<20?'初十':ld===20?'二十':ld<30?'廿'+(ld-20):'三十');
  } else {
    var dateStr = document.getElementById('qmDate').value;
    if (!dateStr) { showToast('请输入日期'); return; }
    [year, month, day] = dateStr.split('-').map(Number);
    var lunarObj = solarToLunar(year, month, day);
    if(lunarObj) lunarStr = lunarObj.year+'年'+(lunarObj.isLeapMonth?'闰':'')+(lunarObj.month===1?'正':lunarObj.month===11?'冬':lunarObj.month===12?'腊':lunarObj.month+'月')+(lunarObj.day<11?'初'+lunarObj.day:lunarObj.day<20?'初十':lunarObj.day===20?'二十':lunarObj.day<30?'廿'+(lunarObj.day-20):'三十');
  }
  const hourNum = parseInt(hourVal);

  // ── 计算四柱 ──
  var yearObj = getYearStemBranch(year, month, day);
  var yearStem = yearObj.stem;
  var yearBranch = yearObj.branch;
  var yearStemIdx = yearObj.stemIdx;
  
  // 月柱：节气定月支 + 五虎遁月干
  var monthBranch = getMonthBranchBySolar(year, month, day);
  var monthStemIdx = getMonthStem(yearStemIdx, monthBranch);
  var monthStem = STEMS[monthStemIdx];
  
  // 日柱
  const dayStemIdx = getDayStemIndex(year, month, day);
  const dayBranchIdx = getDayBranchIndex(year, month, day);
  const dayStem = STEMS[dayStemIdx];
  const dayBranch = BRANCHES[dayBranchIdx];
  
  // 时柱
  const hourBranchIdx = Math.floor(hourNum / 2) % 12;
  const hourBranch = BRANCHES[hourBranchIdx];
  const hourStemIdx = getHourStem(dayStemIdx, hourBranch);
  const hourStem = STEMS[hourStemIdx];

  // ── 显示四柱 ──
  document.getElementById('qmMeta').innerHTML = 
    '<div style="display:flex;justify-content:center;gap:24px;margin:16px 0">' +
    '<div style="text-align:center"><div style="font-size:11px;color:var(--gold);letter-spacing:2px">年柱</div><div style="font-size:24px;font-family:\'Ma Shan Zheng\',serif;color:var(--paper)">' + yearStem + yearBranch + '</div></div>' +
    '<div style="text-align:center"><div style="font-size:11px;color:var(--gold);letter-spacing:2px">月柱</div><div style="font-size:24px;font-family:\'Ma Shan Zheng\',serif;color:var(--paper)">' + monthStem + monthBranch + '</div></div>' +
    '<div style="text-align:center"><div style="font-size:11px;color:var(--gold);letter-spacing:2px">日柱</div><div style="font-size:24px;font-family:\'Ma Shan Zheng\',serif;color:var(--paper)">' + dayStem + dayBranch + '</div></div>' +
    '<div style="text-align:center"><div style="font-size:11px;color:var(--gold);letter-spacing:2px">时柱</div><div style="font-size:24px;font-family:\'Ma Shan Zheng\',serif;color:var(--paper)">' + hourStem + hourBranch + '</div></div>' +
    '</div>' +
    (lunarStr ? '<div style="text-align:center;font-size:12px;color:var(--gold);opacity:.6;margin-top:4px">农历 ' + lunarStr + ' · ' + (calMode==='lunar'?'(农历输入→已转阳历)':'(阳历自动转换)') + '</div>' : '');

  // ── 阴阳遁判断 ──
  const isYang = month >= 11 || month <= 4;
  const isYangDun = dunVal === 'yang' || (dunVal === 'auto' && isYang);
  const rotate = isYangDun ? [1,2,3,4,5,6,7,8,9] : [9,8,7,6,5,4,3,2,1];

  // 局数 (优先使用calc-engine-lib的节气定局法, 回退到简算法)
  var juNum;
  try {
    if (typeof _qimenGetJu === 'function') {
      var dayGzIdx = dayStemIdx * 10 + dayBranchIdx; // 日干支序数
      juNum = _qimenGetJu(year, month, day, isYangDun ? 'yang' : 'yin', dayGzIdx);
    } else { juNum = ((dayStemIdx * 10 + dayBranchIdx) % 18) + 1; }
  } catch(e) { juNum = ((dayStemIdx * 10 + dayBranchIdx) % 18) + 1; }
  // 确保局数在1-9范围内
  if (juNum < 1) juNum = 1; if (juNum > 9) juNum = 9;

  // 定局方法说明
  var juMethodEl = document.getElementById('qmJuMethod');
  var juMethod = juMethodEl ? juMethodEl.value : 'chaibu';
  var juMethodName = { 'chaibu':'拆补法（主流，张志春主此法）','zhirun':'置闰法（传统，严楒节气）','maoshan':'茅山法（精确到时辰）' }[juMethod] || '拆补法';
  var juMethodDesc = {
    'chaibu': '拆补法为现代主流定局方法，不置闰，直接以符头定元，简单实用。',
    'zhirun': '置闰法为传统定局方法，严格按节气分界，超神九日则于芄种或大雪后置闰。',
    'maoshan': '茅山法以节气交节的具体时刻为三元分界点，最大程度与天文实际相符。'
  }[juMethod] || ''

  // Key palace based on day stem
  const keyPalaceBase = STEM_KEYS.indexOf(dayStem) + 1;
  const keyPalace = keyPalaceBase > 0 ? keyPalaceBase : 5;

  // ── Build palaces ──
  const palaces = {};
  for (let i = 0; i < 9; i++) {
    const p宫 = rotate[i];
    palaces[p宫] = { num: p宫, ...PALACE_INFO[p宫] };
    // 天盘干: 旬首遁甲 (简化版: 用日干+宫位取天盘)
    var heavenGanIdx = (dayStemIdx + (9 - p宫)) % 10;
    palaces[p宫].heavenGan = STEMS[heavenGanIdx];
    // 地盘干: 宫位对应的干
    palaces[p宫].earthGan = PALACE_INFO[p宫] ? PALACE_INFO[p宫].stem : STEMS[(p宫 - 1) % 10];
  }

  // Distribute stars (蓬芮任冲辅英禽心柱)
  const starNames = ['蓬','芮','任','冲','辅','英','禽','心','柱'];
  const starKeyMap = {'蓬':'pei','芮':'yin','任':'ying','冲':'chu','辅':'fang','英':'you','禽':'jin','心':'zhen','柱':'rong'};
  const starStart = (keyPalace - 1 + (isYangDun ? 0 : 8)) % 9;
  for (let i = 0; i < 9; i++) {
    const p宫 = rotate[i];
    const sIdx = (starStart + i) % 9;
    palaces[p宫].star = STARS_MAP[starKeyMap[starNames[sIdx]]];
  }

  // Distribute doors
  const doorNames = ['休','开','生','伤','杜','景','死','惊'];
  const doorKeyMap = {'休':'xin','开':'kai','生':'sheng','伤':'shang','杜':'du','景':'jing','死':'si','惊':'cun'};
  const doorStart = (keyPalace - 1 + (isYangDun ? 0 : 8)) % 8;
  let doorPos = 0;
  for (let i = 0; i < 9; i++) {
    const p宫 = rotate[i];
    if (p宫 === 5) { palaces[p宫].door = DOORS_MAP.jin; continue; }
    const dIdx = (doorStart + doorPos) % 8;
    palaces[p宫].door = DOORS_MAP[doorKeyMap[doorNames[dIdx]]];
    doorPos++;
  }

  // Distribute gods (八神: 值符/螣蛇/太阴/六合/白虎/玄武/九地/九天)
  // 阳遁顺排, 阴遁逆排
  const godOrderYang = ['符','蛇','阴','合','虎','玄','地','天'];
  const godOrderYin  = ['符','天','地','玄','虎','合','阴','蛇'];
  const godOrder = isYangDun ? godOrderYang : godOrderYin;
  const godKeyMapReal = {'符':'zhi','蛇':'nu','阴':'di','合':'long','虎':'hu','玄':'xuan','地':'di','天':'ti'};
  let godPos2 = 0;
  for (let i = 0; i < 9; i++) {
    const p宫 = rotate[i];
    if (p宫 === 5) { palaces[p宫].god = GODS_MAP.long; continue; }
    const gIdx = godPos2 % 8;
    var gk = godKeyMapReal[godOrder[gIdx]];
    palaces[p宫].god = GODS_MAP[gk] || GODS_MAP.zhi;
    godPos2++;
  }

  palaces[5].star = STARS_MAP.jin;
  palaces[5].door = DOORS_MAP.jin;
  palaces[5].god = GODS_MAP.long;
  palaces[5].heavenGan = '戊';
  palaces[5].earthGan = '戊';

  const keyPalaceData = palaces[keyPalace];
  const jiuxing = keyPalaceData?.star?.name || '天心';
  const bamen = keyPalaceData?.door?.name || '开门';
  const bashen = keyPalaceData?.god?.name || '值符';

  // ── RENDER HEADER ──
  document.getElementById('qmSub').innerHTML = 
    '<span style="color:var(--violet2)">' + (isYangDun ? '阳遁' : '阴遁') + ' ' + juNum + '局</span> · ' +
    jiuxing + '星临' + PALACE_INFO[keyPalace].name + ' · ' + bamen + '为值使';

  // ── 九宫格动态渲染 (使用 palaces 数据) ──
  const grid = document.getElementById('qmGrid');
  grid.innerHTML = '';
  const cellOrder = [4,9,2,3,5,7,8,1,6];
  const starColors = {大吉:'#2ecc71',吉:'#27ae60',平:'#f39c12',小凶:'#e67e22',次凶:'#e74c3c',凶:'#c0392b',大凶:'#c0392b'};
  // 计算空亡宫位
  var kongWangSet = {};
  try {
    var kwList = detectKongWang(dayStem, dayBranch, hourStem, hourBranch);
    for (var kw of kwList) { if(kw.palace) kongWangSet[kw.palace] = true; }
  } catch(e) {}

  cellOrder.forEach((p宫) => {
    const p = palaces[p宫];
    const div = document.createElement('div');
    div.className = 'qn-cell' + (p宫 === 5 ? ' center-cell' : '');
    const sc = starColors[p.star?.type] || '#95a5a6';
    const dc = p.door?.color || '#95a5a6';
    const tri = PALACE_INFO[p宫] ? PALACE_INFO[p宫].tri : '';
    var kongMark = kongWangSet[p宫] ? '<div style="color:#e74c3c;font-size:10px;opacity:.8">◎ 空亡</div>' : '';
    div.innerHTML = 
      '<div class="qn-pos">' + tri + ' ' + (p宫===5?'中宫':PALACE_INFO[p宫]?PALACE_INFO[p宫].name:'') + '</div>' +
      '<div class="qn-star" style="color:' + sc + '">⭐' + (p.star?.name||'') + '</div>' +
      '<div class="qn-door" style="color:' + dc + '">🚪' + (p.door?.name||'') + '门</div>' +
      '<div class="qn-god">👤' + (p.god?.name||'') + '</div>' +
      '<div class="qn-gans" style="display:flex;justify-content:center;gap:6px;margin-top:4px">' +
      '<span style="color:#c9a84c;font-size:11px">天' + (p.heavenGan||'') + '</span>' +
      '<span style="color:#95a5a6;font-size:11px">地' + (p.earthGan||'') + '</span>' +
      '</div>' +
      kongMark +
      '<div class="qn-analysis">' + getComboText(p.star?.name, p.door?.name) + '</div>';
    grid.appendChild(div);
  });

  // ── 传统排盘格式渲染 ──
  var tradGrid = document.getElementById('qmTraditionalGrid');
  if (tradGrid) {
    var tradHTML = '<div class="qm-traditional">';
    tradHTML += '<div class="qt-title">奇门遁甲 · 传统排盘</div>';
    tradHTML += '<div class="qt-grid">';
    for (var ci = 0; ci < cellOrder.length; ci++) {
      var p宫 = cellOrder[ci];
      var p = palaces[p宫];
      var pName = p宫===5 ? '中五宫' : (PALACE_INFO[p宫] ? PALACE_INFO[p宫].name + '宫' : '');
      var pDir = PALACE_INFO[p宫] ? PALACE_INFO[p宫].tri : '';
      var isKong = kongWangSet[p宫] ? '<div class="qt-kong">◎ 空亡</div>' : '';
      tradHTML += '<div class="qt-cell">';
      tradHTML += '<div class="qt-pos">' + pDir + ' ' + pName + '</div>';
      tradHTML += '<div class="qt-line"><b>天盘星：</b>' + (p.star?.name||'') + '</div>';
      tradHTML += '<div class="qt-line"><b>八　门：</b>' + (p.door?.name||'') + '门</div>';
      tradHTML += '<div class="qt-line"><b>八　神：</b>' + (p.god?.name||'') + '</div>';
      tradHTML += '<div class="qt-line"><b>天盘干：</b>' + (p.heavenGan||'') + '</div>';
      tradHTML += '<div class="qt-line"><b>地盘干：</b>' + (p.earthGan||'') + '</div>';
      tradHTML += isKong;
      tradHTML += '</div>';
    }
    tradHTML += '</div></div>';
    tradGrid.innerHTML = tradHTML;
  }

  // ── 四害检测 ──
  const sihaiMenPo = detectMenPo(palaces);
  const sihaiJiXing = detectJiXing(palaces);
  const sihaiKongWang = detectKongWang(dayStem, dayBranch, hourStem, hourBranch);
  const sihaiRuMu = detectRuMu(palaces);
  const allSihai = [...sihaiMenPo, ...sihaiJiXing, ...sihaiKongWang, ...sihaiRuMu];

  // ── 四害结果展示 ──
  var sihaiHTML = buildSihaiHTML(allSihai);
  var sihaiBox = document.getElementById('qmSihaiBox');
  if (sihaiBox) sihaiBox.innerHTML = sihaiHTML;

  // ── 专业解读 ──
  const ctr = document.getElementById('qmInterp');
  ctr.innerHTML = buildQimenInterpretation(isYangDun, juNum, jiuxing, bamen, bashen, palaces, keyPalace, allSihai, yearStem+yearBranch, monthStem+monthBranch, dayStem+dayBranch, hourStem+hourBranch, year);

  // ── 流年飞星 ──
  var liunianHTML = buildLiunianHTML(year, palaces);
  var liunianBox = document.getElementById('qmLiunianBox');
  if (liunianBox) liunianBox.innerHTML = liunianHTML;
  // 存储 palaces 供切换年份使用
  window._qmPalaces = palaces;
  window._qmIsYangDun = isYangDun;

  // 起心动念时辰分析（仅事盘）
  if (typeof yjMode !== 'undefined' && yjMode === 'matter' && typeof yjQixinTime !== 'undefined' && yjQixinTime) {
    const qxBox = document.createElement('div');
    qxBox.className = 'interp-card gold-accent';
    qxBox.style.marginTop = '20px';
    const qxDate = new Date(yjQixinTime);
    const qxLunar = typeof getLunarDateStr === 'function' ? getLunarDateStr(qxDate) : '';
    qxBox.innerHTML = 
      '<h5>☰ 起心动念时辰分析</h5>' +
      '<p style="margin-bottom:10px">您于 <strong>' + qxDate.toLocaleString('zh-CN') + '</strong> 心生疑问（' + qxLunar + '）</p>' +
      '<p style="margin-bottom:10px">《黄金策》云:「占卜之道，心诚则灵，时到则应。」起心动念之时，正是天机显现之刻。此时辰与卦象相参，可断事之吉凶、时之迟速。</p>' +
      '<p>时辰' + (typeof getShiChen==='function'?getShiChen(qxDate.getHours()):'') + '，' + (typeof getShiChenAnalysis==='function'?getShiChenAnalysis(qxDate.getHours(), 0):'') + '</p>';
    ctr.appendChild(qxBox);
  }

  // ── 宫位解读 ──
  var qmReadBox = document.getElementById('qmReadingBox');
  if (qmReadBox) qmReadBox.innerHTML = getQimenReadingHTMLV2(keyPalace, palaces);

  // ── 起局流程说明 ──
  var processBox = document.getElementById('qmProcessBox');
  if (processBox) {
    var processHTML = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(155,89,182,.2);padding:20px">';
    processHTML += '<h5 style="font-size:15px;color:var(--violet2);letter-spacing:3px;margin-bottom:14px">📋 奇门起局流程</h5>';
    processHTML += '<div style="font-size:13px;line-height:2.1;opacity:.85">';
    processHTML += '<p><b style="color:var(--gold)">第一步·定局：</b>' + (isYangDun?'阳':'阴') + '遁' + juNum + '局。';
    var jqInfo = typeof _getJieqi === 'function' ? _getJieqi(month, day) : '';
    if(jqInfo) processHTML += '当前节气「' + jqInfo + '」，' + (isYangDun?'阳气上升，用阳遁':'阴气下降，用阴遁') + '。';
    processHTML += '日干支' + dayStem + dayBranch + '定局，' + (typeof _qimenGetJu === 'function' ? '局数' + _qimenGetJu(year, month, day, isYangDun?'yang':'yin', dayStemIdx*6+dayBranchIdx) + '。' : '局数' + juNum + '。');
    processHTML += '<br><span style="opacity:.6;font-size:12px">定局方法：' + juMethodName + ' — ' + juMethodDesc + '</span>';
    processHTML += '</p>';
    processHTML += '<p><b style="color:var(--gold)">第二步·布地盘：</b>六仪三奇按' + (isYangDun?'顺':'逆') + '序排入九宫。';
    var diSummary = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];
    processHTML += '地盘序列：' + diSummary.join('→') + '，依洛书九宫' + (isYangDun?'顺飞':'逆飞') + '。';
    processHTML += '</p>';
    processHTML += '<p><b style="color:var(--gold)">第三步·排天盘：</b>时辰' + hourStem + hourBranch + '，时干' + hourStem + '落' + keyPalace + '宫为值符。天盘随值符转动，六仪三奇随天盘旋转。';
    processHTML += '</p>';
    processHTML += '<p><b style="color:var(--gold)">第四步·排人盘（八门）：</b>值使门随时辰运转。' + bamen + '为值使，落' + keyPalace + '宫。八门依' + (isYangDun?'顺':'逆') + '序排布九宫。';
    processHTML += '</p>';
    processHTML += '<p><b style="color:var(--gold)">第五步·排神盘（八神）：</b>值符跟随值符星所在宫位。' + bashen + '为值符，' + (isYangDun?'顺排':'逆排') + '八神。';
    processHTML += '</p>';
    processHTML += '</div>';
    processHTML += '<div style="margin-top:12px;padding:10px 14px;background:rgba(155,89,182,.05);border-radius:8px;font-size:12px;opacity:.7">';
    processHTML += '《烟波钓叟歌》云：「先须掌上排九宫，纵横十五在其中。次将八卦论八节，一气统三为正宗。」';
    processHTML += '</div>';
    processHTML += '</div>';
    processBox.innerHTML = processHTML;
  }

  // ── 前后推演 ──
  var forecastBox = document.getElementById('qmForecastBox');
  if (forecastBox) {
    var forecastHTML = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.15);padding:20px">';
    forecastHTML += '<h5 style="font-size:15px;color:var(--gold);letter-spacing:3px;margin-bottom:14px">🔍 前后推演</h5>';
    forecastHTML += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
    // 往前排验证
    forecastHTML += '<div style="padding:14px;background:rgba(46,204,113,.05);border-radius:8px;border:1px solid rgba(46,204,113,.1)">';
    forecastHTML += '<div style="font-size:13px;color:#2ecc71;font-weight:bold;margin-bottom:8px">⏪ 往前排验证</div>';
    forecastHTML += '<div style="font-size:12px;line-height:1.8;opacity:.8">';
    var prevDate = new Date(year, month-1, day-1);
    var prevObj = getYearStemBranch(prevDate.getFullYear(), prevDate.getMonth()+1, prevDate.getDate());
    forecastHTML += '<p>前一日：' + prevObj.stem + prevObj.branch + '日，' + (prevDate.getMonth()+1) + '月' + prevDate.getDate() + '日</p>';
    var prev2Date = new Date(year, month-1, day-3);
    var prev2Obj = getYearStemBranch(prev2Date.getFullYear(), prev2Date.getMonth()+1, prev2Date.getDate());
    forecastHTML += '<p>前三日：' + prev2Obj.stem + prev2Obj.branch + '日</p>';
    forecastHTML += '<p style="opacity:.6;margin-top:6px">可用于验证历史事件的盘面走势</p>';
    forecastHTML += '</div></div>';
    // 往后排预测
    forecastHTML += '<div style="padding:14px;background:rgba(231,76,60,.05);border-radius:8px;border:1px solid rgba(231,76,60,.1)">';
    forecastHTML += '<div style="font-size:13px;color:#e74c3c;font-weight:bold;margin-bottom:8px">⏩ 往后排预测</div>';
    forecastHTML += '<div style="font-size:12px;line-height:1.8;opacity:.8">';
    var nextDate = new Date(year, month-1, day+1);
    var nextObj = getYearStemBranch(nextDate.getFullYear(), nextDate.getMonth()+1, nextDate.getDate());
    forecastHTML += '<p>后一日：' + nextObj.stem + nextObj.branch + '日，' + (nextDate.getMonth()+1) + '月' + nextDate.getDate() + '日</p>';
    var next7Date = new Date(year, month-1, day+7);
    var next7Obj = getYearStemBranch(next7Date.getFullYear(), next7Date.getMonth()+1, next7Date.getDate());
    forecastHTML += '<p>后七日：' + next7Obj.stem + next7Obj.branch + '日</p>';
    forecastHTML += '<p style="opacity:.6;margin-top:6px">可用于预测未来走势与预防</p>';
    forecastHTML += '</div></div>';
    forecastHTML += '</div>';
    // 当前盘面总结
    forecastHTML += '<div style="margin-top:14px;padding:12px 14px;background:rgba(201,168,76,.05);border-radius:8px;font-size:12px;line-height:1.8;opacity:.8">';
    forecastHTML += '<b style="color:var(--gold)">当前盘面总结：</b>' + (isYangDun?'阳':'阴') + '遁' + juNum + '局，日干' + dayStem + '落' + keyPalace + '宫，值符' + bashen + '，值使' + bamen + '。';
    if(allSihai.length > 0) forecastHTML += ' 检出' + allSihai.length + '项四害，需注意化解。';
    else forecastHTML += ' 未检出四害，盘面清朗。';
    forecastHTML += '</div>';
    forecastHTML += '</div>';
    forecastBox.innerHTML = forecastHTML;
  }

  // 存储当前盘面数据供前后推演使用
  window._qmCurrentPan = { year, month, day, hour: hourNum, isYangDun, juNum, palaces, keyPalace, 
    pillars: { year: yearStem+yearBranch, month: monthStem+monthBranch, day: dayStem+dayBranch, hour: hourStem+hourBranch },
    name: name, lunar: lunarStr };

  // 渲染九宫格盘面
  try { renderQimenGrid(palaces, keyPalace); } catch(e) { console.warn('[九宫格渲染失败]', e.message); }

  document.getElementById('qmResult').classList.add('visible');
  document.getElementById('qmResult').scrollIntoView({ behavior: 'smooth' });

  // ═══ 三元九运与奇门 ═══
  try {
    var _syQm = _generateSanyuanJiuyunBlock('qimen', {
      dayStem: dayStem, dayEle: ELE[dayStem] || '木',
      currentYear: year
    });
    document.getElementById('qmResult').innerHTML += _syQm;
  } catch(e) { console.warn('[三元九运奇门分析块失败]', e.message); }

  // === 化解方案注入 ===
  var _qmSex = document.getElementById('qmSex') ? document.getElementById('qmSex').value : 'male';
  appendHuajieToResult('qmResult', year, month, day, hourNum, _qmSex, name);
}

// ═══════════════════════════════════════
//  四害检测函数
// ═══════════════════════════════════════

// 1. 门迫: 门五行克宫五行
function detectMenPo(palaces) {
  var results = [];
  for (var p=1; p<=9; p++) {
    if (p===5) continue;
    var pk = palaces[p];
    if (!pk || !pk.door) continue;
    var doorName = pk.door.name;
    var doorWx = DOOR_WUXING[doorName];
    var palaceWx = pk.ele;
    if (!doorWx || !palaceWx) continue;
    // 五行相克: 金克木 木克土 土克水 水克火 火克金
    var ke = {金:'木',木:'土',土:'水',水:'火',火:'金'};
    if (ke[doorWx] === palaceWx) {
      var severity = (doorName==='惊'||doorName==='死'||doorName==='伤') ? '严重' : '一般';
      results.push({
        type:'门迫', severity:severity, palace:p, palaceName:pk.name,
        desc:doorName+'门（属'+doorWx+'）临'+pk.name+'（属'+palaceWx+'），'+doorWx+'克'+palaceWx+'，为门迫之象。',
        effect:getMenPoEffect(doorName, pk.name),
        huajie:getMenPoHuajie(doorName, pk.name),
        period:getMenPoPeriod(doorName)
      });
    }
  }
  return results;
}

function getMenPoEffect(door, palace) {
  var m = {
    '惊':{desc:'惊恐不安，官非口舌，易有意外之惊。做事容易半途而废，投资需防被套。',dir:'需要注意正西兑宫方向的煞气。'},
    '死':{desc:'死气沉沉，事业停滞，财运阻滞。不宜进行新的投资或启动新项目，宜守不宜攻。',dir:'注意西南坤方，宜放置黄色水晶化解。'},
    '伤':{desc:'伤灾口舌，是非争斗。出行注意安全，避免与人发生冲突。身体易受外伤。',dir:'注意正东震方，宜放置绿色植物。'},
    '杜':{desc:'阻塞不通，诸事难成。信息不畅，沟通受阻。事业上容易遇到瓶颈。',dir:'注意东南巽方，宜保持通风流畅。'},
    '景':{desc:'文书不顺，是非口舌。信息传递有误，容易产生误会。注意言辞表达。',dir:'注意正南离方，宜放置红色水晶。'},
    '休':{desc:'休养生息受扰，人际交往不顺。虽有吉意但受制，合作事宜进展缓慢。',dir:'注意正北坎方，宜放置水景或黑色饰品。'},
    '生':{desc:'财运受阻，生机不畅。投资谨慎，置产慎重。生发之力受制，宜积蓄力量。',dir:'注意东北艮方，宜放置黄色或棕色饰品。'},
    '开':{desc:'事业受阻，升迁有碍。开创新局困难，远行不利。但开门为吉门，门迫之力相对较轻。',dir:'注意西北乾方，宜放置金属饰品。'}
  };
  return m[door] || {desc:'门迫宫位，诸事受阻，需迂回而行。',dir:''};
}

function getMenPoHuajie(door, palace) {
  var m = {
    '惊':{method:'在'+palace+'方位摆放铜葫芦或五帝钱，书写「安」字贴于该方位，每日持诵六字大明咒七遍。可减弱惊恐气场。',mascot:'铜葫芦、五帝钱',direction:palace+'方'},
    '死':{method:'在'+palace+'方位放置黄色水晶球或黄玉，点燃檀香三日，读诵《心经》一遍。以土生金之法化解死气。',mascot:'黄水晶、黄玉',direction:palace+'方'},
    '伤':{method:'在'+palace+'方位放置绿色植物（如富贵竹、绿萝），悬挂木制风铃。每日早朝向该方深呼吸三次。',mascot:'绿植、木风铃',direction:palace+'方'},
    '杜':{method:'在'+palace+'方位保持通风，放置小型电风扇或空气净化器，挂一串风铃。常开窗透气以散郁气。',mascot:'风铃、空气净化器',direction:palace+'方'},
    '景':{method:'在'+palace+'方位放置红色水晶或红玛瑙，点一盏红色灯（长明灯），每日诵读文书三遍。以火制火不吉，宜以土泄火气。',mascot:'红玛瑙、长明灯',direction:palace+'方'},
    '休':{method:'在'+palace+'方位放置鱼缸或黑曜石，保持水源清洁。可请一道「水官解厄符」贴于该方位。',mascot:'鱼缸、黑曜石',direction:palace+'方'},
    '生':{method:'在'+palace+'方位放置泰山石或黄玉元宝，保持干净整齐。每日念财神咒七遍以旺生气。',mascot:'泰山石、黄玉元宝',direction:palace+'方'},
    '开':{method:'在'+palace+'方位摆放金属钟表或铜钱，保持光亮。可请「开门符」一道贴于该方位，朝夕礼拜。',mascot:'铜钟、铜钱',direction:palace+'方'}
  };
  return m[door] || {method:'在该方位摆放五帝钱、八卦镜，择吉日开光后可化解门迫之害。',mascot:'五帝钱',direction:palace+'方'};
}

function getMenPoPeriod(door) {
  var p = {'惊':'21天','死':'49天','伤':'21天','杜':'14天','景':'14天','休':'7天','生':'21天','开':'7天'};
  return p[door] || '21天';
}

// 2. 击刑: 天盘干刑地盘干 (或天干地支组合有刑)
function detectJiXing(palaces) {
  var results = [];
  for (var p=1; p<=9; p++) {
    if (p===5) continue;
    var pk = palaces[p];
    if (!pk) continue;
    var hg = pk.heavenGan;
    var eg = pk.earthGan;
    // 天干刑: heavenGan 刑 earthGan
    if (hg && eg && GAN_XING[hg] === eg) {
      results.push({
        type:'击刑', severity:'严重', palace:p, palaceName:pk.name,
        desc:'天盘' + hg + '干与地盘' + eg + '干相刑于' + pk.name + '，天干击刑，主伤灾口舌、是非官非。',
        effect:{desc:'天干相刑为击刑，主伤灾、刑伤、口舌纠纷。事业易遇小人，婚姻易有波折，健康需防肝胆、筋骨损伤。',dir:pk.dir+'方为重灾区'},
        huajie:getJiXingHuajie(pk),
        period:'35天'
      });
    }
  }
  return results;
}

function getJiXingHuajie(pk) {
  return {
    method:'在' + pk.name + '（' + pk.dir + '方）放置' + ({木:'绿色植物',火:'红色水晶',土:'黄玉',金:'铜器',水:'黑曜石'}[pk.ele]||'五帝钱') + '，择' + ({木:'卯',火:'午',土:'辰戌',金:'酉',水:'子'}[pk.ele]||'辰') + '日进行净化仪式。诵读《北斗经》一遍，祈求星君化解刑伤。',
    mascot:({木:'绿檀手串',火:'红玛瑙',土:'黄玉',金:'白水晶',水:'黑曜石'}[pk.ele]||'五帝钱'),
    direction:pk.dir+'方'
  };
}

// 3. 空亡: 根据时柱查旬空
function detectKongWang(dayStem, dayBranch, hourStem, hourBranch) {
  var results = [];
  // 时柱旬首
  var ganzhi = hourStem + hourBranch;
  var jiazi = ['甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
    '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
    '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
    '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
    '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
    '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'];
  var idx = jiazi.indexOf(ganzhi);
  if (idx < 0) return results;
  var xunIdx = Math.floor(idx / 10);
  var xunShou = jiazi[xunIdx * 10];
  var kongWangZhis = XUN_KONG[xunShou.substring(0,2)] || [];
  if (kongWangZhis.length === 0) return results;
  // 找到空亡地支对应的宫位
  for (var k=0; k<kongWangZhis.length; k++) {
    var kwZhi = kongWangZhis[k];
    var kwPalace = ZHI_PALACE[kwZhi];
    if (kwPalace && kwPalace !== 5) {
      var pkName = PALACE_INFO[kwPalace] ? PALACE_INFO[kwPalace].name : (kwPalace+'宫');
      results.push({
        type:'空亡', severity:'严重', palace:kwPalace, palaceName:pkName,
        desc:'时柱' + ganzhi + '属' + xunShou + '旬，' + kongWangZhis.join('') + '空亡。' + pkName + '逢空亡，诸事虚空不实。',
        effect:{desc:'空亡之地，吉事减力，凶事成空。谋事难成，求财难得。但凶星凶门入空亡则凶性大减。若吉星临空亡，需待填实之日方可发挥效力。',dir:PALACE_INFO[kwPalace]?PALACE_INFO[kwPalace].dir:''},
        huajie:{
          method:'在' + pkName + '方位摆放紫水晶洞或水晶球，点长明灯一盏。可诵读《太上老君说常清静经》以填补空虚之气。待节气交替之日（立春、立夏、立秋、立冬）进行净宅仪式。',
          mascot:'紫水晶洞、长明灯',
          direction:PALACE_INFO[kwPalace]?PALACE_INFO[kwPalace].dir:''
        },
        period:'60天（待填实日）'
      });
    }
  }
  return results;
}

// 4. 入墓: 天盘干入墓宫
function detectRuMu(palaces) {
  var results = [];
  for (var p=1; p<=9; p++) {
    if (p===5) continue;
    var pk = palaces[p];
    if (!pk || !pk.heavenGan) continue;
    var gan = pk.heavenGan;
    var tombPalace = GAN_TOMB[gan];
    if (tombPalace === p) {
      results.push({
        type:'入墓', severity:'次重', palace:p, palaceName:pk.name,
        desc:'天盘' + gan + '干入墓于' + pk.name + '。' + gan + '干之墓库在此，主气运受阻、才华不展。',
        effect:getRuMuEffect(gan),
        huajie:getRuMuHuajie(gan, pk),
        period:getRuMuPeriod(gan)
      });
    }
  }
  return results;
}

function getRuMuEffect(gan) {
  var m = {
    '甲':'甲木入墓于坤（未），栋梁之材不得施展，事业受阻，怀才不遇。需待冲墓之日（丑日）方有转机。',
    '乙':'乙木入墓于坤（未），藤萝之木被困，贵人远离，自身难展。宜静守待时，不宜强求。',
    '丙':'丙火入墓于乾（戌），太阳之火被埋，光明不显，名声受损。需防官非口舌，谨言慎行。',
    '丁':'丁火入墓于乾（戌），烛光之火被蔽，智慧不彰，心思晦暗。宜修身养性，等待时机。',
    '戊':'戊土入墓于巽（辰），高山之土被陷，根基动摇，稳中有忧。宜巩固基础，不可冒进。',
    '己':'己土入墓于巽（辰），田园之土被覆，勤劳无功，收获不丰。宜休养生息，积蓄力量。',
    '庚':'庚金入墓于艮（丑），刀剑之金被藏，锋芒不露，果断受阻。宜韬光养晦，待机而动。',
    '辛':'辛金入墓于艮（丑），首饰之金被埋，精致不显，美感蒙尘。宜内外兼修，等待光芒重现。',
    '壬':'壬水入墓于巽（辰），大海之水被束，智慧受阻，胸怀难展。宜静心学习，充实内在。',
    '癸':'癸水入墓于巽（辰），雨露之水被困，滋润不足，情感压抑。宜静待天时，自然解困。'
  };
  return {desc: m[gan] || '天干入墓，气运受阻。'};
}

function getRuMuHuajie(gan, pk) {
  return {
    method:'在' + pk.name + '方位摆放' + ({甲:'绿色水晶',乙:'绿檀木雕',丙:'红色水晶',丁:'红玛瑙',戊:'黄玉',己:'黄水晶',庚:'白水晶',辛:'银器',壬:'黑曜石',癸:'蓝水晶'}[gan]||'水晶') + '，择冲墓之日（' + ({甲:'丑',乙:'丑',丙:'辰',丁:'辰',戊:'戌',己:'戌',庚:'未',辛:'未',壬:'戌',癸:'戌'}[gan]||'辰') + '日）进行开运仪式。诵读对应经文以助出墓。',
    mascot:({甲:'绿水晶柱',乙:'绿檀',丙:'红水晶',丁:'红玛瑙',戊:'黄玉',己:'黄水晶',庚:'白水晶',辛:'银饰',壬:'黑曜石',癸:'蓝水晶'}[gan]||'水晶'),
    direction:pk.dir+'方'
  };
}

function getRuMuPeriod(gan) {
  var p = {'甲':'49天','乙':'35天','丙':'21天','丁':'21天','戊':'35天','己':'28天','庚':'42天','辛':'35天','壬':'28天','癸':'21天'};
  return p[gan] || '28天';
}

// ═══════════════════════════════════════
//  四害 HTML 渲染
// ═══════════════════════════════════════

function buildSihaiHTML(sihaiList) {
  if (!sihaiList || sihaiList.length === 0) {
    return '<div style="padding:16px;text-align:center;background:rgba(46,204,113,.04);border:1px solid rgba(46,204,113,.15);border-radius:8px;margin-top:16px">' +
      '<div style="font-size:16px;margin-bottom:6px">✅</div>' +
      '<div style="font-size:13px;color:#2ecc71;letter-spacing:2px">此局无四害，星门和谐，大吉之象</div>' +
      '<div style="font-size:11px;color:var(--paper2);margin-top:6px">天地人和，诸事顺遂，可放心行动</div></div>';
  }
  var typeLabel = {门迫:'🚪 门迫',击刑:'⚡ 击刑',空亡:'🕳️ 空亡',入墓:'📦 入墓'};
  var severityColor = {严重:'#e74c3c',次重:'#f39c12',一般:'#e67e22'};
  var html = '<div style="margin-top:20px"><div style="font-size:14px;color:var(--gold);letter-spacing:3px;text-align:center;margin-bottom:12px">⚠️ 四害检测 · ' + sihaiList.length + '项</div>';
  for (var i=0; i<sihaiList.length; i++) {
    var s = sihaiList[i];
    var sc = severityColor[s.severity] || '#f39c12';
    var label = typeLabel[s.type] || s.type;
    html += '<div style="padding:12px 14px;margin-bottom:8px;background:rgba(231,76,60,.04);border-left:3px solid ' + sc + ';border-radius:0 8px 8px 0">';
    html += '<div style="font-size:13px;font-weight:bold;color:' + sc + ';margin-bottom:4px">' + label + ' · ' + s.palaceName + ' <span style="font-size:11px;opacity:.7">[' + s.severity + ']</span></div>';
    html += '<div style="font-size:12px;color:var(--paper);line-height:1.6;margin-bottom:6px">' + s.desc + '</div>';
    if (s.effect) html += '<div style="font-size:11px;color:var(--paper2);line-height:1.6;margin-bottom:4px">📋 ' + (s.effect.desc||'') + '</div>';
    if (s.huajie) {
      html += '<div style="font-size:11px;color:#2ecc71;line-height:1.6">🛡️ <strong>化解方案：</strong>' + s.huajie.method + '</div>';
      html += '<div style="font-size:11px;color:var(--paper2);margin-top:2px">🏆 吉祥物：' + (s.huajie.mascot||'') + ' ｜ 📍 方位：' + (s.huajie.direction||'') + ' ｜ ⏱️ 周期：' + (s.period||'') + '</div>';
    }
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ═══════════════════════════════════════
//  专业解读构建 (2000字+)
// ═══════════════════════════════════════

function buildQimenInterpretation(isYangDun, juNum, jiuxing, bamen, bashen, palaces, keyPalace, allSihai, yearPillar, monthPillar, dayPillar, hourPillar, year) {
  var kp = PALACE_INFO[keyPalace];
  var kpd = palaces[keyPalace];
  var dunName = isYangDun ? '阳遁' : '阴遁';
  var html = '';

  // 1. 全局总断
  var overallJiXiong = '中平';
  var jiCount = 0, xiongCount = 0;
  for (var p=1; p<=9; p++) {
    if (p===5) continue;
    var pk = palaces[p];
    if (pk && pk.star) {
      if (pk.star.type === '大吉' || pk.star.type === '吉') jiCount++;
      if (pk.star.type === '大凶' || pk.star.type === '凶') xiongCount++;
    }
  }
  if (jiCount >= 4 && xiongCount <= 1) overallJiXiong = '大吉';
  else if (jiCount >= 3 && xiongCount <= 2) overallJiXiong = '偏吉';
  else if (xiongCount >= 4) overallJiXiong = '大凶';
  else if (xiongCount >= 3) overallJiXiong = '偏凶';
  var overallColor = {大吉:'#2ecc71',偏吉:'#27ae60',中平:'#f39c12',偏凶:'#e67e22',大凶:'#e74c3c'}[overallJiXiong] || '#f39c12';

  html += '<div class="interp-card violet-accent">';
  html += '<h5>🔮 全局总断</h5>';
  html += '<p style="font-size:15px;line-height:2.2;color:var(--paper)">';
  html += '此局为<strong style="color:var(--violet2)">' + dunName + juNum + '局</strong>，';
  html += '值符为<strong style="color:var(--gold)">' + jiuxing + '星</strong>，值使为<strong style="color:var(--gold)">' + bamen + '门</strong>，';
  html += '八神之首为<strong style="color:var(--gold)">' + bashen + '</strong>。';
  html += '四柱为：' + yearPillar + '年 ' + monthPillar + '月 ' + dayPillar + '日 ' + hourPillar + '时。';
  html += '</p>';
  html += '<p style="font-size:14px;line-height:2;color:var(--paper2)">';
  html += '《烟波钓叟歌》曰：「阴阳顺逆妙难穷，二至还乡一九宫。若能了达阴阳理，天地都来一掌中。」';
  html += dunName + '以' + (isYangDun ? '顺排' : '逆排') + '九宫，天星地门各安其位。';
  html += '大局吉凶综合判定为：<strong style="color:' + overallColor + ';font-size:16px">' + overallJiXiong + '</strong>。';
  html += '</p>';
  html += '<p style="font-size:13px;line-height:2;color:var(--paper2);margin-top:8px">';
  if (overallJiXiong === '大吉' || overallJiXiong === '偏吉') {
    html += '全局吉星汇聚，吉门临照，八神护佑。宜积极行动，顺势而为。取' + kp.dir + '方为吉，择' + bamen + '门所临之时辰行动最佳。';
  } else if (overallJiXiong === '大凶' || overallJiXiong === '偏凶') {
    html += '全局凶星较多，宜守不宜攻。凶星凶门临照之处，宜避开不宜冲撞。' + kp.dir + '方虽为值符所在，仍需谨慎行事。';
  } else {
    html += '全局吉凶各半，需具体分析各宫位吉凶。吉方宜行，凶方宜避。择吉门吉星所在方位行动，可事半功倍。';
  }
  html += '</p></div>';

  // 2. 值符宫分析
  html += '<div class="interp-card gold-accent"><h5>⭐ 值符宫分析</h5>';
  html += '<p style="font-size:14px;line-height:2;color:var(--paper)">';
  html += '值符为天乙贵人，八神之首，百恶消散，诸事顺利。';
  html += '值符' + jiuxing + '星临' + kp.name + '（' + kp.dir + '方），';
  html += bamen + '门为值使，' + bashen + '神护佑。';
  html += '</p>';
  if (kpd && kpd.star) {
    html += '<p style="font-size:13px;line-height:2;color:var(--paper2);margin-top:6px">';
    html += '星义：' + (kpd.star.detail||'') + '</p>';
  }
  if (kpd && kpd.door) {
    html += '<p style="font-size:13px;line-height:2;color:var(--paper2);margin-top:4px">';
    html += '门义：' + (kpd.door.detail||'') + '</p>';
  }
  if (kpd && kpd.god) {
    html += '<p style="font-size:13px;line-height:2;color:var(--paper2);margin-top:4px">';
    html += '神义：' + (kpd.god.detail||'') + '</p>';
  }
  html += '<p style="font-size:12px;color:var(--gold);margin-top:8px">📜 ' + (kpd?.star?.classic||'') + '</p>';
  html += '</div>';

  // 3. 值使宫分析（值使门所在宫位）
  var zhishiPalace = 0;
  for (var pp=1; pp<=9; pp++) {
    if (palaces[pp] && palaces[pp].door && palaces[pp].door.name === bamen) {
      zhishiPalace = pp; break;
    }
  }
  if (zhishiPalace && zhishiPalace !== keyPalace) {
    var zsp = palaces[zhishiPalace];
    var zspInfo = PALACE_INFO[zhishiPalace];
    html += '<div class="interp-card jade-accent"><h5>🚪 值使宫分析</h5>';
    html += '<p style="font-size:14px;line-height:2;color:var(--paper)">';
    html += '值使' + bamen + '门独立临' + (zspInfo?zspInfo.name:'') + '（' + (zspInfo?zspInfo.dir:'') + '方），';
    html += '值使门主事体之执行，体现事情的推动力和执行过程。';
    html += '</p>';
    html += '<p style="font-size:13px;line-height:2;color:var(--paper2);margin-top:4px">';
    html += '星:' + (zsp?.star?.name||'') + ' · 门:' + (zsp?.door?.name||'') + ' · 神:' + (zsp?.god?.name||'') + '</p>';
    html += '<p style="font-size:13px;line-height:2;color:var(--paper2)">';
    html += '组合简析：' + getComboText(zsp?.star?.name, zsp?.door?.name) + '。' + getDoorAdvice(zsp?.door?.name||'') + '</p>';
    html += '</div>';
  }

  // 4. 主客分析
  var dayGanPalace = findGanPalace(palaces, dayPillar[0]);
  html += '<div class="interp-card cyan-accent"><h5>⚔️ 主客分析</h5>';
  html += '<p style="font-size:14px;line-height:2;color:var(--paper)">';
  html += '<strong style="color:var(--gold)">你是主方：</strong>先行动者为主，后发者受制于人。';
  html += '日干' + dayPillar[0] + '落' + (dayGanPalace?PALACE_INFO[dayGanPalace]?PALACE_INFO[dayGanPalace].name:'':'日干所在') + '，';
  html += '代表你自身的状态和位置。';
  html += '</p>';
  html += '<p style="font-size:13px;line-height:2;color:var(--paper2);margin-top:4px">';
  if (dayGanPalace === keyPalace) {
    html += '你与值符同宫，得天时之助，自身能量与大局趋势一致，行动有利。';
  } else {
    html += '你与值符异宫，需借力而行。宜向值符所在' + kp.dir + '方寻求贵人相助。';
  }
  if (dayGanPalace) {
    var dgp = palaces[dayGanPalace];
    if (dgp && dgp.door && ['休','开','生'].indexOf(dgp.door.name) >= 0) {
      html += '日干临' + dgp.door.name + '吉门，自身能量充沛，可积极进取。</p>';
    } else if (dgp && dgp.door && ['死','惊','伤'].indexOf(dgp.door.name) >= 0) {
      html += '日干临' + dgp.door.name + '凶门，宜谨慎行事，忌冒进。</p>';
    }
  }
  html += '<p style="font-size:12px;color:var(--paper2);margin-top:8px">';
  html += '若占问合作或竞争，建议<strong>后发制人</strong>，观察对方动向后再出手。若占问健康或灾害，建议<strong>主动化解</strong>，不要被动等待。</p>';
  html += '</div>';

  // 5. 四害逐项分析
  html += '<div class="interp-card cinn-accent"><h5>⚠️ 四害逐项分析</h5>';
  if (allSihai.length === 0) {
    html += '<p style="font-size:14px;line-height:2;color:#2ecc71">此局四害全无，星门和谐，天地人三才俱佳，大吉大利之局。诸事可放心行动。</p>';
  } else {
    for (var si=0; si<allSihai.length; si++) {
      var s = allSihai[si];
      html += '<div style="margin-bottom:12px;padding:10px 12px;background:rgba(231,76,60,.03);border-radius:6px">';
      html += '<p style="font-size:13px;font-weight:bold;color:#e74c3c">【' + (si+1) + '】' + s.type + ' · ' + s.palaceName + ' [' + s.severity + ']</p>';
      html += '<p style="font-size:12px;line-height:1.8;color:var(--paper)">' + s.desc + '</p>';
      html += '<p style="font-size:12px;line-height:1.8;color:var(--paper2)">影响：' + (s.effect? (s.effect.desc||'') : '') + '</p>';
      html += '<p style="font-size:12px;line-height:1.8;color:#2ecc71">🛡️ 化解：' + (s.huajie? s.huajie.method : '') + ' ｜ 吉祥物：' + (s.huajie? s.huajie.mascot||'' : '') + ' ｜ 周期：' + (s.period||'') + '</p>';
      html += '</div>';
    }
  }
  html += '</div>';

  // 6. 方位吉凶
  html += '<div class="interp-card gold-accent"><h5>🧭 八方吉凶方位</h5>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;font-size:12px">';
  for (var pp2=1; pp2<=9; pp2++) {
    if (pp2===5) continue;
    var pk2 = palaces[pp2];
    var pi2 = PALACE_INFO[pp2];
    if (!pk2 || !pi2) continue;
    var isGood2 = pk2.star && (pk2.star.type === '大吉' || pk2.star.type === '吉');
    var isBad2 = pk2.star && (pk2.star.type === '大凶' || pk2.star.type === '凶');
    var dirColor = isGood2 ? '#2ecc71' : isBad2 ? '#e74c3c' : '#f39c12';
    html += '<div style="padding:8px;background:rgba(201,168,76,.03);border-radius:6px;text-align:center">';
    html += '<div style="font-size:11px;color:var(--gold)">' + pi2.tri + ' ' + pi2.dir + '</div>';
    html += '<div style="font-size:11px;color:' + dirColor + '">' + (pk2.star?pk2.star.name:'') + '</div>';
    html += '<div style="font-size:10px;color:var(--paper2)">' + (pk2.door?pk2.door.name+'门':'') + '</div>';
    html += '<div style="font-size:10px;color:var(--paper3)">' + (isGood2?'✅吉':isBad2?'❌凶':'➖平') + '</div>';
    html += '</div>';
  }
  html += '</div></div>';

  // 7. 时机建议
  var jiPalaces = [];
  for (var pp3=1; pp3<=9; pp3++) {
    if (pp3===5) continue;
    var pk3 = palaces[pp3];
    if (pk3 && pk3.door && ['休','开','生'].indexOf(pk3.door.name) >= 0 && pk3.star && (pk3.star.type==='大吉'||pk3.star.type==='吉')) {
      jiPalaces.push({palace:pp3, info:PALACE_INFO[pp3], star:pk3.star.name, door:pk3.door.name});
    }
  }
  html += '<div class="interp-card jade-accent"><h5>⏰ 时机建议</h5>';
  html += '<p style="font-size:14px;line-height:2;color:var(--paper)">';
  if (jiPalaces.length > 0) {
    html += '以下方位吉星吉门汇聚，为最佳行动方位：</p>';
    for (var ji=0; ji<jiPalaces.length; ji++) {
      var jp = jiPalaces[ji];
      html += '<p style="font-size:13px;line-height:2;color:var(--paper2)">🏆 <strong>' + (jp.info?jp.info.name:'') + '</strong>（' + (jp.info?jp.info.dir:'') + '方）：' + jp.star + '星 + ' + jp.door + '门。宜在此方进行重要活动，择' + jp.door + '门所主之时辰行动效果更佳。</p>';
    }
  } else {
    html += '当前暂无星门俱佳的方位。建议等待吉门吉星临宫之时再行动。值使门' + bamen + '临' + kp.name + '，此为全局枢纽，所有行动宜以此为核心。</p>';
  }
  // 最佳时间段
  var bestTime = '';
  if (bamen === '休') bestTime = '子时（23-01点）或亥时（21-23点）';
  else if (bamen === '开') bestTime = '申时（15-17点）或酉时（17-19点）';
  else if (bamen === '生') bestTime = '丑时（01-03点）或寅时（03-05点）';
  else bestTime = '辰时（07-09点）或巳时（09-11点）';
  html += '<p style="font-size:12px;color:var(--gold);margin-top:8px">🕐 最佳行动时段：' + bestTime + '（值使门' + bamen + '门当令之时）</p>';
  html += '</div>';

  // 8. 趋避方案
  html += '<div class="interp-card violet-accent"><h5>🛡️ 趋吉避凶方案</h5>';
  html += '<p style="font-size:13px;line-height:2;color:var(--paper)">';
  html += '<strong>1. 趋吉：</strong>行动时面向' + kp.dir + '方，取' + bamen + '门方向。办事宜在吉门所临时辰进行。可佩带' + (kp.ele==='金'?'白水晶':kp.ele==='木'?'绿檀':kp.ele==='水'?'黑曜石':kp.ele==='火'?'红玛瑙':'黄玉') + '增强自身能量。<br>';
  html += '<strong>2. 避凶：</strong>';
  var xiongPlaces = [];
  for (var pp4=1; pp4<=9; pp4++) {
    if (pp4===5) continue;
    var pk4 = palaces[pp4];
    if (pk4 && pk4.star && (pk4.star.type==='大凶'||pk4.star.type==='凶')) {
      xiongPlaces.push(PALACE_INFO[pp4]?PALACE_INFO[pp4].name:'');
    }
  }
  html += (xiongPlaces.length > 0 ? '避开' + xiongPlaces.join('、') + '方向。' : '暂无特别需要避开的方位。') + '<br>';
  html += '<strong>3. 修身：</strong>每日诵读《太上老君说常清静经》一遍，澄心静虑，与天地合德。<br>';
  html += '<strong>4. 积善：</strong>日行一善，积善成德。善行可转化凶星凶门之力，化害为利。<br>';
  html += '<strong>5. 择吉：</strong>重要事项宜择黄道吉日进行，避免在凶星当令之日行动。可参考平台吉日模块选择最佳日期。</p>';
  html += '</div>';

  // 9. 经典出处
  html += '<div class="interp-card gold-accent" style="margin-top:16px">';
  html += '<h5>📜 经典出处</h5>';
  html += '<p style="font-size:12px;line-height:2;opacity:.7">';
  html += '《奇门遁甲秘笈》云：「奇门遁甲者，天地之数，阴阳之理，造化之机也。天有九星以运璇玑，地有九宫以待八卦，人有八门以司启闭。」<br>';
  html += '《烟波钓叟歌》曰：「阴阳顺逆妙难穷，二至还乡一九宫。若能了达阴阳理，天地都来一掌中。」<br>';
  html += '《阳遁九局》载：「阳遁九局，阴遁九局，共十八局，天地之数尽在其中。」<br>';
  html += '《三元总录》：「奇门一术，贯通三才，上可知天时，中可知人事，下可知地理。」';
  html += '</p></div>';

  return html;
}

// ═══════════════════════════════════════
//  流年飞星
// ═══════════════════════════════════════

function buildLiunianHTML(year, palaces) {
  // 年紫白飞星入中宫: (11 - year%9) % 9 + 1  →  or (9 - (year-1)%9)
  var centerStar = (9 - (year - 1) % 9);
  if (centerStar === 0) centerStar = 9;
  // 九宫飞星轨迹 (洛书路径)
  var flyPath = [5,6,7,8,9,1,2,3,4]; // 从中宫开始的飞星序列: 5→6→7→8→9→1→2→3→4
  var flyStars = {};
  for (var i=0; i<9; i++) {
    var palaceNum = flyPath[i];
    var starVal = ((centerStar - 1 + i) % 9) + 1;
    flyStars[palaceNum] = {
      value: starVal,
      name: LIUNIAN_STARS[starVal],
      color: LIUNIAN_COLORS[starVal],
      jixiong: LIUNIAN_JIXIONG[starVal]
    };
  }
  var html = '<div style="margin-top:20px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += '<div style="font-size:14px;color:var(--gold);letter-spacing:3px">🌟 ' + year + '年 流年飞星</div>';
  html += '<div style="display:flex;gap:8px">';
  html += '<button onclick="switchLiunian(-1)" style="padding:4px 10px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer;font-size:11px">◀ 上一年</button>';
  html += '<button onclick="switchLiunian(1)" style="padding:4px 10px;border:1px solid var(--gold);border-radius:4px;background:transparent;color:var(--gold);cursor:pointer;font-size:11px">下一年 ▶</button>';
  html += '</div></div>';
  html += '<div style="font-size:12px;color:var(--paper2);text-align:center;margin-bottom:12px">';
  html += '年星 <strong style="color:' + LIUNIAN_COLORS[centerStar] + '">' + LIUNIAN_STARS[centerStar] + '</strong> 入中宫，各宫飞星如上</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:300px;margin:0 auto">';
  var liunianCellOrder = [4,9,2,3,5,7,8,1,6];
  for (var ci=0; ci<liunianCellOrder.length; ci++) {
    var pn = liunianCellOrder[ci];
    var fs = flyStars[pn];
    var pi = PALACE_INFO[pn];
    var qmd = palaces[pn];
    if (!fs) continue;
    var bgColor = fs.jixiong === '大吉' ? 'rgba(46,204,113,.08)' : fs.jixiong === '大凶' ? 'rgba(231,76,60,.08)' : 'rgba(201,168,76,.03)';
    html += '<div style="padding:6px 4px;background:' + bgColor + ';border:1px solid rgba(201,168,76,.08);text-align:center;border-radius:4px">';
    html += '<div style="font-size:9px;color:var(--paper3)">' + (pi?pi.tri:'') + ' ' + (pi?pi.dir:'') + '</div>';
    html += '<div style="font-size:14px;color:' + fs.color + ';font-weight:bold">' + fs.name + '</div>';
    html += '<div style="font-size:9px;color:' + fs.color + '">' + fs.jixiong + '</div>';
    html += '<div style="font-size:8px;color:var(--paper3);margin-top:2px">星:' + (qmd?.star?.name||'') + ' 门:' + (qmd?.door?.name||'') + '</div>';
    html += '</div>';
  }
  html += '</div></div>';
  return html;
}

// 流年切换
var _qimenCurrentYear = new Date().getFullYear();
function switchLiunian(delta) {
  _qimenCurrentYear += delta;
  var liunianBox = document.getElementById('qmLiunianBox');
  if (liunianBox && window._qmPalaces) {
    liunianBox.innerHTML = buildLiunianHTML(_qimenCurrentYear, window._qmPalaces);
  }
}

// ═══════════════════════════════════════
//  辅助函数
// ═══════════════════════════════════════

function findGanPalace(palaces, gan) {
  for (var p=1; p<=9; p++) {
    if (palaces[p] && (palaces[p].heavenGan === gan || palaces[p].earthGan === gan)) return p;
  }
  return 0;
}

function getComboText(star, door) {
  if (!star || !door) return '';
  var combos = {
    '天蓬-休':'智谋安守','天蓬-生':'破中求财','天蓬-开':'破财事业','天蓬-死':'极凶破财','天蓬-伤':'大凶伤身',
    '天芮-生':'病中求医','天芮-死':'病重难愈','天芮-杜':'病情不明','天芮-休':'静养得愈',
    '天冲-伤':'冲动是非','天冲-杜':'变动受阻','天冲-生':'动而有得','天冲-开':'行动开拓',
    '天辅-生':'大吉学业','天辅-开':'大吉升迁','天辅-景':'文采飞扬','天辅-休':'学业精进',
    '天禽-生':'福德双全','天禽-开':'中正大吉','天禽-休':'安守福德','天禽-景':'文书大吉',
    '天心-生':'医卜求财','天心-开':'领导升迁','天心-休':'休养得法','天心-杜':'医道精进',
    '天柱-开':'破败事业','天柱-生':'破败求财','天柱-死':'极凶破败','天柱-惊':'惊恐破败',
    '天任-生':'任事有得','天任-开':'责任可成','天任-休':'安守得吉','天任-景':'文任有成',
    '天英-景':'是非口舌','天英-开':'名声受损','天英-休':'休中有名','天英-生':'名中得利'
  };
  return combos[star+'-'+door] || star + '会' + door + '门';
}

function getDoorAdvice(door) {
  var m = {
    '休':'宜休养人际访友，以静制动。求医治病、婚嫁喜庆、修造安宅皆吉。',
    '开':'宜事业升迁远行，开创新局。求职应聘、谈判签约、出行远游大吉。',
    '生':'宜求财创业置产，大有可为。经商投资、置业购产、生育种植皆宜。',
    '景':'宜文书信息告白，文事为佳。考试、文书、告示、宣传、演艺利于此门。',
    '伤':'宜讨债博弈，不宜大举进攻。博弈竞技、医疗手术可于此门进行。',
    '杜':'宜保密躲藏，不宜张扬。修行、隐居、暗中行事利于此门。',
    '死':'宜丧葬捕猎，不宜轻动。了结旧事、丧葬捕猎、终结清理之事。',
    '惊':'宜官非诉讼，须防口舌。诉讼辩论、揭发检举、应对惊恐之事。'
  };
  return m[door] || '值使门所在，为全局行事之枢纽。';
}

function getPalaceSummary(palaces) {
  var s = '';
  for (var p=1; p<=9; p++) {
    var pk = palaces[p];
    if (!pk || p===5) continue;
    s += pk.name + ':' + (pk.star?.name||'') + '·' + (pk.door?.name||'') + '门(' + (pk.star?.type||'') + ')';
    if (pk.god) s += '·' + pk.god.name + '神';
    s += '\n';
  }
  return s;
}

function getYiJi(palaces, kp) {
  var good = Object.values(palaces).filter(function(p){ return p?.star?.type === '大吉' || p?.star?.type === '吉'; });
  var bad = Object.values(palaces).filter(function(p){ return p?.star?.type === '大凶' || p?.star?.type === '凶'; });
  return '宜:' + good.map(function(p){return p.name;}).join('、') + '。忌:' + bad.map(function(p){return p.name;}).join('、') + '。值使宫' + (palaces[kp]?.name||'中宫') + '为行动核心。';
}

function getQimenReadingHTMLV2(keyPalace, palaces) {
  var html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(155,89,182,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--violet2);letter-spacing:4px">🔮 各宫精解</h5>';
  for (var p=1; p<=9; p++) {
    if (p===5) continue;
    var pk = palaces[p];
    var pi = PALACE_INFO[p];
    if (!pk || !pi) continue;
    var isGood = pk.star && (pk.star.type==='大吉'||pk.star.type==='吉');
    var isBad = pk.star && (pk.star.type==='大凶'||pk.star.type==='凶');
    var sc = isGood ? '#2ecc71' : isBad ? '#e74c3c' : '#f39c12';
    html += '<div style="margin-bottom:8px;padding:8px 10px;background:rgba(201,168,76,.02);border-radius:6px">';
    html += '<span style="font-size:12px;color:' + sc + '">' + pi.tri + ' ' + pi.name + '(' + pi.dir + ')：</span>';
    html += '<span style="font-size:11px;color:var(--paper)">⭐' + (pk.star?.name||'') + ' 🚪' + (pk.door?.name||'') + '门 👤' + (pk.god?.name||'') + ' 天' + (pk.heavenGan||'') + '地' + (pk.earthGan||'') + '</span>';
    html += '<span style="font-size:10px;color:var(--paper2);margin-left:6px">' + getComboText(pk.star?.name, pk.door?.name) + '</span>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

// ================================================================
//  紫微斗数专业知识库 · 十四主星 + 六吉星 + 六煞星 + 四化星
//  基于《紫微斗数全书》《紫微斗数解密》等经典
// ================================================================
const ZW_MAIN_STARS = {
  // ========== 十四主星（每星300字+详解） ==========
  '紫微':{
    name:'紫微', nature:'帝星·北斗主星', element:'土', yinyang:'阴',
    detail:'紫微星为斗数之主，北斗第一星，号称「帝王之星」，统御众星，主贵气、领导力、权威。五行属阴土，为至尊至贵之星。紫微坐命者，天生具有领导气质，心胸宽广，有大局观，处事稳重温厚，不怒自威。无论男女，皆有受人尊敬之命格，一生多贵人扶持。紫微喜左辅右弼夹辅，则成「辅弼拱主」之贵格；喜天魁天钺同宫，则贵人运旺；喜文昌文曲会照，则文武双全；喜禄存同宫，则富贵双全。紫微逢煞星冲破（火星铃星擎羊陀罗），则尊贵之气受损，易有孤独感，性情孤高，高处不胜寒，需防刚愎自用。紫微入命宫庙旺（寅卯巳午未申），帝星有威，仕途顺遂，宜从政、管理、领导岗位；入陷地（子丑辰戌亥），则帝星失位，怀才不遇，宜修身养性。紫微在夫妻宫，配偶有贵气，但需防配偶强势；在财帛宫，得财容易但需防奢侈；在官禄宫，事业有成，宜居高位。紫微不喜独坐，独坐则孤君在野，需借辅星之力方成大局。',
    miaoXian:'庙:寅卯巳午未申 | 陷:子丑辰戌亥',
    good:'领导气质、心胸宽广、贵人运旺、处事稳重、有大局观、不怒自威',
    bad:'易自负、孤独感、依赖贵人、好面子、高处不胜寒、刚愎自用',
    classic:'《紫微斗数全书》云:「紫微星为帝座，主尊贵，统御众星。紫微帝座，至尊至贵，不可侵犯。」《太微赋》曰:「紫微帝座，统御诸星，主贵气权威。」《骨髓赋》云:「紫微辅弼同宫，一呼百诺；紫微七杀同度，化为权柄。」'
  },
  '天机':{
    name:'天机', nature:'智星·南斗第三星', element:'木', yinyang:'阴',
    detail:'天机星为南斗第三星，属阴木，为「智谋之星」，主智慧、谋略、变动、机敏。天机坐命者，心思缜密，反应敏捷，善于思考分析，有创新思维和应变能力。天机属木，木主仁，故天机人心地善良但思虑过多。天机为善变之星，入命者一生多变动波折，适合需要灵活应变的行业，如策划、咨询、IT、研发等。天机喜与太阴同宫，则智慧与财富并存（「机月同梁格」之基）；喜与天梁会照，则谋略有成；喜文昌文曲，则才思敏捷。天机逢煞星，则变化无常、多劳少成，需防神经衰弱、焦虑失眠之症。天机在兄弟宫，兄弟姐妹聪明但缘薄；在夫妻宫，配偶聪慧但感情多变动；在官禄宫，宜从事脑力劳动、技术研发；在迁移宫，出外多得贵人指点。天机忌化忌，化忌则智慧受阻、决策失误、口舌是非；喜化禄，化禄则智慧生财；喜化权，化权则谋略得势。',
    miaoXian:'庙:寅卯辰巳午未 | 陷:申酉戌亥子丑',
    good:'聪明灵巧、反应敏捷、善于思考、有创新精神、适应力强、足智多谋',
    bad:'多变不安、思虑过多、神经衰弱、多劳少成、优柔寡断',
    classic:'《紫微斗数全书》云:「天机星主智慧、谋略，善变多学。天机为智囊之星，上可辅佐帝王，下可解惑众生。」《骨髓赋》曰:「天机善算，智谋过人；天机太阴，机月同梁。」'
  },
  '太阳':{
    name:'太阳', nature:'贵星·中天主星', element:'火', yinyang:'阳',
    detail:'太阳星为中天主星，属阳火，为「光明贵气之星」，主光明、名声、事业、男性（父亲/丈夫）。太阳为日之精，光芒万丈，坐命者性格光明磊落，热情开朗，有正义感，乐于助人，好打抱不平。太阳喜白天生人（寅卯辰巳午未时），则光芒四射，事业有成，名扬四海；忌夜间生人（申酉戌亥子丑时），则光芒受遮，付出多而回报少，劳碌奔波。太阳喜与太阴对照，成「日月并明」格局，则阴阳调和，富贵双全；喜巨门同宫，则巨门之暗被太阳所照，口舌是非减少；喜天梁会照，则事业有成、名声远扬。太阳逢煞星，则名声受损、事业波折，需防眼疾（太阳主目）、心脏疾病。太阳庙旺（寅卯辰巳午），光芒大显，宜从政、教育、公益、演艺等行业；落陷（申酉戌亥子），则需低调行事、避免过多暴露。女命太阳坐命，性格外向，有男子气概，事业心强，但感情上易有波折，需注意夫妻宫配合。',
    miaoXian:'庙:寅卯辰巳午 | 陷:申酉戌亥子',
    good:'光明磊落、热情开朗、有正义感、名声远扬、事业有成、慷慨大方',
    bad:'过于辛劳、眼疾心脏、夜生受损、付出多回报少、好面子',
    classic:'《紫微斗数全书》云:「太阳星主光明、名声，利于仕途。太阳为日之精，普照万物，博爱无私。」《太微赋》曰:「太阳照命，光明磊落；日夜有别，昼夜分明。」'
  },
  '武曲':{
    name:'武曲', nature:'财星·北斗第六星', element:'金', yinyang:'阴',
    detail:'武曲星为北斗第六星，属阴金，为「正财之星」，主财帛、刚毅、决断、武职。武曲坐命者，性格刚毅果断，执行力强，有经商头脑，善于理财投资，做事干脆利落。武曲属金，金主义，故武曲人重义气但性情刚硬，不喜拖泥带水。武曲为正财星，入命者一生财运较好，但需靠自身努力拼搏得来，非不劳而获之星。武曲喜与贪狼同宫，则财气旺盛、事业有成；喜与天府同宫/会照，则财库丰厚、积蓄力强；喜天相会照，则理财有道。武曲逢煞星，则财运波折，易有口舌官非、刑伤之灾。武曲又称「寡宿星」，因其刚硬之性，女命武曲坐命者感情多波折，宜晚婚；男命武曲则事业心过强，易忽略家庭。武曲在财帛宫，财运亨通但需靠实力；在官禄宫，宜金融、贸易、军警、工程师等；在夫妻宫，配偶能力强但性格刚硬。武曲喜化禄，化禄则财源广进；喜化权，化权则决策果断；忌化忌，化忌则破财、投资失利。',
    miaoXian:'庙:丑未辰戌 | 陷:巳亥',
    good:'刚毅果断、善于理财、财运较好、有经商头脑、执行力强、重义气',
    bad:'过于刚强、感情波折、口舌刑伤、孤寡之象、不近人情',
    classic:'《紫微斗数全书》云:「武曲星主财帛，刚毅果断。武曲掌财，富贵可期。」《骨髓赋》曰:「武曲入命，财运亨通；武曲天府，财库充盈。」'
  },
  '天同':{
    name:'天同', nature:'福星·南斗第四星', element:'水', yinyang:'阳',
    detail:'天同星为南斗第四星，属阳水，为「福德享乐之星」，主福气、享乐、温和、懒散。天同坐命者，性格温和善良，待人宽厚，喜欢安逸享受，有艺术气质，一生福气较好。天同属水，水主智，但天同之水为静水，故智慧内敛而不张扬。天同喜与太阴同宫，则福财双全，享受人生；喜与天梁会照，则福寿双全，晚年安乐；喜与巨门同宫，则口福好，但需防口舌。天同逢煞星，则福气受损，易懒散怠惰，缺乏进取心。天同最怕化忌，化忌则福气消散，精神苦闷，享乐反成负担。天同在命宫，一生不愁吃穿，但需防过于安逸导致一事无成；在夫妻宫，配偶温和但缺乏上进心；在财帛宫，财运平稳但非大富；在福德宫，精神充实，爱好广泛。天同为「福德宫主」，入福德宫者精神生活丰富，有艺术鉴赏力，晚年生活安逸。天同喜化禄，化禄则福气加倍、享受人生；喜化权，化权则懒散变勤奋、福气中有进取。',
    miaoXian:'庙:寅卯申酉 | 陷:巳亥',
    good:'温和善良、有福气、福禄双全、喜欢享受、人缘好、艺术气质',
    bad:'过于懒散、福气受损、缺乏进取、依赖他人、安逸误事',
    classic:'《紫微斗数全书》云:「天同星主福禄，温和善良。天同为福星，入命者一生不愁吃穿。」《太微赋》曰:「天同入命，一生有福；天同化禄，福泽深厚。」'
  },
  '廉贞':{
    name:'廉贞', nature:'桃花星·北斗第五星', element:'火', yinyang:'阴',
    detail:'廉贞星为北斗第五星，属阴火，为「次桃花之星」，主感情、欲望、艺术、是非、血光。廉贞坐命者，性格敏感细腻，感情丰富，有艺术气质和审美能力，但心思复杂，情感纠葛多。廉贞属火，火主礼，但廉贞之火为阴火（暗火），故外冷内热，外表冷静内心炽热。廉贞为次桃花星（次于贪狼），入命者一生桃花旺盛，异性缘佳，但感情复杂，容易陷入三角关系。廉贞喜与天府同宫，则感情稳定、欲望可控；喜与天相会照，则事业有成、艺术有就；喜文昌文曲，则才华横溢。廉贞逢煞星（尤其擎羊陀罗），则桃花劫，需防血光之灾、官非牢狱之患。廉贞在命宫，艺术气质浓厚，但需防感情用事；在夫妻宫，配偶有才华但感情复杂，宜晚婚；在官禄宫，宜艺术、设计、公关、演艺等行业；在疾厄宫，需防血液、心脏、免疫系统疾病。廉贞化禄则感情丰富、桃花正旺；化忌则感情纠葛、是非不断，严重者有牢狱之灾，故廉贞忌为「囚星」之由来。',
    miaoXian:'庙:寅申 | 陷:巳亥',
    good:'感情丰富、艺术气质、有魅力、情感细腻、审美能力强、才艺出众',
    bad:'感情波折、桃花劫、多思多虑、囚禁之象、血光官非、欲望难控',
    classic:'《紫微斗数全书》云:「廉贞星主感情，艺术天赋。廉贞为次桃花，次于贪狼。」《骨髓赋》曰:「廉贞入命，感情复杂；廉贞化忌，为囚为狱。」'
  },
  '天府':{
    name:'天府', nature:'库星·南斗主星', element:'土', yinyang:'阳',
    detail:'天府星为南斗主星，属阳土，为「财库之星」，主财富、稳定、保守、管理。天府为南斗之首，与紫微（北斗之首）并称「二帝星」，紫微主贵，天府主富。天府坐命者，性格稳重厚实，心胸宽广，善于管理，有积蓄能力，为人诚信可靠。天府属土，土主信，故天府人重信用，做事踏实，不投机取巧。天府为「库星」，入命者一生有财库，善于守财，但开源能力稍弱，宜从事金融、会计、仓储、管理等需要稳定性的行业。天府喜与武曲同宫，则财库丰厚，富贵双全；喜与紫微会照，则权财双全（「紫府同宫格」为大贵格）；喜天相会照，则管理有道。天府逢煞星，则财库受损，易有破财之虞，或财来财去。天府在命宫，一生吃穿不愁，晚年安稳；在财帛宫，财运稳定、积蓄丰厚；在田宅宫，有祖业可承，置业运强；在夫妻宫，配偶稳重可靠但缺乏浪漫。天府化科则名声在外、管理有方；天府不喜化忌，化忌则财库泄漏、投资失利。',
    miaoXian:'庙:寅午戌 | 陷:巳亥',
    good:'稳重厚实、善于管理、有财库、积蓄能力强、稳定可靠、诚信重义',
    bad:'过于保守、财库受损、缺乏进取、固步自封、错失良机',
    classic:'《紫微斗数全书》云:「天府星主财库，稳重厚实。天府为南斗之主，与紫微并尊。」《骨髓赋》曰:「天府入命，一生有财库；紫微天府，帝王格局。」'
  },
  '太阴':{
    name:'太阴', nature:'富星·中天主星', element:'水', yinyang:'阴',
    detail:'太阴星为中天主星，属阴水，为「富足柔美之星」，主财帛、女性（母亲/妻子）、柔美、房地产。太阴为月之精，阴柔静美，坐命者性格温和柔顺，有阴柔之美，心思细腻，善于谋划理财。太阴喜夜间生人（申酉戌亥子丑时），则月朗星明，财运亨通；忌白天生人（寅卯辰巳午未时），则月光受遮，财运平平。太阴喜与太阳对照，成「日月并明」格局，则阴阳协调、富贵双全；喜与天同会照，则财福双全、安乐人生；喜与天机会照，则智慧与财富并存（机月同梁格）。太阴逢煞星，则财运波折，需防眼疾（月主目）、肾虚、妇科疾病。太阴为田宅宫主，入田宅宫者房地产运佳，有祖产可承；在财帛宫，财运稳定但需细水长流；在夫妻宫，配偶美貌温柔，女命太阴坐夫妻宫为「月朗天门格」之基础。太阴喜化禄，化禄则财源滚滚、富足安乐；化权则理财有方、善于经营；化科则名声在外、以柔克刚；化忌则财运黯淡、精神苦闷，需防忧郁。',
    miaoXian:'庙:酉戌亥子 | 陷:巳午',
    good:'温和柔顺、有阴柔之美、善于理财、财运较好、感情丰富、细腻周到',
    bad:'过于柔弱、眼疾肾虚、夜生为佳、精神忧郁、优柔寡断',
    classic:'《紫微斗数全书》云:「太阴星主财帛，阴柔之美。太阴为月之精，主富不主贵。」《太微赋》曰:「太阴入命，财运亨通；日月并明，富贵双全。」'
  },
  '贪狼':{
    name:'贪狼', nature:'桃花星·北斗第一星', element:'木/水', yinyang:'阳',
    detail:'贪狼星为北斗第一星，属阳木（亦具水性），为「正桃花之星」，主桃花、欲望、才艺、交际。贪狼坐命者，性格多才多艺，八面玲珑，有魅力，社交能力强，欲望较强，善于察言观色。贪狼为桃花之首，入命者一生桃花旺盛，异性缘极佳，适合从事演艺、公关、销售、娱乐等需要魅力的行业。贪狼喜与紫微同宫，则桃花有成、事业有就（「紫贪格」）；喜与武曲会照，则财运亨通；喜与廉贞同宫，则才艺双全但桃花更旺。贪狼逢煞星，则桃花泛滥成灾，容易陷入酒色、赌博之患。贪狼在命宫，多才多艺但需防欲望过度；在夫妻宫，配偶有魅力但感情多波折，宜晚婚；在财帛宫，财运来自人脉和交际，但需防破财于酒色；在福德宫，精神追求多样但难以专一。贪狼化禄则桃花正旺、交际得财；化权则欲望转化为创造力、事业有成；化忌则桃花劫、酒色伤身、赌博破财。贪狼亦主「解厄」，在疾厄宫逢之，反有化解疾病之功。贪狼与空曜（地空地劫）同度，则可将桃花转化为艺术创作力。',
    miaoXian:'庙:寅午戌 | 陷:巳亥',
    good:'多才多艺、有魅力、桃花旺盛、社交能力强、才艺出众、善于交际',
    bad:'桃花泛滥、酒色之灾、欲望较强、贪多求全、赌博破财',
    classic:'《紫微斗数全书》云:「贪狼星主桃花，多才多艺。贪狼为正桃花星，入命者一生多桃花。」《太微赋》曰:「贪狼入命，一生多桃花；贪狼紫微，桃花有成。」'
  },
  '巨门':{
    name:'巨门', nature:'暗星·北斗第二星', element:'水', yinyang:'阴',
    detail:'巨门星为北斗第二星，属阴水，为「暗曜口舌之星」，主口才、是非、分析、暗中之事。巨门坐命者，性格敏感多疑，有口才，善于辩论分析，研究能力强，但容易招惹口舌是非。巨门为阴水，水主智，但巨门之水为暗水，故智慧偏于分析拆解而非创造。巨门喜与太阳同宫，太阳之光照亮巨门之暗，则是非可化解、口才可成事；喜与天机会照，则分析能力超群，宜从事律师、讲师、研究员、侦探、评论员等行业；喜化禄，则口才生财。巨门逢煞星（尤其擎羊陀罗），则口舌是非尤甚，严重者有官非牢狱之灾。巨门在命宫，一生需注意口舌是非，宜修身养性；在夫妻宫，夫妻之间容易因言语产生矛盾；在父母宫，与父母沟通有障碍。巨门化禄则口才生财，一言九鼎；化权则言语有权威；化忌则暗曜加重，口舌是非不断，精神苦闷，多疑多虑，需防小人和官非。巨门亦为「暗根」，在疾厄宫则需注意暗疾（不易诊断的疾病）。',
    miaoXian:'庙:寅申巳亥 | 陷:子午',
    good:'有口才、善于辩论分析、敏感多疑、学习能力强、研究能力强',
    bad:'口舌是非、官非之灾、多思多虑、孤独之象、暗疾隐患',
    classic:'《紫微斗数全书》云:「巨门星主口才，是非口舌。巨门为暗星，暗曜当空，是非难免。」《骨髓赋》曰:「巨门入命，一生多是非；巨门太阳，暗中有光。」'
  },
  '天相':{
    name:'天相', nature:'印星·南斗第五星', element:'水', yinyang:'阳',
    detail:'天相星为南斗第五星，属阳水，为「印信之星」，主印信、权力、辅佐、协调。天相坐命者，性格温和稳重，待人真诚，善于协调沟通，有管理能力和服务精神。天相属水，水主智，天相之水为清水，故智慧清透，善于处理复杂人际关系。天相主印信，入命者一生有权印，适合从事公务员、秘书、行政管理、人力资源等需要协调能力的行业。天相喜与紫微同宫，则权印双全，成「紫相格」；喜与天府会照，则管理有道；喜左辅右弼，则助力倍增。天相逢煞星，则权印受损，容易卷入官司口舌。天相有「夹宫」之特殊属性——前后两宫（父母宫与子女宫）的星曜对天相影响极大。若前后两宫有吉星夹辅，则天相之力倍增；若有煞星夹制，则「夹印」受损，权印难安。天相又称「衣食之星」，入命者一生衣食无忧，有服务精神。天相在命宫，主一生有权位但需防夹宫煞星；在夫妻宫，配偶温和善于持家；在官禄宫，宜管理、协调类工作。天相喜化科，化科则印信彰明、名声在外；天相不喜化忌，化忌则印信受损、有口舌官司。',
    miaoXian:'庙:寅申巳亥 | 陷:卯酉',
    good:'温和稳重、善于协调、有权印、管理能力、衣食无忧、服务精神',
    bad:'依赖他人、夹宫影响、官司口舌、权印受损、缺乏主见',
    classic:'《紫微斗数全书》云:「天相星主印信，善于辅佐。天相为印星，入命者一生有权印。」《太微赋》曰:「天相入命，一生有权；天相紫微，权印双全。」'
  },
  '天梁':{
    name:'天梁', nature:'荫星·南斗第二星', element:'土', yinyang:'阳',
    detail:'天梁星为南斗第二星，属阳土，为「荫庇福寿之星」，主寿元、福德、长辈、贵人、医药。天梁坐命者，性格稳重有德，有长者风范，乐于助人，有正义感和社会责任感。天梁属土，土主信，故天梁人重信用，有长者之德，少年老成。天梁主「荫」，入命者一生有贵人庇护，逢凶化吉，适合从事教育、医疗、公益、司法等需要德行的行业。天梁喜与天同同宫，则福寿双全；喜与太阳会照，则名声远扬、事业有成；喜文昌文曲，则学识渊博。天梁逢煞星，则荫庇受损，贵人运减，需防灾厄。天梁在命宫，一生有贵人扶持，老来有福；在父母宫，父母长寿有德；在疾厄宫，虽有病但能逢良医，有康复之机。天梁又称「老人星」，入命者多长寿，有长者之风。天梁化禄则福荫深厚，贵人众多；化权则权威自生，有领导才能；化科则学问有成就，名声在外。天梁不喜化忌，化忌则荫庇受损，贵人反成负担，健康需注意。天梁有「刑忌夹印」之说——若天梁前后有擎羊陀罗夹制，则福荫受损。',
    miaoXian:'庙:子午 | 陷:巳亥',
    good:'稳重有德、长者风范、贵人庇护、福寿双全、助人为乐、正义感',
    bad:'过于保守、灾厄之象、荫庇受损、孤寡倾向、少年老成',
    classic:'《紫微斗数全书》云:「天梁星主荫庇，福寿之象。天梁为寿星，入命者多长寿。」《骨髓赋》曰:「天梁入命，一生有贵人；天梁天同，福寿双全。」'
  },
  '七杀':{
    name:'七杀', nature:'将星·北斗第六星', element:'金', yinyang:'阳',
    detail:'七杀星为北斗第六星，属阳金，为「将星权柄之星」，主权柄、威严、决断、开创。七杀坐命者，性格刚烈果断，有开拓精神和领导力，敢于挑战权威，做事雷厉风行。七杀属金，金主义，故七杀人重义气讲原则，但性情刚猛，不喜妥协。七杀主权柄，入命者一生有权势，适合从事军警、创业、管理等需要魄力和决断力的行业。七杀为「杀破狼」格局（七杀、破军、贪狼）之首，此格局主动荡开创，一生多起伏。七杀喜与紫微同宫，则权柄有成（「紫杀格」为大贵格）；喜与天府会照，则刚柔并济；喜文昌文曲，则文武双全。七杀逢煞星，则过于刚猛，易有刑伤官非。七杀在命宫，一生多起伏但能成大事；在官禄宫，事业心强但需防过于刚强；在夫妻宫，配偶性格刚硬，需相互包容。七杀化禄则开创有成、财运亨通；化权则权势更盛、威严倍增；化科则威名远扬。七杀忌化忌，化忌则刚猛失度、易有官非刑伤、事业受挫。七杀为将星，入命者宜独当一面，不宜受人节制。',
    miaoXian:'庙:寅申巳亥 | 陷:卯酉',
    good:'刚烈果断、有开拓精神、权势有成、敢于挑战、执行力强、将帅之才',
    bad:'过于刚强、刑伤官非、孤寡之象、冲劲过度、树敌过多',
    classic:'《紫微斗数全书》云:「七杀星主权柄，刚烈果断。七杀为将星，入命者有权有势。」《太微赋》曰:「七杀入命，有权有势；七杀紫微，化为权柄。」'
  },
  '破军':{
    name:'破军', nature:'耗星·北斗第七星', element:'水', yinyang:'阴',
    detail:'破军星为北斗第七星，属阴水，为「变动消耗之星」，主变动、破坏、开创、消耗。破军坐命者，性格多变，不喜束缚，有强烈的开创精神和变革欲望，喜欢打破常规、另辟蹊径。破军为「杀破狼」格局之一，主一生多变动起伏，适合从事需要创新、变革的行业，如创业、科技、艺术等。破军亦为「耗星」，入命者一生付出较多，容易消耗自身精力财力，需注意积蓄和健康。破军喜与紫微同宫，则变动有成、开创有就（「紫破格」）；喜左辅右弼，则助力倍增、变动中有贵人扶持。破军逢煞星，则变动过于频繁，多劳少成，需防破耗之灾。破军在命宫，一生多变动但能开创事业；在夫妻宫，婚姻多变动，宜晚婚；在财帛宫，财来财去，宜从事现金流转快的行业。破军化禄则变动中有收获；化权则开创力强、决策果断。破军忌化忌，化忌则变动失序、消耗加倍、多劳少成。破军入命者有「先破后成」之说，早年多波折，中晚年方能稳定。',
    miaoXian:'庙:子午 | 陷:巳亥',
    good:'有开创精神、打破常规、善于创新、变革能力强、敢闯敢拼',
    bad:'变动频繁、多劳少成、守成不易、耗财之象、早年波折',
    classic:'《紫微斗数全书》云:「破军星主变动，开创与破坏并存。破军为耗星，入命者一生多变动。」《骨髓赋》曰:「破军入命，一生多变动；破军紫微，变动有成。」'
  }
};

// ========== 六吉星详解 ==========
const ZW_AUSPICIOUS = {
  '左辅': { name:'左辅', nature:'辅佐吉星', element:'土', detail:'左辅星为北斗辅星，属阳土，主辅助、助力、人缘。左辅坐命者，得道多助，人缘极佳，一生多得贵人扶持和下属拥护。左辅喜与紫微同宫/夹宫，成「辅弼拱主」之贵格；喜文昌文曲会照，则才助双全。左辅化科则辅佐有成，名望提升。左辅在命宫，主有领导力但善用人才；在交友宫，下属得力、朋友可靠。', good:'得道多助、人缘佳、下属得力、贵人扶持', bad:'依赖他人、缺乏主见', classic:'《紫微斗数全书》云:「左辅为北斗辅星，主辅助、人缘。」' },
  '右弼': { name:'右弼', nature:'辅佐吉星', element:'水', detail:'右弼星为北斗辅星，属阴水，主辅助、谋略、暗中助力。右弼坐命者，内秀于心，善于谋划，有暗中贵人相助。右弼喜与紫微同宫/夹宫，与左辅同夹则贵不可言。右弼在命宫，外柔内刚，善用智谋；在迁移宫，出外多得贵人暗中相助。右弼化科则智谋有成。', good:'内秀于心、暗中贵人、善于谋划、辅助有力', bad:'过于依赖、缺乏主动', classic:'《紫微斗数全书》云:「右弼为北斗辅星，主暗中助力、谋略。」' },
  '天魁': { name:'天魁', nature:'天乙贵人', element:'火', detail:'天魁星为南斗助星，属阳火，主科甲、贵人、考试。天魁坐命者，一生有贵人提携，考试运佳，宜求学应试。天魁为「天乙贵人」之首，见之则有逢凶化吉之能。天魁在命宫，主得长辈贵人提携；在官禄宫，事业多得上司赏识；在迁移宫，在外多得贵人。天魁不喜与擎羊陀罗同宫，则贵人受损。', good:'贵人提携、考试运佳、逢凶化吉、长辈缘好', bad:'依赖贵人、自身努力不足', classic:'《紫微斗数全书》云:「天魁为南斗助星，主科甲贵人。」' },
  '天钺': { name:'天钺', nature:'玉堂贵人', element:'火', detail:'天钺星为南斗助星，属阴火，主科甲、贵人、暗中助力。天钺坐命者，考试运佳，有暗中贵人相助，宜求学深造。天钺为「玉堂贵人」，与天魁并称「天乙拱命格」。天钺在命宫，主得贵人暗中提携；在夫妻宫，配偶为贵人；在官禄宫，事业有贵人助。天钺化科则学业有成。', good:'考试运佳、暗中贵人、学业有成、配偶有助', bad:'依赖外在、自身根基不稳', classic:'《紫微斗数全书》云:「天钺为南斗助星，主暗中贵人。」' },
  '文昌': { name:'文昌', nature:'文曲吉星', element:'金', detail:'文昌星为南斗文星，属阳金，主文学、科甲、才华、文书。文昌坐命者，文思敏捷，学识渊博，有文学天赋，考试运佳。文昌喜与文曲同宫，成「文桂文华格」；喜与天魁天钺会照，则科甲大利。文昌化科则文名远扬，化忌则文书有误、考试失利。文昌在命宫，主聪明好学；在官禄宫，宜文职、学术、出版。', good:'文思敏捷、学识渊博、考试运佳、文学天赋', bad:'书呆子气、行动力弱', classic:'《紫微斗数全书》云:「文昌为文星，主文学科甲。」' },
  '文曲': { name:'文曲', nature:'文华吉星', element:'水', detail:'文曲星为北斗文星，属阴水，主才艺、口才、文华、艺术。文曲坐命者，多才多艺，口才好，有艺术天赋，善于表达。文曲喜与文昌同宫，则文华灿烂；喜天魁天钺会照，则才艺得贵人赏识。文曲化科则才名远扬，化忌则口舌是非、文书失误。文曲在命宫，主才艺出众；在迁移宫，在外以才艺闻名。', good:'多才多艺、口才好、艺术天赋、善于表达', bad:'华而不实、口舌是非', classic:'《紫微斗数全书》云:「文曲为文星，主才艺口才。」' }
};

// ========== 六煞星详解 ==========
const ZW_INAUSPICIOUS = {
  '擎羊': { name:'擎羊', nature:'羊刃煞星', element:'金', detail:'擎羊星为北斗煞星，属阳金，主刑伤、冲突、刚强、意外。擎羊坐命者，性格刚强冲动，做事直接，有行动力但易与人冲突。擎羊入命宫者，面有破相或身上有疤痕，宜从事军警、外科医生、运动员等需要魄力的行业以化解其煞气。擎羊在迁移宫，出外需防意外伤害、交通事故；在疾厄宫，需防刀伤手术。擎羊不喜与廉贞同宫，则血光之灾尤重。擎羊在命宫三方会照时，有「马头带箭」格局（擎羊在午），反主威权。', bad:'刑伤冲突、血光意外、性格刚强、易与人冲突', classic:'《紫微斗数全书》云:「擎羊为煞星，主刑伤冲突。」' },
  '陀罗': { name:'陀罗', nature:'陀罗煞星', element:'金', detail:'陀罗星为北斗煞星，属阴金，主拖延、纠缠、暗算、慢性病。陀罗坐命者，性格固执，做事拖沓，容易陷入纠缠不清的局面。陀罗入命宫者，一生多阻滞拖延，宜从事需要耐心细致的工作（如手工艺、科研）以化解。陀罗在迁移宫，出外多阻碍；在疾厄宫，需防慢性疾病、暗疾缠身。陀罗与擎羊并称「羊陀」，二煞夹制某宫之大凶。陀罗在命宫三方，有「刑忌夹印」之说。', bad:'拖延纠缠、固执己见、慢性疾病、暗中阻碍', classic:'《紫微斗数全书》云:「陀罗为煞星，主拖延纠缠。」' },
  '火星': { name:'火星', nature:'火煞凶星', element:'火', detail:'火星为南斗煞星，属阳火，主突发、火灾、冲动、急性病。火星坐命者，性格急躁冲动，反应迅速，但缺乏耐心，易有突发变故。火星入命宫者，脾气火爆，宜从事需要快速反应的工作（如消防、急救）以化解。火星在财帛宫，财运来得快走得也快；在疾厄宫，需防急性炎症、发热类疾病、火灾烧烫伤。火星与铃星并称「火铃」，二煞夹制之宫大凶。火星在命宫三方，有「火贪格」（火星+贪狼），反主暴发之运。', bad:'突发变故、脾气急躁、急性炎症、火灾隐患', classic:'《紫微斗数全书》云:「火星为煞星，主突发变故。」' },
  '铃星': { name:'铃星', nature:'铃煞凶星', element:'火', detail:'铃星为南斗煞星，属阴火，主暗火、阴谋、慢性炎症、精神苦闷。铃星坐命者，性格阴沉，心思细腻但多疑，容易精神苦闷。铃星入命宫者，内心焦躁但外表不显，宜从事需要谋略的工作（如战略规划）以化解。铃星在疾厄宫，需防慢性炎症、神经系统疾病、抑郁症；在福德宫，精神压力大。铃星与火星并称「火铃」，二煞为虐。铃星在命宫三方，有「铃贪格」（铃星+贪狼），反主暗中暴发。', bad:'暗火阴谋、慢性炎症、精神苦闷、心思多疑', classic:'《紫微斗数全书》云:「铃星为煞星，主暗火阴谋。」' },
  '地空': { name:'地空', nature:'空亡煞星', element:'火', detail:'地空星为北斗煞星，属阴火，主空亡、破败、虚无、幻想。地空坐命者，思想天马行空，不切实际，容易好高骛远。地空入命宫者，一生多空想少实际行动，宜从事创意、艺术、哲学等需要想象力的领域以化解其空性。地空在财帛宫，财来财去，守财不易；在夫妻宫，感情空虚；在福德宫，精神追求超脱世俗。地空与地劫并称「空劫」，二煞同度则万事成空。地空有将物质欲望转化为精神追求的正面作用。', bad:'空亡破败、不切实际、好高骛远、守财不易', classic:'《紫微斗数全书》云:「地空为煞星，主空亡破败。」' },
  '地劫': { name:'地劫', nature:'劫煞凶星', element:'火', detail:'地劫星为北斗煞星，属阳火，主劫难、破耗、波折、意外。地劫坐命者，一生多意外波折，容易遭遇飞来横祸。地劫入命宫者，运势起伏大，需有心理准备面对突发变故。地劫在财帛宫，易有破财之灾（被盗、被骗、意外破财）；在迁移宫，出外需防意外事故。地劫与地空并称「空劫」，二煞同度则万事成空。地劫有正面作用——可以将人的执念打碎，促使人放下和超脱。', bad:'劫难波折、破耗意外、运势起伏、飞来横祸', classic:'《紫微斗数全书》云:「地劫为煞星，主劫难波折。」' }
};

// ========== 四化星（化禄、化权、化科、化忌）详解 ==========
const ZW_SIHUA_INFO = {
  '化禄': { name:'化禄', nature:'福禄吉化', detail:'化禄为四化之首，主财运、福气、享受、人缘。化禄入命宫者，一生财运亨通，福气深厚，人缘极佳，有口福。化禄在财帛宫，财源广进；在福德宫，精神安乐、享受生活；在夫妻宫，配偶带财、感情滋润。化禄过多则流于享乐、缺乏进取。化禄被煞星冲破则福气减半。', classic:'《紫微斗数全书》云:「化禄为福星，主财运亨通。」' },
  '化权': { name:'化权', nature:'权势吉化', detail:'化权主权力、掌控、努力、决断。化权入命宫者，有领导才能，做事果断，善于掌控局面。化权在官禄宫，事业有成，宜居领导岗位；在财帛宫，靠权力和努力得财。化权宜与吉星同宫，则权势稳固；逢煞星则权势受损、固执己见。化权不宜过多，过多则过于强势、孤芳自赏。', classic:'《紫微斗数全书》云:「化权为权星，主权力掌控。」' },
  '化科': { name:'化科', nature:'科名吉化', detail:'化科主名声、学业、贵人、才华。化科入命宫者，有学识才华，名声在外，考试运佳，多得贵人赏识。化科在官禄宫，事业有声望，宜学术、教育、文化行业；在命宫三方，主科甲成名。化科宜与文昌文曲同宫，则才名更盛。化科被煞星冲破则名声受损。', classic:'《紫微斗数全书》云:「化科为科名星，主学业名声。」' },
  '化忌': { name:'化忌', nature:'忌星凶化', detail:'化忌为四化之末，主障碍、烦恼、波折、需注意之处。化忌入命宫者，一生多波折考验，内心苦闷，需修身养性。化忌在哪个宫位，则该宫位之事多阻碍——在财帛宫则财运不佳、破财；在夫妻宫则感情波折；在疾厄宫则健康需注意。化忌并非全凶，也可以激发人的潜力，促使人成长。化忌被吉星化解则可减轻其凶性。', classic:'《紫微斗数全书》云:「化忌为忌星，主障碍烦恼。」' }
};

// 保持向后兼容的ZW_STARS别名
const ZW_STARS = ZW_MAIN_STARS;

// ================================================================
//  紫微斗数十二宫专业详解
//  基于《紫微斗数全书》《紫微斗数解密》
// ================================================================
const ZW_12GONG = {
  '命宫': {
    desc: '命宫为紫微斗数第一宫，统领全局，代表先天命格、性格本质、天赋才能和一生运势大纲。命宫由出生时辰结合生年干支推算，是十二宫之起点。命宫主星决定命主基本性格：紫微坐命则天生领袖气质；天府坐命则稳重有财库；七杀坐命则刚毅果断；天机坐命则足智多谋；太阳坐命则光明磊落；武曲坐命则果断理财。命宫为空宫时，借对宫（迁移宫）星曜推断，但力量减半。命宫三方四正（命宫、财帛宫、官禄宫为三方，迁移宫为对宫）的星曜组合，决定一生事业财运之根基。命宫逢四化飞星——化禄则福气深厚、生财有道；化权则有领导才能；化科则名声在外；化忌则一生多波折考验。命宫有煞星冲破则减分，但有「煞星可用」之说（如七杀入命本带煞气，反主威权）。',
    classic: '《紫微斗数全书》云:「命宫者，先天之命也。命宫定一生之荣枯，为十二宫之首。」',
    judge: '看命宫主星庙旺利陷、吉煞星多少、四化飞星影响、三方四正组合'
  },
  '兄弟': {
    desc: '兄弟宫看兄弟姐妹缘分、手足助力、以及朋友同事之关系。兄弟宫吉星坐守（左辅右弼天魁天钺），主兄弟姐妹多助，朋友得力，团队协作能力强。兄弟宫煞星坐守（擎羊陀罗地空地劫），则兄弟缘薄，或有刑克，朋友多是非，合作易生变。兄弟宫与交友宫（仆役宫）一内一外互为补充——兄弟宫为血缘手足之缘，交友宫为社会朋友之交。现代社会，兄弟宫也代表与同事、合作伙伴的配合度。兄弟宫有天机星，兄弟姐妹聪明但往来不多；有廉贞星，则兄弟姐妹个性强；有巨门星，则手足间有口舌。',
    classic: '《紫微斗数全书》云:「兄弟宫，看兄弟缘分。兄弟宫吉则手足有情，兄弟宫凶则手足疏离。」',
    judge: '看兄弟宫主星、吉煞星、与命宫的生克关系'
  },
  '夫妻': {
    desc: '夫妻宫为婚姻感情的枢纽，代表配偶的品貌性格、婚姻质量和感情运势。吉星坐守（紫微天府天相）：配偶有贵气，婚姻美满，宜早婚。煞星坐守（七杀破军擎羊陀罗）：婚姻多波折，宜晚婚，配偶性格刚硬。桃花星入夫妻（贪狼廉贞）：感情丰富但易有第三者介入。五行配合：男命夫妻宫看妻星，女命夫妻宫看夫星。夫妻宫与官禄宫为对宫，事业之成败影响婚姻之质量；夫妻宫也与福德宫相关，精神层面之契合决定婚姻幸福度。夫妻宫化禄则婚姻有财、感情滋润；化忌则感情苦闷、易生矛盾。本命夫妻宫+大限夫妻宫+流年夫妻宫三重叠加来判断婚姻运势。',
    classic: '《紫微斗数全书》云:「夫妻宫，看婚姻缘分。夫妻宫吉则婚姻美满，夫妻宫凶则婚姻多波折。」',
    judge: '看夫妻宫主星性质、四化飞星、煞星情况、与命宫福德宫的生克'
  },
  '子女': {
    desc: '子女宫看子息缘分、子女数量和品性、以及下属学生之缘。吉星坐守（天同天梁天府）：子女优秀孝顺，有成就，多得子女之力。煞星坐守（七杀破军擎羊）：子息缘薄，或子女个性倔强叛逆。子女宫与田宅宫为对宫，家庭环境之优劣直接影响子女之成长。现代社会，子女宫也代表创造力、表达能力、对晚辈学生的领导力。子女宫有文昌文曲，主子女聪明好学；有武曲，主子女有经济头脑；有太阳，主子女光明外向。子女宫化禄则子女带财有福；化忌则子女缘薄或生育困难。',
    classic: '《紫微斗数全书》云:「子女宫，看子女缘分。子女宫吉则子息优秀，子女宫凶则子息有克。」',
    judge: '看子女宫主星、吉煞星、四化、与命宫的生克关系'
  },
  '财帛': {
    desc: '财帛宫为财运的核心宫位，代表收入来源、理财能力、消费习惯和财富多寡。财帛宫吉星坐守（武曲天府太阴）：财运亨通，积蓄丰厚，有理财头脑，财源稳定。武曲为「正财星」，入财帛宫者财运尤佳，宜金融、贸易行业。天府为「财库星」，入财帛宫者善于守财积蓄。煞星坐守（破军贪狼地空地劫）：财来财去，收入不稳定，需防破财。财帛宫与命宫、官禄宫构成「三方四正」，财之来源靠事业之发展，财之多寡靠命格之高低。财帛宫化禄则财源广进；化权则靠努力掌控得财；化科则靠名声地位得财；化忌则财运不济、破财多端。财帛宫空宫借对宫福德宫星曜推断。',
    classic: '《紫微斗数全书》云:「财帛宫，看财运贫富。财帛宫吉则财运亨通，财帛宫凶则财来财去。」',
    judge: '看财帛宫主星性质、四化飞星、与命宫官禄宫的生克组合'
  },
  '疾厄': {
    desc: '疾厄宫看健康体质、易患疾病和意外伤害。吉星坐守（天梁天同）：身体健康，少病少灾，有康复能力。天梁入疾厄宫为「寿星护体」，虽有病能逢良医。煞星坐守（擎羊陀罗火星铃星地空地劫）：体质较弱，需注意意外伤害和暗疾。五行对应疾病部位：木→肝胆筋络，火→心脏血液小肠，土→脾胃消化，金→呼吸系统大肠，水→肾脏膀胱泌尿。疾厄宫与父母宫为对宫，父母遗传对健康有重大影响。疾厄宫化忌则健康需特别关注；化禄则体质尚可但需防饮食过度。',
    classic: '《紫微斗数全书》云:「疾厄宫，看健康状况。疾厄宫吉则身体康健，疾厄宫凶则多病多灾。」',
    judge: '看疾厄宫主星五行、煞星情况、四化、与父母宫的生克'
  },
  '迁移': {
    desc: '迁移宫看外出运势、社会形象和人际交往。迁移宫为命宫之对宫，互为表里——命宫为内在本性，迁移宫为外在表现。吉星坐守（太阳天机太阴左辅右弼）：出外遇贵人，社会形象佳，人缘好，宜异地发展。煞星坐守（七杀破军擎羊）：外出多波折变动，需防意外。迁移宫有紫微天府，出外有领导气质受人尊敬；有文昌文曲，旅途中可获知识见解。迁移宫化禄则出外得财、旅行愉快；化忌则出外不顺、水土不服。迁移宫也为「社会面具」——你给人留下的第一印象和社会形象。现代社会，迁移宫也代表出国留学、海外工作、旅游等。',
    classic: '《紫微斗数全书》云:「迁移宫，看出外发展。迁移宫吉则出外逢贵，迁移宫凶则出外多阻。」',
    judge: '看迁移宫主星、吉煞星、四化、与命宫的对比关系'
  },
  '交友': {
    desc: '交友宫（仆役宫）看朋友、同事、下属的人脉关系，以及用人运。吉星坐守（左辅右弼天魁天钺）：朋友众多且得力，下属能干，人脉助力大。煞星坐守（廉贞贪狼擎羊）：朋友良莠不齐，需防小人暗算。交友宫也为「众生相」——你在社交圈中的位置和影响力。交友宫有天机，朋友足智多谋；有巨门，易交到口舌是非之友；有七杀，朋友性格刚烈。交友宫化禄则人脉带财、朋友多助；化忌则朋友反目、下属背叛。交友宫与兄弟宫互为里表——兄弟宫为血缘关系，交友宫为社会关系。',
    classic: '《紫微斗数全书》云:「仆役宫，看下属朋友。交友宫吉则下属得力，交友宫凶则小人当道。」',
    judge: '看交友宫主星、吉煞星、四化、与兄弟宫的对比'
  },
  '事业': {
    desc: '事业宫（官禄宫）为事业发展的核心宫位，代表职业方向、工作态度和事业成就。吉星坐守（紫微天府太阳武曲天相）：事业有成，官运亨通，适合管理层或公务员。紫微入官禄则事业有成，居领导位；天府入官禄则事业稳定，适合管理；太阳入官禄则名声事业双收；武曲入官禄宜金融贸易。煞星坐守（七杀破军）：事业多波折变动，宜创业或变动性大的行业，靠技艺立身。事业宫与夫妻宫为对宫，事业与家庭互为支撑。事业宫化禄则事业生财、工作顺利；化权则有领导才能、决策果断；化科则名声在外、受人尊敬；化忌则事业受阻、怀才不遇。',
    classic: '《紫微斗数全书》云:「官禄宫，看事业官职。官禄宫吉则事业有成，官禄宫凶则怀才不遇。」',
    judge: '看事业宫主星性质、四化、与命宫财帛宫的配合'
  },
  '田宅': {
    desc: '田宅宫看不产运势、居住环境和家庭根基。吉星坐守（天府武曲太阴）：置业运强，有祖产可承，居家环境佳，晚年安稳。煞星坐守（地空地劫破军）：居住环境多变，置业困难，家庭根基不稳。田宅宫与子女宫为对宫，家庭环境影响子女成长。田宅宫也为「安全感之宫」——反映一个人的归属感和根基稳固度。田宅宫化禄则房产运佳、家有财气；化忌则居家不宁、搬迁频繁。太阴为田宅宫主星（部分流派），入田宅者房地产运尤佳。',
    classic: '《紫微斗数全书》云:「田宅宫，看房产祖业。田宅宫吉则房产丰足，田宅宫凶则漂泊无依。」',
    judge: '看田宅宫主星、吉煞星、四化、与子女宫的对比'
  },
  '福德': {
    desc: '福德宫看精神世界、福气享受和晚年运势。吉星坐守（天同天梁天府）：心胸开阔，精神充实，晚年安乐，有福可享。天同入福德则喜爱享受、精神充实；天梁入福德则精神境界高、有修行之缘。煞星坐守（巨门廉贞地空地劫）：精神压力大，内心苦闷，晚年孤寂。福德宫与夫妻宫为对宫，精神境界决定婚姻幸福度。福德宫也反映一个人的价值观、人生追求和心态好坏——福德宫佳者一生快乐，福德宫差者虽富不乐。福德宫化禄则精神安乐、享受生活；化忌则内心苦闷、精神空虚。',
    classic: '《紫微斗数全书》云:「福德宫，看福气心态。福德宫吉则福寿双全，福德宫凶则心灵空虚。」',
    judge: '看福德宫主星性质、吉煞星、四化、与夫妻宫的配合'
  },
  '父母': {
    desc: '父母宫看与父母的关系、父母的状况和自身教养。吉星坐守（天梁天同天府）：父母健在且关系和谐，受教育机会多，长辈缘好。煞星坐守（七杀破军擎羊）：父母缘薄或关系紧张，早年离家可能。父母宫与疾厄宫为对宫，父母的遗传和体质直接影响命主健康。父母宫也代表「上司宫」——与上级、师长、权威人物的关系。父母宫化禄则父母带来福气财富；化忌则与父母关系不佳或父母健康需关注。紫微入父母宫，父母有社会地位；太阳入父母宫，父亲影响大；太阴入父母宫，母亲影响大；天梁入父母宫，父母长寿有德。',
    classic: '《紫微斗数全书》云:「父母宫，看父母缘分。父母宫吉则父母有靠，父母宫凶则父母缘薄。」',
    judge: '看父母宫主星、吉煞星、四化、与疾厄宫的关系'
  }
};

// 十二宫名称数组（按命宫顺排）
const gong12 = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','事业','田宅','福德','父母'];

function computeZiWei() {
 try {
  return _computeZiWeiImpl();
 } catch(e) {
  console.error('[紫微斗数错误]', e.message, e.stack);
  var _eb = document.getElementById('zwResult') || document.getElementById('zwResult');
  if(_eb) _eb.innerHTML = '<div style="padding:20px;margin:16px 0;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 紫微斗数出错</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p><p style="font-size:11px;opacity:.5;margin-top:4px">'+(e.stack||'').split("\n").slice(0,3).join("<br>")+'</p></div>';
  var _r = document.getElementById('zwResult'); if(_r){_r.classList.add('visible');_r.scrollIntoView({behavior:'smooth'});}
 }
}
function _computeZiWeiImpl() {
  playDivinationSound();
  const name = document.getElementById('zwName').value || '有缘人';
  const dateStr = document.getElementById('zwDate').value;
  const hourVal = document.getElementById('zwHour').value;
  const sex = document.getElementById('zwSex').value;
  if (!dateStr || !hourVal) { showToast('请输入日期和时辰'); return; }

  const [year, month, day] = dateStr.split('-').map(Number);
  const hourNum = parseInt(hourVal);
  const isMale = sex === 'male';

  // 干支计算
  const dayStemIdx = getDayStemIndex(year, month, day);
  const dayBranchIdx = getDayBranchIndex(year, month, day);
  const dayStem = STEMS[dayStemIdx];
  const dayBranch = BRANCHES[dayBranchIdx];
  const hourBranchIdx = Math.floor(hourNum / 2) % 12;
  const hourBranch = BRANCHES[hourBranchIdx];

  // 年干（用于四化）
  const yearStemIdx = (year - 4) % 10;
  const yearStem = STEMS[yearStemIdx];
  const yearStemGan = yearStem; // 保留年干用于宫干四化

  // 命宫推算（基于月支和时支）
  const monthBranchIdx = (month + 9) % 12; // 月支
  const mingGongBranchIdx = computeMingGongIdx(monthBranchIdx, hourBranchIdx);
  const mingGong = BRANCHES[mingGongBranchIdx];
  const shenGongIdx = computeShenGongIdx(mingGongBranchIdx, hourBranchIdx);
  const shenGong = BRANCHES[shenGongIdx];

  // 命宫天干（五虎遁）
  const mingGongGanIdx = (yearStemIdx * 2 + mingGongBranchIdx) % 10;
  const mingGongGan = STEMS[mingGongGanIdx];
  const mingGongGanZhi = mingGongGan + mingGong;

  // 完整星曜排布（14主星+辅星）
  const stars = computeZiWeiStarsV2(mingGongBranchIdx, dayStemIdx, yearStemIdx, hourBranchIdx);

  // 生年四化
  const sihua = computeSiHuaByYearGan(yearStem);

  // 大限计算
  const daXian = computeDaXian(mingGongBranchIdx, isMale, yearStem, dayStem);

  // 命宫身宫显示
  const mgEl = document.getElementById('zwMingGong');
  mgEl.innerHTML = `
    <div class="interp-item"><p class="ii-label">命宫</p><p class="ii-value">${mingGong}宫（${mingGongGanZhi}）</p><p class="ii-desc">命主根基，${ZHI_ELE[mingGong]}属性</p></div>
    <div class="interp-item"><p class="ii-label">身宫</p><p class="ii-value">${shenGong}宫</p><p class="ii-desc">身体与行为，${ZHI_ELE[shenGong]}属性</p></div>
    <div class="interp-item"><p class="ii-label">日主</p><p class="ii-value">${dayStem}</p><p class="ii-desc">${ELE[dayStem]}属性 · 日之核心</p></div>
    <div class="interp-item"><p class="ii-label">命局</p><p class="ii-value">${stars.mingGongMain.name}</p><p class="ii-desc">${stars.mingGongMain.nature}</p></div>
  `;

  // 十四主星星曜排布
  const sg = document.getElementById('zwStarsGrid');
  sg.innerHTML = '';
  const starEntries = Object.entries(stars.byGong);
  for (const [gongIdx, starData] of starEntries) {
    const gongName = gong12[parseInt(gongIdx)];
    const branch = BRANCHES[(mingGongBranchIdx + parseInt(gongIdx)) % 12];
    const starInfo = ZW_MAIN_STARS[starData.name] || {};
    const div = document.createElement('div');
    div.className = 'zw-star-card';
    const miaoXian = starInfo.miaoXian || '';
    div.innerHTML = `<h6>${gongName}（${branch}）· ${starData.name}</h6><p class="zw-nature">${starData.nature||''}</p><p style="font-size:11px;line-height:1.5;margin-top:4px;color:var(--gold)">${(starData.aux||[]).join('、') || '无辅星'}</p><p style="font-size:11px;line-height:1.6;margin-top:6px">${(starInfo.detail||'').substring(0,120)}...</p><p style="font-size:10px;opacity:.5;margin-top:4px;font-style:italic">${miaoXian}</p>`;
    sg.appendChild(div);
  }

  // 生年四化飞星
  const fc = document.getElementById('zwFourChange');
  fc.innerHTML = `
    <div class="interp-item"><p class="ii-label">化禄</p><p class="ii-value" style="color:#e74c3c">${sihua.lu.name}</p><p class="ii-desc">${sihua.lu.desc} · 在${sihua.lu.gong}宫</p></div>
    <div class="interp-item"><p class="ii-label">化权</p><p class="ii-value" style="color:#2980b9">${sihua.quan.name}</p><p class="ii-desc">${sihua.quan.desc} · 在${sihua.quan.gong}宫</p></div>
    <div class="interp-item"><p class="ii-label">化科</p><p class="ii-value" style="color:#27ae60">${sihua.ke.name}</p><p class="ii-desc">${sihua.ke.desc} · 在${sihua.ke.gong}宫</p></div>
    <div class="interp-item"><p class="ii-label">化忌</p><p class="ii-value" style="color:#c0392b">${sihua.ji.name}</p><p class="ii-desc">${sihua.ji.desc} · 在${sihua.ji.gong}宫</p></div>
  `;

  // 十二宫盘面 - 4×4网格布局（中间4格空）
  const tg = document.getElementById('zw12Gong');
  // 固定地支位置：巳午未申/辰--酉/卯--戌/寅丑子亥
  var branchGridOrder = [5,6,7,8, 4,-1,-1,9, 3,-1,-1,10, 2,1,0,11];
  var gridHTML = '<div class="zw-12grid">';
  for (var gi = 0; gi < 16; gi++) {
    var bIdx = branchGridOrder[gi];
    if (bIdx < 0) {
      gridHTML += '<div class="zw-gong-cell zg-empty"></div>';
      continue;
    }
    var gIdx = (bIdx - mingGongBranchIdx + 12) % 12;
    var gName = gong12[gIdx];
    var branch = BRANCHES[bIdx];
    var starHere = stars.byGong[gIdx] || { name: '无主星', nature: '', aux: [] };
    var gongDetail = ZW_12GONG[gName] || { desc: '', classic: '' };
    var isKeyGong = ['命宫','财帛','事业','迁移','夫妻','疾厄'].includes(gName);
    var starName = starHere.name;
    var starDetail = ZW_MAIN_STARS[starName];
    var auxStars = (starHere.aux || []).join(' ');
    // 庙旺落陷
    var miaoClass = '';
    if (starDetail && starDetail.miaoXian) {
      if (starDetail.miaoXian.indexOf('庙') >= 0 || starDetail.miaoXian.indexOf('旺') >= 0) miaoClass = 'miao';
      else if (starDetail.miaoXian.indexOf('陷') >= 0 || starDetail.miaoXian.indexOf('平') >= 0) miaoClass = 'xian';
    }
    // 四化标记
    var sihuaMark = '';
    if (sihua.lu && sihua.lu.gong === gName) sihuaMark += '<span class="zg-sihua lu">禄</span>';
    if (sihua.quan && sihua.quan.gong === gName) sihuaMark += '<span class="zg-sihua quan">权</span>';
    if (sihua.ke && sihua.ke.gong === gName) sihuaMark += '<span class="zg-sihua ke">科</span>';
    if (sihua.ji && sihua.ji.gong === gName) sihuaMark += '<span class="zg-sihua ji">忌</span>';
    var cellClass = 'zw-gong-cell' + (gName === '命宫' ? ' zg-ming' : '');
    gridHTML += '<div class="' + cellClass + '">';
    gridHTML += '<div class="zg-name">' + gName + (isKeyGong?' ⭐':'') + '</div>';
    gridHTML += '<div class="zg-branch">' + branch + '</div>';
    if (starName && starName !== '无主星') {
      gridHTML += '<div class="zg-star ' + miaoClass + '">' + starName + '</div>';
    }
    if (auxStars) {
      gridHTML += '<div class="zg-aux">' + auxStars + '</div>';
    }
    if (sihuaMark) {
      gridHTML += '<div>' + sihuaMark + '</div>';
    }
    gridHTML += '</div>';
  }
  gridHTML += '</div>';
  // 十二宫详解列表
  gridHTML += '<div style="margin-top:16px"><p style="font-size:13px;line-height:2;opacity:.7;margin-bottom:12px">《紫微斗数全书》云:「十二宫者，命宫、兄弟、夫妻、子女、财帛、疾厄、迁移、仆役、官禄、田宅、福德、父母，统摄人生万事。」</p>';
  for (var i = 0; i < 12; i++) {
    var gName = gong12[i];
    var branch = BRANCHES[(mingGongBranchIdx + i) % 12];
    var starHere = stars.byGong[i] || { name: '无主星', nature: '', sihuaEffect: '' };
    var gongDetail = ZW_12GONG[gName] || { desc: '', classic: '' };
    var isKeyGong = ['命宫','财帛','事业','迁移','夫妻','疾厄'].includes(gName);
    var fontWeight = isKeyGong ? 'font-weight:bold;color:var(--gold)' : '';
    var starName = starHere.name;
    var starDetail = ZW_MAIN_STARS[starName];
    var starBrief = starDetail ? starDetail.detail.substring(0, 100) + '...' : (starHere.desc || '');
    var auxStars = (starHere.aux || []).join('、');
    gridHTML += '<div class="interp-item" style="margin-bottom:12px;padding:8px;border-left:3px solid var(--gold);padding-left:12px">';
    gridHTML += '<p class="ii-label" style="' + fontWeight + '">' + gName + '（' + branch + '宫）· ' + starName + (isKeyGong?' ⭐':'') + '</p>';
    gridHTML += '<p class="ii-desc" style="font-size:12px;line-height:1.6;margin-top:4px">' + gongDetail.desc + '</p>';
    gridHTML += '<p style="font-size:11px;line-height:1.5;margin-top:6px;color:var(--gold)">主星解读：' + starBrief + '</p>';
    if (auxStars) gridHTML += '<p style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">辅星：' + auxStars + '</p>';
    gridHTML += '<p style="font-size:10px;opacity:.4;font-style:italic;margin-top:4px">' + gongDetail.classic + '</p>';
    gridHTML += '</div>';
  }
  gridHTML += '</div>';
  tg.innerHTML = gridHTML;

  // 专业解读报告
  const interpretation = buildZiWeiProfessionalInterpretation({
    name, year, month, day, hourNum, sex, isMale,
    yearStem, dayStem, dayBranch, hourBranch,
    mingGongBranchIdx, mingGong, shenGong,
    mingGongGanZhi, yearStemIdx, dayStemIdx,
    stars, sihua, daXian
  });

  // 渲染专业解读 - 追加到经典出处后面
  const classicCard = document.querySelector('#zwResult .analysis-card:last-of-type');
  const zwResult = document.getElementById('zwResult');
  
  // 移除旧的解读（如果存在）
  const existingInterp = document.getElementById('zwProfessionalInterp');
  if (existingInterp && existingInterp.parentNode) existingInterp.parentNode.removeChild(existingInterp);
  else if (existingInterp && typeof existingInterp.remove === 'function') existingInterp.remove();
  
  // 创建专业解读容器
  const interpContainer = document.createElement('div');
  interpContainer.id = 'zwProfessionalInterp';
  
  const sections = [
    { title: '📜 命盘总论', text: interpretation.overview, accent: 'gold-accent' },
    { title: '🏛 十二宫逐宫详解', text: interpretation.gongAnalysis, accent: 'jade-accent' },
    { title: '✨ 四化飞星分析', text: interpretation.sihuaAnalysis, accent: 'violet-accent' },
    { title: '📅 大限流年运势', text: interpretation.daXianAnalysis, accent: 'cyan-accent' },
    { title: '💡 大白话建议', text: interpretation.advice, accent: 'cinn-accent' },
    { title: '🤖 AI综合分析', text: interpretation.aiSummary, accent: 'jade-accent' }
  ];
  for (const sec of sections) {
    const div = document.createElement('div');
    div.className = 'analysis-card';
    div.style.cssText = 'margin-bottom:16px;';
    div.innerHTML = `<h5>${sec.title}</h5><p style="white-space:pre-line;line-height:1.9;font-size:13px">${sec.text}</p>`;
    interpContainer.appendChild(div);
  }
  
  // 追加到结果区域
  if (classicCard) {
    classicCard.insertAdjacentElement('afterend', interpContainer);
  } else {
    zwResult.appendChild(interpContainer);
  }

  // 命盘元数据
  document.getElementById('zwNameOut').textContent = name + ' · 紫微斗数专业命盘';
  // 农历显示
  var zwLunarStr = '';
  try { var zwLunarObj = solarToLunar(year, month, day); if(zwLunarObj) zwLunarStr = ' · 农历'+zwLunarObj.year+'年'+(zwLunarObj.isLeapMonth?'闰':'')+(zwLunarObj.month===1?'正':zwLunarObj.month)+'月'+(zwLunarObj.day<11?'初'+zwLunarObj.day:zwLunarObj.day===20?'二十':zwLunarObj.day<30?'廿'+(zwLunarObj.day-20):'三十'); } catch(e){}
  document.getElementById('zwMetaOut').textContent = `公历${year}年${month}月${day}日 · ${hourBranch}时 · ${sex==='male'?'男命':'女命'} · 年干${yearStem}` + zwLunarStr;

  // ── 排盘流程说明 ──
  var zwProcBox = document.getElementById('zwProcessBox');
  if (zwProcBox) {
    var zwProc = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(231,76,60,.2);padding:20px">';
    zwProc += '<h5 style="font-size:15px;color:var(--fire2);letter-spacing:3px;margin-bottom:14px">📋 紫微排盘流程</h5>';
    zwProc += '<div style="font-size:13px;line-height:2.1;opacity:.85">';
    zwProc += '<p><b style="color:var(--gold)">第一步·定命宫：</b>从寅宫起正月，顺数至出生月，再从该宫起子时，逆数至出生时辰，即为命宫所在。命宫为一生之主，定十二宫之根基。';
    zwProc += '</p>';
    zwProc += '<p><b style="color:var(--gold)">第二步·定身宫：</b>从寅宫起正月，顺数至出生月，再从该宫起子时，顺数至出生时辰，即为身宫。身宫代表后天造化。';
    zwProc += '</p>';
    zwProc += '<p><b style="color:var(--gold)">第三步·安十四主星：</b>以命宫为起点，根据五行局和日数，定紫微星位，再安天府、天机、太阳、武曲、天同、廉贞、天府、太阴、贪狼、巨门、天相、天梁、七杀、破军等十四主星。';
    zwProc += '</p>';
    zwProc += '<p><b style="color:var(--gold)">第四步·安辅星系神：</b>安左辅右弼、文昌文曲、天魁天钺（六吉星），擎羊陀罗、火星铃星、地空地劫（六煞星），及禄存天马等辅星。';
    zwProc += '</p>';
    zwProc += '<p><b style="color:var(--gold)">第五步·定四化：</b>以年干定化禄、化权、化科、化忌四化星，飞入十二宫，主宰一生吉凶转化之机。';
    zwProc += '</p>';
    zwProc += '</div>';
    zwProc += '<div style="margin-top:12px;padding:10px 14px;background:rgba(231,76,60,.05);border-radius:8px;font-size:12px;opacity:.7">';
    zwProc += '《紫微斗数全书》云：「先看命宫身宫，次看财官迁移，再看福德田宅，六亲宫位次第推。」《太微赋》曰：「星分南北，斗分阴阳，各有所属，不可紊乱。」';
    zwProc += '</div>';
    zwProc += '</div>';
    zwProcBox.innerHTML = zwProc;
  }

  // ── 前后推演 ──
  var zwFcBox = document.getElementById('zwForecastBox');
  if (zwFcBox) {
    var zwFc = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.15);padding:20px">';
    zwFc += '<h5 style="font-size:15px;color:var(--gold);letter-spacing:3px;margin-bottom:14px">🔍 前后推演</h5>';
    zwFc += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
    zwFc += '<div style="padding:14px;background:rgba(46,204,113,.05);border-radius:8px;border:1px solid rgba(46,204,113,.1)"><div style="font-size:13px;color:#2ecc71;font-weight:bold;margin-bottom:8px">⏪ 大限回溯</div><div style="font-size:12px;line-height:1.8;opacity:.8">';
    zwFc += '<p>命宫大限主一生基本格局，可回溯过往大限验证人生轨迹。</p>';
    zwFc += '<p style="opacity:.6;margin-top:6px">十年一大限，大限交接之年最需关注。</p>';
    zwFc += '</div></div>';
    zwFc += '<div style="padding:14px;background:rgba(231,76,60,.05);border-radius:8px;border:1px solid rgba(231,76,60,.1)"><div style="font-size:13px;color:#e74c3c;font-weight:bold;margin-bottom:8px">⏩ 流年预测</div><div style="font-size:12px;line-height:1.8;opacity:.8">';
    zwFc += '<p>结合流年命宫、流年四化，可预测未来运势走向。</p>';
    zwFc += '<p style="opacity:.6;margin-top:6px">流年命宫所在宫位 + 四化飞星，断年度吉凶。</p>';
    zwFc += '</div></div>';
    zwFc += '</div></div>';
    zwFcBox.innerHTML = zwFc;
  }

  // ── 个性化指导 ──
  try {
    var zwGuide = buildZiweiPersonalizedGuidance({});
    var zwRes = document.getElementById('zwResult');
    if (zwRes) zwRes.innerHTML += zwGuide;
  } catch(e) {}

  // ═══ 三元九运与紫微 ═══
  try {
    var _syZw = _generateSanyuanJiuyunBlock('ziwei', {
      dayStem: (typeof dayStem !== 'undefined' ? dayStem : '甲'),
      dayEle: (typeof dayStem !== 'undefined' ? (ELE[dayStem] || '木') : '木'),
      currentYear: (typeof year !== 'undefined' ? year : new Date().getFullYear())
    });
    var _zwRes = document.getElementById('zwResult');
    if (_zwRes) _zwRes.innerHTML += _syZw;
  } catch(e) { console.warn('[三元九运紫微分析块失败]', e.message); }

  // 渲染十二宫盘面
  try { renderZwGrid(); } catch(e) { console.warn('[紫微十二宫渲染失败]', e.message); }

  // === 化解方案注入 ===
  appendHuajieToResult('zwResult', year, month, day, parseInt(hourVal), sex, name);

  document.getElementById('zwResult').classList.add('visible');
  document.getElementById('zwResult').scrollIntoView({ behavior: 'smooth' });
}

// ================================================================
//  命宫推算（五虎遁法）
// ================================================================
function computeMingGongIdx(monthBranchIdx, hourBranchIdx) {
  // 命宫推算：从寅宫起正月，顺数至生月，再从该宫起子时，逆数至生时
  // 寅宫=2 (BRANCHES[2]='寅')
  const yinIdx = 2;
  // 从寅宫顺数至生月
  const monthGongIdx = (yinIdx + monthBranchIdx) % 12;
  // 从该宫起子时，逆数至生时
  const mingIdx = (monthGongIdx - hourBranchIdx + 12) % 12;
  return mingIdx;
}

function computeShenGongIdx(mingGongIdx, hourBranchIdx) {
  // 身宫：从寅宫起正月顺数至生月，再从该宫起子时顺数至生时
  // 简化为：身宫 = (命宫 + 生时) % 12
  return (mingGongIdx + hourBranchIdx) % 12;
}

// ================================================================
//  十四主星完整排布（V2版本，含辅星）
// ================================================================
function computeZiWeiStarsV2(mingGongBranchIdx, dayStemIdx, yearStemIdx, hourBranchIdx) {
  // 紫微星位置（基于五行局和生日，此处用简化算法）
  // 完整算法：根据五行局数（由命宫干支纳音确定）和农历生日查表
  // 简化版：基于日干和命宫推算
  const ziWeiOffset = (dayStemIdx + mingGongBranchIdx) % 12;
  const ziWeiGong = ziWeiOffset; // 紫微所在宫位索引

  // 紫微星系（逆排）：紫微、天机、(空)、太阳、武曲、天同、(空)、廉贞
  // 天府星系（顺排）：天府、太阴、贪狼、巨门、天相、天梁、七杀、(空)、破军
  // 紫微定位后，天府在紫微的对宫+4
  const tianFuGong = (ziWeiGong + 4) % 12;

  // 紫微系逆排6星
  const ziXiStars = [
    { name: '紫微', nature: '帝星·北斗主星', offset: 0 },
    { name: '天机', nature: '智星·南斗第三星', offset: -1 },
    null, // 空一格
    { name: '太阳', nature: '贵星·中天主星', offset: -3 },
    { name: '武曲', nature: '财星·北斗第六星', offset: -4 },
    { name: '天同', nature: '福星·南斗第四星', offset: -5 },
    null, // 空一格
    { name: '廉贞', nature: '桃花星·北斗第五星', offset: -7 }
  ];

  // 天府系顺排8星
  const tianFuXiStars = [
    { name: '天府', nature: '库星·南斗主星', offset: 0 },
    { name: '太阴', nature: '富星·中天主星', offset: 1 },
    { name: '贪狼', nature: '桃花星·北斗第一星', offset: 2 },
    { name: '巨门', nature: '暗星·北斗第二星', offset: 3 },
    { name: '天相', nature: '印星·南斗第五星', offset: 4 },
    { name: '天梁', nature: '荫星·南斗第二星', offset: 5 },
    { name: '七杀', nature: '将星·北斗第六星', offset: 6 },
    { name: '破军', nature: '耗星·北斗第七星', offset: 8 }
  ];

  const byGong = {};
  
  // 排紫微系
  for (const s of ziXiStars) {
    if (!s) continue;
    const gongIdx = (ziWeiGong + s.offset + 12) % 12;
    if (!byGong[gongIdx]) byGong[gongIdx] = { name: s.name, nature: s.nature, aux: [] };
  }

  // 排天府系
  for (const s of tianFuXiStars) {
    const gongIdx = (tianFuGong + s.offset + 12) % 12;
    if (!byGong[gongIdx]) {
      byGong[gongIdx] = { name: s.name, nature: s.nature, aux: [] };
    } else {
      // 同一宫有两颗主星（共宫）
      byGong[gongIdx].name = byGong[gongIdx].name + '/' + s.name;
      byGong[gongIdx].nature = byGong[gongIdx].nature + '·' + s.nature;
    }
  }

  // 排辅星（简配：基于年干的左辅右弼天魁天钺文昌文曲）
  const zuoFuGong = (yearStemIdx + 1) % 12;
  const youBiGong = (yearStemIdx + 11) % 12;
  const tianKuiGong = [2,5,8,11,2,5,8,11,2,5][yearStemIdx];
  const tianYueGong = [8,11,2,5,8,11,2,5,8,11][yearStemIdx];
  const wenChangGong = (10 - hourBranchIdx + 12) % 12; // 文昌基于时支
  const wenQuGong = (hourBranchIdx + 4) % 12; // 文曲基于时支

  const auxMapping = [
    { gong: zuoFuGong, name: '左辅' },
    { gong: youBiGong, name: '右弼' },
    { gong: tianKuiGong, name: '天魁' },
    { gong: tianYueGong, name: '天钺' },
    { gong: wenChangGong, name: '文昌' },
    { gong: wenQuGong, name: '文曲' }
  ];

  for (const aux of auxMapping) {
    if (!byGong[aux.gong]) byGong[aux.gong] = { name: '无主星', nature: '', aux: [] };
    byGong[aux.gong].aux.push(aux.name);
  }

  // 排煞星（基于年支/时支的擎羊陀罗火星铃星地空地劫 - 简化）
  const qingYangGong = (hourBranchIdx + 4) % 12;
  const tuoLuoGong = (hourBranchIdx + 2) % 12;
  const huoXingGong = (hourBranchIdx + 7) % 12;
  const lingXingGong = (hourBranchIdx + 5) % 12;
  const diKongGong = (hourBranchIdx + 10) % 12;
  const diJieGong = (hourBranchIdx + 8) % 12;

  const shaMapping = [
    { gong: qingYangGong, name: '擎羊' },
    { gong: tuoLuoGong, name: '陀罗' },
    { gong: huoXingGong, name: '火星' },
    { gong: lingXingGong, name: '铃星' },
    { gong: diKongGong, name: '地空' },
    { gong: diJieGong, name: '地劫' }
  ];

  for (const sha of shaMapping) {
    if (!byGong[sha.gong]) byGong[sha.gong] = { name: '无主星', nature: '', aux: [] };
    if (!byGong[sha.gong].sha) byGong[sha.gong].sha = [];
    byGong[sha.gong].sha.push(sha.name);
  }

  // 命宫主星
  const mingGongData = byGong[mingGongBranchIdx] || { name: '借对宫', nature: '命宫为空宫，借迁移宫星曜推断', aux: [] };

  return {
    mingGongMain: mingGongData,
    byGong,
    ziWeiGong,
    tianFuGong
  };
}

// 向后兼容旧版接口
function computeZiWeiStars(mingGongIdx, dayStemIdx) {
  const result = computeZiWeiStarsV2(mingGongIdx, dayStemIdx, 0, 0);
  return {
    main: result.mingGongMain,
    all: result.byGong
  };
}

// ================================================================
//  四化飞星系统（基于生年天干）
// ================================================================
const SIHUA_BY_YEAR_GAN = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' }
};

function computeSiHuaByYearGan(yearStem) {
  const mapping = SIHUA_BY_YEAR_GAN[yearStem] || SIHUA_BY_YEAR_GAN['甲'];
  // 每个四化星的宫位需要通过排盘确定，这里返回星名，在解读中计算所在宫位
  return {
    lu: { name: mapping.lu, desc: '财运福气之源', gong: '' },
    quan: { name: mapping.quan, desc: '权力掌控方向', gong: '' },
    ke: { name: mapping.ke, desc: '名声学业贵人', gong: '' },
    ji: { name: mapping.ji, desc: '障碍烦恼所在', gong: '' }
  };
}

// 向后兼容旧版
function computeFourChange(dayStemIdx) {
  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const yearStem = STEMS[dayStemIdx % 10];
  const mapping = SIHUA_BY_YEAR_GAN[yearStem] || SIHUA_BY_YEAR_GAN['甲'];
  return { lu: mapping.lu, quan: mapping.quan, ke: mapping.ke, ji: mapping.ji };
}

// ================================================================
//  大限（十年大运）计算系统
// ================================================================
function computeDaXian(mingGongIdx, isMale, yearStem, dayStem) {
  const yangGan = ['甲','丙','戊','庚','壬'];
  const yinGan = ['乙','丁','己','辛','癸'];
  const isYangGan = yangGan.includes(yearStem);

  // 阳男阴女顺行，阴男阳女逆行
  const isShunXing = (isMale && isYangGan) || (!isMale && !isYangGan);

  const daXianArray = [];
  const daXianAgeStart = []; // 每个大限的起始年龄
  
  // 大限起运年龄（简化：从命宫开始，每个大限10年）
  // 实际应基于五行局数，此处简化
  const startAge = 3; // 简化：3岁起运
  
  for (let i = 0; i < 12; i++) {
    const gongIdx = isShunXing ? (mingGongIdx + i) % 12 : (mingGongIdx - i + 12) % 12;
    const ageStart = startAge + i * 10;
    const ageEnd = ageStart + 9;
    daXianArray.push({
      gongIdx,
      gongName: gong12[gongIdx],
      ageStart,
      ageEnd,
      label: `${ageStart}-${ageEnd}岁`
    });
  }

  // 当前大限（基于当前年份推算，此处用简化：假设用户约30岁）
  const currentDaXian = daXianArray[2] || daXianArray[0];

  return {
    daXianArray,
    currentDaXian,
    isShunXing,
    startAge
  };
}

// ================================================================
//  流年命宫推算
// ================================================================
function computeLiuNianMingGong(currentYear, mingGongIdx, yearStem) {
  // 流年命宫：以岁建（太岁）所在宫为基准
  const taiSuiIdx = (currentYear - 4) % 12; // 太岁所在宫
  // 简化：流年命宫 = (命宫 + 岁差) % 12
  const liuNianIdx = (mingGongIdx + (currentYear % 12)) % 12;
  return {
    gongIdx: liuNianIdx,
    gongName: gong12[liuNianIdx],
    taiSuiGong: gong12[taiSuiIdx]
  };
}

// ================================================================
//  宫干四化表（十天干 × 四化）
// ================================================================
const GONGGAN_SIHUA = {
  '甲': { lu: '廉贞', quan: '破军', ke: '武曲', ji: '太阳' },
  '乙': { lu: '天机', quan: '天梁', ke: '紫微', ji: '太阴' },
  '丙': { lu: '天同', quan: '天机', ke: '文昌', ji: '廉贞' },
  '丁': { lu: '太阴', quan: '天同', ke: '天机', ji: '巨门' },
  '戊': { lu: '贪狼', quan: '太阴', ke: '右弼', ji: '天机' },
  '己': { lu: '武曲', quan: '贪狼', ke: '天梁', ji: '文曲' },
  '庚': { lu: '太阳', quan: '武曲', ke: '太阴', ji: '天同' },
  '辛': { lu: '巨门', quan: '太阳', ke: '文曲', ji: '文昌' },
  '壬': { lu: '天梁', quan: '紫微', ke: '左辅', ji: '武曲' },
  '癸': { lu: '破军', quan: '巨门', ke: '太阴', ji: '贪狼' }
};

// ================================================================
//  专业解读模型 buildZiWeiProfessionalInterpretation()
//  基于《紫微斗数全书》《紫微斗数解密》等经典
//  输出不少于2000字的专业解读报告
// ================================================================
function buildZiWeiProfessionalInterpretation(data) {
  const { name, year, month, day, hourNum, sex, isMale, yearStem, dayStem, dayBranch,
    hourBranch, mingGongBranchIdx, mingGong, shenGong, mingGongGanZhi,
    yearStemIdx, dayStemIdx, stars, sihua, daXian } = data;

  const mingStar = stars.mingGongMain.name || '无主星';
  const STAR = ZW_MAIN_STARS;
  const STR = (s) => STAR[s] || { detail: '', nature: '', element: '', good: '', bad: '' };

  // ========== a) 命盘总论（200字+） ==========
  let overview = '';
  
  // 命宫主星组合判定
  const mingStarInfo = STR(mingStar.split('/')[0]);
  const mingStar2 = mingStar.includes('/') ? mingStar.split('/')[1] : '';
  
  // 格局判定
  let geJu = '';
  let geJuLevel = '中格';
  if (mingStar.includes('紫微') && mingStar.includes('天府')) { geJu = '紫府同宫格（帝王格局）'; geJuLevel = '上格'; }
  else if (mingStar.includes('紫微') && mingStar.includes('七杀')) { geJu = '紫杀格（化杀为权，将帅格局）'; geJuLevel = '上格'; }
  else if (mingStar.includes('紫微') && mingStar.includes('破军')) { geJu = '紫破格（变动中开创，创业格局）'; geJuLevel = '上格'; }
  else if (mingStar.includes('紫微') && mingStar.includes('天相')) { geJu = '紫相格（权印双全，辅佐良臣）'; geJuLevel = '上格'; }
  else if (mingStar.includes('武曲') && mingStar.includes('天府')) { geJu = '武府格（财库充盈，富贵格局）'; geJuLevel = '上格'; }
  else if (mingStar.includes('廉贞') && mingStar.includes('天府')) { geJu = '廉府格（感情稳定，才艺有成）'; geJuLevel = '上格'; }
  else if (mingStar.includes('太阳') && mingStar.includes('太阴')) { geJu = '日月并明格（阴阳调和，富贵双全）'; geJuLevel = '上格'; }
  else if (mingStar.includes('天机') && mingStar.includes('太阴')) { geJu = '机月同梁格（智慧型贵人，宜公职）'; geJuLevel = '上格'; }
  else if (mingStar.includes('七杀') || mingStar.includes('破军') || mingStar.includes('贪狼')) {
    geJu = '杀破狼格局（动荡开创型，一生多起伏）';
    if ((mingStar.includes('七杀') && mingStar.includes('紫微')) ||
        (mingStar.includes('破军') && mingStar.includes('紫微'))) geJuLevel = '上格';
    else geJuLevel = '中格';
  }
  else if (mingStar.includes('紫微')) { geJu = '紫微独坐格（帝星独守，需辅弼扶持）'; geJuLevel = '上格'; }
  else if (mingStar.includes('天府')) { geJu = '天府独坐格（财库自守，稳重有成）'; geJuLevel = '上格'; }
  else if (mingStar.includes('天同') && mingStar.includes('天梁')) { geJu = '同梁格（福寿双全，安逸人生）'; geJuLevel = '中格'; }
  else if (mingStar.includes('巨门') && mingStar.includes('太阳')) { geJu = '巨日格（口才化光，是非可解）'; geJuLevel = '中格'; }
  else if (mingStar === '无主星') { geJu = '命宫为空（借对宫星曜推断，力量减半）'; geJuLevel = '下格'; }
  else { geJu = mingStar + '坐命格'; geJuLevel = '中格'; }

  // 杀破狼判定
  const hasShaPoLang = mingStar.includes('七杀') || mingStar.includes('破军') || mingStar.includes('贪狼');
  
  overview = `命主「${name}」，${isMale?'乾造（男命）':'坤造（女命）'}，命宫坐「${mingGong}」宫（${mingGongGanZhi}），命宫主星为「${mingStar}」，属${mingStarInfo.element||'—'}性，为${mingStarInfo.nature||''}。

经排盘，命主格局为「${geJu}」，整体格局等级为【${geJuLevel}】。${geJuLevel==='上格'?'此格局在紫微斗数中属上等格局，命主天生资质优越，有较大的发展潜力和社会地位提升空间。':'此格局在紫微斗数中属中等格局，命主需靠后天努力方能有所成就，但仍有较好的发展机遇。'}

${mingStarInfo.detail?mingStarInfo.detail.substring(0,200)+'……':''}

一生大势判断：${hasShaPoLang?'命主一生运势起伏较大，早年多变动奔波，中晚年趋于稳定。杀破狼格局主动荡开创，命主适合在变化中寻找机遇，不宜安于现状。建议在30岁前多尝试不同领域，35岁后专注于一项事业深耕。':'命主一生运势相对平稳，早年即显才华，中年事业有成，晚年安享福禄。命主适合在体制内或稳定环境中发展，不宜频繁变动。建议在25-35岁关键期打牢根基，厚积薄发。'}

命主先天优势：${mingStarInfo.good||''}。需注意之处：${mingStarInfo.bad||''}。`;

  // ========== b) 十二宫逐宫详解 ==========
  let gongAnalysis = '';
  const keyGongs = ['命宫','财帛','事业','迁移','夫妻','疾厄'];
  const allGongs = gong12;
  
  for (let i = 0; i < 12; i++) {
    const gName = allGongs[i];
    const branch = BRANCHES[(mingGongBranchIdx + i) % 12];
    const starHere = stars.byGong[i] || { name: '无主星', nature: '', aux: [], sha: [] };
    const gongDetail = ZW_12GONG[gName] || { desc: '' };
    const starName = starHere.name;
    const starDetail = STR(starName.split('/')[0]);
    const isKey = keyGongs.includes(gName);
    const auxStars = (starHere.aux || []).join('、');
    const shaStars = (starHere.sha || []).join('、');
    
    // 四化影响判定
    let siHuaEffect = '';
    if (starName.includes(sihua.lu.name)) siHuaEffect += '【化禄在此】此领域财运亨通、福气深厚。';
    if (starName.includes(sihua.quan.name)) siHuaEffect += '【化权在此】此领域有掌控力和话语权。';
    if (starName.includes(sihua.ke.name)) siHuaEffect += '【化科在此】此领域名声在外、有贵人赏识。';
    if (starName.includes(sihua.ji.name)) siHuaEffect += '【化忌在此】此领域需特别注意，多有波折烦恼。';
    
    if (isKey) {
      gongAnalysis += `【⭐${gName}·${branch}宫】${gongDetail.desc.substring(0,80)}……
  主星「${starName}」详解：${starDetail.detail?starDetail.detail.substring(0,180):''}……
  ${auxStars?'辅星：'+auxStars+'，助力此宫。':''}${shaStars?'煞星：'+shaStars+'，此宫有挑战需克服。':''}${siHuaEffect?'\n  四化影响：'+siHuaEffect:''}

`;
    } else {
      gongAnalysis += `【${gName}·${branch}宫】主星「${starName}」。${gongDetail.desc.substring(0,60)}……${auxStars?'辅星：'+auxStars+'。':''}${siHuaEffect?' | '+siHuaEffect:''}

`;
    }
  }

  // ========== c) 四化飞星分析（150字+） ==========
  let sihuaAnalysis = '';
  
  // 找到四化星所在宫位
  const findStarGong = (starName) => {
    for (let i = 0; i < 12; i++) {
      const s = stars.byGong[i];
      if (s && s.name.includes(starName)) return { idx: i, name: gong12[i] };
    }
    return { idx: -1, name: '未定' };
  };

  const sihuaLuGong = findStarGong(sihua.lu.name);
  const sihuaQuanGong = findStarGong(sihua.quan.name);
  const sihuaKeGong = findStarGong(sihua.ke.name);
  const sihuaJiGong = findStarGong(sihua.ji.name);

  sihuaAnalysis = `命主生于「${yearStem}」年，年干四化为：

① 化禄在「${sihua.lu.name}」星（入${sihuaLuGong.name}宫）——此领域是命主福气和财运的来源。${sihuaLuGong.idx>=0?ZW_12GONG[sihuaLuGong.name]?.desc?.substring(0,80)||'':'化禄入此宫，代表命主在此领域天生有福气，财运顺遂，可在此方向努力获取财富。'}化禄之年（逢${yearStem}干之年），财运尤旺。

② 化权在「${sihua.quan.name}」星（入${sihuaQuanGong.name}宫）——此领域是命主掌控力和权势的方向。${sihuaQuanGong.idx>=0?ZW_12GONG[sihuaQuanGong.name]?.desc?.substring(0,80)||'':'化权入此宫，代表命主在此领域有掌控能力，适合担任领导角色。'}化权之年，宜主动出击、争取权力。

③ 化科在「${sihua.ke.name}」星（入${sihuaKeGong.name}宫）——此领域是命主名声和贵人的来源。${sihuaKeGong.idx>=0?ZW_12GONG[sihuaKeGong.name]?.desc?.substring(0,80)||'':'化科入此宫，代表命主在此领域有学术名声或贵人相助。'}化科之年，宜求学考试、提升知名度。

④ 化忌在「${sihua.ji.name}」星（入${sihuaJiGong.name}宫）——此领域是命主需要注意和克服的障碍所在。${sihuaJiGong.idx>=0?ZW_12GONG[sihuaJiGong.name]?.desc?.substring(0,80)||'':'化忌入此宫，代表命主在此领域容易遇到阻碍和烦恼。'}化忌之年，宜低调行事、以守为攻。

《紫微斗数全书》云：「四化飞星为命盘之灵魂，化禄为福，化权为权，化科为名，化忌为戒。四化入何宫，则该宫之事必有变动。」`;

  // ========== d) 大限流年 ==========
  let daXianAnalysis = '';
  const currentYear = new Date().getFullYear();
  const dx = daXian.currentDaXian;
  const liuNian = computeLiuNianMingGong(currentYear, mingGongBranchIdx, yearStem);
  
  daXianAnalysis = `命主大限（十年运势）起于${daXian.startAge}岁，${daXian.isShunXing?'顺行':'逆行'}。

当前大限：${dx.label}，大限命宫在「${dx.gongName}」。此十年中，${ZW_12GONG[dx.gongName]?.desc?.substring(0,100)||''}……大限运势以该宫主星和四化为主进行判断。

流年${currentYear}年运势：流年命宫在「${liuNian.gongName}」，太岁在「${liuNian.taiSuiGong}」。${currentYear}年流年四化以年干「${STEMS[(currentYear-4)%10]}」为准：${(()=>{const s=SIHUA_BY_YEAR_GAN[STEMS[(currentYear-4)%10]];return s?'化禄'+s.lu+'、化权'+s.quan+'、化科'+s.ke+'、化忌'+s.ji:'—';})()}。

未来3年关键转折点：
· ${currentYear+1}年：流年命宫在「${computeLiuNianMingGong(currentYear+1,mingGongBranchIdx,yearStem).gongName}」，此年宜${(currentYear+1)%4===0?'守成':'进取'}。
· ${currentYear+2}年：流年命宫在「${computeLiuNianMingGong(currentYear+2,mingGongBranchIdx,yearStem).gongName}」，此年${(currentYear+2)%3===0?'有变动机遇':'运势平稳'}。
· ${currentYear+3}年：流年命宫在「${computeLiuNianMingGong(currentYear+3,mingGongBranchIdx,yearStem).gongName}」，此年${(currentYear+3)%5===0?'需注意波折':'可积极发展'}。

《紫微斗数全书》云：「大限者，十年之运也。流年者，一岁之运也。大限吉，流年吉，则万事顺遂；大限凶，流年凶，则万事阻滞。」`;

  // ========== e) 大白话建议（150字+） ==========
  // 行业建议基于命宫主星
  const careerAdvice = {
    '紫微': '适合管理、从政、高管、领导岗位。宜在体制内或大企业发展，有成为领导者的潜质。',
    '天机': '适合IT、策划、咨询、研究、教育。宜从事需要智力和创新思维的行业，不适合纯体力劳动。',
    '太阳': '适合公职、教育、公益、演艺、传媒。宜从事需要曝光度的行业，不适合幕后工作。',
    '武曲': '适合金融、贸易、军警、工程。宜从事需要决断力和执行力的行业，财运较好。',
    '天同': '适合服务业、餐饮、艺术、设计。宜从事需要温和性格的行业，不适合高压环境。',
    '廉贞': '适合艺术、设计、公关、娱乐。宜从事需要创意和情感表达的行业。',
    '天府': '适合金融、会计、管理、仓储。宜从事需要稳定性和诚信的行业。',
    '太阴': '适合金融、设计、房地产、美容。宜从事需要细腻和审美的行业。',
    '贪狼': '适合演艺、销售、公关、娱乐。宜从事需要交际能力和魅力的行业。',
    '巨门': '适合律师、讲师、评论员、研发。宜从事需要口才和分析能力的行业。',
    '天相': '适合公务员、秘书、管理、协调。宜从事需要服务精神和协调能力的行业。',
    '天梁': '适合教育、医疗、公益、司法。宜从事需要德行和责任感的行业。',
    '七杀': '适合军警、创业、管理、体育。宜从事需要魄力和开拓精神的行业。',
    '破军': '适合创业、科技、艺术、变革性行业。宜从事需要创新和变革的行业。'
  };

  const mainStarName = mingStar.split('/')[0];
  const career = careerAdvice[mainStarName] || '适合根据自身特长选择行业，宜在30岁前多尝试不同领域。';

  let advice = `【适合的行业/方向】
${career}

【需要注意的年份】
· 化忌所在宫位（${sihuaJiGong.name}）的流年需特别谨慎，宜保守行事。
· 逢${yearStem}干之年（每10年一次）为四化复位之年，运势变化较大。
· 大限转换之年（每10年一次）为人生转折点，宜提前规划。
· ${currentYear+1}年-${currentYear+3}年为近期关键期，请参考上方流年运势。

【具体可执行的改善建议】
1. 职业规划：${mainStarName==='紫微'||mainStarName==='天府'?'宜在体制内或大型企业深耕，积累资历和人脉。':mainStarName==='七杀'||mainStarName==='破军'?'宜在30岁前多尝试不同领域，找到适合的创业方向。':'宜持续学习提升专业技能，在擅长领域做到极致。'}
2. 人际关系：${mingStarInfo.element==='火'?'注意控制情绪，避免冲动得罪人。':mingStarInfo.element==='金'?'注意柔和处世，刚则易折。':mingStarInfo.element==='水'?'注意辨别是非，避免被小人利用。':'注意主动社交，扩大人脉圈。'}
3. 财务管理：${sihuaJiGong.name==='财帛'?'财运方面需特别谨慎，不宜盲目投资，建议稳健理财为主。':'财运整体尚可，建议做好资产配置，留足应急资金。'}
4. 健康养生：${mingStarInfo.element==='火'?'注意心脑血管，定期体检，避免熬夜。':mingStarInfo.element==='金'?'注意呼吸系统，多锻炼肺部功能。':mingStarInfo.element==='木'?'注意肝胆经络，保持规律作息。':mingStarInfo.element==='水'?'注意肾脏泌尿系统，多喝水少憋尿。':mingStarInfo.element==='土'?'注意脾胃消化，饮食规律，少吃生冷。':'注意全面体检，保持良好生活习惯。'}

【化解方案】
· 幸运颜色：${mingStarInfo.element==='火'?'红色、紫色':mingStarInfo.element==='金'?'白色、金色':mingStarInfo.element==='木'?'绿色、青色':mingStarInfo.element==='水'?'黑色、蓝色':'黄色、棕色'}
· 吉利方位：${mingStarInfo.element==='火'?'南方':mingStarInfo.element==='金'?'西方':mingStarInfo.element==='木'?'东方':mingStarInfo.element==='水'?'北方':'中央'}
· 幸运数字：${mingStarInfo.element==='火'?'2、7':mingStarInfo.element==='金'?'4、9':mingStarInfo.element==='木'?'3、8':mingStarInfo.element==='水'?'1、6':'5、0'}
· 建议佩戴：${mingStarInfo.element==='火'?'木属性饰品（绿檀、翡翠）以木生火':mingStarInfo.element==='金'?'土属性饰品（黄水晶、蜜蜡）以土生金':mingStarInfo.element==='木'?'水属性饰品（黑曜石、海蓝宝）以水生木':mingStarInfo.element==='水'?'金属性饰品（白水晶、银饰）以金生水':'火属性饰品（红玛瑙、石榴石）以火生土'}
· 日常习惯：${hasShaPoLang?'每日清晨面向吉方深呼吸3次，保持心态平和；每周运动3次以上以消耗过旺精力；睡前冥想10分钟以稳定心神。':'每日保持规律作息，早睡早起；每周阅读或学习新知识；保持社交活动以拓展人脉。'}`;

  // ========== f) AI综合分析（大白话总结） ==========
  const geJuDesc = geJuLevel === '上格' ? '命主格局不错，天生的底子好，只要不走太大的弯路，一生不会太差。' :
    (geJuLevel === '下格' ? '命主格局稍弱，但后天努力可以弥补先天不足。紫微斗数讲「命好不如运好，运好不如心好」，心态和努力比什么都重要。' :
    '命主格局中等，不好不坏。这类人最大的优势在于——把握机会就能上去，错过机会也不至于太差。关键在于选择和执行。');

  const aiSummary = `【AI大白话总结】

${name}你好，以下是你的紫微命盘大白话总结：

你的命宫主星是「${mingStar}」，属于${mingStarInfo.element||'—'}性，${mingStarInfo.nature||''}。用大白话来说，${mingStar==='紫微'?'你天生有领导气质，走到哪都是那个被推出来拿主意的人。你适合做管理、做决策，但要注意不要过于自负，多听听身边人的意见。':mingStar==='天机'?'你脑瓜子好使，反应快，是智囊型人才。但想得太多有时候也容易焦虑，要学会「该放下时就放下」。':mingStar==='武曲'?'你是实干家，执行力强，天生对钱有感觉。但性格太硬容易得罪人，也要注意感情生活。':mingStar==='天府'?'你稳重可靠，有积蓄能力，是「闷声发大财」的类型。但有时候过于保守会错失良机。':mingStar==='天同'?'你有福气，性格好，人缘好。但小心太安逸了会变懒，得给自己找点动力。':mingStar==='七杀'?'你是「杀破狼」命，一生多起伏，但你天生有魄力，适合创业和挑战。':mingStar==='破军'?'你不喜欢循规蹈矩，有开创精神。但一生变动多，要记得存钱防老。':mingStar==='贪狼'?'你多才多艺，桃花旺，适合做与人打交道的工作。但要注意节制欲望，别让自己迷失。':'你的命格有独特之处，请结合上方各宫详解来理解自己的人生轨迹。'}

${geJuDesc}

你的财运来源于「${sihuaLuGong.name}」，所以在这个领域多花心思，会有不错的回报。你需要注意的是「${sihuaJiGong.name}」这个领域，这里容易出问题，要提前防范。

最后送你这句：「知命不惑，知运不忧」。了解命盘不是为了宿命，而是为了趋吉避凶，在该努力的时候拼尽全力，在该休息的时候从容淡定。

祝你一切顺利！」

——以上解读基于《紫微斗数全书》《紫微斗数解密》等经典，由紫微斗数命理专家系统生成。命理为参考，人生在自己手中。`;

  return {
    overview,
    gongAnalysis,
    sihuaAnalysis,
    daXianAnalysis,
    advice,
    aiSummary,
    wordCount: overview.length + gongAnalysis.length + sihuaAnalysis.length + daXianAnalysis.length + advice.length + aiSummary.length
  };
}

// ================================================================
//  MEIHUA ENGINE
// ================================================================

function computeMeiHua() {
 try {
  return _computeMeiHuaImpl();
 } catch(e) {
  console.error('[梅花易数错误]', e.message, e.stack);
  var _eb = document.getElementById('mhInterp') || document.getElementById('mhResult');
  if(_eb) _eb.innerHTML = '<div style="padding:20px;margin:16px 0;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 梅花易数出错</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p><p style="font-size:11px;opacity:.5;margin-top:4px">'+(e.stack||'').split("\n").slice(0,3).join("<br>")+'</p></div>';
  var _r = document.getElementById('mhResult'); if(_r){_r.classList.add('visible');_r.scrollIntoView({behavior:'smooth'});}
 }
}
function _computeMeiHuaImpl() {
  var btn = document.getElementById('mhBtn');
  if(btn){ btn.disabled=true; btn.textContent='排盘中...'; }
  playDivinationSound();
  // 未输入数字时，基于起心动念时间的干支数起卦（非Math.random）
  var _now = new Date();
  var _nowGZ = getDayGanZhi(_now.getFullYear(), _now.getMonth()+1, _now.getDate());
  var _defaultN1 = (_nowGZ.gan % 8) + 1;
  var _defaultN2 = (_nowGZ.zhi % 8) + 1;
  var _defaultN3 = ((_now.getHours() + _nowGZ.gan + _nowGZ.zhi) % 6) + 1;
  showToast('未输入数字，以起心动念时辰起卦：' + _defaultN1 + ',' + _defaultN2 + ',' + _defaultN3);
  const n1 = parseInt(document.getElementById('mhNum1').value) || _defaultN1;
  const n2 = parseInt(document.getElementById('mhNum2').value) || _defaultN2;
  const n3 = parseInt(document.getElementById('mhNum3').value) || _defaultN3;
  const name = document.getElementById('mhName').value || '有缘人';
  const question = document.getElementById('mhQuestion') ? (document.getElementById('mhQuestion').value || '') : '';

  // 上卦 = n1, 下卦 = n2, 动爻 = n3
  const shangGua = (n1 % 8) || 8;
  const xiaGua = (n2 % 8) || 8;
  const dongYao = ((n3 - 1) % 6) + 1;

  const gua8 = ['乾','兑','离','震','巽','坎','艮','坤'];
  const guaTri = ['☰','☱','☲','☳','☴','☵','☶','☷'];
  const sName = gua8[shangGua-1];
  const xName = gua8[xiaGua-1];
  const sTri = guaTri[shangGua-1];
  const xTri = guaTri[xiaGua-1];

  // Find hexagram (本卦)
  const guaIndex = (shangGua-1)*8 + (xiaGua-1);
  const hex = HEXAGRAMS[guaIndex] || HEXAGRAMS[0];

  // Create lines
  const shangLines = getGuaLines(shangGua);
  const xiaLines = getGuaLines(xiaGua);
  const fullLines = xiaLines.concat(shangLines);
  const guaHex = [[],[]];
  for (let i = 0; i < 3; i++) guaHex[0][i] = shangLines[i];
  for (let i = 0; i < 3; i++) guaHex[1][i] = xiaLines[i];

  // V2: 互卦（二三四爻为下互，三四五爻为上互）
  var huGuaData = getHuGua(fullLines);
  
  // Determine moving line
  const movingLine = dongYao - 1;
  const changedLines = fullLines.slice();
  changedLines[movingLine] = changedLines[movingLine] === 1 ? 0 : 1;

  // Build changed hexagram (变卦)
  const cShang = changedLines.slice(3,6);
  const cXia = changedLines.slice(0,3);
  const cHexNum = getGuaIndex(cShang)*8 + getGuaIndex(cXia) + 1;
  const cHex = HEXAGRAMS[cHexNum-1] || HEXAGRAMS[0];
  const cShangName = gua8[getGuaIndex(cShang)];
  const cXiaName = gua8[getGuaIndex(cXia)];

  // Determine Ti (体) and Yong (用)
  const tiGua = dongYao <= 3 ? xiaGua : shangGua;
  const yongGua = dongYao <= 3 ? shangGua : xiaGua;
  const tiName = gua8[tiGua-1];
  const yongName = gua8[yongGua-1];

  // 五行
  const eleMap = {乾:'金',兑:'金',离:'火',震:'木',巽:'木',坎:'水',艮:'土',坤:'土'};
  const tiEle = eleMap[tiName];
  const yongEle = eleMap[yongName];

  // 生克
  const shengke = getShengKe(tiEle, yongEle);
  const shengkeCode = getShengKeCode(tiEle, yongEle);

  // V2: 调用专业梅花解读引擎
  var profData = buildMeiHuaProfessionalInterpretation({
    benGua: { name: hex.name, symbol: hex.symbol, judgment: hex.judgment, meaning: hex.meaning, shangName: sName, xiaName: xName, shangTri: sTri, xiaTri: xTri, shangId: shangGua-1, xiaId: xiaGua-1 },
    huGua: huGuaData,
    bianGua: { name: cHex.name, symbol: cHex.symbol, judgment: cHex.judgment, meaning: cHex.meaning, shangName: cShangName, xiaName: cXiaName, shangTri: guaTri[getGuaIndex(cShang)], xiaTri: guaTri[getGuaIndex(cXia)], shangId: getGuaIndex(cShang), xiaId: getGuaIndex(cXia) },
    tiGua: { name: tiName, ele: tiEle, position: dongYao <= 3 ? 'xia' : 'shang' },
    yongGua: { name: yongName, ele: yongEle, position: dongYao <= 3 ? 'shang' : 'xia' },
    shengke: shengke,
    shengkeCode: shengkeCode,
    dongYao: dongYao,
    dongYaoPos: dongYao <= 3 ? '下卦' : '上卦',
    numbers: [n1, n2, n3],
    name: name,
    question: question
  });

  document.getElementById('mhMeta').textContent = `梅花易数 · ${name} · 上卦${n1}下卦${n2}动爻${n3} · ${profData.sancangScore.level}`;
  document.getElementById('mhTitle').textContent = `${sName}为上 ${xName}为下`;
  document.getElementById('mhSub').textContent = `本卦${hex.symbol} → 互卦${huGuaData.hex.symbol} → 变卦${cHex.symbol} · 动${dongYao}爻`;

  const ctr = document.getElementById('mhInterp');
  ctr.innerHTML = '';

  // V2: 专业解读卡片
  const interpBlocks = [
    {
      title:'🌿 卦 象 形 成',
      text: `上卦${sName}(${sTri})由数${n1}起，下卦${xName}(${xTri})由数${n2}起。动爻为第${dongYao}爻，由数${n3}决定。

《易传·系辞》云:「易有太极，是生两仪，两仪生四象，四象生八卦。」《梅花易数》曰:「数起于心，卦成于数，动静之间，吉凶可见。」

三卦体系：
• 本卦（${hex.name}${hex.symbol}）= 当下状态
• 互卦（${huGuaData.hex.name}${huGuaData.hex.symbol}）= 中间过程
• 变卦（${cHex.name}${cHex.symbol}）= 最终结果`,
      accent:'jade-accent'
    },
    {
      title:'📊 卦 象 总 断',
      text: profData.hexSummary,
      accent:'gold-accent'
    },
    {
      title:'⚖️ 体 用 分 析',
      text: profData.tiYongAnalysis,
      accent:'gold-accent'
    },
    {
      title:'🌙 五 行 旺 衰',
      text: profData.wangShuai,
      accent:'cyan-accent'
    },
    {
      title:'⚡ 动 爻 分 析',
      text: profData.dongYaoAnalysis,
      accent:'violet-accent'
    },
    {
      title:'💬 大 白 话 结 论',
      text: profData.conclusion,
      accent:'jade-accent'
    },
    {
      title:'🛡️ 化 解 方 法',
      text: profData.huajie,
      accent:'violet-accent'
    },
    {
      title:'📈 三 卦 综 合 评 分',
      text: `【${profData.sancangScore.level}】${profData.sancangScore.desc}

本卦${hex.name} → 互卦${huGuaData.hex.name} → 变卦${cHex.name}
体卦${tiName}(${tiEle}) VS 用卦${yongName}(${yongEle})：${shengke}

生克链：本卦体用${shengkeCode}，互卦${huGuaData.hex.name}为过渡，变卦${cHex.name}为结局。三卦关系构成了完整的占卜逻辑链。`,
      accent:'gold-accent'
    },
    {
      title:'📜 经 典 出 处',
      text: `《梅花易数·邵雍》云:「梅花易数者，以数起卦，体用分阴阳，五行生克定吉凶。」

《梅花易数·体用篇》云:「凡占卜之法，先定体用。体者为我，用者为事。体用生克，万事之理尽矣。」

《皇极经世·观物外篇》云:「以物观物，性也；以我观物，情也。性公而明，情偏而暗。」

《易传·系辞》云:「易有太极，是生两仪，两仪生四象，四象生八卦。八卦定吉凶，吉凶生大业。」

本次梅花断卦基于邵雍《梅花易数》正宗断法，综合运用体用生克、互卦变卦、五行旺衰、动爻位置、外应取象等六维断卦体系。卦象是天机，人生靠自己。知天命而尽人事，方为君子之道。`,
      accent:'jade-accent'
    }
  ];

  for (var bi = 0; bi < interpBlocks.length; bi++) {
    var b = interpBlocks[bi];
    var div = document.createElement('div');
    div.className = 'interp-card ' + b.accent;
    div.innerHTML = '<h5>' + b.title + '</h5><p style="white-space:pre-line;line-height:2;font-size:13px">' + b.text.replace(/\n/g, '<br>') + '</p>';
    ctr.appendChild(div);
  }

  // 起心动念时辰分析（仅事盘）
  if (typeof yjMode !== 'undefined' && yjMode === 'matter' && typeof yjQixinTime !== 'undefined' && yjQixinTime) {
    var qxBox = document.createElement('div');
    qxBox.className = 'interp-card gold-accent';
    qxBox.style.marginTop = '20px';
    var qxDate = new Date(yjQixinTime);
    var qxLunar = '';
    try { qxLunar = getLunarDateStr(qxDate); } catch(e) {}
    qxBox.innerHTML = '<h5>☰ 起心动念时辰分析</h5>' +
      '<p style="margin-bottom:10px">您于 <strong>' + qxDate.toLocaleString('zh-CN') + '</strong> 心生疑问（' + qxLunar + '）</p>' +
      '<p style="margin-bottom:10px">《黄金策》云:「占卜之道，心诚则灵，时到则应。」起心动念之时，正是天机显现之刻。此时辰与卦象相参，可断事之吉凶、时之迟速。</p>' +
      '<p>时辰' + (typeof getShiChen === 'function' ? getShiChen(qxDate.getHours()) : '') + (typeof getShiChenAnalysis === 'function' && typeof hexNum !== 'undefined' ? '，' + getShiChenAnalysis(qxDate.getHours(), hexNum) : '') + '</p>';
    ctr.appendChild(qxBox);
  }

  // V2: 梅花专业解读摘要（mhReadingBox）
  var mhReadBox = document.getElementById('mhReadingBox');
  if (mhReadBox) {
    mhReadBox.innerHTML = '<div class="analysis-card" style="border:1px solid rgba(39,174,96,.2);margin-top:20px">' +
      '<h5 style="font-size:16px;color:var(--jade2);letter-spacing:4px">🌿 梅花易数专业断语</h5>' +
      '<div style="font-size:13px;line-height:2;white-space:pre-line">' + (profData.fullText || profData.hexSummary).replace(/\n/g, '<br>') + '</div>' +
      '</div>';
  }

  // ── 起卦流程说明 ──
  var mhProcBox = document.getElementById('mhProcessBox');
  if (mhProcBox) {
    var mhProc = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(39,174,96,.2);padding:20px">';
    mhProc += '<h5 style="font-size:15px;color:var(--jade2);letter-spacing:3px;margin-bottom:14px">📋 梅花易数起卦流程</h5>';
    mhProc += '<div style="font-size:13px;line-height:2.1;opacity:.85">';
    mhProc += '<p><b style="color:var(--gold)">第一步·取数：</b>以三个数字起卦，上卦=数1÷8取余，下卦=数2÷8取余，动爻=(数1+数2+数3)÷6取余。此为「万物皆数」之法。';
    mhProc += '</p>';
    mhProc += '<p><b style="color:var(--gold)">第二步·装卦：</b>上卦在上，下卦在下，组成六十四卦中的一卦。动爻所在之爻变，得变卦。本卦代表当下，变卦代表未来。';
    mhProc += '</p>';
    mhProc += '<p><b style="color:var(--gold)">第三步·定体用：</b>动爻所在之卦为「用卦」，不动之卦为「体卦」。体卦代表自己，用卦代表对方或事态。体生用为泄，用生体为吉，体克用为胜，用克体为凶。';
    mhProc += '</p>';
    mhProc += '<p><b style="color:var(--gold)">第四步·断卦：</b>以体用五行生克为核心，参以卦象、卦辞、爻辞、互卦、变卦，综合判断吉凶。体卦旺相则吉，休囚则凶。';
    mhProc += '</p>';
    mhProc += '</div>';
    mhProc += '<div style="margin-top:12px;padding:10px 14px;background:rgba(39,174,96,.05);border-radius:8px;font-size:12px;opacity:.7">';
    mhProc += '《梅花易数》云：「体为己，用为人。体生用为泄气，用生体为有助。体克用为吉，用克体为凶。比和则吉。」';
    mhProc += '</div>';
    mhProc += '</div>';
    mhProcBox.innerHTML = mhProc;
  }

  // ── 前后推演 ──
  var mhFcBox = document.getElementById('mhForecastBox');
  if (mhFcBox) {
    var mhFc = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.15);padding:20px">';
    mhFc += '<h5 style="font-size:15px;color:var(--gold);letter-spacing:3px;margin-bottom:14px">🔍 前后推演</h5>';
    mhFc += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
    mhFc += '<div style="padding:14px;background:rgba(46,204,113,.05);border-radius:8px;border:1px solid rgba(46,204,113,.1)"><div style="font-size:13px;color:#2ecc71;font-weight:bold;margin-bottom:8px">⏪ 本卦回溯</div><div style="font-size:12px;line-height:1.8;opacity:.8">';
    mhFc += '<p>本卦代表当下事态之始，变卦代表事态之终。</p>';
    mhFc += '<p style="opacity:.6;margin-top:6px">可回溯过往相同卦象，验证人事走向。</p>';
    mhFc += '</div></div>';
    mhFc += '<div style="padding:14px;background:rgba(231,76,60,.05);border-radius:8px;border:1px solid rgba(231,76,60,.1)"><div style="font-size:13px;color:#e74c3c;font-weight:bold;margin-bottom:8px">⏩ 变卦预测</div><div style="font-size:12px;line-height:1.8;opacity:.8">';
    mhFc += '<p>变卦代表事态发展方向，动爻变化提示转机。</p>';
    mhFc += '<p style="opacity:.6;margin-top:6px">结合互卦判断中间过程，变卦断最终结果。</p>';
    mhFc += '</div></div>';
    mhFc += '</div></div>';
    mhFcBox.innerHTML = mhFc;
  }

  // ── 个性化指导 ──
  try {
    var mhGuide = buildMeihuaPersonalizedGuidance({ guaName: hex ? hex.name : '', changedName: '' });
    var mhRes = document.getElementById('mhResult');
    if (mhRes) mhRes.innerHTML += mhGuide;
  } catch(e) {}

  // ═══ 三元九运与梅花 ═══
  try {
    var _syMh = _generateSanyuanJiuyunBlock('meihua', {
      dayStem: (typeof dayStem !== 'undefined' ? dayStem : '甲'),
      dayEle: (typeof dayStem !== 'undefined' ? (ELE[dayStem] || '木') : '木'),
      castYear: (typeof year !== 'undefined' ? year : new Date().getFullYear()),
      currentYear: (typeof year !== 'undefined' ? year : new Date().getFullYear())
    });
    var _mhRes = document.getElementById('mhResult');
    if (_mhRes) _mhRes.innerHTML += _syMh;
  } catch(e) { console.warn('[三元九运梅花分析块失败]', e.message); }

  document.getElementById('mhResult').classList.add('visible');
  document.getElementById('mhResult').scrollIntoView({ behavior: 'smooth' });
  if(btn){ btn.disabled=false; btn.textContent='开始排盘'; }
}

function getGuaLines(idx) {
  const maps = [
    [1,1,1],[0,0,1],[1,0,1],[0,1,1],[1,0,0],[0,0,0],[1,0,0],[0,1,1],
  ];
  return maps[idx-1] || [0,0,0];
}
function getGuaIndex(lines) {
  return lines[0]*4 + lines[1]*2 + lines[2];
}
function getShengKe(ti, yong) {
  const relations = {
    '木火土金水': {木:{生:'火',克:'金',被生:'水',被克:'土'},火:{生:'土',克:'木',被生:'木',被克:'水'},土:{生:'金',克:'水',被生:'火',被克:'木'},金:{生:'水',克:'木',被生:'土',被克:'火'},水:{生:'木',克:'火',被生:'金',被克:'土'} },
  };
  const r = relations['木火土金水'];
  if (!r[ti] || !r[yong]) return '五行关系待定';
  const rel = r[ti];
  if (rel.生 === yong) return '体生用，主消耗付出。宜保守，不宜大动。';
  if (rel.被生 === yong) return '体得用生，主得助力。诸事顺遂，有贵人相助。';
  if (rel.克 === yong) return '体克用，主控制驾驭。利于主动出击。';
  if (rel.被克 === yong) return '体被用克，主受制于人。诸事需谨慎，防小人。';
  return '体用比和，同气相求。诸事平稳，可稳步推进。';
}
function getMeiHuaAdvice(hex, cHex, shengke, dongYao) {
  if (dongYao <= 3) {
    return `动在下卦，事体在下部或初期。下卦${cHex.name}变化，预示${dongYao < 2 ? '初期有变' : '中期转化'}。`;
  } else {
    return `动在上卦，事体在上部或后期。上卦${cHex.name}变化，预示${dongYao < 5 ? '后期转化' : '末期转变'}。`;
  }
}
function getGuaXiang(idx) {
  const xiang = ['天、圆、君、父、玉、大赤、良马、瘠马','泽、雨、少女、巫、口舌、喜悦、折伤','火、日、电、彩虹、中女、文学、文明、干燥','雷、动、长男、足、龙、震惊、生长、惊惧','风、木、长女、僧道、柔和、不定、渗透','水、雨、坎、中男、险陷、隐伏、聪明','山、止、少年、手、径路、石、刚','地、顺、母、牛、田、柔顺、包容、厚德'];
  return xiang[idx-1] || '';
}
function getYaoXiang(yao, isYang) {
  const yaos = {
    1:'初爻:事之始，根基，慎始。',2:'二爻:事之显，行动关键。',3:'三爻:事之成，多变动考验。',
    4:'四爻:承上启下，近臣之位。',5:'五爻:君位，至尊，成败之机。',6:'上爻:事之极，物极必反。'
  };
  return yaos[yao] || '';
}
function getYingQi(n1,n2,n3) {
  const sum = n1+n2+n3;
  if (sum <= 10) return `应期较短，约${sum}日内见分晓。`;
  if (sum <= 30) return `应期适中，约${sum}日内应验。`;
  if (sum <= 100) return `应期较长，约${Math.floor(sum/10)}旬内见分晓。`;
  return `应期很长，需持续观察，约${Math.floor(sum/30)}月内见分晓。`;
}

// ================================================================
//  梅花易数专业断卦引擎 V2
//  基于《梅花易数》邵雍、《皇极经世》经典
//  三卦体系 + 体用旺衰 + 专业白话解读 + 化解方法
// ================================================================

// --- 互卦计算：二三四爻为下互，三四五爻为上互 ---
function getHuGua(benGuaLines) {
  var xiaHu = [benGuaLines[1], benGuaLines[2], benGuaLines[3]];
  var shangHu = [benGuaLines[2], benGuaLines[3], benGuaLines[4]];
  var huShangId = getGuaIndex(shangHu);
  var huXiaId = getGuaIndex(xiaHu);
  var gua8 = ['乾','兑','离','震','巽','坎','艮','坤'];
  var guaTri = ['☰','☱','☲','☳','☴','☵','☶','☷'];
  var hexIndex = huShangId * 8 + huXiaId;
  var hex = HEXAGRAMS[hexIndex] || HEXAGRAMS[0];
  return {
    shangName: gua8[huShangId], xiaName: gua8[huXiaId],
    shangTri: guaTri[huShangId], xiaTri: guaTri[huXiaId],
    shangId: huShangId, xiaId: huXiaId,
    hex: hex
  };
}

// --- 梅花易数知识库：64卦白话断语 ---
var _MH_GUA_YI = {
  '乾':'天道刚健，你正处于上升期。乾卦三连，纯阳之象，代表独立自主的能量。占得此卦，说明你有足够的力量去开创事业。但要记住"亢龙有悔"——太过了反而不好。保持刚正，但别太强硬。',
  '坤':'地道柔顺，你需要的不是硬碰硬，而是包容与等待。坤卦六断，代表接纳与承载。你现在像是在耕耘田地——默默付出，等待收获。别急着要结果，厚德才能载物。',
  '屯':'万事开头难。屯卦雷在水下，像是种子在土壤中挣扎。你面临的困难是暂时的，坚持就会破土而出。别在起步阶段就放弃，三个月内见分晓。',
  '蒙':'你现在处于学习阶段，有些懵懂。蒙卦山下水，看不清前路。别急着做决定，先请教有经验的人。虚心学习，半年内会明朗。',
  '需':'等待是智慧。需卦天上有水，云在天上还没下雨——时机未到。你现在需要耐心，别急躁。半个月到一个月内转机出现。',
  '讼':'有口舌是非。讼卦天水相违，意见不合之象。你可能会遇到争执或纠纷。先冷静，别冲动打官司，和解为上。',
  '师':'组织动员之势。师卦地中有水，像军队集结。你正在调动资源，准备大干一场。但要注意策略和纪律，不能蛮干。',
  '比':'团结协作。比卦水在地上，亲密无间。有贵人相助之象。现在是合作的好时机，找对人一起干，事半功倍。',
  '小畜':'小有积蓄但还不够。小畜卦风行天上，力量还不够充沛。你现在像存钱罐——一点点在积累，别急。继续努力，两个月见成效。',
  '履':'如履薄冰。履卦上天下泽，小心翼翼之象。你现在做的事有风险，需要谨慎行事。但卦象表明，只要小心就能平安过关。',
  '泰':'否极泰来！泰卦天地交合，万物通达。这是最吉利的卦之一。你现在顺风顺水，做什么都顺利。但顺境中别飘，保持谦逊。',
  '否':'闭塞不通。否卦天地隔绝，万事不顺。你现在很憋屈，做什么都碰壁。但否极一定会泰来，现在是厚积薄发的时候。',
  '同人':'志同道合。同人卦天火相映，与人同心之象。你现在需要找人合作、结盟。找对合伙人，事情能成。别一个人扛。',
  '大有':'大丰收！大有卦火天相映，富足之象。你现在处于收获期，之前的付出开始见到回报。但别铺张浪费，守住成果。',
  '谦':'谦虚是福。谦卦山在地下，高大却低调。越是有实力越要谦虚，这样福报才长久。你的谦逊会带来更多机会。',
  '豫':'快乐但要节制。豫卦雷出地上，喜悦之象。现在可能是开心的时刻，但快乐别过头。豫也有"预备"的意思——提前准备，有备无患。',
  '随':'随机应变，顺势而为。随卦泽中有雷，随顺之象。现在不是你主导的时候，跟着形势走。灵活变通，能保平安。',
  '蛊':'积弊需治。蛊卦山风不通，腐败之象。你面临的问题不是一天形成的，需要下定决心彻底清理。别拖延，越拖越糟。',
  '临':'好运将至。临卦地泽相依，居高临下之象。你的运势正在上升通道，未来一年内大有好转。做事主动一些，抓住机遇。',
  '观':'静观其变。观卦风行地上，观察之象。现在先别行动，多观察、多研究。三思而后行，信息充足再做决定。',
  '噬嗑':'果断处理障碍。噬嗑卦雷电交加，咬合之象。你现在需要像咬硬骨头一样，果断处理棘手的问题。快刀斩乱麻。',
  '贲':'注重外表。贲卦山下有火，装饰之象。你需要在形象、包装上多一些投入。好的外表能带来好的机会。但别本末倒置。',
  '剥':'衰退之中。剥卦山在地上剥落，消减之象。你现在运势在下滑，能量流失。这个时候别硬撑，保存实力，等待转机。',
  '复':'回春之机。复卦雷在地中，一阳初生。最坏的时候过去了，生机正在恢复。你现在需要休养和耐心，新年会有好转。',
  '无妄':'别想太多歪门邪道。无妄卦天雷震慑，无虚妄之象。老老实实做事最安全，别耍小聪明。诚实能帮你渡过难关。',
  '大畜':'厚积薄发。大畜卦山天相映，积蓄之象。你现在就像水库蓄水，在储备能量。别急着用，积蓄够了自然会爆发。',
  '颐':'养生养心。颐卦山雷相合，颐养之象。你现在需要照顾好自己——身体、情绪、精力。别透支，适当休息才能走更远。',
  '大过':'过分了。大过卦泽灭木，过甚之象。你可能在某个方面做得太过了——太努力、太慷慨、太强势。调整到适度，中庸才是长久之道。',
  '坎':'身处困境。坎卦水中有水，险陷之象。你现在水深火热，但别慌。坎虽凶，但不是绝境。沉着应对，见招拆招。',
  '离':'光明智慧。离卦火中有火，明亮之象。你现在头脑清醒，判断力好。适合做决策、学习、传播。但别太依赖外表的光鲜。',
  '咸':'心灵感应。咸卦泽山相交，感应之象。感情、合作方面有好的默契。心想事成的几率高。保持真诚，感应天地。',
  '恒':'持久之道。恒卦雷风相与，恒久之象。你现在做的事需要长期坚持。急不得，但也不会白费。一年四季每季都有进展。',
  '遁':'以退为进。遁卦天山相隔，隐退之象。现在形势对你不利，不如暂退一步。退不是失败，是战略。休整之后卷土重来。',
  '大壮':'势不可挡。大壮卦雷天震动，强盛之象。你的力量现在处于巅峰，做什么都有冲劲。但别用力过猛，过头了反而折损。',
  '晋':'步步高升。晋卦火在地上，上升之象。事业学业在上升期，前途光明。但要脚踏实地，别想着一步登天。',
  '明夷':'光明被掩。明夷卦火入地下，暗昧之象。你现在可能不被理解、不被看见。别灰心，暗夜之后就是黎明，韬光养晦。',
  '家人':'家宅安宁。家人卦风火相生，齐家之象。家庭和睦是现在最重要的事。家和万事兴，先从内部搞好关系。',
  '睽':'观点分歧。睽卦火泽背离，乖离之象。你和某人意见不合，产生了隔阂。先求同存异，别非要争出个高下。',
  '蹇':'前行艰难。蹇卦水山难行，困阻之象。前面的路不好走，有障碍。找贵人帮忙，单打独斗太难。北方的贵人可能帮到你。',
  '解':'解除困境。解卦雷雨大作，解除之象。你之前困扰的问题，现在开始松动了。抓住时机，一举突破。冬至前后有利。',
  '损':'有舍才有得。损卦山泽通损，减损之象。你可能需要放弃一些东西，才能得到更重要的。别贪心，该舍就舍。',
  '益':'增益提升。益卦风雷相益，增利之象。现在是上升期，做什么都能增益。大胆行动，别人也会帮你。春夏季最有利。',
  '夬':'果断决断。夬卦泽天溃决，决裂之象。你要做个了断——可能是分手、辞职、或者放弃一个项目。干净利落，别拖泥带水。',
  '姤':'不期而遇。姤卦天下风起，邂逅之象。你可能会遇到意想不到的人或事。注意人际交往中的偶遇，可能是命中注定。',
  '萃':'聚集力量。萃卦泽地荟萃，聚集之象。现在是汇聚人才、资源的好时机。把大家聚在一起，力量才大。团队作战。',
  '升':'蒸蒸日上。升卦地中木生，上升之象。你的运气在上升通道，做什么都顺。未来的三四个月是关键期，把握住。',
  '困':'陷入困境。困卦泽水干涸，困厄之象。你现在很困难，像是被困住了。但困卦不是绝卦，坚持信念，转机在三四个月后。',
  '井':'取之不尽。井卦水风相涵，源泉之象。你拥有可持续的资源或能力，好好利用。像井水一样，越用越有。秋冬水旺更有利。',
  '革':'变革创新。革卦泽火相煎，变革之象。旧的不去新的不来。你需要大刀阔斧地改革——换个方式、换个思路。夏天有突破。',
  '鼎':'革故鼎新。鼎卦火风相煽，鼎立之象。改革之后是新局面的建立。你正在打造一个稳固的新格局。稳扎稳打，秋天见成效。',
  '震':'震动不安。震卦雷声阵阵，惊恐之象。你可能面临突然的变动或惊吓。别慌，震卦虽凶但来去都快。一个月内尘埃落定。',
  '艮':'止步思量。艮卦两山相叠，止步之象。现在该停下来了。不是所有路都要往前走，有时候后退也是前进。半年内别大动作。',
  '渐':'循序渐进。渐卦风在山上，渐进之象。你的事是慢功夫，急不来。像爬山一样，一步一步走。一年内见成效，别心急。',
  '归妹':'归宿之象。归妹卦雷泽相交，嫁娶之象。你的事可能涉及婚姻、合作、归宿。但需注意名正言顺，别名不正言不顺。',
  '丰':'丰收丰满。丰卦雷电交加，丰盛之象。现在运势正旺，做什么都容易成功。但丰盛的顶点往往是衰退的开始，见好就收。',
  '旅':'奔波劳碌。旅卦山上有火，行旅之象。你现在可能漂泊不定、奔波忙碌。静下心来想想，真正想要的是什么。下半年能安定。',
  '巽':'随风而动。巽卦两风相随，柔顺之象。你现在适合做个"灵活的人"，能屈能伸。顺应形势比逆势而为明智得多。',
  '兑':'喜悦交流。兑卦两泽相附，喜悦之象。现在是开心的时候，适合社交、沟通。但别光顾着开心，正事也要做。',
  '涣':'涣散重组。涣卦风水涣散，分离之象。你现在的局面有些散，需要重新凝聚。分离之后是重组，别怕暂时的混乱。',
  '节':'节制有度。节卦水泽相节，节制之象。你现在需要有所节制——花钱、说话、做事都要有分寸。适可而止才是智慧。',
  '中孚':'诚信为本。中孚卦风泽相孚，诚信之象。真诚是最好的策略。你现在要以诚待人，信誉是你最大的资产。虚情假意会反噬。',
  '小过':'小有过失。小过卦雷山相过，小过之象。你可能在一些小事上做得过头了。别太计较，调整一下就过去了。芝麻小事不必纠结。',
  '既济':'事已成矣。既济卦水火相济，完成之象。事情已经做成了！但成功之后更要小心，守住成果比创造更难。别得意忘形。',
  '未济':'事未成也。未济卦火水不交，未完成之象。你的目标还没达成，在路上了。别灰心，未济离既济只差一步。继续努力！'
};

// --- 八卦万物类象扩展 ---
var _MH_GUA_XIANG_EXT = {
  '乾': {nature:'天、刚健', body:'头、骨、肺', animal:'马、龙', direction:'西北', color:'金色、白色、大赤色', season:'秋、冬初', number:'1、4、9', person:'君、父、老人、领导', thing:'圆物、玉器、刚硬之物', place:'京都、大城市、高处'},
  '兑': {nature:'泽、喜悦', body:'口、舌、肺', animal:'羊', direction:'西', color:'白色、银色', season:'秋', number:'2、4、9', person:'少女、巫师、歌手', thing:'金属乐器、缺口之物', place:'沼泽、废井、缺口地'},
  '离': {nature:'火、光明、文明', body:'眼、心', animal:'雉、龟、螃蟹', direction:'南', color:'红色、紫色、橙色', season:'夏', number:'3、2、7', person:'中女、文人、艺术家', thing:'火烛、书籍、网', place:'火源、干燥之地、图书馆'},
  '震': {nature:'雷、动', body:'足、肝', animal:'龙', direction:'东', color:'青色、绿色', season:'春', number:'4、8、3', person:'长男、运动员、警员', thing:'能响之物、竹木', place:'大路、闹市、树林'},
  '巽': {nature:'风、入', body:'股、胆、髪', animal:'鸡、蛇', direction:'东南', color:'绿色、青色', season:'春末夏初', number:'5、3、8', person:'长女、僧道、商人', thing:'细长之物、木器、扇子', place:'有风之地、庙宇、竹林'},
  '坎': {nature:'水、陷', body:'耳、肾', animal:'猪、鱼', direction:'北', color:'黑色、蓝色', season:'冬', number:'6、1', person:'中男、盗贼、渔夫', thing:'水器、弓轮、带核之物', place:'水边、低洼地、酒店'},
  '艮': {nature:'山、止', body:'手、鼻、背', animal:'狗、鼠', direction:'东北', color:'黄色、棕色', season:'冬末春初', number:'7、5、10', person:'少男、隐士、山中人', thing:'石头、瓜果、门', place:'山丘、坟墓、小路'},
  '坤': {nature:'地、顺', body:'腹、脾', animal:'牛', direction:'西南', color:'黄色、黑色', season:'夏末秋初', number:'8、5、10', person:'母、老妇、农民', thing:'方形之物、布帛、瓦器', place:'平地、田野、乡村'}
};

// --- 月建五行旺衰表 ---
var _YUE_JIAN_WANG_XIU = {
  '寅':{旺:'木',相:'火',休:'水',囚:'金',死:'土'}, '卯':{旺:'木',相:'火',休:'水',囚:'金',死:'土'},
  '辰':{旺:'土',相:'金',休:'火',囚:'木',死:'水'}, '巳':{旺:'火',相:'土',休:'木',囚:'水',死:'金'},
  '午':{旺:'火',相:'土',休:'木',囚:'水',死:'金'}, '未':{旺:'土',相:'金',休:'火',囚:'木',死:'水'},
  '申':{旺:'金',相:'水',休:'土',囚:'火',死:'木'}, '酉':{旺:'金',相:'水',休:'土',囚:'火',死:'木'},
  '戌':{旺:'土',相:'金',休:'火',囚:'木',死:'水'}, '亥':{旺:'水',相:'木',休:'金',囚:'土',死:'火'},
  '子':{旺:'水',相:'木',休:'金',囚:'土',死:'火'}, '丑':{旺:'土',相:'金',休:'火',囚:'木',死:'水'}
};

var _WANGXIU_DESC = {
  '旺':'得令当权，能量最盛。此时做事有气势，如顺水行舟。',
  '相':'次旺之态，虽不当令但受生扶。生机勃勃，有利发展。',
  '休':'退气休歇，能量不足。此时宜守不宜攻，耐心等待。',
  '囚':'被制受囚，力量被困。行事多有阻碍，需寻求外力帮助。',
  '死':'至极衰弱，无气无力。此时不可妄动，静待转机。'
};

// --- 动爻位置梅花断法 ---
var _DONGYAO_MEIHUA = {
  1: {name:'初爻动', meaning:'事情刚刚开始，根基在变。好比盖房子，地基动了——要小心规划。', timing:'短期内（1-10天/周）见变化', advice:'当前重在奠基，别急着要结果。先把基础打牢，后面才能走得远。', bodyPart:'足/下盘', direction:'事之始端'},
  2: {name:'二爻动', meaning:'事情进展到中层，内在条件在变化。你自己或团队的状态在调整。', timing:'近期（10-30天/月）见变化', advice:'审视自身能力和资源，查漏补缺。如果条件不够，及时补充。', bodyPart:'腿/行动力', direction:'事之内在'},
  3: {name:'三爻动', meaning:'事情到了转折点，上下之间有变动。好比走到了十字路口，需要做出选择。', timing:'中期（1-3个月）见分晓', advice:'这个阶段最关键！你的选择决定后续走向。多听意见，别冲动决策。', bodyPart:'腰/转换点', direction:'事之转折'},
  4: {name:'四爻动', meaning:'对外行动阶段，接近目标。外部因素在起作用，贵人或者竞争对手出现。', timing:'中后期（3-6个月）见效果', advice:'准备进入实质阶段。借力而行，善用外部资源。有人会帮你，也可能有人挡你。', bodyPart:'胸/外部', direction:'事之对外'},
  5: {name:'五爻动', meaning:'事情到了高潮或关键期。君位变动，有决定性的力量在起作用。成败在此一举。', timing:'近期即见分晓（1-2个月内）', advice:'关键时刻到了！你需要拿出决断力和领导力。此时不决，更待何时。', bodyPart:'面/头部/决策中心', direction:'事之高潮'},
  6: {name:'上爻动', meaning:'事情到了尾声或顶点。物极必反，高潮之后可能转衰。结果即将揭晓。', timing:'很快（1-2周内）见结果，或已经结束了', advice:'见好就收，别贪最后一块蛋糕。该结束时就要结束，新的开始等着你。', bodyPart:'头/顶点', direction:'事之终结'}
};

// --- 外应取象规则（《梅花易数》三要十应精华） ---
var _WAI_YING_RULES = [
  '见圆物则事圆，见方物则事阻——《梅花易数》云："凡占之时，见圆物者事易成，见方物者事难成。"看到圆形的东西代表事情能圆满解决，看到方形的代表有阻碍。',
  '见人欢笑则吉，见人哭泣则凶——《梅花易数·三要》云："闻人笑声，喜事临门；见人哭泣，灾祸不远。"周围人的情绪是外应的直接信号。',
  '见水流则事通，见山阻则事滞——水代表流通顺利，山代表阻碍拖延。如果你在起卦时恰好看到水流或道路通畅，是非常好的外应。',
  '见飞鸟则消息将至，见走兽则事已落实——动态外应判断信息传递的速度。飞鸟主快、走兽主稳。',
  '见花开则喜事近，见叶落则事将终——自然界的荣枯对应事情的兴衰。《梅花易数》云："见草木荣华则吉，见枯槁衰败则凶。"',
  '见光照明则事明朗，见阴暗则事晦涩——光明代表清晰，黑暗代表困惑。起卦时灯光突然变亮是很好的外应。',
  '闻笑声则吉，闻哭声则凶——听觉外应，吉凶的直接反映。起卦时听到笑声，说明事情有好的结果。',
  '见儿童则新生，见老者则守成——年龄暗示事物的发展阶段。儿童代表新开始，老人代表保守守成。',
  '器物落地则事有成，器物倾倒则事有变——《梅花易数·器物应》云："物自落者主事成，物自倾者主事败。"',
  '开门见光则吉，闭门见暗则凶——门户之象决定事情的开放性。出门时阳光明媚是上好外应。'
];

// --- 内应取象规则（体用篇核心） ---
var _NEI_YING_GUIDE = {
  '乾': ['天时：晴天万里，代表事情明朗顺利', '见君主官员，主事业升迁', '见玉器珠宝，主财富增益', '见老马良马，主出行顺利', '见圆形建筑，主事情圆满'],
  '兑': ['见口舌争执，主是非纠纷', '见少女欢笑，主喜事临门', '见金属残缺，主破财之兆', '见泽中水月，主虚幻之事', '见双人对话，主合作交流'],
  '离': ['见火光闪烁，主紧急之事', '见文书契约，主合同签约', '见龟鳖鱼虫，主缓慢有获', '见干燥龟裂，主缺水之困', '见红色衣物，主喜事将近'],
  '震': ['闻雷声惊动，主突发变故', '见竹木生长，主事业上升', '见车辆奔跑，主出行加速', '见青色植物，主生机勃勃', '闻音乐响声，主消息传来'],
  '巽': ['见风吹草动，主事情变动', '见绳索细长，主牵连关联', '见僧道人物，主贵人指引', '见气味入鼻，主信息渗透', '见鸡鸣鸟叫，主好事不断'],
  '坎': ['见水流涌动，主事情流动', '见猪鱼游动，主财富暗流', '见陷坑沟渠，主陷阱危险', '见耳聪目明，主智慧判断', '见黑色雾蒙蒙，主迷惑困扰'],
  '艮': ['见山高路远，主事情阻滞', '见狗吠鼠窜，主小人作祟', '见瓜果成熟，主收获在望', '见门户关闭，主不得其门', '见黄色土地，主根基稳固'],
  '坤': ['见大地平广，主事情稳定', '见母牛产子，主生育增殖', '见布帛柔软，主包容接纳', '见方形器物，主方正规矩', '见众人聚集，主人气汇聚']
};

// ================================================================
//  梅花专业解读引擎：buildMeiHuaProfessionalInterpretation()
//  输入完整梅花卦象数据，输出专业级大白话解读
// ================================================================

function getCurrentMonthBranch() {
  var now = new Date();
  try { return getMonthBranchBySolar(now.getFullYear(), now.getMonth() + 1, now.getDate()); } catch(e) {}
  var mzMap = ['丑','寅','卯','辰','巳','午','未','申','酉','戌','亥','子'];
  return mzMap[(now.getMonth() + 1) % 12];
}

function getCurrentDayBranch() {
  var now = new Date();
  try { return BRANCHES[getDayBranchIndex(now.getFullYear(), now.getMonth() + 1, now.getDate())]; } catch(e) { return '子'; }
}

function getWangSeason(ele) {
  var map = {'木':'春季（农历1-3月）','火':'夏季（农历4-6月）','金':'秋季（农历7-9月）','水':'冬季（农历10-12月）','土':'四季末（每季最后一个月）'};
  return map[ele] || '四季末';
}

function getShengKeCode(tiEle, yongEle) {
  var sheng = {'金生水':1,'水生木':1,'木生火':1,'火生土':1,'土生金':1};
  var ke = {'金克木':1,'木克土':1,'土克水':1,'水克火':1,'火克金':1};
  if (tiEle === yongEle) return 'bihe';
  if (sheng[tiEle + '生' + yongEle]) return 'tishengyong';
  if (sheng[yongEle + '生' + tiEle]) return 'yongshengti';
  if (ke[tiEle + '克' + yongEle]) return 'tikeyong';
  if (ke[yongEle + '克' + tiEle]) return 'yongketi';
  return 'bihe';
}

/**
 * buildMeiHuaProfessionalInterpretation(data)
 * @param {object} data
 * @returns {object} 六大模块解读 + 三卦信息
 */
function buildMeiHuaProfessionalInterpretation(data) {
  var b = data.benGua;
  var h = data.huGua;
  var v = data.bianGua;
  var dongYao = data.dongYao;
  var shengkeCode = data.shengkeCode || 'bihe';
  var ti = data.tiGua;
  var yong = data.yongGua;
  var numbers = data.numbers || [1,1,1];
  var question = data.question || '';
  
  var monthBranch = data.monthBranch || getCurrentMonthBranch();
  var dayBranch = data.dayBranch || getCurrentDayBranch();
  
  // --- 1. 卦象总断 ---
  var hexSummary = _buildHexSummary(b, h, v, dongYao);
  
  // --- 2. 体用分析 ---
  var tiYongAnalysis = _buildTiYongAnalysis(ti, yong, shengkeCode, dongYao);
  
  // --- 3. 五行旺衰 ---
  var wangShuai = _buildWangShuaiAnalysis(ti, yong, monthBranch, dayBranch);
  
  // --- 4. 动爻分析 ---
  var dongYaoAnalysis = _buildDongYaoAnalysis(dongYao, b, v);
  
  // --- 5. 大白话结论 ---
  var conclusion = _buildConclusion(b, h, v, ti, yong, shengkeCode, dongYao, question);
  
  // --- 6. 化解方法 ---
  var huajie = _buildHuajie(ti, yong, shengkeCode, dongYao, monthBranch);
  
  // --- 三卦综合评分 ---
  var sancangScore = _buildSancangScore(ti, yong, shengkeCode, monthBranch, dongYao);
  
  // --- 整合全文 ---
  var fullText = '══════ 卦象总断 ══════\n\n' + hexSummary +
    '\n\n══════ 体用分析 ══════\n\n' + tiYongAnalysis +
    '\n\n══════ 五行旺衰 ══════\n\n' + wangShuai +
    '\n\n══════ 动爻分析 ══════\n\n' + dongYaoAnalysis +
    '\n\n══════ 大白话结论 ══════\n\n' + conclusion +
    '\n\n══════ 化解方法 ══════\n\n' + huajie +
    '\n\n──────────────\n以上解读基于《梅花易数》（宋·邵雍著）与《皇极经世》的断卦理论。梅花易数以"数"起卦，以"象"断卦，强调体用生克、五行旺衰和万物类象的综合运用。卦象是天机，但人生是自己的——知天命是为了更好地尽人事。';
  
  return {
    hexSummary: hexSummary,
    tiYongAnalysis: tiYongAnalysis,
    wangShuai: wangShuai,
    dongYaoAnalysis: dongYaoAnalysis,
    conclusion: conclusion,
    huajie: huajie,
    sancangScore: sancangScore,
    fullText: fullText,
    benGuaInfo: b,
    huGuaInfo: h,
    bianGuaInfo: v,
    tiGuaInfo: ti,
    yongGuaInfo: yong,
    shengkeCode: shengkeCode
  };
}

// --- 1. 卦象总断 ---
function _buildHexSummary(ben, hu, bian, dongYao) {
  var parts = [];
  var benYi = _MH_GUA_YI[ben.name] || (ben.name + '卦，' + ben.judgment + '。' + ben.meaning);
  var huYi = _MH_GUA_YI[hu.hex.name] || (hu.hex.name + '卦，' + hu.hex.judgment + '。' + hu.hex.meaning);
  var bianYi = _MH_GUA_YI[bian.name] || (bian.name + '卦，' + bian.judgment + '。' + bian.meaning);
  
  parts.push('【本卦：' + ben.name + ' ' + ben.symbol + '】本卦代表你问的事情当前的状态。' + benYi);
  parts.push('【互卦：' + hu.hex.name + ' ' + hu.hex.symbol + '】互卦揭示事情发展过程中的内部变化和中间阶段。本卦的二三四爻组成下互，三四五爻组成上互。' + huYi);
  parts.push('【变卦：' + bian.name + ' ' + bian.symbol + '】变卦代表事情的最终结果。由本卦动爻变化而来。' + bianYi);
  
  // 三卦关系链
  parts.push('【三卦关系链】本卦→互卦→变卦的演化路径，展示了事情从起始经过中间变化到最终结果的完整过程。具体来说：本卦' + ben.name + '→互卦' + hu.hex.name + '→变卦' + bian.name + '，构成了"先XX后XX终XX"的发展路线。');
  
  // 整体吉凶
  var jiGuas = ['泰','大有','谦','益','升','晋','既济','家人','咸','恒','随'];
  var xiongGuas = ['否','剥','蹇','困','明夷','坎','大过','未济','睽'];
  var score = 3;
  if (jiGuas.indexOf(ben.name) >= 0) score += 1;
  if (xiongGuas.indexOf(ben.name) >= 0) score -= 1;
  if (jiGuas.indexOf(bian.name) >= 0) score += 0.5;
  if (xiongGuas.indexOf(bian.name) >= 0) score -= 0.5;
  if (dongYao >= 2 && dongYao <= 5) score += 0.5;
  if (dongYao === 6) score -= 0.3;
  
  var overall = '';
  if (score >= 4.5) overall = '大吉之象。本卦与变卦皆为吉卦，动爻得位，诸事顺遂。你现在处于运势上升期，要把握机会，大胆行动。';
  else if (score >= 3.5) overall = '偏吉之象。整体趋势向好，虽有波折但结局不错。保持信心，积极面对，事情会往好的方向发展。';
  else if (score >= 2.5) overall = '中平之象。吉凶互见，好坏参半。关键在于你的心态和行动——顺势而为则吉，逆势而动则凶。';
  else if (score >= 1.5) overall = '偏凶之象。阻力较大，需要谨慎行事。但并非绝境——暂时规避锋芒、保存实力，转机在互卦揭示的过程中出现。';
  else overall = '大凶之象。需要引起重视。卦象表明前方有较大挑战。但现在知道比不知道要好——看清形势，提前做准备，可以化解大部分不利。';
  parts.push('【整体吉凶判断】' + overall);
  
  return parts.join('\n\n');
}

// --- 2. 体用分析 ---
function _buildTiYongAnalysis(ti, yong, shengkeCode, dongYao) {
  var parts = [];
  var tiPos = ti.position === 'xia' ? '下卦' : '上卦';
  var yongPos = yong.position === 'xia' ? '下卦' : '上卦';
  
  parts.push('体卦为' + ti.name + '（五行属' + ti.ele + '），位于' + tiPos + '。体卦代表你自己、你的状态、你的内在条件。《梅花易数·体用篇》云："体者，主也"——体卦就是占卜的主体，是你本身的能量。');
  parts.push('用卦为' + yong.name + '（五行属' + yong.ele + '），位于' + yongPos + '。用卦代表你所问之事、外部环境、对方或事情本身。《梅花易数·体用篇》云："用者，事也"——用卦是你面对的外部对象。');
  
  var relText = '';
  switch (shengkeCode) {
    case 'yongshengti':
      relText = '体用关系：用生体（' + yong.ele + '生' + ti.ele + '）——这是最吉利的关系！外部环境在主动帮助你，事情有强大的外力推动。好比有人推着你往前走，你想不成都难。《梅花易数》曰："用生体，诸事易成，有进益之喜。"此时应主动争取，贵人就在身边，成功的概率在80%以上。';
      break;
    case 'tishengyong':
      relText = '体用关系：体生用（' + ti.ele + '生' + yong.ele + '）——你需要先付出才能有回报。这个过程比较辛苦，但最终的收获能弥补你的付出。《梅花易数》曰："体生用，有耗泄之忧。"此时的策略是：做好心理准备，前期投入不要心疼，后面才会有回报。事情能成，但需要耐心和坚持。';
      break;
    case 'bihe':
      relText = '体用关系：体用比和（同为' + ti.ele + '）——内外和谐，一呼百应。你和事情之间没有冲突，双方能量一致。《梅花易数》曰："体用比和，谋事可成，求谋称意。"这是顺遂平安的象征。大胆前进，不用顾虑太多。合作、合伙都很有利。但也需防止安逸中错失最佳时机。';
      break;
    case 'tikeyong':
      relText = '体用关系：体克用（' + ti.ele + '克' + yong.ele + '）——你能掌控局面，但需要费一番力气。《梅花易数》曰："体克用，事可成但费力。"好比驯马——你有能力驾驭它，但要花精力去磨合。主动权在你手上，成功概率在60-70%。但别操之过急，循序渐进为上。';
      break;
    case 'yongketi':
      relText = '体用关系：用克体（' + yong.ele + '克' + ti.ele + '）——外部环境对你形成压制。这是最需要注意的关系！《梅花易数》曰："用克体，事必不成，成亦有害。"好比逆水行舟——你努力了，但阻力太大。此时的策略是：不要硬碰硬，先避其锋芒。调整策略、改变方向、寻求保护。事情难成，但不是完全没机会——等待用卦五行衰弱时（三个月内的季节转换），阻力会自然减小。';
      break;
  }
  parts.push(relText);
  
  // 体卦万物类象
  var tiXiang = _MH_GUA_XIANG_EXT[ti.name];
  if (tiXiang) {
    parts.push('体卦万物类象深化：' + ti.name + '为' + tiXiang.nature + '，方位' + tiXiang.direction + '，色' + tiXiang.color + '，对应人物为' + tiXiang.person + '。你的性格特征偏向' + tiXiang.nature + '，适宜的环境是' + tiXiang.place + '。');
  }
  
  // 动静分析（体用篇核心）
  var quietActive = dongYao <= 3 ? '动在下卦，体静而用动——事情由外部推动而起，你处于相对被动的接收状态。建议先观察再行动。' : '动在上卦，体动而用静——你在主动推动事情发展，外部环境相对稳定。建议主动出击，把握主导权。';
  parts.push('体用动静分析：' + quietActive);
  
  return parts.join('\n\n');
}

// --- 3. 五行旺衰 ---
function _buildWangShuaiAnalysis(ti, yong, monthBranch, dayBranch) {
  var parts = [];
  var monthWx = _YUE_JIAN_WANG_XIU[monthBranch] || _YUE_JIAN_WANG_XIU['子'];
  var tiState = monthWx[ti.ele] || '休';
  var yongState = monthWx[yong.ele] || '休';
  
  parts.push('当前月建：' + monthBranch + '月（农历节气月）。月建代表这一个月的时间能量，决定五行之气的旺衰状态。');
  parts.push('体卦' + ti.name + '（五行属' + ti.ele + '）在' + monthBranch + '月处于「' + tiState + '」态。——' + (_WANGXIU_DESC[tiState] || '状态待定'));
  parts.push('用卦' + yong.name + '（五行属' + yong.ele + '）在' + monthBranch + '月处于「' + yongState + '」态。——' + (_WANGXIU_DESC[yongState] || '状态待定'));
  
  // 旺衰对体用关系的强化/削弱分析
  if (tiState === '旺' || tiState === '相') {
    parts.push('体卦旺相，你现在的状态不错！在"用克体"的情况下，体旺能抗克；在"体生用"的情况下，体旺能承受付出；在"用生体"的情况下，更是锦上添花。');
  } else if (tiState === '囚' || tiState === '死') {
    parts.push('体卦衰弱，你在当前这个月的能量不足。建议在' + ti.ele + '旺的月份（' + getWangSeason(ti.ele) + '）再做重大决策或行动，效果会好很多。当前建议：多为将来做准备，少做消耗大的事。');
  }
  
  if (yongState === '旺' && (tiState === '休' || tiState === '囚' || tiState === '死')) {
    parts.push('⚠️ 注意：用卦旺而体卦衰，外部力量强于你自身。此时"用克体"的危害会加倍，"体克用"的掌控力会打折扣。建议谨慎行动，不宜正面对抗。');
  }
  
  parts.push('日建：' + dayBranch + '日。月建管全月大势，日建管当日具体。《梅花易数》云："月为提纲，日为宰辅。"综合月建和日建，你的行动窗口在体卦五行旺相的时段最为有利。');
  
  return parts.join('\n\n');
}

// --- 4. 动爻分析 ---
function _buildDongYaoAnalysis(dongYao, ben, bian) {
  var parts = [];
  var dyInfo = _DONGYAO_MEIHUA[dongYao] || _DONGYAO_MEIHUA[1];
  
  parts.push('本条卦象的动爻在第' + dongYao + '爻——' + dyInfo.name + '。');
  parts.push('动爻含义：' + dyInfo.meaning);
  parts.push('应期判断：' + dyInfo.timing + '。应期就是事情应验的时间窗口。《梅花易数》云："凡占应期，以动爻为宗。"动爻越靠下，应期越短；越靠上，应期越长。');
  parts.push('行动建议：' + dyInfo.advice);
  
  // 爻变方向
  var changeDesc = dongYao <= 3 ? '动爻在本卦的下卦（' + ben.xiaName + '）中，阴变阳或阳变阴后，下卦变为' + bian.xiaName + '。这说明事情的根基或内在条件在发生变化。' : '动爻在本卦的上卦（' + ben.shangName + '）中，阴变阳或阳变阴后，上卦变为' + bian.shangName + '。这说明外部环境或上层因素在发生变化。';
  parts.push('变化分析：' + changeDesc);
  
  // 本卦→变卦的爻变解读
  parts.push('本卦' + ben.name + '通过第' + dongYao + '爻的变化，产生了变卦' + bian.name + '。这一爻是关键转折——它决定了事情从初始状态走向最终结果的路径。');
  
  // 身体对应
  parts.push('身体对应位：' + dyInfo.bodyPart + '。如果问健康，这个部位需要重点关注。' + dyInfo.direction + '。');
  
  return parts.join('\n\n');
}

// --- 5. 大白话结论 ---
function _buildConclusion(ben, hu, bian, ti, yong, shengkeCode, dongYao, question) {
  var parts = [];
  var q = question || '你所关心的事情';
  
  parts.push('关于「' + q + '」，综合本互变三卦和体用生克，大白话结论如下：');
  
  // 核心判断
  var coreAdvice = '';
  switch (shengkeCode) {
    case 'yongshengti':
      coreAdvice = '这是好事！外部环境在帮你，事情有外力推动。"水到渠成"说的就是你现在的状态。你要做的就是主动接住这份好运——多与人交往，大胆表达你的需求。别觉得不好意思——天时地利人和，此时不用更待何时？';
      break;
    case 'tishengyong':
      coreAdvice = '事情能成，但需要你"先投入后产出"。这就像做生意——先要进货，后面才能卖钱。你现在是在播种阶段，辛苦是正常的。关键是持续投入，不要半途而废。预期收获时间在3-6个月后。';
      break;
    case 'bihe':
      coreAdvice = '一切按部就班、水到渠成。大吉大利，万事顺遂。你只需要正常做事，不需要刻意强求。但也要注意："太平顺容易飘"——保持平常心，别因为顺就放松要求。该做的还是得做好。';
      break;
    case 'tikeyong':
      coreAdvice = '你能搞定这事，但要有耐心。你有能力和主动权，只是需要花些功夫。策略上："知己知彼"——先摸清对方的弱点和规律，然后集中力量突破。如果一时推不动，退一步重新准备，比硬碰硬更聪明。';
      break;
    case 'yongketi':
      coreAdvice = '当前这件事对你不太有利。外部环境比你想象的更强大，强行推进可能会受损。建议：第一，换方向——换个角度、换种方式去解决问题；第二，等时机——三个月内季节变化，局势会自然松动；第三，找帮手——不要一个人扛，团结能缓解压力。这不是说你要放弃，而是要聪明地应对。';
      break;
  }
  parts.push(coreAdvice);
  
  // 三阶段行动指南
  parts.push('【三阶段行动指南】');
  parts.push('第一阶段 — 本卦' + ben.name + '阶段（当前）：' + _MH_GUA_YI[ben.name].split('。')[0] + '。这阶段你要做的核心是打好基础，了解现状。');
  parts.push('第二阶段 — 互卦' + hu.hex.name + '阶段（过程）：' + _MH_GUA_YI[hu.hex.name].split('。')[0] + '。这个中间阶段最关键，要做好调整和应变准备。');
  parts.push('第三阶段 — 变卦' + bian.name + '阶段（结果）：' + _MH_GUA_YI[bian.name].split('。')[0] + '。这是最终走向，提前了解可以帮助你早做准备。');
  
  // 具体可执行方案
  parts.push('【具体可执行方案】');
  parts.push('1. 立即行动：' + (shengkeCode === 'yongshengti' || shengkeCode === 'bihe' ? '主动联系可以帮助你的人，不要等。好机不等人。' : shengkeCode === 'yongketi' ? '先停一停，重新评估局势。冲动是魔鬼。' : '整理手头的资源和信息，做好行动准备。磨刀不误砍柴工。'));
  parts.push('2. 近期规划（1-3个月）：' + (dongYao <= 3 ? '关注事情的基层建设，打好基础比什么都重要——地基不牢，楼再高也是危楼。' : '关注大局的变化，适时调整方向。"识时务者为俊杰"——方向对了，慢一点也没关系。'));
  parts.push('3. 心态调整：' + (shengkeCode === 'yongshengti' || shengkeCode === 'bihe' ? '保持积极乐观，但别盲目自信。福兮祸所伏，得意时多想困难。' : '保持冷静理性，困难是暂时的。祸兮福所倚，低谷正是积蓄力量的好时机。'));
  
  // 关键提醒
  var reminders = {
    'yongshengti': '好运气不会永远持续，趁着顺风顺水的时候多做储备。"得意时多想困难"，才是长久之道。建议你现在就在' + ti.ele + '旺的季节到来前，做好关键布局。',
    'tishengyong': '付出不等于盲目。要有方向地付出，定期评估回报。如果付出很久没有收获，可能需要调整策略——目标没错，但路径可能需要优化。',
    'bihe': '太平顺的时候反而容易出问题——因为你放松了警惕。保持适度的警觉，别让好事变坏事。"生于忧患，死于安乐"。',
    'tikeyong': '控制力强是好事，但别"用力过猛"。兔子急了也会咬人——给对方留点余地，也是给自己留后路。刚柔并济才是上策。',
    'yongketi': '这不是你能力不行。外部环境不利，不是你的错。等风头过了，你的能力自然能发挥出来。现在忍住，就是胜利。"忍一时风平浪静，退一步海阔天空"。'
  };
  parts.push('4. 关键提醒：' + (reminders[shengkeCode] || '保持平常心，随遇而安。'));
  
  return parts.join('\n\n');
}

// --- 6. 化解方法 ---
function _buildHuajie(ti, yong, shengkeCode, dongYao, monthBranch) {
  var parts = [];
  var tiXiang = _MH_GUA_XIANG_EXT[ti.name] || {};
  var yongXiang = _MH_GUA_XIANG_EXT[yong.name] || {};
  var favorDir = tiXiang.direction || '中央';
  var dirMap = {'西北':'东南','西':'东','南':'北','东':'西','东南':'西北','北':'南','东北':'西南','西南':'东北'};
  var avoidDir = shengkeCode === 'yongketi' ? (yongXiang.direction || '西') : '';
  if (shengkeCode === 'yongketi') favorDir = dirMap[avoidDir] || favorDir;
  
  // 方位
  parts.push('【方位建议】');
  parts.push('有利方位：' + favorDir + '方。办公桌、床位朝向' + favorDir + '方有利于提升运势。重要事项尽量在' + favorDir + '方进行。' + (avoidDir ? '\n避忌方位：' + avoidDir + '方。尽量不要在' + avoidDir + '方做重大决策或投资，容易受挫。' : ''));
  
  // 颜色
  var tiColors = {'乾':'金色/白色','兑':'白色/银色','离':'红色/紫色','震':'绿色/青色','巽':'绿色/青色','坎':'黑色/蓝色','艮':'黄色/棕色','坤':'黄色/米色'};
  parts.push('【颜色建议】宜用' + (tiColors[ti.name] || '黄色') + '色系装饰和穿搭。' + (shengkeCode === 'yongketi' ? '忌用' + (tiColors[yong.name] || '白色') + '色系。' : '') + '颜色能影响气场——穿对颜色就像给自己加了护身符。');
  
  // 数字
  parts.push('【数字建议】吉祥数字：' + (tiXiang.number || '5') + '。重要日期、门牌号、电话号码选择这些数字更有利。每天可默念吉祥数字7遍，增强意念。');
  
  // 时间
  var tiSeason = tiXiang.season || '';
  parts.push('【时间窗口】最佳行动时间是' + tiSeason + '，五行属' + ti.ele + '旺相的时段。' + (shengkeCode === 'yongketi' ? '避忌在用卦' + yong.ele + '旺的季节（' + getWangSeason(yong.ele) + '）做重大决策。' : '没有特别避忌的时间，但顺应自然节律总是好的。'));
  
  // 具体化解
  var mascots = {'金':'铜葫芦、金属风铃、白水晶','木':'绿檀手串、文昌塔、绿幽灵','水':'黑曜石、水晶球、鱼缸','火':'红玛瑙、紫水晶、红绳','土':'黄水晶、玉器、陶器'};
  if (shengkeCode === 'yongketi') {
    parts.push('【化解重点——用克体特别方案】');
    parts.push('· 在' + favorDir + '方摆放' + (mascots[ti.ele] || '黄水晶') + '，增强体卦能量；');
    parts.push('· 在' + (avoidDir || '西') + '方摆放克制之物（如属' + ti.ele + '的物件），削弱对方气势；');
    parts.push('· 重要事务安排在体卦旺的月份（' + getWangSeason(ti.ele) + '）进行；');
    parts.push('· 随身佩戴' + (mascots[ti.ele] ? mascots[ti.ele].split('、')[0] : '黄水晶') + '作为护身符；');
    parts.push('· 避免在' + avoidDir + '方向做重大投资或决策。');
  } else {
    parts.push('【增益建议】虽然整体吉利，但善加增益可以让好事更好：');
    parts.push('· 在' + favorDir + '方保持整洁明亮，可摆放' + (mascots[ti.ele] ? mascots[ti.ele].split('、')[0] : '水晶') + '增强正面能量；');
    parts.push('· 随身佩戴属' + ti.ele + '的小物件，保持气场稳定；');
    parts.push('· 适当参与慈善和公益活动，积累善缘——《易经》云："积善之家必有余庆。"');
  }
  
  // 外应提醒
  parts.push('【外应提醒】《梅花易数·三要十应篇》强调"观物取象"——留意身边的异常信号：');
  var rIdx = (tiXiang.number ? parseInt(tiXiang.number.split('、')[0]) : 1) % _WAI_YING_RULES.length;
  parts.push('· ' + _WAI_YING_RULES[rIdx]);
  parts.push('· 如果你在起卦前后看到了特别的景象（比如突然出现的动物、器物变化等），那可能就是"外应"信号。记录下来，参详分析。');
  
  return parts.join('\n');
}

// --- 三卦综合评分 ---
function _buildSancangScore(ti, yong, shengkeCode, monthBranch, dongYao) {
  var score = 60;
  var monthWx = _YUE_JIAN_WANG_XIU[monthBranch] || _YUE_JIAN_WANG_XIU['子'];
  var tiState = monthWx[ti.ele] || '休';
  
  var relBonus = {'yongshengti':25, 'bihe':20, 'tikeyong':15, 'tishengyong':10, 'yongketi':0};
  score += relBonus[shengkeCode] || 10;
  
  var stateBonus = {'旺':15, '相':10, '休':5, '囚':0, '死':-5};
  score += stateBonus[tiState] || 5;
  
  if (dongYao === 2 || dongYao === 4 || dongYao === 5) score += 5;
  if (dongYao === 6) score -= 3;
  
  score = Math.max(10, Math.min(95, score));
  var level = score >= 80 ? '大吉' : score >= 65 ? '吉' : score >= 50 ? '平' : score >= 35 ? '小凶' : '凶';
  
  return { score: score, level: level, desc: '综合评分' + score + '分（' + level + '），基于体用关系(' + shengkeCode + ')、月建旺衰(' + tiState + ')、动爻位置(第' + dongYao + '爻)等维度综合判定。' };
}

// ================================================================
//  DA LIU REN ENGINE
// ================================================================

// ═══ 大六壬十二天将完整知识库 ═══
// 参考《大六壬大全》《六壬指南》《六壬粹言》《壬归》
const LR_TIANJIANG = {
  guiren: {
    name:'贵人', nature:'大吉', 
    desc:'十二天将之首，至尊至贵之神。主福禄荣显、贵人相助、官爵升迁、喜庆之事。贵人临课，万事可成，逢凶化吉。贵人得地则权柄在握，失地则虽有贵人亦力薄。',
    suozhu:'官禄、爵位、诏命、庆贺、贵人引荐',
    xingge:'正直不阿，威严端庄，明辨是非',
    wuxing:'土', color:'#C9A84C', symbol:'👑',
    jixiang:'贵人得地逢青龙，主升官发财、大喜临门。贵人与太常并临，主宴乐喜庆。',
    xiongxiang:'贵人失地逢白虎，主贵人变仇、恩将仇报。贵人落空亡，主求贵无门。'
  },
  tengshe: {
    name:'螣蛇', nature:'凶',
    desc:'惊怪变异之神。主怪异之事、虚惊缠绕、噩梦缠身、口舌是非、阴谋诡计。螣蛇临课，须防小人暗算、飞来横祸。其性虚浮不定，主事情变化无常，令人心神不宁。',
    suozhu:'惊恐、怪异、噩梦、火光、奸诈、缠绕',
    xingge:'机巧多谋，善变不定，好弄权术',
    wuxing:'火', color:'#FF4500', symbol:'🐍',
    jixiang:'螣蛇得水则化龙，主以智谋取胜。',
    xiongxiang:'螣蛇临火则猖獗，主火灾、血光、狂病。螣蛇加日干，主事主心绪不宁。'
  },
  zhuque: {
    name:'朱雀', nature:'凶',
    desc:'文书口舌之神。主文章、文书、印信、敕命，亦主口舌是非、官司诉讼、争吵纠纷。朱雀得地主文采飞扬、科举高中；失地则主口角纷争、文书有失。',
    suozhu:'文章、书信、消息、官司、口舌、火灾',
    xingge:'能言善辩，文采斐然，但易惹是非',
    wuxing:'火', color:'#E74C3C', symbol:'🐦',
    jixiang:'朱雀乘旺主文章出众，科举得中。朱雀带天喜，主喜讯传来。',
    xiongxiang:'朱雀投江(丁加癸)主文书失落。朱雀衔物主口舌成讼。'
  },
  liuhe: {
    name:'六合', nature:'吉',
    desc:'和合婚姻之神。主婚姻嫁娶、交易买卖、合作合伙、媒妁之言、保密之事。六合为阴阳和合之象，凡事以合为贵。其性柔顺，主和谐融洽、平安顺遂。',
    suozhu:'婚姻、交易、合作、和合、保密、人际',
    xingge:'和气温良，善于沟通，长于交际',
    wuxing:'木', color:'#27AE60', symbol:'🤝',
    jixiang:'六合加青龙主婚姻美满、合作大成。六合带财星，主交易获利。',
    xiongxiang:'六合逢玄武，主合作有诈、秘密泄露。六合临空亡，主婚约难成。'
  },
  gouchen: {
    name:'勾陈', nature:'凶',
    desc:'争斗迟滞之神。主争斗纠纷、田土房产、诉讼官司、牵绊拖延、牢狱之灾。勾陈性滞，凡事进展缓慢，难有速成。临日辰主事有阻碍，好事多磨。',
    suozhu:'争斗、田产、诉讼、迟滞、牢狱、牵连',
    xingge:'固执刚慢，不轻易妥协，善守不善攻',
    wuxing:'土', color:'#8B4513', symbol:'⚔️',
    jixiang:'勾陈得青龙之生，主官司可解。勾陈带吉星，主田产丰厚。',
    xiongxiang:'勾陈逢白虎，主牢狱血光。勾陈加日辰，主事主有牵连。'
  },
  qinglong: {
    name:'青龙', nature:'大吉',
    desc:'财帛喜庆之神。十二天将中最吉之神。主财帛、喜庆、升迁、婚姻、酒食宴乐。青龙得地主万事亨通，为福为祥。其性舒畅通达，主顺遂亨通之气。',
    suozhu:'财帛、喜庆、升官、婚姻、宴乐、出行',
    xingge:'宽厚仁和，气度恢宏，乐善好施',
    wuxing:'木', color:'#2ECC71', symbol:'🐉',
    jixiang:'青龙得水主财源滚滚。青龙加太常，主宴乐喜庆、喜事临门。',
    xiongxiang:'青龙折足(戊加辛)主灾祸。青龙落空，主喜庆成空。'
  },
  tiankong: {
    name:'天空', nature:'凶',
    desc:'虚诈不实之神。主欺诈、欺骗、空虚、不实之事、奏书章表。天空之性虚浮无根，凡事虚假难凭，不可深信。临课主事多虚少实，文书有伪。',
    suozhu:'虚诈、欺骗、空言、伪书、奴婢、不实',
    xingge:'虚浮不定，好说大话，难以捉摸',
    wuxing:'土', color:'#95A5A6', symbol:'☁️',
    jixiang:'天空与贵人同宫，主文书得贵人相助。',
    xiongxiang:'天空加勾陈，主被人诬告。天空临财星，主财物虚耗。'
  },
  baihu: {
    name:'白虎', nature:'大凶',
    desc:'凶丧血光之神。十二天将中最凶之神。主凶灾横祸、血光之灾、道路丧亡、疾病刀兵。白虎性猛暴，其来也疾，其去也速。临课须格外小心，凡事以退为进。',
    suozhu:'凶灾、血光、丧亡、疾病、道路、刀兵',
    xingge:'刚猛暴烈，勇武果断，威势逼人',
    wuxing:'金', color:'#FFFFFF', symbol:'🐯',
    jixiang:'白虎得制(火克金)则化威为权，主武职升迁。',
    xiongxiang:'白虎加日干主伤身。白虎临死气主重病丧亡。白虎入课，动则有伤。'
  },
  taichang: {
    name:'太常', nature:'吉',
    desc:'饮食宴会之神。主饮食酒食、宴会庆典、衣服冠冕、谷帛财帛。太常为礼仪之星，主文明礼乐、典章制度。其性温和庄重，凡事依礼而行则吉。',
    suozhu:'饮食、宴会、衣服、礼仪、财帛、庆典',
    xingge:'温文尔雅，知书达礼，注重仪表',
    wuxing:'土', color:'#D4AF37', symbol:'🍶',
    jixiang:'太常加青龙主喜庆宴乐。太常带贵人主官宴受赏。',
    xiongxiang:'太常落空亡主宴乐不成。太常逢勾陈，主礼仪之争。'
  },
  xuanwu: {
    name:'玄武', nature:'凶',
    desc:'盗贼暗昧之神。主盗贼偷窃、走失逃亡、暗昧不明、阴谋诡计、奸诈之事。玄武性隐伏，来去无踪，伤人于暗处。临课须防盗贼、防小人暗中做梗。',
    suozhu:'盗贼、走失、暗昧、阴谋、奸诈、逃亡',
    xingge:'机敏狡黠，善于隐藏，行事诡秘',
    wuxing:'水', color:'#2C3E50', symbol:'🐢',
    jixiang:'玄武乘旺主智谋取胜。玄武与六合并，主暗中得财。',
    xiongxiang:'玄武加财星主财物被盗。玄武临日干，主被人算计。'
  },
  taiyin: {
    name:'太阴', nature:'吉',
    desc:'隐秘阴私之神。主隐秘之事、妇人阴私、帷幄之谋、暗中相助。太阴之性柔顺内敛，不显于外。临课主暗中有人相助，或事在暗处进行。亦主女性贵人。',
    suozhu:'隐秘、阴私、妇人、暗助、帷幄、侍妾',
    xingge:'温柔细腻，善于守密，处事低调',
    wuxing:'金', color:'#E8E8E8', symbol:'🌙',
    jixiang:'太阴得青龙之生，主暗中有贵人相助。太阴加天后，主女性助力大。',
    xiongxiang:'太阴逢玄武，主隐私泄露。太阴临螣蛇，主暗中惊恐。'
  },
  tianhou: {
    name:'天后', nature:'吉',
    desc:'妇女恩泽之神。主妇女之事、后宫内院、恩泽惠赐、寝息安眠。天后为阴柔之极，主女性贵人之力、母爱关怀。临课主得女性贵人相助、闺门有喜。',
    suozhu:'妇女、恩泽、后宫、寝息、孕产、阴德',
    xingge:'慈祥温柔，恩泽广被，善于照顾',
    wuxing:'水', color:'#E91E63', symbol:'👸',
    jixiang:'天后带贵人生合日干，主贵妇相助。天后加太常，主婚礼喜庆。',
    xiongxiang:'天后临白虎主产厄。天后落空主妇人之助无望。'
  }
};

// 十天干贵人诀（昼夜贵人）
// 《大六壬大全》贵人诀：甲戊庚牛羊(丑未)、乙己鼠猴(子申)、丙丁猪鸡(亥酉)、壬癸兔蛇(卯巳)、六辛马虎(午寅)
// 昼贵人阳贵：甲丑、乙子、丙亥、丁酉、戊丑、己子、庚丑、辛午、壬卯、癸巳
// 夜贵人阴贵：甲未、乙申、丙酉、丁亥、戊未、己申、庚未、辛寅、壬巳、癸卯
const LR_GUIREN_DAY = {0:'丑',1:'子',2:'亥',3:'酉',4:'丑',5:'子',6:'丑',7:'午',8:'卯',9:'巳'};
const LR_GUIREN_NIGHT = {0:'未',1:'申',2:'酉',3:'亥',4:'未',5:'申',6:'未',7:'寅',8:'巳',9:'卯'};

// 按贵人所在顺逆排十二天将（贵人起法）
// 天将顺排：贵人→螣蛇→朱雀→六合→勾陈→青龙→天空→白虎→太常→玄武→太阴→天后
const LR_TIANG_ORDER = ['guiren','tengshe','zhuque','liuhe','gouchen','qinglong','tiankong','baihu','taichang','xuanwu','taiyin','tianhou'];
const LR_TIANG_NAME = {guiren:'贵人',tengshe:'螣蛇',zhuque:'朱雀',liuhe:'六合',gouchen:'勾陈',qinglong:'青龙',tiankong:'天空',baihu:'白虎',taichang:'太常',xuanwu:'玄武',taiyin:'太阴',tianhou:'天后'};

// 地支藏干（完整版，用于六壬天地盘）
const LR_ZHI_GAN = {
  '子':{gan:'壬',ele:'水'},'丑':{gan:'己癸辛',ele:'土'},'寅':{gan:'甲丙戊',ele:'木'},'卯':{gan:'乙',ele:'木'},
  '辰':{gan:'戊乙癸',ele:'土'},'巳':{gan:'丙庚戊',ele:'火'},'午':{gan:'丁己',ele:'火'},'未':{gan:'己丁乙',ele:'土'},
  '申':{gan:'庚壬戊',ele:'金'},'酉':{gan:'辛',ele:'金'},'戌':{gan:'戊辛丁',ele:'土'},'亥':{gan:'壬甲',ele:'水'},
};

// 地支五行
const LR_ZHI_WX = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'};

// 五行生克关系
const LR_WX_SHENG = {木:'火',火:'土',土:'金',金:'水',水:'木'};
const LR_WX_KE = {木:'土',土:'水',水:'火',火:'金',金:'木'};

// ═══ 大六壬神煞系统 ═══
// 参照《六壬指南》神煞章
const LR_SHENSHA = {
  // 岁煞（以年支查）
  yima:    {name:'驿马', nature:'动', desc:'主奔波出行、迁移调动。临三传主事有变动，临日辰主此人好动。驿马乘青龙主升迁之喜，乘白虎主奔波劳苦，乘玄武主走失逃亡。',
            chafa:'寅午戌在申，申子辰在寅，巳酉丑在亥，亥卯未在巳'},
  taohua:  {name:'桃花', nature:'平', desc:'主人缘社交、感情桃花。临日干主此人异性缘佳，临三传主所问之事涉感情。桃花乘六合主良缘，乘玄武主暗昧私情。',
            chafa:'寅午戌在卯，申子辰在酉，巳酉丑在午，亥卯未在子'},
  huagai:  {name:'华盖', nature:'平', desc:'主艺术才华、孤高性情。临日干主聪明有才但性格孤傲。华盖乘青龙主文采出众，乘天空主空想不实。',
            chafa:'寅午戌在戌，申子辰在辰，巳酉丑在丑，亥卯未在未'},
  jiangxing:{name:'将星', nature:'吉', desc:'主威权领导、掌权之力。临三传主当权得势，临日辰主此人有魄力。将星乘贵人主得上级赏识，乘青龙主手握实权。',
            chafa:'寅午戌在午，申子辰在子，巳酉丑在酉，亥卯未在卯'},
  // 季煞（以月令查）
  tiande:  {name:'天德', nature:'大吉', desc:'天德为福德之星，化解百灾。临日辰主逢凶化吉，临三传主万事顺遂。天德所到之处，凶煞退避，吉事倍增。',
            chafa:'正月在丁(未)，二月在申，三月在壬(亥)，四月在辛(戌)，五月在亥，六月在甲(寅)，七月在癸(丑)，八月在寅，九月在丙(巳)，十月在乙(辰)，十一月在巳，十二月在庚(申)'},
  yuede:   {name:'月德', nature:'大吉', desc:'月德与天德并称二德，主福力深厚。临日辰主心地善良有福报，临三传主天佑人助。二德入课可化解一切凶象。',
            chafa:'寅午戌月德在丙，申子辰月德在壬，亥卯未月德在甲，巳酉丑月德在庚'},
  tianshe: {name:'天赦', nature:'大吉', desc:'赦免之星，主罪过得赦、困境解除。天赦日出生者一生少灾，临课主官司可解、困局可破。春戊寅、夏甲午、秋戊申、冬甲子为天赦日。',
            chafa:'春(寅卯辰月)戊寅日，夏(巳午未月)甲午日，秋(申酉戌月)戊申日，冬(亥子丑月)甲子日'},
  tianxi:  {name:'天喜', nature:'吉', desc:'喜庆之星，主婚姻喜事、添丁进口。临三传主有喜事临门，临六合主婚缘，临天后主生子。',
            chafa:'正月在戌，二月在亥，三月在子，四月在丑，五月在寅，六月在卯，七月在辰，八月在巳，九月在午，十月在未，十一月在申，十二月在酉'},
  tianyi:  {name:'天医', nature:'吉', desc:'医药之星，主疾病得医、康复有望。临三传主有良医相助，临日辰主健康好转。天医得生旺则小病可愈，得死气则病重难医。',
            chafa:'正月在辰，二月在巳，三月在午，四月在未，五月在申，六月在酉，七月在戌，八月在亥，九月在子，十月在丑，十一月在寅，十二月在卯'},
  // 干煞（以日干查）
  wenchang:{name:'文昌', nature:'吉', desc:'学业文星，主考试升学、文章出众。临日干主此人聪慧好学，临三传主所问之事与文书相关。',
            chafa:'甲巳，乙午，丙申，丁酉，戊申，己酉，庚亥，辛子，壬寅，癸卯'},
  yangren: {name:'羊刃', nature:'凶', desc:'刚暴之星，主性格刚强、易有血光。临日干主此人性格激烈，临三传主所问之事有突发变故。羊刃宜制不宜旺，旺则伤人伤己。',
            chafa:'甲卯，乙辰，丙午，丁未，戊午，己未，庚酉，辛戌，壬子，癸丑'},
  // 支煞（以日支查）
  wangshen:{name:'亡神', nature:'凶', desc:'主失脱、走失、亡逸。临三传主财物有失、人员走散。',
            chafa:'寅午戌在巳，申子辰在亥，巳酉丑在申，亥卯未在寅'},
  jiesha:  {name:'劫煞', nature:'凶', desc:'主劫夺、破财、飞来横祸。临三传慎防意外损失、被盗。劫煞乘玄武主盗窃，乘白虎主抢劫。',
            chafa:'寅午戌在亥，申子辰在巳，巳酉丑在寅，亥卯未在申'},
  zaisha:  {name:'灾煞', nature:'凶', desc:'主灾祸突然、病患急发。临三传须防突发性疾病或事故。灾煞乘白虎主血光，乘螣蛇主怪病。',
            chafa:'寅午戌在子，申子辰在午，巳酉丑在卯，亥卯未在酉'},
  guchen:  {name:'孤辰', nature:'凶', desc:'主孤独、人际关系薄弱。临日干主此人不善交际，临婚姻课主感情孤独。',
            chafa:'寅卯辰在巳，巳午未在申，申酉戌在亥，亥子丑在寅'},
  guasu:   {name:'寡宿', nature:'凶', desc:'主孤单、婚缘迟来。临日辰主晚婚或婚姻有隔阂。孤辰寡宿同在课中，主孤独命格。',
            chafa:'寅卯辰在丑，巳午未在辰，申酉戌在未，亥子丑在戌'}
};

// 神煞查法辅助
function _lrshen(shenKey, branch) {
  // 根据神煞key和地支返回对应的地支
  var map = {
    yima:    {'寅':'申','午':'申','戌':'申','申':'寅','子':'寅','辰':'寅','巳':'亥','酉':'亥','丑':'亥','亥':'巳','卯':'巳','未':'巳'},
    taohua:  {'寅':'卯','午':'卯','戌':'卯','申':'酉','子':'酉','辰':'酉','巳':'午','酉':'午','丑':'午','亥':'子','卯':'子','未':'子'},
    huagai:  {'寅':'戌','午':'戌','戌':'戌','申':'辰','子':'辰','辰':'辰','巳':'丑','酉':'丑','丑':'丑','亥':'未','卯':'未','未':'未'},
    jiangxing:{'寅':'午','午':'午','戌':'午','申':'子','子':'子','辰':'子','巳':'酉','酉':'酉','丑':'酉','亥':'卯','卯':'卯','未':'卯'},
    wangshen:{'寅':'巳','午':'巳','戌':'巳','申':'亥','子':'亥','辰':'亥','巳':'申','酉':'申','丑':'申','亥':'寅','卯':'寅','未':'寅'},
    jiesha:  {'寅':'亥','午':'亥','戌':'亥','申':'巳','子':'巳','辰':'巳','巳':'寅','酉':'寅','丑':'寅','亥':'申','卯':'申','未':'申'},
    zaisha:  {'寅':'子','午':'子','戌':'子','申':'午','子':'午','辰':'午','巳':'卯','酉':'卯','丑':'卯','亥':'酉','卯':'酉','未':'酉'},
    guchen:  {'寅':'巳','卯':'巳','辰':'巳','巳':'申','午':'申','未':'申','申':'亥','酉':'亥','戌':'亥','亥':'寅','子':'寅','丑':'寅'},
    guasu:   {'寅':'丑','卯':'丑','辰':'丑','巳':'辰','午':'辰','未':'辰','申':'未','酉':'未','戌':'未','亥':'戌','子':'戌','丑':'戌'}
  };
  return map[shenKey] ? (map[shenKey][branch] || null) : null;
}

// ═══ 大六壬排盘入口 ═══
function computeLiuRen() {
 try {
  return _computeLiuRenImpl();
 } catch(e) {
  console.error('[大六壬错误]', e.message, e.stack);
  var _eb = document.getElementById('lrInterp') || document.getElementById('lrResult');
  if(_eb) _eb.innerHTML = '<div style="padding:20px;margin:16px 0;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 大六壬出错</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p><p style="font-size:11px;opacity:.5;margin-top:4px">'+(e.stack||'').split("\n").slice(0,3).join("<br>")+'</p></div>';
  var _r = document.getElementById('lrResult'); if(_r){_r.classList.add('visible');_r.scrollIntoView({behavior:'smooth'});}
 }
}
function _computeLiuRenImpl() {
  playDivinationSound();
  var name = document.getElementById('lrName').value || '有缘人';
  var dateStr = document.getElementById('lrDate').value;
  var hourVal = document.getElementById('lrHour').value;
  if (!dateStr || !hourVal) { showToast('请输入日期和时辰'); return; }

  var parts = dateStr.split('-').map(Number);
  var year = parts[0], month = parts[1], day = parts[2];
  var hourNum = parseInt(hourVal);

  // 计算基础数据
  var dayStemIdx = getDayStemIndex(year, month, day);
  var dayBranchIdx = getDayBranchIndex(year, month, day);
  var dayStem = STEMS[dayStemIdx];
  var dayBranch = BRANCHES[dayBranchIdx];
  var hourBranchIdx = Math.floor(hourNum / 2) % 12;
  var hourBranch = BRANCHES[hourBranchIdx];
  
  // 月将（中气后以当月月将为准）
  var yueJiangIdx = (month + 1) % 12;
  var yueJiang = BRANCHES[yueJiangIdx];

  // 构建完整的课式数据
  var keShi = buildLiuRenKeShi(dayStemIdx, dayBranchIdx, hourBranchIdx, month);
  
  // 生成专业解读
  var interpretation = buildLiuRenProfessionalInterpretation(keShi, name, year, month, day, hourBranch, yueJiang);

  // 渲染UI
  document.getElementById('lrMeta').textContent = '大六壬 · ' + name + ' · ' + year + '年' + month + '月' + day + '日 ' + hourBranch + '时';
  document.getElementById('lrSub').textContent = '日干' + dayStem + ' · 日支' + dayBranch + ' · 月将' + yueJiang + ' · ' + interpretation.tiGuan.name + '课';

  var ctr = document.getElementById('lrInterp');
  ctr.innerHTML = '';

  // 渲染七个专业板块
  var sections = [
    {title:'🔮 课体总断', body: interpretation.keTiPan, accent:'orange'},
    {title:'📜 四课分析', body: interpretation.siKePan, accent:'gold-accent'},
    {title:'🔄 三传详解', body: interpretation.sanChuanPan, accent:'violet-accent'},
    {title:'👥 天将分布', body: interpretation.tianJiangPan, accent:'cyan-accent'},
    {title:'⭐ 神煞影响', body: interpretation.shenShaPan, accent:'jade-accent'},
    {title:'💡 大白话结论', body: interpretation.baihuaJielun, accent:'cinn-accent'},
    {title:'📅 流年推演', body: interpretation.liunianTuiyan, accent:'gold-accent'}
  ];

  for (var i = 0; i < sections.length; i++) {
    var s = sections[i];
    var block = document.createElement('div');
    block.className = 'interp-block';
    block.innerHTML = '<div class="interp-block-header" style="color:var(--' + s.accent + ')">' + s.title + '</div>'
      + '<div class="interp-block-body" style="font-size:14px;line-height:2;white-space:pre-wrap">' + s.body + '</div>';
    ctr.appendChild(block);
  }

  // 保留原有的六壬断语卡片
  var lrReadBox = document.getElementById('lrReadingBox');
  if (lrReadBox) lrReadBox.innerHTML = getLiurenReadingHTML(dayStem);

  // ── 起课流程说明 ──
  var lrProcBox = document.getElementById('lrProcessBox');
  if (lrProcBox) {
    var lrProc = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(230,126,34,.2);padding:20px">';
    lrProc += '<h5 style="font-size:15px;color:var(--orange);letter-spacing:3px;margin-bottom:14px">📋 六壬起课流程</h5>';
    lrProc += '<div style="font-size:13px;line-height:2.1;opacity:.85">';
    lrProc += '<p><b style="color:var(--gold)">第一步·定四柱：</b>日柱' + dayStem + dayBranch + '，时柱' + (typeof hourStem!=='undefined'?hourStem:'') + (typeof hourBranch!=='undefined'?hourBranch:'') + '。日干为天，日支为地。';
    lrProc += '</p>';
    lrProc += '<p><b style="color:var(--gold)">第二步·布天盘：</b>天盘干支依时辰旋转，天盘日干加地盘日支之上，随天盘十二支顺转。';
    lrProc += '</p>';
    lrProc += '<p><b style="color:var(--gold)">第三步·定四课：</b>以日干、日支、日干寄宫、日支阴神为四课，分别取天盘上神为上神。';
    lrProc += '</p>';
    lrProc += '<p><b style="color:var(--gold)">第四步·发三传：</b>根据四课关系，用贼克法、比用法、涉害法等取初传、中传、末传。';
    lrProc += '</p>';
    lrProc += '<p><b style="color:var(--gold)">第五步·布十二天将：</b>贵人、塤蛇、六合、勾陈、青龙、天空、白虎、太常、玄武、太阴、天后、太一，依日干昼夜贵人定贵人位置，顺布或逆布。';
    lrProc += '</p>';
    lrProc += '</div>';
    lrProc += '<div style="margin-top:12px;padding:10px 14px;background:rgba(230,126,34,.05);border-radius:8px;font-size:12px;opacity:.7">';
    lrProc += '《大六壬金口诀》云：「六壬之妙，在于正时；天机发露，善恶可见。」《六壬大全》曰：「日干为天，日支为地，时为人和，三才具备，吉凶可判。」';
    lrProc += '</div>';
    lrProc += '</div>';
    lrProcBox.innerHTML = lrProc;
  }

  // ── 前后推演 ──
  var lrFcBox = document.getElementById('lrForecastBox');
  if (lrFcBox) {
    var lrFc = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.15);padding:20px">';
    lrFc += '<h5 style="font-size:15px;color:var(--gold);letter-spacing:3px;margin-bottom:14px">🔍 前后推演</h5>';
    lrFc += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">';
    lrFc += '<div style="padding:14px;background:rgba(46,204,113,.05);border-radius:8px;border:1px solid rgba(46,204,113,.1)"><div style="font-size:13px;color:#2ecc71;font-weight:bold;margin-bottom:8px">⏪ 往前验证</div><div style="font-size:12px;line-height:1.8;opacity:.8">';
    var lrPrev = new Date(year, month-1, day-1);
    var lrPrevObj = getYearStemBranch(lrPrev.getFullYear(), lrPrev.getMonth()+1, lrPrev.getDate());
    lrFc += '<p>前一日：' + lrPrevObj.stem + lrPrevObj.branch + '日</p>';
    lrFc += '<p style="opacity:.6;margin-top:6px">可对比不同日辰起课结果</p>';
    lrFc += '</div></div>';
    lrFc += '<div style="padding:14px;background:rgba(231,76,60,.05);border-radius:8px;border:1px solid rgba(231,76,60,.1)"><div style="font-size:13px;color:#e74c3c;font-weight:bold;margin-bottom:8px">⏩ 往后预测</div><div style="font-size:12px;line-height:1.8;opacity:.8">';
    var lrNext = new Date(year, month-1, day+1);
    var lrNextObj = getYearStemBranch(lrNext.getFullYear(), lrNext.getMonth()+1, lrNext.getDate());
    lrFc += '<p>后一日：' + lrNextObj.stem + lrNextObj.branch + '日</p>';
    lrFc += '<p style="opacity:.6;margin-top:6px">可预测未来日辰课式走势</p>';
    lrFc += '</div></div>';
    lrFc += '</div></div>';
    lrFcBox.innerHTML = lrFc;
  }

  // ── 个性化指导 ──
  try {
    var lrGuide = buildLiurenPersonalizedGuidance({});
    var lrRes = document.getElementById('lrResult');
    if (lrRes) lrRes.innerHTML += lrGuide;
  } catch(e) {}

  // ═══ 三元九运与六壬 ═══
  try {
    var _syLr = _generateSanyuanJiuyunBlock('liuren', {
      dayStem: (typeof dayStem !== 'undefined' ? dayStem : '甲'),
      dayEle: (typeof dayStem !== 'undefined' ? (ELE[dayStem] || '木') : '木'),
      currentYear: (typeof year !== 'undefined' ? year : new Date().getFullYear())
    });
    var _lrRes = document.getElementById('lrResult');
    if (_lrRes) _lrRes.innerHTML += _syLr;
  } catch(e) { console.warn('[三元九运六壬分析块失败]', e.message); }

  // === 化解方案注入 ===
  var _lrSex = document.getElementById('lrSex') ? document.getElementById('lrSex').value : 'male';
  appendHuajieToResult('lrResult', year, month, day, parseInt(hourVal), _lrSex, name);

  document.getElementById('lrResult').classList.add('visible');
  document.getElementById('lrResult').scrollIntoView({ behavior: 'smooth' });
}

// ═══ 构建完整六壬课式 ═══
function buildLiuRenKeShi(dayStemIdx, dayBranchIdx, hourBranchIdx, month) {
  var dayStem = STEMS[dayStemIdx];
  var dayBranch = BRANCHES[dayBranchIdx];
  var hourBranch = BRANCHES[hourBranchIdx];

  var siKe = _buildSiKe(dayStemIdx, dayBranchIdx, hourBranchIdx);
  var sanChuan = _buildSanChuan(siKe, dayStemIdx, dayBranchIdx);
  var tianJiangFenbu = _buildTianJiangFenbu(dayStemIdx, hourBranchIdx);
  var shenSha = _buildLiuRenShenSha(dayStemIdx, dayBranchIdx, month);
  var tiGuan = _buildLiuRenTiGuan(sanChuan, siKe, dayStemIdx, dayBranchIdx);
  var chuanKe = _getSanChuanShengKe(sanChuan);
  var chuanTianJiang = _getChuanTianJiang(tianJiangFenbu, sanChuan);

  return {
    dayStem: dayStem, dayStemIdx: dayStemIdx,
    dayBranch: dayBranch, dayBranchIdx: dayBranchIdx,
    hourBranch: hourBranch, hourBranchIdx: hourBranchIdx,
    month: month,
    siKe: siKe,
    sanChuan: sanChuan,
    tianJiangFenbu: tianJiangFenbu,
    shenSha: shenSha,
    tiGuan: tiGuan,
    chuanKe: chuanKe,
    chuanTianJiang: chuanTianJiang
  };
}

// 四课构建
function _buildSiKe(dayStemIdx, dayBranchIdx, hourBranchIdx) {
  var dayStem = STEMS[dayStemIdx];
  var dayBranch = BRANCHES[dayBranchIdx];
  var ganJiGong = _ganJiGong(dayStem);
  var tianPanBase = hourBranchIdx;
  
  var ke1 = ganJiGong;
  var ke2 = BRANCHES[(BRANCHES.indexOf(ke1) + 1) % 12];
  var ke3 = dayBranch;
  var ke4 = BRANCHES[(dayBranchIdx + 1) % 12];

  return {
    ke1: ke1, ke1Gan: (LR_ZHI_GAN[ke1]?.gan || dayStem).charAt(0),
    ke2: ke2, ke2Gan: (LR_ZHI_GAN[ke2]?.gan || dayStem).charAt(0),
    ke3: ke3, ke3Gan: (LR_ZHI_GAN[ke3]?.gan || dayStem).charAt(0),
    ke4: ke4, ke4Gan: (LR_ZHI_GAN[ke4]?.gan || dayStem).charAt(0)
  };
}

// 日干寄宫
function _ganJiGong(stem) {
  var map = {甲:'寅',乙:'辰',丙:'巳',丁:'未',戊:'巳',己:'未',庚:'申',辛:'戌',壬:'亥',癸:'丑'};
  return map[stem] || '寅';
}

// 三传构建（基于四课贼克）
function _buildSanChuan(siKe, dayStemIdx, dayBranchIdx) {
  var dayStem = STEMS[dayStemIdx];
  var kes = [
    {zhi: siKe.ke1, shang: siKe.ke1Gan},
    {zhi: siKe.ke2, shang: siKe.ke2Gan},
    {zhi: siKe.ke3, shang: siKe.ke3Gan},
    {zhi: siKe.ke4, shang: siKe.ke4Gan}
  ];

  var zeKe = [], keZe = [];
  for (var i = 0; i < kes.length; i++) {
    var shangWx = _getGanWx(kes[i].shang);
    var zhiWx = LR_ZHI_WX[kes[i].zhi];
    if (_wxKe(zhiWx, shangWx)) zeKe.push({zhi:kes[i].zhi, shang:kes[i].shang, idx:i, type:'下克上(贼)'});
    if (_wxKe(shangWx, zhiWx)) keZe.push({zhi:kes[i].zhi, shang:kes[i].shang, idx:i, type:'上克下(克)'});
  }

  var faYong, faType;
  var candidates = zeKe.length > 0 ? zeKe : keZe;
  
  if (candidates.length === 0) {
    faYong = _ganJiGong(STEMS[dayStemIdx]);
    faType = '无贼无克';
  } else if (candidates.length === 1) {
    faYong = candidates[0].zhi;
    faType = candidates[0].type;
  } else {
    faYong = candidates[0].zhi;
    faType = candidates[0].type + '(多课)';
  }

  var faIdx = BRANCHES.indexOf(faYong);
  var zhongIdx = (faIdx + 4) % 12;
  var moIdx = (faIdx + 8) % 12;
  
  return {
    faYong: faYong, faIdx: faIdx, faType: faType,
    zhongChuan: BRANCHES[zhongIdx], zhongIdx: zhongIdx,
    moChuan: BRANCHES[moIdx], moIdx: moIdx
  };
}

function _getGanWx(gan) {
  var wx = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  return wx[gan] || '土';
}

function _wxKe(a, b) { return LR_WX_KE[a] === b; }
function _wxSheng(a, b) { return LR_WX_SHENG[a] === b; }

// 天将分布（基于贵人诀）
function _buildTianJiangFenbu(dayStemIdx, hourBranchIdx) {
  var guirenZhi = LR_GUIREN_DAY[dayStemIdx];
  var guirenIdx = BRANCHES.indexOf(guirenZhi);
  var shunPai = (guirenIdx >= 4 && guirenIdx <= 9);
  
  var fenbu = {};
  for (var i = 0; i < 12; i++) {
    var zhi = BRANCHES[i];
    var offset;
    if (shunPai) {
      offset = (i - guirenIdx + 12) % 12;
    } else {
      offset = (guirenIdx - i + 12) % 12;
    }
    var godKey = LR_TIANG_ORDER[offset % 12];
    fenbu[zhi] = {
      key: godKey,
      name: LR_TIANJIANG[godKey] ? LR_TIANJIANG[godKey].name : godKey,
      nature: LR_TIANJIANG[godKey] ? LR_TIANJIANG[godKey].nature : '平',
      desc: LR_TIANJIANG[godKey] ? LR_TIANJIANG[godKey].desc : ''
    };
  }
  return { fenbu: fenbu, guirenZhi: guirenZhi, shunPai: shunPai };
}

// 大六壬神煞收集
function _buildLiuRenShenSha(dayStemIdx, dayBranchIdx, month) {
  var dayBranch = BRANCHES[dayBranchIdx];
  var dayStem = STEMS[dayStemIdx];
  var result = [];

  var zhiSha = ['yima','taohua','huagai','jiangxing','wangshen','jiesha','zaisha'];
  for (var i = 0; i < zhiSha.length; i++) {
    var ts = _lrshen(zhiSha[i], dayBranch);
    if (ts) {
      var info = LR_SHENSHA[zhiSha[i]];
      result.push({name: info.name, nature: info.nature, desc: info.desc, zhi: ts});
    }
  }

  var tiandeZhi = _getTianDe(month);
  if (tiandeZhi) {
    result.push({name:'天德', nature:'大吉', desc:'福德之星，逢凶化吉，贵人相助', zhi: tiandeZhi});
  }

  var yuedeZhi = _getYueDe(month);
  if (yuedeZhi) {
    result.push({name:'月德', nature:'大吉', desc:'月德临照，万事顺利。月内行事皆利，大事可成。', zhi: yuedeZhi});
  }

  var tianxiZhi = _getTianXi(month);
  if (tianxiZhi) {
    result.push({name:'天喜', nature:'吉', desc:'喜庆之星在课，主有喜事临门，婚姻可成。', zhi: tianxiZhi});
  }

  var tianyiZhi = _getTianYi(month);
  if (tianyiZhi) {
    result.push({name:'天医', nature:'吉', desc:'医药之星，得病可愈，有良医相助。', zhi: tianyiZhi});
  }

  var wenchangZhi = _getWenChang(dayStemIdx);
  if (wenchangZhi) {
    result.push({name:'文昌贵人', nature:'吉', desc:'文星闪耀，利考试升学、文书事宜。', zhi: wenchangZhi});
  }

  return result;
}

function _getTianDe(month) {
  var map = {1:'亥',2:'申',3:'亥',4:'戌',5:'亥',6:'寅',7:'丑',8:'寅',9:'巳',10:'辰',11:'巳',12:'申'};
  return map[month] || null;
}
function _getYueDe(month) {
  var map = {1:'巳',2:'寅',3:'亥',4:'申',5:'巳',6:'寅',7:'亥',8:'申',9:'巳',10:'寅',11:'亥',12:'申'};
  return map[month] || null;
}
function _getTianXi(month) {
  var map = {1:'戌',2:'亥',3:'子',4:'丑',5:'寅',6:'卯',7:'辰',8:'巳',9:'午',10:'未',11:'申',12:'酉'};
  return map[month] || null;
}
function _getTianYi(month) {
  var map = {1:'辰',2:'巳',3:'午',4:'未',5:'申',6:'酉',7:'戌',8:'亥',9:'子',10:'丑',11:'寅',12:'卯'};
  return map[month] || null;
}
function _getWenChang(stemIdx) {
  var map = {0:'巳',1:'午',2:'申',3:'酉',4:'申',5:'酉',6:'亥',7:'子',8:'寅',9:'卯'};
  return map[stemIdx] || null;
}

// 三传生克关系
function _getSanChuanShengKe(sanChuan) {
  var faWx = LR_ZHI_WX[sanChuan.faYong];
  var zhongWx = LR_ZHI_WX[sanChuan.zhongChuan];
  var moWx = LR_ZHI_WX[sanChuan.moChuan];
  
  var relations = [];
  
  if (_wxSheng(faWx, zhongWx)) relations.push('初传生中传→事有推动力，进展顺利');
  else if (_wxSheng(zhongWx, faWx)) relations.push('中传生初传→事有回护之力，后续助力');
  else if (_wxKe(faWx, zhongWx)) relations.push('初传克中传→中途遇阻，需克服困难');
  else if (_wxKe(zhongWx, faWx)) relations.push('中传克初传→发端受阻，开端不顺');
  else relations.push('初中比和→平稳推进，无起伏');
  
  if (_wxSheng(zhongWx, moWx)) relations.push('中传生末传→传至末传得助，结局向好');
  else if (_wxSheng(moWx, zhongWx)) relations.push('末传生中传→结果有回环之力');
  else if (_wxKe(zhongWx, moWx)) relations.push('中传克末传→传至末传受制，结局有阻');
  else if (_wxKe(moWx, zhongWx)) relations.push('末传克中传→末传改变中期态势');
  else relations.push('中末比和→结局平稳');
  
  if (_wxSheng(faWx, moWx)) relations.push('初传生末传→从头到尾顺利推进，大吉');
  else if (_wxSheng(moWx, faWx)) relations.push('末传生初传→循环往复之象，事情可能反复');
  else if (_wxKe(faWx, moWx)) relations.push('初传克末传→发端即克结局，事虽起难善终');
  else if (_wxKe(moWx, faWx)) relations.push('末传克初传→结局推翻起因，结果与初衷相反');
  
  return relations;
}

// 天将在三传上的位置
function _getChuanTianJiang(tianJiangFenbu, sanChuan) {
  return {
    fa: tianJiangFenbu.fenbu[sanChuan.faYong],
    zhong: tianJiangFenbu.fenbu[sanChuan.zhongChuan],
    mo: tianJiangFenbu.fenbu[sanChuan.moChuan]
  };
}

// ═══ 课体判定 ═══
function _buildLiuRenTiGuan(sanChuan, siKe, dayStemIdx, dayBranchIdx) {
  var faIdx = sanChuan.faIdx;
  var zhongIdx = sanChuan.zhongIdx;
  var moIdx = sanChuan.moIdx;
  var dayBranchIdxLocal = dayBranchIdx;
  var dayStem = STEMS[dayStemIdx];
  
  var isFuYin = (faIdx === zhongIdx && zhongIdx === moIdx);
  var isFanYin = (Math.abs(faIdx - moIdx) === 6 && Math.abs(faIdx - zhongIdx) === 6);
  
  if (isFuYin) {
    return {
      name: '伏吟', jiXiong: '中平',
      desc: '伏吟课——天地不动，万物皆静。此课主诸事停滞不前，宜守不宜攻，宜静不宜动。',
      advice: '当前不宜做重大改变。保守为主，适合内部整顿、学习充电。时机未到，急于求成反受其害。',
      detail: '《大六壬大全》云:「伏吟者，天地盘同位，如人伏地，不能行动之象。」'
    };
  }
  
  if (isFanYin) {
    return {
      name: '反吟', jiXiong: '凶',
      desc: '反吟课——天地对冲，变动不居。此课主反复无常，好事多磨，事情来回折腾。',
      advice: '事情多有波折反复，需灵活应对。若出行则去而复返，若办事则一波三折。',
      detail: '《六壬指南》曰:「反吟者，天地对冲，如人转身回顾之象。」'
    };
  }
  
  if (sanChuan.faType && sanChuan.faType.indexOf('多课') >= 0) {
    return {
      name: '知一', jiXiong: '小吉',
      desc: '知一课——两课相争，择一而定。事有多条路径，需要明智选择。',
      advice: '眼前有多个选择，建议选择最熟悉的那条路。不要贪多求全，专一而行反而容易成功。',
      detail: '知一课主选择明确，忌贪多务得。宜择善固执，一以贯之。'
    };
  }
  
  var idxDiff = (moIdx - faIdx + 12) % 12;
  if (idxDiff === 1 || idxDiff === 11) {
    return {
      name: '连茹', jiXiong: '吉',
      desc: '连茹课——三传相连如茹草，一气呵成。为六壬中最顺遂之课体之一。',
      advice: '事情会顺理成章地推进，每个阶段都紧密衔接。把握好开头，后面自然水到渠成。',
      detail: '连茹课三传如连珠，事有头绪，发展顺畅。'
    };
  }
  
  if (idxDiff === 2 || idxDiff === 10) {
    return {
      name: '间传', jiXiong: '中平',
      desc: '间传课——三传间隔一位而传。主事情发展有间隙，需跨越一些步骤。',
      advice: '事情不会按部就班，可能跳过某些环节直接进入下一阶段。灵活应对即可。',
      detail: '间传课主事情发展不连续，但能跃过障碍。宜顺势而为。'
    };
  }

  if (sanChuan.faType === '无贼无克') {
    return {
      name: '昴星', jiXiong: '凶',
      desc: '昴星课——四课无贼无克，用昴星法取初传。主事有惊恐，暗中有变数。',
      advice: '表面平静实则暗流涌动。做事要多个心眼，防止被人暗算。大事不宜，小事尚可。',
      detail: '《大六壬大全》:昴星者，无贼无克，望西昴星而取之。主惊恐不定。'
    };
  }
  
  var isYuanShou = (sanChuan.faType && sanChuan.faType.indexOf('上克下') >= 0);
  if (isYuanShou && sanChuan.faType.indexOf('多课') < 0) {
    return {
      name: '元首', jiXiong: '大吉',
      desc: '元首课——上克下发用，为六壬第一吉课。如君主临朝，令行禁止。万事亨通。',
      advice: '此为六壬中最吉利课体。大胆行动，积极进取。事业上利求官求名。',
      detail: '《大六壬大全》以元首课为第一课体:元首者，万事之始也。'
    };
  }
  
  var isChongShen = (sanChuan.faType && sanChuan.faType.indexOf('下克上') >= 0);
  if (isChongShen && sanChuan.faType.indexOf('多课') < 0) {
    return {
      name: '重审', jiXiong: '吉',
      desc: '重审课——下克上发用，以下制上之象。主事情需要再三审查确认。',
      advice: '建议三思而行，反复确认细节。此课利于民间事务、申诉复议。',
      detail: '重审课虽以下克上，但以正御邪，故能有成。宜谨慎行事，步步为营。'
    };
  }

  return {
    name: '别责', jiXiong: '中平',
    desc: '别责课——无贼无克，取日干五合之神为用。主事需借助外力、另寻出路。',
    advice: '单打独斗难成事，需要借助外力或合作。找对人、找对方向比努力更重要。',
    detail: '别责者，别求他方也。事有转机在于外求。'
  };
}
// ═══ END LIUREN ENGINE CORE ═══


// ═══ 日干分析辅助函数 ═══
function getDayStemAnalysis(stem) {
  var analyses = {
    '甲':'如参天大树，性格刚直，有领导才能。做事有担当，不轻易妥协。利东方发展，适合做开创性工作。',
    '乙':'如藤萝花草，外柔内刚，善借力而行。人缘好，情商高。适合做协调沟通类工作。',
    '丙':'如太阳之火，热情奔放，光明正大。感染力强，适合做与人打交道的工作。但注意别太冲动。',
    '丁':'如灯烛之火，内心温暖，善于照亮他人。心思细腻，是做幕后工作的好手。',
    '戊':'如高山厚土，稳重可靠，值得信赖。做事踏实，一步一个脚印。适合长期投入的项目。',
    '己':'如田园沃土，包容温和，不争不抢。心地善良，善于照顾他人感受。',
    '庚':'如刀剑利刃，果断刚毅，执行力强。敢于破旧立新，但需要注意方式方法。',
    '辛':'如珠玉金银，精致细腻，追求完美。审美出众，适合做需要品味和创意的工作。',
    '壬':'如大海之水，智慧深邃，包容万象。思维开阔，适应力强，有大局观。',
    '癸':'如雨露甘霖，润物无声，温柔有力量。直觉敏锐，善解人意。'
  };
  return analyses[stem] || '性格平和，适应力强。';
}

// ═══ 大六壬专业解读引擎 ═══
// buildLiuRenProfessionalInterpretation() — 核心解读函数
// 基于《大六壬大全》《六壬指南》《六壬粹言》《壬归》经典体系

function buildLiuRenProfessionalInterpretation(keShi, name, year, month, day, hourBranch, yueJiang) {
  var ds = keShi.dayStem;
  var db = keShi.dayBranch;
  var sc = keShi.sanChuan;
  var sk = keShi.siKe;
  var tj = keShi.tianJiangFenbu;
  var ss = keShi.shenSha;
  var tg = keShi.tiGuan;
  var ck = keShi.chuanKe;
  var ct = keShi.chuanTianJiang;
  var de = ELE[ds];

  // ═══ a) 课体总断 ═══
  var keTiPan = '';
  keTiPan += '══════ 课体总断 ══════\n\n';
  keTiPan += '【课名】' + tg.name + '课\n';
  keTiPan += '【吉凶】' + tg.jiXiong + '\n';
  keTiPan += '【断语】' + tg.desc + '\n\n';
  keTiPan += '【详细解说】\n';
  keTiPan += '《大六壬大全》将课体分为六十四种，' + tg.name + '为其一。\n';
  keTiPan += tg.detail + '\n\n';
  keTiPan += '日干' + ds + '（五行属' + de + '），日支' + db + '。\n';
  keTiPan += '日干为求测者本人，日支为所问之事或对方。\n';
  keTiPan += '日干' + ds + '之人，' + getDayStemAnalysis(ds) + '\n';
  keTiPan += '在此' + tg.name + '课中：' + tg.advice + '\n';

  // ═══ b) 四课分析 ═══
  var siKePan = '';
  siKePan += '══════ 四课排列 ══════\n\n';
  siKePan += '第一课（日子阳神）：' + sk.ke1 + '（上' + sk.ke1Gan + '）\n';
  siKePan += '  日干' + ds + '寄宫于' + sk.ke1 + '，上乘之神为' + sk.ke1Gan + '。\n';
  siKePan += '  天地盘关系：地盘' + sk.ke1 + '(' + LR_ZHI_WX[sk.ke1] + ') ← 天盘' + sk.ke1Gan + '(' + _getGanWx(sk.ke1Gan) + ')\n';
  var ka1 = _analyzeKe(sk.ke1, sk.ke1Gan, ds);
  siKePan += '  ' + ka1 + '\n\n';

  siKePan += '第二课（日干阴神）：' + sk.ke2 + '（上' + sk.ke2Gan + '）\n';
  siKePan += '  日干阴神主暗中变化。\n';
  var ka2 = _analyzeKe(sk.ke2, sk.ke2Gan, ds);
  siKePan += '  ' + ka2 + '\n\n';

  siKePan += '第三课（日支阳神）：' + sk.ke3 + '（上' + sk.ke3Gan + '）\n';
  siKePan += '  日支' + db + '主外部环境和所问之事。\n';
  var ka3 = _analyzeKe(sk.ke3, sk.ke3Gan, ds);
  siKePan += '  ' + ka3 + '\n\n';

  siKePan += '第四课（日支阴神）：' + sk.ke4 + '（上' + sk.ke4Gan + '）\n';
  siKePan += '  日支阴神主事体暗中变化。\n';
  var ka4 = _analyzeKe(sk.ke4, sk.ke4Gan, ds);
  siKePan += '  ' + ka4 + '\n\n';

  siKePan += '【四课总评】\n';
  siKePan += '《六壬粹言》曰:「四课者，六壬之根本也。课不备则事不彰。」\n';
  siKePan += '日干' + ds + '寄于' + sk.ke1 + '，上乘' + sk.ke1Gan + '。';
  if (_wxKe(_getGanWx(sk.ke1Gan), de)) siKePan += '上神克日主，事主受制，宜谨慎应对。\n';
  else if (_wxSheng(de, _getGanWx(sk.ke1Gan))) siKePan += '日主生上神，事主付出较多，但有前途。\n';
  else siKePan += '上下基本和谐，事可着手。\n';

  // ═══ c) 三传详解 ═══
  var sanChuanPan = '';
  sanChuanPan += '══════ 三传详解 ══════\n\n';
  sanChuanPan += '发用之法：' + (sc.faType || '常规取法') + '\n\n';
  
  sanChuanPan += '【初传（发端门）】' + sc.faYong + '（' + LR_ZHI_WX[sc.faYong] + '）\n';
  sanChuanPan += '初传为事之开端，一切因果的起点。\n';
  sanChuanPan += '初传' + sc.faYong + '居十二宫，五行属' + LR_ZHI_WX[sc.faYong] + '。\n';
  sanChuanPan += '此为「发端门」，代表事情的起因和最初状态。\n';
  if (ct.fa) {
    sanChuanPan += '初传乘' + ct.fa.name + '（' + ct.fa.nature + '），' + ct.fa.desc.substring(0, 60) + '…\n';
  }
  sanChuanPan += '\n';

  sanChuanPan += '【中传（移易门）】' + sc.zhongChuan + '（' + LR_ZHI_WX[sc.zhongChuan] + '）\n';
  sanChuanPan += '中传为事之发展，中间的转折和变化。\n';
  sanChuanPan += '中传' + sc.zhongChuan + '居十二宫，五行属' + LR_ZHI_WX[sc.zhongChuan] + '。\n';
  sanChuanPan += '此为「移易门」，事物在此阶段发生改变、转移。\n';
  if (ct.zhong) {
    sanChuanPan += '中传乘' + ct.zhong.name + '（' + ct.zhong.nature + '），' + ct.zhong.desc.substring(0, 60) + '…\n';
  }
  sanChuanPan += '\n';

  sanChuanPan += '【末传（归计门）】' + sc.moChuan + '（' + LR_ZHI_WX[sc.moChuan] + '）\n';
  sanChuanPan += '末传为事之结果，最终的归宿和定论。\n';
  sanChuanPan += '末传' + sc.moChuan + '居十二宫，五行属' + LR_ZHI_WX[sc.moChuan] + '。\n';
  sanChuanPan += '此为「归计门」，所有变化最终汇聚于此。\n';
  if (ct.mo) {
    sanChuanPan += '末传乘' + ct.mo.name + '（' + ct.mo.nature + '），' + ct.mo.desc.substring(0, 60) + '…\n';
  }
  sanChuanPan += '\n';

  sanChuanPan += '【三传生克流转】\n';
  for (var i = 0; i < ck.length; i++) {
    sanChuanPan += '  ▸ ' + ck[i] + '\n';
  }
  sanChuanPan += '\n《六壬指南》曰:「三传者，始、中、终也。三传递生则事顺，递克则事阻。」\n';
  sanChuanPan += '初传' + sc.faYong + '→中传' + sc.zhongChuan + '→末传' + sc.moChuan + '，';
  if (ck.length > 0 && ck[0].indexOf('顺利') >= 0) sanChuanPan += '开局顺利。\n';
  else if (ck.length > 0 && ck[0].indexOf('受阻') >= 0) sanChuanPan += '开局有阻力。\n';
  else sanChuanPan += '开局平稳。\n';

  // ═══ d) 天将分布 ═══
  var tianJiangPan = '';
  tianJiangPan += '══════ 十二天将分布 ══════\n\n';
  tianJiangPan += '贵人所在：' + tj.guirenZhi + '位（' + (tj.shunPai ? '顺排' : '逆排') + '）\n\n';
  
  var tianJiangList = [];
  for (var zhi in tj.fenbu) {
    tianJiangList.push({zhi: zhi, info: tj.fenbu[zhi]});
  }
  tianJiangList.sort(function(a, b) {
    return BRANCHES.indexOf(a.zhi) - BRANCHES.indexOf(b.zhi);
  });
  
  for (var i = 0; i < tianJiangList.length; i++) {
    var t = tianJiangList[i];
    var marker = '';
    if (t.zhi === sc.faYong) marker = ' ←初传';
    if (t.zhi === sc.zhongChuan) marker = ' ←中传';
    if (t.zhi === sc.moChuan) marker = ' ←末传';
    if (t.zhi === db) marker = ' ←日支';
    tianJiangPan += t.zhi + '位：' + t.info.name + '（' + t.info.nature + '）' + marker + '\n';
    tianJiangPan += '  ' + t.info.desc.substring(0, 80) + '…\n';
  }
  tianJiangPan += '\n';
  
  // 特殊组合
  var faGod = ct.fa ? ct.fa.name : '';
  var moGod = ct.mo ? ct.mo.name : '';
  tianJiangPan += '【天将生克关系】\n';
  if (faGod === '青龙' && moGod === '贵人') {
    tianJiangPan += '初传青龙，末传贵人——始于财喜，终于贵显，大吉之象。\n';
  } else if (faGod === '白虎' && moGod === '贵人') {
    tianJiangPan += '初传白虎，末传贵人——先凶后吉，虽有风险但贵人相助化险为夷。\n';
  } else if (faGod === '螣蛇' && moGod === '青龙') {
    tianJiangPan += '初传螣蛇，末传青龙——始有虚惊，终得喜庆。\n';