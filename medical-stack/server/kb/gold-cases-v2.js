// 黄金 case 集 (主症 → 期望证型 → 期望方剂)
const GOLD_CASES = [
  // 失眠 (5)
  { case_id: 'G001', complaint: '失眠', expected: { syndrome: '心脾两虚', formula: '归脾汤' } },
  { case_id: 'G006', complaint: '失眠', symptoms: ['心烦', '口苦'], expected: { syndrome: '肝郁化火', formula: '龙胆泻肝汤' } },
  { case_id: 'G007', complaint: '失眠', symptoms: ['盗汗', '五心烦热'], expected: { syndrome: '阴虚火旺', formula: '知柏地黄丸' } },
  { case_id: 'G008', complaint: '失眠', symptoms: ['心悸', '健忘'], expected: { syndrome: '心脾两虚', formula: '归脾汤' } },
  { case_id: 'G009', complaint: '失眠', symptoms: ['痰多', '胸闷'], expected: { syndrome: '痰热内扰', formula: '黄连温胆汤' } },
  // 头痛 (3)
  { case_id: 'G003', complaint: '头痛', expected: { syndrome: '肝阳上亢', formula: '天麻钩藤饮' } },
  { case_id: 'G010', complaint: '头痛', symptoms: ['遇风加重', '项强'], expected: { syndrome: '风寒袭络', formula: '川芎茶调散' } },
  { case_id: 'G011', complaint: '头痛', symptoms: ['心悸', '面色苍白'], expected: { syndrome: '血虚不荣', formula: '四物汤' } },
  // 胃痛 (3)
  { case_id: 'G002', complaint: '胃痛', expected: { syndrome: '肝胃不和', formula: '柴胡疏肝散' } },
  { case_id: 'G012', complaint: '胃痛', symptoms: ['喜暖喜按', '空腹痛甚'], expected: { syndrome: '脾胃虚寒', formula: '黄芪建中汤' } },
  { case_id: 'G013', complaint: '胃痛', symptoms: ['口干', '舌红少苔'], expected: { syndrome: '胃阴不足', formula: '一贯煎' } },
  // 咳嗽 (4)
  { case_id: 'G004', complaint: '咳嗽', expected: { syndrome: '风寒袭肺', formula: '止嗽散' } },
  { case_id: 'G014', complaint: '咳嗽', symptoms: ['咽干', '痰少'], expected: { syndrome: '肺阴亏虚', formula: '沙参麦冬汤' } },
  { case_id: 'G015', complaint: '咳嗽', symptoms: ['痰多', '胸闷'], expected: { syndrome: '痰湿蕴肺', formula: '二陈汤' } },
  { case_id: 'G016', complaint: '咳嗽', symptoms: ['咳引胸痛', '口苦'], expected: { syndrome: '肝火犯肺', formula: '泻白散' } },
  // 心悸 (2)
  { case_id: 'G005', complaint: '心悸', expected: { syndrome: '心气虚', formula: '炙甘草汤' } },
  { case_id: 'G017', complaint: '心悸', symptoms: ['畏寒', '肢冷'], expected: { syndrome: '心阳虚', formula: '桂枝甘草汤' } },
  // 眩晕 (2)
  { case_id: 'G018', complaint: '眩晕', expected: { syndrome: '肝阳上亢', formula: '天麻钩藤饮' } },
  { case_id: 'G019', complaint: '眩晕', symptoms: ['劳累即发', '神疲'], expected: { syndrome: '气血亏虚', formula: '归脾汤' } },
  // 便秘 (2)
  { case_id: 'G020', complaint: '便秘', expected: { syndrome: '热结肠道', formula: '麻子仁丸' } },
  { case_id: 'G021', complaint: '便秘', symptoms: ['面色苍白', '头晕'], expected: { syndrome: '阴血亏虚', formula: '润肠丸' } },
  // 腹泻 (2)
  { case_id: 'G022', complaint: '腹泻', expected: { syndrome: '寒湿困脾', formula: '胃苓汤' } },
  { case_id: 'G023', complaint: '腹泻', symptoms: ['五更泄', '腰酸'], expected: { syndrome: '肾阳虚衰', formula: '四神丸' } },
  // 发热 (2)
  { case_id: 'G024', complaint: '发热', symptoms: ['恶寒', '无汗'], expected: { syndrome: '风寒表证', formula: '桂枝汤' } },
  { case_id: 'G025', complaint: '发热', symptoms: ['往来寒热', '口苦'], expected: { syndrome: '少阳证', formula: '小柴胡汤' } },
  // 胁痛 (2)
  { case_id: 'G026', complaint: '胁痛', symptoms: ['情志诱发'], expected: { syndrome: '肝郁气滞', formula: '柴胡疏肝散' } },
  { case_id: 'G027', complaint: '胁痛', symptoms: ['口苦', '黄疸'], expected: { syndrome: '肝胆湿热', formula: '龙胆泻肝汤' } },
  // 腰痛 (2)
  { case_id: 'G028', complaint: '腰痛', symptoms: ['腰膝酸软'], expected: { syndrome: '肾虚腰痛', formula: '左归丸' } },
  { case_id: 'G029', complaint: '心悸', symptoms: ['刺痛', '舌紫暗'], expected: { syndrome: '瘀阻心脉', formula: '血府逐瘀汤' } },
  // 汗证 (1)
  { case_id: 'G030', complaint: '汗证', symptoms: ['自汗', '易感冒'], expected: { syndrome: '肺卫不固', formula: '玉屏风散' } }
];

module.exports = GOLD_CASES;
