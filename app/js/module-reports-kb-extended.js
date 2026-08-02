/**
 * module-reports-kb-extended.js · 9 模块 KB 兜底诊断引擎（扩展）
 *
 * 补全 fengshui / qimen / ziwei / liuyao / meihua / liuren / yanzhi / wuxing / mingxiang
 * 每个模块提供 name + diagnose(data) → 返回报告结构（断网可用）
 *
 * 设计：确定性值（不用 Math.random），每个模块 ≥ 5 个 nextSteps
 */

window._MODULE_REPORTS = window._MODULE_REPORTS || {};

// ─── 通用工具 ───
const _kw = (s, keywords) => {
  let score = 0;
  keywords.forEach(k => { if (s.includes(k)) score += k.length; });
  return score;
};
const _pick = (s, opts) => {
  let best = opts[0].val, bestS = 0; // 默认取 .val 字符串
  opts.forEach(o => { const s2 = _kw(s, o.kw); if (s2 > bestS) { bestS = s2; best = o.val; } });
  return best;
};
const _dateSeed = (s) => {
  const m = (s || '').match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
  return m ? (+m[1] * 365 + +m[2] * 30 + +m[3]) % 100 : 42;
};
const _next5 = (base) => [
  base + '结合流年大运，观察五行生克变化',
  base + '重点月份：农历三、六、九月需特别注意',
  base + '方位选择：优先朝南/东南，避免正北/正西',
  base + '颜色搭配：多用青绿、红色、黄色，少用黑白',
  base + '重要决策前先静心冥想，待心平气和后再行动'
];

// ─── 1. 风水布局 ───
window._MODULE_REPORTS.fengshui = {
  name: '风水布局',
  diagnose: function(data){
    const s = (data && data.s0) || '客厅朝南 卧室朝北';
    const directions = ['东','南','西','北','东南','东北','西南','西北'];
    const dir = _pick(s, [
      { kw:['东','东南','左'], val:'东方' },
      { kw:['南','前'], val:'南方' },
      { kw:['西','右'], val:'西方' },
      { kw:['北','后'], val:'北方' },
      { kw:['东北','西北','西南'], val: directions[_dateSeed(s) % 8] }
    ]);
    const seed = _dateSeed(s);
    const ok = seed % 3 !== 0;
    return {
      title: '风水评估（断网KB兜底）',
      summary: '当前空间以' + dir + '方位为主，' + (ok ? '格局基本平衡， Minor adjustments 可优化' : '格局存在明显失衡，建议重点调整'),
      direction: dir,
      balance: ok ? '基本平衡' : '需调整',
      keyIssues: ok ? ['财位略有偏斜','光线可再优化'] : ['气流受阻','光线不足','尖角煞'],
      suggestions: [
        '主卧床头靠实墙，避免靠窗',
        '客厅明堂开阔，不宜堆杂物',
        '财位（进门对角）保持明亮整洁',
        '卫生间门常关，避免直冲大门',
        '绿植选阔叶类，忌带刺植物过多'
      ],
      ttsText: '风水评估完成。' + dir + '方位为主，' + (ok ? '格局平衡，建议微调财位和光线。' : '存在失衡，建议优先调整气流和光线。'),
      nextSteps: _next5('风水改善：')
    };
  }
};

// ─── 2. 奇门遁甲 ───
window._MODULE_REPORTS.qimen = {
  name: '奇门遁甲',
  diagnose: function(data){
    const s = (data && data.s0) || '求财 2026年8月';
    const seed = _dateSeed(s);
    const doors = ['休门','生门','伤门','杜门','景门','死门','惊门','开门'];
    const stars = ['天任','天冲','天辅','天英','天芮','天柱','天心','天蓬'];
    const door = doors[seed % 8];
    const star = stars[(seed + 3) % 8];
    const good = ['开门','休门','生门','天辅','天心'].includes(star) || ['开门','休门','生门'].includes(star);
    return {
      title: '奇门遁甲分析（断网KB兜底）',
      summary: '当前局：' + door + ' + ' + star + '，' + (good ? '吉象，宜进取' : '需谨慎，宜守成'),
      door, star,
      status: good ? '吉局' : '凶局',
      keyPoints: [
        '九星' + star + '当值，' + (good ? '吉星高照' : '星曜带煞，谨慎行事'),
        '八门' + door + '当值，' + (good ? '开门吉庆' : '需防口舌是非'),
        '当前时辰：' + ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][seed % 12] + '时'
      ],
      suggestions: good
        ? ['宜签约/求财/出行','主动出击，把握时机','贵人方位：东南方']
        : ['宜守成，不宜冒进','避免重大决策','静待时机，韬光养晦'],
      ttsText: '奇门遁甲：' + door + star + '，' + (good ? '吉象，宜进取。' : '需谨慎，宜守成。'),
      nextSteps: _next5('奇门趋避：')
    };
  }
};

