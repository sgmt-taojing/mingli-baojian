// ═══ 大六壬专业解读引擎 ═══
// buildLiuRenProfessionalInterpretation() — 核心解读函数
// 基于《大六壬大全》《六壬指南》《六壬粹言》《壬归》经典体系

function buildLiuRenProfessionalInterpretation(keShi, name, year, month, day, hourBranch, yueJiang) {
  let ds = keShi.dayStem;
  let db = keShi.dayBranch;
  let sc = keShi.sanChuan;
  let sk = keShi.siKe;
  let tj = keShi.tianJiangFenbu;
  let ss = keShi.shenSha;
  let tg = keShi.tiGuan;
  let ck = keShi.chuanKe;
  let ct = keShi.chuanTianJiang;
  let de = ELE[ds];

  // ═══ a) 课体总断 ═══
  const keTiPan = '';
  keTiPan += '══════ 课体总断 ══════\n\n';
  keTiPan += '【课名】' + tg.name + '课\n';
  keTiPan += '【吉凶】' + tg.jiXiong + '\n';
  keTiPan += '【断语】' + tg.desc + '\n\n';
  keTiPan += '【详细解说】\n';
  keTiPan += '《大六壬大全》将课体分为六十四种，' + tg.name + '为其一。\n';
  keTiPan += tg.detail + '\n\n';
  keTiPan += '日干' + ds + '（五行属' + de + '），日支' + db + '。\n';
  keTiPan += '日干为求测者本人，日支为所问之事或对方。\n';
  keTiPan += '日干' + ds + '之人，' + getDayStemAnalysis(ds) + '\n';
  keTiPan += '在此' + tg.name + '课中：' + tg.advice + '\n';

  // ═══ b) 四课分析 ═══
  const siKePan = '';
  siKePan += '══════ 四课排列 ══════\n\n';
  siKePan += '第一课（日子阳神）：' + sk.ke1 + '（上' + sk.ke1Gan + '）\n';
  siKePan += '  日干' + ds + '寄宫于' + sk.ke1 + '，上乘之神为' + sk.ke1Gan + '。\n';
  siKePan += '  天地盘关系：地盘' + sk.ke1 + '(' + LR_ZHI_WX[sk.ke1] + ') ← 天盘' + sk.ke1Gan + '(' + _getGanWx(sk.ke1Gan) + ')\n';
  let ka1 = _analyzeKe(sk.ke1, sk.ke1Gan, ds);
  siKePan += '  ' + ka1 + '\n\n';

  siKePan += '第二课（日干阴神）：' + sk.ke2 + '（上' + sk.ke2Gan + '）\n';
  siKePan += '  日干阴神主暗中变化。\n';
  let ka2 = _analyzeKe(sk.ke2, sk.ke2Gan, ds);
  siKePan += '  ' + ka2 + '\n\n';

  siKePan += '第三课（日支阳神）：' + sk.ke3 + '（上' + sk.ke3Gan + '）\n';
  siKePan += '  日支' + db + '主外部环境和所问之事。\n';
  let ka3 = _analyzeKe(sk.ke3, sk.ke3Gan, ds);
  siKePan += '  ' + ka3 + '\n\n';

  siKePan += '第四课（日支阴神）：' + sk.ke4 + '（上' + sk.ke4Gan + '）\n';
  siKePan += '  日支阴神主事体暗中变化。\n';
  let ka4 = _analyzeKe(sk.ke4, sk.ke4Gan, ds);
  siKePan += '  ' + ka4 + '\n\n';

  siKePan += '【四课总评】\n';
  siKePan += '《六壬粹言》曰:「四课者，六壬之根本也。课不备则事不彰。」\n';
  siKePan += '日干' + ds + '寄于' + sk.ke1 + '，上乘' + sk.ke1Gan + '。';
  if (_wxKe(_getGanWx(sk.ke1Gan), de)) siKePan += '上神克日主，事主受制，宜谨慎应对。\n';
  else if (_wxSheng(de, _getGanWx(sk.ke1Gan))) siKePan += '日主生上神，事主付出较多，但有前途。\n';
  else siKePan += '上下基本和谐，事可着手。\n';

  // ═══ c) 三传详解 ═══
  const sanChuanPan = '';
  sanChuanPan += '══════ 三传详解 ══════\n\n';
  sanChuanPan += '发用之法：' + (sc.faType || '常规取法') + '\n\n';
  
  sanChuanPan += '【初传（发端门）】' + sc.faYong + '（' + LR_ZHI_WX[sc.faYong] + '）\n';
  sanChuanPan += '初传为事之开端，一切因果的起点。\n';
  sanChuanPan += '初传' + sc.faYong + '居十二宫，五行属' + LR_ZHI_WX[sc.faYong] + '。\n';
  sanChuanPan += '此为「发端门」，代表事情的起因和最初状态。\n';
  if (ct.fa) {
    sanChuanPan += '初传乘' + ct.fa.name + '（' + ct.fa.nature + '），' + ct.fa.desc.substring(0, 60) + '…\n';
  }
  sanChuanPan += '\n';

  sanChuanPan += '【中传（移易门）】' + sc.zhongChuan + '（' + LR_ZHI_WX[sc.zhongChuan] + '）\n';
  sanChuanPan += '中传为事之发展，中间的转折和变化。\n';
  sanChuanPan += '中传' + sc.zhongChuan + '居十二宫，五行属' + LR_ZHI_WX[sc.zhongChuan] + '。\n';
  sanChuanPan += '此为「移易门」，事物在此阶段发生改变、转移。\n';
  if (ct.zhong) {
    sanChuanPan += '中传乘' + ct.zhong.name + '（' + ct.zhong.nature + '），' + ct.zhong.desc.substring(0, 60) + '…\n';
  }
  sanChuanPan += '\n';

  sanChuanPan += '【末传（归计门）】' + sc.moChuan + '（' + LR_ZHI_WX[sc.moChuan] + '）\n';
  sanChuanPan += '末传为事之结果，最终的归宿和定论。\n';
  sanChuanPan += '末传' + sc.moChuan + '居十二宫，五行属' + LR_ZHI_WX[sc.moChuan] + '。\n';
  sanChuanPan += '此为「归计门」，所有变化最终汇聚于此。\n';
  if (ct.mo) {
    sanChuanPan += '末传乘' + ct.mo.name + '（' + ct.mo.nature + '），' + ct.mo.desc.substring(0, 60) + '…\n';
  }
  sanChuanPan += '\n';

  sanChuanPan += '【三传生克流转】\n';
  for (let i = 0; i < ck.length; i++) {
    sanChuanPan += '  ▸ ' + ck[i] + '\n';
  }
  sanChuanPan += '\n《六壬指南》曰:「三传者，始、中、终也。三传递生则事顺，递克则事阻。」\n';
  sanChuanPan += '初传' + sc.faYong + '→中传' + sc.zhongChuan + '→末传' + sc.moChuan + '，';
  if (ck.length > 0 && ck[0].indexOf('顺利') >= 0) sanChuanPan += '开局顺利。\n';
  else if (ck.length > 0 && ck[0].indexOf('受阻') >= 0) sanChuanPan += '开局有阻力。\n';
  else sanChuanPan += '开局平稳。\n';

  // ═══ d) 天将分布 ═══
  const tianJiangPan = '';
  tianJiangPan += '══════ 十二天将分布 ══════\n\n';
  tianJiangPan += '贵人所在：' + tj.guirenZhi + '位（' + (tj.shunPai ? '顺排' : '逆排') + '）\n\n';
  
  const tianJiangList = [];
  for (let zhi in tj.fenbu) {
    tianJiangList.push({zhi: zhi, info: tj.fenbu[zhi]});
  }
  tianJiangList.sort(function(a, b) {
    return BRANCHES.indexOf(a.zhi) - BRANCHES.indexOf(b.zhi);
  });
  
  for (let i = 0; i < tianJiangList.length; i++) {
    let t = tianJiangList[i];
    const marker = '';
    if (t.zhi === sc.faYong) marker = ' ←初传';
    if (t.zhi === sc.zhongChuan) marker = ' ←中传';
    if (t.zhi === sc.moChuan) marker = ' ←末传';
    if (t.zhi === db) marker = ' ←日支';
    tianJiangPan += t.zhi + '位：' + t.info.name + '（' + t.info.nature + '）' + marker + '\n';
    tianJiangPan += '  ' + t.info.desc.substring(0, 80) + '…\n';
  }
  tianJiangPan += '\n';
  
  // 特殊组合
  let faGod = ct.fa ? ct.fa.name : '';
  let moGod = ct.mo ? ct.mo.name : '';
  tianJiangPan += '【天将生克关系】\n';
  if (faGod === '青龙' && moGod === '贵人') {
    tianJiangPan += '初传青龙，末传贵人——始于财喜，终于贵显，大吉之象。\n';
  } else if (faGod === '白虎' && moGod === '贵人') {
    tianJiangPan += '初传白虎，末传贵人——先凶后吉，虽有风险但贵人相助化险为夷。\n';
  } else if (faGod === '螣蛇' && moGod === '青龙') {
    tianJiangPan += '初传螣蛇，末传青龙——始有虚惊，终得喜庆。\n';
  }
  if (faGod === '贵人' && moGod === '白虎') {
    tianJiangPan += '初传贵人，末传白虎——先吉后凶，起初顺利但后续有险，宜早做准备。\n';
  }
  if (faGod === '玄武' || moGod === '玄武') {
    tianJiangPan += '玄武在传，有盗贼暗昧之事，须防小人欺骗和财物损失。\n';
  }
  tianJiangPan += '\n《大六壬大全》论十二天将云:「贵人统十二天将之首，为至尊至贵。课中贵人得地，万事可成。」\n';

  // ═══ e) 神煞影响 ═══
  const shenShaPan = '';
  shenShaPan += '══════ 神煞影响 ══════\n\n';
  shenShaPan += '当日课中所临神煞共' + ss.length + '位：\n\n';
  
  let jiShaCount = 0, xiongShaCount = 0;
  for (let i = 0; i < ss.length; i++) {
    let s = ss[i];
    let tag = s.nature === '大吉' || s.nature === '吉' ? '【吉】' : (s.nature === '大凶' || s.nature === '凶' ? '【凶】' : '【平】');
    if (s.nature === '大吉' || s.nature === '吉') jiShaCount++;
    if (s.nature === '大凶' || s.nature === '凶') xiongShaCount++;
    shenShaPan += tag + ' ' + s.name + '（临' + s.zhi + '位）\n';
    shenShaPan += '  ' + s.desc + '\n';
  }
  shenShaPan += '\n';
  
  if (jiShaCount > xiongShaCount) {
    shenShaPan += '此课吉神' + jiShaCount + '位，凶神' + xiongShaCount + '位，吉多凶少。所问之事总体向好，可积极行事。\n';
  } else if (xiongShaCount > jiShaCount) {
    shenShaPan += '此课凶神' + xiongShaCount + '位，吉神' + jiShaCount + '位，凶多吉少。所问之事多有阻碍，宜谨慎保守。\n';
    shenShaPan += '但有天德、月德在课，可化解部分凶象。\n';
  } else {
    shenShaPan += '此课吉凶参半，事在人为。把握时机、善用资源即可趋吉避凶。\n';
  }

  // ═══ f) 大白话结论 ═══
  const baihuaJielun = '';
  baihuaJielun += '══════ 大白话解读 ══════\n\n';
  
  // 综合判断
  const zongHe = '';
  if (tg.jiXiong === '大吉') {
    zongHe = '这是一个非常好的课象。天时地利人和都站在你这边，所问之事大概率会顺利达成。';
  } else if (tg.jiXiong === '吉') {
    zongHe = '总体来看，这是个不错的课象。事情有好的发展势头，只要按部就班地做，结果不会差。';
  } else if (tg.jiXiong === '小吉') {
    zongHe = '课象偏吉，但不是一帆风顺的那种。需要你在关键节点做出正确选择，好事多磨但终能成。';
  } else if (tg.jiXiong === '中平') {
    zongHe = '这个课象中规中矩，不好不坏。事情会按正常的节奏走，不会有大喜大悲。';
  } else {
    zongHe = '课象偏凶，要特别小心。事情可能不会那么顺利，需要提前做好防范和心理准备。';
  }
  baihuaJielun += zongHe + '\n\n';
  
  baihuaJielun += '【具体建议】\n';
  
  // 基于课体给建议
  if (tg.name === '元首') {
    baihuaJielun += '1. 元首课象表示现在正是你「做主」的时候，大胆推进计划，不要犹豫。\n';
    baihuaJielun += '2. 事业上可以主动争取机会，领导会看到你的表现。\n';
    baihuaJielun += '3. 如果正在考虑换工作或创业，近期是合适的窗口期。\n';
  } else if (tg.name === '伏吟') {
    baihuaJielun += '1. 现在不是折腾的时候，按兵不动是最聪明的选择。\n';
    baihuaJielun += '2. 利用这段时间学习、充电、整理内务，为将来的冲刺做好准备。\n';
    baihuaJielun += '3. 财务上保守为主，不要做大的投资或消费决策。\n';
  } else if (tg.name === '反吟') {
    baihuaJielun += '1. 事情会有反复，今天说好明天可能变卦，做好心理准备。\n';
    baihuaJielun += '2. 建议多准备几个备选方案，A方案不行就用B方案。\n';
    baihuaJielun += '3. 出行、签约都留出缓冲时间，别把行程排太满。\n';
  } else if (tg.name === '连茹') {
    baihuaJielun += '1. 事情会一环扣一环地自然推进，不用太操心。\n';
    baihuaJielun += '2. 但要注意每个环节的细节，一个小漏洞可能影响全局。\n';
    baihuaJielun += '3. 适合做连锁性、连贯性的工作，比如项目管理、供应链相关。\n';
  } else {
    baihuaJielun += '1. 保持冷静的心态，不急不躁，一步一个脚印。\n';
    baihuaJielun += '2. 做重要决定前，多咨询有经验的人，多一个参考就多一分把握。\n';
    baihuaJielun += '3. 小事可自行处理，大事最好找人商量后再定。\n';
  }
  baihuaJielun += '\n';
  
  // 基于天将的建议
  if (ct.fa && ct.fa.name === '贵人') {
    baihuaJielun += '贵人星在初传，说明一开始就有高人相助。记得多跟比你优秀的人来往，他们的一句话可能改变你的走向。\n';
  }
  if (ct.fa && ct.fa.name === '青龙') {
    baihuaJielun += '青龙发用主财喜，最近财运不错，可以抓住一些机会。但别贪心，见好就收。\n';
  }
  if (ct.fa && (ct.fa.name === '白虎' || ct.fa.name === '玄武')) {
    baihuaJielun += '凶神发用，开头就要小心。出门注意安全，签合同多看几遍，别轻易相信天上掉馅饼的好事。\n';
  }
  
  // 基于神煞的建议
  let hasTianDe = false, hasYiMa = false;
  for (let i = 0; i < ss.length; i++) {
    if (ss[i].name === '天德') hasTianDe = true;
    if (ss[i].name === '驿马') hasYiMa = true;
  }
  if (hasTianDe) {
    baihuaJielun += '有「天德」星护持，就算遇到困难也会逢凶化吉。你这个人有福气，冥冥之中自有贵人相助。\n';
  }
  if (hasYiMa) {
    baihuaJielun += '「驿马」星动，最近可能有出差、搬家、换城市的机会。如果心里正想换个环境，现在正是时候。\n';
  }
  
  baihuaJielun += '\n【可执行化解方案】\n';
  baihuaJielun += '• 每日清晨面向' + _getJiFang(ds) + '方静坐5分钟，调节心气。\n';
  baihuaJielun += '• 可在办公桌' + _getShengFang(de) + '方摆放' + _getKaiYunWu(de) + '，增强运势。\n';
  baihuaJielun += '• 多穿' + _getXingYunSe(de) + '色衣物，与自身五行相合。\n';
  baihuaJielun += '• 逢' + _getJiRi(ds) + '日做事更顺利，大事可选此日。\n';
  baihuaJielun += '• 多行善事积福报，帮助他人就是帮助自己。\n';
  if (tg.name === '伏吟' || tg.jiXiong === '凶') {
    baihuaJielun += '• 可在卧室西北角放置一盆绿植，化解滞气。\n';
  }

  // ═══ g) 流年推演 ═══
  const liunianTuiyan = '';
  liunianTuiyan += '══════ 流年推演 ══════\n\n';
  let currentYear = new Date().getFullYear();
  
  liunianTuiyan += '以日干' + ds + '（属' + de + '）为基准，结合三传' + sc.faYong + '→' + sc.zhongChuan + '→' + sc.moChuan + '推演：\n\n';
  
  // 基于三传五行推算时间节点
  let faMonth = _zhiToMonth(sc.faYong);
  let zhongMonth = _zhiToMonth(sc.zhongChuan);
  let moMonth = _zhiToMonth(sc.moChuan);
  
  liunianTuiyan += '【第一阶段：发端期】\n';
  liunianTuiyan += '时段：' + faMonth + '月前后\n';
  liunianTuiyan += '事件开始酝酿，' + sc.faYong + '位之事显现。在此期间需要做好准备，抓住端倪。\n\n';
  
  liunianTuiyan += '【第二阶段：发展期】\n';
  liunianTuiyan += '时段：' + zhongMonth + '月前后\n';
  liunianTuiyan += '事情进入变化阶段，' + sc.zhongChuan + '位之事影响最大。这段时间会有转折或变化，需灵活应对。\n\n';
  
  liunianTuiyan += '【第三阶段：结果期】\n';
  liunianTuiyan += '时段：' + moMonth + '月前后\n';
  liunianTuiyan += '事情趋近结果，' + sc.moChuan + '位之事定局。此时结果落定，大局已明。\n\n';
  
  // 流年吉凶
  liunianTuiyan += '【' + currentYear + '年重点月份】\n';
  const shengMonth = {'木':[1,2,3],'火':[4,5,6],'金':[7,8,9],'水':[10,11,12],'土':[3,6,9,12]};
  let wangMonths = shengMonth[de] || [3,6,9,12];
  liunianTuiyan += '日主' + ds + '五行属' + de + '，旺于' + wangMonths.join('、') + '月。在这些月份运势最强，适合做重要决策。\n';
  liunianTuiyan += '初传' + sc.faYong + '应于' + faMonth + '月，中传应于' + zhongMonth + '月，末传应于' + moMonth + '月。\n';
  liunianTuiyan += '\n温馨提示：以上为命理参考，真正的命运掌握在自己手中。积极行动、持续努力才是最好的「化解」。\n';

  return {
    tiGuan: tg,
    keTiPan: keTiPan,
    siKePan: siKePan,
    sanChuanPan: sanChuanPan,
    tianJiangPan: tianJiangPan,
    shenShaPan: shenShaPan,
    baihuaJielun: baihuaJielun,
    liunianTuiyan: liunianTuiyan
  };
}

