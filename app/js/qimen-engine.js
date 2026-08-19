// qimen-engine.js
// R629 Phase 3: 奇门遁甲引擎（从 divination-core.js 拆分）
// 包含：getQimenReadingV2 / getQimenReadingHTML / 梅花易数 / 六壬 / 天文历法工具
// 依赖：divination-core.js（WUXING_ALL 等基础数据）
// 用法：<script src="js/qimen-engine.js" defer></script>
(function(global){
// ========== 奇门遁甲 V2 动态解读引擎 ==========

// [舒晗课程校正] 用神取法表 — 依据密训班01/02用神五层法
// 舒晗事体用神表：求财→生门+戊/庚，工作→开门+值符，婚姻→乙奇(男)/庚金(女)+休门
// 疾病→天芮+伤门/死门，走失→时干+杜门/六合，官司→惊门+六仪击刑
var _QM_YONGSHEN_MAP = {
  '财':'生门','求财':'生门','投资':'生门','生意':'生门','交易':'生门',
  '偏财':'丁奇','副业':'丁奇',
  '官':'开门','事业':'开门','工作':'开门','升迁':'开门','求职':'开门',
  '婚':'六合','婚姻':'六合','感情':'六合','恋爱':'六合','相亲':'六合',
  '病':'天芮','疾病':'天芮','健康':'天芮','身体':'天芮',
  '出行':'景门','旅游':'景门','出差':'景门',
  '考试':'天辅','学业':'天辅','升学':'天辅','文考':'天辅','学习':'天辅',
  '诉讼':'惊门','官司':'惊门','争':'惊门','纠纷':'惊门','官非':'惊门',
  '盗':'玄武','贼':'玄武','失':'玄武','丢失':'玄武','走失':'杜门',
  '住宅':'生门','风水':'生门','搬家':'生门','置产':'生门'
};

// 宫位五行表
var _QM_PALACE_WX = {1:'水',2:'土',3:'木',4:'木',5:'土',6:'金',7:'金',8:'土',9:'火'};

// 宫位方位表
var _QM_PALACE_DIR = {1:'正北',2:'西南',3:'正东',4:'东南',5:'中央',6:'西北',7:'正西',8:'东北',9:'正南'};

// 九星五行表
var _QM_STAR_WX = {'天蓬':'水','天芮':'土','天冲':'木','天辅':'木','天禽':'土','天心':'金','天柱':'金','天任':'土','天英':'火'};

// 八门五行表
var _QM_MEN_WX = {'休门':'水','生门':'土','伤门':'木','杜门':'木','景门':'火','死门':'土','惊门':'金','开门':'金'};

// 八神五行表
var _QM_SHEN_WX = {'值符':'木','青龙':'木','太阴':'金','六合':'木','勾陈':'土','白虎':'金','玄武':'水','螣蛇':'火','九天':'金','九地':'土'};

// 六仪三奇五行表
var _QM_QI_WX = {'戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水','丁':'火','丙':'火','乙':'木'};

// 吉门列表
var _QM_JI_MEN = ['休门','生门','开门'];
// 凶门列表
var _QM_XIONG_MEN = ['死门','惊门','伤门'];
// 吉星列表
var _QM_JI_STAR = ['天辅','天心','天任','天禽'];
// 凶星列表
var _QM_XIONG_STAR = ['天蓬','天芮','天冲','天柱','天英'];
// 吉神列表
var _QM_JI_SHEN = ['值符','青龙','太阴','六合','九天','九地'];
// 凶神列表
var _QM_XIONG_SHEN = ['白虎','玄武','螣蛇','勾陈'];

// 五行生克关系
function _qmWxRelation(a, b) {
  if (a === b) return '比和';
  let sheng = {'金生水':1,'水生木':1,'木生火':1,'火生土':1,'土生金':1};
  if (sheng[a+'生'+b]) return '我生';
  if (sheng[b+'生'+a]) return '生我';
  let ke = {'金克木':1,'木克土':1,'土克水':1,'水克火':1,'火克金':1};
  if (ke[a+'克'+b]) return '我克';
  if (ke[b+'克'+a]) return '克我';
  return '比和';
}

// 星级评分计算（基于五行生克+格局吉凶）
function _qmScore(palace, men, star, shen, qi, geju, kongwang) {
  let base = 3; // 基础3星
  let palaceWx = _QM_PALACE_WX[palace] || '土';
  let menWx = _QM_MEN_WX[men] || '土';
  let starWx = _QM_STAR_WX[star] || '土';
  let shenWx = _QM_SHEN_WX[shen] || '土';
  let qiWx = _QM_QI_WX[qi] || '土';
  
  // 门与宫的关系
  let menRel = _qmWxRelation(menWx, palaceWx);
  if (_QM_JI_MEN.indexOf(men) >= 0) {
    if (menRel === '生我' || menRel === '比和') base += 1;
    base += 1;
  } else if (_QM_XIONG_MEN.indexOf(men) >= 0) {
    if (menRel === '克我') base -= 2;
    else base -= 1;
  }
  
  // 星与宫的关系
  let starRel = _qmWxRelation(starWx, palaceWx);
  if (_QM_JI_STAR.indexOf(star) >= 0) {
    if (starRel === '生我' || starRel === '比和') base += 1;
    base += 0.5;
  } else if (_QM_XIONG_STAR.indexOf(star) >= 0) {
    if (starRel === '克我') base -= 1.5;
    else base -= 0.5;
  }
  
  // 神与宫的关系
  if (_QM_JI_SHEN.indexOf(shen) >= 0) base += 0.5;
  else if (_QM_XIONG_SHEN.indexOf(shen) >= 0) base -= 0.5;
  
  // 奇仪与宫的关系
  let qiRel = _qmWxRelation(qiWx, palaceWx);
  if (qiRel === '生我' || qiRel === '比和') base += 0.5;
  else if (qiRel === '克我') base -= 0.5;
  
  // 格局加减
  if (geju && geju.length > 0) {
    for (let i = 0; i < geju.length; i++) {
      let g = geju[i];
      if (g.indexOf('青龙返首') >= 0 || g.indexOf('飞鸟跌穴') >= 0 || g.indexOf('玉女守门') >= 0 || g.indexOf('真诈') >= 0) base += 1.5;
      else if (g.indexOf('假诈') >= 0 || g.indexOf('重诈') >= 0) base += 0.5;
      else if (g.indexOf('太白入荧') >= 0 || g.indexOf('荧入太白') >= 0) base -= 1;
      else if (g.indexOf('青龙折足') >= 0 || g.indexOf('腾蛇夭矫') >= 0 || g.indexOf('朱雀投江') >= 0) base -= 1;
      else if (g.indexOf('伏吟') >= 0) base -= 0.5;
      else if (g.indexOf('反吟') >= 0) base -= 1;
    }
  }
  
  // 空亡减力
  if (kongwang) base -= 1.5;
  
  return Math.max(0.5, Math.min(5, base));
}

// 将分数转为星级字符串
function _qmStars(score) {
  let full = Math.floor(score);
  let half = (score - full) >= 0.5;
  let s = '';
  for (let i = 0; i < full; i++) s += '★';
  if (half && full < 5) s += '☆';
  while (s.replace(/[^★]/g,'').length + (half?1:0) < 5 && s.length < 10) {
    if (s.length < 10) s += '☆';
    else break;
  }
  if (!s) s = '☆';
  return s;
}

// [舒晗课程校正] 四害化解方案表 — 依据密训班01四害化解绝技
// 空亡：填实法/冲起法/合住法
// 击刑：合解法/通关法/移位法
// 入墓：冲开法/库库转化/敲击法
// 门迫：通关法/换宫法/五行调和法
var _QM_SIHAI_HUAJIE = {
  '死门': {mascot:'铜铃/六字真言/黑曜石', direction:'西南方', color:'黄色/金色', method:'[舒晗课程校正] 死门落宫为门迫（土克水等），用通关法化解。具体：寅时(凌晨3-5点)挂铜铃于门楣，诵六字大明咒七遍。若死门临坤宫，放铜葫芦收煞；临坎宫，放黄色物品通关（土克水，用金通关）'},
  '惊门': {mascot:'白色水晶/金属风铃/蓝水晶', direction:'正西方', color:'白色/银色', method:'[舒晗课程校正] 惊门主口舌惊恐，用通关法化解（金克木用水通关，放黑色/蓝色物品）。酉时(下午5-7点)置白水晶于西窗台，挂金属风铃。惊门临震宫主口舌伤人，宜移位避开'},
  '伤门': {mascot:'红色装饰/紫水晶/黑曜石麒麟', direction:'正东方', color:'红色/紫色', method:'[舒晗课程校正] 伤门主伤害争斗，用通关法化解（木克土用火通关，放红色物品）。卯时(上午5-7点)置紫水晶于东方位，配红色装饰。伤门临中宫/坤宫主外伤，宜移位法避开该方位'},
  '杜门': {mascot:'绿色植物/木质文昌塔/绿幽灵水晶', direction:'东南方', color:'绿色/青色', method:'[舒晗课程校正] 杜门主闭塞不通，用五行调和法（补宫位之不足）。辰时(上午7-9点)置绿植或文昌塔于东南方位，疏通气场。杜门临乾宫主事业受阻，宜多沟通破除闭塞'}
};

// 吉祥物推荐表（基于五行）
var _QM_MASCOT_BY_WX = {
  '金': ['铜葫芦','金属风铃','白水晶','铜麒麟','金元宝'],
  '木': ['绿檀手串','绿幽灵水晶','文昌塔','竹节饰品','翡翠'],
  '水': ['黑曜石','蓝砂石','水晶球','龙龟','鱼缸'],
  '火': ['红玛瑙','石榴石','紫水晶','红绳','琉璃摆件'],
  '土': ['黄水晶','陶器','玉石摆件','泰山石','黄龙玉']
};

// 本地天干表（避免跨script块依赖）
var _QM_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

// 格局全名格式化
function _qmFormatGeju(gejuList) {
  if (!gejuList || gejuList.length === 0) return '无明显特殊格局';
  let ji = [], xiong = [];
  for (let i = 0; i < gejuList.length; i++) {
    let g = gejuList[i];
    let isJi = g.indexOf('青龙返首') >= 0 || g.indexOf('飞鸟跌穴') >= 0 || g.indexOf('玉女守门') >= 0 ||
               g.indexOf('真诈') >= 0 || g.indexOf('假诈') >= 0 || g.indexOf('重诈') >= 0 ||
               g.indexOf('天假') >= 0 || g.indexOf('地假') >= 0 || g.indexOf('人假') >= 0;
    let isXiong = g.indexOf('太白入荧') >= 0 || g.indexOf('荧入太白') >= 0 || g.indexOf('青龙折足') >= 0 ||
                  g.indexOf('腾蛇夭矫') >= 0 || g.indexOf('朱雀投江') >= 0 || g.indexOf('五不遇时') >= 0 ||
                  g.indexOf('伏吟') >= 0 || g.indexOf('反吟') >= 0;
    if (isJi) ji.push(g);
    else if (isXiong) xiong.push(g);
  }
  let result = '';
  if (ji.length > 0) result += '吉格：' + ji.join('、') + '。';
  if (xiong.length > 0) result += (result ? ' ' : '') + '凶格：' + xiong.join('、') + '。';
  if (!result) result = '格局平和，无特殊吉凶格。';
  return result;
}

// 五不遇时判断
function _qmCheckWuBuYuShi(dayGanIdx, hourGzIdx) {
  // 五不遇时: 甲己日庚午时, 乙庚日丙子时, 丙辛日戊子时, 丁壬日壬寅时, 戊癸日甲寅时
  // 古制：时干克日干（七杀），且为阳克阳/阴克阴
  let _stems = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  let dayGan = dayGanIdx % 10;
  let hourGan = hourGzIdx % 10;
  let dayStem = _stems[dayGan];
  let hourStem = _stems[hourGan];
  let gangsters = {'甲':'庚','乙':'辛','丙':'壬','丁':'癸','戊':'甲','己':'乙','庚':'丙','辛':'丁','壬':'戊','癸':'己'};
  if (gangsters[dayStem] === hourStem) return true;
  return false;
}

// 马星位置计算
function _qmGetMaXing(hourZhiIdx) {
  // 马星: 申子辰马在寅, 巳酉丑马在亥, 寅午戌马在申, 亥卯未马在巳
  // 时支三合局定马星
  let maMap = {0:'寅',4:'寅',8:'寅', 5:'亥',9:'亥',1:'亥', 2:'申',6:'申',10:'申', 3:'巳',7:'巳',11:'巳'};
  let maZhi = maMap[hourZhiIdx];
  let maGongMap = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};
  return maGongMap[maZhi] || 5;
}

// 空亡宫位计算
function _qmGetKongWang(dayGzIdx) {
  // 旬空: 甲子旬空戌亥, 甲戌旬空申酉, 甲申旬空午未, 甲午旬空辰巳, 甲辰旬空寅卯, 甲寅旬空子丑
  let xunKong = ['戌亥','申酉','午未','辰巳','寅卯','子丑'];
  let xunIdx = Math.floor((dayGzIdx % 60) / 10);
  let kongZhi = xunKong[xunIdx];
  let kongGongMap = {'子':1,'丑':8,'寅':8,'卯':3,'辰':4,'巳':4,'午':9,'未':2,'申':2,'酉':7,'戌':6,'亥':6};
  let kong1 = kongGongMap[kongZhi[0]];
  let kong2 = kongGongMap[kongZhi[1]];
  return [kong1, kong2];
}

function getQimenReadingV2(palace, panData, question, baziData) {
  if (!palace || !panData || typeof panData !== 'object') return '<p class="error-tip">排盘数据无效</p>';
  // 如果没有panData，用基础信息构建
  if (!panData) {
    panData = {
      dipan: {}, tianpan: {}, men: {}, stars: {}, shen: {},
      dayGzIdx: 0, hourGzIdx: 0, dun: 'yang', ju: 1
    };
  }
  
  // 用神取法
  let yongShen = '开门'; // 默认事业
  if (question) {
    for (let key in _QM_YONGSHEN_MAP) {
      if (question.indexOf(key) >= 0) { yongShen = _QM_YONGSHEN_MAP[key]; break; }
    }
  }
  
  // 用神落宫
  let yongShenPalace = palace || 5;
  if (panData.men || panData.stars || panData.shen) {
    for (let p = 1; p <= 9; p++) {
      if (panData.men[p] === yongShen || (panData.stars && panData.stars[p] === yongShen) || (panData.shen && panData.shen[p] === yongShen)) {
        yongShenPalace = p; break;
      }
    }
  }
  
  // 中宫寄宫处理
  let kongwangFlag = false;
  if (yongShenPalace === 5) {
    kongwangFlag = true;
    yongShenPalace = panData.dun === 'yin' ? 2 : 8;
  }
  
  // 获取用神宫的星门神仪
  let men = panData.men ? (panData.men[yongShenPalace] || '') : '';
  let star = panData.stars ? (panData.stars[yongShenPalace] || '') : '';
  let shen = panData.shen ? (panData.shen[yongShenPalace] || '') : '';
  let qi = panData.tianpan ? (panData.tianpan[yongShenPalace] || '') : '';
  let diQi = panData.dipan ? (panData.dipan[yongShenPalace] || '') : '';
  
  // 确保门名完整（如'开'→'开门'）
  if (men && men.length === 1) {
    let menFullMap = {'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'};
    men = menFullMap[men] || men;
  }
  // 确保星名完整（如'心'→'天心'）
  if (star && star.length === 1) {
    let starFullMap = {'蓬':'天蓬','芮':'天芮','冲':'天冲','辅':'天辅','英':'天英','禽':'天禽','心':'天心','柱':'天柱','任':'天任'};
    star = starFullMap[star] || star;
  }
  // 确保神名完整
  if (shen && shen.length === 1) {
    let shenFullMap = {'符':'值符','龙':'青龙','冲':'螣蛇','辅':'太阴','英':'六合','芮':'白虎','柱':'玄武','心':'九天'};
    shen = shenFullMap[shen] || shen;
  }
  
  // 格局判断
  let geju = [];
  if (panData.dipan && panData.tianpan) {
    for (let p2 = 1; p2 <= 9; p2++) {
      let dip = panData.dipan[p2] || '';
      let tip = panData.tianpan[p2] || '';
      if (!dip || !tip) continue;
      // 青龙返首: 天盘戊加地盘戊
      if (tip === '戊' && dip === '戊') geju.push(p2 + '宫青龙返首');
      // 飞鸟跌穴: 天盘丙加地盘戊
      if (tip === '丙' && dip === '戊') geju.push(p2 + '宫飞鸟跌穴');
      // 玉女守门: 丁加开门所在宫
      if (tip === '丁' && panData.men && panData.men[p2] === '开') geju.push(p2 + '宫玉女守门');
      // 太白入荧: 庚加丙
      if (tip === '庚' && dip === '丙') geju.push(p2 + '宫太白入荧');
      // 荧入太白: 丙加庚
      if (tip === '丙' && dip === '庚') geju.push(p2 + '宫荧入太白');
      // 青龙折足: 戊加辛
      if (tip === '戊' && dip === '辛') geju.push(p2 + '宫青龙折足');
      // 腾蛇夭矫: 辛加乙
      if (tip === '辛' && dip === '乙') geju.push(p2 + '宫腾蛇夭矫');
      // 朱雀投江: 丁加癸
      if (tip === '丁' && dip === '癸') geju.push(p2 + '宫朱雀投江');
      // 伏吟: 天盘与地盘相同
      if (dip === tip && tip !== '戊') geju.push(p2 + '宫伏吟');
    }
    // 三诈五假检查
    for (let p3 = 1; p3 <= 9; p3++) {
      if (p3 === 5) continue;
      let pm = panData.men ? (panData.men[p3] || '') : '';
      let ps = panData.stars ? (panData.stars[p3] || '') : '';
      let ph = panData.shen ? (panData.shen[p3] || '') : '';
      if (!pm || !ps || !ph) continue;
      let pmFull = pm.length === 1 ? ({'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'}[pm] || pm) : pm;
      let psFull = ps.length === 1 ? ({'蓬':'天蓬','芮':'天芮','冲':'天冲','辅':'天辅','英':'天英','禽':'天禽','心':'天心','柱':'天柱','任':'天任'}[ps] || ps) : ps;
      let phFull = ph.length === 1 ? ({'符':'值符','龙':'青龙','冲':'螣蛇','辅':'太阴','英':'六合','芮':'白虎','柱':'玄武','心':'九天'}[ph] || ph) : ph;
      if (_QM_JI_MEN.indexOf(pmFull) >= 0 && _QM_JI_STAR.indexOf(psFull) >= 0 && _QM_JI_SHEN.indexOf(phFull) >= 0) {
        geju.push(p3 + '宫真诈格');
      } else if (_QM_JI_MEN.indexOf(pmFull) >= 0 && _QM_XIONG_STAR.indexOf(psFull) >= 0 && _QM_JI_SHEN.indexOf(phFull) >= 0) {
        geju.push(p3 + '宫假诈格');
      } else if (_QM_XIONG_MEN.indexOf(pmFull) >= 0 && _QM_JI_STAR.indexOf(psFull) >= 0 && _QM_JI_SHEN.indexOf(phFull) >= 0) {
        geju.push(p3 + '宫重诈格');
      }
    }
  }
  
  // 五不遇时
  let wuBuYu = false;
  if (panData.dayGzIdx !== undefined && panData.hourGzIdx !== undefined) {
    wuBuYu = _qmCheckWuBuYuShi(panData.dayGzIdx % 10, panData.hourGzIdx % 10);
    if (wuBuYu) geju.push('五不遇时');
  }
  
  // 空亡判断
  let kongWangGongs = [];
  if (panData.dayGzIdx !== undefined) {
    kongWangGongs = _qmGetKongWang(panData.dayGzIdx);
  }
  let isKongWang = kongWangGongs.indexOf(yongShenPalace) >= 0 || kongwangFlag;
  
  // 马星判断
  let maXingGong = 0;
  if (panData.hourGzIdx !== undefined) {
    maXingGong = _qmGetMaXing(panData.hourGzIdx % 12);
  }
  let isMaXing = maXingGong === yongShenPalace;
  
  // 日干落宫（命主状态）
  let dayGanPalace = 0;
  let dayGanQi = '';
  if (panData.dayGzIdx !== undefined && panData.dipan) {
    let dayGan = _QM_STEMS[panData.dayGzIdx % 10];
    for (let p4 = 1; p4 <= 9; p4++) {
      if (panData.dipan[p4] === dayGan) { dayGanPalace = p4; dayGanQi = panData.tianpan ? (panData.tianpan[p4] || '') : ''; break; }
    }
  }
  
  // 时干落宫（事体状态）
  let hourGanPalace = 0;
  let hourGanQi = '';
  if (panData.hourGzIdx !== undefined && panData.dipan) {
    let hourGan = _QM_STEMS[panData.hourGzIdx % 10];
    for (let p5 = 1; p5 <= 9; p5++) {
      if (panData.dipan[p5] === hourGan) { hourGanPalace = p5; hourGanQi = panData.tianpan ? (panData.tianpan[p5] || '') : ''; break; }
    }
  }
  
  // 综合评分
  let totalScore = _qmScore(yongShenPalace, men || '开门', star || '天心', shen || '值符', qi || '戊', geju, isKongWang);
  
  // 综合评断
  let palaceName = PALACE_INFO[yongShenPalace] ? PALACE_INFO[yongShenPalace].name : (yongShenPalace + '宫');
  let palaceWx = _QM_PALACE_WX[yongShenPalace] || '土';
  let palaceDir = _QM_PALACE_DIR[yongShenPalace] || '中央';
  
  let summaryParts = [];
  summaryParts.push('用神「' + yongShen + '」落' + palaceName + '（' + palaceWx + '局）');
  if (star) summaryParts.push('天盘' + star);
  if (men) summaryParts.push(men);
  if (shen) summaryParts.push(shen + '神');
  if (qi) summaryParts.push('奇仪' + qi);
  let summary = summaryParts.join('，');
  
  // 吉凶判断
  let luckLevel = '平';
  if (totalScore >= 4) luckLevel = '吉';
  else if (totalScore >= 3) luckLevel = '小吉';
  else if (totalScore >= 2) luckLevel = '平';
  else if (totalScore >= 1) luckLevel = '小凶';
  else luckLevel = '凶';
  
  summary += '。综合' + luckLevel + '（' + _qmStars(totalScore) + '）';
  if (isKongWang) summary += '，用神落空亡减力';
  if (isMaXing) summary += '，马星临宫加速';
  if (wuBuYu) summary += '，五不遇时大凶';
  
  // 详细分析
  let detailParts = [];
  detailParts.push('一、用神落宫分析：用神「' + yongShen + '」落于' + palaceName + '，' + palaceDir + '方位，属' + palaceWx + '局。');
  
  if (star) {
    let starWx = _QM_STAR_WX[star] || '土';
    let starRel = _qmWxRelation(starWx, palaceWx);
    let starJi = _QM_JI_STAR.indexOf(star) >= 0;
    // [舒晗课程校正] 九星象意补充 — 依据密训班11-12课
    let starDesc = {
      '天蓬':'胆大妄为，主盗贼水灾','天芮':'病星，主疾病缠绵','天冲':'冲动伤损，主急躁','天辅':'文昌星，主文教辅佐',
      '天禽':'稳重权威，寄中宫','天心':'医药之星，主治病救人','天柱':'破败惊恐','天任':'富厚安泰','天英':'火炎血光'
    };
    detailParts.push('二、九星分析：天盘' + star + '（' + starWx + '），' + (starJi ? '为吉星' : '为凶星') + '，' + (starDesc[star]||'') + '，与宫位' + starRel + '。' + (starRel === '生我' || starRel === '比和' ? '星宫相生，吉力增强。' : starRel === '克我' ? '星克宫，减力之象。' : '星泄宫，耗费精力。'));
  }
  
  if (men) {
    let menWx = _QM_MEN_WX[men] || '土';
    let menRel = _qmWxRelation(menWx, palaceWx);
    let menJi = _QM_JI_MEN.indexOf(men) >= 0;
    // [舒晗课程校正] 八门象意补充 — 依据密训班11-12课
    let menDesc = {
      '开门':'通达开拓，利求职见贵','休门':'安养休息，利求财婚恋','生门':'生发财运，利经营求财','伤门':'伤害争斗',
      '杜门':'闭塞不通，利躲灾避难','景门':'文书信息，利考试面试','死门':'死亡凶险，不利吉事','惊门':'惊恐口舌，利诉讼'
    };
    detailParts.push('三、八门分析：' + men + '（' + menWx + '），' + (menJi ? '为吉门' : men === '景门' ? '为平门' : '为凶门') + '，' + (menDesc[men]||'') + '，与宫位' + menRel + '。' + (menRel === '生我' || menRel === '比和' ? '门宫相生，谋事可成。' : menRel === '克我' ? '门迫宫，事多阻碍。' : '门泄宫，需迂回而行。'));
  }
  
  if (shen) {
    let shenJi = _QM_JI_SHEN.indexOf(shen) >= 0;
    // [舒晗课程校正] 八神象意补充 — 依据密训班11-12课
    let shenDesc = {
      '值符':'贵人统领，最吉之神','腾蛇':'虚惊怪异','太阴':'暗助荫庇','六合':'婚姻和合','白虎':'凶险血光','玄武':'盗贼暗昧','九地':'稳固厚重','九天':'高远威武'
    };
    detailParts.push('四、八神分析：' + shen + '神，' + (shenDesc[shen]||'') + '，' + (shenJi ? '为吉神护卫，百恶消散。' : '为凶神临宫，宜谨慎防范。'));
  }
  
  if (qi) {
    let qiWx = _QM_QI_WX[qi] || '土';
    let qiRel = _qmWxRelation(qiWx, palaceWx);
    detailParts.push('五、奇仪分析：天盘' + qi + '（' + qiWx + '），与宫位' + qiRel + '。' + (qiRel === '生我' || qiRel === '比和' ? '仪生宫，得地利。' : qiRel === '克我' ? '仪克宫，失地利。' : '仪泄宫，耗损之象。'));
  }
  
  // 命主关联
  if (dayGanPalace > 0) {
    let dayGanName = panData.dayGzIdx !== undefined ? _QM_STEMS[panData.dayGzIdx % 10] : '';
    detailParts.push('六、命主状态：日干' + dayGanName + '落' + (PALACE_INFO[dayGanPalace] ? PALACE_INFO[dayGanPalace].name : dayGanPalace + '宫') + (dayGanQi ? '，天盘' + dayGanQi : '') + '。' + (dayGanPalace === yongShenPalace ? '命主与用神同宫，主自身努力可成。' : '命主与用神异宫，需借力而行。'));
  }
  
  // 事体关联
  if (hourGanPalace > 0) {
    let hourGanName = panData.hourGzIdx !== undefined ? _QM_STEMS[panData.hourGzIdx % 10] : '';
    detailParts.push('七、事体状态：时干' + hourGanName + '落' + (PALACE_INFO[hourGanPalace] ? PALACE_INFO[hourGanPalace].name : hourGanPalace + '宫') + (hourGanQi ? '，天盘' + hourGanQi : '') + '。' + (hourGanPalace === yongShenPalace ? '事体与用神同宫，事可速成。' : '事体与用神异宫，需时日方能成就。'));
  }
  
  let detail = detailParts.join('\n');
  
  // 维度评分
  let dimScore = function(dimQuestion, dimYongShen) {
    let dimPalace = yongShenPalace;
    // 对不同维度，找对应的用神落宫
    for (let dp = 1; dp <= 9; dp++) {
      if (panData.men && panData.men[dp] === dimYongShen) { dimPalace = dp; break; }
      if (panData.stars && panData.stars[dp] === dimYongShen) { dimPalace = dp; break; }
      if (panData.shen && panData.shen[dp] === dimYongShen) { dimPalace = dp; break; }
    }
    let dMen = panData.men ? (panData.men[dimPalace] || '') : '';
    let dStar = panData.stars ? (panData.stars[dimPalace] || '') : '';
    let dShen = panData.shen ? (panData.shen[dimPalace] || '') : '';
    let dQi = panData.tianpan ? (panData.tianpan[dimPalace] || '') : '';
    if (dMen && dMen.length === 1) dMen = ({'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'}[dMen] || dMen);
    if (dStar && dStar.length === 1) dStar = ({'蓬':'天蓬','芮':'天芮','冲':'天冲','辅':'天辅','英':'天英','禽':'天禽','心':'天心','柱':'天柱','任':'天任'}[dStar] || dStar);
    if (dShen && dShen.length === 1) dShen = ({'符':'值符','龙':'青龙','冲':'螣蛇','辅':'太阴','英':'六合','芮':'白虎','柱':'玄武','心':'九天'}[dShen] || dShen);
    let dKong = kongWangGongs.indexOf(dimPalace) >= 0;
    return _qmScore(dimPalace, dMen || '开门', dStar || '天心', dShen || '值符', dQi || '戊', geju, dKong);
  };
  
  // [舒晗课程校正] 六维运势分析 — 依据密训导图03六大专项
  // 舒晗六大专项：财运/事业/婚姻/学业/疾病/官司
  let careerScore = dimScore(question, '开门');
  let wealthScore = dimScore(question, '生门');
  let marriageScore = dimScore(question, '六合');
  let healthScore = dimScore(question, '天芮');
  let studyScore = dimScore(question, '天辅');  // [舒晗课程校正] 学业看天辅星/景门
  let lawsuitScore = dimScore(question, '惊门');  // [舒晗课程校正] 官非看惊门
  let fengshuiScore = dimScore(question, '生门') * 0.7 + dimScore(question, '开门') * 0.3;
  
  let dimensions = {
    事业: _qmStars(careerScore) + ' ' + (careerScore >= 3 ? '开门落宫得地，事业可成。' + (men && _QM_JI_MEN.indexOf(men) >= 0 ? '吉门临宫，仕途亨通。' : '') : '事业宫位欠佳，宜守不宜动。' + (isKongWang ? '空亡减力，谋事不落实。' : '')),
    // [舒晗课程校正] 财运双诊法：信息符号层（生门宫位临九星八神）+ 五行关系层（生门落宫五行与本宫五行生克）
    财运: _qmStars(wealthScore) + ' ' + (wealthScore >= 3 ? '生门落宫得地，财运亨通。' + (isMaXing ? '马星动财，求财迅速。' : '') + '正财看戊土，偏财看丁奇。' : '财运宫位不佳，需谨慎投资。' + (isKongWang ? '空亡减力，财不落实。' : '') + '生门落宫五行克本宫五行，我去求财，费力。'),
    婚姻: _qmStars(marriageScore) + ' ' + (marriageScore >= 3 ? '六合神临吉宫，姻缘可成。乙庚合为夫妻宫，男看乙奇，女看庚金。' : '婚姻宫位不佳，需耐心等待。' + (shen === '腾蛇' ? '腾蛇临宫，感情虚惊反复。' : '')),
    // [舒晗课程校正] 学业看天辅星（文昌）+景门（文书考试）
    学习: _qmStars(studyScore) + ' ' + (studyScore >= 3 ? '天辅星（文昌）落宫得地，利考试升学。景门主文书，临吉宫则金榜题名。' : '学业宫位不佳，需加倍努力。丁奇为文书用神，落宫凶则考试不利。'),
    // [舒晗课程校正] 疾病看天芮星（病星）+伤门/死门
    健康: _qmStars(healthScore) + ' ' + (healthScore >= 3 ? '天芮星落宫不凶，健康无虞。' : '天芮星临凶宫，注意身体。' + (shen === '白虎' ? '白虎临宫，防血光之灾。' : '') + (shen === '腾蛇' ? '腾蛇临宫，防神经性疾患。' : '')),
    // [舒晗课程校正] 官非看惊门+六仪击刑
    官非: _qmStars(lawsuitScore) + ' ' + (lawsuitScore >= 3 ? '惊门落宫平和，无官非之忧。' : '惊门临凶宫，须防口舌诉讼。' + (shen === '白虎' ? '白虎临宫，恐有刑伤。' : '') + (shen === '玄武' ? '玄武临宫，防暗中小人陷害。' : '')),
    风水: _qmStars(fengshuiScore) + ' ' + (fengshuiScore >= 3 ? '风水宫位得宜，宅运平稳。' + palaceDir + '方位宜布置吉物。' : '风水宫位欠佳，' + palaceDir + '方位需化解。')
  };
  
  // 格局分析
  let gejuText = _qmFormatGeju(geju);
  
  // [舒晗课程校正] 空亡分析 — 依据密训班01四害化解绝技
  let kongwangText = '空亡在' + (kongWangGongs.length > 0 ? kongWangGongs.map(function(g){ return PALACE_INFO[g] ? PALACE_INFO[g].name : g + '宫'; }).join('、') : '无') + '。';
  if (isKongWang) {
    kongwangText += '用神落空亡宫，谋事减力30-50%，需填实后方可成就。[舒晗密训] 空亡化解三法：1.填实法（放置该宫五行之物，如坎宫空亡放黑色球/鱼缸）；2.冲起法（待冲之时机，如午日冲起子空）；3.合住法（用地支合住空亡之干）。';
  } else {
    kongwangText += '用神不落空亡，谋事有力。';
  }
  
  // 马星分析
  let maxingText = '马星在' + (maXingGong > 0 ? (PALACE_INFO[maXingGong] ? PALACE_INFO[maXingGong].name : maXingGong + '宫') : '未知') + '。';
  if (isMaXing) maxingText += '马星临用神宫，事动速成，但易反复。宜速战速决，不宜拖延。';
  else maxingText += '马星不临用神宫，事态平稳，按部就班。';
  
  // [舒晗课程校正] 四害分析 — 依据密训班01四害化解绝技
  // 四害：空亡、击刑、入墓、门迫
  let sihaiParts = [];
  let sihaiGongs = {};
  if (panData.men) {
    for (let sp = 1; sp <= 9; sp++) {
      if (sp === 5) continue;
      let spMen = panData.men[sp] || '';
      if (spMen && spMen.length === 1) spMen = ({'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'}[spMen] || spMen);
      // [舒晗密训] 门迫：八门五行克宫位五行
      if (spMen === '死门') sihaiGongs[sp] = '死门';
      else if (spMen === '惊门') sihaiGongs[sp] = '惊门';
      else if (spMen === '伤门') sihaiGongs[sp] = '伤门';
      else if (spMen === '杜门') sihaiGongs[sp] = '杜门';
    }
  }
  for (let sg in sihaiGongs) {
    let sMen = sihaiGongs[sg];
    let hua = _QM_SIHAI_HUAJIE[sMen];
    sihaiParts.push(sMen + '落' + (PALACE_INFO[sg] ? PALACE_INFO[sg].name : sg + '宫') + '，[舒晗密训] 门迫化解：' + hua.mascot + '，置于' + hua.direction + '，' + hua.method);
  }
  // [舒晗课程校正] 空亡四害检测
  if (kongWangGongs.length > 0) {
    sihaiParts.push('空亡在' + kongWangGongs.map(function(g){ return PALACE_INFO[g] ? PALACE_INFO[g].name : g + '宫'; }).join('、') + '，[舒晗密训] 化解：填实法（放该宫五行之物）/冲起法（待冲之时机）/合住法（地支合住空亡之干）');
  }
  let sihai = sihaiParts.length > 0 ? sihaiParts.join('；') : '无明显四害临宫。';
  
  // 化解建议
  let huajieParts = [];
  // 基于用神宫五行推荐方位
  huajieParts.push('方位：利' + palaceDir + '方，忌' + (palaceDir === '正北' ? '正南' : palaceDir === '正南' ? '正北' : palaceDir === '正东' ? '正西' : palaceDir === '正西' ? '正东' : '对宫方位'));
  // 基于五行推荐颜色
  let colorMap = {'金':'白/银/金','木':'绿/青','水':'黑/蓝','火':'红/紫','土':'黄/棕'};
  huajieParts.push('颜色：宜' + (colorMap[palaceWx] || '黄'));
  // 基于时辰推荐时间
  huajieParts.push('时间：宜择' + palaceWx + '旺之时行事' + (palaceWx === '金' ? '（秋季申酉时）' : palaceWx === '木' ? '（春季寅卯时）' : palaceWx === '水' ? '（冬季亥子时）' : palaceWx === '火' ? '（夏季巳午时）' : '（四季末辰戌丑未时）'));
  // 化解方法
  if (luckLevel === '凶' || luckLevel === '小凶') {
    huajieParts.push('化解：建议在用神宫方位摆放对应五行吉祥物，择吉时行事，避开凶时凶方');
  } else {
    huajieParts.push('增益：可在' + palaceDir + '方增置五行属' + palaceWx + '之物，强化吉力');
  }
  let huajie = huajieParts.join('；') + '。';
  
  // 吉祥物推荐
  let mascotList = _QM_MASCOT_BY_WX[palaceWx] || _QM_MASCOT_BY_WX['土'];
  let mascotExtra = [];
  if (baziData && baziData.dayMaster) {
    // 基于命主日主五行喜忌推荐
    let dmWx = baziData.dayMaster;
    if (baziData.favorable && baziData.favorable.indexOf(dmWx) < 0) {
      // 日主不喜自身五行，推荐生扶用神宫五行的物品
      mascotExtra = _QM_MASCOT_BY_WX[palaceWx] || [];
    }
  }
  let mascot = mascotList.slice(0, 3).join('、');
  if (mascotExtra.length > 0) mascot += '（兼配' + mascotExtra.slice(0, 2).join('、') + '）';
  mascot += '。摆放方位：' + palaceDir + '。开光方法：择吉日良辰，以檀香熏绕三圈，诵相应经咒七遍。';
  
  return {
    summary: summary,
    detail: detail,
    dimensions: dimensions,
    geju: gejuText,
    kongwang: kongwangText,
    maxing: maxingText,
    sihai: sihai,
    huajie: huajie,
    mascot: mascot,
    score: totalScore,
    luck: luckLevel,
    yongShen: yongShen,
    palace: yongShenPalace
  };
}

function getQimenReadingHTML(palace) {
  let r = getQimenReading(palace);
  let html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(155,89,182,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--violet2);letter-spacing:4px">🔮 宫位解读</h5>';
  html += '<p style="font-size:18px;font-family:\'Ma Shan Zheng\',serif;color:var(--violet2);margin:16px 0">「' + (r.summary||'') + '」</p>';
  if (r.detail) html += '<p style="font-size:13px;line-height:1.8;opacity:.7;white-space:pre-line">' + r.detail + '</p>';
  if (r.geju) html += '<p style="font-size:13px;line-height:1.8;opacity:.7">🏷️ ' + r.geju + '</p>';
  if (r.kongwang) html += '<p class="rpt-is-48">🕳️ ' + r.kongwang + '</p>';
  if (r.maxing) html += '<p class="rpt-is-48">🐎 ' + r.maxing + '</p>';
  if (r.sihai) html += '<p class="rpt-is-48">⚠️ ' + r.sihai + '</p>';
  if (r.huajie) html += '<p class="rpt-is-48">🛡️ ' + r.huajie + '</p>';
  if (r.mascot) html += '<p class="rpt-is-48">🏆 ' + r.mascot + '</p>';
  let dims = r.dimensions || {};
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:16px;text-align:center;font-size:12px">';
  html += '<div>事业：' + (dims['事业']||'') + '</div>';
  html += '<div>财运：' + (dims['财运']||'') + '</div>';
  html += '<div>婚姻：' + (dims['婚姻']||'') + '</div>';
  html += '<div>健康：' + (dims['健康']||'') + '</div>';
  // [舒晗课程校正] 新增学习和官非维度
  html += '<div>学习：' + (dims['学习']||'') + '</div>';
  html += '<div>官非：' + (dims['官非']||'') + '</div>';
  html += '<div class="rpt-is-85">风水：' + (dims['风水']||'') + '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function getMeihuaReadingHTML(guaName) {
  let r = getYijingReading(guaName);
  let html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(39,174,96,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--jade2);letter-spacing:4px">🌿 梅花断语</h5>';
  html += '<p style="font-size:18px;font-family:\'Ma Shan Zheng\',serif;color:var(--jade2);margin:16px 0">「' + (r.summary||'') + '」</p>';
  if (r.yaoci) html += '<p style="font-size:13px;line-height:1.8;opacity:.7;white-space:pre-line">' + r.yaoci + '</p>';
  html += '<p class="rpt-is-84">' + (r.advice||'') + '</p>';
  if (r.timing) html += '<p class="rpt-is-48">⏰ ' + r.timing + '</p>';
  let dims = r.dimensions || {};
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:16px;text-align:center;font-size:12px">';
  html += '<div>事业：' + (dims['事业']||'') + '</div>';
  html += '<div>财运：' + (dims['财运']||'') + '</div>';
  html += '<div>婚姻：' + (dims['婚姻']||'') + '</div>';
  html += '<div>健康：' + (dims['健康']||'') + '</div>';
  html += '</div>';
  html += '</div>';
  return html;
}

function getLiurenReadingHTML(dayStem) {
  let stemAdvice = {
    '甲': {summary:'甲日主事，青龙值守', advice:'利东方，利主动，利开创。大事可成，需防过刚。', dimension:'事业★★★★ 财运★★★ 婚姻★★★ 健康★★★'},
    '乙': {summary:'乙日主事，六合值守', advice:'利合作，利外交，利调解。以柔克刚，和气生财。', dimension:'事业★★★ 财运★★★ 婚姻★★★★ 健康★★★★'},
    '丙': {summary:'丙日主事，朱雀值守', advice:'利文书，利传播，利口舌。注意是非，谨言慎行。', dimension:'事业★★★★ 财运★★★ 婚姻★★★ 健康★★★'},
    '丁': {summary:'丁日主事，腾蛇值守', advice:'利暗事，利谋划，利隐秘。小心虚惊，勿轻信人。', dimension:'事业★★★ 财运★★ 婚姻★★★ 健康★★★'},
    '戊': {summary:'戊日主事，勾陈值守', advice:'利田土，利房产，利守成。不宜冒进，稳重为上。', dimension:'事业★★★ 财运★★★★ 婚姻★★★ 健康★★★'},
    '己': {summary:'己日主事，太常值守', advice:'利衣食，利仓储，利日常。平平淡淡才是真。', dimension:'事业★★★ 财运★★★ 婚姻★★★★ 健康★★★★'},
    '庚': {summary:'庚日主事，白虎值守', advice:'利武事，利决断，利改革。需防血光，注意安全。', dimension:'事业★★★★ 财运★★★ 婚姻★★ 健康★★'},
    '辛': {summary:'辛日主事，天后值守', advice:'利阴事，利贵人，利细节。女性助力大，注意小病。', dimension:'事业★★★ 财运★★★ 婚姻★★★★ 健康★★★'},
    '壬': {summary:'壬日主事，天罡值守', advice:'利远行，利变动，利智谋。大智若愚，深藏不露。', dimension:'事业★★★★ 财运★★★ 婚姻★★★ 健康★★★'},
    '癸': {summary:'癸日主事，玄武值守', advice:'利暗财，利谋略，利水事。小心欺诈，守口如瓶。', dimension:'事业★★★ 财运★★★★ 婚姻★★★ 健康★★★'}
  };
  let r = stemAdvice[dayStem] || stemAdvice['甲'];
  let html = '';
  html += '<div class="analysis-card" style="border:1px solid rgba(230,126,34,.2);margin-top:20px">';
  html += '<h5 style="font-size:16px;color:var(--orange);letter-spacing:4px">⬡ 六壬断语</h5>';
  html += '<p style="font-size:18px;font-family:\'Ma Shan Zheng\',serif;color:var(--orange);margin:16px 0">「' + r.summary + '」</p>';
  html += '<p class="rpt-is-84">' + r.advice + '</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px;text-align:center;font-size:12px">' + r.dimension + '</div>';
  html += '</div>';
  return html;
}
const GAN_HIDE = {
  甲:['戊','庚','辛'],乙:['丙','丁','庚'],丙:['戊','庚','壬'],丁:['戊','辛','癸'],
  戊:['庚','壬'],己:['辛','癸'],庚:['壬','甲'],辛:['癸','乙'],壬:['甲','丙'],癸:['乙','丁']
};
const ZHI_SHENG = {
  子:['甲','丙','戊','庚','壬'],丑:['乙','丁','己','辛','癸'],
  寅:['丙','戊','庚','壬','甲'],卯:['丁','己','辛','癸','乙'],
  辰:['戊','庚','壬','甲','丙'],巳:['己','辛','癸','乙','丁'],
  午:['庚','壬','甲','丙','戊'],未:['辛','癸','乙','丁','己'],
  申:['壬','甲','丙','戊','庚'],酉:['癸','乙','丁','己','辛'],
  戌:['甲','丙','戊','庚','壬'],亥:['乙','丁','己','辛','癸']
};

// Ten Gods
const TENGAN = {
  甲:{比:'甲',劫:'乙',食:'丙',伤:'丁',财:'己',才:'戊',官:'辛',杀:'庚',印:'癸',枭:'壬'},
  乙:{比:'乙',劫:'甲',食:'丁',伤:'丙',财:'戊',才:'己',官:'庚',杀:'辛',印:'壬',枭:'癸'},
  丙:{比:'丙',劫:'丁',食:'戊',伤:'己',财:'辛',才:'庚',官:'癸',杀:'壬',印:'乙',枭:'甲'},
  丁:{比:'丁',劫:'丙',食:'己',伤:'戊',财:'庚',才:'辛',官:'壬',杀:'癸',印:'甲',枭:'乙'},
  戊:{比:'戊',劫:'己',食:'庚',伤:'辛',财:'癸',才:'壬',官:'乙',杀:'甲',印:'丁',枭:'丙'},
  己:{比:'己',劫:'戊',食:'辛',伤:'庚',财:'壬',才:'癸',官:'甲',杀:'乙',印:'丙',枭:'丁'},
  庚:{比:'庚',劫:'辛',食:'壬',伤:'癸',财:'乙',才:'甲',官:'丁',杀:'丙',印:'己',枭:'戊'},
  辛:{比:'辛',劫:'庚',食:'癸',伤:'壬',财:'甲',才:'乙',官:'丙',杀:'丁',印:'戊',枭:'己'},
  壬:{比:'壬',劫:'癸',食:'甲',伤:'乙',财:'丁',才:'丙',官:'己',杀:'戊',印:'辛',枭:'庚'},
  癸:{比:'癸',劫:'壬',食:'乙',伤:'甲',财:'丙',才:'丁',官:'戊',杀:'己',印:'庚',枭:'辛'},
};
const TEGAN_NAMES = {比:'比肩',劫:'劫财',食:'食神',伤:'伤官',财:'正财',才:'偏财',官:'正官',杀:'七杀',印:'正印',枭:'偏印'};
const TEGAN_ABBR = {比:'比',劫:'劫',食:'食',伤:'伤',财:'财',才:'才',官:'官',杀:'杀',印:'印',枭:'枭'};
const TEGAN_NATURE = {
  比:'同我者，夺财助身',劫:'夺财之星，破耗之兆',食:'泄秀之神，福寿之源',
  伤:'伤官见官，为祸百端',财:'养命之源，福祸相依',才:'横财偏门，来去匆匆',
  官:'贵气之神，正道之途',杀:'七杀攻身，凶险之兆',印:'护身之德，学历功名',枭:'夺食之星，晦暗之兆'
};

// Month stem table (using midnight base)
const MONTH_STEM_BASE = {寅:'甲',卯:'乙',辰:'丙',巳:'丁',午:'戊',未:'己',申:'庚',酉:'辛',戌:'壬',亥:'癸',子:'甲',丑:'乙'};

// Hour branch to stem (日上起时法)
// 甲己起甲子, 乙庚起丙子, 丙辛起戊子, 丁壬起庚子, 戊癸起壬子
function getHourStem(dayStemIdx, hourBranch) {
  const branchIdx = BRANCHES.indexOf(hourBranch);
  // Correct formula: (dayStemIdx * 2 + branchIdx) % 10
  return (dayStemIdx * 2 + branchIdx) % 10;
}

// Day stem index from Julian Day Number
function getDayStemIndex(year, month, day) {
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12 * a - 3;
  let jd = day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  return ((jd - 1) % 10 + 10) % 10; // 0=甲 (修正: -1 而非 -4)
}
function getDayBranchIndex(year, month, day) {
  let a = Math.floor((14 - month) / 12);
  let y = year + 4800 - a;
  let m = month + 12*a - 3;
  let jd = day + Math.floor((153*m+2)/5) + 365*y + Math.floor(y/4) - Math.floor(y/100) + Math.floor(y/400) - 32045;
  return ((jd + 1) % 12 + 12) % 12; // 修正: +1 而非 +2
}

// ═══ 黑格命理引擎移植：立春定年柱 + 节气定月柱 + 真太阳时 (v1.0 2026-06-22) ═══
// 精确排盘逻辑（Python 引擎移植 JS）
// 核心修正: 年柱以立春分界(非正月初一)、月柱以节气分界(非公历月份)

// 12节精确日期查找表 (1900-2050, 从 lunar_python 生成)
// 每个字符代表一年的偏移量: 0=基准日, 1=+1天, a=-1天
var JIE_DATES = {
  '立春': {base:[1,4], offsets:'001110111011100110011001100110011001100110011000100010001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000aa'},
  '惊蛰': {base:[2,6], offsets:'000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '清明': {base:[3,5], offsets:'0011001100110001000100010001000100010001000100000000000000000000000000000000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa'},
  '立夏': {base:[4,5], offsets:'1112111211121111111111111111111111111111111101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010000000000000000000'},
  '芒种': {base:[5,6], offsets:'00110001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '小暑': {base:[6,7], offsets:'011101110111011101110111011100110011001100110011001100110001000100010001000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa0'},
  '立秋': {base:[7,8], offsets:'000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaaaaaaaaaaaaaaaaaa'},
  '白露': {base:[8,8], offsets:'000100010001000100010001000100000000000000000000000000000000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa'},
  '寒露': {base:[9,8], offsets:'111111111111111101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010001000000000000000000000000000000000000a000a00'},
  '立冬': {base:[10,7], offsets:'1111111111111111111111111111011101110111011101110111011101110011001100110011001100110011001100010001000100010001000100010001000000000000000000000000000'},
  '大雪': {base:[11,7], offsets:'0111011101110111011100110011001100110011001100110011000100010001000100010001000100010000000000000000000000000000000000000000a000a000a000a000a000a000a00'},
  '小寒': {base:[0,6], offsets:'0000100010001000000000000000000000000000000000000a000a000a000a000a000a000a000a000a000aa00aa00aa00aa00aa00aa00aa00aa00aaa0aaa0aaa0aaa0aaa0aaa0aaa0aaa0aa'}
};

// 获取某年某节的精确日期 (从查找表读取, 天级精度)
function getJieDate(year, jieName) {
  let info = JIE_DATES[jieName];
  if (!info) return null;
  let idx = year - 1900;
  if (idx < 0 || idx >= info.offsets.length) return null;
  let ch = info.offsets[idx];
  let offset = 0;
  if (ch === 'a') offset = -1;
  else if (ch === '1') offset = 1;
  else if (ch === '2') offset = 2;
  else if (ch === 'B') offset = -2;
  return new Date(year, info.base[0], info.base[1] + offset);
}

// ═══ 精确节气时间计算 (天文近似, 分钟级精度) ═══
// 基于 Jean Meeus《天文算法》标准太阳黄经计算
// 用于起运年龄的精确计算, 误差<5分钟
var JIE_LONGITUDE = {
  '立春':315, '雨水':330, '惊蛰':345, '春分':0,
  '清明':15, '谷雨':30, '立夏':45, '小满':60,
  '芒种':75, '夏至':90, '小暑':105, '大暑':120,
  '立秋':135, '处暑':150, '白露':165, '秋分':180,
  '寒露':195, '霜降':210, '立冬':225, '小雪':240,
  '大雪':255, '冬至':270, '小寒':285, '大寒':300
};

function solarLongitudeJ2000(jd) {
  // 标准天文算法：太阳黄经计算 (基于 VSOP87 截断级数)
  // 参考: Jean Meeus《Astronomical Algorithms》第25章
  let T = (jd - 2451545.0) / 36525.0;
  let L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  let M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  let C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180)
        + (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180)
        + 0.000289 * Math.sin(3 * M * Math.PI / 180);
  let lambda = L0 + C;
  // 章动修正 (标准天文算法)
  let omega = 125.04 - 1934.136 * T;
  lambda = lambda - 0.00569 - 0.00478 * Math.sin(omega * Math.PI / 180);
  return ((lambda % 360) + 360) % 360;
}

function jdFromDate(date) {
  // JD from UTC milliseconds (timezone-agnostic)
  return date.getTime() / 86400000 + 2440587.5;
}

function dateFromJd(jd) {
  return new Date((jd - 2440587.5) * 86400000);
}

function getPreciseJieTime(year, jieName) {
  let targetLng = JIE_LONGITUDE[jieName];
  if (targetLng === undefined) return getJieDate(year, jieName);
  // 先用 getJieDate 估算日期
  let approx = getJieDate(year, jieName);
  if (!approx) return null;
  // 在估算日期前后3天内扫描, 找到太阳黄经越过目标的精确时刻
  let jdStart = jdFromDate(new Date(approx.getTime() - 3 * 86400000));
  let jdEnd = jdFromDate(new Date(approx.getTime() + 3 * 86400000));
  let step = 0.02; // ~30 min
  let prevLng = solarLongitudeJ2000(jdStart);
  let prevJd = jdStart;
  for (let jd = jdStart + step; jd <= jdEnd; jd += step) {
    let lng = solarLongitudeJ2000(jd);
    // 检测是否越过了目标黄经 (正向)
    let dPrev = ((targetLng - prevLng + 360) % 360);
    let dCurr = ((targetLng - lng + 360) % 360);
    if (dPrev > 300 && dCurr < 60) {
      // 跨越了目标 (dPrev接近360, dCurr接近0)
      // 二分法精确查找
      let lo = prevJd, hi = jd;
      for (let i = 0; i < 50; i++) {
        let mid = (lo + hi) / 2;
        let midLng = solarLongitudeJ2000(mid);
        let dMid = ((targetLng - midLng + 360) % 360);
        if (dMid > 180) lo = mid; else hi = mid;
        if (hi - lo < 0.000001) break;
      }
      return dateFromJd((lo + hi) / 2);
    }
    prevLng = lng;
    prevJd = jd;
  }
  // 回退到估算日期
  return approx;
}

// 12节对应的月支索引: 立春→寅(2), 惊蛰→卯(3), ...
var JIE_MONTH_MAP = [
  {name:'立春', branchIdx:2}, {name:'惊蛰', branchIdx:3}, {name:'清明', branchIdx:4},
  {name:'立夏', branchIdx:5}, {name:'芒种', branchIdx:6}, {name:'小暑', branchIdx:7},
  {name:'立秋', branchIdx:8}, {name:'白露', branchIdx:9}, {name:'寒露', branchIdx:10},
  {name:'立冬', branchIdx:11}, {name:'大雪', branchIdx:0}, {name:'小寒', branchIdx:1}
];

// 判断某日处于哪个节气月 (返回月支索引)
function getMonthBranchByJieqi(year, month, day) {
  let date = new Date(year, month - 1, day);
  // 从立春开始找: 找到最后一个已过的节
  let monthIdx = 2; // 默认寅月
  for (let i = 0; i < JIE_MONTH_MAP.length; i++) {
    let jq = JIE_MONTH_MAP[i];
    // 小寒在1月,需要特殊处理: 如果当前日期在小寒之前,可能还在上一年的子月
    let jqYear = year;
    if (jq.name === '小寒') {
      // 小寒在1月初,如果当前月>1,跳过;如果当前月=1,检查日期
      if (month > 1) continue;
    }
    let jqDate = getJieDate(jqYear, jq.name);
    if (!jqDate) continue;
    if (date >= jqDate) monthIdx = jq.branchIdx;  // 节气当天属新月支
  }
  // 特殊处理: 1月在小寒前,属于上一年的子月(大雪后)
  if (month === 1) {
    let xiaohan = getJieDate(year, '小寒');
    let daxuePrev = getJieDate(year - 1, '大雪');
    if (xiaohan && date < xiaohan && daxuePrev && date >= daxuePrev) {
      monthIdx = 0; // 子月
    } else if (xiaohan && date < xiaohan) {
      monthIdx = 1; // 丑月 (小寒前,大雪前,在丑月范围)
    }
  }
  return monthIdx;
}

// Year stem — 以立春分界 (非正月初一!)
function getYearStemBranch(year, month, day) {
  let date = new Date(year, month - 1, day);
  let lichun = getJieDate(year, '立春');
  if (!lichun) {
    // Fallback: 立春约在2月4日
    lichun = new Date(year, 1, 4);
  }
  // 立春前: 年柱属于上一年
  let baseYear = (date < lichun) ? year - 1 : year;  // 立春前属上一年 (节气当天上午可能仍属上年,建议传出生时辰精确判断)
  let stemIdx = ((baseYear - 4) % 10 + 10) % 10;
  let branchIdx = ((baseYear - 4) % 12 + 12) % 12;
  return { stemIdx, branchIdx, stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
}

// 精确版: 传入出生时辰,判断立春当天是否已过立春时刻
// 立春多在当天午后(12:00-18:00),上午出生仍属上一年
function getYearStemBranchExact(year, month, day, hour, minute) {
  let date = new Date(year, month - 1, day, hour || 0, minute || 0);
  let lichun = getJieDate(year, '立春');
  if (!lichun) lichun = new Date(year, 1, 4);
  // 立春当天: 12:00前用旧年,12:00后用新年 (立春多在午后)
  if (month === 2 && day === lichun.getDate()) {
    let baseYear = (hour < 12) ? year - 1 : year;
    let stemIdx = ((baseYear - 4) % 10 + 10) % 10;
    let branchIdx = ((baseYear - 4) % 12 + 12) % 12;
    return { stemIdx, branchIdx, stem: STEMS[stemIdx], branch: BRANCHES[branchIdx] };
  }
  return getYearStemBranch(year, month, day);
}

// Month pillar — 以节气定月支 (非公历月份!)
// 五虎遁: 甲/己年寅月=丙, 乙/庚年寅月=戊, 丙/辛年寅月=庚, 丁/壬年寅月=壬, 戊/癸年寅月=甲
function getMonthStem(yearStemIdx, monthBranch) {
  let monthBranchOrder = ['寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
  let yinMonthGanIdx = (yearStemIdx * 2 + 2) % 10; // 五虎遁公式
  let monthIdx = monthBranchOrder.indexOf(monthBranch);
  return (yinMonthGanIdx + monthIdx) % 10;
}

// 获取节气定月支 (替代旧的 BRANCHES[((month+9)%12)] 逻辑)
function getMonthBranchBySolar(year, month, day) {
  let monthIdx = getMonthBranchByJieqi(year, month, day);
  return BRANCHES[monthIdx];
}

// 真太阳时校正 (移植自 paipan.py true_solar_time)
function trueSolarTimeCorrection(year, month, day, hour, minute, lng, tzOffset) {
  if (lng === undefined || lng === null) return { year: year, month: month, day: day, hour: hour, minute: minute, delta: 0 };
  if (tzOffset === undefined) tzOffset = 8.0;
  let dt = new Date(year, month - 1, day, hour, minute);
  let n = Math.floor((dt - new Date(dt.getFullYear(), 0, 1)) / 86400000) + 1;
  let b = (360.0 * (n - 81) / 364.0) * Math.PI / 180.0;
  let eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);
  let delta = (lng - tzOffset * 15.0) * 4.0 + eot;
  let newMs = dt.getTime() + delta * 60000;
  let newDt = new Date(newMs);
  return {
    year: newDt.getFullYear(),
    month: newDt.getMonth() + 1,
    day: newDt.getDate(),
    hour: newDt.getHours(),
    minute: newDt.getMinutes(),
    delta: Math.round(delta * 10) / 10
  };
}

// ═══ 五行力量加权计算 (移植自 paipan.py wuxing_strength) ═══
// 天干1.0 / 藏干本气1.0·中气0.5·余气0.2 / 月支司令×2.0
var ZHI_CANGGAN = {
  '子':['癸'],'丑':['己','癸','辛'],'寅':['甲','丙','戊'],'卯':['乙'],
  '辰':['戊','乙','癸'],'巳':['丙','戊','庚'],'午':['丁','己'],'未':['己','丁','乙'],
  '申':['庚','壬','戊'],'酉':['辛'],'戌':['戊','辛','丁'],'亥':['壬','甲']
};
var WUXING_SHENG = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
var WUXING_KE = {'木':'土','土':'水','水':'火','火':'金','金':'木'};

function computeWuxingStrength(pillars, dayStem) {
  let score = {'木':0, '火':0, '土':0, '金':0, '水':0};
  let weights = [1.0, 0.5, 0.2];
  for (let idx = 0; idx < pillars.length; idx++) {
    let gan = pillars[idx].stem;
    let zhi = pillars[idx].branch;
    score[ELE[gan]] += 1.0;
    let mult = (idx === 1) ? 2.0 : 1.0; // 月支×2
    let canggan = ZHI_CANGGAN[zhi] || [];
    for (let i = 0; i < canggan.length; i++) {
      let w = weights[i] || 0.2;
      score[ELE[canggan[i]]] += Math.round(w * mult * 1000) / 1000;
    }
  }
  for (let k in score) score[k] = Math.round(score[k] * 100) / 100;
  
  let dayEle = ELE[dayStem];
  let yinEle = null, guanEle = null;
  for (let k in WUXING_SHENG) { if (WUXING_SHENG[k] === dayEle) yinEle = k; }
  for (let k in WUXING_KE) { if (WUXING_KE[k] === dayEle) guanEle = k; }
  let shangEle = WUXING_SHENG[dayEle];
  let caiEle = WUXING_KE[dayEle];
  
  let tong = Math.round((score[dayEle] + score[yinEle]) * 100) / 100;
  let yi = Math.round((score[shangEle] + score[caiEle] + score[guanEle]) * 100) / 100;
  let total = tong + yi;
  let ratio = total > 0 ? tong / total : 0;
  let tip = ratio > 0.55 ? '偏强' : (ratio < 0.45 ? '偏弱' : '均势(需细辨)');
  
  return {
    score: score,
    tong: tong, yi: yi,
    tongDetail: '比劫(' + dayEle + ')' + score[dayEle] + ' + 印(' + yinEle + ')' + score[yinEle],
    yiDetail: '食伤(' + shangEle + ')' + score[shangEle] + ' + 财(' + caiEle + ')' + score[caiEle] + ' + 官杀(' + guanEle + ')' + score[guanEle],
    ratio: Math.round(ratio * 100) / 100,
    tip: tip
  };
}

// ═══ 天干五合/相冲 + 六害 + 三刑完善 (移植自 paipan.py) ═══
var GAN_HE = {
  '甲己':'土','己甲':'土','乙庚':'金','庚乙':'金','丙辛':'水','辛丙':'水',
  '丁壬':'木','壬丁':'木','戊癸':'火','癸戊':'火'
};
var GAN_CHONG = ['甲庚','庚甲','乙辛','辛乙','丙壬','壬丙','丁癸','癸丁','戊甲','甲戊'];
// 注意: 天干相冲实际是 甲庚/乙辛/丙壬/丁癸 (戊己中央不相冲)
var GAN_CHONG_PAIRS = [
  {a:'甲',b:'庚'}, {a:'乙',b:'辛'}, {a:'丙',b:'壬'}, {a:'丁',b:'癸'}
];
var ZHI_LIUHE_MAP = {
  '子丑':'土','丑子':'土','寅亥':'木','亥寅':'木','卯戌':'火','戌卯':'火',
  '辰酉':'金','酉辰':'金','巳申':'水','申巳':'水','午未':'火/土','未午':'火/土'
};
var ZHI_CHONG_PAIRS = [
  {a:'子',b:'午'}, {a:'丑',b:'未'}, {a:'寅',b:'申'}, {a:'卯',b:'酉'}, {a:'辰',b:'戌'}, {a:'巳',b:'亥'}
];
var ZHI_HAI_PAIRS = [
  {a:'子',b:'未'}, {a:'丑',b:'午'}, {a:'寅',b:'巳'}, {a:'卯',b:'辰'}, {a:'申',b:'亥'}, {a:'酉',b:'戌'}
];
var XING3_A = ['寅','巳','申']; // 无恩之刑
var XING3_B = ['丑','戌','未']; // 恃势之刑
var XING_ZI = '辰午酉亥';       // 自刑

function detectGanRelations(pillars) {
  let labels = ['年','月','日','时'];
  let g = [pillars[0].stem, pillars[1].stem, pillars[2].stem, pillars[3].stem];
  let rel = { '天干五合': [], '天干相冲': [] };
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      let pair = g[i] + g[j];
      let tag = labels[i] + g[i] + '·' + labels[j] + g[j];
      if (GAN_HE[pair]) rel['天干五合'].push(tag + '→合' + GAN_HE[pair]);
      for (let k = 0; k < GAN_CHONG_PAIRS.length; k++) {
        if ((g[i] === GAN_CHONG_PAIRS[k].a && g[j] === GAN_CHONG_PAIRS[k].b) ||
            (g[i] === GAN_CHONG_PAIRS[k].b && g[j] === GAN_CHONG_PAIRS[k].a)) {
          rel['天干相冲'].push(tag);
        }
      }
    }
  }
  return rel;
}

function detectZhiRelationsFull(pillars) {
  let labels = ['年','月','日','时'];
  let z = [pillars[0].branch, pillars[1].branch, pillars[2].branch, pillars[3].branch];
  let rel = { '六合': [], '三合': [], '半合': [], '三会': [], '六冲': [], '相刑': [], '六害': [], '自刑': [] };
  
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      let pair = z[i] + z[j];
      let tag = labels[i] + z[i] + '·' + labels[j] + z[j];
      
      // 六合
      if (ZHI_LIUHE_MAP[pair]) rel['六合'].push(tag + '→合' + ZHI_LIUHE_MAP[pair]);
      // 六冲
      for (let k = 0; k < ZHI_CHONG_PAIRS.length; k++) {
        if ((z[i] === ZHI_CHONG_PAIRS[k].a && z[j] === ZHI_CHONG_PAIRS[k].b) ||
            (z[i] === ZHI_CHONG_PAIRS[k].b && z[j] === ZHI_CHONG_PAIRS[k].a)) {
          rel['六冲'].push(tag);
        }
      }
      // 六害
      for (let k = 0; k < ZHI_HAI_PAIRS.length; k++) {
        if ((z[i] === ZHI_HAI_PAIRS[k].a && z[j] === ZHI_HAI_PAIRS[k].b) ||
            (z[i] === ZHI_HAI_PAIRS[k].b && z[j] === ZHI_HAI_PAIRS[k].a)) {
          rel['六害'].push(tag);
        }
      }
      // 子卯刑
      if (z[i] === '子' && z[j] === '卯' || z[i] === '卯' && z[j] === '子') {
        rel['相刑'].push(tag + '(子卯·无礼之刑)');
      }
    }
  }
  
  // 三合
  let sanheCombos = [['申','子','辰'],['亥','卯','未'],['寅','午','戌'],['巳','酉','丑']];
  let sanheWx = {'申子辰':'水','亥卯未':'木','寅午戌':'火','巳酉丑':'金'};
  for (let c = 0; c < sanheCombos.length; c++) {
    let combo = sanheCombos[c];
    let idxs = [];
    for (let k = 0; k < 4; k++) { if (combo.indexOf(z[k]) >= 0) idxs.push(k); }
    let chars = idxs.map(function(k){return z[k];});
    let uniqueChars = chars.filter(function(v,i,a){return a.indexOf(v)===i;});
    let who = idxs.map(function(k){return labels[k]+z[k];}).join('·');
    if (uniqueChars.length === 3) {
      rel['三合'].push(combo.join('') + '三合' + sanheWx[combo.join('')] + '局(' + who + ')');
    } else if (uniqueChars.length === 2 && combo.indexOf(combo[1]) >= 0 && chars.indexOf(combo[1]) >= 0) {
      // 半合需含中神(combo[1])
      rel['半合'].push(combo.join('').substring(0,3) + '半合' + sanheWx[combo.join('')] + '(' + who + ')');
    }
  }
  
  // 三会
  let sanhuiCombos = [['寅','卯','辰'],['巳','午','未'],['申','酉','戌'],['亥','子','丑']];
  let sanhuiWx = {'寅卯辰':'木','巳午未':'火','申酉戌':'金','亥子丑':'水'};
  for (let c = 0; c < sanhuiCombos.length; c++) {
    let combo = sanhuiCombos[c];
    let idxs = [];
    for (let k = 0; k < 4; k++) { if (combo.indexOf(z[k]) >= 0) idxs.push(k); }
    let uniqueChars = idxs.map(function(k){return z[k];}).filter(function(v,i,a){return a.indexOf(v)===i;});
    if (uniqueChars.length === 3) {
      let who = idxs.map(function(k){return labels[k]+z[k];}).join('·');
      rel['三会'].push(combo.join('') + '三会' + sanhuiWx[combo.join('')] + '方(' + who + ')');
    }
  }
  
  // 三刑
  let xingGroups = [
    {chars: XING3_A, name: '寅巳申·无恩之刑'},
    {chars: XING3_B, name: '丑戌未·恃势之刑'}
  ];
  for (let gi = 0; gi < xingGroups.length; gi++) {
    let grp = xingGroups[gi];
    let idxs = [];
    for (let k = 0; k < 4; k++) { if (grp.chars.indexOf(z[k]) >= 0) idxs.push(k); }
    let uniqueChars = idxs.map(function(k){return z[k];}).filter(function(v,i,a){return a.indexOf(v)===i;});
    if (uniqueChars.length >= 2) {
      let who = idxs.map(function(k){return labels[k]+z[k];}).join('·');
      let full = uniqueChars.length === 3 ? '三刑全' : '半刑';
      rel['相刑'].push(grp.name + '(' + full + ': ' + who + ')');
    }
  }
  
  // 自刑
  for (let si = 0; si < XING_ZI.length; si++) {
    let zz = XING_ZI[si];
    let idxs = [];
    for (let k = 0; k < 4; k++) { if (z[k] === zz) idxs.push(k); }
    if (idxs.length >= 2) {
      let who = idxs.map(function(k){return labels[k];}).join('·');
      rel['自刑'].push(zz + zz + '自刑(' + who + ')');
    }
  }
  
  // 过滤空项
  let result = {};
  for (let k in rel) { if (rel[k].length > 0) result[k] = rel[k]; }
  return result;
}

