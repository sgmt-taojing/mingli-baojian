/**
 * TCM-Agent 数字孪生引擎 V1.0
 * 灵感来源: CN121439161A（南京大经）+ CN121662303A（邹伟）
 * 核心: 患者多维度健康数字孪生模型 + 时序关联分析 + 健康值综合评分
 */

(function() {
  if (typeof window === 'undefined') return;

  var DT = window.TCM_DT = window.TCM_DT || {};

  // ═══ 患者数字孪生模型 ═══
  DT.createPatientModel = function(patientId) {
    return {
      id: patientId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      timeline: [],           // 时序就诊记录
      current_snapshot: null, // 当前快照
      trends: {},             // 趋势数据
      health_score: 0,        // 综合健康值(0-100)
      risk_factors: [],       // 风险因素
      constitution: null,     // 体质类型
      organ_scores: {}        // 五脏评分
    };
  };

  // ═══ 添加就诊记录（时序数据点）═══
  DT.addRecord = function(patientId, record) {
    var model = TCM.store.get('dt_' + patientId) || DT.createPatientModel(patientId);

    var snapshot = {
      timestamp: new Date().toISOString(),
      visit_id: 'V' + Date.now().toString(36).toUpperCase(),
      chief_complaint: record.chief_complaint || '',
      diagnosis: record.diagnosis || '',
      treatment: record.treatment || '',
      herbs: record.herbs || [],
      tongue: record.tongue || null,   // 舌象特征
      face: record.face || null,       // 面色特征
      pulse: record.pulse || null,     // 脉象特征
      inquiry: record.inquiry || null, // 问诊结构化
      wearable: record.wearable || null, // 穿戴设备数据
      health_score: null,              // 本次健康评分
      organ_scores: null,              // 五脏评分
      notes: record.notes || ''
    };

    // 计算本次健康评分
    snapshot.health_score = DT.calculateHealthScore(snapshot);
    snapshot.organ_scores = DT.calculateOrganScores(snapshot);

    model.timeline.push(snapshot);
    model.current_snapshot = snapshot;
    model.updated_at = snapshot.timestamp;
    model.health_score = snapshot.health_score;

    // ─── 时序趋势分析 ───
    model.trends = DT.analyzeTrends(model.timeline);

    // ─── 风险因素提取 ───
    model.risk_factors = DT.extractRiskFactors(model.timeline);

    // ─── 体质推断 ───
    model.constitution = DT.inferConstitution(model.timeline);

    // ─── 五脏趋势评分 ───
    model.organ_scores = snapshot.organ_scores;

    TCM.store.set('dt_' + patientId, model);
    return { ok: true, model: model, snapshot: snapshot };
  };

  // ═══ 健康值计算（参考CN121662303A的加权评分方法）═══
  // 总分100 = 面色(20) + 舌象(20) + 脉象(15) + 问诊(25) + 穿戴设备(10) + 历史趋势(10)
  DT.calculateHealthScore = function(snapshot) {
    var scores = { face: 20, tongue: 20, pulse: 15, inquiry: 25, wearable: 10, trend: 10 };
    var total = 0;

    // 面色评分 (0-20)
    if (snapshot.face) {
      var complexion = snapshot.face.complexion || snapshot.face.manual_features?.complexion;
      if (complexion === '明润') scores.face = 20;
      else if (complexion === '晦暗') scores.face = 12;
      else if (complexion === '苍白') scores.face = 10;
      else if (complexion === '萎黄') scores.face = 8;
      else if (complexion === '黧黑') scores.face = 5;
      else if (complexion === '潮红') scores.face = 14;
    } else {
      scores.face = 10; // 默认折中
    }
    total += scores.face;

    // 舌象评分 (0-20)
    if (snapshot.tongue) {
      var tongueBase = 15;
      var tc = snapshot.tongue.tongue_features?.tongue_body?.color || snapshot.tongue.manual_features?.color;
      if (tc === '淡红') tongueBase = 18;
      else if (tc === '淡白') tongueBase = 12;
      else if (tc === '紫暗') tongueBase = 8;
      else if (tc === '绛') tongueBase = 6;

      if (snapshot.tongue.tongue_features?.tongue_body?.shape === '齿痕') tongueBase -= 3;
      if (snapshot.tongue.tongue_features?.tongue_coating?.texture === '腻') tongueBase -= 2;
      if (snapshot.tongue.tongue_features?.tongue_coating?.texture === '剥') tongueBase -= 4;
      
      scores.tongue = Math.max(0, Math.min(20, tongueBase));
    } else {
      scores.tongue = 10;
    }
    total += scores.tongue;

    // 脉象评分 (0-15)
    if (snapshot.pulse) {
      scores.pulse = 10; // baseline
      if (snapshot.pulse.depth === '浮' || snapshot.pulse.depth === '沉') scores.pulse -= 2;
      if (snapshot.pulse.speed === '数' || snapshot.pulse.speed === '迟') scores.pulse -= 2;
      if (snapshot.pulse.strength === '无力') scores.pulse -= 3;
      scores.pulse = Math.max(5, Math.min(15, scores.pulse));
    } else {
      scores.pulse = 8;
    }
    total += scores.pulse;

    // 问诊评分 (0-25)
    if (snapshot.inquiry || snapshot.chief_complaint) {
      var complaint = snapshot.chief_complaint || '';
      var termCount = (snapshot.inquiry?.extracted_tcm_terms || []).length;
      var baseInquiry = 15 + termCount * 2;
      
      var dangerWords = ['剧烈','大出血','中风','瘫痪','休克'];
      for (var i = 0; i < dangerWords.length; i++) {
        if (complaint.indexOf(dangerWords[i]) >= 0) { baseInquiry -= 10; break; }
      }
      
      scores.inquiry = Math.max(5, Math.min(25, baseInquiry));
    } else {
      scores.inquiry = 10;
    }
    total += scores.inquiry;

    // 穿戴设备 (0-10)
    if (snapshot.wearable) {
      scores.wearable = 8;
      if (snapshot.wearable.temperature_c >= 37.5) scores.wearable -= 3;
    } else {
      scores.wearable = 5;
    }
    total += scores.wearable;

    // 历史趋势 (0-10)
    scores.trend = 5; // 默认，需多记录才有意义
    if (snapshot._history_count && snapshot._history_count >= 3) {
      scores.trend = 10;
    }
    total += scores.trend;

    return { total: Math.round(total), breakdown: scores, grade: total >= 85 ? 'A' : total >= 70 ? 'B' : total >= 50 ? 'C' : 'D' };
  };

  // ═══ 五脏评分（面部五区分区映射）═══
  DT.calculateOrganScores = function(snapshot) {
    // 面部分区 → 五脏映射（参考CN121662303A）
    var organs = {
      heart:   { score: 70, label: '心',   face_region: 'forehead',    color_good: '明润', color_bad: '潮红' },
      liver:   { score: 70, label: '肝',   face_region: 'left_cheek',  color_good: '明润', color_bad: '晦暗' },
      spleen:  { score: 70, label: '脾',   face_region: 'nose',        color_good: '明润', color_bad: '萎黄' },
      lung:    { score: 70, label: '肺',   face_region: 'right_cheek', color_good: '明润', color_bad: '苍白' },
      kidney:  { score: 70, label: '肾',   face_region: 'chin',        color_good: '明润', color_bad: '黧黑' }
    };

    // 从舌象调整五脏
    if (snapshot.tongue) {
      var tc = snapshot.tongue.tongue_features?.tongue_body?.color || snapshot.tongue.manual_features?.color;
      if (tc === '淡白') { organs.heart.score -= 10; organs.spleen.score -= 10; }
      if (tc === '红' || tc === '绛') { organs.heart.score -= 15; organs.liver.score -= 10; }
      if (tc === '紫暗') { organs.heart.score -= 20; organs.liver.score -= 15; }
    }

    // 从症状调整
    var complaint = snapshot.chief_complaint || '';
    if (/心悸|胸闷|心慌/.test(complaint)) organs.heart.score -= 15;
    if (/头晕|目眩|胁痛/.test(complaint)) organs.liver.score -= 15;
    if (/腹胀|食欲|没胃口/.test(complaint)) organs.spleen.score -= 15;
    if (/咳嗽|气喘|呼吸/.test(complaint)) organs.lung.score -= 15;
    if (/腰痛|耳鸣|怕冷/.test(complaint)) organs.kidney.score -= 15;

    // 保底+封顶
    for (var k in organs) {
      organs[k].score = Math.max(10, Math.min(100, organs[k].score));
      organs[k].grade = organs[k].score >= 80 ? '优' : organs[k].score >= 60 ? '良' : organs[k].score >= 40 ? '中' : '差';
    }

    return organs;
  };

  // ═══ 时序趋势分析 ═══
  DT.analyzeTrends = function(timeline) {
    if (!timeline || timeline.length < 2) return { trend: 'insufficient', note: '需要至少2次就诊记录' };

    var recent = timeline.slice(-5); // 最近5次
    var scores = recent.map(function(s) { return (s.health_score && s.health_score.total) || 50; });
    
    // 线性回归简化
    var avg = scores.reduce(function(a,b) { return a+b; }, 0) / scores.length;
    var firstHalf = scores.slice(0, Math.floor(scores.length/2));
    var secondHalf = scores.slice(Math.floor(scores.length/2));
    var avg1 = firstHalf.length ? firstHalf.reduce(function(a,b){return a+b},0)/firstHalf.length : avg;
    var avg2 = secondHalf.length ? secondHalf.reduce(function(a,b){return a+b},0)/secondHalf.length : avg;
    var slope = avg2 - avg1;

    // 症状变化
    var complaints = recent.map(function(s) { return s.chief_complaint; });
    var uniqueComplaints = {};
    for (var i = 0; i < complaints.length; i++) {
      var words = complaints[i].split(/[,，\s]+/);
      for (var j = 0; j < words.length; j++) {
        var w = words[j].trim();
        if (w.length >= 2) uniqueComplaints[w] = (uniqueComplaints[w] || 0) + 1;
      }
    }

    return {
      trend: slope > 5 ? 'improving' : slope < -5 ? 'declining' : 'stable',
      slope: Math.round(slope * 10) / 10,
      average_score: Math.round(avg),
      data_points: timeline.length,
      frequent_symptoms: Object.entries(uniqueComplaints)
        .sort(function(a,b){ return b[1] - a[1]; })
        .slice(0, 5)
        .map(function(e) { return e[0] + '(' + e[1] + '次)'; }),
      last_visit: recent[recent.length-1]?.timestamp || null
    };
  };

  // ═══ 风险因素提取 ═══
  DT.extractRiskFactors = function(timeline) {
    if (!timeline || !timeline.length) return [];
    var risks = [];

    // 健康值持续走低
    var allScores = timeline.map(function(s) { return (s.health_score && s.health_score.total) || 50; });
    if (allScores.length >= 2 && allScores[allScores.length-1] < 60 && allScores[allScores.length-2] < 60) {
      risks.push({ type: 'declining_health', level: 'high', detail: '连续两次健康评分低于60分', suggestion: '建议全面体检' });
    }

    // 发热反复
    var feverCount = timeline.filter(function(s) {
      return s.wearable && s.wearable.temperature_c >= 37.5;
    }).length;
    if (feverCount >= 2) {
      risks.push({ type: 'recurrent_fever', level: 'medium', detail: '反复发热 ' + feverCount + ' 次', suggestion: '建议排查感染源' });
    }

    // 舌象持续异常
    var tongueAbnormal = timeline.filter(function(s) {
      var tc = s.tongue?.tongue_features?.tongue_body?.color || s.tongue?.manual_features?.color;
      return tc && tc !== '淡红';
    }).length;
    if (tongueAbnormal >= timeline.length * 0.7 && timeline.length >= 2) {
      risks.push({ type: 'persistent_tongue_abnormal', level: 'medium', detail: '舌象持续异常', suggestion: '建议内调，注意饮食起居' });
    }

    // 久病未愈
    if (timeline.length >= 3) {
      var complaints = timeline.map(function(s) { return s.chief_complaint; });
      var sameCount = 0;
      for (var i = 1; i < complaints.length; i++) {
        if (complaints[i] === complaints[0]) sameCount++;
      }
      if (sameCount >= 2) {
        risks.push({ type: 'chronic_condition', level: 'high', detail: '同症状反复就诊3次以上未改善', suggestion: '建议调整治疗方案，考虑专科会诊' });
      }
    }

    return risks;
  };

  // ═══ 体质推断 ═══
  DT.inferConstitution = function(timeline) {
    if (!timeline.length) return null;

    var latest = timeline[timeline.length-1];
    var tongueColor = latest.tongue?.tongue_features?.tongue_body?.color || latest.tongue?.manual_features?.color;
    var complexion = latest.face?.complexion || latest.face?.manual_features?.complexion;

    var constitutionScores = {
      '平和质': 50, '气虚质': 0, '阳虚质': 0, '阴虚质': 0,
      '痰湿质': 0, '湿热质': 0, '血瘀质': 0, '气郁质': 0, '特禀质': 0
    };

    // 舌象推断
    if (tongueColor === '淡白') { constitutionScores['气虚质'] += 20; constitutionScores['阳虚质'] += 15; }
    if (tongueColor === '红' || tongueColor === '绛') { constitutionScores['阴虚质'] += 20; constitutionScores['湿热质'] += 15; }
    if (tongueColor === '紫暗') { constitutionScores['血瘀质'] += 25; }
    if (tongueColor === '淡红') { constitutionScores['平和质'] += 20; }

    // 面色推断
    if (complexion === '苍白') { constitutionScores['气虚质'] += 15; constitutionScores['阳虚质'] += 10; }
    if (complexion === '潮红') { constitutionScores['阴虚质'] += 15; }
    if (complexion === '萎黄') { constitutionScores['气虚质'] += 10; constitutionScores['痰湿质'] += 10; }
    if (complexion === '晦暗') { constitutionScores['血瘀质'] += 10; constitutionScores['气郁质'] += 10; }
    if (complexion === '明润') { constitutionScores['平和质'] += 25; }

    // 症状推断
    var complaint = latest.chief_complaint || '';
    if (/乏力|疲劳|没精神/.test(complaint)) constitutionScores['气虚质'] += 15;
    if (/怕冷|手脚凉|畏寒/.test(complaint)) constitutionScores['阳虚质'] += 20;
    if (/口干|盗汗|发热/.test(complaint)) constitutionScores['阴虚质'] += 20;
    if (/腹胀|胃胀|痰多/.test(complaint)) constitutionScores['痰湿质'] += 20;
    if (/口苦|烦躁|湿疹/.test(complaint)) constitutionScores['湿热质'] += 20;
    if (/刺痛|瘀斑|月经黑/.test(complaint)) constitutionScores['血瘀质'] += 20;
    if (/胸闷|胁痛|烦躁|情绪/.test(complaint)) constitutionScores['气郁质'] += 20;

    var entries = Object.entries(constitutionScores);
    entries.sort(function(a,b) { return b[1] - a[1]; });
    
    return {
      primary: { name: entries[0][0], score: entries[0][1] },
      secondary: entries[1][1] > 20 ? { name: entries[1][0], score: entries[1][1] } : null,
      all_scores: constitutionScores
    };
  };

  // ═══ 养生方案推荐 ═══
  DT.generateHealthPlan = function(model) {
    if (!model) return null;

    var constitution = model.constitution;
    var healthScore = model.health_score;
    var risks = model.risk_factors || [];
    var plan = {
      diet: [],
      exercise: [],
      acupoints: [],
      lifestyle: [],
      warnings: [],
      followup_days: 30
    };

    // 体质 → 饮食
    var dietMap = {
      '气虚质': ['黄芪炖鸡汤', '山药粥', '红枣枸杞茶', '党参炖排骨', '多吃五谷杂粮'],
      '阳虚质': ['当归生姜羊肉汤', '肉桂红糖水', '核桃仁', '韭菜炒虾仁', '忌生冷'],
      '阴虚质': ['银耳莲子羹', '麦冬沙参茶', '枸杞菊花茶', '梨汁', '忌辛辣'],
      '痰湿质': ['薏米红豆粥', '冬瓜汤', '陈皮普洱茶', '白萝卜', '少食肥甘'],
      '湿热质': ['绿豆汤', '苦瓜炒蛋', '荷叶茶', '薏仁水', '少酒少辣'],
      '血瘀质': ['山楂红糖水', '黑木耳炒西芹', '玫瑰花茶', '醋泡花生', '少油腻'],
      '气郁质': ['玫瑰花茶', '金桔', '佛手陈皮茶', '香蕉', '忌咖啡浓茶'],
      '平和质': ['均衡饮食', '时令蔬果', '适量肉蛋奶', '少盐少油', '七分饱']
    };

    plan.diet = dietMap[constitution?.primary?.name] || dietMap['平和质'];

    // 运动
    plan.exercise = ['八段锦(每日15分钟)', '太极拳(每周3次)', '散步(每日30分钟)'];

    // 穴位
    var acupointMap = {
      '气虚质': ['足三里', '气海', '关元'],
      '阳虚质': ['命门', '关元', '神阙'],
      '阴虚质': ['太溪', '三阴交', '涌泉'],
      '痰湿质': ['丰隆', '阴陵泉', '中脘'],
      '湿热质': ['曲池', '合谷', '阴陵泉'],
      '血瘀质': ['血海', '膈俞', '三阴交'],
      '气郁质': ['太冲', '期门', '肝俞'],
      '平和质': ['足三里', '涌泉', '百会']
    };
    plan.acupoints = acupointMap[constitution?.primary?.name] || ['足三里'];

    // 生活方式
    switch (constitution?.primary?.name) {
      case '气虚质': plan.lifestyle = ['避免过度劳累', '保证充足睡眠', '子时(23点)前入睡']; break;
      case '阳虚质': plan.lifestyle = ['注意保暖', '多晒太阳', '晨起喝温水']; break;
      case '阴虚质': plan.lifestyle = ['避免熬夜', '保持心情平和', '午后小憩']; break;
      case '痰湿质': plan.lifestyle = ['保持环境干燥', '多运动出汗', '避免久坐']; break;
      case '湿热质': plan.lifestyle = ['保持皮肤清洁', '避免潮湿环境', '穿透气衣物']; break;
      case '血瘀质': plan.lifestyle = ['适当运动活血', '避免久坐久立', '保持心情愉快']; break;
      case '气郁质': plan.lifestyle = ['多参加社交活动', '培养兴趣爱好', '写日记疏导']; break;
      default: plan.lifestyle = ['规律作息', '适度运动', '保持乐观心态'];
    }

    // 警告
    for (var i = 0; i < risks.length; i++) {
      plan.warnings.push(risks[i].suggestion);
    }
    if (healthScore && healthScore.total < 60) {
      plan.warnings.push('健康分值偏低，建议近期安排体检');
      plan.followup_days = 7;
    }
    if (healthScore && healthScore.total < 40) {
      plan.warnings.push('健康分值过低，请尽快就医');
      plan.followup_days = 3;
    }

    return plan;
  };
})();
