/**
 * 评估引擎: 黄金 case 集 + 4 维评分
 * 评分维度:
 *   - 主症匹配 (0.3)
 *   - 证型匹配 (0.4)
 *   - 方剂匹配 (0.2)
 *   - 置信度合理性 (0.1)
 */
const fs = require('fs');
const path = require('path');
const KB_DIR = path.join('server', 'kb');

// 加载黄金 case (兼容两种文件)
let GOLD_CASES = [];
// 优先 v3, 兜底 v2
const v3Path = path.join(KB_DIR, 'gold-cases-v3.js');
const v2Path = path.join(KB_DIR, 'gold-cases-v2.js');
if (fs.existsSync(v3Path)) {
  GOLD_CASES = require(path.resolve(v3Path));
} else if (fs.existsSync(v2Path)) {
  GOLD_CASES = require(path.resolve(v2Path));
} else {
  // 兜底
  GOLD_CASES = [
    { case_id: 'G001', complaint: '失眠', expected: { syndrome: '心脾两虚', formula: '归脾汤' } },
    { case_id: 'G002', complaint: '胃痛', expected: { syndrome: '肝胃不和', formula: '柴胡疏肝散' } },
    { case_id: 'G003', complaint: '头痛', expected: { syndrome: '肝阳上亢', formula: '天麻钩藤饮' } },
    { case_id: 'G004', complaint: '咳嗽', expected: { syndrome: '风寒袭肺', formula: '止嗽散' } },
    { case_id: 'G005', complaint: '心悸', expected: { syndrome: '心气虚', formula: '炙甘草汤' } }
  ];
}

function evaluate(Engine) {
  const results = [];
  for (const c of GOLD_CASES) {
    const r = Engine.diagnose(c.complaint, c.symptoms || []);
    if (!r || !r.ok) {
      results.push({ case_id: c.case_id, score: 0, pass: false, error: 'no result' });
      continue;
    }
    
    let score = 0;
    // 1. 主症匹配 (0.3)
    if (r.complaint === c.complaint) score += 0.3;
    
    // 2. 证型匹配 (0.4) - 检查 primary 或 differential
    const expectedSyndrome = c.expected?.syndrome || c.expected_syndrome;
    if (r.primary_syndrome.syndrome === expectedSyndrome) {
      score += 0.4;
    } else if (r.differential && r.differential.some(d => d.syndrome === expectedSyndrome)) {
      score += 0.3;
    }

    // 3. 方剂匹配 (0.2)
    const expectedFormula = c.expected?.formula || c.expected_formula;
    const allFormulas = [r.primary_formula.formula, ...(r.formula_options || []).map(o => o.formula)];
    if (allFormulas.includes(expectedFormula)) {
      score += 0.2;
    }
    
    // 4. 置信度合理性 (0.1) - 不为 0/1 极端
    const conf = r.confidence || (r.primary_syndrome && r.primary_syndrome.confidence) || 0.5;
    if (conf > 0.3 && conf < 0.99) score += 0.1;
    
    results.push({
      case_id: c.case_id,
      difficulty: c.difficulty || 'medium',
      complaint: c.complaint,
      expected: c.expected,
      matched: {
        syndrome: r.primary_syndrome.syndrome,
        formula: r.primary_formula.formula,
        confidence: r.confidence
      },
      score: Math.round(score * 100) / 100,
      pass: score >= 0.7
    });
  }
  
  const total = results.length;
  const avg = results.reduce((s, r) => s + r.score, 0) / total;
  const pass = results.filter(r => r.pass).length;
  
  return {
    ok: true,
    total,
    avg_score: Math.round(avg * 100) / 100,
    pass_rate: Math.round(pass / total * 100) / 100,
    pass,
    fail: total - pass,
    results
  };
}

function getGoldCases() {
  return GOLD_CASES;
}

module.exports = { evaluate, evalAll: evaluate, getGoldCases };

// CLI
if (require.main === module) {
  const Engine = require('./inhouse-model.js');
  const r = evaluate(Engine);
  console.log(`═══ 评估结果 ═══`);
  console.log(`总计: ${r.total}, 平均分: ${r.avg_score}, 通过率: ${r.pass_rate}`);
  console.log(`通过: ${r.pass}/${r.total}`);
  console.log('');
  r.results.forEach(rr => {
    const m = rr.pass ? '✅' : '❌';
    console.log(`${m} ${rr.case_id} ${rr.complaint} ${rr.score} 预期:${rr.expected.syndrome}/${rr.expected.formula} | 命中:${rr.matched.syndrome}/${rr.matched.formula}`);
  });
}
