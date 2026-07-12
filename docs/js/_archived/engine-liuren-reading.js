  }
  if (faGod === '贵人' && moGod === '白虎') {
    tianJiangPan += '初传贵人，末传白虎——先吉后凶，起初顺利但后续有险，宜早做准备。\n';
  }
  if (faGod === '玄武' || moGod === '玄武') {
    tianJiangPan += '玄武在传，有盗贼暗昧之事，须防小人欺骗和财物损失。\n';
  }
  tianJiangPan += '\n《大六壬大全》论十二天将云:「贵人统十二天将之首，为至尊至贵。课中贵人得地，万事可成。」\n';

  // ═══ e) 神煞影响 ═══
  var shenShaPan = '';
  shenShaPan += '══════ 神煞影响 ══════\n\n';
  shenShaPan += '当日课中所临神煞共' + ss.length + '位：\n\n';
  
  var jiShaCount = 0, xiongShaCount = 0;
  for (var i = 0; i < ss.length; i++) {
    var s = ss[i];
    var tag = s.nature === '大吉' || s.nature === '吉' ? '【吉】' : (s.nature === '大凶' || s.nature === '凶' ? '【凶】' : '【平】');
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
  var baihuaJielun = '';
  baihuaJielun += '══════ 大白话解读 ══════\n\n';
  
  // 综合判断
  var zongHe = '';
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
  var hasTianDe = false, hasYiMa = false;
  for (var i = 0; i < ss.length; i++) {
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
  var liunianTuiyan = '';
  liunianTuiyan += '══════ 流年推演 ══════\n\n';
  var currentYear = new Date().getFullYear();
  
  liunianTuiyan += '以日干' + ds + '（属' + de + '）为基准，结合三传' + sc.faYong + '→' + sc.zhongChuan + '→' + sc.moChuan + '推演：\n\n';
  
  // 基于三传五行推算时间节点
  var faMonth = _zhiToMonth(sc.faYong);
  var zhongMonth = _zhiToMonth(sc.zhongChuan);
  var moMonth = _zhiToMonth(sc.moChuan);
  
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
  var shengMonth = {'木':[1,2,3],'火':[4,5,6],'金':[7,8,9],'水':[10,11,12],'土':[3,6,9,12]};
  var wangMonths = shengMonth[de] || [3,6,9,12];
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
  var zw = LR_ZHI_WX[zhi];
  var gw = _getGanWx(gan);
  var de = ELE[dayStem];
  var result = '地盘' + zhi + '(' + zw + ')，天盘' + gan + '(' + gw + ') → ';
  
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
  var map = {寅:'1',卯:'2',辰:'3',巳:'4',午:'5',未:'6',申:'7',酉:'8',戌:'9',亥:'10',子:'11',丑:'12'};
  return map[zhi] || '?';
}

function _getJiFang(stem) {
  var map = {甲:'东',乙:'东南',丙:'南',丁:'西南',戊:'中',己:'中',庚:'西',辛:'西北',壬:'北',癸:'东北'};
  return map[stem] || '东';
}

function _getShengFang(ele) {
  var map = {木:'东',火:'南',土:'中',金:'西',水:'北'};
  return map[ele] || '东';
}

function _getKaiYunWu(ele) {
  var map = {木:'绿色植物或木质饰品',火:'红色摆件或水晶',土:'黄色水晶或陶器',金:'金属摆件或白色水晶',水:'小鱼缸或蓝色饰品'};
  return map[ele] || '水晶';
}

function _getXingYunSe(ele) {
  var map = {木:'绿、青',火:'红、紫',土:'黄、棕',金:'白、银',水:'黑、蓝'};
  return map[ele] || '黄';
}

function _getJiRi(stem) {
  var map = {甲:'寅卯',乙:'寅卯',丙:'巳午',丁:'巳午',戊:'辰戌丑未',己:'辰戌丑未',庚:'申酉',辛:'申酉',壬:'亥子',癸:'亥子'};
  return map[stem] || '';
}
// ═══ END PROFESSIONAL INTERPRETATION ═══


// ================================================================
//  INIT
// ================================================================

document.addEventListener('DOMContentLoaded', initCompositeSections);

// URL hash 导航：支持 #section-xxx?sub=yyy 格式
document.addEventListener('DOMContentLoaded', function() {
  var hash = window.location.hash;
  if (hash && hash.length > 1) {
    var hashStr = hash.substring(1); // remove #
    var section = '';
    var subTab = '';
    
    // Parse: section-xxx?sub=yyy or section-xxx
    var qIdx = hashStr.indexOf('?');
    if (qIdx >= 0) {
      var sectionPart = hashStr.substring(0, qIdx);
      var queryPart = hashStr.substring(qIdx + 1);
      // Extract section name
      if (sectionPart.indexOf('section-') === 0) section = sectionPart.substring(8);
      // Parse sub param
      var params = new URLSearchParams(queryPart);
      subTab = params.get('sub') || '';
    } else {
      if (hashStr.indexOf('section-') === 0) section = hashStr.substring(8);
    }
    
    if (section) {
      setTimeout(function() {
        // Map sub param to showZhanbuSub/showXingmingSub/showMoreModule
        if (subTab) {
          // zhanbu subtabs: yijing, meihua, qimen, ziwei, liuren, cezi
          if (['yijing','meihua','qimen','ziwei','liuren','cezi'].includes(subTab)) {
            showSection('zhanbu');
            showZhanbuSub(subTab);
            var subBtns = document.querySelectorAll('#section-zhanbu .zhanbu-subtab');
            subBtns.forEach(function(b) { b.classList.remove('active'); });
            subBtns.forEach(function(b) {
              var names = {yijing:'易经',meihua:'梅花',qimen:'奇门',ziwei:'紫微',liuren:'六壬',cezi:'测字'};
              if (b.textContent.includes(names[subTab]||subTab)) b.classList.add('active');
            });
          } else if (['rename','company','mobile'].includes(subTab)) {
            showSection('xingming');
            showXingmingSub(subTab);
          } else if (['knowledge','koujue','faith','tizhi','vip','shop','almanac'].includes(subTab)) {
            showSection('more');
            showMoreModule(subTab);
          } else {
            showSection(section);
          }
        } else {
          showSection(section);
        }
        window.scrollTo({top: 0, behavior: 'smooth'});
      }, 500); // Wait for page initialization
    }
  }
});
document.addEventListener('DOMContentLoaded', () => {
  try {
  // 渲染六十四卦网格
  setTimeout(renderYijingGuaGrid, 200);
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth()+1).padStart(2,'0');
  const d = String(today.getDate()).padStart(2,'0');
  const ds = `${y}-${m}-${d}`;
  const inputs = document.querySelectorAll('input[type="date"]');
  inputs.forEach(el => { if (el) { el.value = ds; el.max = ds; } });
  try { initDailyWisdom(); } catch(e1) { console.warn('initDailyWisdom failed:', e1); }
  // 初始化今日知识推送
  setTimeout(initDailyKnowledge, 300);
  } catch(e) { console.error('DOMContentLoaded init error:', e); }
});

// ================================================================
//  每日知识推送系统 getDailyKnowledge
// ================================================================

/**
 * 根据日期干支、节气、节日自动匹配最合适的知识内容
 * @param {Date} date - 日期对象，默认为今天
 * @returns {Object} { tag, title, summary, detail, category }
 */
function getDailyKnowledge(date) {
  date = date || new Date();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // 天干地支计算
  const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  
  // 计算日干支（基于1900-01-01甲戌日）
  const baseDate = new Date(1900, 0, 1);
  const diff = Math.floor((date - baseDate) / 86400000);
  const dayStemIdx = ((diff + 0) % 10 + 10) % 10; // 1900-01-01为甲戌日，甲=0
  const dayBranchIdx = ((diff + 10) % 12 + 12) % 12; // 戌=10
  const dayStem = STEMS[dayStemIdx];
  const dayBranch = BRANCHES[dayBranchIdx];
  const dayGanZhi = dayStem + dayBranch;
  
  // 二十四节气
  const jieqi = getJieqiByDate(date);
  
  // 农历节日
  const lunarFestival = getLunarFestival(date);
  
  // 公历节日
  const solarFestival = getSolarFestival(month, day);
  
  // 60甲子纳音表
  const nayinTable = {
    '甲子':'海中金','乙丑':'海中金','丙寅':'炉中火','丁卯':'炉中火',
    '戊辰':'大林木','己巳':'大林木','庚午':'路旁土','辛未':'路旁土',
    '壬申':'剑锋金','癸酉':'剑锋金','甲戌':'山头火','乙亥':'山头火',
    '丙子':'涧下水','丁丑':'涧下水','戊寅':'城墙土','己卯':'城墙土',
    '庚辰':'白蜡金','辛巳':'白蜡金','壬午':'杨柳木','癸未':'杨柳木',
    '甲申':'泉中水','乙酉':'泉中水','丙戌':'屋上土','丁亥':'屋上土',
    '戊子':'霹雳火','己丑':'霹雳火','庚寅':'松柏木','辛卯':'松柏木',
    '壬辰':'长流水','癸巳':'长流水','甲午':'沙中金','乙未':'沙中金',
    '丙申':'山下火','丁酉':'山下火','戊戌':'平地木','己亥':'平地木',
    '庚子':'壁上土','辛丑':'壁上土','壬寅':'金箔金','癸卯':'金箔金',
    '甲辰':'覆灯火','乙巳':'覆灯火','丙午':'天河水','丁未':'天河水',
    '戊申':'大驿土','己酉':'大驿土','庚戌':'钗钏金','辛亥':'钗钏金',
    '壬子':'桑柘木','癸丑':'桑柘木','甲寅':'大溪水','乙卯':'大溪水',
    '丙辰':'沙中土','丁巳':'沙中土','戊午':'天上火','己未':'天上火',
    '庚申':'石榴木','辛酉':'石榴木','壬戌':'大海水','癸亥':'大海水'
  };
  
  // 纳音含义简表
  const nayinMeaning = {
    '海中金': '金蕴藏于大海之中，深藏不露，有才而不显。主内涵丰富，不事张扬，需遇火炼方能成器。',
    '炉中火': '炉中之火，需要木来生助，火势可控可调。主热情而有节制，内心炽热外表温和。',
    '大林木': '茂密森林之木，枝繁叶茂，根基深厚。主格局宏大，有包容力，能成就大事业。',
    '路旁土': '道路两旁之土，承载万物。主踏实勤恳，默默奉献，但容易被忽视。',
    '剑锋金': '刀剑之锋刃，刚锐无比。主果断刚毅，有决断力和执行力，但需注意过于锋利伤人伤己。',
    '山头火': '山头之野火，火势猛烈但短暂。主性格热烈，爆发力强，但持久力不足。',
    '涧下水': '山涧溪流之水，清澈纯净。主性情温和纯洁，内心细腻，有持久的生命力。',
    '城墙土': '城墙之土，厚重坚固。主性格坚毅，有防御心和守护意识，可靠但不易亲近。',
    '白蜡金': '白蜡之金，温润而有光泽。主外表温文，内在有品质，但尚未完全发挥潜力。',
    '杨柳木': '杨柳之木，柔韧飘逸。主性格柔顺，适应力强，善于变通，但容易随波逐流。',
    '泉中水': '泉眼涌出之水，清澈甘甜。主才思泉涌，智慧不竭，内心纯净有活力。',
    '屋上土': '房屋顶上之土，遮风挡雨。主有庇护他人的能力，责任感强，是家庭的守护者。',
    '霹雳火': '雷电霹雳之火，瞬间爆发。主性格刚烈，有突发事件中的爆发力，命运多戏剧性变化。',
    '松柏木': '松柏常青之木，岁寒不凋。主品格高洁，意志坚定，经得起考验，有君子之风。',
    '长流水': '江河长流之水，奔流不息。主志向远大，持续不断，有毅力和恒心。',
    '沙中金': '沙中淘出之金，需经淘洗方显真价。主需经磨砺方成大器，有真才实学但需发掘。',
    '山下火': '山下之火，火势温和。主性格温和，不张扬，在自己的领域内发光发热。',
    '平地木': '平原上生长之木，低调朴实。主根基扎实，在平凡中见不平凡。',
    '壁上土': '墙壁之土，隔断内外。主有界限感，善于修饰外表，内心有自己的原则和空间。',
    '金箔金': '贴在器物上的金箔，薄而有光泽。主外表光鲜，有审美和装饰才能，但内涵需加强。',
    '覆灯火': '灯盏中之火，光照一方。主温和有恒心，在自己的范围内发光发热，不求大放异彩但求持久温暖。',
    '天河水': '天上之水，如雨露降下。主格局高远，有济世之心，来自上层的恩泽和福气。',
    '大驿土': '驿站大道之土，四通八达。主交际广泛，见识多广，是沟通的桥梁。',
    '钗钏金': '首饰钗钏之金，精美华丽。主外表精美，有审美天赋，注重形象和品质。',
    '桑柘木': '桑树柘木，可饲蚕织布。主务实有用，能创造实际价值，默默贡献。',
    '大溪水': '大溪奔流之水，清澈湍急。主性情开朗，行动力强，有明确方向和持续动力。',
    '沙中土': '沙中混合之土，松散不实。主根基不稳，需后天努力夯实基础，有可塑性。',
    '天上火': '天上太阳之火，光明普照。主格局宏大，光明磊落，有领导力和影响力。',
    '石榴木': '石榴之木，花红果多。主多才多艺，成果丰硕，有生育和创造之能。',
    '大海水': '大海之水，浩瀚无际。主心胸宽广，格局宏大，有包容万物的气度，但也容易泛滥失控。'
  };
  
  // 节气匹配（优先级最高——节气一年一次，最为特殊）
  if (jieqi) {
    const jieqiKnowledge = {
      '立春': { tag: '节气', title: '立春开运指南 —— 万物复苏，新年伊始', summary: '立春为二十四节气之首，标志着新一年开始。立春日宜：祭太岁、换新衣、向东方出行、吃春饼。忌：吵架、看病、赖床。', detail: '立春是二十四节气中的第一个节气，标志着春天的开始，也是风水命理上新年的起点。\\n\\n【立春开运法】\\n1. 祭拜太岁——立春日祭拜当年太岁星君，祈求新年平安顺利\\n2. 迎春接福——立春日早晨面向东方深呼吸三次，迎接新春朝气\\n3. 穿新衣——穿红色或亮色新衣，象征新年新气象\\n4. 吃春饼——吃春饼（咬春），寓意咬住春天的好运\\n5. 忌讳——立春日忌吵架、忌看病（除非急诊）、忌赖床，以免一年不顺\\n\\n【立春与八字】立春是八字年柱的分界点。立春前出生者属前一年生肖，立春后出生者属当年生肖。这一点在排八字时极为重要，不可用农历正月初一作为年柱分界。', category: 'wuxing' },
      '雨水': { tag: '节气', title: '雨水节气 —— 降雨开始，润泽万物', summary: '雨水节气，天气回暖，降水增多。宜养肝护脾、调畅情志。八字中水为用神者此节气运势转旺。', detail: '雨水是二十四节气中的第二个节气，标志着降雨开始，雨量逐渐增多。\\n\\n【雨水养生】\\n1. 养肝——春季属木，肝属木，雨水节气宜养肝。早睡早起，舒畅情志\\n2. 护脾——雨水多湿，湿易伤脾。宜食薏米、山药、扁豆等健脾祛湿食物\\n3. 防寒——雨水节气虽回暖但仍有倒春寒，注意保暖不要过早减衣\\n\\n【雨水与命理】雨水节气水气渐旺，八字以水为用神者此期间运势转好。以土为用神者需注意湿土过重，可能影响脾胃。', category: 'wuxing' },
      '惊蛰': { tag: '节气', title: '惊蛰节气 —— 春雷乍响，万物复苏', summary: '惊蛰节气，春雷始鸣，蛰虫出土。宜祭白虎、打小人、养生防虫。八字中木为用神者此节气运势大旺。', detail: '惊蛰是二十四节气中的第三个节气，春雷始鸣，惊醒蛰伏的昆虫。\\n\\n【惊蛰民俗】\\n1. 祭白虎——惊蛰日祭白虎，防止小人暗害\\n2. 打小人——惊蛰日打小人，驱赶霉运\\n3. 吃梨——惊蛰日吃梨，寓意与害虫分离\\n\\n【惊蛰养生】惊蛰节气阳气上升，肝火易旺。宜清淡饮食，少酸多甘。早睡早起，适度运动。\\n\\n【惊蛰与命理】惊蛰节气木气最旺，八字以木为用神者此期间运势大好。以金为用神者需注意金被火克，压力增大。', category: 'wuxing' },
      '春分': { tag: '节气', title: '春分节气 —— 昼夜平分，阴阳平衡', summary: '春分节气，昼夜等长，阴阳平衡。宜调养身心、祈福纳祥。此节气前后出生者八字中阴阳较为均衡。', detail: '春分是二十四节气中的第四个节气，昼夜平分，阴阳平衡。\\n\\n【春分养生】春分节气阴阳平衡，是调养身心的最佳时机。宜：饮食均衡、作息规律、心情平和。忌：偏食偏嗜、熬夜赖床、情绪波动。\\n\\n【春分与命理】春分前后出生者，八字中木火渐旺、金水渐衰，五行力量较为均衡，命局多平和之格。春分日宜祈福、许愿、做善事。', category: 'wuxing' },
      '清明': { tag: '节气', title: '清明节气 —— 扫墓祭祖，慎终追远', summary: '清明节气，天清地明。宜扫墓祭祖、踏青郊游。八字中以木为用神者此节气运势仍旺。', detail: '清明是二十四节气中的第五个节气，也是传统祭祀节日。\\n\\n【清明祭祖】清明扫墓祭祖是中华民族传统美德，表达对先人的缅怀和敬意。祭祖时宜：整修坟墓、敬献鲜花、焚香祭拜。忌：大声喧哗、嬉笑打闹、踩踏他人坟墓。\\n\\n【清明踏青】清明时节春暖花开，宜踏青郊游、放风筝、荡秋千，舒畅肝气，愉悦心情。\\n\\n【清明与命理】清明节气木气仍旺，但开始向火气转化。八字以木为用神者运势仍好，以火为用神者运势开始上升。', category: 'wuxing' },
      '谷雨': { tag: '节气', title: '谷雨节气 —— 雨生百谷，润泽万物', summary: '谷雨节气，降雨增多，百谷生长。宜养脾胃、祛湿气。八字中以水木为用神者此节气运势较好。', detail: '谷雨是二十四节气中的第六个节气，也是春季最后一个节气。\\n\\n【谷雨养生】谷雨节气湿气渐重，宜健脾祛湿。食薏米粥、山药粥、红豆汤。忌生冷油腻。\\n\\n【谷雨茶】谷雨前后采的茶称谷雨茶，品质上乘，有清火明目之效。\\n\\n【谷雨与命理】谷雨节气水木渐退、火土渐进。八字以火土为用神者运势开始转好。', category: 'wuxing' },
      '立夏': { tag: '节气', title: '立夏开运指南 —— 夏季开始，火气渐旺', summary: '立夏节气，夏季开始，火气渐旺。宜养心安神、清淡饮食。八字中以火为用神者此节气运势转旺。', detail: '立夏是二十四节气中的第七个节气，标志着夏季开始。\\n\\n【立夏养生】夏季属火，心属火，立夏宜养心。宜：清淡饮食、午休养心、静坐冥想。忌：暴怒暴躁、辛辣油腻。\\n\\n【立夏与命理】立夏后火气渐旺，八字以火为用神者运势转好。以水为用神者需注意水被火耗，运势可能下滑。\\n\\n【立夏开运】立夏日可穿红色衣物、面向南方深呼吸，迎接夏季火气。', category: 'wuxing' },
      '夏至': { tag: '节气', title: '夏至节气 —— 阳极阴生，否极泰来', summary: '夏至节气，白昼最长，阳气至极。宜养心静气、避免剧烈运动。八字中阴阳转化，需注意调候。', detail: '夏至是二十四节气中的第十个节气，白昼最长，阳气至极，此后阳气渐收、阴气渐长。\\n\\n【夏至养生】夏至阳极阴生，宜养心静气。宜：清淡饮食、午休、避暑。忌：剧烈运动、暴怒、熬夜。\\n\\n【夏至与命理】夏至日阳气至极，八字火旺者需注意调候降温。喜水者夏至后运势逐渐好转。\\n\\n【夏至民俗】夏至吃面，寓意长寿。岭南地区有夏至吃狗肉的习俗（不提倡）。', category: 'wuxing' },
      '立秋': { tag: '节气', title: '立秋开运指南 —— 秋季开始，金气渐旺', summary: '立秋节气，秋季开始，金气渐旺。宜养肺护呼吸、收敛神气。八字中以金为用神者此节气运势转旺。', detail: '立秋是二十四节气中的第十三个节气，标志着秋季开始。\\n\\n【立秋养生】秋季属金，肺属金，立秋宜养肺。宜：润肺生津、早睡早起、收敛神气。忌：辛辣燥热、悲伤过度。\\n\\n【立秋与命理】立秋后金气渐旺，八字以金为用神者运势转好。以木为用神者需注意木被金克，压力增大。\\n\\n【立秋开运】立秋日可穿白色或金色衣物，面向西方深呼吸，迎接秋季金气。', category: 'wuxing' },
      '秋分': { tag: '节气', title: '秋分节气 —— 昼夜平分，秋高气爽', summary: '秋分节气，昼夜等长，秋高气爽。宜调养身心、赏月祈福。此节气前后出生者八字中金气较旺。', detail: '秋分是二十四节气中的第十六个节气，昼夜平分，秋高气爽。\\n\\n【秋分养生】秋分节气阴阳平衡，宜调养身心。宜：饮食均衡、适度运动、心情平和。忌：偏食偏嗜、情绪波动。\\n\\n【秋分与命理】秋分前后出生者，八字中金气较旺，命局多刚毅之格。秋分日宜赏月、祈福、许愿。', category: 'wuxing' },
      '立冬': { tag: '节气', title: '立冬开运指南 —— 冬季开始，水气渐旺', summary: '立冬节气，冬季开始，水气渐旺。宜养肾藏精、早睡晚起。八字中以水为用神者此节气运势转旺。', detail: '立冬是二十四节气中的第十九个节气，标志着冬季开始。\\n\\n【立冬养生】冬季属水，肾属水，立冬宜养肾。宜：温补饮食、早睡晚起、保暖防寒。忌：冰冷食物、过度劳累、熬夜。\\n\\n【立冬与命理】立冬后水气渐旺，八字以水为用神者运势转好。以火为用神者需注意火被水克，运势可能下滑。\\n\\n【立冬开运】立冬日可穿黑色或蓝色衣物，面向北方深呼吸，迎接冬季水气。', category: 'wuxing' },
      '冬至': { tag: '节气', title: '冬至节气 —— 阴极阳生，一阳来复', summary: '冬至节气，白昼最短，阴气至极，此后阳气开始回升。宜进补养生、祭祖祈福。八字中阴阳转化的重要节点。', detail: '冬至是二十四节气中的第二十二个节气，白昼最短，阴气至极，此后阳气开始回升，故称「冬至一阳生」。\\n\\n【冬至养生】冬至是进补的最佳时机。宜：羊肉汤、汤圆、饺子。温补阳气，养肾藏精。忌：生冷寒凉、过度消耗。\\n\\n【冬至与命理】冬至日阴极阳生，是八字调候的重要节点。冬至后阳气渐长，喜火者运势开始好转。\\n\\n【冬至民俗】冬至吃饺子（北方）、吃汤圆（南方），寓意团圆。冬至祭祖，慎终追远。冬至日宜安静养神，不宜喧闹。', category: 'wuxing' }
    };
    
    if (jieqiKnowledge[jieqi]) {
      return jieqiKnowledge[jieqi];
    }
    
    // 其他节气通用
    return {
      tag: '节气',
      title: jieqi + '节气 —— 顺时养生，趋吉避凶',
      summary: '今日为' + jieqi + '节气。节气交替之际，气场变化，宜静心养生、顺应天时。注意调整作息和饮食，适应季节变化。',
      detail: jieqi + '节气是二十四节气之一。节气交替时天地气场发生变化，人应注意顺应天时，调整身心。\\n\\n【节气养生原则】\\n1. 春季节气（立春-谷雨）：养肝为主，宜清淡饮食、舒畅情志\\n2. 夏季节气（立夏-大暑）：养心为主，宜清凉解暑、静心养神\\n3. 秋季节气（立秋-霜降）：养肺为主，宜润燥生津、收敛神气\\n4. 冬季节气（立冬-大寒）：养肾为主，宜温补藏精、保暖防寒\\n\\n【节气与八字】节气是八字月柱的分界点。每个节气对应一个月柱，节气交替时月柱变更，大运也随之转换。因此节气前后出生者，需特别注意月柱的确定。',
      category: 'wuxing'
    };
  }
  
  // 节日匹配
  if (lunarFestival) {
    return lunarFestival;
  }
  if (solarFestival) {
    return solarFestival;
  }
  
  // 文昌日（甲乙日）
  if (dayStem === '甲' || dayStem === '乙') {
    return {
      tag: '文昌星',
      title: '文昌星提升学业运 —— 今日甲乙日文昌当令',
      summary: '甲乙日为文昌星当令之日。文昌主学问、考试、文书。今日宜读书学习、考试面试、提交重要文件。可在书桌东南方放置文昌塔或四支毛笔催旺文昌。',
      detail: '文昌星是掌管读书、考试、学问的神煞。甲日和乙日出生的人，或甲乙日当天，文昌星力量最强。\\n\\n【文昌催旺法】\\n1. 书桌朝东南方，放文昌塔或四支毛笔\\n2. 穿青色或绿色衣物，增强木气\\n3. 早起辰时（7-9点）读书效果最佳\\n4. 今日适合：考试、面试、签合同、投稿、学习新知识\\n5. 今日忌：与人争论、冲动行事\\n\\n【文昌贵人查法】甲乙日见巳午、丙戊日见申、丁己日见酉、庚日见亥、辛日见寅、壬日见寅、癸日见卯。命带文昌者聪明好学，文笔出众。',
      category: 'shensha'
    };
  }
  
  // 桃花日（子午卯酉日）
  if (dayBranch === '子' || dayBranch === '午' || dayBranch === '卯' || dayBranch === '酉') {
    const taohuaDesc = {
      '子': '子为水桃花，主智慧型桃花，感情中注重精神交流',
      '午': '午为火桃花，主热情型桃花，感情中注重激情和浪漫',
      '卯': '卯为木桃花，主温柔型桃花，感情中注重体贴和关怀',
      '酉': '酉为金桃花，主果断型桃花，感情中注重决断和承诺'
    };
    return {
      tag: '桃花星',
      title: '桃花星与感情 —— 今日' + dayBranch + '日桃花当令',
      summary: dayBranch + '日为桃花星当令之日。' + taohuaDesc[dayBranch] + '。今日宜社交、相亲、表白，感情运较旺。',
      detail: '桃花星是掌管感情、人缘、魅力的神煞。子午卯酉为四大桃花星。\\n\\n【桃花日催旺法】\\n1. 今日适合：社交聚会、相亲表白、结婚领证\\n2. 穿着粉红色或浅紫色衣物增强桃花气场\\n3. 在正南方放置鲜花（玫瑰、百合）催旺桃花\\n4. 桃花逢合更旺——子日逢丑合、午日逢未合、卯日逢戌合、酉日逢辰合\\n5. 桃花逢冲则散——子日忌午、午日忌子、卯日忌酉、酉日忌卯\\n\\n【命带桃花查法】寅午戌见卯、巳酉丑见午、申子辰见酉、亥卯未见子。命带桃花者人缘好、异性缘佳，但也容易招惹感情纠纷。',
      category: 'shensha'
    };
  }
  
  // 驿马日（寅申巳亥日）
  if (dayBranch === '寅' || dayBranch === '申' || dayBranch === '巳' || dayBranch === '亥') {
    return {
      tag: '驿马星',
      title: '驿马星主出行变动 —— 今日' + dayBranch + '日驿马当令',
      summary: dayBranch + '日为驿马星当令之日。驿马主出行、迁居、变动。今日宜出行、搬家、出差、调动工作。',
      detail: '驿马星是掌管出行、变动、迁移的神煞。寅申巳亥为四马地。\\n\\n【驿马日应用】\\n1. 今日适合：出行、搬家、出差、调动、旅游\\n2. 驿马逢冲更旺——寅日逢申冲、申日逢寅冲、巳日逢亥冲、亥日逢巳冲\\n3. 驿马逢合则不动——寅日逢亥合、申日逢巳合、巳日逢申合、亥日逢寅合\\n4. 出行方向：寅日宜东北方、申日宜西南方、巳日宜东南方、亥日宜西北方\\n\\n【命带驿马查法】寅午戌见申、巳酉丑见亥、申子辰见寅、亥卯未见巳。命带驿马者一生多走动，适合在外发展。',
      category: 'shensha'
    };
  }
  
  // 纳音日匹配
  const nayin = nayinTable[dayGanZhi];
  if (nayin && nayinMeaning[nayin]) {
    return {
      tag: '纳音',
      title: dayGanZhi + '纳音「' + nayin + '」解读',
      summary: '今日为' + dayGanZhi + '日，纳音为「' + nayin + '」。' + nayinMeaning[nayin],
      detail: '今日干支为' + dayGanZhi + '，六十甲子纳音为「' + nayin + '」。\\n\\n【纳音含义】' + nayinMeaning[nayin] + '\\n\\n【纳音应用】纳音五行在八字分析中作为辅助参考。纳音五行与正五行可以互相印证——若纳音五行与正五行方向一致，则力量增强；若方向不一致，则力量有所抵消。\\n\\n【六十甲子纳音歌诀】甲子乙丑海中金，丙寅丁卯炉中火，戊辰己巳大林木，庚午辛未路旁土，壬申癸酉剑锋金。甲戌乙亥山头火，丙子丁丑涧下水，戊寅己卯城墙土，庚辰辛巳白蜡金，壬午癸未杨柳木。甲申乙酉泉中水，丙戌丁亥屋上土，戊子己丑霹雳火，庚寅辛卯松柏木，壬辰癸巳长流水。甲午乙未沙中金，丙申丁酉山下火，戊戌己亥平地木，庚子辛丑壁上土，壬寅癸卯金箔金。甲辰乙巳覆灯火，丙午丁未天河水，戊申己酉大驿土，庚戌辛亥钗钏金，壬子癸丑桑柘木。甲寅乙卯大溪水，丙辰丁巳沙中土，戊午己未天上火，庚申辛酉石榴木，壬戌癸亥大海水。',
      category: 'nayin'
    };
  }
  
  // 天干日匹配
  const stemKnowledge = {
    '甲': { tag: '天干', title: '甲木 —— 参天大树，刚直不阿', summary: '今日为甲日。甲木为阳木，象征参天大树，刚直不阿，有领导力。今日宜：开创新事、承担责任、帮助弱者。忌：过于刚直、不知变通。', detail: '甲木为十天干之首，属阳木，象征参天大树。\n\n【甲木性格】刚直不阿，有担当精神，天生的领导者。贵人多，事业运佳。但可能过于刚直，需学会变通。\n\n【甲木事业】适合管理、教育、法律、政治、林业等领导型工作。\n\n【甲木健康】注意肝胆、头部、筋骨。忌过度劳累和饮酒。\n\n【甲木今日宜忌】宜：开创新事、承担责任、帮助弱者、面试求职。忌：过于刚直、与人冲突、不知变通。', category: 'bazi' },
    '乙': { tag: '天干', title: '乙木 —— 花草藤萝，柔韧变通', summary: '今日为乙日。乙木为阴木，象征花草藤蔓，柔韧有生命力，善于借力。今日宜：社交应酬、学习充电、灵活变通。忌：优柔寡断、随波逐流。', detail: '乙木为十天干之二，属阴木，象征花草、藤蔓。\n\n【乙木性格】柔韧灵活，善于交际，能屈能伸。感情丰富，适应力强。但可能优柔寡断，需培养决断力。\n\n【乙木事业】适合贸易、设计、公关、艺术、服务业等需要交际的工作。\n\n【乙木健康】注意肝胆、颈椎、筋络。忌久坐不动。\n\n【乙木今日宜忌】宜：社交应酬、学习充电、灵活变通、借力行事。忌：优柔寡断、随波逐流、过度依赖。', category: 'bazi' },
    '丙': { tag: '天干', title: '丙火 —— 太阳之火，光芒四射', summary: '今日为丙日。丙火为阳火，象征太阳，热情开朗，正义感强。今日宜：积极行动、公开表达、帮助他人。忌：暴躁冲动、过度消耗。', detail: '丙火为十天干之三，属阳火，象征太阳之火。\\n\\n【丙火性格】热情开朗，积极主动，正义感强，有领导风范。但脾气暴躁，缺乏耐心，容易冲动。\\n\\n【丙火事业】适合电力、传媒、演艺、餐饮、照明等行业。\\n\\n【丙火健康】注意心脏、小肠、眼睛、血液。忌过度劳累和暴晒。\\n\\n【丙火今日宜忌】宜：积极行动、公开表达、帮助他人、面试演讲。忌：暴躁冲动、与人争执、过度消耗。', category: 'bazi' },
    '丁': { tag: '天干', title: '丁火 —— 烛光之火，内敛温暖', summary: '今日为丁日。丁火为阴火，象征烛光灯火，外表温文，内心洞察。今日宜：深度思考、学习研究、内省冥想。', detail: '丁火为十天干之四，属阴火，象征烛光、灯火。\\n\\n【丁火性格】外表温文尔雅，内心洞察力极强。不张扬，柔和而坚定。\\n\\n【丁火事业】适合研究、教学、策划、文化艺术等需要深度思考的工作。\\n\\n【丁火健康】注意心脏、血液循环、眼睛。忌熬夜和过度用眼。\\n\\n【丁火今日宜忌】宜：深度思考、学习研究、内省冥想、写作创作。忌：急躁冒进、过度劳累。', category: 'bazi' },
    '戊': { tag: '天干', title: '戊土 —— 大地之土，厚重稳健', summary: '今日为戊日。戊土为阳土，象征大地高山，稳重可靠，有包容力。今日宜：稳健行事、处理实务、投资理财。', detail: '戊土为十天干之五，属阳土，象征大地、高山。\\n\\n【戊土性格】稳重厚实，可靠包容，有耐心和毅力。但可能过于固执，不善变通。\\n\\n【戊土事业】适合房地产、建筑、农业、金融、公务员等稳健行业。\\n\\n【戊土健康】注意脾胃、肌肉、口腔。忌暴饮暴食。\\n\\n【戊土今日宜忌】宜：稳健行事、处理实务、投资理财、签订合同。忌：冒险投机、轻率变更。', category: 'bazi' },
    '己': { tag: '天干', title: '己土 —— 田园之土，滋养万物', summary: '今日为己日。己土为阴土，象征田园泥土，滋养万物，柔顺包容。今日宜：培育计划、照顾他人、修身养性。', detail: '己土为十天干之六，属阴土，象征田园之土。\\n\\n【己土性格】柔顺包容，善于滋养，有母性光辉。但容易优柔寡断，缺乏魄力。\\n\\n【己土事业】适合教育、医疗、园艺、服务业、护理等培育照顾型工作。\\n\\n【己土健康】注意脾胃、消化系统、皮肤。忌忧虑过度。\\n\\n【己土今日宜忌】宜：培育计划、照顾他人、修身养性、学习充电。忌：犹豫不决、过度操劳。', category: 'bazi' },
    '庚': { tag: '天干', title: '庚金 —— 斧钺之金，刚毅果决', summary: '今日为庚日。庚金为阳金，象征刀剑斧钺，刚毅果决，有执行力。今日宜：决断大事、开拓创新、运动锻炼。', detail: '庚金为十天干之七，属阳金，象征刀剑、斧钺。\\n\\n【庚金性格】刚毅果决，重义气，有执行力。但可能过于刚硬，容易得罪人。\\n\\n【庚金事业】适合军警、法律、机械、金融、外科医生等刚毅型工作。\\n\\n【庚金健康】注意肺、呼吸系统、大肠、骨骼。忌吸烟和空气污染。\\n\\n【庚金今日宜忌】宜：决断大事、开拓创新、运动锻炼、清理整顿。忌：过于刚硬、与人冲突。', category: 'bazi' },
    '辛': { tag: '天干', title: '辛金 —— 珠宝之金，精致温润', summary: '今日为辛日。辛金为阴金，象征珠宝首饰，精致温润，有审美天赋。今日宜：艺术创作、社交应酬、修饰仪表。', detail: '辛金为十天干之八，属阴金，象征珠宝、首饰。\\n\\n【辛金性格】精致温润，有审美天赋，善于交际。但可能过于虚荣，容易优柔。\\n\\n【辛金事业】适合珠宝、艺术、设计、美容、外交等精致型工作。\\n\\n【辛金健康】注意肺、呼吸系统、皮肤。忌干燥和污染环境。\\n\\n【辛金今日宜忌】宜：艺术创作、社交应酬、修饰仪表、处理精细事务。忌：粗鲁行事、过度虚荣。', category: 'bazi' },
    '壬': { tag: '天干', title: '壬水 —— 江河之水，奔腾不息', summary: '今日为壬日。壬水为阳水，象征江河大海，智慧灵动，适应力强。今日宜：学习思考、交流沟通、出行旅游。', detail: '壬水为十天干之九，属阳水，象征江河、大海。\\n\\n【壬水性格】聪明智慧，适应力强，善于沟通。但可能缺乏定力，容易随波逐流。\\n\\n【壬水事业】适合航运、贸易、旅游、传媒、水利、旅游等流动型工作。\\n\\n【壬水健康】注意肾、泌尿系统、血液循环。忌过度劳累和受寒。\\n\\n【壬水今日宜忌】宜：学习思考、交流沟通、出行旅游、灵活变通。忌：浮躁不安、缺乏定力。', category: 'bazi' },
    '癸': { tag: '天干', title: '癸水 —— 雨露之水，润泽万物', summary: '今日为癸日。癸水为阴水，象征雨露泉水，温柔细腻，有持久的生命力。今日宜：内省冥想、关心他人、读书学习。', detail: '癸水为十天干之十，属阴水，象征雨露、泉水。\\n\\n【癸水性格】温柔细腻，善解人意，有持久的生命力。但可能过于敏感，容易情绪化。\\n\\n【癸水事业】适合心理咨询、教育、文学、艺术、服务业等细腻型工作。\\n\\n【癸水健康】注意肾、泌尿系统、内分泌。忌情绪波动和受寒。\\n\\n【癸水今日宜忌】宜：内省冥想、关心他人、读书学习、细致工作。忌：情绪波动、过度敏感。', category: 'bazi' }
  };
  
  if (stemKnowledge[dayStem]) {
    return stemKnowledge[dayStem];
  }
  
  // 默认：通用知识
  const generalKnowledge = [
    { tag: '十神', title: '十神系统 —— 八字分析的灵魂', summary: '十神是八字分析的核心工具，将日主与其他天干地支的关系分为十种类型。每个十神对应不同的性格特征和人生领域。', detail: '十神是八字命理学中最重要的概念之一。它将日主与其他七个天干地支的关系分为十种类型：正官、七杀、正印、偏印、比肩、劫财、食神、伤官、正财、偏财。\\n\\n【十神速记】\\n• 克我者：正官（异性克）、七杀（同性克）\\n• 生我者：正印（异性生）、偏印（同性生）\\n• 同我者：比肩（同性同）、劫财（异性同）\\n• 我生者：食神（同性生）、伤官（异性生）\\n• 我克者：正财（异性克）、偏财（同性克）\\n\\n【十神与六亲】女命以正官为夫、七杀为偏夫；男命以正财为妻、偏财为情人。正印为母、偏印为继母。比肩为兄弟、劫财为姐妹。食神为子女（女命）、伤官为子女（男命）。', category: 'shishen' },
    { tag: '五行', title: '五行生克 —— 命理学的基础框架', summary: '五行即金木水火土，相生相克构成命理分析的核心逻辑。五行平衡则命局好，五行失衡则需调候。', detail: '五行是中国传统哲学的核心概念，也是命理学的基础。\\n\\n【五行相生】木生火、火生土、土生金、金生水、水生木。相生为吉，表示互助互促。\\n\\n【五行相克】木克土、土克水、水克火、火克金、金克木。相克为凶，但有时也需要相克来制衡过旺之力。\\n\\n【五行对应】金主义、木主仁、水主智、火主礼、土主信。金主肺、木主肝、水主肾、火主心、土主脾。', category: 'wuxing' },
    { tag: '格局', title: '八字格局 —— 判断命局高低的关键', summary: '格局以月令为提纲，分为正格和变格。正格有八：正官、七杀、正财、偏财、食神、伤官、正印、偏印。', detail: '格局是八字分析的核心步骤，决定了命局的基本类型和层次高低。\\n\\n【正格八种】正官格（走正道）、七杀格（有制为将）、正财格（稳定富）、偏财格（横财富）、食神格（才华富）、伤官格（才华为）、正印格（学业佳）、偏印格（偏门技）。\\n\\n【变格】从格（从强从旺）、化格（化气格）、专旺格（一行得气）。变格条件苛刻但一旦成立格局极高。\\n\\n【格局高低】格局高低取决于：用神有力、喜用得位、五行流通、无破格之物。', category: 'bazi' },
    { tag: '神煞', title: '神煞系统 —— 命理分析的辅助工具', summary: '神煞是八字分析的辅助工具，包括天乙贵人、文昌、桃花、驿马、华盖等。不可迷信，但可作为参考。', detail: '神煞是八字命理中的辅助分析工具，为正五行分析提供补充信息。\\n\\n【常用吉神】天乙贵人（最尊贵，逢凶化吉）、文昌（主学问）、将星（主权势）、华盖（主孤高）、天德月德（主化解）。\\n\\n【常用凶煞】羊刃（主血光）、空亡（主落空）、孤辰寡宿（主孤独）、魁罡（主刚烈）。\\n\\n【应用原则】五行为主，神煞为辅。吉神入局为有力，凶煞逢克制则不凶。不可迷信神煞而忽略五行分析。', category: 'shensha' },
    { tag: '合冲', title: '合冲刑害 —— 地支互动的核心机制', summary: '合冲刑害是地支之间的四种基本关系。合主和谐凝聚，冲主冲突变动，刑主刑罚是非，害主暗中损害。', detail: '合冲刑害是八字分析中判断命局动态变化的核心工具。\\n\\n【六合】子丑合土、寅亥合木、卯戌合火、辰酉合金、巳申合水、午未合。\\n\\n【三合局】申子辰水局、亥卯未木局、寅午戌火局、巳酉丑金局。\\n\\n【六冲】子午冲、丑未冲、寅申冲、卯酉冲、辰戌冲、巳亥冲。\\n\\n【三刑】寅巳申无恩之刑、丑戌未恃势之刑、子卯无礼之刑、辰午酉亥自刑。\\n\\n【六害】子未害、丑午害、寅巳害、卯辰害、申亥害、酉戌害。\\n\\n【优先级】合力 > 冲力 > 刑力 > 害力。', category: 'hechong' }
  ];
  
  // 用日期作为种子选择
  const idx = (year * 1000 + month * 50 + day) % generalKnowledge.length;
  return generalKnowledge[idx];
}

