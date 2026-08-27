/**
 * 多模态中西医融合评估引擎 v2.0
 * 基于《完整版统一大模型系统提示词（中医专项）》规范
 *
 * 核心能力：
 *   1. 双场景输出 (clinic / home_robot)
 *   2. 多模态交叉验证（穿戴+舌诊+面诊+手诊+主诉）
 *   3. 风险分级（低/中/高）
 *   4. 数据可靠性标注
 *   5. 结构化分模块输出
 *   6. 工具调度提示（信息不足时触发采集）
 */

'use strict';

// ═══ 西医生命体征安全阈值 ═══
const VITAL_THRESHOLDS = {
  spo2: { critical: 92, warn: 95, unit: '%', label: '血氧' },
  systolic: { critical_high: 180, warn_high: 140, critical_low: 90, warn_low: 100, unit: 'mmHg', label: '收缩压' },
  diastolic: { critical_high: 110, warn_high: 90, critical_low: 60, warn_low: 65, unit: 'mmHg', label: '舒张压' },
  heart_rate: { critical_high: 120, warn_high: 100, critical_low: 50, warn_low: 55, unit: 'bpm', label: '心率' },
  temperature: { critical_high: 39.5, warn_high: 38.0, critical_low: 35.5, warn_low: 36.0, unit: '°C', label: '体温' }
};

// ═══ 主入口：统一综合评估 ═══
function unifiedAssessment(input) {
  const scene = input.scene_type || 'clinic';
  const startTime = Date.now();

  // 1. 解析各模态输入
  const vital = input.vital || null;
  const tongue = input.tongue || null;
  const face = input.face || null;
  const hand = input.hand || null;
  const complaint = input.complaint || '';
  const posture = input.posture || null;
  const kbHits = input.kb_hits || [];
  const patient = input.patient || {};

  // 2. 各模态独立分析
  const vitalAnalysis = analyzeVitals(vital);
  const tongueAnalysis = tongue ? analyzeTongueModality(tongue) : null;
  const faceAnalysis = face ? analyzeFaceModality(face) : null;
  const handAnalysis = hand ? analyzeHandModality(hand) : null;
  const complaintTerms = extractComplaintTerms(complaint);

  // 3. 多模态交叉验证（核心规则）
  const crossValidation = performCrossValidation({
    vitalAnalysis, tongueAnalysis, faceAnalysis, handAnalysis, complaintTerms
  });

  // 4. 风险定级
  const risk = classifyRisk(vitalAnalysis, crossValidation, complaintTerms);

  // 5. KB 匹配
  const kbMatches = matchKBPatterns({ tongueAnalysis, faceAnalysis, handAnalysis, complaintTerms }, kbHits);

  // 6. 数据可靠性
  const reliability = assessReliability(input);

  // 7. 工具调度提示
  const toolHints = generateToolHints(input);

  // 8. 按场景生成输出
  const output = scene === 'home_robot'
    ? generateHomeRobotOutput({ risk, vitalAnalysis, tongueAnalysis, faceAnalysis, crossValidation, kbMatches, reliability, toolHints, patient })
    : generateClinicOutput({ risk, vitalAnalysis, tongueAnalysis, faceAnalysis, handAnalysis, crossValidation, kbMatches, reliability, toolHints, patient, complaint, posture, complaintTerms });

  return {
    ok: true,
    scene_type: scene,
    risk_level: risk.level,
    risk_score: risk.score,
    output: output,
    structured: { risk, vitalAnalysis, tongueAnalysis, crossValidation, kbMatches, reliability },
    cost_ms: Date.now() - startTime,
    disclaimer: '本内容为AI辅助综合分析，不构成临床诊断，请执业医师结合线下面诊、相关检查综合判定'
  };
}

