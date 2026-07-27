/* ================================================================
 * R89 合规模块：禁用词拦截 + 免责声明统一注入 + KB 源标签提取
 * 引用：综合术数智能体.docx §合规管控库 + §多流派运行原则
 * 调用入口：
 *   const c = applyCompliance(reportText);
 *   text = c.text;          // 清洗后的报告文本（已含免责声明）
 *   hits = c.hits;          // 拦截记录 [{label,sample,replaced}]
 *   const t = extractSchoolTags(text);
 *   tags = t.tags;          // [{tag,cls}] 用于顶部显著标注
 * ============================================================== */

// R89-P0-2: 合规禁用词清单（综合术数智能体.docx §合规管控库）
// 严禁出现在报告里的恐吓、绝对化、医疗替代、财务恐吓、生命恐吓等表述
const COMPLIANCE_FORBIDDEN = [
  // —— 绝对化（违反"非全称判断"）——
  { rx: /必定(?:升官|发财|大富大贵|大富|大贵|大灾|大难)/g, label: '绝对化-必定大富大贵/大灾', repl: '有较大可能（仍需努力）' },
  { rx: /注定(?:要|会).{0,6}(?:大富|大贵|大灾|大难|死|病|穷|败)/g, label: '绝对化-注定大富/大灾', repl: '命理倾向提示' },
  { rx: /百分百(?:会|要)?/g,                  label: '绝对化-百分百',     repl: '有较大可能' },
  { rx: /百分之百/g,                          label: '绝对化-百分之百',   repl: '有较大可能' },
  { rx: /一定(?:会|要)?(?:死|大凶|大难|破产)/g, label: '绝对化-一定会大凶', repl: '需注意防范' },
  { rx: /一定会(?:死|灾|病|穷|败|输)/g,        label: '绝对化-一定会灾',   repl: '需注意防范' },
  // —— 恐吓-生命 ——（docx 强制禁区）
  { rx: /血光之灾/g,                          label: '恐吓-血光之灾',     repl: '需注意安全防范' },
  { rx: /必死/g,                              label: '恐吓-必死',         repl: '需特别留意健康' },
  { rx: /必有大(?:难|灾|祸)/g,                 label: '恐吓-必有大难/灾/祸', repl: '宜谨慎行事' },
  { rx: /活不过.?\d{1,2}岁/g,                  label: '恐吓-活不过X岁',    repl: '需注重健康养生' },
  { rx: /短命/g,                              label: '恐吓-短命',         repl: '需要特别注意健康' },
  // —— 恐吓-婚姻 ——（docx 强制禁区"克夫/克妻/克子/克父母"）
  { rx: /克夫/g,                              label: '恐吓-克夫',         repl: '与配偶多沟通包容' },
  { rx: /克妻/g,                              label: '恐吓-克妻',         repl: '与配偶多沟通包容' },
  { rx: /克子/g,                              label: '恐吓-克子',         repl: '与子女多沟通包容' },
  { rx: /克父母/g,                            label: '恐吓-克父母',       repl: '与家人多沟通包容' },
  { rx: /克兄/g,                              label: '恐吓-克兄',         repl: '与兄弟姐妹多沟通' },
  // —— 恐吓-财务 ——
  { rx: /必破财/g,                            label: '恐吓-必破财',       repl: '需注意理财稳健' },
  { rx: /必破产/g,                            label: '恐吓-必破产',       repl: '建议稳健经营/合理配置资产' },
  { rx: /穷困潦倒/g,                          label: '恐吓-穷困潦倒',     repl: '需稳扎稳打逐步积累' },
  // —— 医疗诊断替代（保留原文：需在末尾追加 "（诊断需结合现代医学）" 提示，不直接替换措辞）
  // 用户指令 2026-07-27：医疗诊断替代原文保留，仅以诊断建议点明需结合现代医学
  { rx: /包治/g,                              label: '医疗诊断替代',      repl: '包治（诊断需结合现代医学）', keepOriginal: true },
  { rx: /根治/g,                              label: '医疗诊断替代',      repl: '根治（诊断需结合现代医学）', keepOriginal: true },
  { rx: /断根/g,                              label: '医疗诊断替代',      repl: '断根（诊断需结合现代医学）', keepOriginal: true },
  { rx: /吃了(?:就|一定).{0,4}好/g,            label: '医疗诊断替代',      repl: '吃了就好（诊断需结合现代医学）', keepOriginal: true },
  { rx: /不需要(?:看医生|就医|吃药)/g,         label: '医疗诊断替代',      repl: '不需要看医生（诊断需结合现代医学）', keepOriginal: true },
];

// R89-P0-3: 统一免责声明（docx §合规管控库）
const COMPLIANCE_DISCLAIMER = '⚠️ 免责声明：本报告基于传统命理学理论，仅供国学文化学习与娱乐参考，不构成医疗、理财、法律或任何专业建议。命由天定，运由己造，人生的最终走向取决于您的选择与努力。';

// R89-P2-1: KB 来源流派标签（docx §多流派运行原则：必须显著标注本次推演所采流派）
// 调整 2026-07-27：找不到古籍原文支撑时，不用奉强附会去找古书佐证，
// 直接选用行业公认通行版本；此处独立标注 📚 行业通行 标签
const KB_SCHOOL_TAGS = [
  { rx: /倪海厦|倪师|人纪|天纪/g,            tag: '📘 倪海厦',     cls: 'tag-nihaisha' },
  { rx: /舒晗|舒晗天纪|奇门校正|密宗天纪/g, tag: '🎯 舒晗',       cls: 'tag-shuhan'   },
  { rx: /路大师|路氏一脉|朱鹊桥|段建业/g,   tag: '🌟 路大师',     cls: 'tag-lu'       },
  // 古籍原文：仅当可验证原文出处时打标（避免率强附会）
  { rx: /古籍|古书|经典|黄帝内经|伤寒论|神农本草|子平|渊海子平|三命通会|滴天髓|穷通宝鉴/g, tag: '📜 古籍', cls: 'tag-classic' },
  // R89-P1-4-2：行业通行（2026-07-27 用户指令）
  // 原则：找不到原版古籍原文支撑某一说时，不用率强附会去找古书佐证，
  // 直接选用行业公认通行版本，并在推演结论上方显著标注此标签。
  { rx: /行业通行|通用规则|常规断法|约定俗成|通行断法|一般认为|传统上|传统观点|通常认为/g, tag: '📚 行业通行', cls: 'tag-common' },
];