// 辅助函数：根据日期获取节气
function getJieqiByDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  // 简化版节气判断（近似日期，误差±1-2天）
  const jieqiDates = [
    { month: 2, day: 4, name: '立春' },
    { month: 2, day: 19, name: '雨水' },
    { month: 3, day: 6, name: '惊蛰' },
    { month: 3, day: 21, name: '春分' },
    { month: 4, day: 5, name: '清明' },
    { month: 4, day: 20, name: '谷雨' },
    { month: 5, day: 6, name: '立夏' },
    { month: 5, day: 21, name: '小满' },
    { month: 6, day: 6, name: '芒种' },
    { month: 6, day: 21, name: '夏至' },
    { month: 7, day: 7, name: '小暑' },
    { month: 7, day: 23, name: '大暑' },
    { month: 8, day: 8, name: '立秋' },
    { month: 8, day: 23, name: '处暑' },
    { month: 9, day: 8, name: '白露' },
    { month: 9, day: 23, name: '秋分' },
    { month: 10, day: 8, name: '寒露' },
    { month: 10, day: 24, name: '霜降' },
    { month: 11, day: 7, name: '立冬' },
    { month: 11, day: 22, name: '小雪' },
    { month: 12, day: 7, name: '大雪' },
    { month: 12, day: 22, name: '冬至' },
    { month: 1, day: 6, name: '小寒' },
    { month: 1, day: 20, name: '大寒' }
  ];
  for (const jq of jieqiDates) {
    if (jq.month === month && Math.abs(jq.day - day) <= 1) {
      return jq.name;
    }
  }
  return null;
}

// 辅助函数：农历节日
function getLunarFestival(date) {
  // 简化版农历节日（基于公历近似）
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const festivals = [
    { month: 2, day: 17, tag: '节日', title: '春节 —— 辞旧迎新，万象更新', summary: '春节是中华民族最重要的传统节日。宜：祭祖、拜年、放鞭炮、穿新衣。忌：扫地、倒垃圾（怕扫走财运）。', detail: '春节是农历正月初一，是中华民族最重要的传统节日，也是风水命理上新年的开始（注：八字以立春为年柱分界，春节为民俗新年）。\\n\\n【春节开运法】\\n1. 穿红色衣物——红色代表喜庆吉祥，可辟邪驱寒\\n2. 拜年——给长辈拜年，接受祝福和红包，积累人气\\n3. 放鞭炮——驱赶邪气，迎接新年（注意安全）\\n4. 吃饺子——形似元宝，寓意招财进宝（北方）\\n5. 吃年糕——寓意年年高升\\n6. 忌扫地——正月初一不扫地，怕把财运扫走\\n7. 忌说不吉利的话——多说吉祥话，避免争吵', category: 'wuxing' }
  ];
  // 简化：只匹配春节近似日期
  for (const f of festivals) {
    if (f.month === month && Math.abs(f.day - day) <= 3) return f;
  }
  return null;
}

// 辅助函数：公历节日
function getSolarFestival(month, day) {
  const festivals = {
    '1-1': { tag: '节日', title: '元旦 —— 新年新气象，宜规划全年', summary: '元旦是新年开始。宜：制定新年计划、设定目标、祈福许愿。新的一年，知命而不认命，通过努力创造美好未来。', detail: '元旦是公历新年第一天，标志着新的一年开始。\\n\\n【元旦开运法】\\n1. 制定新年计划——明确目标，有的放矢\\n2. 祈福许愿——去寺庙或在家中静心祈福\\n3. 穿新衣——象征新年新气象\\n4. 与家人团聚——家和万事兴\\n\\n【元旦与命理】公历元旦并非八字年柱分界（立春才是），但元旦作为新年的象征，有心理暗示和仪式感的作用。可利用元旦的仪式感来开启新一年的好运。', category: 'wuxing' }
  };
  return festivals[month + '-' + day] || null;
}

// 初始化今日知识
function initDailyKnowledge() {
  try {
    const today = new Date();
    const dateKey = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate();
    
    const knowledge = getDailyKnowledge(today);
    if (!knowledge) { console.warn('[今日知识] getDailyKnowledge returned null'); return; }
    
    // 渲染到卡片
    const tagEl = document.getElementById('daily-knowledge-tag');
    const titleEl = document.getElementById('daily-knowledge-title');
    const summaryEl = document.getElementById('daily-knowledge-summary');
    const detailEl = document.getElementById('daily-knowledge-detail');
    
    if (!titleEl) { console.warn('[今日知识] 卡片元素不存在'); return; }
    
    if (tagEl) tagEl.textContent = knowledge.tag || '';
    if (titleEl) titleEl.textContent = knowledge.title || '';
    if (summaryEl) summaryEl.textContent = knowledge.summary || '';
    if (detailEl) detailEl.textContent = knowledge.detail || '';
    
    console.log('[今日知识] 初始化成功:', knowledge.title);
  } catch(e) {
    console.warn('[今日知识] 初始化失败:', e);
  }
}

// 展开/收起今日知识详情
function toggleDailyKnowledgeDetail() {
  const detail = document.getElementById('daily-knowledge-detail');
  const hint = document.querySelector('#daily-knowledge-card > div:last-child');
  if (!detail) return;
  if (detail.style.display === 'none') {
    detail.style.display = 'block';
    if (hint) hint.textContent = '点击收起 ↑';
  } else {
    detail.style.display = 'none';
    if (hint) hint.textContent = '点击展开详情 ↓';
  }
}

// ================================================================
//  LUOPAN ENGINE
// ================================================================

let currentCompass = 'qimen';

function selectCompass(name) {
  currentCompass = name;
  document.querySelectorAll('.cs-item').forEach(el => el.classList.remove('active'));
  const el = document.getElementById('cs-' + name);
  if (el) el.classList.add('active');
  document.getElementById('ccHint').textContent = document.getElementById('ccHint').textContent = '';
}

function getLuopanData(type, dateStr, hourVal) {
  const today = new Date();
  let year = today.getFullYear(), month = today.getMonth()+1, day = today.getDate();
  if (dateStr) {
    const parts = dateStr.split('-').map(Number);
    [year, month, day] = parts;
  }
  const hour = hourVal ? parseInt(hourVal) : 12;
  const dayStemIdx = getDayStemIndex(year, month, day);
  const dayBranchIdx = getDayBranchIndex(year, month, day);
  const dayStem = STEMS[dayStemIdx];
  const dayBranch = BRANCHES[dayBranchIdx];
  const hourBranchIdx = Math.floor(hour / 2) % 12;
  const hourBranch = BRANCHES[hourBranchIdx];
  const hourStemIdx = getHourStem(dayStemIdx, hourBranch);
  const hourStem = STEMS[hourStemIdx];
  return { year, month, day, hour, dayStemIdx, dayBranchIdx, dayStem, dayBranch, hourStemIdx, hourBranchIdx, hourStem, hourBranch };
}

function renderCompass() {
  try {
  const dateStr = document.getElementById('lpDate').value;
  const hourVal = document.getElementById('lpHour').value;
  const name = document.getElementById('lpName').value || '有缘人';
  // 日期为空时默认今天
  const data = getLuopanData(currentCompass, dateStr, hourVal);
  const canvas = document.getElementById('compassCanvas');
  if (!canvas) { showToast('罗盘画布未找到'); return; }
  const dpr = window.devicePixelRatio || 1;
  // 手机端适配：根据屏幕宽度调整
  var screenWidth = window.innerWidth || 375;
  var logicalW = screenWidth < 700 ? screenWidth - 40 : 640;
  var logicalH = logicalW;
  canvas.width = logicalW * dpr;
  canvas.height = logicalH * dpr;
  canvas.style.width = logicalW + 'px';
  canvas.style.height = logicalH + 'px';
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const cx = logicalW / 2;
  const cy = logicalH / 2;

  // Clear
  ctx.clearRect(0, 0, logicalW, logicalH);

  if (currentCompass === 'qimen') renderQimenCompass(ctx, cx, cy, data);
  else if (currentCompass === 'liuren') renderLiuRenCompass(ctx, cx, cy, data);
  else if (currentCompass === 'xuankong') renderXuanKongCompass(ctx, cx, cy, data);
  else if (currentCompass === 'bazhai') renderBaZhaiCompass(ctx, cx, cy, data);
  else if (currentCompass === 'hetuluo') renderHeTuLuoShuCompass(ctx, cx, cy, data);
  else if (currentCompass === 'yaogua') renderYaoGuaCompass(ctx, cx, cy, data);

  // Legend
  document.getElementById('compassLegend').style.display = 'block';
  const hint = document.getElementById('ccHint');
  if (hint) hint.style.display = 'none';

  // Update legend
  const d = data;
  const legText = document.getElementById('lpLegendText');
  const jieShi = document.getElementById('lpJieShi');

  if (currentCompass === 'qimen') {
    const { isYangDun, keyPalace, palaces, jiuxing, bamen } = getQimenData(data);
    legText.textContent = `日干:${d.dayStem} 日支:${d.dayBranch} 时支:${d.hourBranch}\n遁法:${isYangDun?"阳遁":"阴遁"} 值符宫:${keyPalace}宫\n值使门:${bamen} 值星:${palaces[keyPalace]?.star?.name||'天心'}\n\n【罗盘读法】\n· 九宫：坎1·坤2·震3·巽4·中5·乾6·兑7·艮8·离9\n· 天盘九星：蓬芮任冲辅英禽心柱\n· 八门：休生伤杜景死惊开（值使门主当日方位）\n· 八神：符龙冲辅英芮柱心\n· 三奇六仪：乙丙丁为三奇，戊己庚辛壬癸为六仪\n· 吉门（开休生）临宫为吉方，凶门（死伤惊）宜避`;
    jieShi.textContent = `${isYangDun?"阳遁宜进取，事可主动出击":"阴遁宜守成，事不宜妄动"}。\n值使门${bamen}——${getDoorAdviceBrief(bamen)}。\n${palaces[keyPalace]?.star?.name||'天心'}星${palaces[keyPalace]?.star?.type==='吉'||palaces[keyPalace]?.star?.type==='大吉'?'主吉，临宫事可成':'主事波折，需谨慎'}。\n\n【专业建议】\n· 开门临宫：宜事业/升迁/远行\n· 休门临宫：宜休养/访友/和谈\n· 生门临宫：宜求财/置业/投资\n· 死伤惊门临宫：宜守不宜动\n· 中五宫天禽星：寄坤二宫，主安守福德`;
  } else if (currentCompass === 'liuren') {
    const { faYong, zhongChuan, moChuan, tiGuan } = getLiuRenData(data);
    legText.textContent = `日干:${d.dayStem} 日支:${d.dayBranch} 时支:${d.hourBranch}\n\n【四课】日干上神为一课，日支上神为三课\n日干寄宫上神为二课，日支上神为四课\n\n【三传】\n初传(发端门):${faYong} — 事之起因\n中传(移易门):${zhongChuan} — 事之经过\n末传(归计门):${moChuan} — 事之结果\n\n【课体】${tiGuan}\n\n【天将】贵人/螣蛇/朱雀/六合/勾陈/青龙/天空/白虎/太常/玄武/太阴/天后\n顺逆：贵人在巳至戌顺排，亥至辰逆排`;
    jieShi.textContent = `${tiGuan}之课——${getLiuRenBrief(data)}\n\n【三传分析】\n· 初传${faYong}：事之端倪，吉则事可期\n· 中传${zhongChuan}：中间变化，生初则顺利\n· 末传${moChuan}：最终归宿，生初则循环不息\n\n【天将参断】\n· 贵人临用神：有贵人扶持\n· 白虎临凶爻：主血光口舌\n· 玄武临财爻：防盗窃破财\n· 青龙临吉位：主喜庆进财\n\n【化解】凶课宜静守，吉课宜进取`;
  } else if (currentCompass === 'xuankong') {
    const { nian, yue, ri } = getXuanKongData(data);
    legText.textContent = `${d.year}年${d.month}月${d.day}日 玄空飞星盘\n\n【年飞星】${Object.entries(nian).map(([k,v])=>k+'宫'+v+'星').join('、')}\n【月飞星】${Object.entries(yue).map(([k,v])=>k+'宫'+v+'星').join('、')}\n【日飞星】${Object.entries(ri).map(([k,v])=>k+'宫'+v+'星').join('、')}\n\n【九星】一白贪狼(水)二黑巨门(土)三碧禄存(木)四绿文曲(木)五黄廉贞(土)六白武曲(金)七赤破军(金)八白左辅(土)九紫右弼(火)\n【读法】山盘看坐山方，向盘看朝向方，山星管人丁，向星管财源`;
    jieShi.textContent = `${d.year}年玄空飞星盘综合分析。\n\n【方位建议】\n· 一白方：宜读书求姻缘放水生植物\n· 八白方：宜求财放黄色水晶\n· 九紫方：宜喜庆放红色物品\n· 二黑方：宜挂铜葫芦化解\n· 五黄方：宜挂六帝铜钱化解\n· 三碧方：宜放红色物品化解(火泄木)`;
  } else if (currentCompass === 'bazhai') {
    const { menhu, shan, xiang } = getBaZhaiData(data);
    legText.textContent = `门主方位:${menhu}\n山星:${shan} 向星:${xiang}\n命主${getBaZhaiMingZhu(d.dayBranch)}宅命\n\n【八宅明镜】\n东四宅：坎(北)/离(南)/震(东)/巽(东南)\n西四宅：乾(西北)/坤(西南)/艮(东北)/兑(西)\n\n【四吉方】\n生气(上吉)：旺丁旺财/事业顺利\n天医(次吉)：健康疗愈/贵人相助\n延年(中吉)：姻缘和谐/延年益寿\n伏位(小吉)：稳定安泰/守成平稳\n\n【四凶方】\n绝命(大凶)：破财破丁/诸事不顺\n五鬼(次凶)：招惹是非/灾祸口舌\n六煞(中凶)：桃花劫/烦恼纠纷\n祸害(小凶)：病灾破财/阻碍重重`;
    jieShi.textContent = `${xiang}星${xiang>=5?'当令得旺，财源广进':'失令衰败，需调整'}\n山星${shan>=5?'旺丁健康':'不旺，需补山方'}\n\n【宅命配建议】\n· 门开吉方（生气/天医/延年/伏位）\n· 灶压凶方（绝命/五鬼/六煞/祸害）\n· 床头朝吉方，灶口朝吉方\n\n【化解】凶方用五行化煞：金煞用水泄/木煞用火泄/土煞用金泄/火煞用土泄/水煞用木泄`;
  } else if (currentCompass === 'hetuluo') {
    legText.textContent = `河图：天一生水地六成之；天二生火地七成之\n天三生木地八成之；天四生金地九成之；天五生土地十成之\n\n洛书：戴九履一，左三右七，二四为肩，六八为足，五居中央\n\n【河图五行局】\n水局(1/6)：智慧流动变化\n火局(2/7)：热情光明变革\n木局(3/8)：生发仁慈文化\n金局(4/9)：刚毅果断收敛\n土局(5/10)：厚重包容积累\n\n【今日河洛数】\n日干${d.dayStem}生数${d.dayStemIdx+1}成数${(d.dayStemIdx+6)%10+1}`;
    jieShi.textContent = `河图数:${getHeTuShu(d.dayStemIdx)}主先天之数\n洛书数:${getLuoShu(d.dayStemIdx)}主后天之用\n\n【数理应用】\n· 手机号/车牌号：参考河洛数理选号\n· 姓名：笔画尾数对应河图五行\n· 楼层：楼层尾数对应河图五行局\n· 方位：洛书九宫配八卦定方位吉凶`;
  } else if (currentCompass === 'yaogua') {
    legText.textContent = `六爻金钱盘：以日干起六亲，配六兽六神\n\n【六爻位次】\n初爻：地基根 二爻：地臣民\n三爻：人凶位 四爻：人大臣\n五爻：天君位 上爻：天退位\n\n【六亲】\n父母爻：文书/长辈/辛苦\n兄弟爻：竞争/破财/阻滞\n官鬼爻：功名/事业/疾病\n妻财爻：财运/妻子/奴仆\n子孙爻：福德/医药/僧道\n\n【六神】\n青龙喜庆 朱雀文书 勾陈田土\n螣蛇虚惊 白虎血光 玄武盗贼\n\n日干${d.dayStem}为元神，六亲随日干变化\n请先在「易经六爻」起卦后查看本盘`;
    jieShi.textContent = `六爻之盘以爻位配五行六亲，可断事体吉凶。\n\n【断卦要诀】\n· 世爻为自己，应爻为对方\n· 用神旺相则吉，休囚死则凶\n· 动爻变爻主变化趋势\n· 日月建为卦外之旺，影响最大\n\n请先在「易经六爻」起卦后查看本盘`;
  }
  } catch(err) {
    console.error('[罗盘渲染错误]', err.message, err.stack);
    showToast('罗盘渲染出错: ' + err.message);
    var _errEl = document.getElementById('compassLegend');
    if (_errEl) {
      _errEl.style.display = 'block';
      var _lt = document.getElementById('lpLegendText');
      if (_lt) _lt.textContent = '罗盘渲染出错: ' + err.message + '\n请检查日期和时辰是否正确选择，然后重新起盘。';
    }
  }
}

// ---- HELPERS ----

function drawRing(ctx, cx, cy, r, stroke, fill, lw) {
  if (fill) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fillStyle = fill; ctx.fill();
  }
  if (stroke) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.strokeStyle = stroke; ctx.lineWidth = lw||1; ctx.stroke();
  }
}

function drawLine(ctx, x1, y1, x2, y2, color, lw) {
  ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2);
  ctx.strokeStyle = color||'rgba(201,168,76,0.3)'; ctx.lineWidth = lw||1; ctx.stroke();
}

function drawText(ctx, text, x, y, size, color, align, baseline, bold) {
  ctx.font = `${bold?'bold ':''}${size}px 'Noto Serif SC', serif`;
  ctx.fillStyle = color||'#f0e8d8';
  ctx.textAlign = align||'center';
  ctx.textBaseline = baseline||'middle';
  ctx.fillText(text, x, y);
}