// ═══ 1. 生命体征分析 ═══
function analyzeVitals(vital) {
  if (!vital) return { available: false, note: '无穿戴设备数据' };
  const alerts = [];
  const findings = [];

  for (const [key, th] of Object.entries(VITAL_THRESHOLDS)) {
    const val = vital[key];
    if (val === undefined || val === null) continue;
    if (th.critical_high && val >= th.critical_high) {
      alerts.push({ metric: key, value: val, level: 'critical', label: th.label, unit: th.unit, msg: `${th.label}过高(${val}${th.unit})，危重` });
    } else if (th.critical_low && val <= th.critical_low) {
      alerts.push({ metric: key, value: val, level: 'critical', label: th.label, unit: th.unit, msg: `${th.label}过低(${val}${th.unit})，危重` });
    } else if (th.warn_high && val >= th.warn_high) {
      findings.push({ metric: key, value: val, level: 'warn', label: th.label, unit: th.unit, msg: `${th.label}偏高(${val}${th.unit})` });
    } else if (th.warn_low && val <= th.warn_low) {
      findings.push({ metric: key, value: val, level: 'warn', label: th.label, unit: th.unit, msg: `${th.label}偏低(${val}${th.unit})` });
    } else {
      findings.push({ metric: key, value: val, level: 'normal', label: th.label, unit: th.unit });
    }
  }

  return {
    available: true,
    alerts,
    findings,
    hasCritical: alerts.length > 0,
    summary: alerts.length > 0 ? `⚠️ ${alerts.map(a => a.msg).join('；')}` : '生命体征基本平稳'
  };
}

// ═══ 2-4. 面诊/舌诊/手诊 模态分析 ═══
function analyzeTongueModality(tongue) {
  const color = tongue.tongue_color || '';
  const coating = tongue.coating || '';
  const moisture = tongue.moisture || '';
  const conf = tongue.confidence || 0.65;

  const syndromes = [];
  if (color === '红' && coating === '黄') syndromes.push({ pattern: '实热证', conf: 0.85 });
  if (color === '淡白' || color === '淡') syndromes.push({ pattern: '气血虚', conf: 0.80 });
  if (color === '紫暗' || color === '暗紫') syndromes.push({ pattern: '血瘀证', conf: 0.78 });
  if (coating === '少苔' || coating === '无苔') syndromes.push({ pattern: '阴虚', conf: 0.82 });
  if (moisture === '滑' && color === '淡') syndromes.push({ pattern: '阳虚水泛', conf: 0.76 });

  return {
    available: true,
    color, coating, moisture,
    confidence: conf,
    syndromes,
    reliability: conf >= 0.7 ? '可靠' : '一般',
    note: conf < 0.5 ? '⚠️ 图像质量偏低，舌诊分析可靠性有限' : ''
  };
}

function analyzeFaceModality(face) {
  const complexion = face.complexion || face.color || '';
  const lustre = face.lustre || '';
  const conf = face.confidence || 0.65;

  const syndromes = [];
  if (complexion === '红' || complexion === '潮红') syndromes.push({ pattern: '热证/阴虚', conf: 0.78 });
  if (complexion === '苍白' || complexion === '淡白') syndromes.push({ pattern: '血虚/阳虚', conf: 0.80 });
  if (complexion === '黄' || complexion === '萎黄') syndromes.push({ pattern: '脾虚/湿热', conf: 0.76 });
  if (complexion === '青紫') syndromes.push({ pattern: '血瘀/寒凝', conf: 0.74 });
  if (lustre === '晦暗') syndromes.push({ pattern: '气血不足/久病', conf: 0.72 });

  return {
    available: true,
    complexion, lustre,
    confidence: conf,
    syndromes,
    reliability: conf >= 0.7 ? '可靠' : '一般'
  };
}

function analyzeHandModality(hand) {
  const palmColor = hand.palm_color || '';
  const nailColor = hand.nail_color || '';
  const conf = hand.confidence || 0.60;

  const syndromes = [];
  if (palmColor === '潮红') syndromes.push({ pattern: '阴虚/热证', conf: 0.74 });
  if (palmColor === '苍白') syndromes.push({ pattern: '血虚', conf: 0.78 });
  if (palmColor === '紫暗') syndromes.push({ pattern: '血瘀', conf: 0.72 });
  if (nailColor === '苍白') syndromes.push({ pattern: '血虚', conf: 0.76 });
  if (nailColor === '青紫') syndromes.push({ pattern: '血瘀/寒凝', conf: 0.70 });

  return {
    available: true,
    palmColor, nailColor,
    confidence: conf,
    syndromes,
    reliability: conf >= 0.7 ? '可靠' : '一般'
  };
}