// ═══ 长生十二宫 (移植自 paipan.py _dishi_of) ═══
var CHANGSHENG_START = {
  '甲':'亥','丙':'寅','戊':'寅','庚':'巳','壬':'申',
  '乙':'午','丁':'酉','己':'酉','辛':'子','癸':'卯'
};
var CS_ORDER = ['长生','沐浴','冠带','临官','帝旺','衰','病','死','墓','绝','胎','养'];

function getDishi(gan, zhi) {
  let start = CHANGSHENG_START[gan];
  if (!start) return '';
  let forward = (GAN_YINYANG_JS[gan] === '阳');
  let si = BRANCHES.indexOf(start);
  let zi = BRANCHES.indexOf(zhi);
  let step = forward ? ((zi - si + 12) % 12) : ((si - zi + 12) % 12);
  return CS_ORDER[step];
}
var GAN_YINYANG_JS = {'甲':'阳','乙':'阴','丙':'阳','丁':'阴','戊':'阳','己':'阴','庚':'阳','辛':'阴','壬':'阳','癸':'阴'};

// ═══ 旬空计算 (对标 lunar_python) ═══
// 旬空: 以日柱所在旬,空亡的两个地支 + 旬名
var XUN_NAMES = ['甲子','甲戌','甲申','甲午','甲辰','甲寅'];
function getXunKong(dayStem, dayBranch) {
  let stemIdx = STEMS.indexOf(dayStem);
  let branchIdx = BRANCHES.indexOf(dayBranch);
  // 在60甲子中找位置: n%10=stemIdx, n%12=branchIdx
  let n = -1;
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) { n = i; break; }
  }
  if (n < 0) return '';
  let xunIdx = Math.floor(n / 10);
  let kong1 = BRANCHES[(xunIdx * 10 + 10) % 12];
  let kong2 = BRANCHES[(xunIdx * 10 + 11) % 12];
  return kong1 + kong2;
}
function getXunName(dayStem, dayBranch) {
  let stemIdx = STEMS.indexOf(dayStem);
  let branchIdx = BRANCHES.indexOf(dayBranch);
  for (let i = 0; i < 60; i++) {
    if (i % 10 === stemIdx && i % 12 === branchIdx) {
      return XUN_NAMES[Math.floor(i / 10)];
    }
  }
  return '';
}

