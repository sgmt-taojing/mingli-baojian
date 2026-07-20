// 道医商城 · 渲染逻辑（从 divination-hub.html 抽出）
// 包含：商城分类切换 / 道医产品 / 佛医产品 / 健康产品 / 风水摆件// ===== 商城分类切换 =====

// ===== 渲染道医产品 =====

// ===== 渲染佛医产品 =====

// ===== 渲染名医推荐 =====

// ===== 产品详情弹窗 =====

<\/script>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `改名分析报告_${nameOut}.html`;
  a.click();
  URL.revokeObjectURL(url);
}
function displayCompanyNames(names, industry, style) {
  const grid = document.getElementById('companyNamesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  names.forEach((name, index) => {
    // 计算三才五格
    const wuge = calculateWuge(name);
    let score = 0;
    let analysis = '';

    if (wuge) {
      const sancai = analyzeSancai(wuge);
      score = calculateNameScore(wuge, sancai, { hasData: true, smoothScore: 75 }, { chars: name.split(''), meanings: name.split('').map(() => '吉'), combined: '吉' }, []);
      analysis = `三才配置:${sancai.tian}→${sancai.ren}→${sancai.di}(${sancai.luck})`;
    } else {
      score = 70;
      analysis = '无法计算三才五格';
    }

    const card = document.createElement('div');
    card.className = 'company-name-card';
    card.innerHTML = `
      <button class="cn-save-btn" onclick="saveCompanyName('${name}')">收藏</button>
      <div class="cn-name">${name}</div>
      <div class="cn-score">综合评分:${score}分 | 行业:${industry} | 风格:${style}</div>
      <div class="cn-analysis">${analysis}</div>
    `;
    grid.appendChild(card);
  });

  // 显示结果区域
  const result = document.getElementById('companyResult');
  if (result) {
    result.classList.add('visible');
  }
  const meta = document.getElementById('companyBannerMeta');
  if (meta) {
    meta.textContent = `行业:${industry} | 字数:${names[0].length}字 | 风格:${style}`;
  }
}







function regenerateCompanyNames() {
  generateCompanyNames();
}

// ================================================================
// 手机号增强功能
// ================================================================

/* analyzeMobileFengshui dup removed */
function analyzeMobileFengshuiCore(mobileNumber) {
  const digits = mobileNumber.replace(/\D/g, '');

  if (digits.length === 0) {
    return null;
  }

  const digitWuxing = {
    '1': '水', '2': '火',
    '3': '木', '4': '金',
    '5': '土', '6': '水',
    '7': '火', '8': '木',
    '9': '金', '0': '土'
  };

  const wuxingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  digits.split('').forEach(d => {
    const wx = digitWuxing[d];
    if (wx) {
      wuxingCount[wx]++;
    }
  });

  const total = digits.length;
  const wuxingPercent = {};
  for (const wx in wuxingCount) {
    wuxingPercent[wx] = Math.round((wuxingCount[wx] / total) * 100);
  }

  const maxPercent = Math.max(...Object.values(wuxingPercent));
  const minPercent = Math.min(...Object.values(wuxingPercent));
  const dominantWuxing = Object.keys(wuxingPercent).find(wx => wuxingPercent[wx] === maxPercent);
  const weakWuxing = Object.keys(wuxingPercent).find(wx => wuxingPercent[wx] === minPercent);

  let advice = '';
  if (maxPercent > 30) {
    advice += `<p>您的号码中<strong>${dominantWuxing}</strong>过旺(${maxPercent}%),建议:</p>`;
    if (dominantWuxing === '木') {
      advice += '<p>• 减少使用带木五行的数字(1、2)</p>';
      advice += '<p>• 可搭配火五行数字(3、4)来泄木气</p>';
    } else if (dominantWuxing === '火') {
      advice += '<p>• 减少使用带火五行的数字(3、4)</p>';
      advice += '<p>• 可搭配土五行数字(5、6)来泄火气</p>';
    } else if (dominantWuxing === '土') {
      advice += '<p>• 减少使用带土五行的数字(5、6)</p>';
      advice += '<p>• 可搭配金五行数字(7、8)来泄土气</p>';
    } else if (dominantWuxing === '金') {
      advice += '<p>• 减少使用带金五行的数字(7、8)</p>';
      advice += '<p>• 可搭配水五行数字(9、0)来泄金气</p>';
    } else if (dominantWuxing === '水') {
      advice += '<p>• 减少使用带水五行的数字(9、0)</p>';
      advice += '<p>• 可搭配木五行数字(1、2)来泄水气</p>';
    }
  }

  if (minPercent < 10) {
    advice += `<p>您的号码中<strong>${weakWuxing}</strong>过弱(${minPercent}%),建议:</p>`;
    if (weakWuxing === '木') {
      advice += '<p>• 增加使用带木五行的数字(1、2)</p>';
    } else if (weakWuxing === '火') {
      advice += '<p>• 增加使用带火五行的数字(3、4)</p>';
    } else if (weakWuxing === '土') {
      advice += '<p>• 增加使用带土五行的数字(5、6)</p>';
    } else if (weakWuxing === '金') {
      advice += '<p>• 增加使用带金五行的数字(7、8)</p>';
    } else if (weakWuxing === '水') {
      advice += '<p>• 增加使用带水五行的数字(9、0)</p>';
    }
  }

  return {
    digits,
    wuxingCount,
    wuxingPercent,
    total,
    dominantWuxing,
    weakWuxing,
    advice
  };
}






// ===== CRITICAL FIX: addEventListener 绑定所有关键按钮 =====
document.addEventListener('DOMContentLoaded', function() {
  // console.log('易道智鉴 - 事件绑定完成');

  // 排盘按钮
  let baziBtn = document.getElementById('baziBtn');
  if (baziBtn) {
    baziBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      // console.log('排盘按钮被点击');
      if (typeof computeBazi === 'function') {
        computeBazi();
      } else {
        console.error('computeBazi 函数未定义');
        showToast('排盘函数未加载完成，请刷新页面重试');
      }
    });
  }

  // 导航按钮 - 使用事件委托
  document.body.addEventListener('click', function(e) {
    let btn = e.target.closest('.nav-tab');
    if (btn) {
      let onclick = btn.getAttribute('onclick');
      if (onclick && onclick.indexOf('showSection') >= 0) {
        let match = onclick.match(/showSection\(['"]([^'"]+)['"]\)/);
        if (match) {
          e.preventDefault();
          e.stopPropagation();
          showSection(match[1]);
          return;
        }
      }
      if (onclick && onclick.indexOf('window.location') >= 0) {
        // 外部链接按钮不拦截
        return;
      }
    }
  });

  // 化解案例库按钮
  let filterBtns = document.querySelectorAll('[data-filter]');
  filterBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      let filter = this.getAttribute('data-filter');
      if (typeof filterCaseLibrary === 'function') {
        filterCaseLibrary(filter, this);
      }
    });
  });
});

// console.log('易道智鉴 v2026.06.13.1705 - 按钮修复补丁加载');
// ================================================================
// 公司取名功能（专业升级版）
// ================================================================

// 行业五行匹配表
const INDUSTRY_WUXING = {
  tech: { name: '科技', wuxing: '火', prefer: ['木', '火'], avoid: ['金', '水'], desc: '科技属火，宜木火相生，忌金水克泄' },
  finance: { name: '金融', wuxing: '金', prefer: ['土', '金'], avoid: ['火', '木'], desc: '金融属金，宜土金相生，忌火木克耗' },
  education: { name: '教育', wuxing: '水', prefer: ['金', '水'], avoid: ['土', '火'], desc: '教育属水，宜金水相生，忌土火克耗' },
  medical: { name: '医疗', wuxing: '木', prefer: ['水', '木'], avoid: ['金', '土'], desc: '医疗属木，宜水木相生，忌金土克耗' },
  food: { name: '餐饮', wuxing: '火', prefer: ['木', '火'], avoid: ['金', '水'], desc: '餐饮属火，宜木火相生，忌金水克泄' },
  realestate: { name: '房地产', wuxing: '土', prefer: ['火', '土'], avoid: ['木', '水'], desc: '房地产属土，宜火土相生，忌木水克耗' },
  culture: { name: '文化', wuxing: '木', prefer: ['水', '木'], avoid: ['金', '土'], desc: '文化属木，宜水木相生，忌金土克耗' },
  other: { name: '其他', wuxing: '土', prefer: ['火', '土'], avoid: ['木', '水'], desc: '通用属土，宜火土相生，忌木水克耗' }
};

// 创始人八字分析
function analyzeFounderBazi(baziStr) {
  if (!baziStr || baziStr.trim() === '') return null;
  
  const wuxingCount = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  const chars = baziStr.trim().split(/\s+/);
  
  const tiangan = { '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水' };
  const dizhi = { '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火', '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水' };
  
  chars.forEach(char => {
    if (tiangan[char]) wuxingCount[tiangan[char]]++;
    if (dizhi[char]) wuxingCount[dizhi[char]]++;
  });
  
  const sorted = Object.entries(wuxingCount).sort((a, b) => a[1] - b[1]);
  const yongshen = sorted[0][0];
  const jishen = sorted[sorted.length - 1][0];
  
  return {
    bazi: baziStr,
    wuxingCount,
    yongshen,
    jishen,
    advice: `创始人八字五行${yongshen}弱，宜补${yongshen}；${jishen}旺，忌${jishen}。`
  };
}

// 计算公司名三才五格（适配2/3/4字名）
function calculateCompanyWuge(companyName) {
  if (!companyName || companyName.length < 2) return null;
  
  const chars = companyName.split('');
  const strokes = chars.map(c => getKangxiStroke(c));
  
  if (strokes.some(s => s === 0)) {
    return null;
  }
  
  const n = chars.length;
  let tianGe, renGe, diGe, zongGe, waiGe;
  
  if (n === 2) {
    tianGe = strokes[0] + 1;
    renGe = strokes[0] + strokes[1];
    diGe = strokes[1] + 1;
    zongGe = strokes[0] + strokes[1];
    waiGe = zongGe - renGe + 1;
  } else if (n === 3) {
    tianGe = strokes[0] + 1;
    renGe = strokes[0] + strokes[1];
    diGe = strokes[1] + strokes[2];
    zongGe = strokes[0] + strokes[1] + strokes[2];
    waiGe = zongGe - renGe + 1;
  } else if (n === 4) {
    tianGe = strokes[0] + strokes[1];
    renGe = strokes[1] + strokes[2];
    diGe = strokes[2] + strokes[3];
    zongGe = strokes[0] + strokes[1] + strokes[2] + strokes[3];
    waiGe = zongGe - renGe + 1;
  } else {
    return null;
  }
  
  return {
    tianGe, renGe, diGe, zongGe, waiGe,
    tianGeWuxing: getWuxingFromStroke(tianGe),
    renGeWuxing: getWuxingFromStroke(renGe),
    diGeWuxing: getWuxingFromStroke(diGe),
    zongGeWuxing: getWuxingFromStroke(zongGe),
    waiGeWuxing: getWuxingFromStroke(waiGe),
    strokes
  };
}

// 分析三才配置（详细版）
function analyzeSancaiDetail(wuge) {
  const { tianGeWuxing, renGeWuxing, diGeWuxing } = wuge;
  
  const sheng = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const ke = { '木': '土', '土': '水', '水': '火', '火': '金', '金': '木' };
  const bgSheng = { '木': '水', '火': '木', '土': '火', '金': '土', '水': '金' };
  
  const tian = tianGeWuxing;
  const ren = renGeWuxing;
  const di = diGeWuxing;
  
  let score = 0;
  let analysis = '';
  let tianRenRelation = '';
  let renDiRelation = '';
  
  // 天→人关系
  if (sheng[tian] === ren) {
    score += 30;
    tianRenRelation = '相生';
    analysis += `天格${tian}生人格${ren}，上佳，得天助；`;
  } else if (bgSheng[tian] === ren) {
    score += 20;
    tianRenRelation = '得生';
    analysis += `天格${tian}得人格${ren}生，平稳；`;
  } else if (tian === ren) {
    score += 20;
    tianRenRelation = '比和';
    analysis += `天格${tian}与人格${ren}比和，平稳；`;
  } else if (ke[tian] === ren) {
    score -= 10;
    tianRenRelation = '相克';
    analysis += `天格${tian}克人格${ren}，不利；`;
  } else if (bgSheng[ren] === tian) {
    score -= 5;
    tianRenRelation = '被克';
    analysis += `天格${tian}被人格${ren}克，有阻；`;
  } else {
    score += 10;
    tianRenRelation = '一般';
    analysis += `天格${tian}与人格${ren}关系一般；`;
  }
  
  // 人→地关系
  if (sheng[ren] === di) {
    score += 30;
    renDiRelation = '相生';
    analysis += `人格${ren}生地格${di}，基础稳固；`;
  } else if (bgSheng[ren] === di) {
    score += 20;
    renDiRelation = '得生';
    analysis += `人格${ren}得地格${di}生，发展平顺；`;
  } else if (ren === di) {
    score += 20;
    renDiRelation = '比和';
    analysis += `人格${ren}与地格${di}比和，发展平顺；`;
  } else if (ke[ren] === di) {
    score -= 10;
    renDiRelation = '相克';
    analysis += `人格${ren}克地格${di}，基础不稳；`;
  } else if (bgSheng[di] === ren) {
    score -= 5;
    renDiRelation = '被克';
    analysis += `人格${ren}被地格${di}克，有阻；`;
  } else {
    score += 10;
    renDiRelation = '一般';
    analysis += `人格${ren}与地格${di}关系一般；`;
  }
  
  let luck = '';
  if (score >= 50) {
    luck = '大吉';
  } else if (score >= 30) {
    luck = '吉';
  } else if (score >= 10) {
    luck = '半吉';
  } else {
    luck = '凶';
  }
  
  return {
    tian, ren, di,
    tianRenRelation, renDiRelation,
    score, luck, analysis
  };
}

// 计算公司名综合评分
function calculateCompanyScore(wuge, sancai, industry, founderBazi) {
  let score = 60;
  let details = [];
  
  // 1. 三才配置评分
  const sancaiScore = Math.min(40, sancai.score + 20);
  score += sancaiScore;
  details.push(`三才配置评分:${sancaiScore}分（${sancai.luck}）`);
  
  // 2. 五格吉凶评分
  let wugeScore = 0;
  [wuge.tianGe, wuge.renGe, wuge.diGe, wuge.waiGe, wuge.zongGe].forEach(val => {
    const luckDetail = WUGE_LUCK_DETAIL[val] || { luck: '平', desc: '' };
    if (luckDetail.luck === '大吉') wugeScore += 6;
    else if (luckDetail.luck === '吉') wugeScore += 4;
    else if (luckDetail.luck === '半吉') wugeScore += 2;
  });
  score += wugeScore;
  details.push(`五格吉凶评分:${wugeScore}分`);
  
  // 3. 行业五行匹配评分
  const industryInfo = INDUSTRY_WUXING[industry];
  if (industryInfo) {
    const nameWuxing = wuge.renGeWuxing;
    if (industryInfo.prefer.includes(nameWuxing)) {
      score += 20;
      details.push(`行业五行匹配:+20分（${nameWuxing}为${industryInfo.name}宜用）`);
    } else if (industryInfo.avoid.includes(nameWuxing)) {
      score -= 10;
      details.push(`行业五行匹配:-10分（${nameWuxing}为${industryInfo.name}忌用）`);
    } else {
      score += 10;
      details.push(`行业五行匹配:+10分（${nameWuxing}与${industryInfo.name}中和）`);
    }
  }
  
  // 4. 创始人八字匹配评分
  if (founderBazi && founderBazi.yongshen) {
    const nameWuxing = wuge.renGeWuxing;
    if (nameWuxing === founderBazi.yongshen) {
      score += 10;
      details.push(`创始人八字匹配:+10分（${nameWuxing}补用神）`);
    } else if (nameWuxing === founderBazi.jishen) {
      score -= 10;
      details.push(`创始人八字匹配:-10分（${nameWuxing}犯忌神）`);
    }
  }
  
  score = Math.max(0, Math.min(100, score));
  
  return { score, details };
}