// ═══ 3. 多模态交叉验证（提示词强制规则）═══
function performCrossValidation({ vitalAnalysis, tongueAnalysis, faceAnalysis, handAnalysis, complaintTerms }) {
  const results = [];
  let upliftCount = 0;

  // 规则1：穿戴异常 + 舌面佐证 + 主诉 → 上调风险
  if (vitalAnalysis?.hasCritical) {
    const tongueMatch = tongueAnalysis?.syndromes?.length > 0;
    const faceMatch = faceAnalysis?.syndromes?.length > 0;
    const complaintMatch = complaintTerms.length > 0;
    if (tongueMatch || faceMatch || complaintMatch) {
      results.push({ rule: '多源佐证', effect: '风险上调', detail: '生命体征危急 + ' + 
        (tongueMatch ? '舌诊' : '') + (faceMatch ? '面诊' : '') + (complaintMatch ? '主诉' : '') + ' 多维度异常佐证' });
      upliftCount++;
    }
  }

  // 规则2：仅单一模态异常 → 标记疑似
  const anomalySources = [];
  if (vitalAnalysis?.hasCritical) anomalySources.push('穿戴设备');
  if (tongueAnalysis?.syndromes?.length > 0) anomalySources.push('舌诊');
  if (faceAnalysis?.syndromes?.length > 0) anomalySources.push('面诊');
  if (handAnalysis?.syndromes?.length > 0) anomalySources.push('手诊');
  if (complaintTerms.length > 0) anomalySources.push('主诉');

  if (anomalySources.length === 1) {
    results.push({ rule: '单源异常', effect: '标记疑似', detail: `仅${anomalySources[0]}提示异常，其余维度无对应佐证，建议进一步复核` });
  }

  // 规则3：舌诊阴虚 + 面诊潮红 → 佐证增强
  if (tongueAnalysis?.syndromes?.some(s => s.pattern.includes('阴虚')) &&
      faceAnalysis?.syndromes?.some(s => s.pattern.includes('阴虚'))) {
    results.push({ rule: '舌面双源验证', effect: '置信增强', detail: '舌诊与面诊均指向阴虚证候，综合置信度提升' });
    upliftCount++;
  }

  return {
    results,
    crossSourceCount: anomalySources.length,
    upliftCount,
    recommendation: upliftCount >= 2 ? '多模态高度一致，建议优先处理' :
                    upliftCount === 1 ? '部分模态一致，建议结合问诊进一步确认' :
                    anomalySources.length === 1 ? '⚠️ 仅单一来源异常，信息有限，建议补充其他模态采集' :
                    '多模态未见显著异常'
  };
}

// ═══ 4. 风险分级 ═══
function classifyRisk(vitalAnalysis, crossValidation, complaintTerms) {
  let score = 0;
  const factors = [];

  // 危急生命体征 → +50
  if (vitalAnalysis?.hasCritical) {
    score += 50;
    factors.push('存在危急生命体征');
  }

  // 警告体征（偏高/偏低） → +10 each
  const warns = (vitalAnalysis?.findings || []).filter(f => f.level === 'warn');
  if (warns.length > 0) {
    score += 10 * warns.length;
    factors.push(`${warns.length} 项警告体征(${warns.map(w => w.label).join('、')})`);
  }

  // 多模态佐证 → +15
  if (crossValidation?.upliftCount >= 2) {
    score += 15;
    factors.push('多模态高度一致异常');
  } else if (crossValidation?.upliftCount === 1) {
    score += 5;
    factors.push('部分模态一致');
  }

  // 症状严重性 → +5 each
  const severeTerms = complaintTerms.filter(t => ['胸痛','呼吸困难','剧烈','持续','晕厥','意识','跌倒','摔倒'].some(k => t.includes(k)));
  if (severeTerms.length > 0) {
    score += 15 * severeTerms.length;
    factors.push(`主诉含${severeTerms.length}个严重关键词`);
  }

  // 中度症状 → +5 each
  const moderateTerms = complaintTerms.filter(t => ['头晕','胸闷','心慌','心悸','乏力','头痛','失眠','气短'].some(k => t.includes(k)));
  if (moderateTerms.length > 0 && (warns.length > 0 || vitalAnalysis?.alerts?.length > 0)) {
    score += 5 * Math.min(moderateTerms.length, 4);
    factors.push(`${moderateTerms.length}个中度症状+警告体征联合`);
  }

  let level, label, action;
  if (score >= 50) {
    level = 'high'; label = '高风险'; action = '需尽快联系家属或就医';
  } else if (score >= 20) {
    level = 'medium'; label = '中风险'; action = '需要持续监测，建议医师咨询';
  } else {
    level = 'low'; label = '低风险'; action = '指标基本平稳，症状轻微，建议自我监测';
  }

  return { level, label, score, action, factors };
}

