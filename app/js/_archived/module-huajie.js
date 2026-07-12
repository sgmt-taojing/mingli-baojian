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
  // 流月天干地支表（丙午年为例，按年干推算月干）
  // 月支固定: 寅卯辰巳午未申酉戌亥子丑（正月~十二月）
  // 月干由年干推算（五虎遁）
  const yearStemIdx = STEMS.indexOf(hj.pillars[0].stem);
  const monthBranches = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
  // 五虎遁: 甲己起丙寅, 乙庚起戊寅, 丙辛起庚寅, 丁壬起壬寅, 戊癸起甲寅
  const startMonthStemIdx = [2, 4, 6, 8, 0][yearStemIdx % 5]; // 甲己->丙(2), 乙庚->戊(4), 丙辛->庚(6), 丁壬->壬(8), 戊癸->甲(0)

  // 日主五行
  const dayStem = hj.dayStem;
  const dayEle = ELE[dayStem] || '木';
  const xiEle = hj.xiEle || '木';
  const jiEle = hj.strongestEle || '金';

  // 五行生克关系
  const shengMap = {'木':'火','火':'土','土':'金','金':'水','水':'木'}; // 生
  const keMap = {'木':'土','土':'水','水':'火','火':'金','金':'木'}; // 克
  const beiShengMap = {'木':'水','火':'木','土':'火','金':'土','水':'金'}; // 被生(生我者)
  const beiKeMap = {'木':'金','土':'木','水':'土','火':'水','金':'火'}; // 被克(克我者)

  // 根据日主五行与流月干支五行关系计算吉凶
  function computeMonthLuck(monthStem, monthZhi) {
    const stemEle = ELE[monthStem];
    const zhiEle = ZHI_ELE[monthZhi];
    // 综合月干月支五行
    const monthEle = stemEle === zhiEle ? stemEle : (stemEle + '/' + zhiEle);

    let score = 0;
    let luckArea = '综合';
    let desc = '';

    // 判断月支五行与日主关系
    if (zhiEle === dayEle) {
      score += 2; desc += '比劫当令，竞争与机遇并存。';
      luckArea = '事业';
    } else if (shengMap[zhiEle] === dayEle) {
      score += 3; desc += '印星护身(' + zhiEle + '生' + dayEle + ')，贵人相助。';
      luckArea = '学业';
    } else if (shengMap[dayEle] === zhiEle) {
      score += 2; desc += '食伤泄秀(' + dayEle + '生' + zhiEle + ')，才华发挥。';
      luckArea = '事业';
    } else if (keMap[dayEle] === zhiEle) {
      score += 2; desc += '财星当令(' + dayEle + '克' + zhiEle + ')，财运显现。';
      luckArea = '财运';
    } else if (keMap[zhiEle] === dayEle) {
      score -= 2; desc += '官杀克身(' + zhiEle + '克' + dayEle + ')，压力较大。';
      luckArea = '健康';
    }

    // 判断月干五行与日主关系
    if (stemEle === xiEle) {
      score += 1; desc += '月干' + stemEle + '为喜用，助力运势。';
    } else if (stemEle === jiEle) {
      score -= 1; desc += '月干' + stemEle + '为忌神，需防不利。';
    }

    // 判断是否与喜用神一致
    if (zhiEle === xiEle) {
      score += 2; desc += '月支' + zhiEle + '为喜用神，运势上扬。';
    } else if (zhiEle === jiEle) {
      score -= 1; desc += '月支' + zhiEle + '为忌神，需谨慎。';
    }

    // 特殊地支关系
    if (monthZhi === '午' || monthZhi === '子') {
      desc += '注意心脏、血液循环健康。';
    } else if (monthZhi === '卯' || monthZhi === '酉') {
      desc += '桃花星动，感情方面需留意。';
      if (luckArea === '综合') luckArea = '感情';
    }

    let overall;
    if (score >= 3) overall = '吉';
    else if (score <= -2) overall = '凶';
    else overall = '平';

    return { overall, luck: luckArea, desc, score };
  }

  // 动态生成月度数据
  // 通用月度运势参考（基于节气五行生克，非个性化排盘）
    const monthData = [];
  for (let i = 0; i < 12; i++) {
    const mStemIdx = (startMonthStemIdx + i) % 10;
    const mStem = STEMS[mStemIdx];
    const mZhi = monthBranches[i];
    const luck = computeMonthLuck(mStem, mZhi);
    const monthDesc = luck.desc || (monthNames[i] + '·' + mStem + mZhi + '月，' + luck.luck + '方面需关注。');
    monthData.push({
      month: monthNames[i],
      stem: mStem,
      zhi: mZhi,
      overall: luck.overall,
      luck: luck.luck,
      desc: monthDesc
    });
  }

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