// 生成公司名（升级版）
function generateCompanyNames() {
 try {
  const industry = (document.getElementById('companyIndustry')||{}).value || 'tech';
  const wordCount = parseInt((document.getElementById('companyWordCount')||{}).value) || 3;
  const style = (document.getElementById('companyStyle')||{}).value || '大气';
  const founderBazi = ((document.getElementById('companyFounderBazi')||{}).value||'').trim();
  const founderHour = document.getElementById('companyFounderHour')?.value || '';
  const founderSex = document.getElementById('companyFounderSex')?.value || 'male';
  const founderBirthCity = document.getElementById('companyFounderBirthCity')?.value || '';
  const preferWuxing = (document.getElementById('preferWuxing')||{}).value || '';
  const avoidNumbers = ((document.getElementById('avoidNumbers')||{}).value||'').trim();

  // 显示加载状态
  const btn = document.getElementById('companyBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '正在生成...';
  }

  // 分析法人八字（优先用日期+时辰精准计算）
  let baziAnalysis = null;
  if (founderBazi && typeof computeBaziCore === 'function') {
    try {
      let parts = founderBazi.split('-');
      let hourVal = founderHour !== '' ? parseInt(founderHour) * 2 : 12;
      let bazi = computeBaziCore(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), hourVal);
      if (bazi) {
        let eleCount = {'金':0,'木':0,'水':0,'火':0,'土':0};
        for (let i = 0; i < 4; i++) {
          if (bazi.pillars[i] && bazi.pillars[i].element) eleCount[bazi.pillars[i].element] = (eleCount[bazi.pillars[i].element]||0) + 1;
        }
        let weakest = '木', minCount = 99;
        for (let e in eleCount) { if (eleCount[e] < minCount) { minCount = eleCount[e]; weakest = e; } }
        baziAnalysis = {
          yongshen: weakest,
          dayStem: bazi.pillars[2] ? bazi.pillars[2].stem : '甲',
          eleCount: eleCount,
          sex: founderSex,
          birthCity: founderBirthCity
        };
      }
    } catch(e) { console.warn('法人八字计算失败:', e.message); }
  }
  if (!baziAnalysis) baziAnalysis = analyzeFounderBazi(founderBazi);

  // 如果用户未手动选喜用神，但八字分析出了用神，自动设置
  if (!preferWuxing && baziAnalysis && baziAnalysis.yongshen) {
    // 用八字用神作为喜用神
  }

  // 获取行业用字
  const chars = INDUSTRY_CHARS[industry] || INDUSTRY_CHARS['other'];

  // 智能命名策略
  const names = [];
  const usedNames = new Set();

  // 策略1: 根据风格选择核心字
  const stylePrefixes = {
    modern: ['智','创','新','锐','领','先','科','技','未','来'],
    traditional: ['德','仁','义','礼','信','诚','和','泰','盛','隆'],
    elegant: ['雅','馨','瑞','祥','和','美','华','丽','锦','绣'],
    bold: ['宏','伟','巨','大','强','盛','隆','昌','旺','达']
  };
  const styleSuffixes = {
    modern: ['达','通','联','网','云','芯','能','源','创','新'],
    traditional: ['堂','轩','阁','斋','苑','居','府','院','楼','庄'],
    elegant: ['轩','阁','苑','庭','园','居','舍','坊','社','馆'],
    bold: ['达','盛','隆','昌','旺','发','兴','荣','华','贵']
  };

  const prefixes = stylePrefixes[style] || stylePrefixes.modern;
  const suffixes = styleSuffixes[style] || styleSuffixes.modern;

  // 策略2: 根据喜用神选择五行字
  const wuxingChars = {
    木: ['林','森','栋','梁','材','茂','荣','华','春','生'],
    火: ['炎','炜','灿','耀','辉','明','亮','照','光','热'],
    土: ['坤','地','基','础','稳','固','城','垣','培','基'],
    金: ['金','鑫','锐','锋','铭','钧','钰','银','铜','铁'],
    水: ['源','泉','泽','润','涵','洁','清','深','远','阔']
  };

  // 生成高质量公司名
  let attempts = 0;
  const maxAttempts = 200;

  while (names.length < 8 && attempts < maxAttempts) {
    attempts++;
    let name = '';

    // 策略轮换
    const strategy = attempts % 4;

    if (strategy === 0) {
      // 风格前缀 + 行业字
      name = prefixes[Math.floor((Date.now() / 1000 + attempts * 3) % prefixes.length)];
      for (let i = 1; i < wordCount; i++) {
        name += chars[Math.floor((Date.now() / 1000 + attempts * 7 + i * 11) % chars.length)];
      }
    } else if (strategy === 1) {
      // 行业字 + 风格后缀
      for (let i = 0; i < wordCount - 1; i++) {
        name += chars[Math.floor((Date.now() / 1000 + attempts * 5 + i * 9) % chars.length)];
      }
      name += suffixes[Math.floor((Date.now() / 1000 + attempts * 13) % suffixes.length)];
    } else if (strategy === 2 && preferWuxing && wuxingChars[preferWuxing]) {
      // 喜用神五行字 + 行业字
      const wxChars = wuxingChars[preferWuxing];
      name = wxChars[Math.floor((Date.now() / 1000 + attempts * 17) % wxChars.length)];
      for (let i = 1; i < wordCount; i++) {
        name += chars[Math.floor((Date.now() / 1000 + attempts * 19 + i * 7) % chars.length)];
      }
    } else {
      // 纯随机（但保证质量）
      for (let i = 0; i < wordCount; i++) {
        // 优先选择康熙笔画吉利的字
        const filteredChars = chars.filter(c => {
          const stroke = KANGXI_STROKES[c];
          return stroke && [1,3,5,6,7,8,11,13,15,16,17,18,21,23,24,25,29,31,32,33,35,37,39,41,45,47,48,52,57,61,63,65,67,68,81].includes(stroke);
        });
        if (filteredChars.length > 0 && (Date.now() / 1000 + attempts) % 10 > 3) {
          name += filteredChars[Math.floor((Date.now() / 1000 + attempts * 23 + i * 5) % filteredChars.length)];
        } else {
          name += chars[Math.floor((Date.now() / 1000 + attempts * 29 + i * 3) % chars.length)];
        }
      }
    }

    // 检查重复
    if (usedNames.has(name)) continue;

    // 检查避开数理
    if (avoidNumbers) {
      const avoidList = avoidNumbers.split(/[,，、\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      const wuge = calculateCompanyWuge(name);
      if (wuge) {
        const allGe = [wuge.tianGe, wuge.renGe, wuge.diGe, wuge.waiGe, wuge.zongGe];
        if (avoidList.some(n => allGe.includes(n))) continue;
      }
    }

    // 检查三才配置
    const wuge = calculateCompanyWuge(name);
    if (wuge) {
      const sancai = `${wuge.tianGeWuxing}${wuge.renGeWuxing}${wuge.diGeWuxing}`;
      const sancaiInfo = SANCAI_CONFIG[sancai];
      // 优先选择吉利的配置
      if (sancaiInfo && (sancaiInfo.luck === '凶' || sancaiInfo.score < 50)) {
        if ((Date.now() / 1000 + attempts) % 10 > 3) continue; // 30%概率保留，增加多样性
      }
    }

    usedNames.add(name);
    names.push(name);
  }

  // 按评分排序
  const scoredNames = names.map(name => {
    const wuge = calculateCompanyWuge(name);
    let score = 70;
    if (wuge) {
      const sancai = `${wuge.tianGeWuxing}${wuge.renGeWuxing}${wuge.diGeWuxing}`;
      const sancaiInfo = SANCAI_CONFIG[sancai] || { score: 60 };
      score = sancaiInfo.score;
    }
    return { name, score };
  }).sort((a, b) => b.score - a.score).map(n => n.name);

  // 显示结果
  displayCompanyNamesPro(scoredNames, industry, style, baziAnalysis);

  // 恢复按钮状态
  if (btn) {
    btn.disabled = false;
    btn.textContent = '生 成 专 业 公 司 名';
  }
 } catch(e) {
  console.error('[公司取名错误]', e.message, e.stack);
  showToast('公司取名出错: ' + e.message);
  let _btn = document.getElementById('companyBtn');
  if(_btn){_btn.disabled=false;_btn.textContent='生 成 专 业 公 司 名';}
 }
}

// 显示公司名（升级版）
function displayCompanyNamesPro(names, industry, style, baziAnalysis) {
  const grid = document.getElementById('companyNamesGrid');
  if (!grid) return;
  grid.innerHTML = '';

  // 显示行业五行表和康熙笔画参照
  const industryTable = document.getElementById('industryWuxingTable');
  const kangxiRef = document.getElementById('kangxiStrokesRef');
  if (industryTable) industryTable.style.display = 'block';
  if (kangxiRef) kangxiRef.style.display = 'block';

  // 填充行业五行表
  fillIndustryTable();
  // 填充康熙笔画参照
  fillKangxiRef();

  names.forEach((name, index) => {
    const wuge = calculateCompanyWuge(name);
    let score = 0;
    let analysis = '';
    let detailHTML = '';
    let aiPrediction = '';

    if (wuge) {
      const sancai = analyzeSancaiDetail(wuge);
      const scoreResult = calculateCompanyScore(wuge, sancai, industry, baziAnalysis);
      score = scoreResult.score;
      analysis = `三才:${sancai.tian}→${sancai.ren}→${sancai.di}（${sancai.luck}）| 评分:${score}分`;

      // AI预测分析
      aiPrediction = generateAIPrediction(name, wuge, sancai, industry, baziAnalysis);

      // 生成详细分析报告
      detailHTML = generateDetailAnalysis(name, wuge, sancai, scoreResult, industry, baziAnalysis, aiPrediction);
    } else {
      score = 70;
      analysis = '无法计算三才五格（可能含生僻字）';
    }

    // 评分颜色
    const scoreColor = score >= 85 ? 'var(--green)' : score >= 70 ? 'var(--gold)' : 'var(--red)';

    const card = document.createElement('div');
    card.className = 'company-name-card';
    card.innerHTML = `
      <button class="cn-save-btn" onclick="saveCompanyName('${name}')">收藏</button>
      <div class="cn-name">${name}</div>
      <div class="cn-score">综合评分:<span style="color:${scoreColor};font-weight:bold">${score}</span>分 | ${industry} | ${style}</div>
      <div class="cn-analysis">${analysis}</div>
      ${aiPrediction ? `<div class="cn-ai-prediction"><span style="color:var(--cyan)">🔮 AI预测:</span>${aiPrediction}</div>` : ''}
      <button class="action-btn" style="margin-top:8px;font-size:11px;padding:4px 12px;" onclick="toggleDetailAnalysis(${index})">查看详细分析</button>
      <div id="detail-${index}" style="display:none;margin-top:12px;">${detailHTML}</div>
    `;
    grid.appendChild(card);
  });

  // 显示结果区域
  const resultDiv = document.getElementById('companyResult');
  if (resultDiv) resultDiv.classList.add('visible');

  const bannerMeta = document.getElementById('companyBannerMeta');
  if (bannerMeta) bannerMeta.textContent = `行业:${industry} | 字数:${names[0] ? names[0].length : 0}字 | 风格:${style}`;

  // 显示示例分析
  const exampleDiv = document.getElementById('exampleAnalysis');
  if (exampleDiv) {
    exampleDiv.style.display = 'block';
    fillExampleAnalysis();
  }
}

// AI预测分析（结合当下形势）
function generateAIPrediction(name, wuge, sancai, industry, baziAnalysis) {
  const predictions = [];

  // 1. 行业趋势分析（2024-2030）
  const industryTrends = {
    tech: '科技行业正处于AI爆发期，数字化转型加速，未来5年持续高增长',
    finance: '金融科技融合趋势明显，合规与创新并重，稳健发展为上',
    education: '教育行业转型升级，素质教育和AI教育是未来方向',
    medical: '大健康产业蓬勃发展，老龄化趋势带来持续需求',
    food: '餐饮行业品牌化、健康化趋势明显，食品安全是关键',
    realestate: '地产行业调整期，品质和服务是核心竞争力',
    culture: '文化产业迎来黄金期，国潮文化、数字文创是热点',
    ecommerce: '电商进入存量竞争，精细化运营和私域流量是关键',
    logistics: '物流行业智能化升级，最后一公里和冷链物流是增长点',
    energy: '新能源革命加速，碳中和目标带来万亿市场',
    other: '通用行业，建议根据具体业务方向制定发展策略'
  };

  const trend = industryTrends[industry] || industryTrends.other;
  predictions.push(`${trend}`);

  // 2. 五行能量分析
  const wuxingPower = {
    木: {growth:'快速成长期',suitable:'教育、文化、医疗、林业',challenge:'竞争激烈，需差异化'},
    火: {growth:'爆发增长期',suitable:'科技、能源、餐饮、传媒',challenge:'波动大，需控制风险'},
    土: {growth:'稳定发展期',suitable:'地产、建筑、农业、物流',challenge:'增长慢，需深耕细作'},
    金: {growth:'调整转型期',suitable:'金融、制造、法律、咨询',challenge:'压力大，需创新突破'},
    水: {growth:'机遇期',suitable:'贸易、物流、服务业、饮品',challenge:'变化快，需灵活应变'}
  };

  const renWuxing = wuge.renGeWuxing;
  const powerInfo = wuxingPower[renWuxing];
  if (powerInfo) {
    predictions.push(`五行能量（人格${renWuxing}）: ${powerInfo.growth}，适合${powerInfo.suitable}相关，挑战: ${powerInfo.challenge}`);
  }

  // 3. 数理能量分析
  const zongGe = wuge.zongGe;
  const zongGeInfo = WUGE_LUCK_DETAIL[zongGe];
  if (zongGeInfo) {
    predictions.push(`总格${zongGe}数理: ${zongGeInfo.luck}，${zongGeInfo.desc.slice(0, 20)}...`);
  }

  // 4. 三才配置建议
  if (sancai.luck === '大吉' || sancai.luck === '吉') {
    predictions.push(`三才${sancai.tian}${sancai.ren}${sancai.di}配置佳，有利于长期发展和品牌建设`);
  } else if (sancai.luck === '半吉') {
    predictions.push(`三才配置中等，建议通过品牌定位、团队建设弥补能量不足`);
  } else {
    predictions.push(`三才配置有挑战，建议通过风水布局、团队配置来化解`);
  }

  // 5. 品牌传播分析
  const nameLength = name.length;
  if (nameLength === 2) {
    predictions.push('二字名简洁易记，利于品牌传播，建议配合视觉设计强化记忆');
  } else if (nameLength === 3) {
    predictions.push('三字名平衡感好，既有辨识度又有内涵，适合品牌长期发展');
  } else {
    predictions.push('四字及以上名称独特性强，但需注意传播成本，建议配合简称使用');
  }

  return predictions.join(' | ');
}

// 生成详细分析报告
function generateDetailAnalysis(name, wuge, sancai, scoreResult, industry, baziAnalysis, aiPrediction) {
  let html = `<div style="padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;font-size:13px;line-height:1.8;">`;

  // 0. AI预测分析（置顶）
  if (aiPrediction) {
    html += `<h5 style="color:var(--cyan);">🔮 AI智能预测（结合当下形势）</h5>`;
    html += `<div style="padding:12px;background:rgba(0,100,150,0.15);border-radius:8px;margin-bottom:12px;">`;
    aiPrediction.split('|').forEach(p => {
      html += `<div style="margin:6px 0;">${p.trim()}</div>`;
    });
    html += `</div>`;
  }

  // 1. 五格计算详情
  html += `<h5 style="color:var(--gold);">📊 五格计算详情</h5>`;
  html += `<div style="padding:8px 0;">`;
  html += `康熙笔画:${name.split('').map((c, i) => `${c}(${wuge.strokes[i]})`).join(' + ')}<br>`;
  
  const wugeItems = [
    { name: '天格', val: wuge.tianGe, wuxing: wuge.tianGeWuxing },
    { name: '人格', val: wuge.renGe, wuxing: wuge.renGeWuxing },
    { name: '地格', val: wuge.diGe, wuxing: wuge.diGeWuxing },
    { name: '外格', val: wuge.waiGe, wuxing: wuge.waiGeWuxing },
    { name: '总格', val: wuge.zongGe, wuxing: wuge.zongGeWuxing }
  ];
  
  wugeItems.forEach(item => {
    const luckDetail = WUGE_LUCK_DETAIL[item.val] || { luck: '平', desc: '' };
    const color = luckDetail.luck === '大吉' ? 'var(--green)' : luckDetail.luck === '吉' ? 'var(--cyan)' : luckDetail.luck === '半吉' ? 'var(--gold)' : 'var(--red)';
    html += `${item.name}:${item.val}（${item.wuxing}） - <span style="color:${color}">${luckDetail.luck}</span> - ${luckDetail.desc}<br>`;
  });
  html += `</div>`;
  
  // 2. 三才配置分析
  html += `<h5 style="color:var(--cyan);margin-top:12px;">🌳 三才配置分析</h5>`;
  html += `<div style="padding:8px 0;">`;
  html += `三才:${sancai.tian} → ${sancai.ren} → ${sancai.di}<br>`;
  html += `关系:天→人 ${sancai.tianRenRelation} | 人→地 ${sancai.renDiRelation}<br>`;
  html += `评分:${sancai.score}分（${sancai.luck}）<br>`;
  html += `分析:${sancai.analysis}<br>`;
  html += `</div>`;
  
  // 3. 行业五行匹配
  const industryInfo = INDUSTRY_WUXING[industry];
  if (industryInfo) {
    html += `<h5 style="color:var(--green);margin-top:12px;">🏭 行业五行匹配</h5>`;
    html += `<div style="padding:8px 0;">`;
    html += `行业:${industryInfo.name}（五行属${industryInfo.wuxing}）<br>`;
    html += `宜用:${industryInfo.prefer.join('、')} | 忌用:${industryInfo.avoid.join('、')}<br>`;
    html += `公司名人格五行:${wuge.renGeWuxing}<br>`;
    if (industryInfo.prefer.includes(wuge.renGeWuxing)) {
      html += `<span style="color:var(--green);">✓ 相生相助，大利！</span><br>`;
    } else if (industryInfo.avoid.includes(wuge.renGeWuxing)) {
      html += `<span style="color:var(--red);">✗ 相克相耗，不利！</span><br>`;
    } else {
      html += `<span style="color:var(--gold);">△ 中和平顺，可用。</span><br>`;
    }
    html += `</div>`;
  }
  
  // 4. 创始人八字匹配
  if (baziAnalysis) {
    html += `<h5 style="color:var(--purple);margin-top:12px;">👤 创始人八字匹配</h5>`;
    html += `<div style="padding:8px 0;">`;
    html += `八字:${baziAnalysis.bazi}<br>`;
    html += `用神:${baziAnalysis.yongshen} | 忌神:${baziAnalysis.jishen}<br>`;
    html += `五行统计:${Object.entries(baziAnalysis.wuxingCount).map(([k, v]) => `${k}(${v})`).join('、')}<br>`;
    html += `建议:${baziAnalysis.advice}<br>`;
    if (wuge.renGeWuxing === baziAnalysis.yongshen) {
      html += `<span style="color:var(--green);">✓ 公司名五行补用神，大吉！</span><br>`;
    } else if (wuge.renGeWuxing === baziAnalysis.jishen) {
      html += `<span style="color:var(--red);">✗ 公司名五行犯忌神，不利！</span><br>`;
    }
    html += `</div>`;
  }
  
  // 5. 综合评分详情
  html += `<h5 style="color:var(--orange);margin-top:12px;">📈 综合评分详情</h5>`;
  html += `<div style="padding:8px 0;">`;
  scoreResult.details.forEach(d => {
    html += `${d}<br>`;
  });
  html += `</div>`;
  
  // 6. 经典出处
  html += `<div style="margin-top:16px;padding:12px;background:rgba(255,200,0,0.05);border-left:3px solid var(--gold);font-size:11px;color:var(--gold);line-height:1.8;">`;
  html += `<strong>📜 经典出处:</strong><br>`;
  html += `《梅花易数》云:"数者，天地之度数也。"<br>`;
  html += `《姓名学》曰:"五格者，天、人、地、外、总，对应五行，吉凶可见。"<br>`;
  html += `《五格剖象法》原序:"五格剖象，乃东瀛熊崎健翁所创，以姓名笔画推命理，颇验。"<br>`;
  html += `《周易·系辞》:"天生神物，圣人则之；天地变化，圣人效之。"<br>`;
  html += `《三命通会》:"五行相生相克，乃造化之枢纽。"<br>`;
  html += `《渊海子平》:"用神者，八字之所赖也。"<br>`;
  html += `</div>`;
  
  html += `</div>`;
  
  return html;
}


// 填充行业五行表
function fillIndustryTable() {
  const tbody = document.getElementById('industryTableBody');
  if (!tbody) return;
  
  tbody.innerHTML = '';
  Object.entries(INDUSTRY_WUXING).forEach(([key, val]) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);">${val.name}</td>
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);">${val.wuxing}</td>
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);color:var(--green);">${val.prefer.join('、')}</td>
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);color:var(--red);">${val.avoid.join('、')}</td>
      <td style="padding:8px;border:1px solid rgba(255,200,0,0.2);font-size:11px;">${val.desc}</td>
    `;
    tbody.appendChild(tr);
  });
}

// 填充康熙笔画参照（常见行业用字）
function fillKangxiRef() {
  const grid = document.getElementById('kangxiStrokesGrid');
  if (!grid) return;
  
  // 常见行业用字（100字）
  const commonChars = '科技有限公同集团网络信智创源数云芯达锐慧能联通安全未来金融诚恒盛泰鼎丰盈利富贵金银财宝融投资疗康健和美慈善救治国药医疗养生命体育餐饮味觉鲜美佳肴膳食厨房楼阁府家园庭院堂教育明德博雅思学慧启知行才智文书院阁斋文化文艺创意设计媒体传播影视音乐戏剧书画'.split('');
  
  grid.innerHTML = '';
  commonChars.forEach(char => {
    const stroke = getKangxiStroke(char);
    if (stroke > 0) {
      const div = document.createElement('div');
      div.style.cssText = 'padding:4px 8px;background:rgba(0,0,0,0.2);border-radius:4px;display:flex;justify-content:space-between;';
      div.innerHTML = `<span>${char}</span><span style="color:var(--blue);">${stroke}画</span>`;
      grid.appendChild(div);
    }
  });
}

// 填充示例分析
function fillExampleAnalysis() {
  const content = document.getElementById('exampleAnalysisContent');
  if (!content) return;
  
  let html = '';
  
  // 示例1:阿里巴巴
  html += `<div style="margin-bottom:20px;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">`;
  html += `<h6 style="color:var(--gold);">示例1:阿里巴巴（科技行业）</h6>`;
  html += `<p><strong>公司名:</strong>阿里巴巴（Alibaba）</p>`;
  html += `<p><strong>字数:</strong>4字名</p>`;
  html += `<p><strong>康熙笔画:</strong>阿(13) + 里(7) + 巴(4) + 巴(4) = 总28画</p>`;
  html += `<p><strong>五格计算:</strong>天格=13+7=20(水) | 人格=7+4=11(木) | 地格=4+4=8(金) | 外格=28-11+1=18(金) | 总格=28(金)</p>`;
  html += `<p><strong>三才配置:</strong>天格水 → 人格木 → 地格金（水→木→金）</p>`;
  html += `<p><strong>分析:</strong>天格水生人格木（吉），人格木克地格金（凶）。三才配置半吉。但阿里巴巴实际成功，因其国际化品牌策略弥补了数理不足。</p>`;
  html += `<p><strong>行业匹配:</strong>科技属火，人格木生火（吉），利于事业发展。</p>`;
  html += `<div style="margin-top:8px;font-size:11px;color:var(--gold);">📜 《梅花易数》云:"数者，天地之度数也。"阿里巴巴虽数理非完美，但品牌国际化成功，说明公司名并非唯一因素。</div>`;
  html += `</div>`;
  
  // 示例2:腾讯
  html += `<div style="margin-bottom:20px;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">`;
  html += `<h6 style="color:var(--gold);">示例2:腾讯（科技行业）</h6>`;
  html += `<p><strong>公司名:</strong>腾讯</p>`;
  html += `<p><strong>字数:</strong>2字名</p>`;
  html += `<p><strong>康熙笔画:</strong>腾(20) + 讯(10) = 总30画</p>`;
  html += `<p><strong>五格计算:</strong>天格=20+1=21(木) | 人格=20+10=30(水) | 地格=10+1=11(木) | 外格=30-30+1=1(木) | 总格=30(水)</p>`;
  html += `<p><strong>三才配置:</strong>天格木 → 人格水 → 地格木（木→水→木）</p>`;
  html += `<p><strong>分析:</strong>天格木生人格水（吉），人格水生地格木（吉）。三才配置大吉！五格数理21、11均为大吉数理。</p>`;
  html += `<p><strong>行业匹配:</strong>科技属火，人格水克火（凶），但实际腾讯以水为名，寓意"连接"，符合互联网属性。</p>`;
  html += `<div style="margin-top:8px;font-size:11px;color:var(--gold);">📜 《姓名学》曰:"五格者，天、人、地、外、总，对应五行，吉凶可见。"腾讯五格大吉，三才相生，故能大成。</div>`;
  html += `</div>`;
  
  // 示例3:华为
  html += `<div style="margin-bottom:20px;padding:16px;background:rgba(0,0,0,0.2);border-radius:8px;">`;
  html += `<h6 style="color:var(--gold);">示例3:华为（科技行业）</h6>`;
  html += `<p><strong>公司名:</strong>华为</p>`;
  html += `<p><strong>字数:</strong>2字名</p>`;
  html += `<p><strong>康熙笔画:</strong>华(14) + 为(12) = 总26画</p>`;
  html += `<p><strong>五格计算:</strong>天格=14+1=15(土) | 人格=14+12=26(土) | 地格=12+1=13(火) | 外格=26-26+1=1(木) | 总格=26(土)</p>`;
  html += `<p><strong>三才配置:</strong>天格土 → 人格土 → 地格火（土→土→火）</p>`;
  html += `<p><strong>分析:</strong>天格与人格比和（吉），人格土生地格火（吉）。三才配置大吉！五格数理15为大吉，26虽凶但有格局。</p>`;
  html += `<p><strong>行业匹配:</strong>科技属火，地格火助行业火（大吉）。华字寓意中华，为字寓意作为，符合民族企业定位。</p>`;
  html += `<div style="margin-top:8px;font-size:11px;color:var(--gold);">📜 《五格剖象法》云:"五格剖象，以姓名笔画推命理。"华为五格配置优良，三才相生，故能成为世界级企业。</div>`;
  html += `</div>`;
  
  content.innerHTML = html;
}

// 切换详细分析显示
function toggleDetailAnalysis(index) {
  const detail = document.getElementById(`detail-${index}`);
  if (detail) {
    detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
  }
}

// 切换算法详解
function toggleAlgorithmDetail() {
  const content = document.getElementById('algorithmContent');
  const toggle = document.getElementById('algorithmToggle');
  if (content && toggle) {
    if (content.style.display === 'none') {
      content.style.display = 'block';
      toggle.textContent = '[收起]';
      // 填充五格吉凶对照表
      fillWugeLuckTable();
    } else {
      content.style.display = 'none';
      toggle.textContent = '[展开]';
    }
  }
}

// 填充五格吉凶对照表
function fillWugeLuckTable() {
  const table = document.getElementById('wugeLuckTable');
  if (!table) return;
  
  let html = '';
  for (let i = 1; i <= 81; i++) {
    const detail = WUGE_LUCK_DETAIL[i] || { luck: '平', desc: '普通数理' };
    const color = detail.luck === '大吉' ? 'var(--green)' : detail.luck === '吉' ? 'var(--cyan)' : detail.luck === '半吉' ? 'var(--gold)' : 'var(--red)';
    html += `<div style="padding:4px 8px;margin:2px 0;background:rgba(0,0,0,0.2);border-left:3px solid ${color};font-size:12px;">`;
    html += `<strong>${i}画</strong> - <span style="color:${color}">${detail.luck}</span> - ${detail.desc}`;
    html += `</div>`;
  }
  table.innerHTML = html;
}

// 切换行业五行表显示
function toggleIndustryTable() {
  const table = document.getElementById('industryWuxingTable');
  if (table) {
    table.style.display = table.style.display === 'none' ? 'block' : 'none';
  }
}

// 切换康熙笔画参照显示
function toggleKangxiRef() {
  const ref = document.getElementById('kangxiStrokesRef');
  if (ref) {
    ref.style.display = ref.style.display === 'none' ? 'block' : 'none';
  }
}

// 切换示例分析显示
function toggleExampleAnalysis() {
  const example = document.getElementById('exampleAnalysis');
  if (example) {
    example.style.display = example.style.display === 'none' ? 'block' : 'none';
  }
}

// 重新生成公司名
function regenateCompanyNames() {
  generateCompanyNames();
}



// (已迁移到统一渲染引擎 showKnowledgeDetail)
// hideKnowledgeDetail 已整合到 closeKnowledgeDetail

// ============================================================
// 64卦详解展开/收起
// ============================================================
let openHexagramIndex = -1;
function toggleHexagramDetail(idx) {
    let detail = document.getElementById('hg-detail-' + idx);
    let card = document.getElementById('hg-card-' + idx);
    if (!detail) return;
    if (openHexagramIndex === idx) {
        detail.style.display = 'none';
        card.style.borderColor = 'rgba(201,168,76,0.2)';
        card.style.background = 'rgba(255,255,255,0.04)';
        openHexagramIndex = -1;
    } else {
        // Close previous
        if (openHexagramIndex >= 0) {
            let prev = document.getElementById('hg-detail-' + openHexagramIndex);
            let prevCard = document.getElementById('hg-card-' + openHexagramIndex);
            if (prev) prev.style.display = 'none';
            if (prevCard) {prevCard.style.borderColor='rgba(201,168,76,0.2)';prevCard.style.background='rgba(255,255,255,0.04)';}
        }
        detail.style.display = 'block';
        card.style.borderColor = 'var(--gold)';
        card.style.background = 'rgba(201,168,76,0.12)';
        openHexagramIndex = idx;
        detail.scrollIntoView({behavior:'smooth',block:'start'});
    }
}

// ============================================================
// section-yijing 六十四卦展示
// ============================================================
function renderYijingGuaGrid() {
  let html = '';
  for (let i = 0; i < 64; i++) {
    let g = HEXAGRAMS[i];
    if (!g) continue;
    let isUpper = i < 30;
    html += '<div onclick="showYijingGuaDetail(' + i + ')" id="yj-card-' + i + '" class="yj-gua-card">' +
      '<div style="font-size:22px;margin-bottom:3px">' + g.symbol + '</div>' +
      '<div style="font-size:12px;color:var(--gold);font-weight:bold">' + g.name + '</div>' +
      '<div style="font-size:10px;color:var(--paper2);opacity:.7">' + g.pinyin + '</div>' +
    '</div>';
    if (i === 29) {
      html += '</div><h4 style="font-size:13px;color:var(--gold);margin:20px 0 12px;text-align:center;letter-spacing:2px">—— 下经 · 三十四卦 ——</h4><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px">';
    }
  }
  let grid = document.getElementById('yijing-gua-grid');
  if (grid) {
    grid.innerHTML = '<h4 style="font-size:13px;color:var(--gold);margin-bottom:12px;text-align:center;letter-spacing:2px">—— 上经 · 三十卦 ——</h4><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:6px">' + html + '</div>';
  }
}

let yijingDetailIndex = -1;
function closeYijingGuaDetail() {
  let el = document.getElementById('yijing-gua-detail');
  if (el) { el.style.display = 'none'; el.innerHTML = ''; }
  if (yijingDetailIndex >= 0) {
    let card = document.getElementById('yj-card-' + yijingDetailIndex);
    if (card) { card.classList.remove('yj-active'); card.style.borderColor='rgba(201,168,76,0.2)'; card.style.background='rgba(255,255,255,0.04)'; }
  }
  yijingDetailIndex = -1;
}

function showYijingGuaDetail(idx) {
  let detailEl = document.getElementById('yijing-gua-detail');
  if (!detailEl) return;
  // Toggle off if same
  if (yijingDetailIndex === idx) {
    detailEl.style.display = 'none';
    let prevCard = document.getElementById('yj-card-' + idx);
    if (prevCard) { prevCard.classList.remove('yj-active'); prevCard.style.borderColor='rgba(201,168,76,0.2)'; prevCard.style.background='rgba(255,255,255,0.04)'; }
    yijingDetailIndex = -1;
    return;
  }
  // Deactivate previous
  if (yijingDetailIndex >= 0) {
    let pCard = document.getElementById('yj-card-' + yijingDetailIndex);
    if (pCard) { pCard.classList.remove('yj-active'); pCard.style.borderColor='rgba(201,168,76,0.2)'; pCard.style.background='rgba(255,255,255,0.04)'; }
  }
  let g = HEXAGRAMS[idx];
  if (!g) return;
  // Build detail HTML
  let upperNames = ['乾','兑','离','震','巽','坎','艮','坤'];
  let upperGua = g.gua[0];
  let lowerGua = g.gua[1];
  let upperName = upperGua[0]===1&&upperGua[1]===1&&upperGua[2]===1?'乾':upperGua[0]===0&&upperGua[1]===0&&upperGua[2]===0?'坤':upperGua[0]===0&&upperGua[1]===0&&upperGua[2]===1?'震':upperGua[0]===1&&upperGua[1]===0&&upperGua[2]===0?'巽':upperGua[0]===0&&upperGua[1]===1&&upperGua[2]===0?'坎':upperGua[0]===1&&upperGua[1]===1&&upperGua[2]===0?'离':upperGua[0]===1&&upperGua[1]===0&&upperGua[2]===1?'艮':upperGua[0]===0&&upperGua[1]===1&&upperGua[2]===1?'兑':'?';
  let lowerName = lowerGua[0]===1&&lowerGua[1]===1&&lowerGua[2]===1?'乾':lowerGua[0]===0&&lowerGua[1]===0&&lowerGua[2]===0?'坤':lowerGua[0]===0&&lowerGua[1]===0&&lowerGua[2]===1?'震':lowerGua[0]===1&&lowerGua[1]===0&&lowerGua[2]===0?'巽':lowerGua[0]===0&&lowerGua[1]===1&&lowerGua[2]===0?'坎':lowerGua[0]===1&&lowerGua[1]===1&&lowerGua[2]===0?'离':lowerGua[0]===1&&lowerGua[1]===0&&lowerGua[2]===1?'艮':lowerGua[0]===0&&lowerGua[1]===1&&lowerGua[2]===1?'兑':'?';
  // Try to get knowledge base data
  let kbData = null;
  try { if (typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined' && AUTHORITATIVE_KNOWLEDGE.liushisigua) { let ls = AUTHORITATIVE_KNOWLEDGE.liushisigua; if (ls.hexagrams) kbData = ls.hexagrams[idx]; else if (ls.details && ls.details[idx]) kbData = ls.details[idx]; } } catch(e) {}
  let detailHTML = '<div style="display:flex;align-items:center;margin-bottom:18px;padding-bottom:14px;border-bottom:1px solid rgba(201,168,76,0.15)">' +
    '<div style="font-size:56px;margin-right:20px">' + g.symbol + '</div>' +
    '<div><div style="font-size:24px;color:var(--gold);font-weight:bold;letter-spacing:3px">' + g.name + '卦</div>' +
    '<div style="font-size:12px;color:var(--paper2);margin-top:4px">拼音: ' + g.pinyin + ' &nbsp;|&nbsp; 第' + g.num + '卦 &nbsp;|&nbsp; 上卦:' + upperName + ' 下卦:' + lowerName + '</div>' +
    '<div style="font-size:13px;color:var(--gold2);margin-top:6px">卦辞：' + g.judgment + '</div></div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:14px;border-radius:8px;margin-bottom:14px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">白话解读</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + g.meaning + '</div></div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">' +
    '<div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:8px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">卦象结构</div><div style="font-size:12px;color:var(--paper2);line-height:1.7">上卦：' + upperName + ' · 下卦：' + lowerName + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:12px;border-radius:8px"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">核心意象</div><div style="font-size:12px;color:var(--paper2);line-height:1.7">' + g.meaning + '</div></div></div>';
  // Add knowledge base detail if available
  if (kbData) {
    if (kbData.tuan) detailHTML += '<div style="background:rgba(201,168,76,0.06);padding:14px;border-radius:8px;margin-bottom:10px;border:1px solid rgba(201,168,76,0.15)"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">彖传</div><div style="font-size:12px;color:var(--paper2);line-height:1.8">' + kbData.tuan + '</div></div>';
    if (kbData.xiang) detailHTML += '<div style="background:rgba(201,168,76,0.06);padding:14px;border-radius:8px;margin-bottom:10px;border:1px solid rgba(201,168,76,0.15)"><div style="font-size:12px;color:var(--gold);margin-bottom:6px;font-weight:bold">象传</div><div style="font-size:12px;color:var(--paper2);line-height:1.8">' + kbData.xiang + '</div></div>';
    if (kbData.yao && kbData.yao.length) {
      detailHTML += '<div style="background:rgba(0,0,0,0.2);padding:14px;border-radius:8px;margin-bottom:10px"><div style="font-size:12px;color:var(--gold);margin-bottom:8px;font-weight:bold">爻辞</div>';
      for (let yi = 0; yi < kbData.yao.length; yi++) {
        detailHTML += '<div style="margin-bottom:6px;padding-left:12px;border-left:2px solid rgba(201,168,76,0.2)"><span style="color:var(--gold2);font-size:12px">' + kbData.yao[yi].name + '：</span><span style="font-size:12px;color:var(--paper2)">' + kbData.yao[yi].text + '</span></div>';
      }
      detailHTML += '</div>';
    }
  }
  // Use existing kd-liushisigua detail if available
  let existingDetail = document.getElementById('hg-detail-' + idx);
  if (existingDetail) {
    let innerContent = existingDetail.querySelector('.cezi-analysis-card, div > div');
    if (innerContent) {
      detailHTML += '<div style="margin-top:14px">' + existingDetail.innerHTML + '</div>';
    }
  }
  // Add divination tip
  detailHTML += '<div style="background:rgba(241,196,15,0.06);padding:14px;border-radius:8px;margin-top:10px;border:1px solid rgba(241,196,15,0.2)"><div style="font-size:12px;color:var(--gold2);margin-bottom:6px;font-weight:bold">占卜提示</div><div style="font-size:12px;color:var(--paper2);line-height:1.8">' + g.name + '卦' + (g.meaning || '') + '。占得此卦者，' + (g.judgment || '') + '。宜深思熟虑，顺应天时。</div></div>';
  detailHTML += '<div style="text-align:center;margin-top:16px"><button class="compute-btn" style="padding:10px 30px;font-size:13px" onclick="closeYijingGuaDetail()">收起详情</button></div>';
  detailEl.innerHTML = detailHTML;
  detailEl.style.display = 'block';
  let card = document.getElementById('yj-card-' + idx);
  if (card) { card.classList.add('yj-active'); card.style.borderColor = 'var(--gold)'; card.style.background = 'rgba(201,168,76,0.12)'; }
  yijingDetailIndex = idx;
  detailEl.scrollIntoView({behavior:'smooth',block:'start'});
}

function switchToZhanbuYijing() {
  // Navigate to zhanbu section and select yijing subtab
  let navBtn = document.querySelector('[onclick*="yijing"]');
  if (navBtn) navBtn.click();
  showSection('zhanbu');
  setTimeout(function() { showZhanbuSub('yijing'); }, 100);
}

// ============================================================
// section-cezi 测字解析（独立板块）
// ============================================================
function doCeziSection() {
  let input = document.getElementById('ceziSectionInput');
  if (!input) return;
  let char = input.value.trim();
  if (!char) { showToast('请输入一个字'); return; }
  let baziInfo = {
    name: document.getElementById('ceziName')?.value || '',
    birthDate: document.getElementById('ceziBirthDate')?.value || '',
    birthHour: document.getElementById('ceziBirthHour')?.value || ''
  };
  renderCeziSectionResult(char, baziInfo);
}

function randomCeziSection() {
  let keys = Object.keys(CEZI_DATA);
  let char = keys[Math.floor((Date.now() / 1000) % keys.length)];
  let input = document.getElementById('ceziSectionInput');
  if (input) input.value = char;
  let baziInfo = {
    name: document.getElementById('ceziName')?.value || '',
    birthDate: document.getElementById('ceziBirthDate')?.value || '',
    birthHour: document.getElementById('ceziBirthHour')?.value || ''
  };
  renderCeziSectionResult(char, baziInfo);
}

function ceziSectionQuick(char) {
  let input = document.getElementById('ceziSectionInput');
  if (input) input.value = char;
  let baziInfo = {
    name: document.getElementById('ceziName')?.value || '',
    birthDate: document.getElementById('ceziBirthDate')?.value || '',
    birthHour: document.getElementById('ceziBirthHour')?.value || ''
  };
  renderCeziSectionResult(char, baziInfo);
}

function renderCeziSectionResult(char, baziInfo) {
  let result = analyzeChar(char);
  if (!result) { showToast('未能解析该字'); return; }
  let resultBox = document.getElementById('ceziSectionResult');
  let charEl = document.getElementById('ceziSectionChar');
  let tagsEl = document.getElementById('ceziSectionTags');
  let analysisEl = document.getElementById('ceziSectionAnalysis');
  let verdictEl = document.getElementById('ceziSectionVerdict');
  if (!resultBox || !charEl || !tagsEl || !analysisEl || !verdictEl) return;

  let luckNum = (result.strokes % 81) || result.strokes;
  let luck = result.luck || (luckNum <= 30 ? '大吉' : luckNum <= 50 ? '中吉' : luckNum <= 70 ? '小吉' : luckNum <= 81 ? '吉' : '平');
  let luckColor = luck==='吉'||luck==='大吉'?'var(--jade)':luck==='中吉'||luck==='小吉'?'var(--warn)':luck==='凶'||luck==='中凶'?'var(--cinn2)':'var(--metal)';
  let luckBg = luck==='吉'||luck==='大吉'?'rgba(39,174,96,.06)':luck==='中吉'||luck==='小吉'?'rgba(243,156,18,.06)':luck==='凶'||luck==='中凶'?'rgba(231,76,60,.06)':'rgba(149,165,166,.06)';

  charEl.textContent = result.char;
  tagsEl.innerHTML = '<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.2);color:var(--gold2)">' + result.radical + '部</span>' +
    '<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:rgba(39,174,96,0.1);border:1px solid rgba(39,174,96,0.2);color:var(--jade)">' + result.wuxing + '行</span>' +
    '<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:rgba(142,68,173,0.1);border:1px solid rgba(142,68,173,0.2);color:var(--violet)">' + result.strokes + '画</span>' +
    '<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:' + luckBg + ';border:1px solid ' + luckColor + '22;color:' + luckColor + '">' + luck + '</span>';

  analysisEl.innerHTML =
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">字形拆解</div><div style="font-size:14px;color:var(--paper2);line-height:1.8">' + result.char + ' 字属「' + result.radical + '」部，' + result.strokes + '画。' + (result.mnemonic || '') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">五行归属</div><div style="font-size:18px;color:var(--gold);font-family:Ma Shan Zheng,serif;margin-bottom:6px">' + result.wuxing + '行</div><div style="font-size:12px;color:var(--paper2);opacity:.8">根据部首「' + result.radical + '」判定五行属性</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">笔画数理</div><div style="font-size:18px;color:var(--gold);font-family:Ma Shan Zheng,serif;margin-bottom:6px">' + result.strokes + '画 · ' + luck + '</div><div style="font-size:12px;color:var(--paper2);opacity:.8">81数理中第' + luckNum + '数</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">字义解读</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.meaning || '此字含义深远，需结合具体情境解读。') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">事业运程</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.career || '') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">财运</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.wealth || '') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">婚姻感情</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.marriage || '') + '</div></div>' +
    '<div style="background:rgba(0,0,0,0.2);padding:16px;border-radius:10px"><div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:2px">健康</div><div style="font-size:13px;color:var(--paper2);line-height:1.8">' + (result.health || '') + '</div></div>';

  // 综合断语
  let verdict = '字「' + result.char + '」，' + result.radical + '部' + result.strokes + '画，五行属' + result.wuxing + '。' + (result.meaning || '') + '。';
  if (result.career) verdict += '事业上：' + result.career + '。';
  if (result.wealth) verdict += '财运上：' + result.wealth + '。';
  if (result.marriage) verdict += '感情上：' + result.marriage + '。';
  
  // 如果有生辰八字信息，追加个性化解读
  if (baziInfo && baziInfo.birthDate) {
    verdict += '<br><br>';
    verdict += '<span style="color:var(--gold2);font-size:12px">📝 结合生辰八字的个性化解读：</span><br>';
    if (baziInfo.name) verdict += '缘主「' + baziInfo.name + '」，';
    try {
      let parts = baziInfo.birthDate.split('-');
      let hourVal = baziInfo.birthHour !== '' ? parseInt(baziInfo.birthHour) * 2 : 12;
      if (typeof computeBaziCore === 'function') {
        let bazi = computeBaziCore(parseInt(parts[0]), parseInt(parts[1]), parseInt(parts[2]), hourVal);
        if (bazi && bazi.pillars && bazi.pillars[2]) {
          let dayStem = bazi.pillars[2].stem;
          let eleCount = {'金':0,'木':0,'水':0,'火':0,'土':0};
          for (let i = 0; i < 4; i++) {
            if (bazi.pillars[i] && bazi.pillars[i].element) eleCount[bazi.pillars[i].element] = (eleCount[bazi.pillars[i].element]||0) + 1;
          }
          let weakest = '木', minCount = 99;
          for (let e in eleCount) { if (eleCount[e] < minCount) { minCount = eleCount[e]; weakest = e; } }
          verdict += '日主' + dayStem + '（' + (typeof ELE !== 'undefined' && ELE[dayStem] ? ELE[dayStem] : '木') + '），用神为「' + weakest + '」。';
          if (result.wuxing === weakest) {
            verdict += '此字五行属' + result.wuxing + '，正合用神，补益命局，大吉。';
          } else {
            verdict += '此字五行属' + result.wuxing + '，与用神「' + weakest + '」不同，可作为辅助参考。';
          }
        }
      }
    } catch(e) { /* 八字计算失败，忽略 */ }
  }
  
  verdictEl.innerHTML = '<div style="font-size:11px;color:var(--gold);margin-bottom:8px;letter-spacing:3px">综合断语</div><div style="font-size:13px;color:var(--paper2);line-height:2">' + verdict + '</div>';

  resultBox.style.display = 'block';
  resultBox.scrollIntoView({behavior:'smooth',block:'start'});
}

// ============================================================
// 信众面板增强：音乐/食疗/健身/口诀/计划
// ============================================================;

// ============================================================
// 口诀宝库模块
// ============================================================
(function(){
  // 当前状态
  let _cat = 'all';
  let _search = '';
  let _favOnly = false;

  // 分类 key 映射
  let CAT_KEYS = ['taoist_eight','taoist_protection','buddhist_mantras','neidan_koujue','buddhist_meditation','confucian_cultivation','life_wisdom','daily_recommendations','buddhist_advanced','taoist_advanced','tcm_health','solar_terms','confucian_advanced','folk_wisdom','practice_stages','deity_faith'];

  // 切换口诀分类（暴露到全局供 HTML onclick 调用）
  function koujueSwitchCategory(cat, btn) {
    _cat = cat;
    _favOnly = false;
    _search = '';
    // 更新标签激活状态
    let tabs = document.querySelectorAll('#koujue-tabs .koujue-tab');
    for (let i = 0; i < tabs.length; i++) {
      tabs[i].classList.remove('active');
    }
    if (btn) btn.classList.add('active');
    // 重新渲染列表
    buildList();
  }
  window.koujueSwitchCategory = koujueSwitchCategory;

  // 收藏管理
  function getFavs(){ return safeGetJSON('koujue_favs', []); }
  function setFavs(arr){ localStorage.setItem('koujue_favs',JSON.stringify(arr)); }
  function isFav(id){ return getFavs().indexOf(id)>=0; }
  function toggleFav(id){
    let favs=getFavs(); let idx=favs.indexOf(id);
    if(idx>=0) favs.splice(idx,1); else favs.push(id);
    setFavs(favs);
    updateFavEntry();
  }
  function updateFavEntry(){
    let el=document.getElementById('koujue-fav-entry');
    if(!el)return;
    el.style.display=getFavs().length>0?'block':'none';
  }

  // 口诀正文预览（前两行）
  function preview(text){
    if(!text)return '';
    let lines=text.replace(/[。，！？；：、]/g,'\n').split('\n').filter(function(l){return l.trim();});
    return lines.slice(0,2).join('，')+(lines.length>2?'…':'');
  }

  // 渲染口诀卡片
  function renderCard(id,name,purpose,text,extra){
    let faved=isFav(id);
    return '<div class="koujue-card" onclick="koujueToggleDetail(\''+id+'\')">' +
      '<button class="koujue-fav-btn'+(faved?' faved':'')+'" onclick="event.stopPropagation();koujueToggleFav(\''+id+'\')" title="'+(faved?'取消收藏':'收藏')+'">'+(faved?'⭐':'☆')+'</button>' +
      '<div class="koujue-name">'+name+'</div>' +
      '<div class="koujue-purpose">'+purpose+'</div>' +
      '<div class="koujue-preview">'+preview(text)+'</div>' +
    '</div>';
  }

  // 渲染详情
  function renderDetail(m, catKey){
    let h='<div class="koujue-detail" id="detail-'+(m.id||m.name)+'">';
    h+='<div class="kd-label">📖 口诀正文</div>';
    h+='<div class="kd-text" style="font-family:\'Ma Shan Zheng\',serif;font-size:16px;color:var(--paper)">'+m.text+'</div>';

    // 佛教咒语额外字段
    if(m.sanskrit) h+='<div class="kd-section"><div class="kd-section-title">🕉 梵文</div><div style="font-size:13px;color:var(--paper2)">'+m.sanskrit+'</div></div>';
    if(m.merit) h+='<div class="kd-section"><div class="kd-section-title">✨ 功德</div><div style="font-size:13px;color:var(--paper2)">'+m.merit+'</div></div>';

    h+='<div class="kd-section"><div class="kd-section-title">🎯 用途</div><div style="font-size:13px;color:var(--paper2)">'+(m.purpose||'')+'</div></div>';
    if(m.usage) h+='<div class="kd-section"><div class="kd-section-title">📿 用法</div><div style="font-size:13px;color:var(--paper2)">'+m.usage+'</div></div>';
    if(m.scene){
      let scenes=Array.isArray(m.scene)?m.scene.join('、'):m.scene;
      h+='<div class="kd-section"><div class="kd-section-title">🌅 适用场景</div><div style="font-size:13px;color:var(--paper2)">'+scenes+'</div></div>';
    }
    // 内丹导引/禅修 details 数组
    if(m.details && m.details.length){
      h+='<div class="kd-section"><div class="kd-section-title">📋 详解</div>';
      m.details.forEach(function(d){h+='<div style="font-size:13px;color:var(--paper2);margin-bottom:4px">• '+d+'</div>';});
      h+='</div>';
    }
    // 注意事项
    if(m.caution) h+='<div class="kd-section"><div class="kd-section-title">⚠️ 注意</div><div style="font-size:13px;color:var(--cinn)">'+m.caution+'</div></div>';
    if(m.tips) h+='<div class="kd-section"><div class="kd-section-title">💡 提示</div><div style="font-size:13px;color:var(--paper2)">'+m.tips+'</div></div>';

    h+='<div style="text-align:center;margin-top:16px"><button onclick="this.parentElement.parentElement.remove()" style="padding:8px 24px;background:rgba(201,168,76,.1);border:1px solid rgba(201,168,76,.2);color:var(--gold);border-radius:8px;cursor:pointer;font-family:var(--font-serif);font-size:13px;letter-spacing:2px">收起</button></div>';
    h+='</div>';
    return h;
  }

  // 构建口诀列表
  function buildList(){
    let db=window.KOUJUE_DATABASE;
    if(!db){document.getElementById('koujue-list').innerHTML='<div style="text-align:center;color:var(--paper3);padding:40px">口诀库加载中…</div>';return;}
    let html='';
    let favs=getFavs();

    // 确定要显示的分类
    let cats=[];
    if(_cat==='all') cats=CAT_KEYS;
    else if(_cat==='daily') cats=['daily_recommendations'];
    else cats=[_cat];

    cats.forEach(function(ck){
      let section=db[ck];
      if(!section)return;

      // life_wisdom 特殊处理：按子分类
      if(ck==='life_wisdom' && section.categories){
        Object.keys(section.categories).forEach(function(subKey){
          let sub=section.categories[subKey];
          html+='<div class="koujue-sub-cat"><div class="koujue-sub-cat-title">'+sub.name+'</div>';
          (sub.tips||[]).forEach(function(t){
            let id='lw_'+subKey+'_'+(t.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_');
            if(_search){
              let q=_search.toLowerCase();
              if(!((t.name||'').toLowerCase().indexOf(q)>=0||(t.text||'').toLowerCase().indexOf(q)>=0||(t.purpose||'').toLowerCase().indexOf(q)>=0)) return;
            }
            if(_favOnly && favs.indexOf(id)<0) return;
            html+=renderCard(id,t.name,t.purpose,t.text);
            html+='<div id="detail-'+id+'" style="display:none">'+renderDetail({id:id,name:t.name,text:t.text,purpose:t.purpose,usage:t.usage},ck)+'</div>';
          });
          html+='</div>';
        });
        return;
      }

      // daily_recommendations 特殊处理
      if(ck==='daily_recommendations' && section.categories){
        Object.keys(section.categories).forEach(function(subKey){
          let sub=section.categories[subKey];
          html+='<div class="koujue-sub-cat"><div class="koujue-sub-cat-title">'+sub.name+'</div>';
          (sub.tips||[]).forEach(function(t,i){
            let id='dr_'+subKey+'_'+i;
            let name=t.time||t.principle||t.category||sub.name;
            let purpose=t.benefit||t.wisdom||'';
            let text=t.activity||t.wisdom||'';
            if(_search){
              let q=_search.toLowerCase();
              if(!((name).toLowerCase().indexOf(q)>=0||(text).toLowerCase().indexOf(q)>=0||(purpose).toLowerCase().indexOf(q)>=0)) return;
            }
            if(_favOnly && favs.indexOf(id)<0) return;
            html+=renderCard(id,name,purpose,text);
          });
          html+='</div>';
        });
        return;
      }

      // 标准分类
      if(section.mantras){
        html+='<div style="font-size:14px;color:var(--gold2);margin:12px 0 8px;letter-spacing:2px;font-weight:bold">'+section.title+(section.source?' <span style="font-size:11px;color:var(--paper3);font-weight:normal">'+section.source+'</span>':'')+'</div>';
        section.mantras.forEach(function(m){
          let id=m.id||(ck+'_'+(m.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_'));
          if(_search){
            let q=_search.toLowerCase();
            if(!((m.name||'').toLowerCase().indexOf(q)>=0||(m.text||'').toLowerCase().indexOf(q)>=0||(m.purpose||'').toLowerCase().indexOf(q)>=0)) return;
          }
          if(_favOnly && favs.indexOf(id)<0) return;
          html+=renderCard(id,m.name,m.purpose,m.text);
        });
      }
    });

    if(!html) html='<div style="text-align:center;color:var(--paper3);padding:40px">未找到匹配的口诀</div>';
    document.getElementById('koujue-list').innerHTML=html;
    updateFavEntry();
  }

  // 每日推荐
  function buildDaily(){
    let db=window.KOUJUE_DATABASE;
    if(!db||!db.daily_recommendations) return;
    let now=new Date();
    let h=now.getHours();
    let month=now.getMonth()+1;
    // 选择时辰对应的养生建议
    let period;
    if(h>=5&&h<9) period='yangsheng_morning';
    else if(h>=9&&h<19) period='yangsheng_day';
    else period='yangsheng_night';
    // 季节
    let season;
    if(month>=3&&month<=5) season='season_spring';
    else if(month>=6&&month<=8) season='season_summer';
    else if(month>=9&&month<=11) season='season_autumn';
    else season='season_winter';

    let cats=db.daily_recommendations.categories;
    let html='';
    // 时辰养生
    if(cats[period]){
      html+='<div style="margin-bottom:12px"><div style="color:var(--gold);font-weight:bold;margin-bottom:6px">🕐 '+cats[period].name+'</div>';
      cats[period].tips.forEach(function(t){
        html+='<div style="padding:4px 0;font-size:12px"><span style="color:var(--gold3)">'+t.time+'</span> '+t.activity+' <span style="color:var(--paper3)">— '+t.benefit+'</span></div>';
      });
      html+='</div>';
    }
    // 季节养生
    if(cats[season]){
      html+='<div><div style="color:var(--gold);font-weight:bold;margin-bottom:6px">🌸 '+cats[season].name+'</div>';
      cats[season].tips.forEach(function(t){
        html+='<div style="padding:4px 0;font-size:12px"><span style="color:var(--gold3)">'+t.principle+'</span> '+t.activity+' <span style="color:var(--paper3)">— '+t.benefit+'</span></div>';
      });
      html+='</div>';
    }
    let el=document.getElementById('koujue-daily-content');
    if(el) el.innerHTML=html||'暂无推荐';
  }

  // 切换分类
  window.koujueSwitchCategory=function(cat,btn){
    _cat=cat; _favOnly=false;
    document.querySelectorAll('.koujue-tab').forEach(function(t){t.classList.remove('active');});
    if(btn) btn.classList.add('active');
    buildList();
  };

  // 搜索过滤
  window.koujueSearchFilter=function(q){
    _search=q.trim(); _favOnly=false;
    buildList();
  };

  // 展开/收起详情
  window.koujueToggleDetail=function(id){
    let el=document.getElementById('detail-'+id);
    if(!el) return;
    // 找到卡片后面插入详情
    let cardEl=el.previousElementSibling;
    if(el.style.display==='none'||!el.style.display){
      // 关闭其他详情
      document.querySelectorAll('.koujue-detail').forEach(function(d){d.remove();});
      // 构建详情
      let m=findMantra(id);
      if(!m) return;
      let detail=document.createElement('div');
      detail.innerHTML=renderDetail(m,m._catKey||'');
      let card=document.querySelector('.koujue-card[onclick*="'+id+'"]');
      if(card) card.after(detail.firstElementChild);
    }
  };

  // 查找口诀数据
  function findMantra(id){
    let db=window.KOUJUE_DATABASE;
    if(!db) return null;
    // 搜索标准分类
    let catKeys=['taoist_eight','taoist_protection','buddhist_mantras','neidan_koujue','buddhist_meditation','confucian_cultivation'];
    for(let i=0;i<catKeys.length;i++){
      let ck=catKeys[i];
      let mantras=db[ck]&&db[ck].mantras;
      if(!mantras)continue;
      for(let j=0;j<mantras.length;j++){
        let m=mantras[j];
        let mid=m.id||(ck+'_'+(m.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_'));
        if(mid===id){m._catKey=ck;return m;}
      }
    }
    // 搜索 life_wisdom
    if(db.life_wisdom&&db.life_wisdom.categories){
      let cats=db.life_wisdom.categories;
      for(let sk in cats){
        let tips=cats[sk].tips;
        if(!tips)continue;
        for(let j=0;j<tips.length;j++){
          let t=tips[j];
          let tid='lw_'+sk+'_'+(t.name||'').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g,'_');
          if(tid===id) return {id:tid,name:t.name,text:t.text,purpose:t.purpose,usage:t.usage,_catKey:'life_wisdom'};
        }
      }
    }
    return null;
  }

  // 收藏切换
  window.koujueToggleFav=function(id){
    toggleFav(id);
    buildList();
  };

  // 显示收藏列表
  window.koujueShowFavorites=function(){
    _favOnly=true; _cat='all'; _search='';
    document.querySelectorAll('.koujue-tab').forEach(function(t){t.classList.remove('active');});
    document.getElementById('koujue-search').value='';
    buildList();
  };

  // 信众面板联动：根据信仰获取口诀
  window.getKoujueByFaith=function(faith){
    let db=window.KOUJUE_DATABASE;
    if(!db) return [];
    let result=[];
    if(faith==='ru'){
      if(db.confucian_cultivation&&db.confucian_cultivation.mantras) result=result.concat(db.confucian_cultivation.mantras);
    }else if(faith==='dao'){
      if(db.taoist_eight&&db.taoist_eight.mantras) result=result.concat(db.taoist_eight.mantras);
      if(db.taoist_protection&&db.taoist_protection.mantras) result=result.concat(db.taoist_protection.mantras);
      if(db.neidan_koujue&&db.neidan_koujue.mantras) result=result.concat(db.neidan_koujue.mantras);
    }else if(faith==='fo'){
      if(db.buddhist_mantras&&db.buddhist_mantras.mantras) result=result.concat(db.buddhist_mantras.mantras);
      if(db.buddhist_meditation&&db.buddhist_meditation.mantras) result=result.concat(db.buddhist_meditation.mantras);
    }else{
      // 兼修或其他：全部
      CAT_KEYS.forEach(function(ck){if(db[ck]&&db[ck].mantras) result=result.concat(db[ck].mantras);});
    }
    return result;
  };

  // 更新信众面板修行口诀区
  window.updateFaithKoujue=function(faith){
    let mantras=getKoujueByFaith(faith);
    // 根据信仰选择目标容器
    let elMap={ru:'faith-koujue-dynamic',dao:'faith-koujue-dao',fo:'faith-koujue-fo'};
    let el=document.getElementById(elMap[faith]||'faith-koujue-dynamic');
    if(!el) return;
    if(!mantras.length){el.innerHTML='<div style="font-size:12px;color:var(--paper3)">暂无相关口诀</div>';return;}
    let h='';
    mantras.slice(0,8).forEach(function(m){
      h+='<div style="margin-bottom:6px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:6px;font-size:12px;line-height:1.6">';
      h+='<span style="color:var(--gold);font-weight:bold">'+m.name+'</span>';
      h+='<div style="color:var(--paper2);margin-top:3px">'+m.purpose+'</div>';
      h+='</div>';
    });
    if(mantras.length>8) h+='<div style="font-size:11px;color:var(--paper3);text-align:center;margin-top:8px;cursor:pointer" onclick="showSection(\'more\');showMoreModule(\'koujue\')">查看更多 → 📿口诀宝库</div>';
    el.innerHTML=h;
  };

  // showMoreModule 联动
  let _origShowMore=window.showMoreModule;
  window.showMoreModule=function(name,btn){
    _origShowMore(name,btn);
    if(name==='koujue'){buildList();buildDaily();}
  };

  // 页面加载后初始化
  if(document.readyState==='complete'||document.readyState==='interactive'){
    updateFavEntry();
  }else{
    document.addEventListener('DOMContentLoaded',updateFavEntry);
  }
})();



// ============================================================
// 功德系统：记录 + 累计 + 提示
// ============================================================
function addMerit(faith, amount, reason) {
    if (!amount) amount = 1;
    let record = safeGetJSON('meritRecord', {});
    let meritKey = 'merit_' + faith;
    if (!record[meritKey]) record[meritKey] = 0;
    record[meritKey] += amount;
    let totalKey = 'merit_total';
    if (!record[totalKey]) record[totalKey] = 0;
    record[totalKey] += amount;
    localStorage.setItem('meritRecord', JSON.stringify(record));
    
    // Visual feedback
    let msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:linear-gradient(135deg,var(--ink3),var(--cyan));border:2px solid var(--gold);color:var(--gold);padding:20px 30px;border-radius:14px;font-size:16px;z-index:99999;text-align:center;box-shadow:0 0 40px rgba(201,168,76,0.3)';
    msg.innerHTML = '<div style="font-size:32px;margin-bottom:8px">🙏</div><div style="font-weight:bold">+' + amount + ' 功德</div>';
    if (reason) msg.insertAdjacentHTML('beforeend', '<div style="font-size:12px;color:var(--paper3);margin-top:6px">' + reason + '</div>');
    document.body.appendChild(msg);
    setTimeout(function(){msg.style.opacity='0';msg.style.transition='opacity 0.8s';setTimeout(function(){document.body.removeChild(msg);},800);}, 1500);
    
    // Update badge
    loadMeritRecord(faith);
}

// ============================================================
// 功德记录显示
// ============================================================
function loadMeritRecord(faith) {
    let record = safeGetJSON('meritRecord', {});
    let total = record['merit_total'] || 0;
    let faithMerit = record['merit_' + faith] || 0;
    
    // 在信众中心显示功德
    let meritDisplay = document.getElementById('meritDisplay');
    if (!meritDisplay) {
        // 动态创建功德显示面板
        let userBaziBind = document.getElementById('userBaziBind');
        if (userBaziBind && userBaziBind.parentNode) {
            meritDisplay = document.createElement('div');
            meritDisplay.id = 'meritDisplay';
            meritDisplay.style.cssText = 'background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:16px 20px;margin-bottom:16px';
            userBaziBind.parentNode.insertBefore(meritDisplay, userBaziBind);
        }
    }
    if (meritDisplay) {
        let faithNames = {ru:'儒家', dao:'道家', fo:'佛家', all:'兼修'};
        let fname = faithNames[faith] || '修行';
        meritDisplay.innerHTML = '<div style="display:flex;align-items:center;gap:12px">' +
            '<div style="font-size:32px">🙏</div>' +
            '<div style="flex:1">' +
            '<div style="font-size:14px;color:var(--gold);font-weight:600">累计功德：' + total + ' 点</div>' +
            '<div style="font-size:12px;color:var(--paper3);margin-top:2px">' + fname + '修行：' + faithMerit + ' 点</div>' +
            '</div></div>';
    }
}

// Quick merit buttons (for music/diet/exercise/mantra sections)
function meritBtn(faith, type) {
    let reasons = {
        'music':'静心闻乐，音律调神',
        'diet':'清淡饮食，脾胃健运',
        'exercise':'导引健身，气血通畅',
        'mantra':'讽诵口诀，涵养正气',
        'plan':'依仪修行，精进不懈'
    };
    addMerit(faith, 1, reasons[type] || '身心修行，日行一善');
}

// ============================================================
// 60甲子循环推送系统 — 年度运势+化解方案
// ============================================================
let GAN_ZHI_CYCLE = [
  '甲子','乙丑','丙寅','丁卯','戊辰','己巳','庚午','辛未','壬申','癸酉',
  '甲戌','乙亥','丙子','丁丑','戊寅','己卯','庚辰','辛巳','壬午','癸未',
  '甲申','乙酉','丙戌','丁亥','戊子','己丑','庚寅','辛卯','壬辰','癸巳',
  '甲午','乙未','丙申','丁酉','戊戌','己亥','庚子','辛丑','壬寅','癸卯',
  '甲辰','乙巳','丙午','丁未','戊申','己酉','庚戌','辛亥','壬子','癸丑',
  '甲寅','乙卯','丙辰','丁巳','戊午','己未','庚申','辛酉','壬戌','癸亥'
];

let GAN_ZHI_PROPERTIES = {
  '甲子':{wuxing:'水',taisui:'鼠',direction:'正北',energy:'生发之始',advice:'子年水旺，木火不足者宜早备火行化解物'},
  '乙丑':{wuxing:'土',taisui:'牛',direction:'东北',energy:'厚积薄发',advice:'丑年湿土厚重，金水不足者宜增金元素'},
  '丙寅':{wuxing:'木',taisui:'虎',direction:'东北',energy:'木火相生',advice:'寅年木旺，土弱脾胃虚者宜备土行调和物'},
  '丁卯':{wuxing:'木',taisui:'兔',direction:'正东',energy:'柔融通达',advice:'卯年木气偏柔，金不足者肺气易弱宜备金行物'},
  '戊辰':{wuxing:'土',taisui:'龙',direction:'东南',energy:'龙腾变化',advice:'辰年土旺水库，火弱心气不足者宜增火元素'},
  '己巳':{wuxing:'火',taisui:'蛇',direction:'东南',energy:'巳火渐旺',advice:'巳年火气渐升，水弱肾气不足者宜补水行物'},
  '庚午':{wuxing:'火',taisui:'马',direction:'正南',energy:'炎上之势',advice:'午年火极旺，水弱宜备强力水行化解物'},
  '辛未':{wuxing:'土',taisui:'羊',direction:'西南',energy:'未土燥热',advice:'未年土带火气，木弱肝气不足者宜备木行物'},
  '壬申':{wuxing:'金',taisui:'猴',direction:'西南',energy:'金水相生',advice:'申年金旺，木弱肝胆易伤宜备木行化解物'},
  '癸酉':{wuxing:'金',taisui:'鸡',direction:'正西',energy:'金气肃杀',advice:'酉年金锐，木火不足者宜早备温暖调和物'}
};

function getGanZhiProp(yearGz) {
  // 补充通用属性
  let stem = yearGz[0], branch = yearGz[1];
  let stems = '甲乙丙丁戊己庚辛壬癸', branches = '子丑寅卯辰巳午未申酉戌亥';
  let wuxing = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  let zodiac = {'子':'鼠','丑':'牛','寅':'虎','卯':'兔','辰':'龙','巳':'蛇','午':'马','未':'羊','申':'猴','酉':'鸡','戌':'狗','亥':'猪'};
  let dirs = {'子':'正北','丑':'东北','寅':'东北','卯':'正东','辰':'东南','巳':'东南','午':'正南','未':'西南','申':'西南','酉':'正西','戌':'西北','亥':'西北'};
  let builtin = GAN_ZHI_PROPERTIES[yearGz];
  if (builtin) return builtin;
  return {
    wuxing: wuxing[stem] || '未知',
    taisui: zodiac[branch] || '未知',
    direction: dirs[branch] || '未知',
    energy: yearGz + '年',
    advice: '根据八字五行喜用选化解物品'
  };
}

function getCurrentYearGanzhi() {
  let now = new Date();
  let year = now.getFullYear();
  // 立春前算上年，4为甲子起始偏移(1984=甲子年)
  let offsetYear = (now < new Date(year, 1, 4)) ? year - 1 : year;
  let idx = (offsetYear - 4) % 60;
  if (idx < 0) idx += 60;
  return {ganzhi: GAN_ZHI_CYCLE[idx], idx: idx, year: offsetYear};
}

function getNextYears(startIdx, count) {
  let result = [];
  for (let i = 1; i <= count; i++) {
    let idx = (startIdx + i) % 60;
    result.push({ganzhi: GAN_ZHI_CYCLE[idx], idx: idx, year: (new Date().getFullYear() + i)});
  }
  return result;
}

// 年度推送渲染
function renderAnnualPush() {
  let statusEl = document.getElementById('annualPushStatus');
  let historyEl = document.getElementById('annualPushHistory');
  if (!statusEl || !historyEl) return;
  
  let current = getCurrentYearGanzhi();
  let prop = getGanZhiProp(current.ganzhi);
  let nextYears = getNextYears(current.idx, 3);
  let memberLevel = localStorage.getItem('memberLevel') || 'free';
  
  // 状态面板
  let html = '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:16px;margin-bottom:16px">';
  html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">';
  html += '<div><span style="font-size:18px;color:var(--gold);font-family:Ma Shan Zheng,serif;letter-spacing:4px">' + current.ganzhi + '年</span>';
  html += '<span style="font-size:11px;color:var(--paper3);margin-left:8px">第' + (current.idx+1) + '/60甲子</span></div>';
  html += '<span class="rich-badge" style="font-size:10px;background:rgba(39,174,96,.15);color:var(--jade)">' + prop.taisui + '年·' + prop.wuxing + '行</span>';
  html += '</div>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:1.7;margin-bottom:10px">' + prop.energy + ' · 太岁方位：' + prop.direction + ' · ' + prop.advice + '</div>';
  
  // 会员权限判断
  let isTransition = isYearTransition() || memberLevel === 'lifetime';
  html += '<div style="display:flex;gap:10px;flex-wrap:wrap">';
  if (memberLevel === 'lifetime') {
    html += '<button onclick="generateAnnualPush()" style="padding:8px 18px;border:1px solid var(--gold);border-radius:8px;background:rgba(201,168,76,0.1);color:var(--gold);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:2px">🔄 生成年度运势+化解方案</button>';
  } else if (memberLevel === 'annual') {
    html += '<button onclick="generateAnnualPush()" style="padding:8px 18px;border:1px solid var(--gold);border-radius:8px;background:rgba(201,168,76,0.1);color:var(--gold);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:2px">🔄 生成年度运势概览</button>';
    html += '<button onclick="showToast(\'终身会员享完整60甲子循环化解方案\')" style="padding:8px 18px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--cinn2);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:2px">👑 升级终身会员</button>';
  } else {
    html += '<button onclick="showToast(\'年度会员及以上可享年度运势推送。免费会员可查看60甲子流年纵览。\')" style="padding:8px 18px;border:1px solid var(--border);border-radius:8px;background:transparent;color:var(--paper3);cursor:pointer;font-family:inherit;font-size:12px;letter-spacing:2px">🔒 升级会员解锁完整推送</button>';
  }
  html += '</div>';
  html += '</div>';
  
  // 未来3年预览
  html += '<div style="background:rgba(255,255,255,0.02);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:14px">';
  html += '<div style="font-size:13px;color:var(--gold);margin-bottom:10px">📅 未来三年循环推送预览</div>';
  nextYears.forEach(function(ny) {
    let np = getGanZhiProp(ny.ganzhi);
    html += '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(201,168,76,.06);font-size:12px">';
    html += '<div><b style="color:var(--gold2)">' + ny.ganzhi + '</b> <span style="color:var(--paper3)">' + ny.year + '年</span></div>';
    html += '<div style="color:var(--paper3);font-size:11px">' + np.taisui + '·' + np.wuxing + '·推' + (ny.idx-2+1) + '/' + (ny.idx-1+2) + '</div>';
    html += '</div>';
  });
  html += '</div>';
  
  statusEl.innerHTML = html;
  
  // 历史推送记录
  let pushHistory = safeGetJSON('annualPushHistory', []);
  if (pushHistory.length > 0) {
    let hHtml = '<div style="font-size:13px;color:var(--gold);margin-bottom:8px">📜 历史推送记录</div>';
    pushHistory.slice(-5).reverse().forEach(function(ph) {
      hHtml += '<div style="font-size:12px;color:var(--paper2);padding:4px 0;border-bottom:1px solid rgba(201,168,76,.04)">';
      hHtml += '<b>' + ph.ganzhi + '</b> <span style="opacity:.5">' + ph.date + '</span>';
      hHtml += ' <span style="font-size:10px;color:var(--jade)">' + (ph.type === 'full' ? '完整方案' : '运势概览') + '</span>';
      hHtml += '</div>';
    });
    historyEl.innerHTML = hHtml;
  }
}

// 年度推送生成
function generateAnnualPush() {
  let memberLevel = localStorage.getItem('memberLevel') || 'free';
  if (memberLevel === 'free') {
    showToast('请先升级为年度会员或终身会员');
    return;
  }
  let current = getCurrentYearGanzhi();
  let prop = getGanZhiProp(current.ganzhi);
  
  let pushHistory = safeGetJSON('annualPushHistory', []);
  let already = pushHistory.find(function(p){ return p.ganzhi === current.ganzhi; });
  if (already) {
    showToast(current.ganzhi + '年运势已生成，可查看历史记录');
    return;
  }
  
  // 生成推送内容
  let pushData = {
    ganzhi: current.ganzhi,
    date: new Date().toISOString().split('T')[0],
    type: memberLevel === 'lifetime' ? 'full' : 'overview',
    level: memberLevel,
    properties: prop,
    cycleIdx: current.idx + 1,
    totalCycle: 60
  };
  
  pushHistory.push(pushData);
  localStorage.setItem('annualPushHistory', JSON.stringify(pushHistory));
  
  // 生成化解方案内容
  let contentHtml = '';
  if (memberLevel === 'lifetime' || memberLevel === 'annual') {
    contentHtml = generateAnnualContent(current, prop, memberLevel);
  }
  
  // 显示结果弹窗
  let msg = document.createElement('div');
  msg.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.9);z-index:99999;overflow-y:auto;padding:40px 20px';
  msg.innerHTML = '<div style="max-width:700px;margin:0 auto;background:var(--ink2);border:1px solid var(--border);border-radius:14px;padding:28px;position:relative">';
  msg.insertAdjacentHTML('beforeend', '<button onclick="this.parentElement.parentElement.remove()" style="position:absolute;top:16px;right:16px;background:none;border:1px solid var(--border);color:var(--paper3);padding:6px 14px;cursor:pointer;font-size:14px;border-radius:4px">✕</button>');
  msg.insertAdjacentHTML('beforeend', '<div style="font-family:Ma Shan Zheng,serif;font-size:24px;color:var(--gold);letter-spacing:6px;text-align:center;margin-bottom:20px">' + current.ganzhi + '年 运势化解方案</div>');
  msg.insertAdjacentHTML('beforeend', '<p style="text-align:center;font-size:12px;color:var(--paper3);margin-bottom:20px">60甲子第' + (current.idx+1) + '位 · ' + prop.taisui + '年 · ' + prop.wuxing + '行</p>');
  msg.insertAdjacentHTML('beforeend', contentHtml);
  msg.insertAdjacentHTML('beforeend', '<div style="text-align:center;margin-top:20px"><button onclick="this.parentElement.parentElement.remove()" style="padding:10px 30px;border:1px solid var(--gold);border-radius:8px;background:rgba(201,168,76,0.1);color:var(--gold);cursor:pointer;font-family:inherit;font-size:14px;letter-spacing:4px">已知，收藏于心</button></div>');
  msg.insertAdjacentHTML('beforeend', '</div>');
  document.body.appendChild(msg);
  
  addMerit(localStorage.getItem('userFaith') || 'fo', 3, '生成' + current.ganzhi + '年化解方案');
  
  // 刷新推送面板
  setTimeout(function(){ renderAnnualPush(); }, 500);
}

function generateAnnualContent(current, prop, level) {
  let nextYear = getNextYears(current.idx, 1)[0];
  let nextProp = getGanZhiProp(nextYear.ganzhi);
  let html = '';
  
  // 年度五行分析
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🎯 年度五行分析 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body" style="padding:14px;font-size:13px;line-height:1.8">';
  html += '<div>本年干支：<b style="color:var(--gold2)">' + current.ganzhi + '</b>（天干' + current.ganzhi[0] + ' 地支' + current.ganzhi[1] + '）</div>';
  html += '<div>五行属性：<b>' + prop.wuxing + '行</b></div>';
  html += '<div>太岁：' + prop.taisui + '年</div>';
  html += '<div>方位：' + prop.direction + '</div>';
  html += '<div>能量特质：' + prop.energy + '</div>';
  html += '<div style="margin-top:8px;color:var(--gold);font-weight:600">化解要点：' + prop.advice + '</div>';
  html += '</div>';
  
  // 化解方案
  html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🛡️ 年度化解方案 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body collapsed" style="padding:14px;font-size:13px;line-height:1.8">';
  html += '<div style="margin-bottom:8px">📌 <b>太岁化解：</b>' + prop.taisui + '年值太岁，可于立春当日（2月4日）参拜太岁，安奉太岁符。</div>';
  html += '<div style="margin-bottom:8px">🏠 <b>方位布局：</b>太岁方' + prop.direction + '宜静不宜动，可摆放五行调和物。财位根据流年飞星调整。</div>';
  if (level === 'lifetime') {
    html += '<div style="margin-bottom:8px">📋 <b>专属方案：</b>根据绑定八字五行喜用，生成个性化化解方案（物品清单/方位布局/开光时辰/注意事项）。</div>';
    html += '<div style="margin-bottom:8px">👨‍👩‍👧‍👦 <b>家庭成员：</b>每位成员独立分析+综合化解方案。</div>';
    html += '<div style="margin-bottom:8px">📦 <b>化解物品清单：</b>太岁符/五行调和物/财位催财物/文昌位布置物/健康化煞物。</div>';
  }
  html += '<div style="margin-bottom:8px">🔜 <b>次年预告：</b>' + nextYear.ganzhi + '年（' + nextProp.taisui + '·' + nextProp.wuxing + '行）——' + nextProp.advice.substring(0,20) + '...</div>';
  html += '</div>';
  
  // 60甲子循环状态
  html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔮 60甲子循环 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body collapsed" style="padding:14px;font-size:13px;line-height:1.8">';
  html += '<div>当前位置：第<b style="color:var(--gold2)">' + (current.idx+1) + '</b>位 / 共60位</div>';
  html += '<div>循环进度：<div style="height:4px;background:rgba(201,168,76,.1);border-radius:2px;margin:8px 0"><div style="height:100%;width:' + ((current.idx+1)/60*100).toFixed(0) + '%;background:linear-gradient(90deg,var(--gold),var(--gold2));border-radius:2px"></div></div></div>';
  html += '<div>已推送：<b>' + (current.idx+1) + '</b>次 | 剩余：<b>' + (60-current.idx-1) + '</b>次</div>';
  html += '<div style="margin-top:8px;color:var(--paper3);font-size:11px">60甲子一轮回，天干地支周而复始。每年年末年初自动推送，终身会员享完整循环。</div>';
  html += '</div>';
  
  return html;
}

function isYearTransition() {
  let now = new Date();
  let m = now.getMonth() + 1;
  let d = now.getDate();
  // 年末年初推送窗口：11月15日到次年2月15日
  return (m === 11 && d >= 15) || m === 12 || m === 1 || (m === 2 && d <= 15);
}

// ============================================================
// 自优化进化引擎 UI
// ============================================================
function runEvolutionAudit() {
  let reportEl = document.getElementById('evolutionReport');
  if (!reportEl) return;
  if (typeof EvolutionEngine === 'undefined') {
    reportEl.innerHTML = '<div style="color:var(--cinn2);font-size:12px">进化引擎未加载</div>';
    return;
  }
  reportEl.innerHTML = '<div style="text-align:center;padding:20px;color:var(--gold);font-size:13px">🔄 正在执行审计...</div>';
  
  setTimeout(function() {
    let report = EvolutionEngine.runFullAudit();
    let html = '<div style="background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.12);border-radius:10px;padding:16px">';
    
    // 摘要
    html += '<div style="display:flex;gap:16px;margin-bottom:16px;text-align:center">';
    html += '<div style="flex:1"><div style="font-size:24px;color:var(--jade);font-weight:bold">' + report.summary.pass + '</div><div style="font-size:10px;color:var(--paper3)">通过</div></div>';
    html += '<div style="flex:1"><div style="font-size:24px;color:var(--cinn2);font-weight:bold">' + report.summary.fail + '</div><div style="font-size:10px;color:var(--paper3)">失败</div></div>';
    html += '<div style="flex:1"><div style="font-size:24px;color:var(--gold);font-weight:bold">' + report.summary.score + '</div><div style="font-size:10px;color:var(--paper3)">评分</div></div>';
    html += '</div>';
    
    // 八字引擎验证
    html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)" style="font-size:13px;padding:8px 10px">🔮 八字引擎验证 (' + report.bazi.pass + '/' + (report.bazi.pass+report.bazi.fail) + ') <span class="toggle-icon">▼</span></div>';
    html += '<div class="bazi-module-body" style="padding:10px;font-size:12px">';
    if (report.bazi.errors.length > 0) {
      report.bazi.errors.forEach(function(e) { html += '<div style="color:var(--cinn2);margin-bottom:4px">⚠ ' + e + '</div>'; });
    } else {
      html += '<div style="color:var(--jade)">✓ 全部通过</div>';
    }
    html += '</div>';
    
    // 知识库审计
    html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="font-size:13px;padding:8px 10px">📚 知识库审计 (' + report.knowledge.complete + '/' + report.knowledge.total + ') <span class="toggle-icon">▼</span></div>';
    html += '<div class="bazi-module-body collapsed" style="padding:10px;font-size:12px">';
    if (report.knowledge.issues.length > 0) {
      report.knowledge.issues.forEach(function(i) { html += '<div style="color:var(--warn);margin-bottom:4px">⚠ ' + i + '</div>'; });
    } else {
      html += '<div style="color:var(--jade)">✓ 全部完整</div>';
    }
    html += '</div>';
    
    // 代码质量
    html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="font-size:13px;padding:8px 10px">🔧 代码质量 (评分' + report.codeQuality.score + ') <span class="toggle-icon">▼</span></div>';
    html += '<div class="bazi-module-body collapsed" style="padding:10px;font-size:12px">';
    if (report.codeQuality.issues.length > 0) {
      report.codeQuality.issues.forEach(function(i) { html += '<div style="color:var(--warn);margin-bottom:4px">⚠ ' + i + '</div>'; });
    } else {
      html += '<div style="color:var(--jade)">✓ 代码质量优秀</div>';
    }
    html += '</div>';
    
    // 进化建议
    let suggestions = EvolutionEngine.getEvolutionSuggestions();
    if (suggestions.length > 0) {
      html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="font-size:13px;padding:8px 10px">💡 进化建议 (' + suggestions.length + ') <span class="toggle-icon">▼</span></div>';
      html += '<div class="bazi-module-body collapsed" style="padding:10px;font-size:12px">';
      suggestions.forEach(function(s) {
        html += '<div style="margin-bottom:8px;padding:8px;background:rgba(201,168,76,0.04);border-radius:6px"><b style="color:var(--gold)">' + s.module + '</b> (' + s.issueCount + '次问题)<br><span style="color:var(--paper2)">' + s.suggestion + '</span></div>';
      });
      html += '</div>';
    }
    
    html += '</div>';
    html += '<div style="text-align:center;margin-top:8px;font-size:11px;color:var(--paper3);opacity:.5">审计时间：' + report.time + '</div>';
    reportEl.innerHTML = html;
  }, 100);
}

function showEvolutionLog() {
  if (typeof EvolutionEngine === 'undefined') {
    showToast('进化引擎未加载');
    return;
  }
  let log = EvolutionEngine.getLog();
  let reportEl = document.getElementById('evolutionReport');
  if (!reportEl) return;
  
  if (log.length === 0) {
    reportEl.innerHTML = '<div style="text-align:center;color:var(--paper3);padding:20px;font-size:12px">暂无进化日志，请先运行审计</div>';
    return;
  }
  
  let html = '<div style="background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.12);border-radius:10px;padding:16px">';
  html += '<div style="font-size:13px;color:var(--gold);margin-bottom:10px">📋 进化日志（最近' + Math.min(log.length, 50) + '条）</div>';
  log.slice(-50).reverse().forEach(function(l) {
    let color = l.severity === 'pass' ? 'var(--jade)' : l.severity === 'error' ? 'var(--cinn2)' : l.severity === 'warn' ? 'var(--warn)' : 'var(--paper3)';
    html += '<div style="font-size:11px;padding:4px 0;border-bottom:1px solid rgba(201,168,76,0.04);line-height:1.6">';
    html += '<span style="color:' + color + '">[' + l.severity + ']</span> ';
    html += '<span style="opacity:.5">' + l.time.substring(5, 16) + '</span> ';
    html += '<b style="color:var(--gold2)">' + l.module + '</b> ' + l.message;
    html += '</div>';
  });
  html += '</div>';
  reportEl.innerHTML = html;
}

// ============================================================
// selectFaith：跳转发到 faith-renderer.js 的 showFaithDetail
// ============================================================

/* selectFaith dup removed */
// ===== 权威知识库面板函数 =====
let KNOWLEDGE_FIELDS = [
  {key:'bazi', icon:'🔮', name:'八字命理学', color:'var(--cinn)', desc:'四柱八字，洞察人生'},
  {key:'liuyao', icon:'卦', name:'六爻预测学', color:'var(--cyan)', desc:'铜钱起卦，趋吉避凶'},
  {key:'fengshui', icon:'🏔️', name:'风水学', color:'var(--jade)', desc:'环境调理，藏风聚气'},
  {key:'xingming', icon:'📝', name:'姓名学', color:'var(--violet2)', desc:'名正言顺，五格剖象'},
  {key:'tizhi', icon:'🌿', name:'中医体质学', color:'var(--cinn2)', desc:'九种体质，辨证调理'},
  {key:'yijing', icon:'☯', name:'易经占卜', color:'var(--ink3)', desc:'周易六十四卦'},
  {key:'ziwei', icon:'⭐', name:'紫微斗数', color:'var(--warn)', desc:'帝星斗数，人生棋盘'},
  {key:'qimen', icon:'🌀', name:'奇门遁甲', color:'var(--cinn2)', desc:'排盘布局，运筹帷幄'},
  {key:'meihua', icon:'🌸', name:'梅花易数', color:'var(--emerald)', desc:'随时起卦，灵活多变'},
  {key:'liuren', icon:'🕰️', name:'大六壬', color:'var(--violet)', desc:'精细预测，神课通灵'}
];

function openAuthoritativePanel() {
  let grid = document.getElementById('knowledgeCardsGrid');
  if (!grid) return;
  grid.innerHTML = '';
  KNOWLEDGE_FIELDS.forEach(function(f) {
    let card = document.createElement('div');
    card.className = 'knowledge-card';
    card.style.cssText = 'background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:30px;cursor:pointer;transition:all 0.3s;position:relative;overflow:hidden';
    card.innerHTML = '<div style="position:absolute;top:-20px;right:-20px;font-size:120px;opacity:0.06">'+f.icon+'</div>'+
      '<div style="font-size:42px;margin-bottom:16px">'+f.icon+'</div>'+
      '<h3 style="font-family:Ma Shan Zheng,serif;font-size:22px;color:var(--gold);letter-spacing:3px;margin-bottom:12px">'+f.name+'</h3>'+
      '<div style="font-size:14px;color:var(--paper2);margin-bottom:16px">'+f.desc+'</div>'+
      '<div style="font-size:12px;color:var(--paper2);opacity:0.7">点击查看详情 →</div>';
    card.onmouseover = function(){ this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 25px rgba(201,168,76,0.15)'; };
    card.onmouseout = function(){ this.style.transform=''; this.style.boxShadow=''; };
    card.onclick = function(){ showKnowledgeDetail(f.key, f.name); };
    grid.appendChild(card);
  });
  document.getElementById('authoritativeKnowledgePanel').style.display = 'block';
  document.body.style.overflow = 'hidden';
}

function closeAuthoritativePanel() {
  document.getElementById('authoritativeKnowledgePanel').style.display = 'none';
  document.body.style.overflow = '';
}

function showKBDetail(key) {
  let grid = document.getElementById('kb-grid');
  if(grid) { grid.style.display = 'none'; grid.style.marginTop = '0'; }
  let detail = document.getElementById('kb-detail');
  detail.style.display = 'block';
  let title = document.getElementById('kb-detail-title');
  let content = document.getElementById('kb-detail-content');
  
  let names = {
    bazi:'八字命理',liuyao:'六爻占卜',qimen:'奇门遁甲',meihua:'梅花易数',
    liuren:'大六壬',fengshui:'风水堪舆',xingming:'姓名学',tizhi:'中医体质',ziwei:'紫微斗数'
  };
  title.textContent = names[key] || key;
  
  let html = '';
  try {
    let KB = typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined' ? AUTHORITATIVE_KNOWLEDGE : {};
    let data = KB[key] || {};
    
    if (data && typeof data === 'object') {
      Object.keys(data).slice(0, 20).forEach(function(k) {
        let val = data[k];
        if (typeof val === 'string') {
          html += '<div style="margin-bottom:12px"><strong style="color:var(--gold)">' + k + '</strong>：' + val + '</div>';
        } else if (typeof val === 'object' && val !== null) {
          if (Array.isArray(val)) {
            html += '<div style="margin-bottom:12px"><strong style="color:var(--gold)">' + k + '</strong>（' + val.length + '条）</div>';
            val.slice(0, 5).forEach(function(item) {
              if (typeof item === 'string') html += '<div style="padding-left:16px;opacity:.8">• ' + item + '</div>';
              else if (item && item.name) html += '<div style="padding-left:16px;opacity:.8">• <strong>' + item.name + '</strong>' + (item.desc ? ' - ' + item.desc : '') + '</div>';
            });
            if (val.length > 5) html += '<div style="padding-left:16px;opacity:.5">... 等' + val.length + '条</div>';
          } else if (val.name) {
            html += '<div style="margin-bottom:12px"><strong style="color:var(--gold)">' + (val.name || k) + '</strong>' + (val.overview || val.desc || val.meaning ? '：' + (val.overview || val.desc || val.meaning) : '') + '</div>';
          }
        }
      });
    }
    
    let supMap = {
      xingming: 'KNOWLEDGE_SUPPLEMENT_XINGMING',
      tizhi: 'KNOWLEDGE_SUPPLEMENT_TIZHI',
      meihua: 'KNOWLEDGE_SUPPLEMENT_MEIHUA',
      liuren: 'KNOWLEDGE_SUPPLEMENT_LIUREN',
      qimen: 'KNOWLEDGE_SUPPLEMENT_QIMEN'
    };
    let supKey = supMap[key];
    if (supKey && typeof window[supKey] !== 'undefined') {
      let sup = window[supKey];
      html += '<div style="margin-top:20px;padding-top:16px;border-top:1px solid rgba(201,168,76,.1)"><strong style="color:var(--gold)">📚 补充知识</strong></div>';
      Object.keys(sup).slice(0, 15).forEach(function(k2) {
        let v = sup[k2];
        if (typeof v === 'string') html += '<div style="margin-bottom:8px">• <strong>' + k2 + '</strong>：' + v + '</div>';
        else if (Array.isArray(v)) html += '<div style="margin-bottom:8px">• <strong>' + k2 + '</strong>（' + v.length + '条）</div>';
        else if (typeof v === 'object') html += '<div style="margin-bottom:8px">• <strong>' + k2 + '</strong></div>';
      });
    }
    
    if (!html) html = '<div style="text-align:center;opacity:.5;padding:20px">知识库加载中...</div>';
  } catch(e) {
    html = '<div style="text-align:center;opacity:.5;padding:20px">知识库加载出错：' + e.message + '</div>';
  }
  content.innerHTML = html;
}

function showKnowledgeDetail(key, name) {
  // 数据源映射：将卡片key映射到正确的数据位置
  let keyMap = {
    bagua: 'bagua', liushisigua: 'liushisigua', bazi: 'bazi', qimen: 'qimen',
    wuxing: 'wuxing', fengshui: 'fengshui', shishen: 'shishen', nayin: 'nayin',
    shensha: 'shensha', hechong: 'hechong', liuyao: 'liuyao', xingming: 'xingming',
    shengxiao: 'shengxiao', constellation: 'constellation', yangzhai: 'yangzhai',
    ziwei: 'ziwei', meihua: 'meihua', liuren: 'daliuren', tizhi: 'tizhi',
    rujia: 'rujia', daojia: 'daojia', fojia: 'fojia', zeji: 'zeji',
    huxing: 'huxing', cezi: 'cezi', jingdian: 'jingdian', fanyin: 'fanyin',
    meirikoujue: 'meirikoujue', gongde: 'gongde', zhishitupu: 'zhishitupu',
    yangsheng: 'yangsheng', daochang: 'daochang', jiazinayin: 'jiazinayin',
    jieqi: 'jieqi', zhouyi: 'zhouyi', yanzhi: 'yanzhi'
  };
  let mappedKey = keyMap[key] || key;
  // console.log('[知识库] showKnowledgeDetail called: key=' + key);
  // 确保知识库详情弹窗z-index最高
  let modal = document.getElementById('knowledgeDetailModal');
  if (modal) modal.style.zIndex = '10001';

  // 优先使用 window.KNOWLEDGE_DETAILS（来自 knowledge-details.js）
  if (typeof window.KNOWLEDGE_DETAILS !== 'undefined' && window.KNOWLEDGE_DETAILS[mappedKey]) {
    let detailEl = document.getElementById('knowledgeDetailContent');
    let titleEl2 = document.getElementById('knowledgeDetailTitle');
    if (!detailEl || !titleEl2) return;
    
    let names = {bagua:'易经八卦',liushisigua:'六十四卦',bazi:'八字四柱',qimen:'奇门遁甲',wuxing:'五行体系',fengshui:'风水堪舆',shishen:'十神详解',nayin:'纳音五行',shensha:'神煞体系',hechong:'合冲刑害',liuyao:'六爻基础',xingming:'姓名学基础',shengxiao:'十二生肖',constellation:'西方星座',ziwei:'紫微斗数',meihua:'梅花易数',liuren:'大六壬',tizhi:'中医体质',rujia:'儒家',daojia:'道家',fojia:'佛家',zeji:'择吉',huxing:'好户型',cezi:'测字',jingdian:'经典朗读',fanyin:'梵音音乐',meirikoujue:'每日口诀',gongde:'功德',zhishitupu:'知识图谱',yangsheng:'养生调理',daochang:'道场导航',jiazinayin:'甲子纳音',jieqi:'节气',zhouyi:'周易',yanzhi:'言值'};
    titleEl2.textContent = names[key] || name || key;
    
    // 添加样式
    let html = '<style>.kd-section h4{color:var(--gold);font-size:18px;letter-spacing:3px;margin-top:28px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,0.2)}.kd-section p{line-height:2;margin-bottom:12px}.kd-section ul,.kd-section ol{padding-left:24px;margin-bottom:12px}.kd-section li{margin-bottom:8px;line-height:1.8}.kd-section .highlight{color:var(--gold);font-weight:600}.kd-section .kd-quote{background:rgba(201,168,76,0.05);border-left:3px solid var(--gold);padding:16px 20px;margin:16px 0;border-radius:0 8px 8px 0}.kd-section .kd-quote p{margin:0;font-style:italic;line-height:1.8}.kd-section .kd-list{list-style:none;padding-left:0}.kd-section .kd-list li{position:relative;padding-left:20px}.kd-section .kd-list li::before{content:"•";color:var(--gold);position:absolute;left:0}.kd-section .kd-list.warning li::before{content:"⚠"}.kd-section .kd-refs{background:rgba(201,168,76,0.03);padding:12px 16px;border-radius:6px;font-size:13px}.kd-section .kd-table{width:100%;border-collapse:collapse;margin:16px 0}.kd-section .kd-table th,.kd-section .kd-table td{border:1px solid rgba(201,168,76,0.2);padding:10px 12px;text-align:center;font-size:13px}.kd-section .kd-table th{background:rgba(201,168,76,0.1);color:var(--gold)}</style>';
    html += '<div class="kd-section">' + window.KNOWLEDGE_DETAILS[mappedKey] + '</div>';
    
    detailEl.innerHTML = html;
    modal = document.getElementById('knowledgeDetailModal');
    if (modal) {
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
    return;
  }
  
  // 其次使用内联 kd-xxx div 的内容
  let kdDiv = document.getElementById('kd-' + key);
  if (kdDiv) {
    // 隐藏所有 kd-xxx div（全局）
    document.querySelectorAll('[id^="kd-"]').forEach(function(el) { el.style.display = 'none'; });
    // 隐藏卡片网格，显示详情页
    let grid = document.getElementById('knowledge-grid');
    if (grid) grid.style.display = 'none';
    let detailPage = document.getElementById('knowledge-detail');
    if (detailPage) detailPage.style.display = 'block';
    // 显示目标详情
    kdDiv.style.display = 'block';
    // 更新标题
    let titleEl = document.getElementById('knowledge-detail-title');
    if (titleEl) {
      let names = {bagua:'易经八卦',liushisigua:'六十四卦',bazi:'八字四柱',qimen:'奇门遁甲',wuxing:'五行体系',fengshui:'风水堪舆',shishen:'十神详解',nayin:'纳音五行',shensha:'神煞体系',hechong:'合冲刑害',liuyao:'六爻基础',xingming:'姓名学基础',shengxiao:'十二生肖',constellation:'西方星座',ziwei:'紫微斗数',meihua:'梅花易数',liuren:'大六壬',tizhi:'中医体质',rujia:'儒家',daojia:'道家',fojia:'佛家',zeji:'择吉',huxing:'好户型',cezi:'测字',jingdian:'经典朗读',fanyin:'梵音音乐',meirikoujue:'每日口诀',gongde:'功德',zhishitupu:'知识图谱',yangsheng:'养生调理',daochang:'道场导航',jiazinayin:'甲子纳音',jieqi:'节气',zhouyi:'周易',yanzhi:'言值'};
      titleEl.textContent = names[key] || name || key;
    }
    window.scrollTo({top:0,behavior:'smooth'});
    return;
  }

  // 回退：使用 AUTHORITATIVE_KNOWLEDGE 弹窗（增强渲染器）
  let detailEl = document.getElementById('knowledgeDetailContent');
  let titleEl2 = document.getElementById('knowledgeDetailTitle');
  if (!detailEl || !titleEl2) return;
  titleEl2.textContent = name || key;

  let html = '';
  function fmtKey(k) {
    return k.replace(/_/g,' ').replace(/([A-Z])/g,' $1').replace(/\b\w/g,function(m){return m.toUpperCase()});
  }
  function fmtVal(v) {
    if (typeof v === 'string') return v.replace(/\n/g,'<br>');
    if (Array.isArray(v)) {
      let items = v.filter(function(x){return typeof x==='string'&&x.length>2||(typeof x==='object'&&x!==null);});
      if (items.length===0) return '';
      let s = '<ul style="padding-left:20px;margin:8px 0">';
      items.forEach(function(it){
        if (typeof it==='string') s += '<li style="margin-bottom:6px;line-height:1.8">'+it.replace(/\n/g,'<br>')+'</li>';
        else if (typeof it==='object'&&it!==null) {
          let nm = it.name||it.title||'';
          let desc = it.desc||it.text||it.meaning||'';
          s += '<li style="margin-bottom:8px;line-height:1.8"><strong style="color:var(--gold)">'+(nm?' '+nm:'')+'</strong>'+(desc?' '+desc.replace(/\n/g,'<br>'):'');
          Object.keys(it).forEach(function(ak){
            if (['name','title','desc','text','meaning'].indexOf(ak)<0) {
              let av = typeof it[ak]==='string'?it[ak]:JSON.stringify(it[ak]);
              if (av.length>1&&av.length<200) s += ' <span style="color:var(--text-dim);font-size:12px">('+fmtKey(ak)+'：'+av+')</span>';
            }
          });
          s += '</li>';
        }
      });
      return s+'</ul>';
    }
    if (typeof v === 'object' && v !== null) {
      let keys = Object.keys(v).filter(function(kk){return typeof v[kk]==='string'&&v[kk].length>3||typeof v[kk]==='object'&&v[kk]!==null;});
      if (keys.length===0) return '';
      let s = '';
      keys.forEach(function(kk){
        let vv = v[kk];
        if (typeof vv==='string') s += '<div style="margin-bottom:10px;padding:10px 12px;background:rgba(201,168,76,0.04);border-radius:6px;border-left:2px solid var(--gold)"><strong style="color:var(--gold);font-size:13px">'+fmtKey(kk)+'</strong><br><span style="font-size:14px;line-height:1.9">'+vv.replace(/\n/g,'<br>')+'</span></div>';
        else if (Array.isArray(vv)) {
          let sub = fmtVal(vv);
          if (sub) s += '<div style="margin:10px 0"><strong style="color:var(--gold);font-size:13px">'+fmtKey(kk)+'</strong>'+sub+'</div>';
        }
        else if (typeof vv==='object'&&vv!==null) {
          let sub2 = '';
          Object.keys(vv).slice(0,20).forEach(function(ak){
            let av = vv[ak];
            if (typeof av==='string'&&av.length>3) sub2 += '<div style="margin-bottom:8px"><strong style="color:var(--gold)">'+fmtKey(ak)+'</strong>：'+av.replace(/\n/g,'<br>')+'</div>';
            else if (typeof av==='object'&&av!==null) {
              let nm=av.name||av.title||'';
              let desc=av.desc||av.text||av.meaning||'';
              if (nm||desc) sub2 += '<div style="margin-bottom:8px"><strong style="color:var(--gold)">'+fmtKey(ak)+'</strong> '+(nm?'【'+nm+'】 ':'')+desc.replace(/\n/g,'<br>')+'</div>';
            }
          });
          if (sub2) s += '<div style="margin:10px 0"><strong style="color:var(--gold);font-size:13px">'+fmtKey(kk)+'</strong><div style="padding:10px;background:rgba(201,168,76,0.03);border-radius:6px">'+sub2+'</div></div>';
        }
      });
      return s||'';
    }
    return '';
  }

  if (typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined' && AUTHORITATIVE_KNOWLEDGE[mappedKey]) {
    let section = AUTHORITATIVE_KNOWLEDGE[mappedKey];
    for (let sub in section) {
      if (section.hasOwnProperty(sub) && sub[0] !== '_') {
        let val = section[sub];
        if (typeof val === 'string' && val.length > 10) {
          html += '<h3 style="color:var(--gold);margin-top:28px;margin-bottom:14px;font-size:17px;border-bottom:1px solid rgba(201,168,76,0.25);padding-bottom:8px;letter-spacing:2px">'+fmtKey(sub)+'</h3>';
          html += '<p style="line-height:2.1;margin-bottom:14px">'+val.replace(/\n/g,'<br>')+'</p>';
        } else if (typeof val === 'object' && val !== null && Object.keys(val).length > 0) {
          let rendered = fmtVal(val);
          if (rendered) {
            html += '<h3 style="color:var(--gold);margin-top:28px;margin-bottom:14px;font-size:17px;border-bottom:1px solid rgba(201,168,76,0.25);padding-bottom:8px;letter-spacing:2px">'+fmtKey(sub)+'</h3>';
            html += rendered;
          }
        }
      }
    }
  }


  
  // 额外数据源：阳宅知识库
  if (!html && typeof window.YANGZHAI_KB !== 'undefined' && key === 'yangzhai') {
    html = '<div class="kd-section">' + renderYangzhaiKB(window.YANGZHAI_KB) + '</div>';
  }
  // 额外数据源：生肖知识库
  if (!html && typeof window.ZODIAC_KB !== 'undefined' && key === 'shengxiao') {
    html = '<div class="kd-section">' + window.ZODIAC_KB.intro + '</div>';
  }
  // 额外数据源：星座知识库
  if (!html && typeof window.CONSTELLATION_KB !== 'undefined' && key === 'constellation') {
    html = '<div class="kd-section">' + window.CONSTELLATION_KB.intro + '</div>';
  }
  detailEl.innerHTML = html || '<p style="color:var(--paper2);text-align:center;padding:40px 0">该领域知识正在完善中，敬请期待...</p>';
  modal = document.getElementById('knowledgeDetailModal');
  if (modal) {
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

// ===== 命理宗师知识库 =====
function showMastersKB() {
  let modal = document.getElementById('knowledgeDetailModal');
  let content = document.getElementById('knowledgeDetailContent');
  let title = document.getElementById('knowledgeDetailTitle');
  if (!modal || !content || !title) return;
  title.textContent = '命理宗师 · 历代大师传记';
  let html = '<style>.kd-section h4{color:var(--gold);font-size:18px;letter-spacing:3px;margin-top:28px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,0.2)}.kd-section p{line-height:2;margin-bottom:12px}.master-card-kb{background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;padding:24px;margin-bottom:20px;transition:all .3s}.master-card-kb:hover{border-color:rgba(201,168,76,0.4);background:rgba(201,168,76,0.06)}.master-card-kb h5{color:var(--gold);font-size:16px;margin-bottom:8px}.master-card-kb .era{font-size:12px;color:var(--paper2);opacity:.7;margin-bottom:12px}.master-card-kb .school-tag{display:inline-block;font-size:11px;background:rgba(201,168,76,0.1);color:var(--gold);padding:3px 12px;border-radius:12px;margin-bottom:12px}</style>';
  html += '<div class="kd-section">';
  html += '<p style="text-align:center;opacity:.7;margin-bottom:24px">从唐宋到当代，命理宗师一脉相承，薪火相传。他们的智慧凝聚在典籍之中，为后学者指引方向。</p>';
  if (typeof MASTERS_KNOWLEDGE !== 'undefined') {
    let sections = [
      {key: 'ancient_masters', title: '一、古代命理大师（唐宋元明）'},
      {key: 'modern_masters', title: '二、近现代命理大师（清末民国）'},
      {key: 'contemporary_masters', title: '三、当代命理大师'}
    ];
    sections.forEach(function(sec) {
      let arr = MASTERS_KNOWLEDGE[sec.key];
      if (arr && arr.length) {
        html += '<h4>' + sec.title + '</h4>';
        arr.forEach(function(m) {
          html += '<div class="master-card-kb">';
          html += '<h5>' + (m.name || '') + '</h5>';
          html += '<div class="era">' + (m.era || '') + '</div>';
          if (m.school) html += '<span class="school-tag">' + m.school + '</span>';
          if (m.title) html += '<p><b>头衔：</b>' + m.title + '</p>';
          if (m.life) html += '<p><b>生平：</b>' + m.life + '</p>';
          if (m.contribution) html += '<p><b>贡献：</b>' + m.contribution.replace(/\n/g, '<br>') + '</p>';
          if (m.core_teaching) html += '<p><b>核心思想：</b>' + m.core_teaching + '</p>';
          if (m.representative_work) html += '<p><b>代表著作：</b>' + m.representative_work + '</p>';
          if (m.quote) html += '<p><b>名言：</b>' + m.quote + '</p>';
          if (m.legacy) html += '<p><b>影响：</b>' + m.legacy + '</p>';
          html += '</div>';
        });
      }
    });
  } else {
    html += '<p>大师知识库加载中...</p>';
  }
  html += '</div>';
  content.innerHTML = html;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}
window.showMastersKB = showMastersKB;

// ===== 倪海厦讲堂知识库 =====
function showNishanKB() {
  let modal = document.getElementById('knowledgeDetailModal');
  let content = document.getElementById('knowledgeDetailContent');
  let title = document.getElementById('knowledgeDetailTitle');
  if (!modal || !content || !title) return;
  title.textContent = '倪海厦讲堂 · 天纪人纪';
  let html = `<style>.nishan-section h4{color:var(--gold);font-size:18px;letter-spacing:3px;margin-top:28px;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid rgba(201,168,76,0.2)}.nishan-section p{line-height:2;margin-bottom:12px}.nishan-card{background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:14px;padding:24px;margin-bottom:20px;transition:all .3s}.nishan-card:hover{border-color:rgba(201,168,76,0.4);background:rgba(201,168,76,0.06)}.nishan-quote{background:rgba(192,57,43,0.06);border-left:3px solid var(--cinn);padding:14px 18px;margin:12px 0;border-radius:0 8px 8px 0;font-style:italic;color:var(--paper2);line-height:2}.nishan-tab{display:inline-block;padding:8px 20px;margin:4px;border:1px solid rgba(201,168,76,0.25);border-radius:20px;cursor:pointer;font-size:13px;transition:all .25s}.nishan-tab:hover,.nishan-tab.active{background:rgba(201,168,76,0.12);color:var(--gold);border-color:var(--gold)}.nishan-teacher{background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(192,57,43,0.05));border:1px solid rgba(201,168,76,0.3);border-radius:16px;padding:28px;margin-bottom:24px;text-align:center}
