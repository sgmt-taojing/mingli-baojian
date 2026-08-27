/**
 * 命理宝鉴·医道 · 个性化剂量引擎 v1.0
 * 体重+体质+合并症+年龄+肝肾功能 → 剂量调整
 */
const ADULT_BASE = { min: 1, max: 30 }; // g/味
const CHILD_BASE = { min: 1, max: 10 };

/**
 * 计算个性化剂量
 * @param {object} input
 *   - baseDose: 基础剂量(g)
 *   - weight: 体重(kg)
 *   - age: 年龄
 *   - constitution: 体质（气虚/阴虚/阳虚/痰湿/湿热/血瘀/气郁/特禀/平和）
 *   - comorbidities: 合并症 array
 *   - pregnancy: 是否孕妇
 *   - child: 是否儿童
 *   - hepatic: 肝功能不全
 *   - renal: 肾功能不全
 */
function calcDosage(input) {
  const factors = [];
  let dose = input.baseDose || 10;
  const baseReason = `基础剂量 ${dose}g`;
  
  // 1. 体重调整
  if (input.weight) {
    const standardWeight = 60;
    const ratio = input.weight / standardWeight;
    if (ratio < 0.5 || ratio > 1.5) {
      dose = dose * ratio;
      factors.push({ factor: '体重', adjustment: ratio.toFixed(2), note: `体重${input.weight}kg vs 标准${standardWeight}kg` });
    }
  }
  
  // 2. 年龄调整
  if (input.age !== undefined) {
    if (input.age < 14) {
      dose = dose * (input.age / 14);
      factors.push({ factor: '儿童', adjustment: (input.age/14).toFixed(2), note: `${input.age}岁儿童·剂量比例 ${(input.age/14).toFixed(2)}` });
    } else if (input.age > 70) {
      dose = dose * 0.7;
      factors.push({ factor: '老年', adjustment: '0.70', note: '70岁以上·剂量减至70%' });
    }
  }
  
  // 3. 体质调整
  const constitutionMap = {
    '气虚': 1.2, '阳虚': 1.2, '阴虚': 0.9, '痰湿': 0.85, '湿热': 0.9,
    '血瘀': 1.1, '气郁': 1.0, '特禀': 0.7, '平和': 1.0
  };
  if (input.constitution && constitutionMap[input.constitution]) {
    const adj = constitutionMap[input.constitution];
    dose = dose * adj;
    factors.push({ factor: '体质', adjustment: adj.toFixed(2), note: `${input.constitution}体质` });
  }
  
  // 4. 合并症
  const comorbidityAdjust = {
    '高血压': 0.85, '糖尿病': 0.9, '心脏病': 0.85, '肝硬化': 0.6, '肾衰': 0.5,
    '甲亢': 0.85, '胃溃疡': 0.8, '哮喘': 0.9
  };
  if (input.comorbidities) {
    for (const c of input.comorbidities) {
      if (comorbidityAdjust[c]) {
        dose = dose * comorbidityAdjust[c];
        factors.push({ factor: '合并症', adjustment: comorbidityAdjust[c].toFixed(2), note: c });
      }
    }
  }
  
  // 5. 妊娠
  if (input.pregnancy) {
    dose = dose * 0.5;
    factors.push({ factor: '妊娠', adjustment: '0.50', note: '孕妇·剂量减半+医师审核' });
  }
  
  // 6. 肝肾
  if (input.hepatic) { dose = dose * 0.6; factors.push({ factor: '肝功能', adjustment: '0.60', note: '肝功能不全' }); }
  if (input.renal) { dose = dose * 0.5; factors.push({ factor: '肾功能', adjustment: '0.50', note: '肾功能不全' }); }
  
  // 7. 边界
  dose = Math.max(1, Math.min(30, Math.round(dose * 10) / 10));
  
  return {
    ok: true,
    base_dose: input.baseDose || 10,
    final_dose: dose,
    factors,
    adjustment_summary: `基础${input.baseDose || 10}g × ${factors.length}项调整 = ${dose}g`,
    safety: dose < 3 ? '极小剂量·请医师确认' : dose > 25 ? '高剂量·请医师确认' : '常规剂量',
    timestamp: new Date().toISOString()
  };
}

module.exports = { calcDosage };
