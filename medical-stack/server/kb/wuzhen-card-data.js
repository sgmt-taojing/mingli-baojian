/**
 * 五诊医学知识卡片库 V1.0
 * 依据《中医诊断学》九版教材 + 《中医眼诊学》+ 行业临床路径
 * 供前端 wuzhen-diagnosis.html / doctor-dashboard 实时调取
 */

const WUZHEN_KB = {
  face: {
    title: '面诊 · 五脏配五色',
    schema: ['明润', '晦暗', '潮红', '苍白', '萎黄', '黧黑'],
    rules: [
      { sign: '面色潮红', organ: '心/肝', pattern: '阴虚火旺/肝阳上亢', advice: '滋阴降火/平肝潜阳', confidence: 0.82 },
      { sign: '面色苍白', organ: '脾/肺', pattern: '气血两虚', advice: '益气补血，归脾汤主之', confidence: 0.85 },
      { sign: '面色萎黄', organ: '脾', pattern: '脾虚湿盛', advice: '健脾化湿，参苓白术散主之', confidence: 0.83 },
      { sign: '面色黧黑', organ: '肾', pattern: '肾阳虚', advice: '温补肾阳，金匮肾气丸主之', confidence: 0.80 },
      { sign: '两颊潮红', organ: '肝', pattern: '肝火上炎', advice: '清肝泻火，龙胆泻肝汤主之', confidence: 0.78 },
      { sign: '右颊潮红', organ: '肺', pattern: '肺热', advice: '清肺热，泻白散主之', confidence: 0.75 }
    ]
  },
  tongue: {
    title: '舌诊 · 寒热虚实',
    schema: ['淡白', '淡红', '红', '绛', '紫', '青'],
    rules: [
      { sign: '舌淡白胖大齿痕', pattern: '脾气虚', formula: '四君子汤', advice: '健脾益气', confidence: 0.85 },
      { sign: '舌红黄腻苔', pattern: '脾胃湿热', formula: '黄连温胆汤', advice: '清热化湿', confidence: 0.82 },
      { sign: '舌紫暗瘀斑', pattern: '血瘀', formula: '血府逐瘀汤', advice: '活血化瘀', confidence: 0.80 },
      { sign: '舌红少苔', pattern: '阴虚火旺', formula: '知柏地黄丸', advice: '滋阴降火', confidence: 0.85 }
    ]
  },
  eye: {
    title: '眼诊 · 五轮学说',
    schema: ['白睛黄染', '白睛红丝', '眼睑浮肿', '眼周暗沉', '黑眼圈', '瞳孔散大'],
    rules: [
      { sign: '白睛黄染', organ: '肝胆', pattern: '肝胆湿热', formula: '茵陈蒿汤', advice: '清热利湿退黄', confidence: 0.85 },
      { sign: '白睛红丝', organ: '肝', pattern: '肝火上炎', formula: '龙胆泻肝汤', advice: '清肝泻火', confidence: 0.82 },
      { sign: '眼袋浮肿', organ: '脾', pattern: '脾虚湿盛', formula: '参苓白术散', advice: '健脾化湿', confidence: 0.78 },
      { sign: '眼周青黑', organ: '肾', pattern: '肾虚', formula: '六味地黄丸', advice: '滋补肾阴', confidence: 0.80 },
      { sign: '白睛浑浊', organ: '肝肾', pattern: '肝肾阴虚', formula: '杞菊地黄丸', advice: '滋补肝肾', confidence: 0.79 }
    ]
  },
  lip: {
    title: '唇诊 · 气血津液',
    schema: ['淡红', '淡白', '苍白', '红', '绛红', '紫暗', '青紫', '干裂', '脱屑'],
    rules: [
      { sign: '唇色淡白', organ: '脾/心', pattern: '血虚', formula: '归脾汤', advice: '益气补血', confidence: 0.85 },
      { sign: '唇色苍白', organ: '脾', pattern: '失血/血脱', formula: '当归补血汤', advice: '急补气血', confidence: 0.88 },
      { sign: '唇色绛红', organ: '心/脾', pattern: '热盛伤津', formula: '清营汤', advice: '清热凉血养阴', confidence: 0.83 },
      { sign: '唇色紫暗', organ: '心/肝', pattern: '血瘀', formula: '血府逐瘀汤', advice: '活血化瘀', confidence: 0.84 },
      { sign: '唇色青紫', organ: '心', pattern: '心阳不振/心血瘀阻', formula: '瓜蒌薤白白酒汤', advice: '温通心阳，活血化瘀', confidence: 0.86 },
      { sign: '唇干裂', organ: '脾/肺', pattern: '津液亏虚', formula: '沙参麦冬汤', advice: '养阴生津', confidence: 0.81 },
      { sign: '唇脱屑', organ: '脾', pattern: '血虚风燥', formula: '当归饮子', advice: '养血润燥', confidence: 0.78 }
    ]
  },
  hand: {
    title: '手诊 · 掌色甲色',
    schema: ['淡红', '潮红', '苍白', '紫暗', '淡白', '黄'],
    rules: [
      { sign: '掌色潮红', organ: '心', pattern: '心火旺', formula: '导赤散', advice: '清心降火', confidence: 0.78 },
      { sign: '掌色苍白', organ: '脾/肺', pattern: '气血两虚', formula: '八珍汤', advice: '益气补血', confidence: 0.82 },
      { sign: '指甲苍白', organ: '肝', pattern: '肝血不足', formula: '四物汤', advice: '补血养肝', confidence: 0.80 },
      { sign: '指甲青紫', organ: '心/肺', pattern: '心血瘀阻/寒凝', formula: '血府逐瘀汤', advice: '温通活血', confidence: 0.81 },
      { sign: '杵状指', organ: '肺/心', pattern: '心肺气虚', formula: '补肺汤', advice: '补益心肺（建议影像学筛查）', confidence: 0.85 }
    ]
  }
};

const URGENCY_RULES = {
  P0: [
    'face:唇色樱红/胸痛/剧烈头痛/意识不清/呼吸困难',
    'eye:瞳孔不等大/白睛剧烈出血',
    'tongue:舌色紫暗+四肢厥冷'
  ],
  P1: [
    'lip:唇色苍白大量失血',
    'hand:杵状指（建议胸片/CT）',
    'eye:白睛黄染明显（肝功筛查）'
  ],
  P2: [
    'face:面色萎黄（脾胃调理）',
    'tongue:舌淡白齿痕（健脾）',
    'lip:唇色淡白（补血）'
  ]
};

module.exports = { WUZHEN_KB, URGENCY_RULES };