// ═══ 辅助解读函数 ═══
function _analyzeKe(zhi, gan, dayStem) {
  let zw = LR_ZHI_WX[zhi];
  let gw = _getGanWx(gan);
  let de = ELE[dayStem];
  const result = '地盘' + zhi + '(' + zw + ')，天盘' + gan + '(' + gw + ') → ';
  
  if (_wxKe(gw, zw)) {
    result += '天克地，上制下。主外部压力克制内事，有强制之意。';
  } else if (_wxKe(zw, gw)) {
    result += '地克天，下克上。主内部反制外部，有反抗变动之象。';
  } else if (_wxSheng(gw, zw)) {
    result += '天生地，上生下。主外部生助内部，有加持之力。';
  } else if (_wxSheng(zw, gw)) {
    result += '地生天，下生上。主内部推动外部，付出而有获。';
  } else {
    result += '天地比和，五行相同。主内外一致，和谐稳定。';
  }
  return result;
}

function _zhiToMonth(zhi) {
  const map = {寅:'1',卯:'2',辰:'3',巳:'4',午:'5',未:'6',申:'7',酉:'8',戌:'9',亥:'10',子:'11',丑:'12'};
  return map[zhi] || '?';
}

function _getJiFang(stem) {
  const map = {甲:'东',乙:'东南',丙:'南',丁:'西南',戊:'中',己:'中',庚:'西',辛:'西北',壬:'北',癸:'东北'};
  return map[stem] || '东';
}

function _getShengFang(ele) {
  const map = {木:'东',火:'南',土:'中',金:'西',水:'北'};
  return map[ele] || '东';
}

function _getKaiYunWu(ele) {
  const map = {木:'绿色植物或木质饰品',火:'红色摆件或水晶',土:'黄色水晶或陶器',金:'金属摆件或白色水晶',水:'小鱼缸或蓝色饰品'};
  return map[ele] || '水晶';
}

function _getXingYunSe(ele) {
  const map = {木:'绿、青',火:'红、紫',土:'黄、棕',金:'白、银',水:'黑、蓝'};
  return map[ele] || '黄';
}

function _getJiRi(stem) {
  const map = {甲:'寅卯',乙:'寅卯',丙:'巳午',丁:'巳午',戊:'辰戌丑未',己:'辰戌丑未',庚:'申酉',辛:'申酉',壬:'亥子',癸:'亥子'};
  return map[stem] || '';
}
// ═══ END PROFESSIONAL INTERPRETATION ═══