// ═══ 5. KB 匹配 ═══
function matchKBPatterns({ tongueAnalysis, faceAnalysis, complaintTerms }, kbHits) {
  const western = [];
  const tcm = [];

  // 西医线索
  const wChecks = [
    { terms: ['胸痛','胸闷','心慌'], clue: '心血管系统——建议心电图/心肌酶检查' },
    { terms: ['呼吸困难','气短','喘息'], clue: '呼吸系统——建议肺功能/血氧监测' },
    { terms: ['头痛','头晕','眩晕'], clue: '神经系统——建议血压监测/神经系统检查' },
    { terms: ['腹泻','便秘','胃痛'], clue: '消化系统——建议腹部检查/胃镜评估' }
  ];
  for (const check of wChecks) {
    if (check.terms.some(t => complaintTerms.some(c => c.includes(t)))) {
      western.push(check.clue);
    }
  }

  // 中医证候线索
  if (tongueAnalysis?.syndromes) {
    for (const s of tongueAnalysis.syndromes) {
      tcm.push(`舌诊→${s.pattern} (置信${Math.round(s.conf*100)}%)`);
    }
  }
  if (faceAnalysis?.syndromes) {
    for (const s of faceAnalysis.syndromes) {
      tcm.push(`面诊→${s.pattern} (置信${Math.round(s.conf*100)}%)`);
    }
  }
  if (kbHits.length > 0) {
    for (const hit of kbHits.slice(0, 3)) {
      tcm.push(`KB→${hit.syndrome || hit.pattern || ''}`);
    }
  }

  return { western, tcm, kbMatched: kbHits.length };
}

// ═══ 6. 数据可靠性 ═══
function assessReliability(input) {
  const issues = [];
  if (!input.vital) issues.push('缺少穿戴设备数据');
  if (!input.tongue) issues.push('缺少舌诊数据');
  if (!input.face) issues.push('缺少面诊数据');
  if (!input.complaint || input.complaint.trim().length < 2) issues.push('主诉信息不足');
  if (input.tongue && (input.tongue.confidence || 0) < 0.5) issues.push('舌诊图像质量偏低');
  if (input.face && (input.face.confidence || 0) < 0.5) issues.push('面诊图像质量偏低');

  return {
    overall: issues.length === 0 ? '高' : issues.length <= 2 ? '中' : '低',
    issues,
    recommendation: issues.length > 0 ? `建议补充: ${issues.join('；')}` : '数据完整，评估可靠性高'
  };
}

// ═══ 7. 工具调度提示 ═══
function generateToolHints(input) {
  const hints = [];
  if (!input.tongue) hints.push({ action: 'capture_tongue', msg: '请引导患者拍摄舌象照片' });
  if (!input.face) hints.push({ action: 'capture_face', msg: '请引导患者拍摄面部照片' });
  if (!input.vital) hints.push({ action: 'fetch_vitals', msg: '请同步拉取穿戴设备最新监测数据' });
  if (!input.complaint || input.complaint.trim().length < 2) hints.push({ action: 'ask_symptoms', msg: '请进一步询问患者主诉症状' });
  return hints;
}

