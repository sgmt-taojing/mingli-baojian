/**
 * tcm-famous-formulas-kb.js — 总索引 + 搜索方法
 * ====================================================================
 * R50 拆分后本文件只保留：
 *   · 版本信息
 *   · formulaCategories（方剂分类索引）
 *   · 5 个搜索工具函数
 *
 * 数据已拆分到 3 个独立子模块（均往 window.TCM_FAMOUS_FORMULAS_KB 合并属性）：
 *   · tcm-doctors-kb.js   — 历代名医（56位）
 *   · tcm-formulas-kb.js  — 经典名方（108首）
 *   · tcm-classics-kb.js  — 医学典籍（24部）
 *
 * 加载顺序：先子模块 → 最后本文件（添加方法）
 * ====================================================================
 */
window.TCM_FAMOUS_FORMULAS_KB = window.TCM_FAMOUS_FORMULAS_KB || {};

window.TCM_FAMOUS_FORMULAS_KB.version = '2.0';
window.TCM_FAMOUS_FORMULAS_KB.description = '历代名医名方与医学典籍知识库（R50 拆分版）';

// ═══════════════════════════════════════════
// 方剂分类索引
// ═══════════════════════════════════════════
window.TCM_FAMOUS_FORMULAS_KB.formulaCategories = {
  '解表剂': ['麻黄汤','桂枝汤','银翘散','桑菊饮','九味羌活汤','防风通圣散'],
  '清热剂': ['白虎汤','黄连解毒汤','龙胆泻肝汤','清胃散','葛根芩连汤','普济消毒饮','导赤散','泻白散','苇茎汤','达原饮'],
  '泻下剂': ['大承气汤','温脾汤'],
  '和解剂': ['小柴胡汤','逍遥散','半夏泻心汤'],
  '温里剂': ['理中丸','四逆汤','当归四逆汤','阳和汤','实脾饮'],
  '补益剂': ['四君子汤','参苓白术散','补中益气汤','四物汤','归脾汤','六味地黄丸','肾气丸','左归丸','右归丸','炙甘草汤','生脉散','玉屏风散','大补阴丸'],
  '安神剂': ['酸枣仁汤','天王补心丹','甘麦大枣汤'],
  '开窍剂': ['安宫牛黄丸'],
  '理气剂': ['越鞠丸','半夏厚朴汤','枳实薤白桂枝汤','苏子降气汤'],
  '理血剂': ['血府逐瘀汤','补阳还五汤','十灰散','小蓟饮子','桂枝茯苓丸'],
  '祛湿剂': ['平胃散','藿香正气散','三仁汤','茵陈蒿汤','五苓散','真武汤','独活寄生汤','实脾散'],
  '祛痰剂': ['二陈汤','温胆汤','半夏白术天麻汤'],
  '消食剂': ['保和丸','健脾丸'],
  '治风剂': ['川芎茶调散','镇肝熄风汤','天麻钩藤饮'],
  '治燥剂': ['杏苏散','清燥救肺汤','百合固金汤','增液汤'],
  '固涩剂': ['四神丸','完带汤']
};

// ═══════════════════════════════════════════
// 搜索工具函数
// ═══════════════════════════════════════════
window.TCM_FAMOUS_FORMULAS_KB.searchDoctors = function(keyword) {
  var kb = window.TCM_FAMOUS_FORMULAS_KB;
  return (kb.doctors || []).filter(function(d) {
    return d.name.indexOf(keyword) >= 0 ||
           d.era.indexOf(keyword) >= 0 ||
           d.title.indexOf(keyword) >= 0 ||
           d.specialties.some(function(s) { return s.indexOf(keyword) >= 0; });
  });
};

window.TCM_FAMOUS_FORMULAS_KB.searchFormulas = function(keyword) {
  var kb = window.TCM_FAMOUS_FORMULAS_KB;
  return (kb.formulas || []).filter(function(f) {
    return f.name.indexOf(keyword) >= 0 ||
           f.efficacy.indexOf(keyword) >= 0 ||
           f.indications.indexOf(keyword) >= 0 ||
           f.source.indexOf(keyword) >= 0;
  });
};

window.TCM_FAMOUS_FORMULAS_KB.getFormulasByCategory = function(category) {
  var kb = window.TCM_FAMOUS_FORMULAS_KB;
  return (kb.formulas || []).filter(function(f) { return f.category === category; });
};

window.TCM_FAMOUS_FORMULAS_KB.getDoctorByName = function(name) {
  var kb = window.TCM_FAMOUS_FORMULAS_KB;
  return (kb.doctors || []).find(function(d) { return d.name === name; });
};

window.TCM_FAMOUS_FORMULAS_KB.getFormulaByName = function(name) {
  var kb = window.TCM_FAMOUS_FORMULAS_KB;
  return (kb.formulas || []).find(function(f) { return f.name === name; });
};