// ═══ 年龄段化解方案 ═══
function getAgeBasedHuajie(hj) {
  var birthYear = hj.year;
  var currentYear = hj.currentYear || new Date().getFullYear();
  var age = currentYear - birthYear;
  var sex = hj.sex;
  var dayEle = ELE[hj.dayStem] || '木';
  var xiEle = hj.xiEle || '水';
  var weakestEle = hj.weakestEle || '金';

  // 引用知识库数据
  var AGE_KB = (typeof window.HUAJIE_AGE !== 'undefined') ? window.HUAJIE_AGE : null;

  // 统计十神
  var tenGods = hj.tenGods || [];
  var tgCount = {};
  for (var i = 0; i < tenGods.length; i++) {
    tgCount[tenGods[i]] = (tgCount[tenGods[i]] || 0) + 1;
  }
  var hasZhengCai = (tgCount['正财'] || 0) > 0;
  var hasPianCai = (tgCount['偏财'] || 0) > 0;
  var hasZhengGuan = (tgCount['正官'] || 0) > 0;
  var hasQiSha = (tgCount['七杀'] || 0) > 0;
  var hasZhengYin = (tgCount['正印'] || 0) > 0;
  var hasPianYin = (tgCount['偏印'] || 0) > 0;
  var hasShiShen = (tgCount['食神'] || 0) > 0;
  var hasShangGuan = (tgCount['伤官'] || 0) > 0;
  var hasBiJian = (tgCount['比肩'] || 0) > 0;
  var hasJieCai = (tgCount['劫财'] || 0) > 0;

  // 神缭
  var shensha = hj.shensha || [];
  var hasGuiren = false;
  var hasWenchang = false;
  var hasTaohua = false;
  for (var s = 0; s < shensha.length; s++) {
    if (shensha[s].name.indexOf('天乙') >= 0) hasGuiren = true;
    if (shensha[s].name.indexOf('文昌') >= 0) hasWenchang = true;
    if (shensha[s].name.indexOf('桃花') >= 0) hasTaohua = true;
  }

  var html = '<div class="analysis-card" style="border-left:3px solid var(--gold)">';
  html += '<div style="font-size:13px;color:var(--paper2);margin-bottom:14px;line-height:1.8">';
  html += '缘主今年 <b style="color:var(--gold);font-size:16px">' + age + '</b> 岁，';

  // 判断年龄段
  var stage = '';
  if (age <= 18) {
    stage = 'xueye';
    html += '正值 <b style="color:var(--cyan2)">求学阶段</b>，以下为学业化解与开运建议：</div>';
  } else if (age <= 25) {
    stage = 'xueye_career';
    html += '处于 <b style="color:var(--cyan2)">学业与事业过渡期</b>，以下为升学就业化解建议：</div>';
  } else if (age <= 35) {
    stage = 'career_marriage';
    html += '处于 <b style="color:var(--cyan2)">事业起步与婚恋关键期</b>，以下为求偶成家与事业化解建议：</div>';
  } else if (age <= 50) {
    stage = 'career_peak';
    html += '处于 <b style="color:var(--cyan2)">事业中坚阶段</b>，以下为求贵人调动与财运化解建议：</div>';
  } else if (age <= 60) {
    stage = 'harvest';
    html += '处于 <b style="color:var(--cyan2)">收获与稳定阶段</b>，以下为健康守业与传承化解建议：</div>';
  } else {
    stage = 'senior';
    html += '处于 <b style="color:var(--cyan2)">颐养天年阶段</b>，以下为健康延寿与子孙化解建议：</div>';
  }

  html += '<div class="analysis-grid" style="grid-template-columns:1fr 1fr;margin-top:12px">';

  // === 各年龄段化解建议 ===
  var stages = [];

  // 1. 求学阶段 (18岁以下)
  stages.push({
    title: '📚 求学业化解',
    show: age <= 25,
    items: [
      !hasZhengYin ? '命中缺正印，记忆力偏弱，宜在书桌东南方放文昌塔补救，佩戴白水晶增强专注' : '命中正印星在，学习天赋不错，保持东南方文昌位整洁即可',
      !hasWenchang ? '无文昌星，可在流年文昌位（2026年正东）放四支毛笔催旺学业' : '文昌星照命，学业有天赋，把握农历三四月考试黄金期',
      '床头朝向喜用神方位（' + (xiEle === '木' ? '东方' : xiEle === '火' ? '南方' : xiEle === '土' ? '西南' : xiEle === '金' ? '西方' : '北方') + '），有助于睡眠与记忆',
      '考试当天穿喜用色（' + (xiEle === '木' ? '绿色' : xiEle === '火' ? '红色' : xiEle === '土' ? '黄色' : xiEle === '金' ? '白色' : '蓝色') + '）衣物，增强临场发挥',
      '饮食多补' + xiEle + '行食物（' + (xiEle === '木' ? '绿色蔬菜、酸味水果' : xiEle === '火' ? '红枣、红豆、苦味食物' : xiEle === '土' ? '山药、小米、南瓜' : xiEle === '金' ? '银耳、百合、白萝卜' : '黑豆、海带、黑芝麻') + '）'
    ],
    amulet: '文昌塔、文昌笔、魁星挂坠、白水晶柱',
    avoid: '书桌忌背门、忌对窗；考前忌食生冷；忌过度熬夜伤印'
  });

  // 2. 求桃花/婚恋 (22-35岁)
  stages.push({
    title: '🌸 求桃花姻缘化解',
    show: age >= 20 && age <= 40,
    items: [
      !hasTaohua ? '命中无桃花星，可在卧室正南方放粉色花瓶+鲜花催旺异性缘' : '桃花星在命，人缘佳，但需防烂桃花，佩戴黑曜石挡劣质缘分',
      !hasZhengCai && sex === 'male' ? '命中缺正财（正妻星），感情路较曲折，宜在流年桃花位放粉色水晶球，多参加婚宴沾喜气' : (hasZhengCai && sex === 'male' ? '正财星在命，姻缘有根，珍惜眼前人，卧室西南方放鸳鸯摆件稳固感情' : ''),
      !hasZhengGuan && sex === 'female' ? '命中缺正官（夫星），姻缘来得晚，宜在卧室西北方放粉色水晶球催旺夫星，多行善积德求好姻缘' : (hasZhengGuan && sex === 'female' ? '正官星在命，夫缘较好，佩戴粉水晶手链稳固感情，忌佩戴过多黑曜石' : ''),
      '桃花位在' + (hj.dayStem === '甲' || hj.dayStem === '戊' || hj.dayStem === '壬' ? '正东，宜放水生植物和花瓶' : hj.dayStem === '乙' || hj.dayStem === '己' || hj.dayStem === '癸' ? '东北，宜放陶瓷花瓶+鲜花' : hj.dayStem === '丙' || hj.dayStem === '庚' ? '正南，宜放红色花瓶+9朵红花' : '东南，宜放紫水晶+粉色摆件'),
      '相亲约会选农历二月、八月（桃花月），穿' + (xiEle === '木' ? '绿色系' : xiEle === '火' ? '红色系' : xiEle === '土' ? '暖黄系' : xiEle === '金' ? '白色系' : '蓝色系') + '衣物增气场'
    ],
    amulet: '粉水晶手链、鸳鸯摆件、红绳脚链、桃花符',
    avoid: '卧室忌放干花假花（招虚假缘分）；镜子忌对床（冲散气场）；忌穿全黑赴相亲'
  });

  // 3. 求事业调动/遇贵人 (25-55岁)
  stages.push({
    title: '🚀 求事业调动 · 遇贵人化解',
    show: age >= 22 && age <= 60,
    items: [
      !hasGuiren ? '命中无天乙贵人，事业上靠自己打拼多。化解法：在办公桌西北方放铜制麒麟一对催贵人，多与属' + (hj.dayStem === '甲' || hj.dayStem === '戊' ? '牛、羊' : hj.dayStem === '乙' || hj.dayStem === '己' ? '鼠、猴' : hj.dayStem === '丙' || hj.dayStem === '丁' ? '猪、鸡' : hj.dayStem === '戊' || hj.dayStem === '己' ? '虎、马' : '兔、蛇') + '的人合作' : '天乙贵人在命，遇难有贵人助，保持谦虚感恩，贵运会越来越旺',
      !hasZhengGuan && !hasQiSha ? '命中缺官杀，事业动力不足，升迁慢。化解：在办公室正北方放黑色水晶柱增强事业星，穿深色正装增加气场威信' : (hasZhengGuan ? '正官星在命，适合体制内发展，把握农历七八月升迁机会' : '七杀在命，适合创业竞争型行业，但需防过于冒进'),
      '求职/调动方向：喜走' + (xiEle === '木' ? '东方、东南方' : xiEle === '火' ? '南方' : xiEle === '土' ? '本地、西南、东北' : xiEle === '金' ? '西方、西北方' : '北方') + '，忌走' + (weakestEle === '木' ? '西方（金克木）' : weakestEle === '火' ? '北方（水克火）' : weakestEle === '土' ? '东方（木克土）' : weakestEle === '金' ? '南方（火克金）' : '中央/本地（土克水）'),
      '遇贵人时间：每日' + (xiEle === '木' ? '寅卯时(3-7点)' : xiEle === '火' ? '巳午时(9-13点)' : xiEle === '土' ? '辰戌丑未时(7-9,19-21点)' : xiEle === '金' ? '申酉时(15-19点)' : '亥子时(21-1点)') + '为喜神当令，重要会面安排在此时段',
      '办公桌风水：左手青龙位宜高（放书架/绿植），右手白虎位宜低（放文具/水杯），背后有靠不靠窗'
    ],
    amulet: '天乙贵人符、铜麒麟、白水晶球、黄虎眼石手链',
    avoid: '办公室忌背门而坐；忌头顶横梁；忌与领导办公室门对门冲'
  });

  // 4. 求财/补缺 (25-60岁)
  stages.push({
    title: '💰 求财运 · 补缺化解',
    show: age >= 22,
    items: [
      !hasZhengCai ? '命中缺正财，工资收入型财运弱，宜选择稳定职业+副业双线发展。化解：在居家东南方财位放聚宝盆+黄水晶球，每月初九向东南方焚香祈福' : '正财星在命，工薪收入稳定，宜在正财月（农历三、七月）做理财规划',
      !hasPianCai ? '命中缺偏财，横财运弱，不宜赌博投机。化解：在正南方放三足金蟾招偏财，多做善事积偏财福报' : '偏财星在命，有意外财机会，但需防财来财去，佩戴黄虎眼石锁财',
      !hasShiShen && !hasShangGuan ? '命中缺食伤，财源少（食伤生财），不善表达推销。化解：多学习沟通技巧，佩戴绿幽灵水晶开发食伤，在办公室东面放绿色植物助生财' : (hasShiShen ? '食神在命，财源稳定，适合技术型/创意型工作，佩戴绿幽灵增强' : '伤官在命，才华横溢但易得罪人，佩戴紫水晶平衡性情'),
      '财位方位：' + (hj.dayStem === '甲' ? '东南方，宜放聚宝盆+黄水晶' : hj.dayStem === '乙' ? '正东方，宜放铜葫芦' : hj.dayStem === '丙' ? '西南方，宜放黄水晶聚宝盆' : hj.dayStem === '丁' ? '正西方，宜放金属聚宝盆' : hj.dayStem === '戊' ? '正北方，宜放黑色聚宝盆' : hj.dayStem === '己' ? '西北方，宜放蓝色聚宝盆' : hj.dayStem === '庚' ? '东北方，宜放绿幽灵水晶' : hj.dayStem === '辛' ? '正东方，宜放木质聚宝盆' : hj.dayStem === '壬' ? '正南方，宜放红色聚宝盆' : '东南方，宜放紫色聚宝盆'),
      '求财吉日：每月逢' + (xiEle === '木' ? '三、八' : xiEle === '火' ? '二、七' : xiEle === '土' ? '五、十' : xiEle === '金' ? '四、九' : '一、六') + '的日子利签合同、谈生意'
    ],
    amulet: '黄水晶聚宝盆、五帝钱、三足金蟾、貔貅手链',
    avoid: '财位忌放垃圾桶；忌大门对阳台（穿堂煞漏财）；忌钱包随意乱放'
  });

  // 5. 中老年健康守业 (50岁以上)
  stages.push({
    title: '🌿 健康守业 · 晚年化解',
    show: age >= 50,
    items: [
      '日主' + hj.dayStem + '(' + dayEle + ')，需注意' + (dayEle === '木' ? '肝胆系统，忌熬夜动怒' : dayEle === '火' ? '心血管眼睛，忌过劳激动' : dayEle === '土' ? '脾胃消化，忌暴饮饮食' : dayEle === '金' ? '呼吸系统，忌抽烟雾霾' : '肾膀胱，忌久坐憋尿'),
      '居家风水：卧室选在' + (xiEle === '木' ? '东' : xiEle === '火' ? '南' : xiEle === '土' ? '西南' : xiEle === '金' ? '西' : '北') + '方位房间，床头朝吉方',
      '佩戴' + (dayEle === '木' ? '翡翠、绿幽灵养肝' : dayEle === '火' ? '红玛瑙、石榴石养心' : dayEle === '土' ? '黄水晶、和田玉养胃' : dayEle === '金' ? '白水晶、银饰养肺' : '海蓝宝、黑曜石养肾'),
      '每年立春后去寺庙祈福消灾，化解流年不利',
      '适度运动：' + (dayEle === '木' ? '散步、太极' : dayEle === '火' ? '游泳、瑜伽' : dayEle === '土' ? ' gardening、慢走' : dayEle === '金' ? '登山、快走' : '游泳、内家拳')
    ],
    amulet: '本命佛、玉石平安扣、黑曜石手链、长寿符',
    avoid: '忌卧室放过多电子设备；忌床头朝西（归阴位）；忌过度操劳子女事务'
  });

  for (var si = 0; si < stages.length; si++) {
    var st = stages[si];
    if (!st.show) continue;
    html += '<div class="analysis-card" style="border-left:3px solid var(--gold2)">';
    html += '<h5 style="color:var(--gold2)">' + st.title + '</h5>';
    html += '<ul class="huajie-checklist">';
    for (var ii = 0; ii < st.items.length; ii++) {
      if (st.items[ii]) html += '<li>' + st.items[ii] + '</li>';
    }
    html += '</ul>';
    html += '<div class="huajie-row"><span style="opacity:.5">开运饰品</span><span>' + st.amulet + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5;color:#e74c3c">忌</span><span>' + st.avoid + '</span></div>';
    html += '</div>';
  }

  html += '</div>'; // close grid
  html += '</div>'; // close card
  return html;
}