// ═══ 胎元/命宫/身宫 (移植自 paipan.py) ═══
// 胎元: 月干进一位,月支进三位
function getTaiYuan(monthStem, monthBranch) {
  let si = STEMS.indexOf(monthStem);
  let bi = BRANCHES.indexOf(monthBranch);
  return STEMS[(si + 1) % 10] + BRANCHES[(bi + 3) % 12];
}
// ═══ 命宫/身宫 (对标 lunar_python 算法) ═══
// MONTH_ZHI: 1-based, 寅=1,卯=2,辰=3,巳=4,午=5,未=6,申=7,酉=8,戌=9,亥=10,子=11,丑=12
var MONTH_ZHI_ARR = ['', '寅','卯','辰','巳','午','未','申','酉','戌','亥','子','丑'];
// ZHI: 1-based, 子=1,丑=2,寅=3,卯=4,辰=5,巳=6,午=7,未=8,申=9,酉=10,戌=11,亥=12
var ZHI_ARR = ['', '子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
// GAN: 1-based, 甲=1,...,癸=10
var GAN_ARR = ['', '甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];

// 命宫: 需月支、时支、年干
function getMingGong(yearStemIdx, monthBranch, timeBranch) {
  // month_zhi_index: 在MONTH_ZHI_ARR中查
  let mi = MONTH_ZHI_ARR.indexOf(monthBranch);
  let ti = MONTH_ZHI_ARR.indexOf(timeBranch);
  if (mi < 0 || ti < 0) return '';
  let offset = mi + ti;
  if (offset >= 14) { offset = 26 - offset; }
  else { offset = 14 - offset; }
  // 天干: (yearGanIdx_1based + 1) * 2 + offset, 超过10则减10
  let ganIdx = (yearStemIdx + 1) * 2 + offset;
  while (ganIdx > 10) { ganIdx -= 10; }
  return GAN_ARR[ganIdx] + MONTH_ZHI_ARR[offset];
}
// 身宫: 需月支、时支、年干
function getShenGong(yearStemIdx, monthBranch, timeBranch) {
  let mi = MONTH_ZHI_ARR.indexOf(monthBranch);
  let ti = ZHI_ARR.indexOf(timeBranch);
  if (mi < 0 || ti < 0) return '';
  let offset = mi + ti;
  if (offset > 12) { offset -= 12; }
  let ganIdx = (yearStemIdx + 1) * 2 + offset;
  while (ganIdx > 10) { ganIdx -= 10; }
  return GAN_ARR[ganIdx] + MONTH_ZHI_ARR[offset];
}

// ═══ 调候用神速查表 (穷通宝鉴十干分十二月) ═══
var TIAOHOU_TABLE = {
  '甲': {
    '寅':'丙癸','卯':'丙癸','辰':'庚壬','巳':'癸','午':'癸丁','未':'癸丁',
    '申':'庚丙','酉':'庚丙','戌':'庚丁','亥':'丙戊','子':'丙丁','丑':'丁丙'
  },
  '乙': {
    '寅':'丙癸','卯':'丙癸','辰':'癸丙','巳':'癸','午':'癸','未':'癸丙',
    '申':'丙癸','酉':'丙癸','戌':'丙癸','亥':'丙戊','子':'丙','丑':'丙'
  },
  '丙': {
    '寅':'壬庚','卯':'壬庚','辰':'壬','巳':'壬','午':'壬庚','未':'壬',
    '申':'壬','酉':'壬','戌':'壬','亥':'甲戊壬','子':'壬戊','丑':'壬甲'
  },
  '丁': {
    '寅':'甲庚','卯':'甲庚','辰':'甲','巳':'甲','午':'甲壬','未':'甲',
    '申':'甲','酉':'甲','戌':'甲','亥':'甲','子':'甲庚','丑':'甲'
  },
  '戊': {
    '寅':'丙甲癸','卯':'丙甲癸','辰':'甲丙','巳':'甲丙','午':'壬丙','未':'癸丙',
    '申':'丙癸','酉':'丙癸','戌':'丙癸','亥':'甲丙','子':'丙甲','丑':'丙甲'
  },
  '己': {
    '寅':'丙甲癸','卯':'丙甲癸','辰':'甲丙','巳':'甲丙','午':'丙癸','未':'丙癸',
    '申':'丙癸','酉':'丙癸','戌':'丙癸','亥':'丙甲','子':'丙甲','丑':'丙甲'
  },
  '庚': {
    '寅':'丁甲丙','卯':'丁甲丙','辰':'甲丁','巳':'甲丁','午':'丁壬','未':'丁甲',
    '申':'甲','酉':'甲','戌':'甲','亥':'丁甲','子':'丁甲','丑':'丁甲'
  },
  '辛': {
    '寅':'壬己甲','卯':'壬己甲','辰':'壬甲','巳':'壬甲','午':'壬己','未':'壬甲',
    '申':'壬甲','酉':'壬甲','戌':'壬甲','亥':'壬甲','子':'壬丙','丑':'壬丙'
  },
  '壬': {
    '寅':'庚丙戊','卯':'庚戊','辰':'甲庚','巳':'壬','午':'壬辛','未':'壬辛',
    '申':'戊','酉':'甲','戌':'甲','亥':'戊丙','子':'戊丙','丑':'丙丁'
  },
  '癸': {
    '寅':'庚辛','卯':'庚辛','辰':'甲丙','巳':'丙','午':'庚辛','未':'庚辛',
    '申':'庚辛','酉':'庚辛','戌':'庚辛','亥':'庚辛','子':'丙丁','丑':'丙丁'
  }
};

function getTiaohou(dayStem, monthBranch) {
  let table = TIAOHOU_TABLE[dayStem];
  if (!table) return '';
  return table[monthBranch] || '';
}

// ═══ 从格识别 (移植自 references/05) ═══
function detectCongge(pillars, dayStem) {
  let dayEle = ELE[dayStem];
  let eleCount = {'木':0,'火':0,'土':0,'金':0,'水':0};
  for (let i = 0; i < pillars.length; i++) {
    eleCount[ELE[pillars[i].stem]]++;
    eleCount[ZHI_ELE[pillars[i].branch]]++;
  }
  let dayCount = eleCount[dayEle];
  let total = 8;
  // 从弱: 日主五行≤1且无生扶(印+比劫≤1)
  let yinEle = null;
  for (let k in WUXING_SHENG) { if (WUXING_SHENG[k] === dayEle) yinEle = k; }
  let supportCount = dayCount + eleCount[yinEle];
  
  if (supportCount <= 1 && dayCount === 0) {
    // 检查是否从财/从杀/从儿
    let caiEle = WUXING_KE[dayEle];
    let guanEle = null;
    for (let k in WUXING_KE) { if (WUXING_KE[k] === dayEle) guanEle = k; }
    let shangEle = WUXING_SHENG[dayEle];
    if (eleCount[caiEle] >= 5) return { type: '从财格', desc: '日主极弱无根,财星独旺,顺财之势' };
    if (eleCount[guanEle] >= 5) return { type: '从杀格', desc: '日主极弱无根,官杀独旺,顺杀之势' };
    if (eleCount[shangEle] >= 5) return { type: '从儿格', desc: '日主极弱无根,食伤独旺,顺泄之势' };
    return { type: '从弱格', desc: '日主极弱无根无生,满盘异党,顺其势者吉' };
  }
  // 专旺: 日主五行≥6且无克伐
  let keEle = WUXING_KE[dayEle];
  if (dayCount >= 6 && eleCount[keEle] === 0) {
    return { type: '专旺格', desc: '日主五行独旺,无克伐之气,顺其旺势' };
  }
  return null;
}

})(typeof window !== "undefined" ? window : globalThis);
