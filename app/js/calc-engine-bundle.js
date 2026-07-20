// 易道智鉴 · 测算引擎库（从 divination-hub.html 抽出）
// 包含：六爻、紫微斗数、奇门遁甲、梅花易数、大六壬、姓名学、风水、择日// 易道智鉴 · 测算引擎库
// 包含：六爻、紫微斗数、奇门遁甲、梅花易数、大六壬、姓名学、风水、择日

// ========== 工具函数 ==========
function _qyMod(n, m) { return ((n % m) + m) % m; }

let _STEMS = typeof _STEMS !== 'undefined' ? _STEMS : ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
let _BRANCHES = typeof _BRANCHES !== 'undefined' ? _BRANCHES : ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
let _GUA_XIANG = typeof _GUA_XIANG !== 'undefined' ? _GUA_XIANG : {
  0:{name:'乾',sym:'☰',code:'111',wuxing:'金',family:'父'},
  1:{name:'兑',sym:'☱',code:'110',wuxing:'金',family:'少女'},
  2:{name:'离',sym:'☲',code:'101',wuxing:'火',family:'中女'},
  3:{name:'震',sym:'☳',code:'100',wuxing:'木',family:'长男'},
  4:{name:'巽',sym:'☴',code:'011',wuxing:'木',family:'长女'},
  5:{name:'坎',sym:'☵',code:'010',wuxing:'水',family:'中男'},
  6:{name:'艮',sym:'☶',code:'001',wuxing:'土',family:'少男'},
  7:{name:'坤',sym:'☷',code:'000',wuxing:'土',family:'母'}
};
let _GUA_ORDER = typeof _GUA_ORDER !== 'undefined' ? _GUA_ORDER : [0,1,2,3,4,5,6,7]; // 先天八卦数
let _XING = typeof _XING !== 'undefined' ? _XING : {金:0,木:1,水:2,火:3,土:4};
let _SHICHEN = typeof _SHICHEN !== 'undefined' ? _SHICHEN : ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
let _NAYIN = typeof _NAYIN !== 'undefined' ? _NAYIN : [
  '海中金','海中金','炉中火','炉中火','大林木','大林木','路旁土','路旁土','剑锋金','剑锋金',
  '山头火','山头火','涧下水','涧下水','城头土','城头土','白蜡金','白蜡金','杨柳木','杨柳木',
  '泉中水','泉中水','屋上土','屋上土','霹雳火','霹雳火','松柏木','松柏木','长流水','长流水',
  '沙中金','沙中金','山下火','山下火','平地木','平地木','壁上土','壁上土','金箔金','金箔金',
  '覆灯火','覆灯火','天河水','天河水','大驿土','大驿土','钗钏金','钗钏金','桑柘木','桑柘木',
  '大溪水','大溪水','沙中土','沙中土','天上火','天上火','石榴木','石榴木','大海水','大海水'
];

function _stemIdx(gan) { return _STEMS.indexOf(gan); }
function _branchIdx(zhi) { return _BRANCHES.indexOf(zhi); }
function _ganZhiIdx(gz) { const g = gz.gan||gz[0], z = gz.zhi||gz[1]; return _STEMS.indexOf(g) * 12 + _BRANCHES.indexOf(z); }
function _getGuaFromNum(n) { return _GUA_ORDER[_qyMod(n-1,8)]; }
function _getGuaLines(code) { return code.split('').map(c=>c==='1'?'阳':'阴'); }

// ========== 1. 六爻测算引擎 ==========

function liuyaoQiGua(method, params) {
  let upperNum=0, lowerNum=0, dongNum=0;
  if (method === 'time') {
    const p = params || {};
    const y = p.year || new Date().getFullYear();
    const m = p.month || (new Date().getMonth()+1);
    const d = p.day || new Date().getDate();
    const h = p.hour || new Date().getHours();
    upperNum = y + m + d;
    lowerNum = y + m + d + h;
    dongNum = y + m + d + h;
  } else if (method === 'number') {
    const p = params || {};
    upperNum = p.n1 || 1;
    lowerNum = p.n2 || 1;
    dongNum = p.n3 || (upperNum + lowerNum);
  } else if (method === 'char') {
    const ch = (params && params.char) ? params.char : '易';
    const strokes = _chineseStrokes(ch);
    upperNum = strokes[0] || 1;
    lowerNum = strokes[1] || 1;
    dongNum = strokes.reduce((a,b)=>a+b,0);
  } else if (method === 'coin') {
    const tosses = (params && params.tosses) ? params.tosses : [];
    if (tosses.length !== 6) throw new Error('coin tosses need 6 arrays');
    const lines = tosses.map(t => {
      const sum = t.reduce((a,b)=>a+b,0);
      if (sum === 0) return {line:'阴', dong:true};   // 老阴
      if (sum === 3) return {line:'阳', dong:true};   // 老阳
      if (sum === 1) return {line:'阳', dong:false};  // 少阳
      return {line:'阴', dong:false};                  // 少阴
    });
    const ben = lines.slice(); // tosses[0]=初爻(底), 不反转
    const dong = [];
    const bian = ben.map((l,idx)=>{
      if (l.dong) { dong.push(idx); return {line: l.line==='阳'?'阴':'阳', dong:false}; }
      return l;
    });
    return {
      method: 'coin',
      benGua: _linesToGua(ben),
      bianGua: _linesToGua(bian),
      dongYao: dong,
      lines: ben,
      bianLines: bian
    };
  }
  upperNum = Math.max(1, upperNum);
  lowerNum = Math.max(1, lowerNum);
  dongNum = Math.max(1, dongNum);
  const upperGua = _getGuaFromNum(upperNum);
  const lowerGua = _getGuaFromNum(lowerNum);
  const dongYao = _qyMod(dongNum, 6);
  const benLines = _buildLines(lowerGua, upperGua);
  const bianLines = benLines.slice();
  bianLines[dongYao] = {line: benLines[dongYao].line==='阳'?'阴':'阳', dong:false};
  return {
    method: method,
    benGua: {upper: upperGua, lower: lowerGua, idx: _guaIndexFromParts(lowerGua, upperGua)},
    bianGua: _linesToGua(bianLines),
    dongYao: [dongYao],
    lines: benLines,
    bianLines: bianLines,
    params: {upperNum, lowerNum, dongNum}
  };
}

function _chineseStrokes(ch) {
  const arr = String(ch).split('');
  return arr.map(c => (c.charCodeAt(0) % 10) + 1);
}

function _buildLines(lowerIdx, upperIdx) {
  const lowerCode = _GUA_XIANG[lowerIdx].code;
  const upperCode = _GUA_XIANG[upperIdx].code;
  const all = lowerCode + upperCode;
  return all.split('').map(c=>({line: c==='1'?'阳':'阴', dong:false}));
}

function _linesToGua(lines) {
  const code = lines.map(l=>l.line==='阳'?'1':'0').join('');
  const lowerCode = code.slice(0,3);
  const upperCode = code.slice(3,6);
  const lowerIdx = Object.keys(_GUA_XIANG).find(k=>_GUA_XIANG[k].code===lowerCode);
  const upperIdx = Object.keys(_GUA_XIANG).find(k=>_GUA_XIANG[k].code===upperCode);
  return {
    upper: parseInt(upperIdx),
    lower: parseInt(lowerIdx),
    idx: _guaIndexFromParts(parseInt(lowerIdx), parseInt(upperIdx)),
    code: code
  };
}

function _guaIndexFromParts(lowerIdx, upperIdx) {
  return upperIdx * 8 + lowerIdx;
}

const _BAGONG_ORDER = {
  0:[0,4,6,7,39,55,23,16],
  1:[9,13,15,14,46,62,30,25],
  2:[18,22,20,21,53,37,5,2],
  3:[27,31,29,28,60,44,12,11],
  4:[36,32,34,35,3,19,51,52],
  5:[45,41,43,42,10,26,58,61],
  6:[54,50,48,49,17,1,33,38],
  7:[63,59,57,56,24,8,40,47]
};
const _GONG_ZHI = {
  0:['子','寅','辰','午','申','戌'], 7:['未','巳','卯','丑','亥','酉'],
  2:['卯','丑','亥','酉','未','巳'], 3:['子','寅','辰','午','申','戌'],
  4:['丑','亥','酉','未','巳','卯'], 5:['寅','辰','午','申','戌','子'],
  6:['辰','午','申','戌','子','寅'], 1:['酉','未','巳','卯','丑','亥']
};
const _GONG_GAN = {0:'甲',1:'丁',2:'己',3:'庚',4:'辛',5:'戊',6:'丙',7:'乙'}; // 乾甲坤乙民丙兑丁坎戊离己震庚巽辛
const _LIUSHEN = ['青龙','朱雀','勾陈','腾蛇','白虎','玄武'];
const _LIUQIN = ['兄弟','妻财','子孙','官鬼','父母']; // 0同我 1我克 2我生 3克我 4生我

function liuyaoZhuangGua(guaData, dayGanZhi) {
  const ben = guaData.benGua;
  const idx = ben.idx;
  let gong = 0, pos = 0;
  for (const g in _BAGONG_ORDER) {
    const p = _BAGONG_ORDER[g].indexOf(idx);
    if (p >= 0) { gong = parseInt(g); pos = p; break; }
  }
  const gongWx = _GUA_XIANG[gong].wuxing;
  const zhis = _GONG_ZHI[gong];
  const gan = _GONG_GAN[gong];
  const gans = _peiTianGan(gong, gan);
  const liuqin = zhis.map(z => {
    const zWx = _zhiWuxing(z);
    return _computeLiuQin(gongWx, zWx);
  });
  const dayGan = dayGanZhi ? dayGanZhi[0] : '甲';
  const liushen = _peiLiuShen(dayGan);
  const shiying = _shiYingFromPos(pos);
  return {
    gong: gong,
    gongName: _GUA_XIANG[gong].name + '宫',
    gongWuxing: gongWx,
    tiangan: gans,
    dizhi: zhis,
    liuqin: liuqin,
    liushen: liushen,
    shiying: shiying
  };
}

function _peiTianGan(gongIdx, gan) {
  // 纳甲法: 内卦3爻同干, 外卦3爻同干
  // 乾内甲外壬, 坤内乙外癸, 其他宫内本干外本干+6
  const innerGan = gan;
  let outerGan;
  if (gongIdx === 0) { outerGan = '壬'; } // 乾内甲外壬
  else if (gongIdx === 7) { outerGan = '癸'; } // 坤内乙外癸
  else { outerGan = gan; } // 其他: 内外卦同干 (京房纳甲法)
  return [innerGan, innerGan, innerGan, outerGan, outerGan, outerGan];
}

function _zhiWuxing(zhi) {
  const map = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  return map[zhi];
}

function _computeLiuQin(gongWx, zhiWx) {
  const g = _XING[gongWx], z = _XING[zhiWx];
  const diff = _qyMod(z - g, 5);
  return _LIUQIN[diff];
}

function _peiLiuShen(dayGan) {
  const map = {'甲':0,'乙':0,'丙':1,'丁':1,'戊':2,'己':3,'庚':4,'辛':4,'壬':5,'癸':5};
  const start = map[dayGan] || 0;
  return Array.from({length:6},(_,i)=>_LIUSHEN[_qyMod(start+i,6)]);
}

function _shiYingFromPos(pos) {
  const map = [5,0,1,2,3,4,3,2];
  const s = map[pos] || 0;
  const y = _qyMod(s + 3, 6);
  return {shi: s, ying: y};
}

function liuyaoDuanGua(guaData, question) {
  const zg = guaData.zhuangGua || liuyaoZhuangGua(guaData, guaData.dayGanZhi || '甲子');
  const dong = guaData.dongYao || [];
  const lines = guaData.lines || [];
  // 自占/代占模式：'person'=自占（世爻为本身），'matter'=代占（应爻为本身）
  // 《黄金策》云："自占以世爻为本身，应爻为他人；代占以应爻为本身，世爻为他人。"
  const yjMode = guaData.yjMode || 'person';
  const yongshenMap = {
    '财':'妻财','求财':'妻财','官':'官鬼','事业':'官鬼','父母':'父母','学业':'父母',
    '子女':'子孙','兄弟':'兄弟','婚姻':'妻财','感情':'妻财','疾病':'官鬼'
  };
  let yongshen = '官鬼';
  let yongshenSource = '默认'; // 记录用神来源
  if (question) {
    for (const k in yongshenMap) { if (question.includes(k)) { yongshen = yongshenMap[k]; yongshenSource = '按所问之事'; break; } }
  }
  const yongIdx = zg.liuqin.indexOf(yongshen);
  let yongState = '未现';
  if (yongIdx >= 0) {
    const yongLine = lines[yongIdx];
    yongState = yongLine.line + (yongLine.dong?'动':'静');
  }
  const dayZhi = guaData.dayGanZhi ? guaData.dayGanZhi[1] : '子';
  const monthZhi = guaData.monthZhi || '寅';
  const yongZhi = yongIdx >= 0 ? zg.dizhi[yongIdx] : '';
  const isWang = (yongZhi === dayZhi || yongZhi === monthZhi || _shengZhe(yongZhi, dayZhi, monthZhi));
  
  // ═══ 自占/代占：世爻应爻旺衰分析 ═══
  // 《黄金策》云："自占以世爻为本身，应爻为他人；代占以应爻为本身，世爻为他人。"
  const shiIdx = zg.shiying.shi;
  const yingIdx = zg.shiying.ying;
  const shiZhi = zg.dizhi[shiIdx];
  const yingZhi = zg.dizhi[yingIdx];
  const shiLiuqin = zg.liuqin[shiIdx];
  const yingLiuqin = zg.liuqin[yingIdx];
  
  // 世爻旺衰
  let shiWangState = _wangShuaiState(shiZhi, dayZhi, monthZhi);
  let shiDesc = '世爻（第' + (shiIdx+1) + '爻·' + shiLiuqin + '·' + shiZhi + '）：' + shiWangState;
  if (shiZhi === dayZhi) shiDesc += '，日建临世，自身有力；';
  else if (_wxSheng(_zhiWuxing(dayZhi), _zhiWuxing(shiZhi))) shiDesc += '，日辰生世，得外力助；';
  else if (_wxKe(_zhiWuxing(dayZhi), _zhiWuxing(shiZhi))) shiDesc += '，日辰克世，自身受制；';
  if (shiZhi === monthZhi) shiDesc += '月建临世，根基稳固。';
  
  // 应爻旺衰
  let yingWangState = _wangShuaiState(yingZhi, dayZhi, monthZhi);
  let yingDesc = '应爻（第' + (yingIdx+1) + '爻·' + yingLiuqin + '·' + yingZhi + '）：' + yingWangState;
  if (yingZhi === dayZhi) yingDesc += '，日建临应，对方有力；';
  else if (_wxSheng(_zhiWuxing(dayZhi), _zhiWuxing(yingZhi))) yingDesc += '，日辰生应，对方得助；';
  else if (_wxKe(_zhiWuxing(dayZhi), _zhiWuxing(yingZhi))) yingDesc += '，日辰克应，对方受制；';
  if (yingZhi === monthZhi) yingDesc += '月建临应，对方根基稳。';
  
  // 自占以世爻为本身，代占以应爻为本身
  let selfDesc = '';
  if (yjMode === 'person') {
    selfDesc = '自占以世爻为本身。' + shiDesc;
  } else {
    selfDesc = '代占以应爻为本身。' + yingDesc;
  }
  
  // 旬空判断: 根据日干支查旬空
  let dayGzIdx = 0;
  if (guaData.dayGanZhi) {
    const dg = guaData.dayGanZhi[0]; // 天干
    const dz = guaData.dayGanZhi[1]; // 地支
    const ganIdx = _STEMS.indexOf(dg);
    const zhiIdx = _BRANCHES.indexOf(dz);
    if (ganIdx >= 0 && zhiIdx >= 0) {
      // 六十甲子序数: 找到匹配的甲子
      for (let i = 0; i < 60; i++) {
        if (i % 10 === ganIdx && i % 12 === zhiIdx) { dayGzIdx = i; break; }
      }
    }
  }
  const xunKong = _getXunKongZhi(dayGzIdx);
  const isKong = yongZhi && xunKong.includes(yongZhi);
  
  // 六合六冲
  const liuhePairs = {'子':'丑','寅':'亥','卯':'戌','辰':'酉','巳':'申','午':'未'};
  const liuchongPairs = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥'};
  const dayHe = yongZhi && liuhePairs[yongZhi] === dayZhi;
  const dayChong = yongZhi && liuchongPairs[yongZhi] === dayZhi;
  const monthHe = yongZhi && liuhePairs[yongZhi] === monthZhi;
  const monthChong = yongZhi && liuchongPairs[yongZhi] === monthZhi;
  
  // 世爻旬空判断
  const shiKong = xunKong.includes(shiZhi);
  const yingKong = xunKong.includes(yingZhi);
  if (shiKong) shiDesc += ' 世爻旬空，自身无力；';
  if (yingKong) yingDesc += ' 应爻旬空，对方无力；';
  
  let verdict = '平';
  if (yongIdx < 0) verdict = '用神未上卦，事难明朗';
  else if (isKong) verdict = '用神旬空，谋事难成';
  else if (isWang && dong.includes(yongIdx)) verdict = '用神旺相发动，事可成就';
  else if (isWang && dayHe) verdict = '用神旺相合日，事可成但迟';
  else if (isWang) verdict = '用神旺相，事体稳妥';
  else if (dayChong || monthChong) verdict = '用神被冲，事多变动';
  else if (dong.includes(yongIdx)) verdict = '用神发动，力不足';
  else verdict = '用神休囚，宜静待';
  
  // 自占/代占旺衰补充判断
  // 《增删卜易》云：自占看世爻旺衰，世旺则自身有力，世衰则自身无力；代占看应爻旺衰。
  if (yjMode === 'person' && shiWangState.includes('旺')) {
    verdict += '；世爻旺相，自身得力';
  } else if (yjMode === 'person' && (shiWangState.includes('死') || shiKong)) {
    verdict += '；世爻休囚空亡，自身无力';
  } else if (yjMode === 'matter' && yingWangState.includes('旺')) {
    verdict += '；应爻旺相，对方得力';
  } else if (yjMode === 'matter' && (yingWangState.includes('死') || yingKong)) {
    verdict += '；应爻休囚空亡，对方无力';
  }
  
  const yingqi = _yingqiHint(yongZhi);
  const enhance = _liuyaoEnhance(guaData, zg, yongIdx, dayZhi, monthZhi);
  // 暗动补充判断
  if (enhance.anDong && enhance.anDong.length > 0 && yongIdx >= 0 && enhance.anDong.includes(yongIdx)) {
    verdict = '用神暗动（被日辰冲），暗中有人相助';
  }
  // 伏神补充
  if (yongIdx < 0 && enhance.fuShen) {
    verdict = '用神伏藏于' + enhance.fuShen.fuZhi + '（' + (enhance.fuShenAppear ? '飞神空亡发动，伏神可出' : '飞神压伏，难以出现') + '）';
  }
  // 三合局补充
  if (enhance.sanhe && enhance.sanhe.length > 0) {
    verdict += '；' + enhance.sanhe.map(s => s.matched.join('') + '合' + s.wx + '局').join('、');
  }
  
  // ═══ 变卦六亲分析 ═══
  // 《增删卜易》云：动爻变出之爻，其六亲关系影响吉凶。变爻生用则吉，变爻克用则凶。
  let bianAnalysis = '';
  let bianLiuqinList = [];
  if (dong.length > 0 && guaData.bianGua) {
    // 计算变卦的纳甲六亲
    let bianZg = null;
    try {
      bianZg = liuyaoZhuangGua({benGua: guaData.bianGua, dayGanZhi: guaData.dayGanZhi}, guaData.dayGanZhi);
    } catch(e) { bianZg = null; }
    
    if (bianZg) {
      bianLiuqinList = bianZg.liuqin;
      let bianParts = [];
      for (let di = 0; di < dong.length; di++) {
        let idx = dong[di];
        let oldLq = zg.liuqin[idx];
        let newLq = bianZg.liuqin[idx];
        let oldZhi = zg.dizhi[idx];
        let newZhi = bianZg.dizhi[idx];
        
        // 变爻与用神的关系
        let relation = '同用'; // 默认同用
        if (newLq === yongshen) relation = '同用';
        else {
          // 判断变爻六亲与用神六亲的生克关系
          let newLqWx = _liuqinToWx(newLq, zg.gongWuxing);
          let yongWx = _liuqinToWx(yongshen, zg.gongWuxing);
          if (_wxSheng(newLqWx, yongWx)) relation = '生用';
          else if (_wxKe(newLqWx, yongWx)) relation = '克用';
          else if (_wxSheng(yongWx, newLqWx)) relation = '泄用';
          else if (_wxKe(yongWx, newLqWx)) relation = '制用';
        }
        
        let relationDesc = '';
        if (relation === '生用') relationDesc = '变爻生用神，吉——事态向有利方向发展';
        else if (relation === '克用') relationDesc = '变爻克用神，凶——事态恶化，需防变故';
        else if (relation === '泄用') relationDesc = '变爻泄用神，减力——虽有消耗但不为大凶';
        else if (relation === '制用') relationDesc = '变爻制用神，吉——忌神被制，反凶为吉';
        else relationDesc = '变爻同用神，平——力量增减不大';
        
        bianParts.push('第' + (idx+1) + '爻由' + oldLq + '(' + oldZhi + ')变' + newLq + '(' + newZhi + ')，' + relationDesc);
      }
      bianAnalysis = bianParts.join('；');
    }
  }
  
  return {
    yongshen, yongshenIdx: yongIdx, yongshenState: yongState, yongshenSource: yongshenSource,
    yongshenWang: isWang, verdict, dongYao: dong, yingqi,
    xunKong: isKong, xunKongZhi: xunKong,
    liuhe: dayHe || monthHe, liuchong: dayChong || monthChong,
    anDong: enhance.anDong, fuShen: enhance.fuShen, sanhe: enhance.sanhe, jinTui: enhance.jinTui,
    yjMode: yjMode,
    shiAnalysis: shiDesc,
    yingAnalysis: yingDesc,
    selfAnalysis: selfDesc,
    bianAnalysis: bianAnalysis,
    bianLiuqin: bianLiuqinList,
    advice: _liuyaoAdvice(question, verdict)
  };
}

// 旺衰状态判断（返回文字描述）
function _wangShuaiState(zhi, dayZhi, monthZhi) {
  if (!zhi) return '未知';
  let yw = _zhiWuxing(zhi);
  let dw = _zhiWuxing(dayZhi);
  let mw = _zhiWuxing(monthZhi);
  // 月令旺衰: 同我为旺, 生我为相, 我生为休, 我克为囚, 克我为死
  let monthState = '死';
  if (mw === yw) monthState = '旺';
  else if (_wxSheng(mw, yw)) monthState = '相';
  else if (_wxSheng(yw, mw)) monthState = '休';
  else if (_wxKe(yw, mw)) monthState = '囚';
  else if (_wxKe(mw, yw)) monthState = '死';
  // 日辰生克
  let dayState = '平';
  if (dw === yw) dayState = '日建';
  else if (_wxSheng(dw, yw)) dayState = '日生';
  else if (_wxSheng(yw, dw)) dayState = '日泄';
  else if (_wxKe(dw, yw)) dayState = '日克';
  else if (_wxKe(yw, dw)) dayState = '日制';
  return monthState + '·' + dayState;
}

// 六亲转五行（基于宫五行）
function _liuqinToWx(lq, gongWx) {
  // _LIUQIN = ['兄弟','妻财','子孙','官鬼','父母']
  // 0同我(兄弟) 1我克(妻财) 2我生(子孙) 3克我(官鬼) 4生我(父母)
  let gongWxIdx = _XING[gongWx];
  let lqIdx = _LIUQIN.indexOf(lq);
  if (lqIdx < 0) return gongWx;
  // 六亲五行 = 宫五行 + 偏移
  // 同我→宫五行, 我克→宫五行所克, 我生→宫五行所生, 克我→克宫五行, 生我→生宫五行
  let wxArr = ['金','木','水','火','土'];
  let shengMap = {'金':'水','水':'木','木':'火','火':'土','土':'金'};
  let keMap = {'金':'木','木':'土','土':'水','水':'火','火':'金'};
  if (lqIdx === 0) return gongWx; // 兄弟
  if (lqIdx === 1) return keMap[gongWx]; // 妻财（我克）
  if (lqIdx === 2) return shengMap[gongWx]; // 子孙（我生）
  if (lqIdx === 3) { // 官鬼（克我）→ 找克宫五行的五行
    for (let w in keMap) { if (keMap[w] === gongWx) return w; }
  }
  if (lqIdx === 4) { // 父母（生我）→ 找生宫五行的五行
    for (let w in shengMap) { if (shengMap[w] === gongWx) return w; }
  }
  return gongWx;
}

function _shengZhe(yongZhi, dayZhi, monthZhi) {
  // 升级: 实现月令旺相休囚死体系 + 日辰生克
  const yw = _zhiWuxing(yongZhi);
  const dw = _zhiWuxing(dayZhi);
  const mw = _zhiWuxing(monthZhi);
  
  // 月令旺衰: 同我为旺, 生我为相, 我生为休, 我克为囚, 克我为死
  const wangState = {同:'旺',生:'相',我生:'休',我克:'囚',克:'死'};
  let monthState = '死';
  if (mw === yw) monthState = '旺';
  else if (_wxSheng(mw, yw)) monthState = '相';
  else if (_wxSheng(yw, mw)) monthState = '休';
  else if (_wxKe(yw, mw)) monthState = '囚';
  else if (_wxKe(mw, yw)) monthState = '死';
  
  // 日辰生克
  let dayState = '平';
  if (dw === yw) dayState = '日建';
  else if (_wxSheng(dw, yw)) dayState = '日生';
  else if (_wxSheng(yw, dw)) dayState = '日泄';
  else if (_wxKe(dw, yw)) dayState = '日克';
  else if (_wxKe(yw, dw)) dayState = '日制';
  
  // 综合: 旺相 + 日建/日生 = 旺相; 休囚 + 日克 = 休囚无力
  const isWang = (monthState === '旺' || monthState === '相') && (dayState === '日建' || dayState === '日生' || dayState === '平');
  const isXiu = (monthState === '休' || monthState === '囚') && dayState !== '日克';
  const isSi = monthState === '死' || dayState === '日克';
  
  return isWang; // 返回布尔值用于兼容
}

function _wxSheng(a, b) { // a生b?
  const sheng = {'金':'水','水':'木','木':'火','火':'土','土':'金'};
  return sheng[a] === b;
}
function _wxKe(a, b) { // a克b?
  const ke = {'金':'木','木':'土','土':'水','水':'火','火':'金'};
  return ke[a] === b;
}

function _getXunKongZhi(gzIdx) {
  // 旬空: 甲子旬空戌亥, 甲戌旬空申酉, ... 每旬空两个地支
  const xun = Math.floor(gzIdx / 10); // 0-5
  const xunKongMap = [
    ['戌','亥'], // 甲子旬
    ['申','酉'], // 甲戌旬
    ['午','未'], // 甲申旬
    ['辰','巳'], // 甲午旬
    ['寅','卯'], // 甲辰旬
    ['子','丑']  // 甲寅旬
  ];
  return xunKongMap[xun] || ['戌','亥'];
}

function _yingqiHint(zhi) {
  if (!zhi) return '难以确定';
  return '逢' + zhi + '日、' + _BRANCHES[_qyMod(_branchIdx(zhi)+6,12)] + '日，或' + zhi + '月、' + _BRANCHES[_qyMod(_branchIdx(zhi)+6,12)] + '月';
}

function _liuyaoAdvice(q, v) {
  if (v.includes('成就') || v.includes('旺相发动')) return '用神旺相发动，事可成就。当前时运有利，可积极推进。';
  if (v.includes('旺相') || v.includes('稳妥')) return '用神旺相安静，事体稳妥。按部就班，终有所成。';
  if (v.includes('发动') && v.includes('不足')) return '用神发动但力不足，宜等待时机再进。';
  if (v.includes('休囚')) return '用神休囚无力，时机尚未成熟，宜蓄势待发。';
  if (v.includes('未上卦') || v.includes('未现')) return '用神未上卦，事体不明，需另寻线索。';
  return '需结合卦象、动爻、旬空等综合分析。';
}

// 暗动: 静爻被日辰冲为暗动
function _anDong(yongIdx, lines, dayZhi, zg) {
  if (yongIdx < 0 || !lines[yongIdx] || lines[yongIdx].dong) return false;
  const yongZhi = zg.dizhi[yongIdx];
  const liuchongPairs = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥'};
  return liuchongPairs[yongZhi] === dayZhi;
}

// 伏神飞神: 用神不上卦时, 从本宫首卦找伏神
function _fuShen(yongshen, zg) {
  // 用神未上卦, 从本宫纯卦(八纯卦)中找伏神
  const gongIdx = zg.gong;
  const gongWx = _GUA_XIANG[gongIdx].wuxing;
  // 八纯卦的地支排列
  const gongZhis = _GONG_ZHI[gongIdx];
  const gongGan = _GONG_GAN[gongIdx];
  const gongGans = _peiTianGan(gongIdx, gongGan);
  const gongLiuqin = gongZhis.map(z => _computeLiuQin(gongWx, _zhiWuxing(z)));
  const fuIdx = gongLiuqin.indexOf(yongshen);
  if (fuIdx < 0) return null;
  return { fuZhi: gongZhis[fuIdx], fuIdx: fuIdx, feiIdx: 0 };
}

// 三合局: 申子辰水局/亥卯未木局/寅午戌火局/巳酉丑金局
function _sanheJu(zhis) {
  const sets = [
    {zhis:['申','子','辰'], wx:'水'},
    {zhis:['亥','卯','未'], wx:'木'},
    {zhis:['寅','午','戌'], wx:'火'},
    {zhis:['巳','酉','丑'], wx:'金'}
  ];
  const results = [];
  for (const s of sets) {
    const matched = zhis.filter(z => s.zhis.includes(z));
    if (matched.length >= 2) results.push({ ju: s.zhis.join(''), wx: s.wx, matched });
  }
  return results;
}

// 六爻断卦增强: 暗动+伏神+三合局
function _liuyaoEnhance(guaData, zg, yongIdx, dayZhi, monthZhi) {
  const lines = guaData.lines || [];
  const dong = guaData.dongYao || [];
  const result = {};
  
  // 暗动判断
  result.anDong = [];
  for (let i = 0; i < 6; i++) {
    if (!dong.includes(i) && lines[i]) {
      const yaoZhi = zg.dizhi[i];
      const liuchongPairs = {'子':'午','丑':'未','寅':'申','卯':'酉','辰':'戌','巳':'亥'};
      if (liuchongPairs[yaoZhi] === dayZhi) {
        result.anDong.push(i);
      }
    }
  }
  
  // 伏神飞神 (用神不上卦时)
  result.fuShen = null;
  if (yongIdx < 0) {
    const fs = _fuShen(guaData.yongshen || '官鬼', zg);
    if (fs) {
      result.fuShen = fs;
      // 伏神出现条件: 飞神发动或空亡
      const feiZhi = zg.dizhi[fs.feiIdx];
      result.fuShenAppear = dong.includes(fs.feiIdx) || _getXunKongZhi(
        (() => {
          if (!guaData.dayGanZhi) return 0;
          const gi = _STEMS.indexOf(guaData.dayGanZhi[0]);
          const zi = _BRANCHES.indexOf(guaData.dayGanZhi[1]);
          for (let i = 0; i < 60; i++) { if (i%10===gi && i%12===zi) return i; }
          return 0;
        })()
      ).includes(feiZhi);
    }
  }
  
  // 三合局
  const allZhis = zg.dizhi;
  result.sanhe = _sanheJu(allZhis);
  
  // 进神/退神 (动爻化进化退)
  result.jinTui = [];
  if (guaData.bianGua && guaData.bianGua.lines) {
    const bianLines = guaData.bianGua.lines;
    for (const idx of dong) {
      const oldZhi = zg.dizhi[idx];
      // 需要变卦的纳甲信息
      const bianZg = liuyaoZhuangGua({benGua: guaData.bianGua, dayGanZhi: guaData.dayGanZhi}, guaData.dayGanZhi);
      const newZhi = bianZg.dizhi[idx];
      if (newZhi) {
        // 进神: 化进(同类前进) 判断: 化旺
        const oldWx = _zhiWuxing(oldZhi);
        const newWx = _zhiWuxing(newZhi);
        if (_wxSheng(oldWx, newWx) || oldWx === newWx) result.jinTui.push({idx, type: '进神', from: oldZhi, to: newZhi});
        else if (_wxKe(newWx, oldWx) || _wxKe(oldWx, newWx)) result.jinTui.push({idx, type: '退神', from: oldZhi, to: newZhi});
      }
    }
  }
  
  return result;
}

const _ZW_GONGS = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','仆役','官禄','田宅','福德','父母'];

function ziweiPaiPan(birthYear, birthMonth, birthDay, birthHour, sex) {
  const hourIdx = Math.floor((birthHour + 1) / 2) % 12; // 时辰索引: 子=0,丑=1...亥=11
  const yinIdx = 2;
  let mingIdx = _qyMod(yinIdx + (birthMonth-1) - hourIdx, 12);
  let shenIdx = _qyMod(yinIdx + (birthMonth-1) + hourIdx, 12);
  const gongMap = {};
  for (let i=0;i<12;i++) {
    gongMap[_ZW_GONGS[i]] = _qyMod(mingIdx - i, 12);
  }
  // 定局: 用命宫干支的纳音五行
  const yearGanIdx = _qyMod(birthYear - 4, 10);
  // 命宫天干: 五虎遁（年干起正月寅）
  const mingGanIdx = _qyMod(yearGanIdx + 2 + mingIdx - 2, 10); // 命宫天干: 年干+2+命宫地支偏移
  // 更精确: 月柱天干由年干和月支决定，命宫天干同月柱天干推法
  const wuhuStart = {0:0, 5:2, 1:2, 6:4, 2:4, 7:6, 3:6, 8:8, 4:8, 9:0}; // 丙寅起
  // 五虎遁: 甲己起丙寅, 乙庚起戊寅, 丙辛起庚寅, 丁壬起壬寅, 戊癸起甲寅
  const wuhu = {0:2, 5:2, 1:4, 6:4, 2:6, 7:6, 3:8, 8:8, 4:0, 9:0};
  const tigerStartGan = wuhu[yearGanIdx] || 2;
  const mingGan = _qyMod(tigerStartGan + mingIdx - 2, 10); // 寅=2, 从寅起数到命宫地支
  const ju = _ziweiJu(mingGan, mingIdx);
  // 安紫微: 查表法
  const ziweiPos = _anZiwei(ju, birthDay);
  // 安天府: 天府 = 紫微以寅申线对称的位置
  const tianfuPos = (4 - ziweiPos + 12) % 12;
  const stars = Array(12).fill(null).map(()=>[]);
  // 紫微系星曜（逆行）
  const ziweiXi = [
    {name:'紫微', offset:0},
    {name:'天机', offset:-1},
    {name:'太阳', offset:-3},
    {name:'武曲', offset:-4},
    {name:'天同', offset:-5},
    {name:'廉贞', offset:-8},
  ];
  for (const s of ziweiXi) {
    const pos = _qyMod(ziweiPos + s.offset, 12);
    stars[pos].push(s.name);
  }
  // 天府系星曜（顺行）
  const tianfuXi = [
    {name:'天府', offset:0},
    {name:'太阴', offset:1},
    {name:'贪狼', offset:2},
    {name:'巨门', offset:3},
    {name:'天相', offset:4},
    {name:'天梁', offset:5},
    {name:'七杀', offset:6},
    {name:'破军', offset:10},
  ];
  for (const s of tianfuXi) {
    const pos = _qyMod(tianfuPos + s.offset, 12);
    stars[pos].push(s.name);
  }
  const sihua = _sihuaByYearGan(_STEMS[yearGanIdx]);
  
  // 辅星排布
  // 左辅: 正月从辰(4)起顺行
  const zuofuPos = _qyMod(4 + birthMonth - 1, 12);
  stars[zuofuPos].push('左辅');
  // 右弼: 正月从戌(10)起逆行
  const youbiPos = _qyMod(10 - (birthMonth - 1), 12);
  stars[youbiPos].push('右弼');
  // 文昌: 子时从戌(10)起逆行
  const wenchangPos = _qyMod(10 - hourIdx, 12);
  stars[wenchangPos].push('文昌');
  // 文曲: 子时从辰(4)起顺行
  const wenquPos = _qyMod(4 + hourIdx, 12);
  stars[wenquPos].push('文曲');
  
  // 煞星排布
  // 天魁(昼贵): 按日干
  const dayJzIdx = _getDayGzIdx(birthYear, birthMonth, birthDay);
  const dayGanIdx = dayJzIdx % 10;
  const tiankuiMap = {0:1,4:1,6:1,1:0,5:0,2:11,3:11,8:5,9:5,7:6};
  const tianyueMap = {0:7,4:7,6:7,1:8,5:8,2:9,3:9,8:3,9:3,7:2};
  const tkPos = tiankuiMap[dayGanIdx];
  const tyPos = tianyueMap[dayGanIdx];
  if (tkPos !== undefined) stars[tkPos].push('天魁');
  if (tyPos !== undefined) stars[tyPos].push('天钺');
  
  // 擎羊/陀罗: 年干禄前/后一位
  const luPos = {0:2,1:3,2:5,3:6,4:5,5:6,6:8,7:9,8:11,9:0}; // 禄位
  const lu = luPos[yearGanIdx];
  const qingyangPos = _qyMod(lu + 1, 12);
  const tuoluoPos = _qyMod(lu - 1, 12);
  stars[qingyangPos].push('擎羊');
  stars[tuoluoPos].push('陀罗');
  
  // 地空/地劫: 子时从亥(11)起, 空逆劫顺
  const dikongPos = _qyMod(11 - hourIdx, 12);
  const dijiePos = _qyMod(11 + hourIdx, 12);
  stars[dikongPos].push('地空');
  stars[dijiePos].push('地劫');
  
  // 火星/铃星: 年支三合局+时支
  const yearZhiIdx = _qyMod(birthYear - 4, 12);
  const sanhe = yearZhiIdx % 4; // 0=申子辰, 1=巳酉丑, 2=寅午戌, 3=亥卯未
  const huoStarts = {0:3, 1:3, 2:1, 3:9}; // 火星起始
  const lingStarts = {0:1, 1:1, 2:3, 3:10}; // 铃星起始
  const huoxingPos = _qyMod(huoStarts[sanhe] + hourIdx, 12);
  const lingxingPos = _qyMod(lingStarts[sanhe] + hourIdx, 12);
  stars[huoxingPos].push('火星');
  stars[lingxingPos].push('铃星');
  
  // —— 补充辅星 ——
  // 天马: 按年支三合局查（《紫微斗数全书》「天马星」）
  // 寅午戌→申(8), 申子辰→寅(2), 巳酉丑→亥(11), 亥卯未→巳(5)
  const tianmaMap = {0:8, 2:2, 1:11, 3:5}; // sanhe索引: 0=申子辰,1=巳酉丑,2=寅午戌,3=亥卯未
  const tianmaPos = tianmaMap[sanhe];
  if (tianmaPos !== undefined) stars[tianmaPos].push('天马');
  
  // 解神: 按月支查（《紫微斗数全书》「解神星」）
  // 正月戌、二月戌、三月丑、四月丑、五月辰、六月辰、七月未、八月未、九月戌、十月戌、十一月丑、十二月丑
  const jieshenMonthMap = [10,10,1,1,4,4,7,7,10,10,1,1]; // 0-based宫位索引
  const jieshenPos = jieshenMonthMap[birthMonth - 1] !== undefined ? jieshenMonthMap[birthMonth - 1] : 10;
  stars[jieshenPos].push('解神');
  
  // 天刑: 按日干查（《紫微斗数全书》「天刑星」）
  // 甲→酉(9)、乙→戌(10)、丙→亥(11)、丁→子(0)、戊→丑(1)、己→寅(2)、庚→卯(3)、辛→辰(4)、壬→巳(5)、癸→午(6)
  const tianxingMap = {0:9, 1:10, 2:11, 3:0, 4:1, 5:2, 6:3, 7:4, 8:5, 9:6};
  const tianxingPos = tianxingMap[dayGanIdx];
  if (tianxingPos !== undefined) stars[tianxingPos].push('天刑');
  
  // 红鸾天喜: 按年支查（《紫微斗数全书》「红鸾星」「天喜星」）
  // 红鸾: 从卯(3)起，逆数年支
  // 天喜: 红鸾对宫
  const hongluanPos = _qyMod(3 - yearZhiIdx, 12);
  const tianxiPos = _qyMod(hongluanPos + 6, 12);
  stars[hongluanPos].push('红鸾');
  stars[tianxiPos].push('天喜');
  
  return {
    birthYear, birthMonth, birthDay, birthHour, sex,
    yearStem: _STEMS[yearGanIdx],
    mingZhi: _BRANCHES[mingIdx], shenZhi: _BRANCHES[shenIdx],
    mingGanZhi: _STEMS[mingGan] + _BRANCHES[mingIdx],
    ju, gongMap, stars, sihua, ziweiPos, tianfuPos,
    auxStars: { zuofu: zuofuPos, youbi: youbiPos, wenchang: wenchangPos, wenqu: wenquPos,
                tiankui: tkPos, tianyue: tyPos, qingyang: qingyangPos, tuoluo: tuoluoPos,
                dikong: dikongPos, dijie: dijiePos, huoxing: huoxingPos, lingxing: lingxingPos,
                tianma: tianmaPos, jieshen: jieshenPos, tianxing: tianxingPos,
                hongluan: hongluanPos, tianxi: tianxiPos }
  };
}

function _getDayGzIdx(year, month, day) {
  const baseDate = new Date(1900, 0, 1);
  const dayDiff = Math.floor((new Date(year, month-1, day) - baseDate) / 86400000);
  return ((dayDiff % 60) + 60) % 60;
}

const _ZW_NAYIN_PAIRS = ["金","火","木","土","金","火","水","土","金","木","水","土","火","木","水","金","火","木","土","金","火","水","土","金","木","水","土","火","木","水"];
const _ZW_JU_MAP = {"水":2,"木":3,"金":4,"土":5,"火":6};

function _ziweiJu(mingGanIdx, mingZhiIdx) {
  // 根据命宫天干地支的纳音五行定局数
  // 六十甲子: jiazi_idx where ganIdx%10==mingGanIdx and zhiIdx%12==mingZhiIdx
  let jiaziIdx = -1;
  for (let i=0;i<60;i++) {
    if (i%10===mingGanIdx%10 && i%12===mingZhiIdx%12) { jiaziIdx=i; break; }
  }
  if (jiaziIdx < 0) return 2;
  const pairIdx = Math.floor(jiaziIdx / 2);
  const nayin = _ZW_NAYIN_PAIRS[pairIdx];
  return _ZW_JU_MAP[nayin] || 2;
}

const _ZW_POS_TABLE = {
  2: [1,2,2,3,3,4,5,5,6,6,7,8,8,9,9,10,11,11,12,12,1,2,2,3,3,4,5,5,6,6],
  3: [2,3,4,4,5,6,6,7,8,8,9,10,10,11,12,12,1,2,2,3,4,4,5,6,6,7,8,8,9,10],
  4: [3,4,5,6,6,7,8,9,9,10,11,12,12,1,2,3,3,4,5,6,6,7,8,9,9,10,11,12,12,1],
  5: [4,5,6,7,8,8,9,10,11,12,12,1,2,3,4,4,5,6,7,8,8,9,10,11,12,12,1,2,3,4],
  6: [5,6,7,8,9,10,11,12,12,1,2,3,4,4,5,6,7,8,9,10,11,12,12,1,2,3,4,4,5,6]
};

function _anZiwei(ju, day) {
  // 标准查表法安紫微星, 返回0-11的宫位索引
  const table = _ZW_POS_TABLE[ju];
  if (!table || day < 1 || day > 30) return 0;
  return table[day - 1] - 1; // 1-based转0-based (子=0)
}

function _sihuaByYearGan(gan) {
  const map = {
    '甲':{lu:'廉贞',quan:'破军',ke:'武曲',ji:'太阳'},
    '乙':{lu:'天机',quan:'天梁',ke:'紫微',ji:'太阴'},
    '丙':{lu:'天同',quan:'天机',ke:'文昌',ji:'廉贞'},
    '丁':{lu:'太阴',quan:'天同',ke:'天机',ji:'巨门'},
    '戊':{lu:'贪狼',quan:'太阴',ke:'右弼',ji:'天机'},
    '己':{lu:'武曲',quan:'贪狼',ke:'天梁',ji:'文曲'},
    '庚':{lu:'太阳',quan:'武曲',ke:'太阴',ji:'天同'},
    '辛':{lu:'巨门',quan:'太阳',ke:'文曲',ji:'文昌'},
    '壬':{lu:'天梁',quan:'紫微',ke:'左辅',ji:'武曲'},
    '癸':{lu:'破军',quan:'巨门',ke:'太阴',ji:'贪狼'}
  };
  return map[gan] || map['甲'];
}

function ziweiAnalysis(panData) {
  const mingPos = panData.gongMap['命宫'];
  const mingStars = panData.stars[mingPos] || [];
  const starsStr = mingStars.join('、') || '无主星';
  
  // 三方四正: 命宫+对宫(迁移)+财帛+官禄
  const opposites = {0:6,1:7,2:8,3:9,4:10,5:11,6:0,7:1,8:2,9:3,10:4,11:5}; // 对宫
  const sanfangPos = opposites[mingPos]; // 迁移宫
  // 财帛宫 = 命宫+4, 官禄宫 = 命宫+5 (顺时针)
  const caiweiPos = (mingPos + 4) % 12;
  const guanluPos = (mingPos + 5) % 12;
  const sanfangStars = []
    .concat(panData.stars[sanfangPos] || [])
    .concat(panData.stars[caiweiPos] || [])
    .concat(panData.stars[guanluPos] || []);
  
  // 格局判断
  let geju = '普通命局';
  const allStars = mingStars.concat(sanfangStars);
  if (mingStars.includes('紫微')) geju = '紫微坐命，贵气稳重';
  else if (mingStars.includes('天府')) geju = '天府坐命，忠厚富足';
  else if (mingStars.includes('太阳')) geju = '太阳坐命，光明磊落';
  else if (mingStars.includes('武曲')) geju = '武曲坐命，刚毅果断';
  else if (mingStars.includes('天同')) geju = '天同坐命，温和有福';
  else if (mingStars.includes('七杀')) geju = '七杀坐命，果敢有魄力';
  else if (mingStars.includes('破军')) geju = '破军坐命，开创力强';
  else if (mingStars.includes('贪狼')) geju = '贪狼坐命，多才多艺';
  else if (mingStars.includes('天机')) geju = '天机坐命，聪明多谋';
  else if (mingStars.includes('太阴')) geju = '太阴坐命，温柔细腻';
  else if (mingStars.includes('巨门')) geju = '巨门坐命，口才出众';
  else if (mingStars.includes('天相')) geju = '天相坐命，稳重正直';
  else if (mingStars.includes('天梁')) geju = '天梁坐命，老成持重';
  else if (mingStars.includes('廉贞')) geju = '廉贞坐命，能文能武';
  
  // 特殊格局检测
  const starSet = new Set(allStars);
  if (starSet.has('紫微') && starSet.has('天府')) geju += ' · 紫府同宫格';
  if (starSet.has('太阳') && starSet.has('太阴')) geju += ' · 日月并明格';
  if (starSet.has('七杀') && starSet.has('破军') && starSet.has('贪狼')) geju += ' · 杀破狼格';
  if (starSet.has('天机') && starSet.has('太阴') && starSet.has('天同') && starSet.has('天梁')) geju += ' · 机月同梁格';
  if (mingStars.includes('紫微') && mingStars.includes('天府') && mingPos === 4) geju = '紫府朝垣格';
  if ((mingStars.includes('太阳') && mingPos === 4) || (mingStars.includes('太阴') && mingPos === 10)) geju += ' · 庙旺格';
  
  // —— 扩展经典格局判断 ——
  // 以下格局出自《紫微斗数全书》《太微赋》等经典
  const gejuList = [];
  
  // 紫府朝垣: 紫微天府在三方四正会照命宫
  // 《紫微斗数全书》:「紫府朝垣，食禄万钟」
  if (!mingStars.includes('紫微') && !mingStars.includes('天府')) {
    if (starSet.has('紫微') && starSet.has('天府')) {
      gejuList.push({name:'紫府朝垣',text:'紫微天府三方四正会照命宫，主富贵双全，食禄万钟'});
    }
  }
  
  // 辅弼夹命: 左辅右弼在命宫前后两宫
  // 《紫微斗数全书》:「左右夹命，终身福厚」
  const prevPos = (mingPos - 1 + 12) % 12;
  const nextPos = (mingPos + 1) % 12;
  const prevStars = panData.stars[prevPos] || [];
  const nextStars = panData.stars[nextPos] || [];
  const hasZuoFu = (arr) => arr.includes('左辅');
  const hasYouBi = (arr) => arr.includes('右弼');
  if ((hasZuoFu(prevStars) && hasYouBi(nextStars)) || (hasYouBi(prevStars) && hasZuoFu(nextStars))) {
    gejuList.push({name:'辅弼夹命',text:'左辅右弼夹命宫，终身福厚，多贵人相助'});
  }
  
  // 日月并明: 太阳太阴在庙旺同宫或对照
  // 《太微赋》:「日月并明，佐九重于尧殿」
  const sunPos = panData.stars.findIndex(s => s.includes('太阳'));
  const moonPos = panData.stars.findIndex(s => s.includes('太阴'));
  if (sunPos >= 0 && moonPos >= 0) {
    const isOpposite = (Math.abs(sunPos - moonPos) === 6);
    const isSameGong = (sunPos === moonPos);
    // 庙旺: 太阳在卯辰巳午(3,4,5,6), 太阴在酉戌亥子(9,10,11,0)
    const sunWang = [3,4,5,6].includes(sunPos);
    const moonWang = [9,10,11,0].includes(moonPos);
    if ((isSameGong || isOpposite) && sunWang && moonWang) {
      gejuList.push({name:'日月并明',text:'太阳太阴庙旺会照，佐九重于尧殿，才华出众，名扬四海'});
    }
  }
  
  // 七杀朝斗: 七杀在寅申子午守命
  // 《紫微斗数全书》:「七杀朝斗，爵禄荣昌」
  if (mingStars.includes('七杀') && [2,8,0,6].includes(mingPos)) {
    gejuList.push({name:'七杀朝斗',text:'七杀在寅申子午守命，爵禄荣昌，威权显赫'});
  }
  
  // 府相朝垣: 天府天相在三方四正会照
  // 《紫微斗数全书》:「府相朝垣，富贵堪期」
  if (starSet.has('天府') && starSet.has('天相') && !mingStars.includes('天府')) {
    gejuList.push({name:'府相朝垣',text:'天府天相三方四正会照命宫，富贵堪期，一生安稳'});
  }
  
  // 将格局列表追加到geju
  for (const g of gejuList) {
    geju += ' · ' + g.name;
  }
  const gejuDetail = gejuList.map(g => g.name + '：' + g.text).join('；');
  
  // 四化落宫
  const sihua = panData.sihua;
  const sihuaDetail = [];
  // 找到化禄星所在宫位
  for (let i = 0; i < 12; i++) {
    const sList = panData.stars[i] || [];
    if (sList.includes(sihua.lu)) {
      const gongName = _getGongName(i, panData.gongMap);
      sihuaDetail.push('化禄('+sihua.lu+')入'+gongName);
    }
    if (sList.includes(sihua.quan)) {
      const gongName = _getGongName(i, panData.gongMap);
      sihuaDetail.push('化权('+sihua.quan+')入'+gongName);
    }
    if (sList.includes(sihua.ke)) {
      const gongName = _getGongName(i, panData.gongMap);
      sihuaDetail.push('化科('+sihua.ke+')入'+gongName);
    }
    if (sList.includes(sihua.ji)) {
      const gongName = _getGongName(i, panData.gongMap);
      sihuaDetail.push('化忌('+sihua.ji+')入'+gongName);
    }
  }
  
  // 大限计算 (每10年一个大限, 从命宫起顺行)
  // 起运年龄 = 局数 (水2木3金4土5火6)
  const daxianStart = panData.ju || 2;
  const daxianList = [];
  const gongNames = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','奴仆','官禄','田宅','福德','父母'];
  // 阳男阴女顺行, 阴男阳女逆行
  const yearStem = panData.yearStem || '';
  const isYangStem = ['甲','丙','戊','庚','壬'].includes(yearStem);
  const isMale = panData.sex === 'male';
  const isForward = (isYangStem && isMale) || (!isYangStem && !isMale);
  for (let i = 0; i < 12; i++) {
    const pos = isForward ? (mingPos + i) % 12 : (mingPos - i + 12) % 12;
    const startAge = daxianStart + i * 10;
    const endAge = startAge + 9;
    const stars = panData.stars[pos] || [];
    daxianList.push({
      gong: gongNames[i],
      pos: pos,
      ageRange: startAge + '-' + endAge + '岁',
      stars: stars.join('、') || '无主星',
      sihua: stars.filter(s => [sihua.lu, sihua.quan, sihua.ke, sihua.ji].includes(s))
        .map(s => s === sihua.lu ? '化禄' : s === sihua.quan ? '化权' : s === sihua.ke ? '化科' : '化忌')
    });
  }
  
  // 当前大限 (假设用户当前年龄)
  const currentYear = new Date().getFullYear();
  const age = currentYear - panData.birthYear;
  const currentDaxian = daxianList.find(d => {
    const [s, e] = d.ageRange.split('-').map(n => parseInt(n));
    return age >= s && age <= e;
  }) || daxianList[0];
  
  // 庙旺平陷评估
  const starStrength = _evalStarStrength(panData.stars[mingPos] || [], mingPos);
  
  return {
    geju, 
    mingStars: starsStr,
    starStrength: starStrength,
    sanfang: '三方四正: ' + (panData.stars[sanfangPos]||[]).join('、') + ' / ' + 
             (panData.stars[caiweiPos]||[]).join('、') + ' / ' + (panData.stars[guanluPos]||[]).join('、'),
    sihuaText: '化禄：'+sihua.lu+'、化权：'+sihua.quan+'、化科：'+sihua.ke+'、化忌：'+sihua.ji,
    sihuaDetail: sihuaDetail.join('；'),
    gejuDetail: gejuDetail || '',
    daxian: daxianList,
    currentDaxian: currentDaxian ? currentDaxian.gong + '(' + currentDaxian.ageRange + ') ' + currentDaxian.stars : '未确定',
    overview: (panData.sex==='male'?'男命':'女命')+'，'+panData.mingZhi+'命宫，'+panData.ju+'局。命宫主星: '+starsStr+'。三方四正会照: '+sanfangStars.join('、')+'。',
    advice: _ziweiAdvice(geju, sihuaDetail, currentDaxian)
  };
}

// 庙旺平陷评估
function _evalStarStrength(stars, gongPos) {
  // 12宫位索引: 0=子...11=亥
  // 14主星在12宫的庙旺强度表 (3=庙, 2=旺, 1=平, 0=陷)
  const strengthTable = {
    '紫微': [2,2,3,2,1,1,2,2,3,2,1,1],
    '天机': [1,1,2,3,2,1,1,1,2,3,2,1],
    '太阳': [0,1,1,2,3,3,2,1,1,2,3,3],
    '武曲': [2,1,1,1,2,3,2,1,1,1,2,3],
    '天同': [3,2,1,1,1,2,3,2,1,1,1,2],
    '廉贞': [1,1,1,2,3,2,1,1,1,2,3,2],
    '天府': [3,3,2,1,1,1,2,3,3,2,1,1],
    '太阴': [3,2,1,1,1,0,1,2,3,2,1,1],
    '贪狼': [1,2,3,2,1,1,1,2,3,2,1,1],
    '巨门': [1,1,1,2,3,2,1,1,1,2,3,2],
    '天相': [2,3,2,1,1,1,2,3,2,1,1,1],
    '天梁': [1,1,2,3,2,1,1,1,2,3,2,1],
    '七杀': [2,1,1,1,2,3,2,1,1,1,2,3],
    '破军': [1,1,1,2,3,2,1,1,1,2,3,2]
  };
  const labels = ['庙','旺','平','陷'];
  const result = [];
  for (const star of stars) {
    const table = strengthTable[star];
    if (!table) continue;
    const s = table[gongPos] || 1;
    result.push({ star, strength: s, label: labels[3-s] });
  }
  // 四化叠加效应
  const sihuaEffect = {
    '化禄': '增益财禄', '化权': '增强权势', '化科': '声名提升', '化忌': '波折阻碍'
  };
  return { stars: result, summary: result.map(s => s.star + '(' + s.label + ')').join('、') };
}

function _getGongName(pos, gongMap) {
  for (const name in gongMap) {
    if (gongMap[name] === pos) return name;
  }
  return _BRANCHES[pos]+'宫';
}

function _ziweiAdvice(geju, sihuaDetail, currentDaxian) {
  let tips = [];
  if (geju.includes('紫微')) tips.push('紫微入命，领导力强，注意勿过于独断。');
  if (geju.includes('天府')) tips.push('天府入命，理财能力强，宜稳健发展。');
  if (geju.includes('七杀') || geju.includes('破军')) tips.push('杀破狼格，宜从事开创性工作。');
  if (geju.includes('机月同梁')) tips.push('机月同梁格，适合文职或企划工作。');
  if (sihuaDetail.some(s => s.includes('化忌入命宫'))) tips.push('化忌入命，早年多波折，后渐入佳境。');
  if (sihuaDetail.some(s => s.includes('化禄入财帛'))) tips.push('化禄入财帛，财运亨通。');
  if (sihuaDetail.some(s => s.includes('化权入官禄'))) tips.push('化权入官禄，事业有成。');
  if (currentDaxian && currentDaxian.stars.includes('化禄')) tips.push('当前大限化禄照会，运势顺遂。');
  if (currentDaxian && currentDaxian.stars.includes('化忌')) tips.push('当前大限化忌照会，宜低调谨慎。');
  if (tips.length === 0) tips.push('紫微斗数重在星曜组合与宫位互动，建议结合大限流年综合论断。');
  return tips.join(' ');
}

// ========== 3. 奇门遁甲 ==========

const _QM_MEN = ['休','生','伤','杜','景','死','惊','开'];
const _QM_STARS = ['蓬','任','冲','辅','英','芮','柱','心','禽'];
const _QM_SHEN = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
const _QY_JIANG = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];

function qimenPaiPan(year, month, day, hour, juType) {
  // 时辰索引
  const hourIdx = Math.floor((hour + 1) / 2) % 12; // 子=0,丑=1...亥=11
  // 日干支索引: 用公历日期估算
  const baseDate = new Date(1900, 0, 1); // 1900-01-01 = 甲子日
  const dayDiff = Math.floor((new Date(year, month-1, day) - baseDate) / 86400000);
  const dayGzIdx = ((dayDiff % 60) + 60) % 60; // 日干支序数 0-59
  const dayGanIdx = dayGzIdx % 10;
  const dayZhiIdx = dayGzIdx % 12;
  // 时干支
  const hourGzIdx = ((dayGanIdx * 12 + hourIdx) % 60 + 60) % 60; // 五子遁
  // 定遁: 冬至后阳遁, 夏至后阴遁
  let dun = juType;
  if (!dun || dun === 'auto') {
    // 用公历日期判断冬至/夏至
    const m = month, d = day;
    const dayOfYear = Math.floor((new Date(year, month-1, day) - new Date(year, 0, 0)) / 86400000);
    // 冬至~夏至前 = 阳遁, 夏至~冬至前 = 阴遁
    dun = (dayOfYear >= 355 || dayOfYear < 172) ? 'yang' : 'yin';
  }
  // 定局: 根据节气和日干支上中下元
  // 定局: 根据节气和日干支上中下元
  // 用日干支序数除以5的商+1作为元数, 再结合遁的阴阳定局
  // 更准确的方法: 根据节气确定用哪个局的表
  const ju = _qimenGetJu(year, month, day, dun, dayGzIdx);
  // 地盘: 六仪三奇按局数排列
  const dipan = _qimenDiPan(dun, ju);
  // 天盘: 按时辰转动
  const tianpan = _qimenTianPan(dipan, hourGzIdx, ju, dun);
  // 八门
  const men = _qimenMen(dun, ju, hourGzIdx, dayGzIdx, dipan);
  // 九星: 值符跟天盘旬首位置
  const stars = _qimenStars(dun, ju, hourGzIdx, dayGzIdx, tianpan);
  // 八神: 值符跟值符星所在宫(天盘)
  const shen = _qimenShen(dun, hourGzIdx, dayGzIdx, tianpan, stars);
  return { year, month, day, hour, dun, ju, dipan, tianpan, men, stars, shen,
           dayGzIdx, hourGzIdx, hourIdx };
}

// 奇门定局表 (根据节气和元数定局)
// 阳遁: 冬至174, 小寒285, 大寒396, 立春852, 雨水963, 惊蛰174...
// 阴遁: 夏至936, 小暑825, 大暑714, 立秋258, 处暑147, 白露936...
const _QM_YANG_JU = { // 阳遁节气定局 (上元,中元,下元)
  '冬至':[1,7,4], '小寒':[2,8,5], '大寒':[3,9,6],
  '立春':[8,5,2], '雨水':[9,6,3], '惊蛰':[1,7,4],
  '春分':[3,9,6], '清明':[4,1,7], '谷雨':[5,2,8],
  '立夏':[4,1,7], '小满':[5,2,8], '芒种':[6,3,9]
};
const _QM_YIN_JU = { // 阴遁节气定局
  '夏至':[9,3,6], '小暑':[8,2,5], '大暑':[7,1,4],
  '立秋':[2,5,8], '处暑':[1,4,7], '白露':[9,3,6],
  '秋分':[7,1,4], '寒露':[6,9,3], '霜降':[5,8,2],
  '立冬':[6,9,3], '小雪':[5,8,2], '大雪':[4,7,1]
};
// 节气近似日期表 (公历, 北半球)
// ⚠️ 注意: 此为公历近似日期, 每年可能有±1~2日偏差。精确节气计算需用天文算法。
// 建议后续引入精确节气计算(如基于 VSOP87 或寿星天文历算法)以避免定局偏差。
// 当前近似日期在大多数年份不会导致上中下三元定局错误, 因为三元以5日为界, ±1~2日偏差不会跨元。
// 但在节气交接日附近可能出现定局歧义, 届时建议手动指定遁局。
// 《钦定授时通考》云:「节气以日躔为度, 非以日数为定。」天文节气方为正统。
const _JIEQI_DATES = [
  [1,6,'小寒'],[1,20,'大寒'],[2,4,'立春'],[2,19,'雨水'],
  [3,6,'惊蛰'],[3,21,'春分'],[4,5,'清明'],[4,20,'谷雨'],
  [5,6,'立夏'],[5,21,'小满'],[6,6,'芒种'],[6,21,'夏至'],
  [7,7,'小暑'],[7,23,'大暑'],[8,8,'立秋'],[8,23,'处暑'],
  [9,8,'白露'],[9,23,'秋分'],[10,8,'寒露'],[10,23,'霜降'],
  [11,7,'立冬'],[11,22,'小雪'],[12,7,'大雪'],[12,22,'冬至']
];

function _getJieqi(month, day) {
  let jq = '冬至'; // 默认
  for (const [m, d, name] of _JIEQI_DATES) {
    if (month === m && day >= d) jq = name;
    else if (month > m || (month === m && day < d)) break;
  }
  // 处理跨年
  if (month === 12 && day < 22) jq = '大雪';
  if (month === 1 && day < 6) jq = '冬至';
  return jq;
}

function _qimenGetJu(year, month, day, dun, dayGzIdx) {
  const jq = _getJieqi(month, day);
  // 定元: 日干支序数 0-59, 上元=甲子~戊辰(0-4), 中元=己巳~癸酉(5-9)...每5天一元
  const yuanIdx = Math.floor((dayGzIdx % 60) / 5); // 0=上元,1=中元,2=下元,3=上元...
  const yuan = yuanIdx % 3; // 0=上元, 1=中元, 2=下元
  const table = dun === 'yang' ? _QM_YANG_JU : _QM_YIN_JU;
  const juArr = table[jq] || (dun === 'yang' ? [1,7,4] : [9,3,6]);
  return juArr[yuan];
}

function _qimenDiPan(dun, ju) {
  // 六仪三奇: 戊己庚辛壬癸丁丙乙 (地盘固定排列顺序)
  // 阳遁顺布六仪, 逆布三奇; 阴遁逆布六仪, 顺布三奇
  // 九宫顺序 (洛书): 1坎 2坤 3震 4巽 5中 6乾 7兑 8艮 9离
  // 中宫(5宫)寄宫规则: 阳遁寄艮8宫, 阴遁寄坤2宫
  // 《奇门遁甲元灵经》云:「中五宫为太极之位, 无门无位, 阳遁寄艮, 阴遁寄坤。」
  // 《烟波钓叟歌》云:「中宫无门, 以节气定寄宫之所。」
  // 宫位顺序按洛书九宫飞布
  const gongOrder = [1,8,3,4,9,2,7,6]; // 戊起的宫位顺序(跳过中5)
  // 六仪三奇固定顺序
  const liuSan = ['戊','己','庚','辛','壬','癸','丁','丙','乙'];
  const res = {};
  // 从戊起, 按局数确定起始宫
  // 阳遁: 戊从1宫起, 顺飞九宫
  // 实际: 戊在ju宫, 然后按九宫顺序排列
  // 中宫5宫在飞布序列中保留, 但实际使用时寄宫:
  //   阳遁→艮8宫, 阴遁→坤2宫 (天禽星、中宫神将同此规则)
  const palaceSeq = dun === 'yang' 
    ? [1,2,3,4,5,6,7,8,9] // 阳遁顺飞 (5宫寄艮8)
    : [9,8,7,6,5,4,3,2,1]; // 阴遁逆飞 (5宫寄坤2)
  // 戊的起始宫位 = ju (局数对应宫位)
  // 阳遁1局: 戊在1宫, 阳遁2局: 戊在2宫...
  // 阴遁9局: 戊在9宫, 阴遁8局: 戊在8宫...
  const startPalace = ju;
  for (let i = 0; i < 9; i++) {
    const palace = (dun === 'yang') 
      ? ((startPalace - 1 + i) % 9) + 1
      : ((startPalace - 1 - i + 90) % 9) + 1;
    res[palace] = liuSan[i];
  }
  return res;
}

function _qimenTianPan(dipan, hourGzIdx, ju, dun) {
  // 天盘转动逻辑:
  // 1. 找到时辰旬首(甲子旬戊,甲戌旬己,甲申旬庚,甲午旬辛,甲辰旬壬,甲寅旬癸)
  // 2. 旬首六仪在地盘的宫位 = 值符所在宫
  // 3. 天盘 = 以值符宫为起点, 将地盘六仪三奇按九宫顺序重新排布
  //    阳遁顺飞, 阴遁逆飞
  // 旬首对应六仪
  const xunShou = Math.floor(hourGzIdx / 10) * 10; // 旬首干支序数(0,10,20,30,40,50)
  const xunYi = ['戊','己','庚','辛','壬','癸'][Math.floor(xunShou / 10) % 6];
  // 找到旬首六仪在地盘的宫位 = 值符宫
  let xunGong = 5;
  for (let p = 1; p <= 9; p++) {
    if (dipan[p] === xunYi) { xunGong = p; break; }
  }
  // 天盘排布: 以值符宫为起点, 按九宫飞布重新排列地盘六仪三奇
  // 九宫飞布顺序: 阳遁 1→2→3→4→5→6→7→8→9, 阴遁 9→8→7→6→5→4→3→2→1
  // 标准转盘法: 天盘 = 地盘整体旋转, 使值符(旬首仪)转到时辰地支宫
  // 《奇门遁甲元灵经》云:「天盘随值符转动, 以时辰地支为定位。」
  // 天盘值符仪放在时辰地支宫, 然后按飞布顺序排列地盘六仪三奇
  const res = {};
  // 构建以值符宫为起点的飞布序列
  const flySeq = [];
  for (let i = 0; i < 9; i++) {
    const palace = (dun === 'yang')
      ? ((xunGong - 1 + i) % 9) + 1
      : ((xunGong - 1 - i + 90) % 9) + 1;
    flySeq.push(palace);
  }
  // 时辰地支宫位(后天八卦): 子1 丑寅8 卯3 辰巳4 午9 未申2 酉7 戌亥6
  // 《烟波钓叟歌》云:「先须掌上排九宫, 纵横十五在其中。次将八卦论八节, 一气统三为正宗。」
  const hourZhiIdx = hourGzIdx % 12;
  const zhiGong = [1,8,8,3,4,4,9,2,2,7,6,6]; // 子丑寅卯辰巳午未申酉戌亥
  const targetGong = zhiGong[hourZhiIdx];
  // 旋转量: 从xunGong转到targetGong
  // 天盘[targetGong] = dipan[xunGong] (旬首仪转到时辰地支宫)
  // 然后按飞布顺序排列: 天盘rotateSeq[i] = 地盘flySeq[i]
  const rotateSeq = [];
  for (let i = 0; i < 9; i++) {
    const palace = (dun === 'yang')
      ? ((targetGong - 1 + i) % 9) + 1
      : ((targetGong - 1 - i + 90) % 9) + 1;
    rotateSeq.push(palace);
  }
  // 天盘: rotateSeq[i] 宫 = 地盘 flySeq[i] 宫的仪 (单次旋转变换, 无双重变换)
  for (let i = 0; i < 9; i++) {
    res[rotateSeq[i]] = dipan[flySeq[i]];
  }
  return res;
}

function _qimenMen(dun, ju, hourGzIdx, dayGzIdx, dipan) {
  // 八门排布: 休生伤杜景死惊开
  // 值使从旬首所在宫起, 随时辰递宫
  // 阳遁顺飞九宫, 阴遁逆飞九宫
  // 中宫(5宫)无门, 跳过
  const baseMen = ['休','生','伤','杜','景','死','惊','开'];
  // 旬首
  const xunShou = Math.floor(hourGzIdx / 10) * 10;
  const xunYi = ['戊','己','庚','辛','壬','癸'][Math.floor(xunShou / 10) % 6];
  // 找旬首宫
  let xunGong = 5;
  for (let p = 1; p <= 9; p++) {
    if (dipan[p] === xunYi) { xunGong = p; break; }
  }
  // 原始门宫位: 休1 生8 伤3 杜4 景9 死2 惊7 开6
  const menFixedGong = {1:'休',8:'生',3:'伤',4:'杜',9:'景',2:'死',7:'惊',6:'开'};
  // 值使 = 旬首宫对应的原始门
  const zhiShi = menFixedGong[xunGong] || '休';
  const zhiShiIdx = baseMen.indexOf(zhiShi);
  // 时辰在旬中的序数 (0-9)
  const hourInXun = hourGzIdx - xunShou;
  // 九宫飞布(跳过中宫5)
  const gongFly = dun === 'yang'
    ? [1,2,3,4,6,7,8,9]
    : [9,8,7,6,4,3,2,1];
  // 找到xunGong在gongFly中的位置
  let startPos = 0;
  for (let i = 0; i < gongFly.length; i++) {
    if (gongFly[i] === xunGong) { startPos = i; break; }
  }
  // 值使从旬首宫起, 走hourInXun步
  // 从值使宫开始, 按八门顺序排列
  const res = {};
  for (let i = 0; i < 8; i++) {
    const palace = gongFly[(startPos + hourInXun + i) % gongFly.length];
    res[palace] = baseMen[(zhiShiIdx + i) % 8];
  }
  return res;
}

function _qimenStars(dun, ju, hourGzIdx, dayGzIdx, tianpan) {
  // 九星排布: 天蓬、天芮、天冲、天辅、天禽、天心、天柱、天任、天英
  // 原始宫位: 蓬1 芮2 冲3 辅4 禽5 心6 柱7 任8 英9
  // 值符跟旬首所在宫(天盘旬首位置)
  // 其余九星按九宫顺序排列, 阳遁顺飞阴遁逆飞
  const baseStars = ['蓬','芮','冲','辅','禽','心','柱','任','英'];
  // 旬首
  const xunShou = Math.floor(hourGzIdx / 10) * 10;
  const xunYi = ['戊','己','庚','辛','壬','癸'][Math.floor(xunShou / 10) % 6];
  // 找旬首宫(在天盘上的位置)
  let xunGong = 5;
  for (let p = 1; p <= 9; p++) {
    if (tianpan[p] === xunYi) { xunGong = p; break; }
  }
  // 值符星 = 旬首所在宫的原始星 (宫号1-9对应baseStars索引0-8)
  const zhiFuStar = baseStars[xunGong - 1];
  const zhiFuIdx = baseStars.indexOf(zhiFuStar);
  // 九宫飞布顺序(含中宫5)
  const gongFlyFull = dun === 'yang'
    ? [1,2,3,4,5,6,7,8,9]
    : [9,8,7,6,5,4,3,2,1];
  // 找到xunGong在飞布序列中的位置
  let startPos = 0;
  for (let i = 0; i < gongFlyFull.length; i++) {
    if (gongFlyFull[i] === xunGong) { startPos = i; break; }
  }
  // 从值符星开始, 按九星顺序+九宫飞布排布
  const res = {};
  for (let i = 0; i < 9; i++) {
    const palace = gongFlyFull[(startPos + i) % 9];
    res[palace] = baseStars[(zhiFuIdx + i) % 9];
  }
  return res;
}

function _qimenShen(dun, hourGzIdx, dayGzIdx, tianpan, stars) {
  // 八神排布: 值符、螣蛇、太阴、六合、白虎、玄武、九地、九天
  // 值符跟值符星所在宫(天盘旬首位置)
  // 其余八神按九宫顺序排列, 阳遁顺飞阴遁逆飞
  // 中宫无神(中宫寄宫), 跳过5宫
  const baseShen = ['值符','螣蛇','太阴','六合','白虎','玄武','九地','九天'];
  // 旬首
  const xunShou = Math.floor(hourGzIdx / 10) * 10;
  const xunYi = ['戊','己','庚','辛','壬','癸'][Math.floor(xunShou / 10) % 6];
  // 找旬首宫(在天盘上的位置 = 值符星所在宫)
  let xunGong = 5;
  for (let p = 1; p <= 9; p++) {
    if (tianpan[p] === xunYi) { xunGong = p; break; }
  }
  // 九宫飞布(跳过中宫5)
  const gongFly = dun === 'yang'
    ? [1,2,3,4,6,7,8,9]
    : [9,8,7,6,4,3,2,1];
  // 找到xunGong在gongFly中的位置
  let startPos = 0;
  for (let i = 0; i < gongFly.length; i++) {
    if (gongFly[i] === xunGong) { startPos = i; break; }
  }
  // 从值符宫开始, 按八神顺序排列
  const res = {};
  for (let i = 0; i < 8; i++) {
    const palace = gongFly[(startPos + i) % 8];
    res[palace] = baseShen[i];
  }
  return res;
}

function qimenAnalyze(panData, question) {
  const target = {
    '财':'生门','求财':'生门','官':'开门','事业':'开门','婚':'六合','婚姻':'六合',
    '病':'天芮','疾病':'天芮','出行':'景门','考试':'天辅','诉讼':'惊门','争':'惊门',
    '盗':'玄武','贼':'玄武','失':'玄武'
  };
  let key = '开门';
  if (question) {
    for (const k in target) { if (question.includes(k)) { key = target[k]; break; } }
  }
  let palace = null;
  for (let p=1;p<=9;p++) {
    if (panData.men[p] === key || panData.stars[p] === key || panData.shen[p] === key) { palace = p; break; }
  }
  if (!palace) palace = 1;
  let men = panData.men[palace];
  let star = panData.stars[palace];
  let shen = panData.shen[palace];
  let qi = panData.tianpan[palace];
  
  // 格局判断
  const geju = [];
  // 吉格
  if (panData.dipan && panData.tianpan) {
    for (let p = 1; p <= 9; p++) {
      const dip = panData.dipan[p];
      const tip = panData.tianpan[p];
      // 伏吟: 天盘与地盘相同
      if (dip === tip) geju.push(p + '宫伏吟');
      // 青龙返首: 天盘戊加地盘戊 (天盘甲子戊加地盘甲子戊)
      if (tip === '戊' && dip === '戊') geju.push(p + '宫青龙返首(戊加戊)');
      // 飞鸟跌穴: 天盘丙奇加地盘甲子戊
      if (tip === '丙' && dip === '戊') geju.push(p + '宫飞鸟跌穴(丙加戊)');
      // 玉女守门: 天盘丁奇加地盘开门所在宫
      if (tip === '丁' && panData.men[p] === '开') geju.push(p + '宫玉女守门(丁加开门)');
      // 凶格: 庚加庚 (太白入荧/荧入太白)
      if (tip === '庚' && dip === '丙') geju.push(p + '宫太白入荧(庚加丙)');
      if (tip === '丙' && dip === '庚') geju.push(p + '宫荧入太白(丙加庚)');
      // 凶格: 戊加辛 (青龙折足)
      if (tip === '戊' && dip === '辛') geju.push(p + '宫青龙折足(戊加辛)');
      // 凶格: 辛加戊 (腾蛇夭矫)
      if (tip === '辛' && dip === '乙') geju.push(p + '宫腾蛇夭矫(辛加乙)');
      // 凶格: 癸加丁 (腾蛇夭娇)
      if (tip === '癸' && dip === '丁') geju.push(p + '宫腾蛇夭矫(癸加丁)');
      // 凶格: 丁加癸 (朱雀投江)
      if (tip === '丁' && dip === '癸') geju.push(p + '宫朱雀投江(丁加癸)');
    }
  }
  // 三诈格: 门吉星吉神吉 = 真诈; 门吉星凶神吉 = 假诈; 门凶星吉神吉 = 重诈
  const jimen = ['休','生','开'];
  const jistar = ['辅','心','任','禽'];
  const jishen = ['值符','太阴','六合','九天'];
  const xiongmen = ['死','惊','伤'];
  const xiongstar = ['芮','柱','蓬'];
  const xiongshen = ['白虎','玄武','腾蛇'];
  // 检查三诈格 (遍历所有宫)
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    const pm = panData.men[p];
    const ps = panData.stars[p];
    const ph = panData.shen[p];
    if (!pm || !ps || !ph) continue;
    if (jimen.includes(pm) && jistar.includes(ps) && jishen.includes(ph)) {
      geju.push(p + '宫真诈格(门星神俱吉)');
    } else if (jimen.includes(pm) && xiongstar.includes(ps) && jishen.includes(ph)) {
      geju.push(p + '宫假诈格(门吉星凶神吉)');
    } else if (xiongmen.includes(pm) && jistar.includes(ps) && jishen.includes(ph)) {
      geju.push(p + '宫重诈格(门凶星吉神吉)');
    }
  }
  // 五假格: 天假(丙加景门加九天), 地假(丁加杜门加九地), 人假(己加死门加太阴)
  // 神假(辛加伤门加腾蛇), 鬼假(癸加惊门加玄武)
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    const pt = panData.tianpan[p];
    const pm = panData.men[p];
    const ph = panData.shen[p];
    if (!pt || !pm || !ph) continue;
    if (pt === '丙' && pm === '景' && ph === '九天') geju.push(p + '宫天假格');
    if (pt === '丁' && pm === '杜' && ph === '九地') geju.push(p + '宫地假格');
    if (pt === '己' && pm === '死' && ph === '太阴') geju.push(p + '宫人假格');
    if (pt === '辛' && pm === '伤' && ph === '腾蛇') geju.push(p + '宫神假格');
    if (pt === '癸' && pm === '惊' && ph === '玄武') geju.push(p + '宫鬼假格');
  }
  
  let luck = '平';
  if (jimen.includes(men) && jishen.includes(shen)) luck = '吉';
  else if (xiongmen.includes(men) && xiongshen.includes(shen)) luck = '凶';
  else if (jimen.includes(men)) luck = '小吉';
  else if (xiongmen.includes(men)) luck = '小凶';
  
  // 空亡判断 (中5宫无门无神, 天禽星寄宫)
  // 《奇门遁甲元灵经》云:「中五宫为太极之位, 无门无神。阳遁寄艮8宫, 阴遁寄坤2宫。」
  // 《烟波钓叟歌》云:「中宫无门, 寄于坤艮。」此为寄宫定则。
  // 天禽星属土, 阳遁随艮8土宫, 阴遁随坤2土宫, 同气相求。
  let kongwang = false;
  if (palace === 5) {
    kongwang = true;
    // 中宫寄宫: 阳遁寄艮8宫, 阴遁寄坤2宫
    const isYangDun = panData.dun === 'yang';
    palace = isYangDun ? 8 : 2;
    luck = '平';
    // 重新取寄宫的门星神
    men = panData.men[palace] || men;
    star = panData.stars[palace] || star;
    shen = panData.shen[palace] || shen;
    qi = panData.tianpan[palace] || qi;
  }
  
  // 马星: 月支三合局第一字对冲, 此处用时支判断
  const hourZhiIdx = panData.hourIdx || (panData.hourGzIdx !== undefined ? panData.hourGzIdx % 12 : 0);
  const maPos = _qmGetMaXing(hourZhiIdx);
  const isMaXing = maPos === palace;
  
  // 五不遇时
  let wuBuYu = false;
  if (panData.dayGzIdx !== undefined && panData.hourGzIdx !== undefined) {
    wuBuYu = _qmCheckWuBuYuShi(panData.dayGzIdx % 10, panData.hourGzIdx % 10);
    if (wuBuYu) geju.push('五不遇时');
  }
  
  // 空亡宫位
  let kongWangGongs = [];
  if (panData.dayGzIdx !== undefined) {
    kongWangGongs = _qmGetKongWang(panData.dayGzIdx);
  }
  let isKongWangGong = kongWangGongs.indexOf(palace) >= 0;
  if (isKongWangGong) kongwang = true;
  
  // 日干落宫（命主状态）
  let dayGanPalace = 0, dayGanQi = '';
  if (panData.dayGzIdx !== undefined && panData.dipan) {
    let dayGan = _QM_STEMS[panData.dayGzIdx % 10];
    for (let dp = 1; dp <= 9; dp++) {
      if (panData.dipan[dp] === dayGan) { dayGanPalace = dp; dayGanQi = panData.tianpan ? (panData.tianpan[dp] || '') : ''; break; }
    }
  }
  
  // 时干落宫（事体状态）
  let hourGanPalace = 0, hourGanQi = '';
  if (panData.hourGzIdx !== undefined && panData.dipan) {
    let hourGan = _QM_STEMS[panData.hourGzIdx % 10];
    for (let hp = 1; hp <= 9; hp++) {
      if (panData.dipan[hp] === hourGan) { hourGanPalace = hp; hourGanQi = panData.tianpan ? (panData.tianpan[hp] || '') : ''; break; }
    }
  }
  
  // 值使（值使门）
  let zhiShi = panData.men ? (panData.men[palace] || '') : '';
  if (zhiShi && zhiShi.length === 1) {
    zhiShi = ({'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'}[zhiShi] || zhiShi);
  }
  
  // 调用 V2 获取完整分析
  let v2Result = getQimenReadingV2(palace, panData, question, null);
  
  let strategy = '用神在' + palace + '宫，天盘' + qi + '，门' + men + '，星' + star + '，神' + shen + '。';
  if (geju.length > 0) strategy += ' 格局: ' + geju.join('、') + '。';
  if (kongwang) strategy += ' 用神落空亡，谋事难成。';
  if (isMaXing) strategy += ' 马星临宫，事动速成。';
  if (wuBuYu) strategy += ' 五不遇时，大凶之象。';
  if (luck === '吉') strategy += ' 门星神俱吉，宜积极行动。';
  else if (luck === '凶') strategy += ' 门星神俱凶，宜静守待变。';
  if (dayGanPalace > 0) strategy += ' 命主(日干)落' + dayGanPalace + '宫。';
  if (hourGanPalace > 0) strategy += ' 事体(时干)落' + hourGanPalace + '宫。';
  
  return {
    question, yongShen: key, palace, men, star, shen, qi, 
    luck, geju, kongwang: kongwang,
    advice: luck==='吉' ? '奇门格局大吉，可积极推进。' + (v2Result.huajie || '') : luck==='小吉' ? '格局尚可，谨慎推进。' + (v2Result.huajie || '') : luck==='凶' ? '奇门格局不利，宜保守退守。' + (v2Result.huajie || '') : '吉凶参半，需因势利导。' + (v2Result.huajie || ''),
    strategy,
    // 增强项
    wuBuYu: wuBuYu,
    dayGanPalace: dayGanPalace,
    dayGanQi: dayGanQi,
    hourGanPalace: hourGanPalace,
    hourGanQi: hourGanQi,
    zhiShi: zhiShi,
    maXing: maPos,
    isMaXing: isMaXing,
    kongWangGongs: kongWangGongs,
    huajie: v2Result.huajie || '',
    mascot: v2Result.mascot || '',
    sihai: v2Result.sihai || '',
    dimensions: v2Result.dimensions || {},
    detail: v2Result.detail || '',
    gejuText: v2Result.geju || ''
  };
}

// ========== 4. 梅花易数 ==========

function meihuaQiGua(method, params) {
  let upperNum=0, lowerNum=0, dongNum=0;
  const now = new Date();
  if (method === 'time') {
    const p = params || {};
    upperNum = (p.year||now.getFullYear()) + (p.month||now.getMonth()+1) + (p.day||now.getDate());
    lowerNum = upperNum + (p.hour||now.getHours());
    dongNum = lowerNum;
  } else if (method === 'number') {
    const p = params || {};
    upperNum = p.n1 || 1; lowerNum = p.n2 || 1; dongNum = p.n3 || (upperNum+lowerNum);
  } else if (method === 'char') {
    const strokes = _chineseStrokes((params && params.char) || '易');
    upperNum = strokes[0] || 1; lowerNum = strokes[1] || 1; dongNum = strokes.reduce(function(a,b){return a+b;},0);
  } else if (method === 'sound') {
    const p = params || {};
    upperNum = p.count || 1; lowerNum = p.count2 || (now.getHours()+1); dongNum = p.count3 || (upperNum+lowerNum);
  } else if (method === 'direction') {
    const p = params || {};
    upperNum = p.directionNum || 1; lowerNum = now.getHours() + 1; dongNum = upperNum + lowerNum;
  } else if (method === 'random') {
    // 心动起卦: 以用户点击时刻的毫秒时间戳做确定性种子
    // 《梅花易数·邵雍》云:「心动即占, 不假思虑, 应机而发。」
    // 不使用 Math.random, 以时间戳为种子确保结果可复现
    const seed = now.getTime();
    upperNum = (seed % 999) + 1;
    lowerNum = (Math.floor(seed / 999) % 999) + 1;
    dongNum = (Math.floor(seed / 998001) % 999) + 1;
  }
  upperNum = Math.max(1, upperNum); lowerNum = Math.max(1, lowerNum); dongNum = Math.max(1, dongNum);
  const upperGua = _getGuaFromNum(upperNum);
  const lowerGua = _getGuaFromNum(lowerNum);
  const dongYao = _qyMod(dongNum, 6);
  const benLines = _buildLines(lowerGua, upperGua);
  const bianLines = benLines.slice();
  bianLines[dongYao] = {line: benLines[dongYao].line==='阳'?'阴':'阳', dong:false};
  const huLowerCode = (benLines[1].line==='阳'?'1':'0') + (benLines[2].line==='阳'?'1':'0') + (benLines[3].line==='阳'?'1':'0');
  const huUpperCode = (benLines[2].line==='阳'?'1':'0') + (benLines[3].line==='阳'?'1':'0') + (benLines[4].line==='阳'?'1':'0');
  const huLower = Object.keys(_GUA_XIANG).find(function(k){return _GUA_XIANG[k].code===huLowerCode;});
  const huUpper = Object.keys(_GUA_XIANG).find(function(k){return _GUA_XIANG[k].code===huUpperCode;});
  return {
    method, upperGua, lowerGua, dongYao,
    benGua: {upper:upperGua, lower:lowerGua, idx: _guaIndexFromParts(lowerGua, upperGua)},
    bianGua: _linesToGua(bianLines),
    huGua: {upper: parseInt(huUpper)||0, lower: parseInt(huLower)||0},
    lines: benLines, bianLines: bianLines
  };
}

function meihuaAnalyze(guaData, question) {
  const dong = guaData.dongYao;
  const isTiUpper = (dong >= 3);
  const ti = isTiUpper ? guaData.benGua.upper : guaData.benGua.lower;
  const yong = isTiUpper ? guaData.benGua.lower : guaData.benGua.upper;
  const tiWx = _GUA_XIANG[ti].wuxing;
  const yongWx = _GUA_XIANG[yong].wuxing;
  const relation = _wuxingRelationTiYong(tiWx, yongWx);
  let result = '';
  if (relation === '生我') result = '用生体，事吉，得外力相助。';
  else if (relation === '我生') result = '体生用，事耗，付出多。';
  else if (relation === '克我') result = '用克体，事凶，防损失。';
  else if (relation === '我克') result = '体克用，事可成，但需费力。';
  else result = '体用比和，事顺遂。';
  
  // 变卦分析
  const bianYong = isTiUpper ? guaData.bianGua.lower : guaData.bianGua.upper;
  const bianYongWx = _GUA_XIANG[bianYong].wuxing;
  const endRelation = _wuxingRelationTiYong(tiWx, bianYongWx);
  let endResult = '';
  if (endRelation === '生我') endResult = '变卦用生体，结局吉。';
  else if (endRelation === '我生') endResult = '变卦体生用，结局耗。';
  else if (endRelation === '克我') endResult = '变卦用克体，结局凶。';
  else if (endRelation === '我克') endResult = '变卦体克用，结局可成。';
  else endResult = '变卦体用比和，结局顺遂。';
  
  // 互卦分析
  let huAnalysis = '';
  if (guaData.huGua) {
    const huTi = isTiUpper ? guaData.huGua.upper : guaData.huGua.lower;
    const huYong = isTiUpper ? guaData.huGua.lower : guaData.huGua.upper;
    const huTiWx = _GUA_XIANG[huTi] ? _GUA_XIANG[huTi].wuxing : tiWx;
    const huYongWx = _GUA_XIANG[huYong] ? _GUA_XIANG[huYong].wuxing : yongWx;
    const huRel = _wuxingRelationTiYong(tiWx, huYongWx);
    const huRel2 = _wuxingRelationTiYong(huTiWx, yongWx);
    if (huRel === '生我' || huRel === '比和') huAnalysis = '互卦生体，过程顺利，有贵人相助。';
    else if (huRel === '克我') huAnalysis = '互卦克体，过程受阻，需防小人。';
    else huAnalysis = '互卦泄体，过程虽费力但无大碍。';
  }
  
  // 综合判断
  const isJi = (relation === '比和' || relation === '生我');
  const isXiong = (relation === '克我');
  const endJi = (endRelation === '比和' || endRelation === '生我');
  let verdict = '平';
  let advice = '';
  if (isJi && endJi) { verdict = '吉'; advice = '体用相生，变卦亦吉，所谋顺遂。'; }
  else if (isJi && !endJi) { verdict = '先吉后平'; advice = '初顺后滞，宜速行动。'; }
  else if (isXiong && endJi) { verdict = '先凶后吉'; advice = '初有阻碍，终可化解。'; }
  else if (isXiong && !endJi) { verdict = '凶'; advice = '体用相克，变卦不吉，宜退守。'; }
  else { verdict = '平'; advice = '吉凶参半，需随机应变。'; }
  
  if (huAnalysis) advice += ' ' + huAnalysis;
  
  return {
    tiGua: _GUA_XIANG[ti].name, yongGua: _GUA_XIANG[yong].name, 
    relation, initial: result,
    bianGua: _GUA_XIANG[guaData.bianGua.upper] ? _GUA_XIANG[guaData.bianGua.upper].name : '' + '/' + (_GUA_XIANG[guaData.bianGua.lower] ? _GUA_XIANG[guaData.bianGua.lower].name : ''),
    endRelation, endResult,
    huGua: guaData.huGua, huAnalysis,
    verdict, advice,
    overview: '本卦: ' + (_GUA_XIANG[guaData.benGua.upper] ? _GUA_XIANG[guaData.benGua.upper].name : '') + '/' + (_GUA_XIANG[guaData.benGua.lower] ? _GUA_XIANG[guaData.benGua.lower].name : '') + 
      ', 体:' + _GUA_XIANG[ti].name + '(' + tiWx + '), 用:' + _GUA_XIANG[yong].name + '(' + yongWx + '), ' + result + ' ' + endResult + (huAnalysis ? ' ' + huAnalysis : '')
  };
}

function _wuxingRelationTiYong(a, b) {
  if (a === b) return '比和';
  const sheng = {'金生水':true,'水生木':true,'木生火':true,'火生土':true,'土生金':true};
  if (sheng[a+'生'+b]) return '我生';
  if (sheng[b+'生'+a]) return '生我';
  const ke = {'金克木':true,'木克土':true,'土克水':true,'水克火':true,'火克金':true};
  if (ke[a+'克'+b]) return '我克';
  if (ke[b+'克'+a]) return '克我';
  return '比和';
}

// ========== 5. 大六壬 ==========

const _LR_TIANJIANG = ['贵人','螣蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后'];
// 月将按中气确定: 雨水后用亥, 春分后用戌, 谷雨后用酉, 小满后用申, 夏至后用未,
// 大暑后用午, 处暑后用巳, 秋分后用辰, 霜降后用卯, 小雪后用寅, 冬至后用丑, 大寒后用子
// 中气近似日期: 雨水0219, 春分0321, 谷雨0420, 小满0521, 夏至0622, 大暑0723, 处暑0823, 秋分0923, 霜降1024, 小雪1122, 冬至1222, 大寒0120
function _lrGetYueJiang(month, day) {
  const md = month * 100 + day;
  // 按中气日期确定月将
  if (md >= 1222 || md < 120) return '丑';   // 冬至后→大寒前
  if (md >= 120 && md < 219) return '子';     // 大寒后→雨水前
  if (md >= 219 && md < 321) return '亥';     // 雨水后→春分前
  if (md >= 321 && md < 420) return '戌';     // 春分后→谷雨前
  if (md >= 420 && md < 521) return '酉';     // 谷雨后→小满前
  if (md >= 521 && md < 622) return '申';     // 小满后→夏至前
  if (md >= 622 && md < 723) return '未';     // 夏至后→大暑前
  if (md >= 723 && md < 823) return '午';     // 大暑后→处暑前
  if (md >= 823 && md < 923) return '巳';     // 处暑后→秋分前
  if (md >= 923 && md < 1024) return '辰';    // 秋分后→霜降前
  if (md >= 1024 && md < 1122) return '卯';   // 霜降后→小雪前
  if (md >= 1122 && md < 1222) return '寅';   // 小雪后→冬至前
  return '丑';
}

function liurenPaiPan(year, month, day, hour, minute) {
  const date = new Date(year, month-1, day, hour, minute);
  const hourIdx = Math.floor((hour + 1) / 2) % 12;
  const shiZhi = _BRANCHES[hourIdx];
  const yueJiang = _lrGetYueJiang(month, day);
  const tianPan = _liurenTianPan(yueJiang, shiZhi);
  const gz = _gongliToGanZhi(year, month, day);
  const dayGan = gz.gan||gz[0], dayZhi = gz.zhi||gz[1];
  const ke = _liurenSiKe(dayGan, dayZhi, tianPan);
  const chuan = _liurenSanChuan(ke, dayGan, dayZhi, tianPan);
  const tianJiang = _liurenTianJiang(dayGan, shiZhi, tianPan);
  return { date, dayGan, dayZhi, shiZhi, yueJiang, tianPan, siKe: ke, sanChuan: chuan, tianJiang };
}

function _liurenTianPan(yueJiang, shiZhi) {
  // 天盘: 月将加在时支上, 逆布十二支
  const yjIdx = _branchIdx(yueJiang);
  const szIdx = _branchIdx(shiZhi);
  const offset = _qyMod(szIdx - yjIdx, 12);
  const res = {};
  for (let i=0;i<12;i++) {
    // 地盘i支上方的天盘支 = 地盘i+offset支
    res[_BRANCHES[i]] = _BRANCHES[_qyMod(i + offset, 12)];
  }
  return res;
}

function _liurenSiKe(gan, zhi, tianPan) {
  // 四课:
  // 第一课: 日干上神 (天盘日干所临地支上的天盘支)
  // 第二课: 日干阴 (第一课上神的上神)
  // 第三课: 日支上神 (天盘日支所临地支上的天盘支)
  // 第四课: 日支阴 (第三课上神的上神)
  // 日干寄宫: 甲寅乙辰丙巳丁未戊己申庚辛戌壬亥癸丑
  const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
  const ganGongZhi = ganGong[gan] || '寅';
  // 第一课: 千上神 = 天盘[日干寄宫]上的支
  const ke1Shang = tianPan[ganGongZhi] || ganGongZhi;
  const ke1Xia = ganGongZhi;
  // 第二课: 第一课上神的上神
  const ke2Shang = tianPan[ke1Shang] || ke1Shang;
  const ke2Xia = ke1Shang;
  // 第三课: 支上神 = 天盘[日支]上的支
  const ke3Shang = tianPan[zhi] || zhi;
  const ke3Xia = zhi;
  // 第四课: 第三课上神的上神
  const ke4Shang = tianPan[ke3Shang] || ke3Shang;
  const ke4Xia = ke3Shang;
  return [
    {shang: ke1Shang, xia: ke1Xia, label: '日干阳神'},
    {shang: ke2Shang, xia: ke2Xia, label: '日干阴神'},
    {shang: ke3Shang, xia: ke3Xia, label: '日支阳神'},
    {shang: ke4Shang, xia: ke4Xia, label: '日支阴神'}
  ];
}

function _liurenSanChuan(siKe, dayGan, dayZhi, tianPan) {
  // 九宗门完整实现:
  // 1. 贼克法(重审/审理)
  // 2. 比用法
  // 3. 涉害法
  // 4. 遁克法(远克/近克)
  // 5. 昴星法
  // 6. 别责法
  // 7. 八专法
  // 8. 伏吟法
  // 9. 返吟法
  const ganWx = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
  const zhiWx = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
  const wxKe = {'金':'木','木':'土','土':'水','水':'火','火':'金'};
  
  // 检查伏吟/返吟
  const dayGanIdx = _STEMS.indexOf(dayGan);
  const dayZhiIdx = _BRANCHES.indexOf(dayZhi);
  const gzIdx = (() => { for(let i=0;i<60;i++){ if(i%10===dayGanIdx && i%12===dayZhiIdx) return i; } return 0; })();
  // 伏吟: 日干支同位 (甲子日甲子时之类)
  const isFuYin = (dayGanIdx === dayZhiIdx % 10); // 伏吟: 日干支同位
  // 返吟: 日干支冲
  const isFanYin = (dayZhiIdx === (dayGanIdx + 6) % 12);
  
  if (isFuYin) {
    // 伏吟法: 初传=日干寄宫, 中传=初传上神, 末传=中传上神
    const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
    const chu = ganGong[dayGan] || '寅';
    const zhong = tianPan[chu] || chu;
    const mo = tianPan[zhong] || zhong;
    return {chu, zhong, mo, method: '伏吟法'};
  }
  if (isFanYin) {
    // 返吟法: 初传=日支上神, 中传=初传上神, 末传=中传上神
    const chu = tianPan[dayZhi] || dayZhi;
    const zhong = tianPan[chu] || chu;
    const mo = tianPan[zhong] || zhong;
    return {chu, zhong, mo, method: '返吟法'};
  }
  
  // 找下克上(贼)和上克下(克)
  const zeiList = [];
  const keList = [];
  for (let i = 0; i < 4; i++) {
    const shangWx = zhiWx[siKe[i].shang];
    const xiaWx = zhiWx[siKe[i].xia];
    if (xiaWx !== shangWx) {
      if (wxKe[xiaWx] === shangWx) zeiList.push(i);
      if (wxKe[shangWx] === xiaWx) keList.push(i);
    }
  }
  
  let method = '贼克法';
  let chuChuanIdx;
  
  if (zeiList.length === 1) {
    chuChuanIdx = zeiList[0];
    method = zeiList.length === 1 ? '重审' : '';
  } else if (zeiList.length > 1) {
    // 比用法: 取与日干五行相同者
    const ganW = ganWx[dayGan];
    const matching = zeiList.filter(i => zhiWx[siKe[i].shang] === ganW);
    if (matching.length === 1) {
      chuChuanIdx = matching[0];
      method = '比用法';
    } else if (matching.length > 1) {
      // 涉害法: 取涉害最深者 (克数最多者为初传)
      // 《大六壬大全·涉害法》云:「涉害者, 从日干寄宫数到上神, 历经克贼之地, 克多者为初传。」
      // 标准: 从日干寄宫顺数到上神所在宫, 计算路径上每个地支被上神所克的次数
      //   克数 = 上神五行克路径地支五行的次数 (我克者为涉害)
      // 若克数相同, 取在地盘上先到者为初传 (涉害比用法)
      let maxHarm = -1, maxIdx = matching[0];
      for (const idx of matching) {
        const zhi = siKe[idx].shang;
        let harm = 0;
        // 从日干寄宫数到上神, 计算路径上被上神所克的地支数
        const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
        const gg = ganGong[dayGan] || '寅';
        const ggIdx = _branchIdx(gg);
        const sIdx = _branchIdx(zhi);
        // 上神五行
        const shangWx = zhiWx[zhi];
        // 数克: 从寄宫顺数到上神, 路径上每个地支被上神克则+1
        for (let j = 0; j < 12; j++) {
          const p = _qyMod(ggIdx + j, 12);
          if (_BRANCHES[p] === zhi) break;
          const pathWx = zhiWx[_BRANCHES[p]];
          if (wxKe[shangWx] === pathWx) harm++; // 上神克路径地支
        }
        if (harm > maxHarm) { maxHarm = harm; maxIdx = idx; }
        // 涉害比用法: 克数相同取地盘上先到者(已在路径顺序中先到)
      }
      chuChuanIdx = maxIdx;
      method = '涉害法';
    } else {
      // 无比者, 取贼克中第一个
      chuChuanIdx = zeiList[0];
      method = '比用法(取首)';
    }
  } else if (keList.length === 1) {
    chuChuanIdx = keList[0];
    method = '审理';
  } else if (keList.length > 1) {
    // 遁克法(涉害法): 在上克下的课中比较涉害深浅
    const ganW = ganWx[dayGan];
    const matching = keList.filter(i => zhiWx[siKe[i].shang] === ganW);
    if (matching.length === 1) {
      chuChuanIdx = matching[0];
      method = '比用法(克)';
    } else if (matching.length > 1) {
      // 涉害法: 取涉害最深者 (上克下课中)
      // 《大六壬大全》云:「上克下为害, 涉害深者取初传。」
      let maxHarm = -1, maxIdx = matching[0];
      for (const idx of matching) {
        const zhi = siKe[idx].shang;
        let harm = 0;
        const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
        const gg = ganGong[dayGan] || '寅';
        const ggIdx = _branchIdx(gg);
        const sIdx = _branchIdx(zhi);
        const shangWx = zhiWx[zhi];
        for (let j = 0; j < 12; j++) {
          const p = _qyMod(ggIdx + j, 12);
          if (_BRANCHES[p] === zhi) break;
          const pathWx = zhiWx[_BRANCHES[p]];
          if (wxKe[shangWx] === pathWx) harm++; // 上神克路径地支
        }
        if (harm > maxHarm) { maxHarm = harm; maxIdx = idx; }
      }
      chuChuanIdx = maxIdx;
      method = '涉害法(克)';
    } else {
      // 遁克法: 无比者, 在克中取涉害最深者
      // 《六壬大全》云:「遁克者, 取克中涉害最深者为用。」
      let maxHarm = -1, maxIdx = keList[0];
      for (const idx of keList) {
        const zhi = siKe[idx].shang;
        let harm = 0;
        const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
        const gg = ganGong[dayGan] || '寅';
        const ggIdx = _branchIdx(gg);
        const shangWx = zhiWx[zhi];
        for (let j = 0; j < 12; j++) {
          const p = _qyMod(ggIdx + j, 12);
          if (_BRANCHES[p] === zhi) break;
          const pathWx = zhiWx[_BRANCHES[p]];
          if (wxKe[shangWx] === pathWx) harm++; // 上神克路径地支
        }
        if (harm > maxHarm) { maxHarm = harm; maxIdx = idx; }
      }
      chuChuanIdx = maxIdx;
      method = '遁克法';
    }
  } else {
    // 无贼无克: 昴星法/别责法/八专法
    // 八专日: 甲寅、己未、庚申、乙卯、戊辰、辛酉、壬戌、癸亥
    const baZhuanPairs = [
      ['甲','寅'],['己','未'],['庚','申'],['乙','卯'],['戊','辰'],['辛','酉'],['壬','戌'],['癸','亥']
    ];
    const isBaZhuan = baZhuanPairs.some(p => dayGan === p[0] && dayZhi === p[1]);
    
    if (isBaZhuan) {
      // 八专法: 干支同气, 取第一课上神为初传, 末传取对冲
      chuChuanIdx = 0;
      method = '八专法';
    } else {
      // 非八专日, 无贼无克: 检查遥克
      // 遥克 = 四课中某课上神克日干或日支
      const ganGong = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
      const ggZhi = ganGong[dayGan] || '寅';
      const ganW = ganWx[dayGan];
      const zhiW = zhiWx[dayZhi];
      let hasYaoKe = false;
      for (let i = 0; i < 4; i++) {
        const shangW = zhiWx[siKe[i].shang];
        // 上神克日干或日支
        if (wxKe[shangW] === ganW || wxKe[shangW] === zhiW) { hasYaoKe = true; break; }
        // 日干或日支克上神
        if (wxKe[ganW] === shangW || wxKe[zhiW] === shangW) { hasYaoKe = true; break; }
      }
      
      if (hasYaoKe) {
        // 昴星法: 无贼克而有遥克时用之
        // 《大六壬大全·昴星法》云:「昴星者, 西方酉宿, 主秋杀之气。阳日取酉上神为初传, 阴日取卯上神为初传。」
        // 阳日(甲丙戊庚壬): 取酉上神为初传, 中传取初传上神, 末传取中传上神
        // 阴日(乙丁己辛癸): 取卯上神为初传, 中传取初传上神, 末传取中传上神
        // 酉为昴星之位, 阳日取酉上神(天气下降); 阴日取卯上神(地气上升)
        const isYangDay = ['甲','丙','戊','庚','壬'].includes(dayGan);
        const maoXingZhi = isYangDay ? '酉' : '卯';
        const chu = tianPan[maoXingZhi] || maoXingZhi;
        const zhong = tianPan[chu] || chu;  // 中传 = 初传上神
        const mo = tianPan[zhong] || zhong;  // 末传 = 中传上神
        return {chu, zhong, mo, method: '昴星法'};
      } else {
        // 别责法: 无贼无克无遥克, 取日干合神地盘本位上神为初传
        // 甲己合, 乙庚合, 丙辛合, 丁壬合, 戊癸合
        const heGan = {'甲':'己','己':'甲','乙':'庚','庚':'乙','丙':'辛','辛':'丙','丁':'壬','壬':'丁','戊':'癸','癸':'戊'};
        const heG = heGan[dayGan];
        // 合神地盘本位(寄宫)
        const heGong = ganGong[heG];
        // 合神寄宫上神为初传
        const chu = tianPan[heGong] || heGong;
        // 中传=初传, 末传=日支上神
        const zhong = chu;
        const mo = tianPan[dayZhi] || dayZhi;
        return {chu, zhong, mo, method: '别责法'};
      }
    }
  }
  
  // 初传 = 贼克课上神
  const chuChuan = siKe[chuChuanIdx].shang;
  const zhongChuan = tianPan[chuChuan] || chuChuan;
  const moChuan = tianPan[zhongChuan] || zhongChuan;
  
  return {chu: chuChuan, zhong: zhongChuan, mo: moChuan, method};
}

function _liurenTianJiang(dayGan, shiZhi, tianPan) {
  // 十二天将: 贵人腾蛇朱雀六合勾陈青龙天后太阴玄武太常白虎天空
  // 贵人定位: 日干决定贵人昼夜
  // 甲戊庚牛羊, 乙己鼠猴乡, 丙丁猪鸡位, 壬癸蛇兔藏, 六辛逢马虎
  const guiRenPos = {
    '甲':{day:'丑',night:'未'}, '戊':{day:'丑',night:'未'}, '庚':{day:'丑',night:'未'},
    '乙':{day:'子',night:'申'}, '己':{day:'子',night:'申'},
    '丙':{day:'亥',night:'酉'}, '丁':{day:'亥',night:'酉'},
    '壬':{day:'巳',night:'卯'}, '癸':{day:'巳',night:'卯'},
    '辛':{day:'午',night:'寅'}
  };
  // 昼夜: 辰~酉时为昼, 戌~卯时为夜
  const szIdx = _branchIdx(shiZhi);
  const isDay = szIdx >= 4 && szIdx <= 9; // 辰(4)到酉(9)
  const guiRen = guiRenPos[dayGan] || guiRenPos['甲'];
  const guiZhi = isDay ? guiRen.day : guiRen.night;
  const guiIdx = _branchIdx(guiZhi);
  // 天将顺序: 贵人腾蛇朱雀六合勾陈青龙天后太阴玄武太常白虎天空
  // 昼贵顺布, 夜贵逆布
  // 大六壬天将顺序（昼顺夜逆排列）
// 口诀：贵人→螣蛇→朱雀→六合→勾陈→青龙→天空→白虎→太常→玄武→太阴→天后
const tianJiangNames = ['贵人','腾蛇','朱雀','六合','勾陈','青龙','天空','白虎','太常','玄武','太阴','天后'];
  const res = {};
  for (let i = 0; i < 12; i++) {
    const idx = isDay ? _qyMod(guiIdx + i, 12) : _qyMod(guiIdx - i, 12);
    res[_BRANCHES[idx]] = tianJiangNames[i];
  }
  return res;
}

function liurenAnalyze(panData, question) {
  const chuan = panData.sanChuan;
  const jiang = panData.tianJiang;
  const method = chuan.method || '贼克法';
  // 三传天将
  const chuanShen = [jiang[chuan.chu]||'贵人', jiang[chuan.zhong]||'贵人', jiang[chuan.mo]||'贵人'];
  const chuanZhi = [chuan.chu, chuan.zhong, chuan.mo];
  let luck = '平';
  const good = ['贵人','青龙','六合','太阴','天后','太常'];
  const bad = ['腾蛇','朱雀','勾陈','白虎','玄武','天空'];
  let goodCount=0, badCount=0;
  chuanShen.forEach(function(s){ if(good.includes(s)) goodCount++; if(bad.includes(s)) badCount++; });
  if (goodCount >= 2) luck = '吉';
  if (badCount >= 2) luck = '凶';
  // 课体格局判断
  const keti = [];
  if (method === '重审') keti.push('重审课');
  if (method === '审理') keti.push('审理课');
  if (method === '比用法') keti.push('比用课');
  if (method === '涉害法') keti.push('涉害课');
  if (method === '遁克法') keti.push('遁克课');
  if (method === '昴星法') keti.push('昴星课');
  if (method === '别责法') keti.push('别责课');
  if (method === '八专法') keti.push('八专课');
  if (method === '伏吟法') keti.push('伏吟课');
  if (method === '返吟法') keti.push('返吟课');
  // 三传自合
  const sanhe = (a, b, c) => {
    const sets = [['子','辰','申'],['丑','巳','酉'],['寅','午','戌'],['卯','未','亥']];
    return sets.some(s => s.includes(a) && s.includes(b) && s.includes(c));
  };
  if (sanhe(chuan.chu, chuan.zhong, chuan.mo)) keti.push('三传三合');
  // 四课文本
  const siKeText = panData.siKe.map(function(k,i){
    return '第'+(i+1)+'课: '+k.xia+'上'+k.shang+' ('+k.label+')';
  }).join('  ');
  const ketiStr = keti.length ? '课体: ' + keti.join('、') : '';
  return { question, method, keti: keti.join('、'), siKeText, sanChuan: chuanZhi, chuanShen, luck,
    advice: luck==='吉' ? '三传吉将居多，所谋顺遂。' + ketiStr :
            luck==='凶' ? '三传凶将较多，宜谨慎退守。' + ketiStr :
            '吉凶参半，需随机应变。' + ketiStr
  };
}

// ========== 6. 姓名学 ==========

const _STROKE_TABLE = {
  '一':1,'乙':1,'二':2,'十':2,'人':2,'入':2,'八':2,'刀':2,'力':2,'三':3,'上':3,'下':3,'土':3,'大':3,'子':3,'山':3,'四':4,'王':4,'天':4,'文':4,'心':4,'日':4,'月':4,'水':4,'火':4,'木':4,'五':5,'玉':5,'白':5,'石':5,'田':5,'六':6,'老':6,'耳':6,'七':7,'金':8,'長':8,'九':9,'馬':10,'黃':12,'黑':12,'龍':16
};

function _charStrokes(c) {
  return _STROKE_TABLE[c] || (c.charCodeAt(0) % 16 + 1);
}

function xingmingAnalyze(name, sex) {
  if (!name) return {error:'请输入姓名'};
  const chars = name.split('');
  const xing = chars[0];
  const ming = chars.slice(1).join('');
  const xingStrokes = _charStrokes(xing);
  const mingStrokes = chars.slice(1).reduce(function(s,c){return s+_charStrokes(c);}, 0);
  const tianGe = xingStrokes + 1;
  const renGe = xingStrokes + (ming ? _charStrokes(chars[1]||ming[0]||'一') : 1);
  const diGe = mingStrokes || 1;
  const waiGe = Math.max(1, tianGe + diGe - renGe);
  const zongGe = xingStrokes + mingStrokes;
  const wuxing = _numWuxing(renGe);
  const sancai = [_numWuxing(tianGe), _numWuxing(renGe), _numWuxing(diGe)];
  const sancaiRelation = _sancaiRelation(sancai[0], sancai[1], sancai[2]);
  const score = Math.min(100, Math.max(50, 70 + _numJiXiong(tianGe) + _numJiXiong(renGe) + _numJiXiong(diGe) + _numJiXiong(zongGe) + (sancaiRelation.includes('吉')?10:0)));
  return {
    name, sex, xing, ming, tianGe, renGe, diGe, waiGe, zongGe, wuxing, sancai, sancaiRelation, score,
    meaning: '姓名五格：天格'+tianGe+'、人格'+renGe+'、地格'+diGe+'、外格'+waiGe+'、总格'+zongGe+'。',
    advice: '人格五行'+wuxing+'，三才配置'+sancai.join('-')+'，'+sancaiRelation+'。建议结合八字用神进一步调整。'
  };
}

function _numWuxing(n) {
  const tail = n % 10;
  if ([1,2].includes(tail)) return '木';
  if ([3,4].includes(tail)) return '火';
  if ([5,6].includes(tail)) return '土';
  if ([7,8].includes(tail)) return '金';
  return '水';
}

function _sancaiRelation(t,r,d) {
  const map = {'木生火':true,'火生土':true,'土生金':true,'金生水':true,'水生木':true};
  const g1 = map[t+r]; const g2 = map[r+d];
  if (g1 && g2) return '三才顺生，大吉';
  if (g1 || g2) return '三才半吉';
  if (t===r && r===d) return '三才比和，平稳';
  return '三才相克，需调和';
}

function _numJiXiong(n) {
  const ji = [1,3,5,6,7,8,11,13,15,16,21,23,24,25,31,32,33,35,37,39,41,45,47,48,52,57,61,63,65,67,68,73,75,81];
  return ji.includes(n) ? 5 : -3;
}

// ========== 7. 风水 ==========

const _FS_YAO_MING = {1:'东四命',2:'西四命',3:'东四命',4:'东四命',6:'西四命',7:'西四命',8:'西四命',9:'东四命'};

function fengshuiAnalyze(houseType, direction, buildYear, roomLayout, birthYear) {
  const dirMap = {'北':1,'南':9,'东':3,'西':7,'东北':8,'西北':6,'东南':4,'西南':2};
  const dirNum = dirMap[direction] || 1;
  // 宅命
  const zhaiYao = _FS_YAO_MING[dirNum] || '东四命';
  const zhaiMing = (zhaiYao === '东四命') ? '东四宅' : '西四宅';
  
  // 命卦: 精确计算
  let mingGua = '东四命';
  let mingGuaNum = 0;
  if (birthYear) {
    const yy = birthYear - 1900;
    const sum = _qyMod(yy, 9);
    const maleNum = _qyMod(11 - sum, 9) || 9;
    const femaleNum = _qyMod(4 + sum, 9) || 9;
    mingGuaNum = maleNum; // 默认男命, 实际应传sex参数
    const dongSi = [1,3,4,9];
    mingGua = dongSi.includes(mingGuaNum) ? '东四命' : '西四命';
  }
  const matching = (mingGua === '东四命' && zhaiMing === '东四宅') || (mingGua === '西四命' && zhaiMing === '西四宅');
  
  const period = Math.floor(((buildYear || 2024) - 1864) / 20) + 1;
  const currentPeriod = Math.floor((2024 - 1864) / 20) + 1;
  const wangShan = (period === currentPeriod);
  const xuankong = _xuankongBrief(buildYear, direction);
  
  // 24山: 每卦管三山
  const sanShan = {
    1:['壬','子','癸'], 9:['丙','午','丁'], 3:['甲','卯','乙'], 7:['庚','酉','辛'],
    8:['丑','艮','寅'], 6:['戌','乾','亥'], 4:['辰','巽','巳'], 2:['未','坤','申']
  };
  const mountains = sanShan[dirNum] || ['壬','子','癸'];
  
  // 形势派分析
  const xingshi = [];
  if (houseType) {
    xingshi.push('房型: ' + houseType);
    if (houseType.includes('缺') || houseType.includes('缺角')) xingshi.push('缺角房屋需补角化解');
    if (houseType.includes('方正') || houseType.includes('正方')) xingshi.push('房型方正，气场稳定');
    if (houseType.includes('长方')) xingshi.push('长方形房屋，注意比例不超过2:1');
  }
  if (roomLayout) {
    xingshi.push('布局: ' + roomLayout);
    if (roomLayout.includes('门对门') || roomLayout.includes('对冲')) xingshi.push('门冲问题，需设置玄关或屏风化解');
    if (roomLayout.includes('穿堂')) xingshi.push('穿堂煞，财气直泄，需设隔断');
    if (roomLayout.includes('横梁')) xingshi.push('横梁压顶，需吊顶或移位');
    if (roomLayout.includes('开放式')) xingshi.push('开放式布局，注意厨房油烟');
  }
  
  // 四灵方位
  const siLing = {
    front: '前朱雀(南)', back: '后玄武(北)', left: '左青龙(东)', right: '右白虎(西)'
  };
  
  // 八宅吉凶位
  const bazhai = _computeBazhai(dirNum);
  
  const score = matching ? 85 : 60;
  return {
    houseType, direction, buildYear, roomLayout, 
    yaoMing: mingGua, mingGuaNum, zhaiMing, matching,
    period, wangShan, xuankong,
    mountains: mountains.join('、'),
    siLing: siLing,
    bazhai: bazhai,
    xingshi: xingshi.join('；'),
    score,
    advice: matching ? '宅命相配，主家宅安宁、事业顺遂。' : '宅命不配，主易有阻滞，可通过布局化解。',
    layoutTips: _fengshuiTips(dirNum, matching, bazhai)
  };
}

function _computeBazhai(zhaiNum) {
  // 八宅: 生气(大吉)、天医(中吉)、延年(上吉)、伏位(小吉)、绝命(大凶)、五鬼(大凶)、六煞(中凶)、祸害(小凶)
  // 以宅卦为起点, 按固定规律排布
  const positions = ['生气','天医','延年','伏位','绝命','五鬼','六煞','祸害'];
  // 各宅卦的吉凶方位表 (按洛书九宫序)
  const tables = {
    1: {n:'坎', s:'离', e:'震', w:'兑', ne:'艮', nw:'乾', se:'巽', sw:'坤'},
    9: {n:'离', s:'坎', e:'震', w:'兑', ne:'艮', nw:'乾', se:'巽', sw:'坤'},
    3: {n:'震', s:'离', e:'坎', w:'兑', ne:'艮', nw:'乾', se:'巽', sw:'坤'},
    4: {n:'巽', s:'离', e:'震', w:'兑', ne:'艮', nw:'乾', se:'坎', sw:'坤'},
    6: {n:'乾', s:'离', e:'震', w:'坎', ne:'艮', nw:'坤', se:'巽', sw:'兑'},
    7: {n:'兑', s:'离', e:'震', w:'坎', ne:'艮', nw:'乾', se:'巽', sw:'坤'},
    8: {n:'艮', s:'离', e:'震', w:'兑', ne:'坎', nw:'乾', se:'巽', sw:'坤'},
    2: {n:'坤', s:'离', e:'震', w:'兑', ne:'艮', nw:'乾', se:'巽', sw:'坎'}
  };
  // 吉凶位计算 (大游年歌诀)
  // 乾六天五祸绝延生, 坎五天生延绝祸六, 艮六绝祸生延天五, 震延生祸绝五天六
  // 巽天五六祸生绝延, 离六五祸绝延生三, 坤天延绝生祸五六, 兑生祸延绝六五天
  const dayoujian = {
    1: {1:'伏位',9:'延年',3:'天医',7:'祸害',8:'五鬼',6:'六煞',4:'生气',2:'绝命'},
    9: {1:'延年',9:'伏位',3:'生气',7:'绝命',8:'祸害',6:'绝命',4:'天医',2:'六煞'},
    3: {1:'天医',9:'生气',3:'伏位',7:'绝命',8:'延年',6:'五鬼',4:'延年',2:'祸害'},
    4: {1:'生气',9:'天医',3:'延年',7:'六煞',8:'绝命',6:'祸害',4:'伏位',2:'五鬼'},
    6: {1:'六煞',9:'绝命',3:'五鬼',7:'生气',8:'天医',6:'伏位',4:'祸害',2:'延年'},
    7: {1:'生气',9:'绝命',3:'延年',7:'伏位',8:'延年',6:'生气',4:'六煞',2:'祸害'},
    8: {1:'五鬼',9:'祸害',3:'延年',7:'绝命',8:'伏位',6:'天医',4:'绝命',2:'生气'},
    2: {1:'绝命',9:'六煞',3:'祸害',7:'天医',8:'生气',6:'延年',4:'五鬼',2:'伏位'}
  };
  const result = {};
  const tbl = dayoujian[zhaiNum] || dayoujian[1];
  const dirNames = {1:'北',9:'南',3:'东',7:'西',8:'东北',6:'西北',4:'东南',2:'西南'};
  for (const num in tbl) {
    result[dirNames[num] || num] = tbl[num];
  }
  return result;
}

function _fengshuiTips(dirNum, matching, bazhai) {
  const tips = [];
  // 找吉位和凶位
  const jimen = ['生气','天医','延年','伏位'];
  const xiongmen = ['绝命','五鬼','六煞','祸害'];
  for (const dir in bazhai) {
    if (jimen.includes(bazhai[dir])) tips.push(dir + '方' + bazhai[dir] + '(吉): 宜设大门/卧室/财位');
    if (xiongmen.includes(bazhai[dir])) tips.push(dir + '方' + bazhai[dir] + '(凶): 宜设厨房/卫生间镇之');
  }
  tips.push('大门宜开在吉方，忌对电梯、楼梯、尖角。');
  tips.push('卧室床头宜靠实墙，忌横梁压顶。');
  tips.push('厨房宜坐凶向吉，灶口忌对门窗。');
  tips.push('客厅宜明亮方正，财位在进门对角线。');
  if (!matching) tips.push('宅命不配，可在吉位摆放命卦相生物品化解。');
  return tips;
}

function _xuankongBrief(year, dir) {
  const period = Math.floor(((year || 2024) - 1864) / 20) + 1;
  const dirMap = {'北':1,'南':9,'东':3,'西':7,'东北':8,'西北':6,'东南':4,'西南':2};
  const dirNum = dirMap[dir] || 1;
  
  // dir 为朝向(向方)，坐方 = 向方对宫
  // 《沈氏玄空学》:「向者，宅之所向也；坐者，宅之所背也」
  // 洛书对冲: 1↔9、2↔8、3↔7、4↔6，5寄中宫取对冲9
  const zuoDirNum = (dirNum === 5) ? 9 : (10 - dirNum); // 坐方洛书数
  const xiangDirNum = dirNum; // 向方洛书数 = 传入方向
  
  // 运星盘: 当运星入中宫, 按洛书轨迹飞布
  // 《沈氏玄空学》运星以当运之数入中宫顺飞九宫
  // 洛书九宫顺序: 中5→西北6→西7→东北8→南9→北1→西南2→东3→东南4
  const gongPos = [5,6,7,8,9,1,2,3,4];
  
  // 运星盘 (入中宫的星 = period)
  const yunPan = {};
  for (let i = 0; i < 9; i++) {
    const star = ((period - 1 + i) % 9) + 1;
    yunPan[gongPos[i]] = star;
  }
  
  // 山星: 坐方运星入中, 阳顺阴逆飞
  // 《沈氏玄空学》:「山星以坐方之运星入中宫，视其阴阳而定顺逆」
  const zuoNum = yunPan[zuoDirNum] || period; // 坐方运星
  // 向星: 向方运星入中, 阳顺阴逆飞
  // 《沈氏玄空学》:「向星以向方之运星入中宫，视其阴阳而定顺逆」
  const xiangNum = yunPan[xiangDirNum] || period; // 向方运星
  
  // 阳顺阴逆: 按三元龙阴阳判定
  // 《沈氏玄空学》:「各元龙之阴阳，看坐向所临之卦而定」
  // 天元龙(乾坤艮巽+子午卯酉): 阳顺飞
  // 地元龙(甲庚壬丙+辰戌丑未): 阴逆飞  
  // 人元龙(乙辛丁癸+寅申巳亥): 阳顺飞
  // 洛书方位对应: 1坎(子/癸)阳, 2坤(坤/未)坤阳/未阴, 3震(卯/乙)阳, 4巽(巽/辰)巽阳/辰阴
  //                6乾(乾/戌)乾阳/戌阴, 7兑(酉/辛)阳, 8艮(艮/丑)艮阳/丑阴, 9离(午/丁)阳
  // 按三元龙阴阳判定: 子午卯酉乾坤艮巽为阳, 辰戌丑未为阴
  // 坎1震3巽4乾6离9为阳顺飞, 坤2兑7艮8为阴逆飞 (按地卦阴阳)
  // 24山各山有阴阳, 此处按8方位的默认山阴阳
  const yangGongs = [1,3,4,6,9]; // 坎震巽乾离为阳
  const isZuoYang = yangGongs.includes(zuoDirNum);
  const isXiangYang = yangGongs.includes(xiangDirNum);
  
  const shunFei = [5,6,7,8,9,1,2,3,4];
  const niFei = [5,4,3,2,1,9,8,7,6];
  
  // 山星飞布 (阳顺阴逆)
  const shanPan = {};
  const shanFeiXu = isZuoYang ? shunFei : niFei;
  for (let i = 0; i < 9; i++) {
    const star = ((zuoNum - 1 + i) % 9) + 1;
    shanPan[shanFeiXu[i]] = star;
  }
  
  // 向星飞布 (阳顺阴逆)
  const xiangPan = {};
  const xiangFeiXu = isXiangYang ? shunFei : niFei;
  for (let i = 0; i < 9; i++) {
    const star = ((xiangNum - 1 + i) % 9) + 1;
    xiangPan[xiangFeiXu[i]] = star;
  }
  
  // 九星含义
  const starName = {1:'一白贪狼',2:'二黑巨门',3:'三碧禄存',4:'四绿文曲',5:'五黄廉贞',6:'六白武曲',7:'七赤破军',8:'八白左辅',9:'九紫右弼'};
  const starNature = {1:'水·吉',2:'土·凶',3:'木·凶',4:'木·吉',5:'土·大凶',6:'金·吉',7:'金·凶',8:'土·吉',9:'火·吉'};
  
  // 当旺判断
  const wangStar = period;
  const shengStar = (period % 9) + 1; // 生气星
  const siStar = ((period + 1) % 9) + 1; // 退气星
  
  const gongNames = {1:'坎(北)',2:'坤(西南)',3:'震(东)',4:'巽(东南)',5:'中宫',6:'乾(西北)',7:'兑(西)',8:'艮(东北)',9:'离(南)'};
  
  let panText = period + '运玄空飞星盘\\n';
  panText += '坐方: ' + _getOppositeDir(dir) + '(' + starName[zuoNum] + ') 向方: ' + dir + '(' + starName[xiangNum] + ')\\n';
  panText += '九宫飞星: ';
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    panText += gongNames[p] + '=' + starName[yunPan[p]] + '(' + starNature[yunPan[p]] + ') ';
  }
  panText += '\\n';
  
  // 中宫运星
  panText += '中宫: ' + starName[yunPan[5]] + '(运星) 山' + starName[shanPan[5]] + ' 向' + starName[xiangPan[5]] + '\\n';
  
  // —— 玄空格局判断 ——
  // 以下格局出自《沈氏玄空学》卷二
  const tips = [];
  
  // 1. 到山到向 (旺山旺向): 山星到坐方，向星到向方
  // 《沈氏玄空学》:「山星到坐方为到山，向星到向方为到向，合称到山到向，主丁财两旺」
  if (shanPan[zuoDirNum] === wangStar && xiangPan[xiangDirNum] === wangStar) {
    tips.push('到山到向(旺山旺向): 当旺山星到坐方、当旺向星到向方，丁财两旺，大吉之局');
  }
  
  // 2. 上山下水: 山星到向方，向星到坐方
  // 《沈氏玄空学》:「山星到向方为上山，向星到坐方为下水，主损丁破财」
  if (shanPan[xiangDirNum] === wangStar && xiangPan[zuoDirNum] === wangStar) {
    tips.push('上山下水: 当旺山星到向方、当旺向星到坐方，损丁破财，大凶之局，需化解');
  }
  
  // 3. 合十: 山星与向星之数和为10
  // 《沈氏玄空学》:「山向二星合十，为坎离交媾、水火既济，主吉」
  const heShiList = [];
  for (let p = 1; p <= 9; p++) {
    if (p === 5) continue;
    if (shanPan[p] + xiangPan[p] === 10) {
      heShiList.push(gongNames[p]);
    }
  }
  if (heShiList.length > 0) {
    tips.push('合十: ' + heShiList.join('、') + ' 山向星合十，坎离交媾，主吉');
  }
  
  // 4. 令星入囚: 当运旺星入中宫为入囚
  // 《沈氏玄空学》:「当运之星入中宫为入囚，主运衰则败」
  if (shanPan[5] === wangStar) {
    tips.push('山星入囚: 当旺山星入中宫，丁气受囚，人多虚弱');
  }
  if (xiangPan[5] === wangStar) {
    tips.push('向星入囚: 当旺向星入中宫，财气受囚，财源渐退');
  }
  
  // 基本旺衰判断
  if (yunPan[5] === wangStar) tips.push('当旺运星入中宫，宅运旺盛');
  if (shanPan[zuoDirNum] === wangStar) tips.push('当旺山星到坐方，人丁兴旺');
  if (xiangPan[xiangDirNum] === wangStar) tips.push('当旺向星到向方，财源广进');
  if (yunPan[5] === 5 || shanPan[5] === 5) tips.push('五黄入中，官灾疾病，需化解');
  if (yunPan[5] === 2) tips.push('二黑入中，注意健康');
  if (yunPan[5] === 3) tips.push('三碧入中，防止是非口舌');
  
  return panText + (tips.length > 0 ? '分析: ' + tips.join('；') : '分析: 需结合具体格局判断。');
}

function _getOppositeDir(dir) {
  const opp = {'北':'南','南':'北','东':'西','西':'东','东北':'西南','西南':'东北','西北':'东南','东南':'西北'};
  return opp[dir] || '南';
}

// ========== 8. 择日 ==========

const _JC_NAMES = ['建','除','满','平','定','执','破','危','成','收','开','闭'];
const _JC_JIXIONG = ['吉','吉','平','平','吉','吉','凶','凶','吉','平','吉','凶'];
const _PENZU = {
  甲:'甲不开仓财物耗散',乙:'乙不栽植千株不长',丙:'丙不修灶必见灾殃',丁:'丁不剃头头必生疮',
  戊:'戊不受田田主不祥',己:'己不破券二比并亡',庚:'庚不经络织机虚张',辛:'辛不合酱主人不尝',
  壬:'壬不汲水更难提防',癸:'癸不词讼理弱敌强'
};
const _PENZU_ZHI = {
  子:'子不问卜自惹祸殃',丑:'丑不冠带主不还乡',寅:'寅不祭祀神鬼不尝',卯:'卯不穿井水泉不香',
  辰:'辰不哭泣必主重丧',巳:'巳不远行财物伏藏',午:'午不苫盖屋主更张',未:'未不服药毒气入肠',
  申:'申不安床鬼祟入房',酉:'酉不宴客醉坐颠狂',戌:'戌不吃犬作怪上床',亥:'亥不嫁娶不利新郎'
};
const _XIU_XING = ['角','亢','氐','房','心','尾','箕','斗','牛','女','虚','危','室','壁','奎','娄','胃','昴','毕','觜','参','井','鬼','柳','星','张','翼','轸'];
const _YI_JI = {
  '建':'宜：祭祀、祈福、出行；忌：嫁娶、安葬',
  '除':'宜：沐浴、清洁、除旧；忌：嫁娶、安床',
  '满':'宜：开市、立券、交易；忌：动土、栽种',
  '平':'宜：修饰垣墙、平治道涂；忌：嫁娶、移徙',
  '定':'宜：冠笄、嫁娶、会亲友；忌：词讼、出行',
  '执':'宜：捕捉；忌：开市、嫁娶',
  '破':'宜：破屋、坏垣；忌：诸事不宜',
  '危':'宜：安床、捕捉；忌：嫁娶、出行',
  '成':'宜：嫁娶、开市、入学；忌：诉讼',
  '收':'宜：收获、纳财；忌：安葬、出行',
  '开':'宜：开业、嫁娶、出行；忌：安葬',
  '闭':'宜：塞穴、补垣；忌：嫁娶、开市'
};
const _SHI_CHEN_JI = ['子','寅','卯','午','未','酉','戌'];

function zeriCalcFull(lunarMonth, lunarDay, dayGanZhi, event) {
  // 全量择日计算（传统智慧）
  // event: 事项类型（嫁娶/搬家/开业/动土/安葬/出行/求职/祈福等）
  const today = new Date();
  let Y = today.getFullYear(), M = today.getMonth()+1, D = today.getDate();
  
  // 使用完整黄历计算函数
  let yearGZ = getYearGanZhi(Y, M, D);
  let monthGZ = getMonthGanZhi(Y, M, D);
  let dayGZ = getDayGanZhi(Y, M, D);
  if (dayGanZhi) {
    // 如果传入dayGanZhi，用它覆盖
    if (typeof dayGanZhi === 'string') {
      let ganIdx = TIAN_GAN.indexOf(dayGanZhi[0]);
      let zhiIdx = DI_ZHI.indexOf(dayGanZhi[1]);
      dayGZ = {gan: ganIdx, zhi: zhiIdx, index: ganIdx * 12 + zhiIdx};
    } else if (typeof dayGanZhi === 'object') {
      dayGZ = dayGanZhi;
    }
  }
  
  // 建除十二神
  let jianchuName = getJianChu(monthGZ.zhi, dayGZ.zhi);
  
  // 星宿 + 吉凶
  let xingxiu = getXingXiu(Y, M, D);
  let xingxiuJixiong = XINGXIU_JIXIONG[xingxiu.name] || '平';
  
  // 值神
  let zhishen = getZhishen(dayGZ.gan, dayGZ.zhi);
  let zhishenIsHuangdao = ZHISHEN_TYPE[zhishen];
  
  // 冲煞详情
  let dayZhiName = DI_ZHI[dayGZ.zhi];
  let chongshaInfo = CHONGSHA_DETAIL[dayZhiName] || {chong:'', sha:''};
  
  // 胎神占方
  let taiShen = TAI_SHEN_60[dayGZ.index];
  
  // 彭祖百忌（完整）
  let pengzuGanStr = PENGZU_FULL[TIAN_GAN[dayGZ.gan]] || '';
  let pengzuZhiStr = PENGZU_FULL[DI_ZHI[dayGZ.zhi]] || '';
  let pengzu = [pengzuGanStr, pengzuZhiStr].filter(Boolean);
  
  // 吉神
  let jishenList = calcJishen(yearGZ, monthGZ, dayGZ);
  // 凶神
  let xiongshenList = calcXiongshen(yearGZ, monthGZ, dayGZ);
  
  // 日空亡
  let kongWang = getDayKongWang(dayGZ.index);
  
  // 宜忌（基于建除+吉凶神）
  let yiList = JIAN_CHU_YI[jianchuName] || ['祭祀'];
  let jiList = JIAN_CHU_JI[jianchuName] || ['诸事不宜'];
  if (xiongshenList.indexOf('月破') !== -1) jiList = jiList.concat(['月破日不宜举大事']);
  
  // 事项对应用神
  let eventMap = {
    '嫁娶': {good:['天德','月德','三合','六合','天喜'], bad:['月破','月厌','劫煞','灾煞'], jianchu:['成','开','定']},
    '搬家': {good:['天德','月德','天恩','母仓'], bad:['月破','月煞','四击'], jianchu:['开','成','满']},
    '开业': {good:['天恩','月恩','母仓','圣心','益后'], bad:['月破','月厌','劫煞'], jianchu:['开','满','成']},
    '动土': {good:['天恩','月恩','母仓'], bad:['月破','月刑','月煞','劫煞','灾煞'], jianchu:['建','除','满']},
    '安葬': {good:['天德','月德','天恩','母仓'], bad:['月破','月厌','四击','往亡'], jianchu:['闭','收','除']},
    '出行': {good:['天恩','驿马','三合'], bad:['月破','月刑','往亡'], jianchu:['开','建','除']},
    '求职': {good:['天恩','月恩','圣心'], bad:['月破','天吏'], jianchu:['建','成','开']},
    '祈福': {good:['天德','月德','天恩','母仓','圣心'], bad:['月破','月厌'], jianchu:['开','定','满']}
  };
  let evtConfig = eventMap[event] || {good:[], bad:[], jianchu:[]};
  
  // 综合评分
  let score = 50;
  // 建除十二神
  let jcLuckMap = {'建':0,'除':1,'满':1,'平':0,'定':1,'执':0,'破':-1,'危':0,'成':1,'收':0,'开':1,'闭':-1};
  score += (jcLuckMap[jianchuName] || 0) * 10;
  // 建除匹配事项
  if (evtConfig.jianchu && evtConfig.jianchu.indexOf(jianchuName) !== -1) score += 15;
  // 黄道/黑道
  if (zhishenIsHuangdao) score += 10; else score -= 5;
  // 星宿吉凶
  if (xingxiuJixiong === '吉') score += 8;
  else if (xingxiuJixiong === '凶') score -= 8;
  // 吉神加分
  for (let i = 0; i < jishenList.length; i++) {
    score += 5;
    if (evtConfig.good && evtConfig.good.indexOf(jishenList[i]) !== -1) score += 8;
  }
  // 凶神减分
  for (let i = 0; i < xiongshenList.length; i++) {
    score -= 6;
    if (evtConfig.bad && evtConfig.bad.indexOf(xiongshenList[i]) !== -1) score -= 10;
  }
  score = Math.max(10, Math.min(100, score));
  
  // 专业分析
  let analysisParts = [];
  analysisParts.push('日柱' + TIAN_GAN[dayGZ.gan] + DI_ZHI[dayGZ.zhi] + '，建除' + jianchuName + '日，值神' + zhishen + '（' + (zhishenIsHuangdao ? '黄道' : '黑道') + '）。');
  analysisParts.push('星宿' + xingxiu.name + xingxiu.animal + '（' + xingxiuJixiong + '）。');
  if (jishenList.length > 0) analysisParts.push('吉神宜趋：' + jishenList.join('、') + '，利行事。');
  if (xiongshenList.length > 0) analysisParts.push('凶神宜忌：' + xiongshenList.join('、') + '，需谨慎。');
  if (evtConfig.good && evtConfig.good.length > 0) {
    let matched = jishenList.filter(function(j){return evtConfig.good.indexOf(j) !== -1;});
    if (matched.length > 0) analysisParts.push('与' + (event||'所选') + '事项相合吉神：' + matched.join('、') + '，大吉。');
  }
  if (evtConfig.bad && evtConfig.bad.length > 0) {
    let matchedBad = xiongshenList.filter(function(x){return evtConfig.bad.indexOf(x) !== -1;});
    if (matchedBad.length > 0) analysisParts.push('与' + (event||'所选') + '事项相冲凶神：' + matchedBad.join('、') + '，不利。');
  }
  if (xiongshenList.indexOf('月破') !== -1) analysisParts.push('月破日，大凶，不宜举大事。');
  analysisParts.push('空亡：' + kongWang + '，凡事难圆满。');
  let analysis = analysisParts.join('');
  
  // 建议/避免
  let suggestion = yiList.join('、') || '祭祀祈福';
  let avoid = jiList.join('、') || '诸事不宜';
  if (event && evtConfig.jianchu) {
    if (evtConfig.jianchu.indexOf(jianchuName) !== -1) {
      suggestion = '宜' + event + '（建除' + jianchuName + '日与' + event + '相合）';
    } else {
      avoid += '；' + event + '需另择吉日';
    }
  }
  
  let huangheiStr = zhishen + '(' + (zhishenIsHuangdao ? '黄道' : '黑道') + ')';
  
  return {
    date: Y + '年' + M + '月' + D + '日',
    ganzhi: TIAN_GAN[yearGZ.gan] + DI_ZHI[yearGZ.zhi] + '年 ' + TIAN_GAN[monthGZ.gan] + DI_ZHI[monthGZ.zhi] + '月 ' + TIAN_GAN[dayGZ.gan] + DI_ZHI[dayGZ.zhi] + '日',
    jianchu: jianchuName,
    xingxiu: xingxiu.name + xingxiu.animal + '(' + xingxiuJixiong + ')',
    chongsha: '冲' + chongshaInfo.chong + ' 煞' + chongshaInfo.sha,
    huanghei: huangheiStr,
    taishen: taiShen,
    pengzu: pengzu.join('；'),
    jishen: jishenList,
    xiongshen: xiongshenList,
    yi: yiList,
    ji: jiList,
    kongwang: kongWang,
    score: score,
    analysis: analysis,
    suggestion: suggestion,
    avoid: avoid
  };
}

const _origCalcJiuriScore = (typeof calcJiuriScore === 'function') ? calcJiuriScore : null;
function calcJiuriScore(stemIdx, branchIdx, dayDate) {
  // 基于传统规则评分（无硬编码日期、无Math.random）
  let Y = dayDate.getFullYear(), M = dayDate.getMonth()+1, D = dayDate.getDate();
  let yearGZ = getYearGanZhi(Y, M, D);
  let monthGZ = getMonthGanZhi(Y, M, D);
  let dayGZ = getDayGanZhi(Y, M, D);
  let score = 50;
  // 建除十二神
  let jcName = getJianChu(monthGZ.zhi, dayGZ.zhi);
  let jcLuckMap = {'建':0,'除':1,'满':1,'平':0,'定':1,'执':0,'破':-1,'危':0,'成':1,'收':0,'开':1,'闭':-1};
  score += (jcLuckMap[jcName] || 0) * 10;
  // 值神黄道/黑道
  let zs = getZhishen(dayGZ.gan, dayGZ.zhi);
  if (ZHISHEN_TYPE[zs]) score += 8; else score -= 4;
  // 星宿吉凶
  let xx = getXingXiu(Y, M, D);
  let xxJ = XINGXIU_JIXIONG[xx.name] || '平';
  if (xxJ === '吉') score += 6; else if (xxJ === '凶') score -= 6;
  // 吉神加分
  let js = calcJishen(yearGZ, monthGZ, dayGZ);
  score += js.length * 4;
  // 凶神减分
  let xs = calcXiongshen(yearGZ, monthGZ, dayGZ);
  score -= xs.length * 5;
  // 月破大凶
  if (xs.indexOf('月破') !== -1) score -= 15;
  return Math.max(1, Math.min(100, Math.round(score)));
}

// 全局注册
if (typeof window !== 'undefined') {
  window.liuyaoQiGua = liuyaoQiGua;
  window.liuyaoZhuangGua = liuyaoZhuangGua;
  window.liuyaoDuanGua = liuyaoDuanGua;
  window.ziweiPaiPan = ziweiPaiPan;
  window.ziweiAnalysis = ziweiAnalysis;
  window.qimenPaiPan = qimenPaiPan;
  window.qimenAnalyze = qimenAnalyze;
  window.getQimenReadingV2 = getQimenReadingV2;
  window.getYijingReadingV2 = getYijingReadingV2;
  window.meihuaQiGua = meihuaQiGua;
  window.meihuaAnalyze = meihuaAnalyze;
  window.liurenPaiPan = liurenPaiPan;
  window.liurenAnalyze = liurenAnalyze;
  window.xingmingAnalyze = xingmingAnalyze;
  window.fengshuiAnalyze = fengshuiAnalyze;
  window.zeriCalcFull = zeriCalcFull;
  window.calcJiuriScore = calcJiuriScore;

  // ===== 补充缺失的工具函数 =====
  function _gongliToGanZhi(year, month, day) {
    // 公历转干支（使用基准日期法）
    // 基准: 1900年1月31日（农历正月初一，干支甲子）
    const baseDate = new Date(1900, 0, 31);
    const targetDate = new Date(year, month - 1, day);
    const diffDays = Math.floor((targetDate - baseDate) / (24 * 60 * 60 * 1000));
    const ganIndex = (diffDays % 10 + 10) % 10;
    const zhiIndex = (diffDays % 12 + 12) % 12;
    let STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
    let BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
    return { gan: STEMS[ganIndex], zhi: BRANCHES[zhiIndex], ganZhi: STEMS[ganIndex] + BRANCHES[zhiIndex] };
  }
  window._gongliToGanZhi = _gongliToGanZhi;
}

// ========== UI 绑定函数 ==========

// 通用年度运势折叠面板生成器
function _buildAnnualFortunePanel(birthYear, birthMonth, birthDay, birthHour, sex) {
  if (typeof AnnualFortune === 'undefined' || !birthYear) return '';
  try {
    let isTransition = AnnualFortune.isYearTransitionPeriod();
    let targetYear = new Date().getFullYear();
    if (isTransition) targetYear += 1; // 跨年期生成次年
    let report = AnnualFortune.generateAnnualReport({year:birthYear, month:birthMonth||1, day:birthDay||1, hour:birthHour||12, sex:sex||'male'}, targetYear);
    let title = isTransition ? (targetYear + '年度祈福参拜与运势指南') : (targetYear + '年度运势指导');
    let html = '<div class="bazi-new-module">';
    html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🎊 ' + title + ' <span class="toggle-icon">▼</span></div>';
    html += '<div class="bazi-module-body collapsed">' + report + '</div>';
    html += '</div>';
    return html;
  } catch(e) { console.warn('AnnualFortune panel error:', e); return ''; }
}

function _showEngineResult(containerId, html) {
  let el = document.getElementById(containerId);
  if (!el) {
    el = document.createElement('div');
    el.id = containerId;
    el.className = 'engine-result-card';
    el.style.cssText = 'margin-top:16px;padding:20px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(0,0,0,0.3));border:1px solid rgba(201,168,76,0.25);border-radius:12px;font-size:13px;line-height:1.9;color:var(--ink);box-shadow:0 4px 20px rgba(0,0,0,0.15)';
    // Try to find parent panel to append to
    let panel = document.querySelector('.result.visible') || document.querySelector('.result') || document.getElementById('zhanbuContent');
    if (panel) panel.appendChild(el);
    else document.body.appendChild(el);
  }
  el.style.display = 'block';
  el.innerHTML = html;
  el.scrollIntoView({behavior:'smooth',block:'nearest'});
}

function runLiuyaoEngine() {
  try {
    // 确保结果区域可见
    let yjResult = document.getElementById('yjResult');
    if(yjResult) yjResult.classList.add('visible');
    let yjDiv = document.getElementById('yjDivArea');
    if(yjDiv) yjDiv.style.display = 'none';
    
    const now = new Date();
    const gua = liuyaoQiGua('time', {year:now.getFullYear(), month:now.getMonth()+1, day:now.getDate(), hour:now.getHours()});
    const gz = _gongliToGanZhi(now.getFullYear(), now.getMonth()+1, now.getDate());
    gua.dayGanZhi = gz;
    gua.monthZhi = _BRANCHES[_qyMod(now.getMonth()+1, 12)];
    const zg = liuyaoZhuangGua(gua, gz);
    gua.zhuangGua = zg;
    let question = yjQuestionText || '事业';
    gua.yjMode = yjMode || 'person'; // 传递自占/代占模式
    const duan = liuyaoDuanGua(gua, question);
    const ben = _GUA_XIANG[gua.benGua.lower].name + _GUA_XIANG[gua.benGua.upper].name;
    const bian = _GUA_XIANG[gua.bianGua.lower].name + _GUA_XIANG[gua.bianGua.upper].name;
    // 🎯 断卦结论总览
    let _summaryCard = '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
    _summaryCard += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:2px">🎯 断卦结论总览</div>';
    _summaryCard += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>所问：</b>' + question + ' &nbsp;|&nbsp; <b>本卦：</b>' + ben + ' &nbsp;|&nbsp; <b>变卦：</b>' + bian + '</div>';
    _summaryCard += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>用神：</b>' + duan.yongshen + ' &nbsp;|&nbsp; <b>旺衰：</b>' + (duan.yongshenWang ? '旺相（有利）' : '休囚（偏弱）') + (duan.xunKong ? ' · ⚠️旬空' : '') + '</div>';
    _summaryCard += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>断语：</b><span style="color:var(--gold);font-weight:600">' + duan.verdict + '</span></div>';
    _summaryCard += '<div style="font-size:12px;line-height:1.8;opacity:.8;margin-bottom:6px"><b>应期：</b>' + duan.yingqi + '</div>';
    _summaryCard += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b>建议：</b>' + duan.advice + '</div>';
    _summaryCard += '</div>';
    
    let html = '<h4 style="color:var(--gold)">☰ 六爻引擎演算结果</h4>';
    html += _summaryCard;
    html += '<p><b>本卦：</b>' + ben + '（' + gua.benGua.idx + '）</p>';
    html += '<p><b>变卦：</b>' + bian + '</p>';
    html += '<p><b>动爻：</b>' + (gua.dongYao.map(function(x){return '第'+(x+1)+'爻';}).join('、') || '无') + '</p>';
    html += '<p><b>宫：</b>' + zg.gongName + ' · ' + zg.gongWuxing + '（' + zg.gongName + '宫五行属' + zg.gongWuxing + '，影响卦象强弱）</p>';
    html += '<p><b>世应：</b>世' + (zg.shiying.shi+1) + '爻（代表自己）· 应' + (zg.shiying.ying+1) + '爻（代表对方/事体）</p>';
    html += '<p><b>六亲：</b>' + zg.liuqin.join(' · ') + '</p>';
    html += '<p><b>六神：</b>' + zg.liushen.join(' · ') + '（六神主吉凶氛围，青龙吉、白虎凶）</p>';
    html += '<p><b>用神：</b>' + duan.yongshen + ' · ' + duan.verdict + '</p>';
    html += '<p><b>应期：</b>' + duan.yingqi + '</p>';
    // 自占/代占世应分析
    if (duan.selfAnalysis) {
      html += '<p style="color:var(--cyan)"><b>身位分析：</b>' + duan.selfAnalysis + '</p>';
    }
    if (duan.shiAnalysis && duan.yingAnalysis) {
      html += '<p style="font-size:12px;opacity:.8"><b>世爻旺衰：</b>' + duan.shiAnalysis + '</p>';
      html += '<p style="font-size:12px;opacity:.8"><b>应爻旺衰：</b>' + duan.yingAnalysis + '</p>';
    }
    // 变卦六亲分析
    if (duan.bianAnalysis) {
      html += '<p style="color:var(--gold)"><b>变卦分析：</b>' + duan.bianAnalysis + '</p>';
    }
    html += '<p style="opacity:0.8">' + duan.advice + '</p>';
    // === 六爻排盘表 ===
    try {
      let _yaoNames = ['初', '二', '三', '四', '五', '上'];
      let _dongSym = {1:'老阳\\u25cb', 0:'少阳—'};
      // 本卦排盘
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">☰ 六爻排盘 · 本卦 — ' + ben + '</div>';
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
      html += '<tr style="background:rgba(201,168,76,0.08);color:var(--gold2)"><th style="padding:5px 8px">爻位</th><th>阴阳</th><th>纳甲</th><th>六亲</th><th>六神</th><th>世应</th><th>旺衰</th><th>动</th></tr>';
      // 计算变卦纳甲用于对照
      let _bianZg = null;
      try { _bianZg = liuyaoZhuangGua({benGua: gua.bianGua, dayGanZhi: gz}, gz); } catch(_be) {}
      for (let yi = 5; yi >= 0; yi--) {
        let _isDong = gua.dongYao.indexOf(yi) >= 0;
        let _isShi = (zg.shiying.shi === yi);
        let _isYing = (zg.shiying.ying === yi);
        let _yinYang = gua.lines[yi].line;
        let _najia = zg.tiangan[yi] + zg.dizhi[yi];
        let _lq = zg.liuqin[yi];
        let _ls = zg.liushen[yi];
        let _bg = _isDong ? 'rgba(231,76,60,0.06)' : (yi % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent');
        let _yaoZhi = zg.dizhi[yi];
        let _yaoWx = _zhiWuxing(_yaoZhi);
        let _monthWx = _zhiWuxing(gua.monthZhi || '子');
        let _yaoWS = '—';
        try {
          let _rel = _wuxingRelationTiYong(_monthWx, _yaoWx);
          let _rel2 = _wuxingRelationTiYong(_yaoWx, _monthWx);
          if (_yaoWx === _monthWx) _yaoWS = '旺';
          else if (_rel === '生') _yaoWS = '相';
          else if (_rel === '克') _yaoWS = '死';
          else if (_rel2 === '克') _yaoWS = '囚';
          else _yaoWS = '休';
        } catch(_we) { _yaoWS = '—'; }
        let _wsColor = _yaoWS === '旺' ? 'var(--jade2)' : _yaoWS === '相' ? 'var(--gold)' : _yaoWS === '死' ? 'var(--fire)' : _yaoWS === '囚' ? 'var(--orange)' : 'var(--muted)';
        html += '<tr style="background:' + _bg + ';border-bottom:1px solid rgba(255,255,255,0.03)">';
        html += '<td style="padding:5px 8px;text-align:center;color:var(--gold2)">' + _yaoNames[yi] + '爻</td>';
        html += '<td style="text-align:center">' + (_yinYang === '阳' ? '—— 阳' : '— — 阴') + (_isDong ? ' ○' : '') + '</td>';
        html += '<td style="text-align:center">' + _najia + '</td>';
        html += '<td style="text-align:center">' + _lq + '</td>';
        html += '<td style="text-align:center">' + _ls + '</td>';
        html += '<td style="text-align:center">' + (_isShi ? '<span style=\"color:var(--gold);font-weight:600\">世</span>' : _isYing ? '<span style=\"color:var(--jade2)\">应</span>' : '') + '</td>';
        html += '<td style="text-align:center;font-size:11px;color:' + _wsColor + '">' + _yaoWS + '</td>';
        html += '<td style="text-align:center">' + (_isDong ? '<span style=\"color:var(--cinn2)\">⚡动</span>' : '') + '</td>';
        html += '</tr>';
      }
      html += '</table></div>';
      // 宫位/日辰信息
      html += '<div style="padding:8px 16px;font-size:11px;opacity:.7;border-top:1px solid var(--border)">';
      html += '宫：' + zg.gongName + ' · ' + zg.gongWuxing + ' | 日干支：' + (gz.gan || '') + (gz.zhi || '') + ' | 月令：' + (gua.monthZhi || '');
      html += '</div></div>';
      // 本卦变卦对照
      if (_bianZg && gua.dongYao.length > 0) {
        html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
        html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">☰ 本卦 ↔ 变卦对照 — ' + bian + '</div>';
        html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
        html += '<tr style="background:rgba(201,168,76,0.08);color:var(--gold2)"><th style="padding:5px 8px">爻位</th><th>本卦纳甲</th><th>本卦六亲</th><th>→</th><th>变卦纳甲</th><th>变卦六亲</th><th>变化</th></tr>';
        for (let yi2 = 5; yi2 >= 0; yi2--) {
          let _isDong2 = gua.dongYao.indexOf(yi2) >= 0;
          let _benNJ = zg.tiangan[yi2] + zg.dizhi[yi2];
          let _bianNJ = _bianZg.tiangan[yi2] + _bianZg.dizhi[yi2];
          let _benLQ = zg.liuqin[yi2];
          let _bianLQ = _bianZg.liuqin[yi2];
          let _chg = _isDong2 ? (_benLQ === _bianLQ ? '同' : _benLQ + '→' + _bianLQ) : '—';
          html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">';
          html += '<td style="padding:5px 8px;text-align:center;color:var(--gold2)">' + _yaoNames[yi2] + '爻</td>';
          html += '<td style="text-align:center">' + _benNJ + '</td>';
          html += '<td style="text-align:center">' + _benLQ + '</td>';
          html += '<td style="text-align:center;color:var(--gold);opacity:.5">→</td>';
          html += '<td style="text-align:center">' + (_isDong2 ? _bianNJ : '—') + '</td>';
          html += '<td style="text-align:center">' + (_isDong2 ? _bianLQ : '—') + '</td>';
          html += '<td style="text-align:center;color:' + (_isDong2 ? 'var(--cinn2)' : 'var(--muted)') + '">' + _chg + '</td>';
          html += '</tr>';
        }
        html += '</table></div></div>';
      }
      // 用神分析详情
      if (duan.yongshenIdx >= 0) {
        let _ysIdx = duan.yongshenIdx;
        let _ysZhi = zg.dizhi[_ysIdx];
        let _ysWx = _zhiWuxing(_ysZhi);
        let _ysLq = zg.liuqin[_ysIdx];
        let _ysLs = zg.liushen[_ysIdx];
        let _ysShiYing = (zg.shiying.shi === _ysIdx) ? '世位' : (zg.shiying.ying === _ysIdx) ? '应位' : '闲位';
        let _ysDong = gua.dongYao.indexOf(_ysIdx) >= 0;
        html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
        html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🎯 用神分析详情</div>';
        html += '<div style="padding:12px 16px;font-size:12px;line-height:2">';
        html += '<div><span style="color:var(--gold2);font-weight:600">用神：</span>' + duan.yongshen + '（' + _ysLq + '·' + _ysZhi + '·' + _ysWx + '）</div>';
        html += '<div><span style="color:var(--gold2);font-weight:600">所在：</span>' + _yaoNames[_ysIdx] + '爻 · ' + _ysShiYing + ' · ' + (_ysDong ? '发动' : '安静') + '</div>';
        html += '<div><span style="color:var(--gold2);font-weight:600">六神：</span>' + _ysLs + '</div>';
        html += '<div><span style="color:var(--gold2);font-weight:600">旺衰：</span>' + (duan.yongshenWang ? '旺相' : '休囚') + (duan.xunKong ? ' · ⚠️旬空' : '') + '</div>';
        html += '<div><span style="color:var(--gold2);font-weight:600">状态：</span>' + duan.yongshenState + '</div>';
        if (duan.liuhe) html += '<div><span style="color:var(--gold2)">合：</span>用神逢合（日辰或月建合用神）</div>';
        if (duan.liuchong) html += '<div><span style="color:var(--cinn2)">冲：</span>用神被冲，事多变动</div>';
        if (duan.anDong && duan.anDong.length > 0) html += '<div><span style="color:var(--gold2)">暗动：</span>用神被日辰冲暗动</div>';
        if (duan.fuShen) html += '<div><span style="color:var(--gold2)">伏神：</span>伏藏于' + duan.fuShen.fuZhi + '</div>';
        if (duan.sanhe && duan.sanhe.length > 0) html += '<div><span style="color:var(--gold2)">三合：</span>' + duan.sanhe.map(function(s){return s.matched.join('')+'合'+s.wx+'局';}).join('、') + '</div>';
        html += '<div style="margin-top:6px;padding:8px 12px;background:rgba(46,204,113,0.04);border-radius:8px;color:var(--gold2)"><b>断语：</b>' + duan.verdict + '</div>';
        html += '<div style="margin-top:4px"><b>应期：</b>' + duan.yingqi + '</div>';
        html += '</div></div>';
        // 生克链路
        try {
          let _chainHtm = '<div style="margin-top:8px;padding:8px 12px;background:rgba(52,152,219,0.04);border-radius:8px;font-size:11px;line-height:1.8"><b style="color:var(--gold2)">生克链路：</b>';
          let _ysZhi2 = zg.dizhi[duan.yongshenIdx];
          let _ysWx2 = _zhiWuxing(_ysZhi2);
          let _shiZhi = zg.dizhi[zg.shiying.shi];
          let _shiWx = _zhiWuxing(_shiZhi);
          let _relShi = _wuxingRelationTiYong(_ysWx2, _shiWx);
          _chainHtm += '用神(' + _ysWx2 + ')→世爻(' + _shiWx + '): ' + (_relShi === '生' ? '生世（有益于我）' : _relShi === '克' ? '克世（压制我）' : _relShi === '同' ? '比和（同类相助）' : '无直接关系') + '；';
          if (gua.dongYao && gua.dongYao.length > 0) {
            for (let _di2 = 0; _di2 < gua.dongYao.length; _di2++) {
              let _dzhi = zg.dizhi[gua.dongYao[_di2]];
              let _dwx = _zhiWuxing(_dzhi);
              let _drel = _wuxingRelationTiYong(_dwx, _ysWx2);
              _chainHtm += '动爻(' + _dwx + ')→用神(' + _ysWx2 + '): ' + (_drel === '生' ? '生用神（有力）' : _drel === '克' ? '克用神（减力）' : _drel === '同' ? '比和（助用）' : '无直接关系') + '；';
            }
          }
          _chainHtm += '</div>';
          html += _chainHtm;
        } catch(_ce2) {}
        // 📋 缘主须知
        html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(46,204,113,0.06),rgba(46,204,113,0.01));border:1px solid rgba(46,204,113,0.15);border-radius:12px">';
        html += '<div style="font-size:14px;font-weight:700;color:var(--jade2);margin-bottom:8px;letter-spacing:2px">📋 缘主须知</div>';
        html += '<div style="font-size:12px;line-height:2;opacity:.9">';
        html += '<div>1. 用神' + (duan.yongshenWang ? '旺相，所问之事可成，顺势而为即可' : '休囚，所问之事多有阻碍，需等待时机或借助外力') + '。</div>';
        html += '<div>2. 应期在<b>' + duan.yingqi + '</b>前后，届时可重点关注事态变化。</div>';
        if (duan.xunKong) html += '<div>3. ⚠️ 用神旬空，当前事态尚不明朗，需填实之日方可定论。</div>';
        if (duan.liuchong) html += '<div>3. ⚠️ 用神被冲，事多变动，不宜急于求成。</div>';
        html += '<div>4. ' + duan.advice + '</div>';
        html += '<div>5. 心诚则灵，卦象为参考，切勿迷信盲从。行善积德自有福报。</div>';
        html += '</div></div>';
      }
    } catch(_pe) { console.warn('六爻排盘渲染错误:', _pe); }
    // === 六爻卦象爻线可视化 ===
    try {
      let _yaoPosName = ['初', '二', '三', '四', '五', '上'];
      let _yaoPosFull = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'];
      let _hasDong = gua.dongYao && gua.dongYao.length > 0;
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">☰ 卦象爻线可视化</div>';
      html += '<div style="padding:16px;display:flex;justify-content:center;gap:24px;flex-wrap:wrap">';
      // 渲染单个卦象
      function _renderYaoLines(lines, dongArr, title, isBian) {
        let s = '<div style="text-align:center">';
        s += '<div style="font-size:13px;color:var(--gold2);margin-bottom:10px;font-weight:600">' + title + '</div>';
        for (let yi = 5; yi >= 0; yi--) {
          let isYang = lines[yi] && (lines[yi].line === '阳' || lines[yi] === true || lines[yi] === 7 || lines[yi] === 9);
          let isDong = !isBian && dongArr && dongArr.indexOf(yi) >= 0;
          let yaoLabel = _yaoPosName[yi] + '爻';
          let yaoAttr = isYang ? '阳' : '阴';
          let zhi = zg.dizhi[yi] || '';
          let lq = zg.liuqin[yi] || '';
          let ls = zg.liushen[yi] || '';
          let shiYing = (zg.shiying.shi === yi) ? '世' : (zg.shiying.ying === yi) ? '应' : '';
          let rowBg = isDong ? 'rgba(231,76,60,0.06)' : 'transparent';
          s += '<div style="display:flex;align-items:center;justify-content:center;gap:8px;padding:3px 0;background:' + rowBg + ';border-radius:4px;margin:2px 0">';
          // 左侧标注
          s += '<div style="width:48px;text-align:right;font-size:11px;color:var(--gold2);opacity:.8">' + yaoLabel + '<br><span style="font-size:9px;opacity:.6">' + yaoAttr + '</span></div>';
          // 爻线
          if (isYang) {
            let lineColor = isDong ? 'var(--cinn2)' : 'var(--gold)';
            s += '<div style="width:80px;height:6px;background:' + lineColor + ';border-radius:2px;box-shadow:0 0 4px ' + (isDong ? 'rgba(231,76,60,0.4)' : 'rgba(201,168,76,0.3)') + '"></div>';
          } else {
            let lineColor2 = isDong ? 'var(--cinn2)' : 'var(--gold)';
            s += '<div style="width:80px;height:6px;display:flex;gap:6px"><div style="flex:1;background:' + lineColor2 + ';border-radius:2px;box-shadow:0 0 4px ' + (isDong ? 'rgba(231,76,60,0.4)' : 'rgba(201,168,76,0.3)') + '"></div><div style="flex:1;background:' + lineColor2 + ';border-radius:2px;box-shadow:0 0 4px ' + (isDong ? 'rgba(231,76,60,0.4)' : 'rgba(201,168,76,0.3)') + '"></div></div>';
          }
          // 动爻标记
          if (isDong) {
            let dongSym = isYang ? '○' : '×';
            s += '<div style="width:16px;font-size:14px;color:var(--cinn2);font-weight:700">' + dongSym + '</div>';
          } else {
            s += '<div style="width:16px"></div>';
          }
          // 右侧标注
          s += '<div style="width:72px;text-align:left;font-size:10px;line-height:1.4;color:var(--paper3);opacity:.85">';
          s += zhi + ' · ' + lq;
          if (ls) s += '<br>' + ls;
          if (shiYing) s += ' · <span style="color:' + (shiYing === '世' ? 'var(--gold)' : 'var(--jade2)') + ';font-weight:600">' + shiYing + '</span>';
          s += '</div>';
          s += '</div>';
        }
        s += '</div>';
        return s;
      }
      // 本卦
      let _benLinesData = gua.lines || [];
      html += _renderYaoLines(_benLinesData, gua.dongYao, '本卦 · ' + ben, false);
      // 变卦（如果有动爻）
      if (_hasDong) {
        html += '<div style="display:flex;align-items:center;color:var(--gold);font-size:20px;opacity:.5">→</div>';
        let _bianLinesData = gua.bianLines || [];
        // 变卦也需要纳甲信息
        let _bianZg = null;
        try { _bianZg = liuyaoZhuangGua({benGua: gua.bianGua, dayGanZhi: gz}, gz); } catch(_be2) {}
        if (_bianZg) {
          let _origZg = zg;
          // 临时替换zg以渲染变卦
          zg = _bianZg;
          html += _renderYaoLines(_bianLinesData, [], '变卦 · ' + bian, true);
          zg = _origZg;
        } else {
          html += _renderYaoLines(_bianLinesData, [], '变卦 · ' + bian, true);
        }
      }
      html += '</div>';
      // 图例
      html += '<div style="padding:6px 12px;font-size:10px;opacity:.6;text-align:center;border-top:1px solid var(--border)">';
      html += '阳爻━━━ · 阴爻━━ ━━ · ○阳动变阴 · ×阴动变阳 · 从下到上：初爻→上爻';
      html += '</div>';
      html += '</div>';
    } catch(_yve) { console.warn('六爻卦象可视化错误:', _yve); }
    // === 📖 64卦辞详解 ===
    try {
      let _benHexName = ben;
      let _bianHexName = bian;
      let _benHexData = _YJ_HEX_DATA[_benHexName];
      let _bianHexData = _YJ_HEX_DATA[_bianHexName];
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📖 卦辞详解</div>';
      html += '<div style="padding:12px 16px;font-size:12px;line-height:2">';
      if (_benHexData) {
        html += '<div style="margin-bottom:10px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
        html += '<div style="font-weight:700;color:var(--gold);margin-bottom:4px">本卦 · ' + _benHexName + '卦</div>';
        html += '<div style="color:var(--gold2)"><b>卦辞：</b>' + (_benHexData.summary || '') + '</div>';
        html += '<div style="opacity:.7;margin-top:2px"><b>释义：</b>' + (_benHexData.meaning || '') + '</div>';
        html += '</div>';
      }
      if (_bianHexData && _bianHexName !== _benHexName) {
        html += '<div style="margin-bottom:10px;padding:10px;background:rgba(231,76,60,0.04);border-radius:8px">';
        html += '<div style="font-weight:700;color:var(--fire2);margin-bottom:4px">变卦 · ' + _bianHexName + '卦</div>';
        html += '<div style="color:var(--gold2)"><b>卦辞：</b>' + (_bianHexData.summary || '') + '</div>';
        html += '<div style="opacity:.7;margin-top:2px"><b>释义：</b>' + (_bianHexData.meaning || '') + '</div>';
        html += '</div>';
      }
      html += '</div></div>';
    } catch(_gce) { console.warn('卦辞详解渲染错误:', _gce); }
    // === 📋 六爻白话解读 ===
    try {
      let _lyPlain = '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">📋 六爻白话解读 <span class="toggle-icon">▼</span></div>';
      _lyPlain += '<div class="bazi-module-body" style="display:none">';
      // 本卦白话
      _lyPlain += '<div style="margin-bottom:14px;padding:12px;background:rgba(0,0,0,0.15);border-radius:8px">';
      _lyPlain += '<div style="font-weight:700;color:var(--gold);margin-bottom:8px">本卦 · ' + ben + '</div>';
      let _benGuaMeaning = (_GUA_XIANG[gua.benGua.lower] && _GUA_XIANG[gua.benGua.lower].meaning) || '';
      let _benGuaSummary = (_GUA_XIANG[gua.benGua.lower] && _GUA_XIANG[gua.benGua.lower].summary) || '';
      _lyPlain += '<div style="font-size:13px;line-height:1.8">' + (_benGuaSummary || '本卦反映当前事态') + '</div>';
      if (_benGuaMeaning) _lyPlain += '<div style="font-size:12px;opacity:.7;margin-top:4px">' + _benGuaMeaning + '</div>';
      _lyPlain += '</div>';
      // 变卦白话
      if (bian !== ben) {
        _lyPlain += '<div style="margin-bottom:14px;padding:12px;background:rgba(0,0,0,0.15);border-radius:8px">';
        _lyPlain += '<div style="font-weight:700;color:var(--gold);margin-bottom:8px">变卦 · ' + bian + '</div>';
        let _bianGuaMeaning2 = (_GUA_XIANG[gua.bianGua.lower] && _GUA_XIANG[gua.bianGua.lower].meaning) || '';
        let _bianGuaSummary2 = (_GUA_XIANG[gua.bianGua.lower] && _GUA_XIANG[gua.bianGua.lower].summary) || '';
        _lyPlain += '<div style="font-size:13px;line-height:1.8">' + (_bianGuaSummary2 || '变卦反映事态走向') + '</div>';
        if (_bianGuaMeaning2) _lyPlain += '<div style="font-size:12px;opacity:.7;margin-top:4px">' + _bianGuaMeaning2 + '</div>';
        _lyPlain += '</div>';
      }
      // 用神旺衰白话
      _lyPlain += '<div style="margin-bottom:14px;padding:12px;background:rgba(0,0,0,0.15);border-radius:8px">';
      _lyPlain += '<div style="font-weight:700;color:var(--gold);margin-bottom:8px">用神分析</div>';
      _lyPlain += '<div style="font-size:13px;line-height:1.8">所测事物为<b>' + duan.yongshen + '</b>，' + (duan.yongshenWang ? '当前旺相，说明事情有利、时机成熟，可以积极推进。' : '当前休囚偏弱，说明条件尚不充分，需要等待时机或借助外力。') + (duan.xunKong ? ' 但用神旬空，表示事情尚有虚浮不实之处，需注意落实。' : '') + '</div>';
      _lyPlain += '</div>';
      // 断语白话
      _lyPlain += '<div style="margin-bottom:14px;padding:12px;background:rgba(0,0,0,0.15);border-radius:8px">';
      _lyPlain += '<div style="font-weight:700;color:var(--gold);margin-bottom:8px">综合判断</div>';
      _lyPlain += '<div style="font-size:13px;line-height:1.8">' + duan.verdict + '</div>';
      if (duan.yingqi) _lyPlain += '<div style="font-size:12px;opacity:.7;margin-top:4px">应期：' + duan.yingqi + '</div>';
      _lyPlain += '</div>';
      // 建议白话
      _lyPlain += '<div style="margin-bottom:14px;padding:12px;background:rgba(0,0,0,0.15);border-radius:8px">';
      _lyPlain += '<div style="font-weight:700;color:var(--gold);margin-bottom:8px">行动建议</div>';
      _lyPlain += '<div style="font-size:13px;line-height:1.8">' + duan.advice + '</div>';
      _lyPlain += '</div>';
      _lyPlain += '</div>';
      html += _lyPlain;
    } catch(_lye) { console.warn('六爻白话解读错误:', _lye); }
    // === 📝 术语注释 ===
    try {
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📝 术语注释</div>';
      html += '<div style="padding:12px 16px;font-size:11px;line-height:2;opacity:.85">';
      html += '<div><b style="color:var(--gold2)">纳甲：</b>将天干地支配入六爻，干支所属五行与卦宫五行论生克，为六爻核心排盘法。</div>';
      html += '<div><b style="color:var(--gold2)">六亲：</b>父母、兄弟、子孙、妻财、官鬼，以卦宫五行为主，按五行生克关系确定各爻六亲，代表所测事物类别。</div>';
      html += '<div><b style="color:var(--gold2)">六神：</b>青龙、朱雀、勾陈、螣蛇、白虎、玄武，按日干遁排，主吉凶氛围与事象特征。</div>';
      html += '<div><b style="color:var(--gold2)">世应：</b>世爻代表求测者自身，应爻代表对方或所测之事。世应相生则吉，相克则凶。</div>';
      html += '<div><b style="color:var(--gold2)">用神：</b>根据所测事项选取的六亲爻位。如测财取妻财，测官取官鬼，测父母取父母。</div>';
      html += '<div><b style="color:var(--gold2)">旬空：</b>甲子旬中戌亥空，甲戌旬中申酉空等。用神逢空则事尚不明，填实之日方有定论。</div>';
      html += '<div><b style="color:var(--gold2)">旺衰：</b>以月令为标准，与月令同行为旺，月令生之为相，生月令为休，克月令为囚，月令克之为死。旺相有力，休囚死无力。</div>';
      html += '<div><b style="color:var(--gold2)">动爻：</b>阳动变阴（○），阴动变阳（×）。动爻代表变化所在，动则有变，变则事情有转折。</div>';
      html += '</div></div>';
    } catch(_gte) { console.warn('术语注释渲染错误:', _gte); }
    // === 化解方案与开运建议 ===
    try {
      let _cureHtml = getLiuyaoResolution(gua, duan);
      if (_cureHtml && _cureHtml.trim()) {
        html += '<div class="bazi-new-module">';
        html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔮 化解方案与开运建议 <span class="toggle-icon">▼</span></div>';
        html += '<div class="bazi-module-body collapsed"><div id="liuyao-cure-result">' + _cureHtml + '</div></div>';
        html += '</div>';
      }
    } catch(_ce) { console.warn('六爻化解引擎错误:', _ce); }
    _showEngineResult('yjEngineResult', html);
    // === V3引擎校准 ===
    try {
      if (window.LiuyaoV3 && LiuyaoV3.analyzeLiuyao) {
        let v3Yj = [7,7,7,7,7,7];
        if (gua.lines && gua.lines.length >= 6) {
          for (let yi = 0; yi < 6; yi++) { v3Yj[yi] = gua.lines[yi].line === '阳' ? 7 : 8; }
        }
        if (gua.dongYao) {
          for (let dyi = 0; dyi < gua.dongYao.length; dyi++) {
            let dyIdx = gua.dongYao[dyi];
            v3Yj[dyIdx] = v3Yj[dyIdx] === 7 ? 9 : 6;
          }
        }
        let gz2 = _gongliToGanZhi(now.getFullYear(), now.getMonth()+1, now.getDate());
        let v3LiuResult = LiuyaoV3.analyzeLiuyao({ yjVals: v3Yj, dayGan: gz2.gan, dayZhi: gz2.zhi, topicType: question || '事业' });
        let v3LiuHtml = '<div class="bazi-new-module">';
        v3LiuHtml += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔬 V3校准版六爻 <span class="toggle-icon">▼</span></div>';
        v3LiuHtml += '<div class="bazi-module-body collapsed">';
        if (v3LiuResult.hexagram) {
          v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3LiuHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">卦象（V3）</div>';
          v3LiuHtml += '<div style="font-size:13px;line-height:1.8">本卦：<strong>' + (v3LiuResult.hexagram.name || '-') + '</strong></div>';
          if (v3LiuResult.hexagram.bianName) v3LiuHtml += '<div style="font-size:13px">变卦：<strong>' + v3LiuResult.hexagram.bianName + '</strong></div>';
          v3LiuHtml += '</div>';
        }
        if (v3LiuResult.yaos && v3LiuResult.yaos.length > 0) {
          v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3LiuHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">六爻详情（V3）</div>';
          for (let yai = 0; yai < v3LiuResult.yaos.length; yai++) {
            let yao = v3LiuResult.yaos[yai];
            v3LiuHtml += '<div style="font-size:12px;padding:3px 0;border-bottom:1px solid rgba(255,255,255,0.03)">';
            v3LiuHtml += '<strong>' + yao.name + '爻</strong> ';
            v3LiuHtml += yao.yang ? '阳' : '阴';
            if (yao.moving) v3LiuHtml += ' <span style="color:var(--cinn2)">○ 动</span>';
            v3LiuHtml += ' | ' + (yao.gan || '') + (yao.zhi || '');
            v3LiuHtml += ' | ' + (yao.liuqin || '');
            v3LiuHtml += ' | ' + (yao.liushen || '');
            v3LiuHtml += '</div>';
          }
          v3LiuHtml += '</div>';
        }
        if (v3LiuResult.yongshenInfo) {
          v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3LiuHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">用神分析（V3）</div>';
          v3LiuHtml += '<div style="font-size:12px;line-height:1.8">' + (v3LiuResult.yongshenInfo.name || '') + '：' + (v3LiuResult.yongshenInfo.desc || '') + '</div>';
          v3LiuHtml += '</div>';
        }
        if (v3LiuResult.verdict) {
          v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(46,204,113,0.04);border-radius:8px">';
          v3LiuHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">断语（V3）</div>';
          v3LiuHtml += '<div style="font-size:12px;line-height:1.8">' + v3LiuResult.verdict + '</div>';
          v3LiuHtml += '</div>';
        }
        // R1.6: 元神忌神仇神
        try {
          if (v3LiuResult.yuanJiChou) {
            let yjc = v3LiuResult.yuanJiChou;
            v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(155,89,182,0.04);border-radius:8px">';
            v3LiuHtml += '<div style="font-size:12px;color:var(--violet);margin-bottom:6px">🔮 元神忌神仇神</div>';
            let _spirits = [
              {key:'yuanShen',label:'元神',color:'var(--jade)',data:yjc.yuanShen},
              {key:'jiShen',label:'忌神',color:'var(--cinn2)',data:yjc.jiShen},
              {key:'chouShen',label:'仇神',color:'var(--warn)',data:yjc.chouShen}
            ];
            for (let sp=0; sp<_spirits.length; sp++) {
              let sd = _spirits[sp].data;
              if (!sd) continue;
              v3LiuHtml += '<div style="font-size:11px;margin-bottom:4px;padding:4px 6px;background:rgba(255,255,255,.02);border-radius:4px">';
              v3LiuHtml += '<span style="color:'+_spirits[sp].color+';font-weight:bold">'+_spirits[sp].label+'</span> ';
              v3LiuHtml += '<span style="color:var(--paper2)">'+(sd.name||'')+'('+sd.wuxing+') '+(sd.yaoPos||'不上卦')+'</span> ';
              if (sd.wangShuai) v3LiuHtml += '<span style="color:var(--steel)">'+sd.wangShuai+'</span> ';
              if (sd.moving) v3LiuHtml += '<span style="color:var(--cinn2)">动</span>';
              if (sd.text) v3LiuHtml += '<div style="font-size:10px;color:var(--paper3);margin-left:8px">'+sd.text+'</div>';
              v3LiuHtml += '</div>';
            }
            if (v3LiuResult.yuanJiSummary) v3LiuHtml += '<div style="font-size:11px;color:var(--gold);margin-top:4px;line-height:1.6">'+v3LiuResult.yuanJiSummary+'</div>';
            v3LiuHtml += '</div>';
          }
        } catch(eLy1) {}
        // R2.7: 月令旺衰+旬空
        try {
          if (v3LiuResult.monthWangShuai || v3LiuResult.kongWang) {
            v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(52,152,219,0.04);border-radius:8px">';
            v3LiuHtml += '<div style="font-size:12px;color:var(--cyan2);margin-bottom:6px">📅 月令旺衰与旬空</div>';
            if (v3LiuResult.monthWangShuai) {
              let mw = v3LiuResult.monthWangShuai;
              v3LiuHtml += '<div style="font-size:11px;color:var(--paper2);line-height:1.6">月建'+(mw.monthBranch||'')+'('+(mw.monthEle||'')+') → 用神'+(mw.wangShuai||'')+'</div>';
              if (mw.desc) v3LiuHtml += '<div style="font-size:10px;color:var(--paper3);margin-left:8px">'+mw.desc+'</div>';
            }
            if (v3LiuResult.kongWang) {
              let kw = v3LiuResult.kongWang;
              v3LiuHtml += '<div style="font-size:11px;color:var(--warn);margin-top:4px">旬空：'+(kw.xunKong||'').split('').join('、')+'</div>';
              if (kw.yaos && kw.yaos.length > 0) {
                for (let kwi=0; kwi<kw.yaos.length; kwi++) {
                  let kwy = kw.yaos[kwi];
                  v3LiuHtml += '<div style="font-size:10px;color:var(--steel);margin-left:8px">第'+kwy.pos+'爻('+kwy.branch+')空亡'+(kwy.isZhenKong?'【真空】':'【假空】')+'</div>';
                }
              }
            }
            v3LiuHtml += '</div>';
          }
        } catch(eLy2) {}
        // R2.8: 六冲六合+伏神飞神
        try {
          if (v3LiuResult.chongHe || v3LiuResult.fuFei) {
            v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(231,76,60,0.04);border-radius:8px">';
            v3LiuHtml += '<div style="font-size:12px;color:var(--cinn2);margin-bottom:6px">⚔ 六冲六合与伏飞神</div>';
            if (v3LiuResult.chongHe) {
              let ch = v3LiuResult.chongHe;
              v3LiuHtml += '<div style="font-size:11px;color:var(--paper2);line-height:1.6">'+(ch.desc||ch.type||'')+'</div>';
            }
            if (v3LiuResult.fuFei) {
              let ff = v3LiuResult.fuFei;
              if (ff.desc) v3LiuHtml += '<div style="font-size:11px;color:var(--paper2);margin-top:4px;line-height:1.6">'+ff.desc+'</div>';
              if (ff.fuShen) v3LiuHtml += '<div style="font-size:10px;color:var(--steel);margin-left:8px">伏神：'+ff.fuShen+'('+ (ff.fuEle||'') +')</div>';
              if (ff.feiShen) v3LiuHtml += '<div style="font-size:10px;color:var(--steel);margin-left:8px">飞神：'+ff.feiShen+'('+ (ff.feiEle||'') +')</div>';
              if (ff.relation) v3LiuHtml += '<div style="font-size:10px;color:var(--warn);margin-left:8px">'+ff.relation+'</div>';
            }
            v3LiuHtml += '</div>';
          }
        } catch(eLy3) {}
        // R2.9: 动爻化进退+暗动
        try {
          if (v3LiuResult.dongYaoAnalysis) {
            let dy = v3LiuResult.dongYaoAnalysis;
            v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(243,156,18,0.04);border-radius:8px">';
            v3LiuHtml += '<div style="font-size:12px;color:var(--warn);margin-bottom:6px">⚡ 动爻化进化退与暗动</div>';
            if (dy.movingYaos && dy.movingYaos.length > 0) {
              for (let myi=0; myi<dy.movingYaos.length; myi++) {
                let my = dy.movingYaos[myi];
                v3LiuHtml += '<div style="font-size:10px;color:var(--paper2);margin-bottom:3px">第'+my.pos+'爻 '+my.fromBranch+'→'+my.toBranch+' <span style="color:'+(my.huaType.indexOf('进')>=0?'var(--jade)':my.huaType.indexOf('退')>=0?'var(--cinn2)':'var(--warn)')+'">'+my.huaType+'</span>'+(my.desc?' — '+my.desc:'')+'</div>';
              }
            }
            if (dy.anDongYaos && dy.anDongYaos.length > 0) {
              v3LiuHtml += '<div style="font-size:11px;color:var(--violet);margin-top:4px">暗动爻：</div>';
              for (let ayi=0; ayi<dy.anDongYaos.length; ayi++) {
                let ay = dy.anDongYaos[ayi];
                v3LiuHtml += '<div style="font-size:10px;color:var(--steel);margin-left:8px">第'+ay.pos+'爻('+ay.branch+') 被日支'+ay.dayBranch+'冲 → 暗动'+(ay.desc?' — '+ay.desc:'')+'</div>';
              }
            }
            if (dy.summary) v3LiuHtml += '<div style="font-size:11px;color:var(--gold);margin-top:4px;line-height:1.6">'+dy.summary+'</div>';
            v3LiuHtml += '</div>';
          }
        } catch(eLy4) {}
        // R3.3: 应期判断
        try {
          if (v3LiuResult.yingqi) {
            let yq = v3LiuResult.yingqi;
            v3LiuHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(39,174,96,0.04);border-radius:8px">';
            v3LiuHtml += '<div style="font-size:12px;color:var(--jade);margin-bottom:6px">⏰ 应期判断</div>';
            if (yq.rules && yq.rules.length > 0) {
              for (let yqi=0; yqi<yq.rules.length; yqi++) {
                v3LiuHtml += '<div style="font-size:10px;color:var(--paper2);line-height:1.5">• '+yq.rules[yqi]+'</div>';
              }
            }
            if (yq.nearFar) v3LiuHtml += '<div style="font-size:11px;color:var(--cyan2);margin-top:4px">远近：'+yq.nearFar+'</div>';
            if (yq.summary) v3LiuHtml += '<div style="font-size:11px;color:var(--gold);margin-top:4px;line-height:1.6">'+yq.summary+'</div>';
            v3LiuHtml += '</div>';
          }
        } catch(eLy5) {}
        v3LiuHtml += '<div style="text-align:center;font-size:10px;opacity:.3;letter-spacing:2px;margin-top:8px">⚡ Powered by LiuyaoV3 Engine</div>';
        v3LiuHtml += '</div></div>';
        let yjResultEl = document.getElementById('yjResult') || document.getElementById('yjEngineResult');
        if (yjResultEl) yjResultEl.insertAdjacentHTML('beforeend', v3LiuHtml);
      }
    } catch(e4) { console.warn('LiuyaoV3 error:', e4); }
  } catch(e) { showToast('六爻引擎错误：'+e.message); }
}

function _getSeasonStrength(wx) {
  let month = new Date().getMonth();
  let season;
  if (month >= 2 && month <= 4) season = '木';
  else if (month >= 5 && month <= 7) season = '火';
  else if (month >= 8 && month <= 10) season = '金';
  else season = '水';
  if (wx === season) return '旺';
  let sheng = {'水':'木','木':'火','火':'土','土':'金','金':'水'};
  if (sheng[season] === wx) return '相';
  if (sheng[wx] === season) return '休';
  let ke = {'水':'火','火':'金','金':'木','木':'土','土':'水'};
  if (ke[season] === wx) return '死';
  if (ke[wx] === season) return '囚';
  return '平';
}
function runMeihuaEngine() {
  try {
    let mhResult = document.getElementById('mhResult');
    if(mhResult) mhResult.classList.add('visible');
    const n1 = parseInt(document.getElementById('mhNum1')?.value || '1');
    const n2 = parseInt(document.getElementById('mhNum2')?.value || '1');
    const n3 = parseInt(document.getElementById('mhNum3')?.value || '1');
    const gua = meihuaQiGua('number', {n1:n1, n2:n2, n3:n3});
    const analyze = meihuaAnalyze(gua, '所问之事');
    const ben = _GUA_XIANG[gua.benGua.lower].name + _GUA_XIANG[gua.benGua.upper].name;
    const bian = _GUA_XIANG[gua.bianGua.lower].name + _GUA_XIANG[gua.bianGua.upper].name;
        // 🎯 排盘结论总览
    let _mhSummary = '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
    _mhSummary += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:2px">🎯 排盘结论总览</div>';
    _mhSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>本卦：</b>' + ben + ' → <b>变卦：</b>' + bian + '（第' + (gua.dongYao+1) + '爻动）</div>';
    _mhSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>体卦：</b>' + analyze.tiGua + '（代表自己）· <b>用卦：</b>' + analyze.yongGua + '（代表所问之事）</div>';
    _mhSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>体用关系：</b>' + analyze.relation + ' → <b>终局：</b>' + (analyze.endRelation||'') + '</div>';
    _mhSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>综合断语：</b><span style="color:var(--gold);font-weight:600">' + analyze.verdict + '</span></div>';
    _mhSummary += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b>建议：</b>' + (analyze.advice || '卦象仅供参考，心正则卦灵。') + '</div>';
    _mhSummary += '</div>';
    let html = '<h4 style="color:var(--jade2)">🌸 梅花引擎演算结果</h4>';
    html += _mhSummary;
    html += '<p><b>本卦：</b>' + ben + ' · 动爻第'+(gua.dongYao+1)+'爻</p>';
    html += '<p><b>变卦：</b>' + bian + '</p>';
    html += '<p><b>体卦：</b>' + analyze.tiGua + ' · <b>用卦：</b>' + analyze.yongGua + '</p>';
    html += '<p><b>体用关系：</b>' + analyze.relation + '</p>';
    html += '<p><b>初断：</b>' + analyze.initial + '</p>';
    html += '<p><b>终局：</b>' + analyze.endRelation + '</p>';
    html += '<p><b>综合：</b>' + analyze.verdict + '</p>';
    html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
    // === 梅花卦象图示 ===
    try {
      let _mhYaoNames = ['初', '二', '三', '四', '五', '上'];
      let _benLines = gua.lines || [];
      let _bianLines = gua.bianLines || [];
      let _dongIdx = gua.dongYao;
      // 卦象阴阳图示
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🌸 卦象图示</div>';
      html += '<div style="padding:16px;display:flex;justify-content:center;gap:32px;flex-wrap:wrap">';
      // 本卦
      html += '<div style="text-align:center">';
      let _tiLabel = (_dongIdx >= 3) ? '（上卦=体）' : '（下卦=体）';
      html += '<div style="font-size:13px;color:var(--jade2);margin-bottom:8px;font-weight:600">本卦 ' + ben + ' <span style="font-size:11px;color:var(--gold)">' + _tiLabel + '</span></div>';
      for (let mi = 5; mi >= 0; mi--) {
        let _isYang = _benLines[mi] && _benLines[mi].line === '阳';
        let _isDong = (mi === _dongIdx);
        html += '<div style="font-size:18px;letter-spacing:2px;padding:2px 0;color:' + (_isDong ? 'var(--cinn2)' : 'var(--paper)') + '">' + (_isYang ? '▬▬▬' : '▬ ▬') + (_isDong ? ' ○' : '') + '</div>';
      }
      html += '<div style="font-size:11px;opacity:.6;margin-top:6px">动爻：第' + (_dongIdx+1) + '爻（动爻所在卦为用卦）</div>';
      html += '</div>';
      // 箭头
      html += '<div style="display:flex;align-items:center;color:var(--gold);font-size:20px">→</div>';
      // 变卦
      html += '<div style="text-align:center">';
      html += '<div style="font-size:13px;color:var(--gold2);margin-bottom:8px;font-weight:600">变卦 ' + bian + '</div>';
      for (let mi2 = 5; mi2 >= 0; mi2--) {
        let _bIsYang = _bianLines[mi2] && _bianLines[mi2].line === '阳';
        let _bWasDong = (mi2 === _dongIdx);
        html += '<div style="font-size:18px;letter-spacing:2px;padding:2px 0;color:' + (_bWasDong ? 'var(--cinn2)' : 'var(--paper)') + '">' + (_bIsYang ? '▬▬▬' : '▬ ▬') + (_bWasDong ? ' ✕' : '') + '</div>';
      }
      html += '<div style="font-size:11px;opacity:.6;margin-top:6px">变第' + (_dongIdx+1) + '爻</div>';
      html += '</div>';
      html += '</div></div>';
      // 体用分析表
      let _tiIdx = (_dongIdx >= 3) ? gua.benGua.upper : gua.benGua.lower;
      let _yongIdx = (_dongIdx >= 3) ? gua.benGua.lower : gua.benGua.upper;
      let _tiWx = _GUA_XIANG[_tiIdx] ? _GUA_XIANG[_tiIdx].wuxing : '';
      let _yongWx = _GUA_XIANG[_yongIdx] ? _GUA_XIANG[_yongIdx].wuxing : '';
      let _huTi = (_dongIdx >= 3) ? gua.huGua.upper : gua.huGua.lower;
      let _huYong = (_dongIdx >= 3) ? gua.huGua.lower : gua.huGua.upper;
      let _huTiWx = _GUA_XIANG[_huTi] ? _GUA_XIANG[_huTi].wuxing : _tiWx;
      let _huYongWx = _GUA_XIANG[_huYong] ? _GUA_XIANG[_huYong].wuxing : _yongWx;
      let _bianYongIdx = (_dongIdx >= 3) ? gua.bianGua.lower : gua.bianGua.upper;
      let _bianYongWx = _GUA_XIANG[_bianYongIdx] ? _GUA_XIANG[_bianYongIdx].wuxing : _yongWx;
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📊 体用分析表</div>';
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
      html += '<tr style="background:rgba(201,168,76,0.08);color:var(--gold2)"><th style="padding:5px 8px">类别</th><th>卦名</th><th>五行</th><th>与体卦关系</th><th>吉凶</th><th>时令旺衰</th></tr>';
      // 体卦
      let _tiRel = '本身';
      let _tiLuck = '—';
      let _tiSeason = _getSeasonStrength(_tiWx);
      html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)"><td style="padding:5px 8px;text-align:center;color:var(--gold2)">体卦</td><td style="text-align:center">' + analyze.tiGua + '</td><td style="text-align:center">' + _tiWx + '</td><td style="text-align:center">' + _tiRel + '</td><td style="text-align:center">' + _tiLuck + '</td><td style="text-align:center;font-size:11px">' + _tiSeason + '</td></tr>';
      // 用卦
      let _yongRel = analyze.relation;
      let _yongLuck = (_yongRel === '生我' || _yongRel === '比和') ? '吉' : (_yongRel === '克我' ? '凶' : '耗');
      let _yongSeason = _getSeasonStrength(_yongWx);
      html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)"><td style="padding:5px 8px;text-align:center;color:var(--gold2)">用卦</td><td style="text-align:center">' + analyze.yongGua + '</td><td style="text-align:center">' + _yongWx + '</td><td style="text-align:center">' + _yongRel + '</td><td style="text-align:center;color:' + (_yongLuck === '吉' ? 'var(--jade2)' : _yongLuck === '凶' ? 'var(--cinn2)' : 'var(--orange)') + '">' + _yongLuck + '</td><td style="text-align:center;font-size:11px">' + _yongSeason + '</td></tr>';
      // 互卦
      if (gua.huGua) {
        let _huRel = _wuxingRelationTiYong(_tiWx, _huYongWx);
        let _huLuck = (_huRel === '生我' || _huRel === '比和') ? '吉' : (_huRel === '克我' ? '凶' : '耗');
        let _huName = (_GUA_XIANG[gua.huGua.lower] ? _GUA_XIANG[gua.huGua.lower].name : '?') + (_GUA_XIANG[gua.huGua.upper] ? _GUA_XIANG[gua.huGua.upper].name : '?');
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)"><td style="padding:5px 8px;text-align:center;color:var(--gold2)">互卦</td><td style="text-align:center">' + _huName + '</td><td style="text-align:center">' + _huYongWx + '</td><td style="text-align:center">' + _huRel + '</td><td style="text-align:center;color:' + (_huLuck === '吉' ? 'var(--jade2)' : _huLuck === '凶' ? 'var(--cinn2)' : 'var(--orange)') + '">' + _huLuck + '</td></tr>';
      }
      // 变卦
      let _bianRel = analyze.endRelation;
      let _bianLuck = (_bianRel === '生我' || _bianRel === '比和') ? '吉' : (_bianRel === '克我' ? '凶' : '耗');
      html += '<tr><td style="padding:5px 8px;text-align:center;color:var(--gold2)">变卦</td><td style="text-align:center">' + bian + '</td><td style="text-align:center">' + _bianYongWx + '</td><td style="text-align:center">' + _bianRel + '</td><td style="text-align:center;color:' + (_bianLuck === '吉' ? 'var(--jade2)' : _bianLuck === '凶' ? 'var(--cinn2)' : 'var(--orange)') + '">' + _bianLuck + '</td></tr>';
      html += '</table></div></div>';
      // 断卦逻辑链
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🔗 断卦逻辑链</div>';
      html += '<div style="padding:12px 16px;font-size:12px;line-height:2.2">';
      html += '<div style="padding:6px 10px;background:rgba(46,204,113,0.04);border-radius:8px;margin-bottom:6px"><span style="color:var(--jade2);font-weight:600">① 体用生克：</span>' + analyze.relation + ' — ' + analyze.initial + '</div>';
      if (analyze.huAnalysis) {
        html += '<div style="padding:6px 10px;background:rgba(201,168,76,0.04);border-radius:8px;margin-bottom:6px"><span style="color:var(--gold2);font-weight:600">② 互卦影响：</span>' + analyze.huAnalysis + '</div>';
      }
      html += '<div style="padding:6px 10px;background:rgba(142,68,173,0.04);border-radius:8px;margin-bottom:6px"><span style="color:var(--violet2);font-weight:600">③ 变卦结果：</span>' + analyze.endRelation + ' — ' + (analyze.endResult || '') + '</div>';
      html += '<div style="padding:6px 10px;background:rgba(231,76,60,0.04);border-radius:8px"><span style="color:var(--cinn2);font-weight:600">④ 综合判断：</span><span style="color:var(--gold);font-weight:600">' + analyze.verdict + '</span> — ' + analyze.advice + '</div>';
      html += '</div></div>';
    } catch(_mpe) { console.warn('梅花排盘渲染错误:', _mpe); }
    // === 应期判断 ===
    try {
      let _yingqi = '动爻之数或冲合之日';
      let _dongWx = _GUA_XIANG[_dongIdx >= 3 ? gua.benGua.upper : gua.benGua.lower] ? _GUA_XIANG[_dongIdx >= 3 ? gua.benGua.upper : gua.benGua.lower].wuxing : '';
      let _seasonHint = '';
      let _nowMonth = new Date().getMonth();
      if (_dongWx === '木') _seasonHint = '（春季寅卯月应）';
      else if (_dongWx === '火') _seasonHint = '（夏季巳午月应）';
      else if (_dongWx === '金') _seasonHint = '（秋季申酉月应）';
      else if (_dongWx === '水') _seasonHint = '（冬季亥子月应）';
      else if (_dongWx === '土') _seasonHint = '（辰戌丑未月应）';
      html += '<div style="margin:12px 0;padding:10px 14px;background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.1);border-radius:8px">';
      html += '<div style="font-size:13px;font-weight:600;color:var(--gold);margin-bottom:4px">📅 应期参考</div>';
      html += '<div style="font-size:12px;line-height:1.8;opacity:.8">动爻五行属' + _dongWx + _seasonHint + '，应期多在该五行当令之月。具体应期以动爻地支冲合之日为准。</div>';
      html += '</div>';
    } catch(_ye) { console.warn('梅花应期计算错误:', _ye); }
    // === 📋 梅花白话解读 ===
    try {
      let _mhPlain = '<div class="bazi-new-module">';
      _mhPlain += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">📋 梅花白话解读 <span class="toggle-icon">▼</span></div>';
      _mhPlain += '<div class="bazi-module-body collapsed" style="padding:12px 16px">';
      // 1. 体用总断
      _mhPlain += '<div style="background:rgba(231,76,60,.04);border-left:3px solid var(--cinn2);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _mhPlain += '<div style="font-size:13px;font-weight:bold;color:var(--cinn2);margin-bottom:4px">🌸 体用总断</div>';
      _mhPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8"><b>体卦</b>（' + analyze.tiGua + '）代表自己，<b>用卦</b>（' + analyze.yongGua + '）代表所问之事。' + analyze.relation + '。初断：' + (analyze.initial||'') + '。终局：' + (analyze.endRelation||'') + '。</div>';
      _mhPlain += '</div>';
      // 2. 事业方向
      _mhPlain += '<div style="background:rgba(52,152,219,.04);border-left:3px solid var(--cyan2);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _mhPlain += '<div style="font-size:13px;font-weight:bold;color:var(--cyan2);margin-bottom:4px">💼 事业方向</div>';
      _mhPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + (analyze.relation === '我克' ? '体克用，事业可成但需努力，努力付出终有回报。' : analyze.relation === '克我' ? '用克体，事业阻力大，不宜强求，等待时机为上。' : analyze.relation === '我生' ? '体生用，付出多回报少，需调整策略避免过度消耗。' : analyze.relation === '生我' ? '用生体，贵人相助，事业顺遂，把握机会。' : '体用比和，事业平稳，按部就班即可。') + '</div>';
      _mhPlain += '</div>';
      // 3. 财运分析
      _mhPlain += '<div style="background:rgba(39,174,96,.04);border-left:3px solid var(--jade);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _mhPlain += '<div style="font-size:13px;font-weight:bold;color:var(--jade);margin-bottom:4px">💰 财运分析</div>';
      _mhPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + (analyze.relation === '生我' ? '财来生身，财运亨通，积极求财必有所得。' : analyze.relation === '我生' ? '财去生事，投资需谨慎，不宜大手笔。' : analyze.relation === '我克' ? '求财辛苦但可得，需主动出击。' : analyze.relation === '克我' ? '财不就身，不宜投资，守财为上。' : '财运平稳，量入为出。') + '变卦' + bian + '预示财运走向。</div>';
      _mhPlain += '</div>';
      // 4. 感情婚姻
      _mhPlain += '<div style="background:rgba(155,89,182,.04);border-left:3px solid var(--violet);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _mhPlain += '<div style="font-size:13px;font-weight:bold;color:var(--violet);margin-bottom:4px">💕 感情婚姻</div>';
      _mhPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + (analyze.relation === '生我' ? '对方主动示好，感情发展顺利。' : analyze.relation === '我生' ? '你付出较多，需看对方回应是否值得。' : analyze.relation === '我克' ? '感情需主动追求，付出终有回报。' : analyze.relation === '克我' ? '感情有阻力，不宜强求，顺其自然。' : '感情平和，互相尊重为上。') + '动爻在第' + (gua.dongYao+1) + '爻，预示变化发生的位置。</div>';
      _mhPlain += '</div>';
      // 5. 健康提醒
      _mhPlain += '<div style="background:rgba(230,126,34,.04);border-left:3px solid var(--orange);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _mhPlain += '<div style="font-size:13px;font-weight:bold;color:var(--orange);margin-bottom:4px">🏥 健康提醒</div>';
      _mhPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">体卦五行对应身体器官：木=肝胆，火=心血管，土=脾胃，金=肺呼吸，水=肾泌尿。' + (analyze.relation === '克我' ? '用克体，对应器官易受克伐，需提前调养。' : '体卦不受克，身体基本健康。') + '变卦暗示病情走向：变卦生体卦则痊愈快，变卦克体卦则需积极治疗。</div>';
      _mhPlain += '</div>';
      _mhPlain += '</div></div>';
      html += _mhPlain;
    } catch(_mhe) { console.warn('梅花白话解读错误:', _mhe); }

    // === 📋 缘主须知 ===
    html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(46,204,113,0.06),rgba(46,204,113,0.01));border:1px solid rgba(46,204,113,0.15);border-radius:12px">';
    html += '<div style="font-size:14px;font-weight:700;color:var(--jade2);margin-bottom:8px;letter-spacing:2px">📋 缘主须知</div>';
    html += '<div style="font-size:12px;line-height:2;opacity:.9">';
    html += '<div>1. 体卦代表自己，用卦代表所问之事。' + analyze.relation + '，' + analyze.initial + '。</div>';
    html += '<div>2. 最终变卦' + analyze.endRelation + '，' + (analyze.endResult || '') + '。</div>';
    html += '<div>3. 综合判断：<b style="color:var(--gold)">' + analyze.verdict + '</b></div>';
    html += '<div>4. ' + analyze.advice + '</div>';
    html += '<div>5. 卦象仅供参考，切勿执着。心正则卦灵，行善自有天佑。</div>';
    html += '</div></div>';
    // === 梅花卦象圆图可视化 ===
    try {
      let _mhDongIdx = gua.dongYao;
      let _mhTiIdx = (_mhDongIdx >= 3) ? gua.benGua.upper : gua.benGua.lower;
      let _mhYongIdx = (_mhDongIdx >= 3) ? gua.benGua.lower : gua.benGua.upper;
      let _mhTiWx = _GUA_XIANG[_mhTiIdx] ? _GUA_XIANG[_mhTiIdx].wuxing : '';
      let _mhYongWx = _GUA_XIANG[_mhYongIdx] ? _GUA_XIANG[_mhYongIdx].wuxing : '';
      let _mhHuTi = (_mhDongIdx >= 3) ? gua.huGua.upper : gua.huGua.lower;
      let _mhHuYong = (_mhDongIdx >= 3) ? gua.huGua.lower : gua.huGua.upper;
      let _mhHuTiWx = _GUA_XIANG[_mhHuTi] ? _GUA_XIANG[_mhHuTi].wuxing : '';
      let _mhHuYongWx = _GUA_XIANG[_mhHuYong] ? _GUA_XIANG[_mhHuYong].wuxing : '';
      let _mhBianYongIdx = (_mhDongIdx >= 3) ? gua.bianGua.lower : gua.bianGua.upper;
      let _mhBianYongWx = _GUA_XIANG[_mhBianYongIdx] ? _GUA_XIANG[_mhBianYongIdx].wuxing : '';
      let _mhBianTiIdx = _mhTiIdx; // 体卦不变
      let _mhBenName = ben;
      let _mhBianName = bian;
      let _mhHuName = (_GUA_XIANG[gua.huGua.lower] ? _GUA_XIANG[gua.huGua.lower].name : '?') + (_GUA_XIANG[gua.huGua.upper] ? _GUA_XIANG[gua.huGua.upper].name : '?');
      // 渲染单卦三爻
      function _renderTrigram(idx, label, color, isTi, isYong, isHu) {
        let guaInfo = _GUA_XIANG[idx] || {name:'?',sym:'?',code:'000',wuxing:'?'};
        let code = guaInfo.code || '000';
        let wx = guaInfo.wuxing || '?';
        let seasonStr = _getSeasonStrength ? _getSeasonStrength(wx) : '';
        let s = '<div style="text-align:center;padding:8px 6px;border-radius:8px;border:1px solid ' + color + '33;background:' + color + '0a">';
        s += '<div style="font-size:11px;color:' + color + ';font-weight:600;margin-bottom:4px">' + label + '</div>';
        s += '<div style="font-size:22px;color:' + color + ';margin-bottom:4px">' + (guaInfo.sym || '?') + '</div>';
        // 三爻从上到下
        for (let ti = 2; ti >= 0; ti--) {
          let isYang = code[ti] === '1';
          s += '<div style="display:flex;justify-content:center;padding:1px 0">';
          if (isYang) {
            s += '<div style="width:40px;height:4px;background:' + color + ';border-radius:2px"></div>';
          } else {
            s += '<div style="width:40px;height:4px;display:flex;gap:4px"><div style="flex:1;background:' + color + ';border-radius:2px"></div><div style="flex:1;background:' + color + ';border-radius:2px"></div></div>';
          }
          s += '</div>';
        }
        s += '<div style="font-size:11px;color:' + color + ';margin-top:4px;font-weight:600">' + guaInfo.name + '</div>';
        s += '<div style="font-size:9px;opacity:.7;margin-top:2px">五行: ' + wx + '</div>';
        if (seasonStr) s += '<div style="font-size:9px;opacity:.6">' + seasonStr + '</div>';
        if (isTi) s += '<div style="font-size:9px;color:' + color + ';font-weight:700;margin-top:2px">体</div>';
        if (isYong) s += '<div style="font-size:9px;color:' + color + ';font-weight:700;margin-top:2px">用</div>';
        if (isHu) s += '<div style="font-size:9px;color:' + color + ';font-weight:700;margin-top:2px">互</div>';
        s += '</div>';
        return s;
      }
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🌸 梅花卦象圆图</div>';
      html += '<div style="padding:16px">';
      // 圆图布局：用嵌套同心圆表示
      html += '<div style="display:flex;justify-content:center;align-items:center;gap:12px;flex-wrap:wrap">';
      // 外圈：本卦（上卦+下卦）
      html += '<div style="text-align:center">';
      html += '<div style="font-size:11px;color:var(--gold);margin-bottom:6px;font-weight:600">外圈 · 本卦 ' + _mhBenName + '</div>';
      html += '<div style="display:flex;gap:8px;justify-content:center">';
      // 上卦
      let _upperIsTi = (_mhDongIdx >= 3);
      let _upperIsYong = (_mhDongIdx < 3);
      let _upperColor = _upperIsTi ? 'var(--gold)' : 'var(--violet)';
      html += _renderTrigram(gua.benGua.upper, '上卦', _upperColor, _upperIsTi, _upperIsYong, false);
      // 下卦
      let _lowerIsTi = (_mhDongIdx < 3);
      let _lowerIsYong = (_mhDongIdx >= 3);
      let _lowerColor = _lowerIsTi ? 'var(--gold)' : 'var(--violet)';
      html += _renderTrigram(gua.benGua.lower, '下卦', _lowerColor, _lowerIsTi, _lowerIsYong, false);
      html += '</div>';
      html += '</div>';
      // 箭头
      html += '<div style="color:var(--gold);font-size:16px;opacity:.5">→</div>';
      // 中圈：互卦
      html += '<div style="text-align:center">';
      html += '<div style="font-size:11px;color:var(--cyan2);margin-bottom:6px;font-weight:600">中圈 · 互卦 ' + _mhHuName + '</div>';
      html += '<div style="display:flex;gap:8px;justify-content:center">';
      html += _renderTrigram(gua.huGua.upper, '互上', 'var(--cyan2)', false, false, true);
      html += _renderTrigram(gua.huGua.lower, '互下', 'var(--cyan2)', false, false, true);
      html += '</div>';
      html += '</div>';
      // 箭头
      if (gua.dongYao >= 0) {
        html += '<div style="color:var(--gold);font-size:16px;opacity:.5">→</div>';
        // 内圈：变卦
        html += '<div style="text-align:center">';
        html += '<div style="font-size:11px;color:var(--gold2);margin-bottom:6px;font-weight:600">内圈 · 变卦 ' + _mhBianName + '</div>';
        html += '<div style="display:flex;gap:8px;justify-content:center">';
        // 变卦体卦不变
        let _bianUpperIsTi = (_mhDongIdx >= 3);
        let _bianUpperColor = _bianUpperIsTi ? 'var(--gold)' : 'var(--orange)';
        html += _renderTrigram(gua.bianGua.upper, '变上', _bianUpperColor, _bianUpperIsTi, !_bianUpperIsTi, false);
        let _bianLowerIsTi = (_mhDongIdx < 3);
        let _bianLowerColor = _bianLowerIsTi ? 'var(--gold)' : 'var(--orange)';
        html += _renderTrigram(gua.bianGua.lower, '变下', _bianLowerColor, _bianLowerIsTi, !_bianLowerIsTi, false);
        html += '</div>';
        html += '</div>';
      }
      html += '</div>';
      // 五行旺衰标注
      html += '<div style="margin-top:12px;padding:10px 14px;background:rgba(201,168,76,0.04);border-radius:8px;font-size:11px;line-height:1.8">';
      html += '<div style="font-weight:600;color:var(--gold);margin-bottom:4px">五行旺衰</div>';
      html += '<div>体卦(' + _mhTiWx + '): ' + (_getSeasonStrength ? _getSeasonStrength(_mhTiWx) : '') + ' | 用卦(' + _mhYongWx + '): ' + (_getSeasonStrength ? _getSeasonStrength(_mhYongWx) : '') + ' | 互卦(' + _mhHuYongWx + '): ' + (_getSeasonStrength ? _getSeasonStrength(_mhHuYongWx) : '') + ' | 变卦(' + _mhBianYongWx + '): ' + (_getSeasonStrength ? _getSeasonStrength(_mhBianYongWx) : '') + '</div>';
      html += '</div>';
      // 图例
      html += '<div style="margin-top:8px;font-size:10px;opacity:.6;text-align:center">';
      html += '<span style="color:var(--gold)">●体卦(金)</span> · <span style="color:var(--violet)">●用卦(紫)</span> · <span style="color:var(--cyan2)">●互卦(青)</span> · 动爻第' + (_mhDongIdx+1) + '爻';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    } catch(_mce) { console.warn('梅花圆图可视化错误:', _mce); }
    // === 📝 术语注释 ===
    try {
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📝 术语注释</div>';
      html += '<div style="padding:12px 16px;font-size:11px;line-height:2;opacity:.85">';
      html += '<div><b style="color:var(--gold2)">体卦：</b>不动之卦，代表自己。动爻所在卦为用卦，另一卦即为体卦。</div>';
      html += '<div><b style="color:var(--gold2)">用卦：</b>动爻所在之卦，代表所测之事。用卦生体卦则吉，克体卦则凶。</div>';
      html += '<div><b style="color:var(--gold2)">互卦：</b>取本卦二三四爻为下互，三四五爻为上互，反映事物发展过程中的内在因素。</div>';
      html += '<div><b style="color:var(--gold2)">变卦：</b>动爻阴阳互变后的卦象，代表事物最终结局。</div>';
      html += '<div><b style="color:var(--gold2)">体用生克：</b>体卦五行与用卦五行的生克关系。用生体吉，体生用耗，用克体凶，体克用可成，体用比和顺。</div>';
      html += '<div><b style="color:var(--gold2)">时令旺衰：</b>卦象五行在当前季节的强弱。春季木旺、夏季火旺、秋季金旺、冬季水旺。旺相有力，休囚死无力。</div>';
      html += '</div></div>';
    } catch(_mte) { console.warn('梅花术语注释渲染错误:', _mte); }
    // === 化解方案与开运建议 ===
    try {
      let _cureHtml = getMeihuaResolution(gua, analyze);
      if (_cureHtml && _cureHtml.trim()) {
        html += '<div class="bazi-new-module">';
        html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔮 化解方案与开运建议 <span class="toggle-icon">▼</span></div>';
        html += '<div class="bazi-module-body collapsed"><div id="meihua-cure-result">' + _cureHtml + '</div></div>';
        html += '</div>';
      }
    } catch(_ce) { console.warn('梅花化解引擎错误:', _ce); }
    _showEngineResult('mhEngineResult', html);
    // === V3引擎校准 ===
    try {
      if (window.MeihuaV3 && MeihuaV3.computeMeihuaFull) {
        let v3MhResult = MeihuaV3.computeMeihuaFull({ method: 'number', n1: n1, n2: n2, n3: n3 });
        let v3MhHtml = '<div class="bazi-new-module">';
        v3MhHtml += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔬 V3校准版梅花 <span class="toggle-icon">▼</span></div>';
        v3MhHtml += '<div class="bazi-module-body collapsed">';
        if (v3MhResult.benGua) {
          v3MhHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3MhHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">卦象（V3）</div>';
          if (v3MhResult.benGua.name) v3MhHtml += '<div style="font-size:13px">本卦：<strong>' + v3MhResult.benGua.name + '</strong></div>';
          if (v3MhResult.bianGua && v3MhResult.bianGua.name) v3MhHtml += '<div style="font-size:13px">变卦：<strong>' + v3MhResult.bianGua.name + '</strong></div>';
          if (v3MhResult.huGua && v3MhResult.huGua.name) v3MhHtml += '<div style="font-size:13px">互卦：<strong>' + v3MhResult.huGua.name + '</strong></div>';
          v3MhHtml += '</div>';
        }
        if (v3MhResult.tiYong) {
          v3MhHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3MhHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">体用分析（V3）</div>';
          let ty = v3MhResult.tiYong;
          if (ty.tiGua) v3MhHtml += '<div style="font-size:12px;line-height:1.8">体卦：<strong>' + (ty.tiGua.name || ty.tiGua) + '</strong></div>';
          if (ty.yongGua) v3MhHtml += '<div style="font-size:12px;line-height:1.8">用卦：<strong>' + (ty.yongGua.name || ty.yongGua) + '</strong></div>';
          if (ty.relation) v3MhHtml += '<div style="font-size:12px;line-height:1.8">体用关系：<strong>' + ty.relation + '</strong></div>';
          if (ty.verdict) v3MhHtml += '<div style="font-size:12px;line-height:1.8;color:var(--gold)">断语：' + ty.verdict + '</div>';
          if (ty.advice) v3MhHtml += '<div style="font-size:12px;line-height:1.8;opacity:.8">' + ty.advice + '</div>';
          // R3.1: tiYongDetail详情
          if (ty.tiYongDetail) {
            let td = ty.tiYongDetail;
            v3MhHtml += '<div style="margin-top:8px;padding:6px 8px;background:rgba(255,255,255,.02);border-radius:4px">';
            v3MhHtml += '<div style="font-size:11px;font-weight:bold;color:var(--violet);margin-bottom:4px">体用生克细化</div>';
            if (td.relationLabel) v3MhHtml += '<div style="font-size:10px;color:var(--paper2)">关系：'+td.relationLabel+'</div>';
            if (td.tiStrength) v3MhHtml += '<div style="font-size:10px;color:var(--paper2)">体卦旺衰：'+td.tiStrength+'</div>';
            if (td.yongStrength) v3MhHtml += '<div style="font-size:10px;color:var(--paper2)">用卦旺衰：'+td.yongStrength+'</div>';
            if (td.huGuaEffect) v3MhHtml += '<div style="font-size:10px;color:var(--steel);margin-left:8px">互卦影响：'+td.huGuaEffect+'</div>';
            if (td.bianGuaEffect) v3MhHtml += '<div style="font-size:10px;color:var(--steel);margin-left:8px">变卦趋势：'+td.bianGuaEffect+'</div>';
            if (td.summary) v3MhHtml += '<div style="font-size:10px;color:var(--gold);margin-top:4px;line-height:1.5">'+td.summary+'</div>';
            v3MhHtml += '</div>';
          }
          v3MhHtml += '</div>';
        }
        // R3.2: 五步断卦法
        try {
          if (window.MeihuaV3 && MeihuaV3.analyzeMeihuaFull) {
            let _mhFull = MeihuaV3.analyzeMeihuaFull({ method: 'number', n1: n1, n2: n2, n3: n3 });
            if (_mhFull) {
              v3MhHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(155,89,182,0.04);border-radius:8px">';
              v3MhHtml += '<div style="font-size:12px;color:var(--violet);margin-bottom:6px">🔮 五步断卦</div>';
              if (_mhFull.guaNameDesc) v3MhHtml += '<div style="font-size:11px;color:var(--paper2);line-height:1.6"><b>卦名：</b>'+_mhFull.guaNameDesc+'</div>';
              if (_mhFull.tiYongAnalysis) v3MhHtml += '<div style="font-size:11px;color:var(--paper2);line-height:1.6;margin-top:4px"><b>体用：</b>'+_mhFull.tiYongAnalysis+'</div>';
              if (_mhFull.huGuaAnalysis) v3MhHtml += '<div style="font-size:11px;color:var(--paper2);line-height:1.6;margin-top:4px"><b>互卦：</b>'+_mhFull.huGuaAnalysis+'</div>';
              if (_mhFull.bianGuaAnalysis) v3MhHtml += '<div style="font-size:11px;color:var(--paper2);line-height:1.6;margin-top:4px"><b>变卦：</b>'+_mhFull.bianGuaAnalysis+'</div>';
              if (_mhFull.summary) v3MhHtml += '<div style="font-size:11px;color:var(--gold);margin-top:6px;padding:4px 6px;background:rgba(255,255,255,.02);border-radius:4px;line-height:1.6"><b>总结：</b>'+_mhFull.summary+'</div>';
              if (_mhFull.luckLevel) v3MhHtml += '<div style="font-size:12px;margin-top:4px">吉凶：<b style="color:' + (_mhFull.luckLevel.indexOf('大吉')>=0?'var(--jade)':_mhFull.luckLevel.indexOf('凶')>=0?'var(--cinn2)':'var(--warn)') + '">'+_mhFull.luckLevel+'</b></div>';
              v3MhHtml += '</div>';
            }
          }
        } catch(eMh2) {}
        if (v3MhResult.season) {
          v3MhHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3MhHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">时令旺衰（V3）</div>';
          v3MhHtml += '<div style="font-size:12px;line-height:1.8">季节：' + (v3MhResult.season || '-') + '</div>';
          v3MhHtml += '</div>';
        }
        v3MhHtml += '<div style="text-align:center;font-size:10px;opacity:.3;letter-spacing:2px;margin-top:8px">⚡ Powered by MeihuaV3 Engine</div>';
        v3MhHtml += '</div></div>';
        let mhResultEl = document.getElementById('mhResult') || document.getElementById('mhEngineResult');
        if (mhResultEl) mhResultEl.insertAdjacentHTML('beforeend', v3MhHtml);
      }
    } catch(e5) { console.warn('MeihuaV3 error:', e5); }
  } catch(e) { showToast('梅花引擎错误：'+e.message); }
}

function runQimenEngine() {
  try {
    let qmResult = document.getElementById('qmResult');
    if(qmResult) qmResult.classList.add('visible');
    const dateVal = document.getElementById('qmDate')?.value;
    const hourVal = document.getElementById('qmHour')?.value;
    const now = dateVal ? new Date(dateVal + 'T00:00:00') : new Date();
    const hour = hourVal ? parseInt(hourVal) : now.getHours();
    const pan = qimenPaiPan(now.getFullYear(), now.getMonth()+1, now.getDate(), hour, 'auto');
    let qmQ = document.getElementById('qmQuestion')?.value || '事业';
    const analyze = qimenAnalyze(pan, qmQ);
    // 🎯 排盘结论总览
    let _qmLuckColor = analyze.luck === '吉' ? 'var(--jade)' : (analyze.luck === '凶' ? 'var(--cinn2)' : 'var(--warn)');
    let _qmSummary = '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
    _qmSummary += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:2px">🎯 排盘结论总览</div>';
    _qmSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>吉凶判定：</b><span style="color:' + _qmLuckColor + ';font-weight:600;font-size:16px">' + analyze.luck + '</span>' + (analyze.wuBuYu ? ' · <span style="color:var(--cinn2)">⚠️ 五不遇时，时辰大忌</span>' : '') + (analyze.isMaXing ? ' · <span style="color:var(--cyan2)">🐎 马星动象</span>' : '') + '</div>';
    _qmSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>用神：</b>' + analyze.yongShen + '落<b style="color:var(--gold)">' + analyze.palace + '宫</b> · 天盘' + (analyze.qi||'—') + ' · ' + (analyze.men||'—') + ' · ' + (analyze.star||'—') + ' · ' + (analyze.shen||'—') + '</div>';
    if (analyze.gejuText) { _qmSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>格局：</b>' + analyze.gejuText + '</div>'; }
    _qmSummary += '<div style="font-size:12px;line-height:1.8;opacity:.85;margin-bottom:6px"><b>策略：</b>' + (analyze.strategy || '需综合天时地利人和判断') + '</div>';
    _qmSummary += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b>建议：</b>' + (analyze.advice || '奇门遁甲为时空方位之学，择吉而行，趋吉避凶。切勿迷信盲从。') + '</div>';
    _qmSummary += '</div>';
    let html = '<h4 style="color:var(--violet2)">☰ 奇门引擎演算结果</h4>';
    html += _qmSummary;
    html += '<p><b>遁局：</b>' + (pan.dun==='yang'?'阳':'阴') + '遁' + pan.ju + '局</p>';
    html += '<p><b>用神：</b>' + analyze.yongShen + ' · 落' + analyze.palace + '宫</p>';
    html += '<p><b>天盘：</b>' + analyze.qi + ' · 门：' + analyze.men + ' · 星：' + analyze.star + ' · 神：' + analyze.shen + '</p>';
    html += '<p><b>吉凶：</b>' + analyze.luck + (analyze.wuBuYu ? ' · ⚠️五不遇时' : '') + (analyze.isMaXing ? ' · 🐎马星临宫' : '') + '</p>';
    if (analyze.dayGanPalace) html += '<p><b>命主(日干)：</b>落' + analyze.dayGanPalace + '宫' + (analyze.dayGanQi ? '·天盘' + analyze.dayGanQi : '') + '</p>';
    if (analyze.hourGanPalace) html += '<p><b>事体(时干)：</b>落' + analyze.hourGanPalace + '宫' + (analyze.hourGanQi ? '·天盘' + analyze.hourGanQi : '') + '</p>';
    html += '<p><b>策略：</b>' + analyze.strategy + '</p>';
    if (analyze.gejuText) html += '<p><b>格局：</b>' + analyze.gejuText + '</p>';
    if (analyze.sihai) html += '<p style="opacity:0.7"><b>四害分析：</b>' + analyze.sihai + '</p>';
    if (analyze.huajie) html += '<p style="opacity:0.7"><b>化解建议：</b>' + analyze.huajie + '</p>';
    if (analyze.mascot) html += '<p style="opacity:0.7"><b>吉祥物：</b>' + analyze.mascot + '</p>';
    html += '<p style="opacity:0.8">' + analyze.advice + '</p>';

    // === 九宫格可视化盘面 ===
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🔮 九宫遁甲盘面</div>';
    html += '<div style="padding:12px;display:flex;justify-content:center">';
    html += '<div style="display:grid;grid-template-columns:repeat(3,86px);gap:2px;background:var(--border);padding:2px;border-radius:8px">';
    let _qmGongOrder = [4,9,2,3,5,7,8,1,6];
    let _qmGongNames = ['','坎','坤','震','巽','中','乾','兑','艮','离'];
    let _qmFullMen = {'休':'休门','生':'生门','伤':'伤门','杜':'杜门','景':'景门','死':'死门','惊':'惊门','开':'开门'};
    let _qmFullStars = {'蓬':'天蓬','任':'天任','冲':'天冲','辅':'天辅','英':'天英','芮':'天芮','柱':'天柱','心':'天心','禽':'天禽'};
    for (let _qi = 0; _qi < 9; _qi++) {
      let _gp = _qmGongOrder[_qi];
      let _gName = _qmGongNames[_gp] || '';
      let _diQi = pan.dipan[_gp] || '—';
      let _tiQi = pan.tianpan[_gp] || '—';
      let _men = pan.men[_gp] || '';
      let _star = pan.stars[_gp] || '';
      let _shen = pan.shen[_gp] || '';
      let _isZhong = (_gp === 5);
      let _bg = _isZhong ? 'rgba(138,92,246,0.06)' : 'var(--card)';
      let _tags = [];
      if (analyze.kongWangGongs && analyze.kongWangGongs.indexOf(_gp) >= 0) _tags.push('空');
      if (analyze.maXing === _gp) _tags.push('马');
      html += '<div style="background:' + _bg + ';padding:6px;text-align:center;font-size:10px;min-height:80px;display:flex;flex-direction:column;justify-content:center">';
      html += '<div style="color:var(--gold);font-weight:600;font-size:11px">' + _gName + '(' + _gp + ')</div>';
      html += '<div style="margin:2px 0">天:<b style="color:var(--fire2)">' + _tiQi + '</b></div>';
      html += '<div style="margin:1px 0">地:<b style="color:var(--gold)">' + _diQi + '</b></div>';
      if (_men) html += '<div style="color:var(--jade2);font-size:10px">' + (_qmFullMen[_men] || _men) + '</div>';
      if (_star) html += '<div style="color:var(--violet);font-size:10px">' + (_qmFullStars[_star] || _star) + '</div>';
      if (_shen) html += '<div style="opacity:.7;font-size:10px">' + _shen + '</div>';
      if (_tags.length > 0) html += '<div style="color:var(--fire);font-size:9px;font-weight:700">' + _tags.join(' ') + '</div>';
      if (analyze.palace === _gp) html += '<div style="color:var(--gold);font-size:9px;font-weight:700;background:rgba(201,168,76,0.15);border-radius:3px;padding:1px 4px;margin-top:2px">★用神</div>';
      html += '</div>';
    }
    html += '</div></div>';
    // 盘面图例
    html += '<div style="padding:6px 12px;font-size:10px;opacity:.6;text-align:center">后天八卦排列 · 天=天盘干 · 地=地盘干 · 空=空亡 · 马=马星</div>';
    html += '</div>';

    // === 用神分析详情 ===
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🎯 用神分析</div>';
    html += '<div style="padding:12px;font-size:13px;line-height:1.8">';
    html += '<div style="margin-bottom:6px"><b style="color:var(--gold)">用神：</b>' + analyze.yongShen + ' · 落<b style="color:var(--fire2)">' + analyze.palace + '</b>宫</div>';
    html += '<div style="margin-bottom:6px"><b style="color:var(--gold)">天盘干：</b>' + analyze.qi + ' · <b style="color:var(--gold)">门：</b>' + (_qmFullMen[analyze.men] || analyze.men) + ' · <b style="color:var(--gold)">星：</b>' + (_qmFullStars[analyze.star] || analyze.star) + ' · <b style="color:var(--gold)">神：</b>' + analyze.shen + '</div>';
    html += '<div style="margin-bottom:6px"><b style="color:var(--gold)">吉凶判定：</b><span style="color:' + (analyze.luck==='吉'?'var(--jade2)':analyze.luck==='凶'?'var(--fire)':'var(--orange)') + ';font-weight:700">' + analyze.luck + '</span>';
    if (analyze.wuBuYu) html += ' <span style="color:var(--fire)">⚠️ 五不遇时</span>';
    if (analyze.isMaXing) html += ' <span style="color:var(--jade2)">🐎 马星临宫</span>';
    if (analyze.kongwang) html += ' <span style="color:var(--fire)">⬚ 落空亡</span>';
    html += '</div>';
    if (analyze.dayGanPalace) {
      html += '<div style="margin-bottom:6px;padding:6px 8px;border-left:2px solid var(--gold);background:rgba(201,168,76,0.03)"><b>命主(日干)：</b>落' + analyze.dayGanPalace + '宫' + (analyze.dayGanQi ? ' · 天盘' + analyze.dayGanQi : '') + '</div>';
    }
    if (analyze.hourGanPalace) {
      html += '<div style="margin-bottom:6px;padding:6px 8px;border-left:2px solid var(--violet);background:rgba(138,92,246,0.03)"><b>事体(时干)：</b>落' + analyze.hourGanPalace + '宫' + (analyze.hourGanQi ? ' · 天盘' + analyze.hourGanQi : '') + '</div>';
    }
    html += '</div></div>';

    // === 天盘地盘对照表 ===
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📋 天盘地盘对照</div>';
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<tr style="background:rgba(201,168,76,0.08)"><th style="padding:5px 6px;border:1px solid var(--border);text-align:left">宫位</th><th style="padding:5px 6px;border:1px solid var(--border);text-align:left">地盘</th><th style="padding:5px 6px;border:1px solid var(--border);text-align:left">天盘</th><th style="padding:5px 6px;border:1px solid var(--border);text-align:left">八门</th><th style="padding:5px 6px;border:1px solid var(--border);text-align:left">九星</th><th style="padding:5px 6px;border:1px solid var(--border);text-align:left">八神</th><th style="padding:5px 6px;border:1px solid var(--border);text-align:left">备注</th></tr>';
    let _qmGongDisplay = [1,2,3,4,6,7,8,9];
    for (let _gdi = 0; _gdi < _qmGongDisplay.length; _gdi++) {
      let _dp = _qmGongDisplay[_gdi];
      let _dn = _qmGongNames[_dp] || '';
      let _ddi = pan.dipan[_dp] || '—';
      let _dti = pan.tianpan[_dp] || '—';
      let _dmen = pan.men[_dp] || '—';
      let _dstar = pan.stars[_dp] || '—';
      let _dshen = pan.shen[_dp] || '—';
      let _dnote = '';
      if (analyze.kongWangGongs && analyze.kongWangGongs.indexOf(_dp) >= 0) _dnote += '空亡 ';
      if (analyze.maXing === _dp) _dnote += '马星 ';
      if (_dp === analyze.palace) _dnote += '★用神';
      html += '<tr><td style="padding:4px 6px;border:1px solid var(--border);font-weight:600">' + _dn + '(' + _dp + ')</td>';
      html += '<td style="padding:4px 6px;border:1px solid var(--border);color:var(--gold)">' + _ddi + '</td>';
      html += '<td style="padding:4px 6px;border:1px solid var(--border);color:var(--fire2)">' + _dti + '</td>';
      html += '<td style="padding:4px 6px;border:1px solid var(--border);color:var(--jade2)">' + (_qmFullMen[_dmen] || _dmen) + '</td>';
      html += '<td style="padding:4px 6px;border:1px solid var(--border);color:var(--violet)">' + (_qmFullStars[_dstar] || _dstar) + '</td>';
      html += '<td style="padding:4px 6px;border:1px solid var(--border);opacity:.8">' + _dshen + '</td>';
      html += '<td style="padding:4px 6px;border:1px solid var(--border);font-size:11px;color:var(--fire)">' + (_dnote || '—') + '</td></tr>';
    }
    html += '</table></div></div>';

    // === 格局判断详情 ===
    if (analyze.geju && analyze.geju.length > 0) {
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">⚖️ 格局判断</div>';
      html += '<div style="padding:12px;font-size:12px;line-height:1.8">';
      let _jiGeju = ['青龙返首','飞鸟跌穴','玉女守门','真诈格','假诈格','重诈格','天假格','地假格','人假格','神假格','鬼假格'];
      let _xiongGeju = ['太白入荧','荧入太白','青龙折足','腾蛇夭矫','朱雀投江','五不遇时','伏吟'];
      for (let _ggi = 0; _ggi < analyze.geju.length; _ggi++) {
        let _gItem = analyze.geju[_ggi];
        let _isJi = false, _isXiong = false;
        for (let _jgi = 0; _jgi < _jiGeju.length; _jgi++) { if (_gItem.indexOf(_jiGeju[_jgi]) >= 0) { _isJi = true; break; } }
        for (let _xgi = 0; _xgi < _xiongGeju.length; _xgi++) { if (_gItem.indexOf(_xiongGeju[_xgi]) >= 0) { _isXiong = true; break; } }
        let _gColor = _isJi ? 'var(--jade2)' : _isXiong ? 'var(--fire)' : 'var(--gold)';
        let _gIcon = _isJi ? '✅' : _isXiong ? '❌' : '⚖️';
        html += '<div style="margin-bottom:4px;padding:4px 8px;border-left:2px solid ' + _gColor + ';background:rgba(201,168,76,0.03)">';
        let _gejuMeaning = '';
        let _gejuMap = {
          // [舒晗课程校正] 格局含义 — 依据密训班02格局深度解析
          '青龙返首':'百事皆吉，大成就之象。戊加丙，为大吉格之首',
          '飞鸟跌穴':'谋为皆成，贵人相助。丙加戊，大吉格',
          '玉女守门':'阴私和合，婚姻吉。丁加开门所在宫',
          '真诈格':'门星神俱吉，真假难辨，宜防被骗',
          '假诈格':'门吉星凶神吉，虚多实少，不宜大兴',
          '重诈格':'门凶星吉神吉，反复不定，需谨慎',
          '天假格':'丙加景门加九天，天意成全，事有转机',
          '地假格':'丁加杜门加九地，借地生财，宜谋略',
          '人假格':'己加死门加太阴，人情助力，宜交际',
          '神假格':'辛加伤门加腾蛇，神明庇佑，逢凶化吉',
          '鬼假格':'癸加惊门加玄武，暗中作祟，宜祭化解',
          '太白入荧':'贼来客欺，防破财。庚加丙',
          '荧入太白':'贼去客胜，宜进攻。丙加庚',
          '青龙折足':'根基不稳，谋为难成。戊加辛',
          '腾蛇夭矫':'惊恐虚诈，多波折。辛加乙或癸加丁',
          '朱雀投江':'口舌是非，文书不利。丁加癸',
          '白虎猖狂':'刑伤破败，谋事多阻。辛加乙',
          '五不遇时':'时干克日干，百事不宜',
          '伏吟':'伏匿不动，宜守不宜进。伏吟用冲（以动制静）',
          '反吟':'反复动荡，事多逆转。反吟用合（以静制动）'
        };
        for (let _gmKey in _gejuMap) { if (_gItem.indexOf(_gmKey) >= 0) { _gejuMeaning = _gejuMap[_gmKey]; break; } }
        html += _gIcon + ' <span style="color:' + _gColor + ';font-weight:600">' + _gItem + '</span>';
        if (_gejuMeaning) html += '<div style="font-size:10px;opacity:.7;margin-left:20px">→ ' + _gejuMeaning + '</div>';
        html += '</div>';
      }
      html += '</div></div>';
    }

    // === 应期判断 ===
    try {
      let _qmYingqi = '';
      if (analyze.palace) {
        let _palaceZhi = {1:'子/壬',2:'未/坤',3:'卯/乙',4:'辰/巽',6:'戌/乾',7:'酉/辛',8:'丑/艮',9:'午/丙'};
        _qmYingqi = '用神落' + analyze.palace + '宫（' + (_palaceZhi[analyze.palace] || '') + '），应期在该宫地支当令之月';
        if (analyze.kongwang) _qmYingqi += '。⚠️ 用神落空亡，出空之日方应';
      }
      html += '<div style="margin:12px 0;padding:10px 14px;background:rgba(138,92,246,0.04);border:1px solid rgba(138,92,246,0.1);border-radius:8px">';
      html += '<div style="font-size:13px;font-weight:600;color:var(--violet2);margin-bottom:4px">📅 应期参考</div>';
      html += '<div style="font-size:12px;line-height:1.8;opacity:.8">' + _qmYingqi + '</div>';
      html += '</div>';
    } catch(_qe) { console.warn('奇门应期计算错误:', _qe); }
    // === 📋 奇门白话解读 ===
    try {
      let _qmPlain = '<div class="bazi-new-module">';
      _qmPlain += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">📋 奇门白话解读 <span class="toggle-icon">▼</span></div>';
      _qmPlain += '<div class="bazi-module-body collapsed" style="padding:12px 16px">';
      // 1. 整体吉凶
      let _qmLuckColor2 = analyze.luck === '吉' ? 'var(--jade)' : (analyze.luck === '凶' ? 'var(--cinn2)' : 'var(--warn)');
      _qmPlain += '<div style="background:rgba(231,76,60,.04);border-left:3px solid ' + _qmLuckColor2 + ';padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _qmPlain += '<div style="font-size:13px;font-weight:bold;color:' + _qmLuckColor2 + ';margin-bottom:4px">🔮 整体吉凶</div>';
      _qmPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">本次起卦<b style="color:' + _qmLuckColor2 + '">' + analyze.luck + '</b>。' + (analyze.wuBuYu ? '<span style="color:var(--cinn2)">⚠️ 五不遇时，时辰大忌，不宜行动。</span>' : '') + (analyze.isMaXing ? '马星动象，有出行或变动之兆。' : '') + '用神<b>' + (analyze.yongShen||'') + '</b>落<b>' + (analyze.palace||'') + '</b>宫，' + (analyze.luck === '吉' ? '格局有利，可以行动。' : analyze.luck === '凶' ? '格局不利，宜守不宜进。' : '格局平平，需谨慎行事。') + '</div>';
      _qmPlain += '</div>';
      // 2. 事业谋为
      _qmPlain += '<div style="background:rgba(52,152,219,.04);border-left:3px solid var(--cyan2);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _qmPlain += '<div style="font-size:13px;font-weight:bold;color:var(--cyan2);margin-bottom:4px">💼 事业谋为</div>';
      _qmPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">八门主事：<b>' + (analyze.men||'') + '</b>门当值。开门利求职见贵，休门利求财安养，生门利经营求财，伤门利讨债捕捉，杜门利躲灾避难，景门利考试文书，死门不利吉事，惊门利诉讼。[舒晗密训] 门吉星吉神吉为真诈格，事可成；门凶星吉神吉为重诈格，反复可成。' + (analyze.strategy||'') + '</div>';
      _qmPlain += '</div>';
      // 3. 财运分析
      _qmPlain += '<div style="background:rgba(39,174,96,.04);border-left:3px solid var(--jade);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _qmPlain += '<div style="font-size:13px;font-weight:bold;color:var(--jade);margin-bottom:4px">💰 财运分析</div>';
      _qmPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">生门为财门，落宫旺相则财源广进。[舒晗密训] 正财（工资/主业）看戊土与生门与日干关系；偏财（投资/副业）看丁奇、伤门/杜门与日干关系。生门落宫五行生本宫五行→财来找我（易得）；相克→我去求财（费力）。' + (analyze.men === '生门' ? '生门当值，利于经营求财。' : analyze.men === '开门' ? '开门当值，利于仕途升迁带动财运。' : analyze.men === '休门' ? '休门当值，利于稳健投资。' : '当前门非财门，求财需等待时机。') + '天盘乙奇为财星，落宫与用神宫位生合则财旺。</div>';
      _qmPlain += '</div>';
      // 4. 感情人际
      _qmPlain += '<div style="background:rgba(155,89,182,.04);border-left:3px solid var(--violet);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _qmPlain += '<div style="font-size:13px;font-weight:bold;color:var(--violet);margin-bottom:4px">💕 感情人际</div>';
      _qmPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">六合主婚姻感情，乙庚主男女匹配。[舒晗密训] 乙奇为女方用神，庚金为男方用神，乙庚合为夫妻宫。' + (analyze.shen === '六合' ? '六合当值，感情和合，利于婚恋。' : '神盘' + (analyze.shen||'') + '当值，' + (analyze.luck === '吉' ? '人际关系顺畅。' : '人际需注意沟通方式。')) + '五不遇时不宜婚嫁谈判。腾蛇临宫主感情虚惊反复，白虎临宫主争执强硬。</div>';
      _qmPlain += '</div>';
      // 5. 健康出行
      _qmPlain += '<div style="background:rgba(230,126,34,.04);border-left:3px solid var(--orange);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _qmPlain += '<div style="font-size:13px;font-weight:bold;color:var(--orange);margin-bottom:4px">🏥 健康出行</div>';
      _qmPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">天芮星主病，落宫需注意对应身体部位。[舒晗密训] 天芮落宫五行断病：坎主肾/泌尿，震主肝/胆，离主心/血，乾主肺/头，坤主脾胃/腹。' + (analyze.star === '天芮' ? '天芮当值，需注意健康，不宜探病。' : '天盘' + (analyze.star||'') + '当值，' + (analyze.luck === '吉' ? '身体无碍。' : '需注意休息调养。')) + '马星动则利出行，五不遇时不宜远行。</div>';
      _qmPlain += '</div>';
      _qmPlain += '</div></div>';
      html += _qmPlain;
    } catch(_qpe) { console.warn('奇门白话解读错误:', _qpe); }

    // === 📋 缘主须知 ===
    html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(138,92,246,0.06),rgba(138,92,246,0.01));border:1px solid rgba(138,92,246,0.15);border-radius:12px">';
    html += '<div style="font-size:14px;font-weight:700;color:var(--violet2);margin-bottom:8px;letter-spacing:2px">📋 缘主须知</div>';
    html += '<div style="font-size:12px;line-height:2;opacity:.9">';
    html += '<div>1. 本局' + (pan.dun === 'yang' ? '阳遁' : '阴遁') + pan.ju + '局，' + (analyze.luck === '吉' ? '总体吉利，可以行动' : analyze.luck === '凶' ? '总体凶险，宜守不宜进' : '吉凶参半，需权衡利弊') + '。</div>';
    html += '<div>2. 用神' + analyze.yongShen + '落' + analyze.palace + '宫，' + (analyze.wuBuYu ? '⚠️ 五不遇时，时辰不利，改日再谋' : '时辰可用') + '。</div>';
    if (analyze.strategy) html += '<div>3. 策略：' + analyze.strategy + '</div>';
    if (analyze.huajie) html += '<div>4. 化解：' + analyze.huajie + '</div>';
    html += '<div>5. 奇门遁甲为时空方位之学，参考而行，切勿迷信。择吉而行，趋吉避凶。</div>';
    html += '</div></div>';
    // === 📖 术语解释 ===
    html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(138,92,246,0.04),rgba(138,92,246,0.01));border:1px solid rgba(138,92,246,0.12);border-radius:12px">';
    html += '<div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==\'none\'?\'\':\'none\'" style="font-size:14px;font-weight:700;color:var(--violet2);cursor:pointer;letter-spacing:2px;display:flex;align-items:center;gap:6px">';
    html += '<span style="transition:transform .2s;display:inline-block">▶</span>📖 奇门术语解读';
    html += '</div>';
    html += '<div style="display:none;margin-top:10px;font-size:12px;color:var(--paper2);line-height:2;opacity:.85">';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">遁局：</strong>奇门遁甲分阳遁九局、阴遁九局共十八局，以节气定遁，冬至阳遁、夏至阴遁</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">值符：</strong>六甲旬首所乘之干为值符，为十干之帅，主导全局走向。值符所落之宫为用神参考，值符所在之宫百事可为</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">值使：</strong>值符所落之宫对应的八门为值使，为执行之神，管事之出入。值使所落之宫定事情执行力强弱</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">六仪三奇：</strong>六仪为戊己庚辛壬癸，三奇为乙丙丁。乙为日奇、丙为月奇、丁为星奇，三奇得使为吉</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">天盘干/地盘干：</strong>天盘干为流动之干，代表外在条件；地盘干为固定之干，代表内在基础。天地盘组合断吉凶</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">八门：</strong>休、生、伤、杜、景、死、惊、开。开门、休门、生门为三吉门；死门、惊门、伤门为三凶门</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">九星：</strong>天蓬（大凶）、天任（吉）、天冲（中吉）、天辅（大吉）、天英（中平）、天芮（大凶）、天柱（凶）、天心（大吉）、天禽（吉，寄中宫）。吉星落旺相之宫则吉力倍增，落休囚之宫则吉力减半</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">八神：</strong>值符、腾蛇、太阴、六合、白虎、玄武、九地、九天。值符最吉，白虎玄武主凶</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">用神：</strong>奇门断事取用之天干，如问事业取时干为用神，问婚姻取乙为女、庚为男</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">空亡：</strong>旬空之地，力量减损。用神落空亡则事难成，需出空之日方应</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">马星：</strong>驿马之星，主动态、出行、变化。马星临宫主事有变动、宜行动</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">五不遇时：</strong>时干克日干，为奇门大忌，百事不宜，须改日再谋</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">后天八卦排列：</strong>坎一（北）、坤二（西南）、震三（东）、巽四（东南）、中五、乾六（西北）、兑七（西）、艮八（东北）、离九（南）</div>';
    html += '<div><strong style="color:var(--gold)">应期：</strong>预测事情发生的时间，以用神所落宫位的地支当令之月为应期</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">伏吟：</strong>天地盘干同宫为伏吟，主事迟滞不顺，宜静不宜动，守旧为吉。[舒晗密训] 伏吟用冲（以动制静），主静止、慢、痛、呻吟反复</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">反吟：</strong>天地盘干相冲为反吟，主事反复多变，动荡不安，利客不利主。[舒晗密训] 反吟用合（以静制动），主快而反复，波动变幻</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">击刑：</strong>天盘干与地盘干相刑害，主刑伤破耗，用神遇击刑则事多波折。[舒晗密训] 化解用合解法/通关法/移位法</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">入墓：</strong>天盘干落入墓库之宫，力量被收藏，主事隐晦不显，需冲开之日方应。[舒晗密训] 化解用冲开法/库库转化/敲击法</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">门迫：</strong>八门五行克宫位五行，力量受制。[舒晗密训] 化解用通关法/换宫法/五行调和法</div>';
    html += '<div><strong style="color:var(--gold)">空亡：</strong>旬空之地，力量减损。用神落空亡则事难成，需出空之日方应。[舒晗密训] 化解用填实法/冲起法/合住法</div>';
    html += '</div></div>';
    // 化解方案
    try {
      let _cureHtml = getQimenResolution(pan, analyze);
      if (_cureHtml && _cureHtml.trim()) {
        html += '<div class="bazi-new-module">';
        html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔮 化解方案与开运建议 <span class="toggle-icon">▼</span></div>';
        html += '<div class="bazi-module-body collapsed"><div id="qimen-cure-result">' + _cureHtml + '</div></div>';
        html += '</div>';
      }
    } catch(_ce) { console.warn('奇门化解引擎错误:', _ce); }
    // === V3引擎校准 ===
    try {
      if (window.QimenV3) {
        let v3QmResult = QimenV3.qimenCalcV3(now.getFullYear(), now.getMonth()+1, now.getDate(), hour, 'auto');
        let v3QmAnalysis = QimenV3.analyzeQimenFull(v3QmResult);
        let v3QmHtml = '<div class="bazi-new-module">';
        v3QmHtml += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔬 V3校准版排盘 <span class="toggle-icon">▼</span></div>';
        v3QmHtml += '<div class="bazi-module-body collapsed">';
        // 遁局信息
        v3QmHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(138,92,246,0.04);border-radius:8px">';
        v3QmHtml += '<div style="font-size:12px;color:var(--violet2);margin-bottom:6px">遁局（V3 天文节气校准）</div>';
        v3QmHtml += '<div style="font-size:13px;line-height:1.8"><strong>' + v3QmResult.juName + '</strong> | ';
        v3QmHtml += v3QmResult.jieqi + v3QmResult.yuan + ' | 太阳黄经 ' + v3QmResult.jieqiLongitude.toFixed(2) + '°</div>';
        v3QmHtml += '<div style="font-size:12px;opacity:.7">日干支: ' + v3QmResult.dayGzName + ' | 时干支: ' + v3QmResult.hourGzName + '</div>';
        v3QmHtml += '<div style="font-size:12px;opacity:.7">值符: ' + (QimenV3.STARS_FULL[v3QmResult.zhiFuStar]||v3QmResult.zhiFuStar) + '落' + v3QmResult.zhiFuGong + '宫 | 值使: ' + (QimenV3.MEN_FULL[v3QmResult.zhiShiMen]||v3QmResult.zhiShiMen) + '</div>';
        v3QmHtml += '</div>';
        // 天地盘
        v3QmHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(138,92,246,0.04);border-radius:8px">';
        v3QmHtml += '<div style="font-size:12px;color:var(--violet2);margin-bottom:6px">九宫天地盘</div>';
        v3QmHtml += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;font-size:11px">';
        let _gongOrder = [4,9,2,3,5,7,8,1,6]; // 后天八卦排列
        for (let gi = 0; gi < _gongOrder.length; gi++) {
          let gp = _gongOrder[gi];
          let gName = QimenV3.JIU_GONG_NAME[gp] || '';
          let gDi = v3QmResult.dipan[gp] || '—';
          let gTi = v3QmResult.tianpan[gp] || '—';
          let gMen = v3QmResult.men[gp] || '';
          let gStar = v3QmResult.stars[gp] || '';
          let gShen = v3QmResult.shen[gp] || '';
          let gBg = gp === 5 ? 'rgba(0,0,0,0.05)' : 'rgba(138,92,246,0.03)';
          v3QmHtml += '<div style="padding:6px;border:1px solid rgba(138,92,246,0.15);border-radius:6px;background:' + gBg + ';text-align:center">';
          v3QmHtml += '<div style="font-weight:bold;font-size:10px;color:var(--violet2)">' + gName + '(' + gp + ')</div>';
          if (gp === 5) {
            v3QmHtml += '<div style="font-size:10px;opacity:.5">中宫寄宫</div>';
            v3QmHtml += '<div style="font-size:10px">天' + gTi + '地' + gDi + '</div>';
            if (gStar) v3QmHtml += '<div style="font-size:10px">' + (QimenV3.STARS_FULL[gStar]||gStar) + '</div>';
          } else {
            v3QmHtml += '<div style="font-size:11px">天<strong>' + gTi + '</strong>地<strong>' + gDi + '</strong></div>';
            if (gMen) v3QmHtml += '<div style="font-size:10px;color:var(--gold)">' + (QimenV3.MEN_FULL[gMen]||gMen) + '</div>';
            if (gStar) v3QmHtml += '<div style="font-size:10px;color:var(--violet)">' + (QimenV3.STARS_FULL[gStar]||gStar) + '</div>';
            if (gShen) v3QmHtml += '<div style="font-size:10px;opacity:.7">' + gShen + '</div>';
          }
          // 标注空亡/马星
          let tags = [];
          if (v3QmResult.kongWang && v3QmResult.kongWang.indexOf(gp) >= 0) tags.push('空');
          if (v3QmResult.maXing === gp) tags.push('马');
          if (tags.length > 0) v3QmHtml += '<div style="font-size:9px;color:var(--fire)">' + tags.join(' ') + '</div>';
          v3QmHtml += '</div>';
        }
        v3QmHtml += '</div></div>';
        // 格局判断
        if (v3QmAnalysis && v3QmAnalysis.gejuText) {
          v3QmHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(138,92,246,0.04);border-radius:8px">';
          v3QmHtml += '<div style="font-size:12px;color:var(--violet2);margin-bottom:6px">格局判断（V3校准）</div>';
          v3QmHtml += '<div style="font-size:12px;line-height:1.8">' + v3QmAnalysis.gejuText + '</div>';
          if (v3QmResult.wuBuYu && v3QmResult.wuBuYu.isWuBuYu) {
            v3QmHtml += '<div style="font-size:12px;color:var(--fire);margin-top:4px">⚠️ ' + v3QmResult.wuBuYu.desc + '</div>';
          }
          v3QmHtml += '</div>';
        }
        // 断语
        if (v3QmAnalysis && v3QmAnalysis.advice) {
          v3QmHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(46,204,113,0.04);border-radius:8px">';
          v3QmHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">断语（V3校准）</div>';
          v3QmHtml += '<div style="font-size:12px;line-height:1.8"><strong>吉凶: ' + v3QmAnalysis.luck + '</strong> — ' + v3QmAnalysis.advice + '</div>';
          // 详细信息
          if (v3QmAnalysis.details && v3QmAnalysis.details.length > 0) {
            for (let di = 0; di < v3QmAnalysis.details.length; di++) {
              let d = v3QmAnalysis.details[di];
              v3QmHtml += '<div style="font-size:11px;margin-top:4px;opacity:.8"><strong>' + d.label + ':</strong> ' + d.content + '</div>';
            }
          }
          v3QmHtml += '</div>';
        }
        v3QmHtml += '<div style="text-align:center;font-size:10px;opacity:.3;letter-spacing:2px;margin-top:8px">⚡ Powered by QimenV3 Engine</div>';
        v3QmHtml += '</div></div>';
        html += v3QmHtml;
      }
    } catch(e6) { console.warn('QimenV3 error:', e6); }
    let dims = analyze.dimensions || {};
    if (Object.keys(dims).length > 0) {
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;margin-top:12px;font-size:12px">';
      for (let dk in dims) html += '<div>' + dk + '：' + dims[dk] + '</div>';
      html += '</div>';
    }
    _showEngineResult('qmEngineResult', html);
  } catch(e) { showToast('奇门引擎错误：'+e.message); }
}

function runLiurenEngine() {
  try {
    let lrResult = document.getElementById('lrResult');
    if(lrResult) lrResult.classList.add('visible');
    const dateVal = document.getElementById('lrDate')?.value;
    const hourVal = document.getElementById('lrHour')?.value;
    const now = dateVal ? new Date(dateVal + 'T00:00:00') : new Date();
    const hour = hourVal ? parseInt(hourVal) : now.getHours();
    const pan = liurenPaiPan(now.getFullYear(), now.getMonth()+1, now.getDate(), hour, 0);
    const analyze = liurenAnalyze(pan, document.getElementById('lrQuestion')?.value || '所问之事');
        // 🎯 排盘结论总览
    let _lrLuckColor = analyze.luck === '吉' ? 'var(--jade)' : (analyze.luck === '凶' ? 'var(--cinn2)' : 'var(--warn)');
    let _lrSummary = '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
    _lrSummary += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:2px">🎯 排盘结论总览</div>';
    _lrSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>吉凶判定：</b><span style="color:' + _lrLuckColor + ';font-weight:600;font-size:16px">' + analyze.luck + '</span></div>';
    _lrSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>三传脉络：</b><span style="color:var(--gold)">' + pan.sanChuan.chu + '</span>（起因）→ <span style="color:var(--gold)">' + pan.sanChuan.zhong + '</span>（过程）→ <span style="color:var(--gold)">' + pan.sanChuan.mo + '</span>（结局）</div>';
    _lrSummary += '<div style="font-size:12px;line-height:1.8;margin-bottom:6px"><b>月将：</b>' + pan.yueJiang + ' · <b>取法：</b>' + (pan.sanChuan.method || '贼克法') + ' · <b>三传神将：</b>' + (Array.isArray(analyze.chuanShen) ? analyze.chuanShen.join(' → ') : (analyze.chuanShen||'无')) + '</div>';
    _lrSummary += '<div style="font-size:12px;line-height:1.8;opacity:.85;margin-bottom:6px"><b>事态发展：</b>初传为事之始因，中传为事之经过，末传为事之结局。三传皆吉则事成顺遂，末传为凶则结局难美。</div>';
    _lrSummary += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b>建议：</b>' + (analyze.advice || '大六壬为古法占卜，重在参考。君子谋道不谋食，行正道自有天佑。') + '</div>';
    _lrSummary += '</div>';
    let html = '<h4 style="color:var(--orange)">⬡ 六壬引擎演算结果</h4>';
    html += _lrSummary;
    html += '<p><b>日干支：</b>' + pan.dayGan + pan.dayZhi + ' · 占时：' + pan.shiZhi + '</p>';
    html += '<p><b>月将：</b>' + pan.yueJiang + '</p>';
    html += '<p><b>三传：</b>' + pan.sanChuan.chu + ' → ' + pan.sanChuan.zhong + ' → ' + pan.sanChuan.mo + '</p>';
    html += '<p><b>取法：</b>' + (pan.sanChuan.method || '贼克法') + '</p>';
    html += '<p><b>三传神将：</b>' + analyze.chuanShen.join(' → ') + '</p>';
    html += '<p><b>吉凶：</b>' + analyze.luck + '</p>';
    html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
    // === 大六壬四课三传排盘 ===
    try {
      // 四课表
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">⬡ 四课</div>';
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
      html += '<tr style="background:rgba(201,168,76,0.08);color:var(--gold2)"><th style="padding:5px 8px">课序</th><th>上神</th><th>下神</th><th>天将</th><th>神将含义</th><th>说明</th></tr>';
      let _keLabels = ['第一课', '第二课', '第三课', '第四课'];
      for (let ki = 0; ki < pan.siKe.length; ki++) {
        let _ke = pan.siKe[ki];
        let _keJiang = pan.tianJiang[_ke.shang] || '—';
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">';
        html += '<td style="padding:5px 8px;text-align:center;color:var(--gold2)">' + _keLabels[ki] + '</td>';
        html += '<td style="text-align:center;font-weight:600;color:var(--gold2)">' + _ke.shang + '</td>';
        html += '<td style="text-align:center">' + _ke.xia + '</td>';
        let _jiangMeaning = '';
        let _jiangMap = {'贵人':'主贵人提携','螣蛇':'主虚惊怪异','朱雀':'主口舌文书','六合':'主和合婚姻','勾陈':'主拖延争讼','青龙':'主财喜吉庆','天空':'主空虚诈伪','白虎':'主血光丧服','太常':'主衣食宴饮','玄武':'主盗贼暗昧','太阴':'主阴私暗助','天后':'主妇女姻缘'};
        _jiangMeaning = _jiangMap[_keJiang] || '';
        html += '<td style="text-align:center">' + _keJiang + '</td>';
        html += '<td style="text-align:center;font-size:11px;opacity:.6">' + _jiangMeaning + '</td>';
        html += '<td style="text-align:center;font-size:11px;opacity:.7">' + _ke.label + '</td>';
        html += '</tr>';
      }
      html += '</table></div>';
      // 日干寄宫信息
      let _ganGongMap = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
      let _dgGong = _ganGongMap[pan.dayGan] || '寅';
      html += '<div style="padding:8px 16px;font-size:11px;opacity:.7;border-top:1px solid var(--border)">日干' + pan.dayGan + '寄宫于' + _dgGong + ' | 日支' + pan.dayZhi + '</div>';
      html += '</div>';
      // 三传详情表
      let _chuan = pan.sanChuan;
      let _chuanNames = ['初传', '中传', '末传'];
      let _chuanZhi = [_chuan.chu, _chuan.zhong, _chuan.mo];
      let _zhiWxMap = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">⬡ 三传详情 — ' + (_chuan.method || '贼克法') + '</div>';
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
      html += '<tr style="background:rgba(201,168,76,0.08);color:var(--gold2)"><th style="padding:5px 8px">传序</th><th>天盘</th><th>地盘</th><th>神将</th><th>神将含义</th><th>五行</th><th>六亲</th></tr>';
      for (let ci = 0; ci < 3; ci++) {
        let _cz = _chuanZhi[ci];
        let _cJiang = pan.tianJiang[_cz] || '—';
        let _cWx = _zhiWxMap[_cz] || '—';
        // 六亲: 以日干为主与初传论六亲
        let _ganWx = {'甲':'木','乙':'木','丙':'火','丁':'火','戊':'土','己':'土','庚':'金','辛':'金','壬':'水','癸':'水'};
        let _gWx = _ganWx[pan.dayGan] || '木';
        let _cLq = '—';
        if (_gWx === _cWx) _cLq = '比肩';
        else if ((_gWx === '金' && _cWx === '水') || (_gWx === '水' && _cWx === '木') || (_gWx === '木' && _cWx === '火') || (_gWx === '火' && _cWx === '土') || (_gWx === '土' && _cWx === '金')) _cLq = '子孙';
        else if ((_gWx === '金' && _cWx === '木') || (_gWx === '水' && _cWx === '火') || (_gWx === '木' && _cWx === '土') || (_gWx === '火' && _cWx === '金') || (_gWx === '土' && _cWx === '水')) _cLq = '妻财';
        else if ((_gWx === '金' && _cWx === '火') || (_gWx === '水' && _cWx === '土') || (_gWx === '木' && _cWx === '金') || (_gWx === '火' && _cWx === '水') || (_gWx === '土' && _cWx === '木')) _cLq = '官鬼';
        else if ((_gWx === '金' && _cWx === '土') || (_gWx === '水' && _cWx === '金') || (_gWx === '木' && _cWx === '水') || (_gWx === '火' && _cWx === '木') || (_gWx === '土' && _cWx === '火')) _cLq = '父母';
        // 地盘 = 天盘所临地盘
        let _dpan = _cz; // 地盘: 天盘所临地盘
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">';
        html += '<td style="padding:5px 8px;text-align:center;color:var(--gold2);font-weight:600">' + _chuanNames[ci] + '</td>';
        html += '<td style="text-align:center;font-weight:600;color:var(--gold2)">' + _cz + '</td>';
        html += '<td style="text-align:center">' + _dpan + '</td>';
        let _cJiangMeaning = '';
        let _cJiangMap = {'贵人':'贵人提携','螣蛇':'虚惊怪异','朱雀':'口舌文书','六合':'和合婚姻','勾陈':'拖延争讼','青龙':'财喜吉庆','天空':'空虚诈伪','白虎':'血光丧服','太常':'衣食宴饮','玄武':'盗贼暗昧','太阴':'阴私暗助','天后':'妇女姻缘'};
        _cJiangMeaning = _cJiangMap[_cJiang] || '';
        html += '<td style="text-align:center">' + _cJiang + '</td>';
        html += '<td style="text-align:center;font-size:11px;opacity:.6">' + _cJiangMeaning + '</td>';
        html += '<td style="text-align:center">' + _cWx + '</td>';
        html += '<td style="text-align:center">' + _cLq + '</td>';
        html += '</tr>';
      }
      html += '</table></div>';
      // 课体格局
      if (analyze.keti) {
        html += '<div style="padding:8px 16px;font-size:11px;opacity:.7;border-top:1px solid var(--border)">课体格局：' + analyze.keti + '</div>';
      }
      html += '</div>';
      // === 大六壬天地盘方阵图 ===
      try {
        let _lrBranches = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
        // 方位排列：子在下方、午在上方、卯在左、酉在右
        // 4x4网格，但只用于12地支的圆形布局
        // 方位顺序（从上到下，从左到右）：
        // 巳 午 未 申
        // 辰    中   酉
        // 卯    心   戌
        // 寅 丑 子 亥
        let _lrLayout = [
          ['巳','午','未','申'],
          ['辰','','','酉'],
          ['卯','','','戌'],
          ['寅','丑','子','亥']
        ];
        // 四课地支
        let _ke1Shang = pan.siKe[0].shang, _ke1Xia = pan.siKe[0].xia;
        let _ke2Shang = pan.siKe[1].shang, _ke2Xia = pan.siKe[1].xia;
        let _ke3Shang = pan.siKe[2].shang, _ke3Xia = pan.siKe[2].xia;
        let _ke4Shang = pan.siKe[3].shang, _ke4Xia = pan.siKe[3].xia;
        // 三传
        let _chu = pan.sanChuan.chu, _zhong = pan.sanChuan.zhong, _mo = pan.sanChuan.mo;
        // 检查地支是否属于四课
        function _isKeZhi(zhi) {
          for (let ki = 0; ki < 4; ki++) {
            if (pan.siKe[ki].shang === zhi || pan.siKe[ki].xia === zhi) return (ki+1);
          }
          return 0;
        }
        // 检查是否为三传
        function _isChuanZhi(zhi) {
          if (zhi === _chu) return 1;
          if (zhi === _zhong) return 2;
          if (zhi === _mo) return 3;
          return 0;
        }
        html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
        html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">⬡ 天地盘方阵图</div>';
        html += '<div style="padding:16px;display:flex;justify-content:center">';
        html += '<div style="display:grid;grid-template-columns:repeat(4,64px);grid-template-rows:repeat(4,64px);gap:2px;background:var(--border);padding:2px;border-radius:8px">';
        for (let ri = 0; ri < 4; ri++) {
          for (let ci = 0; ci < 4; ci++) {
            let _dpZhi = _lrLayout[ri][ci];
            if (!_dpZhi) {
              // 中宫
              if (ri === 1 && ci === 1) {
                html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:var(--gold)">';
                html += '<div style="font-weight:700;font-size:11px">初传</div>';
                html += '<div style="font-size:14px;color:var(--gold);font-weight:700;font-family:Ma Shan Zheng,serif">' + _chu + '</div>';
                html += '<div style="font-size:9px;opacity:.6">↓</div>';
                html += '<div style="font-size:13px;color:var(--gold2)">' + _zhong + '</div>';
                html += '<div style="font-size:9px;opacity:.6">↓</div>';
                html += '<div style="font-size:13px;color:var(--jade2)">' + _mo + '</div>';
                html += '</div>';
              } else if (ri === 1 && ci === 2) {
                html += '<div style="background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.08);display:flex;align-items:center;justify-content:center;font-size:10px;color:var(--gold);opacity:.5">三传</div>';
              } else if (ri === 2 && ci === 1) {
                html += '<div style="background:rgba(201,168,76,0.04);border:1px solid rgba(201,168,76,0.08);display:flex;align-items:center;justify-content:center;font-size:9px;color:var(--paper3);opacity:.4;text-align:center;line-height:1.3">月将<br>' + pan.yueJiang + '</div>';
              } else if (ri === 2 && ci === 2) {
                html += '<div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:10px;color:var(--gold)">';
                html += '<div style="font-size:9px;opacity:.6">占时</div>';
                html += '<div style="font-size:14px;font-family:Ma Shan Zheng,serif">' + pan.shiZhi + '</div>';
                html += '</div>';
              } else {
                html += '<div style="background:rgba(255,255,255,0.01);border:1px solid rgba(201,168,76,0.04)"></div>';
              }
            } else {
              let _tpZhi = pan.tianPan[_dpZhi] || _dpZhi;
              let _keNum = _isKeZhi(_dpZhi);
              let _chuanNum = _isChuanZhi(_tpZhi);
              let _cellBg = 'rgba(255,255,255,0.02)';
              let _cellBorder = 'rgba(201,168,76,0.1)';
              let _keColor = 'var(--paper3)';
              if (_keNum === 1) { _cellBg = 'rgba(46,204,113,0.08)'; _cellBorder = 'rgba(46,204,113,0.3)'; _keColor = 'var(--jade2)'; }
              else if (_keNum === 2) { _cellBg = 'rgba(52,152,219,0.08)'; _cellBorder = 'rgba(52,152,219,0.3)'; _keColor = 'var(--cyan2)'; }
              else if (_keNum === 3) { _cellBg = 'rgba(155,89,182,0.08)'; _cellBorder = 'rgba(155,89,182,0.3)'; _keColor = 'var(--violet2)'; }
              else if (_keNum === 4) { _cellBg = 'rgba(230,126,34,0.08)'; _cellBorder = 'rgba(230,126,34,0.3)'; _keColor = 'var(--orange)'; }
              let _chuanMark = '';
              if (_chuanNum === 1) _chuanMark = '<div style="font-size:8px;color:var(--gold);font-weight:700">初</div>';
              else if (_chuanNum === 2) _chuanMark = '<div style="font-size:8px;color:var(--gold2);font-weight:700">中</div>';
              else if (_chuanNum === 3) _chuanMark = '<div style="font-size:8px;color:var(--jade2);font-weight:700">末</div>';
              html += '<div style="background:' + _cellBg + ';border:1px solid ' + _cellBorder + ';display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2px">';
              html += '<div style="font-size:9px;color:' + _keColor + ';opacity:.8">' + (_keNum > 0 ? '课' + _keNum : '') + '</div>';
              html += '<div style="font-size:16px;font-weight:700;color:var(--gold2);font-family:Ma Shan Zheng,serif">' + _tpZhi + '</div>';
              html += '<div style="font-size:8px;opacity:.5">/</div>';
              html += '<div style="font-size:13px;color:var(--paper3);font-family:Ma Shan Zheng,serif">' + _dpZhi + '</div>';
              html += _chuanMark;
              html += '</div>';
            }
          }
        }
        html += '</div>';
        html += '</div>';
        // 图例
        html += '<div style="padding:6px 12px;font-size:10px;opacity:.7;text-align:center;border-top:1px solid var(--border)">';
        html += '天盘/地盘叠加 · 子在下方·午在上方·卯在左·酉在右<br>';
        html += '<span style="color:var(--jade2)">■</span>第一课 · <span style="color:var(--cyan2)">■</span>第二课 · <span style="color:var(--violet2)">■</span>第三课 · <span style="color:var(--orange)">■</span>第四课 · <span style="color:var(--gold)">初/中/末</span>=三传';
        html += '</div>';
        html += '</div>';
      } catch(_lrv) { console.warn('六壬天地盘方阵图错误:', _lrv); }
      // 天盘地盘对照表
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      let _lrYongshenZhi = '';
      try { if (analyze.yongshen) _lrYongshenZhi = analyze.yongshen; } catch(_e) {}
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">⬡ 天盘 ↔ 地盘对照' + (_lrYongshenZhi ? ' · 用神：' + _lrYongshenZhi : '') + '</div>';
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:11px">';
      html += '<tr style="background:rgba(201,168,76,0.08);color:var(--gold2)"><th style="padding:4px 6px">地盘</th><th>天盘</th><th>天将</th><th>地盘</th><th>天盘</th><th>天将</th><th>地盘</th><th>天盘</th><th>天将</th><th>地盘</th><th>天盘</th><th>天将</th></tr>';
      let _brArr = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      for (let bi = 0; bi < 3; bi++) {
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.03)">';
        for (let bj = 0; bj < 4; bj++) {
          let _bIdx = bi * 4 + bj;
          let _bZhi = _brArr[_bIdx];
          let _tZhi = pan.tianPan[_bZhi] || _bZhi;
          let _tJiang = pan.tianJiang[_tZhi] || '—';
          html += '<td style="padding:4px 6px;text-align:center;color:var(--gold2)">' + _bZhi + '</td>';
          html += '<td style="text-align:center;font-weight:600">' + _tZhi + '</td>';
          html += '<td style="text-align:center;font-size:10px;opacity:.8">' + _tJiang + '</td>';
        }
        html += '</tr>';
      }
      html += '</table></div>';
      // 月将与时辰信息
      html += '<div style="padding:8px 16px;font-size:11px;opacity:.7;border-top:1px solid var(--border)">月将：' + pan.yueJiang + ' | 占时：' + pan.shiZhi + ' | 日干支：' + pan.dayGan + pan.dayZhi + '</div>';
      html += '</div>';
      // 课体格局详解
      if (analyze.keti) {
        let _ketiParts = analyze.keti.split('、');
        html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
        html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📋 课体格局判断</div>';
        html += '<div style="padding:12px 16px;font-size:12px;line-height:2">';
        let _ketiDescMap = {
          '重审课': '重审课——上克下，事多反复，宜再审而后行',
          '审理课': '审理课——下克上，事有冤抑，宜昭雪',
          '比用课': '比用课——同类相比，事因朋友而起',
          '涉害课': '涉害课——历经艰难，事多波折',
          '遁克课': '遁克课——暗中有克，事有隐忧',
          '昴星课': '昴星课——无贼无克，取昴星为用，事出意外',
          '别责课': '别责课——别取合神为用，事须借力',
          '八专课': '八专课——干支同位，事由内起',
          '伏吟课': '伏吟课——天地伏匿，事当静守',
          '返吟课': '返吟课——天地反复，事多动荡',
          '三传三合': '三传三合局，力量凝聚，事可成就'
        };
        for (let _ki = 0; _ki < _ketiParts.length; _ki++) {
          let _kName = _ketiParts[_ki].trim();
          let _kDesc = _ketiDescMap[_kName] || _kName;
          let _ketiLuck = '';
        let _ketiLuckMap = {'重审课':'凶','审理课':'凶','比用课':'平','涉害课':'凶','遁克课':'凶','昴星课':'平','别责课':'平','八专课':'平','伏吟课':'凶','返吟课':'凶','三传三合':'吉'};
        _ketiLuck = _ketiLuckMap[_kName] || '平';
        let _ketiLuckColor = _ketiLuck === '吉' ? 'var(--jade2)' : _ketiLuck === '凶' ? 'var(--fire)' : 'var(--gold)';
        html += '<div style="padding:4px 0"><span style="color:var(--gold2);font-weight:600">' + _kName + '</span> <span style="color:' + _ketiLuckColor + ';font-size:11px;font-weight:600">[' + _ketiLuck + ']</span>：' + _kDesc + '</div>';
        }
        html += '</div></div>';
      }
    } catch(_lpe) { console.warn('六壬排盘渲染错误:', _lpe); }
    // === 🎯 断课结论总览 ===
    html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(230,126,34,0.08),rgba(230,126,34,0.02));border:1px solid rgba(230,126,34,0.2);border-radius:12px">';
    html += '<div style="font-size:14px;font-weight:700;color:var(--orange);margin-bottom:8px;letter-spacing:2px">🎯 断课结论总览</div>';
    html += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>日干支：</b>' + pan.dayGan + pan.dayZhi + ' · <b>占时：</b>' + pan.shiZhi + ' · <b>月将：</b>' + pan.yueJiang + '</div>';
    html += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>三传：</b>' + pan.sanChuan.chu + ' → ' + pan.sanChuan.zhong + ' → ' + pan.sanChuan.mo + '（' + (pan.sanChuan.method || '贼克法') + '）</div>';
    html += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>吉凶：</b><span style="color:' + (analyze.luck === '吉' ? 'var(--jade2)' : analyze.luck === '凶' ? 'var(--fire)' : 'var(--gold)') + ';font-weight:600">' + analyze.luck + '</span></div>';
    if (analyze.keti) html += '<div style="font-size:12px;line-height:1.8;margin-bottom:6px;opacity:.8"><b>课体：</b>' + analyze.keti + '</div>';
    html += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b>断语：</b>' + analyze.advice + '</div>';
    html += '</div>';
    // === 📋 大六壬白话解读 ===
    try {
      let _lrPlain = '<div class="bazi-new-module">';
      _lrPlain += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">📋 六壬白话解读 <span class="toggle-icon">▼</span></div>';
      _lrPlain += '<div class="bazi-module-body collapsed" style="padding:12px 16px">';
      // 基于实际盘面数据做个性化推演
      let _lrCS = analyze.chuanShen || ['贵人','贵人','贵人'];
      let _lrSC = analyze.sanChuan || [pan.sanChuan.chu, pan.sanChuan.zhong, pan.sanChuan.mo];
      let _lrGood = ['贵人','青龙','六合','太阴','天后','太常'];
      let _lrBad = ['腾蛇','朱雀','勾陈','白虎','玄武','天空'];
      let _lrZhiWx = {'子':'水','丑':'土','寅':'木','卯':'木','辰':'土','巳':'火','午':'火','未':'土','申':'金','酉':'金','戌':'土','亥':'水'};
      let _lrWxKe = {'金':'木','木':'土','土':'水','水':'火','火':'金'};
      // 三传天将吉凶
      let _lrChuJi = _lrGood.includes(_lrCS[0]);
      let _lrZhongJi = _lrGood.includes(_lrCS[1]);
      let _lrMoJi = _lrGood.includes(_lrCS[2]);
      let _lrChuXiong = _lrBad.includes(_lrCS[0]);
      let _lrMoXiong = _lrBad.includes(_lrCS[2]);
      // 三传五行生克
      let _lrChuWx = _lrZhiWx[_lrSC[0]] || '土';
      let _lrMoWx = _lrZhiWx[_lrSC[2]] || '土';
      let _lrMoShengChu = (_lrWxKe[_lrMoWx] === _lrChuWx); // 末传克初传
      let _lrChuShengMo = (_lrWxKe[_lrChuWx] === _lrMoWx); // 初传克末传
      let _lrLuckColor2 = analyze.luck === '吉' ? 'var(--jade)' : (analyze.luck === '凶' ? 'var(--cinn2)' : 'var(--warn)');
      // 1. 三传论事 — 基于三传天将与五行生克
      _lrPlain += '<div style="background:rgba(231,76,60,.04);border-left:3px solid ' + _lrLuckColor2 + ';padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _lrPlain += '<div style="font-size:13px;font-weight:bold;color:' + _lrLuckColor2 + ';margin-bottom:4px">⬡ 三传论事</div>';
      let _lrSCDesc = '初传<b>' + _lrSC[0] + '</b>（' + _lrCS[0] + '）为事之始因，';
      if (_lrChuJi) _lrSCDesc += '初传吉将（' + _lrCS[0] + '），主事初有贵人扶持，开端顺利。';
      else if (_lrChuXiong) _lrSCDesc += '初传凶将（' + _lrCS[0] + '），主事初有阻碍，需谨慎起步。';
      else _lrSCDesc += '初传天将平缓，事初无大碍。';
      _lrSCDesc += '中传<b>' + _lrSC[1] + '</b>（' + _lrCS[1] + '）为事之经过，';
      if (_lrZhongJi) _lrSCDesc += '中传吉将，中途有转机。';
      else if (_lrBad.includes(_lrCS[1])) _lrSCDesc += '中传凶将，中途有波折。';
      else _lrSCDesc += '中传平稳。';
      _lrSCDesc += '末传<b>' + _lrSC[2] + '</b>（' + _lrCS[2] + '）为事之结局，';
      if (_lrMoJi) _lrSCDesc += '末传吉将，结局圆满。';
      else if (_lrMoXiong) _lrSCDesc += '末传凶将，结局需防不利。';
      else _lrSCDesc += '末传平稳。';
      if (_lrMoShengChu) _lrSCDesc += '末传克初传，先难后易，事情先逆后顺。';
      else if (_lrChuShengMo) _lrSCDesc += '初传克末传，先易后难，需防虎头蛇尾。';
      else _lrSCDesc += '初末无克，事态前后一贯。';
      _lrSCDesc += '取法：<b>' + (pan.sanChuan.method||'贼克法') + '</b>。';
      _lrPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + _lrSCDesc + '</div>';
      _lrPlain += '</div>';
      // 2. 事业谋为 — 基于四课干支关系
      let _lrKe1 = pan.siKe[0] || {shang:'',xia:''};
      let _lrKe3 = pan.siKe[2] || {shang:'',xia:''};
      let _lrGanShang = _lrKe1.shang;
      let _lrZhiShang = _lrKe3.shang;
      let _lrGanWx2 = _lrZhiWx[_lrGanShang] || '土';
      let _lrZhiWx2 = _lrZhiWx[_lrZhiShang] || '土';
      let _lrGanShengZhi = (_lrWxKe[_lrGanWx2] === _lrZhiWx2);
      let _lrZhiShengGan = (_lrWxKe[_lrZhiWx2] === _lrGanWx2);
      _lrPlain += '<div style="background:rgba(52,152,219,.04);border-left:3px solid var(--cyan2);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _lrPlain += '<div style="font-size:13px;font-weight:bold;color:var(--cyan2);margin-bottom:4px">💼 事业谋为</div>';
      let _lrSYDesc = '日干上神为<b>' + _lrGanShang + '</b>（' + _lrGanWx2 + '），日支上神为<b>' + _lrZhiShang + '</b>（' + _lrZhiWx2 + '）。';
      if (_lrGanShengZhi) _lrSYDesc += '干上神克支上神，自身条件优于外部环境，利于主动出击。初传天将<b>' + _lrCS[0] + '</b>临初传，';
      else if (_lrZhiShengGan) _lrSYDesc += '支上神克干上神，外部阻力较大，宜以守为攻。初传天将<b>' + _lrCS[0] + '</b>，';
      else _lrSYDesc += '干支上神无克，局势平稳。初传天将<b>' + _lrCS[0] + '</b>，';
      if (_lrChuJi) _lrSYDesc += '贵人方位可寻。';
      else _lrSYDesc += '需防小人之力。';
      _lrPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + _lrSYDesc + '</div>';
      _lrPlain += '</div>';
      // 3. 财运分析 — 基于青龙位置
      let _lrHasQingLong = _lrCS.indexOf('青龙') >= 0;
      let _lrQLPos = _lrCS.indexOf('青龙');
      _lrPlain += '<div style="background:rgba(39,174,96,.04);border-left:3px solid var(--jade);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _lrPlain += '<div style="font-size:13px;font-weight:bold;color:var(--jade);margin-bottom:4px">💰 财运分析</div>';
      let _lrCYDesc = '';
      if (_lrHasQingLong) {
        let _lrQLChuan = ['初传','中传','末传'][_lrQLPos];
        _lrCYDesc = '青龙临<b>' + _lrQLChuan + '</b>（' + _lrSC[_lrQLPos] + '），主财运到来。';
        if (_lrQLPos === 0) _lrCYDesc += '财运来得早，宜把握时机。';
        else if (_lrQLPos === 2) _lrCYDesc += '财运来得晚，需耐心等待。';
        else _lrCYDesc += '财运中期而至，稳步推进。';
      } else {
        let _lrHasBaiHu = _lrCS.indexOf('白虎') >= 0;
        if (_lrHasBaiHu) _lrCYDesc = '白虎临三传，财运有破耗之象，宜守财不宜投资。';
        else _lrCYDesc = '三传无青龙，财运平缓。看末传<b>' + _lrSC[2] + '</b>（' + _lrCS[2] + '），';
        if (_lrMoJi) _lrCYDesc += '末传吉将，最终有得。';
        else _lrCYDesc += '末传无吉将，量力而行。';
      }
      if (_lrMoShengChu) _lrCYDesc += '末传克初传，财先失后得。';
      _lrPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + _lrCYDesc + '</div>';
      _lrPlain += '</div>';
      // 4. 感情婚姻 — 基于天后/六合位置
      let _lrHasTianHou = _lrCS.indexOf('天后') >= 0;
      let _lrHasLiuHe = _lrCS.indexOf('六合') >= 0;
      _lrPlain += '<div style="background:rgba(155,89,182,.04);border-left:3px solid var(--violet);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _lrPlain += '<div style="font-size:13px;font-weight:bold;color:var(--violet);margin-bottom:4px">💕 感情婚姻</div>';
      let _lrGMDesc = '';
      if (_lrHasTianHou && _lrHasLiuHe) _lrGMDesc = '天后与六合同临三传，感情和合美满，婚姻顺遂。';
      else if (_lrHasTianHou) {
        let _lrTHPos = ['初传','中传','末传'][_lrCS.indexOf('天后')];
        _lrGMDesc = '天后临<b>' + _lrTHPos + '</b>，女方主动，感情有进展。';
      } else if (_lrHasLiuHe) {
        let _lrLHPos = ['初传','中传','末传'][_lrCS.indexOf('六合')];
        _lrGMDesc = '六合临<b>' + _lrLHPos + '</b>，感情和合，宜把握时机。';
      } else {
        let _lrHasShe = _lrCS.indexOf('腾蛇') >= 0;
        let _lrHasZhu = _lrCS.indexOf('朱雀') >= 0;
        if (_lrHasShe) _lrGMDesc = '腾蛇临三传，感情多有口舌猜忌，需坦诚沟通。';
        else if (_lrHasZhu) _lrGMDesc = '朱雀临三传，多有争吵，宜忍让。';
        else _lrGMDesc = '三传无天后六合，感情平淡，顺其自然。';
      }
      _lrPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + _lrGMDesc + '</div>';
      _lrPlain += '</div>';
      // 5. 健康出行 — 基于白虎/天空位置
      let _lrHasBaiHu2 = _lrCS.indexOf('白虎') >= 0;
      let _lrHasTianKong = _lrCS.indexOf('天空') >= 0;
      _lrPlain += '<div style="background:rgba(230,126,34,.04);border-left:3px solid var(--orange);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _lrPlain += '<div style="font-size:13px;font-weight:bold;color:var(--orange);margin-bottom:4px">🏥 健康出行</div>';
      let _lrJKDesc = '';
      if (_lrHasBaiHu2) {
        let _lrBHPos = ['初传','中传','末传'][_lrCS.indexOf('白虎')];
        _lrJKDesc = '白虎临<b>' + _lrBHPos + '</b>，';
        if (_lrBHPos === 0) _lrJKDesc += '病情来势较猛，需及时就医。';
        else if (_lrBHPos === 2) _lrJKDesc += '病情后期需注意调养。';
        else _lrJKDesc += '中途有病痛之象，注意身体。';
      } else if (_lrHasTianKong) {
        _lrJKDesc = '天空临三传，多为虚惊一场，不必过虑。';
      } else {
        _lrJKDesc = '三传无白虎天空，身体无大碍。';
      }
      _lrJKDesc += '出行看驿马，驿马临身则宜出行，五不遇时不宜远行。';
      _lrPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + _lrJKDesc + '</div>';
      _lrPlain += '</div>';
      _lrPlain += '</div></div>';
      html += _lrPlain;
    } catch(_lre) { console.warn('六壬白话解读错误:', _lre); }

    // === 📋 缘主须知 ===
    html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(46,204,113,0.06),rgba(46,204,113,0.01));border:1px solid rgba(46,204,113,0.15);border-radius:12px">';
    html += '<div style="font-size:14px;font-weight:700;color:var(--jade2);margin-bottom:8px;letter-spacing:2px">📋 缘主须知</div>';
    html += '<div style="font-size:12px;line-height:2;opacity:.9">';
    html += '<div>1. 三传代表事态发展脉络：初传为起因，中传为过程，末传为结局。</div>';
    html += '<div>2. 吉凶判定为<b style="color:' + (analyze.luck === '吉' ? 'var(--jade2)' : analyze.luck === '凶' ? 'var(--fire)' : 'var(--gold)') + '">' + analyze.luck + '</b>，' + (analyze.luck === '吉' ? '宜积极行动' : analyze.luck === '凶' ? '宜守不宜进，待时而动' : '吉凶参半，需权衡利弊') + '。</div>';
    html += '<div>3. ' + analyze.advice + '</div>';
    html += '<div>4. 大六壬为古法占卜，重在参考而非定论。君子谋道不谋食，行正道自有天佑。</div>';
    html += '</div></div>';
    // === 🔧 三传推演方法（九宗门）===
    try {
      let _scMethod = pan.sanChuan.method || '贼克法';
      let _nineGates = {
        '贼克法':'四课中取下贼上（上克下为贼）者为初传，中传取初传上神，末传取中传上神。适用于四课中有克者。',
        '重审法':'与贼克法同，取上克下者为初传。上克下为贼，下克上为审。',
        '比用法':'当有多课同克时，取与日干阴阳属性相同者为用。即干阳取阳支，干阴取阴支。',
        '涉害法':'当比用法仍有多课，则以涉害深浅论。计算各课经历克数，取涉害最深者为初传。',
        '遁克法':'四课无克，取遁干之克为用。取日干遁干与四课上神论克，取克者为初传。',
        '昴星法':'四课无克且无遁克，阳日取酉宫上神为初传，阴日取从魁（酉）为初传。事出意外。',
        '别责法':'四课不全（有重复）且无克，取日干合神为初传。借力之意。',
        '八专法':'干支同位（如甲寅日），两课相同，取有克者为用，无克取刚柔日分别处理。事由内起。',
        '伏吟法':'天地盘伏吟（天盘与地盘相同），取日干寄宫为初传。事当静守。',
        '返吟法':'天地盘返吟（天盘与地盘对冲），取冲支为初传。事多动荡。'
      };
      let _methodDesc = _nineGates[_scMethod] || '根据四课生克关系，按九宗门规则取三传。';
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🔧 三传推演方法 — ' + _scMethod + '</div>';
      html += '<div style="padding:12px 16px;font-size:12px;line-height:2">';
      html += '<div style="margin-bottom:8px"><b style="color:var(--gold2)">取法：</b>' + _scMethod + '</div>';
      html += '<div style="margin-bottom:8px;opacity:.85"><b style="color:var(--gold2)">原理：</b>' + _methodDesc + '</div>';
      html += '<div style="padding:8px 10px;background:rgba(201,168,76,0.04);border-radius:8px;margin-bottom:8px"><b style="color:var(--gold2)">九宗门一览：</b>贼克法、比用法、涉害法、遁克法、昴星法、别责法、八专法、伏吟法、返吟法。本次排盘采用<b style="color:var(--gold)">' + _scMethod + '</b>。</div>';
      // 推演过程
      html += '<div style="padding:8px 10px;background:rgba(46,204,113,0.04);border-radius:8px">';
      html += '<div style="font-weight:600;color:var(--jade2);margin-bottom:4px">推演过程：</div>';
      let _dgGong2 = {'甲':'寅','乙':'辰','丙':'巳','丁':'未','戊':'巳','己':'未','庚':'申','辛':'戌','壬':'亥','癸':'丑'};
      let _ganGongZhi2 = _dgGong2[pan.dayGan] || '寅';
      html += '<div style="font-size:11px;line-height:1.8;opacity:.8">';
      html += '① 日干' + pan.dayGan + '寄宫于' + _ganGongZhi2 + '，天盘' + _ganGongZhi2 + '上为' + (pan.tianPan[_ganGongZhi2]||_ganGongZhi2) + '（第一课上神）<br>';
      html += '② 天盘' + (pan.tianPan[_ganGongZhi2]||_ganGongZhi2) + '上为' + (pan.tianPan[pan.tianPan[_ganGongZhi2]||_ganGongZhi2]||pan.tianPan[_ganGongZhi2]||_ganGongZhi2) + '（第二课阴神）<br>';
      html += '③ 日支' + pan.dayZhi + '，天盘' + pan.dayZhi + '上为' + (pan.tianPan[pan.dayZhi]||pan.dayZhi) + '（第三课上神）<br>';
      html += '④ 天盘' + (pan.tianPan[pan.dayZhi]||pan.dayZhi) + '上为' + (pan.tianPan[pan.tianPan[pan.dayZhi]||pan.dayZhi]||pan.tianPan[pan.dayZhi]||pan.dayZhi) + '（第四课阴神）<br>';
      html += '⑤ 四课排定后，按<b>' + _scMethod + '</b>规则取初传<b style="color:var(--gold)">' + pan.sanChuan.chu + '</b>，中传<b style="color:var(--gold2)">' + pan.sanChuan.zhong + '</b>，末传<b style="color:var(--jade2)">' + pan.sanChuan.mo + '</b>';
      html += '</div></div>';
      html += '</div></div>';
    } catch(_nme) { console.warn('三传推演方法渲染错误:', _nme); }
    // === 🌙 月将加占时推演过程 ===
    try {
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🌙 月将加占时推演</div>';
      html += '<div style="padding:12px 16px;font-size:12px;line-height:2;opacity:.85">';
      html += '<div style="margin-bottom:6px"><b style="color:var(--gold2)">月将：</b>' + pan.yueJiang + '（根据中气确定，月将太阳所在宫位）</div>';
      html += '<div style="margin-bottom:6px"><b style="color:var(--gold2)">占时：</b>' + pan.shiZhi + '（起卦时辰）</div>';
      html += '<div style="margin-bottom:6px"><b style="color:var(--gold2)">布盘方法：</b>将月将' + pan.yueJiang + '加临占时' + pan.shiZhi + '之上，其余地支按顺序排列，形成天盘叠加地盘之式。</div>';
      html += '<div style="padding:8px 10px;background:rgba(201,168,76,0.04);border-radius:8px;margin-bottom:6px">';
      html += '<b style="color:var(--gold2)">天盘布列：</b>地盘' + pan.shiZhi + '位→天盘' + pan.yueJiang + '，依次顺布十二支。如地盘子位天盘为' + (pan.tianPan['子']||'子') + '，地盘丑位天盘为' + (pan.tianPan['丑']||'丑') + '，以此类推。';
      html += '</div>';
      html += '<div style="opacity:.7">月将加时为六壬起手第一步，天盘既布，四课三传皆由此推演而来。</div>';
      html += '</div></div>';
    } catch(_mje) { console.warn('月将加占时推演渲染错误:', _mje); }
    // === 📝 术语注释 ===
    try {
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📝 术语注释</div>';
      html += '<div style="padding:12px 16px;font-size:11px;line-height:2;opacity:.85">';
      html += '<div><b style="color:var(--gold2)">四课：</b>以日干、日支为主，各取阳神、阴神，共四课。第一课日干阳神，第二课日干阴神，第三课日支阳神，第四课日支阴神。</div>';
      html += '<div><b style="color:var(--gold2)">三传：</b>初传（起因）、中传（过程）、末传（结局）。由四课按九宗门规则推演而得。</div>';
      html += '<div><b style="color:var(--gold2)">天将：</b>贵人、螣蛇、朱雀、六合、勾陈、青龙、天空、白虎、太常、玄武、太阴、天后。随天盘分布，主不同事象。</div>';
      html += '<div><b style="color:var(--gold2)">月将：</b>太阳所在宫位，按中气确定。月将加占时为六壬布天盘之根本方法。</div>';
      html += '<div><b style="color:var(--gold2)">课体：</b>根据四课三传结构判定，如重审、比用、涉害等，共九大宗门，决定断课方向。</div>';
      html += '<div><b style="color:var(--gold2)">六亲：</b>以日干五行为主，与三传地支五行论生克。同行为比肩，生我为父母，我生为子孙，克我为官鬼，我克为妻财。</div>';
      html += '</div></div>';
    } catch(_lrte) { console.warn('六壬术语注释渲染错误:', _lrte); }
    // === 化解方案与开运建议 ===
    try {
      let _cureHtml = getLiurenResolution(pan, analyze);
      if (_cureHtml && _cureHtml.trim()) {
        html += '<div class="bazi-new-module">';
        html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔮 化解方案与开运建议 <span class="toggle-icon">▼</span></div>';
        html += '<div class="bazi-module-body collapsed"><div id="liuren-cure-result">' + _cureHtml + '</div></div>';
        html += '</div>';
      }
    } catch(_ce) { console.warn('六壬化解引擎错误:', _ce); }
    _showEngineResult('lrEngineResult', html);
    // === V3引擎校准 ===
    try {
      if (window.LiurenV3 && LiurenV3.computeLiuRen) {
        let v3LrResult = LiurenV3.computeLiuRen(now.getFullYear(), now.getMonth()+1, now.getDate(), hour);
        let v3LrHtml = '<div class="bazi-new-module">';
        v3LrHtml += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔬 V3校准版六壬 <span class="toggle-icon">▼</span></div>';
        v3LrHtml += '<div class="bazi-module-body collapsed">';
        if (v3LrResult.dayStem) {
          v3LrHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3LrHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">四柱（V3）</div>';
          v3LrHtml += '<div style="font-size:13px;line-height:1.8">日干支：<strong>' + v3LrResult.dayStem + (v3LrResult.dayBranch || '') + '</strong> | 占时：<strong>' + (v3LrResult.hourBranch || '') + '</strong></div>';
          if (v3LrResult.yueJiang) v3LrHtml += '<div style="font-size:12px">月将：<strong>' + (v3LrResult.yueJiang.name || v3LrResult.yueJiang) + '</strong></div>';
          v3LrHtml += '</div>';
        }
        if (v3LrResult.siKe && v3LrResult.siKe.length > 0) {
          v3LrHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3LrHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">四课（V3）</div>';
          for (let ski = 0; ski < v3LrResult.siKe.length; ski++) {
            let sk = v3LrResult.siKe[ski];
            v3LrHtml += '<div style="font-size:12px;padding:2px 0">第' + (ski+1) + '课：' + (sk.gan || '') + (sk.zhi || '') + ' — ' + (sk.relation || sk.shen || '') + '</div>';
          }
          v3LrHtml += '</div>';
        }
        if (v3LrResult.sanChuan && v3LrResult.sanChuan.length > 0) {
          v3LrHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3LrHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">三传（V3）</div>';
          let scNames = ['初传','中传','末传'];
          for (let sci = 0; sci < v3LrResult.sanChuan.length; sci++) {
            let sc = v3LrResult.sanChuan[sci];
            v3LrHtml += '<div style="font-size:12px;padding:2px 0">' + (scNames[sci] || '') + '：<strong>' + (sc.gan || sc.stem || '') + (sc.zhi || sc.branch || '') + '</strong>';
            if (sc.shen || sc.tianJiang) v3LrHtml += ' | ' + (sc.shen || sc.tianJiang || '');
            if (sc.liuqin) v3LrHtml += ' | ' + sc.liuqin;
            v3LrHtml += '</div>';
          }
          v3LrHtml += '</div>';
        }
        if (v3LrResult.keTi) {
          v3LrHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px">';
          v3LrHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">课体（V3）</div>';
          v3LrHtml += '<div style="font-size:12px;line-height:1.8">' + (v3LrResult.keTi.name || v3LrResult.keTi) + '</div>';
          if (v3LrResult.keTi.desc) v3LrHtml += '<div style="font-size:12px;opacity:.7">' + v3LrResult.keTi.desc + '</div>';
          v3LrHtml += '</div>';
        }
        if (v3LrResult.report) {
          v3LrHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(46,204,113,0.04);border-radius:8px">';
          v3LrHtml += '<div style="font-size:12px;color:var(--gold);margin-bottom:6px">断语（V3）</div>';
          v3LrHtml += '<div style="font-size:12px;line-height:1.8">' + v3LrResult.report + '</div>';
          v3LrHtml += '</div>';
        }
        // R2.10: 克应分析+本命行年
        try {
          if (window.LiurenV3 && LiurenV3.analyzeKeying && v3LrResult.sanChuan) {
            let _keying = LiurenV3.analyzeKeying(v3LrResult.sanChuan, v3LrResult.hourBranch || v3LrResult.zhanShi);
            if (_keying) {
              v3LrHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(52,152,219,0.04);border-radius:8px">';
              v3LrHtml += '<div style="font-size:12px;color:var(--cyan2);margin-bottom:6px">📅 克应分析</div>';
              if (_keying.yingqi) v3LrHtml += '<div style="font-size:11px;color:var(--paper2);line-height:1.6">应期：'+_keying.yingqi+'</div>';
              if (_keying.desc) v3LrHtml += '<div style="font-size:10px;color:var(--paper3);margin-left:8px;line-height:1.5">'+_keying.desc+'</div>';
              v3LrHtml += '</div>';
            }
          }
          if (window.LiurenV3 && LiurenV3.computeBenMing) {
            let _bm = LiurenV3.computeBenMing(new Date().getFullYear(), 'male');
            if (_bm) {
              v3LrHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(155,89,182,0.04);border-radius:8px">';
              v3LrHtml += '<div style="font-size:12px;color:var(--violet);margin-bottom:6px">♟ 本命行年</div>';
              if (_bm.benMing) v3LrHtml += '<div style="font-size:11px;color:var(--paper2)">本命：'+_bm.benMing+'</div>';
              if (_bm.xingNian) v3LrHtml += '<div style="font-size:11px;color:var(--paper2)">行年：'+_bm.xingNian+'</div>';
              if (_bm.xingNianDetail) v3LrHtml += '<div style="font-size:10px;color:var(--paper3);margin-left:8px">'+_bm.xingNianDetail+'</div>';
              v3LrHtml += '</div>';
            }
          }
        } catch(eLr1) {}
        // R3.4: 课体格局辨识
        try {
          if (window.LiurenV3 && LiurenV3.analyzeKetiGeshi && v3LrResult.sanChuan) {
            let _keti = LiurenV3.analyzeKetiGeshi(v3LrResult.sanChuan, v3LrResult.hourBranch || v3LrResult.zhanShi, v3LrResult.siKe);
            if (_keti) {
              v3LrHtml += '<div style="margin-bottom:12px;padding:10px;background:rgba(243,156,18,0.04);border-radius:8px">';
              v3LrHtml += '<div style="font-size:12px;color:var(--warn);margin-bottom:6px">📋 课体格局</div>';
              if (_keti.gejuName) v3LrHtml += '<div style="font-size:11px;color:var(--paper2)">课体：<b>'+_keti.gejuName+'</b></div>';
              if (_keti.luck) v3LrHtml += '<div style="font-size:11px;color:' + (_keti.luck==='吉'?'var(--jade)':_keti.luck==='凶'?'var(--cinn2)':'var(--warn)') + '">吉凶：'+_keti.luck+'</div>';
              if (_keti.description) v3LrHtml += '<div style="font-size:10px;color:var(--paper3);margin-left:8px;line-height:1.5">'+_keti.description+'</div>';
              v3LrHtml += '</div>';
            }
          }
        } catch(eLr2) {}
        v3LrHtml += '<div style="text-align:center;font-size:10px;opacity:.3;letter-spacing:2px;margin-top:8px">⚡ Powered by LiurenV3 Engine</div>';
        v3LrHtml += '</div></div>';
        let lrResultEl = document.getElementById('lrResult') || document.getElementById('lrEngineResult');
        if (lrResultEl) lrResultEl.insertAdjacentHTML('beforeend', v3LrHtml);
      }
    } catch(e6) { console.warn('LiurenV3 error:', e6); }
  } catch(e) { showToast('六壬引擎错误：'+e.message); }
}

function runZiweiEngine() {
  try {
    let zwResult = document.getElementById('zwResult');
    if(zwResult) zwResult.classList.add('visible');
    const dateStr = document.getElementById('zwDate')?.value;
    let year = new Date().getFullYear(), month = 1, day = 1;
    if (dateStr) { const parts = dateStr.split('-').map(Number); year = parts[0]; month = parts[1]; day = parts[2]; }
    const hour = parseInt(document.getElementById('zwHour')?.value || 0);
    const sex = document.getElementById('zwSex')?.value || 'male';
    const pan = ziweiPaiPan(year, month, day, hour, sex);
    const analyze = ziweiAnalysis(pan);
    // 🎯 排盘结论总览
    let _zwSummary = '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
    _zwSummary += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:2px">🎯 排盘结论总览</div>';
    _zwSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>命宫：</b>' + pan.mingZhi + '（' + (pan.mingGan||'') + pan.mingZhi + '）· <b>身宫：</b>' + pan.shenZhi + '</div>';
    _zwSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>五行局：</b>' + pan.ju + ' · <b>格局层次：</b>' + (analyze.geju || '待定') + '</div>';
    _zwSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>四化要点：</b>' + (analyze.sihuaText || '无') + '</div>';
    _zwSummary += '<div style="font-size:12px;line-height:1.8;opacity:.85;margin-bottom:6px"><b>概述：</b>' + (analyze.overview || '命宫主星决定先天性格与人生基调，十二宫各有所司，四化流转影响各阶段运势。') + '</div>';
    _zwSummary += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b>建议：</b>' + (analyze.advice || '紫微斗数为命理参考，命由天定运由己造，行善积德自然趋吉避凶。') + '</div>';
    _zwSummary += '</div>';
    let html = '<h4 style="color:var(--fire)">🌌 紫微引擎演算结果</h4>';
    html += _zwSummary;
    html += '<p><b>命宫：</b>' + pan.mingZhi + ' · 身宫：' + pan.shenZhi + '</p>';
    html += '<p><b>五行局：</b>' + pan.ju + '</p>';
    html += '<p><b>格局：</b>' + analyze.geju + '</p>';
    html += '<p><b>四化：</b>' + analyze.sihuaText + '</p>';
    html += '<p><b>概述：</b>' + analyze.overview + '</p>';
    html += '<p style="opacity:0.8">' + analyze.advice + '</p>';

    // === 紫微十二宫格可视化盘面 ===
    try {
      let _zwMainStarsAll = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
      let _zwAuxStarsAll = ['左辅','右弼','文昌','文曲','天魁','天钺','解神','天刑','红鸾','天喜'];
      let _zwShaStarsAll = ['擎羊','陀罗','火星','铃星','地空','地劫','天马'];
      let _zwStrLabels2 = ['庙','旺','平','陷'];
      let _zwStrTable2 = {
        '紫微': [2,2,3,2,1,1,2,2,3,2,1,1], '天机': [1,1,2,3,2,1,1,1,2,3,2,1],
        '太阳': [0,1,1,2,3,3,2,1,1,2,3,3], '武曲': [2,1,1,1,2,3,2,1,1,1,2,3],
        '天同': [3,2,1,1,1,2,3,2,1,1,1,2], '廉贞': [1,1,1,2,3,2,1,1,1,2,3,2],
        '天府': [3,3,2,1,1,1,2,3,3,2,1,1], '太阴': [3,2,1,1,1,0,1,2,3,2,1,1],
        '贪狼': [1,2,3,2,1,1,1,2,3,2,1,1], '巨门': [1,1,1,2,3,2,1,1,1,2,3,2],
        '天相': [2,3,2,1,1,1,2,3,2,1,1,1], '天梁': [1,1,2,3,2,1,1,1,2,3,2,1],
        '七杀': [2,1,1,1,2,3,2,1,1,1,2,3], '破军': [1,1,1,2,3,2,1,1,1,2,3,2]
      };
      // 地支索引: 子=0,丑=1,寅=2,卯=3,辰=4,巳=5,午=6,未=7,申=8,酉=9,戌=10,亥=11
      // 经典盘面布局 (4列×4行):
      // 行1: 巳(5) 午(6) 未(7) 申(8)
      // 行2: 辰(4) [中] [中] 酉(9)
      // 行3: 卯(3) [中] [中] 戌(10)
      // 行4: 寅(2) 丑(1) 子(0) 亥(11)
      let _panLayout = [
        [5, 6, 7, 8],
        [4, -1, -1, 9],
        [3, -2, -2, 10],
        [2, 1, 0, 11]
      ];
      // 构建地支→宫位名映射
      let _zhiToGongName = {};
      for (let _gn2 = 0; _gn2 < 12; _gn2++) {
        let _gpos2 = pan.gongMap[_ZW_GONGS[_gn2]];
        _zhiToGongName[_gpos2] = _ZW_GONGS[_gn2];
      }
      // 构建地支→大限年龄映射
      let _zhiToDaxian = {};
      if (analyze.daxian && analyze.daxian.length > 0) {
        for (let _dx2 = 0; _dx2 < analyze.daxian.length; _dx2++) {
          _zhiToDaxian[analyze.daxian[_dx2].pos] = analyze.daxian[_dx2].ageRange;
        }
      }
      // 命宫和身宫的地支索引
      let _mingZhiIdx2 = pan.gongMap['命宫'];
      let _shenZhiIdx2 = -1;
      for (let _gn3 in pan.gongMap) {
        if (_gn3 === '身宫') { _shenZhiIdx2 = pan.gongMap[_gn3]; break; }
      }
      // 身宫可能不在gongMap里，用pan.shenZhi反查
      if (_shenZhiIdx2 < 0 && pan.shenZhi) {
        _shenZhiIdx2 = _BRANCHES.indexOf(pan.shenZhi);
      }

      function _buildCellHtml(zhiIdx) {
        if (zhiIdx < 0) return ''; // 不渲染
        let _zhiName = _BRANCHES[zhiIdx];
        let _gName2 = _zhiToGongName[zhiIdx] || (_zhiName + '宫');
        let _stars2 = pan.stars[zhiIdx] || [];
        let _main2 = _stars2.filter(function(s){ return _zwMainStarsAll.indexOf(s) >= 0; });
        let _aux2 = _stars2.filter(function(s){ return _zwAuxStarsAll.indexOf(s) >= 0; });
        let _sha2 = _stars2.filter(function(s){ return _zwShaStarsAll.indexOf(s) >= 0; });
        let _dxAge = _zhiToDaxian[zhiIdx] || '';
        let _isMing2 = (zhiIdx === _mingZhiIdx2);
        let _isShen2 = (zhiIdx === _shenZhiIdx2);
        let _borderColor = _isMing2 ? 'var(--gold2)' : _isShen2 ? 'var(--violet)' : 'var(--border)';
        let _borderWidth = (_isMing2 || _isShen2) ? '2px' : '1px';
        let _bgColor = _isMing2 ? 'rgba(255,215,0,0.08)' : _isShen2 ? 'rgba(155,89,182,0.08)' : 'rgba(201,168,76,0.02)';
        let _cellHtml = '<div style="border:' + _borderWidth + ' solid ' + _borderColor + ';border-radius:8px;padding:6px 4px;background:' + _bgColor + ';min-height:90px;display:flex;flex-direction:column;justify-content:flex-start;gap:2px">';
        // 宫名+地支
        _cellHtml += '<div style="font-size:11px;font-weight:600;color:var(--title);opacity:.8;text-align:center">' + _gName2 + ' · ' + _zhiName + '</div>';
        // 大限年龄
        if (_dxAge) {
          _cellHtml += '<div style="font-size:9px;color:var(--gold);opacity:.7;text-align:center">' + _dxAge + '</div>';
        }
        // 主星(大字)
        if (_main2.length > 0) {
          _cellHtml += '<div style="font-size:15px;font-weight:700;color:var(--fire2);text-align:center;line-height:1.3">' + _main2.join('<br>') + '</div>';
          // 庙旺标注
          let _strLabels3 = _main2.map(function(s) {
            let _tbl2 = _zwStrTable2[s];
            if (!_tbl2) return '';
            let _v2 = _tbl2[zhiIdx] || 1;
            return s + _zwStrLabels2[3 - _v2];
          }).filter(function(s){return s;});
          if (_strLabels3.length > 0) {
            _cellHtml += '<div style="font-size:9px;color:var(--gold);text-align:center;opacity:.8">' + _strLabels3.join(' ') + '</div>';
          }
        } else {
          _cellHtml += '<div style="font-size:12px;text-align:center;opacity:.4;padding:4px 0">—</div>';
        }
        // 辅星
        if (_aux2.length > 0) {
          _cellHtml += '<div style="font-size:10px;color:var(--gold);text-align:center;opacity:.85">' + _aux2.join(' ') + '</div>';
        }
        // 煞星
        if (_sha2.length > 0) {
          _cellHtml += '<div style="font-size:10px;color:var(--fire);text-align:center;opacity:.7">' + _sha2.join(' ') + '</div>';
        }
        _cellHtml += '</div>';
        return _cellHtml;
      }

      // 构建中心区域内容
      let _centerHtml = '<div style="grid-column:2/4;grid-row:2/4;border:1px dashed rgba(201,168,76,0.25);border-radius:10px;padding:10px;background:rgba(201,168,76,0.04);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:6px;text-align:center">';
      _centerHtml += '<div style="font-size:16px;font-weight:700;color:var(--fire2);letter-spacing:2px">紫微斗数</div>';
      _centerHtml += '<div style="font-size:12px;color:var(--gold)">命宫：' + pan.mingZhi + ' | 身宫：' + pan.shenZhi + '</div>';
      _centerHtml += '<div style="font-size:12px;color:var(--title);opacity:.8">五行局：' + pan.ju + '</div>';
      if (analyze.mingStars) {
        _centerHtml += '<div style="font-size:13px;font-weight:600;color:var(--fire2)">命主：' + analyze.mingStars + '</div>';
      }
      if (analyze.sihuaText) {
        _centerHtml += '<div style="font-size:11px;color:var(--gold);opacity:.85;max-width:140px;line-height:1.5">' + analyze.sihuaText + '</div>';
      }
      _centerHtml += '</div>';

      // 构建盘面网格 (4列4行)
      let _panHtml = '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      _panHtml += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🔮 紫微十二宫盘面</div>';
      _panHtml += '<div style="padding:14px">';
      _panHtml += '<div style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,auto);gap:4px;max-width:560px;margin:0 auto">';
      for (let _row = 0; _row < 4; _row++) {
        for (let _col = 0; _col < 4; _col++) {
          let _zhiIdx = _panLayout[_row][_col];
          if (_zhiIdx === -1 || _zhiIdx === -2) {
            // 中心区域，跳过（用grid-span处理）
            if (_row === 1 && _col === 1) {
              _panHtml += _centerHtml;
            }
          } else {
            _panHtml += _buildCellHtml(_zhiIdx);
          }
        }
      }
      _panHtml += '</div>';
      // 图例
      _panHtml += '<div style="display:flex;gap:16px;justify-content:center;margin-top:10px;font-size:11px;opacity:.7">';
      _panHtml += '<span><span style="display:inline-block;width:12px;height:12px;border:2px solid var(--gold2);border-radius:3px;vertical-align:middle;margin-right:4px"></span>命宫</span>';
      _panHtml += '<span><span style="display:inline-block;width:12px;height:12px;border:2px solid var(--violet);border-radius:3px;vertical-align:middle;margin-right:4px"></span>身宫</span>';
      _panHtml += '</div>';
      _panHtml += '</div></div>';
      html += _panHtml;

      // === 天地盘对照表 ===
      let _diPanZhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🌍 天地盘对照表</div>';
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
      html += '<tr style="background:rgba(201,168,76,0.08)"><th style="padding:6px;border:1px solid var(--border);text-align:left">宫位</th><th style="padding:6px;border:1px solid var(--border);text-align:left">天盘地支</th><th style="padding:6px;border:1px solid var(--border);text-align:left">地盘地支</th><th style="padding:6px;border:1px solid var(--border);text-align:left">说明</th></tr>';
      for (let _ti = 0; _ti < 12; _ti++) {
        let _tGongName = _ZW_GONGS[_ti];
        let _tGongPos = pan.gongMap[_tGongName];
        let _tianPanZhi = _BRANCHES[_tGongPos]; // 天盘地支（实际排盘结果）
        let _diPanZhi2 = _diPanZhi[_ti]; // 地盘地支（固定顺序：命宫=子,兄弟=丑...）
        let _tExplain = '天盘' + _tianPanZhi + '位→地盘' + _diPanZhi2 + '位';
        html += '<tr><td style="padding:5px 6px;border:1px solid var(--border);font-weight:600">' + _tGongName + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border);color:var(--fire2)">' + _tianPanZhi + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border);color:var(--gold)">' + _diPanZhi2 + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border);font-size:11px;opacity:.6">' + _tExplain + '</td></tr>';
      }
      html += '</table></div></div>';
    } catch(_panErr) { console.warn('紫微盘面可视化错误:', _panErr); }

    // === 十二宫星曜分布表 ===
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🌃 十二宫星曜分布</div>';
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<tr style="background:rgba(201,168,76,0.08)"><th style="padding:6px;border:1px solid var(--border);text-align:left">宫位</th><th style="padding:6px;border:1px solid var(--border);text-align:left">宫支</th><th style="padding:6px;border:1px solid var(--border);text-align:left">主星</th><th style="padding:6px;border:1px solid var(--border);text-align:left">星曜含义</th><th style="padding:6px;border:1px solid var(--border);text-align:left">辅星</th><th style="padding:6px;border:1px solid var(--border);text-align:left">煞星</th><th style="padding:6px;border:1px solid var(--border);text-align:left">庙旺</th></tr>';
    let _zwMainStars = ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
    let _zwAuxStars = ['左辅','右弼','文昌','文曲','天魁','天钺','解神','天刑','红鸾','天喜'];
    let _zwShaStars = ['擎羊','陀罗','火星','铃星','地空','地劫','天马'];
    let _zwStrengthTable = {
      '紫微': [2,2,3,2,1,1,2,2,3,2,1,1], '天机': [1,1,2,3,2,1,1,1,2,3,2,1],
      '太阳': [0,1,1,2,3,3,2,1,1,2,3,3], '武曲': [2,1,1,1,2,3,2,1,1,1,2,3],
      '天同': [3,2,1,1,1,2,3,2,1,1,1,2], '廉贞': [1,1,1,2,3,2,1,1,1,2,3,2],
      '天府': [3,3,2,1,1,1,2,3,3,2,1,1], '太阴': [3,2,1,1,1,0,1,2,3,2,1,1],
      '贪狼': [1,2,3,2,1,1,1,2,3,2,1,1], '巨门': [1,1,1,2,3,2,1,1,1,2,3,2],
      '天相': [2,3,2,1,1,1,2,3,2,1,1,1], '天梁': [1,1,2,3,2,1,1,1,2,3,2,1],
      '七杀': [2,1,1,1,2,3,2,1,1,1,2,3], '破军': [1,1,1,2,3,2,1,1,1,2,3,2]
    };
    let _zwStrengthLabels = ['庙','旺','平','陷'];
    for (let _gi = 0; _gi < 12; _gi++) {
      let _gName = _ZW_GONGS[_gi];
      let _gPos = pan.gongMap[_gName];
      let _gZhi = _BRANCHES[_gPos];
      let _gStars = pan.stars[_gPos] || [];
      let _gMain = _gStars.filter(function(s){ return _zwMainStars.indexOf(s) >= 0; });
      let _gAux = _gStars.filter(function(s){ return _zwAuxStars.indexOf(s) >= 0; });
      let _gSha = _gStars.filter(function(s){ return _zwShaStars.indexOf(s) >= 0; });
      let _gStr = _gMain.map(function(s){
        let _tbl = _zwStrengthTable[s];
        if (!_tbl) return s;
        let _v = _tbl[_gPos] || 1;
        return s + '(' + _zwStrengthLabels[3 - _v] + ')';
      }).join('、') || '—';
      let _isMing = (_gName === '命宫');
      html += '<tr' + (_isMing ? ' style="background:rgba(231,76,60,0.06)"' : '') + '>';
      html += '<td style="padding:5px 6px;border:1px solid var(--border);font-weight:' + (_isMing ? '700' : '400') + '">' + _gName + '</td>';
      html += '<td style="padding:5px 6px;border:1px solid var(--border)">' + _gZhi + '</td>';
      let _starMeaningMap = {'紫微':'帝星，主尊贵领导','天机':'智慧，主谋略思辨','太阳':'光明，主热情贵气','武曲':'财星，主刚毅果断','天同':'福星，主安逸享受','廉贞':'囚星，主桃花是非','天府':'库星，主稳重保守','太阴':'月星，主阴柔细腻','贪狼':'桃花，主欲望才艺','巨门':'暗星，主口舌是非','天相':'印星，主辅佐服务','天梁':'荫星，主清高庇荫','七杀':'将星，主肃杀开创','破军':'耗星，主破旧立新'};
        let _gMainMeaning = _gMain.map(function(s){ let n = s.replace(/\(.*?\)/,''); return _starMeaningMap[n] || ''; }).filter(function(s){return s;}).join('、');
        html += '<td style="padding:5px 6px;border:1px solid var(--border);color:var(--fire2)">' + (_gMain.join('、') || '—') + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border);font-size:11px;opacity:.6">' + (_gMainMeaning || '—') + '</td>';
      html += '<td style="padding:5px 6px;border:1px solid var(--border);color:var(--gold)">' + (_gAux.join('、') || '—') + '</td>';
      html += '<td style="padding:5px 6px;border:1px solid var(--border);color:var(--fire)">' + (_gSha.join('、') || '—') + '</td>';
      html += '<td style="padding:5px 6px;border:1px solid var(--border);font-size:11px">' + _gStr + '</td>';
      html += '</tr>';
    }
    html += '</table></div></div>';

    // === 四化落宫详情 ===
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">✨ 四化落宫详情</div>';
    html += '<div style="padding:12px;display:grid;grid-template-columns:repeat(2,1fr);gap:8px;font-size:13px">';
    let _sihuaNames = [['lu','化禄','禄'],['quan','化权','权'],['ke','化科','科'],['ji','化忌','忌']];
    let _sihuaColors = { '禄':'var(--jade2)', '权':'var(--fire2)', '科':'var(--gold)', '忌':'var(--fire)' };
    for (let _si = 0; _si < 4; _si++) {
      let _sh = _sihuaNames[_si];
      let _starName = pan.sihua[_sh[0]];
      let _gongP = -1;
      for (let _pi = 0; _pi < 12; _pi++) {
        if ((pan.stars[_pi] || []).indexOf(_starName) >= 0) { _gongP = _pi; break; }
      }
      let _gongLabel = _gongP >= 0 ? _getGongName(_gongP, pan.gongMap) + '(' + _BRANCHES[_gongP] + ')' : '未定位';
      html += '<div style="padding:8px 10px;border:1px solid var(--border);border-radius:8px;background:rgba(201,168,76,0.03)">';
      html += '<span style="color:' + _sihuaColors[_sh[2]] + ';font-weight:700">' + _sh[1] + '</span> ';
      html += '<span style="color:var(--gold)">' + _starName + '</span> ';
      html += '<span style="opacity:.7">→</span> ';
      html += '<span style="font-weight:600">' + _gongLabel + '</span>';
      let _sihuaImpact = {'禄':'财运亨通，机缘增多，该宫位事物顺遂','权':'权力提升，掌控增强，该宫位事物有主导权','科':'名声显达，贵人相助，该宫位事物受肯定','忌':'阻碍不顺，执念纠结，该宫位事物多波折'};
      let _sihuaAction = {'禄':'顺势而为，把握机遇','权':'勇于担当，主动出击','科':'提升自我，广结善缘','忌':'保守为宜，化解执念'};
      html += '<div style="font-size:11px;opacity:.7;margin-top:4px">' + (_sihuaImpact[_sh[2]] || '') + '</div>';
      html += '<div style="font-size:11px;color:var(--gold);margin-top:2px">→ ' + (_sihuaAction[_sh[2]] || '') + '</div>';
      html += '</div>';
    }
    html += '</div></div>';

    // === 三方四正分析 ===
    let _mingPos = pan.gongMap['命宫'];
    let _opp = {0:6,1:7,2:8,3:9,4:10,5:11,6:0,7:1,8:2,9:3,10:4,11:5};
    let _qianPos = (_mingPos + 4) % 12;
    let _guanPos = (_mingPos + 5) % 12;
    let _migPos = _opp[_mingPos];
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📐 三方四正分析</div>';
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<tr style="background:rgba(201,168,76,0.08)"><th style="padding:6px;border:1px solid var(--border);text-align:left">宫位</th><th style="padding:6px;border:1px solid var(--border);text-align:left">宫支</th><th style="padding:6px;border:1px solid var(--border);text-align:left">星曜</th><th style="padding:6px;border:1px solid var(--border);text-align:left">关系</th></tr>';
    let _sfpData = [
      ['命宫', _mingPos, _BRANCHES[_mingPos], pan.stars[_mingPos] || [], '本宫'],
      ['迁移', _migPos, _BRANCHES[_migPos], pan.stars[_migPos] || [], '对宫'],
      ['财帛', _qianPos, _BRANCHES[_qianPos], pan.stars[_qianPos] || [], '三合'],
      ['官禄', _guanPos, _BRANCHES[_guanPos], pan.stars[_guanPos] || [], '三合']
    ];
    for (let _si2 = 0; _si2 < _sfpData.length; _si2++) {
      let _d = _sfpData[_si2];
      html += '<tr><td style="padding:5px 6px;border:1px solid var(--border);font-weight:600">' + _d[0] + '</td>';
      html += '<td style="padding:5px 6px;border:1px solid var(--border)">' + _d[2] + '</td>';
      html += '<td style="padding:5px 6px;border:1px solid var(--border);color:var(--gold)">' + (_d[3].join('、') || '无主星') + '</td>';
      html += '<td style="padding:5px 6px;border:1px solid var(--border);opacity:.7">' + _d[4] + '</td></tr>';
    }
    html += '</table></div></div>';

    // === 大运排布表 ===
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🕐 大运排布</div>';
    if (analyze.daxian && analyze.daxian.length > 0) {
      html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:12px">';
      html += '<tr style="background:rgba(201,168,76,0.08)"><th style="padding:6px;border:1px solid var(--border);text-align:left">大限</th><th style="padding:6px;border:1px solid var(--border);text-align:left">宫位</th><th style="padding:6px;border:1px solid var(--border);text-align:left">宫支</th><th style="padding:6px;border:1px solid var(--border);text-align:left">年龄</th><th style="padding:6px;border:1px solid var(--border);text-align:left">主星</th><th style="padding:6px;border:1px solid var(--border);text-align:left">四化</th></tr>';
      for (let _di = 0; _di < analyze.daxian.length; _di++) {
        let _dy = analyze.daxian[_di];
        let _dyZhi = _BRANCHES[_dy.pos] || '';
        let _dyHua = (_dy.sihua && _dy.sihua.length > 0) ? _dy.sihua.join('、') : '—';
        let _isCurrent = analyze.currentDaxian && analyze.currentDaxian.indexOf(_dy.gong + '(' + _dy.ageRange) >= 0;
        html += '<tr' + (_isCurrent ? ' style="background:rgba(46,204,113,0.06)"' : '') + '>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border)">' + (_di + 1) + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border);font-weight:' + (_isCurrent ? '700' : '400') + '">' + _dy.gong + (_isCurrent ? ' ★' : '') + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border)">' + _dyZhi + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border)">' + _dy.ageRange + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border);color:var(--gold)">' + _dy.stars + '</td>';
        html += '<td style="padding:5px 6px;border:1px solid var(--border)">' + _dyHua + '</td>';
        html += '</tr>';
      }
      html += '</table></div>';
      if (analyze.currentDaxian) {
        html += '<div style="padding:8px 12px;font-size:12px;color:var(--jade2)">📍 当前大限：' + analyze.currentDaxian + '</div>';
        // 当前大运详细分析
        try {
          let _curDyIdx = -1;
          for (let _cdi = 0; _cdi < analyze.daxian.length; _cdi++) {
            if (analyze.currentDaxian.indexOf(analyze.daxian[_cdi].gong) >= 0 && analyze.currentDaxian.indexOf(analyze.daxian[_cdi].ageRange) >= 0) { _curDyIdx = _cdi; break; }
          }
          if (_curDyIdx >= 0) {
            let _curDy = analyze.daxian[_curDyIdx];
            html += '<div style="padding:10px 14px;margin:8px 12px;background:rgba(46,204,113,0.04);border:1px solid rgba(46,204,113,0.12);border-radius:8px;font-size:12px;line-height:1.8">';
            html += '<div style="font-weight:600;color:var(--jade2);margin-bottom:4px">🔍 当前大运详解</div>';
            html += '<div>宫位：' + _curDy.gong + '（' + (_BRANCHES[_curDy.pos] || '') + '）| 年龄：' + _curDy.ageRange + '岁</div>';
            html += '<div>主星：' + _curDy.stars + '</div>';
            if (_curDy.sihua && _curDy.sihua.length > 0) html += '<div>四化：' + _curDy.sihua.join('、') + '</div>';
            html += '<div style="opacity:.7;margin-top:4px">此大运期间，命主受' + _curDy.gong + '宫星曜影响，' + (_curDy.stars.indexOf('紫微') >= 0 || _curDy.stars.indexOf('天府') >= 0 ? '事业有成的机会较大' : _curDy.stars.indexOf('七杀') >= 0 || _curDy.stars.indexOf('破军') >= 0 ? '变动较多，宜守不宜进' : '需根据星曜庙旺综合判断') + '。</div>';
            html += '</div>';
          }
        } catch(_de) { console.warn('当前大运详解渲染错误:', _de); }
      }
    } else {
      html += '<div style="padding:12px;font-size:12px;opacity:.6">大运数据不可用</div>';
    }
    html += '</div>';

    // === 经典格局详情 ===
    if (analyze.gejuDetail && analyze.gejuDetail.length > 0) {
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📜 经典格局</div>';
      html += '<div style="padding:12px;font-size:12px;line-height:1.8">';
      let _gejuItems = analyze.gejuDetail.split('；');
      for (let _gei = 0; _gei < _gejuItems.length; _gei++) {
        if (_gejuItems[_gei].trim()) {
          html += '<div style="margin-bottom:4px;padding:4px 8px;border-left:2px solid var(--gold);background:rgba(201,168,76,0.03)">' + _gejuItems[_gei] + '</div>';
        }
      }
      html += '</div></div>';
    }

    // === 庙旺利陷表 ===
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🌟 命宫星曜庙旺</div>';
    html += '<div style="padding:12px;font-size:12px">';
    let _mingStars2 = pan.stars[pan.gongMap['命宫']] || [];
    let _mainInMing = _mingStars2.filter(function(s){ return _zwMainStars.indexOf(s) >= 0; });
    if (_mainInMing.length > 0) {
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px">';
      for (let _msi = 0; _msi < _mainInMing.length; _msi++) {
        let _ms = _mainInMing[_msi];
        let _msTbl = _zwStrengthTable[_ms];
        let _msV = _msTbl ? (_msTbl[pan.gongMap['命宫']] || 1) : 1;
        let _msLabel = _zwStrengthLabels[3 - _msV];
        let _msColor = _msV === 3 ? 'var(--jade2)' : _msV === 2 ? 'var(--gold)' : _msV === 1 ? 'var(--orange)' : 'var(--fire)';
        html += '<div style="padding:6px 8px;border:1px solid var(--border);border-radius:6px;text-align:center">';
        html += '<div style="font-weight:600">' + _ms + '</div>';
        html += '<div style="color:' + _msColor + ';font-size:14px;font-weight:700">' + _msLabel + '</div>';
        html += '</div>';
      }
      html += '</div>';
    } else {
      html += '<div style="opacity:.6">命宫无主星，需借星安宫。</div>';
    }
    html += '</div></div>';

    // === 命宫详细解读 ===
    try {
      let _mingPos2 = pan.gongMap['命宫'];
      let _mingStars3 = pan.stars[_mingPos2] || [];
      let _mingMain3 = _mingStars3.filter(function(s){ return _zwMainStars.indexOf(s) >= 0; });
      let _mingDescMap = {'紫微':'紫微星入命，为人尊贵，有领导力，但易孤高。适合管理岗位，需注意人际关系。','天机':'天机星入命，聪明好学，善于谋略，但多思多虑。适合策划、研究类工作。','太阳':'太阳星入命，热情大方，乐于助人，有贵气。适合公职、传媒，注意别太操劳。','武曲':'武曲星入命，性格刚毅，做事果断，财星入命善理财。适合金融、军警。','天同':'天同星入命，性格温和，福星入命主安逸。适合文职、服务业，注意别太懒散。','廉贞':'廉贞星入命，能干有才华，但易招桃花是非。适合艺术、公关，注意感情纠纷。','天府':'天府星入命，稳重保守，库星入命善积蓄。适合金融、管理，注意别太保守。','太阴':'太阴星入命，温柔细腻，母性光辉。适合艺术、教育，注意情绪管理。','贪狼':'贪狼星入命，多才多艺，欲望强。适合演艺、商业，注意节制欲望。','巨门':'巨门星入命，口才好但易招是非。适合律师、讲师，注意口舌之争。','天相':'天相星入命，辅佐之才，为人正直。适合公务、管理，注意别太依赖他人。','天梁':'天梁星入命，清高正直，荫星入命主庇荫。适合医疗、教育，注意别太清高。','七杀':'七杀星入命，性格刚强，开创力强。适合创业、军警，注意冲动行事。','破军':'破军星入命，破旧立新，变化多端。适合创新行业，注意感情稳定。'};
      let _mingDesc = _mingMain3.map(function(s){ return _mingDescMap[s] || ''; }).join(' ');
      if (_mingDesc) {
        html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
        html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🌟 命宫详细解读</div>';
        html += '<div style="padding:12px 16px;font-size:12px;line-height:1.8">' + _mingDesc;
        // 身宫补充
        let _shenPos = pan.gongMap['身宫'];
        if (_shenPos !== undefined && _shenPos !== _mingPos2) {
          let _shenGong = _getGongName(_shenPos, pan.gongMap);
          html += '<div style="margin-top:8px;padding-top:8px;border-top:1px solid rgba(201,168,76,0.1)"><b>身宫在' + _shenGong + '：</b>身宫代表后天造化，' + (_shenGong === '财帛' ? '重视财运' : _shenGong === '官禄' ? '重视事业' : _shenGong === '迁移' ? '重视外出发展' : _shenGong === '福德' ? '重视精神生活' : _shenGong === '夫妻' ? '重视感情家庭' : '后天发展在该领域') + '。</div>';
        }
        html += '</div></div>';
      }
    } catch(_mde) { console.warn('命宫详细解读错误:', _mde); }
    // === 📋 紫微白话解读 ===
    try {
      let _zwPlain = '<div class="bazi-new-module">';
      _zwPlain += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">📋 紫微白话解读 <span class="toggle-icon">▼</span></div>';
      _zwPlain += '<div class="bazi-module-body collapsed" style="padding:12px 16px">';
      
      // 1. 性格解读（基于命宫主星）
      let _zwMainStar = '';
      if (pan.stars && pan.stars[pan.mingPos]) {
        let _mingStars = pan.stars[pan.mingPos].filter(function(s){ return ['紫微','天机','太阳','武曲','天同','廉贞','天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'].indexOf(s.name) >= 0; });
        _zwMainStar = _mingStars.map(function(s){ return s.name; }).join('、') || '无主星';
      }
      let _zwPersonality = {
        '紫微': {trait:'帝王之气', like:'天生有领导力，做事大气，追求高品质生活', advice:'别太端着，接地气才能得人心'},
        '天机': {trait:'聪明机敏', like:'脑子转得快，善于谋划分析，学习能力超强', advice:'别想太多，行动力才是关键'},
        '太阳': {trait:'热情慷慨', like:'像太阳一样发光发热，乐于助人，光明磊落', advice:'别太操心别人，照顾好自己'},
        '武曲': {trait:'刚毅务实', like:'执行力强，做事干脆利落，财商高', advice:'别太硬碰硬，学会圆融'},
        '天同': {trait:'乐观随和', like:'天生福星，心态好，享受生活，人缘佳', advice:'别太安逸，适当给自己压力'},
        '廉贞': {trait:'能干多才', like:'能力强，交际广，但内心有傲气', advice:'别太较真，放平心态'},
        '天府': {trait:'稳重保守', like:'像银行金库一样靠谱，理财能力强，有安全感', advice:'别太保守，适当冒险'},
        '太阴': {trait:'温柔细腻', like:'像月光一样温柔，感情丰富，重视家庭', advice:'别太敏感，开心就好'},
        '贪狼': {trait:'多才多欲', like:'兴趣广泛，桃花旺，学什么都快', advice:'专注一件事，别贪多嚼不烂'},
        '巨门': {trait:'口才出众', like:'嘴巴厉害，分析能力强，适合靠嘴吃饭', advice:'少说是非，多积口德'},
        '天相': {trait:'正直可靠', like:'天生的辅佐之才，做事有板有眼，值得信赖', advice:'别太死板，学会变通'},
        '天梁': {trait:'老成持重', like:'像老大哥一样照顾人，有正义感，逢凶化吉', advice:'别太好为人师，尊重他人选择'},
        '七杀': {trait:'冲锋陷阵', like:'行动派，敢想敢干，不怕困难', advice:'别太冲动，三思而后行'},
        '破军': {trait:'破旧立新', like:'天生改革者，不安于现状，敢于打破常规', advice:'别太折腾，稳定也是种智慧'}
      };
      let _zwP = _zwPersonality[_zwMainStar.split('、')[0]] || {trait:'综合型', like:'各有所长，需结合全盘分析', advice:'发挥优势，弥补不足'};
      _zwPlain += '<div style="background:rgba(231,76,60,.04);border-left:3px solid var(--cinn2);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _zwPlain += '<div style="font-size:13px;font-weight:bold;color:var(--cinn2);margin-bottom:4px">🎭 你的性格</div>';
      _zwPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">命宫主星<b style="color:var(--gold)">' + _zwMainStar + '</b>，你是一个<b>' + _zwP.trait + '</b>的人，' + _zwP.like + '。<span style="color:var(--gold)">建议：</span>' + _zwP.advice + '</div>';
      _zwPlain += '</div>';
      
      // 2. 事业方向（基于格局）
      _zwPlain += '<div style="background:rgba(52,152,219,.04);border-left:3px solid var(--cyan2);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _zwPlain += '<div style="font-size:13px;font-weight:bold;color:var(--cyan2);margin-bottom:4px">💼 事业方向</div>';
      _zwPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + (analyze.overview || '紫微斗数以十二宫全方位推演人生，官禄宫主事业，财帛宫主财运，迁移宫主外出发展。') + '</div>';
      _zwPlain += '</div>';
      
      // 3. 财运分析（基于四化）
      _zwPlain += '<div style="background:rgba(39,174,96,.04);border-left:3px solid var(--jade);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _zwPlain += '<div style="font-size:13px;font-weight:bold;color:var(--jade);margin-bottom:4px">💰 财运分析</div>';
      _zwPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">四化影响财运：' + (analyze.sihuaText || '化禄增财、化权增势、化科增名、化忌增阻') + '。财运强弱看财帛宫主星旺衰，大运流年逢化禄则财旺。</div>';
      _zwPlain += '</div>';
      
      // 4. 感情婚姻（基于夫妻宫）
      _zwPlain += '<div style="background:rgba(155,89,182,.04);border-left:3px solid var(--violet);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _zwPlain += '<div style="font-size:13px;font-weight:bold;color:var(--violet);margin-bottom:4px">💕 感情婚姻</div>';
      _zwPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">夫妻宫反映婚姻状况。紫微在夫妻宫配偶强势，天机在夫妻宫配偶聪明，七杀在夫妻宫婚姻多波折。化忌入夫妻宫需注意感情经营，化禄入夫妻宫感情顺遂。</div>';
      _zwPlain += '</div>';
      
      // 5. 健康提示（基于疾厄宫）
      _zwPlain += '<div style="background:rgba(230,126,34,.04);border-left:3px solid var(--orange);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _zwPlain += '<div style="font-size:13px;font-weight:bold;color:var(--orange);margin-bottom:4px">🏥 健康提示</div>';
      _zwPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">疾厄宫主健康。五行局决定体质偏向：水二局注意肾脏泌尿，木三局注意肝胆筋骨，金四局注意肺部呼吸，土五局注意脾胃消化，火六局注意心脏血压。大运化忌入疾厄宫时需格外注意身体。</div>';
      _zwPlain += '</div>';
      
      _zwPlain += '</div></div>';
      html += _zwPlain;
    } catch(_zpe) { console.warn('紫微白话解读错误:', _zpe); }

    // === 📋 缘主须知 ===
    html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(231,76,60,0.06),rgba(231,76,60,0.01));border:1px solid rgba(231,76,60,0.15);border-radius:12px">';
    html += '<div style="font-size:14px;font-weight:700;color:var(--fire2);margin-bottom:8px;letter-spacing:2px">📋 缘主须知</div>';
    html += '<div style="font-size:12px;line-height:2;opacity:.9">';
    html += '<div>1. 命宫主星决定先天格局，' + (analyze.overview || '需综合十二宫判断') + '。</div>';
    html += '<div>2. 四化影响各宫位运势，化禄增财、化权增势、化科增名、化忌增阻。</div>';
    html += '<div>3. 大运每十年一转，当前大运对人生影响重大，需把握机遇。</div>';
    html += '<div>4. ' + (analyze.advice || '紫微斗数为命理参考，切勿迷信。') + '</div>';
    html += '<div>5. 命由天定，运由己造。行善积德，自然趋吉避凶。</div>';
    html += '</div></div>';
    // === 📖 术语解释 ===
    html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(231,76,60,0.04),rgba(231,76,60,0.01));border:1px solid rgba(231,76,60,0.12);border-radius:12px">';
    html += '<div onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==\'none\'?\'\':\'none\'" style="font-size:14px;font-weight:700;color:var(--fire2);cursor:pointer;letter-spacing:2px;display:flex;align-items:center;gap:6px">';
    html += '<span style="transition:transform .2s;display:inline-block">▶</span>📖 紫微术语解读';
    html += '</div>';
    html += '<div style="display:none;margin-top:10px;font-size:12px;color:var(--paper2);line-height:2;opacity:.85">';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">紫微斗数：</strong>以紫微星为北斗之尊，统御十四正曜，配十二宫垣，推演人生吉凶祸福</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">十二宫：</strong>命宫、兄弟、夫妻、子女、财帛、疾厄、迁移、奴仆（交友）、官禄、田宅、福德、父母。各管人生一方面</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">命宫：</strong>先天格局之所在，决定性格、天赋与人生基调</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">身宫：</strong>后天造化之所，代表35岁后的发展方向与人生追求</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">十四正曜：</strong>紫微、天机、太阳、武曲、天同、廉贞、天府、太阴、贪狼、巨门、天相、天梁、七杀、破军，为紫微主星</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">辅星：</strong>左辅、右弼、文昌、文曲、天魁、天钺等，辅助主星增减力量</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">煞星：</strong>擎羊、陀罗、火星、铃星、地空、地劫，主破坏、阻滞、波折</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">四化：</strong>化禄（增财顺遂）、化权（增权主导）、化科（增名贵人）、化忌（阻滞执念），为紫微断盘关键</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">庙旺利陷：</strong>星曜在不同宫位的强弱状态——庙（最强）、旺（强）、平（中）、陷（弱），影响星曜发挥</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">三方四正：</strong>本宫、对宫（迁移）、三合宫（财帛、官禄）共四个宫位，互相影响，同参论断</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">大限：</strong>紫微的大运，每十年一转，以命宫为起点逆时针排列，管十年运程</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">五行局：</strong>命宫所在宫位的纳音五行，决定大限起运年龄（水二局6岁起、木三局3岁起、金四局5岁起、土五局5岁起、火六局6岁起）</div>';
    html += '<div style="margin-bottom:4px"><strong style="color:var(--gold)">经典格局：</strong>如紫府朝垣、府相朝垣、杀破狼等特殊星曜组合，决定命局层次</div>';
    html += '<div><strong style="color:var(--gold)">天地盘：</strong>天盘为动态排盘结果（命宫实际位置），地盘为固定顺序（命宫=子位），对照参考</div>';
    html += '</div></div>';
    // === R3.1 身宫分析 ===
    try {
      if (window.ZiweiV3 && ZiweiV3.analyzeShenGong) {
        let _sg = ZiweiV3.analyzeShenGong(pan);
        if (_sg) {
          html += '<div class="bazi-new-module">';
          html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🏮 身宫分析·中晚年造化 <span class="toggle-icon">▼</span></div>';
          html += '<div class="bazi-module-body collapsed"><div style="padding:8px 0">';
          html += '<div style="margin-bottom:10px;padding:10px 12px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.15);border-radius:8px">';
          html += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:6px">身宫定位：' + _sg.shenGongName + '(' + (_sg.shenIdx >= 0 ? ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][_sg.shenIdx] : '') + '宫)</div>';
          html += '<div style="font-size:13px;color:var(--paper2);line-height:1.8;margin-bottom:6px"><b>身命关系：</b>' + _sg.shenMingRelation + '</div>';
          html += '<div style="font-size:12px;color:var(--paper2);line-height:2">' + _sg.shenMingDetail + '</div>';
          html += '</div>';
          // 身宫主星
          if (_sg.shenMainStars.length > 0) {
            html += '<div style="margin-bottom:10px"><b style="color:var(--fire2)">身宫主星：</b>';
            for (let _si = 0; _si < _sg.shenMainStars.length; _si++) {
              let _ms = _sg.shenMainStars[_si];
              let _sl = _sg.shenStrengths[_si] ? _sg.shenStrengths[_si].label : '平';
              let _sc = _sl === '庙' ? 'var(--jade)' : _sl === '旺' ? 'var(--success)' : _sl === '平' ? 'var(--warn)' : 'var(--cinn2)';
              html += '<span style="display:inline-block;padding:2px 8px;margin:2px 4px;border-radius:4px;background:' + _sc + '20;color:' + _sc + ';font-size:12px">' + _ms + '(' + _sl + ')</span>';
            }
            html += '</div>';
          } else {
            html += '<div style="margin-bottom:10px"><b style="color:var(--fire2)">身宫主星：</b><span style="color:var(--paper3);font-size:12px">无主星，借对宫之力</span></div>';
          }
          // 庙旺影响
          if (_sg.strengthAnalysis) {
            html += '<div style="margin-bottom:10px;padding:8px 10px;background:rgba(39,174,96,0.04);border-left:3px solid var(--jade);border-radius:4px"><b style="color:var(--jade);font-size:12px">中晚年运势影响：</b><div style="font-size:12px;color:var(--paper2);line-height:1.8;margin-top:4px">' + _sg.strengthAnalysis + '</div></div>';
          }
          // 煞星影响
          if (_sg.shaText) {
            html += '<div style="margin-bottom:10px;padding:8px 10px;background:rgba(231,76,60,0.04);border-left:3px solid var(--cinn2);border-radius:4px"><b style="color:var(--cinn2);font-size:12px">煞星影响：</b><div style="font-size:12px;color:var(--paper2);line-height:1.8;margin-top:4px">' + _sg.shaText + '</div></div>';
          }
          // 四化影响
          if (_sg.sihuaText) {
            html += '<div style="margin-bottom:10px;padding:8px 10px;background:rgba(142,68,173,0.04);border-left:3px solid var(--violet2);border-radius:4px"><b style="color:var(--violet2);font-size:12px">四化影响：</b><div style="font-size:12px;color:var(--paper2);line-height:1.8;margin-top:4px">' + _sg.sihuaText + '</div></div>';
          }
          html += '</div></div>';
          html += '</div>';
        }
      }
    } catch(_sgErr) { console.warn('身宫分析错误:', _sgErr); }
    // === R3.2 星曜组合分析 ===
    try {
      if (window.ZiweiV3 && ZiweiV3.analyzeStarCombos) {
        let _sc2 = ZiweiV3.analyzeStarCombos(pan);
        if (_sc2 && _sc2.gongCombos && _sc2.gongCombos.length > 0) {
          html += '<div class="bazi-new-module">';
          html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">⭐ 星曜组合分析·吉凶互参 <span class="toggle-icon">▼</span></div>';
          html += '<div class="bazi-module-body collapsed"><div style="padding:8px 0">';
          // 命宫总结
          if (_sc2.summary) {
            html += '<div style="margin-bottom:12px;padding:10px 12px;background:linear-gradient(135deg,rgba(201,168,76,0.06),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.15);border-radius:8px"><b style="color:var(--gold);font-size:13px">命宫组合总论：</b><div style="font-size:12px;color:var(--paper2);line-height:1.8;margin-top:4px">' + _sc2.summary + '</div></div>';
          }
          // 各宫组合详析
          for (let _gi = 0; _gi < _sc2.gongCombos.length; _gi++) {
            let _gc = _sc2.gongCombos[_gi];
            html += '<div style="margin-bottom:10px;padding:8px 10px;border:1px solid rgba(201,168,76,0.08);border-radius:6px">';
            html += '<div style="font-size:13px;font-weight:700;color:var(--gold);margin-bottom:6px">' + _gc.gongName + '：' + _gc.mainStars.join('、') + '</div>';
            // 各组合
            for (let _ci = 0; _ci < _gc.combos.length; _ci++) {
              let _cb = _gc.combos[_ci];
              let _jxColor = _cb.jixiong === '大吉' ? 'var(--success)' : _cb.jixiong === '吉' || _cb.jixiong === '中吉' ? 'var(--jade)' : _cb.jixiong === '大凶' ? 'var(--cinn)' : _cb.jixiong === '凶' ? 'var(--cinn2)' : 'var(--warn)';
              html += '<div style="margin:4px 0;padding:6px 8px;background:rgba(0,0,0,0.02);border-radius:4px">';
              html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">';
              html += '<span style="font-size:12px;font-weight:700;color:var(--paper1)">' + _cb.name + '</span>';
              html += '<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:' + _jxColor + '20;color:' + _jxColor + '">' + _cb.jixiong + '</span>';
              html += '</div>';
              html += '<div style="font-size:11px;color:var(--paper2);line-height:1.7">' + _cb.desc + '</div>';
              if (_cb.advice) html += '<div style="font-size:11px;color:var(--paper3);line-height:1.7;margin-top:2px">💡 ' + _cb.advice + '</div>';
              if (_cb.classic) html += '<div style="font-size:10px;color:var(--paper3);font-style:italic;margin-top:2px;opacity:0.7">📖 ' + _cb.classic + '</div>';
              html += '</div>';
            }
            // 吉凶互参
            html += '<div style="font-size:11px;color:var(--paper3);margin-top:4px;padding:4px 6px;background:rgba(0,0,0,0.03);border-radius:3px">📊 吉' + _gc.jiCount + ' / 凶' + _gc.xiongCount + ' / 平' + _gc.pingCount + ' → ' + _gc.overall + '</div>';
            html += '</div>';
          }
          html += '</div></div>';
          html += '</div>';
        }
      }
    } catch(_scErr) { console.warn('星曜组合分析错误:', _scErr); }
    // 化解方案
    try {
      let _cureHtml = getZiweiResolution(pan, analyze);
      if (_cureHtml && _cureHtml.trim()) {
        html += '<div class="bazi-new-module">';
        html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔮 化解方案与开运建议 <span class="toggle-icon">▼</span></div>';
        html += '<div class="bazi-module-body collapsed"><div id="ziwei-cure-result">' + _cureHtml + '</div></div>';
        html += '</div>';
      }
    } catch(_ce) { console.warn('紫微化解引擎错误:', _ce); }
    // === V3引擎校准 ===
    try {
      if (window.ZiweiV3) {
        let v3Zw = ZiweiV3.ziweiCalcV3(year, month, day, hour, sex);
        let v3Za = ZiweiV3.analyzeZiweiFull(v3Zw);
        let v3Html = '<div class="bazi-new-module">';
        v3Html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔬 V3校准版排盘 <span class="toggle-icon">▼</span></div>';
        v3Html += '<div class="bazi-module-body collapsed"><div id="ziweiV3Result" style="padding:8px 0">';
        // 基本信息对比
        v3Html += '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:10px">';
        v3Html += '<tr style="background:rgba(201,168,76,0.08)"><th style="padding:6px;text-align:left">项目</th><th style="padding:6px;text-align:left">原引擎</th><th style="padding:6px;text-align:left">V3校准</th></tr>';
        v3Html += '<tr><td style="padding:4px 6px">命宫</td><td style="padding:4px 6px">' + pan.mingZhi + '</td><td style="padding:4px 6px">' + v3Zw.mingGanZhi + '</td></tr>';
        v3Html += '<tr><td style="padding:4px 6px">身宫</td><td style="padding:4px 6px">' + pan.shenZhi + '</td><td style="padding:4px 6px">' + v3Zw.shenGanZhi + '</td></tr>';
        v3Html += '<tr><td style="padding:4px 6px">五行局</td><td style="padding:4px 6px">' + pan.ju + '</td><td style="padding:4px 6px">' + v3Zw.juName + '</td></tr>';
        v3Html += '<tr><td style="padding:4px 6px">命宫主星</td><td style="padding:4px 6px">' + (analyze.mingStars || '—') + '</td><td style="padding:4px 6px">' + v3Za.mingStars + '</td></tr>';
        v3Html += '<tr><td style="padding:4px 6px">格局</td><td style="padding:4px 6px" colspan="2">' + v3Za.geju + '</td></tr>';
        v3Html += '<tr><td style="padding:4px 6px">庙旺</td><td style="padding:4px 6px" colspan="2">' + v3Za.starStrength + '</td></tr>';
        v3Html += '</table>';
        // 四化落宫
        v3Html += '<div style="margin-bottom:10px"><b style="color:var(--fire2)">四化落宫：</b><br>';
        if (v3Za.sihuaDetail && v3Za.sihuaDetail.length) {
          v3Html += v3Za.sihuaDetail.join('；');
        } else {
          v3Html += v3Za.sihuaText;
        }
        v3Html += '</div>';
        // 三方四正
        v3Html += '<div style="margin-bottom:10px"><b style="color:var(--fire2)">三方四正：</b><br>';
        let sf = v3Za.sanfangDetail || {};
        v3Html += '命宫: ' + (sf['命宫']||'无主星') + ' | 迁移: ' + (sf['迁移']||'无主星') + ' | 财帛: ' + (sf['财帛']||'无主星') + ' | 官禄: ' + (sf['官禄']||'无主星');
        v3Html += '</div>';
        // 经典格局
        if (v3Za.gejuList && v3Za.gejuList.length) {
          v3Html += '<div style="margin-bottom:10px"><b style="color:var(--fire2)">经典格局：</b><ul style="margin:4px 0;padding-left:18px">';
          for (let gi = 0; gi < v3Za.gejuList.length; gi++) {
            v3Html += '<li style="margin:2px 0"><b>' + v3Za.gejuList[gi].name + '</b>：' + v3Za.gejuList[gi].text + '</li>';
          }
          v3Html += '</ul></div>';
        }
        // 大运
        v3Html += '<div style="margin-bottom:10px"><b style="color:var(--fire2)">大运排布：</b>';
        if (v3Za.currentDayun) {
          v3Html += '<br>当前大限：' + v3Za.currentDayun;
        }
        v3Html += '<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:6px">';
        v3Html += '<tr style="background:rgba(201,168,76,0.06)"><th style="padding:4px;text-align:left">宫位</th><th style="padding:4px;text-align:left">年龄</th><th style="padding:4px;text-align:left">主星</th></tr>';
        for (let di = 0; di < (v3Za.dayun||[]).length; di++) {
          let dy = v3Za.dayun[di];
          v3Html += '<tr><td style="padding:3px 4px">' + dy.gong + '(' + dy.gongZhi + ')</td><td style="padding:3px 4px">' + dy.ageRange + '</td><td style="padding:3px 4px">' + dy.stars + '</td></tr>';
        }
        v3Html += '</table></div>';
        // R1.5: 大限详析
        try {
          if (window.ZiweiV3 && window.ZiweiV3.analyzeDayunDetail) {
            let _dyDetail = window.ZiweiV3.analyzeDayunDetail(v3Zw);
            if (_dyDetail && _dyDetail.length > 0) {
              v3Html += '<div style="margin-bottom:10px"><b style="color:var(--fire2)">大限详析：</b>';
              for (let ddi = 0; ddi < Math.min(_dyDetail.length, 6); ddi++) {
                let dd = _dyDetail[ddi];
                let ddColor = dd.overview.indexOf('亨通') >= 0 ? 'var(--jade)' : dd.overview.indexOf('波折') >= 0 ? 'var(--cinn2)' : 'var(--warn)';
                v3Html += '<div style="margin-top:6px;padding:8px;background:rgba(255,255,255,.02);border-radius:6px;border-left:3px solid ' + ddColor + '">';
                v3Html += '<div style="font-size:12px"><b>' + dd.gongName + '(' + dd.gongZhi + '宫)</b> ' + dd.ageRange + ' · 大限干:' + dd.dGan + ' · 主星:' + dd.starText + '</div>';
                if (dd.strengthText) v3Html += '<div style="font-size:10px;color:var(--steel)">庙旺：' + dd.strengthText + '</div>';
                // 大限四化
                if (dd.dSihua && dd.dSihua.length > 0) {
                  v3Html += '<div style="font-size:10px;color:var(--violet)">大限四化：';
                  for (let ds = 0; ds < dd.dSihua.length; ds++) {
                    let dsh = dd.dSihua[ds];
                    v3Html += dsh.type + '(' + dsh.star + ')入' + dsh.gongName + ' ';
                  }
                  v3Html += '</div>';
                }
                v3Html += '<div style="font-size:11px;color:' + ddColor + ';margin-top:4px">' + dd.overview + '</div>';
                v3Html += '</div>';
              }
              v3Html += '</div>';
            }
          }
        } catch(e3b) { console.warn('[大限详析失败]', e3b); }
        // V3概述与建议
        v3Html += '<div style="margin-bottom:8px;padding:8px;background:rgba(201,168,76,0.04);border-radius:6px"><b>V3概述：</b>' + v3Za.overview + '</div>';
        v3Html += '<div style="opacity:0.8"><b>V3建议：</b>' + v3Za.advice + '</div>';
        // R1.4: 十二宫逐宫详析
        try {
          if (typeof buildZiweiGongAnalysisHTML === 'function') {
            let _gongHTML = buildZiweiGongAnalysisHTML(v3Zw);
            if (_gongHTML) v3Html += _gongHTML;
          }
        } catch(e4) { console.warn('[十二宫详析失败]', e4); }
        // R2.5: 四化深度释义
        try {
          if (window.ZiweiV3 && window.ZiweiV3.analyzeSihuaDetail) {
            let _shDetail = window.ZiweiV3.analyzeSihuaDetail(v3Zw);
            if (_shDetail && _shDetail.sihuaDetails && _shDetail.sihuaDetails.length > 0) {
              v3Html += '<div style="margin:14px 0;padding:14px;background:linear-gradient(135deg,rgba(155,89,182,.04),rgba(201,168,76,.03));border:1px solid rgba(155,89,182,.12);border-radius:10px">';
              v3Html += '<div style="font-size:14px;font-weight:bold;color:var(--violet);margin-bottom:10px;letter-spacing:2px">🔮 四化深度释义</div>';
              // 四化落宫详情
              for (let sdi = 0; sdi < _shDetail.sihuaDetails.length; sdi++) {
                let sd = _shDetail.sihuaDetails[sdi];
                v3Html += '<div style="margin-bottom:10px;padding:10px;background:rgba(255,255,255,.02);border-radius:8px;border-left:3px solid ' + sd.color + '">';
                v3Html += '<div style="font-size:12px;font-weight:600;color:' + sd.color + '">' + sd.type + '(' + sd.star + ') → ' + sd.gong + '(' + sd.gongZhi + '宫)</div>';
                v3Html += '<div style="font-size:11px;color:var(--paper);line-height:1.7;margin-top:4px">' + sd.meaning + '</div>';
                v3Html += '<div style="font-size:10px;color:var(--gold);margin-top:2px">💡 ' + sd.advice + '</div>';
                v3Html += '</div>';
              }
              // 四化互动分析
              if (_shDetail.sihuaInteractions && _shDetail.sihuaInteractions.length > 0) {
                v3Html += '<div style="font-size:12px;font-weight:600;color:var(--gold);margin:10px 0 6px">⚡ 四化互动分析</div>';
                for (let sii = 0; sii < _shDetail.sihuaInteractions.length; sii++) {
                  let si2 = _shDetail.sihuaInteractions[sii];
                  v3Html += '<div style="margin-bottom:8px;padding:8px 10px;background:rgba(255,255,255,.02);border-radius:6px;border-left:3px solid ' + si2.color + '">';
                  v3Html += '<div style="font-size:11px;font-weight:600;color:' + si2.color + '">' + si2.name + ' <span style="font-size:9px;opacity:.7">[' + si2.severity + ']</span></div>';
                  v3Html += '<div style="font-size:10px;opacity:.7;margin-top:2px">' + si2.desc + '</div>';
                  v3Html += '<div style="font-size:10px;color:var(--paper);margin-top:2px">' + si2.effect + '</div>';
                  v3Html += '</div>';
                }
              }
              // 生年四化 vs 大限四化对比
              if (_shDetail.daxianCompare) {
                let dc = _shDetail.daxianCompare;
                v3Html += '<div style="font-size:12px;font-weight:600;color:var(--gold);margin:10px 0 6px">🔄 生年四化 vs 大限四化(' + dc.dGan + '干)</div>';
                v3Html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:10px">';
                v3Html += '<tr style="background:rgba(201,168,76,0.06)"><th style="padding:4px;text-align:left;border:1px solid var(--border)">四化</th><th style="padding:4px;text-align:left;border:1px solid var(--border)">生年星/宫</th><th style="padding:4px;text-align:left;border:1px solid var(--border)">大限星/宫</th><th style="padding:4px;text-align:left;border:1px solid var(--border)">效果</th></tr>';
                for (let dci = 0; dci < dc.items.length; dci++) {
                  let di2 = dc.items[dci];
                  let rowColor = di2.sameGong ? 'rgba(46,204,113,0.04)' : '';
                  v3Html += '<tr' + (rowColor ? ' style="background:' + rowColor + '"' : '') + '>';
                  v3Html += '<td style="padding:4px;border:1px solid var(--border);font-weight:600">' + di2.type + '</td>';
                  v3Html += '<td style="padding:4px;border:1px solid var(--border)">' + di2.natalStar + '/' + di2.natalGong + '</td>';
                  v3Html += '<td style="padding:4px;border:1px solid var(--border)">' + di2.daxianStar + '/' + di2.daxianGong + '</td>';
                  v3Html += '<td style="padding:4px;border:1px solid var(--border);font-size:9px">' + di2.effect + (di2.sameGong ? ' ⚡' : '') + '</td>';
                  v3Html += '</tr>';
                }
                v3Html += '</table></div>';
              }
              // 总结
              v3Html += '<div style="margin-top:10px;padding:8px 12px;background:rgba(201,168,76,0.04);border-radius:6px;font-size:11px;line-height:1.7;color:var(--paper)"><b style="color:var(--gold)">释义总结：</b>' + _shDetail.summary + '</div>';
              v3Html += '</div>';
            }
          }
        } catch(eR25) { console.warn('[四化深度释义失败]', eR25); }
        // R2.6: 流年分析
        try {
          if (window.ZiweiV3 && window.ZiweiV3.analyzeLiunian) {
            let _lnYear = new Date().getFullYear();
            let _lnResult = window.ZiweiV3.analyzeLiunian(v3Zw, _lnYear);
            if (_lnResult && _lnResult.liunianGong) {
              v3Html += '<div style="margin:14px 0;padding:14px;background:linear-gradient(135deg,rgba(52,152,219,.04),rgba(201,168,76,.03));border:1px solid rgba(52,152,219,.12);border-radius:10px">';
              v3Html += '<div style="font-size:14px;font-weight:bold;color:var(--cyan2);margin-bottom:10px;letter-spacing:2px">📅 流年分析 (' + _lnYear + '年 ' + _lnResult.liunianGan + _lnResult.liunianZhi + '年)</div>';
              // 流年宫位信息
              v3Html += '<div style="padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:8px">';
              v3Html += '<div style="font-size:12px;font-weight:600;color:var(--gold)">流年宫位：' + _lnResult.liunianGong.name + '(' + _lnResult.liunianGong.zhi + '宫)</div>';
              let lnStarText = _lnResult.liunianStars.length > 0 ? _lnResult.liunianStars.join('、') : '无主星(借对宫' + (_lnResult.liunianOppStars.join('、') || '空') + ')';
              v3Html += '<div style="font-size:11px;margin-top:4px">主星：' + lnStarText + '</div>';
              if (_lnResult.liunianStrengths.length > 0) {
                let strTexts = [];
                for (let ls = 0; ls < _lnResult.liunianStrengths.length; ls++) {
                  strTexts.push(_lnResult.liunianStrengths[ls].star + '(' + _lnResult.liunianStrengths[ls].label + ')');
                }
                v3Html += '<div style="font-size:10px;color:var(--steel);margin-top:2px">庙旺：' + strTexts.join('、') + '</div>';
              }
              v3Html += '</div>';
              // 流年四化
              if (_lnResult.liunianSihua && _lnResult.liunianSihua.length > 0) {
                v3Html += '<div style="font-size:12px;font-weight:600;color:var(--gold);margin:8px 0 4px">流年四化(' + _lnResult.liunianGan + '干起)</div>';
                v3Html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
                for (let lsi = 0; lsi < _lnResult.liunianSihua.length; lsi++) {
                  let lsh2 = _lnResult.liunianSihua[lsi];
                  v3Html += '<div style="padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:10px">';
                  v3Html += '<span style="color:' + lsh2.color + ';font-weight:600">' + lsh2.type + '</span> ';
                  v3Html += '<span style="color:var(--gold)">' + lsh2.star + '</span> ';
                  v3Html += '<span style="opacity:.7">→</span> ';
                  v3Html += '<span style="font-weight:600">' + lsh2.gongName + '</span>';
                  v3Html += '</div>';
                }
                v3Html += '</div>';
              }
              // 互动分析
              v3Html += '<div style="font-size:12px;font-weight:600;color:var(--gold);margin:10px 0 4px">🔗 流年互动分析</div>';
              v3Html += '<div style="padding:8px 10px;background:rgba(255,255,255,.02);border-radius:6px;font-size:11px;line-height:1.8">';
              v3Html += '<div style="margin-bottom:4px"><b style="color:var(--cyan2)">与命宫：</b>' + _lnResult.interaction.liunianToMing + '</div>';
              if (_lnResult.interaction.daxianInteract) {
                v3Html += '<div style="margin-bottom:4px"><b style="color:var(--violet)">与大限：</b>' + _lnResult.interaction.daxianInteract + '</div>';
              }
              v3Html += '<div style="margin-bottom:4px"><b style="color:var(--jade)">对命宫：</b>' + _lnResult.interaction.sihuaImpactOnMing + '</div>';
              v3Html += '<div style="margin-bottom:4px"><b style="color:var(--orange)">对财帛：</b>' + _lnResult.interaction.sihuaImpactOnCaiwei + '</div>';
              v3Html += '<div><b style="color:var(--cinn2)">对官禄：</b>' + _lnResult.interaction.sihuaImpactOnGuanlu + '</div>';
              v3Html += '</div>';
              // 总结
              v3Html += '<div style="margin-top:10px;padding:8px 12px;background:rgba(52,152,219,0.04);border-radius:6px;font-size:11px;line-height:1.7;color:var(--paper)"><b style="color:var(--cyan2)">流年总结：</b>' + _lnResult.summary + '</div>';
              v3Html += '</div>';
            }
          }
        } catch(eR26) { console.warn('[流年分析失败]', eR26); }
        // R3.8: 小限分析
        try {
          if (window.ZiweiV3 && window.ZiweiV3.analyzeXiaoxian) {
            let _xxResult = window.ZiweiV3.analyzeXiaoxian(v3Zw);
            if (_xxResult && _xxResult.xiaoxianGong) {
              v3Html += '<div style="margin:14px 0;padding:14px;background:linear-gradient(135deg,rgba(155,89,182,.04),rgba(201,168,76,.03));border:1px solid rgba(155,89,182,.12);border-radius:10px">';
              v3Html += '<div style="font-size:14px;font-weight:bold;color:var(--violet);margin-bottom:10px;letter-spacing:2px">🔮 小限分析 (虚岁' + _xxResult.age + ')</div>';
              v3Html += '<div style="padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:8px">';
              v3Html += '<div style="font-size:12px;font-weight:600;color:var(--gold)">小限宫位：' + _xxResult.xiaoxianGong.name + '(' + _xxResult.xiaoxianGong.zhi + '宫)</div>';
              let xxStarText = _xxResult.xiaoxianStars.length > 0 ? _xxResult.xiaoxianStars.join('、') : '无主星(借对宫' + (_xxResult.xiaoxianOppStars.join('、') || '空') + ')';
              v3Html += '<div style="font-size:11px;margin-top:4px">主星：' + xxStarText + '</div>';
              if (_xxResult.xiaoxianStrengths.length > 0) {
                let xxStrTexts = [];
                for (let xxs = 0; xxs < _xxResult.xiaoxianStrengths.length; xxs++) {
                  xxStrTexts.push(_xxResult.xiaoxianStrengths[xxs].star + '(' + _xxResult.xiaoxianStrengths[xxs].label + ')');
                }
                v3Html += '<div style="font-size:10px;color:var(--steel);margin-top:2px">庙旺：' + xxStrTexts.join('、') + '</div>';
              }
              v3Html += '</div>';
              v3Html += '<div style="font-size:11px;line-height:1.8;color:var(--paper);margin-bottom:6px"><b style="color:var(--violet)">星情分析：</b>' + _xxResult.starAnalysis + '</div>';
              v3Html += '<div style="font-size:11px;line-height:1.8;color:var(--paper);margin-bottom:6px"><b style="color:var(--violet)">与命宫关系：</b>' + _xxResult.sanfangRelation + '</div>';
              v3Html += '<div style="margin-top:10px;padding:8px 12px;background:rgba(155,89,182,0.04);border-radius:6px;font-size:11px;line-height:1.7;color:var(--paper)"><b style="color:var(--violet)">小限总结：</b>' + _xxResult.summary + '</div>';
              v3Html += '</div>';
            }
          }
        } catch(eR38a) { console.warn('[小限分析失败]', eR38a); }
        // R3.8: 流月分析
        try {
          if (window.ZiweiV3 && window.ZiweiV3.analyzeLiuyue) {
            let _lyMonth = new Date().getMonth() + 1;
            let _lyResult = window.ZiweiV3.analyzeLiuyue(v3Zw, _lyMonth);
            if (_lyResult && _lyResult.liuyueGong) {
              v3Html += '<div style="margin:14px 0;padding:14px;background:linear-gradient(135deg,rgba(231,76,60,.04),rgba(201,168,76,.03));border:1px solid rgba(231,76,60,.12);border-radius:10px">';
              v3Html += '<div style="font-size:14px;font-weight:bold;color:var(--cinn2);margin-bottom:10px;letter-spacing:2px">📅 流月分析 (农历' + _lyResult.currentMonth + '月)</div>';
              v3Html += '<div style="padding:8px 10px;background:rgba(255,255,255,.02);border-radius:8px;margin-bottom:8px">';
              v3Html += '<div style="font-size:12px;font-weight:600;color:var(--gold)">流月宫位：' + _lyResult.liuyueGong.name + '(' + _lyResult.liuyueGong.zhi + '宫) &nbsp; 流月天干：' + _lyResult.liuyueGan + '</div>';
              let lyStarText = _lyResult.liuyueStars.length > 0 ? _lyResult.liuyueStars.join('、') : '无主星(借对宫' + (_lyResult.liuyueOppStars.join('、') || '空') + ')';
              v3Html += '<div style="font-size:11px;margin-top:4px">主星：' + lyStarText + '</div>';
              if (_lyResult.liuyueStrengths.length > 0) {
                let lyStrTexts = [];
                for (let lys = 0; lys < _lyResult.liuyueStrengths.length; lys++) {
                  lyStrTexts.push(_lyResult.liuyueStrengths[lys].star + '(' + _lyResult.liuyueStrengths[lys].label + ')');
                }
                v3Html += '<div style="font-size:10px;color:var(--steel);margin-top:2px">庙旺：' + lyStrTexts.join('、') + '</div>';
              }
              v3Html += '</div>';
              // 流月四化
              if (_lyResult.liuyueSihua && _lyResult.liuyueSihua.length > 0) {
                v3Html += '<div style="font-size:12px;font-weight:600;color:var(--gold);margin:8px 0 4px">流月四化(' + _lyResult.liuyueGan + '干起)</div>';
                v3Html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">';
                for (let lysi = 0; lysi < _lyResult.liuyueSihua.length; lysi++) {
                  let lysh = _lyResult.liuyueSihua[lysi];
                  v3Html += '<div style="padding:6px 8px;border:1px solid var(--border);border-radius:6px;font-size:10px">';
                  v3Html += '<span style="color:' + lysh.color + ';font-weight:600">' + lysh.type + '</span> ';
                  v3Html += '<span style="color:var(--gold)">' + lysh.star + '</span> ';
                  v3Html += '<span style="opacity:.7">→</span> ';
                  v3Html += '<span style="font-weight:600">' + lysh.gongName + '</span>';
                  v3Html += '</div>';
                }
                v3Html += '</div>';
              }
              v3Html += '<div style="font-size:11px;line-height:1.8;color:var(--paper);margin-top:8px"><b style="color:var(--cinn2)">四化影响：</b>' + _lyResult.sihuaImpact + '</div>';
              v3Html += '<div style="font-size:11px;line-height:1.8;color:var(--paper);margin-bottom:6px"><b style="color:var(--cinn2)">与命宫关系：</b>' + _lyResult.mingRelation + '</div>';
              v3Html += '<div style="margin-top:10px;padding:8px 12px;background:rgba(231,76,60,0.04);border-radius:6px;font-size:11px;line-height:1.7;color:var(--paper)"><b style="color:var(--cinn2)">流月总结：</b>' + _lyResult.summary + '</div>';
              v3Html += '</div>';
            }
          }
        } catch(eR38b) { console.warn('[流月分析失败]', eR38b); }
        v3Html += '</div></div></div>';
        html += v3Html;
      }
    } catch(e3) { console.warn('ZiweiV3 error:', e3); }
    // === 年度运势 ===
    try {
      let _afPanel = _buildAnnualFortunePanel(year, month, day, hour, sex);
      if (_afPanel) html += _afPanel;
    } catch(_afe) { console.warn('Ziwei annual fortune error:', _afe); }
    _showEngineResult('zwEngineResult', html);
  } catch(e) { showToast('紫微引擎错误：'+e.message); }
}

function runXingmingEngine() {
  try {
    const name = document.getElementById('xmName')?.value || document.getElementById('xmInput')?.value || '乾元';
    const sex = document.getElementById('xmSex')?.value || 'male';
    const res = xingmingAnalyze(name, sex);
    let html = '<h4 style="color:var(--gold)">🔤 姓名学引擎演算结果</h4>';
    if (res.error) { html += '<p>' + res.error + '</p>'; }
    else {
      html += '<p><b>姓名：</b>' + res.name + '（' + (res.sex==='male'?'男':'女') + '）</p>';
      html += '<p><b>五格：</b>天' + res.tianGe + ' · 人' + res.renGe + ' · 地' + res.diGe + ' · 外' + res.waiGe + ' · 总' + res.zongGe + '</p>';
      html += '<p><b>人格五行：</b>' + res.wuxing + ' · 三才：' + res.sancai.join('-') + '</p>';
      html += '<p><b>三才评价：</b>' + res.sancaiRelation + '</p>';
      html += '<p><b>评分：</b>' + res.score + '/100</p>';
      html += '<p style="opacity:0.8">' + res.advice + '</p>';
    }
    _showEngineResult('xmEngineResult', html);
  } catch(e) { showToast('姓名学引擎错误：'+e.message); }
}

function runFengshuiEngine() {
  try {
    const type = document.getElementById('fsType')?.value || document.getElementById('fsJianzhu')?.value || '住宅';
    const direction = document.getElementById('fsDirection')?.value || '北';
    const year = parseInt(document.getElementById('fsYear')?.value || 2024);
    const layout = document.getElementById('fsLayout')?.value || '三室两厅';
    const birthYear = parseInt(document.getElementById('fsBirthYear')?.value) || null;
    const res = fengshuiAnalyze(type, direction, year, layout, birthYear);
        // 🎯 排盘结论总览
    let _fsScoreColor = (res.score||0) >= 80 ? 'var(--jade)' : ((res.score||0) >= 60 ? 'var(--warn)' : 'var(--cinn2)');
    let _fsSummary = '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(201,168,76,0.08),rgba(201,168,76,0.02));border:1px solid rgba(201,168,76,0.2);border-radius:12px">';
    _fsSummary += '<div style="font-size:14px;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:2px">🎯 排盘结论总览</div>';
    _fsSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>风水评分：</b><span style="color:' + _fsScoreColor + ';font-weight:600;font-size:16px">' + (res.score||0) + '/100</span></div>';
    _fsSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>宅命：</b>' + res.zhaiMing + ' · <b>宅主命卦：</b>' + res.yaoMing + ' · <b>配合：</b>' + (res.matching ? '<span style="color:var(--jade)">相配</span>' : '<span style="color:var(--cinn2)">不配</span>') + '</div>';
    _fsSummary += '<div style="font-size:13px;line-height:1.8;margin-bottom:6px"><b>元运：</b>' + res.period + '运 · ' + (res.wangShan ? '<span style="color:var(--jade)">当运旺山旺向</span>' : '<span style="color:var(--warn)">非当运，需布局催旺</span>') + '</div>';
    _fsSummary += '<div style="font-size:12px;line-height:1.8;opacity:.85;margin-bottom:6px"><b>玄空：</b>' + (res.xuankong || '无') + '</div>';
    _fsSummary += '<div style="font-size:12px;line-height:1.8;opacity:.8"><b>核心建议：</b>' + (res.advice || '阳宅三要（大门、主卧、灶位）务必设在吉方，凶方以厨房或卫生间压之。九宫飞星每年变化，建议年底查看流年飞星布局更新。') + '</div>';
    _fsSummary += '</div>';
    let html = '<h4 style="color:var(--violet2)">🏔️ 风水引擎演算结果</h4>';
    html += _fsSummary;
    html += '<p><b>宅型：</b>' + res.houseType + ' · 坐向：' + res.direction + ' · 建筑年代：' + res.buildYear + '</p>';
    html += '<p><b>宅命：</b>' + res.zhaiMing + ' · 宅主命卦：' + res.yaoMing + '</p>';
    html += '<p><b>宅命配合：</b>' + (res.matching?'相配':'不配') + '</p>';
    html += '<p><b>元运：</b>' + res.period + '运 · ' + (res.wangShan?'当运':'非当运') + '</p>';
    html += '<p><b>玄空：</b>' + res.xuankong + '</p>';
    html += '<p><b>评分：</b>' + res.score + '/100</p>';
    html += '<p><b>建议：</b>' + res.advice + '</p>';

    // === 🌟 九宫飞星图 ===
    let _fsPeriod = res.period || 9;
    // 运星入中宫顺飞: 中5→西北6→西7→东北8→南9→北1→西南2→东3→东南4
    let _feiOrder = [5,6,7,8,9,1,2,3,4];
    let _gongName = {1:'坎·北',2:'坤·西南',3:'震·东',4:'巽·东南',5:'中宫',6:'乾·西北',7:'兑·西',8:'艮·东北',9:'离·南'};
    let _starName = {1:'一白',2:'二黑',3:'三碧',4:'四绿',5:'五黄',6:'六白',7:'七赤',8:'八白',9:'九紫'};
    let _starNature = {1:'水·吉',2:'土·凶',3:'木·凶',4:'木·吉',5:'土·大凶',6:'金·吉',7:'金·凶',8:'土·吉',9:'火·吉'};
    let _starColor = {1:'var(--cyan)',2:'var(--cinn2)',3:'var(--jade)',4:'var(--jade)',5:'var(--cinn2)',6:'var(--metal)',7:'var(--cinn2)',8:'var(--orange)',9:'var(--cinn2)'};
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🌟 九宫飞星图（' + _fsPeriod + '运）</div>';
    html += '<div style="padding:12px;display:flex;justify-content:center">';
    html += '<div style="display:grid;grid-template-columns:repeat(3,100px);gap:2px;background:var(--border);padding:2px;border-radius:8px">';
    // 显示顺序: 东南4→南9→西南2 / 东3→中5→西7 / 东北8→北1→西北6
    let _displayOrder = [4,9,2,3,5,7,8,1,6];
    for (let fi = 0; fi < 9; fi++) {
      let _gongNum = _displayOrder[fi];
      let _star = ((_fsPeriod - 1 + _feiOrder.indexOf(_gongNum)) % 9) + 1;
      let _isWang = (_star === _fsPeriod);
      let _bg = _isWang ? 'rgba(201,168,76,0.12)' : 'var(--card)';
      html += '<div style="background:' + _bg + ';padding:8px 6px;text-align:center;min-height:68px;display:flex;flex-direction:column;justify-content:center">';
      html += '<div style="font-size:16px;font-weight:700;color:' + (_isWang ? 'var(--gold)' : _starColor[_star]) + '">' + _star + '</div>';
      html += '<div style="font-size:10px;opacity:.5;margin-top:2px">' + _starName[_star] + '</div>';
      html += '<div style="font-size:9px;opacity:.4">' + _starNature[_star] + '</div>';
      html += '<div style="font-size:9px;color:var(--gold);opacity:.6;margin-top:2px">' + _gongName[_gongNum] + '</div>';
      if (_isWang) html += '<div style="font-size:8px;color:var(--gold);font-weight:600">★当旺</div>';
      html += '</div>';
    }
    html += '</div></div>';
    html += '<div style="padding:6px 16px 12px;font-size:11px;opacity:.5;text-align:center">运星' + _starName[_fsPeriod] + '入中宫顺飞九宫 · 金色标为当旺之星</div>';
    html += '</div>';

    // === 🏠 八宅吉凶分布 ===
    let _bazhai = res.bazhai || {};
    let _jixiongMap = {'生气':'大吉','天医':'中吉','延年':'上吉','伏位':'小吉','绝命':'大凶','五鬼':'大凶','六煞':'中凶','祸害':'小凶'};
    let _bazhaiDesc = {
      '生气':'财运大旺，生机勃勃','天医':'健康贵人，祛病延年','延年':'人缘和谐，延年益寿','伏位':'平稳安泰，守成为宜',
      '绝命':'破财损丁，凡事不顺','五鬼':'官非火灾，五鬼闹宅','六煞':'桃花口舌，财运反复','祸害':'疾病口舌，诸事波折'
    };
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🏠 八宅吉凶分布</div>';
    html += '<div style="padding:12px"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<tr style="background:rgba(201,168,76,0.08)"><th style="padding:6px;text-align:left">方位</th><th style="padding:6px;text-align:left">八宅</th><th style="padding:6px;text-align:left">吉凶</th><th style="padding:6px;text-align:left">说明</th><th style="padding:6px;text-align:left">布局建议</th></tr>';
    let _dirOrder = ['北','东北','东','东南','南','西南','西','西北'];
    for (let di = 0; di < _dirOrder.length; di++) {
      let _dir = _dirOrder[di];
      let _pos = _bazhai[_dir];
      if (!_pos) continue;
      let _luck = _jixiongMap[_pos] || '平';
      let _desc = _bazhaiDesc[_pos] || '';
      let _luckColor = _luck.includes('吉') ? 'var(--jade)' : (_luck.includes('凶') ? 'var(--cinn2)' : 'var(--text-light)');
      let _dirAdvice = '';
      if (_luck.includes('吉')) _dirAdvice = '宜设卧室、客厅、书房等常用区域；可摆放绿植、水晶、鱼缸等催旺';
      else if (_luck.includes('凶')) _dirAdvice = '宜设厨房（以火镇之）、卫生间（以凶压凶）、储物间；避免长期停留';
      else _dirAdvice = '平稳之位，可作一般用途';
      html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">';
      html += '<td style="padding:6px">' + _dir + '</td>';
      html += '<td style="padding:6px;color:var(--gold);font-weight:600">' + _pos + '</td>';
      html += '<td style="padding:6px;color:' + _luckColor + ';font-weight:600">' + _luck + '</td>';
      html += '<td style="padding:6px;opacity:.7">' + _desc + '</td>';
      html += '<td style="padding:6px;font-size:11px;opacity:.6">' + _dirAdvice + '</td>';
      html += '</tr>';
    }
    html += '</table></div></div>';

    // === 📊 宅命分析表 ===
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📊 宅命分析</div>';
    html += '<div style="padding:12px"><table style="width:100%;border-collapse:collapse;font-size:12px">';
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)"><td style="padding:6px;width:30%;opacity:.6">宅卦</td><td style="padding:6px">' + res.zhaiMing + '（' + res.direction + '向）</td></tr>';
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)"><td style="padding:6px;opacity:.6">宅主命卦</td><td style="padding:6px">' + (res.yaoMing || '未提供出生年') + (res.mingGuaNum ? '（命卦' + res.mingGuaNum + '）' : '') + '</td></tr>';
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)"><td style="padding:6px;opacity:.6">宅命配合</td><td style="padding:6px;color:' + (res.matching ? 'var(--jade)' : 'var(--cinn2)') + ';font-weight:600">' + (res.matching ? '✓ 相配 — 家宅安宁，事业顺遂' : '✗ 不配 — 易有阻滞，需布局化解') + '</td></tr>';
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)"><td style="padding:6px;opacity:.6">元运</td><td style="padding:6px">' + res.period + '运 · ' + (res.wangShan ? '<span style="color:var(--jade)">当运</span>' : '<span style="color:var(--cinn2)">非当运</span>') + '</td></tr>';
    html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04)"><td style="padding:6px;opacity:.6">二十四山</td><td style="padding:6px">' + (res.mountains || '-') + '</td></tr>';
    html += '<tr><td style="padding:6px;opacity:.6">综合评分</td><td style="padding:6px;color:var(--gold);font-weight:700">' + res.score + '/100</td></tr>';
    html += '</table></div></div>';

    // === 🧭 方位吉凶与布局建议 ===
    let _areaAdvice = {
      '大门': '宜开在生气、天医、延年吉方，忌对电梯/楼梯/尖角。门前后宜宽敞明亮。',
      '客厅': '宜设于吉方，明亮方正。财位在进门对角线，宜摆放招财物或绿植。',
      '主卧': '床头宜靠实墙，位于天医或延年方。忌横梁压顶、镜子对床。',
      '厨房': '宜坐凶方向吉方，灶口忌对门窗。火气重，宜在凶位以镇之。',
      '卫生间': '宜压凶方，忌在吉方或中宫。保持通风干燥，门常闭。'
    };
    html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
    html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🧭 分区域布局建议</div>';
    html += '<div style="padding:12px">';
    for (let _area in _areaAdvice) {
      // 根据八宅为该区域推荐方位
      let _recommend = [];
      for (let _d in _bazhai) {
        let _p = _bazhai[_d];
        if (_area === '大门' && ['生气','天医','延年','伏位'].includes(_p)) _recommend.push(_d + '(' + _p + ')');
        if (_area === '主卧' && ['天医','延年','伏位'].includes(_p)) _recommend.push(_d + '(' + _p + ')');
        if (_area === '厨房' && ['绝命','五鬼','六煞','祸害'].includes(_p)) _recommend.push(_d + '(' + _p + ')');
        if (_area === '卫生间' && ['绝命','五鬼','六煞','祸害'].includes(_p)) _recommend.push(_d + '(' + _p + ')');
        if (_area === '客厅' && ['生气','天医','延年'].includes(_p)) _recommend.push(_d + '(' + _p + ')');
      }
      let _recText = _recommend.length > 0 ? _recommend.join('、') : '依宅卦而定';
      let _areaItems = {'大门':'门垫（红色/金色招财）、门铃、玄关屏风','客厅':'貔貅摆件、发财树、黄水晶球（财位摆放）','主卧':'粉晶（旺姻缘）、葫芦（化病）、床头柜灯','厨房':'陶瓷葫芦（化火煞）、五帝钱（挂灶台上方）','卫生间':'盐灯（化浊）、黑曜石（吸煞）、常闭门'};
      let _areaItemText = _areaItems[_area] || '';
      html += '<div style="margin-bottom:12px;padding:10px;background:rgba(201,168,76,0.03);border-radius:8px;border:1px solid rgba(201,168,76,0.08)">';
      html += '<div style="font-size:13px;font-weight:600;color:var(--gold);margin-bottom:4px">' + _area + '</div>';
      html += '<div style="font-size:11px;opacity:.7;margin-bottom:4px">' + _areaAdvice[_area] + '</div>';
      html += '<div style="font-size:11px"><span style="opacity:.5">推荐方位：</span><span style="color:var(--jade)">' + _recText + '</span></div>';
      if (_areaItemText) html += '<div style="font-size:11px;margin-top:4px"><span style="opacity:.5">推荐物品：</span><span style="color:var(--gold)">' + _areaItemText + '</span></div>';
      html += '</div>';
    }
    html += '</div></div>';

    // === 原有布局提示 ===
    html += '<div style="margin:12px 0;padding:12px;background:rgba(201,168,76,0.03);border-radius:8px;border:1px solid rgba(201,168,76,0.08)">';
    html += '<div style="font-size:13px;font-weight:600;color:var(--gold);margin-bottom:8px">💡 综合布局提示</div>';
    html += '<ul style="padding-left:18px;opacity:0.8;margin:0"><li>' + res.layoutTips.join('</li><li>') + '</li></ul>';
    html += '</div>';

    // === 📋 风水白话解读 ===
    try {
      let _fsPlain = '<div class="bazi-new-module">';
      _fsPlain += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">📋 风水白话解读 <span class="toggle-icon">▼</span></div>';
      _fsPlain += '<div class="bazi-module-body collapsed" style="padding:12px 16px">';
      
      // 1. 整体评价
      let _fsScoreText = (res.score >= 80) ? '风水上佳' : (res.score >= 60) ? '风水尚可' : '风水欠佳';
      let _fsScoreColor = (res.score >= 80) ? 'var(--jade)' : (res.score >= 60) ? 'var(--warn)' : 'var(--cinn2)';
      _fsPlain += '<div style="background:rgba(231,76,60,.04);border-left:3px solid ' + _fsScoreColor + ';padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _fsPlain += '<div style="font-size:13px;font-weight:bold;color:' + _fsScoreColor + ';margin-bottom:4px">🏠 整体评价</div>';
      _fsPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + _fsOverallDesc + '</div>';
      _fsPlain += '</div>';
      
      // 2. 财运方位
      _fsPlain += '<div style="background:rgba(39,174,96,.04);border-left:3px solid var(--jade);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _fsPlain += '<div style="font-size:13px;font-weight:bold;color:var(--jade);margin-bottom:4px">💰 财运方位</div>';
      _fsPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + (res.wangShan ? '当运旺山旺向，财运亨通。大门、主卧在吉方则财源广进。' : '非当运，需在生气方或天医方摆放催财物品（如水晶、貔貅、聚宝盆）。') + '当前为<b>' + res.period + '运</b>，' + (res.period === 9 ? '九运（2024-2043）离卦当令，南方为旺方，宜做客厅或主卧。' : '需根据当运飞星布局调整。') + '</div>';
      _fsPlain += '</div>';
      
      // 3. 健康影响
      _fsPlain += '<div style="background:rgba(230,126,34,.04);border-left:3px solid var(--orange);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _fsPlain += '<div style="font-size:13px;font-weight:bold;color:var(--orange);margin-bottom:4px">🏥 健康影响</div>';
      _fsPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + _fsJKDesc + '</div>';
      _fsPlain += '</div>';
      
      // 4. 事业学业
      _fsPlain += '<div style="background:rgba(52,152,219,.04);border-left:3px solid var(--cyan2);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _fsPlain += '<div style="font-size:13px;font-weight:bold;color:var(--cyan2);margin-bottom:4px">📚 事业学业</div>';
      _fsPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">延年方主人际和谐、事业顺利，宜做客厅或书房。生气方主生机活力，宜做主卧。伏位方主平稳，宜安床。绝命、五鬼方宜做厨房或卫生间压之。书房宜设在文昌位（' + (res.period === 9 ? '九运文昌在北方' : '当运文昌位') + '），利读书考试。</div>';
      _fsPlain += '</div>';
      
      // 5. 家庭关系
      _fsPlain += '<div style="background:rgba(155,89,182,.04);border-left:3px solid var(--violet);padding:12px 16px;margin-bottom:12px;border-radius:0 8px 8px 0">';
      _fsPlain += '<div style="font-size:13px;font-weight:bold;color:var(--violet);margin-bottom:4px">👨‍👩‍👧 家庭关系</div>';
      _fsPlain += '<div style="font-size:12px;color:var(--paper);line-height:1.8">' + _fsJMDesc + '</div>';
      _fsPlain += '</div>';
      
      _fsPlain += '</div></div>';
      html += _fsPlain;
    } catch(_fse) { console.warn('风水白话解读错误:', _fse); }

    // === 📋 缘主须知 ===
    html += '<div style="margin:12px 0;padding:14px 16px;background:linear-gradient(135deg,rgba(138,92,246,0.06),rgba(138,92,246,0.01));border:1px solid rgba(138,92,246,0.15);border-radius:12px">';
    html += '<div style="font-size:14px;font-weight:700;color:var(--violet2);margin-bottom:8px;letter-spacing:2px">📋 缘主须知</div>';
    html += '<div style="font-size:12px;line-height:2;opacity:.9">';
    html += '<div>1. 本宅为<b>' + res.zhaiMing + '</b>（' + res.direction + '向），' + (res.matching ? '宅命相配，家宅安宁' : '宅命不配，需布局化解') + '。</div>';
    html += '<div>2. 当前为<b>' + res.period + '运</b>，' + (res.wangShan ? '当运旺山旺向，财运亨通' : '非当运，需通过布局催旺') + '。</div>';
    html += '<div>3. 吉方宜多停留，凶方宜以厨房/卫生间压之。大门、主卧、灶位为阳宅三要，务必在吉方。</div>';
    html += '<div>4. 九宫飞星每年飞临方位不同，建议每年年底查看流年飞星布局。</div>';
    html += '<div>5. 风水布局为辅助，人心向善才是根本。家和万事兴，和气自生财。</div>';
    html += '</div></div>';

    // === 🧭 八宅方位圆图 ===
    try {
      let _bazhaiDirMap = {'东南':'东南','南':'南','西南':'西南','东':'东','中宫':'中宫','西':'西','东北':'东北','北':'北','西北':'西北'};
      let _gridOrder = ['东南','南','西南','东','中宫','西','东北','北','西北'];
      let _jixiongMap2 = {'生气':'大吉','天医':'中吉','延年':'上吉','伏位':'小吉','绝命':'大凶','五鬼':'大凶','六煞':'中凶','祸害':'小凶'};
      let _bazhaiUse = {
        '生气':'宜主卧、大门、财位，生机最旺','天医':'宜卧室、书房，利健康贵人','延年':'宜卧室、客厅，利人缘和谐','伏位':'宜安床、静修，平稳守成',
        '绝命':'宜厨房/卫生间压之，忌居住','五鬼':'宜厨房/卫生间压之，防官非','六煞':'宜卫生间压之，忌卧室','祸害':'宜储物/卫生间，忌长期停留'
      };
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">🧭 八宅方位圆图</div>';
      html += '<div style="padding:16px;display:flex;justify-content:center">';
      html += '<div style="display:grid;grid-template-columns:repeat(3,110px);grid-template-rows:repeat(3,110px);gap:3px;background:var(--border);padding:3px;border-radius:12px">';
      for (let _gi = 0; _gi < 9; _gi++) {
        let _gDir = _gridOrder[_gi];
        let _gPos = _bazhai[_gDir];
        let _isCenter = (_gDir === '中宫');
        if (_isCenter) {
          html += '<div style="background:rgba(142,68,173,0.06);border:2px solid rgba(142,68,173,0.3);border-radius:8px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center">';
          html += '<div style="font-size:14px;font-weight:bold;color:var(--violet2)">中宫</div>';
          html += '<div style="font-size:10px;opacity:.5;margin-top:4px">' + res.zhaiMing + '</div>';
          html += '<div style="font-size:9px;opacity:.4;margin-top:2px">太极点</div>';
          html += '</div>';
        } else {
          let _gLuck = _jixiongMap2[_gPos] || '—';
          let _gIsJi = _gLuck.includes('吉');
          let _gIsXiong = _gLuck.includes('凶');
          let _gBorderColor = _gIsJi ? 'var(--jade)' : (_gIsXiong ? 'var(--cinn2)' : 'rgba(201,168,76,0.2)');
          let _gLuckColor = _gIsJi ? 'var(--jade)' : (_gIsXiong ? 'var(--cinn2)' : 'var(--text-light)');
          let _gUse = _bazhaiUse[_gPos] || '';
          html += '<div style="background:' + (_gIsJi ? 'rgba(39,174,96,0.04)' : _gIsXiong ? 'rgba(231,76,60,0.04)' : 'rgba(201,168,76,0.03)') + ';border:2px solid ' + _gBorderColor + ';border-radius:8px;padding:6px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">';
          html += '<div style="font-size:13px;font-weight:bold;color:var(--gold)">' + _gDir + '</div>';
          html += '<div style="font-size:12px;font-weight:600;color:' + _gLuckColor + ';margin-top:2px">' + (_gPos || '—') + '</div>';
          html += '<div style="font-size:9px;color:' + _gLuckColor + ';opacity:.7">' + _gLuck + '</div>';
          html += '<div style="font-size:8px;opacity:.5;margin-top:3px;line-height:1.2">' + _gUse + '</div>';
          html += '</div>';
        }
      }
      html += '</div></div>';
      html += '<div style="padding:4px 16px 12px;font-size:11px;opacity:.5;text-align:center">绿色边框=吉方（宜卧室/客厅/大门） · 红色边框=凶方（宜厨房/卫生间压之） · 中宫为宅卦太极点</div>';
      html += '</div>';
    } catch(_bzErr) { console.warn('八宅方位圆图渲染错误:', _bzErr); }
    // === 📝 术语注释 ===
    try {
      html += '<div style="margin:16px 0;border:1px solid var(--border);border-radius:12px;overflow:hidden">';
      html += '<div style="background:var(--title);color:var(--paper);padding:10px 16px;font-weight:600">📝 术语注释</div>';
      html += '<div style="padding:12px 16px;font-size:11px;line-height:2;opacity:.85">';
      html += '<div><b style="color:var(--gold2)">九宫飞星：</b>以当运之星入中宫顺飞九宫，得一至九星分布八方。一白水、二黑土、三碧木、四绿木、五黄土、六白金、七赤金、八白土、九紫火。当旺之星所在方位为吉。</div>';
      html += '<div><b style="color:var(--gold2)">八宅：</b>以宅卦为起点，按大游年歌诀推算八方吉凶。生气（大吉）、天医（中吉）、延年（上吉）、伏位（小吉）为四吉方；绝命、五鬼、六煞、祸害为四凶方。</div>';
      html += '<div><b style="color:var(--gold2)">宅命：</b>宅卦分东四宅（坎离震巽）与西四宅（乾坤艮兑）。命卦亦分东四命与西四命。宅命相配则吉，不配则需布局化解。</div>';
      html += '<div><b style="color:var(--gold2)">元运：</b>三元九运，每20年一运，共180年。2024-2043年为九紫离运。当运之星入中宫，其方位为旺方。</div>';
      html += '<div><b style="color:var(--gold2)">二十四山：</b>罗盘360°分为二十四山，每卦管三山。如坎宫管壬子癸，离宫管丙午丁。用于精确方位定位。</div>';
      html += '<div><b style="color:var(--gold2)">山向：</b>坐山为房屋背靠方位，朝向为房屋正面朝向。如坐北朝南即子山午向。山管人丁水管财。</div>';
      html += '</div></div>';
    } catch(_fste) { console.warn('风水术语注释渲染错误:', _fste); }

    // === R3.4: 风水·城门诀 ===
    try {
      if (typeof computeChengmenJue === 'function' && res) {
        let _cmHtml = computeChengmenJue(res.xuankongData || res, res.chaoxiang || res.direction);
        if (_cmHtml && _cmHtml.trim()) {
          html += '<div class="bazi-new-module">';
          html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🚪 城门诀分析 <span class="toggle-icon">▼</span></div>';
          html += '<div class="bazi-module-body collapsed">' + _cmHtml + '</div>';
          html += '</div>';
        }
      }
    } catch(_cme) { console.warn('城门诀渲染错误:', _cme); }

    // === R3.5: 风水·飞星组合深化 ===
    try {
      if (typeof computeFeixingCombos === 'function' && res) {
        let _fxHtml = computeFeixingCombos(res.xuankongData || res, res.chaoxiang || res.direction);
        if (_fxHtml && _fxHtml.trim()) {
          html += '<div class="bazi-new-module">';
          html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🌟 飞星组合详析 <span class="toggle-icon">▼</span></div>';
          html += '<div class="bazi-module-body collapsed">' + _fxHtml + '</div>';
          html += '</div>';
        }
      }
    } catch(_fxe) { console.warn('飞星组合渲染错误:', _fxe); }

    // === 化解方案与开运建议 ===
    try {
      let _cureHtml = getFengshuiResolution(res);
      if (_cureHtml && _cureHtml.trim()) {
        html += '<div class="bazi-new-module">';
        html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)">🔮 化解方案与开运建议 <span class="toggle-icon">▼</span></div>';
        html += '<div class="bazi-module-body collapsed"><div id="fengshui-cure-result">' + _cureHtml + '</div></div>';
        html += '</div>';
      }
    } catch(_ce) { console.warn('风水化解引擎错误:', _ce); }
    _showEngineResult('fsEngineResult', html);
  } catch(e) { showToast('风水引擎错误：'+e.message); }
}

function runZeriEngine() {
  // 优先调用精准择日引擎（支持八字+多人择日）
  if (typeof runPrecisionZeRi === 'function') {
    runPrecisionZeRi();
    return;
  }
  // 降级：简易择日引擎
  try {
    const lm = parseInt(document.getElementById('zeriMonth')?.value || 1);
    const ld = parseInt(document.getElementById('zeriDay')?.value || 1);
    const evt = document.getElementById('zeriEvent')?.value || '';
    const res = zeriCalcFull(lm, ld, null, evt);
    let html = '<h4 style="color:var(--gold)">📅 择日引擎演算结果</h4>';
    html += '<p><b>日期：</b>' + res.date + '</p>';
    html += '<p><b>干支：</b>' + res.ganzhi + '</p>';
    html += '<p><b>建除：</b>' + res.jianchu + '日</p>';
    html += '<p><b>值神：</b>' + res.huanghei + '</p>';
    html += '<p><b>星宿：</b>' + res.xingxiu + '</p>';
    html += '<p><b>冲煞：</b>' + res.chongsha + '</p>';
    html += '<p><b>胎神占方：</b>' + res.taishen + '</p>';
    html += '<p><b>彭祖百忌：</b>' + res.pengzu + '</p>';
    html += '<p><b>吉神宜趋：</b>' + (Array.isArray(res.jishen) ? res.jishen.join('、') : res.jishen) + '</p>';
    html += '<p><b>凶神宜忌：</b>' + (Array.isArray(res.xiongshen) ? res.xiongshen.join('、') : res.xiongshen) + '</p>';
    html += '<p><b>宜：</b>' + (Array.isArray(res.yi) ? res.yi.join('、') : res.yi) + '</p>';
    html += '<p><b>忌：</b>' + (Array.isArray(res.ji) ? res.ji.join('、') : res.ji) + '</p>';
    html += '<p><b>空亡：</b>' + res.kongwang + '</p>';
    html += '<p><b>评分：</b>' + res.score + '/100</p>';
    html += '<p style="opacity:0.8">' + res.analysis + '</p>';
    html += '<p style="color:var(--gold)"><b>建议：</b>' + res.suggestion + '</p>';
    html += '<p style="color:var(--cinn2)"><b>避免：</b>' + res.avoid + '</p>';
    _showEngineResult('zrEngineResult', html);
  } catch(e) { showToast('择日引擎错误：'+e.message); }
}

// 全局注册绑定函数
if (typeof window !== 'undefined') {
  window.runLiuyaoEngine = runLiuyaoEngine;
  window.runMeihuaEngine = runMeihuaEngine;
  window.runQimenEngine = runQimenEngine;
  window.runLiurenEngine = runLiurenEngine;
  window.runZiweiEngine = runZiweiEngine;
  window.runXingmingEngine = runXingmingEngine;
  window.runFengshuiEngine = runFengshuiEngine;
  window.runZeriEngine = runZeriEngine;

  // ===== 独立区域调用函数 =====
  function runQimen() {
    const year = parseInt(document.getElementById('qimen-year')?.value || new Date().getFullYear());
    const month = parseInt(document.getElementById('qimen-month')?.value || new Date().getMonth()+1);
    const day = parseInt(document.getElementById('qimen-day')?.value || new Date().getDate());
    const hour = parseInt(document.getElementById('qimen-hour')?.value || 5);
    const ju = document.getElementById('qimen-ju')?.value || 'auto';
    try {
      const pan = qimenPaiPan(year, month, day, hour, ju);
      const analyze = qimenAnalyze(pan, '事业');
      let html = '<h4 style="color:var(--violet2)">☰ 奇门遁甲排盘</h4>';
      html += '<p><b>时间：</b>' + year + '年' + month + '月' + day + '日 ' + ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][hour] + '时</p>';
      html += '<p><b>遁局：</b>' + (pan.dun==='yang'?'阳':'阴') + '遁' + pan.ju + '局</p>';
      html += '<p><b>用神：</b>' + analyze.yongShen + ' · 落' + analyze.palace + '宫</p>';
      html += '<p><b>天盘：</b>' + analyze.qi + ' · 门：' + analyze.men + ' · 星：' + analyze.star + '</p>';
      html += '<p><b>吉凶：</b>' + analyze.luck + '</p>';
      html += '<p><b>策略：</b>' + analyze.strategy + '</p>';
      const el = document.getElementById('qimenResult');
      if (el) { el.innerHTML = html; el.style.display = 'block'; }
    } catch(e) { showToast('奇门引擎错误：'+e.message); }
  }
  window.runQimen = runQimen;

  function runZiwei() {
    const year = parseInt(document.getElementById('ziwei-year')?.value || 1990);
    const month = parseInt(document.getElementById('ziwei-month')?.value || 1);
    const day = parseInt(document.getElementById('ziwei-day')?.value || 1);
    const hour = parseInt(document.getElementById('ziwei-hour')?.value || 0);
    const sex = document.getElementById('ziwei-sex')?.value || 'male';
    try {
      const pan = ziweiPaiPan(year, month, day, hour, sex);
      const analyze = ziweiAnalysis(pan);
      let html = '<h4 style="color:var(--fire)">🌌 紫微斗数排盘</h4>';
      html += '<p><b>生辰：</b>' + year + '年' + month + '月' + day + '日 ' + ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][hour] + '时</p>';
      html += '<p><b>命宫：</b>' + pan.mingZhi + ' · 身宫：' + pan.shenZhi + '</p>';
      html += '<p><b>五行局：</b>' + pan.ju + '</p>';
      html += '<p><b>格局：</b>' + analyze.geju + '</p>';
      html += '<p><b>四化：</b>' + analyze.sihuaText + '</p>';
      html += '<p><b>概述：</b>' + analyze.overview + '</p>';
      const el = document.getElementById('ziweiResult');
      if (el) { el.innerHTML = html; el.style.display = 'block'; }
    } catch(e) { showToast('紫微引擎错误：'+e.message); }
  }
  window.runZiwei = runZiwei;

  function runMeihua() {
    const method = document.getElementById('meihua-method')?.value || 'number';
    const upper = parseInt(document.getElementById('meihua-upper')?.value || 3);
    const lower = parseInt(document.getElementById('meihua-lower')?.value || 6);
    const dong = parseInt(document.getElementById('meihua-dong')?.value || 1);
    try {
      const pan = meihuaQiGua(method, { upper, lower, dong });
      const analyze = meihuaAnalyze(pan);
      let html = '<h4 style="color:var(--jade)">🌸 梅花易数起卦</h4>';
      html += '<p><b>起卦方式：</b>' + (method==='time'?'时间起卦':method==='number'?'数字起卦':'心动起卦') + '</p>';
      html += '<p><b>本卦：</b>' + pan.benGua + ' · 变卦：' + pan.bianGua + '</p>';
      html += '<p><b>体用：</b>体为' + pan.tiGua + ' · 用为' + pan.yongGua + '</p>';
      html += '<p><b>动爻：</b>第' + dong + '爻动</p>';
      html += '<p><b>五行：</b>体' + analyze.tiWuxing + ' · 用' + analyze.yongWuxing + '</p>';
      html += '<p><b>生克：</b>' + analyze.relation + '</p>';
      html += '<p><b>吉凶：</b>' + analyze.luck + '</p>';
      html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
      const el = document.getElementById('meihuaResult');
      if (el) { el.innerHTML = html; el.style.display = 'block'; }
    } catch(e) { showToast('梅花引擎错误：'+e.message); }
  }
  window.runMeihua = runMeihua;

  function runLiuren() {
    const year = parseInt(document.getElementById('liuren-year')?.value || new Date().getFullYear());
    const month = parseInt(document.getElementById('liuren-month')?.value || new Date().getMonth()+1);
    const day = parseInt(document.getElementById('liuren-day')?.value || new Date().getDate());
    const hour = parseInt(document.getElementById('liuren-hour')?.value || 5);
    try {
      const pan = liurenPaiPan(year, month, day, hour, 0);
      const analyze = liurenAnalyze(pan, '所问之事');
      let html = '<h4 style="color:var(--orange)">⬡ 大六壬排盘</h4>';
      html += '<p><b>时间：</b>' + year + '年' + month + '月' + day + '日 ' + ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'][hour] + '时</p>';
      html += '<p><b>日干支：</b>' + pan.dayGan + pan.dayZhi + '</p>';
      html += '<p><b>月将：</b>' + pan.yueJiang + '</p>';
      html += '<p><b>三传：</b>' + (pan.sanChuan.chu||'') + ' → ' + (pan.sanChuan.zhong||'') + ' → ' + (pan.sanChuan.mo||'') + '</p>';
      html += '<p><b>三传神将：</b>' + (Array.isArray(analyze.chuanShen) ? analyze.chuanShen.join(' → ') : (analyze.chuanShen||'')) + '</p>';
      html += '<p><b>吉凶：</b>' + analyze.luck + '</p>';
      html += '<p style="opacity:0.8">' + analyze.advice + '</p>';
      const el = document.getElementById('liurenResult');
      if (el) { el.innerHTML = html; el.style.display = 'block'; }
    } catch(e) { showToast('六壬引擎错误：'+e.message); }
  }
  window.runLiuren = runLiuren;
}

// ================================================================
// 名师解惑板块 JavaScript
// ================================================================

// 名师子导航切换
function showMastersTab(tab, btn) {
  document.querySelectorAll('.masters-tab').forEach(function(t) { t.classList.remove('active'); });
  if (btn) btn.classList.add('active');
  document.querySelectorAll('.masters-panel').forEach(function(p) { p.classList.remove('active'); });
  let panel = document.getElementById('mastersPanel-' + tab);
  if (panel) panel.classList.add('active');
}

// 大师卡片展开/收起
function toggleMasterCard(card) {
  if (card.classList.contains('expanded')) {
    card.classList.remove('expanded');
  } else {
    card.classList.add('expanded');
  }
}

// 打开提问弹窗
function openAskModal() {
  let modal = document.getElementById('askModal');
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// 关闭提问弹窗
function closeAskModal() {
  let modal = document.getElementById('askModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    // 重置
    let result = document.getElementById('askResult');
    if (result) result.classList.remove('active');
    let input = document.getElementById('askInput');
    if (input) input.value = '';
  }
}

// 指定大师打开提问弹窗
function openAskModalWithMaster(masterName, tradition) {
  openAskModal();
  let select = document.getElementById('askMasterSelect');
  if (select) {
    for (let i = 0; i < select.options.length; i++) {
      let val = select.options[i].value;
      if (val.indexOf(masterName) >= 0) {
        select.selectedIndex = i;
        break;
      }
    }
  }
}

// 提交提问
function submitAsk() {
  let select = document.getElementById('askMasterSelect');
  let input = document.getElementById('askInput');
  let btn = document.getElementById('askBtn');
  let result = document.getElementById('askResult');
  let resultContent = document.getElementById('askResultContent');

  if (!select || !select.value) {
    showToast('请先选择一位大师');
    return;
  }
  if (!input || !input.value.trim()) {
    showToast('请输入您的问题');
    return;
  }

  let parts = select.value.split('|');
  let masterName = parts[0];
  let tradition = parts[1] || '道家';
  let question = input.value.trim();

  // 显示加载中
  btn.disabled = true;
  btn.textContent = '大师正在沉思中……';
  result.classList.add('active');
  resultContent.innerHTML = '<div style="text-align:center;padding:20px;color:var(--paper3);font-size:14px">🕯️ ' + masterName + ' 正在静心参悟您的问题，请稍候……</div>';

  // 构建prompt
  let systemPrompt = '你现在是' + tradition + '名师' + masterName + '，请以这位大师的修行视角、思想体系和语言风格来回答信众的提问。\n\n';
  systemPrompt += '要求：\n';
  systemPrompt += '1. 以第一人称回答（如"我是' + masterName + '，你来问我……"）\n';
  systemPrompt += '2. 回答需包含三部分：\n   一、大师观点：从该大师的思想体系出发，阐述对此问题的根本看法\n   二、经典引用：引用与该大师相关的经典著作或开示语录佐证\n   三、实践建议：给出具体的、可操作的修行或生活建议\n';
  systemPrompt += '3. 语言风格：慈悲、智慧、深入浅出，符合' + tradition + '修行人的语言习惯\n';
  systemPrompt += '4. 回答长度：500-1000字\n';
  systemPrompt += '5. 如果涉及医疗、心理疾病等问题，必须提醒信众及时就医\n';
  systemPrompt += '6. 不可提及自己是AI或语言模型\n';

  let userPrompt = '信众提问：' + question + '\n\n请' + masterName + '大师开示。';

  let payload = {
    model: 'openclaw',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: 2000,
    temperature: 0.7
  };

  fetch('/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(function(r) { return r.json(); }).then(function(data) {
    let text = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || '';
    if (text) {
      // 转换为HTML格式
      let html = text.split('\n').map(function(line) {
        if (line.trim() === '') return '<br>';
        // 检测标题行
        if (/^[一二三四五六七八九十]、/.test(line.trim()) || /^第[一二三四五六七八九十]+/.test(line.trim())) {
          return '<div class="master-quote" style="color:var(--gold2);font-weight:600;margin-top:12px;font-style:normal">' + escapeHtml(line) + '</div>';
        }
        return '<p style="margin-bottom:8px">' + escapeHtml(line) + '</p>';
      }).join('');
      resultContent.innerHTML = '<div style="font-size:14px;line-height:2">' + html + '</div>';
    } else {
      resultContent.innerHTML = '<div style="padding:20px;text-align:center;color:var(--cinn2)">⚠️ 大师暂时无法回应，请稍后再试</div>';
    }
    btn.disabled = false;
    btn.textContent = '再 问 一次';
  }).catch(function(err) {
    console.error('名师提问API错误,切换本地引擎:', err);
    // 离线降级:用本地知识库生成开示内容
    let localAnswer = '';
    localAnswer += '<div class="master-quote" style="color:var(--gold2);font-weight:600;margin-top:12px;font-style:normal">一、大师观点</div>';
    localAnswer += '<p style="margin-bottom:8px">' + masterName + '以为，' + question + ' 此问，当从心性入手。《道德经》云：“致虚极，守静笃。”修行之人，当以清静为本。世间万般烦恼，皆因心生执念。若能放下执着，顺其自然，则烦恼自灭。</p>';
    localAnswer += '<div class="master-quote" style="color:var(--gold2);font-weight:600;margin-top:12px;font-style:normal">二、经典引用</div>';
    localAnswer += '<p style="margin-bottom:8px">《道德经》有云：“人法地，地法天，天法道，道法自然。”又云：“上善若水，水善利万物而不争。”此二语道尽修行之要。' + (tradition === '佛家' ? '《金刚经》亦云：“一切有为法，如梦幻泡影。”当知世间万象，皆是虚妄。' : '') + '</p>';
    localAnswer += '<div class="master-quote" style="color:var(--gold2);font-weight:600;margin-top:12px;font-style:normal">三、实践建议</div>';
    localAnswer += '<p style="margin-bottom:8px">一者，每日静坐15分钟，观呼吸进出，不思善不思恶。二者，常怀感恩之心，凡事多思他人之好。三者，' + (question.indexOf('病') >= 0 || question.indexOf('痛') >= 0 ? '身体不适之时，当及时就医，不可专恃修行而废医药。' : '遇事不决时，不妨暂且放下，待心静之后自然明朗。') + '四者，行住坐卧，皆可观照当下，此即修行。</p>';
    localAnswer += '<div style="margin-top:16px;padding:10px;background:rgba(201,168,76,0.04);border-radius:8px;font-size:12px;color:var(--paper2);text-align:center">—— ' + masterName + ' （本地知识引擎生成）</div>';
    resultContent.innerHTML = '<div style="font-size:14px;line-height:2">' + localAnswer + '</div>';
    btn.disabled = false;
    btn.textContent = '再 问 一次';
  }).catch(function(err){ showToast('AI服务暂不可用，请稍后重试'); });
}

// ===== 知识库检索功能 =====
let _kbSearchTimer = null;
let _kbCurrentCategory = 'all';
let _kbAllEntries = null;

// 快捷搜索
function quickSearchKb(term) {
  let input = document.getElementById('kbSearchInput');
  if (input) { input.value = term; }
  searchKbEntries(term);
}

// 简易拼音映射（常用字）
let _kbPinyinMap = {
  '八字':'bazi','四柱':'sizhu','日主':'rizhu','十神':'shishen','格局':'geju','用神':'yongshen',
  '大运':'dayun','流年':'liunian','神煞':'shensha','天干':'tiangan','地支':'dizhi',
  '六爻':'liuyao','纳甲':'najia','六亲':'liuqin','世应':'shiying',
  '风水':'fengshui','玄空':'xuankong','飞星':'feixing','八宅':'bazhai','罗盘':'luopan',
  '紫微':'ziwei','主星':'zhuxing','宫位':'gongwei','四化':'sihua',
  '奇门':'qimen','八门':'bamen','九星':'jiuxing','三奇':'sanqi','六仪':'liuyi',
  '梅花':'meihua','体用':'tiyong','互卦':'hugua','变卦':'biangua',
  '六壬':'liuren','四课':'sike','三传':'sanchuan','天将':'tianjiang',
  '姓名':'xingming','五格':'wuge','三才':'sancai','纳音':'nayin',
  '五行':'wuxing','八卦':'bagua','周易':'zhouyi','易经':'yijing',
  '合冲':'hechong','刑害':'xinghai','空亡':'kongwang','胎元':'taiyuan',
  '天乙贵人':'tianyiguiren','文昌星':'wenchangxing','桃花':'taohua',
  '驿马':'yima','华盖':'huagai','羊刃':'yangren','魁罡':'kuigang',
  '金匮':'jinkui','天德':'tiande','月德':'yuede','三合':'sanhe','六合':'liuhe',
  '口诀':'koujue','咒语':'zhouyu','经文':'jingwen','修心':'xiuxin'
};

function debounceKbSearch(val) {
  clearTimeout(_kbSearchTimer);
  _kbSearchTimer = setTimeout(function() { searchKbEntries(val); }, 300);
}

function filterKbByCategory(cat) {
  _kbCurrentCategory = cat;
  // 更新按钮样式
  document.querySelectorAll('.kb-cat-btn').forEach(function(btn) {
    btn.classList.remove('kb-cat-active');
    btn.style.background = 'transparent';
  });
  event.target.classList.add('kb-cat-active');
  event.target.style.background = 'var(--gold-dim)';
  // 重新搜索
  let input = document.getElementById('kbSearchInput');
  searchKbEntries(input ? input.value : '');
}

function _collectKbEntries() {
  if (_kbAllEntries) return _kbAllEntries;
  _kbAllEntries = [];
  // 从 AUTHORITATIVE_KNOWLEDGE 收集
  try {
    if (typeof AUTHORITATIVE_KNOWLEDGE !== 'undefined') {
      for (let k in AUTHORITATIVE_KNOWLEDGE) {
        let item = AUTHORITATIVE_KNOWLEDGE[k];
        if (typeof item === 'object') {
          _kbAllEntries.push({
            key: k,
            category: item.category || _guessCategory(k),
            title: item.title || item.name || k,
            intro: item.intro || item.desc || '',
            overview: item.overview || '',
            source: 'authoritative'
          });
          // 子条目
          if (item.sections) {
            for (let sk in item.sections) {
              _kbAllEntries.push({
                key: k + '.' + sk,
                category: item.category || _guessCategory(k),
                title: sk,
                intro: (item.sections[sk] || '').substring(0, 200),
                overview: item.sections[sk] || '',
                source: 'authoritative'
              });
            }
          }
        }
      }
    }
  } catch(e) {}
  // 从 KNOWLEDGE_DETAILS_EXTRA 收集
  try {
    if (typeof KNOWLEDGE_DETAILS_EXTRA !== 'undefined') {
      for (let k in KNOWLEDGE_DETAILS_EXTRA) {
        let item = KNOWLEDGE_DETAILS_EXTRA[k];
        _kbAllEntries.push({
          key: k,
          category: _guessCategory(k),
          title: item.title || k,
          intro: (item.content || item.html || '').substring(0, 200),
          overview: item.content || item.html || '',
          source: 'extra'
        });
      }
    }
  } catch(e) {}
  // 从 KOUJUE_DATABASE 收集
  try {
    if (typeof KOUJUE_DATABASE !== 'undefined') {
      for (let cat in KOUJUE_DATABASE) {
        let items = KOUJUE_DATABASE[cat];
        if (Array.isArray(items)) {
          items.forEach(function(item, idx) {
            _kbAllEntries.push({
              key: 'koujue.' + cat + '.' + idx,
              category: 'koujue',
              title: item.name || item.title || (cat + '-' + idx),
              intro: (item.content || item.text || '').substring(0, 200),
              overview: item.content || item.text || '',
              source: 'koujue'
            });
          });
        }
      }
    }
  } catch(e) {}
  // 从 KNOWLEDGE_DETAILS 收集
  try {
    if (typeof window.KNOWLEDGE_DETAILS !== 'undefined') {
      for (let k in window.KNOWLEDGE_DETAILS) {
        let html = window.KNOWLEDGE_DETAILS[k] || '';
        // 从HTML中提取纯文本前200字
        let text = html.replace(/<[^>]+>/g, '').substring(0, 200);
        _kbAllEntries.push({
          key: 'kd.' + k,
          category: _guessCategory(k),
          title: _kbTitleFromKey(k),
          intro: text,
          overview: html,
          source: 'details'
        });
      }
    }
  } catch(e) {}
  // 从 BAZI_KNOWLEDGE_BASE 收集
  try {
    if (typeof BAZI_KNOWLEDGE !== 'undefined') {
      for (let k in BAZI_KNOWLEDGE) {
        let item = BAZI_KNOWLEDGE[k];
        _kbAllEntries.push({
          key: 'bazi.' + k,
          category: 'bazi',
          title: item.title || k,
          intro: (item.content || item.desc || '').substring(0, 200),
          overview: item.content || item.desc || '',
          source: 'bazi-kb'
        });
      }
    }
  } catch(e) {}
  // 从 ZIWEI_KNOWLEDGE_BASE 收集
  try {
    if (typeof ZIWEI_KNOWLEDGE !== 'undefined') {
      for (let k in ZIWEI_KNOWLEDGE) {
        let item = ZIWEI_KNOWLEDGE[k];
        _kbAllEntries.push({
          key: 'ziwei.' + k,
          category: 'ziwei',
          title: item.title || item.name || k,
          intro: (item.content || item.desc || '').substring(0, 200),
          overview: item.content || item.desc || '',
          source: 'ziwei-kb'
        });
      }
    }
  } catch(e) {}
  // 从 QIMEN_KNOWLEDGE_BASE 收集
  try {
    if (typeof QIMEN_KNOWLEDGE !== 'undefined') {
      for (let k in QIMEN_KNOWLEDGE) {
        let item = QIMEN_KNOWLEDGE[k];
        _kbAllEntries.push({
          key: 'qimen.' + k,
          category: 'qimen',
          title: item.title || item.name || k,
          intro: (item.content || item.desc || '').substring(0, 200),
          overview: item.content || item.desc || '',
          source: 'qimen-kb'
        });
      }
    }
  } catch(e) {}
  // 从 FENGSHUI_KNOWLEDGE_BASE 收集
  try {
    if (typeof FENGSHUI_KNOWLEDGE !== 'undefined') {
      for (let k in FENGSHUI_KNOWLEDGE) {
        let item = FENGSHUI_KNOWLEDGE[k];
        _kbAllEntries.push({
          key: 'fengshui.' + k,
          category: 'fengshui',
          title: item.title || item.name || k,
          intro: (item.content || item.desc || '').substring(0, 200),
          overview: item.content || item.desc || '',
          source: 'fengshui-kb'
        });
      }
    }
  } catch(e) {}
  return _kbAllEntries;
}

function _kbTitleFromKey(key) {
  let names = {bagua:'易经八卦',liushisigua:'六十四卦',bazi:'八字四柱',qimen:'奇门遁甲',wuxing:'五行体系',fengshui:'风水堪舆',shishen:'十神详解',nayin:'纳音五行',shensha:'神煞体系',hechong:'合冲刑害',liuyao:'六爻基础',xingming:'姓名学基础',shengxiao:'十二生肖',constellation:'西方星座',ziwei:'紫微斗数',meihua:'梅花易数',liuren:'大六壬',tizhi:'中医体质',rujia:'儒家',daojia:'道家',fojia:'佛家',zeji:'择吉',huxing:'好户型',cezi:'测字',jingdian:'经典朗读',fanyin:'梵音音乐',meirikoujue:'每日口诀',gongde:'功德',zhishitupu:'知识图谱',yangsheng:'养生调理',daochang:'道场导航',jiazinayin:'甲子纳音',jieqi:'节气',zhouyi:'周易',yanzhi:'言值'};
  return names[key] || key;
}

function _guessCategory(key) {
  let k = key.toLowerCase();
  let map = {
    bazi: ['bazi','八字','日主','十神','格局','用神','大运','流年','神煞','天干','地支'],
    liuyao: ['liuyao','六爻','纳甲','六亲','用神'],
    fengshui: ['fengshui','风水','玄空','飞星','八宅','罗盘'],
    ziwei: ['ziwei','紫微','主星','宫位'],
    qimen: ['qimen','奇门','八门','九星','三奇','六仪'],
    meihua: ['meihua','梅花','体用'],
    liuren: ['liuren','六壬','四课','三传','天将'],
    xingming: ['xingming','姓名','五格','三才'],
    tizhi: ['tizhi','体质'],
    zhouyi: ['zhouyi','周易','易经'],
    bagua: ['bagua','八卦'],
    wuxing: ['wuxing','五行'],
    shishen: ['shishen','十神'],
    nayin: ['nayin','纳音'],
    shensha: ['shensha','神煞'],
    hechong: ['hechong','合冲','刑害'],
    koujue: ['koujue','口诀','咒语']
  };
  for (let cat in map) {
    for (let i = 0; i < map[cat].length; i++) {
      if (k.indexOf(map[cat][i].toLowerCase()) >= 0) return cat;
    }
  }
  return 'other';
}

function searchKbEntries(query) {
  let entries = _collectKbEntries();
  let results = [];
  query = (query || '').trim().toLowerCase();
  
  for (let i = 0; i < entries.length; i++) {
    let e = entries[i];
    // 分类过滤
    if (_kbCurrentCategory !== 'all' && e.category !== _kbCurrentCategory) continue;
    // 关键词过滤
    if (query) {
      let title = (e.title || '').toLowerCase();
      let intro = (e.intro || '').toLowerCase();
      let key = (e.key || '').toLowerCase();
      // 拼音搜索：检查拼音映射
      let pinyinMatch = false;
      for (let py in _kbPinyinMap) {
        if (_kbPinyinMap[py].indexOf(query) >= 0 && title.indexOf(py) >= 0) {
          pinyinMatch = true; break;
        }
      }
      if (title.indexOf(query) < 0 && intro.indexOf(query) < 0 && key.indexOf(query) < 0 && !pinyinMatch) continue;
    }
    results.push(e);
  }
  
  // 排序
  let sortVal = document.getElementById('kbSortSelect') ? document.getElementById('kbSortSelect').value : 'relevance';
  if (sortVal === 'category') {
    results.sort(function(a, b) { return a.category.localeCompare(b.category); });
  } else if (sortVal === 'alpha') {
    results.sort(function(a, b) { return a.title.localeCompare(b.title); });
  }
  
  renderKbResults(results, entries.length);
}

function renderKbResults(results, total) {
  let container = document.getElementById('kbResults');
  let stats = document.getElementById('kbStats');
  if (stats) {
    stats.textContent = '共 ' + total + ' 条知识 · 匹配 ' + results.length + ' 条';
  }
  
  if (results.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-dim);">未找到匹配的知识，试试其他关键词</div>';
    return;
  }
  
  let html = '';
  let catColors = {
    bazi: 'var(--cinn)', liuyao: 'var(--cyan)', fengshui: 'var(--jade)', ziwei: 'var(--violet2)',
    qimen: 'var(--cinn2)', meihua: 'var(--emerald)', liuren: 'var(--ink3)', xingming: 'var(--orange)',
    tizhi: 'var(--cinn2)', zhouyi: 'var(--ink3)', bagua: 'var(--steel)', wuxing: 'var(--warn)',
    shishen: 'var(--emerald)', nayin: 'var(--violet)', shensha: 'var(--cinn)', hechong: 'var(--cyan2)',
    koujue: 'var(--cinn2)', other: 'var(--metal)'
  };
  
  results.forEach(function(e) {
    let color = catColors[e.category] || 'var(--metal)';
    let catLabel = _kbCatLabel(e.category);
    let title = e.title || e.key;
    let intro = (e.intro || '').substring(0, 120);
    if (intro.length === 120) intro += '...';
    
    html += '<div class="kb-result-card" onclick="showKbDetail(\'' + e.key.replace(/'/g, '\\') + '\')" ' +
      'style="background:rgba(0,0,0,0.3);border:1px solid var(--gold-dim);border-radius:6px;padding:14px;cursor:pointer;transition:all 0.2s;" ' +
      'onmouseover="this.style.borderColor=\'' + color + '\';this.style.transform=\'translateY(-2px)\'" ' +
      'onmouseout="this.style.borderColor=\'var(--gold-dim)\';this.style.transform=\'none\'">' +
      '<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:6px;">' +
      '<span style="font-size:14px;color:var(--gold);font-weight:600;">' + title + '</span>' +
      '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:' + color + '33;color:' + color + ';">' + catLabel + '</span>' +
      '</div>' +
      '<div style="font-size:12px;color:var(--text-dim);line-height:1.5;">' + intro + '</div>' +
      '<div style="font-size:11px;color:var(--text-dim);margin-top:6px;">来源: ' + e.source + '</div>' +
      '</div>';
  });
  container.innerHTML = html;
}

function _kbCatLabel(cat) {
  let labels = {
    bazi: '八字', liuyao: '六爻', fengshui: '风水', ziwei: '紫微',
    qimen: '奇门', meihua: '梅花', liuren: '六壬', xingming: '姓名学',
    tizhi: '体质', zhouyi: '周易', bagua: '八卦', wuxing: '五行',
    shishen: '十神', nayin: '纳音', shensha: '神煞', hechong: '合冲刑害',
    koujue: '口诀', other: '其他'
  };
  return labels[cat] || cat;
}

function showKbDetail(key) {
  let entries = _collectKbEntries();
  let entry = null;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i].key === key) { entry = entries[i]; break; }
  }
  if (!entry) return;
  
  let modal = document.getElementById('kbDetailModal');
  let content = document.getElementById('kbDetailContent');
  let catLabel = _kbCatLabel(entry.category);
  
  content.innerHTML = 
    '<div style="margin-bottom:12px;">' +
    '<span style="font-size:11px;padding:2px 8px;border-radius:10px;background:rgba(201,152,38,0.2);color:var(--gold);">' + catLabel + '</span>' +
    '</div>' +
    '<h3 style="color:var(--gold);margin-bottom:12px;font-size:20px;">' + (entry.title || entry.key) + '</h3>' +
    '<div style="font-size:14px;color:var(--text-light);line-height:1.8;white-space:pre-wrap;">' + (entry.overview || entry.intro || '暂无详细内容') + '</div>' +
    '<div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--gold-dim);font-size:12px;color:var(--text-dim);">来源: ' + entry.source + ' · 索引: ' + entry.key + '</div>';
  
  modal.style.display = 'flex';
}

function closeKbDetail() {
  document.getElementById('kbDetailModal').style.display = 'none';
}

// 初始化知识库检索
function initKbSearch() {
  // 预加载所有条目
  _collectKbEntries();
  // 显示全部
  searchKbEntries('');
}

// 页面加载后初始化
if (document.readyState === 'complete') {
  setTimeout(initKbSearch, 500);
} else {
  window.addEventListener('load', function() { setTimeout(initKbSearch, 500); });
}

// ============================================================
// 🎵 养心净心音乐播放器
// ============================================================
let HM_CATEGORIES = [
  {key:'fo', name:'佛教梵呗', icon:'🪷', color:'var(--gold)'},
  {key:'dao', name:'道教音乐', icon:'☯️', color:'var(--jade)'},
  {key:'yangsheng', name:'养生音乐', icon:'🌿', color:'var(--emerald)'},
  {key:'jingxin', name:'净心音乐', icon:'💎', color:'var(--cyan)'}
];

let HM_TRACKS = [
  // 佛教梵呗
  {cat:'fo', title:'大悲咒', desc:'千手千眼观世音菩萨大悲心陀罗尼', url:'', gen:'bell', merit:true},
  {cat:'fo', title:'心经', desc:'般若波罗蜜多心经', url:'', gen:'bell', merit:true},
  {cat:'fo', title:'六字大明咒', desc:'嗡嘛呢叭咪吽', url:'', gen:'bell', merit:true},
  {cat:'fo', title:'药师咒', desc:'药师琉璃光如来灌顶咒', url:'', gen:'muyu', merit:true},
  {cat:'fo', title:'阿弥陀佛圣号', desc:'南无阿弥陀佛六字洪名', url:'', gen:'bell', merit:true},
  // 道教音乐
  {cat:'dao', title:'太上老君说常清静经', desc:'大道无形，生育天地', url:'', gen:'chime', merit:true},
  {cat:'dao', title:'太乙金光神咒', desc:'金光烁烁，覆映吾身', url:'', gen:'chime', merit:true},
  {cat:'dao', title:'道教早晚功课', desc:'清静经 + 心印妙经', url:'', gen:'chime', merit:true},
  {cat:'dao', title:'太上感应篇', desc:'祸福无门，惟人自召', url:'', gen:'muyu', merit:true},
  {cat:'dao', title:'三官经', desc:'天官地官水官赐福', url:'', gen:'chime', merit:true},
  // 道家旺运养生
  {cat:'dao', title:'紫微星降·旺运罄', desc:'紫微帝星加持，提升官禄事业运', url:'', gen:'dao_wealth', merit:true},
  {cat:'dao', title:'财神咒·聚气鼓', desc:'赵公明元帅财神咒，聚财纳福', url:'', gen:'dao_drum', merit:true},
  {cat:'dao', title:'文昌帝君启智咒', desc:'文昌帝君加持，启智慧旺学业', url:'', gen:'dao_wenchang', merit:true},
  {cat:'dao', title:'太岁星君镇宅音', desc:'太岁星君护佑，化煞镇宅保平安', url:'', gen:'dao_taishui', merit:true},
  {cat:'dao', title:'药王孙思邈养生诀', desc:'药王真人传方，祛病延年', url:'', gen:'dao_yaowang', merit:true},
  {cat:'dao', title:'八仙过海·逍遥游', desc:'八仙自在心法，疏肝解郁畅情志', url:'', gen:'dao_baxian', merit:true},
  {cat:'dao', title:'黄庭经·内观养神', desc:'黄庭内外景经，内观存神养气', url:'', gen:'dao_huangting', merit:true},
  // 养生音乐
  {cat:'yangsheng', title:'角音·木·肝', desc:'角调养肝，生机勃发', url:'', gen:'tone_wood', merit:false},
  {cat:'yangsheng', title:'徵音·火·心', desc:'徵调养心，温阳活血', url:'', gen:'tone_fire', merit:false},
  {cat:'yangsheng', title:'宫音·土·脾', desc:'宫调养脾，健运中焦', url:'', gen:'tone_earth', merit:false},
  {cat:'yangsheng', title:'商音·金·肺', desc:'商调养肺，清肃降气', url:'', gen:'tone_metal', merit:false},
  {cat:'yangsheng', title:'羽音·水·肾', desc:'羽调养肾，藏精固本', url:'', gen:'tone_water', merit:false},
  {cat:'yangsheng', title:'禅修冥想', desc:'静坐冥想，观照呼吸', url:'', gen:'meditation', merit:false},
  {cat:'yangsheng', title:'古琴养生', desc:'太古遗音，调心养性', url:'', gen:'guqin', merit:false},
  // 净心音乐
  {cat:'jingxin', title:'水晶钵', desc:'纯净共振，净化磁场', url:'', gen:'crystal_bowl', merit:false},
  {cat:'jingxin', title:'颂钵', desc:'泛音疗愈，深层放松', url:'', gen:'singing_bowl', merit:false},
  {cat:'jingxin', title:'雨声白噪音', desc:'天降甘霖，洗心涤虑', url:'', gen:'rain', merit:false},
  {cat:'jingxin', title:'溪流水声', desc:'山间清泉，潺潺流淌', url:'', gen:'stream', merit:false},
  {cat:'jingxin', title:'鸟鸣晨曦', desc:'林间鸟语，生机盎然', url:'', gen:'birds', merit:false}
];

let hmAudioCtx = null;
let hmCurrentTrack = null;
let hmCurrentIdx = -1;
let hmIsPlaying = false;
let hmIsLoop = false;
let hmVolume = 0.6;
let hmActiveCategory = 'fo';
let hmPlayStartTime = 0;
let hmTrackDuration = 180; // 3 minutes default
let hmAnimId = null;
let hmActiveNodes = [];
let hmActiveSources = [];

function hmInit() {
  hmRenderCategoryTabs();
  hmRenderPlaylist();
}

function hmRenderCategoryTabs() {
  let container = document.getElementById('hmCategoryTabs');
  if (!container) return;
  let html = '';
  HM_CATEGORIES.forEach(function(cat) {
    let isActive = (cat.key === hmActiveCategory);
    html += '<button onclick="hmSelectCategory(\''+cat.key+'\')" style="padding:8px 16px;border:1px solid '+(isActive?'var(--gold)':'var(--border)')+';border-radius:20px;background:'+(isActive?'rgba(201,168,76,0.12)':'transparent')+';color:'+(isActive?'var(--gold)':'var(--paper3)')+';cursor:pointer;font-family:inherit;font-size:13px;transition:all .25s">'+cat.icon+' '+cat.name+'</button>';
  });
  container.innerHTML = html;
}

function hmSelectCategory(key) {
  hmActiveCategory = key;
  hmRenderCategoryTabs();
  hmRenderPlaylist();
}

function hmRenderPlaylist() {
  let container = document.getElementById('hmPlaylist');
  if (!container) return;
  let tracks = HM_TRACKS.filter(function(t){ return t.cat === hmActiveCategory; });
  let cat = HM_CATEGORIES.find(function(c){ return c.key === hmActiveCategory; });
  let html = '<div style="font-size:13px;color:var(--gold);margin-bottom:12px;font-weight:600">'+(cat?cat.icon:'')+' '+(cat?cat.name:'')+' · 共'+tracks.length+'首</div>';
  tracks.forEach(function(track, idx) {
    let realIdx = HM_TRACKS.indexOf(track);
    let isCurrent = (realIdx === hmCurrentIdx);
    html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:6px;border-radius:8px;background:'+(isCurrent?"rgba(201,168,76,0.08)":"rgba(255,255,255,0.02)")+';border:1px solid '+(isCurrent?"var(--border)":"transparent")+';transition:all .25s;cursor:pointer">';
    html += '<div onclick="hmPlayTrack('+realIdx+')" style="flex:1;min-width:0">';
    html += '<div style="font-size:13px;color:'+(isCurrent?'var(--gold)':'var(--paper2)')+';font-weight:'+(isCurrent?'600':'400')+';white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+(isCurrent&&hmIsPlaying?'🔊 ':'')+track.title+'</div>';
    html += '<div style="font-size:11px;color:var(--paper3);opacity:.6;margin-top:2px">'+track.desc+'</div>';
    html += '</div>';
    if (track.merit) {
      html += '<button onclick="event.stopPropagation();hmMerit('+realIdx+')" style="flex-shrink:0;padding:5px 10px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--gold);cursor:pointer;font-size:11px;font-family:inherit;transition:all .25s">🙏 闻乐功德</button>';
    }
    html += '</div>';
  });
  container.innerHTML = html;
}

function hmEnsureAudioCtx() {
  if (!hmAudioCtx) {
    try {
      hmAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch(e) {
      showToast('您的浏览器不支持 Web Audio API');
      return false;
    }
  }
  if (hmAudioCtx.state === 'suspended') {
    hmAudioCtx.resume();
  }
  return true;
}

function hmStopAllNodes() {
  hmActiveNodes.forEach(function(node) {
    try { if (node.stop) node.stop(); } catch(e) {}
    try { if (node.disconnect) node.disconnect(); } catch(e) {}
  });
  hmActiveSources.forEach(function(src) {
    try { src.stop(); } catch(e) {}
    try { src.disconnect(); } catch(e) {}
  });
  hmActiveNodes = [];
  hmActiveSources = [];
  if (hmAnimId) {
    cancelAnimationFrame(hmAnimId);
    hmAnimId = null;
  }
}

function hmPlayTrack(idx) {
  if (idx < 0 || idx >= HM_TRACKS.length) return;
  if (idx === hmCurrentIdx && hmIsPlaying) {
    hmPause();
    return;
  }
  if (idx === hmCurrentIdx && !hmIsPlaying) {
    hmResume();
    return;
  }
  hmStopAllNodes();
  hmCurrentIdx = idx;
  hmCurrentTrack = HM_TRACKS[idx];
  hmIsPlaying = true;
  hmPlayStartTime = 0;
  hmTrackDuration = 180;
  hmRenderPlaylist();
  hmUpdateNowPlaying();
  hmUpdatePlayBtn();
  if (!hmEnsureAudioCtx()) return;
  hmGenerateSound(hmCurrentTrack.gen);
  hmStartProgressAnimation();
}

function hmGenerateSound(genType) {
  if (!hmAudioCtx) return;
  let ctx = hmAudioCtx;
  let masterGain = ctx.createGain();
  masterGain.gain.value = hmVolume;
  masterGain.connect(ctx.destination);
  hmActiveNodes.push(masterGain);

  switch(genType) {
    case 'bell': hmGenBell(ctx, masterGain); break;
    case 'muyu': hmGenMuyu(ctx, masterGain); break;
    case 'chime': hmGenChime(ctx, masterGain); break;
    case 'tone_wood': hmGenTone(ctx, masterGain, 349.23, 'triangle'); break; // F4
    case 'tone_fire': hmGenTone(ctx, masterGain, 523.25, 'triangle'); break; // C5
    case 'tone_earth': hmGenTone(ctx, masterGain, 392.00, 'triangle'); break; // G4
    case 'tone_metal': hmGenTone(ctx, masterGain, 440.00, 'triangle'); break; // A4
    case 'tone_water': hmGenTone(ctx, masterGain, 293.66, 'triangle'); break; // D4
    case 'meditation': hmGenMeditation(ctx, masterGain); break;
    case 'guqin': hmGenGuqin(ctx, masterGain); break;
    case 'crystal_bowl': hmGenBowl(ctx, masterGain, 528); break;
    case 'singing_bowl': hmGenBowl(ctx, masterGain, 432); break;
    case 'rain': hmGenRain(ctx, masterGain); break;
    case 'stream': hmGenStream(ctx, masterGain); break;
    case 'birds': hmGenBirds(ctx, masterGain); break;
    case 'dao_wealth': hmGenDaoWealth(ctx, masterGain); break;
    case 'dao_drum': hmGenDaoDrum(ctx, masterGain); break;
    case 'dao_wenchang': hmGenDaoWenchang(ctx, masterGain); break;
    case 'dao_taishui': hmGenDaoTaishui(ctx, masterGain); break;
    case 'dao_yaowang': hmGenDaoYaowang(ctx, masterGain); break;
    case 'dao_baxian': hmGenDaoBaxian(ctx, masterGain); break;
    case 'dao_huangting': hmGenDaoHuangting(ctx, masterGain); break;
    default: hmGenBell(ctx, masterGain);
  }
}

// 钟磬音 - 悠远的寺院钟声
function hmGenBell(ctx, master) {
  let baseFreq = 220;
  let harmonics = [1, 2.76, 5.4, 8.93];
  let decay = [1.0, 0.4, 0.25, 0.15];
  let interval = 4000; // 4秒一次

  function strikeBell(time) {
    harmonics.forEach(function(h, i) {
      let osc = ctx.createOscillator();
      let gain = ctx.createGain();
      osc.frequency.value = baseFreq * h;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(decay[i] * 0.3, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 3.5);
      osc.connect(gain);
      gain.connect(master);
      osc.start(time);
      osc.stop(time + 4);
      hmActiveSources.push(osc);
    });
  }

  let startTime = ctx.currentTime;
  strikeBell(startTime);
  // 每4秒敲一次
  let bellInterval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(bellInterval); return; }
    strikeBell(ctx.currentTime);
  }, interval);
  hmActiveNodes.push({ stop: function() { clearInterval(bellInterval); }, disconnect: function(){} });
}

// 木鱼声 - 节奏均匀的木鱼
function hmGenMuyu(ctx, master) {
  let interval = 500; // 0.5秒一次

  function knockMuyu(time) {
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.setValueAtTime(180, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    osc.type = 'square';
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.25, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + 0.15);
    hmActiveSources.push(osc);
  }

  let startTime = ctx.currentTime;
  knockMuyu(startTime);
  let muyuInterval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(muyuInterval); return; }
    knockMuyu(ctx.currentTime);
  }, interval);
  hmActiveNodes.push({ stop: function() { clearInterval(muyuInterval); }, disconnect: function(){} });
}

// 编磬音 - 清脆悦耳
function hmGenChime(ctx, master) {
  let freqs = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00]; // C5 D5 E5 F5 G5 A5
  let interval = 800;
  let noteIdx = 0;

  function playChime(time) {
    let freq = freqs[noteIdx % freqs.length];
    noteIdx++;
    let harmonics = [1, 2, 3];
    let decay = [0.3, 0.15, 0.08];
    harmonics.forEach(function(h, i) {
      let osc = ctx.createOscillator();
      let gain = ctx.createGain();
      osc.frequency.value = freq * h;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(decay[i] * 0.25, time + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 2);
      osc.connect(gain);
      gain.connect(master);
      osc.start(time);
      osc.stop(time + 2.5);
      hmActiveSources.push(osc);
    });
  }

  playChime(ctx.currentTime);
  let chimeInterval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(chimeInterval); return; }
    playChime(ctx.currentTime);
  }, interval);
  hmActiveNodes.push({ stop: function() { clearInterval(chimeInterval); }, disconnect: function(){} });
}

// 五行音 - 持续低频音
function hmGenTone(ctx, master, freq, type) {
  let osc = ctx.createOscillator();
  let gain = ctx.createGain();
  let lfo = ctx.createOscillator();
  let lfoGain = ctx.createGain();
  osc.frequency.value = freq;
  osc.type = type || 'sine';
  lfo.frequency.value = 0.2; // 慢速振动
  lfoGain.gain.value = 0.05;
  lfo.connect(lfoGain);
  lfoGain.connect(gain.gain);
  gain.gain.value = 0.15;
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  lfo.start();
  hmActiveSources.push(osc, lfo);
}

// 禅修冥想 - 低频持续音+间歇钟声
function hmGenMeditation(ctx, master) {
  let osc1 = ctx.createOscillator();
  let osc2 = ctx.createOscillator();
  let gain1 = ctx.createGain();
  let gain2 = ctx.createGain();
  osc1.frequency.value = 136.1; // OM频率
  osc1.type = 'sine';
  osc2.frequency.value = 204.15; // 和谐音
  osc2.type = 'sine';
  gain1.gain.value = 0.12;
  gain2.gain.value = 0.06;
  osc1.connect(gain1);
  osc2.connect(gain2);
  gain1.connect(master);
  gain2.connect(master);
  osc1.start();
  osc2.start();
  hmActiveSources.push(osc1, osc2);
}

// 古琴音 - 拨弦模拟
function hmGenGuqin(ctx, master) {
  let pentatonic = [261.63, 293.66, 329.63, 392.00, 440.00]; // C D E G A
  let interval = 1200;
  let noteIdx = 0;

  function pluckString(time) {
    let freq = pentatonic[noteIdx % pentatonic.length];
    noteIdx++;
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.2, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 3);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + 3.5);
    hmActiveSources.push(osc);
    // 泛音
    let osc2 = ctx.createOscillator();
    let gain2 = ctx.createGain();
    osc2.frequency.value = freq * 2;
    osc2.type = 'sine';
    gain2.gain.setValueAtTime(0, time);
    gain2.gain.linearRampToValueAtTime(0.05, time + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, time + 2);
    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(time);
    osc2.stop(time + 2.5);
    hmActiveSources.push(osc2);
  }

  pluckString(ctx.currentTime);
  let guqinInterval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(guqinInterval); return; }
    pluckString(ctx.currentTime);
  }, interval);
  hmActiveNodes.push({ stop: function() { clearInterval(guqinInterval); }, disconnect: function(){} });
}

// 水晶钵/颂钵 - 泛音共振
function hmGenBowl(ctx, master, baseFreq) {
  let freqs = [baseFreq, baseFreq * 1.5, baseFreq * 2, baseFreq * 2.5];
  let gains = [0.15, 0.08, 0.05, 0.03];
  freqs.forEach(function(f, i) {
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    let lfo = ctx.createOscillator();
    let lfoGain = ctx.createGain();
    osc.frequency.value = f;
    osc.type = 'sine';
    lfo.frequency.value = 0.1 + i * 0.05;
    lfoGain.gain.value = 0.02;
    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);
    gain.gain.value = gains[i];
    osc.connect(gain);
    gain.connect(master);
    osc.start();
    lfo.start();
    hmActiveSources.push(osc, lfo);
  });
}

let hmNoiseSeed = 12345;
function hmNoise() {
  hmNoiseSeed = (hmNoiseSeed * 9301 + 49297) % 233280;
  return hmNoiseSeed / 233280;
}

// 雨声白噪音
function hmGenRain(ctx, master) {
  let bufferSize = 4096;
  let noise = ctx.createScriptProcessor(bufferSize, 1, 1);
  noise.onaudioprocess = function(e) {
    let output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (hmNoise() - 0.5) * 0.3;
    }
  };
  let filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 1000;
  filter.Q.value = 0.5;
  noise.connect(filter);
  filter.connect(master);
  hmActiveNodes.push(noise, filter);
}

// 溪流水声
function hmGenStream(ctx, master) {
  let bufferSize = 4096;
  let noise = ctx.createScriptProcessor(bufferSize, 1, 1);
  let lfo = ctx.createOscillator();
  let lfoGain = ctx.createGain();
  let filter = ctx.createBiquadFilter();
  noise.onaudioprocess = function(e) {
    let output = e.outputBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (hmNoise() - 0.5) * 0.25;
    }
  };
  filter.type = 'lowpass';
  filter.frequency.value = 500;
  filter.Q.value = 1;
  lfo.frequency.value = 0.3;
  lfoGain.gain.value = 200;
  lfo.connect(lfoGain);
  lfoGain.connect(filter.frequency);
  noise.connect(filter);
  filter.connect(master);
  lfo.start();
  hmActiveSources.push(lfo);
  hmActiveNodes.push(noise, filter);
}

// 鸟鸣声
function hmGenBirds(ctx, master) {
  let chirpInterval = 1500;

  function playChirp(time) {
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.setValueAtTime(2000, time);
    osc.frequency.exponentialRampToValueAtTime(3500, time + 0.05);
    osc.frequency.exponentialRampToValueAtTime(1800, time + 0.1);
    osc.frequency.exponentialRampToValueAtTime(3000, time + 0.15);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
    osc.connect(gain);
    gain.connect(master);
    osc.start(time);
    osc.stop(time + 0.25);
    hmActiveSources.push(osc);
  }

  playChirp(ctx.currentTime);
  let birdInterval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(birdInterval); return; }
    playChirp(ctx.currentTime);
    // 随机第二次鸣叫
    setTimeout(function() {
      if (hmIsPlaying) playChirp(ctx.currentTime);
    }, 300);
  }, chirpInterval);
  hmActiveNodes.push({ stop: function() { clearInterval(birdInterval); }, disconnect: function(){} });
}

// ============================================================
// 道家旺运养生音色生成函数
// ============================================================

// 紫微旺运罄 — 编磬音 + 低频共振，提升气场
function hmGenDaoWealth(ctx, master) {
  let notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6 — 大调明亮
  let idx = 0;
  function playNote(time) {
    let freq = notes[idx % notes.length];
    // 编磬主音
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.15, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 2.5);
    osc.connect(gain); gain.connect(master);
    osc.start(time); osc.stop(time + 2.8);
    hmActiveSources.push(osc);
    // 低频共振加持
    let sub = ctx.createOscillator();
    let subGain = ctx.createGain();
    sub.frequency.value = freq / 4;
    sub.type = 'sine';
    subGain.gain.setValueAtTime(0, time);
    subGain.gain.linearRampToValueAtTime(0.08, time + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.001, time + 3);
    sub.connect(subGain); subGain.connect(master);
    sub.start(time); sub.stop(time + 3.2);
    hmActiveSources.push(sub);
    idx++;
  }
  playNote(ctx.currentTime);
  let interval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(interval); return; }
    playNote(ctx.currentTime);
  }, 2500);
  hmActiveNodes.push({ stop: function() { clearInterval(interval); }, disconnect: function(){} });
}

// 财神聚气鼓 — 道教堂鼓节奏，低沉有力
function hmGenDaoDrum(ctx, master) {
  let beatPattern = [0, 400, 800, 1200, 1600, 2000, 2400, 3000]; // 鼓点节奏
  let beatIdx = 0;
  function playDrum(time) {
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.setValueAtTime(120, time);
    osc.frequency.exponentialRampToValueAtTime(50, time + 0.15);
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.25, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain); gain.connect(master);
    osc.start(time); osc.stop(time + 0.35);
    hmActiveSources.push(osc);
    // 鼓边泛音
    let edge = ctx.createOscillator();
    let edgeGain = ctx.createGain();
    edge.frequency.value = 800;
    edge.type = 'triangle';
    edgeGain.gain.setValueAtTime(0, time);
    edgeGain.gain.linearRampToValueAtTime(0.03, time + 0.003);
    edgeGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    edge.connect(edgeGain); edgeGain.connect(master);
    edge.start(time); edge.stop(time + 0.1);
    hmActiveSources.push(edge);
  }
  function scheduleBeat() {
    if (!hmIsPlaying) return;
    playDrum(ctx.currentTime);
    beatIdx = (beatIdx + 1) % beatPattern.length;
    setTimeout(scheduleBeat, beatPattern[beatIdx]);
  }
  playDrum(ctx.currentTime);
  setTimeout(scheduleBeat, beatPattern[(beatIdx + 1) % beatPattern.length]);
  hmActiveNodes.push({ stop: function() {}, disconnect: function(){} });
}

// 文昌启智音 — 罄音+清脆高频，启发智慧
function hmGenDaoWenchang(ctx, master) {
  let notes = [783.99, 880.00, 987.77, 1174.66]; // G5 A5 B5 D6 — 高频清亮
  let idx = 0;
  function playNote(time) {
    let freq = notes[idx % notes.length];
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.8);
    osc.connect(gain); gain.connect(master);
    osc.start(time); osc.stop(time + 2);
    hmActiveSources.push(osc);
    // 泛音列
    let harm = ctx.createOscillator();
    let harmGain = ctx.createGain();
    harm.frequency.value = freq * 2;
    harm.type = 'sine';
    harmGain.gain.setValueAtTime(0, time);
    harmGain.gain.linearRampToValueAtTime(0.04, time + 0.02);
    harmGain.gain.exponentialRampToValueAtTime(0.001, time + 1.5);
    harm.connect(harmGain); harmGain.connect(master);
    harm.start(time); harm.stop(time + 1.6);
    hmActiveSources.push(harm);
    idx++;
  }
  playNote(ctx.currentTime);
  let interval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(interval); return; }
    playNote(ctx.currentTime);
  }, 2000);
  hmActiveNodes.push({ stop: function() { clearInterval(interval); }, disconnect: function(){} });
}

// 太岁镇宅音 — 低频方波 + 罄音，沉稳守护
function hmGenDaoTaishui(ctx, master) {
  // 持续低频底音
  let drone = ctx.createOscillator();
  let droneGain = ctx.createGain();
  drone.frequency.value = 65.41; // C2 极低频
  drone.type = 'triangle';
  droneGain.gain.setValueAtTime(0, ctx.currentTime);
  droneGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.5);
  drone.connect(droneGain); droneGain.connect(master);
  drone.start(); drone.stop(ctx.currentTime + 300);
  hmActiveSources.push(drone);
  // 周期性罄音
  function playChime(time) {
    let freq = 261.63; // C4
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 3);
    osc.connect(gain); gain.connect(master);
    osc.start(time); osc.stop(time + 3.2);
    hmActiveSources.push(osc);
  }
  playChime(ctx.currentTime);
  let interval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(interval); drone.stop(); return; }
    playChime(ctx.currentTime);
  }, 4000);
  hmActiveNodes.push({ stop: function() { clearInterval(interval); try{drone.stop();}catch(e){} }, disconnect: function(){ try{drone.disconnect();droneGain.disconnect();}catch(e){} } });
}

// 药王养生诀 — 五音疗疾序列，木火土金水循环
function hmGenDaoYaowang(ctx, master) {
  let fiveTones = [
    {freq: 349.23, dur: 2000, name: '角·木·肝'}, // F4
    {freq: 523.25, dur: 2000, name: '徵·火·心'}, // C5
    {freq: 392.00, dur: 2000, name: '宫·土·脾'}, // G4
    {freq: 440.00, dur: 2000, name: '商·金·肺'}, // A4
    {freq: 293.66, dur: 2000, name: '羽·水·肾'}  // D4
  ];
  let idx = 0;
  function playTone(time) {
    let tone = fiveTones[idx % fiveTones.length];
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.value = tone.freq;
    osc.type = 'triangle';
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.1, time + 0.1);
    gain.gain.linearRampToValueAtTime(0.08, time + tone.dur/2/1000);
    gain.gain.exponentialRampToValueAtTime(0.001, time + tone.dur/1000);
    osc.connect(gain); gain.connect(master);
    osc.start(time); osc.stop(time + tone.dur/1000 + 0.1);
    hmActiveSources.push(osc);
    idx++;
  }
  playTone(ctx.currentTime);
  let interval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(interval); return; }
    playTone(ctx.currentTime);
  }, 2200);
  hmActiveNodes.push({ stop: function() { clearInterval(interval); }, disconnect: function(){} });
}

// 八仙逍遥游 — 轻快古琴拨弦 + 鸟鸣点缀
function hmGenDaoBaxian(ctx, master) {
  let melody = [392.00, 440.00, 523.25, 440.00, 392.00, 329.63, 392.00, 523.25]; // G4 A4 C5 A4 G4 E4 G4 C5
  let idx = 0;
  function pluck(time) {
    let freq = melody[idx % melody.length];
    let osc = ctx.createOscillator();
    let gain = ctx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sawtooth';
    let filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2000;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.08, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.8);
    osc.connect(filter); filter.connect(gain); gain.connect(master);
    osc.start(time); osc.stop(time + 0.9);
    hmActiveSources.push(osc);
    idx++;
  }
  pluck(ctx.currentTime);
  let interval = setInterval(function() {
    if (!hmIsPlaying) { clearInterval(interval); return; }
    pluck(ctx.currentTime);
  }, 600);
  hmActiveNodes.push({ stop: function() { clearInterval(interval); }, disconnect: function(){} });
}

// 黄庭内观养神 — 超低频OM音 + 呼吸节奏
function hmGenDaoHuangting(ctx, master) {
  // OM基音
  let om = ctx.createOscillator();
  let omGain = ctx.createGain();
  om.frequency.value = 136.10; // Earth OM 频率
  om.type = 'sine';
  omGain.gain.setValueAtTime(0, ctx.currentTime);
  omGain.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 2);
  om.connect(omGain); omGain.connect(master);
  om.start(); om.stop(ctx.currentTime + 300);
  hmActiveSources.push(om);
  // 呼吸节奏调制（4秒吸 4秒呼）
  let lfo = ctx.createOscillator();
  let lfoGain = ctx.createGain();
  lfo.frequency.value = 0.125; // 8秒一个周期
  lfoGain.gain.value = 0.04;
  lfo.connect(lfoGain); lfoGain.connect(omGain.gain);
  lfo.start(); lfo.stop(ctx.currentTime + 300);
  hmActiveSources.push(lfo);
  // 高频泛音
  let harm = ctx.createOscillator();
  let harmGain = ctx.createGain();
  harm.frequency.value = 272.20; // 倍频
  harm.type = 'sine';
  harmGain.gain.setValueAtTime(0, ctx.currentTime);
  harmGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 3);
  harm.connect(harmGain); harmGain.connect(master);
  harm.start(); harm.stop(ctx.currentTime + 300);
  hmActiveSources.push(harm);
  hmActiveNodes.push({ stop: function() { try{om.stop();lfo.stop();harm.stop();}catch(e){} }, disconnect: function(){ try{om.disconnect();lfo.disconnect();harm.disconnect();}catch(e){} } });
}

function hmTogglePlay() {
  if (hmCurrentIdx < 0) {
    // 自动播放第一首
    let firstTrack = HM_TRACKS.findIndex(function(t){ return t.cat === hmActiveCategory; });
    if (firstTrack >= 0) hmPlayTrack(firstTrack);
    return;
  }
  if (hmIsPlaying) hmPause();
  else hmResume();
}

function hmPause() {
  hmIsPlaying = false;
  hmStopAllNodes();
  hmUpdatePlayBtn();
  hmRenderPlaylist();
  if (hmAudioCtx) hmAudioCtx.suspend();
}

function hmResume() {
  if (!hmCurrentTrack) return;
  hmIsPlaying = true;
  if (!hmEnsureAudioCtx()) return;
  hmGenerateSound(hmCurrentTrack.gen);
  hmStartProgressAnimation();
  hmUpdatePlayBtn();
  hmRenderPlaylist();
}

function hmNext() {
  if (hmCurrentIdx < 0) return;
  let catTracks = HM_TRACKS.filter(function(t){ return t.cat === hmActiveCategory; });
  let currentInCat = catTracks.indexOf(HM_TRACKS[hmCurrentIdx]);
  let nextInCat = (currentInCat + 1) % catTracks.length;
  let nextIdx = HM_TRACKS.indexOf(catTracks[nextInCat]);
  hmPlayTrack(nextIdx);
}

function hmPrev() {
  if (hmCurrentIdx < 0) return;
  let catTracks = HM_TRACKS.filter(function(t){ return t.cat === hmActiveCategory; });
  let currentInCat = catTracks.indexOf(HM_TRACKS[hmCurrentIdx]);
  let prevInCat = (currentInCat - 1 + catTracks.length) % catTracks.length;
  let prevIdx = HM_TRACKS.indexOf(catTracks[prevInCat]);
  hmPlayTrack(prevIdx);
}

function hmToggleLoop() {
  hmIsLoop = !hmIsLoop;
  let btn = document.getElementById('hmLoopBtn');
  if (btn) {
    if (hmIsLoop) {
      btn.style.color = 'var(--gold)';
      btn.style.borderColor = 'var(--gold)';
      btn.style.background = 'rgba(201,168,76,0.08)';
      showToast('循环播放已开启');
    } else {
      btn.style.color = 'var(--paper3)';
      btn.style.borderColor = 'var(--border)';
      btn.style.background = 'transparent';
      showToast('循环播放已关闭');
    }
  }
}

function hmSetVolume(val) {
  hmVolume = val / 100;
  if (hmAudioCtx) {
    hmActiveNodes.forEach(function(node) {
      if (node.gain) node.gain.value = hmVolume;
    });
  }
}

function hmUpdatePlayBtn() {
  let btn = document.getElementById('hmPlayBtn');
  if (btn) btn.textContent = hmIsPlaying ? '⏸' : '▶';
}

function hmUpdateNowPlaying() {
  if (!hmCurrentTrack) return;
  let titleEl = document.getElementById('hmNowPlayingTitle');
  let catEl = document.getElementById('hmNowPlayingCat');
  let iconEl = document.getElementById('hmNowPlayingIcon');
  let cat = HM_CATEGORIES.find(function(c){ return c.key === hmCurrentTrack.cat; });
  if (titleEl) titleEl.textContent = hmCurrentTrack.title;
  if (catEl) catEl.textContent = (cat ? cat.name : '') + ' · ' + hmCurrentTrack.desc;
  if (iconEl) iconEl.textContent = (cat ? cat.icon : '🎵');
}

function hmStartProgressAnimation() {
  if (hmAnimId) cancelAnimationFrame(hmAnimId);
  if (!hmPlayStartTime) hmPlayStartTime = Date.now();
  function update() {
    if (!hmIsPlaying) return;
    let elapsed = (Date.now() - hmPlayStartTime) / 1000;
    if (elapsed >= hmTrackDuration) {
      if (hmIsLoop) {
        hmPlayStartTime = Date.now();
        elapsed = 0;
      } else {
        hmNext();
        return;
      }
    }
    let pct = (elapsed / hmTrackDuration) * 100;
    let fill = document.getElementById('hmProgressFill');
    if (fill) fill.style.width = pct + '%';
    let curEl = document.getElementById('hmCurrentTime');
    if (curEl) curEl.textContent = hmFormatTime(elapsed);
    let totEl = document.getElementById('hmTotalTime');
    if (totEl) totEl.textContent = hmFormatTime(hmTrackDuration);
    hmAnimId = requestAnimationFrame(update);
  }
  hmAnimId = requestAnimationFrame(update);
}

function hmFormatTime(sec) {
  let m = Math.floor(sec / 60);
  let s = Math.floor(sec % 60);
  return m + ':' + (s < 10 ? '0' : '') + s;
}

function hmMerit(idx) {
  let track = HM_TRACKS[idx];
  if (!track) return;
  let faith = 'fo';
  if (track.cat === 'dao') faith = 'dao';
  else if (track.cat === 'yangsheng' || track.cat === 'jingxin') faith = 'all';
  addMerit(faith, 1, '闻乐净心：' + track.title);
  showToast('🎵 闻乐功德 +1 · ' + track.title);
}

// 初始化音乐播放器
if (document.readyState === 'complete') {
  setTimeout(hmInit, 300);
} else {
  window.addEventListener('load', function() { setTimeout(hmInit, 300); });
}

// ============================================================
// 🌿 养生百科知识库
// ============================================================

function tzRenderEncyclopedia() {
  let container = document.getElementById('tzEncyclopediaContainer');
  if (!container) return;
  let html = '';

  // 四季养生
  html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="cursor:pointer">🌸 四季养生 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body collapsed" style="padding:12px 0">';
  TZ_ENCYCLOPEDIA.seasons.forEach(function(s) {
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">';
    html += '<div style="font-size:14px;color:var(--gold);font-weight:600;margin-bottom:6px">'+s.icon+' '+s.title+'</div>';
    html += '<div style="font-size:12px;color:var(--paper3);line-height:1.7;margin-bottom:8px">'+s.summary+'</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;opacity:.8;padding:8px;background:rgba(0,0,0,0.15);border-radius:6px">'+s.details.replace(/\n/g, '<br>')+'</div>';
    html += '</div>';
  });
  html += '</div>';

  // 十二时辰养生
  html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="cursor:pointer">🕐 十二时辰养生 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body collapsed" style="padding:12px 0">';
  TZ_ENCYCLOPEDIA.shichen.forEach(function(s) {
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">';
    html += '<div style="font-size:14px;color:var(--gold);font-weight:600;margin-bottom:6px">'+s.icon+' '+s.time+' · '+s.organ+'</div>';
    html += '<div style="font-size:12px;color:var(--paper3);line-height:1.7;margin-bottom:8px">'+s.summary+'</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;opacity:.8;padding:8px;background:rgba(0,0,0,0.15);border-radius:6px">'+s.details+'</div>';
    html += '</div>';
  });
  html += '</div>';

  // 二十四节气养生
  html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="cursor:pointer">🌿 二十四节气养生 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body collapsed" style="padding:12px 0">';
  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px">';
  TZ_ENCYCLOPEDIA.jieqi.forEach(function(j) {
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:8px;padding:10px">';
    html += '<div style="font-size:13px;color:var(--gold);font-weight:600;margin-bottom:4px">'+j.name+'</div>';
    html += '<div style="font-size:11px;color:var(--paper3);margin-bottom:6px">重点：'+j.focus+'</div>';
    html += '<div style="font-size:11px;color:var(--paper2);line-height:1.6;opacity:.7">'+j.detail+'</div>';
    html += '</div>';
  });
  html += '</div></div>';

  // 导引功法
  html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="cursor:pointer">🧘 导引功法 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body collapsed" style="padding:12px 0">';
  TZ_ENCYCLOPEDIA.gongfa.forEach(function(g) {
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">';
    html += '<div style="font-size:14px;color:var(--gold);font-weight:600;margin-bottom:6px">'+g.icon+' '+g.name+'</div>';
    html += '<div style="font-size:12px;color:var(--paper3);line-height:1.7;margin-bottom:8px">'+g.summary+'</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;opacity:.8;padding:8px;background:rgba(0,0,0,0.15);border-radius:6px">'+g.details+'</div>';
    html += '</div>';
  });
  html += '</div>';

  // 饮食养生
  html += '<div class="bazi-module-title collapsed" onclick="toggleBaziModule(this)" style="cursor:pointer">🍵 饮食养生 <span class="toggle-icon">▼</span></div>';
  html += '<div class="bazi-module-body collapsed" style="padding:12px 0">';
  TZ_ENCYCLOPEDIA.diet.forEach(function(d) {
    html += '<div style="background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:10px">';
    html += '<div style="font-size:14px;color:var(--gold);font-weight:600;margin-bottom:6px">'+d.icon+' '+d.name+'</div>';
    html += '<div style="font-size:12px;color:var(--paper3);line-height:1.7;margin-bottom:8px">'+d.summary+'</div>';
    html += '<div style="font-size:12px;color:var(--paper2);line-height:1.8;opacity:.8;padding:8px;background:rgba(0,0,0,0.15);border-radius:6px">'+d.details.replace(/\n/g, '<br>')+'</div>';
    html += '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

// 在 tzSwitchTab 中触发百科渲染
let _origTzSwitchTab = tzSwitchTab;
tzSwitchTab = function(name) {
  _origTzSwitchTab(name);
  if (name === 'encyclopedia') tzRenderEncyclopedia();
};


// === URL Hash自动跳转 ===
(function(){
  var hash = window.location.hash;
  if(hash){
    var secId = hash.replace('#',''); // section-bazi
    var sec = document.getElementById(secId);
    if(sec){
      // 提取section名
      var secName = secId.replace('section-','');
      if(typeof showSection === 'function'){
        setTimeout(function(){ showSection(secName); }, 100);
      }
    }
  }
  // 检查URL参数中的sub
  var params = new URLSearchParams(window.location.search);
  var sub = params.get('sub');
  if(sub && typeof showZhanbuSub === 'function'){
    setTimeout(function(){ showZhanbuSub(sub); }, 200);
  }
})();
