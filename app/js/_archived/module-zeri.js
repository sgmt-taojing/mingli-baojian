      (s3Bad.length > 0 ? '；凶神' + s3Bad.join('、') + '不利' : '；无重凶神') +
      '。' + (zsHuangdao ? '黄道' : '黑道') + '日，值神' + zs;
    
    // -- 第4层：职业匹配度（15分） --
    var careerResult = _scoreCareer(dayGZ, userInfo.career, ys);
    scores.l4 = careerResult.score;
    details.l4 = careerResult.detail;
    
    // -- 第5层：方位考量（10分） --
    var cityInfo = _getCityDirection(userInfo.city);
    var s5Score = 7;
    var s5Detail = '';
    var shaInfo = CHONGSHA_DETAIL[DI_ZHI[dayGZ.zhi]] || {chong:'?', sha:'?'};
    
    if (cityInfo) {
      s5Detail = '所在地' + (userInfo.city || '未知') + '位于' + cityInfo.direction + '方（五行' + cityInfo.wuxing + '），';
      if (shaInfo.sha === cityInfo.shaConflict) {
        s5Score -= 3;
        s5Detail += '当日煞' + shaInfo.sha + '，与所在地方位相冲，不宜出行';
      } else {
        s5Score += 2;
        s5Detail += '当日煞' + shaInfo.sha + '，不影响' + cityInfo.direction + '方出行';
      }
    } else {
      s5Detail = '所在地未知，方位评分默认';
      // 即使不知道城市，也显示煞方信息
      s5Detail += '；当日煞' + shaInfo.sha + (shaInfo.sha === '北' ? '（不宜北行）' : shaInfo.sha === '东' ? '（不宜东行）' : shaInfo.sha === '西' ? '（不宜西行）' : '（不宜南行）');
    }
    scores.l5 = Math.max(3, Math.min(10, s5Score));
    details.l5 = s5Detail;
    
    // -- 第6层：节气与流月（5分） --
    var jieqiResult = _scoreJieqi(d, eventConfig);
    scores.l6 = jieqiResult.score;
    details.l6 = jieqiResult.detail;
    
    // -- 第7层：三元九运维度（5分） --
    var syScore = 0;
    var syDetail = '';
    var _curYY = getCurrentYuanYun(d.getFullYear());
    var _yunWx = _curYY.wuxing;
    var _dayGanEle = ELE[TIAN_GAN[dayGZ.gan]] || '木';
    var _dayZhiEle = {子:'水',丑:'土',寅:'木',卯:'木',辰:'土',巳:'火',午:'火',未:'土',申:'金',酉:'金',戌:'土',亥:'水'}[DI_ZHI[dayGZ.zhi]] || '土';
    // 日干支五行属火/土：运星同气或相生，+5
    if (_dayGanEle === _yunWx || _dayZhiEle === _yunWx) { syScore = 5; syDetail = '日干支与运星同气'; }
    else if (_dayGanEle === '火' || _dayGanEle === '土' || _dayZhiEle === '火' || _dayZhiEle === '土') { syScore = 5; syDetail = '日干支五行与运星相生'; }
    // 日干支五行属水：水克运星火，-3
    else if (_dayGanEle === '水' || _dayZhiEle === '水') { syScore = -3; syDetail = '日干支五行克运星'; }
    else { syScore = 0; syDetail = '日干支五行与运星关系间接'; }
    scores.l7 = syScore;
    details.l7 = syDetail;
    
    // === 总分 ===
    var totalScore = scores.l1 + scores.l2 + scores.l3 + scores.l4 + scores.l5 + scores.l6 + scores.l7;
    
    // === 等级判定 ===
    var level = '';
    if (totalScore >= 90) level = '大吉';
    else if (totalScore >= 75) level = '吉';
    else if (totalScore >= 60) level = '平';
    else if (totalScore >= 45) level = '小凶';
    else level = '凶';
    
    var candidate = {
      date: new Date(d),
      ganzhi: TIAN_GAN[dayGZ.gan] + DI_ZHI[dayGZ.zhi],
      totalScore: totalScore,
      level: level,
      scores: scores,
      details: details,
      jianchu: jcName,
      zhishen: zs,
      isHuangdao: zsHuangdao,
      jishenList: jsList,
      xiongshenList: xsList,
      chongsha: shaInfo,
      yearGZ: yearGZ,
      monthGZ: monthGZ,
      dayGZ: dayGZ,
      jieqiInfo: jieqiResult
    };
    
    result.candidates.push(candidate);
  }
  
  // 排序
  result.candidates.sort(function(a, b) {
    return b.totalScore - a.totalScore;
  });
  
  // 推荐日期前3
  result.topCandidates = result.candidates.slice(0, 3);
  // 避免日期
  result.avoidDates = result.candidates.filter(function(c) {
    return c.totalScore < 45;
  }).slice(0, 3);
  
  // 生成推演报告
  result.report = _generatePrecisionReport(result, ys, baziData, userInfo);
  
  return result;
}

// --- 生成推演报告 ---
function _generatePrecisionReport(zeriResult, ys, baziData, userInfo) {
  var top = zeriResult.topCandidates;
  var avoid = zeriResult.avoidDates;
  var purpose = zeriResult.purpose;
  
  var weekDays = ['周日','周一','周二','周三','周四','周五','周六'];
  
  var html = '<div class="precision-report">';
  html += '<div class="pr-header">🎯 精准择日报告</div>';
  
  // 缘主信息
  var bzStr = baziData.pillars ? 
    baziData.pillars[0].stem + baziData.pillars[0].branch + '年 ' +
    baziData.pillars[1].stem + baziData.pillars[1].branch + '月 ' +
    baziData.pillars[2].stem + baziData.pillars[2].branch + '日 ' +
    baziData.pillars[3].stem + baziData.pillars[3].branch + '时'
    : ys.dayStem + ys.dayEle + '日主';
  
  html += '<div class="pr-meta">';
  html += '<span>缘主：' + (userInfo.name || '善信') + '</span>';
  html += '<span>八字：' + bzStr + '</span>';
  html += '<span>事项：' + purpose + '</span>';
  if (userInfo.career) html += '<span>职业：' + userInfo.career + '</span>';
  if (userInfo.city) html += '<span>所在地：' + userInfo.city + '</span>';
  html += '</div>';
  
  // 最佳推荐
  if (top.length > 0) {
    var best = top[0];
    var d = best.date;
    var dateStr = d.getFullYear() + '年' + (d.getMonth()+1) + '月' + d.getDate() + '日（' + weekDays[d.getDay()] + '）';
    
    html += '<div class="pr-best">';
    html += '<div class="pr-best-label">🏆 最佳推荐</div>';
    html += '<div class="pr-best-date">' + dateStr + '</div>';
    html += '<div class="pr-best-ganzhi">' + best.ganzhi + '日</div>';
    html += '<div class="pr-best-score">综合评分：<span class="pr-score-' + best.level + '">' + best.totalScore + '分/' + best.level + '</span></div>';
    html += '</div>';
    
    // 推演模型
    html += '<div class="pr-layers">';
    html += '<div class="pr-layer">├─ <b>第1层 八字用神：</b>' + best.details.l1 + ' （+' + best.scores.l1 + '/30）</div>';
    html += '<div class="pr-layer">├─ <b>第2层 建除事项：</b>' + best.details.l2 + ' （+' + best.scores.l2 + '/20）</div>';
    html += '<div class="pr-layer">├─ <b>第3层 吉凶神：</b>' + best.details.l3 + ' （+' + best.scores.l3 + '/20）</div>';
    html += '<div class="pr-layer">├─ <b>第4层 职业匹配：</b>' + best.details.l4 + ' （+' + best.scores.l4 + '/15）</div>';
    html += '<div class="pr-layer">├─ <b>第5层 方位：</b>' + best.details.l5 + ' （+' + best.scores.l5 + '/10）</div>';
    html += '<div class="pr-layer">├─ <b>第6层 节气：</b>' + best.details.l6 + ' （+' + best.scores.l6 + '/5）</div>';
    
    // 总评
    var zongping = _generateZongping(best, ys, userInfo, purpose);
    html += '<div class="pr-layer pr-zongping">└─ <b>总评：</b>' + zongping + '</div>';
    html += '</div>';
  }
  
  // 备选日期
  if (top.length > 1) {
    html += '<div class="pr-alt-section">';
    html += '<div class="pr-alt-title">📅 备选日期</div>';
    for (var i = 1; i < top.length; i++) {
      var alt = top[i];
      var altD = alt.date;
      html += '<div class="pr-alt-item">';
      html += '<span class="pr-alt-rank">' + (i+1) + '. </span>';
      html += '<span class="pr-alt-date">' + (altD.getMonth()+1) + '月' + altD.getDate() + '日</span>';
      html += '<span class="pr-alt-score">' + alt.totalScore + '分/' + alt.level + '</span>';
      html += '<span class="pr-alt-gz">' + alt.ganzhi + '日</span>';
      html += '</div>';
    }
    html += '</div>';
  }
  
  // 避免日期
  if (avoid.length > 0) {
    html += '<div class="pr-avoid-section">';
    html += '<div class="pr-avoid-title">⚠️ 避免日期</div>';
    for (var i = 0; i < avoid.length; i++) {
      var av = avoid[i];
      var avD = av.date;
      html += '<div class="pr-avoid-item">';
      html += '<span>' + (avD.getMonth()+1) + '月' + avD.getDate() + '日</span>';
      html += '<span class="pr-avoid-score">' + av.totalScore + '分/' + av.level + '</span>';
      html += '<span>' + av.ganzhi + '日</span>';
      html += '<span style="opacity:.6">' + (av.xiongshenList.length > 0 ? av.xiongshenList.slice(0,2).join('、') + '忌' : '') + '</span>';
      html += '</div>';
    }
    html += '</div>';
  }
  
  // AI建议区域
  html += '<div class="pr-ai-section" id="precZeriAiAdvice">';
  html += '<div class="pr-ai-title">💡 综合建议</div>';
  html += '<div class="pr-ai-content" id="precZeriAiText">正在生成个性化建议...</div>';
  html += '</div>';
  
  html += '</div>';
  
  // 异步生成AI建议
  setTimeout(function() {
    _generateAiAdvice(userInfo, purpose, zeriResult, ys);
  }, 100);
  
  return html;
}

// --- 生成总评 ---
function _generateZongping(best, ys, userInfo, purpose) {
  var parts = [];
  var dayWxStrength = _getDayWuxingStrength(best.dayGZ);
  
  // 八字维度
  var rel = _wuxingRelation(ys.dayEle, dayWxStrength.ganWuxing);
  if (rel === '被生') {
    parts.push(dayWxStrength.ganWuxing + '生' + ys.dayEle + '，用神得力');
  } else if (rel === '相同') {
    parts.push('比劫帮身，' + (ys.isStrong ? '需注意过旺' : '力量增强'));
  } else if (rel === '被克') {
    parts.push('日干克日主，用神受制');
  }
  
  // 建除
  parts.push('建除' + best.jianchu + '日宜' + purpose);
  
  // 吉神
  if (best.jishenList && best.jishenList.length > 0) {
    parts.push(best.jishenList.slice(0, 3).join('+') + '助');
  }
  
  // 职业
  if (userInfo.career && CAREER_WUXING[userInfo.career]) {
    parts.push(userInfo.career + '者得' + CAREER_WUXING[userInfo.career] + '气相助');
  }
  
  return parts.join('，') + '。择此日' + purpose + '大吉。';
}

// --- AI建议生成 ---
function _generateAiAdvice(userInfo, purpose, zeriResult, ys) {
  var el = document.getElementById('precZeriAiText');
  if (!el) return;
  
  var best = zeriResult.topCandidates.length > 0 ? zeriResult.topCandidates[0] : null;
  if (!best) {
    el.innerHTML = '暂无推荐日期，请调整查询参数。';
    return;
  }
  
  // 尝试调用AI
  if (typeof callYIDAO === 'function') {
    var prompt = '你是一位精通传统择日学的大师（参考《协纪辨方书》《择吉汇要》）。' +
      '缘主八字日主' + ys.dayStem + ys.dayEle + '（' + ys.strengthLevel + '），喜' + ys.xiEle + '忌' + ys.jiEle + '。' +
      '推荐日期为' + best.ganzhi + '日，综合评分' + best.totalScore + '分/' + best.level + '。' +
      '事项为' + purpose + '。' +
      '请给出大白话建议（100字内），包括：为什么这天好、当天宜什么时辰、方位注意事项、催旺小方法。';
    
    try {
      callYIDAO(prompt).then(function(reply) {
        if (el) el.innerHTML = reply || _getFallbackAdvice(userInfo, purpose, best, ys);
      }).catch(function() {
        if (el) el.innerHTML = _getFallbackAdvice(userInfo, purpose, best, ys);
      });
    } catch(e) {
      el.innerHTML = _getFallbackAdvice(userInfo, purpose, best, ys);
    }
  } else {
    el.innerHTML = _getFallbackAdvice(userInfo, purpose, best, ys);
  }
}

// --- 本地降级建议 ---
function _getFallbackAdvice(userInfo, purpose, best, ys) {
  var dayWxStrength = _getDayWuxingStrength(best.dayGZ);
  var advice = '';
  
  // 基于八字+事项的综合建议
  advice += '<p>基于您的八字（' + ys.dayStem + ys.dayEle + '日主' + ys.strengthLevel + '）';
  if (userInfo.career) advice += '和' + userInfo.career + '职业';
  advice += '，' + best.ganzhi + '日为' + purpose + '之吉选。';
  
  // 为什么好
  var rel = _wuxingRelation(ys.dayEle, dayWxStrength.ganWuxing);
  if (rel === '被生') {
    advice += '此日' + dayWxStrength.ganWuxing + '旺生您日主' + ys.dayEle + '，用神得力，气场和谐。';
  } else if (rel === '相同') {
    advice += '此日五行与您日主相同，能量共振。';
  }
  advice += '</p>';
  
  // 时辰建议（精确到小时）
  var goodHour = _suggestGoodHour(best, ys);
  advice += goodHour;
  
  // 方位建议
  var cityInfo = _getCityDirection(userInfo.city);
  if (cityInfo) {
    advice += '<p>🧭 <b>方位建议：</b>出发面向' + cityInfo.direction + '方，避免' + (best.chongsha ? best.chongsha.sha : '正南') + '方。</p>';
  }
  
  // 催旺方法
  advice += '<p>🍀 <b>催旺小法：</b>';
  var cwangTips = {
    '木': '当日宜穿绿色衣服，在家中东方放四棵富贵竹。',
    '火': '当日宜穿红色衣服，在南方点一盏灯或蜡烛。',
    '土': '当日宜穿黄色衣服，在家中中央位置放黄水晶。',
    '金': '当日宜穿白色衣服，在家中西方放金属物品（铜器/硬币）。',
    '水': '当日宜穿蓝色/黑色衣服，在北方放一杯水或鱼缸。'
  };
  advice += (cwangTips[dayWxStrength.ganWuxing] || cwangTips['木']) + '</p>';
  
  // 大白话总结
  advice += '<p>📝 <b>大白话：</b>这天' + dayWxStrength.ganWuxing + '气旺，对您的' + ys.dayEle + '日主有生助之力，' + (userInfo.career || '行事') + '顺遂。建除' + best.jianchu + '日本来就宜' + purpose + '，加上吉神' + (best.jishenList && best.jishenList.length > 0 ? best.jishenList.slice(0, 3).join('、') : '庇佑') + '，是个好日子。</p>';
  
  return advice;
}

// --- 推算当日吉时（精确到小时） ---
function _suggestGoodHour(best, ys) {
  var dayGan = best.dayGZ.gan;
  var dayZhi = best.dayGZ.zhi;
  var hourNames = ['子时(23-1)','丑时(1-3)','寅时(3-5)','卯时(5-7)','辰时(7-9)','巳时(9-11)','午时(11-13)','未时(13-15)','申时(15-17)','酉时(17-19)','戌时(19-21)','亥时(21-23)'];
  var hourTimeRanges = ['23:00-01:00','01:00-03:00','03:00-05:00','05:00-07:00','07:00-09:00','09:00-11:00','11:00-13:00','13:00-15:00','15:00-17:00','17:00-19:00','19:00-21:00','21:00-23:00'];
  // 时支五行
  var zhiEle = ['水','土','木','木','土','火','火','土','金','金','土','水'];
  // 时干五行（五鼠遁）
  var dayGanIdx = (typeof dayGan === 'number') ? dayGan : 0;
  var hourStemStart = [0,2,4,6,8,10][dayGanIdx % 5]; // 甲己起甲子
  
  // 黄黑道吉时
  var d = dayGanIdx % 5;
  var hourHuangdao = [
    [0,1,4,5,10],  // 甲己日
    [2,3,4,5,10],  // 乙庚日
    [0,1,6,7,10],  // 丙辛日
    [0,1,2,3,8],   // 丁壬日
    [0,1,4,5,6]    // 戊癸日
  ];
  var goodHours = hourHuangdao[d] || [4,5,6];
  
  // 日支冲时支
  var chongMap = {0:6, 1:7, 2:8, 3:9, 4:10, 5:11, 6:0, 7:1, 8:2, 9:3, 10:4, 11:5};
  var dayZhiIdx = (typeof dayZhi === 'number') ? dayZhi : 0;
  var chongHour = chongMap[dayZhiIdx];
  
  // 逐时辰评分
  var hourScores = [];
  for (var h = 0; h < 12; h++) {
    var score = 50; // 基础分
    var reasons = [];
    
    // 1. 黄黑道（+/-15分）
    if (goodHours.indexOf(h) >= 0) {
      score += 15;
      reasons.push('黄道吉时');
    } else {
      score -= 10;
      reasons.push('黑道时辰');
    }
    
    // 2. 时支五行与喜用神（+/-20分）
    var hEle = zhiEle[h];
    if (hEle === ys.yongshenEle) {
      score += 20;
      reasons.push('时支' + hEle + '为喜用神');
    } else if (hEle === ys.dayEle) {
      if (ys.isStrong) {
        score -= 5;
        reasons.push('时支同五行，身强不喜');
      } else {
        score += 8;
        reasons.push('时支同五行，帮扶日主');
      }
    } else if (_wuxingRelation(ys.dayEle, hEle) === '被克') {
      score -= 15;
      reasons.push('时支' + hEle + '克日主');
    }
    
    // 3. 日支冲时支（-20分）
    if (h === chongHour) {
      score -= 20;
      reasons.push('日时相冲');
    }
    
    // 4. 上午/下午调整
    if (h >= 4 && h <= 7) { // 辰巳午未
      score += 5;
      reasons.push('上午阳气旺');
    } else if (h >= 10) { // 戌亥
      score -= 5;
      reasons.push('夜间阴气重');
    }
    
    hourScores.push({
      hour: h,
      name: hourNames[h],
      time: hourTimeRanges[h],
      score: Math.max(0, Math.min(100, score)),
      reasons: reasons
    });
  }
  
  // 排序取前3
  hourScores.sort(function(a,b) { return b.score - a.score; });
  var top3 = hourScores.slice(0, 3);
  
  // 生成详细建议
  var result = '<div style="margin-top:12px">';
  result += '<div style="font-size:12px;color:var(--gold);margin-bottom:8px">🕐 吉时推荐（精确到小时）</div>';
  result += '<table style="width:100%;font-size:11px">';
  for (var t = 0; t < top3.length; t++) {
    var hs = top3[t];
    var color = hs.score >= 75 ? '#27ae60' : hs.score >= 55 ? '#f39c12' : '#e74c3c';
    var label = hs.score >= 75 ? '★优选' : hs.score >= 55 ? '可用' : '慎选';
    result += '<tr style="border-bottom:1px solid rgba(201,168,76,0.08)">';
    result += '<td style="padding:4px;width:90px;color:' + color + '">' + hs.name + '</td>';
    result += '<td style="padding:4px;width:80px;color:var(--paper3);font-size:10px">' + hs.time + '</td>';
    result += '<td style="padding:4px;width:40px"><span style="color:' + color + '">' + label + '</span></td>';
    result += '<td style="padding:4px;color:var(--paper2);font-size:10px">' + hs.reasons.join('、') + '</td>';
    result += '</tr>';
  }
  result += '</table>';
  
  // 避开时辰
  var worst = hourScores.filter(function(hs) { return hs.score < 40; });
  if (worst.length > 0) {
    result += '<div style="margin-top:6px;font-size:11px;color:#e74c3c">⚠️ 避开：';
    for (var w = 0; w < worst.length; w++) {
      result += worst[w].name + '(' + worst[w].reasons.join('、') + ')';
      if (w < worst.length - 1) result += '；';
    }
    result += '</div>';
  }
  result += '</div>';
  
  return result;
}

// --- 对外调用函数（按钮触发） ---
function runPrecisionZeRi() {
  var userInfo = {
    name: document.getElementById('precZeriName')?.value || '',
    birthDate: document.getElementById('precZeriBirth')?.value || '',
    birthHour: document.getElementById('precZeriHour')?.value || '0',
    sex: document.getElementById('precZeriSex')?.value || 'male',
    career: document.getElementById('precZeriCareer')?.value || '',
    city: document.getElementById('precZeriBirthplace')?.value || '',
    residence: document.getElementById('precZeriResidence')?.value || '',
    startDate: document.getElementById('precZeriStartDate')?.value || '',
    endDate: document.getElementById('precZeriEndDate')?.value || ''
  };
  
  var purpose = document.getElementById('precZeriPurpose')?.value || '';
  
  if (!userInfo.birthDate) {
    showToast('请输入出生日期');
    return;
  }
  if (!purpose) {
    showToast('请选择择日事项');
    return;
  }
  
  playSound('cast');
  
  var resultEl = document.getElementById('precZeriResult');
  if (resultEl) {
    resultEl.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>正在推演八字择日...</p></div>';
    resultEl.style.display = 'block';
  }
  
  // 延迟渲染（给UI时间更新）
  setTimeout(function() {
    try {
      var result = precisionZeRi(userInfo, purpose);
      if (resultEl) {
        resultEl.innerHTML = result.report;
        resultEl.style.display = 'block';
        playSound('success');
        // 滚动到结果
        resultEl.scrollIntoView({behavior: 'smooth', block: 'start'});
        // === 化解方案注入 ===
        var _zrBirth = userInfo.birthDate ? userInfo.birthDate.split('-').map(Number) : null;
        var _zrHour = parseInt(userInfo.birthHour) || 12;
        if (_zrBirth && _zrBirth.length === 3) {
          appendHuajieToResult('precZeriResult', _zrBirth[0], _zrBirth[1], _zrBirth[2], _zrHour, userInfo.sex, userInfo.name);
        }
        // ═══ 三元九运择日维度 ═══
        try {
          var _syZr = _generateSanyuanJiuyunBlock('zeri', {
            dayStem: userInfo.dayStem || '甲',
            dayEle: userInfo.dayStem ? (ELE[userInfo.dayStem] || '木') : '木',
            currentYear: new Date().getFullYear()
          });
          resultEl.innerHTML += _syZr;
        } catch(e) { console.warn('[三元九运择日分析块失败]', e.message); }
      }
    } catch(e) {
      if (resultEl) {
        resultEl.innerHTML = '<div style="color:#e74c3c;padding:12px">择日推演出错：' + e.message + '</div>';
      }
    }
  }, 200);
}

// 导出到window
window.precisionZeRi = precisionZeRi;
window.runPrecisionZeRi = runPrecisionZeRi;

// ================================================================
// ===== 年度风水测评模型 (FENGSHUI_YEARLY_MODEL) =====
// ================================================================

// 九宫飞星年星表 - 动态生成1900-2100年
var YEARLY_FLYING_STARS = {};
(function() {
  for (var yr = 1900; yr <= 2100; yr++) {
    var centerStar = _getYearFlyingStar(yr);
    var positions = _getStarPosition(centerStar);
    YEARLY_FLYING_STARS[yr] = {
      center: positions['中'],
      '西北': positions['西北'],
      '西': positions['西'],
      '东北': positions['东北'],
      '南': positions['南'],
      '北': positions['北'],
      '西南': positions['西南'],
      '东': positions['东'],
      '东南': positions['东南']
    };
  }
})();

// 星名映射
var STAR_NAMES = {
  1: '一白贪狼星', 2: '二黑巨门星', 3: '三碧禄存星', 4: '四绿文曲星',
  5: '五黄廉贞星', 6: '六白武曲星', 7: '七赤破军星', 8: '八白左辅星', 9: '九紫右弼星'
};

// 流年凶方位（需化解）1900-2100
var YEARLY_NEGATIVE_DIRECTIONS = {};
(function() {
  for (var yr = 2024; yr <= 2030; yr++) {
    var stars = YEARLY_FLYING_STARS[yr];
    var neg = {};
    // 二黑星
    for (var dir in stars) {
      if (stars[dir] === 2) {
        neg['二黑星'] = { position: dir, impact: '病符，影响健康', remedy: '挂铜葫芦或六帝钱', starNum: 2 };
      }
      if (stars[dir] === 5) {
        neg['五黄星'] = { position: dir, impact: '灾煞，主意外破财', remedy: '放金属风铃或铜制物品', starNum: 5 };
      }
      if (stars[dir] === 3) {
        neg['三碧星'] = { position: dir, impact: '是非口舌', remedy: '放红色物品或火属性化解', starNum: 3 };
      }
      if (stars[dir] === 7) {
        neg['七赤星'] = { position: dir, impact: '贼盗破财', remedy: '放蓝色/黑色物品化解', starNum: 7 };
      }
    }
    YEARLY_NEGATIVE_DIRECTIONS[yr] = neg;
  }
})();

// 流年吉方位（宜催旺）1900-2100
var YEARLY_POSITIVE_DIRECTIONS = {};
(function() {
  for (var yr = 2024; yr <= 2030; yr++) {
    var stars = YEARLY_FLYING_STARS[yr];
    var pos = {};
    for (var dir in stars) {
      if (stars[dir] === 8) {
        pos['八白星'] = { position: dir, impact: '当旺财星', enhance: '放水晶/黄玉/金属物品催财', starNum: 8 };
      }
      if (stars[dir] === 9) {
        pos['九紫星'] = { position: dir, impact: '喜庆姻缘', enhance: '放红色/紫色花卉或红色地毯', starNum: 9 };
      }
      if (stars[dir] === 1) {
        pos['一白星'] = { position: dir, impact: '桃花人缘', enhance: '放水养植物或金属物品', starNum: 1 };
      }
      if (stars[dir] === 4) {
        pos['四绿星'] = { position: dir, impact: '文昌学业', enhance: '放四支毛笔或绿色植物', starNum: 4 };
      }
      if (stars[dir] === 6) {
        pos['六白星'] = { position: dir, impact: '贵人升迁', enhance: '放金属物品或黄色水晶', starNum: 6 };
      }
    }
    YEARLY_POSITIVE_DIRECTIONS[yr] = pos;
  }
})();

// 吉祥物数据库（AUSPICIOUS_ITEMS）
var AUSPICIOUS_ITEMS = {
  // 财运类
  '水晶洞': { wuxing: '土', function: '聚财纳气', placement: '财位（当年八白星方位）', timing: '年初摆放', disposal: '年底用粗盐净化后可继续使用', price_range: '200-2000元', category: '财运' },
  '貔貅': { wuxing: '金', function: '招财辟邪', placement: '朝向大门或窗外', timing: '开光后摆放', disposal: '每年用茶油擦拭养护', price_range: '100-5000元', category: '财运' },
  '金蟾': { wuxing: '金', function: '招财', placement: '面朝室内', timing: '年初摆放', disposal: '年底用清水冲洗', price_range: '50-1000元', category: '财运' },
  '聚宝盆': { wuxing: '土', function: '聚财守财', placement: '财位靠墙处', timing: '立春后摆放', disposal: '常年使用，每年盐洗净化', price_range: '100-800元', category: '财运' },
  '黄水晶球': { wuxing: '土', function: '催财旺运', placement: '财位正中', timing: '年初摆放', disposal: '常年使用，月光净化', price_range: '80-800元', category: '财运' },
  // 健康类
  '葫芦': { wuxing: '木', function: '化病纳福', placement: '病符方（二黑星方位）', timing: '发现健康问题时摆放', disposal: '年底换新，旧的挂窗外3天后丢弃', price_range: '20-200元', category: '健康' },
  '铜葫芦': { wuxing: '金', function: '化病化煞', placement: '二黑/五黄方位', timing: '立春后摆放', disposal: '每年冬至后更换', price_range: '30-300元', category: '健康' },
  '六帝钱': { wuxing: '金', function: '化煞辟邪招财', placement: '门槛/病符方/五黄方', timing: '年初摆放', disposal: '长期使用，每年盐洗', price_range: '50-500元', category: '辟邪' },
  // 文昌类
  '文昌塔': { wuxing: '木', function: '助学业务', placement: '文昌位（四绿星方位）', timing: '开学/考试前摆放', disposal: '长期使用无需更换', price_range: '50-500元', category: '文昌' },
  '四枝毛笔': { wuxing: '木', function: '催文昌学业', placement: '书桌东方或东南方', timing: '每年开学前更换', disposal: '每年更换新的', price_range: '20-100元', category: '文昌' },
  '绿植': { wuxing: '木', function: '催旺文昌生机', placement: '文昌位/生气位', timing: '春季摆放', disposal: '枯萎即换', price_range: '20-200元', category: '文昌' },
  // 桃花类
  '粉晶': { wuxing: '土', function: '催桃花姻缘', placement: '桃花位（一白星方位）', timing: '情人节/七夕摆放', disposal: '月光净化', price_range: '30-300元', category: '桃花' },
  '水培植物': { wuxing: '水', function: '催人缘桃花', placement: '桃花位近窗处', timing: '常年摆放', disposal: '定期更换保持鲜活', price_range: '20-100元', category: '桃花' },
  // 辟邪类
  '八卦镜': { wuxing: '金', function: '化煞辟邪', placement: '门楣/窗户外', timing: '发现煞气时悬挂', disposal: '长期使用，破损即换', price_range: '20-100元', category: '辟邪' },
  '五帝钱': { wuxing: '金', function: '化煞辟邪招财', placement: '门槛/财位', timing: '年初摆放', disposal: '长期使用', price_range: '50-500元', category: '辟邪' },
  '泰山石': { wuxing: '土', function: '镇宅补缺角', placement: '缺角方或煞方靠墙', timing: '随时摆放', disposal: '长期使用无需更换', price_range: '50-300元', category: '辟邪' },
  '黑曜石': { wuxing: '水', function: '吸煞辟邪', placement: '凶位/大门入口', timing: '随时摆放', disposal: '每月日光净化', price_range: '30-200元', category: '辟邪' },
  // 太岁类
  '太岁符': { wuxing: '火', function: '化太岁保平安', placement: '太岁方/随身携带', timing: '立春后请符', disposal: '年底（腊月廿四）焚化送走', price_range: '随喜', category: '太岁' },
  '化太岁锦囊': { wuxing: '火', function: '化解太岁不利', placement: '床头/随身', timing: '立春后佩戴', disposal: '年底焚化或沉入流动水中', price_range: '50-200元', category: '太岁' },
  // 镇宅类
  '石狮子': { wuxing: '金', function: '镇宅辟邪', placement: '门口两侧', timing: '搬家时摆放', disposal: '长期使用', price_range: '200-2000元', category: '镇宅' },
  '麒麟': { wuxing: '土', function: '镇宅催贵', placement: '客厅明堂', timing: '年初摆放', disposal: '长期使用', price_range: '100-1000元', category: '镇宅' },
  '龙龟': { wuxing: '水', function: '化三煞招财', placement: '流年三煞方', timing: '每年立春调整方位', disposal: '长期使用', price_range: '80-500元', category: '镇宅' }
};

// 按类别索引吉祥物
function _getItemsByCategory(category) {
  var result = [];
  for (var name in AUSPICIOUS_ITEMS) {
    if (AUSPICIOUS_ITEMS[name].category === category) {
      var item = AUSPICIOUS_ITEMS[name];
      item.name = name;
      result.push(item);
    }
  }
  return result;
}

// 按飞星推荐吉祥物
function _getItemsForStar(starNum) {
  var items = [];
  if (starNum === 8) {
    items = ['黄水晶球', '聚宝盆', '貔貅', '金蟾', '水晶洞'];
  } else if (starNum === 9) {
    items = ['粉晶', '红玛瑙', '紫水晶'];
  } else if (starNum === 1) {
    items = ['水培植物', '粉晶', '蓝水晶'];
  } else if (starNum === 4) {
    items = ['文昌塔', '四枝毛笔', '绿植'];
  } else if (starNum === 6) {
    items = ['黄水晶球', '铜马', '金属摆件'];
  } else if (starNum === 2) {
    items = ['铜葫芦', '六帝钱', '金属风铃'];
  } else if (starNum === 5) {
    items = ['六帝钱', '铜葫芦', '金属风铃'];
  } else if (starNum === 3) {
    items = ['红玛瑙', '紫水晶', '红色中国结'];
  } else if (starNum === 7) {
    items = ['蓝水晶', '黑曜石', '水族箱'];
  }
  return items.map(function(name) {
    var item = AUSPICIOUS_ITEMS[name];
    if (item) { item.name = name; return item; }
    return null;
  }).filter(Boolean);
}

// 生成全年风水调整时间表
function _generateFengshuiTimeline(targetYear) {
  return [
    { time: '立春(2月3-5日)', action: '新年风水布局启动', detail: '更换太岁符（如犯太岁），调整流年吉祥物方位，清理旧年风水物品', priority: '高' },
    { time: '惊蛰(3月5-7日)', action: '春季催旺布局', detail: '在八白财星方位摆放催财物，在文昌位放文昌塔/毛笔', priority: '中' },
    { time: '清明(4月4-6日)', action: '祭祖+家居净化', detail: '清理家中旧物，在凶位撒粗盐净化，更换破损风水物品', priority: '中' },
    { time: '立夏(5月5-7日)', action: '夏季火气调整', detail: '九紫星方位催旺喜庆，三碧星方位加强红色化解', priority: '低' },
    { time: '端午(6月)', action: '辟邪强运', detail: '门口挂艾草/菖蒲，佩戴香囊，五黄/二黑方加强金属化解', priority: '中' },
    { time: '立秋(8月7-9日)', action: '秋季收气布局', detail: '检查吉祥物状态，清理枯萎植物，财位补充能量', priority: '中' },
    { time: '中秋(9月)', action: '拜月催桃花', detail: '一白桃花方位放粉晶/水培植物，九紫方放红色花卉', priority: '低' },
    { time: '立冬(11月7-8日)', action: '冬季藏气准备', detail: '开始准备年底吉祥物处置方案，检查太岁符状态', priority: '中' },
    { time: '冬至(12月21-23日)', action: '年终净化+吉祥物处置', detail: '铜葫芦/金属风铃等更换，旧太岁符准备腊月焚化，全屋粗盐净化', priority: '高' },
    { time: '腊月廿四(小年)', action: '旧太岁符焚化送走', detail: '将旧年太岁符在门外焚化，感谢太岁一年护佑，准备新年太岁符', priority: '高' }
  ];
}

// 生成上一年吉祥物处置方案
function _generateDisposalPlan(prevYear) {
  var prevStars = YEARLY_FLYING_STARS[prevYear];
  if (!prevStars) return [];
  var plan = [];
  // 根据上一年飞星方位推荐过的吉祥物，给出处置方法
  for (var dir in prevStars) {
    var starNum = prevStars[dir];
    var items = _getItemsForStar(starNum);
    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      plan.push({
        item: item.name,
        position: dir + '方',
        starName: STAR_NAMES[starNum] || (starNum + '星'),
        disposal: item.disposal,
        timing: '冬至至腊月廿四期间处置',
        category: item.category
      });
    }
  }
  // 太岁符单独处理
  plan.push({
    item: '太岁符',
    position: '太岁方',
    starName: '太岁',
    disposal: '腊月廿四焚化送走，感谢太岁护佑',
    timing: '腊月廿四(小年)',
    category: '太岁'
  });
  return plan;
}

// ===== 核心函数：年度风水测评报告 =====
function generateYearlyFengshuiReport(userYear, userSex, huxing, chaoxiang, louceng, buildYear, targetYear) {
  // 1. 计算命卦
  var mingGua = getMingGua(userYear, userSex);

  // 2. 计算目标年飞星盘
  var yearStar = _getYearFlyingStar(targetYear);
  var starPositions = _getStarPosition(yearStar);

  // 3. 分析凶方位
  var negativeAreas = [];
  var negDirs = YEARLY_NEGATIVE_DIRECTIONS[targetYear] || {};
  for (var key in negDirs) {
    var negInfo = negDirs[key];
    var recommendItems = _getItemsForStar(negInfo.starNum);
    negativeAreas.push({
      starName: key,
      starNum: negInfo.starNum,
      position: negInfo.position,
      impact: negInfo.impact,
      remedy: negInfo.remedy,
      items: recommendItems
    });
  }

  // 4. 分析吉方位
  var positiveAreas = [];
  var posDirs = YEARLY_POSITIVE_DIRECTIONS[targetYear] || {};
  for (var key2 in posDirs) {
    var posInfo = posDirs[key2];
    var enhanceItems = _getItemsForStar(posInfo.starNum);
    positiveAreas.push({
      starName: key2,
      starNum: posInfo.starNum,
      position: posInfo.position,
      impact: posInfo.impact,
      enhance: posInfo.enhance,
      items: enhanceItems
    });
  }

  // 5. 结合户型朝向判断哪些方位受影响
  var dirMap = { '北': 1, '南': 9, '东': 3, '西': 7, '东北': 8, '西北': 6, '东南': 4, '西南': 2 };
  var zhaiNum = dirMap[chaoxiang] || 1;
  var bazhai = _computeBazhai(zhaiNum);
  var xuankong = _xuankongBrief(buildYear, chaoxiang);

  // 分析各方位与户型关系
  var directionImpact = [];
  var allDirs = ['北', '南', '东', '西', '东南', '西南', '西北', '东北'];
  for (var d = 0; d < allDirs.length; d++) {
    var dirName = allDirs[d];
    var bzPos = bazhai[dirName] || '伏位';
    var flyingStar = starPositions[dirName] || 5;
    var isGood = (flyingStar === 8 || flyingStar === 9 || flyingStar === 1 || flyingStar === 4 || flyingStar === 6);
    var isBad = (flyingStar === 2 || flyingStar === 3 || flyingStar === 5 || flyingStar === 7);
    var bazhaiGood = (bzPos === '生气' || bzPos === '天医' || bzPos === '延年' || bzPos === '伏位');
    directionImpact.push({
      direction: dirName,
      bazhaiPosition: bzPos,
      flyingStar: flyingStar,
      starName: STAR_NAMES[flyingStar] || flyingStar + '星',
      isGood: isGood && bazhaiGood,
      isBad: isBad || !bazhaiGood,
      isDanger: isBad && !bazhaiGood,
      advice: isBad && !bazhaiGood ? '凶星叠凶位，重点化解' : isGood && bazhaiGood ? '吉星吉位，宜催旺' : '平位，常规布置'
    });
  }

  // 6. 生成吉祥物推荐
  var recommendations = [];
  // 凶方位化解吉祥物
  for (var n = 0; n < negativeAreas.length; n++) {
    var negArea = negativeAreas[n];
    for (var ni = 0; ni < negArea.items.length; ni++) {
      var item = negArea.items[ni];
      recommendations.push({
        item: item.name,
        purpose: '化解' + negArea.starName + '（' + negArea.impact + '）',
        placement: negArea.position + '方 - ' + item.placement,
        timing: item.timing,
        disposal: item.disposal,
        price_range: item.price_range,
        category: item.category,
        wuxing: item.wuxing
      });
    }
  }
  // 吉方位催旺吉祥物
  for (var p = 0; p < positiveAreas.length; p++) {
    var posArea = positiveAreas[p];
    for (var pi = 0; pi < posArea.items.length; pi++) {
      var pItem = posArea.items[pi];
      recommendations.push({
        item: pItem.name,
        purpose: '催旺' + posArea.starName + '（' + posArea.impact + '）',
        placement: posArea.position + '方 - ' + pItem.placement,
        timing: pItem.timing,
        disposal: pItem.disposal,
        price_range: pItem.price_range,
        category: pItem.category,
        wuxing: pItem.wuxing
      });
    }
  }

  // 7. 生成上一年吉祥物处置方案
  var prevYear = targetYear - 1;
  var disposal = _generateDisposalPlan(prevYear);

  // 8. 生成全年风水调整时间表
  var timeline = _generateFengshuiTimeline(targetYear);

  // 太岁三煞信息
  var taiSui = _getTaiSuiFang(targetYear);
  var sanSha = _getSanShaFang(targetYear);

  return {
    targetYear: targetYear,
    mingGua: mingGua,
    centerStar: yearStar,
    starPositions: starPositions,
    negativeAreas: negativeAreas,
    positiveAreas: positiveAreas,
    directionImpact: directionImpact,
    recommendations: recommendations,
    disposal: disposal,
    timeline: timeline,
    taiSui: taiSui,
    sanSha: sanSha,
    huxing: huxing,
    chaoxiang: chaoxiang,
    louceng: louceng,
    buildYear: buildYear,
    bazhai: bazhai,
    xuankong: xuankong
  };
}

// 渲染年度风水测评报告
function renderYearlyFengshuiReport(data) {
  var out = document.getElementById('fsYearlyOutput');
  if (!out) return;
  document.getElementById('fsYearlyResult').classList.add('visible');

  var html = '';

  // 标题
  html += '<div style="text-align:center;margin-bottom:24px">';
  html += '<div style="font-size:24px;color:var(--gold);letter-spacing:4px;margin-bottom:8px">' + data.targetYear + '年风水测评报告</div>';
  html += '<p style="font-size:12px;opacity:.5">' + data.centerStar + '入中宫 · 太岁' + data.taiSui + '方 · 三煞' + data.sanSha + '方</p>';
  html += '</div>';

  // 命卦分析
  html += '<div class="huajie-alert"><div class="alert-title">命卦分析</div>';
  html += '<p>命卦：<strong>' + data.mingGua.type + '</strong>（' + data.mingGua.guaName + '卦，卦数' + data.mingGua.gua + '）</p>';
  html += '<p style="margin-top:8px">吉方：<span style="color:#2ecc71">' + (data.mingGua.isDong ? '东、南、东南、北' : '西、西南、西北、东北') + '</span></p>';
  html += '<p style="margin-top:4px">凶方：<span style="color:#e74c3c">' + (data.mingGua.isDong ? '西、西南、西北、东北' : '东、南、东南、北') + '</span></p>';
  html += '<p style="margin-top:8px;font-size:12px;opacity:.7">房屋朝向：' + data.chaoxiang + ' · ' + data.huxing + ' · ' + data.louceng + '层 · 建于' + data.buildYear + '年</p>';
  html += '</div>';

  // 飞星盘
  html += '<div style="margin-top:24px"><h5 style="font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:16px">⭐ ' + data.targetYear + '年九宫飞星盘</h5>';
  html += '<div class="fs-flyingstar-grid">';
  var gridOrder = ['东南', '南', '西南', '东', '中', '西', '东北', '北', '西北'];
  var gridLabels = { '东南': '东南', '南': '南', '西南': '西南', '东': '东', '中': '中宫', '西': '西', '东北': '东北', '北': '北', '西北': '西北' };
  for (var gi = 0; gi < gridOrder.length; gi++) {
    var gDir = gridOrder[gi];
    var gStar = data.starPositions[gDir] || data.centerStar;
    var gName = STAR_NAMES[gStar] || gStar + '星';
    var gColor = '#c9a84c';
    if (gStar === 8 || gStar === 9 || gStar === 1 || gStar === 4 || gStar === 6) gColor = '#2ecc71';
    if (gStar === 2 || gStar === 5 || gStar === 3 || gStar === 7) gColor = '#e74c3c';
    html += '<div class="fs-flyingstar-cell" style="border-color:' + gColor + '33">';
    html += '<div class="fs-cell-dir">' + gridLabels[gDir] + '</div>';
    html += '<div class="fs-cell-star" style="color:' + gColor + '">' + gStar + '</div>';
    html += '<div class="fs-cell-name">' + gName + '</div>';
    html += '</div>';
  }
  html += '</div></div>';

  // 凶方位化解方案
  html += '<div style="margin-top:24px"><h5 style="font-size:14px;letter-spacing:4px;color:#e74c3c;margin-bottom:16px">⚠️ 凶方位化解方案</h5>';
  for (var n = 0; n < data.negativeAreas.length; n++) {
    var na = data.negativeAreas[n];
    html += '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.2);border-radius:10px;padding:16px;margin-bottom:12px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<span style="font-size:15px;color:#e74c3c;font-weight:bold">' + na.starName + ' → ' + na.position + '方</span>';
    html += '<span style="font-size:11px;opacity:.7">' + na.impact + '</span>';
    html += '</div>';
    html += '<div style="font-size:12px;margin-bottom:8px"><span style="opacity:.5">化解方法：</span>' + na.remedy + '</div>';
    html += '<div style="font-size:12px"><span style="opacity:.5">推荐吉祥物：</span>';
    for (var ni = 0; ni < na.items.length; ni++) {
      html += '<span style="display:inline-block;padding:2px 8px;margin:2px;background:rgba(231,76,60,0.1);border-radius:4px;font-size:11px">' + na.items[ni].name + '</span>';
    }
    html += '</div></div>';
  }
  html += '</div>';

  // 吉方位催旺方案
  html += '<div style="margin-top:24px"><h5 style="font-size:14px;letter-spacing:4px;color:#2ecc71;margin-bottom:16px">✨ 吉方位催旺方案</h5>';
  for (var p = 0; p < data.positiveAreas.length; p++) {
    var pa = data.positiveAreas[p];
    html += '<div style="background:rgba(46,204,113,0.06);border:1px solid rgba(46,204,113,0.2);border-radius:10px;padding:16px;margin-bottom:12px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">';
    html += '<span style="font-size:15px;color:#2ecc71;font-weight:bold">' + pa.starName + ' → ' + pa.position + '方</span>';
    html += '<span style="font-size:11px;opacity:.7">' + pa.impact + '</span>';
    html += '</div>';
    html += '<div style="font-size:12px;margin-bottom:8px"><span style="opacity:.5">催旺方法：</span>' + pa.enhance + '</div>';
    html += '<div style="font-size:12px"><span style="opacity:.5">推荐吉祥物：</span>';
    for (var pi = 0; pi < pa.items.length; pi++) {
      html += '<span style="display:inline-block;padding:2px 8px;margin:2px;background:rgba(46,204,113,0.1);border-radius:4px;font-size:11px">' + pa.items[pi].name + '</span>';
    }
    html += '</div></div>';
  }
  html += '</div>';

  // 吉祥物推荐详表
  html += '<div style="margin-top:24px"><h5 style="font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:16px">🎁 吉祥物推荐详表</h5>';
  html += '<div style="overflow-x:auto"><table style="width:100%;font-size:12px;border-collapse:collapse">';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.2);color:var(--gold)"><th style="padding:8px;text-align:left">吉祥物</th><th style="padding:8px;text-align:left">用途</th><th style="padding:8px;text-align:left">摆放位置</th><th style="padding:8px;text-align:left">摆放时间</th><th style="padding:8px;text-align:left">处置方法</th><th style="padding:8px;text-align:left">价格</th></tr>';
  for (var r = 0; r < data.recommendations.length; r++) {
    var rec = data.recommendations[r];
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">';
    html += '<td style="padding:8px;color:var(--gold)">' + rec.item + '</td>';
    html += '<td style="padding:8px;opacity:.7">' + rec.purpose + '</td>';
    html += '<td style="padding:8px;opacity:.7">' + rec.placement + '</td>';
    html += '<td style="padding:8px;opacity:.7">' + rec.timing + '</td>';
    html += '<td style="padding:8px;opacity:.7">' + rec.disposal + '</td>';
    html += '<td style="padding:8px;opacity:.7">' + rec.price_range + '</td>';
    html += '</tr>';
  }
  html += '</table></div></div>';

  // 上一年吉祥物处置方案
  html += '<div style="margin-top:24px"><h5 style="font-size:14px;letter-spacing:4px;color:var(--orange);margin-bottom:16px">♻️ 上一年(' + (data.targetYear - 1) + ')吉祥物处置方案</h5>';
  html += '<div style="font-size:12px;opacity:.6;margin-bottom:12px">年底需对上一年摆放的吉祥物进行妥善处置，以下是具体方案：</div>';
  for (var dp = 0; dp < data.disposal.length; dp++) {
    var dItem = data.disposal[dp];
    html += '<div style="background:rgba(230,126,34,0.05);border:1px solid rgba(230,126,34,0.15);border-radius:8px;padding:12px;margin-bottom:8px;font-size:12px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
    html += '<span style="color:var(--orange);font-weight:bold">' + dItem.item + '</span>';
    html += '<span style="opacity:.5">' + dItem.timing + '</span>';
    html += '</div>';
    html += '<div style="opacity:.7">位置：' + dItem.position + '（' + dItem.starName + '）</div>';
    html += '<div style="opacity:.7;margin-top:4px">处置：' + dItem.disposal + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // 全年风水调整时间表
  html += '<div style="margin-top:24px"><h5 style="font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:16px">📅 全年风水调整时间表</h5>';
  for (var t = 0; t < data.timeline.length; t++) {
    var tl = data.timeline[t];
    var priorityColor = tl.priority === '高' ? '#e74c3c' : tl.priority === '中' ? '#c9a84c' : '#2ecc71';
    html += '<div style="display:flex;gap:12px;margin-bottom:10px;padding:12px;background:rgba(255,255,255,0.03);border-radius:8px;border-left:3px solid ' + priorityColor + '">';
    html += '<div style="min-width:120px;font-size:12px;color:var(--gold);font-weight:bold">' + tl.time + '</div>';
    html += '<div style="flex:1">';
    html += '<div style="font-size:13px;margin-bottom:4px">' + tl.action + ' <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:' + priorityColor + '22;color:' + priorityColor + '">优先级:' + tl.priority + '</span></div>';
    html += '<div style="font-size:11px;opacity:.6">' + tl.detail + '</div>';
    html += '</div></div>';
  }
  html += '</div>';

  // 方位综合影响
  html += '<div style="margin-top:24px"><h5 style="font-size:14px;letter-spacing:4px;color:var(--gold);margin-bottom:16px">🏠 八方位综合影响分析</h5>';
  html += '<p style="font-size:12px;opacity:.5;margin-bottom:12px">八宅吉凶位 × 流年飞星 × 户型朝向综合判断</p>';
  for (var di = 0; di < data.directionImpact.length; di++) {
    var dImp = data.directionImpact[di];
    var dColor = dImp.isGood ? '#2ecc71' : dImp.isDanger ? '#e74c3c' : '#c9a84c';
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid ' + dColor + '33;border-radius:8px;padding:12px;margin-bottom:8px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center">';
    html += '<span style="font-size:14px;color:var(--gold);font-weight:bold">' + dImp.direction + '方</span>';
    html += '<span style="font-size:11px;padding:2px 8px;border-radius:4px;background:' + dColor + '22;color:' + dColor + '">' + dImp.advice + '</span>';
    html += '</div>';
    html += '<div style="font-size:12px;margin-top:6px;opacity:.7">八宅：' + dImp.bazhaiPosition + ' | 飞星：' + dImp.starName + '</div>';
    html += '</div>';
  }
  html += '</div>';

  out.innerHTML = html;
}

// 触发年度风水测评
function runYearlyFengshui() {
  var userYear = parseInt(document.getElementById('fsYearlyBirthYear').value);
  var userSex = document.getElementById('fsYearlySex').value;
  var huxing = document.getElementById('fsYearlyHuxing').value || document.getElementById('fsHuxing').value || '';
  var chaoxiang = document.getElementById('fsYearlyChaoxiang').value || document.getElementById('fsChaoxiang').value || '';
  var louceng = document.getElementById('fsYearlyLouceng').value || document.getElementById('fsLouceng').value || '';
  var buildYear = parseInt(document.getElementById('fsYearlyBuildYear').value) || parseInt(document.getElementById('fsBuildYear').value) || 2000;
  var targetYear = parseInt(document.getElementById('fsYearlyTargetYear').value) || new Date().getFullYear() + 1;

  if (!userYear || !userSex) { showToast('请填写出生年份和性别'); return; }
  if (!chaoxiang) { showToast('请选择房屋朝向'); return; }
  if (targetYear < 1900 || targetYear > 2100) { showToast('目标年份仅支持1900-2100年'); return; }

  var report = generateYearlyFengshuiReport(userYear, userSex, huxing, chaoxiang, louceng, buildYear, targetYear);
  renderYearlyFengshuiReport(report);
}

// 查询指定年份的飞星数据（供外部调用）
function queryYearlyFengshuiData(year) {
  return {
    flyingStars: YEARLY_FLYING_STARS[year],
    negativeDirections: YEARLY_NEGATIVE_DIRECTIONS[year],
    positiveDirections: YEARLY_POSITIVE_DIRECTIONS[year],
    timeline: _generateFengshuiTimeline(year),
    auspiciousItems: AUSPICIOUS_ITEMS
  };
}

// ===== 强制全局暴露所有导航函数（兼容微信浏览器）=====
// 子模块切换函数已在HTML内联定义，不覆盖
// try { window.showZhanbuSub = showZhanbuSub; } catch(e) {}
// try { window.showXingmingSub = showXingmingSub; } catch(e) {}
// try { window.showFengshuiSub = showFengshuiSub; } catch(e) {}
// showJiuriCal 不存在，跳过
try { window.showZodiacDetail = showZodiacDetail; } catch(e) {}
try { window.jiuriInit = jiuriInit; } catch(e) {}
// showSection: 不覆盖内联版，内联版已处理复合section
// try { window.showSection = showSection; } catch(e) {}
// 内联版showSection在HTML头部已定义，功能完整，无需覆盖

try { window.runYearlyFengshui = runYearlyFengshui; } catch(e) {}
try { window.queryYearlyFengshuiData = queryYearlyFengshuiData; } catch(e) {}
try { window.generateYearlyFengshuiReport = generateYearlyFengshuiReport; } catch(e) {}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(jiuriInit, 500);
} else {
  window.addEventListener('load', function() { setTimeout(jiuriInit, 500); });
}

// ════════════════════════════════════════════════════════════════
//  三元九运模型 + 60年知识结构 + 九紫离火运指南
//  基于洛书九宫飞星理论 · 1864年甲子年起算
//  每运20年 × 9运 = 180年大循环 → 无限循环
// ════════════════════════════════════════════════════════════════

/**
 * 三元九运数据模型
 * 上元(1-3运) · 中元(4-6运) · 下元(7-9运)
 * 每运20年，9运合计180年一个大循环，之后重复
 * 基准起点：1864年甲子年(上元一白坎水运)
 */
var SANYUAN_JIUYUN = {
  // ===== 上元 =====
  1: {
    name: '一白坎水运', yuan: '上元',
    period: '1864-1883, 2044-2063',
    startYear: 1864, endYear: 1883,
    wuxing: '水', gua: '坎', guaSym: '☵', star: '一白贪狼',
    direction: '正北',
    characteristics: '智慧、流动、变革',
    industries: '水利、航海、传播、物流、酒水、水产',
    social: '文化变革、流动迁徙增多、智慧启蒙',
    health: '肾、膀胱、耳、血液',
    favorable: '智慧开发、远行求学、水利建设',
    unfavorable: '过度流动、漂泊不定',
    firstHalf: '变革酝酿期，旧秩序松动',
    secondHalf: '新文化成形，流动加速'
  },
  2: {
    name: '二黑坤土运', yuan: '上元',
    period: '1884-1903, 2064-2083',
    startYear: 1884, endYear: 1903,
    wuxing: '土', gua: '坤', guaSym: '☷', star: '二黑巨门',
    direction: '西南',
    characteristics: '厚重、包容、保守',
    industries: '房地产、农业、矿业、殡葬、陶瓷',
    social: '土地价值上升、保守思潮、母系文化',
    health: '脾胃、消化系统、腹部',
    favorable: '置产置业、农业投资、积累资源',
    unfavorable: '过于保守、错失变革机遇',
    firstHalf: '土地价值重估，农业政策调整',
    secondHalf: '保守思潮盛行，积累成主流'
  },
  3: {
    name: '三碧震木运', yuan: '上元',
    period: '1904-1923, 2084-2103',
    startYear: 1904, endYear: 1923,
    wuxing: '木', gua: '震', guaSym: '☳', star: '三碧禄存',
    direction: '正东',
    characteristics: '震动、变革、争斗',
    industries: '林业、木材、运动、军事、电力初兴',
    social: '社会动荡、改革运动、青年觉醒',
    health: '肝胆、神经、四肢',
    favorable: '勇于变革、开创新局、体育运动',
    unfavorable: '争斗过烈、冲动行事',
    firstHalf: '变革爆发，旧秩序瓦解',
    secondHalf: '新秩序建立，阵痛消减'
  },
  // ===== 中元 =====
  4: {
    name: '四绿巽木运', yuan: '中元',
    period: '1924-1943, 2104-2123',
    startYear: 1924, endYear: 1943,
    wuxing: '木', gua: '巽', guaSym: '☴', star: '四绿文曲',
    direction: '东南',
    characteristics: '柔顺、文化、传播',
    industries: '教育、出版、传媒、文艺、风能',
    social: '文化繁荣、学术发展、信息传播',
    health: '肝胆、呼吸、风湿',
    favorable: '文化教育、学术研究、传播事业',
    unfavorable: '随波逐流、缺乏主见',
    firstHalf: '文化觉醒，学术新思潮涌现',
    secondHalf: '传播技术突破，文化普及'
  },
  5: {
    name: '五黄中土运', yuan: '中元',
    period: '1944-1963, 2124-2143',
    startYear: 1944, endYear: 1963,
    wuxing: '土', gua: '中', guaSym: '◉', star: '五黄廉贞',
    direction: '中央',
    characteristics: '权威、变动、灾厄',
    industries: '中央集权、大型工程、矿业、军工',
    social: '大变革、天灾人祸、权力集中',
    health: '脾胃、肿瘤、瘟疫',
    favorable: '集中力量办大事、基建工程',
    unfavorable: '灾厄频发、健康风险',
    firstHalf: '剧烈变动，权力重构',
    secondHalf: '秩序恢复，重建期'
  },
  6: {
    name: '六白乾金运', yuan: '中元',
    period: '1964-1983, 2144-2163',
    startYear: 1964, endYear: 1983,
    wuxing: '金', gua: '乾', guaSym: '☰', star: '六白武曲',
    direction: '西北',
    characteristics: '刚健、权威、领导',
    industries: '金融、机械、汽车、军事、航空航天',
    social: '强权政治、经济扩张、男性主导',
    health: '肺、大肠、头部、骨骼',
    favorable: '果断决策、军事金融、领导力发挥',
    unfavorable: '过于刚硬、独断专行',
    firstHalf: '经济快速扩张，权力集中',
    secondHalf: '扩张见顶，矛盾积累'
  },
  // ===== 下元 =====
  7: {
    name: '七赤兑金运', yuan: '下元',
    period: '1984-2003, 2164-2183',
    startYear: 1984, endYear: 2003,
    wuxing: '金', gua: '兑', guaSym: '☱', star: '七赤破军',
    direction: '正西',
    characteristics: '口舌、破败、变革',
    industries: '娱乐、餐饮、口腔、美容、通讯',
    social: '娱乐繁荣、口舌是非、信息爆炸',
    health: '肺、口腔、咽喉、皮肤',
    favorable: '娱乐餐饮、口才相关、美容行业',
    unfavorable: '口舌是非、破财风险',
    firstHalf: '娱乐产业爆发，通讯革命',
    secondHalf: '泡沫破裂，行业洗牌'
  },
  8: {
    name: '八白艮土运', yuan: '下元',
    period: '2004-2023, 2184-2203',
    startYear: 2004, endYear: 2023,
    wuxing: '土', gua: '艮', guaSym: '☶', star: '八白左辅',
    direction: '东北',
    characteristics: '止定、积累、保守',
    industries: '房地产、建筑、矿产、保险、仓储',
    social: '房地产繁荣、保守稳定、少男崛起',
    health: '脾胃、关节、背部',
    favorable: '房地产投资、资源积累、稳健经营',
    unfavorable: '过度保守、错过新趋势',
    firstHalf: '房地产起飞，资源价格上行',
    secondHalf: '泡沫见顶，亟需转型'
  },
  9: {
    name: '九紫离火运', yuan: '下元',
    period: '2024-2043, 2204-2223',
    startYear: 2024, endYear: 2043,
    wuxing: '火', gua: '离', guaSym: '☲', star: '九紫右弼',
    direction: '正南',
    characteristics: '光明、文化、科技、变革',
    industries: 'AI/科技、新能源、文化教育、美容、餐饮、传媒、电力、虚拟经济',
    social: '科技革命、文化复兴、女性崛起、虚拟经济',
    health: '心脏、眼睛、血液、神经系统',
    favorable: '科技创新、文化教育、新能源、女性消费',
    unfavorable: '火旺过热、心血管压力、信息过载',
    firstHalf: 'AI与新能源爆发，文化觉醒(2024-2033)',
    secondHalf: '技术成熟化，虚拟经济深化(2034-2043)'
  }
};

/**
 * 获取某年所处的三元九运信息
 * 算法：以1864年为基准，每20年一运，9运180年大循环
 * 验证：1864→1运, 1884→2运, 1904→3运, 1924→4运, 1944→5运,
 *       1964→6运, 1984→7运, 2004→8运, 2024→9运, 2044→1运
 */
function getCurrentYuanYun(year) {
  var yun = Math.floor((year - 1864) / 20) % 9 + 1;
  if (yun < 1) yun += 9;
  var data = SANYUAN_JIUYUN[yun];
  var yuanNames = {1:'上元', 2:'上元', 3:'上元', 4:'中元', 5:'中元', 6:'中元', 7:'下元', 8:'下元', 9:'下元'};
  // 计算大运中第几年 (1-20)
  var cycleStartYear = year - ((year - 1864) % 20);
  var yunYear = year - cycleStartYear + 1;
  // 当前循环起点
  var grandCycleStart = 1864 + Math.floor((year - 1864) / 180) * 180;
  return {
    yun: yun,
    yuan: yuanNames[yun],
    name: data.name,
    star: data.star,
    wuxing: data.wuxing,
    gua: data.gua,
    direction: data.direction,
    yunYear: yunYear, // 大运第几年 (1-20)
    yunTotalYears: 20,
    data: data,
    grandCycleStart: grandCycleStart,
    periodInThisCycle: grandCycleStart + (yun - 1) * 20 + '-' + (grandCycleStart + (yun - 1) * 20 + 19)
  };
}

/**
 * 获取大运前10年/后10年特征
 * 每运20年分前后两半，各有不同侧重
 */
function getYunHalf(yun, year) {
  var yunYear = getCurrentYuanYun(year).yunYear;
  var isfirstHalf = yunYear <= 10;
  var data = SANYUAN_JIUYUN[yun];
  return {
    half: isfirstHalf ? '前10年' : '后10年',
    yunYear: yunYear,
    halfDesc: isfirstHalf ? data.firstHalf : data.secondHalf,
    advice: isfirstHalf
      ? '大运前半段为酝酿期，宜蓄势待发、打好基础'
      : '大运后半段为收获期，宜把握机遇、稳健前行'
  };
}

// ════════════════════════════════════════════════════════════════
//  九紫离火运（2024-2043）详细生活择业指南
// ════════════════════════════════════════════════════════════════

var JIU_ZI_LI_HUO_GUIDE = {
  period: '2024-2043',
  overview: '九紫离火运，离卦为火、为明、为丽。主文化繁荣、科技革命、女性崛起、虚拟经济。离为中女，中年女性将在这20年大放异彩。火主光明，一切与光、电、信息、文化相关的事业将蓬勃发展。',

  // 按日主五行给出建议
  byDayMaster: {
    '甲木': {
      career: '木生火，宜文化教育、创意设计、AI科技、新能源',
      direction: '东南方/南方',
      advice: '火旺耗木，注意精力消耗，宜补水养木。多读书充电，避免过度输出',
      health: '注意肝火旺、眼睛疲劳、精力透支',
      wealth: '正财为主，靠专业知识和创意赚钱，不宜投机',
      relationship: '火旺耗木，感情中易付出过多，需平衡给予与接收'
    },
    '乙木': {
      career: '宜传媒出版、花草美容、茶艺香道、文化创意',
      direction: '东南/南方',
      advice: '木被火焚，需培根固本，宜静心读书。培养不可替代的核心技能',
      health: '注意神经系统、肝胆、情绪波动',
      wealth: '偏财运好，适合副业创收，但需守住本金',
      relationship: '温柔付出但需有底线，避免被消耗'
    },
    '丙火': {
      career: '火旺当令，宜新能源、电力、餐饮、AI、传媒',
      direction: '南方',
      advice: '火上加火，宜谦逊低调，防过刚折。当令者更需收敛锋芒',
      health: '注意心血管、血压、眼睛、情绪过亢',
      wealth: '财运极旺但易大起大落，需设置止盈止损线',
      relationship: '魅力四射但易招桃花是非，需专一'
    },
    '丁火': {
      career: '宜电子科技、照明、美容、心理咨询、灵性教育',
      direction: '南方',
      advice: '丁火逢离为灯烛添光，宜发挥专长。做细分领域的明灯',
      health: '注意心脏、血液循环、失眠',
      wealth: '稳定增长型，适合长期投资和知识变现',
      relationship: '温暖细腻，易获贵人相助，姻缘佳'
    },
    '戊土': {
      career: '火生土，宜房地产、建筑、农业、陶瓷、康养',
      direction: '西南/东北',
      advice: '得离火生扶，事业稳固，宜把握机遇。火生土为贵人运，大胆推进',
      health: '脾胃偏燥，宜清淡饮食，多食蔬果',
      wealth: '正财旺，适合实体投资和长线布局',
      relationship: '稳重可靠吸引良缘，宜主动社交'
    },
    '己土': {
      career: '宜园林、农业、保健养生、心理咨询、教育培训',
      direction: '西南/东北',
      advice: '离火生土，厚积薄发，宜深耕专业。不追风口，做时间的朋友',
      health: '注意消化系统、皮肤干燥、湿气',
      wealth: '细水长流型，靠专业技能和服务品质致富',
      relationship: '踏实顾家型，适合相亲或朋友介绍'
    },
    '庚金': {
      career: '火克金，宜金融科技、精密制造、珠宝、法律',
      direction: '西方/西北',
      advice: '火旺克金，压力大，宜水泄火气。学会减压，培养柔性沟通',
      health: '注意肺部、呼吸系统、皮肤过敏',
      wealth: '压力中求财，需分散投资，不宜集中押注',
      relationship: '刚毅但需学柔软，婚姻中多包容'
    },
    '辛金': {
      career: '宜珠宝、美容、奢侈品、电子精密、设计',
      direction: '西方',
      advice: '辛金畏火，宜避锋芒，以柔克刚。做精做美，走差异化路线',
      health: '注意肺部、咽喉、皮肤、呼吸道',
      wealth: '精致化路线赚钱，审美和品味是核心竞争力',
      relationship: '追求完美易挑剔，学会欣赏不完美'
    },
    '壬水': {
      career: '水克火，宜AI、大数据、传播、物流、国际贸易',
      direction: '北方',
      advice: '水火既济，把握机遇，但防过劳。水克火为财，是九运中最有机会的日主之一',
      health: '注意肾、泌尿、心血管、过劳',
      wealth: '财运极旺，水克火为正财，适合大规模经营',
      relationship: '智慧吸引人，但需注意工作与家庭平衡'
    },
    '癸水': {
      career: '宜水产、酒业、传播、心理咨询、灵性修行',
      direction: '北方',
      advice: '癸水逢火为雨露润物，宜默默耕耘。以柔克刚，润物无声',
      health: '注意肾、泌尿、情绪低落、循环系统',
      wealth: '稳扎稳打型，适合知识付费和服务业',
      relationship: '温柔敏感，需找到能理解自己的伴侣'
    }
  },

  // 行业趋势
  industryTrends: {
    '旺运行业': [
      'AI/人工智能', '新能源/光伏', '文化教育/出版', '传媒/短视频',
      '美容/医美', '餐饮/食品', '电力/电子', '心理咨询/灵性',
      '虚拟现实/元宇宙', '女性消费', '大健康/康养', '碳中和'
    ],
    '衰退行业': [
      '传统房地产(八白运遗产)', '重工业制造', '传统零售', '纸媒',
      '高碳排放产业', '低端加工制造'
    ],
    '新兴行业': [
      'AI训练师', '碳排放管理师', '数字藏品/NFT', '灵性疗愈',
      '非遗文化传承', '汉服/国潮', '虚拟偶像', '脑机接口',
      '量子计算', '生物科技'
    ]
  },

  // 方位建议
  directions: {
    '旺方': '南方(离火当令)、东方(木生火)',
    '衰方': '北方(水克火)、西北(金被火克)',
    '财位': '东南(四绿木生火)、南方(九紫火)',
    '文昌': '东北(文昌星到方)',
    '桃花': '正西(兑卦金被火炼，社交活跃)',
    '病符': '正北(二黑到方需化解)'
  },

  // 20年大运每年要点（2024-2043）
  yearlyGuide: {
    2024: {title:'离火初燃', summary:'九运开启，AI元年', keyEvents:'ChatGPT等AI爆发，新能源加速', advice:'把握AI和新能源风口，学习新技能'},
    2025: {title:'乙巳木火通明', summary:'木火相生，文化教育大发展', keyEvents:'教育改革、文化出海、AI应用深化', advice:'投资自我学习，深耕专业，文化相关行业机遇多'},
    2026: {title:'丙午火炎土燥', summary:'火气极旺，防过热', keyEvents:'科技泡沫风险、地缘冲突、AI监管', advice:'稳健投资，避免冲动，注意健康'},
    2027: {title:'丁未火土相生', summary:'火生土，稳中有进', keyEvents:'房地产企稳、农业政策、康养兴起', advice:'适合置产置业，关注大健康产业'},
    2028: {title:'戊申土金交会', summary:'土金转换，格局调整', keyEvents:'金融改革、产业升级、奥运会效应', advice:'关注金融科技，把握产业转型机会'},
    2029: {title:'己酉金气渐旺', summary:'金气复苏，制造业回暖', keyEvents:'智能制造突破、精密制造崛起', advice:'关注高端制造，金水日主机遇来临'},
    2030: {title:'庚戌金土相生', summary:'金土相生，稳健发展', keyEvents:'基建投资、矿业整合、环保深化', advice:'稳健经营，关注环保和矿业'},
    2031: {title:'辛亥金水相生', summary:'金水相生，智慧产业兴', keyEvents:'AI成熟应用、大数据变现、水产业', advice:'水日主发力，关注AI和数据产业'},
    2032: {title:'壬子水旺灭火', summary:'水旺克火，调整期', keyEvents:'市场降温、行业洗牌、AI泡沫破裂', advice:'守成为主，现金为王，等待抄底机会'},
    2033: {title:'癸丑水土混杂', summary:'水土交战，迷茫期', keyEvents:'经济调整、政策转向、新秩序萌芽', advice:'沉淀学习，寻找新方向，不急躁'},
    2034: {title:'甲寅木火重生', summary:'木火重新燃起，第二春', keyEvents:'新技术突破、文化产业新高峰', advice:'九运后半程开启，木火日主再迎机遇'},
    2035: {title:'乙卯木旺生火', summary:'木火通明，文化鼎盛', keyEvents:'文化输出、教育变革、虚拟现实普及', advice:'文化产业最佳年份，大胆推进'},
    2036: {title:'丙辰火土交会', summary:'火土交汇，虚实结合', keyEvents:'虚拟与现实融合、元宇宙落地', advice:'关注虚实结合的商业模式'},
    2037: {title:'丁巳火旺当令', summary:'离火最旺，巅峰之年', keyEvents:'科技巅峰、女性领袖涌现、文化高潮', advice:'九运巅峰，把握最后大机遇'},
    2038: {title:'戊午火生土旺', summary:'火生土旺，收获期', keyEvents:'经济高位、房地产回暖、基建高峰', advice:'收获成果，逐步减仓风险资产'},
    2039: {title:'己未土厚载物', summary:'土厚火微，转型期', keyEvents:'产业转型、九运红利递减', advice:'准备过渡，布局下一运(一白水)相关产业'},
    2040: {title:'庚申金水转换', summary:'金水渐旺，火气衰退', keyEvents:'水相关产业崛起、火产业整合', advice:'逐步从火产业转向水产业'},
    2041: {title:'辛酉金旺生水', summary:'金水相生，新运酝酿', keyEvents:'AI与数据深度融合、物流革命', advice:'为一白水运做准备，关注水利、物流'},
    2042: {title:'壬戌水入库', summary:'水气蓄积，静待新运', keyEvents:'行业大洗牌、新秩序酝酿', advice:'保守经营，储备资源，等待新运'},
    2043: {title:'癸亥水旺九运终', summary:'九运收尾，一白将临', keyEvents:'火产业退潮、水产业兴起、时代交替', advice:'完成九运收尾，布局一白水运(2044-)'}
  }
};

/**
 * 60年知识结构：覆盖一个甲子的三元九运交叉分析
 * 每运20年 × 9运 = 180年大循环
 * 60年 = 上元(1-3运) + 中元(4-6运) 或 中元(4-6运) + 下元(7-9运) 等
 * 用于大运年份与个人八字大运的交叉分析
 */
var SANYUAN_60YEAR_STRUCTURE = {
  // 1864-1923: 上元完整60年
  '1864-1923': {
    yuan: '上元',
    yuns: [1, 2, 3],
    theme: '上元甲子，水利变革→土地积累→震动重建',
    characteristics: '从流动变革到保守积累再到社会重建，一个完整的旧秩序瓦解与新秩序建立周期',
    keyEvents: '洋务运动、甲午战争、清末新政、辛亥革命',
    crossAnalysis: '上元60年是社会大变革期，个人命运受时代洪流影响极大'
  },
  // 1924-1983: 中元完整60年
  '1924-1983': {
    yuan: '中元',
    yuns: [4, 5, 6],
    theme: '中元甲子，文化繁荣→大变动灾厄→刚健扩张',
    characteristics: '从文化觉醒到战乱灾厄再到经济扩张，典型的乱世到治世循环',
    keyEvents: '二战、新中国成立、冷战、改革开放初期',
    crossAnalysis: '中元60年个体命运起伏剧烈，5运生人多经历大灾大难，6运生人多乘经济东风'
  },
  // 1984-2043: 下元完整60年
  '1984-2043': {
    yuan: '下元',
    yuns: [7, 8, 9],
    theme: '下元甲子，娱乐口舌→房地产积累→科技文化革命',
    characteristics: '从娱乐经济到房地产繁荣再到AI科技革命，物质向虚拟/精神的升维',
    keyEvents: '互联网兴起、房地产黄金时代、AI革命、新能源转型',
    crossAnalysis: '下元60年是物质向精神升维的过渡期，7运生人善表达，8运生人善积累，9运生人善创新'
  },
  // 2044-2103: 下一轮上元60年
  '2044-2103': {
    yuan: '上元(新循环)',
    yuns: [1, 2, 3],
    theme: '新上元甲子，智慧流动→土地重估→变革重建',
    characteristics: '九紫离火运后的新循环，AI成熟后的人类社会重构',
    keyEvents: '强AI时代、新能源成熟、太空开发',
    crossAnalysis: '新一轮180年大循环开始，1运生人将是全新智慧时代的原住民'
  }
};

/**
 * 五行生克关系判断（用于大运与九运的交叉分析）
 * 返回: 生我/我生/克我/我克/比和
 */
function _sanyuanWxRelation(a, b) {
  if (a === b) return '比和';
  var sheng = {'金生水':1, '水生木':1, '木生火':1, '火生土':1, '土生金':1};
  if (sheng[a+'生'+b]) return '我生';
  if (sheng[b+'生'+a]) return '生我';
  var ke = {'金克木':1, '木克土':1, '土克水':1, '水克火':1, '火克金':1};
  if (ke[a+'克'+b]) return '我克';
  if (ke[b+'克'+a]) return '克我';
  return '比和';
}

/**
 * 根据日主天干获取日主全称（如 '甲木'）
 */
function _getDayMasterFull(dayStem) {
  var stemEle = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
  return dayStem + (stemEle[dayStem] || '木');
}

/**
 * 三元九运综合预测函数
 * 结合个人八字与当前三元九运，给出生活择业建议
 *
 * @param {number} birthYear - 出生年
 * @param {number} birthMonth - 出生月
 * @param {number} birthDay - 出生日
 * @param {number} birthHour - 出生时辰(0-23)
 * @param {string} sex - 'male'/'female'
 * @param {string} occupation - 职业(可选)
 * @param {string} location - 所在地(可选)
 * @returns {object} 预测结果对象
 */
function generateSanyuanForecast(birthYear, birthMonth, birthDay, birthHour, sex, occupation, location) {
  var currentYear = new Date().getFullYear();

  // 1. 获取当前三元九运
  var yuanYun = getCurrentYuanYun(currentYear);

  // 2. 计算个人八字（复用现有引擎）
  var baziData;
  try {
    baziData = getBaziCalcData(birthYear, birthMonth, birthDay, birthHour || 12, sex || 'male');
  } catch(e) {
    baziData = null;
  }

  var dayStem = baziData ? baziData.dayStem : '甲';
  var dayMasterFull = _getDayMasterFull(dayStem);
  var dayMasterEle = baziData ? baziData.dayWuxing : '木';

  // 3. 大运与九运的生克关系（个人日主五行 vs 九运五行）
  var yunWuxing = yuanYun.wuxing;
  var relation = _sanyuanWxRelation(dayMasterEle, yunWuxing);
  var relationDesc = '';
  switch(relation) {
    case '生我': relationDesc = dayMasterEle + '得' + yunWuxing + '生扶，贵人运旺，事业顺遂'; break;
    case '我生': relationDesc = dayMasterEle + '生' + yunWuxing + '（泄气），付出多收获少，需注意精力管理'; break;
    case '克我': relationDesc = yunWuxing + '克' + dayMasterEle + '，压力大阻力多，宜守不宜攻'; break;
    case '我克': relationDesc = dayMasterEle + '克' + yunWuxing + '（为财），财运旺，把握机遇'; break;
    case '比和': relationDesc = dayMasterEle + '与' + yunWuxing + '比和，稳中有进，顺势而为'; break;
    default: relationDesc = '关系平和，顺其自然';
  }

  // 4. 当前年份在大运中的位置
  var yunHalf = getYunHalf(yuanYun.yun, currentYear);

  // 5. 根据日主五行获取九紫离火运建议
  var guideEntry = JIU_ZI_LI_HUO_GUIDE.byDayMaster[dayMasterFull];
  if (!guideEntry) {
    // 降级：用日主五行匹配
    var eleToStem = {木:'甲木', 火:'丙火', 土:'戊土', 金:'庚金', 水:'壬水'};
    guideEntry = JIU_ZI_LI_HUO_GUIDE.byDayMaster[eleToStem[dayMasterEle]] || JIU_ZI_LI_HUO_GUIDE.byDayMaster['甲木'];
  }

  // 6. 个人大运信息（如果有）
  var personalDayun = null;
  if (baziData && baziData.dayun && baziData.dayun.length > 0) {
    var currentAge = currentYear - birthYear;
    for (var i = 0; i < baziData.dayun.length; i++) {
      var dy = baziData.dayun[i];
      if (currentAge >= dy.startAge && currentAge < dy.startAge + 10) {
        personalDayun = dy;
        break;
      }
    }
  }

  // 7. 个人大运五行与九运五行的交叉分析
  var crossAnalysis = '';
  if (personalDayun) {
    var dyEle = {甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'};
    var dyGanEle = dyEle[personalDayun.ganZhi ? personalDayun.ganZhi[0] : '甲'] || '木';
    var crossRel = _sanyuanWxRelation(dyGanEle, yunWuxing);
    switch(crossRel) {
      case '生我': crossAnalysis = '个人大运' + (personalDayun.ganZhi||'') + '(' + dyGanEle + ')被九运(' + yunWuxing + ')生扶，大吉，事业财运双旺'; break;
      case '我生': crossAnalysis = '个人大运' + (personalDayun.ganZhi||'') + '(' + dyGanEle + ')生九运(' + yunWuxing + ')，精力消耗大，宜聚焦核心业务'; break;
      case '克我': crossAnalysis = '九运(' + yunWuxing + ')克个人大运' + (personalDayun.ganZhi||'') + '(' + dyGanEle + ')，压力较大，宜保守经营'; break;
      case '我克': crossAnalysis = '个人大运' + (personalDayun.ganZhi||'') + '(' + dyGanEle + ')克九运(' + yunWuxing + ')，为财星，财运极佳'; break;
      case '比和': crossAnalysis = '个人大运' + (personalDayun.ganZhi||'') + '(' + dyGanEle + ')与九运(' + yunWuxing + ')比和，平稳顺遂'; break;
    }
  }

  // 8. 年度建议
  var yearlyGuide = JIU_ZI_LI_HUO_GUIDE.yearlyGuide[currentYear];

  // 9. 组装结果
  return {
    currentYuan: yuanYun.yuan,
    currentYun: yuanYun.name,
    currentYunStar: yuanYun.star,
    currentYunGua: yuanYun.gua,
    currentYunDirection: yuanYun.direction,
    yunYear: yuanYun.yunYear,
    yunHalf: yunHalf.half,
    yunHalfDesc: yunHalf.halfDesc,
    yunHalfAdvice: yunHalf.advice,
    dayMaster: dayMasterFull,
    dayMasterEle: dayMasterEle,
    dayMasterRelation: relationDesc,
    careerAdvice: guideEntry ? guideEntry.career : '宜文化教育、科技创新',
    directionAdvice: guideEntry ? guideEntry.direction : '南方/东南方',
    healthAdvice: guideEntry ? guideEntry.health : '注意心血管、眼睛、神经系统',
    wealthAdvice: guideEntry ? guideEntry.wealth : '稳健投资，知识变现',
    relationshipAdvice: guideEntry ? guideEntry.relationship : '真诚沟通，互相尊重',
    personalAdvice: guideEntry ? guideEntry.advice : '顺势而为，把握机遇',
    crossAnalysis: crossAnalysis || '暂无个人大运交叉数据',
    yearlyAdvice: yearlyGuide ? (yearlyGuide.title + '：' + yearlyGuide.summary + '。' + yearlyGuide.advice) : '把握当下，顺势而为',
    yearlyKeyEvents: yearlyGuide ? yearlyGuide.keyEvents : '',
    industryTrends: JIU_ZI_LI_HUO_GUIDE.industryTrends,
    directions: JIU_ZI_LI_HUO_GUIDE.directions,
    personalDayun: personalDayun ? (personalDayun.ganZhi + ' (' + personalDayun.startAge + '-' + (personalDayun.startAge + 9) + '岁)') : '',
    age: currentYear - birthYear,
    overview: JIU_ZI_LI_HUO_GUIDE.overview
  };
}

/**
 * 渲染三元九运预测结果为HTML
 */
function renderSanyuanForecast(forecast) {
  if (!forecast) return '';
  var html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(231,76,60,0.25);margin-top:20px">';
  html += '<h5 style="color:#e74c3c;font-size:16px;letter-spacing:4px">🔥 三元九运 · ' + forecast.currentYun + '</h5>';

  // 概览
  html += '<div style="background:rgba(231,76,60,0.06);border-left:3px solid #e74c3c;padding:12px 16px;margin:12px 0;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:13px;color:#e74c3c;font-weight:bold;margin-bottom:6px">📋 大运概览</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '当前：<strong>' + forecast.currentYuan + ' · ' + forecast.currentYun + '</strong>（' + forecast.currentYunStar + '）<br>';
  html += '卦象：' + forecast.currentYunGua + '卦 · 方位：' + forecast.currentYunDirection + '<br>';
  html += '大运第 <strong>' + forecast.yunYear + '/20</strong> 年（' + forecast.yunHalf + '）— ' + forecast.yunHalfDesc + '<br>';
  html += '<span style="opacity:0.7">' + forecast.yunHalfAdvice + '</span>';
  html += '</div></div>';

  // 日主关系
  html += '<div style="background:rgba(52,152,219,0.06);border-left:3px solid #3498db;padding:12px 16px;margin:12px 0;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:13px;color:#3498db;font-weight:bold;margin-bottom:6px">🧑 日主分析</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">';
  html += '日主：<strong>' + forecast.dayMaster + '</strong>（' + forecast.dayMasterEle + '）<br>';
  html += '与九运关系：' + forecast.dayMasterRelation + '<br>';
  if (forecast.personalDayun) html += '当前个人大运：' + forecast.personalDayun + '<br>';
  if (forecast.crossAnalysis) html += '交叉分析：' + forecast.crossAnalysis;
  html += '</div></div>';

  // 择业建议
  html += '<div style="background:rgba(39,174,96,0.06);border-left:3px solid #27ae60;padding:12px 16px;margin:12px 0;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:13px;color:#27ae60;font-weight:bold;margin-bottom:6px">💼 择业方向</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + forecast.careerAdvice + '</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8;margin-top:4px">💰 财运：' + forecast.wealthAdvice + '</div>';
  html += '</div>';

  // 方位建议
  html += '<div style="background:rgba(155,89,182,0.06);border-left:3px solid #9b59b6;padding:12px 16px;margin:12px 0;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:13px;color:#9b59b6;font-weight:bold;margin-bottom:6px">🧭 方位建议</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + forecast.directionAdvice + '</div>';
  html += '</div>';

  // 健康
  html += '<div style="background:rgba(230,126,34,0.06);border-left:3px solid #e67e22;padding:12px 16px;margin:12px 0;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:13px;color:#e67e22;font-weight:bold;margin-bottom:6px">🏥 健康提醒</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + forecast.healthAdvice + '</div>';
  html += '</div>';

  // 年度建议
  html += '<div style="background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);padding:12px 16px;margin:12px 0;border-radius:0 8px 8px 0">';
  html += '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:6px">📅 ' + new Date().getFullYear() + '年度建议</div>';
  html += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + forecast.yearlyAdvice + '</div>';
  if (forecast.yearlyKeyEvents) html += '<div style="font-size:11px;color:var(--paper2);margin-top:4px">📋 关键事件：' + forecast.yearlyKeyEvents + '</div>';
  html += '</div>';

  // 行业趋势
  var trends = forecast.industryTrends;
  html += '<div style="background:rgba(255,255,255,0.03);padding:12px 16px;margin:12px 0;border-radius:8px">';
  html += '<div style="font-size:13px;color:var(--gold);font-weight:bold;margin-bottom:8px">📊 行业趋势</div>';
  html += '<div style="font-size:12px;color:#27ae60;margin-bottom:4px">🔥 旺运行业：' + (trends['旺运行业']||[]).join('、') + '</div>';
  html += '<div style="font-size:12px;color:#e74c3c;margin-bottom:4px">📉 衰退行业：' + (trends['衰退行业']||[]).join('、') + '</div>';
  html += '<div style="font-size:12px;color:#3498db">✨ 新兴行业：' + (trends['新兴行业']||[]).join('、') + '</div>';
  html += '</div>';

  html += '</div>';
  return html;
}

/**
 * 三元九运分析块生成器（通用）
 * 为各类排盘引擎追加三元九运维度分析
 * @param {string} type - 排盘类型: bazi/qimen/ziwei/meihua/liuren/huajie/floor/zeri/fengshui
 * @param {object} ctx - 上下文 { birthYear, dayStem, dayEle, xiEle, currentYear, extra... }
 * @returns {string} HTML片段
 */
function _generateSanyuanJiuyunBlock(type, ctx) {
  var curYear = ctx.currentYear || new Date().getFullYear();
  var curYY = getCurrentYuanYun(curYear);
  var yunData = curYY.data;
  var yunWx = yunData.wuxing; // 当前运星五行
  var html = '';

  // 通用头部
  function _header(title) {
    return '<div class="analysis-card" style="margin:16px 0;padding:20px;border:1px solid rgba(231,76,60,.2);border-radius:8px">' +
      '<h5 style="color:#e74c3c;font-size:15px;letter-spacing:3px;margin-bottom:14px">🔥 ' + title + '</h5>';
  }
  function _footer() { return '</div>'; }

  // 五行关系描述
  function _wxRel(eleA, eleB) {
    if (eleA === eleB) return '比和';
    var sheng = {'金生水':1,'水生木':1,'木生火':1,'火生土':1,'土生金':1};
    if (sheng[eleA+'生'+eleB]) return '生';
    if (sheng[eleB+'生'+eleA]) return '被生';
    var ke = {'金克木':1,'木克土':1,'土克水':1,'水克火':1,'火克金':1};
    if (ke[eleA+'克'+eleB]) return '克';
    if (ke[eleB+'克'+eleA]) return '被克';
    return '无关';
  }

  var dayStem = ctx.dayStem || '甲';
  var dayEle = ctx.dayEle || ELE[dayStem] || '木';
  var xiEle = ctx.xiEle || '木';
  var rel = _wxRel(dayEle, yunWx);
  var xiRel = _wxRel(xiEle, yunWx);

  // 运星基本信息
  var yunInfo = '当前' + curYY.yuan + ' · ' + curYY.name + '（' + curYY.star +
    '），五行属' + yunWx + '，方位' + yunData.direction +
    '，大运第' + curYY.yunYear + '/20年。';

  // 正神位/零神位
  var zhengShen = yunData.direction; // 正神位=运星方位
  var lingShen = { '正北':'正南','正南':'正北','正东':'正西','正西':'正东','东南':'西北','西北':'东南','东北':'西南','西南':'东北','中央':'中央' }[zhengShen] || '正北';

  if (type === 'bazi') {
    var birthYY = ctx.birthYear ? getCurrentYuanYun(ctx.birthYear) : null;
    html += _header('三元九运命理框架');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    if (birthYY) {
      html += '<p><b>出生时运星：</b>' + birthYY.yuan + ' · ' + birthYY.name + '（' + birthYY.star + '），五行属' + birthYY.wuxing + '。</p>';
    }
    html += '<p><b>当前运星：</b>' + yunInfo + '</p>';
    html += '<p><b>运星与日主关系：</b>日主' + dayStem + '(' + dayEle + ')与运星' + yunWx + '为<b>' + rel + '</b>关系。';
    if (rel === '生' || rel === '被生') html += '运星生扶日主，根基得力，事业顺遂。';
    else if (rel === '克' || rel === '被克') html += '运星克泄日主，压力较大，宜保守稳健、化解为上。';
    else if (rel === '比和') html += '运星与日主同气，势得其衡，顺势而为。';
    html += '</p>';
    html += '<p><b>运星与喜用神关系：</b>喜用神' + xiEle + '与运星' + yunWx + '为<b>' + xiRel + '</b>关系。';
    if (xiRel === '比和' || xiRel === '生' || xiRel === '被生') html += '运星助益喜用神，运势加分，宜积极进取。';
    else if (xiRel === '克' || xiRel === '被克') html += '运星克泄喜用神，需化解，宜以五行调和（如佩戴对应属性饰品）。';
    else html += '运星与喜用神关系平和，顺其自然。';
    html += '</p>';
    html += '<p><b>行业建议：</b>' + yunData.industries + '。</p>';
    html += '<p><b>方位调整：</b>正神位' + zhengShen + '宜动、宜办公朝向；零神位' + lingShen + '宜静、宜见水。';
    if (rel === '克' || rel === '被克') html += '日主受运星克制，宜在正神位放生扶日主五行之物。';
    html += '</p>';
    html += '</div>';
    html += _footer();

  } else if (type === 'qimen') {
    html += _header('三元九运与奇门');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    html += '<p><b>运星定位：</b>' + yunInfo + '</p>';
    html += '<p><b>离宫权重调整：</b>九紫离火对应离宫，离宫在奇门中为景门所在。九运期间离宫相关格局权重<b>+20%</b>，景门吉格更吉、凶格更凶。</p>';
    html += '<p><b>运星五行与日主：</b>日主' + dayStem + '(' + dayEle + ')与运星' + yunWx + '为<b>' + rel + '</b>关系。';
    if (rel === '生' || rel === '被生') html += '运星生扶，奇门用神得力，吉局更吉。';
    else if (rel === '克' || rel === '被克') html += '运星克泄，奇门用神受阻，需择吉时吉方化解。';
    else html += '运星比和，盘面平稳，顺势而为。';
    html += '</p>';
    html += '<p><b>方位宜忌：</b>正神位' + zhengShen + '（正南）宜动——出行、办事、开门均吉；零神位' + lingShen + '（正北）忌动——不宜兴工、动土。</p>';
    html += '</div>';
    html += _footer();

  } else if (type === 'ziwei') {
    html += _header('三元九运与紫微');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    html += '<p><b>运星定位：</b>' + yunInfo + '</p>';
    html += '<p><b>太阳星权重：</b>九紫对应离卦，离卦在紫微中对应太阳星。九运期间太阳星权重<b>+20%</b>，太阳入庙旺者事业显达，落陷者需防精力透支。</p>';
    html += '<p><b>运星与命宫主星：</b>当前运星五行' + yunWx + '，与命宫主星的五行关系影响运势基调。';
    if (rel === '生' || rel === '被生') html += '运星生扶命宫，事业宫/财帛宫得力，九运期间运势上扬。';
    else if (rel === '克' || rel === '被克') html += '运星克泄命宫，需在官禄宫/财帛宫方向加倍努力，以静制动。';
    else html += '运星比和命宫，运势平稳，宜深耕专业。';
    html += '</p>';
    html += '<p><b>十二宫重点：</b>九运期间重点关注<b>官禄宫</b>（事业方向是否契合火属性行业）与<b>财帛宫</b>（财运是否借运星之势）。官禄宫有太阳、天梁者，九运大吉。</p>';
    html += '</div>';
    html += _footer();

  } else if (type === 'meihua') {
    html += _header('三元九运与梅花');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    html += '<p><b>运星定位：</b>' + yunInfo + '</p>';
    var castYY = ctx.castYear ? getCurrentYuanYun(ctx.castYear) : curYY;
    html += '<p><b>起卦运星影响：</b>起卦时处于' + castYY.name + '，五行属' + castYY.wuxing + '。运星五行对卦象有底层影响：运星五行与体卦五行相生则吉增，相克则凶增。</p>';
    html += '<p><b>离卦权重：</b>九紫火运期间，离卦权重<b>+20%</b>。若本卦或变卦为离，力量倍增；若坎卦（水克火），需注意阻力。</p>';
    html += '<p><b>体用关系融入：</b>运星' + yunWx + '生体则吉加分，运星克体则凶加分。当前日主五行' + dayEle + '与运星' + yunWx + '为<b>' + rel + '</b>关系。';
    if (rel === '生' || rel === '被生') html += '运星生体，断卦宜吉断。';
    else if (rel === '克' || rel === '被克') html += '运星克体，断卦宜谨慎，防变数。';
    else html += '运星比和，断卦平稳。';
    html += '</p>';
    html += '<p><b>方位建议：</b>断卦方位宜坐正神位' + zhengShen + '，忌零神位' + lingShen + '。若占方位事，南方宜动、北方宜静。</p>';
    html += '</div>';
    html += _footer();

  } else if (type === 'liuren') {
    html += _header('三元九运与六壬');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    html += '<p><b>运星定位：</b>' + yunInfo + '</p>';
    html += '<p><b>南方天将权重：</b>九紫对应离方(正南)，六壬中胜光(午)临南方。九运期间南方天将权重<b>+20%</b>，胜光临用神则吉力倍增，临忌神则凶力加重。</p>';
    html += '<p><b>运星五行与四课三传：</b>运星' + yunWx + '与初传五行关系影响课式判断。';
    if (rel === '生' || rel === '被生') html += '运星生扶日干，四课三传得力，课式偏吉。';
    else if (rel === '克' || rel === '被克') html += '运星克泄日干，四课三传受阻，宜守不宜攻。';
    else html += '运星比和，课式平稳。';
    html += '</p>';
    html += '<p><b>方位宜忌：</b>正神位正南宜出行办事，零神位正北忌动。若课式中午(南方)乘贵人、青龙等吉将，九运期间效力倍增。</p>';
    html += '</div>';
    html += _footer();

  } else if (type === 'huajie') {
    html += _header('三元九运化解');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    html += '<p><b>运星催旺（正神位' + zhengShen + '）：</b>九紫火运期间，正南方为正神位，宜放红色/紫色物品、灯光照明、火属性饰品（如红水晶、紫水晶），催旺运星能量。</p>';
    html += '<p><b>零神化解（零神位' + lingShen + '）：</b>正北方为零神位，不宜见真水（鱼缸、水景）。宜放金属/水属性物品泄化——金泄土生水，以金属性饰品（铜葫芦、五帝钱）通关化解。</p>';
    html += '<p><b>日主关系定化解重点：</b>日主' + dayStem + '(' + dayEle + ')与运星' + yunWx + '为<b>' + rel + '</b>关系。';
    if (rel === '克' || rel === '被克') html += '运星为忌神，需<b>重点化解</b>：佩戴生扶日主五行之饰品，在正神位放泄运星五行之物。';
    else if (rel === '生' || rel === '被生' || rel === '比和') html += '运星为喜用，宜<b>催旺</b>：在正神位加强运星五行布局，顺势而为。';
    else html += '运星关系平和，常规化解即可。';
    html += '</p>';
    html += '<p><b>九运20年(2024-2043)长期布局：</b>正南常年保持明亮火属性布局，正北常年以金属饰品泄化。每年立春调整一次流年飞星叠加布局。</p>';
    html += '</div>';
    html += _footer();

  } else if (type === 'floor') {
    html += _header('三元九运楼层维度');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    html += '<p><b>运星定位：</b>' + yunInfo + '</p>';
    html += '<p><b>运星楼层评分调整：</b>九紫火运期间——</p>';
    html += '<p>• 楼层尾数2/7(火)：与运星同气，<b style="color:#2ecc71">+10分</b></p>';
    html += '<p>• 楼层尾数5/0(土)：运星相生(火生土)，<b style="color:#2ecc71">+5分</b></p>';
    html += '<p>• 楼层尾数1/6(水)：运星相克(水克火)，<b style="color:#e74c3c">-5分</b></p>';
    html += '<p>• 楼层尾数3/8(木)、4/9(金)：与运星关系间接，不调整</p>';
    html += '<p><b>综合建议：</b>九运期间优选尾数2/7的楼层，其次5/0，避开1/6。此维度已纳入上方楼层评分。</p>';
    html += '</div>';
    html += _footer();

  } else if (type === 'zeri') {
    html += _header('三元九运择日维度');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    html += '<p><b>运星定位：</b>' + yunInfo + '</p>';
    html += '<p><b>运星日干支评分调整：</b>九紫火运期间——</p>';
    html += '<p>• 日干支五行属火/土：运星同气或相生，<b style="color:#2ecc71">+5分</b></p>';
    html += '<p>• 日干支五行属水：水克运星火，<b style="color:#e74c3c">-3分</b></p>';
    html += '<p>• 日干支五行属木/金：关系间接，不调整</p>';
    html += '<p><b>九运方位提示：</b>正神位' + zhengShen + '出行办事为吉，零神位' + lingShen + '为忌。择日办事宜往正南方向，忌往正北。</p>';
    html += '</div>';
    html += _footer();

  } else if (type === 'fengshui') {
    html += _header('三元九运风水维度');
    html += '<div style="font-size:13px;line-height:2;opacity:.9">';
    html += '<p><b>运星定位：</b>' + yunInfo + '</p>';
    html += '<p><b>正神位催旺（' + zhengShen + '）：</b>九紫火运期间正南方为正神位，宜催旺——红色装饰、灯光照明、火属性物品（红水晶、紫水晶、中国结）。保持明亮，不宜堆放杂物。</p>';
    html += '<p><b>零神位化解（' + lingShen + '）：</b>正北方为零神位，不宜见真水（鱼缸、水景忌大）。宜金属饰品泄化——铜葫芦、五帝钱、金属风铃等，以金泄土生水通关。</p>';
    html += '<p><b>流年飞星叠加：</b>运星九紫为固定大运星，每年流年飞星入中宫后飞布八方。流年飞星与运星九紫同宫则力量叠加（如流年九紫到正南，双九同宫，火气极旺）；流年一白到正南则水火冲激，需化解。</p>';
    html += '<p><b>九运20年宅运评估：</b>2024-2043年间，坐南朝北之宅得运星正神位，宅运旺；坐北朝南之宅临零神位，需重点化解北方水气。二十年后运转一白水运，布局需相应调整。</p>';
    html += '</div>';
    html += _footer();
  }

  return html;
}

// ════════════════════════════════════════════════════════════════
//  年度预测会员分级推送模型 (Annual Forecast with Membership Tiers)
// ════════════════════════════════════════════════════════════════

/**
 * 生成年度预测报告（12维度）
 * @param {number} birthYear - 出生年
 * @param {number} birthMonth - 出生月
 * @param {number} birthDay - 出生日
 * @param {number} birthHour - 出生时辰(0-23)
 * @param {string} sex - male/female
 * @param {string} occupation - 职业方向
 * @param {string} location - 所在地
 * @param {number} targetYear - 目标年份
 * @returns {object} { dimensions:[12], totalScore, keyword, bestMonth, cautionMonth }
 */
function generateAnnualForecast(birthYear, birthMonth, birthDay, birthHour, sex, occupation, location, targetYear) {
  targetYear = targetYear || (new Date().getFullYear() + 1);
  sex = sex || 'male';
  birthHour = birthHour || 12;

  // 1. 计算个人八字 & 大运
  var baziData = null;
  try {
    baziData = getBaziCalcData(birthYear, birthMonth, birthDay, birthHour, sex);
  } catch(e) {
    baziData = null;
  }

  // 2. 计算流年
  var liunianList = [];
  if (baziData) {
    try {
      liunianList = getLiunian(birthYear, birthMonth, birthDay, 5, baziData.dayStemIdx);
    } catch(e) {
      liunianList = [];
    }
  }

  // 找目标年份的流年
  var targetLiunian = null;
  for (var i = 0; i < liunianList.length; i++) {
    if (liunianList[i].year === targetYear) {
      targetLiunian = liunianList[i];
      break;
    }
  }

  // 3. 三元九运
  var yuanYun = getCurrentYuanYun(targetYear);

  // 4. 风水报告（简化调用，使用默认参数）
  var fengshuiReport = null;
  try {
    fengshuiReport = generateYearlyFengshuiReport(
      birthYear, sex, '三居室', '南', 5, 2000, targetYear
    );
  } catch(e) {
    fengshuiReport = null;
  }

  // 5. 当前个人大运
  var currentDayun = null;
  if (baziData && baziData.dayun) {
    var currentAge = targetYear - birthYear;
    for (var d = 0; d < baziData.dayun.length; d++) {
      var dy = baziData.dayun[d];
      if (currentAge >= dy.ageStart && currentAge < dy.ageEnd) {
        currentDayun = dy;
        break;
      }
    }
  }

  // 6. 日主信息
  var dayStem = baziData ? baziData.dayStem : '甲';
  var dayMasterEle = baziData ? baziData.dayWuxing : '木';
  var dayMasterFull = _getDayMasterFull(dayStem);

  // 7. 九紫离火运指南
  var guideEntry = JIU_ZI_LI_HUO_GUIDE.byDayMaster[dayMasterFull];
  if (!guideEntry) {
    var eleToStem = {木:'甲木', 火:'丙火', 土:'戊土', 金:'庚金', 水:'壬水'};
    guideEntry = JIU_ZI_LI_HUO_GUIDE.byDayMaster[eleToStem[dayMasterEle]] || JIU_ZI_LI_HUO_GUIDE.byDayMaster['甲木'];
  }

  // 8. 流年干支五行生克分析
  var lnGanEle = targetLiunian ? targetLiunian.ganEle : '木';
  var lnZhiEle = targetLiunian ? targetLiunian.zhiEle : '木';
  var lnStem = targetLiunian ? targetLiunian.stem : '甲';
  var lnZhi = targetLiunian ? targetLiunian.zhi : '子';
  var lnGanShen = targetLiunian ? targetLiunian.ganShen : '比肩';
  var lnZhiShen = targetLiunian ? targetLiunian.zhiShen : '正印';
  var lnDishi = targetLiunian ? targetLiunian.dishi : '临官';

  // 日主与流年天干生克
  var lnRelation = _sanyuanWxRelation(dayMasterEle, lnGanEle);
  var lnRelationDesc = '';
  switch(lnRelation) {
    case '生我': lnRelationDesc = '流年生扶日主，贵人多助，顺势可为'; break;
    case '我生': lnRelationDesc = '日主生流年（泄气），付出较多，需量力而行'; break;
    case '克我': lnRelationDesc = '流年克日主，压力较大，宜守不宜攻'; break;
    case '我克': lnRelationDesc = '日主克流年（为财），财星当头，把握机遇'; break;
    case '比和': lnRelationDesc = '流年与日主比和，平稳顺遂，贵人相助'; break;
    default: lnRelationDesc = '关系平和，顺其自然';
  }

  // 大运与流年交叉
  var dayunLiunianCross = '';
  if (currentDayun) {
    var dyGanEle = currentDayun.ganEle || ELE[currentDayun.gan] || '木';
    var crossRel = _sanyuanWxRelation(dyGanEle, lnGanEle);
    switch(crossRel) {
      case '生我': dayunLiunianCross = '大运生流年，根基稳固，事半功倍'; break;
      case '我生': dayunLiunianCross = '大运泄于流年，精力分散，宜聚焦'; break;
      case '克我': dayunLiunianCross = '流年克大运，阻力增大，宜谨慎'; break;
      case '我克': dayunLiunianCross = '大运克流年，主动权在手，宜进取'; break;
      case '比和': dayunLiunianCross = '大运流年比和，气势顺畅，宜谋篇布局'; break;
      default: dayunLiunianCross = '大运流年关系平和';
    }
  }

  // 太岁分析
  var taishuiZhi = lnZhi;
  var taishuiDesc = '';
  var taiSuiMap = {
    '子':'鼠年太岁，北方坎水位', '丑':'牛年太岁，东北艮土位',
    '寅':'虎年太岁，东北震木位', '卯':'兔年太岁，正东震木位',
    '辰':'龙年太岁，东南巽土位', '巳':'蛇年太岁，东南巽火位',
    '午':'马年太岁，正南离火位', '未':'羊年太岁，西南坤土位',
    '申':'猴年太岁，西南坤金位', '酉':'鸡年太岁，正西兑金位',
    '戌':'狗年太岁，西北乾土位', '亥':'猪年太岁，西北乾水位'
  };
  taishuiDesc = taiSuiMap[taishuiZhi] || '太岁方位需进一步推算';

  // 日主地支与太岁关系
  var dayBranchZhi = baziData ? baziData.dayBranch : '子';
  var zhiChong = {'子':'午','午':'子','丑':'未','未':'丑','寅':'申','申':'寅','卯':'酉','酉':'卯','辰':'戌','戌':'辰','巳':'亥','亥':'巳'};
  var zhiHe = {'子':'丑','丑':'子','寅':'亥','亥':'寅','卯':'戌','戌':'卯','辰':'酉','酉':'辰','巳':'申','申':'巳','午':'未','未':'午'};
  var zhiXing = {'子':'卯','卯':'子','寅':'巳','巳':'申','申':'寅','丑':'戌','戌':'未','未':'丑','辰':'辰','午':'午','酉':'酉','亥':'亥'};
  var taishuiRelation = '平和';
  if (zhiChong[dayBranchZhi] === taishuiZhi) taishuiRelation = '冲太岁，变动多，宜主动化解';
  else if (zhiHe[dayBranchZhi] === taishuiZhi) taishuiRelation = '合太岁，贵人助力，顺遂';
  else if (zhiXing[dayBranchZhi] === taishuiZhi) taishuiRelation = '刑太岁，口舌是非，宜忍让';
  else if (dayBranchZhi === taishuiZhi) taishuiRelation = '值太岁（本命年），宜静不宜动，穿戴红色化解';
  else if (zhiChong[zhiChong[dayBranchZhi]] === taishuiZhi) taishuiRelation = '害太岁，暗中受损，宜积德行善';
  else taishuiRelation = '与太岁关系平和，无重大冲克';

  // 9. 构建12维度预测
  var dims = [];

  // ── 维度1: 事业 ──
  var careerScore = lnRelation === '生我' || lnRelation === '比和' ? 5 : (lnRelation === '我克' ? 4 : (lnRelation === '我生' ? 3 : 2));
  if (currentDayun && dayunLiunianCross.indexOf('事半功倍') >= 0) careerScore = Math.min(5, careerScore + 1);
  if (currentDayun && dayunLiunianCross.indexOf('阻力') >= 0) careerScore = Math.max(1, careerScore - 1);
  dims.push({
    key: 'career',
    name: '事业',
    icon: '💼',
    stars: careerScore,
    analysis: '流年天干' + lnStem + '(' + lnGanEle + ')与日主' + dayMasterFull + '(' + dayMasterEle + ')「' + lnRelationDesc + '」。' +
      '十神「' + lnGanShen + '」主导事业走向。' +
      (guideEntry ? '九运期间宜：' + guideEntry.career + '。' : '') +
      '大运流年交叉：' + dayunLiunianCross + '。' +
      (occupation ? '结合「' + occupation + '」职业方向，' : '') +
      (careerScore >= 4 ? '今年事业有上升空间，宜把握机遇。' : careerScore >= 3 ? '事业平稳，宜积累实力。' : '事业有压力，宜稳扎稳打，不宜冒进。'),
    yi: careerScore >= 4 ? ['主动争取项目', '拓展人脉', '学习新技能'] : ['做好本职工作', '维护人际关系', '积累经验'],
    ji: careerScore >= 4 ? ['骄傲自满', '忽视细节'] : ['跳槽转行', '与上级冲突', '盲目扩张'],
    keyMonths: careerScore >= 4 ? [3, 6, 9] : [2, 7]
  });

  // ── 维度2: 财运 ──
  var wealthScore = lnRelation === '我克' ? 5 : (lnRelation === '生我' ? 4 : (lnRelation === '比和' ? 4 : (lnRelation === '我生' ? 2 : 3)));
  dims.push({
    key: 'wealth',
    name: '财运',
    icon: '💰',
    stars: wealthScore,
    analysis: '日主' + dayMasterEle + '克' + lnGanEle + '为财。流年十神「' + lnGanShen + '」主财。' +
      (guideEntry ? '九运财运建议：' + guideEntry.wealth + '。' : '') +
      (wealthScore >= 4 ? '今年财运较好，正财偏财皆有可图。' : wealthScore >= 3 ? '财运平稳，以正财为主，偏财需谨慎。' : '财运较弱，宜节流开源，避免大额投资。'),
    yi: wealthScore >= 4 ? ['稳健投资', '拓展副业', '理财规划'] : ['储蓄为主', '避免借贷', '控制开支'],
    ji: wealthScore >= 4 ? ['贪婪冒进', '盲目跟风'] : ['高风险投资', '大额借贷', '担保他人'],
    keyMonths: wealthScore >= 4 ? [4, 8, 11] : [1, 5, 10]
  });

  // ── 维度3: 感情 ──
  var relationScore = lnRelation === '生我' ? 5 : (lnRelation === '比和' ? 4 : (lnRelation === '克我' ? 2 : 3));
  if (taishuiRelation.indexOf('合') >= 0) relationScore = Math.min(5, relationScore + 1);
  if (taishuiRelation.indexOf('冲') >= 0 || taishuiRelation.indexOf('刑') >= 0) relationScore = Math.max(1, relationScore - 1);
  dims.push({
    key: 'relationship',
    name: '感情',
    icon: '❤️',
    stars: relationScore,
    analysis: '流年「' + lnGanShen + '/' + lnZhiShen + '」影响感情宫。太岁关系：' + taishuiRelation + '。' +
      (guideEntry ? '九运感情建议：' + guideEntry.relationship + '。' : '') +
      (relationScore >= 4 ? '感情和谐，单身者有桃花机缘。' : relationScore >= 3 ? '感情平稳，需多沟通理解。' : '感情易生波折，宜包容忍让，避免争吵。'),
    yi: relationScore >= 4 ? ['主动社交', '表达心意', '共同旅行'] : ['多倾听', '换位思考', '给彼此空间'],
    ji: relationScore >= 4 ? ['花心多情', '忽视对方感受'] : ['冷战', '翻旧账', '冲动分手'],
    keyMonths: relationScore >= 4 ? [2, 5, 9] : [3, 8]
  });

  // ── 维度4: 健康 ──
  var healthScore = lnRelation === '克我' ? 2 : (lnRelation === '我生' ? 3 : (lnRelation === '生我' ? 5 : 4));
  if (taishuiRelation.indexOf('冲') >= 0 || taishuiRelation.indexOf('刑') >= 0 || taishuiRelation.indexOf('值') >= 0) healthScore = Math.max(1, healthScore - 1);
  dims.push({
    key: 'health',
    name: '健康',
    icon: '🏥',
    stars: healthScore,
    analysis: '流年五行「' + lnGanEle + '/' + lnZhiEle + '」与健康关系密切。' +
      (guideEntry ? '九运健康提醒：' + guideEntry.health + '。' : '') +
      (taishuiRelation.indexOf('冲') >= 0 ? '冲太岁年身体易有小恙，宜定期体检。' : '') +
      (taishuiRelation.indexOf('值') >= 0 ? '本命年宜静养，避免剧烈运动。' : '') +
      (healthScore >= 4 ? '整体健康状况良好，注意日常保养即可。' : healthScore >= 3 ? '健康一般，注意作息规律。' : '健康需重点关注，避免过劳，及时就医。'),
    yi: healthScore >= 4 ? ['规律运动', '均衡饮食', '充足睡眠'] : ['定期体检', '适度运动', '调节情绪'],
    ji: healthScore >= 4 ? ['熬夜', '暴饮暴食'] : ['过度劳累', '熬夜', '忽视小病', '剧烈运动'],
    keyMonths: healthScore <= 3 ? [1, 6, 12] : [4, 10]
  });

  // ── 维度5: 学业 ──
  var studyScore = lnRelation === '生我' ? 5 : (lnRelation === '比和' ? 4 : (lnRelation === '我生' ? 3 : (lnRelation === '克我' ? 2 : 4)));
  dims.push({
    key: 'study',
    name: '学业',
    icon: '📚',
    stars: studyScore,
    analysis: '印星「' + (lnGanShen === '正印' || lnGanShen === '偏印' ? lnGanShen : '受流年十神' + lnGanShen + '影响') + '」主导学业。' +
      '长生十二宫处于「' + lnDishi + '」位。' +
      (studyScore >= 4 ? '学业运势佳，领悟力强，考试顺利。' : studyScore >= 3 ? '学业平稳，需勤奋努力。' : '学业有压力，需调整方法，坚持不懈。'),
    yi: studyScore >= 4 ? ['深入钻研', '参加竞赛', '考证进修'] : ['制定计划', '请教老师', '循序渐进'],
    ji: studyScore >= 4 ? ['骄傲懈怠', '浅尝辄止'] : ['拖延', '死记硬背', '分心杂事'],
    keyMonths: [3, 6, 9, 12]
  });

  // ── 维度6: 人际 ──
  var socialScore = lnRelation === '生我' ? 5 : (lnRelation === '比和' ? 5 : (lnRelation === '克我' ? 2 : 3));
  dims.push({
    key: 'social',
    name: '人际',
    icon: '🤝',
    stars: socialScore,
    analysis: '流年十神「' + lnGanShen + '」影响人际交往。' +
      (taishuiRelation.indexOf('合') >= 0 ? '合太岁年人缘极佳，贵人多。' : '') +
      (taishuiRelation.indexOf('刑') >= 0 ? '刑太岁易有口舌是非，宜忍让。' : '') +
      (socialScore >= 4 ? '人际关系和谐，贵人相助。' : socialScore >= 3 ? '人际平稳，注意沟通方式。' : '人际易有摩擦，宜低调行事，少管闲事。'),
    yi: socialScore >= 4 ? ['参加活动', '结交良师益友', '助人为乐'] : ['真诚待人', '避免是非', '多听少说'],
    ji: socialScore >= 4 ? ['结交损友', '言而无信'] : ['背后议论', '争强好胜', '介入纠纷'],
    keyMonths: socialScore >= 4 ? [2, 5, 8] : [4, 7]
  });

  // ── 维度7: 家宅 ──
  var homeScore = taishuiRelation.indexOf('冲') >= 0 ? 2 : (taishuiRelation.indexOf('值') >= 0 ? 3 : (taishuiRelation.indexOf('合') >= 0 ? 5 : 4));
  dims.push({
    key: 'home',
    name: '家宅',
    icon: '🏠',
    stars: homeScore,
    analysis: '太岁「' + taishuiDesc + '」。日支「' + dayBranchZhi + '」与太岁「' + taishuiZhi + '」：' + taishuiRelation + '。' +
      (homeScore >= 4 ? '家宅安宁，宜装修搬迁。' : homeScore >= 3 ? '家宅平稳，注意长辈健康。' : '家宅易有变动，宜安泰，避免大动土木。'),
    yi: homeScore >= 4 ? ['家居整理', '添置吉物', '家庭聚会'] : ['祭祖祈福', '安奉太岁', '保持整洁'],
    ji: homeScore >= 4 ? ['大动土木', '忽视长辈'] : ['搬家', '装修', '家庭争吵'],
    keyMonths: homeScore <= 3 ? [1, 7] : [5, 10]
  });

  // ── 维度8: 出行 ──
  var travelScore = lnRelation === '克我' ? 2 : (taishuiRelation.indexOf('冲') >= 0 ? 3 : (lnRelation === '生我' ? 5 : 4));
  dims.push({
    key: 'travel',
    name: '出行',
    icon: '✈️',
    stars: travelScore,
    analysis: '流年地支「' + lnZhi + '」主出行方位。' +
      (travelScore >= 4 ? '出行运佳，出差旅游皆有利。' : travelScore >= 3 ? '出行平稳，注意安全。' : '出行需谨慎，避免远行。'),
    yi: travelScore >= 4 ? ['商务出行', '旅游度假', '外出学习'] : ['近郊休闲', '结伴出行', '购买保险'],
    ji: travelScore >= 4 ? ['冒险运动', '单独远行'] : ['长途驾车', '夜间出行', '高危地区'],
    keyMonths: travelScore >= 4 ? [4, 7, 10] : [1, 6]
  });

  // ── 维度9: 风水 ──
  var fengshuiScore = 4;
  var fengshuiAnalysis = '三元九运：' + yuanYun.yuan + '·' + yuanYun.name + '（' + yuanYun.star + '），大运第' + yuanYun.yunYear + '年。';
  if (fengshuiReport && fengshuiReport.directionImpact) {
    var goodDirs = 0, badDirs = 0;
    for (var fi = 0; fi < fengshuiReport.directionImpact.length; fi++) {
      if (fengshuiReport.directionImpact[fi].isGood) goodDirs++;
      if (fengshuiReport.directionImpact[fi].isDanger) badDirs++;
    }
    fengshuiScore = Math.max(1, Math.min(5, 3 + goodDirs - badDirs));
    fengshuiAnalysis += '宅命分析：吉位' + goodDirs + '个，凶位' + badDirs + '个。';
    if (fengshuiReport.recommendations && fengshuiReport.recommendations.length > 0) {
      fengshuiAnalysis += '建议摆放：' + fengshuiReport.recommendations.slice(0, 3).map(function(r){return r.item;}).join('、') + '等。';
    }
  } else {
    fengshuiAnalysis += '建议关注' + yuanYun.direction + '方位，可摆放五行属' + yuanYun.wuxing + '的风水物品。';
  }
  dims.push({
    key: 'fengshui',
    name: '风水',
    icon: '🧭',
    stars: fengshuiScore,
    analysis: fengshuiAnalysis,
    yi: fengshuiScore >= 4 ? ['催旺吉位', '清理凶位', '摆放吉祥物'] : ['化解凶位', '安放化煞物品', '保持通风明亮'],
    ji: fengshuiScore >= 4 ? ['吉位堆放杂物', '凶位动土'] : ['大动土木', '忽视凶位', '乱放镜子'],
    keyMonths: [2, 5, 8, 11]
  });

  // ── 维度10: 修行 ──
  var practiceScore = lnRelation === '生我' ? 5 : (lnRelation === '比和' ? 5 : (lnRelation === '我生' ? 4 : (lnRelation === '克我' ? 3 : 4)));
  dims.push({
    key: 'practice',
    name: '修行',
    icon: '🙏',
    stars: practiceScore,
    analysis: '九运「' + yuanYun.name + '」主灵性觉醒。日主与九运「' + lnRelation + '」关系。' +
      (practiceScore >= 4 ? '修行机缘好，宜静坐冥想，读经修心。' : practiceScore >= 3 ? '修行平稳，宜日行一善，积德积福。' : '修行有考验，宜守心持戒，不急不躁。'),
    yi: practiceScore >= 4 ? ['冥想静坐', '读经抄经', '参加法会', '日行一善'] : ['持戒守心', '念佛诵经', '行善积德'],
    ji: practiceScore >= 4 ? ['执着神通', '忽视生活'] : ['心浮气躁', '迷信盲从', '急功近利'],
    keyMonths: [1, 4, 7, 10]
  });

  // ── 维度11: 太岁 ──
  var taishuiScore = taishuiRelation.indexOf('合') >= 0 ? 5 : (taishuiRelation.indexOf('平和') >= 0 ? 4 : (taishuiRelation.indexOf('值') >= 0 ? 2 : (taishuiRelation.indexOf('刑') >= 0 ? 1 : 2)));
  dims.push({
    key: 'taishui',
    name: '太岁',
    icon: '🐉',
    stars: taishuiScore,
    analysis: '流年地支「' + lnZhi + '」，' + taishuiDesc + '。' +
      '日支「' + dayBranchZhi + '」与太岁：' + taishuiRelation + '。' +
      (taishuiScore >= 4 ? '太岁关系良好，无重大冲克。' : taishuiScore >= 3 ? '太岁关系平和，注意日常言行。' : '太岁有冲克，宜安奉太岁，行善积德，避免大动作。'),
    yi: taishuiScore >= 4 ? ['正常生活', '把握机遇'] : ['安奉太岁', '穿红戴红', '拜太岁', '行善积德'],
    ji: taishuiScore >= 4 ? [] : ['远行', '大动土木', '嫁娶(冲太岁)', '投资冒险'],
    keyMonths: taishuiScore <= 3 ? [1, 6, 12] : [3, 9]
  });

  // ── 维度12: 总运 ──
  var totalScoreRaw = 0;
  for (var t = 0; t < 11; t++) totalScoreRaw += dims[t].stars;
  var totalScore = Math.round(totalScoreRaw / 11 * 10) / 10;
  var totalKeyword = '';
  if (totalScore >= 4.5) totalKeyword = '大吉之年';
  else if (totalScore >= 3.8) totalKeyword = '顺遂之年';
  else if (totalScore >= 3.0) totalKeyword = '平稳之年';
  else if (totalScore >= 2.0) totalKeyword = '挑战之年';
  else totalKeyword = '守成之年';

  // 找最佳月份和注意事项月份
  var monthScores = {};
  for (var m = 1; m <= 12; m++) monthScores[m] = 0;
  for (var d2 = 0; d2 < dims.length; d2++) {
    if (dims[d2].keyMonths) {
      for (var mk = 0; mk < dims[d2].keyMonths.length; mk++) {
        monthScores[dims[d2].keyMonths[mk]] = (monthScores[dims[d2].keyMonths[mk]] || 0) + dims[d2].stars;
      }
    }
  }
  var bestMonth = 1, bestScore = -1, cautionMonth = 1, cautionScore = 99;
  for (var mm = 1; mm <= 12; mm++) {
    if (monthScores[mm] > bestScore) { bestScore = monthScores[mm]; bestMonth = mm; }
    if (monthScores[mm] < cautionScore) { cautionScore = monthScores[mm]; cautionMonth = mm; }
  }

  dims.push({
    key: 'overall',
    name: '总运',
    icon: '🌟',
    stars: Math.round(totalScore),
    analysis: targetYear + '年（' + lnStem + lnZhi + '年）总运评分：' + totalScore + '星。' + totalKeyword + '。' +
      '流年与日主「' + lnRelationDesc + '」。' +
      '大运流年交叉：' + dayunLiunianCross + '。' +
      '太岁关系：' + taishuiRelation + '。' +
      '最佳月份：' + bestMonth + '月，需注意月份：' + cautionMonth + '月。' +
      (totalScore >= 3.5 ? '整体运势向好，宜积极进取。' : totalScore >= 2.5 ? '整体运势平稳，宜稳中求进。' : '整体运势偏弱，宜守成为主，积蓄力量。'),
    yi: totalScore >= 3.5 ? ['把握机遇', '积极行动', '拓展人脉'] : ['稳扎稳打', '修身养性', '蓄势待发'],
    ji: totalScore >= 3.5 ? ['骄傲自满', '贪多嚼不烂'] : ['盲目冒进', '好高骛远', '冲动决策'],
    keyMonths: [bestMonth, cautionMonth]
  });

  return {
    dimensions: dims,
    totalScore: totalScore,
    keyword: totalKeyword,
    bestMonth: bestMonth,
    cautionMonth: cautionMonth,
    targetYear: targetYear,
    liunian: targetLiunian ? (lnStem + lnZhi) : '',
    dayMaster: dayMasterFull,
    dayMasterEle: dayMasterEle,
    yuanYun: yuanYun.name,
    personalDayun: currentDayun ? (currentDayun.gan + currentDayun.zhi + ' (' + currentDayun.ageStart + '-' + currentDayun.ageEnd + '岁)') : ''
  };
}

/**
 * 根据会员等级返回年度预测（控制可见维度）
 * @param {object} user - { vipLevel: 'free'|'monthly'|'yearly'|'lifetime', isSuper: bool }
 * @param {object} forecast - generateAnnualForecast() 返回值
 * @returns {object} { forecast, visibleCount, lockedCount, accessLevel }
 */
function getAnnualForecastWithAccess(user, forecast) {
  if (!forecast || !forecast.dimensions) return { forecast: null, visibleCount: 0, lockedCount: 0, accessLevel: 'none' };

  var isSuper = user && user.isSuper;
  var vipLevel = user && user.vipLevel ? user.vipLevel : 'free';

  // 通达/终身/精进 → 全部可见
  if (isSuper || vipLevel === 'lifetime' || vipLevel === 'yearly') {
    return {
      forecast: forecast,
      visibleCount: forecast.dimensions.length,
      lockedCount: 0,
      accessLevel: 'full'
    };
  }

  // 常修 → 前7个可见，后5个模糊
  if (vipLevel === 'monthly') {
    return {
      forecast: forecast,
      visibleCount: 7,
      lockedCount: forecast.dimensions.length - 7,
      accessLevel: 'partial'
    };
  }

  // 非会员 → 前4个可见，后8个模糊
  return {
    forecast: forecast,
    visibleCount: 4,
    lockedCount: forecast.dimensions.length - 4,
    accessLevel: 'preview'
  };
}

/**
 * 检查年度预测推送时机（12月推送下一年度预测）
 * @returns {object} { shouldPush, pushType, targetYear, message }
 */
function checkAnnualForecastPush() {
  var now = new Date();
  var month = now.getMonth() + 1; // 1-12
  var day = now.getDate();
  var currentYear = now.getFullYear();

  // 仅在12月触发
  if (month !== 12) {
    return { shouldPush: false, pushType: null, targetYear: null, message: '非推送期（仅12月推送）' };
  }

  var targetYear = currentYear + 1;
  var pushType = null;
  var message = '';

  // 判断用户会员等级
  var userLevel = 'free';
  try {
    var data = JSON.parse(localStorage.getItem('mlbj_data') || '{}');
    if (data.user && data.user.vipLevel) userLevel = data.user.vipLevel;
    // 通达检测
    if (data.user && data.user.phone) {
      var SUPER_USERS_LOCAL = ['18511550189'];
      if (SUPER_USERS_LOCAL.indexOf(data.user.phone) >= 0) userLevel = 'super';
    }
  } catch(e) {}

  // 年度/终身/通达：直接可看，不需要推送
  if (userLevel === 'super' || userLevel === 'lifetime' || userLevel === 'yearly') {
    return {
      shouldPush: false,
      pushType: 'auto_visible',
      targetYear: targetYear,
      message: '年度/终身/通达可直接查看下一年度预测，无需推送'
    };
  }

  // 记录推送状态
  var pushKey = 'annual_forecast_push_' + targetYear;
  var pushState = {};
  try {
    pushState = JSON.parse(localStorage.getItem('annual_forecast_push_state') || '{}');
  } catch(e) {}

  // 非会员推送2次（12月初 + 12月中下旬）
  if (userLevel === 'free') {
    if (day <= 5 && !pushState[pushKey + '_1']) {
      pushType = 'first_push';
      message = targetYear + '年年度运势预测报告已生成，提前了解明年运程走向！';
      pushState[pushKey + '_1'] = Date.now();
    } else if (day >= 20 && !pushState[pushKey + '_2']) {
      pushType = 'second_push';
      message = targetYear + '年即将到来，您的年度运势预测报告尚未查看，点击查看详情！';
      pushState[pushKey + '_2'] = Date.now();
    }
  }

  // 常修推送1次（12月中旬）
  if (userLevel === 'monthly') {
    if (day >= 10 && day <= 20 && !pushState[pushKey + '_m']) {
      pushType = 'monthly_push';
      message = targetYear + '年年度运势预测已生成，会员专享前7维度详细分析，点击查看！';
      pushState[pushKey + '_m'] = Date.now();
    }
  }

  // 保存推送状态
  try {
    localStorage.setItem('annual_forecast_push_state', JSON.stringify(pushState));
  } catch(e) {}

  return {
    shouldPush: pushType !== null,
    pushType: pushType,
    targetYear: targetYear,
    message: message
  };
}

/**
 * 渲染年度预测报告HTML（含会员分级模糊控制）
 * @param {object} forecast - generateAnnualForecast() 返回值
 * @param {number} visibleCount - 可见维度数
 * @param {string} accessLevel - full|partial|preview
 * @returns {string} HTML
 */
function renderAnnualForecastHTML(forecast, visibleCount, accessLevel) {
  if (!forecast || !forecast.dimensions) return '';
  var html = '';

  // 头部摘要
  html += '<div style="text-align:center;padding:16px 0;border-bottom:1px solid rgba(201,168,76,0.15);margin-bottom:12px">';
  html += '<div style="font-size:18px;color:var(--gold);font-weight:bold;letter-spacing:2px">📋 ' + forecast.targetYear + '年年度预测报告</div>';
  html += '<div style="font-size:13px;color:var(--paper2);margin-top:6px">' + forecast.liunian + '年 · 日主' + forecast.dayMaster + ' · ' + forecast.yuanYun + '</div>';
  if (forecast.personalDayun) html += '<div style="font-size:11px;color:var(--paper3);margin-top:2px">个人大运：' + forecast.personalDayun + '</div>';
  html += '<div style="margin-top:8px"><span style="font-size:14px;color:var(--gold2)">总评：' + forecast.totalScore + '星 · ' + forecast.keyword + '</span></div>';
  html += '<div style="font-size:11px;color:var(--paper3);margin-top:4px">⭐最佳月份：' + forecast.bestMonth + '月 · ⚠️注意月份：' + forecast.cautionMonth + '月</div>';
  html += '</div>';

  // 12维度
  for (var i = 0; i < forecast.dimensions.length; i++) {
    var dim = forecast.dimensions[i];
    var isLocked = i >= visibleCount;
    var blurStyle = isLocked ? 'filter:blur(3px);-webkit-filter:blur(3px);user-select:none;pointer-events:none' : '';
    var lockOverlay = isLocked ? '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.3);border-radius:8px;z-index:10"><button onclick="showVipModal()" style="background:linear-gradient(135deg,var(--gold),var(--gold2));color:var(--ink2);border:none;padding:8px 20px;border-radius:20px;font-size:13px;font-weight:bold;cursor:pointer">🔒 解锁查看</button></div>' : '';

    html += '<div style="position:relative;background:rgba(255,255,255,0.03);border-radius:8px;padding:12px 14px;margin-bottom:10px;' + (isLocked ? 'overflow:hidden' : '') + '">';
    
    // 维度标题
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">';
    html += '<span style="font-size:14px;font-weight:bold;color:var(--gold)">' + dim.icon + ' ' + dim.name + '</span>';
    var starsStr = '';
    for (var s = 0; s < 5; s++) starsStr += s < dim.stars ? '⭐' : '☆';
    html += '<span style="font-size:11px">' + starsStr + '</span>';
    html += '</div>';

    // 维度内容（可能模糊）
    html += '<div style="' + blurStyle + '">';
    html += '<div style="font-size:12px;color:var(--paper);line-height:1.7;margin-bottom:6px">' + dim.analysis + '</div>';
    
    if (dim.yi && dim.yi.length > 0) {
      html += '<div style="font-size:11px;color:#27ae60;margin-bottom:3px">✅ 宜：' + dim.yi.join('、') + '</div>';
    }
    if (dim.ji && dim.ji.length > 0) {
      html += '<div style="font-size:11px;color:#e74c3c;margin-bottom:3px">❌ 忌：' + dim.ji.join('、') + '</div>';
    }
    if (dim.keyMonths && dim.keyMonths.length > 0) {
      html += '<div style="font-size:11px;color:var(--paper3)">📅 关键月份：' + dim.keyMonths.join('、') + '月</div>';
    }
    html += '</div>';

    // 锁定遮罩
    html += lockOverlay;
    html += '</div>';
  }

  // 底部提示
  if (accessLevel !== 'full') {
    var lockedCount = forecast.dimensions.length - visibleCount;
    html += '<div style="text-align:center;padding:12px;background:rgba(201,168,76,0.05);border-radius:8px;margin-top:8px">';
    html += '<div style="font-size:12px;color:var(--paper2);margin-bottom:6px">🔒 还有' + lockedCount + '个维度未解锁</div>';
    html += '<button onclick="showVipModal()" style="background:linear-gradient(135deg,var(--gold),var(--gold2));color:var(--ink2);border:none;padding:8px 24px;border-radius:20px;font-size:13px;font-weight:bold;cursor:pointer">👑 升级会员 · 解锁全部</button>';
    html += '</div>';
  }

  // === 年度化解方案 ===
  try {
    var ahj = getAnnualHuajie(forecast);
    if (ahj) html += ahj;
  } catch(e) { console.warn('[年度化解生成失败]', e.message); }

  return html;
}

// ═══ 年度化解方案生成 ═══
function getAnnualHuajie(forecast) {
  if (!forecast) return '';
  var targetYear = forecast.targetYear || (new Date().getFullYear() + 1);
  var dayMaster = forecast.dayMaster || '';
  var dayMasterEle = forecast.dayMasterEle || '';
  var dims = forecast.dimensions || [];
  var xiEle = forecast.xiEle || '木';

  // 从维度提取关键信息
  var careerScore = 3, wealthScore = 3, loveScore = 3, healthScore = 3;
  var careerMonths = [], wealthMonths = [];
  for (var i = 0; i < dims.length; i++) {
    if (dims[i].key === 'career') { careerScore = dims[i].stars; careerMonths = dims[i].keyMonths || []; }
    if (dims[i].key === 'wealth') { wealthScore = dims[i].stars; wealthMonths = dims[i].keyMonths || []; }
    if (dims[i].key === 'love') loveScore = dims[i].stars;
    if (dims[i].key === 'health') healthScore = dims[i].stars;
  }

  // 节气时间表
  var jieqi = {
    lichun: targetYear + '年2月4日左右（立春）',
    yushui: targetYear + '年2月19日左右（雨水）',
    jingzhe: targetYear + '年3月6日左右（惊蛰）',
    chunfen: targetYear + '年3月21日左右（春分）',
    qingming: targetYear + '年4月5日左右（清明）',
    lixia: targetYear + '年5月6日左右（立夏）',
    xiazhi: targetYear + '年6月21日左右（夏至）',
    liqiu: targetYear + '年8月8日左右（立秋）',
    qiufen: targetYear + '年9月23日左右（秋分）',
    lidong: targetYear + '年11月7日左右（立冬）',
    dongzhi: targetYear + '年12月22日左右（冬至）'
  };

  // 五行对应饰品/食物/方位
  var eleData = {
    木: { crystal: '翡翠、绿幽灵、檀木', food: '绿色蔬菜、酸味水果、绿茶', dir: '东方' },
    火: { crystal: '红玛瑙、石榴石、紫水晶', food: '红枣、红豆、苦味食物', dir: '南方' },
    土: { crystal: '黄水晶、和田玉、黄虎眼石', food: '山药、小米、南瓜', dir: '西南方' },
    金: { crystal: '白水晶、银饰、金属饰品', food: '银耳、百合、白萝卜', dir: '西方' },
    水: { crystal: '海蓝宝、黑曜石、蓝纹玛瑙', food: '黑豆、海带、黑芝麻', dir: '北方' }
  };
  var dEle = eleData[dayMasterEle] || eleData.木;
  var xiData = eleData[xiEle] || eleData.木;

  var html = '<div style="margin-top:20px;padding:20px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:12px">';
  html += '<h4 style="text-align:center;color:var(--gold);letter-spacing:4px;margin-bottom:16px;font-family:\'Ma Shan Zheng\',serif">🛡️ ' + targetYear + '年化解方案 · 明确时间表与操作指南</h4>';
  html += '<div style="text-align:center;font-size:12px;color:var(--paper3);margin-bottom:16px;letter-spacing:3px">知命 · 改运 · 修心持善守静</div>';

  // ═══════ 1. 事业化解（含节气时间表+操作步骤+物品清单） ═══════
  html += '<div style="margin-bottom:16px;padding:14px;background:rgba(41,128,185,0.06);border-left:3px solid #2980b9;border-radius:0 8px 8px 0">';
  html += '<h5 style="color:#2980b9;margin-bottom:10px">💼 事业化解</h5>';
  if (careerScore <= 2) {
    html += '<div style="font-size:12px;color:var(--cinn2);margin-bottom:8px">⚠️ 事业运较弱，需主动化解：</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
    html += '<b>📋 需准备物品：</b>黑曜石柱×1、白水晶球×1、绿植×1盆、深色正装<br>';
    html += '<b>🧭 化解方位：</b>办公室正北方（官星位）+ 西北方（贵人位）<br>';
    html += '<b>⏰ 化解时间表（按节气）：</b></div>';
    html += '<ul style="font-size:12px;color:var(--paper2);line-height:2;padding-left:16px">';
    html += '<li><b>立春（2月4日）</b>：第1步——在办公室正北方放黑曜石柱化事业压力；第2步——穿深色正装增威信；第3步——面向正北方默念事业目标7遍</li>';
    html += '<li><b>惊蛰（3月6日）</b>：第1步——主动学习新技能补竞争力；第2步——佩戴白水晶柱增强专注力；第3步——办公桌左手位放绿植挡煞</li>';
    html += '<li><b>立夏（5月6日）</b>：事业上易有口舌，宜静不宜动——不宜此期跳槽或创业；佩戴' + dEle.crystal + '护身</li>';
    html += '<li><b>立秋（8月8日）</b>：事业回暖期——第1步把握机会争取升迁；第2步佩戴金属饰品增强决断力；第3步向西北方焚香祈贵人</li>';
    html += '<li><b>秋分（9月23日）</b>：事业黄金期——重点突破，提交升迁申请；穿' + (xiEle === '木' ? '绿色' : xiEle === '火' ? '红色' : xiEle === '土' ? '黄色' : xiEle === '金' ? '白色' : '蓝色') + '正装</li>';
    html += '<li><b>立冬（11月7日）</b>：年终收尾——多与领导沟通总结；办公室西北方挂山水画增贵人</li>';
    html += '</ul>';
  } else if (careerScore >= 4) {
    html += '<div style="font-size:12px;color:var(--jade2);margin-bottom:8px">✅ 事业运较好，顺势而为：</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
    html += '<b>📋 需准备物品：</b>文昌塔×1、黄虎眼石手链×1、绿植×1盆<br>';
    html += '<b>🧭 催旺方位：</b>办公室东南方（文昌位）+ 日干贵人方<br>';
    html += '<b>⏰ 操作步骤（按节气）：</b></div>';
    html += '<ul style="font-size:12px;color:var(--paper2);line-height:2;padding-left:16px">';
    if (careerMonths.length > 0) html += '<li><b>' + careerMonths.join('月、') + '月</b>是事业黄金期——第1步重点突破项目；第2步佩戴黄虎眼石增强气场；第3步主动向领导汇报成果</li>';
    html += '<li><b>立春（2月4日）</b>：在办公室东南方放文昌塔，促进升迁考核</li>';
    html += '<li><b>每月初九</b>：向东南方焚香祈福，增强事业贵人运</li>';
    html += '<li><b>秋分（9月23日）</b>：提交升迁申请最佳时机</li>';
    html += '</ul>';
  } else {
    html += '<div style="font-size:12px;color:var(--amber);margin-bottom:8px">事业运平稳，保持节奏：</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
    html += '<b>📋 需准备物品：</b>' + dEle.crystal + '（饰品）<br>';
    html += '<b>🧭 催旺方位：</b>喜用神方位（' + xiData.dir + '）<br>';
    html += '<b>⏰ 操作步骤：</b></div>';
    html += '<ul style="font-size:12px;color:var(--paper2);line-height:2;padding-left:16px">';
    html += '<li><b>春分（3月21日）</b>：关键节点——提前准备，佩戴' + dEle.crystal + '增强日主</li>';
    html += '<li><b>秋分（9月23日）</b>：第二个关键节点——稳步推进，办公桌保持整洁有序</li>';
    html += '</ul>';
  }
  html += '</div>';

  // ═══════ 2. 财运化解（含节气时间表+操作步骤+物品清单） ═══════
  html += '<div style="margin-bottom:16px;padding:14px;background:rgba(201,168,76,0.06);border-left:3px solid var(--gold);border-radius:0 8px 8px 0">';
  html += '<h5 style="color:var(--gold);margin-bottom:10px">💰 财运化解</h5>';
  if (wealthScore <= 2) {
    html += '<div style="font-size:12px;color:var(--cinn2);margin-bottom:8px">⚠️ 财运偏弱，重点堵漏：</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
    html += '<b>📋 需准备物品：</b>聚宝盆×1、五帝钱×1串、黄水晶球×1、棕色钱包×1<br>';
    html += '<b>🧭 化解方位：</b>大门对角线明财位 + 日干财位<br>';
    html += '<b>⏰ 堵漏时间表（按节气）：</b></div>';
    html += '<ul style="font-size:12px;color:var(--paper2);line-height:2;padding-left:16px">';
    html += '<li><b>立春前（2月3日）</b>：第1步——在居家大门对角线明财位放聚宝盆+五帝钱；第2步——换棕色/黄色钱包；第3步——设每月自动转存强制储蓄</li>';
    html += '<li><b>春分（3月21日）</b>：理财规划期——梳理收支，制定全年预算</li>';
    html += '<li><b>立夏-夏至（5月-6月）</b>：财运最弱期——不宜投资、不借钱、不做担保；佩戴黄水晶聚宝盆锁财</li>';
    html += '<li><b>立秋（8月8日）</b>：财运回升期——第1步可小额稳健理财；第2步佩戴黄虎眼石手链；第3步向东南方焚香祈福</li>';
    html += '<li><b>秋分-寒露（9月-10月）</b>：第2次理财窗口——稳健配置，忌贪快钱</li>';
    html += '<li><b>立冬-冬至（11月-12月）</b>：年终结账期——注意防被盗骗；钱包内放五帝钱；灶台保持干净（灶为财库）</li>';
    html += '<li><b>全年</b>：每月发工资当天存一笔定期；厨房灶台保持干净</li>';
    html += '</ul>';
  } else if (wealthScore >= 4) {
    html += '<div style="font-size:12px;color:var(--jade2);margin-bottom:8px">✅ 财运较好，把握时机：</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
    html += '<b>📋 需准备物品：</b>黄水晶聚宝盆×1、黄虎眼石手链×1、三足金蟾×1、五帝钱×1串<br>';
    html += '<b>🧭 催旺方位：</b>明财位 + 日干财位 + 正南方（偏财位）<br>';
    html += '<b>⏰ 操作步骤（按节气）：</b></div>';
    html += '<ul style="font-size:12px;color:var(--paper2);line-height:2;padding-left:16px">';
    if (wealthMonths.length > 0) html += '<li><b>' + wealthMonths.join('月、') + '月</b>财运黄金期——第1步重点投资理财；第2步佩戴黄虎眼石手链；第3步在财位焚香祈福</li>';
    html += '<li><b>惊蛰（3月6日）</b>：正财月——做理财规划，居家东南方放黄水晶球</li>';
    html += '<li><b>夏至（6月21日）</b>：偏财月——正南方放三足金蟾（头朝室内），可小额尝试投资</li>';
    html += '<li><b>秋分（9月23日）</b>：正财月——第2轮理财规划</li>';
    html += '<li><b>冬至（12月22日）</b>：偏财月——年终结账，检查全年财务</li>';
    html += '<li><b>全年</b>：每月初九向东南方焚香祈福；财位保持整洁明亮</li>';
    html += '</ul>';
  } else {
    html += '<div style="font-size:12px;color:var(--amber);margin-bottom:8px">财运平稳，稳健为主：</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
    html += '<b>📋 需准备物品：</b>黄水晶球×1、聚宝盆×1<br>';
    html += '<b>🧭 催旺方位：</b>明财位<br>';
    html += '<b>⏰ 操作步骤：</b></div>';
    html += '<ul style="font-size:12px;color:var(--paper2);line-height:2;padding-left:16px">';
    html += '<li><b>春分（3月21日）</b>：理财规划期——佩戴黄水晶增强财气</li>';
    html += '<li><b>秋分（9月23日）</b>：第2轮规划——稳健投资，不贪快钱</li>';
    html += '<li><b>全年</b>：居家财位放聚宝盆，每月定期储蓄</li>';
    html += '</ul>';
  }
  html += '</div>';

  // ═══════ 3. 感情化解（含节气时间表+操作步骤） ═══════
  html += '<div style="margin-bottom:16px;padding:14px;background:rgba(231,76,60,0.06);border-left:3px solid #e74c3c;border-radius:0 8px 8px 0">';
  html += '<h5 style="color:#e74c3c;margin-bottom:10px">💕 感情化解</h5>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
  html += '<b>📋 需准备物品：</b>粉水晶球×1、粉色花瓶+鲜花×1、红绳脚链×1<br>';
  html += '<b>🧭 催旺方位：</b>日干桃花位 + 流年桃花位（' + targetYear + '年' + (targetYear === 2026 ? '正西' : '正东') + '）</div>';
  html += '<ul style="font-size:12px;color:var(--paper2);line-height:2;padding-left:16px">';
  if (loveScore <= 2) {
    html += '<li><b>雨水-惊蛰（2月-3月）</b>：桃花月——第1步在卧室桃花位放粉色花瓶+9朵鲜花；第2步佩戴粉水晶手链；第3步红绳系腕</li>';
    html += '<li><b>立夏-夏至（5月-6月）</b>：感情易有矛盾——卧室避免放干花假花；镜子不可对床；穿暖色衣物</li>';
    html += '<li><b>白露-秋分（9月-10月）</b>：感情回暖期——多参加社交活动，穿粉色/红色系衣物增气场</li>';
    html += '<li><b>全年</b>：床头朝喜用方位；忌放尖锐物品；卧室保持温馨整洁</li>';
  } else if (loveScore >= 4) {
    html += '<li><b>雨水-惊蛰（2月-3月）</b>：感情运最旺——单身者积极相亲；已婚者增进感情</li>';
    html += '<li><b>全年</b>：佩戴粉水晶稳固感情；卧室西南方放鸳鸯摆件</li>';
  } else {
    html += '<li><b>雨水-惊蛰（2月-3月）</b>：桃花月——可主动出击，佩戴粉水晶增强异性缘</li>';
    html += '<li><b>全年</b>：卧室保持整洁温馨，床头朝吉方</li>';
  }
  html += '</ul>';
  html += '</div>';

  // ═══════ 4. 健康化解（含节气时间表+操作步骤） ═══════
  html += '<div style="margin-bottom:16px;padding:14px;background:rgba(39,174,96,0.06);border-left:3px solid #27ae60;border-radius:0 8px 8px 0">';
  html += '<h5 style="color:#27ae60;margin-bottom:10px">🏥 健康化解</h5>';
  var healthTip = dayMasterEle === '木' ? '肝胆系统，忌熬夜动怒，春季多运动排毒' : dayMasterEle === '火' ? '心血管眼睛，忌过劳激动，夏季注意静心' : dayMasterEle === '土' ? '脾胃消化，忌暴饮饮食，注意饮食规律' : dayMasterEle === '金' ? '呼吸系统，忌抽烟雾霾，秋季注意润肺' : '肾膀胱，忌久坐憋尿，冬季注意保暖';
  var healthCrystal = dayMasterEle === '木' ? '翡翠养肝' : dayMasterEle === '火' ? '红玛瑙养心' : dayMasterEle === '土' ? '和田玉养胃' : dayMasterEle === '金' ? '白水晶养肺' : '黑曜石养肾';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
  html += '<b>📋 需准备物品：</b>本命佛×1、' + healthCrystal + '饰品×1、艾灸套装×1<br>';
  html += '<b>🧭 化解方位：</b>床头朝喜用方位（' + xiData.dir + '）；家中东方放绿植<br>';
  html += '<b>⏰ 操作步骤（按节气）：</b></div>';
  html += '<ul style="font-size:12px;color:var(--paper2);line-height:2;padding-left:16px">';
  if (healthScore <= 2) {
    html += '<li><b>立春（2月4日）</b>：第1步——去寺庙祈福消灾；第2步——佩戴本命佛+黑曜石挡灾；第3步——床头调整朝向吉方</li>';
    html += '<li><b>全年</b>：重点防' + healthTip + '</li>';
    html += '<li><b>春分/夏至/秋分/冬至</b>（换季时）：注意体检，佩戴' + healthCrystal + '</li>';
    html += '<li><b>夏至（6月21日）</b>：火最旺时注意静心，避免过劳</li>';
    html += '<li><b>冬至（12月22日）</b>：阴极阳生——去寺庙祈福；床头朝吉方忌朝西；艾灸关元、足三里养生</li>';
  } else {
    html += '<li><b>全年</b>：保持规律作息，适度运动，佩戴' + healthCrystal + '养生</li>';
    html += '<li><b>春分/秋分</b>（换季时）：注意增减衣物，规律体检</li>';
    html += '<li><b>冬至（12月22日）</b>：艾灸养生，去寺庙祈福</li>';
  }
  html += '</ul>';
  html += '</div>';

  // ═══════ 4.5 三元九运运星影响 ═══════
  var annualYY = getCurrentYuanYun(targetYear);
  var annualRel = _sanyuanWxRelation(dayMasterEle, annualYY.wuxing);
  var annualRelDesc = '';
  if (annualRel === '生我') annualRelDesc = '运星生扶日主，此年贵人多助，事业順遂';
  else if (annualRel === '我生') annualRelDesc = '日主泄于运星，此年付出较多，需注意精力管理';
  else if (annualRel === '克我') annualRelDesc = '运星克日主，此年压力较大，宜守不宜攻';
  else if (annualRel === '我克') annualRelDesc = '日主克运星为财，此年财运旺，把握机遇';
  else annualRelDesc = '比和稳固，此年顺势而为';

  // 流年飞星与运星叠加分析
  var liunianStar = (targetYear - 2000) % 9;
  if (liunianStar === 0) liunianStar = 9;
  var starNames = {1:'一白',2:'二黑',3:'三碧',4:'四绿',5:'五黄',6:'六白',7:'七赤',8:'八白',9:'九紫'};
  var starElements = {1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'};
  var lnStarName = starNames[liunianStar] || '九紫';
  var lnStarEle = starElements[liunianStar] || '火';
  var stackRel = _sanyuanWxRelation(lnStarEle, annualYY.wuxing);
  var stackDesc = '';
  if (stackRel === '比和') stackDesc = '流年飞星与运星比和，能量叠加，运势加强';
  else if (stackRel === '生我') stackDesc = '流年飞星生运星，能量被生扶，此年大吉';
  else if (stackRel === '我生') stackDesc = '运星生流年飞星，能量被消耗，需注意保守';
  else if (stackRel === '克我') stackDesc = '流年飞星克运星，能量冲突，此年多变动';
  else if (stackRel === '我克') stackDesc = '运星克流年飞星，能量被制，此年可控财';

  // 运星行业趋势
  var yunIndustry = annualYY.data ? annualYY.data.industries : '文化教育、科技创新、新能源';

  html += '<div style="margin-bottom:16px;padding:14px;background:rgba(231,76,60,0.06);border-left:3px solid #e74c3c;border-radius:0 8px 8px 0">';
  html += '<h5 style="color:#e74c3c;margin-bottom:10px">🔥 三元九运运星影响</h5>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:2;margin-bottom:10px">';
  html += '<b>当前运星：</b>' + annualYY.name + '（' + annualYY.yuan + ' · ' + annualYY.star + ' · ' + annualYY.wuxing + '行）<br>';
  html += '<b>大运第几年：</b>第' + annualYY.yunYear + '/20年<br>';
  html += '<b>对日主' + dayMaster + '(' + dayMasterEle + ')影响：</b>' + annualRelDesc + '<br>';
  html += '<b>' + targetYear + '年流年飞星：</b>' + lnStarName + '(' + lnStarEle + '行)<br>';
  html += '<b>飞星与运星叠加：</b>' + stackDesc + '<br>';
  html += '<b>运星行业趋势：</b>' + yunIndustry;
  html += '</div>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;padding:8px 10px;background:rgba(231,76,60,0.03);border-radius:6px">';
  html += '💡 九紫离火运期间(2024-2043)，正南方为正神位宜催旺（红色/紫色饰品），正北方为零神位宜化解（黑曜石/金属饰品）。' + targetYear + '年流年' + lnStarName + '星飞临之方位亦需关注：若与运星同方位则能量叠加，若冲克则需化解。';
  html += '</div>';
  html += '</div>';

  // ═══════ 5. 年度化解时间表汇总（按节气） ═══════
  html += '<div style="padding:14px;background:rgba(201,168,76,0.06);border-radius:10px;border:1px solid rgba(201,168,76,0.15)">';
  html += '<div style="font-size:13px;color:var(--gold);margin-bottom:10px">📅 ' + targetYear + '年化解时间表（按节气）</div>';
  html += '<table style="width:100%;font-size:11px;color:var(--paper2);line-height:1.8">';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;width:120px;color:var(--gold)">立春（2月4日）</td><td>全年第一步：设财位聚宝盆、事业防压力、去寺庙祈福、调整卧室方位</td></tr>';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;color:var(--gold)">惊蛰（3月6日）</td><td>桃花月催姻缘、事业学习期、理财规划</td></tr>';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;color:var(--gold)">春分（3月21日）</td><td>关键节点：提交申请、学习新技能、健康体检</td></tr>';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;color:var(--gold)">立夏（5月6日）</td><td>事业压力期宜静、财运弱不宜投资、防感情矛盾</td></tr>';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;color:var(--gold)">夏至（6月21日）</td><td>火最旺时注意静心健康、偏财月可小额操作</td></tr>';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;color:var(--gold)">立秋（8月8日）</td><td>事业回暖期争取升迁、财运回升投资理财、感情回暖</td></tr>';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;color:var(--gold)">秋分（9月23日）</td><td>事业黄金期、第2轮理财窗口、换季体检</td></tr>';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;color:var(--gold)">立冬（11月7日）</td><td>年终收尾、防骗防盗、与领导沟通总结</td></tr>';
  html += '<tr style="border-bottom:1px solid rgba(201,168,76,0.1)"><td style="padding:4px;color:var(--gold)">冬至（12月22日）</td><td>偏财月、年终结账、去寺庙祈福、艾灸养生</td></tr>';
  html += '</table>';
  html += '<div style="font-size:11px;color:var(--paper3);margin-top:10px;line-height:1.8">💡 化解时间表依据' + targetYear + '年二十四节气与流月五行旺衰编排，结合缘主日主' + dayMaster + '(' + dayMasterEle + ')定制。建议打印贴于书房，按节气执行。</div>';

  // ═══════ 6. 化解物品总清单 ═══════
  html += '<div style="margin-top:12px;padding:12px;background:rgba(39,174,96,0.04);border-radius:8px;border:1px solid rgba(39,174,96,0.1)">';
  html += '<div style="font-size:12px;color:var(--jade2);margin-bottom:8px">📦 ' + targetYear + '年化解物品总清单</div>';
  html += '<div style="font-size:11px;color:var(--paper2);line-height:2">';
  html += '<b>事业：</b>黑曜石柱、白水晶球、文昌塔、铜麒麟、山水画<br>';
  html += '<b>财运：</b>聚宝盆、五帝钱、黄水晶球、三足金蟾、貔貅手链、棕色钱包<br>';
  html += '<b>感情：</b>粉水晶球、粉色花瓶+鲜花、红绳脚链、鸳鸯摆件<br>';
  html += '<b>健康：</b>本命佛、' + healthCrystal + '、艾灸套装、黑曜石手链<br>';
  html += '<b>日常：</b>' + dEle.crystal + '（日主' + dayMasterEle + '行饰品）、' + xiData.crystal + '（喜用' + xiEle + '行饰品）';
  html += '</div></div>';

  html += '</div>'; // close container
  return html;
}

// 全局暴露 - 年度预测
try { window.generateAnnualForecast = generateAnnualForecast; } catch(e) {}
try { window.getAnnualForecastWithAccess = getAnnualForecastWithAccess; } catch(e) {}
try { window.checkAnnualForecastPush = checkAnnualForecastPush; } catch(e) {}
try { window.renderAnnualForecastHTML = renderAnnualForecastHTML; } catch(e) {}

// 全局暴露
try { window.SANYUAN_JIUYUN = SANYUAN_JIUYUN; } catch(e) {}
try { window.getCurrentYuanYun = getCurrentYuanYun; } catch(e) {}
try { window.generateSanyuanForecast = generateSanyuanForecast; } catch(e) {}
try { window.renderSanyuanForecast = renderSanyuanForecast; } catch(e) {}
try { window.JIU_ZI_LI_HUO_GUIDE = JIU_ZI_LI_HUO_GUIDE; } catch(e) {}



// ═══ loadingOverlay 安全保险 ═══
// 防止排盘函数异常导致overlay卡住
(function(){
  // 定时检查: 如果loadingOverlay可见超过10秒, 强制隐藏
  setInterval(function(){
    try {
      var ov = document.getElementById('loadingOverlay');
      if (ov && ov.classList.contains('visible')) {
        if (!_overlayShown) _overlayShown = Date.now();
        if (Date.now() - _overlayShown > 10000) {
          console.warn('[安全] loadingOverlay 卡住超过10秒, 强制隐藏');
          ov.classList.remove('visible');
          _overlayShown = 0;
        }
      } else {
        _overlayShown = 0;
      }
    } catch(e) {}
  }, 2000);
})();

// ═══ 排盘引擎函数全局暴露（确保所有onclick可调用）═══
// 直接引用顶层函数声明，赋值到window确保全局可访问
try { window.computeQimen = computeQimen; } catch(e){}
try { window._qmGetMaXing = _qmGetMaXing; } catch(e){}
try { window._qmGetKongWang = _qmGetKongWang; } catch(e){}
try { window._qmCheckWuBuYuShi = _qmCheckWuBuYuShi; } catch(e){}
try { window.getQimenReadingV2 = getQimenReadingV2; } catch(e){}
try { window._qmFormatGeju = _qmFormatGeju; } catch(e){}
try { window._qmIsYangDun = _qmIsYangDun; } catch(e){}
try { window.computeZiWei = computeZiWei; } catch(e){}
try { window.computeMingGongIdx = computeMingGongIdx; } catch(e){}
try { window.computeMeiHua = computeMeiHua; } catch(e){}
try { window.computeLiuRen = computeLiuRen; } catch(e){}
try { window.yjStart = yjStart; } catch(e){}
try { window.computeBazi = computeBazi; } catch(e){}
try { window.renderNewBaziModules = renderNewBaziModules; } catch(e){}
try { window.generateInterpretation = generateInterpretation; } catch(e){}
try { window.getBaziDimensionHTML = getBaziDimensionHTML; } catch(e){}
try { window.getYearStemBranchExact = getYearStemBranchExact; } catch(e){}
try { window.getDayStemIndex = getDayStemIndex; } catch(e){}
try { window.getMonthBranchBySolar = getMonthBranchBySolar; } catch(e){}
try { window.getMonthStem = getMonthStem; } catch(e){}
try { window.getHourStem = getHourStem; } catch(e){}
try { window.trueSolarTimeCorrection = trueSolarTimeCorrection; } catch(e){}
try { window.lunarToSolar = lunarToSolar; } catch(e){}
try { window.computeDayun = computeDayun; } catch(e){}
try { window.computeHuajie = computeHuajie; } catch(e){}
try { window.computeFengshui = computeFengshui; } catch(e){}
try { window.computeFloorRecommend = computeFloorRecommend; } catch(e){}
try { window.frToggleCalendar = frToggleCalendar; } catch(e){}
try { window.runHetuAnalysis = runHetuAnalysis; } catch(e){}
try { window.playDivinationSound = playDivinationSound; } catch(e){}

// ════════════════════════════════════════════════════════
//  缘主信息持久化 - 自动填充排盘工具 + 信息管理
// ════════════════════════════════════════════════════════

/**
 * 自动填充排盘工具的输入框
 * @param {string} toolName - 工具名称: bazi/qimen/ziwei/liuren/meihua/yangzhai
 */
function autoFillUserBazi(toolName) {
  try {
    var raw = localStorage.getItem('userBazi');
    if (!raw) { return; }
    var bazi = JSON.parse(raw);
    if (!bazi || !bazi.name) return;

    // ═══ 1小时时效检查 ═══
    var now = Date.now();
    var timestamp = bazi.timestamp || 0;
    var ONE_HOUR = 3600000; // 1小时=3600000ms
    var isExpired = timestamp && (now - timestamp > ONE_HOUR);

    // 构造出生日期字符串
    var dateStr = '';
    if (bazi.year && bazi.month && bazi.day) {
      var mm = String(bazi.month).padStart(2, '0');
      var dd = String(bazi.day).padStart(2, '0');
      dateStr = bazi.year + '-' + mm + '-' + dd;
    }
    // 构造时辰值
    var hourVal = bazi.hour !== undefined ? String(bazi.hour) : '';

    var fieldMap = {
      bazi:    { name: 'baziName', date: 'baziDate', hour: 'baziHour', sex: 'baziSex' },
      qimen:   { name: 'qmName', date: 'qmDate', hour: 'qmHour', sex: null },
      ziwei:   { name: 'zwName', date: 'zwDate', hour: 'zwHour', sex: 'zwSex' },
      liuren:  { name: 'lrName', date: 'lrDate', hour: 'lrHour', sex: null },
      meihua:  { name: 'mhName', date: null, hour: null, sex: null },
      yangzhai:{ name: 'yzpName', date: 'yzpBirthDate', hour: null, sex: 'yzpSex', birthCity: 'yzpBirthCity', liveCity: 'yzpLiveCity' },
      family:  { name: 'famMemName', date: 'famMemDate', hour: 'famMemHour', sex: 'famMemSex' }
    };

    var m = fieldMap[toolName];
    if (!m) return;

    if (isExpired) {
      // 超过1小时：不自动填充，但显示提示条
      showAutoFillHint(toolName, bazi, false);
      return;
    }

    // 1小时内：自动填充（不覆盖已有值）
    if (m.name) { var el = document.getElementById(m.name); if (el && !el.value) el.value = bazi.name || ''; }
    if (m.date && dateStr) { var el2 = document.getElementById(m.date); if (el2 && !el2.value) el2.value = dateStr; }
    if (m.hour && hourVal) { var el3 = document.getElementById(m.hour); if (el3 && !el3.value) el3.value = hourVal; }
    if (m.sex && bazi.sex) { var el4 = document.getElementById(m.sex); if (el4 && !el4.value) el4.value = bazi.sex; }
    if (m.birthCity && bazi.birthCity) { var el5 = document.getElementById(m.birthCity); if (el5 && !el5.value) el5.value = bazi.birthCity; }
    if (m.liveCity && bazi.residenceCity) { var el6 = document.getElementById(m.liveCity); if (el6 && !el6.value) el6.value = bazi.residenceCity; }

    // 显示自动填充提示条
    showAutoFillHint(toolName, bazi, true);
  } catch(e) {
    console.warn('[autoFillUserBazi] 填充失败:', e.message);
  }
}

/**
 * 显示自动填充提示条
 * @param {string} toolName - 工具名称
 * @param {object} bazi - 缘主信息
 * @param {boolean} autoFilled - 是否已自动填充
 */
function showAutoFillHint(toolName, bazi, autoFilled) {
  try {
    var containerIds = {
      bazi: 'section-bazi',
      qimen: 'zhanbuSub-qimen',
      ziwei: 'zhanbuSub-ziwei',
      liuren: 'zhanbuSub-liuren',
      meihua: 'zhanbuSub-meihua',
      yangzhai: 'section-fengshui',
      family: 'section-family'
    };
    var containerId = containerIds[toolName];
    if (!containerId) return;
    var container = document.getElementById(containerId);
    if (!container) return;

    // 移除已有提示条
    var existing = container.querySelector('.autofill-hint-bar');
    if (existing) existing.remove();

    var hintId = 'autofill-hint-' + toolName;
    var dateStr = '';
    if (bazi.year && bazi.month && bazi.day) {
      dateStr = bazi.year + '-' + String(bazi.month).padStart(2,'0') + '-' + String(bazi.day).padStart(2,'0');
    }

    var hint = document.createElement('div');
    hint.className = 'autofill-hint-bar';
    hint.id = hintId;
    hint.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:8px;padding:8px 14px;margin:8px 0;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:8px;font-size:12px;color:var(--paper2);animation:fadeIn .3s ease';

    if (autoFilled) {
      hint.innerHTML = '<span>💡 检测到您1小时内的排盘记录（' + (bazi.name||'') + '·' + dateStr + '），已自动填充</span>';
    } else {
      hint.innerHTML = '<span>📋 检测到过期排盘记录（' + (bazi.name||'') + '·' + dateStr + '），点击填充</span>';
      var fillBtn = document.createElement('button');
      fillBtn.textContent = '填充上次信息';
      fillBtn.style.cssText = 'padding:4px 12px;font-size:11px;background:rgba(201,168,76,0.15);border:1px solid rgba(201,168,76,0.3);color:var(--gold);border-radius:4px;cursor:pointer;white-space:nowrap';
      fillBtn.onclick = function(e) {
        e.preventDefault();
        forceFillUserBazi(toolName);
        showToast('已填充缘主「' + (bazi.name||'') + '」的信息');
        hint.remove();
      };
      hint.appendChild(fillBtn);
    }

    // 清除按钮
    var closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = 'background:none;border:none;color:var(--paper2);opacity:.5;cursor:pointer;font-size:16px;padding:0 4px;flex-shrink:0';
    closeBtn.onclick = function() { hint.remove(); };
    hint.appendChild(closeBtn);

    // 插入到容器顶部
    var firstChild = container.firstElementChild;
    if (firstChild) {
      container.insertBefore(hint, firstChild);
    } else {
      container.appendChild(hint);
    }
  } catch(e) {
    console.warn('[showAutoFillHint] 失败:', e.message);
  }
}

/**
 * 在排盘工具区域添加「📋 填充我的信息」按钮
 * 在页面加载后自动为各排盘工具添加按钮
 */
function injectAutoFillButtons() {
  try {
    var raw = localStorage.getItem('userBazi');
    if (!raw) return;
    var bazi = JSON.parse(raw);
    if (!bazi || !bazi.name) return;

    var tools = [
      { containerId: 'zhanbuSub-qimen', toolName: 'qimen', label: '📋 填充我的信息' },
      { containerId: 'zhanbuSub-ziwei', toolName: 'ziwei', label: '📋 填充我的信息' },
      { containerId: 'zhanbuSub-liuren', toolName: 'liuren', label: '📋 填充我的信息' },
      { containerId: 'zhanbuSub-meihua', toolName: 'meihua', label: '📋 填充我的信息' },
      { containerId: 'section-bazi', toolName: 'bazi', label: '📋 填充我的信息' },
      { containerId: 'section-fengshui', toolName: 'yangzhai', label: '📋 填充我的信息' }
    ];

    tools.forEach(function(t) {
      var container = document.getElementById(t.containerId);
      if (!container) return;
      // 检查是否已添加
      if (container.querySelector('.auto-fill-btn-' + t.toolName)) return;
      // 找到第一个 input-row 或 compute-btn
      var insertTarget = container.querySelector('.input-row') || container.querySelector('.compute-btn');
      if (!insertTarget) return;
      var btn = document.createElement('button');
      btn.className = 'compute-btn auto-fill-btn-' + t.toolName;
      btn.style.cssText = 'display:block;margin:8px auto 16px;padding:8px 20px;font-size:12px;background:rgba(201,168,76,0.12);border:1px solid rgba(201,168,76,0.3);color:var(--gold);border-radius:6px;cursor:pointer';
      btn.textContent = t.label + '（' + bazi.name + '）';
      btn.onclick = function(e) {
        e.preventDefault();
        // 强制填充（即使已有值）
        forceFillUserBazi(t.toolName);
        showToast('已填充缘主「' + bazi.name + '」的信息');
      };
      insertTarget.parentNode.insertBefore(btn, insertTarget);
    });
  } catch(e) {
    console.warn('[injectAutoFillButtons] 失败:', e.message);
  }
}

/**
 * 强制填充（覆盖已有值）
 */
function forceFillUserBazi(toolName) {
  try {
    var raw = localStorage.getItem('userBazi');
    if (!raw) return;
    var bazi = JSON.parse(raw);
    if (!bazi) return;

    var dateStr = '';
    if (bazi.year && bazi.month && bazi.day) {
      var mm = String(bazi.month).padStart(2, '0');
      var dd = String(bazi.day).padStart(2, '0');
      dateStr = bazi.year + '-' + mm + '-' + dd;
    }
    var hourVal = bazi.hour !== undefined ? String(bazi.hour) : '';

    var fieldMap = {
      bazi:    { name: 'baziName', date: 'baziDate', hour: 'baziHour', sex: 'baziSex' },
      qimen:   { name: 'qmName', date: 'qmDate', hour: 'qmHour', sex: null },
      ziwei:   { name: 'zwName', date: 'zwDate', hour: 'zwHour', sex: 'zwSex' },
      liuren:  { name: 'lrName', date: 'lrDate', hour: 'lrHour', sex: null },
      meihua:  { name: 'mhName', date: null, hour: null, sex: null },
      yangzhai:{ name: 'yzpName', date: 'yzpBirthDate', hour: null, sex: 'yzpSex', birthCity: 'yzpBirthCity', liveCity: 'yzpLiveCity' }
    };

    var m = fieldMap[toolName];
    if (!m) return;
    if (m.name) { var el = document.getElementById(m.name); if (el) el.value = bazi.name || ''; }
    if (m.date && dateStr) { var el2 = document.getElementById(m.date); if (el2) el2.value = dateStr; }
    if (m.hour && hourVal) { var el3 = document.getElementById(m.hour); if (el3) el3.value = hourVal; }
    if (m.sex && bazi.sex) { var el4 = document.getElementById(m.sex); if (el4) el4.value = bazi.sex; }
    if (m.birthCity && bazi.birthCity) { var el5 = document.getElementById(m.birthCity); if (el5) el5.value = bazi.birthCity; }
    if (m.liveCity && bazi.residenceCity) { var el6 = document.getElementById(m.liveCity); if (el6) el6.value = bazi.residenceCity; }
  } catch(e) {
    console.warn('[forceFillUserBazi] 失败:', e.message);
  }
}

/**
 * 渲染信众中心缘主信息卡片
 */
function renderUserBaziCard() {
  try {
    var raw = localStorage.getItem('userBazi');
    if (!raw) return;
    var bazi = JSON.parse(raw);
    if (!bazi || !bazi.name) return;

    var cardEl = document.getElementById('userBaziCard');
    if (!cardEl) return;

    var pillars = bazi.pillars || [];
    var pillarText = pillars.map(function(p) { return (p.stem || '') + (p.branch || ''); }).join('  ');
    var eleCount = bazi.eleCount || {};
    var eleText = Object.entries(eleCount).map(function(e) { return e[0] + ':' + e[1]; }).join('  ');
    var mingGua = bazi.mingGua || {};

    var html = '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-top:16px">';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">';
    html += '<span style="font-size:24px">👤</span>';
    html += '<span style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);letter-spacing:3px">' + bazi.name + '</span>';
    html += '<span style="font-size:12px;color:var(--paper2);opacity:.6">缘主信息卡片</span>';
    html += '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:13px;line-height:1.8">';
    html += '<div><span style="opacity:.5">日主：</span><span style="color:var(--gold)">' + (bazi.dayStem || '') + (ELE[bazi.dayStem] || '') + '</span></div>';
    html += '<div><span style="opacity:.5">生肖：</span><span>' + (bazi.zodiac || '') + '</span></div>';
    html += '<div style="grid-column:1/-1"><span style="opacity:.5">四柱：</span><span style="font-family:\'Ma Shan Zheng\',serif;font-size:15px;color:var(--gold);letter-spacing:4px">' + pillarText + '</span></div>';
    html += '<div><span style="opacity:.5">用神：</span><span style="color:#2ecc71">' + (bazi.xiEle || '') + '</span> <span style="opacity:.3">|</span> <span style="opacity:.5">忌神：</span><span style="color:#e74c3c">' + (bazi.jiEle || '') + '</span></div>';
    html += '<div><span style="opacity:.5">命卦：</span><span>' + (mingGua.guaName || '') + '卦(' + (mingGua.type || '') + ')</span></div>';
    html += '<div style="grid-column:1/-1"><span style="opacity:.5">五行分布：</span><span style="font-size:12px">' + eleText + '</span></div>';
    if (bazi.birthCity) html += '<div><span style="opacity:.5">出生城市：</span><span>' + bazi.birthCity + '</span></div>';
    if (bazi.residenceCity) html += '<div><span style="opacity:.5">现居城市：</span><span>' + bazi.residenceCity + '</span></div>';
    html += '</div>';
    html += '<div style="font-size:11px;opacity:.4;margin-top:12px;padding-top:8px;border-top:1px solid rgba(201,168,76,0.08)">📌 绑定后，各排盘工具将自动填充您的信息</div>';
    html += '</div>';
    cardEl.innerHTML = html;
    cardEl.style.display = 'block';
  } catch(e) {
    console.warn('[renderUserBaziCard] 失败:', e.message);
  }
}

/**
 * 清除缘主信息
 */
function clearUserBazi() {
  if (!confirm('确定要清除您的缘主信息吗？此操作不可撤销。')) return;
  try { localStorage.removeItem('userBazi'); } catch(e) {}
  var cardEl = document.getElementById('userBaziCard');
  if (cardEl) { cardEl.innerHTML = ''; cardEl.style.display = 'none'; }
  var manageEl = document.getElementById('userBaziManage');
  if (manageEl) manageEl.style.display = 'none';
  // 重新显示绑定表单
  var bindEl = document.getElementById('userBaziBind');
  if (bindEl) bindEl.style.display = 'block';
  showToast('缘主信息已清除');
}

/**
 * 修改缘主信息 - 跳转到八字排盘页
 */
function editUserBazi() {
  showSection('bazi');
  showToast('请在八字排盘页面重新填写信息并排盘，系统将自动更新缘主信息');
}

// 页面加载后注入自动填充按钮 + 渲染缘主卡片
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    injectAutoFillButtons();
    renderUserBaziCard();
  }, 500);
});

// 监听section切换，延迟注入按钮 + 自动填充缘主信息
var _origShowSectionWrap = null;
document.addEventListener('DOMContentLoaded', function() {
  _origShowSectionWrap = window.showSection;
  if (_origShowSectionWrap) {
    window.showSection = function(name) {
      _origShowSectionWrap(name);
      setTimeout(function() {
        injectAutoFillButtons();
        renderUserBaziCard();
        // 自动填充缘主信息到当前工具
        var toolMap = {
          'bazi': 'bazi',
          'qimen': 'qimen',
          'ziwei': 'ziwei',
          'liuren': 'liuren',
          'meihua': 'meihua',
          'fengshui': 'yangzhai',
          'family': 'family'
        };
        var tool = toolMap[name];
        if (tool) autoFillUserBazi(tool);
        // 占卜复合区的子工具也填充
        if (name === 'zhanbu') {
          autoFillUserBazi('qimen');
          autoFillUserBazi('ziwei');
          autoFillUserBazi('liuren');
          autoFillUserBazi('meihua');
        }
      }, 500);
    };
  }
});

// 暴露到全局
try { window.autoFillUserBazi = autoFillUserBazi; } catch(e){}
try { window.forceFillUserBazi = forceFillUserBazi; } catch(e){}
try { window.renderUserBaziCard = renderUserBaziCard; } catch(e){}
try { window.clearUserBazi = clearUserBazi; } catch(e){}
try { window.editUserBazi = editUserBazi; } catch(e){}
try { window.showAutoFillHint = showAutoFillHint; } catch(e){}

// ================================================================
// 家庭综合排盘系统
// ================================================================

var familyMembers = []; // 家庭成员列表
var familyMemberSeq = 0; // 成员序号

/**
 * 添加家庭成员
 */
function addFamilyPaipanMember() {
  var name = document.getElementById('famMemName').value.trim();
  var dateStr = document.getElementById('famMemDate').value;
  var hourVal = document.getElementById('famMemHour').value;
  var sex = document.getElementById('famMemSex').value;
  var relation = document.getElementById('famMemRelation').value;
  var birthCity = document.getElementById('famMemCity') ? document.getElementById('famMemCity').value.trim() : '';

  if (!name) { showToast('请输入姓名'); return; }
  if (!dateStr) { showToast('请选择出生日期'); return; }

  var parts = dateStr.split('-');
  var year = parseInt(parts[0]);
  var month = parseInt(parts[1]);
  var day = parseInt(parts[2]);
  var hour = hourVal ? parseInt(hourVal) : 12;

  if (year < 1900 || year > 2030) { showToast('出生年份不合理'); return; }

  // 检查重复
  for (var i = 0; i < familyMembers.length; i++) {
    if (familyMembers[i].name === name) {
      showToast('已有同名成员：' + name);
      return;
    }
  }

  familyMemberSeq++;
  familyMembers.push({
    id: familyMemberSeq,
    name: name,
    relation: relation || '成员',
    sex: sex,
    year: year,
    month: month,
    day: day,
    hour: hour,
    birthCity: birthCity
  });

  // 清空表单
  document.getElementById('famMemName').value = '';
  document.getElementById('famMemDate').value = '';
  document.getElementById('famMemCity').value = '';

  renderFamilyMembers();
  showToast('已添加：' + name + '（' + (relation || '成员') + '）');
}

/**
 * 删除家庭成员
 */
function removeFamilyPaipanMember(id) {
  for (var i = 0; i < familyMembers.length; i++) {
    if (familyMembers[i].id === id) {
      var name = familyMembers[i].name;
      familyMembers.splice(i, 1);
      renderFamilyMembers();
      showToast('已移除：' + name);
      return;
    }
  }
}

/**
 * 渲染家庭成员列表
 */
function renderFamilyMembers() {
  var el = document.getElementById('familyMemberList');
  if (!el) return;
  if (familyMembers.length === 0) {
    el.innerHTML = '<p style="font-size:12px;opacity:.4;text-align:center;padding:12px">暂无家庭成员，请在下方添加</p>';
    return;
  }
  var html = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px">';
  for (var i = 0; i < familyMembers.length; i++) {
    var m = familyMembers[i];
    var hourNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    html += '<div style="background:rgba(255,255,255,0.04);border:1px solid rgba(201,168,76,0.15);border-radius:8px;padding:12px;position:relative">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
    html += '<span style="font-size:14px;color:var(--gold);font-weight:bold">' + m.name + '</span>';
    html += '<button onclick="removeFamilyPaipanMember(' + m.id + ')" style="background:none;border:none;color:#e74c3c;cursor:pointer;font-size:16px;padding:0 4px">×</button>';
    html += '</div>';
    html += '<div style="font-size:11px;opacity:.7;line-height:1.6">';
    html += '<div>' + m.relation + ' · ' + (m.sex === 'male' ? '男' : '女') + '</div>';
    html += '<div>' + m.year + '年' + m.month + '月' + m.day + '日 ' + hourNames[m.hour] + '时</div>';
    if (m.birthCity) html += '<div>出生地：' + m.birthCity + '</div>';
    html += '</div></div>';
  }
  html += '</div>';
  el.innerHTML = html;
}

/**
 * 单人排盘 — 对选中成员排盘
 */
function computeSingleMemberPaipan(id) {
  var member = null;
  for (var i = 0; i < familyMembers.length; i++) {
    if (familyMembers[i].id === id) { member = familyMembers[i]; break; }
  }
  if (!member) { showToast('未找到该成员'); return; }

  try {
    var result = _computeMemberBazi(member);
    var output = document.getElementById('familyResult');
    if (!output) return;

    var html = '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-top:16px">';
    html += '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);text-align:center;margin-bottom:16px;letter-spacing:3px">' + member.name + ' · 八字排盘</h4>';
    html += _renderMemberBaziCard(result, member);
    html += '</div>';

    output.innerHTML = html;
    output.style.display = 'block';
    output.scrollIntoView({ behavior: 'smooth' });
  } catch(e) {
    showToast('排盘失败: ' + e.message);
    console.error('[单人排盘错误]', e);
  }
}

/**
 * 计算单个成员的八字信息
 */
function _computeMemberBazi(member) {
  var year = member.year;
  var month = member.month;
  var day = member.day;
  var hour = member.hour;
  var sex = member.sex;

  // 年柱
  var ysRes = getYearStemBranchExact(year, month, day, hour, 0);
  var yStem = STEMS[ysRes.stemIdx];
  var yBranch = BRANCHES[ysRes.branchIdx];
  var ysIdx = ysRes.stemIdx;
  var ybIdx = ysRes.branchIdx;

  // 月柱
  var monthBranch = getMonthBranchBySolar(year, month, day);
  var monthStemIdx = getMonthStem(ysIdx.stemIdx, monthBranch);
  var monthStem = STEMS[monthStemIdx];
  var monthBranchIdx = BRANCHES.indexOf(monthBranch);

  // 日柱
  var dayStemIdx = getDayStemIndex(year, month, day);
  var dayBranchIdx = getDayBranchIndex(year, month, day);
  var dayStem = STEMS[dayStemIdx];
  var dayBranch = BRANCHES[dayBranchIdx];

  // 时柱
  var hourBranchIdx = Math.floor(hour / 2) % 12;
  var hourBranch = BRANCHES[hourBranchIdx];
  var hourStemIdx = getHourStem(dayStemIdx, hourBranch);
  var hourStem = STEMS[hourStemIdx];

  var pillars = [
    { stem: yStem, branch: yBranch },
    { stem: monthStem, branch: monthBranch },
    { stem: dayStem, branch: dayBranch },
    { stem: hourStem, branch: hourBranch }
  ];

  // 五行统计
  var eleCount = {木:0,火:0,土:0,金:0,水:0};
  for (var i = 0; i < pillars.length; i++) {
    eleCount[ELE[pillars[i].stem]]++;
    eleCount[ZHI_ELE[pillars[i].branch]]++;
  }

  // 旺衰诊断
  var mingType = getMingType(pillars, dayStem, dayStemIdx);
  var xiEle = mingType.yongshenEle || '木';
  var jiEle = mingType.jishenEle || '金';

  // 命卦
  var mingGua = getMingGua(year, sex);

  // 生肖
  var zodiacArr = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];
  var zodiac = zodiacArr[yBranch];

  return {
    pillars: pillars,
    dayStem: dayStem,
    dayBranch: dayBranch,
    eleCount: eleCount,
    xiEle: xiEle,
    jiEle: jiEle,
    mingGua: mingGua,
    mingType: mingType,
    zodiac: zodiac,
    sex: sex
  };
}

/**
 * 渲染单个成员八字卡片
 */
function _renderMemberBaziCard(result, member) {
  var pillars = result.pillars;
  var pillarText = pillars.map(function(p) { return p.stem + p.branch; }).join('  ');
  var eleCount = result.eleCount;
  var eleText = Object.entries(eleCount).map(function(e) { return e[0] + ':' + e[1]; }).join('  ');
  var dayEle = ELE[result.dayStem];

  var html = '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:13px;line-height:1.8">';
  html += '<div><span style="opacity:.5">关系：</span><span>' + member.relation + '</span></div>';
  html += '<div><span style="opacity:.5">性别：</span><span>' + (result.sex === 'male' ? '男' : '女') + '</span></div>';
  html += '<div><span style="opacity:.5">日主：</span><span style="color:var(--gold)">' + result.dayStem + dayEle + '</span></div>';
  html += '<div><span style="opacity:.5">生肖：</span><span>' + result.zodiac + '</span></div>';
  html += '<div style="grid-column:1/-1"><span style="opacity:.5">四柱：</span><span style="font-family:\'Ma Shan Zheng\',serif;font-size:15px;color:var(--gold);letter-spacing:4px">' + pillarText + '</span></div>';
  html += '<div><span style="opacity:.5">用神：</span><span style="color:#2ecc71">' + result.xiEle + '</span> <span style="opacity:.3">|</span> <span style="opacity:.5">忌神：</span><span style="color:#e74c3c">' + result.jiEle + '</span></div>';
  html += '<div><span style="opacity:.5">命卦：</span><span>' + result.mingGua.guaName + '卦(' + result.mingGua.type + ')</span></div>';
  html += '<div style="grid-column:1/-1"><span style="opacity:.5">五行分布：</span><span style="font-size:12px">' + eleText + '</span></div>';
  html += '</div>';

  // 五行条形图
  html += '<div style="margin-top:12px">';
  var maxCount = 0;
  Object.values(eleCount).forEach(function(v) { if (v > maxCount) maxCount = v; });
  var eleColors = {木:'#27ae60',火:'#e74c3c',土:'#f39c12',金:'#95a5a6',水:'#3498db'};
  Object.keys(eleCount).forEach(function(ele) {
    var pct = maxCount > 0 ? (eleCount[ele] / maxCount * 100) : 0;
    html += '<div style="display:flex;align-items:center;gap:6px;margin:3px 0">';
    html += '<span style="width:20px;font-size:12px;opacity:.6">' + ele + '</span>';
    html += '<div style="flex:1;height:14px;background:rgba(255,255,255,0.06);border-radius:7px;overflow:hidden">';
    html += '<div style="width:' + pct + '%;height:100%;background:' + (eleColors[ele]||'#888') + ';border-radius:7px;transition:width .5s ease"></div>';
    html += '</div>';
    html += '<span style="width:16px;text-align:right;font-size:12px;opacity:.7">' + eleCount[ele] + '</span>';
    html += '</div>';
  });
  html += '</div>';

  return html;
}

/**
 * 家庭综合排盘 — 终身会员专属
 */
function computeFamilyPaipan() {
  if (familyMembers.length === 0) {
    showToast('请先添加家庭成员');
    return;
  }

  // 会员验证
  var member = JSON.parse(localStorage.getItem('memberInfo') || '{}');
  var memberLevel = member.level || 'free';

  if (memberLevel !== '明道') {
    var output = document.getElementById('familyResult');
    if (output) {
      output.innerHTML = '<div style="background:rgba(231,76,60,0.06);border:1px solid rgba(231,76,60,0.2);border-radius:12px;padding:24px;text-align:center;margin-top:16px">' +
        '<div style="font-size:40px;margin-bottom:12px">🔒</div>' +
        '<h4 style="font-size:16px;color:var(--gold);margin-bottom:8px">此功能为终身会员专属</h4>' +
        '<p style="font-size:13px;color:var(--paper2);line-height:1.8;max-width:400px;margin:0 auto">升级<strong style="color:var(--gold)">明道会员</strong>即可解锁家庭综合排盘功能，' +
        '查看家庭成员八字概览、五行分布图、相生相克分析及综合化解方案。</p>' +
        '<button class="compute-btn" onclick="showSection(\'more\');showMoreModule(\'vip\')" style="margin-top:16px;padding:10px 24px;font-size:13px;background:var(--gold);color:var(--ink);border:none;border-radius:8px;cursor:pointer">👑 了解明道会员</button>' +
        '</div>';
      output.style.display = 'block';
      output.scrollIntoView({ behavior: 'smooth' });
    }
    return;
  }

  try {
    // 计算所有成员八字
    var allResults = [];
    for (var i = 0; i < familyMembers.length; i++) {
      var result = _computeMemberBazi(familyMembers[i]);
      allResults.push({ member: familyMembers[i], bazi: result });
    }

    // 家庭五行合计
    var familyEleCount = {木:0,火:0,土:0,金:0,水:0};
    for (var j = 0; j < allResults.length; j++) {
      var ec = allResults[j].bazi.eleCount;
      Object.keys(ec).forEach(function(k) { familyEleCount[k] += ec[k]; });
    }

    // 成员间五行生克分析
    var relationAnalysis = _analyzeFamilyRelations(allResults);

    // 综合化解方案
    var solutions = _generateFamilySolutions(allResults, familyEleCount);

    // 渲染报告
    _renderFamilyReport(allResults, familyEleCount, relationAnalysis, solutions);
  } catch(e) {
    showToast('家庭排盘失败: ' + e.message);
    console.error('[家庭排盘错误]', e);
  }
}

/**
 * 分析家庭成员间五行生克关系
 */
function _analyzeFamilyRelations(allResults) {
  var relations = [];
  var shengMap = {水:'木',木:'火',火:'土',土:'金',金:'水'};
  var keMap = {水:'火',火:'金',金:'木',木:'土',土:'水'};

  for (var i = 0; i < allResults.length; i++) {
    for (var j = i + 1; j < allResults.length; j++) {
      var a = allResults[i];
      var b = allResults[j];
      var aEle = ELE[a.bazi.dayStem];
      var bEle = ELE[b.bazi.dayStem];
      var rel = '无关';
      var desc = '';

      if (shengMap[aEle] === bEle) {
        rel = '相生';
        desc = a.member.name + '（' + aEle + '）生 ' + b.member.name + '（' + bEle + '），关系融洽，' + a.member.name + '对' + b.member.name + '有助益';
      } else if (shengMap[bEle] === aEle) {
        rel = '相生';
        desc = b.member.name + '（' + bEle + '）生 ' + a.member.name + '（' + aEle + '），关系融洽，' + b.member.name + '对' + a.member.name + '有助益';
      } else if (keMap[aEle] === bEle) {
        rel = '相克';
        desc = a.member.name + '（' + aEle + '）克 ' + b.member.name + '（' + bEle + '），需注意沟通方式，避免冲突';
      } else if (keMap[bEle] === aEle) {
        rel = '相克';
        desc = b.member.name + '（' + bEle + '）克 ' + a.member.name + '（' + aEle + '），需注意沟通方式，避免冲突';
      } else if (aEle === bEle) {
        rel = '比和';
        desc = a.member.name + '与' + b.member.name + '同为' + aEle + '命，性格相近，易理解但也易冲突';
      } else {
        rel = '无害';
        desc = a.member.name + '（' + aEle + '）与' + b.member.name + '（' + bEle + '）五行关系平和，无明显冲克';
      }

      relations.push({
        memberA: a.member.name,
        memberB: b.member.name,
        relationA: a.member.relation,
        relationB: b.member.relation,
        eleA: aEle,
        eleB: bEle,
        relation: rel,
        desc: desc
      });
    }
  }
  return relations;
}

/**
 * 生成家庭综合化解方案
 */
function _generateFamilySolutions(allResults, familyEleCount) {
  // 找最旺和最弱五行
  var sortedEle = Object.entries(familyEleCount).sort(function(a,b) { return b[1] - a[1]; });
  var strongestEle = sortedEle[0][0];
  var weakestEle = sortedEle[sortedEle.length - 1][0];

  // 家居布局建议
  var layoutTips = [];
  // 根据全家命卦分布
  var dongCount = 0, xiCount = 0;
  allResults.forEach(function(r) {
    if (r.bazi.mingGua.isDong) dongCount++; else xiCount++;
  });
  if (dongCount > xiCount) {
    layoutTips.push('全家以东四命为主，住宅宜选东四宅（震巽坎离）');
    layoutTips.push('大门宜开东方、东南方、北方或南方');
    layoutTips.push('客厅宜设在东方或东南方，采光充足');
  } else if (xiCount > dongCount) {
    layoutTips.push('全家以西四命为主，住宅宜选西四宅（乾坤艮兑）');
    layoutTips.push('大门宜开西南方、西北方、东北方或西方');
    layoutTips.push('客厅宜设在西南方或西北方，稳重典雅');
  } else {
    layoutTips.push('全家东四命与西四命各半，住宅选择需兼顾');
    layoutTips.push('建议以户主命卦为主选择宅向，其他成员通过方位调整化解');
    layoutTips.push('客厅宜设在中宫位置，兼顾各方');
  }

  // 补弱五行
  var eleColors = {木:'绿色/青色',火:'红色/紫色',土:'黄色/棕色',金:'白色/金色',水:'蓝色/黑色'};
  var eleDirs = {木:'东方/东南',火:'南方',土:'中央/西南/东北',金:'西方/西北',水:'北方'};
  var eleItems = {木:'绿植/木制家具',火:'红色装饰/灯光',土:'陶瓷/水晶',金:'金属饰品/铜器',水:'鱼缸/水景/黑色装饰'};
  layoutTips.push('全家五行最弱为「' + weakestEle + '」，宜在「' + eleDirs[weakestEle] + '」方位摆放「' + eleItems[weakestEle] + '」补' + weakestEle + '气');
  layoutTips.push('全家五行最旺为「' + strongestEle + '」，可用「' + eleColors[strongestEle] + '」减少装饰，避免过旺');

  // 方位安排
  var roomAdvice = [];
  var auspiciousDirs = {
    '东四命': { '生气': '东南', '天医': '正东', '延年': '正南', '伏位': '正北' },
    '西四命': { '生气': '西北', '天医': '西南', '延年': '东北', '伏位': '正西' }
  };
  allResults.forEach(function(r) {
    var type = r.bazi.mingGua.type;
    var dirs = auspiciousDirs[type];
    var bestDir = dirs ? dirs['生气'] : '吉方';
    roomAdvice.push({
      name: r.member.name,
      relation: r.member.relation,
      type: type,
      bestDir: bestDir,
      dirs: dirs,
      xiEle: r.bazi.xiEle
    });
  });

  // 配色方案
  var colorAdvice = [];
  var xiEleCount = {};
  allResults.forEach(function(r) {
    var xi = r.bazi.xiEle;
    xiEleCount[xi] = (xiEleCount[xi] || 0) + 1;
  });
  var sortedXi = Object.entries(xiEleCount).sort(function(a,b) { return b[1] - a[1]; });
  sortedXi.forEach(function(entry) {
    colorAdvice.push(entry[0] + '行（' + entry[1] + '人需补）→ ' + eleColors[entry[0]]);
  });
  colorAdvice.push('全家用色建议：以多数人用神色为主色调，少数人用神色作为点缀');

  // 化煞建议
  var shaAdvice = [];
  // 找相克关系
  var kePairs = [];
  for (var i = 0; i < allResults.length; i++) {
    for (var j = i + 1; j < allResults.length; j++) {
      var aEle = ELE[allResults[i].bazi.dayStem];
      var bEle = ELE[allResults[j].bazi.dayStem];
      if (keMap[aEle] === bEle || keMap[bEle] === aEle) {
        kePairs.push({
          a: allResults[i].member.name,
          b: allResults[j].member.name,
          aEle: aEle,
          bEle: bEle
        });
      }
    }
  }
  if (kePairs.length === 0) {
    shaAdvice.push('家庭成员间无直接五行相克，关系和谐');
  } else {
    kePairs.forEach(function(p) {
      var keEle, beKeEle, keName, beKeName;
      if (keMap[p.aEle] === p.bEle) { keEle = p.aEle; beKeEle = p.bEle; keName = p.a; beKeName = p.b; }
      else { keEle = p.bEle; beKeEle = p.aEle; keName = p.b; beKeName = p.a; }
      // 化解方法：用通关五行
      var tongEle = shengMap[keEle];
      shaAdvice.push(keName + '（' + keEle + '）克 ' + beKeName + '（' + beKeEle + '）：用「' + tongEle + '」通关化解，可在家中「' + eleDirs[tongEle] + '」摆放' + eleItems[tongEle] + '，或在两人之间放置' + eleItems[tongEle]);
    });
  }

  // 择日建议
  var dateAdvice = [];
  dateAdvice.push('搬家/入宅：选与户主命卦相合之日，避开全家成员日主冲日');
  dateAdvice.push('装修动工：选' + weakestEle + '行旺盛之日（补全家弱五行）');
  dateAdvice.push('重大决策：选全家用神五行当日，避开' + strongestEle + '行过旺之日');
  dateAdvice.push('家庭聚会：选周末兼日柱相合之日，增进家庭和睦');

  return {
    layoutTips: layoutTips,
    roomAdvice: roomAdvice,
    colorAdvice: colorAdvice,
    shaAdvice: shaAdvice,
    dateAdvice: dateAdvice,
    strongestEle: strongestEle,
    weakestEle: weakestEle
  };
}

/**
 * 渲染家庭排盘报告
 */
function _renderFamilyReport(allResults, familyEleCount, relations, solutions) {
  var output = document.getElementById('familyResult');
  if (!output) return;

  var html = '';

  // 1. 家庭成员八字概览表
  html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-top:16px">';
  html += '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);text-align:center;margin-bottom:16px;letter-spacing:3px">📋 家庭成员八字概览</h4>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;color:var(--paper2)">';
  html += '<thead><tr style="border-bottom:1px solid rgba(201,168,76,0.2)">';
  html += '<th style="padding:8px;text-align:left">姓名</th><th style="padding:8px">关系</th><th style="padding:8px">四柱</th><th style="padding:8px">日主</th><th style="padding:8px">用神</th><th style="padding:8px">命卦</th>';
  html += '</tr></thead><tbody>';
  allResults.forEach(function(r) {
    var pillarText = r.bazi.pillars.map(function(p) { return p.stem + p.branch; }).join(' ');
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05)">';
    html += '<td style="padding:8px;color:var(--gold)">' + r.member.name + '</td>';
    html += '<td style="padding:8px;text-align:center">' + r.member.relation + '</td>';
    html += '<td style="padding:8px;text-align:center;font-family:\'Ma Shan Zheng\',serif;letter-spacing:2px">' + pillarText + '</td>';
    html += '<td style="padding:8px;text-align:center">' + r.bazi.dayStem + ELE[r.bazi.dayStem] + '</td>';
    html += '<td style="padding:8px;text-align:center;color:#2ecc71">' + r.bazi.xiEle + '</td>';
    html += '<td style="padding:8px;text-align:center">' + r.bazi.mingGua.guaName + '卦</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  html += '</div>';

  // 2. 家庭五行分布图
  html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-top:16px">';
  html += '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);text-align:center;margin-bottom:16px;letter-spacing:3px">🎨 家庭五行分布图</h4>';
  var maxCount = 0;
  Object.values(familyEleCount).forEach(function(v) { if (v > maxCount) maxCount = v; });
  var eleColors = {木:'#27ae60',火:'#e74c3c',土:'#f39c12',金:'#95a5a6',水:'#3498db'};
  Object.keys(familyEleCount).forEach(function(ele) {
    var pct = maxCount > 0 ? (familyEleCount[ele] / maxCount * 100) : 0;
    html += '<div style="display:flex;align-items:center;gap:8px;margin:6px 0">';
    html += '<span style="width:24px;font-size:14px;opacity:.7">' + ele + '</span>';
    html += '<div style="flex:1;height:20px;background:rgba(255,255,255,0.06);border-radius:10px;overflow:hidden">';
    html += '<div style="width:' + pct + '%;height:100%;background:' + (eleColors[ele]||'#888') + ';border-radius:10px;transition:width .5s ease;display:flex;align-items:center;justify-content:flex-end;padding-right:6px;font-size:11px;color:#fff">' + familyEleCount[ele] + '</div>';
    html += '</div>';
    html += '</div>';
  });
  html += '<p style="font-size:12px;opacity:.5;text-align:center;margin-top:12px">全家五行最旺：<strong style="color:var(--gold)">' + solutions.strongestEle + '</strong> · 最弱：<strong style="color:#2ecc71">' + solutions.weakestEle + '</strong></p>';
  html += '</div>';

  // 3. 家庭相生相克分析
  html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-top:16px">';
  html += '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);text-align:center;margin-bottom:16px;letter-spacing:3px">☯ 家庭相生相克分析</h4>';
  if (relations.length === 0) {
    html += '<p style="text-align:center;opacity:.5;font-size:13px">仅有一位成员，无关系分析</p>';
  } else {
    relations.forEach(function(r) {
      var color = r.relation === '相生' ? '#2ecc71' : r.relation === '相克' ? '#e74c3c' : r.relation === '比和' ? '#f39c12' : 'var(--paper2)';
      var icon = r.relation === '相生' ? '🟢' : r.relation === '相克' ? '🔴' : r.relation === '比和' ? '🟡' : '⚪';
      html += '<div style="margin:8px 0;padding:10px 14px;background:rgba(255,255,255,0.03);border-radius:8px;font-size:13px;line-height:1.8">';
      html += '<span style="color:' + color + ';font-weight:bold">' + icon + ' ' + r.memberA + ' ↔ ' + r.memberB + '（' + r.relation + '）</span>';
      html += '<div style="opacity:.7;margin-top:4px">' + r.desc + '</div>';
      html += '</div>';
    });
  }
  html += '</div>';

  // 4. 综合化解方案
  html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-top:16px">';
  html += '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);text-align:center;margin-bottom:16px;letter-spacing:3px">🏗️ 综合化解方案</h4>';

  // 家居布局
  html += '<div style="margin-bottom:16px">';
  html += '<h5 style="font-size:14px;color:var(--gold);margin-bottom:8px">🏠 家居布局建议</h5>';
  solutions.layoutTips.forEach(function(tip) {
    html += '<div style="font-size:13px;opacity:.8;line-height:1.8;padding:4px 0;padding-left:16px">• ' + tip + '</div>';
  });
  html += '</div>';

  // 方位安排
  html += '<div style="margin-bottom:16px">';
  html += '<h5 style="font-size:14px;color:var(--gold);margin-bottom:8px">🧭 方位安排</h5>';
  html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px;color:var(--paper2)">';
  html += '<thead><tr style="border-bottom:1px solid rgba(201,168,76,0.15)"><th style="padding:6px;text-align:left">成员</th><th style="padding:6px">命卦类型</th><th style="padding:6px">生气方</th><th style="padding:6px">天医方</th><th style="padding:6px">延年方</th><th style="padding:6px">用神</th></tr></thead><tbody>';
  solutions.roomAdvice.forEach(function(r) {
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">';
    html += '<td style="padding:6px;color:var(--gold)">' + r.name + '(' + r.relation + ')</td>';
    html += '<td style="padding:6px;text-align:center">' + r.type + '</td>';
    html += '<td style="padding:6px;text-align:center;color:#2ecc71">' + (r.dirs ? r.dirs['生气'] : '-') + '</td>';
    html += '<td style="padding:6px;text-align:center">' + (r.dirs ? r.dirs['天医'] : '-') + '</td>';
    html += '<td style="padding:6px;text-align:center">' + (r.dirs ? r.dirs['延年'] : '-') + '</td>';
    html += '<td style="padding:6px;text-align:center;color:#2ecc71">' + r.xiEle + '</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  html += '<p style="font-size:11px;opacity:.5;margin-top:6px">卧室首选生气方，书桌首选天医方，床头朝延年方</p>';
  html += '</div>';

  // 配色方案
  html += '<div style="margin-bottom:16px">';
  html += '<h5 style="font-size:14px;color:var(--gold);margin-bottom:8px">🎨 配色方案</h5>';
  solutions.colorAdvice.forEach(function(c) {
    html += '<div style="font-size:13px;opacity:.8;line-height:1.8;padding:4px 0;padding-left:16px">• ' + c + '</div>';
  });
  html += '</div>';

  // 化煞建议
  html += '<div style="margin-bottom:16px">';
  html += '<h5 style="font-size:14px;color:var(--gold);margin-bottom:8px">🛡️ 化煞建议</h5>';
  solutions.shaAdvice.forEach(function(s) {
    html += '<div style="font-size:13px;opacity:.8;line-height:1.8;padding:4px 0;padding-left:16px">• ' + s + '</div>';
  });
  html += '</div>';

  // 择日建议
  html += '<div style="margin-bottom:8px">';
  html += '<h5 style="font-size:14px;color:var(--gold);margin-bottom:8px">📅 择日建议</h5>';
  solutions.dateAdvice.forEach(function(d) {
    html += '<div style="font-size:13px;opacity:.8;line-height:1.8;padding:4px 0;padding-left:16px">• ' + d + '</div>';
  });
  html += '</div>';

  html += '</div>';

  // 5. 每人详细八字卡片
  html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-top:16px">';
  html += '<h4 style="font-family:\'Ma Shan Zheng\',serif;font-size:20px;color:var(--gold);text-align:center;margin-bottom:16px;letter-spacing:3px">👤 成员详细排盘</h4>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px">';
  allResults.forEach(function(r) {
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(201,168,76,0.1);border-radius:10px;padding:16px">';
    html += _renderMemberBaziCard(r.bazi, r.member);
    html += '</div>';
  });
  html += '</div>';
  html += '</div>';

  output.innerHTML = html;
  output.style.display = 'block';
  output.scrollIntoView({ behavior: 'smooth' });
}

/**
 * 家庭化解方案 — 终身会员专属
 */
function generateFamilyHuajie() {
  if (familyMembers.length === 0) {
    showToast('请先添加家庭成员');
    return;
  }
  // 复用computeFamilyPaipan，化解方案已包含在其中
  computeFamilyPaipan();
  // 滚动到化解方案区域
  setTimeout(function() {
    var output = document.getElementById('familyResult');
    if (output) {
      var huajieSection = output.querySelector('h4:last-of-type');
      if (huajieSection) huajieSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, 300);
}

// 暴露家庭排盘函数
try { window.addFamilyPaipanMember = addFamilyPaipanMember; } catch(e){}
try { window.removeFamilyPaipanMember = removeFamilyPaipanMember; } catch(e){}
try { window.renderFamilyMembers = renderFamilyMembers; } catch(e){}
try { window.computeSingleMemberPaipan = computeSingleMemberPaipan; } catch(e){}
try { window.computeFamilyPaipan = computeFamilyPaipan; } catch(e){}
try { window.generateFamilyHuajie = generateFamilyHuajie; } catch(e){}

console.log('[引擎] 排盘函数全局暴露完成');

// ================================================================
//  人生规划引擎 (Life Plan Engine)
// ================================================================

// 历法切换
function lpToggleCalendar() {
  var mode = document.querySelector('input[name="lifeplanCalMode"]:checked');
  if (!mode) return;
  var isLunar = mode.value === 'lunar';
  var lunarArea = document.getElementById('lpLunarArea');
  var dateInput = document.getElementById('lifeplanDate');
  if (lunarArea) lunarArea.style.display = isLunar ? 'flex' : 'none';
  if (dateInput) dateInput.style.display = isLunar ? 'none' : '';
}

// 五行方位城市表
var LP_CITY_MAP = {
  '木': {direction: '东方/东南方', cities: ['上海', '杭州', '南京', '苏州', '宁波', '无锡', '合肥', '福州', '厦门']},
  '火': {direction: '南方', cities: ['广州', '深圳', '海口', '南宁', '珠海', '东莞', '佛山', '湛江', '三亚']},
  '土': {direction: '中央/西南', cities: ['成都', '重庆', '长沙', '武汉', '郑州', '昆明', '贵阳', '南昌', '西安']},
  '金': {direction: '西方/西北方', cities: ['西安', '兰州', '乌鲁木齐', '银川', '西宁', '宝鸡', '咸阳', '天水', '拉萨']},
  '水': {direction: '北方', cities: ['北京', '天津', '哈尔滨', '大连', '青岛', '沈阳', '长春', '济南', '石家庄']}
};

// 日主五行兴趣推荐表
var LP_HOBBY_MAP = {
  '木': ['音乐', '书法', '园艺', '文学创作', '武术', '茶道', '盆景艺术', '古琴'],
  '火': ['表演', '绘画', '演讲', '摄影', '舞蹈', '戏剧', '魔术', '动漫设计'],
  '土': ['陶艺', '收藏', '建筑模型', '烹饪', '历史研究', '考古', '玉石鉴赏', '手工制作'],
  '金': ['乐器演奏', '棋类', '机械制作', '金融投资', '法律研究', '剑术', '雕刻', '珠宝设计'],
  '水': ['游泳', '航海', '心理学', '音乐作曲', '旅游', '钓鱼', '潜水', '哲学思辨']
};

// 十神旺度判断
function lpGetTenGodStrength(baziData) {
  var result = {zhengGuan:0, qiSha:0, zhengYin:0, pianYin:0, shiShen:0, shangGuan:0, zhengCai:0, pianCai:0, biJian:0, jieCai:0};
  var dayStem = baziData.dayStem;
  var dayEle = ELE[dayStem];
  var pillars = baziData.pillars;
  
  for (var i = 0; i < pillars.length; i++) {
    if (i === 2) continue; // 跳过日柱
    var p = pillars[i];
    // 天干十神
    var ganGod = getTenGod(p.stem, null, dayStem);
    // 地支本气十神
    var zhiGod = getTenGod(null, p.branch, dayStem);
    
    if (ganGod) {
      if (ganGod === '正官') result.zhengGuan += 2;
      else if (ganGod === '七杀') result.qiSha += 2;
      else if (ganGod === '正印') result.zhengYin += 2;
      else if (ganGod === '偏印') result.pianYin += 2;
      else if (ganGod === '食神') result.shiShen += 2;
      else if (ganGod === '伤官') result.shangGuan += 2;
      else if (ganGod === '正财') result.zhengCai += 2;
      else if (ganGod === '偏财') result.pianCai += 2;
      else if (ganGod === '比肩') result.biJian += 2;
      else if (ganGod === '劫财') result.jieCai += 2;
    }
    if (zhiGod) {
      if (zhiGod === '正官') result.zhengGuan += 1;
      else if (zhiGod === '七杀') result.qiSha += 1;
      else if (zhiGod === '正印') result.zhengYin += 1;
      else if (zhiGod === '偏印') result.pianYin += 1;
      else if (zhiGod === '食神') result.shiShen += 1;
      else if (zhiGod === '伤官') result.shangGuan += 1;
      else if (zhiGod === '正财') result.zhengCai += 1;
      else if (zhiGod === '偏财') result.pianCai += 1;
      else if (zhiGod === '比肩') result.biJian += 1;
      else if (zhiGod === '劫财') result.jieCai += 1;
    }
  }
  return result;
}

// 检查命局是否有某十神
function lpHasTenGod(baziData, godName) {
  var gods = baziData.tenGods || [];
  for (var i = 0; i < gods.length; i++) {
    if (gods[i] && gods[i].indexOf(godName) >= 0) return true;
  }
  // 也检查地支藏干
  var strength = lpGetTenGodStrength(baziData);
  if (godName === '食神' && strength.shiShen > 0) return true;
  if (godName === '伤官' && strength.shangGuan > 0) return true;
  if (godName === '正印' && strength.zhengYin > 0) return true;
  if (godName === '偏印' && strength.pianYin > 0) return true;
  if (godName === '正官' && strength.zhengGuan > 0) return true;
  if (godName === '七杀' && strength.qiSha > 0) return true;
  if (godName === '正财' && strength.zhengCai > 0) return true;
  if (godName === '偏财' && strength.pianCai > 0) return true;
  return false;
}

// 检查神煞
function lpHasShensha(baziData, name) {
  var shensha = baziData.shensha || [];
  if (Array.isArray(shensha)) {
    for (var i = 0; i < shensha.length; i++) {
      if (shensha[i] && shensha[i].name && shensha[i].name.indexOf(name) >= 0) return true;
    }
  }
  return false;
}

// 1. 兴趣爱好推荐
function lpRecommendHobbies(baziData) {
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var base = LP_HOBBY_MAP[dayEle] || [];
  var extra = [];
  var reasons = ['基于日主' + dayEle + '五行特性'];
  
  // 结合食伤星
  if (lpHasTenGod(baziData, '食神')) {
    extra.push('创意写作', '绘画', '手工DIY', '花艺设计');
    reasons.push('食神星现，天生具创意天赋');
  }
  if (lpHasTenGod(baziData, '伤官')) {
    extra.push('辩论', '自媒体', '表演', '脱口秀');
    reasons.push('伤官星现，表达欲望强烈');
  }
  if (lpHasTenGod(baziData, '正印') || lpHasTenGod(baziData, '偏印')) {
    extra.push('读书', '书法', '学术研究', '古文鉴赏');
    reasons.push('印星现，天然学术倾向');
  }
  
  // 合并去重
  var all = [];
  var seen = {};
  for (var i = 0; i < base.length; i++) {
    if (!seen[base[i]]) { all.push(base[i]); seen[base[i]] = true; }
  }
  for (var j = 0; j < extra.length; j++) {
    if (!seen[extra[j]]) { all.push(extra[j]); seen[extra[j]] = true; }
  }
  
  return {items: all, reasons: reasons};
}

// 2. 学业方向推荐
function lpRecommendStudy(baziData) {
  var strength = lpGetTenGodStrength(baziData);
  var recommendations = [];
  var reasons = [];
  
  // 找最旺的十神
  var sorted = Object.keys(strength).map(function(k){return [k, strength[k]];}).sort(function(a,b){return b[1]-a[1];});
  var topGod = sorted[0][0];
  var topVal = sorted[0][1];
  
  var godNameMap = {zhengGuan:'正官', qiSha:'七杀', zhengYin:'正印', pianYin:'偏印', shiShen:'食神', shangGuan:'伤官', zhengCai:'正财', pianCai:'偏财', biJian:'比肩', jieCai:'劫财'};
  
  if (topGod === 'zhengYin' || topGod === 'pianYin') {
    recommendations.push('文学', '历史', '哲学', '教育学', '图书馆学', '考古学', '古典文献');
    reasons.push('印星旺盛，主学习能力强、学术天赋高');
  }
  if (topGod === 'shiShen' || topGod === 'shangGuan') {
    recommendations.push('艺术设计', '传媒', '创意产业', '广告学', '影视制作', '动画');
    reasons.push('食伤旺盛，主才智外放、创造力强');
  }
  if (topGod === 'zhengGuan' || topGod === 'qiSha') {
    recommendations.push('法学', '政治学', '军事学', '公共管理', '国际关系');
    reasons.push('官杀旺盛，主纪律性强、适合体制内发展');
  }
  if (topGod === 'zhengCai' || topGod === 'pianCai') {
    recommendations.push('经济学', '金融学', '商学', '会计学', '国际贸易');
    reasons.push('财星旺盛，主商业敏感度高');
  }
  if (topGod === 'biJian' || topGod === 'jieCai') {
    recommendations.push('体育', '工程学', '计算机科学', '机械工程', '团队协作型专业');
    reasons.push('比劫旺盛，主行动力强、适合技术实操');
  }
  
  // 如果没有明显旺的，综合推荐
  if (recommendations.length === 0) {
    recommendations.push('综合管理', '跨学科研究', '通识教育');
    reasons.push('十神较为均衡，适合综合型学科发展');
  }
  
  return {items: recommendations, reasons: reasons, topGod: godNameMap[topGod] || ''};
}

// 3. 中高考志愿推荐
function lpRecommendMajor(baziData) {
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var xiEle = baziData.xiEle || '';
  var recommendations = [];
  var reasons = ['基于日主' + dayEle + '+喜用' + xiEle + '分析'];
  
  var majorMap = {
    '木': ['林业', '中医', '中药学', '教育学', '汉语言文学', '出版学', '园林', '环保科学', '木材科学'],
    '火': ['能源工程', '电子工程', '传媒学', '餐饮管理', '化学工程', '光电信息', '播音主持', '烹饪工艺'],
    '土': ['建筑学', '农学', '地质学', '房地产管理', '陶瓷设计', '土木工程', '城乡规划', '土地资源管理'],
    '金': ['金融学', '法学', '机械工程', '珠宝设计', '公安学', '刑事科学', '审计学', '精密仪器'],
    '水': ['航运管理', '物流工程', '心理学', '旅游管理', '外交学', '海洋科学', '水利 工程', '统计学']
  };
  
  recommendations = majorMap[dayEle] ? majorMap[dayEle].slice() : [];
  
  // 喜用神补充
  if (xiEle && xiEle !== dayEle && majorMap[xiEle]) {
    for (var i = 0; i < majorMap[xiEle].length && i < 3; i++) {
      if (recommendations.indexOf(majorMap[xiEle][i]) < 0) {
        recommendations.push(majorMap[xiEle][i]);
      }
    }
    reasons.push('喜用神' + xiEle + '补充推荐相关专业');
  }
  
  // 文昌星判断学业层次
  var hasWenchang = lpHasShensha(baziData, '文昌');
  var hasTianyi = lpHasShensha(baziData, '天乙');
  if (hasWenchang) {
    reasons.push('命带文昌贵人，主考运亨通，适合深造读研读博');
  }
  if (hasTianyi) {
    reasons.push('命带天乙贵人，主贵人提携，求学路上多有名师指点');
  }
  if (!hasWenchang && !hasTianyi) {
    reasons.push('无明显文星，建议勤奋补拙，选专业时侧重实用技能型');
  }
  
  return {items: recommendations, reasons: reasons};
}

// 4. 职业方向推荐
function lpRecommendCareer(baziData) {
  var strength = lpGetTenGodStrength(baziData);
  var recommendations = [];
  var reasons = [];
  
  // 正官+正印
  if (strength.zhengGuan >= 2 && strength.zhengYin >= 2) {
    recommendations.push('公务员', '教师', '事业单位管理', '国企行政');
    reasons.push('正官+正印组合，主稳定端正，适合体制内');
  }
  // 七杀旺
  if (strength.qiSha >= 2) {
    recommendations.push('军警', '创业', '竞争性行业', '投行', '外科医生');
    reasons.push('七杀旺，主刚毅果敢，适合高压竞争环境');
  }
  // 食神+偏财
  if (strength.shiShen >= 2 && strength.pianCai >= 2) {
    recommendations.push('餐饮业', '创意产业', '投资理财', '内容创业', '品牌策划');
    reasons.push('食神+偏财组合，主以才生财');
  }
  // 伤官+偏财
  if (strength.shangGuan >= 2 && strength.pianCai >= 2) {
    recommendations.push('销售', '演艺', '自由职业', '商业咨询', '电商创业');
    reasons.push('伤官+偏财组合，主以口才胆识生财');
  }
  // 正印+比肩
  if (strength.zhengYin >= 2 && strength.biJian >= 2) {
    recommendations.push('科研', '学术', '技术研发', '高校教师', '专利工程师');
    reasons.push('正印+比肩组合，主学业精深适合同行协作');
  }
  // 正财旺
  if (strength.zhengCai >= 2) {
    recommendations.push('财务管理', '银行', '会计', '保险精算');
    reasons.push('正财旺，主理财稳健，适合金融后台');
  }
  // 伤官+正印（伤官佩印）
  if (strength.shangGuan >= 2 && strength.zhengYin >= 2) {
    recommendations.push('教育培训', '法律', '文化传媒', '心理咨询');
    reasons.push('伤官佩印格，主才华与修养兼备');
  }
  
  // 如果没有明显组合，根据日主五行推荐
  if (recommendations.length === 0) {
    var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
    var fallback = {
      '木': ['教育行业', '文化出版', '园林农业', '中医中药'],
      '火': ['电子科技', '传媒影视', '餐饮酒店', '能源化工'],
      '土': ['建筑工程', '房地产', '农业', '矿业'],
      '金': ['金融银行', '机械制造', '法律', '汽车工业'],
      '水': ['物流航运', '旅游酒店', '心理咨询', '水产渔业']
    };
    recommendations = fallback[dayEle] || ['综合管理类岗位'];
    reasons.push('基于日主' + dayEle + '五行基础推荐');
  }
  
  return {items: recommendations, reasons: reasons};
}

// 5. 适合发展的城市
function lpRecommendCities(baziData) {
  var xiEle = baziData.xiEle || '';
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var mingGua = baziData.mingGua || {};
  var recommendations = [];
  var reasons = [];
  
  // 主推荐：喜用神方位
  var primaryEle = xiEle || dayEle;
  var primary = LP_CITY_MAP[primaryEle];
  if (primary) {
    recommendations.push({ele: primaryEle, direction: primary.direction, cities: primary.cities});
    reasons.push('喜用神' + primaryEle + '主方位' + primary.direction + '，最利发展');
  }
  
  // 次推荐：日主五行方位
  if (dayEle !== primaryEle) {
    var secondary = LP_CITY_MAP[dayEle];
    if (secondary) {
      recommendations.push({ele: dayEle, direction: secondary.direction, cities: secondary.cities});
      reasons.push('日主' + dayEle + '本命方位' + secondary.direction + '为次选');
    }
  }
  
  // 命卦东四命/西四命细化
  if (mingGua.type) {
    reasons.push('命卦' + (mingGua.guaName || '') + '属' + mingGua.type + '，' + (mingGua.isDong ? '宜东、东南、南、北方发展' : '宜西、西北、西南、东北方发展'));
  }
  
  return {items: recommendations, reasons: reasons};
}

// 6. 适婚年龄与择偶推荐
function lpRecommendMarriage(baziData, sex) {
  var dayBranch = baziData.dayBranch || '';
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var dayun = baziData.dayun || [];
  var recommendations = {};
  var reasons = [];
  
  // 夫妻宫分析
  var zhiEle = ZHI_ELE[dayBranch] || '';
  var dayEleZhi = dayEle;
  var branchRelation = '';
  var shengMap = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  var keMap = {'木':'土','土':'水','水':'火','火':'金','金':'木'};
  if (zhiEle === dayEleZhi) branchRelation = '比和（平等互助）';
  else if (shengMap[dayEleZhi] === zhiEle) branchRelation = '日主生夫妻宫（付出型）';
  else if (shengMap[zhiEle] === dayEleZhi) branchRelation = '夫妻宫生日主（得助型）';
  else if (keMap[dayEleZhi] === zhiEle) branchRelation = '日主克夫妻宫（主导型）';
  else if (keMap[zhiEle] === dayEleZhi) branchRelation = '夫妻宫克日主（受制型）';
  
  reasons.push('日支夫妻宫为' + dayBranch + '(' + zhiEle + ')，与日主' + dayEle + '关系: ' + branchRelation);
  
  // 适婚年龄：根据大运中财/官星旺的时段
  var marriageAges = [];
  var targetGod = sex === 'female' ? '正官' : '正财';
  var altGod = sex === 'female' ? '七杀' : '偏财';
  
  for (var i = 0; i < dayun.length; i++) {
    var dy = dayun[i];
    // 检查大运天干十神
    var dyGod = getTenGod(dy.gan, null, baziData.dayStem);
    var dyZhiGod = getTenGod(null, dy.zhi, baziData.dayStem);
    
    if (dyGod === targetGod || dyGod === altGod || dyZhiGod === targetGod || dyZhiGod === altGod) {
      marriageAges.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
  }
  
  if (marriageAges.length === 0) {
    // 回退到常规推荐
    if (sex === 'female') {
      marriageAges.push('24-28岁', '30-32岁');
      reasons.push('女命以正官为夫，未在显著大运中发现官星，参考常规适婚年龄');
    } else {
      marriageAges.push('26-30岁', '32-35岁');
      reasons.push('男命以正财为妻，未在显著大运中发现财星，参考常规适婚年龄');
    }
  } else {
    reasons.push((sex === 'female' ? '女命以正官/七杀为夫星' : '男命以正财/偏财为妻星') + '，在大运中找到财/官旺的时段: ' + marriageAges.join('、'));
  }
  
  // 择偶方向：根据日主五行推荐配偶五行
  var spouseEleMap = {
    '木': {best: '水（水生木）', ok: '木（比和）', avoid: '金（金克木）'},
    '火': {best: '木（木生火）', ok: '火（比和）', avoid: '水（水克火）'},
    '土': {best: '火（火生土）', ok: '土（比和）', avoid: '木（木克土）'},
    '金': {best: '土（土生金）', ok: '金（比和）', avoid: '火（火克金）'},
    '水': {best: '金（金生水）', ok: '水（比和）', avoid: '土（土克水）'}
  };
  var spouseInfo = spouseEleMap[dayEle] || {};
  
  // 生肖婚配参考（以日支为主）
  var zodiacMatch = {
    '子': ['申(猴)', '辰(龙)', '丑(牛)'], '丑': ['子(鼠)', '巳(蛇)', '酉(鸡)'],
    '寅': ['午(马)', '戌(狗)', '亥(猪)'], '卯': ['亥(猪)', '未(羊)', '戌(狗)'],
    '辰': ['子(鼠)', '申(猴)', '酉(鸡)'], '巳': ['丑(牛)', '酉(鸡)', '午(马)'],
    '午': ['寅(虎)', '戌(狗)', '未(羊)'], '未': ['卯(兔)', '亥(猪)', '午(马)'],
    '申': ['子(鼠)', '辰(龙)', '巳(蛇)'], '酉': ['丑(牛)', '巳(蛇)', '辰(龙)'],
    '戌': ['寅(虎)', '午(马)', '卯(兔)'], '亥': ['卯(兔)', '未(羊)', '寅(虎)']
  };
  var goodZodiac = zodiacMatch[dayBranch] || [];
  
  recommendations.marriageAges = marriageAges;
  recommendations.spouseEle = spouseInfo;
  recommendations.goodZodiac = goodZodiac;
  recommendations.branchRelation = branchRelation;
  
  return {items: recommendations, reasons: reasons};
}

// ================================================================
// 人生规划引擎升级 — 新增子函数
// ================================================================

// 长生十二宫 → 人生阶段映射
var LP_CS_STAGE_MAP = {
  '长生': {ageRange: [0, 12], name: '长生期', desc: '如初生之苗，生机勃发', guidance: '打基础，学习，培养兴趣，发展健康的身心习惯', auspicious: 1, advice: '此阶段为人生根基，宜注重营养、教育启蒙、性格塑造。家长应给予充分关爱与引导。'},
  '沐浴': {ageRange: [13, 18], name: '沐浴期', desc: '如新生沐浴，脆弱需护', guidance: '青春期学业关键期，防桃花干扰，注重心理成长', auspicious: 0, advice: '此阶段情绪波动大，易受外界影响。宜专注学业，避免早恋分心。家长需多沟通理解，忌简单粗暴。'},
  '冠带': {ageRange: [19, 24], name: '冠带期', desc: '如人加冠，初具规模', guidance: '大学/初入社会，技能积累，拓展人脉', auspicious: 1, advice: '此阶段宜广学博闻，积累专业技能与社交经验。可尝试实习、兼职，为正式入行做准备。'},
  '临官': {ageRange: [25, 35], name: '临官期', desc: '如人出仕，独当一面', guidance: '事业起步，成家立业，勇抓机遇', auspicious: 1, advice: '此阶段为事业黄金起步期，宜敢于担当、快速成长。同时考虑成家，事业家庭兼顾。'},
  '帝旺': {ageRange: [36, 50], name: '帝旺期', desc: '如帝之旺，气势最盛', guidance: '事业巅峰，把握机遇，敢于进取', auspicious: 1, advice: '此阶段为人生巅峰期，精力与经验俱佳。宜大胆拓展事业版图，同时注意家庭经营与身体健康。'},
  '衰': {ageRange: [51, 60], name: '衰期', desc: '由盛转衰，需知进退', guidance: '稳中求进，培养接班人，逐步放权', auspicious: 0, advice: '此阶段运势转弱，不宜冒进。宜稳守成果，培养接班人，为退休做规划。注重健康保养。'},
  '病': {ageRange: [61, 66], name: '病期', desc: '体弱需养，非真病也', guidance: '注重健康，修身养性，放下执念', auspicious: 0, advice: '此阶段精力下降，宜减少工作量，注重养生。定期体检，饮食清淡，适度运动。'},
  '死': {ageRange: [67, 72], name: '死期', desc: '气数收敛，非真死亡', guidance: '放下执念，享受天伦，精神超脱', auspicious: 0, advice: '此阶段宜彻底放下事业操心，享受家庭生活。可修习太极、书画等修身养性之活动。'},
  '墓': {ageRange: [73, 78], name: '墓期', desc: '收藏归库，宜守不宜攻', guidance: '安享晚年，整理传承，回顾人生', auspicious: 0, advice: '此阶段宜静养，整理人生经验传承后人。可写回忆录、传授经验给晚辈。'},
  '绝': {ageRange: [79, 84], name: '绝期', desc: '旧气已绝，新气将生', guidance: '超然物外，精神传承，恬淡虚无', auspicious: 0, advice: '此阶段宜保持恬淡心态，不问俗事，精神上达观超脱。家人应多陪伴关护。'},
  '胎': {ageRange: [85, 90], name: '胎期', desc: '新胎暗结，轮回再起', guidance: '颐养天年，精神不灭，福寿绵长', auspicious: 1, advice: '此阶段如有高寿，说明根基深厚。宜保持心情愉悦，享受天伦之乐。'},
  '养': {ageRange: [91, 99], name: '养期', desc: '养精蓄锐，德被后人', guidance: '福寿绵长，德泽子孙', auspicious: 1, advice: '此为极高寿之象，宜保持心态平和，家族和睦，精神充盈。'}
};

// 长生十二宫阶段吉凶描述
var LP_CS_FORTUNE_MAP = {
  '长生': '吉——生机旺盛，宜开创新事',
  '沐浴': '凶——飘摇不定，宜守不宜进',
  '冠带': '吉——初成气象，宜积累精进',
  '临官': '吉——运势上扬，宜积极进取',
  '帝旺': '大吉——气势如虹，宜把握巅峰',
  '衰': '小凶——由盛转衰，宜守成不冒进',
  '病': '凶——体力下降，宜养不宜劳',
  '死': '凶——气运低落，宜静不宜动',
  '墓': '小凶——运入收藏，宜守不宜攻',
  '绝': '凶——旧气已尽，宜等新机',
  '胎': '吉——暗藏转机，宜蓄势待发',
  '养': '吉——休养生息，宜培植根基'
};

// 日主五行健康对照表
var LP_HEALTH_MAP = {
  '木': {
    organs: '肝胆系统、神经系统、筋骨',
    risks: '肝气郁结、偏头痛、颈椎病、眼干眼涩',
    avoid: '忌熬夜、忌动怒、忌过量饮酒',
    diet: '宜食绿色蔬菜、酸味食物（适量）、枸杞、菊花茶；少食油腻辛辣',
    exercise: '宜户外运动、瑜伽拉伸、太极拳；早晨5-7点（卯时）锻炼最佳',
    checkup: '肝功能、胆囊B超、颈椎X光、眼底检查'
  },
  '火': {
    organs: '心血管、眼睛、血液、小肠',
    risks: '心律不齐、高血压、眼疾、口腔溃疡',
    avoid: '忌过劳、忌情绪激动、忌辛辣燥热',
    diet: '宜食红色食物（红枣、枸杞）、苦味食物（适量）、莲子心茶；少食油炸烧烤',
    exercise: '宜有氧运动、慢跑、游泳；避免午时（11-13点）剧烈运动',
    checkup: '心电图、血压监测、眼底检查、血脂血糖'
  },
  '土': {
    organs: '脾胃、消化系统、肌肉、口腔',
    risks: '胃炎、消化不良、血糖偏高、口腔问题',
    avoid: '忌暴饮暴食、忌生冷寒凉、忌饮食不规律',
    diet: '宜食黄色食物（小米、南瓜、土豆）、甘味食物（适量）；少食生冷瓜果',
    exercise: '宜散步、八段锦、广场舞；饭后百步走有助消化',
    checkup: '胃镜/肠镜、血糖检测、腹部B超、口腔检查'
  },
  '金': {
    organs: '呼吸系统、肺部、大肠、皮肤',
    risks: '咳嗽气喘、鼻炎、皮肤过敏、便秘',
    avoid: '忌抽烟、忌雾霾暴露、忌辛辣刺激',
    diet: '宜食白色食物（银耳、百合、梨、白萝卜）、辛味食物（适量）；少食辛辣燥热',
    exercise: '宜游泳、登山、深呼吸练习；清晨（3-5点肺经当令）可做呼吸操',
    checkup: '胸部X光/CT、肺功能检测、过敏源筛查、皮肤检查'
  },
  '水': {
    organs: '肾脏、膀胱、泌尿系统、骨骼',
    risks: '肾虚腰痛、尿路感染、骨质疏松、耳鸣',
    avoid: '忌久坐憋尿、忌过度劳累、忌寒凉侵袭',
    diet: '宜食黑色食物（黑豆、黑芝麻、黑米）、咸味食物（适量）；少食寒凉',
    exercise: '宜站桩、太极拳、腰部运动；注意腰部保暖，避免久坐',
    checkup: '肾功能、尿常规、骨密度检测、肾脏B超'
  }
};

// 合伙人五行推荐表
var LP_PARTNER_MAP = {
  '木': {best: ['水', '火'], ok: ['木'], avoid: ['金'], reason: '水生木为贵人，木生火为相辅；金克木为忌'},
  '火': {best: ['木', '土'], ok: ['火'], avoid: ['水'], reason: '木生火为贵人，火生土为相辅；水克火为忌'},
  '土': {best: ['火', '金'], ok: ['土'], avoid: ['木'], reason: '火生土为贵人，土生金为相辅；木克土为忌'},
  '金': {best: ['土', '水'], ok: ['金'], avoid: ['火'], reason: '土生金为贵人，金生水为相辅；火克金为忌'},
  '水': {best: ['金', '木'], ok: ['水'], avoid: ['土'], reason: '金生水为贵人，水生木为相辅；土克水为忌'}
};

// 7. 长生十二宫人生阶段计算
function lpCalcChangshengStages(baziData) {
  var dayStem = baziData.dayStem;
  var pillars = baziData.pillars;
  var stages = [];
  for (var i = 0; i < pillars.length; i++) {
    var ds = getDishi(dayStem, pillars[i].branch);
    stages.push({
      pillar: ['年柱', '月柱', '日柱', '时柱'][i],
      branch: pillars[i].branch,
      stage: ds,
      info: LP_CS_STAGE_MAP[ds] || null,
      fortune: LP_CS_FORTUNE_MAP[ds] || ''
    });
  }
  return stages;
}

// 8. 长生十二宫人生时间轴
function lpRecommendChangshengTimeline(baziData) {
  var timeline = [];
  var stageOrder = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];
  for (var i = 0; i < stageOrder.length; i++) {
    var info = LP_CS_STAGE_MAP[stageOrder[i]];
    if (!info) continue;
    timeline.push({
      stage: stageOrder[i],
      name: info.name,
      ageRange: info.ageRange[0] + '-' + info.ageRange[1] + '岁',
      desc: info.desc,
      guidance: info.guidance,
      auspicious: info.auspicious,
      advice: info.advice,
      fortune: LP_CS_FORTUNE_MAP[stageOrder[i]] || ''
    });
  }
  return timeline;
}

// 9. 当前阶段指导
function lpGetCurrentStageGuidance(baziData, birthYear) {
  var currentYear = new Date().getFullYear();
  var age = currentYear - birthYear;
  var currentStage = null;
  var nextStage = null;
  var stageOrder = ['长生', '沐浴', '冠带', '临官', '帝旺', '衰', '病', '死', '墓', '绝', '胎', '养'];

  for (var i = 0; i < stageOrder.length; i++) {
    var info = LP_CS_STAGE_MAP[stageOrder[i]];
    if (!info) continue;
    if (age >= info.ageRange[0] && age <= info.ageRange[1]) {
      currentStage = {stage: stageOrder[i], info: info, age: age};
      if (i + 1 < stageOrder.length) {
        var nextInfo = LP_CS_STAGE_MAP[stageOrder[i + 1]];
        if (nextInfo) nextStage = {stage: stageOrder[i + 1], info: nextInfo};
      }
      break;
    }
  }

  // 也查看当前大运的长生阶段
  var currentDyStage = null;
  var dayun = baziData.dayun || [];
  for (var j = 0; j < dayun.length; j++) {
    if (age >= dayun[j].ageStart && age < dayun[j].ageEnd) {
      currentDyStage = {
        dayun: dayun[j].gan + dayun[j].zhi,
        ageRange: Math.round(dayun[j].ageStart) + '-' + Math.round(dayun[j].ageEnd) + '岁',
        yearRange: dayun[j].yearStart + '-' + dayun[j].yearEnd + '年',
        dishi: dayun[j].dishi || '',
        ganShen: dayun[j].ganShen || '',
        zhiShen: dayun[j].zhiShen || '',
        isXi: dayun[j].isXi,
        isJi: dayun[j].isJi
      };
      break;
    }
  }

  return {currentStage: currentStage, nextStage: nextStage, currentDyStage: currentDyStage, age: age};
}

// 10. 年龄段催旺与化解
function lpRecommendEnhanceByAge(baziData) {
  var strength = lpGetTenGodStrength(baziData);
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var xiEle = baziData.xiEle || '';
  var stages = [];

  // 0-18岁：催文昌（学业）、催印星（保护）
  stages.push({
    ageRange: '0-18岁',
    title: '少年学龄期',
    enhance: [
      {target: '文昌星（学业）', method: '书桌朝向喜用神方位，摆放文昌塔或四支毛笔；佩戴或使用喜用五行颜色的文具'},
      {target: '印星（保护荫庇）', method: '印星代表长辈庇护，宜与长辈关系和睦；家中长辈位（西北方）保持整洁明亮'}
    ],
    remedy: [
      {target: '伤官过旺（叛逆多动）', method: strength.shangGuan >= 4 ? '伤官偏旺，宜引导转化为才艺特长；佩戴印星五行饰品化解' : '伤官不旺，无需特别化解'},
      {target: '比劫过旺（争斗好胜）', method: strength.biJian + strength.jieCai >= 4 ? '比劫偏旺，宜培养团队协作意识；教导分享与谦让' : '比劫平和，正常引导即可'}
    ],
    focus: '学业为重，培养良好学习习惯和品德修养'
  });

  // 19-30岁：催桃花（姻缘）、催官杀（事业起步）
  stages.push({
    ageRange: '19-30岁',
    title: '青年立业期',
    enhance: [
      {target: '桃花星（姻缘）', method: '桃花位摆放鲜花（男摆西方，女摆东方）；穿戴喜用五行颜色衣物增旺个人魅力'},
      {target: '官杀星（事业起步）', method: '正官代表事业地位，宜在办公桌青龙方（左手边）摆放龙形或麒麟摆件；面试时穿戴正官五行颜色'}
    ],
    remedy: [
      {target: '比劫过旺（破财争偶）', method: strength.biJian + strength.jieCai >= 4 ? '比劫旺易争财夺妻/夫，理财宜谨慎，感情需专一；佩戴食伤五行饰品化解' : '比劫不旺，正常经营感情即可'},
      {target: '伤官见官（口舌是非）', method: strength.shangGuan >= 2 && strength.zhengGuan >= 2 ? '伤官见官易惹是非，宜低调做人、谨言慎行；可佩戴印星五行饰品化解' : '无伤官见官之患'}
    ],
    focus: '事业起步与感情发展并重，积累人脉与经验'
  });

  // 31-50岁：催财（正财偏财）、催贵人（升迁）
  stages.push({
    ageRange: '31-50岁',
    title: '中年壮盛期',
    enhance: [
      {target: '财星（正财偏财）', method: '财位（进门对角线方位）摆放聚宝盆或貔貅；办公桌明堂开阔利纳财；投资选喜用五行行业'},
      {target: '天乙贵人（升迁助力）', method: '查找本命天乙贵人方位，办公桌朝向该方位；佩戴天乙贵人符或贵人生肖饰品'}
    ],
    remedy: [
      {target: '劫财夺财（投资失利）', method: strength.jieCai >= 2 ? '劫财旺易破财，投资宜稳健忌投机；大额支出需深思熟虑；佩戴印星五行饰品护财' : '劫财不旺，正常理财即可'},
      {target: '七杀攻身（压力过大）', method: strength.qiSha >= 2 ? '七杀旺压力大，宜学会减压；可佩戴食伤五行饰品制杀，或印星五行饰品化杀' : '七杀不旺，压力可控'}
    ],
    focus: '事业财运并重，注重家庭经营与健康管理'
  });

  // 51岁以上：催健康、催印星（晚年安乐）
  stages.push({
    ageRange: '51岁以上',
    title: '晚年安康期',
    enhance: [
      {target: '印星（晚年安乐）', method: '印星主晚年福报，宜修身养性、念佛抄经；家中文昌位保持明亮整洁'},
      {target: '健康星（寿元）', method: '根据日主五行调理饮食起居；住宅选择朝向喜用方位；卧室避免横梁压顶'}
    ],
    remedy: [
      {target: '衰病死墓运（体力下降）', method: '结合当前长生阶段调理；病/死/墓阶段尤须注意体检，每半年一次全面检查'},
      {target: '财星过旺（贪财伤身）', method: strength.zhengCai + strength.pianCai >= 4 ? '财旺身弱晚年辛苦，宜放下对物质的执着，注重精神修养' : '财星平和，适度理财即可'}
    ],
    focus: '健康第一，精神充盈，传承经验，享受天伦'
  });

  return stages;
}

// 11. 健康注意事项
function lpRecommendHealth(baziData) {
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var healthInfo = LP_HEALTH_MAP[dayEle] || {};
  var stages = lpCalcChangshengStages(baziData);
  var dayun = baziData.dayun || [];

  // 查看当前和未来大运的长生阶段，判断健康风险期
  var riskPeriods = [];
  var currentYear = new Date().getFullYear();
  var birthYear = baziData.pillars && baziData.pillars[0] ? null : null; // not directly available, use dayun
  for (var i = 0; i < dayun.length; i++) {
    var dy = dayun[i];
    if (dy.dishi === '病' || dy.dishi === '死' || dy.dishi === '墓') {
      riskPeriods.push({
        ageRange: Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁',
        yearRange: dy.yearStart + '-' + dy.yearEnd + '年',
        stage: dy.dishi,
        risk: dy.dishi === '病' ? '体力下降，慢性病风险增高' : dy.dishi === '死' ? '气运最低，需防意外与重疾' : '运入收藏，宜静养不宜劳'
      });
    }
  }

  // 五行生克健康提示
  var keMap = {'木':'土','土':'水','水':'火','火':'金','金':'木'};
  var shengMap = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
  var keBy = '';
  var shengBy = '';
  for (var k in keMap) { if (keMap[k] === dayEle) { keBy = k; break; } }
  for (var s in shengMap) { if (shengMap[s] === dayEle) { shengBy = s; break; } }

  var extraTips = [];
  if (keBy) extraTips.push('被' + keBy + '所克，需防范' + (LP_HEALTH_MAP[keBy] || {}).organs + '方面的问题传导');
  if (shengBy) extraTips.push('受' + shengBy + '所生，' + shengBy + '过旺则' + dayEle + '受塞，注意排泄与代谢');

  return {
    dayEle: dayEle,
    organs: healthInfo.organs || '',
    risks: healthInfo.risks || '',
    avoid: healthInfo.avoid || '',
    diet: healthInfo.diet || '',
    exercise: healthInfo.exercise || '',
    checkup: healthInfo.checkup || '',
    riskPeriods: riskPeriods,
    extraTips: extraTips
  };
}

// 12. 职业方向细分（考公/国企/创业/合伙）
function lpRecommendCareerDetailed(baziData) {
  var strength = lpGetTenGodStrength(baziData);
  var dayEle = baziData.dayWuxing || ELE[baziData.dayStem];
  var xiEle = baziData.xiEle || '';
  var dayun = baziData.dayun || [];
  var result = {
    government: null,    // 考公考编
    soe: null,           // 国央企
    startup: null,       // 创业
    partnership: null    // 合伙
  };

  // 考公考编：正官+正印组合
  var govScore = 0;
  var govReasons = [];
  if (strength.zhengGuan >= 2) { govScore += 3; govReasons.push('正官星有力，主端正守纪，天生适合体制内'); }
  if (strength.zhengYin >= 2) { govScore += 3; govReasons.push('正印星有力，主学业根基扎实，考试运佳'); }
  if (lpHasShensha(baziData, '天乙')) { govScore += 2; govReasons.push('命带天乙贵人，仕途多有贵人提携'); }
  if (lpHasShensha(baziData, '文昌')) { govScore += 1; govReasons.push('命带文昌，利于考试竞考'); }
  if (strength.shangGuan >= 2) { govScore -= 1; govReasons.push('伤官见官，体制内容易口舌是非，需注意收敛'); }
  if (strength.biJian + strength.jieCai >= 4) { govScore -= 1; govReasons.push('比劫过旺，竞争压力大需多加努力'); }

  var govDirections = LP_CITY_MAP[xiEle] ? LP_CITY_MAP[xiEle].direction : '喜用方位';
  result.government = {
    suitable: govScore >= 3,
    score: govScore,
    reasons: govReasons,
    advice: govScore >= 3 ? '命局组合利考公考编，建议认真备考。重点方向：' + govDirections + '地区岗位竞争相对小。备考期间书桌朝' + govDirections + '。' : '命局考公意愿一般，如决心考公需加倍努力，可考虑基层岗位起步。',
    direction: govDirections,
    bestYears: lpFindDayunByShen(dayun, baziData.dayStem, ['正官', '七杀', '正印'])
  };

  // 国央企：正官+正财
  var soeScore = 0;
  var soeReasons = [];
  if (strength.zhengGuan >= 2) { soeScore += 2; soeReasons.push('正官有力，适合有体制保障的大型企业'); }
  if (strength.zhengCai >= 2) { soeScore += 2; soeReasons.push('正财有力，主稳定收入，适合国企薪酬体系'); }
  if (strength.zhengYin >= 2) { soeScore += 1; soeReasons.push('正印护身，企业内易获上级赏识'); }
  if (strength.qiSha >= 3) { soeScore -= 1; soeReasons.push('七杀偏旺，国企约束感强需适应'); }

  var soeIndustries = [];
  var soeEleMap = {
    '木': ['林业集团', '中医药企业', '教育出版社', '环保集团'],
    '火': ['能源集团', '电力公司', '文化传媒集团', '化工集团'],
    '土': ['建筑集团', '房地产国企', '矿业集团', '农业集团'],
    '金': ['银行', '金融机构', '机械制造', '汽车集团'],
    '水': ['航运集团', '港口物流', '水务集团', '海洋渔业']
  };
  soeIndustries = soeEleMap[xiEle] || soeEleMap[dayEle] || [];
  result.soe = {
    suitable: soeScore >= 2,
    score: soeScore,
    reasons: soeReasons,
    industries: soeIndustries,
    advice: soeScore >= 2 ? '适合国央企发展，推荐行业：' + soeIndustries.slice(0, 3).join('、') + '。入行后注重人际积累与职称评定。' : '国央企适配度一般，可作为一种选择但不必强求。'
  };

  // 创业：七杀+食伤
  var startupScore = 0;
  var startupReasons = [];
  if (strength.qiSha >= 2) { startupScore += 3; startupReasons.push('七杀有力，主果敢冒险，创业魄力十足'); }
  if (strength.shiShen >= 2 || strength.shangGuan >= 2) { startupScore += 2; startupReasons.push('食伤有力，主创意与执行力，善于开拓'); }
  if (strength.pianCai >= 2) { startupScore += 2; startupReasons.push('偏财有力，主偏门财路，适合非传统行业创业'); }
  if (strength.biJian >= 2) { startupScore += 1; startupReasons.push('比肩助力，创业有同道中人支持'); }
  if (strength.jieCai >= 3) { startupScore -= 2; startupReasons.push('劫财过旺，合伙创业易被骗，宜独资'); }
  if (strength.zhengGuan >= 4) { startupScore -= 1; startupReasons.push('正官过旺，性格偏保守，创业需突破舒适区'); }

  var startupIndustries = [];
  var startupEleMap = {
    '木': ['教育培训', '文化出版', '中医养生', '园林景观', '环保科技'],
    '火': ['互联网/科技', '传媒影视', '餐饮连锁', '新能源', '直播电商'],
    '土': ['建筑工程', '房地产开发', '农产品', '仓储物流', '矿业'],
    '金': ['金融科技', '机械制造', '珠宝首饰', '汽车服务', '法律服务'],
    '水': ['跨境电商', '旅游平台', '心理咨询', '水产养殖', '物流配送']
  };
  startupIndustries = startupEleMap[xiEle] || startupEleMap[dayEle] || [];

  // 创业时机：食伤生财的大运
  var startupYears = [];
  for (var si = 0; si < dayun.length; si++) {
    var dy = dayun[si];
    var dyGanShen = dy.ganShen || '';
    var dyZhiShen = dy.zhiShen || '';
    if ((dyGanShen.indexOf('食神') >= 0 || dyGanShen.indexOf('伤官') >= 0) &&
        (dyZhiShen.indexOf('财') >= 0 || dyZhiShen.indexOf('食神') >= 0 || dyZhiShen.indexOf('伤官') >= 0)) {
      startupYears.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
    if ((dyZhiShen.indexOf('食神') >= 0 || dyZhiShen.indexOf('伤官') >= 0) &&
        (dyGanShen.indexOf('财') >= 0)) {
      startupYears.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
  }

  result.startup = {
    suitable: startupScore >= 3,
    score: startupScore,
    reasons: startupReasons,
    industries: startupIndustries,
    timing: startupYears.length > 0 ? startupYears : ['需结合大运流年具体分析，食伤生财之时为佳'],
    advice: startupScore >= 3 ? '命局适合创业，建议行业：' + startupIndustries.slice(0, 3).join('、') + '。最佳创业时机：' + (startupYears[0] || '食伤旺的大运') + '。' : '创业需谨慎，建议先积累行业经验与人脉后再择机出手。'
  };

  // 合伙人推荐
  var partnerInfo = LP_PARTNER_MAP[dayEle] || {best: [], ok: [], avoid: [], reason: ''};
  var partnerWarnings = [];
  if (strength.biJian + strength.jieCai >= 4) {
    partnerWarnings.push('比劫过旺，合伙易生争执分赃不均，建议独资或绝对控股');
  }
  if (strength.jieCai >= 3) {
    partnerWarnings.push('劫财偏旺，合伙需防被骗，重要财务条款必须白纸黑字写清楚');
  }
  if (strength.shangGuan >= 3) {
    partnerWarnings.push('伤官偏旺，合伙中容易因言语得罪人，需注意沟通方式');
  }

  result.partnership = {
    dayEle: dayEle,
    bestPartners: partnerInfo.best,
    okPartners: partnerInfo.ok,
    avoidPartners: partnerInfo.avoid,
    reason: partnerInfo.reason,
    warnings: partnerWarnings,
    advice: partnerWarnings.length > 0 ? '合伙需谨慎：' + partnerWarnings.join('；') : '可以合伙，优先选择日主五行为' + partnerInfo.best.join('/') + '的合伙人，互补共赢。'
  };

  return result;
}

// 辅助：在大运中查找含特定十神的时段
function lpFindDayunByShen(dayun, dayStem, shenNames) {
  var results = [];
  for (var i = 0; i < dayun.length; i++) {
    var dy = dayun[i];
    var ganShen = dy.ganShen || '';
    var zhiShen = dy.zhiShen || '';
    for (var j = 0; j < shenNames.length; j++) {
      if (ganShen.indexOf(shenNames[j]) >= 0 || zhiShen.indexOf(shenNames[j]) >= 0) {
        results.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
        break;
      }
    }
  }
  return results;
}

// 13. 时机提醒（关键年龄节点）
function lpRecommendTiming(baziData, birthYear) {
  var strength = lpGetTenGodStrength(baziData);
  var dayun = baziData.dayun || [];
  var dayStem = baziData.dayStem;
  var timings = [];

  // 升学关键期：文昌星/印星旺的年份
  var studyYears = lpFindDayunByShen(dayun, dayStem, ['正印', '偏印']);
  timings.push({
    type: '升学深造',
    icon: '📚',
    periods: studyYears.length > 0 ? studyYears : ['印星旺的年份（需结合流年具体分析）'],
    action: '考研、读博、考证、出国深造',
    howTo: '在印星/文昌星旺的大运流年报考，录取率高。书桌朝喜用方位，佩戴文昌符。',
    enhance: '催旺文昌：书桌摆放文昌塔/四支毛笔，朝喜用方位'
  });

  // 就业关键期：官杀星旺的年份
  var careerYears = lpFindDayunByShen(dayun, dayStem, ['正官', '七杀']);
  timings.push({
    type: '就业升职',
    icon: '💼',
    periods: careerYears.length > 0 ? careerYears : ['官杀星旺的年份（需结合流年具体分析）'],
    action: '求职、跳槽、竞聘管理岗',
    howTo: '在官杀旺的大运流年求职或竞聘，成功率最高。面试穿戴正官五行颜色。',
    enhance: '催旺官星：办公桌青龙方摆放龙形摆件，面朝喜用方位'
  });

  // 结婚关键期：夫妻宫被合/财官星旺的年份
  var marryYears = [];
  var targetGod = baziData.dayWuxing ? (strength.zhengCai >= 2 ? '正财' : (strength.pianCai >= 2 ? '偏财' : '正财')) : '正财';
  var marryShenNames = ['正财', '偏财', '正官', '七杀'];
  marryYears = lpFindDayunByShen(dayun, dayStem, marryShenNames);
  timings.push({
    type: '婚恋成家',
    icon: '💕',
    periods: marryYears.length > 0 ? marryYears : ['财官星旺的年份（需结合流年具体分析）'],
    action: '相亲、恋爱、结婚',
    howTo: '在财/官星旺的大运流年主动社交，容易遇到正缘。桃花位摆放鲜花催旺。',
    enhance: '催旺桃花：根据生肖查桃花位，摆放鲜花或粉水晶'
  });

  // 创业关键期：食伤生财的年份
  var startupYears = [];
  for (var i = 0; i < dayun.length; i++) {
    var dy = dayun[i];
    var gs = dy.ganShen || '';
    var zs = dy.zhiShen || '';
    if ((gs.indexOf('食神') >= 0 || gs.indexOf('伤官') >= 0) && (zs.indexOf('财') >= 0)) {
      startupYears.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
    if ((zs.indexOf('食神') >= 0 || zs.indexOf('伤官') >= 0) && (gs.indexOf('财') >= 0)) {
      startupYears.push(Math.round(dy.ageStart) + '-' + Math.round(dy.ageEnd) + '岁（' + dy.yearStart + '-' + dy.yearEnd + '年）');
    }
  }
  timings.push({
    type: '创业投资',
    icon: '🚀',
    periods: startupYears.length > 0 ? startupYears : ['食伤生财的年份（需结合流年具体分析）'],
    action: '启动创业、扩大投资、开设新业务',
    howTo: '在食伤生财的大运启动创业，创意与财运俱佳。忌在劫财旺的年份大额投资。',
    enhance: '催旺财星：财位摆放聚宝盆/貔貅，朝喜用方位'
  });

  // 购房关键期：印星旺的年份
  var houseYears = lpFindDayunByShen(dayun, dayStem, ['正印', '偏印']);
  timings.push({
    type: '购房置产',
    icon: '🏠',
    periods: houseYears.length > 0 ? houseYears : ['印星旺的年份（需结合流年具体分析）'],
    action: '买房、置业、装修',
    howTo: '在印星旺的大运购房，容易买到满意房产且价格合理。选朝向喜用方位的房屋。',
    enhance: '催旺印星：家中长辈位（西北方）保持整洁明亮，摆放山水画'
  });

  // 生育关键期：食伤星旺的年份
  var birthChildYears = lpFindDayunByShen(dayun, dayStem, ['食神', '伤官']);
  timings.push({
    type: '生育子女',
    icon: '👶',
    periods: birthChildYears.length > 0 ? birthChildYears : ['食伤星旺的年份（需结合流年具体分析）'],
    action: '备孕、生育',
    howTo: '在食伤旺的大运流年备孕，子女缘厚。生产前后注重母亲身体调理。',
    enhance: '催旺食伤：佩戴食伤五行饰品，保持心情愉悦'
  });

  return timings;
}

// 主函数
function computeLifePlan() {
  // 读取输入
  var name = (document.getElementById('lifeplanName') || {}).value || '';
  var sex = (document.getElementById('lifeplanSex') || {}).value || '';
  var hourVal = (document.getElementById('lifeplanHour') || {}).value || '';
  var birthplace = (document.getElementById('lifeplanBirthplace') || {}).value || '';
  var residence = (document.getElementById('lifeplanResidence') || {}).value || '';
  var stage = (document.getElementById('lifeplanStage') || {}).value || '';

  // 校验必填
  if (!sex) { showToast('请选择性别'); return; }
  if (!hourVal) { showToast('请选择出生时辰'); return; }

  // 获取日期
  var year, month, day;
  var calMode = document.querySelector('input[name="lifeplanCalMode"]:checked');
  var isLunar = calMode && calMode.value === 'lunar';

  if (isLunar) {
    var ly = parseInt((document.getElementById('lpLunarYear') || {}).value);
    var lm = parseInt((document.getElementById('lpLunarMonth') || {}).value);
    var ld = parseInt((document.getElementById('lpLunarDay') || {}).value);
    var leap = (document.getElementById('lpLunarLeap') || {}).checked;
    if (!ly || !lm || !ld) { showToast('请填写完整农历日期'); return; }
    try {
      var solar = lunarToSolar(ly, lm, ld, leap);
      year = solar.year; month = solar.month; day = solar.day;
    } catch(e) {
      showToast('农历转换失败: ' + e.message); return;
    }
  } else {
    var dateStr = (document.getElementById('lifeplanDate') || {}).value;
    if (!dateStr) { showToast('请选择出生日期'); return; }
    var parts = dateStr.split('-');
    year = parseInt(parts[0]); month = parseInt(parts[1]); day = parseInt(parts[2]);
  }

  if (!year || !month || !day) { showToast('日期解析失败'); return; }
  if (year < 1900 || year > 2050) { showToast('请输入1900-2050年之间的日期'); return; }

  var hour = parseInt(hourVal);

  // 调用八字引擎
  var baziData;
  try {
    baziData = getBaziCalcData(year, month, day, hour, sex);
  } catch(e) {
    showToast('八字排盘失败: ' + e.message); return;
  }

  // 生成各维度推荐
  var hobbies = lpRecommendHobbies(baziData);
  var study = lpRecommendStudy(baziData);
  var major = lpRecommendMajor(baziData);
  var career = lpRecommendCareer(baziData);
  var cities = lpRecommendCities(baziData);
  var marriage = lpRecommendMarriage(baziData, sex);

  // === 新增推荐 ===
  var csStages = lpCalcChangshengStages(baziData);
  var csTimeline = lpRecommendChangshengTimeline(baziData);
  var currentGuidance = lpGetCurrentStageGuidance(baziData, year);
  var enhanceByAge = lpRecommendEnhanceByAge(baziData);
  var health = lpRecommendHealth(baziData);
  var careerDetailed = lpRecommendCareerDetailed(baziData);
  var timings = lpRecommendTiming(baziData, year);

  // 阶段过滤
  var stageNames = {preschool:'学龄前', primary:'小学', junior:'初中', senior:'高中', college:'大学', career:'职场', marriage:'婚恋期'};

  // 构建输出HTML
  var html = '';

  // ========== Banner ==========
  html += '<div class="result-banner">';
  html += '<h2 class="rb-name">' + (name ? name + ' · ' : '') + '人生规划综合报告</h2>';
  html += '<p class="rb-meta">' + baziData.dayMaster + ' | ' + baziData.dayWuxing + '日主 | ' + (baziData.mingType && baziData.mingType.strengthLevel ? baziData.mingType.strengthLevel : '') + '</p>';
  html += '<div class="rb-tags">';
  html += '<span class="rb-tag">日主' + baziData.dayStem + '</span>';
  html += '<span class="rb-tag">喜用' + (baziData.xiEle || '') + '</span>';
  if (baziData.mingGua && baziData.mingGua.type) html += '<span class="rb-tag">' + baziData.mingGua.type + '</span>';
  if (baziData.geju && baziData.geju.name) html += '<span class="rb-tag">' + baziData.geju.name + '</span>';
  if (stage) html += '<span class="rb-tag">' + (stageNames[stage] || stage) + '</span>';
  html += '</div></div>';

  // ========== 1. 命盘概要 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">☰ 命盘概要 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:12px">';
  html += '<div style="padding:10px;background:rgba(201,168,76,.05);border-radius:8px;text-align:center"><p style="font-size:11px;opacity:.5;margin-bottom:4px">日主</p><p style="font-size:16px;font-weight:600;color:var(--gold)">' + baziData.dayStem + '(' + baziData.dayWuxing + ')</p></div>';
  html += '<div style="padding:10px;background:rgba(72,201,176,.05);border-radius:8px;text-align:center"><p style="font-size:11px;opacity:.5;margin-bottom:4px">喜用神</p><p style="font-size:16px;font-weight:600;color:#48c9b0">' + (baziData.xiEle || '—') + '</p></div>';
  html += '<div style="padding:10px;background:rgba(41,128,185,.05);border-radius:8px;text-align:center"><p style="font-size:11px;opacity:.5;margin-bottom:4px">命局强弱</p><p style="font-size:14px;font-weight:600;color:var(--cyan)">' + (baziData.mingType && baziData.mingType.strengthLevel ? baziData.mingType.strengthLevel : '—') + '</p></div>';
  html += '<div style="padding:10px;background:rgba(142,68,173,.05);border-radius:8px;text-align:center"><p style="font-size:11px;opacity:.5;margin-bottom:4px">命卦</p><p style="font-size:14px;font-weight:600;color:var(--violet)">' + (baziData.mingGua && baziData.mingGua.guaName ? baziData.mingGua.guaName + '·' + baziData.mingGua.type : '—') + '</p></div>';
  html += '</div>';

  // 四柱 + 长生
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px">';
  var pillarNames = ['年柱', '月柱', '日柱', '日柱', '时柱'];
  var pillarLabels = ['年柱', '月柱', '日柱', '时柱'];
  for (var pi = 0; pi < 4; pi++) {
    var p = baziData.pillars[pi];
    var ds = csStages[pi] ? csStages[pi].stage : '';
    html += '<div style="padding:8px;background:rgba(201,168,76,.03);border-radius:8px;text-align:center">';
    html += '<p style="font-size:11px;opacity:.5;margin-bottom:4px">' + pillarLabels[pi] + '</p>';
    html += '<p style="font-size:15px;font-weight:600;color:var(--gold)">' + p.stem + p.branch + '</p>';
    if (pi !== 2 && baziData.tenGods) {
      var tgIdx = pi < 2 ? pi : pi - 1;
      if (baziData.tenGods[tgIdx]) {
        html += '<p style="font-size:11px;opacity:.6">' + baziData.tenGods[tgIdx] + '</p>';
      }
    }
    if (ds) html += '<p style="font-size:11px;color:#48c9b0">' + ds + '</p>';
    html += '</div>';
  }
  html += '</div>';

  // 起运信息
  if (baziData.dayun && baziData.dayun[0] && baziData.dayun[0].qiyunAge) {
    html += '<p style="font-size:12px;opacity:.6;text-align:center">' + Math.round(baziData.dayun[0].qiyunAge * 10) / 10 + '岁起运（' + baziData.dayun[0].qiyunDetail + '）</p>';
  }
  html += '</div></div>';

  // ========== 2. 长生十二宫人生时间轴 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🕐 长生十二宫人生时间轴 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:12px">长生十二宫象征人生从生到旺再到衰的循环，每个阶段对应不同的人生课题。"适合的年龄做适合的事"。</p>';

  // 四柱长生位
  html += '<div style="margin-bottom:14px">';
  html += '<p style="font-size:13px;font-weight:600;margin-bottom:8px">四柱长生位（日干论）</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">';
  for (var ci = 0; ci < csStages.length; ci++) {
    var cs = csStages[ci];
    var isCurrent = currentGuidance.currentDyStage && cs.stage === currentGuidance.currentDyStage.dishi;
    var bgCol = cs.info && cs.info.auspicious ? 'rgba(72,201,176,.06)' : 'rgba(231,76,60,.06)';
    var txCol = cs.info && cs.info.auspicious ? '#48c9b0' : 'var(--fire)';
    html += '<div style="padding:8px;background:' + bgCol + ';border-radius:8px;text-align:center' + (isCurrent ? ';border:2px solid var(--gold)' : '') + '">';
    html += '<p style="font-size:11px;opacity:.5">' + cs.pillar + '</p>';
    html += '<p style="font-size:14px;font-weight:600;color:' + txCol + '">' + cs.stage + '</p>';
    html += '<p style="font-size:10px;opacity:.5">' + cs.fortune + '</p>';
    html += '</div>';
  }
  html += '</div></div>';

  // 时间轴
  html += '<div style="position:relative;padding-left:20px">';
  html += '<div style="position:absolute;left:6px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,#48c9b0,var(--gold),var(--fire),var(--violet))"></div>';
  for (var ti = 0; ti < csTimeline.length; ti++) {
    var tl = csTimeline[ti];
    var isCurrentStage = currentGuidance.currentStage && currentGuidance.currentStage.stage === tl.stage;
    var dotColor = tl.auspicious ? '#48c9b0' : 'var(--fire)';
    html += '<div style="position:relative;margin-bottom:12px;padding:10px;background:' + (isCurrentStage ? 'rgba(201,168,76,.08)' : 'rgba(201,168,76,.03)') + ';border-radius:8px' + (isCurrentStage ? ';border:1px solid var(--gold)' : '') + '">';
    html += '<div style="position:absolute;left:-17px;top:14px;width:10px;height:10px;border-radius:50%;background:' + dotColor + ';border:2px solid var(--bg-card)"></div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
    html += '<span style="font-size:13px;font-weight:600;color:' + dotColor + '">' + tl.stage + ' · ' + tl.name + '</span>';
    if (isCurrentStage) html += '<span style="font-size:10px;padding:2px 8px;background:var(--gold);color:var(--bg-card);border-radius:10px">当前</span>';
    html += '</div>';
    html += '<p style="font-size:11px;opacity:.5;margin-bottom:4px">' + tl.ageRange + ' | ' + tl.desc + '</p>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + tl.guidance + '</p>';
    html += '<p style="font-size:11px;opacity:.5;line-height:1.6;margin-top:4px">' + tl.advice + '</p>';
    html += '</div>';
  }
  html += '</div>';
  html += '</div></div>';

  // ========== 3. 当前阶段指导 ==========
  if (currentGuidance.currentStage) {
    var cg = currentGuidance.currentStage;
    var ng = currentGuidance.nextStage;
    var dy = currentGuidance.currentDyStage;
    html += '<div class="bazi-new-module">';
    html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">📍 当前阶段指导 <span class="toggle-icon">▼</span></div>';
    html += '<div class="bazi-module-body">';
    html += '<div style="padding:14px;background:rgba(201,168,76,.06);border-radius:10px;border-left:4px solid var(--gold);margin-bottom:12px">';
    html += '<p style="font-size:15px;font-weight:600;color:var(--gold);margin-bottom:6px">当前年龄：' + cg.age + '岁 · ' + cg.info.name + '（' + cg.stage + '）</p>';
    html += '<p style="font-size:13px;opacity:.7;line-height:1.8">' + cg.info.advice + '</p>';
    html += '</div>';

    if (dy) {
      html += '<div style="padding:14px;background:rgba(72,201,176,.05);border-radius:10px;border-left:4px solid #48c9b0;margin-bottom:12px">';
      html += '<p style="font-size:14px;font-weight:600;color:#48c9b0;margin-bottom:6px">当前大运：' + dy.dayun + '（' + dy.ageRange + '）</p>';
      html += '<p style="font-size:12px;opacity:.6;margin-bottom:4px">长生位：' + dy.dishi + ' | 天干十神：' + dy.ganShen + ' | 地支十神：' + dy.zhiShen + '</p>';
      if (dy.yearRange) html += '<p style="font-size:12px;opacity:.6">年份：' + dy.yearRange + '</p>';
      if (dy.isXi) html += '<p style="font-size:12px;color:#48c9b0">✓ 此运为喜用神，运势较顺</p>';
      if (dy.isJi) html += '<p style="font-size:12px;color:var(--fire)">⚠ 此运为忌神，需谨慎行事</p>';
      html += '</div>';
    }

    if (ng) {
      html += '<div style="padding:12px;background:rgba(142,68,173,.04);border-radius:10px">';
      html += '<p style="font-size:13px;font-weight:600;color:var(--violet);margin-bottom:4px">下一阶段：' + ng.info.name + '（' + ng.stage + '，' + ng.info.ageRange[0] + '-' + ng.info.ageRange[1] + '岁）</p>';
      html += '<p style="font-size:12px;opacity:.6;line-height:1.6">' + ng.info.guidance + '</p>';
      html += '</div>';
    }
    html += '</div></div>';
  }

  // ========== 4. 年龄段催旺与化解清单 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">⚖️ 年龄段催旺与化解 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  for (var ei = 0; ei < enhanceByAge.length; ei++) {
    var es = enhanceByAge[ei];
    var isCurrentAge = false;
    var ageNow = currentGuidance.age;
    var ageNums = es.ageRange.match(/\d+/g);
    if (ageNums && ageNums.length >= 2) {
      isCurrentAge = ageNow >= parseInt(ageNums[0]) && ageNow <= parseInt(ageNums[1]);
    }
    html += '<div style="margin-bottom:14px;padding:12px;background:' + (isCurrentAge ? 'rgba(201,168,76,.08);border:1px solid var(--gold)' : 'rgba(201,168,76,.03)') + ';border-radius:10px">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--gold);margin-bottom:4px">' + es.ageRange + ' · ' + es.title + (isCurrentAge ? ' ⬅ 当前' : '') + '</p>';
    html += '<p style="font-size:12px;opacity:.6;margin-bottom:8px">重点：' + es.focus + '</p>';

    // 催旺
    html += '<p style="font-size:12px;font-weight:600;color:#48c9b0;margin-bottom:4px">🔼 催旺</p>';
    for (var eni = 0; eni < es.enhance.length; eni++) {
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6;padding-left:8px">• ' + es.enhance[eni].target + '：' + es.enhance[eni].method + '</p>';
    }

    // 化解
    html += '<p style="font-size:12px;font-weight:600;color:var(--fire);margin-top:6px;margin-bottom:4px">🔽 化解</p>';
    for (var rmi = 0; rmi < es.remedy.length; rmi++) {
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6;padding-left:8px">• ' + es.remedy[rmi].target + '：' + es.remedy[rmi].method + '</p>';
    }
    html += '</div>';
  }
  html += '</div></div>';

  // ========== 5. 兴趣爱好推荐 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🎨 兴趣爱好推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">基于八字' + hobbies.reasons.join('、') + '</p>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  for (var i = 0; i < hobbies.items.length; i++) {
    html += '<span style="padding:6px 14px;background:rgba(72,201,176,.08);border:1px solid rgba(72,201,176,.2);border-radius:20px;font-size:13px;color:#48c9b0">' + hobbies.items[i] + '</span>';
  }
  html += '</div>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.8">建议：' + hobbies.items.slice(0, 3).join('、') + '为首选方向，结合孩子实际兴趣试学1-2项，坚持3个月以上再评估是否长期发展。</p>';
  html += '</div></div>';

  // ========== 6. 学业方向推荐 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">📚 学业方向推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">基于八字' + study.reasons.join('、') + '</p>';
  if (study.topGod) html += '<p style="font-size:13px;margin-bottom:8px">最旺十神：<b style="color:var(--gold)">' + study.topGod + '</b></p>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  for (var i = 0; i < study.items.length; i++) {
    html += '<span style="padding:6px 14px;background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.2);border-radius:20px;font-size:13px;color:var(--gold)">' + study.items[i] + '</span>';
  }
  html += '</div>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.8">建议：优先考虑' + study.items.slice(0, 3).join('、') + '方向，结合实际成绩和学校资源选择。如有条件，可双修或辅修第二专业拓宽路径。</p>';
  html += '</div></div>';

  // ========== 7. 中高考志愿 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🎓 中高考志愿推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">' + major.reasons.join('；') + '</p>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">';
  for (var i = 0; i < major.items.length; i++) {
    html += '<span style="padding:6px 14px;background:rgba(41,128,185,.08);border:1px solid rgba(41,128,185,.2);border-radius:20px;font-size:13px;color:var(--cyan)">' + major.items[i] + '</span>';
  }
  html += '</div>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.8">建议：第一批次志愿以' + major.items.slice(0, 3).join('、') + '为主冲方向；保底志愿选' + major.items.slice(-3).join('、') + '类专业稳录取。</p>';
  html += '</div></div>';

  // ========== 8. 职业方向推荐（含考公/国企/创业/合伙） ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">💼 职业方向推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';

  // 基础职业推荐
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">基于八字十神组合分析</p>';
  html += '<div style="font-size:13px;margin-bottom:10px">';
  for (var r = 0; r < career.reasons.length; r++) {
    html += '<p style="padding:4px 0;opacity:.7">• ' + career.reasons[r] + '</p>';
  }
  html += '</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">';
  for (var i = 0; i < career.items.length; i++) {
    html += '<span style="padding:6px 14px;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:20px;font-size:13px;color:var(--fire)">' + career.items[i] + '</span>';
  }
  html += '</div>';

  // 考公考编
  var gov = careerDetailed.government;
  html += '<div style="margin-bottom:14px;padding:12px;background:rgba(201,168,76,.04);border-radius:10px;border-left:3px solid ' + (gov.suitable ? '#48c9b0' : 'var(--fire)') + '">';
  html += '<p style="font-size:14px;font-weight:600;color:' + (gov.suitable ? '#48c9b0' : 'var(--fire)') + ';margin-bottom:6px">🏛️ 考公考编 ' + (gov.suitable ? '✓ 适合' : '△ 一般') + '</p>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.6">';
  for (var gi = 0; gi < gov.reasons.length; gi++) html += '<p style="padding:2px 0">• ' + gov.reasons[gi] + '</p>';
  html += '</div>';
  html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-top:6px">' + gov.advice + '</p>';
  if (gov.bestYears && gov.bestYears.length > 0) {
    html += '<p style="font-size:11px;color:#48c9b0;margin-top:4px">有利时段：' + gov.bestYears.join('、') + '</p>';
  }
  html += '</div>';

  // 国央企
  var soe = careerDetailed.soe;
  html += '<div style="margin-bottom:14px;padding:12px;background:rgba(41,128,185,.04);border-radius:10px;border-left:3px solid ' + (soe.suitable ? '#48c9b0' : 'var(--fire)') + '">';
  html += '<p style="font-size:14px;font-weight:600;color:' + (soe.suitable ? '#48c9b0' : 'var(--fire)') + ';margin-bottom:6px">🏢 国央企 ' + (soe.suitable ? '✓ 适合' : '△ 一般') + '</p>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.6">';
  for (var si = 0; si < soe.reasons.length; si++) html += '<p style="padding:2px 0">• ' + soe.reasons[si] + '</p>';
  html += '</div>';
  if (soe.industries && soe.industries.length > 0) {
    html += '<p style="font-size:12px;opacity:.6;margin-top:6px">推荐行业：' + soe.industries.join('、') + '</p>';
  }
  html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-top:4px">' + soe.advice + '</p>';
  html += '</div>';

  // 创业
  var startup = careerDetailed.startup;
  html += '<div style="margin-bottom:14px;padding:12px;background:rgba(231,76,60,.04);border-radius:10px;border-left:3px solid ' + (startup.suitable ? '#48c9b0' : 'var(--fire)') + '">';
  html += '<p style="font-size:14px;font-weight:600;color:' + (startup.suitable ? '#48c9b0' : 'var(--fire)') + ';margin-bottom:6px">🚀 创业 ' + (startup.suitable ? '✓ 适合' : '△ 需谨慎') + '</p>';
  html += '<div style="font-size:12px;opacity:.7;line-height:1.6">';
  for (var sti = 0; sti < startup.reasons.length; sti++) html += '<p style="padding:2px 0">• ' + startup.reasons[sti] + '</p>';
  html += '</div>';
  if (startup.industries && startup.industries.length > 0) {
    html += '<p style="font-size:12px;opacity:.6;margin-top:6px">推荐方向：' + startup.industries.join('、') + '</p>';
  }
  if (startup.timing && startup.timing.length > 0) {
    html += '<p style="font-size:11px;color:#48c9b0;margin-top:4px">最佳创业时机：' + startup.timing.join('、') + '</p>';
  }
  html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-top:4px">' + startup.advice + '</p>';
  html += '</div>';

  // 合伙
  var partner = careerDetailed.partnership;
  html += '<div style="margin-bottom:14px;padding:12px;background:rgba(142,68,173,.04);border-radius:10px;border-left:3px solid var(--violet)">';
  html += '<p style="font-size:14px;font-weight:600;color:var(--violet);margin-bottom:6px">🤝 合伙人推荐</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">日主' + partner.dayEle + '，' + partner.reason + '</p>';
  html += '<p style="font-size:12px;margin-top:6px">最佳合伙人五行：<b style="color:#48c9b0">' + partner.bestPartners.join('/') + '</b> | 次佳：<b style="color:var(--gold)">' + partner.okPartners.join('/') + '</b> | 避免：<b style="color:var(--fire)">' + partner.avoidPartners.join('/') + '</b></p>';
  if (partner.warnings && partner.warnings.length > 0) {
    html += '<div style="margin-top:6px">';
    for (var wi = 0; wi < partner.warnings.length; wi++) {
      html += '<p style="font-size:12px;color:var(--fire);padding:2px 0">⚠ ' + partner.warnings[wi] + '</p>';
    }
    html += '</div>';
  }
  html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-top:6px">' + partner.advice + '</p>';
  html += '</div>';

  html += '</div></div>';

  // ========== 9. 适合发展的城市 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🗺️ 适合发展的城市 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">' + cities.reasons.join('；') + '</p>';
  for (var ci = 0; ci < cities.items.length; ci++) {
    var city = cities.items[ci];
    var isPrimary = ci === 0;
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(' + (isPrimary ? '72,201,176' : '201,168,76') + ',.04);border-radius:8px;border-left:3px solid ' + (isPrimary ? '#48c9b0' : 'var(--gold)') + '">';
    html += '<p style="font-size:14px;font-weight:600;color:' + (isPrimary ? '#48c9b0' : 'var(--gold)') + ';margin-bottom:6px">' + (isPrimary ? '⭐ 首选' : '☆ 次选') + '：' + city.ele + '行方位 · ' + city.direction + '</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
    for (var cj = 0; cj < city.cities.length; cj++) {
      html += '<span style="padding:4px 12px;background:rgba(' + (isPrimary ? '72,201,176' : '201,168,76') + ',.1);border-radius:16px;font-size:12px;color:' + (isPrimary ? '#48c9b0' : 'var(--gold)') + '">' + city.cities[cj] + '</span>';
    }
    html += '</div></div>';
  }
  if (residence) {
    html += '<p style="font-size:12px;opacity:.6;line-height:1.8">当前居住地：' + residence + '。若与推荐方位不符，可考虑在工作地选择朝向喜用方位的住所调理。</p>';
  }
  html += '</div></div>';

  // ========== 10. 适婚年龄与择偶 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">💕 适婚年龄与择偶推荐 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:8px">基于八字夫妻宫+大运财官分析</p>';

  html += '<div style="margin-bottom:12px;padding:12px;background:rgba(231,76,60,.04);border-radius:8px">';
  html += '<p style="font-size:14px;font-weight:600;color:var(--fire);margin-bottom:6px">📅 适婚年龄段</p>';
  var ages = marriage.items.marriageAges || [];
  html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
  for (var ai = 0; ai < ages.length; ai++) {
    html += '<span style="padding:6px 14px;background:rgba(231,76,60,.1);border-radius:20px;font-size:13px;color:var(--fire)">' + ages[ai] + '</span>';
  }
  html += '</div></div>';

  html += '<div style="margin-bottom:12px;padding:12px;background:rgba(201,168,76,.04);border-radius:8px">';
  html += '<p style="font-size:14px;font-weight:600;color:var(--gold);margin-bottom:6px">🏠 夫妻宫分析</p>';
  html += '<p style="font-size:13px;opacity:.7;line-height:1.8">日支为' + baziData.dayBranch + '，夫妻宫关系：' + marriage.items.branchRelation + '</p>';
  html += '</div>';

  var sp = marriage.items.spouseEle || {};
  if (sp.best) {
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(39,174,96,.04);border-radius:8px">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--jade);margin-bottom:6px">五行择偶方向</p>';
    html += '<p style="font-size:13px;opacity:.7;line-height:1.8">最佳配偶五行：' + sp.best + '</p>';
    if (sp.ok) html += '<p style="font-size:13px;opacity:.7;line-height:1.8">次佳：' + sp.ok + '</p>';
    if (sp.avoid) html += '<p style="font-size:13px;opacity:.5;line-height:1.8">避免：' + sp.avoid + '</p>';
    html += '</div>';
  }

  var zodiac = marriage.items.goodZodiac || [];
  if (zodiac.length > 0) {
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(142,68,173,.04);border-radius:8px">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--violet);margin-bottom:6px">生肖婚配参考</p>';
    html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
    for (var zi = 0; zi < zodiac.length; zi++) {
      html += '<span style="padding:6px 14px;background:rgba(142,68,173,.1);border-radius:20px;font-size:13px;color:var(--violet)">' + zodiac[zi] + '</span>';
    }
    html += '</div></div>';
  }

  html += '<div style="font-size:12px;opacity:.5;line-height:1.8;margin-top:8px">';
  for (var mi = 0; mi < marriage.reasons.length; mi++) {
    html += '• ' + marriage.reasons[mi] + '<br>';
  }
  html += '</div>';
  html += '</div></div>';

  // ========== 11. 健康注意事项 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🏥 健康注意事项 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';

  html += '<div style="padding:14px;background:rgba(231,76,60,.04);border-radius:10px;border-left:4px solid var(--fire);margin-bottom:12px">';
  html += '<p style="font-size:14px;font-weight:600;color:var(--fire);margin-bottom:6px">日主' + health.dayEle + ' · 重点器官：' + health.organs + '</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">常见风险：' + health.risks + '</p>';
  html += '<p style="font-size:12px;color:var(--fire);line-height:1.6;margin-top:4px">' + health.avoid + '</p>';
  html += '</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">';
  html += '<div style="padding:10px;background:rgba(72,201,176,.04);border-radius:8px">';
  html += '<p style="font-size:12px;font-weight:600;color:#48c9b0;margin-bottom:4px">🍎 饮食建议</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + health.diet + '</p>';
  html += '</div>';
  html += '<div style="padding:10px;background:rgba(201,168,76,.04);border-radius:8px">';
  html += '<p style="font-size:12px;font-weight:600;color:var(--gold);margin-bottom:4px">🏃 运动建议</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + health.exercise + '</p>';
  html += '</div>';
  html += '</div>';

  html += '<div style="padding:10px;background:rgba(41,128,185,.04);border-radius:8px;margin-bottom:12px">';
  html += '<p style="font-size:12px;font-weight:600;color:var(--cyan);margin-bottom:4px">🔬 体检重点</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + health.checkup + '</p>';
  html += '</div>';

  if (health.extraTips && health.extraTips.length > 0) {
    html += '<div style="padding:10px;background:rgba(142,68,173,.04);border-radius:8px;margin-bottom:12px">';
    html += '<p style="font-size:12px;font-weight:600;color:var(--violet);margin-bottom:4px">⚠️ 五行生克提示</p>';
    for (var eti = 0; eti < health.extraTips.length; eti++) {
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6">• ' + health.extraTips[eti] + '</p>';
    }
    html += '</div>';
  }

  if (health.riskPeriods && health.riskPeriods.length > 0) {
    html += '<div style="padding:10px;background:rgba(231,76,60,.06);border-radius:8px">';
    html += '<p style="font-size:13px;font-weight:600;color:var(--fire);margin-bottom:6px">⚠️ 健康风险期（大运长生位为病/死/墓）</p>';
    for (var rpi = 0; rpi < health.riskPeriods.length; rpi++) {
      var rp = health.riskPeriods[rpi];
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6;padding-left:8px">• ' + rp.ageRange + '（' + rp.yearRange + '）· ' + rp.stage + '：' + rp.risk + '</p>';
    }
    html += '</div>';
  }

  html += '</div></div>';

  // ========== 12. 人生关键节点时间表 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">⏰ 人生关键节点时间表 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.7;margin-bottom:12px">结合大运十神与长生十二宫，标注人生各关键节点的最佳时机。</p>';

  for (var tmi = 0; tmi < timings.length; tmi++) {
    var tm = timings[tmi];
    html += '<div style="margin-bottom:12px;padding:12px;background:rgba(201,168,76,.03);border-radius:10px;border-left:3px solid var(--gold)">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--gold);margin-bottom:6px">' + tm.icon + ' ' + tm.type + '</p>';
    html += '<p style="font-size:12px;opacity:.7;margin-bottom:4px">适宜时段：' + tm.periods.join('、') + '</p>';
    html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-bottom:4px">行动：' + tm.action + '</p>';
    html += '<p style="font-size:12px;opacity:.6;line-height:1.6;margin-bottom:4px">把握方法：' + tm.howTo + '</p>';
    html += '<p style="font-size:11px;color:#48c9b0;line-height:1.6">' + tm.enhance + '</p>';
    html += '</div>';
  }

  html += '</div></div>';

  // ========== 12.5 三元九运宏观指导 ==========
  var lpYuanYun = (function() {
    var curYear = new Date().getFullYear();
    var birthYY = getCurrentYuanYun(year);
    var curYY = getCurrentYuanYun(curYear);
    var dmFull = _getDayMasterFull(baziData.dayStem);
    var dmEle = baziData.dayWuxing || ELE[baziData.dayStem] || '木';

    // 运星交替时间线
    var transitions = [];
    for (var yr = year; yr <= year + 100; yr++) {
      var yy = getCurrentYuanYun(yr);
      var prevYY = yr > year ? getCurrentYuanYun(yr - 1) : null;
      if (prevYY && prevYY.yun !== yy.yun) {
        var ageAtTrans = yr - year;
        var rel = _sanyuanWxRelation(dmEle, yy.wuxing);
        var relDesc = '';
        if (rel === '生我') relDesc = '运星生扶日主，事业順遂，宜积极进取';
        else if (rel === '我生') relDesc = '日主泄于运星，付出较多，宜注意精力管理';
        else if (rel === '克我') relDesc = '运星克日主，压力较大，宜守不宜攻';
        else if (rel === '我克') relDesc = '日主克运星为财，财运旺，把握机遇';
        else relDesc = '比和稳固，顺势而为';

        // 行业转型建议
        var prevIndustries = prevYY.data ? prevYY.data.industries : '';
        var newIndustries = yy.data ? yy.data.industries : '';
        var transitionAdvice = '';
        if (prevYY.wuxing !== yy.wuxing) {
          transitionAdvice = '从' + prevYY.name + '(' + prevYY.wuxing + '行：' + (prevIndustries || '').substring(0, 20) + '...)转入' + yy.name + '(' + yy.wuxing + '行：' + (newIndustries || '').substring(0, 20) + '...)，宜适时调整行业方向';
        }

        transitions.push({
          year: yr,
          age: ageAtTrans,
          fromYun: prevYY.name,
          toYun: yy.name,
          toWuxing: yy.wuxing,
          toDirection: yy.direction,
          relation: relDesc,
          transitionAdvice: transitionAdvice
        });
      }
    }

    // 九紫离火运日主影响
    var jiuZhiImpacts = {
      '木': '木生火，付出多但有为，宜文化教育、AI科技、新能源。注意精力消耗，宜补水养木',
      '火': '火火相助，事业旺但防过燥，宜科技能源、传媒餐饮。当令者更需收敛锋芒',
      '土': '火生土，得助力贵人多，宜地产农业、康养。火生土为贵人运，大胆推进',
      '金': '火克金，压力大需谨慎，宜守不宜攻。学会减压，培养柔性沟通',
      '水': '水克火，可掌控但防过劳，宜物流贸易、AI大数据。水克火为财，是九运中最有机会的日主之一'
    };
    var impact = jiuZhiImpacts[dmEle] || '关系平和，顺势而为';

    // 九运上半段(2024-2033)与下半段(2034-2043)运程
    var halfPeriods = [];
    var firstHalfStart = 2024, firstHalfEnd = 2033;
    var secondHalfStart = 2034, secondHalfEnd = 2043;
    var ageFirstHalfStart = firstHalfStart - year;
    var ageFirstHalfEnd = firstHalfEnd - year;
    var ageSecondHalfStart = secondHalfStart - year;
    var ageSecondHalfEnd = secondHalfEnd - year;

    // 上半段特征
    var fhGuide = JIU_ZI_LI_HUO_GUIDE.yearlyGuide[curYear];
    var firstHalfDesc = '九运上半段(2024-2033)：离火初燃期。AI元年、新能源加速、文化教育大发展。' + (fhGuide ? fhGuide.advice : '把握AI和新能源风口，学习新技能');
    var secondHalfDesc = '九运下半段(2034-2043)：离火鼎盛期。新技术突破、文化产业新高峰、虚拟现实普及。九运巅峰，把握最后大机遇';

    halfPeriods.push({
      period: '上半段(2024-2033)',
      ageRange: ageFirstHalfStart + '-' + ageFirstHalfEnd + '岁',
      desc: firstHalfDesc
    });
    halfPeriods.push({
      period: '下半段(2034-2043)',
      ageRange: ageSecondHalfStart + '-' + ageSecondHalfEnd + '岁',
      desc: secondHalfDesc
    });

    return {
      birthYuanYun: birthYY,
      currentYuanYun: curYY,
      dayMasterFull: dmFull,
      dayEle: dmEle,
      impact: impact,
      transitions: transitions,
      halfPeriods: halfPeriods
    };
  })();

  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">🔥 三元九运宏观指导 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';

  // 出生时运星
  html += '<div style="padding:14px;background:rgba(72,201,176,.05);border-radius:10px;border-left:4px solid #48c9b0;margin-bottom:12px">';
  html += '<p style="font-size:14px;font-weight:600;color:#48c9b0;margin-bottom:6px">📍 出生时运星：' + lpYuanYun.birthYuanYun.name + '</p>';
  html += '<p style="font-size:12px;opacity:.6">' + lpYuanYun.birthYuanYun.yuan + ' | ' + lpYuanYun.birthYuanYun.star + ' | ' + lpYuanYun.birthYuanYun.wuxing + '行 | 方位：' + lpYuanYun.birthYuanYun.direction + '</p>';
  html += '<p style="font-size:12px;opacity:.6">区间：' + lpYuanYun.birthYuanYun.periodInThisCycle + '</p>';
  html += '</div>';

  // 当前运星影响
  html += '<div style="padding:14px;background:rgba(231,76,60,.05);border-radius:10px;border-left:4px solid #e74c3c;margin-bottom:12px">';
  html += '<p style="font-size:14px;font-weight:600;color:#e74c3c;margin-bottom:6px">🔥 当前运星：' + lpYuanYun.currentYuanYun.name + '</p>';
  html += '<p style="font-size:12px;opacity:.6">' + lpYuanYun.currentYuanYun.yuan + ' | ' + lpYuanYun.currentYuanYun.star + ' | 第' + lpYuanYun.currentYuanYun.yunYear + '/20年</p>';
  html += '<p style="font-size:13px;opacity:.7;line-height:1.8;margin-top:8px">对' + lpYuanYun.dayMasterFull + '(' + lpYuanYun.dayEle + ')日主的影响：' + lpYuanYun.impact + '</p>';
  html += '</div>';

  // 运星交替时间线
  if (lpYuanYun.transitions && lpYuanYun.transitions.length > 0) {
    html += '<div style="padding:14px;background:rgba(142,68,173,.04);border-radius:10px;margin-bottom:12px">';
    html += '<p style="font-size:14px;font-weight:600;color:var(--violet);margin-bottom:10px">🔄 缘主一生运星交替</p>';
    html += '<div style="position:relative;padding-left:20px">';
    html += '<div style="position:absolute;left:6px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom,#e74c3c,var(--gold),#48c9b0,var(--violet))"></div>';
    for (var lpt = 0; lpt < lpYuanYun.transitions.length; lpt++) {
      var lt = lpYuanYun.transitions[lpt];
      html += '<div style="position:relative;margin-bottom:12px;padding:10px;background:rgba(142,68,173,.04);border-radius:8px">';
      html += '<div style="position:absolute;left:-17px;top:14px;width:10px;height:10px;border-radius:50%;background:#e74c3c;border:2px solid var(--bg-card)"></div>';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">';
      html += '<span style="font-size:13px;font-weight:600;color:#e74c3c">' + lt.fromYun + ' → ' + lt.toYun + '</span>';
      html += '<span style="font-size:12px;color:var(--gold)">' + lt.age + '岁 · ' + lt.year + '年</span>';
      html += '</div>';
      html += '<p style="font-size:12px;opacity:.6;line-height:1.6">五行：' + lt.toWuxing + ' | 方位：' + lt.toDirection + '</p>';
      html += '<p style="font-size:12px;opacity:.7;line-height:1.6;margin-top:4px">' + lt.relation + '</p>';
      if (lt.transitionAdvice) html += '<p style="font-size:12px;color:var(--gold);line-height:1.6;margin-top:4px">💡 ' + lt.transitionAdvice + '</p>';
      html += '</div>';
    }
    html += '</div></div>';
  }

  // 九紫离火运期间人生建议
  html += '<div style="padding:14px;background:rgba(231,76,60,.06);border-radius:10px;margin-bottom:12px">';
  html += '<p style="font-size:14px;font-weight:600;color:#e74c3c;margin-bottom:8px">🔥 九紫离火运(2024-2043)人生建议</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:10px">';
  html += '<div style="padding:8px 10px;background:rgba(231,76,60,.04);border-radius:6px"><span style="font-size:11px;opacity:.5">火旺行业</span><br><span style="font-size:12px;color:#e74c3c">AI、新能源、文化、传媒、餐饮、美容</span></div>';
  html += '<div style="padding:8px 10px;background:rgba(231,76,60,.04);border-radius:6px"><span style="font-size:11px;opacity:.5">火旺方位</span><br><span style="font-size:12px;color:#e74c3c">南方</span></div>';
  html += '<div style="padding:8px 10px;background:rgba(231,76,60,.04);border-radius:6px"><span style="font-size:11px;opacity:.5">火旺颜色</span><br><span style="font-size:12px;color:#e74c3c">红色、紫色</span></div>';
  html += '</div>';

  // 上下半段运程
  for (var lph = 0; lph < lpYuanYun.halfPeriods.length; lph++) {
    var hp = lpYuanYun.halfPeriods[lph];
    html += '<div style="padding:10px;background:rgba(201,168,76,.04);border-radius:8px;margin-bottom:8px">';
    html += '<p style="font-size:13px;font-weight:600;color:var(--gold);margin-bottom:4px">' + hp.period + '（' + hp.ageRange + '）</p>';
    html += '<p style="font-size:12px;opacity:.7;line-height:1.6">' + hp.desc + '</p>';
    html += '</div>';
  }
  html += '</div>';

  // 结合甲子周期长期规划
  html += '<div style="padding:14px;background:rgba(201,168,76,.04);border-radius:10px">';
  html += '<p style="font-size:13px;font-weight:600;color:var(--gold);margin-bottom:6px">🔮 甲子周期与三元九运综合规划</p>';
  html += '<p style="font-size:12px;opacity:.7;line-height:1.8">缘主一生跨越多个运星周期，每个运星20年对应人生不同阶段。结合甲子60年周期与三元九运180年大循环，建议在运星交替前后3年提前布局新方向，在运星中段全力发展。当前处于' + lpYuanYun.currentYuanYun.name + '，宜顺应火运大势，结合个人日主五行调整行业方向与生活方式。</p>';
  html += '</div>';

  html += '</div></div>';

  // ========== 13. 综合建议与免责声明 ==========
  html += '<div class="bazi-new-module">';
  html += '<div class="bazi-module-title" onclick="toggleBaziModule(this)">📋 综合建议 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body">';
  html += '<div style="padding:14px;background:rgba(72,201,176,.04);border-radius:10px;margin-bottom:10px">';
  html += '<p style="font-size:13px;line-height:1.8;color:#48c9b0">基于以上分析，综合建议如下：</p>';
  html += '<ol style="font-size:12px;opacity:.7;line-height:2;padding-left:16px">';
  html += '<li><b>顺势而为</b>：当前处于' + (currentGuidance.currentStage ? currentGuidance.currentStage.info.name : '人生') + '，宜' + (currentGuidance.currentStage ? currentGuidance.currentStage.info.guidance : '踏实努力') + '。</li>';
  html += '<li><b>扬长避短</b>：发挥' + (study.topGod || '命局优势') + '特长，规避' + (strength && strength.jieCai >= 3 ? '破财争斗' : '急躁冒进') + '之短。</li>';
  html += '<li><b>把握时机</b>：关注关键节点的催旺方法，在有利时段大胆出手，不利时段保守稳健。</li>';
  html += '<li><b>健康为本</b>：日主' + health.dayEle + '需重点关注' + health.organs + '，定期体检，合理饮食运动。</li>';
  html += '<li><b>方位助力</b>：优先选择' + (cities.items[0] ? cities.items[0].direction : '喜用方位') + '发展，居住环境朝向喜用方位。</li>';
  html += '<li><b>持续学习</b>：印星主学习，保持终身学习习惯，' + (lpHasShensha(baziData, '文昌') ? '命带文昌更利深造' : '勤奋补拙同样成才') + '。</li>';
  html += '</ol>';
  html += '</div>';
  html += '</div></div>';

  // 免责声明
  html += '<div style="margin-top:16px;padding:16px;background:rgba(201,168,76,.03);border:1px solid rgba(201,168,76,.1);border-radius:8px;text-align:center">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.5;line-height:1.8">⚠️ 免责声明：以上推荐基于传统命理学八字五行十神、长生十二宫理论生成，仅供参考。人生选择需结合个人实际情况、社会环境、家庭条件等多方面因素综合判断。命理指引方向，努力决定高度。</p>';
  html += '</div>';

  // 输出
  var output = document.getElementById('lifeplanResult');
  if (output) {
    output.style.display = 'block';
    output.innerHTML = html;
    output.scrollIntoView({behavior: 'smooth'});
  }
}
// 暴露人生规划函数
try { window.computeLifePlan = computeLifePlan; } catch(e){}
try { window.lpToggleCalendar = lpToggleCalendar; } catch(e){}

// ================================================================
// ===== 夫妻双方合参择日 (COUPLE_ZERI) =====
// 基于男女双方八字共同推演婚嫁吉日
// ================================================================

/**
 * 计算单个日子对某一日主的冲克评分
 * @param {Object} dayGZ - {gan, zhi} 当日干支
 * @param {Object} personYS - 日主用神信息
 * @returns {Object} {score, details, hasChong}
 */
function _evalDayForPerson(dayGZ, personYS) {
  var dayGanEle = ELE[TIAN_GAN[dayGZ.gan]];
  var dayZhiName = DI_ZHI[dayGZ.zhi];
  var score = 50; // 基础分
  var details = [];
  var hasChong = false;

  // 1. 日干与日主五行关系
  var rel = _wuxingRelation(personYS.dayEle, dayGanEle);
  if (rel === '被生') {
    score += 12;
    details.push('日干' + dayGanEle + '生日主' + personYS.dayEle + '（吉）');
  } else if (rel === '生') {
    score -= 4;
    details.push('日主生日干（泄气）');
  } else if (rel === '被克') {
    score -= 10;
    details.push('日干克日主（忌）');
  } else if (rel === '相同') {
    if (personYS.isStrong) {
      score -= 3;
      details.push('比劫帮身，身强不喜');
    } else {
      score += 5;
      details.push('比劫帮身，身弱喜比劫');
    }
  }

  // 2. 日干是否喜用神
  if (dayGanEle === personYS.yongshenEle || dayGanEle === personYS.xiEle) {
    score += 8;
    details.push('日干为喜用' + dayGanEle);
  } else if (dayGanEle === personYS.jiEle) {
    score -= 6;
    details.push('日干为忌神' + dayGanEle);
  }

  // 3. 日支与日主日支关系
  var zhiRelations = _checkZhiRelation(personYS.branchIdx, dayGZ.zhi);
  for (var z = 0; z < zhiRelations.length; z++) {
    score += zhiRelations[z].score;
    details.push('日支' + zhiRelations[z].type + '：' + zhiRelations[z].desc);
    if (zhiRelations[z].type === '六冲') hasChong = true;
  }

  // 4. 日支冲日主日支（重点排除）
  var chongPairs = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
  for (var ci = 0; ci < chongPairs.length; ci++) {
    if ((chongPairs[ci][0] === personYS.branchIdx && chongPairs[ci][1] === dayGZ.zhi) ||
        (chongPairs[ci][1] === personYS.branchIdx && chongPairs[ci][0] === dayGZ.zhi)) {
      hasChong = true;
      score -= 15;
      details.push('日支冲日主日支，大忌');
    }
  }

  return { score: Math.max(10, Math.min(100, score)), details: details, hasChong: hasChong };
}

/**
 * 检查日是否含婚嫁吉神
 */
function _checkWeddingGods(jsList) {
  var weddingGods = ['天德','月德','三合','六合','天喜','红鸾'];
  var found = [];
  for (var i = 0; i < weddingGods.length; i++) {
    if (jsList.indexOf(weddingGods[i]) !== -1) found.push(weddingGods[i]);
  }
  return found;
}

/**
 * 检查日是否含婚嫁凶神
 */
function _checkWeddingBadGods(xsList) {
  var badGods = ['月破','月厌','劫煞','灾煞','月刑','四击','往亡'];
  var found = [];
  for (var i = 0; i < badGods.length; i++) {
    if (xsList.indexOf(badGods[i]) !== -1) found.push(badGods[i]);
  }
  return found;
}

/**
 * 夫妻双方合参择日主函数
 * @param {Object} maleInfo - {name, birthDate, birthHour, sex, city}
 * @param {Object} femaleInfo - {name, birthDate, birthHour, sex, city}
 * @param {string} weddingType - '订婚'|'领证'|'婚礼'
 * @returns {Object} result
 */
function computeZeRiCouple(maleInfo, femaleInfo, weddingType) {
  var result = {
    male: maleInfo,
    female: femaleInfo,
    weddingType: weddingType || '婚礼',
    candidates: [],
    topCandidates: [],
    avoidDates: [],
    report: null
  };

  // === 解析男方八字 ===
  var mDate = maleInfo.birthDate ? new Date(maleInfo.birthDate + 'T12:00:00') : new Date(1990, 0, 1);
  var mYear = mDate.getFullYear(), mMonth = mDate.getMonth() + 1, mDay = mDate.getDate();
  var mHour = parseInt(maleInfo.birthHour) || 0;
  var mBazi = {};
  try {
    mBazi = getBaziCalcData(mYear, mMonth, mDay, mHour, 'male');
  } catch(e) {
    mBazi = { dayStem: '甲', dayBranch: '子', dayStemIdx: 0, dayBranchIdx: 0, dayWuxing: '木', xiEle: '水', isStrong: false, mingType: { strengthLevel: '偏弱', yongshenEle: '水', yongshen: '' } };
  }
  var mYS = _extractYongShen(mBazi);

  // === 解析女方八字 ===
  var fDate = femaleInfo.birthDate ? new Date(femaleInfo.birthDate + 'T12:00:00') : new Date(1992, 0, 1);
  var fYear = fDate.getFullYear(), fMonth = fDate.getMonth() + 1, fDay = fDate.getDate();
  var fHour = parseInt(femaleInfo.birthHour) || 0;
  var fBazi = {};
  try {
    fBazi = getBaziCalcData(fYear, fMonth, fDay, fHour, 'female');
  } catch(e) {
    fBazi = { dayStem: '乙', dayBranch: '丑', dayStemIdx: 1, dayBranchIdx: 1, dayWuxing: '木', xiEle: '水', isStrong: false, mingType: { strengthLevel: '偏弱', yongshenEle: '水', yongshen: '' } };
  }
  var fYS = _extractYongShen(fBazi);

  // === 事项配置 ===
  var purpose = (weddingType === '订婚') ? '订盟' : '婚嫁';
  var eventConfig = PRECISION_EVENT_CONFIG[purpose] || PRECISION_EVENT_CONFIG['婚嫁'];

  // === 搜索范围：支持向前向后选日 ===
  var searchStart, searchEnd;
  if (maleInfo.startDate) {
    searchStart = new Date(maleInfo.startDate + 'T12:00:00');
  } else {
    searchStart = new Date();
  }
  searchStart.setHours(12, 0, 0, 0);
  if (maleInfo.endDate) {
    searchEnd = new Date(maleInfo.endDate + 'T12:00:00');
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

    // 基础数据
    var jcName = getJianChu(monthGZ.zhi, dayGZ.zhi);
    var jsList = calcJishen(yearGZ, monthGZ, dayGZ);
    var xsList = calcXiongshen(yearGZ, monthGZ, dayGZ);
    var zs = getZhishen(dayGZ.gan, dayGZ.zhi);
    var zsHuangdao = ZHISHEN_TYPE[zs];
    var shaInfo = CHONGSHA_DETAIL[DI_ZHI[dayGZ.zhi]] || { chong: '?', sha: '?' };

    // 男女双方各自评分
    var maleEval = _evalDayForPerson(dayGZ, mYS);
    var femaleEval = _evalDayForPerson(dayGZ, fYS);

    // 双方冲煞检查
    var maleChongSha = shaInfo.chong === SHENG_XIAO[mYS.branchIdx];
    var femaleChongSha = shaInfo.chong === SHENG_XIAO[fYS.branchIdx];

    // 婚嫁吉神
    var weddingGood = _checkWeddingGods(jsList);
    var weddingBad = _checkWeddingBadGods(xsList);

    // 建除匹配
    var jianchuMatch = eventConfig.jianchu && eventConfig.jianchu.indexOf(jcName) !== -1;

    // === 综合评分 ===
    var maleScore = maleEval.score;
    var femaleScore = femaleEval.score;

    // 婚嫁吉神加分
    maleScore += weddingGood.length * 4;
    femaleScore += weddingGood.length * 4;

    // 凶神减分
    maleScore -= weddingBad.length * 6;
    femaleScore -= weddingBad.length * 6;

    // 建除匹配加分
    if (jianchuMatch) {
      maleScore += 8;
      femaleScore += 8;
    }

    // 黄道日加分
    if (zsHuangdao) {
      maleScore += 4;
      femaleScore += 4;
    }

    // 冲生肖大忌
    if (maleChongSha) maleScore -= 20;
    if (femaleChongSha) femaleScore -= 20;

    // 限制范围
    maleScore = Math.max(5, Math.min(100, maleScore));
    femaleScore = Math.max(5, Math.min(100, femaleScore));

    // 双方合参总分 = (男分 + 女分) / 2 + 协同分
    var coupleScore = (maleScore + femaleScore) / 2;

    // 协同加分：双方都不冲
    if (!maleEval.hasChong && !femaleEval.hasChong) coupleScore += 5;
    // 协同加分：吉神多
    if (weddingGood.length >= 3) coupleScore += 5;
    // 协同加分：建除宜婚嫁
    if (jianchuMatch) coupleScore += 3;
    // 协同减分：有凶神
    if (weddingBad.length > 0) coupleScore -= 4;
    // 协同减分：双方冲煞
    if (maleChongSha || femaleChongSha) coupleScore -= 10;

    // 三元九运维度：运星五行与日干支五行关系
    var _curYY2 = getCurrentYuanYun(d.getFullYear());
    var _yunWx2 = _curYY2.wuxing;
    var _dgEle2 = ELE[TIAN_GAN[dayGZ.gan]] || '木';
    if (_dgEle2 === '火' || _dgEle2 === '土') coupleScore += 5;
    else if (_dgEle2 === '水') coupleScore -= 3;

    coupleScore = Math.round(Math.max(10, Math.min(100, coupleScore)));

    // 等级
    var level = '';
    if (coupleScore >= 85) level = '大吉';
    else if (coupleScore >= 70) level = '吉';
    else if (coupleScore >= 55) level = '平';
    else if (coupleScore >= 40) level = '小凶';
    else level = '凶';

    var candidate = {
      date: new Date(d),
      ganzhi: TIAN_GAN[dayGZ.gan] + DI_ZHI[dayGZ.zhi],
      coupleScore: coupleScore,
      maleScore: maleScore,
      femaleScore: femaleScore,
      level: level,
      jianchu: jcName,
      zhishen: zs,
      isHuangdao: zsHuangdao,
      jishenList: jsList,
      xiongshenList: xsList,
      weddingGood: weddingGood,
      weddingBad: weddingBad,
      chongsha: shaInfo,
      maleChongSha: maleChongSha,
      femaleChongSha: femaleChongSha,
      maleDetails: maleEval.details,
      femaleDetails: femaleEval.details,
      yearGZ: yearGZ,
      monthGZ: monthGZ,
      dayGZ: dayGZ,
      maleHasChong: maleEval.hasChong,
      femaleHasChong: femaleEval.hasChong
    };

    result.candidates.push(candidate);
  }

  // 排序
  result.candidates.sort(function(a, b) {
    return b.coupleScore - a.coupleScore;
  });

  // Top5
  result.topCandidates = result.candidates.slice(0, 5);
  // 避免日期
  result.avoidDates = result.candidates.filter(function(c) {
    return c.coupleScore < 45 || c.maleChongSha || c.femaleChongSha || c.maleHasChong || c.femaleHasChong;
  }).slice(0, 3);

  // 生成报告
  result.report = _generateCoupleReport(result, mYS, fYS, mBazi, fBazi);

  return result;
}

/**
 * 生成夫妻合参择日报告
 */
function _generateCoupleReport(result, mYS, fYS, mBazi, fBazi) {
  var top = result.topCandidates;
  var avoid = result.avoidDates;
  var weddingType = result.weddingType;
  var weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

  var html = '<div class="precision-report">';
  html += '<div class="pr-header">💑 婚嫁择日报告（双方八字合参）</div>';

  // 双方信息
  var mBzStr = mBazi.pillars ?
    mBazi.pillars[0].stem + mBazi.pillars[0].branch + ' ' +
    mBazi.pillars[1].stem + mBazi.pillars[1].branch + ' ' +
    mBazi.pillars[2].stem + mBazi.pillars[2].branch + ' ' +
    mBazi.pillars[3].stem + mBazi.pillars[3].branch : mYS.dayStem + mYS.dayEle + '日主';
  var fBzStr = fBazi.pillars ?
    fBazi.pillars[0].stem + fBazi.pillars[0].branch + ' ' +
    fBazi.pillars[1].stem + fBazi.pillars[1].branch + ' ' +
    fBazi.pillars[2].stem + fBazi.pillars[2].branch + ' ' +
    fBazi.pillars[3].stem + fBazi.pillars[3].branch : fYS.dayStem + fYS.dayEle + '日主';

  html += '<div class="pr-meta">';
  html += '<span>男方：' + (result.male.name || '新郎') + '（' + mBzStr + '，日主' + mYS.dayEle + (mYS.isStrong ? '偏强' : '偏弱') + '）</span>';
  html += '<span>女方：' + (result.female.name || '新娘') + '（' + fBzStr + '，日主' + fYS.dayEle + (fYS.isStrong ? '偏强' : '偏弱') + '）</span>';
  html += '<span>事项：' + weddingType + '</span>';
  html += '</div>';

  // 最佳推荐
  if (top.length > 0) {
    var best = top[0];
    var d = best.date;
    var dateStr = d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日（' + weekDays[d.getDay()] + '）';

    html += '<div class="pr-best">';
    html += '<div class="pr-best-label">🏆 最佳推荐</div>';
    html += '<div class="pr-best-date">' + dateStr + '</div>';
    html += '<div class="pr-best-ganzhi">' + best.ganzhi + '日 · 建除' + best.jianchu + ' · ' + (best.isHuangdao ? '黄道' : '黑道') + '</div>';
    html += '<div class="pr-best-score">合参评分：<span class="pr-score-' + best.level + '">' + best.coupleScore + '分/' + best.level + '</span></div>';
    html += '<div style="margin-top:8px;font-size:13px">';
    html += '男方评分：<span style="color:#3498db">' + best.maleScore + '分</span> | ';
    html += '女方评分：<span style="color:#e91e63">' + best.femaleScore + '分</span>';
    html += '</div>';
    html += '</div>';

    // 吉神凶神
    html += '<div class="pr-layers">';
    if (best.weddingGood.length > 0) {
      html += '<div class="pr-layer">├─ <b>婚嫁吉神：</b>' + best.weddingGood.join('、') + '齐聚，大利于婚</div>';
    }
    if (best.weddingBad.length > 0) {
      html += '<div class="pr-layer">├─ <b>凶神注意：</b>' + best.weddingBad.join('、') + '当值，需注意</div>';
    }
    html += '<div class="pr-layer">├─ <b>男方八字：</b>' + best.maleDetails.join('；') + '</div>';
    html += '<div class="pr-layer">├─ <b>女方八字：</b>' + best.femaleDetails.join('；') + '</div>';
    if (best.maleChongSha) {
      html += '<div class="pr-layer" style="color:#e74c3c">├─ ⚠️ 当日冲男方生肖，需注意</div>';
    }
    if (best.femaleChongSha) {
      html += '<div class="pr-layer" style="color:#e74c3c">├─ ⚠️ 当日冲女方生肖，需注意</div>';
    }
    html += '<div class="pr-layer pr-zongping">└─ <b>总评：</b>此日双方日主均得令，' + (best.weddingGood.length >= 2 ? '吉神云集' : '神煞平和') + '，宜' + weddingType + '。</div>';
    html += '</div>';
  }

  // Top5 吉日列表
  if (top.length > 1) {
    html += '<div class="pr-alt-section">';
    html += '<div class="pr-alt-title">📅 Top5 吉日</div>';
    for (var i = 0; i < top.length; i++) {
      var alt = top[i];
      var altD = alt.date;
      var altStr = (altD.getMonth() + 1) + '月' + altD.getDate() + '日（' + weekDays[altD.getDay()] + '）';
      html += '<div class="pr-alt-item">';
      html += '<span class="pr-alt-rank">' + (i + 1) + '. </span>';
      html += '<span class="pr-alt-date">' + altStr + '</span>';
      html += '<span class="pr-alt-gz">' + alt.ganzhi + '日</span>';
      html += '<span style="color:#3498db;font-size:12px">男' + alt.maleScore + '</span>';
      html += '<span style="color:#e91e63;font-size:12px">女' + alt.femaleScore + '</span>';
      html += '<span class="pr-alt-score">' + alt.coupleScore + '分/' + alt.level + '</span>';
      if (alt.weddingGood.length > 0) {
        html += '<span style="font-size:11px;opacity:.6">' + alt.weddingGood.join('、') + '</span>';
      }
      html += '</div>';
    }
    html += '</div>';
  }

  // 避免日期
  if (avoid.length > 0) {
    html += '<div class="pr-avoid-section">';
    html += '<div class="pr-avoid-title">⚠️ 避免日期</div>';
    for (var i = 0; i < avoid.length; i++) {
      var av = avoid[i];
      var avD = av.date;
      html += '<div class="pr-avoid-item">';
      html += '<span>' + (avD.getMonth() + 1) + '月' + avD.getDate() + '日</span>';
      html += '<span class="pr-avoid-score">' + av.coupleScore + '分</span>';
      html += '<span>' + av.ganzhi + '日</span>';
      var reasons = [];
      if (av.maleChongSha) reasons.push('冲男方');
      if (av.femaleChongSha) reasons.push('冲女方');
      if (av.maleHasChong) reasons.push('冲男日支');
      if (av.femaleHasChong) reasons.push('冲女日支');
      if (av.weddingBad.length > 0) reasons.push(av.weddingBad.join('、'));
      html += '<span style="opacity:.6;font-size:11px">' + reasons.join('，') + '</span>';
      html += '</div>';
    }
    html += '</div>';
  }

  // 吉时推荐
  if (top.length > 0) {
    html += '<div class="pr-ai-section">';
    html += '<div class="pr-ai-title">🕐 吉时推荐</div>';
    html += '<div class="pr-ai-content">';
    var bestDay = top[0];
    var goodHours = [];
    for (var h = 0; h < 12; h++) {
      var hourZhiIdx = h;
      var hourZhiName = DI_ZHI[hourZhiIdx];
      // 检查时辰与日柱关系
      var hourZhiEle = ZHI_ELE[hourZhiName];
      var hourRelM = _wuxingRelation(mYS.dayEle, hourZhiEle);
      var hourRelF = _wuxingRelation(fYS.dayEle, hourZhiEle);
      var hourScore = 0;
      if (hourRelM === '被生' || hourRelM === '相同') hourScore += 2;
      if (hourRelF === '被生' || hourRelF === '相同') hourScore += 2;
      // 检查时辰冲日支
      var chongH = Math.abs(hourZhiIdx - bestDay.dayGZ.zhi) === 6;
      if (chongH) hourScore -= 5;
      // 黄道时辰
      var hourZS = getZhishen(bestDay.dayGZ.gan, hourZhiIdx);
      if (ZHISHEN_TYPE[hourZS]) hourScore += 1;
      if (hourScore >= 3) {
        goodHours.push({ idx: h, name: hourZhiName + '时', score: hourScore, zs: hourZS });
      }
    }
    goodHours.sort(function(a, b) { return b.score - a.score; });
    var topHours = goodHours.slice(0, 3);
    if (topHours.length > 0) {
      var hourRanges = ['23-1时', '1-3时', '3-5时', '5-7时', '7-9时', '9-11时', '11-13时', '13-15时', '15-17时', '17-19时', '19-21时', '21-23时'];
      for (var hi = 0; hi < topHours.length; hi++) {
        var hInfo = topHours[hi];
        html += '<div style="margin:4px 0"><span style="color:var(--gold)">★</span> <b>' + hInfo.name + '</b>（' + hourRanges[hInfo.idx] + '） — ' + hInfo.zs + '时</div>';
      }
    } else {
      html += '<div style="opacity:.6">当日各时辰中规中矩，建议选择上午吉时（辰时/巳时）行礼。</div>';
    }
    html += '</div></div>';
  }

  // 免责声明
  html += '<div style="margin-top:16px;padding:16px;background:rgba(201,168,76,.03);border:1px solid rgba(201,168,76,.1);border-radius:8px;text-align:center">';
  html += '<p style="font-size:12px;color:var(--gold);opacity:.5;line-height:1.8">⚠️ 免责声明：以上推荐基于传统命理学双方八字合参理论，仅供参考。婚嫁择日还需结合家庭实际情况、宾客安排等因素综合决定。</p>';
  html += '</div>';

  // ═══ 三元九运择日维度 ═══
  try {
    html += _generateSanyuanJiuyunBlock('zeri', {
      currentYear: new Date().getFullYear()
    });
  } catch(e) { console.warn('[三元九运合婚择日分析块失败]', e.message); }

  html += '</div>';

  return html;
}

// ================================================================
// ===== 生子择日 (BIRTH_ZERI) =====
// 剖腹产择吉日吉时，为新生宝宝选好命格
// ================================================================

/**
 * 评估某时辰八字命格层次
 * @param {number} year - 公历年
 * @param {number} month - 公历月
 * @param {number} day - 公历日
 * @param {number} hour - 时辰(0-11)
 * @returns {Object} {bazi, score, geju, yongshen, wuxingBalance, dishi}
 */
function _evalBirthBazi(year, month, day, hour) {
  var bazi = {};
  try {
    bazi = getBaziCalcData(year, month, day, hour, 'male');
  } catch(e) {
    return { score: 0, error: '八字计算失败' };
  }

  var ys = _extractYongShen(bazi);
  var score = 50;
  var details = [];

  // 1. 五行平衡度（25分）
  var eleCount = bazi.eleCount || {};
  var total = bazi.total || 8;
  var balance = 0;
  var expected = total / 5;
  for (var k in eleCount) {
    balance += Math.abs(eleCount[k] - expected);
  }
  var balanceScore = Math.max(0, 25 - Math.round(balance * 3));
  score += balanceScore;
  details.push('五行平衡度' + balanceScore + '/25（' + (balanceScore >= 18 ? '五行流通' : balanceScore >= 12 ? '基本平衡' : '偏枯') + '）');

  // 2. 格局（20分）
  var geju = bazi.geju || {};
  var gejuScore = 10;
  if (geju.name) {
    var goodGeju = ['正官格', '正财格', '正印格', '食神格', '七杀格', '偏财格', '偏印格', '伤官格', '建禄格', '月刃格', '羊刃格'];
    if (goodGeju.indexOf(geju.name) !== -1) {
      gejuScore = 15;
      if (['正官格', '正财格', '正印格', '食神格'].indexOf(geju.name) !== -1) {
        gejuScore = 18;
      }
    }
    details.push('格局「' + geju.name + '」' + gejuScore + '/20');
  }
  score += gejuScore;

  // 3. 用神有力（20分）
  var yongshenEle = ys.yongshenEle || ys.xiEle || '水';
  var yongshenScore = 10;
  // 检查用神是否在八字中有根
  var yongshenCount = eleCount[yongshenEle] || 0;
  if (yongshenCount >= 2) {
    yongshenScore = 18;
    details.push('用神' + yongshenEle + '有力（' + yongshenCount + '个）' + yongshenScore + '/20');
  } else if (yongshenCount >= 1) {
    yongshenScore = 12;
    details.push('用神' + yongshenEle + '有根（' + yongshenCount + '个）' + yongshenScore + '/20');
  } else {
    yongshenScore = 5;
    details.push('用神' + yongshenEle + '无根' + yongshenScore + '/20');
  }
  score += yongshenScore;

  // 4. 长生十二宫（15分）
  var dishi = bazi.dishi || [];
  var dishiScore = 8;
  var goodPositions = ['长生', '冠带', '临官', '帝旺'];
  var badPositions = ['死', '墓', '绝'];
  for (var di = 0; di < dishi.length; di++) {
    if (goodPositions.indexOf(dishi[di]) !== -1) dishiScore += 2;
    if (badPositions.indexOf(dishi[di]) !== -1) dishiScore -= 1;
  }
  dishiScore = Math.max(3, Math.min(15, dishiScore));
  score += dishiScore;
  details.push('长生位' + dishiScore + '/15');

  // 5. 十神配置（10分）
  var tenGods = bazi.tenGods || [];
  var tgScore = 6;
  var tgStr = tenGods.join(' ');
  if (tgStr.indexOf('正官') !== -1 || tgStr.indexOf('正财') !== -1) tgScore += 2;
  if (tgStr.indexOf('正印') !== -1 || tgStr.indexOf('食神') !== -1) tgScore += 2;
  tgScore = Math.min(10, tgScore);
  score += tgScore;
  details.push('十神配置' + tgScore + '/10');

  // 6. 神煞加分（10分）
  var shensha = bazi.shensha || {};
  var ssScore = 5;
  var goodShensha = ['天乙贵人', '太极贵人', '文昌', '天德', '月德', '将星', '驿马', '禄神'];
  for (var gk in shensha) {
    var vals = shensha[gk];
    if (!Array.isArray(vals)) vals = [vals];
    for (var vi = 0; vi < vals.length; vi++) {
      if (goodShensha.indexOf(vals[vi]) !== -1) ssScore += 2;
    }
  }
  ssScore = Math.min(10, ssScore);
  score += ssScore;
  details.push('神煞' + ssScore + '/10');

  return {
    bazi: bazi,
    score: Math.max(30, Math.min(100, score)),
    geju: geju,
    yongshen: ys,
    wuxingBalance: balanceScore,
    dishi: dishi,
    details: details,
    eleCount: eleCount
  };
}

/**
 * 生子择日主函数
 * @param {Object} fatherInfo - {name, birthDate, birthHour}
 * @param {Object} motherInfo - {name, birthDate, birthHour}
 * @param {string} dueDateStr - 预产期日期字符串 'YYYY-MM-DD'
 * @returns {Object} result
 */
function computeZeRiBirth(fatherInfo, motherInfo, dueDateStr) {
  var result = {
    father: fatherInfo,
    mother: motherInfo,
    dueDate: dueDateStr,
    candidates: [],
    topCandidates: [],
    report: null
  };

  // === 解析父亲八字 ===
  var fDate = fatherInfo.birthDate ? new Date(fatherInfo.birthDate + 'T12:00:00') : new Date(1985, 0, 1);
  var fYear = fDate.getFullYear(), fMonth = fDate.getMonth() + 1, fDay = fDate.getDate();
  var fHour = parseInt(fatherInfo.birthHour) || 0;
  var fBazi = {};
  try {
    fBazi = getBaziCalcData(fYear, fMonth, fDay, fHour, 'male');
  } catch(e) {
    fBazi = { dayStemIdx: 0, dayBranchIdx: 0 };
  }
  var fYS = _extractYongShen(fBazi);

  // === 解析母亲八字 ===
  var mDate = motherInfo.birthDate ? new Date(motherInfo.birthDate + 'T12:00:00') : new Date(1988, 0, 1);
  var mYear = mDate.getFullYear(), mMonth = mDate.getMonth() + 1, mDay = mDate.getDate();
  var mHour = parseInt(motherInfo.birthHour) || 0;
  var mBazi = {};
  try {
    mBazi = getBaziCalcData(mYear, mMonth, mDay, mHour, 'female');
  } catch(e) {
    mBazi = { dayStemIdx: 1, dayBranchIdx: 1 };
  }
  var mYS = _extractYongShen(mBazi);

  // === 搜索范围：预产期前后7天 ===
  var dueDate = dueDateStr ? new Date(dueDateStr + 'T12:00:00') : new Date();
  var startDate = new Date(dueDate);
  startDate.setDate(startDate.getDate() - 7);
  var endDate = new Date(dueDate);
  endDate.setDate(endDate.getDate() + 7);

  // 遍历每一天，每天评估12个时辰
  for (var di = 0; di <= 14; di++) {
    var d = new Date(startDate);
    d.setDate(d.getDate() + di);
    d.setHours(12, 0, 0, 0);

    var Y = d.getFullYear(), M = d.getMonth() + 1, D = d.getDate();
    var dayGZ = getDayGanZhi(Y, M, D);

    // 检查日冲父母
    var shaInfo = CHONGSHA_DETAIL[DI_ZHI[dayGZ.zhi]] || { chong: '?', sha: '?' };
    var chongFather = shaInfo.chong === SHENG_XIAO[fYS.branchIdx];
    var chongMother = shaInfo.chong === SHENG_XIAO[mYS.branchIdx];

    // 日支冲父母日支
    var chongFPairs = [[0,6],[1,7],[2,8],[3,9],[4,10],[5,11]];
    var chongFDayZhi = false, chongMDayZhi = false;
    for (var ci = 0; ci < chongFPairs.length; ci++) {
      if ((chongFPairs[ci][0] === fYS.branchIdx && chongFPairs[ci][1] === dayGZ.zhi) ||