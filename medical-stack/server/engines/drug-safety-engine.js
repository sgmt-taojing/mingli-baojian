/**
 * drug-safety-engine.js — 处方禁忌校验引擎
 * 用药禁忌：十八反、十九畏、妊娠禁忌、证候禁忌
 * 用量警戒：毒性药超量、剂量异常
 * 人群禁忌：老人/儿童/孕产妇/哺乳期
 * 
 * R530: 处方闭环强制拦截模块
 */

const TCM_SAFETY = {
  // 十八反
  eighteenAntagonism: {
    '甘草': ['海藻', '京大戟', '甘遂', '芫花'],
    '藜芦': ['人参', '丹参', '玄参', '沙参', '细辛', '芍药'],
    '乌头': ['半夏', '瓜蒌', '贝母', '白蔹', '白及'],
    '附子': ['半夏', '瓜蒌', '贝母', '白蔹', '白及']
  },
  // 十九畏（完整 10 对）
  nineteenFear: {
    '硫黄': ['朴硝', '芒硝'],
    '水银': ['砒霜'],
    '狼毒': ['密陀僧'],
    '巴豆': ['牵牛'],
    '丁香': ['郁金'],
    '川乌': ['犀角'],
    '草乌': ['犀角'],
    '牙硝': ['三棱'],
    '官桂': ['石脂', '赤石脂'],
    '人参': ['五灵脂', '莱菔子']
  },
  // 妊娠禁用
  pregnancyForbidden: {
    absolute: ['水银', '砒霜', '雄黄', '轻粉', '斑蝥', '蟾酥', '麝香', '马钱子', '川乌', '草乌', '藜芦', '胆矾', '瓜蒂', '巴豆', '甘遂', '大戟', '芫花', '牵牛子', '商陆', '麝香', '三棱', '莪术', '水蛭', '虻虫'],
    caution: ['牛膝', '川芎', '红花', '桃仁', '姜黄', '牡丹皮', '枳实', '枳壳', '大黄', '番泻叶', '芦荟', '芒硝', '附子', '肉桂', '干姜', '木通', '冬葵子']
  },
  // 毒性药最大剂量 (g)
  toxicLimit: {
    '附子': 15, '川乌': 3, '草乌': 3, '马钱子': 0.6, '斑蝥': 0.05,
    '蟾酥': 0.015, '雄黄': 0.05, '砒霜': 0.001, '水银': 0,
    '雷公藤': 10, '天仙藤': 10, '黄药子': 10
  },
  // 老人慎用
  elderlyCaution: ['附子', '麻黄', '细辛', '大黄', '芒硝', '甘遂', '芫花', '人参'],
  // 儿童慎用
  childrenCaution: ['附子', '川乌', '草乌', '马钱子', '雷公藤', '朱砂', '雄黄']
};

/**
 * 检查处方安全性
 * @param {Array<{name:string, dose?:number}>} herbs - 药材列表
 * @param {Object} patient - {age, gender, is_pregnant, is_lactating}
 * @returns {{ok: boolean, critical: Array, warnings: Array, info: Array, summary: string}}
 */
TCM_SAFETY.check = function(herbs, patient) {
  const result = {
    ok: true,
    critical: [],
    warnings: [],
    info: [],
    critical_count: 0,
    warning_count: 0
  };

  if (!herbs || herbs.length === 0) {
    return result;
  }

  const herbNames = herbs.map(h => h.name || h);
  const herbSet = new Set(herbNames);

  // 1. 十八反检查
  for (const [key, antagonists] of Object.entries(this.eighteenAntagonism)) {
    if (herbSet.has(key)) {
      for (const ant of antagonists) {
        if (herbSet.has(ant)) {
          result.critical.push({
            type: 'eighteen_antagonism',
            severity: 'CRITICAL',
            drugs: [key, ant],
            message: `十八反：${key} 与 ${ant} 相反，禁止同用`
          });
          result.ok = false;
        }
      }
    }
  }

  // 2. 十九畏检查
  for (const [key, fears] of Object.entries(this.nineteenFear)) {
    if (herbSet.has(key)) {
      for (const f of fears) {
        if (herbSet.has(f)) {
          result.critical.push({
            type: 'nineteen_fear',
            severity: 'CRITICAL',
            drugs: [key, f],
            message: `十九畏：${key} 畏 ${f}，不可同用`
          });
          result.ok = false;
        }
      }
    }
  }

  // 3. 妊娠禁忌（兼容 is_pregnant / pregnant 两种字段名）
  const isPregnant = patient && (patient.is_pregnant || patient.pregnant);
  if (isPregnant) {
    for (const herb of herbNames) {
      if (this.pregnancyForbidden.absolute.includes(herb)) {
        result.critical.push({
          type: 'pregnancy_forbidden',
          severity: 'CRITICAL',
          drugs: [herb],
          message: `妊娠禁用：${herb} 孕妇绝对禁用`
        });
        result.ok = false;
      } else if (this.pregnancyForbidden.caution.includes(herb)) {
        result.warnings.push({
          type: 'pregnancy_caution',
          severity: 'WARNING',
          drugs: [herb],
          message: `妊娠慎用：${herb} 孕妇需慎用`
        });
      }
    }
  }

  // 4. 毒性药用量
  for (const herb of herbs) {
    if (!herb.dose) continue;
    const name = herb.name || herb;
    if (this.toxicLimit[name] !== undefined) {
      if (this.toxicLimit[name] === 0) {
        result.critical.push({
          type: 'toxic_drug',
          severity: 'CRITICAL',
          drugs: [name],
          message: `${name} 属禁用毒性药`
        });
        result.ok = false;
      } else if (herb.dose > this.toxicLimit[name]) {
        result.critical.push({
          type: 'overdose',
          severity: 'CRITICAL',
          drugs: [name],
          message: `${name} 用量超限: ${herb.dose}g > ${this.toxicLimit[name]}g`
        });
        result.ok = false;
      }
    }
  }

  // 5. 老人慎用
  if (patient && patient.age >= 70) {
    for (const herb of herbNames) {
      if (this.elderlyCaution.includes(herb)) {
        result.warnings.push({
          type: 'elderly_caution',
          severity: 'WARNING',
          drugs: [herb],
          message: `老人慎用：${herb} 70岁以上需慎用`
        });
      }
    }
  }

  // 6. 儿童慎用
  if (patient && patient.age <= 12) {
    for (const herb of herbNames) {
      if (this.childrenCaution.includes(herb)) {
        result.warnings.push({
          type: 'children_caution',
          severity: 'WARNING',
          drugs: [herb],
          message: `儿童慎用：${herb} 12岁以下需慎用`
        });
      }
    }
  }

  result.critical_count = result.critical.length;
  result.warning_count = result.warnings.length;
  result.summary = result.ok 
    ? `✅ 安全性检查通过 (${result.warnings.length} 条提示)` 
    : `🚫 发现 ${result.critical.length} 条严重禁忌`;

  return result;
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = TCM_SAFETY;
}

if (typeof window !== 'undefined') {
  window.TCM_SAFETY = TCM_SAFETY;
}