// ═══ 十神缺失分析与化解 ═══
function getTenGodMissingHuajie(hj) {
  var tenGods = hj.tenGods || [];
  var tgCount = {};
  for (var i = 0; i < tenGods.length; i++) {
    tgCount[tenGods[i]] = (tgCount[tenGods[i]] || 0) + 1;
  }

  // 十神定义与缺失化解方案
  var tgData = {
    '正财': {
      icon: '💰', desc: '正财代表正当收入、工薪财运，男命也代表妻子',
      missing: '缺正财者工薪收入型财运弱，男命姻缘较迟或妻子缘分薄',
      remedy: '在居家东南方财位放黄水晶聚宝盆；选择稳定职业+技能副业双线发展；每月初九焚香向东南方祈福；佩戴黄虎眼石手链',
      food: '黄色食物（玉米、南瓜、小米）',
      direction: '东南方',
      color: '黄色、金色'
    },
    '偏财': {
      icon: '🎰', desc: '偏财代表意外之财、投资收益、横财，也代表父亲',
      missing: '缺偏财者横财运弱，不宜投机赌博，投资宜稳健型',
      remedy: '在正南方放三足金蟾（头朝内）；多做善事积偏财福报；佩戴黄水晶或金发晶；逢偏财月（农历五、十一月）可小额尝试投资',
      food: '红色食物（红枣、枸杞、红豆）',
      direction: '正南方',
      color: '红色、紫色'
    },
    '正官': {
      icon: '⚖️', desc: '正官代表事业职位、权力地位，女命代表丈夫',
      missing: '缺正官者事业升迁动力不足，女命姻缘较迟或夫缘薄',
      remedy: '在办公室正北方放黑色水晶柱增强事业星；穿深色正装增加威信气场；多参加体制内考试或资质认证；佩戴黑曜石吊坠',
      food: '黑色食物（黑豆、黑芝麻、海带）',
      direction: '正北方',
      color: '黑色、深蓝'
    },
    '七杀': {
      icon: '⚔️', desc: '七杀代表魄力、竞争、权威，也代表压力和挑战',
      missing: '缺七杀者性格温和少竞争意识，做事容易安于现状',
      remedy: '在办公桌西方放铜制宝剑（装饰用）增强决断力；多参与竞争性活动锻炼魄力；佩戴白水晶柱；选择有挑战性的工作',
      food: '白色食物（银耳、百合、白萝卜）',
      direction: '西方',
      color: '白色、银色'
    },
    '正印': {
      icon: '📖', desc: '正印代表学历、记忆、保护、母亲缘分',
      missing: '缺正印者记忆力偏弱，学历助力少，与母亲缘分薄',
      remedy: '在书桌东南方放文昌塔或四支毛笔；多读书学习补印星；佩戴白水晶柱增强专注力；床头朝喜用神方位',
      food: '绿色食物（绿叶蔬菜、绿茶）',
      direction: '东南方',
      color: '绿色、青色'
    },
    '偏印': {
      icon: '🔮', desc: '偏印代表直觉、技艺、副业才能、玄学缘分',
      missing: '缺偏印者直觉力弱，对玄学技艺类兴趣少，副业发展难',
      remedy: '在卧室西北方放紫水晶簇开发直觉；多接触易学、玄学、艺术；佩戴紫水晶手链；学习一门手艺或技能',
      food: '紫色食物（紫薯、葡萄、紫甘蓝）',
      direction: '西北方',
      color: '紫色'
    },
    '食神': {
      icon: '🍚', desc: '食神代表才华、口福、子息、财源（食神生财）',
      missing: '缺食神者财源少不善表达，口福薄，子女缘弱',
      remedy: '在办公室东面放绿色植物助生财；多学习沟通表达技巧；佩戴绿幽灵水晶开发食伤；多做美食享口福',
      food: '绿色蔬菜、酸味水果',
      direction: '正东方',
      color: '绿色'
    },
    '伤官': {
      icon: '🎤', desc: '伤官代表才华横溢、口才、艺术、创新',
      missing: '缺伤官者表达能力一般，创新力弱，不善推销自己',
      remedy: '在卧室东南方放紫水晶洞开发才华；多参加演讲培训；佩戴紫水晶或蓝纹玛瑙；学习一门艺术',
      food: '紫色食物、酸味食物',
      direction: '东南方',
      color: '紫色、蓝色'
    },
    '比肩': {
      icon: '🤝', desc: '比肩代表兄弟姐妹、朋友同事、竞争伙伴',
      missing: '缺比肩者独立性强但缺少助力，兄弟姐妹缘分薄',
      remedy: '在客厅东方放绿植增强人际运；多参加社交活动拓展人脉；佩戴绿幽灵或翡翠手链；主动结交志同道合的朋友',
      food: '绿色食物、酸味食物',
      direction: '东方',
      color: '绿色'
    },
    '劫财': {
      icon: '🤜', desc: '劫财代表竞争、争财、合作伙伴、冲动消费',
      missing: '缺劫财者花钱理性但缺少竞争搭档，合伙运弱',
      remedy: '在办公桌南方放红玛瑙增强行动力；适当参与竞争性活动；佩戴红玛瑙手链；选择互补型合作伙伴而非竞争型',
      food: '红色食物、苦味食物',
      direction: '南方',
      color: '红色'
    }
  };

  var allTG = ['正财','偏财','正官','七杀','正印','偏印','食神','伤官','比肩','劫财'];
  var missing = [];
  var present = [];
  for (var ti = 0; ti < allTG.length; ti++) {
    if (!tgCount[allTG[ti]]) {
      missing.push(allTG[ti]);
    } else {
      present.push(allTG[ti]);
    }
  }

  var html = '';

  // 命中十神分布
  html += '<div style="margin-bottom:14px">';
  html += '<div style="font-size:12px;color:var(--paper3);margin-bottom:8px">命中十神分布：</div>';
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
  for (var pi = 0; pi < allTG.length; pi++) {
    var tg = allTG[pi];
    var cnt = tgCount[tg] || 0;
    var cls = cnt > 0 ? 'tag-fortunate' : 'tag-inauspicious';
    html += '<span class="' + cls + '" style="font-size:11px;padding:3px 8px;border-radius:6px">' + tgData[tg].icon + ' ' + tg + (cnt > 0 ? '×' + cnt : ' 缺') + '</span>';
  }
  html += '</div></div>';

  if (missing.length === 0) {
    html += '<div class="analysis-card" style="text-align:center;padding:20px"><b style="color:var(--jade2)">✅ 十神齐全，命局均衡</b><br><span style="font-size:12px;opacity:.6">十神齐全者性格全面，各方面运势较平衡，无需特别补缺。</span></div>';
    return html;
  }

  html += '<div style="font-size:13px;color:var(--cinn2);margin-bottom:12px">⚠️ 缺失 ' + missing.length + ' 个十神，以下为针对性化解方案：</div>';

  html += '<div class="analysis-grid" style="grid-template-columns:1fr 1fr">';
  for (var mi = 0; mi < missing.length; mi++) {
    var tg = missing[mi];
    var d = tgData[tg];
    html += '<div class="analysis-card" style="border-left:3px solid var(--cinn2)">';
    html += '<h5 style="color:var(--cinn2)">' + d.icon + ' 缺' + tg + '</h5>';
    html += '<div style="font-size:11px;opacity:.6;margin-bottom:8px">' + d.desc + '</div>';
    html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">影响</span><span style="font-size:12px">' + d.missing + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">化解</span><span style="font-size:12px">' + d.remedy + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">食物</span><span style="font-size:12px">' + d.food + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">方位</span><span style="font-size:12px">' + d.direction + '</span></div>';
    html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">颜色</span><span style="font-size:12px">' + d.color + '</span></div>';
    html += '</div>';
  }
  html += '</div>';

  // 补充：命中已有的十神优势
  if (present.length > 0) {
    html += '<div style="margin-top:14px;padding:12px;background:rgba(39,174,96,0.06);border-radius:8px;border:1px solid rgba(39,174,96,0.15)">';
    html += '<div style="font-size:12px;color:var(--jade2);margin-bottom:6px">✅ 命中已有的十神优势：</div>';
    for (var pi2 = 0; pi2 < present.length; pi2++) {
      var ptg = present[pi2];
      var pd = tgData[ptg];
      html += '<div style="font-size:12px;color:var(--paper2);margin-bottom:3px">' + pd.icon + ' <b style="color:var(--gold)">' + ptg + '</b>：' + pd.desc + '</div>';
    }
    html += '</div>';
  }

  return html;
}