// R89-P1-4-2：多流派推演调优原则（2026-07-27 群中 738342 反馈）
//   1. 古籍原文支撑 → 标注「📜 古籍」
//   2. 找不到古籍原文 → 不率强附会，直接选用行业公认通行版本 + 标注「📚 行业通行」
//   3. 专家观点（倪海厦/舒晗/路大师） → 标注对应名字
//   4. 同行实践验证（多位老师同法） → 标注「🎯 同行验证」
//   5. 单点孤证 → 不列为主推结论，仅作备选提示
const KB_SOURCE_POLICY = {
  CLASSIC: 'classic',      // 古籍原文验证
  EXPERT: 'expert',        // 专家观点（倪/舒晗/路）
  COMMON: 'common',        // 行业公认通行版（不率强附会）
  PEER: 'peer',            // 同行实践验证
  SOLITARY: 'solitary',    // 单点孤证（备选提示）
};
const KB_SOURCE_LABEL = {
  classic:   '📜 古籍',
  expert:    '🎯 专家',
  common:    '📚 行业通行',
  peer:      '🎯 同行验证',
  solitary:  '⚠️ 单点孤证',
};
// 原则函数：决定一条知识条该贴哪个源标签
// 入参：kbEntry = { src_type, src_id, title, content }
// 返回：{ tag, cls, reason }
function resolveSourceLabel(kbEntry) {
  if (!kbEntry) return { tag: KB_SOURCE_LABEL.common, cls: 'tag-common', reason: '默认行业通行' };
  const t = (kbEntry.src_type || '').toUpperCase();
  const author = (kbEntry.author || '').trim();
  // 古籍原文：能验证原文出处的
  if (t === 'SRC-BOOK' || t === 'SRC-LEGACY') {
    return { tag: KB_SOURCE_LABEL.classic, cls: 'tag-classic', reason: '古籍/书谱原文' };
  }
  // 专家观点
  if (author.includes('倪海厦') || author.includes('倪师')) {
    return { tag: '📘 倪海厦', cls: 'tag-nihaisha', reason: '倪师实践观点' };
  }
  if (author.includes('舒晗')) {
    return { tag: '🎯 舒晗', cls: 'tag-shuhan', reason: '舒晗老师体系' };
  }
  if (author.includes('路') || author.includes('朱鸽桥') || author.includes('段建业')) {
    return { tag: '🌟 路大师', cls: 'tag-lu', reason: '路氏一脉' };
  }
  // 课程/口传 · 同行实践验证
  if (t === 'SRC-COURSE' || t === 'SRC-EXPERT') {
    return { tag: KB_SOURCE_LABEL.peer, cls: 'tag-peer', reason: '课程口传/同行验证' };
  }
  // 其他：行业通行（默认兜底）
  return { tag: KB_SOURCE_LABEL.common, cls: 'tag-common', reason: '未验证古籍原文，选行业通行' };
}

// =========== 主函数 ===========

/**
 * 对报告文本进行合规清洗
 * @param {string} text - 原始报告文本
 * @returns {{text:string, hits:Array}}
 *   - text: 已替换禁用词 + 末尾追加统一免责声明
 *   - hits: 被拦截的记录 [{label, sample, replaced}]
 */
function applyCompliance(text) {
  if (typeof text !== 'string') return { text: '', hits: [] };
  const hits = [];
  let out = text;
  for (const r of COMPLIANCE_FORBIDDEN) {
    r.rx.lastIndex = 0;
    if (r.rx.test(out)) {
      const m = out.match(r.rx);
      const sample = m && m[0] || '';
      hits.push({ label: r.label, sample: sample, replaced: r.repl });
      out = out.replace(r.rx, r.repl);
    }
  }
  // 末尾统一注入免责声明（已存在则跳过）
  if (!/⚠️ 免责声明/.test(out)) {
    out = out.replace(/\s*$/, '') + '\n\n' + COMPLIANCE_DISCLAIMER;
  }
  return { text: out, hits };
}

/**
 * 提取报告中涉及的流派/学派标签（顶部显著标注用）
 * @param {string} text
 * @returns {{tags:Array, text:string}} tags=[{tag,cls}]
 */
function extractSchoolTags(text) {
  if (typeof text !== 'string') return { tags: [], text };
  const tags = [];
  for (const t of KB_SCHOOL_TAGS) {
    t.rx.lastIndex = 0;
    if (t.rx.test(text)) tags.push(t);
  }
  return { tags, text };
}

// 浏览器 / Node 双环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    COMPLIANCE_FORBIDDEN,
    COMPLIANCE_DISCLAIMER,
    KB_SCHOOL_TAGS,
    applyCompliance,
    extractSchoolTags,
  };
}
if (typeof window !== 'undefined') {
  window.Compliance = {
    COMPLIANCE_FORBIDDEN,
    COMPLIANCE_DISCLAIMER,
    KB_SCHOOL_TAGS,
    applyCompliance,
    extractSchoolTags,
  };
}