// ─── 3. 紫微斗数 ───
window._MODULE_REPORTS.ziwei = {
  name: '紫微斗数',
  diagnose: function(data){
    const s = (data && data.s0) || '1985年3月22日 女';
    const seed = _dateSeed(s);
    const stars = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
    const mainStar = stars[seed % 14];
    const traits = {
      '紫微':'尊贵权威，有领导力，宜管理岗位',
      '天机':'聪明灵巧，宜技术/策划',
      '太阳':'光明磊落，宜公职/教育',
      '武曲':'刚毅果断，宜金融/军警',
      '天同':'温和享乐，宜艺术/服务',
      '廉贞':'细腻敏感，宜文艺/心理',
      '天府':'稳重包容，宜财务/仓储',
      '太阴':'内敛聪慧，宜文化/研究',
      '贪狼':'多才多艺，宜创业/交际',
      '巨门':'口才好辩，宜法律/传媒',
      '天相':'辅佐之才，宜助理/协调',
      '天梁':'正直慈善，宜医疗/公益',
      '七杀':'勇猛果断，宜军警/体育',
      '破军':'开创改革，宜创新/创业'
    };
    const trait = traits[mainStar] || '宜顺势而为';
    return {
      title: '紫微斗数（断网KB兜底）',
      summary: '命宫主星：' + mainStar + '。' + trait,
      mainStar,
      trait,
      luckyYears: ['2027','2029','2031'],
      avoidYears: ['2025','2028'],
      suggestions: [
        '发挥' + mainStar + '优势，专注核心能力',
        '避免与克制星曜对冲的年份做重大决策',
        '适合行业：' + trait.split('，')[1] || '多元化发展',
        '贵人星在' + ['迁移宫','财帛宫','官禄宫'][seed % 3],
        '佩戴' + ['紫水晶','黄水晶','黑曜石'][seed % 3] + '增强能量'
      ],
      ttsText: '紫微斗数：命宫' + mainStar + '。' + trait + '。',
      nextSteps: _next5('紫微运势：')
    };
  }
};

// ─── 4. 六爻占卜 ───
window._MODULE_REPORTS.liuyao = {
  name: '六爻占卜',
  diagnose: function(data){
    const s = (data && data.s0) || '问事业前程';
    const seed = _dateSeed(s);
    const gua64 = ['乾','坤','屯','蒙','需','讼','师','比','小畜','履','泰','否','同人','大有','谦','豫','随','蛊','临','观','噬嗑','贲','剥','复','无妄','大畜','颐','大过','坎','离','咸','恒','遁','大壮','晋','明夷','家人','睽','蹇','解','损','益','夬','姤','萃','升','困','井','革','鼎','震','艮','渐','归妹','丰','旅','巽','兑','涣','节','中孚','小过','既济','未济'];
    const gua = gua64[seed % 64];
    const good = ['乾','坤','泰','谦','豫','晋','大有','同人','随','临','革','鼎','咸','恒'].includes(gua);
    const sixRel = ['父母','兄弟','子孙','妻财','官鬼','世应'];
    return {
      title: '六爻占卜（断网KB兜底）',
      summary: '当前卦：' + gua + '卦。' + (good ? '吉象，所求可成' : '需防变数，建议暂缓'),
      gua,
      status: good ? '吉卦' : '需谨慎',
      sixRel: sixRel[seed % 6],
      keyPoints: [
        gua + '卦：' + (good ? '卦象吉祥，利于进取' : '卦象含变，宜守不宜攻'),
        '世爻代表事主，应爻代表对方/环境',
        '动爻位置：' + ['初','二','三','四','五','上'][seed % 6] + '爻',
        '用神取法：问财取妻财爻，问官取官鬼爻'
      ],
      suggestions: good
        ? ['卦象吉利，可放手行动','注意把握时机窗口','贵人方位：' + ['东','南','西','北','东南','西北'][seed % 6]]
        : ['卦象有阻，建议暂缓','多听取他人意见','静待时机变化'],
      ttsText: '六爻：' + gua + '卦。' + (good ? '吉象，所求可成。' : '需防变数，建议暂缓。'),
      nextSteps: _next5('六爻趋避：')
    };
  }
};