/* === 排盘结果统一样式 === */
.rpt-export-bar{margin-top:16px;text-align:center;display:flex;gap:6px;justify-content:center;flex-wrap:wrap}
.rpt-export-btn{font-size:12px;color:var(--gold);background:none;border:1px solid rgba(201,168,76,.2);border-radius:20px;padding:6px 20px;cursor:pointer;letter-spacing:2px;margin:0 4px;font-family:inherit;transition:all .25s}
.rpt-export-btn:hover{background:rgba(201,168,76,.1);border-color:rgba(201,168,76,.4)}
/* 结果板块统一卡片 */
.rpt-section{background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:16px;margin-bottom:12px}
.rpt-section-title{font-size:14px;font-weight:bold;color:var(--gold);letter-spacing:2px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px}
.rpt-section-body{font-size:13px;line-height:1.9;color:var(--paper);opacity:.9}
.rpt-section-body b{color:var(--gold2)}
/* 大白话总结统一样式 */
.rpt-plain{margin-top:14px;padding:12px 16px;background:rgba(52,152,219,.04);border-left:3px solid var(--cyan2);border-radius:0 8px 8px 0}
.rpt-plain-title{font-size:13px;font-weight:bold;color:var(--cyan2);margin-bottom:4px}
.rpt-plain-body{font-size:12px;color:var(--paper);line-height:1.8}
/* 结果指标卡 */
.rpt-metric-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:12px}
.rpt-metric{background:rgba(255,255,255,.03);border:1px solid var(--border);border-radius:8px;padding:10px;text-align:center}
.rpt-metric-label{font-size:10px;opacity:.5;margin-bottom:4px}
.rpt-metric-value{font-size:16px;font-weight:bold;color:var(--gold)}

