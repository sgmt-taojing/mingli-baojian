/**
 * TCM-Agent 客户端处方禁忌校验 V1.0
 * 基于十八反、十九畏、妊娠禁忌、剂量上限
 * 离线运行·无依赖
 */

(function() {
  if (typeof window === 'undefined') return;

  var SAFETY = window.TCM_SAFETY = window.TCM_SAFETY || {};

  // 十八反（简化版·6对）
  var BAFAN = [
    ['甘草', ['甘遂','大戟','芫花','海藻'], '甘草反甘遂/大戟/芫花/海藻'],
    ['乌头', ['半夏','瓜蒌','贝母','白蔹','白及'], '乌头反半夏/瓜蒌/贝母/白蔹/白及'],
    ['附子', ['半夏','瓜蒌','贝母','白蔹','白及'], '附子反半夏/瓜蒌/贝母/白蔹/白及'],
    ['藜芦', ['人参','沙参','丹参','玄参','细辛','白芍'], '藜芦反诸参/细辛/白芍'],
    ['狼毒', ['密陀僧','巴豆'], '狼毒畏密陀僧/巴豆'],
    ['巴豆', ['牵牛子'], '巴豆畏牵牛']
  ];

  // 十九畏（5对）
  var JIEWEI = [
    ['硫黄', ['朴硝'], '硫黄畏朴硝'],
    ['水银', ['砒霜'], '水银畏砒霜'],
    ['狼毒', ['密陀僧'], '狼毒畏密陀僧'],
    ['巴豆', ['牵牛'], '巴豆畏牵牛'],
    ['丁香', ['郁金'], '丁香畏郁金']
  ];

  // 妊娠禁忌（30+）
  var PREGNANCY_DISABLE = ['水银','砒霜','雄黄','轻粉','斑蝥','蟾酥','麝香','马钱子','川乌','草乌','巴豆','牵牛子','大戟','芫花','甘遂','商陆','麝香','水蛭','虻虫','三棱','莪术'];
  var PREGNANCY_CAREFUL = ['牛膝','川芎','红花','桃仁','姜黄','牡丹皮','枳实','枳壳','大黄','番泻叶','芦荟','芒硝','附子','肉桂'];

  // 剂量上限 (g/剂)
  var DOSE_LIMITS = [
    { name: '附子', max: 15, note: '附子先煎 30-60 分钟减毒' },
    { name: '麻黄', max: 9, note: '麻黄发汗力强·高血压慎用' },
    { name: '细辛', max: 3, note: '细辛不过钱(≈3g)' },
    { name: '大黄', max: 15, note: '大黄不宜久煎' },
    { name: '甘草', max: 10, note: '甘草大量服用可致水肿' },
    { name: '朱砂', max: 0.5, note: '朱砂含汞·不宜久服' },
    { name: '雄黄', max: 0.3, note: '雄黄含砷·严格控量' },
    { name: '雷公藤', max: 15, note: '雷公藤多苷片肝毒性·定期查肝功' }
  ];

  /**
   * 处方禁忌校验
   * @param {Array<{name:string, dose:number}>} herbs - 药材清单
   * @param {Object} patient - 患者信息 {age, gender, is_pregnant}
   * @returns {Object} 校验结果
   */
  SAFETY.check = function(herbs, patient) {
    var issues = [];
    var warnings = [];
    var herbNames = (herbs || []).map(function(h) { return h.name || h; });
    var patient = patient || {};

    // 十八反
    BAFAN.forEach(function(rule) {
      var main = rule[0], targets = rule[1], reason = rule[2];
      if (herbNames.some(function(n) { return n.includes(main); })) {
        targets.forEach(function(t) {
          if (herbNames.some(function(n) { return n.includes(t); })) {
            issues.push({ type: 'BAFAN', level: 'CRITICAL', herb1: main, herb2: t, reason: reason });
          }
        });
      }
    });

    // 十九畏
    JIEWEI.forEach(function(rule) {
      var main = rule[0], targets = rule[1], reason = rule[2];
      if (herbNames.some(function(n) { return n.includes(main); })) {
        targets.forEach(function(t) {
          if (herbNames.some(function(n) { return n.includes(t); })) {
            warnings.push({ type: 'JIEWEI', level: 'WARNING', herb1: main, herb2: t, reason: reason });
          }
        });
      }
    });

    // 妊娠禁忌
    if (patient.is_pregnant || patient.gender === 'female' && (patient.age || 0) >= 18 && (patient.age || 0) <= 50) {
      herbNames.forEach(function(n) {
        PREGNANCY_DISABLE.forEach(function(p) {
          if (n.includes(p)) issues.push({ type: 'PREGNANCY_DISABLE', level: 'CRITICAL', herb: n, reason: p + ' 妊娠期禁用' });
        });
        PREGNANCY_CAREFUL.forEach(function(p) {
          if (n.includes(p)) warnings.push({ type: 'PREGNANCY_CAREFUL', level: 'WARNING', herb: n, reason: p + ' 妊娠期慎用' });
        });
      });
    }

    // 剂量上限
    (herbs || []).forEach(function(h) {
      if (typeof h === 'object' && h.dose) {
        DOSE_LIMITS.forEach(function(dl) {
          if ((h.name || '').includes(dl.name) && h.dose > dl.max) {
            issues.push({ type: 'DOSE_EXCEED', level: 'CRITICAL', herb: h.name, dose: h.dose, max: dl.max, reason: dl.note });
          }
        });
      }
    });

    return {
      ok: issues.length === 0,
      issues: issues,
      warnings: warnings,
      critical_count: issues.length,
      warning_count: warnings.length,
      summary: issues.length === 0 
        ? (warnings.length > 0 ? '✅ 通过（有 ' + warnings.length + ' 条警告）' : '✅ 通过')
        : '❌ 严重禁忌 ' + issues.length + ' 条·禁止配药'
    };
  };

  // 暴露规则 (供调试/导出用)
  SAFETY.RULES = {
    BAFAN: BAFAN,
    JIEWEI: JIEWEI,
    PREGNANCY_DISABLE: PREGNANCY_DISABLE,
    PREGNANCY_CAREFUL: PREGNANCY_CAREFUL,
    DOSE_LIMITS: DOSE_LIMITS
  };
})();