// ═══ 漏财相分析与堵漏方案 ═══
function getLoucaiHuajie(hj) {
  var LC_KB = (typeof window.LOUCAI_ANALYSIS !== 'undefined') ? window.LOUCAI_ANALYSIS : null;
  var tenGods = hj.tenGods || [];
  var tgCount = {};
  for (var i = 0; i < tenGods.length; i++) {
    tgCount[tenGods[i]] = (tgCount[tenGods[i]] || 0) + 1;
  }
  var eleCount = hj.eleCount || {};
  var dayEle = ELE[hj.dayStem] || '木';
  var strongestEle = hj.strongestEle || '木';
  var weakestEle = hj.weakestEle || '金';
  var pillars = hj.pillars || [];

  var loucaiPatterns = [];

  // 1. 比劫夺财（比肩/劫财多而财少）
  var biCount = (tgCount['比肩'] || 0) + (tgCount['劫财'] || 0);
  var caiCount = (tgCount['正财'] || 0) + (tgCount['偏财'] || 0);
  if (biCount >= 2 && caiCount <= 1) {
    loucaiPatterns.push({
      name: '比劫夺财',
      icon: '🤜',
      severity: biCount >= 3 ? '严重' : '中度',
      desc: '命中比肩劫财多（' + biCount + '个），正偏财少（' + caiCount + '个），钱财易被他人分夺，借钱给朋友难收回，合伙生意易亏损',
      signs: ['朋友亲戚常来借钱且不还', '合伙生意总被占便宜', '冲动消费多，左手进右手出', '钱财易因面子/义气流失'],
      remedy: '佩戴黄虎眼石手链锁财；居家大门对角线财位放聚宝盆+五帝钱；借钱给他人前在手上画"锁"字；钱包选棕色/黄色系；忌与兄弟姐妹合伙生意；每月固定存一笔定期不可动',
      direction: '财位放大门对角线位置，保持整洁明亮'
    });
  }

  // 2. 财多身弱（财星多但日主弱）
  if (caiCount >= 3 && hj.isStrong === false) {
    loucaiPatterns.push({
      name: '财多身弱',
      icon: '💸',
      severity: '严重',
      desc: '命中财星多但日主弱，有钱赚但守不住，赚钱后身体差或因财惹事',
      signs: ['收入不低但总存不下钱', '赚钱后容易生病或出意外花钱', '因钱财惹是非纠纷', '有钱时朋友变多开销变大'],
      remedy: '佩戴日主五行饰品增强自身力量（' + dayEle + '行：' + (dayEle === '木' ? '翡翠绿幽灵' : dayEle === '火' ? '红玛瑙石榴石' : dayEle === '土' ? '黄水晶和田玉' : dayEle === '金' ? '白水晶金银饰' : '海蓝宝黑曜石') + '）；居家在日主吉位设卧室；切忌贪大求快，稳健积累；多做善事以财养德',
      direction: '卧室选在' + (dayEle === '木' ? '东方' : dayEle === '火' ? '南方' : dayEle === '土' ? '西南方' : dayEle === '金' ? '西方' : '北方') + '增强自身力量'
    });
  }

  // 3. 食伤生财过旺（食伤多但无财）
  var shiCount = (tgCount['食神'] || 0) + (tgCount['伤官'] || 0);
  if (shiCount >= 2 && caiCount === 0) {
    loucaiPatterns.push({
      name: '食伤生财无根',
      icon: '🎤',
      severity: '中度',
      desc: '命中食伤多但无财星，才华有但变不了现，付出多回报少',
      signs: ['能力强但收入匹配不上', '总在帮别人赚钱自己拿小头', '想法很多但落地的少', '容易被白嫖技能和劳动'],
      remedy: '在居家东南方放黄水晶球催财；学习商业思维把才华变现；佩戴黄水晶+绿幽灵组合；签合同必明码标价忌口头承诺；办公桌上放金属存钱罐',
      direction: '东南方放黄水晶球催财'
    });
  }

  // 4. 七杀克身（七杀多无印化）
  var shaCount = tgCount['七杀'] || 0;
  var yinCount = (tgCount['正印'] || 0) + (tgCount['偏印'] || 0);
  if (shaCount >= 1 && yinCount === 0) {
    loucaiPatterns.push({
      name: '七杀克身无印化',
      icon: '⚔️',
      severity: shaCount >= 2 ? '严重' : '中度',
      desc: '命中七杀克身又无印星化解，因压力/疾病/官非破财，钱财易因突发事件流失',
      signs: ['赚钱后突发意外花钱（生病、事故、纠纷）', '工作中压力大易因失误扣钱', '容易被罚款、赔偿、诉讼耗财', '钱财来得紧张去得突然'],
      remedy: '佩戴本命佛+黑曜石挡灾；在卧室北方放黑色水晶柱化杀；多做善事积德化灾；家中供奉观音或关帝；逢七杀年（流年七杀）提前买保险化解',
      direction: '卧室北方放黑色水晶柱化杀'
    });
  }

  // 5. 五行偏枯漏财
  if (eleCount[strongestEle] >= 5 && eleCount[weakestEle] <= 1) {
    loucaiPatterns.push({
      name: '五行偏枯漏财',
      icon: '⚖️',
      severity: '中度',
      desc: strongestEle + '行过旺（' + eleCount[strongestEle] + '个）' + weakestEle + '行极弱（' + eleCount[weakestEle] + '个），五行失衡导致财运不稳',
      signs: ['某方面花钱特别多（' + (strongestEle === '木' ? '教育/学习' : strongestEle === '火' ? '社交/应酬' : strongestEle === '土' ? '房产/家庭' : strongestEle === '金' ? '设备/工具' : '旅游/医疗') + '）', '收入起伏大，好时很好差时很差', '容易因' + strongestEle + '行相关事物大额支出'],
      remedy: '重点补' + weakestEle + '行：佩戴' + (weakestEle === '木' ? '翡翠绿幽灵檀木' : weakestEle === '火' ? '红玛瑙紫水晶' : weakestEle === '土' ? '黄水晶和田玉' : weakestEle === '金' ? '白水晶金银饰' : '海蓝宝黑曜石') + '；居家在' + (weakestEle === '木' ? '东方' : weakestEle === '火' ? '南方' : weakestEle === '土' ? '西南' : weakestEle === '金' ? '西方' : '北方') + '放相应五行物品；饮食多补' + weakestEle + '行食物',
      direction: '在' + (weakestEle === '木' ? '东方' : weakestEle === '火' ? '南方' : weakestEle === '土' ? '西南方' : weakestEle === '金' ? '西方' : '北方') + '方位补' + weakestEle + '行'
    });
  }

  // 6. 劫财多无正财
  if ((tgCount['劫财'] || 0) >= 1 && (tgCount['正财'] || 0) === 0) {
    loucaiPatterns.push({
      name: '劫财无正财',
      icon: '🤜',
      severity: '中度',
      desc: '命中劫财有但无正财，花钱冲动，容易被忽悠消费，收入不稳',
      signs: ['网购冲动消费多', '容易被推销洗脑', '钱在手里留不住，总想花', '经常买回不实用的东西'],
      remedy: '钱包内放五帝钱锁财；设置自动转存每月强制储蓄；购物前冷静3天原则；佩戴黄虎眼石手链增强理性；忌带多张信用卡',
      direction: '钱包内放五帝钱；居家财位放聚宝盆'
    });
  }

  var html = '';

  if (loucaiPatterns.length === 0) {
    html += '<div class="analysis-card" style="text-align:center;padding:20px">';
    html += '<b style="color:var(--jade2)">✅ 未发现明显漏财相</b><br>';
    html += '<span style="font-size:12px;opacity:.6">命局中财运结构较均衡，但仍建议日常注意理财、佩戴守财饰品以防流年变化带来的漏财风险。</span>';
    html += '</div>';
  } else {
    html += '<div style="font-size:13px;color:var(--cinn2);margin-bottom:14px">⚠️ 检测到 ' + loucaiPatterns.length + ' 种漏财相，以下为详细分析与堵漏方案：</div>';
    html += '<div class="analysis-grid" style="grid-template-columns:1fr">';
    for (var li = 0; li < loucaiPatterns.length; li++) {
      var p = loucaiPatterns[li];
      var sevColor = p.severity === '严重' ? 'var(--cinn2)' : 'var(--amber)';
      html += '<div class="analysis-card" style="border-left:3px solid ' + sevColor + '">';
      html += '<h5 style="color:' + sevColor + '">' + p.icon + ' ' + p.name + ' <span style="font-size:11px;padding:2px 8px;border-radius:6px;background:' + sevColor + ';color:#fff;margin-left:6px">' + p.severity + '</span></h5>';
      html += '<div style="font-size:12px;opacity:.7;margin-bottom:10px;line-height:1.8">' + p.desc + '</div>';
      // 漏财表现
      html += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">🔍 漏财表现：</div>';
      html += '<ul class="huajie-checklist">';
      for (var si2 = 0; si2 < p.signs.length; si2++) {
        html += '<li>' + p.signs[si2] + '</li>';
      }
      html += '</ul>';
      // 堵漏方案
      html += '<div style="font-size:12px;color:var(--jade2);margin-bottom:6px">🛡️ 堵漏方案：</div>';
      html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;padding:10px;background:rgba(39,174,96,0.06);border-radius:8px">' + p.remedy + '</div>';
      html += '<div class="huajie-row" style="margin-top:8px"><span style="opacity:.5;min-width:60px">方位</span><span style="font-size:12px">' + p.direction + '</span></div>';
      html += '</div>';
    }
    html += '</div>';
  }

  // 通用守财建议
  html += '<div style="margin-top:14px;padding:14px;background:rgba(201,168,76,0.06);border-radius:10px;border:1px solid rgba(201,168,76,0.15)">';
  html += '<div style="font-size:13px;color:var(--gold);margin-bottom:8px">💡 通用守财建议</div>';
  html += '<ul class="huajie-checklist" style="font-size:12px">';
  html += '<li>大门对角线位置为明财位，保持整洁明亮，忌放垃圾桶/重物压</li>';
  html += '<li>大门对阳台为穿堂煞，宜设玄关或屏风挡气不漏财</li>';
  html += '<li>钱包选棕色/黄色系，忌黑色（水冲财）或破旧钱包</li>';
  html += '<li>每月固定日期存一笔定期，强制储蓄堵漏</li>';
  html += '<li>佩戴貔貅手链（头朝外）或五帝钱锁财</li>';
  html += '<li>厨房灶台保持干净（灶为财库，脏则漏财）</li>';
  html += '</ul></div>';

  return html;
}