// ─── 5. 梅花易数 ───
window._MODULE_REPORTS.meihua = {
  name: '梅花易数',
  diagnose: function(data){
    const s = (data && data.s0) || '2026年8月 问感情';
    const seed = _dateSeed(s);
    const trigrams = ['乾','兑','离','震','巽','坎','艮','坤'];
    const upper = trigrams[seed % 8];
    const lower = trigrams[(seed + 3) % 8];
    const gua = upper + lower;
    const interp = {
      '乾乾':'天行健，宜积极进取，但防刚过易折',
      '坤坤':'地势坤，宜厚德载物，顺势而为',
      '震震':'雷震木，宜果断行动，防冲动',
      '坎坎':'水重重，宜守不宜攻，韬光养晦',
      '离离':'火炎上，宜光明正大，防过曝',
      '巽巽':'风入木，宜柔顺灵活，以柔克刚',
      '艮艮':'山为止，宜稳扎稳打，循序渐进',
      '兑兑':'悦万物，宜和谐沟通，广结善缘'
    };
    const key = gua in interp ? gua : gua;
    const text = interp[key] || upper + '上' + lower + '下，体用相生，吉中藏变';
    return {
      title: '梅花易数（断网KB兜底）',
      summary: text,
      gua,
      trigrams: { upper, lower },
      status: text.includes('吉') || text.includes('宜') ? '吉卦' : '需参详',
      keyPoints: [
        text,
        '体卦：' + lower + '（代表事主/主体）',
        '用卦：' + upper + '（代表对方/客体）',
        '动爻：' + ['初','二','三','四','五','上'][seed % 6] + '爻动'
      ],
      suggestions: [
        text.split('，')[0] + '，顺势而为',
        '观察身边自然征兆（鸟鸣/风声/天气）',
        '遇困惑时数' + ['天','地','人'][seed % 3] + '之数'
      ],
      ttsText: '梅花易数：' + upper + lower + '。' + text + '。',
      nextSteps: _next5('梅花指引：')
    };
  }
};

// ─── 6. 大六壬 ───
window._MODULE_REPORTS.liuren = {
  name: '大六壬',
  diagnose: function(data){
    const s = (data && data.s0) || '问出行 2026年8月';
    const seed = _dateSeed(s);
    const tianJiang = ['螣蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后','贵人'];
    const jiang = tianJiang[seed % 12];
    const ke = ['贵人','螣蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后'];
    const keJiang = ke[(seed + 5) % 12];
    const good = ['贵人','六合','青龙','太常','太阴','天后'].includes(jiang);
    return {
      title: '大六壬（断网KB兜底）',
      summary: '天将：' + jiang + ' + ' + keJiang + '。' + (good ? '吉象，所求遂意' : '需防小人/阻碍'),
      tianJiang: jiang,
      status: good ? '吉课' : '凶课',
      fourCourses: ['初课','中课','末课','传课'],
      keyPoints: [
        '贵人将：' + jiang + '（' + (good ? '吉神，有贵人相助' : '凶神，需谨慎行事') + '）',
        '克将：' + keJiang,
        '三传：' + ['初传','中传','末传'][seed % 3] + '为关键',
        '四课三传是判断吉凶核心'
      ],
      suggestions: good
        ? ['天时地利人和，宜把握时机','贵人方位：' + ['东南','西北','东北','西南','正南','正北'][seed % 6],'出行选' + ['辰','巳','午','未','申','酉'][seed % 6] + '时']
        : ['天将带煞，暂缓重大决策','注意人际纠纷','选择吉日再行动'],
      ttsText: '大六壬：' + jiang + '将值日。' + (good ? '吉象，所求遂意。' : '需防小人阻碍。'),
      nextSteps: _next5('大六壬趋避：')
    };
  }
};

