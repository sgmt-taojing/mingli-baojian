/**
 * 命理宝鉴·医道 · 古籍原文引用引擎
 * 为每方剂/证型附经典出处+原文
 */
const CLASSICS_KB = {
  formulas: {
    '桂枝汤': { source: '《伤寒论》·辨太阳病脉证并治上', text: '太阳中风，阳浮而阴弱。阳浮者，热自发；阴弱者，汗自出。啬啬恶寒，淅淅恶风，翕翕发热，鼻鸣干呕者，桂枝汤主之。' },
    '麻黄汤': { source: '《伤寒论》·辨太阳病脉证并治中', text: '太阳病，头痛发热，身疼腰痛，骨节疼痛，恶风，无汗而喘者，麻黄汤主之。' },
    '小柴胡汤': { source: '《伤寒论》·辨少阳病脉证并治', text: '伤寒五六日，中风，往来寒热，胸胁苦满，嘿嘿不欲饮食，心烦喜呕，或胸中烦而不呕，或渴，或腹中痛，或胁下痞硬……小柴胡汤主之。' },
    '归脾汤': { source: '《正体类要》', text: '归脾汤治心脾两虚，气血不足，心悸健忘，失眠多梦，发热体倦，食少不眠，舌质淡，苔薄白，脉细弱。' },
    '六味地黄丸': { source: '《小儿药证直诀》', text: '治肾怯失音，囟开不合，神不足，目中白睛多，面色㿠白。' },
    '四君子汤': { source: '《太平惠民和剂局方》', text: '荣卫气虚，脏腑怯弱。心腹胀满，全不思食，肠鸣泄泻，呕哕吐逆，大宜服之。' },
    '四物汤': { source: '《仙授理伤续断秘方》', text: '补益气血，调和营卫。凡伤重肠内有瘀血者用之。' },
    '八珍汤': { source: '《正体类要》', text: '气血两虚。面色苍白或萎黄，头晕目眩，四肢倦怠，气短懒言，心悸怔忡，饮食减少，舌淡苔薄白，脉细弱或虚大无力。' },
    '金匮肾气丸': { source: '《金匮要略》', text: '崔氏八味丸：治脚气上入，少腹不仁。' },
    '温胆汤': { source: '《三因极一病证方论》', text: '治大病后虚烦不得眠，此胆寒故也，此汤主之。又治惊悸。' },
    '二陈汤': { source: '《太平惠民和剂局方》', text: '治痰饮为患，或呕吐恶心，或头眩心悸，或中脘不快，或发为寒热，或因食生冷，脾胃不和。' },
    '血府逐瘀汤': { source: '《医林改错》', text: '头痛者，无表证，无里证，无气虚痰饮等证，忽犯忽好，百方不效，用此方一剂而愈。' },
    '藿香正气散': { source: '《太平惠民和剂局方》', text: '治伤寒头疼，憎寒壮热，上喘咳嗽，五劳七伤，八般风痰，五般膈气，心腹冷痛，反胃呕恶，气泻霍乱，脏腑虚鸣，山岚瘴疟，遍身虚肿。' }
  },
  syndromes: {
    '风寒表证': { source: '《伤寒论》', text: '太阳病，或已发热，或未发热，必恶寒，体痛，呕逆，脉阴阳俱紧者，名为伤寒。' },
    '风热表证': { source: '《温病条辨》', text: '太阴风温、温热、温疫、冬温，初起恶风寒者，桂枝汤主之。但热不恶寒而渴者，辛凉平剂银翘散主之。' },
    '气虚': { source: '《素问》', text: '气虚则肩背痛寒，少气不足以息。' },
    '阴虚': { source: '《素问》', text: '阴虚则内热。' },
    '血虚': { source: '《血证论》', text: '血虚则发热' },
    '心脾两虚': { source: '《济生方》', text: '归脾汤治思虑过度，劳伤心脾，健忘怔忡。' },
    '肝郁': { source: '《临证指南医案》', text: '肝为将军之官，谋虑出焉，故郁怒而不解则伤肝。' }
  }
};

function lookupFormula(name) {
  return CLASSICS_KB.formulas[name] || null;
}
function lookupSyndrome(name) {
  return CLASSICS_KB.syndromes[name] || null;
}
function enrichWithClassics(diagnosisResult) {
  if (!diagnosisResult) return diagnosisResult;
  if (diagnosisResult.matched_syndrome) {
    const cls = lookupSyndrome(diagnosisResult.matched_syndrome);
    if (cls) diagnosisResult.classic_source = cls;
  }
  if (diagnosisResult.formula || diagnosisResult.matched_formula) {
    const name = diagnosisResult.formula || diagnosisResult.matched_formula;
    const cls = lookupFormula(name);
    if (cls) diagnosisResult.formula_classic = cls;
  }
  return diagnosisResult;
}

module.exports = { CLASSICS_KB, lookupFormula, lookupSyndrome, enrichWithClassics };