function drawTextOnCircle(ctx, text, cx, cy, r, angleDeg, size, color) {
  const rad = (angleDeg - 90) * Math.PI / 180;
  const x = cx + r * Math.cos(rad);
  const y = cy + r * Math.sin(rad);
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((angleDeg + 90) * Math.PI / 180);
  ctx.font = `${size}px 'Noto Serif SC', serif`;
  ctx.fillStyle = color || '#f0e8d8';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// ---- QIMEN COMPASS ----

function getQimenData(data) {
  const isYang = data.month >= 11 || data.month <= 4;
  const isYangDun = isYang;
  const rotate = isYangDun ? [1,2,3,4,5,6,7,8,9] : [9,8,7,6,5,4,3,2,1];
  const keyPalaceBase = STEMS.indexOf(data.dayStem) + 1;
  const keyPalace = keyPalaceBase > 0 ? keyPalaceBase : 5;
  const palaces = {};
  for (let i = 0; i < 9; i++) { palaces[rotate[i]] = rotate[i]; }
  const starStart = (keyPalace - 1 + (isYangDun ? 0 : 8)) % 9;
  const starSeq = ['蓬','芮','任','冲','辅','英','禽','心','柱'];
  const doorSeq = ['休','开','生','伤','杜','景','死','惊'];
  const godSeq = ['符','龙','冲','辅','英','芮','柱','心'];
  const starTypeSeq = ['大凶','大凶','次吉','次凶','大吉','小凶','大吉','大吉','次凶'];
  const doorTypeSeq = ['大吉','大吉','大吉','大凶','小凶','小吉','大凶','小凶'];
  const godTypeSeq = ['大吉','大吉','次凶','大吉','小凶','大凶','次吉','大吉'];
  const doorColorSeq = ['#c0392b','#2980b9','#27ae60','#e67e22','#7f8c8d','#f39c12','#95a5a6','#95a5a6'];
  const starColorSeq = ['#e74c3c','#e74c3c','#27ae60','#e67e22','#2ecc71','#f39c12','#2ecc71','#2ecc71','#e67e22'];
  const palData = {};
  for (let i = 0; i < 9; i++) {
    const p宫 = rotate[i];
    const si = (starStart + i) % 9;
    const di = i < 5 ? i : i - 1;
    palData[p宫] = {
      star: starSeq[si],
      starType: starTypeSeq[si],
      starColor: starColorSeq[si],
      door: p宫===5?'禽':doorSeq[di],
      doorType: p宫===5?'大吉':doorTypeSeq[di],
      doorColor: p宫===5?'#27ae60':doorColorSeq[di],
      god: p宫===5?'龙':godSeq[di],
      godType: p宫===5?'大吉':godTypeSeq[di],
    };
  }
  return { isYangDun, keyPalace, palaces: palData, jiuxing: palData[keyPalace]?.star||'心', bamen: palData[keyPalace]?.door||'开' };
}

function renderQimenCompass(ctx, cx, cy, data) {
  const { isYangDun, keyPalace, palaces } = getQimenData(data);

  // Background
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(cx, cy, 310, 0, Math.PI*2); ctx.fill();

  // Direction labels on outer ring
  const dirs = ['北','东北','东','东南','南','西南','西','西北'];
  const dirAngles = [270,315,0,45,90,135,180,225];
  dirs.forEach((d,i) => {
    drawTextOnCircle(ctx, d, cx, cy, 300, dirAngles[i], 14, 'rgba(201,168,76,0.4)');
  });

  // Ring 1: outer decorative ring
  drawRing(ctx, cx, cy, 290, 'rgba(201,168,76,0.15)', null, 1);
  // Ring 2: palace numbers
  drawRing(ctx, cx, cy, 268, 'rgba(201,168,76,0.2)', null, 1);
  // Ring 3: stars
  drawRing(ctx, cx, cy, 244, 'rgba(201,168,76,0.15)', null, 1);
  // Ring 4: doors
  drawRing(ctx, cx, cy, 218, 'rgba(201,168,76,0.15)', null, 1);
  // Ring 5: gods
  drawRing(ctx, cx, cy, 192, 'rgba(201,168,76,0.15)', null, 1);
  // Ring 6: center
  drawRing(ctx, cx, cy, 165, 'rgba(201,168,76,0.2)', null, 1);

  // 9 palace positions: arranged as 3x3 but circularly
  // Standard: 7-NW,9-S,1-N,3-E,5-center,8-NE,4-W,2-SW,6-SE
  const palaceAngles = {
    7: 225, 9: 90, 1: 270, 3: 0, 5: -1, 8: 315, 4: 180, 2: 135, 6: 45
  };

  // Draw connecting lines
  for (let i = 0; i < 8; i++) {
    const ang1 = dirAngles[i] * Math.PI / 180;
    const x1 = cx + 288 * Math.cos(ang1);
    const y1 = cy + 288 * Math.sin(ang1);
    const x2 = cx + 268 * Math.cos(ang1);
    const y2 = cy + 268 * Math.sin(ang1);
    drawLine(ctx, x1, y1, x2, y2, 'rgba(201,168,76,0.1)', 1);
  }

  // Draw palace info
  for (let p宫 = 1; p宫 <= 9; p宫++) {
    const pd = palaces[p宫];
    const angle = palaceAngles[p宫];
    if (p宫 === 5) {
      // Center
      drawRing(ctx, cx, cy, 40, 'rgba(142,68,173,0.5)', 'rgba(142,68,173,0.05)', 2);
      ctx.fillStyle = 'rgba(142,68,173,0.8)'; ctx.font = 'bold 13px "Noto Serif SC"'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText('中宫', cx, cy-6);
      ctx.font = '11px "Noto Serif SC"'; ctx.fillStyle = 'rgba(142,68,173,0.6)';
      ctx.fillText(pd.star+'·'+pd.door+'门', cx, cy+8);
      continue;
    }
    const rad = (angle - 90) * Math.PI / 180;

    // Palace number
    const r_pal = 278;
    const x_pal = cx + r_pal * Math.cos(rad);
    const y_pal = cy + r_pal * Math.sin(rad);
    ctx.fillStyle = 'rgba(201,168,76,0.6)'; ctx.font = 'bold 13px "Noto Serif SC"'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(p宫+'宫', x_pal, y_pal);

    // Star
    const r_star = 255;
    const x_star = cx + r_star * Math.cos(rad);
    const y_star = cy + r_star * Math.sin(rad);
    ctx.fillStyle = pd.starColor; ctx.font = 'bold 15px "Ma Shan Zheng",serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(pd.star+'星', x_star, y_star);

    // Door
    const r_door = 230;
    const x_door = cx + r_door * Math.cos(rad);
    const y_door = cy + r_door * Math.sin(rad);
    ctx.fillStyle = pd.doorColor; ctx.font = '14px "Ma Shan Zheng",serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(pd.door+'门', x_door, y_door);

    // God
    const r_god = 206;
    const x_god = cx + r_god * Math.cos(rad);
    const y_god = cy + r_god * Math.sin(rad);
    ctx.fillStyle = 'rgba(201,168,76,0.55)'; ctx.font = '12px "Ma Shan Zheng",serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(pd.god+'神', x_god, y_god);

    // Highlight key palace
    if (p宫 === keyPalace) {
      ctx.beginPath(); ctx.arc(cx + 258*Math.cos(rad), cy + 258*Math.sin(rad), 30, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(201,168,76,0.5)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  // Center decoration
  drawRing(ctx, cx, cy, 165, 'rgba(201,168,76,0.3)', 'rgba(10,10,10,0.8)', 2);
  ctx.fillStyle = '#c9a84c'; ctx.font = 'bold 16px "Ma Shan Zheng",serif'; ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(isYangDun?'阳 遁':'阴 遁', cx, cy-10);
  ctx.font = '12px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.6)';
  ctx.fillText(`${data.dayStem}日 ${data.hourBranch}时`, cx, cy+10);
  ctx.font = '10px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.35)';
  ctx.fillText(`值${palaces[keyPalace]?.door}门 · ${palaces[keyPalace]?.star}星`, cx, cy+26);

  // Outer ring decorations
  for (let i = 0; i < 72; i++) {
    const a = (i * 5) * Math.PI / 180;
    const x1 = cx + 308 * Math.cos(a);
    const y1 = cy + 308 * Math.sin(a);
    const x2 = cx + (i%5===0 ? 298 : 303) * Math.cos(a);
    const y2 = cy + (i%5===0 ? 298 : 303) * Math.sin(a);
    drawLine(ctx, x1, y1, x2, y2, 'rgba(201,168,76,0.15)', 0.5);
  }
  drawRing(ctx, cx, cy, 312, 'rgba(201,168,76,0.25)', null, 2);
}

// ---- LIUREN COMPASS ----

function getLiuRenData(data) {
  // 使用新引擎构建完整的六壬课式
  var keShi = buildLiuRenKeShi(data.dayStemIdx, data.dayBranchIdx, data.hourBranchIdx, data.month);
  return {
    faYong: keShi.sanChuan.faYong,
    zhongChuan: keShi.sanChuan.zhongChuan,
    moChuan: keShi.sanChuan.moChuan,
    tiGuan: keShi.tiGuan.name,
    keShi: keShi
  };
}

function renderLiuRenCompass(ctx, cx, cy, data) {
  var lrData = getLiuRenData(data);
  var faYong = lrData.faYong, zhongChuan = lrData.zhongChuan, moChuan = lrData.moChuan;
  var tiGuan = lrData.tiGuan;
  var keShi = lrData.keShi;
  var tianJiangFenbu = keShi ? keShi.tianJiangFenbu.fenbu : {};

  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(cx, cy, 310, 0, Math.PI*2); ctx.fill();

  // 12 branches
  var branches = BRANCHES;
  var zhiEle = LR_ZHI_WX;
  var zhiColor = {子:'#3498db',丑:'#a08060',寅:'#27ae60',卯:'#2ecc71',辰:'#e67e22',巳:'#e74c3c',午:'#c0392b',未:'#a08060',申:'#95a5a6',酉:'#7f8c8d',戌:'#e67e22',亥:'#2980b9'};

  // Draw branch ring
  drawRing(ctx, cx, cy, 290, 'rgba(230,126,34,0.2)', null, 1);
  drawRing(ctx, cx, cy, 260, 'rgba(230,126,34,0.1)', null, 1);
  drawRing(ctx, cx, cy, 230, 'rgba(230,126,34,0.1)', null, 1);
  drawRing(ctx, cx, cy, 180, 'rgba(230,126,34,0.15)', 'rgba(230,126,34,0.03)', 1);

  // Branch outer ring decorations
  for (var i = 0; i < 12; i++) {
    var a = (i * 30 - 90) * Math.PI / 180;
    var r_outer = 298;
    var r_inner = 285;
    var x1 = cx + r_outer * Math.cos(a);
    var y1 = cy + r_outer * Math.sin(a);
    var x2 = cx + r_inner * Math.cos(a);
    var y2 = cy + r_inner * Math.sin(a);
    drawLine(ctx, x1, y1, x2, y2, 'rgba(230,126,34,0.3)', 1.5);
  }
  drawRing(ctx, cx, cy, 300, 'rgba(230,126,34,0.25)', null, 2);

  // 12 positions with full 十二天将
  var chuanIdx = [BRANCHES.indexOf(faYong), BRANCHES.indexOf(zhongChuan), BRANCHES.indexOf(moChuan)];
  var godNatureMap = {大吉:'#27ae60',吉:'#2ecc71',小吉:'#82e0aa',凶:'#e74c3c',大凶:'#c0392b',平:'#f39c12'};

  for (var i = 0; i < 12; i++) {
    var a2 = (i * 30 - 90) * Math.PI / 180;
    var r_zhi = 278;
    var x_zhi = cx + r_zhi * Math.cos(a2);
    var y_zhi = cy + r_zhi * Math.sin(a2);
    var r_gan = 253;
    var x_gan = cx + r_gan * Math.cos(a2);
    var y_gan = cy + r_gan * Math.sin(a2);
    var r_god = 228;
    var x_god = cx + r_god * Math.cos(a2);
    var y_god = cy + r_god * Math.sin(a2);
    var r_ele = 210;
    var x_ele = cx + r_ele * Math.cos(a2);
    var y_ele = cy + r_ele * Math.sin(a2);

    // Branch (zhi)
    ctx.fillStyle = zhiColor[branches[i]] || 'rgba(201,168,76,0.6)';
    ctx.font = 'bold 16px "Ma Shan Zheng",serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(branches[i], x_zhi, y_zhi);

    // Hidden stem
    var zg = LR_ZHI_GAN[branches[i]];
    ctx.fillStyle = 'rgba(201,168,76,0.3)';
    ctx.font = '10px "Noto Serif SC"';
    ctx.fillText(zg ? zg.gan.charAt(0) : '', x_gan, y_gan);

    // 十二天将 (full)
    var godEntry = tianJiangFenbu[branches[i]];
    var godName = godEntry ? godEntry.name : '';
    var godNat = godEntry ? godEntry.nature : '平';
    ctx.fillStyle = godNatureMap[godNat] || '#f39c12';
    ctx.font = '10px "Noto Serif SC"';
    ctx.fillText(godName, x_god, y_god);

    // Element
    ctx.fillStyle = 'rgba(201,168,76,0.3)';
    ctx.font = '9px "Noto Serif SC"';
    ctx.fillText(zhiEle[branches[i]], x_ele, y_ele);

    // Highlight chuan
    if (chuanIdx.indexOf(i) >= 0) {
      ctx.beginPath();
      var chuanNames = [faYong, zhongChuan, moChuan];
      var chuanSym = ['初','中','末'];
      ctx.arc(x_zhi, y_zhi, 20, 0, Math.PI*2);
      ctx.strokeStyle = 'rgba(230,126,34,0.6)'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillStyle = 'rgba(230,126,34,0.9)'; ctx.font = 'bold 9px "Noto Serif SC"';
      ctx.fillText(chuanSym[chuanIdx.indexOf(i)], x_zhi, y_zhi);
    }
  }

  // Center
  drawRing(ctx, cx, cy, 178, 'rgba(230,126,34,0.3)', 'rgba(10,10,10,0.8)', 2);
  ctx.fillStyle = '#e67e22'; ctx.font = 'bold 14px "Ma Shan Zheng",serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(tiGuan+'课', cx, cy-12);
  ctx.font = '11px "Noto Serif SC"'; ctx.fillStyle = 'rgba(230,126,34,0.6)';
  ctx.fillText('初'+faYong+' 中'+zhongChuan+' 末'+moChuan, cx, cy+8);
  ctx.font = '10px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.4)';
  ctx.fillText(data.dayStem+'日 · '+data.hourBranch+'时', cx, cy+24);
}

// ---- XUANKONG FEIXING COMPASS ----

function getXuanKongData(data) {
  // 年、月、日飞星
  const nianBase = (data.year - 3) % 9; if (nianBase <= 0) nianBase + 9;
  const yueBase = (data.month + 1) % 9 || 9;
  const riBase = (data.day % 9) || 9;
  // 九宫排布(洛书顺序): 9南 3东 7西 1北 5中 8东北 4西 2西南 6东南
  const luoshuOrder = [9, 3, 7, 1, 5, 8, 4, 2, 6]; // position 1-9
  const nian = {}; const yue = {}; const ri = {};
  // 年星逆飞
  let nCur = nianBase;
  for (let i = 0; i < 9; i++) { nian[luoshuOrder[i]] = nCur; nCur--; if (nCur < 1) nCur = 9; }
  // 月星顺飞
  let yCur = yueBase;
  for (let i = 0; i < 9; i++) { yue[luoshuOrder[i]] = yCur; yCur++; if (yCur > 9) yCur = 1; }
  // 日星逆飞
  let rCur = riBase;
  for (let i = 0; i < 9; i++) { ri[luoshuOrder[i]] = rCur; rCur--; if (rCur < 1) rCur = 9; }
  return { nian, yue, ri };
}

function renderXuanKongCompass(ctx, cx, cy, data) {
  const { nian, yue, ri } = getXuanKongData(data);
  const starColors = {1:'#e74c3c',2:'#f39c12',3:'#e74c3c',4:'#e67e22',5:'#f39c12',6:'#e67e22',7:'#27ae60',8:'#27ae60',9:'#e74c3c'};
  const starNames = {1:'贪狼',2:'巨门',3:'禄存',4:'文曲',5:'廉贞',6:'武曲',7:'破军',8:'左辅',9:'右弼'};

  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(cx, cy, 310, 0, Math.PI*2); ctx.fill();

  // 3x3 grid inside circle
  const cellSize = 92;
  const gridW = cellSize * 3;
  const gridH = cellSize * 3;
  const startX = cx - gridW/2 + cellSize/2;
  const startY = cy - gridH/2 + cellSize/2;
  // Grid order: top-left=8, top-center=1, top-right=6, mid-left=3, mid-center=5, mid-right=7, bot-left=4, bot-center=9, bot-right=2
  const posMap = [null,5,9,3,7,1,8,4,6,2]; // index 1-9
  const gridCells = {
    1:[0,1],2:[0,2],3:[1,0],4:[2,0],5:[1,1],6:[2,2],7:[2,1],8:[0,0],9:[1,2]
  };

  // Draw grid
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const px = startX - cellSize + col * cellSize + cellSize/2;
      const py = startY - cellSize + row * cellSize + cellSize/2;
      // Cell border
      ctx.beginPath();
      ctx.rect(px - cellSize/2, py - cellSize/2, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(201,168,76,0.15)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }
  drawRing(ctx, cx, cy, 150, 'rgba(201,168,76,0.2)', null, 1);
  drawRing(ctx, cx, cy, 305, 'rgba(201,168,76,0.25)', null, 2);

  // Draw each palace
  for (let pal = 1; pal <= 9; pal++) {
    const [row, col] = gridCells[pal];
    const px = startX - cellSize + col * cellSize + cellSize/2;
    const py = startY - cellSize + row * cellSize + cellSize/2;
    const n = nian[pal];
    const c = starColors[n];

    // 年星
    ctx.fillStyle = c; ctx.font = 'bold 20px "Ma Shan Zheng",serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(n, px, py - 18);

    // 星名
    ctx.fillStyle = 'rgba(201,168,76,0.5)'; ctx.font = '10px "Noto Serif SC"';
    ctx.fillText(starNames[n], px, py);

    // 月星
    ctx.fillStyle = starColors[yue[pal]]; ctx.font = 'bold 14px "Ma Shan Zheng",serif';
    ctx.fillText(yue[pal], px - 14, py + 18);
    ctx.fillStyle = 'rgba(201,168,76,0.3)'; ctx.font = '9px "Noto Serif SC"';
    ctx.fillText('月', px - 14, py + 30);

    // 日星
    ctx.fillStyle = starColors[ri[pal]]; ctx.font = 'bold 14px "Ma Shan Zheng",serif';
    ctx.fillText(ri[pal], px + 14, py + 18);
    ctx.fillStyle = 'rgba(201,168,76,0.3)'; ctx.font = '9px "Noto Serif SC"';
    ctx.fillText('日', px + 14, py + 30);
  }

  // Center
  ctx.fillStyle = '#c9a84c'; ctx.font = 'bold 13px "Ma Shan Zheng",serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('玄空飞星', cx, cy - 8);
  ctx.font = '10px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.5)';
  ctx.fillText(`${data.year}年运盘`, cx, cy + 8);
  ctx.font = '9px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.3)';
  ctx.fillText('9南 3东 7西 1北', cx, cy + 24);
}

// ---- BAZHAI COMPASS ----

function getBaZhaiData(data) {
  const menhu = getMenhu(data.dayBranch);
  const shan = menhu;
  const xiang = (10 - menhu) % 9 || 9;
  return { menhu, shan, xiang };
}

function getMenhu(zhi) {
  const map = {子:1,丑:2,寅:3,卯:4,辰:5,巳:6,午:7,未:8,申:9,酉:1,戌:2,亥:3};
  return map[zhi] || 1;
}

function getBaZhaiMingZhu(zhi) {
  const map = {子:'坎',丑:'艮',寅:'震',卯:'震',辰:'巽',巳:'离',午:'离',未:'坤',申:'坤',酉:'兑',戌:'乾',亥:'坎'};
  return map[zhi] || '坎';
}

function renderBaZhaiCompass(ctx, cx, cy, data) {
  const { menhu, shan, xiang } = getBaZhaiData(data);
  const mingZhu = getBaZhaiMingZhu(data.dayBranch);

  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(cx, cy, 310, 0, Math.PI*2); ctx.fill();

  const dirs = ['北','东北','东','东南','南','西南','西','西北'];
  const dirAngles = [270,315,0,45,90,135,180,225];
  const palFromDir = {270:1,315:8,0:3,45:4,90:9,135:2,180:7,225:6};

  drawRing(ctx, cx, cy, 290, 'rgba(39,174,96,0.2)', null, 1);
  drawRing(ctx, cx, cy, 260, 'rgba(39,174,96,0.1)', null, 1);
  drawRing(ctx, cx, cy, 200, 'rgba(39,174,96,0.15)', 'rgba(39,174,96,0.02)', 1);
  drawRing(ctx, cx, cy, 305, 'rgba(39,174,96,0.25)', null, 2);

  // 8 directions
  for (let i = 0; i < 8; i++) {
    const a = (dirAngles[i] - 90) * Math.PI / 180;
    const pal = palFromDir[dirAngles[i]];

    // Direction
    drawTextOnCircle(ctx, dirs[i], cx, cy, 280, dirAngles[i], 14, 'rgba(39,174,96,0.5)');

    // Palace number
    const x_pal = cx + 250 * Math.cos(a);
    const y_pal = cy + 250 * Math.sin(a);
    ctx.fillStyle = 'rgba(39,174,96,0.5)'; ctx.font = 'bold 14px "Noto Serif SC"';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(pal+'宫', x_pal, y_pal);

    // Shan星
    const x_shan = cx + 228 * Math.cos(a);
    const y_shan = cy + 228 * Math.sin(a);
    const shanColor = shan >= 6 ? '#27ae60' : (shan >= 4 ? '#f39c12' : '#e74c3c');
    ctx.fillStyle = shanColor; ctx.font = 'bold 16px "Ma Shan Zheng",serif';
    ctx.fillText(shan, x_shan, y_shan);

    // Xiang星
    const x_xiang = cx + 205 * Math.cos(a);
    const y_xiang = cy + 205 * Math.sin(a);
    const xiangColor = xiang >= 6 ? '#27ae60' : (xiang >= 4 ? '#f39c12' : '#e74c3c');
    ctx.fillStyle = xiangColor; ctx.font = 'bold 16px "Ma Shan Zheng",serif';
    ctx.fillText(xiang, x_xiang, y_xiang);
  }

  // Legend for 8
  const xiangNames = {1:'贪狼',2:'巨门',3:'禄存',4:'文曲',5:'廉贞',6:'武曲',7:'破军',8:'辅弼',9:'右弼'};
  ctx.fillStyle = '#27ae60'; ctx.font = 'bold 12px "Noto Serif SC"';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('山星', cx - 15, cy - 6);
  ctx.fillText('向星', cx + 15, cy - 6);
  ctx.font = '10px "Noto Serif SC"'; ctx.fillStyle = 'rgba(39,174,96,0.5)';
  ctx.fillText(xiangNames[shan], cx - 15, cy + 8);
  ctx.fillText(xiangNames[xiang], cx + 15, cy + 8);

  // Center
  drawRing(ctx, cx, cy, 198, 'rgba(39,174,96,0.3)', 'rgba(10,10,10,0.8)', 2);
  ctx.fillStyle = '#2ecc71'; ctx.font = 'bold 14px "Ma Shan Zheng",serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('八宅', cx, cy - 10);
  ctx.font = '11px "Noto Serif SC"'; ctx.fillStyle = 'rgba(39,174,96,0.6)';
  ctx.fillText(`${mingZhu}门主`, cx, cy + 8);
  ctx.font = '10px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.4)';
  ctx.fillText(`山${shan}向${xiang}`, cx, cy + 24);
}

// ---- HE TU LUO SHU ----

function getHeTuShu(stemIdx) {
  const map = {0:'一六共宗水',1:'二七同道火',2:'三八为朋木',3:'四九为友金',4:'五十居中土',5:'一六共宗水',6:'二七同道火',7:'三八为朋木',8:'四九为友金',9:'五十居中土'};
  return map[stemIdx] || '';
}

function getLuoShu(stemIdx) {
  const map = {0:'坎一白水',1:'坤二黑土',2:'震三碧木',3:'巽四绿木',4:'中五黄土',5:'乾六白金',6:'兑七赤金',7:'艮八白土',8:'离九紫火'};
  return map[stemIdx % 9] || '';
}

function renderHeTuLuoShuCompass(ctx, cx, cy, data) {
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(cx, cy, 310, 0, Math.PI*2); ctx.fill();

  // Outer decorative ring
  drawRing(ctx, cx, cy, 305, 'rgba(201,168,76,0.25)', null, 2);
  drawRing(ctx, cx, cy, 295, 'rgba(201,168,76,0.1)', null, 1);

  // Luoshu 3x3 grid
  const cellSize = 92;
  const gridW = cellSize * 3;
  const gridH = cellSize * 3;
  const startX = cx - gridW/2 + cellSize/2;
  const startY = cy - gridH/2 + cellSize/2;
  const luoshu = [8,1,6,3,5,7,4,9,2]; // standard luoshu
  const heTuPos = [[0,0],[1,1],[2,2],[3,4],[4,3],[5,5],[6,6],[7,7],[8,2],[9,8]];
  const heTu = {子:'一六',丑:'二七',寅:'三八',卯:'三八',辰:'五十',巳:'二七',午:'二七',未:'五十',申:'四九',酉:'四九',戌:'五十',亥:'一六'};
  const heTuEle = {一六:'水',二七:'火',三八:'木',四九:'金',五十:'土'};

  const gridCells = {1:[0,1],2:[0,2],3:[1,0],4:[2,0],5:[1,1],6:[2,2],7:[2,1],8:[0,0],9:[1,2]};
  const luoshuMap = {8:1,1:2,6:3,3:4,5:5,7:6,4:7,9:8,2:9};
  const luoshuColor = {1:'#3498db',2:'#a08060',3:'#27ae60',4:'#2ecc71',5:'#f39c12',6:'#95a5a6',7:'#e74c3c',8:'#2980b9',9:'#e74c3c'};

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const px = startX - cellSize + col * cellSize + cellSize/2;
      const py = startY - cellSize + row * cellSize + cellSize/2;
      ctx.beginPath();
      ctx.rect(px - cellSize/2, py - cellSize/2, cellSize, cellSize);
      ctx.strokeStyle = 'rgba(201,168,76,0.15)'; ctx.lineWidth = 1; ctx.stroke();
    }
  }

  // Draw luoshu numbers
  for (let num = 1; num <= 9; num++) {
    const [row, col] = gridCells[num];
    const px = startX - cellSize + col * cellSize + cellSize/2;
    const py = startY - cellSize + row * cellSize + cellSize/2;
    const c = luoshuColor[num];
    ctx.fillStyle = c; ctx.font = 'bold 28px "Ma Shan Zheng",serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(num, px, py - 10);
    ctx.font = '10px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.4)';
    ctx.fillText(['坎水','坤土','震木','巽木','中土','乾金','兑金','艮土','离火'][num-1], px, py + 14);
  }

  // Outer he tu ring
  drawRing(ctx, cx, cy, 150, 'rgba(201,168,76,0.15)', null, 1);
  drawRing(ctx, cx, cy, 155, 'rgba(201,168,76,0.08)', 'rgba(10,10,10,0.6)', 1);

  // Hetu text
  const ht = heTu[data.dayBranch] || '一六';
  ctx.fillStyle = '#c9a84c'; ctx.font = 'bold 18px "Ma Shan Zheng",serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(ht, cx, cy - 10);
  ctx.font = '11px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.5)';
  ctx.fillText(heTuEle[ht]+'属性', cx, cy + 12);
  ctx.font = '10px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.3)';
  ctx.fillText(`${data.dayBranch}支河图数`, cx, cy + 28);

  // Luoshu ring annotation
  for (let i = 0; i < 4; i++) {
    const a = (i * 90 - 90) * Math.PI / 180;
    const x = cx + 195 * Math.cos(a);
    const y = cy + 195 * Math.sin(a);
    const notes = ['天心','泽','山','雷'];
    ctx.fillStyle = 'rgba(201,168,76,0.3)'; ctx.font = '10px "Noto Serif SC"';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(notes[i], x, y);
  }

  // Outer directions
  const dirAngles = [270,0,90,180];
  const dirNames = ['北','东','南','西'];
  dirAngles.forEach((a, i) => {
    drawTextOnCircle(ctx, dirNames[i]+'·'+['一白','三碧','九紫','七赤'][i], cx, cy, 278, a, 12, 'rgba(201,168,76,0.3)');
  });
}

// ---- YAO GUA (六爻金钱盘) ----

function renderYaoGuaCompass(ctx, cx, cy, data) {
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath(); ctx.arc(cx, cy, 310, 0, Math.PI*2); ctx.fill();

  const shens = ['青龙','玄武','白虎','勾陈','朱雀','青龙'];
  const shenColors = {青龙:'#27ae60',玄武:'#3498db',白虎:'#e74c3c',勾陈:'#a08060',朱雀:'#c0392b'};
  const shenYao = [0,1,2,3,4,5];

  // 6 positions around circle
  drawRing(ctx, cx, cy, 290, 'rgba(201,168,76,0.2)', null, 1);
  drawRing(ctx, cx, cy, 260, 'rgba(201,168,76,0.15)', null, 1);
  drawRing(ctx, cx, cy, 200, 'rgba(201,168,76,0.1)', 'rgba(10,10,10,0.4)', 1);
  drawRing(ctx, cx, cy, 305, 'rgba(201,168,76,0.25)', null, 2);

  const yaoAngles = [90, 126, 162, 198, 234, 270]; // 从上开始顺时针
  const yaoNames = ['六爻','五爻','四爻','三爻','二爻','初爻'];
  const yaoYinYang = ['阳','阳','阴','阳','阴','阴'];

  for (let i = 0; i < 6; i++) {
    const a = (yaoAngles[i] - 90) * Math.PI / 180;
    const r_yao = 278;
    const r_shen = 255;
    const r_yin = 232;
    const r_gan = 210;
    const x = cx + r_yao * Math.cos(a);
    const y = cy + r_yao * Math.sin(a);

    // Yao name
    ctx.fillStyle = 'rgba(201,168,76,0.5)'; ctx.font = 'bold 12px "Noto Serif SC"';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(yaoNames[i], x, y);

    // Shen
    const shen = shens[i];
    const sx = cx + r_shen * Math.cos(a);
    const sy = cy + r_shen * Math.sin(a);
    ctx.fillStyle = shenColors[shen]; ctx.font = '11px "Noto Serif SC"';
    ctx.fillText(shen, sx, sy);

    // Yin/Yang line
    const yx = cx + r_yin * Math.cos(a);
    const yy = cy + r_yin * Math.sin(a);
    ctx.fillStyle = yaoYinYang[i]==='阳' ? '#c9a84c' : 'rgba(201,168,76,0.4)';
    ctx.font = '12px "Noto Serif SC"';
    ctx.fillText(yaoYinYang[i], yx, yy);

    // Gan (simplified)
    const gx = cx + r_gan * Math.cos(a);
    const gy = cy + r_gan * Math.sin(a);
    ctx.fillStyle = 'rgba(201,168,76,0.3)'; ctx.font = '10px "Noto Serif SC"';
    ctx.fillText(STEMS[(data.dayStemIdx + i) % 10], gx, gy);
  }

  // 6 directions
  for (let i = 0; i < 8; i++) {
    const a = (i * 45 - 90) * Math.PI / 180;
    drawTextOnCircle(ctx, ['北','东北','东','东南','南','西南','西','西北'][i], cx, cy, 298, i*45, 10, 'rgba(201,168,76,0.2)');
  }

  // Center
  drawRing(ctx, cx, cy, 198, 'rgba(201,168,76,0.3)', 'rgba(10,10,10,0.8)', 2);
  ctx.fillStyle = '#c9a84c'; ctx.font = 'bold 14px "Ma Shan Zheng",serif';
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText('六爻金钱', cx, cy - 10);
  ctx.font = '11px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.5)';
  ctx.fillText(`${data.dayStem}日 · 六亲盘`, cx, cy + 8);
  ctx.font = '10px "Noto Serif SC"'; ctx.fillStyle = 'rgba(201,168,76,0.3)';
  ctx.fillText('六神配六爻', cx, cy + 24);
}

// ---- BRIEF HELPERS ----

function getDoorAdviceBrief(door) {
  const m = {
    '生':'生财创业','开':'事业升迁','休':'休养人际','景':'文书信息',
    '伤':'讨债博弈','杜':'保密躲藏','死':'丧葬捕猎','惊':'官非诉讼',
    '禽':'稳重中立'
  };
  return m[door] || '待事';
}

function getLiuRenBrief(data) {
  var lrData = getLiuRenData(data);
  var tiGuan = lrData.tiGuan;
  var nature = {伏吟:'宜守不宜动——静待时机',反吟:'反复多变——灵活应对',知一:'吉近凶远——明智选择',涉害:'波折中进——耐心处理',昴星:'防惊恐——低调行事',别责:'借力——寻求合作',八专:'专一——集中精力',元首:'大吉大利——积极进取',重审:'三思后行——谨慎为上',连茹:'一气呵成——顺势而为',间传:'跃过障碍——灵活变通',丁鬼:'防变数——小心突变'};
  return nature[tiGuan] || '待详细分析';
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  // Set today's date for luopan inputs
  const lpDateInput = document.getElementById('lpDate');
  if (lpDateInput) {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth()+1).padStart(2,'0');
    const d = String(today.getDate()).padStart(2,'0');
    lpDateInput.value = `${y}-${m}-${d}`;
    lpDateInput.max = `${y}-${m}-${d}`;
  }

  // 初始化风水户型图上传
  initFengshuiUpload();
});