// ─── 7. 面相/颜择 ───
window._MODULE_REPORTS.yanzhi = {
  name: '颜择面相',
  diagnose: function(data){
    const s = (data && data.s0) || '男 圆脸 浓眉 大眼';
    const seed = _dateSeed(s);
    const features = ['额头','眉毛','眼睛','鼻子','嘴唇','下巴'];
    const strong = features[seed % 6];
    const weak = features[(seed + 3) % 6];
    const mianXiang = {
      '额头':'天庭饱满，聪明有祖荫',
      '眉毛':'眉型浓密，重情重义',
      '眼睛':'眼大有神，聪慧敏锐',
      '鼻子':'鼻梁挺直，财运亨通',
      '嘴唇':'唇红齿白，口福享乐',
      '下巴':'下巴圆润，晚年有靠'
    };
    return {
      title: '面相分析（断网KB兜底）',
      summary: '优势部位：' + strong + '（' + mianXiang[strong] + '）。需关注：' + weak,
      strongFeature: strong,
      weakFeature: weak,
      status: '面相整体' + (seed % 3 === 0 ? '上佳' : seed % 3 === 1 ? '中平' : '需调理'),
      keyPoints: [
        mianXiang[strong],
        '十二宫中' + strong + '属' + ['命宫','财帛','兄弟','田宅','男女','奴仆','夫妻','疾厄','迁移','官禄','福德','相貌'][seed % 12],
        '需注意：' + weak + '部位保养',
        '整体格局' + (seed % 3 === 0 ? '不错' : '中等偏上')
      ],
      suggestions: [
        strong + '是命格优势，可重点发挥',
        weak + '区域适当调理（按摩/作息）',
        '面色红润为佳，注意脾胃保养',
        '眼神保养：少熬夜，多户外活动',
        '定期观察面部变化，关注健康信号'
      ],
      ttsText: '面相分析：' + strong + '优势明显。' + mianXiang[strong] + '。',
      nextSteps: _next5('面相调理：')
    };
  }
};

// ─── 8. 五行分析 ───
window._MODULE_REPORTS.wuxing = {
  name: '五行分析',
  diagnose: function(data){
    const s = (data && data.s0) || '1985年3月22日8时 木旺火相';
    const seed = _dateSeed(s);
    const wuxing = ['金','木','水','火','土'];
    const strong = wuxing[seed % 5];
    const weak = wuxing[(seed + 2) % 5];
    const shengKe = {
      '金': { sheng: '水', ke: '木', shengBy: '土', keBy: '火' },
      '木': { sheng: '火', ke: '土', shengBy: '水', keBy: '金' },
      '水': { sheng: '木', ke: '火', shengBy: '金', keBy: '土' },
      '火': { sheng: '土', ke: '金', shengBy: '木', keBy: '水' },
      '土': { sheng: '金', ke: '水', shengBy: '火', keBy: '木' }
    };
    const rel = shengKe[strong];
    return {
      title: '五行分析（断网KB兜底）',
      summary: '五行最旺：' + strong + '，最弱：' + weak + '。' + strong + '克' + weak + '，' + (rel.sheng === weak ? '且' + strong + '生' + weak + '，流通顺畅' : '但' + weak + '被克严重，需补'),
      strongElement: strong,
      weakElement: weak,
      shengKe: rel,
      balance: rel.sheng === weak ? '流通' : '需调',
      keyPoints: [
        strong + '旺：精力充沛，行动力强',
        weak + '弱：需补充能量（饮食/方位/颜色）',
        strong + '克' + weak + '：克制关系需化解',
        '补' + weak + '方法：' + ['多吃' + weak + '属性食物','朝' + weak + '方位','用' + weak + '色系','佩戴' + weak + '属性饰品'][seed % 4]
      ],
      suggestions: [
        '增强' + weak + '：饮食/方位/颜色全面调整',
        '减少' + strong + '过旺带来的负面影响',
        '用' + rel.sheng + '通关（' + strong + '生' + rel.sheng + '生' + weak + '）',
        '季节调理：' + weak + '旺季重点保养',
        '五行调和是长期过程，循序渐进'
      ],
      ttsText: '五行：' + strong + '旺' + weak + '弱。' + (rel.sheng === weak ? '流通顺畅。' : '需补' + weak + '。'),
      nextSteps: _next5('五行调理：')
    };
  }
};