// ═══ 个性化催旺方案 · 缺什么催什么 ═══
function getMaPosition(yearBranch) {
  var maMap = {'寅':'申(西南)','午':'申(西南)','戌':'申(西南)','申':'寅(东北)','子':'寅(东北)','辰':'寅(东北)','巳':'亥(西北)','酉':'亥(西北)','丑':'亥(西北)','亥':'巳(东南)','卯':'巳(东南)','未':'巳(东南)'};
  return maMap[yearBranch] || '寅(东北)';
}

function getCuiwangPersonalized(hj) {
  var CW_KB = (typeof window.LOUCAI_ANALYSIS !== 'undefined' && window.LOUCAI_ANALYSIS.cuiWang) ? window.LOUCAI_ANALYSIS.cuiWang : null;
  var birthYear = hj.year;
  var currentYear = hj.currentYear || new Date().getFullYear();
  var age = currentYear - birthYear;
  var sex = hj.sex;
  var dayStem = hj.dayStem;
  var dayEle = ELE[dayStem] || '木';
  var xiEle = hj.xiEle || '水';
  var weakestEle = hj.weakestEle || '金';
  var pillars = hj.pillars || [];

  // 十神统计
  var tenGods = hj.tenGods || [];
  var tgCount = {};
  for (var i = 0; i < tenGods.length; i++) {
    tgCount[tenGods[i]] = (tgCount[tenGods[i]] || 0) + 1;
  }

  // 神缭
  var shensha = hj.shensha || [];
  var hasGuiren = false, hasWenchang = false, hasTaohua = false, hasMa = false;
  for (var s = 0; s < shensha.length; s++) {
    if (shensha[s].name.indexOf('天乙') >= 0) hasGuiren = true;
    if (shensha[s].name.indexOf('文昌') >= 0) hasWenchang = true;
    if (shensha[s].name.indexOf('桃花') >= 0) hasTaohua = true;
    if (shensha[s].name.indexOf('驿马') >= 0) hasMa = true;
  }

  // 日干桃花位
  var taoPos = {甲:'正东',乙:'东北',丙:'正南',丁:'东南',戊:'正东',己:'东北',庚:'正南',辛:'东南',壬:'正东',癸:'东北'};
  // 日干财位
  var caiPos = {甲:'东南',乙:'正东',丙:'西南',丁:'正西',戊:'正北',己:'西北',庚:'东北',辛:'正东',壬:'正南',癸:'东南'};
  // 日干贵人方位
  var guirenPos = {甲:'东北/西南',乙:'正北/西南',丙:'正西/西北',丁:'正西/西北',戊:'东北/西南',己:'东北/西南',庚:'正南/正东',辛:'正南/正东',壬:'正西/西北',癸:'正北/西南'};
  // 日干文昌位
  var wenchangPos = {甲:'东南',乙:'正南',丙:'西南',丁:'正西',戊:'西南',己:'正西',庚:'西北',辛:'正北',壬:'东北',癸:'正东'};

  var html = '';

  // 个性化催旺清单
  var cuiwangItems = [];

  // === 根据年龄 + 缺失 判断需要催什么 ===

  // 1. 催学业（25岁以下 或 缺正印/缺文昌）
  if (age <= 25 || (!tgCount['正印'] && !tgCount['偏印']) || !hasWenchang) {
    var reason = '';
    if (age <= 25) reason = '年龄在求学阶段';
    else if (!tgCount['正印'] && !tgCount['偏印']) reason = '命中缺印星（学历助力弱）';
    else reason = '无文昌星';
    cuiwangItems.push({
      icon: '📚',
      title: '催文昌 · 旺学业',
      reason: reason,
      target: '提升记忆力、考试成绩、学历进修',
      fangwei: wenchangPos[dayStem] || '东南方',
      method: '在书桌' + (wenchangPos[dayStem] || '东南') + '放四支毛笔+文昌塔；2026流年文昌位在正东，可同时催旺',
      item: '文昌塔、绿幽灵水晶、白水晶柱、孔子像',
      time: '每日卯时(5-7点)晨读最佳；农历三、四月考试运最旺',
      color: '绿色、蓝色'
    });
  }

  // 2. 催桃花姻缘（20-40岁 且 缺正财(男)/缺正官(女)/无桃花）
  if (age >= 20 && age <= 40) {
    var needTao = false;
    var taoReason = '';
    if (sex === 'male' && !tgCount['正财']) { needTao = true; taoReason = '缺正财（正妻星），姻缘需催'; }
    else if (sex === 'female' && !tgCount['正官']) { needTao = true; taoReason = '缺正官（夫星），姻缘需催'; }
    else if (!hasTaohua) { needTao = true; taoReason = '无桃花星，异性缘需催旺'; }
    if (needTao) {
      cuiwangItems.push({
        icon: '🌸',
        title: '催桃花 · 旺姻缘',
        reason: taoReason,
        target: '提升异性缘、催旺姻缘、稳固感情',
        fangwei: taoPos[dayStem] || '正东',
        method: '在卧室' + (taoPos[dayStem] || '正东') + '方放花瓶+鲜花（9朵粉色玫瑰最佳）；床头挂粉色丝带；2026流年桃花位在正西，可双管齐下',
        item: '粉水晶球、粉色花瓶+鲜花、红绳脚链、鸳鸯摆件',
        time: '农历二月、八月为桃花月；每月逢卯日、酉日姻缘运旺',
        color: '粉色、玫红色'
      });
    }
  }

  // 3. 催贵人（缺天乙贵人 或 事业期需要助力）
  if (!hasGuiren || (age >= 22 && age <= 60 && (!tgCount['正官'] && !tgCount['七杀']))) {
    var gwReason = !hasGuiren ? '命中无天乙贵人' : '缺官杀，事业助力弱';
    cuiwangItems.push({
      icon: '🙏',
      title: '催贵人 · 旺事业助力',
      reason: gwReason,
      target: '招贵人相助、升迁提拔、化解小人',
      fangwei: guirenPos[dayStem] || '东北/西南',
      method: '在办公桌' + (guirenPos[dayStem] || '东北') + '方放铜麒麟一对（头朝外）；客厅相应方位挂山水画（靠山图）；多与命中贵人属相的人交往',
      item: '铜麒麟、天乙贵人符、黄玉勒子、龙龟',
      time: '每日喜神时辰（' + (xiEle === '木' ? '寅卯时3-7点' : xiEle === '火' ? '巳午时9-13点' : xiEle === '土' ? '辰戌丑未时' : xiEle === '金' ? '申酉时15-19点' : '亥子时21-1点') + '）重要会面最佳',
      color: '黄色、金色'
    });
  }

  // 4. 催正财（缺正财 或 收入不稳）
  if (!tgCount['正财'] || (tgCount['劫财'] && !tgCount['正财'])) {
    cuiwangItems.push({
      icon: '💰',
      title: '催正财 · 旺工薪收入',
      reason: !tgCount['正财'] ? '命中缺正财，工资型财运弱' : '劫财夺正财，收入不稳',
      target: '稳定收入、加薪升职、积累正财',
      fangwei: caiPos[dayStem] || '东南',
      method: '在居家大门对角线明财位放聚宝盆+黄水晶球；在' + (caiPos[dayStem] || '东南') + '方放五帝钱+金元宝；每月初九向财位焚香祈福',
      item: '黄水晶聚宝盆、五帝钱、金元宝摆件、黄虎眼石手链',
      time: '每月逢三、八日利签合同；农历三月、七月正财月宜理财规划',
      color: '黄色、金色、棕色'
    });
  }

  // 5. 催偏财（缺偏财 或 想增加额外收入）
  if (!tgCount['偏财']) {
    cuiwangItems.push({
      icon: '🎰',
      title: '催偏财 · 旺意外收入',
      reason: '命中缺偏财，横财运弱',
      target: '投资收益、副业收入、意外之财',
      fangwei: '正南方',
      method: '在正南方放三足金蟾（头朝室内）；客厅南面挂红色中国结；在钱包内放一张红色纸币+五帝钱；多行善积德养偏财福报',
      item: '三足金蟾、五帝钱、貔貅手链、金发晶',
      time: '农历五月、十一月偏财月；逢偏财星日子可小额投资',
      color: '红色、紫色'
    });
  }

  // 6. 催官杀（缺正官且缺七杀 或 事业停滞）
  if (!tgCount['正官'] && !tgCount['七杀']) {
    cuiwangItems.push({
      icon: '⚖️',
      title: '催官杀 · 旺事业升迁',
      reason: '命中缺官杀，事业升迁动力不足',
      target: '职位升迁、权力提升、考公考编',
      fangwei: '正北方',
      method: '在办公室正北方放黑色水晶柱或黑曜石球；穿深色正装增加威信；书架放法律/管理类书籍增官星气场；多参加体制内考试',
      item: '黑曜石柱、黑碧玺、泰山石敢当、铜印',
      time: '农历七月、八月官星旺月；逢庚辛日（金日）利官非化解',
      color: '黑色、深蓝、深灰'
    });
  }

  // 7. 催印星（缺正印且缺偏印）
  if (!tgCount['正印'] && !tgCount['偏印']) {
    cuiwangItems.push({
      icon: '📖',
      title: '催印星 · 旺学历保护',
      reason: '命中缺印星，学历助力弱、保护少',
      target: '提升学历、增强记忆力、获长辈贵人帮',
      fangwei: xiEle === '木' ? '北方' : xiEle === '火' ? '东方' : xiEle === '土' ? '南方' : xiEle === '金' ? '中央' : '西方',
      method: '在' + (xiEle === '木' ? '北方放黑曜石' : xiEle === '火' ? '东方放绿植' : xiEle === '土' ? '南方放红玛瑙' : xiEle === '金' ? '中央放黄水晶' : '西方放白水晶') + '催印星；多读书考证补印；床头朝喜用方位',
      item: '白水晶柱、文昌笔、玉佩、佛经/经典书籍',
      time: '每日清晨读书最佳；逢印星月（' + (xiEle === '木' ? '亥子月' : xiEle === '火' ? '寅卯月' : xiEle === '土' ? '巳午月' : xiEle === '金' ? '辰戌丑未月' : '申酉月') + '）学习效率最高',
      color: xiEle === '木' ? '蓝色黑色' : xiEle === '火' ? '绿色青色' : xiEle === '土' ? '红色紫色' : xiEle === '金' ? '黄色棕色' : '白色银色'
    });
  }

  // 8. 催食伤（缺食神且缺伤官）
  if (!tgCount['食神'] && !tgCount['伤官']) {
    cuiwangItems.push({
      icon: '🎨',
      title: '催食伤 · 旺才华财源',
      reason: '命中缺食伤，表达力弱、财源少',
      target: '提升口才、创意、变现能力',
      fangwei: '正东方',
      method: '在办公室正东方放大型绿植（发财树/绿萝）；多参加演讲/写作培训；佩戴绿幽灵开发食伤；在客厅东面挂书画作品',
      item: '绿幽灵水晶、翡翠手链、绿色植物、文房四宝',
      time: '每日上午9-11点(巳时)创意最旺；逢食神日利表达输出',
      color: '绿色、青色'
    });
  }

  // 9. 催驿马（缺驿马 或 想调动搬迁）
  if (!hasMa && age >= 22 && age <= 55) {
    cuiwangItems.push({
      icon: '🐴',
      title: '催驿马 · 旺调动搬迁',
      reason: '无驿马星，调动搬迁机会少',
      target: '工作调动、搬家搬迁、出行顺利',
      fangwei: '驿马位（' + (pillars[0] ? getMaPosition(pillars[0].branch) : '寅') + '方）',
      method: '在居家驿马位放铜马摆件（头朝门外）；多出行旅游激活驿马星；穿' + xiEle + '行颜色衣物出行；搬家选驿马月（' + (xiEle === '木' ? '寅卯月' : xiEle === '火' ? '巳午月' : xiEle === '土' ? '辰戌丑未月' : xiEle === '金' ? '申酉月' : '亥子月') + '）',
      item: '铜马摆件、驿马符、行李箱挂饰（铜葫芦）',
      time: '农历正月、七月驿马月；逢寅申巳亥日利出行调动',
      color: '黄色、棕色'
    });
  }

  // 10. 健康催旺（50岁以上 或 日主弱）
  if (age >= 50 || hj.isStrong === false) {
    var healthReason = age >= 50 ? '年龄渐长，需催旺健康' : '日主偏弱，需增强体质';
    cuiwangItems.push({
      icon: '🌿',
      title: '催健康 · 旺寿命元气',
      reason: healthReason,
      target: '增强体质、延年益寿、化解健康隐患',
      fangwei: xiEle === '木' ? '东方' : xiEle === '火' ? '南方' : xiEle === '土' ? '西南方' : xiEle === '金' ? '西方' : '北方',
      method: '在卧室' + (xiEle === '木' ? '东方放绿植' : xiEle === '火' ? '南方放红色摆件' : xiEle === '土' ? '西南放陶瓷器' : xiEle === '金' ? '西方放金属饰品' : '北方放鱼缸或黑色饰品') + '催旺日主；床头朝' + (xiEle === '木' ? '东' : xiEle === '火' ? '南' : xiEle === '土' ? '西南' : xiEle === '金' ? '西' : '北') + '方；每日面向吉方练功/打坐',
      item: '本命佛、玉石平安扣、黑曜石手链、健康符',
      time: '每日辰时(7-9点)阳气升发最佳运动时间；立春/冬至去寺庙祈福',
      color: xiEle === '木' ? '绿色' : xiEle === '火' ? '红色' : xiEle === '土' ? '黄色' : xiEle === '金' ? '白色' : '蓝色'
    });
  }

  // === 输出催旺方案 ===
  if (cuiwangItems.length === 0) {
    html += '<div class="analysis-card" style="text-align:center;padding:20px"><b style="color:var(--jade2)">✅ 命局均衡，无需特别催旺</b><br><span style="font-size:12px;opacity:.6">当前八字各方面较平衡，保持日常好习惯即可。</span></div>';
  } else {
    html += '<div style="font-size:12px;color:var(--paper3);margin-bottom:12px;line-height:1.8">根据缘主八字缺失与人生阶段，以下为 <b style="color:var(--gold)">' + cuiwangItems.length + ' 项</b> 个性化催旺方案：</div>';
    html += '<div class="analysis-grid" style="grid-template-columns:1fr 1fr">';
    for (var ci = 0; ci < cuiwangItems.length; ci++) {
      var item = cuiwangItems[ci];
      html += '<div class="analysis-card" style="border-left:3px solid var(--gold)">';
      html += '<h5 style="color:var(--gold)">' + item.icon + ' ' + item.title + '</h5>';
      html += '<div style="font-size:11px;opacity:.6;margin-bottom:8px">📌 原因：' + item.reason + '</div>';
      html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">目标</span><span style="font-size:12px">' + item.target + '</span></div>';
      html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">方位</span><span style="font-size:12px;color:var(--gold2)">' + item.fangwei + '</span></div>';
      html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">方法</span><span style="font-size:12px">' + item.method + '</span></div>';
      html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">饰品</span><span style="font-size:12px">' + item.item + '</span></div>';
      html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">时间</span><span style="font-size:12px">' + item.time + '</span></div>';
      html += '<div class="huajie-row"><span style="opacity:.5;min-width:60px">颜色</span><span style="font-size:12px">' + item.color + '</span></div>';
      html += '</div>';
    }
    html += '</div>';
  }

  // 催旺总纲
  html += '<div style="margin-top:14px;padding:16px;background:rgba(201,168,76,0.06);border-radius:10px;border:1px solid rgba(201,168,76,0.15)">';
  html += '<div style="font-size:13px;color:var(--gold);margin-bottom:10px">☯ 催旺总纲 · 知命改运之道</div>';
  html += '<div style="font-size:12px;color:var(--paper2);line-height:2">';
  html += '<b>1. 缺什么催什么</b> — 命中缺正财则催正财位，缺桃花则催桃花位，对症下药<br>';
  html += '<b>2. 顺势而为</b> — 年龄段不同催旺重点不同：求学催文昌，适婚催桃花，事业催贵人，中年催财，晚年催健康<br>';
  html += '<b>3. 流年叠加</b> — 2026丙午年流年财位在东南、桃花在正西、文昌在正东，可与本命催旺位叠加双管齐下<br>';
  html += '<b>4. 心诚则灵</b> — 催旺须配合行善积德、修心养性，方位饰品为辅，心境德行为主<br>';
  html += '<b>5. 每年更新</b> — 流年更替五行流转，去年吉方今年未必合宜，建议每年初更新催旺方案';
  html += '</div></div>';

  return html;
}

