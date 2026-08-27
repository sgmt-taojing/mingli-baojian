/**
 * 命理宝鉴·医道 · 中药安全引擎 v1.0
 * 十八反 + 十九畏 + 妊娠禁忌 + 肝肾毒性
 */
const SAFETY_KB = {
  // 十八反
  eighteen_antagonisms: [
    { pair: ['甘草','京大戟'], reason: '相反·不可同用' },
    { pair: ['甘草','芫花'], reason: '相反·不可同用' },
    { pair: ['甘草','甘遂'], reason: '相反·不可同用' },
    { pair: ['海藻','京大戟'], reason: '相反·不可同用' },
    { pair: ['海藻','芫花'], reason: '相反·不可同用' },
    { pair: ['海藻','甘遂'], reason: '相反·不可同用' },
    { pair: ['藜芦','人参'], reason: '相反·不可同用' },
    { pair: ['藜芦','丹参'], reason: '相反·不可同用' },
    { pair: ['藜芦','玄参'], reason: '相反·不可同用' },
    { pair: ['藜芦','沙参'], reason: '相反·不可同用' },
    { pair: ['藜芦','苦参'], reason: '相反·不可同用' },
    { pair: ['藜芦','细辛'], reason: '相反·不可同用' },
    { pair: ['藜芦','芍药'], reason: '相反·不可同用' },
    { pair: ['乌头','半夏'], reason: '相反·不可同用' },
    { pair: ['乌头','瓜蒌'], reason: '相反·不可同用' },
    { pair: ['乌头','贝母'], reason: '相反·不可同用' },
    { pair: ['乌头','白蔹'], reason: '相反·不可同用' },
    { pair: ['乌头','白及'], reason: '相反·不可同用' }
  ],
  // 十九畏
  nineteen_incompatibilities: [
    { pair: ['硫黄','朴硝'], reason: '畏·不可同用' },
    { pair: ['水银','砒霜'], reason: '畏·不可同用' },
    { pair: ['狼毒','密陀僧'], reason: '畏·不可同用' },
    { pair: ['巴豆','牵牛'], reason: '畏·不可同用' },
    { pair: ['丁香','郁金'], reason: '畏·不可同用' },
    { pair: ['川乌','犀角'], reason: '畏·不可同用' },
    { pair: ['人参','五灵脂'], reason: '畏·不可同用' },
    { pair: ['肉桂','赤石脂'], reason: '畏·不可同用' }
  ],
  // 妊娠禁忌
  pregnancy_contraindicated: ['麝香','水蛭','虻虫','三棱','莪术','巴豆','牵牛子','大戟','芫花','甘遂','商陆','麝香','冰片','斑蝥','雄黄','朱砂','附子','肉桂','桃仁','红花','大黄','枳实','枳壳','薏苡仁','马齿苋'],
  // 肝肾毒性
  hepatoxic: ['雷公藤','何首乌','黄药子','艾叶','千里光','苍耳子','款冬花','望江南'],
  nephrotoxic: ['关木通','广防己','青木香','马兜铃','细辛（大量）','天仙藤']
};

/**
 * 检查方剂安全性
 * @param {array} herbs - 药材列表
 * @returns {object} {safe, alerts[]}
 */
function checkSafety(herbs, options = {}) {
  const alerts = [];
  const herbSet = new Set(herbs);
  
  // 十八反
  for (const item of SAFETY_KB.eighteen_antagonisms) {
    if (herbSet.has(item.pair[0]) && herbSet.has(item.pair[1])) {
      alerts.push({ severity: 'CRITICAL', type: '十八反', pair: item.pair, reason: item.reason });
    }
  }
  
  // 十九畏
  for (const item of SAFETY_KB.nineteen_incompatibilities) {
    if (herbSet.has(item.pair[0]) && herbSet.has(item.pair[1])) {
      alerts.push({ severity: 'CRITICAL', type: '十九畏', pair: item.pair, reason: item.reason });
    }
  }
  
  // 妊娠
  if (options.pregnant) {
    const found = herbs.filter(h => SAFETY_KB.pregnancy_contraindicated.includes(h));
    if (found.length) alerts.push({ severity: 'HIGH', type: '妊娠禁忌', herbs: found, reason: '孕妇禁用' });
  }
  
  // 肝肾毒性
  const hepatic = herbs.filter(h => SAFETY_KB.hepatoxic.includes(h));
  if (hepatic.length) alerts.push({ severity: 'WARNING', type: '肝毒性风险', herbs: hepatic, reason: '需监测ALT/AST' });
  
  const renal = herbs.filter(h => SAFETY_KB.nephrotoxic.includes(h));
  if (renal.length) alerts.push({ severity: 'WARNING', type: '肾毒性风险', herbs: renal, reason: '需监测肌酐/eGFR' });
  
  return {
    ok: true,
    safe: alerts.length === 0,
    alerts,
    severity_summary: {
      critical: alerts.filter(a => a.severity === 'CRITICAL').length,
      high: alerts.filter(a => a.severity === 'HIGH').length,
      warning: alerts.filter(a => a.severity === 'WARNING').length
    },
    total_alerts: alerts.length
  };
}

module.exports = { SAFETY_KB, checkSafety };