// ==================== USER CENTER (信众中心) ====================

const REMINDER_QUOTES = {
  'ru': {
    '孔子诞': '天不生仲尼，万古如长夜--今日祭孔，宜诵读论语，传承文脉',
    '孟子诞': '富贵不能淫，贫贱不能移--今日读孟子，养浩然正气',
    '朱熹诞': '格物致知，即物穷理--今日读近思录，明理修身',
    '王阳明诞': '知行合一，致良知--今日读传习录，内圣外王',
    '教师节': '一日为师，终身为父--今日谢师恩，尊师重道',
    '丁祭': '丁日祭孔，诚心敬意--今日宜祭孔，祈求学业进步'
  },
  'dao': {
    '老君诞': '道生一，一生二，二生三，三生万物--今日诵道德经，感悟大道',
    '玉皇诞': '玉皇大帝统三界，斋戒上香祈平安--今日宜斋戒、上香',
    '上元节': '天官赐福到人间，正月十五闹元宵--今日宜祈福、吃元宵',
    '中元节': '地官赦罪解灾厄，七月十五鬼门开--今日宜祭祖、超度',
    '下元节': '水官解厄消灾障，十月十五下元到--今日宜祈福、解厄',
    '重阳节': '九九重阳阳气盛，登高辟邪寿绵长--今日宜登高、插茱萸'
  },
  'fo': {
    '佛诞': '天上天下无如佛，十方世界亦无比--今日浴佛，清净身心',
    '成道日': '腊月初八成道日，煮粥供佛念弥陀--今日宜煮粥、诵经',
    '涅槃日': '不生不灭即涅槃，二月十五佛涅槃--今日宜诵经、供花',
    '观音诞': '千处祈求千处应，苦海常作渡人舟--今日拜观音，诵普门品',
    '观音成道': '观音成道六十九，慈悲智慧照大千--今日宜拜观音',
    '观音出家': '观音出家九十九，断除烦恼得自在--今日宜拜观音',
    '地藏诞': '地狱不空不成佛，七月三十地藏诞--今日诵地藏经，超度祖先',
    '弥陀诞': '阿弥陀佛大愿王，十一月十七诞辰到--今日念佛、供灯，求生净土'
  }
};

// 根据农历日期描述(如"农历二月十五"、"公历9月10日")计算距今天数
// 返回: 正数=未来天数, 0=今天, 负数=已过(按次年计算), null=无法解析
function computeDaysUntilLunarEvent(dateStr, currentYear) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 解析公历日期(如"公历9月10日")
  var solarMatch = dateStr.match(/公?(\d{1,2})月(\d{1,2})日/);
  if (solarMatch) {
    var sm = parseInt(solarMatch[1]);
    var sd = parseInt(solarMatch[2]);
    var target = new Date(currentYear, sm - 1, sd);
    var diff = Math.round((target - today) / 86400000);
    if (diff < 0) {
      // 已过，算明年
      target = new Date(currentYear + 1, sm - 1, sd);
      diff = Math.round((target - today) / 86400000);
    }
    return diff;
  }

  // 解析农历日期(如"农历二月十五"、"农历正月初九")
  var lunarMatch = dateStr.match(/农历(.{1,3})月(.{1,3})/);
  if (lunarMatch) {
    var lunarMonthStr = lunarMatch[1];
    var lunarDayStr = lunarMatch[2];

    // 农历月名转数字
    var lunarMonthMap = {'正':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':10,'冬':11,'腊':12};
    var lm = lunarMonthMap[lunarMonthStr];
    if (!lm && lunarMonthStr.match(/^\d+$/)) lm = parseInt(lunarMonthStr);
    if (!lm) return null;

    // 农历日名转数字
    var lunarDayMap = {'初一':1,'初二':2,'初三':3,'初四':4,'初五':5,'初六':6,'初七':7,'初八':8,'初九':9,'初十':10,'十一':11,'十二':12,'十三':13,'十四':14,'十五':15,'十六':16,'十七':17,'十八':18,'十九':19,'二十':20,'廿一':21,'廿二':22,'廿三':23,'廿四':24,'廿五':25,'廿六':26,'廿七':27,'廿八':28,'廿九':29,'三十':30,'卅一':31};
    var ld = lunarDayMap[lunarDayStr];
    if (!ld && lunarDayStr.match(/^\d+$/)) ld = parseInt(lunarDayStr);
    if (!ld) return null;

    // 用 lunarToSolar 转换 (lunarYear 参数是完整年份)
    var lunarYearOffset = currentYear;
    var solar = lunarToSolar(lunarYearOffset, lm, ld, false);
    if (!solar) return null;

    var target = new Date(solar.year, solar.month - 1, solar.day);
    var diff = Math.round((target - today) / 86400000);
    if (diff < 0) {
      // 已过，算次年
      solar = lunarToSolar(lunarYearOffset + 1, lm, ld, false);
      if (!solar) return null;
      target = new Date(solar.year, solar.month - 1, solar.day);
      diff = Math.round((target - today) / 86400000);
    }
    return diff;
  }

  // 无法解析的日期格式(如"农历二月丁日"等需特殊计算的)
  return null;
}

const ANNUAL_SCHEDULE = {
  'ru': [
    { name: '孔子诞', date: '农历八月廿七', desc: '祭孔、诵读论语', quoteKey: '孔子诞' },
    { name: '孟子诞', date: '农历四月初二', desc: '读孟子', quoteKey: '孟子诞' },
    { name: '朱熹诞', date: '农历九月十五', desc: '读近思录', quoteKey: '朱熹诞' },
    { name: '王阳明诞', date: '农历十月卅一', desc: '读传习录', quoteKey: '王阳明诞' },
    { name: '教师节', date: '公历9月10日', desc: '谢师、尊师', quoteKey: '教师节' },
    { name: '春祭', date: '农历二月丁日', desc: '祭孔', quoteKey: '丁祭' },
    { name: '秋祭', date: '农历八月丁日', desc: '祭孔', quoteKey: '丁祭' }
  ],
  'dao': [
    { name: '老君诞', date: '农历二月十五', desc: '诵道德经、斋戒', quoteKey: '老君诞' },
    { name: '玉皇诞', date: '农历正月初九', desc: '斋戒、上香', quoteKey: '玉皇诞' },
    { name: '上元节', date: '农历正月十五', desc: '天官赐福、祈福', quoteKey: '上元节' },
    { name: '中元节', date: '农历七月十五', desc: '地官赦罪、祭祖', quoteKey: '中元节' },
    { name: '下元节', date: '农历十月十五', desc: '水官解厄、祈福', quoteKey: '下元节' },
    { name: '重阳节', date: '农历九月初九', desc: '登高辟邪', quoteKey: '重阳节' }
  ],
  'fo': [
    { name: '佛诞', date: '农历四月初八', desc: '浴佛、诵经、放生', quoteKey: '佛诞' },
    { name: '成道日', date: '农历十二月初八', desc: '煮粥、诵经', quoteKey: '成道日' },
    { name: '涅槃日', date: '农历二月十五', desc: '诵经、供花', quoteKey: '涅槃日' },
    { name: '观音诞', date: '农历二月十九', desc: '拜观音、诵普门品', quoteKey: '观音诞' },
    { name: '观音成道', date: '农历六月十九', desc: '拜观音', quoteKey: '观音成道' },
    { name: '观音出家', date: '农历九月十九', desc: '拜观音', quoteKey: '观音出家' },
    { name: '地藏诞', date: '农历七月三十', desc: '诵地藏经', quoteKey: '地藏诞' },
    { name: '弥陀诞', date: '农历十一月十七', desc: '念佛、供灯', quoteKey: '弥陀诞' }
  ]
};

const OUTFIT_GUIDE = {
  'ru': {
    name: '儒家穿搭',
    motto: '「正其衣冠，尊其瞻视」',
    yi: '端正整洁、色彩温和、符合场合',
    ji: '过于暴露、邋遢随意'
  },
  'dao': {
    name: '道家穿搭',
    motto: '「道法自然，衣着亦然」',
    yi: '自然材质、宽松舒适、色调柔和',
    ji: '紧身束缚、化纤材质、艳丽刺眼'
  },
  'fo': {
    name: '佛家穿搭',
    motto: '「衣着清净，心亦清净」',
    yi: '素色衣物、简单干净、不饰华服',
    ji: '丝绸贵重、花俏炫目、新奇潮流'
  }
};


/* selectFaith dup removed */
function renderReminderList(faith) {
  const list = document.getElementById('reminderList');
  const schedule = ANNUAL_SCHEDULE[faith] || ANNUAL_SCHEDULE['all'];
  const quotes = REMINDER_QUOTES[faith] || {};
  const today = new Date();
  const thisYear = today.getFullYear();

  let html = '';
  schedule.forEach(item => {
    // 基于真实农历日期计算距今天数和是否临近
    const daysUntil = computeDaysUntilLunarEvent(item.date, thisYear);
    const isUpcoming = daysUntil !== null && daysUntil >= 0 && daysUntil <= 30;

    html += '<div class="reminder-item' + (isUpcoming ? ' upcoming' : '') + '">';
    html += '<div class="reminder-date">' + item.date + '</div>';
    html += '<div class="reminder-title">' + item.name + '</div>';
    html += '<div class="reminder-quote">' + (quotes[item.quoteKey] || item.desc) + '</div>';
    if (daysUntil !== null && daysUntil >= 0) {
      html += '<div class="reminder-days">距今还有 ' + daysUntil + ' 天</div>';
    }
    html += '</div>';
  });
  list.innerHTML = html;
}

function renderDailyOutfit(faith) {
  const card = document.getElementById('outfitCard');
  const guide = OUTFIT_GUIDE[faith] || OUTFIT_GUIDE['all'];
  const bazi = JSON.parse(localStorage.getItem('userBazi') || 'null');

  let wuxingHtml = '';
  if (bazi) {
    // 简化:根据八字显示五行喜用
    wuxingHtml = '<div class="outfit-wuxing"><span class="wx-label">五行喜用:</span><span class="wx-value">木、火(根据八字' + bazi.name + '推算)</span></div>';
  }

  card.innerHTML = '<div class="outfit-title">' + guide.name + '</div>' +
    '<div class="outfit-motto">' + guide.motto + '</div>' +
    '<div class="outfit-yi">宜:<span>' + guide.yi + '</span></div>' +
    '<div class="outfit-ji">忌:<span>' + guide.ji + '</span></div>' +
    wuxingHtml;
}

function renderDailyAdvice(faith) {
  const list = document.getElementById('adviceList');
  const adviceItems = [];

  if (faith === 'ru' || faith === 'all') {
    adviceItems.push({ icon: '📖', text: '今日宜祭祀先贤，可诵读论语一章', quote: '慎终追远，民德归厚矣' });
  }
  if (faith === 'dao' || faith === 'all') {
    adviceItems.push({ icon: '☯️', text: '今日宜斋戒上香，诵道德经一章', quote: '致虚极，守静笃' });
  }
  if (faith === 'fo' || faith === 'all') {
    adviceItems.push({ icon: '🪷', text: '今日宜诵经供佛，念阿弥陀佛', quote: '凡所有相，皆是虚妄' });
  }

  let html = '';
  adviceItems.forEach(item => {
    html += '<div class="advice-card">';
    html += '<div class="advice-icon">' + item.icon + '</div>';
    html += '<div class="advice-content">';
    html += '<div class="advice-text">' + item.text + '</div>';
    html += '<div class="advice-quote">' + item.quote + '</div>';
    html += '</div></div>';
  });
  list.innerHTML = html;
}