// ═══ 长生十二宫解读模块 ═══
function renderChangshengModule(dayStem, pillars, dishiList) {
  if (!dishiList || dishiList.length === 0) return '';
  var dayEle = ELE[dayStem] || '木';
  var pillarNames = ['年柱','月柱','日柱','时柱'];

  // 长生十二宫含义
  var CS_MEANING = {
    '长生': {type:'吉', color:'#27ae60', desc:'如婴儿初生，生机勃勃，代表新起点、新机遇。性格开朗，有创造力。', life:'诸事开端，宜进取'},
    '沐浴': {type:'平', color:'#f39c12', desc:'如婴儿沐浴，柔弱需呵护。主桃花、风流、才华初露但不稳。', life:'防桃花劫，宜修身'},
    '冠带': {type:'吉', color:'#27ae60', desc:'如成人加冠，渐趋成熟。主事业起步，学业有成，社交渐广。', life:'事业成长期，宜学习积累'},
    '临官': {type:'吉', color:'#27ae60', desc:'如人出仕为官，独当一面。主事业有成，收入稳定，社会地位提升。', life:'事业巅峰期，宜进取'},
    '帝旺': {type:'吉', color:'#27ae60', desc:'如帝王鼎盛，气势最旺。主事业极盛，权力最大，但盛极易衰。', life:'运势最旺，宜守成防骄'},
    '衰': {type:'平', color:'#f39c12', desc:'如人渐老，气力衰减。主运势下滑，精力不如前，宜稳不宜冲。', life:'运势转弱，宜守不宜进'},
    '病': {type:'凶', color:'#e74c3c', desc:'如人体生病，状态不佳。主小人口舌，身体欠佳，事业受阻。', life:'注意健康，防小人'},
    '死': {type:'凶', color:'#e74c3c', desc:'如气数已尽，生机断绝。主运势低谷，事业停滞，需隐忍待变。', life:'运势低谷，宜隐忍等待'},
    '墓': {type:'凶', color:'#e74c3c', desc:'如入墓库，收藏埋没。主才华被埋没，运势收藏，宜蓄力待发。', life:'运势收藏，宜蓄力'},
    '绝': {type:'凶', color:'#e74c3c', desc:'如绝处逢生之前夜，气数最弱。主运势极低，但物极必反，转机将至。', life:'物极必反，静待转机'},
    '胎': {type:'平', color:'#f39c12', desc:'如结胎受孕，暗藏生机。主计划酝酿中，虽有希望但尚未成形。', life:'酝酿期，宜谋划'},
    '养': {type:'吉', color:'#27ae60', desc:'如胎儿养育，逐渐成形。主准备阶段，积蓄力量，即将迎来新生。', life:'准备期，宜积蓄'}
  };

  var html = '<div class="analysis-card" style="margin:16px 0;border:1px solid rgba(201,168,76,.15);padding:20px">';
  html += '<h5 style="font-size:15px;color:var(--gold);letter-spacing:3px;margin-bottom:6px">🌀 长生十二宫 · 命运周期解读</h5>';
  html += '<p style="font-size:11px;opacity:.5;margin-bottom:14px;letter-spacing:1px">长生十二宫以日干对四地支，推演日主在人生四大阶段的气运消长。出自《滴天髄》《三命通会》。</p>';

  // 四柱长生表
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">';
  for (var i = 0; i < 4; i++) {
    var cs = dishiList[i] || '—';
    var m = CS_MEANING[cs];
    var bg = m ? ('background:rgba(' + (m.color === '#27ae60' ? '39,174,96' : m.color === '#f39c12' ? '243,156,18' : '231,76,60') + ',0.08)') : '';
    var border = m ? ('border:1px solid ' + m.color + '33') : '';
    html += '<div style="text-align:center;padding:10px 6px;border-radius:8px;' + bg + ';' + border + '">';
    html += '<div style="font-size:10px;opacity:.5;letter-spacing:2px">' + pillarNames[i] + '</div>';
    html += '<div style="font-size:11px;opacity:.4;margin:2px 0">' + pillars[i].stem + pillars[i].branch + '</div>';
    html += '<div style="font-size:16px;font-weight:bold;color:' + (m ? m.color : 'var(--paper3)') + ';letter-spacing:2px">' + cs + '</div>';
    html += '<div style="font-size:9px;opacity:.5;margin-top:2px">' + (m ? m.type : '') + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // 每柱长生详解
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">';
  for (var j = 0; j < 4; j++) {
    var cs2 = dishiList[j];
    if (!cs2) continue;
    var m2 = CS_MEANING[cs2];
    if (!m2) continue;
    html += '<div style="padding:12px;background:rgba(255,255,255,.02);border-radius:8px;border-left:3px solid ' + m2.color + '">';
    html += '<div style="font-size:12px;color:' + m2.color + ';font-weight:bold;margin-bottom:6px">' + pillarNames[j] + ' · ' + cs2 + '</div>';
    html += '<div style="font-size:11px;opacity:.7;line-height:1.7;margin-bottom:4px">' + m2.desc + '</div>';
    html += '<div style="font-size:10px;color:var(--gold);opacity:.7">💡 ' + m2.life + '</div>';
    // 结合柱位解读
    var pillarAdvice = '';
    if (j === 0) pillarAdvice = '年柱主祖业与早年（1-15岁），长生在此代表早年家境尚可，沐浴则早年多变。';
    else if (j === 1) pillarAdvice = '月柱主父母与青年（16-30岁），临官帝旺则青年有为，衰病则青年多挫折。';
    else if (j === 2) pillarAdvice = '日柱主自身与中年（31-50岁），此柱最重要，长生帝旺则中年发迹，死墓绝则中年需守。';
    else pillarAdvice = '时柱主子女与晚年（51岁+），长生养胎则晚年安享，死墓绝则晚年需积德。';
    html += '<div style="font-size:10px;opacity:.5;margin-top:4px">📌 ' + pillarAdvice + '</div>';
    html += '</div>';
  }
  html += '</div>';

  // 日柱长生重点解读
  var dayCS = dishiList[2];
  if (dayCS) {
    var dayM = CS_MEANING[dayCS];
    if (dayM) {
      html += '<div style="padding:14px;background:rgba(201,168,76,.06);border-radius:10px;border:1px solid rgba(201,168,76,.15)">';
      html += '<div style="font-size:13px;color:var(--gold);margin-bottom:8px">🎯 日柱长生 · 中年运程重点</div>';
      html += '<div style="font-size:12px;color:var(--paper2);line-height:2">';
      html += '日主' + dayStem + '(' + dayEle + ')在日支' + pillars[2].branch + '处<b style="color:' + dayM.color + '">' + dayCS + '</b>位。';
      html += dayM.desc + '<br>';
      html += '中年（31-50岁）是人生黄金期，日柱长生在此位，意味着此阶段<b>' + dayM.life + '</b>。';
      if (['长生','冠带','临官','帝旺','养'].indexOf(dayCS) >= 0) {
        html += '此为旺相之位，中年运势较强，宜把握31-50岁黄金期全力进取。';
      } else if (['沐浴','衰','胎'].indexOf(dayCS) >= 0) {
        html += '此为平和之位，中年运势平稳，宜稳扎稳打，不急不躁。';
      } else {
        html += '此为衰弱之位，中年需谨慎，宜守不宜进，可通过五行补缺和风水调整化解。';
      }
      html += '</div></div>';
    }
  }

  // 经典出处
  html += '<div style="margin-top:12px;padding:10px 14px;background:rgba(201,168,76,.04);border-radius:8px;font-size:11px;opacity:.5;line-height:1.8">';
  html += '📜 经典出处：《滴天髄》云：「长生十二宫，以日干为主，看其在十二地支之位，以推气运消长。」《三命通会》曰：「长生者，如人初生，气象维新；帝旺者，如人鼎盛，气宇轩昂；墓绝者，如人收藏，静待时机。」十二宫循环往复，绝处逢生，盛极而衰，道法自然。';
  html += '</div>';

  html += '</div>';
  return html;
}

// ═══ 奇门遁甲九宫格渲染 ═══
function renderQimenGrid(palaces, keyPalace) {
  var grid = document.getElementById('qmGrid');
  if (!grid || !palaces) return;
  // 洛书九宫布局
  var layout = [
    [4, 9, 2],
    [3, 5, 7],
    [8, 1, 6]
  ];
  var gongInfo = {
    1:{name:'坎',dir:'正北',ele:'水'},2:{name:'坤',dir:'西南',ele:'土'},
    3:{name:'震',dir:'正东',ele:'木'},4:{name:'巽',dir:'东南',ele:'木'},
    5:{name:'中',dir:'中央',ele:'土'},6:{name:'乾',dir:'西北',ele:'金'},
    7:{name:'兑',dir:'正西',ele:'金'},8:{name:'艮',dir:'东北',ele:'土'},
    9:{name:'离',dir:'正南',ele:'火'}
  };
  var html = '<div style="margin:16px 0">';
  html += '<div style="text-align:center;font-size:14px;color:#c9a84c;margin-bottom:10px;letter-spacing:3px">☰ 奇门遁甲九宫盘 ☰</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;max-width:520px;margin:0 auto">';
  for (var r = 0; r < 3; r++) {
    for (var c = 0; c < 3; c++) {
      var gongNum = layout[r][c];
      var info = gongInfo[gongNum];
      var p = palaces[gongNum];
      var isKey = (gongNum === keyPalace);
      // 吉凶判断
      var starType = p && p.star ? p.star.type : '';
      var doorType = p && p.door ? p.door.type : '';
      var isJi = (starType === '吉' || starType === '大吉') && (doorType === '吉' || doorType === '大吉');
      var isXiong = (starType === '凶' || starType === '大凶') || (doorType === '凶' || doorType === '大凶');
      var borderColor = isKey ? '#e8cc7a' : isJi ? '#27ae60' : isXiong ? '#e74c3c' : 'rgba(201,168,76,0.2)';
      var bgRgba = gongNum === 5 ? 'rgba(201,168,76,0.08)' : isJi ? 'rgba(39,174,96,0.04)' : isXiong ? 'rgba(231,76,60,0.04)' : 'rgba(201,168,76,0.03)';
      html += '<div style="border:2px solid ' + borderColor + ';border-radius:8px;padding:6px 4px;background:' + bgRgba + ';min-height:100px;position:relative">';
      // 宫位标题
      html += '<div style="font-size:9px;color:#8a8070;text-align:center;border-bottom:1px solid rgba(201,168,76,0.1);padding-bottom:3px;margin-bottom:3px">';
      html += info.name + gongNum + '宫·' + info.dir;
      if (isKey) html += ' <span style="color:#e8cc7a">★值符</span>';
      html += '</div>';
      // 内容
      if (p) {
        // 天盘干+地盘干
        if (p.heavenGan || p.earthGan) {
          html += '<div style="text-align:center;margin:2px 0">';
          if (p.heavenGan) html += '<span style="color:#5dade2;font-size:11px;font-weight:bold">' + p.heavenGan + '</span>';
          if (p.heavenGan && p.earthGan) html += '<span style="color:#8a8070;font-size:8px">/</span>';
          if (p.earthGan) html += '<span style="color:#f39c12;font-size:11px;font-weight:bold">' + p.earthGan + '</span>';
          html += '</div>';
        }
        // 九星
        if (p.star) {
          var starColor = p.star.type === '吉' || p.star.type === '大吉' ? '#27ae60' : p.star.type === '凶' || p.star.type === '大凶' ? '#e74c3c' : '#c9a84c';
          html += '<div style="font-size:11px;color:' + starColor + ';text-align:center;font-weight:bold">' + (p.star.name || '') + '</div>';
        }
        // 八门
        if (p.door) {
          var doorColor = p.door.type === '吉' || p.door.type === '大吉' ? '#27ae60' : p.door.type === '凶' || p.door.type === '大凶' ? '#e74c3c' : '#e8cc7a';
          html += '<div style="font-size:10px;color:' + doorColor + ';text-align:center">' + (p.door.name || '') + '门</div>';
        }
        // 八神
        if (p.god) {
          html += '<div style="font-size:9px;color:#9b59b6;text-align:center">' + (p.god.name || p.god || '') + '</div>';
        }
      } else {
        html += '<div style="font-size:10px;color:#8a8070;text-align:center;margin-top:20px">—</div>';
      }
      html += '</div>';
    }
  }
  html += '</div>';
  // 图例
  html += '<div style="display:flex;gap:12px;justify-content:center;margin-top:8px;font-size:9px;color:#8a8070">';
  html += '<span><span style="color:#5dade2">■</span>天盘</span>';
  html += '<span><span style="color:#f39c12">■</span>地盘</span>';
  html += '<span><span style="color:#27ae60">■</span>吉</span>';
  html += '<span><span style="color:#e74c3c">■</span>凶</span>';
  html += '<span><span style="color:#e8cc7a">★</span>值符宫</span>';
  html += '</div>';
  html += '</div>';
  grid.innerHTML = html;
}

// ═══ 紫微斗数十二宫渲染 ═══
function renderZwGrid() {
  var container = document.getElementById('zw12Gong');
  if (!container) return;
  var gongNames = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','交友','官禄','田宅','福德','父母'];
  var zhiNames = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  // 4×3网格，从寅开始顺时针
  var order = [2,3,4,5,6,7,8,9,10,11,0,1]; // 寅卯辰巳午未申酉戌亥子丑
  var html = '<div style="margin:16px 0">';
  html += '<div style="text-align:center;font-size:14px;color:#c9a84c;margin-bottom:10px;letter-spacing:3px">⭐ 紫微斗数十二宫盘 ⭐</div>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-width:560px;margin:0 auto">';
  for (var i = 0; i < 12; i++) {
    var idx = order[i];
    var gName = gongNames[idx] || '';
    var zhi = zhiNames[idx] || '';
    var isMing = (idx === 0);
    var borderC = isMing ? '#c9a84c' : 'rgba(201,168,76,0.15)';
    var bgC = isMing ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.03)';
    html += '<div style="border:1px solid ' + borderC + ';border-radius:6px;padding:6px 4px;background:' + bgC + ';min-height:70px">';
    html += '<div style="font-size:9px;color:#8a8070;text-align:center;border-bottom:1px solid rgba(201,168,76,0.1);padding-bottom:2px;margin-bottom:3px">' + zhi + '宫</div>';
    html += '<div style="font-size:11px;color:' + (isMing ? '#c9a84c' : '#e8cc7a') + ';text-align:center;font-weight:bold">' + gName + '</div>';
    html += '<div style="font-size:9px;color:#a09080;text-align:center;margin-top:2px" id="zwGong_' + idx + '">—</div>';
    html += '</div>';
    // 每4个换行
    if ((i + 1) % 4 === 0 && i < 11) {
      html += '</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;max-width:560px;margin:4px auto 0">';
    }
  }
  html += '</div>';
  // 尝试填充星曜
  try {
    var sg = document.getElementById('zwStarsGrid');
    if (sg) {
      var rows = sg.querySelectorAll('tr');
      rows.forEach(function(row, ri) {
        var cells = row.querySelectorAll('td');
        cells.forEach(function(cell, ci) {
          var text = cell.textContent.trim();
          if (text && text.length > 0) {
            var gongEl = document.getElementById('zwGong_' + ci);
            if (gongEl) gongEl.innerHTML = '<span style="color:#c9a84c;font-size:10px">' + text.substring(0, 20) + '</span>';
          }
        });
      });
    }
  } catch(e) {}
  html += '<div style="display:flex;gap:12px;justify-content:center;margin-top:8px;font-size:9px;color:#8a8070">';
  html += '<span><span style="color:#c9a84c">■</span>命宫</span>';
  html += '<span><span style="color:#e8cc7a">■</span>其他宫</span>';
  html += '</div>';
  html += '</div>';
  container.innerHTML = html;
}

// ═══ 通用化解模块注入器 ═══
function appendHuajieToResult(resultElId, year, month, day, hour, sex, name) {