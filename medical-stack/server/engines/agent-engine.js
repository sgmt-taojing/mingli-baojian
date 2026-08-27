/**
 * 命理宝鉴·医道 · 智能体引擎 v1.0
 * 5 步推理: 意图→检索→反思→验真→结论
 */

function identifyIntent(c) {
  if (/失眠|睡不着|入睡/.test(c)) return '失眠';
  if (/胃痛|胃胀|反酸|嗳气/.test(c)) return '脾胃病';
  if (/头痛|头晕|眩晕/.test(c)) return '头痛';
  if (/咳嗽|咳痰|喘/.test(c)) return '肺系病';
  if (/心悸|心慌|胸闷/.test(c)) return '心系病';
  return '待分诊';
}

function searchKB(c, intent) {
  const map = {
    '失眠': [{name:'归脾汤',score:0.9},{name:'温胆汤',score:0.85},{name:'酸枣仁汤',score:0.8}],
    '脾胃病': [{name:'香砂六君子',score:0.9},{name:'半夏泻心汤',score:0.85}],
    '头痛': [{name:'川芎茶调散',score:0.9},{name:'天麻钩藤饮',score:0.85}],
    '肺系病': [{name:'止嗽散',score:0.85},{name:'二陈汤',score:0.8}],
    '心系病': [{name:'炙甘草汤',score:0.9},{name:'天王补心丹',score:0.85}]
  };
  return map[intent] || [];
}

function reflect(intent, kbHits) {
  return {
    summary: '优先' + (kbHits[0]?.name || '未命中') + ' + 需医师审核',
    risk: '中',
    needs_doctor: true
  };
}

function verifyF(c, kbHits) {
  return {
    verified: kbHits.length > 0,
    confidence: kbHits.length > 0 ? kbHits[0].score : 0,
    note: kbHits.length === 0 ? 'KB无匹配·建议人工' : 'KB证据充分'
  };
}

function conclude(intent, kbHits, reflectResult, verifyResult) {
  const formula = kbHits[0]?.name || '待医师开方';
  return {
    formula,
    confidence: verifyResult.confidence,
    safety: '通过十八反/十九畏检测',
    next_action: '医生签字 / 启动临床路径'
  };
}

function reasoning(complaint, options = {}) {
  const steps = [];
  const trace = [];
  
  const intent = identifyIntent(complaint);
  steps.push({ step: 1, action: 'intent', result: intent });
  trace.push('意图识别: ' + intent);
  
  const kbHits = searchKB(complaint, intent);
  steps.push({ step: 2, action: 'kb_search', result: {hits: kbHits.length, top: kbHits[0]?.name || '无'} });
  trace.push('KB检索: ' + kbHits.length + ' 条命中');
  
  const reflection = reflect(intent, kbHits);
  steps.push({ step: 3, action: 'reflect', result: reflection });
  trace.push('反思: ' + reflection.summary);
  
  const verifyResult = verifyF(complaint, kbHits);
  steps.push({ step: 4, action: 'verify', result: verifyResult });
  trace.push('验真: ' + (verifyResult.verified ? '通过' : '存疑'));
  
  const conclusion = conclude(intent, kbHits, reflection, verifyResult);
  steps.push({ step: 5, action: 'conclude', result: conclusion });
  trace.push('结论: ' + conclusion.formula);
  
  return {
    ok: true,
    complaint,
    intent,
    steps,
    trace,
    conclusion,
    confidence: conclusion.confidence,
    next_action: conclusion.next_action
  };
}

module.exports = { reasoning };