// ─── 9. 命相同参 ───
window._MODULE_REPORTS.mingxiang = {
  name: '命相同参',
  diagnose: function(data){
    const s = (data && data.s0) || '1985年生 八字土重 面相方圆';
    const seed = _dateSeed(s);
    const ming = ['命宫在子','命宫在丑','命宫在寅','命宫在卯','命宫在辰','命宫在巳','命宫在午','命宫在未','命宫在申','命宫在酉','命宫在戌','命宫在亥'];
    const mingGong = ming[seed % 12];
    const xiang = ['方圆脸（土型人）','长圆脸（木型人）','方圆带尖（土金兼）','瘦长型（木型人）','圆润型（水型人）','方正型（金型人）'];
    const xiangType = xiang[seed % 6];
    const match = seed % 3 !== 0;
    return {
      title: '命相同参（断网KB兜底）',
      summary: mingGong + '，面相' + xiangType + '。' + (match ? '命相基本一致，内外统一' : '命相略有出入，需综合解读'),
      mingGong,
      xiangType,
      match,
      keyPoints: [
        mingGong + '，主一生格局',
        '面相' + xiangType + '，反映当前运势',
        match ? '命相统一：内外一致，运势稳定' : '命相出入：注意内在修养与外在表现的协调',
        '命相同参需结合八字综合判断'
      ],
      suggestions: match
        ? ['命相统一，顺势而为','发挥先天优势','保持内外一致']
        : ['命相有出入，加强内在修炼','注意言行与命格的匹配','通过修行调和内外'],
      ttsText: '命相同参：' + mingGong + '，' + xiangType + '。' + (match ? '内外统一。' : '需综合解读。'),
      nextSteps: _next5('命相调理：')
    };
  }
};

// ─── 塔罗 ───
window._MODULE_REPORTS.tarot = {
  name: '塔罗占卜',
  diagnose: function(data){
    const s = (data && data.s0) || '爱情';
    const spread = s.includes('爱情') ? '关系' : s.includes('事业') ? '職業' : s.includes('财运') ? '財運' : '综合';
    const cards = [
      {name:'愚者', meaning:'新的開始，冒險精神'},
      {name:'魔術師', meaning:'創造力，行動力'},
      {name:'女祭司', meaning:'直覺，潛意識'},
      {name:'皇后', meaning:'豐盛，滋養'},
      {name:'皇帝', meaning:'權威，結構'},
      {name:'戀人', meaning:'選擇，和諧'},
      {name:'戰車', meaning:'意志，勝利'},
      {name:'力量', meaning:'勇氣，內在力量'},
      {name:'隱者', meaning:'內省，尋找'},
      {name:'命運之輪', meaning:'轉變，機遇'}
    ];
    const pick = cards[(s.length * 7) % cards.length];
    return {
      title: '塔羅占卜（KB兜底）',
      summary: spread + '牌陣 · 抽到「' + pick.name + '」',
      sections: [
        {title:'牌面解讀', text: pick.name + '：' + pick.meaning + '。在' + spread + '語境下，提示當前處於轉折點，需要結合內心感受與外在環境綜合判斷。'},
        {title:'建議', text: '保持開放心態，順應直覺。牌面顯示' + (pick.name === '愚者' ? '適合開啟新計劃' : pick.name === '戰車' ? '適合主動出擊' : '適合沉澱思考') + '。'}
      ],
      ttsText: '塔羅占卜：' + pick.name + '，' + pick.meaning + '。',
      nextSteps: ['記錄當下感受','一週後回顧牌面','結合實際情況調整策略','保持正念冥想','關注直覺信號']
    };
  }
};

console.warn('✅ _MODULE_REPORTS extended (+10 modules: fengshui/qimen/ziwei/liuyao/meihua/liuren/yanzhi/wuxing/mingxiang/tarot = 24 total)');