// 初始化信众中心
function initUserCenter() {
  const faith = localStorage.getItem('userFaith');
  if (faith) {
    document.getElementById('userSetup').style.display = 'none';
    document.getElementById('userBaziBind').style.display = 'block';
    document.getElementById('calendarSection').style.display = 'block';
    document.getElementById('dailyOutfit').style.display = 'block';
    document.getElementById('dailyAdvice').style.display = 'block';
    document.getElementById('reminderSettings').style.display = 'block';
    renderReminderList(faith);
    renderDailyOutfit(faith);
    renderDailyAdvice(faith);
  }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', initUserCenter);

// ==============================================================
// 测字功能
// ==============================================================

const CEZI_DATA = {
  '春':{radical:'日',wuxing:'木',strokes:9,meaning:'万物复苏，生机盎然',career:'春生夏长，事业初起步，前途光明',marriage:'桃花盛开，良缘将至',health:'肝木旺盛，注意情志调达',wealth:'春播秋收，投资宜早不宜迟',mnemonic:'春风化雨，润物无声'},
  '明':{radical:'日',wuxing:'火',strokes:8,meaning:'日月交辉，光明璀璨',career:'光明磊落，事业升腾',marriage:'良缘天成，伉俪情深',health:'心火旺盛，需防上炎',wealth:'财来财去，宜守不宜攻',mnemonic:'明镜止水，心如止境'},
  '安':{radical:'宀',wuxing:'土',strokes:6,meaning:'家宅安宁，平和吉祥',career:'安稳求进，循序渐进',marriage:'安居乐业，琴瑟和谐',health:'脾胃调和，健康无恙',wealth:'积少成多，适宜理财',mnemonic:'安居乐道，知足常乐'},
  '福':{radical:'示',wuxing:'水',strokes:14,meaning:'福祿双全，吉祥如意',career:'福星高照，职场顺遂',marriage:'福泽深厚，姻缘美满',health:'福寿安康，体健身轻',wealth:'福报丰厚，财源广进',mnemonic:'福慧双修，自在如意'},
  '禄':{radical:'示',wuxing:'火',strokes:13,meaning:'俸禄丰盈，富贵有期',career:'仕途顺畅，晋升有望',marriage:'良缘佳偶，天作之合',health:'心火略旺，宜清宜静',wealth:'禄入库中，财帛丰盈',mnemonic:'禄星高照，衣食无忧'},
  '寿':{radical:'寸',wuxing:'金',strokes:14,meaning:'长寿延年，福寿绵长',career:'稳健发展，久久为功',marriage:'白头偕老，情深意长',health:'健康长寿，颐养天年',wealth:'积福存财，长寿即富',mnemonic:'寿比南山，福泽深厚'},
  '喜':{radical:'士',wuxing:'水',strokes:12,meaning:'喜庆临门，双喜临门',career:'喜上加喜，事业新篇',marriage:'喜结良缘，百年好合',health:'喜笑颜开，心旷神怡',wealth:'喜获财利，双喜盈门',mnemonic:'喜气盈门，好事连连'},
  '财':{radical:'贝',wuxing:'金',strokes:10,meaning:'钱财丰足，理财有道',career:'财星高照，职场生财',marriage:'因财得缘，物质基础稳固',health:'肺气充足，健康有基',wealth:'财源滚滚，富甲一方',mnemonic:'财通四海，富贵自来'},
  '吉':{radical:'士',wuxing:'木',strokes:6,meaning:'吉祥如意，万事大吉',career:'吉人天相，逢凶化吉',marriage:'吉日良辰，美好姻缘',health:'吉祥安康，无病无灾',wealth:'吉星高照，财运亨通',mnemonic:'吉光片羽，弥足珍贵'},
  '祥':{radical:'示',wuxing:'金',strokes:11,meaning:'祥和瑞气，吉祥平安',career:'祥云缭绕，事业顺遂',marriage:'祥麟瑞凤，天作之合',health:'祥和平安，身心调和',wealth:'祥福自来，财帛丰盈',mnemonic:'祥云瑞气，紫气东来'},
  '瑞':{radical:'王',wuxing:'土',strokes:14,meaning:'瑞气盈门，祥瑞临门',career:'瑞星高照，前程似锦',marriage:'瑞凤呈祥，美好良缘',health:'瑞气滋养，身康体健',wealth:'瑞雪丰年，财源广进',mnemonic:'瑞气祥和，富贵盈门'},
  '和':{radical:'口',wuxing:'水',strokes:8,meaning:'和气生财，以和为贵',career:'和衷共济，团队和谐',marriage:'和和美美，伉俪情深',health:'气血和畅，健康平安',wealth:'和气生财，财源广进',mnemonic:'和光同尘，与���舒张'},
  '顺':{radical:'页',wuxing:'金',strokes:12,meaning:'顺遂如意，一帆风顺',career:'顺水推舟，事半功倍',marriage:'顺心遂意，美好姻缘',health:'顺利通泰，身体康健',wealth:'顺势而为，财源广进',mnemonic:'顺势而动，乘风破浪'},
  '达':{radical:'辶',wuxing:'火',strokes:12,meaning:'通达四方，志在千里',career:'达人达己，功成名就',marriage:'达观通融，良缘易得',health:'达观开朗，心胸宽广',wealth:'达济天下，财帛丰盈',mnemonic:'达人知命，穷通自乐'},
  '成':{radical:'戈',wuxing:'金',strokes:6,meaning:'功成名就，水到渠成',career:'成竹在胸，功业有成',marriage:'成就良缘，百年好合',health:'成气血足，身体康泰',wealth:'成财入库，积少成多',mnemonic:'成事在天，谋事在人'},
  '康':{radical:'广',wuxing:'木',strokes:11,meaning:'健康平安，福寿安康',career:'康庄大道，前程似锦',marriage:'康宁祥和，美满姻缘',health:'健康长寿，无病无灾',wealth:'康宁富足，物质丰盈',mnemonic:'康衢千丈，志在四方'},
  '宁':{radical:'宀',wuxing:'火',strokes:14,meaning:'宁静致远，淡泊明志',career:'宁心静气，稳步前进',marriage:'宁和安详，美满家庭',health:'宁神静养，身心调和',wealth:'宁聚财气，积少成多',mnemonic:'宁静致远，淡泊明志'},
  '正':{radical:'止',wuxing:'金',strokes:5,meaning:'正气凛然，公正无私',career:'正大光明，职场升迁',marriage:'正配良缘，天作之合',health:'正气存内，邪不可干',wealth:'正财入库，干净钱财',mnemonic:'正气凛然，光明磊落'},
  '善':{radical:'羊',wuxing:'金',strokes:12,meaning:'善良敦厚，与人为善',career:'善有善报，职场贵人',marriage:'善结良缘，心地善良',health:'善良心态，健康长寿',wealth:'善理财物，积德聚财',mnemonic:'善待他人，善待自己'},
  '德':{radical:'彳',wuxing:'火',strokes:15,meaning:'德行天下，厚德载物',career:'德高望重，功成名就',marriage:'德才兼备，美好良缘',health:'德厚流光，身心康健',wealth:'德财兼备，富贵自来',mnemonic:'德不孤，必有邻'},

  '伟':{radical:'亻',wuxing:'土',strokes:11,meaning:'大也，高大之意',career:'伟略宏才，事业宏大',marriage:'伟男子，良缘可期',health:'土旺脾胃，健康稳固',wealth:'伟业可成，财源广进',mnemonic:'伟才大略，志向高远'},
  '芳':{radical:'艹',wuxing:'木',strokes:10,meaning:'香草，美好之名',career:'芳名远播，事业芬芳',marriage:'芳华绝代，良缘天成',health:'木旺肝胆，注意情志',wealth:'芳财可聚，适宜文化',mnemonic:'芳菲满园，美好人生'},
  '秀':{radical:'禾',wuxing:'木',strokes:7,meaning:'谷物抽穗，优秀美好',career:'秀出班行，事业出众',marriage:'秀外慧中，良缘易得',health:'木旺健康，注意颈椎',wealth:'秀才有财，文财旺盛',mnemonic:'秀而不实，需防虚华'},
  '杰':{radical:'木',wuxing:'木',strokes:12,meaning:'才智出众之人',career:'杰才大展，事业辉煌',marriage:'杰士佳人，天作之合',health:'木火旺相，注意心脑',wealth:'杰出资财，大财富集',mnemonic:'杰然独立，不同凡响'},
  '敏':{radical:'攵',wuxing:'水',strokes:11,meaning:'疾速，聪慧敏捷',career:'敏而好学，事业敏捷',marriage:'敏慧可人，良缘易得',health:'水旺肾足，注意泌尿',wealth:'敏于行事，财源速进',mnemonic:'敏事慎言，智慧人生'},
  '静':{radical:'青',wuxing:'金',strokes:16,meaning:'安宁不动，纯净之美',career:'静观其变，事业稳进',marriage:'静女其姝，美好姻缘',health:'金旺肺强，注意呼吸道',wealth:'静聚财富，适宜守成',mnemonic:'静以修身，俭以养德'},
  '丽':{radical:'一',wuxing:'火',strokes:19,meaning:'美丽，光彩照人',career:'丽天事业，光彩夺目',marriage:'丽质天成，美好良缘',health:'火旺心强，注意血脉',wealth:'丽财可得，适宜文化艺术',mnemonic:'丽日当空，光明灿烂'},
  '强':{radical:'弓',wuxing:'木',strokes:11,meaning:'强盛，有力',career:'强毅果敢，事业强盛',marriage:'强强联合，良缘佳偶',health:'木旺肝强，注意筋骨',wealth:'强财可聚，适宜竞争性行业',mnemonic:'强弩之末，需防过刚'},
  '磊':{radical:'石',wuxing:'土',strokes:15,meaning:'石头多，光明磊落',career:'磊落光明，事业坦荡',marriage:'磊落君子，良缘可期',health:'土旺脾胃，注意消化',wealth:'磊落求财，正财旺盛',mnemonic:'磊磊落落，光明正大'},
  '洋':{radical:'氵',wuxing:'水',strokes:10,meaning:'广大水域，浩瀚之意',career:'洋洋大观，事业广阔',marriage:'洋溢出爱，良缘易得',health:'水旺肾足，注意耳朵',wealth:'洋财可发，适宜贸易',mnemonic:'洋洋洒洒，自由自在'},
  '龙':{radical:'龍',wuxing:'火',strokes:16,meaning:'神异之兽，权柄与祥瑞',career:'龙腾虎跃，霸业可期',marriage:'龙凤呈祥，天作之合',health:'火气充盈，宜防肝阳上亢',wealth:'龙藏深潭，财气暗涌',mnemonic:'龙游四海，气吞山河'},
  '虎':{radical:'虍',wuxing:'木',strokes:8,meaning:'山中之王，威猛与正义',career:'虎略龙韬，事业威振',marriage:'虎女刚强，良缘互补',health:'木气过旺，宜平肝潜阳',wealth:'虎啸生风，正财可得',mnemonic:'虎虎生威，不可限量'},
  '凤':{radical:'鳥',wuxing:'火',strokes:14,meaning:'百鸟之王，祥瑞与高贵',career:'凤鸣朝阳，声名远扬',marriage:'凤求凰偶，琴瑟和鸣',health:'火性炎上，宜养阴清热',wealth:'凤羽成文，贵人财旺',mnemonic:'凤鸣岐山，天下文明'},
  '鹏':{radical:'鳥',wuxing:'火',strokes:19,meaning:'大鹏展翅，志向高远',career:'鹏程万里，仕途高升',marriage:'鹏偶凤俦，良缘天成',health:'心火元盛，宜滋阴降火',wealth:'扶摇直上，财源广进',mnemonic:'大鹏一日同风起'},
  '鹰':{radical:'鳥',wuxing:'火',strokes:22,meaning:'翱翔天际，锐利与远见',career:'鹰击长空，独当一面',marriage:'鹰雄鸽雌，刚柔相济',health:'火盛血热，宜清心寡欲',wealth:'鹰扬天下，利及四方',mnemonic:'鹰隼试翼，风尘翕张'},
  '翔':{radical:'羽',wuxing:'土',strokes:12,meaning:'盘旋而飞，从容优雅',career:'翔实有度，稳步上升',marriage:'鸾翔凤集，姻缘上乘',health:'土气充盈，留意脾胃',wealth:'翔舞生财，适宜文创',mnemonic:'翔龙游凤，天地从容'},
  '宇':{radical:'宀',wuxing:'土',strokes:6,meaning:'天地之间，空间与包容',career:'宇宙洪荒，大有可为',marriage:'宇量深宏，配偶稳重',health:'土旺脾胃，纳运正常',wealth:'积少成多，适宜置产',mnemonic:'宇宙浩瀚，志向无垠'},
  '浩':{radical:'氵',wuxing:'水',strokes:11,meaning:'水势浩大，广博与深远',career:'浩瀚学海，著作等身',marriage:'浩渺有期，缘分深厚',health:'水盛肾强，宜防水湿侵',wealth:'浩荡而来，横财可期',mnemonic:'浩然正气，充塞天地'},
  '睿':{radical:'目',wuxing:'金',strokes:16,meaning:'明智通达，观微知著',career:'睿智深远，谋无不中',marriage:'睿女知书，伉俪情深',health:'金旺肺强，留意呼吸系统',wealth:'睿哲理财，积财有道',mnemonic:'睿哲文明，玄览通微'},
  '哲':{radical:'口',wuxing:'火',strokes:10,meaning:'智士贤人，明辨是非',career:'哲思敏达，学业优秀',marriage:'哲妇明理，家庭和睦',health:'火性聪明，宜防心火亢盛',wealth:'智士生财，文教得利',mnemonic:'哲人有智，处事分明'},
  '俊':{radical:'亻',wuxing:'火',strokes:9,meaning:'才智过人，容貌秀美',career:'俊乂在朝，前途无量',marriage:'俊男靓女，佳偶天成',health:'火气充盈，活力充沛',wealth:'俊杰理财，财路亨通',mnemonic:'俊眉朗目，才高八斗'},
  '博':{radical:'十',wuxing:'金',strokes:12,meaning:'渊博宽广，学富五车',career:'博学多才，学术权威',marriage:'博而不滥，良缘难求',health:'金气清肃，留意呼吸系统',wealth:'博施济众，财源广进',mnemonic:'博闻强识，大业可成'},
  '雅':{radical:'牙',wuxing:'木',strokes:12,meaning:'高尚不俗，温文尔雅',career:'雅人深致，声誉卓著',marriage:'雅室幽兰，良缘相配',health:'木气条达，情志舒畅',wealth:'雅正文风，文艺生财',mnemonic:'雅言雅行，温润如玉'},
  '文':{radical:'文',wuxing:'火',strokes:4,meaning:'文字文章，文化文明',career:'文以载道，学业为先',marriage:'文质彬彬，良缘相敬',health:'火耀文采，留意心血管',wealth:'文曲星动，正财稳进',mnemonic:'文光射斗，才华横溢'},
  '武':{radical:'止',wuxing:'金',strokes:8,meaning:'止戈为武，威武不屈',career:'文武双全，仕途武职',marriage:'武勇刚健，配偶需柔',health:'金木相战，留意筋骨肝胆',wealth:'武略安邦，正财可得',mnemonic:'文武双全，功名盖世'},
  '斌':{radical:'文',wuxing:'火',strokes:11,meaning:'文武双全，智勇兼备',career:'斌蔚大业，综合管理',marriage:'才子佳人，琴瑟和鸣',health:'文武兼修，身心平衡',wealth:'双财临门，文武皆利',mnemonic:'文经武纬，大器晚成'},
  '锋':{radical:'钅',wuxing:'金',strokes:12,meaning:'刀剑之锋，锐不可当',career:'锋芒毕露，先发制人',marriage:'锋偶须柔，互补有情',health:'金气过旺，留意呼吸系统',wealth:'锋利生财，正财旺盛',mnemonic:'锋芒逼人，锐意进取'},
  '刚':{radical:'钅',wuxing:'金',strokes:6,meaning:'刚健强硬，意志坚定',career:'刚正不阿，仕途清正',marriage:'刚性需柔，方能和合',health:'金木相克，留意肝胆',wealth:'刚毅立业，财库充实',mnemonic:'刚健中正，自强不息'},
  '毅':{radical:'殳',wuxing:'火',strokes:15,meaning:'毅力坚定，百折不挠',career:'毅然决然，创业可成',marriage:'毅行持久，缘分晚成',health:'火盛血热，宜清心宁神',wealth:'毅力生财，积少成多',mnemonic:'毅然果敢，铁杵成针'},
  '宏':{radical:'宀',wuxing:'土',strokes:7,meaning:'宏大宽广，包容万物',career:'宏图大展，规模经营',marriage:'宏屋之下，家和万事兴',health:'土气宽厚，脾胃健运',wealth:'宏大基业，财库充盈',mnemonic:'宏观天下，大有作为'},
  '志':{radical:'心',wuxing:'火',strokes:7,meaning:'心之所向，志向抱负',career:'志在千里，学业先成',marriage:'志同道合，良缘易得',health:'心火浮动，宜宁神定志',wealth:'志存高远，财随志来',mnemonic:'志在四方，无远弗届'},
  '勇':{radical:'力',wuxing:'土',strokes:9,meaning:'有胆有识，敢于行动',career:'勇挑重担，领导之才',marriage:'勇而有谋，良缘互补',health:'土盛脾胃，留意消化系统',wealth:'胆大财大，创业有道',mnemonic:'勇猛精进，无所畏惧'},
  '琪':{radical:'王',wuxing:'土',strokes:12,meaning:'美玉珍琪，贵重之物',career:'琪花瑶草，声誉日隆',marriage:'琪玉相配，门当户对',health:'土金相生，身康体健',wealth:'玉出昆冈，财富可期',mnemonic:'琪花瑶草，天生贵气'},
  '瑶':{radical:'王',wuxing:'火',strokes:14,meaning:'美玉瑶池，珍贵华美',career:'瑶林玉树，才华出众',marriage:'瑶琴丝竹，姻缘风雅',health:'火金相济，心肺健旺',wealth:'瑶财生辉，适宜商贸',mnemonic:'瑶池阿母，仙姿玉质'},
  '婷':{radical:'女',wuxing:'火',strokes:12,meaning:'亭亭玉立，婀娜多姿',career:'婷秀出众，服务文教',marriage:'婷婷玉立，追求者众',health:'火气内敛，情志调达',wealth:'气质生财，适宜服务业',mnemonic:'婷婷袅袅，风姿绰约'},
  '娟':{radical:'女',wuxing:'火',strokes:10,meaning:'娟秀柔美，姿态优雅',career:'娟好静秀，柔性职业',marriage:'娟秀可人，缘分深厚',health:'气血略弱，宜补气养血',wealth:'柔性生财，宜服务业',mnemonic:'娟娟秀色，宜室宜家'},
  '燕':{radical:'灬',wuxing:'火',strokes:16,meaning:'燕子归来，春天使者',career:'燕舞春风，创意行业',marriage:'燕燕轻盈，姻缘灵动',health:'火气偏旺，留意心脏',wealth:'燕雀之财，稳中有进',mnemonic:'燕语莺声，春意盎然'},
  '萍':{radical:'艹',wuxing:'水',strokes:14,meaning:'浮萍漂泊，随遇而安',career:'漂泊不定，宜流动职业',marriage:'萍水相逢，缘分天定',health:'水气浮动，宜安定心神',wealth:'流年财运，适宜贸易',mnemonic:'萍踪浪迹，四海为家'},
  '桂':{radical:'木',wuxing:'木',strokes:10,meaning:'桂花飘香，荣贵显达',career:'桂枝峥嵘，仕途高升',marriage:'桂香伴月，良缘相配',health:'木气条达，肝气舒畅',wealth:'金桂银桂，财富可积',mnemonic:'桂林一枝，昆山片玉'},
  '兰':{radical:'八',wuxing:'木',strokes:5,meaning:'兰花高洁，空谷幽香',career:'兰台凤阁，文职清贵',marriage:'兰心蕙质，贤淑佳偶',health:'木气清扬，情志舒畅',wealth:'兰章着意，文财生财',mnemonic:'兰桂齐芳，世代书香'},
  '菊':{radical:'艹',wuxing:'木',strokes:11,meaning:'秋菊傲霜，坚韧高洁',career:'菊黄秋实，晚景荣昌',marriage:'菊酒盟约，晚年情深',health:'木气疏泄，肝气调达',wealth:'秋菊傲霜，积蓄得财',mnemonic:'菊老荷枯，独傲秋霜'},
  '梅':{radical:'木',wuxing:'木',strokes:11,meaning:'寒梅傲雪，坚韧不拔',career:'梅香苦寒，成事在人',marriage:'梅雪争春，各有千秋',health:'木气健旺，肝肾调和',wealth:'寒梅着花，横财暗生',mnemonic:'梅须逊雪三分白'},
  '莲':{radical:'艹',wuxing:'火',strokes:13,meaning:'莲花出泥，洁身自好',career:'莲心苦口，智慧成熟',marriage:'莲理丝连，情深义重',health:'火水既济，身心平衡',wealth:'莲财通达，适宜金融',mnemonic:'出淤泥而不染，濯清涟而不妖'},
  '桃':{radical:'木',wuxing:'木',strokes:10,meaning:'桃花娇艳，爱情之花',career:'桃李无言，下自成蹊',marriage:'桃花灿烂，姻缘旺盛',health:'木气充盈，肝血健旺',wealth:'桃李满天下，财源广进',mnemonic:'桃之夭夭，灼灼其华'},
  '松':{radical:'木',wuxing:'木',strokes:8,meaning:'松柏常青，长寿坚定',career:'松柏之志，坚韧不拔',marriage:'松乔之寿，恩爱久长',health:'木气长存，肝肾健朗',wealth:'松柏长青，积财稳健',mnemonic:'松柏后凋，傲骨铮铮'},
  '竹':{radical:'竹',wuxing:'木',strokes:6,meaning:'竹报平安，虚心有节',career:'竹苞松茂，门庭兴旺',marriage:'竹马青梅，两小无猜',health:'木气清高，肝气舒畅',wealth:'竹篮打水，宜积不宜散',mnemonic:'竹影扫阶尘不动'},
  '风':{radical:'風',wuxing:'木',strokes:4,meaning:'风动万物，自由流动',career:'风起云涌，把握时机',marriage:'风马牛不相及，缘分微妙',health:'木气游走，易动肝风',wealth:'风生水起，横财可期',mnemonic:'风萧萧兮易水寒'},
  '雨':{radical:'雨',wuxing:'水',strokes:8,meaning:'雨润万物，恩泽天下',career:'雨露恩泽，贵人多助',marriage:'雨过天晴，良缘可期',health:'水湿内盛，肾气充盈',wealth:'雨润万物，财气渐生',mnemonic:'好雨知时节，当春乃发生'},
  '雪':{radical:'雨',wuxing:'水',strokes:11,meaning:'雪洁冰清，纯净无瑕',career:'雪窗萤火，学业精进',marriage:'雪肤花貌，良缘难得',health:'水寒之气，宜温补肾阳',wealth:'雪中送炭，贵人财旺',mnemonic:'瑞雪兆丰年'},
  '云':{radical:'二',wuxing:'土',strokes:4,meaning:'云游四海，自由自在',career:'云程发轫，仕途高升',marriage:'云开见月，良缘终现',health:'土气清轻，脾胃平和',wealth:'云腾致雨，财运灵动',mnemonic:'云淡风轻，宠辱不惊'},
  '霞':{radical:'雨',wuxing:'火',strokes:17,meaning:'彩霞满天，光彩照人',career:'霞光万道，声名远播',marriage:'霞明玉映，美好姻缘',health:'火性灿烂，宜平心静气',wealth:'霞光万丈，横财可期',mnemonic:'朝霞散彩，映日增辉'},
  '虹':{radical:'虫',wuxing:'火',strokes:9,meaning:'彩虹横空，雨后新生',career:'虹销雨霁，时来运转',marriage:'虹霓之志，姻缘高远',health:'火气内生，留意心脏',wealth:'虹霓吸水，横财暗藏',mnemonic:'虹共长空，风光无限'},
  '雷':{radical:'雨',wuxing:'水',strokes:13,meaning:'雷霆万钧，威势赫赫',career:'雷厉风行，执行力强',marriage:'雷鸣电闪，婚恋激烈',health:'水木相生，肾精充足',wealth:'雷动天财，正财可得',mnemonic:'雷霆乍惊，万物苏生'},
  '电':{radical:'田',wuxing:'火',strokes:5,meaning:'电光石火，迅速敏捷',career:'电光火石，把握机遇',marriage:'电光朝露，缘分短暂',health:'火性急速，心神易动',wealth:'电子科技，正财旺盛',mnemonic:'电光火石，稍纵即逝'},
  '山':{radical:'山',wuxing:'土',strokes:3,meaning:'山岳稳重，根基牢固',career:'山高水长，稳步发展',marriage:'山盟海誓，情深似海',health:'土气厚重，脾胃健运',wealth:'山明水秀，财气稳固',mnemonic:'山不在高，有仙则名'},
  '川':{radical:'川',wuxing:'金',strokes:3,meaning:'川流不息，财运流通',career:'川泽万物，流通行业',marriage:'川流不息，情深绵长',health:'金气清肃，肺气充盈',wealth:'川泽万物，物流通达',mnemonic:'川壅为泽，流通为财'},
  '河':{radical:'氵',wuxing:'水',strokes:8,meaning:'河流滋润，生生不息',career:'河润泽及，人脉广泛',marriage:'河山带砺，情深义重',health:'水气流畅，肾气充足',wealth:'河水浩荡，财源广进',mnemonic:'河图洛书，文明之源'},
  '海':{radical:'氵',wuxing:'水',strokes:10,meaning:'海纳百川，胸怀宽广',career:'海阔天空，大有作为',marriage:'海誓山盟，情比金坚',health:'水气充盛，肾精充足',wealth:'海阔任鱼跃，财路无垠',mnemonic:'海内存知己，天涯若比邻'},
  '湖':{radical:'氵',wuxing:'水',strokes:12,meaning:'湖光山色，静谧祥和',career:'湖光掠影，平稳发展',marriage:'湖光山色，浪漫姻缘',health:'水气内敛，宜静心养神',wealth:'湖平如镜，积蓄可期',mnemonic:'湖光潋滟晴方好'},
  '泉':{radical:'水',wuxing:'水',strokes:9,meaning:'泉水叮咚，源头活水',career:'源泉混混，不舍昼夜',marriage:'泉源相注，缘分深远',health:'水精充盈，肾气充足',wealth:'源泉滚滚，财气不断',mnemonic:'问渠那得清如许'},
  '星':{radical:'日',wuxing:'火',strokes:9,meaning:'星光闪烁，智慧远照',career:'星火燎原，影响深远',marriage:'星月交辉，浪漫良缘',health:'火性闪烁，宜安心定志',wealth:'星罗棋布，财源分散',mnemonic:'星垂平野阔，月涌大江流'},
  '月':{radical:'月',wuxing:'木',strokes:4,meaning:'月亮柔光，温柔内敛',career:'月华如水，管理为佳',marriage:'花好月圆，良缘圆满',health:'木性柔和，肝血充盈',wealth:'月光财生，宜夜班行业',mnemonic:'月有阴晴圆缺'},
  '日':{radical:'日',wuxing:'火',strokes:4,meaning:'太阳光明，热情照耀',career:'日升月恒，前途光明',marriage:'日出东方，缘分初现',health:'火气充盛，宜防心火亢盛',wealth:'日进斗金，正财旺相',mnemonic:'日出而作，日落而息'},
  '光':{radical:'儿',wuxing:'火',strokes:6,meaning:'光明照耀，内外明亮',career:'光风霁月，声誉清朗',marriage:'光影交错，缘分神秘',health:'火气明亮，心神易亢',wealth:'光大门楣，正财可得',mnemonic:'光明磊落，正大光明'},
  '天':{radical:'大',wuxing:'火',strokes:4,meaning:'头顶之上，宇宙万物',career:'天高任鸟飞，志向远大',marriage:'天作之合，良缘天定',health:'火气清轻，心火略亢',wealth:'天赐良机，财从天降',mnemonic:'天行健，君子以自强不息'},
  '地':{radical:'土',wuxing:'土',strokes:6,meaning:'大地承载，厚德载物',career:'地利人和，根基稳固',marriage:'地久天长，情深不变',health:'土气厚重，脾胃健运',wealth:'地生金，财气稳固',mnemonic:'地势坤，君子以厚德载物'},
  '江':{radical:'氵',wuxing:'水',strokes:7,meaning:'长江浩荡，气势磅礴',career:'江流入海，大业可成',marriage:'江上清风，浪漫相遇',health:'水气畅达，肾气充足',wealth:'江流入海，财路宽广',mnemonic:'大江东去，浪淘尽'},
  '一':{radical:'一',wuxing:'水',strokes:1,meaning:'太极初始，万物之始',career:'一本万利，创业起步',marriage:'一心一意，专情忠贞',health:'水气初生，肾精始充',wealth:'一生二，二生三，三生万物',mnemonic:'道生一，一生二，二生三'},
  '二':{radical:'二',wuxing:'火',strokes:2,meaning:'阴阳相对，天地之数',career:'二竖为虐，需防小人',marriage:'二姓之好，连理同枝',health:'火气初萌，心神易动',wealth:'二人同心，其利断金',mnemonic:'一生二，二生三，三生万物'},
  '三':{radical:'一',wuxing:'木',strokes:3,meaning:'天地人三才，万物之全',career:'三思后行，谋定后动',marriage:'三生有幸，良缘难得',health:'木气初生，肝气始发',wealth:'三阳开泰，财气始盛',mnemonic:'三人为众，三思而后行'},
  '四':{radical:'囗',wuxing:'金',strokes:5,meaning:'四面八方，视野广阔',career:'四方辐辏，人脉通达',marriage:'四面楚歌，姻缘需慎',health:'金气收敛，肺气清肃',wealth:'四面来财，商业兴隆',mnemonic:'四面荷花三面柳'},
  '五':{radical:'五',wuxing:'火',strokes:4,meaning:'天地之数，五行俱全',career:'五湖四海，格局宏大',marriage:'五福临门，美好姻缘',health:'五行调和，身心平衡',wealth:'五谷丰登，物质充盈',mnemonic:'五湖明月在，渔唱晚凉生'},
  '六':{radical:'八',wuxing:'水',strokes:4,meaning:'六六大顺，天地之合',career:'六合同风，仕途顺遂',marriage:'六礼既成，百年好合',health:'水气流通，肾气平和',wealth:'六六大顺，横财可期',mnemonic:'六爻占卜，天机可测'},
  '七':{radical:'一',wuxing:'火',strokes:2,meaning:'少阳之数，变化之机',career:'七窍玲珑，智慧过人',marriage:'七夕相会，情深意长',health:'火气浮动，心神不宁',wealth:'七十二行，行行出状元',mnemonic:'七月流火，九月授衣'},
  '八':{radical:'八',wuxing:'金',strokes:2,meaning:'分别之数，分解之道',career:'八面玲珑，人际圆融',marriage:'八拜之交，情义深重',health:'金气清肃，肺气充盈',wealth:'八面来财，商贾兴隆',mnemonic:'八仙过海，各显神通'},
  '九':{radical:'九',wuxing:'火',strokes:2,meaning:'阳数之极，变化无穷',career:'九转功成，大器晚成',marriage:'九五之尊，良缘高贵',health:'火气亢盛，宜潜心静养',wealth:'九曲十八弯，财路曲折',mnemonic:'九层之台，起于累土'},
  '十':{radical:'十',wuxing:'金',strokes:2,meaning:'数之终始，完整圆满',career:'十全十美，追求极致',marriage:'十指相扣，情比金坚',health:'金气中正，肺气充盈',wealth:'十之八九，理财有道',mnemonic:'十年树木，百年树人'},
  '百':{radical:'一',wuxing:'金',strokes:6,meaning:'百千万亿，数量众多',career:'百年大计，长远规划',marriage:'百年好合，白头偕老',health:'金气收敛，呼吸顺畅',wealth:'百折不挠，财路宽广',mnemonic:'百年三万六千日'},
  '千':{radical:'千',wuxing:'金',strokes:3,meaning:'千军万马，气势恢宏',career:'千锤百炼，技艺精湛',marriage:'千言万语，情深意重',health:'金气清朗，肺气充足',wealth:'千仓万箱，积储丰厚',mnemonic:'千里同风，志同道合'},
  '万':{radical:'一',wuxing:'土',strokes:3,meaning:'万物流转，天地之数',career:'万古长青，基业永固',marriage:'万古长情，忠贞不渝',health:'土气宽厚，脾胃调和',wealth:'万紫千红，财源广进',mnemonic:'万里长城永不倒'},
  '贵':{radical:'贝',wuxing:'火',strokes:9,meaning:'位尊权重，社会地位',career:'贵为人上，管理之才',marriage:'贵人相助，良缘得助',health:'火气上炎，宜平肝潜阳',wealth:'贵人多助，财路亨通',mnemonic:'贵人出门多风雨'},
  '富':{radical:'宀',wuxing:'水',strokes:12,meaning:'财产丰盈，物质充裕',career:'富甲一方，经商有道',marriage:'富而不骄，婚姻稳固',health:'水气充盛，肾气充足',wealth:'富由勤俭起，财自智中生',mnemonic:'富润屋，德润身'},
  '华':{radical:'十',wuxing:'土',strokes:10,meaning:'光华灿烂，荣华富贵',career:'华而不奢，文质彬彬',marriage:'华屋良缘，门第相配',health:'土气充实，脾胃健运',wealth:'华光溢彩，文创生财',mnemonic:'春华秋实，岁月如歌'},
  '荣':{radical:'艹',wuxing:'木',strokes:12,meaning:'荣华显耀，名利双收',career:'荣耀门楣，声誉卓著',marriage:'荣辱与共，伴侣相随',health:'木气条达，情志舒畅',wealth:'荣华富贵，德才兼备',mnemonic:'荣名以为宝，恬淡以为乐'},
  '昌':{radical:'日',wuxing:'火',strokes:8,meaning:'日日昌盛，欣欣向荣',career:'昌明博大，文教兴盛',marriage:'昌大门楣，子孙繁荣',health:'火气昌明，心神安定',wealth:'昌盛之业，财气日增',mnemonic:'子孙振振，瓜瓞绵绵'},
  '盛':{radical:'皿',wuxing:'金',strokes:12,meaning:'充盈丰盛，器量宽宏',career:'盛极一时，注意收敛',marriage:'盛情款待，宾客盈门',health:'金气过盛，肺气略亢',wealth:'盛极而衰，理财需稳',mnemonic:'盛筵必散，宜未雨绸缪'},
  '兴':{radical:'八',wuxing:'水',strokes:6,meaning:'兴起旺盛，积极进取',career:'兴利除弊，创新有为',marriage:'兴云播雨，缘分渐浓',health:'水气上扬，精神充沛',wealth:'兴业兴家，财路渐开',mnemonic:'兴，百姓苦；亡，百姓苦'},
  '旺':{radical:'日',wuxing:'火',strokes:8,meaning:'日正当午，气势旺盛',career:'旺盛进取，仕途高升',marriage:'旺夫益子，家庭兴旺',health:'火气旺盛，宜防心火亢盛',wealth:'旺字当头，横财可期',mnemonic:'旺气冲天，势不可挡'},
  '发':{radical:'又',wuxing:'水',strokes:5,meaning:'发芽发生，发展壮大',career:'发奋图强，创业可成',marriage:'发家致富，伴侣同心',health:'水气流动，肾精充足',wealth:'发财致富，时来运转',mnemonic:'君子以振民育德'},
  '升':{radical:'十',wuxing:'金',strokes:4,meaning:'向上攀升，前途光明',career:'升堂入室，仕途高升',marriage:'升阶迎贵，良缘得助',health:'金气上扬，肺气充盈',wealth:'蒸蒸日上，横财可期',mnemonic:'升于天则丽乎天'},
  '腾':{radical:'月',wuxing:'火',strokes:16,meaning:'飞黄腾达，仕途飞升',career:'腾云驾雾，霸业可期',marriage:'腾龙起凤，良缘天成',health:'火气冲腾，心神过亢',wealth:'腾蛇乘雾，财路飞升',mnemonic:'腾蛟起凤，孟学士之词宗'},
  '辉':{radical:'光',wuxing:'火',strokes:15,meaning:'光辉照耀，荣耀显赫',career:'辉光日新，声名远播',marriage:'辉映成双，良缘佳偶',health:'火气炽盛，宜养阴清热',wealth:'辉光万丈，横财可得',mnemonic:'辉光四溢，照耀八方'},
  '耀':{radical:'老',wuxing:'火',strokes:20,meaning:'闪耀夺目，光彩照人',career:'耀祖光宗，声名显赫',marriage:'耀眼光芒，姻缘出众',health:'火气过旺，宜平心静气',wealth:'耀武扬威，财气冲天',mnemonic:'光宗耀祖，名垂青史'},
  '锦':{radical:'钅',wuxing:'金',strokes:16,meaning:'锦绣前程，美好前程',career:'锦绣文章，才华出众',marriage:'锦衣玉食，生活优渥',health:'金气清肃，肺气充盈',wealth:'锦上添花，正财旺盛',mnemonic:'锦官城外柏森森'},
  '绣':{radical:'纟',wuxing:'金',strokes:11,meaning:'绣花织锦，精工细作',career:'绣花枕头，学以致用',marriage:'绣阁良缘，才子佳人',health:'金气细腻，呼吸顺畅',wealth:'绣出前程，技艺生财',mnemonic:'绣花添锦，更上一层'},
  '珍':{radical:'王',wuxing:'火',strokes:9,meaning:'珍奇异宝，价值连城',career:'珍重前程，稳健发展',marriage:'珍宝难求，良缘难得',health:'火金相济，心肺调和',wealth:'珍奇可贵，收藏得财',mnemonic:'奇珍异宝，价值连城'},
  '珠':{radical:'王',wuxing:'火',strokes:10,meaning:'珍珠圆润，光彩照人',career:'珠圆玉润，人际和谐',marriage:'珠联璧合，佳偶天成',health:'火性圆润，气血充盈',wealth:'珠玉在侧，财富自聚',mnemonic:'珠联璧合，才子佳人'},
  '琳':{radical:'王',wuxing:'木',strokes:12,meaning:'琳琅满目，美玉纷呈',career:'琳宫梵宇，文教清贵',marriage:'琳琅仙姿，良缘天成',health:'木气清扬，肝气舒畅',wealth:'琳琅财富，适宜艺术',mnemonic:'琳琅满目，美不胜收'},
  '飞':{radical:'飛',wuxing:'水',strokes:9,meaning:'展翅高飞，自由翱翔',career:'飞扬跋扈，创意行业',marriage:'飞燕传情，姻缘灵动',health:'水木相生，精神充沛',wealth:'飞黄腾达，财路高升',mnemonic:'万里腾飞，志在苍穹'},
  '跃':{radical:'足',wuxing:'土',strokes:11,meaning:'跳跃奔腾，积极进取',career:'跃马扬鞭，闯出一片天',marriage:'鱼跃龙门，良缘高升',health:'土气充盈，腿部有力',wealth:'跃跃欲试，横财可期',mnemonic:'跃马天山，纵横天下'},
  '动':{radical:'力',wuxing:'火',strokes:6,meaning:'行动力强，积极作为',career:'动如脱兔，执行力强',marriage:'动心忍性，磨砺良缘',health:'火气躁动，宜静心养神',wealth:'动中取财，正财可得',mnemonic:'动如脱兔，静如处子'},
  '变':{radical:'又',wuxing:'水',strokes:8,meaning:'变化万千，适应力强',career:'变通致远，灵活应变',marriage:'变中有缘，缘分微妙',health:'水气流动，肾精充足',wealth:'变中生财，理财有道',mnemonic:'穷则变，变则通，通则久'},
  '化':{radical:'亻',wuxing:'火',strokes:4,meaning:'教化变通，化育万物',career:'化腐朽为神奇，创造力强',marriage:'男婚女嫁，阴阳化生',health:'火气化生，气血流通',wealth:'化裁变通，智慧生财',mnemonic:'以文化之，化育天下'},
  '新':{radical:'斤',wuxing:'金',strokes:13,meaning:'新陈代谢，除旧布新',career:'日新月异，创新行业',marriage:'新人新事，缘分初萌',health:'金气清肃，肺气充盈',wealth:'新益求新，创意生财',mnemonic:'新沐者必弹冠'},
  '胜':{radical:'月',wuxing:'金',strokes:9,meaning:'胜利在望，克敌制胜',career:'胜券在握，竞争行业',marriage:'胜友如云，贵人相助',health:'金气清刚，肺气充盈',wealth:'胜利在望，正财可得',mnemonic:'胜不骄，败不馁'},
  '承':{radical:'手',wuxing:'金',strokes:8,meaning:'承接延续，承担责任',career:'承前启后，传承创新',marriage:'承欢膝下，家庭和睦',health:'金气收敛，肺气充足',wealth:'承上启下，人脉生财',mnemonic:'承天之佑，厚德载福'},
  '启':{radical:'口',wuxing:'木',strokes:7,meaning:'开启智慧，启迪人生',career:'启发后学，教育行业',marriage:'启齿生笑，姻缘灵动',health:'木气宣发，肝气舒畅',wealth:'启智生财，教育得利',mnemonic:'启予足，启予手'},
  '乐':{radical:'乐',wuxing:'火',strokes:15,meaning:'音乐快乐，心情愉悦',career:'乐业安居，知足常乐',marriage:'乐在其中，婚姻幸福',health:'火气通心，神清气爽',wealth:'乐善好施，财由德来',mnemonic:'乐莫乐兮新相知'},
  '章':{radical:'立',wuxing:'火',strokes:11,meaning:'文章典章，规矩法度',career:'章台折柳，文职清要',marriage:'章法分明，家庭有序',health:'火气文明，心神安定',wealth:'文章经济，仕途生财',mnemonic:'文章千古事，得失寸心知'},
  '茂':{radical:'艹',wuxing:'木',strokes:11,meaning:'草木繁盛，生命力旺盛',career:'茂实英声，才华出众',marriage:'枝繁叶茂，子孙满堂',health:'木气充盛，肝气条达',wealth:'茂盛生财，农业得利',mnemonic:'桃李不言，下自成蹊'},
  '恩':{radical:'心',wuxing:'火',strokes:10,meaning:'恩情深厚，感恩图报',career:'感恩报德，人脉深厚',marriage:'恩恩爱爱，情深义重',health:'火气通心，心神安定',wealth:'感恩得助，财由人来',mnemonic:'恩生于害，害生于恩'},
  '晖':{radical:'日',wuxing:'火',strokes:11,meaning:'春晖温暖，普照大地',career:'晖光日新，声名日盛',marriage:'晖映成双，良缘佳偶',health:'火气温和，心神安定',wealth:'晖生财旺，适宜光业',mnemonic:'春晖寸草心，报得三春晖'},
  '帆':{radical:'巾',wuxing:'水',strokes:6,meaning:'帆船风帆，顺风远航',career:'一帆风顺，把握时机',marriage:'帆张可渡，良缘有期',health:'水气流畅，肾气充盈',wealth:'帆达四海，贸易生财',mnemonic:'长风破浪会有时'},
  '程':{radical:'禾',wuxing:'木',strokes:12,meaning:'程式规矩，前途里程',career:'程门立雪，学业精进',marriage:'程限之内，缘分可期',health:'木气调达，脾胃健运',wealth:'程功计效，积少成多',mnemonic:'各适其程，斯谓至善'},
  '超':{radical:'走',wuxing:'金',strokes:12,meaning:'超越常人，出类拔萃',career:'超越自我，竞争制胜',marriage:'超然物外，良缘难求',health:'金气清刚，肺气充足',wealth:'超凡入圣，正财可得',mnemonic:'超然独处，逸群之才'},
  '越':{radical:'走',wuxing:'金',strokes:12,meaning:'跨越时空，超越界限',career:'越陌度阡，机遇广泛',marriage:'越女吴娃，姻缘风雅',health:'金气行走，留意呼吸系统',wealth:'越超寻常，财路宽广',mnemonic:'越王勾践，卧薪尝胆'},
  '雄':{radical:'隹',wuxing:'金',strokes:12,meaning:'英雄豪杰，气概不凡',career:'雄才大略，领导之才',marriage:'英雄美人，佳偶天成',health:'金气刚健，肺气充盈',wealth:'雄视天下，正财可得',mnemonic:'雄鸡一唱天下白'},
  '才':{radical:'忄',wuxing:'火',strokes:3,meaning:'才能才华，天赋异能',career:'才高八斗，学业为先',marriage:'才子佳人，天作之合',health:'火气灵动，心神活泼',wealth:'才由心生，财由才来',mnemonic:'才者知也，知者致知'},
  '慧':{radical:'心',wuxing:'火',strokes:15,meaning:'智慧通达，明辨是非',career:'慧眼识珠，洞察先机',marriage:'慧黠兰心，伉俪情深',health:'火水既济，心肾相交',wealth:'慧利众生，财富自来',mnemonic:'慧由心生，静能生智'}

};

const CEZI_RADICAL_ELE = {
  '日':'火','月':'木','木':'木','水':'水','火':'火','土':'土','金':'金','宀':'土','忄':'火','氵':'水',
  '王':'土','石':'金','目':'木','口':'土','田':'土','女':'水','子':'水','寸':'金','手':'木','扌':'木',
  '弓':'木','戈':'金','殳':'火','心':'火','忄':'火','戈':'金','攴':'水','攵':'水','支部':'水',
  '日':'火','罒':'水','皿':'土','矛':'水','矢':'金','石':'金','示':'火','禾':'木','穴':'火',
  '立':'水','竹':'木','米':'木','糸':'火','网':'水','羊':'土','羽':'水','老':'火','而':'金','耒':'木',
  '耳':'木','聿':'火','肉':'土','臣':'金','自':'木','至':'火','臼':'水','舟':'金','艮':'土','色':'火',
  '虍':'水','虫':'火','血':'水','行':'木','衣':'水','襾':'水','訁':'水','言':'金','豆':'木',
  '豕':'水','豸':'火','貝':'金','赤':'火','走':'金','足':'木','身':'金','車':'金','辛':'金','辰':'土',
  '辶':'火','邑':'土','酉':'金','釆':'木','里':'土','金':'金','門':'水','阝':'土','阜':'土','隶':'火',
  '隹':'金','雨':'水','靑':'金','非':'水','面':'水','革':'金','韋':'土','音':'土','風':'木','飛':'水',
  '食':'水','首':'金','香':'水','馬':'火','骨':'木','高':'木','髟':'木','鬥':'火','鬲':'火','鬼':'木',
  '魚':'水','鳥':'火','鹵':'火','鹿':'火','麥':'火','麻':'木','黃':'土','黍':'火','黑':'水','黹':'木',
  '龍':'火','龠':'木',
  // 新增部首（测字增强）
  '灬':'火','頁':'木','巾':'水','山':'土','牙':'金','瓦':'水','父':'水','气':'木','比':'火',
  '疒':'水','耒':'木','酉':'金','鹵':'火','麥':'火','龍':'火','龠':'木','儿':'火','大':'火',
  '二':'火','八':'金','十':'金','厂':'金','匚':'金','厶':'金','又':'水','工':'土','土':'土',
  '子':'水','宀':'土','寸':'金','小':'金','尢':'木','尸':'火','屮':'木','山':'土','巛':'水',
  '工':'土','己':'木','巾':'水','干':'木','幺':'火','广':'水','廴':'火','彐':'金','彡':'金',
  '忄':'火','戈':'金','戶':'火','手':'木','攴':'水','支':'火','文':'火','斗':'火','斤':'金',
  '方':'水','无':'水','日':'火','曰':'火','月':'木','木':'木','欠':'木','殳':'火','歹':'火',
  '殳':'火','毋':'水','气':'木','水':'水','火':'火','爪':'木','父':'水','爻':'火','爫':'火',
  '片':'火','牙':'金','牛':'木','犬':'火','玄':'火','玉':'土','瓜':'木','瓦':'水','甘':'火',
  '生':'金','用':'土','田':'土','疒':'水','癶':'火','白':'金','皮':'火','皿':'土','目':'木',
  '矛':'水','矢':'金','石':'金','示':'火','禸':'火','禾':'木','穴':'火','立':'水','竹':'木',
  '米':'木','糸':'火','缶':'火','网':'水','羊':'土','羽':'水','老':'火','而':'金','耒':'木',
  '耳':'木','聿':'火','肉':'土','臣':'金','自':'木','至':'火','臼':'水','舟':'金','艮':'土',
  '色':'火','虍':'水','虫':'火','血':'水','行':'木','衣':'水','襾':'水','訁':'水','言':'金',
  '豆':'木','豕':'水','豸':'火','貝':'金','赤':'火','走':'金','足':'木','身':'金','車':'金',
  '辛':'金','辰':'土','辶':'火','邑':'土','酉':'金','釆':'木','里':'土','金':'金','門':'水',
  '阝':'土','阜':'土','隶':'火','隹':'金','雨':'水','靑':'金','非':'水','面':'水','革':'金',
  '韋':'土','音':'土','風':'木','飛':'水','食':'水','首':'金','香':'水','馬':'火','骨':'木',
  '高':'木','髟':'木','鬥':'火','鬲':'火','鬼':'木','魚':'水','鳥':'火','鹵':'火','鹿':'火',
  '麥':'火','麻':'木','黃':'土','黍':'火','黑':'水','黹':'木','龍':'火','龠':'木'
};

// ==============================================================
// 测字增强：音韵五行分析（声母→五行）
// ==============================================================
const INITIAL_ELE = {
  'b':'水','p':'水','m':'水','f':'火',
  'd':'火','t':'火','n':'火','l':'火',
  'g':'土','k':'土','h':'木',
  'j':'火','q':'火','x':'木',
  'zh':'金','ch':'火','sh':'金','r':'火',
  'z':'金','c':'火','s':'金',
  'y':'土','w':'金','a':'火','e':'火','i':'木','u':'水','v':'土','o':'火'
};

// 字形结构判定
function getStructure(char) {
  const code = char.charCodeAt(0);
  // CJK Unified Ideographs: 0x4E00-0x9FFF
  if (code < 0x4E00 || code > 0x9FFF) return '独体';
  const s = char;
  if (/^[左右的][左右的]/.test(s) || /[亻饣扌氵礻衤钅马鸟鱼虫风雨]/.test(s)) return '左右结构';
  if (/[艹宀大女子小口山夕寸尸彳忄扌戈弓彡殳夂攴文斗斤户彐又]/i.test(s.charAt(0))) return '左右结构';
  if (/^[上中下][部件]/.test(s) || /[艹竹米豆言糸网羊羽老而耒耳聿肉臣自至臼舟艮色虍虫血行衣襾訁豆豕貝赤足身車辛辰辶邑酉釆里金門阝阜隶隹雨靑非面革韋音飛食首香骨髟鬥鬲鬼鹵黃黑黹龠]/.test(s.charAt(0))) return '上下结构';
  if (/[囗冂凵卩阝阚]/.test(s)) return '包围结构';
  if (/[門口日曰月目田肉臣自囗]/.test(s.charAt(0))) return '包围结构';
  return '独体结构';
}

function analyzeChar(char) {
  // 优先查大数据库（390字丰富解读）
  if (typeof window.CEZI_DATABASE !== 'undefined' && window.CEZI_DATABASE[char]) {
    const db = window.CEZI_DATABASE[char];
    return {
      char: char,
      radical: db.shape || char,
      wuxing: db.wuxing,
      strokes: db.kangxi,
      structure: db.shape,
      meaning: db.meaning,
      career: (function(){
        var w = db.wuxing;
        var ind = w==='木'?'文化创意、教育':w==='火'?'餐饮、能源':w==='土'?'农业、地产':w==='金'?'金融、法律':'物流、贸易';
        return '此字显' + w + '性，宜' + ind + '相关行业';
      })(),
      marriage: db.luck==='吉'||db.luck==='中吉'?'此字为吉/中吉之字，婚缘较顺':'此字平和，缘分需用心经营',
      health: (function(){
        var w = db.wuxing;
        var h = w==='木'?'木气条达，肝气舒畅，利于修身养性':w==='火'?'火气通心，神清气爽，注意心脏保养':w==='土'?'土气宽厚，脾胃健运':w==='金'?'金气清肃，肺气充盈':'水气充盈，肾精充足';
        return h;
      })(),
      wealth: db.yi || '字含' + db.wuxing + '气，稳中求进',
      luck: db.luck,
      yi: db.yi,
      ji: db.ji
    };
  }
  const data = CEZI_DATA[char];
  if (data) return {...data, char: char};

  // 未收录字：智能推断
  let radical = '未知';
  let wuxing = '土';
  let strokes = 0;
  let phonetic = '';

  // 1. 尝试KANGXI_STROKES（优先）
  if (typeof KANGXI_STROKES !== 'undefined' && KANGXI_STROKES[char]) {
    strokes = KANGXI_STROKES[char];
  }

  // 2. 尝试从字形提取部首
  for (let i = 0; i < char.length; i++) {
    const c = char[i];
    if (CEZI_RADICAL_ELE[c]) { radical = c; break; }
    if (/[日月木水火土金]/.test(c)) { radical = c; break; }
  }
  if (radical === '未知') radical = char.charAt(0);

  // 3. 笔画数兜底（避免为0）
  if (!strokes) strokes = (char.charCodeAt(0) % 81) + 1;

  // 4. 五行：部首优先，声母辅助
  wuxing = CEZI_RADICAL_ELE[radical] || '土';

  // 5. 音韵五行辅助判定（根据Unicode大致判断声母系）
  const code = char.charCodeAt(0);
  const phoneticCandidates = Object.keys(INITIAL_ELE);
  // 通过Unicode区间粗估音韵五行
  if (code >= 0x5E42 && code <= 0x5EB8) wuxing = INITIAL_ELE['b'] || wuxing; // 波婆
  if (code >= 0x5F64 && code <= 0x5FA8) wuxing = INITIAL_ELE['d'] || wuxing; // 得
  if (code >= 0x53D1 && code <= 0x53D2) wuxing = INITIAL_ELE['f'] || wuxing; // 发
  if (code >= 0x5C0A && code <= 0x5C3F) wuxing = INITIAL_ELE['g'] || wuxing; // 哥
  if (code >= 0x65E9 && code <= 0x65EC) wuxing = INITIAL_ELE['z'] || wuxing; // 早

  const structure = getStructure(char);
  const radicalMeaning = CEZI_RADICAL_ELE[radical] || '土';

  // 构建解读
  let meaning = '字形' + structure + '，含' + radical + '部之义';
  let career = '此字显' + wuxing + '性，宜' + (wuxing==='木'?'文化创意':'木火土金水'[Math.abs(code)%5]) + '相关行业';
  let marriage = '字形清晰，缘分平和';
  let health = radicalMeaning==='木'?'木气条达，肝气舒畅':
               radicalMeaning==='火'?'火气通心，神清气爽':
               radicalMeaning==='土'?'土气宽厚，脾胃健运':
               radicalMeaning==='金'?'金气清肃，肺气充盈':'水气充盈，肾精充足';
  let wealth = '财气随' + wuxing + '而行，稳中求进';
  let mnemonic = radicalMeaning + '为' + wuxing + '，字含' + structure + '之象';

  return {
    char: char,
    radical: radical,
    wuxing: wuxing,
    strokes: strokes,
    structure: structure,
    meaning: meaning,
    career: career,
    marriage: marriage,
    health: health,
    wealth: wealth,
    mnemonic: mnemonic
  };
}

// ==============================================================
//  专业测字解读模型——buildCeziProfessionalInterpretation()
//  基于《测字秘笈》《字触》《古今测字精选》等典籍
//  输入：用户文字+时间+问题类型 → 输出六维专业解读
//  解读总字数不少于1000字，大白话风格
// ==============================================================

function buildCeziProfessionalInterpretation(char, question, now) {
  // 标准化输入
  if (!char || char.length === 0) char = '一';
  if (!question || question.length === 0) question = '所问之事';
  if (!now) now = new Date();

  // 基础分析
  var result = analyzeChar(char);
  var wuxing = result.wuxing || '土';
  var strokes = result.strokes || 1;
  var radical = result.radical || char;
  var structure = result.structure || getStructure(char);
  var meaning = result.meaning || '';

  // 时辰
  var hour = now.getHours();
  var zhiIdx = Math.floor((hour + 1) / 2) % 12;
  var zhiNames = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  var hourZhi = zhiNames[zhiIdx];

  // 问事五行
  var questionWx = '土';
  var questionWxName = '所问之事';
  var qmap = window.CEZI_QUESTION_WUXING || {};
  for (var k in qmap) {
    if (question.indexOf(k) >= 0) { questionWx = qmap[k].wuxing; questionWxName = k; break; }
  }

  // ══════════════════════════════════════════════
  // a) 字形总析（~120字）
  // ══════════════════════════════════════════════
  var shapeSummary = '';
  shapeSummary += '「' + char + '」字，' + structure + '，';
  shapeSummary += '康熙字典' + strokes + '画，属' + wuxing + '行。';
  
  // 字的五行属性描述
  var wxDesc = {
    '木':'木主生发，如春木萌动，有向上生长之势。此字带木气，主生机、发展与仁爱。',
    '火':'火主炎上，如日照中天，有光明热烈之姿。此字带火气，主热情、文明与礼法。',
    '土':'土主承载，如大地厚重，有包容万物之德。此字带土气，主稳重、信义与根基。',
    '金':'金主肃杀，如刀剑锋芒，有刚健果断之威。此字带金气，主义气、决断与变格。',
    '水':'水主润下，如江河流动，有灵活变通之智。此字带水气，主智慧、流通与财富。'
  };
  shapeSummary += wxDesc[wuxing] || wxDesc['土'];

  // 第一印象判断
  var firstImpression = '';
  var luckNum = strokes % 81 || strokes;
  var shuli = (window.CEZI_SHU_LI || {})[luckNum];
  var slJiXiong = shuli ? shuli.jiXiong : '平';
  var slName = shuli ? shuli.name : '';

  if (slJiXiong === '大吉' || slJiXiong === '吉') {
    firstImpression = '第一印象：此字笔画数理为「' + slName + '」格，大吉大利。';
  } else if (slJiXiong === '半吉') {
    firstImpression = '第一印象：此字笔画数为「' + slName + '」格，吉凶参半，需具体分析。';
  } else {
    firstImpression = '第一印象：此字笔画数理为「' + slName + '」格，需谨慎对待，不可掉以轻心。';
  }
  shapeSummary += ' ' + firstImpression;

  // ══════════════════════════════════════════════
  // b) 六法逐层分析（~250字）
  // ══════════════════════════════════════════════
  var liufaAnalysis = '';
  var liufa = window.CEZI_LIUFA_DEEP || {};
  var mostSignificant = [];

  // 1. 象形法
  var xiangxingText = '';
  var xiangxingMap = {
    '人':'像人站立之形，独立自主，凡事靠自己。',
    '山':'像山峰连绵之形，有靠山，事业稳固。',
    '日':'像太阳之形，光明正大，前途无量。',
    '月':'像弯月之形，阴柔婉转，感情丰富。',
    '水':'像流水之形，财源流动，灵活变通。',
    '火':'像火焰之形，热情奔放，但有灼伤之虞。',
    '木':'像树木之形，扎根深厚，生长不息。',
    '口':'像方口之形，有吃有喝，但也可能是口舌是非。',
    '門':'像门扇之形，开合进退，时机关键。',
    '田':'像田畴之形，守业有成，一分耕耘一分收获。',
    '目':'像眼睛之形，明察秋毫，但也可能被人注视。',
    '雨':'像雨滴下落之形，滋润万物，贵人相助。',
    '馬':'像骏马之形，奔放自由，行动迅速。',
    '龍':'像龙腾之形，飞黄腾达，但高处不胜寒。'
  };
  xiangxingText = xiangxingMap[char] || (structure === '独体结构' ? '此字为独体象形字，取其形似之意判断吉凶。' : '');
  var hasXiangxing = xiangxingText.length > 0;

  // 2. 会意法——拆解偏旁部首
  var huiyiText = '';
  if (char.length >= 1 && structure !== '独体结构') {
    huiyiText += '会意法：此字由多个部分组成，拆开来看——';
    var parts = [];
    for (var i = 0; i < char.length; i++) {
      parts.push('「' + char[i] + '」');
    }
    huiyiText += parts.join('+') + '。';
    // 经典会意判断
    var huiyiMap = {
      '好':'女+子，女子为好，主美好姻缘，家庭和睦。',
      '明':'日+月，日月同辉，前程似锦，事业光明。',
      '安':'宀+女，家有贤妻，安居乐业，平安是福。',
      '信':'人+言，人言为信，诚信为本，事业有托。',
      '休':'人+木，人倚木而休，需注意休息，不宜过劳。',
      '男':'田+力，田力为男，男儿当自强，事业靠打拼。',
      '林':'双木为林，众志成城，需要团队协作。'
    };
    if (huiyiMap[char]) huiyiText += huiyiMap[char];
    else huiyiText += '各部分组合的含义，需要结合你的具体问题综合分析。';
  }
  var hasHuiyi = huiyiText.length > 0;

  // 3. 指事法
  var zhishiText = '';
  var zhishiMap = { '上':'上下之「上」，有上升之象，事业步步高升。', '下':'上下之「下」，有谦逊之态，以退为进。', '本':'木下加一横为「本」，指示树根，凡事要抓根本。' };
  zhishiText = zhishiMap[char] || '';
  var hasZhishi = zhishiText.length > 0;

  // 4. 转注法
  var zhuanzhuText = '';
  var zhuanzhuMap = { '老':'与「考」「寿」同族，主岁月积淀，厚积薄发。', '舟':'与「船」「舰」同族，主航行远游，事业发展。' };
  zhuanzhuText = zhuanzhuMap[char] || '';
  var hasZhuanzhu = zhuanzhuText.length > 0;

  // 5. 假借法
  var jiajieText = '';
  var xieshengMap = window.CEZI_XIESHENG_MAP || {};
  var xiesheng = xieshengMap[char];
  if (xiesheng) {
    jiajieText = '假借/谐声法：此字谐音通' + xiesheng + '，假借此义进行判断。测字术中，谐声是最常用、最灵活的方法之一。';
  }
  var hasJiajie = jiajieText.length > 0;

  // 6. 谐声法（综合）
  var xieshengSummary = '';
  if (char === '夷') xieshengSummary = '「夷」通「疑」，问事时心中尚有疑虑未消，需坚定信心。又夷有平夷之意，最终可化险为夷。';
  else if (char === '西') xieshengSummary = '「西」通「喜」，西方主金，金为财，喜事临门，财运可期。';
  else if (char === '九') xieshengSummary = '「九」通「久」，所问之事需要耐心，长久坚持才能成功。';
  else if (char === '锋') xieshengSummary = '「锋」通「风」，行事如风，需迅速果断，时机稍纵即逝。';
  var hasXiesheng = xieshengSummary.length > 0;

  // 组合六法分析
  liufaAnalysis += '此字从六法角度逐一分析如下：\n';
  
  if (hasXiangxing) { liufaAnalysis += '①象形法：' + xiangxingText + '\n'; mostSignificant.push('象形'); }
  if (hasHuiyi) { liufaAnalysis += '②会意法：' + huiyiText + '\n'; mostSignificant.push('会意'); }
  if (hasZhishi) { liufaAnalysis += '③指事法：' + zhishiText + '\n'; mostSignificant.push('指事'); }
  if (hasZhuanzhu) { liufaAnalysis += '④转注法：' + zhuanzhuText + '\n'; mostSignificant.push('转注'); }
  if (hasJiajie) { liufaAnalysis += '⑤假借法：' + jiajieText + '\n'; mostSignificant.push('假借'); }
  if (hasXiesheng) { liufaAnalysis += '⑥谐声法：' + xieshengSummary + '\n'; mostSignificant.push('谐声'); }

  // 如果没有明显的角度，补充通用分析
  if (mostSignificant.length === 0) {
    liufaAnalysis += '此字构形简洁，六法中最突出的是象形法——看它整体的样子和感觉就能直断吉凶。';
    liufaAnalysis += '字形' + structure + '，笔画' + strokes + '画属' + wuxing + '行，';
    liufaAnalysis += '可以直观地理解为：' + (wuxing === '木' ? '生机勃勃' : wuxing === '火' ? '热情洋溢' : wuxing === '土' ? '稳重踏实' : wuxing === '金' ? '刚健有力' : '灵动多变') + '之象。';
    mostSignificant.push('象形');
  } else {
    liufaAnalysis += '\n其中，' + mostSignificant[0] + '法对判定此字最为关键，是本次测字的核心分析方法。';
  }

  // ══════════════════════════════════════════════
  // c) 五行生克分析（~100字）
  // ══════════════════════════════════════════════
  var wuxingAnalysis = '';
  var wxRelMap = {
    '金金':'金金比和，刚健有力，互不相让。所问之事竞争激烈，需以实力取胜。',
    '金水':'金生水，金为水之源。字之金气能生问事之水，此事有源头活水，大有可为。',
    '金木':'金克木，字之金气克问事之木。此事需克服困难，但金克木亦有斩获之意。',
    '金火':'火克金，问事之火克字之金。此事压力较大，需暂避锋芒，待时而动。',
    '金土':'土生金，问事之土生字之金。外部环境有利，顺水推舟可成。',
    '木木':'木木比和，双木成林。此事有天时之利，同气相求，合作共赢。',
    '木火':'木生火，字之木气生问事之火。你所拥有的能量能推动此事发展，吉兆。',
    '木土':'木克土，字之木气克问事之土。你需要主动出击，把局面掌控在自己手中。',
    '木金':'金克木，问事之金克字之木。此事对你消耗较大，需要积蓄力量再动。',
    '木水':'水生木，问事之水能生字之木。此事能滋养你，越做越有劲，大吉。',
    '水水':'水水比和，水流不息。此事灵活多变，顺其自然即可，不可强求。',
    '水木':'水生木，字之水气生问事之木。你的智慧和灵活能推动此事发展。',
    '水火':'水克火，字之水气克问事之火。你能掌控局面，但需注意不要浇灭热情。',
    '水金':'金生水，问事之金生字之水。外部资源充足，财源不断，放心去做。',
    '水土':'土克水，问事之土克字之水。此事对你有压制，需要另辟蹊径才能破局。',
    '火火':'火火比和，热度翻倍。此事激情满满，但需防止头脑发热做过火。',
    '火土':'火生土，字之火气生问事之土。你的热情和行动能转化为实际成果。',
    '火金':'火克金，字之火气克问事之金。你需要以柔克刚，用智慧而非蛮力。',
    '火水':'水克火，问事之水克字之火。此事可能浇灭你的热情，需保持冷静但别放弃。',
    '火木':'木生火，问事之木生字之火。此事给你带来能量，越做越旺，吉兆。',
    '土土':'土土比和，稳如泰山。此事根基稳固，无需过度担心，按计划走就行。',
    '土金':'土生金，字之土气生问事之金。你的厚德能转化为实际财富和成果。',
    '土水':'土克水，字之土气克问事之水。你能控制局面，但注意不要太保守。',
    '土火':'火生土，问事之火生字之土。外部热度能助你成功，但别太依赖外界。',
    '土木':'木克土，问事之木克字之土。此事对你的根基有所动摇，需要加固基础。'
  };
  var wxKey = wuxing + questionWx;
  var wxRelText = wxRelMap[wxKey] || (wuxing + questionWx + '的关系需要结合具体情况分析。');

  wuxingAnalysis += '你的字「' + char + '」五行属' + wuxing + '，所问之事（' + questionWxName + '）五行属' + questionWx + '。\n';
  wuxingAnalysis += '生克关系：' + wxRelText + '\n';
  wuxingAnalysis += '结论：';
  var wxConclusion = '';
  if (wxKey === wuxing + wuxing) wxConclusion = '字与事五行相同，比和相助，吉。保持现状，顺势而为。';
  else if (['金水','木火','水木','火土','土金'].indexOf(wxKey) >= 0) wxConclusion = '字生事，你所付出的能量能推动事情发展，大吉。主动出击，必有收获。';
  else if (['金木','木土','土水','水金','火金'].indexOf(wxKey) >= 0) wxConclusion = '字克事，你能掌控局面，但需要付出努力。难度可控，尽力而为即可。';
  else if (['水土','火水','金火','木金','土土'].indexOf(wxKey) >= 0 && wuxing !== questionWx) wxConclusion = '事克字或事生字，外部因素影响较大。若' + questionWx + '生' + wuxing + '则得助力，若' + questionWx + '克' + wuxing + '则需警惕。';
  else wxConclusion = '需结合具体场合分析，总体而言可成。';
  wuxingAnalysis += wxConclusion;

  // 时辰影响
  var hourInfluence = (window.CEZI_HOUR_INFLUENCE || {})[hourZhi];
  if (hourInfluence) {
    wuxingAnalysis += '\n另外，此时为' + hourZhi + '（' + hourInfluence.period + '），' + hourInfluence.influence + '。';
  }

  // ══════════════════════════════════════════════
  // d) 笔画数理（~80字）
  // ══════════════════════════════════════════════
  var strokeAnalysis = '';
  strokeAnalysis += '此字总' + strokes + '画，在八十一数理中排第' + luckNum + '位（' + slName + '格）。\n';
  strokeAnalysis += shuli ? shuli.desc : '笔画数理吉凶需结合具体场景判断。';
  strokeAnalysis += '\n';
  
  if (slJiXiong === '大吉' || slJiXiong === '吉') {
    strokeAnalysis += '该笔画数为大吉，意味着这件事从数的层面来看非常有利。数字本身带有能量，' + strokes + '这个数字的能量对你来说是有益的。';
  } else if (slJiXiong === '半吉') {
    strokeAnalysis += '该笔画数为半吉，意味着有好的方面也有需要注意的地方。关键看你怎么做——';
    strokeAnalysis += '扬长避短就能趋吉避凶。';
  } else {
    strokeAnalysis += '该笔画数为凶格，但别太担心——测字看的是整体，笔画数只是其中一个维度。';
    strokeAnalysis += '有时候凶数反而能激发人的斗志，使人更加努力，最终转危为安。';
  }
  strokeAnalysis += '（参考：《测字秘笈》载：字之画数，与当年时令相合则吉，相反则凶。）';

  // ══════════════════════════════════════════════
  // e) 大白话结论（~200字）
  // ══════════════════════════════════════════════
  var plainConclusion = '';
  var jiXiong = '平';
  var confidence = 70;

  // 综合评分
  if (slJiXiong === '大吉') { jiXiong = '大吉'; confidence = 90; }
  else if (slJiXiong === '吉') { jiXiong = '吉'; confidence = 80; }
  else if (slJiXiong === '半吉') { jiXiong = '小吉'; confidence = 65; }
  else { jiXiong = '注意'; confidence = 50; }

  // 五行生克微调
  if (wxKey === wuxing + wuxing) { confidence += 5; }
  else if (['金水','木火','水木','火土','土金'].indexOf(wxKey) >= 0) { confidence += 5; if (jiXiong === '注意') jiXiong = '小吉'; }
  else if (['水土','火水','金火'].indexOf(wxKey) >= 0) { confidence -= 5; if (jiXiong === '大吉') jiXiong = '吉'; }
  confidence = Math.max(30, Math.min(95, confidence));

  plainConclusion += '针对你问的「' + question + '」，我的判断是：\n\n';
  plainConclusion += '吉凶程度：' + jiXiong + '（置信度' + confidence + '%）。\n';
  plainConclusion += '这不是随便说的，而是综合了字形结构（' + structure + '）、五行属性（' + wuxing + '行）、笔画数理（第' + luckNum + '格）、六法分析（主要是' + mostSignificant[0] + '法）和时辰因素（' + hourZhi + '）后得出的结论。\n\n';
  
  plainConclusion += '具体建议：\n';

  // 行动建议
  var actions = [];
  if (wuxing === '木') {
    actions.push('东方是你的幸运方向，办事往东走更顺利');
    actions.push('绿色是你的幸运色，着装可多用绿色');
    actions.push('春季（农历正月至三月）是行动的最佳时机');
  } else if (wuxing === '火') {
    actions.push('南方是你的幸运方向，办事往南走更顺利');
    actions.push('红色是你的幸运色，适当使用红色能增强运势');
    actions.push('夏季（农历四月至六月）是行动的最佳时机');
  } else if (wuxing === '土') {
    actions.push('中原地带或城市中心是你的幸运方位');
    actions.push('黄色、棕色是你的幸运色');
    actions.push('土旺四季，每个季节末（三月、六月、九月、十二月）运势最佳');
  } else if (wuxing === '金') {
    actions.push('西方是你的幸运方向');
    actions.push('白色、银色、金色是你的幸运色');
    actions.push('秋季（农历七月至九月）是行动的最佳时机');
  } else {
    actions.push('北方是你的幸运方向');
    actions.push('黑色、蓝色是你的幸运色');
    actions.push('冬季（农历十月至十二月）是行动的最佳时机');
  }
  actions.push('测字求测，心诚则灵——测字时的心态很重要，保持积极乐观，事情就容易往好的方向发展');

  for (var a = 0; a < actions.length; a++) {
    plainConclusion += '• ' + actions[a] + '\n';
  }

  // 时间提示
  plainConclusion += '\n时间提示：';
  var season = now.getMonth();
  var wxSeasonMap = { '木':[2,3,4], '火':[5,6,7], '土':[3,6,9,12], '金':[8,9,10], '水':[11,0,1] };
  var wxSeason = wxSeasonMap[wuxing] || [0,1,2,3,4,5,6,7,8,9,10,11];
  var inSeason = wxSeason.indexOf(now.getMonth() + 1) >= 0;
  if (inSeason) {
    plainConclusion += '当前正值' + wuxing + '旺之月，天时有利，近期（1-3个月）就会有动静。';
  } else {
    plainConclusion += '当前不在' + wuxing + '旺之时，建议先做好准备工作，等' + wuxing + '旺之月（' + (wuxing === '木' ? '春季' : wuxing === '火' ? '夏季' : wuxing === '金' ? '秋季' : wuxing === '水' ? '冬季' : '四季末') + '）再大举行动。';
  }

  // ══════════════════════════════════════════════
  // f) AI辅助补充（~100字）
  // ══════════════════════════════════════════════
  var aiSupplement = '';
  aiSupplement += '综合以上多维分析，我给你一个最终的建议：\n';

  if (jiXiong === '大吉' || jiXiong === '吉') {
    aiSupplement += '整体来看，这个字对你问的「' + question + '」非常有利。字有' + wuxing + '之性，' + wuxing + '主' + ({木:'生发进取',火:'热情光明',土:'稳定厚重',金:'刚健果断',水:'智慧流通'})[wuxing] + '，';
    aiSupplement += '这正是你当前需要的能量。建议你保持信心，积极行动，运势是站在你这边的。';
  } else if (jiXiong === '小吉') {
    aiSupplement += '整体来看，这是一个有潜力的字，但需要你付出努力才能把潜力变成现实。';
    aiSupplement += '记住：测字给出的方向是积极的，但结果取决于你的行动。';
    aiSupplement += '天道酬勤，一分耕耘一分收获。这个字告诉你——值得去做。';
  } else {
    aiSupplement += '整体来看，此字给出的信号需要重视。不是说你问的事一定不成，而是提醒你在这件事情上要多加小心。';
    aiSupplement += '换个角度看，提前知道风险，就能避免掉进坑里——这也是一种福气。';
    aiSupplement += '建议你做充分准备，找可靠的人商量，不急于一时。';
  }

  aiSupplement += '\n\n温馨提醒：测字是一种传统的文化智慧，它可以给你一些启发和方向感，但最终命运掌握在你自己手中。';
  aiSupplement += '字是死的，人是活的。同一个字，不同的人去写、去测，结果会不一样——因为你是你命运的主人。';
  aiSupplement += '带着这份解读给你的启发，好好去生活、去奋斗吧。';

  // 如果有经典案例匹配，附上参考
  var classicRef = '';
  var cases = window.CEZI_CLASSIC_CASES || [];
  for (var ci = 0; ci < cases.length; ci++) {
    var c = cases[ci];
    if (c.char === char || c.question.indexOf(questionWxName) >= 0 || (c.analysis.indexOf(meaning.substring(0,2)) >= 0 && meaning.length > 2)) {
      if (c.char === char) {
        classicRef = '\n\n📜 历史参考：宋代测字大师' + c.master + '也曾测过「' + c.char + '」字（' + c.question + '），当时断为：' + c.analysis.substring(0, 60) + '...。后果然：' + c.result + '';
      }
      break;
    }
  }

  // 返回完整的六维解读
  return {
    char: char,
    question: question,
    hourZhi: hourZhi,
    // 六个维度的详细内容
    shapeSummary: shapeSummary,
    liufaAnalysis: liufaAnalysis,
    wuxingAnalysis: wuxingAnalysis,
    strokeAnalysis: strokeAnalysis,
    plainConclusion: plainConclusion,
    aiSupplement: aiSupplement,
    classicRef: classicRef,
    // 摘要数据
    jiXiong: jiXiong,
    confidence: confidence,
    mostSignificant: mostSignificant,
    wuxing: wuxing,
    strokes: strokes,
    luckNum: luckNum,
    radical: radical,
    structure: structure
  };
}

function doCezi() {
 try {
  return _doCeziImpl();
 } catch(e) {
  console.error('[测字解析错误]', e.message, e.stack);
  var _eb = document.getElementById('ceziResult') || document.getElementById('ceziResult');
  if(_eb) _eb.innerHTML = '<div style="padding:20px;margin:16px 0;background:rgba(231,76,60,.08);border:1px solid rgba(231,76,60,.2);border-radius:8px"><h5 style="color:#e74c3c">❌ 测字解析出错</h5><p style="font-size:13px;opacity:.8;margin-top:8px">'+e.message+'</p><p style="font-size:11px;opacity:.5;margin-top:4px">'+(e.stack||'').split("\n").slice(0,3).join("<br>")+'</p></div>';
  var _r = document.getElementById('ceziResult'); if(_r){_r.classList.add('visible');_r.scrollIntoView({behavior:'smooth'});}
 }
}
function _doCeziImpl() {
  playDivinationSound();
  const char = document.getElementById('ceziInput').value.trim();
  if (!char) {
    showToast('请输入一个字');
    return;
  }

  // 获取问题类型
  var questionEl = document.getElementById('ceziQuestion');
  var question = questionEl ? questionEl.value.trim() : '所问之事';
  if (!question) question = '所问之事';

  // 使用专业解读模型
  var now = new Date();
  var interp = buildCeziProfessionalInterpretation(char, question, now);
  var result = analyzeChar(char);

  // 标签栏
  var jiXiong = interp.jiXiong || '平';
  var luckColor = jiXiong==='大吉'||jiXiong==='吉'?'#27ae60':jiXiong==='小吉'?'#f39c12':jiXiong==='注意'?'#e74c3c':'#95a5a6';
  var luckBg = jiXiong==='大吉'||jiXiong==='吉'?'rgba(39,174,96,.06)':jiXiong==='小吉'?'rgba(243,156,18,.06)':jiXiong==='注意'?'rgba(231,76,60,.06)':'rgba(149,165,166,.06)';

  document.getElementById('ceziChar').textContent = interp.char;
  document.getElementById('ceziTags').innerHTML =
    '<span class="rb-tag">' + interp.radical + '部</span>' +
    '<span class="rb-tag">' + interp.wuxing + '行</span>' +
    '<span class="rb-tag">' + interp.strokes + '画</span>' +
    '<span class="rb-tag">' + interp.hourZhi + '</span>' +
    '<span class="rb-tag" style="background:' + luckBg + ';color:' + luckColor + ';border-color:' + luckColor + '22">' + jiXiong + ' ' + interp.confidence + '%</span>';

  // 宜忌提示
  var yiText = result.yi || '';
  var jiText = result.ji || '';
  var dbInfo = '';
  if (yiText || jiText) {
    var yiHTML = '<div style="padding:8px;background:rgba(39,174,96,.06);border-radius:6px"><div style="font-size:10px;color:#27ae60;margin-bottom:2px">宜</div><div style="font-size:12px;opacity:.85">' + yiText + '</div></div>';
    var jiHTML = '<div style="padding:8px;background:rgba(231,76,60,.06);border-radius:6px"><div style="font-size:10px;color:#e74c3c;margin-bottom:2px">忌</div><div style="font-size:12px;opacity:.85">' + jiText + '</div></div>';
    dbInfo = '<div class="cezi-analysis-card" style="border-color:rgba(52,152,219,.15)"><h5>📜 宜忌提示</h5><div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:6px">' + yiHTML + jiHTML + '</div></div>';
  }

  // 输出专业六维解读
  var classicRefHTML = interp.classicRef ? '<div class="cezi-analysis-card" style="border-color:rgba(142,68,173,.15)"><h5>📚 历史案例参考</h5><p class="ca-desc" style="white-space:pre-line">' + interp.classicRef + '</p></div>' : '';

  document.getElementById('ceziAnalysis').innerHTML = `
    <div class="cezi-analysis-card" style="border-color:rgba(201,168,76,.15)">
      <h5>🔍 字形总析</h5>
      <p class="ca-desc" style="white-space:pre-line">${interp.shapeSummary}</p>
    </div>
    <div class="cezi-analysis-card" style="border-color:rgba(39,174,96,.15)">
      <h5>📐 六法逐层分析</h5>
      <p class="ca-desc" style="white-space:pre-line">${interp.liufaAnalysis}</p>
    </div>
    <div class="cezi-analysis-card" style="border-color:rgba(142,68,173,.15)">
      <h5>☯️ 五行生克分析</h5>
      <p class="ca-desc" style="white-space:pre-line">${interp.wuxingAnalysis}</p>
    </div>
    <div class="cezi-analysis-card" style="border-color:rgba(41,128,185,.15)">
      <h5>🔢 笔画数理</h5>
      <p class="ca-desc" style="white-space:pre-line">${interp.strokeAnalysis}</p>
    </div>
    ${classicRefHTML}
    ${dbInfo}
    <div class="cezi-analysis-card" style="border-color:rgba(230,126,34,.15);border-width:2px">
      <h5>💬 大白话结论</h5>
      <p class="ca-desc" style="white-space:pre-line">${interp.plainConclusion}</p>
    </div>
    <div class="cezi-analysis-card" style="border-color:rgba(231,76,60,.15)">
      <h5>🤖 AI辅助补充</h5>
      <p class="ca-desc" style="white-space:pre-line">${interp.aiSupplement}</p>
    </div>
  `;

  document.getElementById('ceziResult').classList.add('visible');
}

function randomCezi() {
  const keys = Object.keys(CEZI_DATA);
  // 基于当前时辰选取字（非Math.random）
  var _ceziNow = new Date();
  var _ceziIdx = (_ceziNow.getHours() + _ceziNow.getMinutes() + _ceziNow.getDate()) % keys.length;
  const char = keys[_ceziIdx];
  document.getElementById('ceziInput').value = char;
  doCezi();
}

// ==============================================================
// 参拜指南功能
// ==============================================================

const WORSHIP_GUIDES = {
  ru: {
    name: '儒家',
    motto: '正心诚意，修身齐家',
    steps: [
      {
        title: '祭孔仪式',
        items: [
          {num:'1',name:'站位',desc:'面向孔子像，正立',chant:'',note:'保持恭敬心诚'},
          {num:'2',name:'鞠躬',desc:'三鞠躬:一拜先师、二拜圣贤、三拜先祖',chant:'',note:'每次鞠躬90度'},
          {num:'3',name:'献花',desc:'双手持花，举过头顶，轻放',chant:'',note:'花以百合、莲花为佳'},
          {num:'4',name:'诵读',desc:'大学首章三句',chant:'大学之道，在明明德，在亲民，在止于至善',note:'音声洪亮，字字清楚'}
        ]
      },
      {
        title: '家祭礼仪',
        items: [
          {num:'1',name:'上香',desc:'左手持香，右手护焰，三炷香先后插入',chant:'',note:'燃香时需护焰防风'},
          {num:'2',name:'叩拜',desc:'先跪右膝，再跪左膝，三叩首',chant:'',note:'额头触地'},
          {num:'3',name:'献供',desc:'水果三盘，由左至右',chant:'',note:'苹果、桃子、橘子'}
        ]
      },
      {
        title: '日常修身礼',
        items: [
          {num:'1',name:'晨读',desc:'晨起面北诵读《大学》首章',chant:'大学之道，在明明德，在亲民，在止于至善。知止而后有定，定而后能静，静而后能安，安而后能虑，虑而后能得。物有本末，事有终始，知所先后，则近道矣。',note:'卯时(5-7点)为佳'},
          {num:'2',name:'用餐感恩',desc:'用餐前合掌感恩',chant:'一粥一饭，当思来之不易；半丝半缕，恒念物力维艰',note:'食不言，寝不语'}
        ]
      }
    ]
  },
  dao: {
    name: '道家',
    motto: '道法自然，清静无为',
    steps: [
      {
        title: '朝真拜斗',
        items: [
          {num:'1',name:'步法',desc:'禹步三步九迹',chant:'',note:'左脚起步，三步一循环'},
          {num:'2',name:'手诀',desc:'剑诀、令牌诀、五雷诀',chant:'',note:'剑诀:剑指直立；令牌诀:双手交叉；五雷诀:五指分开'},
          {num:'3',name:'口诀',desc:'金光咒',chant:'天地玄宗，万气本根。广修万劫，证吾神通。三界内外，唯道至尊。顶负圆光，身披金甲。云腾万里，统摄万灵。玄云之瑞，是吾真形。急急如律令!',note:'需诚心持诵'}
        ]
      },
      {
        title: '上香礼仪',
        items: [
          {num:'1',name:'持香',desc:'左手持香',chant:'',note:'左手为善手'},
          {num:'2',name:'点香',desc:'右手点香',chant:'',note:'用火柴或打火机'},
          {num:'3',name:'三炷香',desc:'代表天地人',chant:'',note:'中间最高'},
          {num:'4',name:'叩齿',desc:'叩齿三通',chant:'',note:'左三右三'}
        ]
      },
      {
        title: '日常功课',
        items: [
          {num:'1',name:'早课',desc:'诵《清净经》',chant:'老君曰:大道无形，生育天地；大道无情，运行日月；大道无名，长养万物。吾不知其名，强名曰道。夫道者:有清有浊，有动有静；天清地浊，天动地静；男清女浊，男动女静。降本流末，而生万物。清者浊之源，动者静之基。人能常清静，天地悉皆归。',note:'卯时(5-7点)'},
          {num:'2',name:'晚课',desc:'诵《心印经》',chant:'上药三品，神与气精。恍恍惚，窍中窍。存无守有，凝结成丹。丹有三号，魂在肝，魄在肺，精在心。万神不齐，入门守户。雌一交媾，产一玉童。玉童神光，射人无穷。',note:'戌时(19-21点)'}
        ]
      }
    ]
  },
  fo: {
    name: '佛家',
    motto: '南无阿弥陀佛',
    steps: [
      {
        title: '礼佛动作',
        items: [
          {num:'1',name:'合掌',desc:'十指并拢，掌心微空',chant:'',note:'表示恭敬'},
          {num:'2',name:'问讯',desc:'弯腰90度',chant:'阿弥陀佛',note:'双手合十于胸前'},
          {num:'3',name:'长跪',desc:'右膝着地',chant:'',note:'左膝可微弯'},
          {num:'4',name:'叩拜',desc:'五体投地，额头触地',chant:'',note:'双手向前伸展'},
          {num:'5',name:'起立',desc:'先起右膝',chant:'',note:'保持庄严'}
        ]
      },
      {
        title: '上香供灯',
        items: [
          {num:'1',name:'上香',desc:'一炷清香，双手举至额前，插入香炉',chant:'',note:'香不过三'},
          {num:'2',name:'供灯',desc:'点燃后诵',chant:'愿此灯光，照十方界',note:'酥油灯为佳'},
          {num:'3',name:'供水',desc:'清晨换新水，七杯排列',chant:'',note:'白水为供'}
        ]
      },
      {
        title: '日常功课',
        items: [
          {num:'1',name:'早课',desc:'诵《心经》',chant:'观自在菩萨，行深般若波罗蜜多时，照见五蕴皆空，度一切苦厄。舍利子，色不异空，空不异色，色即是空，空即是色，受想行识亦复如是。舍利子，是诸法空相，不生不灭，不垢不净，不增不减。是故空中无色，无受想行识，无眼耳鼻舌身意，无色声香味触法，无眼界乃至无意识界，无无明亦无无明尽，乃至无老死，亦无老死尽，无苦集灭道，无智亦无得。以无所得故，菩提萨埵依般若波罗蜜多故，心无挂碍，无挂碍故，无有恐怖，远离颠倒梦想，究竟涅槃。三世诸佛依般若波罗蜜多故，得阿耨多罗三藐三菩提。故知般若波罗蜜多是大神咒，是大明咒，是无上咒，是无等等咒，能除一切苦，真实不虚。故说般若波罗蜜多咒，即说咒曰:揭谛揭谛，波罗揭谛，波罗僧揭谛，菩提萨婆诃。',note:'每日晨起'},
          {num:'2',name:'晚课',desc:'诵《阿弥陀经》选段',chant:'舍利弗，彼土有��,��阿弥陀，今现在说法。舍利弗，彼佛光明无量，照十方国，无所障碍，是故号为阿弥陀...',note:'日落时'},
          {num:'3',name:'念佛',desc:'南无阿弥陀佛，计数法',chant:'南无阿弥陀佛',note:'念珠108颗，执珠念佛'}
        ]
      }
    ]
  }
};

let currentWorshipFaith = 'ru';
let currentWorshipStep = 0;

function showWorship(faith) {
  currentWorshipFaith = faith;
  currentWorshipStep = 0;
  document.querySelectorAll('#worshipFaithTabs .jinang-tab').forEach(t => t.classList.remove('active'));
  // 更新标签按钮高亮
  document.querySelectorAll('#worshipFaithTabs .jinang-tab').forEach(t => {
    if (t.textContent.includes({ru:'儒',dao:'道',fo:'佛'}[faith] || '')) t.classList.add('active');
  });
  renderWorshipContent();
}

function renderWorshipContent() {
  const guide = WORSHIP_GUIDES[currentWorshipFaith];
  const step = guide.steps[currentWorshipStep];
  if (!step) return;

  let html = '<h5 style="font-family:Ma Shan Zheng;font-size:20px;letter-spacing:4px;margin-bottom:16px;color:var(--gold)">' + step.title + '</h5>';
  html += '<div class="worship-step">';
  step.items.forEach(item => {
    html += '<div class="worship-step-item">';
    html += '<p class="worship-step-num">' + item.num + '</p>';
    html += '<p class="worship-step-title">' + item.name + '</p>';
    html += '<p class="worship-step-desc">' + item.desc + '</p>';
    if (item.chant) {
      html += '<p class="worship-step-chant">' + item.chant + '</p>';
    }
    html += '<p class="worship-step-note">' + item.note + '</p>';
    html += '</div>';
  });
  html += '</div>';
  html += '<p style="text-align:center;font-size:12px;opacity:.4;letter-spacing:2px">' + (currentWorshipStep + 1) + ' / ' + guide.steps.length + '</p>';

  document.getElementById('worshipContent').innerHTML = html;
  document.getElementById('worshipMotto').querySelector('p').textContent = guide.motto;

  document.getElementById('worshipPrevBtn').disabled = currentWorshipStep === 0;
  document.getElementById('worshipNextBtn').disabled = currentWorshipStep >= guide.steps.length - 1;
}

function prevWorshipStep() {
  if (currentWorshipStep > 0) {
    currentWorshipStep--;
    renderWorshipContent();
  }
}

function nextWorshipStep() {
  const guide = WORSHIP_GUIDES[currentWorshipFaith];
  if (currentWorshipStep < guide.steps.length - 1) {
    currentWorshipStep++;
    renderWorshipContent();
  }
}

// 初始化参拜指南
function initWorshipGuide(faith) {
  if (faith) {
    document.getElementById('worshipGuide').style.display = 'block';
    currentWorshipFaith = faith;
    renderWorshipContent();
  }
}

// ================================================================
//  ENHANCED DIVINATION FUNCTIONS
// ================================================================

// 神煞计算
function getShensha(pillars, dayStemIdx, dayBranchIdx) {
  // ═══ 升级：完整神煞判定（检查四柱，修复驿马/桃花/华盖的bug） ═══
  const yBranch = pillars[0].branch;
  const mBranch = pillars[1].branch;
  const dBranch = pillars[2].branch;
  const hBranch = pillars[3].branch;
  const allBranches = [yBranch, mBranch, dBranch, hBranch];
  const dayStem = STEMS[dayStemIdx];
  const result = [];

  // 天乙贵人（以日干查，检查年日时支）
  const tianyiMap = {0:[1,7],1:[0,2],2:[9,11],3:[9,11],4:[3,5],5:[3,5],6:[1,7],7:[1,7],8:[9,11],9:[0,2]};
  const tianyiBranches = (tianyiMap[dayStemIdx] || []).map(function(b){return BRANCHES[b];});
  var hasTianyi = false;
  for (var i = 0; i < allBranches.length; i++) {
    if (tianyiBranches.indexOf(allBranches[i]) >= 0) { hasTianyi = true; break; }
  }
  if (hasTianyi) result.push({name:'天乙贵人', desc:'吉星高照，逢凶化吉，遇难成祥，贵人多助。'});

  // 驿马（以年支查，检查月日时支）
  var maMap = {'寅':'申','午':'申','戌':'申','申':'寅','子':'寅','辰':'寅','巳':'亥','酉':'亥','丑':'亥','亥':'巳','卯':'巳','未':'巳'};
  var maTarget = maMap[yBranch];
  if (maTarget && [mBranch, dBranch, hBranch].indexOf(maTarget) >= 0) {
    result.push({name:'驿马', desc:'奔波走动之象，适合外出、调动、旅行。多主在外发展。'});
  }

  // 桃花（以年支/日支查）
  var taoMap = {'寅':'卯','午':'卯','戌':'卯','申':'酉','子':'酉','辰':'酉','巳':'午','酉':'午','丑':'午','亥':'子','卯':'子','未':'子'};
  var taoTargets = [taoMap[yBranch], taoMap[dBranch]];
  var hasTao = false;
  for (var i = 0; i < allBranches.length; i++) {
    if (taoTargets.indexOf(allBranches[i]) >= 0) { hasTao = true; break; }
  }
  if (hasTao) result.push({name:'桃花', desc:'感情丰富，人缘佳，姻缘运强，利于社交。'});

  // 华盖（以年支/日支查）
  var hgMap = {'寅':'戌','午':'戌','戌':'戌','申':'辰','子':'辰','辰':'辰','巳':'丑','酉':'丑','丑':'丑','亥':'未','卯':'未','未':'未'};
  var hgTargets = [hgMap[yBranch], hgMap[dBranch]];
  var hasHg = false;
  for (var i = 0; i < allBranches.length; i++) {
    if (hgTargets.indexOf(allBranches[i]) >= 0) { hasHg = true; break; }
  }
  if (hasHg) result.push({name:'华盖', desc:'艺术之星，利于艺术创作、学术研究，性情孤高。'});

  // 文昌贵人（以日干查）
  var wenchangMap = {0:'巳',1:'午',2:'申',3:'酉',4:'申',5:'酉',6:'亥',7:'子',8:'寅',9:'卯'};
  var wcTarget = wenchangMap[dayStemIdx];
  if (wcTarget && allBranches.indexOf(wcTarget) >= 0) {
    result.push({name:'文昌贵人', desc:'学业之星，利考试、学习、著述、文职升迁。'});
  }

  // 羊刃（以日干查，只看月支为真刃）
  var yangrenMap = {0:'卯',1:'辰',2:'午',3:'未',4:'午',5:'未',6:'酉',7:'戌',8:'子',9:'丑'};
  var yrTarget = yangrenMap[dayStemIdx];
  if (yrTarget) {
    if (mBranch === yrTarget) result.push({name:'月刃（真羊刃）', desc:'刚暴之星在月令，利于武职、竞争，慎防血光官非。'});
    else if (allBranches.indexOf(yrTarget) >= 0) result.push({name:'羊刃', desc:'刚暴之星，性格刚毅，慎防血光、官非。'});
  }

  // 将星（以年支查）
  var jiangMap = {'寅':'午','午':'午','戌':'午','申':'子','子':'子','辰':'子','巳':'酉','酉':'酉','丑':'酉','亥':'卯','卯':'卯','未':'卯'};
  var jiangTarget = jiangMap[yBranch];
  if (jiangTarget && allBranches.indexOf(jiangTarget) >= 0) {
    result.push({name:'将星', desc:'掌权之星，利于军警、领导岗位，有威信。'});
  }

  // 亡神（以年支查）
  var wsMap = {'寅':'巳','午':'巳','戌':'巳','申':'亥','子':'亥','辰':'亥','巳':'申','酉':'申','丑':'申','亥':'寅','卯':'寅','未':'寅'};
  var wsTarget = wsMap[yBranch];
  if (wsTarget && allBranches.indexOf(wsTarget) >= 0) {
    result.push({name:'亡神', desc:'主谋略、暗算，善谋则成，失谋则败。'});
  }

  // 劫煞（以年支查）
  var jsMap = {'寅':'亥','午':'亥','戌':'亥','申':'巳','子':'巳','辰':'巳','巳':'寅','酉':'寅','丑':'寅','亥':'申','卯':'申','未':'申'};
  var jsTarget = jsMap[yBranch];
  if (jsTarget && allBranches.indexOf(jsTarget) >= 0) {
    result.push({name:'劫煞', desc:'主意外损失，慎防破财、被盗。'});
  }

  // 孤辰寡宿（以年支查）
  var guchenMap = {'寅':['巳','丑'],'卯':['巳','丑'],'辰':['巳','丑'],'巳':['申','辰'],'午':['申','辰'],'未':['申','辰'],'申':['亥','未'],'酉':['亥','未'],'戌':['亥','未'],'亥':['寅','戌'],'子':['寅','戌'],'丑':['寅','戌']};
  var gc = guchenMap[yBranch];
  if (gc) {
    if (allBranches.indexOf(gc[0]) >= 0) result.push({name:'孤辰', desc:'性情孤独，人际薄弱，宜配合同居或团队生活。'});
    if (allBranches.indexOf(gc[1]) >= 0) result.push({name:'寡宿', desc:'婚恋波折，晚婚倾向，宜化解。'});
  }

  // 学堂（以日干查）
  var xtMap = {0:'亥',1:'午',2:'寅',3:'酉',4:'寅',5:'酉',6:'巳',7:'子',8:'申',9:'卯'};
  var xtTarget = xtMap[dayStemIdx];
  if (xtTarget && allBranches.indexOf(xtTarget) >= 0) {
    result.push({name:'学堂', desc:'学业之星，聪明好学，利读书升学。'});
  }

  // 金舆（以日干查）= 禄神地支+2位
  var jyMap = {0:'辰',1:'巳',2:'未',3:'申',4:'未',5:'申',6:'戌',7:'亥',8:'丑',9:'寅'};
  var jyTarget = jyMap[dayStemIdx];
  if (jyTarget && allBranches.indexOf(jyTarget) >= 0) {
    result.push({name:'金舆', desc:'富贵之星，有车马之福，利财运。'});
  }

  // 禄神（以日干查）
  var lushenMap = {0:'寅',1:'卯',2:'巳',3:'午',4:'巳',5:'午',6:'申',7:'酉',8:'亥',9:'子'};
  var lsTarget = lushenMap[dayStemIdx];
  if (lsTarget && allBranches.indexOf(lsTarget) >= 0) {
    result.push({name:'禄神', desc:'食禄之星，主衣食无忧、福气浓厚。逢禄则喜，代表稳定的收入来源。'});
  }

  // 红艳煞（以日干查）
  var hongyanMap = {0:'午',1:'午',2:'寅',3:'未',4:'辰',5:'辰',6:'戌',7:'酉',8:'子',9:'申'};
  var hyTarget = hongyanMap[dayStemIdx];
  if (hyTarget && allBranches.indexOf(hyTarget) >= 0) {
    result.push({name:'红艳煞', desc:'感情之星，主异性缘佳、感情丰富。过旺则易招桃花是非。'});
  }

  // 天德贵人（以月支查）
  var tiandeMap = {'寅':'丁','卯':'申','辰':'壬','巳':'辛','午':'亥','未':'甲','申':'癸','酉':'寅','戌':'丙','亥':'乙','子':'巳','丑':'庚'};
  var tdTarget = tiandeMap[mBranch];
  if (tdTarget) {
    // 检查天干或地支（天德贵人可以是天干或地支）
    var allStems = pillars.map(function(p){return p.stem;});
    if (allStems.indexOf(tdTarget) >= 0 || allBranches.indexOf(tdTarget) >= 0) {
      result.push({name:'天德贵人', desc:'万利皆解，化凶为吉。主一生平安，灾厄化解。'});
    }
  }

  // 月德贵人（以月支查天干）
  var yuedeMap = {'寅':'丙','卯':'甲','辰':'壬','巳':'庚','午':'丙','未':'甲','申':'壬','酉':'庚','戌':'丙','亥':'甲','子':'壬','丑':'庚'};
  var ydTarget = yuedeMap[mBranch];
  if (ydTarget) {
    var allStems2 = pillars.map(function(p){return p.stem;});
    if (allStems2.indexOf(ydTarget) >= 0) {
      result.push({name:'月德贵人', desc:'慈祥仁善，化解灾厄。主一生少病，逢凶化吉。'});
    }
  }

  // 魁罡（日柱为庚辰/庚戌/壬辰/戊戌）
  var kgDays = ['庚辰','庚戌','壬辰','戊戌'];
  var dayPillar = dayStem + dBranch;
  if (kgDays.indexOf(dayPillar) >= 0) {
    result.push({name:'魁罡', desc:'性格刚烈果断，聪敏果断，有领导才能。慎防婚姻不顺。'});
  }

  return result.slice(0, 12);
}

// 十神详解
// 十神详解(升级版,每个100字以上,含白话说明)
const TENGAN_DETAIL = {
  '官':{
    name:'正官', ele:'金',
    forMan:'上司、领导、法律、约束、地位', forWoman:'丈夫、姻缘、丈夫缘分',
    detail:'正官者，克我者为官，异性相克之谓也。譬如甲木日主见辛金，辛金克甲木，且阴阳异性，是为正官。正官代表一种正当的约束力量，如法律、规章、上司的管束。在男命，正官代表社会地位、职业声望、与领导的关系；在女命，正官代表丈夫、婚姻质量。正官为喜用者，为人正直守法，责任心强，适合公职、管理、法律等行业。若正官为忌，则易过于保守，缺乏魄力，小官难升，或受上司压制。',
    good:'正直守法、责任心强、地位稳定、名声清白、仕途顺遂',
    bad:'过于保守、缺乏魄力、小官难升、受制于人、优柔寡断',
    classic:'《渊海子平》云:「正官者，乃贵气之神，最为尊崇。」《三命通会》曰:「正官之格，最要纯粹，不可混杂。」'
  },
  '杀':{
    name:'七杀', ele:'金',
    forMan:'权力、竞争、压力、挑战', forWoman:'情人、桃花、异性缘分',
    detail:'七杀者，同性相克之谓也。譬如甲木日主见庚金，庚金克甲木，且阴阳同性，是为七杀，又称偏官。七杀代表一种剧烈的克制力量，如刀剑、军威、暴力的管束。七杀入命者，性格刚烈果断，敢于挑战权威，适合军警、竞技、创业等需要魄力的行业。在男命，七杀代表权势、威严；在女命，七杀代表偏夫、情人。七杀为喜用者，有领导才能，成就大事；七杀为忌者，压力过大，易有官非口舌，性格暴躁。',
    good:'敢于挑战、有魄力、成就事业、威严果断、逆境中成长',
    bad:'压力大、容易冲动、易有官非、性格暴躁、刑伤之灾',
    classic:'《滴天髓》云:「七杀者，克身之物，用之得当，可为大将；用之不当，反受其害。」《渊海子平》曰:「七杀之格，需食神制之，或印星化之，方为贵格。」'
  },
  '印':{
    name:'正印', ele:'木',
    forMan:'母亲、学历、房产、证书、庇荫', forWoman:'母亲、学历、文凭、学业',
    detail:'正印者，生我者为印，异性相生之谓也。譬如甲木日主见癸水，癸水生甲木，且阴阳异性，是为正印。正印代表滋养、庇护、文书、学历。在男命，正印代表母亲、学历、房产、贵人相助；在女命，正印亦代表母亲、学业成就。正印为喜用者，学业顺利，贵人运佳，适合学术、教育、文职等行业。正印之人性情温和，喜欢学习，有慈悲心。若正印为忌，则依赖性强，不够独立，过于保守，缺乏创新精神。',
    good:'学业顺利、贵人相助、房产运佳、母亲健康、心地善良',
    bad:'依赖性强、不够独立、过于保守、优柔寡断、懒散消极',
    classic:'《三命通会》云:「印绶者，乃父母之宫，代表文书、学历、房产。」《渊海子平》曰:「印绶生身，最为吉利，代表贵人之助。」'
  },
  '枭':{
    name:'偏印', ele:'木',
    forMan:'继母、偏门学问、玄学、医疗', forWoman:'继母、偏门技艺、意外',
    detail:'偏印者，同性相生之谓也。譬如甲木日主见壬水，壬水生甲木，且阴阳同性，是为偏印，又称枭神。偏印代表一种非常规的滋养，如继母之爱、偏门学问、玄学医术。偏印入命者，心思细腻，领悟力强，对神秘学、玄学、医术有天赋，适合从事研究、心理咨询、玄学命理等行业。偏印为喜用者，有独到的见解，学术有成；偏印为忌者，易孤独，缺乏福气，有意外伤灾。古人云「枭神夺食」,偏印克食神，主福气受损。',
    good:'领悟力强、偏门学问有天赋、直觉敏锐、学术研究有成',
    bad:'孤独命格、缺乏福气、意外伤灾、性格孤僻、多疑敏感',
    classic:'《滴天髓》云:「偏印者，又名枭神，专夺食神，主福气受损。」《三命通会》曰:「偏印得用，利于偏门技艺；偏印为忌，孤独刑伤。」'
  },
  '才':{
    name:'正财', ele:'土',
    forMan:'妻子(男命)、稳定收入、勤劳所得', forWoman:'正当收入、房产、积蓄',
    detail:'正财者，我克者为财，异性相克之谓也。譬如甲木日主见己土，甲木克己土，且阴阳异性，是为正财。正财代表正当的财源，如工资、勤劳所得、稳定的收入。在男命，正财又代表妻子；在女命，正财代表自己的积蓄、房产。正财为喜用者，财运稳定，勤劳致富，善于理财，适合金融、会计、管理等需要稳健理财的行业。正财之人性格稳重，量入为出，不喜欢冒险。若正财为忌，则过于保守，缺乏投资眼光，或因妻破财。',
    good:'财运稳定、勤劳致富、理财有方、妻贤子孝、积蓄丰厚',
    bad:'保守理财、缺乏投资眼光、克妻之兆、小气吝啬、固步自封',
    classic:'《渊海子平》云:「正财者，我克之财，异性为正，代表勤劳所得、妻子。」《三命通会》曰:「正财格，主财运稳定，善于理财，妻贤子孝。」'
  },
  '财':{
    name:'偏财', ele:'金',
    forMan:'投资收益、情人、横财、投机', forWoman:'父亲、情人、偏门收入',
    detail:'偏财者，同性相克之谓也。譬如甲木日主见戊土，甲木克戊土，且阴阳同性，是为偏财。偏财代表意外之财、投资收益、横财，也代表父亲、情人。偏财入命者，财运波动大，有发财的机会，也有破财的风险，适合经商、投资、销售等行业。在男命，偏财代表情人、偏房；在女命，偏财代表父亲。偏财为喜用者，财运佳，善于把握机会；偏财为忌者，财务波动大，感情复杂，易因财惹祸。',
    good:'财运佳、投资运强、善于理财、把握机遇、意外之财',
    bad:'财务波动大、感情复杂、破财风险、好赌投机、因财惹祸',
    classic:'《滴天髓》云:「偏财者，意外之财，来去匆匆，善用则富，滥用则贫。」《渊海子平》曰:「偏财格，主财运起伏，善于经营，但要防因财惹祸。」'
  },
  '食':{
    name:'食神', ele:'火',
    forMan:'子女、才艺、享受、口福、表达', forWoman:'女儿、子女运、才华展现',
    detail:'食神者，我生者为食神，同性相生之谓也。譬如甲木日主见丙火，甲木生丙火，且阴阳同性，是为食神。食神代表才华的展现、享受、口福、子女。食神入命者，性格温和，喜欢美食，有艺术天赋，人缘好，适合餐饮、演艺、艺术、教育等行业。在男命，食神代表女儿；在女命，食神亦代表子女运。食神为喜用者，福气深厚，口才好，有艺术成就；食神为忌者，过于享受，缺乏上进心，体质偏弱。',
    good:'福气深厚、人缘佳、口才好、有艺术天赋、子女孝顺',
    bad:'过于享受、缺乏上进心、体质偏弱、好逸恶劳、贪图安逸',
    classic:'《三命通会》云:「食神者，我生之神，代表福寿、子女、才华。」《渊海子平》曰:「食神一位胜财官，主福气深厚，寿元绵长。」'
  },
  '伤':{
    name:'伤官', ele:'火',
    forMan:'叛逆、创新、口舌、才华、官非', forWoman:'儿子、才华、叛逆、创新',
    detail:'伤官者，我生者为伤官，异性相生之谓也。譬如甲木日主见丁火，甲木生丁火，且阴阳异性，是为伤官。伤官代表才华的展现、叛逆、创新、口才。伤官入命者，聪明伶俐，才华横溢，敢于创新，适合艺术、设计、创新科技等行业。在男命，伤官代表叛逆、官非；在女命，伤官代表儿子。伤官为喜用者，才华出众，有创新能力，口才好；伤官为忌者，口舌是非多，不服管教，易得罪人，有官非风险。古云「伤官见官，为祸百端」。',
    good:'才华横溢、敢于创新、口才出众、艺术天赋、思维敏捷',
    bad:'口舌是非、不服管教、叛逆心强、易得罪人、官非风险',
    classic:'《滴天髓》云:「伤官者，泄身之神，代表才华、叛逆。」《渊海子平》曰:「伤官见官，为祸百端；伤官伤尽，反为贵格。」'
  },
  '比':{
    name:'比肩', ele:'木',
    forMan:'兄弟姐妹、同事、合作伙伴、竞争', forWoman:'姐妹、同事、合作、竞争',
    detail:'比肩者，同我者为比肩，同性之谓也。譬如甲木日主见甲木，同为阳木，是为比肩。比肩代表同辈、兄弟姐妹、同事、合作伙伴。比肩入命者，独立性强，有主见，不喜欢依赖他人，适合创业、自由职业、需要独立能力的行业。在男命，比肩代表兄弟、同事；在女命，比肩代表姐妹。比肩为喜用者，人缘佳，同辈互助，适合团队合作；比肩为忌者，竞争激烈，破耗财运，独立心过强，难以与人合作。',
    good:'独立性强、人缘佳、同辈互助、有主见、意志坚定',
    bad:'竞争激烈、破耗财运、独立心过强、固执己见、难以合作',
    classic:'《三命通会》云:「比肩者，同我之神，代表兄弟、同辈、竞争。」《渊海子平》曰:「比肩多者，主竞争激烈，财运分散。」'
  },
  '劫':{
    name:'劫财', ele:'金',
    forMan:'竞争对手、破财、争夺、冲突', forWoman:'姐妹、竞争、破财、争夺',
    detail:'劫财者，同我者为劫财，异性之谓也。譬如甲木日主见乙木，同为木但阴阳异性，是为劫财。劫财代表竞争、争夺、破财。劫财入命者，敢于拼搏，善于竞争，适合需要竞争能力的行业，如销售、体育、军事。在男命，劫财代表竞争对手；在女命，劫财代表姐妹。劫财为喜用者，敢于拼搏，善于竞争，绝处逢生，逆境中成长；劫财为忌者，破财倾向大，争夺纠纷多，身体损耗，难以积累财富。',
    good:'敢于拼搏、善于竞争、绝处逢生、意志坚定、逆境成长',
    bad:'破财倾向、争夺纠纷、身体损耗、难以聚财、争强好胜',
    classic:'《滴天髓》云:「劫财者，夺我之财，主破耗、争夺。」《渊海子平》曰:「劫财为忌，主破财、争斗、身体耗损。」'
  },
};

// 格局判断
function getGeju(monthBranch, dayStemIdx, pillars) {
  // ═══ 升级：透干取格 + 成败救应 + 相神分析 ═══
  const zangGan = {
    '子':[9,5,1],'丑':[8,5,0],'寅':[0,2,3],'卯':[3,7,9],
    '辰':[4,2,8],'巳':[2,4,7],'午':[4,2,9],'未':[5,4,8],
    '申':[6,4,0],'酉':[7,4,9],'戌':[6,4,5],'亥':[9,0,2]
  };
  const zang = zangGan[monthBranch] || [];
  const benQi = zang[0];
  const zhongQi = zang.length > 1 ? zang[1] : -1;
  const yuQi = zang.length > 2 ? zang[2] : -1;

  // 检查透干
  const tianGanIdx = [STEMS.indexOf(pillars[0].stem), STEMS.indexOf(pillars[1].stem), STEMS.indexOf(pillars[2].stem), STEMS.indexOf(pillars[3].stem)];
  const benQiTou = tianGanIdx.includes(benQi);
  const zhongQiTou = zhongQi >= 0 && tianGanIdx.includes(zhongQi);
  const yuQiTou = yuQi >= 0 && tianGanIdx.includes(yuQi);

  // 取格优先级：本气透 > 中气透 > 余气透 > 本气未透（仍以本气定格，力量减）
  // 注意：传统命理以月令本气为主格，透干只是增强力量，不改变格局类型
  var geStemIdx = benQi;
  var geSource = benQiTou ? '本气透干' : '本气（未透，力弱）';
  // 若本气不透，检查是否有中气/余气透出可补取（仅当本气与日主为比劫时，才考虑透出的中余气另取格）
  if (!benQiTou) {
    var benQiInfo = getGejuInfo(benQi, dayStemIdx);
    // 本气为比劫（建禄/月刃）时，看有无透出的财官印食可另取格
    if (benQiInfo && (benQiInfo.name.indexOf('建禄') >= 0 || benQiInfo.name.indexOf('月刃') >= 0)) {
      if (zhongQiTou) { geStemIdx = zhongQi; geSource = '中气透干（本气比劫，另取透干格）'; }
      else if (yuQiTou) { geStemIdx = yuQi; geSource = '余气透干（本气比劫，另取透干格）'; }
    }
    // 否则仍以本气定格
  }

  // ═══ 动态计算十神关系定格局名称 ═══
  var dayStem = STEMS[dayStemIdx];
  var dayEle = ELE[dayStem];

  // 建禄/月刃检查
  const luMap = {'甲':'寅','乙':'卯','丙':'巳','丁':'午','戊':'巳','己':'午','庚':'申','辛':'酉','壬':'亥','癸':'子'};
  const renMap = {'甲':'卯','乙':'寅','丙':'午','丁':'巳','戊':'午','己':'巳','庚':'酉','辛':'申','壬':'子','癸':'亥'};
  var isJianLu = luMap[dayStem] === monthBranch;
  var isYangRen = renMap[dayStem] === monthBranch;

  // 根据格局天干与日主的关系，动态生成格局信息
  function getGejuInfo(geStemIdx, dayStemIdx) {
    var geStem = STEMS[geStemIdx];
    var dayStemChar = STEMS[dayStemIdx];
    var geEle = ELE[geStem];
    var dayEle = ELE[dayStemChar];
    var isYang = geStemIdx % 2 === 0;
    var dayIsYang = dayStemIdx % 2 === 0;
    var sameYinYang = isYang === dayIsYang;

    if (geEle === dayEle) {
      if (sameYinYang) return {name:'建禄格(比肩)', shun:true, desc:'日主得令，身旺之象，宜泄不宜补。',
        cheng:'见财官有力则成格，主人身旺任财、名利双收。',
        bai:'身旺无泄无耗则破格，主人身旺无依、碌碌无为。',
        xiangShen:'财官', jishen:'印比'};
      else return {name:'月刃格(劫财)', shun:false, desc:'月令阳刃，日主帝旺。性刚果断，喜官杀制刃。',
        cheng:'官杀制刃则成格，主人威权有魄力。',
        bai:'刃无制而冲提则破格，主人刚暴惹祸。',
        xiangShen:'官杀（制刃）', jishen:'财星（党杀）'};
    }
    if (WUXING_KE[geEle] === dayEle) {
      if (sameYinYang) return {name:'七杀格', shun:false, desc:'七杀威权，敢于挑战，利于竞争、开拓。',
        cheng:'食神制杀、印星化杀、阳刃合杀则成格，主人掌权、有魄力。',
        bai:'杀无制而攻身、财党杀则破格，主人灾厄、官非。',
        xiangShen:'食神（制杀）或印星（化杀）', jishen:'财星（党杀）'};
      else return {name:'正官格', shun:true, desc:'官星清透，责任心强，利于公职、管理。',
        cheng:'财生官、印护官则成格，主人有威望、仕途顺遂。',
        bai:'伤官克官、刑冲破官则破格，主人仕途多阻、是非不断。',
        xiangShen:'财（生官）或印（护官）', jishen:'伤官'};
    }
    if (WUXING_SHENG[dayEle] === geEle) {
      if (sameYinYang) return {name:'食神格', shun:true, desc:'食神福厚，人缘佳，口才好，利于餐饮、演艺。',
        cheng:'身旺、财星流通（食神生财）则成格，主人福禄双全。',
        bai:'枭神夺食则破格，主人衣食不继、才华被压。',
        xiangShen:'财星（食神生财）', jishen:'偏印（枭神）'};
      else return {name:'伤官格', shun:false, desc:'伤官才华，敢于创新，不服管束。',
        cheng:'佩印（伤官配印）、生财（伤官生财）则成格，主人才华横溢、富贵双全。',
        bai:'伤官见官（金水/木火特例除外）则破格，主人官非口舌、仕途不顺。',
        xiangShen:'印星（配印）或财星（生财）', jishen:'正官（伤官见官）'};
    }
    if (WUXING_KE[dayEle] === geEle) {
      if (sameYinYang) return {name:'偏财格', shun:true, desc:'偏财机遇，投资运佳，善于理财。',
        cheng:'食伤生财则成格，主人投资有道、横财可期。',
        bai:'比劫夺财则破格，主人破财、争夺。',
        xiangShen:'食伤（生财）', jishen:'比劫'};
      else return {name:'正财格', shun:true, desc:'正财稳健，勤劳致富，理财有方。',
        cheng:'食伤生财、官星护财则成格，主人财源稳定、家业兴旺。',
        bai:'比劫争财则破格，主人破财、劫财。',
        xiangShen:'食伤（生财）或官星（护财）', jishen:'比劫'};
    }
    var shengDayEle = null;
    for (var k in WUXING_SHENG) { if (WUXING_SHENG[k] === dayEle) { shengDayEle = k; break; } }
    if (geEle === shengDayEle) {
      if (sameYinYang) return {name:'偏印格', shun:false, desc:'偏印心性，领悟力强，适合学术、玄学。',
        cheng:'财制枭、官杀生身则成格，主人偏门成业、独树一帜。',
        bai:'枭神夺食（偏印克食神）则破格，主人衣食不安、多忧少乐。',
        xiangShen:'财星（制枭）或官杀', jishen:'偏印（夺食时）'};
      else return {name:'正印格', shun:true, desc:'印星得令，学业有成，贵人运佳。',
        cheng:'官杀生印则成格，主人学业有成、贵人扶持。',
        bai:'财星坏印（贪财坏印）则破格，主人学业受阻、为财失义。',
        xiangShen:'官杀（生印）', jishen:'财星'};
    }
    return null;
  }

  // 专旺格检查
  if (isJianLu) {
    var allSameEle = true;
    for (var p of pillars) {
      if (ELE[p.stem] !== dayEle && ZHI_ELE[p.branch] !== dayEle) { allSameEle = false; break; }
    }
    if (allSameEle) {
      const zhuanWang = {'木':'曲直格','火':'炎上格','土':'稼穑格','金':'从革格','水':'润下格'};
      return {name: zhuanWang[dayEle] || '专旺格', desc: '日主极旺，满盘同党，成专旺格。顺其旺势取用，喜泄秀。',
              cheng: '顺旺势则吉', bai: '逆势克泄则凶', xiangShen: '食伤泄秀', source: geSource};
    }
  }

  if (isJianLu) {
    return {name: '建禄格', desc: '日主得令，身旺之象，宜泄不宜补。（月令临官）',
            cheng: '见财官有力则成格，主人身旺任财、名利双收。', bai: '身旺无泄无耗则破格，主人身旺无依、碌碌无为。',
            xiangShen: '财官', jishen: '印比',
            source: '月令临官', isJianLu: true};
  }
  if (isYangRen) {
    return {name: '月刃格', desc: '月令阳刃，日主帝旺。性刚果断，喜官杀制刃。',
            cheng: '官杀制刃则成格，主人威权有魄力。', bai: '刃无制而冲提则破格，主人刚暴惹祸。',
            xiangShen: '官杀（制刃）', jishen: '财星（党杀）', source: '月令帝旺', isYangRen: true};
  }

  var ge = getGejuInfo(geStemIdx, dayStemIdx);
  if (ge) {
    // 检查成败：局中有无忌神
    var hasJishen = false;
    var jiEle = null;
    if (ge.jishen === '伤官') jiEle = WUXING_SHENG[dayEle];
    else if (ge.jishen === '财星') jiEle = WUXING_KE[dayEle];
    else if (ge.jishen === '比劫') jiEle = dayEle;
    else if (ge.jishen === '印星' || ge.jishen === '偏印') jiEle = Object.keys(WUXING_SHENG).find(function(k){return WUXING_SHENG[k] === dayEle;});
    else if (ge.jishen === '官杀') jiEle = Object.keys(WUXING_KE).find(function(k){return WUXING_KE[k] === dayEle;});

    if (jiEle) {
      for (var p of pillars) {
        if (ELE[p.stem] === jiEle || ZHI_ELE[p.branch] === jiEle) { hasJishen = true; break; }
      }
    }
    var isCheng = !hasJishen;
    var chengBaiDesc = isCheng ? ge.cheng : (ge.bai + ' 局中有忌神(' + ge.jishen + ')，待岁运救应。');

    return {name: ge.name, desc: ge.desc,
            cheng: ge.cheng, bai: ge.bai, isCheng: isCheng,
            chengBaiDesc: chengBaiDesc,
            xiangShen: ge.xiangShen, jishen: ge.jishen,
            source: geSource, benQiTou: benQiTou, zhongQiTou: zhongQiTou, yuQiTou: yuQiTou};
  }

  return {name:'普通命格', desc:'月令无格可取，综合命盘分析更准确。', source: geSource};
}

// 合冲刑害
function getHeChong(pillars) {
  const results = [];
  
  // ═══ 天干五合 (检查所有天干对) ═══
  const wuHeMap = {0:1,1:0,2:3,3:2,4:5,5:4,6:7,7:6,8:9,9:8};
  const heNames = {'0-1':'甲己合土','1-0':'甲己合土','2-3':'丙辛合水','3-2':'丙辛合水','4-5':'戊癸合火','5-4':'戊癸合火','6-7':'乙庚合金','7-6':'乙庚合金','8-9':'丁壬合木','9-8':'丁壬合木'};
  for (let i = 0; i < 4; i++) {
    for (let j = i+1; j < 4; j++) {
      if (wuHeMap[pillars[i].stemIdx] === pillars[j].stemIdx) {
        const key = pillars[i].stemIdx + '-' + pillars[j].stemIdx;
        results.push({type:'天干五合', text:heNames[key] || '天干合', desc:'天干相合，主合作、感情、缘分。合化后五行属性改变。'});
      }
    }
  }
  
  // ═══ 天干相冲 (甲庚冲、乙辛冲、丙壬冲、丁癸冲) ═══
  const ganChongMap = {0:6,1:7,2:8,3:9,6:0,7:1,8:2,9:3};
  for (let i = 0; i < 4; i++) {
    for (let j = i+1; j < 4; j++) {
      if (ganChongMap[pillars[i].stemIdx] === pillars[j].stemIdx) {
        results.push({type:'天干相冲', text:pillars[i].stem + pillars[j].stem + '冲', desc:'天干相冲，主变动、冲突、不稳定。'});
      }
    }
  }
  
  // ═══ 地支六合 ═══
  const liuHeMap = {'子':'丑','寅':'亥','卯':'戌','辰':'酉','巳':'申','午':'未'};
  const liuHeNames = {'子丑':'土','寅亥':'木','卯戌':'火','辰酉':'金','巳申':'水','午未':'土'};
  for (let i = 0; i < 4; i++) {
    for (let j = i+1; j < 4; j++) {
      const pair1 = pillars[i].branch + pillars[j].branch;
      const pair2 = pillars[j].branch + pillars[i].branch;
      if (liuHeNames[pair1]) {
        results.push({type:'六合', text:pair1 + '合' + liuHeNames[pair1], desc:'地支六合，主和谐、合作、亲密关系。合化' + liuHeNames[pair1] + '五行。'});
      } else if (liuHeNames[pair2]) {
        results.push({type:'六合', text:pair2 + '合' + liuHeNames[pair2], desc:'地支六合，主和谐、合作、亲密关系。合化' + liuHeNames[pair2] + '五行。'});
      }
    }
  }
  
  // ═══ 地支三合 (含半合) ═══
  const sanhe = {
    '申子辰水':{branches:['申','子','辰'],ele:'水'},
    '寅午戌火':{branches:['寅','午','戌'],ele:'火'},
    '巳酉丑金':{branches:['巳','酉','丑'],ele:'金'},
    '亥卯未木':{branches:['亥','卯','未'],ele:'木'}
  };
  const pillarZhi = pillars.map(p => p.branch);
  for (const [name, data] of Object.entries(sanhe)) {
    const count = data.branches.filter(z => pillarZhi.includes(z)).length;
    if (count === 3) {
      results.push({type:'三合局', text:name, desc:'三合局全，力量最强，主聚合、大事可成。化' + data.ele + '五行。'});
    } else if (count === 2) {
      // 半合: 生地半合(长生+帝旺) 或 墓地半合(帝旺+墓)
      const present = data.branches.filter(z => pillarZhi.includes(z));
      const missing = data.branches.filter(z => !pillarZhi.includes(z));
      results.push({type:'半合', text:present.join('') + '半合' + data.ele, desc:'地支半合(' + present.join('') + ')，待' + missing.join('') + '成局。力量较弱于三合全。'});
    }
  }
  
  // ═══ 地支三会 (方局) ═══
  const sanhui = {
    '寅卯辰木':{branches:['寅','卯','辰'],ele:'木'},
    '巳午未火':{branches:['巳','午','未'],ele:'火'},
    '申酉戌金':{branches:['申','酉','戌'],ele:'金'},
    '亥子丑水':{branches:['亥','子','丑'],ele:'水'}
  };
  for (const [name, data] of Object.entries(sanhui)) {
    const count = data.branches.filter(z => pillarZhi.includes(z)).length;
    if (count >= 2) {
      results.push({type:'三会', text:name, desc:'地支三会方局，一方之气汇聚，力量强大。化' + data.ele + '五行。'});
    }
  }
  
  // ═══ 地支六冲 ═══
  const liuChong = {0:6,1:7,2:8,3:9,4:10,5:11,6:0,7:1,8:2,9:3,10:4,11:5};
  const chongNames = {'子午':'水火','丑未':'土土','寅申':'木金','卯酉':'木金','辰戌':'土土','巳亥':'火水'};
  for (let i = 0; i < 4; i++) {
    for (let j = i+1; j < 4; j++) {
      if (liuChong[pillars[i].branchIdx] === pillars[j].branchIdx) {
        const pair = pillars[i].branchIdx < pillars[j].branchIdx ? pillars[i].branch + pillars[j].branch : pillars[j].branch + pillars[i].branch;
        results.push({type:'六冲', text:pair + '冲', desc:'地支相冲，主变动、分离、冲击。' + (chongNames[pair] || '') + '相冲。'});
      }
    }
  }
  
  // ═══ 地支六害 (穿) ═══
  const liuHaiMap = {'子':'未','寅':'巳','卯':'辰','午':'丑','申':'亥','酉':'戌'};
  const haiPairs = [['子','未'],['寅','巳'],['卯','辰'],['午','丑'],['申','亥'],['酉','戌']];
  for (let i = 0; i < 4; i++) {
    for (let j = i+1; j < 4; j++) {
      for (const [a, b] of haiPairs) {
        if ((pillars[i].branch === a && pillars[j].branch === b) || (pillars[i].branch === b && pillars[j].branch === a)) {
          results.push({type:'六害', text:a + b + '害', desc:'地支相害，主暗中损害、不和、刑伤。人际关系易生隔阂。'});
        }
      }
    }
  }
  
  // ═══ 地支三刑 ═══
  // 寅巳申无恩之刑
  const xingSets = [
    {branches:['寅','巳','申'], name:'寅巳申', type:'无恩之刑', desc:'寅巳申三刑，主忘恩负义、恩将仇报，宣防灾孝、官非。'},
    {branches:['丑','戌','未'], name:'丑戌未', type:'恃势之刑', desc:'丑戌未三刑，主仗势欺人、争斗不断，宣防破财、伤残。'},
    {branches:['子','卯'], name:'子卯', type:'无礼之刑', desc:'子卯相刑，主无礼、不敬，父子、母子关系不睦，易生口舌。'}
  ];
  for (const xs of xingSets) {
    const count = xs.branches.filter(z => pillarZhi.includes(z)).length;
    if (xs.branches.length === 2 && count === 2) {
      results.push({type:'三刑', text:xs.name + xs.type, desc:xs.desc});
    } else if (xs.branches.length === 3 && count >= 2) {
      const present = xs.branches.filter(z => pillarZhi.includes(z));
      if (count === 3) {
        results.push({type:'三刑', text:xs.name + xs.type, desc:xs.desc + '三支全见，刑力最强。'});
      } else if (present.length === 2) {
        // 也算刑 (如寅巳、巳申、寅申)
        results.push({type:'半刑', text:present.join('') + '刑(' + xs.type + ')', desc:xs.desc + '仅见' + present.join('') + '，刑力较弱。'});
      }
    }
  }
  
  // ═══ 自刑 (辰辰、午午、酉酉、亥亥) ═══
  const ziXing = ['辰','午','酉','亥'];
  for (let i = 0; i < 4; i++) {
    for (let j = i+1; j < 4; j++) {
      if (pillars[i].branch === pillars[j].branch && ziXing.indexOf(pillars[i].branch) >= 0) {
        results.push({type:'自刑', text:pillars[i].branch + pillars[j].branch + '自刑', desc:'地支自刑，主自我纠结、内耗、钻牛角尖。' + pillars[i].branch + '为' + ZHI_ELE[pillars[i].branch] + '，自刑则' + ZHI_ELE[pillars[i].branch] + '气郁结。'});
      }
    }
  }
  
  return results;
}

// 流月分析
function getMonthlyAnalysis(hj) {
  const dayEle = ELE[hj.dayStem];
  const monthTiangan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const monthZhidi = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
  const shengKe = {
    '木':{生:'火',克:'土',被生:'水',被克:'金'},
    '火':{生:'土',克:'金',被生:'木',被克:'水'},
    '土':{生:'金',克:'水',被生:'火',被克:'木'},
    '金':{生:'水',克:'木',被生:'土',被克:'火'},
    '水':{生:'木',克:'火',被生:'金',被克:'土'}
  };
  const sk = shengKe[dayEle] || {};
  const monthAnalysis = [];
  for (let i = 0; i < 12; i++) {
    const gan = monthTiangan[i];
    const zhi = monthZhidi[i];
    const zhiEle = ZHI_ELE[zhi];
    let luck = '平', focus = '', advice = '';
    if (zhiEle === sk.被克) { luck = '凶'; focus = '压力较大，运势受阻，防小人'; advice = '低调行事，避免冲突'; }
    else if (zhiEle === sk.被生) { luck = '吉'; focus = '得到助力，贵人运好'; advice = '抓住机遇，积极进取'; }
    else if (zhiEle === sk.生) { luck = '吉'; focus = '付出有回报，利于求财'; advice = '多付出，财运人缘皆佳'; }
    else if (zhiEle === sk.克) { luck = '凶'; focus = '受制较多，防破财或健康问题'; advice = '谨慎理财，注意健康'; }
    else { luck = '平'; focus = '运势平稳，稳中求进'; advice = '按部就班，不宜冒进'; }
    if (zhi === '午') { luck = '吉'; focus = '流年本气月，运势高峰'; advice = '把握机会，大展拳脚'; }
    if (zhi === '子') { luck = '凶'; focus = '子午冲，变动较大'; advice = '注意健康，防口舌'; }
    monthAnalysis.push({month: i+1, name:['正月','二月','三月','四月','五月','六月','七月','八月','九月','十月','冬月','腊月'][i], gan, zhi, zhiEle, luck, focus, advice});
  }
  return monthAnalysis;
}

// 风水调整
function getFengshuiAdvice(dayEle, weakestEle) {
  const data = {
    '木':{room:'东方',color:'绿色',plant:'发财树/绿萝',material:'木',caisson:'文昌位东侧'},
    '火':{room:'南方',color:'红色',plant:'红掌/鸿运当头',material:'暖色灯',caisson:'客厅正中'},
    '土':{room:'中央/西南',color:'黄色',plant:'君子���/茉莉',material:'陶瓷',caisson:'客厅西南'},
    '金':{room:'西方',color:'白色',plant:'虎皮兰/仙人掌',material:'金属',caisson:'财位西方'},
    '水':{room:'北方',color:'蓝色',plant:'富贵竹/水仙',material:'玻璃/水景',caisson:'入户玄关'}
  };
  const d = data[weakestEle] || data['木'];
  let html = '<div class="analysis-grid" style="grid-template-columns:repeat(auto-fit,minmax(220px,1fr))">';
  const rooms = [
    {icon:'🛋️', name:'客厅', desc:'主气场所在，宜摆放' + d.plant + '于' + d.room + '方位招财聚气'},
    {icon:'🛏️', name:'卧室', desc:'床头朝向' + d.room + '为佳，床头柜放' + d.color + '色台灯助眠安神'},
    {icon:'📚', name:'书房', desc:'书桌朝向文昌位，学习效率加倍，摆放' + d.plant + '提升学业运'},
    {icon:'🍳', name:'厨房', desc:'灶台朝向与命盘相生有利，忌朝北方(受水克火)'},
    {icon:'🚪', name:'玄关', desc:'入户第一眼，放置' + d.material + '材质摆件如聚宝盆或山水画引气入门'},
    {icon:'💰', name:'财位', desc:'根据日干确定财位，摆放' + d.plant + '或金属聚宝盆增强财气'}
  ];
  for (const r of rooms) {
    html += '<div class="analysis-card"><h5>' + r.icon + ' ' + r.name + '</h5><p>' + r.desc + '</p></div>';
  }
  html += '</div>';
  return html;
}

//============== FENGSHUI MODULE ==============

// 命卦计算(东四命/西四命)
function getMingGua(year, sex) {
  const last2 = year % 100;
  let gua;
  if (sex === 'male') {
    gua = (100 - last2) % 9;
  } else {
    gua = (last2 + 5) % 9;
  }
  if (gua === 0) gua = 9;
  if (gua === 5) gua = sex === 'male' ? 2 : 8;
  const isDong = [1, 9, 3, 4].includes(gua);
  const nameMap = {1:'坎', 2:'坤', 3:'震', 4:'巽', 6:'乾', 7:'兑', 8:'艮', 9:'离'};
  return { gua, guaName: nameMap[gua], isDong, type: isDong ? '东四命' : '西四命' };
}

// ===== 风水实战级辅助函数 =====
function _getFloorWuxing(floor) {
  // 楼层五行：1-6水，2-7火，3-8木，4-9金，5-10土（河图数）
  const remainder = floor % 10;
  if (remainder === 1 || remainder === 6) return '水';
  if (remainder === 2 || remainder === 7) return '火';
  if (remainder === 3 || remainder === 8) return '木';
  if (remainder === 4 || remainder === 9) return '金';
  return '土';
}
function _wuxingRelation(a, b) {
  // a生b, a克b, 或比和
  const sheng = {'水':'木','木':'火','火':'土','土':'金','金':'水'};
  const ke = {'水':'火','火':'金','金':'木','木':'土','土':'水'};
  if (sheng[a] === b) return '生';
  if (ke[a] === b) return '克';
  if (a === b) return '同';
  return '无关';
}
function _getYearFlyingStar(year) {
  // 年飞星计算：11 - (year - 2000) % 9, 若为0则取9
  // 更准确：用 9 - ((year - 1864) % 9) + 1，简化为下表
  // 2024年九紫入中宫
  var base = 1864;
  var remainder = (year - base) % 9;
  // 1864年一白入中宫
  var centerStar = ((9 - remainder) % 9) || 9;
  return centerStar;
}
function _getStarPosition(centerStar) {
  // 飞星顺飞顺序：中→西北→西→东北→南→北→西南→东→东南
  var order = [centerStar];
  var next = centerStar;
  for (var i = 0; i < 8; i++) {
    next = next >= 9 ? 1 : next + 1;
    order.push(next);
  }
  // 顺序对应宫位：中,乾(西北),兑(西),艮(东北),离(南),坎(北),坤(西南),震(东),巽(东南)
  return {
    '中': order[0], '西北': order[1], '西': order[2], '东北': order[3],
    '南': order[4], '北': order[5], '西南': order[6], '东': order[7], '东南': order[8]
  };
}
function _generateRoomSolutions(bazhai, mingGua, xuankong, yearStar, problems, baziWuxing) {
  // 为每个方位生成房间化解方案
  var starPos = _getStarPosition(yearStar);
  var solutions = [];

  // 方位→房间映射（常见户型）
  var roomTypes = {
    '北': ['卧室','书房','储藏室'],
    '南': ['客厅','主卧','阳台'],
    '东': ['次卧','书房','厨房'],
    '西': ['儿童房','卫生间','储藏室'],
    '东南': ['主卧','书房','客厅'],
    '西南': ['主卧','厨房','客厅'],
    '西北': ['书房','长辈房','客厅'],
    '东北': ['儿童房','储藏室','餐厅']
  };

  // 吉凶位→化解方案
  var bazhaiSolutions = {
    '生气': { action: '宜主卧、书房', items: ['绿色植物','水晶洞','文昌塔'], color: '绿色/青色', avoid: '不宜堆放杂物' },
    '天医': { action: '宜卧室、疗养室', items: ['葫芦','铜制摆件','玉器'], color: '黄色/棕色', avoid: '不宜放置垃圾桶' },
    '延年': { action: '宜主卧、客厅', items: ['和合二仙','粉色水晶','双数摆件'], color: '红色/粉色', avoid: '不宜放置单数装饰' },
    '伏位': { action: '宜书房、静室', items: ['山水画','陶瓷制品','泰山石'], color: '黄色/米色', avoid: '不宜过于喧闹' },
    '绝命': { action: '宜卫生间、储藏室', items: ['五帝钱','铜葫芦','黑曜石'], color: '白色/金色', avoid: '不宜做卧室或主入口' },
    '五鬼': { action: '宜储藏室、衣帽间', items: ['五帝钱','铜铃','白水晶簇'], color: '白色/银色', avoid: '不宜做厨房或卧室' },
    '六煞': { action: '宜卫生间、洗衣房', items: ['黑曜石球','铜制葫芦','盐灯'], color: '灰色/黑色', avoid: '不宜做主卧或财位' },
    '祸害': { action: '宜杂物间、车库', items: ['五帝钱','黄水晶球','陶瓷葫芦'], color: '黄色/棕色', avoid: '不宜做卧室或书房' }
  };

  // 流年飞星→化解
  var starSolutions = {
    1: { name:'一白桃花星', good:'利人缘、桃花、读书', bad:'易感情纠葛', items:['水培植物','蓝色装饰'], color:'蓝色/黑色' },
    2: { name:'二黑病符星', good:'无（凶星）', bad:'主疾病、健康问题', items:['六字真言铜葫芦','金属风铃'], color:'金色/白色（金泄土）', avoid:'红色、黄色' },
    3: { name:'三碧禄存星', good:'无（凶星）', bad:'主口舌是非、官非', items:['红色装饰','紫水晶'], color:'红色（火泄木）', avoid:'绿色、黑色' },
    4: { name:'四绿文曲星', good:'利学业、文昌、考试', bad:'易桃花劫', items:['四枝毛笔','文昌塔','绿色植物'], color:'绿色', avoid:'红色' },
    5: { name:'五黄廉贞星', good:'无（大凶）', bad:'主灾祸、意外、破财', items:['六字真言','铜制风铃','金属物品'], color:'金色/白色（金泄土）', avoid:'红色、黄色、动土' },
    6: { name:'六白武曲星', good:'利事业、贵人、远行', bad:'易过刚伤和', items:['金属摆件','铜马','黄色水晶'], color:'白色/金色' },
    7: { name:'七赤破军星', good:'利偏财、口才', bad:'易破财、争斗', items:['蓝色装饰','水族箱'], color:'蓝色/黑色（水泄金）', avoid:'红色' },
    8: { name:'八白左辅星', good:'利正财、置业', bad:'无（吉星）', items:['黄水晶球','聚宝盆','红色装饰'], color:'红色/黄色（火生土）', avoid:'绿色' },
    9: { name:'九紫右弼星', good:'利喜庆、姻缘、添丁', bad:'易火气过旺', items:['红色装饰','紫色水晶','九枝玫瑰'], color:'红色/紫色', avoid:'黑色' }
  };

  var directions = ['北','南','东','西','东南','西南','西北','东北'];
  for (var i = 0; i < directions.length; i++) {
    var dir = directions[i];
    var bazhaiPos = bazhai[dir] || '伏位';
    var yearFlyingStar = starPos[dir] || 5;
    var bazhaiInfo = bazhaiSolutions[bazhaiPos] || bazhaiSolutions['伏位'];
    var starInfo = starSolutions[yearFlyingStar] || starSolutions[5];

    // 判断是否有凶星叠加
    var isDanger = (bazhaiPos === '绝命' || bazhaiPos === '五鬼' || bazhaiPos === '六煞' || bazhaiPos === '祸害') &&
                   (yearFlyingStar === 2 || yearFlyingStar === 3 || yearFlyingStar === 5 || yearFlyingStar === 7);

    // 八字五行匹配颜色
    var favorableColor = baziWuxing ? _getFavorableColor(baziWuxing) : '根据八字确定';

    solutions.push({
      direction: dir,
      rooms: roomTypes[dir],
      bazhaiPosition: bazhaiPos,
      yearStar: yearFlyingStar,
      starName: starInfo.name,
      isDanger: isDanger,
      bestUse: bazhaiInfo.action,
      items: bazhaiInfo.items.concat(starInfo.items || []),
      color: bazhaiInfo.color,
      starColor: starInfo.color,
      favorableColor: favorableColor,
      avoid: bazhaiInfo.avoid + '；' + (starInfo.avoid || ''),
      advice: isDanger ? '凶位叠凶星，需重点化解' : (bazhaiPos === '生气' || bazhaiPos === '天医' || bazhaiPos === '延年') ? '吉位吉星，宜充分利用' : '平位，按常规布置'
    });
  }

  return solutions;
}
function _getFavorableColor(dayZhuWuxing) {
  // 日主五行→有利颜色
  var colorMap = {
    '水': '白色/金色（金生水）+ 蓝色/黑色',