</style>`;
  html += '<div class="nishan-section">';
  
  if (typeof NISHAN_KNOWLEDGE !== 'undefined') {
    let nk = NISHAN_KNOWLEDGE;
    
    // 教师介绍
    html += '<div class="nishan-teacher">';
    html += '<div style="font-size:48px;margin-bottom:12px">🩺</div>';
    html += '<h4 style="border:none;margin-top:0">' + nk.meta.teacher_info.name + '</h4>';
    html += '<p style="opacity:.7;font-size:13px;margin-bottom:8px">' + nk.meta.teacher_info.dates + ' · ' + nk.meta.teacher_info.origin + '</p>';
    html += '<p style="font-size:13px;opacity:.8;max-width:600px;margin:0 auto">' + nk.meta.teacher_info.intro + '</p>';
    html += '<p style="font-size:12px;opacity:.5;margin-top:12px">主要著作：' + nk.meta.teacher_info.works + '</p>';
    html += '<p style="font-size:11px;opacity:.4;margin-top:8px">' + nk.meta.disclaimer + '</p>';
    html += '</div>';
    
    // 选项卡
    html += '<div style="text-align:center;margin:20px 0">';
    html += '<span class="nishan-tab active" onclick="document.getElementById(\'nishan-tianji\').style.display=\'block\';document.getElementById(\'nishan-renji\').style.display=\'none\';document.getElementById(\'nishan-cases\').style.display=\'none\';this.classList.add(\'active\');this.nextSibling.classList.remove(\'active\');this.nextSibling.nextSibling.classList.remove(\'active\')">🔮 天纪（命理）</span>';
    html += '<span class="nishan-tab" onclick="document.getElementById(\'nishan-tianji\').style.display=\'none\';document.getElementById(\'nishan-renji\').style.display=\'block\';document.getElementById(\'nishan-cases\').style.display=\'none\';this.classList.add(\'active\');this.previousSibling.classList.remove(\'active\');this.nextSibling.classList.remove(\'active\')">💊 人纪（中医）</span>';
    html += '<span class="nishan-tab" onclick="document.getElementById(\'nishan-tianji\').style.display=\'none\';document.getElementById(\'nishan-renji\').style.display=\'none\';document.getElementById(\'nishan-cases\').style.display=\'block\';this.classList.add(\'active\');this.previousSibling.classList.remove(\'active\');this.previousSibling.previousSibling.classList.remove(\'active\')">📋 临床实战</span>';
    html += '</div>';
    
    // 天纪
    html += '<div id="nishan-tianji">';
    
    // 64卦
    if (nk.tianji.hexagrams && nk.tianji.hexagrams.length) {
      html += '<h4>☰ 64卦解读（倪师版）</h4>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:24px">';
      nk.tianji.hexagrams.forEach(function(h) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:6px">' + h.num + '. ' + h.name + '</h5>';
        if (h.summary) html += '<p style="font-size:13px;line-height:1.8">' + h.summary + '</p>';
        if (h.nishi_saying) html += '<div class="nishan-quote" style="font-size:12px">🗣️ ' + h.nishi_saying + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    
    // 紫微斗数
    if (nk.tianji.ziwei) {
      html += '<h4>⭐ 紫微斗数（倪师方法）</h4>';
      let zw = nk.tianji.ziwei;
      if (zw.core_principles) {
        zw.core_principles.forEach(function(p) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">' + p.name + '</h5><p style="font-size:13px;line-height:1.8">' + p.content + '</p></div>';
        });
      }
      if (zw.key_techniques) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">关键技法</h5><ul style="font-size:13px;line-height:2;padding-left:20px">';
        zw.key_techniques.forEach(function(t) { html += '<li>' + t + '</li>'; });
        html += '</ul></div>';
      }
      if (zw.nishi_quotes) {
        zw.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    // 八字
    if (nk.tianji.bazi) {
      html += '<h4>🔮 八字命理（倪师心得）</h4>';
      let bz = nk.tianji.bazi;
      if (bz.core_theory) {
        html += '<div class="nishan-card">';
        for (let key in bz.core_theory) {
          html += '<p><b style="color:var(--gold)">' + key + '：</b>' + bz.core_theory[key] + '</p>';
        }
        html += '</div>';
      }
      if (bz.key_concepts) {
        bz.key_concepts.forEach(function(c) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">' + c.name + '</h5><p style="font-size:13px;line-height:1.8">' + c.content + '</p></div>';
        });
      }
      if (bz.nishi_quotes) {
        bz.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    // 风水
    if (nk.tianji.fengshui) {
      html += '<h4>🏔️ 风水堪舆（倪师方法）</h4>';
      let fs = nk.tianji.fengshui;
      if (fs.schools) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">流派</h5>';
        for (let sk in fs.schools) { html += '<p style="font-size:13px;line-height:1.8"><b>' + sk + '：</b>' + fs.schools[sk] + '</p>'; }
        html += '</div>';
      }
      if (fs.key_principles) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">核心原则</h5><ul style="font-size:13px;line-height:2;padding-left:20px">';
        fs.key_principles.forEach(function(p) { html += '<li>' + p + '</li>'; });
        html += '</ul></div>';
      }
      if (fs.xuan_kong_flying_stars) {
        let xk = fs.xuan_kong_flying_stars;
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">玄空飞星</h5>';
        html += '<p style="font-size:13px;line-height:1.8">' + xk.intro + '</p>';
        if (xk.nine_stars) {
          html += '<ul style="font-size:13px;line-height:2;padding-left:20px;margin-top:8px">';
          xk.nine_stars.forEach(function(s) { html += '<li>' + s + '</li>'; });
          html += '</ul>';
        }
        if (xk.timing) html += '<p style="font-size:13px;line-height:1.8;margin-top:8px">' + xk.timing + '</p>';
        html += '</div>';
      }
      if (fs.nishi_quotes) {
        fs.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    html += '</div>'; // end tianji
    
    // 人纪
    html += '<div id="nishan-renji" style="display:none">';
    
    // 针灸
    if (nk.renji.acupuncture) {
      html += '<h4>🪡 针灸大成要穴</h4>';
      let ac = nk.renji.acupuncture;
      if (ac.key_acupoints) {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:24px">';
        ac.key_acupoints.forEach(function(p) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:4px">' + p.name + '</h5>';
          html += '<p style="font-size:12px;opacity:.6;margin-bottom:6px">📍 ' + p.location + '</p>';
          html += '<p style="font-size:13px;line-height:1.7">' + p.function + '</p>';
          html += '</div>';
        });
        html += '</div>';
      }
      if (ac.nishi_techniques) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">倪师针法要诀</h5><ul style="font-size:13px;line-height:2;padding-left:20px">';
        ac.nishi_techniques.forEach(function(t) { html += '<li>' + t + '</li>'; });
        html += '</ul></div>';
      }
    }
    
    // 经方
    if (nk.renji.formulas) {
      html += '<h4>💊 经方体系（伤寒论+金匮要略）</h4>';
      let fm = nk.renji.formulas;
      html += '<div class="nishan-quote">💡 ' + fm.core_principle + '</div>';
      if (fm.shanghan_formulas) {
        html += '<h5 style="color:var(--gold);font-size:15px;margin:16px 0 8px">伤寒论方</h5>';
        fm.shanghan_formulas.forEach(function(f) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:14px;margin-bottom:4px">' + f.name + '</h5>';
          html += '<p style="font-size:12px;opacity:.7;margin-bottom:6px">组成：' + f.ingredients + '</p>';
          html += '<p style="font-size:13px;line-height:1.7"><b>主治：</b>' + f.indication + '</p>';
          if (f.nishi_note) html += '<div class="nishan-quote" style="font-size:12px">💡 ' + f.nishi_note + '</div>';
          html += '</div>';
        });
      }
      if (fm.jinkui_formulas) {
        html += '<h5 style="color:var(--gold);font-size:15px;margin:16px 0 8px">金匮要略方</h5>';
        fm.jinkui_formulas.forEach(function(f) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:14px;margin-bottom:4px">' + f.name + '</h5>';
          html += '<p style="font-size:12px;opacity:.7;margin-bottom:6px">组成：' + f.ingredients + '</p>';
          html += '<p style="font-size:13px;line-height:1.7"><b>主治：</b>' + f.indication + '</p>';
          if (f.nishi_note) html += '<div class="nishan-quote" style="font-size:12px">💡 ' + f.nishi_note + '</div>';
          html += '</div>';
        });
      }
      if (fm.nishi_quotes) {
        fm.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    // 本草
    if (nk.renji.herbs) {
      html += '<h4>🌿 神农本草经药性</h4>';
      let hb = nk.renji.herbs;
      if (hb.classification) {
        html += '<div class="nishan-card"><p style="font-size:13px;line-height:1.8"><b>上品：</b>' + hb.classification.upper_class + '</p>';
        html += '<p style="font-size:13px;line-height:1.8"><b>中品：</b>' + hb.classification.middle_class + '</p>';
        html += '<p style="font-size:13px;line-height:1.8"><b>下品：</b>' + hb.classification.lower_class + '</p></div>';
      }
      if (hb.key_herbs) {
        html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:14px;margin-bottom:24px">';
        hb.key_herbs.forEach(function(h) {
          html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:4px">' + h.name + '</h5>';
          html += '<p style="font-size:12px;opacity:.6">' + h.nature + ' · 归' + h.meridian + '经</p>';
          html += '<p style="font-size:13px;line-height:1.7;margin-top:6px">' + h.function + '</p>';
          if (h.nishi_note) html += '<div class="nishan-quote" style="font-size:12px">💡 ' + h.nishi_note + '</div>';
          html += '</div>';
        });
        html += '</div>';
      }
    }
    
    // 诊疗思路
    if (nk.renji.diagnosis) {
      html += '<h4>🩺 诊疗思路</h4>';
      let dg = nk.renji.diagnosis;
      html += '<div class="nishan-card"><p style="font-size:13px;line-height:1.8"><b>六经辨证：</b>' + dg.six_syndromes + '</p>';
      html += '<p style="font-size:13px;line-height:1.8"><b>八纲辨证：</b>' + dg.eight_principles + '</p></div>';
      if (dg.diagnosis_methods) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">四诊</h5>';
        for (let dk in dg.diagnosis_methods) {
          html += '<p style="font-size:13px;line-height:1.8"><b>' + dk + '：</b>' + dg.diagnosis_methods[dk] + '</p>';
        }
        html += '</div>';
      }
      if (dg.treatment_principles) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">治疗原则</h5><ul style="font-size:13px;line-height:2;padding-left:20px">';
        dg.treatment_principles.forEach(function(p) { html += '<li>' + p + '</li>'; });
        html += '</ul></div>';
      }
      if (dg.nishi_quotes) {
        dg.nishi_quotes.forEach(function(q) { html += '<div class="nishan-quote">🗣️ ' + q + '</div>'; });
      }
    }
    
    html += '</div>'; // end renji
    
    // 临床实战
    html += '<div id="nishan-cases" style="display:none">';
    if (nk.cases) {
      nk.cases.forEach(function(c) {
        html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:16px;margin-bottom:8px">' + c.title + '</h5>';
        html += '<p style="font-size:12px;opacity:.6;margin-bottom:8px">来源：' + (c.source || '') + '</p>';
        html += '<p style="font-size:13px;line-height:1.8">' + c.content + '</p>';
        if (c.key_point) html += '<div class="nishan-quote" style="font-size:12px">💡 ' + c.key_point + '</div>';
        html += '</div>';
      });
    }
    // 汉唐方剂
    if (nk.hantang_formulas) {
      html += '<h4>🏺 汉唐方剂选介</h4>';
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">';
      nk.hantang_formulas.forEach(function(h) {
        html += '<div class="nishan-card" style="padding:16px"><h5 style="color:var(--gold);font-size:13px;margin-bottom:4px">' + h.code + ' ' + h.name + '</h5>';
        html += '<p style="font-size:12px;line-height:1.6;opacity:.8">' + h.indication + '</p></div>';
      });
      html += '</div>';
    }
    html += '</div>'; // end cases
    
    // 名言与学习路径
    html += '<h4>📜 倪师名言</h4>';
    if (nk.wisdom) {
      nk.wisdom.forEach(function(w) { html += '<div class="nishan-quote">' + w + '</div>'; });
    }
    
    if (nk.study_path) {
      html += '<h4>📚 学习路径</h4>';
      html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">天纪（命理）学习路径</h5><ol style="font-size:13px;line-height:2;padding-left:20px">';
      nk.study_path.tianji_path.forEach(function(p) { html += '<li>' + p + '</li>'; });
      html += '</ol></div>';
      html += '<div class="nishan-card"><h5 style="color:var(--gold);font-size:15px;margin-bottom:8px">人纪（中医）学习路径</h5><ol style="font-size:13px;line-height:2;padding-left:20px">';
      nk.study_path.renji_path.forEach(function(p) { html += '<li>' + p + '</li>'; });
      html += '</ol></div>';
      html += '<div class="nishan-quote">💡 ' + nk.study_path.nishi_advice + '</div>';
    }
    
    html += '<p style="text-align:center;opacity:.4;font-size:11px;margin-top:32px;padding-top:16px;border-top:1px solid rgba(201,168,76,0.1)">' + nk.meta.source + '</p>';
  } else {
    html += '<p style="text-align:center;opacity:.5;padding:40px">倪海厦知识库加载中...</p>';
  }
  html += '</div>';
  content.innerHTML = html;
  modal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}
window.showNishanKB = showNishanKB;

function hideKnowledgeDetail() {
  document.querySelectorAll('[id^="kd-"]').forEach(function(el) { el.style.display = 'none'; });
  let detailPage = document.getElementById('knowledge-detail');
  if (detailPage) detailPage.style.display = 'none';
  let grid = document.getElementById('knowledge-grid');
  if (grid) grid.style.display = 'block';
  let modal = document.getElementById('knowledgeDetailModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ═══ 每日慧语（首页）══════════════════════════════════
let wisdomQuotes = [
  {text:"上善若水，水善利万物而不争，处众人之所恶，故几于道。", source:"《道德经》第八章", tag:"道家"},
  {text:"致虚极，守静笃。万物并作，吾以观复。归根曰静，是谓复命。", source:"《道德经》第十六章", tag:"道家"},
  {text:"知人者智，自知者明。胜人者有力，自胜者强。知足者富。", source:"《道德经》第三十三章", tag:"道家"},
  {text:"祸兮福之所倚，福兮祸之所伏。", source:"《道德经》第五十八章", tag:"道家"},
  {text:"为学日益，为道日损，损之又损，以至于无为。", source:"《道德经》第四十八章", tag:"道家"},
  {text:"飘风不终朝，骤雨不终日。天地尚不能久，而况于人乎？", source:"《道德经》第二十三章", tag:"道家"},
  {text:"信言不美，美言不信。善者不辩，辩者不善。", source:"《道德经》第八十一章", tag:"道家"},
  {text:"一切有为法，如梦幻泡影，如露亦如电，应作如是观。", source:"《金刚经》", tag:"佛家"},
  {text:"凡所有相，皆是虚妄。若见诸相非相，即见如来。", source:"《金刚经》", tag:"佛家"},
  {text:"过去心不可得，现在心不可得，未来心不可得。", source:"《金刚经》", tag:"佛家"},
  {text:"色即是空，空即是色；色不异空，空不异色。", source:"《心经》", tag:"佛家"},
  {text:"心无挂碍，无挂碍故，无有恐怖，远离颠倒梦想。", source:"《心经》", tag:"佛家"},
  {text:"菩提本无树，明镜亦非台。本来无一物，何处惹尘埃。", source:"六祖慧能", tag:"佛家"},
  {text:"迷时师度，悟时自度。佛法在世间，不离世间觉。", source:"六祖慧能", tag:"佛家"},
  {text:"一花一世界，一叶一菩提。平常心是道。", source:"《五灯会元》", tag:"佛家"},
  {text:"天行健，君子以自强不息；地势坤，君子以厚德载物。", source:"《周易·乾卦》", tag:"儒家"},
  {text:"知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。", source:"《大学》", tag:"儒家"},
  {text:"君子和而不同，小人同而不和。君子坦荡荡，小人长戚戚。", source:"《论语》", tag:"儒家"},
  {text:"心静了，世界就静了。不是世界变了，是你的心变了。", source:"生活哲理", tag:"生活"},
  {text:"放下执念，不是放弃一切，而是对结果不再强求，对过程全力以赴。", source:"生活哲理", tag:"生活"},
  {text:"最好的状态是：眼里有故事，脸上无风霜。历经沧桑，内心依然柔软。", source:"生活哲理", tag:"生活"},
  {text:"人生没有白走的路，每一步都算数。累了就休息，但别放弃。", source:"生活哲理", tag:"生活"},
  {text:"你担心的事，90%不会发生。与其焦虑未来，不如做好当下。", source:"生活哲理", tag:"生活"},
  {text:"真正的强大，不是忘记，而是接纳。接纳过去的遗憾，接纳现在的不完美。", source:"生活哲理", tag:"生活"},
  {text:"情绪稳定是一个人最难得的修养。遇事不怒，宠辱不惊，静观其变。", source:"生活哲理", tag:"生活"},
  {text:"睡前原谅一切，醒来便是重生。不为昨日忧，不为明日虑，活在当下。", source:"生活哲理", tag:"生活"},
  {text:"人生最曼妙的风景，是内心的淡定与从容。世事浮沉，学会随缘自在。", source:"生活哲理", tag:"生活"},
  {text:"当你改变不了环境，就改变自己的心态。心宽了，天地就宽了。", source:"生活哲理", tag:"生活"},
  {text:"人这一辈子，看清别人是聪明，看清自己是智慧。知足者常乐，能忍者自安。", source:"生活哲理", tag:"生活"},
  {text:"人生难得今已得，大道难闻今已闻。此身不向今生度，更向何生度此身？", source:"《禅宗七祖经》", tag:"佛家"},
];
let dwIdx = 0;

// ═══ 十二生肖详情 ═══════════════════════════════════
function showZodiacDetail(zodiac) {
  let zodiacMap = {
    '鼠': {emoji:'🐭', element:'水', direction:'北', bestMatch:['龙','猴','牛'], avoid:['马','羊','鸡']},
    '牛': {emoji:'🐮', element:'土', direction:'东北', bestMatch:['鼠','蛇','鸡'], avoid:['羊','马']},
    '虎': {emoji:'🐯', element:'木', direction:'东北', bestMatch:['马','狗','猪'], avoid:['猴','蛇']},
    '兔': {emoji:'🐰', element:'木', direction:'东', bestMatch:['羊','猪','狗'], avoid:['鸡','龙']},
    '龙': {emoji:'🐉', element:'土', direction:'东南', bestMatch:['鼠','猴','鸡'], avoid:['狗','兔']},
    '蛇': {emoji:'🐍', element:'火', direction:'东南', bestMatch:['牛','鸡','猴'], avoid:['猪','虎']},
    '马': {emoji:'🐴', element:'火', direction:'南', bestMatch:['虎','羊','狗'], avoid:['鼠','牛']},
    '羊': {emoji:'🐑', element:'土', direction:'西南', bestMatch:['兔','猪','马'], avoid:['牛','鼠']},
    '猴': {emoji:'🐵', element:'金', direction:'西南', bestMatch:['鼠','龙','蛇'], avoid:['虎','猪']},
    '鸡': {emoji:'🐔', element:'金', direction:'西', bestMatch:['牛','龙','蛇'], avoid:['兔','狗']},
    '狗': {emoji:'🐶', element:'土', direction:'西北', bestMatch:['虎','兔','马'], avoid:['龙','鸡']},
    '猪': {emoji:'🐷', element:'水', direction:'西北', bestMatch:['兔','羊','虎'], avoid:['蛇','猴']}
  };
  
  let info = zodiacMap[zodiac];
  if (!info) return;
  
  // 从 ZODIAC_KNOWLEDGE 获取更丰富的数据
  let zk = (typeof ZODIAC_KNOWLEDGE !== 'undefined') ? ZODIAC_KNOWLEDGE : null;
  let buddhaInfo = zk && zk.buddhaMap ? zk.buddhaMap[zodiac] : null;
  let luckInfo = zk && zk.yearlyLuck ? zk.yearlyLuck[zodiac] : null;
  let mascotInfo = zk && zk.mascots ? zk.mascots[zodiac] : null;
  
  let html = '<div style="padding:20px;max-width:600px;margin:0 auto">';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<div style="font-size:72px;margin-bottom:10px">' + info.emoji + '</div>';
  html += '<h2 style="color:var(--gold);margin:0;font-size:28px">' + zodiac + '年出生</h2>';
  html += '<p style="color:var(--paper2);margin:10px 0">五行属' + info.element + ' | 吉祥方位：' + info.direction + '</p>';
  html += '</div>';
  
  // 本命佛（增强版）
  if (buddhaInfo) {
    html += '<div style="background:rgba(201,168,76,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--gold);margin:0 0 10px 0">📿 本命佛：' + buddhaInfo.buddha + '</h4>';
    if (buddhaInfo.sanskrit) html += '<p style="font-size:12px;opacity:.6;margin:0 0 10px 0">' + buddhaInfo.sanskrit + '</p>';
    html += '<p style="margin:0 0 10px 0;color:var(--paper2);line-height:1.8">' + buddhaInfo.intro + '</p>';
    if (buddhaInfo.worship) html += '<p style="margin:0 0 8px 0;font-size:13px;color:var(--paper2)"><b>供奉方法：</b>' + buddhaInfo.worship + '</p>';
    if (buddhaInfo.benefits) html += '<p style="margin:0;font-size:13px;color:var(--paper2)"><b>功德利益：</b>' + buddhaInfo.benefits.join('、') + '</p>';
    if (buddhaInfo.taboos) html += '<p style="margin:8px 0 0;font-size:12px;color:var(--cinn2)"><b>禁忌：</b>' + buddhaInfo.taboos.join('；') + '</p>';
    html += '</div>';
  } else {
    html += '<div style="background:rgba(201,168,76,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--gold);margin:0 0 10px 0">📿 本命佛守护</h4>';
    html += '<p style="margin:0;color:var(--paper2);line-height:1.8">佩戴专属本命佛吊坠，诚心供奉，可消灾解难、增福延寿。</p>';
    html += '</div>';
  }
  
  // 年度运势
  if (luckInfo) {
    html += '<div style="background:rgba(0,188,212,0.06);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--cyan);margin:0 0 10px 0">🌟 年度运势</h4>';
    if (luckInfo.career) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>事业：</b>' + luckInfo.career + '</p>';
    if (luckInfo.wealth) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>财运：</b>' + luckInfo.wealth + '</p>';
    if (luckInfo.love) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>感情：</b>' + luckInfo.love + '</p>';
    if (luckInfo.health) html += '<p style="margin:0;font-size:13px;color:var(--paper2)"><b>健康：</b>' + luckInfo.health + '</p>';
    html += '</div>';
  }
  
  // 吉祥物推荐
  if (mascotInfo) {
    html += '<div style="background:rgba(230,126,34,0.06);padding:16px;border-radius:12px;margin-bottom:16px">';
    html += '<h4 style="color:var(--orange);margin:0 0 10px 0">🎁 吉祥物推荐</h4>';
    if (mascotInfo.home) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>家居：</b>' + mascotInfo.home + '</p>';
    if (mascotInfo.car) html += '<p style="margin:0 0 6px 0;font-size:13px;color:var(--paper2)"><b>车内：</b>' + mascotInfo.car + '</p>';
    if (mascotInfo.body) html += '<p style="margin:0;font-size:13px;color:var(--paper2)"><b>佩戴：</b>' + mascotInfo.body + '</p>';
    html += '</div>';
  }
  
  html += '<div style="background:rgba(255,255,255,0.04);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--gold);margin:0 0 10px 0">💝 最佳配对</h4>';
  html += '<p style="margin:0;color:var(--paper2)">' + info.bestMatch.join('、') + '</p>';
  html += '</div>';
  
  html += '<div style="background:rgba(244,67,54,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--cinn2);margin:0 0 10px 0">⚠️ 避免配对</h4>';
  html += '<p style="margin:0;color:var(--paper2)">' + info.avoid.join('、') + '</p>';
  html += '</div>';
  
  html += '<div style="text-align:center;margin-top:20px">';
  html += '<button onclick="showKnowledgeDetail(\'shengxiao\')" style="background:var(--gold);color:var(--ink);border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">查看完整生肖知识</button>';
  html += '</div>';
  html += '</div>';
  
  showModal('生肖命运解读 - ' + zodiac, html);
}

// ═══ 西方星座详情 ═══════════════════════════════════
function showConstellationDetail(sign) {
  let constellationData = {
    '白羊': {symbol:'♈', element:'火', ruler:'火星', traits:'勇敢、直接、冲动、领导力强', likes:'挑战、竞争、运动', dislikes:'等待、被限制', career:'企业家、运动员、创业者', love:'直接追求，喜欢就说', color:'红色', day:'星期二'},
    '金牛': {symbol:'♉', element:'土', ruler:'金星', traits:'稳定、固执、耐心、实际', likes:'美食、艺术、舒适', dislikes:'变化、匆忙', career:'金融、建筑、艺术', love:'慢热但专一，注重安全感', color:'绿色', day:'星期五'},
    '双子': {symbol:'♊', element:'风', ruler:'水星', traits:'好奇、多变、机智、善于交际', likes:'旅行、阅读、聊天', dislikes:'无聊、束缚', career:'传媒、教育、销售', love:'喜欢新鲜感，擅长甜言蜜语', color:'黄色', day:'星期三'},
    '巨蟹': {symbol:'♋', element:'水', ruler:'月亮', traits:'敏感、体贴、保护欲强、家庭导向', likes:'家庭、美食、回忆', dislikes:'冲突、伤害', career:'医疗、教育、餐饮', love:'专一忠诚，需要情感安全感', color:'白色', day:'星期一'},
    '狮子': {symbol:'♌', element:'火', ruler:'太阳', traits:'自信、慷慨、戏剧化、领导力', likes:'被关注、奢华、表演', dislikes:'被忽视、批评', career:'娱乐、管理、政治', love:'喜欢被崇拜，给予大方', color:'金色', day:'星期日'},
    '处女': {symbol:'♍', element:'土', ruler:'水星', traits:'完美主义、分析力强、务实、勤劳', likes:'秩序、健康、学习', dislikes:'混乱、脏乱', career:'医疗、编辑、会计', love:'细腻体贴，会默默付出', color:'棕色', day:'星期三'},
    '天秤': {symbol:'♎', element:'风', ruler:'金星', traits:'和谐、公正、社交、优柔寡断', likes:'艺术、美、社交', dislikes:'冲突、丑陋', career:'法律、艺术、外交', love:'浪漫，追求平衡的关系', color:'粉色', day:'星期五'},
    '天蝎': {symbol:'♏', element:'水', ruler:'冥王星', traits:'神秘、深情、执着、洞察力强', likes:'深度交流、真相、控制', dislikes:'被背叛、肤浅', career:'侦探、研究、心理', love:'专一且深情，占有欲强', color:'黑色', day:'星期二'},
    '射手': {symbol:'♐', element:'火', ruler:'木星', traits:'乐观、自由、冒险、正直', likes:'旅行、哲学、户外', dislikes:'被困、规则', career:'旅游、教育、法律', love:'喜欢自由，需要空间', color:'紫色', day:'星期四'},
    '摩羯': {symbol:'♑', element:'土', ruler:'土星', traits:'务实、纪律、耐心、有野心', likes:'成就、地位、传统', dislikes:'混乱、轻浮', career:'商业、政治、工程', love:'认真负责，表达含蓄', color:'灰色', day:'星期六'},
    '水瓶': {symbol:'♒', element:'风', ruler:'天王星', traits:'独立、创新、人道主义、叛逆', likes:'科技、自由、朋友', dislikes:'传统、被束缚', career:'科学、改革、社会活动', love:'重视精神契合，需要独立空间', color:'蓝色', day:'星期六'},
    '双鱼': {symbol:'♓', element:'水', ruler:'海王星', traits:'浪漫、敏感、艺术、直觉强', likes:'艺术、音乐、冥想', dislikes:'现实、批评', career:'艺术、医疗、心理', love:'浪漫多情，善于付出', color:'海蓝', day:'星期四'}
  };
  
  let info = constellationData[sign];
  if (!info) return;
  
  let html = '<div style="padding:20px;max-width:600px;margin:0 auto">';
  html += '<div style="text-align:center;margin-bottom:20px">';
  html += '<div style="font-size:72px;margin-bottom:10px">' + info.symbol + '</div>';
  html += '<h2 style="color:var(--gold);margin:0;font-size:28px">' + sign + '座</h2>';
  html += '<p style="color:var(--paper2);margin:10px 0">守护星：' + info.ruler + ' | 元素：' + info.element + '</p>';
  html += '</div>';
  
  html += '<div style="background:rgba(201,168,76,0.08);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--gold);margin:0 0 10px 0">性格特点</h4>';
  html += '<p style="margin:0;color:var(--paper2);line-height:1.8">' + info.traits + '</p>';
  html += '</div>';
  
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">';
  html += '<div style="background:rgba(76,175,80,0.08);padding:12px;border-radius:8px">';
  html += '<h5 style="color:var(--jade);margin:0 0 6px 0">❤️ 喜欢</h5>';
  html += '<p style="margin:0;font-size:13px;color:var(--paper2)">' + info.likes + '</p></div>';
  html += '<div style="background:rgba(244,67,54,0.08);padding:12px;border-radius:8px">';
  html += '<h5 style="color:var(--cinn2);margin:0 0 6px 0">💔 不喜欢</h5>';
  html += '<p style="margin:0;font-size:13px;color:var(--paper2)">' + info.dislikes + '</p></div>';
  html += '</div>';
  
  html += '<div style="background:rgba(255,255,255,0.04);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--gold);margin:0 0 10px 0">💼 适合职业</h4>';
  html += '<p style="margin:0;color:var(--paper2)">' + info.career + '</p>';
  html += '</div>';
  
  html += '<div style="background:rgba(255,255,255,0.04);padding:16px;border-radius:12px;margin-bottom:16px">';
  html += '<h4 style="color:var(--gold);margin:0 0 10px 0">💕 感情特点</h4>';
  html += '<p style="margin:0;color:var(--paper2)">' + info.love + '</p>';
  html += '</div>';
  
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;text-align:center">';
  html += '<div><div style="font-size:24px">🎨</div><div style="font-size:12px;color:var(--paper2)">幸运色</div><div style="color:var(--gold)">' + info.color + '</div></div>';
  html += '<div><div style="font-size:24px">📅</div><div style="font-size:12px;color:var(--paper2)">幸运日</div><div style="color:var(--gold)">' + info.day + '</div></div>';
  html += '<div><div style="font-size:24px">♨️</div><div style="font-size:12px;color:var(--paper2)">元素</div><div style="color:var(--gold)">' + info.element + '</div></div>';
  html += '</div>';
  
  html += '<div style="text-align:center;margin-top:20px">';
  html += '<button onclick="showKnowledgeDetail(\'constellation\')" style="background:var(--gold);color:var(--ink);border:none;padding:12px 24px;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">查看完整星座知识</button>';
  html += '</div>';
  html += '</div>';
  
  showModal(sign + '座命运解读', html);
}

function showYangzhaiKB() {
  if (!window.YANGZHAI_KB) { showToast('阳宅知识库加载中...'); return; }
  let kb = window.YANGZHAI_KB;
  let html = '<div style="padding:16px;max-width:800px;margin:0 auto">';
  
  // 目录导航
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">';
  let sections = [
    {id:'yk-koujue',name:'📜 口诀大全',color:'rgba(201,168,76,0.15)'},
    {id:'yk-bazhai',name:'🧭 八宅配命',color:'rgba(76,175,80,0.15)'},
    {id:'yk-xuankong',name:'⭐ 玄空飞星',color:'rgba(33,150,243,0.15)'},
    {id:'yk-xingsha',name:'⚔️ 形煞化解',color:'rgba(244,67,54,0.15)'},
    {id:'yk-quejiao',name:'📐 缺角补救',color:'rgba(156,39,176,0.15)'},
    {id:'yk-huxing',name:'🏠 户型分析',color:'rgba(255,152,0,0.15)'},
    {id:'yk-caiwei',name:'💰 财位详解',color:'rgba(255,193,7,0.15)'},
    {id:'yk-plants',name:'🌿 风水植物',color:'rgba(76,175,80,0.15)'},
    {id:'yk-louceng',name:'🏢 楼层选择',color:'rgba(33,150,243,0.15)'},
    {id:'yk-zeri',name:'📅 择日法',color:'rgba(156,39,176,0.15)'},
    {id:'yk-classics',name:'📚 经典典籍',color:'rgba(201,168,76,0.15)'}
  ];
  sections.forEach(function(s) {
    html += '<a href="#' + s.id + '" style="display:inline-block;padding:8px 14px;background:' + s.color + ';border-radius:20px;color:var(--gold);text-decoration:none;font-size:13px;cursor:pointer">' + s.name + '</a>';
  });
  html += '</div>';
  
  // 口诀大全
  html += '<div id="yk-koujue" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">📜 阳宅风水口诀大全</h3>';
  let kjCategories = {dmen:'大门',keting:'客厅',woshi:'卧室',chufang:'厨房',weishengjian:'卫生间',yangtai:'阳台',zonghe:'综合',xingsha:'形煞'};
  Object.keys(kjCategories).forEach(function(key) {
    let list = kb.koujue[key];
    if (!list) return;
    html += '<div style="margin:12px 0"><h4 style="color:var(--paper);font-size:14px;margin-bottom:6px">' + kjCategories[key] + '口诀</h4>';
    html += '<div style="background:rgba(201,168,76,0.06);padding:12px;border-radius:8px">';
    list.forEach(function(jue) {
      html += '<p style="margin:4px 0;color:var(--paper2);font-size:13px;line-height:1.8">• ' + jue + '</p>';
    });
    html += '</div></div>';
  });
  html += '</div>';
  
  // 八宅配命
  html += '<div id="yk-bazhai" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">🧭 八宅派·配命技法</h3>';
  html += '<p style="color:var(--paper2);line-height:1.8;margin-bottom:12px">' + kb.bazhai.description + '</p>';
  // 命卦表
  html += '<h4 style="color:var(--paper);font-size:14px">命卦速查表</h4>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px"><thead><tr style="background:rgba(201,168,76,0.15)"><th style="padding:8px;color:var(--gold)">命卦</th><th style="padding:8px;color:var(--gold)">类型</th><th style="padding:8px;color:var(--gold)">四吉方</th><th style="padding:8px;color:var(--gold)">四凶方</th></tr></thead><tbody>';
  kb.bazhai.mingua.table.forEach(function(row) {
    html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:6px;color:var(--paper)">' + row.gua + '</td><td style="padding:6px;color:' + (row.type==='东四命'?'var(--jade)':'var(--cyan)') + '">' + row.type + '</td><td style="padding:6px;color:var(--paper2);font-size:11px">' + row.best.join('、') + '</td><td style="padding:6px;color:var(--cinn2);font-size:11px">' + row.worst.join('、') + '</td></tr>';
  });
  html += '</tbody></table></div>';
  // 吉凶星
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">';
  html += '<div style="background:rgba(76,175,80,0.08);padding:12px;border-radius:8px"><h5 style="color:var(--jade);margin:0 0 8px">四吉星</h5>';
  Object.keys(kb.bazhai.jixing).forEach(function(k) {
    let s = kb.bazhai.jixing[k];
    html += '<p style="margin:4px 0;font-size:12px;color:var(--paper2)"><strong style="color:var(--paper)">' + k + '</strong>：' + s.meaning + ' → ' + s.effect + '</p>';
  });
  html += '</div>';
  html += '<div style="background:rgba(244,67,54,0.08);padding:12px;border-radius:8px"><h5 style="color:var(--cinn2);margin:0 0 8px">四凶星</h5>';
  Object.keys(kb.bazhai.xiongxing).forEach(function(k) {
    let s = kb.bazhai.xiongxing[k];
    html += '<p style="margin:4px 0;font-size:12px;color:var(--paper2)"><strong style="color:var(--paper)">' + k + '</strong>：' + s.meaning + ' → ' + s.effect + '</p>';
  });
  html += '</div></div>';
  html += '</div>';
  
  // 玄空飞星
  html += '<div id="yk-xuankong" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">⭐ 玄空飞星技法</h3>';
  html += '<p style="color:var(--paper2);line-height:1.8;margin-bottom:12px">' + kb.xuankong.description + '</p>';
  // 当前运
  let cy = kb.xuankong.sanyuan.current;
  html += '<div style="background:rgba(244,67,54,0.08);padding:16px;border-radius:8px;margin-bottom:16px"><h4 style="color:var(--gold);margin:0 0 8px">当前：' + cy.yun + '</h4>';
  html += '<p style="color:var(--paper2);margin:4px 0">当令星：' + cy.star + '（' + cy.element + '） | 旺方：' + cy.direction + '</p>';
  html += '<p style="color:var(--paper2);margin:4px 0">' + cy.meaning + '</p>';
  html += '<p style="color:var(--jade);margin:4px 0">布局建议：' + cy.layout_advice + '</p></div>';
  // 九运布局
  let jl = kb.xuankong.jiuyun_layout;
  html += '<h4 style="color:var(--paper);font-size:14px">九运方位布局</h4>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">';
  Object.keys(jl.directions).forEach(function(dir) {
    let d = jl.directions[dir];
    let bgc = d.activity==='高'?'rgba(76,175,80,0.1)':d.activity==='忌'?'rgba(244,67,54,0.15)':d.activity==='低'?'rgba(244,67,54,0.08)':'rgba(201,168,76,0.06)';
    html += '<div style="background:' + bgc + ';padding:10px;border-radius:8px"><strong style="color:var(--paper);font-size:13px">' + dir + '</strong><br><span style="font-size:11px;color:var(--paper2)">' + d.star + '</span><br><span style="font-size:11px;color:var(--paper2)">' + d.advice + '</span></div>';
  });
  html += '</div>';
  // 九星
  html += '<h4 style="color:var(--paper);font-size:14px">九星含义</h4>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:16px">';
  Object.keys(kb.xuankong.jiuxing).forEach(function(k) {
    let s = kb.xuankong.jiuxing[k];
    html += '<div style="background:rgba(201,168,76,0.06);padding:8px;border-radius:6px;text-align:center"><div style="color:var(--gold);font-weight:bold">' + k + '</div><div style="font-size:11px;color:var(--paper2)">' + s.star + '</div><div style="font-size:10px;color:var(--paper2)">' + s.element + '/' + s.gua + '</div></div>';
  });
  html += '</div></div>';
  
  // 形煞化解
  html += '<div id="yk-xingsha" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">⚔️ 形煞识别与化解</h3>';
  kb.xingsha.shas.forEach(function(sha) {
    html += '<div style="background:rgba(244,67,54,0.06);padding:14px;border-radius:10px;margin-bottom:12px">';
    html += '<h4 style="color:var(--paper);margin:0 0 6px">' + sha.name + ' <span style="color:var(--cinn2);font-size:12px">' + sha.severity + '</span></h4>';
    html += '<p style="color:var(--paper2);font-size:13px;margin:4px 0">' + sha.description + '</p>';
    html += '<p style="color:var(--cinn2);font-size:13px;margin:4px 0">⚠️ 影响：' + sha.symptom + '</p>';
    html += '<p style="color:var(--jade);font-size:13px;margin:4px 0">✅ 化解：' + sha.remedy + '</p>';
    html += '<pre style="background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;font-size:11px;color:var(--paper2);margin:8px 0 0;overflow-x:auto">' + sha.illustration + '</pre>';
    html += '</div>';
  });
  html += '</div>';
  
  // 缺角补救
  html += '<div id="yk-quejiao" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">📐 房屋缺角与补救</h3>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:rgba(201,168,76,0.15)"><th style="padding:8px;color:var(--gold)">方位</th><th style="padding:8px;color:var(--gold)">对应成员</th><th style="padding:8px;color:var(--gold)">影响</th><th style="padding:8px;color:var(--gold)">补救</th></tr></thead><tbody>';
  kb.quejiao.directions.forEach(function(d) {
    html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:6px;color:var(--paper)">' + d.position + '</td><td style="padding:6px;color:var(--paper2)">' + d.member + '</td><td style="padding:6px;color:var(--cinn2);font-size:11px">' + d.effect + '</td><td style="padding:6px;color:var(--jade);font-size:11px">' + d.remedy + '</td></tr>';
  });
  html += '</tbody></table></div></div>';
  
  // 户型分析
  html += '<div id="yk-huxing" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">🏠 常见户型风水分析</h3>';
  kb.huxing.types.forEach(function(t) {
    html += '<div style="background:rgba(201,168,76,0.06);padding:14px;border-radius:10px;margin-bottom:12px">';
    html += '<h4 style="color:var(--paper);margin:0 0 6px">' + t.name + ' <span style="color:var(--gold);font-size:12px">' + t.rating + '</span></h4>';
    html += '<pre style="background:rgba(0,0,0,0.3);padding:8px;border-radius:6px;font-size:11px;color:var(--paper2);margin:8px 0;display:inline-block">' + t.shape + '</pre>';
    html += '<p style="color:var(--paper2);font-size:13px;margin:8px 0 4px">' + t.analysis + '</p>';
    html += '<p style="color:var(--jade);font-size:13px;margin:4px 0">💡 ' + t.advice + '</p>';
    html += '</div>';
  });
  html += '</div>';
  
  // 财位详解
  html += '<div id="yk-caiwei" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">💰 财位详解</h3>';
  html += '<div style="background:rgba(255,193,7,0.08);padding:14px;border-radius:10px;margin-bottom:12px">';
  Object.keys(kb.caiwei.location).forEach(function(k) {
    html += '<p style="margin:4px 0;color:var(--paper2);font-size:13px"><strong style="color:var(--gold)">' + k + '</strong>：' + kb.caiwei.location[k] + '</p>';
  });
  html += '</div>';
  html += '<h4 style="color:var(--paper);font-size:14px">财位八忌</h4>';
  html += '<div style="background:rgba(244,67,54,0.06);padding:12px;border-radius:8px;margin-bottom:12px">';
  kb.caiwei.rules.forEach(function(r) { html += '<p style="margin:4px 0;color:var(--paper2);font-size:13px">⚠️ ' + r + '</p>'; });
  html += '</div>';
  html += '<h4 style="color:var(--paper);font-size:14px">招财物品</h4>';
  kb.caiwei.items.forEach(function(item) {
    html += '<div style="background:rgba(201,168,76,0.06);padding:10px;border-radius:8px;margin-bottom:6px"><strong style="color:var(--gold)">' + item.name + '</strong> <span style="color:var(--paper2);font-size:12px">→ ' + item.effect + '</span><br><span style="font-size:11px;color:var(--paper2)">摆放：' + item.placement + ' | ' + item.note + '</span></div>';
  });
  html += '</div>';
  
  // 风水植物
  html += '<div id="yk-plants" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">🌿 阳宅风水植物</h3>';
  html += '<h4 style="color:var(--jade);font-size:14px">吉祥植物</h4>';
  kb.plants.lucky.forEach(function(p) {
    html += '<div style="background:rgba(76,175,80,0.06);padding:8px 12px;border-radius:6px;margin-bottom:4px;font-size:13px;color:var(--paper2)"><strong style="color:var(--paper)">' + p.name + '</strong>（' + p.element + '）→ ' + p.effect + ' | 摆放：' + p.placement + '</div>';
  });
  html += '<h4 style="color:var(--cinn2);font-size:14px;margin-top:12px">化煞植物</h4>';
  kb.plants.sha_plants.forEach(function(p) {
    html += '<div style="background:rgba(244,67,54,0.06);padding:8px 12px;border-radius:6px;margin-bottom:4px;font-size:13px;color:var(--paper2)"><strong style="color:var(--paper)">' + p.name + '</strong> → ' + p.effect + ' | ' + p.placement + '</div>';
  });
  html += '<h4 style="color:var(--paper);font-size:14px;margin-top:12px">⚠️ 禁忌</h4>';
  kb.plants.taboo.forEach(function(t) { html += '<p style="margin:3px 0;font-size:12px;color:var(--cinn2)">• ' + t + '</p>'; });
  html += '</div>';
  
  // 楼层选择
  html += '<div id="yk-louceng" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">🏢 楼层五行选择</h3>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:rgba(201,168,76,0.15)"><th style="padding:8px;color:var(--gold)">五行命</th><th style="padding:8px;color:var(--gold)">最佳楼层</th><th style="padding:8px;color:var(--gold)">避忌楼层</th></tr></thead><tbody>';
  kb.louceng.table.forEach(function(r) {
    html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:6px;color:var(--paper)">' + r.element + '</td><td style="padding:6px;color:var(--jade);font-size:11px">' + r.best + '</td><td style="padding:6px;color:var(--cinn2);font-size:11px">' + r.avoid + '</td></tr>';
  });
  html += '</tbody></table></div></div>';
  
  // 择日法
  html += '<div id="yk-zeri" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">📅 阳宅择日法</h3>';
  kb.zeri.rules.forEach(function(r) {
    html += '<div style="background:rgba(156,39,176,0.06);padding:10px;border-radius:8px;margin-bottom:6px">';
    html += '<strong style="color:var(--paper)">' + r.event + '</strong><br><span style="font-size:12px;color:var(--paper2)">原则：' + r.principle + '</span><br><span style="font-size:11px;color:var(--gold)">💡 ' + r.note + '</span>';
    html += '</div>';
  });
  html += '</div>';
  
  // 经典典籍
  html += '<div id="yk-classics" style="margin-bottom:30px"><h3 style="color:var(--gold);border-bottom:1px solid rgba(201,168,76,0.3);padding-bottom:8px">📚 阳宅经典典籍</h3>';
  kb.classics.forEach(function(c) {
    html += '<div style="background:rgba(201,168,76,0.06);padding:10px;border-radius:8px;margin-bottom:6px">';
    html += '<strong style="color:var(--paper)">' + c.title + '</strong> <span style="font-size:12px;color:var(--paper2)">— ' + c.author + '</span><br><span style="font-size:12px;color:var(--paper2)">' + c.content + '</span><br><span style="font-size:11px;color:var(--gold)">要点：' + c.key_point + '</span>';
    html += '</div>';
  });
  html += '</div>';
  
  html += '</div>';
  showModal('🏠 阳宅风水全量知识库', html);
}

function showWisdom(idx) {
  let el = document.getElementById('dwText');
  let src = document.getElementById('dwSource');
  if (!el || !src) return;
  let q = wisdomQuotes[idx % wisdomQuotes.length];
  el.textContent = q.text;
  src.textContent = '—— ' + q.source;
}
function initDailyWisdom() { dwIdx = new Date().getDate() % wisdomQuotes.length; showWisdom(dwIdx); }
function prevWisdom() { dwIdx = (dwIdx - 1 + wisdomQuotes.length) % wisdomQuotes.length; showWisdom(dwIdx); }
function nextWisdom() { dwIdx = (dwIdx + 1) % wisdomQuotes.length; showWisdom(dwIdx); }
function shuffleWisdom() { dwIdx = Math.floor((Date.now() / 1000) % wisdomQuotes.length); showWisdom(dwIdx); }

// ═══ 手印切换 ══════════════════════════════════════
function switchMudra(btn, type) {
  document.querySelectorAll('.mudra-tab').forEach(function(t) { t.classList.remove('active'); });
  btn.classList.add('active');
  let dao = document.getElementById('mudraDao');
  let buddha = document.getElementById('mudraBuddha');
  if (dao) dao.style.display = type === 'dao' ? 'block' : 'none';
  if (buddha) buddha.style.display = type === 'buddha' ? 'block' : 'none';
}

function closeKnowledgeDetail() {
  hideKnowledgeDetail();
}