// ═══ 8a. 场景A：诊室结构化报告 ═══
function generateClinicOutput({ risk, vitalAnalysis, tongueAnalysis, faceAnalysis, handAnalysis, crossValidation, kbMatches, reliability, toolHints, patient, complaint, posture, complaintTerms }) {
  const parts = [];

  // 患者病史摘要
  parts.push('【患者病史摘要】');
  parts.push(`年龄: ${patient.age || '未知'} · 性别: ${patient.gender || '未知'}`);
  parts.push(`主诉: ${complaint || '未录入'}`);
  parts.push(`提取症状: ${complaintTerms.length > 0 ? complaintTerms.join('、') : '未识别出明确症状关键词'}`);

  // 穿戴设备
  parts.push('\n【穿戴设备监测数据｜异常指标高亮列出】');
  if (vitalAnalysis?.available) {
    for (const f of vitalAnalysis.findings || []) {
      const marker = f.level === 'critical' ? '🔴' : f.level === 'warn' ? '🟡' : '✅';
      parts.push(`${marker} ${f.label}: ${f.value}${f.unit} ${f.level === 'critical' ? '【危急】' : f.level === 'warn' ? '【偏高/偏低】' : '【正常】'}`);
    }
    if (vitalAnalysis.alerts?.length > 0) {
      parts.push(`\n⚠️ 危急/警告汇总: ${vitalAnalysis.alerts.map(a => a.msg).join('；')}`);
    }
  } else {
    parts.push('无穿戴设备数据（建议补充监测）');
  }

  // 视觉综合特征
  parts.push('\n【视觉综合特征汇总（面诊+舌诊+手诊+姿态呼吸）】');
  if (tongueAnalysis?.available) {
    parts.push(`舌诊: 舌色${tongueAnalysis.color} · 苔${tongueAnalysis.coating} · ${tongueAnalysis.moisture} · 置信${Math.round(tongueAnalysis.confidence*100)}% · 可靠性: ${tongueAnalysis.reliability}`);
    if (tongueAnalysis.syndromes?.length > 0) {
      parts.push(`  → 舌象证候: ${tongueAnalysis.syndromes.map(s => s.pattern).join('、')}`);
    }
  } else { parts.push('舌诊: 未采集'); }

  if (faceAnalysis?.available) {
    parts.push(`面诊: 面色${faceAnalysis.complexion} · 光泽${faceAnalysis.lustre || '-'} · 置信${Math.round(faceAnalysis.confidence*100)}%`);
  } else { parts.push('面诊: 未采集'); }

  if (handAnalysis?.available) {
    parts.push(`手诊: 掌色${handAnalysis.palmColor} · 甲色${handAnalysis.nailColor}`);
  } else { parts.push('手诊: 未采集'); }

  if (posture) {
    parts.push(`姿态识别: ${posture.description || ''} · 置信${posture.confidence ? Math.round(posture.confidence*100)+'%' : '-'}`);
  }

  // KB 匹配
  parts.push('\n【知识库匹配相关指征：西医症状线索、中医证候线索分开描述】');
  if (kbMatches.western.length > 0) {
    parts.push('西医症状线索:');
    kbMatches.western.forEach(w => parts.push(`  · ${w}`));
  } else { parts.push('西医症状线索: 未匹配到明确指征'); }

  if (kbMatches.tcm.length > 0) {
    parts.push('中医证候线索:');
    kbMatches.tcm.forEach(t => parts.push(`  · ${t}`));
  } else { parts.push('中医证候线索: 未匹配到明确证候'); }

  // 风险等级
  parts.push(`\n【综合风险等级: ${risk.label} (评分${risk.score})】`);
  parts.push(`影响因素: ${risk.factors.length > 0 ? risk.factors.join('；') : '无明显风险因素'}`);

  // 交叉验证
  parts.push('\n【多模态交叉验证结果】');
  parts.push(crossValidation.recommendation);
  for (const r of crossValidation.results) {
    parts.push(`  · [${r.rule}] ${r.effect}: ${r.detail}`);
  }

  // 数据可靠性
  parts.push(`\n【数据可靠性: ${reliability.overall}】`);
  if (reliability.issues.length > 0) {
    parts.push(`缺失/问题: ${reliability.issues.join('；')}`);
  }

  // 建议方向
  parts.push('\n【建议医师重点问询、重点查体方向】');
  if (tongueAnalysis?.syndromes?.length > 0) {
    parts.push(`· 舌象提示: ${tongueAnalysis.syndromes.map(s => s.pattern).join('、')}，建议重点询问相关伴随症状`);
  }
  if (vitalAnalysis?.hasCritical) {
    parts.push('· 危急体征存在，建议优先排查心脑血管、呼吸系统急症');
  }
  if (complaintTerms.length > 0) {
    parts.push(`· 基于主诉"${complaint}"，建议围绕${complaintTerms.slice(0,3).join('、')}展开系统问诊`);
  }
  if (toolHints.length > 0) {
    parts.push(`· 信息不足: ${toolHints.map(h => h.msg).join('；')}`);
  }

  // 特殊预警
  parts.push('\n【特殊预警（无则填写：无）】');
  parts.push(vitalAnalysis?.hasCritical ? vitalAnalysis.alerts.map(a => a.msg).join('；') : '无');

  // 免责
  parts.push('\n【免责声明：本内容为AI辅助综合分析，不构成临床诊断，请执业医师结合线下面诊、相关检查综合判定】');

  return parts.join('\n');
}

// ═══ 8b. 场景B：居家机器人口语 ═══
function generateHomeRobotOutput({ risk, vitalAnalysis, tongueAnalysis, faceAnalysis, crossValidation, kbMatches, reliability, toolHints, patient }) {
  const name = patient.name || '';
  const greet = name ? `${name}，` : '';

  // 低风险
  if (risk.level === 'low') {
    let msg = `${greet}您的整体健康状态目前比较平稳。`;
    if (vitalAnalysis?.available) {
      msg += `您的血压、心率、血氧都在正常范围。`;
    }
    if (tongueAnalysis?.syndromes?.length > 0) {
      const s = tongueAnalysis.syndromes[0];
      if (s.pattern.includes('阴虚')) msg += `舌象显示有点阴虚的倾向，建议多喝水、早睡早起、少吃辛辣。`;
      else if (s.pattern.includes('血瘀')) msg += `舌象显示血液循环需要留意一下，适当散步活动会很有帮助。`;
    }
    msg += `继续保持良好的生活习惯，如果有不舒服随时告诉我。`;
    return msg;
  }

  // 中风险
  if (risk.level === 'medium') {
    let msg = `${greet}我注意到您有几个健康指标需要留意一下。`;
    if (vitalAnalysis?.alerts?.length > 0) {
      msg += vitalAnalysis.alerts.map(a => `您的${a.label}是${a.value}${a.unit}，稍微${a.value > (VITAL_THRESHOLDS[a.metric]?.warn_high || 100) ? '偏高' : '偏低'}。`).join('');
    }
    if (tongueAnalysis?.syndromes?.length > 0) {
      msg += `舌象也提示有${tongueAnalysis.syndromes.map(s => s.pattern).join('和')}的倾向。`;
    }
    msg += `建议您这段时间多注意休息，保持清淡饮食。可以预约我们的医生做一次远程咨询，这样更安心。`;
    if (toolHints.length > 0) {
      msg += `方便的话，可以让我帮您拍一张舌苔照片，这样我能更准确地帮您分析。`;
    }
    return msg;
  }

  // 高风险
  let msg = `${greet}您的部分健康指标出现了比较明显的异常，需要尽快关注。`;
  if (vitalAnalysis?.hasCritical) {
    msg += vitalAnalysis.alerts.filter(a => a.level === 'critical').map(a => a.msg).join('。') + '。';
  }
  msg += `我已经通知了您的家属，建议尽快到医院做个检查。`;
  msg += `请不要剧烈活动，保持平静。如果有胸痛、呼吸困难这些情况，请立即拨打120。`;
  return msg;
}

// ═══ 辅助：主诉关键词提取 ═══
function extractComplaintTerms(text) {
  if (!text) return [];
  const patterns = [
    '失眠','头痛','头晕','发热','咳嗽','恶心','呕吐','腹泻','便秘',
    '胸闷','心慌','心悸','气短','呼吸困难','胸痛','乏力','疲劳',
    '腰酸','腰痛','关节痛','胃痛','胃胀','腹胀','反酸','嗳气',
    '口干','口苦','盗汗','自汗','畏寒','怕冷','浮肿','水肿',
    '皮疹','瘙痒','鼻塞','流涕','咽痛','耳鸣','视力模糊','跌倒','摔倒'
  ];
  return patterns.filter(p => text.includes(p));
}

module.exports = { unifiedAssessment, analyzeVitals, classifyRisk, performCrossValidation };
